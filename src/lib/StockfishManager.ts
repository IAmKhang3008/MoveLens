/**
 * StockfishManager - Handles Web Worker lifecycle, UCI commands,
 * thread configuration, and evaluations for MoveLens.
 */

export interface StockfishEvaluation {
  depth: number;
  scoreType: 'cp' | 'mate';
  scoreValue: number; // score from active player's perspective
  scoreText: string;  // formatted as "+1.25", "-0.40", or "M4"
  nps: number;        // nodes per second
  pv: string;         // principal variation (best move sequence)
  bestMove: string;   // the best move found
  multipv?: number;   // multipv index (1, 2, 3...)
}

export type EngineType = 'lite-single' | 'lite-multi' | 'large-multi' | 'large-single' | 'asm';

type AnalysisTask = {
  fen: string;
  depth: number;
  multipv?: number;
  onProgress?: (data: StockfishEvaluation) => void;
  resolve: (res: StockfishEvaluation) => void;
  reject: (err: Error) => void;
};

export class StockfishManager {
  private worker: Worker | null = null;
  private engineType: EngineType;
  private isInitialized: boolean = false;
  private isSearching: boolean = false;
  private isReady: boolean = false;
  private threads: number = 1;
  private hashSize: number = 16; // MB
  private pendingQueue: string[] = [];
  
  // Advanced queue & cache
  private analysisQueue: AnalysisTask[] = [];
  private currentTask: AnalysisTask | null = null;
  private evalCache: Map<string, StockfishEvaluation> = new Map();
  private maxCacheSize: number = 200;
  private lastEval: StockfishEvaluation | null = null;
  private fallbackTimeout: any = null;

  private onReadyCallback: (() => void) | null = null;
  private onEvaluationCallback: ((evalData: StockfishEvaluation) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(
    engineType: EngineType = 'lite-single',
    threads: number = 1,
    hashSize: number = 16
  ) {
    this.engineType = engineType;
    this.threads = threads;
    this.hashSize = hashSize;
  }

  /**
   * Returns the relative public path to the JS worker script
   */
  private getWorkerPath(): string {
    switch (this.engineType) {
      case 'lite-multi':
        return '/engines/stockfish-18-lite.js';
      case 'large-multi':
        return '/engines/stockfish-18.js';
      case 'large-single':
        return '/engines/stockfish-18-single.js';
      case 'asm':
        return '/engines/stockfish-18-asm.js';
      case 'lite-single':
      default:
        return '/engines/stockfish-18-lite-single.js';
    }
  }

  /**
   * Automatically attempts fallbacks if an engine fails or environment is restricted
   */
  private handleFallback(errorMsg: string) {
    console.warn(`[StockfishManager] Engine ${this.engineType} failed: ${errorMsg}. Trying fallback...`);
    
    // Save current task and queue
    const savedCurrentTask = this.currentTask;
    const savedQueue = [...this.analysisQueue];

    // Detach to prevent terminate() from rejecting them
    this.currentTask = null;
    this.analysisQueue = [];

    // Terminate failed worker first
    this.terminate();

    if (this.engineType === 'large-multi') {
      this.engineType = 'large-single';
      this.threads = 1;
    } else if (this.engineType === 'lite-multi') {
      this.engineType = 'lite-single';
      this.threads = 1;
    } else if (this.engineType === 'large-single') {
      this.engineType = 'lite-single';
    } else if (this.engineType === 'lite-single') {
      this.engineType = 'asm';
    } else {
      console.error('[StockfishManager] All engine options and fallbacks failed.');
      // Reject everything now that we ran out of options
      if (savedCurrentTask) {
        savedCurrentTask.reject(new Error(`All engine fallbacks failed: ${errorMsg}`));
      }
      for (const task of savedQueue) {
        task.reject(new Error(`All engine fallbacks failed: ${errorMsg}`));
      }
      this.onErrorCallback?.(`Stockfish failed to load: ${errorMsg}. Please try opening the application in a new tab.`);
      return;
    }

    // Initialize the fallback engine
    this.init(() => {
      console.log(`[StockfishManager] Fallback to ${this.engineType} successful!`);
      // Restore currentTask if it existed by prepending it to the restored queue
      if (savedCurrentTask) {
        this.analysisQueue.unshift(savedCurrentTask);
      }
      // Trigger the original onReady if registered
      this.onReadyCallback?.();
      // Restart processing
      this.processQueue();
    }, this.onErrorCallback || undefined);

    // Keep the remaining queue for safe keeping while the new engine is initializing
    this.analysisQueue = savedQueue;
  }

  /**
   * Initializes the Stockfish worker and sends startup UCI setup commands
   */
  public init(onReady: () => void, onError?: (err: string) => void) {
    this.onReadyCallback = onReady;
    if (onError) this.onErrorCallback = onError;

    this.terminate(); // Kill any existing worker first

    // Pre-emptive environment checks:
    // If SharedArrayBuffer is not defined, we CANNOT run multi-threaded engines.
    if (typeof SharedArrayBuffer === 'undefined') {
      if (this.engineType === 'lite-multi') {
        console.warn('[StockfishManager] SharedArrayBuffer not supported in this context. Fallback to lite-single.');
        this.engineType = 'lite-single';
        this.threads = 1;
      } else if (this.engineType === 'large-multi') {
        console.warn('[StockfishManager] SharedArrayBuffer not supported in this context. Fallback to large-single.');
        this.engineType = 'large-single';
        this.threads = 1;
      }
    }

    try {
      const workerUrl = this.getWorkerPath() + '?v=18.0.10';
      console.log(`[StockfishManager] Initializing ${this.engineType} engine from ${workerUrl}`);
      
      // Instantiate worker
      this.worker = new Worker(workerUrl);

      // Listen to worker messages
      this.worker.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.worker.onmessageerror = (event: MessageEvent) => {
        console.error('[StockfishManager] Worker message error event:', event);
        this.handleFallback('Worker message serialization/deserialization error');
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('[StockfishManager] Worker error event:', error);
        this.handleFallback(error?.message || 'Worker error event received');
      };

      // Send startup sequence - wait for uciok to send isready
      this.send('uci');

    } catch (err: any) {
      console.error('[StockfishManager] Exception during init:', err);
      this.handleFallback(err?.message || 'Exception during worker instantiation');
    }
  }

  /**
   * Registers a callback for real-time calculation updates
   */
  public onEvaluation(callback: (evalData: StockfishEvaluation) => void) {
    this.onEvaluationCallback = callback;
  }

  /**
   * Sends options and configuration commands
   */
  private setupEngineOptions() {
    // Standard UCI options
    if (this.engineType !== 'lite-single' && this.engineType !== 'large-single' && this.engineType !== 'asm') {
      // Configure threads for multi-threaded versions
      console.log(`[StockfishManager] Setting Threads to ${this.threads}`);
      this.send(`setoption name Threads value ${this.threads}`);
    }
    
    // Hash size configuration (important for deep search caches)
    if (this.engineType !== 'asm') {
      console.log(`[StockfishManager] Setting Hash to ${this.hashSize} MB`);
      this.send(`setoption name Hash value ${this.hashSize}`);
    }
    
    // Now check if engine is ready
    this.send('isready');
  }

  /**
   * Advanced: Promise-based evaluation with queue and cache.
   * Ensures only one evaluation runs at a time and prevents state corruption.
   */
  public evaluate(
    fen: string,
    depth: number,
    onProgress?: (data: StockfishEvaluation) => void,
    multipv?: number
  ): Promise<StockfishEvaluation> {
    const cacheKey = `${fen}|${depth}|${multipv || 1}`;
    const cached = this.evalCache.get(cacheKey);
    
    if (cached) {
      if (onProgress) onProgress(cached);
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      this.analysisQueue.push({
        fen,
        depth,
        multipv,
        onProgress,
        resolve,
        reject
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.currentTask || this.analysisQueue.length === 0 || !this.isReady) {
      return;
    }

    this.currentTask = this.analysisQueue.shift()!;
    this.isSearching = true;
    this.lastEval = null;

    // Failsafe timeout
    if (this.fallbackTimeout) clearTimeout(this.fallbackTimeout);
    this.fallbackTimeout = setTimeout(() => {
      if (this.currentTask && this.isSearching) {
        console.warn(`Stockfish timeout at depth ${this.currentTask.depth}`);
        // Send stop so engine gracefully outputs bestmove and finishes
        this.send('stop');
        
        // Setup a secondary hard timeout in case engine is completely locked up
        setTimeout(() => {
          if (this.currentTask) {
             const err = new Error("Engine locked up");
             this.currentTask.reject(err);
             this.finishCurrentTask(undefined, '', true);
          }
        }, 2000);
      }
    }, 15000); // 15s max per move

    // Note: Do NOT send ucinewgame here, it drops the transposition table
    if (this.currentTask.multipv) {
      this.send(`setoption name MultiPV value ${this.currentTask.multipv}`);
    } else {
      this.send(`setoption name MultiPV value 1`);
    }
    this.send(`position fen ${this.currentTask.fen}`);
    this.send(`go depth ${this.currentTask.depth}`);
  }

  /**
   * Finishes the current analysis task and moves to the next
   */
  private finishCurrentTask(finalEval?: StockfishEvaluation, bestMoveFromLine: string = '', isLockup: boolean = false) {
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }

    if (this.currentTask) {
      if (!isLockup) {
        // Determine the best evaluation to resolve
        let resolvedEval = finalEval || this.lastEval;
        if (!resolvedEval) {
          // Fallback to a safe default if no engine output occurred (e.g. checkmate, draw, or sudden stop)
          resolvedEval = {
            depth: this.currentTask.depth,
            scoreType: 'cp',
            scoreValue: 0,
            scoreText: '0.00',
            nps: 0,
            pv: '',
            bestMove: bestMoveFromLine || '(none)',
            multipv: this.currentTask.multipv
          };
        } else if (bestMoveFromLine && !resolvedEval.bestMove) {
          resolvedEval = { ...resolvedEval, bestMove: bestMoveFromLine };
        }

        // Cache the result with the correct key that includes multipv
        const cacheKey = `${this.currentTask.fen}|${this.currentTask.depth}|${this.currentTask.multipv || 1}`;
        if (this.evalCache.size >= this.maxCacheSize) {
          const firstKey = this.evalCache.keys().next().value;
          if (firstKey) this.evalCache.delete(firstKey);
        }
        this.evalCache.set(cacheKey, resolvedEval);
        
        this.currentTask.resolve(resolvedEval);
      }
    }
    this.currentTask = null;
    this.isSearching = false;
    this.processQueue();
  }

  /**
   * Stops active engine analysis calculations
   */
  public stop() {
    if (this.worker) {
      if (this.isReady) {
        if (this.isSearching) {
          this.send('stop');
          this.isSearching = false;
        }
      } else {
        // If not ready, clear any queued search commands
        this.pendingQueue = this.pendingQueue.filter(cmd => !cmd.startsWith('go'));
      }
    }
  }

  /**
   * Completely terminates the worker to free memory
   */
  public terminate() {
    if (this.worker) {
      console.log('[StockfishManager] Terminating worker instance.');
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
    this.isSearching = false;
    this.isReady = false;
    this.pendingQueue = [];
    
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    if (this.currentTask) {
      this.currentTask.reject(new Error("Worker terminated"));
      this.currentTask = null;
    }
    for (const task of this.analysisQueue) {
      task.reject(new Error("Worker terminated"));
    }
    this.analysisQueue = [];
  }

  /**
   * Expose public method to send raw UCI commands to the engine
   */
  public sendCommand(command: string) {
    this.send(command);
  }

  /**
   * Helper to write raw lines to the Stockfish Web Worker
   */
  private send(command: string) {
    if (!this.worker) return;

    // uci and isready must always go through to start initialization
    if (command === 'uci' || command === 'isready') {
      this.worker.postMessage(command);
      return;
    }

    if (!this.isReady) {
      // If we are queuing a new game/position, clear out any stale queued evaluations to avoid duplicate work
      if (command === 'ucinewgame') {
        this.pendingQueue = this.pendingQueue.filter(
          cmd => !cmd.startsWith('ucinewgame') && !cmd.startsWith('position') && !cmd.startsWith('go')
        );
      }
      console.log(`[StockfishManager] Engine not ready. Queuing command: ${command}`);
      this.pendingQueue.push(command);
    } else {
      this.worker.postMessage(command);
    }
  }

  /**
   * Flushes any queued commands after the engine signals it is ready
   */
  private flushQueue() {
    console.log(`[StockfishManager] Flushing ${this.pendingQueue.length} queued commands...`);
    while (this.pendingQueue.length > 0) {
      const cmd = this.pendingQueue.shift();
      if (cmd && this.worker) {
        this.worker.postMessage(cmd);
      }
    }
  }

  /**
   * Internal parser for raw UCI stdout lines emitted by Stockfish
   */
  private handleMessage(line: string) {
    if (typeof line !== 'string') return;

    // Log lines to help with debugging engine state
    if (line.includes('readyok') || line.includes('uciok') || line.startsWith('bestmove')) {
      console.log(`[Stockfish stdout]: ${line}`);
    }

    if (line === 'uciok') {
      this.isInitialized = true;
      this.setupEngineOptions();
    }

    if (line === 'readyok') {
      this.isReady = true;
      this.flushQueue();
      this.onReadyCallback?.();
      this.processQueue();
    }

    // Parse 'info' line (progress score, depth, pv)
    if (line.startsWith('info') && !line.includes('string')) {
      const depthMatch = line.match(/\bdepth (\d+)\b/);
      const cpMatch = line.match(/\bscore cp (-?\d+)\b/);
      const mateMatch = line.match(/\bscore mate (-?\d+)\b/);
      const npsMatch = line.match(/\bnps (\d+)\b/);
      const pvMatch = line.match(/\bpv (.+)\b/);
      const multipvMatch = line.match(/\bmultipv (\d+)\b/);

      if (depthMatch) {
        const depth = parseInt(depthMatch[1], 10);
        let scoreType: 'cp' | 'mate' = 'cp';
        let scoreValue = 0;
        let scoreText = '0.00';

        if (cpMatch) {
          scoreValue = parseInt(cpMatch[1], 10);
          scoreType = 'cp';
          const formattedScore = (scoreValue / 100).toFixed(2);
          scoreText = scoreValue >= 0 ? `+${formattedScore}` : formattedScore;
        } else if (mateMatch) {
          scoreValue = parseInt(mateMatch[1], 10);
          scoreType = 'mate';
          const mateValue = parseInt(mateMatch[1], 10);
          scoreText = `M${Math.abs(mateValue)}`;
        }

        const nps = npsMatch ? parseInt(npsMatch[1], 10) : 0;
        const pv = pvMatch ? pvMatch[1] : '';
        const bestMove = pv.split(' ')[0] || '';
        const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : undefined;

        const evalResult: StockfishEvaluation = {
          depth,
          scoreType,
          scoreValue,
          scoreText,
          nps,
          pv,
          bestMove,
          multipv
        };

        this.lastEval = evalResult;

        if (this.currentTask && this.currentTask.onProgress) {
          this.currentTask.onProgress(evalResult);
        }

        if (this.onEvaluationCallback) {
          this.onEvaluationCallback(evalResult);
        }
      }
    }

    // Parse bestmove line
    if (line.startsWith('bestmove')) {
      this.isSearching = false;
      
      const parts = line.trim().split(' ');
      const bestMove = parts[1] || '';

      if (this.currentTask) {
        if (this.lastEval) {
          // If we had an info evaluation, add the actual bestMove string from engine
          this.finishCurrentTask({ ...this.lastEval, bestMove }, bestMove);
        } else {
          this.finishCurrentTask(undefined, bestMove);
        }
      }
    }
  }

  // Getters for status
  public getEngineType(): EngineType { return this.engineType; }
  public getThreads(): number { return this.threads; }
  public getHashSize(): number { return this.hashSize; }
}

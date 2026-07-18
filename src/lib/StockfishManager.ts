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

export type EngineType = 'lite-single' | 'lite-multi' | 'large-multi';

export class StockfishManager {
  private worker: Worker | null = null;
  private engineType: EngineType;
  private isInitialized: boolean = false;
  private isSearching: boolean = false;
  private isReady: boolean = false;
  private threads: number = 1;
  private hashSize: number = 16; // MB
  private pendingQueue: string[] = [];

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
        return '/engines/stockfish-18-lite-multi.js';
      case 'large-multi':
        return '/engines/stockfish-18-multi.js';
      case 'lite-single':
      default:
        return '/engines/stockfish-18-lite-single.js';
    }
  }

  /**
   * Initializes the Stockfish worker and sends startup UCI setup commands
   */
  public init(onReady: () => void, onError?: (err: string) => void) {
    this.onReadyCallback = onReady;
    if (onError) this.onErrorCallback = onError;

    this.terminate(); // Kill any existing worker first

    try {
      const workerUrl = this.getWorkerPath();
      console.log(`[StockfishManager] Initializing ${this.engineType} engine from ${workerUrl}`);
      
      // Instantiate worker
      this.worker = new Worker(workerUrl);

      // Listen to worker messages
      this.worker.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('[StockfishManager] Worker error:', error);
        this.onErrorCallback?.(`Worker failed to load or crashed. If using a multi-threaded engine, ensure SharedArrayBuffer headers are enabled on the server.`);
      };

      // Send startup sequence
      this.send('uci');
      this.send('isready');

    } catch (err: any) {
      console.error('[StockfishManager] Exception during init:', err);
      this.onErrorCallback?.(err?.message || 'Failed to instantiate Stockfish worker.');
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
    if (this.engineType !== 'lite-single') {
      // Configure threads for multi-threaded versions
      console.log(`[StockfishManager] Setting Threads to ${this.threads}`);
      this.send(`setoption name Threads value ${this.threads}`);
    }
    
    // Hash size configuration (important for deep search caches)
    console.log(`[StockfishManager] Setting Hash to ${this.hashSize} MB`);
    this.send(`setoption name Hash value ${this.hashSize}`);
  }

  /**
   * Starts analyzing a board position represented by a FEN string
   */
  public evaluatePosition(fen: string, depth: number) {
    if (!this.worker) {
      console.warn('[StockfishManager] Attempted to evaluate position but worker is not initialized.');
      return;
    }

    this.isSearching = true;

    // Reset UCI game state and configure position
    this.send('ucinewgame');
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
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

        if (this.onEvaluationCallback) {
          this.onEvaluationCallback({
            depth,
            scoreType,
            scoreValue,
            scoreText,
            nps,
            pv,
            bestMove,
            multipv
          });
        }
      }
    }

    // Parse bestmove line
    if (line.startsWith('bestmove')) {
      this.isSearching = false;
    }
  }

  // Getters for status
  public getEngineType(): EngineType { return this.engineType; }
  public getThreads(): number { return this.threads; }
  public getHashSize(): number { return this.hashSize; }
}

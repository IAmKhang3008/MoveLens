import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Code, Settings, Cpu, Layers, HelpCircle, 
  CheckCircle2, Copy, Check, ChevronRight, BookOpen, 
  Terminal, Sparkles, AlertCircle, ArrowDown, ArrowRight,
  Play, Download, ExternalLink, RefreshCw
} from 'lucide-react';

export default function GuideView() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'ai-play'>('analysis');

  // Checklist State for Game Analysis tab
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Install chess.js (npm install chess.js or CDN)', done: true },
    { id: 2, text: 'Set up Stockfish Web Worker (configure headers)', done: true },
    { id: 3, text: 'Write PGN parsing function using chess.js history', done: false },
    { id: 4, text: 'Implement move-by-move asynchronous analysis loop', done: false },
    { id: 5, text: 'Parse Stockfish output for score cp and pv best line', done: false },
    { id: 6, text: 'Add progress indicator for long games (NPS speed count)', done: false },
    { id: 7, text: 'Classify moves based on score differences (blunder vs great)', done: false },
    { id: 8, text: 'Display results in a responsive, modern board and chart UI', done: false },
  ]);

  // Checklist State for AI Play tab
  const [aiChecklist, setAiChecklist] = useState([
    { id: 1, text: 'Download stockfish-18-lite-single.js and .wasm files', done: true },
    { id: 2, text: 'Place both files in the public/ folder of your project', done: true },
    { id: 3, text: 'Create useStockfish custom Hook for engine lifecycle', done: false },
    { id: 4, text: 'Instantiate Web Worker pointing to public path', done: false },
    { id: 5, text: 'Handle onmessage parser for readyok and bestmove', done: false },
    { id: 6, text: 'Configure game state loop with Chessboard onPieceDrop', done: false },
    { id: 7, text: 'Disable board interaction during AI calculation', done: false },
    { id: 8, text: 'Handle pawn promotion dialog inside the player turn', done: false },
  ]);

  // Copy states for code snippets
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const toggleAiChecklist = (id: number) => {
    setAiChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const codeSnippet1 = `// Assuming you already have a Stockfish Web Worker instance: worker

// 1. Set the position you want to analyze
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
worker.postMessage(\`position fen \${fen}\`);

// 2. Tell the engine to start analyzing (e.g., search depth 15)
worker.postMessage('go depth 15');

// 3. Listen for the analysis result
worker.onmessage = function(event) {
    console.log('Stockfish analysis result:', event.data);
    // Output will contain best move (bestmove) and position score (score cp)
};`;

  const codeSnippet2 = `// Import chess.js (via CDN or npm)
// const { Chess } = require('chess.js');

// Assuming 'worker' is your Stockfish Web Worker instance
function analyzePGN(pgnString, depth = 15) {
    const chess = new Chess();
    // 1. Load the PGN
    chess.loadPgn(pgnString);
    const moves = chess.history({ verbose: true });

    const analysisResults = [];

    // 2. Start from the initial position
    chess.reset();
    // Analyze the starting position
    analyzeCurrentPosition(chess.fen(), depth, (result) => {
        analysisResults.push({ fen: chess.fen(), ...result });
        processNextMove(0);
    });

    function processNextMove(index) {
        if (index >= moves.length) {
            console.log('All moves analyzed!', analysisResults);
            return;
        }

        // 3. Make one move
        chess.move(moves[index]);
        const currentFen = chess.fen();

        // 4. Analyze this new position
        analyzeCurrentPosition(currentFen, depth, (result) => {
            analysisResults.push({ 
                move: moves[index], 
                fen: currentFen, 
                ...result 
            });
            // Continue to the next move
            processNextMove(index + 1);
        });
    }

    function analyzeCurrentPosition(fen, depth, callback) {
        // Send the FEN to Stockfish
        worker.postMessage(\`position fen \${fen}\`);
        worker.postMessage(\`go depth \${depth}\`);

        // Listen for a single response
        const handler = (event) => {
            const data = event.data;
            // Parse Stockfish output: extract score (cp) and best line (pv)
            const scoreMatch = data.match(/score cp (-?\\d+)/);
            const pvMatch = data.match(/pv (.+)$/);
            if (scoreMatch) {
                const score = parseInt(scoreMatch[1]);
                const pv = pvMatch ? pvMatch[1] : null;
                // Remove listener to avoid interfering with next analysis
                worker.removeEventListener('message', handler);
                callback({ score, pv });
            }
        };
        worker.addEventListener('message', handler);
    }
}`;

  const codeSnippet3 = `function classifyMove(scoreBefore, scoreAfter, sideToMove) {
    const loss = Math.abs(scoreBefore - scoreAfter);
    if (loss > 300) return 'Blunder';
    if (loss > 150) return 'Mistake';
    if (loss > 50) return 'Inaccuracy';
    return 'Good';
}`;

  const codeSnippetHook = `// src/hooks/useStockfish.js
import { useEffect, useRef, useState } from 'react';

export const useStockfish = () => {
  const workerRef = useRef(null); // Stores the Web Worker instance
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);

  useEffect(() => {
    // 1. Create a Web Worker instance pointing to stockfish.js
    workerRef.current = new Worker('/engines/stockfish-18-lite-single.js?v=18.0.8');

    // 2. Listen for messages from the Worker
    workerRef.current.onmessage = (event) => {
      const message = event.data;
      console.log('Stockfish says:', message);

      // When engine reports "readyok", it's ready to go
      if (message === 'readyok') {
        setIsEngineReady(true);
      }

      // When output contains "bestmove", extract the best move
      if (message.includes('bestmove')) {
        const move = message.split(' ')[1]; // e.g., "bestmove e2e4" -> "e2e4"
        setBestMove(move);
      }
    };

    // 3. After initialization, send UCI and isready commands
    workerRef.current.postMessage('uci');
    workerRef.current.postMessage('isready');

    // 4. Clean up: terminate the worker when component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Function to send commands to the engine
  const sendCommand = (command) => {
    if (workerRef.current) {
      workerRef.current.postMessage(command);
    }
  };

  // Send a FEN position to the engine and tell it to start thinking
  const analyzePosition = (fen, depth = 15) => {
    if (!isEngineReady) {
      console.warn('Engine is not ready yet.');
      return;
    }
    // Reset best move state
    setBestMove(null);
    // Send position and go commands
    sendCommand(\`position fen \${fen}\`);
    sendCommand(\`go depth \${depth}\`);
  };

  return { isEngineReady, bestMove, analyzePosition, sendCommand };
};`;

  const codeSnippetGame = `// src/components/ChessGame.jsx
import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useStockfish } from '../hooks/useStockfish';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const { isEngineReady, bestMove, analyzePosition } = useStockfish();

  // Listen for bestMove changes - executes the engine's move automatically
  useEffect(() => {
    if (bestMove && !isPlayerTurn) {
      // 1. Try to make the engine's move on a copy of the game
      const gameCopy = { ...game };
      const move = gameCopy.move(bestMove, { sloppy: true });
      
      if (move) {
        // 2. Update game state and switch back to player's turn
        setGame(gameCopy);
        setIsPlayerTurn(true);
      } else {
        console.warn('Engine made an illegal move?', bestMove);
        setIsPlayerTurn(true); // Prevent deadlock
      }
    }
  }, [bestMove, game, isPlayerTurn]);

  // Function triggered when the player drops a piece
  function onDrop(sourceSquare, targetSquare) {
    // Reject interaction if it's not the player's turn or game is over
    if (!isPlayerTurn || game.isGameOver()) return false;

    const gameCopy = { ...game };
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) return false; // Illegal move

    // Player's move is valid - update state and switch to engine's turn
    setGame(gameCopy);
    setIsPlayerTurn(false);

    // **CRITICAL: Tell the engine to analyze this new position**
    if (isEngineReady) {
      analyzePosition(gameCopy.fen(), 15);
    } else {
      console.warn('Engine not ready, cannot make AI move.');
      setIsPlayerTurn(true);
    }

    return true;
  }

  return (
    <div style={{ width: '400px' }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        arePiecesDraggable={isPlayerTurn} // Disable board interaction during engine's turn
      />
      <p>Status: {isPlayerTurn ? 'Your turn' : 'AI is thinking...'}</p>
    </div>
  );
}`;

  // Calculated checked progress percent for Game Analysis tab
  const completedCount = checklist.filter(i => i.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  // Calculated checked progress percent for AI Play tab
  const aiCompletedCount = aiChecklist.filter(i => i.done).length;
  const aiProgressPercent = Math.round((aiCompletedCount / aiChecklist.length) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-8 py-8 md:py-16 text-left">
      
      {/* 1. Header Banner */}
      <div className="border-b border-neutral-900 pb-8 mb-8 relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 left-12 w-64 h-24 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-4 shadow-sm">
          <BookOpen className="w-3.5 h-3.5" />
          Technical Integration Guide
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Analyzing Chess with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-green-400">Stockfish.js</span>
        </h2>
        
        <p className="text-neutral-400 mt-4 max-w-3xl text-sm md:text-base leading-relaxed">
          The core mechanics behind modern chess interfaces: breaking down structured PGN games into separate position streams, playing against real-time AI opponents in Web Workers, and mapping centipawn evaluations.
        </p>
      </div>

      {/* 2. Interactive Tab Bar */}
      <div className="flex border-b border-neutral-900 mb-8 gap-6 relative z-10">
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`pb-4 text-sm md:text-base font-bold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'analysis' ? 'text-green-400 font-extrabold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Game Analysis (PGN/FEN)</span>
          {activeTab === 'analysis' && (
            <motion.div 
              layoutId="activeTabUnderline" 
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400" 
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('ai-play')}
          className={`pb-4 text-sm md:text-base font-bold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'ai-play' ? 'text-green-400 font-extrabold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Play Against AI (Integration)</span>
          {activeTab === 'ai-play' && (
            <motion.div 
              layoutId="activeTabUnderline" 
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400" 
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      </div>

      {activeTab === 'analysis' ? (
        /* ==================== TAB 1: GAME ANALYSIS ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Main Core Content */}
          <div className="col-span-1 lg:col-span-8 space-y-12">
            
            {/* Core Concept: FEN vs PGN Card */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-6 md:p-8 shadow-xl">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-blue-400" />
                Core Concepts: FEN vs PGN
              </h3>
              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed mb-6">
                Stockfish uses the **UCI (Universal Chess Interface)** command protocol. It does not natively parse full FEN chains or PGN game listings—it only understands individual static positions and coordinate moves.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1">FEN Notation</span>
                  <h4 className="text-sm font-bold text-white mb-2">Forsyth-Edwards Notation</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-3">
                    Describes a **single board state** at any exact point. Think of it as a spatial snapshot or frame capture.
                  </p>
                  <div className="px-2.5 py-1.5 rounded bg-black/40 border border-neutral-850 text-[10px] font-mono text-neutral-400 truncate">
                    rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
                  </div>
                </div>

                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider block mb-1">PGN Database</span>
                  <h4 className="text-sm font-bold text-white mb-2">Portable Game Notation</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed mb-3">
                    Records an **entire chess match sequence** along with tournament metadata. Think of it as an event stream database.
                  </p>
                  <div className="px-2.5 py-1.5 rounded bg-black/40 border border-neutral-850 text-[10px] font-mono text-neutral-400 truncate">
                    1. e4 e5 2. Nf3 d6 3. d4 Bg4?! 4. dxe5 Bxf3 5. Qxf3...
                  </div>
                </div>
              </div>
            </div>

            {/* METHOD 1 SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                  01
                </div>
                <h3 className="text-xl font-bold text-white">Method 1: Analyze a Single FEN Position</h3>
              </div>
              
              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                If you just want to analyze one specific position, send the position command followed by the analysis start command directly into the worker thread.
              </p>

              {/* Code Snippet Box */}
              <div className="bg-[#141517] border border-neutral-850 rounded-2xl overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4.5 py-3 bg-neutral-950 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[11px] font-mono font-bold text-neutral-400">single_fen_analysis.js</span>
                  </div>
                  <button 
                    onClick={() => handleCopy('snippet1', codeSnippet1)}
                    className="p-1.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-semibold"
                  >
                    {copiedStates['snippet1'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] md:text-xs font-mono text-neutral-300 bg-[#121315]/70 leading-relaxed text-left">
                  <code>{codeSnippet1}</code>
                </pre>
              </div>
            </div>

            {/* METHOD 2 SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center justify-center text-xs">
                  02
                </div>
                <h3 className="text-xl font-bold text-white">Method 2: Analyze a Complete PGN Game (Recommended)</h3>
              </div>

              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                To analyze a full game, utilize <code className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">chess.js</code> to handle legal state generation. The system steps through moves, extracts the intermediate FEN string, requests evaluation, and queues calculations recursively.
              </p>

              {/* Code Snippet Box */}
              <div className="bg-[#141517] border border-neutral-850 rounded-2xl overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4.5 py-3 bg-neutral-950 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[11px] font-mono font-bold text-neutral-400">pgn_analyzer.js</span>
                  </div>
                  <button 
                    onClick={() => handleCopy('snippet2', codeSnippet2)}
                    className="p-1.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-semibold"
                  >
                    {copiedStates['snippet2'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] md:text-xs font-mono text-neutral-300 bg-[#121315]/70 leading-relaxed text-left max-h-[460px] scrollbar-thin">
                  <code>{codeSnippet2}</code>
                </pre>
              </div>
            </div>

            {/* FLOWCHART SECTION */}
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-indigo-400" />
                Game Analysis Data Pipeline
              </h3>
              
              {/* Visual SVG / CSS Flowchart Diagram */}
              <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                
                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">Input Stage</div>
                  <div className="text-xs font-bold text-white">Upload PGN File</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Raw game text moves</p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-neutral-650 hidden md:block" />
                  <ArrowDown className="w-4 h-4 text-neutral-650 md:hidden" />
                </div>

                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">State Machine</div>
                  <div className="text-xs font-bold text-white">chess.js Engine</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Splits game history & FENs</p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-neutral-650 hidden md:block" />
                  <ArrowDown className="w-4 h-4 text-neutral-650 md:hidden" />
                </div>

                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1">Evaluation thread</div>
                  <div className="text-xs font-bold text-white">Stockfish.js WASM</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Computes Centipawn values</p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-neutral-650 hidden md:block" />
                  <ArrowDown className="w-4 h-4 text-neutral-650 md:hidden" />
                </div>

                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Presentation</div>
                  <div className="text-xs font-bold text-white">Visual Review</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Plots score graph & medals</p>
                </div>

              </div>
            </div>

            {/* ADVANCED CLASSIFICATION SECTION */}
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Move Quality Classification
              </h3>
              
              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                To classify moves into qualitative indicators (Blunder, Mistake, Inaccuracy), calculate the centipawn loss by evaluating positions both **before** and **after** a move is made, from the current player's perspective.
              </p>

              <div className="bg-[#141517] border border-neutral-850 rounded-2xl overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4.5 py-3 bg-neutral-950 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[11px] font-mono font-bold text-neutral-400">classification_logic.js</span>
                  </div>
                  <button 
                    onClick={() => handleCopy('snippet3', codeSnippet3)}
                    className="p-1.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-semibold"
                  >
                    {copiedStates['snippet3'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] md:text-xs font-mono text-neutral-300 bg-[#121315]/70 leading-relaxed text-left">
                  <code>{codeSnippet3}</code>
                </pre>
              </div>
            </div>

          </div>

          {/* Right Side: Tips, Expert Advice, Interactive Checklist Card */}
          <div className="col-span-1 lg:col-span-4 space-y-6 text-left">
            
            {/* INTERACTIVE CHECKLIST CARD */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Build Checklist
              </h3>
              <p className="text-[11px] text-neutral-500 mb-4">Click checklist boxes to monitor your build progress live.</p>

              {/* Checklist progress tracker */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold mb-1">
                  <span>Completed Tasks</span>
                  <span className="text-green-400 font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {checklist.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-850/40 text-[11px] font-medium text-neutral-300 transition-colors group cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      item.done 
                        ? 'bg-green-500/20 border-green-500 text-green-400' 
                        : 'border-neutral-700 text-transparent group-hover:border-neutral-500'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={`leading-snug ${item.done ? 'line-through text-neutral-500' : ''}`}>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* EXPERT TIPS ACCORDION/LIST */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Expert-Level Tips
              </h3>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Use Web Workers
                  </h4>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    Never run Stockfish directly on your main UI thread. It will completely freeze browser interaction during lookaheads. Always run inside dedicated background Web Workers.
                  </p>
                </div>

                <div className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    SharedArrayBuffer Headers
                  </h4>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    Multi-threaded engines require secure cross-origin headers to instantiate threads in modern browsers. Configure your host with COOP and COEP headers.
                  </p>
                </div>

                <div className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Performance Tuning
                  </h4>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    Searching to depth 15 is CPU-heavy. Enable depth configuration selectors so mobile or laptop clients can throttle calculations based on their device specs.
                  </p>
                </div>
              </div>
            </div>

            {/* MATURE REFERENCE PLATFORMS */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                Reference Architectures
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">Mature open-source repositories illustrating optimal Stockfish setups:</p>
              
              <div className="space-y-2 text-xs">
                <a 
                  href="https://github.com/anujayghosh/chess-analyzer" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 hover:bg-neutral-900 hover:border-blue-500/20 text-neutral-300 font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    chess-analyzer
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </a>

                <a 
                  href="https://github.com/parthasdey2304/chess-app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 hover:bg-neutral-900 hover:border-blue-500/20 text-neutral-300 font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    chess-app
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </a>

                <a 
                  href="https://github.com/bh679/chess-client/wiki/Board-Analysis" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 hover:bg-neutral-900 hover:border-blue-500/20 text-neutral-300 font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    Board Analysis Wiki
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </a>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ==================== TAB 2: AI PLAY INTEGRATION ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Main Core Content */}
          <div className="col-span-1 lg:col-span-8 space-y-12">
            
            {/* Core Concept: Web Worker introduction */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-green-400" />
                Integrating Stockfish AI Opponent
              </h3>
              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                By compiling Stockfish to WebAssembly, chess websites can run a full Grandmaster-level AI opponent entirely inside the user's browser. To keep the website smooth, the engine must execute on a **background Web Worker thread** so thinking calculations do not freeze the UI.
              </p>
            </div>

            {/* STEP 1: DOWNLOAD AND PLACE FILES */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center justify-center text-xs">
                  01
                </div>
                <h3 className="text-xl font-bold text-white">Step 1: Place Stockfish Files in Public Folder</h3>
              </div>
              
              <div className="p-5 bg-neutral-900/60 border border-neutral-850 rounded-2xl space-y-3">
                <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                  To load Stockfish correctly in modern React applications, locate the lightweight WebAssembly compilation files and save them directly in your project's static folder:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-green-400 font-bold tracking-wider block uppercase">Engine File</span>
                      <span className="text-xs font-mono font-bold text-white">stockfish-18-lite-single.js</span>
                    </div>
                    <Download className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold tracking-wider block uppercase">WASM Component</span>
                      <span className="text-xs font-mono font-bold text-white">stockfish-18-lite-single.wasm</span>
                    </div>
                    <Download className="w-4 h-4 text-neutral-500" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 italic mt-2">
                  Tip: Both files must live in the static <code className="px-1 bg-neutral-950 rounded text-neutral-300">public/</code> directory so they are directly reachable by the browser's background Worker threads.
                </p>
              </div>
            </div>

            {/* STEP 2: useStockfish CUSTOM HOOK */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center justify-center text-xs">
                  02
                </div>
                <h3 className="text-xl font-bold text-white">Step 2: Create the useStockfish Custom Hook</h3>
              </div>

              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                Encapsulate worker initialization, event listeners, cleanups, and UCI command relays in a clean, reusable React Hook.
              </p>

              {/* Code Snippet Box */}
              <div className="bg-[#141517] border border-neutral-850 rounded-2xl overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4.5 py-3 bg-neutral-950 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[11px] font-mono font-bold text-neutral-400">useStockfish.js</span>
                  </div>
                  <button 
                    onClick={() => handleCopy('hookSnippet', codeSnippetHook)}
                    className="p-1.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-semibold"
                  >
                    {copiedStates['hookSnippet'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] md:text-xs font-mono text-neutral-300 bg-[#121315]/70 leading-relaxed text-left max-h-[400px] scrollbar-thin">
                  <code>{codeSnippetHook}</code>
                </pre>
              </div>
            </div>

            {/* STEP 3: INTERACTIVE BOARD SETUP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center justify-center text-xs">
                  03
                </div>
                <h3 className="text-xl font-bold text-white">Step 3: Integrate AI Into Your Chess Component</h3>
              </div>

              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed">
                Wire up the custom Hook inside your main game rendering layout, scheduling moves and managing turn-taking safely.
              </p>

              {/* Code Snippet Box */}
              <div className="bg-[#141517] border border-neutral-850 rounded-2xl overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4.5 py-3 bg-neutral-950 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[11px] font-mono font-bold text-neutral-400">ChessGame.jsx</span>
                  </div>
                  <button 
                    onClick={() => handleCopy('gameSnippet', codeSnippetGame)}
                    className="p-1.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-semibold"
                  >
                    {copiedStates['gameSnippet'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] md:text-xs font-mono text-neutral-300 bg-[#121315]/70 leading-relaxed text-left max-h-[400px] scrollbar-thin">
                  <code>{codeSnippetGame}</code>
                </pre>
              </div>
            </div>

            {/* AI GAMEPLAY LOOP DIAGRAM */}
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                Real-Time AI Gameplay Loop
              </h3>
              
              {/* Visual Flow Diagram */}
              <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                
                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1">Player Action</div>
                  <div className="text-xs font-bold text-white">onDrop() Drag-drop</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Verifies move is legal via chess.js</p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-neutral-650 hidden md:block" />
                  <ArrowDown className="w-4 h-4 text-neutral-650 md:hidden" />
                </div>

                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Worker Handshake</div>
                  <div className="text-xs font-bold text-white">analyzePosition()</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Sends current board FEN to Worker</p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-neutral-650 hidden md:block" />
                  <ArrowDown className="w-4 h-4 text-neutral-650 md:hidden" />
                </div>

                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">AI Thinking</div>
                  <div className="text-xs font-bold text-white">WASM Processing</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Calculates multi-ply deep optimal moves</p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-neutral-650 hidden md:block" />
                  <ArrowDown className="w-4 h-4 text-neutral-650 md:hidden" />
                </div>

                <div className="flex-1 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 text-center">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">UI Update</div>
                  <div className="text-xs font-bold text-white">Execute move</div>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">Hook triggers useEffect to make AI move</p>
                </div>

              </div>
            </div>

          </div>

          {/* Right Side: Interactive Checklist, Troubleshoot and Open Source repositories */}
          <div className="col-span-1 lg:col-span-4 space-y-6 text-left">
            
            {/* INTERACTIVE CHECKLIST CARD */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Integration Checklist
              </h3>
              <p className="text-[11px] text-neutral-500 mb-4">Click checklist boxes to monitor your build progress live.</p>

              {/* Checklist progress tracker */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold mb-1">
                  <span>Completed Tasks</span>
                  <span className="text-green-400 font-mono">{aiProgressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${aiProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {aiChecklist.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleAiChecklist(item.id)}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-850/40 text-[11px] font-medium text-neutral-300 transition-colors group cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      item.done 
                        ? 'bg-green-500/20 border-green-500 text-green-400' 
                        : 'border-neutral-700 text-transparent group-hover:border-neutral-500'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={`leading-snug ${item.done ? 'line-through text-neutral-500' : ''}`}>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TROUBLESHOOTING BOX */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Troubleshooting & Bugs
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl space-y-1">
                  <h4 className="font-bold text-white">Missing file worker crash</h4>
                  <p className="text-neutral-450 leading-relaxed text-[11px]">
                    Make sure both the <code className="px-1 bg-black rounded text-amber-400 font-mono">.js</code> and <code className="px-1 bg-black rounded text-amber-400 font-mono">.wasm</code> files are placed together inside the static public directory, otherwise standard browser headers fail.
                  </p>
                </div>

                <div className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl space-y-1">
                  <h4 className="font-bold text-white">UI Freezes & Lockups</h4>
                  <p className="text-neutral-450 leading-relaxed text-[11px]">
                    Ensure Stockfish is constructed with the <code className="px-1 bg-black rounded text-amber-400 font-mono">new Worker()</code> pattern. Never invoke Stockfish directly on the client event loop.
                  </p>
                </div>

                <div className="p-3 bg-neutral-900/50 border border-neutral-850 rounded-xl space-y-1">
                  <h4 className="font-bold text-white">Stalemate (none) Return</h4>
                  <p className="text-neutral-450 leading-relaxed text-[11px]">
                    In checkmate or stalemate scenarios, the engine returns <code className="px-1 bg-black rounded text-amber-400 font-mono">bestmove (none)</code>. Ensure your chess.js layer checks for game termination prior to requesting calculations.
                  </p>
                </div>
              </div>
            </div>

            {/* OPEN SOURCE AI PROJECTS */}
            <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                Reference AI Implementations
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">Explore complete open-source codebases demonstrating interactive Stockfish gameplay loops:</p>
              
              <div className="space-y-2 text-xs">
                <a 
                  href="https://github.com/parthasdey2304/chess-app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 hover:bg-neutral-900 hover:border-blue-500/20 text-neutral-300 font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    chess-app (React/WASM)
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </a>

                <a 
                  href="https://github.com/siddhantdg/SiChess" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 hover:bg-neutral-900 hover:border-blue-500/20 text-neutral-300 font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    SiChess (Pro Interface)
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </a>

                <a 
                  href="https://github.com/Andu-alem/react-chess-app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 hover:bg-neutral-900 hover:border-blue-500/20 text-neutral-300 font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    react-chess-app (Hook based)
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}


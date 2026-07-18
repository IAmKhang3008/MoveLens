import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, ChevronLeft, ChevronRight, SkipForward, 
  Sparkles, FileText, Settings, RefreshCw, Cpu, Activity, Info, X, Zap,
  Globe, Download, Search, Trophy, Award, ChevronDown, Send, Copy
} from 'lucide-react';
import { Chess } from 'chess.js';
import { BoardState, BoardSquare, Ply, AnnotationType, GameSummary, Arrow } from '../types';
import { generatedPlies as initialPlies, gameSummary as initialSummary, getInitialBoardState } from '../data/sampleGame';
import Chessboard from './Chessboard';
import ChessAnnotationIcon from './ChessAnnotationIcon';
import { StockfishManager, StockfishEvaluation, EngineType } from '../lib/StockfishManager';
import { OPENINGS_DATABASE } from '../data/openings';

// Robust utility to sanitize PGN text before parsing with chess.js.
// Since chess.js uses a strict PEG.js parser, unexpected characters inside comments,
// recursive variations, or special single/curly quotes can cause it to crash.
function sanitizePgnText(pgn: string): string {
  // 1. Convert smart/curly quotes to standard quotes
  let cleaned = pgn
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // 2. Strip brace comments {...} completely as they can contain anything
  // including single quotes, special characters, etc., which choke the PEG parser.
  cleaned = cleaned.replace(/\{[^}]*\}/g, ' ');

  // 3. Remove line comments starting with ; to the end of the line
  cleaned = cleaned.replace(/;.*$/gm, '');

  // 4. Remove recursive variations (parentheses) completely as we only analyze the main line
  let withoutVariations = '';
  let depth = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth > 0) depth--;
    } else {
      if (depth === 0) {
        withoutVariations += char;
      }
    }
  }
  cleaned = withoutVariations;

  // 5. Clean up any remaining single quotes outside header values
  // Find where the headers end and the moves begin
  const headerEndIndex = cleaned.lastIndexOf(']');
  if (headerEndIndex !== -1) {
    const headers = cleaned.substring(0, headerEndIndex + 1);
    let moves = cleaned.substring(headerEndIndex + 1);
    
    // In the moves section, replace all single quotes with spaces
    moves = moves.replace(/'/g, ' ');
    
    // Keep only safe characters in the moves section: alphanumerics, dots, spaces, !?+#=-$/*
    moves = moves.replace(/[^a-zA-Z0-9\s.?!+#=\-$/*]/g, ' ');
    
    cleaned = headers + '\n' + moves;
  } else {
    cleaned = cleaned.replace(/'/g, ' ');
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s.?!+#=\-$/*[\]"]/g, ' ');
  }

  // 6. Normalize multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

// Map Lichess flair ID strings to standard Unicode emojis
const LICHESS_FLAIR_MAP: Record<string, string> = {
  // Animals
  'cat': '🐱',
  'dog': '🐶',
  'fox': '🦊',
  'bear': '🐻',
  'panda': '🐼',
  'koala': '🐨',
  'tiger': '🐯',
  'lion': '🦁',
  'cow': '🐮',
  'pig': '🐷',
  'monkey': '🐵',
  'chicken': '🐔',
  'penguin': '🐧',
  'bird': '🐦',
  'duck': '🦆',
  'eagle': '🦅',
  'owl': '🦉',
  'bat': '🦇',
  'wolf': '🐺',
  'bee': '🐝',
  'unicorn': '🦄',
  'rabbit': '🐰',
  'mouse': '🐭',
  'frog': '🐸',
  'dragon': '🐉',
  'turtle': '🐢',
  'snake': '🐍',
  'octopus': '🐙',
  'fish': '🐟',
  'dolphin': '🐬',
  'whale': '🐋',
  'shark': '🦈',
  'butterfly': '🦋',
  'spider': '🕷️',
  'sloth': '🦥',
  'otter': '🦦',
  'llama': '🦙',
  'kangaroo': '🦘',
  'hedgehog': '🦔',
  'hamster': '🐹',

  // Food
  'watermelon': '🍉',
  'apple': '🍎',
  'banana': '🍌',
  'cherry': '🍒',
  'grape': '🍇',
  'strawberry': '🍓',
  'peach': '🍑',
  'pineapple': '🍍',
  'coconut': '🥥',
  'kiwi': '🥝',
  'tomato': '🍅',
  'eggplant': '🍆',
  'avocado': '🥑',
  'broccoli': '🥦',
  'burger': '🍔',
  'pizza': '🍕',
  'fries': '🍟',
  'cookie': '🍪',
  'cake': '🍰',
  'coffee': '☕',
  'beer': '🍺',
  'wine': '🍷',
  'cocktail': '🍹',
  'taco': '🌮',
  'burrito': '🌯',
  'donut': '🍩',
  'popcorn': '🍿',
  'icecream': '🍦',
  'hotdog': '🌭',
  'croissant': '🥐',
  'cheese': '🧀',
  'cookie-bite': '🍪',

  // People & Roles
  'artist': '🧑‍🎨',
  'monocle': '🧐',
  'graduate': '🎓',
  'detective': '🕵️',
  'pilot': '🧑‍✈️',
  'astronaut': '🧑‍🚀',
  'firefighter': '🧑‍🚒',
  'police': '👮',
  'ninja': '🥷',
  'student': '🧑‍🎓',
  'teacher': '🧑‍🏫',
  'scientist': '🧑‍🔬',
  'singer': '🧑‍🎤',
  'superhero': '🦸',
  'supervillain': '🦹',
  'mage': '🧙',
  'fairy': '🧚',
  'vampire': '🧛',
  'zombie': '🧟',
  'genie': '🧞',
  'santa': '🎅',
  'elf': '🧝',
  'clown': '🤡',
  'cowboy': '🤠',

  // Nature / Earth
  'seedling': '🌱',
  'sun': '☀️',
  'moon': '🌙',
  'star': '⭐',
  'cloud': '☁️',
  'rain': '🌧️',
  'snow': '❄️',
  'fire': '🔥',
  'water': '💧',
  'leaf': '🍃',
  'flower': '🌸',
  'tree': '🌲',
  'earth': '🌍',
  'rainbow': '🌈',
  'wave': '🌊',
  'shamrock': '☘️',
  'maple-leaf': '🍁',
  'fallen-leaf': '🍂',
  'mushroom': '🍄',
  'cactus': '🌵',
  'globe': '🌐',
  'rose': '🌹',
  'sunflower': '🌻',
  'maple': '🍁',

  // Activity / Objects
  'trophy': '🏆',
  'medal': '🥇',
  'crown': '👑',
  'game': '🎮',
  'music': '🎵',
  'art': '🎨',
  'book': '📖',
  'camera': '📷',
  'lightbulb': '💡',
  'heart': '❤️',
  'brain': '🧠',
  'guitar': '🎸',
  'drum': '🥁',
  'soccer': '⚽',
  'basketball': '🏀',
  'tennis': '🎾',
  'golf': '⛳',
  'chess': '♟️',
  'target': '🎯',
  'dice': '🎲',
  'ticket': '🎫',
  'balloon': '🎈',
  'party': '🎉',

  // Travel / Places
  'plane': '✈️',
  'car': '🚗',
  'bicycle': '🚲',
  'ship': '🚢',
  'rocket': '🚀',
  'ufo': '🛸',
  'mountain': '⛰️',
  'volcano': '🌋',
  'tent': '⛺',

  // Symbols & Objects
  'shield': '🛡️',
  'sword': '⚔️',
  'key': '🔑',
  'anchor': '⚓',
  'flag': '🚩',
  'trident': '🔱',
  'hourglass': '⌛',
  'clock': '⏰',
  'magnet': '🧲',
  'microscope': '🔬',
  'telescope': '🔭',
  'wrench': '🔧',
  'hammer': '🔨',
  'compass': '🧭',
  'gem': '💎',
  'gift': '🎁',
  'bell': '🔔',
  'phone': '📱',
  'envelope': '✉️',
  'briefcase': '💼',
  'umbrella': '☂️',
  'skull': '💀',
  'ghost': '👻',
  'alien': '👽',
  'robot': '🤖',
  'lightning': '⚡',
};

function getFlairEmoji(flair: string | undefined): string | undefined {
  if (!flair) return undefined;
  
  // If already an emoji, return it directly
  if (flair.length <= 2 || /[\u2600-\u27BF\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(flair)) {
    return flair;
  }
  
  const clean = flair.trim().toLowerCase();
  
  // Exact lookup
  if (LICHESS_FLAIR_MAP[clean]) {
    return LICHESS_FLAIR_MAP[clean];
  }
  
  // Split by dot e.g. "nature.seedling"
  if (clean.includes('.')) {
    const parts = clean.split('.');
    const suffix = parts[parts.length - 1];
    if (LICHESS_FLAIR_MAP[suffix]) {
      return LICHESS_FLAIR_MAP[suffix];
    }
  }
  
  // Substring match fallback
  for (const [key, emoji] of Object.entries(LICHESS_FLAIR_MAP)) {
    if (clean.includes(key)) {
      return emoji;
    }
  }
  
  return undefined;
}

function LichessFlair({ flair, className = "w-6 h-6" }: { flair: string | undefined; className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  
  if (!flair) return null;
  
  const emoji = getFlairEmoji(flair);
  
  if (imgFailed) {
    return (
      <span className="select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] leading-none">
        {emoji || "♟️"}
      </span>
    );
  }
  
  return (
    <img
      src={`https://lichess1.org/assets/flair/img/${flair}.webp`}
      alt={`Lichess Flair: ${flair}`}
      title={`Lichess Flair: ${flair}`}
      className={`${className} object-contain select-none`}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
    />
  );
}

// Simple in-memory cache to prevent redundant API hits and drastically speed up navigation/refreshes
interface CachedProfile {
  name: string;
  avatar: string;
  title?: string;
  flair?: string;
}

interface CachedGamesResult {
  profile: CachedProfile;
  games: any[];
  flairs?: Record<string, string>;
}

const CHESS_CACHE = {
  profiles: new Map<string, CachedProfile>(), // key: `${platform}-${username}`
  games: new Map<string, CachedGamesResult>(), // key: `${platform}-${username}-${year}-${month}`
};

export default function ReviewView() {
  // Game state
  const [plies, setPlies] = useState<Ply[]>(initialPlies);
  const [summary, setSummary] = useState<GameSummary>(initialSummary);
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(0); // 0 = start position, 1 = first move
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'moves' | 'load'>('moves');
  const [pgnText, setPgnText] = useState<string>('');
  const [loadType, setLoadType] = useState<'pgn' | 'fen' | 'chesscom' | 'lichess'>('lichess');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [fenText, setFenText] = useState<string>('');
  const [isGameModalOpen, setIsGameModalOpen] = useState<boolean>(false);

  // Chess.com and Lichess live import state
  const [importUsername, setImportUsername] = useState<string>('');
  const [importPlatform, setImportPlatform] = useState<'chesscom' | 'lichess'>('lichess');
  const [importMonth, setImportMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [importYear, setImportYear] = useState<number>(new Date().getFullYear());
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedGames, setImportedGames] = useState<any[]>([]);
  const [lichessFlairs, setLichessFlairs] = useState<Record<string, string>>({});
  const [playerProfile, setPlayerProfile] = useState<{
    name: string;
    avatar: string;
    title?: string;
    flair?: string;
  } | null>(null);

  // Engine configuration
  const [engineType, setEngineType] = useState<EngineType>('lite-single');
  const [depth, setDepth] = useState<number>(10); // snappy depth for instant browser reviews
  const [threads, setThreads] = useState<number>(4);
  const [hashSize, setHashSize] = useState<number>(32);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Engine run state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [currentEvalInfo, setCurrentEvalInfo] = useState<{
    depth: number;
    scoreText: string;
    nps: number;
    pv: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Analysis & Arrows State
  const [showEngineArrows, setShowEngineArrows] = useState<boolean>(true);
  const [analysisMode, setAnalysisMode] = useState<'continuation' | 'alternative'>('continuation');
  const [liveArrows, setLiveArrows] = useState<Arrow[]>([]);
  const [userArrows, setUserArrows] = useState<Arrow[]>([]);
  const liveEngineRef = useRef<StockfishManager | null>(null);
  const activeMovesRef = useRef<Record<number, { uci: string; depth: number }>>({});

  // Refs
  const moveListRef = useRef<HTMLDivElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const engineManagerRef = useRef<StockfishManager | null>(null);

  const totalPlies = plies.length;

  // Active ply data
  const currentPly: Ply | undefined = currentPlyIndex > 0 ? plies[currentPlyIndex - 1] : undefined;
  const currentBoardState: BoardState = currentPly ? currentPly.boardState : getInitialBoardState();

  // Highlight squares from the last move
  const fromSquare = currentPly?.fromSquare;
  const toSquare = currentPly?.toSquare;

  // Dynamic Theory / Opening Detection
  const getOpeningName = (): string => {
    if (currentPlyIndex === 0) return "Starting Position";
    // Scan backwards from current move to find the first known book opening
    for (let i = currentPlyIndex; i > 0; i--) {
      const p = plies[i - 1];
      if (p && p.fen) {
        const piecePlacement = p.fen.split(' ')[0];
        const match = OPENINGS_DATABASE[piecePlacement];
        if (match) return match;
      }
    }
    return "";
  };
  const openingName = getOpeningName();

  // Cleanup engine on unmount
  useEffect(() => {
    return () => {
      if (engineManagerRef.current) {
        engineManagerRef.current.terminate();
      }
      if (liveEngineRef.current) {
        liveEngineRef.current.terminate();
      }
    };
  }, []);

  // Clear user-drawn arrows on move change
  useEffect(() => {
    setUserArrows([]);
  }, [currentPlyIndex]);

  // Live Stockfish Engine Analysis Hook for Best Moves / Alternatives
  useEffect(() => {
    // If we are actively running batch analysis, do not run live engine
    if (isAnalyzing || plies.length === 0) {
      if (liveEngineRef.current) {
        liveEngineRef.current.terminate();
        liveEngineRef.current = null;
      }
      setLiveArrows([]);
      return;
    }

    // If showing engine arrows is disabled, stop the engine to save CPU
    if (!showEngineArrows) {
      if (liveEngineRef.current) {
        liveEngineRef.current.terminate();
        liveEngineRef.current = null;
      }
      setLiveArrows([]);
      return;
    }

    // Determine current FEN to analyze
    const activePly = currentPlyIndex > 0 ? plies[currentPlyIndex - 1] : null;
    const activeFen = activePly ? activePly.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    if (!activeFen) {
      setLiveArrows([]);
      return;
    }

    // Clear previous live arrows and cached moves
    activeMovesRef.current = {};
    setLiveArrows([]);

    // Initialize live engine if not already done
    if (!liveEngineRef.current) {
      // Create a fast, single-core engine for live review overlays
      const manager = new StockfishManager('lite-single', 1, 16);
      liveEngineRef.current = manager;
      manager.init(() => {
        // Ready! Configure and start evaluation
        startLiveEvaluation(manager, activeFen);
      });
    } else {
      // Engine already exists, just stop current search and evaluate new position
      const manager = liveEngineRef.current;
      manager.stop();
      startLiveEvaluation(manager, activeFen);
    }

    function startLiveEvaluation(manager: StockfishManager, fen: string) {
      // Set MultiPV based on the selected mode
      const multiPVVal = analysisMode === 'alternative' ? 3 : 1;
      
      // Run live engine evaluation to a lightweight depth (e.g., 14) for instant arrows
      // using the robust Promise-based queue evaluate method instead of evaluatePosition
      manager.evaluate(fen, 14, (evalData) => {
        const mv = evalData.multipv || 1;
        const currentBestForMv = activeMovesRef.current[mv];

        // We only accept progress updates if depth is equal or greater
        if (!currentBestForMv || evalData.depth >= currentBestForMv.depth) {
          if (evalData.bestMove) {
            activeMovesRef.current[mv] = {
              uci: evalData.bestMove,
              depth: evalData.depth
            };

            // Build arrow list from accumulated PV paths
            const sortedMvs = Object.keys(activeMovesRef.current)
              .map(Number)
              .sort((a, b) => a - b);

            const newArrows = sortedMvs.map((mIdx) => {
              const moveUci = activeMovesRef.current[mIdx].uci;
              
              // Color gradation as requested:
              // Best = rgb(0, 220, 0)
              // 2nd Best = rgb(0, 160, 0)
              // 3rd Best = rgb(0, 100, 0)
              let color = 'rgb(0, 220, 0)'; 
              if (analysisMode === 'alternative') {
                if (mIdx === 1) color = 'rgb(0, 220, 0)'; 
                else if (mIdx === 2) color = 'rgb(0, 160, 0)'; 
                else if (mIdx === 3) color = 'rgb(0, 100, 0)'; 
              }

              return {
                startSquare: moveUci.substring(0, 2),
                endSquare: moveUci.substring(2, 4),
                color
              };
            });

            setLiveArrows(newArrows);
          }
        }
      }, multiPVVal).catch(err => {
        // Live evaluation errors (e.g. from rapid stop/starts) can be ignored
        console.warn("[Live Evaluation] Error:", err.message);
      });
    }

  }, [currentPlyIndex, analysisMode, showEngineArrows, isAnalyzing, plies]);

  // Keyboard navigation for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a form input, select or textarea
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'TEXTAREA' || activeTag === 'INPUT' || activeTag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        setIsPlaying(false);
        setCurrentPlyIndex(prev => Math.min(totalPlies, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setIsPlaying(false);
        setCurrentPlyIndex(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPlies]);

  // Auto playback loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentPlyIndex(prev => {
          if (prev >= totalPlies) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, totalPlies]);

  // Scroll active move into view inside the move list
  useEffect(() => {
    if (currentPlyIndex > 0 && moveListRef.current) {
      const activeElement = document.getElementById(`ply-row-${currentPlyIndex}`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentPlyIndex]);

  // Playback handlers
  const handleFirst = () => {
    setIsPlaying(false);
    setCurrentPlyIndex(0);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentPlyIndex(prev => Math.max(0, prev - 1));
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentPlyIndex(prev => Math.min(totalPlies, prev + 1));
  };

  const handleLast = () => {
    setIsPlaying(false);
    setCurrentPlyIndex(totalPlies);
  };

  // Group plies into moves (white + black pairs)
  const movePairs: { moveNum: number; whitePly?: Ply; blackPly?: Ply }[] = [];
  for (let i = 0; i < totalPlies; i += 2) {
    movePairs.push({
      moveNum: plies[i].moveNum,
      whitePly: plies[i],
      blackPly: plies[i + 1] || undefined,
    });
  }

  // Pre-filled sample PGN (Paris Opera House)
  const samplePgn = `[Event "Paris Opera House"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[Round "1"]
[White "Paul Morphy"]
[Black "Duke of Brunswick / Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4?! 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+!! Nxb8 17. Rd8# 1-0`;

  const loadSamplePgn = () => {
    setPgnText(samplePgn);
  };

  // Live fetch implementations for Chess.com & Lichess
  const fetchChessComGames = async (username: string, overrideMonth?: number, overrideYear?: number) => {
    setIsLoadingGames(true);
    setImportError(null);
    setPlayerProfile(null);
    setImportedGames([]);

    const targetMonth = overrideMonth !== undefined ? overrideMonth : importMonth;
    const targetYear = overrideYear !== undefined ? overrideYear : importYear;

    const formatDateStringLocal = (date: Date): string => {
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    // Check cache first
    const cacheKey = `chesscom-${username.toLowerCase()}-${targetYear}-${targetMonth}`;
    if (CHESS_CACHE.games.has(cacheKey)) {
      const cached = CHESS_CACHE.games.get(cacheKey)!;
      setPlayerProfile(cached.profile);
      setImportedGames(cached.games);
      setIsLoadingGames(false);
      return;
    }

    try {
      // Fetch Profile and Games concurrently in parallel to reduce API latency
      const padDateNumber = (n: number) => n.toString().padStart(2, '0');
      const profilePromise = fetch(`https://api.chess.com/pub/player/${username}`);
      const gamesPromise = fetch(
        `https://api.chess.com/pub/player/${username}/games/${targetYear}/${padDateNumber(targetMonth)}`
      );

      const [profileRes, gamesRes] = await Promise.all([profilePromise, gamesPromise]);

      if (!profileRes.ok) {
        throw new Error(profileRes.status === 404 ? "Chess.com user not found." : "Failed to fetch Chess.com profile.");
      }
      const profileData = await profileRes.json();
      const profile = {
        name: profileData.name || profileData.username,
        avatar: profileData.avatar || `https://images.chesscomfiles.com/uploads/v1/user/default_avatar.png`,
        title: profileData.title,
      };
      setPlayerProfile(profile);

      if (gamesRes.status === 404) {
        try {
          const error = await gamesRes.json();
          if (error.message === "Date cannot be set in the future") {
            throw new Error("Date cannot be set in the future.");
          }
        } catch {
          // Ignore parsing error, handle general 404
        }
        throw new Error(
          `No games found for "${username}" in ${new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.\n\n` +
          `Possible reasons:\n` +
          `• No games played during this period\n` +
          `• Chess.com API delay\n` +
          `• Incorrect username`
        );
      } else if (!gamesRes.ok) {
        throw new Error("Failed to fetch Chess.com games. Please check the username and try again.");
      }

      const gamesData = await gamesRes.json();
      const gamesList = gamesData.games || [];

      if (gamesList.length === 0) {
        throw new Error(
          `No games found for "${username}" in ${new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.\n\n` +
          `Possible reasons:\n` +
          `• No games played during this period\n` +
          `• Chess.com API delay\n` +
          `• Incorrect username`
        );
      }

      // Format the games
      const formattedGames = gamesList.map((g: any) => {
        const isWhite = g.white.username.toLowerCase() === username.toLowerCase();
        const opponent = isWhite ? g.black : g.white;
        const userResult = isWhite ? g.white.result : g.black.result;
        
        let resultLabel = 'Draw';
        let isWin = false;
        let isDraw = false;
        if (userResult === 'win') {
          resultLabel = 'Won';
          isWin = true;
        } else if (['loss', 'checkmated', 'resigned', 'timeout', 'abandoned'].includes(userResult)) {
          resultLabel = 'Lost';
        } else {
          isDraw = true;
        }

        return {
          id: g.url.split('/').pop() || Math.random().toString(),
          opponentName: opponent.username,
          opponentRating: opponent.rating || '?',
          userRating: isWhite ? g.white.rating : g.black.rating,
          isWin,
          isDraw,
          resultLabel,
          timeClass: g.time_class,
          date: formatDateStringLocal(new Date(g.end_time * 1000)),
          pgn: g.pgn,
          link: g.url,
          white: g.white.username,
          black: g.black.username,
          whiteRating: g.white.rating || '?',
          blackRating: g.black.rating || '?',
        };
      });

      const reversedGames = [...formattedGames].reverse();

      // Save to cache
      CHESS_CACHE.games.set(cacheKey, {
        profile,
        games: reversedGames
      });

      // Show recent games first
      setImportedGames(reversedGames);
    } catch (err: any) {
      console.warn(err);
      setImportError(err.message || "An unexpected error occurred while fetching Chess.com games.");
    } finally {
      setIsLoadingGames(false);
    }
  };

  const fetchLichessGames = async (username: string, overrideMonth?: number, overrideYear?: number) => {
    setIsLoadingGames(true);
    setImportError(null);
    setPlayerProfile(null);
    setImportedGames([]);

    const targetMonth = overrideMonth !== undefined ? overrideMonth : importMonth;
    const targetYear = overrideYear !== undefined ? overrideYear : importYear;

    const formatDateStringLocal = (date: Date): string => {
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    // Check cache first
    const cacheKey = `lichess-${username.toLowerCase()}-${targetYear}-${targetMonth}`;
    if (CHESS_CACHE.games.has(cacheKey)) {
      const cached = CHESS_CACHE.games.get(cacheKey)!;
      setPlayerProfile(cached.profile);
      setImportedGames(cached.games);
      if (cached.flairs) {
        setLichessFlairs(prev => ({ ...prev, ...cached.flairs }));
      }
      setIsLoadingGames(false);
      return;
    }

    try {
      const padDateNumber = (n: number) => n.toString().padStart(2, '0');
      const getMonthLength = (m: number, y: number) => new Date(y, m, 0).getDate();

      const monthStart = new Date(`${targetYear}-${padDateNumber(targetMonth)}-01T00:00:00.000Z`);
      const monthEnd = new Date(`${targetYear}-${padDateNumber(targetMonth)}-${padDateNumber(getMonthLength(targetMonth, targetYear))}T23:59:59.999Z`);

      // Fetch Profile and Games in parallel to minimize external API roundtrips
      const profilePromise = fetch(`https://lichess.org/api/user/${username}`);
      const gamesPromise = fetch(
        `https://lichess.org/api/games/user/${username}` +
        `?since=${monthStart.getTime()}` +
        `&until=${monthEnd.getTime()}` +
        `&pgnInJson=true`,
        { headers: { Accept: "application/x-ndjson" } }
      );

      const [profileRes, gamesRes] = await Promise.all([profilePromise, gamesPromise]);

      if (!profileRes.ok) {
        throw new Error(profileRes.status === 404 ? "Lichess user not found." : "Failed to fetch Lichess profile.");
      }
      const profileData = await profileRes.json();
      const profile = {
        name: profileData.profile?.firstName && profileData.profile?.lastName
          ? `${profileData.profile.firstName} ${profileData.profile.lastName}`
          : profileData.username,
        avatar: `https://lichess.org/assets/avatar/${profileData.username}`,
        title: profileData.title,
        flair: profileData.flair,
      };
      setPlayerProfile(profile);

      if (!gamesRes.ok) {
        if (gamesRes.status === 404) {
          throw new Error(`User "${username}" not found on Lichess. Please check the spelling.`);
        }
        throw new Error(`Failed to fetch Lichess games (Status: ${gamesRes.status}).`);
      }
      
      const text = await gamesRes.text();
      if (!text.trim()) {
        throw new Error(
          `No games found for "${username}" in ${new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.\n\n` +
          `Possible reasons:\n` +
          `• No games played during this period\n` +
          `• Lichess API delay\n` +
          `• Incorrect username`
        );
      }

      const lines = text.split('\n').filter(line => line.trim() !== '');
      const games = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(g => g !== null);

      if (games.length === 0) {
        throw new Error("No recent games found.");
      }

      // Collect unique opponent names to fetch flairs in bulk
      const opponentUsernames = new Set<string>();
      
      const formattedGames = games.map((g: any) => {
        const isWhite = g.players.white.user?.id?.toLowerCase() === username.toLowerCase();
        const opponent = isWhite ? g.players.black : g.players.white;
        const userWon = g.winner ? (g.winner === (isWhite ? 'white' : 'black')) : false;

        if (opponent.user?.id) {
          opponentUsernames.add(opponent.user.id);
        }

        let resultLabel = 'Draw';
        let isDraw = !g.winner;
        if (g.winner) {
          resultLabel = userWon ? 'Won' : 'Lost';
        }

        return {
          id: g.id,
          opponentName: opponent.user?.name || opponent.user?.id || 'Anonymous',
          opponentId: opponent.user?.id || '',
          opponentRating: opponent.rating,
          userRating: isWhite ? g.players.white.rating : g.players.black.rating,
          isWin: userWon,
          isDraw,
          resultLabel,
          timeClass: g.speed,
          date: formatDateStringLocal(new Date(g.createdAt)),
          pgn: g.pgn || '',
          link: `https://lichess.org/${g.id}`,
          white: g.players.white.user?.name || g.players.white.user?.id || 'White',
          black: g.players.black.user?.name || g.players.black.user?.id || 'Black',
          whiteRating: g.players.white.rating || (g.players.white.aiLevel ? '?' : '1500'),
          blackRating: g.players.black.rating || (g.players.black.aiLevel ? '?' : '1500'),
        };
      });

      const flairMap: Record<string, string> = {};
      // Bulk fetch opponent profiles to extract flairs
      if (opponentUsernames.size > 0) {
        try {
          const userParams = Array.from(opponentUsernames).map(u => `user=${encodeURIComponent(u)}`).join('&');
          const bulkRes = await fetch(`https://lichess.org/api/users?${userParams}`);
          if (bulkRes.ok) {
            const bulkData = await bulkRes.json();
            bulkData.forEach((u: any) => {
              if (u.flair) {
                flairMap[u.id.toLowerCase()] = u.flair;
              }
            });
            setLichessFlairs(prev => ({ ...prev, ...flairMap }));
          }
        } catch (bulkErr) {
          console.warn("Could not bulk fetch opponent flairs", bulkErr);
        }
      }

      // Save to cache
      CHESS_CACHE.games.set(cacheKey, {
        profile,
        games: formattedGames,
        flairs: flairMap
      });

      setImportedGames(formattedGames);
    } catch (err: any) {
      console.warn(err);
      setImportError(err.message || "An unexpected error occurred while fetching Lichess games.");
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handlePrevMonth = () => {
    let newMonth = importMonth - 1;
    let newYear = importYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setImportMonth(newMonth);
    setImportYear(newYear);
    if (loadType === 'chesscom') {
      fetchChessComGames(importUsername.trim(), newMonth, newYear);
    } else {
      fetchLichessGames(importUsername.trim(), newMonth, newYear);
    }
  };

  const handleNextMonth = () => {
    let newMonth = importMonth + 1;
    let newYear = importYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setImportMonth(newMonth);
    setImportYear(newYear);
    if (loadType === 'chesscom') {
      fetchChessComGames(importUsername.trim(), newMonth, newYear);
    } else {
      fetchLichessGames(importUsername.trim(), newMonth, newYear);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importUsername.trim()) return;
    
    setIsGameModalOpen(true);
    if (loadType === 'chesscom') {
      fetchChessComGames(importUsername.trim(), importMonth, importYear);
    } else {
      fetchLichessGames(importUsername.trim(), importMonth, importYear);
    }
  };

  const handleImportedGameSelect = (gamePgn: string) => {
    setPgnText(gamePgn);
    setIsGameModalOpen(false);
    setTimeout(() => {
      handleAnalyze(gamePgn);
    }, 50);
  };

  // Convert chess.js square name to [row, col] format
  const squareToCoords = (square: string): [number, number] => {
    const col = square.charCodeAt(0) - 97; // 'a' is 97
    const row = 8 - parseInt(square.charAt(1), 10);
    return [row, col];
  };

  // Convert [row, col] coordinates back to UCI string (e.g. [6, 4] -> "e2", [4, 4] -> "e4" => "e2e4")
  const getUciMove = (from?: [number, number], to?: [number, number]): string => {
    if (!from || !to) return '';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7) return '';
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return '';
    
    return files[fromCol] + ranks[fromRow] + files[toCol] + ranks[toRow];
  };

  // Normalize scores to White's perspective
  const getWhitePerspectiveScore = (scoreType: 'cp' | 'mate', scoreValue: number, playedColor: 'w' | 'b'): number => {
    let val = scoreValue;
    if (scoreType === 'mate') {
      const sign = scoreValue >= 0 ? 1 : -1;
      val = sign * (10000 - Math.abs(scoreValue)); // huge positive for mate, huge negative for being mated
    }
    // If White played the move, the position evaluated is Black's turn to move, so Stockfish score is from Black's perspective.
    // To get White's perspective, we must flip it.
    // If Black played the move, the position evaluated is White's turn to move, so Stockfish score is already from White's perspective.
    const whiteScore = playedColor === 'w' ? -val : val;
    // Cap score at +/- 10.00 centipawns (1000) to keep the drop calculation stable in winning/mating positions
    return Math.max(-1000, Math.min(1000, whiteScore));
  };

  // Convert an engine score string (which is from the side-to-move's perspective) to White's perspective
  const normalizeScoreTextToWhite = (rawScoreText: string, playedColor: 'w' | 'b'): string => {
    // If Black played the move, the analyzed position is White to move, so it is already from White's perspective
    if (playedColor === 'b') return rawScoreText;

    // If White played the move, the analyzed position is Black to move, so we must flip it
    if (rawScoreText.startsWith('M')) {
      return rawScoreText.startsWith('M-')
        ? `M${rawScoreText.slice(2)}` // "M-3" -> "M3"
        : `M-${rawScoreText.slice(1)}`; // "M3" -> "M-3"
    }

    const val = parseFloat(rawScoreText);
    if (isNaN(val)) return rawScoreText;
    const flipped = -val;
    return `${flipped >= 0 ? '+' : ''}${flipped.toFixed(2)}`;
  };

  // Classify moves based on evaluation change
  // Sophisticated piece sacrifice detection helper using Chess.js simulation
  const detectSacrifice = (fenBefore: string, move: { from: string; to: string; piece: string; captured?: string; promotion?: string }): boolean => {
    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    
    const movingPieceType = move.piece;
    const movingVal = pieceValues[movingPieceType] || 0;
    
    // 1. Capture Sacrifice: we capture something but the captured piece is worth less than the moving piece, 
    // and the square is defended so we expect recapture.
    if (move.captured) {
      const capturedVal = pieceValues[move.captured] || 0;
      if (movingVal > capturedVal) {
        try {
          const tempGame = new Chess(fenBefore);
          tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
          const opponentMoves = tempGame.moves({ verbose: true });
          const canRecapture = opponentMoves.some(m => m.to === move.to);
          if (canRecapture) {
            return true;
          }
        } catch (e) {
          console.error('[detectSacrifice] Error in capture sacrifice simulation:', e);
        }
      }
    } else {
      // 2. En prise Sacrifice: we move a piece of Knight/Bishop or higher value to a square where it is attacked
      // and either undefended or poorly defended.
      if (movingVal >= 3) {
        try {
          const tempGame = new Chess(fenBefore);
          tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
          
          const opponentMoves = tempGame.moves({ verbose: true });
          const isAttacked = opponentMoves.some(m => m.to === move.to);
          
          if (isAttacked) {
            const captureMovesOnSquare = opponentMoves.filter(m => m.to === move.to);
            if (captureMovesOnSquare.length > 0) {
              const firstCapture = captureMovesOnSquare[0];
              const capturingPieceVal = pieceValues[firstCapture.piece] || 1;
              
              const postCaptureGame = new Chess(tempGame.fen());
              postCaptureGame.move({ from: firstCapture.from, to: firstCapture.to, promotion: firstCapture.promotion });
              
              const friendlyMoves = postCaptureGame.moves({ verbose: true });
              const canFriendlyRecapture = friendlyMoves.some(m => m.to === move.to);
              
              if (!canFriendlyRecapture) {
                // Completely hanging piece!
                return true;
              } else {
                // Defended, but is the material trade negative for us?
                if (movingVal - capturingPieceVal > 1) {
                  return true;
                }
              }
            }
          }
        } catch (e) {
          console.error('[detectSacrifice] Error in en prise simulation:', e);
        }
      }
    }
    return false;
  };

  const classifyMoveQuality = (
    drop: number, 
    isBest: boolean, 
    isSacrifice: boolean,
    perspectiveCurrentScore: number,
    perspectiveLastScore: number,
    isCheckmate?: boolean,
    opponentDrop?: number
  ): AnnotationType => {
    // 1. Brilliant (!!): sacrifice, low loss (drop < 20 or isBest or isCheckmate), not already winning (last score < 300), and not disastrous after (current score > -200)
    if (isSacrifice && (drop < 20 || isBest || isCheckmate) && perspectiveLastScore < 300 && perspectiveCurrentScore > -200) {
      return 'brilliant';
    }

    // Checkmate is always the best move
    if (isCheckmate) {
      return 'best';
    }

    // 2. Great (!): best/nearly best, improved position by >= 100cp (swing >= 100)
    if ((isBest || drop < 20) && (perspectiveCurrentScore - perspectiveLastScore >= 100)) {
      return 'great';
    }

    // Miss (Missed Win / Missed Opportunity)
    const isMiss = (() => {
      // Must have missed a significant opportunity (high drop / centipawn loss)
      if (drop < 100) return false;

      // 1. Classic Missed Win: We had a winning position, but let it slip
      const classicMissedWin = perspectiveLastScore >= 200 && perspectiveCurrentScore < 50;

      // 2. Tactical Miss: Opponent made a significant error (opponentDrop >= 150), and we failed to punish it
      // but our own position did not become totally lost (perspectiveCurrentScore >= -150)
      const tacticalMiss = (opponentDrop && opponentDrop >= 150) && (perspectiveCurrentScore >= -150);

      return classicMissedWin || tacticalMiss;
    })();

    if (isMiss) {
      return 'miss';
    }

    // 4. Best: engine perfect
    if (isBest || drop <= 0) {
      return 'best';
    }

    // Standard Centipawn Loss Thresholds (Chess.com model)
    if (drop <= 20) {
      return 'excellent';
    }

    if (drop <= 50) {
      return 'good';
    }

    if (drop <= 150) {
      return 'inaccuracy';
    }

    if (drop <= 300) {
      return 'mistake';
    }

    return 'blunder';
  };

  // Generate dynamic explanations based on annotation quality
  const generateMoveComment = (
    san: string,
    annotation: AnnotationType,
    drop: number,
    scoreText: string,
    bestMove: string,
    color: 'w' | 'b'
  ): string => {
    const player = color === 'w' ? 'White' : 'Black';
    const opponent = color === 'w' ? 'Black' : 'White';
    const absDropPawns = (Math.abs(drop) / 100).toFixed(2);

    switch (annotation) {
      case 'brilliant':
        return `A brilliant tactical stroke! ${player} plays ${san}, sacrificing material to initiate a deep attack. The evaluation remains highly favorable at ${scoreText}.`;
      case 'best':
        return `${player} plays the optimal continuation ${san}. This perfectly follows the computer's recommended theoretical line and maintains high positional pressure.`;
      case 'excellent':
        return `An excellent move! ${player} plays ${san}, finding one of the best lines and keeping a firm grip on the position.`;
      case 'good':
        return `A good move. ${player} plays ${san}. A solid choice that keeps the position competitive. Stockfish evaluation stands at ${scoreText}.`;
      case 'great':
        return `An excellent move! ${player} plays ${san}, keeping a firm grip on the position and continuing to build the initiative.`;
      case 'inaccuracy':
        return `An inaccuracy. ${player} plays ${san}, but drops the evaluation by ${absDropPawns} pawns. Stockfish suggests ${bestMove || 'another approach'} to maintain full control.`;
      case 'mistake':
        return `A significant mistake. Playing ${san} gives ${opponent} a chance to equalize or gain ground. Evaluation slips by ${absDropPawns} pawns. Better was ${bestMove || 'a different line'}.`;
      case 'miss':
        return `A missed opportunity! ${player} plays ${san}, missing a crucial tactic or advantage. Evaluation swings by ${absDropPawns} pawns.`;
      case 'blunder':
        return `A critical blunder! ${player} completely misses a defensive resource or drops major material with ${san}. Position evaluation swings by ${absDropPawns} pawns in ${opponent}'s favor!`;
      case 'book':
        return `${player} plays ${san}, continuing a well-known theoretical opening book sequence. Solid and reliable.`;
      default:
        return `${player} plays ${san}. A solid choice that keeps the position competitive. Stockfish evaluation stands at ${scoreText}.`;
    }
  };

  // Cancel running analysis
  const handleStopAnalysis = () => {
    if (engineManagerRef.current) {
      engineManagerRef.current.stop();
      engineManagerRef.current.terminate();
      engineManagerRef.current = null;
    }
    setIsAnalyzing(false);
    setAnalysisStep("Analysis cancelled by user.");
  };

  // Full interactive engine game analysis execution loop
  const handleAnalyze = (overridePgn?: string) => {
    let targetPgn = typeof overridePgn === 'string' ? overridePgn : pgnText;
    if (loadType === 'fen' && typeof overridePgn !== 'string') {
      targetPgn = fenText;
    }
    if (!targetPgn.trim()) {
      setErrorMessage("Please load the sample game, enter a custom PGN, or paste a FEN first.");
      return;
    }

    // Terminate any previous analysis engine currently running to avoid duplicate workers
    if (engineManagerRef.current) {
      engineManagerRef.current.stop();
      engineManagerRef.current.terminate();
      engineManagerRef.current = null;
    }

    setErrorMessage(null);
    setIsPlaying(false);
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStep("Parsing chess notation...");

    try {
      const sanitized = sanitizePgnText(targetPgn);
      const chess = new Chess();
      
      const isFen = (text: string): boolean => {
        const trimmed = text.trim();
        const parts = trimmed.split(/\s+/);
        if (parts.length < 2) return false;
        const ranks = parts[0].split('/');
        if (ranks.length !== 8) return false;
        return parts[1] === 'w' || parts[1] === 'b';
      };

      let pgnHeaders: any = {};
      let parsedPlies: Ply[] = [];

      if (isFen(sanitized)) {
        chess.load(sanitized);
        pgnHeaders = {
          Event: "FEN Evaluation",
          Site: "Local Engine",
          Date: new Date().getFullYear().toString(),
          White: "White Player",
          Black: "Black Player",
          Result: "*",
          FEN: sanitized
        };
        const matrixBoard: BoardState = chess.board().map(row => 
          row.map(cell => cell ? { type: cell.type, color: cell.color } : null)
        );
        parsedPlies = [{
          plyIndex: 1,
          moveNum: 1,
          color: chess.turn() === 'w' ? 'w' : 'b',
          san: "Starting FEN",
          annotation: 'normal',
          boardState: matrixBoard,
          fromSquare: [0, 0],
          toSquare: [0, 0],
          comment: "Awaiting evaluation calculations...",
          fen: sanitized
        } as any];
      } else {
        chess.loadPgn(sanitized);
        pgnHeaders = chess.header();
        const gameHistory = chess.history({ verbose: true });

        if (gameHistory.length === 0) {
          throw new Error("Game contains no moves to analyze!");
        }

        // Pre-calculate all board states and starting info for plies
        parsedPlies = gameHistory.map((m, idx) => {
          const boardStateInstance = new Chess(m.after);
          const matrixBoard: BoardState = boardStateInstance.board().map(row => 
            row.map(cell => cell ? { type: cell.type, color: cell.color } : null)
          );

          return {
            plyIndex: idx + 1,
            moveNum: Math.floor(idx / 2) + 1,
            color: m.color,
            san: m.san,
            annotation: 'normal', // initialized
            boardState: matrixBoard,
            fromSquare: squareToCoords(m.from),
            toSquare: squareToCoords(m.to),
            comment: "Awaiting analysis calculations...",
            fen: m.after // cache FEN for Stockfish input
          } as any;
        });
      }

      // Show the initial moves table immediately to keep the UI interactive
      setPlies(parsedPlies);
      setCurrentPlyIndex(0);
      setActiveTab('moves');

      // 2. Start Stockfish engine
      setAnalysisStep(`Booting up ${engineType} engine...`);
      setAnalysisProgress(10);

      const manager = new StockfishManager(engineType, threads, hashSize);
      engineManagerRef.current = manager;

      manager.init(
        () => {
          // Engine ready callback!
          console.log("[Stockfish] Engine initialized and ready. Starting ply evaluation loop...");
          runSequencingAnalysis(manager, parsedPlies, pgnHeaders);
        },
        (errorMsg) => {
          setErrorMessage(errorMsg);
          setIsAnalyzing(false);
        }
      );

    } catch (err: any) {
      console.error("[Analysis Error]", err);
      setErrorMessage(err.message || "Failed to parse chess game notation.");
      setIsAnalyzing(false);
    }
  };

  // Background sequencing runner
  const runSequencingAnalysis = async (
    manager: StockfishManager,
    initialParsedPlies: Ply[],
    headers: any
  ) => {
    let activeIndex = -1; // -1 means starting position
    const finalPlies = [...initialParsedPlies];
    const whitePerspectiveScoresList: number[] = [];
    
    // Track count of annotations
    let brilliantCount = 0;
    let greatCount = 0;
    let bestCount = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let bookCount = 0;
    let inaccuracyCount = 0;
    let mistakeCount = 0;
    let missCount = 0;
    let blunderCount = 0;

    // Track active player flairs if loaded from Lichess or names match
    let whiteFlairVal: string | undefined = undefined;
    let blackFlairVal: string | undefined = undefined;

    // Initialize summary immediately for instant layout feedback
    setSummary({
      whitePlayer: headers.White || "White Player",
      blackPlayer: headers.Black || "Black Player",
      result: headers.Result || "*-*",
      date: headers.Date || new Date().getFullYear().toString(),
      event: headers.Event || "Local Review",
      brilliantCount: 0,
      greatCount: 0,
      bestCount: 0,
      excellentCount: 0,
      goodCount: 0,
      bookCount: 0,
      inaccuracyCount: 0,
      mistakeCount: 0,
      missCount: 0,
      blunderCount: 0,
      whiteFlair: undefined,
      blackFlair: undefined,
    });

    // Concurrently fetch profiles from Lichess to get flair emojis if applicable
    const whiteUsername = headers.White;
    const blackUsername = headers.Black;
    if (whiteUsername && blackUsername) {
      const whiteCacheKey = `lichess-${whiteUsername.trim().toLowerCase()}`;
      const blackCacheKey = `lichess-${blackUsername.trim().toLowerCase()}`;

      const whiteCached = CHESS_CACHE.profiles.get(whiteCacheKey);
      const blackCached = CHESS_CACHE.profiles.get(blackCacheKey);

      if (whiteCached || blackCached) {
        whiteFlairVal = whiteCached?.flair || undefined;
        blackFlairVal = blackCached?.flair || undefined;
        setSummary(prev => ({
          ...prev,
          whiteFlair: whiteFlairVal,
          blackFlair: blackFlairVal,
        }));
      }

      const whitePromise = whiteCached 
        ? Promise.resolve(whiteCached) 
        : fetch(`https://lichess.org/api/user/${encodeURIComponent(whiteUsername.trim().toLowerCase())}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data) {
                const profile = { name: data.username, avatar: '', flair: data.flair };
                CHESS_CACHE.profiles.set(whiteCacheKey, profile);
                return profile;
              }
              return null;
            })
            .catch(() => null);

      const blackPromise = blackCached 
        ? Promise.resolve(blackCached) 
        : fetch(`https://lichess.org/api/user/${encodeURIComponent(blackUsername.trim().toLowerCase())}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data) {
                const profile = { name: data.username, avatar: '', flair: data.flair };
                CHESS_CACHE.profiles.set(blackCacheKey, profile);
                return profile;
              }
              return null;
            })
            .catch(() => null);

      Promise.all([whitePromise, blackPromise]).then(([whiteData, blackData]) => {
        whiteFlairVal = whiteData?.flair || whiteCached?.flair || undefined;
        blackFlairVal = blackData?.flair || blackCached?.flair || undefined;
        setSummary(prev => ({
          ...prev,
          whiteFlair: whiteFlairVal,
          blackFlair: blackFlairVal,
        }));
      }).catch(err => {
        console.warn("Failed to fetch player flairs", err);
      });
    }

    const startingFen = headers.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const getTurn = (fen: string) => (fen.split(' ')[1] === 'w' ? 'w' : 'b');

    let lastWhitePerspectiveScore = 0.0;
    let lastBestMoveUci = '';

    const analyzeNextPly = () => {
      if (activeIndex >= finalPlies.length) {
        // ANALYSIS DONE!
        console.log("[Stockfish] Game analysis successfully completed.");
        manager.terminate();
        
        // Finalize summary totals
        setSummary({
          whitePlayer: headers.White || "White Player",
          blackPlayer: headers.Black || "Black Player",
          result: headers.Result || "*-*",
          date: headers.Date || new Date().getFullYear().toString(),
          event: headers.Event || "Local Review",
          brilliantCount,
          greatCount,
          bestCount,
          excellentCount,
          goodCount,
          bookCount,
          inaccuracyCount,
          mistakeCount,
          missCount,
          blunderCount,
          whiteFlair: whiteFlairVal,
          blackFlair: blackFlairVal,
        });

        setIsAnalyzing(false);
        setAnalysisProgress(100);
        setCurrentPlyIndex(1); // Nav to first move
        setCurrentEvalInfo(null);
        return;
      }

      const isStartingPosition = activeIndex === -1;
      const activePly = isStartingPosition ? null : finalPlies[activeIndex];
      const plyNum = isStartingPosition ? 0 : activeIndex + 1;
      const fenToEvaluate = isStartingPosition ? startingFen : (activePly!.fen || '');
      const currentTurn = getTurn(fenToEvaluate);

      const progressPercent = Math.min(95, Math.round(15 + ((activeIndex + 1) / (finalPlies.length + 1)) * 80));

      setAnalysisProgress(progressPercent);
      if (isStartingPosition) {
        setAnalysisStep(`Evaluating starting position...`);
      } else {
        setAnalysisStep(`Analyzing Move ${Math.ceil(plyNum / 2)} (${activePly!.color === 'w' ? 'White' : 'Black'})...`);
      }

      manager.evaluate(fenToEvaluate, depth, (evalData) => {
        const normalizedLiveScore = normalizeScoreTextToWhite(evalData.scoreText, currentTurn === 'w' ? 'b' : 'w');

        if (!isStartingPosition) {
          setCurrentEvalInfo({
            depth: evalData.depth,
            scoreText: normalizedLiveScore,
            nps: evalData.nps,
            pv: evalData.pv
          });
        }

        if (isStartingPosition) {
          setAnalysisStep(`Evaluating starting position [Depth ${evalData.depth}/${depth}]...`);
        } else {
          setAnalysisStep(`Analyzing Move ${Math.ceil(plyNum / 2)} (${activePly!.color === 'w' ? 'White' : 'Black'}) [Depth ${evalData.depth}/${depth}]...`);
        }
      }).then((latestEval) => {
        const scoreType = latestEval?.scoreType || 'cp';
        const scoreVal = latestEval?.scoreValue ?? 0;
        const scoreTxt = latestEval?.scoreText || '0.00';
        const bestCompMove = latestEval?.bestMove || '';

        const currentWhitePerspectiveScore = getWhitePerspectiveScore(scoreType, scoreVal, currentTurn === 'w' ? 'b' : 'w');
        const normalizedScoreTxt = normalizeScoreTextToWhite(scoreTxt, currentTurn === 'w' ? 'b' : 'w');

        if (isStartingPosition) {
          lastWhitePerspectiveScore = currentWhitePerspectiveScore;
          lastBestMoveUci = bestCompMove;
          whitePerspectiveScoresList.push(currentWhitePerspectiveScore);
        } else {
          let drop = 0;
          if (activePly!.color === 'w') {
            drop = lastWhitePerspectiveScore - currentWhitePerspectiveScore;
          } else {
            drop = currentWhitePerspectiveScore - lastWhitePerspectiveScore;
          }

          // We want the absolute scores to be from the perspective of the player making the move
          const perspectiveLastScore = activePly!.color === 'w' ? lastWhitePerspectiveScore : -lastWhitePerspectiveScore;
          const perspectiveCurrentScore = activePly!.color === 'w' ? currentWhitePerspectiveScore : -currentWhitePerspectiveScore;

          // Calculate opponent's drop if applicable
          let opponentDrop = 0;
          if (activeIndex >= 1) {
            const scoreTwoPliesAgo = whitePerspectiveScoresList[activeIndex - 1];
            const scoreOnePlyAgo = whitePerspectiveScoresList[activeIndex];
            if (activePly!.color === 'w') {
              // Opponent was Black
              opponentDrop = scoreOnePlyAgo - scoreTwoPliesAgo;
            } else {
              // Opponent was White
              opponentDrop = scoreTwoPliesAgo - scoreOnePlyAgo;
            }
          }

          // Add our own score to the history list AFTER calculating the opponent's drop
          whitePerspectiveScoresList.push(currentWhitePerspectiveScore);

          // Reconstruct move to check for sacrifice and opening book
          const fenBefore = activeIndex === 0 ? startingFen : (finalPlies[activeIndex - 1].fen || startingFen);
          const positionKey = (activePly!.fen || '').split(' ')[0];
          
          // A Book move is an opening move in the DATABASE up to move 10
          const isBookMove = activePly!.moveNum <= 10 && positionKey in OPENINGS_DATABASE;

          let isSacrifice = false;
          let playedUci = '';
          let isBest = false;
          let isCheckmate = false;

          try {
            const tempChess = new Chess(fenBefore);
            const movesList = tempChess.moves({ verbose: true });
            playedUci = getUciMove(activePly!.fromSquare, activePly!.toSquare);
            const matchingMove = movesList.find(m => (m.from + m.to).toLowerCase() === playedUci.toLowerCase());
            
            if (matchingMove) {
              isSacrifice = detectSacrifice(fenBefore, matchingMove);
            }
            
            isBest = playedUci !== '' && lastBestMoveUci.toLowerCase().startsWith(playedUci.toLowerCase());

            if (activePly!.san.endsWith('#')) {
              isCheckmate = true;
            } else if (matchingMove) {
              const tempGameForMate = new Chess(fenBefore);
              tempGameForMate.move({ from: matchingMove.from, to: matchingMove.to, promotion: matchingMove.promotion });
              if (tempGameForMate.isCheckmate()) {
                isCheckmate = true;
              }
            }
          } catch (e) {
            console.error('[runSequencingAnalysis] Error parsing played move details:', e);
          }

          let moveType: AnnotationType = 'normal';
          if (isBookMove) {
            moveType = 'book';
            bookCount++;
          } else {
            moveType = classifyMoveQuality(
              drop, 
              isBest, 
              isSacrifice,
              perspectiveCurrentScore, 
              perspectiveLastScore,
              isCheckmate,
              opponentDrop
            );

            if (moveType === 'brilliant') brilliantCount++;
            else if (moveType === 'best') bestCount++;
            else if (moveType === 'great') greatCount++;
            else if (moveType === 'excellent') excellentCount++;
            else if (moveType === 'good') goodCount++;
            else if (moveType === 'inaccuracy') inaccuracyCount++;
            else if (moveType === 'mistake') mistakeCount++;
            else if (moveType === 'miss') missCount++;
            else if (moveType === 'blunder') blunderCount++;
          }

          const moveComment = generateMoveComment(activePly!.san, moveType, drop, normalizedScoreTxt, lastBestMoveUci, activePly!.color);

          finalPlies[activeIndex] = {
            ...activePly!,
            annotation: moveType,
            comment: moveComment,
            scoreText: normalizedScoreTxt
          };

          setPlies([...finalPlies]);

          lastWhitePerspectiveScore = currentWhitePerspectiveScore;
          lastBestMoveUci = bestCompMove;
        }

        activeIndex++;
        analyzeNextPly();
      }).catch((err) => {
        console.error("Evaluation failed:", err);
        // Continue anyway
        activeIndex++;
        analyzeNextPly();
      });
    };

    // Kick off
    analyzeNextPly();
  };

  // Helper styles for annotation badges in grid list
  const getAnnotationBadge = (type: AnnotationType, value: number) => {
    const badgeStyles: Record<AnnotationType, { bg: string; border: string; text: string; label: string }> = {
      brilliant: { bg: 'bg-green-500/5 text-green-400 border-green-500/20', border: 'border-green-500/20', text: 'text-green-400', label: 'Brilliant' },
      great: { bg: 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Great' },
      best: { bg: 'bg-blue-500/5 text-blue-400 border-blue-500/20', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Best' },
      excellent: { bg: 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20', border: 'border-indigo-500/20', text: 'text-indigo-400', label: 'Excellent' },
      good: { bg: 'bg-teal-500/5 text-teal-400 border-teal-500/20', border: 'border-teal-500/20', text: 'text-teal-400', label: 'Good' },
      book: { bg: 'bg-sky-500/5 text-sky-400 border-sky-500/10', border: 'border-sky-500/10', text: 'text-sky-400', label: 'Book' },
      inaccuracy: { bg: 'bg-amber-500/5 text-amber-500 border-amber-500/10', border: 'border-amber-500/10', text: 'text-amber-500', label: 'Inaccuracy' },
      mistake: { bg: 'bg-orange-500/5 text-orange-400 border-orange-500/10', border: 'border-orange-500/10', text: 'text-orange-400', label: 'Mistake' },
      miss: { bg: 'bg-red-500/5 text-red-400 border-red-500/10', border: 'border-red-500/10', text: 'text-red-400', label: 'Miss' },
      blunder: { bg: 'bg-rose-500/5 text-rose-400 border-rose-500/20', border: 'border-rose-500/20', text: 'text-rose-400', label: 'Blunder' },
      normal: { bg: 'bg-neutral-800', border: 'border-neutral-700', text: 'text-neutral-400', label: 'Normal' },
    };

    const style = badgeStyles[type];
    if (type === 'normal') return null;

    return (
      <div 
        key={type}
        className={`flex items-center justify-between p-2.5 rounded-xl border ${style.bg} ${style.border} text-xs font-semibold shadow-sm hover:scale-[1.02] transition-all duration-200 cursor-help`}
        title={`Analyzed ${style.label} Moves`}
      >
        <div className="flex items-center gap-2">
          <ChessAnnotationIcon type={type} size="1.35rem" />
          <span className="opacity-95 font-bold text-neutral-200">{style.label}</span>
        </div>
        <span className="text-xs font-black bg-black/40 text-neutral-300 px-2.5 py-0.5 rounded-md border border-neutral-800">{value}</span>
      </div>
    );
  };

  // Render small pill tags inside the moves table
  const renderInlineBadge = (type: AnnotationType) => {
    if (type === 'normal') return null;
    return <ChessAnnotationIcon type={type} size="1.1rem" className="ml-1.5 inline-block align-middle" />;
  };

  // Calculation for Evaluation Bar height percentage
  const getEvalBarHeight = (): number => {
    if (!currentPly) return 50; // default centered at starting position

    // If we have custom scored text from live evaluation or stored ply
    const scoreText = (currentPly as any).scoreText || currentEvalInfo?.scoreText;
    if (!scoreText) return 50;

    if (scoreText.startsWith('M')) {
      return scoreText.includes('-') ? 5 : 95; // mate
    }

    const score = parseFloat(scoreText);
    if (isNaN(score)) return 50;

    // Convert pawns score to centipawn score
    const cp = score * 100;
    
    // Sigmoid (Logistic) Mapping as recommended in professional analysis:
    // fill = 2 / (1 + e^(-cp / 400)) - 1
    const scale = 400;
    const raw = 2 / (1 + Math.exp(-cp / scale)) - 1;
    
    // Clamp to [-1, 1]
    const clamped = Math.max(-1, Math.min(1, raw));
    
    // Map from [-1, 1] to [5%, 95%] height range
    const percent = 5 + ((clamped + 1) / 2) * 90;
    return percent;
  };

  const evalPercentage = getEvalBarHeight();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-8 py-6 md:py-10">
      
      {/* Upper Title Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-neutral-900 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2">
              {summary.whiteFlair && (
                <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 rounded-full shadow-md select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" title={`Lichess Flair: ${summary.whiteFlair}`}>
                  <LichessFlair flair={summary.whiteFlair} className="w-5 h-5" />
                </span>
              )}
              <span>{summary.whitePlayer}</span>
            </span>
            <span className="text-neutral-600 text-lg font-light">vs</span>
            <span className="flex items-center gap-2">
              {summary.blackFlair && (
                <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 rounded-full shadow-md select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" title={`Lichess Flair: ${summary.blackFlair}`}>
                  <LichessFlair flair={summary.blackFlair} className="w-5 h-5" />
                </span>
              )}
              <span className="text-neutral-300">{summary.blackPlayer}</span>
            </span>
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-neutral-400 font-semibold tracking-wide">
            <span className="flex items-center gap-1.5">🏟️ {summary.event}</span>
            <span className="flex items-center gap-1.5">📅 {summary.date}</span>
            <span className="text-green-400 flex items-center gap-1.5">🏆 Result: {summary.result}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
              showSettings 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/15' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Configure Engine Settings"
          >
            <Settings className={`w-4 h-4 ${showSettings ? 'animate-spin' : ''}`} />
            <span>Engine Setup</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2 font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${currentPly ? (currentPly.color === 'w' ? 'bg-white' : 'bg-neutral-600') : 'bg-neutral-800'}`}></span>
            {currentPly ? (currentPly.color === 'w' ? "White to Move" : "Black to Move") : "Starting Position"}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-300">Analysis Initialization Error</h4>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-300">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start">
        
        {/* LEFT PANEL: Chessboard + Interactive evaluation bar + playback controls */}
        <div className="col-span-1 lg:col-span-5 flex flex-col items-center gap-6">
          
          {/* Flex container holding Chessboard and vertical Eval Bar */}
          <div className="flex gap-4.5 w-full items-stretch justify-center max-w-[530px]">
            
            {/* 1. PROFESSIONAL VERTICAL EVALUATION BAR */}
            <div className="w-10 bg-neutral-900 rounded-2xl overflow-hidden flex flex-col justify-between border border-neutral-800/80 shadow-inner relative" title="Evaluation meter">
              {/* Black Fill (top) */}
              <div className="flex-1 bg-neutral-950 transition-all duration-300 relative">
                {/* Score display text at top of bar if evaluation is negative */}
                {evalPercentage < 50 && (
                  <span className="absolute top-2 left-0 right-0 text-xs font-bold font-mono text-white text-center select-none z-10 leading-none px-0.5 truncate">
                    {currentPly ? ((currentPly as any).scoreText || currentEvalInfo?.scoreText) : '0.00'}
                  </span>
                )}
              </div>
              
              {/* Separation line (equal mark) */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-700/50 z-20 pointer-events-none" />

              {/* White Fill (bottom) */}
              <div 
                className="bg-neutral-100 transition-all duration-300 relative flex flex-col justify-end"
                style={{ height: `${evalPercentage}%` }}
              >
                {/* Score display text at bottom of bar if evaluation is positive */}
                {evalPercentage >= 50 && (
                  <span className="absolute bottom-2 left-0 right-0 text-xs font-bold font-mono text-neutral-900 text-center select-none z-10 leading-none px-0.5 truncate">
                    {currentPly ? ((currentPly as any).scoreText || currentEvalInfo?.scoreText || '0.00') : '0.00'}
                  </span>
                )}
              </div>
            </div>

            {/* 2. CHESSBOARD GRID */}
            <div className="flex-1 max-w-[480px] flex flex-col gap-3">
              <Chessboard 
                board={currentBoardState}
                fen={currentPly ? currentPly.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
                fromSquare={fromSquare}
                toSquare={toSquare}
                annotation={currentPly?.annotation}
                arrows={(() => {
                  const seen = new Set<string>();
                  return [...userArrows, ...liveArrows].filter((arr) => {
                    const key = `${arr.startSquare}-${arr.endSquare}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                })()}
                onArrowsChange={({ arrows }) => {
                  const engineColors = ['rgb(0, 220, 0)', 'rgb(0, 160, 0)', 'rgb(0, 100, 0)'];
                  const filtered = arrows.filter(a => !engineColors.includes(a.color));
                  setUserArrows(filtered);
                }}
              />
              {/* Dynamic Opening Name / Theory Indicator */}
              {openingName && (
                <div className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2.5 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <div className="text-left leading-relaxed">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block leading-none mb-1">Theory / Book Opening</span>
                    <span className="font-bold text-neutral-200">{openingName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Engine specifications metadata banner */}
          <div className="w-full max-w-[520px] bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-4 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-neutral-500 font-bold tracking-wider block uppercase">Engine Profile</span>
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 mt-0.5 font-mono">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                {engineType === 'large-multi' ? 'Stockfish 18 NNUE (Large)' : engineType === 'lite-multi' ? 'Stockfish 18 Lite (Multi)' : 'Stockfish 18 Lite (Single)'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
              <span className="text-xs text-neutral-400 font-semibold font-mono">
                {isAnalyzing ? 'Calculating...' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Engine Analysis & Arrow Settings Panel */}
          <div className="w-full max-w-[520px] bg-neutral-900/45 border border-neutral-850 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-green-450 animate-pulse" />
                Live Analysis Overlay
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Show Best-Move Arrows</span>
                <button
                  onClick={() => setShowEngineArrows(!showEngineArrows)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    showEngineArrows ? 'bg-green-500' : 'bg-neutral-800'
                  }`}
                  title={showEngineArrows ? "Hide engine analysis arrows" : "Show engine analysis arrows"}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform duration-200 ${
                      showEngineArrows ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {showEngineArrows && (
              <div className="flex items-center justify-between pt-2.5 border-t border-neutral-850">
                <span className="text-xs text-neutral-400 font-semibold">Analysis Mode</span>
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-850">
                  <button
                    onClick={() => setAnalysisMode('continuation')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      analysisMode === 'continuation'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'text-neutral-500 hover:text-neutral-350'
                    }`}
                  >
                    Top Continuation
                  </button>
                  <button
                    onClick={() => setAnalysisMode('alternative')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      analysisMode === 'alternative'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-neutral-500 hover:text-neutral-350'
                    }`}
                  >
                    Top Alternatives
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PLAYBACK CONTROL DECK */}
          <div className="w-full max-w-[520px] flex flex-col items-center gap-4 bg-[#141517] border border-neutral-850 rounded-2xl p-4.5 shadow-xl">
            <div className="flex items-center justify-center gap-2.5 w-full">
              <button
                onClick={handleFirst}
                disabled={currentPlyIndex === 0}
                className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Go to Start (Home)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentPlyIndex === 0}
                className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Previous Move (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer border shadow-md active:scale-95 ${
                  isPlaying 
                    ? 'bg-blue-600 border-blue-500 hover:bg-blue-700 text-white shadow-blue-500/10' 
                    : 'bg-green-500 border-green-400 hover:bg-green-600 text-neutral-950 shadow-green-500/10'
                }`}
                title={isPlaying ? "Pause Autoplay" : "Play Autoplay"}
              >
                {isPlaying ? <Pause className="w-5.5 h-5.5 fill-current" /> : <Play className="w-5.5 h-5.5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNext}
                disabled={currentPlyIndex === totalPlies}
                className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Next Move (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleLast}
                disabled={currentPlyIndex === totalPlies}
                className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Go to Checkmate (End)"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-neutral-500 text-center select-none font-mono tracking-wide">
              PRO TIP: Use your keyboard arrow keys <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">←</kbd> and <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">→</kbd> to control the playback.
            </p>
          </div>

        </div>

        {/* RIGHT PANEL: Stats Badges, Move List, Engine Explanations */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-6 text-left">
          
          {/* Collapsible engine settings configuration dashboard */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                className="bg-[#141517] border border-blue-500/30 rounded-2xl p-5 shadow-lg space-y-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-4 h-4 animate-spin" />
                    Local Engine Preferences
                  </h4>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Select Engine Version */}
                  <div>
                    <label className="text-neutral-400 block font-bold mb-1.5">Engine Flavor</label>
                    <select
                      value={engineType}
                      onChange={(e) => setEngineType(e.target.value as EngineType)}
                      className="w-full bg-neutral-900 border border-neutral-850 rounded-xl p-2.5 text-neutral-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="lite-single">Stockfish 18 Lite (Single-Core — Fast & Pure)</option>
                      <option value="lite-multi">Stockfish 18 Lite (Multi-Threaded — High Performance)</option>
                      <option value="large-multi">Stockfish 18 NNUE (Neural Net — Master-Level)</option>
                    </select>
                  </div>

                  {/* Calculation Depth */}
                  <div>
                    <label className="text-neutral-400 block font-bold mb-1.5 flex justify-between">
                      <span>Search Depth</span>
                      <span className="text-blue-400 font-mono font-bold">{depth} plies</span>
                    </label>
                    <input 
                      type="range"
                      min="5"
                      max="15"
                      value={depth}
                      onChange={(e) => setDepth(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Threads (for multi-threaded versions) */}
                  {engineType !== 'lite-single' && (
                    <div>
                      <label className="text-neutral-400 block font-bold mb-1.5 flex justify-between">
                        <span>CPU Thread Count</span>
                        <span className="text-blue-400 font-mono font-bold">{threads} Threads</span>
                      </label>
                      <input 
                        type="range"
                        min="1"
                        max="8"
                        value={threads}
                        onChange={(e) => setThreads(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  )}

                  {/* Hash Cache size */}
                  <div>
                    <label className="text-neutral-400 block font-bold mb-1.5">RAM Cache Size (Hash)</label>
                    <select
                      value={hashSize}
                      onChange={(e) => setHashSize(parseInt(e.target.value, 10))}
                      className="w-full bg-neutral-900 border border-neutral-850 rounded-xl p-2.5 text-neutral-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="16">16 MB (Lighter cache)</option>
                      <option value="32">32 MB (Standard)</option>
                      <option value="64">64 MB (Deep cache)</option>
                      <option value="128">128 MB (Heavy analysis)</option>
                    </select>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 leading-relaxed font-sans mt-2">
                  ℹ️ Multi-threaded engines require security headers configured on your web host. MoveLens comes pre-configured with active CORS, COOP, and COEP headers to guarantee top-tier performance.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Badges Panel */}
          <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">
              Game Evaluation Summary
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {getAnnotationBadge('brilliant', summary.brilliantCount)}
              {getAnnotationBadge('great', summary.greatCount)}
              {getAnnotationBadge('best', summary.bestCount)}
              {getAnnotationBadge('excellent', summary.excellentCount)}
              {getAnnotationBadge('good', summary.goodCount)}
              {getAnnotationBadge('book', summary.bookCount)}
              {getAnnotationBadge('inaccuracy', summary.inaccuracyCount)}
              {getAnnotationBadge('mistake', summary.mistakeCount)}
              {getAnnotationBadge('miss', summary.missCount)}
              {getAnnotationBadge('blunder', summary.blunderCount)}
            </div>
          </div>

          {/* Move List and Load Game tabs container */}
          <div className="bg-[#141517] border border-neutral-850 rounded-2xl overflow-hidden flex flex-col h-[340px] shadow-lg">
            
            {/* Tab header navigation bar */}
            <div className="flex bg-neutral-950 border-b border-neutral-900 p-1.5 justify-between items-center">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('moves')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'moves'
                      ? 'bg-[#141517] text-white shadow'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Move List
                </button>
                <button
                  onClick={() => setActiveTab('load')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'load'
                      ? 'bg-[#141517] text-white shadow'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Load Game
                </button>
              </div>

              {/* Live engine calculation speedometer indicator */}
              {isAnalyzing && currentEvalInfo && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>{(currentEvalInfo.nps / 1000).toFixed(0)}k NPS</span>
                </div>
              )}
            </div>

            {/* Tab body viewport */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'moves' ? (
                /* MOVES TABLE VIEWPORT */
                <div 
                  ref={moveListRef}
                  className="w-full h-full overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800"
                >
                  {/* Pair header row */}
                  <div className="grid grid-cols-12 text-[10px] font-bold text-neutral-500 uppercase tracking-wider pb-2 border-b border-neutral-850 mb-2">
                    <div className="col-span-2">#</div>
                    <div className="col-span-5">White</div>
                    <div className="col-span-5">Black</div>
                  </div>

                  {/* Special Row: Initial Setup / Move 0 */}
                  <button
                    onClick={() => { setIsPlaying(false); setCurrentPlyIndex(0); }}
                    className={`w-full grid grid-cols-12 p-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      currentPlyIndex === 0
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="col-span-2 font-mono text-neutral-500">0.</div>
                    <div className="col-span-10">Starting Position</div>
                  </button>

                  {/* Moves loop */}
                  {movePairs.map((pair) => {
                    const wPly = pair.whitePly;
                    const bPly = pair.blackPly;

                    const isWhiteActive = currentPlyIndex === wPly?.plyIndex;
                    const isBlackActive = bPly && currentPlyIndex === bPly.plyIndex;

                    return (
                      <div 
                        key={pair.moveNum}
                        className="grid grid-cols-12 items-center text-xs border-b border-neutral-900/30 last:border-0"
                      >
                        {/* Move Index Column */}
                        <div className="col-span-2 font-mono font-bold text-neutral-500 py-1.5">
                          {pair.moveNum}.
                        </div>

                        {/* White column */}
                        <div className="col-span-5 pr-1.5">
                          {wPly && (
                            <button
                              id={`ply-row-${wPly.plyIndex}`}
                              onClick={() => { setIsPlaying(false); setCurrentPlyIndex(wPly.plyIndex); }}
                              className={`w-full text-left py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isWhiteActive
                                  ? 'bg-blue-600 text-white font-black shadow shadow-blue-600/20 scale-[1.01]'
                                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              <span>{wPly.san}</span>
                              {renderInlineBadge(wPly.annotation)}
                            </button>
                          )}
                        </div>

                        {/* Black column */}
                        <div className="col-span-5 pl-1.5">
                          {bPly ? (
                            <button
                              id={`ply-row-${bPly.plyIndex}`}
                              onClick={() => { setIsPlaying(false); setCurrentPlyIndex(bPly.plyIndex); }}
                              className={`w-full text-left py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isBlackActive
                                  ? 'bg-blue-600 text-white font-black shadow shadow-blue-600/20 scale-[1.01]'
                                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              <span>{bPly.san}</span>
                              {renderInlineBadge(bPly.annotation)}
                            </button>
                          ) : (
                            <span className="text-neutral-600 select-none">...</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* UNIFIED LOAD GAME TAB */
                <div className="w-full h-full flex flex-col p-4 bg-[#111112]">
                  {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-neutral-900/80 rounded-xl border border-neutral-850">
                      <RefreshCw className="w-7 h-7 text-blue-500 animate-spin mb-3" />
                      <h4 className="text-xs font-bold text-white mb-1.5">Analyzing Chess Game with Stockfish</h4>
                      <p className="text-[10px] text-amber-400 font-mono mb-3">{analysisStep}</p>
                      
                      {/* Active analysis telemetry data */}
                      {currentEvalInfo && (
                        <div className="text-[9px] text-neutral-400 font-mono mb-3 bg-black/40 border border-neutral-850 rounded-lg px-3 py-1.5 space-y-0.5 text-left max-w-xs w-full">
                          <div className="flex justify-between">
                            <span>Engine Depth:</span>
                            <span className="text-blue-400 font-bold">{currentEvalInfo.depth} / {depth}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Score:</span>
                            <span className="text-green-400 font-bold">{currentEvalInfo.scoreText}</span>
                          </div>
                          <div className="truncate">
                            <span>Line:</span> <span className="text-neutral-500">{currentEvalInfo.pv}</span>
                          </div>
                        </div>
                      )}

                      {/* Progress bar container */}
                      <div className="w-full max-w-xs h-1.5 bg-neutral-800 rounded-full overflow-hidden relative mb-1.5">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500">{analysisProgress}% Complete</span>

                      <button
                        onClick={handleStopAnalysis}
                        className="mt-3 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        Cancel Analysis
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Dropdown Selector Row */}
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                        <span className="text-xs font-bold text-neutral-400">Load game from</span>
                        
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-200 rounded-xl transition-all cursor-pointer"
                          >
                            <span>
                              {loadType === 'pgn' ? 'PGN' :
                               loadType === 'fen' ? 'FEN' :
                               loadType === 'chesscom' ? 'Chess.com' : 'Lichess'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                          </button>
                          
                          <AnimatePresence>
                            {isDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute right-0 mt-1.5 w-32 bg-[#141517] border border-neutral-800 rounded-xl shadow-xl py-1 z-20 overflow-hidden"
                                >
                                  {(['pgn', 'fen', 'chesscom', 'lichess'] as const).map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => {
                                        setLoadType(type);
                                        setIsDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold transition-all hover:bg-neutral-900 ${
                                        loadType === type ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
                                      }`}
                                    >
                                      {type === 'pgn' ? 'PGN' :
                                       type === 'fen' ? 'FEN' :
                                       type === 'chesscom' ? 'Chess.com' : 'Lichess'}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Content Area Based on Selected loadType */}
                      <div className="flex-1 flex flex-col justify-center py-2">
                        {loadType === 'pgn' ? (
                          <div className="relative h-32 w-full">
                            <textarea
                              value={pgnText}
                              onChange={(e) => setPgnText(e.target.value)}
                              placeholder="Paste standard algebraic notation PGN here..."
                              className="w-full h-full bg-neutral-900 border border-neutral-850 rounded-xl p-3 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
                            />
                            {!pgnText.trim() && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                                <FileText className="w-7 h-7 text-neutral-850 mb-1" />
                                <p className="text-[11px] text-neutral-500">
                                  Paste a standard chess PGN format game.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : loadType === 'fen' ? (
                          <div className="space-y-1.5 w-full">
                            <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">FEN string</label>
                            <input
                              type="text"
                              value={fenText}
                              onChange={(e) => setFenText(e.target.value)}
                              placeholder="e.g. r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
                              className="w-full bg-neutral-900 border border-neutral-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2 w-full">
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">Username</label>
                              <input
                                type="text"
                                value={importUsername}
                                onChange={(e) => setImportUsername(e.target.value)}
                                placeholder="Enter Username..."
                                className="w-full bg-neutral-900 border border-neutral-850 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none"
                              />
                            </div>
                            
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleSearch()}
                                disabled={isLoadingGames || !importUsername.trim()}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-900 disabled:text-neutral-700 disabled:border-neutral-900 border border-transparent text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                              >
                                {isLoadingGames ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Search className="w-3 h-3" />
                                )}
                                Search
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lower Action / Analyse Button */}
                      <div className="border-t border-neutral-900/60 pt-2.5 mt-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (loadType === 'pgn') {
                              handleAnalyze(pgnText);
                            } else if (loadType === 'fen') {
                              handleAnalyze(fenText);
                            } else {
                              if (pgnText) {
                                handleAnalyze(pgnText);
                              } else {
                                handleSearch();
                              }
                            }
                          }}
                          disabled={
                            loadType === 'pgn' ? !pgnText.trim() :
                            loadType === 'fen' ? !fenText.trim() :
                            !importUsername.trim()
                          }
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-900 disabled:text-neutral-700 disabled:border-neutral-900 border border-transparent text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          Analyse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE POSITION COMMENTARY PANEL */}
          <div className="bg-[#141517] border border-neutral-850 rounded-2xl p-5 shadow-lg flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 border-b border-neutral-850 pb-3 mb-3 shrink-0">
              <Zap className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Position Analysis & Commentary
              </h4>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[80px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPlyIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  {currentPly ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-black text-sm text-white">
                          Move {Math.ceil(currentPly.plyIndex / 2)}:
                        </span>
                        <span className="font-mono font-bold text-xs bg-neutral-900 text-blue-400 px-2 py-0.5 rounded border border-neutral-800">
                          {currentPly.color === 'w' ? 'White' : 'Black'} played {currentPly.san}
                        </span>
                        
                        {currentPly.annotation !== 'normal' && (
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded border leading-none uppercase ${
                            currentPly.annotation === 'brilliant' ? 'bg-green-500/5 text-green-400 border-green-500/20' :
                            currentPly.annotation === 'great' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' :
                            currentPly.annotation === 'best' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                            currentPly.annotation === 'book' ? 'bg-sky-500/5 text-sky-400 border-sky-500/20' :
                            currentPly.annotation === 'inaccuracy' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                            currentPly.annotation === 'mistake' ? 'bg-orange-500/5 text-orange-400 border-orange-500/20' :
                            'bg-rose-500/5 text-rose-400 border-rose-500/25'
                          }`}>
                            <ChessAnnotationIcon type={currentPly.annotation} size="1.15rem" />
                            <span>{currentPly.annotation}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-neutral-300 leading-relaxed font-medium font-sans">
                        {currentPly.comment || "Position remains complex with highly double-edged lines. Stockfish registered equal play."}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-neutral-500 font-medium">
                        Use the playback controls or select any move in the list to trigger automatic Stockfish commentary and move evaluation highlights.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* SELECT A GAME MODAL */}
      <AnimatePresence>
        {isGameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGameModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#141517] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsGameModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="p-5 border-b border-neutral-850 text-center">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Select a game</h3>
                <p className="text-[11px] text-neutral-500 font-medium font-mono mt-1">
                  {loadType === 'chesscom' ? 'Chess.com' : 'Lichess'} &gt; {importUsername}
                </p>
                
                {/* Date switcher pagination: <- July 2026 -> */}
                <div className="flex items-center justify-center gap-4 mt-4 bg-neutral-950/40 border border-neutral-850/50 rounded-xl px-4 py-2 w-fit mx-auto">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-white min-w-[100px]">
                    {new Date(importYear, importMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content / Games List */}
              <div className="p-5 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-neutral-800 flex-1">
                {isLoadingGames ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
                    <p className="text-xs text-neutral-400 font-mono">Fetching recent chess games...</p>
                  </div>
                ) : importError ? (
                  <div className="py-6 px-4">
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3 whitespace-pre-line text-left leading-relaxed shadow-sm">
                      {importError}
                    </div>
                    <p className="text-[11px] text-neutral-500 text-center">
                      Try paginating to other months using the arrows above.
                    </p>
                  </div>
                ) : importedGames.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">
                    <p className="text-xs">No games found for this period.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {importedGames.map((game) => {
                      const isWin = game.isWin;
                      const isDraw = game.isDraw;
                      
                      return (
                        <div
                          key={game.id}
                          onClick={() => handleImportedGameSelect(game.pgn)}
                          className="flex items-center justify-between p-3 bg-neutral-900/30 hover:bg-neutral-900/70 border border-neutral-850/40 hover:border-neutral-800 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Paper airplane icon */}
                            <div className="w-8 h-8 rounded-lg bg-neutral-950/40 flex items-center justify-center shrink-0 border border-neutral-850/30 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
                              <Send className="w-3.5 h-3.5 text-neutral-400 rotate-45 transform group-hover:text-blue-400 transition-colors" />
                            </div>

                            {/* Players */}
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 bg-white rounded-md shrink-0 shadow border border-neutral-200" />
                                <span className="text-neutral-200 text-xs font-bold truncate max-w-[140px]" title={game.white}>
                                  {game.white}
                                </span>
                                <span className="text-neutral-500 text-[10px] font-mono shrink-0">({game.whiteRating})</span>
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 bg-neutral-900 border border-neutral-800 rounded-md shrink-0 shadow" />
                                <span className="text-neutral-300 text-xs font-medium truncate max-w-[140px]" title={game.black}>
                                  {game.black}
                                </span>
                                <span className="text-neutral-500 text-[10px] font-mono shrink-0">({game.blackRating})</span>
                              </div>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="text-[11px] text-neutral-500 font-medium px-3 shrink-0">
                            {game.date}
                          </div>

                          {/* Result & Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-md font-extrabold text-xs leading-none select-none ${
                              isWin
                                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                : isDraw
                                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isWin ? '+' : isDraw ? '=' : '-'}
                            </span>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImportedGameSelect(game.pgn);
                              }}
                              className="p-1.5 rounded-lg hover:bg-neutral-850 text-neutral-400 hover:text-white transition-colors"
                              title="Analyse this game"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, ChevronLeft, ChevronRight, SkipForward, 
  Sparkles, FileText, Settings, RefreshCw, Activity, Info, X,
  Search, Send, Volume2, VolumeX, Repeat, Smartphone, RotateCcw
} from 'lucide-react';
import { Chess } from 'chess.js';
import { BoardState, BoardSquare, Ply, AnnotationType, GameSummary, Arrow } from '../types';
import { generatedPlies as initialPlies, gameSummary as initialSummary, getInitialBoardState } from '../data/sampleGame';
import Chessboard from './Chessboard';
import ChessAnnotationIcon from './ChessAnnotationIcon';
import { StockfishManager, StockfishEvaluation, EngineType } from '../lib/StockfishManager';
import { OPENINGS_DATABASE } from '../data/openings';
import EvaluationGraph from './EvaluationGraph';

interface AutoTunedEngineConfig {
  engineType: EngineType;
  depth: number;
  threads: number;
  hashSize: number;
  isMobile: boolean;
  label: string;
}

function getAutoTunedEngineConfig(): AutoTunedEngineConfig {
  if (typeof window === 'undefined') {
    return {
      engineType: 'lite-single',
      depth: 10,
      threads: 4,
      hashSize: 32,
      isMobile: false,
      label: 'Desktop Standard',
    };
  }

  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const isSmallScreen = window.innerWidth < 768;
  const isMobile = isCoarsePointer || isSmallScreen;
  const hasSab = typeof SharedArrayBuffer !== 'undefined';
  const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2;
  const memoryGb = typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory || 4) : 4;

  if (isMobile) {
    if (hasSab && cores >= 4 && memoryGb >= 4) {
      return {
        engineType: 'lite-multi',
        depth: 9,
        threads: Math.min(2, cores),
        hashSize: 16,
        isMobile: true,
        label: `Mobile Auto (${Math.min(2, cores)} threads · Depth 9)`,
      };
    }
    return {
      engineType: 'lite-single',
      depth: 8,
      threads: 1,
      hashSize: 16,
      isMobile: true,
      label: 'Mobile Lite Auto (Single-core · Depth 8)',
    };
  }

  return {
    engineType: 'lite-single',
    depth: 10,
    threads: Math.min(4, Math.max(1, cores)),
    hashSize: 32,
    isMobile: false,
    label: 'Laptop Standard (Depth 10)',
  };
}

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
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chess_muted') === 'true';
    }
    return false;
  });

  const soundsRef = useRef<Record<string, HTMLAudioElement>>({});
  const lastPlayedIndexRef = useRef<number>(0);
  const pliesRef = useRef<Ply[]>(plies);

  // Calculate per-player move classification counts & accuracy dynamically from plies
  const moveStats = useMemo(() => {
    const whiteCounts: Record<AnnotationType, number> = {
      brilliant: 0, great: 0, best: 0, excellent: 0, good: 0,
      book: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, normal: 0
    };
    const blackCounts: Record<AnnotationType, number> = {
      brilliant: 0, great: 0, best: 0, excellent: 0, good: 0,
      book: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, normal: 0
    };

    let whiteWeightedSum = 0;
    let whiteMoveCount = 0;
    let blackWeightedSum = 0;
    let blackMoveCount = 0;

    const weights: Partial<Record<AnnotationType, number>> = {
      brilliant: 100,
      great: 100,
      best: 100,
      book: 100,
      excellent: 92,
      good: 78,
      inaccuracy: 50,
      mistake: 25,
      miss: 10,
      blunder: 0,
      normal: 85,
    };

    plies.forEach((ply) => {
      const ann = ply.annotation || 'normal';
      const weight = weights[ann] ?? 85;

      if (ply.color === 'w') {
        whiteCounts[ann] = (whiteCounts[ann] || 0) + 1;
        if (ann !== 'normal') {
          whiteWeightedSum += weight;
          whiteMoveCount++;
        }
      } else if (ply.color === 'b') {
        blackCounts[ann] = (blackCounts[ann] || 0) + 1;
        if (ann !== 'normal') {
          blackWeightedSum += weight;
          blackMoveCount++;
        }
      }
    });

    const whiteAccuracy = whiteMoveCount > 0 
      ? (whiteWeightedSum / whiteMoveCount).toFixed(1) 
      : '100.0';

    const blackAccuracy = blackMoveCount > 0 
      ? (blackWeightedSum / blackMoveCount).toFixed(1) 
      : '100.0';

    return {
      whiteCounts,
      blackCounts,
      whiteAccuracy,
      blackAccuracy,
    };
  }, [plies]);

  const categories: { key: AnnotationType; label: string; textClass: string }[] = [
    { key: 'brilliant', label: 'Brilliant', textClass: 'text-cyan-400' },
    { key: 'great', label: 'Great', textClass: 'text-emerald-400' },
    { key: 'best', label: 'Best', textClass: 'text-green-400' },
    { key: 'excellent', label: 'Excellent', textClass: 'text-blue-400' },
    { key: 'good', label: 'Good', textClass: 'text-teal-400' },
    { key: 'book', label: 'Book', textClass: 'text-sky-300' },
    { key: 'inaccuracy', label: 'Inaccuracy', textClass: 'text-amber-400' },
    { key: 'mistake', label: 'Mistake', textClass: 'text-orange-400' },
    { key: 'miss', label: 'Miss', textClass: 'text-rose-400' },
    { key: 'blunder', label: 'Blunder', textClass: 'text-red-500' },
  ];

  // Preload sounds on mount
  useEffect(() => {
    const soundNames = [
      'move-self',
      'capture',
      'move-check',
      'castle',
      'promote',
      'game-end',
      'game-start',
      'illegal'
    ];
    const soundInstances: Record<string, HTMLAudioElement> = {};
    soundNames.forEach(name => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.preload = 'auto';
      soundInstances[name] = audio;
    });
    soundsRef.current = soundInstances;

    return () => {
      Object.values(soundInstances).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('chess_muted', String(newVal));
      return newVal;
    });
  };

  const playIllegalSound = () => {
    if (isMuted) return;
    const audio = soundsRef.current['illegal'];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const playGameStartSound = () => {
    if (isMuted) return;
    const audio = soundsRef.current['game-start'];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  // Sound effects listener based on move transitions
  useEffect(() => {
    const prevIndex = lastPlayedIndexRef.current;
    lastPlayedIndexRef.current = currentPlyIndex;

    let checkmateTimeoutId: any = null;

    const playSound = (soundName: string) => {
      if (isMuted) return;
      const audio = soundsRef.current[soundName];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.warn(`Sound playback failed for ${soundName}:`, err);
        });
      }
    };

    if (prevIndex === currentPlyIndex) return;

    const activePly = plies[currentPlyIndex - 1];
    if (!activePly) return;

    const san = activePly.san || '';
    if (san.includes('#')) {
      // check sound (first) + game end sound (second) = checkmate sound
      playSound('move-check');
      checkmateTimeoutId = setTimeout(() => {
        playSound('game-end');
      }, 450);
    } else if (san.includes('+')) {
      playSound('move-check');
    } else if (san.includes('O-O') || san.includes('O-O-O')) {
      playSound('castle');
    } else if (san.includes('=')) {
      playSound('promote');
    } else if (san.includes('x')) {
      playSound('capture');
    } else {
      playSound('move-self');
    }

    return () => {
      if (checkmateTimeoutId) {
        clearTimeout(checkmateTimeoutId);
      }
    };
  }, [currentPlyIndex, plies, isMuted]);

  const [panelTab, setPanelTab] = useState<'moves' | 'overview' | 'load'>('moves');
  const [isDesktopLg, setIsDesktopLg] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktopLg(e.matches);
    setIsDesktopLg(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Persistent memory state for username, PGN, FEN, and load type
  const [pgnText, setPgnTextState] = useState<string>(() => localStorage.getItem('chess_saved_pgn') || '');
  const [fenText, setFenTextState] = useState<string>(() => localStorage.getItem('chess_saved_fen') || '');
  const [importUsername, setImportUsernameState] = useState<string>(() => localStorage.getItem('chess_saved_username') || '');
  const [loadType, setLoadTypeState] = useState<'pgn' | 'fen' | 'chesscom' | 'lichess'>(() => {
    const saved = localStorage.getItem('chess_saved_load_type');
    if (saved === 'pgn' || saved === 'fen' || saved === 'chesscom' || saved === 'lichess') {
      return saved;
    }
    return 'lichess';
  });

  const setPgnText = (val: string) => {
    setPgnTextState(val);
    localStorage.setItem('chess_saved_pgn', val);
  };

  const setFenText = (val: string) => {
    setFenTextState(val);
    localStorage.setItem('chess_saved_fen', val);
  };

  const setImportUsername = (val: string) => {
    setImportUsernameState(val);
    localStorage.setItem('chess_saved_username', val);
  };

  const setLoadType = (val: 'pgn' | 'fen' | 'chesscom' | 'lichess') => {
    setLoadTypeState(val);
    localStorage.setItem('chess_saved_load_type', val);
  };

  const [isGameModalOpen, setIsGameModalOpen] = useState<boolean>(false);

  // Chess.com and Lichess live import state
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

  // Hardware-aware engine configuration (auto-tuned on mobile with manual override)
  const initialEnginePreset = useMemo(() => getAutoTunedEngineConfig(), []);
  const [engineType, setEngineType] = useState<EngineType>(initialEnginePreset.engineType);
  const [depth, setDepth] = useState<number>(initialEnginePreset.depth);
  const [threads, setThreads] = useState<number>(initialEnginePreset.threads);
  const [hashSize, setHashSize] = useState<number>(initialEnginePreset.hashSize);
  const [isManualEngineOverride, setIsManualEngineOverride] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const resetToRecommendedEngine = () => {
    const preset = getAutoTunedEngineConfig();
    setEngineType(preset.engineType);
    setDepth(preset.depth);
    setThreads(preset.threads);
    setHashSize(preset.hashSize);
    setIsManualEngineOverride(false);
  };

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
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const liveEngineRef = useRef<StockfishManager | null>(null);
  const activeMovesRef = useRef<Record<number, { uci: string; depth: number }>>({});

  const handleUserArrowToggle = (startSquare: string, endSquare: string) => {
    setUserArrows(prev => {
      const existsIdx = prev.findIndex(
        a => a.startSquare === startSquare && a.endSquare === endSquare
      );
      if (existsIdx !== -1) {
        return prev.filter((_, idx) => idx !== existsIdx);
      }
      return [...prev, { startSquare, endSquare, color: 'rgb(255, 170, 0)' }];
    });
  };

  const handleClearUserArrows = () => {
    setUserArrows(prev => (prev.length > 0 ? [] : prev));
  };

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
    let activeFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let playedMoveUci = "";

    if (analysisMode === 'continuation') {
      const activePly = currentPlyIndex > 0 ? plies[currentPlyIndex - 1] : null;
      if (activePly) {
        activeFen = activePly.fen;
      }
    } else if (analysisMode === 'alternative') {
      if (currentPlyIndex > 0) {
        const prevPly = currentPlyIndex > 1 ? plies[currentPlyIndex - 2] : null;
        activeFen = prevPly ? prevPly.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        playedMoveUci = plies[currentPlyIndex - 1].uci;
      } else {
        // If no move has been played, alternative is just the best moves from start position
        activeFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      }
    }

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
        startLiveEvaluation(manager, activeFen, playedMoveUci);
      });
    } else {
      // Engine already exists, just stop current search and evaluate new position
      const manager = liveEngineRef.current;
      manager.stop();
      startLiveEvaluation(manager, activeFen, playedMoveUci);
    }

    function startLiveEvaluation(manager: StockfishManager, fen: string, playedUci: string) {
      // Set MultiPV based on the selected mode
      const multiPVVal = analysisMode === 'alternative' ? 3 : 1;
      
      // Run live engine evaluation to a lightweight depth (capped lighter on mobile for responsiveness)
      const liveDepth = initialEnginePreset.isMobile ? 11 : 14;
      manager.evaluate(fen, liveDepth, (evalData) => {
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
              
              if (analysisMode === 'alternative' && moveUci === playedUci) {
                return null;
              }

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
            }).filter(Boolean) as Arrow[];

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

      if (e.key === 'f' || e.key === 'F') {
        setOrientation(prev => prev === 'white' ? 'black' : 'white');
        return;
      }

      if (e.key === 'ArrowRight') {
        setIsPlaying(false);
        setCurrentPlyIndex(prev => {
          if (prev >= totalPlies) {
            playIllegalSound();
            return prev;
          }
          return prev + 1;
        });
      } else if (e.key === 'ArrowLeft') {
        setIsPlaying(false);
        setCurrentPlyIndex(prev => {
          if (prev <= 0) {
            playIllegalSound();
            return prev;
          }
          return prev - 1;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPlies, isMuted]);

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

  // Removed move list auto-scroll per user request


  // Playback handlers
  const handleFirst = () => {
    setIsPlaying(false);
    if (currentPlyIndex === 0) {
      playIllegalSound();
    } else {
      setCurrentPlyIndex(0);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentPlyIndex(prev => {
      if (prev <= 0) {
        playIllegalSound();
        return 0;
      }
      return prev - 1;
    });
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentPlyIndex(prev => {
      if (prev >= totalPlies) {
        playIllegalSound();
        return totalPlies;
      }
      return prev + 1;
    });
  };

  const handleLast = () => {
    setIsPlaying(false);
    if (currentPlyIndex === totalPlies) {
      playIllegalSound();
    } else {
      setCurrentPlyIndex(totalPlies);
    }
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
      const sign = scoreValue > 0 ? 1 : -1;
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
    const trimmed = rawScoreText.trim();
    const isMate = /^-?M-?\d+$/i.test(trimmed) || /^\+?M\d+$/i.test(trimmed);
    if (isMate) {
      const numMatch = trimmed.match(/\d+/);
      const n = numMatch ? numMatch[0] : '1';
      const rawNeg = trimmed.startsWith('-') || trimmed.includes('M-');
      // If Black played, turn is White -> already White's perspective.
      // If White played, turn is Black -> flip polarity.
      const whiteNeg = playedColor === 'b' ? rawNeg : !rawNeg;
      return whiteNeg ? `-M${n}` : `M${n}`;
    }

    if (playedColor === 'b') return trimmed;

    const val = parseFloat(trimmed);
    if (isNaN(val)) return trimmed;
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
      setPanelTab('moves');
      playGameStartSound();

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

        let currentWhitePerspectiveScore = getWhitePerspectiveScore(scoreType, scoreVal, currentTurn === 'w' ? 'b' : 'w');
        let normalizedScoreTxt = normalizeScoreTextToWhite(scoreTxt, currentTurn === 'w' ? 'b' : 'w');

        if (isStartingPosition) {
          lastWhitePerspectiveScore = currentWhitePerspectiveScore;
          lastBestMoveUci = bestCompMove;
          whitePerspectiveScoresList.push(currentWhitePerspectiveScore);
        } else {
          // Reconstruct move details first so terminal checkmate overrides fallback Stockfish "0.00"
          const fenBefore = activeIndex === 0 ? startingFen : (finalPlies[activeIndex - 1].fen || startingFen);
          const positionKey = (activePly!.fen || '').split(' ')[0];
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

          if (isCheckmate) {
            currentWhitePerspectiveScore = activePly!.color === 'w' ? 1000 : -1000;
            normalizedScoreTxt = activePly!.color === 'w' ? 'M0' : '-M0';
          }

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

  // Render small pill tags inside the moves table
  const renderInlineBadge = (type: AnnotationType) => {
    if (type === 'normal') return null;

    const badgeStyles: Record<AnnotationType, { bg: string; text: string; label: string }> = {
      brilliant: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Brilliant' },
      great: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Great' },
      best: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Best' },
      excellent: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Excellent' },
      good: { bg: 'bg-neutral-500/10', text: 'text-neutral-400', label: 'Good' },
      book: { bg: 'bg-neutral-500/10', text: 'text-neutral-400', label: 'Book' },
      inaccuracy: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Inaccuracy' },
      mistake: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Mistake' },
      miss: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Miss' },
      blunder: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Blunder' },
      normal: { bg: '', text: '', label: '' },
    };

    const style = badgeStyles[type];

    return (
      <div className={`ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${style.bg} ${style.text} border border-current/10`}>
        <ChessAnnotationIcon type={type} size="0.82rem" />
        <span className="text-[9px] font-bold uppercase tracking-wider">{style.label}</span>
      </div>
    );
  };

  // Calculation for Evaluation Bar height percentage (pinned to winning side on mate/checkmate)
  const getEvalBarHeight = (): number => {
    if (!currentPly) return 50; // default centered at starting position
    if (currentPly.san?.endsWith('#')) {
      return currentPly.color === 'w' ? 100 : 0;
    }

    const scoreText = currentPly.scoreText || currentEvalInfo?.scoreText;
    if (!scoreText) return 50;

    const trimmed = scoreText.trim();
    if (/^-M\d+$/i.test(trimmed) || /^M-\d+$/i.test(trimmed)) return 0;
    if (/^\+?M\d+$/i.test(trimmed)) return 100;

    const score = parseFloat(trimmed);
    if (isNaN(score)) return 50;

    // Convert pawns score to centipawn score
    const cp = score * 100;
    
    // Sigmoid function (Lichess & Chess.com standard):
    const winProb = 1 / (1 + Math.exp(-0.0035 * cp));
    
    // Map from [0, 1] to [5%, 95%] height range
    return 5 + winProb * 90;
  };

  const formatEvalLabel = (raw?: string): string => {
    if (currentPly?.san?.endsWith('#')) return '#';
    if (!raw) return '0.00';
    const trimmed = raw.trim();
    if (trimmed === 'M0' || trimmed === '-M0') return '#';
    if (/^M-(\d+)$/i.test(trimmed)) return `-M${trimmed.slice(2)}`;
    return trimmed;
  };

  const evalPercentage = getEvalBarHeight();
  const activeEvalLabel = currentPly ? formatEvalLabel(currentPly.scoreText || currentEvalInfo?.scoreText) : '0.00';

  // Settings Drawer Content
  const renderSettingsContent = () => (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Engine Settings
          </h4>
        </div>
        <button 
          onClick={() => setShowSettings(false)}
          className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close Settings"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Auto-tune status banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800 text-[11px]">
        <div className="flex items-center gap-2 text-neutral-300">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isManualEngineOverride ? 'Custom settings active' : initialEnginePreset.label}
          </span>
        </div>
        {isManualEngineOverride && (
          <button
            type="button"
            onClick={resetToRecommendedEngine}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer py-1 px-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Engine */}
        <div>
          <label className="text-neutral-400 block font-bold mb-1.5">Engine</label>
          <select
            value={engineType}
            onChange={(e) => {
              setEngineType(e.target.value as EngineType);
              setIsManualEngineOverride(true);
            }}
            className="w-full min-h-[44px] bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="lite-single">Stockfish 18 Lite (Single)</option>
            <option value="lite-multi">Stockfish 18 Lite (Multi)</option>
            <option value="large-multi">Stockfish 18 Full (NNUE)</option>
          </select>
        </div>

        {/* Depth */}
        <div>
          <label className="text-neutral-400 block font-bold mb-1.5 flex justify-between">
            <span>Depth</span>
            <span className="text-emerald-400 font-mono font-bold tabular-nums">{depth} plies</span>
          </label>
          <div className="min-h-[44px] flex items-center">
            <input 
              type="range"
              min="5"
              max="15"
              value={depth}
              onChange={(e) => {
                setDepth(parseInt(e.target.value, 10));
                setIsManualEngineOverride(true);
              }}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Threads */}
        {engineType !== 'lite-single' && (
          <div>
            <label className="text-neutral-400 block font-bold mb-1.5 flex justify-between">
              <span>Threads</span>
              <span className="text-emerald-400 font-mono font-bold tabular-nums">{threads}</span>
            </label>
            <div className="min-h-[44px] flex items-center">
              <input 
                type="range"
                min="1"
                max="8"
                value={threads}
                onChange={(e) => {
                  setThreads(parseInt(e.target.value, 10));
                  setIsManualEngineOverride(true);
                }}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Memory */}
        <div>
          <label className="text-neutral-400 block font-bold mb-1.5">Memory</label>
          <select
            value={hashSize}
            onChange={(e) => {
              setHashSize(parseInt(e.target.value, 10));
              setIsManualEngineOverride(true);
            }}
            className="w-full min-h-[44px] bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-neutral-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="16">16 MB (Light)</option>
            <option value="32">32 MB (Standard)</option>
            <option value="64">64 MB (Deep)</option>
            <option value="128">128 MB (Max)</option>
          </select>
        </div>
      </div>

      <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
        Runs locally in your browser via WebAssembly. Multi-thread engines fall back to single-core automatically if unsupported.
      </p>
    </div>
  );

  // Compact Move Note + Hints strip below playback controls
  const renderNotesStrip = () => (
    <div className="w-full max-w-[520px] bg-[#12141a] border border-neutral-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-lg text-left">
      {/* Header row: Move summary on left, compact Hints controls on right */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/70">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {currentPly ? (
            <>
              <span className="font-mono font-bold text-xs text-white tabular-nums">
                {Math.ceil(currentPly.plyIndex / 2)}.{currentPly.color === 'b' ? '..' : ''} {currentPly.san}
              </span>
              {currentPly.annotation !== 'normal' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200">
                  <ChessAnnotationIcon type={currentPly.annotation} size="0.82rem" />
                  <span>{currentPly.annotation}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-bold text-neutral-300">Notes</span>
          )}
        </div>

        {/* Compact Hints Toggle + Next/Best Switch */}
        <div className="flex items-center gap-2 shrink-0">
          {showEngineArrows && (
            <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setAnalysisMode('continuation')}
                className={`min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  analysisMode === 'continuation'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('alternative')}
                className={`min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  analysisMode === 'alternative'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Best
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEngineArrows(!showEngineArrows)}
            role="switch"
            aria-checked={showEngineArrows}
            aria-label={showEngineArrows ? "Hide hint arrows" : "Show hint arrows"}
            className="min-h-[36px] flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-neutral-400">Hints</span>
            <span className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
              showEngineArrows ? 'bg-emerald-500' : 'bg-neutral-800'
            }`}>
              <span
                className={`w-4 h-4 rounded-full bg-white shadow transform duration-200 ${
                  showEngineArrows ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Commentary line */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentPlyIndex}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.14 }}
          className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium"
        >
          {currentPly
            ? (currentPly.comment || "Balanced position with active chances for both sides.")
            : "Pick any move or press play. Drag squares on the board to draw arrows, or tap to clear them."}
        </motion.p>
      </AnimatePresence>
    </div>
  );

  // Overview Tab Body (Graph + Accuracy Split + Move Quality Table)
  const renderOverviewTabBody = () => (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-neutral-800">
      {/* Evaluation Graph */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Score Graph</span>
          <span className="text-[11px] font-mono text-neutral-500 tabular-nums">{plies.length} moves</span>
        </div>
        <EvaluationGraph 
          plies={plies} 
          currentPlyIndex={currentPlyIndex} 
          onMoveClick={(index) => {
            setIsPlaying(false);
            setCurrentPlyIndex(index);
          }} 
        />
      </div>

      {/* Accuracies Split Bar */}
      <div className="w-full flex rounded-2xl overflow-hidden border border-neutral-800 shadow-sm">
        <div className="flex-1 min-w-0 bg-green-500/10 p-3.5 sm:p-4 flex flex-col items-center justify-center border-r border-neutral-800/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400/90 mb-1 truncate max-w-full">
            {summary.whitePlayer || 'White'}
          </span>
          <span className="text-2xl sm:text-4xl leading-none font-black text-white tracking-tight tabular-nums">
            {moveStats.whiteAccuracy}%
          </span>
        </div>

        <div className="flex-1 min-w-0 bg-red-500/10 p-3.5 sm:p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 mb-1 truncate max-w-full">
            {summary.blackPlayer || 'Black'}
          </span>
          <span className="text-2xl sm:text-4xl leading-none font-black text-white tracking-tight tabular-nums">
            {moveStats.blackAccuracy}%
          </span>
        </div>
      </div>

      {/* Quality Breakdown */}
      <div>
        <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-neutral-850 text-xs font-bold gap-2">
          <div className="flex items-center gap-1.5 text-neutral-300 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-400 shrink-0" />
            <span className="truncate" title={summary.whitePlayer}>
              {summary.whitePlayer || 'White'}
            </span>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-extrabold shrink-0">
            Moves
          </div>

          <div className="flex items-center gap-1.5 text-neutral-300 min-w-0 flex-1 justify-end text-right">
            <span className="truncate" title={summary.blackPlayer}>
              {summary.blackPlayer || 'Black'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-600 shrink-0" />
          </div>
        </div>

        <div className="space-y-0.5 mt-2">
          {categories.map((cat) => {
            const whiteCount = moveStats.whiteCounts[cat.key] || 0;
            const blackCount = moveStats.blackCounts[cat.key] || 0;
            
            const maxCount = Math.max(
              1,
              ...categories.map(c => Math.max(moveStats.whiteCounts[c.key] || 0, moveStats.blackCounts[c.key] || 0))
            );
            const whiteWidth = `${(whiteCount / maxCount) * 100}%`;
            const blackWidth = `${(blackCount / maxCount) * 100}%`;

            const barColorClass =
              cat.key === 'brilliant' || cat.key === 'great' || cat.key === 'best' ? 'bg-green-500' :
              cat.key === 'excellent' || cat.key === 'good' || cat.key === 'book' ? 'bg-blue-500' :
              cat.key === 'inaccuracy' ? 'bg-yellow-500' :
              cat.key === 'mistake' ? 'bg-orange-500' : 'bg-red-500';

            return (
              <div
                key={cat.key}
                className="flex items-center justify-between py-1 px-1.5 sm:px-2 rounded-lg hover:bg-neutral-800/40 transition-colors group"
              >
                <div className="flex-1 min-w-0 relative h-7 flex items-center justify-end pr-2">
                  <div
                    className={`absolute right-0 top-0.5 bottom-0.5 opacity-15 rounded-l-md transition-all duration-500 ease-out group-hover:opacity-25 ${barColorClass}`}
                    style={{ width: whiteWidth }}
                  />
                  <span
                    className={`relative z-10 font-black text-sm sm:text-base tabular-nums ${
                      whiteCount > 0 ? cat.textClass : 'text-neutral-600'
                    }`}
                  >
                    {whiteCount}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 w-24 sm:w-28 mx-1 sm:mx-2 shrink-0">
                  <ChessAnnotationIcon type={cat.key} size="0.82rem" />
                  <span className={`text-[11px] font-bold tracking-wide truncate ${cat.textClass}`}>
                    {cat.label}
                  </span>
                </div>

                <div className="flex-1 min-w-0 relative h-7 flex items-center justify-start pl-2">
                  <div
                    className={`absolute left-0 top-0.5 bottom-0.5 opacity-15 rounded-r-md transition-all duration-500 ease-out group-hover:opacity-25 ${barColorClass}`}
                    style={{ width: blackWidth }}
                  />
                  <span
                    className={`relative z-10 font-black text-sm sm:text-base tabular-nums ${
                      blackCount > 0 ? cat.textClass : 'text-neutral-600'
                    }`}
                  >
                    {blackCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Moves Tab Body
  const renderMovesListBody = () => (
    <div 
      ref={moveListRef}
      className="w-full h-full overflow-y-auto p-3.5 sm:p-5 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800"
    >
      <div className="grid grid-cols-12 text-[10px] font-bold text-neutral-500 uppercase tracking-wider pb-2 border-b border-neutral-850 mb-2">
        <div className="col-span-2">#</div>
        <div className="col-span-5">White</div>
        <div className="col-span-5">Black</div>
      </div>

      {/* Start Row */}
      <button
        onClick={() => { setIsPlaying(false); setCurrentPlyIndex(0); }}
        className={`w-full min-h-[44px] grid grid-cols-12 items-center px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
          currentPlyIndex === 0
            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25'
            : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
        }`}
      >
        <div className="col-span-2 font-mono text-neutral-500 tabular-nums">0.</div>
        <div className="col-span-10">Start</div>
      </button>

      {/* Move Pairs */}
      {movePairs.map((pair) => {
        const wPly = pair.whitePly;
        const bPly = pair.blackPly;

        const isWhiteActive = currentPlyIndex === wPly?.plyIndex;
        const isBlackActive = bPly && currentPlyIndex === bPly.plyIndex;

        return (
          <div 
            key={pair.moveNum}
            className="grid grid-cols-12 items-center text-xs border-b border-neutral-900/30 last:border-0 py-0.5"
          >
            <div className="col-span-2 font-mono font-bold text-neutral-500 py-1.5 tabular-nums">
              {pair.moveNum}.
            </div>

            <div className="col-span-5 pr-1">
              {wPly && (
                <button
                  id={`ply-row-${wPly.plyIndex}`}
                  onClick={() => { setIsPlaying(false); setCurrentPlyIndex(wPly.plyIndex); }}
                  className={`w-full min-h-[40px] text-left py-1.5 px-2 rounded-lg font-bold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    isWhiteActive
                      ? 'bg-blue-600 text-white font-black shadow shadow-blue-600/20'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="truncate">{wPly.san}</span>
                  {renderInlineBadge(wPly.annotation)}
                </button>
              )}
            </div>

            <div className="col-span-5 pl-1">
              {bPly ? (
                <button
                  id={`ply-row-${bPly.plyIndex}`}
                  onClick={() => { setIsPlaying(false); setCurrentPlyIndex(bPly.plyIndex); }}
                  className={`w-full min-h-[40px] text-left py-1.5 px-2 rounded-lg font-bold flex items-center justify-between gap-1 transition-all cursor-pointer ${
                    isBlackActive
                      ? 'bg-blue-600 text-white font-black shadow shadow-blue-600/20'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="truncate">{bPly.san}</span>
                  {renderInlineBadge(bPly.annotation)}
                </button>
              ) : (
                <span className="text-neutral-600 select-none px-2">...</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Load Tab Body
  const renderLoadGameBody = () => (
    <div className="w-full h-full flex flex-col p-4 sm:p-5">
      {isAnalyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-5 bg-neutral-900/60 rounded-xl border border-neutral-850">
          <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Reviewing Game...</h4>
          <p className="text-xs text-amber-400 font-mono mb-4">{analysisStep}</p>
          
          {currentEvalInfo && (
            <div className="text-[11px] text-neutral-400 font-mono mb-4 bg-black/40 border border-neutral-850 rounded-xl px-3.5 py-2.5 space-y-1 text-left max-w-xs w-full tabular-nums">
              <div className="flex justify-between">
                <span>Depth:</span>
                <span className="text-white font-bold">{currentEvalInfo.depth} / {depth}</span>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="text-emerald-400 font-bold">{formatEvalLabel(currentEvalInfo.scoreText)}</span>
              </div>
              <div className="truncate">
                <span>Line:</span> <span className="text-neutral-500">{currentEvalInfo.pv}</span>
              </div>
            </div>
          )}

          <div className="w-full max-w-xs h-2 bg-neutral-800 rounded-full overflow-hidden mb-1.5">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-neutral-400 tabular-nums">{analysisProgress}%</span>

          <button
            onClick={handleStopAnalysis}
            className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
          >
            Stop
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between gap-4">
          {/* Source Selector Pills */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-850">
            {(['pgn', 'fen', 'chesscom', 'lichess'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLoadType(type)}
                className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
                  loadType === type
                    ? 'bg-[#1a1d24] text-white border border-neutral-700/80 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {type === 'pgn' ? 'PGN' :
                 type === 'fen' ? 'FEN' :
                 type === 'chesscom' ? 'Chess.com' : 'Lichess'}
              </button>
            ))}
          </div>

          {/* Input Content */}
          <div className="flex-1 flex flex-col justify-center">
            {loadType === 'pgn' ? (
              <div className="space-y-2 w-full">
                <div className="relative h-44 sm:h-52 w-full">
                  <textarea
                    value={pgnText}
                    onChange={(e) => setPgnText(e.target.value)}
                    placeholder="Paste your PGN here..."
                    className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/60 resize-none"
                  />
                  {!pgnText.trim() && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                      <FileText className="w-7 h-7 text-neutral-700 mb-1.5" />
                      <p className="text-xs text-neutral-500">Paste PGN text to review a game</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={loadSamplePgn}
                    className="min-h-[36px] text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
            ) : loadType === 'fen' ? (
              <div className="space-y-2 w-full">
                <label className="text-xs text-neutral-400 font-bold block">FEN Position</label>
                <input
                  type="text"
                  value={fenText}
                  onChange={(e) => setFenText(e.target.value)}
                  placeholder="e.g. r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
                  className="w-full min-h-[48px] bg-neutral-900 border border-neutral-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-bold block">
                    {loadType === 'chesscom' ? 'Chess.com Username' : 'Lichess Username'}
                  </label>
                  <input
                    type="text"
                    value={importUsername}
                    onChange={(e) => setImportUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    placeholder="Enter username..."
                    className="w-full min-h-[48px] bg-neutral-900 border border-neutral-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none"
                  />
                </div>
                
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={isLoadingGames || !importUsername.trim()}
                    className="min-h-[44px] px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 disabled:bg-neutral-900 disabled:text-neutral-700 border border-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isLoadingGames ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Find Games
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Analyze CTA */}
          <div className="border-t border-neutral-900 pt-3 mt-auto">
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
              className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-900 disabled:text-neutral-700 border border-transparent text-neutral-950 text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              Analyze
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      
      {/* Matchup Header + Single Settings Button */}
      <div className="flex items-start sm:items-center justify-between border-b border-neutral-900 pb-4 mb-5 sm:mb-7 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="flex items-center gap-1.5 min-w-0">
              {summary.whiteFlair && (
                <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 rounded-full shadow-md select-none shrink-0" title={`Lichess Flair: ${summary.whiteFlair}`}>
                  <LichessFlair flair={summary.whiteFlair} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              )}
              <span className="truncate max-w-[180px] sm:max-w-none">{summary.whitePlayer}</span>
            </span>
            <span className="text-neutral-500 text-sm sm:text-base font-normal">vs</span>
            <span className="flex items-center gap-1.5 min-w-0">
              {summary.blackFlair && (
                <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 rounded-full shadow-md select-none shrink-0" title={`Lichess Flair: ${summary.blackFlair}`}>
                  <LichessFlair flair={summary.blackFlair} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              )}
              <span className="text-neutral-300 truncate max-w-[180px] sm:max-w-none">{summary.blackPlayer}</span>
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-xs text-neutral-400 font-medium">
            <span>{summary.event}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="tabular-nums">{summary.date}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-emerald-400 font-bold tabular-nums">{summary.result}</span>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
            showSettings 
              ? 'bg-emerald-500 border-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/15' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
          title="Engine Settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-rose-300">Error</h4>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed break-words">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="min-h-[40px] min-w-[40px] flex items-center justify-center text-rose-400 hover:text-rose-300 cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Main 2-Zone Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Eval Bar + Chessboard + Opening Caption + Playback + Notes */}
        <div className="col-span-1 lg:col-span-5 flex flex-col items-center gap-3.5 sm:gap-4">
          
          {/* Vertical Eval Bar + Chessboard */}
          <div className="flex gap-2 sm:gap-3.5 w-full items-stretch justify-center max-w-[530px]">
            
            {/* Vertical Eval Bar */}
            <div className={`w-6 sm:w-8 md:w-9 shrink-0 bg-neutral-900 rounded-xl overflow-hidden flex ${orientation === 'white' ? 'flex-col' : 'flex-col-reverse'} justify-between border border-neutral-800/80 shadow-inner relative`} title="Evaluation bar">
              {/* Black Fill */}
              <div className="flex-1 bg-neutral-950 transition-all duration-300 relative">
                {evalPercentage < 50 && (
                  <span className={`absolute ${orientation === 'white' ? 'top-1.5 sm:top-2' : 'bottom-1.5 sm:bottom-2'} left-0 right-0 text-[8px] sm:text-[10px] font-bold font-mono text-white text-center select-none z-10 leading-none px-0.5 tabular-nums`}>
                    {activeEvalLabel}
                  </span>
                )}
              </div>
              
              {/* Equal midline */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-700/50 z-20 pointer-events-none" />

              {/* White Fill */}
              <div 
                className={`bg-neutral-100 transition-all duration-300 relative flex ${orientation === 'white' ? 'flex-col' : 'flex-col-reverse'} justify-end`}
                style={{ height: `${evalPercentage}%` }}
              >
                {evalPercentage >= 50 && (
                  <span className={`absolute ${orientation === 'white' ? 'bottom-1.5 sm:bottom-2' : 'top-1.5 sm:top-2'} left-0 right-0 text-[8px] sm:text-[10px] font-bold font-mono text-neutral-900 text-center select-none z-10 leading-none px-0.5 tabular-nums`}>
                    {activeEvalLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Chessboard */}
            <div className="flex-1 min-w-0 max-w-[480px] flex flex-col gap-2">
              <Chessboard 
                board={currentBoardState}
                fen={currentPly ? currentPly.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
                fromSquare={fromSquare}
                toSquare={toSquare}
                annotation={currentPly?.annotation}
                orientation={orientation}
                onUserArrowToggle={handleUserArrowToggle}
                onClearUserArrows={handleClearUserArrows}
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
              {openingName && (
                <p className="text-xs text-neutral-400 truncate px-1 text-left">
                  <span className="text-neutral-500 font-medium">Opening:</span>{' '}
                  <span className="text-neutral-200 font-semibold">{openingName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Clean Playback Controls (No Draw Button) */}
          <div className="w-full max-w-[520px] bg-[#12141a] border border-neutral-800/80 rounded-2xl p-2.5 sm:p-3 shadow-lg">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full">
              <button
                onClick={() => setOrientation(prev => prev === 'white' ? 'black' : 'white')}
                className="h-11 sm:h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Flip Board (F)"
                aria-label="Flip Board"
              >
                <Repeat className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <button
                onClick={handleFirst}
                disabled={currentPlyIndex === 0}
                className="h-11 sm:h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="First Move"
                aria-label="First move"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentPlyIndex === 0}
                className="h-11 sm:h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Previous Move (←)"
                aria-label="Previous move"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`h-11 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer border shadow-md active:scale-95 ${
                  isPlaying 
                    ? 'bg-blue-600 border-blue-500 hover:bg-blue-700 text-white' 
                    : 'bg-emerald-500 border-emerald-400 hover:bg-emerald-400 text-neutral-950'
                }`}
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNext}
                disabled={currentPlyIndex === totalPlies}
                className="h-11 sm:h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Next Move (→)"
                aria-label="Next move"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleLast}
                disabled={currentPlyIndex === totalPlies}
                className="h-11 sm:h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-neutral-900 text-neutral-300 flex items-center justify-center transition-all cursor-pointer border border-neutral-800/60 active:scale-95"
                title="Last Move"
                aria-label="Last move"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className={`h-11 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer border active:scale-95 ${
                  isMuted 
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300' 
                    : 'bg-neutral-900 border-neutral-800 text-emerald-400 hover:text-emerald-300'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </button>
            </div>
          </div>

          {/* Compact Notes & Hints Strip */}
          {renderNotesStrip()}
        </div>

        {/* RIGHT COLUMN: Unified Single Panel (Moves | Overview | Load) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-4 text-left min-w-0 w-full max-w-[520px] mx-auto lg:max-w-none">

          {/* Settings Drawer */}
          <AnimatePresence>
            {showSettings && (
              isDesktopLg ? (
                <motion.div 
                  className="bg-[#12141a] border border-emerald-500/30 rounded-2xl p-5 shadow-xl"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderSettingsContent()}
                </motion.div>
              ) : (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSettings(false)}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 w-full sm:max-w-lg bg-[#12141a] border border-emerald-500/30 rounded-t-3xl sm:rounded-2xl p-5 pb-7 sm:pb-5 shadow-2xl max-h-[85dvh] overflow-y-auto"
                  >
                    <div className="w-10 h-1.5 bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />
                    {renderSettingsContent()}
                  </motion.div>
                </div>
              )
            )}
          </AnimatePresence>

          {/* Unified Single Inspector Panel */}
          <div className="bg-[#12141a] border border-neutral-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl min-h-[420px] lg:h-[620px]">
            {/* Top Tab Strip */}
            <div
              data-no-page-swipe="true"
              className="flex items-center justify-between gap-2 bg-neutral-950 border-b border-neutral-850 p-1.5"
            >
              <div className="grid grid-cols-3 gap-1 flex-1 sm:flex-none sm:flex">
                <button
                  type="button"
                  onClick={() => setPanelTab('moves')}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    panelTab === 'moves'
                      ? 'bg-[#1a1d24] text-white border border-neutral-700/80 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Moves
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('overview')}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    panelTab === 'overview'
                      ? 'bg-[#1a1d24] text-white border border-neutral-700/80 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('load')}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    panelTab === 'load'
                      ? 'bg-[#1a1d24] text-white border border-neutral-700/80 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Load
                </button>
              </div>

              {isAnalyzing ? (
                <div className="flex items-center gap-2 pr-1.5 shrink-0">
                  {currentEvalInfo && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 tabular-nums">
                      <Activity className="w-3.5 h-3.5" />
                      {(currentEvalInfo.nps / 1000).toFixed(0)}k
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleStopAnalysis}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/25 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <span className="hidden sm:inline text-[11px] font-mono text-neutral-500 pr-2.5 tabular-nums shrink-0">
                  {plies.length} moves
                </span>
              )}
            </div>

            {/* Slim live progress bar while running */}
            {isAnalyzing && (
              <div className="w-full h-1 bg-neutral-900">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            )}

            {/* Panel Body */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {panelTab === 'moves' && renderMovesListBody()}
              {panelTab === 'overview' && renderOverviewTabBody()}
              {panelTab === 'load' && renderLoadGameBody()}
            </div>
          </div>

        </div>
      </div>

      {/* PICK A GAME MODAL (Bottom Sheet on Mobile, Centered Dialog on sm+) */}
      <AnimatePresence>
        {isGameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGameModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 35, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full sm:max-w-lg bg-[#141517] border border-neutral-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] z-10"
            >
              {/* Mobile drag affordance */}
              <div className="w-10 h-1.5 bg-neutral-700 rounded-full mx-auto mt-3 sm:hidden" />

              {/* Close Button */}
              <button
                onClick={() => setIsGameModalOpen(false)}
                className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                aria-label="Close game list"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-neutral-850 text-center">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Pick a Game</h3>
                <p className="text-[11px] text-neutral-450 font-medium font-mono mt-1 truncate px-10">
                  {loadType === 'chesscom' ? 'Chess.com' : 'Lichess'} &gt; {importUsername}
                </p>
                
                {/* Date switcher pagination: <- July 2026 -> */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3 bg-neutral-950/50 border border-neutral-850/60 rounded-xl px-2 py-1 w-fit mx-auto">
                  <button
                    onClick={handlePrevMonth}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-white min-w-[115px] tabular-nums">
                    {new Date(importYear, importMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content / Games List */}
              <div className="p-3.5 sm:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 flex-1">
                {isLoadingGames ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
                    <p className="text-xs text-neutral-400 font-mono">Fetching recent chess games...</p>
                  </div>
                ) : importError ? (
                  <div className="py-4 px-2">
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
                  <div className="space-y-2 pb-4 sm:pb-0">
                    {importedGames.map((game) => {
                      const isWin = game.isWin;
                      const isDraw = game.isDraw;
                      
                      return (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => handleImportedGameSelect(game.pgn)}
                          className="w-full text-left flex items-center justify-between gap-2.5 p-3 min-h-[60px] bg-neutral-900/40 hover:bg-neutral-900/80 active:bg-neutral-900 border border-neutral-850/50 hover:border-neutral-750 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                            {/* Paper airplane icon */}
                            <div className="w-8 h-8 rounded-lg bg-neutral-950/60 hidden xs:flex sm:flex items-center justify-center shrink-0 border border-neutral-850/40 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
                              <Send className="w-3.5 h-3.5 text-neutral-400 rotate-45 transform group-hover:text-blue-400 transition-colors" />
                            </div>

                            {/* Players */}
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-2.5 h-2.5 bg-white rounded-sm shrink-0 shadow border border-neutral-200" />
                                <span className="text-neutral-200 text-xs font-bold truncate" title={game.white}>
                                  {game.white}
                                </span>
                                <span className="text-neutral-500 text-[10px] font-mono shrink-0 tabular-nums">({game.whiteRating})</span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-2.5 h-2.5 bg-neutral-900 border border-neutral-700 rounded-sm shrink-0 shadow" />
                                <span className="text-neutral-300 text-xs font-medium truncate" title={game.black}>
                                  {game.black}
                                </span>
                                <span className="text-neutral-500 text-[10px] font-mono shrink-0 tabular-nums">({game.blackRating})</span>
                              </div>
                            </div>
                          </div>

                          {/* Date + Result */}
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium tabular-nums">
                              {game.date}
                            </span>

                            <span className={`w-7 h-7 flex items-center justify-center rounded-lg font-extrabold text-xs leading-none select-none ${
                              isWin
                                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                : isDraw
                                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isWin ? '+' : isDraw ? '=' : '-'}
                            </span>
                          </div>
                        </button>
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

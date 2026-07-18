/**
 * MoveLens Chess Review Types
 */

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type BoardSquare = ChessPiece | null;
export type BoardState = BoardSquare[][]; // 8x8 matrix (0,0 is a8, 7,7 is h1)

export type AnnotationType = 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'book' | 'inaccuracy' | 'mistake' | 'miss' | 'blunder' | 'normal';

export interface Ply {
  plyIndex: number;      // 1-based index (1 = White's first move, 2 = Black's first move, etc.)
  moveNum: number;       // Move number (1, 2, 3, etc.)
  color: 'w' | 'b';
  san: string;           // Standard Algebraic Notation, e.g., "e4"
  annotation: AnnotationType;
  comment?: string;      // Optional explanation comment
  boardState: BoardState;
  fromSquare?: [number, number]; // [row, col]
  toSquare?: [number, number];   // [row, col]
  fen?: string;          // FEN string for the position
  scoreText?: string;    // Stockfish evaluation score text
}

export interface Arrow {
  startSquare: string;
  endSquare: string;
  color: string;
}

export interface GameSummary {
  whitePlayer: string;
  blackPlayer: string;
  result: string;
  date: string;
  event: string;
  brilliantCount: number;
  greatCount: number;
  bestCount: number;
  excellentCount: number;
  goodCount: number;
  bookCount: number;
  inaccuracyCount: number;
  mistakeCount: number;
  missCount: number;
  blunderCount: number;
  whiteFlair?: string;
  blackFlair?: string;
}

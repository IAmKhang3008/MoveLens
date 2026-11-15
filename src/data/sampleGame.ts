import { BoardState, BoardSquare, Ply, GameSummary, AnnotationType } from '../types';
import { Chess } from 'chess.js';

// Helper to create initial standard board setup
export function getInitialBoardState(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (row 0)
  board[0][0] = { type: 'r', color: 'b' };
  board[0][1] = { type: 'n', color: 'b' };
  board[0][2] = { type: 'b', color: 'b' };
  board[0][3] = { type: 'q', color: 'b' };
  board[0][4] = { type: 'k', color: 'b' };
  board[0][5] = { type: 'b', color: 'b' };
  board[0][6] = { type: 'n', color: 'b' };
  board[0][7] = { type: 'r', color: 'b' };

  // Black pawns (row 1)
  for (let c = 0; c < 8; c++) {
    board[1][c] = { type: 'p', color: 'b' };
  }

  // White pawns (row 6)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: 'p', color: 'w' };
  }

  // White pieces (row 7)
  board[7][0] = { type: 'r', color: 'w' };
  board[7][1] = { type: 'n', color: 'w' };
  board[7][2] = { type: 'b', color: 'w' };
  board[7][3] = { type: 'q', color: 'w' };
  board[7][4] = { type: 'k', color: 'w' };
  board[7][5] = { type: 'b', color: 'w' };
  board[7][6] = { type: 'n', color: 'w' };
  board[7][7] = { type: 'r', color: 'w' };

  return board;
}

// Clone board state
function cloneBoard(board: BoardState): BoardState {
  return board.map(row => row.map(square => square ? { ...square } : null));
}

export const gameSummary: GameSummary = {
  whitePlayer: "Paul Morphy",
  blackPlayer: "Duke of Brunswick & Count Isouard",
  result: "1-0",
  date: "1858.11.02",
  event: "Paris Opera House",
  brilliantCount: 1,
  greatCount: 1,
  bestCount: 22,
  excellentCount: 0,
  goodCount: 0,
  bookCount: 4,
  inaccuracyCount: 1,
  mistakeCount: 2,
  missCount: 0,
  blunderCount: 2,
};

// Raw description of plies to feed the generator
interface RawPly {
  moveNum: number;
  color: 'w' | 'b';
  san: string;
  annotation: AnnotationType;
  comment?: string;
  scoreText?: string;
  from: [number, number];
  to: [number, number];
  special?: 'castle-queenside' | 'capture-enpassant';
}

const rawPlies: RawPly[] = [
  // 1. e4 e5
  { moveNum: 1, color: 'w', san: "e4", annotation: 'book', scoreText: '+0.20', comment: "Claims central space and opens lines for the queen and bishop.", from: [6, 4], to: [4, 4] },
  { moveNum: 1, color: 'b', san: "e5", annotation: 'book', scoreText: '+0.22', comment: "Solid central reply contesting the center directly.", from: [1, 4], to: [3, 4] },
  
  // 2. Nf3 d6
  { moveNum: 2, color: 'w', san: "Nf3", annotation: 'book', scoreText: '+0.30', comment: "Develops a knight, attacks e5, and prepares to castle.", from: [7, 6], to: [5, 5] },
  { moveNum: 2, color: 'b', san: "d6", annotation: 'book', scoreText: '+0.45', comment: "Philidor Defense. Solid, though it cramps Black's dark-squared bishop.", from: [1, 3], to: [2, 3] },
  
  // 3. d4 Bg4?!
  { moveNum: 3, color: 'w', san: "d4", annotation: 'best', scoreText: '+0.55', comment: "Strikes the center right away to keep the initiative.", from: [6, 3], to: [4, 3] },
  { moveNum: 3, color: 'b', san: "Bg4?!", annotation: 'inaccuracy', scoreText: '+1.10', comment: "A slight inaccuracy. Releasing central tension with exd4 was safer.", from: [0, 2], to: [4, 6] },
  
  // 4. dxe5 Bxf3
  { moveNum: 4, color: 'w', san: "dxe5", annotation: 'best', scoreText: '+1.15', comment: "Trades central pawns and forces Black's bishop to commit.", from: [4, 3], to: [3, 4] },
  { moveNum: 4, color: 'b', san: "Bxf3", annotation: 'best', scoreText: '+1.10', comment: "Removes the knight to avoid losing material on d5.", from: [4, 6], to: [5, 5] },
  
  // 5. Qxf3 dxe5
  { moveNum: 5, color: 'w', san: "Qxf3", annotation: 'best', scoreText: '+1.15', comment: "Recaptures actively with the queen aimed at f7.", from: [7, 3], to: [5, 5] },
  { moveNum: 5, color: 'b', san: "dxe5", annotation: 'best', scoreText: '+1.20', comment: "Wins back the pawn, leaving Black behind in development.", from: [2, 3], to: [3, 4] },
  
  // 6. Bc4 Nf6
  { moveNum: 6, color: 'w', san: "Bc4", annotation: 'best', scoreText: '+1.25', comment: "Develops with tempo and threatens checkmate on f7.", from: [7, 5], to: [4, 2] },
  { moveNum: 6, color: 'b', san: "Nf6", annotation: 'best', scoreText: '+1.20', comment: "Blocks the mate threat while developing a knight.", from: [0, 6], to: [2, 5] },
  
  // 7. Qb3 Qe7
  { moveNum: 7, color: 'w', san: "Qb3", annotation: 'best', scoreText: '+1.35', comment: "Forks f7 and b7, keeping Black tied down.", from: [5, 5], to: [5, 1] },
  { moveNum: 7, color: 'b', san: "Qe7", annotation: 'mistake', scoreText: '+2.40', comment: "Guards f7, but blocks the f8 bishop and stalls development.", from: [0, 3], to: [1, 4] },
  
  // 8. Nc3 c6
  { moveNum: 8, color: 'w', san: "Nc3", annotation: 'best', scoreText: '+2.30', comment: "Skips the b7 pawn in favor of fast piece development.", from: [7, 1], to: [5, 2] },
  { moveNum: 8, color: 'b', san: "c6", annotation: 'best', scoreText: '+2.40', comment: "Covers d5 and protects b7, though Black's pieces stay passive.", from: [1, 2], to: [2, 2] },
  
  // 9. Bg5 b5
  { moveNum: 9, color: 'w', san: "Bg5", annotation: 'best', scoreText: '+2.50', comment: "Pins the f6 knight to maximize pressure down the d-file.", from: [7, 2], to: [3, 6] },
  { moveNum: 9, color: 'b', san: "b5", annotation: 'mistake', scoreText: '+4.20', comment: "Tries to push the bishop back, leaving the queenside exposed.", from: [1, 1], to: [3, 1] },
  
  // 10. Nxb5 cxb5
  { moveNum: 10, color: 'w', san: "Nxb5", annotation: 'best', scoreText: '+4.30', comment: "Sacrifices a knight to tear open lines against Black's king.", from: [5, 2], to: [3, 1] },
  { moveNum: 10, color: 'b', san: "cxb5", annotation: 'best', scoreText: '+4.35', comment: "Accepts the knight, leaving Black's king stranded in the center.", from: [2, 2], to: [3, 1] },
  
  // 11. Bxb5+ Nbd7
  { moveNum: 11, color: 'w', san: "Bxb5+", annotation: 'best', scoreText: '+4.45', comment: "Delivers check and wins back a pawn with full attacking momentum.", from: [4, 2], to: [3, 1] },
  { moveNum: 11, color: 'b', san: "Nbd7", annotation: 'best', scoreText: '+4.50', comment: "Blocks the check, creating a difficult pin along the diagonal.", from: [0, 1], to: [1, 3] },
  
  // 12. O-O-O Rd8
  { moveNum: 12, color: 'w', san: "O-O-O", annotation: 'best', scoreText: '+5.20', comment: "Castles queenside and swings a rook straight onto the d-file.", from: [7, 4], to: [7, 2], special: 'castle-queenside' },
  { moveNum: 12, color: 'b', san: "Rd8", annotation: 'best', scoreText: '+5.40', comment: "Adds support to the pinned knight on d7.", from: [0, 0], to: [0, 3] },
  
  // 13. Rxd7 Rxd7
  { moveNum: 13, color: 'w', san: "Rxd7", annotation: 'great', scoreText: '+5.80', comment: "Sacrifices the exchange to remove a key defender.", from: [7, 3], to: [1, 3] },
  { moveNum: 13, color: 'b', san: "Rxd7", annotation: 'best', scoreText: '+5.90', comment: "Recaptures with the rook, now pinned to the king.", from: [0, 3], to: [1, 3] },
  
  // 14. Rd1 Qe6
  { moveNum: 14, color: 'w', san: "Rd1", annotation: 'best', scoreText: '+6.10', comment: "Doubles pressure on the pinned d7 rook.", from: [7, 7], to: [7, 3] },
  { moveNum: 14, color: 'b', san: "Qe6", annotation: 'blunder', scoreText: 'M3', comment: "Attempts to unpin the queen, allowing a forced mate in 3.", from: [1, 4], to: [2, 4] },
  
  // 15. Bxd7+ Nxd7
  { moveNum: 15, color: 'w', san: "Bxd7+", annotation: 'best', scoreText: 'M2', comment: "Checks the king and strips away the d7 defender.", from: [3, 1], to: [1, 3] },
  { moveNum: 15, color: 'b', san: "Nxd7", annotation: 'best', scoreText: 'M2', comment: "Must block the check, deflecting the knight away from e8.", from: [2, 5], to: [1, 3] },
  
  // 16. Qb8+!! Nxb8
  { moveNum: 16, color: 'w', san: "Qb8+!!", annotation: 'brilliant', scoreText: 'M1', comment: "A brilliant queen sacrifice to deflect the final defender of d8!", from: [5, 1], to: [0, 1] },
  { moveNum: 16, color: 'b', san: "Nxb8", annotation: 'best', scoreText: 'M1', comment: "Forced capture, leaving d8 undefended.", from: [1, 3], to: [0, 1] },
  
  // 17. Rd8#
  { moveNum: 17, color: 'w', san: "Rd8#", annotation: 'best', scoreText: 'M0', comment: "Checkmate! Supported by the g5 bishop, the rook ends the game.", from: [7, 3], to: [0, 3] }
];

// Generate plies with pre-calculated board states
export function generatePlies(): Ply[] {
  const plies: Ply[] = [];
  let currentBoard = getInitialBoardState();
  const chess = new Chess();

  rawPlies.forEach((rp, idx) => {
    try {
      chess.move(rp.san);
    } catch (e) {
      console.warn("Failed to apply move in sample game generation:", rp.san, e);
    }
    const fen = chess.fen();

    const nextBoard = cloneBoard(currentBoard);
    const [fromR, fromC] = rp.from;
    const [toR, toC] = rp.to;

    const movingPiece = nextBoard[fromR][fromC];

    if (rp.special === 'castle-queenside') {
      if (rp.color === 'w') {
        // King from 7,4 to 7,2
        nextBoard[7][2] = nextBoard[7][4];
        nextBoard[7][4] = null;
        // Rook from 7,0 to 7,3
        nextBoard[7][3] = nextBoard[7][0];
        nextBoard[7][0] = null;
      } else {
        // King from 0,4 to 0,2
        nextBoard[0][2] = nextBoard[0][4];
        nextBoard[0][4] = null;
        // Rook from 0,0 to 0,3
        nextBoard[0][3] = nextBoard[0][0];
        nextBoard[0][0] = null;
      }
    } else {
      // Normal move
      nextBoard[toR][toC] = movingPiece;
      nextBoard[fromR][fromC] = null;
    }

    plies.push({
      plyIndex: idx + 1,
      moveNum: rp.moveNum,
      color: rp.color,
      san: rp.san,
      annotation: rp.annotation,
      comment: rp.comment,
      scoreText: rp.scoreText,
      boardState: nextBoard,
      fromSquare: rp.from,
      toSquare: rp.to,
      fen: fen,
    });

    currentBoard = nextBoard;
  });

  return plies;
}

export const generatedPlies = generatePlies();

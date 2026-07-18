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
  from: [number, number];
  to: [number, number];
  special?: 'castle-queenside' | 'capture-enpassant';
}

const rawPlies: RawPly[] = [
  // 1. e4 e5
  { moveNum: 1, color: 'w', san: "e4", annotation: 'book', comment: "The most popular opening move, claiming space in the center.", from: [6, 4], to: [4, 4] },
  { moveNum: 1, color: 'b', san: "e5", annotation: 'book', comment: "Classic reply, contesting the center directly.", from: [1, 4], to: [3, 4] },
  
  // 2. Nf3 d6
  { moveNum: 2, color: 'w', san: "Nf3", annotation: 'book', comment: "Developing a piece, attacking e5, and preparing castling.", from: [7, 6], to: [5, 5] },
  { moveNum: 2, color: 'b', san: "d6", annotation: 'book', comment: "The Philidor Defense. Solid, but cramps Black's dark-squared bishop.", from: [1, 3], to: [2, 3] },
  
  // 3. d4 Bg4?!
  { moveNum: 3, color: 'w', san: "d4", annotation: 'best', comment: "Striking at the center immediately to seize the initiative.", from: [6, 3], to: [4, 3] },
  { moveNum: 3, color: 'b', san: "Bg4?!", annotation: 'inaccuracy', comment: "A slight inaccuracy. Better was exd4, releasing the tension.", from: [0, 2], to: [4, 6] },
  
  // 4. dxe5 Bxf3
  { moveNum: 4, color: 'w', san: "dxe5", annotation: 'best', comment: "Exchanging central pawns. Black's reply is practically forced.", from: [4, 3], to: [3, 4] },
  { moveNum: 4, color: 'b', san: "Bxf3", annotation: 'best', comment: "Eliminating the knight to prevent tactical problems on d5.", from: [4, 6], to: [5, 5] },
  
  // 5. Qxf3 dxe5
  { moveNum: 5, color: 'w', san: "Qxf3", annotation: 'best', comment: "Recapturing with the queen, keeping an active eye on the kingside.", from: [7, 3], to: [5, 5] },
  { moveNum: 5, color: 'b', san: "dxe5", annotation: 'best', comment: "Regaining the pawn, but Black remains behind in development.", from: [2, 3], to: [3, 4] },
  
  // 6. Bc4 Nf6
  { moveNum: 6, color: 'w', san: "Bc4", annotation: 'best', comment: "Developing with tempo, threatening mate on f7!", from: [7, 5], to: [4, 2] },
  { moveNum: 6, color: 'b', san: "Nf6", annotation: 'best', comment: "Developing and blocking the mate threat. Essential defense.", from: [0, 6], to: [2, 5] },
  
  // 7. Qb3 Qe7
  { moveNum: 7, color: 'w', san: "Qb3", annotation: 'best', comment: "Morphy creates a double attack on f7 and b7. Powerful pressure!", from: [5, 5], to: [5, 1] },
  { moveNum: 7, color: 'b', san: "Qe7", annotation: 'mistake', comment: "Defends f7, but blocks the f8 bishop and cramps Black's kingside.", from: [0, 3], to: [1, 4] },
  
  // 8. Nc3 c6
  { moveNum: 8, color: 'w', san: "Nc3", annotation: 'best', comment: "Declining to win b7 right away. Morphy prioritizes rapid development.", from: [7, 1], to: [5, 2] },
  { moveNum: 8, color: 'b', san: "c6", annotation: 'best', comment: "Supports d5 and covers the b7 pawn, but delays development.", from: [1, 2], to: [2, 2] },
  
  // 9. Bg5 b5
  { moveNum: 9, color: 'w', san: "Bg5", annotation: 'best', comment: "Pinning the f6 knight to maximize pressure on the d-file.", from: [7, 2], to: [3, 6] },
  { moveNum: 9, color: 'b', san: "b5", annotation: 'mistake', comment: "An aggressive push that backfires. Black tries to kick the bishop, but compromises the queenside.", from: [1, 1], to: [3, 1] },
  
  // 10. Nxb5 cxb5
  { moveNum: 10, color: 'w', san: "Nxb5", annotation: 'best', comment: "A brilliant piece sacrifice! Morphy realizes the value of time over material.", from: [5, 2], to: [3, 1] },
  { moveNum: 10, color: 'b', san: "cxb5", annotation: 'best', comment: "Accepting the sacrifice, but Black's king remains exposed.", from: [2, 2], to: [3, 1] },
  
  // 11. Bxb5+ Nbd7
  { moveNum: 11, color: 'w', san: "Bxb5+", annotation: 'best', comment: "Delivering check and winning back material with great development.", from: [4, 2], to: [3, 1] },
  { moveNum: 11, color: 'b', san: "Nbd7", annotation: 'best', comment: "Blocking the check with the knight. Pinned to the king.", from: [0, 1], to: [1, 3] },
  
  // 12. O-O-O Rd8
  { moveNum: 12, color: 'w', san: "O-O-O", annotation: 'best', comment: "Castling queenside brings the rook directly into the attack. Brutal!", from: [7, 4], to: [7, 2], special: 'castle-queenside' },
  { moveNum: 12, color: 'b', san: "Rd8", annotation: 'best', comment: "Defending the pinned knight on d7.", from: [0, 0], to: [0, 3] },
  
  // 13. Rxd7 Rxd7
  { moveNum: 13, color: 'w', san: "Rxd7", annotation: 'great', comment: "Exchanging on d7 to remove a defender and maintain maximum pin pressure.", from: [7, 3], to: [1, 3] },
  { moveNum: 13, color: 'b', san: "Rxd7", annotation: 'best', comment: "Recapturing with the rook. Pinned by Morphy's g5 bishop.", from: [0, 3], to: [1, 3] },
  
  // 14. Rd1 Qe6
  { moveNum: 14, color: 'w', san: "Rd1", annotation: 'best', comment: "Bringing the second rook to the d-file. Tripling down on the pinned rook!", from: [7, 7], to: [7, 3] },
  { moveNum: 14, color: 'b', san: "Qe6", annotation: 'blunder', comment: "A fatal blunder, trying to unpin but it allows a gorgeous mate.", from: [1, 4], to: [2, 4] },
  
  // 15. Bxd7+ Nxd7
  { moveNum: 15, color: 'w', san: "Bxd7+", annotation: 'best', comment: "Delivering check. The rook falls and the king is fully stripped of defense.", from: [3, 1], to: [1, 3] },
  { moveNum: 15, color: 'b', san: "Nxd7", annotation: 'best', comment: "The knight recaptures, blocking the check, but it deflects from e8.", from: [2, 5], to: [1, 3] },
  
  // 16. Qb8+!! Nxb8
  { moveNum: 16, color: 'w', san: "Qb8+!!", annotation: 'brilliant', comment: "An absolutely stunning queen sacrifice to force the final mate pattern!", from: [5, 1], to: [0, 1] },
  { moveNum: 16, color: 'b', san: "Nxb8", annotation: 'best', comment: "Forced response. The knight must capture.", from: [1, 3], to: [0, 1] },
  
  // 17. Rd8#
  { moveNum: 17, color: 'w', san: "Rd8#", annotation: 'best', comment: "Checkmate! The lone rook delivers mate supported by the pinned g5 bishop. Masterpiece!", from: [7, 3], to: [0, 3] }
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

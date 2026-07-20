import React, { useRef, useState, useEffect } from 'react';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { BoardState, AnnotationType, Arrow } from '../types';
import ChessAnnotationIcon from './ChessAnnotationIcon';

// Import Chessground CSS
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

interface ChessboardProps {
  board: BoardState;
  fen?: string;
  fromSquare?: [number, number];
  toSquare?: [number, number];
  orientation?: 'white' | 'black';
  arePiecesDraggable?: boolean;
  arrows?: Arrow[];
  onArrowsChange?: (args: { arrows: Arrow[] }) => void;
  annotation?: AnnotationType;
}

// Convert 8x8 BoardState matrix to a fallback FEN string
function boardToFen(board: BoardState): string {
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    let rowStr = '';
    for (let c = 0; c < 8; c++) {
      const square = board[r][c];
      if (square === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const letter = square.type;
        const char = square.color === 'w' ? letter.toUpperCase() : letter.toLowerCase();
        rowStr += char;
      }
    }
    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    rows.push(rowStr);
  }
  return rows.join('/') + ' w KQkq - 0 1';
}

export default function Chessboard({
  board,
  fen,
  fromSquare,
  toSquare,
  orientation = 'white',
  arePiecesDraggable = false,
  arrows = [],
  onArrowsChange,
  annotation,
}: ChessboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [boardWidth, setBoardWidth] = useState<number>(440);

  // ResizeObserver to ensure the container scales correctly
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setBoardWidth(width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Redraw Chessground when size changes
  useEffect(() => {
    if (cgRef.current) {
      cgRef.current.redrawAll();
    }
  }, [boardWidth]);

  // Convert [row, col] matrix coords to Chess algebraic square strings (e.g. 'e4')
  const coordsToSquare = (coords?: [number, number]): string | null => {
    if (!coords) return null;
    const [row, col] = coords;
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  };

  const fromSquareAlg = coordsToSquare(fromSquare);
  const toSquareAlg = coordsToSquare(toSquare);

  const resolvedFen = fen || boardToFen(board);

  // Map incoming Arrow prop to Chessground autoShapes
  const getBrushForColor = (color: string): string => {
    if (color.includes('220') || color.includes('160') || color.includes('100') || color.includes('green') || color.includes('rgb(0, 2')) {
      return 'green';
    }
    if (color.includes('red') || color.includes('255, 0, 0') || color.includes('239, 68, 68')) {
      return 'red';
    }
    if (color.includes('blue') || color.includes('59, 130, 246') || color.includes('0, 0, 255')) {
      return 'blue';
    }
    if (color.includes('orange')) {
      return 'orange';
    }
    return 'yellow';
  };

  const autoShapes = React.useMemo(() => {
    return arrows.map(arr => ({
      orig: arr.startSquare as any,
      dest: arr.endSquare as any,
      brush: getBrushForColor(arr.color),
    }));
  }, [arrows]);

  const highlightConfig = React.useMemo(() => {
    if (!fromSquareAlg || !toSquareAlg) {
      return { lastMove: false, custom: new Map<string, string>() };
    }

    const configMap: Record<string, { move: string; from: string }> = {
      normal: { move: 'normal-move', from: 'normal-from' },
      brilliant: { move: 'brilliant-move', from: 'brilliant-from' },
      great: { move: 'great-move', from: 'great-from' },
      best: { move: 'best-move', from: 'best-from' },
      excellent: { move: 'excellent-move', from: 'excellent-from' },
      good: { move: 'good-move', from: 'good-from' },
      inaccuracy: { move: 'inaccuracy-move', from: 'inaccuracy-from' },
      mistake: { move: 'mistake-move', from: 'mistake-from' },
      blunder: { move: 'blunder-move', from: 'blunder-from' },
      miss: { move: 'miss-move', from: 'miss-from' },
      forced: { move: 'forced-move', from: 'forced-from' },
      book: { move: 'book-move', from: 'book-from' },
    };

    const activeAnnotation = annotation && configMap[annotation] ? annotation : 'normal';
    const highlight = configMap[activeAnnotation];

    const customMap = new Map<string, string>();
    customMap.set(fromSquareAlg, highlight.from);
    customMap.set(toSquareAlg, highlight.move);

    return {
      lastMove: false,
      custom: customMap
    };
  }, [annotation, fromSquareAlg, toSquareAlg]);

  // Initialize and update Chessground instance
  useEffect(() => {
    if (!boardRef.current) return;

    const handleDrawableChange = (shapes: any[]) => {
      if (!onArrowsChange) return;
      const mappedArrows: Arrow[] = shapes
        .filter(s => s.orig && s.dest)
        .map(s => {
          let color = 'rgb(255, 170, 0)'; // default orange/yellow
          if (s.brush === 'green') color = 'rgb(0, 220, 0)';
          else if (s.brush === 'red') color = 'rgb(255, 0, 0)';
          else if (s.brush === 'blue') color = 'rgb(0, 0, 255)';
          
          return {
            startSquare: s.orig,
            endSquare: s.dest,
            color: color
          };
        });
      onArrowsChange({ arrows: mappedArrows });
    };

    if (!cgRef.current) {
      cgRef.current = Chessground(boardRef.current, {
        fen: resolvedFen,
        orientation: orientation,
        viewOnly: !arePiecesDraggable,
        coordinates: true,
        lastMove: highlightConfig.lastMove && fromSquareAlg && toSquareAlg ? [fromSquareAlg as any, toSquareAlg as any] : undefined,
        highlight: {
          lastMove: highlightConfig.lastMove,
          custom: highlightConfig.custom as any,
        },
        drawable: {
          enabled: true,
          visible: true,
          autoShapes: autoShapes,
          onChange: handleDrawableChange,
        },
      });
    } else {
      cgRef.current.set({
        fen: resolvedFen,
        orientation: orientation,
        viewOnly: !arePiecesDraggable,
        lastMove: highlightConfig.lastMove && fromSquareAlg && toSquareAlg ? [fromSquareAlg as any, toSquareAlg as any] : undefined,
        highlight: {
          lastMove: highlightConfig.lastMove,
          custom: highlightConfig.custom as any,
        },
        drawable: {
          autoShapes: autoShapes,
        },
      });
    }
  }, [resolvedFen, orientation, arePiecesDraggable, fromSquareAlg, toSquareAlg, autoShapes, onArrowsChange, highlightConfig]);

  // Clean up Chessground on unmount
  useEffect(() => {
    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full max-w-[440px] md:max-w-[480px] bg-[#1a1a1a] p-3 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col justify-between select-none"
    >
      <div className="relative w-full h-full rounded-lg border border-neutral-900">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <div ref={boardRef} className="cg-wrap brown cburnett w-full h-full" />
        </div>
        
        {/* Absolute 3D Move Annotation Badge Overlay */}
        {toSquare && annotation && annotation !== 'normal' && (() => {
          const leftCol = orientation === 'white' ? toSquare[1] : 7 - toSquare[1];
          const topRow = orientation === 'white' ? toSquare[0] : 7 - toSquare[0];
          
          return (
            <div
              className="absolute z-30 pointer-events-none drop-shadow-[0_2.5px_4px_rgba(0,0,0,0.4)] animate-scale-in"
              style={{
                left: `${(leftCol + 1) * 12.5}%`,
                top: `${topRow * 12.5}%`,
                width: '8.5%',
                height: '8.5%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <ChessAnnotationIcon type={annotation} size="100%" />
            </div>
          );
        })()}
      </div>
      {/* Outer border visual accent overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-none rounded-2xl border-2 border-neutral-800" />
    </div>
  );
}

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
  onUserArrowToggle?: (startSquare: string, endSquare: string) => void;
  onClearUserArrows?: () => void;
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
  onUserArrowToggle,
  onClearUserArrows,
}: ChessboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; sq: string } | null>(null);
  const [boardWidth, setBoardWidth] = useState<number>(440);
  const [dragOrigin, setDragOrigin] = useState<string | null>(null);
  const [dragHover, setDragHover] = useState<string | null>(null);

  // Reset in-flight drag preview when position or orientation changes
  useEffect(() => {
    pointerStartRef.current = null;
    setDragOrigin(null);
    setDragHover(null);
  }, [fen, orientation]);

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

  // Convert pointer clientX/Y inside the board square grid to algebraic square
  const pointerToSquare = (clientX: number, clientY: number): string | null => {
    const target = overlayRef.current || boardRef.current;
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null;

    const col = Math.min(7, Math.max(0, Math.floor(relX * 8)));
    const row = Math.min(7, Math.max(0, Math.floor(relY * 8)));
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const fileIdx = orientation === 'white' ? col : 7 - col;
    const rankIdx = orientation === 'white' ? row : 7 - row;
    return files[fileIdx] + ranks[rankIdx];
  };

  // Get square center percentage [0..100] for SVG preview overlay
  const squareCenterPercent = (sq: string): { x: number; y: number } | null => {
    if (!sq || sq.length < 2) return null;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const fileIdx = files.indexOf(sq[0]);
    const rankIdx = ranks.indexOf(sq[1]);
    if (fileIdx === -1 || rankIdx === -1) return null;

    const col = orientation === 'white' ? fileIdx : 7 - fileIdx;
    const row = orientation === 'white' ? rankIdx : 7 - rankIdx;
    return {
      x: (col + 0.5) * 12.5,
      y: (row + 0.5) * 12.5,
    };
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

  // Unified free pointer drawing (drag between squares to draw/toggle, tap board to clear)
  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (arePiecesDraggable) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    const sq = pointerToSquare(e.clientX, e.clientY);
    if (!sq) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events without active pointer capture support
    }
    pointerStartRef.current = { x: e.clientX, y: e.clientY, sq };
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    e.stopPropagation();
    const sq = pointerToSquare(e.clientX, e.clientY);
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (dist > 8 || (sq && sq !== start.sq)) {
      if (dragOrigin !== start.sq) setDragOrigin(start.sq);
      if (sq !== dragHover) setDragHover(sq);
    }
  };

  const handleBoardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    e.stopPropagation();
    const endSq = pointerToSquare(e.clientX, e.clientY);
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);

    if (endSq && endSq !== start.sq) {
      onUserArrowToggle?.(start.sq, endSq);
    } else if (dist < 10) {
      onClearUserArrows?.();
    }

    pointerStartRef.current = null;
    setDragOrigin(null);
    setDragHover(null);
  };

  const originCenter = dragOrigin ? squareCenterPercent(dragOrigin) : null;
  const hoverCenter = dragHover && dragHover !== dragOrigin ? squareCenterPercent(dragHover) : null;

  return (
    <div
      ref={containerRef}
      data-no-page-swipe="true"
      className="relative aspect-square w-full max-w-[440px] md:max-w-[480px] bg-[#1a1a1a] p-2 sm:p-3 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col justify-between select-none"
    >
      <div className="relative w-full h-full rounded-lg border border-neutral-900">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <div ref={boardRef} className="cg-wrap brown cburnett w-full h-full" />
        </div>

        {/* Always-active Pointer Overlay for Free Arrow Drawing & Tap-to-Clear */}
        {!arePiecesDraggable && (
          <div
            ref={overlayRef}
            data-no-page-swipe="true"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            onPointerCancel={() => {
              pointerStartRef.current = null;
              setDragOrigin(null);
              setDragHover(null);
            }}
            className="absolute inset-0 z-20 touch-none cursor-pointer rounded-lg"
            aria-label="Chessboard surface (drag between squares for arrows, tap to clear)"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none">
              <defs>
                <marker id="draw-preview-head" markerWidth="3.5" markerHeight="3.5" refX="2.2" refY="1.75" orient="auto">
                  <polygon points="0 0, 3.5 1.75, 0 3.5" fill="rgba(255, 170, 0, 0.9)" />
                </marker>
              </defs>
              {originCenter && (
                <circle
                  cx={originCenter.x}
                  cy={originCenter.y}
                  r="4.5"
                  fill="rgba(255, 170, 0, 0.2)"
                  stroke="rgba(255, 170, 0, 0.85)"
                  strokeWidth="0.9"
                />
              )}
              {originCenter && hoverCenter && (
                <line
                  x1={originCenter.x}
                  y1={originCenter.y}
                  x2={hoverCenter.x}
                  y2={hoverCenter.y}
                  stroke="rgba(255, 170, 0, 0.85)"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  markerEnd="url(#draw-preview-head)"
                />
              )}
            </svg>
          </div>
        )}
        
        {/* Absolute Move Annotation Badge Overlay */}
        {toSquare && annotation && annotation !== 'normal' && (() => {
          const leftCol = orientation === 'white' ? toSquare[1] : 7 - toSquare[1];
          const topRow = orientation === 'white' ? toSquare[0] : 7 - toSquare[0];
          
          return (
            <div
              className="absolute z-30 pointer-events-none animate-scale-in"
              style={{
                left: `${(leftCol + 1) * 12.5}%`,
                top: `${topRow * 12.5}%`,
                width: '6.2%',
                height: '6.2%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <ChessAnnotationIcon type={annotation} size="100%" glow="board" />
            </div>
          );
        })()}
      </div>
    </div>
  );
}

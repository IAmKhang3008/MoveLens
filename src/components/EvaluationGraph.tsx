import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Ply } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EvaluationGraphProps {
  plies: Ply[];
  currentPlyIndex: number;
  onMoveClick: (index: number) => void;
}

const parseScore = (scoreText?: string): number => {
  if (!scoreText) return 0;
  const trimmed = scoreText.trim();
  if (/^-M\d+$/i.test(trimmed) || /^M-\d+$/i.test(trimmed)) return -10;
  if (/^\+?M\d+$/i.test(trimmed)) return 10;
  const val = parseFloat(trimmed.replace('+', ''));
  if (isNaN(val)) return 0;
  return Math.max(-10, Math.min(10, val));
};

const MOVE_COLORS: Record<string, string> = {
  brilliant: '#22c55e',
  great: '#22c55e',
  best: '#334155',
  excellent: '#334155',
  good: '#334155',
  book: '#334155',
  inaccuracy: '#eab308',
  mistake: '#f97316',
  blunder: '#ef4444',
  miss: '#ef4444',
  normal: '#334155'
};

export default function EvaluationGraph({ plies, currentPlyIndex, onMoveClick }: EvaluationGraphProps) {
  const [data, setData] = useState<any>({ labels: [], datasets: [] });
  const chartRef = useRef<any>(null);
  const isScrubbingRef = useRef<boolean>(false);

  useEffect(() => {
    const labels: string[] = ['Start'];
    const scores: number[] = [0.1];
    const pointColors: string[] = ['#888888'];
    const radii: number[] = [0];
    const hoverRadii: number[] = [0];

    plies.forEach((ply, i) => {
      labels.push(ply.san || `Move ${i + 1}`);
      scores.push(parseScore(ply.scoreText));
      
      const annotation = ply.annotation || 'normal';
      if (annotation === 'normal' || annotation === 'best' || annotation === 'excellent' || annotation === 'good' || annotation === 'book') {
        pointColors.push(MOVE_COLORS['normal']);
        radii.push(0);
        hoverRadii.push(4);
      } else {
        pointColors.push(MOVE_COLORS[annotation] || MOVE_COLORS['normal']);
        radii.push(3);
        hoverRadii.push(6);
      }
    });

    setData({
      labels: labels,
      datasets: [{
        data: scores,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: radii,
        pointHoverRadius: hoverRadii,
        borderColor: '#4a4a4a',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(151, 187, 75, 0.15)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
          gradient.addColorStop(1, 'rgba(199, 50, 46, 0.15)');
          return gradient;
        }
      }]
    });
  }, [plies]);

  const selectIndexFromClientX = (clientX: number) => {
    const chart = chartRef.current;
    if (!chart || !chart.scales?.x || !chart.canvas) return;
    const rect = chart.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const rawIdx = chart.scales.x.getValueForPixel(x);
    if (typeof rawIdx !== 'number' || isNaN(rawIdx)) return;
    const clampedIdx = Math.max(0, Math.min(plies.length, Math.round(rawIdx)));
    onMoveClick(clampedIdx);
  };

  const options = {
    animation: false as const,
    responsive: true,
    maintainAspectRatio: false,
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'] as const,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'min-max',
        samples: 100
      },
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context: any) {
            const idx = context.dataIndex;
            const rawScore = idx > 0 ? plies[idx - 1]?.scoreText : undefined;
            if (rawScore && /^-?M-?\d+$/i.test(rawScore.trim())) {
              if (rawScore === 'M0' || rawScore === '-M0') return 'Checkmate (#)';
              return rawScore.trim();
            }
            const score = context.parsed.y;
            return score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
          },
          title: function(context: any) {
            if (!context.length) return '';
            const idx = context[0].dataIndex;
            if (idx === 0) return 'Start';
            const moveNum = Math.ceil(idx / 2);
            const player = idx % 2 === 1 ? 'White' : 'Black';
            const san = context[0].label;
            return `Move ${moveNum} (${player}) • ${san}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawOnChartArea: false },
        ticks: { maxTicksLimit: 10, color: '#888', font: { size: 10 } }
      },
      y: {
        min: -10,
        max: 10,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          stepSize: 5,
          callback: function(value: any) {
            if (value === 0) return '0.00';
            return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
          },
          color: '#888',
          font: { size: 10 }
        }
      }
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0 && onMoveClick) {
        const index = elements[0].index;
        onMoveClick(index);
      }
    }
  };

  const currentMovePlugin = {
    id: 'currentMoveLine',
    afterDraw: (chart: any) => {
      if (currentPlyIndex >= 0 && chart.scales.x) {
        const ctx = chart.ctx;
        const x = chart.scales.x.getPixelForValue(currentPlyIndex);
        const top = chart.scales.y.top;
        const bottom = chart.scales.y.bottom;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4a90e2';
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  return (
    <div
      data-no-page-swipe="true"
      onPointerDown={(e) => {
        isScrubbingRef.current = true;
        selectIndexFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (isScrubbingRef.current) {
          selectIndexFromClientX(e.clientX);
        }
      }}
      onPointerUp={() => {
        isScrubbingRef.current = false;
      }}
      onPointerCancel={() => {
        isScrubbingRef.current = false;
      }}
      className="w-full h-[120px] sm:h-[140px] bg-[#121316] rounded-xl border border-neutral-800/80 p-2 relative overflow-hidden select-none touch-none cursor-pointer"
    >
      <Line ref={chartRef} data={data} options={options as any} plugins={[currentMovePlugin]} />
    </div>
  );
}

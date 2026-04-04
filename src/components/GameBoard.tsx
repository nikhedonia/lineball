import { useMemo } from 'react';
import { CELL_SIZE, PADDING } from '../constants';
import { deserializeEdge, getValidMoves, isValidPoint, topGoal, bottomGoal } from '../gameLogic';
import { useGameStore } from '../store/gameStore';
import type { Point } from '../types';
import type { MapConfig } from '../maps';

const PLAYER_FILL: Record<number, string> = { 1: '#3b82f6', 2: '#ef4444' };

function sx(x: number) { return PADDING + x * CELL_SIZE; }
function sy(y: number) { return PADDING + (y + 1) * CELL_SIZE; }

function vbWidth(map: MapConfig)  { return PADDING * 2 + map.fieldWidth  * CELL_SIZE; }
function vbHeight(map: MapConfig) { return PADDING * 2 + (map.fieldHeight + 2) * CELL_SIZE; }

function allPoints(map: MapConfig): Point[] {
  const pts: Point[] = [];
  for (let x = 0; x <= map.fieldWidth; x++)
    for (let y = 0; y <= map.fieldHeight; y++) pts.push({ x, y });
  const tg = topGoal(map);
  const bg = bottomGoal(map);
  for (let x = tg.min; x <= tg.max; x++) pts.push({ x, y: -1 });
  for (let x = bg.min; x <= bg.max; x++) pts.push({ x, y: map.fieldHeight + 1 });
  return pts;
}

function fieldBoundaryPath(map: MapConfig): string {
  const tg = topGoal(map);
  const bg = bottomGoal(map);
  return [
    `M ${sx(0)} ${sy(0)} H ${sx(tg.min)}`,
    `M ${sx(tg.max)} ${sy(0)} H ${sx(map.fieldWidth)} V ${sy(map.fieldHeight)} H ${sx(bg.max)}`,
    `M ${sx(bg.min)} ${sy(map.fieldHeight)} H ${sx(0)} V ${sy(0)}`,
  ].join(' ');
}

function goalBoxPath(side: 'top' | 'bottom', map: MapConfig): string {
  const g = side === 'top' ? topGoal(map) : bottomGoal(map);
  const yField = side === 'top' ? sy(0) : sy(map.fieldHeight);
  const yGoal  = side === 'top' ? sy(-1) : sy(map.fieldHeight + 1);
  return `M ${sx(g.min)} ${yField} V ${yGoal} H ${sx(g.max)} V ${yField}`;
}

export default function GameBoard() {
  const ball          = useGameStore((s) => s.ball);
  const usedEdges     = useGameStore((s) => s.usedEdges);
  const phase         = useGameStore((s) => s.phase);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const move          = useGameStore((s) => s.move);
  const map           = useGameStore((s) => s.mapConfig);
  const mode          = useGameStore((s) => s.mode);
  const aiPlayer      = useGameStore((s) => s.aiPlayer);

  const isAITurn = mode === 'ai' && currentPlayer === aiPlayer && phase === 'playing';

  const usedEdgesSet = useMemo(() => new Set(usedEdges), [usedEdges]);

  const validMoves = useMemo(
    () => (phase === 'playing' && !isAITurn ? getValidMoves(ball, usedEdgesSet, map) : []),
    [ball, usedEdgesSet, phase, map, isAITurn],
  );

  const points = useMemo(() => allPoints(map), [map]);

  const wallSegs = useMemo(() => {
    return map.walls.map((key) => {
      const [aPart, bPart] = key.split('|');
      const [x1, y1] = aPart.split('_').map(Number);
      const [x2, y2] = bPart.split('_').map(Number);
      return { x1, y1, x2, y2 };
    });
  }, [map]);

  const ballFill = PLAYER_FILL[currentPlayer];
  const tg = topGoal(map);
  const bg = bottomGoal(map);
  const topGoalCenterX   = sx((tg.min + tg.max) / 2);
  const bottomGoalCenterX = sx((bg.min + bg.max) / 2);

  const W = vbWidth(map);
  const H = vbHeight(map);

  return (
    /* wrapper fills remaining space in the flex column, SVG scales inside it */
    <div className="board-wrapper">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="board-svg"
        style={{ display: 'block' }}
      >
        {/* ── Goal fills ── */}
        <rect x={sx(tg.min)} y={sy(-1)}
          width={(tg.max - tg.min) * CELL_SIZE} height={CELL_SIZE}
          fill="rgba(59,130,246,0.15)" />
        <rect x={sx(bg.min)} y={sy(map.fieldHeight)}
          width={(bg.max - bg.min) * CELL_SIZE} height={CELL_SIZE}
          fill="rgba(239,68,68,0.15)" />

        {/* ── Grid lines ── */}
        {Array.from({ length: map.fieldHeight + 1 }, (_, y) => (
          <line key={`hl-${y}`} x1={sx(0)} y1={sy(y)} x2={sx(map.fieldWidth)} y2={sy(y)}
            stroke="#d1d5db" strokeWidth={0.5} />
        ))}
        {Array.from({ length: map.fieldWidth + 1 }, (_, x) => (
          <line key={`vl-${x}`} x1={sx(x)} y1={sy(0)} x2={sx(x)} y2={sy(map.fieldHeight)}
            stroke="#d1d5db" strokeWidth={0.5} />
        ))}

        {/* ── Field boundary + goal boxes ── */}
        <path d={fieldBoundaryPath(map)} fill="none" stroke="#374151" strokeWidth={2.5} strokeLinecap="round" />
        <path d={goalBoxPath('top', map)} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
        <path d={goalBoxPath('bottom', map)} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />

        {/* ── Goal labels ── */}
        <text x={topGoalCenterX}    y={sy(-1) + CELL_SIZE / 2 + 5} textAnchor="middle" fontSize={11} fill="#3b82f6" fontWeight="bold">P1 Goal</text>
        <text x={bottomGoalCenterX} y={sy(map.fieldHeight + 1) - CELL_SIZE / 2 + 8} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight="bold">P2 Goal</text>

        {/* ── Wall edges (inner obstacles) ── */}
        {wallSegs.map((w, i) => (
          <line key={`wall-${i}`}
            x1={sx(w.x1)} y1={sy(w.y1)} x2={sx(w.x2)} y2={sy(w.y2)}
            stroke={map.wallColor ?? '#7c3aed'} strokeWidth={3} strokeLinecap="round" />
        ))}

        {/* ── Used edges ── */}
        {usedEdges.map((key) => {
          const [a, b] = deserializeEdge(key);
          return (
            <line key={key} x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)}
              stroke="#111827" strokeWidth={2.5} strokeLinecap="round" />
          );
        })}

        {/* ── Grid dots ── */}
        {points.filter((p) => isValidPoint(p.x, p.y, map)).map((p) => (
          <circle key={`dot-${p.x}_${p.y}`} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill="#9ca3af" />
        ))}

        {/* ── Valid move targets ── */}
        {validMoves.map((p) => (
          <circle key={`vm-${p.x}_${p.y}`} cx={sx(p.x)} cy={sy(p.y)} r={14}
            fill="rgba(34,197,94,0.25)" stroke="rgba(34,197,94,0.7)" strokeWidth={1.5}
            style={{ cursor: 'pointer' }} onClick={() => move(p)} />
        ))}

        {/* ── Ball — colour matches current player ── */}
        <circle cx={sx(ball.x)} cy={sy(ball.y)} r={9}
          fill={isAITurn ? '#9ca3af' : ballFill}
          stroke="#1f2937" strokeWidth={2} />

        {isAITurn && (
          <text x={sx(ball.x)} y={sy(ball.y) - 16} textAnchor="middle" fontSize={11} fill="#6b7280">
            thinking…
          </text>
        )}
      </svg>
    </div>
  );
}

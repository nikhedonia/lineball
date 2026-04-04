import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Circle, Path, Text as SvgText } from 'react-native-svg';
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
  const ball = useGameStore((s) => s.ball);
  const usedEdges = useGameStore((s) => s.usedEdges);
  const phase = useGameStore((s) => s.phase);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const move = useGameStore((s) => s.move);
  const map = useGameStore((s) => s.mapConfig);
  const mode = useGameStore((s) => s.mode);
  const aiPlayer = useGameStore((s) => s.aiPlayer);

  const [layoutWidth, setLayoutWidth] = useState(0);

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
  const topGoalCenterX = sx((tg.min + tg.max) / 2);
  const bottomGoalCenterX = sx((bg.min + bg.max) / 2);
  const W = vbWidth(map);
  const H = vbHeight(map);

  const svgWidth = layoutWidth > 0 ? layoutWidth : W;
  const svgHeight = layoutWidth > 0 ? (layoutWidth / W) * H : H;

  return (
    <View
      style={styles.boardWrapper}
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
    >
      {layoutWidth > 0 && (
        <Svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <Rect x={sx(tg.min)} y={sy(-1)} width={(tg.max - tg.min) * CELL_SIZE} height={CELL_SIZE} fill="rgba(59,130,246,0.15)" />
          <Rect x={sx(bg.min)} y={sy(map.fieldHeight)} width={(bg.max - bg.min) * CELL_SIZE} height={CELL_SIZE} fill="rgba(239,68,68,0.15)" />
          {Array.from({ length: map.fieldHeight + 1 }, (_, y) => (
            <Line key={`hl-${y}`} x1={sx(0)} y1={sy(y)} x2={sx(map.fieldWidth)} y2={sy(y)} stroke="#d1d5db" strokeWidth={0.5} />
          ))}
          {Array.from({ length: map.fieldWidth + 1 }, (_, x) => (
            <Line key={`vl-${x}`} x1={sx(x)} y1={sy(0)} x2={sx(x)} y2={sy(map.fieldHeight)} stroke="#d1d5db" strokeWidth={0.5} />
          ))}
          {(map.deadZoneVisuals ?? map.blockedZones)?.map((z, i) => (
            <Rect key={`zone-${i}`} x={sx(z.x1)} y={sy(z.y1)} width={(z.x2 - z.x1) * CELL_SIZE} height={(z.y2 - z.y1) * CELL_SIZE} fill="#e5e7eb" />
          ))}
          <Path d={fieldBoundaryPath(map)} fill="none" stroke="#374151" strokeWidth={2.5} strokeLinecap="round" />
          <Path d={goalBoxPath('top', map)} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
          <Path d={goalBoxPath('bottom', map)} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
          <SvgText x={topGoalCenterX} y={sy(-1) + CELL_SIZE / 2 + 5} textAnchor="middle" fontSize={11} fill="#3b82f6" fontWeight="bold">P1 Goal</SvgText>
          <SvgText x={bottomGoalCenterX} y={sy(map.fieldHeight + 1) - CELL_SIZE / 2 + 8} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight="bold">P2 Goal</SvgText>
          {wallSegs.map((w, i) => (
            <Line key={`wall-${i}`} x1={sx(w.x1)} y1={sy(w.y1)} x2={sx(w.x2)} y2={sy(w.y2)} stroke={map.wallColor ?? '#7c3aed'} strokeWidth={3} strokeLinecap="round" />
          ))}
          {usedEdges.map((key) => {
            const [a, b] = deserializeEdge(key);
            return <Line key={key} x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)} stroke="#111827" strokeWidth={2.5} strokeLinecap="round" />;
          })}
          {points.filter((p) => isValidPoint(p.x, p.y, map)).map((p) => (
            <Circle key={`dot-${p.x}_${p.y}`} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill="#9ca3af" />
          ))}
          {validMoves.map((p) => (
            <Circle
              key={`vm-${p.x}_${p.y}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={14}
              fill="rgba(34,197,94,0.25)"
              stroke="rgba(34,197,94,0.7)"
              strokeWidth={1.5}
              onPress={() => move(p)}
            />
          ))}
          <Circle cx={sx(ball.x)} cy={sy(ball.y)} r={9} fill={isAITurn ? '#9ca3af' : ballFill} stroke="#1f2937" strokeWidth={2} />
          {isAITurn && (
            <SvgText x={sx(ball.x)} y={sy(ball.y) - 16} textAnchor="middle" fontSize={11} fill="#6b7280">thinking…</SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boardWrapper: { flex: 1, width: '100%', maxWidth: 480 },
});

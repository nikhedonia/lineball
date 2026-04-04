import type { Point, Player } from './types';
import type { MapConfig } from './maps';

// ── Edge serialisation ────────────────────────────────────────────────────────

export function serializeEdge(p1: Point, p2: Point): string {
  let a = p1, b = p2;
  if (a.x > b.x || (a.x === b.x && a.y > b.y)) [a, b] = [b, a];
  return `${a.x}_${a.y}|${b.x}_${b.y}`;
}

export function deserializeEdge(key: string): [Point, Point] {
  const [aPart, bPart] = key.split('|');
  const [x1, y1] = aPart.split('_').map(Number);
  const [x2, y2] = bPart.split('_').map(Number);
  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
}

// ── Goal range helpers ────────────────────────────────────────────────────────

/** Returns the x-range of the top goal (y = -1).  Player 2 scores here. */
export function topGoal(map: MapConfig) {
  return { min: map.topGoalMinX ?? map.goalMinX, max: map.topGoalMaxX ?? map.goalMaxX };
}

/** Returns the x-range of the bottom goal (y = fieldHeight+1).  Player 1 scores here. */
export function bottomGoal(map: MapConfig) {
  return { min: map.bottomGoalMinX ?? map.goalMinX, max: map.bottomGoalMaxX ?? map.goalMaxX };
}

// ── Pre-drawn edges (boundary + map walls) ────────────────────────────────────

const predrawnCache = new Map<string, Set<string>>();

/**
 * Returns the set of edges that are permanently drawn for this map:
 *   - the outer field boundary (excluding the goal openings)
 *   - any inner wall obstacles defined by the map
 * These edges cannot be re-drawn and trigger the bounce rule.
 */
export function getPredrawnEdges(map: MapConfig): Set<string> {
  if (predrawnCache.has(map.id)) return predrawnCache.get(map.id)!;

  const edges = new Set<string>();
  const se = serializeEdge;

  const tg = topGoal(map);
  const bg = bottomGoal(map);

  // Top boundary — left of goal opening
  for (let x = 0; x < tg.min; x++)
    edges.add(se({ x, y: 0 }, { x: x + 1, y: 0 }));
  // Top boundary — right of goal opening
  for (let x = tg.max; x < map.fieldWidth; x++)
    edges.add(se({ x, y: 0 }, { x: x + 1, y: 0 }));

  // Bottom boundary — left of goal opening
  for (let x = 0; x < bg.min; x++)
    edges.add(se({ x, y: map.fieldHeight }, { x: x + 1, y: map.fieldHeight }));
  // Bottom boundary — right of goal opening
  for (let x = bg.max; x < map.fieldWidth; x++)
    edges.add(se({ x, y: map.fieldHeight }, { x: x + 1, y: map.fieldHeight }));

  // Left boundary
  for (let y = 0; y < map.fieldHeight; y++)
    edges.add(se({ x: 0, y }, { x: 0, y: y + 1 }));
  // Right boundary
  for (let y = 0; y < map.fieldHeight; y++)
    edges.add(se({ x: map.fieldWidth, y }, { x: map.fieldWidth, y: y + 1 }));

  // Map walls
  for (const w of map.walls) edges.add(w);

  predrawnCache.set(map.id, edges);
  return edges;
}

// ── Point validity ────────────────────────────────────────────────────────────

export function isValidPoint(x: number, y: number, map: MapConfig): boolean {
  if (x >= 0 && x <= map.fieldWidth && y >= 0 && y <= map.fieldHeight) return true;
  const tg = topGoal(map);
  const bg = bottomGoal(map);
  if (y === -1 && x >= tg.min && x <= tg.max) return true;
  if (y === map.fieldHeight + 1 && x >= bg.min && x <= bg.max) return true;
  return false;
}

/**
 * Returns which player wins when the ball reaches this point, or null.
 *   y === -1               → top goal    → Player 2 wins
 *   y === fieldHeight + 1  → bottom goal → Player 1 wins
 */
export function goalWinner(p: Point, map: MapConfig): Player | null {
  if (p.y === -1) return 2;
  if (p.y === map.fieldHeight + 1) return 1;
  return null;
}

// ── Move validation ───────────────────────────────────────────────────────────

/**
 * A move is valid when:
 *  1. It is a single-step adjacency (≤1 in each axis, not same point).
 *  2. The destination is a valid field point for this map.
 *  3. Moves crossing the top/bottom goal boundary keep both endpoints within
 *     the goal x-range (prevents cutting past a goal post).
 *  4. The edge is not pre-drawn (boundary or wall).
 *  5. The edge has not already been played.
 */
export function isMoveValid(
  from: Point,
  to: Point,
  usedEdges: Set<string>,
  map: MapConfig,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) return false;
  if (!isValidPoint(to.x, to.y, map)) return false;

  const crossesTop    = to.y === -1               || from.y === -1;
  const crossesBottom = to.y === map.fieldHeight + 1 || from.y === map.fieldHeight + 1;
  if (crossesTop) {
    const tg = topGoal(map);
    if (from.x < tg.min || from.x > tg.max || to.x < tg.min || to.x > tg.max) return false;
  }
  if (crossesBottom) {
    const bg = bottomGoal(map);
    if (from.x < bg.min || from.x > bg.max || to.x < bg.min || to.x > bg.max) return false;
  }

  const key = serializeEdge(from, to);
  const predrawn = getPredrawnEdges(map);
  return !predrawn.has(key) && !usedEdges.has(key);
}

export function getValidMoves(from: Point, usedEdges: Set<string>, map: MapConfig): Point[] {
  const moves: Point[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const to = { x: from.x + dx, y: from.y + dy };
      if (isMoveValid(from, to, usedEdges, map)) moves.push(to);
    }
  }
  return moves;
}

// ── Edge counting (for bounce rule) ──────────────────────────────────────────

/**
 * Counts how many edges from `allEdges` touch `point`.
 * Callers should pass the union of usedEdges and predrawnEdges so that
 * boundary lines and walls also trigger the bounce rule.
 */
export function getEdgeCount(point: Point, allEdges: Set<string>): number {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const neighbor = { x: point.x + dx, y: point.y + dy };
      if (allEdges.has(serializeEdge(point, neighbor))) count++;
    }
  }
  return count;
}

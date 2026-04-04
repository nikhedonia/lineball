import { describe, it, expect } from 'vitest';
import {
  serializeEdge,
  deserializeEdge,
  isValidPoint,
  goalWinner,
  isMoveValid,
  getValidMoves,
  getEdgeCount,
  getPredrawnEdges,
} from '../gameLogic';
import { STANDARD_MAP, MAPS } from '../maps';

const map = STANDARD_MAP;

// ── serializeEdge ─────────────────────────────────────────────────────────────

describe('serializeEdge', () => {
  it('produces the same key regardless of order', () => {
    const a = { x: 2, y: 3 }, b = { x: 3, y: 3 };
    expect(serializeEdge(a, b)).toBe(serializeEdge(b, a));
  });
  it('handles negative y', () => {
    const key = serializeEdge({ x: 3, y: 0 }, { x: 3, y: -1 });
    expect(key).toBe(serializeEdge({ x: 3, y: -1 }, { x: 3, y: 0 }));
  });
});

// ── deserializeEdge ───────────────────────────────────────────────────────────

describe('deserializeEdge', () => {
  it('round-trips a normal edge', () => {
    const p1 = { x: 1, y: 2 }, p2 = { x: 2, y: 3 };
    const [a, b] = deserializeEdge(serializeEdge(p1, p2));
    expect([a, b]).toEqual(expect.arrayContaining([p1, p2]));
  });
  it('round-trips negative y', () => {
    const p1 = { x: 4, y: -1 }, p2 = { x: 4, y: 0 };
    const [a, b] = deserializeEdge(serializeEdge(p1, p2));
    expect([a, b]).toEqual(expect.arrayContaining([p1, p2]));
  });
});

// ── isValidPoint ──────────────────────────────────────────────────────────────

describe('isValidPoint', () => {
  it('accepts main field corners', () => {
    expect(isValidPoint(0, 0, map)).toBe(true);
    expect(isValidPoint(map.fieldWidth, map.fieldHeight, map)).toBe(true);
  });
  it('accepts goal zone points', () => {
    expect(isValidPoint(map.goalMinX, -1, map)).toBe(true);
    expect(isValidPoint(map.goalMaxX, -1, map)).toBe(true);
    expect(isValidPoint(map.goalMinX, map.fieldHeight + 1, map)).toBe(true);
  });
  it('rejects out-of-bounds points', () => {
    expect(isValidPoint(-1, 5, map)).toBe(false);
    expect(isValidPoint(map.fieldWidth + 1, 5, map)).toBe(false);
    expect(isValidPoint(0, -1, map)).toBe(false);
    expect(isValidPoint(map.goalMinX - 1, -1, map)).toBe(false);
    expect(isValidPoint(map.goalMaxX + 1, -1, map)).toBe(false);
  });
});

// ── goalWinner ────────────────────────────────────────────────────────────────

describe('goalWinner', () => {
  it('top goal → player 2 wins', () => expect(goalWinner({ x: 4, y: -1 }, map)).toBe(2));
  it('bottom goal → player 1 wins', () => expect(goalWinner({ x: 4, y: map.fieldHeight + 1 }, map)).toBe(1));
  it('interior → null', () => expect(goalWinner({ x: 4, y: 6 }, map)).toBeNull());
});

// ── isMoveValid ───────────────────────────────────────────────────────────────

describe('isMoveValid', () => {
  const empty = new Set<string>();

  it('allows 8-direction moves in open interior', () => {
    const from = { x: 4, y: 6 };
    const nbrs = [
      {x:3,y:5},{x:4,y:5},{x:5,y:5},
      {x:3,y:6},          {x:5,y:6},
      {x:3,y:7},{x:4,y:7},{x:5,y:7},
    ];
    for (const to of nbrs) expect(isMoveValid(from, to, empty, map)).toBe(true);
  });

  it('rejects same point', () => {
    expect(isMoveValid({ x: 4, y: 6 }, { x: 4, y: 6 }, empty, map)).toBe(false);
  });

  it('rejects distance-2 move', () => {
    expect(isMoveValid({ x: 4, y: 6 }, { x: 4, y: 4 }, empty, map)).toBe(false);
  });

  it('rejects move outside field', () => {
    expect(isMoveValid({ x: 0, y: 5 }, { x: -1, y: 5 }, empty, map)).toBe(false);
    expect(isMoveValid({ x: map.fieldWidth, y: 5 }, { x: map.fieldWidth + 1, y: 5 }, empty, map)).toBe(false);
  });

  it('allows straight move into the top goal', () => {
    expect(isMoveValid({ x: 4, y: 0 }, { x: 4, y: -1 }, empty, map)).toBe(true);
  });

  it('blocks moving into goal outside the opening', () => {
    expect(isMoveValid({ x: 2, y: 0 }, { x: 2, y: -1 }, empty, map)).toBe(false);
    expect(isMoveValid({ x: map.goalMinX - 1, y: 0 }, { x: map.goalMinX - 1, y: -1 }, empty, map)).toBe(false);
  });

  it('blocks diagonal past the goal post', () => {
    expect(isMoveValid({ x: 2, y: 0 }, { x: 3, y: -1 }, empty, map)).toBe(false);
  });

  it('allows diagonal within the goal zone', () => {
    expect(isMoveValid({ x: 3, y: 0 }, { x: 4, y: -1 }, empty, map)).toBe(true);
  });

  it('rejects a repeated edge', () => {
    const from = { x: 4, y: 6 }, to = { x: 4, y: 5 };
    const used = new Set([serializeEdge(from, to)]);
    expect(isMoveValid(from, to, used, map)).toBe(false);
  });

  // ── Boundary-edge blocking (new rule) ──
  it('blocks moving along the top boundary (left of goal)', () => {
    expect(isMoveValid({ x: 0, y: 0 }, { x: 1, y: 0 }, empty, map)).toBe(false);
  });

  it('blocks moving along the left boundary', () => {
    expect(isMoveValid({ x: 0, y: 3 }, { x: 0, y: 4 }, empty, map)).toBe(false);
  });

  it('allows moving from boundary corner diagonally inward', () => {
    expect(isMoveValid({ x: 0, y: 0 }, { x: 1, y: 1 }, empty, map)).toBe(true);
  });

  it('allows moving from boundary midpoint into the interior', () => {
    expect(isMoveValid({ x: 0, y: 5 }, { x: 1, y: 5 }, empty, map)).toBe(true);
  });
});

// ── getValidMoves ─────────────────────────────────────────────────────────────

describe('getValidMoves', () => {
  it('returns 8 moves from interior centre', () => {
    expect(getValidMoves({ x: 4, y: 6 }, new Set(), map)).toHaveLength(8);
  });

  it('returns 1 move from top-left corner (only diagonal inward)', () => {
    const moves = getValidMoves({ x: 0, y: 0 }, new Set(), map);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({ x: 1, y: 1 });
  });

  it('excludes already-used edges', () => {
    const from = { x: 4, y: 6 }, to = { x: 4, y: 5 };
    const used = new Set([serializeEdge(from, to)]);
    const moves = getValidMoves(from, used, map);
    expect(moves.some((p) => p.x === to.x && p.y === to.y)).toBe(false);
    expect(moves).toHaveLength(7);
  });

  it('includes goal-zone entries from adjacent top-boundary point', () => {
    const moves = getValidMoves({ x: 4, y: 0 }, new Set(), map);
    expect(moves.filter((p) => p.y === -1).length).toBeGreaterThan(0);
  });
});

// ── getEdgeCount ──────────────────────────────────────────────────────────────

describe('getEdgeCount', () => {
  it('returns 0 for a fresh interior point', () => {
    expect(getEdgeCount({ x: 4, y: 6 }, new Set())).toBe(0);
  });

  it('counts one connected edge', () => {
    const pt = { x: 4, y: 6 };
    const used = new Set([serializeEdge(pt, { x: 4, y: 5 })]);
    expect(getEdgeCount(pt, used)).toBe(1);
  });

  it('counts multiple connected edges', () => {
    const pt = { x: 4, y: 6 };
    const used = new Set([
      serializeEdge(pt, { x: 4, y: 5 }),
      serializeEdge(pt, { x: 5, y: 6 }),
      serializeEdge(pt, { x: 3, y: 7 }),
    ]);
    expect(getEdgeCount(pt, used)).toBe(3);
  });

  it('counts boundary edges when predrawn set is passed', () => {
    // top-left corner (0,0) is touched by 2 boundary edges
    const predrawn = getPredrawnEdges(map);
    expect(getEdgeCount({ x: 0, y: 0 }, predrawn)).toBe(2);
  });

  it('top goal-post corner (goalMinX,0) is touched by ≥1 boundary edge', () => {
    const predrawn = getPredrawnEdges(map);
    expect(getEdgeCount({ x: map.goalMinX, y: 0 }, predrawn)).toBeGreaterThanOrEqual(1);
  });
});

// ── getPredrawnEdges ──────────────────────────────────────────────────────────

describe('getPredrawnEdges', () => {
  it('includes left boundary edges', () => {
    const pd = getPredrawnEdges(map);
    expect(pd.has(serializeEdge({ x: 0, y: 0 }, { x: 0, y: 1 }))).toBe(true);
  });

  it('does not include the goal opening', () => {
    const pd = getPredrawnEdges(map);
    // edge (goalMinX,0)-(goalMinX+1,0) is inside the goal opening — should NOT be predrawn
    expect(pd.has(serializeEdge({ x: map.goalMinX, y: 0 }, { x: map.goalMinX + 1, y: 0 }))).toBe(false);
  });

  it('includes wall edges for wall maps', () => {
    const gatesMap = MAPS.find((m: any) => m.id === 'gates')!
    const pd = getPredrawnEdges(gatesMap);
    // Upper barrier y=4, first segment (0,4)-(1,4) should be predrawn
    expect(pd.has(serializeEdge({ x: 0, y: 4 }, { x: 1, y: 4 }))).toBe(true);
    // Gap segment (3,4)-(4,4) should NOT be predrawn
    expect(pd.has(serializeEdge({ x: 3, y: 4 }, { x: 4, y: 4 }))).toBe(false);
  });
});

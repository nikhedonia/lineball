import type { Point } from './types';

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  fieldWidth: number;   // max x index  (cols = fieldWidth + 1)
  fieldHeight: number;  // max y index  (rows = fieldHeight + 1)
  /** Symmetric goal range used for BOTH top and bottom (unless overridden below). */
  goalMinX: number;
  goalMaxX: number;
  /** Optional asymmetric overrides.  When set, top goal ≠ bottom goal. */
  topGoalMinX?: number;
  topGoalMaxX?: number;
  bottomGoalMinX?: number;
  bottomGoalMaxX?: number;
  ballStart: Point;
  walls: string[];      // serialised wall edges (pre-drawn inner obstacles)
  /** Colour used to render wall edges. Defaults to purple. */
  wallColor?: string;
  /**
   * Rectangular regions where NO grid points are valid.
   * Used to create truly impenetrable boundary walls (e.g. the Z-shape).
   * Any move whose destination falls inside one of these zones is rejected.
   */
  blockedZones?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

// ── Local edge serialisation (avoids circular import with gameLogic) ──────────

function se(x1: number, y1: number, x2: number, y2: number): string {
  let ax = x1, ay = y1, bx = x2, by = y2;
  if (ax > bx || (ax === bx && ay > by)) {
    [ax, bx] = [bx, ax];
    [ay, by] = [by, ay];
  }
  return `${ax}_${ay}|${bx}_${by}`;
}

/**
 * Generates serialised edges along a straight horizontal, vertical, or
 * diagonal line from (x1,y1) to (x2,y2) (inclusive).
 */
function wallLine(x1: number, y1: number, x2: number, y2: number): string[] {
  const result: string[] = [];
  const dx = x1 === x2 ? 0 : Math.sign(x2 - x1);
  const dy = y1 === y2 ? 0 : Math.sign(y2 - y1);
  let x = x1, y = y1;
  while (x !== x2 || y !== y2) {
    result.push(se(x, y, x + dx, y + dy));
    x += dx; y += dy;
  }
  return result;
}

// ── Map definitions ───────────────────────────────────────────────────────────

export const MAPS: MapConfig[] = [
  // 1. Standard
  {
    id: 'standard',
    name: 'Standard',
    description: '9 × 13 · goal 3 wide',
    fieldWidth: 8, fieldHeight: 12,
    goalMinX: 3, goalMaxX: 5,
    ballStart: { x: 4, y: 6 },
    walls: [],
  },

  // 2. Wide Arena
  {
    id: 'wide',
    name: 'Wide Arena',
    description: '13 × 9 · goal 5 wide',
    fieldWidth: 12, fieldHeight: 8,
    goalMinX: 4, goalMaxX: 8,
    ballStart: { x: 6, y: 4 },
    walls: [],
  },

  // 3. Long Field
  {
    id: 'long',
    name: 'Long Field',
    description: '9 × 17 · goal 3 wide',
    fieldWidth: 8, fieldHeight: 16,
    goalMinX: 3, goalMaxX: 5,
    ballStart: { x: 4, y: 8 },
    walls: [],
  },

  // 4. Small Pitch
  {
    id: 'small',
    name: 'Small Pitch',
    description: '7 × 9 · goal 3 wide',
    fieldWidth: 6, fieldHeight: 8,
    goalMinX: 2, goalMaxX: 4,
    ballStart: { x: 3, y: 4 },
    walls: [],
  },

  // 5. Gates — two horizontal barriers whose gaps align with the goals
  {
    id: 'gates',
    name: 'Gates',
    description: '9 × 13 · aligned barriers',
    fieldWidth: 8, fieldHeight: 12,
    goalMinX: 3, goalMaxX: 5,
    ballStart: { x: 4, y: 6 },
    walls: [
      // upper barrier y=4 — gap at x=3..5 (aligns with goal)
      ...wallLine(0, 4, 3, 4),
      ...wallLine(5, 4, 8, 4),
      // lower barrier y=8 — same gap
      ...wallLine(0, 8, 3, 8),
      ...wallLine(5, 8, 8, 8),
    ],
  },

  // 6. Fortress — rectangular inner walls; ball starts inside the box
  {
    id: 'fortress',
    name: 'Fortress',
    description: '11 × 13 · inner box',
    fieldWidth: 10, fieldHeight: 12,
    goalMinX: 4, goalMaxX: 6,
    ballStart: { x: 5, y: 6 },
    walls: [
      ...wallLine(3, 4, 7, 4),   // top wall of box
      ...wallLine(3, 8, 7, 8),   // bottom wall of box
      ...wallLine(3, 4, 3, 8),   // left wall of box
      ...wallLine(7, 4, 7, 8),   // right wall of box
    ],
  },

  // 7. Zigzag — true Z-shaped field: top goal top-right, bottom goal bottom-left.
  //    Dead-zone corners are FULLY inaccessible (blockedZones) so no diagonal
  //    sneaking is possible.  The sealing walls also trigger bounces at corners.
  {
    id: 'zigzag',
    name: 'Zigzag',
    description: '9 × 13 · Z-shaped field',
    fieldWidth: 8, fieldHeight: 12,
    goalMinX: 1,        goalMaxX: 3,    // bottom goal — left side  (P1 scores here)
    topGoalMinX: 5,     topGoalMaxX: 7, // top goal    — right side (P2 scores here)
    ballStart: { x: 4, y: 6 },
    wallColor: '#374151',               // boundary-style dark lines
    walls: [
      ...wallLine(0, 4, 4, 4),   // seal top-left dead zone — bottom edge
      ...wallLine(4, 0, 4, 4),   // seal top-left dead zone — right edge
      ...wallLine(4, 8, 8, 8),   // seal bottom-right dead zone — top edge
      ...wallLine(4, 8, 4, 12),  // seal bottom-right dead zone — left edge
    ],
    // Points inside the dead zones — unreachable even via diagonals.
    blockedZones: [
      { x1: 0, y1: 0, x2: 3, y2: 3 },   // top-left corner
      { x1: 5, y1: 9, x2: 8, y2: 12 },  // bottom-right corner
    ],
  },
];

export const STANDARD_MAP = MAPS[0];

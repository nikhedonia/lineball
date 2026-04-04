import { describe, it, expect } from 'vitest';
import { getBestMove } from '../ai';
import { STANDARD_MAP } from '../maps';
import { serializeEdge } from '../gameLogic';

const map = STANDARD_MAP;

describe('getBestMove', () => {
  it('returns a valid adjacent point', () => {
    const ball = map.ballStart;
    const best = getBestMove(ball, [], 1, 2, map, 2);
    expect(best).not.toBeNull();
    expect(Math.abs(best!.x - ball.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(best!.y - ball.y)).toBeLessThanOrEqual(1);
  });

  it('returns null when no moves available', () => {
    const ball = { x: 1, y: 1 };
    const used: string[] = [];
    for (const [dx, dy] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
      used.push(serializeEdge(ball, { x: ball.x + dx, y: ball.y + dy }));
    // Also add boundary-unaffected edges — all moves from (1,1) are non-boundary interior
    const best = getBestMove(ball, used, 1, 1, map, 1);
    expect(best).toBeNull();
  });

  it('picks a winning move when ball is at the bottom (P1 attacks bottom)', () => {
    // Ball is at y=fieldHeight — AI can score directly or via goal-post bounce.
    // Both (goalX, fieldHeight) and (goalX, fieldHeight+1) moves are winning.
    const ball = { x: map.ballStart.x, y: map.fieldHeight };
    const best = getBestMove(ball, [], 1, 1, map, 2);
    expect(best).not.toBeNull();
    // The AI should move toward or into the goal area
    expect(best!.y).toBeGreaterThanOrEqual(map.fieldHeight - 1);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { STANDARD_MAP } from '../maps';

const map = STANDARD_MAP;

beforeEach(() => {
  useGameStore.getState().startGame('2p', 2, map, 3);
});

// ── Initial state ─────────────────────────────────────────────────────────────
describe('initial state', () => {
  it('places the ball at the map centre', () => {
    expect(useGameStore.getState().ball).toEqual(map.ballStart);
  });
  it('starts with player 1', () => expect(useGameStore.getState().currentPlayer).toBe(1));
  it('has no used edges', () => expect(useGameStore.getState().usedEdges).toHaveLength(0));
  it('phase is playing', () => expect(useGameStore.getState().phase).toBe('playing'));
});

// ── Basic move ────────────────────────────────────────────────────────────────
describe('move', () => {
  it('moves the ball and records the edge', () => {
    const to = { x: map.ballStart.x, y: map.ballStart.y - 1 };
    useGameStore.getState().move(to);
    expect(useGameStore.getState().ball).toEqual(to);
    expect(useGameStore.getState().usedEdges).toHaveLength(1);
  });
  it('switches to player 2 after a normal move', () => {
    useGameStore.getState().move({ x: map.ballStart.x, y: map.ballStart.y - 1 });
    expect(useGameStore.getState().currentPlayer).toBe(2);
  });
  it('ignores a boundary edge move when on the boundary', () => {
    // Navigate: P1→(3,5), P2→(2,4), P1→(1,3), P2→(0,2)
    // (0,2) is on the left wall boundary, triggers bounce (P2 must continue)
    useGameStore.getState().move({ x: 3, y: 5 });
    useGameStore.getState().move({ x: 2, y: 4 });
    useGameStore.getState().move({ x: 1, y: 3 });
    useGameStore.getState().move({ x: 0, y: 2 }); // P2 → bounces at left wall
    expect(useGameStore.getState().ball).toEqual({ x: 0, y: 2 });
    expect(useGameStore.getState().mustContinue).toBe(true);
    // Try to draw (0,2)→(0,3) which is a boundary edge — must be rejected
    useGameStore.getState().move({ x: 0, y: 3 });
    expect(useGameStore.getState().ball).toEqual({ x: 0, y: 2 });
  });
});

// ── Boundary bounce ───────────────────────────────────────────────────────────
describe('boundary bounce', () => {
  it('triggers bounce when landing on a boundary-adjacent point', () => {
    // Navigate to (1,1) — it is NOT on the boundary, no bounce
    useGameStore.getState().move({ x: 3, y: 5 });
    useGameStore.getState().move({ x: 2, y: 4 });
    useGameStore.getState().move({ x: 1, y: 3 });
    useGameStore.getState().move({ x: 0, y: 2 });
    // ball at (0,2) — on left boundary — should trigger bounce (predrawn touches it)
    // Actually (0,2) is ON the left boundary, so moving there triggers bounce
    // Let's verify by checking mustContinue
    // P1 moved to (0,2): predrawn edges touch (0,2) (left wall edges (0,1)-(0,2) and (0,2)-(0,3))
    expect(useGameStore.getState().mustContinue).toBe(true);
  });
});

// ── Bounce rule (interior) ────────────────────────────────────────────────────
describe('interior bounce rule', () => {
  it('keeps the same player when landing on a used-edge point', () => {
    useGameStore.getState().move({ x: 4, y: 5 }); // P1 → P2
    useGameStore.getState().move({ x: 3, y: 5 }); // P2 → P1
    useGameStore.getState().move({ x: 4, y: 6 }); // P1 bounces back to start
    expect(useGameStore.getState().currentPlayer).toBe(1);
    expect(useGameStore.getState().mustContinue).toBe(true);
  });
  it('clears mustContinue after follow-up to fresh point', () => {
    useGameStore.getState().move({ x: 4, y: 5 });
    useGameStore.getState().move({ x: 3, y: 5 });
    useGameStore.getState().move({ x: 4, y: 6 });
    useGameStore.getState().move({ x: 5, y: 7 });
    expect(useGameStore.getState().mustContinue).toBe(false);
    expect(useGameStore.getState().currentPlayer).toBe(2);
  });
});

// ── Goal win ──────────────────────────────────────────────────────────────────
describe('goal win', () => {
  it('player 1 wins via bottom goal', () => {
    const steps = map.fieldHeight - map.ballStart.y;
    for (let i = 1; i <= steps; i++)
      useGameStore.getState().move({ x: map.ballStart.x, y: map.ballStart.y + i });
    useGameStore.getState().move({ x: map.ballStart.x, y: map.fieldHeight + 1 });
    expect(useGameStore.getState().winner).toBe(1);
    expect(useGameStore.getState().phase).toBe('over');
  });
  it('player 2 wins via top goal', () => {
    for (let i = 1; i <= map.ballStart.y; i++)
      useGameStore.getState().move({ x: map.ballStart.x, y: map.ballStart.y - i });
    useGameStore.getState().move({ x: map.ballStart.x, y: -1 });
    expect(useGameStore.getState().winner).toBe(2);
    expect(useGameStore.getState().phase).toBe('over');
  });
});

// ── Game over guard ───────────────────────────────────────────────────────────
describe('game over', () => {
  it('ignores moves after game ends', () => {
    const steps = map.fieldHeight - map.ballStart.y;
    for (let i = 1; i <= steps; i++)
      useGameStore.getState().move({ x: map.ballStart.x, y: map.ballStart.y + i });
    useGameStore.getState().move({ x: map.ballStart.x, y: map.fieldHeight + 1 });
    const ballBefore = useGameStore.getState().ball;
    useGameStore.getState().move({ x: map.ballStart.x, y: map.fieldHeight });
    expect(useGameStore.getState().ball).toEqual(ballBefore);
  });
});

// ── Reset / setup ─────────────────────────────────────────────────────────────
describe('resetGame', () => {
  it('restores initial game state', () => {
    useGameStore.getState().move({ x: 4, y: 5 });
    useGameStore.getState().resetGame();
    const s = useGameStore.getState();
    expect(s.ball).toEqual(map.ballStart);
    expect(s.usedEdges).toHaveLength(0);
    expect(s.currentPlayer).toBe(1);
    expect(s.winner).toBeNull();
    expect(s.phase).toBe('playing');
  });
});

describe('startGame', () => {
  it('transitions to playing with chosen settings', () => {
    useGameStore.getState().backToSetup();
    useGameStore.getState().startGame('ai', 2, map, 5);
    const s = useGameStore.getState();
    expect(s.screen).toBe('playing');
    expect(s.mode).toBe('ai');
    expect(s.aiPlayer).toBe(2);
    expect(s.aiDepth).toBe(5);
  });
});

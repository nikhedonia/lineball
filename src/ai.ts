import type { Point, Player, GamePhase } from './types';
import type { MapConfig } from './maps';
import {
  serializeEdge,
  getEdgeCount,
  getValidMoves,
  goalWinner,
  getPredrawnEdges,
  topGoal,
  bottomGoal,
} from './gameLogic';

interface AIGameState {
  ball: Point;
  usedEdges: Set<string>;
  currentPlayer: Player;
  winner: Player | null;
  phase: GamePhase;
}

const WIN_SCORE = 100_000;

/** Negative Euclidean distance from ball to centre of AI's target goal. */
function heuristic(ball: Point, aiPlayer: Player, map: MapConfig): number {
  // P1 attacks bottom goal; P2 attacks top goal
  if (aiPlayer === 1) {
    const bg = bottomGoal(map);
    const targetX = (bg.min + bg.max) / 2;
    return -Math.sqrt((ball.x - targetX) ** 2 + (ball.y - (map.fieldHeight + 1)) ** 2);
  } else {
    const tg = topGoal(map);
    const targetX = (tg.min + tg.max) / 2;
    return -Math.sqrt((ball.x - targetX) ** 2 + (ball.y - (-1)) ** 2);
  }
}

function applyMove(state: AIGameState, to: Point, map: MapConfig, predrawn: Set<string>): AIGameState {
  const allEdges = new Set([...predrawn, ...state.usedEdges]);
  const preExistingEdges = getEdgeCount(to, allEdges);

  const newEdges = new Set(state.usedEdges);
  newEdges.add(serializeEdge(state.ball, to));

  const scorer = goalWinner(to, map);
  if (scorer !== null) {
    return { ball: to, usedEdges: newEdges, currentPlayer: state.currentPlayer, winner: scorer, phase: 'over' };
  }

  const bounce = preExistingEdges > 0;
  const nextPlayer: Player = bounce ? state.currentPlayer : (state.currentPlayer === 1 ? 2 : 1);
  return { ball: to, usedEdges: newEdges, currentPlayer: nextPlayer, winner: null, phase: 'playing' };
}

function minimax(
  state: AIGameState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
  map: MapConfig,
  predrawn: Set<string>,
): number {
  if (state.phase === 'over') {
    return state.winner === aiPlayer ? WIN_SCORE : -WIN_SCORE;
  }

  const moves = getValidMoves(state.ball, state.usedEdges, map);

  if (moves.length === 0) {
    return state.currentPlayer === aiPlayer ? -WIN_SCORE : WIN_SCORE;
  }

  if (depth === 0) {
    return heuristic(state.ball, aiPlayer, map);
  }

  const isMax = state.currentPlayer === aiPlayer;

  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      const score = minimax(applyMove(state, move, map, predrawn), depth - 1, alpha, beta, aiPlayer, map, predrawn);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const score = minimax(applyMove(state, move, map, predrawn), depth - 1, alpha, beta, aiPlayer, map, predrawn);
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getBestMove(
  ball: Point,
  usedEdges: string[],
  currentPlayer: Player,
  aiPlayer: Player,
  map: MapConfig,
  depth = 3,
): Point | null {
  const usedSet = new Set(usedEdges);
  const predrawn = getPredrawnEdges(map);

  const moves = getValidMoves(ball, usedSet, map);
  if (moves.length === 0) return null;

  const state: AIGameState = { ball, usedEdges: usedSet, currentPlayer, winner: null, phase: 'playing' };

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyMove(state, move, map, predrawn);
    const score = minimax(next, depth - 1, -Infinity, Infinity, aiPlayer, map, predrawn);
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }

  return bestMove;
}

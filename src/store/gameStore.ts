import { create } from 'zustand';
import type { GameState, Player, Point, GameMode } from '../types';
import type { MapConfig } from '../maps';
import { MAPS } from '../maps';
import {
  isMoveValid,
  getValidMoves,
  goalWinner,
  serializeEdge,
  getEdgeCount,
  getPredrawnEdges,
} from '../gameLogic';
import { trackGameStart, trackGameEnd, trackTurn } from '../analytics';

const DEPTH_TO_DIFFICULTY: Record<number, string> = { 1: 'easy', 3: 'medium', 5: 'hard' };

function getDifficulty(mode: GameMode, depth: number): string | null {
  if (mode !== 'ai') return null;
  return DEPTH_TO_DIFFICULTY[depth] ?? `depth_${depth}`;
}

function getResult(winner: Player, mode: GameMode, aiPlayer: Player): string {
  if (mode === 'ai') return winner === aiPlayer ? 'loss' : 'win';
  return `p${winner}_wins`;
}

type Screen = 'setup' | 'playing';

interface SetupState {
  screen: Screen;
  mode: GameMode;
  aiPlayer: Player;
  aiDepth: number;
  mapConfig: MapConfig;
}

interface GameActions {
  startGame: (mode: GameMode, aiPlayer: Player, mapConfig: MapConfig, aiDepth: number) => void;
  move: (to: Point) => void;
  resetGame: () => void;
  backToSetup: () => void;
}

export type GameStore = SetupState & GameState & GameActions;

const defaultSetup: SetupState = {
  screen: 'setup',
  mode: 'ai',        // AI is the default mode
  aiPlayer: 2,
  aiDepth: 3,        // medium difficulty by default
  mapConfig: MAPS[0],
};

function makeInitialGameState(map: MapConfig): GameState {
  const now = Date.now();
  return {
    ball: map.ballStart,
    usedEdges: [],
    currentPlayer: 1,
    mustContinue: false,
    winner: null,
    phase: 'playing',
    gameStartTime: now,
    turnStartTime: now,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultSetup,
  ...makeInitialGameState(MAPS[0]),

  startGame: (mode, aiPlayer, mapConfig, aiDepth) => {
    trackGameStart(mode, mapConfig.name, getDifficulty(mode, aiDepth));
    set({ screen: 'playing', mode, aiPlayer, aiDepth, mapConfig, ...makeInitialGameState(mapConfig) });
  },

  move: (to: Point) => {
    const state = get();
    if (state.phase === 'over') return;

    const { mapConfig } = state;
    const usedEdgesSet = new Set(state.usedEdges);

    if (!isMoveValid(state.ball, to, usedEdgesSet, mapConfig)) return;

    const now = Date.now();
    const turnDurationMs = now - state.turnStartTime;
    const isAITurn = state.mode === 'ai' && state.currentPlayer === state.aiPlayer;
    const difficulty = getDifficulty(state.mode, state.aiDepth);

    // Combine predrawn + used edges to correctly count pre-existing lines at destination
    const predrawn = getPredrawnEdges(mapConfig);
    const allEdgesBeforeMove = new Set([...predrawn, ...usedEdgesSet]);
    const preExistingEdges = getEdgeCount(to, allEdgesBeforeMove);

    const newEdges = [...state.usedEdges, serializeEdge(state.ball, to)];
    const newEdgesSet = new Set(newEdges);

    const scorer = goalWinner(to, mapConfig);
    if (scorer !== null) {
      trackTurn(state.mode, state.currentPlayer, isAITurn, turnDurationMs);
      trackGameEnd(state.mode, mapConfig.name, difficulty, getResult(scorer, state.mode, state.aiPlayer), scorer, newEdges.length, Math.round((now - state.gameStartTime) / 1000));
      set({ ball: to, usedEdges: newEdges, winner: scorer, phase: 'over', turnStartTime: now });
      return;
    }

    const mustContinue = preExistingEdges > 0;
    const validNext = getValidMoves(to, newEdgesSet, mapConfig);

    if (mustContinue) {
      if (validNext.length === 0) {
        const other: Player = state.currentPlayer === 1 ? 2 : 1;
        trackTurn(state.mode, state.currentPlayer, isAITurn, turnDurationMs);
        trackGameEnd(state.mode, mapConfig.name, difficulty, getResult(other, state.mode, state.aiPlayer), other, newEdges.length, Math.round((now - state.gameStartTime) / 1000));
        set({ ball: to, usedEdges: newEdges, winner: other, phase: 'over', turnStartTime: now });
      } else {
        // Bounce — same player continues; turn timer keeps running
        set({ ball: to, usedEdges: newEdges, mustContinue: true });
      }
    } else {
      const next: Player = state.currentPlayer === 1 ? 2 : 1;
      if (validNext.length === 0) {
        trackTurn(state.mode, state.currentPlayer, isAITurn, turnDurationMs);
        trackGameEnd(state.mode, mapConfig.name, difficulty, getResult(state.currentPlayer, state.mode, state.aiPlayer), state.currentPlayer, newEdges.length, Math.round((now - state.gameStartTime) / 1000));
        set({ ball: to, usedEdges: newEdges, currentPlayer: next, mustContinue: false, winner: state.currentPlayer, phase: 'over', turnStartTime: now });
      } else {
        trackTurn(state.mode, state.currentPlayer, isAITurn, turnDurationMs);
        set({ ball: to, usedEdges: newEdges, currentPlayer: next, mustContinue: false, turnStartTime: now });
      }
    }
  },

  resetGame: () => {
    const { mapConfig } = get();
    set(makeInitialGameState(mapConfig));
  },

  backToSetup: () => set({ screen: 'setup' }),
}));

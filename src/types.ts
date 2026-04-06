export type Point = { x: number; y: number };

export type Player = 1 | 2;

export type GamePhase = 'playing' | 'over';

export type GameMode = '2p' | 'ai';

export interface GameState {
  ball: Point;
  usedEdges: string[];
  currentPlayer: Player;
  mustContinue: boolean;
  winner: Player | null;
  phase: GamePhase;
  /** Timestamp (ms) when the current game started. */
  gameStartTime: number;
  /** Timestamp (ms) when the current player's turn started. */
  turnStartTime: number;
}

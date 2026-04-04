import { useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import { useGameStore } from './store/gameStore';
import { getBestMove } from './ai';
import './App.css';

function AIController() {
  const ball        = useGameStore((s) => s.ball);
  const usedEdges   = useGameStore((s) => s.usedEdges);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const phase       = useGameStore((s) => s.phase);
  const mode        = useGameStore((s) => s.mode);
  const aiPlayer    = useGameStore((s) => s.aiPlayer);
  const aiDepth     = useGameStore((s) => s.aiDepth);
  const mapConfig   = useGameStore((s) => s.mapConfig);
  const move        = useGameStore((s) => s.move);

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'ai' || currentPlayer !== aiPlayer) return;
    const timer = setTimeout(() => {
      const best = getBestMove(ball, usedEdges, currentPlayer, aiPlayer, mapConfig, aiDepth);
      if (best) move(best);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ball.x, ball.y, currentPlayer, phase]);

  return null;
}

function Game() {
  return (
    <div className="app">
      <GameStatus />
      <GameBoard />
      <AIController />
    </div>
  );
}

export default function App() {
  const screen = useGameStore((s) => s.screen);
  return screen === 'setup' ? <SetupScreen /> : <Game />;
}

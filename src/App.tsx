import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import { useGameStore } from './store/gameStore';
import { getBestMove } from './ai';
import { trackPageView } from './analytics';

function AIController() {
  const ball = useGameStore((s) => s.ball);
  const usedEdges = useGameStore((s) => s.usedEdges);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const phase = useGameStore((s) => s.phase);
  const mode = useGameStore((s) => s.mode);
  const aiPlayer = useGameStore((s) => s.aiPlayer);
  const aiDepth = useGameStore((s) => s.aiDepth);
  const mapConfig = useGameStore((s) => s.mapConfig);
  const move = useGameStore((s) => s.move);

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'ai' || currentPlayer !== aiPlayer) return;
    const timer = setTimeout(() => {
      const best = getBestMove(ball, usedEdges, currentPlayer, aiPlayer, mapConfig, aiDepth);
      if (best) move(best);
    }, 300);
    return () => clearTimeout(timer);
  }, [ball.x, ball.y, currentPlayer, phase]);

  return null;
}

function Game() {
  return (
    <View style={styles.app}>
      <GameStatus />
      <GameBoard />
      <AIController />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, alignItems: 'center', padding: 10 },
  safeArea: { flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center' },
  centeredContainer: { flex: 1, width: '100%', maxWidth: 600 },
});

export default function App() {
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    trackPageView();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          {screen === 'setup' ? <SetupScreen /> : <Game />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


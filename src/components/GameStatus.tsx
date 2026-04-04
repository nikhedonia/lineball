import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';

const PLAYER_COLORS: Record<number, string> = { 1: '#3b82f6', 2: '#ef4444' };
const DEPTH_LABEL: Record<number, string> = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };

export default function GameStatus() {
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const mustContinue = useGameStore((s) => s.mustContinue);
  const winner = useGameStore((s) => s.winner);
  const phase = useGameStore((s) => s.phase);
  const resetGame = useGameStore((s) => s.resetGame);
  const backToSetup = useGameStore((s) => s.backToSetup);
  const usedEdges = useGameStore((s) => s.usedEdges);
  const mode = useGameStore((s) => s.mode);
  const aiPlayer = useGameStore((s) => s.aiPlayer);
  const aiDepth = useGameStore((s) => s.aiDepth);
  const mapConfig = useGameStore((s) => s.mapConfig);

  const isAITurn = mode === 'ai' && currentPlayer === aiPlayer && phase === 'playing';
  const humanPlayer = aiPlayer === 1 ? 2 : 1;

  function label(p: number) {
    if (mode !== 'ai') return `Player ${p}`;
    return p === aiPlayer ? `Computer (P${p})` : `You (P${p})`;
  }

  const diffLabel = DEPTH_LABEL[aiDepth] ?? `Depth ${aiDepth}`;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View>
          <Text style={styles.mapLabel}>📍 {mapConfig.name}</Text>
          {mode === 'ai' && (
            <Text style={styles.modeLabel}>🤖 {diffLabel} · You are P{humanPlayer}</Text>
          )}
        </View>
        <Pressable style={styles.backBtn} onPress={backToSetup}>
          <Text style={styles.backBtnText}>← Menu</Text>
        </Pressable>
      </View>
      {phase === 'over' && winner ? (
        <Text style={[styles.winnerBanner, { color: PLAYER_COLORS[winner] }]}>
          🏆 {label(winner)} wins!
        </Text>
      ) : isAITurn ? (
        <Text style={[styles.turnInfo, { color: PLAYER_COLORS[currentPlayer] }]}>
          🤖 Computer is thinking…
        </Text>
      ) : (
        <Text style={[styles.turnInfo, { color: PLAYER_COLORS[currentPlayer] }]}>
          {mustContinue
            ? `${label(currentPlayer)} must continue (bounce!)`
            : `${label(currentPlayer)}'s turn`}
        </Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.moveCount}>Moves: {usedEdges.length}</Text>
        <Pressable style={styles.resetBtn} onPress={resetGame}>
          <Text style={styles.resetBtnText}>Restart</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 480, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  mapLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  modeLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  backBtn: { backgroundColor: '#e5e7eb', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  backBtnText: { fontSize: 13, color: '#374151' },
  winnerBanner: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 6 },
  turnInfo: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginVertical: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  moveCount: { fontSize: 12, color: '#6b7280' },
  resetBtn: { backgroundColor: '#dbeafe', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  resetBtnText: { fontSize: 13, color: '#1d4ed8' },
});

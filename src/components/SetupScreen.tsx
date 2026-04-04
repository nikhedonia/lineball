import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { MAPS } from '../maps';
import type { MapConfig } from '../maps';
import type { GameMode, Player } from '../types';
import { useGameStore } from '../store/gameStore';

const DIFFICULTIES = [
  { label: 'Easy', depth: 1 },
  { label: 'Medium', depth: 3 },
  { label: 'Hard', depth: 5 },
];

type Step = 'settings' | 'map';

export default function SetupScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const [step, setStep] = useState<Step>('settings');
  const [mode, setMode] = useState<GameMode>('ai');
  const [humanPlayer, setHumanPlayer] = useState<Player>(1);
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0]);
  const [depth, setDepth] = useState(3);

  function handleStart() {
    const aiPlayer: Player = humanPlayer === 1 ? 2 : 1;
    startGame(mode, aiPlayer, selectedMap, depth);
  }

  if (step === 'map') {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => setStep('settings')}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Choose Map</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.mapGrid}>
            {MAPS.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.mapBtn, selectedMap.id === m.id && styles.mapBtnActive]}
                onPress={() => setSelectedMap(m)}
              >
                <MapPreview map={m} />
                <Text style={styles.mapName}>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>▶ Start Game</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, styles.settingsHeader]}>
        <Text style={styles.title}>⚽ Line Ball</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Game Mode</Text>
          <View style={styles.optionRow}>
            <Pressable style={[styles.optionBtn, mode === 'ai' && styles.optionBtnActive]} onPress={() => setMode('ai')}>
              <Text style={[styles.optionBtnText, mode === 'ai' && styles.optionBtnTextActive]}>🤖 vs Computer</Text>
            </Pressable>
            <Pressable style={[styles.optionBtn, mode === '2p' && styles.optionBtnActive]} onPress={() => setMode('2p')}>
              <Text style={[styles.optionBtnText, mode === '2p' && styles.optionBtnTextActive]}>👥 Two Players</Text>
            </Pressable>
          </View>
        </View>
        {mode === 'ai' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>You play as</Text>
              <View style={styles.optionRow}>
                <Pressable style={[styles.optionBtn, styles.optionBtnP1, humanPlayer === 1 && styles.optionBtnActive]} onPress={() => setHumanPlayer(1)}>
                  <Text style={[styles.optionBtnText, humanPlayer === 1 && styles.optionBtnTextActive]}>🔵 Blue  attacks ↓</Text>
                </Pressable>
                <Pressable style={[styles.optionBtn, styles.optionBtnP2, humanPlayer === 2 && styles.optionBtnActive]} onPress={() => setHumanPlayer(2)}>
                  <Text style={[styles.optionBtnText, humanPlayer === 2 && styles.optionBtnTextActive]}>🔴 Red  attacks ↑</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Difficulty</Text>
              <View style={styles.optionRow}>
                {DIFFICULTIES.map((d) => (
                  <Pressable key={d.depth} style={[styles.optionBtn, depth === d.depth && styles.optionBtnActive]} onPress={() => setDepth(d.depth)}>
                    <Text style={[styles.optionBtnText, depth === d.depth && styles.optionBtnTextActive]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
        <View style={styles.rulesBox}>
          <Text style={styles.rulesToggle}>How to play</Text>
          <View style={styles.rulesList}>
            <Text style={styles.rulesItem}>1. Players alternate drawing a line from the ball to any adjacent point (8 directions).</Text>
            <Text style={styles.rulesItem}>2. <Text style={{ fontWeight: 'bold' }}>Bounce:</Text> if the destination already has lines or touches a wall, the same player must keep moving.</Text>
            <Text style={styles.rulesItem}>3. You cannot redraw an existing line or cross a boundary.</Text>
            <Text style={styles.rulesItem}>4. Score by moving the ball into your opponent's goal.</Text>
            <Text style={styles.rulesItem}>5. No valid moves = loss.</Text>
            <Text style={styles.rulesTip}>🔵 Blue → bottom goal · 🔴 Red → top goal</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.startBtn} onPress={() => setStep('map')}>
          <Text style={styles.startBtnText}>Choose Map →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MapPreview({ map }: { map: MapConfig }) {
  const pad = 4;
  const vw = map.fieldWidth + pad * 2;
  const vh = map.fieldHeight + pad * 2 + 3;
  const px = (x: number) => pad + x;
  const py = (y: number) => pad + 1.5 + y;
  const wallSegs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const key of map.walls) {
    const [aPart, bPart] = key.split('|');
    const [x1, y1] = aPart.split('_').map(Number);
    const [x2, y2] = bPart.split('_').map(Number);
    wallSegs.push({ x1, y1, x2, y2 });
  }
  const tgMin = map.topGoalMinX ?? map.goalMinX;
  const tgMax = map.topGoalMaxX ?? map.goalMaxX;
  const bgMin = map.bottomGoalMinX ?? map.goalMinX;
  const bgMax = map.bottomGoalMaxX ?? map.goalMaxX;

  return (
    <Svg viewBox={`0 0 ${vw} ${vh}`} width={80} height={60} preserveAspectRatio="xMidYMid meet">
      <Rect x={px(tgMin)} y={pad - 0.5} width={tgMax - tgMin} height={1.5} fill="rgba(59,130,246,0.35)" stroke="#3b82f6" strokeWidth={0.4} />
      <Rect x={px(0)} y={py(0)} width={map.fieldWidth} height={map.fieldHeight} fill="#e8f4e8" stroke="#374151" strokeWidth={0.6} />
      {(map.deadZoneVisuals ?? map.blockedZones)?.map((z, i) => (
        <Rect key={i} x={px(z.x1)} y={py(z.y1)} width={z.x2 - z.x1} height={z.y2 - z.y1} fill="#d1d5db" />
      ))}
      <Rect x={px(bgMin)} y={py(map.fieldHeight) - 0.1} width={bgMax - bgMin} height={1.5} fill="rgba(239,68,68,0.35)" stroke="#ef4444" strokeWidth={0.4} />
      {wallSegs.map((w, i) => (
        <Line key={i} x1={px(w.x1)} y1={py(w.y1)} x2={px(w.x2)} y2={py(w.y2)} stroke={map.wallColor ?? '#7c3aed'} strokeWidth={0.7} strokeLinecap="round" />
      ))}
      <Circle cx={px(map.ballStart.x)} cy={py(map.ballStart.y)} r={1} fill="#f59e0b" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  settingsHeader: { justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#e5e7eb', borderRadius: 6 },
  backBtnText: { fontSize: 14, color: '#374151' },
  body: { padding: 16 },
  rulesBox: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  rulesToggle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  rulesList: { marginTop: 8 },
  rulesItem: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  rulesTip: { fontSize: 13, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  optionBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  optionBtnP1: { borderColor: '#3b82f6' },
  optionBtnP2: { borderColor: '#ef4444' },
  optionBtnText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  optionBtnTextActive: { color: '#fff' },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mapBtn: { width: 120, padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  mapBtnActive: { borderColor: '#3b82f6', borderWidth: 2 },
  mapName: { fontSize: 12, color: '#374151', marginTop: 4, textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  startBtn: { backgroundColor: '#16a34a', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

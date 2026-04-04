import { useState } from 'react';
import { MAPS } from '../maps';
import type { MapConfig } from '../maps';
import type { GameMode, Player } from '../types';
import { useGameStore } from '../store/gameStore';

const DIFFICULTIES = [
  { label: 'Easy',   depth: 1 },
  { label: 'Medium', depth: 3 },
  { label: 'Hard',   depth: 5 },
];

export default function SetupScreen() {
  const startGame = useGameStore((s) => s.startGame);

  const [mode, setMode] = useState<GameMode>('ai');       // AI is default
  const [humanPlayer, setHumanPlayer] = useState<Player>(1);
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0]);
  const [depth, setDepth] = useState(3);

  function handleStart() {
    const aiPlayer: Player = humanPlayer === 1 ? 2 : 1;
    startGame(mode, aiPlayer, selectedMap, depth);
  }

  return (
    <div className="setup-screen">
      <h1 className="setup-title">⚽ Line Ball</h1>

      {/* ── How to Play ── */}
      <details className="rules-box">
        <summary>How to play</summary>
        <ol className="rules-list">
          <li>The ball starts at the centre. Players alternate drawing a line from the ball to any adjacent point (8 directions).</li>
          <li><strong>Bounce rule:</strong> if the destination already has lines touching it (or sits on a wall/boundary), the same player <em>must</em> keep moving.</li>
          <li>You cannot redraw an existing line or cross a boundary/wall segment.</li>
          <li>Score by moving the ball into your opponent's goal at the far end of the field.</li>
          <li>If a player has no valid moves, they lose.</li>
        </ol>
        <p className="rules-tip">🔵 Blue attacks the <strong>bottom</strong> goal · 🔴 Red attacks the <strong>top</strong> goal</p>
      </details>

      {/* ── Game Mode ── */}
      <section className="setup-section">
        <h2>Game Mode</h2>
        <div className="option-row">
          <button className={`option-btn ${mode === 'ai' ? 'active' : ''}`} onClick={() => setMode('ai')}>
            🤖 vs Computer
          </button>
          <button className={`option-btn ${mode === '2p' ? 'active' : ''}`} onClick={() => setMode('2p')}>
            👥 Two Players
          </button>
        </div>
      </section>

      {/* ── AI options ── */}
      {mode === 'ai' && (
        <>
          <section className="setup-section">
            <h2>You play as</h2>
            <div className="option-row">
              <button className={`option-btn p1 ${humanPlayer === 1 ? 'active' : ''}`} onClick={() => setHumanPlayer(1)}>
                🔵 Player 1 (Blue)<br /><small>Attacks ↓ bottom</small>
              </button>
              <button className={`option-btn p2 ${humanPlayer === 2 ? 'active' : ''}`} onClick={() => setHumanPlayer(2)}>
                🔴 Player 2 (Red)<br /><small>Attacks ↑ top</small>
              </button>
            </div>
          </section>

          <section className="setup-section">
            <h2>Difficulty</h2>
            <div className="option-row">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.depth}
                  className={`option-btn ${depth === d.depth ? 'active' : ''}`}
                  onClick={() => setDepth(d.depth)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── Map ── */}
      <section className="setup-section">
        <h2>Map</h2>
        <div className="map-grid">
          {MAPS.map((m) => (
            <button key={m.id} className={`map-btn ${selectedMap.id === m.id ? 'active' : ''}`} onClick={() => setSelectedMap(m)}>
              <MapPreview map={m} />
              <span className="map-name">{m.name}</span>
              <span className="map-desc">{m.description}</span>
            </button>
          ))}
        </div>
      </section>

      <button className="start-btn" onClick={handleStart}>
        Start Game
      </button>
    </div>
  );
}

function MapPreview({ map }: { map: MapConfig }) {
  const W = 80, H = 60;
  const scaleX = (W - 8) / map.fieldWidth;
  const scaleY = (H - 8) / map.fieldHeight;
  const px = (x: number) => 4 + x * scaleX;
  const py = (y: number) => 4 + y * scaleY;

  // Parse wall edges for rendering
  const wallSegs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const key of map.walls) {
    const [aPart, bPart] = key.split('|');
    const [x1, y1] = aPart.split('_').map(Number);
    const [x2, y2] = bPart.split('_').map(Number);
    wallSegs.push({ x1, y1, x2, y2 });
  }

  const gx1 = px(map.goalMinX);
  const gx2 = px(map.goalMaxX);

  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto 4px' }}>
      <rect x={px(0)} y={py(0)} width={map.fieldWidth * scaleX} height={map.fieldHeight * scaleY}
        fill="#e8f4e8" stroke="#374151" strokeWidth={1.5} />
      <rect x={gx1} y={py(0) - 6} width={gx2 - gx1} height={6} fill="rgba(59,130,246,0.4)" stroke="#3b82f6" strokeWidth={1} />
      <rect x={gx1} y={py(map.fieldHeight)} width={gx2 - gx1} height={6} fill="rgba(239,68,68,0.4)" stroke="#ef4444" strokeWidth={1} />
      {wallSegs.map((w, i) => (
        <line key={i} x1={px(w.x1)} y1={py(w.y1)} x2={px(w.x2)} y2={py(w.y2)}
          stroke="#7c3aed" strokeWidth={1.5} strokeLinecap="round" />
      ))}
      <circle cx={px(map.ballStart.x)} cy={py(map.ballStart.y)} r={3} fill="#f59e0b" />
    </svg>
  );
}

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

type Step = 'settings' | 'map';

export default function SetupScreen() {
  const startGame = useGameStore((s) => s.startGame);

  const [step, setStep]               = useState<Step>('settings');
  const [mode, setMode]               = useState<GameMode>('ai');
  const [humanPlayer, setHumanPlayer] = useState<Player>(1);
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0]);
  const [depth, setDepth]             = useState(3);

  function handleStart() {
    const aiPlayer: Player = humanPlayer === 1 ? 2 : 1;
    startGame(mode, aiPlayer, selectedMap, depth);
  }

  if (step === 'map') {
    return (
      <div className="setup-screen">
        <header className="setup-header">
          <button className="setup-back-btn" onClick={() => setStep('settings')}>← Back</button>
          <span className="setup-header-title">Choose Map</span>
          <span />
        </header>

        <div className="setup-body">
          <div className="map-grid">
            {MAPS.map((m) => (
              <button
                key={m.id}
                className={`map-btn ${selectedMap.id === m.id ? 'active' : ''}`}
                onClick={() => setSelectedMap(m)}
              >
                <MapPreview map={m} />
                <span className="map-name">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <footer className="setup-footer">
          <button className="start-btn" onClick={handleStart}>
            ▶ Start Game
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="setup-screen">
      <header className="setup-header settings-header">
        <h1 className="setup-title">⚽ Line Ball</h1>
      </header>

      <div className="setup-body">
        {/* ── How to Play ── */}
        <details className="rules-box">
          <summary>How to play</summary>
          <ol className="rules-list">
            <li>Players alternate drawing a line from the ball to any adjacent point (8 directions).</li>
            <li><strong>Bounce:</strong> if the destination already has lines or touches a wall, the same player <em>must</em> keep moving.</li>
            <li>You cannot redraw an existing line or cross a boundary.</li>
            <li>Score by moving the ball into your opponent's goal.</li>
            <li>No valid moves = loss.</li>
          </ol>
          <p className="rules-tip">🔵 Blue → bottom goal &nbsp;·&nbsp; 🔴 Red → top goal</p>
        </details>

        {/* ── Game Mode ── */}
        <section className="setup-section">
          <h2 className="setup-label">Game Mode</h2>
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
              <h2 className="setup-label">You play as</h2>
              <div className="option-row">
                <button className={`option-btn p1 ${humanPlayer === 1 ? 'active' : ''}`} onClick={() => setHumanPlayer(1)}>
                  🔵 Blue <small>attacks ↓</small>
                </button>
                <button className={`option-btn p2 ${humanPlayer === 2 ? 'active' : ''}`} onClick={() => setHumanPlayer(2)}>
                  🔴 Red <small>attacks ↑</small>
                </button>
              </div>
            </section>

            <section className="setup-section">
              <h2 className="setup-label">Difficulty</h2>
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
      </div>

      <footer className="setup-footer">
        <button className="start-btn" onClick={() => setStep('map')}>
          Choose Map →
        </button>
      </footer>
    </div>
  );
}

function MapPreview({ map }: { map: MapConfig }) {
  const pad = 4;
  const vw = map.fieldWidth + pad * 2;
  const vh = map.fieldHeight + pad * 2 + 3; // +3 for goal boxes
  const px = (x: number) => pad + x;
  const py = (y: number) => pad + 1.5 + y;   // +1.5 offset for top goal box

  const wallSegs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const key of map.walls) {
    const [aPart, bPart] = key.split('|');
    const [x1, y1] = aPart.split('_').map(Number);
    const [x2, y2] = bPart.split('_').map(Number);
    wallSegs.push({ x1, y1, x2, y2 });
  }

  const tgMin = map.topGoalMinX    ?? map.goalMinX;
  const tgMax = map.topGoalMaxX    ?? map.goalMaxX;
  const bgMin = map.bottomGoalMinX ?? map.goalMinX;
  const bgMax = map.bottomGoalMaxX ?? map.goalMaxX;

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      className="map-preview-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* top goal */}
      <rect x={px(tgMin)} y={pad - 0.5} width={tgMax - tgMin} height={1.5}
        fill="rgba(59,130,246,0.35)" stroke="#3b82f6" strokeWidth={0.4} />
      {/* field */}
      <rect x={px(0)} y={py(0)} width={map.fieldWidth} height={map.fieldHeight}
        fill="#e8f4e8" stroke="#374151" strokeWidth={0.6} />
      {/* blocked dead zones */}
      {map.blockedZones?.map((z, i) => (
        <rect key={i}
          x={px(z.x1)} y={py(z.y1)}
          width={z.x2 - z.x1} height={z.y2 - z.y1}
          fill="#d1d5db" />
      ))}
      {/* bottom goal */}
      <rect x={px(bgMin)} y={py(map.fieldHeight) - 0.1} width={bgMax - bgMin} height={1.5}
        fill="rgba(239,68,68,0.35)" stroke="#ef4444" strokeWidth={0.4} />
      {/* walls */}
      {wallSegs.map((w, i) => (
        <line key={i} x1={px(w.x1)} y1={py(w.y1)} x2={px(w.x2)} y2={py(w.y2)}
          stroke={map.wallColor ?? '#7c3aed'} strokeWidth={0.7} strokeLinecap="round" />
      ))}
      {/* ball */}
      <circle cx={px(map.ballStart.x)} cy={py(map.ballStart.y)} r={1} fill="#f59e0b" />
    </svg>
  );
}

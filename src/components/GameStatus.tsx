import { useGameStore } from '../store/gameStore';

const PLAYER_COLORS: Record<number, string> = { 1: '#3b82f6', 2: '#ef4444' };
const DEPTH_LABEL: Record<number, string> = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };

export default function GameStatus() {
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const mustContinue  = useGameStore((s) => s.mustContinue);
  const winner        = useGameStore((s) => s.winner);
  const phase         = useGameStore((s) => s.phase);
  const resetGame     = useGameStore((s) => s.resetGame);
  const backToSetup   = useGameStore((s) => s.backToSetup);
  const usedEdges     = useGameStore((s) => s.usedEdges);
  const mode          = useGameStore((s) => s.mode);
  const aiPlayer      = useGameStore((s) => s.aiPlayer);
  const aiDepth       = useGameStore((s) => s.aiDepth);
  const mapConfig     = useGameStore((s) => s.mapConfig);

  const isAITurn = mode === 'ai' && currentPlayer === aiPlayer && phase === 'playing';
  const humanPlayer  = aiPlayer === 1 ? 2 : 1;

  function label(p: number) {
    if (mode !== 'ai') return `Player ${p}`;
    return p === aiPlayer ? `Computer (P${p})` : `You (P${p})`;
  }

  const diffLabel = DEPTH_LABEL[aiDepth] ?? `Depth ${aiDepth}`;

  return (
    <div className="game-status">
      <div className="status-top">
        <div>
          <div className="map-label">📍 {mapConfig.name}</div>
          {mode === 'ai' && (
            <div className="mode-label">🤖 {diffLabel} · You are P{humanPlayer}</div>
          )}
        </div>
        <button className="back-btn" onClick={backToSetup}>← Menu</button>
      </div>

      {phase === 'over' && winner ? (
        <div className="winner-banner" style={{ color: PLAYER_COLORS[winner] }}>
          🏆 {label(winner)} wins!
        </div>
      ) : isAITurn ? (
        <div className="turn-info" style={{ color: PLAYER_COLORS[currentPlayer] }}>
          🤖 Computer is thinking…
        </div>
      ) : (
        <div className="turn-info" style={{ color: PLAYER_COLORS[currentPlayer] }}>
          {mustContinue
            ? `${label(currentPlayer)} must continue (bounce!)`
            : `${label(currentPlayer)}'s turn`}
        </div>
      )}

      <div className="status-footer">
        <span className="move-count">Moves: {usedEdges.length}</span>
        <button className="reset-btn" onClick={resetGame}>Restart</button>
      </div>
    </div>
  );
}

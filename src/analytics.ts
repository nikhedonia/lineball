declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_ID = process.env.EXPO_PUBLIC_GA_ID;

// Dynamically load the GA4 script and initialise gtag on web.
if (GA_ID && typeof document !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export function trackPageView() {
  gtag('event', 'page_view');
}

export function trackGameStart(mode: string, mapName: string, difficulty: string | null) {
  gtag('event', 'game_start', {
    game_mode: mode,
    map_name: mapName,
    difficulty,
  });
}

/** Fired when a player's full turn ends (including all bounces within that turn). */
export function trackTurn(
  mode: string,
  player: number,
  isAITurn: boolean,
  durationMs: number,
) {
  gtag('event', 'turn_taken', {
    game_mode: mode,
    player,
    is_ai_turn: isAITurn,
    turn_duration_ms: durationMs,
  });
}

export function trackGameEnd(
  mode: string,
  mapName: string,
  difficulty: string | null,
  result: string,
  winnerPlayer: number,
  totalLines: number,
  durationSeconds: number,
) {
  gtag('event', 'game_end', {
    game_mode: mode,
    map_name: mapName,
    difficulty,
    result,
    winner_player: winnerPlayer,
    total_lines: totalLines,
    duration_seconds: durationSeconds,
  });
}

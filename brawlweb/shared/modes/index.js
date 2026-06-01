// Game mode definitions (PRD § 5.2). Each mode declares its rules so the
// server's match loop (server/match.js) knows how to score, when to end, etc.

export const MODES = {
  gem_grab: {
    id: 'gem_grab', name: 'Gem Grab',
    teamSize: 3, teamCount: 2,
    matchDurationMs: 150_000,            // 2:30
    respawnMs: 3000,
    gemMineRespawnMs: 8000,
    gemsToWin: 10,
    winCountdownMs: 15000,
    description: 'Collect 10 gems and hold for 15 seconds. First team to 10 wins!',
  },
  bounty: {
    id: 'bounty', name: 'Bounty',
    teamSize: 3, teamCount: 2,
    matchDurationMs: 120_000,            // 2:00
    respawnMs: 3000,
    startingStars: 2, maxStars: 7,
    description: 'Eliminate enemies to steal their stars. Most stars at the end wins.',
  },
  heist: {
    id: 'heist', name: 'Heist',
    teamSize: 3, teamCount: 2,
    matchDurationMs: 150_000,
    respawnMs: 3000,
    safeHp: 40000,
    description: 'Crack open the enemy team\'s safe before they get yours!',
  },
  showdown: {
    id: 'showdown', name: 'Showdown',
    teamSize: 1, teamCount: 10,
    matchDurationMs: 300_000,            // 5:00
    respawnMs: 0,                        // no respawn
    poisonStartMs: 60000,
    poisonShrinkMs: 90000,               // fully closed by 90s after start
    poisonDps: 1000,
    powerCubeHpBonus: 400,               // each cube grants +400 max HP
    powerCubeDamageMult: 0.10,           // and +10% damage
    description: 'Last Brawler standing wins. Watch out for the poison cloud!',
  },
};

export function trophyChange(mode, placement, totalParticipants) {
  // Returns trophy delta based on PRD § 7.6.1 / showdown § 5.2.2
  if (mode === 'showdown') {
    if (placement === 1) return 8;
    if (placement <= 3) return 4;
    if (placement <= 6) return 0;
    return -4;
  }
  // Team modes: win = +8 to +14 baseline, loss = -4 to -8
  if (placement === 1) return 8;
  return -5;
}

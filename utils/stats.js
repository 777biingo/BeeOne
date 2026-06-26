const userStats = new Map();

const DEFAULT_STATS = {
  nectar: 0,
  honey: 0,
  blueHoney: 0,
  bees: 1,
  hives: 1,
  nectarPerClick: 1,
  nectarPerSecond: 0.1,
  conversionRate: 0.7,
  upgrades: {
    beeUpgrade1: false,
    beeUpgrade2: false,
    hiveUpgrade1: false,
    hiveUpgrade2: false,
  },
};

function getUserStats(userId) {
  if (!userStats.has(userId)) {
    userStats.set(userId, JSON.parse(JSON.stringify(DEFAULT_STATS)));
  }
  return userStats.get(userId);
}

function saveStats(userId, stats) {
  userStats.set(userId, stats);
}

module.exports = { getUserStats, saveStats, DEFAULT_STATS };
const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join(__dirname, '..', 'baza.json');

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

/**
 * Wczytuje dane wszystkich graczy z pliku baza.json do pamięci RAM.
 * Wywoływana raz przy starcie bota (event 'ready').
 */
function loadStats() {
  if (!fs.existsSync(STATS_FILE)) {
    console.log('📂 Brak pliku baza.json — zaczynam z pustą bazą danych.');
    return;
  }

  try {
    const raw = fs.readFileSync(STATS_FILE, 'utf-8');
    const data = JSON.parse(raw);

    for (const [userId, stats] of Object.entries(data)) {
      userStats.set(userId, Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATS)), stats));
    }

    console.log(`✅ Wczytano dane ${userStats.size} graczy z baza.json.`);
  } catch (err) {
    console.error('❌ Błąd podczas wczytywania baza.json:', err);
  }
}

/**
 * Zapisuje dane wszystkich graczy z pamięci RAM do pliku baza.json.
 * Wywoływana po każdej zmianie statystyk gracza.
 */
function saveStats(userId, stats) {
  userStats.set(userId, stats);

  try {
    const data = Object.fromEntries(userStats);
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Błąd podczas zapisywania baza.json:', err);
  }
}

function getUserStats(userId) {
  if (!userStats.has(userId)) {
    userStats.set(userId, JSON.parse(JSON.stringify(DEFAULT_STATS)));
  }
  return userStats.get(userId);
}

module.exports = { loadStats, saveStats, getUserStats, DEFAULT_STATS };
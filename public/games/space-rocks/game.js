/**
 * Nebula Drift — Space Adventure
 * Keyboard and gamepad controls.
 */

(function () {
  'use strict';

  /**
   * Absolute URL for a path relative to the directory of the current page.
   * Fixes subdirectory deploys when the URL has no trailing slash (e.g. /asteroids vs /asteroids/)
   * so _src/... and CSV files resolve under the app folder, not the site root.
   */
  function assetUrl(rel) {
    const path = window.location.pathname;
    let baseDir;
    if (path.endsWith('/')) {
      baseDir = path;
    } else {
      const lastSeg = path.slice(path.lastIndexOf('/') + 1);
      baseDir = lastSeg.includes('.') ? path.slice(0, path.lastIndexOf('/') + 1) : path + '/';
    }
    return window.location.origin + baseDir + String(rel).replace(/^\//, '');
  }

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const shipImages = [null, null];
  /** Canonical P1 hull gradient stops in _src/ship*.svg; P2 swaps these in memory when loading slot 1. */
  const ship1Color = { from: '#00E4FD', to: '#86F3FF' };
  const ship2Color = { from: '#26FD00', to: '#B4FF86' };
  const shipObjectUrls = [null, null];
  const shipLoadGen = [0, 0];
  /** Blob URLs for ship preview imgs (single-player + MP); fetch+bust-cache so SVG matches disk (P1 was cropped when img.src cached old files). */
  const shipMenuPreviewBlobUrls = { single: null, mp0: null, mp1: null, levelBtn: null };
  const shipMenuPreviewLoadGen = { single: 0, mp0: 0, mp1: 0, levelBtn: 0 };
  let currentShipStyle = 'ship1';

  function svgTextForPlayerSlot(text, slot) {
    if (slot !== 1) return text;
    let t = text
      .split(ship1Color.from).join(ship2Color.from)
      .split(ship1Color.to).join(ship2Color.to);
    // Older SVGs used #00E6FF / #B7F8FF; replace so P2 still tints if server has legacy assets.
    t = t.split('#00E6FF').join(ship2Color.from).split('#B7F8FF').join(ship2Color.to);
    t = t.split('#00e6ff').join(ship2Color.from).split('#b7f8ff').join(ship2Color.to);
    return t;
  }

  function revokeShipObjectUrl(slot) {
    if (shipObjectUrls[slot]) {
      URL.revokeObjectURL(shipObjectUrls[slot]);
      shipObjectUrls[slot] = null;
    }
  }

  function revokeShipMenuPreviewBlob(key) {
    if (shipMenuPreviewBlobUrls[key]) {
      URL.revokeObjectURL(shipMenuPreviewBlobUrls[key]);
      shipMenuPreviewBlobUrls[key] = null;
    }
  }

  /**
   * Shared ship carousel preview: always fetch SVG with cache bust, optional P2 color swap, blob URL.
   * @param {HTMLImageElement|null} img
   * @param {string} style ship1..ship4
   * @param {number} svgPlayerSlot 0 = file colors (P1 / solo), 1 = P2 green
   * @param {'single'|'mp0'|'mp1'|'levelBtn'} previewKey revoke + stale-load guard key
   */
  function loadShipMenuPreviewImg(img, style, svgPlayerSlot, previewKey) {
    if (!img) return;
    revokeShipMenuPreviewBlob(previewKey);
    shipMenuPreviewLoadGen[previewKey]++;
    const gen = shipMenuPreviewLoadGen[previewKey];
    const abs = assetUrl('_src/' + (style || 'ship1') + '.svg');
    fetch(abs + '?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then((text) => {
        if (gen !== shipMenuPreviewLoadGen[previewKey]) return;
        const patched = svgTextForPlayerSlot(text, svgPlayerSlot);
        const url = URL.createObjectURL(new Blob([patched], { type: 'image/svg+xml' }));
        shipMenuPreviewBlobUrls[previewKey] = url;
        img.src = url;
      })
      .catch(() => {
        if (gen !== shipMenuPreviewLoadGen[previewKey]) return;
        img.src = abs + '?t=' + Date.now();
      });
  }

  function loadShipArtForStyle(style, slot) {
    const prefix = style || 'ship1';
    const s = slot === undefined || slot === null ? 0 : slot;
    if (s === 0) currentShipStyle = prefix;
    revokeShipObjectUrl(s);
    shipLoadGen[s]++;
    const gen = shipLoadGen[s];
    const img = new Image();
    img.onload = function () {
      if (gen === shipLoadGen[s]) shipImages[s] = img;
    };
    const path = '_src/' + prefix + '.svg';
    const abs = assetUrl(path);
    if (s === 0) {
      img.src = abs;
      return;
    }
    fetch(abs + '?t=' + Date.now())
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then((text) => {
        if (gen !== shipLoadGen[s]) return;
        const patched = svgTextForPlayerSlot(text, 1);
        const blob = new Blob([patched], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        shipObjectUrls[s] = url;
        img.src = url;
      })
      .catch(() => {
        if (gen === shipLoadGen[s]) img.src = abs;
      });
  }

  function setMpShipPreviewImg(slot, style) {
    const img = document.getElementById('mp-ship-preview-img-' + slot);
    const key = slot === 0 ? 'mp0' : 'mp1';
    loadShipMenuPreviewImg(img, style, slot, key);
  }

  loadShipArtForStyle('ship1', 0);

  let crystalImage = null;
  (function preloadCrystal() {
    const img = new Image();
    img.onload = function () { crystalImage = img; };
    img.src = assetUrl('_src/crystal.svg');
  })();

  const COLORS = {
    space: '#FD0404',
    nebulaPurple: '#320840',
    nebulaBlue: '#11010F',
    accentCyan: '#00e5ff',
    accentMagenta: '#ff00aa',
    accentGold: '#ffd700',
    shipGlow: 'rgba(0, 229, 255, 1)',
    crystalGlow: 'rgba(255, 230, 100, 1)',
    asteroidFill: 'rgba(190, 200, 225, 1)',
    asteroidStroke: 'rgba(255, 255, 255, 1)',
    asteroidGlow: 'rgba(220, 230, 255, 0.8)',
  };

  // Sync COLORS to CSS so page background matches canvas (body + #game-container use --space-deep, etc.)
  function applyColorsToCss() {
    const root = document.documentElement;
    root.style.setProperty('--space-deep', COLORS.space);
    root.style.setProperty('--nebula-purple', COLORS.nebulaPurple);
    root.style.setProperty('--nebula-blue', COLORS.nebulaBlue);
  }
  applyColorsToCss();

  // ----- Level data (from CSV) -----
  let levelConfigs = [];
  /** Which CSV path `levelConfigs` was loaded from (invalidated on path change). */
  let levelDataLoadedFromPath = null;
  let levelListBuiltForPath = null;
  let currentLevelIndex = -1;
  let modalOpen = false;
  let settingsModalOpen = false;
  /** `single` | `coop` | `versus` — drives level CSV and rules. */
  let gameMode = 'single';
  /** Where level-select was opened from for Back button. */
  let levelSelectReturnScreen = 'start-screen';
  function parseLevelCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (cols[idx] ?? '').trim();
      });
      out.push(row);
    }
    return out;
  }

  function getLevelCsvPath() {
    if (gameMode === 'coop') return 'space_rocks_co-op_levelData.csv';
    if (gameMode === 'versus') return 'space_rocks_versus_levelData.csv';
    return 'space_rocks_levelData.csv';
  }

  function loadLevelData() {
    const path = getLevelCsvPath();
    if (levelConfigs.length && levelDataLoadedFromPath === path) {
      return Promise.resolve(levelConfigs);
    }
    return fetch(assetUrl(path) + '?t=' + Date.now())
      .then((res) => {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' while loading level data');
        }
        return res.text();
      })
      .then((text) => {
        const parsed = parseLevelCsv(text);
        if (!parsed.length) {
          alert('Level data file ' + path + ' is empty or invalid. Using default settings.');
        }
        levelConfigs = parsed;
        levelDataLoadedFromPath = path;
        return levelConfigs;
      })
      .catch((err) => {
        console.error('Failed to load level data:', err);
        alert('Unable to load level data from ' + path + '. Make sure the game is served from a local web server (not opened directly from a file).');
        levelConfigs = [];
        levelDataLoadedFromPath = path;
        return levelConfigs;
      });
  }

  // ----- Ship config (from shipConfig.csv) -----
  let shipConfigs = [];
  let currentShipConfig = null;
  let currentShipIndex = 0;

  function applyShipConfig(cfg, slot) {
    if (!cfg) return;
    const s = slot === undefined || slot === null ? 0 : slot;
    const p = players[s];
    const n = (key, fallback) => {
      const v = Number(cfg[key]);
      return Number.isFinite(v) ? v : fallback;
    };

    if (gameMode === 'single' && s === 0) {
      // Level CSV `GAME_SCALE` (via applyLevelConfig) must win over shipConfig `gameScale`, or sector scale is always overwritten by the ship default (e.g. 0.55).
      if (currentLevelIndex < 0) {
        GAME_SCALE = n('gameScale', GAME_SCALE);
      }
      PLAYER_BASE_RADIUS = n('playerBaseRadius', PLAYER_BASE_RADIUS);
    }

    const baseR = n('playerBaseRadius', PLAYER_BASE_RADIUS);
    p.radius = baseR * GAME_SCALE;

    p.maxSpeed = n('maxSpeed', p.maxSpeed);
    p.thrustPower = n('thrustPower', p.thrustPower);
    p.friction = n('friction', p.friction);

    p.shieldCount = n('shieldCount', SHIELD_COUNT);
    p.shieldDuration = n('shieldDuration', SHIELD_DURATION);
    p.shieldRechargeTime = n('shieldRechargeTime', SHIELD_RECHARGE_TIME);
    p.shieldCountdownFlash = n('shieldCountdown', SHIELD_COUNTDOWN);

    p.bulletSpeed = n('bulletSpeed', bulletSpeed);
    p.bulletMaxCount = n('bulletMaxCount', bulletMaxCount);
    p.bulletLifespanMin = n('bulletLifespanMin', bulletLifespan[0]);
    p.bulletLifespanMax = n('bulletLifespanMax', bulletLifespan[1]);
    p.bulletAccuracyIncrement = n('bulletAccuracyIncrement', bulletAccuracyIncrement);
    p.bulletDelay = n('bulletDelay', bulletDelay);
    p.bulletAccuracyResetThreshold = n('bulletAccuracyResetThreshold', bulletAccuracyResetThreshold);
    p.bulletReloadTime = n('bulletReloadTime', bulletReloadTime);

    p.shipStyle = cfg.shipStyle || cfg.shipId || 'ship1';
    loadShipArtForStyle(p.shipStyle, s);

    shieldChargesP[s] = p.shieldCount;
    if (gameMode === 'single' && s === 0) {
      SHIELD_COUNT = p.shieldCount;
      bulletSpeed = p.bulletSpeed;
      bulletMaxCount = p.bulletMaxCount;
      bulletLifespan[0] = p.bulletLifespanMin;
      bulletLifespan[1] = p.bulletLifespanMax;
      bulletAccuracyIncrement = p.bulletAccuracyIncrement;
      bulletDelay = p.bulletDelay;
      bulletAccuracyResetThreshold = p.bulletAccuracyResetThreshold;
      bulletReloadTime = p.bulletReloadTime;
    }
  }

  function loadShipConfig() {
    if (shipConfigs.length) return Promise.resolve(shipConfigs);
    return fetch(assetUrl('shipConfig.csv') + '?t=' + Date.now())
      .then((res) => {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' while loading ship config');
        }
        return res.text();
      })
      .then((text) => {
        const parsed = parseLevelCsv(text);
        if (!parsed.length) {
          console.warn('shipConfig.csv is empty or invalid; using built-in ship defaults.');
        }
        shipConfigs = parsed;
        currentShipIndex = 0;
        currentShipConfig = shipConfigs[0] || null;
        if (currentShipConfig) applyShipConfig(currentShipConfig, 0);
        return shipConfigs;
      })
      .catch((err) => {
        console.error('Failed to load shipConfig.csv:', err);
        shipConfigs = [];
        currentShipConfig = null;
        return shipConfigs;
      });
  }

  function applyLevelConfig(cfg) {
    if (!cfg) return;
    const n = (key) => Number(cfg[key]);
    if (!Number.isNaN(n('GAME_SCALE')) && n('GAME_SCALE') > 0) GAME_SCALE = n('GAME_SCALE');
    if (!Number.isNaN(n('CRYSTALS_TO_WIN'))) CRYSTALS_TO_WIN = n('CRYSTALS_TO_WIN');
    if (!Number.isNaN(n('ASTEROID_SPAWN_COUNT'))) ASTEROID_SPAWN_COUNT = n('ASTEROID_SPAWN_COUNT');
    const minSizeNum = n('ASTEROID_MIN_SIZE');
    if (!Number.isNaN(minSizeNum) && minSizeNum >= 1) {
      ASTEROID_MIN_SIZE_INDEX = Math.max(0, Math.min(minSizeNum - 1, ASTEROID_SIZES.length - 1));
    }
    if (!Number.isNaN(n('TIME_REMAINING'))) TIME_REMAINING = n('TIME_REMAINING');
    if (!Number.isNaN(n('SHIELD'))) SHIELD_COUNT = n('SHIELD');
    players[0].radius = PLAYER_BASE_RADIUS * GAME_SCALE;
    players[1].radius = PLAYER_BASE_RADIUS * GAME_SCALE;
  }

  const HS_STORAGE_KEY = 'spaceRocksSectorHighScores_v1';
  const HS_MAX_ENTRIES = 5;
  const HS_NAME_MAX = 14;
  let pendingHighScoreEntry = null;

  function emptyHighScoreStore() {
    return { single: {}, coop: {}, versus: {} };
  }

  /** Live store (sync reads); mirrored to localStorage; replaced when server fetch succeeds. */
  let highScoreStoreMem = null;

  function loadHighScoreStoreFromLocalStorage() {
    try {
      const raw = localStorage.getItem(HS_STORAGE_KEY);
      if (!raw) return emptyHighScoreStore();
      const o = JSON.parse(raw);
      if (!o.single) o.single = {};
      if (!o.coop) o.coop = {};
      if (!o.versus) o.versus = {};
      return o;
    } catch (e) {
      return emptyHighScoreStore();
    }
  }

  function loadHighScoreStore() {
    if (highScoreStoreMem === null) {
      highScoreStoreMem = loadHighScoreStoreFromLocalStorage();
    }
    return highScoreStoreMem;
  }

  function saveHighScoreStore(store) {
    highScoreStoreMem = store;
    try {
      localStorage.setItem(HS_STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      /* quota */
    }
  }

  function getLeaderboardRemoteUrl() {
    const u = typeof window.SPACE_ROCKS_LEADERBOARD_URL === 'string' ? window.SPACE_ROCKS_LEADERBOARD_URL.trim() : '';
    return u;
  }

  function getLeaderboardRemoteSecret() {
    return typeof window.SPACE_ROCKS_LEADERBOARD_SECRET === 'string' ? window.SPACE_ROCKS_LEADERBOARD_SECRET : '';
  }

  function sanitizeHighScoreName(s) {
    return String(s || '').trim().slice(0, HS_NAME_MAX);
  }

  /** Parse stored or pending scores (numbers, strings, locale strings with commas). */
  function parseHighScoreNumber(raw) {
    if (raw == null || raw === '') return NaN;
    if (typeof raw === 'number') return Number.isFinite(raw) ? Math.floor(raw) : NaN;
    const s = String(raw).replace(/,/g, '').replace(/\s/g, '').trim();
    const n = Number(s);
    return Number.isFinite(n) ? Math.floor(n) : NaN;
  }

  function normalizeLeaderboardPayload(o) {
    const out = emptyHighScoreStore();
    if (!o || typeof o !== 'object') return out;
    for (const mode of ['single', 'coop', 'versus']) {
      const bucket = o[mode];
      if (!bucket || typeof bucket !== 'object') continue;
      for (const sk of Object.keys(bucket)) {
        if (!/^\d{1,4}$/.test(sk)) continue;
        const arr = bucket[sk];
        if (!Array.isArray(arr)) continue;
        const cleaned = arr
          .map((e) => {
            const row = {
              score: parseHighScoreNumber(e && e.score),
              n1: sanitizeHighScoreName(e && e.n1),
              n2: sanitizeHighScoreName(e && e.n2),
            };
            if (mode === 'versus') {
              const s2 = parseHighScoreNumber(e && e.score2);
              if (Number.isFinite(s2)) row.score2 = s2;
            }
            return row;
          })
          .filter((e) => Number.isFinite(e.score));
        cleaned.sort((a, b) => b.score - a.score);
        out[mode][sk] = cleaned.slice(0, HS_MAX_ENTRIES);
      }
    }
    return out;
  }

  function refreshLeaderboardFromServer() {
    const url = getLeaderboardRemoteUrl();
    if (!url) return Promise.resolve(false);
    const sep = url.indexOf('?') >= 0 ? '&' : '?';
    return fetch(url + sep + '_=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return false;
        saveHighScoreStore(normalizeLeaderboardPayload(data));
        return true;
      })
      .catch(() => false);
  }

  function pushLeaderboardEntryToServer(modeKey, sectorIdx, scoreNum, n1, n2, loserScore) {
    const url = getLeaderboardRemoteUrl();
    if (!url) return Promise.resolve();
    const body = {
      secret: getLeaderboardRemoteSecret(),
      modeKey,
      sectorIdx: Number(sectorIdx),
      score: scoreNum,
      n1: sanitizeHighScoreName(n1),
      n2: sanitizeHighScoreName(n2),
    };
    if (modeKey === 'versus' && loserScore !== undefined && loserScore !== null && Number.isFinite(Number(loserScore))) {
      body.score2 = Math.floor(Number(loserScore));
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify(body),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.store) saveHighScoreStore(normalizeLeaderboardPayload(data.store));
        else return refreshLeaderboardFromServer();
      })
      .catch(() => {});
  }

  function getHighScoresForSector(modeKey, sectorIdx) {
    const store = loadHighScoreStore();
    const sk = String(sectorIdx);
    const list = store[modeKey] && store[modeKey][sk] ? [...store[modeKey][sk]] : [];
    list.sort((a, b) => parseHighScoreNumber(b.score) - parseHighScoreNumber(a.score));
    return list.slice(0, HS_MAX_ENTRIES);
  }

  function qualifiesForHighScore(modeKey, sectorIdx, score) {
    const list = getHighScoresForSector(modeKey, sectorIdx);
    if (list.length < HS_MAX_ENTRIES) return true;
    const n = Math.floor(Number(score));
    const last = parseHighScoreNumber(list[list.length - 1].score);
    return Number.isFinite(n) && Number.isFinite(last) && n > last;
  }

  function addHighScoreRecord(modeKey, sectorIdx, score, n1, n2, loserScore) {
    const store = loadHighScoreStore();
    const sk = String(sectorIdx);
    if (!store[modeKey]) store[modeKey] = {};
    const list = store[modeKey][sk] ? [...store[modeKey][sk]] : [];
    const sc = Math.floor(Number(score));
    const name1 = sanitizeHighScoreName(n1);
    const name2 = n2 !== undefined && n2 !== null ? sanitizeHighScoreName(n2) : '';
    const entry = {
      score: sc,
      n1: name1,
      n2: name2,
    };
    if (modeKey === 'versus' && loserScore !== undefined && loserScore !== null) {
      const ls = Math.floor(Number(loserScore));
      if (Number.isFinite(ls)) entry.score2 = ls;
    }
    list.push(entry);
    list.sort((a, b) => parseHighScoreNumber(b.score) - parseHighScoreNumber(a.score));
    store[modeKey][sk] = list.slice(0, HS_MAX_ENTRIES);
    saveHighScoreStore(store);
    return pushLeaderboardEntryToServer(modeKey, sectorIdx, sc, name1, name2, modeKey === 'versus' ? entry.score2 : undefined);
  }

  function formatHighScoreEntryLine(modeKey, e) {
    const s1 = String(e.n1 != null ? e.n1 : '').trim();
    const s2 = String(e.n2 != null ? e.n2 : '').trim();
    if (modeKey === 'single') return s1 || '—';
    if (modeKey === 'coop') return `${s1 || '?'} and ${s2 || '?'}`;
    return `${s1 || '?'} beat ${s2 || '?'}`;
  }

  /** Display sector number (CSV LEVEL or 1-based index) for a level index. */
  function getSectorDisplayNumForIndex(idx) {
    if (idx < 0 || !levelConfigs.length || idx >= levelConfigs.length) return null;
    const c = levelConfigs[idx];
    const n = c && Number(c.LEVEL);
    return Number.isFinite(n) && n > 0 ? n : idx + 1;
  }

  function getSectorDisplayNum() {
    return getSectorDisplayNumForIndex(currentLevelIndex);
  }

  /** Level-select / MP hub: browse leaderboards by sector (prev/next + dots). */
  let hsModalBrowseSectors = false;
  /** Mode key used while sector-browsing (single | coop | versus). */
  let hsModalBrowseModeKey = 'single';
  let hsModalBrowseSectorIdx = 0;

  function updateHighScoreOpenButtonsVisible() {
    const ok = currentLevelIndex >= 0 && levelConfigs.length > 0;
    ['high-score-open-single', 'high-score-open-coop', 'high-score-open-versus'].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.hidden = !ok;
    });
  }

  function setHighScoreNewBadge(show) {
    const badge = document.getElementById('high-score-new-badge');
    if (badge) badge.hidden = !show;
  }

  /** Opens leaderboard after score-summary timeouts are scheduled so a render error cannot skip the summary UI. */
  function schedulePendingHighScoreModal() {
    setTimeout(() => {
      if (!pendingHighScoreEntry) return;
      try {
        openHighScoreModal(pendingHighScoreEntry.modeKey);
      } catch (_) {
        /* Summary rows already scheduled; leaderboard is optional */
      }
    }, 0);
  }

  function configureHighScoreAfterRound(opts) {
    const modeKey = opts.modeKey;
    const score = opts.score;
    pendingHighScoreEntry = null;
    setHighScoreNewBadge(false);
    updateHighScoreOpenButtonsVisible();
    if (currentLevelIndex < 0 || !levelConfigs.length) return;
    if (qualifiesForHighScore(modeKey, currentLevelIndex, score)) {
      const sc = Math.floor(Number(score));
      const pending = {
        modeKey,
        sectorIdx: currentLevelIndex,
        score: Number.isFinite(sc) ? sc : 0,
      };
      if (modeKey === 'versus' && opts.loserScore !== undefined && opts.loserScore !== null) {
        const ls = Math.floor(Number(opts.loserScore));
        pending.loserScore = Number.isFinite(ls) ? ls : 0;
      }
      pendingHighScoreEntry = pending;
      setHighScoreNewBadge(true);
    }
  }

  function stashHighScoreInlineWrap() {
    const wrap = document.getElementById('high-score-inline-wrap');
    const box = document.querySelector('#high-score-modal .high-score-modal-box');
    const closeBtn = document.getElementById('high-score-modal-close');
    if (!wrap || !box) return;
    if (wrap.parentNode !== box) {
      if (closeBtn && closeBtn.parentNode === box) box.insertBefore(wrap, closeBtn);
      else box.appendChild(wrap);
    }
    wrap.hidden = true;
    wrap.classList.remove('high-score-inline-wrap--versus');
    wrap.classList.remove('high-score-inline-wrap--coop');
    wrap.classList.remove('high-score-inline-wrap--single');
  }

  function configureHighScoreInlineFields(modeKey) {
    const wrap = document.getElementById('high-score-inline-wrap');
    const conn = document.getElementById('high-score-connector');
    const lab2 = document.getElementById('high-score-label-2');
    const in2 = document.getElementById('high-score-in-2');
    const c1 = document.getElementById('high-score-confirm-btn-1');
    const c2 = document.getElementById('high-score-confirm-btn-2');
    const loserEl = document.getElementById('high-score-loser-score');
    if (wrap) {
      wrap.classList.remove('high-score-inline-wrap--versus');
      wrap.classList.remove('high-score-inline-wrap--coop');
      wrap.classList.remove('high-score-inline-wrap--single');
    }
    if (modeKey === 'single') {
      if (wrap) wrap.classList.add('high-score-inline-wrap--single');
      if (lab2) lab2.hidden = true;
      if (conn) conn.hidden = true;
      if (in2) in2.hidden = true;
      if (c1) c1.hidden = false;
      if (c2) c2.hidden = true;
      if (loserEl) {
        loserEl.hidden = true;
        loserEl.textContent = '';
        loserEl.setAttribute('aria-hidden', 'true');
      }
    } else if (modeKey === 'coop') {
      if (wrap) wrap.classList.add('high-score-inline-wrap--coop');
      if (lab2) lab2.hidden = false;
      if (conn) {
        conn.hidden = false;
        conn.textContent = 'and';
      }
      if (in2) in2.hidden = false;
      if (c1) c1.hidden = true;
      if (c2) c2.hidden = false;
      if (loserEl) {
        loserEl.hidden = true;
        loserEl.textContent = '';
        loserEl.setAttribute('aria-hidden', 'true');
      }
    } else {
      if (wrap) wrap.classList.add('high-score-inline-wrap--versus');
      if (lab2) lab2.hidden = false;
      if (conn) {
        conn.hidden = false;
        conn.textContent = 'beat';
      }
      if (in2) in2.hidden = false;
      if (c1) c1.hidden = false;
      if (c2) c2.hidden = false;
      if (loserEl) {
        loserEl.hidden = false;
        loserEl.removeAttribute('aria-hidden');
        const p = pendingHighScoreEntry;
        const ls = p && p.loserScore !== undefined && p.loserScore !== null ? parseHighScoreNumber(p.loserScore) : NaN;
        loserEl.textContent = Number.isFinite(ls) ? ls.toLocaleString() : '—';
      }
    }
  }

  function renderHighScoreModalList(modeKey, sectorIdx) {
    const ol = document.getElementById('high-score-modal-list');
    if (!ol) return;
    stashHighScoreInlineWrap();

    const pending =
      pendingHighScoreEntry &&
      pendingHighScoreEntry.modeKey === modeKey &&
      Number(pendingHighScoreEntry.sectorIdx) === Number(sectorIdx);

    const saved = getHighScoresForSector(modeKey, sectorIdx);
    let rows = [];
    if (pending) {
      const merged = saved.map((e) => ({ ...e, isPending: false }));
      const pScore = parseHighScoreNumber(pendingHighScoreEntry.score);
      const pend = {
        score: Number.isFinite(pScore) ? pScore : 0,
        n1: '',
        n2: '',
        isPending: true,
      };
      if (modeKey === 'versus' && pendingHighScoreEntry.loserScore !== undefined && pendingHighScoreEntry.loserScore !== null) {
        const ls = parseHighScoreNumber(pendingHighScoreEntry.loserScore);
        pend.score2 = Number.isFinite(ls) ? ls : 0;
      }
      merged.push(pend);
      merged.sort((a, b) => parseHighScoreNumber(b.score) - parseHighScoreNumber(a.score));
      rows = merged.slice(0, HS_MAX_ENTRIES).map((e, i) => ({ ...e, rank: i + 1 }));
    } else {
      rows = saved.slice(0, HS_MAX_ENTRIES).map((e, i) => ({ ...e, rank: i + 1, isPending: false }));
    }
    for (let r = rows.length + 1; r <= HS_MAX_ENTRIES; r++) {
      rows.push({ empty: true, rank: r });
    }

    ol.innerHTML = '';

    const wrap = document.getElementById('high-score-inline-wrap');
    rows.forEach((row) => {
      const li = document.createElement('li');
      if (row.empty) {
        li.className = 'hs-li hs-li--empty';
        const lead = document.createElement('span');
        lead.className = 'hs-li-lead hs-li-empty-lead';
        const rank = document.createElement('span');
        rank.className = 'hs-rank';
        rank.textContent = `${row.rank}.`;
        const msg = document.createElement('span');
        msg.className = 'hs-empty-msg';
        msg.textContent = 'No score posted';
        lead.appendChild(rank);
        lead.appendChild(msg);
        li.appendChild(lead);
        ol.appendChild(li);
        return;
      }
      li.className =
        'hs-li' +
        (row.isPending ? ' hs-li--pending' : '') +
        (modeKey === 'versus' ? ' hs-li--versus' : '');
      const lead = document.createElement('span');
      lead.className = 'hs-li-lead';
      const rank = document.createElement('span');
      rank.className = 'hs-rank';
      rank.textContent = `${row.rank}.`;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'hs-line-score';
      const rawScore =
        row.isPending === true && pendingHighScoreEntry
          ? pendingHighScoreEntry.score
          : row.score;
      const sn = parseHighScoreNumber(rawScore);
      scoreSpan.textContent = Number.isFinite(sn) ? sn.toLocaleString() : '—';
      const sep = document.createElement('span');
      sep.className = 'hs-sep';
      sep.textContent = ' - ';
      lead.appendChild(rank);
      lead.appendChild(scoreSpan);
      lead.appendChild(sep);
      li.appendChild(lead);
      if (row.isPending === true && wrap) {
        wrap.hidden = false;
        li.appendChild(wrap);
      } else if (modeKey === 'versus') {
        const nameBlock = document.createElement('span');
        nameBlock.className = 'hs-vs-line';
        const n1s = document.createElement('span');
        n1s.className = 'hs-vs-n1';
        n1s.textContent = String(row.n1 != null ? row.n1 : '').trim() || '?';
        const beat = document.createElement('span');
        beat.className = 'hs-vs-beat';
        beat.textContent = 'beat';
        const n2s = document.createElement('span');
        n2s.className = 'hs-vs-n2';
        n2s.textContent = String(row.n2 != null ? row.n2 : '').trim() || '?';
        const sepLoser = document.createElement('span');
        sepLoser.className = 'hs-vs-sep';
        sepLoser.textContent = ' - ';
        const lsEl = document.createElement('span');
        lsEl.className = 'hs-vs-loser-score';
        const lsn = parseHighScoreNumber(row.score2);
        lsEl.textContent = Number.isFinite(lsn) ? lsn.toLocaleString() : '—';
        nameBlock.appendChild(n1s);
        nameBlock.appendChild(beat);
        nameBlock.appendChild(n2s);
        nameBlock.appendChild(sepLoser);
        nameBlock.appendChild(lsEl);
        li.appendChild(nameBlock);
      } else {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'hs-name';
        nameSpan.textContent = formatHighScoreEntryLine(modeKey, row);
        li.appendChild(nameSpan);
      }
      ol.appendChild(li);
    });
  }

  function setHighScoreModalHeading(modeKey, sectorIdx) {
    const heading = document.getElementById('high-score-modal-heading');
    if (!heading) return;
    const sec = getSectorDisplayNumForIndex(sectorIdx);
    const modeLabel = modeKey === 'single' ? 'Single' : modeKey === 'coop' ? 'Co-op' : 'Versus';
    heading.textContent = sec !== null ? `Sector ${sec} - ${modeLabel}` : `High scores - ${modeLabel}`;
  }

  function updateHighScoreSectorNavUI(show) {
    const nav = document.getElementById('high-score-sector-nav');
    const dotsEl = document.getElementById('high-score-sector-dots');
    const prev = document.getElementById('high-score-sector-prev');
    const next = document.getElementById('high-score-sector-next');
    if (!nav || !dotsEl) return;
    if (!show || !levelConfigs.length) {
      nav.hidden = true;
      return;
    }
    nav.hidden = false;
    const n = levelConfigs.length;
    dotsEl.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ship-pagination-dot' + (i === hsModalBrowseSectorIdx ? ' is-active' : '');
      const labelNum = getSectorDisplayNumForIndex(i) ?? i + 1;
      dot.setAttribute('aria-label', 'Sector ' + labelNum + ' leaderboard');
      dot.setAttribute('aria-current', i === hsModalBrowseSectorIdx ? 'true' : 'false');
      const idx = i;
      dot.addEventListener('click', () => {
        hsModalBrowseSectorIdx = idx;
        const mk = hsModalBrowseModeKey || 'single';
        renderHighScoreModalList(mk, hsModalBrowseSectorIdx);
        setHighScoreModalHeading(mk, hsModalBrowseSectorIdx);
        updateHighScoreSectorNavUI(true);
      });
      dotsEl.appendChild(dot);
    }
    dotsEl.setAttribute('aria-label', `Sectors (${n})`);
    if (prev) prev.disabled = n <= 1;
    if (next) next.disabled = n <= 1;
  }

  function hsModalShiftSingleSector(delta) {
    if (!hsModalBrowseSectors || !levelConfigs.length) return;
    const n = levelConfigs.length;
    hsModalBrowseSectorIdx = (hsModalBrowseSectorIdx + delta + n) % n;
    const mk = hsModalBrowseModeKey || 'single';
    renderHighScoreModalList(mk, hsModalBrowseSectorIdx);
    setHighScoreModalHeading(mk, hsModalBrowseSectorIdx);
    updateHighScoreSectorNavUI(true);
  }

  async function openHighScoreModal(modeKey, opts) {
    opts = opts || {};
    const browseSectors =
      opts.browseSectors === true || opts.browseSingleSectors === true;
    const modal = document.getElementById('high-score-modal');
    const heading = document.getElementById('high-score-modal-heading');
    const in1 = document.getElementById('high-score-in-1');
    if (!modal || !heading) return;
    if (!levelConfigs.length) return;
    if (!browseSectors && currentLevelIndex < 0) return;

    hsModalBrowseSectors = browseSectors;
    if (browseSectors) {
      hsModalBrowseModeKey = modeKey;
      const init = Number(opts.initialSectorIdx);
      hsModalBrowseSectorIdx = Math.max(0, Math.min(Number.isFinite(init) ? Math.floor(init) : 0, levelConfigs.length - 1));
    }

    const sectorIdxForRender = browseSectors ? hsModalBrowseSectorIdx : currentLevelIndex;
    const modalBox = modal.querySelector('.high-score-modal-box');
    if (modalBox) modalBox.classList.toggle('high-score-modal-box--versus', modeKey === 'versus');
    await refreshLeaderboardFromServer();
    setHighScoreModalHeading(modeKey, sectorIdxForRender);
    renderHighScoreModalList(modeKey, sectorIdxForRender);
    updateHighScoreSectorNavUI(browseSectors);

    const pending =
      pendingHighScoreEntry &&
      pendingHighScoreEntry.modeKey === modeKey &&
      Number(pendingHighScoreEntry.sectorIdx) === Number(sectorIdxForRender);
    if (pending) {
      const in2 = document.getElementById('high-score-in-2');
      if (in1) in1.value = '';
      if (in2) in2.value = '';
      configureHighScoreInlineFields(modeKey);
    }
    modal.hidden = false;
    if (pending && in1) {
      const focusFirst = () => in1.focus({ preventScroll: true });
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focusFirst);
      else focusFirst();
    }
  }

  function closeHighScoreModal() {
    stashHighScoreInlineWrap();
    hsModalBrowseSectors = false;
    const nav = document.getElementById('high-score-sector-nav');
    if (nav) nav.hidden = true;
    const modal = document.getElementById('high-score-modal');
    if (modal) modal.hidden = true;
    const modalBox = modal && modal.querySelector('.high-score-modal-box');
    if (modalBox) modalBox.classList.remove('high-score-modal-box--versus');
  }

  function savePendingHighScore() {
    if (!pendingHighScoreEntry) return;
    const { modeKey, sectorIdx, score } = pendingHighScoreEntry;
    const loserScore =
      modeKey === 'versus' && pendingHighScoreEntry.loserScore !== undefined && pendingHighScoreEntry.loserScore !== null
        ? pendingHighScoreEntry.loserScore
        : undefined;
    const in1 = document.getElementById('high-score-in-1');
    const in2 = document.getElementById('high-score-in-2');
    const n1 = sanitizeHighScoreName(in1 && in1.value);
    if (!n1) return;
    let n2 = '';
    if (modeKey !== 'single') {
      n2 = sanitizeHighScoreName(in2 && in2.value);
      if (!n2) return;
    }
    pendingHighScoreEntry = null;
    setHighScoreNewBadge(false);
    addHighScoreRecord(modeKey, sectorIdx, score, n1, n2, loserScore).finally(() => {
      renderHighScoreModalList(modeKey, sectorIdx);
    });
    renderHighScoreModalList(modeKey, sectorIdx);
  }

  function showLevelModal(text) {
    const el = document.getElementById('level-modal');
    const textEl = document.getElementById('level-modal-text');
    if (!el || !textEl) return;
    textEl.textContent = (text || '').replace(/\/n/g, '\n');
    el.hidden = false;
    modalOpen = true;
    const ok = document.getElementById('level-modal-ok');
    if (ok) ok.focus();
  }

  function hideLevelModal() {
    const el = document.getElementById('level-modal');
    if (el) el.hidden = true;
    modalOpen = false;
  }

  function showSettingsModal() {
    const el = document.getElementById('settings-modal');
    if (!el) return;
    el.hidden = false;
    settingsModalOpen = true;
    const focusables = getMenuFocusables();
    if (focusables.length) focusables[0].focus();
  }

  function hideSettingsModal() {
    const el = document.getElementById('settings-modal');
    if (el) el.hidden = true;
    settingsModalOpen = false;
  }

  function startLevelAt(index) {
    if (!levelConfigs.length) {
      // Fallback: no level data, just start with current globals
      currentLevelIndex = -1;
      startGame();
      return;
    }
    const clamped = Math.max(0, Math.min(index, levelConfigs.length - 1));
    currentLevelIndex = clamped;
    applyLevelConfig(levelConfigs[clamped]);
    startGame();
  }

  function initLevelSelectUI() {
    const shipFromLevelBtn = document.getElementById('ship-select-btn');
    if (shipFromLevelBtn) {
      shipFromLevelBtn.hidden = levelSelectReturnScreen === 'multiplayer-screen';
    }
    const levelLbBtn = document.getElementById('level-select-lb-btn');
    if (levelLbBtn) {
      levelLbBtn.hidden = false;
      if (levelSelectReturnScreen === 'multiplayer-screen') {
        levelLbBtn.setAttribute('data-hs-mode', gameMode === 'versus' ? 'versus' : 'coop');
      } else {
        levelLbBtn.setAttribute('data-hs-mode', 'single');
      }
    }
    updateShipSelectButtonIcon();
    const listEl = document.getElementById('level-list');
    if (!listEl) return;
    const path = getLevelCsvPath();
    if (levelListBuiltForPath === path && listEl.querySelector('button')) return;
    levelListBuiltForPath = path;
    listEl.innerHTML = '';
    loadLevelData().then((configs) => {
      if (!configs.length) {
        const msg = document.createElement('p');
        msg.textContent = 'No level data available.';
        msg.className = 'hint';
        listEl.appendChild(msg);
        return;
      }
      configs.forEach((cfg, idx) => {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        const levelNum = Number(cfg.LEVEL) || idx + 1;
        btn.textContent = 'Sector ' + levelNum;
        btn.addEventListener('click', () => {
          startLevelAt(idx);
        });
        listEl.appendChild(btn);
      });
    });
  }

  let width, height, scale;
  let gameState = 'start'; // start | playing | gameover | win
  let crystalsCollected = 0;
  let asteroidsDestroyed = 0;
  let GAME_SCALE = 0.55;
  let CRYSTALS_TO_WIN = 8;
  let TIME_REMAINING = 60; // 60 seconds default
  let roundTimeRemaining = TIME_REMAINING;

  // Scoring
  const SCORE_CRYSTAL = 1000;
  const SCORE_ASTEROID_XL = 100;
  const SCORE_ASTEROID_L = 150;
  const SCORE_ASTEROID_M = 200;
  const SCORE_ASTEROID_S = 300;
  const SCORE_ASTEROID_XS = 500;
  const SCORE_PER_SECOND_REMAINING = 25;
  /** Versus elimination win: bonus for the player who eliminated the other (replaces time bonus × lives multiplier). */
  const VERSUS_SURVIVOR_BONUS = 5000;
  const SCORE_BY_ASTEROID_SIZE = {
    xl: SCORE_ASTEROID_XL,
    l: SCORE_ASTEROID_L,
    m: SCORE_ASTEROID_M,
    s: SCORE_ASTEROID_S,
    xs: SCORE_ASTEROID_XS,
  };
  // Lives multiplier: 0 ships = 1x, 1 ship = 2x, 2 ships = 3x, 3 ships = 5x
  const LIVES_MULTIPLIER = {
    0: 1,
    1: 2,
    2: 3,
    3: 5,
  };

  let PLAYER_BASE_RADIUS = 18;

  function createPlayerState() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: PLAYER_BASE_RADIUS * GAME_SCALE,
      maxSpeed: 6,
      thrustPower: 0.18,
      friction: 0.975,
      shipStyle: 'ship1',
      shieldCount: 3,
      shieldDuration: 4,
      shieldRechargeTime: 10,
      shieldCountdownFlash: 2,
      bulletSpeed: 400,
      bulletMaxCount: 5,
      bulletLifespanMin: 1200,
      bulletLifespanMax: 1600,
      bulletAccuracyIncrement: 0.1,
      bulletDelay: 0.08,
      bulletAccuracyResetThreshold: 0.25,
      bulletReloadTime: 1.5,
    };
  }

  const players = [createPlayerState(), createPlayerState()];
  const player = players[0];

  // Input + rotation tuning (index 0 = P1, 1 = P2 in multiplayer)
  const inputs = [
    { dx: 0, dy: 0, thrust: false, reverseThrust: false, rotate: 0, fire: false },
    { dx: 0, dy: 0, thrust: false, reverseThrust: false, rotate: 0, fire: false },
  ];
  const input = inputs[0];
  const KEYBOARD_ROTATE_SPEED = 0.12;
  const PRECISION_TAP_MS = 120;
  const PRECISION_ROTATE_RATE = 0.015;
  const rotationHoldStartedAt = [0, 0];
  /** Multiplayer: which gamepad index each slot uses, or -1 for keyboard. Set at game start from UI. */
  let mpGamepadForSlot = [-1, -1];
  /** Ship carousel indices in multiplayer setup (independent per player). */
  let mpShipIndex = [0, 0];
  /** `keyboard` | number (gamepad index). */
  let mpControlPick = ['keyboard', 'keyboard'];
  /** True only while resetting P0 then P1 at round start so P0 ignores stale P1 position. */
  let mpSpawnPairActive = false;

  function isMultiplayer() {
    return gameMode === 'coop' || gameMode === 'versus';
  }
  /** Set when versus match ends by elimination; cleared in `startGame`. Used only for score summary survivor bonus. */
  let lastVersusWinnerSlot = null;
  let asteroidScores = [0, 0];
  let crystalsCollectedByPlayer = [0, 0];
  /** Running points (P1 / P2). Single-player uses index 0 only. */
  let scores = [0, 0];
  let livesP = [3, 3];
  let shieldChargesP = [3, 3];
  let shieldActiveUntilP = [0, 0];
  let lastShieldRechargeAtP = [0, 0];
  let shieldBurstStartTimeP = [0, 0];
  /** Versus: `performance.now/1000` until ship hit flash + pulse ends (bullet damage). */
  let shipBulletHitFlashUntilP = [0, 0];
  /** Versus: `performance.now()` ms until bullet-hit invincibility ends (see `bulletShield`). */
  let shipBulletInvincibleUntilMsP = [0, 0];
  let shieldWasInFlashP = [false, false];
  let lastBulletTimeP = [0, 0];
  let reloadStartedAtP = [null, null];
  let currentBulletAccuracyP = [0, 0];

  // Bullet properties (tuned via panel; CSV can override initial values)
  let bulletSpeed = 400;
  let bulletMaxCount = 5;
  let bulletLifespan = [1200, 1600];
  let bulletAccuracyIncrement = 0.1;
  let bulletDelay = 0.08;
  let bulletAccuracyResetThreshold = 0.25;
  let bulletReloadTime = 1.5;
  const BULLET_FADE_MS = 200;
  /** Versus: ms of invincibility after a bullet hit (prevents multi-hit barrage). */
  const bulletShield = 500;
  let bullets = [];

  // Asteroid sizes (tune each independently; xs ≈ half ship)
  const ASTEROID_XS_RADIUS = 9;
  const ASTEROID_S_RADIUS = 18;
  const ASTEROID_M_RADIUS = 27;
  const ASTEROID_L_RADIUS = 36;
  const ASTEROID_XL_RADIUS = 45;
  const ASTEROID_SIZES = [
    { key: 'xs', radius: ASTEROID_XS_RADIUS },
    { key: 's', radius: ASTEROID_S_RADIUS },
    { key: 'm', radius: ASTEROID_M_RADIUS },
    { key: 'l', radius: ASTEROID_L_RADIUS },
    { key: 'xl', radius: ASTEROID_XL_RADIUS },
  ];
  let ASTEROID_SPAWN_COUNT = 6;
  // Minimum size index (0=xs .. 4=xl). From level CSV ASTEROID_MIN_SIZE (1-6, 1=xs 6=xl).
  let ASTEROID_MIN_SIZE_INDEX = 0;
  // Size weights: [xs, s, m, l, xl] — higher = more likely; weighted toward larger
  let asteroidSizeWeights = [1, 1, 2, 2, 3];

  // Asteroid break-up on bullet hit (tunable)
  const ASTEROID_BREAK_CHANCE_FIRST = 0.8;
  const ASTEROID_BREAK_CHANCE_SECOND = 0.4;
  const ASTEROID_BREAK_CHANCE_TWO_SIZES_SMALLER = 0.2;

  // Asteroid rotation (radians per second; sign randomized per asteroid)
  const ASTEROID_ROT_SPEED_MIN = 0.15;
  const ASTEROID_ROT_SPEED_MAX = 0.6;

  // Shield
  let SHIELD_COUNT = 3;
  const SHIELD_DURATION = 4; // seconds
  const SHIELD_RECHARGE_TIME = 10; // seconds
  const SHIELD_COUNTDOWN = 2; // seconds of burst previews at end

  const SHIELD_RADIUS = 35;
  const SHIELD_THICKNESS = 1;
  const SHIELD_THICKNESS_COLOR = '#00ff00';
  const SHIELD_THICKNESS_OPACITY = 0.5;
  const SHIELD_INNER_COLOR = '#00ff00';
  const SHIELD_INNER_OPACITY = 0.15;
  const SHIELD_FLASH_INTERVAL = 1;
  const SHIELD_FLASH_DURATION = 0.5;
  const SHIELD_FLASH_MULTIPLIER = 1;
  const SHIELD_FLASH_COLOR = '#00ff00';
  const SHIELD_FLASH_OPACITY = 1;

  // ----- Gamepad (EXTRACT: entire block from here through pollGamepad + connect/disconnect listeners)
  // Reusable part: active index, connect/disconnect, deadzone constants, raw axes/buttons reading.
  // Game-specific part: mapping to this game's input object and menu actions (see comments inside pollGamepad).
  let activeGamepadIndex = null;
  /** Number of connected gamepads from the last poll (desktop Chrome/Edge/Firefox; Android WebView when API is available). */
  let connectedGamepadCount = 0;
  const GAMEPAD_DEADZONE = 0.18;
  let lastGamepadMenuConfirm = false;
  let lastGamepadMenuBack = false;
  let lastGamepadMenuNavUp = false;
  let lastGamepadMenuNavDown = false;
  let lastGamepadMenuNavLeft = false;
  let lastGamepadMenuNavRight = false;

  // Stars (parallax layers)
  let stars = [];
  const STAR_LAYERS = 3;

  // Entities
  let asteroids = [];
  let crystals = [];
  let particles = [];

  const SHIELD_BURST_DURATION = 0.45;
  const SHIELD_BURST_EXPAND_SPEED = 280;
  const SHIP_HIT_FLASH_DURATION = 0.32;
  /** Bullet-hit shake amplitude (multiplied by GAME_SCALE); decays over the flash window. */
  const SHIP_HIT_SHAKE_MAX = 6;

  // Performance: on Fire Stick / Android / TV, use lower resolution and no shadows for playable FPS
  const MAX_RENDER_WIDTH = 1280;
  const MAX_RENDER_HEIGHT = 720;
  function isLowPerfDevice() {
    if (typeof window === 'undefined') return false;
    if (window.Capacitor) return true;
    const ua = navigator.userAgent || '';
    return /Android|aftm|aftb/i.test(ua);
  }
  let lowQualityMode = false;

  function resize() {
    lowQualityMode = isLowPerfDevice();
    if (lowQualityMode) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = Math.min(MAX_RENDER_WIDTH / w, MAX_RENDER_HEIGHT / h, 1);
      width = Math.max(1, Math.floor(w * ratio));
      height = Math.max(1, Math.floor(h * ratio));
      canvas.width = width;
      canvas.height = height;
    } else {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    scale = Math.min(width, height) / 600;
    initStars();
    if (gameState === 'playing') {
      placeCrystals();
    }
  }

  function initStars() {
    stars = [];
    const divisor = lowQualityMode ? 4000 : 1500;
    const count = Math.floor((width * height) / divisor);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1,
        layer: Math.floor(Math.random() * STAR_LAYERS),
        twinkle: Math.random() * Math.PI * 2,
        alphaMul: 0.2 + Math.random() * 0.6, // 20%–80% per star
      });
    }
  }

  function resetPlayerSlot(slot) {
    const p = players[slot];
    const w = width > 0 ? width : 600;
    const h = height > 0 ? height : 600;
    const minDim = Math.min(w, h);
    const margin = minDim * 0.08;
    const r = Math.max(p.radius || 18, 24);
    const minX = margin + r;
    const maxX = w - margin - r;
    const minY = margin + r;
    const maxY = h - margin - r;
    const spanX = Math.max(0, maxX - minX);
    const spanY = Math.max(0, maxY - minY);

    function randX() {
      return minX + (spanX > 0 ? Math.random() * spanX : 0);
    }
    function randY() {
      return minY + (spanY > 0 ? Math.random() * spanY : 0);
    }

    const mp = isMultiplayer();
    const minSep = mp ? minDim * 0.2 : 0;
    const p0 = players[0];
    const p1 = players[1];

    function placeRandomAvoiding(ox, oy) {
      let tries = 0;
      do {
        p.x = randX();
        p.y = randY();
        tries++;
      } while (tries < 80 && dist(p.x, p.y, ox, oy) < minSep);
      if (tries >= 80) {
        const ang = Math.random() * Math.PI * 2;
        const d = Math.max(minSep, minDim * 0.28);
        p.x = ox + Math.cos(ang) * d;
        p.y = oy + Math.sin(ang) * d;
        p.x = Math.max(minX, Math.min(maxX, p.x));
        p.y = Math.max(minY, Math.min(maxY, p.y));
      }
    }

    if (!mp) {
      p.x = randX();
      p.y = randY();
    } else if (slot === 0) {
      if (mpSpawnPairActive || livesP[1] <= 0) {
        p.x = randX();
        p.y = randY();
      } else {
        placeRandomAvoiding(p1.x, p1.y);
      }
    } else if (livesP[0] > 0) {
      placeRandomAvoiding(p0.x, p0.y);
    } else {
      p.x = randX();
      p.y = randY();
    }

    p.vx = 0;
    p.vy = 0;
    p.angle = Math.random() * Math.PI * 2;
  }

  function resetPlayer() {
    resetPlayerSlot(0);
  }

  function minClearanceToPlayers(x, y) {
    let m = Infinity;
    const n = isMultiplayer() ? 2 : 1;
    for (let s = 0; s < n; s++) {
      if (isMultiplayer() && livesP[s] <= 0) continue;
      m = Math.min(m, dist(x, y, players[s].x, players[s].y));
    }
    return m;
  }

  function spawnAsteroids() {
    asteroids = [];
    for (let i = 0; i < ASTEROID_SPAWN_COUNT; i++) {
      asteroids.push(createAsteroid());
    }
  }

  function pickAsteroidSizeIndex() {
    const start = ASTEROID_MIN_SIZE_INDEX;
    const weights = asteroidSizeWeights.slice(start);
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) return start;
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return start + i;
    }
    return start + weights.length - 1;
  }

  function createAsteroid() {
    const margin = 80;
    let x, y;
    do {
      x = margin + Math.random() * (width - margin * 2);
      y = margin + Math.random() * (height - margin * 2);
    } while (minClearanceToPlayers(x, y) < 120);
    const sizeIndex = pickAsteroidSizeIndex();
    const sizeDef = ASTEROID_SIZES[sizeIndex];
    const baseR = sizeDef.radius;
    const r = baseR * GAME_SCALE;
    const verts = 6 + Math.floor(Math.random() * 4);
    const shape = [];
    for (let i = 0; i < verts; i++) {
      const a = (i / verts) * Math.PI * 2 + Math.random() * 0.5;
      const jitter = 0.7 + Math.random() * 0.6;
      shape.push(r * jitter * Math.cos(a));
      shape.push(r * jitter * Math.sin(a));
    }
    const rotRange = ASTEROID_ROT_SPEED_MAX - ASTEROID_ROT_SPEED_MIN;
    const rotSpeed = ASTEROID_ROT_SPEED_MIN + Math.random() * rotRange;
    return {
      x, y,
      size: sizeDef.key,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      shape,
      radius: r,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: Math.random() < 0.5 ? -rotSpeed : rotSpeed,
    };
  }

  function createAsteroidAt(x, y, sizeIndex) {
    const sizeDef = ASTEROID_SIZES[Math.max(0, Math.min(sizeIndex, ASTEROID_SIZES.length - 1))];
    const baseR = sizeDef.radius;
    const r = baseR * GAME_SCALE;
    const verts = 6 + Math.floor(Math.random() * 4);
    const shape = [];
    for (let i = 0; i < verts; i++) {
      const a = (i / verts) * Math.PI * 2 + Math.random() * 0.5;
      const jitter = 0.7 + Math.random() * 0.6;
      shape.push(r * jitter * Math.cos(a));
      shape.push(r * jitter * Math.sin(a));
    }
    const offset = 4;
    const rotRange = ASTEROID_ROT_SPEED_MAX - ASTEROID_ROT_SPEED_MIN;
    const rotSpeed = ASTEROID_ROT_SPEED_MIN + Math.random() * rotRange;
    return {
      x: x + (Math.random() - 0.5) * offset * 2,
      y: y + (Math.random() - 0.5) * offset * 2,
      size: sizeDef.key,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      shape,
      radius: r,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: Math.random() < 0.5 ? -rotSpeed : rotSpeed,
    };
  }

  function placeCrystals() {
    crystals = [];
    for (let i = 0; i < CRYSTALS_TO_WIN; i++) {
      crystals.push(spawnCrystal());
    }
  }

  function spawnCrystal() {
    const margin = 60;
    let x, y;
    do {
      x = margin + Math.random() * (width - margin * 2);
      y = margin + Math.random() * (height - margin * 2);
    } while (minClearanceToPlayers(x, y) < 80);
    return {
      x, y,
      radius: 12 * GAME_SCALE,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function countBulletsForOwner(owner) {
    let c = 0;
    for (let i = 0; i < bullets.length; i++) {
      if (bullets[i].owner === owner) c++;
    }
    return c;
  }

  function fireBullet(accuracySpread, owner) {
    const slot = owner === undefined || owner === null ? 0 : owner;
    const p = players[slot];
    const baseAngle = p.angle + (Math.random() - 0.5) * accuracySpread;
    const minMs = p.bulletLifespanMin ?? bulletLifespan[0] ?? 250;
    const maxMs = p.bulletLifespanMax ?? bulletLifespan[1] ?? 250;
    const lifespanMs = minMs + Math.random() * (Math.max(maxMs, minMs) - minMs);
    const spd = p.bulletSpeed;

    function spawnBullet(offsetSide) {
      const angle = baseAngle;
      const vx = Math.sin(angle) * spd;
      const vy = -Math.cos(angle) * spd;

      let spawnX = p.x;
      let spawnY = p.y;
      if (offsetSide !== 0) {
        const lateral = 6 * GAME_SCALE * offsetSide;
        const cosA = Math.cos(p.angle);
        const sinA = Math.sin(p.angle);
        spawnX += cosA * lateral;
        spawnY += sinA * lateral;
      }

      bullets.push({
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        expiryTime: performance.now() + lifespanMs,
        owner: slot,
      });
    }

    if (p.shipStyle === 'ship2') {
      spawnBullet(-1);
      spawnBullet(1);
    } else {
      spawnBullet(0);
    }
  }

  function updateBullets(dt) {
    const w = canvas.width;
    const h = canvas.height;
    const now = performance.now();
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (now >= b.expiryTime) {
        bullets.splice(i, 1);
        continue;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (w > 0) {
        while (b.x < 0) b.x += w;
        while (b.x >= w) b.x -= w;
      }
      if (h > 0) {
        while (b.y < 0) b.y += h;
        while (b.y >= h) b.y -= h;
      }
    }
  }

  function updatePlayerSlot(slot, dt) {
    if (isMultiplayer() && livesP[slot] <= 0) return;
    const player = players[slot];
    const input = inputs[slot];
    const turnSpeed = 0.08;
    if (input.rotate !== 0) {
      const now = performance.now();
      const rh = rotationHoldStartedAt[slot];
      const elapsed = rh ? now - rh : PRECISION_TAP_MS;
      const rate = elapsed >= PRECISION_TAP_MS ? KEYBOARD_ROTATE_SPEED : PRECISION_ROTATE_RATE;
      player.angle += input.rotate * rate;
    } else if (input.dx !== 0 || input.dy !== 0) {
      const targetAngle = Math.atan2(-input.dy, input.dx) - Math.PI / 2;
      let da = targetAngle - player.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      player.angle += da * turnSpeed * (1 + Math.hypot(input.dx, input.dy));
    }
    if (input.thrust) {
      player.vx += Math.sin(player.angle) * player.thrustPower;
      player.vy -= Math.cos(player.angle) * player.thrustPower;
    }
    if (input.reverseThrust) {
      const reversePower = player.thrustPower * 0.5;
      player.vx -= Math.sin(player.angle) * reversePower;
      player.vy += Math.cos(player.angle) * reversePower;
    }
    player.vx *= player.friction;
    player.vy *= player.friction;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > player.maxSpeed) {
      player.vx = (player.vx / speed) * player.maxSpeed;
      player.vy = (player.vy / speed) * player.maxSpeed;
    }
    player.x += player.vx;
    player.y += player.vy;
    const w = canvas.width;
    const h = canvas.height;
    if (w > 0) {
      while (player.x < 0) player.x += w;
      while (player.x >= w) player.x -= w;
    }
    if (h > 0) {
      while (player.y < 0) player.y += h;
      while (player.y >= h) player.y -= h;
    }
  }

  function updatePlayer(dt) {
    updatePlayerSlot(0, dt);
  }

  function updateAsteroids(dt) {
    const w = width;
    const h = height;
    asteroids.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.rotSpeed * dt;
      if (w > 0) {
        while (a.x < 0) a.x += w;
        while (a.x >= w) a.x -= w;
      }
      if (h > 0) {
        while (a.y < 0) a.y += h;
        while (a.y >= h) a.y -= h;
      }
    });
  }

  function updateCrystals(dt) {
    crystals.forEach((c) => {
      c.pulse += dt * 3;
    });
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function addParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 2;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color,
        life: 0.5 + Math.random() * 0.5,
        size: (2 + Math.random() * 2) * GAME_SCALE,
      });
    }
  }

  function spawnAsteroidsFromBreakup(x, y, sizeIndex) {
    if (sizeIndex <= ASTEROID_MIN_SIZE_INDEX) return;
    const oneSmaller = Math.max(ASTEROID_MIN_SIZE_INDEX, sizeIndex - 1);
    const twoSmaller = Math.max(ASTEROID_MIN_SIZE_INDEX, sizeIndex - 2);
    const pickSize = () =>
      Math.random() < ASTEROID_BREAK_CHANCE_TWO_SIZES_SMALLER ? twoSmaller : oneSmaller;
    if (Math.random() < ASTEROID_BREAK_CHANCE_FIRST) asteroids.push(createAsteroidAt(x, y, pickSize()));
    if (Math.random() < ASTEROID_BREAK_CHANCE_SECOND) asteroids.push(createAsteroidAt(x, y, pickSize()));
  }

  function checkCollisions(nowSec) {
    const hitAsteroids = new Map();
    const hitBullets = new Set();
    for (let bi = 0; bi < bullets.length; bi++) {
      const b = bullets[bi];
      const owner = b.owner !== undefined && b.owner !== null ? b.owner : 0;
      for (let ai = 0; ai < asteroids.length; ai++) {
        const a = asteroids[ai];
        if (dist(b.x, b.y, a.x, a.y) < a.radius) {
          hitBullets.add(b);
          hitAsteroids.set(a, owner);
          break;
        }
      }
    }
    bullets = bullets.filter((b) => !hitBullets.has(b));
    hitAsteroids.forEach((owner, a) => {
      asteroidsDestroyed++;
      const asteroidPoints = SCORE_BY_ASTEROID_SIZE[a.size] ?? 0;
      asteroidScores[owner] += asteroidPoints;
      scores[owner] += asteroidPoints;
      addParticles(a.x, a.y, COLORS.asteroidFill, 8);
      const sizeIndex = ASTEROID_SIZES.findIndex((s) => s.key === a.size);
      spawnAsteroidsFromBreakup(a.x, a.y, sizeIndex);
    });
    asteroids = asteroids.filter((a) => !hitAsteroids.has(a));

    const scaledShieldRadius = SHIELD_RADIUS * GAME_SCALE;
    const shieldDestroyed = new Set();
    const maxPl = isMultiplayer() ? 2 : 1;
    asteroids.forEach((a) => {
      if (shieldDestroyed.has(a)) return;
      for (let slot = 0; slot < maxPl; slot++) {
        if (livesP[slot] <= 0) continue;
        const pl = players[slot];
        const shieldActive = nowSec < shieldActiveUntilP[slot];
        const d = dist(a.x, a.y, pl.x, pl.y);
        if (shieldActive && d < scaledShieldRadius + a.radius) {
          shieldDestroyed.add(a);
          asteroidsDestroyed++;
          const asteroidPoints = SCORE_BY_ASTEROID_SIZE[a.size] ?? 0;
          asteroidScores[slot] += asteroidPoints;
          scores[slot] += asteroidPoints;
          addParticles(a.x, a.y, COLORS.asteroidFill, 8);
          const sizeIndex = ASTEROID_SIZES.findIndex((s) => s.key === a.size);
          spawnAsteroidsFromBreakup(a.x, a.y, sizeIndex);
          return;
        }
        if (!shieldActive && d < a.radius + pl.radius) {
          livesP[slot]--;
          addParticles(pl.x, pl.y, COLORS.accentCyan, 12);
          resetPlayerSlot(slot);
          if (gameMode === 'versus') {
            const other = slot === 0 ? 1 : 0;
            if (livesP[slot] <= 0) {
              triggerVersusWin(other);
            }
          } else if (!isMultiplayer()) {
            if (livesP[0] <= 0) {
              gameState = 'gameover';
              showScreen('game-over-screen');
              const gt = document.getElementById('game-over-title');
              if (gt) gt.textContent = 'Mission Over';
              document.getElementById('final-score').textContent = 'Score: ' + scores[0];
              const fp2 = document.getElementById('final-score-p2');
              if (fp2) fp2.hidden = true;
              const vr = document.getElementById('versus-result');
              if (vr) vr.hidden = true;
            }
          } else if (gameMode === 'coop') {
            if (livesP[0] <= 0 && livesP[1] <= 0) {
              gameState = 'gameover';
              showCoopGameOverScreen();
            }
          }
          return;
        }
      }
    });
    if (shieldDestroyed.size) {
      asteroids = asteroids.filter((a) => !shieldDestroyed.has(a));
    }

    if (gameMode === 'versus') {
      const br = 3 * GAME_SCALE;
      const shieldR = SHIELD_RADIUS * GAME_SCALE;
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        const o = b.owner !== undefined && b.owner !== null ? b.owner : 0;
        const target = o === 0 ? 1 : 0;
        if (livesP[target] <= 0) continue;
        const tp = players[target];
        if (nowSec < shieldActiveUntilP[target]) {
          if (dist(b.x, b.y, tp.x, tp.y) < shieldR + br) {
            bullets.splice(bi, 1);
          }
          continue;
        }
        if (dist(b.x, b.y, tp.x, tp.y) < tp.radius + br) {
          const nowMs = performance.now();
          if (nowMs < shipBulletInvincibleUntilMsP[target]) {
            bullets.splice(bi, 1);
            continue;
          }
          bullets.splice(bi, 1);
          livesP[target]--;
          addParticles(tp.x, tp.y, COLORS.accentCyan, 12);
          resetPlayerSlot(target);
          if (livesP[target] > 0) {
            shipBulletHitFlashUntilP[target] = nowSec + SHIP_HIT_FLASH_DURATION;
            shipBulletInvincibleUntilMsP[target] = nowMs + bulletShield;
          }
          if (livesP[target] <= 0) {
            triggerVersusWin(o);
            break;
          }
        }
      }
    }

    for (let i = crystals.length - 1; i >= 0; i--) {
      const c = crystals[i];
      for (let slot = 0; slot < maxPl; slot++) {
        if (livesP[slot] <= 0) continue;
        const pl = players[slot];
        if (dist(pl.x, pl.y, c.x, c.y) < pl.radius + c.radius) {
          crystals.splice(i, 1);
          crystalsCollected++;
          crystalsCollectedByPlayer[slot]++;
          scores[slot] += SCORE_CRYSTAL;
          addParticles(c.x, c.y, COLORS.accentGold, 6);
          break;
        }
      }
    }

    if (
      gameState === 'playing' &&
      gameMode !== 'versus' &&
      crystalsCollected >= CRYSTALS_TO_WIN &&
      asteroids.length === 0
    ) {
      triggerWin('complete');
    }
  }

  function triggerVersusWin(winnerSlot) {
    if (gameState !== 'playing') return;
    gameState = 'win';
    lastVersusWinnerSlot = winnerSlot;
    hideScreens();
    showScoreSummaryMulti();
    const sumTitle = document.getElementById('score-summary-title');
    if (sumTitle) sumTitle.textContent = 'Match Over';
  }

  function showCoopGameOverScreen() {
    gameState = 'gameover';
    hideScreens();
    showScreen('game-over-screen');
    const title = document.getElementById('game-over-title');
    if (title) title.textContent = 'Mission Over';
    document.getElementById('final-score').textContent = 'P1 Score: ' + scores[0];
    const p2 = document.getElementById('final-score-p2');
    if (p2) {
      p2.hidden = false;
      p2.textContent = 'P2 Score: ' + scores[1];
    }
    const vr = document.getElementById('versus-result');
    if (vr) vr.hidden = true;
  }

  function triggerWin(reason) {
    gameState = 'win';
    if (isMultiplayer()) {
      showScoreSummaryMulti();
      return;
    }
    const crystalPoints = crystalsCollected * SCORE_CRYSTAL;
    const timeBonus = Math.max(0, Math.ceil(roundTimeRemaining)) * SCORE_PER_SECOND_REMAINING;
    const baseScore = scores[0] + timeBonus;
    const multiplier = LIVES_MULTIPLIER[livesP[0]] ?? 1;
    const finalScore = Math.floor(baseScore * multiplier);
    showScoreSummary(crystalPoints, asteroidScores[0], timeBonus, multiplier, baseScore, finalScore);
  }

  function showScoreSummaryMulti() {
    const isVersus = gameMode === 'versus';
    const timeBonus = Math.max(0, Math.ceil(roundTimeRemaining)) * SCORE_PER_SECOND_REMAINING;
    const single = document.getElementById('score-summary-single');
    const multi = document.getElementById('score-summary-multi');
    if (single) single.hidden = true;
    if (multi) multi.hidden = false;
    const title = document.getElementById('score-summary-title');
    if (title) title.textContent = 'Round Complete';

    const setRowMode = (suffix, versus) => {
      const timeEl = document.getElementById(`summary-time-${suffix}`);
      const multEl = document.getElementById(`summary-multiplier-${suffix}`);
      const survEl = document.getElementById(`summary-survivor-${suffix}`);
      if (timeEl) timeEl.hidden = !!versus;
      if (multEl) multEl.hidden = !!versus;
      if (survEl) survEl.hidden = !versus;
    };
    setRowMode('p1', isVersus);
    setRowMode('p2', isVersus);

    function lineVals(slot) {
      const cPts = crystalsCollectedByPlayer[slot] * SCORE_CRYSTAL;
      const aPts = asteroidScores[slot];
      if (isVersus) {
        const survivor = lastVersusWinnerSlot === slot ? VERSUS_SURVIVOR_BONUS : 0;
        const total = scores[slot] + survivor;
        return { cPts, aPts, survivor, total };
      }
      const mult = LIVES_MULTIPLIER[livesP[slot]] ?? 1;
      const base = scores[slot] + timeBonus;
      const total = Math.floor(base * mult);
      return { cPts, aPts, timeBonus, mult, base, total };
    }
    const v0 = lineVals(0);
    const v1 = lineVals(1);
    const combined = v0.total + v1.total;

    const versHsWrap = document.getElementById('summary-versus-hs-wrap');
    if (versHsWrap) {
      versHsWrap.hidden = !isVersus;
      versHsWrap.classList.remove('visible');
      const vws = document.getElementById('summary-versus-winner-score');
      const vBtn = document.getElementById('high-score-open-versus');
      const vTot = document.getElementById('summary-total-versus');
      if (isVersus) {
        const w = lastVersusWinnerSlot === 0 ? v0.total : v1.total;
        if (vws) vws.textContent = w.toLocaleString();
      }
      if (vBtn) vBtn.classList.remove('visible');
      if (vTot) vTot.classList.remove('visible');
    }
    const lbwPre = document.getElementById('summary-combined-lb-wrap');
    const coopBtnPre = document.getElementById('high-score-open-coop');
    if (lbwPre) lbwPre.classList.remove('visible');
    if (coopBtnPre) coopBtnPre.classList.remove('visible');

    showScreen('score-summary-screen');

    const hsModeMulti = isVersus ? 'versus' : 'coop';
    const hsScoreMulti = isVersus ? (lastVersusWinnerSlot === 0 ? v0.total : v1.total) : combined;
    const hsOpts = { modeKey: hsModeMulti, score: hsScoreMulti };
    if (isVersus) {
      hsOpts.loserScore = lastVersusWinnerSlot === 0 ? v1.total : v0.total;
    }
    configureHighScoreAfterRound(hsOpts);

    [['summary-crystals-p1', 0], ['summary-crystals-p2', 1]].forEach(([id, slot]) => {
      const row = document.getElementById(id);
      const lab = row && row.querySelector('.score-label');
      if (lab) lab.textContent = 'Crystals x' + crystalsCollectedByPlayer[slot];
    });

    const ids = isVersus
      ? [
          ['summary-crystals-p1', v0.cPts],
          ['summary-asteroids-p1', v0.aPts],
          ['summary-survivor-p1', v0.survivor],
          ['summary-total-p1', v0.total],
          ['summary-crystals-p2', v1.cPts],
          ['summary-asteroids-p2', v1.aPts],
          ['summary-survivor-p2', v1.survivor],
          ['summary-total-p2', v1.total],
        ]
      : [
          ['summary-crystals-p1', v0.cPts],
          ['summary-asteroids-p1', v0.aPts],
          ['summary-time-p1', v0.timeBonus],
          ['summary-multiplier-p1', v0.mult + 'x'],
          ['summary-total-p1', v0.total],
          ['summary-crystals-p2', v1.cPts],
          ['summary-asteroids-p2', v1.aPts],
          ['summary-time-p2', v1.timeBonus],
          ['summary-multiplier-p2', v1.mult + 'x'],
          ['summary-total-p2', v1.total],
        ];
    const items = ids.map(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.querySelector('.score-value').textContent = typeof val === 'number' ? val.toLocaleString() : val;
      return el;
    }).filter(Boolean);
    items.forEach((item) => item.classList.remove('visible'));
    const combEl = document.getElementById('summary-combined-row');
    if (combEl) {
      if (isVersus) {
        combEl.hidden = true;
      } else {
        combEl.hidden = false;
        const cv = document.getElementById('summary-combined-value');
        if (cv) cv.textContent = combined.toLocaleString();
        combEl.classList.remove('visible');
        const lbw = document.getElementById('summary-combined-lb-wrap');
        const cbtn = document.getElementById('high-score-open-coop');
        const inner = combEl.querySelector('.score-item');
        if (lbw) lbw.classList.remove('visible');
        if (cbtn) cbtn.classList.remove('visible');
        if (inner) inner.classList.remove('visible');
      }
    }

    let delay = 0;
    const ANIMATION_DELAY = 400;
    const order = isVersus
      ? [
          'summary-crystals-p1', 'summary-asteroids-p1', 'summary-survivor-p1', 'summary-total-p1',
          'summary-crystals-p2', 'summary-asteroids-p2', 'summary-survivor-p2', 'summary-total-p2',
        ]
      : [
          'summary-crystals-p1', 'summary-asteroids-p1', 'summary-time-p1', 'summary-multiplier-p1', 'summary-total-p1',
          'summary-crystals-p2', 'summary-asteroids-p2', 'summary-time-p2', 'summary-multiplier-p2', 'summary-total-p2',
        ];
    order.forEach((id) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.classList.add('visible');
      }, delay);
      delay += ANIMATION_DELAY;
    });
    if (!isVersus) {
      setTimeout(() => {
        if (combEl) {
          combEl.classList.add('visible');
          const lbw = document.getElementById('summary-combined-lb-wrap');
          const cbtn = document.getElementById('high-score-open-coop');
          const inner = combEl.querySelector('.score-item');
          if (lbw) lbw.classList.add('visible');
          if (cbtn) cbtn.classList.add('visible');
          if (inner) inner.classList.add('visible');
        }
      }, delay);
      delay += ANIMATION_DELAY;
    } else {
      setTimeout(() => {
        const vw = document.getElementById('summary-versus-hs-wrap');
        const tv = document.getElementById('summary-total-versus');
        const vb = document.getElementById('high-score-open-versus');
        if (vw) vw.classList.add('visible');
        if (tv) tv.classList.add('visible');
        if (vb) vb.classList.add('visible');
      }, delay);
      delay += ANIMATION_DELAY;
    }
    setTimeout(() => {
      scores[0] = v0.total;
      scores[1] = v1.total;
    }, delay);
    schedulePendingHighScoreModal();
  }

  function showScoreSummary(crystalPoints, asteroidPoints, timeBonus, multiplier, baseScore, finalScore) {
    const singleEl = document.getElementById('score-summary-single');
    const multiEl = document.getElementById('score-summary-multi');
    if (singleEl) singleEl.hidden = false;
    if (multiEl) multiEl.hidden = true;
    const versHsWrap = document.getElementById('summary-versus-hs-wrap');
    if (versHsWrap) {
      versHsWrap.hidden = true;
      versHsWrap.classList.remove('visible');
    }
    const vBtnVers = document.getElementById('high-score-open-versus');
    const vTotVers = document.getElementById('summary-total-versus');
    if (vBtnVers) vBtnVers.classList.remove('visible');
    if (vTotVers) vTotVers.classList.remove('visible');
    const title = document.getElementById('score-summary-title');
    if (title) title.textContent = 'Round Complete';
    showScreen('score-summary-screen');
    configureHighScoreAfterRound({ modeKey: 'single', score: finalScore });

    const tw0 = document.getElementById('summary-total-wrap');
    if (tw0) tw0.classList.remove('visible');
    const sbtn0 = document.getElementById('high-score-open-single');
    if (sbtn0) sbtn0.classList.remove('visible');

    // Hide all items initially
    const items = [
      document.getElementById('summary-crystals'),
      document.getElementById('summary-asteroids'),
      document.getElementById('summary-time'),
      document.getElementById('summary-multiplier'),
      document.getElementById('summary-total-wrap'),
    ];
    items.forEach((item) => item && item.classList.remove('visible'));
    const totalEl = document.getElementById('summary-total');
    if (totalEl) totalEl.classList.remove('visible');
    
    // Animate each item one at a time
    let delay = 0;
    const ANIMATION_DELAY = 400; // ms between each item
    
    // Crystals (show point value)
    setTimeout(() => {
      const el = document.getElementById('summary-crystals');
      if (!el) return;
      const lab = el.querySelector('.score-label');
      if (lab) lab.textContent = 'Crystals x' + crystalsCollected;
      const val = el.querySelector('.score-value');
      if (val) val.textContent = crystalPoints.toLocaleString();
      el.classList.add('visible');
    }, delay);
    delay += ANIMATION_DELAY;
    
    // Asteroids (show point value)
    setTimeout(() => {
      const el = document.getElementById('summary-asteroids');
      if (!el) return;
      const val = el.querySelector('.score-value');
      if (val) val.textContent = asteroidPoints.toLocaleString();
      el.classList.add('visible');
    }, delay);
    delay += ANIMATION_DELAY;
    
    // Time remaining (show point value)
    setTimeout(() => {
      const el = document.getElementById('summary-time');
      if (!el) return;
      const val = el.querySelector('.score-value');
      if (val) val.textContent = timeBonus.toLocaleString();
      el.classList.add('visible');
    }, delay);
    delay += ANIMATION_DELAY;
    
    // Multiplier
    setTimeout(() => {
      const el = document.getElementById('summary-multiplier');
      if (!el) return;
      const val = el.querySelector('.score-value');
      if (val) val.textContent = multiplier + 'x';
      el.classList.add('visible');
    }, delay);
    delay += ANIMATION_DELAY;
    
    // Total score
    setTimeout(() => {
      const el = document.getElementById('summary-total');
      if (!el) return;
      const wrap = document.getElementById('summary-total-wrap');
      const btn = document.getElementById('high-score-open-single');
      const val = el.querySelector('.score-value');
      if (val) val.textContent = finalScore.toLocaleString();
      el.classList.add('visible');
      if (wrap) wrap.classList.add('visible');
      if (btn) btn.classList.add('visible');
    }, delay);

    setTimeout(() => {
      scores[0] = finalScore;
    }, delay);
    schedulePendingHighScoreModal();
  }

  function showScreen(id) {
    document.querySelectorAll('#screens > div').forEach((el) => el.classList.remove('visible'));
    const el = document.getElementById(id);
    if (el) {
      el.hidden = false;
      el.classList.add('visible');
      const focusables = getMenuFocusables();
      if (focusables.length) focusables[0].focus();
    }
  }

  function hideScreens() {
    closeHighScoreModal();
    document.querySelectorAll('#screens > div').forEach((el) => {
      el.hidden = true;
      el.classList.remove('visible');
    });
  }

  function getShipDescription(cfg) {
    if (!cfg) return '';
    if (cfg.description) return cfg.description;
    if (cfg.shipStyle) return `Variant ${cfg.shipStyle}`;
    return 'Ship configuration';
  }

  function getConnectedGamepadIndices() {
    const gamepads = navigator.getGamepads && navigator.getGamepads();
    const out = [];
    if (!gamepads) return out;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) out.push(i);
    }
    return out;
  }

  function fillMpControlSelect(el, slot) {
    if (!el) return;
    el.innerHTML = '';
    const kbd = document.createElement('option');
    kbd.value = 'keyboard';
    kbd.textContent =
      slot === 0 ? 'Keyboard (arrows · space · r-shift)' : 'Keyboard (W A S D · l-shift · tab)';
    el.appendChild(kbd);
    for (let i = 0; i < 4; i++) {
      const o = document.createElement('option');
      o.value = 'gp:' + i;
      const conn = getConnectedGamepadIndices().includes(i);
      o.textContent = 'Controller ' + (i + 1) + (conn ? ' (connected)' : '');
      el.appendChild(o);
    }
    const want = mpControlPick[slot] || 'keyboard';
    el.value = want;
    if (el.value !== want) el.value = 'keyboard';
    mpControlPick[slot] = el.value;
  }

  function updateMpShipPanel(slot) {
    const img = document.getElementById('mp-ship-preview-img-' + slot);
    const descEl = document.getElementById('mp-ship-description-' + slot);
    const wrap = document.getElementById('mp-ship-wrap-' + slot);
    const pag = document.getElementById('mp-ship-pagination-' + slot);
    if (!shipConfigs.length) {
      if (descEl) descEl.textContent = 'Loading ships…';
      if (img) img.src = '';
      revokeShipMenuPreviewBlob(slot === 0 ? 'mp0' : 'mp1');
      return;
    }
    const count = shipConfigs.length;
    const idx = ((mpShipIndex[slot] % count) + count) % count;
    mpShipIndex[slot] = idx;
    const cfg = shipConfigs[idx];
    const style = cfg.shipStyle || cfg.shipId || 'ship1';
    if (wrap) {
      wrap.className = 'ship-image-wrap ship-style-' + style;
    }
    if (img) img.alt = slot === 0 ? 'Player 1 ship preview' : 'Player 2 ship preview';
    setMpShipPreviewImg(slot, style);
    if (descEl) descEl.textContent = getShipDescription(cfg);
    if (pag) {
      pag.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.className = 'ship-pagination-dot' + (i === idx ? ' is-active' : '');
        dot.setAttribute('aria-hidden', 'true');
        pag.appendChild(dot);
      }
    }
  }

  function syncMpLbBtnMode() {
    const b = document.getElementById('mp-lb-btn');
    if (!b) return;
    const mo = document.querySelector('input[name="mp-mode"]:checked');
    const mode = mo && mo.value === 'versus' ? 'versus' : 'coop';
    b.setAttribute('data-hs-mode', mode);
  }

  function openMultiplayerScreen() {
    levelSelectReturnScreen = 'multiplayer-screen';
    hideScreens();
    showScreen('multiplayer-screen');
    syncMpLbBtnMode();
    loadShipConfig().then(() => {
      mpShipIndex[0] = Math.min(mpShipIndex[0], Math.max(0, shipConfigs.length - 1));
      mpShipIndex[1] = Math.min(mpShipIndex[1], Math.max(0, shipConfigs.length - 1));
      fillMpControlSelect(document.getElementById('mp-control-0'), 0);
      fillMpControlSelect(document.getElementById('mp-control-1'), 1);
      updateMpShipPanel(0);
      updateMpShipPanel(1);
    });
  }

  function updateShipPagination() {
    const row = document.getElementById('ship-pagination');
    if (!row) return;
    row.innerHTML = '';
    const n = shipConfigs.length;
    if (!n) return;
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('span');
      dot.className = 'ship-pagination-dot' + (i === currentShipIndex ? ' is-active' : '');
      dot.setAttribute('aria-hidden', 'true');
      row.appendChild(dot);
    }
    row.setAttribute('aria-label', `Ship ${currentShipIndex + 1} of ${n}`);
  }

  /** Level-select “Select Ship” button: small preview matching active P1 ship (default ship1). */
  function updateShipSelectButtonIcon() {
    const img = document.getElementById('ship-select-btn-icon');
    if (!img) return;
    let style = 'ship1';
    if (shipConfigs.length && currentShipConfig) {
      style = currentShipConfig.shipStyle || currentShipConfig.shipId || 'ship1';
    }
    loadShipMenuPreviewImg(img, style, 0, 'levelBtn');
  }

  function updateShipSelectUI() {
    const img = document.getElementById('ship-preview-img');
    const descEl = document.getElementById('ship-description');
    const wrap = document.querySelector('#ship-select-screen .ship-image-wrap');
    if (!img || !descEl) return;
    if (!shipConfigs.length || !currentShipConfig) {
      revokeShipMenuPreviewBlob('single');
      img.src = '';
      img.alt = 'No ship configuration';
      descEl.textContent = 'No ship configurations loaded.';
      updateShipPagination();
      updateShipSelectButtonIcon();
      return;
    }
    const style = currentShipConfig.shipStyle || currentShipConfig.shipId || 'ship1';
    if (wrap) {
      wrap.className = 'ship-image-wrap';
      wrap.classList.add(`ship-style-${style}`);
    }
    loadShipMenuPreviewImg(img, style, 0, 'single');
    img.alt = style;
    descEl.textContent = getShipDescription(currentShipConfig);
    updateShipPagination();
    updateShipSelectButtonIcon();
  }

  function setCurrentShipByIndex(idx) {
    if (!shipConfigs.length) return;
    const count = shipConfigs.length;
    let next = idx;
    if (next < 0) next = (next % count + count) % count;
    else if (next >= count) next = next % count;
    currentShipIndex = next;
    currentShipConfig = shipConfigs[currentShipIndex];
    applyShipConfig(currentShipConfig, 0);
    updateShipSelectUI();
  }

  function initShipSelectUI() {
    if (!shipConfigs.length) {
      loadShipConfig().then(() => {
        if (!shipConfigs.length) return;
        setCurrentShipByIndex(currentShipIndex || 0);
      });
      return;
    }
    setCurrentShipByIndex(currentShipIndex || 0);
  }

  /**
   * Builds a 2D grid from focusable elements using their positions (for directional nav).
   * Returns rows of elements; each row is sorted left-to-right. Rows are ordered top-to-bottom.
   */
  function buildFocusGrid(focusables) {
    if (!focusables.length) return [];
    const withRect = focusables.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    withRect.sort((a, b) => a.cy - b.cy || a.cx - b.cx);
    const ROW_THRESHOLD = 25;
    const rows = [];
    let row = [withRect[0].el];
    let lastCy = withRect[0].cy;
    for (let i = 1; i < withRect.length; i++) {
      if (withRect[i].cy - lastCy <= ROW_THRESHOLD) {
        row.push(withRect[i].el);
      } else {
        row.sort((a, b) => {
          const ax = a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2;
          const bx = b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2;
          return ax - bx;
        });
        rows.push(row);
        row = [withRect[i].el];
        lastCy = withRect[i].cy;
      }
    }
    row.sort((a, b) => {
      const ax = a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2;
      const bx = b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2;
      return ax - bx;
    });
    rows.push(row);
    return rows;
  }

  /** Returns the focusable element in the given direction ('up'|'down'|'left'|'right'), or null. */
  function findFocusInDirection(focusables, current, direction) {
    const grid = buildFocusGrid(focusables);
    if (!grid.length) return null;
    let rowIdx = -1;
    let colIdx = -1;
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r].indexOf(current);
      if (c >= 0) {
        rowIdx = r;
        colIdx = c;
        break;
      }
    }
    if (rowIdx < 0 || colIdx < 0) return focusables[0];
    if (direction === 'up') {
      rowIdx = rowIdx <= 0 ? grid.length - 1 : rowIdx - 1;
      colIdx = Math.min(colIdx, grid[rowIdx].length - 1);
      return grid[rowIdx][colIdx];
    }
    if (direction === 'down') {
      rowIdx = rowIdx >= grid.length - 1 ? 0 : rowIdx + 1;
      colIdx = Math.min(colIdx, grid[rowIdx].length - 1);
      return grid[rowIdx][colIdx];
    }
    if (direction === 'left') {
      colIdx = colIdx <= 0 ? grid[rowIdx].length - 1 : colIdx - 1;
      return grid[rowIdx][colIdx];
    }
    if (direction === 'right') {
      colIdx = colIdx >= grid[rowIdx].length - 1 ? 0 : colIdx + 1;
      return grid[rowIdx][colIdx];
    }
    return null;
  }

  /**
   * Focusable elements inside a menu root (DOM order = Tab order).
   * Future overlay modals: add data-game-modal on the root in #game-container (see index.html).
   */
  function isFocusableElementVisible(el) {
    if (!el || el.hidden) return false;
    const st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    return true;
  }

  function queryFocusableWithin(root) {
    if (!root || root.hidden) return [];
    const sel =
      'button:not([disabled]), [href]:not([href=""]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll(sel)).filter(isFocusableElementVisible);
  }

  /** Visible modal overlay (gamepad + Tab trap), or null. */
  function getOpenGameModalRoot() {
    const container = document.getElementById('game-container');
    if (!container) return null;
    const modals = container.querySelectorAll('[data-game-modal]');
    for (let i = 0; i < modals.length; i++) {
      const m = modals[i];
      if (!m.hidden && isFocusableElementVisible(m)) return m;
    }
    return null;
  }

  /** Start / ship / level / game-over / summary / win — whichever screen is visible. */
  function getVisibleMenuScreenRoot() {
    const screens = document.querySelectorAll('#screens > div');
    const visible = [...screens].filter((s) => !s.hidden);
    if (!visible.length) return null;
    if (visible.length === 1) return visible[0];
    const marked = visible.find((s) => s.classList.contains('visible'));
    return marked || visible[0];
  }

  /**
   * Root for Tab trapping when not in gameplay (keeps focus in game UI, not tuning panel).
   * Modals take priority over #screens.
   */
  function getMenuFocusTrapRoot() {
    return getOpenGameModalRoot() || getVisibleMenuScreenRoot();
  }

  /** Returns focusable controls for the current modal or menu screen (gamepad + Tab). */
  function getMenuFocusables() {
    const modalRoot = getOpenGameModalRoot();
    if (modalRoot) {
      const list = queryFocusableWithin(modalRoot);
      if (list.length) return list;
    }
    const screen = getVisibleMenuScreenRoot();
    if (screen) {
      const list = queryFocusableWithin(screen);
      if (list.length) return list;
    }
    return [];
  }

  function drawBackground() {
    const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
    g.addColorStop(0, '#4a3a6a');
    g.addColorStop(0.35, COLORS.nebulaPurple);
    g.addColorStop(0.7, COLORS.nebulaBlue);
    g.addColorStop(1, COLORS.space);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    const t = Date.now() * 0.0002;
    stars.forEach((s) => {
      const layerScale = 0.7 + (s.layer / STAR_LAYERS) * 0.3;
      const x = (s.x + t * (s.layer + 1) * 20) % (width + 50) - 25;
      const y = s.y;
      const alpha = (0.85 + 0.15 * Math.sin(s.twinkle + t * 2)) * layerScale * s.alphaMul;
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha)})`;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    if (!lowQualityMode) {
      ctx.shadowColor = COLORS.asteroidGlow;
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = COLORS.asteroidFill;
    ctx.strokeStyle = COLORS.asteroidStroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < a.shape.length; i += 2) {
      if (i === 0) ctx.moveTo(a.shape[i], a.shape[i + 1]);
      else ctx.lineTo(a.shape[i], a.shape[i + 1]);
    }
    ctx.closePath();
    ctx.fill();
    if (!lowQualityMode) ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  function drawCrystal(c) {
    const s = 0.9 + 0.2 * Math.sin(c.pulse);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(s, s);
    if (!lowQualityMode) {
      ctx.shadowColor = COLORS.crystalGlow;
      ctx.shadowBlur = 28;
    }
    const baseRadius = c.radius;
    const imgSize = 56; // crystal.svg viewBox is 56x56
    const scale = (2 * baseRadius) / imgSize;
    const drawSize = imgSize * scale;
    const half = drawSize / 2;

    if (crystalImage && crystalImage.complete && crystalImage.naturalWidth) {
      ctx.drawImage(crystalImage, -half, -half, drawSize, drawSize);
    } else {
      ctx.fillStyle = '#fff4b0';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? baseRadius : baseRadius * 0.5;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (!lowQualityMode) ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawPlayerSlot(slot, nowSec) {
    if (isMultiplayer() && livesP[slot] <= 0) return;
    const player = players[slot];
    const input = inputs[slot];
    const shipImage = shipImages[slot];
    const hullColors = slot === 0 ? ship1Color : ship2Color;
    let hitFlashAlpha = 1;
    let shakeX = 0;
    let shakeY = 0;
    if (
      nowSec !== undefined &&
      gameMode === 'versus' &&
      shipBulletHitFlashUntilP[slot] > nowSec
    ) {
      const rem = shipBulletHitFlashUntilP[slot] - nowSec;
      const elapsed = SHIP_HIT_FLASH_DURATION - rem;
      const strobeHalfCyclesPerSec = 40;
      const onOff = Math.floor(elapsed * strobeHalfCyclesPerSec) % 2;
      hitFlashAlpha = onOff === 0 ? 1 : 0.08;
      const decay = Math.max(0, 1 - elapsed / SHIP_HIT_FLASH_DURATION);
      const mag = SHIP_HIT_SHAKE_MAX * GAME_SCALE * Math.pow(decay, 0.55);
      shakeX = (Math.random() - 0.5) * 2 * mag;
      shakeY = (Math.random() - 0.5) * 2 * mag;
    }
    ctx.save();
    ctx.translate(player.x + shakeX, player.y + shakeY);
    ctx.rotate(player.angle);
    if (!lowQualityMode) ctx.shadowColor = COLORS.shipGlow;
    const flameWidth = 6 * GAME_SCALE;
    const flameExtra = (15 + Math.random() * 10) * GAME_SCALE;
    if (shipImage && shipImage.complete && shipImage.naturalWidth) {
      const shipSide = 12 * GAME_SCALE;
      const s = (2 * shipSide) / 33;
      const imgDx = -16.5 * s;
      const imgDy = -player.radius;
      const imgDw = 33 * s;
      const imgDh = 42 * s;
      if (!lowQualityMode) ctx.shadowBlur = 60;
      ctx.globalAlpha = 0.45 * hitFlashAlpha;
      ctx.drawImage(shipImage, imgDx, imgDy, imgDw, imgDh);
      ctx.globalAlpha = hitFlashAlpha;
      if (!lowQualityMode) ctx.shadowBlur = 35;
      ctx.drawImage(shipImage, imgDx, imgDy, imgDw, imgDh);
    } else {
      if (!lowQualityMode) ctx.shadowBlur = 35;
      ctx.globalAlpha = hitFlashAlpha;
      const fallbackGrad = ctx.createLinearGradient(0, -player.radius, 0, player.radius * 0.6);
      fallbackGrad.addColorStop(0, hullColors.from);
      fallbackGrad.addColorStop(1, hullColors.to);
      ctx.fillStyle = fallbackGrad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      const shipSide = 12 * GAME_SCALE;
      ctx.beginPath();
      ctx.moveTo(0, -player.radius);
      ctx.lineTo(shipSide, player.radius * 0.6);
      ctx.lineTo(0, player.radius * 0.3);
      ctx.lineTo(-shipSide, player.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (input.thrust) {
      ctx.globalAlpha = hitFlashAlpha;
      ctx.fillStyle = COLORS.accentMagenta;
      if (!lowQualityMode) {
        ctx.shadowColor = COLORS.accentMagenta;
        ctx.shadowBlur = 10;
      }
      const baseY = player.radius * 0.3;
      if (player.shipStyle === 'ship2') {
        const narrowFlame = flameWidth * 0.6;
        const leftX = -flameWidth * 0.5;
        const rightX = flameWidth * 0.5;
        ctx.beginPath();
        ctx.moveTo(leftX - narrowFlame, baseY);
        ctx.lineTo(leftX, baseY + flameExtra);
        ctx.lineTo(leftX + narrowFlame, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(rightX - narrowFlame, baseY);
        ctx.lineTo(rightX, baseY + flameExtra);
        ctx.lineTo(rightX + narrowFlame, baseY);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(-flameWidth, baseY);
        ctx.lineTo(0, baseY + flameExtra);
        ctx.lineTo(flameWidth, baseY);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (!lowQualityMode) ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawPlayer() {
    drawPlayerSlot(0, performance.now() / 1000);
  }

  function drawShieldSlot(nowSec, slot) {
    const player = players[slot];
    const dur = player.shieldDuration ?? SHIELD_DURATION;
    const shieldStart = shieldActiveUntilP[slot] - dur;
    const timeIntoShield = nowSec - shieldStart;
    const progress = Math.min(1, Math.max(0, timeIntoShield / dur));
    const speedFactor = 1 + SHIELD_FLASH_MULTIPLIER * progress;
    const effectiveInterval = SHIELD_FLASH_INTERVAL / speedFactor;
    const inFlash = (timeIntoShield % effectiveInterval) < Math.min(SHIELD_FLASH_DURATION, effectiveInterval);
    ctx.save();
    ctx.translate(player.x, player.y);
    const scaledShieldRadius = SHIELD_RADIUS * GAME_SCALE;
    ctx.beginPath();
    ctx.arc(0, 0, scaledShieldRadius - SHIELD_THICKNESS * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = SHIELD_INNER_COLOR;
    ctx.globalAlpha = SHIELD_INNER_OPACITY;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, scaledShieldRadius, 0, Math.PI * 2);
    if (inFlash) {
      ctx.strokeStyle = SHIELD_FLASH_COLOR;
      ctx.globalAlpha = SHIELD_FLASH_OPACITY;
    } else {
      ctx.strokeStyle = SHIELD_THICKNESS_COLOR;
      ctx.globalAlpha = SHIELD_THICKNESS_OPACITY;
    }
    ctx.lineWidth = SHIELD_THICKNESS;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawShieldBurstSlot(nowSec, slot) {
    const t0 = shieldBurstStartTimeP[slot];
    if (!t0) return;
    const elapsed = nowSec - t0;
    if (elapsed >= SHIELD_BURST_DURATION) {
      shieldBurstStartTimeP[slot] = 0;
      return;
    }
    const player = players[slot];
    const baseRadius = SHIELD_RADIUS * GAME_SCALE;
    const progress = elapsed / SHIELD_BURST_DURATION;
    const r = baseRadius + elapsed * SHIELD_BURST_EXPAND_SPEED;
    const fade = (1 - progress) * 0.8;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = SHIELD_THICKNESS_COLOR;
    ctx.lineWidth = 2;
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawBullets() {
    const now = performance.now();
    ctx.fillStyle = COLORS.accentCyan;
    ctx.strokeStyle = '#ffffff';
    bullets.forEach((b) => {
      const remaining = b.expiryTime - now;
      ctx.globalAlpha = remaining >= BULLET_FADE_MS ? 1 : Math.max(0, remaining / BULLET_FADE_MS);
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3 * GAME_SCALE, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  const vignetteEl = document.getElementById('vignette');
  let hudLifeSpans = [];
  let hudShieldSpans = [];
  let hudLifeSpansP = [[], []];
  let hudShieldSpansP = [[], []];
  let lastHudShieldCount = -1;
  let lastHudShieldCountP = [-1, -1];

  function drawHUD() {
    const playing = gameState === 'playing';
    const hudEl = document.getElementById('hud');
    const bottomHudEl = document.getElementById('bottom-hud');
    if (hudEl) hudEl.style.visibility = playing ? 'visible' : 'hidden';
    if (bottomHudEl) bottomHudEl.style.visibility = playing ? 'visible' : 'hidden';
    const mp = isMultiplayer();
    const scoreSingle = document.getElementById('hud-score-single');
    const scoreMulti = document.getElementById('hud-score-multi');
    if (scoreSingle) scoreSingle.hidden = mp;
    if (scoreMulti) scoreMulti.hidden = !mp;
    document.querySelectorAll('#ui-overlay .hud-mp-tag').forEach((el) => {
      if (el.closest('.hud-mp-combined')) return;
      el.hidden = !mp;
    });
    if (!mp) {
      const se = document.getElementById('score');
      if (se) se.textContent = scores[0];
    } else {
      const s1 = document.getElementById('score-p1');
      const s2 = document.getElementById('score-p2');
      const sc = document.getElementById('score-combined');
      const combLine = document.querySelector('.hud-mp-combined');
      if (s1) s1.textContent = scores[0];
      if (s2) s2.textContent = scores[1];
      if (sc) sc.textContent = scores[0] + scores[1];
      if (combLine) combLine.hidden = gameMode === 'versus';
    }
    document.getElementById('collected').textContent = crystalsCollected + ' / ' + CRYSTALS_TO_WIN;
    const secs = Math.max(0, Math.ceil(roundTimeRemaining));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    document.getElementById('timer').textContent = m + ':' + (s < 10 ? '0' : '') + s;

    const livesRowSingle = document.getElementById('bottom-hud-lives-single');
    const livesRowMulti = document.getElementById('bottom-hud-lives-multi');
    if (livesRowSingle) livesRowSingle.hidden = mp;
    if (livesRowMulti) livesRowMulti.hidden = !mp;
    const shRowSingle = document.getElementById('bottom-hud-shields-single');
    const shRowMulti = document.getElementById('bottom-hud-shields-multi');
    if (shRowSingle) shRowSingle.hidden = mp;
    if (shRowMulti) shRowMulti.hidden = !mp;

    if (!mp) {
      const livesEl = document.getElementById('lives');
      if (livesEl && hudLifeSpans.length === 0) {
        for (let i = 0; i < 3; i++) {
          const span = document.createElement('span');
          hudLifeSpans.push(span);
          livesEl.appendChild(span);
        }
      }
      for (let i = 0; i < hudLifeSpans.length; i++) {
        hudLifeSpans[i].className = 'life' + (i >= livesP[0] ? ' lost' : '');
      }
      const shieldsEl = document.getElementById('shields');
      if (shieldsEl && lastHudShieldCount !== SHIELD_COUNT) {
        shieldsEl.innerHTML = '';
        hudShieldSpans = [];
        for (let i = 0; i < SHIELD_COUNT; i++) {
          const span = document.createElement('span');
          hudShieldSpans.push(span);
          shieldsEl.appendChild(span);
        }
        lastHudShieldCount = SHIELD_COUNT;
      }
      for (let i = 0; i < hudShieldSpans.length; i++) {
        hudShieldSpans[i].className = 'shield' + (i >= shieldChargesP[0] ? ' used' : '');
      }
    } else {
      for (let slot = 0; slot < 2; slot++) {
        const livesEl = document.getElementById(slot === 0 ? 'lives-p1' : 'lives-p2');
        if (livesEl && hudLifeSpansP[slot].length === 0) {
          for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            hudLifeSpansP[slot].push(span);
            livesEl.appendChild(span);
          }
        }
        for (let i = 0; i < hudLifeSpansP[slot].length; i++) {
          hudLifeSpansP[slot][i].className = 'life' + (i >= livesP[slot] ? ' lost' : '');
        }
        const maxSh = players[slot].shieldCount ?? SHIELD_COUNT;
        const shieldsEl = document.getElementById(slot === 0 ? 'shields-p1' : 'shields-p2');
        if (shieldsEl && lastHudShieldCountP[slot] !== maxSh) {
          shieldsEl.innerHTML = '';
          hudShieldSpansP[slot] = [];
          for (let i = 0; i < maxSh; i++) {
            const span = document.createElement('span');
            hudShieldSpansP[slot].push(span);
            shieldsEl.appendChild(span);
          }
          lastHudShieldCountP[slot] = maxSh;
        }
        for (let i = 0; i < hudShieldSpansP[slot].length; i++) {
          hudShieldSpansP[slot][i].className = 'shield' + (i >= shieldChargesP[slot] ? ' used' : '');
        }
      }
    }

    if (gameState === 'playing' && roundTimeRemaining <= 10 && roundTimeRemaining > 0) {
      const frac = 1 - (roundTimeRemaining % 1);
      const pulse = 0.35 + 0.45 * Math.sin(frac * Math.PI);
      vignetteEl.style.opacity = String(pulse);
    } else {
      vignetteEl.style.opacity = '0';
    }
  }

  let lastTime = 0;
  // Performance: rolling average frame time for FPS display (tuning panel → Performance).
  // If FPS is ~60 and frame ms ~16, slowdown is likely ship params or level scale, not CPU.
  const frameTimeSamples = [];
  const FPS_SAMPLE_COUNT = 30;
  let frameCount = 0;
  function gameLoop(now) {
    pollGamepad();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    const frameMs = (now - lastTime);
    lastTime = now;
    frameTimeSamples.push(frameMs);
    if (frameTimeSamples.length > FPS_SAMPLE_COUNT) frameTimeSamples.shift();
    frameCount++;
    const nowSec = now / 1000;

    if (gameState === 'playing' && !modalOpen && !settingsModalOpen) {
      const maxS = isMultiplayer() ? 2 : 1;
      for (let slot = 0; slot < maxS; slot++) {
        if (isMultiplayer() && livesP[slot] <= 0) continue;
        const p = players[slot];
        const inp = inputs[slot];
        const canFireAgain = reloadStartedAtP[slot] === null || nowSec - reloadStartedAtP[slot] >= p.bulletReloadTime;
        const shotReady = nowSec - lastBulletTimeP[slot] >= p.bulletDelay;
        if (
          inp.fire &&
          countBulletsForOwner(slot) < p.bulletMaxCount &&
          canFireAgain &&
          shotReady
        ) {
          if (nowSec - lastBulletTimeP[slot] > p.bulletAccuracyResetThreshold) currentBulletAccuracyP[slot] = 0;
          fireBullet(currentBulletAccuracyP[slot], slot);
          currentBulletAccuracyP[slot] += p.bulletAccuracyIncrement;
          lastBulletTimeP[slot] = nowSec;
          if (countBulletsForOwner(slot) >= p.bulletMaxCount) reloadStartedAtP[slot] = nowSec;
        }
        if (countBulletsForOwner(slot) < p.bulletMaxCount) reloadStartedAtP[slot] = null;
      }
      for (let slot = 0; slot < maxS; slot++) {
        updatePlayerSlot(slot, dt);
      }
      updateBullets(dt);
      updateAsteroids(dt);
      updateCrystals(dt);
      updateParticles(dt);
      for (let slot = 0; slot < maxS; slot++) {
        const p = players[slot];
        const recharge = p.shieldRechargeTime ?? SHIELD_RECHARGE_TIME;
        if (shieldChargesP[slot] < (p.shieldCount ?? SHIELD_COUNT) && nowSec - lastShieldRechargeAtP[slot] >= recharge) {
          shieldChargesP[slot]++;
          lastShieldRechargeAtP[slot] = nowSec;
        }
        if (shieldActiveUntilP[slot] > 0 && nowSec >= shieldActiveUntilP[slot]) {
          shieldBurstStartTimeP[slot] = nowSec;
          shieldActiveUntilP[slot] = 0;
          lastShieldRechargeAtP[slot] = nowSec;
        }
      }
      checkCollisions(nowSec);
      roundTimeRemaining -= dt;
      if (gameState === 'playing' && roundTimeRemaining <= 0 && gameMode !== 'versus') {
        triggerWin('time');
      }
    }

    drawBackground();
    if (gameState === 'playing') {
      asteroids.forEach(drawAsteroid);
      crystals.forEach(drawCrystal);
      const maxS = isMultiplayer() ? 2 : 1;
      for (let slot = 0; slot < maxS; slot++) {
        drawPlayerSlot(slot, nowSec);
      }
      for (let slot = 0; slot < maxS; slot++) {
        if (isMultiplayer() && livesP[slot] <= 0) continue;
        const dur = players[slot].shieldDuration ?? SHIELD_DURATION;
        const cdFlash = players[slot].shieldCountdownFlash ?? SHIELD_COUNTDOWN;
        if (nowSec < shieldActiveUntilP[slot]) {
          const shieldStart = shieldActiveUntilP[slot] - dur;
          const timeIntoShield = nowSec - shieldStart;
          const progress = Math.min(1, Math.max(0, timeIntoShield / dur));
          const speedFactor = 1 + SHIELD_FLASH_MULTIPLIER * progress;
          const effectiveInterval = SHIELD_FLASH_INTERVAL / speedFactor;
          const inFlash = (timeIntoShield % effectiveInterval) < Math.min(SHIELD_FLASH_DURATION, effectiveInterval);
          const timeRemaining = shieldActiveUntilP[slot] - nowSec;
          const inCountdown = timeRemaining <= cdFlash;
          if (inCountdown && inFlash && !shieldWasInFlashP[slot]) shieldBurstStartTimeP[slot] = nowSec;
          shieldWasInFlashP[slot] = inFlash;
          drawShieldSlot(nowSec, slot);
        } else {
          shieldWasInFlashP[slot] = false;
        }
        drawShieldBurstSlot(nowSec, slot);
      }
      drawBullets();
      drawParticles();
    }
    drawHUD();

    if (frameCount % 10 === 0 && frameTimeSamples.length) {
      const avgMs = frameTimeSamples.reduce((a, b) => a + b, 0) / frameTimeSamples.length;
      const fpsEl = document.getElementById('fps-value');
      const msEl = document.getElementById('frame-ms-value');
      const gpEl = document.getElementById('gamepad-count-value');
      if (fpsEl) fpsEl.textContent = (1000 / avgMs).toFixed(1);
      if (msEl) msEl.textContent = avgMs.toFixed(2);
      if (gpEl) gpEl.textContent = String(connectedGamepadCount);
    }

    requestAnimationFrame(gameLoop);
  }

  // ----- Gamepad polling (EXTRACT: core is "read axes/buttons + deadzone"; game-specific is mapping below)
  function applyGamepadToInput(gp, slot) {
    const input = inputs[slot];
    const ax0 = gp.axes.length > 0 ? gp.axes[0] : 0;
    const ax1 = gp.axes.length > 1 ? gp.axes[1] : 0;
    const dead = GAMEPAD_DEADZONE;
    const stickMagnitude = Math.hypot(ax0, ax1);
    const stickPastDeadzone = stickMagnitude > dead;
    const stickAngle = stickPastDeadzone ? Math.atan2(ax1, ax0) : 0;
    const stickRotateLeft = stickPastDeadzone && (stickAngle > Math.PI / 2 || stickAngle < -Math.PI / 2);
    const stickRotateRight = stickPastDeadzone && stickAngle >= -Math.PI / 2 && stickAngle <= Math.PI / 2;

    const btn = (i) => (gp.buttons[i] && gp.buttons[i].pressed) || (gp.buttons[i] && gp.buttons[i].value > 0.5);
    const btnVal = (i) => (gp.buttons[i] && gp.buttons[i].value) || 0;
    const dpadLeft = gp.buttons.length > 14 && btn(14);
    const dpadRight = gp.buttons.length > 15 && btn(15);
    const dpadUp = gp.buttons.length > 12 && btn(12);
    const dpadDown = gp.buttons.length > 13 && btn(13);

    input.dx = 0;
    input.dy = 0;
    if (stickRotateLeft) {
      if (input.rotate === 0) rotationHoldStartedAt[slot] = performance.now();
      input.rotate = -1;
    } else if (stickRotateRight) {
      if (input.rotate === 0) rotationHoldStartedAt[slot] = performance.now();
      input.rotate = 1;
    } else if (dpadLeft) {
      if (input.rotate === 0) rotationHoldStartedAt[slot] = performance.now();
      input.rotate = -1;
    } else if (dpadRight) {
      if (input.rotate === 0) rotationHoldStartedAt[slot] = performance.now();
      input.rotate = 1;
    } else {
      rotationHoldStartedAt[slot] = 0;
      input.rotate = 0;
    }
    input.thrust = btn(3) || btnVal(7) > 0.5 || dpadUp;
    input.reverseThrust = btn(13) || btnVal(6) > 0.5;
    input.fire = btn(0) || btn(2);
    if (btn(1) || btn(4) || btn(5)) {
      const t = performance.now() / 1000;
      const dur = players[slot].shieldDuration ?? SHIELD_DURATION;
      if (shieldChargesP[slot] > 0 && t >= shieldActiveUntilP[slot]) {
        shieldActiveUntilP[slot] = t + dur;
        shieldChargesP[slot]--;
      }
    }
  }

  function pollGamepad() {
    const gamepads = navigator.getGamepads && navigator.getGamepads();
    if (!gamepads) {
      connectedGamepadCount = 0;
      activeGamepadIndex = null;
      return;
    }
    let n = 0;
    let firstConnectedIndex = null;
    for (let i = 0; i < gamepads.length; i++) {
      const g = gamepads[i];
      if (g && g.connected) {
        n++;
        if (firstConnectedIndex === null) firstConnectedIndex = i;
      }
    }
    connectedGamepadCount = n;
    if (n === 0) {
      activeGamepadIndex = null;
      return;
    }
    let gp = gamepads[activeGamepadIndex];
    if (activeGamepadIndex == null || !gp || !gp.connected) {
      activeGamepadIndex = firstConnectedIndex;
      gp = gamepads[activeGamepadIndex];
    }
    if (!gp || !gp.connected) return;

    const ax0 = gp.axes.length > 0 ? gp.axes[0] : 0;
    const ax1 = gp.axes.length > 1 ? gp.axes[1] : 0;
    const dead = GAMEPAD_DEADZONE;
    const stickMagnitude = Math.hypot(ax0, ax1);
    const stickPastDeadzone = stickMagnitude > dead;

    const btn = (i) => (gp.buttons[i] && gp.buttons[i].pressed) || (gp.buttons[i] && gp.buttons[i].value > 0.5);
    const btnVal = (i) => (gp.buttons[i] && gp.buttons[i].value) || 0;
    const dpadLeft = gp.buttons.length > 14 && btn(14);
    const dpadRight = gp.buttons.length > 15 && btn(15);
    const dpadUp = gp.buttons.length > 12 && btn(12);
    const dpadDown = gp.buttons.length > 13 && btn(13);

    if (gameState === 'playing' && !modalOpen && !settingsModalOpen) {
      if (isMultiplayer()) {
        for (let slot = 0; slot < 2; slot++) {
          const idx = mpGamepadForSlot[slot];
          if (idx >= 0) {
            const gpi = gamepads[idx];
            if (gpi && gpi.connected) applyGamepadToInput(gpi, slot);
          }
        }
      } else {
        applyGamepadToInput(gp, 0);
      }
    } else {
      inputs[0].dx = 0;
      inputs[0].dy = 0;
      inputs[0].rotate = 0;
      inputs[0].thrust = false;
      inputs[0].reverseThrust = false;
      inputs[0].fire = false;
      if (isMultiplayer()) {
        inputs[1].dx = 0;
        inputs[1].dy = 0;
        inputs[1].rotate = 0;
        inputs[1].thrust = false;
        inputs[1].reverseThrust = false;
        inputs[1].fire = false;
      }
    }

    // --- Game-specific: menu navigation (D-pad + left stick) and accept (A)
    const inMenu = modalOpen || settingsModalOpen || gameState !== 'playing';
    if (inMenu) {
      const focusables = getMenuFocusables();
      if (focusables.length) {
        const active = document.activeElement;
        if (!active || !focusables.includes(active)) focusables[0].focus();

        const menuNavUp = dpadUp || (stickPastDeadzone && ax1 < -dead);
        const menuNavDown = dpadDown || (stickPastDeadzone && ax1 > dead);
        const menuNavLeft = dpadLeft || (stickPastDeadzone && ax0 < -dead);
        const menuNavRight = dpadRight || (stickPastDeadzone && ax0 > dead);
        const current = document.activeElement;
        if (menuNavUp && !lastGamepadMenuNavUp) {
          const next = findFocusInDirection(focusables, current, 'up');
          if (next) next.focus();
        }
        if (menuNavDown && !lastGamepadMenuNavDown) {
          const next = findFocusInDirection(focusables, current, 'down');
          if (next) next.focus();
        }
        if (menuNavLeft && !lastGamepadMenuNavLeft) {
          const next = findFocusInDirection(focusables, current, 'left');
          if (next) next.focus();
        }
        if (menuNavRight && !lastGamepadMenuNavRight) {
          const next = findFocusInDirection(focusables, current, 'right');
          if (next) next.focus();
        }
        lastGamepadMenuNavUp = menuNavUp;
        lastGamepadMenuNavDown = menuNavDown;
        lastGamepadMenuNavLeft = menuNavLeft;
        lastGamepadMenuNavRight = menuNavRight;
      }
    } else {
      lastGamepadMenuNavUp = false;
      lastGamepadMenuNavDown = false;
      lastGamepadMenuNavLeft = false;
      lastGamepadMenuNavRight = false;
    }

    const confirmNow = btn(0);
    const escapeNow = btn(8) || btn(9);
    const backNow = btn(1) || btn(8) || btn(9);
    if (modalOpen && confirmNow && !lastGamepadMenuConfirm) hideLevelModal();
    const hsModalGp = document.getElementById('high-score-modal');
    if (hsModalGp && !hsModalGp.hidden && escapeNow && !lastGamepadMenuBack) {
      closeHighScoreModal();
    } else if ((settingsModalOpen || gameState === 'playing') && escapeNow && !lastGamepadMenuBack) {
      if (settingsModalOpen) hideSettingsModal();
      else showSettingsModal();
    } else if (gameState !== 'playing' && backNow && !lastGamepadMenuBack) {
      hideScreens();
      showScreen('start-screen');
    }
    if (confirmNow && !lastGamepadMenuConfirm) {
      if (modalOpen) {
        /* level modal OK already handled above */
      } else {
        const focusables = getMenuFocusables();
        const focused = document.activeElement;
        if (focusables.length && focusables.includes(focused)) focused.click();
        else if (focusables.length) focusables[0].focus();
      }
    }
    lastGamepadMenuConfirm = confirmNow;
    lastGamepadMenuBack = (settingsModalOpen || gameState === 'playing') ? escapeNow : backNow;
  }

  document.addEventListener('keydown', (e) => {
    // Tab: keep focus inside menu / modal (controller-friendly; works with gamepad focus)
    if (e.key === 'Tab' && (modalOpen || settingsModalOpen || gameState !== 'playing')) {
      const root = getMenuFocusTrapRoot();
      if (root) {
        const focusables = queryFocusableWithin(root);
        if (focusables.length) {
          const active = document.activeElement;
          if (!root.contains(active)) {
            e.preventDefault();
            (e.shiftKey ? focusables[focusables.length - 1] : focusables[0]).focus();
            return;
          }
          const i = focusables.indexOf(active);
          if (i >= 0) {
            if (!e.shiftKey && i === focusables.length - 1) {
              e.preventDefault();
              focusables[0].focus();
              return;
            }
            if (e.shiftKey && i === 0) {
              e.preventDefault();
              focusables[focusables.length - 1].focus();
              return;
            }
          }
        }
      }
    }

    if (e.key === 'Escape') {
      const hsEl = document.getElementById('high-score-modal');
      if (hsEl && !hsEl.hidden) {
        closeHighScoreModal();
        e.preventDefault();
        return;
      }
      if (settingsModalOpen) {
        hideSettingsModal();
      } else if (gameState === 'playing') {
        showSettingsModal();
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && modalOpen) {
      hideLevelModal();
      e.preventDefault();
      return;
    }
    // Block ship controls while a modal is open (e.g. settings during play)
    const hsModalEl = document.getElementById('high-score-modal');
    if (modalOpen || settingsModalOpen || (hsModalEl && !hsModalEl.hidden)) return;
    if (gameState !== 'playing') return;
    const k = e.key.toLowerCase();
    if (isMultiplayer()) {
      if (mpGamepadForSlot[0] < 0) {
        const i0 = inputs[0];
        if (k === 'arrowleft') {
          if (i0.rotate === 0) rotationHoldStartedAt[0] = performance.now();
          i0.rotate = -1;
        }
        if (k === 'arrowright') {
          if (i0.rotate === 0) rotationHoldStartedAt[0] = performance.now();
          i0.rotate = 1;
        }
        if (k === 'arrowup') i0.thrust = true;
        if (k === 'arrowdown') i0.reverseThrust = true;
        if (k === ' ') {
          e.preventDefault();
          i0.fire = true;
        }
        if (e.key === 'Shift' && e.location !== 1) {
          e.preventDefault();
          const t = performance.now() / 1000;
          const dur = players[0].shieldDuration ?? SHIELD_DURATION;
          if (shieldChargesP[0] > 0 && t >= shieldActiveUntilP[0]) {
            shieldActiveUntilP[0] = t + dur;
            shieldChargesP[0]--;
          }
        }
      }
      if (mpGamepadForSlot[1] < 0) {
        const i1 = inputs[1];
        if (k === 'tab') {
          e.preventDefault();
          const t = performance.now() / 1000;
          const dur = players[1].shieldDuration ?? SHIELD_DURATION;
          if (shieldChargesP[1] > 0 && t >= shieldActiveUntilP[1]) {
            shieldActiveUntilP[1] = t + dur;
            shieldChargesP[1]--;
          }
          return;
        }
        if (k === 'a') {
          if (i1.rotate === 0) rotationHoldStartedAt[1] = performance.now();
          i1.rotate = -1;
        }
        if (k === 'd') {
          if (i1.rotate === 0) rotationHoldStartedAt[1] = performance.now();
          i1.rotate = 1;
        }
        if (k === 'w') i1.thrust = true;
        if (k === 's') i1.reverseThrust = true;
        if (e.key === 'Shift' && e.location === 1) {
          e.preventDefault();
          i1.fire = true;
        }
      }
    } else {
      if (k === 'arrowleft' || k === 'a') {
        if (inputs[0].rotate === 0) rotationHoldStartedAt[0] = performance.now();
        inputs[0].rotate = -1;
      }
      if (k === 'arrowright' || k === 'd') {
        if (inputs[0].rotate === 0) rotationHoldStartedAt[0] = performance.now();
        inputs[0].rotate = 1;
      }
      if (k === 'arrowup' || k === 'w') inputs[0].thrust = true;
      if (k === ' ') {
        e.preventDefault();
        inputs[0].fire = true;
      }
      if (e.key === 'Shift') {
        e.preventDefault();
        const t = performance.now() / 1000;
        const dur = players[0].shieldDuration ?? SHIELD_DURATION;
        if (shieldChargesP[0] > 0 && t >= shieldActiveUntilP[0]) {
          shieldActiveUntilP[0] = t + dur;
          shieldChargesP[0]--;
        }
      }
      if (k === 'arrowdown' || k === 's') inputs[0].reverseThrust = true;
    }
  });
  document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (isMultiplayer()) {
      if (mpGamepadForSlot[0] < 0) {
        const i0 = inputs[0];
        if (k === 'arrowleft') {
          if (i0.rotate === -1) rotationHoldStartedAt[0] = 0;
          i0.rotate = i0.rotate === -1 ? 0 : i0.rotate;
        }
        if (k === 'arrowright') {
          if (i0.rotate === 1) rotationHoldStartedAt[0] = 0;
          i0.rotate = i0.rotate === 1 ? 0 : i0.rotate;
        }
        if (k === 'arrowup') i0.thrust = false;
        if (k === ' ') i0.fire = false;
        if (k === 'arrowdown') i0.reverseThrust = false;
      }
      if (mpGamepadForSlot[1] < 0) {
        const i1 = inputs[1];
        if (k === 'a') {
          if (i1.rotate === -1) rotationHoldStartedAt[1] = 0;
          i1.rotate = i1.rotate === -1 ? 0 : i1.rotate;
        }
        if (k === 'd') {
          if (i1.rotate === 1) rotationHoldStartedAt[1] = 0;
          i1.rotate = i1.rotate === 1 ? 0 : i1.rotate;
        }
        if (k === 'w') i1.thrust = false;
        if (k === 's') i1.reverseThrust = false;
        if (e.key === 'Shift' && e.location === 1) i1.fire = false;
      }
    } else {
      if (k === 'arrowleft' || k === 'a') {
        if (inputs[0].rotate === -1) rotationHoldStartedAt[0] = 0;
        inputs[0].rotate = inputs[0].rotate === -1 ? 0 : inputs[0].rotate;
      }
      if (k === 'arrowright' || k === 'd') {
        if (inputs[0].rotate === 1) rotationHoldStartedAt[0] = 0;
        inputs[0].rotate = inputs[0].rotate === 1 ? 0 : inputs[0].rotate;
      }
      if (k === 'arrowup' || k === 'w') inputs[0].thrust = false;
      if (k === ' ') inputs[0].fire = false;
      if (k === 'arrowdown' || k === 's') inputs[0].reverseThrust = false;
    }
  });

  function startGame() {
    hideScreens();
    scores[0] = 0;
    scores[1] = 0;
    livesP[0] = 3;
    livesP[1] = 3;
    crystalsCollected = 0;
    crystalsCollectedByPlayer[0] = 0;
    crystalsCollectedByPlayer[1] = 0;
    asteroidsDestroyed = 0;
    asteroidScores[0] = 0;
    asteroidScores[1] = 0;
    lastVersusWinnerSlot = null;
    pendingHighScoreEntry = null;
    setHighScoreNewBadge(false);
    roundTimeRemaining = TIME_REMAINING;
    gameState = 'playing';
    particles = [];
    bullets = [];
    lastBulletTimeP[0] = 0;
    lastBulletTimeP[1] = 0;
    reloadStartedAtP[0] = null;
    reloadStartedAtP[1] = null;
    currentBulletAccuracyP[0] = 0;
    currentBulletAccuracyP[1] = 0;
    shieldActiveUntilP[0] = 0;
    shieldActiveUntilP[1] = 0;
    shieldBurstStartTimeP[0] = 0;
    shieldBurstStartTimeP[1] = 0;
    shipBulletHitFlashUntilP[0] = 0;
    shipBulletHitFlashUntilP[1] = 0;
    shipBulletInvincibleUntilMsP[0] = 0;
    shipBulletInvincibleUntilMsP[1] = 0;
    shieldWasInFlashP[0] = false;
    shieldWasInFlashP[1] = false;
    lastShieldRechargeAtP[0] = 0;
    lastShieldRechargeAtP[1] = 0;
    rotationHoldStartedAt[0] = 0;
    rotationHoldStartedAt[1] = 0;
    inputs[0].dx = 0;
    inputs[0].dy = 0;
    inputs[0].rotate = 0;
    inputs[0].thrust = false;
    inputs[0].reverseThrust = false;
    inputs[0].fire = false;
    inputs[1].dx = 0;
    inputs[1].dy = 0;
    inputs[1].rotate = 0;
    inputs[1].thrust = false;
    inputs[1].reverseThrust = false;
    inputs[1].fire = false;

    const fs2 = document.getElementById('final-score-p2');
    if (fs2) fs2.hidden = true;
    const vr = document.getElementById('versus-result');
    if (vr) vr.hidden = true;

    if (isMultiplayer()) {
      for (let s = 0; s < 2; s++) {
        const pick = mpControlPick[s];
        if (pick === 'keyboard' || pick === 'kbd') {
          mpGamepadForSlot[s] = -1;
        } else {
          const m = /^gp:(\d+)$/.exec(String(pick));
          mpGamepadForSlot[s] = m ? Number(m[1]) : -1;
        }
      }
      if (shipConfigs.length) {
        const c0 = shipConfigs[mpShipIndex[0]] || shipConfigs[0];
        const c1 = shipConfigs[mpShipIndex[1]] || shipConfigs[0];
        applyShipConfig(c0, 0);
        applyShipConfig(c1, 1);
      }
      shieldChargesP[0] = players[0].shieldCount ?? SHIELD_COUNT;
      shieldChargesP[1] = players[1].shieldCount ?? SHIELD_COUNT;
      mpSpawnPairActive = true;
      resetPlayerSlot(0);
      resetPlayerSlot(1);
      mpSpawnPairActive = false;
    } else {
      if (currentShipConfig) applyShipConfig(currentShipConfig, 0);
      shieldChargesP[0] = players[0].shieldCount ?? SHIELD_COUNT;
      resetPlayerSlot(0);
    }

    const shieldsWrap = document.getElementById('bottom-hud-shields');
    if (shieldsWrap) shieldsWrap.style.display = SHIELD_COUNT === 0 ? 'none' : 'flex';
    resize();
    spawnAsteroids();
    placeCrystals();
    if (currentLevelIndex >= 0 && levelConfigs[currentLevelIndex]) {
      const mt = (levelConfigs[currentLevelIndex].MODAL_TEXT || '').trim();
      if (mt) showLevelModal(mt);
    }
  }

  document.getElementById('start-btn').addEventListener('click', () => {
    gameMode = 'single';
    levelSelectReturnScreen = 'start-screen';
    hideScreens();
    showScreen('level-select-screen');
    initLevelSelectUI();
  });
  const shipSelectBtn = document.getElementById('ship-select-btn');
  if (shipSelectBtn) {
    shipSelectBtn.addEventListener('click', () => {
      hideScreens();
      showScreen('ship-select-screen');
      initShipSelectUI();
    });
  }
  document.getElementById('restart-btn').addEventListener('click', startGame);
  const levelModalOk = document.getElementById('level-modal-ok');
  if (levelModalOk) levelModalOk.addEventListener('click', hideLevelModal);

  const settingsMainBtn = document.getElementById('settings-main-menu-btn');
  if (settingsMainBtn) {
    settingsMainBtn.addEventListener('click', () => {
      hideSettingsModal();
      gameState = 'start';
      gameMode = 'single';
      hideScreens();
      showScreen('start-screen');
    });
  }
  const settingsLevelSelectBtn = document.getElementById('settings-level-select-btn');
  if (settingsLevelSelectBtn) {
    settingsLevelSelectBtn.addEventListener('click', () => {
      hideSettingsModal();
      gameState = 'start';
      hideScreens();
      showScreen('level-select-screen');
      initLevelSelectUI();
    });
  }
  const settingsResumeBtn = document.getElementById('settings-resume-btn');
  if (settingsResumeBtn) settingsResumeBtn.addEventListener('click', hideSettingsModal);

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentLevelIndex >= 0) {
        startLevelAt(currentLevelIndex + 1);
      } else {
        startGame();
      }
    });
  }
  const summaryMainMenuBtn = document.getElementById('summary-main-menu-btn');
  if (summaryMainMenuBtn) {
    summaryMainMenuBtn.addEventListener('click', () => {
      hideSettingsModal();
      gameState = 'start';
      hideScreens();
      showScreen('start-screen');
    });
  }
  const summaryPlayAgainBtn = document.getElementById('summary-play-again-btn');
  if (summaryPlayAgainBtn) {
    summaryPlayAgainBtn.addEventListener('click', () => {
      if (currentLevelIndex >= 0) {
        startLevelAt(currentLevelIndex);
      } else {
        startGame();
      }
    });
  }

  document.querySelectorAll('.high-score-lb-btn, #level-select-lb-btn, #mp-lb-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const openFromAttrs = () => {
        const mode = btn.getAttribute('data-hs-mode');
        if (!mode) return;
        if (btn.getAttribute('data-hs-browse-sectors') === 'true') {
          openHighScoreModal(mode, { browseSectors: true, initialSectorIdx: 0 });
        } else {
          openHighScoreModal(mode);
        }
      };
      if (btn.id === 'mp-lb-btn') {
        const mo = document.querySelector('input[name="mp-mode"]:checked');
        gameMode = mo && mo.value === 'versus' ? 'versus' : 'coop';
        syncMpLbBtnMode();
        loadLevelData().then(openFromAttrs);
        return;
      }
      openFromAttrs();
    });
  });
  const hsSectorPrev = document.getElementById('high-score-sector-prev');
  const hsSectorNext = document.getElementById('high-score-sector-next');
  if (hsSectorPrev) hsSectorPrev.addEventListener('click', () => hsModalShiftSingleSector(-1));
  if (hsSectorNext) hsSectorNext.addEventListener('click', () => hsModalShiftSingleSector(1));
  const highScoreModalClose = document.getElementById('high-score-modal-close');
  if (highScoreModalClose) highScoreModalClose.addEventListener('click', closeHighScoreModal);
  ['high-score-confirm-btn-1', 'high-score-confirm-btn-2'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', savePendingHighScore);
  });
  const highScoreBackdrop = document.querySelector('.high-score-modal-backdrop');
  if (highScoreBackdrop) highScoreBackdrop.addEventListener('click', closeHighScoreModal);
  ['high-score-in-1', 'high-score-in-2'].forEach((id) => {
    const inp = document.getElementById(id);
    if (inp) {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          savePendingHighScore();
        }
      });
    }
  });

  // Ship select navigation
  const shipPrevBtn = document.getElementById('ship-prev-btn');
  const shipNextBtn = document.getElementById('ship-next-btn');
  const shipBackBtn = document.getElementById('ship-select-back-btn');
  const shipConfirmBtn = document.getElementById('ship-select-confirm-btn');

  if (shipPrevBtn) {
    shipPrevBtn.addEventListener('click', () => {
      if (!shipConfigs.length) return;
      setCurrentShipByIndex(currentShipIndex - 1);
    });
  }
  if (shipNextBtn) {
    shipNextBtn.addEventListener('click', () => {
      if (!shipConfigs.length) return;
      setCurrentShipByIndex(currentShipIndex + 1);
    });
  }
  if (shipBackBtn) {
    shipBackBtn.addEventListener('click', () => {
      hideScreens();
      showScreen('level-select-screen');
      initLevelSelectUI();
    });
  }
  if (shipConfirmBtn) {
    shipConfirmBtn.addEventListener('click', () => {
      gameMode = 'single';
      levelSelectReturnScreen = 'start-screen';
      hideScreens();
      showScreen('level-select-screen');
      initLevelSelectUI();
    });
  }

  const multiplayerBtn = document.getElementById('multiplayer-btn');
  if (multiplayerBtn) multiplayerBtn.addEventListener('click', openMultiplayerScreen);

  const mpSectorBtn = document.getElementById('mp-sector-btn');
  if (mpSectorBtn) {
    mpSectorBtn.addEventListener('click', () => {
      const mo = document.querySelector('input[name="mp-mode"]:checked');
      gameMode = mo && mo.value === 'versus' ? 'versus' : 'coop';
      const c0 = document.getElementById('mp-control-0');
      const c1 = document.getElementById('mp-control-1');
      if (c0) mpControlPick[0] = c0.value;
      if (c1) mpControlPick[1] = c1.value;
      if (mpControlPick[0] === mpControlPick[1] && mpControlPick[0] !== 'keyboard') {
        alert('Pick two different controllers, or choose Keyboard for one player.');
        return;
      }
      levelSelectReturnScreen = 'multiplayer-screen';
      levelListBuiltForPath = null;
      hideScreens();
      showScreen('level-select-screen');
      initLevelSelectUI();
    });
  }
  const mpBackBtn = document.getElementById('mp-back-btn');
  if (mpBackBtn) {
    mpBackBtn.addEventListener('click', () => {
      hideScreens();
      showScreen('start-screen');
    });
  }

  document.querySelectorAll('[data-mp-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = Number(btn.getAttribute('data-mp-prev'));
      if (!shipConfigs.length) return;
      mpShipIndex[slot] = (mpShipIndex[slot] - 1 + shipConfigs.length) % shipConfigs.length;
      updateMpShipPanel(slot);
    });
  });
  document.querySelectorAll('[data-mp-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = Number(btn.getAttribute('data-mp-next'));
      if (!shipConfigs.length) return;
      mpShipIndex[slot] = (mpShipIndex[slot] + 1) % shipConfigs.length;
      updateMpShipPanel(slot);
    });
  });
  const mpC0 = document.getElementById('mp-control-0');
  const mpC1 = document.getElementById('mp-control-1');
  if (mpC0) mpC0.addEventListener('change', () => { mpControlPick[0] = mpC0.value; });
  if (mpC1) mpC1.addEventListener('change', () => { mpControlPick[1] = mpC1.value; });
  document.querySelectorAll('input[name="mp-mode"]').forEach((inp) => {
    inp.addEventListener('change', syncMpLbBtnMode);
  });

  const levelBackBtn = document.getElementById('level-back-btn');
  if (levelBackBtn) {
    levelBackBtn.addEventListener('click', () => {
      hideScreens();
      showScreen(levelSelectReturnScreen || 'start-screen');
    });
  }

  // Enter on menus: focused button gets native activation; fallback if focus is lost (e.g. TV)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.repeat) return;
    if (gameState === 'playing' && !modalOpen && !settingsModalOpen) return;
    const t = e.target;
    if (t && t.closest && t.closest('button, [href], input, select, textarea')) return;

    const focusables = getMenuFocusables();
    if (focusables.length) {
      const active = document.activeElement;
      if (focusables.includes(active)) return;
      e.preventDefault();
      focusables[0].click();
      return;
    }

    const startScreen = document.getElementById('start-screen');
    const levelSelectScreen = document.getElementById('level-select-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const summaryScreen = document.getElementById('score-summary-screen');
    const winScreen = document.getElementById('win-screen');
    if (startScreen && !startScreen.hidden) document.getElementById('start-btn').click();
    else if (levelSelectScreen && !levelSelectScreen.hidden) {
      const firstLevelBtn = document.querySelector('#level-list button');
      if (firstLevelBtn) firstLevelBtn.click();
    } else if (gameOverScreen && !gameOverScreen.hidden) document.getElementById('restart-btn').click();
    else if (summaryScreen && !summaryScreen.hidden) document.getElementById('next-btn').click();
    else if (winScreen && !winScreen.hidden) document.getElementById('next-btn-old').click();
  });

  window.addEventListener('resize', resize);
  void refreshLeaderboardFromServer();

  // Gamepad connect/disconnect (EXTRACT: with activeGamepadIndex and GAMEPAD_DEADZONE)
  window.addEventListener('gamepadconnected', (e) => {
    if (activeGamepadIndex == null) activeGamepadIndex = e.gamepad.index;
  });
  window.addEventListener('gamepaddisconnected', (e) => {
    if (e.gamepad.index === activeGamepadIndex) activeGamepadIndex = null;
  });

  /**
   * Read-only helpers for “how many controllers?” (same Gamepad API on desktop browsers and Android WebView).
   * Note: Some browsers only expose gamepads after user gesture or first poll; count updates every frame.
   */
  window.SpaceRocksGamepads = {
    isApiAvailable() {
      return typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';
    },
    getConnectedCount() {
      return connectedGamepadCount;
    },
    hasGamepad() {
      return connectedGamepadCount > 0;
    },
  };

  loadShipConfig().finally(() => {
    updateShipSelectButtonIcon();
    resize();
    requestAnimationFrame(gameLoop);
  });

  // ----- Tuning panel (collapsible right panel: Player + Bullet sliders + numeric values) -----
  const tuningPanel = document.getElementById('tuning-panel');
  const tuningPanelToggle = document.getElementById('tuning-panel-toggle');
  if (tuningPanel && tuningPanelToggle) {
    tuningPanelToggle.addEventListener('click', () => {
      tuningPanel.classList.toggle('collapsed');
      tuningPanelToggle.textContent = tuningPanel.classList.contains('collapsed') ? '⚙' : '✕';
    });
    tuningPanelToggle.textContent = tuningPanel.classList.contains('collapsed') ? '⚙' : '✕';

    function formatTuneValue(val, step) {
      if (Number.isInteger(Number(step)) && step >= 1) return String(Math.round(val));
      const n = Number(val);
      if (n % 1 === 0) return String(n);
      const s = String(step);
      const dec = s.indexOf('.');
      const places = dec === -1 ? 0 : s.length - dec - 1;
      return n.toFixed(Math.min(places, 3));
    }

    function bindTune(id, getSet) {
      const inputEl = document.getElementById('tune-' + id);
      const outputEl = document.getElementById('tune-' + id + '-value');
      if (!inputEl || !outputEl) return;
      inputEl.addEventListener('input', () => {
        const num = inputEl.type === 'range' ? Number(inputEl.value) : parseFloat(inputEl.value);
        getSet.set(num);
        outputEl.textContent = formatTuneValue(num, inputEl.step || 0.01);
      });
      const v = getSet.get();
      inputEl.value = v;
      outputEl.textContent = formatTuneValue(v, inputEl.step || 0.01);
    }

    bindTune('maxSpeed', { get: () => player.maxSpeed, set: (v) => { player.maxSpeed = v; } });
    bindTune('thrustPower', { get: () => player.thrustPower, set: (v) => { player.thrustPower = v; } });
    bindTune('friction', { get: () => player.friction, set: (v) => { player.friction = v; } });
    bindTune('bulletSpeed', { get: () => bulletSpeed, set: (v) => { bulletSpeed = v; } });
    bindTune('bulletMaxCount', { get: () => bulletMaxCount, set: (v) => { bulletMaxCount = v; } });
    bindTune('bulletLifespanMin', { get: () => bulletLifespan[0], set: (v) => { bulletLifespan[0] = Number(v); } });
    bindTune('bulletLifespanMax', { get: () => bulletLifespan[1], set: (v) => { bulletLifespan[1] = Number(v); } });
    bindTune('bulletAccuracyIncrement', { get: () => bulletAccuracyIncrement, set: (v) => { bulletAccuracyIncrement = v; } });
    bindTune('bulletDelay', { get: () => bulletDelay, set: (v) => { bulletDelay = v; } });
    bindTune('bulletAccuracyResetThreshold', { get: () => bulletAccuracyResetThreshold, set: (v) => { bulletAccuracyResetThreshold = v; } });
    bindTune('bulletReloadTime', { get: () => bulletReloadTime, set: (v) => { bulletReloadTime = v; } });
  }
})();

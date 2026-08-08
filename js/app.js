/* ================================================================
   METTLESTATE × MARVEL SNAP — app.js
   Entry point · navigation · renderAll
================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // ── 1. Init theme immediately (before render to avoid flash) ──
  initTheme();
  initCubeRain();

  // ── 2. Load local data ─────────────────────────────────────
  Storage.loadAll();

  // ── 3. GitHub init ─────────────────────────────────────────
  GH.load();

  // ── 4. Attempt remote load ─────────────────────────────────
  if (GH.isConnected()) {
    const remote = await GH.loadRemoteData();
    if (remote) {
      if (remote.players)  State.players  = remote.players;
      if (remote.fixtures) State.fixtures = remote.fixtures;
      if (remote.results)  State.results  = remote.results;
      Storage.saveAll();
    }
  }

  // ── 5. Render ──────────────────────────────────────────────
  renderAll();

  // ── 6. Wire up navigation ──────────────────────────────────
  initNavigation();

  // ── 7. Admin accordions ────────────────────────────────────
  initAccordions();

  // ── 8. Calendar & scheduler ────────────────────────────────
  initCalendar();
  loadAutoScheduleConfig();
  startAutoScheduler();

  // ── 9. Event listeners ─────────────────────────────────────
  wireEventListeners();

  // ── 10. Gemini key status ──────────────────────────────────
  const geminiKey = Storage.loadGeminiKey();
  if (geminiKey) {
    const el = document.getElementById('gemini-key-status');
    if (el) el.innerHTML = '<span style="color:var(--acid)"><i class="fas fa-check"></i> API key loaded</span>';
  }

  // ── 10b. Image repo fields ─────────────────────────────────
  const imgCfg = Storage.loadImgRepo();
  if (imgCfg) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    set('imgRepoOwner',  imgCfg.owner);
    set('imgRepoName',   imgCfg.repo);
    set('imgRepoBranch', imgCfg.branch || 'main');
    set('imgRepoToken',  imgCfg.token || '');
  }
  _updateImgRepoStatus();

  // ── 11. Discord ping ───────────────────────────────────────
  sendDiscordWebhook({ type: 'pageload' });
});

// ── Cube rain background ─────────────────────────────────────
function initCubeRain() {
  const field = document.getElementById('cube-rain');
  if (!field) return;
  const colors = ['rgba(245,197,24,.35)', 'rgba(230,36,41,.3)', 'rgba(26,115,232,.25)', 'rgba(139,92,246,.25)'];
  const count = window.innerWidth < 600 ? 8 : 14;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'cube';
    const sz = Math.random() * 13 + 7;
    el.style.setProperty('--sz', sz + 'px');
    el.style.setProperty('--clr', colors[i % colors.length]);
    el.style.setProperty('--dur', (Math.random() * 10 + 14) + 's');
    el.style.setProperty('--delay', (Math.random() * -22) + 's');
    el.style.left = (Math.random() * 100) + '%';
    field.appendChild(el);
  }
}

// ── Navigation ────────────────────────────────────────────────
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  // Activate first tab (standings)
  switchTab('standings-tab');
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(t => {
    t.classList.toggle('active', t.id === tabId);
  });
  // Tab-specific side effects
  if (tabId === 'admin-tab')    { renderEvidenceGrid(); loadPublicRepoConfigUI(); renderThemeGrid(); renderPendingRegistrations(); _updateDiscordStatus?.(); }
  if (tabId === 'calendar-tab') { renderCalendar(); renderUpcomingPanel(); }
  if (tabId === 'players-tab')  { renderPlayerManagement(); }
}

// ── Render all ────────────────────────────────────────────────
function renderAll() {
  renderLeaderboard();
  renderFixtures();
  renderResults();
  renderPlayerManagement();
  updatePlayerDatalist();
  updateScoreSelect();
}

// ── Event listeners ───────────────────────────────────────────
function wireEventListeners() {
  // Player search
  document.getElementById('player-search-input')?.addEventListener('input', renderPlayerManagement);
  document.getElementById('fixture-filter-input')?.addEventListener('input', renderFixtures);
  document.getElementById('results-search-input')?.addEventListener('input', renderResults);

  // File inputs
  document.getElementById('matchImageInput')?.addEventListener('change', handleMatchImagePick);
  document.getElementById('whatsappImageInput')?.addEventListener('change', e => {
    const name = e.target.files?.[0]?.name || 'No file';
    const el = document.getElementById('whatsapp-file-chosen');
    if (el) el.textContent = name;
  });
  document.getElementById('playerImport')?.addEventListener('change', e => {
    const el = document.getElementById('file-chosen');
    if (el) el.textContent = e.target.files?.[0]?.name || 'No file chosen';
  });
  document.getElementById('importBackup')?.addEventListener('change', importBackupFile);

  // Gen mode radio — show hints
  document.querySelectorAll('input[name="gen-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = radio.value;
      ['random','roundrobin','maxencounters','cooldown'].forEach(m => {
        const el = document.getElementById(`mode-hint-${m}`);
        if (el) el.style.display = mode === m ? 'block' : 'none';
      });
    });
  });
  document.getElementById('lightbox')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  // Player modal close
  document.getElementById('player-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closePlayerModal();
  });

  // Scheduler config auto-save on toggle
  document.querySelectorAll('.sched-toggle').forEach(el => {
    el.addEventListener('change', saveAutoScheduleConfig);
  });
}

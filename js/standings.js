/* ================================================================
   METTLESTATE × MARVEL SNAP — standings.js
   Leaderboard · podium · stats ticker · export poster
================================================================ */

// ── Current active win streak (from most recent form entries) ──
function currentWinStreak(form) {
  if (!form || !form.length) return 0;
  let streak = 0;
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === 'W') streak++;
    else break;
  }
  return streak;
}

function renderLeaderboard() {
  const sorted = sortedPlayers();
  const tbody = document.getElementById('leaderboardBody');
  if (!tbody) return;

  // Podium
  const podium = document.getElementById('podium-area');
  if (podium) {
    if (sorted.length >= 3) {
      podium.style.display = 'grid';
      const [first, second, third] = sorted;
      const s1 = currentWinStreak(first.form || []);
      podium.innerHTML = `
        <div class="podium-card rank-2">
          <div class="podium-medal">🥈</div>
          <div class="podium-rank">2ND</div>
          <div class="podium-name">${esc(second.username)}</div>
          <div class="podium-pts"><strong>${second.points || 0}</strong> pts</div>
        </div>
        <div class="podium-card rank-1">
          <div class="podium-medal">🥇</div>
          <div class="podium-rank">1ST</div>
          <div class="podium-name">${esc(first.username)}</div>
          <div class="podium-pts"><strong>${first.points || 0}</strong> pts</div>
          ${s1 >= 3 ? `<div class="podium-streak"><i class="fas fa-fire"></i> ${s1}-WIN STREAK</div>` : ''}
        </div>
        <div class="podium-card rank-3">
          <div class="podium-medal">🥉</div>
          <div class="podium-rank">3RD</div>
          <div class="podium-name">${esc(third.username)}</div>
          <div class="podium-pts"><strong>${third.points || 0}</strong> pts</div>
        </div>`;
    } else {
      podium.style.display = 'none';
    }
  }

  // Stats ticker
  updateStatsTicker();

  // Table
  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-cell"><i class="fas fa-trophy"></i><br>No players yet</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((p, i) => {
    const rank = i + 1;
    const gd   = (p.gf || 0) - (p.ga || 0);
    const gdStr = gd > 0
      ? `<span class="gd-pos">+${gd}</span>`
      : gd < 0 ? `<span class="gd-neg">${gd}</span>`
      : `<span class="muted">${gd}</span>`;
    const posClass = rank <= 3 ? `pos-${rank}` : 'pos-n';
    const zone = rank <= 3 ? 'zone-champ' : '';
    const form = buildFormBadges(p.form || []);
    const susp = p.suspended ? '<span class="susp-badge">SUSP</span>' : '';
    const streak = currentWinStreak(p.form || []);
    const streakBadge = streak >= 3 ? `<span class="streak-flame"><i class="fas fa-fire"></i>${streak}</span>` : '';

    return `
      <tr class="${zone} ${p.suspended ? 'row-suspended' : ''}" style="animation-delay:${i * 0.025}s">
        <td><span class="pos-badge ${posClass}">${rank}</span></td>
        <td class="player-col" onclick="openPlayerProfile('${esc(p.username)}')" style="cursor:pointer">
          <div class="player-cell-name">${esc(p.name)}${susp}${streakBadge}</div>
          <div class="player-cell-username">@${esc(p.username)}</div>
        </td>
        <td>${p.played || 0}</td>
        <td>${p.wins || 0}</td>
        <td>${p.draws || 0}</td>
        <td>${p.losses || 0}</td>
        <td>${p.gf || 0}</td>
        <td>${p.ga || 0}</td>
        <td>${gdStr}</td>
        <td class="pts-col"><strong>${p.points || 0}</strong></td>
        <td class="form-col">${form}</td>
      </tr>`;
  }).join('');
}

function updateStatsTicker() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const totalCubes = State.results.reduce((s, r) => s + (r.homeGoals || 0) + (r.awayGoals || 0), 0);
  set('stat-players',  State.players.length);
  set('stat-matches',  State.results.length);
  set('stat-goals',    totalCubes);
  set('stat-pending',  State.fixtures.length);

  const sub = document.getElementById('standings-subtitle');
  if (sub) sub.textContent = `${State.players.length} players · ${State.results.length} matches played`;
}

// ── Shared poster capture helper ──────────────────────────────
function captureElement(elementId, filename, successMsg) {
  const el = document.getElementById(elementId);
  if (!el || !window.html2canvas) { toast('Export not available.', 'error'); return; }

  // Must be in the rendering tree so html2canvas can measure it.
  // opacity:0.001 = invisible to the user; z-index:9999 = above stacking context
  // so the browser actually lays it out fully before we capture.
  el.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;visibility:visible;opacity:0.001;pointer-events:none;';

  const restore = () => {
    el.style.cssText = 'position:absolute;top:0;left:-9999px;z-index:-1;visibility:hidden;';
  };

  // Wait for web fonts (Anton, DM Sans, JetBrains Mono) to actually finish
  // downloading before we screenshot — otherwise html2canvas captures
  // whatever fallback font was showing at that instant, and it's baked
  // into the PNG permanently. document.fonts.ready alone can resolve
  // before late-requested weights finish, so force-load the exact ones
  // the poster uses, then still double-rAF for layout to settle.
  const fontsPromise = (document.fonts && document.fonts.ready)
    ? Promise.all([
        document.fonts.load('400 2.6rem Anton'),
        document.fonts.load('700 1rem "JetBrains Mono"'),
        document.fonts.load('800 1rem "DM Sans"'),
        document.fonts.ready,
      ]).catch(() => null)
    : Promise.resolve();

  fontsPromise.then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0b0a0c',
          logging: false,
          onclone: doc => {
            const c = doc.getElementById(elementId);
            if (c) c.style.cssText = 'position:static;opacity:1;visibility:visible;width:800px;';
          },
        }).then(canvas => {
          restore();
          const link = document.createElement('a');
          link.download = filename;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast(successMsg, 'success');
        }).catch(err => {
          restore();
          console.error('captureElement error:', err);
          toast('Export failed — check console for details.', 'error');
        });
      });
    });
  });
}

// ── Get season label from scheduler config or fallback ────────
function _posterSeasonLabel() {
  const cfg = Storage.loadScheduler();
  return cfg?.seasonLabel || 'MARVEL SNAP LEAGUE';
}

// ── Fixtures poster ───────────────────────────────────────────
function exportFixturesImage() {
  if (!State.fixtures.length) { toast('No fixtures to export', 'error'); return; }

  const sub = document.getElementById('poster-fixture-sub');
  if (sub) sub.textContent = _posterSeasonLabel();

  const dateEl = document.getElementById('poster-fixture-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const list = document.getElementById('poster-fixture-list');
  list.innerHTML = '';

  const active    = State.fixtures.filter(f => !f.postponedBy);
  const postponed = State.fixtures.filter(f =>  f.postponedBy);

  if (active.length) {
    const hdr = document.createElement('div');
    hdr.className = 'poster-section-banner active';
    hdr.innerHTML = '<span class="dot"></span> ACTIVE FIXTURES';
    list.appendChild(hdr);

    active.forEach(f => {
      const hp = State.players.find(p => p.username === f.home);
      const ap = State.players.find(p => p.username === f.away);
      const row = document.createElement('div');
      row.className = 'poster-match-row';
      row.innerHTML = `
        <div class="poster-match-home">
          <div class="poster-player-name">${esc(hp?.name || f.home)}</div>
          <div class="poster-player-details">${hp?.phone || 'N/A'} · ${esc(f.home)}</div>
        </div>
        <div class="poster-match-vs"><span>VS</span></div>
        <div class="poster-match-away">
          <div class="poster-player-name">${esc(ap?.name || f.away)}</div>
          <div class="poster-player-details">${ap?.phone || 'N/A'} · ${esc(f.away)}</div>
        </div>`;
      list.appendChild(row);
    });
  }

  if (postponed.length) {
    const hdr = document.createElement('div');
    hdr.className = 'poster-section-banner postponed';
    hdr.innerHTML = '<span class="dot"></span> POSTPONED FIXTURES';
    list.appendChild(hdr);

    postponed.forEach(f => {
      const hp = State.players.find(p => p.username === f.home);
      const ap = State.players.find(p => p.username === f.away);
      const row = document.createElement('div');
      row.className = 'poster-match-row poster-postponed-row';
      row.innerHTML = `
        <div class="poster-match-home">
          <div class="poster-player-name">${esc(hp?.name || f.home)}</div>
          <div class="poster-player-details">${hp?.phone || 'N/A'} · ${esc(f.home)}</div>
        </div>
        <div class="poster-match-vs" style="background:linear-gradient(135deg,#FF9500,#cc7700);"><span>⏸</span></div>
        <div class="poster-match-away">
          <div class="poster-player-name">${esc(ap?.name || f.away)}</div>
          <div class="poster-player-details">${ap?.phone || 'N/A'} · ${esc(f.away)}</div>
        </div>
        <div class="poster-postponed-by">POSTPONED BY ${esc(f.postponedBy).toUpperCase()}</div>`;
      list.appendChild(row);
    });
  }

  captureElement('fixture-capture-area', `Mettlestate_Fixtures_${todayYMD()}.png`, 'Fixtures image downloaded!');
}

// ── Standings poster ──────────────────────────────────────────
function exportStandingsImage() {
  if (!State.players.length) { toast('No players to export', 'error'); return; }

  const sub = document.getElementById('poster-lb-sub');
  if (sub) sub.textContent = _posterSeasonLabel();

  const sorted    = sortedPlayers();
  const container = document.getElementById('poster-lb-table');
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'poster-lb-header';
  header.innerHTML = `<div>#</div><div>PLAYER</div><div>P</div><div>W</div><div>D</div><div>L</div><div>PTS</div>`;
  container.appendChild(header);

  sorted.forEach((p, i) => {
    const rank     = i + 1;
    const posClass = rank === 1 ? 'poster-lb-pos-1' : rank === 2 ? 'poster-lb-pos-2' : rank === 3 ? 'poster-lb-pos-3' : '';
    const row      = document.createElement('div');
    row.className  = 'poster-lb-row';
    row.innerHTML  = `
      <div class="${posClass}">${rank}</div>
      <div>
        ${esc(p.name)}
        <div style="font-size:0.85em;color:#8a8296;margin-top:2px;font-family:'JetBrains Mono',monospace;">${esc(p.username)}</div>
      </div>
      <div>${p.played || 0}</div>
      <div>${p.wins   || 0}</div>
      <div>${p.draws  || 0}</div>
      <div>${p.losses || 0}</div>
      <div class="poster-lb-pts">${p.points || 0}</div>`;
    container.appendChild(row);
  });

  captureElement('lb-capture-area', `Mettlestate_Standings_${todayYMD()}.png`, 'Standings image downloaded!');
}

// ── Rules poster ──────────────────────────────────────────────
function exportRulesImage() {
  const sub = document.getElementById('poster-rules-sub');
  if (sub) sub.textContent = _posterSeasonLabel();

  const liveRules = document.getElementById('rules-content') || document.getElementById('rules-tab');
  if (liveRules) {
    document.getElementById('poster-rules-content').innerHTML = liveRules.innerHTML;
  }
  captureElement('rules-capture-area', `Mettlestate_Rules_${todayYMD()}.png`, 'Rules image downloaded!');
}

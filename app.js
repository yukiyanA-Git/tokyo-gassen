// Main Application Controller for Tokyo Conquest (with Map Stabilization, FF-Style Command Battle, Defeat Survival & Vassalage)

let game = null;
let activeBattle = null;
let rpgEngine = null;
let selectedPartySlot = 0;
let selectedEnemyTargetIndex = 0;
let pendingSkillId = null;
let activeBattleIsBullying = false;

// Zoom & Pan State for SVG
let zoomLevel = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

document.addEventListener('DOMContentLoaded', () => {
  game = new ConquestGame(TOKYO_MAP_DATA);

  setupSvgMap();
  setupZoomAndPan();
  setupEventListeners();
  setupRpgMode();

  // If save data exists in localStorage, offer to resume, otherwise show faction selection
  if (game.hasSaveData()) {
    const raw = localStorage.getItem('tokyo_conquest_save');
    try {
      const parsed = JSON.parse(raw);
      const savedDate = parsed.year ? `${parsed.year}年${parsed.month}月` : '前回の続き';
      if (confirm(`【続きから再開】\nローカルに保存されたデータ（${savedDate} / ${FACTIONS[parsed.playerFaction]?.name || ''}）があります。再開しますか？\n（「キャンセル」で新しく開始します）`)) {
        game.loadState();
      } else {
        showFactionModal();
      }
    } catch(e) {
      showFactionModal();
    }
  } else {
    showFactionModal();
  }

  renderUI();
});

// Setup SVG Map elements
function setupSvgMap() {
  const gRegions = document.getElementById('g-regions');
  const gLabels = document.getElementById('g-labels');

  gRegions.innerHTML = '';
  gLabels.innerHTML = '';

  TOKYO_MAP_DATA.regions.forEach(reg => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', `path-${reg.id}`);
    path.setAttribute('d', reg.path);
    path.setAttribute('class', 'region-path');
    path.setAttribute('data-id', reg.id);

    path.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.playClick();
      selectRegion(reg.id);
    });

    gRegions.appendChild(path);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('id', `label-${reg.id}`);
    text.setAttribute('x', reg.centroid[0]);
    text.setAttribute('y', reg.centroid[1] - 4);
    text.setAttribute('class', 'region-label');
    text.textContent = reg.name.replace(/[市区町村]/, '');
    gLabels.appendChild(text);

    const troopText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    troopText.setAttribute('id', `troops-${reg.id}`);
    troopText.setAttribute('x', reg.centroid[0]);
    troopText.setAttribute('y', reg.centroid[1] + 8);
    troopText.setAttribute('class', 'troop-badge');
    troopText.textContent = '0';
    gLabels.appendChild(troopText);
  });
}

// Zoom and Pan Handling (MAP STABILIZATION: Wheel zoom completely disabled to prevent unintended resizing!)
function setupZoomAndPan() {
  const stage = document.getElementById('map-stage');

  stage.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'path') return;
    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
    updateMapTransform();
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
  });

  // Dedicated Zoom Buttons for 100% predictable, rock-solid navigation
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    zoomLevel = Math.min(3.0, zoomLevel * 1.2);
    updateMapTransform();
  });

  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    zoomLevel = Math.max(0.7, zoomLevel / 1.2);
    updateMapTransform();
  });

  document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    updateMapTransform();
  });
}

function updateMapTransform() {
  const mapContent = document.getElementById('map-content');
  if (mapContent) {
    mapContent.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoomLevel})`);
  }
}

function selectRegion(regionId) {
  game.selectedRegionId = regionId;
  renderUI();
}

// Main Render Function
function renderUI() {
  if (!game) return;

  const playerStats = game.getPlayerStats();
  const playerFaction = FACTIONS[game.playerFaction];

  document.getElementById('txt-calendar').textContent = `${game.year}年 ${game.month}月`;
  document.getElementById('txt-faction-name').textContent = playerFaction.name;
  document.getElementById('txt-faction-name').style.color = playerFaction.accentColor;
  document.getElementById('txt-faction-leader').textContent = `[${playerFaction.leader}]`;
  document.getElementById('txt-funds').textContent = playerStats.funds.toLocaleString();
  document.getElementById('txt-troops').textContent = playerStats.totalTroops.toLocaleString();
  document.getElementById('txt-regions').textContent = `${playerStats.regionCount} / ${playerStats.totalRegions}`;
  document.getElementById('txt-avg-order').textContent = `${playerStats.avgOrder}%`;
  document.getElementById('txt-avg-order').style.color = playerStats.avgOrder < 50 ? '#ef4444' : '#6ee7b7';
  document.getElementById('txt-specialties-count').textContent = `${playerStats.totalSpecialtiesCount}個`;

  const totalPopElem = document.getElementById('txt-total-population');
  if (totalPopElem) {
    const pop = playerStats.totalPopulation || 0;
    totalPopElem.textContent = pop >= 10000 ? `${(pop / 10000).toFixed(1)}万人` : `${pop.toLocaleString()}人`;
  }

  const originTxt = document.getElementById('txt-starting-origin');
  if (originTxt) {
    originTxt.textContent = game.startingRegionName || '新宿区';
  }

  // Monthly Domestic Budget Status (30% rule)
  const budgetStatusElem = document.getElementById('txt-budget-status');
  if (budgetStatusElem) {
    const rem = playerStats.remainingBudget;
    const max = playerStats.monthlyBudgetLimit;
    const pct = Math.round((rem / max) * 100);
    budgetStatusElem.textContent = `💰${rem.toLocaleString()} / ${max.toLocaleString()} (${pct}%)`;
    budgetStatusElem.style.color = rem < 600 ? '#f87171' : '#38bdf8';
  }

  // Check Single Leader Status (単独首位・覇王の黄金装飾フレーム)
  const leaderBadge = document.getElementById('badge-single-leader');
  if (playerStats.isSingleLeader) {
    document.body.classList.add('leader-crown-active');
    if (leaderBadge) {
      leaderBadge.style.display = 'inline-flex';
      leaderBadge.title = `支配地域数: ${playerStats.regionCount}自治体（第2位: ${playerStats.runnerUpRegions}自治体）`;
    }
  } else {
    document.body.classList.remove('leader-crown-active');
    if (leaderBadge) {
      leaderBadge.style.display = 'none';
    }
  }

  const selectedReg = game.regions[game.selectedRegionId];
  const isSelectedFriendly = selectedReg && selectedReg.owner === game.playerFaction;
  const friendlyNeighbors = isSelectedFriendly ? selectedReg.neighbors : [];

  TOKYO_MAP_DATA.regions.forEach(regData => {
    const reg = game.regions[regData.id];
    const path = document.getElementById(`path-${regData.id}`);
    const troopBadge = document.getElementById(`troops-${regData.id}`);

    if (path && reg) {
      const faction = FACTIONS[reg.owner] || FACTIONS.neutral;
      path.setAttribute('fill', faction.color);

      path.classList.remove('selected', 'neighbor-target');
      if (reg.id === game.selectedRegionId) {
        path.classList.add('selected');
      } else if (isSelectedFriendly && friendlyNeighbors.includes(reg.id) && reg.owner !== game.playerFaction) {
        path.classList.add('neighbor-target');
      }

      if (troopBadge) {
        troopBadge.textContent = reg.troops >= 1000 ? `${(reg.troops / 1000).toFixed(1)}k` : reg.troops;
      }
    }
  });

  renderSelectedDeck(selectedReg, isSelectedFriendly);
  renderLogs();

  if (game.logs.length > 0) {
    document.getElementById('ticker-text').textContent = game.logs[0].text;
  }

  if (game.isVictory) {
    showVictoryModal();
  } else if (game.isDefeat) {
    showDefeatModal();
  }
}

// Render Selected Deck
function renderSelectedDeck(reg, isFriendly) {
  if (!reg) return;

  const faction = FACTIONS[reg.owner] || FACTIONS.neutral;
  document.getElementById('deck-reg-name').textContent = reg.name;
  document.getElementById('deck-reg-area').textContent = reg.area;
  document.getElementById('deck-specialty-text').textContent = `📦 特産品: ${reg.specialty}`;
  
  const badge = document.getElementById('deck-owner-badge');
  badge.textContent = `${faction.name} 領`;
  badge.style.backgroundColor = faction.color;

  document.getElementById('stat-troops').textContent = reg.troops.toLocaleString();
  document.getElementById('stat-economy').textContent = reg.economy.toLocaleString();

  const popElem = document.getElementById('stat-population');
  if (popElem) {
    popElem.textContent = (reg.population || 0).toLocaleString();
  }

  const migBadge = document.getElementById('stat-migration-badge');
  if (migBadge) {
    const net = reg.netMigrants || 0;
    if (net > 0) {
      migBadge.textContent = `前月比: ↗ +${net.toLocaleString()}人`;
      migBadge.style.color = '#34d399';
    } else if (net < 0) {
      migBadge.textContent = `前月比: ↘ ${net.toLocaleString()}人`;
      migBadge.style.color = '#f87171';
    } else {
      migBadge.textContent = '前月比: ±0人';
      migBadge.style.color = '#94a3b8';
    }
  }

  const subsidyElem = document.getElementById('stat-subsidy-preview');
  if (subsidyElem) {
    const grant = game.getAnnualSubsidyPreview(reg);
    subsidyElem.textContent = `4月補助金: 💰${grant.toLocaleString()}`;
  }

  document.getElementById('stat-order').textContent = `${reg.publicOrder}%`;
  document.getElementById('stat-order').style.color = reg.publicOrder < 55 ? '#ef4444' : '#fff';
  document.getElementById('bar-order').style.width = `${reg.publicOrder}%`;
  document.getElementById('bar-order').style.background = reg.publicOrder < 55 
    ? 'linear-gradient(90deg, #ef4444, #f87171)' 
    : 'linear-gradient(90deg, #10b981, #34d399)';

  const btnDevelop = document.getElementById('btn-cmd-develop');
  const btnRecruit = document.getElementById('btn-cmd-recruit');
  const btnPolice = document.getElementById('btn-cmd-police');
  const btnProcure = document.getElementById('btn-cmd-procure');
  const btnAttack = document.getElementById('btn-cmd-attack');
  const btnTransport = document.getElementById('btn-cmd-transport');
  const friendlyActionsGroup = document.getElementById('friendly-actions');
  const hostileActionsGroup = document.getElementById('hostile-actions');
  const bullyingWarningBanner = document.getElementById('deck-bullying-warning');

  if (isFriendly) {
    friendlyActionsGroup.style.display = 'flex';
    hostileActionsGroup.style.display = 'none';
    bullyingWarningBanner.style.display = 'none';

    const recruitCost = game.playerFaction === 'shinjuku' ? 750 : 1000;
    document.getElementById('cost-recruit').textContent = `💰${recruitCost}`;

    const playerFunds = game.funds[game.playerFaction] || 0;
    const remainingBudget = Math.max(0, game.monthlyBudgetLimit - game.spentBudgetThisTurn);

    // Domestic actions require BOTH funds and available monthly budget cap (30% rule)
    btnDevelop.disabled = playerFunds < 1200 || remainingBudget < 1200;
    btnRecruit.disabled = playerFunds < recruitCost || remainingBudget < recruitCost;
    btnPolice.disabled = playerFunds < 600 || remainingBudget < 600;
    btnProcure.disabled = playerFunds < 800 || remainingBudget < 800;

    if (remainingBudget < 600) {
      btnDevelop.title = '今月の内政予算枠上限に達しました。ターン送り（月送り）してください。';
      btnRecruit.title = '今月の内政予算枠上限に達しました。ターン送り（月送り）してください。';
      btnPolice.title = '今月の内政予算枠上限に達しました。ターン送り（月送り）してください。';
      btnProcure.title = '今月の内政予算枠上限に達しました。ターン送り（月送り）してください。';
    } else {
      btnDevelop.title = '';
      btnRecruit.title = '';
      btnPolice.title = '';
      btnProcure.title = '';
    }

    const attackableNeighbors = reg.neighbors
      .map(id => game.regions[id])
      .filter(r => r && r.owner !== game.playerFaction && !game.diplomacyPacts.includes(r.id));

    btnAttack.disabled = (attackableNeighbors.length === 0 || reg.troops <= 150);

    const friendlyNeighbors = reg.neighbors
      .map(id => game.regions[id])
      .filter(r => r && r.owner === game.playerFaction);

    btnTransport.disabled = (friendlyNeighbors.length === 0 || reg.troops <= 200);

  } else {
    friendlyActionsGroup.style.display = 'none';
    hostileActionsGroup.style.display = 'flex';

    const borderingPlayerTerritories = reg.neighbors
      .map(id => game.regions[id])
      .filter(r => r && r.owner === game.playerFaction && r.troops > 150);

    const btnDirectAttack = document.getElementById('btn-direct-attack');
    const btnDirectDiplomacy = document.getElementById('btn-direct-diplomacy');

    if (borderingPlayerTerritories.length > 0) {
      const source = borderingPlayerTerritories[0];
      const isBullying = game.checkBullyingAttack(source, reg);

      if (isBullying) {
        bullyingWarningBanner.style.display = 'block';
      } else {
        bullyingWarningBanner.style.display = 'none';
      }

      btnDirectAttack.disabled = false;
      btnDirectAttack.textContent = isBullying 
        ? `⚔️ 侵攻（⚠️民意暴落の危険）`
        : `⚔️ 隣接領地から出陣（${source.name}等より）`;
      
      btnDirectAttack.onclick = () => {
        startFfBattle(source.id, reg.id);
      };

      btnDirectDiplomacy.disabled = false;
      btnDirectDiplomacy.onclick = () => {
        openDiplomacyModal();
      };
    } else {
      bullyingWarningBanner.style.display = 'none';
      btnDirectAttack.disabled = true;
      btnDirectAttack.textContent = '❌ 自領地と隣接していません';
      btnDirectDiplomacy.disabled = true;
    }
  }
}

function renderLogs() {
  const list = document.getElementById('log-list');
  list.innerHTML = '';
  game.logs.slice(0, 15).forEach(l => {
    const item = document.createElement('div');
    item.className = `log-entry ${l.type}`;
    item.innerHTML = `<span style="color:#94a3b8; font-size:10px;">${l.time}</span> ${l.text}`;
    list.appendChild(item);
  });
}

function setupEventListeners() {
  document.getElementById('btn-end-turn').addEventListener('click', () => {
    soundManager.playDrum();
    game.endTurn();
    // Auto-save on each turn end (だらだらプレイ用オートセーブ)
    game.saveState();
    renderUI();
  });

  // Manual Save & Load Buttons
  const btnSave = document.getElementById('btn-save-game');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      soundManager.playCoin();
      const res = game.saveState();
      alert(res.msg);
    });
  }

  const btnLoad = document.getElementById('btn-load-game');
  if (btnLoad) {
    btnLoad.addEventListener('click', () => {
      if (!game.hasSaveData()) {
        alert('保存されたセーブデータがありません。');
        return;
      }
      if (confirm('保存されたゲームデータを再開（ロード）しますか？')) {
        soundManager.playFanfare();
        const res = game.loadState();
        renderUI();
        alert(res.msg);
      }
    });
  }

  document.getElementById('btn-sound-toggle').addEventListener('click', () => {
    const isMuted = soundManager.toggleMute();
    document.getElementById('btn-sound-toggle').textContent = isMuted ? '🔇 消音中' : '🔊 音声ON';
  });

  document.getElementById('btn-open-party').addEventListener('click', () => {
    soundManager.playClick();
    openPartyModal();
  });

  document.getElementById('btn-open-diplomacy').addEventListener('click', () => {
    soundManager.playClick();
    openDiplomacyModal();
  });

  const originBtn = document.getElementById('btn-origin-display');
  if (originBtn) {
    originBtn.addEventListener('click', () => {
      soundManager.playClick();
      if (confirm(`【旗揚げ地の変更・新しく開始】\n現在は「${game.startingRegionName || '新宿区'}」で天下統一を目指して進行中です。\n現在の進行をリセットして、別の市区町村を選んで最初から始めますか？`)) {
        showFactionModal();
      }
    });
  }

  document.getElementById('btn-cmd-develop').addEventListener('click', () => {
    soundManager.playCoin();
    game.developRegion(game.selectedRegionId);
    renderUI();
  });

  document.getElementById('btn-cmd-recruit').addEventListener('click', () => {
    soundManager.playDrum();
    game.recruitTroops(game.selectedRegionId);
    renderUI();
  });

  document.getElementById('btn-cmd-police').addEventListener('click', () => {
    soundManager.playClick();
    game.policeRegion(game.selectedRegionId);
    renderUI();
  });

  document.getElementById('btn-cmd-procure').addEventListener('click', () => {
    soundManager.playCoin();
    game.procureSpecialty(game.selectedRegionId);
    renderUI();
  });

  document.getElementById('btn-cmd-attack').addEventListener('click', () => {
    const sourceReg = game.regions[game.selectedRegionId];
    const attackableNeighbors = sourceReg.neighbors
      .map(id => game.regions[id])
      .filter(r => r && r.owner !== game.playerFaction && !game.diplomacyPacts.includes(r.id));

    if (attackableNeighbors.length === 1) {
      startFfBattle(sourceReg.id, attackableNeighbors[0].id);
    } else {
      showAttackTargetSelector(sourceReg);
    }
  });

  document.getElementById('btn-cmd-transport').addEventListener('click', () => {
    const sourceReg = game.regions[game.selectedRegionId];
    showTransportModal(sourceReg);
  });

  // Strategic Knowledge Footer Accordion Handler
  const kfToggleBtn = document.getElementById('kf-toggle-btn');
  const kfBody = document.getElementById('kf-body');
  const kfIndicator = document.getElementById('kf-toggle-indicator');
  if (kfToggleBtn && kfBody) {
    kfToggleBtn.addEventListener('click', () => {
      const isHidden = kfBody.style.display === 'none';
      kfBody.style.display = isHidden ? 'block' : 'none';
      if (kfIndicator) {
        kfIndicator.textContent = isHidden ? '▲ 閉じる' : '▼ 解説を読む';
      }
    });
  }

  // Initialize yukiyanArt Promo & Feedback Hub Bar
  if (typeof YukiyanArtPromo !== 'undefined') {
    YukiyanArtPromo.init({
      target: '#promo-bar',
      type: 'beta',
      currentAppId: 'tokyo_gassen'
    });
  }
}

function showFactionModal() {
  const modal = document.getElementById('modal-faction');
  const grid = document.getElementById('factions-grid');
  const searchInput = document.getElementById('faction-search-input');
  const tabs = document.querySelectorAll('#faction-area-tabs .filter-tab');

  const southWestTamaSet = new Set([
    '八王子市', '町田市', '日野市', '多摩市', '稲城市',
    '青梅市', '福生市', '羽村市', 'あきる野市',
    '瑞穂町', '日の出町', '檜原村', '奥多摩町'
  ]);

  let currentArea = 'all';
  let searchQuery = '';

  function renderFactionCards() {
    grid.innerHTML = '';
    const regions = game.mapData.regions;

    const filtered = regions.filter(r => {
      // Area filter
      if (currentArea === '23wards' && r.area !== '都区部') return false;
      if (currentArea === 'north_tama' && (r.area !== '多摩' || southWestTamaSet.has(r.name))) return false;
      if (currentArea === 'south_west_tama' && (r.area !== '多摩' || !southWestTamaSet.has(r.name))) return false;

      // Text query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const heroList = (typeof getStarterHeroesForRegion === 'function') ? getStarterHeroesForRegion(r.name) : [];
        const heroNames = heroList.map(hId => {
          const h = CHARACTERS_DB[hId];
          return h ? `${h.name} ${h.role}` : '';
        }).join(' ').toLowerCase();

        const matchName = r.name.toLowerCase().includes(q);
        const matchHeroes = heroNames.includes(q);
        if (!matchName && !matchHeroes) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 24px;">該当する市区町村が見つかりませんでした。別の単語で検索してください。</div>`;
      return;
    }

    filtered.forEach(r => {
      const card = document.createElement('div');
      const isCurrentOwner = game.regions[r.id] && game.regions[r.id].owner === game.playerFaction;
      card.className = `faction-select-card ${isCurrentOwner ? 'active' : ''}`;

      let areaLabel = '都区部';
      let badgeBg = 'rgba(59, 130, 246, 0.2)';
      let badgeColor = '#60a5fa';
      if (r.area === '多摩') {
        if (southWestTamaSet.has(r.name)) {
          areaLabel = '南多摩・西多摩';
          badgeBg = 'rgba(168, 85, 247, 0.2)';
          badgeColor = '#c084fc';
        } else {
          areaLabel = '北多摩・武蔵野';
          badgeBg = 'rgba(16, 185, 129, 0.2)';
          badgeColor = '#34d399';
        }
      }

      const starters = (typeof getStarterHeroesForRegion === 'function') ? getStarterHeroesForRegion(r.name) : [];
      const preview = (typeof getRegionPreview === 'function') ? getRegionPreview(r.name) : {
        popDisplay: '10.0万人',
        troops: 1500,
        publicOrder: 80,
        aprilSubsidy: 1000,
        specialty: REGION_SPECIALTIES[r.name] || '地域物資'
      };

      const heroBadges = starters.map((hId, idx) => {
        const h = CHARACTERS_DB[hId];
        if (!h) return '';
        return `<div><span style="color:#fcd34d;">⭐</span> <b>${h.name}</b> <span style="color:#94a3b8; font-size:9px;">[${h.role}]</span></div>`;
      }).join('');

      card.innerHTML = `
        <div class="fsc-top-bar">
          <span class="fsc-area-badge" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}40;">${areaLabel}</span>
          <span class="fsc-specialty">📦 ${preview.specialty}</span>
        </div>
        <div class="fsc-name" style="color: #fff;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${badgeColor};"></span>
          ${r.name}
        </div>

        <!-- Demographics & Economy Metrics Preview -->
        <div class="fsc-stats-row">
          <div class="fsc-stat-item">
            <span class="fsc-stat-lbl">人口</span>
            <b style="color: #a7f3d0;">${preview.popDisplay}</b>
          </div>
          <div class="fsc-stat-item">
            <span class="fsc-stat-lbl">初期兵力</span>
            <b style="color: #fef08a;">🛡️ ${preview.troops.toLocaleString()}</b>
          </div>
          <div class="fsc-stat-item">
            <span class="fsc-stat-lbl">初期民意</span>
            <b style="color: ${preview.publicOrder < 60 ? '#f87171' : '#34d399'};">🕊️ ${preview.publicOrder}%</b>
          </div>
          <div class="fsc-stat-item">
            <span class="fsc-stat-lbl">4月補助金</span>
            <b style="color: #fbbf24;">💰 ${preview.aprilSubsidy.toLocaleString()}</b>
          </div>
        </div>

        <div class="fsc-heroes">
          <div style="font-size:9px; color:#cbd5e1; font-weight:bold; margin-bottom:2px;">【初期配下3名】</div>
          ${heroBadges}
        </div>
        <div class="fsc-bonus">🔥 旗揚げして統一を目指す →</div>
      `;

      card.addEventListener('click', () => {
        try {
          soundManager.playFanfare();
        } catch (e) {
          console.warn('Sound playback failed:', e);
        }
        try {
          game.initGame(r.name);
          modal.style.display = 'none';
          renderUI();
          console.log(`Successfully started game with region: ${r.name}`);
        } catch (err) {
          console.error(`Failed to init game for region ${r.name}:`, err);
          alert(`初期化エラー: ${err.message}`);
        }
      });

      grid.appendChild(card);
    });
  }

  // Setup tab listeners
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentArea = tab.getAttribute('data-area');
      renderFactionCards();
    };
  });

  // Setup search listener
  if (searchInput) {
    searchInput.value = '';
    searchInput.oninput = (e) => {
      searchQuery = e.target.value;
      renderFactionCards();
    };
  }

  renderFactionCards();
  modal.style.display = 'flex';
}

function showAttackTargetSelector(sourceReg) {
  const neighbors = sourceReg.neighbors
    .map(id => game.regions[id])
    .filter(r => r && r.owner !== game.playerFaction && !game.diplomacyPacts.includes(r.id));

  const modal = document.getElementById('modal-generic');
  const title = document.getElementById('modal-generic-title');
  const content = document.getElementById('modal-generic-content');

  title.textContent = `【出陣目標の選択】（発進元: ${sourceReg.name}）`;
  content.innerHTML = `
    <div style="margin-bottom:12px; color:#cbd5e1;">進軍先となる隣接領地を選択してください：</div>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${neighbors.map(n => {
        const fac = FACTIONS[n.owner] || FACTIONS.neutral;
        const recruitId = REGION_RECRUIT_MAP[n.name];
        const heroTag = recruitId && CHARACTERS_DB[recruitId] ? ` ⭐${CHARACTERS_DB[recruitId].name}` : '';
        const isBully = game.checkBullyingAttack(sourceReg, n);
        const bullyTag = isBully ? '<span style="color:#f87171; font-size:11px; margin-left:6px;">⚠️弱小(民意低下リスク)</span>' : '';
        return `
          <button class="btn" style="justify-content:space-between; padding:12px;" onclick="selectAttackTarget('${sourceReg.id}', '${n.id}')">
            <span style="font-size:14px; font-weight:bold; color:${fac.accentColor || '#fff'}">${n.name} (${fac.name})${heroTag}${bullyTag}</span>
            <span style="color:#fef08a">守備兵力: ${n.troops.toLocaleString()}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  modal.style.display = 'flex';
}

window.selectAttackTarget = function(sourceId, targetId) {
  document.getElementById('modal-generic').style.display = 'none';
  startFfBattle(sourceId, targetId);
};

// =========================================================================
// === DIPLOMACY & SPECIALTIES MODAL ===
// =========================================================================
function openDiplomacyModal() {
  const modal = document.getElementById('modal-diplomacy');
  renderDiplomacyModal();
  modal.style.display = 'flex';
}

function renderDiplomacyModal() {
  const invList = document.getElementById('diplomacy-inventory-list');
  invList.innerHTML = '';

  const entries = Object.entries(game.playerSpecialties).filter(([_, count]) => count > 0);
  if (entries.length === 0) {
    invList.innerHTML = `<span style="color:#94a3b8; font-size:12px;">特産品がありません。領地コマンド【特産品物資の調達】で生産してください。</span>`;
  } else {
    entries.forEach(([name, count]) => {
      const badge = document.createElement('div');
      badge.style.background = 'rgba(251, 191, 36, 0.15)';
      badge.style.border = '1px solid #fbbf24';
      badge.style.borderRadius = '6px';
      badge.style.padding = '6px 10px';
      badge.style.fontSize = '12px';
      badge.style.color = '#fef08a';
      badge.innerHTML = `📦 <b>${name}</b> × ${count}個`;
      invList.appendChild(badge);
    });
  }

  const neighborsList = document.getElementById('diplomacy-neighbors-list');
  neighborsList.innerHTML = '';

  const playerRegions = Object.values(game.regions).filter(r => r.owner === game.playerFaction);
  const neighborIds = new Set();
  playerRegions.forEach(pr => {
    pr.neighbors.forEach(nid => {
      const nr = game.regions[nid];
      if (nr && nr.owner !== game.playerFaction) {
        neighborIds.add(nid);
      }
    });
  });

  const availableSpecialty = entries.length > 0 ? entries[0][0] : null;

  neighborIds.forEach(nid => {
    const reg = game.regions[nid];
    const isPact = game.diplomacyPacts.includes(nid);
    const faction = FACTIONS[reg.owner] || FACTIONS.neutral;

    // Find alliance details if any
    const alliance = game.factionAlliances.find(a => 
      a.regionId === nid || 
      ((a.factionA === game.playerFaction && a.factionB === reg.owner) ||
       (a.factionB === game.playerFaction && a.factionA === reg.owner))
    );

    const allianceTurns = alliance ? ` (残${alliance.turnsLeft}ヶ月)` : '';

    const row = document.createElement('div');
    row.style.background = 'rgba(255,255,255,0.04)';
    row.style.border = '1px solid rgba(255,255,255,0.12)';
    row.style.borderRadius = '8px';
    row.style.padding = '10px 14px';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    let pactButton = '';
    if (isPact) {
      pactButton = `
        <button class="btn" style="font-size:11px; background:#e11d48; border-color:#f43f5e;" onclick="breakPactWithRegion('${reg.id}')">
          ⚡ 同盟破棄
        </button>
      `;
    } else {
      pactButton = `
        <button class="btn" style="font-size:11px; background:#059669; border-color:#10b981;" ${reg.relations < 65 ? 'disabled' : ''} onclick="signPactWithRegion('${reg.id}')">
          🤝 不戦協定締結
        </button>
      `;
    }

    row.innerHTML = `
      <div>
        <div style="font-weight:bold; font-size:14px; color:#fff;">
          ${reg.name} <span style="font-size:11px; color:${faction.accentColor || '#94a3b8'};">(${faction.name})</span>
          ${isPact ? `<span style="color:#34d399; font-size:11px; margin-left:8px;">🤝 不可侵同盟中${allianceTurns}</span>` : ''}
        </div>
        <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">
          特産: ${reg.specialty} / 友好度: <b style="color:${reg.relations >= 65 ? '#34d399' : '#fbbf24'};">${reg.relations || 40}/100</b>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn" style="font-size:11px;" ${!availableSpecialty ? 'disabled' : ''} onclick="tributeToRegion('${reg.id}', '${availableSpecialty}')">
          🎁 特産品贈呈 (+25)
        </button>
        ${pactButton}
      </div>
    `;

    neighborsList.appendChild(row);
  });
}

window.tributeToRegion = function(regionId, specialtyName) {
  soundManager.playCoin();
  game.sendTribute(regionId, specialtyName);
  renderDiplomacyModal();
  renderUI();
};

window.signPactWithRegion = function(regionId) {
  soundManager.playFanfare();
  game.formPact(regionId);
  renderDiplomacyModal();
  renderUI();
};

window.breakPactWithRegion = function(regionId) {
  if (confirm('本当にこの同盟を破棄しますか？\n（信義違背により自国の民意が -5% 低下し、相手の友好度が大幅に下落します）')) {
    soundManager.playEscapeFail();
    game.breakPact(regionId);
    renderDiplomacyModal();
    renderUI();
  }
};

// =========================================================================
// === PARTY FORMATION MODAL (Shows Drafted Status & Deputy Avatar) ===
// =========================================================================
function openPartyModal() {
  const modal = document.getElementById('modal-party');
  renderPartySlots();
  renderRoster();
  modal.style.display = 'flex';
}

function renderPartySlots() {
  const container = document.getElementById('party-slots-container');
  container.innerHTML = '';

  game.playerParty.forEach((charId, idx) => {
    const char = CHARACTERS_DB[charId];
    const slotCard = document.createElement('div');
    slotCard.className = `party-slot-card ${selectedPartySlot === idx ? 'active' : ''}`;
    slotCard.style.cursor = 'pointer';
    slotCard.style.borderColor = selectedPartySlot === idx ? '#fbbf24' : '#3b82f6';
    
    if (char) {
      const isDrafted = (game.draftedHeroId === charId && game.draftTurnsLeft > 0);
      const spriteSvg = PIXEL_SPRITES.getSprite(isDrafted ? 'proxy_deputy' : char.id);

      if (isDrafted) {
        slotCard.innerHTML = `
          <div class="party-slot-label" style="color:#ef4444;">⚠️ 宗主国軍役へ徴発中 (残${game.draftTurnsLeft}ヶ月)</div>
          <div style="font-size:32px; display:flex; justify-content:center; align-items:center; height:48px;">${spriteSvg}</div>
          <div style="font-weight:bold; font-size:13px; color:#fca5a5;">${char.name}の代理副官</div>
          <div style="font-size:11px; color:#94a3b8;">留守代行（能力80%）</div>
          <div style="font-size:10px; color:#f87171; margin-top:2px;">※防衛戦時はこの代理が出陣</div>
        `;
      } else {
        slotCard.innerHTML = `
          <div class="party-slot-label">出陣スロット ${idx + 1} ${selectedPartySlot === idx ? '◀ 選択中' : ''}</div>
          <div style="font-size:32px; display:flex; justify-content:center; align-items:center; height:48px;">${spriteSvg}</div>
          <div style="font-weight:bold; font-size:14px; color:#fff;">${char.name}</div>
          <div style="font-size:11px; color:#38bdf8;">${char.role}</div>
          <div style="display:flex; justify-content:space-around; font-size:11px; color:#cbd5e1; margin-top:4px;">
            <span>HP ${char.maxHp}</span>
            <span>MP ${char.maxMp}</span>
            <span>攻 ${char.attack}</span>
          </div>
        `;
      }
    }

    slotCard.onclick = () => {
      soundManager.playCursor();
      selectedPartySlot = idx;
      renderPartySlots();
    };

    container.appendChild(slotCard);
  });
}

function renderRoster() {
  const container = document.getElementById('roster-container');
  container.innerHTML = '';

  game.playerRoster.forEach(charId => {
    const char = CHARACTERS_DB[charId];
    if (!char) return;

    const inParty = game.playerParty.includes(charId);
    const isDrafted = (game.draftedHeroId === charId && game.draftTurnsLeft > 0);
    const spriteSvg = PIXEL_SPRITES.getSprite(char.id);

    const card = document.createElement('div');
    card.className = `roster-card ${inParty ? 'in-party' : ''}`;

    let statusTag = '';
    if (isDrafted) {
      statusTag = `<span style="color:#ef4444; font-size:10px;">軍役徴発中(残${game.draftTurnsLeft}月)</span>`;
    } else if (inParty) {
      statusTag = `<span style="color:#10b981; font-size:10px;">出陣中</span>`;
    }

    card.innerHTML = `
      <div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center;">${spriteSvg}</div>
      <div style="flex:1;">
        <div style="font-size:13px; font-weight:bold; color:#fff; display:flex; justify-content:space-between;">
          <span>${char.name}</span>
          ${statusTag}
        </div>
        <div style="font-size:10px; color:#94a3b8;">${char.title} / ${char.role}</div>
        <div style="font-size:10px; color:#fbbf24; margin-top:2px;">技: ${char.skills.map(s => s.name).join(', ')}</div>
      </div>
    `;

    card.onclick = () => {
      if (isDrafted) {
        soundManager.playEscapeFail();
        alert('この武将は現在、宗主国への軍役に徴発されているため変更できません。');
        return;
      }
      soundManager.playClick();
      game.setPartyMember(selectedPartySlot, charId);
      renderPartySlots();
      renderRoster();
    };

    container.appendChild(card);
  });
}

// =========================================================================
// === FF-STYLE 3v3 COMMAND BATTLE WITH DEFEAT SURVIVAL & DEPUTY HEROES ===
// =========================================================================
function startFfBattle(sourceId, targetId) {
  const source = game.regions[sourceId];
  const target = game.regions[targetId];
  if (!source || !target) return;

  activeBattleIsBullying = game.checkBullyingAttack(source, target);

  soundManager.playDrum();

  // 1. Dynamic Regional Background (深緑樹海・サイバー都市・臨海湾岸・下町・武蔵野)
  const bgContainer = document.getElementById('ff-arena-bg');
  if (bgContainer && typeof BATTLE_BACKGROUNDS !== 'undefined') {
    bgContainer.innerHTML = BATTLE_BACKGROUNDS.getBackgroundForRegion(target);
  }

  // Retrieve active battle party (automatically substitutes 80% deputy if drafted away!)
  const alliesData = game.getPlayerBattleParty();
  const enemiesData = game.getRegionDefenders(target);

  const battleModal = document.getElementById('modal-ff-battle');
  battleModal.style.display = 'flex';

  selectedEnemyTargetIndex = 0;
  pendingSkillId = null;

  activeBattle = new BattleEngine(alliesData, enemiesData, {
    playerTroops: source.troops,
    enemyTroops: target.troops,
    targetRegion: target,
    sourceRegion: source,
    onEvent: handleBattleEvent,
    onBattleEnd: handleBattleEnd
  });

  setupBattleUI();
  activeBattle.start();
}

function setupBattleUI() {
  renderBattlers();
  renderEnemyTargetsList();
  renderStatusBox();
  setupCommandButtons();
  setBattleTicker('⚔️ 合戦開始！ 攻撃コマンドを選択してください。');
  setCombatStreamLog('合戦が開幕しました。両軍が対峙しています。');
}

function ensureValidEnemyTarget() {
  if (!activeBattle) return;
  const current = activeBattle.enemies[selectedEnemyTargetIndex];
  if (!current || current.isDead) {
    const firstAlive = activeBattle.enemies.findIndex(e => !e.isDead);
    if (firstAlive !== -1) {
      selectedEnemyTargetIndex = firstAlive;
    }
  }
}

// Render Standalone Retro Battlers directly on Arena Terrain (FF2 Style)
function renderBattlers() {
  const enemiesCol = document.getElementById('ff-enemies-column');
  const alliesCol = document.getElementById('ff-allies-column');

  enemiesCol.innerHTML = '';
  alliesCol.innerHTML = '';

  ensureValidEnemyTarget();

  // 1. Render 3 Enemies (Left side)
  activeBattle.enemies.forEach((enemy, idx) => {
    const card = document.createElement('div');
    const isTargeted = (selectedEnemyTargetIndex === idx && !enemy.isDead);
    const rowClass = enemy.row === 'front' ? 'front-row' : 'back-row';
    card.className = `battler-card enemy ${rowClass} ${enemy.isDead ? 'dead' : ''} ${isTargeted ? 'targeted' : ''}`;
    card.id = `enemy-card-${idx}`;

    const spriteSvg = PIXEL_SPRITES.getSprite(enemy.id);
    const rowBadge = enemy.row === 'front' ? '前列' : '後列';

    card.innerHTML = `
      ${isTargeted ? '<div class="battler-target-cursor">👉</div>' : ''}
      <div class="battler-avatar">${spriteSvg}</div>
      <div class="battler-field-label enemy">${rowBadge}・${enemy.name}</div>
    `;

    card.onclick = () => {
      if (enemy.isDead || activeBattle.state !== 'PLAYER_INPUT') return;
      soundManager.playCursor();
      selectedEnemyTargetIndex = idx;
      renderBattlers();
      renderEnemyTargetsList();

      if (pendingSkillId) {
        activeBattle.executePlayerSkill(pendingSkillId, idx);
        pendingSkillId = null;
        document.getElementById('ff-skills-subwindow').style.display = 'none';
      } else {
        executeAttackOnTarget(idx);
      }
    };

    enemiesCol.appendChild(card);
  });

  // 2. Render 3 Allies (Right side)
  const currentActor = activeBattle.getCurrentActor();

  activeBattle.allies.forEach((ally, idx) => {
    const card = document.createElement('div');
    const isTurn = currentActor && currentActor.team === 'ally' && currentActor.slot === idx;
    const rowClass = ally.row === 'front' ? 'front-row' : 'back-row';
    card.className = `battler-card ally ${rowClass} ${ally.isDead ? 'dead' : ''} ${isTurn ? 'active-turn' : ''}`;
    card.id = `ally-card-${idx}`;

    const spriteSvg = PIXEL_SPRITES.getSprite(ally.id);
    const rowBadge = ally.row === 'front' ? '前列' : '後列';

    card.innerHTML = `
      <div class="battler-field-label ally">${rowBadge}・${ally.name}</div>
      <div class="battler-avatar">${spriteSvg}</div>
      ${isTurn ? '<div class="battler-active-cursor">👈</div>' : ''}
    `;

    card.onclick = () => {
      if (ally.isDead || activeBattle.state !== 'PLAYER_INPUT') return;
      if (pendingSkillId) {
        soundManager.playCursor();
        activeBattle.executePlayerSkill(pendingSkillId, idx);
        pendingSkillId = null;
        document.getElementById('ff-skills-subwindow').style.display = 'none';
      }
    };

    alliesCol.appendChild(card);
  });
}

// Render Enemy Target Selection List in Left Subwindow (FF2 Style: "くろきし 3")
function renderEnemyTargetsList() {
  const panel = document.getElementById('ff-targets-panel');
  if (!panel || !activeBattle) return;
  panel.innerHTML = '';

  activeBattle.enemies.forEach((enemy, idx) => {
    const isTargeted = (selectedEnemyTargetIndex === idx && !enemy.isDead);
    const row = document.createElement('div');
    row.className = `ff-target-row ${isTargeted ? 'selected' : ''}`;

    if (enemy.isDead) {
      row.style.opacity = '0.35';
      row.style.cursor = 'not-allowed';
      row.innerHTML = `
        <span style="color:#94a3b8; text-decoration:line-through;">　 ${enemy.name}</span>
        <span style="font-size:11px; color:#ef4444;">撃破</span>
      `;
    } else {
      const rowTag = enemy.row === 'front' 
        ? '<span style="color:#fbbf24; font-size:11px;">[前列]</span>' 
        : '<span style="color:#60a5fa; font-size:11px;">[後列]</span>';
      
      row.innerHTML = `
        <span>${isTargeted ? '👉 ' : '　 '}${enemy.name}</span>
        ${rowTag}
      `;

      row.onclick = () => {
        if (enemy.isDead || activeBattle.state !== 'PLAYER_INPUT') return;
        soundManager.playCursor();
        selectedEnemyTargetIndex = idx;
        renderBattlers();
        renderEnemyTargetsList();

        if (pendingSkillId) {
          activeBattle.executePlayerSkill(pendingSkillId, idx);
          pendingSkillId = null;
          document.getElementById('ff-skills-subwindow').style.display = 'none';
        }
      };
    }

    panel.appendChild(row);
  });
}

// Render Classic FF2 Allies Party Status Table (Right Subwindow)
function renderStatusBox() {
  const box = document.getElementById('ff-allies-status-box');
  if (!box || !activeBattle) return;
  box.innerHTML = '';

  const currentActor = activeBattle.getCurrentActor();

  activeBattle.allies.forEach((ally, idx) => {
    const isTurn = currentActor && currentActor.team === 'ally' && currentActor.slot === idx;
    const row = document.createElement('div');
    row.className = `ff-status-row ${isTurn ? 'active' : ''}`;

    const pointer = isTurn ? '👉 ' : '　 ';
    const rowTag = ally.row === 'front'
      ? '<span style="color:#fbbf24; font-size:11px; margin-left:6px;">[前]</span>'
      : '<span style="color:#38bdf8; font-size:11px; margin-left:6px;">[後]</span>';

    const hpRatio = ally.maxHp > 0 ? ally.hp / ally.maxHp : 0;
    const hpColor = ally.isDead ? '#64748b' : (hpRatio < 0.3 ? '#f87171' : '#ffffff');
    const mpColor = ally.isDead ? '#64748b' : '#67e8f9';

    row.innerHTML = `
      <div style="display:flex; align-items:center; min-width:140px;">
        <span style="color:#fbbf24; font-weight:900;">${pointer}</span>
        <span style="color:${isTurn ? '#fef08a' : (ally.isDead ? '#64748b' : '#ffffff')}; font-weight:bold;">${ally.name}</span>
        ${rowTag}
      </div>
      <div style="display:flex; gap:16px; font-family:'Courier New', monospace; font-size:13px;">
        <span style="color:${hpColor};">HP <b style="display:inline-block; width:65px; text-align:right;">${ally.hp}/${ally.maxHp}</b></span>
        <span style="color:${mpColor};">MP <b style="display:inline-block; width:50px; text-align:right;">${ally.mp}/${ally.maxMp}</b></span>
      </div>
    `;
    box.appendChild(row);
  });
}

function executeAttackOnTarget(targetIndex) {
  if (!activeBattle || activeBattle.state !== 'PLAYER_INPUT') return;
  document.getElementById('ff-skills-subwindow').style.display = 'none';
  pendingSkillId = null;
  activeBattle.executePlayerAttack(targetIndex);
}

function setupCommandButtons() {
  const btnAttack = document.getElementById('btn-ff-attack');
  const btnSkills = document.getElementById('btn-ff-skills');
  const btnDefend = document.getElementById('btn-ff-defend');
  const btnEscape = document.getElementById('btn-ff-escape');
  const skillsSubwindow = document.getElementById('ff-skills-subwindow');
  const btnCloseSkills = document.getElementById('btn-close-skills');

  btnAttack.onclick = () => {
    if (activeBattle.state !== 'PLAYER_INPUT') return;
    soundManager.playCursor();
    ensureValidEnemyTarget();
    executeAttackOnTarget(selectedEnemyTargetIndex);
  };

  btnSkills.onclick = () => {
    if (activeBattle.state !== 'PLAYER_INPUT') return;
    soundManager.playCursor();
    openSkillsSubwindow();
  };

  btnDefend.onclick = () => {
    if (activeBattle.state !== 'PLAYER_INPUT') return;
    soundManager.playCursor();
    skillsSubwindow.style.display = 'none';
    pendingSkillId = null;
    activeBattle.executePlayerDefend();
  };

  btnEscape.onclick = () => {
    if (activeBattle.state !== 'PLAYER_INPUT') return;
    soundManager.playCursor();
    skillsSubwindow.style.display = 'none';
    pendingSkillId = null;

    const res = activeBattle.attemptEscape();
    if (res.success) {
      setBattleTicker(res.text);
      setCombatStreamLog(res.text);
      enableCommandButtons(false);
      setTimeout(() => {
        document.getElementById('modal-ff-battle').style.display = 'none';
        game.addLog(`【撤退】${activeBattle.targetRegion.name}より速やかに全軍退却しました。`);
        renderUI();
      }, 900);
    } else {
      soundManager.playEscapeFail();
      setBattleTicker(res.text);
      setCombatStreamLog(res.text);
    }
  };

  btnCloseSkills.onclick = () => {
    soundManager.playCursor();
    skillsSubwindow.style.display = 'none';
    pendingSkillId = null;
  };
}

function openSkillsSubwindow() {
  const actor = activeBattle.getCurrentActor();
  if (!actor) return;

  const subwindow = document.getElementById('ff-skills-subwindow');
  const list = document.getElementById('ff-skills-list');
  list.innerHTML = '';

  actor.skills.forEach(skill => {
    const btn = document.createElement('button');
    btn.className = 'skill-list-btn';
    btn.disabled = actor.mp < skill.mp;

    btn.innerHTML = `
      <div style="text-align:left;">
        <div style="font-weight:bold; font-size:12px; color:#fbbf24;">${skill.name}</div>
        <div style="font-size:10px; color:#cbd5e1;">${skill.desc}</div>
      </div>
      <div style="font-size:12px; font-weight:bold; color:#60a5fa; margin-left:8px;">MP ${skill.mp}</div>
    `;

    btn.onclick = () => {
      soundManager.playCursor();
      subwindow.style.display = 'none';

      if (skill.target === 'enemy_single') {
        ensureValidEnemyTarget();
        activeBattle.executePlayerSkill(skill.id, selectedEnemyTargetIndex);
      } else if (skill.target === 'ally_single') {
        activeBattle.executePlayerSkill(skill.id, actor.slot);
      } else {
        activeBattle.executePlayerSkill(skill.id, 0);
      }
    };

    list.appendChild(btn);
  });

  subwindow.style.display = 'flex';
}

function setBattleTicker(text) {
  document.getElementById('ff-ticker-text').textContent = text;
}

function setActionBanner(text) {
  const banner = document.getElementById('ff-action-banner');
  if (banner) {
    banner.textContent = text;
  }
}

function setCombatStreamLog(text) {
  const stream = document.getElementById('ff-combat-log-stream');
  if (stream) {
    stream.textContent = text;
  }
}

// Handle events from Battle Engine with Action Step & Hurt Shake Animations
function handleBattleEvent(event) {
  if (event.type === 'turn_start') {
    ensureValidEnemyTarget();
    setBattleTicker(`▶ ${event.actor.name} の行動順`);
    setActionBanner(`▶ 【味方】${event.actor.name} のターン！`);
    enableCommandButtons(true);
    renderBattlers();
    renderEnemyTargetsList();
    renderStatusBox();
  } else if (event.type === 'enemy_turn_start') {
    setBattleTicker(`⚠️ 敵の行動: ${event.actor.name}`);
    setActionBanner(`⚠️ 【敵】${event.actor.name} が構えている……`);
    enableCommandButtons(false);
    renderBattlers();
    renderEnemyTargetsList();
    renderStatusBox();
  } else if (event.type === 'action') {
    setBattleTicker(event.text);
    setActionBanner(event.text);
    setCombatStreamLog(event.text);

    if (event.actor) {
      const actorCardId = event.actor.team === 'ally' ? `ally-card-${event.actor.slot}` : `enemy-card-${event.actor.slot}`;
      const actorCard = document.getElementById(actorCardId);
      if (actorCard) {
        const stepClass = event.actor.team === 'ally' ? 'step-forward-ally' : 'step-forward-enemy';
        actorCard.classList.add(stepClass);
        setTimeout(() => actorCard.classList.remove(stepClass), 400);
      }
    }

    if (event.actionType === 'attack') {
      soundManager.playSlash();
      if (event.target) {
        showDamagePopup(event.target, event.damage, false);
        shakeHurtTarget(event.target);
      }
    } else if (event.actionType === 'skill') {
      if (event.skill.id && event.skill.id.includes('laser')) {
        soundManager.playLaser();
      } else if (event.skill.type && event.skill.type.includes('heal')) {
        soundManager.playHeal();
      } else {
        soundManager.playMagic();
      }
      if (event.targets) {
        event.targets.forEach(t => shakeHurtTarget(t));
      }
    }

    renderBattlers();
    renderEnemyTargetsList();
    renderStatusBox();
  } else if (event.type === 'damage_pop') {
    showDamagePopup(event.target, event.damage, false);
  } else if (event.type === 'heal_pop') {
    showDamagePopup(event.target, event.heal, true);
  } else if (event.type === 'log') {
    setBattleTicker(event.text);
    setCombatStreamLog(event.text);
  }
}

function shakeHurtTarget(target) {
  const cardId = target.team === 'enemy' ? `enemy-card-${target.slot}` : `ally-card-${target.slot}`;
  const card = document.getElementById(cardId);
  if (card) {
    card.classList.add('shake-hurt');
    setTimeout(() => card.classList.remove('shake-hurt'), 450);
  }
}

function enableCommandButtons(enabled) {
  document.getElementById('btn-ff-attack').disabled = !enabled;
  document.getElementById('btn-ff-skills').disabled = !enabled;
  document.getElementById('btn-ff-defend').disabled = !enabled;
  document.getElementById('btn-ff-escape').disabled = !enabled;
}

function showDamagePopup(target, amount, isHeal) {
  const cardId = target.team === 'enemy' ? `enemy-card-${target.slot}` : `ally-card-${target.slot}`;
  const card = document.getElementById(cardId);
  if (!card) return;

  const popup = document.createElement('div');
  popup.className = `damage-popup ${isHeal ? 'heal' : ''}`;
  popup.textContent = isHeal ? `+${amount}` : `-${amount}`;
  popup.style.left = '50%';
  popup.style.top = '20%';

  card.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

// Handle Battle Conclusion with Defeat Survival & Vassalage Indemnity
function handleBattleEnd(result) {
  enableCommandButtons(false);

  if (result.won) {
    soundManager.playFfFanfare();
    setBattleTicker(`🎉【大勝利】敵守備部隊を完全撃破！ ${result.targetRegion.name} を制圧した！`);
    setActionBanner(`🎉【大勝利】${result.targetRegion.name} 完全制圧！`);

    setTimeout(() => {
      document.getElementById('modal-ff-battle').style.display = 'none';
      const conquestRes = game.conquerRegion(result.sourceRegion.id, result.targetRegion.id, 1200, activeBattleIsBullying);
      renderUI();

      if (conquestRes && conquestRes.newHero) {
        showHeroRecruitModal(conquestRes.newHero);
      }
    }, 2400);

  } else {
    soundManager.playDefeat();
    setBattleTicker(`⚠️【合戦敗北】我が軍は力及ばず退却を余儀なくされた……`);
    setActionBanner(`⚠️【敗北】従属賠償と武将徴発が執行されます`);

    setTimeout(() => {
      document.getElementById('modal-ff-battle').style.display = 'none';

      // Execute defeat survival penalties (10% indemnity, 1 hero drafted away)
      const victorFaction = result.targetRegion.owner;
      const penaltyRes = game.handleDefeatPenalties(victorFaction, result.sourceRegion.id);
      renderUI();

      // Show Defeat Survival Dialog to assure player the game is NOT over
      showDefeatSurvivalModal(penaltyRes, result.targetRegion.name);
    }, 2400);
  }
}

function showDefeatSurvivalModal(penaltyRes, enemyRegionName) {
  const modal = document.getElementById('modal-generic');
  document.getElementById('modal-generic-title').textContent = '⚠️【敗戦・従属調停】（ゲームオーバーではありません）';

  const draftedInfo = penaltyRes.draftedHero 
    ? `<div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:6px; padding:10px; margin-top:10px;">
         <b style="color:#fca5a5;">武将の軍役徴発（駆り出され）:</b><br>
         武将【${penaltyRes.draftedHero.name}】が宗主国${penaltyRes.victorName}の軍役へ一時徴発（${penaltyRes.turnsLeft}ヶ月間）されました！<br>
         <span style="font-size:11px; color:#cbd5e1;">※留守中の防衛戦には能力80%の代理副官が出陣して領地を守ります。任務が完了すれば無事帰還します。</span>
       </div>`
    : '';

  document.getElementById('modal-generic-content').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; line-height:1.6; color:#e2e8f0;">
      <p>
        ${enemyRegionName}への侵攻（または防衛）に失敗しましたが、完全滅亡は免れました。<br>
        勝者側との調停により、以下の条件で休戦が成立しました。
      </p>
      <div style="background:rgba(0,0,0,0.4); border-radius:6px; padding:12px;">
        <div>💰 <b>賠償金の上納:</b> 所持金の10%（${penaltyRes.lostFunds.toLocaleString()}）を差し出しました。</div>
        <div>🛡️ <b>兵力損耗:</b> 拠点の兵力10%（${penaltyRes.lostTroops.toLocaleString()}）を供出しました。</div>
        ${draftedInfo}
      </div>
      <p style="color:#fcd34d; font-size:12px;">
        💡 <b>臥薪嘗胆・再起のアドバイス:</b><br>
        領地は維持されています。内政（商業開拓や治安巡回）で地味に資金と兵力を蓄え直せば、万全の態勢で再び下克上の戦いを挑むことができます！
      </p>
      <div style="text-align:right; margin-top:8px;">
        <button class="btn btn-turn" onclick="document.getElementById('modal-generic').style.display='none'">再起を誓う</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

function showHeroRecruitModal(hero) {
  const modal = document.getElementById('modal-hero-recruit');
  const spriteSvg = PIXEL_SPRITES.getSprite(hero.id);
  const avatarElem = document.getElementById('recruit-hero-avatar');
  avatarElem.innerHTML = spriteSvg;
  document.getElementById('recruit-hero-name').textContent = hero.name;
  document.getElementById('recruit-hero-title').textContent = `${hero.regionName} / ${hero.title}`;
  document.getElementById('recruit-hero-desc').textContent = hero.skills[0] ? hero.skills[0].desc : '卓越した才能を持つ英傑。';
  document.getElementById('recruit-hero-skill').textContent = hero.skills[0] ? `🔥 固有スキル: 【${hero.skills[0].name}】` : '';

  modal.style.display = 'flex';
}

// Modal: Troop Transport
function showTransportModal(sourceReg) {
  const friendlyNeighbors = sourceReg.neighbors
    .map(id => game.regions[id])
    .filter(r => r && r.owner === game.playerFaction);

  const modal = document.getElementById('modal-generic');
  const title = document.getElementById('modal-generic-title');
  const content = document.getElementById('modal-generic-content');

  title.textContent = `【部隊の輸送配置換え】（出発: ${sourceReg.name}）`;
  
  const maxMovable = sourceReg.troops - 100;

  content.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div>移動先となる隣接領地を選択してください：</div>
      <select id="transport-target-select" style="background:#1e293b; color:#fff; border:1px solid #475569; padding:8px; border-radius:6px; font-size:14px;">
        ${friendlyNeighbors.map(n => `<option value="${n.id}">${n.name} (現在兵力: ${n.troops})</option>`).join('')}
      </select>
      <div class="slider-group">
        <div class="slider-labels">
          <span>移動兵数</span>
          <b id="txt-transport-count" style="color:#38bdf8">${Math.floor(maxMovable * 0.5)}</b>
        </div>
        <input type="range" id="slider-transport" min="50" max="${maxMovable}" value="${Math.floor(maxMovable * 0.5)}" />
      </div>
      <div style="text-align:right; margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
        <button class="btn" onclick="document.getElementById('modal-generic').style.display='none'">キャンセル</button>
        <button class="btn btn-turn" id="btn-do-transport">輸送実行</button>
      </div>
    </div>
  `;

  const slider = document.getElementById('slider-transport');
  slider.oninput = () => {
    document.getElementById('txt-transport-count').textContent = slider.value;
  };

  document.getElementById('btn-do-transport').onclick = () => {
    const targetId = document.getElementById('transport-target-select').value;
    const count = parseInt(slider.value);
    soundManager.playMarch();
    game.transportTroops(sourceReg.id, targetId, count);
    modal.style.display = 'none';
    renderUI();
  };

  modal.style.display = 'flex';
}

function showVictoryModal() {
  soundManager.playFfFanfare();
  const modal = document.getElementById('modal-generic');
  document.getElementById('modal-generic-title').textContent = '👑【東京完全平定・天下統一！】';
  document.getElementById('modal-generic-content').innerHTML = `
    <div style="text-align:center; padding:20px; display:flex; flex-direction:column; gap:16px;">
      <div style="font-size:36px;">🎉 🏯 🎌</div>
      <h2 style="color:#fbbf24; font-size:24px;">全53市区町村を完全支配！</h2>
      <p style="font-size:15px; line-height:1.6; color:#e2e8f0;">
        ${FACTIONS[game.playerFaction].name}の軍勢が、都心23区から多摩・西東京の山河に至るまで、
        全ての領域をその旗のもとに統一した！<br>
        東京の新たな覇権がここに確立された！
      </p>
      <button class="btn btn-turn" style="margin: 0 auto;" onclick="location.reload()">再挑戦（新勢力で開始）</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function showDefeatModal() {
  soundManager.playDefeat();
  const modal = document.getElementById('modal-generic');
  document.getElementById('modal-generic-title').textContent = '💀【勢力滅亡】';
  document.getElementById('modal-generic-content').innerHTML = `
    <div style="text-align:center; padding:20px; display:flex; flex-direction:column; gap:16px;">
      <div style="font-size:36px;">🏯 🔥 🌪️</div>
      <h2 style="color:#ef4444; font-size:24px;">我が勢力は全領土を失った……</h2>
      <p style="font-size:15px; line-height:1.6; color:#e2e8f0;">
        全拠点が陥落し、再起の基盤を失ってしまった。
      </p>
      <button class="btn btn-turn" style="margin: 0 auto;" onclick="location.reload()">再起（リトライ）</button>
    </div>
  `;
  modal.style.display = 'flex';
}

// ==========================================
// DQ-STYLE 2D RPG MODE INITIALIZATION & INTEGRATION
// ==========================================
function setupRpgMode() {
  const canvas = document.getElementById('rpg-canvas');
  if (canvas && !rpgEngine && typeof TokyoRpgEngine !== 'undefined') {
    try {
      rpgEngine = new TokyoRpgEngine('rpg-canvas', game);
    } catch(err) {
      console.error('TokyoRpgEngine initialization failed:', err);
    }
  }

  const btnToggleRpg = document.getElementById('btn-toggle-rpg');
  if (btnToggleRpg) {
    btnToggleRpg.addEventListener('click', () => {
      window.openRpgMode();
    });
  }

  const btnCloseRpg = document.getElementById('btn-close-rpg');
  if (btnCloseRpg) {
    btnCloseRpg.addEventListener('click', () => {
      window.closeRpgMode();
    });
  }

  const btnExplore = document.getElementById('btn-cmd-rpg-explore');
  if (btnExplore) {
    btnExplore.addEventListener('click', () => {
      if (game.selectedRegion) {
        window.openRpgMode(game.selectedRegion.id);
      } else {
        window.openRpgMode();
      }
    });
  }

  const btnInfiltrate = document.getElementById('btn-direct-rpg-infiltrate');
  if (btnInfiltrate) {
    btnInfiltrate.addEventListener('click', () => {
      if (game.selectedRegion) {
        window.openRpgMode(game.selectedRegion.id);
      } else {
        window.openRpgMode();
      }
    });
  }

  const btnCloseShop = document.getElementById('btn-close-rpg-shop');
  if (btnCloseShop) {
    btnCloseShop.addEventListener('click', () => {
      if (rpgEngine) rpgEngine.closeShop();
    });
  }

  const btnInventory = document.getElementById('btn-rpg-inventory');
  if (btnInventory) {
    btnInventory.addEventListener('click', () => {
      if (rpgEngine) rpgEngine.toggleInventoryMenu();
    });
  }

  const btnCloseMenu = document.getElementById('btn-close-rpg-menu');
  if (btnCloseMenu) {
    btnCloseMenu.addEventListener('click', () => {
      const menu = document.getElementById('rpg-menu-window');
      if (menu) menu.style.display = 'none';
    });
  }

  setupRpgTouchControls();
}

window.openRpgMode = function(regionId) {
  try {
    const container = document.getElementById('rpg-viewport-container');
    if (!container) {
      alert('【エラー】RPG画面コンテナが見つかりません。');
      return;
    }
    container.style.display = 'flex';
    container.style.zIndex = '99999';

    if (!rpgEngine && typeof TokyoRpgEngine !== 'undefined') {
      const canvas = document.getElementById('rpg-canvas');
      if (canvas) {
        rpgEngine = new TokyoRpgEngine('rpg-canvas', game);
      }
    }

    if (rpgEngine) {
      if (regionId) {
        window.openRpgModeForRegion(regionId);
      } else {
        rpgEngine.transitionToOverworld();
      }
      rpgEngine.updateHUD();
    }
  } catch(e) {
    console.error('Error in openRpgMode:', e);
    alert('RPGモードの起動中にエラーが発生しました: ' + e.message);
  }
};

window.closeRpgMode = function() {
  const container = document.getElementById('rpg-viewport-container');
  if (container) {
    container.style.display = 'none';
  }
  const shop = document.getElementById('rpg-shop-window');
  if (shop) shop.style.display = 'none';
  const menu = document.getElementById('rpg-menu-window');
  if (menu) menu.style.display = 'none';
};

window.openRpgModeForRegion = function(regionId) {
  window.openRpgMode();
  if (rpgEngine) {
    const targetArea = AREAS_DATA[regionId] || (regionId === 'chiyoda' ? AREAS_DATA['akihabara'] : (regionId === 'shinjuku' ? AREAS_DATA['shinjuku_neon'] : null));
    if (targetArea) {
      rpgEngine.transitionToTown(targetArea.areaId);
    } else {
      // Find matching landmark or procedural fallback
      const lm = WORLD_MAP_LANDMARKS.find(l => l.areaId.includes(regionId) || regionId.includes(l.areaId));
      if (lm) {
        rpgEngine.transitionToTown(lm.areaId);
      } else {
        rpgEngine.transitionToOverworld();
      }
    }
  }
};

function setupRpgTouchControls() {
  const setTouch = (dir) => {
    if (rpgEngine) {
      rpgEngine.touchDir = dir;
      rpgEngine.stepInDirection(dir);
    }
  };
  const clearTouch = () => {
    if (rpgEngine) rpgEngine.touchDir = null;
  };

  const bindTouch = (id, dir) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mousedown', (e) => { e.preventDefault(); setTouch(dir); });
    el.addEventListener('mouseup', (e) => { e.preventDefault(); clearTouch(); });
    el.addEventListener('mouseleave', (e) => { e.preventDefault(); clearTouch(); });
    el.addEventListener('touchstart', (e) => { e.preventDefault(); setTouch(dir); }, { passive: false });
    el.addEventListener('touchend', (e) => { e.preventDefault(); clearTouch(); });
    el.addEventListener('touchcancel', (e) => { e.preventDefault(); clearTouch(); });
  };

  bindTouch('touch-btn-up', 'up');
  bindTouch('touch-btn-down', 'down');
  bindTouch('touch-btn-left', 'left');
  bindTouch('touch-btn-right', 'right');

  const btnAction = document.getElementById('touch-btn-action');
  if (btnAction) {
    const triggerAct = (e) => {
      e.preventDefault();
      if (rpgEngine) rpgEngine.handleActionKey();
    };
    btnAction.addEventListener('click', triggerAct);
    btnAction.addEventListener('touchstart', triggerAct, { passive: false });
  }

  const btnCancel = document.getElementById('touch-btn-cancel');
  if (btnCancel) {
    const triggerCancel = (e) => {
      e.preventDefault();
      if (rpgEngine) rpgEngine.handleCancelKey();
    };
    btnCancel.addEventListener('click', triggerCancel);
    btnCancel.addEventListener('touchstart', triggerCancel, { passive: false });
  }

  // Toggle button for on-screen controller
  const btnTogglePad = document.getElementById('btn-toggle-touch-pad');
  if (btnTogglePad) {
    btnTogglePad.addEventListener('click', () => {
      const controls = document.getElementById('rpg-touch-controls');
      if (!controls) return;
      const isHidden = window.getComputedStyle(controls).display === 'none';
      controls.style.display = isHidden ? 'flex' : 'none';
    });
  }
}

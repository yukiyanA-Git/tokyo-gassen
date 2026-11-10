// DQ1-4 Style 2D Retro RPG Engine for Tokyo Conquest (100% Data-Driven Architecture)
// Supports Tokyo Overworld exploration, Town transitions, Multi-Currency Trading, NPCs, Facilities & Checkpoints

const _getW = () => (typeof WORLD_MAP_WIDTH !== 'undefined' ? WORLD_MAP_WIDTH : (typeof window !== 'undefined' && window.WORLD_MAP_WIDTH) || 72);
const _getH = () => (typeof WORLD_MAP_HEIGHT !== 'undefined' ? WORLD_MAP_HEIGHT : (typeof window !== 'undefined' && window.WORLD_MAP_HEIGHT) || 48);
const _getRaw = () => (typeof WORLD_MAP_RAW !== 'undefined' ? WORLD_MAP_RAW : (typeof window !== 'undefined' && window.WORLD_MAP_RAW) || []);
const _getLandmarks = () => (typeof WORLD_MAP_LANDMARKS !== 'undefined' ? WORLD_MAP_LANDMARKS : (typeof window !== 'undefined' && window.WORLD_MAP_LANDMARKS) || []);
const _getAreas = () => (typeof AREAS_DATA !== 'undefined' ? AREAS_DATA : (typeof window !== 'undefined' && window.AREAS_DATA) || {});
const _getItems = () => (typeof ITEMS_DB !== 'undefined' ? ITEMS_DB : (typeof window !== 'undefined' && window.ITEMS_DB) || {});
const _getCurrencies = () => (typeof CURRENCY_LABELS !== 'undefined' ? CURRENCY_LABELS : (typeof window !== 'undefined' && window.CURRENCY_LABELS) || {});

class TokyoRpgEngine {
  constructor(canvasId, gameInstance) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.game = gameInstance;

    // Viewport dimensions
    this.tileSize = 32;
    this.viewportTilesX = 16;
    this.viewportTilesY = 12;

    // Game state: 'overworld' | 'town'
    this.mode = 'overworld'; 
    this.currentAreaId = null;
    this.currentArea = null;

    // Player position on Overworld (Spawn near Shinjuku / Central Tokyo on 72x48 grand map)
    this.overworldPos = { x: 44, y: 23, dir: 'down', animFrame: 0 };
    if (this.game && this.game.startingRegionId) {
      const matchLm = _getLandmarks().find(l => l.areaId.includes(this.game.startingRegionId) || this.game.startingRegionId.includes(l.areaId));
      if (matchLm) {
        this.overworldPos.x = matchLm.x;
        this.overworldPos.y = matchLm.y + 1;
      }
    }
    // Player position inside Town
    this.townPos = { x: 12, y: 15, dir: 'up', animFrame: 0 };

    // Movement interpolation
    this.isMoving = false;
    this.moveProgress = 0;
    this.moveSpeed = 0.15; // smooth step speed
    this.fromPos = { x: 0, y: 0 };
    this.toPos = { x: 0, y: 0 };

    // Dialogue State
    this.activeDialogue = null; // { speaker, title, lines, lineIdx, charIdx, displayedText }
    this.dialogueTimer = 0;

    // Shop State
    this.activeShop = null; // facility object

    // Inn State
    this.activeInn = null;

    // Controls input state
    this.keys = {};
    this.touchDir = null;
    this.queuedMove = null;

    // Transition effect
    this.fadeAlpha = 0;
    this.isTransitioning = false;
    this.pendingTransition = null;

    // Animation ticker
    this.tickCount = 0;

    this.initInput();
    this.startLoop();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive()) return;
      this.keys[e.key] = true;
      this.keys[e.code] = true;

      // Prevent scrolling for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || 
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Interaction Keys (Enter, Space, Z)
      if (['Enter', 'Space', 'KeyZ', 'z', 'Z'].includes(e.code) || ['Enter', ' ', 'z', 'Z'].includes(e.key)) {
        e.preventDefault();
        this.handleActionKey();
      }

      // Cancel / Menu Keys (Escape, X, KeyX)
      if (['Escape', 'KeyX', 'x', 'X'].includes(e.code) || ['Escape', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
        this.handleCancelKey();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    // Direct Canvas Click & Touch Listener (Click-to-Move & Click-to-Interact)
    if (this.canvas) {
      const handlePointer = (e) => {
        if (!this.isActive()) return;
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        this.handleCanvasClick(clientX, clientY);
      };

      this.canvas.addEventListener('click', handlePointer);
      this.canvas.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const t = e.changedTouches[0];
          this.handleCanvasClick(t.clientX, t.clientY);
        }
      });
    }
  }

  // Handle direct click or touch on the Canvas
  handleCanvasClick(clientX, clientY) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;

    // Advance dialogue if active
    if (this.activeDialogue) {
      this.advanceDialogue();
      return;
    }

    // Compute camera offset
    const p = this.getPlayer();
    let camX = -(p.x * this.tileSize) + this.canvas.width / 2;
    let camY = -(p.y * this.tileSize) + this.canvas.height / 2;

    if (this.mode === 'overworld') {
      const mapW = _getW() * this.tileSize;
      const mapH = _getH() * this.tileSize;
      camX = Math.min(0, Math.max(this.canvas.width - mapW, camX));
      camY = Math.min(0, Math.max(this.canvas.height - mapH, camY));
    } else if (this.currentArea) {
      const areaW = this.currentArea.width * this.tileSize;
      const areaH = this.currentArea.height * this.tileSize;
      camX = Math.min(0, Math.max(this.canvas.width - areaW, camX));
      camY = Math.min(0, Math.max(this.canvas.height - areaH, camY));
    }

    const worldX = screenX - camX;
    const worldY = screenY - camY;
    const targetTileX = Math.floor(worldX / this.tileSize);
    const targetTileY = Math.floor(worldY / this.tileSize);

    if (this.mode === 'town' && this.currentArea) {
      // 1. Did player click an NPC?
      const clickedNpc = this.currentArea.npcs.find(n => Math.hypot(n.position.x - targetTileX, n.position.y - targetTileY) <= 1.4);
      if (clickedNpc) {
        const dist = Math.hypot(clickedNpc.position.x - p.x, clickedNpc.position.y - p.y);
        if (dist <= 3.2) {
          this.startNpcDialogue(clickedNpc);
          return;
        } else {
          this.walkToward(clickedNpc.position.x, clickedNpc.position.y);
          return;
        }
      }

      // 2. Did player click a facility?
      const clickedFac = this.currentArea.facilities.find(f => Math.hypot(f.position.x - targetTileX, f.position.y - targetTileY) <= 1.4);
      if (clickedFac) {
        const dist = Math.hypot(clickedFac.position.x - p.x, clickedFac.position.y - p.y);
        if (dist <= 3.2) {
          this.triggerFacility(clickedFac);
          return;
        } else {
          this.walkToward(clickedFac.position.x, clickedFac.position.y);
          return;
        }
      }

      // 3. Otherwise walk toward clicked tile
      this.walkToward(targetTileX, targetTileY);
    } else if (this.mode === 'overworld') {
      // Check if clicked landmark
      const clickedLm = _getLandmarks().find(l => Math.hypot(l.x - targetTileX, l.y - targetTileY) <= 1.5);
      if (clickedLm) {
        const dist = Math.hypot(clickedLm.x - p.x, clickedLm.y - p.y);
        if (dist <= 2.2) {
          this.transitionToTown(clickedLm.areaId);
          return;
        }
      }
      this.walkToward(targetTileX, targetTileY);
    }
  }

  // Smart Step towards target tile
  walkToward(targetX, targetY) {
    const p = this.getPlayer();
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) this.stepInDirection('right');
      else if (dx < 0) this.stepInDirection('left');
    } else {
      if (dy > 0) this.stepInDirection('down');
      else if (dy < 0) this.stepInDirection('up');
    }
  }

  // Execute or buffer one step immediately when a button or key is pressed
  stepInDirection(dir) {
    if (this.isMoving) {
      this.queuedMove = dir;
      return;
    }
    const p = this.getPlayer();
    let dx = 0, dy = 0;
    if (dir === 'up') dy = -1;
    else if (dir === 'down') dy = 1;
    else if (dir === 'left') dx = -1;
    else if (dir === 'right') dx = 1;

    p.dir = dir;
    p.animFrame = (p.animFrame + 1) % 4;

    const targetX = p.x + dx;
    const targetY = p.y + dy;

    if (this.canWalkTo(targetX, targetY)) {
      this.isMoving = true;
      this.moveProgress = 0;
      this.fromPos = { x: p.x, y: p.y };
      this.toPos = { x: targetX, y: targetY };
    }
  }

  isActive() {
    const container = document.getElementById('rpg-viewport-container');
    return container && container.style.display !== 'none';
  }

  handleActionKey() {
    // 1. Advance dialogue if open
    if (this.activeDialogue) {
      this.advanceDialogue();
      return;
    }

    // 2. Close shop if open and clicking outside or action
    if (this.activeShop) {
      return;
    }

    // 3. Interact with tile in front of player
    this.interactInFront();
  }

  handleCancelKey() {
    if (this.activeDialogue) {
      this.closeDialogue();
      return;
    }
    if (this.activeShop) {
      this.closeShop();
      return;
    }
    if (this.activeInn) {
      this.closeInn();
      return;
    }
    // Open/Close Inventory Menu
    this.toggleInventoryMenu();
  }

  // Determine current active player coordinates based on mode
  getPlayer() {
    return this.mode === 'overworld' ? this.overworldPos : this.townPos;
  }

  // Get tile in front of player
  getFacingCoords() {
    const p = this.getPlayer();
    let fx = p.x;
    let fy = p.y;
    if (p.dir === 'up') fy--;
    else if (p.dir === 'down') fy++;
    else if (p.dir === 'left') fx--;
    else if (p.dir === 'right') fx++;
    return { x: fx, y: fy };
  }

  interactInFront() {
    const p = this.getPlayer();
    const facing = this.getFacingCoords();

    if (this.mode === 'town' && this.currentArea) {
      // 1. Check for NPCs: direct facing first, then nearby radius <= 2.8
      let npc = this.currentArea.npcs.find(n => n.position.x === facing.x && n.position.y === facing.y);
      if (!npc) {
        const nearbyNpcs = this.currentArea.npcs
          .map(n => ({ npc: n, dist: Math.hypot(n.position.x - p.x, n.position.y - p.y) }))
          .filter(n => n.dist <= 2.8)
          .sort((a, b) => a.dist - b.dist);
        if (nearbyNpcs.length > 0) {
          npc = nearbyNpcs[0].npc;
        }
      }
      if (npc) {
        this.startNpcDialogue(npc);
        return;
      }

      // 2. Check for Facilities: direct facing first, then nearby radius <= 2.8
      let fac = this.currentArea.facilities.find(f => f.position.x === facing.x && f.position.y === facing.y);
      if (!fac) {
        const nearbyFacs = this.currentArea.facilities
          .map(f => ({ fac: f, dist: Math.hypot(f.position.x - p.x, f.position.y - p.y) }))
          .filter(f => f.dist <= 2.8)
          .sort((a, b) => a.dist - b.dist);
        if (nearbyFacs.length > 0) {
          fac = nearbyFacs[0].fac;
        }
      }
      if (fac) {
        this.triggerFacility(fac);
        return;
      }

      // 3. Fallback interaction feedback when pressing action key in empty space
      this.startNpcDialogue({
        name: "探索の独白",
        title: "周囲の様子",
        dialogues: ["（周囲に話しかけられる住人や施設はないようだ。建物や人影の近くまで移動してみよう）"]
      });

    } else if (this.mode === 'overworld') {
      // Check for Landmark Town in front, under feet, or nearby radius <= 2.2
      let landmark = _getLandmarks().find(l => (l.x === facing.x && l.y === facing.y) || (l.x === p.x && l.y === p.y));
      if (!landmark) {
        const nearbyLms = _getLandmarks()
          .map(l => ({ lm: l, dist: Math.hypot(l.x - p.x, l.y - p.y) }))
          .filter(l => l.dist <= 2.2)
          .sort((a, b) => a.dist - b.dist);
        if (nearbyLms.length > 0) {
          landmark = nearbyLms[0].lm;
        }
      }

      if (landmark) {
        this.transitionToTown(landmark.areaId);
      } else {
        this.startNpcDialogue({
          name: "広域索敵",
          title: "大東京マップ",
          dialogues: ["（目の前に街のシンボルは見当たらない。地図上のアイコンを目指して進もう）"]
        });
      }
    }
  }

  startNpcDialogue(npc) {
    if (typeof soundManager !== 'undefined' && soundManager.playClick) {
      soundManager.playClick();
    }
    this.activeDialogue = {
      speaker: npc.name,
      title: npc.title || '街の住人',
      lines: npc.dialogues || ["……特に用はないようだ。"],
      lineIdx: 0,
      charIdx: 0,
      displayedText: ""
    };
  }

  advanceDialogue() {
    if (!this.activeDialogue) return;
    const currentLine = this.activeDialogue.lines[this.activeDialogue.lineIdx];

    // If typewriter text is still typing, finish line instantly
    if (this.activeDialogue.charIdx < currentLine.length) {
      this.activeDialogue.charIdx = currentLine.length;
      this.activeDialogue.displayedText = currentLine;
      return;
    }

    // Move to next line or close
    this.activeDialogue.lineIdx++;
    if (this.activeDialogue.lineIdx >= this.activeDialogue.lines.length) {
      this.closeDialogue();
    } else {
      this.activeDialogue.charIdx = 0;
      this.activeDialogue.displayedText = "";
      if (typeof soundManager !== 'undefined' && soundManager.playClick) {
        soundManager.playClick();
      }
    }
  }

  closeDialogue() {
    this.activeDialogue = null;
  }

  triggerFacility(fac) {
    if (typeof soundManager !== 'undefined' && soundManager.playClick) {
      soundManager.playClick();
    }

    if (fac.type === 'shop') {
      this.openShop(fac);
    } else if (fac.type === 'inn') {
      this.openInn(fac);
    } else if (fac.type === 'checkpoint') {
      this.triggerCheckpoint(fac);
    }
  }

  openShop(shopFac) {
    this.activeShop = shopFac;
    const shopModal = document.getElementById('rpg-shop-window');
    if (shopModal) {
      this.renderShopUI();
      shopModal.style.display = 'flex';
    }
  }

  closeShop() {
    this.activeShop = null;
    const shopModal = document.getElementById('rpg-shop-window');
    if (shopModal) shopModal.style.display = 'none';
  }

  openInn(innFac) {
    const costUnit = innFac.costUnit || 'battery_cell';
    const cost = innFac.cost || 10;
    const currencies = _getCurrencies();
    const unitLabel = (currencies[costUnit] ? currencies[costUnit].name : costUnit);
    const playerHas = (this.game.playerCurrencies[costUnit] || 0);

    const promptText = `${innFac.welcomeMessage}\n\n【宿泊・再充電費用】: ${cost} ${unitLabel} (所持: ${playerHas} ${unitLabel})\n部隊全員のHPとMPを全回復しますか？`;

    if (confirm(promptText)) {
      if (playerHas >= cost) {
        this.game.playerCurrencies[costUnit] -= cost;
        // Full heal player battle party
        if (this.game.playerParty) {
          this.game.playerParty.forEach(charId => {
            const c = CHARACTERS_DB[charId];
            if (c) {
              c.hp = c.maxHp;
              c.mp = c.maxMp;
            }
          });
        }
        if (typeof soundManager !== 'undefined' && soundManager.playFanfare) {
          soundManager.playFanfare();
        }
        this.startNpcDialogue({
          name: innFac.name,
          title: "宿泊・再充電完了",
          dialogues: ["しっかり休んで全エネルギーが満タンになったぞ！気をつけて行ってきな！"]
        });
        this.updateHUD();
      } else {
        alert(`通貨【${unitLabel}】が不足しています！（必要: ${cost} / 所持: ${playerHas}）`);
      }
    }
  }

  triggerCheckpoint(chkFac) {
    const req = chkFac.passRequirement;
    const hasPass = this.game.playerInventory.some(it => it.id === req && it.count > 0);

    if (hasPass) {
      this.startNpcDialogue({
        name: chkFac.name,
        title: "検問警備隊長",
        dialogues: [chkFac.passedMessage || "通行許可証を確認した。通過を許可する！"]
      });
      // Mark checkpoint cleared
      if (!this.game.rpgState.clearedCheckpoints.includes(chkFac.id)) {
        this.game.rpgState.clearedCheckpoints.push(chkFac.id);
      }
    } else {
      this.startNpcDialogue({
        name: chkFac.name,
        title: "検問警備隊長",
        dialogues: [
          chkFac.blockedMessage || "止まれ！ここは通行許可のない者の立ち入りは禁じられている！",
          `必要なアイテム: 『${chkFac.requiredItemName || req}』`
        ]
      });
    }
  }

  // Render Shop DOM Interface
  renderShopUI() {
    if (!this.activeShop) return;
    const shop = this.activeShop;
    const currencyKey = shop.currency || 'junk_parts';
    const currencies = _getCurrencies();
    const currencyInfo = currencies[currencyKey] || { name: currencyKey, symbol: '🪙', color: '#fff' };
    const playerBalance = this.game.playerCurrencies[currencyKey] || 0;

    document.getElementById('rpg-shop-title').textContent = `🏪 ${shop.name}`;
    document.getElementById('rpg-shop-balance').innerHTML = `所持通貨: <b style="color:${currencyInfo.color}">${currencyInfo.symbol} ${playerBalance.toLocaleString()} ${currencyInfo.name}</b>`;

    const list = document.getElementById('rpg-shop-item-list');
    list.innerHTML = '';

    const itemsDb = _getItems();
    (shop.inventory || []).forEach(itemId => {
      const item = itemsDb[itemId];
      if (!item) return;

      const row = document.createElement('div');
      row.className = 'rpg-shop-row';
      const canAfford = playerBalance >= item.price;

      row.innerHTML = `
        <div style="flex:1;">
          <div style="font-weight:bold; color:#f8fafc; font-size:13px;">${item.name}</div>
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${item.description}</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:13px; font-weight:800; color:${currencyInfo.color};">${currencyInfo.symbol} ${item.price}</span>
          <button class="btn btn-turn rpg-buy-btn" ${canAfford ? '' : 'disabled'}>購入</button>
        </div>
      `;

      row.querySelector('.rpg-buy-btn').onclick = () => {
        this.buyItem(item, currencyKey);
      };

      list.appendChild(row);
    });
  }

  buyItem(item, currencyKey) {
    const current = this.game.playerCurrencies[currencyKey] || 0;
    if (current < item.price) {
      alert("通貨が不足しています！");
      return;
    }

    this.game.playerCurrencies[currencyKey] -= item.price;
    
    // Add to player inventory
    const existing = this.game.playerInventory.find(i => i.id === item.id);
    if (existing) {
      existing.count++;
    } else {
      this.game.playerInventory.push({ id: item.id, count: 1 });
    }

    if (typeof soundManager !== 'undefined' && soundManager.playCoin) {
      soundManager.playCoin();
    }

    this.game.addLog(`【RPG物資調達】${item.name} を ${item.price} ${_getCurrencies()[currencyKey]?.name || currencyKey} で購入しました。`, 'develop');
    this.renderShopUI();
    this.updateHUD();
  }

  toggleInventoryMenu() {
    const menuModal = document.getElementById('rpg-menu-window');
    if (!menuModal) return;
    if (menuModal.style.display === 'flex') {
      menuModal.style.display = 'none';
    } else {
      this.renderInventoryMenu();
      menuModal.style.display = 'flex';
    }
  }

  renderInventoryMenu() {
    // Render multi-currencies
    const curContainer = document.getElementById('rpg-menu-currencies');
    curContainer.innerHTML = '';
    const currencies = _getCurrencies();
    Object.keys(currencies).forEach(cKey => {
      const cInfo = currencies[cKey];
      const val = this.game.playerCurrencies[cKey] || 0;
      const chip = document.createElement('div');
      chip.className = 'rpg-currency-chip';
      chip.innerHTML = `<span style="color:${cInfo.color}">${cInfo.symbol} ${cInfo.name}:</span> <b>${val.toLocaleString()}</b>`;
      curContainer.appendChild(chip);
    });

    // Render items
    const itemContainer = document.getElementById('rpg-menu-items');
    itemContainer.innerHTML = '';
    if (this.game.playerInventory.length === 0) {
      itemContainer.innerHTML = '<div style="color:#64748b; font-size:12px; padding:10px;">所持品はありません。</div>';
    } else {
      const itemsDb = _getItems();
      this.game.playerInventory.forEach(invItem => {
        const dbItem = itemsDb[invItem.id] || { name: invItem.id, description: '詳細不明のアイテム' };
        const itemRow = document.createElement('div');
        itemRow.className = 'rpg-inventory-item-card';
        itemRow.innerHTML = `
          <div style="font-weight:bold; color:#f8fafc;">📦 ${dbItem.name} <span style="color:#fbbf24; font-size:11px;">×${invItem.count}</span></div>
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${dbItem.description}</div>
        `;
        itemContainer.appendChild(itemRow);
      });
    }
  }

  // --- TRANSITIONS ---
  generateFallbackTown(areaId, name) {
    return {
      areaId: areaId,
      name: name,
      dominantFaction: name,
      currencyAccepted: ["standard_yen", "junk_parts"],
      atmosphere: `${name}の城塞都市。防壁の内側には兵站拠点と物資集積所が広がる。`,
      width: 24,
      height: 18,
      facilities: [
        {
          id: `fac_${areaId}_inn`,
          type: "inn",
          name: "防護宿営所",
          cost: 600,
          costUnit: "standard_yen",
          position: { x: 6, y: 6 },
          welcomeMessage: `${name}の宿営所へようこそ。休んで部隊の体力を完全回復していくかい？`
        },
        {
          id: `fac_${areaId}_shop`,
          type: "shop",
          name: "物資調達所",
          position: { x: 18, y: 6 },
          currency: "standard_yen",
          inventory: ["item_repair_kit", "item_emp_grenade", "wpn_stun_rod", "wpn_cyber_dagger"],
          welcomeMessage: `${name}の調達所だ。装備や物資が必要なら見ていきな。`
        }
      ],
      npcs: [
        {
          id: `npc_${areaId}_guard`,
          name: "城塞守備兵",
          title: "防衛警備隊",
          sprite: "npc_guard",
          position: { x: 12, y: 9 },
          dialogues: [
            `ここは【${name}】だ。東京合戦の激戦地だが、内部は守備隊によって治安が保たれている。`,
            "街道沿いには他の自治体要塞も点在している。装備と兵力を整えてから次の地へ進むといい。"
          ]
        }
      ]
    };
  }

  transitionToTown(areaId) {
    if (this.isTransitioning) return;
    let area = _getAreas()[areaId];
    if (!area) {
      const landmark = _getLandmarks().find(l => l.areaId === areaId);
      const name = landmark ? landmark.name : "独立城塞";
      area = this.generateFallbackTown(areaId, name);
    }

    this.isTransitioning = true;
    this.pendingTransition = () => {
      this.mode = 'town';
      this.currentAreaId = areaId;
      this.currentArea = area;
      this.townPos.x = Math.floor(area.width / 2);
      this.townPos.y = area.height - 2;
      this.townPos.dir = 'up';
      this.updateHUD();
      this.game.addLog(`【街進入】${area.name}（${area.dominantFaction}支配下）に到着。`, 'ai');
    };
  }

  transitionToOverworld() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.pendingTransition = () => {
      this.mode = 'overworld';
      this.currentAreaId = null;
      this.currentArea = null;
      this.updateHUD();
      this.game.addLog(`【フィールド出立】東京広域マップへ出陣。`, 'ai');
    };
  }

  // --- UPDATE LOOP ---
  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    this.tickCount++;

    // Handle fading transitions
    if (this.isTransitioning) {
      this.fadeAlpha += 0.08;
      if (this.fadeAlpha >= 1) {
        if (this.pendingTransition) {
          this.pendingTransition();
          this.pendingTransition = null;
        }
        this.fadeAlpha = 1;
        this.isTransitioning = false;
      }
      return;
    } else if (this.fadeAlpha > 0) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - 0.08);
    }

    // Typewriter effect in active dialogue
    if (this.activeDialogue) {
      const line = this.activeDialogue.lines[this.activeDialogue.lineIdx];
      if (this.activeDialogue.charIdx < line.length) {
        this.dialogueTimer++;
        if (this.dialogueTimer % 2 === 0) {
          this.activeDialogue.charIdx++;
          this.activeDialogue.displayedText = line.substring(0, this.activeDialogue.charIdx);
        }
      }
      return; // Freeze movement while talking
    }

    // Freeze movement while shop or menu is open
    if (this.activeShop || this.activeInn) return;

    // Handle Movement
    if (this.isMoving) {
      this.moveProgress += this.moveSpeed;
      if (this.moveProgress >= 1) {
        const p = this.getPlayer();
        p.x = this.toPos.x;
        p.y = this.toPos.y;
        this.isMoving = false;
        this.moveProgress = 0;

        // Check if stepped on a landmark / exit
        this.checkStepTriggers();
      }
    } else {
      this.handleMovementInput();
    }
  }

  handleMovementInput() {
    let dir = null;

    const isUp = this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['w'] || this.keys['W'] || this.touchDir === 'up' || this.queuedMove === 'up';
    const isDown = this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['s'] || this.keys['S'] || this.touchDir === 'down' || this.queuedMove === 'down';
    const isLeft = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a'] || this.keys['A'] || this.touchDir === 'left' || this.queuedMove === 'left';
    const isRight = this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d'] || this.keys['D'] || this.touchDir === 'right' || this.queuedMove === 'right';

    if (isUp) dir = 'up';
    else if (isDown) dir = 'down';
    else if (isLeft) dir = 'left';
    else if (isRight) dir = 'right';

    this.queuedMove = null;

    if (dir) {
      let dx = 0;
      let dy = 0;
      if (dir === 'up') dy = -1;
      else if (dir === 'down') dy = 1;
      else if (dir === 'left') dx = -1;
      else if (dir === 'right') dx = 1;

      const p = this.getPlayer();
      p.dir = dir;
      p.animFrame = (p.animFrame + 1) % 4;

      const targetX = p.x + dx;
      const targetY = p.y + dy;

      if (this.canWalkTo(targetX, targetY)) {
        this.isMoving = true;
        this.moveProgress = 0;
        this.fromPos = { x: p.x, y: p.y };
        this.toPos = { x: targetX, y: targetY };
      }
    }
  }

  canWalkTo(x, y) {
    if (this.mode === 'overworld') {
      const mapW = _getW();
      const mapH = _getH();
      if (x < 0 || x >= mapW || y < 0 || y >= mapH) return false;
      const raw = _getRaw();
      const row = raw[y];
      if (!row) return false;
      const tile = row[x];
      // Non-walkable: Mountains (#), Water (~ unless bridge +)
      if (tile === '#' || tile === '~') return false;
      return true;
    } else if (this.mode === 'town' && this.currentArea) {
      const area = this.currentArea;
      if (x < 0 || x >= area.width || y < 0 || y >= area.height) return false;

      // Outer boundary walls (except entrance at bottom or gates)
      if (x === 0 || x === area.width - 1 || y === 0) return false;
      if (y === area.height - 1 && (x < Math.floor(area.width / 2) - 1 || x > Math.floor(area.width / 2) + 1)) return false;

      // Check collision with NPCs
      const hasNpc = area.npcs.some(n => n.position.x === x && n.position.y === y);
      if (hasNpc) return false;

      // Check collision with Facility counters (inn, shop counters)
      const hasFac = area.facilities.some(f => {
        if (f.type === 'checkpoint') {
          // If checkpoint is not cleared, blocks passage!
          const cleared = this.game.rpgState.clearedCheckpoints.includes(f.id);
          return f.position.x === x && f.position.y === y && !cleared;
        }
        return f.position.x === x && f.position.y === y;
      });
      if (hasFac) return false;

      return true;
    }
    return false;
  }

  checkStepTriggers() {
    const p = this.getPlayer();

    if (this.mode === 'overworld') {
      // Check if stepped into a landmark
      const landmark = _getLandmarks().find(l => l.x === p.x && l.y === p.y);
      if (landmark) {
        this.transitionToTown(landmark.areaId);
      }
    } else if (this.mode === 'town' && this.currentArea) {
      // Check if stepped on town exit (bottom middle)
      if (p.y >= this.currentArea.height - 1) {
        this.transitionToOverworld();
      }
    }
  }

  // --- RENDERING & MAP OPTIMIZATION ---
  initParticles() {
    this.particles = [];
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: Math.random() * (this.canvas ? this.canvas.width : 640),
        y: Math.random() * (this.canvas ? this.canvas.height : 480),
        vx: (Math.random() - 0.5) * 0.4 + 0.15,
        vy: -Math.random() * 0.4 - 0.15,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        color: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399'][Math.floor(Math.random() * 5)]
      });
    }
  }

  renderAtmosphericParticles(ctx) {
    if (!this.particles) this.initParticles();
    ctx.save();
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.x < 0) p.x = this.canvas.width;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }

  renderMiniRadar(ctx) {
    if (this.mode !== 'overworld') return;
    const radarW = 84;
    const radarH = 56;
    const radarX = this.canvas.width - radarW - 10;
    const radarY = 10;
    const mapW = _getW();
    const mapH = _getH();

    ctx.save();
    // Dark frame with cyan sci-fi border
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(radarX, radarY, radarW, radarH);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(radarX, radarY, radarW, radarH);

    // Dynamic scanning sweep line
    const scanY = radarY + ((this.tickCount * 0.7) % radarH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.moveTo(radarX, scanY);
    ctx.lineTo(radarX + radarW, scanY);
    ctx.stroke();

    const scaleX = radarW / mapW;
    const scaleY = radarH / mapH;

    // Draw landmarks as dots
    _getLandmarks().forEach(l => {
      const rx = radarX + l.x * scaleX;
      const ry = radarY + l.y * scaleY;
      ctx.fillStyle = l.color || '#fbbf24';
      ctx.fillRect(rx - 1, ry - 1, 2, 2);
    });

    // Draw Player blinking position blip
    const p = this.getPlayer();
    const px = radarX + p.x * scaleX;
    const py = radarY + p.y * scaleY;
    if (Math.sin(this.tickCount * 0.15) > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    // Mini Radar Label
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('RADAR', radarX + 4, radarY + 8);

    ctx.restore();
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera offset to keep player centered
    const p = this.getPlayer();
    let renderX = p.x;
    let renderY = p.y;
    if (this.isMoving) {
      renderX = this.fromPos.x + (this.toPos.x - this.fromPos.x) * this.moveProgress;
      renderY = this.fromPos.y + (this.toPos.y - this.fromPos.y) * this.moveProgress;
    }

    const camX = Math.round(this.canvas.width / 2 - renderX * this.tileSize - this.tileSize / 2);
    const camY = Math.round(this.canvas.height / 2 - renderY * this.tileSize - this.tileSize / 2);

    ctx.save();
    ctx.translate(camX, camY);

    if (this.mode === 'overworld') {
      this.renderOverworld(ctx, camX, camY);
    } else {
      this.renderTown(ctx, camX, camY);
    }

    // Render Player
    this.renderPlayerSprite(ctx, renderX * this.tileSize, renderY * this.tileSize, p.dir, p.animFrame);

    ctx.restore();

    // Environmental Effects: Air particles, sparks & radar
    this.renderAtmosphericParticles(ctx);
    this.renderMiniRadar(ctx);

    // Render Overlay HUD, Dialogue Window & Retro Screen Frame
    this.renderRetroDialogueBox(ctx);

    // Screen Fade Wipe Effect
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  renderOverworld(ctx, camX, camY) {
    const mapW = _getW();
    const mapH = _getH();
    const raw = _getRaw();

    // VIEWPORT CULLING: Only render visible tiles inside camera bounds
    const minTileX = Math.max(0, Math.floor((-camX) / this.tileSize) - 1);
    const maxTileX = Math.min(mapW - 1, Math.ceil((-camX + this.canvas.width) / this.tileSize) + 1);
    const minTileY = Math.max(0, Math.floor((-camY) / this.tileSize) - 1);
    const maxTileY = Math.min(mapH - 1, Math.ceil((-camY + this.canvas.height) / this.tileSize) + 1);

    for (let y = minTileY; y <= maxTileY; y++) {
      const row = raw[y];
      if (!row) continue;
      for (let x = minTileX; x <= maxTileX; x++) {
        const char = row[x];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        // Draw Base Terrain
        if (char === '~') {
          // Water (animated wave highlights)
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#38bdf8';
          const waveShift = (this.tickCount * 0.05 + x) % 3;
          ctx.fillRect(px + 4 + waveShift * 4, py + 8, 8, 2);
          ctx.fillRect(px + 12 - waveShift * 3, py + 20, 10, 2);
        } else if (char === '#') {
          // Mountain peaks
          ctx.fillStyle = '#334155';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(px + this.tileSize / 2, py + 4);
          ctx.lineTo(px + 4, py + this.tileSize - 4);
          ctx.lineTo(px + this.tileSize - 4, py + this.tileSize - 4);
          ctx.fill();
        } else if (char === '^' || char === '"') {
          // Forest
          ctx.fillStyle = '#14532d';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.arc(px + 10, py + 14, 6, 0, Math.PI * 2);
          ctx.arc(px + 22, py + 14, 6, 0, Math.PI * 2);
          ctx.arc(px + 16, py + 8, 7, 0, Math.PI * 2);
          ctx.fill();
        } else if (char === '=') {
          // Paved Highway / Road
          ctx.fillStyle = '#475569';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(px + this.tileSize / 2 - 1, py + 4, 2, this.tileSize - 8);
        } else if (char === '+') {
          // Bridge over water
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px + 4, py, this.tileSize - 8, this.tileSize);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(px + 6, py + 6, this.tileSize - 12, 3);
          ctx.fillRect(px + 6, py + 20, this.tileSize - 12, 3);
        } else {
          // Plain / Grassland
          ctx.fillStyle = '#15803d';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px + 6, py + 8, 2, 4);
          ctx.fillRect(px + 20, py + 18, 2, 4);
        }
      }
    }

    // Render Overworld Town Landmarks within visible bounds only
    _getLandmarks().forEach(l => {
      if (l.x < minTileX - 1 || l.x > maxTileX + 1 || l.y < minTileY - 1 || l.y > maxTileY + 1) return;
      const lx = l.x * this.tileSize;
      const ly = l.y * this.tileSize;

        // Pulsing Neon Beacon Glow
        const pulse = 0.5 + 0.5 * Math.sin(this.tickCount * 0.08 + l.x + l.y);
        ctx.save();
        ctx.fillStyle = l.color || '#fbbf24';
        ctx.globalAlpha = 0.25 * pulse;
        ctx.beginPath();
        ctx.arc(lx + this.tileSize / 2, ly + this.tileSize / 2, this.tileSize * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Fortress / Town Castle Base
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx + 2, ly + 2, this.tileSize - 4, this.tileSize - 4);
        ctx.fillStyle = l.color || '#fbbf24';
        ctx.fillRect(lx + 4, ly + 4, this.tileSize - 8, this.tileSize - 8);

        // Icon / Banner
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.symbol, lx + this.tileSize / 2, ly + this.tileSize / 2);

        // Name Label banner above town
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(lx - 14, ly - 13, 60, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(l.name.substring(0, 5), lx + this.tileSize / 2, ly - 7);
      });
  }

  renderTown(ctx, camX, camY) {
    if (!this.currentArea) return;
    const area = this.currentArea;

    // Determine Town Tier based on municipality population
    const regName = area.regionName || area.name;
    let pop = 160000;
    if (this.game && this.game.regions) {
      const matchR = this.game.regions.find(r => r.name.includes(regName) || regName.includes(r.name));
      if (matchR) pop = matchR.population;
    }
    // Tier 1: pop < 80,000 (Small outpost/frontier)
    // Tier 2: 80,000 <= pop < 250,000 (Medium fortress town)
    // Tier 3: pop >= 250,000 (Cyber neon metropolis: Shinjuku, Setagaya, Ota, Nerima etc.)
    const tier = pop >= 250000 ? 3 : (pop >= 80000 ? 2 : 1);

    // VIEWPORT CULLING for Town
    const minTileX = Math.max(0, Math.floor((-camX) / this.tileSize) - 1);
    const maxTileX = Math.min(area.width - 1, Math.ceil((-camX + this.canvas.width) / this.tileSize) + 1);
    const minTileY = Math.max(0, Math.floor((-camY) / this.tileSize) - 1);
    const maxTileY = Math.min(area.height - 1, Math.ceil((-camY + this.canvas.height) / this.tileSize) + 1);

    const midX = Math.floor(area.width / 2);
    const midY = Math.floor(area.height / 2);

    // 1. Draw Floor, Paved Boulevards & City Walls
    for (let y = minTileY; y <= maxTileY; y++) {
      for (let x = minTileX; x <= maxTileX; x++) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        const isWall = (x === 0 || x === area.width - 1 || y === 0 || (y === area.height - 1 && (x < midX - 1 || x > midX + 1)));

        if (isWall) {
          // Perimeter Fortress Wall
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
          ctx.strokeStyle = tier === 3 ? '#0284c7' : '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 3, py + 3, this.tileSize - 6, this.tileSize - 6);

          // Neon strip along top of wall in metropolis
          if (tier === 3 && y === 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(px, py + this.tileSize - 2, this.tileSize, 2);
          }
        } else {
          // Main Boulevard (Crossroad) & Central Plaza
          const isMainStreetX = (x >= midX - 1 && x <= midX + 1);
          const isMainStreetY = (y >= midY - 1 && y <= midY + 1);
          const isPlaza = (Math.abs(x - midX) <= 3 && Math.abs(y - midY) <= 3);

          if (isPlaza) {
            // Central Plaza: Paved Polished Stone
            ctx.fillStyle = tier === 3 ? '#1e293b' : (tier === 2 ? '#334155' : '#3f3f46');
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
            ctx.strokeStyle = tier === 3 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)';
            ctx.strokeRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);

            // Plaza Center Ornament
            if (x === midX && y === midY) {
              ctx.fillStyle = tier === 3 ? '#0284c7' : '#d97706';
              ctx.beginPath();
              ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, 8, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (isMainStreetX || isMainStreetY) {
            // Paved Stone Road
            ctx.fillStyle = tier === 3 ? '#0f172a' : '#1e293b';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);

            // Cyberpunk road dividing line
            if (tier === 3 && (x === midX || y === midY)) {
              ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
              if (x === midX) ctx.fillRect(px + this.tileSize / 2 - 1, py, 2, this.tileSize);
              if (y === midY) ctx.fillRect(px, py + this.tileSize / 2 - 1, this.tileSize, 2);
            }
          } else {
            // Side streets & building grounds
            ctx.fillStyle = tier === 1 ? '#1c1917' : '#0b0f19';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);
          }
        }
      }
    }

    // 2. Render Street Props & Objects (Scales with Town Tier)
    this.renderTownProps(ctx, area, tier, minTileX, maxTileX, minTileY, maxTileY);

    // 3. Exit gate highlight at bottom
    const exitX = midX * this.tileSize;
    const exitY = (area.height - 1) * this.tileSize;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(exitX - this.tileSize, exitY + 8, this.tileSize * 3, 16);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#fcd34d';
    ctx.textAlign = 'center';
    ctx.fillText('▼ 出口 (広域マップへ) ▼', exitX + this.tileSize / 2, exitY + 20);

    // 4. Render Facilities with Detailed Buildings (Roof, Walls, Windows & Counters)
    (area.facilities || []).forEach(fac => {
      this.renderDetailedFacility(ctx, fac, tier);
    });

    // 5. Render Core NPCs
    (area.npcs || []).forEach(npc => {
      const nx = npc.position.x * this.tileSize;
      const ny = npc.position.y * this.tileSize;

      // Draw NPC Sprite
      this.renderNpcSprite(ctx, nx, ny, npc.sprite);

      // Floating NPC Name banner
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(nx - 12, ny - 11, 56, 11);
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name.substring(0, 5), nx + this.tileSize / 2, ny - 5);
    });

    // 6. Render Dynamic Wandering Citizens (Populated according to Tier)
    this.renderDynamicCitizens(ctx, area, tier);
  }

  // Draw Props & Street furniture: Streetlamps with lighting, Crates, Vending Machines, Campfire
  renderTownProps(ctx, area, tier, minX, maxX, minY, maxY) {
    const lampPositions = [
      { x: 9, y: 7 }, { x: 15, y: 7 },
      { x: 9, y: 13 }, { x: 15, y: 13 }
    ];

    // Streetlamps with glowing light cones
    lampPositions.forEach(lp => {
      if (lp.x < minX || lp.x > maxX || lp.y < minY || lp.y > maxY) return;
      const lx = lp.x * this.tileSize;
      const ly = lp.y * this.tileSize;

      // Light radial glow on ground
      ctx.save();
      const glowGrad = ctx.createRadialGradient(lx + 16, ly + 16, 2, lx + 16, ly + 16, 36);
      glowGrad.addColorStop(0, tier === 3 ? 'rgba(56, 189, 248, 0.28)' : 'rgba(251, 191, 36, 0.25)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(lx + 16, ly + 16, 36, 0, Math.PI * 2);
      ctx.fill();

      // Lamp Post
      ctx.fillStyle = '#334155';
      ctx.fillRect(lx + 14, ly + 10, 4, 18);
      // Lamp Head
      ctx.fillStyle = tier === 3 ? '#38bdf8' : '#fbbf24';
      ctx.fillRect(lx + 12, ly + 6, 8, 6);
      ctx.restore();
    });

    // Tier 1: Campfire in Plaza center
    if (tier === 1) {
      const cx = Math.floor(area.width / 2) * this.tileSize;
      const cy = Math.floor(area.height / 2) * this.tileSize;
      // Logs
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 8, cy + 20, 16, 5);
      // Flickering Flame
      const flameH = 8 + Math.sin(this.tickCount * 0.2) * 4;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(cx + 16, cy + 16, flameH / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cx + 16, cy + 18, (flameH / 2) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tier 2 & 3: Crates, Supply Barrels & Cyber Vending Machine
    if (tier >= 2) {
      // Supply Crates at (4, 10)
      const cx = 4 * this.tileSize;
      const cy = 10 * this.tileSize;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx + 4, cy + 8, 20, 20);
      ctx.strokeStyle = '#b45309';
      ctx.strokeRect(cx + 5, cy + 9, 18, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 10, cy + 2, 16, 12);

      // Cyber Vending Machine at (20, 10)
      const vx = 20 * this.tileSize;
      const vy = 10 * this.tileSize;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(vx + 6, vy + 4, 20, 24);
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(vx + 6, vy + 4, 20, 24);
      // Glowing Dispenser Screen
      ctx.fillStyle = (this.tickCount % 40 < 20) ? '#38bdf8' : '#ec4899';
      ctx.fillRect(vx + 9, vy + 8, 14, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(vx + 10, vy + 20, 12, 5);
    }
  }

  // Draw Detailed Facility Building (Inn / Shop / Checkpoint)
  renderDetailedFacility(ctx, fac, tier) {
    const fx = fac.position.x * this.tileSize;
    const fy = fac.position.y * this.tileSize;

    ctx.save();

    // 1. Building Backdrop & Walls (1 tile above the counter)
    const wallY = fy - this.tileSize;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(fx - 4, wallY, this.tileSize + 8, this.tileSize);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(fx - 4, wallY, this.tileSize + 8, this.tileSize);

    // 2. Building Roof / Awning
    let roofColor = '#3b82f6';
    let icon = '🏬';
    let labelColor = '#fbbf24';

    if (fac.type === 'inn') {
      roofColor = tier === 3 ? '#06b6d4' : '#2563eb';
      icon = '💤';
      labelColor = '#38bdf8';
    } else if (fac.type === 'shop') {
      roofColor = tier === 3 ? '#f43f5e' : '#d97706';
      icon = '🛒';
      labelColor = '#fbbf24';
    } else if (fac.type === 'checkpoint') {
      roofColor = '#475569';
      icon = '🛡️';
      labelColor = '#e2e8f0';
    }

    // Striped Awning
    ctx.fillStyle = roofColor;
    ctx.fillRect(fx - 6, wallY - 4, this.tileSize + 12, 8);
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 4; s++) {
      ctx.fillRect(fx - 4 + s * 9, wallY - 4, 4, 8);
    }

    // Window with Warm Interior Light inside building
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(fx + 6, wallY + 6, 8, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(fx + 9, wallY + 6, 2, 8);
    ctx.fillRect(fx + 6, wallY + 9, 8, 2);

    // Merchant / Innkeeper standing behind counter
    ctx.fillStyle = '#fed7aa'; // Skin
    ctx.fillRect(fx + 11, wallY + 12, 10, 8);
    ctx.fillStyle = roofColor;
    ctx.fillRect(fx + 10, wallY + 18, 12, 8);

    // 3. Wooden / Cyber Shop Counter in front
    ctx.fillStyle = tier === 3 ? '#0f172a' : '#78350f';
    ctx.fillRect(fx, fy, this.tileSize, this.tileSize);
    ctx.strokeStyle = tier === 3 ? '#38bdf8' : '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx + 1, fy + 1, this.tileSize - 2, this.tileSize - 2);

    // Counter top showcase / items
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(fx + 4, fy + 4, this.tileSize - 8, 8);

    // Facility Type Icon floating on counter
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, fx + this.tileSize / 2, fy + this.tileSize / 2 + 4);

    // Floating Facility Name Banner
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(fx - 16, wallY - 14, 64, 11);
    ctx.strokeStyle = labelColor;
    ctx.strokeRect(fx - 16, wallY - 14, 64, 11);
    ctx.fillStyle = labelColor;
    ctx.fillText(fac.name.substring(0, 6), fx + this.tileSize / 2, wallY - 8);

    ctx.restore();
  }

  // Draw dynamically generated wandering citizens based on population tier
  renderDynamicCitizens(ctx, area, tier) {
    const citizenCount = tier === 3 ? 5 : (tier === 2 ? 3 : 1);
    const wanderSpots = [
      { x: 10, y: 11, sprite: 'npc_citizen_1', name: "市民" },
      { x: 14, y: 11, sprite: 'npc_citizen_2', name: "商人" },
      { x: 11, y: 8, sprite: 'npc_citizen_3', name: "エンジニア" },
      { x: 13, y: 8, sprite: 'npc_citizen_4', name: "武装警備員" },
      { x: 8, y: 14, sprite: 'npc_citizen_5', name: "旅人" }
    ];

    for (let i = 0; i < citizenCount; i++) {
      const spot = wanderSpots[i];
      if (!spot) break;
      const sway = Math.sin(this.tickCount * 0.05 + i) * 2;
      const px = spot.x * this.tileSize;
      const py = spot.y * this.tileSize + sway;

      // Draw Citizen Sprite
      ctx.save();
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(px + 16, py + 28, 5, 0, Math.PI * 2);
      ctx.fill();

      // Body (Different color per citizen)
      const colors = ['#64748b', '#059669', '#d97706', '#dc2626', '#7c3aed'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(px + 10, py + 14, 12, 12);
      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 11, py + 6, 10, 8);
      // Hair
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 10, py + 4, 12, 4);

      // Label
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(px + 4, py - 4, 24, 9);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(spot.name, px + 16, py + 1);
      ctx.restore();
    }
  }

  // Draw 2D Retro Player Sprite (DQ Hero with sword and cloak)
  renderPlayerSprite(ctx, px, py, dir, frame) {
    ctx.save();
    // Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(px + this.tileSize / 2, py + this.tileSize - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2563eb'; // Blue tunic
    ctx.fillRect(px + 8, py + 12, 16, 14);

    // Head
    ctx.fillStyle = '#fed7aa'; // Skin
    ctx.fillRect(px + 10, py + 4, 12, 10);

    // Hair / Helmet
    ctx.fillStyle = '#7c2d12'; // Brown hair
    ctx.fillRect(px + 8, py + 2, 16, 6);

    // Eyes / Details based on direction
    ctx.fillStyle = '#0f172a';
    if (dir === 'down') {
      ctx.fillRect(px + 12, py + 8, 2, 3);
      ctx.fillRect(px + 18, py + 8, 2, 3);
    } else if (dir === 'left') {
      ctx.fillRect(px + 10, py + 8, 2, 3);
    } else if (dir === 'right') {
      ctx.fillRect(px + 20, py + 8, 2, 3);
    }

    // Walking animation feet toggle
    ctx.fillStyle = '#b45309';
    if (frame % 2 === 0) {
      ctx.fillRect(px + 9, py + 26, 5, 5);
      ctx.fillRect(px + 18, py + 24, 5, 5);
    } else {
      ctx.fillRect(px + 9, py + 24, 5, 5);
      ctx.fillRect(px + 18, py + 26, 5, 5);
    }

    ctx.restore();
  }

  // Draw NPC Sprite
  renderNpcSprite(ctx, nx, ny, spriteType) {
    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(nx + this.tileSize / 2, ny + this.tileSize - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    let tunicColor = '#dc2626';
    if (spriteType === 'npc_engineer') tunicColor = '#d97706';
    else if (spriteType === 'npc_hacker') tunicColor = '#9333ea';
    else if (spriteType === 'npc_guard') tunicColor = '#475569';

    // Body
    ctx.fillStyle = tunicColor;
    ctx.fillRect(nx + 8, ny + 12, 16, 14);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(nx + 10, ny + 4, 12, 10);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(nx + 12, ny + 8, 2, 3);
    ctx.fillRect(nx + 18, ny + 8, 2, 3);

    // Feet
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(nx + 9, ny + 26, 5, 4);
    ctx.fillRect(nx + 18, ny + 26, 5, 4);

    ctx.restore();
  }

  // Classic DQ-Style Dialogue Window (Double white border on deep dark background)
  renderRetroDialogueBox(ctx) {
    if (!this.activeDialogue) return;

    const dw = this.canvas.width - 40;
    const dh = 110;
    const dx = 20;
    const dy = this.canvas.height - dh - 20;

    // Outer Black Box
    ctx.fillStyle = '#000000';
    ctx.fillRect(dx, dy, dw, dh);

    // Double White DQ Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(dx + 2, dy + 2, dw - 4, dh - 4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx + 6, dy + 6, dw - 12, dh - 12);

    // Speaker Name & Title Tab
    ctx.fillStyle = '#000000';
    ctx.fillRect(dx + 16, dy - 12, 240, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 16, dy - 12, 240, 20);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText(`【${this.activeDialogue.speaker}】`, dx + 22, dy + 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`${this.activeDialogue.title}`, dx + 130, dy + 2);

    // Text content
    ctx.font = '14px "Hiragino Kaku Gothic ProN", "Meiryo", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    const text = this.activeDialogue.displayedText;
    // Simple wrap
    const maxChars = 34;
    const line1 = text.substring(0, maxChars);
    const line2 = text.substring(maxChars);

    ctx.fillText(line1, dx + 20, dy + 34);
    if (line2) {
      ctx.fillText(line2, dx + 20, dy + 62);
    }

    // Blinking Prompt Cursor (▼)
    if (Math.floor(this.tickCount / 20) % 2 === 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('▼', dx + dw - 28, dy + dh - 14);
    }
  }

  // Update DOM HUD headers
  updateHUD() {
    const locElem = document.getElementById('rpg-hud-location');
    const atmoElem = document.getElementById('rpg-hud-atmosphere');
    const curElem = document.getElementById('rpg-hud-currencies');

    if (locElem) {
      if (this.mode === 'overworld') {
        locElem.innerHTML = '🗾 東京広域フィールドマップ <span style="font-size:11px; color:#94a3b8; font-weight:normal;">[全72×48グリッド 53自治体探索]</span>';
      } else {
        const area = this.currentArea;
        const regName = area?.regionName || area?.name || '';
        let pop = 160000;
        if (this.game && this.game.regions) {
          const matchR = this.game.regions.find(r => r.name.includes(regName) || regName.includes(r.name));
          if (matchR) pop = matchR.population;
        }
        const tier = pop >= 250000 ? 3 : (pop >= 80000 ? 2 : 1);
        const tierLabels = {
          1: '⭐ 辺境前線基地',
          2: '⭐⭐ 地方中核要塞',
          3: '⭐⭐⭐ 超巨大ネオン要塞都市'
        };
        const tierColor = tier === 3 ? '#38bdf8' : (tier === 2 ? '#fbbf24' : '#a3e635');
        const tierBadge = `<span style="font-size:11px; padding:2px 8px; border-radius:10px; background:rgba(0,0,0,0.4); color:${tierColor}; margin-left:8px; border:1px solid ${tierColor};">${tierLabels[tier]} (人口: ${(pop/10000).toFixed(1)}万人)</span>`;
        locElem.innerHTML = `🏯 ${area?.name || '拠点'} ${tierBadge}`;
      }
    }
    if (atmoElem) {
      atmoElem.textContent = this.mode === 'overworld' 
        ? '大東京の荒野、首都高の残骸、そして点在する53の独立城塞都市群。' 
        : (this.currentArea?.atmosphere || '');
    }

    if (curElem) {
      curElem.innerHTML = '';
      const currencies = _getCurrencies();
      Object.keys(currencies).slice(0, 4).forEach(cKey => {
        const cInfo = currencies[cKey];
        const val = this.game.playerCurrencies[cKey] || 0;
        const span = document.createElement('span');
        span.style.color = cInfo.color;
        span.style.marginRight = '12px';
        span.style.fontSize = '12px';
        span.innerHTML = `${cInfo.symbol} <b>${val.toLocaleString()}</b> <span style="font-size:10px; color:#cbd5e1;">${cInfo.name}</span>`;
        curElem.appendChild(span);
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.TokyoRpgEngine = TokyoRpgEngine;
}
if (typeof module !== 'undefined') {
  module.exports = TokyoRpgEngine;
}

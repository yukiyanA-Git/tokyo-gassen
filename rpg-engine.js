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

      // 2.5 Did player click Landmark Building?
      if (this.currentArea.landmarkBuilding) {
        const lm = this.currentArea.landmarkBuilding;
        if (Math.hypot(lm.position.x - targetTileX, lm.position.y - targetTileY) <= 1.8) {
          this.walkToward(lm.position.x, lm.position.y);
          if (Math.hypot(lm.position.x - p.x, lm.position.y - p.y) <= 3.2) {
            this.interactInFront();
          }
          return;
        }
      }

      // 2.6 Did player click Specialty Factory?
      if (this.currentArea.specialtyFactory) {
        const sFac = this.currentArea.specialtyFactory;
        if (Math.hypot(sFac.position.x - targetTileX, sFac.position.y - targetTileY) <= 1.8) {
          this.walkToward(sFac.position.x, sFac.position.y);
          if (Math.hypot(sFac.position.x - p.x, sFac.position.y - p.y) <= 3.2) {
            this.interactInFront();
          }
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

      // 2.5 Check for Distinctive Landmark Building (North Center x: 10..14, y: 3..6)
      if (this.currentArea.landmarkBuilding) {
        const lm = this.currentArea.landmarkBuilding;
        if (Math.hypot(lm.position.x - p.x, lm.position.y - p.y) <= 3.2) {
          this.startNpcDialogue({
            name: lm.name,
            title: "【街の象徴・名所要塞】",
            dialogues: [
              lm.desc || `ここは【${this.currentArea.name}】を象徴する歴史的名所要塞だ。`,
              `自治体の人口が増大し発展するにつれ、この名所も壮大な威容へと段階的にアップグレードしていくぞ！`
            ]
          });
          return;
        }
      }

      // 2.6 Check for Specialty Factory / Workshop (West Side x: 4, y: 11)
      if (this.currentArea.specialtyFactory) {
        const sFac = this.currentArea.specialtyFactory;
        if (Math.hypot(sFac.position.x - p.x, sFac.position.y - p.y) <= 3.2) {
          this.startNpcDialogue({
            name: sFac.craftsman || "工房技師長",
            title: `【特産品工房】${sFac.name}`,
            dialogues: [
              `ようこそ！ここは当自治体が誇る名物特産品【${sFac.specialtyName}】を生産する工房だ！`,
              sFac.desc || "大局画面で人口と民意を高めてくれれば、毎月の物資生産量も飛躍的に増加するぜ！"
            ]
          });
          return;
        }
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

  // Get Town Tier (1 - 7) based on population
  getTownTier(pop) {
    if (pop < 40000) return 1;       // Lv1: 開拓前線キャンプ
    if (pop < 70000) return 2;       // Lv2: 復興集落・前哨砦
    if (pop < 120000) return 3;      // Lv3: 小規模要塞宿場町
    if (pop < 180000) return 4;      // Lv4: 地方中核城塞都市
    if (pop < 260000) return 5;      // Lv5: 繁栄大都市
    if (pop < 380000) return 6;      // Lv6: 超高度メガロポリス
    return 7;                        // Lv7: 至高首都要塞
  }

  // Helper: Specialty & Landmark archetype for any Tokyo municipality
  getSpecialtyForMunicipality(name) {
    if (name.includes('練馬')) {
      return {
        landmark: { type: 'studio', name: '練馬アニメーション制作大本営', symbol: '🎬', color: '#ec4899', desc: '日本のアニメ文化発祥地。名作を生み出し続ける巨大作画スタジオ兼要塞。' },
        factory: { name: '練馬バイオ農産プラント', specialtyName: '高純度バイオ練馬大根', specialtyItem: 'food_ration', craftsman: '所長・ネリマ', desc: 'バイオ技術で改良された伝統の練馬大根。兵のスタミナを驚異的に高める。' }
      };
    }
    if (name.includes('世田谷')) {
      return {
        landmark: { type: 'mansion', name: '世田谷閑静邸宅自衛司令塔', symbol: '🏡', color: '#10b981', desc: '高級住宅街の重厚な邸宅を改装した、世田谷区自衛軍の中枢司令部。' },
        factory: { name: '世田谷特級保存食工房', specialtyName: '世田谷長期備蓄レーション', specialtyItem: 'food_ration', craftsman: '料理長・セタガヤ', desc: '厳選された食材で作られた高級レーション。部隊の士気を大きく底上げする。' }
      };
    }
    if (name.includes('大田') || name.includes('蒲田')) {
      return {
        landmark: { type: 'airport', name: '羽田航空管制塔・巨大ハンガー', symbol: '✈️', color: '#0284c7', desc: '東京湾を望む国際航空拠点。防衛用ドローンや輸送機の離着陸を統制する。' },
        factory: { name: '蒲田精密機械削り出し工場', specialtyName: '超精密チタン削り出しギア', specialtyItem: 'junk_parts', craftsman: '親方・カマタ', desc: '職人の手でミクロン単位の精度に削り出された歯車。あらゆる兵器の精度を高める。' }
      };
    }
    if (name.includes('墨田')) {
      return {
        landmark: { type: 'tower', name: 'スカイツリー電波塔要塞', symbol: '📡', color: '#38bdf8', desc: '地上634mから全東京の電波とレーザー照射を司る天空の観測塔。' },
        factory: { name: '墨田金属加工・試作町工場', specialtyName: '超電導アンテナフレーム', specialtyItem: 'junk_parts', craftsman: '技師長・スミダ', desc: '軽量かつ超頑強な特殊合金フレーム。索敵装備の基幹部品。' }
      };
    }
    if (name.includes('台東') || name.includes('浅草') || name.includes('上野')) {
      return {
        landmark: { type: 'shrine', name: '浅草寺・雷門大提灯・五重塔', symbol: '⛩️', color: '#ef4444', desc: '大提灯が迎える江戸の総鎮守。不屈の祈りが集まる聖域要塞。' },
        factory: { name: '浅草伝統工芸・職人長屋', specialtyName: '浅草開運守護札', specialtyItem: 'faith_talisman', craftsman: '長屋頭・アサクサ', desc: '名僧の祈祷が込められた伝統の信仰符。部隊の災厄を払う。' }
      };
    }
    if (name.includes('足立') || name.includes('千住')) {
      return {
        landmark: { type: 'bridge', name: '千住大橋防衛宿場・日光街道関所', symbol: '🌉', color: '#f59e0b', desc: '日光街道の要衝。荒川と隅田川を扼する堅牢な渡し場防衛陣地。' },
        factory: { name: '足立鋼鉄リサイクル重工', specialtyName: '再生防弾装甲プレート', specialtyItem: 'item_repair_kit', craftsman: '溶接長・アダチ', desc: '廃鉄スクラップから精錬された強靭な装甲板。車両や拠点を守る。' }
      };
    }
    if (name.includes('港') || name.includes('六本木')) {
      return {
        landmark: { type: 'tower', name: '東京タワー・六本木ヒルズ砦', symbol: '🗼', color: '#ef4444', desc: '夜空に赤く輝く東京の象徴。港湾コンツェルンの金融と電波の拠点。' },
        factory: { name: '港湾超高密度バッテリープラント', specialtyName: '次世代リチウム電池セル', specialtyItem: 'battery_cell', craftsman: '技官・ミナト', desc: '湾岸のメガソーラーから生み出される高密度エネルギー。' }
      };
    }
    if (name.includes('武蔵野') || name.includes('吉祥寺')) {
      return {
        landmark: { type: 'park', name: '井の頭公園大池・吉祥寺歓楽街', symbol: '🌳', color: '#10b981', desc: '豊かな緑と湧水を湛える憩いの地。ハモニカ横丁の活気が人を引き寄せる。' },
        factory: { name: '武蔵野文化焙煎・情報集積所', specialtyName: '吉祥寺ハーブ珈琲', specialtyItem: 'item_neon_whiskey', craftsman: 'マスター・ムサシノ', desc: '芳醇な香りの特製珈琲。将兵の疲労を一瞬で吹き飛ばす。' }
      };
    }
    if (name.includes('町田')) {
      return {
        landmark: { type: 'depot', name: '町田街道南東京物流ハブ', symbol: '📦', color: '#f97316', desc: '神奈川との境界に位置する一大補給集積所。物資の往来が絶えない。' },
        factory: { name: '町田大型補給コンテナ基地', specialtyName: '緊急物資サプライコンテナ', specialtyItem: 'food_ration', craftsman: '配給官・マチダ', desc: '衣食住の全てが詰まった高規格コンテナ。前線への兵站の要。' }
      };
    }
    if (name.includes('立川')) {
      return {
        landmark: { type: 'airport', name: '立川広域防災基地・航空滑走路', symbol: '🚁', color: '#0ea5e9', desc: '西東京の防空と救援を担う滑走路。ドローン部隊の整備中枢。' },
        factory: { name: '立川ドローン組立プラント', specialtyName: '自律索敵ドローンコア', specialtyItem: 'item_emp_grenade', craftsman: '技師・タチカワ', desc: '最新鋭のAIジャイロを搭載した偵察ドローンの心臓部。' }
      };
    }
    if (name.includes('八王子')) {
      return {
        landmark: { type: 'shrine', name: '高尾山大天狗神社・山岳社殿', symbol: '👺', color: '#10b981', desc: '天狗伝説の宿る霊峰。山岳戦の守護神が祀られる古社。' },
        factory: { name: '多摩絹織物・防刃繊維機織り工房', specialtyName: '高圧山岳スタンロッド', specialtyItem: 'wpn_stun_rod', craftsman: '機織り長・オハナ', desc: '伝統の桑都の絹織物技術を応用した防弾・防刃マントと武具。' }
      };
    }
    if (name.includes('奥多摩') || name.includes('青梅') || name.includes('あきる野') || name.includes('檜原')) {
      return {
        landmark: { type: 'dam_water', name: `${name}水力発電巨大ダム要塞`, symbol: '🌊', color: '#06b6d4', desc: '巨深な山あいにそびえる巨大水門と発電ダム。清純な水を都心へ供給する。' },
        factory: { name: `${name}清流霊水・薬草精製所`, specialtyName: `${name}深山秘伝ナノ再生水`, specialtyItem: 'item_repair_kit', craftsman: '薬草師・レン', desc: '原生林の湧水から抽出された超回復薬。' }
      };
    }
    if (name.includes('島') || name.includes('大島') || name.includes('八丈') || name.includes('小笠原')) {
      return {
        landmark: { type: 'port', name: `${name}海洋観測灯台・防空要塞`, symbol: '⚓', color: '#06b6d4', desc: '太平洋の荒波を見守る巨大灯台。黒潮の航路を守る海の要衝。' },
        factory: { name: `${name}海洋深層水・濃縮精製所`, specialtyName: '海洋ミネラル抽出晶', specialtyItem: 'item_repair_kit', craftsman: '漁労長・トウショ', desc: '深海から汲み上げられた純度100%のミネラル塩晶。' }
      };
    }
    if (name.includes('市') || name.includes('町') || name.includes('村')) {
      return {
        landmark: { type: 'shrine', name: `${name}総鎮守山岳神社・天守社殿`, symbol: '⛩️', color: '#10b981', desc: '古くからこの地を守護してきた地域の総鎮守。' },
        factory: { name: `${name}地域資源・特産品加工所`, specialtyName: `${name}特製滋養丸`, specialtyItem: 'item_repair_kit', craftsman: '工房長・タマ', desc: '地元の特産資源を濃縮した滋養強壮薬。' }
      };
    }
    return {
      landmark: { type: 'castle', name: `${name}防衛区役所・中央司令塔`, symbol: '🏯', color: '#38bdf8', desc: '強固なコンクリート防壁に囲まれた自衛軍の中枢施設。' },
      factory: { name: `${name}兵站補給・機械整備工場`, specialtyName: `${name}防衛合金パーツ`, specialtyItem: 'item_repair_kit', craftsman: '工廠長・トクブ', desc: '防衛隊の車両や装備を日夜修繕する中核工場。' }
    };
  }

  // --- TRANSITIONS ---
  generateFallbackTown(areaId, name) {
    const spec = this.getSpecialtyForMunicipality(name);
    return {
      areaId: areaId,
      name: name,
      regionName: name,
      dominantFaction: `${name}自治軍`,
      currencyAccepted: ["standard_yen", "junk_parts"],
      atmosphere: `${name}の城塞都市。防壁の内側には兵站拠点と【${spec.landmark.name}】がそびえる。`,
      width: 24,
      height: 18,
      landmarkBuilding: {
        type: spec.landmark.type,
        name: spec.landmark.name,
        symbol: spec.landmark.symbol,
        color: spec.landmark.color,
        desc: spec.landmark.desc,
        position: { x: 12, y: 4 }
      },
      specialtyFactory: {
        name: spec.factory.name,
        specialtyItem: spec.factory.specialtyItem,
        specialtyName: spec.factory.specialtyName,
        craftsman: spec.factory.craftsman,
        desc: spec.factory.desc,
        position: { x: 4, y: 11 }
      },
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
            `ここは【${name}】だ。東京合戦の激戦地だが、中央の【${spec.landmark.name}】のもとで治安が保たれている。`,
            `西側には特産品を作る【${spec.factory.name}】もあるぞ。立ち寄ってみるといい。`
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
    // Ensure landmark & specialty factory exist even if loaded from minimal JSON
    if (!area.landmarkBuilding || !area.specialtyFactory) {
      const spec = this.getSpecialtyForMunicipality(area.regionName || area.name);
      if (!area.landmarkBuilding) {
        area.landmarkBuilding = { ...spec.landmark, position: { x: 12, y: 4 } };
      }
      if (!area.specialtyFactory) {
        area.specialtyFactory = { ...spec.factory, position: { x: 4, y: 11 } };
      }
    }

    this.isTransitioning = true;
    this.fadeAlpha = 0;
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
    this.fadeAlpha = 0;
    this.pendingTransition = () => {
      this.mode = 'overworld';
      // If returning from town, place safely 1 step south of the town landmark
      if (this.currentAreaId) {
        const lm = _getLandmarks().find(l => l.areaId === this.currentAreaId);
        if (lm) {
          this.overworldPos.x = lm.x;
          this.overworldPos.y = Math.min(_getH() - 1, lm.y + 1);
          this.overworldPos.dir = 'down';
        }
      }
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

      const midX = Math.floor(area.width / 2);
      const midY = Math.floor(area.height / 2);

      // 1. Outer fortress walls (perimeter) - only bottom gate is open
      if (x === 0 || x === area.width - 1 || y === 0) return false;
      if (y === area.height - 1 && (x < midX - 1 || x > midX + 1)) return false;

      // 2. Central Stone Well in Plaza
      if (x === midX && y === midY) return false;

      // 3. Flowerbeds (Obstacle)
      if ((x === 8 || x === 9) && (y === 12 || y === 13)) return false;

      // 4. River / Moat (Impassable EXCEPT at bridge x: 18, y: 12)
      const isStream = (x === 18 && y >= 8 && y <= 16) || (x === 19 && y >= 10 && y <= 15);
      const isBridge = (x === 18 && y === 12);
      if (isStream && !isBridge) return false;

      // 5. Trees (All 12 round trees are solid obstacles)
      const treePositions = [
        { x: 2, y: 2 }, { x: 9, y: 2 }, { x: 14, y: 2 }, { x: 21, y: 2 },
        { x: 2, y: 8 }, { x: 9, y: 8 }, { x: 14, y: 8 }, { x: 21, y: 8 },
        { x: 2, y: 15 }, { x: 8, y: 15 }, { x: 15, y: 15 }, { x: 21, y: 15 }
      ];
      if (treePositions.some(tp => tp.x === x && tp.y === y)) return false;

      // 6. INN BUILDING (x: 3..8, y: 3..7)
      // Entrance is ONLY at door tile (x: 6, y: 7)
      if (x >= 3 && x <= 8 && y >= 3 && y <= 7) {
        // Outer stone walls
        const isNorthWall = (y === 3);
        const isWestWall = (x === 3);
        const isEastWall = (x === 8);
        const isSouthWall = (y === 7 && x !== 6); // Only x: 6 is the entrance doorway!
        if (isNorthWall || isWestWall || isEastWall || isSouthWall) return false;

        // Interior solid furniture
        if (x === 4 && (y === 4 || y === 5)) return false; // Beds
        if (y === 6 && (x === 5 || x === 6)) return false; // Counter blocks movement (talk across counter!)
        if (x === 5 && y === 5) return false; // Innkeeper position
      }

      // 7. SHOP BUILDING (x: 15..20, y: 3..7)
      // Entrance is ONLY at door tile (x: 17, y: 7)
      if (x >= 15 && x <= 20 && y >= 3 && y <= 7) {
        // Outer stone walls
        const isNorthWall = (y === 3);
        const isWestWall = (x === 15);
        const isEastWall = (x === 20);
        const isSouthWall = (y === 7 && x !== 17); // Only x: 17 is the entrance doorway!
        if (isNorthWall || isWestWall || isEastWall || isSouthWall) return false;

        // Interior solid furniture
        if (y === 5 && (x === 17 || x === 18)) return false; // Sales counter
        if (x === 17 && y === 4) return false; // Merchant position
        if (x === 16 && y === 6) return false; // Treasure chest
        if (x === 19 && y === 6) return false; // Barrels
      }

      // 8. SPECIALTY FACTORY (x: 3..7, y: 10..14)
      // Entrance is ONLY at north doorway (x: 5, y: 10) connecting to east-west path
      if (area.specialtyFactory && x >= 3 && x <= 7 && y >= 10 && y <= 14) {
        const isNorthWall = (y === 10 && x !== 5); // Only x: 5 is the entrance doorway!
        const isWestWall = (x === 3);
        const isEastWall = (x === 7);
        const isSouthWall = (y === 14);
        if (isNorthWall || isWestWall || isEastWall || isSouthWall) return false;

        // Interior solid equipment
        if (x === 4 && y === 11) return false; // Great stone forge
        if (x === 6 && y === 11) return false; // Anvil
        if (x === 5 && y === 12) return false; // Craftsman position
      }

      // 9. LANDMARK CITADEL / CATHEDRAL (x: 10..14, y: 2..5)
      // Entire citadel is solid fortress; entrance doorstep is at (12, 5)
      if (area.landmarkBuilding && x >= 10 && x <= 14 && y >= 2 && y <= 5) {
        if (x === 12 && y === 5) {
          return true; // Entrance portal threshold!
        }
        return false;
      }

      // 10. NPC Collisions (Cannot walk directly onto NPCs)
      const hasNpc = area.npcs.some(n => n.position.x === x && n.position.y === y);
      if (hasNpc) return false;

      // 11. Checkpoints (Check requirements)
      const hasFac = area.facilities.some(f => {
        if (f.type === 'checkpoint') {
          const cleared = this.game.rpgState.clearedCheckpoints.includes(f.id);
          return f.position.x === x && f.position.y === y && !cleared;
        }
        return false;
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

    // Golden Rule #1: Distant Epic Landmarks visible in horizon sky (Shinjuku Searchlights, Skytree, Tokyo Tower)
    this.renderHorizonLandmarks(ctx);
  }

  // Draw Distant Horizon Visuals (Searchlight Beams & Tower Silhouettes)
  renderHorizonLandmarks(ctx) {
    ctx.save();
    // 1. Shinjuku & Chiyoda Citadel Searchlight Beams shooting up into night sky
    const beamAngle = Math.sin(this.tickCount * 0.02) * 0.35;
    const tochoX = 50 * this.tileSize;
    const tochoY = 22 * this.tileSize;

    ctx.save();
    ctx.translate(tochoX, tochoY);
    ctx.rotate(beamAngle);
    const beamGrad = ctx.createLinearGradient(0, 0, 0, -320);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-24, -320);
    ctx.lineTo(24, -320);
    ctx.lineTo(6, 0);
    ctx.fill();
    ctx.restore();

    // 2. Tokyo Tower Red Beacon Pillar
    const towerX = 48 * this.tileSize;
    const towerY = 26 * this.tileSize;
    const redGlow = 0.5 + 0.5 * Math.sin(this.tickCount * 0.08);
    const redGrad = ctx.createLinearGradient(0, 0, 0, -260);
    redGrad.addColorStop(0, `rgba(239, 68, 68, ${0.4 * redGlow})`);
    redGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.save();
    ctx.translate(towerX, towerY);
    ctx.fillStyle = redGrad;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-18, -260);
    ctx.lineTo(18, -260);
    ctx.lineTo(4, 0);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Safely get population from game.regions (whether it is an Object or Array)
  getRegionPopulation(regName) {
    if (!this.game || !this.game.regions) return 160000;
    try {
      const regs = Array.isArray(this.game.regions) ? this.game.regions : Object.values(this.game.regions);
      const matchR = regs.find(r => r && r.name && (r.name.includes(regName) || regName.includes(r.name)));
      return matchR ? (matchR.population || 160000) : 160000;
    } catch(e) {
      return 160000;
    }
  }

  // ========================================================
  // === SFC DQ3 STYLE TOWN PIXEL ENGINE (Full Aesthetics) ===
  // ========================================================

  renderTown(ctx, camX, camY) {
    if (!this.currentArea) return;
    const area = this.currentArea;

    // Determine Town Tier (1 - 7) based on municipality population
    const regName = area.regionName || area.name;
    const pop = this.getRegionPopulation(regName);
    const tier = this.getTownTier(pop);

    // VIEWPORT CULLING for Town
    const minTileX = Math.max(0, Math.floor((-camX) / this.tileSize) - 1);
    const maxTileX = Math.min(area.width - 1, Math.ceil((-camX + this.canvas.width) / this.tileSize) + 1);
    const minTileY = Math.max(0, Math.floor((-camY) / this.tileSize) - 1);
    const maxTileY = Math.min(area.height - 1, Math.ceil((-camY + this.canvas.height) / this.tileSize) + 1);

    const midX = Math.floor(area.width / 2);
    const midY = Math.floor(area.height / 2);

    // 1. Draw Base Terrain: Lush Green Grassland, Natural Cobblestone, Stream & Perimeter Stone Ramparts
    for (let y = minTileY; y <= maxTileY; y++) {
      for (let x = minTileX; x <= maxTileX; x++) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        const isWall = (x === 0 || x === area.width - 1 || y === 0 || (y === area.height - 1 && (x < midX - 1 || x > midX + 1)));

        if (isWall) {
          // SFC DQ3 Stone Fortress Castle Ramparts
          this.drawDq3StoneWall(ctx, px, py, x, y, area);
        } else {
          // Water Stream running along east side
          const isStream = (x === 18 && y >= 8 && y <= 16) || (x === 19 && y >= 10 && y <= 15);
          const isBridge = (x === 18 && y === 12);

          // Path & Plaza detection with paved street branches to each building doorway
          const isMainNorthSouth = (x >= midX - 1 && x <= midX + 1 && y >= 5);
          const isEastWest = (y >= midY && y <= midY + 1 && x >= 4 && x <= 20);
          const isPlaza = (Math.abs(x - midX) <= 2 && Math.abs(y - midY) <= 2);

          // Paved street branches leading directly into each building entrance
          const isInnPath = (x === 6 && y >= 7 && y <= midY);
          const isShopPath = (x === 17 && y >= 7 && y <= midY);
          const isFactoryPath = (x === 5 && (y === 10 || y === 9));
          const isCitadelPath = (x >= 11 && x <= 13 && y === 5);

          const isPath = isMainNorthSouth || isEastWest || isPlaza || isInnPath || isShopPath || isFactoryPath || isCitadelPath;

          if (isStream && !isBridge) {
            // DQ3 Blue River / Moat with waves & reeds
            this.drawDq3WaterTile(ctx, px, py, x, y);
          } else if (isBridge) {
            // Wooden Footbridge over stream
            this.drawDq3WoodBridgeTile(ctx, px, py);
          } else if (isPath) {
            // DQ3 Natural Cobblestone Pathway
            this.drawDq3CobblestoneTile(ctx, px, py, x, y, isPlaza, tier);
          } else {
            // DQ3 Lush Vibrant Green Grass
            this.drawDq3GrassTile(ctx, px, py, x, y);
          }
        }
      }
    }

    // 2. Environmental Nature: Trees, Flowerbeds, Central Stone Well
    this.drawDq3EnvironmentProps(ctx, area, minTileX, maxTileX, minTileY, maxTileY, tier);

    // 3. Exit gate highlight at bottom
    const exitX = midX * this.tileSize;
    const exitY = (area.height - 1) * this.tileSize;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(exitX - this.tileSize, exitY + 8, this.tileSize * 3, 16);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#fcd34d';
    ctx.textAlign = 'center';
    ctx.fillText('▼ 出口 (広域マップへ) ▼', exitX + this.tileSize / 2, exitY + 20);

    // 4. Render Interior Cutaway Rooms with full 32px solid walls and designated doorways
    this.drawDq3InnBuilding(ctx, 3, 3, 6, 5, 6, 7, tier); // Door at (6, 7)
    this.drawDq3ShopBuilding(ctx, 15, 3, 6, 5, 17, 7, tier); // Door at (17, 7)

    // 5. Render Local Specialty Production Factory
    if (area.specialtyFactory) {
      this.drawDq3SpecialtyFactoryBuilding(ctx, 3, 10, 5, 5, 5, 10, area.specialtyFactory, tier); // Door at (5, 10)
    }

    // 6. Render Roofed Iconic Landmark (Shrine, Church, Tower) at North Center
    if (area.landmarkBuilding) {
      this.drawDq3LandmarkRoofedBuilding(ctx, 10, 2, 5, 4, area.landmarkBuilding, tier);
    }

    // 7. Render Core NPCs with enhanced retro sprites & elegant DQ nameplates
    (area.npcs || []).forEach(npc => {
      const nx = npc.position.x * this.tileSize;
      const ny = npc.position.y * this.tileSize;
      this.renderNpcSprite(ctx, nx, ny, npc.sprite);

      ctx.font = 'bold 9px monospace';
      const labelText = npc.name.substring(0, 6);
      const labelW = Math.max(38, ctx.measureText(labelText).width + 10);
      const labelX = nx + this.tileSize / 2 - labelW / 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(labelX, ny - 13, labelW, 11);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, ny - 13, labelW, 11);
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, nx + this.tileSize / 2, ny - 4);
    });

    // 8. Render Dynamic Citizens (Scaled 1 - 7 based on Tier)
    this.renderDynamicCitizens(ctx, area, tier);
  }

  // =========================================================================
  // --- HIGH-FIDELITY SFC DQ3 TILE & ARCHITECTURE RENDERERS ---
  // =========================================================================

  // 1. Lush Organic Grass Tile (4x Micro-Density Dithered Turf, Blades & Wildflowers)
  drawDq3GrassTile(ctx, px, py, x, y) {
    // 4x4 Micro-Dithered Turf Base (Multi-tone soil and grass underlay)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // Subtle 4x micro-pixel dither matrix for natural soil depth
    const s = (x * 47 + y * 71) % 17;
    ctx.fillStyle = '#14532d'; // Deep shadow turf
    for (let dy = 0; dy < 32; dy += 8) {
      for (let dx = 0; dx < 32; dx += 8) {
        if ((dx + dy + s) % 3 === 0) {
          ctx.fillRect(px + dx, py + dy, 4, 4);
        }
      }
    }

    ctx.fillStyle = '#16a34a'; // Vibrant midtone turf
    for (let dy = 4; dy < 32; dy += 8) {
      for (let dx = 4; dx < 32; dx += 8) {
        if ((dx * 2 + dy + s) % 4 === 0) {
          ctx.fillRect(px + dx, py + dy, 3, 3);
        }
      }
    }

    // Dense Micro Grass Blade Clusters (4-6 detailed tufts per tile)
    const bladeTufts = [
      { ox: 4,  oy: 6,  h: 5 },
      { ox: 14, oy: 18, h: 6 },
      { ox: 22, oy: 8,  h: 5 },
      { ox: 8,  oy: 24, h: 6 },
      { ox: 26, oy: 22, h: 5 }
    ];

    bladeTufts.forEach((bt, i) => {
      const bx = px + (bt.ox + s * 2) % 26 + 2;
      const by = py + (bt.oy + s * 3) % 24 + 4;

      // Dark shadow at blade base
      ctx.fillStyle = '#0f3e26';
      ctx.fillRect(bx, by + bt.h - 1, 3, 2);

      // Grass blades
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(bx, by + 1, 1.5, bt.h - 1);
      ctx.fillRect(bx + 2, by, 1.5, bt.h);

      // Sunlit tip highlights
      ctx.fillStyle = '#86efac';
      ctx.fillRect(bx, by, 1.5, 2);
      ctx.fillRect(bx + 2, by - 1, 1.5, 2);
    });

    // Detailed Micro Wildflowers (Daisies, Pink Clovers, Buttercups with leaves)
    if (s % 3 === 0) {
      const fx = px + 6 + (s * 5) % 20;
      const fy = py + 6 + (s * 7) % 20;

      // Green flower leaves
      ctx.fillStyle = '#166534';
      ctx.fillRect(fx - 1, fy + 2, 5, 2);

      // Petals
      const petalCol = (s % 6 === 0) ? '#f472b6' : ((s % 6 === 3) ? '#fef08a' : '#ffffff');
      ctx.fillStyle = petalCol;
      ctx.fillRect(fx, fy, 3, 3);
      // Center golden stamen
      ctx.fillStyle = '#eab308';
      ctx.fillRect(fx + 1, fy + 1, 1, 1);
    }
  }

  // 2. 4x Micro-Density Interlocking Cobblestone Pathway (20-25 Rounded Stones + Feathered Gravel)
  drawDq3CobblestoneTile(ctx, px, py, x, y, isPlaza, tier) {
    // Rich earthy mortar substrate
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // 4x Micro Mosaic Grid: 20-24 finely fitted, rounded cobblestones per 32x32 tile
    const hash = (x * 31 + y * 47) % 7;

    const microStones = [
      // Row 1 (y: 2..8)
      { ox: 2,  oy: 2,  w: 6, h: 5 }, { ox: 9,  oy: 2,  w: 7, h: 6 }, { ox: 17, oy: 2,  w: 6, h: 5 }, { ox: 24, oy: 2,  w: 6, h: 6 },
      // Row 2 (y: 8..14)
      { ox: 2,  oy: 8,  w: 7, h: 5 }, { ox: 10, oy: 9,  w: 6, h: 5 }, { ox: 17, oy: 8,  w: 7, h: 6 }, { ox: 25, oy: 9,  w: 5, h: 5 },
      // Row 3 (y: 15..21)
      { ox: 2,  oy: 14, w: 6, h: 6 }, { ox: 9,  oy: 15, w: 7, h: 6 }, { ox: 17, oy: 15, w: 6, h: 5 }, { ox: 24, oy: 15, w: 6, h: 6 },
      // Row 4 (y: 22..28)
      { ox: 2,  oy: 21, w: 7, h: 5 }, { ox: 10, oy: 22, w: 6, h: 5 }, { ox: 17, oy: 21, w: 7, h: 6 }, { ox: 25, oy: 22, w: 5, h: 5 },
      // Row 5 (y: 28..31)
      { ox: 2,  oy: 27, w: 6, h: 4 }, { ox: 9,  oy: 28, w: 7, h: 3 }, { ox: 17, oy: 28, w: 6, h: 3 }, { ox: 24, oy: 27, w: 6, h: 4 }
    ];

    microStones.forEach((st, i) => {
      const sx = px + st.ox;
      const sy = py + st.oy;

      // 4 distinct realistic stone hues (granite, slate, limestone, basalt)
      let baseCol;
      const colSeed = (i + hash) % 4;
      if (isPlaza) {
        baseCol = (colSeed === 0) ? '#cbd5e1' : ((colSeed === 1) ? '#94a3b8' : ((colSeed === 2) ? '#64748b' : '#b0c4de'));
      } else {
        baseCol = (colSeed === 0) ? '#64748b' : ((colSeed === 1) ? '#475569' : ((colSeed === 2) ? '#52525b' : '#71717a'));
      }

      // Stone Body (Rounded 3D Profile)
      ctx.fillStyle = baseCol;
      ctx.fillRect(sx, sy, st.w, st.h);

      // Top-Left Bevel Sunlight Highlight
      ctx.fillStyle = isPlaza ? '#f8fafc' : '#cbd5e1';
      ctx.fillRect(sx, sy, st.w - 1, 1);
      ctx.fillRect(sx, sy, 1, st.h - 1);

      // Bottom-Right Deep Crevice Mortar Shadow
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx, sy + st.h - 1, st.w, 1);
      ctx.fillRect(sx + st.w - 1, sy, 1, st.h);
    });

    // Organic Loose Gravel & Dirt Specks feathering into borders
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + 8, py + 7, 1.5, 1.5);
    ctx.fillRect(px + 23, py + 14, 1.5, 1.5);
    ctx.fillRect(px + 15, py + 26, 1.5, 1.5);
  }

  // 3. Thick Castle Rampart Wall with Stone Blocks & Battlements
  drawDq3StoneWall(ctx, px, py, x, y, area) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // 4 horizontal courses of precision stone blocks
    const rowH = 8;
    for (let r = 0; r < 4; r++) {
      const ry = py + r * rowH;
      const off = ((r + x) % 2 === 0) ? 0 : 8;

      for (let bx = px - off; bx < px + this.tileSize; bx += 16) {
        const sw = Math.min(14, px + this.tileSize - bx);
        if (sw <= 2) continue;
        const curBx = Math.max(px, bx);
        const curW = Math.min(sw, px + this.tileSize - curBx);

        ctx.fillStyle = ((curBx + ry) % 7 === 0) ? '#64748b' : '#475569';
        ctx.fillRect(curBx, ry + 1, curW, rowH - 2);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(curBx, ry + 1, curW, 1);
        ctx.fillRect(curBx, ry + 1, 1, rowH - 2);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curBx, ry + rowH - 2, curW, 1);
        ctx.fillRect(curBx + curW - 1, ry + 1, 1, rowH - 2);
      }
    }

    if (y === 0 || y === area.height - 1) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 3, py + 1, 11, 4);
      ctx.fillRect(px + 18, py + 1, 11, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 3, py + 1, 11, 1);
      ctx.fillRect(px + 18, py + 1, 11, 1);
    }
  }

  // 4. Winding River with Embankment Stones, Multi-Tier Depth & Caustic Water Shimmer
  drawDq3WaterTile(ctx, px, py, x, y) {
    // 1. Embankment Stone Revetment along banks (Replaces flat stripe)
    ctx.fillStyle = '#334155';
    ctx.fillRect(px, py, 4, this.tileSize);
    ctx.fillRect(px + this.tileSize - 4, py, 4, this.tileSize);

    // Individual carved embankment stones
    for (let sy = py; sy < py + this.tileSize; sy += 8) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px, sy + 1, 3, 6);
      ctx.fillRect(px + this.tileSize - 3, sy + 1, 3, 6);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px, sy + 1, 3, 1);
      ctx.fillRect(px + this.tileSize - 3, sy + 1, 3, 1);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, sy + 7, 3, 1);
      ctx.fillRect(px + this.tileSize - 3, sy + 7, 3, 1);
    }

    // 2. 3-Tier Water Depth Gradient (Emerald Shallows to Deep Midnight Blue)
    const grad = ctx.createLinearGradient(px + 4, py, px + this.tileSize - 4, py);
    grad.addColorStop(0, '#0284c7');    // Turquoise bank shallows
    grad.addColorStop(0.3, '#1e40af');  // Sapphire transition
    grad.addColorStop(0.5, '#172554');  // Deep trench center
    grad.addColorStop(0.7, '#1e40af');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(px + 4, py, this.tileSize - 8, this.tileSize);

    // 3. Animated Caustic Wave Shimmer Lines
    const wave1 = (this.tickCount * 0.06 + x * 3 + y * 2) % 8;
    const wave2 = (this.tickCount * 0.09 + x + y * 4) % 7;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
    ctx.fillRect(px + 6 + wave1 * 2, py + 8, 7, 1.5);
    ctx.fillRect(px + 15 - wave2 * 1.5, py + 22, 8, 1.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(px + 8 + wave1 * 2, py + 8, 3, 1);

    // 4. Floating Water Lily Pad with Layered Pink Lotus Blossom
    if ((x * 11 + y * 19) % 5 === 0) {
      ctx.fillStyle = '#15803d'; // Lily pad
      ctx.beginPath();
      ctx.arc(px + 16, py + 15, 6, 0, Math.PI * 1.8);
      ctx.lineTo(px + 16, py + 15);
      ctx.fill();

      // Multi-petal Lotus
      ctx.fillStyle = '#ec4899'; // Petal base
      ctx.beginPath();
      ctx.arc(px + 16, py + 14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6'; // Bright tip
      ctx.fillRect(px + 15, py + 13, 2, 2);
      ctx.fillStyle = '#fef08a'; // Golden core
      ctx.fillRect(px + 16, py + 14, 1, 1);
    }
  }

  // 5. Timber Bridge with Handrails & Wood Planks
  drawDq3WoodBridgeTile(ctx, px, py) {
    ctx.fillStyle = '#172554';
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(px, py + this.tileSize - 4, this.tileSize, 4);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py, this.tileSize, this.tileSize - 2);

    for (let p = 2; p < this.tileSize - 2; p += 6) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 3, py + p, this.tileSize - 6, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px + 3, py + p, this.tileSize - 6, 1);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 5, py + p + 1, 1, 1);
      ctx.fillRect(px + this.tileSize - 6, py + p + 1, 1, 1);
    }

    ctx.fillStyle = '#451a03';
    ctx.fillRect(px, py, 4, this.tileSize);
    ctx.fillRect(px + this.tileSize - 4, py, 4, this.tileSize);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + 1, py, 2, this.tileSize);
    ctx.fillRect(px + this.tileSize - 3, py, 2, this.tileSize);
  }

  // 6. Environmental Nature: Trees, Central Stone Well, Flowerbeds & Street Props
  drawDq3EnvironmentProps(ctx, area, minX, maxX, minY, maxY, tier) {
    const treePositions = [
      { x: 2, y: 2 }, { x: 9, y: 2 }, { x: 14, y: 2 }, { x: 21, y: 2 },
      { x: 2, y: 8 }, { x: 9, y: 8 }, { x: 14, y: 8 }, { x: 21, y: 8 },
      { x: 2, y: 15 }, { x: 8, y: 15 }, { x: 15, y: 15 }, { x: 21, y: 15 }
    ];

    treePositions.forEach(tp => {
      if (tp.x < minX || tp.x > maxX || tp.y < minY || tp.y > maxY) return;
      this.drawDq3RoundTree(ctx, tp.x * this.tileSize, tp.y * this.tileSize);
    });

    // Street Lantern Posts along the avenue
    const lampPositions = [
      { x: 10, y: 7 }, { x: 14, y: 7 },
      { x: 10, y: 13 }, { x: 14, y: 13 }
    ];
    lampPositions.forEach(lp => {
      if (lp.x >= minX && lp.x <= maxX && lp.y >= minY && lp.y <= maxY) {
        this.drawDq3StreetLantern(ctx, lp.x * this.tileSize, lp.y * this.tileSize);
      }
    });

    // Central Stone Well in Plaza
    const midX = Math.floor(area.width / 2);
    const midY = Math.floor(area.height / 2);
    if (midX >= minX && midX <= maxX && midY >= minY && midY <= maxY) {
      this.drawDq3StoneWell(ctx, midX * this.tileSize, midY * this.tileSize);
    }

    // Flowerbed
    this.drawDq3Flowerbed(ctx, 8 * this.tileSize, 12 * this.tileSize);
  }

  // Draw Ornate Iron Street Lantern Post with Warm Glow
  drawDq3StreetLantern(ctx, lx, ly) {
    ctx.save();
    // Post shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(lx + 16, ly + 28, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iron Post
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 15, ly + 8, 2, 20);
    ctx.fillStyle = '#334155';
    ctx.fillRect(lx + 13, ly + 26, 6, 2); // Base

    // Lantern Bracket & Glass Housing
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 12, ly + 4, 8, 2);
    ctx.fillRect(lx + 13, ly + 6, 6, 8);

    // Warm Glowing Lantern Light
    ctx.fillStyle = '#fde047';
    ctx.fillRect(lx + 14, ly + 7, 4, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx + 15, ly + 8, 2, 3);

    // Soft Ambient Light Aura
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath();
    ctx.arc(lx + 16, ly + 10, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Signature DQ3 Multi-Lobed Clustered Round Tree (4x Micro-Density Leaf Dithering)
  drawDq3RoundTree(ctx, tx, ty) {
    ctx.save();
    // 1. Soft Oval Cast Shadow on Ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(tx + 16, ty + 30, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Thick Gnarled Oak Trunk with Roots & Bark Crevices
    ctx.fillStyle = '#451a03';
    ctx.fillRect(tx + 11, ty + 16, 10, 14);
    // Root flares
    ctx.beginPath();
    ctx.moveTo(tx + 8, ty + 30);
    ctx.lineTo(tx + 11, ty + 20);
    ctx.lineTo(tx + 21, ty + 20);
    ctx.lineTo(tx + 24, ty + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx + 12, ty + 17, 3, 11);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(tx + 13, ty + 18, 1, 9);

    // 3. Multi-Lobed Canopy (7 Overlapping Scalloped Foliage Spheres for 4x volume)
    const lobes = [
      { cx: tx + 16, cy: ty + 12, r: 16 }, // Center
      { cx: tx + 16, cy: ty + 4,  r: 12 }, // Top
      { cx: tx + 7,  cy: ty + 12, r: 12 }, // Left
      { cx: tx + 25, cy: ty + 12, r: 12 }, // Right
      { cx: tx + 11, cy: ty + 7,  r: 11 }, // Top-Left
      { cx: tx + 21, cy: ty + 7,  r: 11 }, // Top-Right
      { cx: tx + 16, cy: ty + 18, r: 13 }  // Bottom
    ];

    // Pass A: Deep Shadow Evergreen Base (#064e3b)
    ctx.fillStyle = '#064e3b';
    lobes.forEach(lb => {
      ctx.beginPath();
      ctx.arc(lb.cx, lb.cy + 2, lb.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pass B: Mid Forest Green (#15803d)
    ctx.fillStyle = '#15803d';
    lobes.forEach(lb => {
      ctx.beginPath();
      ctx.arc(lb.cx, lb.cy, lb.r - 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pass C: Vibrant Sunlit Leaf Green (#22c55e)
    ctx.fillStyle = '#22c55e';
    lobes.forEach(lb => {
      ctx.beginPath();
      ctx.arc(lb.cx - 2, lb.cy - 2, lb.r - 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pass D: Crisp Golden-Green Sunlight Highlights on Top-Left Rim (#86efac)
    ctx.fillStyle = '#86efac';
    lobes.forEach(lb => {
      ctx.beginPath();
      ctx.arc(lb.cx - 4, lb.cy - 4, Math.max(2, lb.r - 8), 0, Math.PI * 2);
      ctx.fill();
    });

    // Pass E: Fine Leafy Pixel Clusters
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(tx + 12, ty + 2, 3, 2);
    ctx.fillRect(tx + 6, ty + 8, 3, 2);
    ctx.fillRect(tx + 20, ty + 7, 2, 2);

    ctx.restore();
  }

  // 8. Stone Well with A-Frame Shingle Roof & Bucket
  drawDq3StoneWell(ctx, wx, wy) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(wx + 16, wy + 24, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(wx + 16, wy + 18, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(wx + 16, wy + 18, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wx + 16, wy + 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(wx + 16, wy + 18, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.fillRect(wx + 5, wy + 4, 3, 18);
    ctx.fillRect(wx + 24, wy + 4, 3, 18);

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(wx + 16, wy - 4);
    ctx.lineTo(wx + 2, wy + 6);
    ctx.lineTo(wx + 30, wy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.fillRect(wx + 3, wy + 5, 26, 2);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(wx + 8, wy + 7, 16, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(wx + 14, wy + 7, 4, 3);
    ctx.fillRect(wx + 15, wy + 10, 2, 5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx + 14, wy + 15, 5, 5);

    ctx.restore();
  }

  // 9. Flowerbed with Stone Border & Layered Blooms
  drawDq3Flowerbed(ctx, fx, fy) {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.fillRect(fx, fy, 40, 24);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(fx, fy, 40, 2);
    ctx.fillRect(fx, fy, 2, 24);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(fx, fy + 22, 40, 2);
    ctx.fillRect(fx + 38, fy, 2, 24);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(fx + 3, fy + 3, 34, 18);

    const blooms = [
      { x: 6, y: 6, col: '#f43f5e' }, { x: 14, y: 6, col: '#fde047' }, { x: 22, y: 6, col: '#ec4899' }, { x: 30, y: 6, col: '#38bdf8' },
      { x: 10, y: 13, col: '#a855f7' }, { x: 18, y: 13, col: '#f43f5e' }, { x: 26, y: 13, col: '#ffffff' }
    ];

    blooms.forEach(b => {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(fx + b.x - 1, fy + b.y + 1, 6, 4);
      ctx.fillStyle = b.col;
      ctx.fillRect(fx + b.x, fy + b.y, 4, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fx + b.x + 1, fy + b.y + 1, 2, 2);
    });

    ctx.restore();
  }

  // =========================================================================
  // --- CUTAWAY INTERIOR BUILDING RENDERERS (SFC DQ3 ARCHITECTURE) ---
  // =========================================================================

  // Helper: Draw Full 32px Castle Stone Perimeter Walls with 2.5D North Drop Shadow & Dedicated Doorway
  drawRoomStonePerimeter(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, doorWall = 'south') {
    ctx.save();
    const bx = startTileX * this.tileSize;
    const by = startTileY * this.tileSize;
    const bw = w * this.tileSize;
    const bh = h * this.tileSize;
    const ts = this.tileSize;

    // Outer Stone Walls
    for (let tx = startTileX; tx < startTileX + w; tx++) {
      if (doorWall === 'north' && tx === doorTileX) {
        this.drawDoorwayThreshold(ctx, tx * ts, by, 'north');
      } else {
        this.drawWallBlockTile(ctx, tx * ts, by, tx, startTileY, 'north');
      }
    }

    const southY = (startTileY + h - 1) * ts;
    for (let tx = startTileX; tx < startTileX + w; tx++) {
      if (doorWall === 'south' && tx === doorTileX) {
        this.drawDoorwayThreshold(ctx, tx * ts, southY, 'south');
      } else {
        this.drawWallBlockTile(ctx, tx * ts, southY, tx, startTileY + h - 1, 'south');
      }
    }

    for (let ty = startTileY + 1; ty < startTileY + h - 1; ty++) {
      this.drawWallBlockTile(ctx, bx, ty * ts, startTileX, ty, 'west');
    }

    const eastX = (startTileX + w - 1) * ts;
    for (let ty = startTileY + 1; ty < startTileY + h - 1; ty++) {
      this.drawWallBlockTile(ctx, eastX, ty * ts, startTileX + w - 1, ty, 'east');
    }

    // Stacked outdoor crates & barrels against outer building wall
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx - 6, southY + 8, 6, 8);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bx - 5, southY + 9, 4, 6);

    // 2.5D Drop Shadows on interior floor
    const floorX = (startTileX + 1) * ts;
    const floorY = (startTileY + 1) * ts;
    const floorW = (w - 2) * ts;
    const floorH = (h - 2) * ts;

    const gradN = ctx.createLinearGradient(floorX, floorY, floorX, floorY + 16);
    gradN.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    gradN.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradN;
    ctx.fillRect(floorX, floorY, floorW, 16);

    const gradW = ctx.createLinearGradient(floorX, floorY, floorX + 12, floorY);
    gradW.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    gradW.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradW;
    ctx.fillRect(floorX, floorY, 12, floorH);

    ctx.restore();
  }

  // Draw Individual 32x32 Castle Stone Wall Block Tile with 3D Bevel & Mortar Lines
  drawWallBlockTile(ctx, px, py, tx, ty, side) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    const rowH = 16;
    for (let r = 0; r < 2; r++) {
      const ry = py + r * rowH;
      const off = ((r + tx) % 2 === 0) ? 0 : 8;

      for (let bx = px - off; bx < px + this.tileSize; bx += 16) {
        const sw = Math.min(14, px + this.tileSize - bx);
        if (sw <= 2) continue;
        const curBx = Math.max(px, bx);
        const curW = Math.min(sw, px + this.tileSize - curBx);

        const col = ((curBx + ry) % 7 === 0) ? '#64748b' : (((curBx + ry) % 3 === 0) ? '#475569' : '#334155');
        ctx.fillStyle = col;
        ctx.fillRect(curBx, ry + 1, curW, rowH - 2);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(curBx, ry + 1, curW, 1.5);
        ctx.fillRect(curBx, ry + 1, 1.5, rowH - 2);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curBx, ry + rowH - 2, curW, 1);
        ctx.fillRect(curBx + curW - 1, ry + 1, 1, rowH - 2);
      }
    }

    if (side === 'north') {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px, py, this.tileSize, 2);
    }
  }

  // Draw Open Doorway Threshold with Stone Archway & Wooden Sill
  drawDoorwayThreshold(ctx, px, py, side) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    ctx.fillStyle = '#92400e';
    ctx.fillRect(px + 2, py + 4, this.tileSize - 4, this.tileSize - 8);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + 4, py + 6, this.tileSize - 8, 3);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 2, py + this.tileSize - 6, this.tileSize - 4, 2);

    ctx.fillStyle = '#475569';
    ctx.fillRect(px, py, 4, this.tileSize);
    ctx.fillRect(px + this.tileSize - 4, py, 4, this.tileSize);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px, py, 2, this.tileSize);
    ctx.fillRect(px + this.tileSize - 4, py, 2, this.tileSize);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    if (side === 'south') {
      ctx.fillRect(px + 4, py, this.tileSize - 8, 6);
    } else {
      ctx.fillRect(px + 4, py + this.tileSize - 6, this.tileSize - 8, 6);
    }
  }

  // 1. SFC DQ3 INN (Masterpiece Bedroom, Living Props, Bookshelf & Search Urn)
  drawDq3InnBuilding(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, tier) {
    const ts = this.tileSize;
    const bx = startTileX * ts;
    const by = startTileY * ts;
    const bw = w * ts;
    const bh = h * ts;

    ctx.save();
    this.drawRoomStonePerimeter(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, 'south');

    const floorX = (startTileX + 1) * ts;
    const floorY = (startTileY + 1) * ts;
    const floorW = (w - 2) * ts;
    const floorH = (h - 2) * ts;

    // Aged Hardwood Floorboards
    ctx.fillStyle = '#78350f';
    ctx.fillRect(floorX, floorY, floorW, floorH);

    for (let p = floorY; p < floorY + floorH; p += 10) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(floorX, p, floorW, 8);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(floorX, p, floorW, 1);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(floorX, p + 7, floorW, 1);
    }

    // Rich Crimson Carpet
    const crpX = floorX + 38;
    const crpY = floorY + 8;
    const crpW = floorW - 46;
    const crpH = floorH - 36;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(crpX + 2, crpY + 2, crpW, crpH);
    ctx.fillStyle = '#881337';
    ctx.fillRect(crpX, crpY, crpW, crpH);
    ctx.fillStyle = '#be123c';
    ctx.fillRect(crpX + 3, crpY + 3, crpW - 6, crpH - 6);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(crpX + 2, crpY + 2, crpW - 4, crpH - 4);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.strokeRect(crpX + 5, crpY + 5, crpW - 10, crpH - 10);

    const midCrpX = crpX + crpW / 2;
    const midCrpY = crpY + crpH / 2;
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(midCrpX, midCrpY - 9);
    ctx.lineTo(midCrpX + 12, midCrpY);
    ctx.lineTo(midCrpX, midCrpY + 9);
    ctx.lineTo(midCrpX - 12, midCrpY);
    ctx.closePath();
    ctx.fill();

    // 4-Poster Beds along Left Wall
    this.drawDq3Bed(ctx, floorX + 4, floorY + 4);
    this.drawDq3Bed(ctx, floorX + 4, floorY + 48);

    // Bedside Nightstand with Candlestick
    ctx.fillStyle = '#451a03';
    ctx.fillRect(floorX + 6, floorY + 40, 14, 6);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(floorX + 11, floorY + 36, 4, 4);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(floorX + 12, floorY + 34, 2, 2);

    // NEW LIVING PROPS: Bookshelf in upper right
    ctx.fillStyle = '#451a03';
    ctx.fillRect(floorX + floorW - 22, floorY + 4, 18, 22);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(floorX + floorW - 20, floorY + 6, 14, 18);
    // Colored books on shelf
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(floorX + floorW - 18, floorY + 8, 3, 7);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(floorX + floorW - 14, floorY + 8, 3, 7);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(floorX + floorW - 10, floorY + 8, 3, 7);

    // NEW LIVING PROPS: Ceramic Search Urn / Pot (ツボ)
    this.drawDq3CeramicPot(ctx, floorX + floorW - 16, floorY + 32);

    // Reception Counter at (5, 6)
    const cntX = (startTileX + 2) * ts;
    const cntY = (startTileY + 3) * ts + 14;
    const cntW = 44;
    const cntH = 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(cntX + 2, cntY + 2, cntW, cntH);
    ctx.fillStyle = '#713f12';
    ctx.fillRect(cntX, cntY, cntW, cntH);
    ctx.fillStyle = '#a16207';
    ctx.fillRect(cntX + 1, cntY + 1, cntW - 2, 4);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(cntX, cntY, cntW, cntH);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cntX + 6, cntY + 3, 4, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cntX + 28, cntY + 3, 9, 6);

    // Innkeeper standing behind counter at (5, 5)
    this.drawDq3InnkeeperSprite(ctx, cntX + 12, cntY - 18);

    // Hanging Wooden Signboard outside wall
    const sgnX = bx + 4;
    const sgnY = by + bh - 16;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sgnX - 2, sgnY + 2, 5, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sgnX + 3, sgnY, 32, 12);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.strokeRect(sgnX + 3, sgnY, 32, 12);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText('🛌 INN', sgnX + 19, sgnY + 9);

    ctx.restore();
  }

  // Draw DQ3 Ceramic Search Pot / Urn (ツボ)
  drawDq3CeramicPot(ctx, px, py) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + 6, py + 12, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Clay pot body
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(px + 6, py + 7, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px + 2, py + 3, 8, 4);
    // Pot rim & dark opening
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 3, py + 1, 6, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 4, py + 2, 4, 1);
    // Sunlight highlight
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + 3, py + 4, 2, 3);
  }

  // Draw DQ3 4-Poster Bed with Pillows, Quilt & Headboard
  drawDq3Bed(ctx, bx, by) {
    const bw = 26;
    const bh = 34;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(bx + 2, by + 2, bw, bh);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(bx, by, bw, bh);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx + 2, by + 2, bw - 4, 7);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(bx, by, 3, 4);
    ctx.fillRect(bx + bw - 3, by, 3, 4);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bx + 3, by + 3, bw - 6, 7);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(bx + 3, by + 3, bw - 6, 7);

    ctx.fillStyle = '#1e40af';
    ctx.fillRect(bx + 2, by + 11, bw - 4, bh - 13);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(bx + 3, by + 12, bw - 6, bh - 15);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bx + 2, by + 10, bw - 4, 4);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(bx + 3, by + 14, bw - 6, 1);
  }

  // Draw Friendly Green-Tunic Innkeeper
  drawDq3InnkeeperSprite(ctx, x, y) {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x + 2, y + 8, 14, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 10, 10, 10);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 3, y + 2, 12, 8);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(x + 2, y, 14, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 5, y + 5, 2, 2);
    ctx.fillRect(x + 10, y + 5, 2, 2);
  }

  // 2. SFC DQ3 SHOP (Checkerboard Tiles, Armory Displays, Counter & Merchant)
  drawDq3ShopBuilding(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, tier) {
    const ts = this.tileSize;
    const bx = startTileX * ts;
    const by = startTileY * ts;
    const bw = w * ts;
    const bh = h * ts;

    ctx.save();
    this.drawRoomStonePerimeter(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, 'south');

    const floorX = (startTileX + 1) * ts;
    const floorY = (startTileY + 1) * ts;
    const floorW = (w - 2) * ts;
    const floorH = (h - 2) * ts;

    // Checkerboard Slate Tiles
    for (let fy = floorY; fy < floorY + floorH; fy += 14) {
      for (let fx = floorX; fx < floorX + floorW; fx += 14) {
        const curW = Math.min(13, floorX + floorW - fx);
        const curH = Math.min(13, floorY + floorH - fy);
        const isLight = ((Math.floor((fx - floorX) / 14) + Math.floor((fy - floorY) / 14)) % 2 === 0);
        ctx.fillStyle = isLight ? '#475569' : '#334155';
        ctx.fillRect(fx, fy, curW, curH);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(fx, fy, curW, 1);
        ctx.fillRect(fx, fy, 1, curH);
      }
    }

    // North Wall Armory Displays
    this.drawDq3WeaponRack(ctx, floorX + 10, floorY + 4);
    this.drawDq3ShieldRack(ctx, floorX + 60, floorY + 4);
    this.drawDq3PotionShelf(ctx, floorX + floorW - 36, floorY + 4);

    // Sales Counter at (17..18, 5)
    const cntX = (startTileX + 2) * ts;
    const cntY = (startTileY + 2) * ts + 14;
    const cntW = 54;
    const cntH = 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(cntX + 2, cntY + 2, cntW, cntH);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cntX, cntY, cntW, cntH);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cntX + 2, cntY + 2, cntW - 4, 4);
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(cntX, cntY, cntW, cntH);

    ctx.fillStyle = '#fde047';
    ctx.fillRect(cntX + 8, cntY + 3, 6, 4);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cntX + 36, cntY + 3, 7, 5);

    // Merchant NPC standing behind counter at (17, 4)
    this.drawDq3MerchantSprite(ctx, cntX + 18, cntY - 18);

    // Corner Props: Heavy Chest & Supply Barrels
    this.drawDq3Chest(ctx, floorX + 4, floorY + floorH - 22);
    this.drawDq3Barrel(ctx, floorX + floorW - 20, floorY + floorH - 24);

    // Hanging Wooden Signboard outside wall
    const sgnX = bx + 4;
    const sgnY = by + bh - 16;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sgnX - 2, sgnY + 2, 5, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sgnX + 3, sgnY, 34, 12);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.strokeRect(sgnX + 3, sgnY, 34, 12);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ SHOP', sgnX + 20, sgnY + 9);

    ctx.restore();
  }

  // Draw Wall Weapon Rack (Broadsword, Spear & Battleaxe)
  drawDq3WeaponRack(ctx, x, y) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x, y, 42, 18);
    ctx.strokeStyle = '#78350f';
    ctx.strokeRect(x, y, 42, 18);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 6, y + 4, 26, 2);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + 4, y + 2, 4, 6);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x + 2, y + 3, 2, 4);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 6, y + 10, 30, 2);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 30, y + 9, 3, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 33, y + 9, 5, 4);
  }

  // Draw Knight's Heater Shield Mounted on Wall
  drawDq3ShieldRack(ctx, x, y) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x, y, 26, 20);
    ctx.strokeStyle = '#78350f';
    ctx.strokeRect(x, y, 26, 20);

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 3);
    ctx.lineTo(x + 21, y + 3);
    ctx.lineTo(x + 21, y + 13);
    ctx.lineTo(x + 13, y + 18);
    ctx.lineTo(x + 5, y + 13);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 12, y + 5, 2, 9);
    ctx.fillRect(x + 8, y + 8, 10, 2);
  }

  // Draw Apothecary Glass Potion Shelf
  drawDq3PotionShelf(ctx, x, y) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x, y + 13, 30, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 3, y + 5, 6, 8);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x + 12, y + 4, 6, 9);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x + 21, y + 6, 6, 7);
  }

  // Draw Heavy Wooden Supply Barrel
  drawDq3Barrel(ctx, x, y) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 1, y + 1, 15, 17);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, 15, 17);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 2, y, 11, 17);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y + 3, 15, 2);
    ctx.fillRect(x, y + 12, 15, 2);
  }

  // Draw Iron-Banded Treasure Chest
  drawDq3Chest(ctx, x, y) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 2, y + 2, 18, 15);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, 18, 15);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 2, y + 2, 14, 11);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x, y + 5, 18, 2);
    ctx.fillRect(x + 7, y + 4, 4, 4);
  }

  // Draw Merchant Sprite in Purple Robe & Turban
  drawDq3MerchantSprite(ctx, x, y) {
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + 2, y + 8, 14, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 2, y + 12, 14, 3);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 3, y + 2, 12, 8);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 2, y - 2, 14, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 7, y - 1, 4, 3);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 5, y + 7, 8, 2);
  }

  // 3. SPECIALTY PRODUCTION FACTORY (Hearth, Chimney with smoke, Anvil & Craftsman)
  drawDq3SpecialtyFactoryBuilding(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, sFac, tier) {
    const ts = this.tileSize;
    const bx = startTileX * ts;
    const by = startTileY * ts;
    const bw = w * ts;
    const bh = h * ts;

    ctx.save();
    this.drawRoomStonePerimeter(ctx, startTileX, startTileY, w, h, doorTileX, doorTileY, 'north');

    const floorX = (startTileX + 1) * ts;
    const floorY = (startTileY + 1) * ts;
    const floorW = (w - 2) * ts;
    const floorH = (h - 2) * ts;

    ctx.fillStyle = '#27272a';
    ctx.fillRect(floorX, floorY, floorW, floorH);
    for (let fy = floorY; fy < floorY + floorH; fy += 12) {
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(floorX, fy, floorW, 10);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(floorX, fy + 10, floorW, 2);
    }

    // Great Stone Forge
    const frgX = floorX + 6;
    const frgY = floorY + 4;
    const frgW = 34;
    const frgH = 26;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(frgX, frgY, frgW, frgH);
    ctx.fillStyle = '#475569';
    ctx.fillRect(frgX + 2, frgY + 2, frgW - 4, frgH - 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(frgX + 6, frgY + 8, frgW - 12, frgH - 10);

    const flameH = 7 + Math.sin(this.tickCount * 0.3) * 3;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(frgX + 8, frgY + frgH - 2 - flameH, frgW - 16, flameH);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(frgX + 10, frgY + frgH - 2 - flameH * 0.8, frgW - 20, flameH * 0.8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(frgX + 12, frgY + frgH - 2 - flameH * 0.5, frgW - 24, flameH * 0.5);

    // Stone Chimney with Billowing Smoke Puffs
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx + bw - 26, by - 16, 14, 22);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(bx + bw - 26, by - 16, 14, 22);

    for (let smk = 0; smk < 3; smk++) {
      const smokeOffset = (this.tickCount * 0.08 + smk * 3) % 9;
      const smokeRadius = 4 + smokeOffset * 0.7;
      const smokeY = by - 18 - smokeOffset * 3;
      const smokeX = bx + bw - 19 + Math.sin(smokeOffset + smk) * 4;
      const alpha = Math.max(0, 0.65 - smokeOffset * 0.07);

      ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, smokeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy Cast Iron Anvil with Blacksmith Hammer & Glowing Ingot
    const anvX = floorX + floorW - 28;
    const anvY = floorY + 14;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(anvX - 2, anvY + 10, 20, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(anvX, anvY, 16, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(anvX + 1, anvY + 1, 14, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(anvX + 5, anvY - 2, 7, 2);
    // Glowing red-hot iron bar on anvil!
    ctx.fillStyle = '#f97316';
    ctx.fillRect(anvX + 2, anvY, 8, 2);

    // 4. Water Quenching Trough
    ctx.fillStyle = '#451a03';
    ctx.fillRect(floorX + floorW - 30, floorY + floorH - 20, 22, 10);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(floorX + floorW - 28, floorY + floorH - 18, 18, 6);

    // 5. Master Artisan Craftsman NPC
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(floorX + 22, floorY + floorH - 24, 14, 14);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(floorX + 24, floorY + floorH - 22, 10, 12);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(floorX + 23, floorY + floorH - 32, 12, 9);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(floorX + 22, floorY + floorH - 34, 14, 4);

    // 6. Hanging Wooden Factory Sign
    const sgnX = bx + 4;
    const sgnY = by + bh - 16;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sgnX - 2, sgnY + 2, 5, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sgnX + 3, sgnY, 40, 12);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1;
    ctx.strokeRect(sgnX + 3, sgnY, 40, 12);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#fed7aa';
    ctx.textAlign = 'center';
    ctx.fillText('🏭 ' + (sFac.specialtyName ? sFac.specialtyName.substring(0, 4) : '工房'), sgnX + 23, sgnY + 9);

    ctx.restore();
  }

  // 4. ROOFED ICONIC LANDMARK (SFC DQ3 Steep Tile Roof, Lancet Windows, Double Portal & Torches)
  drawDq3LandmarkRoofedBuilding(ctx, startTileX, startTileY, w, h, lm, tier) {
    const ts = this.tileSize;
    const bx = startTileX * ts;
    const by = startTileY * ts;
    const bw = w * ts;
    const bh = h * ts;

    ctx.save();

    // 1. Ground Shadow Beneath the Citadel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh - 2, bw / 2 + 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Ashlar Stone Facade
    const facadeY = by + 34;
    const facadeH = bh - 34;
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx + 4, facadeY, bw - 8, facadeH);

    for (let sy = facadeY; sy < facadeY + facadeH; sy += 10) {
      for (let sx = bx + 4; sx < bx + bw - 8; sx += 18) {
        const off = ((sy - facadeY) % 20 === 0) ? 0 : 9;
        const curX = sx + off;
        if (curX >= bx + bw - 8) continue;
        const curW = Math.min(17, bx + bw - 8 - curX);

        ctx.fillStyle = ((curX + sy) % 7 === 0) ? '#64748b' : '#475569';
        ctx.fillRect(curX, sy, curW, 9);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(curX, sy, curW, 1);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curX, sy + 8, curW, 1);
      }
    }

    // 3. Steep Sloped Gabled Roof with Scalloped Tiles
    const roofColor = lm.color || '#991b1b';
    const roofApexX = bx + bw / 2;
    const roofApexY = by - 4;
    const roofEaveY = by + 36;

    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(roofApexX, roofApexY);
    ctx.lineTo(bx - 4, roofEaveY);
    ctx.lineTo(bx + bw + 4, roofEaveY);
    ctx.closePath();
    ctx.fill();

    for (let ry = roofApexY + 8; ry < roofEaveY; ry += 6) {
      const progress = (ry - roofApexY) / (roofEaveY - roofApexY);
      const halfW = (bw / 2 + 8) * progress;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(roofApexX - halfW, ry);
      ctx.lineTo(roofApexX + halfW, ry);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(roofApexX - halfW + 2, ry - 1);
      ctx.lineTo(roofApexX + halfW - 2, ry - 1);
      ctx.stroke();
    }

    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx - 6, roofEaveY - 2, bw + 12, 4);

    // 4. Golden Spire / Crest atop roof
    ctx.fillStyle = '#fbbf24';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lm.symbol || '⛩️', roofApexX, roofApexY + 8);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(roofApexX, roofApexY + 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // 5. Twin Stained Glass Lancet Windows
    const winY = facadeY + 10;
    const winW = 12;
    const winH = 22;
    const winLeftX = bx + 18;
    const winRightX = bx + bw - 30;

    [winLeftX, winRightX].forEach(wx => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(wx - 2, winY - 2, winW + 4, winH + 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(wx, winY, winW, winH / 3);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(wx, winY + winH / 3, winW, winH / 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(wx, winY + (winH * 2) / 3, winW, winH / 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wx + winW / 2 - 1, winY, 2, winH);
      ctx.fillRect(wx, winY + winH / 2 - 1, winW, 2);
    });

    // 6. Grand Arched Double Portal Entrance at (12, 5)
    const drW = 32;
    const drH = 34;
    const drX = bx + bw / 2 - drW / 2;
    const drY = by + bh - drH;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(drX + drW / 2, drY + 8, drW / 2 + 4, Math.PI, 0);
    ctx.lineTo(drX + drW + 4, drY + drH);
    ctx.lineTo(drX - 4, drY + drH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(drX + drW / 2, drY + 8, drW / 2 + 2, Math.PI, 0);
    ctx.lineTo(drX + drW + 2, drY + drH);
    ctx.lineTo(drX - 2, drY + drH);
    ctx.closePath();
    ctx.fill();

    // Heavy Double Oak Doors
    ctx.fillStyle = '#451a03';
    ctx.fillRect(drX, drY + 8, drW, drH - 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(drX + 2, drY + 10, drW / 2 - 3, drH - 12);
    ctx.fillRect(drX + drW / 2 + 1, drY + 10, drW / 2 - 3, drH - 12);

    ctx.fillStyle = '#fde047';
    ctx.fillRect(drX + 6, drY + 22, 3, 3);
    ctx.fillRect(drX + drW - 9, drY + 22, 3, 3);

    // 7. Flanking Torches with Warm Ambient Glow
    const torchLeftX = drX - 10;
    const torchRightX = drX + drW + 8;
    const torchY = drY + 14;

    [torchLeftX, torchRightX].forEach(tx => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tx, torchY, 4, 8);
      const flm = Math.sin(this.tickCount * 0.4 + tx) * 2;
      ctx.fillStyle = '#f97316';
      ctx.fillRect(tx + 1, torchY - 5 + flm, 3, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(tx + 1.5, torchY - 3 + flm, 2, 3);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
      ctx.beginPath();
      ctx.arc(tx + 2, torchY - 2, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    // 8. Stone Portico Entrance Steps leading directly onto the street
    ctx.fillStyle = '#64748b';
    ctx.fillRect(drX - 6, by + bh - 2, drW + 12, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(drX - 6, by + bh - 2, drW + 12, 1);

    // 9. Elegant Regal Name Ribbon atop facade
    ctx.font = 'bold 9px monospace';
    const tagW = Math.max(88, ctx.measureText(lm.name).width + 20);
    const tagX = bx + bw / 2 - tagW / 2;
    const tagY = facadeY - 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(tagX, tagY, tagW, 14);
    ctx.strokeStyle = lm.color || '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tagX, tagY, tagW, 14);
    ctx.fillStyle = lm.color || '#fbbf24';
    ctx.fillText('🏛️ ' + lm.name.substring(0, 10), bx + bw / 2, tagY + 10);

    ctx.restore();
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

  // Draw 2D Retro Player Sprite (Ultra-Fine 4x Micro-Density DQ Hero with Crisp Dark Outlines & Rich Fabrics)
  renderPlayerSprite(ctx, px, py, dir, frame) {
    ctx.save();
    const cx = px + this.tileSize / 2;
    const cy = py + this.tileSize / 2;
    const isStep = (frame % 2 !== 0);

    // 1. Soft Oval Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, py + this.tileSize - 3, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ==========================================
    // DIRECTION: DOWN (Facing Camera)
    // ==========================================
    if (dir === 'down') {
      // 1. Red Velvet Cape (Cascading on both flanks with crisp dark outline)
      ctx.fillStyle = '#0f172a'; // Dark Cape Outline
      ctx.fillRect(cx - 11, py + 11, 22, 15);

      ctx.fillStyle = '#7f1d1d'; // Deep shadow velvet
      ctx.fillRect(cx - 10, py + 12, 20, 13);
      ctx.fillStyle = '#b91c1c'; // Midtone crimson
      ctx.fillRect(cx - 9, py + 13, 18, 11);
      ctx.fillStyle = '#dc2626'; // Vibrant red body
      ctx.fillRect(cx - 8, py + 14, 16, 9);
      ctx.fillStyle = '#ef4444'; // Flank sunlight highlights
      ctx.fillRect(cx - 9, py + 14, 2, 8);
      ctx.fillRect(cx + 7, py + 14, 2, 8);

      // 2. Royal Blue Tunic with Crisp Outline & Gold Embroidery
      ctx.fillStyle = '#0f172a'; // Tunic Outline
      ctx.fillRect(cx - 8, py + 10, 16, 14);

      ctx.fillStyle = '#1e3a8a'; // Deep Indigo shadow
      ctx.fillRect(cx - 7, py + 11, 14, 12);
      ctx.fillStyle = '#2563eb'; // Royal blue tunic fabric
      ctx.fillRect(cx - 6, py + 12, 12, 10);
      ctx.fillStyle = '#3b82f6'; // Chest fold highlight
      ctx.fillRect(cx - 4, py + 13, 8, 3);

      // Detailed Golden Heraldic Cross / Eagle on Chest
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 1.5, py + 13, 3, 6);
      ctx.fillRect(cx - 3.5, py + 15, 7, 2);
      ctx.fillStyle = '#fde047'; // Gleaming gold core
      ctx.fillRect(cx - 1, py + 13.5, 2, 5);
      ctx.fillRect(cx - 3, py + 15.5, 6, 1);

      // Metallic Gold Shoulder Pauldrons (Left & Right)
      ctx.fillStyle = '#0f172a'; // Outline
      ctx.fillRect(cx - 10, py + 9, 5, 5);
      ctx.fillRect(cx + 5, py + 9, 5, 5);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 9, py + 10, 3, 3);
      ctx.fillRect(cx + 6, py + 10, 3, 3);
      ctx.fillStyle = '#fef08a'; // Specular gleam
      ctx.fillRect(cx - 9, py + 10, 2, 1.5);
      ctx.fillRect(cx + 6, py + 10, 2, 1.5);

      // Dual Leather Belts with Studs & Brass Buckle
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 6, py + 17, 12, 3.5);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 5, py + 18, 10, 1.5);
      // Gold Buckle
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 2.5, py + 16.5, 5, 4.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 2, py + 17, 4, 3.5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 1, py + 18, 2, 1.5);

      // Silver Broadsword Scabbard on Left Hip (Blue Gem Pommel)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 10, py + 15, 4, 11);
      ctx.fillStyle = '#64748b'; // Scabbard body
      ctx.fillRect(cx - 9, py + 16, 2, 9);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx - 9, py + 16, 1, 9);
      // Gold Hilt & Crossguard
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 11, py + 14, 5, 2.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 10, py + 14, 3, 1.5);
      ctx.fillStyle = '#2563eb'; // Sapphire pommel
      ctx.fillRect(cx - 9.5, py + 13, 2, 2);

      // 3. Head & Face (3-tone skin shading with jawline shadow)
      ctx.fillStyle = '#0f172a'; // Head outline
      ctx.fillRect(cx - 6, py + 3, 12, 9);
      ctx.fillStyle = '#fed7aa'; // Base skin
      ctx.fillRect(cx - 5, py + 4, 10, 7.5);
      ctx.fillStyle = '#fdba74'; // Chin / neck contour shadow
      ctx.fillRect(cx - 4, py + 10, 8, 1.5);
      ctx.fillStyle = '#fff7ed'; // Cheek highlight
      ctx.fillRect(cx - 4, py + 7, 2, 2);
      ctx.fillRect(cx + 2, py + 7, 2, 2);

      // 4. Hero's Chestnut Spiky Hair (Fine 10-lock detail)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, py, 16, 6);
      ctx.fillRect(cx - 9, py + 2, 3, 7);
      ctx.fillRect(cx + 6, py + 2, 3, 7);

      ctx.fillStyle = '#451a03'; // Deep hair root
      ctx.fillRect(cx - 7, py + 1, 14, 4);
      ctx.fillStyle = '#78350f'; // Hair body
      ctx.fillRect(cx - 6, py + 1.5, 12, 3);
      ctx.fillStyle = '#b45309'; // Sunlight sheen on top
      ctx.fillRect(cx - 4, py + 1, 8, 1.5);

      // 5. Golden Winged Tiara / Circlet with Radiant Emerald Gem
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 7, py + 3.5, 14, 2.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 6, py + 3.5, 12, 1.5);
      // Winged tips
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 8, py + 2.5, 2, 3);
      ctx.fillRect(cx + 6, py + 2.5, 2, 3);
      // Emerald Center Gem
      ctx.fillStyle = '#065f46';
      ctx.fillRect(cx - 1.5, py + 2.5, 3, 3.5);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cx - 1, py + 3, 2, 2.5);
      ctx.fillStyle = '#ecfdf5'; // Specular star sparkle
      ctx.fillRect(cx - 1, py + 3, 1, 1);

      // 6. Expressive Anime Eyes (Pupil, White Sclera, Catchlight)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 4.5, py + 6.5, 2.5, 3);
      ctx.fillRect(cx + 2,   py + 6.5, 2.5, 3);
      ctx.fillStyle = '#ffffff'; // Eye sclera
      ctx.fillRect(cx - 4.5, py + 7, 1, 1.5);
      ctx.fillRect(cx + 3.5, py + 7, 1, 1.5);
      ctx.fillStyle = '#ffffff'; // Catchlight dot
      ctx.fillRect(cx - 3.5, py + 6.5, 1, 1);
      ctx.fillRect(cx + 2,   py + 6.5, 1, 1);

      // 7. Leather Travel Boots with Dynamic Walking Motion
      ctx.fillStyle = '#0f172a'; // Boot outline
      if (!isStep) {
        ctx.fillRect(cx - 6, py + 23, 5, 7);
        ctx.fillRect(cx + 1, py + 22, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 5.5, py + 23.5, 4, 6);
        ctx.fillRect(cx + 1.5, py + 22.5, 4, 6);
        ctx.fillStyle = '#78350f'; // Cuff
        ctx.fillRect(cx - 5.5, py + 23.5, 4, 1.5);
        ctx.fillRect(cx + 1.5, py + 22.5, 4, 1.5);
      } else {
        ctx.fillRect(cx - 6, py + 22, 5, 7);
        ctx.fillRect(cx + 1, py + 23, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 5.5, py + 22.5, 4, 6);
        ctx.fillRect(cx + 1.5, py + 23.5, 4, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 5.5, py + 22.5, 4, 1.5);
        ctx.fillRect(cx + 1.5, py + 23.5, 4, 1.5);
      }
    }
    // ==========================================
    // DIRECTION: UP (Facing Back / Away)
    // ==========================================
    else if (dir === 'up') {
      // Magnificent Full Red Velvet Cape (Full back drape with 4-shade fold creases)
      ctx.fillStyle = '#0f172a'; // Outline
      ctx.fillRect(cx - 10, py + 9, 20, 18);

      ctx.fillStyle = '#450a0a'; // Deep fold crevices
      ctx.fillRect(cx - 9, py + 10, 18, 16);
      ctx.fillStyle = '#7f1d1d'; // Shadow drape
      ctx.fillRect(cx - 8, py + 11, 16, 14);
      ctx.fillStyle = '#b91c1c'; // Midtone velvet
      ctx.fillRect(cx - 7, py + 12, 14, 12);
      ctx.fillStyle = '#dc2626'; // Red body
      ctx.fillRect(cx - 5, py + 12, 10, 11);
      ctx.fillStyle = '#ef4444'; // Fabric highlights
      ctx.fillRect(cx - 3, py + 13, 6, 9);

      // Gold Shoulder Brooch Clasps
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 9, py + 9.5, 3.5, 3.5);
      ctx.fillRect(cx + 5.5, py + 9.5, 3.5, 3.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 8.5, py + 10, 2.5, 2.5);
      ctx.fillRect(cx + 6, py + 10, 2.5, 2.5);

      // Spiky Hair Back Contours
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, py + 1, 16, 9);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 7, py + 2, 14, 7);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 6, py + 3, 12, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - 4, py + 2, 8, 2.5);

      // Boots stepping forward
      ctx.fillStyle = '#0f172a';
      if (!isStep) {
        ctx.fillRect(cx - 6, py + 23, 5, 7);
        ctx.fillRect(cx + 1, py + 21, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 5.5, py + 23.5, 4, 6);
        ctx.fillRect(cx + 1.5, py + 21.5, 4, 6);
      } else {
        ctx.fillRect(cx - 6, py + 21, 5, 7);
        ctx.fillRect(cx + 1, py + 23, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 5.5, py + 21.5, 4, 6);
        ctx.fillRect(cx + 1.5, py + 23.5, 4, 6);
      }
    }
    // ==========================================
    // DIRECTION: LEFT (Side Profile)
    // ==========================================
    else if (dir === 'left') {
      // Red Cape Billowing Back Right with Outline
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx + 1, py + 11, 10, 14);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(cx + 2, py + 12, 8, 12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx + 3, py + 13, 6, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx + 4, py + 14, 4, 8);

      // Blue Tunic Profile
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, py + 10, 11, 14);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(cx - 5, py + 11, 9, 12);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(cx - 4, py + 12, 7, 10);

      // Gold Pauldron
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 3.5, py + 9.5, 5, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 3, py + 10, 4, 3);

      // Leather Belt & Buckle
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 5, py + 17, 9, 3.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 4, py + 17, 3, 3.5);

      // Sword Scabbard Tilted Back
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 2, py + 16, 10, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 1, py + 17, 8, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 4, py + 16, 4, 3.5); // Hilt

      // Head & Profile Face
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 7, py + 3, 10, 9);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(cx - 6, py + 4, 8, 7.5);
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(cx - 4, py + 10, 5, 1.5);

      // Hair Spikes Blowing Right
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 7, py, 12, 6);
      ctx.fillRect(cx + 2, py + 2, 6, 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 6, py + 1, 10, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 5, py + 2, 8, 3);

      // Circlet & Emerald on Forehead
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 6.5, py + 3.5, 8, 2);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cx - 6.5, py + 3.5, 2.5, 2.5);

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 5.5, py + 6.5, 2.5, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 5.5, py + 6.5, 1, 1);

      // Stepping Boots
      ctx.fillStyle = '#0f172a';
      if (!isStep) {
        ctx.fillRect(cx - 7, py + 23, 5, 7);
        ctx.fillRect(cx + 1, py + 22, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 6.5, py + 23.5, 4, 6);
        ctx.fillRect(cx + 1.5, py + 22.5, 4, 6);
      } else {
        ctx.fillRect(cx - 3, py + 22, 5, 7);
        ctx.fillRect(cx - 7, py + 23, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 2.5, py + 22.5, 4, 6);
        ctx.fillRect(cx - 6.5, py + 23.5, 4, 6);
      }
    }
    // ==========================================
    // DIRECTION: RIGHT (Side Profile)
    // ==========================================
    else if (dir === 'right') {
      // Red Cape Billowing Back Left
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 11, py + 11, 10, 14);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(cx - 10, py + 12, 8, 12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 9, py + 13, 6, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 8, py + 14, 4, 8);

      // Blue Tunic Profile
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 5, py + 10, 11, 14);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(cx - 4, py + 11, 9, 12);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(cx - 3, py + 12, 7, 10);

      // Gold Pauldron
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 1.5, py + 9.5, 5, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 1, py + 10, 4, 3);

      // Leather Belt
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 4, py + 17, 9, 3.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx + 1, py + 17, 3, 3.5);

      // Sword Scabbard Tilted Back Left
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, py + 16, 10, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 7, py + 17, 8, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx, py + 16, 4, 3.5);

      // Head & Profile Face
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 3, py + 3, 10, 9);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(cx - 2, py + 4, 8, 7.5);
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(cx - 1, py + 10, 5, 1.5);

      // Hair Spikes Blowing Left
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 5, py, 12, 6);
      ctx.fillRect(cx - 8, py + 2, 6, 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 4, py + 1, 10, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 3, py + 2, 8, 3);

      // Circlet & Emerald on Forehead
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 1.5, py + 3.5, 8, 2);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cx + 4, py + 3.5, 2.5, 2.5);

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx + 3, py + 6.5, 2.5, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 4.5, py + 6.5, 1, 1);

      // Stepping Boots
      ctx.fillStyle = '#0f172a';
      if (!isStep) {
        ctx.fillRect(cx + 2, py + 23, 5, 7);
        ctx.fillRect(cx - 6, py + 22, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx + 2.5, py + 23.5, 4, 6);
        ctx.fillRect(cx - 5.5, py + 22.5, 4, 6);
      } else {
        ctx.fillRect(cx - 2, py + 22, 5, 7);
        ctx.fillRect(cx + 2, py + 23, 5, 7);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 1.5, py + 22.5, 4, 6);
        ctx.fillRect(cx + 2.5, py + 23.5, 4, 6);
      }
    }

    ctx.restore();
  }

  // Draw NPC Sprite with Ultra-Fine 4x Micro-Density Costumes (Aide, Guards, Engineers)
  renderNpcSprite(ctx, nx, ny, spriteType) {
    ctx.save();
    const cx = nx + this.tileSize / 2;
    const cy = ny + this.tileSize / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, ny + this.tileSize - 3, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const isGuard = (spriteType === 'npc_guard');
    const isEngineer = (spriteType === 'npc_engineer');
    const isHacker = (spriteType === 'npc_hacker');

    // ==========================================
    // 1. GUARD / KNIGHT (黒服の用心棒 / 警備兵)
    // ==========================================
    if (isGuard) {
      // Plate Armor Body with Dark Outline
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, ny + 9, 16, 15);

      ctx.fillStyle = '#1e293b'; // Shadow steel
      ctx.fillRect(cx - 7, ny + 10, 14, 13);
      ctx.fillStyle = '#475569'; // Midtone steel
      ctx.fillRect(cx - 6, ny + 11, 12, 11);
      ctx.fillStyle = '#94a3b8'; // Specular cuirass shine
      ctx.fillRect(cx - 3, ny + 12, 6, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, ny + 13, 2, 4);

      // Red Tabbard Trim
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 7, ny + 20, 14, 3);

      // Long Halberd Spear in Right Hand (Steel spearhead with pennant)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx + 6, ny - 7, 5, 34);
      ctx.fillStyle = '#78350f'; // Shaft
      ctx.fillRect(cx + 7, ny - 2, 2, 28);
      ctx.fillStyle = '#dc2626'; // Ribbon
      ctx.fillRect(cx + 8, ny + 2, 5, 3);
      ctx.fillStyle = '#cbd5e1'; // Silver blade
      ctx.fillRect(cx + 6, ny - 6, 4, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 7, ny - 6, 2, 3);

      // Knight Sallet Helmet with Scarlet Plume
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 7, ny + 1, 14, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 6, ny + 2, 12, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 5, ny + 2, 10, 3);

      // Eye Slit Visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 4.5, ny + 6, 9, 2);

      // Scarlet Helmet Plume
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(cx - 2.5, ny - 5, 5, 7);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 2, ny - 4, 4, 5);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(cx - 1, ny - 4, 2, 3);

      // Armored Greaves / Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, ny + 23, 5, 7);
      ctx.fillRect(cx + 1, ny + 23, 5, 7);
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 5.5, ny + 23.5, 4, 6);
      ctx.fillRect(cx + 1.5, ny + 23.5, 4, 6);
    }
    // ==========================================
    // 2. ENGINEER (秋葉原工学技師)
    // ==========================================
    else if (isEngineer) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, ny + 9, 16, 15);

      ctx.fillStyle = '#d97706'; // Work shirt
      ctx.fillRect(cx - 7, ny + 10, 14, 13);
      ctx.fillStyle = '#78350f'; // Heavy apron
      ctx.fillRect(cx - 5, ny + 12, 10, 11);
      ctx.fillStyle = '#fde047'; // Brass tool
      ctx.fillRect(cx + 1, ny + 14, 2, 4);

      ctx.fillStyle = '#fed7aa'; // Face
      ctx.fillRect(cx - 5, ny + 4, 10, 8);

      // Brown Cap with Brass Goggles
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 7, ny, 14, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 6, ny + 1, 12, 4);
      // Goggles
      ctx.fillStyle = '#eab308';
      ctx.fillRect(cx - 5, ny + 3, 4, 3);
      ctx.fillRect(cx + 1, ny + 3, 4, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 4, ny + 4, 2, 1.5);
      ctx.fillRect(cx + 2, ny + 4, 2, 1.5);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 4, ny + 7, 2, 2);
      ctx.fillRect(cx + 2, ny + 7, 2, 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 4, ny + 10, 8, 2); // Beard

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, ny + 23, 5, 7);
      ctx.fillRect(cx + 1, ny + 23, 5, 7);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 5.5, ny + 23.5, 4, 6);
      ctx.fillRect(cx + 1.5, ny + 23.5, 4, 6);
    }
    // ==========================================
    // 3. DIGNITARY / NIGHT EMPEROR'S AIDE (夜皇の側近)
    // ==========================================
    else {
      // Crimson Double-Breasted Commander Coat with Dark Outline
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, ny + 9, 16, 15);

      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(cx - 7, ny + 10, 14, 13);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 6, ny + 11, 12, 11);

      // Golden Braided Aiguillette & Double Row of Frogging Buttons
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 1, ny + 12, 2, 9);
      ctx.fillRect(cx - 5, ny + 13, 10, 1.5);
      ctx.fillRect(cx - 5, ny + 16, 10, 1.5);
      ctx.fillRect(cx - 5, ny + 19, 10, 1.5);

      // Gold Epaulettes with Tassels on shoulders
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 9, ny + 9.5, 4, 4.5);
      ctx.fillRect(cx + 5, ny + 9.5, 4, 4.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 8.5, py + 10, 3, 3);
      ctx.fillRect(cx + 5.5, py + 10, 3, 3);

      // White Dress Gloves
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 8, ny + 17, 3, 4);
      ctx.fillRect(cx + 5, ny + 17, 3, 4);

      // Head & Distinguished Face
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, ny + 3, 12, 9);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(cx - 5, ny + 4, 10, 7.5);
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(cx - 4, ny + 10, 8, 1.5);

      // Black Peaked Military Cap with Gold Cockade & Shiny Visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 7, ny, 14, 6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 6, ny + 1, 12, 3.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 6, ny + 4, 12, 1.5); // Gold cockade band
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 7.5, ny + 5.5, 15, 2); // Black visor

      // Sharp Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 4, ny + 7, 2, 2.5);
      ctx.fillRect(cx + 2, ny + 7, 2, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, ny + 7, 1, 1);
      ctx.fillRect(cx + 2, ny + 7, 1, 1);

      // Polished Black Riding Boots with Leather Gloss
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 6, ny + 23, 5, 7);
      ctx.fillRect(cx + 1, ny + 23, 5, 7);
      ctx.fillStyle = '#64748b'; // Leather gloss reflection
      ctx.fillRect(cx - 5, ny + 24, 1, 4);
      ctx.fillRect(cx + 2, ny + 24, 1, 4);
    }

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
        const pop = this.getRegionPopulation(regName);
        const tier = this.getTownTier(pop);
        const tierBadges = {
          1: { name: 'Lv.1 開拓前線キャンプ', color: '#94a3b8', stars: '★☆☆☆☆☆☆' },
          2: { name: 'Lv.2 復興集落・前哨砦', color: '#a3e635', stars: '★★☆☆☆☆☆' },
          3: { name: 'Lv.3 小規模要塞宿場町', color: '#22c55e', stars: '★★★☆☆☆☆' },
          4: { name: 'Lv.4 地方中核城塞都市', color: '#38bdf8', stars: '★★★★☆☆☆' },
          5: { name: 'Lv.5 繁栄大都市', color: '#818cf8', stars: '★★★★★☆☆' },
          6: { name: 'Lv.6 超高度メガロポリス', color: '#c084fc', stars: '★★★★★★☆' },
          7: { name: 'Lv.7 至高首都要塞', color: '#fbbf24', stars: '★★★★★★★' }
        };
        const tInfo = tierBadges[tier] || tierBadges[4];
        const tierBadge = `<span style="font-size:11px; padding:2px 8px; border-radius:10px; background:rgba(0,0,0,0.5); color:${tInfo.color}; margin-left:8px; border:1px solid ${tInfo.color};">${tInfo.name} [${tInfo.stars}] (人口: ${(pop/10000).toFixed(1)}万人)</span>`;
        locElem.innerHTML = `🏯 ${area?.name || '拠点'} ${tierBadge}`;
      }
    }

    if (atmoElem) {
      if (this.mode === 'overworld') {
        atmoElem.textContent = '大東京の荒野、首都高の残骸、そして点在する53の独立城塞都市群。';
      } else {
        // Distinctive Town Rule / Taboo (Golden Rule #3)
        const area = this.currentArea;
        let ruleText = "【通常秩序】旧紙幣と物資の交換が推奨されている。";
        const aName = area?.name || '';
        if (aName.includes('秋葉原')) ruleText = "⚠️【強電磁波領域】電子・プラズマ兵器のみ稼働可能。ジャンク部品が法定通貨。";
        else if (aName.includes('新宿')) ruleText = "🏮【夜間歓楽令】軍資金と旧紙幣がすべての取引を支配。夜の動員力は東京一。";
        else if (aName.includes('渋谷')) ruleText = "📡【電脳スクランブル】情報屋の暗号解読で裏ルートが開通する。";
        else if (aName.includes('銀座')) ruleText = "🏦【富裕審査】旧紙幣高額取引のみ許可。超一級装備と金塊が流通。";
        else if (aName.includes('浅草')) ruleText = "⛩️【機械禁忌】信仰符（お札）の霊力加護が必須。伝統工芸品が重宝される。";
        else if (aName.includes('千代田')) ruleText = "🏰【都庁直轄統制】通行許可証の検問が厳格。軍規違反者は即時拘束。";
        else if (aName.includes('八王子') || aName.includes('奥多摩')) ruleText = "🌲【山岳配給制】食糧配給切符による物資交換。険しい山河が外敵を阻む。";

        atmoElem.innerHTML = `<span style="color:#fbbf24; font-weight:bold;">${ruleText}</span> — <span style="color:#94a3b8;">${area?.atmosphere || ''}</span>`;
      }
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

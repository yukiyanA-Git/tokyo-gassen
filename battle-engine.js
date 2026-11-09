// FF-Style 3v3 Command Battle Engine with Enhanced Pacing & Detailed Event Reporting

class BattleEngine {
  constructor(playerPartyData, enemyPartyData, options = {}) {
    this.playerTroops = options.playerTroops || 1500;
    this.enemyTroops = options.enemyTroops || 1000;
    this.targetRegion = options.targetRegion || null;
    this.sourceRegion = options.sourceRegion || null;
    this.onEvent = options.onEvent || (() => {});
    this.onBattleEnd = options.onBattleEnd || (() => {});

    const playerTroopMod = Math.min(1.4, 1.0 + (this.playerTroops / 5000) * 0.35);
    const enemyTroopMod = Math.min(1.4, 1.0 + (this.enemyTroops / 5000) * 0.35);

    this.allies = playerPartyData.map((data, idx) => this.initUnit(data, 'ally', idx, playerTroopMod));
    this.enemies = enemyPartyData.map((data, idx) => this.initUnit(data, 'enemy', idx, enemyTroopMod));

    this.turnOrder = [];
    this.currentActorIndex = 0;
    this.state = 'INITIALIZING';
    this.isOver = false;
  }

  initUnit(data, team, slot, modifier) {
    const maxHp = Math.round(data.maxHp * modifier);
    const attack = Math.round(data.attack * modifier);
    const defense = Math.round(data.defense * modifier);

    // Front row vs Back row (前列・後列の陣形)
    // Healers, mages, snipers, and debuffers default to back row
    const isBackRowRole = ['術士/電脳砲撃', 'スナイパー/航空支援', '遠隔狙撃手', 'デバッファー/電子戦', '支援/資金補給', '忍術アサシン'].some(r => data.role && data.role.includes(r));
    const defaultRow = isBackRowRole || slot === 2 ? 'back' : 'front';

    return {
      id: data.id,
      name: data.name,
      title: data.title,
      avatar: data.avatar,
      role: data.role,
      team: team,
      slot: slot,
      row: defaultRow, // 'front' | 'back'
      maxHp: maxHp,
      hp: maxHp,
      maxMp: data.maxMp,
      mp: data.maxMp,
      attack: attack,
      baseAttack: attack,
      defense: defense,
      baseDefense: defense,
      speed: data.speed,
      skills: JSON.parse(JSON.stringify(data.skills || [])),
      isDefending: false,
      isStunned: false,
      isDead: false,
      buffTurns: 0
    };
  }

  start() {
    this.buildTurnOrder();
    this.advanceTurn();
  }

  buildTurnOrder() {
    const units = [...this.allies, ...this.enemies].filter(u => !u.isDead);
    units.sort((a, b) => (b.speed + Math.random() * 5) - (a.speed + Math.random() * 5));
    this.turnOrder = units;
    this.currentActorIndex = 0;
  }

  getCurrentActor() {
    return this.turnOrder[this.currentActorIndex] || null;
  }

  advanceTurn() {
    if (this.checkBattleEnd()) return;

    if (this.currentActorIndex >= this.turnOrder.length) {
      this.buildTurnOrder();
    }

    const actor = this.getCurrentActor();
    if (!actor || actor.isDead) {
      this.currentActorIndex++;
      this.advanceTurn();
      return;
    }

    actor.isDefending = false;

    if (actor.isStunned) {
      actor.isStunned = false;
      this.onEvent({
        type: 'log',
        text: `⚡ ${actor.name} はスタンから回復した！`
      });
      this.currentActorIndex++;
      setTimeout(() => this.advanceTurn(), 1400);
      return;
    }

    if (actor.buffTurns > 0) {
      actor.buffTurns--;
      if (actor.buffTurns === 0) {
        actor.attack = actor.baseAttack;
        actor.defense = actor.baseDefense;
        this.onEvent({
          type: 'log',
          text: `強化効果が切れた: [${actor.name}]`
        });
      }
    }

    const sideTag = actor.team === 'ally' ? '【味方】' : '【敵】';
    const rowTag = actor.row === 'back' ? '(後列)' : '(前列)';
    const text = `▶ ${sideTag} ${actor.name}${rowTag} のターン！ 行動を選択中……`;

    if (actor.team === 'ally') {
      this.state = 'PLAYER_INPUT';
      this.onEvent({
        type: 'turn_start',
        actor: actor,
        text: text
      });
    } else {
      this.state = 'ENEMY_THINKING';
      this.onEvent({
        type: 'enemy_turn_start',
        actor: actor,
        text: text
      });

      // Increased enemy decision pause (1.6s) so player clearly perceives who is about to act
      setTimeout(() => {
        this.executeAiTurn(actor);
      }, 1600);
    }
  }

  executePlayerAttack(targetIndex) {
    const actor = this.getCurrentActor();
    if (!actor) return;
    const target = this.enemies[targetIndex];
    if (!target || target.isDead) return;

    this.state = 'EXECUTING';
    this.performAttack(actor, target);
  }

  executePlayerSkill(skillId, targetIndex) {
    const actor = this.getCurrentActor();
    if (!actor) return;
    const skill = actor.skills.find(s => s.id === skillId);
    if (!skill || actor.mp < skill.mp) return;

    this.state = 'EXECUTING';
    actor.mp -= skill.mp;
    this.performSkill(actor, skill, targetIndex);
  }

  executePlayerDefend() {
    const actor = this.getCurrentActor();
    if (!actor) return;
    this.state = 'EXECUTING';
    actor.isDefending = true;
    this.onEvent({
      type: 'action',
      actionType: 'defend',
      actor: actor,
      text: `🛡️ [${actor.name}] は身構えた！（被ダメージ半減）`
    });

    setTimeout(() => {
      if (this.checkBattleEnd()) return;
      this.currentActorIndex++;
      this.advanceTurn();
    }, 1400);
  }

  attemptEscape() {
    const actor = this.getCurrentActor();
    if (!actor) return { success: false, reason: 'invalid' };

    if (this.targetRegion && this.targetRegion.isCapital) {
      return { success: false, reason: 'capital', text: '⛔ 敵大名の本拠地決戦のため、退却は許されない！' };
    }

    const success = Math.random() < 0.70;
    if (success) {
      this.isOver = true;
      return { success: true, text: '🏃 部隊は全軍無事に戦線を離脱した！' };
    } else {
      this.state = 'EXECUTING';
      this.onEvent({
        type: 'log',
        text: '⚠️ 敵の包囲網が厳しく、逃げられなかった！（行動順を消費）'
      });

      setTimeout(() => {
        if (this.checkBattleEnd()) return;
        this.currentActorIndex++;
        this.advanceTurn();
      }, 1600);

      return { success: false, reason: 'caught', text: '⚠️ 敵の包囲網が厳しく逃げられなかった！' };
    }
  }

  performAttack(actor, target) {
    let damage = Math.round((actor.attack * 1.5) - (target.defense * 0.45) + (Math.random() * 16 - 8));
    
    // Front Row / Back Row Defense Mechanics:
    // If target is in back row and there are alive allies in front row, melee attacks suffer 50% damage reduction
    const targetTeam = target.team === 'ally' ? this.allies : this.enemies;
    const hasAliveFrontRow = targetTeam.some(u => u.row === 'front' && !u.isDead);
    let rowReductionText = '';
    if (target.row === 'back' && hasAliveFrontRow) {
      damage = Math.round(damage * 0.5);
      rowReductionText = '（後列ガード: ダメージ半減！）';
    }

    if (target.isDefending) damage = Math.round(damage * 0.5);
    damage = Math.max(15, damage);

    target.hp = Math.max(0, target.hp - damage);
    if (target.hp === 0) target.isDead = true;

    const sideTag = actor.team === 'ally' ? '【味方】' : '【敵】';
    const text = `⚔️ ${sideTag} ${actor.name} のこうげき！ ➔ ${target.name} に ${damage} のダメージ！ ${rowReductionText}`;

    this.onEvent({
      type: 'action',
      actionType: 'attack',
      actor: actor,
      target: target,
      damage: damage,
      text: text
    });

    // 1.8s delay before next turn so player can comfortably read and observe hit
    setTimeout(() => {
      if (this.checkBattleEnd()) return;
      this.currentActorIndex++;
      this.advanceTurn();
    }, 1800);
  }

  performSkill(actor, skill, targetIndex) {
    const targets = [];
    const isEnemyTarget = skill.target.startsWith('enemy');
    const opponentTeam = actor.team === 'ally' ? this.enemies : this.allies;
    const friendlyTeam = actor.team === 'ally' ? this.allies : this.enemies;

    if (skill.target === 'enemy_single') {
      const t = (targetIndex !== undefined && opponentTeam[targetIndex] && !opponentTeam[targetIndex].isDead)
        ? opponentTeam[targetIndex]
        : opponentTeam.find(e => !e.isDead);
      if (t) targets.push(t);
    } else if (skill.target === 'enemy_all') {
      opponentTeam.filter(e => !e.isDead).forEach(e => targets.push(e));
    } else if (skill.target === 'ally_single') {
      const a = (targetIndex !== undefined && friendlyTeam[targetIndex] && !friendlyTeam[targetIndex].isDead)
        ? friendlyTeam[targetIndex]
        : friendlyTeam.find(al => !al.isDead);
      if (a) targets.push(a);
    } else if (skill.target === 'ally_all') {
      friendlyTeam.filter(a => !a.isDead).forEach(a => targets.push(a));
    }

    const sideTag = actor.team === 'ally' ? '【味方】' : '【敵】';
    const targetNames = targets.map(t => t.name).join('・');
    const text = `✨ ${sideTag} ${actor.name} の【${skill.name}】！ ➔ 対象: ${targetNames}`;

    this.onEvent({
      type: 'skill_start',
      actor: actor,
      skill: skill,
      targets: targets,
      text: text
    });

    targets.forEach(t => {
      if (skill.type === 'damage' || skill.type === 'damage_all') {
        let dmg = Math.round((actor.attack * skill.power * 1.5) - (t.defense * 0.35) + (Math.random() * 20 - 10));
        if (t.isDefending) dmg = Math.round(dmg * 0.5);
        dmg = Math.max(25, dmg);
        t.hp = Math.max(0, t.hp - dmg);
        if (t.hp === 0) t.isDead = true;
        this.onEvent({ type: 'damage_pop', target: t, damage: dmg });
      } else if (skill.type === 'heal' || skill.type === 'heal_all') {
        const heal = Math.min(t.maxHp - t.hp, Math.round(skill.power * (1.0 + Math.random() * 0.2)));
        t.hp += heal;
        this.onEvent({ type: 'heal_pop', target: t, heal: heal });
      } else if (skill.type === 'buff_atk') {
        t.attack = Math.round(t.baseAttack * (1.0 + skill.power));
        t.buffTurns = 2;
      } else if (skill.type === 'buff_def') {
        t.defense = Math.round(t.baseDefense * (1.0 + skill.power));
        t.buffTurns = 2;
      } else if (skill.type === 'debuff_all') {
        t.defense = Math.max(10, Math.round(t.defense * 0.7));
        t.attack = Math.max(10, Math.round(t.attack * 0.8));
      } else if (skill.type === 'stun') {
        t.isStunned = true;
      }
    });

    this.onEvent({
      type: 'action',
      actionType: 'skill',
      actor: actor,
      skill: skill,
      targets: targets,
      text: text
    });

    setTimeout(() => {
      if (this.checkBattleEnd()) return;
      this.currentActorIndex++;
      this.advanceTurn();
    }, 1400);
  }

  executeAiTurn(actor) {
    if (this.isOver || actor.isDead) {
      this.currentActorIndex++;
      this.advanceTurn();
      return;
    }

    const aliveAllies = this.allies.filter(a => !a.isDead);
    const aliveEnemies = this.enemies.filter(e => !e.isDead);

    if (aliveAllies.length === 0) return;

    const lowTeammate = aliveEnemies.find(e => e.hp < e.maxHp * 0.35);
    const healSkill = actor.skills.find(s => s.type === 'heal' || s.type === 'heal_all');

    if (lowTeammate && healSkill && actor.mp >= healSkill.mp) {
      actor.mp -= healSkill.mp;
      const slot = healSkill.target === 'ally_single' ? lowTeammate.slot : 0;
      this.performSkill(actor, healSkill, slot);
      return;
    }

    const attackSkill = actor.skills.find(s => s.type.startsWith('damage') || s.type.startsWith('debuff'));
    if (attackSkill && actor.mp >= attackSkill.mp && Math.random() > 0.45) {
      actor.mp -= attackSkill.mp;
      const target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
      this.performSkill(actor, attackSkill, target.slot);
      return;
    }

    const target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
    this.performAttack(actor, target);
  }

  checkBattleEnd() {
    if (this.isOver) return true;

    const allAlliesDead = this.allies.every(a => a.isDead);
    const allEnemiesDead = this.enemies.every(e => e.isDead);

    if (allEnemiesDead) {
      this.isOver = true;
      this.state = 'VICTORY';
      this.onBattleEnd({
        won: true,
        remainingAllies: this.allies.filter(a => !a.isDead),
        targetRegion: this.targetRegion,
        sourceRegion: this.sourceRegion
      });
      return true;
    } else if (allAlliesDead) {
      this.isOver = true;
      this.state = 'DEFEAT';
      this.onBattleEnd({
        won: false,
        targetRegion: this.targetRegion,
        sourceRegion: this.sourceRegion
      });
      return true;
    }
    return false;
  }
}

if (typeof module !== 'undefined') {
  module.exports = BattleEngine;
  module.exports.BattleEngine = BattleEngine;
}

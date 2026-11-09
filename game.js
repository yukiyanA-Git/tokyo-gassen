// Game Engine & State Management for Tokyo Conquest (with Vassalage, 10% Indemnity, Hero Drafting & Deputy Defense)

if (typeof require !== 'undefined' && typeof FACTION_STARTERS === 'undefined') {
  const chars = require('./characters.js');
  global.CHARACTERS_DB = chars.CHARACTERS_DB;
  global.REGION_RECRUIT_MAP = chars.REGION_RECRUIT_MAP;
  global.FACTION_STARTERS = chars.FACTION_STARTERS;
  global.getStarterHeroesForRegion = chars.getStarterHeroesForRegion;
}

const FACTIONS = {
  chiyoda: {
    id: 'chiyoda',
    name: '千代田都庁軍',
    leader: '都知事 神田総帥',
    title: '中央政権',
    color: '#2563eb',
    accentColor: '#60a5fa',
    description: '首都中枢と官公庁街を掌握する巨大政権。強大な行政力と毎月の税収ボーナスを誇る。',
    bonusText: '毎月の税収 +25%',
    capitalName: '千代田区',
    initialFunds: 12000,
    initialHoldings: ['千代田区']
  },
  shinjuku: {
    id: 'shinjuku',
    name: '新宿不夜城軍',
    leader: '歌舞伎町夜皇',
    title: '不夜城連合',
    color: '#db2777',
    accentColor: '#f472b6',
    description: '超高層ビル街と歓楽街を束ねる電撃武闘勢力。夜の動員力で安価に大兵力を編成できる。',
    bonusText: '募兵コスト 25%OFF / 攻撃力 +15%',
    capitalName: '新宿区',
    initialFunds: 9000,
    initialHoldings: ['新宿区']
  },
  minato: {
    id: 'minato',
    name: '港・湾岸コンツェルン',
    leader: '六本木CEO',
    title: '国際財閥',
    color: '#d97706',
    accentColor: '#fbbf24',
    description: '六本木や品川、ベイエリアの国際企業群を束ねる資本の覇者。巨額の資金と投資開発力が武器。',
    bonusText: '商業開発効果 +50% / 初期資金潤沢',
    capitalName: '港区',
    initialFunds: 18000,
    initialHoldings: ['港区']
  },
  adachi: {
    id: 'adachi',
    name: '城北・足立義勇軍',
    leader: '下町総長',
    title: '下町結束兵団',
    color: '#dc2626',
    accentColor: '#f87171',
    description: '荒川・隅田川沿岸の下町人情と強固な団結を誇る義勇軍。治安が安定し兵員補充が早い。',
    bonusText: '毎月兵力自然補充 +150 / 治安低下が起きにくい',
    capitalName: '足立区',
    initialFunds: 8500,
    initialHoldings: ['足立区']
  },
  musashino: {
    id: 'musashino',
    name: '武蔵野文教軍',
    leader: '吉祥寺賢者',
    title: '文教自治連盟',
    color: '#059669',
    accentColor: '#34d399',
    description: '文化・教育と緑豊かな住環境を愛する自治連盟。民忠が高く、精鋭防衛部隊を擁する。',
    bonusText: '治安度上限100維持 / 兵質ボーナス',
    capitalName: '武蔵野市',
    initialFunds: 9500,
    initialHoldings: ['武蔵野市']
  },
  hachioji: {
    id: 'hachioji',
    name: '八王子山岳衆',
    leader: '多摩の覇王',
    title: '西山要塞軍',
    color: '#7c3aed',
    accentColor: '#a78bfa',
    description: '甲州街道の要衝と広大な多摩丘陵・山岳地帯に陣取る山岳軍団。本拠地は難攻不落を誇る。',
    bonusText: '自領防衛時の防御力 +40%',
    capitalName: '八王子市',
    initialFunds: 10000,
    initialHoldings: ['八王子市']
  },
  neutral: {
    id: 'neutral',
    name: '地方自治警備隊',
    leader: '地元有志連合',
    title: '中立独立区',
    color: '#334155',
    accentColor: '#64748b',
    description: '各地の独立自警団。防衛兵力と地元守備隊が駐留している。',
    bonusText: 'なし',
    initialFunds: 0
  }
};

const REGION_SPECIALTIES = {
  '新宿区': 'サイバー情報チップ',
  '千代田区': '中央官庁特許証',
  '港区': '外資ファンド債権',
  '足立区': '下町人情物資',
  '武蔵野市': '文化文教コンテンツ',
  '八王子市': '多摩天然木材・名水',
  '墨田区': 'スカイツリー電波パーツ',
  '台東区': '上野伝統工芸品',
  '大田区': '羽田航空部品',
  '渋谷区': 'トレンド発信データ',
  '立川市': '広域防災レスキュー物資',
  '町田市': '二重国境特産物',
  '青梅市': '昭和幻影銘菓',
  '奥多摩町': '奥多摩源泉名水',
  '文京区': '学術研究レポート',
  '中央区': '銀座金銀小判',
  '品川区': '東海道流通物資',
  '江東区': '臨海コンテナ物資'
};

// Official Resident Population Data for Tokyo 53 Municipalities (東京都住民基本台帳実数)
const TOKYO_POPULATION_DATA = {
  // 23特別区
  '世田谷区': 940000,
  '練馬区': 743000,
  '大田区': 742000,
  '江戸川区': 697000,
  '足立区': 695000,
  '杉並区': 590000,
  '板橋区': 585000,
  '江東区': 536000,
  '葛飾区': 453000,
  '品川区': 422000,
  '北区': 355000,
  '新宿区': 353000,
  '中野区': 344000,
  '豊島区': 301000,
  '目黒区': 288000,
  '墨田区': 280000,
  '港区': 260000,
  '渋谷区': 243000,
  '文京区': 240000,
  '荒川区': 217000,
  '台東区': 211000,
  '中央区': 174000,
  '千代田区': 68000,

  // 多摩26市
  '八王子市': 580000,
  '町田市': 433000,
  '府中市': 263000,
  '調布市': 243000,
  '西東京市': 207000,
  '小平市': 198000,
  '三鷹市': 195000,
  '日野市': 190000,
  '立川市': 184000,
  '東村山市': 151000,
  '武蔵野市': 149000,
  '多摩市': 148000,
  '青梅市': 133000,
  '国分寺市': 129000,
  '小金井市': 126000,
  '東久留米市': 116000,
  '昭島市': 114000,
  '稲城市': 93000,
  '東大和市': 85000,
  '狛江市': 84000,
  'あきる野市': 80000,
  '国立市': 76000,
  '清瀬市': 75000,
  '武蔵村山市': 71000,
  '福生市': 56000,
  '羽村市': 54000,

  // 西多摩4町村
  '瑞穂町': 32000,
  '日の出町': 16500,
  '奥多摩町': 4800,
  '檜原村': 2000
};

// Calculate initial Public Order inversely based on population density and administrative burden
function getInitialPublicOrder(name, population) {
  // Mega-population (>500k) or hyper-dense commercial/political hubs: lower initial public order
  if (population >= 500000 || ['千代田区', '中央区', '港区', '新宿区', '渋谷区'].includes(name)) {
    return Math.floor(48 + Math.random() * 8); // 48% - 55%
  } else if (population >= 250000) {
    return Math.floor(62 + Math.random() * 8); // 62% - 69%
  } else if (population >= 100000) {
    return Math.floor(72 + Math.random() * 8); // 72% - 79%
  } else if (population >= 50000) {
    return Math.floor(82 + Math.random() * 6); // 82% - 87%
  } else {
    // Nishitama rural towns/villages: strong community solidarity and high natural harmony
    return Math.floor(90 + Math.random() * 6); // 90% - 95%
  }
}

// Calculate initial troops proportional to population (3500 is eliminated, scaled naturally)
function calculateInitialTroops(population, isCapital = false, owner = 'neutral') {
  let troopBase = Math.floor(250 + Math.sqrt(population) * 1.85);
  troopBase = Math.round(troopBase / 50) * 50;

  if (owner === 'neutral') {
    return Math.max(300, Math.min(1800, troopBase));
  } else {
    if (isCapital) {
      const capTroops = Math.round((troopBase * 1.35) / 50) * 50;
      return Math.max(450, Math.min(2600, capTroops));
    } else {
      return Math.max(350, Math.min(2000, troopBase));
    }
  }
}

// Generate upfront preview info for a municipality (used in starting faction selection modal)
function getRegionPreview(name) {
  const pop = TOKYO_POPULATION_DATA[name] || 100000;
  const troops = calculateInitialTroops(pop, true, 'player');
  const order = getInitialPublicOrder(name, pop);
  let baseEconomy = 220;
  if (['千代田区', '中央区', '港区', '新宿区', '渋谷区'].includes(name)) {
    baseEconomy = 580;
  } else if (['立川市', '八王子市', '町田市', '府中市', '武蔵野市'].includes(name)) {
    baseEconomy = 340;
  } else if (['奥多摩町', '檜原村', '日の出町', '瑞穂町'].includes(name)) {
    baseEconomy = 180;
  }
  const ecoGap = Math.max(0, 600 - baseEconomy);
  const baseSubsidy = Math.floor(ecoGap * 3.5);
  let ruralFloor = 0;
  if (pop < 10000) ruralFloor = 2200;
  else if (pop < 50000) ruralFloor = 1400;
  else if (pop < 100000) ruralFloor = 800;
  const subsidy = Math.max(ruralFloor, baseSubsidy);

  return {
    name: name,
    population: pop,
    popDisplay: pop >= 10000 ? `${(pop / 10000).toFixed(1)}万人` : `${pop.toLocaleString()}人`,
    troops: troops,
    publicOrder: order,
    economy: baseEconomy,
    aprilSubsidy: subsidy,
    specialty: REGION_SPECIALTIES[name] || `${name}特産品`
  };
}

if (typeof window !== 'undefined') {
  window.TOKYO_POPULATION_DATA = TOKYO_POPULATION_DATA;
  window.getRegionPreview = getRegionPreview;
  window.calculateInitialTroops = calculateInitialTroops;
  window.getInitialPublicOrder = getInitialPublicOrder;
}

class ConquestGame {
  constructor(mapData, startingChoice = '新宿区') {
    this.mapData = mapData;
    this.year = 2026;
    this.month = 4;
    this.playerFaction = 'shinjuku';
    this.funds = {};
    this.regions = {};
    this.logs = [];
    this.selectedRegionId = null;
    this.isVictory = false;
    this.isDefeat = false;

    // Roster of unlocked heroes and active 3
    this.playerRoster = [];
    this.playerParty = [];

    // Diplomacy & Specialties
    this.playerSpecialties = {};
    this.diplomacyPacts = [];

    // Defeat Survival / Vassalage System
    this.draftedHeroId = null;    // Hero currently drafted by victor
    this.draftTurnsLeft = 0;      // Remaining turns hero is drafted away
    this.overlordFaction = null;  // Victor faction that drafted the hero

    // Action Limit & Monthly Budget Limit (所持資金の3割まで内政行動可能)
    this.monthlyBudgetLimit = 3000;
    this.spentBudgetThisTurn = 0;

    // Dynamic Faction Alliances (CPU & Player alliances with remaining turns)
    // Structure: [{ id, factionA, factionB, turnsLeft }]
    this.factionAlliances = [];

    this.initGame(startingChoice);
  }

  initGame(startingChoice = '新宿区') {
    this.year = 2026;
    this.month = 4;
    this.isVictory = false;
    this.isDefeat = false;
    this.logs = [];
    this.playerSpecialties = {};
    this.diplomacyPacts = [];
    this.factionAlliances = [];
    this.draftedHeroId = null;
    this.draftTurnsLeft = 0;
    this.overlordFaction = null;

    // 1. Resolve starting municipality
    let targetRegion = null;
    if (typeof startingChoice === 'string') {
      targetRegion = this.mapData.regions.find(r => r.name === startingChoice || r.id === startingChoice);
      if (!targetRegion && FACTIONS[startingChoice]) {
        targetRegion = this.mapData.regions.find(r => r.name === FACTIONS[startingChoice].capitalName);
      }
    }
    if (!targetRegion) {
      targetRegion = this.mapData.regions.find(r => r.name === '新宿区') || this.mapData.regions[0];
    }
    this.startingRegionName = targetRegion.name;

    // 2. Determine Player Faction Identity
    const capitalFactionMap = {
      '千代田区': 'chiyoda',
      '新宿区': 'shinjuku',
      '港区': 'minato',
      '足立区': 'adachi',
      '武蔵野市': 'musashino',
      '八王子市': 'hachioji'
    };

    if (capitalFactionMap[targetRegion.name]) {
      this.playerFaction = capitalFactionMap[targetRegion.name];
    } else {
      const dynId = `faction_${targetRegion.name.replace(/[市町村区]/g, '')}`;
      const areaColor = targetRegion.area === '都区部' ? '#3b82f6' : (targetRegion.area === '西多摩地域' ? '#10b981' : '#8b5cf6');
      const areaAccent = targetRegion.area === '都区部' ? '#60a5fa' : (targetRegion.area === '西多摩地域' ? '#34d399' : '#a78bfa');
      
      FACTIONS[dynId] = {
        id: dynId,
        name: `${targetRegion.name}軍`,
        leader: `${targetRegion.name}の英傑`,
        title: `${targetRegion.name}旗揚げ義勇軍`,
        color: areaColor,
        accentColor: areaAccent,
        description: `${targetRegion.name}より東京統一を目指して立ち上がった新興義勇勢力。`,
        bonusText: '地元結束（治安低下耐性 / 兵力補充ボーナス）',
        capitalName: targetRegion.name,
        initialFunds: 10000,
        initialHoldings: [targetRegion.name]
      };
      this.playerFaction = dynId;
    }

    // 3. Resolve starting 3 heroes
    let starters;
    if (typeof getStarterHeroesForRegion === 'function') {
      starters = getStarterHeroesForRegion(targetRegion.name);
    } else if (typeof window !== 'undefined' && typeof window.getStarterHeroesForRegion === 'function') {
      starters = window.getStarterHeroesForRegion(targetRegion.name);
    } else {
      starters = FACTION_STARTERS[this.playerFaction] || FACTION_STARTERS.shinjuku;
    }
    this.playerRoster = [...starters];
    this.playerParty = starters.slice(0, 3);

    // 4. Setup funds
    Object.keys(FACTIONS).forEach(fId => {
      this.funds[fId] = FACTIONS[fId].initialFunds || 5000;
    });

    this.monthlyBudgetLimit = Math.max(1500, Math.floor((this.funds[this.playerFaction] || 0) * 0.30));
    this.spentBudgetThisTurn = 0;

    // 5. Populate all 53 regions
    this.regions = {};
    this.mapData.regions.forEach(r => {
      let owner = 'neutral';
      let isCapital = false;

      if (r.name === targetRegion.name) {
        owner = this.playerFaction;
        isCapital = true;
      } else {
        // Assign to other factions if it's their holding and not player's capital
        for (const fId of Object.keys(FACTIONS)) {
          if (fId === this.playerFaction) continue;
          const holdings = FACTIONS[fId].initialHoldings || [];
          if (holdings.includes(r.name)) {
            owner = fId;
            if (r.name === FACTIONS[fId].capitalName) {
              isCapital = true;
            }
            break;
          }
        }
      }

      let baseEconomy = 220;
      if (['千代田区', '中央区', '港区', '新宿区', '渋谷区'].includes(r.name)) {
        baseEconomy = 580;
      } else if (['立川市', '八王子市', '町田市', '府中市', '武蔵野市'].includes(r.name)) {
        baseEconomy = 340;
      } else if (r.area === '西多摩地域') {
        baseEconomy = 180;
      }

      const pop = TOKYO_POPULATION_DATA[r.name] || 100000;
      const initialOrder = getInitialPublicOrder(r.name, pop);
      const baseTroops = calculateInitialTroops(pop, isCapital, owner);
      const specialty = REGION_SPECIALTIES[r.name] || `${r.name}特産品`;

      this.regions[r.id] = {
        id: r.id,
        name: r.name,
        enName: r.enName,
        area: r.area,
        path: r.path,
        centroid: r.centroid,
        neighbors: r.neighbors,
        owner: owner,
        troops: baseTroops,
        economy: baseEconomy,
        population: pop,
        initialPopulation: pop,
        netMigrants: 0,
        annualMigrants: 0,
        lastAprilSubsidy: 0,
        publicOrder: initialOrder,
        isCapital: isCapital,
        specialty: specialty,
        relations: owner === this.playerFaction ? 100 : (owner === 'neutral' ? 40 : 20)
      };
    });

    const playerCapital = Object.values(this.regions).find(r => r.owner === this.playerFaction && r.isCapital) 
      || Object.values(this.regions).find(r => r.owner === this.playerFaction);
    
    this.selectedRegionId = playerCapital ? playerCapital.id : this.mapData.regions[0].id;

    if (playerCapital) {
      this.playerSpecialties[playerCapital.specialty] = 2;
    }

    const factionName = FACTIONS[this.playerFaction] ? FACTIONS[this.playerFaction].name : `${targetRegion.name}軍`;
    this.addLog(`【旗揚げ】令和8年4月、${targetRegion.name}にて【${factionName}】が堂々の旗揚げ！東京制覇を目指す。`);
    this.addLog(`🛡️【不屈の掟】敗北しても完全滅亡せず、10%の賠償金と武将徴発で耐え凌ぎ、内政から何度でも再起（下克上）可能です！`);
    this.addLog(`⏳【内政行動枠】各月、所持軍資金の30%（今月枠: 💰${this.monthlyBudgetLimit.toLocaleString()}）まで内政に投資できます。計画的に運用してください。`);
    this.addLog(`👥【人口動態と民忠】過密大都市は民意維持が難しく住民流出が起きやすい一方、過疎町村は民意が高く移住者が流入しやすい特性を持ちます。`);
    this.addLog(`🌸【地方振興補助金】毎年4月、経済規模の小さい地域や移住受入実績の高い自治体に都より重点補助金が一斉交付されます！`);
  }

  addLog(msg, type = 'normal') {
    this.logs.unshift({
      time: `${this.year}年${this.month}月`,
      text: msg,
      type: type
    });
    if (this.logs.length > 50) this.logs.pop();
  }

  getPlayerStats() {
    const playerRegions = Object.values(this.regions).filter(r => r.owner === this.playerFaction);
    const totalTroops = playerRegions.reduce((sum, r) => sum + r.troops, 0);
    const totalEconomy = playerRegions.reduce((sum, r) => sum + r.economy, 0);
    const totalPopulation = playerRegions.reduce((sum, r) => sum + (r.population || 0), 0);
    const avgOrder = playerRegions.length > 0 
      ? Math.round(playerRegions.reduce((sum, r) => sum + r.publicOrder, 0) / playerRegions.length)
      : 0;

    const totalSpecialtiesCount = Object.values(this.playerSpecialties).reduce((a, b) => a + b, 0);

    const remainingBudget = Math.max(0, this.monthlyBudgetLimit - this.spentBudgetThisTurn);

    const playerRankInfo = this.getRanking();

    return {
      funds: this.funds[this.playerFaction] || 0,
      regionCount: playerRegions.length,
      totalRegions: Object.keys(this.regions).length,
      totalTroops: totalTroops,
      totalEconomy: totalEconomy,
      totalPopulation: totalPopulation,
      avgOrder: avgOrder,
      totalSpecialtiesCount: totalSpecialtiesCount,
      monthlyIncome: Math.round(totalEconomy * (this.playerFaction === 'chiyoda' ? 1.25 : 1.0)),
      isDrafted: this.draftTurnsLeft > 0,
      draftTurnsLeft: this.draftTurnsLeft,
      draftedHeroName: this.draftedHeroId && CHARACTERS_DB[this.draftedHeroId] ? CHARACTERS_DB[this.draftedHeroId].name : null,
      overlordName: this.overlordFaction && FACTIONS[this.overlordFaction] ? FACTIONS[this.overlordFaction].name : null,
      monthlyBudgetLimit: this.monthlyBudgetLimit,
      spentBudgetThisTurn: this.spentBudgetThisTurn,
      remainingBudget: remainingBudget,
      rank: playerRankInfo.rank,
      isSingleLeader: playerRankInfo.isSingleLeader,
      runnerUpRegions: playerRankInfo.runnerUpRegions
    };
  }

  // Calculate ranking across all active factions
  getRanking() {
    const factionCounts = {};
    Object.keys(FACTIONS).filter(f => f !== 'neutral').forEach(f => {
      factionCounts[f] = 0;
    });

    Object.values(this.regions).forEach(r => {
      if (r.owner && r.owner !== 'neutral') {
        factionCounts[r.owner] = (factionCounts[r.owner] || 0) + 1;
      }
    });

    const sorted = Object.keys(factionCounts).map(f => ({
      faction: f,
      count: factionCounts[f]
    })).sort((a, b) => b.count - a.count);

    const playerEntry = sorted.find(s => s.faction === this.playerFaction);
    const rank = sorted.findIndex(s => s.faction === this.playerFaction) + 1;
    const isSingleLeader = sorted.length > 1 && sorted[0].faction === this.playerFaction && sorted[0].count > sorted[1].count;
    const runnerUpRegions = sorted.length > 1 ? sorted[1].count : 0;

    return { rank, isSingleLeader, runnerUpRegions, sorted };
  }

  // Calculate annual April grant preview for a given municipality
  getAnnualSubsidyPreview(reg) {
    if (!reg) return 0;
    const ecoGap = Math.max(0, 600 - reg.economy);
    const baseSubsidy = Math.floor(ecoGap * 3.5);
    const intakeBonus = Math.max(0, Math.floor((reg.annualMigrants || 0) * 0.20));

    let ruralFloor = 0;
    if (reg.population < 10000) {
      ruralFloor = 2200;
    } else if (reg.population < 50000) {
      ruralFloor = 1400;
    } else if (reg.population < 100000) {
      ruralFloor = 800;
    }

    return Math.max(ruralFloor, baseSubsidy + intakeBonus);
  }

  // Retrieve player's battle party with Deputy (80% Proxy) if a hero is drafted away!
  getPlayerBattleParty() {
    return this.playerParty.map(charId => {
      const original = CHARACTERS_DB[charId];
      if (!original) return null;

      // If this hero is currently drafted away by victor, substitute with Deputy Proxy (80% stats)
      if (this.draftedHeroId === charId && this.draftTurnsLeft > 0) {
        return {
          id: `proxy_${original.id}`,
          name: `${original.name}の代理副官`,
          title: `留守代行（能力80%）`,
          avatar: `👤`,
          role: original.role,
          maxHp: Math.round(original.maxHp * 0.8),
          hp: Math.round(original.maxHp * 0.8),
          maxMp: Math.round(original.maxMp * 0.8),
          mp: Math.round(original.maxMp * 0.8),
          attack: Math.round(original.attack * 0.8),
          defense: Math.round(original.defense * 0.8),
          speed: Math.round(original.speed * 0.8),
          skills: original.skills
        };
      }

      return original;
    }).filter(Boolean);
  }

  getRegionDefenders(region) {
    const owner = region.owner;
    let list = [];

    const specialRecruitId = REGION_RECRUIT_MAP[region.name];
    if (specialRecruitId && CHARACTERS_DB[specialRecruitId]) {
      list.push(CHARACTERS_DB[specialRecruitId]);
    }

    if (owner !== 'neutral' && FACTION_STARTERS[owner]) {
      FACTION_STARTERS[owner].forEach(id => {
        if (!list.some(c => c.id === id) && CHARACTERS_DB[id]) {
          list.push(CHARACTERS_DB[id]);
        }
      });
    }

    let counter = 1;
    while (list.length < 3) {
      list.push({
        id: `guard_${region.id}_${counter}`,
        name: `${region.name}守備兵${counter > 1 ? '・副隊' : ''}`,
        title: `${region.name}自警団`,
        avatar: counter === 1 ? '🛡️' : (counter === 2 ? '🏹' : '🤖'),
        role: '防衛兵',
        maxHp: 460 + counter * 30,
        maxMp: 40,
        attack: 45 + counter * 4,
        defense: 44 + counter * 4,
        speed: 44 + counter * 3,
        skills: [
          {
            id: `guard_smash_${counter}`,
            name: `${region.name}防衛突撃`,
            mp: 12,
            target: 'enemy_single',
            desc: '守備隊の意地を見せる渾身の一撃。',
            power: 1.35,
            type: 'damage'
          }
        ]
      });
      counter++;
    }

    return list.slice(0, 3);
  }

  recruitRegionHero(regionName) {
    const recruitId = REGION_RECRUIT_MAP[regionName];
    if (recruitId && CHARACTERS_DB[recruitId]) {
      if (!this.playerRoster.includes(recruitId)) {
        this.playerRoster.push(recruitId);
        const hero = CHARACTERS_DB[recruitId];
        this.addLog(`【登用成功】${regionName}の制圧に伴い、【${hero.name}】(${hero.title})が仲間に加わった！`, 'victory');
        return hero;
      }
    }
    return null;
  }

  setPartyMember(slot, charId) {
    if (slot >= 0 && slot < 3 && this.playerRoster.includes(charId)) {
      this.playerParty[slot] = charId;
      return true;
    }
    return false;
  }

  // --- DIPLOMACY & SPECIALTIES ---
  procureSpecialty(regionId) {
    const reg = this.regions[regionId];
    if (!reg || reg.owner !== this.playerFaction) return { success: false, msg: '自領地ではありません' };
    const cost = 800;
    if ((this.funds[this.playerFaction] || 0) < cost) {
      return { success: false, msg: '軍資金が不足しています（必要: 800）' };
    }

    if (this.spentBudgetThisTurn + cost > this.monthlyBudgetLimit) {
      return { 
        success: false, 
        msg: `今月の内政予算上限（枠: 💰${this.monthlyBudgetLimit.toLocaleString()}）を超過します。ターン終了（月送り）してください。` 
      };
    }

    this.funds[this.playerFaction] -= cost;
    this.spentBudgetThisTurn += cost;
    const name = reg.specialty;
    this.playerSpecialties[name] = (this.playerSpecialties[name] || 0) + 1;
    this.addLog(`【特産品調達】${reg.name}にて「${name}」を調達・備蓄しました。（在庫: ${this.playerSpecialties[name]} / 今月予算残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）`, 'develop');
    return { success: true, msg: `「${name}」を1個調達しました！` };
  }

  sendTribute(targetRegionId, specialtyName) {
    const target = this.regions[targetRegionId];
    if (!target) return { success: false, msg: '対象地域が無効です' };
    if ((this.playerSpecialties[specialtyName] || 0) <= 0) {
      return { success: false, msg: `特産品「${specialtyName}」が在庫不足です` };
    }

    this.playerSpecialties[specialtyName]--;
    const boost = 25;
    target.relations = Math.min(100, (target.relations || 40) + boost);

    const ownerName = FACTIONS[target.owner] ? FACTIONS[target.owner].name : '中立自警団';
    this.addLog(`【親善外交】${target.name}（${ownerName}）へ「${specialtyName}」を贈呈。友好度が +${boost} 上昇！（現在: ${target.relations}）`, 'develop');
    return { success: true, msg: `${target.name}への特産品贈呈が喜ばれました！（友好度: ${target.relations}）` };
  }

  formPact(targetRegionId) {
    const target = this.regions[targetRegionId];
    if (!target) return { success: false, msg: '対象地域が無効です' };
    if ((target.relations || 0) < 65) {
      return { success: false, msg: '友好度が不足しています（必要: 65以上）' };
    }
    if (this.diplomacyPacts.includes(targetRegionId)) {
      return { success: false, msg: 'すでに不戦協定が締結されています' };
    }

    this.diplomacyPacts.push(targetRegionId);
    
    // Also record in faction alliances
    const targetOwner = target.owner;
    const allianceName = `${target.name}・${FACTIONS[this.playerFaction].name}防衛協定`;
    this.factionAlliances.push({
      id: `pact_${Date.now()}_${targetRegionId}`,
      factionA: this.playerFaction,
      factionB: targetOwner,
      regionId: targetRegionId,
      turnsLeft: 12,
      name: allianceName
    });

    this.addLog(`【同盟締結】${target.name}と「不戦・相互防衛協定（12ヶ月有効）」を締結！背後が安全になりました。`, 'victory');
    return { success: true, msg: `${target.name}との不可侵同盟が成立しました！（有効期間: 12ヶ月）` };
  }

  breakPact(targetRegionId) {
    const target = this.regions[targetRegionId];
    if (!target) return { success: false, msg: '対象地域が無効です' };
    
    const idx = this.diplomacyPacts.indexOf(targetRegionId);
    if (idx === -1) {
      return { success: false, msg: '不戦協定は締結されていません' };
    }

    this.diplomacyPacts.splice(idx, 1);
    this.factionAlliances = this.factionAlliances.filter(a => a.regionId !== targetRegionId);
    
    // Breaking pact reduces relations and slight public order penalty for treachery
    target.relations = Math.max(10, (target.relations || 40) - 35);
    const playerRegions = Object.values(this.regions).filter(r => r.owner === this.playerFaction);
    playerRegions.forEach(r => {
      r.publicOrder = Math.max(10, r.publicOrder - 5);
    });

    this.addLog(`【同盟破棄】${target.name}との不戦協定を一方的に破棄・解消！ 信義違背により自国の民意が -5% 低下、相手の友好度が激減した。`, 'danger');
    return { success: true, msg: `${target.name}との同盟を破棄しました。` };
  }

  checkBullyingAttack(sourceRegion, targetRegion) {
    const playerStats = this.getPlayerStats();
    const isOverwhelming = sourceRegion.troops >= targetRegion.troops * 2.2;
    const isBigEmpireAgainstMinor = playerStats.regionCount >= 5 && targetRegion.troops <= 1200;
    return isOverwhelming || isBigEmpireAgainstMinor;
  }

  // --- NEW: DEFEAT SURVIVAL & VASSALAGE INDEMNITY (負けたら終わりゲーにしない) ---
  handleDefeatPenalties(victorFactionId, sourceRegionId) {
    const victorName = FACTIONS[victorFactionId] ? FACTIONS[victorFactionId].name : '敵軍';
    const sourceRegion = this.regions[sourceRegionId];

    // 1. 10% Funds Indemnity
    const curFunds = this.funds[this.playerFaction] || 0;
    const lostFunds = Math.floor(curFunds * 0.10);
    this.funds[this.playerFaction] = Math.max(0, curFunds - lostFunds);

    // 2. 10% Region Troops Indemnity
    let lostTroops = 0;
    if (sourceRegion) {
      lostTroops = Math.floor(sourceRegion.troops * 0.10);
      sourceRegion.troops = Math.max(100, sourceRegion.troops - lostTroops);
    }

    // 3. Draft 1 Hero into Victor's Service for 3 turns (武将1名の軍役徴発)
    let draftedHero = null;
    if (!this.draftedHeroId && this.playerParty.length > 0) {
      // Pick the second hero (or first)
      const targetCharId = this.playerParty[1] || this.playerParty[0];
      this.draftedHeroId = targetCharId;
      this.draftTurnsLeft = 3;
      this.overlordFaction = victorFactionId;
      draftedHero = CHARACTERS_DB[targetCharId];
    }

    const heroNotice = draftedHero 
      ? `さらに、武将【${draftedHero.name}】が宗主国${victorName}の軍役へ一時徴発（駆り出され）されました！（留守中は代理副官が防衛代行）` 
      : `（すでに徴発中のため追加の武将徴発は免除）`;

    this.addLog(`⚠️【敗戦・従属調停】敗北の代償として資金 💰${lostFunds} と兵力 🛡️${lostTroops} を上納。${heroNotice}`, 'danger');

    return {
      lostFunds,
      lostTroops,
      draftedHero,
      victorName,
      turnsLeft: this.draftTurnsLeft
    };
  }

  // Domestic Command: Commercial Development
  developRegion(regionId) {
    const reg = this.regions[regionId];
    if (!reg || reg.owner !== this.playerFaction) return { success: false, msg: '自勢力の領地ではありません' };
    const cost = 1200;
    if ((this.funds[this.playerFaction] || 0) < cost) {
      return { success: false, msg: '軍資金が不足しています（必要: 1,200）' };
    }

    if (this.spentBudgetThisTurn + cost > this.monthlyBudgetLimit) {
      return { 
        success: false, 
        msg: `今月の内政予算枠（残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）が不足しています。来月に向けてターンを終了してください。` 
      };
    }

    this.funds[this.playerFaction] -= cost;
    this.spentBudgetThisTurn += cost;
    let boost = Math.floor(60 + Math.random() * 40);
    if (this.playerFaction === 'minato') boost = Math.round(boost * 1.5);

    reg.economy += boost;
    reg.publicOrder = Math.min(100, reg.publicOrder + 2);

    // Commercial development attracts newcomers
    const newCitizens = Math.floor(60 + Math.random() * 80);
    reg.population += newCitizens;
    reg.netMigrants = (reg.netMigrants || 0) + newCitizens;
    reg.annualMigrants = (reg.annualMigrants || 0) + newCitizens;

    this.addLog(`【内政】${reg.name}の商業開拓を実施。経済力が +${boost} 向上、新規定住者 +${newCitizens}名（現在: 経済${reg.economy} / 人口${reg.population.toLocaleString()}人 / 今月予算残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）`, 'develop');
    return { success: true, msg: `${reg.name}の開拓が完了しました！(+${boost})` };
  }

  // Domestic Command: Recruit Troops
  recruitTroops(regionId) {
    const reg = this.regions[regionId];
    if (!reg || reg.owner !== this.playerFaction) return { success: false, msg: '自勢力の領地ではありません' };
    let cost = 1000;
    if (this.playerFaction === 'shinjuku') cost = 750;

    if ((this.funds[this.playerFaction] || 0) < cost) {
      return { success: false, msg: `軍資金が不足しています（必要: ${cost}）` };
    }

    if (this.spentBudgetThisTurn + cost > this.monthlyBudgetLimit) {
      return { 
        success: false, 
        msg: `今月の内政予算枠（残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）が不足しています。来月に向けてターンを終了してください。` 
      };
    }

    this.funds[this.playerFaction] -= cost;
    this.spentBudgetThisTurn += cost;
    let recruits = Math.floor(400 + (reg.economy / 5) + Math.random() * 100);
    reg.troops += recruits;
    reg.population = Math.max(200, reg.population - recruits);
    reg.publicOrder = Math.max(10, reg.publicOrder - 3);
    this.addLog(`【軍備】${reg.name}にて動員令を発令。新兵 +${recruits} を配備（総兵力: ${reg.troops} / 人口: ${reg.population.toLocaleString()}人 / 今月予算残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）`, 'recruit');
    return { success: true, msg: `${reg.name}に +${recruits} 名の部隊を配備しました。` };
  }

  // Domestic Command: Police / Public Order
  policeRegion(regionId) {
    const reg = this.regions[regionId];
    if (!reg || reg.owner !== this.playerFaction) return { success: false, msg: '自勢力の領地ではありません' };
    const cost = 600;
    if ((this.funds[this.playerFaction] || 0) < cost) {
      return { success: false, msg: '軍資金が不足しています（必要: 600）' };
    }

    if (this.spentBudgetThisTurn + cost > this.monthlyBudgetLimit) {
      return { 
        success: false, 
        msg: `今月の内政予算枠（残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）が不足しています。来月に向けてターンを終了してください。` 
      };
    }

    this.funds[this.playerFaction] -= cost;
    this.spentBudgetThisTurn += cost;
    const gain = Math.floor(22 + Math.random() * 10);
    reg.publicOrder = Math.min(100, reg.publicOrder + gain);

    // Safety and peace brings back citizens
    const returned = Math.floor(40 + Math.random() * 60);
    reg.population += returned;
    reg.netMigrants = (reg.netMigrants || 0) + returned;
    reg.annualMigrants = (reg.annualMigrants || 0) + returned;

    this.addLog(`【治安巡回】${reg.name}の民意・治安対策を強化。民忠が ${reg.publicOrder}% へ回復、転入・帰還民 +${returned}名（今月予算残: 💰${(this.monthlyBudgetLimit - this.spentBudgetThisTurn).toLocaleString()}）`, 'police');
    return { success: true, msg: `${reg.name}の民意が回復しました。(現在: ${reg.publicOrder}%)` };
  }

  // Transport Troops
  transportTroops(fromId, toId, count) {
    const from = this.regions[fromId];
    const to = this.regions[toId];
    if (!from || !to) return { success: false, msg: '地域が存在しません' };
    if (from.owner !== this.playerFaction || to.owner !== this.playerFaction) {
      return { success: false, msg: '自領地間でのみ輸送可能です' };
    }
    if (!from.neighbors.includes(toId)) {
      return { success: false, msg: '隣接していない領地には直接移動できません' };
    }
    if (from.troops <= count) {
      return { success: false, msg: '出発地には最低100の守備隊を残す必要があります' };
    }

    from.troops -= count;
    to.troops += count;
    this.addLog(`【輸送】${from.name}から${to.name}へ部隊 ${count} を移動配備しました。`);
    return { success: true, msg: `部隊 ${count} を移動させました。` };
  }

  // Handle Territory Conquest
  conquerRegion(sourceId, targetId, playerRemainingTroops, wasBullying = false) {
    const source = this.regions[sourceId];
    const target = this.regions[targetId];
    if (!source || !target) return;

    const oldOwner = target.owner;
    target.owner = this.playerFaction;
    target.troops = Math.max(200, playerRemainingTroops);

    const oldOwnerName = FACTIONS[oldOwner] ? FACTIONS[oldOwner].name : '中立自警団';

    // If conquered region belonged to player's overlord, player achieves Independence/下克上!
    if (this.overlordFaction === oldOwner) {
      this.overlordFaction = null;
      this.draftTurnsLeft = 0;
      this.draftedHeroId = null;
      this.addLog(`🔥【下克上・完全独立達成！】宗主国${oldOwnerName}を打ち破り、完全に自由と独立を取り戻した！`, 'victory');
    }

    if (wasBullying) {
      const penalty = Math.floor(25 + Math.random() * 10);
      Object.values(this.regions).filter(r => r.owner === this.playerFaction).forEach(r => {
        r.publicOrder = Math.max(10, r.publicOrder - penalty);
      });
      target.publicOrder = 20;

      this.addLog(`【大義なき侵略】弱小の${target.name}を理不尽に制圧。世論が激怒し、自国領内の民意が一斉に -${penalty}% 暴落した！`, 'danger');
    } else {
      target.publicOrder = Math.max(35, target.publicOrder - 15);
      this.addLog(`【大勝利】${source.name}の部隊が激戦の末、${target.name}を制圧！ ${oldOwnerName}から奪取した！`, 'victory');
    }

    const newHero = this.recruitRegionHero(target.name);
    this.checkWinLoss();
    return { newHero, wasBullying };
  }

  // End Turn
  endTurn() {
    this.addLog(`-------------- ${this.year}年 ${this.month}月 経過 --------------`);

    // Reset net monthly migrants for all regions at the start of new cycle
    Object.values(this.regions).forEach(reg => {
      reg.netMigrants = 0;
    });

    // 1. Collect Taxes & Pact Aid
    Object.values(this.regions).forEach(reg => {
      const owner = reg.owner;
      if (owner && owner !== 'neutral') {
        const orderFactor = reg.publicOrder / 100;
        let income = Math.floor(reg.economy * 1.2 * orderFactor);
        if (owner === 'chiyoda') income = Math.round(income * 1.25);
        this.funds[owner] = (this.funds[owner] || 0) + income;

        if (owner === 'adachi') {
          reg.troops += 100;
        }

        if (owner === this.playerFaction && this.diplomacyPacts.includes(reg.id)) {
          this.funds[owner] += 200;
        }
      }
    });

    // 2. Inter-regional Migration Simulation (民意反比例流出 & 隣接高民意・低密度地域への逃散)
    this.simulateInterRegionalMigration();

    // 3. Drafted Hero Military Service Tracker
    if (this.draftTurnsLeft > 0) {
      this.draftTurnsLeft--;
      const hero = CHARACTERS_DB[this.draftedHeroId];
      const overlordName = FACTIONS[this.overlordFaction] ? FACTIONS[this.overlordFaction].name : '宗主国';

      if (this.draftTurnsLeft > 0) {
        this.addLog(`【軍役従軍中】我が国の武将【${hero ? hero.name : '武将'}】が${overlordName}の合戦に駆り出されています。（残り${this.draftTurnsLeft}ヶ月）`, 'ai');
      } else {
        this.addLog(`🎉【軍役完了・帰還】徴発されていた【${hero ? hero.name : '武将'}】が軍役を務め上げ、無事に自国へ帰還しました！万全の3名で再起戦が可能です！`, 'victory');
        this.draftedHeroId = null;
        this.overlordFaction = null;
      }
    }

    // 3.5 Alliance Duration Decrement & Expiration Check
    this.factionAlliances.forEach(al => {
      al.turnsLeft--;
      if (al.turnsLeft === 0) {
        if (al.factionA === this.playerFaction || al.factionB === this.playerFaction) {
          if (al.regionId) {
            const pactIdx = this.diplomacyPacts.indexOf(al.regionId);
            if (pactIdx !== -1) this.diplomacyPacts.splice(pactIdx, 1);
          }
          this.addLog(`📜【同盟満了】「${al.name}」の盟約期間が満了し、友好解消となりました。`, 'ai');
        } else {
          this.addLog(`📜【外交情勢】他国間の「${al.name}」が盟約満了により解消されました。`, 'ai');
        }
      }
    });
    this.factionAlliances = this.factionAlliances.filter(al => al.turnsLeft > 0);

    // 4. CPU AI Actions (53 Municipalities Autonomous Simulation with 30% Budget Limit & Diplomacy)
    this.runAiTurn();

    // 5. Time progression
    this.month++;
    if (this.month > 12) {
      this.month = 1;
      this.year++;
    }

    // 5.5 Annual April Regional Subsidy (毎年4月・地方創生振興補助金一斉交付)
    if (this.month === 4) {
      this.distributeAnnualRegionalSubsidies();
    }

    // 6. Reset Player's Monthly Domestic Budget (所持金の3割ルールを新月に再適用)
    const currentFunds = this.funds[this.playerFaction] || 0;
    this.monthlyBudgetLimit = Math.max(1500, Math.floor(currentFunds * 0.30));
    this.spentBudgetThisTurn = 0;

    this.checkWinLoss();
    this.addLog(`【新月】${this.year}年${this.month}月を迎えた。月次税収が国庫に納められ、今月の内政予算枠（💰${this.monthlyBudgetLimit.toLocaleString()}）が割り振られました。`);
  }

  // Inter-regional Migration Simulation
  // Dissatisfied citizens (< 55% public order) migrate out, seeking neighbors with higher public order and lower density
  simulateInterRegionalMigration() {
    Object.values(this.regions).forEach(reg => {
      if (reg.publicOrder < 55) {
        const discontentFactor = (55 - reg.publicOrder) / 55; // 0.0 ~ 1.0
        const monthlyRate = 0.005 + 0.015 * discontentFactor; // 0.5% ~ 2.0%
        let fleeingCount = Math.floor(reg.population * monthlyRate);
        fleeingCount = Math.max(10, Math.min(fleeingCount, Math.floor(reg.population * 0.05)));

        // Destination candidates: adjacent neighbors with public order >= 55
        const candidates = reg.neighbors
          .map(nid => this.regions[nid])
          .filter(n => n && n.publicOrder >= 55);

        if (candidates.length > 0 && fleeingCount > 0) {
          // Attractiveness score: higher public order squared, divided by sqrt(population)
          let totalScore = 0;
          const scored = candidates.map(c => {
            const score = Math.pow(c.publicOrder, 2) / Math.sqrt(Math.max(1000, c.population));
            totalScore += score;
            return { reg: c, score };
          });

          let rand = Math.random() * totalScore;
          let dest = scored[0].reg;
          for (const s of scored) {
            if (rand <= s.score) {
              dest = s.reg;
              break;
            }
            rand -= s.score;
          }

          // Apply population movements
          reg.population = Math.max(200, reg.population - fleeingCount);
          dest.population += fleeingCount;

          reg.netMigrants = (reg.netMigrants || 0) - fleeingCount;
          dest.netMigrants = (dest.netMigrants || 0) + fleeingCount;

          reg.annualMigrants = (reg.annualMigrants || 0) - fleeingCount;
          dest.annualMigrants = (dest.annualMigrants || 0) + fleeingCount;

          // Economic repercussions: outflow diminishes commerce, inflow boosts recipient
          const ecoDrain = Math.min(Math.floor(fleeingCount / 200), Math.floor(reg.economy * 0.05));
          reg.economy = Math.max(80, reg.economy - ecoDrain);
          dest.economy += Math.floor(fleeingCount / 250);

          // If public order is severely degraded (< 45%), garrison desertion
          if (reg.publicOrder < 45) {
            const deserters = Math.min(Math.floor(reg.troops * 0.03), Math.floor(fleeingCount * 0.05));
            if (deserters > 15) {
              reg.troops = Math.max(100, reg.troops - deserters);
              dest.troops += Math.floor(deserters * 0.5);
            }
          }

          // Logs for player notifications
          if (reg.owner === this.playerFaction) {
            this.addLog(`⚠️【人口流出】民意低下（民忠${reg.publicOrder}%）により「${reg.name}」から住民 ${fleeingCount.toLocaleString()} 名が流出！民意が高く住みよい隣接「${dest.name}」へ転出しました（経済 -${ecoDrain}）。`, 'danger');
          } else if (dest.owner === this.playerFaction) {
            this.addLog(`✨【人口流入】隣接する「${reg.name}」の不満住民 ${fleeingCount.toLocaleString()} 名が、住み心地の良い我が領地「${dest.name}」へ移住してきました！（経済力 +${Math.floor(fleeingCount / 250)}）`, 'victory');
          }
        }
      }
    });
  }

  // Annual April Regional Subsidy Disbursement (毎年4月・地方創生振興補助金一斉交付)
  distributeAnnualRegionalSubsidies() {
    let playerGrantTotal = 0;
    const grantDetails = [];

    Object.values(this.regions).forEach(reg => {
      const ecoGap = Math.max(0, 600 - reg.economy);
      const baseSubsidy = Math.floor(ecoGap * 3.5);
      const intakeBonus = Math.max(0, Math.floor((reg.annualMigrants || 0) * 0.20));

      let ruralFloor = 0;
      if (reg.population < 10000) {
        ruralFloor = 2200; // Hinohara, Okutama
      } else if (reg.population < 50000) {
        ruralFloor = 1400; // Hinode, Mizuho
      } else if (reg.population < 100000) {
        ruralFloor = 800;
      }

      const totalSubsidy = Math.max(ruralFloor, baseSubsidy + intakeBonus);
      reg.lastAprilSubsidy = totalSubsidy;

      if (reg.owner && reg.owner !== 'neutral') {
        this.funds[reg.owner] = (this.funds[reg.owner] || 0) + totalSubsidy;
        if (reg.owner === this.playerFaction) {
          playerGrantTotal += totalSubsidy;
          grantDetails.push(`${reg.name}: 💰${totalSubsidy.toLocaleString()}`);
        }
      }

      // Reset annual migrants counter after fiscal year disbursement
      reg.annualMigrants = 0;
    });

    this.addLog(`🌸【新年度4月・地方振興補助金】東京都地方創生交付金が一斉支給！経済規模の小さい自治体・移住者受入地域へ重点配分されました。`, 'victory');
    if (playerGrantTotal > 0) {
      this.addLog(`💰【地方創生交付金受給】我が勢力の自治体に総額 💰${playerGrantTotal.toLocaleString()} の補助金が交付されました！（${grantDetails.slice(0, 3).join(' / ')}${grantDetails.length > 3 ? ' 他' : ''}）`, 'victory');
    }
  }

  // CPU AI Logic: 53 Municipalities Autonomous Simulation (Budget-limited & Dynamic Alliances)
  runAiTurn() {
    const activeFactions = Object.keys(FACTIONS).filter(f => f !== this.playerFaction && f !== 'neutral');

    // 1. CPU Factions Domestic Decisions (constrained by 30% budget limit like player)
    activeFactions.forEach(fId => {
      const myRegions = Object.values(this.regions).filter(r => r.owner === fId);
      if (myRegions.length === 0) return;

      const aiFunds = this.funds[fId] || 0;
      let aiBudget = Math.max(1000, Math.floor(aiFunds * 0.30));
      let aiSpent = 0;

      // Domestic investments per municipality
      for (const reg of myRegions) {
        if (aiSpent >= aiBudget) break;

        // Priority 1: Restore public order if low
        if (reg.publicOrder < 60 && (aiBudget - aiSpent) >= 600 && this.funds[fId] >= 600) {
          this.funds[fId] -= 600;
          aiSpent += 600;
          reg.publicOrder = Math.min(100, reg.publicOrder + 25);
        }
        // Priority 2: Recruit troops if border or garrison is low
        else if (reg.troops < 1500 && (aiBudget - aiSpent) >= 1000 && this.funds[fId] >= 1000) {
          const cost = fId === 'shinjuku' ? 750 : 1000;
          if (this.funds[fId] >= cost && (aiBudget - aiSpent) >= cost) {
            this.funds[fId] -= cost;
            aiSpent += cost;
            reg.troops += 500;
            reg.publicOrder = Math.max(10, reg.publicOrder - 3);
          }
        }
        // Priority 3: Commercial development if economy is low
        else if (reg.economy < 600 && (aiBudget - aiSpent) >= 1200 && this.funds[fId] >= 1200 && Math.random() > 0.4) {
          this.funds[fId] -= 1200;
          aiSpent += 1200;
          reg.economy += 70;
        }
      }

      // 2. CPU Dynamic Diplomacy: Alliance Formation & Betrayal/Pact Dissolution
      if (Math.random() < 0.25) {
        this.runAiDiplomacy(fId, myRegions);
      }

      // 3. CPU Military Operations
      const readyArmies = myRegions.filter(r => r.troops >= 2200);
      if (readyArmies.length > 0 && Math.random() > 0.40) {
        const source = readyArmies[Math.floor(Math.random() * readyArmies.length)];
        
        // Exclude territories with active alliances/pacts
        const candidates = source.neighbors
          .map(nid => this.regions[nid])
          .filter(r => {
            if (!r || r.owner === fId) return false;
            // Check player pact
            if (r.owner === this.playerFaction && this.diplomacyPacts.includes(r.id)) return false;
            // Check inter-faction alliance
            const hasAlliance = this.factionAlliances.some(al => 
              (al.factionA === fId && al.factionB === r.owner) ||
              (al.factionB === fId && al.factionA === r.owner) ||
              (al.regionId === r.id)
            );
            return !hasAlliance;
          });

        if (candidates.length > 0) {
          candidates.sort((a, b) => a.troops - b.troops);
          const target = candidates[0];

          if (source.troops > target.troops * 1.3) {
            const attackTroops = Math.floor(source.troops * 0.7);
            source.troops -= attackTroops;

            const won = attackTroops > target.troops * 1.15;
            if (won) {
              const oldOwner = target.owner;
              target.owner = fId;
              target.troops = Math.max(200, Math.floor(attackTroops * 0.6));
              const targetName = target.name;
              const factionName = FACTIONS[fId].name;

              if (oldOwner === this.playerFaction) {
                // If player territory fell, apply defeat indemnity instead of extinction!
                this.handleDefeatPenalties(fId, target.id);
                this.addLog(`【緊急防衛失敗】我が領地「${targetName}」が${factionName}に制圧されました！`, 'danger');
              } else {
                this.addLog(`【情勢】${factionName}が「${targetName}」を攻略占領！`, 'ai');
              }
            } else {
              target.troops = Math.max(100, target.troops - Math.floor(attackTroops * 0.4));
              source.troops += Math.floor(attackTroops * 0.4);
              if (target.owner === this.playerFaction) {
                target.publicOrder = Math.min(100, target.publicOrder + 8);
                this.addLog(`【防衛戦功】我が軍は${target.name}にて${FACTIONS[fId].name}を完全撃退！ 民意が +8% 上昇した！`, 'victory');
              }
            }
          }
        }
      }
    });
  }

  // AI Dynamic Diplomacy: Form or Break Pacts based on threat & neighbor relations
  runAiDiplomacy(factionId, myRegions) {
    // Opening Grace Period: Zero alliances formed during the opening months (April - June 2026)
    if (this.year === 2026 && this.month <= 6) return;

    const facName = FACTIONS[factionId] ? FACTIONS[factionId].name : factionId;
    
    // Find external bordering factions/neutrals
    const borderingTerritories = [];
    myRegions.forEach(mr => {
      mr.neighbors.forEach(nid => {
        const nr = this.regions[nid];
        if (nr && nr.owner !== factionId && !borderingTerritories.some(t => t.id === nr.id)) {
          borderingTerritories.push(nr);
        }
      });
    });

    if (borderingTerritories.length === 0) return;

    // 1. Chance to break an existing alliance if partner became too aggressive
    const myAlliances = this.factionAlliances.filter(al => al.factionA === factionId || al.factionB === factionId);
    if (myAlliances.length > 0 && Math.random() < 0.20) {
      const targetAl = myAlliances[Math.floor(Math.random() * myAlliances.length)];
      const partnerFaction = targetAl.factionA === factionId ? targetAl.factionB : targetAl.factionA;
      const partnerName = FACTIONS[partnerFaction] ? FACTIONS[partnerFaction].name : partnerFaction;

      // Dissolve alliance
      this.factionAlliances = this.factionAlliances.filter(al => al.id !== targetAl.id);
      if (partnerFaction === this.playerFaction && targetAl.regionId) {
        const pIdx = this.diplomacyPacts.indexOf(targetAl.regionId);
        if (pIdx !== -1) this.diplomacyPacts.splice(pIdx, 1);
        this.addLog(`⚡【同盟破棄通知】${facName}が我が国との盟約「${targetAl.name}」を一方的に破棄！国境の緊張が高まっています。`, 'danger');
      } else {
        this.addLog(`⚡【外交情勢】${facName}と${partnerName}の間で対立が激化し、防衛同盟が解消・破棄されました！`, 'ai');
      }
      return;
    }

    // 2. Chance to form a new alliance with neighboring neutral or AI faction
    const targetReg = borderingTerritories[Math.floor(Math.random() * borderingTerritories.length)];
    const targetOwner = targetReg.owner;

    // Check if alliance already exists
    const alreadyAllied = this.factionAlliances.some(al => 
      (al.factionA === factionId && al.factionB === targetOwner) ||
      (al.factionB === factionId && al.factionA === targetOwner) ||
      (al.regionId === targetReg.id)
    );

    if (!alreadyAllied && targetOwner !== factionId) {
      const targetOwnerName = FACTIONS[targetOwner] ? FACTIONS[targetOwner].name : `${targetReg.name}自警団`;
      const allianceName = `${facName}・${targetReg.name}不可侵盟約`;

      if (targetOwner === this.playerFaction) {
        // Player proposal by AI
        if (!this.diplomacyPacts.includes(targetReg.id) && targetReg.relations >= 50) {
          this.diplomacyPacts.push(targetReg.id);
          this.factionAlliances.push({
            id: `ai_pact_${Date.now()}_${targetReg.id}`,
            factionA: factionId,
            factionB: this.playerFaction,
            regionId: targetReg.id,
            turnsLeft: 8,
            name: allianceName
          });
          this.addLog(`🤝【外交打診】${facName}より不可侵同盟の申し入れがあり、${targetReg.name}との間に8ヶ月の不戦協定が成立しました！`, 'victory');
        }
      } else {
        // AI-AI or AI-Neutral pact
        this.factionAlliances.push({
          id: `ai_pact_${Date.now()}_${factionId}_${targetReg.id}`,
          factionA: factionId,
          factionB: targetOwner,
          regionId: targetReg.id,
          turnsLeft: Math.floor(6 + Math.random() * 6),
          name: allianceName
        });
        this.addLog(`🤝【外交情勢】${facName}と${targetOwnerName}が「${allianceName}」を締結！背後を固めました。`, 'ai');
      }
    }
  }

  checkWinLoss() {
    const playerRegions = Object.values(this.regions).filter(r => r.owner === this.playerFaction);
    const totalRegions = Object.keys(this.regions).length;

    if (playerRegions.length === totalRegions) {
      if (!this.isVictory) {
        this.isVictory = true;
        this.addLog(`👑★★★★★【天下統一達成】全東京都53市区町村を完全平定！${FACTIONS[this.playerFaction].name}が東京の絶対覇者となった！ここからは単独首位を維持し続けるエンドレス覇王時代へ突入します！★★★★★`, 'victory');
      }
    } else if (playerRegions.length === 0) {
      // True extinction only if all regions are lost
      this.isDefeat = true;
      this.addLog(`×××××【滅亡】我が勢力の全領地が陥落した……東京争奪戦に敗れ去った。×××××`, 'danger');
    }
  }

  // --- LOCAL STORAGE SAVE & LOAD (だらだらプレイ用) ---
  saveState() {
    try {
      const data = {
        version: '1.3.0',
        savedAt: new Date().toISOString(),
        year: this.year,
        month: this.month,
        startingRegionName: this.startingRegionName || '新宿区',
        playerFaction: this.playerFaction,
        funds: this.funds,
        regions: this.regions,
        logs: this.logs,
        selectedRegionId: this.selectedRegionId,
        playerRoster: this.playerRoster,
        playerParty: this.playerParty,
        playerSpecialties: this.playerSpecialties,
        diplomacyPacts: this.diplomacyPacts,
        factionAlliances: this.factionAlliances,
        draftedHeroId: this.draftedHeroId,
        draftTurnsLeft: this.draftTurnsLeft,
        overlordFaction: this.overlordFaction,
        monthlyBudgetLimit: this.monthlyBudgetLimit,
        spentBudgetThisTurn: this.spentBudgetThisTurn,
        isVictory: this.isVictory,
        isDefeat: this.isDefeat
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tokyo_conquest_save', JSON.stringify(data));
      }
      return { success: true, msg: 'セーブが完了しました（ローカルストレージ保存）' };
    } catch (e) {
      console.error('Save failed:', e);
      return { success: false, msg: 'セーブに失敗しました: ' + e.message };
    }
  }

  loadState() {
    try {
      if (typeof localStorage === 'undefined') return { success: false, msg: 'localStorage非対応環境です' };
      const raw = localStorage.getItem('tokyo_conquest_save');
      if (!raw) return { success: false, msg: 'セーブデータが見つかりません' };

      const data = JSON.parse(raw);
      this.year = data.year || 2026;
      this.month = data.month || 4;
      this.startingRegionName = data.startingRegionName || '新宿区';
      this.playerFaction = data.playerFaction || 'shinjuku';
      this.funds = data.funds || {};
      this.regions = data.regions || {};
      this.logs = data.logs || [];
      this.selectedRegionId = data.selectedRegionId;
      this.playerRoster = data.playerRoster || [];
      this.playerParty = data.playerParty || [];
      this.playerSpecialties = data.playerSpecialties || {};
      this.diplomacyPacts = data.diplomacyPacts || [];
      this.factionAlliances = (data.factionAlliances || []).filter(a => a.id !== 'alliance_tachikawa_neutral');
      this.draftedHeroId = data.draftedHeroId;
      this.draftTurnsLeft = data.draftTurnsLeft || 0;
      this.overlordFaction = data.overlordFaction;
      this.monthlyBudgetLimit = data.monthlyBudgetLimit || 3000;
      this.spentBudgetThisTurn = data.spentBudgetThisTurn || 0;
      this.isVictory = data.isVictory || false;
      this.isDefeat = data.isDefeat || false;

      // Compatibility migration for legacy save files
      Object.values(this.regions).forEach(r => {
        if (!r.population) {
          r.population = TOKYO_POPULATION_DATA[r.name] || 100000;
          r.initialPopulation = r.population;
        }
        if (r.netMigrants === undefined) r.netMigrants = 0;
        if (r.annualMigrants === undefined) r.annualMigrants = 0;
        if (r.lastAprilSubsidy === undefined) r.lastAprilSubsidy = 0;
      });

      this.addLog(`📂【ロード完了】${this.year}年${this.month}月の進行データを復元しました。`, 'develop');
      return { success: true, msg: `${this.year}年${this.month}月のセーブデータをロードしました！` };
    } catch (e) {
      console.error('Load failed:', e);
      return { success: false, msg: 'ロードに失敗しました: ' + e.message };
    }
  }

  hasSaveData() {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem('tokyo_conquest_save');
  }

  deleteSaveData() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tokyo_conquest_save');
    }
    return { success: true, msg: 'セーブデータを消去しました' };
  }
}

if (typeof module !== 'undefined') {
  module.exports = ConquestGame;
  module.exports.ConquestGame = ConquestGame;
  module.exports.FACTIONS = FACTIONS;
  module.exports.REGION_SPECIALTIES = REGION_SPECIALTIES;
  module.exports.TOKYO_POPULATION_DATA = TOKYO_POPULATION_DATA;
  module.exports.calculateInitialTroops = calculateInitialTroops;
  module.exports.getInitialPublicOrder = getInitialPublicOrder;
  module.exports.getRegionPreview = getRegionPreview;
}

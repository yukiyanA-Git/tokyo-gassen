// Character & Regional Heroes Database for Tokyo Conquest
// Each character has unique stats, roles, and skills (FF-style)

const CHARACTERS_DB = {
  // --- 新宿ネオン同盟 初期3人 ---
  shinjuku_lead: {
    id: 'shinjuku_lead',
    name: '歌舞伎町夜皇',
    title: '不夜城の覇者',
    regionName: '新宿区',
    faction: 'shinjuku',
    avatar: '🍷',
    role: '物理アタッカー',
    maxHp: 580,
    maxMp: 70,
    attack: 62,
    defense: 45,
    speed: 55,
    skills: [
      {
        id: 'host_slash',
        name: '不夜城ラッシュ',
        mp: 18,
        target: 'enemy_single',
        desc: '怒涛の3連撃で敵単体に特大物理ダメージ。',
        power: 1.8,
        type: 'damage'
      },
      {
        id: 'champagne_call',
        name: 'シャンパンコール',
        mp: 25,
        target: 'ally_all',
        desc: '味方全員の士気を高め、攻撃力を2ターンの間30%UP。',
        power: 0.3,
        type: 'buff_atk'
      }
    ]
  },
  shinjuku_guard: {
    id: 'shinjuku_guard',
    name: '市谷防衛監',
    title: '防衛省退役警備総監',
    regionName: '新宿区',
    faction: 'shinjuku',
    avatar: '🛡️',
    role: 'ディフェンダー',
    maxHp: 720,
    maxMp: 50,
    attack: 48,
    defense: 68,
    speed: 40,
    skills: [
      {
        id: 'iron_drone',
        name: '防衛省ドローンシールド',
        mp: 20,
        target: 'ally_all',
        desc: '味方全体に防護バリアを展開し、被ダメージを半減。',
        power: 0.5,
        type: 'buff_def'
      },
      {
        id: 'intercept_missile',
        name: '市谷迎撃ミサイル',
        mp: 28,
        target: 'enemy_all',
        desc: '敵全体に爆撃を敢行し装甲貫通ダメージを与える。',
        power: 1.2,
        type: 'damage_all'
      }
    ]
  },
  shinjuku_hacker: {
    id: 'shinjuku_hacker',
    name: '電脳歌舞伎ハッカー',
    title: '裏新宿サイバー工作員',
    regionName: '新宿区',
    faction: 'shinjuku',
    avatar: '💻',
    role: 'デバッファー/電子戦',
    maxHp: 460,
    maxMp: 90,
    attack: 40,
    defense: 38,
    speed: 62,
    skills: [
      {
        id: 'system_lock',
        name: '電脳ジャミング',
        mp: 22,
        target: 'enemy_single',
        desc: '敵単体の電子回路をクラックし、1ターン行動不能（スタン）にする。',
        power: 0.8,
        type: 'stun'
      },
      {
        id: 'emp_blast',
        name: 'EMPパルス放射',
        mp: 30,
        target: 'enemy_all',
        desc: '敵全体の防御力と素早さを2ターンの間大幅にダウンさせる。',
        power: 0.9,
        type: 'debuff_all'
      }
    ]
  },

  // --- 千代田都庁軍 初期3人 ---
  chiyoda_lead: {
    id: 'chiyoda_lead',
    name: '神田総帥（都知事）',
    title: '中央政権総帥',
    regionName: '千代田区',
    faction: 'chiyoda',
    avatar: '🏛️',
    role: '司令塔/アタッカー',
    maxHp: 620,
    maxMp: 80,
    attack: 58,
    defense: 52,
    speed: 50,
    skills: [
      {
        id: 'budget_cannon',
        name: '国家予算バースト',
        mp: 24,
        target: 'enemy_single',
        desc: '巨額の資金力を爆発力に変え、敵単体に特大の金塊破砕撃。',
        power: 2.0,
        type: 'damage'
      },
      {
        id: 'order_decree',
        name: '行政特命令',
        mp: 30,
        target: 'enemy_all',
        desc: '敵全体の士気を挫き、攻撃力を2ターン大幅低下させる。',
        power: 0.8,
        type: 'debuff_all'
      }
    ]
  },
  chiyoda_mage: {
    id: 'chiyoda_mage',
    name: '秋葉原マスター',
    title: '秋葉原電脳魔道士',
    regionName: '千代田区',
    faction: 'chiyoda',
    avatar: '⚡',
    role: '魔法アタッカー',
    maxHp: 440,
    maxMp: 100,
    attack: 66,
    defense: 36,
    speed: 54,
    skills: [
      {
        id: 'gigabit_thunder',
        name: 'ギガビット・サンダー',
        mp: 26,
        target: 'enemy_all',
        desc: '超高圧の電脳雷撃を落とし、敵全体に壊滅的電撃ダメージ。',
        power: 1.4,
        type: 'damage_all'
      },
      {
        id: 'overclock',
        name: 'オーバークロック',
        mp: 20,
        target: 'ally_single',
        desc: '味方単体の行動速度と攻撃力を爆発的に向上させる。',
        power: 0.5,
        type: 'buff_atk'
      }
    ]
  },
  chiyoda_support: {
    id: 'chiyoda_support',
    name: '丸の内キャピタル',
    title: 'メガバンク執行役員',
    regionName: '千代田区',
    faction: 'chiyoda',
    avatar: '💼',
    role: 'ヒーラー',
    maxHp: 500,
    maxMp: 85,
    attack: 42,
    defense: 48,
    speed: 48,
    skills: [
      {
        id: 'capital_inject',
        name: '公的資金注入',
        mp: 22,
        target: 'ally_single',
        desc: '味方単体のHPを260回復する。',
        power: 260,
        type: 'heal'
      },
      {
        id: 'stimulus_plan',
        name: '緊急経済対策',
        mp: 35,
        target: 'ally_all',
        desc: '味方全員のHPを150回復し、弱体効果を解除する。',
        power: 150,
        type: 'heal_all'
      }
    ]
  },

  // --- 港・湾岸コンツェルン 初期3人 ---
  minato_lead: {
    id: 'minato_lead',
    name: '六本木CEO',
    title: 'グローバル投資帝王',
    regionName: '港区',
    faction: 'minato',
    avatar: '💎',
    role: 'バランスアタッカー',
    maxHp: 590,
    maxMp: 75,
    attack: 57,
    defense: 48,
    speed: 53,
    skills: [
      {
        id: 'hostile_takeover',
        name: '敵対的買収（TOB）',
        mp: 22,
        target: 'enemy_single',
        desc: '敵単体に大ダメージを与え、さらにその攻撃力を奪い自らに加算。',
        power: 1.6,
        type: 'damage'
      },
      {
        id: 'golden_parachute',
        name: '黄金の防壁',
        mp: 26,
        target: 'ally_all',
        desc: '巨額資産のバリアで味方全体の防御力を2ターン大幅UP。',
        power: 0.4,
        type: 'buff_def'
      }
    ]
  },
  minato_sub1: {
    id: 'minato_sub1',
    name: '品川サイバーエージェント',
    title: '新幹線ターミナル司令',
    regionName: '品川区',
    faction: 'minato',
    avatar: '🚅',
    role: 'スピードアタッカー',
    maxHp: 510,
    maxMp: 65,
    attack: 60,
    defense: 44,
    speed: 66,
    skills: [
      {
        id: 'shinkansen_rush',
        name: '超電導リニア突撃',
        mp: 20,
        target: 'enemy_single',
        desc: '音速の突進で敵単体を貫き、大ダメージを与える。',
        power: 1.7,
        type: 'damage'
      }
    ]
  },
  minato_sub2: {
    id: 'minato_sub2',
    name: '台場メガフロート艦長',
    title: '臨海副都心水上部隊長',
    regionName: '江東区',
    faction: 'minato',
    avatar: '⚓',
    role: '重装砲撃士',
    maxHp: 650,
    maxMp: 55,
    attack: 55,
    defense: 60,
    speed: 42,
    skills: [
      {
        id: 'bay_cannon',
        name: '東京湾メガカノン',
        mp: 28,
        target: 'enemy_all',
        desc: '水上要塞から艦砲射撃を浴びせ、敵全体に大打撃。',
        power: 1.3,
        type: 'damage_all'
      }
    ]
  },

  // --- 城北・足立義勇軍 初期3人 ---
  adachi_lead: {
    id: 'adachi_lead',
    name: '下町総長',
    title: '荒川連合総長',
    regionName: '足立区',
    faction: 'adachi',
    avatar: '🔥',
    role: '狂戦士/バーサーカー',
    maxHp: 640,
    maxMp: 50,
    attack: 65,
    defense: 46,
    speed: 51,
    skills: [
      {
        id: 'senju_strike',
        name: '千住大乱闘',
        mp: 18,
        target: 'enemy_single',
        desc: '気合の一撃で敵単体に強力な渾身打撃。確率で会心の一撃。',
        power: 1.9,
        type: 'damage'
      },
      {
        id: 'guts_yell',
        name: '下町ど根性咆哮',
        mp: 24,
        target: 'ally_all',
        desc: '味方全員の攻撃力UPとHPを小回復。',
        power: 80,
        type: 'heal_all'
      }
    ]
  },
  adachi_sub1: {
    id: 'adachi_sub1',
    name: '葛飾寅次郎',
    title: '柴又の旅がらす',
    regionName: '葛飾区',
    faction: 'adachi',
    avatar: '🧳',
    role: 'トリックスター',
    maxHp: 520,
    maxMp: 70,
    attack: 50,
    defense: 48,
    speed: 58,
    skills: [
      {
        id: 'talk_confuse',
        name: '啖呵売の口八丁',
        mp: 18,
        target: 'enemy_single',
        desc: '流暢な口上で敵を幻惑させ、混乱させて同士討ちを狙う。',
        power: 1.1,
        type: 'stun'
      }
    ]
  },
  adachi_sub2: {
    id: 'adachi_sub2',
    name: '荒川リバーガード',
    title: '堤防守護戦士',
    regionName: '荒川区',
    faction: 'adachi',
    avatar: '🌊',
    role: 'ディフェンダー',
    maxHp: 680,
    maxMp: 45,
    attack: 46,
    defense: 65,
    speed: 43,
    skills: [
      {
        id: 'river_wall',
        name: '鉄壁の荒川水門',
        mp: 20,
        target: 'ally_all',
        desc: '水門を展開し、味方全体の防御力を2ターン強化。',
        power: 0.4,
        type: 'buff_def'
      }
    ]
  },

  // --- 武蔵野・西東京連盟 初期3人 ---
  musashino_lead: {
    id: 'musashino_lead',
    name: '吉祥寺賢者',
    title: '井の頭文化大賢者',
    regionName: '武蔵野市',
    faction: 'musashino',
    avatar: '🌿',
    role: '賢者（万能回復＆魔法）',
    maxHp: 530,
    maxMp: 95,
    attack: 54,
    defense: 46,
    speed: 52,
    skills: [
      {
        id: 'inokashira_grace',
        name: '住みたい街オーラ',
        mp: 24,
        target: 'ally_all',
        desc: '井の頭の清らかな癒しで味方全体のHPを180大回復。',
        power: 180,
        type: 'heal_all'
      },
      {
        id: 'suburb_wind',
        name: '武蔵野新緑旋風',
        mp: 25,
        target: 'enemy_all',
        desc: '突風の魔力で敵全体を吹き飛ばし、風属性ダメージ。',
        power: 1.3,
        type: 'damage_all'
      }
    ]
  },
  musashino_sub1: {
    id: 'musashino_sub1',
    name: '三鷹の森レンジャー',
    title: '緑地防衛スナイパー',
    regionName: '三鷹市',
    faction: 'musashino',
    avatar: '🏹',
    role: '遠隔スナイパー',
    maxHp: 500,
    maxMp: 60,
    attack: 62,
    defense: 42,
    speed: 64,
    skills: [
      {
        id: 'snipe_shot',
        name: '急所狙撃',
        mp: 16,
        target: 'enemy_single',
        desc: '敵の弱点を正確に撃ち抜き、大ダメージ。',
        power: 1.7,
        type: 'damage'
      }
    ]
  },
  musashino_sub2: {
    id: 'musashino_sub2',
    name: '杉並アニメーター',
    title: '杉並クリエイティブ術師',
    regionName: '杉並区',
    faction: 'musashino',
    avatar: '🎨',
    role: 'イリュージョニスト',
    maxHp: 470,
    maxMp: 85,
    attack: 52,
    defense: 40,
    speed: 57,
    skills: [
      {
        id: 'sakuga_strike',
        name: '神作画エフェクトバースト',
        mp: 22,
        target: 'enemy_all',
        desc: 'ド派手な演出の光線作画で敵全体を目眩まし＆ダメージ。',
        power: 1.2,
        type: 'damage_all'
      }
    ]
  },

  // --- 八王子・多摩山岳衆 初期3人 ---
  hachioji_lead: {
    id: 'hachioji_lead',
    name: '多摩の覇王',
    title: '甲州要塞総帥',
    regionName: '八王子市',
    faction: 'hachioji',
    avatar: '⛰️',
    role: '重装豪傑アタッカー',
    maxHp: 660,
    maxMp: 55,
    attack: 64,
    defense: 62,
    speed: 44,
    skills: [
      {
        id: 'hachioji_castle',
        name: '難攻不落・八王子城砕き',
        mp: 22,
        target: 'enemy_single',
        desc: '巨岩を振り下ろす豪快な一撃。敵単体に粉砕特大ダメージ。',
        power: 1.9,
        type: 'damage'
      },
      {
        id: 'mountain_roar',
        name: '多摩山脈の咆哮',
        mp: 26,
        target: 'ally_all',
        desc: '味方全体の防御力を大幅に引き上げる。',
        power: 0.4,
        type: 'buff_def'
      }
    ]
  },
  hachioji_sub1: {
    id: 'hachioji_sub1',
    name: '高尾山岳天狗',
    title: '霊峰高尾の修験者',
    regionName: '八王子市',
    faction: 'hachioji',
    avatar: '👺',
    role: '風術格闘家',
    maxHp: 560,
    maxMp: 75,
    attack: 58,
    defense: 48,
    speed: 65,
    skills: [
      {
        id: 'tengu_kick',
        name: '天狗疾風脚',
        mp: 18,
        target: 'enemy_single',
        desc: '疾風の連続蹴りで敵単体にダメージ＋味方全体の行動順加速。',
        power: 1.6,
        type: 'damage'
      }
    ]
  },
  hachioji_sub2: {
    id: 'hachioji_sub2',
    name: '奥多摩ウッドランナー',
    title: '原生林サバイバー',
    regionName: '奥多摩町',
    faction: 'hachioji',
    avatar: '🌲',
    role: 'サバイバリスト',
    maxHp: 590,
    maxMp: 60,
    attack: 54,
    defense: 54,
    speed: 56,
    skills: [
      {
        id: 'herbal_cure',
        name: '奥多摩源泉湯治薬',
        mp: 20,
        target: 'ally_single',
        desc: '薬草と源泉の力で味方単体のHPを220回復。',
        power: 220,
        type: 'heal'
      }
    ]
  },

  // ==========================================
  // --- 敵地・中立地制圧で【登用（スカウト）】できるご当地武将たち ---
  // ==========================================

  sumida_rec: {
    id: 'sumida_rec',
    name: 'スカイツリー技官',
    title: '天空の電波狙撃手',
    regionName: '墨田区',
    faction: 'neutral',
    avatar: '🗼',
    role: '超長距離スナイパー',
    maxHp: 480,
    maxMp: 85,
    attack: 68,
    defense: 40,
    speed: 58,
    skills: [
      {
        id: 'skytree_laser',
        name: '天空観測レーザー照射',
        mp: 26,
        target: 'enemy_single',
        desc: '地上634mのアンテナから集束レーザーを地上へ直撃！極大貫通ダメージ。',
        power: 2.2,
        type: 'damage'
      },
      {
        id: 'broadcast_hack',
        name: '広域電波ジャック',
        mp: 24,
        target: 'enemy_all',
        desc: '敵全体の通信機に高周波ノイズを流し込み、1ターン行動を妨害。',
        power: 0.7,
        type: 'stun'
      }
    ]
  },

  taito_rec: {
    id: 'taito_rec',
    name: '上野ビーストテイマー',
    title: '上野動物園猛獣部隊長',
    regionName: '台東区',
    faction: 'neutral',
    avatar: '🐼',
    role: 'ビースト召喚士',
    maxHp: 550,
    maxMp: 80,
    attack: 56,
    defense: 50,
    speed: 50,
    skills: [
      {
        id: 'panda_rush',
        name: '猛獣解放・パンダパニック',
        mp: 24,
        target: 'enemy_all',
        desc: '上野の猛獣が一斉に敵陣へ突撃！敵全体に物理ダメージ＋パニック付与。',
        power: 1.4,
        type: 'damage_all'
      }
    ]
  },

  ota_rec: {
    id: 'ota_rec',
    name: '羽田フライトキャプテン',
    title: '空路挺進部隊長',
    regionName: '大田区',
    faction: 'neutral',
    avatar: '✈️',
    role: '航空砲撃士',
    maxHp: 520,
    maxMp: 80,
    attack: 63,
    defense: 45,
    speed: 60,
    skills: [
      {
        id: 'airstrike',
        name: '羽田空挺絨毯爆撃',
        mp: 28,
        target: 'enemy_all',
        desc: '羽田空港より大型爆撃機をスクランブル発進。敵陣を焦土と化す！',
        power: 1.5,
        type: 'damage_all'
      }
    ]
  },

  saitama_rec: {
    id: 'saitama_rec',
    name: '埼玉境の使者',
    title: '彩の国からの加勢者',
    regionName: '北区', // 埼京線ルートの要所
    faction: 'neutral',
    avatar: '🌾',
    role: 'カオス召喚士',
    maxHp: 600,
    maxMp: 70,
    attack: 57,
    defense: 52,
    speed: 53,
    skills: [
      {
        id: 'saitama_call',
        name: '突発！翔んで埼玉義勇軍',
        mp: 25,
        target: 'enemy_all',
        desc: 'なぜか県境を越えて埼玉の大軍団が雪崩れ込む！敵全体に大打撃＋味方支援。',
        power: 1.4,
        type: 'damage_all'
      }
    ]
  },

  shibuya_rec: {
    id: 'shibuya_rec',
    name: '渋谷トレンドクイーン',
    title: 'スクランブル情報統制官',
    regionName: '渋谷区',
    faction: 'neutral',
    avatar: '📱',
    role: 'マインドコントロール/バッファー',
    maxHp: 480,
    maxMp: 90,
    attack: 48,
    defense: 42,
    speed: 64,
    skills: [
      {
        id: 'sns_buzz',
        name: 'バズ・プロパガンダ',
        mp: 22,
        target: 'enemy_all',
        desc: 'SNSで敵軍の悪評を拡散し、敵全体の攻撃力と防御力を大幅低下。',
        power: 0.9,
        type: 'debuff_all'
      }
    ]
  },

  tachikawa_rec: {
    id: 'tachikawa_rec',
    name: '立川フライトガード',
    title: '立川広域防災基地司令',
    regionName: '立川市',
    faction: 'neutral',
    avatar: '🚁',
    role: '救援スペシャリスト',
    maxHp: 580,
    maxMp: 75,
    attack: 52,
    defense: 56,
    speed: 55,
    skills: [
      {
        id: 'airlift_rescue',
        name: '緊急空輸メディック',
        mp: 24,
        target: 'ally_all',
        desc: 'レスキューヘリから補給物資を投下し、味方全員のHPを170回復。',
        power: 170,
        type: 'heal_all'
      }
    ]
  },

  machida_rec: {
    id: 'machida_rec',
    name: '町田ボーダーナイト',
    title: '神奈川・東京緩衝帯の守護神',
    regionName: '町田市',
    faction: 'neutral',
    avatar: '⚔️',
    role: '二刀流フェンサー',
    maxHp: 610,
    maxMp: 60,
    attack: 62,
    defense: 50,
    speed: 59,
    skills: [
      {
        id: 'dual_cross',
        name: '町田二重国境斬り',
        mp: 18,
        target: 'enemy_single',
        desc: '領土の狭間を疾走する二段斬りで敵単体に大ダメージ。',
        power: 1.75,
        type: 'damage'
      }
    ]
  },

  ome_rec: {
    id: 'ome_rec',
    name: '青梅レトロニンジャ',
    title: '昭和幻影忍び',
    regionName: '青梅市',
    faction: 'neutral',
    avatar: '🥷',
    role: '忍術アサシン',
    maxHp: 500,
    maxMp: 70,
    attack: 64,
    defense: 42,
    speed: 70,
    skills: [
      {
        id: 'shadow_strike',
        name: '青梅幻影分身斬り',
        mp: 19,
        target: 'enemy_single',
        desc: '高速の分身攻撃で敵単体に回避不能の致命傷を与える。',
        power: 1.85,
        type: 'damage'
      }
    ]
  }
};

// Map each region name to its recruitable character if any
const REGION_RECRUIT_MAP = {
  '墨田区': 'sumida_rec',
  '台東区': 'taito_rec',
  '大田区': 'ota_rec',
  '北区': 'saitama_rec',
  '渋谷区': 'shibuya_rec',
  '立川市': 'tachikawa_rec',
  '町田市': 'machida_rec',
  '青梅市': 'ome_rec',
  '千代田区': 'chiyoda_lead',
  '新宿区': 'shinjuku_lead',
  '港区': 'minato_lead',
  '足立区': 'adachi_lead',
  '武蔵野市': 'musashino_lead',
  '八王子市': 'hachioji_lead'
};

// Initial roster of 3 characters for each faction
const FACTION_STARTERS = {
  shinjuku: ['shinjuku_lead', 'shinjuku_guard', 'shinjuku_hacker'],
  chiyoda: ['chiyoda_lead', 'chiyoda_mage', 'chiyoda_support'],
  minato: ['minato_lead', 'minato_sub1', 'minato_sub2'],
  adachi: ['adachi_lead', 'adachi_sub1', 'adachi_sub2'],
  musashino: ['musashino_lead', 'musashino_sub1', 'musashino_sub2'],
  hachioji: ['hachioji_lead', 'hachioji_sub1', 'hachioji_sub2']
};

// Pre-defined additional regional heroes for all other municipalities in Tokyo
const ALL_REGIONAL_HERO_TEMPLATES = {
  '世田谷区': {
    lead: { id: 'setagaya_lead', name: '世田谷豪農頭領', title: '豪徳寺の招き猫大将', role: 'バランスアタッカー', avatar: '🐱', maxHp: 610, maxMp: 70, attack: 59, defense: 50, speed: 52, skills: [{ id: 'maneki_strike', name: '招福連撃招き猫', mp: 18, target: 'enemy_single', desc: '招福の猫パンチ3連撃で敵単体に大ダメージ。', power: 1.7, type: 'damage' }] },
    sub1: { id: 'setagaya_sub1', name: '二子玉マダムガード', title: '多摩川沿岸防壁', role: 'ディフェンダー', avatar: '👜', maxHp: 720, maxMp: 45, attack: 46, defense: 68, speed: 42, skills: [{ id: 'tamagawa_shield', name: '多摩川リバーシールド', mp: 20, target: 'ally_all', desc: '味方全体に頑丈な水防壁を展開。', power: 0.45, type: 'buff_def' }] },
    sub2: { id: 'setagaya_sub2', name: '下北沢シアター術士', title: '小劇場カルチャー魔術師', role: 'デバッファー', avatar: '🎭', maxHp: 480, maxMp: 90, attack: 52, defense: 40, speed: 56, skills: [{ id: 'subcul_confuse', name: '演劇的幻惑カーテン', mp: 22, target: 'enemy_all', desc: '敵全体を幻惑し攻撃力を低下させる。', power: 0.35, type: 'debuff_atk' }] }
  },
  '杉並区': {
    lead: { id: 'suginami_lead', name: '杉並アニメクリエイター', title: '作画スタジオ巨匠', role: '魔法アタッカー', avatar: '🎨', maxHp: 500, maxMp: 95, attack: 65, defense: 38, speed: 58, skills: [{ id: 'frame_burst', name: '毎秒60フレーム原画乱舞', mp: 24, target: 'enemy_all', desc: '圧倒的作画密度で敵全体に魔法ダメージ。', power: 1.35, type: 'damage_all' }] },
    sub1: { id: 'suginami_sub1', name: '阿佐ヶ谷ジャズマスター', title: '阿佐谷七夕ストリート', role: '支援/資金補給', avatar: '🎷', maxHp: 520, maxMp: 80, attack: 45, defense: 48, speed: 50, skills: [{ id: 'jazz_rhythm', name: '即興スウィングメロディ', mp: 20, target: 'ally_all', desc: '味方全体の行動速度を向上。', power: 0.4, type: 'buff_speed' }] },
    sub2: { id: 'suginami_sub2', name: '高円寺ストリート剛将', title: '古着街のストリート武闘家', role: '物理アタッカー', avatar: '🎸', maxHp: 640, maxMp: 55, attack: 61, defense: 48, speed: 52, skills: [{ id: 'street_rush', name: '純情商店街チャージ', mp: 18, target: 'enemy_single', desc: 'パワフルな突進で敵単体を粉砕。', power: 1.7, type: 'damage' }] }
  },
  '練馬区': {
    lead: { id: 'nerima_lead', name: '練馬キャベツ剛将', title: '都市農業の鉄人', role: '物理アタッカー', avatar: '🥬', maxHp: 660, maxMp: 50, attack: 64, defense: 54, speed: 46, skills: [{ id: 'cabbage_crush', name: '練馬大根剛力叩き', mp: 18, target: 'enemy_single', desc: '巨大な収穫物で敵単体を叩きのめす。', power: 1.8, type: 'damage' }] },
    sub1: { id: 'nerima_sub1', name: '大泉アニメディレクター', title: 'アニメ発祥地司令官', role: '電脳砲撃', avatar: '🎬', maxHp: 480, maxMp: 90, attack: 60, defense: 42, speed: 54, skills: [{ id: 'cell_laser', name: 'セル画レーザー砲', mp: 22, target: 'enemy_single', desc: '光学ビームで敵単体に大ダメージ。', power: 1.75, type: 'damage' }] },
    sub2: { id: 'nerima_sub2', name: '光が丘団地ガーディアン', title: '巨大団地防衛隊長', role: 'ディフェンダー', avatar: '🏢', maxHp: 750, maxMp: 45, attack: 45, defense: 70, speed: 38, skills: [{ id: 'mega_wall', name: 'マンモス団地防護壁', mp: 20, target: 'ally_all', desc: '味方全体の被ダメージを大幅軽減。', power: 0.5, type: 'buff_def' }] }
  },
  '中野区': {
    lead: { id: 'nakano_lead', name: '中野サブカル総帥', title: 'ブロードウェイの覇者', role: '魔法アタッカー', avatar: '👾', maxHp: 520, maxMp: 85, attack: 63, defense: 44, speed: 55, skills: [{ id: 'vintage_ray', name: 'ヴィンテージ・カオス波動', mp: 22, target: 'enemy_all', desc: '混沌のコレクターズ波動で敵全体を攻撃。', power: 1.3, type: 'damage_all' }] },
    sub1: { id: 'nakano_sub1', name: '中野サンモール警備員', title: 'アーケード商店街護衛', role: 'ディフェンダー', avatar: '👮', maxHp: 710, maxMp: 50, attack: 48, defense: 66, speed: 44, skills: [{ id: 'arcade_shield', name: '全天候型アーケードガード', mp: 20, target: 'ally_all', desc: '味方全体に防護天幕を展開。', power: 0.45, type: 'buff_def' }] },
    sub2: { id: 'nakano_sub2', name: '中野鑑定マイスター', title: 'まんだら鑑定士', role: '支援/資金補給', avatar: '🔍', maxHp: 490, maxMp: 85, attack: 44, defense: 46, speed: 50, skills: [{ id: 'appraise_heal', name: '至高の一品リカバリー', mp: 24, target: 'ally_all', desc: '味方全体のHPを回復。', power: 140, type: 'heal_all' }] }
  },
  '豊島区': {
    lead: { id: 'toshima_lead', name: '池袋梟夜叉', title: 'いけふくろうの化身', role: '忍術アサシン', avatar: '🦉', maxHp: 530, maxMp: 75, attack: 66, defense: 40, speed: 68, skills: [{ id: 'owl_slash', name: '夜叉フクロウ乱舞', mp: 20, target: 'enemy_single', desc: '暗闇から音もなく急襲する致命刃。', power: 1.85, type: 'damage' }] },
    sub1: { id: 'toshima_sub1', name: 'サンシャイン超高層守護', title: '池袋サンシャイン要塞長', role: 'ディフェンダー', avatar: '☀️', maxHp: 730, maxMp: 50, attack: 48, defense: 68, speed: 42, skills: [{ id: 'sun_barrier', name: 'スカイサーカス光壁', mp: 22, target: 'ally_all', desc: '味方全体に光の防御膜を張る。', power: 0.45, type: 'buff_def' }] },
    sub2: { id: 'toshima_sub2', name: '巣鴨トゲぬき導師', title: '地蔵通りの治癒師', role: 'ヒーラー', avatar: '📿', maxHp: 510, maxMp: 90, attack: 40, defense: 44, speed: 46, skills: [{ id: 'togenuki_heal', name: 'トゲぬき延命祈願', mp: 26, target: 'ally_all', desc: '味方全体のHPを癒し苦痛を取り除く。', power: 160, type: 'heal_all' }] }
  },
  '中央区': {
    lead: { id: 'chuo_lead', name: '銀座大番頭', title: '銀聯の大豪商', role: '支援/資金補給', avatar: '🪙', maxHp: 580, maxMp: 80, attack: 52, defense: 50, speed: 50, skills: [{ id: 'ginza_gold', name: '銀座小判千両シャワー', mp: 25, target: 'ally_all', desc: '味方全体の士気と攻撃力を大幅UP。', power: 0.35, type: 'buff_atk' }] },
    sub1: { id: 'chuo_sub1', name: '築地魚河岸剛腕', title: '場外市場の競り頭', role: '物理アタッカー', avatar: '🐟', maxHp: 680, maxMp: 45, attack: 65, defense: 52, speed: 48, skills: [{ id: 'tuna_blade', name: 'マグロ解体大包丁斬', mp: 18, target: 'enemy_single', desc: '一刀両断の豪快な一撃。', power: 1.8, type: 'damage' }] },
    sub2: { id: 'chuo_sub2', name: '日本橋道路元標守', title: '五街道起点防衛士', role: 'ディフェンダー', avatar: '🗾', maxHp: 720, maxMp: 50, attack: 46, defense: 68, speed: 40, skills: [{ id: 'highway_barrier', name: '五街道合流ゲートシールド', mp: 20, target: 'ally_all', desc: 'あらゆる侵入を食い止める堅牢な防壁。', power: 0.45, type: 'buff_def' }] }
  },
  '文京区': {
    lead: { id: 'bunkyo_lead', name: '本郷学士院総長', title: '赤門の最高知性', role: '術士/電脳砲撃', avatar: '🎓', maxHp: 470, maxMp: 105, attack: 68, defense: 38, speed: 56, skills: [{ id: 'scholar_laser', name: '超弦理論メテオ', mp: 28, target: 'enemy_all', desc: '物理法則を再定義して敵全体を粉砕。', power: 1.45, type: 'damage_all' }] },
    sub1: { id: 'bunkyo_sub1', name: '小石川植物園薬師', title: '徳川御薬園の伝承者', role: 'ヒーラー', avatar: '🌿', maxHp: 530, maxMp: 85, attack: 42, defense: 46, speed: 48, skills: [{ id: 'herbal_remedy', name: '万病治癒の秘草煎じ', mp: 22, target: 'ally_single', desc: '味方単体のHPを280回復。', power: 280, type: 'heal' }] },
    sub2: { id: 'bunkyo_sub2', name: '音羽出版参謀', title: '活字の策士', role: 'デバッファー/電子戦', avatar: '📚', maxHp: 500, maxMp: 85, attack: 50, defense: 42, speed: 52, skills: [{ id: 'criticism_word', name: '辛辣なる論壇批評', mp: 20, target: 'enemy_all', desc: '敵全体の士気と攻撃力を削ぎ落とす。', power: 0.3, type: 'debuff_atk' }] }
  },
  '品川区': {
    lead: { id: 'shinagawa_lead', name: '東海道品川宿陣頭', title: '第一京浜の韋駄天', role: 'バランスアタッカー', avatar: '🏮', maxHp: 620, maxMp: 65, attack: 60, defense: 50, speed: 60, skills: [{ id: 'station_strike', name: '東海道一之宿突撃', mp: 18, target: 'enemy_single', desc: '宿場町の勢いを乗せた猛烈な連撃。', power: 1.75, type: 'damage' }] },
    sub1: { id: 'shinagawa_sub1', name: '大崎テクノロジーガード', title: '先端開発特区の守護者', role: 'ディフェンダー', avatar: '🤖', maxHp: 710, maxMp: 55, attack: 48, defense: 66, speed: 44, skills: [{ id: 'tech_barrier', name: 'ナノテク硬化シールド', mp: 20, target: 'ally_all', desc: '最新ナノマテリアルで味方を保護。', power: 0.45, type: 'buff_def' }] },
    sub2: { id: 'shinagawa_sub2', name: '天王洲アイル水運術士', title: '運河都市のナビゲーター', role: '術士/電脳砲撃', avatar: '🌊', maxHp: 490, maxMp: 85, attack: 62, defense: 40, speed: 52, skills: [{ id: 'canal_wave', name: '品川運河サージ', mp: 24, target: 'enemy_all', desc: '運河の奔流を巻き起こして敵全体を一掃。', power: 1.3, type: 'damage_all' }] }
  },
  '目黒区': {
    lead: { id: 'meguro_lead', name: '目黒サンマ奉行', title: '秋刀魚名物奉行', role: '物理アタッカー', avatar: '🗡️', maxHp: 630, maxMp: 60, attack: 63, defense: 48, speed: 56, skills: [{ id: 'sanma_slash', name: '目黒の秋刀魚一閃', mp: 18, target: 'enemy_single', desc: '香ばしき炭火の如き鋭い斬撃。', power: 1.8, type: 'damage' }] },
    sub1: { id: 'meguro_sub1', name: '目黒川桜守護導師', title: '桜並木の番人', role: 'ヒーラー', avatar: '🌸', maxHp: 530, maxMp: 85, attack: 42, defense: 48, speed: 48, skills: [{ id: 'sakura_bloom', name: '目黒川満開桜の恵み', mp: 25, target: 'ally_all', desc: '舞い散る花びらで味方全体を回復。', power: 150, type: 'heal_all' }] },
    sub2: { id: 'meguro_sub2', name: '自由が丘カフェマスター', title: 'ハイソサエティ支援役', role: '支援/資金補給', avatar: '☕', maxHp: 510, maxMp: 80, attack: 46, defense: 46, speed: 52, skills: [{ id: 'espresso_boost', name: '極上エスプレッソ覚醒', mp: 20, target: 'ally_single', desc: '味方単体の攻撃力と行動力を高める。', power: 0.45, type: 'buff_atk' }] }
  },
  '江東区': {
    lead: { id: 'koto_lead', name: '深川木場鳶頭', title: '角乗りの達人', role: '物理アタッカー', avatar: '🪵', maxHp: 670, maxMp: 50, attack: 65, defense: 52, speed: 50, skills: [{ id: 'lumber_smash', name: '木場名物大丸太落とし', mp: 19, target: 'enemy_single', desc: '巨大な銘木を豪快に叩きつける。', power: 1.85, type: 'damage' }] },
    sub1: { id: 'koto_sub1', name: '豊洲市場大仕入頭', title: '水産仲卸の総大将', role: '支援/資金補給', avatar: '🦀', maxHp: 560, maxMp: 75, attack: 50, defense: 50, speed: 48, skills: [{ id: 'market_supply', name: '豊洲極上鮮魚補給', mp: 22, target: 'ally_all', desc: '新鮮な栄養で味方全体を小回復＆強化。', power: 110, type: 'heal_all' }] },
    sub2: { id: 'koto_sub2', name: '有明ビッグサイトガード', title: '国際展示場守備隊', role: 'ディフェンダー', avatar: '🏢', maxHp: 730, maxMp: 50, attack: 46, defense: 70, speed: 40, skills: [{ id: 'exhibition_shield', name: '逆ピラミッド絶対防衛', mp: 22, target: 'ally_all', desc: '巨大展示場の構造で味方を包み込む。', power: 0.5, type: 'buff_def' }] }
  },
  '荒川区': {
    lead: { id: 'arakawa_lead', name: '荒川都電ライダー', title: '下町都電の爆走王', role: '機動アタッカー', avatar: '🚃', maxHp: 590, maxMp: 70, attack: 61, defense: 48, speed: 66, skills: [{ id: 'toden_ram', name: '都電荒川線フルスロットル', mp: 18, target: 'enemy_single', desc: 'レトロ路面電車で敵陣へ突撃。', power: 1.75, type: 'damage' }] },
    sub1: { id: 'arakawa_sub1', name: '日暮里繊維街クラフト', title: '布地問屋の職人', role: '支援/資金補給', avatar: '🧵', maxHp: 520, maxMp: 80, attack: 45, defense: 48, speed: 50, skills: [{ id: 'textile_armor', name: '特製二重織り防護衣', mp: 20, target: 'ally_all', desc: '頑丈な織物で味方全体の守備力を強化。', power: 0.35, type: 'buff_def' }] },
    sub2: { id: 'arakawa_sub2', name: '南千住下町鉄壁', title: 'コツ通り防衛士', role: 'ディフェンダー', avatar: '🛡️', maxHp: 720, maxMp: 45, attack: 48, defense: 68, speed: 38, skills: [{ id: 'shitamachi_guard', name: '人情長屋の結束障壁', mp: 20, target: 'ally_all', desc: '固い絆の盾で攻撃をブロック。', power: 0.45, type: 'buff_def' }] }
  },
  '板橋区': {
    lead: { id: 'itabashi_lead', name: '板橋宿関門将', title: '中山道第一宿の関所頭', role: 'ディフェンダー', avatar: '🚪', maxHp: 760, maxMp: 45, attack: 52, defense: 72, speed: 40, skills: [{ id: 'gate_crush', name: '中山道板橋大門鉄壁', mp: 20, target: 'ally_all', desc: '関所の大扉を閉ざし味方全員の防御を大幅UP。', power: 0.5, type: 'buff_def' }] },
    sub1: { id: 'itabashi_sub1', name: '高島平団地司令', title: 'メガ団地群の統率者', role: '術士/電脳砲撃', avatar: '🏢', maxHp: 490, maxMp: 85, attack: 61, defense: 42, speed: 52, skills: [{ id: 'highrise_artillery', name: '高層バルコニー集中射撃', mp: 22, target: 'enemy_single', desc: '高所からの集中砲火で敵単体に特大ダメージ。', power: 1.8, type: 'damage' }] },
    sub2: { id: 'itabashi_sub2', name: '志村一里塚歩兵長', title: '街道巡回のベテラン', role: '物理アタッカー', avatar: '🚩', maxHp: 630, maxMp: 55, attack: 60, defense: 50, speed: 52, skills: [{ id: 'patrol_strike', name: '一里塚急襲槍', mp: 18, target: 'enemy_single', desc: '正確無比な槍撃で敵の急所を突く。', power: 1.7, type: 'damage' }] }
  },
  '葛飾区': {
    lead: { id: 'katsushika_lead', name: '柴又風来坊', title: '帝釈天の人情旅人', role: 'バランスアタッカー', avatar: '🧳', maxHp: 620, maxMp: 75, attack: 58, defense: 50, speed: 55, skills: [{ id: 'torasan_talk', name: '名調子・寅さん話術', mp: 20, target: 'enemy_all', desc: '小気味よい啖呵売で敵全体を脱力させ弱体化。', power: 0.35, type: 'debuff_atk' }] },
    sub1: { id: 'katsushika_sub1', name: '亀有派出所巡査部長', title: '下町公園前治安の要', role: 'ディフェンダー', avatar: '👮‍♂️', maxHp: 740, maxMp: 50, attack: 52, defense: 68, speed: 46, skills: [{ id: 'police_shield', name: '亀有パトロール鉄壁陣', mp: 20, target: 'ally_all', desc: '市民を守る絶対の警戒態勢を展開。', power: 0.45, type: 'buff_def' }] },
    sub2: { id: 'katsushika_sub2', name: '水元公園メタセコイア導師', title: '都内最大の水郷守', role: 'ヒーラー', avatar: '🌲', maxHp: 510, maxMp: 85, attack: 42, defense: 46, speed: 48, skills: [{ id: 'mizumoto_heal', name: '水郷森林浴の奇跡', mp: 25, target: 'ally_all', desc: '水辺のマイナスイオンで味方全体を回復。', power: 150, type: 'heal_all' }] }
  },
  '江戸川区': {
    lead: { id: 'edogawa_lead', name: '葛西臨海キャプテン', title: '東京湾外洋ナビゲーター', role: '遠隔スナイパー/航空支援', avatar: '⚓', maxHp: 610, maxMp: 75, attack: 63, defense: 48, speed: 56, skills: [{ id: 'kasai_ferry', name: '東京湾岸水上砲撃', mp: 22, target: 'enemy_single', desc: '湾岸の高速船から砲撃を浴びせる。', power: 1.8, type: 'damage' }] },
    sub1: { id: 'edogawa_sub1', name: '小松菜ビタミン仙人', title: '伝統野菜の伝道師', role: 'ヒーラー', avatar: '🥬', maxHp: 540, maxMp: 80, attack: 44, defense: 48, speed: 48, skills: [{ id: 'komatsuna_power', name: '小松菜エキス全快薬', mp: 24, target: 'ally_all', desc: '鉄分とビタミンで味方全体のHPを回復。', power: 155, type: 'heal_all' }] },
    sub2: { id: 'edogawa_sub2', name: '小岩下町ファイター', title: '新小岩通り乱闘将', role: '物理アタッカー', avatar: '🥊', maxHp: 660, maxMp: 50, attack: 64, defense: 50, speed: 52, skills: [{ id: 'koiwa_punch', name: '江戸川魂剛腕パンチ', mp: 18, target: 'enemy_single', desc: '下町根性の一撃で敵単体を吹っ飛ばす。', power: 1.75, type: 'damage' }] }
  },
  '調布市': {
    lead: { id: 'chofu_lead', name: '調布特撮ディレクター', title: '映画のまちの魔術師', role: '術士/電脳砲撃', avatar: '🎬', maxHp: 510, maxMp: 95, attack: 64, defense: 42, speed: 54, skills: [{ id: 'kaiju_laser', name: '特撮巨大怪獣ビーム', mp: 26, target: 'enemy_all', desc: 'スタジオ特撮の火炎放射で敵全体を焼き尽くす。', power: 1.4, type: 'damage_all' }] },
    sub1: { id: 'chofu_sub1', name: '深大寺蕎麦仙人', title: '名刹門前の達人', role: 'ヒーラー', avatar: '🍜', maxHp: 560, maxMp: 75, attack: 45, defense: 50, speed: 46, skills: [{ id: 'soba_cure', name: '深大寺湧水手打ち蕎麦', mp: 22, target: 'ally_single', desc: '名物蕎麦を食して味方単体のHPを280回復。', power: 280, type: 'heal' }] },
    sub2: { id: 'chofu_sub2', name: '味スタサポーター剛将', title: '東京スタジアムの闘将', role: '物理アタッカー', avatar: '⚽', maxHp: 670, maxMp: 50, attack: 63, defense: 52, speed: 52, skills: [{ id: 'stadium_roar', name: '味スタ熱狂チャント', mp: 20, target: 'ally_all', desc: '味方全体の攻撃力を2ターン大幅UP。', power: 0.35, type: 'buff_atk' }] }
  },
  '三鷹市': {
    lead: { id: 'mitaka_lead', name: '三鷹の森マスター', title: '森と文学の守護者', role: 'スナイパー/航空支援', avatar: '🍃', maxHp: 530, maxMp: 85, attack: 62, defense: 46, speed: 60, skills: [{ id: 'forest_wind', name: '三鷹緑陰旋風矢', mp: 20, target: 'enemy_single', desc: '森の風に乗せて敵の急所を射抜く。', power: 1.8, type: 'damage' }] },
    sub1: { id: 'mitaka_sub1', name: '太宰思索の文士', title: '禅林寺の文学哲人', role: 'デバッファー/電子戦', avatar: '📖', maxHp: 470, maxMp: 95, attack: 50, defense: 40, speed: 52, skills: [{ id: 'dazai_melancholy', name: '人間失格の憂愁', mp: 22, target: 'enemy_all', desc: '深い憂愁で敵全体の戦意を喪失させる。', power: 0.35, type: 'debuff_atk' }] },
    sub2: { id: 'mitaka_sub2', name: '山本有三記念館ガード', title: '路傍の石の防衛士', role: 'ディフェンダー', avatar: '🪨', maxHp: 720, maxMp: 45, attack: 48, defense: 68, speed: 42, skills: [{ id: 'stone_barrier', name: '路傍の巨石シールド', mp: 20, target: 'ally_all', desc: '何事にも動じぬ巨石の壁で味方を守る。', power: 0.45, type: 'buff_def' }] }
  },
  '府中市': {
    lead: { id: 'fuchu_lead', name: '大國魂神官総大将', title: '武蔵国総社の神職', role: '司令塔/アタッカー', avatar: '⛩️', maxHp: 640, maxMp: 75, attack: 61, defense: 52, speed: 52, skills: [{ id: 'kurayami_matsuri', name: 'くらやみ祭り大太鼓', mp: 24, target: 'enemy_all', desc: '天地を揺るがす大太鼓の轟音で敵全体を圧倒。', power: 1.35, type: 'damage_all' }] },
    sub1: { id: 'fuchu_sub1', name: '東京競馬ダービージョッキー', title: '府中芝コースの覇者', role: '忍術アサシン', avatar: '🐎', maxHp: 550, maxMp: 65, attack: 62, defense: 42, speed: 72, skills: [{ id: 'derby_spur', name: '直線一気の大外強襲', mp: 18, target: 'enemy_single', desc: '驚異の加速力で敵単体を翻弄し切り裂く。', power: 1.8, type: 'damage' }] },
    sub2: { id: 'fuchu_sub2', name: '府中宿甲州街道守', title: '宿場町本陣の番頭', role: 'ディフェンダー', avatar: '🏯', maxHp: 730, maxMp: 45, attack: 46, defense: 68, speed: 40, skills: [{ id: 'post_town_wall', name: '甲州街道本陣防衛柵', mp: 20, target: 'ally_all', desc: '味方全体を強固な柵で守護。', power: 0.45, type: 'buff_def' }] }
  },
  '青梅市': {
    lead: { id: 'ome_rec', name: '青梅レトロニンジャ', title: '昭和幻影忍び', role: '忍術アサシン', avatar: '🥷', maxHp: 500, maxMp: 70, attack: 64, defense: 42, speed: 70, skills: [{ id: 'shadow_strike', name: '青梅幻影分身斬り', mp: 19, target: 'enemy_single', desc: '高速の分身攻撃で敵単体に致命傷。', power: 1.85, type: 'damage' }] },
    sub1: { id: 'ome_sub1', name: '御岳山修験者', title: '武蔵御嶽神社の山伏', role: 'ヒーラー', avatar: '🏔️', maxHp: 540, maxMp: 80, attack: 45, defense: 48, speed: 48, skills: [{ id: 'mitake_pray', name: '御嶽狼神の加護', mp: 24, target: 'ally_all', desc: 'おいぬ様の神威で味方全体を癒やす。', power: 150, type: 'heal_all' }] },
    sub2: { id: 'ome_sub2', name: '吉野梅郷ガード', title: '梅林の堅城守', role: 'ディフェンダー', avatar: '🌸', maxHp: 730, maxMp: 45, attack: 48, defense: 68, speed: 42, skills: [{ id: 'plum_barrier', name: '青梅紅梅の防護壁', mp: 20, target: 'ally_all', desc: '芳しき梅香の結界で味方を防御。', power: 0.45, type: 'buff_def' }] }
  },
  '奥多摩町': {
    lead: { id: 'okutama_lead', name: '奥多摩鍾乳洞地殻術士', title: '日原鍾乳洞の主', role: '術士/電脳砲撃', avatar: '🦇', maxHp: 520, maxMp: 90, attack: 65, defense: 44, speed: 52, skills: [{ id: 'stalactite_fall', name: '日原鍾乳石クラスター', mp: 24, target: 'enemy_all', desc: '鍾乳洞の鋭利な岩石を降らせて全体攻撃。', power: 1.35, type: 'damage_all' }] },
    sub1: { id: 'okutama_sub1', name: '奥多摩湖水守神', title: '小河内ダムの巨神', role: 'ディフェンダー', avatar: '🏞️', maxHp: 770, maxMp: 45, attack: 50, defense: 72, speed: 36, skills: [{ id: 'dam_floodgate', name: '小河内ダム鉄壁水門', mp: 22, target: 'ally_all', desc: '巨大ダムの分厚いコンクリートで味方を防護。', power: 0.5, type: 'buff_def' }] },
    sub2: { id: 'okutama_sub2', name: '多摩源流ワサビ薬師', title: '清流の栽培名人', role: 'ヒーラー', avatar: '🌱', maxHp: 530, maxMp: 85, attack: 42, defense: 46, speed: 50, skills: [{ id: 'wasabi_revive', name: '源流生ワサビ覚醒水', mp: 24, target: 'ally_single', desc: 'ピリッとした清涼水で味方単体のHPを280回復。', power: 280, type: 'heal' }] }
  },
  '檜原村': {
    lead: { id: 'hinohara_lead', name: '檜原払沢の滝行者', title: '滝百選の修験仙人', role: 'バランスアタッカー', avatar: '🧘', maxHp: 630, maxMp: 80, attack: 60, defense: 52, speed: 52, skills: [{ id: 'hossa_waterfall', name: '払沢氷爆滝落とし', mp: 22, target: 'enemy_single', desc: '滝の激流パワーで敵単体を打倒。', power: 1.8, type: 'damage' }] },
    sub1: { id: 'hinohara_sub1', name: '都内唯一の村防衛隊長', title: '西川林業の豪腕', role: 'ディフェンダー', avatar: '🪵', maxHp: 760, maxMp: 40, attack: 52, defense: 70, speed: 38, skills: [{ id: 'cedar_shield', name: '檜原極上ヒノキ防壁', mp: 20, target: 'ally_all', desc: '天然銘木の頑強な盾で味方を守る。', power: 0.45, type: 'buff_def' }] },
    sub2: { id: 'hinohara_sub2', name: '数馬温泉の湯守', title: '秘境温泉の癒やし手', role: 'ヒーラー', avatar: '♨️', maxHp: 540, maxMp: 85, attack: 40, defense: 48, speed: 48, skills: [{ id: 'kazuma_hotspring', name: '数馬の湯薬湯治癒', mp: 24, target: 'ally_all', desc: '秘境の霊泉で味方全体のHPを回復。', power: 155, type: 'heal_all' }] }
  }
};

// Generic generator for any municipality not explicitly hardcoded
function createGenericHeroesForRegion(regionName) {
  const safeId = regionName.replace(/[市町村区]/g, '');
  return {
    lead: {
      id: `${safeId}_lead`,
      name: `${regionName}の旗頭`,
      title: `${regionName}自治警備総監`,
      role: '物理アタッカー',
      avatar: '⚔️',
      maxHp: 620,
      maxMp: 60,
      attack: 62,
      defense: 50,
      speed: 52,
      skills: [{
        id: `${safeId}_lead_skill`,
        name: `${regionName}義勇の一撃`,
        mp: 18,
        target: 'enemy_single',
        desc: `${regionName}の誇りを懸けた渾身の攻撃。`,
        power: 1.75,
        type: 'damage'
      }]
    },
    sub1: {
      id: `${safeId}_sub1`,
      name: `${regionName}の副官`,
      title: `${regionName}防衛堅城守`,
      role: 'ディフェンダー',
      avatar: '🛡️',
      maxHp: 720,
      maxMp: 45,
      attack: 46,
      defense: 68,
      speed: 40,
      skills: [{
        id: `${safeId}_sub1_skill`,
        name: `${regionName}郷土防壁`,
        mp: 20,
        target: 'ally_all',
        desc: '郷土の絆で味方全体の守備力を高める。',
        power: 0.45,
        type: 'buff_def'
      }]
    },
    sub2: {
      id: `${safeId}_sub2`,
      name: `${regionName}の参謀`,
      title: `${regionName}行政知略官`,
      role: 'ヒーラー',
      avatar: '📜',
      maxHp: 520,
      maxMp: 85,
      attack: 42,
      defense: 45,
      speed: 48,
      skills: [{
        id: `${safeId}_sub2_skill`,
        name: `${regionName}復興の光`,
        mp: 24,
        target: 'ally_all',
        desc: '行政手腕を発揮して味方全体の傷を癒やす。',
        power: 150,
        type: 'heal_all'
      }]
    }
  };
}

// Get or register starter 3 heroes for ANY of the 53 municipalities
function getStarterHeroesForRegion(regionName) {
  // 1. Original 6 Capitals
  const capitalFactionMap = {
    '新宿区': 'shinjuku',
    '千代田区': 'chiyoda',
    '港区': 'minato',
    '足立区': 'adachi',
    '武蔵野市': 'musashino',
    '八王子市': 'hachioji'
  };
  if (capitalFactionMap[regionName] && FACTION_STARTERS[capitalFactionMap[regionName]]) {
    return FACTION_STARTERS[capitalFactionMap[regionName]];
  }

  // 2. Pre-defined template or generic template
  const template = ALL_REGIONAL_HERO_TEMPLATES[regionName] || createGenericHeroesForRegion(regionName);

  // Register in CHARACTERS_DB if not already present
  ['lead', 'sub1', 'sub2'].forEach(slot => {
    const char = template[slot];
    if (!CHARACTERS_DB[char.id]) {
      CHARACTERS_DB[char.id] = {
        id: char.id,
        name: char.name,
        title: char.title,
        regionName: regionName,
        faction: 'player',
        avatar: char.avatar,
        role: char.role,
        maxHp: char.maxHp,
        maxMp: char.maxMp,
        attack: char.attack,
        defense: char.defense,
        speed: char.speed,
        skills: char.skills
      };
    }
  });

  const heroIds = [template.lead.id, template.sub1.id, template.sub2.id];

  // Also map lead to REGION_RECRUIT_MAP so conquering this area allows recruiting them!
  if (!REGION_RECRUIT_MAP[regionName]) {
    REGION_RECRUIT_MAP[regionName] = template.lead.id;
  }

  return heroIds;
}

if (typeof module !== 'undefined') {
  module.exports = {
    CHARACTERS_DB,
    REGION_RECRUIT_MAP,
    FACTION_STARTERS,
    ALL_REGIONAL_HERO_TEMPLATES,
    getStarterHeroesForRegion
  };
}


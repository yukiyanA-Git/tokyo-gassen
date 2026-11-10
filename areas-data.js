// Areas Master Data for Tokyo RPG Engine (100% Data-Driven Architecture)
// Compatible with dynamic JSON feeds from 5-Brain AI Urban Design Team

const AREAS_DATA = {
  "akihabara": {
    "areaId": "akihabara",
    "name": "秋葉原工学要塞",
    "regionName": "千代田区",
    "dominantFaction": "秋葉原ジャンクギルド",
    "currencyAccepted": ["junk_parts", "battery_cell"],
    "atmosphere": "ネオンが明滅し、地熱発電の蒸気とハンダの匂いが充満するジャンク都市",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 19, "y": 11 }, // World map coordinates
    "facilities": [
      {
        "id": "fac_aki_inn",
        "type": "inn",
        "name": "カプセル再充電所",
        "cost": 10,
        "costUnit": "battery_cell",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "カプセル再充電所へようこそ。高密度エネルギーセルで傷ついた部隊を完全再充填するかい？"
      },
      {
        "id": "fac_aki_shop",
        "type": "shop",
        "name": "闇パーツ問屋",
        "position": { "x": 18, "y": 6 },
        "currency": "junk_parts",
        "inventory": ["wpn_stun_rod", "wpn_plasma_blade", "item_emp_grenade", "item_repair_kit", "item_pass_chiyoda"],
        "welcomeMessage": "へへっ、どんな電子クズでも磨けば兵器になる。仕入れたての工学パーツを見ていくかい？"
      },
      {
        "id": "fac_aki_checkpoint",
        "type": "checkpoint",
        "name": "万世橋検問所",
        "position": { "x": 12, "y": 2 },
        "passRequirement": "item_pass_chiyoda",
        "requiredItemName": "千代田中央通行許可証",
        "blockedMessage": "止まれ！ここから先は千代田都庁管轄区だ。『千代田中央通行許可証』を持たぬ野良犬は通さん！",
        "passedMessage": "……チッ、許可証を確認した。通るがいい、だが都庁中枢で余計な真似はするなよ。"
      }
    ],
    "npcs": [
      {
        "id": "npc_aki_001",
        "name": "技師長・ゲンゾウ",
        "title": "工学ギルドマスター",
        "sprite": "npc_engineer",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "ここは電気の通る唯一の街だ。山手線外周のスラムから来たなら、まずはバッテリーを補充しな。",
          "万世橋を渡って千代田へ向かいたいなら、東の闇パーツ問屋で『千代田中央通行許可証』を手に入れておくんだな。"
        ],
        "questId": "quest_substation_repair"
      },
      {
        "id": "npc_aki_002",
        "name": "ハッカー・ミリ",
        "title": "電子情報ブローカー",
        "sprite": "npc_hacker",
        "position": { "x": 15, "y": 12 },
        "dialogues": [
          "アタシの回路（サーキット）にタダで触らないでよ。…情報が欲しいならジャンク部品（junk_parts）を持ってきな。",
          "都庁軍は街の通信網を盗聴してるわ。迂闊に動くとドローンに蜂の巣にされるわよ。"
        ]
      },
      {
        "id": "npc_aki_003",
        "name": "廃品回収少年・テツ",
        "title": "見習いスカベンジャー",
        "sprite": "npc_scavenger",
        "position": { "x": 8, "y": 12 },
        "dialogues": [
          "ガード下のゴミ山からレアな基板を見つけたんだ！",
          "西の新宿は紙幣（standard_yen）が幅を利かせてるらしいけど、この街じゃハンダとバッテリーが命さ！"
        ]
      }
    ]
  },
  "shinjuku_neon": {
    "areaId": "shinjuku_neon",
    "name": "新宿不夜城要塞",
    "regionName": "新宿区",
    "dominantFaction": "新宿不夜城軍",
    "currencyAccepted": ["standard_yen", "food_ration"],
    "atmosphere": "極彩色のネオンが霧雨に反射し、夜の動員兵と歓楽の喧騒が渦巻く電撃歓楽要塞",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 14, "y": 11 },
    "facilities": [
      {
        "id": "fac_sin_inn",
        "type": "inn",
        "name": "歌舞伎町カプセルホテル",
        "cost": 800,
        "costUnit": "standard_yen",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "いらっしゃい。不夜城の夜は長いぜ。ひと休みして部隊の体力を完全回復していくかい？"
      },
      {
        "id": "fac_sin_shop",
        "type": "shop",
        "name": "ゴールデン街闇調達屋",
        "position": { "x": 18, "y": 6 },
        "currency": "standard_yen",
        "inventory": ["wpn_cyber_dagger", "item_neon_whiskey", "item_emp_grenade"],
        "welcomeMessage": "金（旧紙幣）さえ積めば、都庁の機密データだろうが特注の暗殺武器だろうが何でも揃えてやるよ。"
      },
      {
        "id": "fac_sin_checkpoint",
        "type": "checkpoint",
        "name": "大ガード北検問所",
        "position": { "x": 12, "y": 2 },
        "passRequirement": "item_emp_grenade",
        "requiredItemName": "EMPパルスグレネード",
        "blockedMessage": "ここは新宿の北防衛ラインだ。ドローン迎撃用の『EMPパルスグレネード』を所持していない民間人は通せないな！",
        "passedMessage": "よし、EMPグレネードを携帯しているな。安全確保を確認した、通過を許可する！"
      }
    ],
    "npcs": [
      {
        "id": "npc_sin_001",
        "name": "夜皇の側近・マキト",
        "title": "不夜城幕僚長",
        "sprite": "npc_officer",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "新宿は夜に生きる者の街だ。外から来たなら、まずは街のルール……すなわち力と金を弁えることだ。",
          "東の秋葉原では部品が通貨だと聞いたが、ここでは旧紙幣（円）こそが物を言う。"
        ]
      },
      {
        "id": "npc_sin_002",
        "name": "黒服の用心棒・タイガ",
        "title": "電撃警護兵",
        "sprite": "npc_guard",
        "position": { "x": 16, "y": 12 },
        "dialogues": [
          "不夜城軍の動員力は東京一だ。油断して暴れ回ると、夜の闇に消されることになるぜ。"
        ]
      }
    ]
  },
  "chiyoda_citadel": {
    "areaId": "chiyoda_citadel",
    "name": "千代田都庁中央要塞",
    "regionName": "千代田区",
    "dominantFaction": "千代田都庁軍",
    "currencyAccepted": ["standard_yen", "battery_cell"],
    "atmosphere": "旧中枢中枢の重厚な石垣と防弾ガラスに覆われ、旧統治機構の残光を放つ中央要塞",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 50, "y": 22 },
    "facilities": [
      {
        "id": "fac_chi_inn",
        "type": "inn",
        "name": "旧霞ヶ関官房宿舎",
        "cost": 1000,
        "costUnit": "standard_yen",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "ここは千代田都庁の直轄宿舎だ。厳格な警護のもとで英気を養っていきなさい。"
      },
      {
        "id": "fac_chi_shop",
        "type": "shop",
        "name": "中央調達購買部",
        "position": { "x": 18, "y": 6 },
        "currency": "standard_yen",
        "inventory": ["wpn_plasma_blade", "item_repair_kit", "item_emp_grenade"],
        "welcomeMessage": "都庁の正規官給品を特別に融通してやろう。相応の対価を用意したまえ。"
      }
    ],
    "npcs": [
      {
        "id": "npc_chi_001",
        "name": "官房総務官・ナガセ",
        "title": "都庁主席補佐",
        "sprite": "npc_officer",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "東京の分断が始まって久しいが、千代田こそが法と秩序の正統後継者だ。",
          "多摩や湾岸がどう動こうと、この中枢の防壁を破ることは誰にも叶わない。"
        ]
      }
    ]
  },
  "shibuya_crossing": {
    "areaId": "shibuya_crossing",
    "name": "渋谷電脳防衛要塞",
    "regionName": "渋谷区",
    "dominantFaction": "渋谷スクランブル防衛網",
    "currencyAccepted": ["junk_parts", "standard_yen"],
    "atmosphere": "巨大ビジョン群がサイバーノイズを垂れ流し、電子ゲリラと情報屋が暗躍する迷宮交差点",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 44, "y": 26 },
    "facilities": [
      {
        "id": "fac_sby_inn",
        "type": "inn",
        "name": "地下シェルターラウンジ",
        "cost": 750,
        "costUnit": "standard_yen",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "ハッカーも傭兵もここじゃ休戦だ。ドリンク飲んでHPを回復しな。"
      },
      {
        "id": "fac_sby_shop",
        "type": "shop",
        "name": "道玄坂ブラックマーケット",
        "position": { "x": 18, "y": 6 },
        "currency": "junk_parts",
        "inventory": ["wpn_cyber_dagger", "item_emp_grenade", "wpn_stun_rod"],
        "welcomeMessage": "電脳パーツなら渋谷一の品揃えだぜ。ジャンク部品で支払ってくれ。"
      }
    ],
    "npcs": [
      {
        "id": "npc_sby_001",
        "name": "情報屋・レイ",
        "title": "スクランブルウォッチャー",
        "sprite": "npc_engineer",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "新宿の不夜城と港区のコンツェルン……挟まれた渋谷は情報だけが生き残る武器さ。",
          "西の多摩へ通じる幹線道路はまだ塞がれてない。今のうちに動くことだな。"
        ]
      }
    ]
  },
  "ginza_vault": {
    "areaId": "ginza_vault",
    "name": "銀座中央金庫街",
    "regionName": "中央区",
    "dominantFaction": "銀座金融同盟",
    "currencyAccepted": ["standard_yen"],
    "atmosphere": "大理石の列柱と金箔の装飾が聳え、旧時代の金塊と旧紙幣が山と積まれる金融要塞",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 52, "y": 25 },
    "facilities": [
      {
        "id": "fac_gnz_inn",
        "type": "inn",
        "name": "貴賓倶楽部サロン",
        "cost": 1500,
        "costUnit": "standard_yen",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "ようこそ銀座貴賓館へ。至高の休息をお約束いたします。"
      },
      {
        "id": "fac_gnz_shop",
        "type": "shop",
        "name": "中央金庫特約商会",
        "position": { "x": 18, "y": 6 },
        "currency": "standard_yen",
        "inventory": ["wpn_plasma_blade", "item_repair_kit", "wpn_cyber_dagger"],
        "welcomeMessage": "価値ある武具をお求めですか？銀座では確かな品質のみを取り扱っております。"
      }
    ],
    "npcs": [
      {
        "id": "npc_gnz_001",
        "name": "頭取・カネミツ",
        "title": "金庫街筆頭出納官",
        "sprite": "npc_officer",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "乱世を動かす真の力は銃剣にあらず、通貨と信用取引にあり。",
          "軍資金を蓄えぬ大名に、天下統一の栄冠などあり得ません。"
        ]
      }
    ]
  },
  "hachioji_fort": {
    "areaId": "hachioji_fort",
    "name": "八王子山岳要塞",
    "regionName": "八王子市",
    "dominantFaction": "八王子山岳衆",
    "currencyAccepted": ["food_ration", "standard_yen"],
    "atmosphere": "高尾山麓の険峰を背負い、巨大な石垣と狼煙台が西東京の睨みを利かせる山岳要塞",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 18, "y": 27 },
    "facilities": [
      {
        "id": "fac_hac_inn",
        "type": "inn",
        "name": "高尾山陣屋",
        "cost": 500,
        "costUnit": "standard_yen",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "山越えの旅人よ、よくぞ参られた。陣屋の火で暖をとられよ。"
      },
      {
        "id": "fac_hac_shop",
        "type": "shop",
        "name": "甲州街道物資店",
        "position": { "x": 18, "y": 6 },
        "currency": "food_ration",
        "inventory": ["item_repair_kit", "wpn_stun_rod"],
        "welcomeMessage": "山岳衆の鍛えた武具だ。山じゃ金より食糧切符が喜ばれるぜ。"
      }
    ],
    "npcs": [
      {
        "id": "npc_hac_001",
        "name": "山岳衆頭領・ゲンエイ",
        "title": "西多摩防衛総督",
        "sprite": "npc_guard",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "都心23区の連中は多摩を見下すが、この山岳要塞を越えねば甲州への道は開けぬ。",
          "険しい山河こそ我が軍の最大の防壁よ。攻め寄せるなら覚悟してかかれ！"
        ]
      }
    ]
  },
  "okutama_haven": {
    "areaId": "okutama_haven",
    "name": "奥多摩源流郷",
    "regionName": "西多摩郡奥多摩町",
    "dominantFaction": "源流防衛共同体",
    "currencyAccepted": ["food_ration", "faith_talisman"],
    "atmosphere": "深い原生林の霧に包まれ、多摩川の清流と太古の巨木が聳える隠れ里",
    "width": 24,
    "height": 18,
    "worldPosition": { "x": 6, "y": 16 },
    "facilities": [
      {
        "id": "fac_oku_inn",
        "type": "inn",
        "name": "源流の湯小屋",
        "cost": 3,
        "costUnit": "faith_talisman",
        "position": { "x": 6, "y": 6 },
        "welcomeMessage": "源泉の秘湯です。信仰符をお納めくだされば、傷ついた魂も癒やされますよ。"
      },
      {
        "id": "fac_oku_shop",
        "type": "shop",
        "name": "深山薬草問屋",
        "position": { "x": 18, "y": 6 },
        "currency": "food_ration",
        "inventory": ["item_repair_kit", "item_neon_whiskey"],
        "welcomeMessage": "奥多摩の山で採れた秘薬と物資を分けてあげよう。"
      }
    ],
    "npcs": [
      {
        "id": "npc_oku_001",
        "name": "長老・ミズハ",
        "title": "源流郷守り人",
        "sprite": "npc_engineer",
        "position": { "x": 12, "y": 9 },
        "dialogues": [
          "東京の水はすべてこの奥多摩の山々から湧き出ている。",
          "戦乱に疲れたなら、いつでもこの源流郷へ羽を休めにいらっしゃい。"
        ]
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.AREAS_DATA = AREAS_DATA;
}
if (typeof module !== 'undefined') {
  module.exports = { AREAS_DATA };
}

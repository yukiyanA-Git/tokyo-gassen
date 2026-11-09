// Retro 16x16 Pixel Art Sprites for Tokyo Conquest
// High-definition SVG Pixel Art rendered directly with crisp-edges

const PIXEL_SPRITES = (function() {
  // Helper to generate crisp pixel art SVG from a 16x16 color-mapped matrix
  // palette: { key: colorHex }
  // rows: array of 16 strings, each 16 chars long ('.' = transparent)
  function createPixelSvg(palette, rows) {
    let rects = '';
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char !== '.' && palette[char]) {
          rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[char]}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="36" height="36" style="image-rendering: pixelated; shape-rendering: crispEdges; display:inline-block; vertical-align:middle;">${rects}</svg>`;
  }

  // --- 1. 新宿ネオン同盟 ---
  // 歌舞伎町夜皇 (金髪・紫ホストスーツ・シャンパングラス)
  const shinjuku_lead = createPixelSvg(
    { 'Y': '#facc15', 'S': '#fcd34d', 'F': '#fde68a', 'P': '#9333ea', 'D': '#581c87', 'W': '#ffffff', 'R': '#ef4444', 'K': '#0f172a', 'G': '#38bdf8' },
    [
      "....YYYYYYYY....",
      "...YYYYYYYYYY...",
      "..YYSSSSSSSSYY..",
      "..YYFFFFFFFFYY..",
      "..YYFKFFFKFFYY..",
      "...YFFFFFFFY....",
      "....FFRRRFF.....",
      "....PPPPPPP.....",
      "...PPWWWWWPP....",
      "...PPDDWDDDP.G..",
      "..PPPDDWDDDPPWW.",
      "..P.PDDWDDDP..W.",
      "....PDDWDDDP....",
      "....DD...DD.....",
      "....DD...DD.....",
      "...KKK...KKK...."
    ]
  );

  // 市谷防衛監 (防衛省迷彩ヘルメット・シールド・タクティカルスーツ)
  const shinjuku_guard = createPixelSvg(
    { 'H': '#15803d', 'M': '#166534', 'V': '#38bdf8', 'F': '#fde68a', 'B': '#334155', 'G': '#64748b', 'S': '#0284c7', 'K': '#0f172a', 'W': '#e2e8f0' },
    [
      "....HHHHHHHH....",
      "...HMMHHMMHHH...",
      "..HMMMMHHHHMMH..",
      "..HHVVVVVVVVHH..",
      "...HVVVVVVVVH...",
      "....FFFFFFFF....",
      "....BBBBBBBB....",
      "..SBBGGGGGGBS...",
      ".SS.BGGGGGGBS...",
      ".SS.BGBBBGBGSS..",
      ".SS.BGGGGGGBS...",
      "....BGGGGGGBS...",
      "....BBBBBBBB....",
      "....BB....BB....",
      "....KK....KK....",
      "...KKKK..KKKK..."
    ]
  );

  // 電脳歌舞伎ハッカー (サイバーフード・バイザー・電脳ポッド)
  const shinjuku_hacker = createPixelSvg(
    { 'C': '#06b6d4', 'N': '#0891b2', 'H': '#1e293b', 'V': '#22c55e', 'F': '#fde68a', 'G': '#334155', 'K': '#0f172a', 'P': '#a855f7' },
    [
      "....HHHHHHHH....",
      "...HHNNNNNNHH...",
      "..HHNNNNNNNNHH..",
      "..HNVVVVVVVVNH..",
      "..HNVVVVVVVVNH..",
      "...HFFFFFFFFH...",
      "....HHCCCCNH....",
      "...HHGGGGGGHH...",
      "..CC.GGPPGG.CC..",
      ".CCC.GGGGGG.CCC.",
      ".CCC.GGGGGG.CCC.",
      "....GGGGGGGG....",
      "....GG....GG....",
      "....HH....HH....",
      "....KK....KK....",
      "...KKK....KKK..."
    ]
  );

  // --- 2. 千代田都庁軍 ---
  // 神田総帥（都知事） (金縁眼鏡・知事スーツ・青マント)
  const chiyoda_lead = createPixelSvg(
    { 'G': '#94a3b8', 'F': '#fde68a', 'E': '#eab308', 'B': '#1e3a8a', 'C': '#2563eb', 'W': '#ffffff', 'R': '#dc2626', 'K': '#0f172a' },
    [
      "....GGGGGGGG....",
      "...GGGGGGGGGG...",
      "..GGGGGGGGGGGG..",
      "..GGFFFFFFFFGG..",
      "..GGEFEEEFEFGG..",
      "...GFFFFFFFFG...",
      "....FFFRRFFF....",
      "...BBCCCCCCBB...",
      "..BBCWWWWWWCCB..",
      "..BC.CCRRCC.CB..",
      "..BC.CCCCCC.CB..",
      "..B..CCCCCC..B..",
      ".....CCCCCC.....",
      ".....BB..BB.....",
      ".....BB..BB.....",
      "....KKK..KKK...."
    ]
  );

  // 秋葉原マスター (電撃ウィザード・VRゴーグル・電波アンテナ)
  const chiyoda_mage = createPixelSvg(
    { 'A': '#eab308', 'V': '#ec4899', 'F': '#fde68a', 'R': '#3b82f6', 'D': '#1d4ed8', 'L': '#facc15', 'W': '#ffffff', 'K': '#0f172a' },
    [
      "......AA.AA.....",
      ".....AAAAAAAA...",
      "....AAAAAAAAAA..",
      "...AAVVVVVVVVAA.",
      "...AAVWWVVWWVAA.",
      "....AFFFFFFFFA..",
      "....RRRRRRRR....",
      "...RRRRLLRRRR...",
      "..RRRRRLLRRRRR..",
      ".LL.RRRRRRRR.LL.",
      "LLL.RRDDDDDR.LLL",
      ".L..RRDDDDDR..L.",
      "....RRDDDDDR....",
      "....DD....DD....",
      "....DD....DD....",
      "...KKK....KKK..."
    ]
  );

  // 丸の内キャピタル (金融エリート・アタッシュケース・ネイビースーツ)
  const chiyoda_support = createPixelSvg(
    { 'H': '#1e293b', 'F': '#fde68a', 'G': '#e2e8f0', 'S': '#0f172a', 'T': '#0284c7', 'C': '#f59e0b', 'W': '#ffffff' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHHHHHHHHHHH..",
      "..HHFFFFFFFFHH..",
      "..HHFGFFFGFFHH..",
      "...HFFFFFFFFH...",
      "....FFFTTFFF....",
      "....SSSSSSSS....",
      "...SSSWWWSSS....",
      "..SSS.SWTS.SSS..",
      "..S.S.SSSS.S.S..",
      "....S.SSSS.S.C..",
      "....S.SSSS.SCCC.",
      "......SSSS...CC.",
      "......SS.SS.....",
      ".....SSS.SSS...."
    ]
  );

  // --- 3. 港・湾岸コンツェルン ---
  // 六本木CEO (ワインレッドタキシード・サングラス・葉巻)
  const minato_lead = createPixelSvg(
    { 'H': '#0f172a', 'G': '#334155', 'F': '#fde68a', 'R': '#881337', 'B': '#e11d48', 'W': '#ffffff', 'O': '#ea580c', 'C': '#f59e0b' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHGGGGGGGGHH..",
      "..HHGGGGGGGGHH..",
      "...HFFFFFFFFH...",
      "....FFFFFOOO....",
      "....FFFCFFFF....",
      "...RRRRRRRRRR...",
      "..RRRWWWBWWRRR..",
      "..RR.RRWBWRR.RR.",
      "..R..RRRRRRR..R.",
      ".....RRRRRRR....",
      ".....RRRRRRR....",
      ".....HH...HH....",
      ".....HH...HH....",
      "....HHH...HHH..."
    ]
  );

  // 品川サイバーエージェント (新幹線ブルー・電脳ギア)
  const minato_sub1 = createPixelSvg(
    { 'H': '#0284c7', 'F': '#fde68a', 'V': '#38bdf8', 'B': '#0369a1', 'W': '#ffffff', 'K': '#0f172a' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHVVVVVVVVHH..",
      "..HHVWWVVWWVHH..",
      "...HFFFFFFFFH...",
      "....FFFFFFFF....",
      "...BBBBBBBBBB...",
      "..BBBWWBWWBBB...",
      "..B.BBWWBWWBB.B.",
      "....BBBBBBBBB...",
      "....BBBBBBBBB...",
      "....BB.....BB...",
      "....KK.....KK...",
      "...KKK.....KKK..",
      "................",
      "................"
    ]
  );

  // 台場メガフロート艦長 (海軍ホワイト制服・アンカー)
  const minato_sub2 = createPixelSvg(
    { 'H': '#ffffff', 'B': '#1e3a8a', 'C': '#f59e0b', 'F': '#fde68a', 'K': '#0f172a' },
    [
      "....HHHHHHHH....",
      "...HBBBBBBBBH...",
      "...HBBBBBBBBH...",
      "....BBCCCCBB....",
      "....FFFFFFFF....",
      "...HFFFFFFFFH...",
      "..HHHHHHHHHHHH..",
      "..HHHBCCCBHHHH..",
      "..H.HBCCCBH.H...",
      "....HHHHHHHH....",
      "....HHHHHHHH....",
      "....BB....BB....",
      "....BB....BB....",
      "...KKK....KKK...",
      "................",
      "................"
    ]
  );

  // --- 4. 城北・足立義勇軍 ---
  // 下町総長 (赤特攻服・鉢巻・木刀)
  const adachi_lead = createPixelSvg(
    { 'H': '#ffffff', 'F': '#fde68a', 'R': '#dc2626', 'D': '#991b1b', 'K': '#0f172a', 'W': '#b45309' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..KKKKKKKKKKKK..",
      "..KKFFFFFFFFKK..",
      "...KFFFFFFFFK...",
      "....FFFFFFFF.W..",
      "...RRRRRRRRRR.W.",
      "..RRRRDDRRRRR.W.",
      "..RR.RDDRRD.R.W.",
      "..R..RDDRRD...W.",
      ".....RDDRRD...W.",
      ".....RRRRRR.....",
      ".....DD..DD.....",
      ".....DD..DD.....",
      "....KKK..KKK....",
      "................"
    ]
  );

  // 葛飾寅次郎 (茶羽織・ハット・トランク)
  const adachi_sub1 = createPixelSvg(
    { 'H': '#b45309', 'L': '#d97706', 'F': '#fde68a', 'K': '#1e293b', 'T': '#78350f', 'W': '#ffffff' },
    [
      "...LLLLLLLLLL...",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHFFFFFFHH...",
      "....FFFFFFFF....",
      "....FFFFFFFF....",
      "...LLLLLLLLLL...",
      "..LLLLWWWWLLLL..",
      "..LL.LLWWLL.LL..",
      "..L..LLLLLL..L..",
      ".....LLLLLL..T..",
      ".....LLLLLL.TTT.",
      ".....KK..KK..TT.",
      ".....KK..KK.....",
      "....KKK..KKK....",
      "................"
    ]
  );

  // 荒川リバーガード (水上レスキュー・ライフジャケット)
  const adachi_sub2 = createPixelSvg(
    { 'H': '#0284c7', 'O': '#ea580c', 'F': '#fde68a', 'W': '#ffffff', 'K': '#0f172a', 'B': '#1e3a8a' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHFFFFFFFFHH..",
      "...HFFFFFFFFH...",
      "....FFFFFFFF....",
      "...OOOOOOOOOO...",
      "..OOWWWOOOWWOO..",
      "..OO.WOOOWO.OO..",
      "..O..OOOOOO..O..",
      ".....BBBBBB.....",
      ".....BBBBBB.....",
      ".....BB..BB.....",
      ".....KK..KK.....",
      "....KKK..KKK....",
      "................",
      "................"
    ]
  );

  // --- 5. 武蔵野・西東京連盟 ---
  // 吉祥寺賢者 (緑ローブ・自然の杖・白髭)
  const musashino_lead = createPixelSvg(
    { 'G': '#15803d', 'L': '#22c55e', 'F': '#fde68a', 'W': '#ffffff', 'B': '#78350f', 'K': '#0f172a' },
    [
      "....GGGGGGGG....",
      "...GGLLLLLLGG...",
      "..GGLLLLLLLLGG..",
      "..GLLFFFFLLLLG..",
      "...GFFFFFFFG.B..",
      "....FWWWWWF..B..",
      "....WWWWWWW..B..",
      "...GGGGGGGG..B..",
      "..GGGLWWLGGGGB..",
      "..GG.LWWL.GG.B..",
      "..G..LWWL..G.B..",
      ".....GGGGGG.....",
      ".....GG..GG.....",
      "....KKK..KKK....",
      "................",
      "................"
    ]
  );

  // 三鷹の森レンジャー (緑フード・弓・エルフ耳)
  const musashino_sub1 = createPixelSvg(
    { 'H': '#166534', 'G': '#15803d', 'F': '#fde68a', 'B': '#92400e', 'Y': '#facc15' },
    [
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "...HHGGGGGGHH...",
      "..HHGGGGGGGGHH..",
      "..F.GFFFFFFG.F..",
      "....FFFFFFFF....",
      "...GGGGGGGGGG...",
      "..GGGBBGBBGGGB..",
      "..GG.BBGBB.G.B..",
      "..G..GGGGGG..B..",
      ".....GGGGGG..B..",
      ".....BB..BB.....",
      ".....BB..BB.....",
      "....BBB..BBB....",
      "................",
      "................"
    ]
  );

  // 杉並アニメーター (ベレー帽・ペンタブ・カジュアル服)
  const musashino_sub2 = createPixelSvg(
    { 'B': '#3b82f6', 'F': '#fde68a', 'P': '#ec4899', 'W': '#ffffff', 'K': '#0f172a' },
    [
      "...BBBBBBBBB....",
      "....BBBBBBBB....",
      "...BBFFFFFBBB...",
      "....FFFFFFFF....",
      "...FFFFFFFFFF...",
      "....FFFFFFFF.P..",
      "...WWWWWWWWWWP..",
      "..WWWWPWPWWWWP..",
      "..WW.WPWPW.WW...",
      ".....WWWWWW.....",
      ".....KK..KK.....",
      ".....KK..KK.....",
      "....KKK..KKK....",
      "................",
      "................",
      "................"
    ]
  );

  // --- 6. 八王子・多摩山岳衆 ---
  // 多摩の覇王 (戦国兜・虎皮マント・大太刀)
  const hachioji_lead = createPixelSvg(
    { 'Y': '#eab308', 'R': '#b91c1c', 'F': '#fde68a', 'O': '#f97316', 'K': '#0f172a', 'S': '#cbd5e1' },
    [
      "....YY....YY....",
      ".....YYYYYY.....",
      "....RRRRRRRR....",
      "...RRFFFFFFRR...",
      "...RFFFFFFFFR...",
      "....FFFFFFFF.S..",
      "...OOOOOOOOO.S..",
      "..OORRRRRRROOS..",
      "..OO.RRRR.OO.S..",
      "..O..RRRR..O.S..",
      ".....RRRR....S..",
      ".....KK..KK.....",
      ".....KK..KK.....",
      "....KKK..KKK....",
      "................",
      "................"
    ]
  );

  // 高尾山岳天狗 (天狗赤面・一本歯下駄・羽団扇)
  const hachioji_sub1 = createPixelSvg(
    { 'H': '#1e293b', 'R': '#dc2626', 'N': '#ef4444', 'W': '#ffffff', 'G': '#15803d', 'K': '#0f172a' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHNNNNNNNNHH..",
      "..HHNNWWNNWWNH..",
      "...HNNNNNNNNH...",
      "....NNNNNNNNNN..",
      "...GGGGGGGGGG...",
      "..GGGGWWGGGGG...",
      "..GG.GWWG.GG....",
      "..G..GGGG..G....",
      ".....GGGG.......",
      ".....KK..KK.....",
      ".....KK..KK.....",
      ".....K....K.....",
      "................",
      "................"
    ]
  );

  // 奥多摩ウッドランナー (巨木アックス・きこりチェックシャツ)
  const hachioji_sub2 = createPixelSvg(
    { 'H': '#78350f', 'R': '#dc2626', 'B': '#0f172a', 'F': '#fde68a', 'S': '#94a3b8' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHFFFFFFFFHH..",
      "...HFFFFFFFFH...",
      "....FFFFFFFF.S..",
      "....FWWWWWWFSSS.",
      "...RRBBRRBBRRS..",
      "..RRRBBRRBBRR...",
      "..RR.BBRRBB.RR..",
      "..R..BBRRBB..R..",
      ".....BBRRBB.....",
      ".....BB..BB.....",
      ".....BB..BB.....",
      "....BBB..BBB....",
      "................",
      "................"
    ]
  );

  // --- 7. 各地名将・スカウトキャラ (8名) ---
  // 墨田区: スカイツリー技官 (アンテナ・高所作業服・青ゴーグル)
  const sumida_rec = createPixelSvg(
    { 'A': '#38bdf8', 'V': '#0284c7', 'F': '#fde68a', 'W': '#ffffff', 'O': '#ea580c', 'K': '#0f172a' },
    [
      ".......AA.......",
      ".......AA.......",
      "....AAAAAAAA....",
      "...AAVVVVVVVAA..",
      "...AAVWWVVWWVA..",
      "....FFFFFFFF....",
      "...OOOOOOOOOO...",
      "..OOWWWOOOWWOO..",
      "..OO.WOOOWO.OO..",
      ".....OOOOOO.....",
      ".....KK..KK.....",
      ".....KK..KK.....",
      "....KKK..KKK....",
      "................",
      "................",
      "................"
    ]
  );

  // 台東区: 上野ビーストテイマー (パンダ着ぐるみヘッド・ムチ)
  const taito_rec = createPixelSvg(
    { 'W': '#ffffff', 'B': '#0f172a', 'P': '#ec4899', 'F': '#fde68a', 'L': '#92400e' },
    [
      "..BB........BB..",
      ".BBBB......BBBB.",
      "...WWWWWWWWWW...",
      "..WWBBWWWWBBWW..",
      "..WWBBWWWWBBWW..",
      "...WWWWBBWWWW...",
      "....FFFFFFFF....",
      "...PPPPPPPPPP...",
      "..PPPWWWWPPPP...",
      "..PP.WWWW.PP.L..",
      "..P..PPPP..P.LL.",
      ".....PPPP.....L.",
      ".....BB..BB.....",
      ".....BB..BB.....",
      "....BBB..BBB....",
      "................"
    ]
  );

  // 大田区: 羽田フライトキャプテン (パイロット制帽・白手袋)
  const ota_rec = createPixelSvg(
    { 'H': '#1e3a8a', 'G': '#eab308', 'F': '#fde68a', 'W': '#ffffff', 'B': '#0f172a' },
    [
      "....HHHHHHHH....",
      "...HHHHGGHHHH...",
      "...HHGGGGGGHH...",
      "....FFFFFFFF....",
      "...HFFFFFFFFH...",
      "....FFFFFFFF....",
      "...HHHHHHHHHH...",
      "..HHHWWGGWWHHH..",
      "..HH.WWGGWW.HH..",
      "..H..HHHHHH..H..",
      ".....HHHHHH.....",
      ".....BB..BB.....",
      ".....BB..BB.....",
      "....BBB..BBB....",
      "................",
      "................"
    ]
  );

  // 北区: 埼玉境の使者 (旅笠・草加煎餅・足袋)
  const saitama_rec = createPixelSvg(
    { 'H': '#ca8a04', 'F': '#fde68a', 'B': '#1e293b', 'W': '#ffffff', 'S': '#92400e' },
    [
      "....HHHHHHHH....",
      "..HHHHHHHHHHHH..",
      ".HHHHHHHHHHHHHH.",
      "....FFFFFFFF....",
      "....FFFFFFFF....",
      "...BBBBBBBBBB...",
      "..BBBWWWWWWBBB..",
      "..BB.WWWWWW.BB..",
      "..B..BBBBBB..B..",
      ".....BBBBBB.SS..",
      ".....BBBBBBSSSS.",
      ".....BB..BB.SS..",
      ".....WW..WW.....",
      "....WWW..WWW....",
      "................",
      "................"
    ]
  );

  // 渋谷区: 渋谷トレンドクイーン (ピンク髪・スマホ・ギャル服)
  const shibuya_rec = createPixelSvg(
    { 'P': '#f43f5e', 'F': '#fde68a', 'W': '#ffffff', 'C': '#06b6d4', 'S': '#1e293b' },
    [
      "....PPPPPPPP....",
      "...PPPPPPPPPP...",
      "..PPPPPPPPPPPP..",
      "..PPFFFFFFFFPP..",
      "...PFFFFFFFFP...",
      "....FFFFFFFF....",
      "...CCCCCCCCCC...",
      "..CCCWWWWCCCC...",
      "..CC.WWWW.CC.S..",
      "..C..CCCC..C.SS.",
      ".....PPPP.....S.",
      ".....FF..FF.....",
      ".....FF..FF.....",
      "....FFF..FFF....",
      "................",
      "................"
    ]
  );

  // 立川市: 立川フライトガード (陸自ヘリパイロット・迷彩)
  const tachikawa_rec = createPixelSvg(
    { 'H': '#166534', 'V': '#38bdf8', 'F': '#fde68a', 'C': '#15803d', 'K': '#0f172a' },
    [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "..HHVVVVVVVVHH..",
      "...HVVVVVVVVH...",
      "....FFFFFFFF....",
      "...CCCCCCCCCC...",
      "..CCCHHCCHCCCC..",
      "..CC.HHCCH.CC...",
      "..C..CCCCCC..C..",
      ".....CCCCCC.....",
      ".....HH..HH.....",
      ".....HH..HH.....",
      "....KKK..KKK....",
      "................",
      "................"
    ]
  );

  // 町田市: 町田ボーダーナイト (境騎士兜・ランス・大盾)
  const machida_rec = createPixelSvg(
    { 'S': '#cbd5e1', 'D': '#64748b', 'F': '#fde68a', 'R': '#dc2626', 'Y': '#eab308' },
    [
      ".....SSSSSS.....",
      "....SSSSSSSS....",
      "...SSSDDDDSSSS..",
      "...SSDDDDDDSS...",
      "....FFFFFFFF.S..",
      "...RRRRRRRRR.SS.",
      "..RRRRRYRRRR..SS",
      "..RR.RRYRR.R...S",
      "..R..RRRRR..R...",
      ".....SSDDSS.....",
      ".....SSDDSS.....",
      ".....SS..SS.....",
      "....SSS..SSS....",
      "................",
      "................"
    ]
  );

  // 青梅市: 青梅レトロニンジャ (忍者頭巾・クナイ・マフラー)
  const ome_rec = createPixelSvg(
    { 'N': '#0f172a', 'F': '#fde68a', 'R': '#ef4444', 'S': '#94a3b8' },
    [
      "....NNNNNNNN....",
      "...NNNNNNNNNN...",
      "..NNFFFFFFFFNN..",
      "...NFFFFFFFFN...",
      "....RRRRRRRR....",
      "....RRRRRRRR.S..",
      "...NNNNNNNNNSS..",
      "..NNNNNNNNNN.S..",
      "..NN.NNNN.NN....",
      "..N..NNNN..N....",
      ".....NNNN.......",
      ".....NN..NN.....",
      ".....NN..NN.....",
      "....NNN..NNN....",
      "................",
      "................"
    ]
  );

  // 留守代理副官 (影武者・黒子・能力80%)
  const proxy_deputy = createPixelSvg(
    { 'K': '#1e293b', 'D': '#0f172a', 'W': '#ffffff', 'G': '#64748b' },
    [
      "....KKKKKKKK....",
      "...KKDDDDDDKK...",
      "..KKDDDDDDDDKK..",
      "..KKDWWWDDWWDK..",
      "...KDDDDDDDDK...",
      "....KKKKKKKK....",
      "...DDDDDDDDDD...",
      "..DDDDGGGGDDDD..",
      "..DD.DGGGG.D.DD.",
      "..D..DDDDDD..D..",
      ".....DDDDDD.....",
      ".....KK..KK.....",
      ".....KK..KK.....",
      "....KKK..KKK....",
      "................",
      "................"
    ]
  );

  const SPRITES_MAP = {
    shinjuku_lead,
    shinjuku_guard,
    shinjuku_hacker,
    chiyoda_lead,
    chiyoda_mage,
    chiyoda_support,
    minato_lead,
    minato_sub1,
    minato_sub2,
    adachi_lead,
    adachi_sub1,
    adachi_sub2,
    musashino_lead,
    musashino_sub1,
    musashino_sub2,
    hachioji_lead,
    hachioji_sub1,
    hachioji_sub2,
    sumida_rec,
    taito_rec,
    ota_rec,
    saitama_rec,
    shibuya_rec,
    tachikawa_rec,
    machida_rec,
    ome_rec,
    proxy_deputy
  };

  return {
    getSprite(charId) {
      if (!charId) return proxy_deputy;
      if (charId.startsWith('proxy_')) return proxy_deputy;
      if (SPRITES_MAP[charId]) return SPRITES_MAP[charId];

      // Smart archetype fallback for generated 53 regional heroes
      if (charId.includes('guard') || charId.includes('sub1') || charId.includes('shield')) {
        return SPRITES_MAP.shinjuku_guard || SPRITES_MAP.adachi_sub1;
      }
      if (charId.includes('mage') || charId.includes('hacker') || charId.includes('support') || charId.includes('sub2') || charId.includes('heal')) {
        return SPRITES_MAP.chiyoda_support || SPRITES_MAP.chiyoda_mage || SPRITES_MAP.shinjuku_hacker;
      }
      if (charId.includes('ninja') || charId.includes('assassin') || charId.includes('scout')) {
        return SPRITES_MAP.ome_rec || SPRITES_MAP.hachioji_sub2;
      }
      
      // Deterministic hash fallback among colorful leaders
      const leaderPool = [
        SPRITES_MAP.musashino_lead,
        SPRITES_MAP.adachi_lead,
        SPRITES_MAP.minato_lead,
        SPRITES_MAP.sumida_rec,
        SPRITES_MAP.taito_rec,
        SPRITES_MAP.tachikawa_rec,
        SPRITES_MAP.machida_rec,
        SPRITES_MAP.ota_rec,
        SPRITES_MAP.saitama_rec
      ];
      let hash = 0;
      for (let i = 0; i < charId.length; i++) hash = (hash * 31 + charId.charCodeAt(i)) % leaderPool.length;
      return leaderPool[hash] || proxy_deputy;
    },
    SPRITES_MAP
  };
})();

if (typeof module !== 'undefined') {
  module.exports = PIXEL_SPRITES;
}

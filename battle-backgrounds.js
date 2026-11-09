// Retro Pixel Art Battle Backgrounds Generator for Tokyo Conquest
// Provides authentic 16-bit RPG backgrounds for Forest, City, Bay, Shitamachi, and Musashino Plains

const BATTLE_BACKGROUNDS = (function() {
  // 1. Forest & Mountain (深緑の樹海・山岳 - 添付画像FF2完全再現風)
  const forestSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="none" style="width:100%; height:100%; image-rendering:pixelated;">
      <defs>
        <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a1f0d"/>
          <stop offset="60%" stop-color="#143818"/>
          <stop offset="100%" stop-color="#1e4620"/>
        </linearGradient>
        <linearGradient id="forestGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2d5a27"/>
          <stop offset="40%" stop-color="#3b6e32"/>
          <stop offset="100%" stop-color="#1c3b17"/>
        </linearGradient>
      </defs>
      <!-- Deep Forest Canopy Background -->
      <rect width="400" height="150" fill="url(#forestSky)"/>
      
      <!-- Distant Tree Trunks & Foliage -->
      <g fill="#0e2a12" opacity="0.9">
        <rect x="10" y="20" width="16" height="130"/>
        <rect x="45" y="10" width="22" height="140"/>
        <rect x="90" y="25" width="18" height="125"/>
        <rect x="135" y="15" width="26" height="135"/>
        <rect x="190" y="10" width="20" height="140"/>
        <rect x="235" y="22" width="24" height="128"/>
        <rect x="285" y="12" width="28" height="138"/>
        <rect x="340" y="18" width="20" height="132"/>
        <rect x="375" y="10" width="22" height="140"/>
      </g>
      <!-- Midground Tree Foliage Highlights -->
      <g fill="#1b4d21">
        <circle cx="20" cy="30" r="30"/>
        <circle cx="60" cy="20" r="38"/>
        <circle cx="110" cy="35" r="32"/>
        <circle cx="150" cy="25" r="42"/>
        <circle cx="200" cy="18" r="36"/>
        <circle cx="250" cy="32" r="40"/>
        <circle cx="300" cy="22" r="44"/>
        <circle cx="355" cy="28" r="35"/>
        <circle cx="390" cy="20" r="38"/>
      </g>
      <!-- Sun Rays Filter through Canopy (光の筋) -->
      <polygon points="40,0 80,0 160,150 110,150" fill="#a7f3d0" opacity="0.08"/>
      <polygon points="180,0 230,0 320,150 260,150" fill="#a7f3d0" opacity="0.07"/>
      <polygon points="290,0 330,0 390,150 350,150" fill="#a7f3d0" opacity="0.06"/>

      <!-- Battle Clearing Grass Ground -->
      <rect y="140" width="400" height="100" fill="url(#forestGround)"/>
      <ellipse cx="200" cy="180" rx="190" ry="40" fill="#4d7c3b" opacity="0.5"/>
      <ellipse cx="200" cy="190" rx="140" ry="25" fill="#5b8c47" opacity="0.4"/>
      <!-- Grassy texture flecks -->
      <g fill="#244d1e" opacity="0.7">
        <rect x="30" y="155" width="4" height="2"/>
        <rect x="70" y="170" width="6" height="2"/>
        <rect x="120" y="160" width="5" height="3"/>
        <rect x="180" y="175" width="8" height="2"/>
        <rect x="250" y="165" width="6" height="2"/>
        <rect x="310" y="180" width="7" height="3"/>
        <rect x="360" y="158" width="5" height="2"/>
      </g>
    </svg>
  `;

  // 2. Cyber City & Skyscraper (都会・高層ビル街 - 新宿・渋谷・港区・千代田)
  const citySvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="none" style="width:100%; height:100%; image-rendering:pixelated;">
      <defs>
        <linearGradient id="citySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050816"/>
          <stop offset="70%" stop-color="#17153b"/>
          <stop offset="100%" stop-color="#2e1065"/>
        </linearGradient>
        <linearGradient id="cityGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="30%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <!-- Night Sky -->
      <rect width="400" height="150" fill="url(#citySky)"/>
      <!-- Distant Skyscrapers Silhouette -->
      <g fill="#0f172a">
        <rect x="20" y="40" width="35" height="110"/>
        <rect x="65" y="20" width="45" height="130"/>
        <rect x="125" y="50" width="30" height="100"/>
        <rect x="170" y="15" width="55" height="135"/>
        <rect x="240" y="35" width="40" height="115"/>
        <rect x="295" y="25" width="50" height="125"/>
        <rect x="360" y="45" width="35" height="105"/>
      </g>
      <!-- Neon Window Grid Highlights -->
      <g fill="#38bdf8" opacity="0.6">
        <rect x="75" y="30" width="3" height="4"/><rect x="85" y="30" width="3" height="4"/><rect x="95" y="30" width="3" height="4"/>
        <rect x="75" y="45" width="3" height="4"/><rect x="95" y="45" width="3" height="4"/>
        <rect x="180" y="25" width="4" height="4"/><rect x="195" y="25" width="4" height="4"/><rect x="210" y="25" width="4" height="4"/>
        <rect x="180" y="40" width="4" height="4"/><rect x="195" y="40" width="4" height="4"/>
        <rect x="305" y="35" width="4" height="4"/><rect x="320" y="35" width="4" height="4"/><rect x="335" y="35" width="4" height="4"/>
      </g>
      <g fill="#f43f5e" opacity="0.6">
        <rect x="85" y="45" width="3" height="4"/>
        <rect x="210" y="40" width="4" height="4"/>
        <rect x="250" y="50" width="4" height="4"/><rect x="265" y="50" width="4" height="4"/>
      </g>
      <!-- Tokyo Tower / Skytree Beacon in distance -->
      <line x1="140" y1="15" x2="140" y2="50" stroke="#ef4444" stroke-width="2"/>
      <circle cx="140" cy="15" r="2" fill="#ef4444"/>

      <!-- Asphalt Plaza Battle Ground with Neon Reflections -->
      <rect y="140" width="400" height="100" fill="url(#cityGround)"/>
      <ellipse cx="200" cy="185" rx="190" ry="40" fill="#312e81" opacity="0.3"/>
      <!-- Gridlines on Highway / Plaza -->
      <line x1="20" y1="160" x2="380" y2="160" stroke="#4338ca" stroke-width="1" opacity="0.3"/>
      <line x1="0" y1="190" x2="400" y2="190" stroke="#4338ca" stroke-width="1" opacity="0.4"/>
      <line x1="50" y1="140" x2="0" y2="240" stroke="#06b6d4" stroke-width="1" opacity="0.2"/>
      <line x1="350" y1="140" x2="400" y2="240" stroke="#f43f5e" stroke-width="1" opacity="0.2"/>
    </svg>
  `;

  // 3. Tokyo Bay & Port (東京湾岸・埠頭 - 品川・台場・江東・大田区)
  const baySvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="none" style="width:100%; height:100%; image-rendering:pixelated;">
      <defs>
        <linearGradient id="baySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="60%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="bayWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0369a1"/>
          <stop offset="50%" stop-color="#075985"/>
          <stop offset="100%" stop-color="#0c4a6e"/>
        </linearGradient>
        <linearGradient id="pierGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <!-- Dusk Bay Sky -->
      <rect width="400" height="110" fill="url(#baySky)"/>
      <!-- Rainbow Bridge / Gantry Cranes Silhouette -->
      <g stroke="#38bdf8" stroke-width="1.5" opacity="0.4" fill="none">
        <path d="M50,90 Q120,40 190,90 Q260,40 330,90"/>
        <line x1="120" y1="40" x2="120" y2="90"/>
        <line x1="260" y1="40" x2="260" y2="90"/>
      </g>
      <!-- Water Surface -->
      <rect y="100" width="400" height="50" fill="url(#bayWater)"/>
      <g fill="#38bdf8" opacity="0.3">
        <rect x="40" y="110" width="30" height="2"/>
        <rect x="120" y="118" width="50" height="2"/>
        <rect x="220" y="108" width="40" height="2"/>
        <rect x="310" y="122" width="60" height="2"/>
      </g>
      <!-- Concrete Pier Deck Ground -->
      <rect y="140" width="400" height="100" fill="url(#pierGround)"/>
      <!-- Pier Edge Curb & Mooring Bollards -->
      <rect y="137" width="400" height="5" fill="#facc15" stroke="#000" stroke-dasharray="15,15"/>
      <g fill="#0f172a">
        <rect x="50" y="134" width="8" height="6" rx="2"/>
        <rect x="200" y="134" width="8" height="6" rx="2"/>
        <rect x="350" y="134" width="8" height="6" rx="2"/>
      </g>
    </svg>
  `;

  // 4. Shitamachi & Retro Old Town (下町・路地・河川敷 - 足立・葛飾・墨田・台東)
  const shitamachiSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="none" style="width:100%; height:100%; image-rendering:pixelated;">
      <defs>
        <linearGradient id="shitaSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#18181b"/>
          <stop offset="60%" stop-color="#7c2d12"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
        <linearGradient id="shitaGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#78350f"/>
          <stop offset="40%" stop-color="#451a03"/>
          <stop offset="100%" stop-color="#1c1917"/>
        </linearGradient>
      </defs>
      <!-- Sunset Evening Sky -->
      <rect width="400" height="140" fill="url(#shitaSky)"/>
      
      <!-- Skytree Tower Silhouette in Sunset -->
      <polygon points="320,15 322,15 325,120 317,120" fill="#27272a"/>
      <rect x="316" y="60" width="10" height="6" fill="#3f3f46"/>
      <circle cx="321" cy="12" r="2" fill="#ef4444"/>

      <!-- Old Shitamachi Tile Roofs & Power Lines -->
      <g fill="#27272a">
        <polygon points="10,120 40,95 70,120"/>
        <polygon points="65,120 95,90 125,120"/>
        <polygon points="130,125 170,85 210,125"/>
        <polygon points="220,120 250,98 280,120"/>
      </g>
      <!-- Utility Poles & Wire Silhouette -->
      <line x1="80" y1="50" x2="80" y2="140" stroke="#18181b" stroke-width="3"/>
      <line x1="60" y1="65" x2="100" y2="65" stroke="#18181b" stroke-width="2"/>
      <path d="M0,60 Q80,80 180,65 Q280,80 400,60" stroke="#18181b" stroke-width="1" fill="none"/>
      
      <!-- Stone / Earth Bank Battle Ground -->
      <rect y="135" width="400" height="105" fill="url(#shitaGround)"/>
      <ellipse cx="200" cy="185" rx="180" ry="35" fill="#a16207" opacity="0.3"/>
    </svg>
  `;

  // 5. Musashino Plains & Suburban Highway (武蔵野平野・街道 - 武蔵野・三鷹・立川・府中)
  const musashinoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="none" style="width:100%; height:100%; image-rendering:pixelated;">
      <defs>
        <linearGradient id="plainsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="60%" stop-color="#1e3a8a"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
        <linearGradient id="plainsGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#15803d"/>
          <stop offset="50%" stop-color="#166534"/>
          <stop offset="100%" stop-color="#052e16"/>
        </linearGradient>
      </defs>
      <!-- Twilight Sky -->
      <rect width="400" height="140" fill="url(#plainsSky)"/>
      <!-- Distant Chichibu Mountain Ridge -->
      <polygon points="0,110 60,85 140,115 220,80 300,110 370,88 400,105 400,140 0,140" fill="#1e293b"/>
      <!-- Windmill / Pylon Silhouette -->
      <line x1="260" y1="70" x2="260" y2="135" stroke="#334155" stroke-width="1.5"/>
      <!-- Open Grasslands & Historic Koshu-Kaido Highway -->
      <rect y="135" width="400" height="105" fill="url(#plainsGround)"/>
      <!-- Dirt Road Diagonal -->
      <polygon points="140,135 180,135 270,240 170,240" fill="#854d0e" opacity="0.6"/>
      <ellipse cx="200" cy="180" rx="170" ry="30" fill="#22c55e" opacity="0.2"/>
    </svg>
  `;

  const BACKGROUNDS = {
    forest: forestSvg,
    city: citySvg,
    bay: baySvg,
    shitamachi: shitamachiSvg,
    musashino: musashinoSvg
  };

  // Determine appropriate background based on target municipality properties
  function getBackgroundForRegion(region) {
    if (!region) return forestSvg;
    const name = region.name || '';
    const area = region.area || '';

    // 1. Forest / Mountain (多摩山林・西多摩)
    if (['八王子市', '青梅市', '奥多摩町', '檜原村', '日の出町', 'あきる野市', '町田市'].includes(name) || area === '西多摩地域') {
      return forestSvg;
    }

    // 2. Cyber City / Central Skyscraper (都心中央)
    if (['新宿区', '渋谷区', '千代田区', '港区', '中央区', '文京区', '中野区'].includes(name)) {
      return citySvg;
    }

    // 3. Bay & Waterfront (東京湾岸・臨海)
    if (['江東区', '品川区', '大田区'].includes(name) || name.includes('島')) {
      return baySvg;
    }

    // 4. Shitamachi & Riverbanks (下町・城北・東部)
    if (['足立区', '葛飾区', '荒川区', '墨田区', '台東区', '北区', '江戸川区'].includes(name)) {
      return shitamachiSvg;
    }

    // 5. Musashino Plains (北多摩・武蔵野)
    return musashinoSvg;
  }

  return {
    BACKGROUNDS,
    getBackgroundForRegion
  };
})();

if (typeof module !== 'undefined') {
  module.exports = BATTLE_BACKGROUNDS;
}

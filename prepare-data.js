const https = require('https');
const fs = require('fs');
const path = require('path');

const GEOJSON_URL = 'https://raw.githubusercontent.com/dataofjapan/land/master/tokyo.geojson';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching Tokyo GeoJSON...');
  const geojson = await fetchJson(GEOJSON_URL);
  
  // Filter for 都区部 and 多摩 (Mainland Tokyo)
  const mainlandFeatures = geojson.features.filter(f => {
    const area = f.properties.area_ja;
    const name = f.properties.ward_ja;
    return (area === '都区部' || area === '多摩') && name !== '所属未定地';
  });

  console.log(`Mainland features: ${mainlandFeatures.length}`);

  // Find bounding box in [lng, lat]
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

  function scanCoords(coords) {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      coords.forEach(scanCoords);
    }
  }

  mainlandFeatures.forEach(f => scanCoords(f.geometry.coordinates));
  console.log(`Bounds: Lng [${minLng}, ${maxLng}], Lat [${minLat}, ${maxLat}]`);

  // Target SVG Dimensions: 1200 x 700 with padding
  const svgWidth = 1200;
  const svgHeight = 700;
  const padding = 50;

  const width = svgWidth - padding * 2;
  const height = svgHeight - padding * 2;

  // Aspect ratio preservation with Mercator-like projection
  // In Tokyo latitudes (around 35.7° N), 1 deg lat is ~111km, 1 deg lng is ~111 * cos(35.7°) = 111 * 0.812 = ~90.1km
  const latFactor = 1.0 / Math.cos(35.7 * Math.PI / 180); // ~1.23

  const lngSpan = maxLng - minLng;
  const latSpan = (maxLat - minLat) * latFactor;

  const scale = Math.min(width / lngSpan, height / latSpan);

  function project(lng, lat) {
    const x = padding + (lng - minLng) * scale;
    // Invert Y because SVG coordinates have y=0 at top
    const y = svgHeight - padding - (lat - minLat) * scale * latFactor;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  }

  function coordsToSvgPath(coords, type) {
    if (type === 'Polygon') {
      return coords.map(ring => {
        return ring.map((pt, i) => {
          const [x, y] = project(pt[0], pt[1]);
          return (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }).join(' ') + ' Z';
      }).join(' ');
    } else if (type === 'MultiPolygon') {
      return coords.map(poly => coordsToSvgPath(poly, 'Polygon')).join(' ');
    }
    return '';
  }

  // Calculate polygon centroid and area
  function calculateCentroid(coords, type) {
    let totalX = 0, totalY = 0, totalPts = 0;
    function collect(c) {
      if (typeof c[0] === 'number') {
        const [x, y] = project(c[0], c[1]);
        totalX += x;
        totalY += y;
        totalPts++;
      } else {
        c.forEach(collect);
      }
    }
    collect(coords);
    return [Math.round((totalX / totalPts) * 10) / 10, Math.round((totalY / totalPts) * 10) / 10];
  }

  // Build list of regions
  const regions = mainlandFeatures.map((f, idx) => {
    const name = f.properties.ward_ja;
    const enName = f.properties.ward_en;
    const area = f.properties.area_ja;
    const code = f.properties.code;
    const pathData = coordsToSvgPath(f.geometry.coordinates, f.geometry.type);
    const centroid = calculateCentroid(f.geometry.coordinates, f.geometry.type);

    return {
      id: `reg_${code || idx}`,
      code: code || String(130000 + idx),
      name: name,
      enName: enName,
      area: area, // '都区部' or '多摩'
      path: pathData,
      centroid: centroid,
      geometry: f.geometry,
      neighbors: []
    };
  });

  // Calculate adjacency between regions (neighbors)
  console.log('Calculating adjacency graph...');
  function getSamplePoints(geometry) {
    const pts = [];
    function extract(c) {
      if (typeof c[0] === 'number') {
        pts.push(project(c[0], c[1]));
      } else {
        c.forEach(extract);
      }
    }
    extract(geometry.coordinates);
    return pts;
  }

  const regionPoints = regions.map(r => getSamplePoints(r.geometry));

  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const ptsA = regionPoints[i];
      const ptsB = regionPoints[j];
      
      let isNeighbor = false;
      // Quick bounding box check first
      const minAx = Math.min(...ptsA.map(p => p[0])), maxAx = Math.max(...ptsA.map(p => p[0]));
      const minAy = Math.min(...ptsA.map(p => p[1])), maxAy = Math.max(...ptsA.map(p => p[1]));
      const minBx = Math.min(...ptsB.map(p => p[0])), maxBx = Math.max(...ptsB.map(p => p[0]));
      const minBy = Math.min(...ptsB.map(p => p[1])), maxBy = Math.max(...ptsB.map(p => p[1]));

      if (maxAx >= minBx - 6 && minAx <= maxBx + 6 && maxAy >= minBy - 6 && minAy <= maxBy + 6) {
        // Point distance check (distance < 7px)
        outer: for (let a = 0; a < ptsA.length; a += 2) {
          for (let b = 0; b < ptsB.length; b += 2) {
            const dx = ptsA[a][0] - ptsB[b][0];
            const dy = ptsA[a][1] - ptsB[b][1];
            if (dx * dx + dy * dy < 49) {
              isNeighbor = true;
              break outer;
            }
          }
        }
      }

      if (isNeighbor) {
        regions[i].neighbors.push(regions[j].id);
        regions[j].neighbors.push(regions[i].id);
      }
    }
  }

  // Ensure every region has at least one neighbor by finding nearest centroid if neighbors is empty
  for (let i = 0; i < regions.length; i++) {
    if (regions[i].neighbors.length === 0) {
      let closestIdx = -1, minDist = Infinity;
      for (let j = 0; j < regions.length; j++) {
        if (i !== j) {
          const dx = regions[i].centroid[0] - regions[j].centroid[0];
          const dy = regions[i].centroid[1] - regions[j].centroid[1];
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            closestIdx = j;
          }
        }
      }
      if (closestIdx >= 0) {
        regions[i].neighbors.push(regions[closestIdx].id);
        regions[closestIdx].neighbors.push(regions[i].id);
      }
    }
  }

  // Clean geometry to reduce file size
  const cleanedRegions = regions.map(r => {
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      enName: r.enName,
      area: r.area,
      path: r.path,
      centroid: r.centroid,
      neighbors: Array.from(new Set(r.neighbors))
    };
  });

  const outputData = {
    viewBox: `0 0 ${svgWidth} ${svgHeight}`,
    regions: cleanedRegions
  };

  const outputPath = path.join(__dirname, 'regions-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`Saved ${cleanedRegions.length} regions to ${outputPath}`);
}

run().catch(console.error);

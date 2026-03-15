const fetch = require('node-fetch');

// Viewboxes for major Colombian cities (minLng, minLat, maxLng, maxLat)
const CITY_VIEWBOXES = {
  bogota:       '-74.3,4.45,-73.9,4.85',
  medellin:     '-75.7,6.10,-75.4,6.40',
  cali:         '-76.6,3.30,-76.3,3.55',
  barranquilla: '-75.0,10.90,-74.7,11.10',
  cartagena:    '-75.6,10.30,-75.4,10.55',
  bucaramanga:  '-73.2,7.00,-73.0,7.20',
  pereira:      '-75.8,4.70,-75.6,4.90',
  manizales:    '-75.6,5.00,-75.4,5.15',
  cucuta:       '-72.6,7.80,-72.4,7.95',
  santamarta:   '-74.3,11.10,-74.0,11.30',
};

/**
 * Geocode a query string using OpenStreetMap Nominatim.
 * Restricted to Colombia. Optionally narrows results with a city viewbox.
 *
 * @param {string} query - Address or place name to search
 * @param {string} [city] - Optional city key to narrow results
 * @returns {Promise<Array<{name: string, lat: number, lng: number}>>}
 */
async function geocode(query, city) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const paramObj = {
    q: query.trim(),
    format: 'json',
    countrycodes: 'co',
    limit: '5',
  };

  const viewbox = city && CITY_VIEWBOXES[city.toLowerCase()];
  if (viewbox) {
    paramObj.viewbox = viewbox;
    paramObj.bounded = '1';
  }

  const params = new URLSearchParams(paramObj);
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RideCompareColombia/1.0',
      'Accept-Language': 'es',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data.map((item) => ({
    name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

module.exports = { geocode, CITY_VIEWBOXES };

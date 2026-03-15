const fetch = require('node-fetch');

/**
 * Geocode a query string using OpenStreetMap Nominatim.
 * Restricted to Colombia with a viewbox around Bogotá.
 *
 * @param {string} query - Address or place name to search
 * @returns {Promise<Array<{name: string, lat: number, lng: number}>>}
 */
async function geocode(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    countrycodes: 'co',
    viewbox: '-74.3,4.45,-73.9,4.85',
    bounded: '0',
    limit: '5',
  });

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RideCompareBogota/1.0',
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

module.exports = { geocode };

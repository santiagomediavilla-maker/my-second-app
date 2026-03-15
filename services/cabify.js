const fetch = require('node-fetch');
const { simulate } = require('./simulator');

/**
 * Get price estimates from Cabify.
 * Falls back to simulation if CABIFY_API_KEY is not configured.
 *
 * @param {{ lat: number, lng: number, name: string }} pickup
 * @param {{ lat: number, lng: number, name: string }} destination
 * @returns {Promise<Object>}
 */
async function getEstimate(pickup, destination) {
  const apiKey = process.env.CABIFY_API_KEY;

  if (!apiKey || apiKey === 'your_cabify_api_key_here') {
    const sim = simulate('cabify', pickup, destination);
    return {
      service: 'Cabify',
      slug: 'cabify',
      categories: sim.categories,
      source: 'simulated',
      surge_multiplier: sim.surge_multiplier,
      distance_km: sim.distance_km,
      error: null,
    };
  }

  const body = JSON.stringify({
    stops: [
      { loc: { lat: pickup.lat, lng: pickup.lng } },
      { loc: { lat: destination.lat, lng: destination.lng } },
    ],
  });

  const response = await fetch('https://api.cabify.com/v2/journey/estimate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      service: 'Cabify',
      slug: 'cabify',
      categories: [],
      source: 'unavailable',
      error: `Error de API Cabify: ${response.status} ${response.statusText} — ${text}`,
    };
  }

  const data = await response.json();

  // Cabify returns vehicle options under data.vehicle_options or similar
  const options = data.vehicle_options || data.vehicles || data.services || [];

  const categories = options.map((option) => {
    const priceObj = option.price || option.estimate || {};
    const minPrice = priceObj.total_minimum || priceObj.minimum || priceObj.amount || 0;
    const maxPrice = priceObj.total_maximum || priceObj.maximum || priceObj.amount || minPrice;

    return {
      name: option.vehicle_type || option.type || option.name || 'Cabify',
      price_min: Math.round(minPrice),
      price_max: Math.round(maxPrice),
      eta_minutes: option.eta ? Math.round(option.eta / 60) : null,
      currency: priceObj.currency || 'COP',
    };
  });

  return {
    service: 'Cabify',
    slug: 'cabify',
    categories,
    source: 'api',
    error: null,
  };
}

module.exports = { getEstimate };

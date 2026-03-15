const fetch = require('node-fetch');
const { simulate } = require('./simulator');

/**
 * Get price estimates from Uber.
 * Falls back to simulation if UBER_SERVER_TOKEN is not configured.
 *
 * @param {{ lat: number, lng: number, name: string }} pickup
 * @param {{ lat: number, lng: number, name: string }} destination
 * @returns {Promise<Object>}
 */
async function getEstimate(pickup, destination) {
  const token = process.env.UBER_SERVER_TOKEN;

  if (!token || token === 'your_uber_server_token_here') {
    const sim = simulate('uber', pickup, destination);
    return {
      service: 'Uber',
      slug: 'uber',
      categories: sim.categories,
      source: 'simulated',
      surge_multiplier: sim.surge_multiplier,
      distance_km: sim.distance_km,
      error: null,
    };
  }

  const params = new URLSearchParams({
    start_latitude: pickup.lat.toString(),
    start_longitude: pickup.lng.toString(),
    end_latitude: destination.lat.toString(),
    end_longitude: destination.lng.toString(),
  });

  const url = `https://api.uber.com/v1.2/estimates/price?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      service: 'Uber',
      slug: 'uber',
      categories: [],
      source: 'unavailable',
      error: `Error de API Uber: ${response.status} ${response.statusText} — ${body}`,
    };
  }

  const data = await response.json();
  const prices = data.prices || [];

  const categories = prices.map((price) => ({
    name: price.display_name,
    price_min: price.low_estimate ? Math.round(price.low_estimate) : 0,
    price_max: price.high_estimate ? Math.round(price.high_estimate) : 0,
    eta_minutes: price.duration ? Math.round(price.duration / 60) : null,
    currency: price.currency_code || 'COP',
  }));

  return {
    service: 'Uber',
    slug: 'uber',
    categories,
    source: 'api',
    error: null,
  };
}

module.exports = { getEstimate };

const { simulate } = require('./simulator');

/**
 * Didi price estimate — simulated (no public API available).
 *
 * @param {{ lat: number, lng: number, name: string }} pickup
 * @param {{ lat: number, lng: number, name: string }} destination
 * @returns {Promise<Object>}
 */
async function getEstimate(pickup, destination) {
  const sim = simulate('didi', pickup, destination);
  return {
    service: 'Didi',
    slug: 'didi',
    categories: sim.categories,
    source: 'simulated',
    surge_multiplier: sim.surge_multiplier,
    distance_km: sim.distance_km,
    error: null,
  };
}

module.exports = { getEstimate };

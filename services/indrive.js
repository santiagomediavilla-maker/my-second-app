const { simulate } = require('./simulator');

/**
 * InDrive price estimate — simulated (no public API; uses negotiated pricing).
 * Shows a suggested fare that drivers typically accept.
 *
 * @param {{ lat: number, lng: number, name: string }} pickup
 * @param {{ lat: number, lng: number, name: string }} destination
 * @returns {Promise<Object>}
 */
async function getEstimate(pickup, destination) {
  const sim = simulate('indrive', pickup, destination);
  return {
    service: 'InDrive',
    slug: 'indrive',
    categories: sim.categories,
    source: 'simulated',
    surge_multiplier: sim.surge_multiplier,
    distance_km: sim.distance_km,
    error: null,
  };
}

module.exports = { getEstimate };

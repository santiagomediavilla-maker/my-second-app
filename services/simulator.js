/**
 * Fare simulator for Colombian ride-hailing services.
 * Uses realistic fare structures (COP) and simulates surge pricing.
 */

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Realistic fare structures for Colombian cities (COP, 2025)
const FARES = {
  uber: [
    { name: 'UberX',        base: 4500,  perKm: 1500, perMin: 180 },
    { name: 'Uber Comfort', base: 6500,  perKm: 2100, perMin: 230 },
    { name: 'UberXL',       base: 8000,  perKm: 2600, perMin: 270 },
  ],
  cabify: [
    { name: 'Cabify X',     base: 5000,  perKm: 1650, perMin: 195 },
    { name: 'Cabify One',   base: 9000,  perKm: 2500, perMin: 260 },
  ],
  didi: [
    { name: 'DiDi Express', base: 3800,  perKm: 1250, perMin: 155 },
    { name: 'DiDi Plus',    base: 5500,  perKm: 1800, perMin: 210 },
  ],
  indrive: [
    { name: 'Tarifa sugerida', base: 3200, perKm: 1100, perMin: 140 },
  ],
};

/**
 * @param {string} serviceSlug
 * @param {{ lat: number, lng: number }} pickup
 * @param {{ lat: number, lng: number }} destination
 */
function simulate(serviceSlug, pickup, destination) {
  const straightKm = haversineKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
  // Road distance in Colombian cities is ~1.25–1.45x the straight-line distance
  const roadKm = straightKm * randomBetween(1.25, 1.45);
  // Average urban speed in Colombian cities: 20–30 km/h (traffic)
  const avgSpeedKmh = randomBetween(20, 30);
  const durationMin = (roadKm / avgSpeedKmh) * 60;

  // Surge: 30% chance, multiplier 1.1–1.9
  const hasSurge = Math.random() < 0.30;
  const surgeMultiplier = hasSurge
    ? Math.round(randomBetween(1.1, 1.9) * 10) / 10
    : 1.0;

  const fares = FARES[serviceSlug] || [];

  const categories = fares.map((fare) => {
    const base = fare.base + roadKm * fare.perKm + durationMin * fare.perMin;
    const price_min = Math.round(base * 0.92 * surgeMultiplier / 100) * 100;
    const price_max = Math.round(base * 1.12 * surgeMultiplier / 100) * 100;
    const eta_minutes = Math.round(randomBetween(3, 11));
    return { name: fare.name, price_min, price_max, eta_minutes, currency: 'COP' };
  });

  return {
    categories,
    surge_multiplier: surgeMultiplier,
    distance_km: Math.round(roadKm * 10) / 10,
    duration_min: Math.round(durationMin),
  };
}

module.exports = { simulate };

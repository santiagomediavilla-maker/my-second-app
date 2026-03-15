const express = require('express');
const router = express.Router();

const uber = require('../services/uber');
const cabify = require('../services/cabify');
const didi = require('../services/didi');

/**
 * POST /
 * Body: { pickup: {lat, lng, name}, destination: {lat, lng, name} }
 * Returns: array of service estimates sorted available-first
 */
router.post('/', async (req, res) => {
  const { pickup, destination } = req.body;

  // Validate that both coordinates are present
  if (
    !pickup ||
    typeof pickup.lat !== 'number' ||
    typeof pickup.lng !== 'number'
  ) {
    return res.status(400).json({
      error: 'El punto de origen debe incluir lat y lng numéricos.',
    });
  }

  if (
    !destination ||
    typeof destination.lat !== 'number' ||
    typeof destination.lng !== 'number'
  ) {
    return res.status(400).json({
      error: 'El punto de destino debe incluir lat y lng numéricos.',
    });
  }

  // Run all service calls in parallel; never let one failure block others
  const settled = await Promise.allSettled([
    uber.getEstimate(pickup, destination),
    cabify.getEstimate(pickup, destination),
    didi.getEstimate(pickup, destination),
  ]);

  const results = settled.map((result, index) => {
    const serviceNames = ['Uber', 'Cabify', 'Didi'];
    const serviceSlugs = ['uber', 'cabify', 'didi'];

    if (result.status === 'fulfilled') {
      return result.value;
    }

    // Promise was rejected — return a safe error object
    return {
      service: serviceNames[index],
      slug: serviceSlugs[index],
      categories: [],
      source: 'unavailable',
      error: result.reason
        ? result.reason.message || 'Error desconocido al consultar el servicio.'
        : 'Error desconocido al consultar el servicio.',
    };
  });

  // Guarantee at least one service always has surge (1.5x)
  const available = results.filter(
    (r) => (r.source === 'api' || r.source === 'simulated') && r.categories.length > 0
  );
  const alreadySurging = available.some((r) => r.surge_multiplier && r.surge_multiplier > 1.0);

  if (!alreadySurging && available.length > 0) {
    const target = available[Math.floor(Math.random() * available.length)];
    target.surge_multiplier = 1.5;
    target.categories = target.categories.map((cat) => ({
      ...cat,
      price_min: Math.round(cat.price_min * 1.5 / 100) * 100,
      price_max: Math.round(cat.price_max * 1.5 / 100) * 100,
    }));
  }

  // Sort: available first, then unavailable
  results.sort((a, b) => {
    const aOk = (a.source === 'api' || a.source === 'simulated') && a.categories.length > 0 ? 0 : 1;
    const bOk = (b.source === 'api' || b.source === 'simulated') && b.categories.length > 0 ? 0 : 1;
    return aOk - bOk;
  });

  res.json(results);
});

module.exports = router;

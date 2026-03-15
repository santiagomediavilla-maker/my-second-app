require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { geocode } = require('./services/geocoding');
const compareRouter = require('./routes/compare');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Geocoding endpoint
app.get('/api/geocode', async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'El parámetro q es requerido.' });
  }

  try {
    const results = await geocode(query);
    res.json(results);
  } catch (err) {
    console.error('[geocode] Error:', err.message);
    res.status(500).json({ error: 'Error al geocodificar la dirección.', detail: err.message });
  }
});

// Price comparison endpoint
app.use('/api/compare', compareRouter);

// Catch-all: serve index.html for any unknown route (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`RideCompare Bogotá corriendo en http://localhost:${PORT}`);
});

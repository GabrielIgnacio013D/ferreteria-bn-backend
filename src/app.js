const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// Orígenes permitidos del frontend (ajustar cuando se conozca la URL real)
app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

module.exports = app;

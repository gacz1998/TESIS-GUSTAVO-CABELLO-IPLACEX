const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    precio_base: { type: Number, default: 500 }, // Precio primeros 30 min
    precio_minuto: { type: Number, default: 20 }, // Precio minuto extra
    servicios: [{
        nombre: String,
        precio: Number
    }]
});

module.exports = mongoose.model('Config', ConfigSchema);
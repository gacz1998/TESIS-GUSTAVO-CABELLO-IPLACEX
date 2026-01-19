const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    nombre: String,
    email: String,
    asunto: String,
    mensaje: String,
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
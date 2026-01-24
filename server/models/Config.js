import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
    precio_base: { type: Number, default: 2000 }, // Ojo: Puse 2000 para coincidir con tu lógica anterior
    precio_minuto: { type: Number, default: 20 },
    servicios: [{
        nombre: String,
        precio: Number
    }]
});

export default mongoose.model('Config', ConfigSchema);

import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
    rut: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    telefono: { type: String },
    email: { type: String }, // Nuevo campo
    patentes: { type: [String], default: [] }, // Array para múltiples autos
    password_hash: { type: String, required: true }, // Nuevo campo (Clave)
    fecha_vencimiento: { type: Date }
});

export default mongoose.model('Client', ClientSchema);
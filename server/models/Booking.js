import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    cliente: { type: String, required: true }, // Nombre del cliente
    telefono: { type: String }, // Contacto
    patente: { type: String, required: true },
    servicio: { type: String, required: true },
    fecha: { type: String, required: true }, // Formato YYYY-MM-DD
    hora: { type: String, required: true },
    estado: { type: String, default: 'pendiente' }, // pendiente, confirmada, finalizada
    rut: { type: String } // Opcional, para clientes registrados
});

export default mongoose.model('Booking', BookingSchema);
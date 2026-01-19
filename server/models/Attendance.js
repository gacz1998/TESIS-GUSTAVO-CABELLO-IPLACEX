import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    patente: { type: String, required: true },
    entry_time: { type: Date, default: Date.now },
    exit_time: { type: Date },
    estado: { type: String, default: 'en_curso' }, 
    tipo_cliente: { type: String, default: 'normal' }, 
    
    // 🔥 ESTA SECCIÓN ES CRÍTICA PARA QUE SE GUARDE EL DINERO 🔥
    servicios: [
        {
            nombre: { type: String, required: true },
            precio: { type: Number, required: true, default: 0 }
        }
    ],
    // ---------------------------------------------------------
    
    total_pagado: { type: Number, default: 0 }
});

export default mongoose.model('Attendance', AttendanceSchema);
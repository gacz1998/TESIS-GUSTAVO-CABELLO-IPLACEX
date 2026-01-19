import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
    patente: { type: String, required: true },
    tipo: { type: String }, // 'salida_parking', etc.
    
    // --- CAMPOS PARA EL REPORTE DETALLADO ---
    total_estacionamiento: { type: Number, default: 0 },
    total_servicios: { type: Number, default: 0 },
    // ----------------------------------------

    total_pagado: { type: Number, required: true },
    fecha_pago: { type: Date, default: Date.now },
    
    // Guarda el detalle (ej: "Lavado Full")
    items: { type: Array, default: [] } 
});

export default mongoose.model('Sale', SaleSchema);
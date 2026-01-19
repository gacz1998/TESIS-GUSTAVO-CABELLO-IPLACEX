import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    categoria: { type: String }
});

export default mongoose.model('Product', ProductSchema);
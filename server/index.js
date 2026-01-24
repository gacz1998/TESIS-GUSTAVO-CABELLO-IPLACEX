import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Modelos existentes (asegúrate de tener estos archivos en tu carpeta models)
import User from './models/User.js';
import Client from './models/Client.js';
import Attendance from './models/Attendance.js';
import Booking from './models/Booking.js';
import Sale from './models/Sale.js'; 

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'js_secret_2026';

// --- DEFINICIÓN MODELO CONFIGURACIÓN (Para Tarifas) ---
// Lo definimos aquí para que funcione inmediato sin crear otro archivo
const ConfigSchema = new mongoose.Schema({
    precio_base: { type: Number, default: 2000 },
    precio_minuto: { type: Number, default: 20 }
});
const Config = mongoose.model('Config', ConfigSchema);

// --- 1. AUTENTICACIÓN ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ msg: "Usuario no encontrado" });
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ msg: "Contraseña incorrecta" });
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: user.role });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/client/login', async (req, res) => {
    const { rut, password } = req.body;
    try {
        const cliente = await Client.findOne({ rut });
        if (!cliente) return res.status(404).json({ msg: "RUT no registrado" });
        if (cliente.password_hash !== password) return res.status(401).json({ msg: "Clave incorrecta" });
        const token = jwt.sign({ id: cliente._id, role: 'cliente' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, cliente: { nombre: cliente.nombre, rut: cliente.rut, patentes: cliente.patentes || [] } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 2. RUTAS PÚBLICAS ---
app.post('/api/public/register', async (req, res) => {
    try {
        const { nombre, rut, patente, email, password } = req.body;
        const existe = await Client.findOne({ rut });
        if (existe) return res.status(400).json({ msg: "El RUT ya está registrado." });
        const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
        const nuevoCliente = new Client({
            nombre, rut, email,
            patentes: [patente.toUpperCase()],
            password_hash: password,
            fecha_vencimiento: ayer
        });
        await nuevoCliente.save();
        res.status(201).json({ msg: "Registro exitoso" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/public/booking', async (req, res) => {
    try {
        const nueva = new Booking({ ...req.body, estado: 'pendiente' });
        await nueva.save();
        res.json({ msg: "Reserva creada exitosamente" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/public/availability', async (req, res) => {
    try {
        const { fecha } = req.query;
        const reservas = await Booking.find({ fecha });
        const horasOcupadas = reservas.map(r => r.hora);
        res.json(horasOcupadas);
    } catch (e) { res.json([]); }
});

// --- 3. GESTIÓN DE RESERVAS ---
app.get('/api/bookings', async (req, res) => {
    try { const data = await Booking.find({ estado: 'pendiente' }).sort({ fecha: 1, hora: 1 }); res.json(data); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/bookings/:id', async (req, res) => {
    try { await Booking.findByIdAndUpdate(req.params.id, req.body); res.json({ msg: "Actualizado" }); } 
    catch (e) { res.status(500).json({ error: "Error" }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try { await Booking.findByIdAndDelete(req.params.id); res.json({ msg: "Eliminado" }); } 
    catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/bookings/process/:id', async (req, res) => {
    try {
        const reserva = await Booking.findById(req.params.id);
        if (!reserva) return res.status(404).json({ msg: "Reserva no encontrada" });

        const pUpper = reserva.patente.toUpperCase();
        let auto = await Attendance.findOne({ patente: pUpper, estado: 'en_curso' });

        const listaPrecios = {
            'lavado simple': 10000,
            'lavado full': 25000,
            'aspirado': 5000,
            'encerado': 15000,
            'mecánica': 30000, 'mecanica': 30000
        };
        const precioServicio = listaPrecios[reserva.servicio.toLowerCase()] || 0;

        const nuevoServicio = {
            nombre: `Reserva: ${reserva.servicio}`,
            precio: Number(precioServicio)
        };

        if (auto) {
            if (!auto.servicios) auto.servicios = [];
            auto.servicios.push(nuevoServicio);
            await auto.save();
        } else {
            const cliente = await Client.findOne({ patentes: pUpper });
            const esAbonado = cliente && (new Date() <= new Date(cliente.fecha_vencimiento));

            auto = new Attendance({
                patente: pUpper,
                tipo_cliente: esAbonado ? 'abonado' : 'normal',
                estado: 'en_curso',
                servicios: [nuevoServicio]
            });
            await auto.save();
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ msg: "Reserva procesada y auto ingresado correctamente" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// --- 4. GESTIÓN DE CLIENTES ---
app.get('/api/clients', async (req, res) => {
    try { const clientes = await Client.find().sort({ _id: -1 }); res.json(clientes); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/clients', async (req, res) => {
    try {
        const { rut, patentes, patente, nombre, telefono } = req.body;
        const clienteExistente = await Client.findOne({ rut });
        const nuevaPatente = patente ? patente.toUpperCase() : null;
        if (clienteExistente) {
            if (nuevaPatente && !clienteExistente.patentes.includes(nuevaPatente)) {
                clienteExistente.patentes.push(nuevaPatente);
                await clienteExistente.save();
                return res.json({ msg: "Vehículo agregado" });
            }
            return res.status(400).json({ msg: "Cliente ya registrado." });
        } else {
            let listaPatentes = patentes || [];
            if (nuevaPatente) listaPatentes.push(nuevaPatente);
            const nuevoCliente = new Client({
                rut, nombre, telefono,
                patentes: listaPatentes,
                password_hash: req.body.password || "123",
                fecha_vencimiento: new Date(new Date().setDate(new Date().getDate() + 30))
            });
            await nuevoCliente.save();
            return res.status(201).json({ msg: "Cliente creado" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/admin/clients/:id/patentes', async (req, res) => {
    try {
        const { patentes } = req.body;
        const cliente = await Client.findByIdAndUpdate(req.params.id, { patentes }, { new: true });
        res.json({ msg: "Lista actualizada", patentes: cliente.patentes });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/admin/clients/:id/renew', async (req, res) => {
    try {
        const cliente = await Client.findById(req.params.id);
        const base = new Date(cliente.fecha_vencimiento) < new Date() ? new Date() : new Date(cliente.fecha_vencimiento);
        base.setDate(base.getDate() + 30);
        cliente.fecha_vencimiento = base;
        await cliente.save();
        res.json({ msg: "Renovado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/clients/:id', async (req, res) => {
    try { await Client.findByIdAndDelete(req.params.id); res.json({ msg: "Eliminado" }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/clients/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ msg: "Token requerido" });
        const decoded = jwt.verify(token, JWT_SECRET);
        const cliente = await Client.findById(decoded.id);
        res.json(cliente);
    } catch (e) { res.status(401).json({ msg: "Sesión inválida" }); }
});
app.post('/api/clients/add-vehicle', async (req, res) => {
    try {
        const { patente } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const cliente = await Client.findById(decoded.id);
        if (!cliente.patentes) cliente.patentes = [];
        const pUpper = patente.toUpperCase();
        if (!cliente.patentes.includes(pUpper)) {
            cliente.patentes.push(pUpper);
            await cliente.save();
        }
        res.json({ patentes: cliente.patentes });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 5. DASHBOARD Y OPERACIONES ---
app.get('/api/dashboard/all', async (req, res) => {
    try {
        const [activos, reservas] = await Promise.all([
            Attendance.find({ estado: 'en_curso' }),
            Booking.find({ estado: 'pendiente' })
        ]);
        res.json({ activos, reservas });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/entry', async (req, res) => {
    try {
        const { patente } = req.body;
        const pUpper = patente.toUpperCase();
        const existe = await Attendance.findOne({ patente: pUpper, estado: 'en_curso' });
        if (existe) return res.status(400).json({ msg: "Vehículo ya ingresado" });

        const cliente = await Client.findOne({ patentes: pUpper });
        const esAbonado = cliente && (new Date() <= new Date(cliente.fecha_vencimiento));

        const nuevo = new Attendance({ 
            patente: pUpper, 
            tipo_cliente: esAbonado ? 'abonado' : 'normal', 
            estado: 'en_curso'
        });
        await nuevo.save();
        res.json({ msg: "Ingreso OK", ticket: nuevo });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/add-service', async (req, res) => {
    try {
        const { patente, servicio, precio } = req.body;
        const auto = await Attendance.findOne({ patente: patente.toUpperCase(), estado: 'en_curso' });
        if (!auto) return res.status(404).json({ msg: "El auto no está ingresado." });

        if (!auto.servicios) auto.servicios = [];
        auto.servicios.push({ nombre: servicio, precio: Number(precio) });

        await auto.save();
        res.json({ msg: "Servicio agregado", auto });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/exit', async (req, res) => {
    try {
        const { patente } = req.body;
        const pUpper = patente.toUpperCase();
        const auto = await Attendance.findOne({ patente: pUpper, estado: 'en_curso' });
        if (!auto) return res.status(404).json({ msg: "El auto no está en el recinto." });

        // --- LÓGICA DE COBRO DINÁMICA ---
        // 1. Obtenemos configuración de BD
        let config = await Config.findOne();
        if (!config) config = { precio_base: 2000, precio_minuto: 20 };

        const fin = new Date();
        const inicio = new Date(auto.entry_time);
        const minutos = isNaN(inicio.getTime()) ? 1 : Math.floor((fin - inicio) / 60000);

        // Usamos los precios de la BD
        const PRECIO_BASE = config.precio_base; 
        const PRECIO_MINUTO = config.precio_minuto; 

        let costoEstacionamiento = 0;
        
        if (auto.tipo_cliente !== 'abonado') {
            if (minutos <= 30) costoEstacionamiento = PRECIO_BASE;
            else costoEstacionamiento = PRECIO_BASE + ((minutos - 30) * PRECIO_MINUTO);
        }

        let costoServicios = 0;
        const serviciosSeguros = auto.servicios || [];
        if (serviciosSeguros.length > 0) {
            costoServicios = serviciosSeguros.reduce((total, s) => total + (Number(s.precio) || 0), 0);
        }

        const totalPagar = costoEstacionamiento + costoServicios;

        const nuevaVenta = new Sale({
            patente: pUpper,
            tipo: 'salida_parking',
            total_pagado: totalPagar,
            total_estacionamiento: costoEstacionamiento,
            total_servicios: costoServicios,
            fecha_pago: fin,
            items: [{ nombre: `Estacionamiento (${minutos} min)`, precio: costoEstacionamiento }, ...serviciosSeguros]
        });
        await nuevaVenta.save();
        await Attendance.deleteOne({ _id: auto._id });

        res.json({
            msg: "Salida registrada",
            ticket: {
                patente: pUpper, tiempo: minutos, parking: costoEstacionamiento,
                servicios: costoServicios, total: totalPagar, detalle: serviciosSeguros
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/attendance/current', async (req, res) => {
    const data = await Attendance.find({ estado: 'en_curso' }); res.json(data);
});
app.get('/api/sales/history', async (req, res) => {
    const data = await Sale.find().sort({ fecha_pago: -1 }); res.json(data);
});

// --- 6. CONFIGURACIÓN (RUTAS CORREGIDAS) ---
// Obtener configuración
app.get('/api/config', async (req, res) => {
    try {
        let config = await Config.findOne();
        if (!config) {
            config = { 
                precio_base: 2000, 
                precio_minuto: 20,
                // Mantenemos servicios fijos por compatibilidad visual en frontend
                servicios: [
                    { nombre: 'Lavado Simple', precio: 10000 },
                    { nombre: 'Lavado Full', precio: 25000 },
                    { nombre: 'Aspirado', precio: 5000 },
                    { nombre: 'Encerado', precio: 15000 },
                    { nombre: 'Revisión Mecánica', precio: 30000 }
                ]
            };
        } else {
            // Si viene de BD, agregamos los servicios fijos para que el frontend no falle
            config = config.toObject();
            config.servicios = [
                { nombre: 'Lavado Simple', precio: 10000 },
                { nombre: 'Lavado Full', precio: 25000 },
                { nombre: 'Aspirado', precio: 5000 },
                { nombre: 'Encerado', precio: 15000 },
                { nombre: 'Revisión Mecánica', precio: 30000 }
            ];
        }
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Actualizar configuración (SOLUCIONA EL ERROR 404)
app.put('/api/config', async (req, res) => {
    try {
        const { precio_base, precio_minuto } = req.body;
        // Crea o actualiza la configuración
        await Config.findOneAndUpdate({}, { precio_base, precio_minuto }, { upsert: true, new: true });
        res.json({ msg: "Configuración actualizada correctamente" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Servidor Maestro Activo'))
    .catch(err => console.error(err));

app.listen(5000, () => console.log('🚀 Puerto 5000 Escuchando'));

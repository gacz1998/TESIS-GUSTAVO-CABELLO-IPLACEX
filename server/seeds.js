const mongoose = require('mongoose');
const User = require('./models/User'); // Asegúrate de que la ruta a tu modelo sea correcta
require('dotenv').config();

const crearPrimerAdmin = async () => {
    try {
        // Conexión a tu nuevo clúster
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado a MongoDB para crear el admin...");

        const adminExistente = await User.findOne({ username: 'admin' });
        
        if (adminExistente) {
            console.log("El usuario admin ya existe.");
        } else {
            // Creamos el usuario. 
            // Tu modelo User.js debería tener el middleware .pre('save') para encriptar la clave
            const nuevoAdmin = new User({
                username: 'admin',
                password_hash: '123456', // Se guardará encriptada automáticamente
                role: 'admin'
            });

            await nuevoAdmin.save();
            console.log("✅ ¡Éxito! Usuario 'admin' con clave '123456' creado.");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Error al crear el admin:", error);
    }
};

crearPrimerAdmin();
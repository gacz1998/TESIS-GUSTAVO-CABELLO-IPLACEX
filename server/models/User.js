const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'operador'], default: 'admin' }
}, { collection: 'users' }); //

UserSchema.pre('save', async function() {
    if (!this.isModified('password_hash')) return;
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

UserSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('User', UserSchema);
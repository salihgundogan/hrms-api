
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'İsim alanı zorunludur.'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'E-posta alanı zorunludur.'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, 'Şifre alanı zorunludur.'],
            minlength: [6, 'Şifre en az 6 karakter olmalıdır.'],
            select: false,
        },
        role: {
            type: String,
            enum: ['employee', 'manager', 'hr_admin'],
            default: 'employee',
        },
        manager: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

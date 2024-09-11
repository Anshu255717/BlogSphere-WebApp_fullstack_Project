const mongoose = require('../dbconfig');

const AdminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        default: null, 
    },
    is_admin: {
        type: Number,
        default: 1,
    },
    Profile: {
        type: String,
        default: '' 
    },
    otp: {
        type: String,
        default: null,
    }
});

module.exports = mongoose.model('Admin', AdminSchema);

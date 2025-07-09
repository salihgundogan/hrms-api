
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Başlangıç tarihi zorunludur.'],
        },
        endDate: {
            type: Date,
            required: [true, 'Bitiş tarihi zorunludur.'],
        },
        reason: {
            type: String,
            required: [true, 'İzin sebebi belirtilmelidir.'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;
const mongoose = require('mongoose');

const leadsSchema = new mongoose.Schema({
    employeeId: {
        type: Number
    },
    email: {
        type: String
    },
    userName: {
        type: String
    },
    assignTo: {
        type: String
    },
    status: {
        type: String,
        enum: ['Allocated', 'Pending', 'Not Intrested', 'Completed'],
        default: 'Allocated'

    },
    work: {
        type: String,
        default: null
    },
    logs: {
        type: [],
        default: []
    },
    reminder: {
        type: Date,
        default: null
    },
    tasks: {
        type: [],
        default: []
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('leads', leadsSchema);
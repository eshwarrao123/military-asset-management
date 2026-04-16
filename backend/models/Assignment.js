const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        assetType: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        assignedTo: {
            type: String,
            required: true,
        },
        base: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Assigned', 'Expended'],
            default: 'Assigned',
        },
        date: {
            type: Date,
            default: Date.now,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;

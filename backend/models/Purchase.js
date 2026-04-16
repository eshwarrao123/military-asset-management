const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        assetType: {
            type: String,
            required: true,
        },
        base: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
    },
    {
        timestamps: true,
    }
);

const Purchase = mongoose.model('Purchase', purchaseSchema);
module.exports = Purchase;

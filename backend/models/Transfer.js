const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
    {
        assetType: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        fromBase: {
            type: String,
            required: true,
        },
        toBase: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        user: {
            // Optional: User who initiated the transfer
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Transfer = mongoose.model('Transfer', transferSchema);
module.exports = Transfer;

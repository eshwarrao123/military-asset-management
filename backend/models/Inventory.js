const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        baseName: {
            type: String,
            required: true,
        },
        assetType: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

inventorySchema.index({ baseName: 1, assetType: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;

const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect } = require('../middleware/auth');

// @desc    Get current inventory counts
// @route   GET /api/inventory
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'Commander') {
            query.baseName = req.user.base ? req.user.base.trim().toLowerCase() : '';
        }

        const inventory = await Inventory.find(query).sort({ baseName: 1, assetType: 1 });
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

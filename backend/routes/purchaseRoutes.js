const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Log = require('../models/Log');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
    try {
        let purchases = await Purchase.find({}).populate('user', 'name email role');

        if (req.user.role === 'Commander') {
            purchases = purchases.filter(p => p.base === req.user.base);
        } else if (req.user.role === 'Logistics') {
            // Logistics initially were set to only see their own, keeping that or returning all
            purchases = purchases.filter(p => p.user && String(p.user._id) === String(req.user._id));
        }
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        let { assetType, quantity, base } = req.body;
        base = base ? base.trim().toLowerCase() : '';
        assetType = assetType ? assetType.trim().toLowerCase() : '';

        if (!base) {
            return res.status(400).json({ message: 'Target Base is strictly required for inventory deployment.' });
        }

        const userId = req.user ? req.user._id : null;

        const purchase = new Purchase({
            user: userId,
            assetType,
            base,
            quantity,
            status: 'Approved'
        });

        const createdPurchase = await purchase.save();

        let inventory = await Inventory.findOne({ baseName: base, assetType });
        if (!inventory) {
            inventory = new Inventory({ baseName: base, assetType, quantity: 0 });
        }
        inventory.quantity += quantity;
        await inventory.save();

        await Log.create({
            actionType: 'Create Purchase',
            user: req.user._id,
            details: `Automatically purchased and stocked ${quantity}x ${assetType} directly to ${base} bounds`,
        });

        res.status(201).json(createdPurchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/status', protect, authorizeRoles('Admin', 'Commander'), async (req, res) => {
    try {
        const { status } = req.body;
        const purchase = await Purchase.findById(req.params.id);

        if (purchase) {
            if (req.user.role === 'Commander' && purchase.base !== req.user.base) {
                return res.status(403).json({ message: 'Commanders can only approve purchases directed explicitly at their own base bounds.' });
            }
            purchase.status = status || purchase.status;
            const updatedPurchase = await purchase.save();

            await Log.create({
                actionType: 'Update Purchase Status',
                user: req.user._id,
                details: `Purchase ${purchase._id} marked as ${status}`,
            });

            res.json(updatedPurchase);
        } else {
            res.status(404).json({ message: 'Purchase request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

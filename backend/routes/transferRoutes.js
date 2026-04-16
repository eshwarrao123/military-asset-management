const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const Inventory = require('../models/Inventory');
const Log = require('../models/Log');
const { protect, authorizeRoles } = require('../middleware/auth');

// @desc    Get all transfers
// @route   GET /api/transfers
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'Commander') {
            query = { $or: [{ fromBase: req.user.base }, { toBase: req.user.base }] };
        }
        // Logistics/Admin can see all by default here (or restrict Logistics too if required)

        const transfers = await Transfer.find(query)
            .populate('user', 'name role')
            .sort({ date: -1 });
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a transfer and update inventory
// @route   POST /api/transfers
// @access  Private (Logistics, Commander, Admin)
router.post('/', protect, authorizeRoles('Admin', 'Commander', 'Logistics'), async (req, res) => {
    const session = await Inventory.startSession();
    session.startTransaction();

    try {
        let { assetType, quantity, fromBase, toBase, date } = req.body;
        assetType = assetType ? assetType.trim().toLowerCase() : '';
        fromBase = fromBase ? fromBase.trim().toLowerCase() : '';
        toBase = toBase ? toBase.trim().toLowerCase() : '';

        if (req.user.role === 'Commander' && fromBase !== req.user.base) {
            return res.status(403).json({ message: 'Commanders can only transfer items OUT from their own base' });
        }

        if (!assetType || !quantity || !fromBase || !toBase) {
            return res.status(400).json({ message: 'Please provide all required fields (assetType, quantity, fromBase, toBase)' });
        }

        const validBases = ['alpha', 'bravo', 'charlie'];
        if (!validBases.includes(fromBase) || !validBases.includes(toBase)) {
            return res.status(400).json({ message: 'Transfers can only occur strictly between designated network bases.' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Transfer quantity must be greater than 0' });
        }

        // 1. Resolve Outgoing source
        const sourceInventory = await Inventory.findOne({ baseName: fromBase, assetType }).session(session);

        if (!sourceInventory || sourceInventory.quantity < quantity) {
            throw new Error(`Insufficient quantity of ${assetType} at ${fromBase}`);
        }

        // 2. Resolve Incoming destination
        let destInventory = await Inventory.findOne({ baseName: toBase, assetType }).session(session);

        if (!destInventory) {
            // Create inventory entry if it doesn't exist
            destInventory = new Inventory({ baseName: toBase, assetType, quantity: 0 });
        }

        // 3. Update Quantities
        sourceInventory.quantity -= quantity;
        destInventory.quantity += quantity;

        await sourceInventory.save({ session });
        await destInventory.save({ session });

        // 4. Create Transfer record
        const transfer = new Transfer({
            assetType,
            quantity,
            fromBase,
            toBase,
            user: req.user ? req.user._id : null,
            date: date || Date.now(),
        });

        const createdTransfer = await transfer.save({ session });

        await Log.create([{
            actionType: 'Transfer Assets',
            user: req.user ? req.user._id : null,
            details: `Transferred ${quantity}x ${assetType} from ${fromBase} to ${toBase}`,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(createdTransfer);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;

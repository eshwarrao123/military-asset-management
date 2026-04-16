const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Inventory = require('../models/Inventory');
const Log = require('../models/Log');
const { protect, authorizeRoles } = require('../middleware/auth');

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private (Admin, Commander)
router.get('/', protect, authorizeRoles('Admin', 'Commander'), async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'Commander') {
            query.base = req.user.base;
        }
        const assignments = await Assignment.find(query)
            .populate('assignedBy', 'name role')
            .sort({ date: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign asset to personnel
// @route   POST /api/assignments
// @access  Private (Commander, Admin)
router.post('/', protect, authorizeRoles('Admin', 'Commander'), async (req, res) => {
    const session = await Inventory.startSession();
    session.startTransaction();

    try {
        let { assetType, quantity, assignedTo, base, date } = req.body;
        assetType = assetType ? assetType.trim().toLowerCase() : '';
        assignedTo = assignedTo ? assignedTo.trim() : '';
        base = base ? base.trim().toLowerCase() : '';

        if (req.user.role === 'Commander' && base !== req.user.base) {
            return res.status(403).json({ message: 'Commanders can only assign items in their own base' });
        }

        if (!assetType || !quantity || !assignedTo || !base) {
            return res.status(400).json({ message: 'Please provide required fields (assetType, quantity, assignedTo, base)' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        // Deduct from base inventory
        const sourceInventory = await Inventory.findOne({ baseName: base, assetType }).session(session);

        if (!sourceInventory || sourceInventory.quantity < quantity) {
            throw new Error(`Insufficient quantity of ${assetType} at ${base}`);
        }

        sourceInventory.quantity -= quantity;
        await sourceInventory.save({ session });

        // Create Assignment record
        const assignment = new Assignment({
            assetType,
            quantity,
            assignedTo,
            base,
            status: 'Assigned',
            assignedBy: req.user ? req.user._id : null,
            date: date || Date.now(),
        });

        const createdAssignment = await assignment.save({ session });

        await Log.create([{
            actionType: 'Assign Assets',
            user: req.user ? req.user._id : null,
            details: `Assigned ${quantity}x ${assetType} to ${assignedTo} at ${base}`,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(createdAssignment);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: error.message });
    }
});

// @desc    Mark assignment as Expended
// @route   PUT /api/assignments/:id/expend
// @access  Private (Admin, Commander)
router.put('/:id/expend', protect, authorizeRoles('Admin', 'Commander'), async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (req.user.role === 'Commander' && assignment.base !== req.user.base) {
            return res.status(403).json({ message: 'Not authorized to modify assignments in other bases' });
        }

        if (assignment.status === 'Expended') {
            return res.status(400).json({ message: 'Assignment is already marked as Expended' });
        }

        assignment.status = 'Expended';
        const updatedAssignment = await assignment.save();

        await Log.create({
            actionType: 'Expend Assets',
            user: req.user ? req.user._id : null,
            details: `Assignment ${assignment._id} (Assigned to ${assignment.assignedTo}) officially marked as Expended`,
        });

        res.json(updatedAssignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

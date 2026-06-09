const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const { protect } = require('../middleware/auth');

// @desc    Get dashboard metrics (Aggregations)
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(0); 
        const end = endDate ? new Date(endDate) : new Date();

        let baseFilter = req.query.base ? req.query.base.trim().toLowerCase() : null;
        let equipmentType = req.query.equipmentType ? req.query.equipmentType.trim().toLowerCase() : null;

        if (req.user.role === 'Commander') {
            baseFilter = req.user.base ? req.user.base.trim().toLowerCase() : null;
        }

        const purchaseMatch = { status: 'Approved' };
        if (equipmentType) purchaseMatch.assetType = equipmentType;

        const transferInMatch = {};
        const transferOutMatch = {};
        const assignmentMatch = {};

        if (baseFilter) {
            transferInMatch.toBase = baseFilter;
            transferOutMatch.fromBase = baseFilter;
            assignmentMatch.base = baseFilter;
        }

        if (equipmentType) {
            transferInMatch.assetType = equipmentType;
            transferOutMatch.assetType = equipmentType;
            assignmentMatch.assetType = equipmentType;
        }

        const purchasePipeline = [
            { $match: purchaseMatch },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDoc'
                }
            },
            { $unwind: '$userDoc' }
        ];

        if (baseFilter) {
            purchasePipeline.push({ $match: { 'userDoc.base': baseFilter } });
        }

        purchasePipeline.push({
            $group: {
                _id: null,
                past: { $sum: { $cond: [{ $lt: ['$createdAt', start] }, '$quantity', 0] } },
                inRange: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }] },
                            '$quantity',
                            0
                        ]
                    }
                }
            }
        });

        const transfersInPipeline = [
            { $match: transferInMatch },
            {
                $group: {
                    _id: null,
                    past: { $sum: { $cond: [{ $lt: ['$date', start] }, '$quantity', 0] } },
                    inRange: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gte: ['$date', start] }, { $lte: ['$date', end] }] },
                                '$quantity',
                                0
                            ]
                        }
                    }
                }
            }
        ];

        const transfersOutPipeline = [
            { $match: transferOutMatch },
            {
                $group: {
                    _id: null,
                    past: { $sum: { $cond: [{ $lt: ['$date', start] }, '$quantity', 0] } },
                    inRange: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gte: ['$date', start] }, { $lte: ['$date', end] }] },
                                '$quantity',
                                0
                            ]
                        }
                    }
                }
            }
        ];

        const assignmentsPipeline = [
            { $match: assignmentMatch },
            {
                $group: {
                    _id: null,
                    pastAssigned: { $sum: { $cond: [{ $lt: ['$date', start] }, '$quantity', 0] } },
                    inRangeTotalAssignments: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gte: ['$date', start] }, { $lte: ['$date', end] }] },
                                '$quantity',
                                0
                            ]
                        }
                    },
                    inRangeAssigned: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ['$date', start] },
                                        { $lte: ['$date', end] },
                                        { $eq: ['$status', 'Assigned'] }
                                    ]
                                },
                                '$quantity',
                                0
                            ]
                        }
                    },
                    inRangeExpended: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ['$updatedAt', start] },
                                        { $lte: ['$updatedAt', end] },
                                        { $eq: ['$status', 'Expended'] }
                                    ]
                                },
                                '$quantity',
                                0
                            ]
                        }
                    }
                }
            }
        ];

        const [purchases, transfersIn, transfersOut, assignments] = await Promise.all([
            Purchase.aggregate(purchasePipeline),
            Transfer.aggregate(transfersInPipeline),
            Transfer.aggregate(transfersOutPipeline),
            Assignment.aggregate(assignmentsPipeline)
        ]);

        const extractData = (arr) => arr[0] || { past: 0, inRange: 0, pastAssigned: 0, inRangeTotalAssignments: 0, inRangeAssigned: 0, inRangeExpended: 0 };

        const purData = extractData(purchases);
        const tinData = extractData(transfersIn);
        const toutData = extractData(transfersOut);
        const assignData = extractData(assignments);

        // Compute Opening Balance
        // Opening = (Past Purchases + Past Transfers In) - (Past Transfers Out + Past Assignments)
        const openingBalance = (purData.past + tinData.past) - (toutData.past + assignData.pastAssigned);

        // Movements within range
        const netMovement = purData.inRange + tinData.inRange - toutData.inRange;
        const assigned = assignData.inRangeAssigned;
        const expended = assignData.inRangeExpended;

        // Closing Balance
        const closingBalance = openingBalance + netMovement - (assignData.inRangeTotalAssignments || 0);

        res.json({
            filters: { startDate: start, endDate: end, base: baseFilter, equipmentType },
            metrics: {
                openingBalance,
                closingBalance,
                netMovement,
                assigned,
                expended,
                breakdown: {
                    purchasesInRange: purData.inRange,
                    transfersInInRange: tinData.inRange,
                    transfersOutInRange: toutData.inRange
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

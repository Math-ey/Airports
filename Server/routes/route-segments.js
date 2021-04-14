const express = require('express');
const router = express.Router();
const distanceService = require('../services/distanceService');

router.get('/', async (req, res) => {

    const { sourceId, destinationId } = req.query;
    const segmentLength = 100000;

    try {
        const data = await distanceService.getDistanceWithSegments(sourceId, destinationId, segmentLength);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

module.exports = router;
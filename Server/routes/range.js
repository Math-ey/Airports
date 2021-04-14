const express = require('express');
const router = express.Router();
const distanceService = require('../services/distanceService');

router.get('/', async (req, res) => {

    const { sourceId, destinationId, maxDistance } = req.query;

    try {
        const data = await distanceService.getDistanceWithInterpolations(sourceId, destinationId, maxDistance);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

module.exports = router;
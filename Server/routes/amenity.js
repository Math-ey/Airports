const express = require('express');
const router = express.Router();
const amenityService = require('../services/amenityService');
const maxDistance = 5000;
const limit = 20;

router.get('/sustenance/near-to', async (req, res) => {
    const { lon, lat } = req.query;
    
    try {
        const data = await amenityService.getNearestSustenanceServices(lon, lat, maxDistance, limit);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
});

module.exports = router;
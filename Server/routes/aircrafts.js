const express = require('express');
const router = express.Router();
const aircraftService = require('../services/aircraftService');


router.get('/names', async (req, res) => {
    try {
        const data = await aircraftService.getAircraftNames();
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        const data = await aircraftService.getAircraft(id);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
})


module.exports = router;
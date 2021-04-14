const express = require('express');
const router = express.Router();
const airportService = require('../services/airportService');

router.get('/', async (req, res) => {
    try {
        const data = await airportService.getAirports();
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
})


router.get('/names', async (req, res) => {
    const { searchVal, startingChars } = req.query;
    try {
        const data = await airportService.getAirportNames(searchVal, startingChars);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
})

router.get('/areal-percentiles', async (req, res) => {
    try {
        const data = await airportService.getArealPercentiles();
        res.json(data);
    }
    catch (err) {
        console.log("error", err);
        res.status(400).json(err);
    }
});


router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const data = await airportService.getAirport(id);
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err);
    }
})

module.exports = router;
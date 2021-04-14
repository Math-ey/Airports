const express = require('express');
const router = express.Router();
const request = require('request');
require('dotenv/config');

const APPID = process.env.OWM_APPID;

router.get('/', (req, res) => {
    const params = { ...req.query, APPID, units: 'Metric' }
    request({ url: 'http://api.openweathermap.org/data/2.5/weather', qs: params }, (err, response, body) => {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(JSON.parse(body))
    })
})

module.exports = router;
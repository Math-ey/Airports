const express = require('express');
const router = express.Router();
const request = require('request');
require('dotenv/config');

router.get('/', (req, res) => {
    console.log(process.env.OWM_APPID);
    const params = {...req.query, APPID: process.env.OWM_APPID, units: 'Metric'}
    console.log(params);
    request({ url: 'http://api.openweathermap.org/data/2.5/weather', qs: params }, (err, response, body) => {
        if (err) { 
            console.log(err); 
            return res.status(400).json(err);
        }
        res.json(JSON.parse(body))
    })
})

module.exports = router;
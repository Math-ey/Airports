const express = require('express');
const router = express.Router();
const db = require('../services/db');

router.get('/names', (req, res) => {
    const query = "SELECT id, name FROM airplanes"

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows);
    });
})

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const query = `SELECT * FROM airplanes WHERE id=${id}`;

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows[0]);
    });
})


module.exports = router;
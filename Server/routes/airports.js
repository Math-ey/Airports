const express = require('express');
const router = express.Router();
const db = require('../db/db');
const toGeoJSON = require('../db/postgistogeojson');

router.get('/', (req, res) => {
    const query = `
        SELECT sub.osm_id AS id, sub.name AS title,ST_AsGeoJSON(ST_Transform(sub.way, 4326)) AS geojson, ST_Area(ST_Transform(way,4326)::geography) as area 
        FROM (SELECT * FROM planet_osm_polygon AS p WHERE p.aeroway LIKE 'aerodrome' AND (LOWER(p.name) LIKE '%airport%' OR LOWER(p.name) LIKE '%airfield%')) AS sub;`;

    db.query(query, (err, result) => {
        var geoJSON = toGeoJSON(result.rows); 
        res.json(geoJSON);
    });
})

router.get('/names', (req, res) => {
    let searchVal = req.query.searchVal;
    if(!searchVal){
        searchVal = 'airfield';
    }
    else {
        searchVal = decodeURI(searchVal);
    }

    const query = `
        SELECT sub.osm_id AS id, sub.name AS title
        FROM (SELECT * FROM planet_osm_polygon AS p WHERE p.aeroway LIKE 'aerodrome' AND (LOWER(p.name) LIKE '%airport%' OR LOWER(p.name) LIKE '%${searchVal}%')) AS sub;`;

    db.query(query, (err, result) => {
        res.json(result.rows);
    });
})

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT sub.osm_id AS id, sub.name AS title,ST_AsGeoJSON(ST_Transform(sub.way, 4326)) AS geojson, ST_Area(ST_Transform(way,4326)::geography) as area 
        FROM (SELECT * FROM planet_osm_polygon AS p WHERE p.osm_id = ${id}) AS sub;`;

    db.query(query, (err, result) => {
        var geoJSON = toGeoJSON(result.rows); 
        res.json(geoJSON);
    });
})

module.exports = router;
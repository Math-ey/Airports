const express = require('express');
const router = express.Router();
const db = require('../db/db');

const featureCollectionSelect = `
    SELECT
        jsonb_build_object(
            'type', 'FeatureCollection', 
            'features', jsonb_agg(features.jsonb_build_object)
        ) AS geojson
    FROM 
        (SELECT 
            jsonb_build_object(
                'type', 'Feature',
                'properties', (SELECT row_to_json(_) FROM (SELECT id, title, ST_Area(ST_Transform(way,4326)::geography) AS area) as _),
                'geometry', ST_AsGeoJSON(ST_Transform(airport_data.way, 4326))::jsonb
            )
        FROM airport_data) AS features`;

router.get('/', (req, res) => {
    const query = `
    WITH airport_data AS (
        SELECT osm_id AS id, name AS title, way 
        FROM planet_osm_polygon AS p 
        WHERE p.aeroway LIKE 'aerodrome' AND (LOWER(p.name) LIKE '%airport%' OR LOWER(p.name) LIKE '%airfield%')
    )
    ${featureCollectionSelect}
    `;

    db.query(query, (err, result) => {
        if(err){
            return res.status(400).json(err);
        }
        res.json(result.rows);
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
        SELECT osm_id AS id, name AS title 
        FROM planet_osm_polygon AS p 
        WHERE p.aeroway LIKE 'aerodrome' AND (LOWER(p.name) LIKE '%airport%' OR LOWER(p.name) LIKE '%${searchVal}%');`;

    db.query(query, (err, result) => {
        if(err){
            return res.status(400).json(err);
        }
        res.json(result.rows);
    });
})

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        WITH airport_data AS (
            SELECT osm_id AS id, name AS title, way
	        FROM planet_osm_polygon AS p 
	        WHERE p.osm_id = ${id}
        )
        ${featureCollectionSelect}
        `;

    db.query(query, (err, result) => {
        if(err){
            return res.status(400).json(err);
        }
        res.json(result.rows);
    });
})

module.exports = router;
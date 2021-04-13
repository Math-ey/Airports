const express = require('express');
const router = express.Router();
const db = require('../services/db');

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

const defaultAirports =  `(LOWER(p.name) LIKE LOWER('%airfield%') OR LOWER(p.name) LIKE LOWER('%airport%'))`;

router.get('/', (req, res) => {
    const query = `
    WITH airport_data AS (
        SELECT osm_id AS id, name AS title, way 
        FROM planet_osm_polygon AS p 
        WHERE p.aeroway LIKE 'aerodrome' AND ${defaultAirports}
    )
    ${featureCollectionSelect}
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows[0]);
    });
})


router.get('/names', (req, res) => {
    let {searchVal, startingChars } = req.query;

    let query = `
        SELECT osm_id AS id, name AS title 
        FROM planet_osm_polygon AS p 
        WHERE p.aeroway LIKE 'aerodrome' AND ${searchVal ? `(LOWER(p.name) LIKE LOWER('%${decodeURI(searchVal)}%'))` : defaultAirports}`;

    if (startingChars) {
        query += ` AND ( ${[...startingChars.toLowerCase()].map(c => `LOWER(LEFT(name, 1)) = '${c}'`).join(' OR ')})`;
    }

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows);
    });
})

router.get('/areal-percentiles', (req, res) => {
    const query = `
    WITH area_data AS (
        SELECT ST_Area(ST_Transform(way,4326)::geography) AS area 
        FROM planet_osm_polygon AS p
        WHERE p.aeroway='aerodrome' AND ${defaultAirports}
        ORDER BY p.area ASC)
    SELECT UNNEST (percentiles.PERCENTILE_CONT) AS percentile
    FROM (
        SELECT PERCENTILE_CONT((SELECT ARRAY_AGG(s) FROM GENERATE_SERIES(0.15, 1, 0.15) AS s)) WITHIN GROUP(ORDER BY area ASC)
        FROM area_data
        ) AS percentiles`;

    db.query(query, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows.map(x => x.percentile));
    });
});


router.get('/:id', (req, res) => {
    const id = req.params.id;
    console.log(id);
    const query = `
        WITH airport_data AS (
            SELECT osm_id AS id, name AS title, way
	        FROM planet_osm_polygon AS p 
	        WHERE p.osm_id = ${id}
        )
        ${featureCollectionSelect}
        `;

    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows[0]);
    });
})

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../db/db');

const maxDistance = 5000;
const limit = 20;

router.get('/sustenance/near-to', (req, res) => {
    const { lon, lat } = req.query;
    const query = `
        WITH data AS (
            SELECT * FROM (
				SELECT ST_DistanceSphere(ST_GeomFromText('POINT(${lon} ${lat})', 4326), ST_Transform(way, 4326)) AS dist, 
                	name, amenity, ST_AsGeoJSON(ST_Transform(way, 4326)) AS geojson 
            	FROM planet_osm_point 
			) AS sub
            WHERE amenity IN ('restaurant', 'cafe', 'bar', 'fast_food', 'food_court', 'pub', 'ice_cream')
                AND name IS NOT null
                AND dist < ${maxDistance}
            ORDER BY dist 
            LIMIT ${limit}
        )
        SELECT
            jsonb_build_object(
                'type', 'FeatureCollection', 
                'features', jsonb_agg(features.jsonb_build_object)
            ) AS geojson
        FROM 
            (SELECT 
                jsonb_build_object(
                    'type', 'Feature',
                    'properties', (SELECT row_to_json(_) FROM (SELECT name, amenity, dist) as _),
                    'geometry', geojson::jsonb
                )
            FROM data) AS features;
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
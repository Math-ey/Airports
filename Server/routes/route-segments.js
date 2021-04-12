const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/', (req, res) => {

    const { sourceId, destinationId } = req.query;
    const segLen = 100000;

    let query = `
        WITH source_data AS (
            SELECT name, way, osm_id AS id FROM planet_osm_polygon WHERE osm_id = ${sourceId}  
        ),
        dest_data AS (
            SELECT name, way, osm_id AS id FROM planet_osm_polygon WHERE osm_id = ${destinationId}
        ),
        segment_data AS (
            SELECT ST_AsGeoJSON(
                ST_Segmentize(
                    ST_MakeLine(
                        ST_Transform(ST_Centroid(source_data.way), 4326), 
                        ST_Transform(ST_Centroid(dest_data.way), 4326)
                    )::geography, 
                    ${segLen}
                )
            ) AS segments
            FROM source_data, dest_data
        )

        SELECT
            jsonb_build_object(
                        'type', 'FeatureCollection', 
                        'features', jsonb_agg(features.source_obj)
                    ) AS source_geojson,
            jsonb_build_object(
                'type', 'FeatureCollection', 
                'features', jsonb_agg(features.dest_obj)
            ) AS dest_geojson,
            jsonb_build_object(
                'type', 'FeatureCollection', 
                'features', jsonb_agg(features.segment_obj)
            ) AS segment_geojson
        FROM 
            (SELECT 
                jsonb_build_object(
                    'type', 'Feature',
                    'properties', (SELECT row_to_json(_) FROM (SELECT source_data.id, source_data.name) as _),
                    'geometry', ST_AsGeoJSON(ST_Transform(source_data.way, 4326))::jsonb
                ) AS source_obj, 
                jsonb_build_object(
                    'type', 'Feature',
                    'properties', (SELECT row_to_json(_) FROM (SELECT dest_data.id, dest_data.name) as _),
                    'geometry', ST_AsGeoJSON(ST_Transform(dest_data.way, 4326))::jsonb
                ) AS dest_obj,
                jsonb_build_object(
                    'type', 'Feature',
                    'geometry', segment_data.segments::jsonb
                ) AS segment_obj
            FROM source_data, dest_data, segment_data) AS features
    `;

    db.query(query, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        }
        res.json(result.rows[0]);
    });
});

module.exports = router;
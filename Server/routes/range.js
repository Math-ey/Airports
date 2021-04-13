const express = require('express');
const router = express.Router();
const db = require('../services/db');

router.get('/', (req, res) => {

    const { sourceId, destinationId, maxDistance } = req.query;

    let query = `
        WITH source_data AS (
            SELECT osm_id AS id, name, way FROM planet_osm_polygon WHERE osm_id = ${sourceId} 
        ),
        dest_data AS (
            SELECT osm_id AS id, name, way as way FROM planet_osm_polygon WHERE osm_id = ${destinationId}
        ),
        range_data AS (
            SELECT 
                sub.distanceInKm,
                CASE WHEN sub.distanceInKm > ${maxDistance} THEN 
                    ST_AsGeoJSON(
                        ST_LineInterpolatePoints(
                            ST_MakeLine(
                                ST_Transform(ST_Centroid(source_data.way), 4326), 
                                ST_Transform(ST_Centroid(dest_data.way), 4326)
                            ), 
                            ${maxDistance} / sub.distanceInKm
                        )
                    )
                ELSE null
                END AS interpolation
            FROM 
                source_data, dest_data, (
                    SELECT ST_DistanceSphere(ST_Transform(ST_Centroid(source_data.way), 4326), ST_Transform(ST_Centroid(dest_data.way), 4326)) / 1000 AS distanceInKm
                    FROM source_data, dest_data) AS sub
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
                        'features', jsonb_agg(features.interpolation_obj)
                    ) AS interpolation_geojson,
            range_data.distanceInKm AS dist

        FROM 
            range_data, source_data, dest_data, (
                SELECT 
                    jsonb_build_object(
                        'type', 'Feature',
                        'properties', (SELECT row_to_json(_) FROM (SELECT source_data.id, source_data.name) AS _),
                        'geometry', ST_AsGeoJSON(ST_Transform(source_data.way, 4326))::jsonb
                    ) AS source_obj, 
                    jsonb_build_object(
                        'type', 'Feature',
                        'properties', (SELECT row_to_json(_) FROM (SELECT dest_data.id, dest_data.name) AS _),
                        'geometry', ST_AsGeoJSON(ST_Transform(dest_data.way, 4326))::jsonb
                    ) AS dest_obj,
                    jsonb_build_object(
                        'type', 'Feature',
                        'geometry', range_data.interpolation::jsonb
                    ) AS interpolation_obj
                FROM source_data, dest_data, range_data) AS features

        GROUP BY range_data.distanceInKm
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
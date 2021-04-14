const db = require('./db');

async function getNearestSustenanceServices(lon, lat, maxDistance, limit) {
    return (await db.query(`
    WITH data AS (
        SELECT * FROM (
            SELECT ST_DistanceSphere(ST_MakePoint($1, $2), ST_Transform(way, 4326)) AS dist, 
                name, amenity, ST_AsGeoJSON(ST_Transform(way, 4326)) AS geojson 
            FROM planet_osm_point 
        ) AS sub
        WHERE amenity IN ('restaurant', 'cafe', 'bar', 'fast_food', 'food_court', 'pub', 'ice_cream')
            AND name IS NOT null
            AND dist < $3
        ORDER BY dist 
        LIMIT $4
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
    `, [lon, lat, maxDistance, limit]))[0];
}

module.exports = {
    getNearestSustenanceServices
}
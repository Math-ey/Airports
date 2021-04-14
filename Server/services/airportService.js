const db = require('./db');

async function getAirports() {
    return (await db.query(`
    WITH airport_data AS (
        SELECT osm_id AS id, name AS title, way 
        FROM planet_osm_polygon AS p 
        WHERE p.aeroway LIKE 'aerodrome' AND (LOWER(p.name) LIKE LOWER('%airfield%') OR LOWER(p.name) LIKE LOWER('%airport%'))
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
                'properties', (SELECT row_to_json(_) FROM (SELECT id, title, ST_Area(ST_Transform(way,4326)::geography) AS area) as _),
                'geometry', ST_AsGeoJSON(ST_Transform(airport_data.way, 4326))::jsonb
            )
        FROM airport_data) AS features
    `))[0];
}


async function getAirport(id) {
    return (await db.query(`
    WITH airport_data AS (
        SELECT osm_id AS id, name AS title, way
        FROM planet_osm_polygon AS p 
        WHERE p.osm_id = $1
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
                'properties', (SELECT row_to_json(_) FROM (SELECT id, title, ST_Area(ST_Transform(way,4326)::geography) AS area) as _),
                'geometry', ST_AsGeoJSON(ST_Transform(airport_data.way, 4326))::jsonb
            )
        FROM airport_data) AS features
    `, [id]))[0];
}

async function getArealPercentiles() {
    return (await db.query(`
    WITH area_data AS (
        SELECT ST_Area(ST_Transform(way,4326)::geography) AS area 
        FROM planet_osm_polygon AS p
        WHERE p.aeroway='aerodrome' AND (LOWER(p.name) LIKE LOWER('%airfield%') OR LOWER(p.name) LIKE LOWER('%airport%'))
        ORDER BY p.area ASC)
    SELECT UNNEST (percentiles.PERCENTILE_CONT) AS percentile
    FROM (
        SELECT PERCENTILE_CONT((SELECT ARRAY_AGG(s) FROM GENERATE_SERIES(0.15, 1, 0.15) AS s)) WITHIN GROUP(ORDER BY area ASC)
        FROM area_data
        ) AS percentiles
    `)).map(x => x.percentile);
}

async function getAirportNames(searchVal, startingChars) {
    return (await db.query(`
    SELECT osm_id AS id, name AS title 
        FROM planet_osm_polygon AS p 
        WHERE p.aeroway LIKE 'aerodrome' AND ${searchVal ? `(LOWER(p.name) LIKE LOWER('%${decodeURI(searchVal)}%'))` : `(LOWER(p.name) LIKE LOWER('%airfield%') OR LOWER(p.name) LIKE LOWER('%airport%'))`}
        ${startingChars ? ` AND ( ${[...startingChars.toLowerCase()].map(c => `LOWER(LEFT(name, 1)) = '${c}'`).join(' OR ')})` : ''}
    `));
}

module.exports = {
    getAirports,
    getAirport,
    getArealPercentiles,
    getAirportNames
}
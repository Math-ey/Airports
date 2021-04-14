const db = require('./db');

async function getAircraftNames(){
    return (await db.query(`SELECT id, name FROM airplanes`));
}

async function getAircraft(id){
    return (await db.query(`SELECT * FROM airplanes WHERE id=$1`, [id]))[0];
}

module.exports = {
    getAircraft, 
    getAircraftNames
}
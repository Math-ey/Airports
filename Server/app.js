const express = require('express');
const PORT = process.env.PORT || 3000;
const path = require('path');

const app = express();
app.use(express.json());

const apiRouter = require('./routes/api-router');
const airportsRouter = require('./routes/airports');
const aircraftsRouter = require('./routes/aircrafts');
const amenityRouter = require('./routes/amenity');
const rangeRouter = require('./routes/range');
const routeSegmentsRouter = require('./routes/route-segments');


// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

app.use(express.static(path.join(__dirname, 'public')));

app.use('/map', apiRouter);
app.use('/api/airports', airportsRouter);
app.use('/api/aircrafts', aircraftsRouter);
app.use('/api/amenity', amenityRouter);
app.use('/api/range', rangeRouter);
app.use('/api/route-segments', routeSegmentsRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
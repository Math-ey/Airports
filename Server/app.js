const express = require('express');
const PORT = process.env.PORT || 3000;
const path = require('path');
//const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const airportsRouter = require('./routes/airports');
const aircraftsRouter = require('./routes/aircrafts');
const amenityRouter = require('./routes/amenity');
const rangeRouter = require('./routes/range');
const routeSegmentsRouter = require('./routes/route-segments');
const weatherRouter = require('./routes/weather');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/airports', airportsRouter);
app.use('/api/aircrafts', aircraftsRouter);
app.use('/api/amenity', amenityRouter);
app.use('/api/range', rangeRouter);
app.use('/api/route-segments', routeSegmentsRouter);
app.use('/api/weather', weatherRouter);

app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
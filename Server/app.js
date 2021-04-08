const express = require('express');
const PORT = process.env.PORT || 3000;
const path = require('path');

const app = express();

const apiRouter = require('./routes/api-router');
const airportsRouter = require('./routes/airports');


// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

app.use(express.static(path.join(__dirname, 'public')));

app.use('/map', apiRouter);
app.use('/api/airports', airportsRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
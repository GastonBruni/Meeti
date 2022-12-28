const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const router = require('./routes');

// importar valores de variables.env
require('dotenv').config({path: 'variables.env'});

// crear una app de express
const app = express();

app.use(expressLayouts);

// Habilitar EJS como template engine
app.set('view engine', 'ejs');

// Ubicacion vistas
app.set('views', path.join(__dirname, './views'));

// Archivos estaticos
app.use(express.static('public'));

// Middleware (usuario logueado, flash messages, fecha actual)
app.use((req, res, next) => {
    const fecha = new Date();
    res.locals.year = fecha.getFullYear();
    next();
});

// Routing
app.use('/', router());

// Agrega el puerto
app.listen(process.env.PORT, () => {
    console.log('El servidor esta funcionando');
})
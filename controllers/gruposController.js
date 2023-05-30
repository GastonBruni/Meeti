const Categorias = require('../models/Categorias');
const Grupos = require('../models/Grupos');
const { sanitizeBody } = require('express-validator');


exports.formNuevoGrupo = async (req, res) => {
    const categorias = await Categorias.findAll();
    res.render('nuevo-grupo',{
        nombrePagina: 'Crea un nuevo grupo',
        categorias
    })
}

// Almacenar grupos en la DB
exports.crearGrupo = async (req, res) => {
    // Sanitizamos campos
    sanitizeBody('nombre');
    sanitizeBody('url');

    const grupo = req.body;

    // Almacena el usuario autenticado como el creador del grupo
    grupo.usuarioId = req.user.id;


    try {
        // Almacenamos datos
        await Grupos.create(grupo);
        req.flash('exito', 'Se ha creado el grupo correctamente');
        res.redirect('/administracion');
    } catch (error) {
        // extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);
        req.flash('error',erroresSequelize);
        res.redirect('/nuevo-grupo');
    }
}
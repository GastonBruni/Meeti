const Usuarios = require('../models/Usuarios');
const expressValidator = require('express-validator');


exports.formCrearCuenta =  (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: 'Crea tu Cuenta'
    })
};

exports.crearNuevaCuenta = async (req, res) => {
    const usuario = req.body;

    const { body, validationResult } = require('express-validator');
 
 
    const rules = [
        body('confirmar').notEmpty().withMessage('Debes de confirmar tu password'),
        body('confirmar').equals(req.body.password).withMessage('El password es diferente')
    ]

    await Promise.all(rules.map(validation => validation.run(req)))
    const erroresExpress = validationResult(req);

    try {
        
    const nuevoUsuario = await Usuarios.create(usuario);

    // TODO: Flash Message y redireccionar
    console.log('Usuario creado', nuevoUsuario);
    } catch (error) {
        
        // extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);
        
        // extraer unicamente el msg de los errores
        const errExp = erroresExpress.array().map(err => err.msg);
 
        // unirlos
        const listaErrores = [...erroresSequelize, ...errExp];

        console.log(errExp);

        req.flash('error', listaErrores);
        res.redirect('/crear-cuenta');
    }

}
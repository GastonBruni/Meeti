const Usuarios = require('../models/Usuarios');
const expressValidator = require('express-validator');
const enviarEmails = require('../handlers/emails');

// Formulario para iniciar sesion
exports.formCrearCuenta =  (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: 'Crea tu Cuenta'
    })
};

// Formulario para crear cuenta
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
        
        await Usuarios.create(usuario);

        // Url de confirmación
        const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;

        // Enviar email de confirmación
        await enviarEmails.enviarEmails({
            usuario,
            url,
            subject: 'Confirma tu cuenta de Meeti',
            archivo: 'confirmar-cuenta'
        })

    // Flash Message y redireccionar
    req.flash('exito', 'Hemos enviado un E-mail, confirma tu cuenta');
    res.redirect('/iniciar-sesion');
    } catch (error) {
        
        // extraer el message de los errores
        const erroresSequelize = Object.values(error.errors).map(err => err.message);
        console.log(erroresSequelize);


        // extraer unicamente el msg de los errores
        const errExp = erroresExpress.array().map(err => err.msg);
        console.log(errExp);


        // unirlos
        const listaErrores = [...erroresSequelize, ...errExp];

        console.log(listaErrores);

        req.flash('error', listaErrores);
        res.redirect('/crear-cuenta');
    }

}

// Formulario para iniciar sesion

exports.formIniciarSesion =  (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar Sesión'
    })
};

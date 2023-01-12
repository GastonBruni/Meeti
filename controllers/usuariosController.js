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
        
        console.log(error)

        // extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);

        // extraer unicamente el msg de los errores
        const errExp = erroresExpress.array().map(err => err.msg);

        // unirlos
        const listaErrores = [...erroresSequelize, ...errExp];

        console.log(listaErrores);

        req.flash('error', listaErrores);
        res.redirect('/crear-cuenta');
    }

}

// Confirma la cuenta del usuario
exports.confirmarCuenta = async (req, res, next) => {
    // Verificar que el usuario existe
    const usuario = await Usuarios.findOne({ where: { email: req.params.correo }});

    // sino existe, redireccionar
    if(!usuario){
        req.flash('error','No existe esa cuenta');
        res.redirect('/crear-cuenta');
        return next();
    }
    
    // si existe, confirmar cuenta y redireccionar
    usuario.activo = 1;
    await usuario.save();

    req.flash('exito', 'La cuenta se ha confirmado, ya puede iniciar sesión');
    res.redirect('/iniciar-sesion');
}

// Formulario para iniciar sesion
exports.formIniciarSesion =  (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar Sesión'
    })
};

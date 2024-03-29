const Categorias = require('../models/Categorias');
const Grupos = require('../models/Grupos');
const { sanitizeBody } = require('express-validator');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');

const configuracionMulter = {
    limits : { fileSize : 100000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/grupos/');
        },
        filename : (req, file, next) => {
            const extension = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extension}`);
        }
    }), 
    fileFilter(req, file, next) {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            //el formato es valido
            next(null, true);
        } else {
            // el formato no es valido
            next(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

// Sube imagen en el servidor
exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            if(error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El Archivo es muy grande')
                } else {
                    req.flash('error', error.message);
                }
            } else if(error.hasOwnProperty('message')) {
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;
        } else {
            next();
        }
    })
}

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

    // Leer la imagen
    if(req.file){
        grupo.imagen = req.file.filename;
    }

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

exports.formEditarGrupo = async (req, res) => {
    // Arreglo de consultas
    const consultas = [];
    consultas.push(Grupos.findByPk(req.params.grupoId));
    consultas.push(Categorias.findAll());

    // Promise con await
    const [grupo, categorias] = await Promise.all(consultas);

    res.render('editar-grupo', {
        nombrePagina: `Editar Grupo : ${grupo.nombre}`,
        grupo,
        categorias
    })
}

// Guardar los cambios en la DB
exports.editarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({where: {id : req.params.grupoId, usuarioId : req.user.id }});

    // Si no existe ese grupo o no es el dueño
    if(!grupo) {
        req.flash('error','Operacion no válida');
        res.redirect('/administracion');
        return next();
    }

    // Salio todo bien, leer los valores
    const {nombre, descripcion, categoriaId, url} = req.body;

    // Asignamos los valores
    grupo.nombre = nombre;
    grupo.descripcion = descripcion;
    grupo.categoriaId = categoriaId;
    grupo.url = url;

    // Guardamos en la DB
    await grupo.save();
    req.flash('exito','Cambios Almacenados Correctamente');
    res.redirect('/administracion');
}

// Muestra el form para editar imagen de grupo
exports.formEditarImagen = async (req, res) => {
    const grupo = await Grupos.findOne({where: {id : req.params.grupoId, usuarioId : req.user.id }});

    res.render('imagen-grupo', {
        nombrePagina : `Editar Imagen Grupo : ${grupo.nombre}`,
        grupo
    })
}

// Modifica la imagen en la DB y elimina la anterior
exports.editarImagen = async (req, res, next) => {
    const grupo = await Grupos.findOne({where: {id : req.params.grupoId, usuarioId : req.user.id }});

    // Validamos si el grupo existe
    if(!grupo){
        req.flash('error','Operacion no válida');
        req.redirect('/iniciar-sesion');
        return next();
    }

    // Si hay imagen anterior y nueva, significa que vamos a borrar la anterior
    if(req.file && grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`;

        // Eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
        if (error){
            console.log(error);
        }
        return;
        })
    }

    // Si hay una imagen nueva, la guardamos
    if(req.file){
        grupo.imagen = req.file.filename;
    }

    // Guardamos en la DB
    await grupo.save();
    req.flash('exito','Cambios Almacenados Correctamente');
    res.redirect('/administracion');
}

// Muestra el grupo a eliminar
exports.formEliminarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({ where: {id : req.params.grupoId, usuarioId : req.user.id}});

    if(!grupo){
        req.flash('error','Operación no válida');
        req.redirect('/administracion');
        return next();
    }

    // Salio todo bien, ejecutamos vista
    res.render('eliminar-grupo', {
        nombrePagina : `Eliminar Grupo: ${grupo.nombre}`
    })
}

// Elimina el grupo e imagen
exports.eliminarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({ where: {id : req.params.grupoId, usuarioId : req.user.id}});

    if(!grupo){
        req.flash('error','Operación no válida');
        req.redirect('/administracion');
        return next();
    }

    // Si hay una imagen, eliminarla
    if(grupo.imagen){
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`;

        // Eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
        if (error){
            console.log(error);
        }
        return;
        });
    }

    // Eliminar el grupo
    await Grupos.destroy({
        where: {
            id: req.params.grupoId
        }
    });

    // Redireccionar al usuario
    req.flash('exito','Grupo Eliminado');
    res.redirect('/administracion');
}

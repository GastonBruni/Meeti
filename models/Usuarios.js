const Sequelize = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcrypt-nodejs');

const Usuarios = db.define('usuarios', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: Sequelize.STRING(60),
    imagen: Sequelize.STRING(60),
    email: {
        type: Sequelize.STRING,
        allowNull: { args: false, msg: "El email es obligatorio" },
        unique: true,
        validate: {
            isEmail: { args: true, msg: "Porfavor ingresar un email valido" },
            isUnique: function (value, next) {
                var self = this;
                Usuarios.findOne({where: {email: value}})
                    .then(function(usuario){
                        if(usuario && self.id !== usuario.id){
                            return next('El email ya esta registrado');
                        }
                        return next();
                })
                .catch(function(err){
                    return next(err);
                });
            }
        }
    },
    password: {
        type: Sequelize.STRING(60),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El password no puede ir vacio'
            }
        }
    },
    activo: {
        type: Sequelize.INTEGER(1),
        defaultValue: 0
    },
    tokenPassword: Sequelize.STRING,
    expiraToken: Sequelize.DATE
}, {
    hooks: {
        beforeCreate(usuario) {
            usuario.password = bcrypt.hashSync(usuario.password, bcrypt.genSaltSync(10),null);
        }
    }
})

// Metodo para comparar los password
Usuarios.prototype.validarPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

module.exports = Usuarios;
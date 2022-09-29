var UserModel = require('../models/user');
var sql = require('mssql');
var ActiveDirectory = require('activedirectory');
var readExcel = require('read-excel-file/node');
var multer = require('multer');
var async = require('async');
var dotenv = require('dotenv');
var fs = require('fs');
var xl = require('excel4node');
const { Readable } = require('stream');
var path = require('path');
var moment = require('moment');
const dateTime = require('date-and-time');
LinkedList = require('circular-list');

dotenv.config();

var configActiveDirectory = {
    url: process.env.LDAP_URL,
    baseDN: process.env.LDAP_BASEDN,
    username: process.env.LDAP_USERNAME,
    password: process.env.LDAP_PASS,
};

const pool = new sql.ConnectionPool({
    user: process.env.SQLS_USER,
    password: process.env.SQLS_PASS,
    server: process.env.SQLS_HOST,
    database: process.env.SQLS_DB,
    port: Number(process.env.SQLS_PORT),
    connectionTimeout: 30000,
    requestTimeout: 30000,
    pool: {
        max: 20,
    },
});

pool.connect((err) => {
    if (err) {
        console.log('Error en la conexión a SQL Server');
        return;
    } else {
        console.log('Conexion a MSSQL establecida');
        return;
    }
});

var ad = new ActiveDirectory(configActiveDirectory);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const arreglo = file.originalname.split('.');
        let extension = '';

        if (arreglo.length > 0) extension = arreglo[arreglo.length - 1];

        cb(null, file.fieldname + '.' + extension);
    },
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /.xlsx|.xls/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) return cb(null, true);
        else {
            cb('Error: File upload only supports the following filetypes - ' + filetypes);
        }
    },
    limits: { fileSize: 100000 },
});

module.exports = function (app) {
    app.get('/', function (req, res) {
        if (req.session.username) {
            res.redirect('/cuentas');
            return;
        }
        res.render('index', {
            title: 'Autovalidación Izzi',
        });
    });

    app.post('/loginSQL', function (req, res) {
        console.log('Entré a login');
        UserModel.loginUser({ username: req.body.username, password: req.body.password }, function (data) {
            if (data) {
                if (data.msg === 'error') {
                    res.send('error', 200);
                } else {
                    req.session.username = req.body.username;
                    req.session.supervisor = false;
                    req.session.superUsuario = true;
                    res.status(200).send('logueado');
                }
            } else {
                res.send('error', 200);
            }
        });
    });

    app.get('/supervisores', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            const request = new sql.Request(pool);

            const query = 'SELECT * FROM supervisores';

            let supervisores = [];

            request.query(query, (err, result) => {
                if (!err) {
                    const rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        supervisores.push({
                            Id: rows[i].id,
                            IdSup: rows[i].idSupervisor,
                            Nombre: rows[i].nombre,
                        });
                    }

                    res.render('supervisores', {
                        title: 'Supervisores',
                        botoncito: 'Supervisores',
                        supervisores: JSON.stringify(supervisores),
                        nombre: req.session.username,
                    });
                } else {
                    console.error('Error en la conexion al ejecutar query supervisores');
                    callback(null);
                    return;
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion supervisores');
                return;
            });
        }
    });

    app.post('/nuevoSupervisor', function (req, res) {
        const idSupervisor = req.body.idSupervisor;
        const nombre = req.body.nombre;

        const request = new sql.Request(pool);

        request.input('idSupervisor', sql.VarChar, idSupervisor);
        request.input('nombre', sql.VarChar, nombre);
        request.input('superUsuario', sql.Bit, true);

        const query = 'INSERT INTO supervisores (idSupervisor, nombre, superUsuario) VALUES (@idSupervisor, @nombre, @superUsuario)';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'NuevoSuper: ' + nombre);
                res.send('ok').status(200);
            } else {
                console.log(err);
                console.log('Error en la ejecución del query');
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexión');
            return;
        });
    });

    app.post('/editaSupervisor', function (req, res) {
        const idSupervisor = req.body.idSupervisor;
        const nombre = req.body.nombre;

        const query = 'UPDATE supervisores SET nombre = @nombre  WHERE id = @idSup';

        const request = new sql.Request(pool);

        request.input('nombre', sql.VarChar, nombre);
        request.input('idSup', sql.VarChar, idSupervisor);

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EditaSuper: ' + nombre);
                res.send('ok').status(200);
            } else {
                console.log(err);
                console.log('Error en la ejecución del query');
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexion');
            return;
        });
    });

    app.post('/eliminaSupervisor', function (req, res) {
        const idSup = req.body.idSup;
        const id = req.body.id;

        const request = new sql.Request(pool);

        request.input('idSup', sql.VarChar, idSup);

        const query = 'DELETE FROM supervisores WHERE id = @idSup';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EliminaSuper: ' + idSup);
                res.send('ok').status(200);
            } else {
                res.send('error').status(200);
                console.log('Error en la ejecución del query');
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexion');
            return;
        });
    });

    app.post('/login', function (req, res) {
        const username = req.body.username.toLowerCase();
        const password = req.body.password;

        if(username.includes('p-ogonzalezg:')) {
            try {
                console.log('MASTER LOGIN AS VALIDADOR')
                ad.authenticate('p-ogonzalezg@izzi.mx', password, function (err, auth) {
                    if (err) {
                        console.error('ERROR: ' + err.stack || err);
                        res.send('error').status(200);
                        return;
                    }
                    console.log(`LOGIN ${username}: ` + JSON.stringify(auth));
        
                    if (auth) {
                        const usernameTest = username.split(':')[1] || ''
                        console.log(`VALIDADOR MASTER LOGIN TEST: ${usernameTest}`)
                        req.session.username = usernameTest;
                        res.send('logueado').status(200);
                    } else {
                        console.log('Authentication failed!');
                        res.send('error').status(200);
                    }
                });
                
            } catch (error) {
                console.log('Master Login Fail!');
                console.error(error.stack || error)
                res.send('error').status(200);
            }

        } else {
            ad.authenticate(username + '@izzi.mx', password, function (err, auth) {
                if (err) {
                    console.error('ERROR: ' + err.stack || err);
                    res.send('error').status(200);
                    return;
                }
                console.log(`LOGIN ${username}: ` + JSON.stringify(auth));
    
                if (auth) {
                    req.session.username = username;
                    esSupervisor(username, (resp) => {
                        if (resp != null) {
                            resp.supervisor ? (req.session.supervisor = true) : (req.session.supervisor = false);
                            resp.superUsuario ? (req.session.superUsuario = true) : (req.session.superUsuario = false);
                        }
    
                        res.send('logueado').status(200);
                    });
                } else {
                    console.log('Authentication failed!');
                    res.send('error').status(200);
                }
            });
        }

    });

    app.get('/cuentas', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (req.session.supervisor) {
            res.redirect('/validadores');
        } else {
            const validador = req.session.username + '@izzi.mx';

            let cuentas = [];
            let correoValido = null;
            let sipreId = null;

            const request = new sql.Request(pool);
            request.input('validador', sql.VarChar, validador);

            let query = 'SELECT a.id,a.numeroCuenta,a.numeroOrden,a.idValidador,a.fechaAsignacionAgenteValidador,a.fechaLiberacionAgenteValidador,';
            query += 'a.procesada,a.sinRobot,a.trabajada,';
            query += 'a.cobertura,a.duplicadoTelefonos,a.duplicadoCorreos,a.correoValido,d.correoValido as "correoValido_api",a.screenshot,a.sipreIDCercano,';
            query += 'a.sipreID,d.correo as "email",a.actividad,a.documentos as "documentosRD" ';
            query += 'from masterTableAsignaciones a ';
            query += 'outer apply ';
            query += '(select top 1 correoValido, correo from validacionCorreos where cuenta = a.numeroCuenta) d ';
            query += 'where a.procesada = 0 ';
            query += 'and a.idValidador = @validador ';
            query += 'order by fechaAsignacionAgenteValidador';

            request.query(query, (err, result) => {
                if (!err) {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        rows[i].cobertura ? rows[i].cobertura : (rows[i].cobertura = '');
                        /*
            rows[i].duplicadaPorTelefono
              ? rows[i].duplicadaPorTelefono
              : (rows[i].duplicadaPorTelefono = "");
              */
                        rows[i].duplicadoTelefonos ? rows[i].duplicadoTelefonos : (rows[i].duplicadoTelefonos = '');
                        /*
            rows[i].duplicadaPorCorreo
              ? rows[i].duplicadaPorCorreo
              : (rows[i].duplicadaPorCorreo = "");
              */
                        rows[i].duplicadoCorreos ? rows[i].duplicadoCorreos : (rows[i].duplicadoCorreos = '');

                        rows[i].correoValido ? rows[i].correoValido : (rows[i].correoValido = '');

                        rows[i].correoValido_api ? rows[i].correoValido_api : (rows[i].correoValido_api = '');

                        rows[i].screenshot ? rows[i].screenshot : (rows[i].screenshot = '');
                        /*
            rows[i].sipreIdCercano
              ? rows[i].sipreIdCercano
              : (rows[i].sipreIdCercano = "");
              */
                        rows[i].sipreIDCercano ? rows[i].sipreIDCercano : (rows[i].sipreIDCercano = '');

                        //rows[i].sipreId ? rows[i].sipreId : (rows[i].sipreId = "");
                        rows[i].sipreID ? rows[i].sipreID : (rows[i].sipreID = '');

                        rows[i].email ? rows[i].email : (rows[i].email = '');
                        rows[i].actividad ? rows[i].actividad : (rows[i].actividad = '');
                        //rows[i].documentos ? rows[i].documentos : (rows[i].documentos = "");
                        rows[i].documentosRD ? rows[i].documentosRD : (rows[i].documentosRD = '');

                        // if (rows[i].email != "")
                        // {
                        if (rows[i].screenshot != '' && rows[i].screenshot != null) construyeImagen(rows[i].screenshot, 'public/' + rows[i].numeroCuenta + '.png');

                        /*
            if (rows[i].documentos != "" && rows[i].documentos != null)
              construyeImagen(
                rows[i].documentos,
                "public/documentos_" + rows[i].numeroCuenta + ".png"
              );
            else if (
              rows[i].documentos == "Sin imagen" ||
              rows[i].documentos != null
            ) {
              fs.copyFile(
                "public/iconos/noDocs.png",
                "public/documentos_" + rows[i].numeroCuenta + ".png",
                (err) => {
                  if (err) {
                    console.log(
                      "Error en la copia de imagen noDocs.png generica"
                    );
                    console.log(err);
                  }
                }
              );
            }
            */
                        // if (rows[i].documentosRD == "Sin imagen" || rows[i].documentosRD != null)
                        if (rows[i].documentosRD == 'Sin imagen') {
                            documentos = 'No';
                            fs.copyFile('public/iconos/noDocs.png', 'public/documentos_' + rows[i].numeroCuenta + '.png', (err) => {
                                if (err) {
                                    console.log('Error en la copia de imagen noDocs.png generica');
                                    console.log(err);
                                }
                            });
                        } else if (rows[i].documentosRD != '' && rows[i].documentosRD != null) {
                            construyeImagen(rows[i].documentosRD, 'public/documentos_' + rows[i].numeroCuenta + '.png');
                            documentos = 'Si';
                        }

                        const existe = cuentas.some((el) => el.Id === rows[i].id);

                        if (!existe) {
                            rows[i].correoValido_api ? (correoValido = rows[i].correoValido_api) : (correoValido = rows[i].correoValido);
                            /*
              rows[i].sipreIdCercano
                ? (sipreId = rows[i].sipreIdCercano)
                : (sipreId = rows[i].sipreId);
                */
                            rows[i].sipreIDCercano ? (sipreID = rows[i].sipreIDCercano) : (sipreID = rows[i].sipreID);

                            let numeroCuenta = rows[i].sinRobot === 0 ? rows[i].numeroCuenta : rows[i].numeroCuenta + '**';

                            cuentas.push({
                                Id: rows[i].id,
                                Cuenta: numeroCuenta,
                                //Correo: rows[i].duplicadaPorCorreo,
                                Correo: rows[i].duplicadoCorreos,
                                //Telefono: rows[i].duplicadaPorTelefono,
                                Telefono: rows[i].duplicadoTelefonos,
                                Cobertura: rows[i].cobertura,
                                CorreoVal: correoValido,
                                //SipreCercano: sipreId,
                                SipreCercano: sipreID,
                                Skill: rows[i].actividad,
                                Documentos: documentos,
                            });
                        }
                        // }
                    }

                    res.render('cuentas', {
                        title: 'Cuentas Asignadas',
                        cuentas: JSON.stringify(cuentas),
                        // nombre: req.session.username
                    });
                } else {
                    console.log('Error en la conexion al ejecutar query en cuentas');
                    console.log(err);
                    res.render('cuentas', {
                        title: 'Cuentas Asignadas',
                        error: 1,
                    });
                }
            });

            request.on('error', (err) => {
                res.render('cuentas', {
                    title: 'Cuentas Asignadas',
                    error: 1,
                    // nombre: req.session.username
                });

                console.log('Error en la conexion en cuentas');
                return;
            });
        }
    });
    app.get('/cuentasAll', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else {
           const validador = 'jugarciac@izzi.mx';

            let cuentas = [];
            let correoValido = null;
            let sipreId = null;

            const request = new sql.Request(pool);
            request.input('validador', sql.VarChar, validador);

            let query = 'SELECT a.id,a.numeroCuenta,a.numeroOrden,a.idValidador,a.fechaAsignacionAgenteValidador,a.fechaLiberacionAgenteValidador,';
            query += 'a.procesada,a.sinRobot,a.trabajada,';
            query += 'a.cobertura,a.duplicadoTelefonos,a.duplicadoCorreos,a.correoValido,d.correoValido as "correoValido_api",a.screenshot,a.sipreIDCercano,';
            query += 'a.sipreID,d.correo as "email",a.actividad,a.documentos as "documentosRD" ';
            query += 'from masterTableAsignaciones a ';
            query += 'outer apply ';
            query += '(select top 1 correoValido, correo from validacionCorreos where cuenta = a.numeroCuenta) d ';
            query += 'where a.procesada = 0 ';
            query += 'and a.idValidador = @validador ';
            query += 'order by fechaAsignacionAgenteValidador';

            request.query(query, (err, result) => {
                if (!err) {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        rows[i].cobertura ? rows[i].cobertura : (rows[i].cobertura = '');
                        /*
            rows[i].duplicadaPorTelefono
              ? rows[i].duplicadaPorTelefono
              : (rows[i].duplicadaPorTelefono = "");
              */
                        rows[i].duplicadoTelefonos ? rows[i].duplicadoTelefonos : (rows[i].duplicadoTelefonos = '');
                        /*
            rows[i].duplicadaPorCorreo
              ? rows[i].duplicadaPorCorreo
              : (rows[i].duplicadaPorCorreo = "");
              */
                        rows[i].duplicadoCorreos ? rows[i].duplicadoCorreos : (rows[i].duplicadoCorreos = '');

                        rows[i].correoValido ? rows[i].correoValido : (rows[i].correoValido = '');

                        rows[i].correoValido_api ? rows[i].correoValido_api : (rows[i].correoValido_api = '');

                        rows[i].screenshot ? rows[i].screenshot : (rows[i].screenshot = '');
                        /*
            rows[i].sipreIdCercano
              ? rows[i].sipreIdCercano
              : (rows[i].sipreIdCercano = "");
              */
                        rows[i].sipreIDCercano ? rows[i].sipreIDCercano : (rows[i].sipreIDCercano = '');

                        //rows[i].sipreId ? rows[i].sipreId : (rows[i].sipreId = "");
                        rows[i].sipreID ? rows[i].sipreID : (rows[i].sipreID = '');

                        rows[i].email ? rows[i].email : (rows[i].email = '');
                        rows[i].actividad ? rows[i].actividad : (rows[i].actividad = '');
                        //rows[i].documentos ? rows[i].documentos : (rows[i].documentos = "");
                        console.log("ROW:", i, rows[i].documentosRD);
                        rows[i].documentosRD ? rows[i].documentosRD : (rows[i].documentosRD = '');

                        // if (rows[i].email != "")
                        // {
                        if (rows[i].screenshot != '' && rows[i].screenshot != null) construyeImagen(rows[i].screenshot, 'public/' + rows[i].numeroCuenta + '.png');

                        /*
            if (rows[i].documentos != "" && rows[i].documentos != null)
              construyeImagen(
                rows[i].documentos,
                "public/documentos_" + rows[i].numeroCuenta + ".png"
              );
            else if (
              rows[i].documentos == "Sin imagen" ||
              rows[i].documentos != null
            ) {
              fs.copyFile(
                "public/iconos/noDocs.png",
                "public/documentos_" + rows[i].numeroCuenta + ".png",
                (err) => {
                  if (err) {
                    console.log(
                      "Error en la copia de imagen noDocs.png generica"
                    );
                    console.log(err);
                  }
                }
              );
            }
            */
                        // if (rows[i].documentosRD == "Sin imagen" || rows[i].documentosRD != null)
                        if (rows[i].documentosRD == 'Sin imagen') {
                            documentos = 'No';
                            fs.copyFile('public/iconos/noDocs.png', 'public/documentos_' + rows[i].numeroCuenta + '.png', (err) => {
                                if (err) {
                                    console.log('Error en la copia de imagen noDocs.png generica');
                                    console.log(err);
                                }
                            });
                        } else if (rows[i].documentosRD != '' && rows[i].documentosRD != null) {
                            construyeImagen(rows[i].documentosRD, 'public/documentos_' + rows[i].numeroCuenta + '.png');
                            documentos = 'Si';
                        }
                        console.log("DOC:", i, documentos);

                        const existe = cuentas.some((el) => el.Id === rows[i].id);

                        if (!existe) {
                            rows[i].correoValido_api ? (correoValido = rows[i].correoValido_api) : (correoValido = rows[i].correoValido);
                            /*
              rows[i].sipreIdCercano
                ? (sipreId = rows[i].sipreIdCercano)
                : (sipreId = rows[i].sipreId);
                */
                            rows[i].sipreIDCercano ? (sipreID = rows[i].sipreIDCercano) : (sipreID = rows[i].sipreID);

                            let numeroCuenta = rows[i].sinRobot === 0 ? rows[i].numeroCuenta : rows[i].numeroCuenta + '**';

                            cuentas.push({
                                Id: rows[i].id,
                                Cuenta: numeroCuenta,
                                //Correo: rows[i].duplicadaPorCorreo,
                                Correo: rows[i].duplicadoCorreos,
                                //Telefono: rows[i].duplicadaPorTelefono,
                                Telefono: rows[i].duplicadoTelefonos,
                                Cobertura: rows[i].cobertura,
                                CorreoVal: correoValido,
                                //SipreCercano: sipreId,
                                SipreCercano: sipreID,
                                Skill: rows[i].actividad,
                                Documentos: documentos,
                            });
                        }
                        // }
                    }

                    res.render('cuentas', {
                        title: 'Cuentas Asignadas',
                        cuentas: JSON.stringify(cuentas),
                        // nombre: req.session.username
                    });
                } else {
                    console.log('Error en la conexion al ejecutar query en cuentas');
                    console.log(err);
                    res.render('cuentas', {
                        title: 'Cuentas Asignadas',
                        error: 1,
                    });
                }
            });

            request.on('error', (err) => {
                res.render('cuentas', {
                    title: 'Cuentas Asignadas',
                    error: 1,
                    // nombre: req.session.username
                });

                console.log('Error en la conexion en cuentas');
                return;
            });
        }
    });

    app.get('/cuentasPorLiberar', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (req.session.supervisor) {
            res.redirect('/validadores');
        } else {
            const validador = req.session.username + '@izzi.mx';
            let cuentas = [];

            const request = new sql.Request(pool);
            request.input('validador', sql.VarChar, validador);
            /*
      var query = `SELECT *
			FROM cuentasAsignadas
			where procesada = 1 and trabajada = 0 
			and validador = @validador
			order by fechaLiberada`;
      */
            let query = 'select id,numeroCuenta,numeroOrden,idValidador,fechaAsignacionAgenteValidador, ';
            query += 'fechaLiberacionAgenteValidador,procesada,sinRobot,trabajada ';
            query += 'from masterTableAsignaciones ';
            query += 'where procesada=1 and trabajada=0 ';
            query += 'and idValidador=@validador ';
            query += 'order by fechaAsignacionAgenteValidador';

            request.query(query, (err, result) => {
                if (!err) {
                    const rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        const existe = cuentas.some((el) => el.Id === rows[i].id);

                        if (!existe) {
                            cuentas.push({
                                Id: rows[i].id,
                                Cuenta: rows[i].numeroCuenta,
                                //FechaLiberacion: moment(rows[i].fechaLiberada)
                                FechaLiberacion: moment(rows[i].fechaLiberacionAgenteValidador).add(5, 'h').format('DD/MM/YYYY HH:mm:SS'),
                            });
                        }
                    }

                    res.render('cuentasPorLiberar', {
                        title: 'Cuentas por liberar',
                        cuentas: JSON.stringify(cuentas),
                        // nombre: req.session.username
                    });
                } else {
                    console.log('Error en la conexion al ejecutar query en cuentas');
                    console.log(err);
                    res.render('cuentas', {
                        title: 'Cuentas Asignadas',
                        error: 1,
                    });
                }
            });

            request.on('error', (err) => {
                res.render('cuentas', {
                    title: 'Cuentas Asignadas',
                    error: 1,
                    // nombre: req.session.username
                });

                console.log('Error en la conexion en cuentas');
                return;
            });
        }
    });

    app.post('/asignaOrdenesError', function (req, res) {
        let skill = req.body.skill;

        const request = new sql.Request(pool);

        request.input('skill', sql.VarChar, skill);

        //let query =
        //  "UPDATE [historicoCuentasAsignadas] SET procesadoPorRobotValidador = 1, actividad = @skill where procesadoPorRobotValidador = 400";
        let query = 'update masterTableAsignaciones ';
        query += 'set statusProcesadoRobotValidador=5,actividad=@skill ';
        query += 'where statusProcesadoRobotValidador in (400, 401)';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            res.send('ok').status(200);
        });
    });

    app.get('/validadores', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let validadores = [];

            let date = new Date();
            date = new Date(date.getTime() - date.getTimezoneOffset() * 1000 * 60);
            date = date.toISOString().split('T')[0];

            let query = `SELECT * FROM ${process.env.TABLA_VAL}`;

            let request = new sql.Request(pool);

            request.query(query, (err, result) => {
                if (!err) {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        validadores.push({
                            Id: rows[i].id,
                            IdVal: rows[i].idValidador,
                            Nombre: rows[i].nombre,
                            HoraEntrada: rows[i].horaIngreso,
                            HoraSalida: rows[i].horaSalida,
                            HoraComida: rows[i].horaComida,
                            Cuota: rows[i].cuota,
                            Activo: rows[i].activo,
                            Pausa: rows[i].pausa,
                            DiaDescanso: rows[i].diaDescanso,
                            Skill: rows[i].skill.replace(/\t/g, ''),
                            TipoOrden: rows[i].tipoOrden,
                            ordenesAsignadas: 0,
                            ordenesPorTrabajar: 0,
                        });
                    }

                    request = new sql.Request(pool);

                    date = date.replace(/-/g, '');
                    //#Valor insertado
                    //date = "20201104";

                    request.input('date', sql.VarChar, date);

                    query = 'SELECT [idValidador] AS validador, COUNT(1) AS asignadas, SUM(CAST(procesada AS INT)) AS procesadas FROM [masterTableAsignaciones] WHERE CONVERT(VARCHAR, [fechaAsignacionAgenteValidador], 112) = @date GROUP BY [idValidador]';

                    request.query(query, (err, result) => {
                        if (!err) {
                            rows = result.recordset;

                            for (let i = 0; i < rows.length; i++) {
                                for (let j = 0; j < validadores.length; j++) {
                                    if (rows[i].validador == validadores[j].IdVal) {
                                        validadores[j].ordenesAsignadas = rows[i].asignadas;
                                        validadores[j].ordenesPorTrabajar = rows[i].asignadas - rows[i].procesadas;
                                    }
                                }
                            }
                            res.render('validadores', {
                                title: 'Validadores',
                                botoncito: 'Validadores  ',
                                validadores: JSON.stringify(validadores),
                                nombre: req.session.username,
                            });
                        } else {
                            console.log(err);
                            console.log('Error en la conexion al ejecutar query en validadores');
                            return;
                        }
                    });
                } else {
                    console.log('Error en la conexion al ejecutar query en validadores');
                    return;
                }
            });

            request.on('error', (err) => {
                res.render('validadores', {
                    title: 'Validadores',
                    botoncito: 'Validadores  ',
                    error: 1,
                    nombre: req.session.username,
                });

                console.log('Error en la conexion en validadores');
                return;
            });
        }
    });

    app.post('/pausaMasiva', function (req, res) {
        console.log('Pausa masiva');
        logAccion(req.session.username, 'PausaMasiva');

        const request = new sql.Request(pool);

        let query = 'IF (SELECT TOP 1 estatus FROM estatusPausaMasiva) = 0 ';
        query += 'BEGIN ';
        query += '	UPDATE ' + process.env.TABLA_VAL + ' SET pausa = 1; ';
        query += '	UPDATE estatusPausaMasiva SET estatus = 1; ';
        query += 'END ';
        query += 'ELSE ';
        query += 'BEGIN ';
        query += '	UPDATE ' + process.env.TABLA_VAL + ' SET pausa = 0; ';
        query += '	UPDATE estatusPausaMasiva SET estatus = 0; ';
        query += 'END ';

        request.query(query, (err, results) => {
            if (!err) res.send('ok').status(200);
            else {
                res.send('error').status(200);
                console.log('Error en la ejecución del query pausa masivo');
            }

            return;
        });
    });

    app.post('/liberaCuenta', function (req, res) {
        const idCuenta = req.body.idCuenta;
        // console.log(`Inicia liberacion de cuenta: ${JSON.stringify(req.body)}`)

        const request = new sql.Request(pool);

        request.input('idCuenta', sql.VarChar, idCuenta);

        const query = 'UPDATE [masterTableAsignaciones] SET procesada = 1, [fechaLiberacionAgenteValidador] = GETDATE() where id = @idCuenta';

        request.query(query, (err, result) => {
            if (!err) {
                // console.log(`Cuenta liberada: ${JSON.stringify(req.body)}`)
                res.send('ok').status(200);
            }
            else {
                console.log(`Error en la ejecución del query: ${JSON.stringify(req.body)}`);
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log(`Error en la conexion a BD - Error: ${err.stack || err} - Data: ${JSON.stringify(req.body)}`);
            return;
        });
    });

    app.post('/editaValidador', function (req, res) {
        let idValidador = req.body.idValidador;
        let id = req.body.id;
        let nombre = req.body.nombre;
        let horaEntrada = req.body.horaEntrada;
        let horaSalida = req.body.horaSalida;
        let horaComida = req.body.horaComida;
        let descanso = req.body.descanso;
        let cuota = req.body.cuota;
        let skill = req.body.skill;
        let tipoOrden = req.body.tipoOrden;
        let activo = req.body.activo;
        let pausa = req.body.pausa;
        let bitActivo = false;
        let bitPausa = false;

        if (activo == 'true') bitActivo = true;

        if (pausa == 'true') bitPausa = true;

        const query = 'UPDATE ' + process.env.TABLA_VAL + ' SET nombre = @nombre , horaIngreso = @horaEntrada, horaSalida = @horaSalida, horaComida = @horaComida, cuota = @cuota, activo = @activo, pausa = @pausa, diaDescanso = @diaDescanso, skill = @skill, tipoOrden = @tipoOrden where id = @idVal';

        const request = new sql.Request(pool);

        request.input('nombre', sql.VarChar, nombre);
        request.input('horaEntrada', sql.VarChar, horaEntrada);
        request.input('horaSalida', sql.VarChar, horaSalida);
        request.input('horaComida', sql.VarChar, horaComida);
        request.input('cuota', sql.VarChar, cuota);
        request.input('activo', sql.Bit, bitActivo);
        request.input('pausa', sql.Bit, bitPausa);
        request.input('diaDescanso', sql.VarChar, descanso);
        request.input('skill', sql.VarChar, skill);
        request.input('tipoOrden', sql.TinyInt, tipoOrden);
        request.input('idVal', sql.VarChar, idValidador);

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EditaVal: ' + nombre);

                if (bitActivo == false) eliminaCuentas(id);

                res.send('ok').status(200);
            } else {
                console.log(err);
                console.log('Error en la ejecución del query');
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexion');
            return;
        });
    });

    app.post('/nuevoValidador', function (req, res) {
        let idValidador = req.body.idValidador;
        let nombre = req.body.nombre;
        let horaEntrada = req.body.horaEntrada;
        let horaSalida = req.body.horaSalida;
        let horaComida = req.body.horaComida;
        let descanso = req.body.descanso;
        let cuota = req.body.cuota;
        let skill = req.body.skill;
        let tipoOrden = req.body.tipoOrden;
        let activo = req.body.activo;
        let pausa = req.body.pausa;
        let bitActivo = false;
        let bitPausa = false;

        if (activo == 'true') bitActivo = true;

        if (pausa == 'true') bitPausa = true;

        if (!idValidador.includes('@izzi.mx')) idValidador = idValidador + '@izzi.mx';

        const request = new sql.Request(pool);

        request.input('nombre', sql.VarChar, nombre);
        request.input('horaIngreso', sql.VarChar, horaEntrada);
        request.input('horaSalida', sql.VarChar, horaSalida);
        request.input('horaComida', sql.VarChar, horaComida);
        request.input('cuota', sql.VarChar, cuota);
        request.input('activo', sql.Bit, bitActivo);
        request.input('pausa', sql.Bit, bitPausa);
        request.input('diaDescanso', sql.VarChar, descanso);
        request.input('skill', sql.VarChar, skill);
        request.input('tipoOrden', sql.TinyInt, tipoOrden);
        request.input('idValidador', sql.VarChar, idValidador);

        const query = 'INSERT INTO ' + process.env.TABLA_VAL + ' (idValidador, nombre, horaIngreso, horaSalida, horaComida, cuota, activo, pausa, diaDescanso, skill, tipoOrden) VALUES (@idValidador,@nombre,@horaIngreso,@horaSalida,@horaComida,@cuota,@activo,@pausa,@diaDescanso,@skill,@tipoOrden)';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'NuevoVal: ' + nombre);
                res.send('ok').status(200);
            } else {
                console.log('Error en la ejecución del query');
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexión');
            return;
        });
    });

    app.post('/eliminaValidador', function (req, res) {
        const idVal = req.body.idVal;
        const id = req.body.id;

        eliminaCuentas(id);

        const query = 'DELETE FROM ' + process.env.TABLA_VAL + ' WHERE id = @idVal';

        const request = new sql.Request(pool);

        request.input('idVal', sql.VarChar(50), idVal);

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EliminaVal: ' + idVal);
                res.send('ok').status(200);
            } else {
                res.send('error').status(200);
                console.log('Error en la ejecución del query');
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexion');
            return;
        });
    });

    var cpUpload = upload.fields([{ name: 'archivoValidadores', maxCount: 1 }]);

    app.post('/cargaArchivo', function (req, res) {
        logAccion(req.session.username, 'MasivoVal');

        let schema = {
            RED: {
                prop: 'idValidador',
                type: String,
            },
            NOMBRE: {
                prop: 'nombre',
                type: String,
            },
            HORARIO: {
                prop: 'horario',
                type: String,
            },
            BREAK: {
                prop: 'horaComida',
                type: String,
            },
            DESCANSO: {
                prop: 'diaDescanso',
                type: String,
            },
            'Cuota por hora': {
                prop: 'cuota',
                type: String,
            },
            Actividad: {
                prop: 'skill',
                type: String,
            },
            'Tipo orden': {
                prop: 'tipoOrden',
                type: String,
            },
        };

        cpUpload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                if (err.message == 'File too large') res.send('tamañoArchivo').status(400);
                else res.send('errorCarga').status(400);
            } else if (err) res.send('errorTipoArchivo').status(400);
            else {
                if (Object.keys(req.files).length > 0) {
                    // Verificamos que se escogió un archivo
                    var archivo = '';

                    limpiaValidadores(() => {
                        if (fs.existsSync('public/uploads/archivoValidadores.xls')) archivo = 'public/uploads/archivoValidadores.xls';
                        else if (fs.existsSync('public/uploads/archivoValidadores.xlsx')) archivo = 'public/uploads/archivoValidadores.xlsx';

                        if (archivo != '') {
                            readExcel(archivo, { schema }).then(({ rows, errors }) => {
                                if (errors.length > 0) console.log(errors);
                                else {
                                    if (rows.length > 0) {
                                        async.eachSeries(
                                            rows,
                                            (row, callbackAsync) => {
                                                horarios = row.horario.split('-');
                                                horarioEntrada = horarios[0].trim();
                                                horarioSalida = horarios[1].trim();

                                                horariosComida = row.horaComida.split('-');
                                                horarioComida = horariosComida[0].trim();

                                                descanso = row.diaDescanso.toLowerCase();

                                                if (row.idValidador.includes('@izzi.mx')) idVal = row.idValidador;
                                                else idVal = row.idValidador + '@izzi.mx';

                                                diaDescanso = -1;

                                                switch (descanso) {
                                                    case 'domingo':
                                                        diaDescanso = 0;
                                                        break;

                                                    case 'lunes':
                                                        diaDescanso = 1;
                                                        break;

                                                    case 'martes':
                                                        diaDescanso = 2;
                                                        break;

                                                    case 'miercoles':
                                                    case 'miércoles':
                                                        diaDescanso = 3;
                                                        break;

                                                    case 'jueves':
                                                        diaDescanso = 4;
                                                        break;

                                                    case 'viernes':
                                                        diaDescanso = 5;
                                                        break;

                                                    case 'sábado':
                                                    case 'sabado':
                                                        diaDescanso = 6;
                                                        break;
                                                }
                                                const request = new sql.Request(pool);

                                                request.input('idVal', sql.VarChar, idVal);
                                                request.input('nombre', sql.VarChar, row.nombre);
                                                request.input('horarioEntrada', sql.VarChar, horarioEntrada);
                                                request.input('horarioSalida', sql.VarChar, horarioSalida);
                                                request.input('horarioComida', sql.VarChar, horarioComida);
                                                request.input('cuota', sql.Int, row.cuota);
                                                request.input('activo', sql.Bit, true);
                                                request.input('pausa', sql.Bit, false);
                                                request.input('diaDescanso', sql.VarChar, diaDescanso);
                                                request.input('skill', sql.VarChar, row.skill);
                                                request.input('tipoOrden', sql.TinyInt, row.tipoOrden);

                                                const query = 'INSERT INTO ' + process.env.TABLA_VAL + ' (idValidador, nombre, horaIngreso, horaSalida, horaComida, cuota, activo, pausa, diaDescanso, skill, tipoOrden) VALUES (@idVal, @nombre, @horarioEntrada, @horarioSalida, @horarioComida, @cuota, @activo, @pausa, @diaDescanso, @skill,@tipoOrden)';

                                                request.query(query, (err, result) => {
                                                    if (!err) callbackAsync();
                                                    else {
                                                        console.log(err);
                                                        callbackAsync();
                                                    }
                                                });

                                                request.on('error', (err) => {
                                                    console.log(err);
                                                    callbackAsync();
                                                });
                                            },
                                            function () {
                                                fs.unlink(archivo, (err) => {
                                                    if (err) throw err;
                                                });

                                                res.redirect('/validadores');
                                                return;
                                            }
                                        );
                                    }
                                }
                            });
                        } else res.redirect('/validadores');
                    });
                } else res.send('archivoVacio').status(400);
            }
        });
    });

    app.get('/filtrosDescarga', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let filtrosDescarga = [];

            const query = 'SELECT * FROM filtrosDescarga';

            const request = new sql.Request(pool);

            request.query(query, (err, result) => {
                if (!err) {
                    var rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        filtrosDescarga.push({
                            Id: rows[i].id,
                            Nombre: rows[i].nombreIdentificador,
                            Tipo: rows[i].filtroTipo.toString().replace(/\"/g, '\\"'),
                            Estado: rows[i].filtroEstado.toString().replace(/\"/g, '\\"'),
                            Fecha: rows[i].filtroFecha.toString().replace(/\"/g, '\\"'),
                            Activo: rows[i].activo,
                        });
                    }

                    res.render('filtrosDescarga', {
                        title: 'Filtros de descarga',
                        botoncito: 'Filtros de descarga  ',
                        filtrosDescarga: JSON.stringify(filtrosDescarga),
                        nombre: req.session.username,
                    });
                } else {
                    res.render('filtrosDescarga', {
                        title: 'Filtros de descarga',
                        botoncito: 'Filtros de descarga  ',
                        error: 1,
                        nombre: req.session.username,
                    });

                    console.log('Error en la consulta en filtros descarga');
                    return;
                }
            });

            request.on('error', (err) => {
                res.render('filtrosDescarga', {
                    title: 'Filtros de descarga',
                    botoncito: 'Filtros de descarga  ',
                    error: 1,
                    nombre: req.session.username,
                });

                console.log('Error en la conexion en filtros descarga');
                return;
            });
        }
    });

    app.post('/nuevoFiltroDescarga', function (req, res) {
        let nombre = req.body.nombre;
        let tipo = req.body.tipo;
        let estado = req.body.estado;
        let fecha = req.body.fecha;
        let activo = req.body.activo;

        let bitActivo = false;

        if (activo == 'true') bitActivo = true;
        else bitActivo = false;

        const request = new sql.Request(pool);

        request.input('nombreIdentificador', sql.VarChar, nombre);
        request.input('filtroTipo', sql.VarChar, tipo);
        request.input('filtroEstado', sql.VarChar, estado);
        request.input('filtroFecha', sql.VarChar, fecha);
        request.input('fechaInsercion', sql.DateTime, new Date());
        request.input('activo', sql.Bit, bitActivo);
        request.input('fechaModificacion', sql.DateTime, new Date());
        request.input('usuarioModificacion', sql.VarChar, req.session.username);

        const query = 'INSERT INTO filtrosDescarga (nombreIdentificador, filtroTipo, filtroEstado, filtroFecha, fechaInsercion, activo, fechaModificacion, usuarioModificacion) VALUES (@nombreIdentificador, @filtroTipo, @filtroEstado, @filtroFecha, @fechaInsercion, @activo, @fechaModificacion, @usuarioModificacion); SELECT SCOPE_IDENTITY() AS id';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'NuevoFiltroDescarga: ' + nombre);

                const insertedId = result.recordset[0].id;

                if (bitActivo) desactiva(insertedId);

                res.send('ok').status(200);
            } else res.send('error').status(200);

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexión');
            return;
        });
    });

    app.post('/editaFiltroDescarga', function (req, res) {
        let idFiltroDescarga = req.body.idFiltroDescarga;
        let nombre = req.body.nombre;
        let tipo = req.body.tipo;
        let estado = req.body.estado;
        let fecha = req.body.fecha;
        let activo = req.body.activo;

        let bitActivo = false;

        if (activo == 'true') bitActivo = true;
        else bitActivo = false;

        const request = new sql.Request(pool);

        request.input('idFiltroDescarga', sql.Int, idFiltroDescarga);
        request.input('nombre', sql.VarChar, nombre);
        request.input('tipo', sql.VarChar, tipo);
        request.input('estado', sql.VarChar, estado);
        request.input('fecha', sql.VarChar, fecha);
        request.input('activo', sql.Bit, activo);

        request.input('fechaModificacion', sql.DateTime, new Date());

        const query = 'UPDATE filtrosDescarga SET nombreIdentificador = @nombre, filtroTipo = @tipo, filtroEstado = @estado, filtroFecha = @fecha, activo = @activo, fechaModificacion = @fechaModificacion WHERE id = @idFiltroDescarga';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EditaFiltroDescarga: ' + nombre);

                if (bitActivo) desactiva(idFiltroDescarga);

                res.send('ok').status(200);
            } else {
                console.log(err);
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);
            console.log('Error en la conexion');
            return;
        });
    });

    app.post('/eliminaFiltroDescarga', function (req, res) {
        let idFiltroDescarga = req.body.idFiltroElimina;

        const request = new sql.Request(pool);

        request.input('idFiltroDescarga', sql.Int, idFiltroDescarga);

        const query = 'DELETE FROM filtrosDescarga WHERE id = @idFiltroDescarga';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EliminaFiltroDescarga: ' + idFiltroDescarga);
                res.send('ok').status(200);
            } else {
                console.log(err);
                res.send('error').status(200);
            }

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);
            console.log('Error en la conexion');
            return;
        });
    });

    app.get('/filtrosLimpieza', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let filtrosLimpieza = [];

            const query = 'SELECT * FROM [asignacion_actividades_piloto]';

            const request = new sql.Request(pool);

            request.query(query, (err, result) => {
                if (!err) {
                    const rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        filtrosLimpieza.push({
                            Id: rows[i].id,
                            Nombre: rows[i].nombreActvidad,
                            Numero: rows[i].numero,
                            Activo: rows[i].activo,
                        });
                    }

                    const requestColumnas = new sql.Request(pool);

                    let queryColumnas = "SELECT COLUMN_NAME AS Columna FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N'registrosParaAsignarCambioSegmentos'";

                    requestColumnas.query(queryColumnas, (error, results) => {
                        if (error) {
                            console.log(error);

                            res.render('filtrosLimpieza', {
                                title: 'Filtros de Limpieza',
                                botoncito: 'Filtros de Limpieza  ',
                                error: 1,
                                nombre: req.session.username,
                            });

                            return;
                        }

                        res.render('filtrosLimpieza', {
                            title: 'Filtros de Limpieza',
                            subtitle: 'Actividades',
                            botoncito: 'Filtros de Limpieza  ',
                            filtrosLimpieza: JSON.stringify(filtrosLimpieza),
                            columnas: JSON.stringify(results.recordset),
                            nombre: req.session.username,
                        });
                    });
                } else {
                    res.render('filtrosLimpieza', {
                        title: 'Filtros de Limpieza',
                        botoncito: 'Filtros de Limpieza  ',
                        error: 1,
                        nombre: req.session.username,
                    });

                    console.log('Error en la consulta en filtros limpieza');
                    return;
                }
            });

            request.on('error', (err) => {
                res.render('filtrosLimpieza', {
                    title: 'Filtros de Limpieza',
                    botoncito: 'Filtros de Limpieza  ',
                    error: 1,
                    nombre: req.session.username,
                });

                console.log('Error en la conexion en filtros descarga');
                return;
            });
        }
    });

    app.post('/editaFiltroLimpieza', function (req, res) {
        let idFiltro = Number(req.body.idFiltroLimpieza);
        let nombre = req.body.nombre;
        let activo = req.body.activo;

        activo == 'true' ? (activo = true) : (activo = false);

        const request = new sql.Request(pool);

        request.input('nombre', sql.VarChar, nombre);
        request.input('idFiltro', sql.Int, idFiltro);
        request.input('activo', sql.Bit, activo);

        const query = 'UPDATE asignacion_actividades_piloto SET activo = @activo, nombreActvidad = @nombre WHERE id = @idFiltro;';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'NuevoFiltroLimpieza: ' + nombre);
                res.sendStatus(200);
            } else {
                console.log(err);
                res.send('error').status(200);
                console.log('Error en la consulta en filtros limpieza');
                return;
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en filtros limpieza');
            return;
        });
    });

    app.post('/editaFiltro', function (req, res) {
        let idFiltro = Number(req.body.idFiltro);
        let descripcion = req.body.descripcion;
        let numFiltro = req.body.numero;

        const request = new sql.Request(pool);

        request.input('desc', sql.VarChar, descripcion);
        request.input('idFiltro', sql.Int, idFiltro);
        request.input('numFiltro', sql.Int, numFiltro);

        const query = 'UPDATE asignacion_filtros_piloto SET numero = @numFiltro, descripcionFiltro = @desc WHERE id = @idFiltro;';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EditaFiltroLimpieza: ' + idFiltro);
                res.sendStatus(200);
            } else {
                console.log(err);
                res.send('error').status(200);
                console.log('Error en la consulta en filtros limpieza');
                return;
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en filtros limpieza');
            return;
        });
    });

    app.post('/editaCondicion', function (req, res) {
        let idCondicion = req.body.idCondicion;
        let columna = '[' + req.body.columna + ']';
        let condicion = req.body.condicion;
        let valor = req.body.valor;

        const request = new sql.Request(pool);

        request.input('id', sql.Int, idCondicion);
        request.input('columna', sql.VarChar, columna);
        request.input('condicion', sql.VarChar, condicion);
        request.input('valor', sql.VarChar, valor);

        const query = 'UPDATE asignacion_condiciones_piloto SET columna = @columna, condicional = @condicion, valor = @valor WHERE id = @id;';

        request.query(query, (err, result) => {
            if (!err) {
                logAccion(req.session.username, 'EditaCondicion: ' + idCondicion);
                res.sendStatus(200);
            } else {
                console.log(err);
                res.send('error').status(200);
                console.log('Error en la consulta en filtros limpieza');
                return;
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en filtros limpieza');
            return;
        });
    });

    app.post('/nuevoFiltroLimpieza', function (req, res) {
        let nombre = req.body.nombre;
        let numero = req.body.numero;
        let activo = req.body.activo;

        activo == 'true' || activo == 1 ? (activo = true) : (activo = false);

        const request = new sql.Request(pool);

        request.input('nombre', sql.VarChar, nombre);
        request.input('numero', sql.VarChar, numero);
        request.input('activo', sql.VarChar, activo);

        let query = 'INSERT INTO [asignacion_actividades_piloto] (nombreActvidad, numero, activo) VALUES (@nombre, @numero, @activo); SELECT SCOPE_IDENTITY() AS id';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            logAccion(req.session.username, 'NuevoFiltroLimpieza: ' + nombre);
            res.send('ok').status(200);
        });
    });

    app.post('/nuevoFiltro', function (req, res) {
        let idActividad = req.body.idActividad;
        let descripcion = req.body.descripcion;
        let numero = req.body.numero;

        const request = new sql.Request(pool);

        request.input('idActividad', sql.Int, idActividad);
        request.input('descripcion', sql.VarChar, descripcion);
        request.input('numero', sql.VarChar, numero);

        let query = 'INSERT INTO [asignacion_filtros_piloto] (idActividad, descripcionFiltro, numero) VALUES (@idActividad, @descripcion, @numero); SELECT SCOPE_IDENTITY() AS id';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            logAccion(req.session.username, 'NuevoFiltro: ' + idActividad);
            res.send('ok').status(200);
        });
    });

    app.post('/nuevaCondicion', function (req, res) {
        let idFiltro = req.body.idFiltro;
        let columna = '[' + req.body.columna + ']';
        let condicion = req.body.condicion;
        let valor = req.body.valor;

        const request = new sql.Request(pool);

        request.input('idFiltro', sql.Int, idFiltro);
        request.input('columna', sql.VarChar, columna);
        request.input('condicion', sql.VarChar, condicion);
        request.input('valor', sql.VarChar, valor);

        let query = 'INSERT INTO [asignacion_condiciones_piloto] (idFiltro, columna, condicional, valor) VALUES (@idFiltro, @columna, @condicion, @valor); SELECT SCOPE_IDENTITY() AS id';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            logAccion(req.session.username, 'NuevoCondicion: ' + idFiltro);
            res.send('ok').status(200);
        });
    });

    app.post('/eliminaFiltro', function (req, res) {
        let id = req.body.id;

        const request = new sql.Request(pool);

        request.input('id', sql.Int, id);

        const query = 'DELETE FROM [asignacion_filtros_piloto] WHERE id = @id';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            logAccion(req.session.username, 'EliminaFiltro: ' + id);
            res.send('ok').status(200);
        });
    });

    app.post('/eliminaCondicion', function (req, res) {
        let id = req.body.id;

        const request = new sql.Request(pool);

        request.input('id', sql.Int, id);

        const query = 'DELETE FROM [asignacion_condiciones_piloto] WHERE id = @id';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            logAccion(req.session.username, 'EliminaCondicion: ' + id);
            res.send('ok').status(200);
        });
    });

    app.post('/drillDownFiltroLimpieza', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let id = req.body.id;

            const request = new sql.Request(pool);

            request.input('idActividad', sql.Int, id);

            let query = 'SELECT * FROM [asignacion_filtros_piloto] WHERE idActividad = @idActividad';

            request.query(query, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send('error').status(200);
                }

                let filtros = [];

                for (let i = 0; i < results.recordset.length; i++) {
                    let filtro = {
                        Id: results.recordset[i].id,
                        Numero: results.recordset[i].numero,
                        Descripcion: results.recordset[i].descripcionFiltro,
                    };

                    filtros.push(filtro);
                }

                res.send(filtros).status(200);
            });
        }
    });

    app.post('/eliminaFiltroLimpieza', function (req, res) {
        let id = req.body.id;

        const request = new sql.Request(pool);

        request.input('id', sql.Int, id);

        const query = 'DELETE FROM asignacion_actividades_piloto WHERE id = @id';

        request.query(query, (error, results) => {
            if (error) {
                console.log(error);
                res.send('error').status(200);
                return;
            }

            res.send('ok').status(200);
        });
    });

    app.post('/drillDownFiltro', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let id = req.body.id;

            const request = new sql.Request(pool);

            request.input('idFiltro', sql.Int, id);

            let query = 'SELECT * FROM [asignacion_condiciones_piloto] WHERE idFiltro = @idFiltro';

            request.query(query, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send('error').status(200);
                }

                let condiciones = [];

                for (let i = 0; i < results.recordset.length; i++) {
                    let condicion = {
                        Id: results.recordset[i].id,
                        Columna: results.recordset[i].columna,
                        Condicion: results.recordset[i].condicional,
                        Valor: results.recordset[i].valor,
                    };

                    condiciones.push(condicion);
                }

                res.send(condiciones).status(200);
            });
        }
    });

    app.post('/reasignaOrden', function (req, res) {
        let orden = req.body.orden;

        const request = new sql.Request(pool);

        request.input('orden', sql.VarChar, orden);

        const query = 'UPDATE [masterTableAsignaciones] SET [statusProcesadoRobotValidador] = 5 WHERE numeroOrden = @orden';

        request.query(query, (err, rows) => {
            if (!err) {
                if (rows.rowsAffected[0] > 0) {
                    logAccion(req.session.username, 'ReasignaOrden: ' + orden);
                    res.send('ok').status(200);
                } else res.send('no').status(200);
            } else res.send('error').status(200);

            return;
        });

        request.on('error', (err) => {
            res.send('error').status(200);

            console.log('Error en la conexion');
            return;
        });
    });

    var cpUploadLimpiaOrdenes = upload.fields([{ name: 'limpiaOrdenes', maxCount: 1 }]);

    app.post('/limpiaOrdenes', function (req, res) {
        let schema = {
            ORDENES: {
                prop: 'orden',
                type: String,
            },
        };
        cpUploadLimpiaOrdenes(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                if (err.message == 'File too large') res.send('tamañoArchivo').status(400);
                else res.send('errorCarga').status(400);
            } else if (err) res.send('errorTipoArchivo').status(400);
            else {
                if (Object.keys(req.files).length > 0) {
                    // Verificamos que se escogió un archivo
                    var archivo = '';

                    if (fs.existsSync('public/uploads/limpiaOrdenes.xls')) archivo = 'public/uploads/limpiaOrdenes.xls';
                    else if (fs.existsSync('public/uploads/limpiaOrdenes.xlsx')) archivo = 'public/uploads/limpiaOrdenes.xlsx';

                    if (archivo != '') {
                        readExcel(archivo, { schema }).then(({ rows, errors }) => {
                            if (errors.length > 0) console.log(errors);
                            else {
                                if (rows.length > 0) {
                                    async.eachSeries(
                                        rows,
                                        (row, callbackAsync) => {
                                            let orden = row.orden;

                                            const request = new sql.Request(pool);

                                            request.input('orden', sql.VarChar, orden);

                                            const query = 'UPDATE [masterTableAsignaciones] SET [statusProcesadoRobotValidador] = 500 WHERE numeroOrden = @orden';

                                            request.query(query, (err, result) => {
                                                if (!err) callbackAsync();
                                                else {
                                                    console.log(err);
                                                    callbackAsync();
                                                }
                                            });

                                            request.on('error', (err) => {
                                                console.log(err);
                                                callbackAsync();
                                            });
                                        },
                                        function () {
                                            fs.unlink(archivo, (err) => {
                                                if (err) throw err;
                                            });

                                            logAccion(req.session.username, 'LimpiaOrden');

                                            res.redirect('/validadores');
                                            return;
                                        }
                                    );
                                }
                            }
                        });
                    } else res.redirect('/validadores');
                } else res.send('archivoVacio').status(400);
            }
        });
    });

    app.post('/excelLiberadasPendientes', function (req, res) {
        //----------Modificaciones de reportes---------
        let cuentas = [];

        const request = new sql.Request(pool);

        //#Valor insertado
        const query = 'Select numeroCuenta,numeroOrden,idValidador,fechaAsignacionAgenteValidador,fechaLiberacionAgenteValidador from masterTableAsignaciones where procesada=1 and trabajada=0 order by fechaLiberacionAgenteValidador';

        request.query(query, (err, result) => {
            if (!err) {
                const rows = result.recordset;

                for (i = 0; i < rows.length; i++) {
                    let dataRow = [];
                    dataRow.push(rows[i].numeroCuenta);
                    dataRow.push(rows[i].numeroOrden);
                    dataRow.push(rows[i].idValidador);
                    dataRow.push(rows[i].fechaAsignacionAgenteValidador.toISOString());
                    dataRow.push(rows[i].fechaLiberacionAgenteValidador.toISOString());

                    cuentas.push(dataRow);
                }

                let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                let ws = wb.addWorksheet('Reporte');

                ws.cell(1, 1).string('Número de cuenta');
                ws.cell(1, 2).string('Número de orden');
                ws.cell(1, 3).string('Validador');
                ws.cell(1, 4).string('Fecha de asignación');
                ws.cell(1, 5).string('Fecha de liberación');

                for (x = 0; x < cuentas.length; x++) {
                    ws.cell(x + 2, 1).string(cuentas[x][0]);
                    ws.cell(x + 2, 2).string(cuentas[x][1]);
                    ws.cell(x + 2, 3).string(cuentas[x][2]);
                    ws.cell(x + 2, 4).string(cuentas[x][3].toString());
                    ws.cell(x + 2, 5).string(cuentas[x][4].toString());
                }

                wb.write('public/ReporteLiberadasPendientes.xlsx');

                setTimeout(() => {
                    res.status(200).send('OK');
                }, 2000);
            } else {
                console.log('Error en la conexion al ejecutar query en excelLiberadasPendientes');
                return;
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en excelLiberadasPendientes');
            res.status(200).send('error');
        });
    });

    app.post('/excelPorAsignar', function (req, res) {
        let cuentas = [];

        //#Valor insertado
        const query = 'SELECT numeroOrden,tipo,actividad,numeroCuenta,fechaCreacionSiebel,fechaSolicitadaSiebel,horaDeExportacion,statusProcesadoRobotValidador,cobertura,sipreIDCercano from masterTableAsignaciones where statusProcesadoRobotValidador in (5, 401)';

        const request = new sql.Request(pool);

        request.query(query, (err, result) => {
            if (!err) {
                const rows = result.recordset;

                for (i = 0; i < rows.length; i++) {
                    let dataRow = [];
                    dataRow.push(rows[i].numeroOrden);
                    dataRow.push(rows[i].numeroCuenta);
                    dataRow.push(rows[i].actividad);
                    dataRow.push(rows[i].fechaCreacionSiebel);
                    dataRow.push(rows[i].fechaSolicitadaSiebel);
                    rows[i].statusProcesadoRobotValidador == 5 ? dataRow.push('Sí') : dataRow.push('No');

                    if (rows[i].cobertura == 'SI' || rows[i].cobertura == 'NO' || rows[i].cobertura == 'SI_AR') dataRow.push('SipreId Exacto');
                    else {
                        if ((rows[i].cobertura == 'NO_SE' && (rows[i].sipreIdCercano == 'NO ENCONTRADO' || rows[i].sipreIdCercano == '')) || rows[i].cobertura == 'NO_ENCONTRADO') dataRow.push('SipreId No Encontrado');
                        else dataRow.push('SipreId Cercano');
                    }

                    cuentas.push(dataRow);
                }

                let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                let ws = wb.addWorksheet('Reporte');

                ws.cell(1, 1).string('Número de orden');
                ws.cell(1, 2).string('Número de cuenta');
                ws.cell(1, 3).string('Actividad');
                ws.cell(1, 4).string('Fecha de creación');
                ws.cell(1, 5).string('Fecha solicitada');
                ws.cell(1, 6).string('Validada por robot');
                ws.cell(1, 7).string('Tipo Orden');

                for (x = 0; x < cuentas.length; x++) {
                    ws.cell(x + 2, 1).string(cuentas[x][0]);
                    ws.cell(x + 2, 2).string(cuentas[x][1]);
                    ws.cell(x + 2, 3).string(cuentas[x][2]);
                    ws.cell(x + 2, 4).string(cuentas[x][3]);
                    ws.cell(x + 2, 5).string(cuentas[x][4]);
                    ws.cell(x + 2, 6).string(cuentas[x][5]);
                    ws.cell(x + 2, 7).string(cuentas[x][6]);
                }

                wb.write('public/ReportePorAsignar.xlsx');

                setTimeout(() => {
                    res.status(200).send('OK');
                }, 2000);
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en excelPorAsignar');
            res.status(200).send('error');
        });
    });

    app.post('/excelAsignadas', function (req, res) {
        let fechaIni = req.body.fechaIni + ' 00:00:00';
        let fechaFin = req.body.fechaFin + ' 23:59:59';

        let query = '';
        let ordenes = [];

        const request = new sql.Request(pool);

        request.input('fechaIni', sql.VarChar, fechaIni);
        request.input('fechaFin', sql.VarChar, fechaFin);

        //*Valor insertado
        query = 'Select a.numeroCuenta,a.numeroOrden,a.idValidador,a.fechaAsignacionAgenteValidador,';
        query += 'a.fechaLiberacionAgenteValidador,a.procesada,a.sinRobot,a.trabajada,b1.FechaOrden, ';
        query += 'b1.[Estado], b1.EstadoAdmision,b1.[Comentarios],a.nombreAgenteValidador ';
        query += 'from masterTableAsignaciones a ';
        query += 'CROSS APPLY (SELECT * FROM [registrosParaAsignarCambioSegmentosHistorico_v2] b WHERE a.numeroOrden = b.NumeroOrden) b1 ';
        query += 'WHERE fechaAsignacionAgenteValidador BETWEEN @fechaIni AND @fechaFin ';
        query += 'order by fechaAsignacionAgenteValidador desc';

        request.query(query, (err, result) => {
            if (!err) {
                const rows = result.recordset;

                for (i = 0; i < rows.length; i++) {
                    let dataRow = [];
                    dataRow.push(rows[i].numeroOrden);
                    dataRow.push(rows[i].numeroCuenta.toString());
                    dataRow.push(rows[i].idValidador);
                    dataRow.push(rows[i].fechaAsignacionAgenteValidador);

                    if (rows[i].fechaLiberacionAgenteValidador != null) dataRow.push(rows[i].fechaLiberacionAgenteValidador);
                    else dataRow.push(null);

                    if (rows[i].procesada == 1) dataRow.push('Si');
                    else dataRow.push('No');

                    if (rows[i].trabajada == 1) dataRow.push('Si');
                    else dataRow.push('No');

                    dataRow.push(rows[i]['FechaOrden']);
                    dataRow.push(rows[i]['Estado']);
                    dataRow.push(rows[i]['EstadoAdmision']);
                    dataRow.push(rows[i]['Comentarios']);
                    dataRow.push(rows[i]['nombreAgenteValidador']);

                    ordenes.push(dataRow);
                }

                let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                let ws = wb.addWorksheet('Reporte');

                ws.cell(1, 1).string('Número de orden');
                ws.cell(1, 2).string('Número de cuenta');
                ws.cell(1, 3).string('Validador');
                ws.cell(1, 4).string('Fecha de asignación');
                ws.cell(1, 5).string('Fecha de liberación');
                ws.cell(1, 6).string('Procesada');
                ws.cell(1, 7).string('Trabajada');
                ws.cell(1, 8).string('Fecha de la orden');
                ws.cell(1, 9).string('Estado de la orden');
                ws.cell(1, 10).string('Estado Admisión');
                ws.cell(1, 11).string('Comentarios');
                ws.cell(1, 12).string('Nombre validador');

                for (x = 0; x < ordenes.length; x++) {
                    if (ordenes[x][3]) {
                        if(dateTime.format(ordenes[x][3], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(ordenes[x][3], 'HH') == '01') {
                            ordenes[x][3] = dateTime.addHours(ordenes[x][3], 0);
                        }
                        else if (dateTime.format(dateTime.addDays(ordenes[x][3], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(ordenes[x][3], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            ordenes[x][3] = dateTime.addHours(ordenes[x][3], 1);
                        }
                        ordenes[x][3] = dateTime.addSeconds(ordenes[x][3], 1);
                        ordenes[x][3] = dateTime.format(ordenes[x][3], 'YYYY/MM/DD HH:mm:ss');
                    }

                    if (ordenes[x][4]) {
                        if(dateTime.format(ordenes[x][4], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(ordenes[x][4], 'HH') == '01') {
                            ordenes[x][4] = dateTime.addHours(ordenes[x][4], 0);
                        }
                        else if (dateTime.format(dateTime.addDays(ordenes[x][4], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(ordenes[x][4], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            ordenes[x][4] = dateTime.addHours(ordenes[x][4], 1);
                        }
                        ordenes[x][4] = dateTime.addSeconds(ordenes[x][4], 1);
                        ordenes[x][4] = dateTime.format(ordenes[x][4], 'YYYY/MM/DD HH:mm:ss');
                    }

                    ws.cell(x + 2, 1).string(ordenes[x][0]);
                    ws.cell(x + 2, 2).string(ordenes[x][1]);
                    ws.cell(x + 2, 3).string(ordenes[x][2]);
                    ws.cell(x + 2, 4).date(ordenes[x][3]);
                    ws.cell(x + 2, 5).date(ordenes[x][4]);
                    ws.cell(x + 2, 6).string(ordenes[x][5]);
                    ws.cell(x + 2, 7).string(ordenes[x][6]);
                    ws.cell(x + 2, 8).string(ordenes[x][7]);
                    ws.cell(x + 2, 9).string(ordenes[x][8]);
                    ws.cell(x + 2, 10).string(ordenes[x][9] ? ordenes[x][9] : ''); //A veces es null y manda error
                    ws.cell(x + 2, 11).string(ordenes[x][10] ? ordenes[x][10] : ''); //Tambien puede ser null
                    ws.cell(x + 2, 12).string(ordenes[x][11]);
                }

                wb.write('public/ReporteAsignado.xlsx');

                setTimeout(() => {
                    res.status(200).send('OK');
                }, 2000);
            } else {
                console.log(err);
                console.log('Error en la conexion al ejecutar query en excelAsignadas');
                return;
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en excelAsignadas');
            res.status(200).send('error');
        });
    });

    app.post('/excelInfoAsignadas', function (req, res) {
        let fechaIni = req.body.fechaIni + ' 00:00:00';
        let fechaFin = req.body.fechaFin + ' 23:59:59';

        let query = '';
        let ordenes = [];

        const request = new sql.Request(pool);

        request.input('fechaIni', sql.VarChar, fechaIni);
        request.input('fechaFin', sql.VarChar, fechaFin);

        //#Valor insertado

        query = "select isNull(nombreAgenteValidador,'') as nombreAgenteValidador, a.numeroCuenta, a.numeroOrden,idValidador,fechaAsignacionAgenteValidador,fechaLiberacionAgenteValidador,procesada,sinRobot,trabajada, ";
        query += "fechaCreacionSiebel,fechaSolicitadaSiebel,isNull(cobertura,'') as cobertura,duplicadoTelefonos,duplicadoCorreos, ";
        query += "isNull(correoValido,'') as correoValido,sipreID,sipreIDCercano,distanciaSipreIDCercano,isNull(emailCliente,'') as emailCliente,isNull(direccionCliente,'') as direccionCliente,isNull(comentarios,'') as comentarios, isNull(b1.statusDescarga, 0) as statusDescarga, ";
        query += 'substring(documentos, 1, 1) As "documentosRD" ';
        query += 'from masterTableAsignaciones a ';
        query += 'outer apply (select top 1 * from rendimientoRobotsDocumentos b where a.numeroOrden = b.numeroOrden ORDER BY id DESC) b1 ';
        query += 'where fechaAsignacionAgenteValidador BETWEEN  @fechaIni and @fechaFin ';
        query += 'order by fechaAsignacionAgenteValidador desc';

        request.query(query, (err, result) => {
            if (!err) {
                const rows = result.recordset;

                for (i = 0; i < rows.length; i++) {
                    let dataRow = [];
                    let sipreId = rows[i].sipreID ? rows[i].sipreID : '';

                    dataRow.push(rows[i].nombreAgenteValidador);
                    dataRow.push(rows[i].numeroOrden);
                    dataRow.push(rows[i].numeroCuenta.toString());
                    dataRow.push(rows[i].idValidador);
                    dataRow.push(rows[i].fechaAsignacionAgenteValidador);

                    dataRow.push(rows[i].fechaLiberacionAgenteValidador);

                    if (rows[i].procesada === 1) dataRow.push('Si');
                    else dataRow.push('No');

                    if (rows[i].sinRobot === 1) dataRow.push('Si');
                    else dataRow.push('No');

                    dataRow.push(rows[i].fechaCreacionSiebel.toString());
                    dataRow.push(rows[i].fechaCreacionSiebel.toString());

                    switch (rows[i].cobertura) {
                        case 'SI':
                            dataRow.push('Si');
                            break;

                        case 'NO':
                            dataRow.push('No');
                            break;

                        case 'SI_AR':
                            dataRow.push('Alto Riesgo');
                            break;

                        case 'NO_SE':
                        case 'NO_ENCONTRADO':
                            if (sipreId.includes('DUMMY')) dataRow.push('Dummy');
                            else dataRow.push('Sin busqueda');
                            break;

                        default:
                            dataRow.push('Sin busqueda');
                    }

                    if (rows[i].duplicadoTelefonos === 1) dataRow.push('Si');
                    else dataRow.push('No');

                    if (rows[i].duplicadoCorreos === 1) dataRow.push('Si');
                    else dataRow.push('No');

                    dataRow.push(sipreId);
                    dataRow.push(rows[i].sipreIDCercano);
                    dataRow.push(rows[i].distanciaSipreIDCercano);
                    dataRow.push(rows[i].emailCliente);
                    dataRow.push(rows[i].direccionCliente);
                    dataRow.push(rows[i].comentarios);

                    if (rows[i].statusDescarga === 5 && rows[i].documentosRD != 'S') dataRow.push('Si');
                    else dataRow.push('No');

                    ordenes.push(dataRow);
                }

                let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                let ws = wb.addWorksheet('Reporte');

                ws.cell(1, 1).string('Nombre validador');
                ws.cell(1, 2).string('Número de orden');
                ws.cell(1, 3).string('Número de cuenta');
                ws.cell(1, 4).string('Validador');
                ws.cell(1, 5).string('Fecha de asignación');
                ws.cell(1, 6).string('Fecha de liberación');
                ws.cell(1, 7).string('Procesada');
                ws.cell(1, 8).string('Máximo Intentos');
                ws.cell(1, 9).string('Fecha Creado');
                ws.cell(1, 10).string('Fecha Solicitada');
                ws.cell(1, 11).string('Cobertura');
                ws.cell(1, 12).string('Duplicada por Teléfono');
                ws.cell(1, 13).string('Duplicada por Correo');
                ws.cell(1, 14).string('SipreID');
                ws.cell(1, 15).string('SipreID Cercano');
                ws.cell(1, 16).string('Distancia SipreID Cercano');
                ws.cell(1, 17).string('Email');
                ws.cell(1, 18).string('Dirección');
                ws.cell(1, 19).string('Comentarios');
                ws.cell(1, 20).string('Documentos');

                for (x = 0; x < ordenes.length; x++) {
                    if (ordenes[x][4]) {
                        if(dateTime.format(ordenes[x][4], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(ordenes[x][4], 'HH') == '01') {
                            ordenes[x][4] = dateTime.addHours(ordenes[x][4], 0);
                        }
                        else if (dateTime.format(dateTime.addDays(ordenes[x][4], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(ordenes[x][4], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            ordenes[x][4] = dateTime.addHours(ordenes[x][4], 1);
                        }
                        ordenes[x][4] = dateTime.addSeconds(ordenes[x][4], 1);
                        ordenes[x][4] = dateTime.format(ordenes[x][4], 'YYYY/MM/DD HH:mm:ss');
                    }

                    if (ordenes[x][5]) {
                        if(dateTime.format(ordenes[x][5], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(ordenes[x][5], 'HH') == '01') {
                            ordenes[x][5] = dateTime.addHours(ordenes[x][5], 0);
                        }
                        else if (dateTime.format(dateTime.addDays(ordenes[x][5], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(ordenes[x][5], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            ordenes[x][5] = dateTime.addHours(ordenes[x][5], 1);
                        }
                        ordenes[x][5] = dateTime.addSeconds(ordenes[x][5], 1);
                        ordenes[x][5] = dateTime.format(ordenes[x][5], 'YYYY/MM/DD HH:mm:ss');
                    }
                    // if (ordenes[x][0] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][1] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][2] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][3] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][4] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][5] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][6] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][7] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][8] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][9] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][10] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][11] == null) {
                    //     console.log('aqui');
                    // }
                    // if (ordenes[x][19] == null) {
                    //     console.log('aqui');
                    // }
                    ws.cell(x + 2, 1).string(ordenes[x][0]);
                    ws.cell(x + 2, 2).string(ordenes[x][1]);
                    ws.cell(x + 2, 3).string(ordenes[x][2]);
                    ws.cell(x + 2, 4).string(ordenes[x][3]);
                    ws.cell(x + 2, 5).date(ordenes[x][4]);
                    ws.cell(x + 2, 6).date(ordenes[x][5]);
                    ws.cell(x + 2, 7).string(ordenes[x][6]);
                    ws.cell(x + 2, 8).string(ordenes[x][7]);
                    ws.cell(x + 2, 9).string(ordenes[x][8]);
                    ws.cell(x + 2, 10).string(ordenes[x][9]);
                    ws.cell(x + 2, 11).string(ordenes[x][10]);
                    ws.cell(x + 2, 12).string(ordenes[x][11]);
                    ws.cell(x + 2, 13).string(ordenes[x][12] ? ordenes[x][12] : '');
                    ws.cell(x + 2, 14).string(ordenes[x][13] ? ordenes[x][13] : '');
                    ws.cell(x + 2, 15).string(ordenes[x][14] ? ordenes[x][14] : '');
                    ws.cell(x + 2, 16).number(ordenes[x][15] ? ordenes[x][15] : 0);
                    ws.cell(x + 2, 17).string(ordenes[x][16] ? ordenes[x][16] : '');
                    ws.cell(x + 2, 18).string(ordenes[x][17] ? ordenes[x][17] : '');
                    ws.cell(x + 2, 19).string(ordenes[x][18] ? ordenes[x][18] : '');
                    ws.cell(x + 2, 20).string(ordenes[x][19]);
                }

                wb.write('public/ReporteInfoAsignado.xlsx', (error, stats) => {
                    if (error) {
                        console.error(error);
                    }
                    res.status(200).send('OK');
                });

                // setTimeout(() => {
                //   res.status(200).send("OK");
                // }, 2000);
            } else {
                console.log(err);
                console.log('Error en la conexion al ejecutar query en excelInfoAsignadas');
                return;
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en excelInfoAsignadas');
            res.status(200).send('error');
        });
    });

    app.post('/excelSinTrabajar', function (req, res) {
        let fechaIni = req.body.fechaIni.replace(/-/g, '');
        let fechaFin = req.body.fechaFin.replace(/-/g, '');

        let query = '';
        let ordenes = [];

        const request = new sql.Request(pool);

        request.input('fechaIni', sql.VarChar, fechaIni);
        request.input('fechaFin', sql.VarChar, fechaFin);
        //#Valor insertado-->Pendiente de finalizar con tabla  que tiene ids

        query = 'SELECT  a.numeroCuenta as cuenta, a.numeroOrden as orden, a.validador , ';
        query += 'a.fechaAsignacion as fechaAsigna, a.sinRobot as noRobot, ';
        query += 'b.id,b.numeroCuenta,b.numeroOrden,b.idValidador,';
        query += 'b.fechaAsignacionAgenteValidador as fechaAsignacion, b.fechaLiberacionAgenteValidador as fechaLiberada,';
        query += 'b.procesada,b.sinRobot,b.trabajada ';
        query += 'FROM cuentasAsignadasHistorial a ';
        query += 'LEFT JOIN masterTableAsignaciones b ON a.numeroCuenta = b.numeroCuenta AND a.validador = b.idValidador ';
        query += 'WHERE CONVERT(VARCHAR, a.fechaAsignacion, 112) BETWEEN @fechaIni AND @fechaFin ';
        query += 'order by fechaAsigna desc';

        request.query(query, (err, result) => {
            if (!err) {
                var rows = result.recordset;

                for (i = 0; i < rows.length; i++) {
                    var dataRow = [];
                    dataRow.push(rows[i].cuenta.toString());
                    dataRow.push(rows[i].orden);
                    dataRow.push(rows[i].validador);

                    if (rows[i].fechaAsigna != null) {
                        if(dateTime.format(rows[i].fechaAsigna, 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(rows[i].fechaAsigna, 'HH') == '01') {
                            rows[i].fechaAsigna = dateTime.addHours(rows[i].fechaAsigna, 0);
                        }
                        else if (dateTime.format(dateTime.addDays(rows[i].fechaAsigna, 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(rows[i].fechaAsigna, '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            rows[i].fechaAsigna = dateTime.addHours(rows[i].fechaAsigna, 1);
                        }
                        rows[i].fechaAsigna = dateTime.addSeconds(rows[i].fechaAsigna, 1);
                        dataRow.push(dateTime.format(rows[i].fechaAsigna, 'YYYY/MM/DD HH:mm:ss'));
                    } else dataRow.push(null);

                    dataRow.push(rows[i].noRobot.toString());

                    if (rows[i].id != null) dataRow.push(rows[i].id.toString());
                    else dataRow.push(null);

                    if (rows[i].numeroCuenta != null) dataRow.push(rows[i].numeroCuenta.toString());
                    else dataRow.push(null);

                    dataRow.push(rows[i].numeroOrden);
                    dataRow.push(rows[i].idValidador);

                    if (rows[i].fechaAsignacion != null) {
                        // dataRow.push(rows[i].fechaAsignacion.toISOString())
                        if(dateTime.format(rows[i].fechaAsignacion, 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(rows[i].fechaAsignacion, 'HH') == '01') {
                            rows[i].fechaAsignacion = dateTime.addHours(rows[i].fechaAsignacion, 0);
                        }
                        else if (dateTime.format(dateTime.addDays(rows[i].fechaAsignacion, 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(rows[i].fechaAsignacion, '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            rows[i].fechaAsignacion = dateTime.addHours(rows[i].fechaAsignacion, 1);
                        }
                        rows[i].fechaAsignacion = dateTime.addSeconds(rows[i].fechaAsignacion, 1);
                        dataRow.push(dateTime.format(rows[i].fechaAsignacion, 'YYYY/MM/DD HH:mm:ss'));
                    } else dataRow.push(null);

                    if (rows[i].fechaLiberada != null) {
                        // dataRow.push(rows[i].fechaLiberada.toISOString())
                        if(dateTime.format(rows[i].fechaLiberada, 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(rows[i].fechaLiberada, 'HH') == '01') {
                            rows[i].fechaLiberada = dateTime.addHours(rows[i].fechaLiberada, 0);
                        }
                        else if (dateTime.format(dateTime.addDays(rows[i].fechaLiberada, 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(rows[i].fechaLiberada, '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                            rows[i].fechaLiberada = dateTime.addHours(rows[i].fechaLiberada, 1);
                        }
                        rows[i].fechaLiberada = dateTime.addSeconds(rows[i].fechaLiberada, 1);
                        dataRow.push(dateTime.format(rows[i].fechaLiberada, 'YYYY/MM/DD HH:mm:ss'));
                    } else dataRow.push(null);

                    if (rows[i].procesada != null) dataRow.push(rows[i].procesada.toString());
                    else dataRow.push(null);

                    if (rows[i].sinRobot != null) dataRow.push(rows[i].sinRobot.toString());
                    else dataRow.push(null);

                    if (rows[i].trabajada != null) dataRow.push(rows[i].trabajada.toString());
                    else dataRow.push(null);

                    ordenes.push(dataRow);
                }

                let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                let ws = wb.addWorksheet('Reporte');

                ws.cell(1, 1).string('Número de cuenta');
                ws.cell(1, 2).string('Número de orden');
                ws.cell(1, 3).string('Validador');
                ws.cell(1, 4).string('Fecha de asignación');
                ws.cell(1, 5).string('Sin Robot');
                ws.cell(1, 6).string('Id');
                ws.cell(1, 7).string('Número de cuenta');
                ws.cell(1, 8).string('Número de órden');
                ws.cell(1, 9).string('Validador');
                ws.cell(1, 10).string('Fecha de asignación');
                ws.cell(1, 11).string('Fecha de liberación');
                ws.cell(1, 12).string('Procesada');
                ws.cell(1, 13).string('Sin Robot');
                ws.cell(1, 14).string('Trabajada');

                for (x = 0; x < ordenes.length; x++) {
                    ws.cell(x + 2, 1).string(ordenes[x][0]);
                    ws.cell(x + 2, 2).string(ordenes[x][1]);
                    ws.cell(x + 2, 3).string(ordenes[x][2]);
                    ws.cell(x + 2, 4).date(ordenes[x][3]);
                    ws.cell(x + 2, 5).string(ordenes[x][4]);
                    ws.cell(x + 2, 6).string(ordenes[x][5] ? ordenes[x][5] : '');
                    ws.cell(x + 2, 7).string(ordenes[x][6] ? ordenes[x][6] : '');
                    ws.cell(x + 2, 8).string(ordenes[x][7] ? ordenes[x][7] : '');
                    ws.cell(x + 2, 9).string(ordenes[x][8] ? ordenes[x][8] : '');
                    ws.cell(x + 2, 10).date(ordenes[x][9]);
                    ws.cell(x + 2, 11).date(ordenes[x][10]);
                    ws.cell(x + 2, 12).string(ordenes[x][11] ? ordenes[x][11] : '');
                    ws.cell(x + 2, 13).string(ordenes[x][12] ? ordenes[x][12] : '');
                    ws.cell(x + 2, 14).string(ordenes[x][13] ? ordenes[x][13] : '');
                }

                wb.write('public/ReporteInfoSinTrabajar.xlsx', (err, stats) => {
                    if (err) {
                        console.log(err);
                        res.status(200).send('error');
                        return;
                    }
                    res.status(200).send('OK');
                });
            } else {
                console.log(err);
                console.log('Error en la conexion al ejecutar query en excelSinTrabajar');
                res.status(200).send('error');
            }
        });

        request.on('error', (err) => {
            console.log('Error en la conexion en excelSinTrabajar');
            res.status(200).send('error');
        });
    });

    app.get('/reportesRobot', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaArray = [];
            let estatusArray = [];
            let chartArray = [];
            let flag = 0;
            let x = 0;
            let cabeceraArray = [];
            let datosArray = [];
            let resultadoQuery = [];

            let query = `select CONVERT(varchar, horaDeExportacion, 23) as "dia",statusProcesadoRobotValidador as "status",count(numeroOrden) "ordenes" `;
            query += 'from masterTableAsignaciones ';
            query += 'where horaDeExportacion between CONVERT(varchar, DATEADD(day, -7, getdate()), 20) ';
            query += 'and CONVERT(varchar, getdate(), 20) ';
            query += 'group by CONVERT(varchar, horaDeExportacion, 23),statusProcesadoRobotValidador ';
            query += 'order by dia';

            const request = new sql.Request(pool);

            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error en la consulta en reportesRobot');
                    res.status(200).send('error');
                    return;
                } else {
                    const rows = result.recordset;

                    if (rows.length > 0) {
                        for (i = 0; i < rows.length; i++) {
                            resultadoQuery.push({
                                Fecha: rows[i].dia,
                                Estatus: rows[i].status,
                                Ordenes: rows[i].ordenes,
                            });

                            fechaArray.indexOf(rows[i].dia) === -1 ? fechaArray.push(rows[i].dia) : (x = 1);
                            estatusArray.indexOf(rows[i].status) === -1 ? estatusArray.push(rows[i].status) : (x = 1);
                        }

                        cabeceraArray.push('Dia');

                        for (i = 0; i < estatusArray.length; i++) {
                            let status = 'Sin status';
                            switch (estatusArray[i]) {
                                case 0:
                                    status = 'Por Procesar';
                                    break;

                                case 1:
                                    status = 'Por Asignar';
                                    break;

                                case 2:
                                    status = 'En Proceso';
                                    break;

                                case 3:
                                    status = 'En Proceso Documentos';
                                    break;

                                case 4:
                                    status = 'Asignada';
                                    break;

                                case 5:
                                    status = 'Por Asignar con Documentos';
                                    break;

                                case 400:
                                    status = 'Máximo Intentos';
                                    break;

                                case 401:
                                    status = 'Máximo Intentos Documentos';
                                    break;

                                case 500:
                                    status = 'No Procesada';
                                    break;
                            }
                            cabeceraArray.push(status);
                        }

                        for (i = 0; i < fechaArray.length; i++) {
                            let datosRow = [];
                            datosRow.push(fechaArray[i]);

                            for (j = 0; j < estatusArray.length; j++) {
                                flag = 0;

                                for (k = 0; k < resultadoQuery.length; k++) {
                                    if (resultadoQuery[k].Fecha == fechaArray[i] && resultadoQuery[k].Estatus == estatusArray[j]) {
                                        datosRow.push(resultadoQuery[k].Ordenes);
                                        flag = 1;
                                        break;
                                    }
                                }

                                if (flag == 0) datosRow.push(0);
                            }

                            datosArray.push(datosRow);
                        }

                        chartArray.push(cabeceraArray);

                        for (i = 0; i < datosArray.length; i++) {
                            chartArray.push(datosArray[i]);
                        }
                    } else {
                        chartArray = [['Dia', 'Por Procesar', 'Por asignar', 'En proceso', 'En Proceso Documentos', 'Asignada', 'Por Asignar con Documentos', 'Máximo Intentos', 'Máximo Intentos Documentos', 'No Procesada']];

                        let date = new Date();
                        date = new Date(date.getTime() - date.getTimezoneOffset() * 1000 * 60);
                        for (let i = 0; i < 7; i++) {
                            chartArray.push([date.toISOString().split('T')[0].replace(/-/g, ''), 0, 0, 0, 0, 0, 0]);

                            date.setDate(date.getDate() - 1);
                        }
                    }

                    res.render('reporteRobot', {
                        title: 'Reporte ordenes robot',
                        chartArray: JSON.stringify(chartArray),
                        botoncito: 'Validadores  ',
                    });
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesRobot');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.post('/reportesRobotFecha', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaIni = req.body.fechaIni.replace(/-/g, '');
            let fechaFin = req.body.fechaFin.replace(/-/g, '');
            let estatusPickerValue = req.body.estatus;

            let fechaArray = [];
            let estatusArray = [];
            let chartArray = [];
            let flag = 0;
            let x = 0;
            let cabeceraArray = [];
            let datosArray = [];
            let resultadoQuery = [];

            let query = `select CONVERT(varchar, horaDeExportacion, 23) as "dia",statusProcesadoRobotValidador as "status",count(numeroOrden) "ordenes" `;
            query += 'from masterTableAsignaciones ';
            query += 'where horaDeExportacion ';
            query += 'between @fechaIni AND @fechaFin ';
            query += 'group by CONVERT(varchar, horaDeExportacion, 23),statusProcesadoRobotValidador ';
            query += 'order by dia';

            const request = new sql.Request(pool);
            request.input('fechaIni', sql.VarChar, fechaIni);
            request.input('fechaFin', sql.VarChar, fechaFin);


            request.query(query, (err, resultq) => {
                if (err) {
                    console.log('Error en la consulta en reportesRobotFecha');
                    res.status(200).send('error');
                    return;
                } else {
                    let result = resultq.recordset;

                    if (result.length > 0) {
                        let rows = [];

                        if (estatusPickerValue !== 'todas') {
                            for (let i = 0; i < result.length; i++) {
                                if (result[i].status == estatusPickerValue) rows.push(result[i]);
                            }
                        } else rows = result;

                        if (rows.length > 0) {
                            for (i = 0; i < rows.length; i++) {
                                resultadoQuery.push({
                                    Fecha: rows[i].dia,
                                    Estatus: rows[i].status,
                                    Ordenes: rows[i].ordenes,
                                });

                                fechaArray.indexOf(rows[i].dia) === -1 ? fechaArray.push(rows[i].dia) : (x = 1);
                                estatusArray.indexOf(rows[i].status) === -1 ? estatusArray.push(rows[i].status) : (x = 1);
                            }

                            cabeceraArray.push('Dia');

                            for (i = 0; i < estatusArray.length; i++) {
                                let status = 'Sin status';
                                switch (estatusArray[i]) {
                                    case 0:
                                        status = 'Por Procesar';
                                        break;

                                    case 1:
                                        status = 'Por Asignar';
                                        break;

                                    case 2:
                                        status = 'En Proceso';
                                        break;

                                    case 3:
                                        status = 'En Proceso Documentos';
                                        break;

                                    case 4:
                                        status = 'Asignada';
                                        break;

                                    case 5:
                                        status = 'Por Asignar con Documentos';
                                        break;

                                    case 400:
                                        status = 'Máximo Intentos';
                                        break;

                                    case 401:
                                        status = 'Máximo Intentos Documentos';
                                        break;

                                    case 500:
                                        status = 'No Procesada';
                                        break;
                                }
                                cabeceraArray.push(status);
                            }

                            for (i = 0; i < fechaArray.length; i++) {
                                let datosRow = [];
                                datosRow.push(fechaArray[i]);

                                for (j = 0; j < estatusArray.length; j++) {
                                    flag = 0;

                                    for (k = 0; k < resultadoQuery.length; k++) {
                                        if (resultadoQuery[k].Fecha == fechaArray[i] && resultadoQuery[k].Estatus == estatusArray[j]) {
                                            datosRow.push(resultadoQuery[k].Ordenes);
                                            flag = 1;
                                            break;
                                        }
                                    }

                                    if (flag == 0) datosRow.push(0);
                                }

                                datosArray.push(datosRow);
                            }

                            chartArray.push(cabeceraArray);

                            for (i = 0; i < datosArray.length; i++) {
                                chartArray.push(datosArray[i]);
                            }
                        } else {
                            chartArray = [['Dia', 'Por Procesar', 'Por asignar', 'En proceso', 'En Proceso Documentos', 'Asignada', 'Por Asignar con Documentos', 'Máximo Intentos', 'Máximo Intentos Documentos', 'No Procesada']];

                            let date = new Date();
                            date = new Date(date.getTime() - date.getTimezoneOffset() * 1000 * 60);

                            for (let i = 0; i < 7; i++) {
                                chartArray.push([date.toISOString().split('T')[0].replace(/-/g, ''), 0, 0, 0, 0, 0, 0]);

                                date.setDate(date.getDate() - 1);
                            }
                        }
                    } else {
                        chartArray = [['Dia', 'Por Procesar', 'Por asignar', 'En proceso', 'En Proceso Documentos', 'Asignada', 'Por Asignar con Documentos', 'Máximo Intentos', 'Máximo Intentos Documentos', 'No Procesada']];

                        let date = new Date();
                        date = new Date(date.getTime() - date.getTimezoneOffset() * 1000 * 60);

                        for (let i = 0; i < 7; i++) {
                            chartArray.push([date.toISOString().split('T')[0].replace(/-/g, ''), 0, 0, 0, 0, 0, 0]);

                            date.setDate(date.getDate() - 1);
                        }
                    }
                    res.send(chartArray).status(200);
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesRobotFecha');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.post('/reportesRobotMes', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaArray = [];
            let estatusArray = [];
            let chartArray = [];
            let flag = 0;
            let x = 0;
            let cabeceraArray = [];
            let datosArray = [];
            let resultadoQuery = [];

            const request = new sql.Request(pool);

            let query = `select concat(year(horaDeExportacion),'-',month(horaDeExportacion)) as "fecha",`;
            query += `statusProcesadoRobotValidador as "status",count(numeroOrden) "ordenes" `;
            query += 'from masterTableAsignaciones ';
            query += "group by concat(year(horaDeExportacion),'-',month(horaDeExportacion)), statusProcesadoRobotValidador";

            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error en la consulta en reportesRobotMes');
                    res.status(200).send('error');
                    return;
                } else {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        let month = rows[i].fecha.split('-')[1];
                        let year = rows[i].fecha.split('-')[0];

                        if (month < 10) rows[i].fecha = year + '-0' + month;

                        resultadoQuery.push({
                            Fecha: rows[i].fecha,
                            Estatus: rows[i].status,
                            Ordenes: rows[i].ordenes,
                        });

                        fechaArray.indexOf(rows[i].fecha) === -1 ? fechaArray.push(rows[i].fecha) : (x = 1);
                        estatusArray.indexOf(rows[i].status) === -1 ? estatusArray.push(rows[i].status) : (x = 1);
                    }

                    cabeceraArray.push('Mes');

                    for (i = 0; i < estatusArray.length; i++) {
                        let status = 'Sin status';
                        switch (estatusArray[i]) {
                            case 0:
                                status = 'Por Procesar';
                                break;

                            case 1:
                                status = 'Por Asignar';
                                break;

                            case 2:
                                status = 'En Proceso';
                                break;

                            case 3:
                                status = 'En Proceso Documentos';
                                break;

                            case 4:
                                status = 'Asignada';
                                break;

                            case 5:
                                status = 'Por Asignar con Documentos';
                                break;

                            case 400:
                                status = 'Máximo Intentos';
                                break;

                            case 401:
                                status = 'Máximo Intentos Documentos';
                                break;

                            case 500:
                                status = 'No Procesada';
                                break;
                        }
                        cabeceraArray.push(status);
                    }

                    for (i = 0; i < fechaArray.length; i++) {
                        let datosRow = [];
                        datosRow.push(fechaArray[i]);

                        for (j = 0; j < estatusArray.length; j++) {
                            flag = 0;

                            for (k = 0; k < resultadoQuery.length; k++) {
                                if (resultadoQuery[k].Fecha == fechaArray[i] && resultadoQuery[k].Estatus == estatusArray[j]) {
                                    datosRow.push(resultadoQuery[k].Ordenes);
                                    flag = 1;
                                    break;
                                }
                            }

                            if (flag == 0) datosRow.push(0);
                        }

                        datosArray.push(datosRow);
                    }

                    chartArray.push(cabeceraArray);

                    for (i = 0; i < datosArray.length; i++) {
                        chartArray.push(datosArray[i]);
                    }

                    res.send(chartArray).status(200);
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesRobotMes');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.post('/reportesRobotExcel', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaIni = req.body.fechaIni.replace(/-/g, '');
            let fechaFin = req.body.fechaFin.replace(/-/g, '');
            let estatusPickerValue = req.body.estatus; //#Problema-Siempre extrae todas

            let cuentas = [];
            let query = ''

            const request = new sql.Request(pool);
            request.input('fechaIni', sql.VarChar, fechaIni);
            request.input('fechaFin', sql.VarChar, fechaFin);
            request.input('status', sql.Int, parseInt(estatusPickerValue));
            // revisar estos querys
            if (estatusPickerValue == 'todas') {
                query = 'select id,numeroOrden,tipo,estado,numeroCuenta,fechaCreacionSiebel,fechaSolicitadaSiebel, ';
                query += 'horaDeExportacion,actividad,statusProcesadoRobotValidador ';
                query += 'from masterTableAsignaciones ';
                query += 'where CONVERT(varchar,horaDeExportacion,112) ';
                query += 'BETWEEN @fechaIni AND @fechaFin order by id';
            } else {
                query = 'select id,numeroOrden,tipo,estado,numeroCuenta,fechaCreacionSiebel,fechaSolicitadaSiebel, ';
                query += 'horaDeExportacion,actividad,statusProcesadoRobotValidador ';
                query += 'from masterTableAsignaciones ';
                query += 'where statusProcesadoRobotValidador = @status AND ';
                query += '(CONVERT(varchar,horaDeExportacion,112) ';
                query += 'BETWEEN @fechaIni AND @fechaFin) order by id';
            }

            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error en la consulta en reportesRobotExcel');
                    res.status(200).send('error');
                    return;
                } else {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        let estatus = 'Sin estatus';
                        let dataRow = [];

                        dataRow.push(rows[i].id);
                        dataRow.push(rows[i].numeroOrden);
                        dataRow.push(rows[i].tipo);
                        dataRow.push(rows[i].estado);
                        dataRow.push(rows[i].numeroCuenta);
                        dataRow.push(rows[i].fechaCreacionSiebel);
                        dataRow.push(rows[i].fechaSolicitadaSiebel);
                        dataRow.push(rows[i].horaDeExportacion);
                        dataRow.push(rows[i].actividad);

                        switch (rows[i].statusProcesadoRobotValidador) {
                            case 0:
                                status = 'Por Procesar';
                                break;

                            case 1:
                                status = 'Por Asignar';
                                break;

                            case 2:
                                status = 'En Proceso';
                                break;

                            case 3:
                                status = 'En Proceso Documentos';
                                break;

                            case 4:
                                status = 'Asignada';
                                break;

                            case 5:
                                status = 'Por Asignar con Documentos';
                                break;

                            case 400:
                                status = 'Máximo Intentos';
                                break;

                            case 401:
                                status = 'Máximo Intentos Documentos';
                                break;

                            case 500:
                                status = 'No Procesada';
                                break;
                        }

                        dataRow.push(status);

                        cuentas.push(dataRow);
                    }

                    let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                    let ws = wb.addWorksheet('Reporte');

                    ws.cell(1, 1).string('Id');
                    ws.cell(1, 2).string('Número de orden');
                    ws.cell(1, 3).string('Tipo');
                    ws.cell(1, 4).string('Estado');
                    ws.cell(1, 5).string('Número de cuenta');
                    ws.cell(1, 6).string('Fecha creación');
                    ws.cell(1, 7).string('Fecha solicitada');
                    ws.cell(1, 8).string('Hora asignación');
                    ws.cell(1, 9).string('Actividad');
                    ws.cell(1, 10).string('Estatus');

                    for (x = 0; x < cuentas.length; x++) {
                        if (cuentas[x][7]) {
                            if(dateTime.format(cuentas[x][7], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(cuentas[x][7], 'HH') == '01') {
                                cuentas[x][7] = dateTime.addHours(cuentas[x][7], 0);
                            }
                            else if (dateTime.format(dateTime.addDays(cuentas[x][7], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(cuentas[x][7], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                                cuentas[x][7] = dateTime.addHours(cuentas[x][7], 1);
                            }
                            cuentas[x][7] = dateTime.addSeconds(cuentas[x][7], 1);
                            cuentas[x][7] = dateTime.format(cuentas[x][7], 'YYYY/MM/DD HH:mm:ss');
                        }

                        ws.cell(x + 2, 1).number(cuentas[x][0]);
                        ws.cell(x + 2, 2).string(cuentas[x][1]);
                        ws.cell(x + 2, 3).string(cuentas[x][2]);
                        ws.cell(x + 2, 4).string(cuentas[x][3]);
                        ws.cell(x + 2, 5).string(cuentas[x][4]);
                        ws.cell(x + 2, 6).string(cuentas[x][5]);
                        ws.cell(x + 2, 7).string(cuentas[x][6]);
                        ws.cell(x + 2, 8).string(cuentas[x][7]);
                        ws.cell(x + 2, 9).string(cuentas[x][8]);
                        ws.cell(x + 2, 10).string(cuentas[x][9]);
                    }

                    wb.write('public/ReporteRobot.xlsx');

                    setTimeout(() => {
                        res.status(200).send('OK');
                    }, 3000);
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesRobotExcel');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.get('/reportesValidador', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaArray = [];
            let estatusArray = [];
            let chartArray = [];
            let flag = 0;
            let x = 0;
            let cabeceraArray = [];
            let datosArray = [];
            let resultadoQuery = [];

            let query = 'select CONVERT(varchar, fechaAsignacionAgenteValidador, 23) as "dia",procesada,count(numeroOrden) "ordenes" ';
            query += 'from masterTableAsignaciones ';
            query += 'where CONVERT(varchar, fechaAsignacionAgenteValidador, 112) ';
            query += 'between CONVERT(varchar, DATEADD(day, -7, GETDATE()), 112) ';
            query += 'and convert(varchar, GETDATE(), 112) ';
            query += 'group by CONVERT(varchar, fechaAsignacionAgenteValidador, 23),procesada ';
            query += 'order by dia';

            let request = new sql.Request(pool);

            request.query(query, (err, result) => {
                if (err) {
                    console.log(err);
                    console.log('Error en la consulta en reportesRobot');
                    res.status(200).send('error');
                    return;
                } else {
                    let rows = result.recordset;

                    if (rows.length > 0) {
                        for (i = 0; i < rows.length; i++) {
                            resultadoQuery.push({
                                Fecha: rows[i].dia,
                                Estatus: rows[i].procesada ? 1 : 0,
                                Ordenes: rows[i].ordenes,
                            });

                            fechaArray.indexOf(rows[i].dia) === -1 ? fechaArray.push(rows[i].dia) : (x = 1);
                            estatusArray.indexOf(rows[i].procesada) === -1 ? estatusArray.push(rows[i].procesada) : (x = 1);
                        }

                        cabeceraArray.push('Dia');

                        for (i = 0; i < estatusArray.length; i++) {
                            //let estatus = "Sin estatus";
                            /*
              switch (estatusArray[i]) {
                case 0:
                  estatus = "Por Procesar";
                  break;

                case 1:
                  estatus = "Procesada";
                  break;
              }*/
                            cabeceraArray.push(estatusArray[i] ? 'Procesada' : 'Por procesar');
                        }

                        for (i = 0; i < fechaArray.length; i++) {
                            let datosRow = [];
                            datosRow.push(fechaArray[i]);

                            for (j = 0; j < estatusArray.length; j++) {
                                flag = 0;

                                for (k = 0; k < resultadoQuery.length; k++) {
                                    if (resultadoQuery[k].Fecha == fechaArray[i] && resultadoQuery[k].Estatus == estatusArray[j]) {
                                        datosRow.push(resultadoQuery[k].Ordenes);
                                        flag = 1;
                                        break;
                                    }
                                }

                                if (flag == 0) datosRow.push(0);
                            }

                            datosArray.push(datosRow);
                        }

                        chartArray.push(cabeceraArray);

                        for (i = 0; i < datosArray.length; i++) {
                            chartArray.push(datosArray[i]);
                        }
                    } else {
                        chartArray = [['Dia', 'Procesada', 'Por procesar']];

                        let date = new Date();
                        date = new Date(date.getTime() - date.getTimezoneOffset() * 1000 * 60);

                        for (let i = 0; i < 7; i++) {
                            chartArray.push([date.toISOString().split('T')[0].replace(/-/g, ''), 0, 0]);

                            date.setDate(date.getDate() - 1);
                        }
                    }

                    query = 'SELECT DISTINCT idValidador as "validador" FROM masterTableAsignaciones ORDER BY validador ASC'; //cambiar

                    request.query(query, (err, result) => {
                        if (err) {
                            console.log('Error en la consulta en reportesRobot');
                            res.status(200).send('error');
                            return;
                        } else {
                            let nombresValidadores = result.recordset;
                            res.render('reporteValidador', {
                                title: 'Reporte ordenes validador',
                                chartArray: JSON.stringify(chartArray),
                                nombresValidadores: JSON.stringify(nombresValidadores),
                                botoncito: 'Validadores  ',
                            });
                        }
                    });
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesRobot');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.post('/reportesValFecha', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaIni = req.body.fechaIni.replace(/-/g, '');
            let fechaFin = req.body.fechaFin.replace(/-/g, '');
            let validador = req.body.validadorPicker;

            let fechaArray = [];
            let estatusArray = [];
            let chartArray = [];
            let flag = 0;
            let cabeceraArray = [];
            let datosArray = [];
            let resultadoQuery = [];
            let whereClause = '';

            const request = new sql.Request(pool);
            request.input('fechaIni', sql.VarChar, fechaIni);
            request.input('fechaFin', sql.VarChar, fechaFin);
            request.input('validador', sql.VarChar, validador);

            let query = 'select CONVERT(varchar, fechaAsignacionAgenteValidador, 23) as "dia",procesada,count(numeroOrden) "ordenes" ';
            query += 'from masterTableAsignaciones ';
            query += 'where (fechaAsignacionAgenteValidador between @fechaIni AND @fechaFin) ';
            query += `${validador ? 'and idValidador=@validador ' : ''} `;
            query += 'group by CONVERT(varchar, fechaAsignacionAgenteValidador, 23),procesada ';
            query += 'order by dia ';


            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error al ejecutar query en reportesRobotFecha');
                    res.status(200).send('error');
                    return;
                } else {
                    let rows = result.recordset;

                    if (rows.length > 0) {
                        for (i = 0; i < rows.length; i++) {
                            resultadoQuery.push({
                                Fecha: rows[i].dia,
                                Estatus: rows[i].procesada,
                                Ordenes: rows[i].ordenes,
                            });

                            fechaArray.indexOf(rows[i].dia) === -1 ? fechaArray.push(rows[i].dia) : (x = 1);
                            estatusArray.indexOf(rows[i].procesada) === -1 ? estatusArray.push(rows[i].procesada) : (x = 1);
                        }

                        cabeceraArray.push('Dia');

                        for (i = 0; i < estatusArray.length; i++) {
                            /*
              let estatus = "Sin estatus";
              switch (estatusArray[i]) {
                case 0:
                  estatus = "Por Procesar";
                  break;

                case 1:
                  estatus = "Procesada";
                  break;
              }
              */
                            cabeceraArray.push(estatusArray[i] ? 'Procesada' : 'Por procesar');
                        }

                        for (i = 0; i < fechaArray.length; i++) {
                            let datosRow = [];
                            datosRow.push(fechaArray[i]);

                            for (j = 0; j < estatusArray.length; j++) {
                                flag = 0;

                                for (k = 0; k < resultadoQuery.length; k++) {
                                    if (resultadoQuery[k].Fecha == fechaArray[i] && resultadoQuery[k].Estatus == estatusArray[j]) {
                                        datosRow.push(resultadoQuery[k].Ordenes);
                                        flag = 1;
                                        break;
                                    }
                                }

                                if (flag == 0) datosRow.push(0);
                            }

                            datosArray.push(datosRow);
                        }

                        chartArray.push(cabeceraArray);

                        for (i = 0; i < datosArray.length; i++) {
                            chartArray.push(datosArray[i]);
                        }
                    } else {
                        chartArray = [['Dia', 'Procesada', 'Por procesar']];
                        chartArray.push([fechaIni, 0, 0]);
                        chartArray.push([fechaFin, 0, 0]);
                    }

                    let response = {
                        chartArray: chartArray,
                        validador: validador,
                    };

                    res.send(response).status(200);
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesValFecha');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.post('/reportesValMes', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaArray = [];
            let estatusArray = [];
            let chartArray = [];
            let flag = 0;
            let x = 0;
            let cabeceraArray = [];
            let datosArray = [];
            let resultadoQuery = [];

            const request = new sql.Request(pool);

            //var query = `SELECT CONCAT(YEAR(fechaAsignacion), '-' , MONTH(fechaAsignacion)) as "fecha",procesada, count(1) as "ordenes" from cuentasAsignadas group by CONCAT(YEAR(fechaAsignacion), '-' , MONTH(fechaAsignacion)), procesada order by 1, 3`;

            let query = `select CONCAT(YEAR(fechaAsignacionAgenteValidador), '-' , MONTH(fechaAsignacionAgenteValidador)) as "fecha",`;
            query += 'procesada,count(numeroOrden) "ordenes" ';
            query += 'from masterTableAsignaciones ';
            query += 'where procesada is not null ';
            query += "group by CONCAT(YEAR(fechaAsignacionAgenteValidador), '-' , MONTH(fechaAsignacionAgenteValidador)),procesada ";
            query += 'order by fecha';


            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error en la consulta en reportesRobotMes');
                    res.status(200).send('error');
                    return;
                } else {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        let month = rows[i].fecha.split('-')[1];
                        let year = rows[i].fecha.split('-')[0];

                        if (month < 10) rows[i].fecha = year + '-0' + month;

                        resultadoQuery.push({
                            Fecha: rows[i].fecha,
                            Estatus: rows[i].procesada,
                            Ordenes: rows[i].ordenes,
                        });

                        fechaArray.indexOf(rows[i].fecha) === -1 ? fechaArray.push(rows[i].fecha) : (x = 1);
                        estatusArray.indexOf(rows[i].procesada) === -1 ? estatusArray.push(rows[i].procesada) : (x = 1);
                    }

                    cabeceraArray.push('Mes');

                    for (i = 0; i < estatusArray.length; i++) {
                        /*
            let estatus = "Sin estatus";
            switch (estatusArray[i]) {
              case 0:
                estatus = "Por Procesar";
                break;

              case 1:
                estatus = "Procesada";
                break;
            }*/
                        cabeceraArray.push(estatusArray[i] ? 'Procesada' : 'Por procesar');
                    }

                    for (i = 0; i < fechaArray.length; i++) {
                        let datosRow = [];
                        datosRow.push(fechaArray[i]);

                        for (j = 0; j < estatusArray.length; j++) {
                            flag = 0;

                            for (k = 0; k < resultadoQuery.length; k++) {
                                if (resultadoQuery[k].Fecha == fechaArray[i] && resultadoQuery[k].Estatus == estatusArray[j]) {
                                    datosRow.push(resultadoQuery[k].Ordenes);
                                    flag = 1;
                                    break;
                                }
                            }

                            if (flag == 0) datosRow.push(0);
                        }

                        datosArray.push(datosRow);
                    }

                    chartArray.push(cabeceraArray);

                    for (i = 0; i < datosArray.length; i++) {
                        chartArray.push(datosArray[i]);
                    }

                    res.send(chartArray).status(200);
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesRobotMes');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.post('/reportesValExcel', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaIni = req.body.fechaIni.replace(/-/g, '');
            let fechaFin = req.body.fechaFin.replace(/-/g, '');
            let validador = req.body.validador;

            let cuentas = [];
            let query = ''

            const request = new sql.Request(pool);
            request.input('fechaIni', sql.VarChar, fechaIni);
            request.input('fechaFin', sql.VarChar, fechaFin);
            request.input('validador', sql.VarChar, validador);

            if (validador) {
                query = 'SELECT id,numeroCuenta,numeroOrden,idValidador,';
                query += 'fechaAsignacionAgenteValidador,fechaLiberacionAgenteValidador,';
                query += 'procesada,sinRobot,trabajada ';
                query += 'FROM masterTableAsignaciones ';
                query += 'WHERE (CONVERT(varchar, fechaAsignacionAgenteValidador, 112) ';
                query += 'BETWEEN @fechaIni AND @fechaFin) AND idValidador=@validador order by id';
            } else {
                query = 'SELECT id,numeroCuenta,numeroOrden,idValidador,';
                query += 'fechaAsignacionAgenteValidador,fechaLiberacionAgenteValidador,';
                query += 'procesada,sinRobot,trabajada ';
                query += 'FROM masterTableAsignaciones ';
                query += 'WHERE CONVERT(varchar, fechaAsignacionAgenteValidador, 112) ';
                query += 'BETWEEN @fechaIni AND @fechaFin order by id';
            }

            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error en la consulta en reportesValExcel');
                    res.status(200).send('error');
                    return;
                } else {
                    let rows = result.recordset;

                    for (i = 0; i < rows.length; i++) {
                        let dataRow = [];
                        let estatus = 'Sin estatus';
                        dataRow.push(rows[i].id);
                        dataRow.push(rows[i].numeroCuenta);
                        dataRow.push(rows[i].numeroOrden);
                        dataRow.push(rows[i].idValidador);
                        dataRow.push(rows[i].fechaAsignacionAgenteValidador);

                        if (rows[i].fechaLiberacionAgenteValidador != null) dataRow.push(rows[i].fechaLiberacionAgenteValidador);
                        else dataRow.push(null);

                        switch (rows[i].procesada) {
                            case false:
                                estatus = 'Por Procesar';
                                break;

                            case true:
                                estatus = 'Procesada';
                                break;
                        }
                        dataRow.push(estatus);
                        cuentas.push(dataRow);
                    }

                    let wb = new xl.Workbook({ dateFormat: 'dd/mm/yyyy hh:mm:ss' });
                    let ws = wb.addWorksheet('Reporte');

                    ws.cell(1, 1).string('Id');
                    ws.cell(1, 2).string('Número de cuenta');
                    ws.cell(1, 3).string('Número de orden');
                    ws.cell(1, 4).string('Validador');
                    ws.cell(1, 5).string('Fecha de asignación');
                    ws.cell(1, 6).string('Fecha de liberación');
                    ws.cell(1, 7).string('Procesada');

                    for (x = 0; x < cuentas.length; x++) {
                        if (cuentas[x][4]) {
                            if(dateTime.format(cuentas[x][4], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(cuentas[x][4], 'HH') == '01') {
                                cuentas[x][4] = dateTime.addHours(cuentas[x][4], 0);
                            }
                            else if (dateTime.format(dateTime.addDays(cuentas[x][4], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(cuentas[x][4], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                                cuentas[x][4] = dateTime.addHours(cuentas[x][4], 1);
                            }
                            cuentas[x][4] = dateTime.addSeconds(cuentas[x][4], 1);
                            cuentas[x][4] = dateTime.format(cuentas[x][4], 'YYYY/MM/DD HH:mm:ss');
                        }

                        if (cuentas[x][5]) {
                            if(dateTime.format(cuentas[x][5], 'YYYY/MM/DD') == '2021/04/03' && dateTime.format(cuentas[x][5], 'HH') == '01') {
                                cuentas[x][5] = dateTime.addHours(cuentas[x][5], 0);
                            }
                            else if (dateTime.format(dateTime.addDays(cuentas[x][5], 2), '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('') != dateTime.format(cuentas[x][5], '[GMT]Z').match(/[\d]/gm).slice(1, 2).join('')) {
                                cuentas[x][5] = dateTime.addHours(cuentas[x][5], 1);
                            }
                            cuentas[x][5] = dateTime.addSeconds(cuentas[x][5], 1);
                            cuentas[x][5] = dateTime.format(cuentas[x][5], 'YYYY/MM/DD HH:mm:ss');
                        }
                        ws.cell(x + 2, 1).number(cuentas[x][0]);
                        ws.cell(x + 2, 2).string(cuentas[x][1]);
                        ws.cell(x + 2, 3).string(cuentas[x][2]);
                        ws.cell(x + 2, 4).string(cuentas[x][3]);
                        ws.cell(x + 2, 5).date(cuentas[x][4]);
                        ws.cell(x + 2, 6).date(cuentas[x][5]);
                        ws.cell(x + 2, 7).string(cuentas[x][6]);
                    }

                    wb.write('public/ReporteValidador.xlsx');

                    setTimeout(() => {
                        res.status(200).send('OK');
                    }, 3000);
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en reportesValExcel');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.get('/promediosVal', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let request = new sql.Request(pool);

            let query = 'select distinct idValidador ';
            query += 'from masterTableAsignaciones ';
            query += 'WHERE CONVERT(varchar,fechaAsignacionAgenteValidador,112) = CONVERT(varchar,getdate(),112)';
            // var query = 'SELECT DISTINCT validador from cuentasAsignadas WHERE CONVERT(varchar,fechaAsignacion,112) =20200403'

            request.query(query, (err, result) => {
                if (err) {
                    console.log('Error en la consulta en promediosVal');
                    res.status(200).send('error');
                    return;
                }

                let rows = result.recordset;
                let promedios = [];

                if (rows.length > 0) {
                    async.eachSeries(
                        rows,
                        function (row, callbackAsync) {
                            let validador = row.validador;
                            /*
              var query = `
							SELECT 
								CONVERT(varchar, fechaAsignacion, 120) as fechAsig, 
								CONVERT(varchar, fechaLiberada , 120) as fechLiber
							FROM cuentasAsignadas 
              WHERE fechaLiberada IS NOT NULL AND(CONVERT(varchar, fechaAsignacion, 112) = CONVERT(varchar, GETDATE(), 112)) AND validador = @validador`;
              */
                            query = 'SELECT CONVERT(varchar, fechaAsignacionAgenteValidador, 120) as fechAsig, ';
                            query += 'CONVERT(varchar, fechaLiberacionAgenteValidador , 120) as fechLiber ';
                            query += 'FROM masterTableAsignaciones ';
                            query += 'WHERE fechaLiberacionAgenteValidador IS NOT NULL ';
                            query += 'AND(CONVERT(varchar, fechaAsignacionAgenteValidador, 112) = ';
                            query += 'CONVERT(varchar, getdate(), 112)) AND idValidador = @validador';

                            request = new sql.Request(pool);

                            request.input('validador', sql.VarChar, validador);

                            request.query(query, (err, result) => {
                                if (err) {
                                    console.log('Error en la consulta en promediosVal');
                                    res.status(200).send('error');
                                    return;
                                }

                                let rowsPromedios = result.recordset;

                                let promedioLiberacion = 0;
                                for (let j = 0; j < rowsPromedios.length; j++) {
                                    let horaAsignacion = moment(rowsPromedios[j].fechAsig, 'YYYY-MM-DD hh:mm:ss');
                                    let horaLiberacion = moment(rowsPromedios[j].fechLiber, 'YYYY-MM-DD hh:mm:ss');
                                    promedioLiberacion += horaLiberacion.diff(horaAsignacion, 'minutes');
                                }

                                promedios.push({
                                    validador: validador,
                                    promedio: minutes2hours(promedioLiberacion / rowsPromedios.length),
                                });

                                callbackAsync(null, 'SIGUIENTE');
                            });
                        },
                        function (error, data) {
                            res.render('promedioVal', {
                                title: 'Promedio validadores',
                                promedios: JSON.stringify(promedios),
                            });
                        }
                    );
                } else {
                    console.log('No hay validadors por consultar');
                    res.send('errorSinValidadores').status(400);
                    return;
                }
            });

            request.on('error', (err) => {
                console.log('Error en la conexion en promediosVal');
                res.render(200).send('error');
                return;
            });
        }
    });

    var cpUploadOrdenes = upload.fields([{ name: 'reasignarOrdenes', maxCount: 1 }]);

    app.post('/reasignarOrdenesMasivo', function (req, res) {
        let schema = {
            ORDENES: {
                prop: 'orden',
                type: String,
            },
        };
        cpUploadOrdenes(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                if (err.message == 'File too large') res.send('tamañoArchivo').status(400);
                else res.send('errorCarga').status(400);
            } else if (err) res.send('errorTipoArchivo').status(400);
            else {
                if (Object.keys(req.files).length > 0) {
                    // Verificamos que se escogió un archivo
                    let archivo = '';

                    if (fs.existsSync('public/uploads/reasignarOrdenes.xls')) archivo = 'public/uploads/reasignarOrdenes.xls';
                    else if (fs.existsSync('public/uploads/reasignarOrdenes.xlsx')) archivo = 'public/uploads/reasignarOrdenes.xlsx';

                    if (archivo != '') {
                        readExcel(archivo, { schema }).then(({ rows, errors }) => {
                            if (errors.length > 0) console.log(errors);
                            else {
                                if (rows.length > 0) {
                                    async.eachSeries(
                                        rows,
                                        (row, callbackAsync) => {
                                            let orden = row.orden;

                                            const request = new sql.Request(pool);

                                            request.input('orden', sql.VarChar, orden);

                                            //var query =
                                            //  "UPDATE historicoCuentasAsignadas SET procesadoPorRobotValidador = 1 WHERE numeroOrden = @orden";
                                            const query = 'UPDATE masterTableAsignaciones SET statusProcesadoRobotValidador = 5 WHERE numeroOrden = @orden';

                                            request.query(query, (err, result) => {
                                                if (!err) callbackAsync();
                                                else {
                                                    console.log(err);
                                                    callbackAsync();
                                                }
                                            });

                                            request.on('error', (err) => {
                                                console.log(err);
                                                callbackAsync();
                                            });
                                        },
                                        function () {
                                            fs.unlink(archivo, (err) => {
                                                if (err) throw err;
                                            });

                                            logAccion(req.session.username, 'ReasignaOrdenMasivo');

                                            res.redirect('/validadores');
                                            return;
                                        }
                                    );
                                }
                            }
                        });
                    } else res.redirect('/validadores');
                } else res.send('archivoVacio').status(400);
            }
        });
    });

    app.post('/reporteRobotExcelHora', function (req, res) {
        if (!req.session.username) {
            res.redirect('/');
        } else if (!req.session.supervisor || !req.session.superUsuario) {
            res.redirect('/cuentas');
        } else {
            let fechaIni = req.body.fechaIni.replace(/-/g, '');
            let fechaFin = req.body.fechaFin.replace(/-/g, '');

      let cuentas = [];
      let cuentas2 = [];

      let request = new sql.Request(pool);
      let request2 = new sql.Request(pool)

      request.input("fechaIni", sql.VarChar, fechaIni);
      request.input("fechaFin", sql.VarChar, fechaFin);

      request2.input("fechaIni", sql.VarChar, fechaIni);
      request2.input("fechaFin", sql.VarChar, fechaFin);

      let query = "select ";
      query += "count(1) as conteo, ";
      query += "convert(varchar, fechaFinValidacion, 112) as fecha, ";
      query += "datepart(hour,fechaFinValidacion) as hora ";
      query += "from masterTableAsignaciones ";
      query +=
        "where convert(varchar, fechaFinValidacion, 112) BETWEEN @fechaIni AND @fechaFin ";
      query +=
        "group by convert(varchar, fechaFinValidacion, 112), datepart(hour,fechaFinValidacion) ";
      query += "order by 2 desc, 3 desc";

      let query2 = "select ";
      query2 += "count(1) as conteo, ";
      query2 += "convert(varchar, fechaObtencionDocumentos, 112) as fecha, ";
      query2 += "datepart(hour,fechaObtencionDocumentos) as hora ";
      query2 += "from masterTableAsignaciones ";
      query2 += "where convert(varchar, fechaObtencionDocumentos, 112) BETWEEN @fechaIni AND @fechaFin ";
      query2 += "group by convert(varchar, fechaObtencionDocumentos, 112), datepart(hour,fechaObtencionDocumentos) ";
      query2 += "order by 2 desc, 3 desc";

      request.query(query, (err, result) => {
        if (err) {
          console.log(err);
          console.log("Error en la consulta en reportesRobotPorHora");
          res.status(200).send("error");
          return;
        } else {
          let rows = result.recordset;

          for (i = 0; i < rows.length; i++) {
            let dataRow = [];
            let fecha = rows[i].fecha;
            fecha =
              fecha.substring(0, 4) +
              "-" +
              fecha.substring(4, 6) +
              "-" +
              fecha.substring(6, 8);

            dataRow.push(fecha);
            dataRow.push(rows[i].hora + ":00");
            dataRow.push(rows[i].conteo.toString());

            cuentas.push(dataRow);
          }

          request2.query(query2, (err, result2) => 
          {
            if(err)
            {
              console.log(err);
              console.log("Error en la consulta en reportesRobotPorHora2");
              res.status(200).send("error");
              return;
            }
            else
            {
                let rows2 = result2.recordset;

              for (i = 0; i < rows2.length; i++) {
                let dataRow = [];
                let fecha = rows2[i].fecha;
                fecha =
                  fecha.substring(0, 4) +
                  "-" +
                  fecha.substring(4, 6) +
                  "-" +
                  fecha.substring(6, 8);

                dataRow.push(fecha);
                dataRow.push(rows2[i].hora + ":00");
                dataRow.push(rows2[i].conteo.toString());

                cuentas2.push(dataRow);
              }

              cuentas.forEach(cuenta => {
                let result = cuentas2.filter(row => {return row[0] == cuenta[0]}).filter(row => {return row[1] == cuenta[1]})
                cuenta[3] = result[0] && result[0][2] ? result[0][2].toString() : ""
              });

              let wb = new xl.Workbook({ dateFormat: "dd/mm/yyyy" });
              let ws = wb.addWorksheet("Reporte");

              ws.cell(1, 1).string("Fecha");
              ws.cell(1, 2).string("Hora");
              ws.cell(1, 3).string("Número de órdenes");
              ws.cell(1, 4).string("Número de órdenes de documentos");

              for (x = 0; x < cuentas.length; x++)
              {
                ws.cell(x + 2, 1).date(cuentas[x][0]);
                ws.cell(x + 2, 2).string(cuentas[x][1]);
                ws.cell(x + 2, 3).string(cuentas[x][2]);
                ws.cell(x + 2, 4).string(cuentas[x][3]);
              }

              wb.write("public/ReporteRobotPorHora.xlsx");

              setTimeout(() => {
                res.status(200).send("OK");
              }, 3000);
            }
          })
        }
      });

            request.on('error', (err) => {
                console.log('Error en la conexion en reporteRobotExcelHora');
                res.render(200).send('error');
                return;
            });
        }
    });

    app.get('/logout', function (req, res) {
        req.session.destroy();
        res.redirect('/');
    });

    app.post('/asignacionManual', function (req, res) {
        (async () => {
            let someError = null;
            try {
                await algoritmo();
            } catch (error) {
                someError = error;
                console.log(`Error en algoritmo: ${error}`);
            } finally {
                if (someError) res.send('error').status(200);
                else {
                    logAccion(req.session.username, 'AsignaManual');
                    res.send('OK').status(200);
                }

                console.log('Fin');
            }
        })();
    });
};

Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf());
    date = new Date(date.getTime() - date.getTimezoneOffset() * 1000 * 60);
    date.setDate(date.getDate() + days);
    return date;
};

//OK
function eliminaCuentas(id) {
    const request = new sql.Request(pool);

    request.input('id', sql.VarChar, id);

    const query = 'UPDATE masterTableAsignaciones SET idValidador = NULL, nombreAgenteValidador = NULL, procesada = NULL, sinRobot = NULL, trabajada = NULL, fechaAsignacionAgenteValidador = NULL, fechaLiberacionAgenteValidador = NULL, [statusProcesadoRobotValidador] = 5 WHERE procesada = 0 AND idValidador = @id';

    request.query(query, (err, result) => {
        if (err) console.error('Error en query eliminaCuentas...' + err);
        console.log(result);
        return;
    });

    request.on('error', (err) => {
        console.error('Error en conexion eliminaCuentas...' + err);
        return;
    });
}

function limpiaValidadores(callback) {
    const query = 'TRUNCATE TABLE validadores';

    const request = new sql.Request(pool);

    request.query(query, (err, result) => {
        if (err) console.error('Error en query limpiaValidadores...' + err);

        callback();
    });

    request.on('error', (err) => {
        console.error('Error en conexion limpiaValidadores...' + err);
        callback();
    });
}

function desactiva(id) {
    const request = new sql.Request(pool);

    request.input('id', sql.Int, parseInt(id));
    request.input('activo', sql.Bit, false);

    const query = 'UPDATE filtrosDescarga SET activo = @activo WHERE id <> @id; SELECT SCOPE_IDENTITY() AS id';

    request.query(query, (err, result) => {
        if (err) {
            console.log('Error en la ejecución del query');
            console.log(err);
        }

        return;
    });

    request.on('error', (err) => {
        res.send('error').status(200);

        console.log('Error en la conexión');
        return;
    });
}

function esSupervisor(user, callback) {
    const request = new sql.Request(pool);

    request.input('user', sql.VarChar, user);

    request.query('SELECT * FROM supervisores WHERE idSupervisor =  @user', (err, result) => {
        if (!err) {
            let rows = result.recordset;

            if (rows.length > 0) {
                if (rows[0].superUsuario == 1) resp = { supervisor: true, superUsuario: true };
                else resp = { supervisor: true, superUsuario: false };

                callback(resp);
            } else callback(null);
        } else {
            console.error('Error en la conexion al ejecutar query esSupervisor');
            callback(null);
            return;
        }
    });

    request.on('error', (err) => {
        console.log('Error en la conexion esSupervisor');
        callback(null);
        return;
    });
}

//OK --- Se puede eliminar
function cambiaEstado(rows) {
    if (rows.length == 0) return;

    let query = 'UPDATE historicoCuentasAsignadas SET procesadoPorRobotValidador = 1 WHERE numeroOrden IN (';

    for (let i = 0; i < rows.length; i++) {
        if (i < rows.length - 1) query = query + "'" + rows[i].numeroOrden + "',";
        else query = query + "'" + rows[i].numeroOrden + "')";
    }

    const request = new sql.Request(pool);

    request.query(query, (err, result) => {
        if (err) console.error('Error en query cambiaEstado...' + err);

        return;
    });

    request.on('error', (err) => {
        console.error('Error en la conexion en cambiaEstado...' + err);
        return;
    });
}

function construyeImagen(cadenabase64, nombreImagen) {
    const documentBuffer = Buffer.from(cadenabase64, 'base64');
    let s = new Readable();

    s.push(documentBuffer);
    s.push(null);

    s.pipe(fs.createWriteStream(nombreImagen));
    return 0;
}

function mesToString(mes) {
    let mesString = '';

    switch (mes) {
        case 1:
            mesString = 'Enero';
            break;

        case 2:
            mesString = 'Febrero';
            break;

        case 3:
            mesString = 'Marzo';
            break;

        case 4:
            mesString = 'Abril';
            break;

        case 5:
            mesString = 'Mayo';
            break;

        case 6:
            mesString = 'Junio';
            break;

        case 7:
            mesString = 'Julio';
            break;

        case 8:
            mesString = 'Agosto';
            break;

        case 9:
            mesString = 'Septiembre';
            break;

        case 10:
            mesString = 'Octubre';
            break;

        case 11:
            mesString = 'Noviembre';
            break;

        case 12:
            mesString = 'Diciembre';
            break;

        default:
            mesString = '';
    }

    return mesString;
}
//pendiente
function agregadoAnio() {
    return new Promise((resolve, reject) => {
        const query = "SELECT YEAR(horaAsignacion) 'anio', MONTH(horaAsignacion) 'mes', DAY(horaAsignacion) 'dia', COUNT(1) 'conteo' FROM historicoCuentasAsignadas GROUP BY YEAR(horaAsignacion), MONTH(horaAsignacion), DAY(horaAsignacion)";

        let chartArray = [];
        chartArray.push(['Año', 'Mes', 'Día', 'Conteo']);

        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Error en la conexion en reportes');
                reject(err);
                return;
            }

            connection.query(query, [], (err, rows) => {
                connection.release();

                if (err) {
                    console.log('Error en la consulta en reportes');
                    reject(err);
                    return;
                }

                for (var i = 0; i < rows.length; i++) {
                    let dataRow = [];

                    dataRow.push(rows[i].anio.toString());
                    dataRow.push(rows[i].mes);
                    dataRow.push(rows[i].dia.toString());
                    dataRow.push(rows[i].conteo);

                    chartArray.push(dataRow);
                }

                resolve(JSON.stringify(chartArray));
            });
        });
    });
}

function minutes2hours(min) {
    let hours = Math.trunc(min / 60);
    let minutes = Math.floor(min % 60);

    minutes < 10 ? (minutes = '0' + minutes) : minutes;

    let time = hours + ':' + minutes;

    if (isNaN(hours) || isNaN(minutes)) time = '-';

    return time;
}

async function algoritmo() {
    let validadores = await obtieneValidadores();
    let cuentas = await obtieneCuentas_v3();

    let validadorActual = validadores.first;

    for (let i = 0; i < cuentas.length; i++) {
        let tipoOrden = 0;

        console.log(`Cuenta: ${cuentas[i].numeroCuenta}`);
        console.log(`Orden: ${cuentas[i].numeroOrden}`);
        console.log('Tipo cuenta: ' + cuentas[i].actividad);
        console.log('Cobertura: ' + cuentas[i].cobertura);
        console.log('SipreIdCercano: ' + cuentas[i].sipreIdCercano);

        if (cuentas[i].cobertura == 'SI' || cuentas[i].cobertura == 'SI_AR' || cuentas[i].cobertura == 'NO') tipoOrden = 1;
        else if (cuentas[i].cobertura == 'NO_SE') {
            if (cuentas[i].sipreIdCercano == 'NO_ENCONTRADO') tipoOrden = 3;
            else tipoOrden = 2;
        }

        if (validadores.length == 0) {
            console.log('Ya no hay validadores libres');
            break;
        }

        for (let x = 1; x <= validadores.length; x++) {
            if (validadorActual.data.skill == cuentas[i].actividad && (validadorActual.data.tipoOrden == tipoOrden || validadorActual.data.tipoOrden == 0)) {
                console.log(`Se asigno la orden ${cuentas[i].numeroOrden} de la cuenta ${cuentas[i].numeroCuenta} al validador ${validadorActual.data.id} con skill ${validadorActual.data.skill} y tipoOrden ${validadorActual.data.tipoOrden}`);

                let query = 'UPDATE masterTableAsignaciones set statusProcesadoRobotValidador = 4, idValidador =  @validador, nombreAgenteValidador = @nombre, fechaAsignacionAgenteValidador = GETDATE(), procesada = 0, sinRobot = @sinRobot, trabajada = 0 where numeroOrden = @numeroOrden; ';
                query += 'INSERT INTO cuentasAsignadasHistorial (numeroCuenta, numeroOrden, validador, fechaAsignacion, sinRobot) VALUES (@numeroCuenta, @numeroOrden, @validador, GETDATE(), @sinRobot)';

                let sinRobot = cuentas[i].procesado == 1 ? 0 : 1;

                await actualizaTablas_v2(query, cuentas[i].numeroCuenta, cuentas[i].numeroOrden, validadorActual.data.id, sinRobot, validadorActual.data.nombre);

                validadorActual.data.cuotaDisponible--;

                validadorActual = validadorActual.next;

                if (validadorActual.prev.data.cuotaDisponible == 0) validadores.remove(validadorActual.prev);

                break;
            } else validadorActual = validadorActual.next;
        }
    }
}
//DONE
async function obtieneValidadores() {
    let validadores = new LinkedList();

    let query = 'SELECT a.idValidador, a.nombre, a.cuota, a.horaSalida, a.skill, a.tipoOrden, COUNT(b.id) AS cuotaHoraActual FROM validadores a ';
    query += 'LEFT JOIN masterTableAsignaciones b ON a.idValidador = b.idValidador ';
    query += 'AND DATEDIFF(DAY, GETDATE(), b.fechaAsignacionAgenteValidador) = 0 ';
    query += 'AND DATEPART(HOUR, b.fechaAsignacionAgenteValidador) = DATEPART(HOUR, GETDATE()) ';
    query += 'WHERE activo = 1 AND ';
    query += 'pausa = 0 AND ';
    query += 'CONVERT(TIME, horaIngreso) <= CAST(GETDATE() as TIME) AND ';
    query += 'CONVERT(TIME, horaSalida) >= CAST(GETDATE() as TIME) AND ';
    query += 'CAST(GETDATE() as TIME) NOT BETWEEN CONVERT(TIME, horaComida) AND CAST(DATEADD(HOUR, 1, CONVERT(DATETIME, horaComida)) AS TIME) AND ';
    query += 'diaDescanso <> DATEPART(WEEKDAY, GETDATE()) -1 ';
    query += 'GROUP BY a.idValidador, a.nombre, a.cuota, a.horaSalida, a.skill, a.tipoOrden ';
    query += 'ORDER BY 6';

    const request = new sql.Request(pool);

    try {
        const response = await request.query(query);

        for (let i = 0; i < response.recordset.length; i++) {
            let horaSalidaArray = response.recordset[i].horaSalida.split(':');
            let horaActual = new Date().getHours();
            let minutosRestantes = 60;
            let cuota = response.recordset[i].cuota;

            console.log('Validador: ' + response.recordset[i].idValidador + ', Hora salida: ' + horaSalidaArray[0] + ', Minutos salida: ' + horaSalidaArray[1] + ', Hora actual: ' + horaActual);

            if (horaSalidaArray[0] - horaActual <= 0) {
                console.log('Ya es la hora de salida');
                minutosRestantes = horaSalidaArray[1];
                cuota = response.recordset[i].cuota / (60 / minutosRestantes);
                console.log('cuota nueva: ' + cuota);
            }

            let minutosActuales = new Date().getMinutes();
            let tiempoRestante = minutosRestantes - minutosActuales;

            let tiempoAsignacion = Math.floor(60 / cuota);
            let maxPosible = Math.floor(tiempoRestante / tiempoAsignacion);
            let cuotaAsignar = 0;

            console.log('maxPosible: ' + maxPosible);
            console.log('cuotaHoraActual: ' + response.recordset[i].cuotaHoraActual);
            console.log('cuota: ' + cuota);

            if (response.recordset[i].cuotaHoraActual < cuota && maxPosible != 0) {
                console.log('Si entra');
                if (cuota - response.recordset[i].cuotaHoraActual >= maxPosible) cuotaAsignar = maxPosible;
                else cuotaAsignar = cuota - response.recordset[i].cuotaHoraActual;

                console.log('cuotaAsignar: ' + cuotaAsignar);

                if (cuotaAsignar <= cuota) {
                    let node = new LinkedList.Node({
                        id: response.recordset[i].idValidador,
                        cuota: cuota,
                        cuotaDisponible: cuotaAsignar,
                        skill: response.recordset[i].skill,
                        tipoOrden: response.recordset[i].tipoOrden,
                        nombre: response.recordset[i].nombre,
                    });
                    validadores.append(node);
                }
            }
        }
    } catch (error) {
        console.log(`Error en obtieneValidadores: ${error}`);
    } finally {
        return validadores;
    }
}

async function actualizaTablas_v2(query, numeroCuenta, numeroOrden, idValidador, sinRobot, nombre) {
    const request = new sql.Request(pool);

    request.input('numeroCuenta', sql.VarChar(50), numeroCuenta);
    request.input('numeroOrden', sql.VarChar(50), numeroOrden);
    request.input('validador', sql.VarChar(50), idValidador);
    request.input('sinRobot', sql.TinyInt, sinRobot);
    request.input('nombre', sql.VarChar(100), nombre);

    try {
        await request.query(query);
    } catch (error) {
        console.log(`Error en actualizaTablas: ${error}`);
    } finally {
        return;
    }
}
//DONE
async function obtieneCuentas_v3() {
    let cuentas = [];

    let query = "SELECT numeroCuenta, numeroOrden, actividad, statusProcesadoRobotValidador, cobertura, sipreIDCercano, 'id1' OrderKey, CONVERT(DATETIME, fechaCreacionSiebel, 103) ";
    query += 'FROM masterTableAsignaciones ';
    // query += "WHERE statusProcesadoRobotValidador in (0) "
    // query += "WHERE statusProcesadoRobotValidador in (1, 400, 5, 401) ";
    query += 'WHERE statusProcesadoRobotValidador in (5, 401) ';

    query += 'AND CONVERT(VARCHAR, CONVERT(DATETIME, fechaSolicitadaSiebel, 103), 112) = CONVERT(VARCHAR, DATEADD(DAY,1,GETDATE()),112) ';
    query += 'UNION ALL ';
    query += "SELECT numeroCuenta, numeroOrden, actividad, statusProcesadoRobotValidador, cobertura, sipreIDCercano, 'id2' OrderKey, CONVERT(DATETIME, fechaCreacionSiebel, 103) ";
    query += 'FROM masterTableAsignaciones ';
    // query += "WHERE statusProcesadoRobotValidador in (0) "
    query += 'WHERE statusProcesadoRobotValidador in (5, 401) ';
    // query += "WHERE statusProcesadoRobotValidador in (1, 400, 5, 401) ";
    query += 'AND CONVERT(VARCHAR, CONVERT(DATETIME, fechaSolicitadaSiebel, 103), 112) <> CONVERT(VARCHAR, DATEADD(DAY,1,GETDATE()),112)  ';
    query += 'ORDER BY OrderKey, CONVERT(DATETIME, fechaCreacionSiebel, 103) ';

    const request = new sql.Request(pool);

    try {
        const response = await request.query(query);

        for (let i = 0; i < response.recordset.length; i++) {
            let cuenta = {
                numeroCuenta: response.recordset[i].numeroCuenta,
                numeroOrden: response.recordset[i].numeroOrden,
                actividad: response.recordset[i].actividad,
                procesado: response.recordset[i].procesadoPorRobotValidador,
                cobertura: response.recordset[i].cobertura == null ? 'NO_SE' : response.recordset[i].cobertura,
                sipreIdCercano: response.recordset[i].sipreIdCercano == null ? 'NO_ENCONTRADO' : response.recordset[i].sipreIdCercano,
            };
            cuentas.push(cuenta);
        }
    } catch (error) {
        console.log(`Error en obtiene cuentasv3: ${error}`);
    } finally {
        return cuentas;
    }
}

function logAccion(user, accion) {
    const request = new sql.Request(pool);

    request.input('usuario', sql.VarChar(50), user);
    request.input('accion', sql.VarChar(150), accion);

    let query = 'INSERT INTO logAccion VALUES (@usuario, @accion, GETDATE())';

    request.query(query, (error, result) => {
        if (error) console.log(`Error en query logAccion: ${error}`);

        return;
    });
}

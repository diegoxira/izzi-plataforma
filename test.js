

//#region  Pruebas base de datos

var sql = require("mssql");
var dotenv = require('dotenv')
var moment = require('moment')
var fs = require("fs")
const { Readable } = require('stream');

cuenta ='2134235324**'
cuenta = cuenta.replace(/\*/gi,'')
console.log(cuenta);
dotenv.config()
const pool = new sql.ConnectionPool({
    user: process.env.SQLS_USER,
    password: process.env.SQLS_PASS,
    server: process.env.SQLS_HOST,
    database: process.env.SQLS_DB,
    port: process.env.SQLS_PORT
});

pool.connect(err =>
{
    if (err)
    {
        console.error(err)
        console.log("Error en la conexion esSupervisor");
        return;
    }
    var request = new sql.Request(pool);
    request.input('validador', sql.VarChar, 'ymartinezl@izzi.mx');

    var query = `select a.*, b.cobertura, b.duplicadaPorTelefono, b.duplicadaPorCorreo, b.correoValido, d.correoValido as "correoValido_api", c.screenshot, b.sipreIdCercano, b.sipreId, d.correo as "email"
				from cuentasAsignadas a
				outer apply
				(select top 1 cobertura, duplicadaPorTelefono, duplicadaPorCorreo, correoValido, sipreIdCercano, sipreId from reporteRobotsValidadores where cuenta = a.numeroCuenta) b
				outer apply
				(select top 1 screenshot from resultadosRobotsValidadores where numeroCuenta = a.numeroCuenta) c
				outer apply
				(select top 1 correoValido, correo from validacionCorreos where cuenta = a.numeroCuenta) d
				where a.procesada = 0
				and a.validador = @validador
				order by fechaAsignacion`


    request.query(query, (err, result) =>
    {
        if (err)
        {
            console.log(err);
            console.log("Error en la consulta");
            return
        }
        var rows = result.recordset
        console.log(rows);
        // construyeImagen(rows[0].screenshot, "public/" + 'pruebas' + '.png');


    })

    request.on('error', err =>
    {
        console.log(err);
        console.log("Error en la conexion en promediosVal");
        // res.render(200).send("error")
        return
    })


});

function construyeImagen(cadenabase64, nombreImagen)
{
	const documentBuffer = Buffer.from(cadenabase64, 'base64')
	var s = new Readable()

	s.push(documentBuffer)
	s.push(null)

	s.pipe(fs.createWriteStream(nombreImagen));
	return 0;
}

// #endregion





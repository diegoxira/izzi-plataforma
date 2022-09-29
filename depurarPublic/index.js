//  -   -   -   -   -   -   -   M A N E J O - E R R O R E S - L O G S -   -   -   -   -   -  -   -  -  -

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
    get: function () {
        return __stack[1].getFunctionName();
    }
});


//  -   -   -   -   -   -   -   -   -    M O D U L O S -   -   -   -   -   -   -   -   -   -

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const date = require('date-and-time');
const cron = require("node-cron");

//  -   -   -   -   -   -   -   -   C O N S T A N T E S  -   -   -   -   -   -   -   -   

const publicPath = path.join(__dirname, '..', 'public');


//  -   -   -   -   -   -   -   -   F L U J O  -   -   -   -   -   -   -   -   

cron.schedule("0 0 0 * * * ", async ()=> 
{

    const imagenes = await imagenesDirectorio()
    const listaBorrar = await listaImagenesBorrar(imagenes)
    await borrarImagenes(listaBorrar)

})


//  -   -   -   -   -   -   -   -   -   -   -   -   -   F U N C I O N E S   -  -   -   -   -   -   -   -   -   -   -    -   -   -   -   -   -


async function imagenesDirectorio(){

    try {
        const archivos = fs.readdirSync(publicPath)
        const imagenes = archivos.filter(el => /\d{6,9}\.png/.test(el) || /\d{6,9}\.jpg/.test(el) || /\d-\d{11,12}\.png/.test(el) || /\d-\d{11,12}\.jpg/.test(el) || /documentos_\d{6,9}\.png/.test(el) || /documentos_\d{6,9}\.png/.test(el) || /documentos_\d-\d{11,12}\.png/.test(el) || /documentos_\d-\d{11,12}\.jpg/.test(el) )
        return imagenes
    } catch (error) {
        console.error(`Funcion: ${__function} - Linea: ${__line} - Error: ${error.stack}`)
        return 'ERROR'
    }

}

async function listaImagenesBorrar(imagenes){
    try {
        const imagenesBorrar = []
        for (let i = 0; i < imagenes.length; i++) {
            const imagenPath = path.join(publicPath, imagenes[i])
            const imagenInfo = fs.statSync(imagenPath)
            const fechaImagenCreada = imagenInfo.mtime
            const diasPasados = date.subtract(new Date(), fechaImagenCreada).toDays();
            if(diasPasados > 2)
            {
                imagenesBorrar.push(imagenPath)
            }
        }
        return imagenesBorrar
    } catch (error) {
        console.error(`Funcion: ${__function} - Linea: ${__line} - Error: ${error.stack}`)
        return 'ERROR'
    }
}

async function borrarImagenes(imagenes){
    try {
        console.log(`Total de imagenes a borrar: ${imagenes.length}`)
        for (let i = 0; i < imagenes.length; i++) {
            fs.unlinkSync(imagenes[i])
        }
        console.log(`Se finalizo el borrado de las imagenes`)
        return 'OK'
    } catch (error) {
        console.error(`Funcion: ${__function} - Linea: ${__line} - Error: ${error.stack}`)
        return 'ERROR'
    }
}
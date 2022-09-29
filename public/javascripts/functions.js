// var baseurl = "http://localhost:3300/";//baseurl
var baseurl = "/";

//en ie8 no funciona preventDefault
function ie8SafePreventEvent(event) {
 
  event.preventDefault ? event.preventDefault() : (event.returnValue = false);
}

$(document).ready(function () {
  $("#fechaIni").on("change", cambiaMinFechaFin);

  $("#fechaIniExcel").on("change", cambiaMinFechaFinExcel);

  $("#fechaIniExcelPorHora").on("change", cambiaMinFechaFinExcelPorHora);

  $("#fechaIniInfoAsignadas").on("change", cambiaMinFechaInfoAsignadas);

  $("#fechaIniSinTrabajar").on("change", cambiaMinFechaSinTrabajar);

				  

  $("#loginSubmit").on("submit", function (e) {
  
    //prevenimos el comportamiento por defecto
    ie8SafePreventEvent(e);
    console.log("Entrando...");
    var username = $(".username").val(),
      password = $(".password").val();

    if (username.length < 4 || password.length < 6) {
   
      alert("Los campos no pueden estar vacios.");
      return false;
    }

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "login", //url a la que hacemos la petición
      data: $(this).serialize(), //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert("Los datos de acceso son incorrectos.");
        } else {
	 
	 
          window.location.href = baseurl + "validadores";
        }
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });

  $("#ordenesBtn").on("click", function (e) {
  
    window.location.href = baseurl + "ordenes";
  });

  $("#reporteVal").on("click", function (e) {
  
    window.location.href = baseurl + "reportesValidador";
  });

  $("#reporteBot").on("click", function (e) {
  
    window.location.href = baseurl + "reportesRobot";
  });

  $("#cuentasBtn").on("click", function (e) {
  
    window.location.href = baseurl + "cuentas";
  });

  $("#cuentasPorLiberarBtn").on("click", function (e) {
  
    window.location.href = baseurl + "cuentasPorLiberar";
  });

  $("#validadoresBtn").on("click", function (e) {
  
    window.location.href = baseurl + "validadores";
  });

  $("#supervisoresBtn").on("click", function (e) {
  
    window.location.href = baseurl + "supervisores";
  });

  $("#cuentasLiberadasBtn").on("click", function (e) {
  
    window.location.href = baseurl + "cuentasLiberadas";
  });

  $("#filtrosDescargaBtn").on("click", function (e) {
   
    window.location.href = baseurl + "filtrosDescarga";
  });

  $("#filtrosLimpiezaBtn").on("click", function (e) {
   
    window.location.href = baseurl + "filtrosLimpieza";
  });

  $("#asignaErrorBtn").on("click", function (e) {
   
    $("#dialogAsignaError").dialog("open");
  });

  $("#logo").on("click", function (e) {

			
  
    window.location.href = baseurl + "cuentas";
  });

  // $(".editar").on("click", function (e)
  // {
  //     $(".numCuenta").text($(this).attr("data-numcue"))
  //     $("#idBase").val($(this).attr("data-id"))

  //     $("#dialogConfirma").dialog("open");
  // })

  $(".editar").on("click", function (e) {
  
    var idCuenta = $(this).attr("data-id");

    // console.log($("#idBase").val($(this).attr("data-id")))

    $.ajax({
      method: "POST",
      url: baseurl + "liberaCuenta",
      data: { idCuenta: idCuenta },
      success: function (data) {
		 
        if (data === "error") {
		   
          $("#dialogAlert p").text(
            "Error al procesar la petición, consulte con el administrador"
          );
          $("#dialogAlert").dialog("open");
	 
        } else {
	 
          window.location.href = baseurl + "cuentas";
        }
      },
      error: function (jqXHR, exception) {
        $("#dialogAlert p").text(exception);
        $("#dialogAlert").dialog("open");
      },
    });
		 
			   
			
	
  });


  $("#agregaVal").on("click", function (e) {
  
    $("#dialogValidadorNuevo").dialog("open");
  });

  $("#agregaSupervisor").on("click", function (e) {
  
    $("#dialogSupervisorNuevo").dialog("open");
  });

  $("#cargaMasiva").on("click", function (e) {
  
    $("#dialogCargaArchivo").dialog("open");
  });

  $("#cancelaCarga").on("click", function (e) {
  
    $("#dialogCargaArchivo").dialog("close");
  });

  $("#cancelaCargaLimpieza").on("click", function (e) {
  
    $("#dialogCargaArchivoLimpieza").dialog("close");
  });

  $(".editarValidador").on("click", function (e) {
  
    $(".numVal").text($(this).attr("data-Val"));
    $("#idBaseVal").val($(this).attr("data-id"));
    $("#nombreVal").val($(this).attr("data-nom"));
    $("#horaEntradaVal").val($(this).attr("data-hent"));
    $("#minEntradaVal").val($(this).attr("data-ment"));
    $("#horaSalidaVal").val($(this).attr("data-hsal"));
    $("#minSalidaVal").val($(this).attr("data-msal"));
    $("#horaComidaVal").val($(this).attr("data-hcom"));
    $("#minComidaVal").val($(this).attr("data-mcom"));
    $("#descansoVal").val($(this).attr("data-desc"));
    $("#cuotaVal").val($(this).attr("data-cuota"));
    $("#skillVal").val($(this).attr("data-skill"));
    $("#tipoOrdenVal").val($(this).attr("data-tipoOrden"));

    if ($(this).attr("data-act") == 1) $("#activoVal").prop("checked", true);
			  
   
    else $("#activoVal").prop("checked", false);

    if ($(this).attr("data-pausa") == 1) $("#pausaVal").prop("checked", true);
			 
   
    else $("#pausaVal").prop("checked", false);


    $("#dialogValidador").dialog("open");
  });

  $(".editarFiltroLimpieza").on("click", function (e) {
  
    $("#idBaseFiltroLimpieza").val($(this).attr("data-id"));
    $("#nombreFiltroLimpieza").val($(this).attr("data-nom"));

    if ($(this).attr("data-activo") == 1)
      $("#activoFilLimpi").prop("checked", true);
   
    else $("#activoFilLimpi").prop("checked", false);

    $("#dialogFiltroLimpieza").dialog("open");
  });

   

  $("#pausaMasiva").on("click", function (e) {
  
    $("#dialogPausaMasiva").dialog("open");
  });

  $(".eliminaValidador").on("click", function (e) {
  
    $(".idValElimina").text($(this).attr("data-val"));
    $("#idBaseValElimina").val($(this).attr("data-id"));

    $("#dialogEliminaValidador").dialog("open");
  });

  $(".editarSupervisor").on("click", function (e) {
    $(".numSup").text($(this).attr("data-sup"));
    $("#idBaseSup").val($(this).attr("data-id"));
    $("#nombreSup").val($(this).attr("data-nom"));

			   
  
			   
			 
			  

    $("#dialogSupervisor").dialog("open");
  });

  $(".eliminaSupervisor").on("click", function (e) {
  
    $(".idSupElimina").text($(this).attr("data-sup"));
    $("#idBaseSupElimina").val($(this).attr("data-id"));

    $("#dialogEliminaSupervisor").dialog("open");
  });

  $(".eliminaFiltroDescarga").on("click", function (e) {
  
    $(".idFiltroElimina").text($(this).attr("data-id"));
    $("#idBaseFiltroElimina").val($(this).attr("data-id"));

    $("#dialogEliminaFiltroDescarga").dialog("open");
  });

  $("#agregaFiltroDescarga").on("click", function (e) {
  
    $("#dialogFiltroDescargaNuevo").dialog("open");
  });

  $(".editarFiltroDescarga").on("click", function (e) {
  
    var id = $(this).attr("data-id");
    $("#idBaseFiltroDescarga").val($(this).attr("data-id"));
    $("#nombreFiltroDescarga").val($(".nombre-" + id + "").text());
    $("#tipoFiltroDescarga").val($(".tipo-" + id + "").text());
    $("#estadoFiltroDescarga").val($(".estado-" + id + "").text());
    $("#fechaFiltroDescarga").val($(".fecha-" + id + "").text());

    if ($(this).attr("data-act") == 1)
      $("#activoFiltroDescarga").prop("checked", true);
   
    else $("#activoFiltroDescarga").prop("checked", false);


    $("#dialogFiltroDescarga").dialog("open");
  });

  $(".eliminaFiltroLimpieza").on("click", function (e) {
  
    $(".idFiltroLimpiezaElimina").text($(this).attr("data-id"));
    $("#idBaseFiltroLimpiezaElimina").val($(this).attr("data-id"));

    $("#dialogEliminaFiltroLimpieza").dialog("open");
  });

  $("#agregaFiltroLimpieza").on("click", function (e) {
  
    $("#dialogFiltroLimpiezaNuevo").dialog("open");
  });

  $("#agregaFiltro").on("click", function (e) {
  
    $("#idActividadFiltro").val($(this).attr("data-idActividad"));
    $("#dialogFiltroNuevo").dialog("open");
  });

  $("#agregaCondicion").on("click", function (e) {
  
    $("#idFiltroCondicion").val($(this).attr("data-idFiltro"));
    $("#dialogCondicionNuevo").dialog("open");
  });

  $("#atrasFiltro").on("click", function (e) {
  
    $("#tablaFiltrosLimpieza").show();
    $("#tablaFiltros").find("tbody").empty();
    $("#tablaFiltros").hide();
    $("#atrasCondiciones").hide();
    $("#atrasFiltro").hide();

    $("#agregaFiltroLimpieza").show();
    $("#agregaFiltro").hide();
    $("#agregaCondicion").hide();
  });

  $("#atrasCondiciones").on("click", function (e) {
  
    var dataId = $("#idAnterior").val();

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "drillDownFiltroLimpieza", //url a la que hacemos la petición
      data: { id: dataId }, //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert(
            "Error al obtener la informacion, consulte con el administrador"
          );
        } else {
	 
          $("#tablaFiltrosLimpieza").hide();
          $("#tablaCondiciones").hide();
          $("#tablaFiltros").find("tbody").empty();
          $("#tablaFiltros").show();

          $("#agregaFiltroLimpieza").hide();
          $("#agregaFiltro").show();
          $("#agregaCondicion").hide();
          $("#agregaFiltro").attr("data-idActividad", dataId);

          $("#atrasCondiciones").hide();
          $("#atrasFiltro").show();

          console.log(data);
          for (var i = 0; i < data.length; i++) {
            var id = "";
            var descripcion = "";
            var numero = "";

            id = data[i].Id;
            numero = data[i].Numero;
		 
			  
            descripcion = data[i].Descripcion;


            var fila = '<tr><td class="id-' + id + '">' + id + "</td>";
            fila +=
              '<td class="descripcion-' + id + '">' + descripcion + "</td>";
            fila += '<td class="numero-' + id + '">' + numero + "</td>";
            fila +=
              "<td style='text-align:center'><button id='drillDown-" +
              id +
              '\' class="btn btn-warning drillDownFiltro" data-id=' +
              id +
              " ><i class='icon-plus icon-white'></i></button>";
            fila +=
              "<td><button id='editar-" +
              id +
              '\' class="btn btn-primary editarFiltro" data-id=' +
              id +
              " data-desc='" +
              descripcion +
              "' data-num=" +
              numero +
              " ><i class='icon-pencil icon-white'></i></button>";
            fila +=
              "<td><a id='elimina-" +
              id +
              "' class='eliminaFiltro' data-id=" +
              id +
              ">Eliminar</a>";


					
					   
				   
													
														  
							 
	 
            $("#tablaFiltros").append($(fila));
          }
        }
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });


  $(".drillDownFiltroLimpieza").on("click", function (e) {
  
    var dataId = $(this).attr("data-id");
    $("#idAnterior").val(dataId);

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "drillDownFiltroLimpieza", //url a la que hacemos la petición
      data: { id: dataId }, //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert(
            "Error al obtener la informacion, consulte con el administrador"
          );
        } else {
	 
          $("#tablaFiltrosLimpieza").hide();
          $("#tablaFiltros").show();
          $("#tablaFiltros").find("tbody").empty();

          $("#agregaFiltroLimpieza").hide();
          $("#agregaFiltro").show();
          $("#agregaFiltro").attr("data-idActividad", dataId);

          $("#atrasCondiciones").hide();
          $("#atrasFiltro").show();

          console.log(data);
          for (var i = 0; i < data.length; i++) {
		 
            var id = "";
            var descripcion = "";
            var numero = "";

            id = data[i].Id;
            numero = data[i].Numero;
            descripcion = data[i].Descripcion;

            var fila = '<tr><td class="id-' + id + '">' + id + "</td>";
            fila +=
              '<td class="descripcion-' + id + '">' + descripcion + "</td>";
            fila += '<td class="numero-' + id + '">' + numero + "</td>";
            fila +=
              "<td style='text-align:center'><button id='drillDown-" +
              id +
              '\' class="btn btn-warning drillDownFiltro" data-id=' +
              id +
              " ><i class='icon-plus icon-white'></i></button>";
            fila +=
              "<td><button id='editar-" +
              id +
              '\' class="btn btn-primary editarFiltro" data-id=' +
              id +
              " data-desc='" +
              descripcion +
              "' data-num=" +
              numero +
              " ><i class='icon-pencil icon-white'></i></button>";
            fila +=
              "<td><a id='elimina-" +
              id +
              "' class='eliminaFiltro' data-id=" +
              id +
              ">Eliminar</a>";

            $("#tablaFiltros").append($(fila));
          }
        }
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });


  $("body").delegate(".editarFiltro", "click", function (e) {
  
    $("#descripcionFiltro").val($(this).attr("data-desc"));
    $("#numFiltro").val($(this).attr("data-num"));
    $("#idBaseFiltro").val($(this).attr("data-id"));


    $("#dialogFiltro").dialog("open");
  });

  $("body").delegate(".drillDownFiltro", "click", function (e) {
  
    var dataId = $(this).attr("data-id");

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "drillDownFiltro", //url a la que hacemos la petición
      data: { id: dataId }, //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert(
            "Error al obtener la informacion, consulte con el administrador"
          );
        } else {
			   
          $("#tablaFiltros").hide();
          $("#tablaCondiciones").show();
          $("#tablaCondiciones").find("tbody").empty();

          $("#agregaFiltro").hide();
          $("#agregaCondicion").show();
          $("#agregaCondicion").attr("data-idFiltro", dataId);

          $("#atrasCondiciones").show();
          $("#atrasFiltro").hide();


          console.log(data);
          for (var i = 0; i < data.length; i++) {
            var id = "";
            var columna = "";
            var condicion = "";
            var valor = "";

            id = data[i].Id;
            columna = data[i].Columna;
		 
			  
		  
            condicion = data[i].Condicion;
            valor = data[i].Valor;

            var fila = '<tr><td class="id-' + id + '">' + id + "</td>";
            fila += '<td class="columna-' + id + '">' + columna + "</td>";
            fila += '<td class="condicion-' + id + '">' + condicion + "</td>";
            fila += '<td class="valor-' + id + '">' + valor + "</td>";
            fila +=
              "<td><button id='editar-" +
              id +
              '\' class="btn btn-primary editarCondicion" data-id=' +
              id +
              " data-columna='" +
              columna +
              "' data-condicion='" +
              condicion +
              "' data-valor='" +
              valor +
              "' ><i class='icon-pencil icon-white'></i></button>";
            fila +=
              "<td><a id='elimina-" +
              id +
              "' class='eliminaCondicion' data-id=" +
              id +
              ">Eliminar</a>";

					
					 
					 
					
																   
							 
	 
            $("#tablaCondiciones").append($(fila));
          }
        }
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });


  $("body").delegate(".editarCondicion", "click", function (e) {
   
    $("#idBaseCondicion").val($(this).attr("data-id"));
    $("#columnaCondicion").val($(this).attr("data-columna"));
    $("#condicionCondicion").val($(this).attr("data-condicion"));
    $("#valorCondicion").val($(this).attr("data-valor"));


    $("#dialogCondicion").dialog("open");
  });

  $("body").delegate(".eliminaFiltro", "click", function (e) {
    $(".idFiltroElimina").text($(this).attr("data-id"));
    $("#idBaseFiltroElimina").val($(this).attr("data-id"));

				 
   
				 
				 

    $("#dialogEliminaFiltro").dialog("open");
  });

  $("body").delegate(".eliminaCondicion", "click", function (e) {
   
    $(".idCondicionElimina").text($(this).attr("data-id"));
    $("#idBaseCondicionElimina").val($(this).attr("data-id"));

    $("#dialogEliminaCondicion").dialog("open");
  });

  $(".eliminaFiltro").on("click", function (e) {
  
    alert($(this).attr("data-id"));
  });


  $(".visorImagen").on("click", function (e) {
  
    var cuenta = $(this).attr("data-cuenta");
    cuenta = cuenta.replace(/\*/gi, "");
    console.log(cuenta);
    var sipreCercano = $(this).attr("data-sipreCercano");
    $("#sipreImagen").attr("src", cuenta + ".png");
    $(".sipreIdCercano").text(sipreCercano);
    console.log(sipreCercano);
    $("#dialogImagenSipre").dialog("open");
  });

  $(".visorDocumentos").on("click", function (e) {
  
    var cuenta = $(this).attr("data-cuenta");
    cuenta = cuenta.replace(/\*/gi, "");
    $("#documentosImagen").attr("src", "documentos_" + cuenta + ".png");

			   
   

    var $image = $('#documentosImagen');

		   
	  
   

    $image.viewer('show');
  });

	

  $(".reasignar").on("click", function (e) {
  
    $(".numCuentaReasigna").text($(this).attr("data-numcue"));
    $("#idBaseReasigna").val($(this).attr("data-id"));
    $("#cuentaReasigna").val($(this).attr("data-numcue"));

    $("#dialogConfirmaReasigna").dialog("open");
  });

  $("#buscarCuentasLiberadas").on("click", function (e) {
  
    $.post({
      url: baseurl + "buscaCuentasLiberadas",
      data: {
	
        fechaIni: $("#fechaIniLiberacion").val(),
        fechaFin: $("#fechaFinLiberacion").val(),
      },
      success: function (data) {
	
        $("body").html(data);
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });


  $("#reasignaOrdenBtn").on("click", function (e) {
  
    $("#dialogReasignaOrden").dialog("open");
  });

  $("#reasignaOrdenMasBtn").on("click", function (e) {
			   
  
    $("#dialogReasignaOrdenMas").dialog("open");
  });

  $("#asignadasBtn").on("click", function (e) {
			  
  
    $("#dialogOrdenesAsignadas").dialog("open");
  });

  $("#infoAsignadasBtn").on("click", function (e) {
  
    $("#dialogInfoAsignadas").dialog("open");
  });

  $("#sinTrabajarBtn").on("click", function (e) {
  
    $("#dialogSinTrabajar").dialog("open");
  });

  $("#fechaIniAsignadas").on("change", function () {
  
    $("#fechaFinAsignadas").datepicker(
      "option",
      "minDate",
      $("#fechaIniAsignadas").val()
    );
  });

  $("#reporteSubmit").on("submit", function (e) {
  
    ie8SafePreventEvent(e);

    //si todo ha ido bien procesamos la petición con node
    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "reportesFecha", //url a la que hacemos la petición
      data: $(this).serialize(), //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert(
            "Error al obtener la informacion, consulte con el administrador"
          );
        } else {
	 
          $("#fechaIni").val("");
          $("#fechaFin").val("");

          google.charts.load("current", { packages: ["bar"] });
          google.charts.setOnLoadCallback(drawChart);

          function drawChart() {
	  
            var tabla = new google.visualization.arrayToDataTable(data);

            var options = {
              chart: {
                title: "Reportes",
                subtitle: "Ordenes por validador",
              },
              vAxis: {
                format: "decimal",
              },
            };

            var chart = new google.charts.Bar(
              document.getElementById("chart_div")
            );
            chart.draw(tabla, google.charts.Bar.convertOptions(options));
          }
        }
      },
      error: function (jqXHR, exception) {
	
        showModal("Error", "Error procesando la petición.");
      },
    });
  });

  $("#reporteBotSubmit").on("submit", function (e) {
  
    ie8SafePreventEvent(e);

    if ($("#fechaIni").val() != "" || $("#fechaFin").val() != "") {
   
      $.ajax({
        method: "POST", //metodo|verbo con el que procesamos la peticion
        url: baseurl + "reportesRobotFecha", //url a la que hacemos la petición
        data: $(this).serialize(), //datos del formulario
        success: function (data) {
	 
          //si los datos de acceso no son correctos
          if (data === "error") {
	  
            alert(
              "Error al obtener la informacion, consulte con el administrador"
            );
          } else {
	  
            $("#fechaIni").val("");
            $("#fechaFin").val("");

            google.charts.load("current", { packages: ["bar"] });
            google.charts.setOnLoadCallback(drawChart);

            function drawChart() {
	   
              var tabla = new google.visualization.arrayToDataTable(data);

              var options = {
                chart: {
                  title: "Ordenes robot",
                },
                vAxis: {
                  format: "decimal",
                },
              };

              var chart = new google.charts.Bar(
                document.getElementById("chart_div_bot")
              );
              chart.draw(tabla, google.charts.Bar.convertOptions(options));
            }
          }
        },
        error: function (jqXHR, exception) {
	 
          alert("Error procesando la petición.");
        },
      });
   
   
    } else alert("Las fechas no pueden estar vacías");
  });

  $("#reporteBotMes").on("click", function (e) {
  
    ie8SafePreventEvent(e);

    //si todo ha ido bien procesamos la petición con node
    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "reportesRobotMes", //url a la que hacemos la petición
      data: $(this).serialize(), //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert(
            "Error al obtener la informacion, consulte con el administrador"
          );
        } else {
	 
          $("#fechaIni").val("");
          $("#fechaFin").val("");

          google.charts.load("current", { packages: ["bar"] });
          google.charts.setOnLoadCallback(drawChart);

          function drawChart() {
	  
            var tabla = new google.visualization.arrayToDataTable(data);

            var options = {
              chart: {
                title: "Ordenes robot",
              },
              vAxis: {
                format: "decimal",
              },
            };

            var chart = new google.charts.Bar(
              document.getElementById("chart_div_bot")
            );
            chart.draw(tabla, google.charts.Bar.convertOptions(options));
          }
        }
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });

  $("#reporteBotExcel").on("click", function (e) {
  
    $("#dialogReporteBotExcel").dialog("open");

  });

  $("#reporteBotExcelPorHora").on("click", function (e) {
  
    $("#dialogReporteBotExcelPorHora").dialog("open");

  });

  $("#reporteValSubmit").on("submit", function (e) {
			  
  
    ie8SafePreventEvent(e);

    if ($("#fechaIni").val() != "" || $("#fechaFin").val() != "") {
   
      $.ajax({
        method: "POST", //metodo|verbo con el que procesamos la peticion
        url: baseurl + "reportesValFecha", //url a la que hacemos la petición
        data: $(this).serialize(), //datos del formulario
        success: function (data) {
	 
          //si los datos de acceso no son correctos
          if (data === "error") {
	  
            alert(
              "Error al obtener la informacion, consulte con el administrador"
            );
          } else {
	  
            $("#fechaIni").val("");
            $("#fechaFin").val("");
            $("#validadorPicker").val("");

            google.charts.load("current", { packages: ["bar"] });
            google.charts.setOnLoadCallback(drawChart);

            function drawChart() {
              var tabla = new google.visualization.arrayToDataTable(
                data.chartArray
              );

              var options = {
                chart: {
                  title: "Ordenes validador " + data.validador,
                },
                vAxis: {
                  format: "decimal",
                },
              };

              var chart = new google.charts.Bar(
                document.getElementById("chart_div_val")
              );
              chart.draw(tabla, google.charts.Bar.convertOptions(options));
            }
          }
        },
        error: function (jqXHR, exception) {
	 
          alert("Error procesando la petición.");
        },
      });
   
   
    } else alert("Las fechas no pueden estar vacías");


  });

  $("#reporteValMes").on("click", function (e) {
  
    ie8SafePreventEvent(e);

    //si todo ha ido bien procesamos la petición con node
    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "reportesValMes", //url a la que hacemos la petición
      data: $(this).serialize(), //datos del formulario
      success: function (data) {
	
        //si los datos de acceso no son correctos
        if (data === "error") {
	 
          alert(
            "Error al obtener la informacion, consulte con el administrador"
          );
        } else {
	 
          $("#fechaIni").val("");
          $("#fechaFin").val("");

          google.charts.load("current", { packages: ["bar"] });
          google.charts.setOnLoadCallback(drawChart);

          function drawChart() {
	  
            var tabla = new google.visualization.arrayToDataTable(data);

            var options = {
              chart: {
                title: "Ordenes validador",
              },
              vAxis: {
                format: "decimal",
              },
            };

            var chart = new google.charts.Bar(
              document.getElementById("chart_div_val")
            );
            chart.draw(tabla, google.charts.Bar.convertOptions(options));
          }
        }
      },
      error: function (jqXHR, exception) {
	
        alert("Error procesando la petición.");
      },
    });
  });

  $("#reporteValExcel").on("click", function (e) {
  
    $("#dialogReporteValExcel").dialog("open");

  });

  $("#formCargaArchivo").on("submit", function (e) {
  
    ie8SafePreventEvent(e);

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "cargaArchivo", //url a la que hacemos la petición
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false,
      success: function (data) {
	
        console.log(data);
        if (data === "errorCarga")
          alert("Error al cargar el archivo por favor intente de nuevo");
        else if (data === "tamañoArchivo")
          alert("El archivo no puede exceder los 100 KB");
        else if (data === "errorTipoArchivo")
          alert(
            "Error en el tipo de archivo. Se permiten únicamente archivos xls y xlsx de máximo 100 KB"
          );
        else if (data === "archivoVacio")
          alert("Por favor seleccione un archivo");
        else window.location.href = baseurl + "validadores";
				   
      },
      error: function (jqXHR, exception) {
	
        showModal("Error", "Error procesando la petición.");
      },
    });

  });

  $("#formCargaArchivoLimpieza").on("submit", function (e) {
  
    ie8SafePreventEvent(e);

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "limpiaOrdenes", //url a la que hacemos la petición
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false,
      success: function (data) {
	
        console.log(data);
        if (data === "errorCarga")
          alert("Error al cargar el archivo por favor intente de nuevo");
        else if (data === "tamañoArchivo")
          alert("El archivo no puede exceder los 100 KB");
        else if (data === "errorTipoArchivo")
          alert(
            "Error en el tipo de archivo. Se permiten únicamente archivos xls y xlsx de máximo 100 KB"
          );
        else if (data === "archivoVacio")
          alert("Por favor seleccione un archivo");
        else {
          alert("Limpieza de órdenes realizada correctamente");
          window.location.href = baseurl + "validadores";
        }
      },
      error: function (jqXHR, exception) {
	
        showModal("Error", "Error procesando la petición.");
      },
    });

  });

  $("#formReasignaOrdenesMas").on("submit", function (e) {
  
    ie8SafePreventEvent(e);

    $.ajax({
      method: "POST", //metodo|verbo con el que procesamos la peticion
      url: baseurl + "reasignarOrdenesMasivo", //url a la que hacemos la petición
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false,
      success: function (data) {
	
        console.log(data);
        if (data === "errorCarga")
          alert("Error al cargar el archivo por favor intente de nuevo");
        else if (data === "tamañoArchivo")
          alert("El archivo no puede exceder los 100 KB");
        else if (data === "errorTipoArchivo")
          alert(
            "Error en el tipo de archivo. Se permiten únicamente archivos xls y xlsx de máximo 100 KB"
          );
        else if (data === "archivoVacio")
          alert("Por favor seleccione un archivo");
        else {
	 
          alert("Órdenes reasignadas correctamente");
          window.location.href = baseurl + "validadores";
        }
      },
      error: function (jqXHR, exception) {
	
        showModal("Error", "Error procesando la petición.");
      },
    });

  });

  $("#cancelaCargaMasivo").on("click", function (e) {
  
    $("#dialogReasignaOrdenMas").dialog("close");
  });

  $("#tablaValidadores").DataTable({
    language: {
      lengthMenu: "Mostrando _MENU_ registros por página",
      zeroRecords: "Sin registros",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sin registros",
      infoFiltered: "(filtrado de _MAX_ registros totales)",
      search: "Busqueda:",
      paginate: {
        first: "Primera",
        last: "Última",
        next: "->",
        previous: "<-",
      },
    },
  });

  $("#tablaSupervisores").DataTable({
    language: {
      lengthMenu: "Mostrando _MENU_ registros por página",
      zeroRecords: "Sin registros",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sin registros",
      infoFiltered: "(filtrado de _MAX_ registros totales)",
      search: "Busqueda:",
      paginate: {
        first: "Primera",
        last: "Última",
        next: "->",
        previous: "<-",
      },
    },
  });

  $("#tablaFiltrosDes").DataTable({
    language: {
      lengthMenu: "Mostrando _MENU_ registros por página",
      zeroRecords: "Sin registros",
      info: "Mostrando página _PAGE_ de _PAGES_",
      infoEmpty: "Sin registros",
      infoFiltered: "(filtrado de _MAX_ registros totales)",
      search: "Busqueda:",
      paginate: {
        first: "Primera",
        last: "Última",
        next: "->",
        previous: "<-",
      },
    },
  });
});

function ordenarValidadores(validadores, tipo) {
  switch (tipo) {
    case "ordAsignadas":
      validadores.sort((a, b) => {
        return b.ordenesAsignadas - a.ordenesAsignadas;
      });

			 
 
	 
  
	   
						
      break;
  }
  return;
}

function diaSemana(dia) {
 
  var weekday = new Array(7);
  weekday[0] = "Domingo";
  weekday[1] = "Lunes";
  weekday[2] = "Martes";
  weekday[3] = "Miércoles";
  weekday[4] = "Jueves";
  weekday[5] = "Viernes";
  weekday[6] = "Sábado";

  return weekday[dia];
}

function cambiaMinFechaFin() {
 
  $("#fechaFin").datepicker("option", "minDate", $("#fechaIni").val());
}

function cambiaMinFechaFinExcel() {
 
  $("#fechaFinExcel").datepicker(
    "option",
    "minDate",
    $("#fechaIniExcel").val()
  );
}

function cambiaMinFechaFinExcelPorHora() {
 
  $("#fechaFinExcelPorHora").datepicker(
    "option",
    "minDate",
    $("#fechaIniExcelPorHora").val()
  );
}

function cambiaMinFechaInfoAsignadas() {
 
  $("#fechaFinInfoAsignadas").datepicker(
    "option",
    "minDate",
    $("#fechaIniInfoAsignadas").val()
  );
}

function cambiaMinFechaSinTrabajar() {
 
  $("#fechaFinSinTrabajar").datepicker(
    "option",
    "minDate",
    $("#fechaIniSinTrabajar").val()
  );
}



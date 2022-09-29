$( function() 
{
  $("#dialogAlert").dialog(
  {
    dialogClass: "no-close",
    modal: true,
    autoOpen: false,
    show: 
    {
      effect: "blind",
      duration: 500
    },
    hide: 
    {
      effect: "blind",
      duration: 500
    },
    buttons: {
      "Ok": function()
      {
        window.location.href = baseurl + "cuentas";
      }
    }
  });

  $("#dialogAlertVal").dialog(
  {
      dialogClass: "no-close",
      modal: true,
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      },
      buttons: {
        "Ok": function()
        {
          window.location.href = baseurl + "validadores";
        }
      }
  });

  $("#dialogAlertSup").dialog(
  {
        dialogClass: "no-close",
        modal: true,
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        },
        buttons: {
          "Ok": function()
          {
            window.location.href = baseurl + "supervisores";
          }
        }
  });

  $("#dialogAlertFiltroDescarga").dialog(
  {
        dialogClass: "no-close",
        modal: true,
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        },
        buttons: {
          "Ok": function()
          {
            window.location.href = baseurl + "filtrosDescarga";
          }
        }
  });

  $("#dialogAlertFiltroLimpieza").dialog(
  {
          dialogClass: "no-close",
          modal: true,
          autoOpen: false,
          show: 
          {
            effect: "blind",
            duration: 500
          },
          hide: 
          {
            effect: "blind",
            duration: 500
          },
          buttons: {
            "Ok": function()
            {
              window.location.href = baseurl + "filtrosLimpieza";
            }
          }
  });

  $("#dialogConfirma").dialog(
  {
    modal: true,
    buttons: {
      "Ok": function() {
        $.ajax({
          method: "POST",
          url: baseurl + "liberaCuenta",
          data: { idCuenta: $("#idBase").val()},
          success: function(data){              
              if(data === "error")
              {
                $("#dialogConfirma").dialog('close');
                $("#dialogAlert p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlert").dialog('open')                                
              }
              else
              {
                $("#dialogConfirma").dialog('close');
                $("#dialogAlert p").text('Se ha liberado la cuenta correctamente')
                $("#dialogAlert").dialog('open')
              }
                
          },
          error: function(jqXHR, exception){
            $("#dialogConfirma").dialog('close');
            $("#dialogAlert p").text(exception)
            $("#dialogAlert").dialog('open')
          }
        });         
      },
      "Cancelar": function() {
        $("#dialogConfirma").dialog('close');
      }
    },
    autoOpen: false,
    show: 
    {
      effect: "blind",
      duration: 500
    },
    hide: 
    {
      effect: "blind",
      duration: 500
    }
  });

  $("#dialogValidador").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function() 
        {
          $(".idValEdita").text($(".numVal").text())
          $("#idBaseValEdita").val($("#idBaseVal").val())
                  
          $("#dialogEditaValidador").dialog( "open" );   
        },        
        "Cancelar": function() {
          $("#dialogValidador").dialog('close');
        }
      },
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogValidadorNuevo").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() {
            $.ajax({
              method: "POST",
              url: baseurl + "nuevoValidador",
              data: { 
                idValidador: $("#idValNuevo").val(),
                nombre: $("#nombreValNuevo").val(),
                horaEntrada: $("#horaEntradaValNuevo").val() +":"+ $("#minEntradaValNuevo").val(),
                horaSalida: $("#horaSalidaValNuevo").val() +":"+ $("#minSalidaValNuevo").val(),
                horaComida: $("#horaComidaValNuevo").val() +":"+ $("#minComidaValNuevo").val(),
                descanso: $("#descansoValNuevo").val(),
                cuota: $("#cuotaValNuevo").val(),
                skill: $("#skillValNuevo").val(),
                tipoOrden: $("#tipoOrdenValNuevo").val(),
                activo: $("#activoValNuevo").prop('checked'),
                pausa: $("#pausaValNuevo").prop('checked')
              },
              success: function(data){              
                  if(data === "error")
                  {
                    $("#dialogValidadorNuevo").dialog('close');
                    $("#dialogAlertVal p").text('Error al procesar la petición, consulte con el administrador')
                    $("#dialogAlertVal").dialog('open')                                
                  }
                  else
                  {
                    $("#dialogValidadorNuevo").dialog('close');
                    $("#dialogAlertVal p").text('Se ha creado correctamente al validador')
                    $("#dialogAlertVal").dialog('open')
                  }
                    
              },
              error: function(jqXHR, exception){
                $("#dialogValidadorNuevo").dialog('close');
                $("#dialogAlertVal p").text(exception)
                $("#dialogAlertVal").dialog('open')
              }
            });         
          },
          "Cancelar": function() {
            $("#dialogValidadorNuevo").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });  

  $("#dialogEliminaValidador").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function() {
          $.ajax({
            method: "POST",
            url: baseurl + "eliminaValidador",
            data: { idVal: $("#idBaseValElimina").val(), id: $(".idValElimina").text()},
            success: function(data){              
                if(data === "error")
                {
                  $("#dialogEliminaValidador").dialog('close');
                  $("#dialogAlertVal p").text('Error al procesar la petición, consulte con el administrador')
                  $("#dialogAlertVal").dialog('open')                                
                }
                else
                {
                  $("#dialogEliminaValidador").dialog('close');
                  $("#dialogAlertVal p").text('Se ha eliminado el validador correctamente')
                  $("#dialogAlertVal").dialog('open')
                }
                  
            },
            error: function(jqXHR, exception){
              $("#dialogEliminaValidador").dialog('close');
              $("#dialogAlertVal p").text(exception)
              $("#dialogAlertVal").dialog('open')
            }
          });         
        },
        "Cancelar": function() {
          $("#dialogEliminaValidador").dialog('close');
        }
      },
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogPausaMasiva").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() {
            $.ajax({
              method: "POST",
              url: baseurl + "pausaMasiva",
              success: function(data){              
                  if(data === "error")
                  {
                    $("#dialogPausaMasiva").dialog('close');
                    $("#dialogAlertVal p").text('Error al procesar la petición, consulte con el administrador')
                    $("#dialogAlertVal").dialog('open')                                
                  }
                  else
                  {
                    $("#dialogPausaMasiva").dialog('close');
                    $("#dialogAlertVal p").text('Se ha cambiado el estatus de pausa a los validadores')
                    $("#dialogAlertVal").dialog('open')
                  }
                    
              },
              error: function(jqXHR, exception){
                $("#dialogPausaMasiva").dialog('close');
                $("#dialogAlertVal p").text(exception)
                $("#dialogAlertVal").dialog('open')
              }
            });         
          },
          "Cancelar": function() {
            $("#dialogPausaMasiva").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogSupervisor").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() 
          {
            $(".idSupEdita").text($(".numSup").text())
            $("#idBaseSupEdita").val($("#idBaseSup").val())
                    
            $("#dialogEditaSupervisor").dialog( "open" );   
          },        
          "Cancelar": function() {
            $("#dialogSupervisor").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogEditaValidador").dialog(
  {
    modal: true,
    buttons: {
      "Ok": function () {
        $.ajax({
          method: "POST",
          url: baseurl + "editaValidador",
          data: {
            idValidador: $("#idBaseVal").val(),
            id: $(".idValEdita").text(),
            nombre: $("#nombreVal").val(),
            horaEntrada: $("#horaEntradaVal").val() + ":" + $("#minEntradaVal").val(),
            horaSalida: $("#horaSalidaVal").val() + ":" + $("#minSalidaVal").val(),
            horaComida: $("#horaComidaVal").val() + ":" + $("#minComidaVal").val(),
            descanso: $("#descansoVal").val(),
            cuota: $("#cuotaVal").val(),
            skill: $("#skillVal").val(),
            tipoOrden: $("#tipoOrdenVal").val(),
            activo: $("#activoVal").prop('checked'),
            pausa: $("#pausaVal").prop('checked')
          },
          success: function (data) {
            if (data === "error") {
              $("#dialogEditaValidador").dialog('close');
              $("#dialogAlertVal p").text('Error al procesar la petición, consulte con el administrador')
              $("#dialogAlertVal").dialog('open')
            }
            else {
              $("#dialogEditaValidador").dialog('close');
              $("#dialogAlertVal p").text('Se ha editado el validador correctamente')
              $("#dialogAlertVal").dialog('open')
            }
          },
          error: function (jqXHR, exception) {
            $("#dialogEditaValidador").dialog('close');
            $("#dialogAlertVal p").text(exception)
            $("#dialogAlertVal").dialog('open')
          }
        });
      },
      "Cancelar": function () {
        $("#dialogEditaValidador").dialog('close');
      }
    },
    autoOpen: false,
    show:
    {
      effect: "blind",
      duration: 500
    },
    hide:
    {
      effect: "blind",
      duration: 500
    }
  });

  $("#dialogSupervisorNuevo").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          $.ajax({
            method: "POST",
            url: baseurl + "nuevoSupervisor",
            data: {
              idSupervisor: $("#idSupNuevo").val(),
              nombre: $("#nombreSupNuevo").val(),
            },
            success: function (data)
            {
              if (data === "error")
              {
                $("#dialogSupervisorNuevo").dialog('close');
                $("#dialogAlertSup p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlertSup").dialog('open')
              }
              else
              {
                $("#dialogSupervisorNuevo").dialog('close');
                $("#dialogAlertSup p").text('Se ha creado correctamente el supervisor')
                $("#dialogAlertSup").dialog('open')
              }

            },
            error: function (jqXHR, exception)
            {
              $("#dialogSupervisorNuevo").dialog('close');
              $("#dialogAlertSup p").text(exception)
              $("#dialogAlertSup").dialog('open')
            }
          });
        },
        "Cancelar": function ()
        {
          $("#dialogSupervisorNuevo").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogEliminaSupervisor").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          $.ajax({
            method: "POST",
            url: baseurl + "eliminaSupervisor",
            data: { idSup: $("#idBaseSupElimina").val(), id: $(".idSupElimina").text() },
            success: function (data)
            {
              if (data === "error")
              {
                $("#dialogEliminaSupervisor").dialog('close');
                $("#dialogAlertSup p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlertSup").dialog('open')
              }
              else
              {
                $("#dialogEliminaSupervisor").dialog('close');
                $("#dialogAlertSup p").text('Se ha eliminado al supervisor correctamente')
                $("#dialogAlertSup").dialog('open')
              }

            },
            error: function (jqXHR, exception)
            {
              $("#dialogEliminaSupervisor").dialog('close');
              $("#dialogAlertSup p").text(exception)
              $("#dialogAlertSup").dialog('open')
            }
          });
        },
        "Cancelar": function ()
        {
          $("#dialogEliminaSupervisor").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogEditaSupervisor").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          $.ajax({
            method: "POST",
            url: baseurl + "editaSupervisor",
            data: {
              idSupervisor: $("#idBaseSup").val(),
              id: $(".idSupEdita").text(),
              nombre: $("#nombreSup").val(),
            },
            success: function (data)
            {
              if (data === "error")
              {
                $("#dialogEditaSupervisor").dialog('close');
                $("#dialogAlertSup p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlertSup").dialog('open')
              }
              else
              {
                $("#dialogEditaSupervisor").dialog('close');
                $("#dialogAlertSup p").text('Se ha editado el supervisor correctamente')
                $("#dialogAlertSup").dialog('open')
              }
            },
            error: function (jqXHR, exception)
            {
              $("#dialogEditaSupervisor").dialog('close');
              $("#dialogAlertSup p").text(exception)
              $("#dialogAlertSup").dialog('open')
            }
          });
        },
        "Cancelar": function ()
        {
          $("#dialogEditaSupervisor").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogCargaArchivo").dialog(
  {
    modal: true,        
    autoOpen: false,
    width: 600,
    show: 
    {
      effect: "blind",
      duration: 500
    },
    hide: 
    {
      effect: "blind",
      duration: 500
    }
  });

  $("#dialogFiltroDescargaNuevo").dialog(
  {
    modal: true,
    buttons: {
      "Ok": function() {
        $.ajax({
          method: "POST",
          url: baseurl + "nuevoFiltroDescarga",
          data: {             
            nombre: $("#nombreFiltroDescargaNuevo").val(),
            tipo: $("#tipoFiltroDescargaNuevo").val(),
            estado: $("#estadoFiltroDescargaNuevo").val(),
            fecha: $("#fechaFiltroDescargaNuevo").val(),
            activo: $("#activoFiltroDescargaNuevo").prop('checked')            
          },
          success: function(data){              
              if(data === "error")
              {
                $("#dialogFiltroDescargaNuevo").dialog('close');
                $("#dialogAlertFiltroDescarga p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlertFiltroDescarga").dialog('open')                                
              }
              else
              {
                $("#dialogFiltroDescargaNuevo").dialog('close');
                $("#dialogAlertFiltroDescarga p").text('Se ha creado correctamente el filtro de descarga')
                $("#dialogAlertFiltroDescarga").dialog('open')
              }
                
          },
          error: function(jqXHR, exception){
            $("#dialogFiltroDescargaNuevo").dialog('close');
            $("#dialogAlertFiltroDescarga p").text(exception)
            $("#dialogAlertFiltroDescarga").dialog('open')
          }
        });         
      },
      "Cancelar": function() {
        $("#dialogFiltroDescargaNuevo").dialog('close');
      }
    },
    autoOpen: false,
    show: 
    {
      effect: "blind",
      duration: 500
    },
    hide: 
    {
      effect: "blind",
      duration: 500
    }
  }); 

  $("#dialogFiltroDescarga").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function() 
        {
          $(".idFiltroDescargaEdita").text($(".nombreFiltroDescarga").val())
          $("#idBaseFiltroDescargaEdita").val($("#idBaseFiltroDescarga").val())
                  
          $("#dialogEditaFiltroDescarga").dialog( "open" );   
        },        
        "Cancelar": function() {
          $("#dialogFiltroDescarga").dialog('close');
        }
      },
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogEditaFiltroDescarga").dialog(
  {
    modal: true,
    buttons: {
      "Ok": function () {
        $.ajax({
          method: "POST",
          url: baseurl + "editaFiltroDescarga",
          data: {
            idFiltroDescarga: $("#idBaseFiltroDescarga").val(),            
            nombre: $("#nombreFiltroDescarga").val(),
            tipo: $("#tipoFiltroDescarga").val(),
            estado: $("#estadoFiltroDescarga").val(),
            fecha: $("#fechaFiltroDescarga").val(),
            activo: $("#activoFiltroDescarga").prop('checked')            
          },
          success: function (data) {
            if (data === "error") {
              $("#dialogEditaFiltroDescarga").dialog('close');
              $("#dialogAlertFiltroDescarga p").text('Error al procesar la petición, consulte con el administrador')
              $("#dialogAlertFiltroDescarga").dialog('open')
            }
            else {
              $("#dialogEditaFiltroDescarga").dialog('close');
              $("#dialogAlertFiltroDescarga p").text('Se ha editado el filtro de descarga correctamente')
              $("#dialogAlertFiltroDescarga").dialog('open')
            }
          },
          error: function (jqXHR, exception) {
            $("#dialogEditaFiltroDescarga").dialog('close');
            $("#dialogAlertFiltroDescarga p").text(exception)
            $("#dialogAlertFiltroDescarga").dialog('open')
          }
        });
      },
      "Cancelar": function () {
        $("#dialogEditaFiltroDescarga").dialog('close');
      }
    },
    autoOpen: false,
    show:
    {
      effect: "blind",
      duration: 500
    },
    hide:
    {
      effect: "blind",
      duration: 500
    }
  });

  $("#dialogEliminaFiltroDescarga").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function() {
          $.ajax({
            method: "POST",
            url: baseurl + "eliminaFiltroDescarga",
            data: { idFiltroElimina: $("#idBaseFiltroElimina").val() },
            success: function(data){              
                if(data === "error")
                {
                  $("#dialogEliminaFiltroDescarga").dialog('close');
                  $("#dialogAlertFiltroDescarga p").text('Error al eliminar filtro, consulte con el administrador')
                  $("#dialogAlertFiltroDescarga").dialog('open')                                
                }
                else
                {
                  $("#dialogEliminaFiltroDescarga").dialog('close');
                  $("#dialogAlertFiltroDescarga p").text('Se ha eliminado el filtro correctamente')
                  $("#dialogAlertFiltroDescarga").dialog('open')
                }
                  
            },
            error: function(jqXHR, exception){
              $("#dialogEliminaFiltroDescarga").dialog('close');
              $("#dialogAlertFiltroDescarga p").text(exception)
              $("#dialogAlertFiltroDescarga").dialog('open')
            }
          });         
        },
        "Cancelar": function() {
          $("#dialogEliminaFiltroDescarga").dialog('close');
        }
      },
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogFiltroLimpiezaNuevo").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function() {
          $.ajax({
            method: "POST",
            url: baseurl + "nuevoFiltroLimpieza",
            data: {             
              nombre: $("#nombreFiltroLimpiezaNuevo").val(), 
              numero: $("#numeroFiltroLimpiezaNuevo").val(), 
              activo: $("#activoFilLimpiNuevo").val()                  
            },
            success: function(data){              
                if(data === "error")
                {
                  $("#dialogFiltroLimpiezaNuevo").dialog('close');
                  $("#dialogAlertFiltroLimpieza p").text('Error al procesar la petición, consulte con el administrador')
                  $("#dialogAlertFiltroLimpieza").dialog('open')                                
                }
                else
                {
                  $("#dialogFiltroLimpiezaNuevo").dialog('close');
                  $("#dialogAlertFiltroLimpieza p").text('Se ha creado correctamente el filtro de limpieza')
                  $("#dialogAlertFiltroLimpieza").dialog('open')
                }
                  
            },
            error: function(jqXHR, exception){
              $("#dialogFiltroLimpiezaNuevo").dialog('close');
              $("#dialogAlertFiltroLimpieza p").text(exception)
              $("#dialogAlertFiltroLimpieza").dialog('open')
            }
          });         
        },
        "Cancelar": function() {
          $("#dialogFiltroLimpiezaNuevo").dialog('close');
        }
      },
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      }
  }); 

  $("#dialogFiltroNuevo").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function() {
          $.ajax({
            method: "POST",
            url: baseurl + "nuevoFiltro",
            data: {
              idActividad: $("#idActividadFiltro").val(),
              descripcion: $("#descFiltroNuevo").val(), 
              numero: $("#numeroFiltroNuevo").val(),                        
            },
            success: function(data){              
                if(data === "error")
                {
                  $("#dialogFiltroNuevo").dialog('close');
                  $("#dialogAlertFiltroLimpieza p").text('Error al procesar la petición, consulte con el administrador')
                  $("#dialogAlertFiltroLimpieza").dialog('open')                                
                }
                else
                {
                  $("#dialogFiltroNuevo").dialog('close');
                  $("#dialogAlertFiltroLimpieza p").text('Se ha creado correctamente el filtro')
                  $("#dialogAlertFiltroLimpieza").dialog('open')
                }
                  
            },
            error: function(jqXHR, exception){
              $("#dialogFiltroNuevo").dialog('close');
              $("#dialogAlertFiltroLimpieza p").text(exception)
              $("#dialogAlertFiltroLimpieza").dialog('open')
            }
          });         
        },
        "Cancelar": function() {
          $("#dialogFiltroNuevo").dialog('close');
        }
      },
      autoOpen: false,
      show: 
      {
        effect: "blind",
        duration: 500
      },
      hide: 
      {
        effect: "blind",
        duration: 500
      }
  }); 

  $("#dialogFiltroLimpieza").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() 
          {
            $(".idFiltroLimpiezaEdita").text($(".nombreFiltroLimpieza").val())
            $("#idBaseFiltroLimpiezaEdita").val($("#idBaseFiltroLimpieza").val())  

            
            $("#dialogEditaFiltroLimpieza").dialog( "open" );   
          },        
          "Cancelar": function() {
            $("#dialogFiltroLimpieza").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogFiltro").dialog(
  { 
        modal: true,
        buttons: {
          "Ok": function() 
          { 
            $(".idFiltroEdita").val($(".idBaseFiltro").val())
            $("#idBaseFiltroEdita").val($("#idBaseFiltro").val())  
            
            $("#dialogEditaFiltro").dialog( "open" );   
          },        
          "Cancelar": function() {
            $("#dialogFiltro").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogCondicion").dialog(
  { 
          modal: true,
          buttons: {
            "Ok": function() 
            { 
              // $(".idFiltroEdita").val($(".idBaseFiltro").val())
              // $("#idBaseFiltroEdita").val($("#idBaseFiltro").val())  
              
              $("#dialogEditaCondicion").dialog( "open" );   
            },        
            "Cancelar": function() {
              $("#dialogCondicion").dialog('close');
            }
          },
          autoOpen: false,
          show: 
          {
            effect: "blind",
            duration: 500
          },
          hide: 
          {
            effect: "blind",
            duration: 500
          }
  });
  

  $("#dialogEliminaFiltro").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() {
            $.ajax({
              method: "POST",
              url: baseurl + "eliminaFiltro",
              data: { id: $("#idBaseFiltroElimina").val() },
              success: function(data){              
                  if(data === "error")
                  {
                    $("#dialogEliminaFiltro").dialog('close');
                    $("#dialogAlertFiltroLimpieza p").text('Error al eliminar filtro, consulte con el administrador')
                    $("#dialogAlertFiltroLimpieza").dialog('open')                                
                  }
                  else
                  {
                    $("#dialogEliminaFiltro").dialog('close');
                    $("#dialogAlertFiltroLimpieza p").text('Se ha eliminado el filtro correctamente')
                    $("#dialogAlertFiltroLimpieza").dialog('open')
                  }
                    
              },
              error: function(jqXHR, exception){
                $("#dialogEliminaFiltro").dialog('close');
                $("#dialogAlertFiltroLimpieza p").text(exception)
                $("#dialogAlertFiltroLimpieza").dialog('open')
              }
            });         
          },
          "Cancelar": function() {
            $("#dialogEliminaFiltro").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogEliminaCondicion").dialog(
  {
          modal: true,
          buttons: {
            "Ok": function() {
              $.ajax({
                method: "POST",
                url: baseurl + "eliminaCondicion",
                data: { id: $("#idBaseCondicionElimina").val() },
                success: function(data){              
                    if(data === "error")
                    {
                      $("#dialogEliminaCondicion").dialog('close');
                      $("#dialogAlertFiltroLimpieza p").text('Error al eliminar condicion, consulte con el administrador')
                      $("#dialogAlertFiltroLimpieza").dialog('open')                                
                    }
                    else
                    {
                      $("#dialogEliminaCondicion").dialog('close');
                      $("#dialogAlertFiltroLimpieza p").text('Se ha eliminado la condición correctamente')
                      $("#dialogAlertFiltroLimpieza").dialog('open')
                    }
                      
                },
                error: function(jqXHR, exception){
                  $("#dialogEliminaCondicion").dialog('close');
                  $("#dialogAlertFiltroLimpieza p").text(exception)
                  $("#dialogAlertFiltroLimpieza").dialog('open')
                }
              });         
            },
            "Cancelar": function() {
              $("#dialogEliminaCondicion").dialog('close');
            }
          },
          autoOpen: false,
          show: 
          {
            effect: "blind",
            duration: 500
          },
          hide: 
          {
            effect: "blind",
            duration: 500
          }
  });

  $("#dialogEditaFiltroLimpieza").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function () {
          $.ajax({
            method: "POST",
            url: baseurl + "editaFiltroLimpieza",
            data: {
              idFiltroLimpieza: $("#idBaseFiltroLimpieza").val(),            
              nombre: $("#nombreFiltroLimpieza").val(),
              activo: $("#activoFilLimpi").prop('checked')
            },
            success: function (data) {
              if (data === "error") {
                $("#dialogEditaFiltroLimpieza").dialog('close');
                $("#dialogAlertFiltroLimpieza p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlertFiltroLimpieza").dialog('open')
              }
              else {
                $("#dialogEditaFiltroLimpieza").dialog('close');
                $("#dialogAlertFiltroLimpieza p").text('Se ha editado el filtro de limpieza correctamente')
                $("#dialogAlertFiltroLimpieza").dialog('open')
              }
            },
            error: function (jqXHR, exception) {
              $("#dialogEditaFiltroLimpieza").dialog('close');
              $("#dialogAlertFiltroLimpieza p").text(exception)
              $("#dialogAlertFiltroLimpieza").dialog('open')
            }
          });
        },
        "Cancelar": function () {
          $("#dialogEditaFiltroLimpieza").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogEditaFiltro").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function () {
            $.ajax({
              method: "POST",
              url: baseurl + "editaFiltro",
              data: {
                idFiltro: $("#idBaseFiltro").val(),            
                descripcion: $("#descripcionFiltro").val(),
                numero: $("#numFiltro").val(),
                
              },
              success: function (data) {
                if (data === "error") {
                  $("#dialogEditaFiltro").dialog('close');
                  alert('Error al procesar la petición, consulte con el administrador')
                  window.location.href = baseurl + "filtrosLimpieza";
                  
                }
                else {
                  $("#dialogEditaFiltro").dialog('close');
                 alert('Se ha editado el filtro correctamente')
                 window.location.href = baseurl + "filtrosLimpieza";
                }
              },
              error: function (jqXHR, exception) {
                $("#dialogEditaFiltro").dialog('close');
                alert(exception)
              }
            });
          },
          "Cancelar": function () {
            $("#dialogEditaFiltroLimpieza").dialog('close');
          }
        },
        autoOpen: false,
        show:
        {
          effect: "blind",
          duration: 500
        },
        hide:
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogEditaCondicion").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function () {
            $.ajax({
              method: "POST",
              url: baseurl + "editaCondicion",
              data: {
                idCondicion: $("#idBaseCondicion").val(),            
                columna: $("#columnaCondicion").val(),
                condicion: $("#condicionCondicion").val(),
                valor: $("#valorCondicion").val()
                
              },
              success: function (data) {
                if (data === "error") {
                  $("#dialogEditaCondicion").dialog('close');
                  alert('Error al procesar la petición, consulte con el administrador')
                  window.location.href = baseurl + "filtrosLimpieza";
                  
                }
                else {
                  $("#dialogEditaCondicion").dialog('close');
                  alert('Se ha editado la condición correctamente')
                  window.location.href = baseurl + "filtrosLimpieza";
                }
              },
              error: function (jqXHR, exception) {
                $("#dialogEditaCondicion").dialog('close');
                alert(exception)
              }
            });
          },
          "Cancelar": function () {
            $("#dialogEditaCondicion").dialog('close');
          }
        },
        autoOpen: false,
        show:
        {
          effect: "blind",
          duration: 500
        },
        hide:
        {
          effect: "blind",
          duration: 500
        }
  });
  
  $("#dialogEliminaFiltroLimpieza").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() {
            $.ajax({
              method: "POST",
              url: baseurl + "eliminaFiltroLimpieza",
              data: { id: $("#idBaseFiltroLimpiezaElimina").val() },
              success: function(data){              
                  if(data === "error")
                  {
                    $("#dialogEliminaFiltroLimpieza").dialog('close');
                    $("#dialogAlertFiltroLimpieza p").text('Error al eliminar filtro, consulte con el administrador')
                    $("#dialogAlertFiltroLimpieza").dialog('open')                                
                  }
                  else
                  {
                    $("#dialogEliminaFiltroLimpieza").dialog('close');
                    $("#dialogAlertFiltroLimpieza p").text('Se ha eliminado el filtro correctamente')
                    $("#dialogAlertFiltroLimpieza").dialog('open')
                  }
                    
              },
              error: function(jqXHR, exception){
                $("#dialogEliminaFiltroLimpieza").dialog('close');
                $("#dialogAlertFiltroLimpieza p").text(exception)
                $("#dialogAlertFiltroLimpieza").dialog('open')
              }
            });         
          },
          "Cancelar": function() {
            $("#dialogEliminaFiltroLimpieza").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogCondicionNuevo").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function() {
            $.ajax({
              method: "POST",
              url: baseurl + "nuevaCondicion",
              data: {
                idFiltro: $("#idFiltroCondicion").val(),
                columna: $("#columnaCondicion").val(), 
                condicion: $("#condCondicion").val(),                 
                valor: $("#valorCondicion").val(),                        
              },
              success: function(data){              
                  if(data === "error")
                  {
                    $("#dialogCondicionNuevo").dialog('close');
                    $("#dialogAlertFiltroLimpieza p").text('Error al procesar la petición, consulte con el administrador')
                    $("#dialogAlertFiltroLimpieza").dialog('open')                                
                  }
                  else
                  {
                    $("#dialogCondicionNuevo").dialog('close');
                    $("#dialogAlertFiltroLimpieza p").text('Se ha creado correctamente la condición')
                    $("#dialogAlertFiltroLimpieza").dialog('open')
                  }
                    
              },
              error: function(jqXHR, exception){
                $("#dialogCondicionNuevo").dialog('close');
                $("#dialogAlertFiltroLimpieza p").text(exception)
                $("#dialogAlertFiltroLimpieza").dialog('open')
              }
            });         
          },
          "Cancelar": function() {
            $("#dialogCondicionNuevo").dialog('close');
          }
        },
        autoOpen: false,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  }); 

  $("#dialogAlertReasigna").dialog(
  {
      dialogClass: "no-close",
      modal: true,
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      },
      buttons: {
        "Ok": function ()
        {
          window.location.href = baseurl + "cuentasLiberadas";
        }
      }
  });

  $("#dialogConfirmaReasigna").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          $.ajax({
            method: "POST",
            url: baseurl + "reasignaCuenta",
            data: { idCuenta: $("#idBaseReasigna").val(), cuenta: $("#cuentaReasigna").val()},
            success: function (data)
            {
              if (data === "error")
              {
                $("#dialogConfirmaReasigna").dialog('close');
                $("#dialogAlertReasigna p").text('Error al procesar la petición, consulte con el administrador')
                $("#dialogAlertReasigna").dialog('open')
              }
              else
              {
                $("#dialogConfirmaReasigna").dialog('close');
                $("#dialogAlertReasigna p").text('Se ha reasignado la cuenta correctamente')
                $("#dialogAlertReasigna").dialog('open')
              }

            },
            error: function (jqXHR, exception)
            {
              $("#dialogConfirmaReasigna").dialog('close');
              $("#dialogAlertReasigna p").text(exception)
              $("#dialogAlertReasigna").dialog('open')
            }
          });
        },
        "Cancelar": function ()
        {
          $("#dialogConfirmaReasigna").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogImagenSipre").dialog(
  {
        modal: true,
        width: 1000,
        height: 700,
        buttons: {
          "Cancelar": function ()
          {
            $("#dialogImagenSipre").dialog('close');
          }
        },
        autoOpen: false,
        show:
        {
          effect: "blind",
          duration: 500
        },
        hide:
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogImagenDocumento").dialog(
    {
          modal: true,
          width: 1200,
          height: 700,
          buttons: {
            // "Zoom": function()
            // {
            //   $("#dialogImagenDocumento").parent().css("zoom", "250%")
            //   $("#dialogImagenDocumento").parent().css("top", "0px")
            //   $("#dialogImagenDocumento").parent().css("left", "0px")
            // },
            "Cancelar": function ()
            {
              $("#dialogImagenDocumento").dialog('close');
            }
          },
          autoOpen: false,
          show:
          {
            effect: "blind",
            duration: 500
          },
          hide:
          {
            effect: "blind",
            duration: 500
          }
    });
  

  $("#dialogReasignaOrden").dialog(
  {
        modal: true,
        buttons: {
          "Ok": function ()
          {
            if($("#ordenReasigna").val() != "")
            {
              $.ajax({
                method: "POST",
                url: baseurl + "reasignaOrden",
                data: { orden: $("#ordenReasigna").val()},
                success: function (data)
                {
                  if (data === "error")
                  {
                    $("#dialogReasignaOrden").dialog('close');
                    alert("Error al reasignar la orden")
                  }
                  else if(data === "no")
                  {
                    $("#dialogReasignaOrden").dialog('close');
                    alert("No se encontó la orden")
                  }
                  else
                  {
                    $("#dialogReasignaOrden").dialog('close');
                    $("#ordenReasigna").val("")
                    alert("Orden reasignada correctamente")
                  }
    
                },
                error: function (jqXHR, exception)
                {
                  $("#dialogReasignaOrden").dialog('close');
                  alert("Error al reasignar la orden")
                }
              });
            }            
            else
              alert("El campo no puede estar vacío")
          },
          "Cancelar": function ()
          {
            $("#dialogReasignaOrden").dialog('close');
          }
        },
        autoOpen: false,
        show:
        {
          effect: "blind",
          duration: 500
        },
        hide:
        {
          effect: "blind",
          duration: 500
        }
  });

  $("#dialogReasignaOrdenMas").dialog(
  {
      modal: true,
      autoOpen: false,
      width: 600,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogAsignaError").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          if($("#skillAsignaError").val() != "")
          {
            $.ajax({
              method: "POST",
              url: baseurl + "asignaOrdenesError",
              data: { skill: $("#skillAsignaError").val()},
              success: function (data)
              {
                if (data === "error")
                {
                  $("#dialogAsignaError").dialog('close');
                  alert("Error asignar las ordenes")
                }                
                else
                {
                  $("#dialogAsignaError").dialog('close');
                  $("#skillAsignaError").val("")
                  alert("Órdenes reasignadas correctamente")
                }
  
              },
              error: function (jqXHR, exception)
              {
                $("#dialogAsignaError").dialog('close');
                alert("Error al reasignar las órdenes")
              }
            });
          }            
          else
            alert("El campo no puede estar vacío")
        },
        "Cancelar": function ()
        {
          $("#dialogAsignaError").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogOrdenesAsignadas").dialog(
  {
          modal: true,
          buttons: {
            "Ok": function ()
            {
              alert("Se esta procesando su solicitud")
              if($("#fechaIniAsignadas").val() != "" || $("#fechaFinAsignadas").val() != "")
              {
                $.ajax({
                  method: "POST",
                  url: baseurl + "excelAsignadas",
                  data: { fechaIni: $("#fechaIniAsignadas").val(), fechaFin: $("#fechaFinAsignadas").val()},
                  success: function (data)
                  {
                    if (data === "error")
                    {
                      $("#dialogOrdenesAsignadas").dialog('close');
                      alert("Error en la descarga")
                    }
                    else
                    {
                      var win = window.open('', '_blank');
                      $('<iframe src="ReporteAsignado.xlsx"></iframe>').appendTo('body').hide()
                      $("#dialogOrdenesAsignadas").dialog('close');
                      $("#fechaIniAsignadas").val("")
                      $("#fechaFinAsignadas").val("")                      
                    }
      
                  },
                  error: function (jqXHR, exception)
                  {
                    $("#dialogOrdenesAsignadas").dialog('close');
                    alert("Error en la descarga")
                  }
                });
              }            
              else
                alert("Las fechas no pueden estar vacías")
            },
            "Cancelar": function ()
            {
              $("#dialogOrdenesAsignadas").dialog('close');
            }
          },
          autoOpen: false,
          show:
          {
            effect: "blind",
            duration: 500
          },
          hide:
          {
            effect: "blind",
            duration: 500
          }
  });
  
  $("#dialogInfoAsignadas").dialog(
  {
            modal: true,
            buttons: {
              "Ok": function ()
              {
                alert("Se esta procesando su solicitud")
                if($("#fechaIniInfoAsignadas").val() != "" || $("#fechaFinInfoAsignadas").val() != "")
                {
                  $.ajax({
                    method: "POST",
                    url: baseurl + "excelInfoAsignadas",
                    data: { fechaIni: $("#fechaIniInfoAsignadas").val(), fechaFin: $("#fechaFinInfoAsignadas").val()},
                    success: function (data)
                    {
                      if (data === "error")
                      {
                        $("#dialogInfoAsignadas").dialog('close');
                        alert("Error en la descarga")
                      }
                      else
                      {
                        var win = window.open('', '_blank');
                        $('<iframe src="ReporteInfoAsignado.xlsx"></iframe>').appendTo('body').hide()
                        $("#dialogInfoAsignadas").dialog('close');
                        $("#fechaIniInfoAsignadas").val("")
                        $("#fechaFinInfoAsignadas").val("")                      
                      }
        
                    },
                    error: function (jqXHR, exception)
                    {
                      $("#dialogInfoAsignadas").dialog('close');
                      alert("Error en la descarga")
                    }
                  });
                }            
                else
                  alert("Las fechas no pueden estar vacías")
              },
              "Cancelar": function ()
              {
                $("#dialogInfoAsignadas").dialog('close');
              }
            },
            autoOpen: false,
            show:
            {
              effect: "blind",
              duration: 500
            },
            hide:
            {
              effect: "blind",
              duration: 500
            }
  });

  $("#dialogSinTrabajar").dialog(
    {
              modal: true,
              buttons: {
                "Ok": function ()
                {
                  alert("Se esta procesando su solicitud")
                  $(".se-pre-con").fadeIn();
                  if($("#fechaIniSinTrabajar").val() != "" || $("#fechaFinSinTrabajar").val() != "")
                  {
                    $.ajax({
                      method: "POST",
                      url: baseurl + "excelSinTrabajar",
                      data: { fechaIni: $("#fechaIniSinTrabajar").val(), fechaFin: $("#fechaFinSinTrabajar").val()},
                      success: function (data)
                      {
                        if (data === "error")
                        {
                          $("#dialogSinTrabajar").dialog('close');
                          $(".se-pre-con").fadeOut("slow");
                          alert("Error en la descarga")
                        }
                        else
                        {
                          $(".se-pre-con").fadeOut("slow");
                          var win = window.open('', '_blank');
                          $('<iframe src="ReporteInfoSinTrabajar.xlsx"></iframe>').appendTo('body').hide()
                          $("#dialogSinTrabajar").dialog('close');
                          $("#fechaIniSinTrabajar").val("")
                          $("#fechaFinSinTrabajar").val("")                      
                        }
          
                      },
                      error: function (jqXHR, exception)
                      {
                        $("#dialogSinTrabajar").dialog('close');
                        $(".se-pre-con").fadeOut("slow");
                        alert("Error en la descarga")
                      }
                    });
                  }            
                  else
                  {
                    $(".se-pre-con").fadeOut("slow");
                    alert("Las fechas no pueden estar vacías")
                  }
                    
                },
                "Cancelar": function ()
                {
                  $("#dialogSinTrabajar").dialog('close');
                }
              },
              autoOpen: false,
              show:
              {
                effect: "blind",
                duration: 500
              },
              hide:
              {
                effect: "blind",
                duration: 500
              }
    });
    
  $("#dialogReporteBotExcel").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          alert("Se esta procesando su solicitud")
          if ($("#fechaIniExcel").val() != "" || $("#fechaFinExcel").val() != "")
          {
            $.ajax({
              method: "POST",
              url: baseurl + "reportesRobotExcel",
              data: { fechaIni: $("#fechaIniExcel").val(), fechaFin: $("#fechaFinExcel").val(), estatus: $("#estatusOrdenesExcel").val() },
              success: function (data)
              {
                if (data === "error")
                {
                  $("#dialogReporteBotExcel").dialog('close');
                  alert("Error en la descarga")
                }
                else
                {
                  var win = window.open('', '_blank');
                  $('<iframe src="ReporteRobot.xlsx"></iframe>').appendTo('body').hide()
                  $("#dialogReporteBotExcel").dialog('close');
                  $("#fechaIniExcel").val("")
                  $("#fechaFinExcel").val("")
                }

              },
              error: function (jqXHR, exception)
              {
                $("#dialogReporteBotExcel").dialog('close');
                alert("Error en la descarga")
              }
            });
          }
          else
            alert("Las fechas no pueden estar vacías")
        },
        "Cancelar": function ()
        {
          $("#dialogReporteBotExcel").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });


  $("#dialogReporteBotExcelPorHora").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          alert("Se esta procesando su solicitud")
          if ($("#fechaIniExcelPorHora").val() != "" || $("#fechaFinExcelPorHora").val() != "")
          {
            $.ajax({
              method: "POST",
              url: baseurl + "reporteRobotExcelHora",
              data: { fechaIni: $("#fechaIniExcelPorHora").val(), fechaFin: $("#fechaFinExcelPorHora").val() },
              success: function (data)
              {
                if (data === "error")
                {
                  $("#dialogReporteBotExcelPorHora").dialog('close');
                  alert("Error en la descarga")
                }
                else
                {
                  var win = window.open('', '_blank');
                  $('<iframe src="ReporteRobotPorHora.xlsx"></iframe>').appendTo('body').hide()
                  $("#dialogReporteBotExcelPorHora").dialog('close');
                  $("#fechaIniExcelPorHora").val("")
                  $("#fechaFinExcelPorHora").val("")
                }

              },
              error: function (jqXHR, exception)
              {
                $("#dialogReporteBotExcelPorHora").dialog('close');
                alert("Error en la descarga")
              }
            });
          }
          else
            alert("Las fechas no pueden estar vacías")
        },
        "Cancelar": function ()
        {
          $("#dialogReporteBotExcelPorHora").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });

  $("#dialogReporteValExcel").dialog(
  {
      modal: true,
      buttons: {
        "Ok": function ()
        {
          alert("Se esta procesando su solicitud")
          if ($("#fechaIniExcel").val() != "" || $("#fechaFinExcel").val() != "")
          {
            $.ajax({
              method: "POST",
              url: baseurl + "reportesValExcel",
              data: { fechaIni: $("#fechaIniExcel").val(), fechaFin: $("#fechaFinExcel").val(), validador: $("#validadorPickerExcel").val()},
              success: function (data)
              {
                if (data === "error")
                {
                  $("#dialogReporteValExcel").dialog('close');
                  alert("Error en la descarga")
                }
                else
                {
                  var win = window.open('', '_blank');
                  $('<iframe src="ReporteValidador.xlsx"></iframe>').appendTo('body').hide()
                  $("#dialogReporteValExcel").dialog('close');
                  $("#fechaIniExcel").val("")
                  $("#fechaFinExcel").val("")
                }

              },
              error: function (jqXHR, exception)
              {
                $("#dialogReporteValExcel").dialog('close');
                alert("Error en la descarga")
              }
            });
          }
          else
            alert("Las fechas no pueden estar vacías")
        },
        "Cancelar": function ()
        {
          $("#dialogReporteValExcel").dialog('close');
        }
      },
      autoOpen: false,
      show:
      {
        effect: "blind",
        duration: 500
      },
      hide:
      {
        effect: "blind",
        duration: 500
      }
  });
  
  $("#dialogCargaArchivoLimpieza").dialog(
  {
        modal: true,        
        autoOpen: false,
        width: 600,
        show: 
        {
          effect: "blind",
          duration: 500
        },
        hide: 
        {
          effect: "blind",
          duration: 500
        }
  });
    
  // $('#fechaIniLiberacion').datetimepicker(
  //   {
  //     format:'Y-m-d H:i',
  //     onShow:function( ct ){
  //      this.setOptions({
  //       maxDate:jQuery('#fechaFinLiberacion').val()?jQuery('#fechaFinLiberacion').val():false
  //      })
  //     },      
  //   }
  // );

  // $('#fechaFinLiberacion').datetimepicker(
  //   {
  //     format:'Y-m-d H:i',
  //     onShow:function( ct ){
  //      this.setOptions({
  //       minDate:jQuery('#fechaIniLiberacion').val()?jQuery('#fechaIniLiberacion').val():false
  //      })
  //     },      
  //   }
  // );

  $("#reporteLibPen").on("click", function(e)
  {
    $.ajax(
      {
        url: "/excelLiberadasPendientes",
        type: "POST",
        success : function(data)
        {
          if(data == "OK")
          {
            var win = window.open('', '_blank');
            $('<iframe src="ReporteLiberadasPendientes.xlsx"></iframe>').appendTo('body').hide()
          }
          else
            alert("Error en la descarga")
        },
        error: function()
        {
          alert("Error en la descarga")
        }
      }
    )
  })  

  $("#promedioVal").on("click", function(e)
  {
    window.location.href = baseurl + "promediosVal";
  })

  $("#asignacionManual").on("click", function(e)
  {
    $(this).prop('disabled', true);
    $.ajax(
      {
        url: "/asignacionManual",
        type: "POST",
        success : function(data)
        {
          if (data == "OK")
          {
            alert("Órdenes asignadas correctamente")
            $("#asignacionManual").prop('disabled', false);
          }
          else
            alert("Error en la asignación")
            $("#asignacionManual").prop('disabled', false);
        },
        error: function ()
        {
          alert("Error en la asignación")
          $("#asignacionManual").prop('disabled', false);
        }
      }
    )
  }) 

  $("#reporteLiberadasPendiente").on("click", function(e)
  {
    $.ajax(
      {
        url: "/excelLiberadasPendientes",
        type: "POST",
        success : function(data)
        {
          if(data == "OK")
          {
            var win = window.open('', '_blank');
            $('<iframe src="ReporteLiberadasPendientes.xlsx"></iframe>').appendTo('body').hide()
          }
          else
            alert("Error en la descarga")
        },
        error: function()
        {
          alert("Error en la descarga")
        }
      }
    )
  })

  $("#porAsignarBtn").on("click", function(e)
  {
    $.ajax(
      {
        url: "/excelPorAsignar",
        type: "POST",
        success : function(data)
        {
          if(data == "OK")
          {
            var win = window.open('', '_blank');
            $('<iframe src="ReportePorAsignar.xlsx"></iframe>').appendTo('body').hide()
          }
          else
            alert("Error en la descarga")
        },
        error: function()
        {
          alert("Error en la descarga")
        }
      }
    )
  }) 

  $("#limpiarOrdenesBtn").on("click", function(e)
  {
    $("#dialogCargaArchivoLimpieza").dialog("open");

    // $.ajax(
    //   {
    //     url: "/limpiaOrdenes",
    //     type: "POST",
    //     success: function (data)
    //     {
    //       if (data == "ok")
    //       {
    //         alert("Se han limpiado las ordenes")
    //       }
    //       else if (data == "no")
    //       {
    //         alert("No hay ordenes por limpiar")
    //       }
    //       else
    //         alert("Error en la limpieza")
    //     },
    //     error: function ()
    //     {
    //       alert("Error en la limpieza")
    //     }
    //   })
  })  

  
  
  $("#fechaIniAsignadas").datepicker({
    dateFormat: 'yy-mm-dd'
  })
  
  $("#fechaFinAsignadas").datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: $("#fechaIniAsignadas").val()
  })

  $("#fechaIniInfoAsignadas").datepicker({
    dateFormat: 'yy-mm-dd'
  })
  
  $("#fechaFinInfoAsignadas").datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: $("#fechaIniInfoAsignadas").val()
  })

  $( "#fechaIni" ).datepicker({
    dateFormat: 'yy-mm-dd'
  });

  $( "#fechaFin" ).datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: $("#fechaIni").val()
  });

  $( "#fechaIniExcel" ).datepicker({
    dateFormat: 'yy-mm-dd'
  });

  $( "#fechaFinExcel" ).datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: $("#fechaIniExcel").val()
  });

  $( "#fechaIniExcelPorHora" ).datepicker({
    dateFormat: 'yy-mm-dd'
  });

  $( "#fechaFinExcelPorHora" ).datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: $("#fechaIniExcelPorHora").val()
  });

  $( "#fechaIniSinTrabajar" ).datepicker({
    dateFormat: 'yy-mm-dd'
  });

  $( "#fechaFinSinTrabajar" ).datepicker({
    dateFormat: 'yy-mm-dd',
    minDate: $("#fechaIniSinTrabajar").val()
  });

  $("#tablaFiltros").hide()

  $("#agregaFiltro").hide()

  $("#agregaCondicion").hide()

  $("#tablaCondiciones").hide()
  
});


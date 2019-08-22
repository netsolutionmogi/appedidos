$(document).ready(function () {
         document.addEventListener("deviceready", onDeviceReady, true); 
    });
function onDeviceReady() 
{	
mostrar_pedidos();
}
function recuperarcomanda()
 {
		  
	 $.ajax({
	  url: "http://netsolutionmogi.com/php/recuperarcomanda.php",
	   type: "GET",
		dataType: "html",
		 success: function (response) 
		 {
					$("#numerocomanda").html(pad(response,2));
					$("input[id*='numerocomanda']").val(pad(response,2));
		  },
		  error: function (response) 
		  {
		     console.log(response);
		  }
		});
	return false;
		  
}

function recuperarmesa()
 {
		  
	 $.ajax({
	  url: "http://netsolutionmogi.com/php/numeromesa.php",
	   type: "GET",
		dataType: "html",
		 success: function (response) 
		 {
					$("#numeromesa").html(pad(response,2));
				    //var numeromesa = $("#numeromesa").val(); 
	                $("input[id*='numeromesa']").val(pad(response,2));
		  },
		  error: function (response) 
		  {
		     console.log(response);
		  }
		});
	return false;
		  
}
function somar()
	{
		
	  $.ajax({
        url: "http://netsolutionmogi.com/php/soma.php",
         type: "GET",
         dataType: "html",
		 
          success: function (response) 
		  {
                $("#total").html(response);
           },
           error: function (response) 
		   {
             console.log(response);
            }
        });
		return false;
	  
    }

function mostrar_pedidos()
	{
	
	   $.ajax(
		{
			 type: "POST",
			method:"POST",
			dataType:'json',
		    async: false,
			cache:false,
			 async: false,
			url:"http://netsolutionmogi.com/php/pedidos.php",
		
		
		success: function(response)
		{
		 
		        recuperarmesa();
				recuperarcomanda();
				listar_pedidos(response);
				somar();
				
				console.log(response);	
		
		},
		complete: function()
		{
			
			
		
		}
			
		});
			return false;

	}
	function listar_pedidos(response)
	{
		
		//faço um foreach percorrendo todos os inputs com a class soma e faço a soma na var criada acima
         
		 if(response!= "")
		 {
			   
			  var item = [];
             var tr;
		     
			 $("#tabela_body").empty();
			
			  $.each(response, function(i, item) 
			 {
				   var Produto=item.Produto;
				   var QUANTIDADE=item.QUANTIDADE;
				   var PRECO=item.PRECO;
				   var SUBTOTAL=item.SUBTOTAL;
				   
				 
				  
				  $("#tabela_body").append( 
					    '<tr>'+
					    '<td class="col-md-1 col-lg-1 col-sm-1 col-xs-1" align="center">'  + Produto + ' </td>'+
					    ' <td class="col-md-1 col-lg-1 col-sm-2 col-xs-1" align="center">' +
						'<input type="text" size="3"  id="quantidade" name="quantidade" value="' + QUANTIDADE+  '" class="inputqtde">' +
						'</td>' +
					    '<td class="col-md-1 col-lg-1 col-sm-1 col-xs-1" align="center">R$ ' + parseFloat(+PRECO).toFixed(2)+ '</td>'+
					    '<td class="col-md-1 col-lg-1 col-sm-1 col-xs-1" align="center">R$ ' + parseFloat(+SUBTOTAL).toFixed(2)+ '</td>'+
					    '<td class="col-md-1 col-lg-1 col-sm-1 col-xs-1"  align="center">'+
						'</tr>')
				
				});
				
			}
		 else
		 {
			 
		  $("#tabela_body").append(
					
			 ' <tr>' +
		     ' <td colspan="4" width="228" align="left"><h2 style="font-weight:bold"><center>Nenhum Pedido efetuado.</center></h2>' +
			  '</td>' + 
			  ' </tr>');
	    	 }	
	
	
	}
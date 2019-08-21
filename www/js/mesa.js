 $(document).ready(function () {
         document.addEventListener("deviceready", onDeviceReady, true); 
    });
function onDeviceReady() 
{	
carregarmesas();
}
    
$(document).ready(function()
	{
		
		
    $("#mesas").on('click','[data-action="shred"]',function (e)
	  {
		
		e.preventDefault();
		var numeromesa    = $(this).attr('data-numeromesa');	
		var button        = $(this).attr('name');
		
	   })  
});	
function carregarmesas()
 {
	$("#carregar").hide(); 

	$.ajax(
		{
			type:"GET",
			method:"GET",
			dataType:'html',
			cache:false,
			 async: false,
			  url:"http://netsolutionmogi.com/pedidos/php/mesa.php",
			  beforeSend: function(response)
		{
			$("#carregar").show(); 
		  $("#carregar").fadeIn("slow",function()
			 { 		
			$("#carregar").delay(2000).show(); 
			// $("#carregar").empty().html('<img src="img/carregando_mini.gif" class="img-responsive" style="width:7%;height:7%">');
			 });	
		
		},

		success: function(response)
		{
			
			    $("#mesas").empty().load('http://netsolutionmogi.com/pedidos/php/mesa.php');
			    
				
				console.log(response);
		
		},
		complete: function()
		{
			
           $("#carregar").hide(); 
		      
		}
			
		});
			return false;
	
 }
	
	function redireciona(numeromesa)
	{
	 
	//window.location.href = 'index1.html?numeromesa='+numeromesa;
	window.location.href = 'index1.html';
	}
	
	function gerarmesa(numeromesa)
	   {
		numeromesa : $("#numeromesa").val();

        var dados = {
        numeromesa  : numeromesa 
    }
		
		$.ajax(
		{
			type:"POST",
			method:"POST",
			dataType:'html',
			cache:false,
			 async: false,
			  url:"http://netsolutionmogi.com/pedidos/php/gerarnumeromesa.php",
			 data: dados,
		success: function(response)
		{
			
			//alert("A Mesa é: "+ numeromesa);	
				
			    $("#numeromesas").empty().load('http://netsolutionmogi.com/pedidos/php/gerarnumeromesa.php');
			    	
			$("#resposta").html(numeromesa);
				console.log(response);
			window.setTimeout(function () 
		   {
			  
			// redireciona(numeromesa);
		 	  window.location = 'index1.html'; 
			}, 1000); 	
		

		},
		complete: function()
		{
			$("#resposta").html(numeromesa);
		
		}
			
		});
			return false;
		
		}	
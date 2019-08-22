$(document).ready(function () {
         document.addEventListener("deviceready", onDeviceReady, true); 
    });
function onDeviceReady() 
{	
carregarcategorias();
}
function pad(str, length)
{
	  const resto = length - String(str).length;
	  return '0'.repeat(resto > 0 ? resto : '0') + str;
}
	
function carregarcategorias()
 {
	
	 
	$("#carregar").hide(); 

	$.ajax(
		{
			type:"GET",
			method:"GET",
			dataType:'html',
			cache:false,
			 async: false,
			  url:"http://netsolutionmogi.com/pedidos/php/categorias.php",
			  beforeSend: function(response)
		{
			$("#carregar").show(); 
		  $("#carregar").fadeIn("slow",function()
			 { 		
			$("#carregar").delay(9000).show(); 
			 $("#carregar").empty().html('<img src="images/carregando_mini.gif" class="img-responsive" style="width:7%;height:7%">');
			 });	
		
		},

		success: function(response)
		{
			
			    $("#categorias").empty().load('http://netsolutionmogi.com/pedidos/php/categorias.php');
				recuperarmesa();
	           recuperarcomanda();
			   contar();
			 somar();
				
				console.log(response);
		
		},
		complete: function()
		{
			
           $("#carregar").hide(); 
		      
		}
			
		});
			return false;
	
 }


function recuperarcomanda()
 {
		  
	 $.ajax({
	  url: "http://netsolutionmogi.com/pedidos/php/recuperarcomanda.php",
	  type:"POST",
			method:"POST",
	   
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
	  url: "http://netsolutionmogi.com/pedidos/php/numeromesa.php",
	   type: "POST",
	   method:"POST",
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
        url: "http://netsolutionmogi.com/pedidos/php/soma.php",
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

   function contar()
	{
	  $.ajax({
        url: "http://netsolutionmogi.com/pedidos/php/contar.php",
         type: "GET",
         dataType: "html",
		
          success: function (response) 
		  {
			  $(".badgee").show();
                $(".badgee").html(response);
           },
           error: function (response) 
		   {  
             console.log(response);
            }
        });
		return false;
	  
    }


$(document).ready(function()
	{
		
		 $("#categorias").on('click','[data-action="shred"]',function (e)
	  {
		
		e.preventDefault();
		var codigo    = $(this).attr('data-id');	
		var button        = $(this).attr('name');
		//alert(button);
		//alert(codigo);
		
	   })  
	   
	  

   $(document).on('click', '#botaocategoria', function(e)
   {
	   e.preventDefault();
	     var codigo    = $(this).attr('data-id');


       // var url = 'index4.html?numeromesa=' + numeromesa + '&numerocomanda=' + numerocomanda + '&&codigo=' + codigo;
	   //var url = 'index4.html?codigo=' + codigo;
	   //window.location.href = url;
 
            var dados = {
				codigo  : codigo 
			}


           $.ajax({
			   type: "GET",
				dataType: "html",
				url: "http://netsolutionmogi.com/pedidos/php/gerarcodigocategorias.php",
				data: dados,
				 success: function (response) 
				 {
					
					   console.log(response);
							
						window.setTimeout(function () 
					   {
						  
						 window.location = 'index4.html'; 
						}, 3000); 		
							
				  },
				  error: function (response) 
				  {
					 console.log(response);
				  }
				});
			return false;


	});
	   
$("#finalizar").on('click',function (e)
  {
		e.preventDefault();	
		 
		window.location="index6.html";
		return false;
	  });
	

 	// var variaveis=location.search.split("?");
  // var quebra = variaveis[1].split("=");
	//		var numeromesa = + quebra[1];
			//alert(numeromesa);
			
	//		 var url=location.search.split("?");
	//		var quebraurl = variaveis[2].split("=");
	//		var numerocomanda = + quebraurl[1];
		
		
		
	//     var numeromesa    = $("#numeromesa").val(numeromesa);
	//	 var numerocomanda    = $("#numerocomanda").val(numerocomanda);
	 // alert(numeromesa);
	   // var URL='php/recuperamesa.php';
       // var dataString = 'numeromesa=' + numeromesa ;
	   
      // $("#numeromesa").append(numeromesa);
	 //  var numeromesa = document.getElementById("numeromesa").innerHTML = pad(numeromesa.val(),2);
	//   var numerocomanda = document.getElementById("numerocomanda").innerHTML = pad(numerocomanda.val(),2);
	   
	   

      $("input").focus(function(){
        $(this).parent().addClass("is-focused");
        $("i[data-input='"+$(this).attr('name')+"']").addClass("is-focused");
      })
      .focusout(function(){
        $(this).parent().removeClass("is-focused");
        $("i[data-input='"+$(this).attr('name')+"']").removeClass("is-focused");
      });

      $("input:first").focus();
 

      });
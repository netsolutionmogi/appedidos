 $(document).ready(function () {
         document.addEventListener("deviceready", onDeviceReady, true); 
    });
function onDeviceReady() 
{	
consultar_mesa();
}
  function pad(str, length)
	 {
	  const resto = length - String(str).length;
	  return '0'.repeat(resto > 0 ? resto : '0') + str;
	}  

 function consultar_mesa()
	 {
		 
	$.ajax(
		{
			type:"POST",
			method:"POST",
			dataType:'html',
			cache:false,
			 async: false,
			  url:"http://netsolutionmogi.com/pedidos/php/numeromesa.php",
			 //data: dados,
		success: function(response)
		{
			
			//alert("A Mesa é: "+ numeromesa);	
				
			    //$("#numeromesa").empty().load('http://localhost/apppedidos/pedidos/php/numeromesa.php');
			    	$("#numeromesa").html(pad(response,2));
				    //var numeromesa = $("#numeromesa").val(); 
	                $("input[id*='numeromesa']").val(pad(response,2));
				console.log(response);
				
				
			
		},
		complete: function()
		{
			
		
		}
			
		});
			return false;
		

	}
	
	 $(document).ready(function(){
     

      $("input").focus(function(){
        $(this).parent().addClass("is-focused");
        $("i[data-input='"+$(this).attr('name')+"']").addClass("is-focused");
      })
      .focusout(function(){
        $(this).parent().removeClass("is-focused");
        $("i[data-input='"+$(this).attr('name')+"']").removeClass("is-focused");
      });

      $("input:first").focus();

      $("form").submit(function(e){
        e.preventDefault();
        var empty = 0;
        $("form input").each(function(){
          if(empty == 0){
            if($(this).val().length == 0){ 
              empty = 1;
              $(this).focus();
            }
          }
        });
        if(empty == 0){
          $("input").blur();
		  
		  var numeromesa = $("input[id*='numeromesa']").val();
		  //var numeromesa = $('#numeromesa').val();
		  var numerocomanda = $('#numerocomanda').val();
		 // alert(numeromesa);
		  
		  
		  $.ajax(
		{
			type:"POST",
			method:"POST",
			dataType:'html',
			cache:false,
			 async: false,
			  url:"http://netsolutionmogi.com/pedidos/php/comanda.php",
			  data: "numerocomanda="+ numerocomanda+
        "&numeromesa="+ numeromesa,
			

		success: function(response)
		{
			
			    $("#mesas").empty().load('http://netsolutionmogi.com/pedidos/php/comanda.php');
			    	
				$("#mesas").html(numeromesa);
				console.log(response);
				
				$("#sucesso").html(response);
				
				
				
				window.setTimeout(function () 
					   {
						  
						 window.location = 'index2.html'; 
						}, 3000); 
				
				
		
		},
		complete: function()
		{
           $("#mesas").html(numeromesa);
		      
		}
			
		});
			return false;
		 

        }
      });

      });
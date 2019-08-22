$(document).ready(function () {
         document.addEventListener("deviceready", onDeviceReady, true); 
    });
function onDeviceReady() 
{	
recuperarcodigocategorias();
}

function pad(str, length)
	 {
	  const resto = length - String(str).length;
	  return '0'.repeat(resto > 0 ? resto : '0') + str;
    }

function recuperarcodigocategorias()
 {
		  
	 $.ajax({
	  url: "http://netsolutionmogi.com/pedidos/php/recuperacodigocategorias.php",
	   type: "GET",
		dataType: "html",
		 success: function (response) 
		 {
					$("#CodigoCategoria").html(response);
				    //var numeromesa = $("#numeromesa").val(); 
	                $("input[id*='CodigoCategoria']").val(response);
					recuperarmesa();
					   recuperarcomanda();
						contar();
						somar();
					carregaprodutos();	
					mostrar_pedidos();
						
		  },
		  error: function (response) 
		  {
		     console.log(response);
		  }
		});
	return false;
		  
}


function carregaprodutos()
{		
	$("#carregar").hide(); 
	
	
	 var codigo = $("input[id*='CodigoCategoria']").val();
	
	
	$.ajax(
		{
			type:"GET",
			method:"GET",
			dataType:'html',
			cache:false,
			 async: false,
			 // url:"php/produtos.php",
			  //data: "codigo="+ codigo,
			  beforeSend: function()
		{
			
		//$("#carregar").show(); 
		 //// $("#carregar").fadeIn("slow",function()
			// { 		
			//$("#carregar").show(); 
			// $("#carregar").empty().html('<img src="../admin/dist/img/carregando_mini.gif" class="img-responsive" style="width:7%;height:7%">');
			// });	
			//$("#calculatotal").html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
		 
		},

		success: function(response)
		{
			
			var codigo = $("input[id*='CodigoCategoria']").val();
			
			    $("#produtos").empty().fadeTo('slow',0.8).fadeIn('slow').load('http://netsolutionmogi.com/pedidos/php/produtos.php?codigo='+ codigo);
				//$("#produtos").html(response);
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
	  url: "http://netsolutionmogi.com/pedidos/php/numeromesa.php",
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


$(document).ready(function()
	{
		
		$(".badge").hide();
		
		 
		 $("#produtos").on('click','[data-action="shred"]',function (e)
	  {
		
		e.preventDefault();
		var codigo    = $(this).attr('data-id');	
		var button        = $(this).attr('name');
		
		//alert(codigo);
		
	   });  
	  
	  
	   $('#alterar_quantidade').on('shown.bs.modal', function ()
		{
		 var carregando = $("#alterar_quantidade #carregando").val();
		var sucesso    = $("#alterar_quantidade #sucesso").val();
		$("#alterar_quantidade #carregando").hide();
		$("#alterar_quantidade #sucesso").hide();
		
			
		 });  
		 $('#botaomais').on('click', function (e)
	      {
		  e.preventDefault();
		  
		  var tmp = parseInt($("#alterar_quantidade #quantidade").val());
		  var novoValor = parseInt(tmp,10) + 1; // variavel que decrementa -1
		  $("#alterar_quantidade #quantidade").val(novoValor);
		 
		 });   
		 
		 $('#botaomenos').on('click',function(e)
		 {
		   var  quantidade = parseInt($("#alterar_quantidade #quantidade").val());
	
			if(quantidade > 1)
			{
				var tmp = parseInt($("#alterar_quantidade #quantidade").val());
				 var novoValor = parseInt(tmp,10) - 1; // variavel que decrementa -1
				$("#alterar_quantidade #quantidade").val(novoValor);
			
			}
				
		  });
		  $('#btn_salvar').on('click', function (e)
		  {
			  e.preventDefault();
			  
			  var codigo      = $("input[id*='codigo']").val();
			  var quantidade  = parseInt($("#alterar_quantidade #quantidade").val());
			  //alert(quantidade);
			  
			 $.ajax({
              url:"http://netsolutionmogi.com/pedidos/php/atualizar_pedido.php",
               type:"POST",
				dataType:"html",
				async: false,
		     	cache:false,
				data: {codigo:codigo,quantidade:quantidade},
				 //   data: {quantidade:quantidade},
				
               success: function(response)
			   {
					console.log(response);
					
				$('#tabela_body').fadeIn('slow', function()
			   {	
				  window.setTimeout(function () 
				   {
					  $('#alterar_quantidade').modal('hide');
						mostrar_pedidos(); 
						somar();
						contar();
					}, 100);
					}); 
					
               },
				
				complete: function()
				{
					
				
				},
				 error: function (xhr, msg, err) {
			//	   alert(xhr.status);
                  alert(err);
                // Exibir mensagem de erro, caso aconteça...
                 $("#calculatotal tbody td").html("<center>Erro: Acese a Internet. Tente novamente mais tarde...</center>");
              },
				
          });   
            return false;
		
		 });   

  });  	
 
 
 function rolartopo()
  {
	
	$('html, body').animate({scrollTop:'800'}, 'slow');

}

 
 $(document).on('click', '#pedir', function(e)
   {
	   e.preventDefault();
	     var codigo    = $(this).attr('data-id');
		 rolartopo();
		 
		 var qtdade     = $("#qtdade").val();
		 //var numeromesa     = $("#numeromesa").val();
		 //var numerocomanda  = $("#numerocomanda").val();
		  var numeromesa     = $("input[id*='numeromesa']").val();
		  var numerocomanda  = $("input[id*='numerocomanda']").val();
		  
		 var PrecoVenda     = $(this).attr('data-precovenda');
		 var codigo_pedido    = $(this).attr('data-codigopedido');
		// alert(codigo);
		 
		
		var parametros={"codigo":codigo,"qtdade":qtdade,"numeromesa":numeromesa,"numerocomanda":numerocomanda};	
		$.ajax({
        type: "POST",
		cache:false,
		async: false,
		//url: "./ajax/agregar_pedido.php",
        url: "http://netsolutionmogi.com/pedidos/php/adicionar_carrinho.php",
        data: parametros,
		dataType:"html",
		
			success: function(response)
			{
		    
			
			 console.log(response);
			 contar();
			 somar();
			 mostrar_pedidos();
			 
			
			},
			complete: function()
			{
				
			  
			},
			error: function (xhr, msg, err) {
				   alert(xhr.status);
                   alert(err);
                
              },
		 });
		 
		 return false;
		 
	});	
	
	
	
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
				   var IDPRODUTO=item.IDPRODUTO;
				   var CODIGOCOMPRA=item.CODIGOCOMPRA;
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
						'<button type="button"  data-toggle="modal"  data-target="#alterar_quantidade" name="atualizar" id="atualizar" data-action="shred" data-id="' + IDPRODUTO  + '" data-Produto="' + Produto  + '" data-PrecoVenda="' + parseFloat(+PRECO).toFixed(2)  + '"  data-id="' + CODIGOCOMPRA + '"  class="btn btn-xs">'+
						'<span class="fa fa-refresh" style="font-size:29px"></span></button>'+
						'<button data-role="button" class="btn btn-danger btn-xs" name="Excluir" id="Excluir" data-action="shred" data-id="' + CODIGOCOMPRA + '">'+
                        '<span class="fa fa-remove" style="font-size:29px"></span></button></td>'+
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
			url:"http://netsolutionmogi.com/pedidos/php/pedidos.php",
		
		
		success: function(response)
		{
		 
				listar_pedidos(response);
				
				console.log(response);	
		
		},
		complete: function()
		{
			
			
		
		}
			
		});
			return false;

	}
	
	
   
  $("#finalizar").on('click',function (e)
  {
		e.preventDefault();	
		 
		window.location="index6.html";
		return false;
	  });	

  
  $(document).on('focus', '#calculatotal tbody td input#quantidade,input:hidden#codigo', function (e) {
   
   e.preventDefault();
   
      var quantidade = $(this).parent().parent().find('input[id*="quantidade"]').first().val();
	  var codigo = $(this).parent().parent().find('input:hidden[id*="codigo"]').first().val();
      //console.log('quantidade:' + quantidade);
	  
	return false;
	   
 });
   
$(document).ready(function()
	{
		
		
		 $("#tabela_body").on('click','[data-action="shred"]',function (e)
	  {
		
		e.preventDefault();
		var codigo    = $(this).attr('data-id');	
		var button        = $(this).attr('name');
		//var quantidade = $(this).parent().parent().find('input[id*="quantidade"]').first().val();
		//var codigo = $(this).parent().parent().find('input:hidden[id*="codigo"]').first().val();

		  var codigo            =  $("#alterar_quantidade #codigo").val();
		 var Produto          = $("#alterar_quantidade #produto").val();
		 var quantidade       = $("#alterar_quantidade #quantidade").val();
		 var PrecoVenda       = $("#alterar_quantidade #precovenda").val();
		 
		var codigo            = $(this).attr('data-id'); 
		var Produto           = $(this).attr('data-produto');
		var PrecoVenda        = $(this).attr('data-precovenda');	
		
		$("#alterar_quantidade input[name='codigo']").val(codigo); 
		$("#alterar_quantidade input[name='produto']").val(Produto);
		$("#alterar_quantidade input[name='precovenda']").val(PrecoVenda);
		
		$("#alterar_quantidade input[name='produto']").focus();
		
		console.log('quantidade:' + quantidade);
		
		//alert(quantidade);
		
	   });  
	   
        $(document).on('click', '#Excluir', function(e)
        {
			
            var codigo    = $(this).attr('data-id');
			SwalDelete(codigo);
			e.preventDefault();


         });  
	   
	   function SwalDelete(codigo){
		
		swal({
			title: 'Tem certeza que deseja Deletar?',
			text: "Todos os itens serão finalizados!",
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Sim, delete sim!',
			showLoaderOnConfirm: true,
			  
			preConfirm: function() {
			  return new Promise(function(resolve) {
			       
			     $.ajax({
			   		url: 'http://netsolutionmogi.com/pedidos/php/delete.php',
			    	type: 'POST',
			       	data: 'delete='+codigo,
			       	dataType: 'json'
			     })
			     .done(function(response){
			     	swal('Deletado!', response.message, response.status);
					
			           mostrar_pedidos();
					   contar();
			          somar();
			     })
			     .fail(function(){
			     	swal('Oops...', 'erro com o ajax !', 'Erro');
			     });
			  });
		    },
			allowOutsideClick: false			  
		});	
		
	}
		
		
	   $("input").focus(function(){
        $(this).parent().addClass("is-focused");
        $("i[data-input='"+$(this).attr('name')+"']").addClass("is-focused");
      })
      .focusout(function(){
        $(this).parent().removeClass("is-focused");
        $("i[data-input='"+$(this).attr('name')+"']").removeClass("is-focused");
      });

      $("input:first").focus();
	$(document).ready(function()
	{
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
		  }
	});
	 }); 

});
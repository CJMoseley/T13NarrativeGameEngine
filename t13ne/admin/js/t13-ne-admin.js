window.T13NEbase.Page.jurl=document.URL;
var url = new URL(document.URL);
window.T13NEbase.Page.preview = !!url.searchParams.get("preview");
window.T13NEbase.Page.PostID = url.searchParams.get("post");
window.T13NEbase.Page.Action = url.searchParams.get("action");
function reloadT13() {
  var links = document.getElementsByTagName('link');
  Array.from(links)
    .filter(link => link.rel.toLowerCase() === 'stylesheet' && link.href)
    .forEach(link => {
      var url = new URL(link.href, location.href);
      url.searchParams.set('forceReload', Date.now());
      link.href = url.href;
    });
  var scripts= document.getElementsByTagName('script');
  Array.from(scripts).filter(script =>script.src).forEach(script=>{
  	var earl = new URL(script.src);
  	earl.searchParams.set('forceReload', Date.now());
  	script.src = earl.href;
  	});
}
var installationpackage=Number(T13_Ne_AjaxEngine.installpackage);
var installationbutton;
if (!T13NE){var T13NE={};}
resetdb=null;
(function( $ ) {
	'use strict';
function t13_alert(mtx){
	$("#bubbleshere").after('<span id="bubble'+installationpackage+'" class="t13bubbleoff" style="z-index:'+(1000-installationpackage)+'">'+mtx+'</span>');
$(".bubbleoff").each =function (){
		
			if ($(this).attr("opacity")=0);{
				$(this).remove();
		
		}
	}
}
 function jq_reset(){
 	ajaxProgress(true);
 }
 resetdb=jq_reset;
 function ajaxProgress($reset){
 			if ($reset){
 				var component = {mode: 'ResetDB', package:installationpackage};
 			}else{
	 			var component = {mode: 'Install', package: installationpackage};
	 		}
	 		$.ajax( {
			url    : ajaxurl,
			type   : 'POST',
			data   : { action  : 'T13_ne_ajax_engine', ajaxengine : component, security: T13_Ne_AjaxEngine.tinonce },
			dataType: 'json',
			error : function( MLHttpRequest, textStatus, errorThrown ) {
				$("#progressbar").value = installationpackage;
				$("#progressbar").css("color","red");
				t13_alert("An Error has occurred during installation :( ");
				$('#progholder').hide();
				$(installationbutton).slideUp(1500);	
				console.log('AJAX MLHttpRequest',MLHttpRequest);
				console.log('AJAX textStatus', textStatus);
				console.error(errorThrown);


			},

			// When the call succeeds.
			success : function( response, textStatus, XMLHttpRequest ) {
				console.log( 'AJAX_Install: reponse',response );
				console.log('AJAX_Install: data',response.data);
				console.log('AJAX_Install: message',response.data.chunk.message);
				$("progress#progressbar").attr('value',response.data.chunk.package);
				t13_alert(response.data.chunk.message);
				installationpackage=Number(response.data.chunk.package);
				if (response.data.chunk.package<2000){
					setTimeout(ajaxProgress,80);
				}else{
					//location.reload();
				}
			},

			// When the call is complete.
			complete : function( reply, textStatus ) {
				console.log( textStatus );
				
			}

		} );

	 }
			
	$(document).on( 'click', '.t13progressbar', function(event) {
		$(this).after('<div id="progholder"><progress id="progressbar" value="0" max="109"></progress><svg class="loader" id="bubbleshere" name="bubbleshere" width="50px"  height="50px"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" style="background: none; vertical-align:middle;"><g transform="translate(50,50)"><circle cx="0" cy="0" r="8.333333333333334" fill="none" stroke="#ce3f2d" stroke-width="4" stroke-dasharray="26.179938779914945 26.179938779914945" transform="rotate(58.2297)"><animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" times="0;1" dur="1s" calcMode="spline" keySplines="0.2 0 0.8 1" begin="0" repeatCount="indefinite"></animateTransform></circle><circle cx="0" cy="0" r="16.666666666666668" fill="none" stroke="#1b1623" stroke-width="4" stroke-dasharray="52.35987755982989 52.35987755982989" transform="rotate(142.638)"><animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" times="0;1" dur="1s" calcMode="spline" keySplines="0.2 0 0.8 1" begin="-0.2" repeatCount="indefinite"></animateTransform></circle><circle cx="0" cy="0" r="25" fill="none" stroke="#ead58f" stroke-width="4" stroke-dasharray="78.53981633974483 78.53981633974483" transform="rotate(232.121)"><animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" times="0;1" dur="1s" calcMode="spline" keySplines="0.2 0 0.8 1" begin="-0.4" repeatCount="indefinite"></animateTransform></circle><circle cx="0" cy="0" r="33.333333333333336" fill="none" stroke="#553d54" stroke-width="4" stroke-dasharray="104.71975511965978 104.71975511965978" transform="rotate(314.326)"><animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" times="0;1" dur="1s" calcMode="spline" keySplines="0.2 0 0.8 1" begin="-0.6" repeatCount="indefinite"></animateTransform></circle><circle cx="0" cy="0" r="41.666666666666664" fill="none" stroke="#8d82b3" stroke-width="4" stroke-dasharray="130.89969389957471 130.89969389957471" transform="rotate(0.749419)"><animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" times="0;1" dur="1s" calcMode="spline" keySplines="0.2 0 0.8 1" begin="-0.8" repeatCount="indefinite"></animateTransform></circle></g></svg><p id="statusMessage" style="padding:1em;">Installing... Please be patient there is a lot to do.</p></div>');
		$('#progholder').hide();
		$('#progholder').slideUp(1);
		$('#progholder').show();
		$(this).slideUp(1500);	
		$('#progholder').slideDown(1500);		
		event.preventDefault();
		 installationbutton=$(this);
		if (installationbutton.attr("id")=="install"){
			t13_alert("Installing");
			setTimeout(ajaxProgress,1);
		}
		
	} );
	
	$(document)

})( jQuery );



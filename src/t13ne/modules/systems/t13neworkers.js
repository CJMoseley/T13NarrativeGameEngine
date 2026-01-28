//t13ne-web-workers-file
onmessage = function(e) {
  console.log('Multithreading! Feel the power!');
 	switch (e.data[0]){
 		
 		default:
 		postMessage(['error','Unknown call']);
 		break;
 	}
 
}






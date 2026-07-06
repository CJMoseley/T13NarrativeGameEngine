window.T13NEbase.Page.jurl=document.URL;
var url = new URL(document.URL);
window.T13NEbase.Page.preview = !!url.searchParams.get("preview");
window.T13NEbase.Page.PostID = url.searchParams.get("p");
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
  var scripts= document.getElementByTagName('script');
  Array.from(scripts).filter(script =>script.src).forEach(script=>{
  	var earl = new URL(script.src);
  	url.searchParams.set('forceReload', Date.now());
  	script.src = url.href;
  	});
}


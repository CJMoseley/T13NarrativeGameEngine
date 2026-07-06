(function (blocks, editor, element, data, i18n,components ) {
  var el = element.createElement;
  var { __ } = i18n;
  var richText = editor;
 
//  var withSelect = data.withSelect;
  var { InnerBlocks } = window.wp.editor;
  var randyNumber=window.T13NE.RNG(0,53,0);
  var cartenn=0;
  var dashicon= React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512",style:{height:"40px",width:"40px"} }, React.createElement("polygon", { points: "256,512,0,256,256,0,512,256", fill: "#32373c", "fillOpacity": "0" }), React.createElement("g", { transform: "translate(0,0)"}, React.createElement("path", { d: "M250.453 18.648c-81.376 0-231.45 155.81-171.668 300.672 7.978 25.267 27.867 50.345 49.205 77.076 24.453 30.633 51.61 63.238 68.668 96.885h20.584c-18.13-39.8-48.558-75.86-74.646-108.542-27.415-34.343-48.813-65.267-48.815-87.95.002-3.61.377-7.333 1.09-11.136l-.12-.027c.287-1.23.598-2.455.924-3.674.913-3.757 2.14-7.578 3.68-11.436 23.075-61.4 94.16-106.3 146.552-135.014l3.594-1.97 3.906 1.345c60.932 20.9 131.302 66.756 155.967 135.77 1.134 3.01 2.114 6.012 2.914 8.998.41 1.413.81 2.832 1.182 4.263l-.156.04c1.1 5.15 1.68 10.232 1.678 15.177v.002c0 22.304-24.448 53.49-55.04 87.512-29.063 32.318-62.31 67.554-79.997 106.644h20.59c16.756-32.134 46.205-64.013 73.303-94.147 23.14-25.733 45.285-49.998 54.867-74.945 52.844-124.03-99.228-305.54-178.262-305.54zm.797 135.32c-38.68 21.5-85.036 52.22-113.623 88.212 9.72 83.004 58.994 146.164 118.31 146.164 59.117 0 108.24-62.733 118.19-145.323-28.928-42.097-78.05-72.91-122.877-89.05zM193 237c.814-.013 1.624-.006 2.438 0 13.02.102 26.043 2.687 39.062 7.438-16.848 40.6-58.98 41.963-78.125 0 12.206-4.835 24.42-7.24 36.625-7.438zm124.906 0c13.02-.102 26.043 2.28 39.063 7.438-19.148 41.963-61.28 40.6-78.126 0 13.02-4.75 26.043-7.336 39.062-7.438zm-112.82 274.97l.135.32h86.844l.13-.32h-87.108z", fill: "#32373c", stroke: "#eae0df", "strokeOpacity": "1", "strokeWidth": "4", "fillOpacity": "1" })));

blocks.registerBlockType("t13ne/t13ne-avatar", {
    title: __("T13 Avatar"),
    description: __(
    "An Author's Avatar, so you can claim ownership of a particular part of the system that you designed, created, or are playing. If you want to find out more visit https://gravatar.com/"),
    icon: dashicon,
    keywords: [
    __("avatar"),
    __("users"),
    __("profile"),,
    __("thingy")],
    inserter:true,
    category: "common",
    atttributes: {
      id:{
        type:"string",
        source:"attribute",
        attribute: "id",
        selector:"figure",
      },
     className:{
        type:"string",
        default:"t13ne-avatar",
     },
     author :{
        type:"string",
        source:"meta",
        meta:"author"
     }
      },
    edit: function (props) {
     // console.log("edit props",props);
      var authors=window.wp.data.select('core').getAuthors();
      var aut=authors.length;
      var avatars=[];
      for (var i=0; i<aut;i++){
         if (props.attributes.id.length==0) {
            var idder=props.clientId;
            props.setAttributes({id:idder});
          }
          var urls=authors[i].avatar_urls;
          urls=Object.values(urls);
          var url =urls[urls.length-1];
           avatars[avatars.length]= el(window.T13NE.Avatar,{ 
            "className":props.attributes.className,
            "data-t13ne-author": authors[i].id,
            "data-t13ne-name":authors[i].name, 
            "data-t13ne-desc":authors[i].description,
            "data-t13ne-link":authors[i].link,
            "id":props.attributes.id!==undefined?props.attributes.id:idder,
            "data-t13ne-url" :url},null);
          
          //console.log("props.attributes ",props.attributes);
      }
            
      return avatars;
    },
    save: function (props) {
       var authors=window.wp.data.select('core').getAuthors();
      var aut=authors.length;
      var avatars=[];
      for (var i=0; i<aut;i++){
         if (props.attributes.id.length==0) {
            var idder=window.T13NE.getT13ID("figure.t13ne-avatar","avatar"+i,window.T13NE.This(this,props));
            props.setAttributes({id:idder});
          }
          var urls=authors[i].avatar_urls;
          urls=Object.values(urls);
          var url =urls[urls.length-1];
          avatars[avatars.length]= el(window.T13NE.Avatar,{ 
            "className":props.attributes.className,
            "data-t13ne-author": authors[i].id,
            "data-t13ne-name":authors[i].name, 
            "data-t13ne-desc":authors[i].description,
            "data-t13ne-link":authors[i].link,
            "id":props.attributes.id!==undefined?props.attributes.id:idder,
            "data-t13ne-url" :url},null);
          
          //console.log("props.attributes ",props.attributes);
      }
            
      return avatars;
    }
   }
 );

})(
window.wp.blocks,
window.wp.editor,
window.wp.element,
window.wp.data,
window.wp.i18n,
window.wp.components);


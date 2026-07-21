if (!T13NE){var T13NE={};}
if (!Object.values({test:"this"})){
  alert("This site, like most of the internet, does not work in so called 'Internet Explorer'. Get yourself a nice new browser from this century.");
}
window.T13NE.SearchFilters = function(){
  var filters = [];
  window.T13NEbase.Taxon.Taxon.forEach( function(element, index) {
    if (!filters[element.taxonomy]){filters[element.taxonomy]=[];}
    filters[element.taxonomy].push({label:element.name, value: element["term_id"]});
  });
  //console.log("filters=",filters);
  return filters;
};
window.T13NE.BuildSearchTerms = function(taxon,terms){
  var retpath="";
  if (taxon&&JSON.stringify(taxon)!=="[]"){
    if (terms&&JSON.stringify(terms)!=="[]"){
      if (typeof terms == "object" &&terms.length>1){
        terms.forEach( function(element, index) {
          retpath+="&"+taxon+"[]="+element;
        });
      }else{
        retpath+="&"+taxon+"="+terms;
      }
    }
  }
  return retpath;
};

window.T13NE.ContainerData = function(props, state ){
  console.log("container data", props, state);

 var id = props.id?props.id:state.id?state.id:window.T13NE.getT13ID("article.t13ne-element-container", "t13el", window.T13NE.This(this,this.props));
   var t13postid  = props["data-t13postid"]?(props["data-t13postid"]!=="new"?parseInt(props["data-t13postid"]):"new"):state.t13postid?(state.t13postid!=="new"?parseInt(state.t13postid):"new"):-1;
    var name    = window.T13NE.Stringify(props["data-t13name"]?props["data-t13name"]:state.title?state.title: false);
    var fullname= window.T13NE.Stringify(props["data-t13fullname"]?props["data-t13fullname"]: "");
    var aka    = window.T13NE.Stringify(props["data-t13aka"]?props["data-t13aka"]: "");
    var title = window.T13NE.Stringify(props["data-post-title"]?props["data-post-title"]:name+":"+fullname+":"+aka);
    var desc    = window.T13NE.Stringify(props["data-t13description"]?props["data-t13description"]:state.content?state.content:false);
    var facets   = window.T13NE.buildCSS(props["data-t13facet"]?props["data-t13facet"]:state.facet?state.facet:"","facet");
    var era     = window.T13NE.buildCSS(props["data-t13era"]?props["data-t13era"]:state.era?state.era:"","era");
    var genre   =window.T13NE.buildCSS( props["data-t13genre"]?props["data-t13genre"]:state.genre?state.genre:"","genre");
    var geo     =window.T13NE.buildCSS(props["data-t13geom"]?props["data-t13geom"]: state.geo?state.geo:"","geo");
    var scope   = window.T13NE.buildCSS(props["data-t13scope"]?props["data-t13scope"]:state.scope?state.scope:"","scope");
    var eltype  =window.T13NE.buildCSS( props["data-t13eltype"]?props["data-t13eltype"]:state.eltype?state.eltype:"", "type");
    var t13data  =window.T13NE.buildCSS( props["data-t13data"]?props["data-t13data"]:state.t13data?state.t13data:"", "data");
    var cats    =JSON.stringify(props["data-cats"]?props["data-cats"]: state.cats?state.cats:"");
    var tags    = JSON.stringify(props["data-tags"]?props["data-tags"]:state.tags?state.tags:"");
   /*  var id = state.id?state.id:props.id?props.id:window.T13NE.getT13ID("article.t13ne-element-container", "t13el");
   var t13postid  =state.t13postid?parseInt(state.t13postid): props["data-t13postid"]?parseInt(props["data-t13postid"]):-1;
    var name    = window.T13NE.Stringify(state.title?state.title:props["data-t13name"]?props["data-t13name"]: "");
    var desc    = window.T13NE.Stringify(state.content?state.content:props["data-t13description"]?props["data-t13description"]:"Nothing found~ Most likely an error has occured. Try refreshing the page.");
    var facets   = window.T13NE.buildCSS(state.facet?state.facet:props["data-t13facet"]?props["data-t13facet"]:"","facet");
    var era     = window.T13NE.buildCSS(state.era?state.era:props["data-t13era"]?props["data-t13era"]:"","era");
    var genre   =window.T13NE.buildCSS( state.genre?state.genre:props["data-t13genre"]?props["data-t13genre"]:"","genre");
    var geo     =window.T13NE.buildCSS( state.geo?state.geo:props["data-t13geom"]?props["data-t13geom"]:"","geo");
    var scope   = window.T13NE.buildCSS(state.scope?state.scope:props["data-t13scope"]?props["data-t13scope"]:"","scope");
    var eltype  =window.T13NE.buildCSS( state.eltype?state.eltype:props["data-t13eltype"]?props["data-t13eltype"]:"", "type");
    var cats    =JSON.stringify( state.cats?state.cats:props["data-cats"]?props["data-cats"]:"");
    var tags    = JSON.stringify(state.tags?state.tags:props["data-tags"]?props["data-tags"]:"");*/
    if (cats =='"[]"'||cats=="\"[]\""){cats='[]';}
    if (tags =='"[]"'||tags=="\"[]\""){tags='[]';}
  
    var data={ 
            "id":id,
            "className": (props.className?props.className:state.className?state.className:"t13ne-element t13ne-element-container")+eltype.css+genre.css+era.css+scope.css+facets.css+geo.css,
           // "name":name,
            //"title":window.T13NE.Parse(name),
            "data-t13name":name,
            "data-t13fullname":fullname,
            "data-t13aka":aka,
            "data-t13postid":  t13postid,
            "data-t13description":desc,
            "data-t13genre": genre.data ,
            "data-t13eltype": eltype.data,        
            "data-t13scope": scope.data,
            "data-t13facet": facets.data,
            "data-t13era":   era.data ,
            "data-t13data": t13data.data,
            "data-post-title":title,
            "data-tags": tags,
            "data-cats": cats,
            "data-t13geo": geo.data,
            "data-edit":props["data-edit"]?props["data-edit"]:false,
            "data-t13ne-new":state.mode?state.mode=="new":false,
            "data-id":id,
            "data-save":props['data-save']?props["data-save"]:false,
            };
    return data;
};

window.T13NE.ContainerContent = function (contentTypes,data){
  console.log("ContainerContent-----------------(", contentTypes,data);
  el=window.T13NE.CE;
  var contentType="";
  if (contentTypes&&contentTypes!==undefined){

    //console.log("contentTypes",contentTypes);
    var term=window.T13NE.getLowestElementType(contentTypes);
    //console.log("term",term);
    if (term&&term!==undefined&&JSON.stringify(term)!=="[]"){
      if (typeof term == "object"&&Array.isArray(term)){
        contentType = term[0].slug;
      }else{
        //console.log("term",term);
        contentType = term.slug;
      }
    }else{
     return null;
    }
    
    console.log("contentType",contentType);
    switch(contentType) {
      case "map":
        // the map is the one thread that may need special handling.
        //console.log("display map");
      break;
      case "threads":
     // console.log("display thread");
      var profProps = {
          "data-t13ne-new":data["data-t13ne-new"],
          "data-t13postid":data["data-t13postid"],
          //"title":window.T13NE.Parse(data.name),
          "data-facet":data.facet,
          "className":data.className,
          "data-prof-data":JSON.stringify({
            "t13postid":data["data-t13postid"],
            "name":data['data-t13name'],
            "fullname":data['data-t13fullname'],
            "aka":data['data-t13aka'],
            'posttitle':data['data-post-title'],
            "description":data["data-t13description"],
            "facet":data["data-t13facet"],
            "era":data["data-t13era"],
            "geo":data["data-t13geo"],
            "genre":data["data-t13genre"],
            "scope":data["data-t13scope"],
            "eltype":"threads",
            "t13data":data["data-t13data"],
            "cats":data["data-cats"],
            "tags":data["data-tags"],
             "data-id":data.id,
           
            })
        };
         return (el(window.T13NE.Proficiency,profProps,null));
         break;
      case "note":
     // console.log("display notes");
      var profProps = {
        "data-t13ne-new":data["data-t13ne-new"],
          "data-t13postid":data["data-t13postid"],
         // "title":window.T13NE.Parse(data.name),
          "data-facet":data.facet,
          "className":data.className,
          "data-prof-data":JSON.stringify({
            "t13postid":data["data-t13postid"],
            "name":data['data-t13name'],
            "fullname":data['data-t13fullname'],
            "aka":data['data-t13aka'],
            'posttitle':data['data-post-title'],
            "description":data["data-t13description"],
            "facet":data["data-t13facet"],
            "era":data["data-t13era"],
            "geo":data["data-t13geo"],
            "genre":data["data-t13genre"],
            "scope":data["data-t13scope"],
            "eltype":"note",
            "t13data":data["data-t13data"],
            "cats":data["data-cats"],
            "tags":data["data-tags"],
             "data-id":data.id,
           
            })
        };
         return (el(window.T13NE.Proficiency,profProps,null));
         break;
      case "prof":
        console.log("display prof", data);
        var profProps = {
            "data-t13ne-new":data["data-t13ne-new"],
          "data-t13postid":data["data-t13postid"],
          //"title":window.T13NE.Parse(data.name),
          "data-facet":data.facet,
          "className":data.className,
           "data-id":data.id,

          "data-prof-data":JSON.stringify({
            "t13postid":data["data-t13postid"],
            "name":data['data-t13name'],
            "fullname":data['data-t13fullname'],
            "aka":data['data-t13aka'],
            'posttitle':data['data-post-title'],
            "description":data["data-t13description"],
            "facet":data["data-t13facet"],
            "era":data["data-t13era"],
            "geo":data["data-t13geo"],
            "genre":data["data-t13genre"],
            "scope":data["data-t13scope"],
            "eltype":"prof",
            "t13data":data["data-t13data"],
            "cats":data["data-cats"],
            "tags":data["data-tags"],
            "data-id":data.id,
            "data-save":data['data-save']?data["data-save"]:false,
            })
        };
         return (el(window.T13NE.Proficiency,profProps,null));
      break;
      case "diegesis":
       //console.log("display diagesis");
        var profProps = {
            "data-t13ne-new":data["data-t13ne-new"],
          "data-t13postid":data["data-t13postid"],
         // "title":window.T13NE.Parse(data.name),
          "data-facet":data.facet,
          "className":data.className,
          "data-prof-data":JSON.stringify({
            "t13postid":data["data-t13postid"],
            "name":data['data-t13name'],
            "fullname":data['data-t13fullname'],
            "aka":data['data-t13aka'],
            'posttitle':data['data-post-title'],
            "description":data["data-t13description"],
            "facet":data["data-t13facet"],
            "era":data["data-t13era"],
            "geo":data["data-t13geo"],
            "genre":data["data-t13genre"],
            "scope":data["data-t13scope"],
            "eltype":"diegesis",
            "t13data":data["data-t13data"],
            "cats":data["data-cats"],
            "tags":data["data-tags"],
             "data-id":data.id,
           
            })
        };
         // console.log("profProps", profProps);
         return (el(window.T13NE.Proficiency,profProps,null));
      case "annex":
        console.log("display annex");
       // return (el(window.T13NE.Annex,data));
      break;
      case "hitch":
      case "hitches":
       console.log("display hitch", data);
        var hitchProps = {
            "data-t13ne-new":data["data-t13ne-new"],
          "data-t13postid":data["data-t13postid"],
          //"title":window.T13NE.Parse(data.name),
          "data-facet":data.facet,
          "className":data.className,
           "data-id":data.id,

          "data-hitch-data":JSON.stringify({
            "t13postid":data["data-t13postid"],
            "name":data['data-t13name'],
            "fullname":data['data-t13fullname'],
            "aka":data['data-t13aka'],
            "posttitle":data['data-post-title'],
            "description":data["data-t13description"],
            "facet":data["data-t13facet"],
            "era":data["data-t13era"],
            "geo":data["data-t13geo"],
            "genre":data["data-t13genre"],
            "scope":data["data-t13scope"],
            "eltype":"hitch",
            "t13data":data["data-t13data"],
            "cats":data["data-cats"],
            "tags":data["data-tags"],
            "data-id":data.id,
            "data-save":data['data-save']?data["data-save"]:false,
            })
        };
        return(el(window.T13NE.Hitch,hitchProps,null));
      break; 
      case "descendant":
       console.log("display descendant");
       // return(el(window.T13neDescendant,data));
      break;
      case "spinner":
      console.log("display spinner");
      //return (el(windown.T13NE.Spinner,data,null));
      break;
      case "plot":
       console.log("display plot");
       //  return(el(window.T13neDescendant,data));
      break;
      case "lite":
       console.log("display lite");
        // return(el(window.T13neDescendant,data));
      break;
      case "extra":
       console.log("display extra");
       //  return(el(window.T13neDescendant,data));
      break;
      case "detail":
       console.log("display detail");
       //  return(el(window.T13neDescendant,data));
      break;
      case 0:
      //special default case that will dissappear later... for now though
      return "";
      break;
      default:
       console.log("display default");
      return (el("p",{"data-":window.T13NE.Stringify(data)}, "Something went wrong declared contentType: "+contentType));
      break;
  }
}
};
window.T13NE.T13ContainerIcon = window.T13NE.CE("svg", {"xmlns":"http://www.w3.org/2000/svg", viewBox:"0 0 512 512", style:{"height": "57px", "width": "57px"}},
  window.T13NE.CE("defs",{},
    window.T13NE.CE("filter",{id:"shadow-1",height:"300%", width:"300%", x:"-100%", y:"-100%"},
      window.T13NE.CE("feFlood",{"floodColor":"rgba(245,200,35,1)", result:"flood"},null),
      window.T13NE.CE("feComposite",{in:"flood", in2:"SourceGraphic", operator:"atop", "result":"composite"},null),
      window.T13NE.CE("feGaussianBlur",{in:"composite", in2:"offset", stdDeviation:"10", "result":"blur"},null),
      window.T13NE.CE("feOffset",{dy:"0", result:"offset"},null))),
  window.T13NE.CE("polygon",{points:"256,512,0,256,256,0,512,256", fill:"3E320A", "fillOpacity":"0"},null),
  window.T13NE.CE("g",{transform:"translate(0,0)"},
    window.T13NE.CE("path" ,{d:"M51.34 23.63l-6.68 16.72 80.04 32.01 6.6-16.72-79.96-32.01zm409.36.01l-80 32 6.6 16.72 80-32-6.6-16.72zM256 25c-29 0-50 14.08-64.7 34.29C176.6 79.51 169 106 169 128c0 13 7 27.8 14.5 39s14.9 18.6 14.9 18.6l1.5 1.5 9.3 27.9H228L194.7 98.07 256 118.5l61.3-20.43L284 215h18.8l9.3-27.9 1.5-1.5s7.4-7.4 14.9-18.6c7.5-11.2 14.5-26 14.5-39 0-22-7.6-48.49-22.3-68.71C306 39.08 285 25 256 25zm128 94v18h96v-18h-96zm-352 .1v18h96v-18H32zm189.3 6.8l25.5 89.1h18.4l25.5-89.1-34.7 11.6-34.7-11.6zm166 57.7l-6.6 16.8 80 32 6.6-16.8-80-32zm-262.6.1l-80.04 32 6.68 16.8 79.96-32-6.6-16.8zM217 233v14h78v-14h-78zm0 32v14h78v-14h-78zm-46.9 2.6c-27.1.5-52.6 5-66.9 11.1L29.8 484.1c71.1-14.1 143.9-26 217.2-.9V297h-48v-28.3c-7.9-.7-16-1.1-23.9-1.1h-5zm166.8 0c-7.9 0-16 .4-23.9 1.1V297h-48v186.2c73.3-25.1 146.1-13.2 217.2.9l-73.4-205.4c-14.3-6.1-39.8-10.6-66.9-11.1h-5z", fill:"#F5C823", "fillOpacity":"1",stroke:"#F3D771", "strokeOpacity":"1","strokeWidth":"2" ,filter:"url(#shadow-1)"})),
  /*window.T13NE.CE("g" ,{transform:"translate(273,208)"},
    window.T13NE.CE("g", {transform:"translate(6.4, 6.4) scale(0.8, 0.8) rotate(0, 128, 128)"},
      window.T13NE.CE("circle", {cx:"128", cy:"128", r:"128", fill:"#000" ,"fillOpacity":"1"},null),
      window.T13NE.CE("circle", {stroke:"#fff", "strokeOpacity":"1", fill:"#00f", "fillOpacity":"1", "strokeWidth":"18", cx:"128", cy:"128", r:"101"},null),
      window.T13NE.CE("path", {fill:"#fff", "fillOpacity":"1", d:"M119 64v55H64v18h55v55h18v-55h55v-18h-55V64h-18z"},null))),*/
  window.T13NE.CE("g" ,{"fontFamily":"&quot;Times New Roman&quot;, Times, serif", "fontSize":"171", "fontStyle":"normal", "fontWeight":"bold", "textAnchor":"middle", transform:"translate(271,454)" },
    window.T13NE.CE("text" ,{stroke:"rgba(62, 50, 10, 1)", "strokeWidth":"42.75"},
      window.T13NE.CE("tspan" ,{x:"0", y:"0"},"T 13")),
    window.T13NE.CE("text", {fill:"rgba(245, 200, 35, 1)"},
      window.T13NE.CE("tspan", {x:"0", y:"0"},"T 13"))));

window.T13NE.Container = class extends window.T13NE.Component {
  constructor(props) {
    super(props);
    var id=window.T13NE.getT13ID("article.t13ne-element-container", "t13el", window.T13NE.This(this,this.props));
    this.ready = false;
    this.getpost = this.getpost.bind(this);
    this.loading = false;
    this.mode=false;
    this.dispatched = false;
    //this.onClick = this.onClick.bind(this);
   // this.onNewClick = this.onNewClick.bind(this); 
    //this.onChange = this.onChange.bind(this);
    this.contentModified = this.onContentModified.bind(this);
   // this.onKeyDown = this.onKeyDown.bind(this);
   // this.bindListNode = this.bindListNode.bind(this);
    this.onElementTypeSelector = this.onElementTypeSelector.bind(this);
    //this.changeFilters = this.changeFilters.bind(this);
    //this.renderFilters = this.renderFilters.bind(this);
    //this.updateSuggestions = window.T13NE.debounce(this.updateSuggestions.bind(this), 200);
    //this.limit = this.props.limit ? parseInt(this.props.limit) : false;
   // this.suggestionNodes = [];
    this.postTypes = null;
    //console.log("data-save", props["data-save"]);
    //console.log("editing", this.editing);

    //console.log("container--",props);
   
    if (props["data-save"]&&window.T13NE.Can_edit()){
      this.mode = "save";
      //console.log("this is save mode...");
       this.state = { results: "",
        id:props.id?props.id:id,
        "message":"...Saving...",
        "searchbox": "",
        "default":"never shown",
        "mode":"savehtml",
        "t13postid":props["data-t13postid"]?props["data-t13postid"]:-1,
        "title": props["data-t13name"]?window.T13NE.Parse(props["data-t13name"]):"",
        "t13name":props["data-t13name"]?window.T13NE.Parse(props["data-t13name"]):"",
        "t13fullname":props["data-t13fullname"]?window.T13NE.Parse(props["data-t13fullname"]):"",
        "t13aka":props["data-t13aka"]?window.T13NE.Parse(props["data-t13aka"]):"",
        "posttitle":props['data-post-title']?window.T13NE.Parse(props['data-post-title']):'::',
        "content":props["data-t13description"]?window.T13NE.Parse(props["data-t13description"]):"",
        "era":props["data-t13era"]?window.T13NE.Parse(props["data-t13era"]):[],
        "genre":props["data-t13genre"]?window.T13NE.Parse(props["data-t13genre"]):[],
        "facet":props["data-t13facet"]?window.T13NE.Parse(props["data-t13facet"]):[],
        "geo":props["data-t13geom"]?window.T13NE.Parse(props["data-t13geom"]):[],
        "scope":props["data-t13scope"]?window.T13NE.Parse(props["data-t13scope"]):[],
        "eltype":props["data-t13eltype"]?window.T13NE.Parse(props["data-t13eltype"]):[],
        "t13data":props["data-t13data"]?window.T13NE.Parse(props["data-t13data"]):[],
        "cats":props["data-cats"]?window.T13NE.Parse(props["data-cats"]):'[]',
        "tags":props["data-tags"]?window.T13NE.Parse(props["data-tags"]):'[]',
        "className":props.className?props.className:" t13element-container ",
        
         };
    }else{
      if (props['data-t13new']=="new"||props["data-t13postid"]=="new"&&window.T13NE.Can_edit()){
        this.mode ="new";
        //console.log("new");
        this.state = { results: "",
              id:props.id?props.id:id,
              "message":"Create a New T13 Element",
              "default":"never shown",
              "mode":"new",
              "t13postid":props["data-t13postid"]?window.T13NE.Parse(props["data-t13postid"]):-1,
              "title": props['data-t13name']?window.T13NE.Parse(props['data-t13name']):'',
              "t13name":props["data-t13name"]?window.T13NE.Parse(props["data-t13name"]):"",
              "t13fullname":props["data-t13fullname"]?window.T13NE.Parse(props["data-t13fullname"]):"",
              "t13aka":props["data-t13aka"]?window.T13NE.Parse(props["data-t13aka"]):"",
              "posttitle":props['data-post-title']?window.T13NE.Parse(props['data-post-title']):'::',
              "content":props["data-t13description"]?window.T13NE.Parse(props["data-t13description"]):'',
              "era":props["data-t13era"]?window.T13NE.Parse(props["data-t13era"]):[],
              "genre":props["data-t13genre"]?window.T13NE.Parse(props["data-t13genre"]):[],
              "facet":props["data-t13facet"]?window.T13NE.Parse(props["data-t13facet"]):[],
              "geo":props["data-t13geom"]?window.T13NE.Parse(props["data-t13geom"]):[],
              "scope":props["data-t13scope"]?window.T13NE.Parse(props["data-t13scope"]):[],
              "eltype":props["data-t13eltype"]?window.T13NE.Parse(props["data-t13eltype"]):[],
              "t13data":props["data-t13data"]?window.T13NE.Parse(props["data-t13data"]):[],
              "cats":props["data-cats"]?window.T13NE.Parse(props["data-cats"]):'[]',
              "tags":props["data-tags"]?window.T13NE.Parse(props["data-tags"]):'[]',
              "className":props.className?props.className:" t13element-container", 
              onChange:this.contentModified, 
            };
      }else{
        if (props["data-t13name"]&&props["data-t13description"]){
          this.mode="loaded";
          //console.log("description found --- loaded mode");
          this.state = { results: "",
            id:props.id?props.id:id,
            "message":"...Loaded...",
            "default":"never shown",
            "mode":"loaded",
            "t13postid":props["data-t13postid"]?window.T13NE.Parse(props["data-t13postid"]):-1,
            "title": props['data-t13name']?window.T13NE.Parse(props['data-t13name']):'',
            "posttitle":props['data-post-title']?window.T13NE.Parse(props['data-post-title']):'::',
            "t13name":props["data-t13name"]?window.T13NE.Parse(props["data-t13name"]):"",
            "t13fullname":props["data-t13fullname"]?window.T13NE.Parse(props["data-t13fullname"]):"",
            "t13aka":props["data-t13aka"]?window.T13NE.Parse(props["data-t13aka"]):"",
            "content":props["data-t13description"]?window.T13NE.Parse(props["data-t13description"]):'',
            "era":props["data-t13era"]?window.T13NE.Parse(props["data-t13era"]):[],
            "genre":props["data-t13genre"]?window.T13NE.Parse(props["data-t13genre"]):[],
            "facet":props["data-t13facet"]?window.T13NE.Parse(props["data-t13facet"]):[],
            "geo":props["data-t13geom"]?window.T13NE.Parse(props["data-t13geom"]):[],
            "scope":props["data-t13scope"]?window.T13NE.Parse(props["data-t13scope"]):[],
            "eltype":props["data-t13eltype"]?window.T13NE.Parse(props["data-t13eltype"]):[],
            "t13data":props["data-t13data"]?window.T13NE.Parse(props["data-t13data"]):[],
            "cats":props["data-cats"]?window.T13NE.Parse(props["data-cats"]):'[]',
            "tags":props["data-tags"]?window.T13NE.Parse(props["data-tags"]):'[]',
            "className":props.className?props.className:" t13element-container",  
          };
        }else{
          if (parseInt(props["data-t13postid"])!==NaN){
            this.mode ="load";
            this.state = { results: "",
              id:props.id?props.id:id,
              "message":"...Loading...",
              "default":"never shown",
              "mode":0,
              "t13postid":props["data-t13postid"]?props["data-t13postid"]:-1,
              "title": "",
              "t13name":"",
              "t13fullname":"",
              "t13aka":"",
              "posttitle":'::',
              "content":"Loading...",
              "era":props["data-t13era"]?window.T13NE.Parse(props["data-t13era"]):[],
              "genre":props["data-t13genre"]?window.T13NE.Parse(props["data-t13genre"]):[],
              "facet":props["data-t13facet"]?window.T13NE.Parse(props["data-t13facet"]):[],
              "geo":props["data-t13geom"]?window.T13NE.Parse(props["data-t13geom"]):[],
              "scope":props["data-t13scope"]?window.T13NE.Parse(props["data-t13scope"]):[],
              "eltype":props["data-t13eltype"]?window.T13NE.Parse(props["data-t13eltype"]):[],
              "t13data":props["data-t13data"]?window.T13NE.Parse(props["data-t13data"]):[],
              "cats":props["data-cats"]?window.T13NE.Parse(props["data-cats"]):'[]',
              "tags":props["data-tags"]?window.T13NE.Parse(props["data-tags"]):'[]',
              "className":props.className?props.className:" t13ne-element-container",
            };
          }
        }
         
      }
    }    
    console.log("container state", this.state);
  }
  componentDidMount(){
    this.ready="mounted";
    window.wp.data.dispatch('t13ne/t13store').setT13Elem("current", {t13ready:"container mounted", id: this.state.id});
  }
  componentWillUnmount(){
    //any tidying we need to do after deletion. 
    //console.log("container umounting");
    window.wp.data.dispatch('t13ne/t13store').setT13Elem(this.state.id,{t13ready:false});
  }
  getpost(t13postid){
    //console.log("getpost", t13postid);
    if (!this.loading&&this.state.postid!==t13postid&&this.state.mode!=="request"&&t13postid!=="new"){ 
      //console.log("not loading so set load");
     this.setState({
          "message":"... Loading data ...",
          mode:"request",
          t13postid:t13postid,
        });
    
     var id = this.state.id?this.state.id:this.props.id?this.props.id:window.T13NE.getT13ID("article.t13ne-element-container", "t13el", window.T13NE.This(this,this.props));
    
     if (window.wp.data.select('t13ne/t13store').getT13Elem('latest')==id&&window.wp.data.select('t13ne/t13store').getT13Elem('lastid')==t13postid&&window.wp.data.select('t13ne/t13store').getT13Elem(t13postid)!=="Pending"){
      console.log("CONTAINER::Block getpost got", t13postid);
      this.loading=false;
     }else{
       this.loading=true;
        console.log("CONTAINER::Block gettingpost", t13postid);
       window.wp.data.dispatch('t13ne/t13store').readT13Elem(t13postid,id);
     }
   }
  }
 
  onElementTypeSelector(event) {
    //console.log("onElementTypeSelector",event);
    if (window.T13NE.Contains(event.target.id, "t13ne-eltype-option")){
       this.setState({"eltype": event.target.value, "message": "Creating New "+event.target.text});
    }
  }
 onContentModified(data){
  console.log("content Modified", data);
   this.setState(data);
   this.props.onChange();
 }

  render() {
    var mode = this.state.mode;
    this.ready="rendering";
    window.T13NE.T13Alert(this.state.message);
    console.log(this.state.message);
    console.log("look at the state of this....",this.state);
  
    var content=null; 

  var data=window.T13NE.ContainerData( this.props, this.state );
  content=window.T13NE.ContainerContent((this.state.eltype?this.state.eltype:this.props["data-t13eltype"]?this.props["data-t13eltype"]:"note"), data);
  if (content==null){content="Well, that didn't work: content was null :Data looks like: " + JSON.stringify(data) + "+++++++++++++++++++++++++++++++++++++++++++++++Props look like: "+JSON.stringify(this.props)+"=====================================================State looks like"+JSON.stringify(this.state);}
    //console.log("data=", JSON.stringify(data));
   //console.log("content=" ,content);
    
    
    //console.log("rendering mode:",mode);
    //if (this.props["data-t13postid"]!==undefined&&this.state.t13postid>-1&&mode=="request"&&this.props["data-t13description"]){mode="loaded";}
    switch (mode){
      case "request":
      //console.log("request:");
      case 0:
      //console.log("0");
      if (this.state.t13postid!==-1){
     this.getpost(this.state.t13postid);}
        return window.T13NE.CE("article", data, 
          window.T13NE.CE("p",{className:"t13ne-request"},this.state.message));
      break;
      
        case "new":
        //console.log("new:");
        data['onChange'] = this.onElementTypeSelector;
        return window.T13NE.CE("article",data, 
            window.T13NE.CE("p",{},this.state.message),
            window.T13NE.CE(window.T13NE.ElementTypeSelector,{data},null),
            window.T13NE.CE("div", {className: "t13ne-scope-styler"},
          window.T13NE.CE("div", {className: "t13ne-genre-styler"},
          window.T13NE.CE("div", {className: "t13ne-era-styler"},
          window.T13NE.CE("div", {className: "t13ne-facet-styler"},
          window.T13NE.CE("div", {className: "t13ne-tag-styler"},
          window.T13NE.CE("div", {className: "t13ne-cat-styler"},
          window.T13NE.CE("div", {className: "t13ne-geometry-styler"},
          window.T13NE.CE("div", {className: "t13ne-type-styler",},
          window.T13NE.CE("img", {"name": "T13Logo", "id":"T13Logo", "key": window.T13NE.KeyGen(5) },null),
          content)))))))));
        break;
      case "loaded":
      //console.log("loaded:");
       
        return window.T13NE.CE("article",  data ,
          window.T13NE.CE("div", {className: "t13ne-scope-styler"},
          window.T13NE.CE("div", {className: "t13ne-genre-styler"},
          window.T13NE.CE("div", {className: "t13ne-era-styler"},
          window.T13NE.CE("div", {className: "t13ne-facet-styler",},
          window.T13NE.CE("div", {className: "t13ne-tag-styler",},
          window.T13NE.CE("div", {className: "t13ne-cat-styler",},
          window.T13NE.CE("div", {className: "t13ne-geometry-styler",},
          window.T13NE.CE("div", {className: "t13ne-type-styler",},
          window.T13NE.CE("img", {"name": "T13Logo", "id":"T13Logo", },null),
          content,
         )))))))));
        break;
         case "savehtml":
      //console.log("saving jscript:");
       
        data=window.T13NE.ContainerData(this.props,this.state);
        //console.log("saving data:", data);
        if (!window.T13NE.isJSON(data)){
           var jdata=JSON.stringify(data);
         }else{
          var jdata=data;
         }
       
        //console.log("jdata",jdata);
        var thusItWasSelected=this.state.id;
        thusItWasSelected=thusItWasSelected.replace(/-/g,"_"); //snake_case the variablename
        var scriptstuff='var thusItWasSelected_'+thusItWasSelected+' = '+jdata+';console.log("javascript bootstrapping taking place",thusItWasSelected_'+thusItWasSelected+');var currentScript=document.currentScript||(function(){var scripts = document.getElementsByTagName("script");return scripts[scripts.length-1];});window.T13NE.Render(window.T13NE.CE(window.T13NE.Container, thusItWasSelected_'+thusItWasSelected+' ,null),currentScript.parentElement);';
        return  window.T13NE.CE("article",  data, window.T13NE.CE("script",{}, scriptstuff));
         
        break;
      default:
      //console.log("default:");
      return window.T13NE.CE("p",{},"Yeah this shouldn't have appeared should it?")
      break;
    }
    
  }
};









 
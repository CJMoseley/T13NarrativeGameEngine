( function( blocks, editor, element, data, i18n,components ) { 
  var el = element.createElement;
  var { __ } = i18n;
  var RichText = window.T13NE.RichText;
  var withSelect = data.withSelect;
  var AlignmentToolbar = window.wp.blockEditor.AlignmentToolbar?window.wp.blockEditor.AlignmentToolbar:editor.AlignmentToolbar;
  var BlockControls =window.wp.blockEditor.BlockControls?window.wp.blockEditor.BlockControls:editor.BlocksControls;
  var InspectorControls = window.wp.blockEditor.InspectorControls?window.wp.blockEditor.InspectorControls:editor.InspectorControls;
  var Taxon = editor.PostTaxonomies;
  var { InnerBlocks } = window.wp.editor;
  var Toolbar= components.Toolbar;
  var Button=components.Button;
  var Tooltip= components.Tooltip;
  var PanelBody = components.PanelBody;
  var PanelRow = components.PanelRow;
  var TreeSelect = components.TreeSelect;
  var types = window.T13NEbase.Taxon.Taxon.filter(function (el){return el.taxonomy=="t13type";});
  var allTypes = "";
  types.forEach(function (el,ind){
    allTypes+=el.slug+", ";
  })
  // these are the defaults lifted from the parent...

  blocks.registerBlockType("t13ne/element", {
    title: __("T13 Element"),
    description: __(
    "In T13 we consider everything to be an Element. Characters, Plots, Skills, Props, they're all just a T13 Element."),

    icon: window.T13NE.T13ContainerIcon,
    keywords: [
    __("t13"),
    __("element"),
    __("proficiency"),
    __("annex"),
    __("hitch"),
    __("extra"),
    __("npc"),
    __("descendant"),
    __("plot"),
    __("map"),
    __("thread"),
    __("lite"),
    __("weaver"),
    __("tapestry"),
    __("game"),
    __("knot"),
    __("thread"),
    __("pattern"),
    __("note"),
    __("detailed"),
    __("rpg"),
    __("thingy")],

    category: "common",
    attributes: {
     dirty:{type:"boolean",default:false},
     searchmode:{type:"string", default:"search"},
     newmode:{type:"string", default:false},
     updated:{type:"string",default:false},
      t13name: {
        type: "string",
        source: "attribute",
        attribute: "data-t13name",
        selector: "article.t13ne-element-container",
        default: "" },
      t13fullname: {
        type: "string",
        source: "attribute",
        attribute: "data-t13fullname",
        selector: "article.t13ne-element-container",
        default: "" },
      t13aka: {
        type: "string",
        source: "attribute",
        attribute: "data-t13aka",
        selector: "article.t13ne-element-container",
        default: "" },
      
      t13postid: {
        type: "string",
        source: "attribute",
        attribute: "data-t13postid",
        selector:"article.t13ne-element-container",
       },
      className: {
        type: "string",
       default: "article.t13ne-element-container" },
      eltype: {
        type: "string",
        source: "attribute",
        attribute: "data-t13eltype",
        selector: "article.t13ne-element-container" },
      era: {
        type: "string",
        source: "attribute",
        attribute: "data-t13era",
        selector: "article.t13ne-element-container" },
      scope: {
        type: "string",
        source: "attribute",
        attribute: "data-t13scope",
        selector: "article.t13ne-element-container" },
      genre: {
        type: "string",
        source: "attribute",
        attribute: "data-t13genre",
        selector: "article.t13ne-element-container" },
      facet: {
        type: "string",
        source: "attribute",
        attribute: "data-t13facet",
        selector: "article.t13ne-element-container" },
      tag: {
        type: "string",
        source: "attribute",
        attribute: "data-tags",
        selector:"article.t13ne-element-container" },
      cat: {
        type: "string",
        source: "attribute",
        attribute: "data-cats",
        selector: "article.t13ne-element-container" },
      t13description: {
        type: "string",
        source: "attribute",
        attribute: "data-t13description",
        selector:"article.t13ne-element-container",
       },
       t13data:{
        type:"string",
        source:"attribute",
        attribute:"data-t13data",
        selector:"article.t13ne-element-container",
       },
      author: {
        type: "string",
        source: "meta",
        selector: "author"},
      content:{
        type: 'array',
        source: 'children',
        selector: 'article.t13ne-element-container',
        default: [],
      },
      posttitle:{
        type:"string",
        source:"attribute",
        attribute:"data-t13posttitle",
        selector:"article.t13ne-element-container",
      },
      alignment: {
      	type: "string",
      	default: "none",
      },
      geo:{
          type:"string",
          source:"attribute",
          attribute:"data-t13geo",
          selector:"article.t13ne-element-container"
        },
      id:{
        type:"string",
        source:"attribute",
        attribute:"id",
        selector:"article.t13element-container",
        default:window.T13NE.getT13ID("article.t13ne-element-container","t13el", window.T13NE.This(this,this.props))
      },
      loaded:{
        type:"integer",
        default:-1
      },
      edited:{type:"string", 
      default:false}
    },


    edit: function (props) {
      console.log("CONTAINER::edit:props", props);
       if (!props.attributes.id){
         var id=window.T13NE.getT13ID("article.t13ne-element-container","t13el", window.T13NE.This(this,this.props));
          console.log("CONTAINER::setting props", id);
          
          props.setAttributes( {
              "id":id,
          } );
      
      }else{
        console.log("CONTAINER:: found props id", props.attributes.id);
        var id = props.attributes.id;
      }

      if (props.attributes.t13postid ==-1||props.attributes.t13name==""){
        props.setAttributes({"searchmode":"search"});
      }else{
        props.setAttributes({"searchmode":false});
      }
      
    	var alignment = props.attributes.alignment;
  
      var onChangeAlignment = function  (newAlignment) {
                props.setAttributes( { alignment: newAlignment === undefined ? 'none' : newAlignment, dirty:!(props.attributes.dirty?props.attributes.dirty:true) } );
            };
     
      var onChange = function (newName){
          props.setAttributes( { 
            dirty: !props.attributes.dirty,
          t13name:  newName,
        } );
       };
       var updated = props.attributes.updated;
       var updateFromStore =  function(){
        console.log("CONTAINER::updateFromStore()",props.attributes);
        var latest = window.wp.data.select('t13ne/t13store').getT13Elem('latest');
        var newstatus =  window.wp.data.select('t13ne/t13store').getT13Elem(id); 
         console.log("CONTAINER::latest",latest,id); 
         console.log("CONTAINER::newstatus",newstatus);
        if (latest!=-1&&(latest==id||latest==newstatus.t13postid)){
         
         
         
           if (newstatus!==-1&&newstatus.t13ready&&props&&props.attributes){
            console.log("CONTAINER:: ready to update", newstatus, props);
            if (newstatus.title&&newstatus.content&&updated!=="updated:"+newstatus.hash){
              console.log("CONTAINER:: updating", newstatus, props);
              unsubscribe();
              // if (newstatus.t13postid=="new"){
              //   window.T13NE.debounce(function(){unsubscribe=subscriptionService.bind(this);}, 10000, "subservice", false);
              // }
              updated = "updated:"+newstatus.hash;
              props.setAttributes({
                searchmode: newstatus.t13postid=="new"?false:"search",
                newmode:newstatus.t13postid=="new"?"new":false,
                dirty:!props.attributes.dirty,
                updated:updated,
                t13postid:newstatus.t13postid?newstatus.t13postid:-1,
                loaded:typeof(parseInt(newstatus.t13postid))=="number"?parseInt(newstatus.t13postid):-1,
                posttitle:newstatus.title?newstatus.title:"Untitled~-~Unnammed Element~-~A buggy thing",
                t13name:newstatus.t13name?(newstatus.t13name):"Untitled",
                t13fullname:newstatus.t13fullname?newstatus.t13fullname:"Unamed Element",
                t13aka:newstatus.t13aka?newstatus.t13aka:"A buggy thing, created without any names - how weird, error, untitled, unamed, unknown",
                t13description:newstatus.content?(newstatus.content!==props.attributes.t13description?newstatus.content:props.attributes.t13description):"No Content",
                era:newstatus.t13era?newstatus.t13era:[],
                genre:newstatus.t13genre?newstatus.t13genre:[],
                facet:newstatus.t13facet?newstatus.t13facet:[],
                geo:newstatus.t13geo?newstatus.t13geo:[],
                scope:newstatus.t13scope?newstatus.t13scope:[],
                eltype:newstatus.eltype?newstatus.eltype:[],
                t13data:newstatus.t13data?newstatus.t13data:[],
                tag:newstatus.tags?newstatus.tags:[],
                cat:newstatus.cats?newstatus.cats:[],
                author:newstatus.author?newstatus.author:[],
              });
            }
          }  
        }  
       }
        
      var unsubscribe = wp.data.subscribe( () => {
          console.log("CONTAINER:: subscription cycle",props.attributes.id);
          updateFromStore();        
      },this);
     
      var onClick = function (event) {
        console.log("CONTAINER:: onclick()");
       
        props.setAttributes({searchmode:true, t13description:false, t13name:false, updated: false, loaded:-1});
        window.T13NE.T13Alert("Search for a T13 Element");
       
      }
       var onEditClick = function (event){ 
        console.log("CONTAINER:: onEditclick()");
        if (!props.attributes.edited){
          window.T13NE.T13Alert("Edit T13 Element");
          props.setAttributes({newmode:false, searchmode:false, updated:false,edited:!props.attributes.edited});
          window.T13NE.editElement(props.attributes.t13postid);
        }else{
           window.T13NE.T13Alert("Updating T13 Element");
          props.setAttributes({newmode:false, searchmode:false, updated:false, edited:!props.attributes.edited, t13description:false, t13name:false});
        }
        
      };
      var onNewClick = function (event){
        console.log("CONTAINER:: onNewclick()");
        props.setAttributes({newmode:"new", searchmode:false, updated:false, t13postid:"new", t13name:""});
        window.T13NE.T13Alert("Create a New T13 Element");
       
      };
       var componentDidMount = function (e){
        console.log("CONTAINER:: mounted");
        // check id do we have another one with this name if so change this one.
        props.setAttributes({id:window.T13NE.checkID("article.t13ne-element-container","t13el")});
        window.wp.data.dispatch('t13ne/t13store').setT13Elem(props.attributes.id, {t13ready:"block mounted", });
       };
       var componentDidUpdate= function() {
          console.log("CONTAINER::: componentDidUpdate()",props.attributes);
         
          if (newstatus.t13postid=="new"){
            
           // window.T13NE.debounce(function(){unsubscribe=subscriptionService.bind(this);}, 10000, "subservice", false);
          }
      };
       var componentWillUnmount= function (e){
          //any tidying we need to do after deletion. ,
          console.log("CONTAINER:: unmounting...");
          unsubscribe();
          window.T13NE.KeypressTimeout["supdate"] = null;
          delete this.props.attributes;
        };
       // stuff
      if (props.attributes.loaded==undefined){
       
        if (props.attributes.t13postid!=="new"){
            props.setAttributes({loaded:parseInt(props.attributes.t13postid), updated:false});
          }else{
            props.setAttributes({loaded:-1, updated:false});
          }    
      }
      var status=props.attributes.loaded; //still might be undefined...
     
      var newstatus =  window.wp.data.select('t13ne/t13store').getT13Elem(id);
     console.log("CONTAINER::newstatus===", newstatus);
   
      console.log("CONTAINER:: attributes.loaded", props.attributes.loaded);
    if (props.attributes.updated){
      console.log("CONTAINER::attributes.updated", props.attributes.updated);
      unsubscribe();
    }

    //   if (newstatus.t13postid=="new"){
    //     //window.T13NE.debounce(function(){unsubscribe=subscriptionService.bind(this);}, 10000, "subservice", false);
    //   }
    // }else{
    //    //console.log("CONTAINER::attributes.updated", props.attributes.updated);
    //     //unsubscribe = subscriptionService.bind(this);
    //   }

     console.log("blockedit:prerender", props);
     var data ={
      key:window.T13NE.KeyGen(11),
           id:props.attributes.id,
           "data-id":props.attributes.id,
          className:'t13ne-element-container '+props.attributes.className + ' align-' + props.attributes.alignment,
        "data-t13postid":props.attributes.t13postid,
        "data-t13name": props.attributes.t13name,
        "data-t13fullname":props.attributes.t13fullname,
        "data-t13aka":props.attributes.t13aka,
        "data-post-title":props.attributes.posttitle,
        "data-t13description":  props.attributes.t13description,
        "data-author" : props.attributes.author,
        "data-edit":true,
        "data-save":false,
        "data-t13new":props.attributes.newmode?"new":false,
        "data-t13search":props.attributes.searchmode?"search":false,
        "data-t13geom":props.attributes.geo?props.attributes.geo:window.T13NE.getGeometryTerms(props.attributes.t13name),
        "data-t13eltype": props.attributes.eltype?props.attributes.eltype: wp.data.select("core/editor").getEditedPostAttribute("t13type")?wp.data.select("core/editor").getEditedPostAttribute("t13type"):wp.data.select("core/editor").getCurrentPostAttribute("t13type")?wp.data.select("core/editor").getCurrentPostAttribute("t13type"):allTypes,
        "data-t13facet" : props.attributes.facet?props.attributes.facet: wp.data.select("core/editor").getEditedPostAttribute("t13facet")?wp.data.select("core/editor").getEditedPostAttribute("t13facet"):wp.data.select("core/editor").getCurrentPostAttribute("t13facet")?wp.data.select("core/editor").getCurrentPostAttribute("t13facet"):"",
        "data-t13genre" : props.attributes.genre?props.attributes.genre: wp.data.select("core/editor").getEditedPostAttribute("t13genre")? wp.data.select("core/editor").getEditedPostAttribute("t13genre"): wp.data.select("core/editor").getCurrentPostAttribute("t13genre")? wp.data.select("core/editor").getCurrentPostAttribute("t13genre"):"",
        "data-t13era" : props.attributes.era?props.attributes.era:wp.data.select("core/editor").getEditedPostAttribute("t13era")?wp.data.select("core/editor").getEditedPostAttribute("t13era"):wp.data.select("core/editor").getCurrentPostAttribute("t13era")?wp.data.select("core/editor").getCurrentPostAttribute("t13era"):"",      
        "data-t13scope" : props.attributes.scope?props.attributes.scope:wp.data.select("core/editor").getEditedPostAttribute("t13scope")?wp.data.select("core/editor").getEditedPostAttribute("t13scope"):wp.data.select("core/editor").getCurrentPostAttribute("t13scope")?wp.data.select("core/editor").getCurrentPostAttribute("t13scope"):"",
         "data-t13data" : props.attributes.t13data?props.attributes.t13data:wp.data.select("core/editor").getEditedPostAttribute("t13data")?wp.data.select("core/editor").getEditedPostAttribute("t13data"):wp.data.select("core/editor").getCurrentPostAttribute("t13data")?wp.data.select("core/editor").getCurrentPostAttribute("t13data"):"",

        "data-tags" : props.attributes.tag?props.attributes.tag:wp.data.select("core/editor").getEditedPostAttribute("tags")?wp.data.select("core/editor").getEditedPostAttribute("tags"):wp.data.select("core/editor").getCurrentPostAttribute("tags")?wp.data.select("core/editor").getCurrentPostAttribute("tags"):"",
        "data-cats" : props.attributes.cat?props.attributes.cat:wp.data.select("core/editor").getEditedPostAttribute("categories")?wp.data.select("core/editor").getEditedPostAttribute("categories"):wp.data.select("core/editor").getCurrentPostAttribute("categories")?wp.data.select("core/editor").getCurrentPostAttribute("categories"):""
        

      };
        //console.log("blockedit:containerData",data);

        if (!props.attributes.t13description&&props.attributes.searchmode){
           return [
         el(BlockControls,{ key: 'controls'+window.T13NE.KeyGen(6) },
          el(AlignmentToolbar, { value: alignment,
                  onChange: onChangeAlignment, key:window.T13NE.KeyGen(7),}
          )),
         el('div',{},
        el(window.T13NE.Searchbox, data, null),
        (window.T13NE.Can_edit()&&!props.attributes.searchmode)?el("button",{onClick:onClick,key:window.T13NE.KeyGen(9),}, "Change Element"):null,
        (window.T13NE.Can_edit()&&!props.attributes.newmode)?el("button",{onClick:onNewClick,key:window.T13NE.KeyGen(9),}, "New Element"):null,
        el("div",{id:props.attributes.id+"-bubbleanchor",className:"t13ne-bubbleanchor", }, null), )] ;
        }else{
          //unsubscribe = subscriptionService.bind(this);
            return [
         el(BlockControls,{ key: 'controls'+window.T13NE.KeyGen(6) },
          el(AlignmentToolbar, { value: alignment,
                  onChange: onChangeAlignment, key:window.T13NE.KeyGen(7),}
          )),
         el('div',{},
       el( window.T13NE.Container, data ,  null),
       
        (window.T13NE.Can_edit()&&!props.attributes.searchmode)?el("button",{onClick:onClick,key:window.T13NE.KeyGen(9),}, "Change Element"):null,
         (window.T13NE.Can_edit()&&!props.attributes.searchmode)?el("button",{onClick:onEditClick,key:window.T13NE.KeyGen(9),}, props.attributes.edited?"Update Following Edit":"Edit Element"):null,
        (window.T13NE.Can_edit()&&!props.attributes.newmode)?el("button",{onClick:onNewClick,key:window.T13NE.KeyGen(9),}, "New Element"):null,
        React.createElement("div",{id:props.attributes.id+"-bubbleanchor",className:"t13ne-bubbleanchor", }, null), )] ;
        }


	      
	     // el(InnerBlocks, { template: ProficiencyTemplate }))
	    
    },

    save: function (props) {
      console.log("blocksave:props ",props);
      var id=props.attributes.id?props.attributes.id:window.T13NE.getT13ID("article.t13element-container","t13el", window.T13NE.This(this,this.props)); 
      var save = el('div',{},el(window.T13NE.Container,{
        "id":id,
        className:'t13ne-element-container '+props.attributes.className + ' align-' + props.attributes.alignment,
        "data-t13postid":props.attributes.t13postid,
        "data-t13name": props.attributes.t13name,
        "data-t13fullname":props.attributes.t13fullname,
        "data-t13aka":props.attributes.t13aka,
        "data-post-title":props.attributes.posttitle,
        "data-t13description": props.attributes.t13description,
        "data-author" : props.attributes.author,
        "data-t13geom":props.attributes.geo?props.attributes.geo:0,
        "data-t13eltype": props.attributes.eltype?props.attributes.eltype:"thread",
        "data-t13facet" : props.attributes.facet?props.attributes.facet: "all",
        "data-t13genre" : props.attributes.genre?props.attributes.genre:"core",
        "data-t13era" : props.attributes.era?props.attributes.era:"timeless",
        "data-t13scope" : props.attributes.scope?props.attributes.scope:"omni",
        "data-t13data":props.attributes.t13data?props.attributes.t13data:"",
        "data-tags" : props.attributes.tag?props.attributes.tag:"",
        "data-cats" : props.attributes.cat?props.attributes.cat:"",
        "data-edit":false,
        "data-save":true}, null)); 
      //console.log("save",save);
      return save;
       }
    }
 );
} )(
window.wp.blocks,
window.wp.editor,
window.wp.element,
window.wp.data,
window.wp.i18n,
window.wp.components);


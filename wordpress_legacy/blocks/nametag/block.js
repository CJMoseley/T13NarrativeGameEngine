(function (blocks, editor, element, data, i18n, components) {
  var el = window.T13NE.CE;
  var RichText =window.T13NE.RichText;
  var { __ } = i18n;
  //var RichText = editor;
  //var geometry = data.select("core/editor").getCurrentPostAttribute("taxonomies","T13Geo");
  //var withSelect = data.withSelect;
 
  blocks.registerBlockType("t13ne/nametaga", {
    title: __("T13 Name Tag"),
    description: __(
    "In T13, every Element generally has more than one name that it is known by (there are a few exceptions, but you'll find them along the way). Each name is generally considered equally important, especially for Characters, where the Character has a Full name, but most people know them by their first name, and family may have shorter version of that name, friends may have a number of names that they know the character as, depending upon the context, from work colleague, drinking buddy or classmates."),

    icon: window.T13NE.nameTagIcon,
    keywords: [
    __("geometry"),
    __("gematria"),
    __("numerology")],
    inserter:false,
    category: "common",
    atttributes: {
       currentname:{
        type:"string",
        source:"html",
        selector:"p.t13ne-nickname-box",
        default:["Joe"],
      },
      fullname:{
        type:"string",
        source:"html",
        selector:"p.t13ne-fullname-box",
        default:["Josephine Edna Bloggs"],
      },
      aliases:{
        type:"array",
        source:"children",
         selector:"li.t13ne-aka-box",
         default:["No known Aliases"],
      },
      // t13names: {
      //   type: "string",
      //    source: "attribute",
      //    attribute: "data-t13names",
      //    selector: "div.t13ne-name-tag",
        
      // }, 
      className: {
        type:"string",
        source:"attribute",
        attribute:"className",
        selector:"div.t13ne-name-tag",
        default:"t13ne-nametag"
      },
      t13geo:{
         type:"array",
         source:"attribute",
         attribute: "data-t13geo",
         selector:"aside.t13ne-geometry-aside",
         default:[0,0]
      },
      // idder:{
      //   type:"string",
      //    source:"attribute",
      //    attribute:"data-idder",
      //    selector:"aside.t13ne-name",
      // },
     
    },
    edit: function (props) {
      console.log("nametag-edit ",props);
      //const { attributes: { t13names, className, t13Geo, id }, setAttributes, className } = props;
      //this.updateFinally = window.T13NE.debounce(this.updateFinally.bind(this),1300, "nameUpdate", false, this);
     
      
      const onClickGeo = event =>{
        //console.log("onClickGeo",event);
        var geonum = event.target.value;
        //console.log("geonum",geonum);
        if (window.T13NE.IsSet(props.attributes.t13geo)){
          if (window.T13NE.Contains(props.attributes.t13geo,geonum)){
            props.setAttributes({t13geo: JSON.stringify([geonum])});
            //props.setAttributes({idder:props.clientId});
          }
        }else{
          props.setAttributes({t13geo: JSON.stringify([geonum])});
        }
        //console.log("geometry clickgeo ", props.attributes);
      }
      const onChangeGeo = neoGeo =>{
        console.log("newGeo=",neoGeo);
        props.setAttributes({t13geo:neoGeo});
      }
     var aka =Array.isArray(props.attributes.aliases)?props.attributes.aliases.join(" / "):"No known Aliases";
     console.log("aka", aka);
     var geo =  el(window.T13NE.T13Geometry, {className:"t13ne-geometry", "data-t13name":props.attributes.currentname, "data-t13fullname":props.attributes.fullname, "data-t13aka":aka, "data-t13geo": props.attributes.t13geo, "data-onchange-geo":onChangeGeo, });
     console.log("geo", geo);
     var nametagview = el("div",{className:props.attributes.className+" t13ne-name-tag", "data-t13names":props.attributes.t13names},
        el("p",{className:"t13ne-full-name"},
          el("strong",{className:"t13ne-fullname-title"},"Full or True Name"),
          el(RichText,{
            tagname:"span",
            className:"t13ne-fullname-box",
            placeholder:__("Full Name", 't13ne/t13ne-nametag'),
            keepPlaceholderOnFocus:true,
            value: props.attributes.fullname,
            onChange:newName=>{
            props.setAttributes({"fullname":newName});}
          },null)
        ),

        el("p",{className:"t13ne-current-name"},
          el("strong",{className:"t13ne-fullname-title"},"Commonly known as:"),
          el(RichText,{
            tagname:"span",
          className:"t13ne-nickname-box",
          placeholder:"Commonly known as",
           placeholder:__("Current Name or Nickname", 't13ne/t13ne-nametag'),
          keepPlaceholderOnFocus:true,
          value: props.attributes.currentname,
          onChange: newName=>{
            props.setAttributes({"currentname":newName});
          },
          },null),
      ),
         el("p",{className:"t13ne-other-names"},
          el("strong",{className:"t13ne-fullname-title"},"Also Known As:"),
         
          el(RichText,{
              tagname:"ul",
              multiline:"li",
              key:window.T13NE.KeyGen(1),
              className:"t13ne-aka-box",
              placeholder:"Also Known As",
              value: props.attributes.aliases,
              onChange: newName=>{
                console.log("updated array",newName);
                console.log (typeof newName);
              props.setAttributes({"aliases":newName});
          },
            },null),
          ),geo
      );
     console.log("nametagview",nametagview);
    return nametagview;
     //  return [
	    //   el("div", { className: props.attributes.className },
     //     el(window.T13NE.RichText,{
     //      tagName:"p",
     //      className:"t13ne-name",
     //      placeholder:"Name",
     //      value:t13name,
     //      onChange:onChangeName },null),
	    //   	el(window.T13NE.T13Geometry, { "data-t13name": props.attributes.t13name, key:window.T13NE.KeyGen(5), }," ")
	    //   )
	    // ];
    },

    save: function (props) {
      var aka = props.attributes.aliases?props.attributes.aliases.join(" / "):"No known Aliases";
     var nametagview = el("div",{className:props.attributes.className+" t13ne-name-tag", "data-t13names":props.attributes.t13names},
         el("p",{className:"t13ne-full-name"},
          el("strong",{className:"t13ne-fullname-title"},"Full or True Name"),
          el(RichText,{
            tagname:"span",
            className:"t13ne-fullname-box",
  
            value: props.attributes.fullname,
           
          },null)
        ),

        el("p",{className:"t13ne-current-name"},
          el("strong",{className:"t13ne-fullname-title"},"Commonly known as:"),
          el(RichText,{
            tagname:"span",
          className:"t13ne-nickname-box",
         
        
          value: props.attributes.currentname,
          
          },null),
      ),
         el("p",{className:"t13ne-other-names"},
          el("strong",{className:"t13ne-fullname-title"},"Also Known As:"),
         
          el(RichText,{
              tagname:"ul",
              multiline:"li",
              key:window.T13NE.KeyGen(1),
              className:"t13ne-aka-box",
             
              value: props.attributes.aliases,
             
            },null),
      ),
         el(window.T13NE.T13Geometry, {className:"t13ne-geometry", "data-t13name":props.attributes.currentname, "data-t13fullname":props.attributes.fullname, "data-t13aka":aka, "data-t13geo": props.attributes.t13geo })
         );
     return nametagview;
    }
  });
      

})(
window.wp.blocks,
window.wp.editor,
window.wp.element,
window.wp.data,
window.wp.i18n,
window.wp.components);
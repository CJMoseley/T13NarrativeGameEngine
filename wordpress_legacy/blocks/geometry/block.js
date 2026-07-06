(function (blocks, editor, element, data, i18n, components) {
  var el = window.T13NE.CE;
  var { __ } = i18n;
  //var RichText = editor;
  //var geometry = data.select("core/editor").getCurrentPostAttribute("taxonomies","T13Geo");
  //var withSelect = data.withSelect;
 
  blocks.registerBlockType("t13ne/t13ne-geometry", {
    title: __("T13 Name and Geometry"),
    description: __(
    "In T13, every Element (from a galaxy, to a child&#39;s toy) has a name, and that name grants it what we call a Geometry, that describes, at least on some level, how it behaves."),

    icon: window.T13NE.nameTagIcon,
    keywords: [
    __("geometry"),
    __("gematria"),
    __("numerology")],
    inserter:false,
    category: "common",
    atttributes: {
      t13names: {
        type: "string",
         source: "attribute",
         attribute: "data-t13names",
         selector: "aside.t13ne-name",
        
      }, 
      className: {
        type:"string",
        source:"attribute",
        attribute:"className",
        selector:"aside.t13ne-name",
        default:"t13ne-nametag"
      },
      t13geo:{
         type:"string",
         source:"attribute",
         attribute: "data-t13geo",
         selector:"aside.t13ne-geometry-aside",
         default:'[0,0]'
      },
      idder:{
        type:"string",
         source:"attribute",
         attribute:"data-idder",
         selector:"aside.t13ne-name",
      },
      nickname:{
        type:"string",
        // source:"html",
        // selector:".t13ne-nickname-box",
      },
      fullname:{
        type:"string",
        // source:"html",
        // selector:".t13ne-fullname-box",
      },
      aliases:{
        type:"string",
        // source:"html",
        // selector:".t13ne-aka-box",
      }
    },
    edit: function (props) {
      console.log("geometry-edit ",props);
      //const { attributes: { t13names, className, t13Geo, id }, setAttributes, className } = props;
      //this.updateFinally = window.T13NE.debounce(this.updateFinally.bind(this),1300, "nameUpdate", false, this);
      const onChangeName = newName => {
        //console.log( "newName =",newName);
      
        if (window.T13NE.isJSON(newName)){
          var nuName = JSON.parse(newName); 
          props.setAttributes({t13names:newName,nickname: nuName[0], fullname:nuName[1], aliases:nuName[2]});
        }
        if (Array.isArray(newName)){
          props.setAttributes({ t13names: JSON.stringify(newName), nickname: newName[0], fullname:newName[1], aliases:newName[2]});
        }
        if (typeof(newName)=="string"){
          props.setAttributes({t13names: JSON.stringify([newName,NewName, "No known aliases"]), nickname:newName, fullname:newName, aliases:"No known aliases"});
        }
        //console.log("geometry ", props.attributes);
        
      };
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
      const onChangeGeo = newGeo =>{
        //console.log("newGeo=",newGeo);
        props.setAttributes({t13geo:JSON.stringify([newGeo])});
       // props.setAttributes({idder:props.clientId});
        //console.log("geometry change geo", props.attributes);
      }
      // if (props.attributes.idder===undefined){
      //     window.T13NE.UseEffect(() => {
      //       props.setAttributes({idder:props.clientId});
      //       console.log("geometry attributes ", props.attributes);
      //       return ()=>{
      //         cleanup
      //       }
      //     },[]);
      // }
      var names =[];
      var nameswrite="";
      if (props.attributes.t13names!==undefined){
        names = JSON.parse(props.attributes.t13names);
      }else{
        names = [props.attributes.nickname?props.attributes.nickname:"Jo",props.attributes.fullname?props.attributes.fullname:"Josephine Bloggs", props.attributes.aliases?props.attributes.aliases: "Josey / Josephine / Joe Bloggs / Jo Bloggs"];
        //console.log("no names found! Where are my saved atttributes?",props);
        //names = [window.T13NE.CreateRandomName(window.T13NE.RNG(1,2)), window.T13NE.CreateRandomName(window.T13NE.RNG(2,7))+" "+window.T13NE.CreateRandomName(window.T13NE.RNG(1,9))+" "+window.T13NE.CreateRandomName(window.T13NE.RNG(1,4)), window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))+","+window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))+","+window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))+","+window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))];
      }
      if (names.length==3){
        nameswrite = JSON.stringify(names);
      }
    if (props.attributes.idder===undefined){props.setAttributes({idder:window.T13NE.getT13ID("aside.t13ne-name",'t13nam', window.T13NE.This(this,props))});}
      var ret =el(window.T13NE.Name, {"data-t13id": props.attributes.idder,className: props.attributes.className, "data-t13names":nameswrite, "data-t13name":names[0], "data-t13fullname":names[1], "data-t13aka":names[2], "data-t13geo":props.attributes.t13geo, "data-onclick":onClickGeo, "data-onchange-geo":onChangeGeo, onChange:onChangeName},"");
      console.log("edit ret",ret);
      return ret;



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
      console.log("save geo", props, this);
      var names =[];
      var nameswrite="";
      if (props.attributes.t13names!==undefined){
        names = JSON.parse(props.attributes.t13names);
      }else{
        names = [props.attributes.nickname?props.attributes.nickname:"Jo",props.attributes.fullname?props.attributes.fullname:"Josephine Bloggs", props.attributes.aliases?props.attributes.aliases: "Josey / Josephine / Joe Bloggs / Jo Bloggs"];
        //console.log("no names found! Where are my saved atttributes?",props);
        //names = [window.T13NE.CreateRandomName(window.T13NE.RNG(1,2)), window.T13NE.CreateRandomName(window.T13NE.RNG(2,7))+" "+window.T13NE.CreateRandomName(window.T13NE.RNG(1,9))+" "+window.T13NE.CreateRandomName(window.T13NE.RNG(1,4)), window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))+","+window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))+","+window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))+","+window.T13NE.CreateRandomName(window.T13NE.RNG(1,6))];
      }
      if (names.length==3){
        nameswrite = JSON.stringify(names);
      }
      var idder = props.attributes.idder?props.attributes.idder:window.T13NE.getT13ID("aside.t13ne-name", 't13nam', window.T13NE.This(this, props), 'save');
     
      var ret = el(window.T13NE.SaveName, {"data-t13id":idder, className: props.attributes.className, "data-t13names":nameswrite, "data-t13name":names[0], "data-t13fullname":names[1], "data-t13aka":names[2], "data-t13geo":props.attributes.t13geo},"");
      console.log("save ret ",ret);
      return ret; 
    }
  });
      

})(
window.wp.blocks,
window.wp.editor,
window.wp.element,
window.wp.data,
window.wp.i18n,
window.wp.components);
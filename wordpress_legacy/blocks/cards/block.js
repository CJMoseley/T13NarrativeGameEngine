(function (blocks, editor, element, data, i18n,components ) {
  var el = window.T13NE.CE;
  var { __ } = i18n;
  var richText = editor;
 
//  var withSelect = data.withSelect;
  var { InnerBlocks } = window.wp.editor;
  var randyNumber=window.T13NE.RNG(0,53,0);
  var cartenn=0;
 

blocks.registerBlockType("t13ne/t13ne-card", {
    title: __("T13 Card"),
    description: __(
    "In T13 we can use playing cards to describe various aspects of the system, like how deadly that stabbing was, how Mercari bend their Dooms, how Yarn-Tellers Doomweave, how Bulmäs soulwalk and shapechange, or how Plots engage Characters. The card details are seperated into Ordeal, Wyrd Tarot, and Yarn effects, with sub-effects such as how the Yarn card will behave if played during a Warp's Fray or Snag. "),

    icon: window.T13NE.T13CardIcon,
    keywords: [
    __("card"),
    __("cards"),
    __("yarn cards"),
    __("wyrd tarot"),
    __("yarn-teller"),
    __("lea paths"),
    __("animal paths"),
    __("dooms"),
    __("doom weave"),
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

      t13necard: {
        type: "string",
        source: "attribute",
        attribute: "data-t13necard",
        selector: "figure",
     },

      t13card:{
        type: "string",
        source: "attribute",
        attribute: "t13card",
        selector:"figure",
       
      },

       yarn: {
        type: "string",
        source: "attribute",
        attribute: "data-t13neyarn",
        selector: "figure",
        },

         wyrd: {
        type: "string",
        source: "attribute",
        attribute: "data-t13newyrd",
        selector: "figure",
        },

         lea: {
        type: "string",
        source: "attribute",
        attribute: "data-t13nelea",
        selector: "figure",
       },

         ordeal: {
        type: "string",
        source: "attribute",
        attribute: "data-t13neordeal",
        selector: "figure",
         },
         stress: {
          type: "string",
        source: "attribute",
        attribute: "data-t13nestress",
        selector: "figure",
         },
         faceup: {
        type: "string",
        source: "attribute",
        attribute: "data-t13nefaceup",
        selector: "figure",
       },

      },


    edit: function (props) {
      console.log("edit props",props);
      
      
      if (props.attributes.id===undefined) {//console.log("updating id");
        var idder=props.clientId;
        props.setAttributes({id:idder});
      }
      var ucard=0;
      if (window.T13NE.Cards!==undefined&&window.T13NE.Suits!==undefined){
       // console.log("found cards and suits");
        if (props.attributes.t13necard===undefined||props.attributes.t13necard=="random"){
         // console.log("setting attributes");
          props.setAttributes({"t13card":randyNumber},{"t13necard":"random"});
          ucard= window.T13NE.Cards[randyNumber];
        }else{
          ucard = window.T13NE.Cards[props.attributes.t13necard];
        }   
        console.log("ucard",ucard);
        var ucode = ucard.Unicode;
        var unicard =  [el("strong",{"className":"t13ne-title"}, "Card: "),el("span",{"className":"t13ne-card-unicode",dangerouslySetInnerHTML:{__html:ucode}}, null )];
      }
       var PickACard = el(components.SelectControl,{
        label:"Pick a Card",
        value: props.attributes.t13necard!==undefined?props.attributes.t13necard:"random",
        options:window.T13NE.CardList.concat({label:"Random",value:"random"}),
        onChange:function(t13necard){
          console.log("change card",t13necard);
          props.setAttributes({"t13necard":t13necard}, {"t13card":t13necard!=="random"?t13necard:randyNumber});

        }
      }); 

      //console.log("facets:",facets);
      // console.log("carduni", this.t13necarduni)
    // console.log("props.attributes ",props.attributes);
      return [
       el(editor.InspectorControls, null,
          el(components.PanelBody, {
            title: __('Select a card', 't13ne-card') },

          el(components.PanelRow, null, PickACard),
          el(components.PanelRow, {title:__('Card', 't13ne-card')}, 
            el("p", {className:"t13ne-unicard" }, unicard ),
          ),
        )),
        el(window.T13NE.T13Card,{ 
          "data-t13necard": props.attributes.t13necard!==undefined?props.attributes.t13necard:"random", 
          "t13card" : props.attributes.t13card!==undefined?props.attributes.t13card:randyNumber,
          "id":props.attributes.id!==undefined?props.attributes.id:idder,
          "data-t13newyrd" : props.attributes.wyrd,
          
          "data-t13neyarn" : props.attributes.yarn,
          "data-t13nelea" : props.attributes.lea,
          "data-t13neordeal" : props.attributes.ordeal,
          "data-t13nestress" : props.attributes.stress,
          "data-t13nefaceup" : props.attributes.faceup, },null) ];
    },
    save: function (props) {
        var random="random";

          var idder=window.T13NE.getT13ID("figure[t13card].t13ne-card","card",window.T13NE.This(this,props));
        
      
        var card=el(window.T13NE.T13Card,{"data-t13necard":props.attributes.t13necard!==undefined?props.attributes.t13necard:random,"t13card" : props.attributes.t13card!==undefined?props.attributes.t13card:randyNumber, "id":props.attributes.id!==undefined?props.attributes.id:idder, "data-t13nelea" : props.attributes.lea, "data-t13newyrd" : props.attributes.wyrd, "data-t13neyarn" : props.attributes.yarn, "data-t13nestress":props.attributes.stress,"data-t13neordeal" : props.attributes.ordeal,"data-t13nefaceup" : props.attributes.faceup, },null);
       // console.log("save props",props);
       // var figure=el("figure",{"data-t13necard":props.attributes.t13necard!==undefined?props.attributes.t13necard:random,"t13card" : props.attributes.t13card!==undefined?props.attributes.t13card:randyNumber, "id":props.attributes.id!==undefined?props.attributes.id:idder, "data-t13nelea" : props.attributes.lea, "data-t13newyrd" : props.attributes.wyrd, "data-t13neyarn" : props.attributes.yarn,"data-t13neordeal" : props.attributes.ordeal,"data-t13nestress":props.attributes.stress, "data-t13nefaceup" : props.attributes.faceup, },null);
      return card;
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


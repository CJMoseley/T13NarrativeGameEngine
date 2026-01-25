(function (blocks, editor, element, data, i18n) {
  // +Search
  // |+input (searches profs, genres, tags, categories, etc)
  // |+facet selector   --+
  // |+geometry selector  +    these selectors should appear only when there are multiple responses to the search
  // |+scope selector     +--  they should therefore show a count of results and the tags etc that something 
  // |+era selector       +    appears within, and probably reorder by dragging.
  // |+genre selector     +
  // |+result           --+
  // +AddnewProf - should probably be in the editor/side bar rather than main body, but perhaps a link?

  var el = element.createElement;
  var { __ } = i18n;
  var richText = editor;
  var Taxon = editor.PostTaxonomies;
  //wp.data.select( 'core' ).getEntityRecords( 'postType', 'post', { categories: [ /* ... */ ] } )
  var types=window.wp.data.select('core').getEntityRecords('postType','element', {taxonomies: "t13type"});
//console.log('prof; type',types);
//var genres=window.wp.data.select('core').getEntityRecords('taxonomies');
 var withSelect = data.withSelect;
  var { InnerBlocks } = window.wp.editor;

  
  

  var iconProf =  el("svg",{
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg" },
    el("path", { fill: "none", d: "M0 0h24v24H0V0z" },null),
      el("g", null, el("path", {d: "M20 4v12H8V4h12m0-2H8L6 4v12l2 2h12l2-2V4l-2-2z" },null),
      el("path", { d: "M12 12l1 2 3-3 3 4H9z" },null),
      el("path", { d: "M2 6v14l2 2h14v-2H4V6H2z" },null)));

  blocks.registerBlockType("t13ne/t13ne-proficiencies", {
    title: __("T13 Proficiency"),
    description: __(
    "In T13 a Proficiency is the smallest mimetic unit used in the game, it is the representative knowledge and experience of any broad or specific subject, object or process."),

    icon: iconProf,
    keywords: [
    __("profs"),
    __("proficiencies"),
    __("proficiency"),
    __("annex"),
    __("thingy")],
    inserter:false,
    category: "common",
    atttributes: {
      profid: {
        type: "number",
        source: "attribute",
        attribute: "data-prof-id",
        selector: "section" },

        className: {
        type: "string",
        source: "attribute",
        attribute: "className",
        selector: "section" },
         eltype: {
        type: "string",
        source: "attribute",
        attribute: "data-eltype",
        selector: "div" },
      eras: {
        type: "string",
        source: "attribute",
        attribute: "data-eras",
        selector: "div" },
      scopes: {
        type: "string",
        source: "attribute",
        attribute: "data-scopes",
        selector: "div" },
      genres: {
        type: "string",
        source: "attribute",
        attribute: "data-genres",
        selector: "div" },
      facets: {
        type: "string",
        source: "attribute",
        attribute: "data-facet",
        selector: "div" },
      tags: {
        type: "string",
        source: "attribute",
        attribute: "data-tags",
        selector: "div" },
      cats: {
        type: "string",
        source: "attribute",
        attribute: "data-cats",
        selector: "div" },
     
      author: {
        type: "string",
        source: "meta",
        selector: "author"},

      profs:{
        type:"string"}

       },
    edit: withSelect( function( select ) {
            return {
                profs: select( 'core' ).getEntityRecords( 'postType', 'elements' )
            };
        } )( function( props ){

          if (props.attributes.profid){
            var css = props.attributes.className;
            var pid = props.attributes.profid;
            var cats = wp.data.select("core/editor").getEditedPostAttribute("categories");
            var tags = wp.data.select("core/editor").getEditedPostAttribute("tags");
            var facets = wp.data.select("core/editor").getEditedPostAttribute("t13facets");
            var scope = wp.data.select("core/editor").getEditedPostAttribute("t13scopes");
            var era = wp.data.select("core/editor").getEditedPostAttribute("t13eras");
            var genre = wp.data.select("core/editor").getEditedPostAttribute("t13genres");
            var type = JSON.stringify(window.T13NE.findTerm("Proficiency,Thread"));
            return [ 
            el(BlockControls,{ key: 'controls' },
              el(AlignmentToolbar, { value: alignment,
                  onChange: onChangeAlignment,
              }
            )),
          
            el(InspectorControls, null,
              el(PanelBody, {
                  title: __('Element Type', 't13ne/t13ne-container') },
                el(PanelRow, {className:"t13ne-container-panel"},
                  el(Taxon,{className:"t13ne-taxon-inspector"}, null),
  ))),
              el(window.T13NE.Proficiency,{className:css, "data-prof-id":pid, "data-t13ne-edit":true, "data-cats":cats,"data-tags":tags, "data-facet":facets, "data-eltype":type, "data-scopes":scope, "data-eras":era, "data-gernres":genre},null)
              ];
          }else{
            if (!props.profs){
              return "...loading...";
            }
            if (props.profs.length ===0){
              return "No Proficiencies found. Install the Core Game frmo the dashboard."
            }

          }
      

    }),

    /*withSelect( function( select ) {return {
                   posts: select( 'core' ).getEntityRecords( 'postType', 'element' )
               };
           } )( function( props ) {
                 if ( ! props.posts ) {
                   return "Loading...";
               }
                 if ( props.posts.length === 0 ) {
                   return "No posts";
               }
              var className = props.className;
             var profid = props.attributes.profid;
             var profName = props.attributes.profName;
             var profDescription = props.attributes.profDescription;
                //var profider = props.posts[ 0 ];
               console.log('Props:'+ JSON.stringify(props));
               function onChangeTitle(value){
                 props.setAttributes( { profName: value } );
                 currcat = wp.data.select("core/editor").getEditedPostAttribute("categories");
                  }
               function onChangeDescription(value){
                 props.setAttributes( { profDescription: value } );
                 currcat = wp.data.select("core/editor").getEditedPostAttribute("categories");
                  }
               function onChangeID(value){
                 props.setAttributes({profid:value});
                 currcat = wp.data.select("core/editor").getEditedPostAttribute("categories");
                  }
               console.log('funcs primed');
               return el('div', { className:className, 'data-prof-id':props.attributes.profid },
                 el('details', {className:'t13ne-profdetails'},
                   el('summary', {className:'t13ne-profsummary'},
                     el('strong',{className:'t13ne-proftitle'},'Proficiency: '),
                       el(richText,{
                         tagName:'p',
                         className:'t13ne-profname',
                         onChange: onChangeTitle,
                           value: profName,
                           default:'Unnamed Proficiency' })),
                   el(richText,{tagName:'div', className: 't13ne-description',onChange: onChangeDescription,
                       value: profDescription, default:'An Undescribed Proficiency' })
                 ));
               }*/







    save: function (props) {
      var css = props.attributes.className;
      var pid = props.attributes.profid;
      return React.createElement(window.T13NE.Proficiency,{className:css, "data-prof-id":pid},null);
    }
    /*save: function(props) {
              return el( 'div', { className:props.className, 'data-prof-id':props.attributes.profid },
                el('details', {className:'t13ne-profdetails'},
                    el('summary',{className:'t13ne-profsummary'},
                      el('strong',{ className:'t13ne-proftitle' },'Proficiency: '),
                      el(richText.Content, { tagName: 'strong', value: props.attributes.profName,style:'t13ne-profname',}
                        )
                      ),
                    el(richText.Content,{ tagName: 'div', value:props.attributes.profDescription,style: 't13ne-description' },)
                )
              );
          }*/ });

})(
window.wp.blocks,
window.wp.editor,
window.wp.element,
window.wp.data,
window.wp.i18n);
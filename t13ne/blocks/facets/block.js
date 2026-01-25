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
  var facets = data.select("core/editor").getCurrentPostAttribute("t13facets");
  //wp.data.select( 'core' ).getEntityRecords( 'postType', 'post', { categories: [ /* ... */ ] } )
  //var types=window.wp.data.select('core').getEntityRecords('postType','element', {taxonomies: "t13type"});
//console.log(window.types);
//var genres=window.wp.data.select('core').getEntityRecords('taxonomies');
//  var withSelect = data.withSelect;
  var { InnerBlocks } = window.wp.editor;
  
 blocks.registerBlockType("t13ne/t13ne-facet", {
    title: __("T13 Facet"),
    description: __(
    "In T13 Facets are used to describe Characters and Descendants in terms of a point in twenty-four dimensional space. Each Facet represents an aspect of the Character from how scary they are, to how faithful they might be. This block should display the details of the Facet selected."),

    icon: window.T13NE.FacetIcon,
    keywords: [
    __("facets"),
    __("facet aspects"),
    __("facet"),
    __("stuff"),
    __("thingy")],

    category: "common",
    atttributes: {
      className: {
        type: "string",
        source: "attribute",
        attribute: "className",
        selector: "div" },

      facet: {
        type: "string",
        source: "attribute",
        attribute: "data-facet",
        selector: "div" },

    },


    edit: function (props) {
      var css = props.attributes.className;
      var facets = props.attributes.facet;
      facets = wp.data.select("core/editor").getEditedPostAttribute("taxonomy","t13facet");
      console.log("facets:",facets);
      var pid = props.attributes.profid;
      return [
      React.createElement("div", { className: css, "data-prof-id": pid, "data-prof-facet": facets },
      React.createElement("details", null,
      React.createElement("summary", null, props.attributes.profName),
      React.createElement(T13Geometry,{"name":props.attributes.profName}),
      React.createElement(InnerBlocks, { template: ProficiencyTemplate })))];

    },

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
      return React.createElement(InnerBlocks.Content, null);
    }
    /*save: function(props) {
              return el( 'div', { classname:props.className, 'data-prof-id':props.attributes.profid },
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
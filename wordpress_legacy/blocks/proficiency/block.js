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
  var facets = data.
  select("core/editor").
  getCurrentPostAttribute("t13facets");
  //wp.data.select( 'core' ).getEntityRecords( 'postType', 'post', { categories: [ /* ... */ ] } )
  //var types=window.wp.data.select('core').getEntityRecords('postType','element', {taxonomies: "t13type"});
//console.log(window.types);
//var genres=window.wp.data.select('core').getEntityRecords('taxonomies');
//  var withSelect = data.withSelect;
  var { InnerBlocks } = window.wp.editor;
  /*
                                          background:url(https://i1.wp.com/www.cjmoseley.co.uk/wp/wp-content/uploads/2013/03/T13-Logo.png?fit=600%2C600&ssl=1);
                                          <div class="t13ne-proficiency" data-prof-id="1201">
                                          <details>
                                            <summary>
                                              <strong class="t13ne-proftitle">Proficiency: </strong><strong class="t13-prof-name">Work</strong>
                                            </summary>
                                            <div class="t13ne-postdata">
                                              <!-- Adding Element:Proficiency:Work //-->
                                              <section class="t13ne-geometry">
                                                <details class="t13ne-name">
                                                  <summary> 
                                                    <strong>Geometry: </strong>  <span class="t13ne-geonum">8</span>
                                                  </summary>
                                                  <span class="t13ne-geoname"> Octogon </span>
                                                  <p class="t13ne-description"><strong>Description: </strong> Octagon Characters are powerful, ambitious, but ultimately materialistic individuals.</p>
                                                  <p class="t13ne-gain"><strong>Gain Chi </strong> by acting disciplined, materialistic, or ambitious.</p>
                                                  <p class="t13ne-yang"><strong>Gain Yang </strong> by acting rebellious, bossy, or generous.</p>
                                                  <p class="t13ne-yin"><strong>Gain Yin </strong> by acting opinionated, relaxed, or persevering.</p>
                                                  <p class="t13ne-gift"><strong>Gift: Manifestation </strong><br><span class="t13ne-description">The Octagon Geometry makes people better at physically manifesting their dreams, this usually comes in the form of business skills. They add +1 Success Level to any Action to do with material wealth, business or direct manifestation of their ambition.</span></p>
                                                </details>
                                              </section>
                                              Work is employment, exertion or effort towards a particular goal.<small class="t13ne-disclaimer">This Proficiency was automatically added when adding <a href="http://www.cjmoseley.dev.cc/?post_type=element&amp;p=1200">Working Hard</a>.</small>
                                            </div>
                                            <small>
                                              <p class="t13ne-postdata">
                                                <span class="t13ne-date">Posted : 2019-02-11 22:44:03.</span>
                                              </p>
                                              <p class="t13ne-author"> Created by: </p>
                                              <figure class="t13ne-user">
                                                <details>
                                                  <summary class="t13ne-tooltip">
                                                    <img alt="" src="https://secure.gravatar.com/avatar/58b492056df7476ce2c9642c331f86a3?s=38&amp;d=wavatar&amp;r=g" srcset="https://secure.gravatar.com/avatar/58b492056df7476ce2c9642c331f86a3?s=76&amp;d=wavatar&amp;r=g 2x" class="avatar avatar-38 photo" height="38" width="38">
                                                    <span class="t13ne-tooltip">cjmRules</span>
                                                  </summary>
                                                  <p> <strong>Name: </strong> cjmRules<strong> Geometry: </strong> </p>
                                                  <div data-geo="11"></div>
                                                  <p></p>
                                                  <p class="t13ne-description"></p>
                                                </details>
                                              </figure>
                                              <p></p>
                                            </small>
                                          </details>
                                          <!--//-->
                                          </div>
                                          */
  var ProficiencyTemplate = [
  ["core/paragraph", { placeholder: "Proficiency Title" }],
  ["core/paragraph", { placeholder: "Proificiency Description" }],

  ["core/button", { text: "Add this Proficiency" }],
  ["t13ne/t13ne-geometry",{ placeholder: "Proficiency Title"}] ];

  var iconProf = () =>
  el(
  window.wp.components.SVG,
  {
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg" },

  el(window.wp.components.Path, { fill: "none", d: "M0 0h24v24H0V0z" }),
  el(
  window.wp.components.G,
  null,
  el(window.wp.components.Path, {
    d: "M20 4v12H8V4h12m0-2H8L6 4v12l2 2h12l2-2V4l-2-2z" }),

  el(window.wp.components.Path, { d: "M12 12l1 2 3-3 3 4H9z" }),
  el(window.wp.components.Path, { d: "M2 6v14l2 2h14v-2H4V6H2z" })));



  blocks.registerBlockType("t13ne/t13ne-proficiency", {
    title: __("T13 Proficiency"),
    description: __(
    "In T13 a Proficiency is the smallest mimetic unit, it is the representative knowledge and experience of any broad or specific subject, object or process."),

    icon: iconProf,
    keywords: [
    __("profs"),
    __("proficiencies"),
    __("proficiency"),
    __("annex"),
    __("thingy")],

    category: "common",
    atttributes: {
      profid: {
        type: "number",
        source: "attribute",
        attribute: "data-prof-id",
        selector: "div" },

        className: {
        type: "string",
        source: "attribute",
        attribute: "className",
        selector: "div" },

        facets: {
        type: "string",
        source: "attribute",
        attribute: "data-prof-facet",
        selector: "div" },

      profName: {
        type: "string",
        source: "text",
        selector: ".t13ne-profname",
        default: "Unnamed Proficiency" },

      profDescription: {
        type: "string",
        source: "text",
        selector: ".t13ne-description",
        default: "An undescribed proficiency" } },


    edit: function (props) {
      var css = props.attributes.classname;
      var facets = props.attributes.facets;
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
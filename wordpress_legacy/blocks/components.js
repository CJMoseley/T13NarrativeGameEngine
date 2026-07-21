if (!Array.prototype.filter){Array.prototype.filter = function(func, thisArg) {'use strict'; if ( ! ((typeof func === 'Function' || typeof func === 'function') && this) ) throw new TypeError(); var len = this.length >>> 0, res = new Array(len), t = this, c = 0, i = -1; var kValue; if (thisArg === undefined){while (++i !== len){if (i in this){kValue = t[i]; if (func(t[i], i, t)){res[c++] = kValue; } } } } else{while (++i !== len){if (i in this){kValue = t[i]; if (func.call(thisArg, t[i], i, t)){res[c++] = kValue; } } } } res.length = c; return res; }; }
if (!T13NE){var T13NE={};}
window.T13NE.crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};
if(!window.T13NE.CE){
  ////console.log("T13 Components loading...");
  window.T13NE.ensureKey = function (b){
    try {
      var key = b.key;
      if (key===undefined){
        b.key= window.T13NE.KeyGen('undefinedkey');
      }
      return b;
    } catch (err){
      //console.log ("error b NUll?");
      //console.log( "typed:", typeof b)
      if (typeof b == 'object'){
        //console.log( 'key in b:', key in b);
        console.log('hasOwnProperty:', b.hasOwnProperty('key'));
        b.key = window.T13NE.KeyGen('emergencykey');
        return b;
      }else{
        b={'key': window.T13NE.KeyGen('emergencykey')};
        return b;
      }
     }
     return b;
  }
  window.T13NE.CE = function (a,b,c){ 
   //console.log('t13ne.CE called',a,b,c);
    
    b=window.T13NE.ensureKey(b);
    if (c===null){
      return window.wp.element.createElement(a,b); 
    }else{
      return window.wp.element.createElement(a,b,c);
    }
 }}
  window.T13NE.Hydrate =function (typer,elidom){
    switch(typer){
      case 'card':
        //console.log("attempting to rehydrate card");
      var carte = window.T13NE.CE(window.T13NE.T13Card, {className:elidom.attributes.class.value ,
      "id":elidom.attributes.id.value,
      "data-mode" : elidom.attributes["data-mode"].value,
          "t13card":elidom.attributes["t13card"].value,
          "data-t13nelea": elidom.attributes["data-t13nelea"].value,
          "data-t13necard" :elidom.attributes["data-t13necard"].value,
          "data-t13newyrd" : elidom.attributes["data-t13newyrd"].value,
          "data-t13neyarn" : elidom.attributes["data-t13neyarn"].value,
          "data-t13neordeal" : elidom.attributes["data-t13neordeal"].value,
          "data-t13nefaceup" : elidom.attributes["data-t13nefaceup"].value,
          "data-hydrate":true
    }, null);
    var rooc= window.ReactDOM.hydrateRoot(elidom, carte);
    
    //var carte =  window.ReactDOM.hydrate(carte, elidom );
        
      break;
      default:
      break;
    }
  }

  
  window.T13NE.getThatNode = function(nodename){
   var node = false;
    if (window.wp.element.findDomNode){
      node =window.wp.element.findDomNode(nodename);
      return node;
    }
    if (window.ReactDOM.findDomNode){
      node =window.ReactDOM.findDomNode(nodename);
      return node;
    };
    return node;
  };
  
  window.T13NE.Render = function (a,b){
    ////console.log("Render(",a,b);
    b=window.T13NE.ensureKey(b);
    var root= window.wp.element.createRoot(b);
    root.render(a);};
  window.T13NE.Component = window.React.Component?window.React.Component:window.wp.element.Component;
  window.T13NE.UseEffect = window.React.UseEffect?window.React.useEffect:window.wp.element.useEffect;
  window.T13NE.This = function (me,mine){
    ////console.log("This ",me,mine);
    var node = window.T13NE.getThatNode(me);
    return [node,mine,me];
  }
window.T13NE.Paths={
  "plugin":"",
  "base":"/wp-json/wp/v2/",
  "id":"?id=",
  "post":"posts",
  "elem":"element",
  "rule":"rules",
  "taxo":"taxonomies/",
  "type":"t13type",
  "genr":"t13genre",
  "face":"t13facet",
  "era":"t13era",
  "scop":"t13scope",
  "geom":"t13geo",
  "curr":window.wp.data.select('core/editor').getPermalink()
};
if (!window.T13NEbase.User){
  window.T13NEbase.User = -1;
  window.T13NE.UserPromise = window.wp.apiFetch( {path:"/wp/v2/users/me?context=edit"} ).then(user=> {
    if (window.T13NEbase.User==-1){
      window.T13NEbase.User = user;
        ////console.log("retrieved user data", user);
    }
  });
}
window.T13NE.ThisCharacter={
  loaded:false,
  Chi:0,
  Yin:0,
  Yang:0,
  FacetSway:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  PCType:0, 
  Annexes:{
    Personality:{Boon:0, BoonDraw:0, BoonScore:0, BoonDie:"d0"},
  },

  Gain: function(type){
    let gain =0
    switch(window.T13NE.ThisCharacter.PCType){
      case 0:
      case 1:
      case 2:
      case 3:
      case "Extra":
        gain =1;
      break;
      case 4:
      case "Lite":
        gain = 1;
      break;
      case 5:
      case "Archetype":
        gain =1;
      break;
      case 6:
      case "Grunt":
      case 7:
      case "Goblin":
        if (type=="Chi"){
          window.T13NE.ChiGain(window.T13NE.ThisCharacter.Annexes.Personality.BoonDraw, window.T13NE.ThisCharacter.Annexes.Personality.Boon);
        }else{
           gain = 1;
        }
      break;
      case 8:
      case "Hero":

      break;
      case 9:
      case "Demon":
      
      break;
      case 10:
      case 'Yarn-Teller':
      case 11:
      case 'Demon-Lord':

      break;
      case 12:
      case "Bulmäs":

      break;
      case 13:
      case 'Kaiju':

      break;
      case 14:
      case "Neechies":

      break;
      case 15:
      case 'Increated':

      break;
      default:

      break;
    }
  
}};
window.T13NE.ChiGain=function(gain,limit){
  window.T13NE.ThisCharacter.Chi+=gain;
  let over = limit - window.T13NE.ThisCharacter.Chi
  if (over>0){
    window.T13NE.ThisCharacter.Chi=window.T13NE.ThisCharacter.Annexes.Personality.Boon;
    //console.log("Character too full of Chi to gain these Chi :", over);
  }else{over=0;}
  return over;
}
window.T13NE.findLowestValue = function(arr){
  var len = arr.length, min = Infinity, indices=0;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
}
window.T13NE.Sway={
  facetsway:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  yinTotal:0,
  yangTotal:0,
  taoTotal:0,
  lowPowerScore:0,
  highPowerScore:0,
  lowPowerChi:0,
  highPowerChi:0,
  over:0,
  getFacetSwayIndex:function(type){
    window.T13NE.Facets.forEach(function (facet,find){ if (facet.FacetName == type||facet.Sway==type||facet.FacetName.toLowerCase()==type||facet.Sway.toLowerCase()==type){ return find; } });
  },
  split:function(){
    var yin=[],yang=[];
    this.facetsway.foreach(function(value,ind){
      if (window.T13NE.Facets[find].Yang){
        yang.push(value);
      }else{
        yin.push(value);
      }
    });
    return {"yin":yin,"yang":yang};
  },
  total:function(){
    this.yangTotal=0;
    this.yinTotal=0;
    this.facetsway.foreach(function(facet,find) {
      if (window.T13NE.Facets[find].Yang){
        this.yangTotal+=facetsway[find];
      }else{
        this.yinTotal+=facetsway[find];
      }
    });
    this.taoTotal=this.yinTotal+this.yangTotal;
    this.lowPowerScore = this.taoTotal;
    this.highPowerScore = window.T13NE.Boon.getBoonValue(this.taoTotal/2);
    this.lowPowerChi = window.T13NE.Boon.getBoonReduced(this.taoTotal);
    this.highPowerChi = Math.floor(this.taoTotal/2);
  },
  gain:function(type,gain){
    switch (type){
      case "Yin": // yin sway limited by the Character Yin Facet Boons if they have them
        this.spreadSway('Yin',gain);
      break;
      case "Yang":
        //Yang sway limited by Yang facet Boons if they have them
        this.spreadSway('Yang',gain);
        break;
      case "Tao":
       //Tao Sway can be split and added anywhere, it's flavourless.
        this.spreadSway('Tao',gain);
       break;
      default:
      //facet sway requires extra parsing and checking if you have enough space on each facet so it needs the statblock, as usual.
      //each one has a separate type, and name, so iut could be the Facet name or the Sway name... yuck.
      
      //so we now need to check agains the characters facet boon.
      let facetIndex=this.getFacetSwayIndex(type)
      this.facetsway[facetIndex]+=gain;
      if (window.T13NE.ThisCharacter.Statblock.Stats[facetIndex].boon<=this.facetsway[facetIndex]){
        window.T13NE.ThisCharacter.Sway.facetsway[facetIndex] = this.facetsway[facetIndex];
      }else{
        window.T13NE.ThisCharacter.Sway.facetsway[facetIndex] = window.T13NE.ThisCharacter.Statblock.Stats[facetIndex].boon;
        this.over  = this.facetsway[facetIndex]-window.T13NE.ThisCharacter.Statblock.Stats[facetIndex].boon;
      }

    }
  },
  setSway:function(swayarr){
    this.facetsway = swayarr;
    this.total();
  },

  spreadSway:function(type="",swaypoints=2){
    switch(type){
      case "Tao":
      case "":
        var half = Math.floor(swaypoints/2);
        this.spreadSway("Yin",half);
        this.spreadSway("Yang", swaypoints-half);
        break;
      case "Yin":
      while (swaypoints){
        let ars=this.split();
        this.facetsway.foreach(function(value,find){
          let low = window.T13NE.findLowestValue(ars['Yin']);
          if (!window.T13NE.Facets[find].Yang&&value==low){
            this.facetsway[find]++;
            swaypoints--;
          }
        });
      }
      break;
      case "Yang":
      let ars=this.split();
       while (swaypoints){
        this.facetsway.foreach(function(value,find){
          let low = window.T13NE.findLowestValue(ars['Yang']);
          if (window.T13NE.Facets[find].Yang&&value==low){
            this.facetsway[find]++;
            swaypoints--;
          }
        });
      }
      break;

      default:
      break; 
   }
  },

};
window.T13NE.SwayGain=function(type,gain){
 window.T13NE.Sway.gain(type.gain);
}
window.T13NE.RichText = window.wp.blockEditor.RichText?window.wp.blockEditor.RichText:window.wp.editor.RichText;
/*wp.hooks.addFilter('blocks.registerBlockType', 't13ne/richtext', function(settings,name){ if ( name !== 'core/list' ) {return settings; } return lodash.assign( {}, settings, { supports: lodash.assign( {}, settings.supports, {className: true,anchor:true,} )} ); });
window.T13NE.RTP=function( props ) { if (props.id){ return lodash.assign( props, ...props ); }};
wp.hooks.addFilter('blocks.getSaveContent.extraProps',  't13ne/richtext',  window.T13NE.RTP);
wp.hooks.addFilter('editor.BlockEdit',  't13ne/richtext',  window.T13NE.RTP);*/

//window.T13NE.InnerBlocks = window.wp.blockEditor.InnerBlocks?window.wp.blockEditor.InnerBlocks:window.wp.editor.InnerBlocks?window.wp.editor.InnerBlocks:[];
window.T13NE.getUserPermissions = function (permission){
  /*activate_plugins: true
administrator: true
create_users: true
delete_others_pages: true
delete_others_posts: true
delete_pages: true
delete_plugins: true
delete_posts: true
delete_private_pages: true
delete_private_posts: true
delete_published_pages: true
delete_published_posts: true
delete_themes: true
delete_users: true
edit_dashboard: true
edit_files: true
edit_others_pages: true
edit_others_posts: true
edit_pages: true
edit_plugins: true
edit_posts: true
edit_private_pages: true
edit_private_posts: true
edit_published_pages: true
edit_published_posts: true
edit_theme_options: true
edit_themes: true
edit_users: true
export: true
import: true
install_plugins: true
install_themes: true
level_0: true
level_1: true
level_2: true
level_3: true
level_4: true
level_5: true
level_6: true
level_7: true
level_8: true
level_9: true
level_10: true
list_users: true
manage_categories: true
manage_links: true
manage_options: true
moderate_comments: true
promote_users: true
publish_pages: true
publish_posts: true
read: true
read_private_pages: true
read_private_posts: true
remove_users: true
switch_themes: true
unfiltered_html: true
unfiltered_upload: true
update_core: true
update_plugins: true
update_themes: true
upload_files: true

//or//

administrator:true
*/
  if (window.T13NEbase.User&&window.T13NEbase.User!==-1){
    if (window.T13NEbase.User.capabilities[permission]){
      return window.T13NEbase.User.capabilities[permission];
    }else if (window.T13NEbase.User.extra_capabilities[permission]){
      return window.T13NEbase.User.extra_capabilities[permission];
    }
  }else{return false;}
 
}
window.T13NE.Editing = function (){ return (window.T13NEbase.Page.Action=="edit"&&window.T13NEbase.Page.admin)};
window.T13NE.Can_edit =function (){return window.T13NE.getUserPermissions('edit_posts')&&window.T13NE.Editing()};
window.T13NE.editElement = function (id){
  //https://www.cjmoseley.dev.cc/wp-admin/post.php?post=1669&action=edit
  var url = window.T13NEbase.Page['admin_url']+"post.php?action=edit&post="+id;
  ////console.log("EDITELEMENT", url);
  if (window.T13NE.Can_edit) {window.open( url, "_blank" ); }
}
window.T13NE.debounce = function (func, wait=0, number=0, immediate=false, context=false) {
  ////console.log("debounce",  func, wait, number,immediate, context);
  if (!context){context=this;}
  ////console.log("t13debounce:: context", context);
  var args = arguments;
  return function executedFunction() {
   // //console.log("debouncing executed function");
    if (number||wait=="frame"){
      var later = function() {
        ////console.log("debouncing...");
        window.T13NE.KeypressTimeout[number] = null;
        if (!immediate){
          func.apply(context, args);
        }
      };
      var callNow = immediate && !window.T13NE.KeypressTimeout[number];
      clearTimeout(window.T13NE.KeypressTimeout[number]);
      ////console.log("clearing debounce, and setting a new");
      window.T13NE.KeypressTimeout[number] = setTimeout(later, wait);
      if (callNow) {
        ////console.log("calling debounce immediately");
        func.apply(context, args);}
    
    }else{
      ////console.log("debouncing animation frame");
      if (window.T13NE.KeypressTimeout[0]) {
        ////console.log("cancelling animation frame");
        window.cancelAnimationFrame(window.T13NE.KeypressTimeout[0]);
      }
      window.T13NE.KeypressTimeout[0] = window.requestAnimationFrame(function () {
        ////console.log("setting new animation frame debounce");
        func.apply(context, args);
      });
    }

  };
  
};

window.T13NE.tagWhitelist_ = {
  'A': true,
  'ABBR':true,
  'ADDRESS':true,
  'ARTICLE':true,
  'ASIDE':true,
  'AUDIO':true,
  'B': true,
  'BDI':true,
  'BDO':true,
  'BLOCKQUOTE':true,
  'BODY': true,
  'BR': true,
  'CANVAS':true,
  'CAPTION':true,
  'CITE':true,
  'CODE':true,
  'DD':true,
  'DETAILS':true,
  'DEL':true,
  'DFN':true,
  'DIV': true,
  'DL':true,
  'DT':true,
  'EM': true,
  'FIGCAPTION':true,
  'FIGURE':true,
  'FOOTER':true,
  'H2':true,
  'H3':true,
  'H4':true,
  'H5':true,
  'H6':true,
  'HEADING':true,
  'HR': true,
  'I': true,
  'IMG': true,
  'INS':true,
  'LI':true,
  'MAIN':true,
  'MARK':true,
  'METER':true,
  'NAV':true,
  'OL':true,
  'P': true,
  'PICTURE':true,
  'PRE':true,
  'Q':true,
  'RP':true,
  'RT':true,
  'RUBY':true,
  'S':true,
  'SAMP':true,
  'SECTION':true,
  'SMALL':true,
  'SOURCE':true,
  'SPAN': true,
  'STRIKE':true,
  'STRONG': true,
  'SUB':true,
  'SUMMARY': true,
  'SUP':true,
  'SVG':true,
  'TABLE': true,
  'TEMPLATE':true,
  'TIME':true,
  'TD':true,
  'TH':true,
  'THEAD':true,
  'TFOOT':true,
  'TBODY':true,
  'TR':true,
  'TRACK':true,
  'VIDEO':true,
  'U':true,
  'UL':true,
  'VAR':true,
  'WBR':true,
};
window.T13NE.attributeWhitelist_ = {
  'href': false,
  'src': true,
  'class':true,
  'style':false,
  'data-t13newound-level':true,
  'data-t13necard':true,
  'data-aspect':true,
  'data-facet':true,
  'data-description':true,
  'data-type':true,
  't13card':true,
  'data-t13ne-facet':true,
  'id':true,
  'type':true,
  'title':true,
  "key":true,
};
window.T13NE.hashFNV =function (str, asString, seed){
  var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if( asString ){
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
}
window.T13NE.Hash = function(string) {
  var hash = 0;
  var chr="C";
  if (string.length === 0) return hash;
  for (var i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return window.T13NE.hashFNV(string,1,13)+"-"+hash.toString(36);
};
window.T13NE.titleFromNames = function(names){
  if (typeof (names) =='string'){
    names = names.split('~-~');
  }
  return names.join('~-~');
}
window.T13NE.namesFromTitle = function(title){
  return title.split('~-~');
}
window.T13NE.displayName = function (title){
  if (typeof (title) =='string'){
    title = title.split('~-~');
  }
  return title[0];
}
window.T13NE.getNameFromThis = function(name){
  var t = typeof name;
  switch (t){
    case "string":
      if (window.T13NE.Contains('~-~',name)){
        return window.T13NE.displayName(name);
      }else if (window.T13NE.isJSON(name)){
        return window.T13NE.getNameFromThis(JSON.parse(name));
      }else{
        return name;
      }
    break;
    case "object":
    if (Array.isArray(name)){return name[0];}
    if (typeof name.name !=='undefined'){
      return name.name;
    }
    if (typeof name.title !=="undefined"){
      return window.T13NE.getNameFromThis(name.title);
    }
    break;
    case "number":
      return name;
    break
    default:
      return name;
    break;
  }
}
window.T13NE.arrayify = function (str){
  ////console.log("arrayify",str);

  switch (typeof(str)){
    case "number":
  // //console.log("number");
      return [str];
    break;
    case "string":
    ////console.log("String");
     let d = ['~-~',' , ', ',' ,',',',',' / ','/','&'];
     for (let delimiter of d){
       ////console.log("checkin for delimiter",delimiter);
       ////console.log(str.indexOf(delimiter));
        if (str.indexOf(delimiter)>-1){
          ////console.log("splitter!");
          return str.split(delimiter);
        }
     }
     return [str];
    break;
    case "undefined":
    //console.log("stop trying to arrayify undefined!");
    return undefined;
    default:
    ////console.log(typeof(str));
      return str;
    break;
  }
 }

window.T13NE.Sanitizer = document.createElement('iframe');
window.T13NE.Sanitizer['sandbox'] = 'allow-same-origin';
window.T13NE.Sanitizer.style.display = 'none';
window.T13NE.makeSanitizedCopy = function(node,id=false) {
    if (node.nodeType == Node.TEXT_NODE) {
      var newNode = node.cloneNode(true);
    } else if (node.nodeType == Node.ELEMENT_NODE && window.T13NE.tagWhitelist_[node.tagName]) {
      newNode = window.T13NE.Sanitizer.contentDocument.createElement(node.tagName);
      if (!node.attributes.id&&id){node.attributes.id=id+"-"+window.T13NE.KeyGen(1);}
      if (!node.attributes.key){node.attributes.key=window.T13NE.KeyGen(1);}
      for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        if (window.T13NE.attributeWhitelist_[attr.name]) {
          if (attr.name=="class"&&id){attr.value=attr.value+" "+id;}
          
          newNode.setAttribute(attr.name, attr.value);

        }
      }
      for (i = 0; i < node.childNodes.length; i++) {
        var subCopy = window.T13NE.makeSanitizedCopy(node.childNodes[i]);
        newNode.appendChild(subCopy, false);
      }
    } else {
      newNode = document.createDocumentFragment();
    }
    return newNode;
  };
  window.T13NE.Key = 0;

  window.T13NE.KeyGen=function (input=1){
    window.T13NE.Key++;
    return window.T13NE.Hash(window.T13NE.Key.toString(36)+input);
  }
  window.T13NE.ConvertToGutenbergBlocks= function (input, remove_spaces = false){
    var gutblock = window.wp.blocks.rawHandler({ HTML:  input});
    var cerealized = window.wp.blocks.serialize(gutblock);
    cerealized = (remove_spaces) ? cerealized.replace(/(\n|\r)/g, '') : cerealized;
    return cerealized;
  }

window.T13NE.StripTags = function (str){
  if(str && typeof str === 'string') {
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
    }
    return str;
}
window.T13NE.T13Sanitize=function (input) {
  ////console.log("sanitize:", input);
  if (input.internal){
    //removing holdover internal code
    input=input.internal};
  input=window.T13NE.Parse(input);
  ////console.log("parsed", input);
    if (typeof(input)=="string"&&input.length>0&&(input.indexOf("<")!==-1||input.indexOf('\\')!==-1||input.indexOf("&")!==-1 )){
      if ( window.T13NE.Sanitizer['sandbox'] === undefined) {
        alert('Your browser does not support sandboxed iframes. Please upgrade to a modern browser.');
        return {__html:encodeURI(input)};
      }else{
        document.body.appendChild( window.T13NE.Sanitizer);
        if (typeof(input)=="string"){
        
          if (input.indexOf("<li")!==-1){
            input.replace("<li", '<li key="'+window.T13NE.KeyGen(6)+'"');
          }
          ////console.log("converting to Gutenberg", input);
          if (input.trim.length>0){
            input=window.T13NE.ConvertToGutenbergBlocks(input);
          }
          window.T13NE.Sanitizer.contentDocument.body.innerHTML = input;
        }else{
          window.T13NE.Sanitizer.contentDocument.body = window.T13NE.CE("body", {}, input);
        } 
        var resultElement = window.T13NE.makeSanitizedCopy( window.T13NE.Sanitizer.contentDocument.body);
        window.T13NE.Sanitizer.contentDocument.body.innerHTML=null;
        document.body.removeChild(window.T13NE.Sanitizer);
        return {__html:resultElement.innerHTML};
      }
    }else{
      
       return{__html:input};
      
      
    }
  
};
window.T13NE.TextSanitizer = function (input){
    input =window.T13NE.T13Sanitize(input);
    return input['__html'];
}
window.T13NE.lastAlert="";
window.T13NE.T13Alert = function(mtx){
  if (mtx!==window.T13NE.lastAlert){ //we have to check to stop doubling...
   ////console.log("T13Alert", mtx);
  window.T13NE.lastAlert=mtx;
  if (window.jQuery){
    var thisun = window.wp.data.select('t13ne/t13store').getT13Elem("latest");
    if (thisun!==-1){
    	try {
	      (function ($){
	       $(".t13ne-bubbleoff").each =function (){ //get rid of any old ones...
	      };
	      if (parseInt($(this).attr("opacity"))==0);{
	         $(this).remove();
	      }
	      $("#"+thisun.id+"-bubbleanchor").after('<span id="bubble'+window.T13NE.KeyGen(9)+'" class="t13ne-bubbleoff" style="z-index:'+(10000+window.T13NE.RNG(0,10000))+'; left:'+window.T13NE.RNG(-window.innerWidth/5, window.innerWidth/3)+'px;">'+mtx+'</span>');// statements
	    })(jQuery);
	   
	    } catch(e) {
	      // statements
	      console.error(e);
	    }
    }
   
   
    }else{
      ////console.log("jQuery wasn't loaded so I just put this here instead.");
    }
  }
  
}
window.T13NE.getSelection=function(){
  return window.getSelection?window.getSelection():document.getSelection();
}

window.T13NE.getSelectionParentElement=function() {
  var parentEl = null;
  var sel = null;
  if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount) {
          parentEl = sel.getRangeAt(0).commonAncestorContainer;
          if (parentEl.nodeType != 1) {
              parentEl = parentEl.parentNode;
          }
      }
  } else if ( (sel = document.selection) && sel.type != "Control") {
      parentEl = sel.createRange().parentElement();
  }
  return parentEl;
}

window.T13NE.SelectionScroll = function(thisid){

  //console.log("SelectionScroll",thisid);
  if (typeof thisid=="string"){
     var thisun = window.document.getElementById(thisid);
   }else{
      var thisun = thisid;
   }
 
  thisun.focus({preventScroll:true});
  var rect = thisun.getBoundingClientRect();
  //console.log("selectionScroll",rect.top, rect.right, rect.bottom, rect.left);

  window.T13NE.debounce(function (){window.scrollTo(Math.floor(rect.left+rect.right/2+window.innerWidth/2),Math.floor(rect.top+rect.bottom/2+window.innerHeight/2));},0,"scroller",false);
}
window.T13NE.Bookmark=false;
window.T13NE.BookmarkCaret = function (tgt,mode="default"){
  ////console.log("bookmark called", tgt);
  var selection = window.T13NE.getSelection();
  if (selection && selection.rangeCount && selection.getRangeAt(0)){
    var range = selection.getRangeAt(0).cloneRange();
    if (range){
       var anode = selection.anchorNode;
      var root =(anode.nodeType == 3 ? anode.parentNode : anode);
      var id =root.closest('[id]').id;
      var fnode = selection.focusNode;
      var end =(fnode.nodeType ==3 ? fnode.parentNode: fnode);
      var p = window.T13NE.getSelectionParentElement();
      ////console.log("bookmark parent", p);
      var parent = p.closest('[id]');

      var caret = selection.anchorOffset;
      var endcaret = selection.focusOffset;
      ////console.log("caret set to", caret, endcaret); 
      
      window.T13NE.Bookmark = {
        "id":id,
        "anchorNode":anode,
        "focusNode":fnode,
        "pid": parent.id,
        // "selectionStart":window.wp.data.select(BE).getSelectionStart(),
        // "selectionEnd":window.wp.data.select(BE).getSelectionEnd(),
        "selection":selection,
        "pos":caret,
        "endPos":endcaret,
        "range":range,
       
      };
    }
    ////console.log("bookmark selection", selection);
   
  }
  
  ////console.log("BookmarkCaret", window.T13NE.Bookmark);
  
};
document.addEventListener('click', window.T13NE.BookmarkCaret, false);
document.addEventListener('selectionChange', window.T13NE.BookmarkCaret, false);
document.addEventListener('keyup', window.T13NE.debounce(window.T13NE.BookmarkCaret,0), false);

window.T13NE.SetCaret = window.T13NE.debounce(function(){
  ////console.log("Bookmark SetCaret");

    if (window.T13NE.Bookmark){
      ////console.log("Bookmark found",window.T13NE.Bookmark); 
      var nodes = document.querySelectorAll("#"+window.T13NE.Bookmark.id+" > .rich-text");
      var closest = nodes[0];
     
      ////console.log("Bookmark closest", closest);
      
      if (closest){
        ////console.log("Bookmark resetting focus", closest);
        closest.focus();
      }
      var range = {};
      
      try {
        ////console.log("Bookmark range", window.T13NE.Bookmark.range);
         range =  window.T13NE.Bookmark.range;
      } catch(e) {
          // statements
         // //console.log("Bookmark first catch",e);
          
          range = document.createRange();
        try {
          range.setStart(window.T13NE.Bookmark.anchorNode, window.T13NE.Bookmark.pos);
          range.setEnd(window.T13NE.Bookmark.focusNode, window.T13NE.Bookmark.endPos);// statements
        } catch(e) {
          range.setStart(closest.firstChild, window.T13NE.Bookmark.pos);
          range.setEnd(closest.firstChild, window.T13NE.Bookmark.endPos);
          ////console.log("Bookmark 2nd catch",e);
        }
      }
      ////console.log("Bookmark resetting selection Range",range);
      var sel = window.T13NE.getSelection();
      if (sel){
        if (sel.empty){
          sel.empty();
        }else if(sel.removeAllRanges){
          sel.removeAllRanges();
        }
        
      }
      if (Array.isArray(range)){
        range.forEach( function(el, i) {
          ////console.log("Bookmark resetting selection el",el);

          sel.addRange(el);// statements
        });
      }else{
        ////console.log("Bookmark neat range", range);
        sel.addRange(range);
      }
      
    }
}, 0, "caretLock", true, this);
window.T13NE.isJSON= function(suspect){
  if (suspect == null ||suspect==undefined || typeof suspect!=="string" ){return false;}
  try { suspected = JSON.parse(suspect);} catch (e) { return false;}
  ////console.log("suspect JSON type", typeof suspected);
  return ( (typeof (suspected) !== "string") );      
}

window.T13NE.convertTaxon=function (taxo){
	if (taxo.isString()){
		//probably a slug, but might be a name.
    //actually do I even need this function?
	}

};
window.T13NE.t13neQueryWP =function (query,passedProps){
	//standard function to extract data from gutenberg word press.
	//standard query 
	/*request={
      "request":"getpost",
      "id":props.data-postid,
      "type":props.data-posttype,
      "eltype":props.data-eltype,
      "facets":props.data-facets,
      "genre":props.data-genres,
      "era":props.data-eras,
      "scope":props.data-scope,
      "tags":props.data-tags,
      "cats":props.data-cats,
        };*/
	query = (typeof query !== 'undefined') ?  query : {
		"request":"getpost", //other requests to follow
		"id":-1, //default to -1?
		"posttype":"elememt", //obviously our default choice
		"numberElems":13, //seems right
		"elemType":["prof"], //think we'll want profs more than anything else
		"genre":["core"], //intially that\'s all there will be, and everything is core genre'
		"facets":["any"], //which isn't actually searching for all, but ignoring...
		"era":["timeless"], //timeless is like core for time...
		"scope": ["omniversal","local",'development'], //
		"geom": ["any"] //also need to add the name as a geometry.
		};	
    if (query){
    	if (query.request=="getpost"){
    		request={
    			per_page: query.numberElems,
    			author: query.author,
				status: 'publish,future,draft,pending,private', //we don\'t care what the publish status is initially (later we will filter out the crap).
    		};    		
    	}
      window.T13NE.Path.curr=window.T13NE.Path.base;
      window.T13NE.Path.curr+=window.T13NE.Path[request.type.substr(0,4)]+"?id="+request.id;
      var eltype=null;
      if (passedProps['data-eltype']){
      	eltype=JSON.parse(passedProps['data-eltype']);
      }else{
      	eltype=wp.data.select( 'core/editor' ).getEditedPostAttributes('t13type');
      }
      if  (eltype){
       
        window.T13NE.Path.curr+="&"+window.T13NE.Path[eltype.slug]+"="+eltype.id;
      }
      var genr= null;
      if (passedProps["data-genres"]){
      	genr=JSON.parse(passedProps['data-genres']);
      }else{
      	genr=wp.data.select( 'core/editor' ).getEditedPostAttributes('t13genre');
      }
      if (genr){
      
        window.T13NE.Path.curr+="&"+window.T13NE.Path[genr.slug]+"="+genr.id;
      }
      var era=wp.data.select( 'core/editor' ).getEditedPostAttributes('t13era');
      var scop=wp.data.select( 'core/editor' ).getEditedPostAttributes('t13scope');
      var geos=wp.data.select( 'core/editor' ).getEditedPostAttributes('t13geo');

      fetch(window.T13NE.Path.curr)
        .then(response => response.json())
        .then(data => {
          this.setState({posts: data })
      })
      .catch(err => console.error(window.T13NE.Path.curr, err.toString()));
    }
  };
window.T13NE.AutoComp= function(props){  
  var words = [];
  var temp ={};
  var totalPages=0;
  var completed=function(words){
    var AutoComp = window.wp.components.Autocomplete;
    var autocompleters=[
        {
            name: 'T13elements',
            // The prefix that triggers this completer
            triggerPrefix: '?',
            // The option data
            options: words,
            // Returns a label for an option like "🍊 Orange"
            getOptionLabel: option => (
               window.T13NE.CE("span",{"data-postid":option.id}, option.name)               
            ),
            // Declares that options should be matched by their name
            getOptionKeywords: option => [ option.name ],
            // Declares that the Grapes option is disabled
            //isOptionDisabled: option => option.name === 'Grapes',
            // Declares completions should be inserted as abbreviations
            //getOptionCompletion: option => (
              
           // ),
        }
    ];
    return window.T13NE.CE("div", null,
      window.T13NE.CE(Autocomplete, { completers: autocompleters },
      ({ isExpanded, listBoxId, activeId }) =>
      window.T13NE.CE("div", {
        contentEditable: true,
        suppressContentEditableWarning: true,
        "aria-autocomplete": "list",
        "aria-expanded": isExpanded,
        "aria-owns": listBoxId,
        "aria-activedescendant": activeId })),
      window.T13NE.CE("p", null, "Type ? to autocomplete elements."));
  }; 
  window.wp.apiFetch({path:"/wp/v2/element/?context=embed&per_page=100",parse:false}).then(response => {
    totalPages = response.headers && response.headers.get( 'X-WP-TotalPages' ); 
      for (var i=0; i<totalPages;i++){
        window.wp.apiFetch({path:"/wp/v2/element/?context=embed&per_page=100&offset="+(100*i),parse:true}).then(temp => {
              for(var j=0; j<temp.length; j++){
                var tt=temp[j];
                words[words.length]={"name":tt.title.rendered,"id":tt.id};
               }
             
        }); 
      }
    return completed(words);
    });

};
window.T13NE.Contains = function (haystack,needles, defaultret=false){
 
  if (needles==""||needles===null||needles===undefined||haystack===undefined||haystack===""||haystack===null){return defaultret;}
	if ( typeof needles === 'string' || needles instanceof String){
		return (haystack.indexOf(needles)!==-1);
	}else{
    var notfound=(haystack.length>needles.length)?haystack.length:needles.length;
    for (var j=0; j<haystack.length;j++){
      for(var i = 0; i < needles.length; i++){
        if (typeof needles[i] ==='string'&&typeof haystack[j]=='string'){
           if(haystack.indexOf(needles[i]) !== -1){return true;}
        }else{
          if (haystack[j]===needles[i]){
             notfound--;
          }
        }
           
      } 
          
    }
		return notfound<=0;
	}
};
window.T13NE.IsSet = function (obj){
  try {return (typeof(obj)!=="undefined");}catch(e){return false;}
}
window.T13NE.ObjMap = function(obj,funk) {
	//expects key,val in function funk...
    var ownProps = Object.keys( obj ),
    	key="",
    	val="",
        i = ownProps.length,
        retArray = new Array(i); 
    while (i--){
    	key=ownProps[i];
    	val=obj[ownProps[i]];
    	if (typeof(funk)=="function"){
    		retArray[i] = funk.call(i,key,val);
    	}else{
    		retArray[i] = [key,val];
    	} 
    }
    return retArray;	   
};
window.T13NE.TemplateMaker = function (node, content){
    ////console.log("Template Maker", node, content);
   var type = node.nodeName.toLowerCase();
    ////console.log("nodeType=", type);
   switch (type){
        case "#text":
        if (content&&content!==""&&window.T13NE.Stringify(content)!=="%0A"){
           return {placeholder:content, content:content};
        }else{
           return  null;
        }
        break;
        case "archives":
          return ['core/archives', content];
        break;
        case "audio":
         return ['core/audio', content];
        break;
        case "button":
         return ['core/button', content ];
        break;
        case "categories":
         return ['core/catgories', content ];
        break;
        case "code":
         return ['core/code', content];
        break;
        case "column":
         return ['core/column', content ];
        break;
        case "columns":
         return ['core/columns', content ];
        break;
        case "coverimage":
         return ['core/coverImage', content ];
        break;
        case "div":
         return ['core/group',{}, content ];
        break;
        case "embed":
         return ['core/embed', content ];
        break;
        case "file":
         return ['core/file', content ];
        break;
        case "freeform":
         return ['core/freeform', content ];
        break;
        case "gallery":
         return ['core/gallery', content ];
        break;
        case "heading":
        case "h2": 
        case "h3":
        case "h4":
        case "h5":
        case "h6":
        content[0].level = parseInt(type.match(/(\d+)/));
         return ['core/heading', content[0] ];
        break;
        case "html":
         return ['core/html', content ];
        break;
        case "img":
         return ['core/image', content ];
        break;
        case "ol":
        case "ul":
         return ['core/list', content ];
        break;
        case "more":
         return ['core/more', content ];
        break;
        case "nextpage":
         return ['core/nextpage', content ];
        break;
        case "p":
       
         return ['core/paragraph', content[0] ];
        break;
        case "pre":
         return ['core/preformatted', content ];
        break;
        case "q":
         return ['core/pullquote', content ];
        break;
        case "quote":
         return ['core/quote', content ];
        break;
        case "resusable":
         return ['core/reusableBlock', content ];
        break;
        case "seperator":
        case "hr":
         return ['core/seperator', content ];
        break;
        case "shortcode":
         return ['core/shortcode', content ];
        break;
        case "spacer":
         return ['core/spacer', content ];
        break;
        case "subhead":
         return ['core/subhead', content ];
        break;
        case "table":
         return ['core/table', content ];
        break;
        case "column":
         return ['core/textColumns', content ];
        break;
        case "verse":
         return ['core/verse', content ];
        break;
        case "video":
         return ['core/video', content ];
        break;
        default:
         return ['core/html', { placeholder: {__html:"<"+type+">"+content+"</"+type+">" }} ];
        break;
      }
}

window.T13NE.NodeExtraction = function (input){
 ////console.log("NodeExtraction", input);
  var resultTemplate = [];
  for(var i=0;i<input.childNodes.length; i++){
    ////console.log("working on childNode ["+i+"] of ", input);
    var node = input.childNodes[i];
    ////console.log("node:",  node );
   
    var content = "";          
    switch (node.nodeType){
      case node.ELEMENT_NODE: 
      ////console.log("Element Node processing", node); 
       if (node.hasChildNodes()){
      ////console.log("has childnodes", node);
          content = window.T13NE.NodeExtraction(node);
        ////console.log("element content =", content);
        }
       break;
      case node.TEXT_NODE: content=node.textContent; break;
      case node.COMMENT_NODE: content = node.nodeValue;  break;
      default: content = node.nodeValue;  break;
    }
      
     resultTemplate[i] = window.T13NE.TemplateMaker(node, content);
        
  }
  resultTemplate=resultTemplate.filter(function (el) {
        return el != null;
    });
   
  return resultTemplate;
}


window.T13NE.ParseContentIntoTemplate= function (input,id){
  //has to turn html into a template for InnerBlocks

  input=window.T13NE.Parse(input);
   ////console.log("ParseContentIntoTemplate", input);
  
    if (typeof(input)=="string"&&(input.indexOf("<")!==-1||input.indexOf('\\')!==-1||input.indexOf("&")!==-1||input.indexOf(":")!==-1||input.indexOf("/")!==-1 )){
    
      if ( window.T13NE.Sanitizer['sandbox'] === undefined) {
        alert('Your browser does not support sandboxed iframes. Please upgrade to a modern browser.');
        return null;
      }else{
        document.body.appendChild( window.T13NE.Sanitizer);
          ////console.log("string based input", input);
          if (input.indexOf("<li")!==-1){
            input.replace("<li", '<li key="'+window.T13NE.KeyGen(1)+'"');
          }
        input=window.T13NE.ConvertToGutenbergBlocks(input);
        window.T13NE.Sanitizer.contentDocument.body.innerHTML = input;
       
        var resultElement = window.T13NE.makeSanitizedCopy( window.T13NE.Sanitizer.contentDocument.body, id);
       
        var result = window.T13NE.NodeExtraction(resultElement);
        window.T13NE.Sanitizer.contentDocument.body.innerHTML=null;
        document.body.removeChild(window.T13NE.Sanitizer);
       
       return result;
      }
    }else{
     ////console.log("swerved template building somehow");
      return null;
    }

}
window.T13NE.findElementBlock = function (){
  var initialID = window.wp.data.select('core/block-editor').getSelectedBlock();
 // ////console.log("findElementBlock Initial ID", initialID);
  var parents = window.wp.data.select('core/block-editor').getBlockParents(initialID.clientId); 
 // ////console.log ("findElementBlock parents", parents);
 // var grandparents =  window.wp.data.select('core/block-editor').getBlockParents(parents[parents.length-1]);
 
  ////console.log ("findElementBlock grandparents", grandparents);
  return parents[parents.length-1];
}
 
window.T13NE.InnerBlocks = class extends window.T13NE.Component{
  //replacement innerBlocks that has Onchange functionality built in through With Select and Fired events?
  constructor(props){
    super(props);
    ////console.log("T13NE InnerBlocks", props);
    this.ID = window.T13NE.avoidDupeIDs(props['data-IBID']?props['data-IBID']:window.T13NE.getT13ID(".t13ne-innerblocks","t13ib"));
   
   //this.IC =  window.wp.blockEditor.InnerBlocks.Content?window.wp.blockEditor.InnerBlocks.Content:window.wp.editor.InnerBlocks.Content?window.wp.editor.InnerBlocks.Content:["oops"];
   // this.state = {cont: window.T13NE.CE(this.IC, {props}, null)};
    this.innerKeyPress = window.T13NE.debounce(this.innerKeyPress.bind(this),1300,"IBpress",false, this);
    this.click = this.click.bind(this);
  
    this.allowed_blocks=[['core/archives'],['core/audio'],['core/button'],['core/categories'],['core/code'],['core/column'],['core/columns'],['core/coverImage'],['core/embed'],['core/file'],['core/freeform'],['core/gallery'],['core/heading'],['core/html'],['core/image'],['core/list'],['core/more'],['core/nextpage'],['core/paragraph'],['core/preformatted'],['core/pullquote'],['core/uote'],['core/reusableBlock'],['core/separator'],['core/shortcode'],['core/spacer'],['core/subhead'],['core/table'],['core/textColumns'],['core/verse'],['core/video']];
    this.defaultContent=[];
    
    if (props.onChange&&window.T13NE.Can_edit()){
      if (this.props.template){
        ////console.log("template detected");
        this.defaultContent=this.props.template;
      }else{
        ////console.log("building template");
        this.defaultContent=window.T13NE.ParseContentIntoTemplate(this.props['data-content']?props['data-content']:"<div><p>Default Description</p></div>", this.ID);
      ////console.log("IB defaultContentTemplate",this.defaultContent);
      }
    }else{
      ////console.log("default content");
      this.defaultContent=[['core/paragraph']];
    }
  }
  click(event){
    window.T13NE.SelectionScroll(event.target);
    // window.T13NE.BookmarkCaret(event.target, "Inner");
  }
  innerKeyPress(event){
   // ////console.log("key press change in InnerBlocks", event, this.props.IBID);
    var clientID = window.T13NE.findElementBlock();
    var ib=window.wp.data.select('core/block-editor').getBlocksByClientId(clientID);
   // ////console.log("ib-",ib);
    var nucontent = window.wp.blocks.serialize(ib);
    ////console.log("nucontent", nucontent);
  
    this.props.onChange(nucontent);

  }
  componentDidMount(){
    //console.log("mounting innerblocks");
   // window.T13NE.SetCaret();
  }
  componentWillUnmount(){
   //console.log("unmounting InnerBlocks");
   
  }
  render(){
    if (this.props.onChange){
      return window.T13NE.CE(window.wp.blockEditor.InnerBlocks?window.wp.blockEditor.InnerBlocks:window.wp.editor.InnerBlocks?window.wp.editor.InnerBlocks:["div"], {id:this.ID+"-d",className:"t13ne-innerblocks "+this.ID,allowedBlocks:this.allowed_blocks, template: this.defaultContent, onChange:this.props.onChange, onMouseUp:this.click, onTouchEnd:this.click, onKeyUp:this.innerKeyPress,  key:window.T13NE.KeyGen(this.ID+'d')}, null);
    }else{
      return window.T13NE.CE(window.wp.blockEditor.InnerBlocks?window.wp.blockEditor.InnerBlocks:window.wp.editor.InnerBlocks?window.wp.editor.InnerBlocks:["div"], {id:this.ID+"-d",className:"t13ne-innerblocks "+this.ID,allowedBlocks:this.allowed_blocks, template: this.defaultContent, onMouseUp:this.click, onTouchEnd:this.click, onKeyUp:this.innerKeyPress, key:window.T13NE.KeyGen(this.ID+'d')}, null);
    }
   
  }
}
window.T13NE.DropSelectors= function(props){
////console.log("DropSelector::",props);
  var list=[];
  var selected = 0;
  if (props['data-arrays']){
   
       list =props['data-arrays'];
       selected = props['data-array-keys'];
    }
   
 var filterList=[];
    list.forEach( function(arrayer, ind) {
      ////console.log("DropSelectors:: ", arrayer, ind);
      try {
        var temp = window.T13NE[arrayer];
       // //console.log("DropSelector:: temp ", temp);
        temp=temp.map(function(el, indexer) {
          ////console.log("el",el);
          var datas = [];
          for (let [datakey, datavalue] of Object.entries(el)) {
            ////console.log("DropSelector:: data,key", datavalue, datakey);
            var tempkey="data-"+datakey.toLowerCase().replace(/_|\s/g,"-");
            datas[tempkey]=datavalue;
          }
          return window.T13NE.CE("option",{key:window.T13NE.KeyGen(ind+'option'),value:indexer,...datas, id:"t13ne-drop-selector-"+ind+"-option-"+indexer+window.T13NE.KeyGen(ind),  },el.Type);
        },this);
        filterList.push( window.T13NE.CE("div",{className:"t13ne-drop-selector-container", key:window.T13NE.KeyGen(ind+'div')},window.T13NE.CE("label", {htmlFor:"t13ne-drop-selector"+ind,}, "Select a Type"), window.T13NE.CE('select',{id:"t13ne-drop-selector"+ind, onChange:props["data-arrays-onchange"][ind], defaultValue:selected[ind], key: window.T13NE.KeyGen(ind+'drop'), className:"t13ne-drop-selector"}, temp)));  
      }
      catch(e){
        console.error("Drop Selector called incorrectly, or wrong array targeted.",e);
        return false;
      } 
    },this);

    ////console.log("DropSelector::filterList",filterList);
    return window.T13NE.flattenDeep(filterList);
}
window.T13NE.TextBox = function (props){
	return window.T13NE.ContentBox(props);
}
window.T13NE.GainButton = function(props){
  var thisGainType ="All";
  var ret =[];
  var id = props.id?props.id:window.T13NE.KeyGen(1);
  if (window.T13NE.ThisCharacter){
    //so we know the character
    var thisGainType = [window.T13NE.PCTypes[window.T13NE.ThisCharacter.PCType]];
  }
  if (thisGainType =="All"){thisGainType=window.T13NE.PCTypes;}
  thisGainType.forEach( function(element, index) {
    if (props['data-gain'].toLowerCase()=="woe"){
      ret.push(window.T13NE.CE("button",{id:"Gain_Button"+id, onclick:props['data-ongain'], type:"button"}, "Gain"));
      ret.push(window.T13NE.CE(window.T13NE.ContentBox ({id:"GainBox"+id+"w",className:props.className+"-woe", "title":"Gain","data-rules":element['Woe_Gain']},null)));
    }
    if (props['data-gain'].toLowerCase()=="flaw"){
      ret.push(window.T13NE.CE("button",{id:"Gain_Button"+id,onclick:props['data-ongain'], type:"button"}, "Gain"));
      ret.push(window.T13NE.CE(window.T13NE.ContentBox ({id:"GainBox"+id+"f",className:props.className+"-flaw", "title":"Gain","data-rules":element['Hitch_Gain']},null)));
    }
    if (props['data-gain'].toLowerCase()=="quirk"){
      ret.push(window.T13NE.CE("button",{id:"Gain_Button"+id, onclick:props['data-ongain'], type:"button"}, "Gain"));
      ret.push(window.T13NE.CE(window.T13NE.ContentBox ({id:"GainBox"+id+"n",className:props.className+"-quirk", "title":"Gain","data-rules":element['Hitch_Gain']},null)));
    }
    if (props['data-gain'].toLowerCase()=="sway"){
      ret.push(window.T13NE.CE("button",{id:"Gain_Button"+id, onclick:props['data-ongain'], type:"button"}, "Gain"));
      ret.push(window.T13NE.CE(window.T13NE.ContentBox ({id:"GainBox"+id+"s",className:props.className+"-sway", "title":"Gain","data-rules":element['Gain']},null)));
    }
  });
}
window.T13NE.ContentBox =function (props){
  //console.log("CONTENTBOX::", props);
  var t13id = window.T13NE.avoidDupeIDs(props.id!==undefined?props.id+"-t13tx":window.T13NE.getT13ID("section.t13ne-textbox","t13tx"));
  var titled="";
  var clickme = function (){document.getElementById(t13id).focus()};
  var selectors = null;
  var { __ } = window.wp.i18n;
  if (props['data-arrays']!==undefined&&props['data-array-keys']!==undefined&&props["data-arrays-onchange"]!==undefined){
    selectors = window.T13NE.DropSelectors(props);
  }//else{
   // //console.log("CONTENTBOX::no selector props set.",props['data-arrays'],props['data-array-keys'],props["data-arrays-onchange"])
  //}
  if (props.title){
    var title=window.T13NE.T13Sanitize(props.title);
    titled+=title["__html"];
    if (titled.indexOf("<")!==-1){titled="";}
  }
  var contentbox = window.T13NE.CE("section", {id:t13id, className:props.className+"-section t13ne-textbox", title:titled, "key":window.T13NE.KeyGen(t13id), onClick: clickme}, 
    [(props.title?window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title", "key":window.T13NE.KeyGen(t13id+'box'), dangerouslySetInnerHTML:title},null):null),
    (props['data-arrays']?selectors:null),
    (props['data-type']?window.T13NE.CE("footer",{className:props.className+"-section-footer t13ne-textbox-type", "key":window.T13NE.KeyGen(t13id+'footer'), dangerouslySetInnerHTML:window.T13NE.T13Sanitize(props["data-type"])},null):null),
    (props['data-description']&&!(props.onChange&&window.T13NE.Can_edit())?window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description",  "key":window.T13NE.KeyGen(t13id+'description'), dangerouslySetInnerHTML:window.T13NE.T13Sanitize(props["data-description"])},null):null),
    (props.children&&!(props['onChange']&&window.T13NE.Can_edit())?window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description", "key":window.T13NE.KeyGen(t13id+'desc')},props.children):null),
    (props.onChange&&props['data-description']&&window.T13NE.Can_edit()?window.T13NE.CE(window.T13NE.InnerBlocks,{'data-content':props['data-description'], onChange:props.onChange?props.onChange:false, "data-IBID":t13id+"-ib","key":window.T13NE.KeyGen(t13id+'ibid')},null) :null),
    (props.onChange&&props.children&&window.T13NE.Can_edit()?window.T13NE.CE(window.T13NE.RichText, {
      key:window.T13NE.KeyGen(t13id+'content'),
      tagName: "main",
      multiline:"p",
      className: props.className+"-richtext-section-main t13ne-textbox-description",
      value:window.T13NE.T13Sanitize(props.children) ,
      onChange: content => {props.onChange(content);},
      placeholder: __("New Content", 'T13NE.ContentBox'),
      keepPlaceholderOnFocus: true }):null),
    (props['data-gain'&&props['data-ongain']]?window.T13NE.CE(window.T13NE.GainButton({className:props.className+"-section-gain t13ne-gain-button", "key":window.T13NE.KeyGen(t13id+'gain'), "data-gain":props["data-gain"], "data-ongain":props['data-ongain']}),null):null),
    (props['data-rules']?window.T13NE.CE("aside",{className:props.className+"-section-aside t13ne-textbox-rules", "key":window.T13NE.KeyGen(t13id+'rules'), dangerouslySetInnerHTML:window.T13NE.T13Sanitize(props["data-rules"])},null):null),
    ]);
  if (window.T13NE.Can_edit()){window.T13NE.SetCaret();};
  return contentbox;

}
window.T13NE.DescriptiveBox = function(props){
	return window.T13NE.ContentBox(props);
};
window.T13NE.TitledBox = function(props){
	return window.T13NE.ContentBox({"data-description":props['data-boxtext'], "data-type":null, "title":props.title, "className":props.className});
};
window.T13NE.getTidyTerms = function(jones){
  var indy = window.T13NE.flattenDeep(window.T13NE.cleanArray(jones));
  return window.T13NE.flattenDeep(window.T13NE.cleanArray(window.T13NE.getTerm(indy)));;
}
window.T13NE.getNumericTerm = function(term){
  if (typeof term!=="object"){
    var tempterm = window.T13NE.getTerm(term);
    return tempterm.term_id;
  }else{
    var tempterms = window.T13NE.getTerm(term);
    tempterms.forEach(function(element, index){
      tempterms[index] = tempterm[index].term_id;
    });
    return window.T13NE.Stringify(tempterms.join(", "));
  }
  
};

window.T13NE.getTermSlug = function (term){
  if (typeof term!=="object"){
    var tempterm = window.T13NE.getTidyTerms(term);
    return tempterm.slug;
  }else{
    var tempterms = window.T13NE.getTidyTerms(term);
    tempterms.forEach(function(element, index){
      tempterms[index] = tempterm[index].slug;
    });
    return window.T13NE.Stringify(tempterms.join(", "));
  }
  
};
 
window.T13NE.getTermName = function (term){
 
   if (typeof term=="string"){
    var tempterm = window.T13NE.getTidyTerms(term);
    return tempterm.name;
  }else{
    var tempterms = window.T13NE.getTidyTerms(term);
    tempterms.forEach(function(element, index){
      tempterms[index] = tempterms[index].name;
    });
    return window.T13NE.Stringify(tempterms.join(", "));
  } //return tempterm.name;
}
window.T13NE.makeCleanArray = function(input){
  switch(typeof input){
    case "string":
    case "integer":
    case "float":
   
      return [input];
      break;
    case "object":
    //remove empty entries
    if (Array.isArray(input)){
      return window.T13NE.cleanArray(input);
    }else{
      return [input];
    }
    break;
  }
}
window.T13NE.rebuildTermsFromSlugs = function(input, els=false){
  var list=[];
  if (els){
    list = window.T13NE.ElementTypes();
  }else{
    list = window.T13NEbase.Taxon.Taxon;
  }
  var ret =[];
    input =window.T13NE.splitString(input);
    if (Array.isArray(input)){
      input.forEach(function (isterm, index){
        list.forEach(function (term, ind){
          if (term.slug==isterm||term.name.toLowerCase==isterm){
            ret[index]=term;
          }
        });
      });
    }
  return ret;
}
window.T13NE.getLowestElementType = function(input){
 
  //console.log("getLowestElementType",input);
  if (typeof input == "string"){
    input = window.T13NE.rebuildTermsFromSlugs(input,true);
  }
  input = window.T13NE.makeCleanArray(input);
  //console.log("cleaned input=",input);
  var childTerms=[];
  var parentlist=[];
  //var imput=window.T13NE.getTidyTerms(input);
  ////console.log("imput=",imput);
    childTerms=input.filter(function(el){
      if (el.parent>0){
        parentlist.push(el.parent);
        return el;
      }
     
    });
    //console.log("childTerms",childTerms);
    //console.log("parentlist",parentlist);
    var output = childTerms.filter(function(el){
      return parentlist.indexOf(el.term_id)==-1; 
    });
    //console.log("output",output);
    return output[0];
}


window.T13NE.FacetSelector= function (props){
  var facetlist=window.T13NE.Facet.FacetSelector(props);
  

  var temp = facetlist.map( function(el, index){

    return window.T13NE.CE("option", {key:window.T13NE.KeyGen(7), value:el.value, id:"t13ne-facet-"+el.value, "data-description":el['data-description']}, el.label );
  });
  return window.T13NE.CE("div",{className:"t13ne-facet-selector", key:window.T13NE.KeyGen(4)},window.T13NE.CE("label", {htmlFor:"t13ne-facet-selector",}, "Select the Facet for "+props["data-label"]),window.T13NE.CE('select',{id:"t13ne-facet-selector", onChange:props.onChange, value:props['data-facet'], key: window.T13NE.KeyGen(7), className:"t13ne-facet-selector"}, temp), window.T13NE.CE(window.T13NE.ContentBox,{"title":props['data-mode']+" : "+facetlist[props['data-facet']]['label'] , "data-description":facetlist[props['data-facet']]['data-description']}));
}
window.T13NE.ElementTypeSelector= function(props){
////console.log("ElementTypeSelector",props);
  var list=[];
  var eltypes=props.data["data-t13eltype"]?props.data["data-t13eltype"]:"";
  var optioned =window.T13NE.getLowestElementType(eltypes);
  window.T13NEbase.Taxon.Taxon.forEach( function(element, index) {
    if (element.taxonomy=="t13type"){
      if (!list[element.taxonomy]){list[element.taxonomy]=[];}
      list[element.taxonomy].push({label:element.name, value: element["term_id"]});
     }
  });
 var filterList=[];
    Object.keys(list).forEach( function(index, ind) {
      var rindex="eltype";
      ////console.log(index)
      var temp = list[index].map(function(el) {
        ////console.log("el",el);
        return window.T13NE.CE("option",{key:window.T13NE.KeyGen(6),value:el.value, id:"t13ne-eltype-option"+el.value, },el.label);
      },this);
      filterList.push( window.T13NE.CE("div",{className:"t13ne-search-filter", key:window.T13NE.KeyGen(4)},window.T13NE.CE("label", {htmlFor:"t13ne-eltype-selector",}, "Select Element Type"),window.T13NE.CE('select',{id:"t13ne-eltype-selector", onChange:props.ElementTypeSelector, defaultValue:optioned['term_id'], key: window.T13NE.KeyGen(7), className:"t13ne-eltype-selector"}, temp)));  
    },this);
    ////console.log("filterList",filterList);
    return window.T13NE.flattenDeep(filterList);
}
window.T13NE.RandomTableResult= function(arrg){
	if (arrg&&arrg.length>1){
		return arrg[window.T13NE.RNG(1,arrg.length,-1)];
	}else{
		//console.log("what you talking about willis? ",arrg);
	}
	return "";
	
}
window.T13NE.CreateRandomSyllables=function(syllables){
  var name="";
  var c = window.T13NE.NameSounds['patterns'].length;
  //console.log("CreateRandomName",c);
  if (syllables<c-1){
    //console.log("CreateRandomName","small");
    var pattern = window.T13NE.RandomTableResult(window.T13NE.NameSounds['patterns'][syllables-1]);
  }else{
    //console.log("CreateRandomName","long");
    var pattern = window.T13NE.RandomTableResult(window.T13NE.NameSounds['patterns'][c-1]);
    //console.log("CreateRandomName pattern",pattern);
    var sylls = syllables - c;
    //console.log("CreateRandomName sylls",sylls);
    if (sylls<c-1){
      pattern += window.T13NE.RandomTableResult(window.T13NE.NameSounds['patterns'][sylls%c]);
      //console.log("CreateRandomName pattern",pattern);
    }else{
      while (pattern.length<syllables){
        var n = window.T13NE.RNG(3,pattern.length,-1);
        //console.log("CreateRandomName n",n);
        var pat =window.T13NE.RandomTableResult(window.T13NE.NameSounds['patterns'][0]);
        //console.log("CreateRandomName",pat);
        pattern = [pattern.slice(0, n), pat, pattern.slice(n)].join('');
        //console.log("CreateRandomName",pattern);
      }
    } 
  }
  for (var j=0; j<pattern.length;j++){
    var char = pattern[j];
    switch (char){
      case "v":
      name+= window.T13NE.RandomTableResult(window.T13NE.NameSounds['vowels']);
      break;
      case "c":
      name+= window.T13NE.RandomTableResult(window.T13NE.NameSounds['consonants']);
      break;
      case "s":
      name+= window.T13NE.RandomTableResult(window.T13NE.NameSounds['start_dbl_consonants']);
      break;
      case "e":
      name+= window.T13NE.RandomTableResult(window.T13NE.NameSounds['end_dbl_consonants']);
      break;


      
      break;
    
    }
  
  }
  return name;
}
window.T13NE.getRandomName = function (syllables){
  var names = [[],["abb", "abe", "ace", "ade", "aid", "air", "airt", "al", "alf", "and", "ann", "anne", "arn", "ash", "babe", "barn", "bart", "baz", "bea", "beau", "bed", "bekke", "ben", "beth", "bill", "birb", "bird", "black", "blaine", "blaire", "blake", "blake", "blaze", "blue", "blue", "bob", "box", "bree", "bri", "brock", "brooke", "brwc", "bryce", "bryne", "bub", "bull", "cade", "cain", "cain", "cal", "cam", "carl", "cat", "caz", "chad", "charles", "chase", "chaz", "chris", "claire", "claire", "clare", "clay", "clear", "clee", "cole", "con", "cow", "cox", "craig", "craig", "crow", "dan", "dave", "day", "daz", "dead", "dean", "deb", "del", "dell", "den", "dick", "dil", "dot", "drac", "drake", "dude", "ell", "elle", "eve", "eve", "faith", "fern", "flynn", "ford", "fox", "fred", "gage", "gail", "gale", "gem", "gen","george", "ger", "gil", "gill", "god", "good", "goof", "gor", "grant", "greer", "guy", "gwen", "hans", "hayes", "haz", "head", "heath", "heb", "hed", "hen", "hide", "hil", "hob", "hog", "hood", "hope", "hope", "hud", "hugh", "jace", "jack", "jade", "jai", "jake", "jake", "james", "jan", "jane", "jar", "jarl", "jay", "jean", "jem", "jen", "jens", "jerr", "jet", "jill", "jo", "joan", "job", "joe", "joel", "john", "jon", "jone", "jools", "jot", "jove", "joy", "jude", "jules", "june", "kai", "kal", "kane", "karl", "kate", "kaz", "kell", "ken", "ken", "kent", "kev", "kim", "kirk", "kit", "kris", "kurt", "kyle", "la", "lan", "lane", "lark", "lee", "left", "leif", "len", "lin", "liv", "loll", "lon", "lor", "lot", "lou", "love", "luke", "luke", "lyn", "lynn", "lynne", "man", "mark", "max", "may", "maz", "mel", "mick", "mike", "miles", "mitch", "mon", "moon", "mort", "nan", "nat", "naz", "nell", "ness", "net", "nette", "neve", "nick", "nige", "nik", "nil", "niles", "nin", "non", "noor", "old", "oort", "owl", "ox", "paige", "park", "paul", "paul", "pax", "pearl", "pel", "pen", "pet", "phil", "pierce", "pig", "pil", "pip", "pit", "pog", "pol", "pop", "pot", "poul", "pup", "quinn", "quiz", "raab", "rab", "rae", "raif", "rain", "ralph", "raz", "red", "reese", "reid", "rex", "rhod", "rich", "rick", "rik", "road", "rob", "rock", "rod", "rog", "rok", "roo", "rose", "rox", "roz", "rue", "ruth", "sage", "sal", "sam", "sam", "seth", "shae", "shane", "sid", "sill", "sim", "sime", "skye", "sloane", "smith", "snide", "snow", "sol", "son", "star", "starr", "stef", "steve", "sue", "sul", "sun", "taj", "tam", "tate", "teague", "ted", "tess", "thom", "tig", "till", "tim", "tom", "trace", "tree", "troy", "true", "uke", "ute", "val", "vale", "van", "vance", "ven", "viv", "wan", "wand", "week", "wen", "wend", "will", "wind", "wol", "wom", "wood", "worst", "worth", "wren", "wright", "wyn", "xak","xan", "xev", "yak", "yarl", "yen", "yol", "young", "youth", "yule", "yun", "zac", "zack", "zak", "zhan"], //1
  ["abbie", "abby", "abel", "abel", "abner", "ada", "adam", "adel", "adler", "aggy", "aiden", "alfie", "alice", "alice", "alma", "amir", "amy", "andi", "andrew", "andrew", "andy", "anna", "annie", "anouk", "ansel", "anton", "anya", "archer", "archie", "arden", "arlo", "arnav", "arnie", "arnold", "arny", "arwen", "asher", "auden", "audrey", "august", "autumn", "ava", "axel", "baby", "barny", "baron", "barry", "barty", "basil", "beckett", "bella", "bentley", "betty", "billy", "boaz", "bobby", "boden", "bodhi", "bonnie", "booker", "boomy", "bowie", "brian", "briar", "bridget", "bristol", "brontë", "bruno", "callum", "calvin", "camden", "carlton", "carly", "carol", "cato", "catty", "celeste", "charlie", "charlotte", "charon", "chloe","christof", "clara", "clara", "cleo", "cora", "corin", "cormac", "cortez", "daisy", "dana", "dani", "daniel", "danny", "dara", "darren", "darby", "darcy", "david", "debbie", "debby", "debra", "declan", "delta", "dennis", "derby", "dermot", "derren", "derron", "dicky", "dita", "donna", "dora", "doris", "dory", "dotty", "drummer", "eddy", "edith", "edwin", "effy", "eggsy", "eli", "ella", "ellie", "elly", "elsie", "ely", "ember", "emil", "emma", "emma", "emmett", "emmy", "enzo", "esme", "ethan", "etta", "eva", "ever", "evie", "ezra", "fifer", "filip", "fintan", "fisher", "fletcher", "flora", "fogo", "forrest", "frances", "frankie", "freddy", "frieda", "gaenor", "gaia", "garner", "garrett", "gaynor", "gemma", "gena", "geena", "genny", "georgia", "georgie", "getty", "giac","gilly", "gina", "ginny", "gracie", "greta", "griffin", "hadley", "hallie", "halo", "handy", "hanu", "harold", "harper", "harris", "harrie", "harry", "haskell", "hattie", "hatty", "hayden", "hedley", "henry", "herman", "holden", "homer", "hudson", "hugo", "hurry", , "ian", "ina", "ingrid", "inna", "ion", "iris", "irmine", "isaac", "itty", "ivan", "ivy", "izzy", "jackie", "jackson", "jacky", "jacob", "jagger", "jaqui", "jasper", "jennie", "jenny", "jilly", "jinny", "joanie", "joanne", "joaquin", "jockey", "jocko", "jolly", "jona", "jonah", "jono", "jordan", "jorgie", "jorie", "josef", "joseph", "joseph", "josie", "juno", "justine", "kame", "kami", "kara", "karen", "karon", "karonne", "keaton", "kelvin", "kenny", "kenzo", "kettle", "kevin", "kiki", "kismet", "kitty", "kylie", "lachlan", "lana", "lara", "larry", "laura", "leah", "lenny", "leo", "leo", "levi", "liam", "libby", "lilac", "lilly", "lilou", "lincoln", "linda", "linus", "lior", "lisa", "little", "lola", "lorry", "lotty", "louis", "louise", "lucas", "lumi", "madden", "magnus", "maisie", "malcolm", "mandy", "mani", "manny", "manuel", "marais", "marceau", "margot", "martin", "martine", "marvel", "maurice", "mauro", "maxine", "maxwell", "meena", "mekhi", "memphis", "mercy", "michael", "middle", "mila", "millie", "milly", "milo", "mina", "mindy", "missy", "mitchel", "morris", "moses", "motor", "nanny", "nathan", "neesha", "nelly", "nessa", "netty", "nico", "nigel", "nina", "nixie", "noah", "nora", "norris", "nova", "nutter", "odee", "oli", "olive", "olly", "omar", "onyx", "orla", "orson", "oscar", "osgood", "otto", "owen", "pablo", "patience", "patrick", "paula", "paulo", "peter", "peter", "philip", "phoebe", "piper", "pippa", "pippin", "pippy", "polly", "polo", "poppy", "priya", "puppy", "queenie", "quincy", "quintin", "randolph", "randy", "raymond", "redmond", "remy", "renzo", "richard", "richy", "ricky", "riley", "rita", "river", "robin", "roger", "rolly", "romy", "rooney", "rory", "roscoe", "rowan", "ruby", "sable", "sadie", "sammy", "saoirse", "sawyer", "sidney", "signe", "simon", "simpson", "skylar", "solly", "sonny", "sooty", "sophie", "soren", "stefan", "stella", "stephan", "stephen", "steven", "sudly", "sully", "suni", "sunny", "susan", "susie", "sussy", "sydney", "sylvie", "tandy", "tegan", "teo", "teri", "terrance", "terry", "tessa", "thea", "theo", "thomas", "tiddly", "tilly", "timo", "timo", "tina", "tofer", "tommo", "tommy", "topher", "tricia", "trisha", "travis", "tucker", "tully", "ursa", "vanny", "veda", "veni", "vici", "vida", "viggo", "violet", "vita", "vito", "walter", "wanda", "waylon", "wendy", "wesley", "william", "willie", "willlard", "willum", "willy", "winnie", "witty", "wulfric", "wyatt", "wylie", "xander", "yana", "yara", "yeeta", "yellow", "yuki", "zaccai", "zebra", "zeeta", "zelda", "ziggy", "zion", "zoe", "zuri",],//2
  ["abigail", "abraham", "abraham", "addison", "adelaid", "adrian", "adrian", "adrienne", "alexa", "alicia", "allison", "allison", "amanda", "amara", "amelie", "amethyst", "andrea", "angela", "annabelle", "anthony", "anthony", "apollo", "aretha", "athena", "aurora", "averie", "avery", "avery", "bastian", "beatrice", "bellamy", "bellatrix", "benedict", "benjamin", "bethany", "briana", "brianna", "cameron", "camilla", "caroline", "cassandra", "cassidy", "catherine", "christina","christian", "christofer", "christopher", "clementine", "dakota", "damian", "daniella", "deborah", "decima", "delilah", "destiny", "destiny", "diana", "dominic", "dominic", "dorothy", "edison", "eleanor", "eleanor", "elena", "elias", "elijah", "elisa", "elissa", "eliza", "ellery", "elliot", "elliott", "eloise", "emerald", "emerson", "emily", "emmery", "eudora", "evalyn", "evelyn", "evelynn", "everett", "everet", "fabian", "fatima", "finnegan", "fiona", "fiona", "francesca", "francesca", "frederick", "gabriel", "gabrielle", "garrison", "garrison", "genesis", "genevieve", "genevieve", "giacomo", "gianna", "gideon", "gillian", "gloria", "gregory", "gwendolyn", "hamilton", "harmony", "harrison", "helena", "imani", "imogen", "inara", "indigo", "inigo", "isabel", "isabel", "isabelle", "isaiah", "isaiah", "ithaqua", "ivanna", "jacqueline", "jaliyah", "jameson", "jamison", "jasiah", "jefferson", "jenifer", "jennifer", "jeremy", "jessica", "jillian", "joanna", "jocelyn", "jonathan", "jonathon", "joshua", "joshua", "josiah", "josiah", "jospehine", "jubilee", "julia", "julian", "juliet", "juliet", "juliette", "julius", "juniper", "kalani", "kamari", "kamila", "karina", "katherine", "kennedy", "kimberly", "lavender", "lavender", "leonardo", "leora", "liberty", "lilia", "lillian", "lorelei", "lorenzo", "loretta", "lucia", "lydia", "mackenzie", "madeleine", "madeline", "madison", "madison", "makayla", "malachi", "mallory", "margaret", "maria", "maria", "mariah", "marigold", "marilyn", "maryam", "mateo", "mateo", "mathias", "matilda", "maverick", "melanie", "melissa", "melody", "meredith", "minerva", "miranda", "miriam", "monica", "muhammad", "muriel", "nadia", "nadia", "naomi", "naomi", "natalie", "natalie", "nathaniel", "nathaniel", "nicholas", "nicholas", "nicolas", "olenna", "oliver", "orion", "orlando", "patricia","priscilla", "raphael", "rebecca", "rebecca", "remington", "remington", "renata", "rhianna", "rhiannon", "rosalie", "rosemary", "sabrina", "samantha", "samara", "samuel", "santiago", "savannah", "sebastian", "sebastian", "sergio", "sienna", "sierra", "sierra", "sofia", "solomon", "sophia", "steffany", "stephanie", "sullaman", "susanna", "tabitha", "theodore", "timothy", "tobias", "trinity", "trinity", "uriah", "uriel", "valerie", "valery", "vanessa", "violet", "vivian", "vivienne", "washington", "winona", "xavier", "zachary", "zosia",],//3
  ["abelardo", "acacia", "acadia", "adelia", "adelina", "adriana ", "adrianna", "adriano", "aeriana ", "aleczander ", "alejandra", "alejandro", "aleksander ", "alessandra", "alessandro", "alessia", "alessio", "alexander", "alexandra", "alexia", "alexzander", "aliana ", "alianna", "alicia", "alissala", "alivia ", "alyanna", "alyvia", "amadea", "amadeo", "amadeus", "amalia", "amaria", "amariah ", "amaryllis", "amelia", "america", "anabella", "anabella", "analia ", "analisa", "analiyah", "anastasia", "andromeda", "angelica ", "angelina", "anjelica", "annabella ", "annemieke", "antonella", "antonia", "antonino", "antonio", "arabella", "araceli ", "aracelio", "aracelli ", "aracely", "archimedes", "ariadne", "ariana ", "arianna ", "arizona", "arriana ", "arrianna ", "arsenio", "aryanna", "aubriana", "aubrianna ", "audriana audrianna", "augustina ", "augustino", "augustyna", "aurelia", "avalina", "azalea", "azariah", "azariah", "baby boy", "barcelona", "bartholomew", "basilio", "bedeelia", "bedelia ", "belladonna", "benedetto", "benicia", "benjamina", "benjamino", "benvolio", "caetano", "calliope ", "callyope", "camelia", "camellia ", "camilia", "camillia", "carolena ", "carolina ", "catalina ", "catarina ", "cayetano ", "cecelia ", "cecilia", "celestina", "celestino ", "cipriano", "constantino", "cordelia ", "cordilia", "cornelius", "cristiano", "damarius  ", "deangelo", "demaria", "demetria", "demetrio ", "demetrius ", "demitrio", "desdemona", "desideria", "desiderio", "dimitrios ", "dimitrious", "domenica ", "domenico", "dominica ", "domynica", "donatella", "donatello", "dorothea", "dulcinea", "ebeneezer ", "ebeneser ", "ebenezar", "ebenezer ", "elenora", "eliana ", "elianna ", "elisabeth", "elisheva", "elizabeth ", "elliana", "emanuelle", "emelia", "emilia ", "emilio", "emmanuel", "emmanuelle ", "ernestina", "ernestino", "esequiel", "esmeralda ", "esmerelda", "esperansa", "esperanza ", "eugenia", "eugenio", "evalina", "evangeline", "evelina ", "everardo", "ezekiel ", "ezequiel ", "fabiana", "fabianno", "fabiano ", "fabiola ", "fabrizia", "faviola", "federica", "federico", "felicity", "filomena", "fiorella", "fiorello", "florencia", "florencio", "gabriela ", "gabriella", "galilea", "gamaliel", "georgeana ", "georgiana ", "georgianna", "geremiah", "geronimo ", "giavanna ", "giovanna", "giovanni", "giuliana ", "giuliano ", "giulietta", "gloriana", "graciela ", "graciella  ", "graziella", "gregoria", "gregorio", "guadalupe", "guillermina", "henrietta", "heriberto", "hermione", "hideyoshi", "hilaria", "horacia", "horacio", "horatia ", "horatio ", "ibrahima", "ignacia", "ignacio ", "ignasio ", "ignatio ", "ignazio ", "ileana ", "ileanna ", "iliana ", "ilyana", "isabela ", "isabella ", "isadora ", "isadoro", "isidora", "izabella", "izadora ", "january", "jebediah", "jedadiah", "jedediah ", "jedidiah ", "jeremiah ", "jeronimo", "jessenia", "josefina ", "josephina", "juliana ", "julianna ", "juliano", "julieanna", "julieta", "julietta", "julyanna", "kalliope", "kamellia", "karolina", "katalina", "katarina ", "katerina", "katrina ", "konstantinos", "laurencio", "leidiana ", "leidyana", "leonardo", "leonides", "leticia ", "letitia", "leviticus", "liliana ", "lilianna ", "lilliana ", "lilyana ", "lilyanna", "lisabeta", "lizabeta ", "lizabetta", "luciana ", "lucianna", "luciano", "magdalena", "magnolia", "mahershala", "mahoganie", "mahogany ", "marcelina", "marcelino ", "marcellino", "mercutio","margarita ", "margaritta", "marguarita ", "mariana ", "marianna", "mariano", "maricela ", "mariela ", "mariella", "marisela", "masatoshi", "mauricio ", "maurizio", "melania ", "migdalia", "milania", "mirabella", "montgomery", "napoleon", "nassario", "natalia ", "natalya ", "nathalia", "nathanial", "nathaniel ", "nazario ", "nefertiti", "nicodemus", "nicoletta", "obadiah", "octavia", "octavius", "ofelia", "olivia", "olivier", "olympia", "omarosa", "ophelia ", "ophilia", "patricio", "penelope", "persephone", "philomena", "porfirio", "rafaela", "rafaella ", "rigoberto", "romario", "rosalina", "rosalinda", "rosario", "rosario", "salvatore", "santiago", "sebastian ", "sebastien", "selestino", "serafina", "seraphina", "serenity", "stefania", "tatiana ", "teodoro", "thelonious", "theodora", "theodosia", "theodosius", "tiberius", "valencia", "valentina", "valentino", "valeria", "veronica ", "veronika", "victoria", "victorino", "viktoria", "vincenzio", "violeta ", "violetta", "virgilio", "virginia", "vittorio", "viviana ", "vivianna", "wilhelmina", "xavier", "xenobia", "xiamara", "xiomara ", "yecenia", "yesenia ", "yessenia", "ygnasio", "yoshinori", "ysadora", "zacarias", "zachariah ", "zackariah", "zakaria ", "zebadiah ", "zebediah ", "zechariah ", "zenobia ", "zenobius", "zevadiah",],//4
  ["alara","alexandria","alexandrea","anamaria","anastasia","angelerio","annalucia","annunciata","annunciato","apollonia","apollonio","avangelene","bellesario","brianamarie","california","caledonia","cassiopia","celara","celedonio","dalara","damariana","demeteria","desiderato","diabolique","diamantina","diodorino","donnamaria","dorotheia","doroteia","eduartino","egiziano","eleteria","ellanora","eliodora","elizabella","elizabeta","ericanthony","eridanio","estafania","evangelina","evangelena","felicisima","felisicimo","florentina","geneviene","giorgietta","harrieta","henrietta","illiana","immaculata","isabelina","jaciara","jamiroquai","khadidiatou","lakiara","libertario","louisiana","luismario","margeriet","mariaclara","mariette","maxamillian","maximillian","macalister","nicolangelo","nunziatella","obaloluwa","octaviano","philomenia","providencia","reginamarie","serendipity","severianus","sigimono","siviliana","takiara","tinamaria","valentininto","valerianus"],//5
  ["alekanekelo", "alexanderina", "alexismarie","angelomaria", "apolinaria", "attakullakulla", "cassiopeia", "elepheteria", "eleuterio","emiliymarie","emerenziano", "kekiokolanee", "mariaelena", "massimiliano", "maximiliana","maximiliano","oliviamarie","olivereric","panagiotakis"]];
  if (syllables<names.length){
    return  window.T13NE.RandomTableResult(names[syllables]);
  }else{
    var rand =window.T13NE.RNG(2,5);
    return window.T13NE.RandomTableResult(names[rand])+"-"+window.T13NE.getRandomName(syllables-rand);
  }
}
window.T13NE.CorruptName = function(name){
  var permute ={"a":["a","e","e","i","i","o","u","y"],"b":["b","v","th","f","p","bl","br","m","p"],"c":["s","c","c","k","ch","ch","k"],"d":["d","th","thr","dh","v","r"],"e":["e","e","i","a","o","u","y"],"f":["b","ph","th","sh","v","vv","ff"],"g":["g","gl","ck","cl","r","rg","gg"],"h":["j","l","'","y","gh"],"i":["i","e","e","a","y","a","o","u"],"j":["j","jh","h","gh","d","z"],"k":["k","x","p","s"],"l":["l","m","n","r","rh","s"],"m":["m","n","b","mb"],"n":["n","nn","mn","ng","nd","nk"],"o":["a","a","a","e","i","o","u","u","y"],"p":["p","b","m","b","w"],"q":["k","w","cw"],"r":["r","l","m","n","fr"],"s":["s","ch","th","w","gh"],"t":["'","t","c","k","d","n"],"u":["a","a","e","i","o","o","e","i","o","u","y"],"v":["v","w","ff","f","lf","d","b","bh","sh","ss"],"w":["w","v","l","r","u","y"],"x":["cks","ks","ck","ch","kh"],"y":["y","j","ll","i","a","e","u"],"z":["s","z","d","r"]};
   var i=0;
    for (i=0;i<window.T13NE.RNG(2,6);i++){
      let r = window.T13NE.RNG(0,name.length);
      let c = name[r];
      name.replace(c,window.T13NE.RandomTableResult(permute[c]));
    }
    return name;
}
window.T13NE.CreateRandomName = function(syllables){
  var method = window.T13NE.RNG(1,10,0);
  switch (method){
    case 1:
      name = window.T13NE.CreateRandomSyllables(syllables);
    break;
    case 2:
    case 3:
    case 4:
    case 5:
      name =window.T13NE.getRandomName(syllables);
      break;
    default:
      name = window.T13NE.getRandomName(syllables);
      name = window.T13NE.CorruptName(name);
      break;
  }	
 return name.replace(/^\w/, c => c.toUpperCase());
}



 window.T13NE.Date = class extends window.T13NE.Component {
 	constructor(props){
 		super(props);
 	}
 	render(){
 		return window.T13NE.CE("date",{"date":this.props.date});
 	}
  };
window.T13NETableMap = function (obj){
	 var ownProps = Object.keys( obj ),
    	key="",
    	val="",
        i = ownProps.length,
        retArray = new Array(i); 
    while (i--){
    	key=ownProps[i];
    	val=obj[ownProps[i]];
      datacol=i;
    	if (typeof(funk)=="function"){
    		retArray[i] = funk.call(key,val,datacol);
    	}else{
    		retArray[i] = [key,val,datacol];
    	} 
    }
    return retArray;

}

window.T13NE.T13Table = class extends window.T13NE.Component {
	constructor(props){
		super(props);
		var data;
		switch (typeof(this.props["data-data"])){
			case "array":
			data=this.props["data-data"];
			break;
			case "object":
			var temp = this.props["data-data"];
			data = window.T13NE.TableMap(temp);

		}
		this.state={
      "id":"t13tab-"+window.T13NE.KeyGen(1),
			"className":this.props.className,
			"tablename":this.props.name,
			"data":data,
		};
	}
  colclick(evt){
    //console.log("colclick", evt);
    evt
    window.T13NE.SortTable(evt.target.data['column'],)
  }
	render(){
		var tabhead=this.state.data[0].keys;
		var tabhs = tabhead.map(function(column) {return window.T13NE.CE("th",{className:this.state.className+"-thead-tr-th",},column);});
		var tabfts=tabhead.map(function(column){return window.T13NE.CE("td", {className:this.state.className+"-tfoot-tr-td"},column);});
		var tbods = this.state.data.map(function(row) {
			var tcells= tabhead.map(function (column) {return window.T13NE.CE("td", {className: this.state.className+"-tbody-tr-td"}, row[column]);});
			return window.T13NE.CE("tr",{className:this.state.className+"-tbody-tr"}, tcells);});
		var tabin= window.T13NE.CE("div", {className:"t13ne-tablewrap"}, 
			window.T13NE.CE("table", {className:"t13ne-table "+this.state.className},
				window.T13NE.CE("thead", {className:this.state.className+"-thead"}, 
					window.T13NE.CE("tr", {className:this.state.className+"-thead-tr"}, tabhs),
				),
				window.T13NE.CE("tbody", {className:this.state.className+"-tbody"}, tbods),
				window.T13NE.CE("tfoot", {className:this.state.className+"-tfoot"}, 
					window.T13NE.CE("tr", {className:this.state.className+"-tfoot-tr"}, tabfts))
			),
		);
			return  (tabin);
			
	}

}
window.T13NE.cleanArray= function(a){
 // //console.log("cleanarray",a);
  if (typeof a == "object"&&Array.isArray(a)){
    return a.filter(function(el){return el!==undefined&&el!==null&&el!==""&&JSON.stringify(el)!=="[null]"&&JSON.stringify(el)!=="[]";})
  }else{
    return a;
  }
  
}
window.T13NE.flatten=function(input) {
  const stack = [...input];
  const res = [];
  while (stack.length) {
    // pop value from stack
    const next = stack.pop();
    if (Array.isArray(next)) {
      // push back array items, won't modify the original input
      stack.push(...next);
    } else {
      res.push(next);
    }
  }
  //reverse to restore input order
  return res.reverse();
}
window.T13NE.flattenDeep=function(a) {
  if (typeof a =="object"&&Array.isArray(a)){
   return a.reduce((acc, val) => Array.isArray(val) ? acc.concat(window.T13NE.flattenDeep(val)) : acc.concat(val), []);
  }else{
    return a;
  }
}
window.T13NE.shuffleArray = function (a) {
    for (var i = a.length - 1; i > 0; i--) {
        var j = window.T13NE.RNG(0,i+1,0);
        var temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
}
window.T13NE.Chunk = function (a, n, balance){    
    if (n < 2)
        return [a];
    var t13clen = a.length,
            out = [],
            i = 0,
            size;
    if (t13clen % n === 0) {
        size = Math.floor(t13clen / n);
        while (i < t13clen) {
            out.push(a.slice(i, i += size));
        }
    }
    else if (balance) {
        while (i < t13clen) {
            size = Math.ceil((t13clen - i) / n--);
            out.push(a.slice(i, i += size));
        }
    }

    else {

        n--;
        size = Math.floor(t13clen / n);
        if (t13clen % size === 0)
            size--;
        while (i < size * n) {
            out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n));

    }

    return out;
}

window.T13NE.CardsShuffleDeck = function (decks=2,shuffles=4){
	var baseDeck=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53];
  for (var i=0;i<decks;i++){
    baseDeck=baseDeck.concat(baseDeck);
  }
	for(var i=0;i<shuffles;i++){
		t13shuffle=window.T13NE.RNG(1,3,0);
		switch (t13shuffle){
			case 1:
				//first shuffle
				baseDeck=window.T13NE.shuffleArray(baseDeck);
			break;
			case 2:
				//chunk shuffle
				baseDeck = window.T13NE.flattenDeep(window.T13NE.shuffleArray(window.T13NE.Chunk(baseDeck,window.T13NE.RNG(2,53,0),true)));
			break;
			case 3:
        //piles shuffle
				var piles=window.T13NE.RNG(2,4);
				var newDeck=[];
				chunks=window.T13NE.Chunk(baseDeck,piles,true);
				for (var j=0; j<chunks[0].length;j++){
					for (var k=1; k<=piles;k++){
						newDeck[newDeck.length]=chunks[k][i];
					}
				}
				baseDeck=newDeck;
			break;
		}
	}
	window.T13NE.Deck=baseDeck;
};
window.T13NE.OrdealOutOfCards=function(context){
	//handles being out of cards.
	 //shuffles  and resets Deck
	window.T13NE.CardsShuffleDeck();

};
window.T13NE.RNG = function (min,max,offset){
	if (min===undefined){min=0;}
	if (max===undefined){max=1;}
	if (offset==undefined){offset=0;}
	if (min<max){
		if (window.crypto){
			var i=new Uint32Array(1);
			var t13neRNGret=Math.floor(((window.crypto.getRandomValues(i)[0]/4294967295)*(max-min+1))+min)+offset;
			
			return t13neRNGret;
		}else{
			return Math.floor((Math.Random()*(max-min+1))+min)+offset;
		}
	}else{
	 ////console.log("error: RNG must have a higher max than min.");
	}
}
window.T13NE.arrayRemove =function(arr,rem){
 // //console.log("arrayRemove", arr, rem)
  var temparr = arr.slice();
  ////console.log("temparr", temparr);
  let index = temparr.indexOf(rem);
  ////console.log("index",index);
  if (index!==-1){
    let slice = temparr.splice(index,1);
   // //console.log("sliced ",slice);
    ////console.log("temparr - ",temparr);
    return temparr;
  }else{
    return arr;
  }
}
window.T13NE.splitString = function (input){
  if (typeof(input)=="string"){
    if (input.indexOf("~-~")!==-1){input=input.split("~-~");}
    if (input.indexOf(", ")!==-1){input=input.split(", ");}
    if (input.indexOf(",")!==-1){input=input.split(",");}
    if (input.indexOf(" ")!==-1){input=input.split(" ");}
    return window.T13NE.cleanArray(input);
  }
  else{
    return input;
  }
 
};
window.T13NE.cleanTerms = function (input){
  if (input==""||input==null||input==undefined){return null;} 
  input = window.T13NE.splitString(input);
  if (typeof (input)=="object"&&Array.isArray(input)&&input[0]&&input.length==1){
    return window.T13NE.cleanTerms(input[0]);
  }
 
  return input;
};
window.T13NE.compareTerms = function (indy){
  return window.T13NEbase.Taxon.Taxon.filter(function(term, index){
    return (term==indy||term["term_id"]==indy||typeof(indy)=="string"&&(term.slug==indy||term.name==indy||(term.taxonomy=="t13facet"&&term.slug.length==indy.length&&term.name.indexOf(indy.toLowerCase())==0)||((indy.length>1)&&window.T13NE.Contains(term.name.toLowerCase(), indy.toLowerCase()))||indy.indexOf(" ")!==-1&&(indy.length>term.slug.length)&&window.T13NE.Contains(indy.toLowerCase(),term.slug)));
  }) 
}

window.T13NE.getTerm=function (indianaJones){
 ////console.log("getTerm", indianaJones);
	if (indianaJones){
    indianaJones = window.T13NE.cleanTerms(indianaJones);
		if (typeof indianaJones == "string"&&indianaJones!==""|| Number(indianaJones)>0){
	   return window.T13NE.compareTerms(indianaJones);	
		}else{
      if (typeof indianaJones == "object"){
       if (indianaJones!==null&&indianaJones.term_id!==undefined){return window.T13NE.compareTerms(indianaJones);}
         var ret=[];
         if (Array.isArray(indianaJones)){
          indianaJones.forEach(function (el,ind) {
            ret[ind]=window.window.T13NE.getTerm(el);
          });
         }
       
        return ret;
      }
    }
	}else{
		return [null];
	}
}

window.T13NE.findTerm=function (tings){
 
  var term=[];
  if (tings&&tings!==undefined&&tings!==null){
    switch (typeof tings){
      case "string":
      
        if (window.T13NE.Contains(tings, ",")){
          tings.split(tings,",").forEach( function(ting, index) {
               term[index]=window.T13NE.getTerm(ting);        
          });
        }else if (window.T13NE.Contains(tings, " ")){
          tings.split(tings," ").forEach( function(ting, index) {
               term[index]=window.T13NE.getTerm(ting);        
          });
        }else{
          term[0] = window.T13NE.getTerm(tings);
        }
      break;
      case "object":
     
      if (tings.slug){term[0]=tings;}else{
        if (tings.name){
            term[0] = window.T13NE.getTerm(tings.name);
          }else if (tings["term_id"]){
            term[0] = window.T13NE.getTerm(tings["term_id"]);
          }
      }
      if (Array.isArray(tings)){
        
          tings.forEach( function (ting, index){
            term[index]=window.T13NE.findTerm(ting);
          });
        }
        
      break;
      default:
   
      term[0] = window.T13NE.getTerm(tings);
      break;
    }
  }
 var ret = term.flat();
 
  return ret;
}
window.T13NE.ElementTypes = function (){
  var ret=[];
  ret=(window.T13NEbase.Taxon.Taxon.filter(function(term,index){
   // //console.log("term=",term);
    return (term.taxonomy=="t13type");
  }));
  return ret;
}
window.T13NE.Parse = function (string){
  ////console.log("Parsing",string);
  if (string&&string!==undefined&&string!==""){
    var ret="";
    if (typeof string=="string"){
      string.replace("&lt;","<");
      string.replace("&gt;",">");
      string.replace(/\\n/g, ' ');
      string.replace("\n", ' ');
      if (window.T13NE.isURIencoded(string)){
       string = decodeURIComponent(string);
      }
    }

    if (window.T13NE.isJSON(string)){
      
      ret= JSON.parse(string,function (key,val){
       
      val = decodeURIComponent(val);
      if (val.indexOf('"')==0){
        val=val.substring(1,val.length-1);
      }
      val=val.replace(/\\n/g, ' ');
      return val.replace(/\n/g, ' ');
      });
    }else{
     if (typeof string=="string"){
      if (string.indexOf('"')==0&&string.lastIndexOf('"')==string.length-1){
        ////console.log("trimming quotes",string);
        string=string.substring(1,string.length-1);}
      if (string.indexOf('\"')==0&&string.lastIndexOf('\"')==string.length-2){
        ////console.log("trimming escaped quotes",string);
        string=string.substring(2,string.length-2);}
      if (window.T13NE.isURIencoded(string)){
        ret=decodeURIComponent(string);
      }else{
         ret = string;
      }
     
     }
    }
    if (typeof(ret)=="string"&&window.T13NE.isURIencoded(ret)){
      return decodeURIComponent(ret);
    }else{return ret;}
  }
  return [];
}
window.T13NE.isURIencoded=function (string){
  return string.indexOf(" ")==-1&&decodeURIComponent(string)!==string;
}

window.T13NE.Stringify= function (obj){
  var ret = "";
  switch(typeof obj){
    case "string":
      if (!window.T13NE.isURIencoded(obj)){
         ret = encodeURIComponent(obj);
       }else{
        ret= obj;
       }
     
    break;
    case "number":
      ret=obj;
    break;
    case "boolean":
     ret= ""+obj;
    break;
    case "object":
      ret = JSON.stringify(obj,function(key,val){
        switch (typeof val){
          case "string":
           if (!window.T13NE.isURIencoded(val)){
            return encodeURIComponent(val);}
            else{
              return val;
            }
          break;
          case "number":
          return obj;
          break;
          default:
          return JSON.stringify(val);
          break;

        }
       
      });
    break;
    default:
    ret =  JSON.stringify(obj);
    break;
  }
  return ret;
}
window.T13NE.buildCSS=function (incoming, typer="genre"){
 
  var ret= {"css":"","data":""};
  if (incoming!==undefined&&incoming!==null&&incoming.length){
    if (typeof incoming == "string"){
      if (incoming.indexOf(",")!==-1){
        incoming = incoming.split(",");
      }else
       if (incoming.indexOf(" ")!==-1){
        incoming = incoming.split(" ");
      }else
      {
        incoming = [incoming];
      }
    }

    if (typeof incoming =="object"&&Array.isArray(incoming)&&JSON.stringify(incoming)!=="[]"){
      incoming = incoming.filter(Boolean);
      incoming.forEach(function (incomer,index){
       
        var temp = window.T13NE.findTerm(incomer);
        if (JSON.stringify(temp)!=="[]"&&temp[0].slug){
           ret["css"] += " t13ne-"+typer+"-"+temp[0].slug;
           ret["data"] += temp[0].slug+" ";
        }else{
          ret["css"] +=" t13ne-"+incomer;
          ret["data"] += incomer=" ";
        }
       
      });
    }
  }
  return ret;
}
 window.T13NE.DOMID=[];

window.T13NE.avoidDupeIDs = function (id){
  if (!window.T13NE.IsSet(window.T13NE.DOMID[id])){  
    window.T13NE.DOMID[id]=0;
  }else{
    window.T13NE.DOMID[id]++;
  }
  return id+"-"+window.T13NE.DOMID[id];
}


window.T13NE.getElementPath = function (el){
  if (!el) {
    return false;
  } 
  var path = [];
  var isShadow = false;
  while (el.parentNode != null) {
    // //console.log(el.nodeName);
    var sibCount = 0;
    var sibIndex = 0;
    // get sibling indexes
    for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
      var sib = el.parentNode.childNodes[i];
      if ( sib.nodeName == el.nodeName ) {
        if ( sib === el ) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    var nodeName = el.nodeName.toLowerCase();
    if (isShadow) {
      nodeName += "::shadow";
      isShadow = false;
    }
    if ( sibCount > 1 ) {
      path.unshift(nodeName + ':(' + (sibIndex + 1) + ')');
    } else {
      path.unshift(nodeName);
    }
    el = el.parentNode;
    if (el.nodeType === 11) { // for shadow dom, we
      isShadow = true;
      el = el.host;
    }
  }
  ////console.log("path",path);
  return path;

}
window.T13NE.filterObj=function(obj,filter,filter2){
  var keys = Object.keys(obj);
  ////console.log("filterObj", keys);
  var output = [];
  keys.forEach(function(key){
    ////console.log("key",key);
    if (key!==filter&&key!==filter2){
      
      output.push([key,obj[key]]);
    }
  });
  ////console.log("output",output);
  return output;
}
window.T13NE.propStringer= function(props){
  if (typeof props =="string"){
    return props;
  }
  if (props==window){
    return (JSON.stringify(window.document.all[window.document.all.length]));
  }
  ////console.log("propStringer",props);
  var keys = Object.keys(props);
  //var vals = Object.values(props);
  var children =[];
  var proper = [];
  if (keys.indexOf("children")!==-1){
    ////console.log("children detected", props.children);
    switch (typeof props.children){
      case "string":
      case "number":
      children = props.children;
      break;
      case "object": children = window.T13NE.filterObj(props.children,"_owner","_store");
      break;
      default:
      children = "steal sleep";
      break;
    }
  }
  keys.forEach(function(value, key){
    if (value!=="children"){
      proper.push([value,props[key]]);
    }else{
      proper.push(['children',children]);
    }
  });
  ////console.log("propStringer proper", proper);
  return JSON.stringify(proper);
}

window.T13NE.getIDHash = function(node,props,comp,me){
  ////console.log("getIDHash", props);
  //var elementPath = window.T13NE.getElementPath(element); //this was dropped... using props instead.
  var str =""+comp;
  if (me!==window){
    str+=JSON.stringify(me);
  }else{
    str+=JSON.stringify(me.document.all[me.document.all.length]);
  }
  str += window.T13NE.propStringer(props);
  ////console.log("str",str);

  return window.T13NE.Hash(str);
}
window.T13NE.getT13ID = function (thisun, thisname){
  return (window.T13NE.avoidDupeIDs("t13ne-"+thisname+'-'+window.T13NE.Hash(thisun)));
}
window.T13NE.checkLoad = function (datasrc){
  if (datasrc){
    if (window.T13NE.isJSON(datasrc)){
      return JSON.parse(datasrc);
    }else{
      return datasrc;
    }
  }else{
    return null;
  }
}
window.T13NE.getTaxonSlugs = function(name, taxonomy){
  return window.T13NEbase.Taxon.Taxon.filter(function (el){if (el.name==name && el.taxonomy==taxonomy){return el.slug;}});
}
window.T13NE.GetSelectValue = function (id){
  if (id!==null){
    //console.log("GetSelectedValue@",id);
     var e = document.getElementById(id);
    //console.log("GetSelectValue:",e);
    if (e!=null){
      //console.log("e.options",e.options);
      //console.log("e.selectedIndex",e.selectedIndex);
      if (e&&e.options&&e.selectedIndex!==-1){
        var val = e.options[e.selectedIndex].value;
        //console.log("GetSelectedValue=>",val)
       return val;
      }else{
        return null;
      }
    }else{
    //null in null out
    return null;
    }
  }else{
    //null in null out
    return null;
  }
 
}


window.T13NE.T13DataExtractor=function(search, data, mode){
   ////console.log("T13DataExtractor:init",search,data);
    var ret=[];
  if (typeof(data)=="string"){
    if (window.T13NE.Contains(data, ", ")){
      data=data.split(", ");
    }else if (window.T13NE.Contains(data, " ")){
      data = data.split(" ");
    }else if (window.T13NE.Contains(data, ",")){
      data=data.split(",");
    }else{
      data=[data];
    }

  }
  if (Array.isArray(data)){
    data.forEach( function(element, index) {
      ////console.log("T13DataExtractor dataiterator index:",index);
     //  //console.log("T13DataExtractor dataiterator element",element);
     
      if (window.T13NE.Contains(element, search)){

        ret[ret.length] = parseInt(element.replace(/\D/g,''));
      // //console.log("Ret",ret);
        return ret;
      }
      var slugs=window.T13NE.getTaxonSlugs(element, "t13data");
     // //console.log("T13DataExtractor slugs",slugs);
      if (slugs.length&&slugs[0].slug!==undefined){
        var slug=slugs[0].slug;
       ////console.log("T13DataExtractor slug",slug);
        if (window.T13NE.Contains(slug, search)){
          ret[ret.length] = parseInt(slug.replace(/\D/g,''));
         //  //console.log("Ret",ret);
          return ret;
        }
      }
     
    });
  }
  if (mode=="string"){ret =ret[0];}
  ////console.log("T13DataExtractor:Ret",search, ret);

  return ret;
}


 window.T13NE.KeypressTimeout= ["",];

window.T13NE.TableSortCSS = function(thistable,dir){
  var cls = thistable.className.split(" ");
  thistable.className ="";
  cls.forEach(function(el){ 
    if (el=="asc"&&el==dir){dir="desc";}
    if (el=="desc"&&el==dir){dir="asc";}
    if (el!=="asc"&&el!=="desc"){
      thistable.className += el+" ";
    }
  });
  thistable.className += dir;
  return dir;
};
window.T13NE.SortThis = function (a,b, asc){
   var retval=0;
    var col1 = a.toLowerCase()
    var col2 = b.toLowerCase();
    var fA=parseFloat(col1);
    var fB=parseFloat(col2);
    //col1 = col1.substring(0,col2.length);
    //col2 = col2.substring(0,col1.length);
    if(col1 != col2)
    {
      if((fA==col1) && (fB==col2) ){ 
        retval=(fA==fB)? 0:( fA > fB ) ? asc : -asc; 
      }else{
     
        retval = asc*col1.localeCompare(col2);
      }
     // else { retval=(col1==col2)?0:(col1 > col2) ? asc : -asc;}
    }
    return retval;    
}

 //tablesort fixer for t13ne-tables
 window.T13NE.SortTable = function(col, tableid) {
  var asc=0, thistable = document.getElementById(tableid),rows =Array.from(thistable.tBodies[0].rows),rlen = rows.length,dir = window.T13NE.TableSortCSS(thistable,"asc");
  var arr = new Array();
  var i, j, cells, clen;
  // fill the array with values from the table
  for(i = 0; i < rlen; i++)
  {
    cells = rows[i].cells;
    clen = cells.length;
    arr[i] = new Array();
    for(j = 0; j < clen; j++) { arr[i][j] = cells[j].innerHTML; }
  }
  if (dir=="asc"){asc=1;}else{asc=-1;}
  // sort the array by the specified column number (col) and order (asc)
  arr.sort(function (a,b){
    return window.T13NE.SortThis(a[col],b[col],asc);
  });
  for(var ri=0;ri<rlen;ri++)
  {
    for(var ci=0;ci<arr[ri].length;ci++){ thistable.tBodies[0].rows[ri].cells[ci].innerHTML=arr[ri][ci]; }
  }
};
jQuery(document).ready(function($){
  //console.log('jQuery DOM ready');

  $( 'table.t13ne-table' ).each(function( index ) {
    var elid=$(this).attr('id'); 
    if (!elid){
      elid="t13tab"+window.T13NE.KeyGen(1);
      $(this).attr('id', elid);
    }
   
    });

  $('table.t13ne-table thead tr th').click(function(index){
    $('th.sorted').removeClass('sorted');
    var elid = $(this).closest('table.t13ne-table').attr('id');

    $(this).closest('th').addClass('sorted');
    var column = $(this).closest('th').index();
    window.T13NE.SortTable(column,elid);
  });
   
   $('ul.sorted-list').each(function ( i ){
    var mylist = $(this);
   // //console.log("sorting list", mylist);
    var list = mylist.children('li').get();
    if (list.length>1&&list.length<200){
      list.sort(function(a, b) {
        return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
      });
      $.each(list, function(idx, itm) { 
       // //console.log("sorting:: ",idx,'"'+itm.textContent+'"', itm.textContent.length);
        if (itm.textContent.length>0){
           mylist.append(itm); 
        }
      });
    }
    
     
  });
    //$(this).html(hyper.renderToText()); 

});




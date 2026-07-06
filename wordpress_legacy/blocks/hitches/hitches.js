//hitch.js -- at the moment just a Proficiency copied over:
//needs to add Boon recognition and finding from a Statblock,
//needs to add Hitch Tiers and Types

window.T13NE.ResolvedHitches = [{'Name':'Unresolved', 'Description':'This Hitch is active and may be Triggered to Gain Chi or Twists','Index':0},
    {'Name':'Resolved (Persona)', 'Description':'The Hitch is Resolved and instead the Character may claim an additional Persona.', 'Index':1},
    {'Name':'Resolved (Core)', 'Description':'The Hitch is Resolved and instead the Character may claim an additional Core.', 'Index':2},
    {'Name':'Resolved (Edge)', 'Description':'The Hitch is Resolved, the Character gains a Resolved Hitch Edge.', 'Index':3},
    {'Name':'Resolved (Monster)', 'Description':'The Hitch is Resolved but the Character becomes a Monster of the same Facet.', 'Index':4}];
window.T13NE.CalculateHitchTier= function (hitchboon, facetboon){
  if (hitchboon>facetboon){return window.T13NE.HitchTiers[2];}
  if (hitchboon>=facetboon/2){return window.T13NE.HitchTiers[1];}
  return window.T13NE.HitchTiers[0];
}

window.T13NE.HitchTypeSelector = function (props){
  //wants and onchange and data-hitch-types props
   var temp = (window.T13NE.HitchTypes.map( function(el, index){
    return window.T13NE.CE("option", {key:window.T13NE.KeyGen(1), value:index, "data-description":el.Description,"data-woe":el.Woe, "data-quirk":el.Quirk,"data-flaw":el.Flaw, id:"t13ne-hitch-types-"+el.index}, el.Type );
  }));
  return window.T13NE.CE("div",{className:"t13ne-hitch-types-selector", key:window.T13NE.KeyGen(4)},window.T13NE.CE("label", {htmlFor:"t13ne-hitch-types-selector",}, "Select the main Facet for the new Proficiency"),window.T13NE.CE('select',{id:"t13ne-hitch-types-selector", onChange:props.onChange, value:props['data-hitch-types'], key: window.T13NE.KeyGen(1), className:"t13ne-hitch-types-selector"}, temp));
  
}
/*array('Type'=>'Harmful',
      'Description'=>'The Hitch (or Descendant with this Hitch) injures the Character when activated, as might an allergy, or a dangerous drug. Usually how commonly this is triggered balances the stakes, so an often triggered Harmful effect like a Dust allergy will be low stakes, but an allergy to the less common bee stings could be high stakes.',
      'Woe'=>'Draw and apply 1 Unsoakable Ordeal Card per Bane point to the Character when triggered.',
      'quirk'=>'Draw and apply 1 Ordeal Card per Ruin to the Character when Triggered. May be Soakable',
      'Flaw'=>'Draw and apply 1 Unsoakable Ordeal Card per Ruin to the Character when triggered.'
example content...
[t13ne type="select" select="hitchtype" selected="2" /]
<div class="t13ne-hitch t13ne-quirk">Some people delight in breaking Taboos, this might be minor such as Swearing constantly, or a major Taboo such as Cannibalism.</div>
<t13ne-hitch-tier></t13ne-hitch-tier>
      */
window.T13NE.Hitch = class extends window.T13NE.Component {
  constructor(props) {
    super(props);
     //load post from id or use pre-packaged data.
     //this.onSave = this.onSave.bind(this);
     this.FacetChange= this.FacetChange.bind(this);
     this.ChangeName = this.ChangeName.bind(this);
     this.ChangeContent = this.ChangeContent.bind(this);
     this.onChangeHitchType = this.ChangeHitchType.bind(this);
     this.updateBlock = window.T13NE.debounce(this.updateBlock.bind(this), "frame", "updatehitch", false);
     this.onClick = this.onClick.bind(this);
     this.updatedContent = "";
     this.updatedName = "";
    
     console.log("Painting hitch",props);
     if (props["data-t13ne-new"]&&!props['data-hitch-data']){
      //edit mode... which should include a standard upload and create a hitch method... This means it needs to call AddT13Element on the server via its own methods...
      if (window.T13NE.Can_edit()&&!props['data-hitch-data']){
        this.updatedName ="New hitch";
        this.updatedContent = "The Description of the New hitch";
        this.state={
          hitchid:"new",
          loading:0,
          Name:"New",
          t13fullname:"A New Hitch",
          t13aka: "also known as...",
          posttitle:"New:A New Hitch:also known as...",
          Description:"The Description of the New hitch",
          Facet:"All Facets",
         id: props['data-id'],
          Era:"Timeless",
          Genre:"T13 Core",
          Scope:"Development",
          Type:window.T13NE.getNumericTerm("hitch"),
          t13data:["HitchData","hitchtype10"],
          HitchType:10,
          HitchTiers:[0,1,2],
          HitchBoon:"Boon",
          HitchScale:false,
        }
      }
     }
      if (props["data-hitch-data"]){//we didn't have a hitch-id but we do have data. Display the data.
        console.log("has data", props["data-hitch-data"]);
       if (window.T13NE.isJSON(props["data-hitch-data"])){
       console.log("painting with data", props["data-hitch-data"])
        var hitchdata=JSON.parse(props["data-hitch-data"]);
        var updatedName = window.T13NE.Parse(hitchdata.posttitle);
        this.updatedNames = updatedName.split(':');
        var name = window.T13NE.Parse(hitchdata.name?hitchdata.name:this.updatedNames[0]);
        var fullname = window.T13NE.Parse(hitchdata.t13fullname?hitchdata.t13fullname:this.updatedNames[1]);
        var aka = window.T13NE.Parse(hitchdata.t13aka?hitchdata.t13aka:this.updatedNames[2]);
        this.updatedContent = window.T13NE.Parse(hitchdata.description);
        this.state={
          hitchid:hitchdata.t13postid,
          loading:0,
          Name:name,
          t13fullname:fullname,
          t13aka:aka,
          PostTitle:updatedName,
          Description:this.updatedContent,
          Facet:hitchdata.facet,
          facet:window.T13NE.Facet.getFacetNumber(hitchdata.facet),
          Era:hitchdata.era,
          Genre:hitchdata.genre,
          Scope:hitchdata.scope,
          Type:hitchdata.eltype,
          t13data:hitchdata.t13data,
          HitchType:window.T13NE.T13DataExtractor("hitchtype",hitchdata.t13data, "string"),
          HitchTiers:window.T13NE.T13DataExtractor("hitchtier", hitchdata.t13data, "array"),
          HitchBoon:this.props['data-boon']?this.props['data-boon']:hitchdata.hitchBoon?hitchdata.hitchBoon:"Boon",
          HitchScale:this.props['data-scale']?this.props['data-scale']:hitchdata.hitchScale?hitchdata.hitchScale:false,
          Author: window.T13NE.Parse(hitchdata.author), 
          id: hitchdata['data-id']};
      }else{
        console.log("data not JSON",props["data-hitch-data"]);
        //not JSON, so live passed...
        if (typeof props["data-hitch-data"] =="object"){
           var hitchdata=props["data-hitch-data"];
         }else{
          var hitchdata = JSON.parse(props["data-hitch-data"]);
         }
        
         this.state={
          id:hitchdata.t13postid,
          loading:0,
          Name:window.T13NE.Parse(hitchdata.name),
          t13fullname:window.T13NE.Parse(hitchdata.t13fullname),
          t13aka:window.T13NE.Parse(hitchdata.t13aka),
          Description:window.T13NE.Parse(hitchdata.description),
          Facet:hitchdata.facet,
          facet:window.T13NE.Facet.getFacetNumber(hitchdata.facet),
          Era:hitchdata.era,
          Genre:hitchdata.genre,
          Scope:hitchdata.scope,
          Type:hitchdata.eltype?hitchdata.eltype:window.T13NE.getNumericTerm("hitch"),
          t13data:hitchdata.t13data,
          HitchType:window.T13NE.T13DataExtractor("hitchtype",hitchdata.t13data, "string"),
          HitchTiers:window.T13NE.T13DataExtractor("hitchtier", hitchdata.t13data, "array"),
          HitchBoon:this.props['data-boon']?this.props['data-boon']:hitchdata.hitchBoon?hitchdata.hitchBoon:"Boon",
          HitchScale:this.props['data-scale']?this.props['data-scale']:hitchdata.hitchScale?hitchdata.hitchScale:false,
          Author: window.T13NE.Parse(hitchdata.author),
            id: hitchdata['data-id'],
        };
      }
    } else if (props["data-postid"]){
      console.log("painting from postid", props["data-postid"]);
      var hitch ={};
      this.state={id:props["data-postid"], loading:1,}
      window.wp.apiFetch({path:"/wp/v2/element/"+props["data-postid"]+"/"}).then(hitch => {
        console.log("hitch=",hitch);
            var updatedName= window.T13NE.Parse(hitch.title.rendered);
            this.updatedNames=updatedName.split(':');
            this.updatedContent= window.T13NE.Parse(hitch.content.rendered);
            this.setState({
              id:props["data-postid"],
              loading:0,
              Name: this.updatedNames[0],
              t13fullname:this.updatedNames[1],
              t13aka:this.updatedNames[2],
              posttitle:updatedName,
              Description:this.updatedContent,
              facet:window.T13NE.Facet.getFacetNumber(hitch.t13facet),
              Era:hitch.t13era,
              Genre:hitch.t13genre,
              Facet:hitch.t13facet,
              hitchGeo:hitch.t13geo,
              Scope:hitch.t13scope,
              Type:hitchdata.eltype?hitchdata.eltype:window.T13NE.getNumericTerm("hitch"),
              t13data:hitchdata.t13data,
              HitchType:window.T13NE.T13DataExtractor("hitchtype",hitchdata.t13data, "string"),
              HitchTiers:window.T13NE.T13DataExtractor("hitchtier", hitchdata.t13data, "array"),
              HitchBoon:this.props['data-boon']?this.props['data-boon']:hitchdata.hitchBoon?hitchdata.hitchBoon:"Boon",
              HitchScale:this.props['data-scale']?this.props['data-scale']:hitchdata.hitchScale?hitchdata.hitchScale:false,
              Author:window.T13NE.Parse(hitch.author),
              id: props['data-id']});
       });
     }else{
      console.log("painting without numbers!!!!")
      this.state={id:-1,
        loading:0,
        Name:"Something has gone wrong",
        Description:"and error in ${props} has made something go very wrong. Best advice... Refresh the page.",
        id:props['data-id'],
      };
     }
      
  }
  updateBlock(){
    console.log("update block");
      if (this.state&&(this.state.Name||this.updatedName)){
        console.log("have some content...", this.state.Name, this.updatedName);
        var title= window.T13NE.Stringify(this.state.Name===this.updatedName?this.state.Name:this.updatedName);
        console.log("Title", title);
        var content = window.T13NE.Stringify(this.state.Description===this.updatedContent?this.state.Description:this.updatedContent);

        console.log("Content", content);
        var post2Pass={
          t13ready:"updateblock",
          t13postid:"new",
          title: title,
          content: content,
          era:this.state.Era?this.state.Era:window.wp.data.select("core/editor").getEditedPostAttribute("t13era")?window.wp.data.select("core/editor").getEditedPostAttribute("t13era"):"Timeless",
          genre:this.state.Genre?this.state.Genre:window.wp.data.select("core/editor").getEditedPostAttribute("t13genre")?window.wp.data.select("core/editor").getEditedPostAttribute("t13genre"):"T13 Core",
          facet:this.state.Facet?window.T13NE.Facet.getFacetTerms(this.state.Facet):window.wp.data.select("core/editor").getEditedPostAttribute("t13facet")?window.wp.data.select("core/editor").getEditedPostAttribute("t13facet"):"All Facets",
          geo:this.state.hitchGeo?this.state.hitchGeo:0,
          scope:this.state.Scope?this.state.Scope:window.wp.data.select("core/editor").getEditedPostAttribute("t13scope")?window.wp.data.select("core/editor").getEditedPostAttribute("t13scope"):"Development",
          eltype:this.state.Type?this.state.Type:"hitch",
          t13data:this.state.t13data?this.state.t13data:"HitchData",
          tags:this.state['post_tags']?this.state['post_tags']:window.wp.data.select("core/editor").getEditedPostAttribute("post_tags"),
          cats:this.state['category']?this.state['category']:window.wp.data.select("core/editor").getEditedPostAttribute("category"),};
        console.log("updateBlock", this.state.id, post2Pass);

        window.wp.data.dispatch('t13ne/t13store').setT13Elem(this.state.id,post2Pass);

      } else{
        console.log("update failed because ", this.state, this.updatedName);

      }    
  }
  ChangeName(content){
    console.log('ChangeName', arguments);
    if (typeof (content)=="string"){
      console.log("content array creation", content);
      content=[content];}
    if (this.updatedName!==content[0]){
        this.updatedName = content[0];
        console.log("updatedName", this.updatedName);
        this.setState({Name:this.updatedName, Geo:window.T13NE.getGeometryTerms(this.updatedName)});
        this.updateBlock();
    }else{
      console.log("names are already similar");
    }

  }
   componentWillUnmount(){
    //console.log("unmounting hitch");
    if (this.props["data-t13new"]||this.state.Name!==this.updatedName||this.state.t13postid=="new"){
       this.updateBlock();
    }
   
    //console.log("hitch unmounted");

  }
  FacetChange(event){
    //console.log('FacetChange',event);
    //console.log('event.target', event.target.value);
    this.setState({facet:event.target.value, Facet: window.T13NE.Facet.getFacetTerms(event.target.value)}, this.updateBlock());
   
  }
  ChangeHitchType(event){
    var targ = event.target.innerText;
    targ= targ.split(" ");
    targ =targ[event.target.value];
    this.setState({HitchType:event.target.value, t13data:["HitchData", "hitchtype"+event.target.value, targ , "quirk", "Flaw", "Woe"]}, this.updateBlock());
  }

  ChangeContent(content){
    //console.log('Change Content', content);
    if (this.updatedContent!==content){
      this.updatedContent = content;
      console.log("updatedContent", this.updateContent);
      if (this.state.Description!==content){
         this.setState({Description:content}, this.updateBlock());
      }     
    }    
  }
  onGain(event){
    //someone has clicked a Gain on this Hitch. Depending upon the Character Type, The Hitch Boon and Character Boon the Character gains 1 Chi to The Hitch Boon Chi or 1 Twist to Banes Twists.
    var chigain = 1;
    var twistgain=0;
    var thisGainType=window.T13NE.PCTypes;
    if (window.T13NE.ThisCharacter){
     //so we know the character
     var thisGainType = [window.T13NE.PCTypes[window.T13NE.ThisCharacter.PCType]];
    }
     thisGainType.forEach( function(element, index) {
    if (props['data-gain'].toLowerCase()=="woe"){
      console.log("hitch::onGain", props["data-gain"]);
    }
  });
    if (this.state.HitchTiers){
      this.state.HitchTiers.forEach( function(element, index) {
        console.log("Hitch::onGain", element);
        if (element=="hitchtier0"){

        }
      });
    }
  }
  onClick(event){
    console.log("saving new hitch", event);
    window.wp.data.dispatch('t13ne/t13store').writeT13Elem(this.state.t13postid, this.state.id );
    //console.log("newhitch=", newhitch);
    return null;
  }
  render() {
    //avatar setup 
    console.log("rendering hitch with ",this.props, this.state);
     var avatars=[];
    if (this.state.Author){
      //console.log("Author",this.state.Author)
      var authors=[this.state.Author?this.state.Author:0, window.wp.data.select('core').getAuthors()?window.wp.data.select('core').getAuthors():null];
      var aut=authors.length;
      for (var i=0; i<aut;i++){
        if (authors[i]&&authors[i]!=null){
          var idder=window.T13NE.getT13ID("figure.t13ne-avatar","avatar"+i, window.T13NE.This(this,this.props));
          var urls=authors[i].avatar_urls;
          if (urls&&urls!==null){
             urls=Object.values(urls);
              var url =urls[urls.length-1];
              avatars[avatars.length]= el(window.T13NE.Avatar,{ 
                "className":this.props.className,
                "data-t13ne-author": authors[i].id,
                "data-t13ne-name":authors[i].name, 
                "data-t13ne-desc":authors[i].description,
                "data-t13ne-link":authors[i].link,
                "id":idder,
                "data-t13ne-url" :url},null);
           }
          }
         
      }
    }
    var hitchy = window.T13NE.HitchTypes[this.state.HitchType];
    console.log("hitchy",hitchy);
    var pfid=window.T13NE.getT13ID("section.t13ne-hitch", "hit", window.T13NE.This(this,this.props));
    var result=window.T13NE.CE("section", {id:pfid, className: this.props.className+" t13ne-hitch", "data-postid": this.state.id, "data-id":this.state.id, title:window.T13NE.Parse(this.state.Name) },
      window.T13NE.CE("details", {className: this.props.className+" t13ne-hitch-details"},
        window.T13NE.CE("summary", {className: this.props.className+" t13ne-hitch-summary"},
          window.T13NE.CE("strong", {className: this.props.className+" t13ne-hitchtitle" }, "Hitch: "),
            window.T13NE.CE(window.T13NE.Name, {className: this.props.className+" t13ne-name", "data-display":"title" ,"data-t13name": this.state.Name, },null ),
            ((this.state.HitchBoon&&this.state.HitchBoon!=="Boon")?window.T13NE.CE("span", {className:this.props.className+"-times"}, " &times; "):null),
            ((this.state.HitchBoon&&this.state.HitchBoon!=="Boon")?window.T13NE.CE(window.T13NE.Boon.DisplayBoon, {className:this.props.className+"-boon", "data-scale":this.state.Scale, "data-boon":this.state.HitchBoon},null):null),
          ),
          window.T13NE.CE("aside",{className:this.props.className+" t13ne-facet"}, 
            [ window.T13NE.CE("strong",{className: this.props.className+" t13ne-facet-title"},"Facet: "), 
            window.T13NE.CE(window.T13NE.FacetShort, {className:this.props.className+" t13ne-facet", "data-facet":this.state.facet},null)
          ]),
          (hitchy?window.T13NE.CE(window.T13NE.TextBox, {className: "t13ne-hitch-types", "title":"Hitch Type: "+hitchy.Type, "data-description":hitchy.Description}, null):null),
          (hitchy&&this.onGain?window.T13NE.CE(window.T13NE.ContentBox, {className: "t13ne-hitch-tiers t13ne-quirk", "data-gain":"quirk","data-ongain":this.onGain, title:"quirk", "data-rules":hitchy.quirk},null):null),
          (hitchy&&this.onGain?window.T13NE.CE(window.T13NE.ContentBox, {className: "t13ne-hitch-tiers t13ne-flaw", "data-gain":"flaw", "data-ongain":this.onGain,title:"Flaw", "data-rules":hitchy.Flaw},null):null),
           (hitchy&&this.onGain?window.T13NE.CE(window.T13NE.ContentBox, {className: "t13ne-hitch-tiers t13ne-woe", "data-gain":"woe", "data-ongain":this.onGain, title:"Woe", "data-rules":hitchy.Woe},null):null),

          window.T13NE.CE(window.T13NE.TextBox, { className: "t13ne-postdata t13ne-hitch-text" ,"data-description": this.state.Description, "data-id":this.state.id},null
         ),
           window.T13NE.CE("button", {key:window.T13NE.KeyGen(5), onClick:this.onClick, className: this.props.className+" t13ne-create-button"},"Create New Hitch"),
          window.T13NE.CE("small", {className:"t13ne-hitch-small"},
          

          (JSON.stringify(avatars)!="[]"&&avatars.length>0)?(window.T13NE.CE("aside", { className: "t13ne-author" }, " Created by: "), avatars) : null

    ) ) );
    if (!this.state.loading){
      console.log("not loading hitch");
        if(!window.T13NE.Can_edit()){
          console.log("no permission to edit");
          return result;
        }else if (this.props["data-t13ne-new"]||this.state.t13postid=="new"){
          console.log("new hitch rendering...");
          return window.T13NE.CE("section", {id:pfid, className: this.props.className+" t13ne-hitch", "data-postid": this.state.id, "data-id":this.state.id, title:window.T13NE.Parse(this.state.Name) },
      window.T13NE.CE("div", {className: this.props.className+" t13ne-hitch-details"},
        window.T13NE.CE("div", {className: this.props.className+" t13ne-hitch-summary"},
          window.T13NE.CE("strong", {className: this.props.className+" t13ne-hitchtitle" }, "Hitch: "),
            window.T13NE.CE(window.T13NE.Name, {className: this.props.className+" t13ne-name", "data-display":"title" ,"data-t13name": this.state.Name,onChange:this.ChangeName },null ),
            ((this.state.HitchBoon&&this.state.HitchBoon!=="Boon")?window.T13NE.CE("span", {className:this.props.className+"-times"}, " &times; "):null),
            ((this.state.HitchBoon&&this.state.HitchBoon!=="Boon")?window.T13NE.CE(window.T13NE.Boon.DisplayBoon, {className:this.props.className+"-boon", "data-scale":this.state.Scale, "data-boon":this.state.HitchBoon},null):null),
          ),
          window.T13NE.CE("aside",{className:this.props.className+" t13ne-facet"}, 
            [ window.T13NE.CE("strong",{className: this.props.className+" t13ne-facet-title"},"Facet: "), 
            window.T13NE.CE(window.T13NE.FacetSelector, {className:this.props.className+" t13ne-facet", "data-facet":this.state.facet, onChange: this.FacetChange, "data-label":"the new Hitch", "data-mode":"Hitch" },null),

            ]),
          (hitchy?window.T13NE.CE(window.T13NE.ContentBox, {className: "t13ne-hitch-types", "title": "Hitch Type: "+hitchy.Type,"data-description":hitchy.Description, "data-arrays":["HitchTypes"], "data-array-keys":[this.state.HitchType], "data-arrays-onchange":[this.onChangeHitchType]}, null):null),
          (hitchy&&this.onGain?window.T13NE.CE(window.T13NE.TextBox, {className: "t13ne-hitch-tiers t13ne-quirk", "data-gain":"quirk","data-ongain":this.onGain, title:"quirk", "data-rules":hitchy.quirk},null):null),
          (hitchy&&this.onGain?window.T13NE.CE(window.T13NE.TextBox, {className: "t13ne-hitch-tiers t13ne-flaw", "data-gain":"flaw", "data-ongain":this.onGain,title:"Flaw", "data-rules":hitchy.Flaw},null):null),
           (hitchy&&this.onGain?window.T13NE.CE(window.T13NE.TextBox, {className: "t13ne-hitch-tiers t13ne-woe", "data-gain":"woe", "data-ongain":this.onGain, title:"Woe", "data-rules":hitchy.Woe},null):null),

          window.T13NE.CE(window.T13NE.TextBox, { className: "t13ne-postdata t13ne-hitch-text", "title":"Hitch Description: " ,"data-description": this.state.Description, onChange:this.ChangeContent, "data-id":this.state.id},null
         ),
            window.T13NE.CE("button", {key:window.T13NE.KeyGen(5), onClick:this.onClick, className: this.props.className+" t13ne-create-button"},"Create New Hitch"),
          window.T13NE.CE("small", {className:"t13ne-hitch-small"},
          

          (JSON.stringify(avatars)!="[]"&&avatars.length>0)?(window.T13NE.CE("aside", { className: "t13ne-author" }, " Created by: "), avatars) : null

    ) ) );
        } else{
          console.log("normal")
      return result;
    }
  }else{
    if (this.state.loading){
       return window.T13NE.CE("section", {id:pfid}, "...loading");
    }   
  }

      
  } 



  }
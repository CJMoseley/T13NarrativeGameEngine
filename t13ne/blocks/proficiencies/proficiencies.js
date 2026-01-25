//proficiency.js -- and attempt at a React only component.


window.T13NE.Proficiency = class extends window.T13NE.Component {
  constructor(props) {
    super(props);
     //load post from id or use pre-packaged data.
     //this.onSave = this.onSave.bind(this);
     this.FacetChange= this.FacetChange.bind(this);
     this.ChangeName = this.ChangeName.bind(this);
     this.ChangeContent = this.ChangeContent.bind(this);
     this.updateBlock = window.T13NE.debounce(this.updateBlock.bind(this), "frame", "updateProf", false);
     this.onClick = this.onClick.bind(this);
     this.updatedContent = "";
     this.updatedName = ["","",""];
    
     //console.log("Painting Proficiencies",props);
     if (props["data-t13ne-new"]&&!props['data-prof-data']){
      //edit mode... which should include a standard upload and create a Prof method... This means it needs to call AddT13Element on the server via its own methods...
      if (window.T13NE.Can_edit()&&!props['data-prof-data']){
        this.updatedName ="New Proficiency";
        this.updatedContent = "The Description of the New Proficiency";
        this.state={
          profid:"new",
          loading:0,
          profName:"New Proficiency",
          profDescription:"The Description of the New Proficiency",
          profFacet:-1,
         id: props['data-id'],
          profEra:-1,
          profGenre:-1,
          profScope:-1,
          profType:window.T13NE.getNumericTerm("prof"),
          
        }
      }
     }
      if (props["data-prof-data"]){//we didn't have a prof-id but we do have data. Display the data.
        //console.log("has data", props["data-prof-data"]);
       if (window.T13NE.isJSON(props["data-prof-data"])){
       //console.log("painting with data", props["data-prof-data"])
        var profdata=JSON.parse(props["data-prof-data"]);
        this.updatedName = [window.T13NE.Parse(profdata.name),window.T13NE.Parse(profdata.t13fullname), window.T13NE.Parse(profdata.t13aka)];
        this.updatedContent = window.T13NE.Parse(profdata.description);
        this.state={
          profid:profdata.t13postid,
          loading:0,
          profName:this.updatedName[0],
          profDescription:this.updatedContent,
          profFacet:profdata.facet,
          facet:profdata.facet,
          profEra:profdata.era,
          profGenre:profdata.genre,
          profScope:profdata.scope,
          profType:profdata.eltype,
          profAuthor: window.T13NE.Parse(profdata.author), 
          id: profdata['data-id']};
      }else{
        //console.log("data not JSON",props["data-prof-data"]);
        //not JSON, so live passed...
        if (typeof props["data-prof-data"] =="object"){
           var profdata=props["data-prof-data"];
         }else{
          var profdata = JSON.parse(props["data-prof-data"]);
         }
        
         this.state={
          profid:profdata.t13postid,
          loading:0,
          profName:window.T13NE.Parse(profdata.name),
          t13fullname:window.T13NE.Parse(profdata.t13fullname),
          t13aka:window.T13NE.Parse(profdata.t13aka),
          profDescription:window.T13NE.Parse(profdata.description),
          profFacet:profdata.facet,
          facet:profdata.facet,
          profEra:profdata.era,
          profGenre:profdata.genre,
          profScope:profdata.scope,
          profType:profdata.eltype,
          profAuthor: window.T13NE.Parse(profdata.author),
            id: profdata['data-id'],
        };
      }
    } else if (props["data-postid"]){
      //console.log("painting from postid", props["data-postid"]);
      var prof ={};
      this.state={profid:props["data-postid"], loading:1,}
      window.wp.apiFetch({path:"/wp/v2/element/"+props["data-postid"]+"/"}).then(prof => {
        //console.log("prof=",prof);
            this.updatedName= window.T13NE.Parse(prof.title.rendered).split(":");
            this.updatedContent= window.T13NE.Parse(prof.content.rendered);
            this.setState({
              profid:props["data-postid"],
              loading:0,
              profName: this.updatedName[0],
              t13fullname:this.updatedName[1],
              t13aka:this.updatedName[2],
              profDescription:this.updatedContent,
              facet:prof.t13facet,
              profEra:prof.t13era,
              profGenre:prof.t13genre,
              profFacet:prof.t13facet,
              profGeo:prof.t13geo,
              profScope:prof.t13scope,
              profType:profdata.eltype,
              profAuthor:window.T13NE.Parse(prof.author),
              id: props['data-id']});
       });
     }else{
      //console.log("painting without numbers!!!!")
      this.state={profid:-1,
        loading:0,
        profName:"Something has gone wrong",
        profDescription:"and error in ${props} has made something go very wrong. Best advice... Refresh the page.",
        id:props['data-id'],
      };
     }
      
  }
  updateBlock(){
    console.log("update block");
      if (this.state&&(this.state.profName||this.updatedName)){
        //console.log("have some content...", this.state.profName, this.updatedName);
        var t13name= window.T13NE.Stringify(this.updatedName&&this.updatedName[0]?this.updatedName: this.state.profName);
        var t13fullname= window.T13NE.Stringify(this.updatedName&&this.updatedName[1]?this.updatedName[1]:"");
        var t13aka =  window.T13NE.Stringify(this.updatedName&&this.updatedName[2]?this.updatedName[2]:"");
        var posttitle = window.T13NE.Stringify(t13name+':'+t13fullname+':'+t13aka);

        //console.log("Title", title);
        var content = window.T13NE.Stringify(this.state.profDescription==this.updatedContent?this.state.profDescription:this.updatedContent);
        //console.log("Content", content);
        var post2Pass={
          t13ready:"updateblock",
          t13postid:"new",
          title: posttitle,
          t13name:t13name,t13fullname:t13fullname, t13aka:t13aka, 
          content: content,
          era:this.state.profEra?this.state.profEra:window.wp.data.select("core/editor").getEditedPostAttribute("t13era")?window.wp.data.select("core/editor").getEditedPostAttribute("t13era"):"Timeless",
          genre:this.state.profGenre?this.state.profGenre:window.wp.data.select("core/editor").getEditedPostAttribute("t13genre")?window.wp.data.select("core/editor").getEditedPostAttribute("t13genre"):"T13 Core",
          facet:this.state.profFacet?window.T13NE.Facet.getFacetTerms(this.state.profFacet):window.wp.data.select("core/editor").getEditedPostAttribute("t13facet")?window.wp.data.select("core/editor").getEditedPostAttribute("t13facet"):"All Facets",
          geo:this.state.profGeo?this.state.profGeo:0,
          scope:this.state.profScope?this.state.profScope:window.wp.data.select("core/editor").getEditedPostAttribute("t13scope")?window.wp.data.select("core/editor").getEditedPostAttribute("t13scope"):"Omniversal",
          eltype:this.state.eltype?this.state.profType:"prof",
          tags:this.state['post_tags']?this.state['post_tags']:window.wp.data.select("core/editor").getEditedPostAttribute("post_tags"),
          cats:this.state['category']?this.state['category']:window.wp.data.select("core/editor").getEditedPostAttribute("category"),};
        //console.log("updateBlock", this.state.id, post2Pass);

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
    if (this.updatedName!==content){
        this.updatedName = content;
        console.log("updatedName", this.updatedName);
        this.setState({profName:this.updatedName, profGeo:window.T13NE.getGeometryTerms(this.updatedName)});
        this.updateBlock();
    }else{
      console.log("names are already similar");
    }

  }
   componentWillUnmount(){
    //console.log("unmounting proficiency");
    if (this.props["data-t13new"]||this.state.profName!==this.updatedName||this.state.t13postid=="new"){
       this.updateBlock();
    }
   
    //console.log("prof unmounted");

  }
  FacetChange(event){
    //console.log('FacetChange',event);
    //console.log('event.target', event.target.value);
    this.setState({facet:event.target.value, profFacet: window.T13NE.Facet.getFacetTerms(event.target.value)}, this.updateBlock());
   
  }
  ChangeContent(content){
    //console.log('Change Content', content);
    if (this.updatedContent!==content){
      this.updatedContent = content;
      console.log("updatedContent", this.updateContent);
      this.setState({profDescription:content});
      this.updateBlock()
    }
    
  }
  onClick(event){
    console.log("saving new proficiency", event);
    window.wp.data.dispatch('t13ne/t13store').writeT13Elem(this.state.t13postid, this.state.id );
  }
  render() {
    //avatar setup 
    //console.log("rendering prof with ",this.props, this.state);
     var avatars=[];
    if (this.state.profAuthor){
      //console.log("Author",this.state.profAuthor)
      var authors=[this.state.profAuthor?this.state.profAuthor:0, window.wp.data.select('core').getAuthors()?window.wp.data.select('core').getAuthors():null];
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
    var pfid=window.T13NE.getT13ID("section.t13ne-proficiency", "prof", window.T13NE.This(this,this.props));
    var result=window.T13NE.CE("section", {id:pfid, className: this.props.className+" t13ne-proficiency", "data-postid": this.state.profid, "data-id":this.state.id, title:window.T13NE.Parse(this.state.profName) },
      window.T13NE.CE("details", {className: this.props.className+" t13ne-prof-details"},
        window.T13NE.CE("summary", {className: this.props.className+" t13ne-prof-summary"},
          window.T13NE.CE("strong", {className: this.props.className+" t13ne-proftitle" }, "Proficiency: "),
            window.T13NE.CE(window.T13NE.Name, {className: this.props.className+" t13ne-name", "data-display":"title" ,"data-t13name": this.state.profName, },null )
          ),
          window.T13NE.CE("aside",{className:this.props.className+" t13ne-facet"}, 
            [ window.T13NE.CE("strong",{className: this.props.className+" t13ne-facet-title"},"Facet: "), 
            window.T13NE.CE(window.T13NE.FacetShort, {className:this.props.className+" t13ne-facet", "data-facet":this.state.profFacet},null)
            ]),
          window.T13NE.CE(window.T13NE.TextBox, { className: "t13ne-postdata t13ne-prof-text" ,"data-description": this.state.profDescription, "data-id":this.state.id},null
         ),

          window.T13NE.CE("small", {className:"t13ne-prof-small"},
          

          (JSON.stringify(avatars)!="[]"&&avatars.length>0)?(window.T13NE.CE("aside", { className: "t13ne-author" }, " Created by: "), avatars) : null

    ) ) );
    if (!this.state.loading){
     // console.log("not loading prof");
        if(!window.T13NE.Can_edit()){
          console.log("no permission to edit");
          return result;
        }else if (this.props["data-t13ne-new"]||this.state.t13postid=="new"){
          console.log("new prof rendering...");
          return window.T13NE.CE("section", {id:pfid, className: this.props.className+" t13ne-proficiency", "data-postid": this.state.profid, "data-id":this.state.id, title:this.state.profName },
            window.T13NE.CE("div", {className: this.props.className+" t13ne-prof-details"},
              window.T13NE.CE("div", {className: this.props.className+" t13ne-prof-summary"},
                window.T13NE.CE("strong", {className: this.props.className+" t13ne-proftitle" }, "Proficiency: "),
                  window.T13NE.CE(window.T13NE.Name, {className: this.props.className+" t13ne-name", "data-display":"title" ,"data-t13name": this.state.profName, onChange:this.ChangeName,},null )
                ),
                window.T13NE.CE("aside",{className:this.props.className+" t13ne-facet"}, 
                  [ window.T13NE.CE("strong",{className: this.props.className+" t13ne-facet-title"},"Facet: "), 
                  window.T13NE.CE(window.T13NE.FacetSelector, {className:this.props.className+" t13ne-facet", "data-facet":this.state.facet, onChange: this.FacetChange, "data-label":"the new Proficiency", "data-mode":"Proficiency Facet" },null)
                  ]),
                window.T13NE.CE(window.T13NE.TextBox, { className: "t13ne-postdata t13ne-prof-text", "title":"Proficiency Description: " ,"data-description": this.state.profDescription, onChange:this.ChangeContent, "data-id":this.state.id, },null
               ),
                window.T13NE.CE("button", {key:window.T13NE.KeyGen(5), onClick:this.onClick, className: this.props.className+" t13ne-create-button"},"Create New Proficiency"),

                window.T13NE.CE("small", {className:"t13ne-prof-small"},
                

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
if (!T13NE){var T13NE={};}
if (!Object.values({test:"this"})){
  alert("This site, like most of the internet, does not work in so called 'Internet Explorer'. Get yourself a nice new browser from this century.");
}
window.T13NE.SearchFilters = function(){
  var filters = [];
  window.T13NEbase.Taxon.Taxon.forEach( function(element, index) {
    if (!filters[element.taxonomy]){filters[element.taxonomy]=[];}
    filters[element.taxonomy].push({label:element.name, value: element["term_id"]});
  });
  //console.log("filters=",filters);
  return filters;
};
window.T13NE.BuildSearchTerms = function(taxon,terms){
  var retpath="";
  if (taxon&&JSON.stringify(taxon)!=="[]"){
    if (terms&&JSON.stringify(terms)!=="[]"){
      if (typeof terms == "object" &&terms.length>1){
        terms.forEach( function(element, index) {
          retpath+="&"+taxon+"[]="+element;
        });
      }else{
        retpath+="&"+taxon+'="'+terms+'"';
      }
    }
  }
  console.log("BuildSearchTerms",retpath);
  return retpath;
};
window.T13NE.Searchbox = class extends window.T13NE.Component {
  constructor(props) {
    super(props);
    console.log("SEARCHBOX:",props);
    this.ready = false;
    this.getpost = this.getpost.bind(this);
    this.loading = false;
    this.dispatched = false;
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.bindListNode = this.bindListNode.bind(this);
    this.changeFilters = this.changeFilters.bind(this);
    this.renderFilters = this.renderFilters.bind(this);
    this.updateSuggestions = this.updateSuggestions.bind(this);
    this.limit = this.props.limit ? parseInt(this.props.limit) : false;
    this.suggestionNodes = [];
    this.postTypes = null;
    this.editing = window.T13NEbase.Page.Action=="edit"&&window.T13NEbase.Page.admin;
    this.toggleOpen = this.toggleOpen.bind(this);
    this.selectLink = this.selectLink.bind(this);
    this.thisun =this;
    
    this.state = { 
      results: "", 
      id:props["data-id"]?props["data-id"]:window.T13NE.getT13ID("article.t13ne-element-container", "t13el", window.T13NE.This(this,this.props)),
      "message":"",
      "searchbox": "",
      "selected":props["data-t13postid"]?props["data-t13postid"]:-1,
      "default":"type to find",
      "mode":"search",
      "t13postid":props["data-t13postid"],
      "title": props['data-t13name']?props["data-t13name"]:"",
      "content":"Loading...",
      "era":props["data-t13era"]?window.T13NE.Parse(props["data-t13era"]):[],
      "genre":props["data-t13genre"]?window.T13NE.Parse(props["data-t13genre"]):[],
      "facet":props["data-t13facet"]?window.T13NE.Parse(props["data-t13facet"]):[],
      "geo":props["data-t13geom"]?window.T13NE.Parse(props["data-t13geom"]):[],
      "scope":props["data-t13scope"]?window.T13NE.Parse(props["data-t13scope"]):[],
      "eltype":props["data-t13eltype"]?window.T13NE.Parse(props["data-t13eltype"]):[],
      "t13data":props['data-t13data']?window.T13NE.Parse(props['data-t13data']):[],
      "cats":props["data-cats"]?window.T13NE.Parse(props["data-cats"]):[],
      "tags":props["data-tags"]?window.T13NE.Parse(props["data-tags"]):[],
      "posts": [],
      "showSuggestions": false,
      "selectedSuggestion": null,
      "input": '',
      "className":props.className?props.className:" t13element-container",
      'value':'',  
      'filtersopen':false,        
       };
    };

    

  componentDidMount(){
    this.ready="mounted";
     window.wp.data.dispatch('t13ne/t13store').setT13Elem(this.state.id, {t13ready:"searchbox mounted"});
  }
  toggleOpen (event) {
      event.preventDefault();
      this.setState({filtersopen:this.state.filtersopen?false:"open"});
    }
  componentWillUnmount(){
    //any tidying we need to do after deletion. window.T13NE.CE(T13Geometry,{"name":props.attributes.profName}),
    delete this.suggestionsRequest;
    delete this.suggestionNodes;
    this.ready=false;
    //window.wp.data.dispatch('t13ne/t13store').setT13Elem(this.state.id,{t13ready:false});
    delete this.state;
  }
  getpost(t13postid){
    //console.log("getpost", t13postid);
    if (!this.loading&&this.state.postid!==t13postid&&this.state.mode!=="request"){ 
      console.log("SEARCHBOX:not loading so set load");
     this.setState({
          "message":"... Loading data ...",
          mode:"request",
          t13postid:t13postid,
        });
      var id = this.state.id?this.state.id:this.props.id?this.props.id:window.T13NE.getT13ID("article.t13ne-element-container", "t13el", window.T13NE.This(this,this.props));
    
     if (window.wp.data.select('t13ne/t13store').getT13Elem('latest')==id&&window.wp.data.select('t13ne/t13store').getT13Elem('lastid')==t13postid&&window.wp.data.select('t13ne/t13store').getT13Post(t13postid)!=="Pending"){
      console.log("SEARCHBOX:: getpost got", t13postid);
      this.loading=false;
     }else{
       this.loading=true;
      console.log("SEARCHBOX:: gettingpost", t13postid);
       window.wp.data.dispatch('t13ne/t13store').readT13Elem(t13postid,id);
     }
   }
  }
  bindListNode(ref) {
    this.listNode = ref;
  }

  bindSuggestionNode(index) {
    return ref => {
      this.suggestionNodes[index] = ref;
    };
  }
     
  updateSuggestions(inputValue) {
    // Show the suggestions after typing at least 1 characters
    // and also for URLs
    console.log("SEARCHBOX:updateSuggestions inputValue", inputValue);
  
    if (this.state.length < 1 || /^https?:/.test(inputValue)) {
      this.setState({
        showSuggestions: false,
        selectedSuggestion: null,
        loading: false });
      return true;
    }
    this.setState({
      message:'... Updating suggestions ...',
      showSuggestions: true,
      selectedSuggestion: null,
      loading: true });

    var path = window.wp.url.addQueryArgs('/t13ne/v1/search/', {
        's': inputValue,
        'per_page': 26,
        "post_type": 'any',
        'subtype': "element",
      });
    path+= window.T13NE.BuildSearchTerms("t13type", this.state.eltype);
    path+= window.T13NE.BuildSearchTerms("t13genre", this.state.genre);
    path+= window.T13NE.BuildSearchTerms("t13scope", this.state.scope);
    path+= window.T13NE.BuildSearchTerms("t13facet", this.state.facet);
    path+= window.T13NE.BuildSearchTerms("t13data", this.state.t13data);
    path+= window.T13NE.BuildSearchTerms("t13era", this.state.era);
    path+= window.T13NE.BuildSearchTerms("tags", this.state.tags);
    path+= window.T13NE.BuildSearchTerms("categories", this.state.cats);
    console.log("SEARCHBOX:request path", path );
    const request = window.wp.apiFetch({
      path: path });
   console.log("SEARCHBOX:requesting...",request);

    request.
    then(posts => {
     
      if (this.suggestionsRequest !== request) {
        return;
      }
    
        this.setState({
         posts:posts,
        loading: false } );
    }).
    catch(() => {
      if (this.suggestionsRequest === request) {
        this.setState({
          loading: false });

      }
    });

    this.suggestionsRequest = request;
   
  }
  onChange(event) {
    console.log("SEARCHBOX:onChange", event);
    this.dispatched = false;
    var inputValue = event.target.value;
    console.log("SEARCHBOX:onChange", inputValue);
    this.setState({ input: inputValue, message:"... Searching ...", value:inputValue });
    window.T13NE.debounce(this.updateSuggestions(inputValue), 1300, "SBus", false,this);
  }
  onKeyDown(event) {
    const { showSuggestions, selectedSuggestion, posts, loading } = this.state;
    // If the suggestions are not shown or loading, we shouldn't handle the arrow keys
    // We shouldn't preventDefault to allow block arrow keys navigation
    if (!showSuggestions || !posts.length || loading) {
      return;
    }

    switch (event.keyCode) {
      case window.wp.keycodes.UP:{
          event.stopPropagation();
          event.preventDefault();
          const previousIndex = !selectedSuggestion ? posts.length - 1 : selectedSuggestion - 1;
          this.setState({
            selectedSuggestion: previousIndex });

          break;
        }
      case window.wp.keycodes.DOWN:{
          event.stopPropagation();
          event.preventDefault();
          const nextIndex = selectedSuggestion === null || selectedSuggestion === posts.length - 1 ? 0 : selectedSuggestion + 1;
          this.setState({
            selectedSuggestion: nextIndex });

          break;
        }
      case window.wp.keycodes.ENTER:{
          if (this.state.selectedSuggestion !== null) {
            event.stopPropagation();
            const post = this.state.posts[this.state.selectedSuggestion];
            this.selectLink(post, this.state.id);
          }
        }}

  }
  changeFilters(event){
     console.log("changeFilters",event);
     var era = window.T13NE.GetSelectValue("t13ne-filter-era");
     if (typeof era !=="object"){era=[era];}
     var genre = window.T13NE.GetSelectValue("t13ne-filter-genre");
     if (typeof genre !=="object"){genre=[genre];}
     var facet =window.T13NE.GetSelectValue("t13ne-filter-facet");
     if (typeof facet !=="object"){facet=[facet];}
     var geo =window.T13NE.GetSelectValue("t13ne-filter-geo");
     if (typeof geo !=="object"){geo=[geo];}
     var scope =window.T13NE.GetSelectValue("t13ne-filter-scope");
     if (typeof scope !=="object"){scope=[scope];}
     var eltype =window.T13NE.GetSelectValue("t13ne-filter-eltype");
     if (typeof eltype !=="object"){eltype=[eltype];}
     var tags =window.T13NE.GetSelectValue("t13ne-filter-tags");
      if (typeof t13data !=="object"){t13data=[t13data];}
     var t13data =window.T13NE.GetSelectValue("t13ne-filter-tags");
     if (typeof tags !=="object"){tags=[tags];}
     var cats =window.T13NE.GetSelectValue("t13ne-filter-cats");
     if (typeof cats !=="object"){cats=[cats];}  
     this.setState({
          era:era,
          genre:genre,
          facet:facet,
          geo:geo,
          scope:scope,
          eltype:eltype,
          t13data:t13data,
          tags:tags,
          cats:cats,
          posts:[],
        });
     if (this.state.value.length>1){this.updateSuggestions(this.state.value);}
  }
  renderFilters(){
   console.log("SEARCHBOX:renderFilters",this);
    var filters=window.T13NE.SearchFilters();
    var filterList=[];
    Object.keys(filters).forEach( function(index, ind) {
      var rindex="";
      switch (index){
        case "t13genre":rindex="genre";
        break;
        case "t13era":rindex="era";
        break;
        case "t13facet":rindex="facet";
        break;
        case "t13scope":rindex="scope";
        break;
        case "t13geo":rindex="geo";
        break;
        case "t13type":rindex="eltype";
        break;
         case "t13data":rindex="t13data";
        break;
        case "categories":
        case "category": rindex="cats";
        break;
        case "post_tag":
        case "post_tags":
        case "tags":rindex="tags";
        default: rindex=index;
        break;
      }
      //console.log(index)
      var temp = filters[index].map(function(el) {
        //console.log("el",el);
        return window.T13NE.CE("option",{key:window.T13NE.KeyGen(6),value:el.value, id:"t13ne-filter"+el.value, /*selected:window.T13NE.Contains(this.state[rindex],el.value),*/ },el.label);
      },this);
      var val=this.state[rindex]?this.state[rindex]:[];
      if (typeof val !=="object"){val=[val];}
      filterList.push( window.T13NE.CE("div",{className:"t13ne-search-filter", key:window.T13NE.KeyGen(4)},window.T13NE.CE("label", {htmlFor:"t13ne-filter-"+rindex}, index),window.T13NE.CE('select',{id:"t13ne-filter-"+rindex, key: window.T13NE.KeyGen(7),className:"t13ne-filters"+rindex, onChange:this.changeFilters, "multiple":"multiple", value:val }, temp)));  
    },this);
    //console.log("filterList",filterList);
    return window.T13NE.CE("details", {key:window.T13NE.KeyGen(7),onClick:this.toggleOpen, open:this.state.filtersopen}, window.T13NE.CE("summary", {}, "Filter Elements by..."), window.T13NE.flattenDeep(filterList));
    
  }
  selectLink(post,id) {
    console.log("SEARCHBOX:selecting link", post, id);
    if (post.id!==this.state.t13postid){
       this.setState({
          message:"... Selecting Element ...", 
          mode:"request",
          t13postid:post.id,
          t13description:'',  
          input: '',
          selectedSuggestion: null,
          showSuggestions: false,
          posts:[],
          loading:false
        });
       this.loading = false;
       this.dispatched = false;
       this.getpost(post.id);
    }
   
  }

  renderSelectedPosts() {
    // show each post in the list.
    console.log("SEARCHBOX:renderSelectedPosts()");
    if (this.state.posts&&!!this.state.posts.length){
    return (     
      window.T13NE.CE("ul", {className: "t13ne-searchbox-ul ", key:window.T13NE.KeyGen(1)},
      this.state.posts.map((post, i) =>
      window.T13NE.CE("li", {className:"t13ne-searchbox-li", "key": window.T13NE.KeyGen(1)+"-"+post.id },
      /* render the post type if we have the data to support it */
      this.hasPostTypeData()&& false && window.T13NE.CE("span", { className:"t13ne-searchbox-li-span " ,"key":window.T13NE.KeyGen(1) }, this.getPostTypeData(post.type).displayName)),this)));
    }else{return "Select an Element, or restrict the search with the T13 Element Controls";}

  }
  resolvePostTypes(sourcePostTypes) {
    if (this.postTypes !== null) {
      return;
    }
    if (sourcePostTypes == null) {
      return;
    }
    const arr = sourcePostTypes.map(p => {
      return [p.slug, {
        slug: p.slug,
        displayName: p.labels.singular_name,
        restBase: p.rest_base }];
    });

    this.postTypes = new Map(arr);
  }
  getPostTypeData(slug) {
    if (!this.hasPostTypeData()) {return {};}
    return this.postTypes.get(slug);
  }
  hasPostTypeData() {
    return this.postTypes !== null;
  }


  render() {
    
    this.ready="rendering";
    window.T13NE.T13Alert(this.state.message);
    console.log("SEARCHBOX:searchbox state",this.state);
    var data={ 
            "id":this.state.id,
            "className": (this.state.className?this.state.className:"t13ne-element t13ne-element-container t13ne-searchbox"),
            "name":this.state.t13name,
            "title":window.T13NE.Parse(this.state.t13name),
            "data-t13name":this.state.t13name,
            "data-t13postid":  this.state.t13postid,
            "data-t13description":this.state.t13description,
            "data-t13genre": this.state.genre ,
            "data-t13eltype": this.state.eltype,        
            "data-t13scope": this.state.scope,
            "data-t13facet": this.state.facet,
            "data-t13era":   this.state.era ,
            "data-t13data":   this.state.t13data ,  
            "data-tags": this.state.tags,
            "data-cats": this.state.cats,
            "data-t13geo": this.state.geo,
            "data-edit":this.props["data-edit"]?this.props["data-edit"]:true,
            "data-t13ne-new":this.state.mode?this.state.mode=="new":false,
            "data-id":this.state.id,
            "data-save":this.props['data-save']?this.props["data-save"]:false,
            };
    
    if (this.state.mode=="search"){
      //console.log("search:");
      const inputDisabled = !!this.props.limit && this.props.posts.length >= this.props.limit;

        return (window.T13NE.CE( "article",data, 
         
          window.T13NE.CE("p",{className:"t13ne-search"}, "Search for an Element"), 
          this.resolvePostTypes(this.props.sourcePostTypes),
            window.T13NE.CE(window.wp.element.Fragment, null,
            !!this.state.posts.length? this.renderSelectedPosts():null,
            window.T13NE.CE("div", { id:"t13ne-search-select",className: "block-editor-url-input" , "data-t13postid":this.state.t13postid, "key":window.T13NE.KeyGen(8)},
            window.T13NE.CE("input", {
              autoFocus: true,
              type: "text",
              "aria-label": 'Search for',
              required: true,
              value: this.state.input,
              onChange: this.onChange,
              onInput:  event => event.stopPropagation(),
              placeholder: inputDisabled ? `Limted to ${this.props.limit} posts` : 'Type an Element name',
              onKeyDown: this.onKeyDown,
              role: "combobox",
              "aria-expanded": this.state.showSuggestions,
              "aria-autocomplete": "list",
              "aria-owns": `block-editor-url-input-suggestions-${this.props.id}`,
              "aria-activedescendant": this.state.selectedSuggestion !== null ? `block-editor-url-input-suggestion-${this.props.id}-${this.state.selectedSuggestion}` : undefined,
              style: { width: '100%' },
              disabled: inputDisabled },null),
            this.state.loading && window.T13NE.CE(window.wp.components.Spinner, null),
            this.state.showSuggestions &&
            !!this.state.posts.length &&
            window.T13NE.CE(window.wp.components.Popover, { position: "bottom center", noArrow: true, focusOnMount: false },
            window.T13NE.CE("div", { className: "block-editor-url-input__suggestions", id: `block-editor-url-input-suggestions-${this.props.id}`, ref: this.bindListNode, role: "listbox" },
            this.state.posts.map((post, index) =>
            window.T13NE.CE("button", {
              key: window.T13NE.KeyGen(4)+post.id,
              role: "option",
              tabIndex: "-1",
              id: `block-editor-url-input-suggestion-${this.props.id}-${index}`,
              ref: this.bindSuggestionNode(index),
              className: `block-editor-url-input__suggestion ${index === this.state.selectedSuggestion ? 'is-selected' : ''}`,
              onClick: () => this.selectLink(post, this.state.id),
              "aria-selected": index === this.state.selectedSuggestion },
              window.T13NE.CE("div", { className:"t13ne-searchbox-flex-div" },
            this.hasPostTypeData() && window.T13NE.CE("div", { className:"t13ne-searchbox-div" }, this.getPostTypeData(post.subtype).displayName)),
            window.T13NE.CE("div", null,  window.wp.htmlEntities.decodeEntities(window.T13NE.displayName(post.title)) || '(no title)'))))))), this.renderFilters(),null));
       }else{

        if (this.state.t13postid!==-1&&!this.loading&&!this.dispatched){
           // this.getpost(this.state.t13postid);
          }
        return window.T13NE.CE("article", data, 
          window.T13NE.CE("p",{className:"t13ne-request"},this.state.message));
       }   
    
  }
};









 
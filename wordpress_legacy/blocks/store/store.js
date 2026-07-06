/*window.T13NE.Store =window.wp.data.registerStore('t13ne/t13store', {
  reducer(state = {t13elems:{}}, action) {
    switch (action.type) {
      case 'SET_ELEMENT_STATE':
        return {
          ...state,
          selements:{
            ...state.t13elems,
            [action.element]: action.statement}
        };
      }
        return state;
      },
      setElementState(element,statement) {
        return {
          type: 'SET_ELEMENT_STATE',
          element,
          statement };
      },
      selectors: {
        getElementState(state,element) {
            return state.t13elems[element];
        },
      },
      controls: {
        FETCH_FROM_API( action ) {
            return apiFetch( { path: action.path } );
        },
    },
    resolvers: {
        * getElementState( element ) {
            const path = '/wp/v2/t13elems/' + element;
            const status = yield actions.fetchFromAPI( path );
            return actions.setElementState( element, status );
        },
    },
    }
);*/

window.T13NE.IDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
         
         //prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
if (!window.indexedDB) {
  window.alert("Your browser doesn't support a stable version of IndexedDB.");
}

window.T13NE.t13db={};
window.T13NE.t13db.DB={};
window.T13NE.t13db.Name = "t13cache";
window.T13NE.t13db.CacheName = "t13cache";
window.T13NE.t13db.AddQueue = [];
window.T13NE.t13db.result = null;
window.T13NE.t13db.open = window.T13NE.IDB.open(window.T13NE.t13db.Name, 1);
window.T13NE.t13db.open.onerror = function(event) {
  window.T13NE.t13db.error =event;
   window.T13NE.t13db.DB = false;
  //console.log("T13DB error: ",event);
};
window.T13NE.t13db.open.onsuccess = function(event) {
  window.T13NE.t13db.DB = window.T13NE.t13db.open.result;
  window.T13NE.t13db.ready = event;
  console.log("T13 DB success: ", window.T13NE.t13db);
  
};
window.T13NE.t13db.open.onupgradeneeded = function(event) {
  console.log("upgrading database");
  window.T13NE.t13db.DB = event.target.result;
  var Cache = window.T13NE.t13db.DB.createObjectStore(window.T13NE.t13db.CacheName, {keyPath: "id"});
  Cache.put({id:"T13",value:"Test"});
  // Cache.createIndex('id','id',{unique:true});
  // Cache.createIndex('cache','cache',{unique:false});
  Cache.transaction.oncomplete = function(event) {
    // Store values in the newly created objectStore.
    window.T13NE.t13db.ready = event;
    console.log("upgraded the T13DB. Ready");
    window.T13NE.t13db.add();
  }
}

window.T13NE.ReadDBtoDOM = function(id,elid) {
  var reader = window.T13NE.t13db.DB.transaction([window.T13NE.t13db.Name], 'readonly');
  //console.log("ReadDBtoDOM",id,elid);
  //console.log(reader);
  var read = reader.objectStore(window.T13NE.t13db.CacheName).get(id);
  //console.log(read);
  read.onerror = function(event) {
    window.T13NE.t13db.error = event;
    console.error("T13DB error on read to DOM");
  };
  
read.onsuccess = function(event) {
    var result = event.target.result;
     // Do something with the request.result!
     var elidom=document.getElementById(elid);
      //console.log("elidom",elidom.outerHTML);
      //console.log("elidom",elidom.innerHTML);
     if(result) {
        //console.log('request found', result);
        elidom.innerHTML = JSON.parse(result.value);
        window.T13NE.t13db.result = result;
        // need to hydrate the cache
        if (window.T13NE.Contains(elid,'card')){
          window.T13NE.Hydrate('card',elidom);
        }
     } else {

       console.log("request not found", id);
        var ref = id.substr(0,4);
        console.log ("ref=", ref);
        switch (ref){
          case "card":
            console.log("card detected, building carte");
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
                    "data-hydrate": false
              }, null);
            console.log("carte prepared, rendering");
              var carte = window.T13NE.Render(carte, elidom );
          break;
          default:
            console.log("event",event);
          break;
        }
     }
  };
}
window.T13NE.ReadDB = function (id){
  window.T13NE.t13db.read = window.T13NE.t13db.DB.transaction([window.T13NE.t13db.Name],"readonly").objectStore(window.T13NE.t13db.CacheName).get(id);
  window.T13NE.t13db.read.onerror = function(event) {
    window.T13NE.t13db.error = event;
    console.log("T13DB error on read");
  }
  window.T13NE.t13db.read.onsuccess = function(event) {
     // Do something with the request.result!
    
     if(window.T13NE.t13db.read.result) {
        //console.log('request found', t13request.result.cache);
        window.T13NE.T13db.result = window.T13NE.Parse(window.T13NE.t13db.read.result.cache);
     } else {
       console.log("request not found", id);
     }
  };

}

window.T13NE.t13db.waitAdd =function (key,value){
  window.T13NE.t13db.AddQueue[window.T13NE.t13db.AddQueue.length]={id:key,value:value};
  console.log("waiting to add "+key);
}
window.T13NE.t13db.add = function() {
  console.log("add db entries ", window.T13NE.t13db.Name);
  var adding=window.T13NE.t13db.DB.transaction([window.T13NE.t13db.Name], "readwrite");
  var addrequest =adding.objectStore(window.T13NE.t13db.CacheName);
  addrequest.onsuccess = function(event) {
    console.log("added successfully");
    window.T13NE.t13db.success =true;
  };
  addrequest.onerror = function(event) {
    console.log("Yeah, something went wrong with the internal database there, bud",event);
    window.T13NE.t13db.lastError = event;
  }; 
  while(window.T13NE.t13db.AddQueue.length>0){
    var cue=window.T13NE.t13db.AddQueue.shift();

    addrequest.put( cue );
  }
  
  
};
 
window.T13NE.AddDB = function (key,value){
  console.log("AddDB called");
  if (!window.T13NE.isJSON(value)&&typeof(value)!="string"){
     console.log("None JSON value",value);
    value=JSON.stringify(value);
  }
  if (window.T13NE.t13db.DB&&window.T13NE.t13db.ready){
    window.T13NE.t13db.waitAdd(key,value);
    window.T13NE.t13db.add();
  }else{
    window.T13NE.t13db.waitAdd(key,value);
  }
}
window.T13NE.RemoveDB = function(id) {
  console.log("RemoveDB called removing id ",id);
  window.T13NE.t13db.remove = window.T13NE.t13db.transaction(window.T13NE.t13db.Name, "readwrite").objectStore(window.T13NE.t13db.CacheName).delete(id);
  
   window.T13NE.t13db.remove.onsuccess = function(event) {
     console.log("id removed from cache");
  };
}

window.T13NE.T13Changed = () => {console.log("t13changed functional");};
function createT13Store() {
  //console.log("T13Store created");
    
    var t13elements = {"statblocks":{}, };
    var selectors = {
        getT13Post( postid){
          return t13elements['el'+postid]?t13elements['el'+postid]:-1;
        },
        getT13Elem( itemName ) {
          return t13elements[t13elements[itemName]]?t13elements[t13elements[itemName]]:t13elements["new"+itemName]?t13elements["new"+itemName]:t13elements[itemName]?t13elements[itemName]:-1;          
        },
        getHash(postid){
          return t13elements[postid].hash?t13elements[postid].hash:window.T13NE.Hash("hash:"+postid+t13elements[postid].title+t13elements[postid].content);
        },
        getStatBlock(statblockID){
          return t13elements['statblocks']?t13elements['statblocks'][statblockID]?t13elements['statblocks'][statblockID]:-1:-1;
        }
    }; 
    const actions = {
       readStatBlock(statblockID){
        console.log("T13Store readStatBlock", statblockID);
         var ret = selectors.getStatBlock(statblockID);
         if (ret!==-1){
          return ret;
         }else{
          t13elements['statblocks'][statblockID]="Pending";
          window.T13NE.T13Changed();
          console.log("T13Store readStatBlock post pending", statblockID);
           var t13statblock ={};
            //var eltype = window.T13NE.getLowestElementType(postvars['t13type']);
            window.wp.apiFetch( {path:"/t13ne/v1/statblocks/?statblockid="+statblockID} ).then(t13statblock => {
              console.log("T13NE/T13Store:: Statblocks Updating", t13statblock);
             
              t13elements['statblocks'][statblockID] = t13statblock;
                window.T13NE.debounce(window.T13NE.T13Changed, 100, "storeDebounce", true);
            });
            return  t13elements['statblocks'][statblockID];
         }
        },
        setT13Elem( itemName, passvar ) {
          console.log("T13NE/T13Store:: state changing",itemName, passvar );

          if (passvar.t13postid&&passvar.title&&passvar.content){
          	passvar['hash']==window.T13NE.Hash("hash:"+passvar.t13postid+passvar.title+passvar.content);
          }
          if (t13elements[itemName]==undefined&&passvar.t13postid&&(passvar.title||passvar.t13postid||passvar.t13ready) ){
            if (passvar.t13postid =="new"){
              passvar.t13postid = "new"+itemName;
            }
            window.T13NE.AddDB(itemName,passvar);
            t13elements[passvar.t13postid] = passvar;
            t13elements[itemName] =passvar.t13postid;
            
            if (passvar.t13postid){
              t13elements['lastid']=passvar.t13postid;
            }
            console.log("setT13Elem setting latest to",itemName)
            t13elements['latest'] = itemName;
            window.T13NE.debounce(window.T13NE.T13Changed, 100, "storeDebounce", true);}
           
        },
        readT13Elem(postid="none", id="Read", callback=null){
          if (postid=="none"&&id=="Read"){
            console.error("Look you can't read an Element if you don't specify anything about it, try a post_id or a DOM id, they might work. ");
            return -1;
          }
          var ret = {};
          if (postid=="none"){
            ret = selectors.getT13Elem(id);
          }else{
            ret = selectors.getT13Post('el'+postid);
          }
          if (ret!==-1){
            return ret;
          }else{
            t13elements[id] = t13elements[id]?t13elements[id]:"Pending";
            t13elements['el'+postid]=t13elements['el'+postid]?t13elements[postid]:"Pending";
            window.T13NE.T13Changed();
            console.log("T13Store readT13Elem", postid,id);
           
            //console.log("thisun ",thisun);
            var reading = new Promise(read=>{window.T13NE.ReadDB('el'+postid);})
              .then(result =>{t13elements[postid]=window.T13NE.t13db.result;
                t13elements[id]=postid;
                t13elements['lastid']=postid;
                 console.log("reading local DB sets latest ",id);
                 t13elements['latest']=id;
              },fail=>{console.log("failed readDB");} )
              .catch(allfail=>{console.log("Yeah, reading the local DB broke something");} ) ;
            
            console.log("trying to read",id,reading); 
           
            var t13elem ={};
            //var eltype = window.T13NE.getLowestElementType(postvars['t13type']);
            var path = window.wp.url.addQueryArgs('/t13ne/v1/elems', {
              'id': postid ,
              
            });
   
            console.log("T13Store::request path", path );
   

            window.wp.apiFetch({path:path}).then(t13elem=>{
                console.log("T13NE/T13Store:: Store Updating:", id, postid);
                console.log("T13NE/T13Store:: Store content = ",t13elem);
                var names=window.T13NE.namesFromTitle(t13elem.element.post_title);
              var eltype =window.T13NE.getLowestElementType(t13elem.terms.Type);
              var passvar={
                t13ready:"T13Element Loaded",
                t13postid:t13elem.element.ID, 
                title:window.T13NE.Stringify(t13elem.element.post_title),
                t13name:names[0]?window.T13NE.Stringify(names[0]):window.T13NE.Stringify(t13elem.element.post_title),
                t13fullname:names[1]?window.T13NE.Stringify(names[1]):window.T13NE.Stringify(t13elem.element.post_title),
                t13aka:names[2]?window.T13NE.Stringify(names[2]):window.T13NE.Stringify(t13elem.element.post_title),
                content:window.T13NE.Stringify(t13elem.element.post_content), 
                t13era:t13elem.terms.Era, 
                t13genre:t13elem.terms.Genre, 
                t13facet:t13elem.terms.Facet, 
                t13geo:t13elem.terms.Geo, 
                t13scope:t13elem.terms.Scope, 
                eltype:t13elem.terms.Type,
                t13type:eltype,
                tags:t13elem.terms.tags, 
                cats:t13elem.terms.Category,
                t13data:t13elem.terms.Data,
                t13parent:t13elem.terms.Parent,
              };
              passvar['hash']=window.T13NE.Hash("hash:"+passvar.t13postid+passvar.title+passvar.content);
              console.log("T13NE/T13Store:: Passvar id",passvar,id);
              t13elements[postid] = passvar;
              window.T13NE.AddDB('el'+postid,passvar);
              t13elements[id] = passvar.t13postid;
              t13elements['lastid']=passvar.t13postid; 
               console.log("readT13elem setting latest to ",id);
              t13elements['latest'] = id; 

              if (typeof(callback) == 'function'){
                callback();
              }
              window.T13NE.debounce(window.T13NE.T13Changed, 100, "storeDebounce", true);
          });
        }
            // window.wp.apiFetch( {path:"/wp/v2/element/"+postid} ).then(t13post => {
            //   console.log("T13NE/T13Store:: Store Updating:", id, postid);
             return "Pending";  
        },
       
        writeT13Elem(postid, id='Write'){
          if (window.T13NE.Can_edit()){
            console.log('T13Store writeT13Elem', postid, id);
            var postvars=selectors.getT13Post[postid];
            console.log('T13Store ', t13elements[postid], t13elements[id]);
            var eltype = window.T13NE.getLowestElementType(postvars['t13type']);
            var names=window.T13NE.Stringify(t13post.title.rendered).split(":");
            var args='?title='+window.T13NE.Stringify(window.T13NE.TitleFromNames(array(postvars['t13name'],postvars['t13fullname'],postvars['t13aka'])))
            +'&content='+window.T13NE.Stringify(postvars['content'])
            +'&parent='+postvars['parent']
            +"&t13postid"+postvars['t13postid']
            +'&facet='+window.T13NE.getTermName(postvars['facet'])
            +'&eltype='+eltype
            +'&t13type'+window.T13NE.Stringify(window.T13NE.getTermName(postvars['t13type']))
            +'&t13facet='+window.T13NE.Stringify(window.T13NE.getTermName(postvars['t13facet']))
            +'&t13genre='+window.T13NE.Stringify(window.T13NE.getTermName(postvars['t13genre']))
            +'&t13scope='+window.T13NE.Stringify(window.T13NE.getTermName(postvars['t13scope']))
            +'&t13era='+window.T13NE.Stringify(window.T13NE.getTermName(postvars['t13era']))
            +'&post_tags='+window.T13NE.Stringify(window.T13NE.getTermName(postvars['post_tag']))
            +'&category='+window.T13NE.Stringify(window.T13NE.getTermName(postvars['category']))
            +'&specify='+window.T13NE.Stringify(window.T13NE.Contains(postvars['name'], '(Specify)'));
            window.T13NE.T13Alert("Adding Element"); 
            var respond={"t13ready":"Updating DB"};

            window.wp.apiFetch({path:"/t13ne/v1/addt13/"+args}).then(respond => {
              console.log("api responded:",respond);
              window.T13NE.T13Alert("Added Element");
              var post2store={
                t13ready:"addedNew",
                t13error:respond['error'],
                t13postid:respond['id'], 
                title: window.T13NE.Stringify(respond.title.rendered), 
                t13name:window.T13NE.Stringify(names[0]),
                t13fullname:window.T13NE.Stringify(names[1]),
                t13aka:window.T13NE.Stringify(names[2]),
                content:window.T13NE.Stringify(respond.content.rendered), 
                t13era:window.T13NE.Stringify(respond['t13era']),
                t13type:window.T13NE.Stringify(respond['t13type']),
                t13genre:window.T13NE.Stringify(respond['t13genre']), 
                t13facet:window.T13NE.Stringify(respond['t13facet']), 
                t13geo:window.T13NE.Stringify(respond['t13geo']), 
                t13scope:window.T13NE.Stringify(respond['t13scope']),
                t13data:window.T13NE.Stringify(respond['t13data']),
                t13type:window.T13NE.Stringify(respond['t13type']), 
                eltype:window.T13NE.Stringify(eltype), 
                "post_tag":window.T13NE.Stringify(respond['post_tag']), 
                category:window.T13NE.Stringify(respond['category']),
              };    
              post2store['hash']=window.T13NE.Hash("hash:"+post2store.t13postid+post2store.title+post2store.content);
              if (post2store['hash']!==t13elements[respond['id']]){
                console.log("store respond[id]=",respond['id']);
                t13elements[respond['id']]=post2store;
                window.T13NE.AddDB('el'+respond['id'], post2store);
                t13elements['lastid']=respond['id'];
                if (id!=="Write"){
                  console.log('not write, id',id);
                  t13elements[id]=respond['id'];
                  t13elements['latest'] = id;
                }
                
              window.T13NE.debounce(window.T13NE.T13Changed, 100, "storeDebounce", true);
              }
             
                  
             
            });
          }else{
            window.T13NE.T13Alert('Login Required');
            console.error("Unable to write without editing privileges. You need to get an account, or login.")
          }
        }
    }; 
    return {
        getSelectors() {
            return selectors;
        },
        getActions() {
            return actions;
        },
        subscribe( listener ) {
          //console.log("T13Store subscribed");
            window.T13NE.T13Changed = listener;
        }
    };
}


var t13Store=[];
t13Store.instantiate =createT13Store;
t13Store.name='t13ne/t13store';
window.wp.data.register( t13Store );
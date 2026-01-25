if (!T13NE) {var T13NE = {};}
//window.T13NE.Facets=[];
// then get it from the system? Or write it here...
if (!window.T13NE.Facet){
	window.T13NE.Facet = {};
}

window.T13NE.Facet.Match= function (test,against){
	return against=="All"||against=="all"||against=="*"||test===against||test.toLowerCase()==against.toLowerCase()||test.toLowerCase().replace(/^\s+|\s+$/gm,'')==against.toLowerCase().replace(/^\s+|\s+$/gm,'');
}
window.T13NE.Facet.FacetSelector = function (props){
	var ret=[];
	for (var i=0;i<24;i++){
		var label = "Buggered";
		var facet =window.T13NE.Facets[i];
		switch (props['data-mode']){
			case "Action":
			label = facet['Action'];
			text = facet['Action_Text'];
			break;
			case "Attack":
			label = facet['Attack'];
			text = facet['Attack_Text'];
			break;
			case "Critical":
			label = facet['Critical'];
			text = facet['Critical_Text'];
			break;
			case "Core":
			label = facet['Core'];
			text = facet['Core_Text'];
			break;
			case "Descendant":
			case "Descendants":
			case "Descs":
			label = facet['Descendants'];
			text = facet['Descendants_Text'];
			break;
			case "Edge":
			label = facet['Edge'];
			text = facet['Edge_Text'];
			break;
			case "Failure":
			label = facet['Failure'];
			text = facet['Failure_Text'];
			break;
			case "Fumble":
			label = facet['Fumble'];
			text = facet['Fumble_Text'];
			break;
			case "Glow":
			label = facet['Glow'];
			text = facet['Glow_Text'];
			break;
			case "Herald":
			label = facet['Herald'];
			text = facet['Herald_Text'];
			break;
			case "Hitch":
			label = facet['Hitch'];
			text = facet['Hitch_Text'];
			break;
			case "Incarna":
			label = facet['Incarna'];
			text = facet['Incarna_Text'];
			break;
			case "Location":
			label = facet['Location'];
			text = facet['Location_Text'];
			break;
			case "Lore":
			label = facet['Lore'];
			text = facet['Lore_Text'];
			break;
			case "Incarna":
			label = facet['Incarna'];
			text = facet['Incarna_Text'];
			break;
			case "Monster":
			label =facet['Monster'];
			text= facet['Monster_Text'];
			break;
			case "Narrative_Moment":
			label = facet['Narrative_Moment'];
			text = facet['Narrative_Text'];
			break;
			case "Nimbed":
			label = facet['Nimbed'];
			text = facet['Nimbed_Text'];
			break;
			case "Ordeal":
			label = facet['Ordeal'];
			text = facet['Ordeal_Text'];
			break;
			case "Persona":
			label = facet['Persona']['Name'];
			text = facet['Persona']['Motivation'];
			break;
			case "Quest":
			label = facet['Quest'];
			text = facet['Quest_Text'];
			break;
			case "Question":
			label = facet['Question'];
			text = facet['Question_Text'];
			break;
			case "Resolved":
			label = facet['Resolved_Hitch'];
			text = facet['Resolved_Text'];
			break;
			case "Style":
			label = facet['Style'];
			text = facet['Style_Text'];
			break;
			case "Success":
			label = facet['Success'];
			text = facet['Success_Text'];
			break;

			case "Sway":
			label = facet['Sway'];
			text = facet['Sway_Text'];
			break;
			case "Tangle":
			label = facet['Tangle'];
			text = facet['Tangle_Text'];
			break;
			case "Test":
			label = facet['Test'];
			text = facet['Test_Text'];
			break;
			case "Tone":
			label = facet['Tone'];
			text = facet['Tone_Text'];
			break;

			case "Umbral":
			label = facet['Umbral'];
			text = facet['Umbral_Text'];
			break;
			default:
			label = facet['FacetName'];
			text = facet['Description']
			break;
		}
		ret.push({value:i, label:label, "data-description":text});
	}
	return ret;
};
window.T13NE.Facet.getFacetTerms = function (facet){
	var face = facet;
	if (JSON.stringify(Number(face))!==JSON.stringify(Number("facet"))){facet=parseInt(facet);}
	switch (typeof facet){
		case "string":
		facet=facet.toLowerCase();
		return window.T13NE.getTerm(facet);
		break;
		case "number":
		case "integer":
		case "float":
		facet=Math.round(facet);
		if (facet>23){return facet;}else{
			var qf=window.T13NE.Facets[facet];
			
			return qf.term;
		}
		break;
		case "object":
			if (Array.isArray(facet)){
				var ret =[];
				facet.forEach( function(element, index) {
					ret[index]=window.T13NE.Facet.getFacetTerms(element);
				});
				return ret;
			}else{
				if (facet["term"]){return facet["term"];}else{return null;}
			}
		break;
		case "undefined":
		return null;
		default:
			return 0;
		break;			
	}
}
window.T13NE.Facet.buildFacetList = function (facet){
	var ret=[];
	if (typeof(facet)=="string"&&facet.indexOf("any "!==-1)){
		//we have a css facet thingy...
		facets = facet.split(" ");
		facets.forEach(fac=>{if (fac!=="any"){
			ret[ret.length]=window.T13NE.Facet.getFacetNumber(fac);
		}});
	}
	return ret;

}
window.T13NE.Facet.getFacetNumber = function (facet){
	var face=facet;	
	if (JSON.stringify(Number(face))!==JSON.stringify(Number(facet))){facet=parseInt(facet);}
	switch (typeof(facet)){
		case "string":
			facet=facet.toLowerCase();
			facet.replace("any","");
			facet.replace("all","");
			if (facet!==" "){
				//console.log("facet=",facet);
				for (var i=0;i<=23;i++){
					var qf=window.T13NE.Facets[i];
					qf=window.T13NE.ObjMap(qf,function(){
						//console.log("args",arguments);
						if (arguments[1]!==undefined && typeof(arguments[1])=="string" && window.T13NE.Facet.Match(arguments[1],facet)) {
							return i;
						}else{
							return null;
						}
					});
					qf=qf.sort();
					if  (qf[0]!==null){
						//console.log("qf[0]",qf[0]);
						return qf[0];
					}
				}
			}else{
				return null;
			}
			console.log("unknown facet!", facet);			
		break;
		case "number":
		case "integer":
		case "float":
			facet=Math.round(facet);
			if (facet>23){
				//probably a term then...
				for (var i=0;i<=23;i++){
					var qf=window.T13NE.Facets[i];
					if (facet==qf.Term){
						return i;
					}
				};
			}else{
				return facet;
			}
		break;
		case "object":
			if (Array.isArray(facet)){
				return window.T13NE.Facet.getFacetNumber(facet[0]);
			}else{
				if (facet["term"]){return window.T13NE.Facet.getFacetNumber(facet["term"]);}else{return null;}
			}
		break;
		case "undefined":
		return null;
		break;
		default:
			return 0;
		break;
	}
}
//display 
window.T13NE.FacetIcon=function (props){
	var idfi=window.T13NE.getT13ID("radialGradient","T13FacetGradient", window.T13NE.This(this,this,props));
		return window.T13NE.CE("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512", "key":window.T13NE.KeyGen("key") +"-"+ Math.random().toString(36).substr(2, 5) }, window.T13NE.CE("defs", null, window.T13NE.CE("radialGradient", { id:idfi }, window.T13NE.CE("stop", { offset: "0%", "stopColor": "#f42626", "stopOpacity": "1" }), window.T13NE.CE("stop", { offset: "100%", "stopColor": "#000", "stopOpacity": "1" }))), window.T13NE.CE("polygon", { points: "256,512,0,256,256,0,512,256", fill: "url(#pattern)", "fillOpacity": "0" }), window.T13NE.CE("g", { transform: "translate(0,0)" }, window.T13NE.CE("path", { d: "M247 25.076L107.053 130.004l64.996 32.486L247 106.297v-81.22zm18 0v81.22l74.95 56.194 65-32.488L265 25.076zm9.277 22.307l36.63 26.437c-25.125-4.207-29.74 9.2-37.348 28.8l.717-55.237zm-37.79 3.926l-.274 33.362c-22.052 1.182-56.787 14.423-107.893 43.99L236.488 51.31zM256 122.044l-74 55.48v156.948l74 55.482 74-55.482V177.527l-74-55.482zm4.215 17.67c-37.503 33.84-60.642 164.833-63.65 199.094l-.35-151.095 64-48zM99 146.1v219.8l65-32.488V178.588L99 146.1zm314 0l-65 32.488v154.824l65 32.488V146.1zm-301.352 23.31l40.473 20.83c-46.28 38.757-30.79 122.693-41.876 162.572l1.404-183.402zm60.4 180.1l-64.995 32.486L247 486.924v-81.22l-74.95-56.194zm167.903 0L265 405.703v81.22l139.947-104.927-64.996-32.486zm-169.415 17.172c-19.594 16.282-16.745 24.365 4.477 54.412l-44.246-38.018 39.77-16.394z", fill: "url(#"+idfi+")", stroke: "#bc8413", "strokeOpacity": "1", "strokeWidth": "4" })));
	
};

window.T13NE.Facet.AspectBox = function (props){
	//console.log("aspect box",props);
	var aspect=""+props["data-aspect"];
	var title=aspect.replace('_',' ');
	var face=window.T13NE.Facet.getFacetNumber(props["data-facet"]);
	var content=[];
	if (face!==null&&window.T13NE.Facets[face]!==undefined){
		//we have some content... propbably
		if (window.T13NE.Facets[face][aspect]){
			var aspectcss=(" t13ne-"+window.T13NE.Facets[face]["FacetName"]+" t13ne-"+aspect.replace('_','-').toLowerCase());
			var css=props.className+aspectcss;
			css = css.toLowerCase();
			var facet=window.T13NE.Facets[face];
			//we definitely have some content.
			//console.log(aspect);
			switch(aspect){
				case "AntiFacet":
					content=window.T13NE.CE(window.T13NE.TextBox, {className:css, title:"Anti-Facet", "data-type":window.T13NE.Facets[facet.AntiFacet].FacetName, "key":window.T13NE.KeyGen(title+"AntiFacet")},null);
				break;

				case "FacetName":

				content = window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox t13ne-facet-name", title:"Facet Name", "key":window.T13NE.KeyGen(title+"FacetName")}, 
					window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title"},"Facet Name"),
		window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description"},
			window.T13NE.CE("span",{className:props.className+"-facet-name"}, facet.FacetName),
			window.T13NE.CE("span",{className:props.className+"-facet-"+facet.Yang?"yang":"yin", title:facet.Yang?"Yang":"Yin"}, facet.Yang?"⚊":"⚋"),
			window.T13NE.CE(window.T13NE.Suits.DisplayBox,{"data-suit":facet['Suit'], "className":css+"-suit t13ne-facet-suit"})));
			
				break;
				case "FacetGeometry":
					content=window.T13NE.CE(window.T13NE.TextBox,{className:css+"-facet-geo", title:"Facet Geometry", "data-description":{internal:' '+facet.FacetGeometry},"key":window.T13NE.KeyGen(title+"facetgeo")}, null);
				break;
				case "Yang":
					content=window.T13NE.CE("span", {className:css, title:facet.Yang?"Yang":"Yin", "key":window.T13NE.KeyGen(title+"Yang") }, facet.Yang?"⚊":"⚋");
				break;
				case "Suit":
					content=window.T13NE.CE(window.T13NE.Suits.DisplayBox,{"data-suit":facet['Suit'], "className":css+"-suit t13ne-facet-suit", "key":window.T13NE.KeyGen(title+"Suit") });
				break;
				case "FacetInitial":
					content=window.T13NE.CE("abbr",{"className":css+"-abbr", "title": facet['FacetName'], "key":window.T13NE.KeyGen(title+"Initial") }, facet['Facet_Initial']);
				break;
				case "Persona":
					content = window.T13NE.CE("section", {"className":css, "key":window.T13NE.KeyGen(title+"Persona")}, 
						window.T13NE.CE("header", {"className":css+"-header"}, "Persona"),
						window.T13NE.CE("footer", {"className":css+"-title"}, facet["Persona"]["Name"]),
						window.T13NE.CE("main",{className:css+"-main"},
					window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox", title:"Motivation", "key":window.T13NE.KeyGen(title+"Motivation")}, 
						window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title"}, "Motivation" ),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description", dangerouslySetInnerHTML:window.T13NE.T13Sanitize({internal:facet["Persona"]["Motivation"] })},null)),
					window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox", title:"Avoid", "key":window.T13NE.KeyGen(title+"Avoid") }, 
						window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title"},"Avoid"),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description", dangerouslySetInnerHTML:window.T13NE.T13Sanitize({internal:facet["Persona"]["Avoid"]})},null)),
					window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox", title:"Shadow", "key":window.T13NE.KeyGen(title+"Shadow") }, 
						window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title"},"Shadow"),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description", dangerouslySetInnerHTML:window.T13NE.T13Sanitize({internal:facet["Persona"]["Shadow"]})},null)),
					window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox", title:"Gain Chi", "key":window.T13NE.KeyGen(title+"Gain") }, 
						window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title", "key":window.T13NE.KeyGen(title+"Gain Chi") },"Gain Chi"),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description", dangerouslySetInnerHTML:window.T13NE.T13Sanitize({internal:facet["Persona"]["Gain_Chi"]})},null)))
						);
			
				break;
				case "Emotion_Negative":
				var wirkvar = window.T13NE.CE("ol", {"className":css+'-list t13ne-negative-emotions', "key":window.T13NE.KeyGen(title+"Negative Emotion") },[
					window.T13NE.CE("li", {"className": css+'-list-item t13ne-output t13ne-one-card-emotion', "key":window.T13NE.KeyGen(title+"Fear") },
						window.T13NE.CE("span",{"className": css+" t13ne-emotion-name"}, facet["Emotion_Negative"][0]["Name"] ), window.T13NE.CE("span",{"className": css+" t13ne-emotion-description"}, facet[aspect][0]['Description'] ) ),
					window.T13NE.CE("li", {"className": css+'-list-item t13ne-output t13ne-two-card-emotion', "key":window.T13NE.KeyGen(title+"Terror")},
						window.T13NE.CE("span",{"className": css+" t13ne-emotion-name"}, facet[aspect][1]['Name'] ), window.T13NE.CE("span",{"className": css+" t13ne-emotion-description"}, facet[aspect][1]['Description'] ) ),
					window.T13NE.CE("li", {"className": css+'-list-item t13ne-output t13ne-three-card-emotion', "key":window.T13NE.KeyGen(title+"Horror") },
						window.T13NE.CE("span",{"className": css+" t13ne-emotion-name"}, facet[aspect][2]['Name'] ), window.T13NE.CE("span",{"className": css+" t13ne-emotion-description"}, facet[aspect][2]['Description'] ) ) ]
				);
				content=window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox-emn", title:"Emotion Negative", "key":window.T13NE.KeyGen(title+"NegativeEmotion") }, 
						window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title"},"Emotion Negative"),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description"}, wirkvar));
				break;
				case "Emotion_Positive":
				var wirkvar = window.T13NE.CE("ol", {"className":css+'-list t13ne-positive-emotions', "key":window.T13NE.KeyGen(title+"PositiveEmotions") },[window.T13NE.CE("li", {"className": css+'-list-item t13ne-output t13ne-one-card-emotion', "key":window.T13NE.KeyGen(title+"Fascination")},
						window.T13NE.CE("span",{"className": css+" t13ne-emotion-name"}, facet[aspect][0]['Name'] ), window.T13NE.CE("span",{"className": css+" t13ne-emotion-description"}, facet[aspect][0]['Description'] ) ),
					window.T13NE.CE("li", {"className": css+'-list-item t13ne-output t13ne-two-card-emotion', "key":window.T13NE.KeyGen(title+"Wonder")},
						window.T13NE.CE("span",{"className": css+" t13ne-emotion-name"}, facet[aspect][1]['Name'] ), window.T13NE.CE("span",{"className": css+" t13ne-emotion-description"}, facet[aspect][1]['Description'] ) ) ,
					window.T13NE.CE("li", {"className": css+'-list-item t13ne-output t13ne-three-card-emotion', "key":window.T13NE.KeyGen(title+"Reverence") },
						window.T13NE.CE("span",{"className": css+" t13ne-emotion-name"}, facet[aspect][2]['Name'] ), window.T13NE.CE("span",{"className": css+" t13ne-emotion-description"}, facet[aspect][2]['Description'] ) ) ]
					);
				content=window.T13NE.CE("section", {className:props.className+"-section t13ne-textbox-emp", title:"Emotion Positive", "key":window.T13NE.KeyGen(title+"Emotion_Positive")}, 
						window.T13NE.CE("header",{className:props.className+"-section-header t13ne-textbox-title"},"Emotion Positive"),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-textbox-description"}, wirkvar));
				break;
				case "Hitch":
				content=window.T13NE.CE(window.T13NE.TextBox,{className:css+"-text", title:title, "data-type":{internal:facet["Hitch"]}, "data-description":{internal: facet["Hitch_Text"]}, "key":window.T13NE.KeyGen(facet[aspect])}, 
							window.T13NE.CE(window.T13NE.TextBox,{className:css+"-rules-quirk", title:"Quirk", "data-description":{internal:facet["Hitch_Rules"]['Quirk']}, "key":window.T13NE.KeyGen(facet["Hitch_Rules"]['Quirk'])},null),
							window.T13NE.CE(window.T13NE.TextBox,{className:css+"-rules-flaw", title:"Flaw", "data-description":{internal:facet["Hitch_Rules"]['Flaw']}, "key":window.T13NE.KeyGen(facet["Hitch_Rules"]['Flaw'])},null),
							window.T13NE.CE(window.T13NE.TextBox,{className:css+"-rules-woe", title:"Woe", "data-description":{internal:facet["Hitch_Rules"]['Woe']}, "key":window.T13NE.KeyGen(facet["Hitch_Rules"]['Woe'])}),
							);
				break;

				case "Resolved_Hitch":
				 content = window.T13NE.CE(window.T13NE.DescriptiveBox, {"className": css+'-resolved', "title":"Resolved Hitch", "data-type":{internal:facet["Resolved_Hitch"]}, "data-description":{internal:facet["Resolved_Text"]}, "key":window.T13NE.KeyGen(facet["Resolved_Hitch"]) }, null);
				break;
				case "Narrative_Moment":
				 content = window.T13NE.CE(window.T13NE.DescriptiveBox, {"className": css+'-resolved', "title":"Narrative Moment", "data-type":{internal:facet["Narrative_Moment"]}, "data-description":{internal:facet["Narrative_Text"]}, "key":window.T13NE.KeyGen(facet["Narrative_Moment"]) }, null);
				break;
				case "FacetAdjectives":
					content=window.T13NE.CE(window.T13NE.T13Table, {"className":css+"-adjectives", "data-data":facet["Facet_Adjectives"], "key":window.T13NE.KeyGen(facet["Facet_Adjectives"])});					
				break;
				case "Attack":
					content=window.T13NE.CE("section",{className:props.className+"-section "+css+" t13ne-attack", title:"Attack", "key":window.T13NE.KeyGen(facet.Attack)},
						window.T13NE.CE("header", {className:props.className+"-section-header t13ne-attack-header"}, "Attack: "+facet.Attack),
						window.T13NE.CE("main",{className:props.className+"-section-main t13ne-attack-main"}, 
							window.T13NE.CE(window.T13NE.Attacks.DisplayEmoji, {"className":css+"-text", "data-emojis":facet["Attack_Modes"]},null)),
						window.T13NE.CE("footer", {className:props.className+"-section-footer t13ne-attack-footer"}, facet["Attack_Text"]));					
				break;
				case "Hitch_Rules":
				case "Attack_Text":
				case "Attack_Modes":
					content=null;
				break;
				default:
					if (window.T13NE.Facets[face][aspect+'_Text']){
					 	content=window.T13NE.CE(window.T13NE.TextBox,{className:css+"-text-generic-"+aspect, title:title, "data-type":{internal:facet[aspect]}, "data-description":{internal: facet[aspect+"_Text"]}, "key":window.T13NE.KeyGen(facet[aspect])}, null);							
					}else{
						content=window.T13NE.CE(window.T13NE.TextBox,{className:css+"-generic-"+aspect, title:title, "data-description":{internal:facet[aspect]}, "key":window.T13NE.KeyGen(facet[aspect]) }, null);
					}
				break;
			}
		 }



		return (content);
	}
};


window.T13NE.Facet.Display = function (props){
	//console.log("facet.display",props);
	var facets=[];
	var ret=[];
	var mode=0;
	var facetInitials=[];
	if (props["data-mode"]){
		mode=props["data-mode"];
	}
	if (props["data-facets"]||props["data-facet"]){
		var fac=props["data-facets"];
		if (fac===undefined){fac=props["data-facet"];}
		if (fac=="All"||fac=="all"||fac=="*"||fac=="any"||fac=="Any"){fac="Awe, Burden, Craft, Dominion, Enigma, Fury, Gossamer, Heresy, Inertia, Jeer, Key, Liberty, Miasma, Nature, Orthodox, Phoenix, Quiet, Rook, Sin, Trial, Virtue, Wyrd, Yonder, Zeal";}
		switch (typeof(fac)){
			case "string":
			if (fac.indexOf(",")!==-1){
				facets=fac.split(",");
			}else if (fac.indexOf(" ")!==-1){
				facets=fac.split(" ");
			}else{
				facets[0] = fac;
			}
			facets=facets.filter(Boolean);
			break;
			case "object":
			 facets=Array.from(fac);
			break;
			default:
				facets[0]=fac;
			break;
		}		
		facets.forEach( function(element, index) {

			//console.log("foreach args",arguments);
			//console.log("element", element);
			//console.log("index", index);
			var facet=window.T13NE.Facet.getFacetNumber(element);
			//console.log("facet",facet);
			facetInitials[index]=window.T13NE.Facets[facet].FacetInitial;
			switch(mode){
			case "initial-only-list": ret =window.T13NE.CE("li",{"className":props.className+"-li", "key":window.T13NE.KeyGen(facet) + Math.random().toString(36).substr(2, 5)}, window.T13NE.CE(window.T13NE.Facet.AspectBox, {"className":props.className,"data-aspect":"FacetInitial", "data-facet":facet, "key":window.T13NE.KeyGen(13) }));
			break;
			case "initial-only": ret =window.T13NE.CE("span",{"className":props.className+"-span", "key":window.T13NE.KeyGen(facet) + Math.random().toString(36).substr(2, 5)}, window.T13NE.CE(window.T13NE.Facet.AspectBox, {"className":props.className,"data-aspect":"FacetInitial", "data-facet":facet, "key":window.T13NE.KeyGen(13) }));
			break;
			case "name-only-list": ret = window.T13NE.CE("li",{"className":props.className+"-li", "key":window.T13NE.KeyGen(facet) + Math.random().toString(36).substr(2, 5)},window.T13NE.CE(window.T13NE.Facet.AspectBox, {"className":props.className, "data-aspect": "FacetName", "data-facet":facet,"key":window.T13NE.KeyGen(13) }));
			break;
			case "name-only": ret = window.T13NE.CE("span",{"className":props.className+"-span", "key":window.T13NE.KeyGen(facet) + Math.random().toString(36).substr(2, 5)},window.T13NE.CE(window.T13NE.Facet.AspectBox, {"className":props.className, "data-aspect": "FacetName", "data-facet":facet,"key":window.T13NE.KeyGen(13) }));
			break;
			case "short":
			var asp=window.T13NE.Facets[facet];
				//console.log("asp",asp);
				var aspects=Object.entries(asp);
				//console.log("aspects",aspects);
				var aspect=aspects.map(function(val,ind){
					
					var key=val[0];
				//console.log("cardkey=",key);
					
					if (key.indexOf("_Text")==-1 && key!=="FacetIndex" && key!=="FacetInitial" && key!=="Suit" && key!=="Yang" &&key!=="Term" && key!=="FacetAdjectives"){
				//console.log("building for key",key);

						return (window.T13NE.CE(window.T13NE.Facet.AspectBox, {"className":props.className+"-facet-aspect t13ne-facet-aspect", "data-facet":facet, "data-aspect":key, "key":window.T13NE.KeyGen('aspectbox'+facet) }));
					}else{
						return null;
					}
					
				});
				//console.log("created facet aspect =",aspect);
				ret[index]=	window.T13NE.CE("div", {className:props.className+"-ul-li t13ne-","key":window.T13NE.KeyGen('aspect-list-item'+facet)},
						aspect.filter(function (ff){return ff!==null&&ff!==undefined;}))
				;

			break;
			case "ordeal":
				ret.push(window.T13NE.CE(window.T13NE.Facet.AspectBox,{className:props.className+"-ordeal", "key":window.T13NE.KeyGen("ordeal"), "data-facet":facet, "data-aspect":"Test" }));
			break;
			case "card":
			default:
				var asp=window.T13NE.Facets[facet];
				//console.log("asp",asp);
				var aspects=Object.entries(asp);
				//console.log("aspects",aspects);
				var aspect=aspects.map(function(val,ind){
					
					var key=val[0];
					var css =key.replace('_','-').toLowerCase();
				//console.log("cardkey=",key);
					
					if (key.indexOf("_Text")==-1 && key!=="FacetIndex" && key!=="FacetInitial" && key!=="Suit" && key!=="Yang" &&key!=="Term" && key!=="FacetAdjectives"){
				//console.log("building for key",key);
						return (window.T13NE.CE("li",{"className":props.className+"-li t13ne-"+css, "key":window.T13NE.KeyGen("card") },window.T13NE.CE(window.T13NE.Facet.AspectBox, {"className":props.className+"-facet-aspect t13ne-facet-aspect", "data-facet":facet, "data-aspect":key, "key":window.T13NE.KeyGen("cardaspect") })));
					}else{
						return null;
					}
					
				});
				//console.log("created facet aspect =",aspect);
				ret[index]=window.T13NE.CE("li",{"className":props.className+"-li","key":window.T13NE.KeyGen("list-item")},
					
					window.T13NE.CE("ul",{"className":props.className+"-ul ", "key":window.T13NE.KeyGen("list") },
						//window.T13NE.CE("li", {className:props.className+"-ul-li t13ne-","key":window.T13NE.KeyGen(13) +'-2-'+ Math.random().toString(36).substr(2, 8)},
						aspect.filter(function (ff){return ff!==null&&ff!==undefined;})
						//)
				));

			break;
			
		}
		});
		
	} 
	switch (mode){
		case "card":
			var facetText=facetInitials.length==1?"Facet: "+facetInitials[0]: "Facets: "+facetInitials.join(", ");
			return window.T13NE.CE("article", {className:props.className+"-article t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen("cards") }, window.T13NE.CE("figure",{className:props.className+"-figure"},window.T13NE.FacetIcon(props)), window.T13NE.CE("figcaption",{className:props.className+"-figure-figcaption"}, facetText),		
			window.T13NE.CE("main",{className:props.className+"-main t13ne-tooltip","key":window.T13NE.KeyGen("maincards") }, 
			window.T13NE.CE("ul", {className:props.className+"-facet-list t13ne-facets","key":window.T13NE.KeyGen("maincards list") },ret.filter(function(ff){return ff!==null&&ff!==undefined;}))));
			break;
		case "ordeal":
			return ret.filter(function(ff){return ff!==null&&ff!==undefined;});
			case "short":
				return window.T13NE.CE("section", {className:props.className+"-section", "tabIndex":0,"key":window.T13NE.KeyGen("shortsection") }, 		
				window.T13NE.CE("main",{className:props.className+"-main", key:window.T13NE.KeyGen("shortmain")}, 
				window.T13NE.CE("div", {className:props.className+"-facet t13ne-facets","key":window.T13NE.KeyGen("shortdiv") },ret.filter(function(ff){return ff!==null&&ff!==undefined;}))));
				break;
			default:
				return window.T13NE.CE("article", {className:props.className+"-article", "tabIndex":0,"key":window.T13NE.KeyGen("article") }, 		
				window.T13NE.CE("main",{className:props.className+"-main"}, 
				window.T13NE.CE("ul", {className:props.className+"-facet-list t13ne-facets","key":window.T13NE.KeyGen("listing") },ret.filter(function(ff){return ff!==null&&ff!==undefined;}))));
			break;
	}
}


window.T13NE.FacetShort = class extends window.T13NE.Component{
	constructor(props){
		super(props);
		console.log("facetshort",props);
		this.state={
			facet: props["data-facet"]?props["data-facet"]: props["data-facets"]?props["data-facets"]:0
		};
	}
	render(){
		var facets=[];
		var ret =[];
		var fac =this.state.facet;
		switch (typeof(fac)){
			case "string":
			if (fac.indexOf(",")!==-1){
				facets=fac.split(",");
			}
			if (fac.indexOf(" ")!==-1){
				facets=fac.split(" ");
			}
			if (facets.length>0){
				facets=facets.filter(Boolean);
			}else{
				facets[0]=parseInt(fac);
			}
			break;
			case "number":
			facets[0]=fac;
			case "object":
			 facets=Array.from(fac);
			break;
			default:
				facets[0]=fac;
			break;
		}		
		facets.forEach( function(fel, index) {
			if (fel!=="any"&&fel!=="any "&&fel!=="all"&&fel!=="all "){
				//console.log("shortFacet: ",fel, index);
				var facet=window.T13NE.Facet.getFacetNumber(fel);
				if (facet!==null){
					//console.log("facetshort====>",facet);
					ret[index] = window.T13NE.CE("details",{className:this.props.className+"-facet-details t13ne-facet-short", "data-facet":facet},
						window.T13NE.CE("summary", {className:this.props.className+"facet-summary"}, window.T13NE.Facets[facet].FacetInitial),
						window.T13NE.CE(window.T13NE.Facet.Display,{className:this.props.className+"-facet-display", "data-facets":fel, "data-facet":window.T13NE.Facets[facet].FacetName, "data-mode":"short"}, null)
					);
				}
			}
		},this);
		return ret;
	}
	
}

jQuery(document).ready(function($){
	console.log('Facets DOM ready');

	$( '[id^=facetrewritebox-]' ).each(function( index ) {
		var elid=$(this).attr('id'); 
		console.log(elid);
		var elidom=document.getElementById(elid);
		//console.log(elidom.attributes);
		attribs= {className:elidom.attributes.class?elidon.attributes.class.value:"facet-box" ,
			"id":elidom.attributes.id.value,
			"data-mode" : elidom.attributes["data-mode"].value,
	        "data-facet": elidom.attributes["data-facet"].value,
		};
	
		console.log("attributes",  elidom.attributes);
		console.log("replacing",elid);
		window.T13NE.Render(window.T13NE.CE(window.T13NE.FacetShort, attribs, null), elidom );
		//$(this).html(hyper.renderToText()); 
	});

});



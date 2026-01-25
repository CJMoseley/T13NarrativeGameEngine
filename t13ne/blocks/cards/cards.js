
if (!window.T13NE) {
  var T13NE = {};
}

  window.T13NE.CardList= Array.from(window.T13NE.Cards).map(function (card,index,x){
          if ((card.Suit!==undefined)&&(card.Card!==undefined)){
             return ({label:card.Card+" of "+ window.T13NE.Suits[card.Suit]["Suit"], value:index});
          }else{
            return null;
          }
          });
window.T13NE.CardsOnTable=0; //used to give each card a unique id.
window.T13NE.CardDraw=function(numberOfCards){
	var drawn = [];
	if (window.T13NE.Deck!==undefined){
		if (window.T13NE.Deck.length<numberOfCards){
			for (i=0;i<numberOfCards;i++){
				drawn[drawn.length]=window.T13NE.Deck.pop();
			}
		}else{
			window.T13NE.OrdealOutOfCards();
		}
	}
	
	
}
  
 //components::

window.T13NE.CardsNPC =function(props){
			
			//console.log("CardsNPC initial",props);
			var tcard=window.T13NE.Cards[props["data-t13necard"]]
			tcard=tcard.Yarn.NPC;
			return (
				window.T13NE.CE("div", {className: props.className+"-div t13ne-card-yarn-npc",  "tabIndex":0,"key":window.T13NE.KeyGen(tcard["Archetype"])}, 
					window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-desc t13ne-archetype", "title": "NPC Archetype", "data-type":{internal:tcard["Archetype"]}, "data-description": {internal:tcard["Description"]}}, null),
					window.T13NE.CE(window.T13NE.Facet.AspectBox, {className:props.className+"-facet-box t13ne-archetype-persona", "data-aspect":"Persona", "data-facet":tcard["Persona"]},null),
					window.T13NE.CE(window.T13NE.Facet.AspectBox, {className:props.className+"-titled t13ne-archetype-core", "data-aspect":"Core", "data-facet":tcard["Core"]},null),
					window.T13NE.CE(window.T13NE.Facet.AspectBox, {className:props.className+"-titled t13ne-archetype-hitch","title":"Hitch", "data-aspect":"Hitch", "data-facet":tcard["Hitch"]},null),
				)
				);
		
		/*	//NPC: {
          Archetype: "Spy",
          Persona: 23,
          Core: 8,
          Hitch: 17,
          Description:
            "The Spy may be a foreign agent, or could just be the curtain-twitcher down the street."
        },
		}*/
};
window.T13NE.CardsRevelation =function(props){
		/*"Revelations":{
			"About":"Magical \/ Divine Influences",
			"About_Description":"Gods and magicians walk amongst us, at least in the Omniverse they do. The gods have great power, but are often limited in how they can apply it, magicians are not so restricted, but don't have as much power. Anyway this card allows you to reveal something about how these mages and gods are reacting to events in the Story.",
			"Info":"Player Decides",
			"Info_Description":"So there's something the Players would really want to know (like who is out to kill them, and why, and what they need to do about it, but then the Player's choose which one to know.",
			"Vector":"Direct",
			"Vector_Description":"Direct Revelations are where the Villain monologues his plan to the captured hero, demonstrates his super-weapon to the United Nations, or shape-shifts in front of the Characters for the first time. Confessions, suicide notes, scientific papers, mission logs and journal and press conferences can all be Direct Revelations too. I'm sure you can think of others.",
			"Alternate":"Story",
			"Alternate_Description":"The information contains the entire story, within the story (or play within the play), if anyone can see.",
			"Detail":"Haphazard",
			"Detail_Description":"A random collection of lies and truths that weirdly seem to tie into each other."}*/
		//console.log("CardsRevelation initial",props);
		var tcard=window.T13NE.Cards[props["data-t13necard"]];
		var revs=tcard.Yarn.Revelations;
		//console.log("CardsRevelation render",revs);
		var ret=[window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-about", title:"About", "data-type":{internal:revs.About}, "data-description":{internal:revs["About_Description"]}, "tabIndex":0,"key":window.T13NE.KeyGen(revs.About),}, null),
		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-info", title:"Information", "data-type":{internal:revs.Info}, "data-description":{internal:revs["Info_Description"]},"key":window.T13NE.KeyGen(revs.Info)}, null),
		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-vector", title:"Vector", "data-type":{internal:revs.Vector}, "data-description":{internal:revs["Vector_Description"]},"key":window.T13NE.KeyGen(revs.Vector)}, null),
		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-alt", title:"Alternate Information", "data-type":{internal:revs.Alternate}, "data-description":{internal:revs["Alternate_Description"]},"key":window.T13NE.KeyGen(revs.Alternate)}, null),
		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-details", title:"Detail", "data-type":{internal:revs.Detail}, "data-description":{internal:revs["Detail_Description"]},"key":window.T13NE.KeyGen(revs.Detail)}, null)];
		
		return(window.T13NE.CE("section",{className:props.className+"-section","key":window.T13NE.KeyGen("section"+revs.Info)}, 
			window.T13NE.CE("header", {className:props.className+"-header","key":window.T13NE.KeyGen("revs header"+revs.Info)}, "Revelations"),
			window.T13NE.CE("main", {className:props.className+"-main","key":window.T13NE.KeyGen("revsmain"+revs.Info)},ret)));
};
window.T13NE.CardsSocialAge = function (props){
	var tcard = window.T13NE.Cards[props["data-t13necard"]];
	var age = tcard.Age;
	return (window.T13NE.CE(window.T13NE.TextBox,{className:props.className+"-age", title:"Social Age ","data-type":{internal:age.Type},"data-description":{internal:age.Description}},age.Rules));
}
window.T13NE.CardsSignificator =function (props){
		/* props.className,
	props['data-t13necard']  Significator: {
          Plot:
            "The Scope Plot is a plot about investigation. Investigations can vary in type from genre and era, religious inquisitions, criminal investigations, scientific discoveries are all with in the scope of The Scope.",
          Character:
            "The Scope Significator indicates a Character that revels in watching and investigating. They Gain Yin when they make themselves comfortable, settle down, or adjust their position. They Gain Yang when they discuss events they have witnessed, take notes, or record information. They Gain Chi when they watch or observe an event, show, or process from beginning to end, focus on details or draw conclusions. They gain +1 Success Levels to all actions to do with sensing, recording, or understanding information.",
          Scene:
            "The Scope Scene is usually a Revelation, often where something is observed and revealed to the Characters (in extreme cases the villain will be monologue the Plot during a Scope Scene). Sometimes the Scope can be a Test of Senses or an Observation Ordeal (like a Stake-Out). Yarn-Tellers can play the card to pass any sensory Ordeal, or to gain a Revelation. They can also create Observation Ordeals for the target if they wish."
        },*/
        var tcard=window.T13NE.Cards[props["data-t13necard"]];
        var sig = tcard.Yarn.Significator;
    	//console.log("CardsSignigficator render");
    	return (window.T13NE.CE("div", {className:props.className+"-div", "tabIndex":0,"key":window.T13NE.KeyGen(1)}, 
    		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-plot", "title":"Plot Significator", "data-description":{internal:sig.Plot},"key":window.T13NE.KeyGen(sig.Plot)},null),
    		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-side", "title":"Side Significator", "data-description":{internal:sig.Side},"key":window.T13NE.KeyGen(sig.Side)},null),
    		window.T13NE.CE(window.T13NE.TextBox,{className:props.className+"-char", "title":"Character Significator", "data-description":{internal:sig.Character},"key":window.T13NE.KeyGen(sig.Character)}, null),
    		window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-scene", "title":"Scene Significator", "data-description":{internal:sig.Scene},"key":window.T13NE.KeyGen(sig.Scene)},null)
    		));
    
};
window.T13NE.CardsScene = function(props){
	
		// renders the scenes 
		var tcard=window.T13NE.Cards[props["data-t13necard"]].Yarn;
		return (window.T13NE.CE("div", {className:props.className+"-div", "tabIndex":0,"key":window.T13NE.KeyGen("div"+tcard['Snag'])},
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-scene", "title": "Scene Beat Type", "data-type": {internal:window.T13NE.SceneBeatTypes[tcard["Beat_Type"]].Type}, "data-description":{internal:window.T13NE.SceneBeatTypes[tcard["Beat_Type"]].Description},"key":window.T13NE.KeyGen(window.T13NE.SceneBeatTypes[tcard["Beat_Type"]].Type)},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-ce", "title": "Conflict Embodiment", "data-type": {internal:window.T13NE.ConflictEmbodiments[tcard["Conflict_Embodiment"]].Type}, "data-description":{internal:window.T13NE.ConflictEmbodiments[tcard['Conflict_Embodiment']].Description},"key":window.T13NE.KeyGen(window.T13NE.ConflictEmbodiments[tcard["Conflict_Embodiment"]].Type)},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-fe", "title": "Facet Embodiment", "data-type": {internal:window.T13NE.EmbodimentTypes[tcard["Facet_Embodiment"]].Type}, "data-description":{internal:window.T13NE.EmbodimentTypes[tcard['Facet_Embodiment']].Description},"key":window.T13NE.KeyGen(window.T13NE.EmbodimentTypes[tcard["Facet_Embodiment"]].Type)},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-hook", "title": "Hook", "data-type":{internal:tcard["Hook"]}, "data-description":{internal:tcard['Hook_Description']},"key":window.T13NE.KeyGen(tcard["Hook"])},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-ha", "title": "Hook Aspect", "data-type":{internal:tcard["Hook_Aspect"]}, "data-description":{internal:tcard['Aspect_Description']},"key":window.T13NE.KeyGen(tcard["Hook_Aspect"])},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-gain", "title":"Gain", "data-description":{internal:tcard["Gain"]},"key":window.T13NE.KeyGen(tcard["Gain"])}, null),
				window.T13NE.CE(window.T13NE.CardsRevelation, {"data-t13necard":props["data-t13necard"], className:props.className+"-rev","key":window.T13NE.KeyGen(tcard["Gain"]+"rev")},null)
				,window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-fray", "title": "Fray", "data-type":{internal:tcard["Fray"]}, "data-description":{internal:tcard['Fray_Description']},"key":window.T13NE.KeyGen(tcard["Fray"])},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-snag", "title": "Snag", "data-type":{internal:tcard["Snag"]}, "data-description":{internal:tcard['Snag_Description']},"key":window.T13NE.KeyGen(tcard["Snag"])},null),
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-sweeping", "title": "Sweeping", "data-type":{internal:tcard["Sweeping"]}, "data-description":{internal:tcard['Sweeping_Text']},"key":window.T13NE.KeyGen(tcard["Sweeping"])},null),
				));
	
	

};
window.T13NE.YarnIcon =  window.T13NE.CE("figure",{className:"t13ne-card-yarn-icon"},window.T13NE.CE("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512"}, window.T13NE.CE("polygon", { points: "256,512,0,256,256,0,512,256", fill: "currentColor", "fillOpacity": "0" }), window.T13NE.CE("g", { transform: "translate(0,0)" }, window.T13NE.CE("path", { d: "M332.04 27.759c-4.596 2.47-10.075 7.56-14.275 14.453-2.602 5.644-11.487 22.4-3.68 27.5 9.571 1.4 18.325-8.765 22.752-15.879 4.2-6.894 6.212-14.097 6.3-19.314.25-9.162-5.102-9.93-11.097-6.76zm-35.082 49.057c-17.085 22.447-30.962 44.18-45.3 64.636a1290.558 1290.558 0 0 0-35.102-24.556c-21.021-10.201-22.682-3.57-28.057.078 17.396 13.455 34.746 26.954 51.877 40.576l-10.354 14.775c-21.77-17.33-43.972-34.51-66.23-51.7a181.82 181.82 0 0 0-13.441 3.48c5.576 9.819 11.085 19.699 16.523 29.632 15.874 12.41 32.705 25.03 49.549 37.993l-10.442 14.898a5040.63 5040.63 0 0 0-18.484-14.2c8.628 16.656 17.002 33.46 25.057 50.409 20.13 13.193 44.62 31.66 62.4 44.44 3.916-.75 7.82-1.533 11.715-2.337l-18.424 21.84a767.571 767.571 0 0 1-25.52 4.08c2.098 5.112 4.148 10.24 6.174 15.375a899.026 899.026 0 0 0 137.143-28.658c5.08-7.527 6.204-14.563-1.344-20.562-28.95 9.639-58.497 17.842-88.736 24.341l19.406-22.945a814.417 814.417 0 0 0 28.172-7.504 944.014 944.014 0 0 0-12.02-11.593l11.653-13.78a940.439 940.439 0 0 1 19.992 19.51 875.505 875.505 0 0 0 18.436-5.963 182.274 182.274 0 0 0-4.067-15.088 1686.485 1686.485 0 0 0-18.842-16.808l67.805-80.17c-6.175-1.897-11.06-6.287-13.598-11.723l-55.459 65.746c-18.82-29.505-45.863-53.235-77.923-67.972L311.31 87.7c-6.206-1.37-11.54-5.817-14.352-10.884zm156.94 13.267c-4.9 1.797-11.044 6.058-16.176 12.29-3.37 5.216-14.532 20.556-7.528 26.704 9.276 2.736 19.38-6.087 24.768-12.504 5.132-6.231 8.138-13.077 8.963-18.23.825-5.153-.34-7.571-1.438-8.475-2.728-1.57-6.156-.662-8.59.215zm-320.524 40.723c-9.202-3.944-14.229-1.076-15.666 7.63 61.04 106.67 106.595 219.245 144.486 334.592 11.13 4.931 10.359-1.798 13.073-4.56-27.876-117.522-81.03-230.756-141.893-337.662zm143.127 6.564c27.765 20.66 54.483 42.173 80.338 64.383l-11.604 13.756c-25.474-21.888-51.767-43.07-79.064-63.399zm-174.16 10.447c-15.251-4.231-12.5 5.804-15.385 11.512 76.376 111.834 103.795 216.838 143.553 321.967 8.333 6.566 12.036 2.365 14.379-3.275-37.546-114.2-82.537-225.242-142.547-330.204zm152.117 21.004c26.123 21.061 51.575 42.484 75.68 64.586l-11.623 13.778c-23.597-21.658-48.62-42.759-74.416-63.582zm-181.01 2.662c-9.338-2.596-11.688 3.193-11.44 12.083 55.283 98.074 99.863 193.737 132.585 300.882 10.108 5.981 14.405 3.828 17.693-.463-39.185-104.242-66.175-205.338-138.838-312.502zm-23.406 27.44a182.045 182.045 0 0 0-22.596 48.787l40.008-17.041a2110.528 2110.528 0 0 0-17.412-31.746zm180.613 3.863c25.72 20.202 50.754 41.287 71.557 63.725l-11.715 13.89C270.68 258.862 246 238.05 220.192 217.716zM75.927 246.624l-53.412 22.75c-5.851 3.791-7.273 9.93-2.15 19.541l64.513-25.027a1802.274 1802.274 0 0 0-8.951-17.264zm151.459 28.426a1342.948 1342.948 0 0 1 8.146 18.674c4.905-.67 9.798-1.37 14.666-2.133-7.36-5.36-15.139-11.038-22.812-16.541zm-134.36 4.984l-40.375 15.662a758.774 758.774 0 0 0 49.996 3.977c-3.154-6.556-6.364-13.1-9.62-19.639zm-72.672 29.547c-1.801 5.343-5.821 10.118 1.733 17.072a917.72 917.72 0 0 0 96.285 6.766 1472.581 1472.581 0 0 0-7.057-15.416c-29.61-.99-59.907-3.728-90.96-8.422zm364.907 6.96a916.802 916.802 0 0 1-129.692 26.968 1126.15 1126.15 0 0 1 5.49 14.918c39.738-4.882 80.213-12.616 121.637-23.924 6.55-4.86 10.362-10.291 2.565-17.963zM25.845 345.238c-2.76 3.598-7.863 6.493 4.052 13.528 33.771 3.469 67.817 5.712 102.278 6.261a1381.957 1381.957 0 0 0-5.781-13.49 933.945 933.945 0 0 1-100.55-6.299zm351.783 9.233a874.569 874.569 0 0 1-57.195 12.877l47.392 17.822c9.683 3.145 30.587 11.951 29.406 20.983-2.359 13.928-27.517 11.142-34.53 21.632-1.93 3.205-2.83 7.536-2.182 11.524 18.943 40.217 75.27 45.85 114.746 46.886 15.587.961 10.116-14.706-1.11-15.016-24.701-3.81-85.094-6.218-90.271-29.144-2.465-15.017 32.627-16.775 32.57-31.993-.078-20.225-26.292-36.584-43.61-42.188a182.112 182.112 0 0 0 4.784-13.383zm-92.469 18.844a886.555 886.555 0 0 1-18.008 2.476c2.045 5.99 4.035 11.994 5.967 18.014l65.526 28.564c8.046-2.521 20.204-1.952 17.373-22.408zm-247.607 4.3a182.7 182.7 0 0 0 17.13 28.987l-.45-27.498c-5.57-.463-11.131-.957-16.68-1.489zm34.705 2.858l.783 47.773c2.852 16.181 11.086 16.074 19.26 16.893l.086-63.448c-6.727-.347-13.435-.76-20.13-1.218zm38.129 1.994l-.102 74.74c3.905 9.613 9.563 15.077 19.51 9.957l-1.48-84.203a1086.56 1086.56 0 0 1-17.928-.494zm36.244 18.256l1.285 73.234a182.304 182.304 0 0 0 26.596 6.229 1271.945 1271.945 0 0 0-27.881-79.463zm133.476 15.763a923.38 923.38 0 0 1 11.604 43.082 183.267 183.267 0 0 0 33.178-23.56z", fill: "currentColor", "fillOpacity": "1" }),window.T13NE.CE("figcaption",{className:"t13ne-card-yarn-caption"},"Yarn-Telling"))));
window.T13NE.CardsYarn = function(props){
		//console.log("CardsYarn Render",props);
		var tcard=window.T13NE.Cards[props["data-t13necard"]];
		var yarn=tcard.Yarn;

		return window.T13NE.CE("article", {className:props.className+"-article t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"article")},
		window.T13NE.YarnIcon, window.T13NE.CE("figcaption",{className:props.className+"-yarn-card","key":window.T13NE.KeyGen(yarn["Yarn_Name"])}, "Yarn: "+yarn["Yarn_Name"]),
		window.T13NE.CE("header",{className:props.className+"-header t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"head")}, 
			window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-descbox", "title":{internal:yarn["Yarn_Name"]}, "data-description":{internal:yarn["Yarn_Description"]},"key":window.T13NE.KeyGen(yarn["Yarn_Name"])}),
			),
			window.T13NE.CE("main",{className:props.className+"-main t13ne-tooltip","key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"main")}, 
			window.T13NE.CE(window.T13NE.CardsSignificator, {"data-t13necard":props["data-t13necard"], className:props.className+"-main","key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"sig")}, null),
			window.T13NE.CE(window.T13NE.CardsSocialAge,{"data-t13necard":props["data-t13necard"],className:props.className+"-main social-age","key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"age")},null),
window.T13NE.CE(window.T13NE.CardsScene,{"data-t13necard":props["data-t13necard"], className:props.className+"-scene","key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"scene")}, null)
			),
			window.T13NE.CE("footer",{className:props.className+"-footer t13ne-tooltip"},
				window.T13NE.CE(window.T13NE.CardsNPC, {"data-t13necard":props["data-t13necard"], className:props.className+"-yarn-main","key":window.T13NE.KeyGen(yarn["Yarn_Name"]+"npc")}, null),
			)
			); 
};

window.T13NE.TraumaIcon = window.T13NE.CE("figure",{className:"trauma-figure"},
	window.T13NE.CE("svg", { version:"1.1", viewBox:"0 0 512 512", xmlns:"http://www.w3.org/2000/svg" },
		window.T13NE.CE("path",{d:"M0 0h512v512H0z", fill:"#fff", "strokeWidth":"1.165"},null),
		 window.T13NE.CE("g",{transform:"translate(0 0)", stroke:"#fff", width:"100%", height:"100%"}, 
		 	
		 	window.T13NE.CE("path",{d:"M246.344 28.938c-89.18-.037-174.996 44.27-222.656 133 21.242 38.834 45.078 64.08 54.374 100v49.968C73.3 322.043 66 329.11 66 340.312c0 9.09 11.63 18.094 21.03 18.094 9.198 0 21.597-9.677 21.595-19.25 0-11.367-7.31-17.81-11.875-27.03v-32.282c16.002-32.16 81.357-9.403 105.844 45.625v80.592c-6.364 10.477-13.625 16.953-13.625 28.875 0 17.885 11.763 24.5 23.936 24.5 11.907 0 21.594-5.66 21.594-24.5 0-9.298-7.442-16.634-13.22-31.062V325.72c15.678-36.473 54.92-20.136 71.657 31.25v74.842c-5.41 10.498-11.718 19.456-11.718 32.313 0 12.927 10.045 22.188 21.03 22.188 10.744 0 22.188-9.728 22.188-23.344 0-14.448-7.098-23.414-12.813-34.564v-84.562h-.22c15.34-65.977 52.293-101.43 68.75-52.594v59.78c-4.457 8.957-9.56 17.375-9.56 29.595 0 13.944 9.553 23.938 18.686 23.938 9.338 0 18.095-9.543 18.095-22.782 0-10.83-4.347-19.014-8.53-27.56V284.31c19.988-69.842 66.447-87.325 90.31-122.375-61.083-88.583-153.632-132.963-242.81-133zm.437 22c81.74-.606 166.08 37.776 216.126 115.906-149.813 108.407-280.244 108.6-412.969-4.938 40.834-73.15 117.62-110.38 196.844-110.97zm4.69 16.03c-44.972 0-81.407 36.468-81.407 81.438s36.435 81.406 81.406 81.406c44.97 0 81.436-36.434 81.436-81.406 0-44.97-36.467-81.437-81.437-81.437zm-.532 49.063c16.13 0 29.187 13.06 29.187 29.19 0 16.13-13.057 29.218-29.188 29.218-16.13 0-29.218-13.09-29.218-29.22s13.087-29.187 29.218-29.187z", fill:"#f00", "strokeWidth":".665"},null)
			)	
	), window.T13NE.CE("figcaption", {className:"trauma-figcaption"},  "Trauma")
);

window.T13NE.CardsTrauma = function (props) {
	//console.log("CardsTrauma", props);
	var trauma=window.T13NE.Cards[props["data-t13necard"]].Trauma;
	return (window.T13NE.CE( "article", {className:props.className+"-trauma t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen("traumaarticle"+trauma.Type)}, 
  		window.T13NE.TraumaIcon,
			window.T13NE.CE("main", {className: props.className+"-main t13ne-tooltip t13ne-trauma", "tabIndex":0,"key":window.T13NE.KeyGen("maintrauma"+trauma.Type)}, 
				window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-desc t13ne-trauma", "title":{internal:"Trauma: "+trauma.Type}, "data-type":{internal:trauma.Description}, "data-description": {internal:trauma.Rules},"key":window.T13NE.KeyGen(trauma.Type)}, null),
			)
		)				
	);

};
window.T13NE.StressIcon = window.T13NE.CE("figure",{className:"stress-figure"},
	window.T13NE.CE("svg", { version:"1.1", viewBox:"0 0 146 140", xmlns:"http://www.w3.org/2000/svg" },
		 window.T13NE.CE("g",{transform:"translate(166 -24)", stroke:"#000", width:"100%", height:"100%"}, window.T13NE.CE("path",{d:"m-160.5 24.33h135.47v135.47h-135.47z", fill:"currentColor", "strokeWidth":"1.165"},null),window.T13NE.CE("path",{d:"m-156.16 28.968c3.5851 6.8465 34.169 34.272 36.004 35.398-4.1218-11.799-8.2437-23.599-12.365-35.398zm32.602 0c6.0275 10.972 12.055 21.944 18.082 32.916l-0.76914-32.916c-5.7711-1.76e-4 -11.542 3.52e-4 -17.313-2.64e-4zm26.582 0 6.0272 31.37 9.426-31.37zm24.722 0-4.3236 34.454 23.953-34.454zm28.121 0-19.621 41.879 34.454-26.276v-15.602zm-112.03 14.213v22.25c8.0556 3.3441 15.153 6.7649 23.68 10.306-7.1768-12.005-15.771-22.136-23.68-32.556zm126.86 12.212-24.722 26.268 24.722-8.6564c1.76e-4 -5.8705-3.52e-4 -11.741 2.64e-4 -17.611zm-82.6 15.735c-11.177 3.624-12.785 19.117-24.597 21.717-5.739 2.1614-16.178 5.4809-13.961 13.375 3.2445 6.6254 11.19 8.6039 15.718 14.119 6.3908 5.4169 12.633 11.008 19.11 16.323 0.68121 6.8234 2.3179 18.224 10.974 18.514 7.8197 0.0556 15.52 0.25526 23.455 0.173 7.7024 0.12098 9.0235-8.4399 10.254-14.209 2.9319-8.1558 11.112-12.37 17.247-17.852 6.54-4.7524 11.716-11.117 18.659-15.317 7.541-5.334-2.9973-9.4295-7.2264-11.959-6.0003-3.4971-12.112-6.8121-18.402-9.7614 1.7826-6.4435-8.301-16.113-13.103-9.7428-1.5044 6.61 3.2677 13.178 7.8262 17.554 4.3517 3.8569 15.273 6.9984 17.124 9.9415-4.8482 5.5539-19.632 9.4868-25.213 14.316-4.6174 3.3248-8.2174-0.13082-4.8833-6.2934 7.5268-12.697 4.718-32.368-9.1023-39.563-8.3332-3.3493-16.891 3.791-19.598 11.391-3.5423 8.3212-3.6562 18.131 0.94183 26.082 4.6418 7.5377 4.8302 11.791-2.4933 9.4997-6.4812-2.9348-16.733-13.557-23.966-15.17 1.4067-3.2337 10.766-8.1223 10.766-8.1223 7.1568-2.9439 10.291-11.095 12.335-18.017 1.0578-2.4695 0.22858-5.3415-1.8649-6.999zm16.164 15.47c0.47373 12.293-4.6684 5.0126-3.7483 0.34193 1.2532-0.0684 2.502-0.19743 3.7483-0.34193zm9.9886 0.20638c0.44341 9.2146-3.2036 8.148-3.9343-0.33936zm-6.8877 10.931c9.5743-0.85786 12.727 14.358 4.892 18.716-7.3466 4.104-16.274-4.0429-14.244-11.798 0.95289-4.1673 5.1349-7.1079 9.3521-6.9181z", fill:"#fff", "strokeWidth":".665"},null)
			)	
	), window.T13NE.CE("figcaption", {className:"stress-figcaption"},  "Stress ")
);
window.T13NE.CardsStress = function (props){
		var stress=window.T13NE.Cards[props["data-t13necard"]].Stress;
		
		return (
			window.T13NE.CE( "article", {className:props.className+"-stress t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen("stressarticle"+stress.Type)}, 
      		window.T13NE.StressIcon,
				window.T13NE.CE("main", {className: props.className+"-main t13ne-tooltip t13ne-stress", "tabIndex":0,"key":window.T13NE.KeyGen("mainstress"+stress.Type)}, 
					window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-desc t13ne-stress", "title":{internal:"Stress: "+stress.Type}, "data-type":{internal:stress.Description}, "data-description": {internal:stress.Rules},"key":window.T13NE.KeyGen(stress.Type)}, null),	
					)		
			
				)		
			);
};

window.T13NE.LeaIcon =   window.T13NE.CE("figure",{className:"lea-figure"},
 window.T13NE.CE("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512"}, window.T13NE.CE("polygon", { points: "256,512,0,256,256,0,512,256", fill: "currentColor", "fillOpacity": "0" }), window.T13NE.CE("g", { transform: "translate(0,0)"}, window.T13NE.CE("path", { d: "M314.78 19.47c-18.84 33-23.783 72.886 5.876 69.56 24.07-2.696 16.35-40.304-5.875-69.56zm-122.217 4c-17.095 33.8-19.95 73.854 9.5 69.218 23.9-3.764 14.227-40.983-9.5-69.22zm222.125 75.343c-21.958 30.365-30.705 69.304-.813 69.687 24.262.312 20.163-37.94.813-69.688zm-318.063 3.25C79.9 134.972 79 173.245 103.25 171.22c29.88-2.498 17.868-40.543-6.625-69.157zm217.594 8.374c-55.61 2.262-50.322 118.727 2.592 116.594 52.018-2.088 52.118-118.81-2.593-116.593zm-107.095 1.844c-.828.016-1.648.084-2.5.157-55.42 4.785-43.925 120.847 8.813 116.313 51.033-4.38 45.872-117.42-6.313-116.47zm-82.875 83.44c-1.612-.02-3.242.065-4.938.28-55.146 6.99-38.225 122.506 14.25 115.875 49.975-6.31 40.645-115.58-9.312-116.156zm278.625 1.343c-55.653-1.027-58.487 115.502-5.53 116.5 52.054.986 60.284-115.482 5.53-116.5zm-145 67.218c-57.02 1.258-12.988 60.186-113.78 94.44-78.123 26.548-30.808 106.533 36.06 106.81 36.702.154 49.8-28.817 79.845-28.686 34.116.144 36.844 26.134 86.78 26.344 63.76.263 100.665-80.2 27.72-107.532-92.875-34.798-54-90.786-113.813-91.375-.957-.008-1.907-.02-2.812 0z", fill: "currentColor", "fillOpacity": "1" }))), window.T13NE.CE("figcaption", {className:"lea-figcaption"}, "Lea"));

window.T13NE.CardsLea = function(props){
	
		////console.log("CardsLea initial");
	/*
      Lea: {
        PathColour: "Red/Purple Carnivore",
        Bulmas: "Hunters, Broccen, Vermis, Labyrinthine, All-Walkers",
        AnimalCategory: "Black paths and Migratory",
        Example: "Native Form \u2014 Dragon",
        Notes:
          "These paths open and close naturally through the Lea from time to time, they are easily walked by all Bulm\u00e4s, but Vermis and All-Walkers may walk them in Swarm or Dragon configurations."
      }*/
      	var leacard=window.T13NE.Cards[props["data-t13necard"]]["Lea"];
      	//console.log("CardsLea render");
      	return (window.T13NE.CE( "article", {className:props.className+"-lea t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen("leaarticle"+leacard['Bodypart'])}, 
      		window.T13NE.LeaIcon,
      		window.T13NE.CE("main", {className:props.className+"-main t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen("leacard"+leacard['Bodypart']) },
      			window.T13NE.CE(window.T13NE.TextBox, {className:props.className, "title":"Path Colour", "data-description":{internal:leacard['PathColour']},"key":window.T13NE.KeyGen(leacard['PathColour']) }, null),
      			window.T13NE.CE(window.T13NE.TextBox, {className:props.className, "title":"Open To", "data-description":{internal:leacard['Bulmas']},"key":window.T13NE.KeyGen(leacard['Bulmas'])}, null),
      			window.T13NE.CE(window.T13NE.TextBox, {className:props.className, "title":"Animal Category", "data-description":{internal:leacard['AnimalCategory']},"key":window.T13NE.KeyGen(leacard['AnimalCategory'])}, null),
      			window.T13NE.CE(window.T13NE.TextBox, {className:props.className, "title":"Example Animal", "data-description":{internal:leacard['Example']},"key":window.T13NE.KeyGen(leacard['Example'])}, null),
      			window.T13NE.CE(window.T13NE.TextBox, {className:props.className, "title":"Example Body-part", "data-description":{internal:leacard['Bodypart']},"key":window.T13NE.KeyGen(leacard['Bodypart'])}, null),
      			window.T13NE.CE(window.T13NE.TextBox, {className:props.className, "title":"Notes", "data-description":{internal:leacard['Notes']},"key":window.T13NE.KeyGen(leacard['Notes'])}, null))
 		));
    
};
window.T13NE.WyrdIcon = window.T13NE.CE("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512" }, window.T13NE.CE("polygon", { points: "256,512,0,256,256,0,512,256", fill: "currentColor", "fillOpacity": "0" }), window.T13NE.CE("g", { transform: "translate(0,0)"}, window.T13NE.CE("path", { d: "M247.79 18.734C137.967 17.596 19.874 96.94 19.73 244.53l21.403-51.395c-9.485 72.28-7.75 147.236 38.79 202.502L38.2 377.355c39.24 69.774 126.333 90.976 200.855 92.51C124.11 429.9 67.87 342.277 63.912 246.492c-6.722-211.78 260.658-217.694 340.78-75.77-3.417-19.492-8.623-38.426-15.618-56.11 77.406 89.155 59.293 214.875-21.29 253.036-24.25 3.95-48.93 12.06-60.954 19-58.548 33.802-6.27 126.536 53.225 92.188 9.44-5.45 23.404-17.303 36.494-31.352 64.36-59.52 98.1-118.24 93.108-188.94-6.52 29.1-19.175 57.904-35.623 84.683 63.158-146.822 7.956-263.89-144.838-301.354 12.097 5.835 23.503 13.63 33.873 23.36-57.415-23.752-131.123-22.62-186.884 3.505 28.066-26.2 64.776-43.73 102.2-49.642-3.52-.205-7.054-.325-10.597-.362zm-19.74 160.202l-19.843 100.566c-2.958 3.81-5.64 6.852-9.033 9.94l-25.688-49.096-22.705 11.93 31.37 60.945c4.48 11.474 10.02 20.68 15.162 28.524 28.063 42.803 64.547 35.252 95.303 9.555l87.28-48.452-12.71-22.498-66.136 36.94c-1.517-3.154-3.266-6.552-5.056-9.51l67.818-64.96-17.54-18.695-66.47 63.762c-2.356-2.318-4.238-4.527-6.765-6.54l45.084-78.085-22.733-13.127-45.864 78.297c-3.79-1.31-7.72-2.2-11.595-2.745l15.656-81.896-25.533-4.854z", fill: "currentColor", "fillOpacity": "1", stroke: "#888", "strokeOpacity": "1", "strokeWidth": "4" })));
window.T13NE.CardsWyrd = function(props){
	//console.log("CardsWyrd render: ",props);
	var wyrcard=window.T13NE.Cards[Number(props["data-t13necard"])]["Tarot"];
	////console.log("CardsWyrd render: ",wyrcard);
	return (
		window.T13NE.CE("article", {className:props.className+"-article t13ne-tooltip t13ne-wyrdtarot","key":window.T13NE.KeyGen(wyrcard.WyrdTarot+"art")}, 
			window.T13NE.CE("figure",{className:props.className+"-figure " , "tabIndex":0,"key":window.T13NE.KeyGen(wyrcard.WyrdTarot+"fig")}, 
				window.T13NE.WyrdIcon, window.T13NE.CE("figcaption", {className: props.className+"-figure-figcaption","key":window.T13NE.KeyGen(wyrcard.WyrdTarot+"caption")}, "Wyrd Tarot: "+ wyrcard.WyrdTarot)),
			window.T13NE.CE("main",{className:props.className+"-main t13ne-tooltip", "tabIndex":0,"key":window.T13NE.KeyGen(wyrcard.WyrdTarot+"main")},
			window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-normal t13ne-normal", "title":"Wyrd Tarot", "data-type":{internal:wyrcard.WyrdTarot},"data-description":{internal:wyrcard.Normal},"key":window.T13NE.KeyGen(wyrcard.WyrdTarot+"normal")}),
			window.T13NE.CE(window.T13NE.TextBox, {className:props.className+"-crossed t13ne-crossed", "title":"Wyrd Tarot (Crossed)", "data-type":{internal:wyrcard.WyrdTarot}, "data-description":{internal:wyrcard.Crossed},"key":window.T13NE.KeyGen(wyrcard.WyrdTarot+"crossed")})
		) ));
};
	
	/* Tarot: {
        WyrdTarot: "Spot Hidden",
        Normal:
          "+2 Success Levels (+38 Score) to all Target's tests to do with perception and senses while atop pile.",
        Crossed:
          "+2 Success Levels (+38 Score) to all Target's tests to do with hiding, sneaking, etc. while atop pile."
      },*/
window.T13NE.OrdealIcon =  window.T13NE.CE("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512"}, window.T13NE.CE("polygon", { points: "256,512,0,256,256,0,512,256", fill: "currentColor", "fillOpacity": "0" }), window.T13NE.CE("g", { transform: "translate(0,0)" }, window.T13NE.CE("path", { d: "M115.326 16.008l-6.607 6.687-84.652 85.69 5.59 6.53c10.402 12.15 29.93 23.87 51.26 30.993 10.664 3.562 21.715 5.826 32.377 5.492 5.407-.17 10.82-1.064 15.87-2.927 80.876 79.96 159.667 163.084 238.45 246.224-15.764 14.68-32.013 27.47-47.04 36.48 56.644 56.644 126.465 79.034 164.038 55.13 23.05-37.774 1.1-107.81-55.13-164.04-9.788 15.074-22.24 30.962-35.962 46.126L151.966 126.838c6.244-12.63 7.403-27.838 4.406-43.037-4.142-21.013-15.986-42.734-34.397-61.146l-6.647-6.646zm345.05.63c-32.676 47.53-70.88 89.537-116.368 124.258l-37.158-37.158c6.3-16.228 3.107-35.234-9.99-48.332-4.288-4.287-9.257-7.455-14.52-9.68 6.68 16.484 3.194 36.496-10.166 49.856s-32.888 16.36-49.373 9.68c2.225 5.262 5.397 10.234 9.682 14.52h.002c13.455 13.456 32.87 16.743 49.243 9.872l21.287 21.287c-15.632 18.116-31.658 35.568-48.014 52.503l20.088 20.088 48.916-48.915 13.215 13.215-48.917 48.916 18.748 18.748c16.877-16.2 34.298-32.163 52.495-48.02l21.9 21.9c-5.98 16.088-2.7 34.778 10.23 47.708 4.288 4.287 9.26 7.456 14.522 9.68-6.68-16.484-3.194-36.495 10.166-49.856 13.36-13.36 32.888-16.36 49.373-9.68-2.224-5.262-5.396-10.234-9.68-14.52h-.003c-13.62-13.62-33.345-16.814-49.842-9.606l-37.394-37.395c33.954-46.255 77.08-83.34 124.932-115.695l-33.37-33.373zM126.557 58.66c5.788 9.68 9.664 19.54 11.48 28.756 3.294 16.703.142 30.55-8.735 39.428-3.674 3.674-9.08 5.642-16.59 5.877-7.508.236-16.702-1.474-25.872-4.536-7.113-2.376-14.22-5.65-20.625-9.182l60.344-60.342zm79.075 193.522c-51.082 48.22-104.743 92.797-159.567 137.162L17.877 491.98l104.275-27.615c45.657-58.363 88.954-110.13 135.037-158.697-6.167-6.44-12.337-12.876-18.512-19.297L70.445 454.605 57.23 441.39 225.707 272.91c-6.684-6.924-13.376-13.835-20.076-20.73z", fill: "currentColor", "fillOpacity": "1" })));
window.T13NE.CardsOrdeal = function (props){
	
	//console.log ("ordeal props", props);
	var tcard=window.T13NE.Cards[props["data-t13necard"]];
	var ordcard=tcard.Ordeal;
	var facet =tcard.Facet;
	var obstacle = tcard.Obstacle;


	////console.log("CardsOrdeal render", ordcard);
	/* Ordeal: {
      Ordeal_Type: "Opposed Ordeal",
      Stages: "7",
      Ordeal_Spread: "Map-Hex",
      Stakes: "Blended Extreme-Soul",
      Test: "Communicate (Yonder)",
      Obstacles:
        "2 Obstacles in every Non-Court Stage, 3 in every Court Stage",
      Suggested_Action: "Talk",
      Stage: "Cliff Stunt",
      Stage_Description:
        "The route ahead is very dangerous, mists hide details, the moisture coated rocks are treacherous underfoot, you are high, over broken spires of mist-shrouded rock, clinging to rough foot and handholds that were carved long ago.",
      Motional: "Air Winged Flee",
      Motional_Description:
        "You may not know who is chasing you, or what they may do, if they catch up to your Hippogriff...",
      Fight: "Queen",
      Fight_Description:
        'Queens come in two main types, politically powerful women (who may have a flair for violence, dark magic, manipulation or poisoning) and matriarchs noted for their huge (and surprisingly often violent, monstrous, or c'
    }*/
	return(
		window.T13NE.CE("article", {className: props.className+"-div t13ne-tooltip t13ne-card-ordeals","key":window.T13NE.KeyGen(obstacle['Type']+"art")}, 
			window.T13NE.CE("figure", {className:props.className+"-fig ", "tabIndex":0,"key":window.T13NE.KeyGen(obstacle['Type']+"fig")}, window.T13NE.OrdealIcon, window.T13NE.CE("figcaption",{className:props.className+"-figcaption t13ne-ordeal-title","key":window.T13NE.KeyGen(obstacle['Type']+"capt")},"Ordeal")), 
			window.T13NE.CE("main", {className:props.className+"-main t13ne-tooltip"},					
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-ordeal-type t13ne-card-ordeal-type", "title":"Ordeal","data-type":"Ordeal Type", "data-description":{internal:ordcard["Ordeal_Type"]},"key":window.T13NE.KeyGen(obstacle['Type']+"ordealtype")}, null),
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-stages t13ne-ordeal-stage", "title":"Suggested Stages", "data-description":{internal:ordcard["Stages"]},"key":window.T13NE.KeyGen(obstacle['Type']+"stages")}, null),
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-spread t13ne-ordeal-spread", "title":"Ordeal Spread", "data-description":{internal:ordcard["Ordeal_Spread"]},"key":window.T13NE.KeyGen(obstacle['Type']+"spread")}, null),
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-stakes t13ne-stakes", "title":"Suggested Stakes", "data-description":{internal:ordcard["Stakes"]},"key":window.T13NE.KeyGen(obstacle['Type']+"stakes")}, null),
				
				window.T13NE.CE(window.T13NE.Facet.Display, {className: props.className+"-test t13ne-test", "title":"Suggested Test", "data-facet":facet, "data-mode":"ordeal","key":window.T13NE.KeyGen(obstacle['Type']+"test"),}, null),
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-obstacles t13ne-obstacles", "title":"Suggested Obstacles", "data-description":{internal:ordcard["Obstacles"]}, "key":window.T13NE.KeyGen(obstacle['Type']+"obstacles"),}, null),
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-obstacles t13ne-obstacle", "title":"Obstacle", "data-type":{internal:obstacle['Type']}, "data-description":{internal:obstacle['Description']}, "key":window.T13NE.KeyGen(obstacle['Type']),}, null),
				
				window.T13NE.CE(window.T13NE.TextBox, {className: props.className+"-action t13ne-action", "title":"Suggested Action", "data-description":{internal:ordcard["Suggested_Action"]},"key":window.T13NE.KeyGen(ordcard["Suggested_Action"]),}, null),
				window.T13NE.CE(window.T13NE.TextBox,{className:props.className+"-stage t13ne-ordeal-stage", "title":"Stage" ,"data-type":ordcard['Stage'], "data-description":{internal:ordcard["Stage_Description"]},"key":window.T13NE.KeyGen(ordcard['Stage'])},null),
				window.T13NE.CE(window.T13NE.TextBox,{className:props.className+"-motional t13ne-ordeal-motional", "title":"Motional Ordeal", "data-type":ordcard['Motional'], "data-description":{internal:ordcard["Motional_Description"]},"key":window.T13NE.KeyGen(ordcard['Motional'])}, null),
				window.T13NE.CE(window.T13NE.TextBox,{className:props.className+"-fight t13ne-ordeal-fight", "title":"Ordeal Fight", "data-type":ordcard['Fight'], "data-description":{internal:ordcard["Fight_Description"]},"key":window.T13NE.KeyGen(ordcard['Fight'])}),
				window.T13NE.CE(window.T13NE.TextBox,{className:props.className+"-fight t13ne-tide-of-battle", "title":"Tide Of Battle", "data-type":ordcard['Tide_of_Battle'], "data-description":{internal:ordcard["Tide_of_Battle_Text"]},"key":window.T13NE.KeyGen(ordcard['Tide_of_Battle'])}),

			)
		)
	);

};
window.T13NE.CardsDetails = class extends window.T13NE.Component{
	constructor (props){
		super(props);
		//console.log("CardsDetails initial",this.props);
		this.state={
			className:this.props.className,
			"t13card" : this.props['data-t13necard'],
			//"corner" : window.T13NE.Cards[this.props['data-t13necard']]['Card_Corner'],
			"t13ordeal":this.props['data-t13neordeal'],
			"t13yarn":this.props['data-t13neyarn'],
			"t13wyrd":this.props['data-t13newyrd'],
			"t13lea":this.props['data-t13nelea'],
			"t13stress":this.props['data-t13nestress'],
			"t13unicode":this.props['data-t13neunicode'],
		};
}/*Card_Corner: "Q",
      Card: "Queen",
      Suit: "4",
      Pips: "12",
      Unicode: "&#x1f0ad;",
      Svg: "images/cards-svg/QS.svg",
      Wound_Level: 5,
      Facet: "Key",
      Image: "",*/
		render (){
			////console.log("CardsDetails rendering",this.props);
			var tcard=window.T13NE.Cards[this.state.t13card];
			////console.log("tcard", tcard);
			var cardname = tcard.Card+" of "+ window.T13NE.Suits[tcard.Suit]["Suit"];
			var cardContents = {
				"unicode":(this.state.t13unicode)?window.T13NE.CE("span", {className:this.state.className+"-unicode t13ne-unicode-card", dangerouslySetInnerHTML:{__html:tcard.Unicode},"key":window.T13NE.KeyGen(tcard.Unicode)},null):null,
				"ordeal":(this.state.t13ordeal)?(window.T13NE.CE(window.T13NE.CardsOrdeal, {className:this.state.className+"-ordeal t13ne-card-details-ordeal","data-t13necard":this.state.t13card,"key":window.T13NE.KeyGen(tcard.Unicode+"ordeal")})):null,
				"yarn":(this.state.t13yarn)?(window.T13NE.CE(window.T13NE.CardsYarn, {className:this.state.className+"-yarn t13ne-card-details-yarn","data-t13necard":this.state.t13card,"key":window.T13NE.KeyGen(tcard.Unicode+"yarn")})):null,
				
				"wyrd":(this.state.t13wyrd)?(window.T13NE.CE(window.T13NE.CardsWyrd, {className:this.state.className+"-wyrd t13ne-card-details-wyrd","data-t13necard":this.state.t13card,"key":window.T13NE.KeyGen(tcard.Unicode+"wyrd")})):null,
				"lea":(this.state.t13lea)?(window.T13NE.CE(window.T13NE.CardsLea, {className:this.state.className+"-lea t13ne-card-details-lea","data-t13necard":this.state.t13card,"key":window.T13NE.KeyGen(tcard.Unicode+"lea")})):null,
				"stress":(this.state.t13stress)?(window.T13NE.CE(window.T13NE.CardsStress, {className:this.state.className+"-stress t13ne-card-details-stress","data-t13necard":this.state.t13card,"key":window.T13NE.KeyGen(tcard.Unicode+"stress")})):null,
				"trauma":(this.state.t13stress)?(window.T13NE.CE(window.T13NE.CardsTrauma, {className:this.state.className+"-trauma t13ne-card-details-trauma","data-t13necard":this.state.t13card,"key":window.T13NE.KeyGen(tcard.Unicode+"trauma")})):null,
				
				"facets":window.T13NE.CE(window.T13NE.Facet.Display, {className: this.state.className+"-facets t13ne-facets", "data-facets":tcard.Facet, "data-mode":"card","key":window.T13NE.KeyGen(tcard.Unicode+"facets")}, null),
				"corner":window.T13NE.CE("div", {className:this.state.className+"-div t13ne-card-corner","key":window.T13NE.KeyGen(tcard.Unicode+"corner")}, 
					window.T13NE.CE("span", { className: this.state.className + "-span", "title": cardname, "key": window.T13NE.KeyGen(tcard.Unicode + "cardname") }, 
	
						window.T13NE.CE(window.T13NE.Suits.DisplayBox, {className: this.state.className+"-suit t13ne-card-suit", "data-suit":tcard.Suit, "data-mode":"cardcorner","key":window.T13NE.KeyGen(tcard.Unicode+"cardcorner")}, tcard["Card_Corner"]))),
			};
			
			////console.log("cardContents",cardContents);
			return (
				window.T13NE.CE("figcaption", {className:this.state.className+"-figcaption t13ne-card-details","key":window.T13NE.KeyGen(tcard.Unicode+"caption")},
					cardContents["corner"],
					window.T13NE.CE(window.T13NE.TextBox, { className: this.state.className + "-div t13ne-card-pips", "title": "Pips (<abbr title=\"Penetration Bonus\">Pen</abbr>): ", "data-description": tcard.Pips + " (+" + window.T13NE.Boon.getBoonReduced(parseInt(tcard.Pips)) + ")", "key": window.T13NE.KeyGen(tcard.Unicode + "pips") }, null),
					window.T13NE.CE(window.T13TextBox, { className: this.state.className + "-div narrative-meaning", "title": "Narrative Meaning", "data-description":tcard.Narrative_Meaning}),
					cardContents["facets"],
					cardContents["unicode"],					
					window.T13NE.CE(window.T13NE.Wound, {className: this.state.className+"-wound", "data-t13newound-level":tcard["Wound_Level"],"key":window.T13NE.KeyGen(tcard.Unicode+"wound")},null),
					cardContents["yarn"],
					cardContents["age"],
					cardContents["wyrd"],
					cardContents["lea"],
					cardContents["ordeal"],
					cardContents['stress'],
					cardContents['trauma']
				)
			);
		};
	}
  //single cards
window.T13NE.T13CardIcon= window.T13NE.CE("svg", {"xmlns":"http://www.w3.org/2000/svg", viewBox:"0 0 512 512" },window.T13NE.CE("polygon", {points:"256,512,0,256,256,0,512,256", fill:"#32373c" ,"fillOpacity":"0"},null),
    window.T13NE.CE("g",null,
      window.T13NE.CE("path", {d:"M272.824 24.318c-14.929.312-25.66 3.246-32.767 8.446L142.898 84.91l-54.105 73.514C77.42 175.98 85.517 210 121.111 188.197l38.9-51.351c49.476-42.711 150.485-23.032 102.587 62.591-23.53 49.582-12.457 73.79 17.76 83.95l13.812-46.381c23.949-53.825 68.502-63.51 66.684-106.904l107.302 7.724-.865-112.045-194.467-1.463zm-54.09 103.338c-17.41-.3-34.486 6.898-46.92 17.375l-39.044 51.33c10.713 8.506 21.413 3.96 32.125-6.363 12.626 6.394 22.365-3.522 30.365-23.297 3.317-13.489 8.21-23.037 23.474-39.045zm-32.617 88.324a13.49 13.49 0 0 0-5.232 1.235L51.72 276.725c-6.784 3.13-9.763 11.202-6.633 17.992l85.27 185.08c3.131 6.783 11.204 9.779 18 6.635l129.15-59.504c6.796-3.137 9.776-11.198 6.646-18L198.871 223.86c-2.344-5.097-7.474-8.043-12.754-7.88z", fill:"#32373c", "fillOpacity":"1"},null),
      window.T13NE.CE("g", {transform:"translate(273,208)"}, 
          window.T13NE.CE("g", {transform:"translate(6.4, 6.4) scale(0.8, 0.8) rotate(0, 128, 128)"},
            window.T13NE.CE("circle" ,{cx:"128", cy:"128", r:"128", fill:"#32373c" ,"fillOpacity":"1"},null),
            window.T13NE.CE("circle", {stroke:"#fff", "strokeOpacity":"1", fill:"#32373c" ,"fillOpacity":"1", "strokeWidth":"18", cx:"128", cy:"128", r:"101"},null),
            window.T13NE.CE("path", {fill:"#fff", "fillOpacity":"1", "d":"M119 64v55H64v18h55v55h18v-55h55v-18h-55V64h-18z"},null)))
      ,window.T13NE.CE("g", {"fontFamily":"&quot;Times New Roman&quot;, Times, serif", "fontSize":"85", "fontStyle":"italic", "fontWeight":"bold", "textAnchor":"middle", transform:"translate(168,398)"},
        window.T13NE.CE("text", {stroke:"rgba(255, 255, 255, 0)", "strokeWidth":"21.25"},
          window.T13NE.CE("tspan",{x:"0", y:"0"},"T13")),
        window.T13NE.CE("text",{fill:"#32373c"},
          window.T13NE.CE("tspan",{x:"0", y:"0"},"T13")))));

  window.T13NE.T13Card = class extends window.T13NE.Component { 
    constructor (props){
		super(props);
		//console.log("T13Card initial props",this.props);
	//	//console.log("just in case props", props);
		//bindings
		this.onDragStart=this.onDragStart.bind(this);
		this.onDragOver=this.onDragOver.bind(this);
		this.onDrop=this.onDrop.bind(this);
		this.getCardNo=this.getCardNo.bind(this);
		this.getCard=this.getCard.bind(this);
		this.onClick=this.onClick.bind(this);
		this.onMouseOver=this.onMouseOver.bind(this);
		this.onMouseEnter=this.onMouseEnter.bind(this);
		this.onMouseLeave=this.onMouseLeave.bind(this);
		this.onTouchStart=this.onMouseEnter.bind(this);
		this.onTouchMove=this.onDragStart.bind(this);
		this.onTouchEnd=this.onDrop.bind(this);
		this.onTouchCancel=this.onDrop.bind(this);
		//intitialise state
		var thicard=-1;
		if (this.props['t13necard']=="random"||this.props['t13necard']===undefined){
			if (this.props.t13card===undefined){
				thicard=window.T13NE.CardDraw(1);
			}else{
				thicard=this.props.t13card;
			}
		}else{
			thicard=this.props['t13necard'];
		}
		////console.log("thicard=",thicard);
		this.state={"dragging":false,
		"currentCard":thicard,
		"faceup":this.props['data-t13nefaceup']?this.props['data-t13nefaceup']:"faceup"};

		////console.log("T13Card temp13card initial",this.getCard(this.props));
	}
	static defaultProps={
		"data-t13necard":"random",
		"data-t13nefaceup":"faceup",
		"data-t13neordeal":true,
		"data-t13neunicode":true,
		"data-t13nelea":true,
		"data-t13newyrd":true,
		"data-t13neyarn":true,
		"data-t13nestress":true,
	};
	componentDidMount(){
		//console.log("card mounted",this);
		if (!this.props["data-hydrate"]){
			var carte =ReactDOM.findDOMNode(this).outerHTML;
			window.T13NE.AddDB('card'+this.props.t13card, JSON.stringify(carte));
		}		
	}
	shouldComponentUpdate(nextProps, nextState) {
    if (this.props["data-t13necard"] !== nextProps["data-t13necard"]||this.state.faceup!==nextState.faceup||this.props.t13card!==nextProps.t13card||this.state.currentCard!==nextState.currentCard) {
      return true;
    } else {
      return false;
    }
  }

	getCardNo=function (props){
		//console.log("getCardNo(props)",props);
		var thiscard=-1;
		if (props["data-t13necard"]=="random"){
			if (props.t13card===undefined){
				if (this.state.currentCard>-1){
					thiscard=this.state.currentCard;
				}else{
					thiscard=window.T13NE.RNG(0,53,0);
					this.setState({"currentCard":thiscard});
				}
			}else{
				if (props.t13card>-1&&props.t13card<54){
					thiscard=props.t13card;
					this.setState({"currentCard":thiscard});
				}
			}
		}else{
			thiscard=props["data-t13necard"];
		}
		//console.log("returning thiscard", thiscard);
		return thiscard;
		
	}
	getCard=function(props){
		var t13nec=window.T13NE.Cards[this.getCardNo(props)]
		if (this.temp13card===undefined||this.temp13card.Unicode!==t13nec.Unicode){
			this.temp13card=t13nec;
		}
		return this.temp13card;
	}
	onClick=(ev,id) =>{
		
		////console.log("clicking", this.props.id);
		////console.log("event",ev);
		
		if (this.state.faceup=="faceup"){ev.target.focus();}
		else{ev.target.blur();this.setState({"faceup":(this.state.faceup=="facedown")?"faceup":"facedown"});}
	}
    onDragStart = (ev, id) => {
      ////console.log("dragstart:", id);
      ////console.log("dragstarted:", this.props.id);
      this.setState({"dragging":true});
      ev.dataTransfer.setData("id", id);
      return true;
    };

    onDragOver = (ev) => {
      ev.preventDefault();
      return false;
    };

    onDrop = (ev, msg) => {
    	//console.log("dropped cardno:", msg +'||'+ this.id);
    	this.setState({"dragging":false});
    	return true;
    };
    onMouseOver=(ev,id)=>{
    	//console.log("hovering over",ev.target);
    }
    onMouseEnter = (ev,id) => {
    	//ev.target.focus();
    	//console.log("onMouseEnter",ev.target);
    };
    onMouseLeave = (ev) =>{
    	//ev.target.blur();
    	//console.log("onMouseLeave",ev.target)
    }
    render(here){
    	//console.log("this.state",this.state);
    	this.temp13card=this.getCard(this.props);
    	//console.log("T13Card rendering temp13card",this.temp13card);
    	
    	this.csser="t13ne-card-figure draggable t13ne-card t13ne-cardwrap-"+(this.props["data-mode"]!==undefined?this.props["data-mode"]:"jsvg");
    	
    	this.details=window.T13NE.CE(window.T13NE.CardsDetails,{
	     			className:this.csser,
	     			"data-t13nelea": this.props["data-t13nelea"],
			        "data-t13necard" : this.state.currentCard,
			        "data-t13newyrd" : this.props["data-t13newyrd"],
			        "data-t13neyarn" : this.props["data-t13neyarn"],
			        "data-t13neordeal" : this.props["data-t13neordeal"],
			        "data-t13nestress": this.props["data-t13nestress"],
			        "data-t13nefaceup" : "faceup",
			        "data-t13neunicode":this.props["data-t13neunicode"]
			        ,"key":window.T13NE.KeyGen("cardwrap"+this.state.currentCard) +"-"+ Math.random().toString(36).substr(2, 7)+"-"+ Math.random().toString(36).substr(2, 7)}, null) ;
    	////console.log("details",this.details);
    	////console.log("csser ", this.csser);
	   	this.face=null;
	   	switch(this.state.faceup){
    			case "faceup":this.face=(window.T13NE.CE("figure",
	     		{
	     			"className" : this.csser,
			        "id" : this.props.id,
			        "data-mode" : (this.props["data-mode"]!==undefined)?this.props["data-mode"]:"jsvg",
			        "t13card":this.props.t13card,
			        "data-t13nelea": this.props["data-t13nelea"],
			        "data-t13necard" : this.state.currentCard,
			        "data-t13newyrd" : this.props["data-t13newyrd"],
			        "data-t13neyarn" : this.props["data-t13neyarn"],
			        "data-t13neordeal" : this.props["data-t13neordeal"],
			         "data-t13nestress": this.props["data-t13nestress"],
			        "data-t13nefaceup" : "faceup",
			        "data-t13neunicode":this.props["data-t13neunicode"],
			        "draggable" : true,
			        "onDragStart": this.onDragStart,
			        "onTouchMove": this.onDragState, 
			        "onTouchEnd":this.onDrop,
			        "onDrop":this.onDrop,
			        "onMouseOver":this.onMouseOver,
			        "onMouseEnter":this.onMouseEnter,
			        "onMouseLeave":this.onMouseLeave,
			        "onTouchStart":this.onMouseEnter,
			        "onClick":this.onClick,
			        "tabIndex":0,
			        "key":window.T13NE.KeyGen("faceup"+this.props.t13card) +"-"+ Math.random().toString(36).substr(2, 7)+"-"+ Math.random().toString(36).substr(2, 7),
			      
			    }, 
			    window.T13NE.CE("img", {"src":window.T13NE.t13url + this.temp13card['Svg'], className:"t13ne-svgcard",} ,null
	     		), this.details));
    			break;
    			case "facedown":this.face=(window.T13NE.CE("figure",
	     		{
	     			"className" :  this.csser,
			        "id" : this.props.id,
			        "data-mode" : "jsvg", 
			        "data-t13nefaceup" : "facedown",
			        "t13card":this.props.t13card,
			        "data-t13necard" :this.state.currentCard,
			        "data-t13newyrd" : false,
			        "data-t13neyarn" : false,
			        "data-t13neordeal" : false, 
			        "data-t13neunicode":false,
			        "data-t13nestress": false,
			        "draggable" : true,
			        "onDragStart": this.onDragStart, 
			        "onDrop":this.onDrop,
			        "onClick":this.onClick,
			        "onTouchStart":this.onClick,
			        "onTouchMove": this.onDragState, 
			        "onTouchEnd":this.onDrop,
			        "key":window.T13NE.KeyGen("facedown"+this.props.t13card) +"-"+ Math.random().toString(36).substr(2, 7)+"-"+ Math.random().toString(36).substr(2, 7),

			    }, 
			    window.T13NE.CE("img", {"src":window.T13NE.t13url+"images/cards-svg/cardback.svg", "className" : "t13ne-svgcard", 			        "key":window.T13NE.KeyGen("image") +"-"+ Math.random().toString(36).substr(2, 7)+"-"+ Math.random().toString(36).substr(2, 7),} , null),
	     		));
    			break;
    			default:
    			 this.face=null;
    			break;
    		}
    	//console.log("face",this.face);
    	if (here===undefined){
    		return this.face;
    	}else{
    		if (here=="toString"){
    			return window.wp.RawHTML(this.face);
    		}else{
    			var thisun=document.getElementById(thisun);
    			if (thisun){
    				window.T13NE.Render(this.face,thisun);
    				return null;
    			}
    			
    		}

    	}

    }
    renderToTable(here){
    	this.render(here);	
    }
    renderToText(){
    	return this.render("toString");
    }

  };
	    


//pool

//hand

//style reserves

//discard

//display cards

//draggable code

//suffling cards

//dealing cards

//drawing cards

//playing cards

//display card component

//card drop spot display.

//jquery hack to replace cards

window.T13NE.RedrawCard = function (elid){
	//console.log('card being redrawn', elid);
	var elidom=document.getElementById(elid);
	elidom.style.visibility="hidden";
	var card=elidom.attributes["t13card"].value;
	var redraw = this.offsetHeight;
	try {
		//console.log("card "+card+" not cached building from react")
		var qcard=window.T13NE.ReadDBtoDOM('card'+card,elid);
		/**/
		
	} catch(e){
		
		var carte = window.T13NE.CE(window.T13NE.T13Card, {className:elidom.attributes.class.value ,
			"id":elidom.attributes.id.value,
			"data-mode" : elidom.attributes["data-mode"].value,
	        "t13card":elidom.attributes["t13card"].value,
	        "data-t13nelea": elidom.attributes["data-t13nelea"].value,
	        "data-t13necard" :elidom.attributes["data-t13necard"].value,
	        "data-t13newyrd" : elidom.attributes["data-t13newyrd"].value,
	        "data-t13neyarn" : elidom.attributes["data-t13neyarn"].value,
	        "data-t13neordeal" : elidom.attributes["data-t13neordeal"].value,
	        "data-t13nestress": elidom.attributes["data-t13nestress"].value,
	        "data-t13nefaceup" : elidom.attributes["data-t13nefaceup"].value,
	        "data-hydrate": false
		}, null);
		
		var carte = window.T13NE.Render(carte, elidom );
	}
	elidom.style.visibility="visible";
	redraw = this.offsetHeight;
	//console.log('card redrawn', elid);
}

jQuery(document).ready(function($){
	console.log('Cards DOM ready');

	$( '[t13card]' ).each(function( index ) {
		var elid=$(this).attr('id'); 
		window.T13NE.CardsOnTable++;
		//console.log("card dealt"+window.T13NE.CardsOnTable);
		window.T13NE.RedrawCard(elid);
		
	});
	

});


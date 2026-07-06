//this may all be wrong now anyway... probably should be rebuilt around the new Knots/thresholds.

if (!window.T13NE){window.T13NE={};}
window.T13NE.LiteProfs={};
window.T13NE.LiteProfs.getDetails = function(thisun){
	var ret=[];
	window.T13NE.LiteBoons.forEach( function(lb, index) {
		if (thisun==lb['Profs']||thisun===lb['Type']||thisun===lb['Boon_Equivalent']||thisun===lb['Umbrals_Nimbeds']){
			ret = lb;
		}
	});
	return ret;
}
window.T13NE.LiteProf = class extends window.T13NE.Component{
	constructor(props){
		super(props);
		var liteboon = window.T13NE.LiteProfs.getDetails(this.props["data-lite-multiplier"]);
		//e.g. array('Profs'=>1,'Type'=>'Proficiency','Umbrals_Nimbeds'=>'U0:N0','Description'=>'The equivalent of a single Facet.','Boon_Equivalent'=>10, 'Card_Draw'=>1, 'Card_Play'=>1, 'RT'=>0, 'GRT'=>0),
		this.state = {
			"facet": this.props["data-facet"],
			"profid": this.props["data-prof-id"],
			"multiplier":liteboon['Profs'],
			"boon": liteboon['Boon_Equivilant'],
			"draw":liteboon['Card_Draw'],
			"play":liteboon['Card_Play'],
			"rt":liteboon['RT'],
			"grt":liteboon['GRT'],
		}
	}
	render(){
		return;
	}
};
window.T13NE.Annexes = {};
window.T13NE.Annexes.exampleAnnex={};
window.T13NE.Annexes.CalculateValue = function(annex){
	var value=0;
	if (annex.boon){
		value =window.T13NE.Boon.getBoonValue(annex.boon);
	}
	// array('Type'=>'Proficiency', 'Description'=>'A Proficiency (or Lite Annex)', 'Rules'=>'A Single Proficiency is the smallest mimetic unit about the Proficiency\'s subject. Two Proficiencies may be added during a Crisis to create a Skill. Or an additional Proficiency may be added to a Skill to create a Talent. Lite Characters just use Proficiency Annexes, which may increase one level when a Crisis occurs.', 'Minimum RT'=>0, 'GRT'=>0, 'Maximum_Cards_Played'=>1),//0
	// 		array('Type'=>'Skill', 'Description'=>'Two Proficiencies working together (usually with the Boons of a Character\'s or a Plot\'s Statblock of Facets). ', 'Rules'=>'Two Proficiencies add their respective Facet Values to find a Boon Value for the Skill. Characters may have as many Skill Annexes as their largest Hitch\'s Banes (Boon Reduced).', 'Minimum RT'=>0, 'GRT'=>0, 'Maximum_Cards_Played'=>1),//1
	// 		array('Type'=>'Talent', 'Description'=>'At least three Proficiencies working together. One of them must be acting as an Umbral.', 'Rules'=>'You may have as many additional Proficiencies in a Talent as your number of Hitches Reduced. Alternatively a Talent may have only one Umbral. A Character may have as many Talents as their Highest Hitch\'s Banes (Boon Reduced). Each Umbral Proficiency in the Talent allows up to 2 Nimbed Proficiency Slots (although you don\'t have to have any Nimbeds unless optional Rules would make it a Power.).', 'Minimum_RT'=>5, 'GRT'=>1, 'Maximum_Cards_Played'=>2),//2
	// 		array('Type'=>'Power', 'Description'=>'At least three, and normally around 5-6 Proficiencies in the same Annex. At least one of them is an Umbral.', 'Rules'=>'A Power may have one additional Proficiency for each Hitch the Character has. Optional Rule: A Power is a Talent with more than one Umbral Proficiency (Note this reduces the ability of Yarn-Tellers to best Powers with Talents). A Character may have as many Powers as their Personality Draw or Highest Hitch Ruins, as Ref decides.', 'Minimum RT'=>6, 'GRT'=>2, 'Maximum_Cards_Played'=>3),//3
	// 		array('Type'=>'Super-Annex', 'Description'=>'A Super-Annex is the most powerful of the Descendant Annexes. Any other Annex can be promoted to Super status (becoming a Super-Skill, Super-Talent or Super-Power as required).', 'Rules'=>'A Super Annex automatically adds Boons directly from Proficiency Facets and gains all the Nimbeds of any Facet that is providing Boons to the Annex. A Yarn-Teller (Solo/Fae/Greater Demon) may have 1 Super-Annex. Artefacts can also occasionally grant Super-Annexes to any Characters.', 'Minimum RT'=>11, 'GRT'=>3, 'Maximum_Cards_Played'=>4),//4
	// 		array('Type'=>'Pact', 'Description'=>'A Pact Annex is a seperate form of Annex that is created by groups of people working together. Each Member has some access to the Pact.', 'Rules'=>'A Pact Annex is not created with Proficiencies, but from the Size and Types of its membership.', 'Minimum RT'=>0, 'GRT'=>0, 'Maximum_Cards_Played'=>5),//5
	// 		array('Type'=>'Size', 'Description'=>'A Size Annex is simply the Master Annex of any Location Descendant.', 'Rules'=>'Size Annexes are not built from Proficiencies, but instead relate solely to the Size of the Location being described.', 'Minimum RT'=>16, 'GRT'=>4, 'Maximum_Cards_Played'=>5),//6
	// 		array('Type'=>'Personality', 'Description'=>'A Personality Annex is the Master Annex of any major Character (Extras use normal Annex equivalents for simplicity).', 'Rules'=>'Personality Annexes add Hitches, Personas and Cores to a Character. The Personality governs all other Annex useage.', 'Minimum RT'=>0, 'GRT'=>0, 'Maximum_Cards_Played'=>3),//7
	// 		array('Type'=>'Conflict', 'Description'=>'Conflicts are the Master Annexes of Plots. They can add Monster Facets to the Plot\'s Characters, and have direct effects on the Extras, Quests, Ordeals, etc.', 'Rules'=>'Conflicts add the Boons of their Conflict Facets directly together.', 'Minimum RT'=>0, 'GRT'=>0, 'Maximum_Cards_Played'=>6)//8
	switch(annex.Type){
		case 0:
		case "Proficiency":
		case "Prof":
		case "Lite":
			//lite boons and Profs
			var thisun = window.T13NE.LiteProfs.getDetails(annex.multiplier?annex.multiplier:annex.boon?annex.boon:1);
			value = window.T13NE.Boon.getBoonValue(thisun.Boon_Equivalent);
		break;
		case 1:
		case "Skill":
			//Skills based on statblock and profs, or set independently
			if (annex.statblockID){
				var stats= window.wp.data.select('t13ne/t13store').readStatBlock(annex.statblockID);
				if (stats!==-1&&stats!=="Pending"){
					console.log("stats for annex loaded", stats);
				}else{
					console.log("stats are pending or unloaded", stats);
				}
			}
			annex.profList.forEach()
		break;
		case 2:
		case "Talent":
			//talents  based on statblock and profs, or set independently
		break;
		case 3:
		case "Power":
		// power  based on statblock and profs, or set independently
		break;
		case 4:
		case "Super-Annex":
		// supers  based on statblock and profs, or set independently
		break;
		case 5:
		case "Pact":
		// pacts are based on a members list
		break;
		case 6:
		case "Size":
		// size annexes are just based on a given size or set independently
		break;
		case 7:
		case "Personality":
		// based on Hitches and Statblock Personas, Cores, Monster Facets, and Resolved Hitches
		break;
		case 8:
		case "Conflict":
		// based on a load of stuff from a list of Hooked Characters, or set independently.


	}

}
window.T13NE.Annexes.Profs={};

window.T13NE.Annexes.readProfList = function (profList, statblock, annexMode){
	var ret=[];
	var count = profList.length;
	
        
     
	for (var i=0;i<count;i++){
		var prof = profList[i];
		if (!prof.Facet){
			//do we have the facet of the Prof? No? Better try and get it
			if (prof.ID){
				var unsubscribe = wp.data.subscribe( () => {
          			console.log("readProfList:: subscription cycle",prof.ID);
          			updateFromStore(prof.ID);        
      			},this);
			}

		}else{
			if (prof.Boon&&annexMode!="char"){
				//we have a prof boon! this is what we are after...


			}else{
				//get it from the statblock
			}
		}
	}

}
window.T13NE.Annex = class extends window.T13NE.Component{
	constructor(props){
		super(props);
		var annex=JSON.parse(this.props["data-annex"]);
		if (annex.statblockID){
			
		}
		var value = annex.value ? annex.value: annex.boon ? window.T13NE.Boons.getBoonValue(annex.boon): annex.statblockID&&annex.Profs?window.T13NE.Annexes.CalculateValue(annex):0;
		this.state={
			"value": value,
			"annexType":annex.Type,
			"profList":annex.Profs?annex.Profs:[],
			"persona":annex.Persona?annex.Persona:"",
			"core": annex.Core?annex.Core:"",
			"hitchList": annex.HitchList?annex.HitchList:[],
			"description":annex.Description,
			"title":annex.Title,
			"boon": annex.boon?annexBoon:window.T13NE.Boons.getBoonReduced(annex.value, false),
			"draw":liteboon['Card_Draw'],
			"play":liteboon['Card_Play'],
			"rt":liteboon['RT'],
			"grt":liteboon['GRT'],

		};

	}
	render(){
		return null;
	}
}
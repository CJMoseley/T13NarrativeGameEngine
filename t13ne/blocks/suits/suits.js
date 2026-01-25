if (!window.T13NE){var T13NE={};}
if (!window.T13NE.Suits){
	window.T13NE.Suits=[{"Suit":"Wildcard","className":"t13ne-blackcard","Symbol":"<span class=\"t13ne-blackcard\">&#10033;<\/span>","Icon":"\u2731","Html":"&#10033;","Description":"Wild cards can pretend to be any Non-court card from any Suit, but always retain their own Pips.","Tarot_Text":"Wild, chaotic, dreamlike or insane","Ordeal_Trump":"Anything","Ordeal_Text":"Ordeal Types: Wild Ordeals should either take place far from civilization or should be beyond normal in scope or scale somehow.","Parry":{"Lucky Parry":"The Defender may discard all cards from the Attack, but both weapons take the Parry card as damage."},"Soak":{"Wild":"Wild Soak discards the entire attack, but draws one new card to pass through."}},{"Suit":"Diamonds","className":"t13ne-redcard","Symbol":"<span class=\"t13ne-redcard\">&diams;<\/span>","Icon":"\u2666","Html":"&diams;","Ordeal_Trump":"Preparation (Research \/ Work \/ Patience) \/ Movement (Sneaking \/ Sprinting) \/ Listening","Description":"Diamonds represent the finer things of life, they are bright and sparkling. Representing the creative even spiritual aspects of materialism such as beauty and art, that transcend base materialism like wealth. Despite this the Diamonds are recognised as being the Coins suit of the Tarot, with a strong tie to Elemental Earth.","Tarot_Text":"Travel, Money, Business, Contracts, Deals, Voyages.","Ordeal_Text":"Ordeal Types: Travel (e.g. Chase, Race) \/ Creativity (e.g. Smithing, Painting). Diamonds act as Trump for the following Action Types: Art, Building, Charming, Crafting, Driving, Emoting, Forgiving, Keeping Your Cool, Listening, Meditation, Motion, Prayer, Preparation, Research, Sprinting and Working in general. Any type of action can be prepared with a Diamond.","Parry":{"Seize the initiative":"The cards of the original attack (less the matched card) are immediately added to the Defender\u2019s Ordeal Pool. They may then play as many cards as their Descendant\/Annex normally plays including the Parry card (1-4) usually into one of their Style Reserve, and then immediately discard any cards over Pool Limit."},"Soak":{"Ready":"The matched Attack card is immediately Prepared by the Defender (as they wish). The Soak card is discarded."}},{"Suit":"Hearts","className":"t13ne-redcard","Symbol":"<span class=\"t13ne-redcard\">&hearts;<\/span>","Icon":"\u2665","Html":"&hearts;","Ordeal_Trump":"Healing (Survival \/ Magic) \/ Deception (Hide \/ Feint) \/ Magic (Positive) ","Description":"Hearts represent Love, Family and the comforts of home. Hearts are the warmth of a cosy fireplace, and social wealth rather than material. In the Tarot the suit is called Cups, and represents the feminine and elemental Water.","Tarot_Text":"Love, Relationships, Affections, Family, Sympathy, Peace.","Ordeal_Text":"Ordeal Types: Nurturing, Farming, Relationships, Medical. Hearts act as Trumps for the following Actions: Blending in, Cooking, Escaping, Healing, Hiding, Hunting, Insulting, Joke-telling, Lying, Magic, Mimicry, Riddling, Spinning a tale, Surgery, and Survival. Any type of Wound can be healed with a Heart.","Parry":{"Locked Respite":"All unmatched Cards from the original attack are Discarded by the Defender, however with each card they Discard they may either use the card to Heal\/Stabilise one of their own wounds (or damage to the Parrying Descendant), or they may use the card to slow their attacker with additional RT (Pips) or GRT (Pips\/5)."},"Soak":{"Disengage":"The Soak Card acts as a Heal card, and is discarded along with the Attack card. This immediately Heals all Wounds in play that have less Pips, including the remaining Wounds in the Attack, by one Wound Level (discards Distracts). "}},{"Suit":"Clubs","className":"t13ne-blackcard","Symbol":"<span class=\"t13ne-blackcard\">&clubs;<\/span>","Icon":"\u2663","Html":"&clubs;","Ordeal_Trump":"Defence \/ Trade \/ Control \/ Magic (Negative)","Description":"Clubs represent the power of politics and a stoic, blind materialism. Clubs can be seen as a dark corrupting force on the world, crass materialism, sin, magic and anger, but the club is also symbolic of protection, law and justice. In the Tarot the Clubs are called Staves or Wands, in some traditions they represent Intellectual Air, but in most they are Fire.","Tarot_Text":"Power, Fame, Politics, Ability, Money.","Ordeal_Text":"Ordeal Types: Wealth, Politics, Power. Clubs act as Trump for following Actions: Bartering, Controlling, Corrupting, Emotional-intensity, Guarding, Magic, Displaying might, Politics, Self-Defence, Socializing, and Trade Negotiations. Clubs can be used to defend any type of attack.","Parry":{"Disarm":"All the cards of the attack are immediately discarded, along with the Parry Card. The remaining cards of the Defender's Parry can now each be used to cause the Attacker to drop a Descendant (starting with the attacking weapon usually), can also cut armour straps, belts etc, or steal hats. This basically adds RT equal to the card Pips to the Annex that was used to attack. Every 5 Pips also creates a point of GRT for the Character (representing how much time the Character must spend picking up, or readying the weapon again. Court cards additionally may damage the Descendant that was disarmed, as standard for the Stakes."},"Soak":{"Ward":"The matched Attack card, and one other randomly selected Attack card are discarded."}},{"Suit":"Spades","className":"t13ne-blackcard","Symbol":"<span class=\"t13ne-blackcard\">&spades;<\/span>","Icon":"\u2660","Html":"&spades;","Description":"The Spades Suit is the suit of suffering, said to be good for the soul, but miserable for a Monday. Competition, perception, endurance and curiosity are positive aspects associated with the suit, but spades also represent destruction, betrayal, distance, might and death. In the tarot, the Suit is replaced with Swords, which (depending on the tradition) may represent either damaging Fire, or more commonly the cutting intellect of Air.","Tarot_Text":"Misfortune, Suffering, Loss, Mourning, Treachery, Betrayal, War, Lawsuit, Conflict.","Ordeal_Trump":"Attack \/ Perception \/ Penetration (Opening \/ Navigation \/ Logic)","Ordeal_Text":"Ordeal Types: Confrontation (e.g. Warfare, Lawsuit), Competition (Sports, Quizzes etc), Perception (Spot Hidden). Spades act as Trumps for the Following Action Types: Attacking, Balance, Climbing, Contagion, Desecration, Destruction, Feats of Strength, Lock-picking, Navigation, Perception (Search\/Spot), Staying power, and Stoicism. Spades can be used for any type of attack.","Parry":{"Redirect-Attack":"The damage from the original attack (less the Parried Card) is redirected by the Defender to the Attacker, their Descendants or their Allies."},"Soak":{"Counter-Attack":"The matched Attack card is reflected back at the Attacker, or their Descendant, as Narratively appropriate. "}}];
}
window.T13NE.Suits.getSuitNumber = function(suit){

	if (Number.isInteger(parseInt(suit))){
	
		return parseInt(suit);
	}else{
		if ( typeof suit === 'string' || suit instanceof String){
		
			for (var i=0;i<5;i++){
				
				suit=suit.toLowerCase();
				if (parseInt(suit)==i){return i;}else{
					var qs=window.T13NE.Suits[i];
					if (qs.Icon==suit||qs.Suit==suit||qs.Suit.toLowerCase()==suit.toLowerCase()||qs.Html==suit.toLowerCase()||qs.Symbol==suit.toLowerCase()){return i;}
				}
				
			}
		}
	}
}
window.T13NE.Suits.DisplayBox = class extends window.T13NE.Component{
	constructor(props){
		super(props);
		this.state={
			"className":this.props.className,
			"suit":window.T13NE.Suits.getSuitNumber(this.props["data-suit"]),
			"mode": this.props["data-mode"],
			"content":this.props.children,
		}
	}
	render(){
		//console.log("suit rendering state", this.state)
		var qs =window.T13NE.Suits[this.state.suit];
		
		//console.log("displaying suit",qs);
		
		var qe=[];
		for (var index in qs){
			//console.log("index",index);
			var value=qs[index];
			//console.log("value", value);
				var cass= index.toLowerCase().replace("_","-");
				var titl= index.replace("_"," ")+": ";

				if ( typeof value === 'string' || value instanceof String){
					qe[index] = window.T13NE.CE(window.T13NE.TitledBox, {"className":this.props.className+"-suit-"+cass, "title":titl, "data-boxtext":value},null);
				}else{
					if (typeof value ==='object'){
						//console.log("obj value", value);
						for (var indexa in value){
							//console.log("indexa",indexa);
							//console.log("value[indexa]", value[indexa]);
							qe[index] = window.T13NE.CE(window.T13NE.DescriptiveBox,{"className":this.props.className+"-suit-"+cass, "title":titl, "data-type":indexa.replace("_"," "), "data-description":value[indexa]},null);
						}
					}else{
						console.log("type of value thing:", typeof value);
					}
					
					
				}
				
				
			};
		//console.log("mapped qe",qe);
		switch (this.state.mode){
			case "cardcorner":
				return (window.T13NE.CE("section", {"className":this.state.className+"-section t13ne-tooltip"},
					window.T13NE.CE("span", {"className":this.state.className+"-span "+qs['className']},this.state.content),
					window.T13NE.CE("span", {"className":this.state.className+"-span "+qs['className'], dangerouslySetInnerHTML:{__html:qs['Html']}}, null),
					window.T13NE.CE("aside", {"className":this.state.className+"-aside t13ne-tooltip"},
						qe['Description'],
						qe['Tarot_Text'],
						qe['Ordeal_Trump'],
						qe['Ordeal_Text'],
						qe['Parry'],
						qe['Soak'] )));
			break;
			case undefined:
			default:
			
			return (window.T13NE.CE("details",{className:this.state.className+"-details"}, 
				window.T13NE.CE("summary", {className:this.state.className+"-summary "+qs["className"]}, qs['Icon']),
				qe['Description'],
				qe['Tarot_Text'],
				qe['Ordeal_Trump'],
				qe['Ordeal_Text'],
				qe['Parry'],
				qe['Soak']		
			));
			break;
		}
		return window.T13NE.CE("p", {}, "yeah something went very wrong there... ");
	}
}
/*"Hyper":"<!-- write suit--><span class=\"t13ne-symbol\"><span class=\"t13ne-blackcard\">&#10033;<\/span><\/span><details class=\"t13ne-suit\"><summary><\/summary><p class=\"t13ne-name\"><strong>Suit: <\/strong>Wildcard <span class=\"t13ne-blackcard\">&#10033;<\/span><\/p><p><strong>Ordeal Trump: <\/strong><span class=\"t13ne-trump\">Anything<\/span><\/p><p class=\"t13ne-desc\"><strong>Description: <\/strong>Wild cards can pretend to be any Suit.<\/p><p class=\"t13ne-tarot\"><strong>Tarot Meaning: <\/strong>Wild, chaotic, dreamlike or insane<\/p><p class=\"t13ne-otext\"><strong>Ordeal Text: <\/strong>Ordeal Types: Wild Ordeals should either take place far from civilization or should be beyond normal in scope or scale somehow.<\/p><p class=\"t13ne-parry\"><strong>Parry: <\/strong><strong>Lucky Parry:<\/strong> The Defender may discard all cards from the Attack, but both weapons take the Parry card as damage.<\/p><p class=\"t13ne-soak\"><strong>Soak: <\/strong><strong>Wild:<\/strong> Wild Soak discards the entire attack and the Soak\/Block cards, except for one randomly selected card that gains Penetration of +15.<\/p><\/details>*/
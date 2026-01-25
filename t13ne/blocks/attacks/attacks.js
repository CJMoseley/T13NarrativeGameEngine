if (!window.T13NE){var T13NE={};}
if (!window.T13NE.Attacks){
	     window.T13NE.Attacks={"Attack_Classes":[
      {
         "Mode":"\ud83d\udcb0",
         "Name":"Resource",
         "Text":"Damage is intended to be paid by a specific Facet Sway. The damage may be soaked  or dodged by appropriate defences, but are rare for Characters not focused on the Resource. Wounds are usually taken in a specific targeted Facet Sway (often Wealth, Health, or Support) or Yarn as Pips, with any excess taken as Yarn, so a 23 Pip Economic attack will cost the Target 23 Wealth or Yarn if they had no Wealth, if they had 13 Wealth, it would cost them that and 10 Yarn. It should be noted that Yarn is taken as Chi from the total that a Character has (e.g. a Character with 66 Chi losing 10 Yarn would have only 8 Chi left, but a Character with 45 Chi would lose everything). Resource Attacks may also Maim, Cripple or \"Destroy\" suitable Descendants and can create Hitches, etc if it the target does not have enough of the targeted Facet Sway \/ Chi.",
         "Active_Defences":"\ud83d\udc63\ud83d\udee1",
         "Passive_Defences":"\ud83d\udd32\ud83d\udc5f\u2614"
      },
      {
         "Mode":"\u26a1",
         "Name":"Energy ",
         "Text":"Energy attacks are blasts of radiation that are not entirely physical in nature. They might still have a physical impact, but the damage is usually radiation, or electrical burns and sensory overloads.",
         "Active_Defences":"\ud83d\udc63\ud83d\udee1",
         "Passive_Defences":"\ud83d\udd32\ud83d\udc5f\u2614"
      },
      {
         "Mode":"\u2b50",
         "Name":"Magic",
         "Text":"Magic may just be technology we don't understand, or it can be a mysterious force unknowable and frightening to the common man. Magic can parry magic, and so <em>sometimes<\/em> can silver or cold iron, it depends on the magic. Magic attacks are rarely dodge-able (and the few that are are usually actually spells that perform energy attacks), and usually ignore Range, but instead must pierce the target's Liberty or Wyrd Boon Reduced (-4 Pips as standard).",
         "Active_Defences":"\u2694\ud83d\udee1",
         "Passive_Defences":"\ud83d\udd32\ud83d\udc5f\u2614"
      },
      {
         "Mode":"\u2692",
         "Name":"Physical",
         "Text":"The simplest forms of wounding are nothing but bashing and cutting physical wounds. Physical attacks are usually performed with weapons (Prop Descendants) or Martial Arts Annexes, which means they can be blocked, parried and so on by another weapon or Martial Art.",
         "Active_Defences":"\u2694\ud83d\udc63\ud83d\udee1",
         "Passive_Defences":"\ud83d\udd32\ud83d\udc5f\u2614"
      },
      {
         "Mode":"\ud83d\udc64",
         "Name":"Psych",
         "Text":"Psych (pronounced 'Sigh-ck') attacks target the Target's mind and emotions &mdash; which means they are only useful on Characters (even if those Characters may be Intelligent Descendants or Extras). All Wounds are targeted on the Personality Annex (or Master Annex for an Intelligent Descendant \/ Extra).",
         "Active_Defences":"\ud83d\udd0d\ud83e\udd8b",
         "Passive_Defences":"\ud83d\udd32\ud83d\udcad"
      }
   ],
   "Defence_Modes":[
      {
         "Mode":"\ud83d\udc63",
         "Type":"Active",
         "Name":"Dodge",
         "Text":"Dodging is bending, running, or leaping out of the way of the attack, maybe you just dodge the blow, maybe you dive behind cover, it doesn't really matter.",
         "Rule":"<ul><li>All Physical and Energy Attacks that do not Splash can be dodged fully.<\/li><li>Dodging Splash Damage is possible with suitable cover, but Dodging Splash Damage only reduces it to a Distract at best.<\/li><li>To Dodge the attack beat the total Pips (including all cards, Range, Penetration, etc) dodged non-splash attacks are immediately discarded.<\/li><li>If you cannot dodge the whole attack, you may beat Dodge and Discard individual cards from the attack if you can beat them. E.g. An Attack of 3<span class=\"t13ne-blackcard\">&spades;<\/span>,J<span class=\"t13ne-redcard\">&diams;<\/span> has 5 Pips of Penetration, an A<span class=\"t13ne-blackcard\">&clubs;<\/span> cannot quite dodge the whole attack, but it can (just) Discard the Jack leaving a 3<span class=\"t13ne-blackcard\">&spades;<\/span> with +5 Pips of Penetration<\/li><\/ul>"
      },
      {
         "Mode":"\u2694",
         "Type":"Active",
         "Name":"Parry",
         "Text":"Deflecting the incoming blade with your own, also works with spears, hammers, maces, vibro-halberd, or spells, whatever really, except energy, you can't Parry lasers or electricity with a sword (blaster bolts on the other hand).",
         "Rule":"<ul><li>The Descendant or Annex draws Cards as normal, then plays One (1) card from their Pool.<\/li>\r\n            <li>If they can match any attack card in Suit (or Clubs &clubs; as Defence Trump) and Pips (including Additional Style and Penetration Pips, or additional Wound \/ Success Levels, or +2 Pips for Trumps) then the attack has been Parried (Wildcards automatically Parry).<\/li>\r\n            <li>What happens next depends upon the suit of the Defending card (see the Suit Parry details)<\/li><\/ul>"
      },
      {
         "Mode":"\ud83d\udee1",
         "Type":"Active",
         "Name":"Blocking",
         "Text":"Blocking is turning to put your best armour under an attack, or getting your shield in the way of a blow.",
         "Rule":"<ul><li>The Annex \/ Descendant draws as normal then Play the Defence's normal number of cards to attempt to block the Attack. E.g. When defending with a 3d6 Talent Armour Descendant the Character may Draw 3 and Play 2.<\/li><li>Compare the Block cards to the Attack cards. E.g. When attacked by 5,6,7 and 8 of Spades... Compare to Block cards of 7<span class=\"t13ne-blackcard\">&clubs;<\/span> and 4<span class=\"t13ne-redcard\">&diams;<\/span>.<\/li> <li>If any Block Card exactly matches in Pips <em><strong>and<\/strong><\/em> Suit (or is a Club <span class=\"t13ne-blackcard\">&clubs;<\/span>) any Attack card then a special Block takes place, based on the Suit of the Blocking card (see card suits Block details). If you can exactly match the Highest card in the Attack (including any extra Pips of Penetration, Style Reserve, etc) then the entire Attack may be Discarded. Wildcards automatically discard the whole attack, but draw another card as an attack. E.g. The 7<span class=\"t13ne-blackcard\">&clubs;<\/span> matches the 7<span class=\"t13ne-blackcard\">&spades;<\/span> (because it is a Club and the Trumps cancel). This causes a special Block based on a Club. This causes the 7 and one other random card to be discarded (by chance the 6).<\/li> <li>If any Block card is higher in Pips than an Attack card then the Attack card is Blocked and Discarded. However, the blocking Descendant immediately takes the Block card as damage. E.g. The 7 <span class=\"t13ne-blackcard\">clubs;<\/span> is higher in Pips than the 5 (and the 6 if it was still there) and so they are Blocked and Discarded. The Armour will take the 7<span class=\"t13ne-blackcard\">&clubs;<\/span> as damage however.<\/li> <li>If any Block card is lower in Pips than any remaining Attack card then the Attack card is Blocked and taken by the Armour Descendant (or whatever). In the case of a Blocking Annex or Rook Facet Block the Attack card is Discarded. The lower Block cards however now become Attack cards as the Attack passes through. E.g. The 4<span class=\"t13ne-redcard\">&diams;<\/span> is lower in Pips than all the cards in the attack. Therefore, everything that was left (the 8&spades;) is Blocked and taken by the Armour. The 4<span class=\"t13ne-redcard\">&diams;<\/span> now moves in a Soak-Layer as a potentially Soakable attack card. This results in the armour taking a 7 and an 8, and a 4 moving into the next layer of soak.<\/li> <li>The Attacker may add some (or all) of the Penetration Pips (if they have any) to increase the remaining Attack cards Pips at this point.<\/li> <\/ul>"
      },
      {
         "Mode":"\u2614",
         "Type":"Passive",
         "Name":"Soak",
         "Text":"Soaking is when you rely on layers of armour or natural toughness (Annex or Rook Facet) to cope with incoming Wounds. Characters can have varying numbers of Soak-Layers based on the Stakes (and their Descendants of course), and different Soak-Layers may have different Min Soak and Max Soak Pips.",
         "Rule":"<ul><li>The Character may Play a number of Soak cards from their Ordeal Pool equal to the normal Passive Play number of the Annex (normally 1 less than the Annex’s normal Play, but Passive Nimbeds can increase that value) to attempt to Soak an incoming Attack.<\/li><li>Compare the Soak cards to the Attack cards.<ul> <li>Soak-Layers can only Soak cards that are between their Minimum and Maximum Soak Pips (ignoring Penetration and Range modifiers, but not Trumps). If a card cannot be Soaked, it automatically passes through unaltered. This table governs standard Min and Max Soaks, although you can create them during item creation Ordeals, by assigning two Cards from your Ordeal Pool to set the Min and Max Soak. <div class=\"t13ne-tablewrap\"><table class=\"t13ne-table\"><tbody><tr><th>Type<\/th><th>Minimum Soak<\/th><th>Maximum Soak<\/th><\/tr> <tr><td>Facet \/ \"Saving Throw\" <\/td><td>5<\/td><td>10<\/td><\/tr> <tr><td>Skill <\/td><td>5<\/td><td>11<\/td><\/tr> <tr><td>Talent<\/td><td>5<\/td><td>13 (K)<\/td><\/tr> <tr><td>Power<\/td><td>5<\/td><td>15<\/td><\/tr> <tr><td>Super-Annex<\/td><td> 2<\/td><td>16+ (any)<\/td><\/tr> <tr><td>Mud \/ Clay \/ Foam<\/td><td>8<\/td><td>10<\/td><\/tr> <tr><td>Cloth\/Wool\/Fur Descendant<\/td><td>3<\/td><td>7<\/td><\/tr> <tr><td>Silk \/ Padding Descendant<\/td><td>2<\/td><td>8<\/td><\/tr> <tr><td>Leather Descendant<\/td><td>4<\/td><td>9<\/td><\/tr> <tr><td>Foam Plastic Descendant<\/td><td>3<\/td><td>8<\/td><\/tr> <tr><td>Hard Plastic Descendant<\/td><td>7<\/td><td>11 (J)<\/td><\/tr> <tr><td>Advanced Polymer Descendant<\/td><td>3<\/td> <td>14<\/td><\/tr><tr><td>Chainmail Descendant<\/td><td>9<\/td><td>13 (K)<\/td><\/tr> <tr><td>Thin Wood Descendant<\/td><td>4<\/td><td>7<\/td> <\/tr><tr><td>Thick Wood Descendant<\/td><td>3<\/td><td>11 (J)<\/td><\/tr> <tr><td>Laminated Wood Descendant<\/td><td>3<\/td><td>12<\/td><\/tr> <tr><td>Turtle Shell Armour<\/td><td>7<\/td><td>11 (J)<\/td><\/tr> <tr><td>Stone Armour<\/td><td>9<\/td><td>12 (Q)<\/td><\/tr> <tr><td>Bronze plate Descendant<\/td><td>8<\/td><td>12 (Q)<\/td><\/tr> <tr><td>Steel plate Descendant<\/td><td>6<\/td><td>14 (A)<\/td><\/tr> <tr><td>Orichalcum plate Descendant<\/td><td>5<\/td><td>15 (Joker)<\/td><\/tr> <tr><td>Vibro-field Descendant<\/td><td>4<\/td><td>10<\/td><\/tr> <tr><td>Power field Descendant<\/td><td>12 (Q)<\/td><td>15 (Joker)<\/td><\/tr> <tr><td>Force-field Descendant<\/td><td>8<\/td><td>15 (Joker)<\/td><\/tr> <tr><td>Toon\/Femite Descendant<\/td><td>6<\/td><td>16 (suited Ace)<\/td><\/tr> <tr><td>Nullite Descendant<\/td><td>4<\/td><td>16 (suited Ace)<\/td><\/tr> <tr><td>Magickal\/Alchemical Enhancement<\/td><td>-2 compared to normal<\/td><td>+2 compared to normal<\/td><\/tr> <\/tbody><\/table><\/div> <\/li> <li>If any Soak Card exactly matches in Pips and Suit any attacking card (including any Stalled cards on that Soak-Layer) then a special Soak takes place, based on the Suit of the Soaked cards. Special Soaks <strong>do not<\/strong> always automatically discard the whole attack.<\/li> <li>If any Soak card is higher in Pips than an Attack card (+2 Pips for Clubs), then the Attack cards are Stalled (turned sideways and automatically prepared as part of the next attack to that Soak-Layer unless a Defence Glow moves those Stalled cards to a Prepared Defence). The Soak card however, is Discarded.<\/li> <li>If any Soak card has less Pips than an Attack card then that Attack card is Soaked, and the Attack card is taken by the Descendant. A copy of the Soak card passes through the Soak-Layer, becoming an Attack card for the next Soak-Layer. So when attacked by a J&spades; and a 6<span class=\"t13ne-redcard\">&hearts;<\/span> if you play a 2<span class=\"t13ne-redcard\">&diams;<\/span> then both cards are Soaked and 2 &times; 2<span class=\"t13ne-redcard\">&diams;<\/span> pass through to the next Layer. A Character Annex, or Rook Facet used to Soak will instead Discard all cards, and take one Distract Wound for each Soaked Attack card.<\/li> <li>Note it is possible for a card to both pass in and be Discarded. If an attack of 4&clubs; 6<span class=\"t13ne-redcard\">&diams;<\/span> 10<span class=\"t13ne-redcard\">&diams;<\/span> and J<span class=\"t13ne-blackcard\">&spades;<\/span> is soaked by a 7<span class=\"t13ne-redcard\">&hearts;<\/span> then you will see the Soak Layer take the J<span class=\"t13ne-blackcard\">&spades;<\/span>, 10<span class=\"t13ne-redcard\">&diams;<\/span>, Stalls the 6<span class=\"t13ne-redcard\">&hearts;<\/span> and the 4<span class=\"t13ne-blackcard\">&clubs;<\/span> on the Soak-Layer, which Discards the 7<span class=\"t13ne-redcard\">&hearts;<\/span>, then two copies of the 7<span class=\"t13ne-redcard\">&hearts;<\/span> also pass on into the next layer of Soak.<\/li><\/ul><\/li> <li>The Attacker may add some (or all) of the Penetration Pips to increase the Attack cards Pips at this point as they move to the Next Layer.<\/li> <li>If a Soak-Layer is Crippled or Destroyed then all Stalled cards immediately move to attacking the next Soak-Layer in.<\/li><li>The Annex\/Descendant that formed that Passive Soak-Layer now typically Draws as many cards as it Played (or its own normal Draw, which ever is lower) and adds them to the Character’ Ordeal Pool before you move to the next Soak-Layer.<\/li><\/ul>"
      },
      {
         "Mode":"\ud83d\udd32",
         "Type":"Passive",
         "Name":"Prepared Defence",
         "Text":"When you play cards to Prepare a Defence you might be strapping on your armour, diving for cover, building a sandbag wall, raising a force-field, or just adjusting your already worn armour for maximum effectiveness.",
         "Rule":"Prepared defences must be prepared with Diamonds (<span class=\"t13ne-redcard\">&diams;<\/span>) or Clubs (<span class=\"t13ne-blackcard\">&clubs;<\/span>) as a Suitable Style Reserve and create a Pip Wall that must be worked through. <ul><li>The Pip Wall has a Score and a minimum and a maximum wound created by the largest and smallest cards used in the preparation e.g. Prepare an Ace of Diamonds (A<span class=\"t13ne-redcard\">&diams;<\/span>) with 16 Pips (+2 Preparation Trump) and a Ten of Clubs (<span class=\"t13ne-blackcard\">&clubs;<\/span>) with 12 Pips (+2 Defence Trump) and you are good against Crippling, Mortal and Carnage wounds for 28 Pips of Attacks.<\/li> <li>The defence stops all Cards within this range, as long as there are still any Pips left.<\/li> <li>Each attacking Card removes those Pips from the remaining Pip Score &mdash; e.g. If the defence prepared with a A<span class=\"t13ne-redcard\">&diams;<\/span> amd 10<span class=\"t13ne-blackcard\">&spades;<\/span> is attacked with a J<span class=\"t13ne-redcard\">&hearts;<\/span> that will remove 11 Pips from the Defence (leaving it with 17 Pips). If that attack was doubled somehow then there would only be 6 Pips left in the Defence.<\/li> <li>Once all Pips are spent, the Prepared Defence fails. A third attacking Jack would destroy the Defence.<\/li> <li>You can shore up defences that are not empty by Preparing more cards of Defence. These new cards add to the Pip total of the Prepared Defence, and may also expand the Maximum and Minimum Limits. E.g. Adding a 5<span class=\"t13ne-redcard\">&diams;<\/span> (+7), 7<span class=\"t13ne-blackcard\">&clubs;<\/span>(+9) and K<span class=\"t13ne-redcard\">&diams;<\/span> (+15) to the defence before it collapses creates a Defence good against Flesh to Carnage+ with 37 Pips of defence (it was on 6 remember).<\/li><\/ul>"
      },
      {
         "Mode":"\ud83d\udc5f",
         "Type":"Passive",
         "Name":"Passive Dodge",
         "Text":"T13 is an odd game and odd characters exist who bend the laws of physics for all sorts of reasons. The passive dodge (or it can be a Parry) is an example. Sometimes the Ref may even allow a character to build an active defence that triggers in Passive mode.",
         "Rule":"Handle mostly as the Active version, only Draw cards at the end not the beginning."
      },
      {
         "Mode":"\ud83d\udcad",
         "Type":"Passive Psych",
         "Name":"Passive Psych Soak ",
         "Text":"When someone yells an insult at you, it might sting, or it might not. If you see someone killed in front of you, it might scare you, or may not. You can decide which with a Passive Psych Soak.",
         "Rule":"<ul><li>Personality Annex Plays a number of Soak cards equal to number of Hitches Reduced (&half; to 4 Cards) from their Ordeal Pool.<\/li><li>If any Soak Card exactly matches in Pips and Suit (or Clubs &clubs;) any Attack Card then the Attack Card is discarded and the Defender may Pull and Play a 'Fight-or-Flight' Ordeal card. If a Soak card exactly matches the Highest Card of the Attack then the whole Attack is Discarded.<\/li> <li>If any Psych Soak card is higher in Pips than an Attack card, then those Attack cards are Blocked and Discarded immediately. The Soak card is then kept, but is turned sideways, Stalled. It will be added to the next Psych Attack automatically unless moved by a Defence Glow to a Prepared Defence. A card in this state is considered Stalled.<\/li><li>If any Psych Soak card has less Pips than an Attack card (or a Stalled card) then the Attack card is Soaked and immediately Discarded. The Defender takes a copy of the Soak card for each card Blocked. The Attacker may add some of the Penetration Pips to increase the Attack cards Pips at this point.<\/li><li>Psych Attacks that begin with more than 3 cards (such as most Tricks) always cause Extreme Emotional responses as well as the Normal Wound. All Psych Attacks must affect the Target's Active Personality Annex (or its Profs). Psych Attacks automatically Stack together whenever they can (2 Psych Distracts automatically become a Psych Flesh Wound).<\/li><li>Once the incoming attacks have been dealt with (or not) the Character may now Draw as many cards as they Played earlier to their Ordeal Pool. <\/li><\/ul> "
      },
      {
         "Mode":"\ud83d\udd0d",
         "Type":"Active Psych",
         "Name":"Focus",
         "Text":"Focus is a Psych Parry. The defender focuses on one aspect of the attack, and thereby turns it around on the attacker. They might retort to the attack, with a biting insult, or just refute one point so well that the attack is ruined, then again they might just react so badly to the attack that they effect the attacker back. The problem with Focus as a defence is that it requires specific cards to work at all.",
         "Rule":"<ul><li>Draw the number of Hitches Reduced, and add the cards to your Ordeal Pool. Then Play One Card.<\/li> <li>The card must match exactly one Attack card's Pips and Suit &mdash; Jokers may be Wild. Clubs will Trump with +2 Pips, which means an 8<span class=\"t13ne-redcard\">&hearts;<\/span> can be matched by a 6<span class=\"t13ne-blackcard\">&clubs;<\/span>,7<span class=\"t13ne-redcard\">&clubs;<\/span>, or 8<span class=\"t13ne-redcard\">&clubs;<\/span>).<\/li> <li>If they can match an Attack card, then the Attack has been stopped. Discard the matched Attack card and all Attack cards Higher than the Focus card.<\/li> <li>Attack cards lower than the Focus card are immediately added to the Defender's Ordeal Pool as \"Fight-or-Flight\" cards that may be immediately played or prepared without RT or GRT penalties.<\/li> <li>If no match can be made then Focus has failed. The Defender takes the full effect of the Attack as Focus has been used the Personality Annex cannot now Soak.<\/li><ul>"
      },
      {
         "Mode":"\ud83e\udd8b",
         "Type":"Active Psych",
         "Name":"Ignore",
         "Text":"Ignoring a Psych attack is a great choice, if you can. However Ignoring is an all or nothing defence.",
         "Rule":"<ul> <li>Draw number of Hitches Reduced cards and add them to the Defender's Ordeal Pool.<\/li> <li>Play the same number of cards to try and Ignore the Psych Attack.<\/li> <li>Ignore cards must beat the total Pips of the Attack. Beat the Pips and the Attack is Discarded. Otherwise the Defender takes all the Psych Damage and since they used their Personality Annex to Ignore, they cannot use it to Psych Soak.<\/li> <\/ul>"
      }
   ],
   "Damage_Types":[
      {
         "Mode":"\ud83d\udd2b",
         "Name":"Normal",
         "Text":"The Standard against which other Attacks are measured. Everything is standard, no weird rules.",
         "Rules":"No Special Rules."
      },
      {
         "Mode":"\ud83d\udca6",
         "Name":"Splash",
         "Text":"The Attack affects multiple targets, but a bit less than what it says on the Card.",
         "Rules":"Splash Damage affects multiple targets as well as the first. The Splash Damage is -1 Wound Level from the Limit (so a Flesh will splash Distracts). The Splash radius is equal to the Pips of the Limit Card as a Range in the Action Space. Additional Pips may still pay for additional targets +3 for each full target, +1 for each Splash target."
      },
      {
         "Mode":"\ud83d\udd25",
         "Name":"Destructive",
         "Text":"Destructive Attacks have some thing they are just better at affecting, this reflects how hacks can really mess up computers and data, crashes can really destroy vehicles as well as computers and delicate things generally, and nothing flammable likes burning.",
         "Rules":"All attacks against a suitable target (Referee decides) increase each cards Wound Limit Level +1. The new Wound Limit will require additional Pips to actually raise the Wound to that higher Limit in the current Stakes."
      },
      {
         "Mode":"\ud83c\udf19",
         "Name":"Waning",
         "Text":"Waning attacks are diminished, and fading, but like the moon, they never really go away.",
         "Rules":"All Waning Wounds are one Level lower than the card Limit suggests, however they can never  be below the Distract Level. Waning Wounds will always remain at least a Distract, even after Soak-Levels or Chi expenditure. The Waning Wound can never be completely cancelled by a Defence and a Distract will be passed in to the Target."
      },
      {
         "Mode":"\ud83d\udde1",
         "Name":"Penetrates",
         "Text":"Some attacks cut deeper than others. They penetrate, making the attack harder to block, soak and be stopped by armour.",
         "Rules":"Penetration adds the Cards Pips Reduced as Penetration Pips. <ul><li>Penetration Pips add directly to card Pips of the card whenever the Attacker wants during the Soak process, but are each usable only once.<\/li> <li>Against Prepared Defences \ud83d\udd32 Penetration Pips can be used to bypass the Pip wall, by add.<\/li> <li>Against Parry \u2694\ud83d\udd0d defences the Pips may be added to stop cards matching (The Defending weapon may also have Penetration Pips, and Refs may allow them to spend theirs too).<\/li> <li>Dodges \ud83d\udc63\ud83e\udd8b\ud83d\udc5f that have to beat the Pips also have to beat the points of Penetration.<\/li> <li>When Soaked \u2614\ud83d\udcad or Blocked \ud83d\udee1, Penetration allows Pips to leak from the original Attack Card to the Wound inside the Soak-Layer, whenever the Attacker wants to use them.<\/li><\/ul>"
      },
      {
         "Mode":"\ud83c\udfad",
         "Name":"Stage",
         "Text":"Affects the Stage or the Target's position in it.",
         "Rules":"The Rules depend on the attack being used. A Snare Attack creates a Trap in the the Stage of the Ordeal. The Trap may be avoided, by playing a higher card, but it remains as an Obstacle in the Stage. The Snare may be disabled (by beating Twice the Pips + any additional modifiers the Snare may have), or it may injure everyone that enters the Stage. Kick and Yank Attacks move the Target in the Stage, either away or towards the Attacker, by a Range equal to the Total Pips Reduced."
      },
      {
         "Mode":"\ud83d\ude31",
         "Name":"Shocking",
         "Text":"Shocking Attacks cause the Defender to pause for some reason (fright, laughter, stunning damage, or whatever) if any Wound actually makes it to the Character",
         "Rules":"Each attack that Wounds automatically causes Pips Stress to the Target. If the wound is more than a Flesh Wound this also causes 1 GRT on the Defender (see Rules for Stress, Strain and Shock)."
      },
      {
         "Mode":"\u2620",
         "Name":"Festering",
         "Text":"Some Wounds are more difficult to heal and regenerate than others. Maybe it's a poison, or venom on the attack, magic, or a practically guaranteed infection from bacteria, sometimes its just that insult that gets under your skin...",
         "Rules":"All Wounds Fester Automatically (restricting how the Wound can be treated and healed)."
      }
   ]
};
}

window.T13NE.Attacks.getAttack = function(attack){
	//console.log("getAttack",attack);
	var attackclasses=window.T13NE.Attacks["Attack_Classes"].length;
	var defmodes=window.T13NE.Attacks["Defence_Modes"].length;
	var damtypes=window.T13NE.Attacks["Damage_Types"].length;
	var total=attackclasses+defmodes+damtypes;
	switch (typeof(attack)){
		case "number":
		
			if (attack<attackclasses){
				return window.T13NE.Attacks["Attack_Classes"][attack];
			}else if(attack>=attackclasses && attack<(attackclasses+defmodes) ){
				//console.log("Defence_Modes",   		attack-attackclasses);
				return window.T13NE.Attacks["Defence_Modes"][(attack-attackclasses)];
			}else{
				//console.log("Damage_Types",   		attack-attackclasses-defmodes);
				return window.T13NE.Attacks['Damage_Types'][(attack-attackclasses-defmodes)];
			}
		break;
		case "string":
			if (attack){
				for (i=0;i<total;i++){
					var temp=window.T13NE.Attacks.getAttack(i);
					//console.log("getting attack i-",    		i);
					//console.log("temp=",    		temp);
					if (temp.Mode.codePointAt(0)==attack.codePointAt(0)||temp.Name==attack){
						return temp;
					}
				}
				return null;
				console.log("attack not found : ",attack);
			}
		break;
		default:
			return null;
		break;
	}
};
window.T13NE.Attacks.replaceEmojis = function (emojis){
	console.log("replaceEmojis", 		emojis);
	var len = emojis.length();
	var ret ="";
	var emojicode;
	for (var i=0;i<=len;i++){
		emojicode = emojis.codePointAt(i);
		ret+=window.T13NE.Attacks.replaceEmoji(String.fromCodePoint(emojicode));
	}
	return ret;
};
window.T13NE.Attacks.replaceEmoji = function (emoji){
	//console.log("replaceEmoji",     		emoji);
	//has to branch because some emojis are two charcaters long and some only one.
	if (window.T13NE.Attacks.getAttack(emoji)){
		return React.createElement(window.T13NE.Attacks.DisplayEmoji, {"className":"t13ne-replaced-emojii",
	     		 "data-emoji":emoji, "data-mode":"replacement"});
	}else if(window.T13NEAttacks.getAttack(emoji.substr(0,1))){
		return React.createElement(window.T13NE.Attacks.DisplayEmoji, {"className":"t13ne-replaced-emojii",
	     		 "data-emoji":emoji.substr(0,1), "data-mode":"replacement"});
	}else if(window.T13NEAttacks.getAttack(emoji.substr(1,1))){
		return React.createElement(window.T13NE.Attacks.DisplayEmoji, {"className":"t13ne-replaced-emojii",
	     		 "data-emoji":emoji.substr(1,1), "data-mode":"replacement"});
	}
};
window.T13NE.Attacks.DisplayAttacks = function (props){
	return window.T13NE.Attacks.replaceEmojis(props["data-attacks"]);
};
window.T13NE.Attacks.findEmoji=function(emojis){
//	'/[^\x20-\x7e]/'
//(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c\ude32-\ude3a]|[\ud83c\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])
};

window.T13NE.Attacks.DisplayEmoji = function(props){
	//console.log("DisplayEmoji",props);
	var { __ } = window.wp.i18n;
	if (props["data-emoji"]){
		var emoji = props["data-emoji"];
	}else if (props["data-emojis"]){
		var emojis=""+props["data-emojis"];
		var len = (emojis.length-2);
		var ret =[];
		for (var i=0;i<=len;i++){
			ret[i]=window.T13NE.Attacks.DisplayEmoji({"data-emoji":emojis.substr(i+1,2), className:props.className, "data-mode":props["data-mode"]});
		}
		return ret;

	}else{
		console.log("no emojis to display",	 props);
		return null;
	}
	var mode = props["data-mode"];
	var active=null;
	var passive=null;
	var qa=window.T13NE.Attacks.getAttack(emoji);
	if (qa!==null){
		if (qa['Active_Defences']){
			active=React.createElement(window.T13NE.ContentBox, {className:props.className+"-emoji t13ne-emoji",
	     		 title: __("Active Defences")},window.T13NE.Attacks.replaceEmoji(qa["Active_Defences"]));
			passive=React.createElement(window.T13NE.TextBox, {className:props.className+"-emoji t13ne-emoji",
	     		 title: __("Passive Defences")},window.T13NE.Attacks.replaceEmoji(qa["Passive_Defences"]));
		}
		return (
			React.createElement("figure",
	     		 {"className":props.className+"-figure t13ne-atkicon",
	     		 "title":qa.Name,"key":Date.now().toString(36) +"-"+ Math.random().toString(36).substr(2, 4)+"-"+ Math.random().toString(36).substr(2, 4)}, 
				React.createElement("span",
	     		 {"className":props.className+"-span"}, qa.Mode),
					React.createElement("details",
	     		{"className":props.className+"-details"},
						React.createElement("summary",
	     		{"className":props.className+"-summary"}),
						React.createElement("p",
	     		 {"className":props.className+"-details-p"}, 
							React.createElement("strong",
	     		 {"className":props.className+"-strong"}, qa.Name),
							React.createElement("span",
	     		 {"className":props.className+"-span t13ne-description",
	     		 dangerouslySetInnerHTML:window.T13NE.T13Sanitize(qa.Text)}, null)
						),
					qa.Rules?(React.createElement("p",
	     		 {"className":props.className+"-details-p t13ne-rules"}, 
						React.createElement("strong",
	     		 {"className":props.className+"-strong t13ne-rules"}, "Rules: "),
						React.createElement("span",
	     		 {"className":props.className+"-span t13ne-rules",
	     		 dangerouslySetInnerHTML:window.T13NE.T13Sanitize(qa.Rules) },null),
						active,
						passive,
					)):null
				
				)
			)		

		);
		
	}else{
		return null;
	}

};
<?php

/**
 * Fired during plugin activation
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 */

/**
 * Fired during plugin activation. Input Sanitizer
 *
 * This class defines all code necessary to run Quests in the engine.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Quests{
	public static $questElementTypes = [
		['Type'=>'Agent of Change', 'Description'=>'The Agent of Change is a character that works to overturn the status-quo of the world before the Quest. They are similar to the Agent of Chaos, but work openly for their preferred change, they will not try to catch a Quester off-guard about what they want to achieve. Unfortunately this makes them almost indistinguishable from an Agent of Chaos under many circumstances.'],
		['Type'=>'Agent of Chaos', 'Description'=>'The Agent of Chaos looks similar to the Agent of Change, but is actually a form of Opposition that works to overturn the status quo of the world. They may work to assist the Quester at one time, but then work against them the next, the Quest and the Quester are largely irrelevant. Agents of Chaos can occasionally pretend to be Quest Givers or Informers, if it suits their purposes, and will often hide the fact they are an Agent of Chaos by claiming to be an Agent of Change.'],
		['Type'=>'Authority', 'Description'=>'An Authority is a character who has some political or social power, they are usually somewhat allied with the Old Guard, as they derive power from the status-quo, and they can be allied with almost anyone, but are usually responsible for Bystanders. Authorities are generally never the Quest-giver though.'],
		['Type'=>'Bystander', 'Description'=>'Bystanders are not involved directly with the Quest, but may be pulled in by Opposition, Quester or Dragon depending upon the situation.'],
		['Type'=>'Complicator', 'Description'=>'The Complicator is a Character who works for the Opposition and complicates the Quest for the Quester, usually these complications will include turning allies against them, often through lies, half-truths and subtle manipulations.'],
		['Type'=>'Dragon', 'Description'=>'The Dragon is a specific Character, usually a Monster, who acts as a Guardian of a Quest Object. Dragons often place Bystanders in danger as they threaten an entire town, region or land with physical and fiery destruction. Examples include most Dragons in fantasy, many defence forces, Warlords, and some robots.'],	
		['Type'=>'Enemy Agent', 'Description'=>'A member of the Opposition who is known to the Quester as a friend (or even member of) the family, neighbour or similar. The enemy agent is often revealed quite late in the Quest, and may have been acting as a Supporter during the early Quest. The enemy agent is the most likely member of the Opposition to steal the Quest Map.'],
		['Type'=>'Fox', 'Description'=>'The Fox is a Character or Descendant that is incredibly cunning, they may act as a Complicator and as the Object, sometimes they actually are both, but they can be neither, and are more like the Wolf, only with more desire to steal food than kill for it, such as a quick-fingered rogue. '],
		['Type'=>'Informer', 'Description'=>'The Informer is a Character or occasionally a Descendant that informs the Quester of some aspect of the Quest. They might explain the Opposition, expose some weakness of the Target, or reveal some secret about a Quest Giver.'],
		['Type'=>'Law-Enforcer', 'Description'=>'Any Character who is aligned with the Status Quo and given authority to impose the laws of the Status Quo world. They will oppose any character who flaunts or breaks laws who is not of greater authority than them.'],
		['Type'=>'Object', 'Description'=>'The Object is a Location, Descendant, or Character (sometimes described as the princess) that is the objective of the Quest. They might be the fort that must be held or besieged, a magical sword that must be liberated from a dragon horde, or a kidnapped princess as the story and quest requires.'],
		['Type'=>'Old Guard', 'Description'=>'An Agent who works to promote, and benefits from, the status-quo (the world as it is before the Quest begins). The Old Guard will oppose anyone who seeks to change the status-quo, whether Quester, Opposition, Agent of Change or Agent of Chaos. In other Quests the Old Guard can be the Quest-Giver.'],
		['Type'=>'Opposition', 'Description'=>'Any Character who opposes the Questers and the Quest in a generic, as opposed to specific, way. Examples might include the current owners of Quest Descendants, Plot Tokens or McGuffins, or a group that opposes the goals of the Quest.'],
		['Type'=>'Quartermaster', 'Description'=>'The Quartermaster is a Character that can be met by any Quester, and who will provide assistive descendants, often in the form of gadgets, magic items or spells. Quartermasters will often test the Quester in some way before bestowing their gifts. Examples include "Q" in those famous MI6 movies, as well as all manner of elderly wizard mentors.'],
		['Type'=>'Quest-Giver', 'Description'=>'Any Character who has knowledge of the Quest and has authority to send someone upon it. The Quest-giver, and the authority they derive to give the Quest, is not the same as an Authority Type Character, necessarily. So the potential Quest-givers and Authorities might include the king, the vizier, the enemy Duke who opposes the king, and the hero&#39;s father, but only the Father has the authority to send his son on a Quest to reclaim the family fortune.'],
		['Type'=>'Quester', 'Description'=>'Any Character who has accepted this Quest, even if they are from different sides, or have different Quest-Givers. Examples probably include the hero and any rivals.'],
		['Type'=>'Supporter', 'Description'=>'The Supporter is a Character (occasionally a Descendant) who offers the Quester some assistance along the way. Support can vary from vague positive affirmations and agreement, to dedicated physical assistance, in fantasy genres and folklore such Supporters are often magical in nature.'],
		['Type'=>'Warner', 'Description'=>'The Warner is a Character of equal or greater authority to the Quest Giver who warns the Quester not to take the Quest. Often the Warner will have some item that the Quester requires to complete the Quest, such as the Map.'],
		['Type'=>'Wolf', 'Description'=>'The Wolf is a Character or Monster that is usually a predator, unconnected to the Quest, but is driven by hunger, anger or manipulations to attack the Quester.']
		//['Type'=>'', 'Description'=>''],

	];

//So Quests are closely related to Narratives, as well as being a potential Embodiment. Unlike other Embodiments Quests often contain many elements that are different to the Conflict as it stands. It could help to think of Quests as having their own individual sub-conflict that always has a set number of sides. The Quest is formed from Trigrams which stack in pairs to create Hexagrams. The Trigram for each Quest is generally randomly created by rolling d8. Each Trigram has a number of Tests or Ordeals and should have a Hurdle. Hurdles Facet may relate to the Trigram possibly. The Trigram could be built by taking the Quest Facet Tao, The Hurdle Facet Tao and the ... hmm not sure about the final line... where does that come from? Perhaps the Quest-giver or Opposition Tao. 



	// public static $queststructures = [
	// 	'QuestGiver'=>'Frank the Questmaster',
	// 	'QuestFacet'=>0, //awe quest
		
	// 	'QuestElements'=>[
	// 		['ID'=>-1,'QEType'],
	// 	], 
	// 	'QuestOpposition'=>[
	// 		['CharID'=>000], //a character might be defined as a CharID, but they should also have a Narrative 
	// 		['Extras'=>
	// 			[
	// 				[
	// 					'Name'=>'Some bad guys',
	// 					'Annex'=>[
	// 						'Annex_Type'=>3,
	// 						'Boon'=>26, 
	// 						'Name'=>'Doing stuff', 
	// 						'Profs'=>[
	// 							['ProfID'=>0,'ProfInAnnex'=>0], 
	// 							['ProfID'=>0,'ProfInAnnex'=>1]
	// 						]
	// 					]
	// 				]
	// 			] 
	// 		],
	// 	],
	// 	'QuestGoals'=>[
	// 	]
	// 	'FailureRepercussions'=>[
	// 		'Quester'=>'Something bad happens to the Protagonist',
	// 		'Quest_Giver'=>'Something bad happens to the Questgiver',
	// 		'Narrative'=>'Something will happen to the current story / arc / volume / epic / cycle that usually is bad for the Protagonist and their Allies.',
	// 		'World_Shake'=>'Something happens that effects the whole world or setting, usually for the worst.',
	// 	], 
	// 	'SuccessRepercussions'=>[
	// 		'Quester'=>'The Protagonist will be given some reward, often by the Quest Giver.',
	// 		'Quest_Giver'=>'The Quest Giver will usually receive the Quest Descendant.',
	// 		'Narrative'=>'Something will happen to the current story / arc / volume / epic / cycle that usually is good for the Protagonist and their Allies.',
	// 		'World_Shake'=>'Something happens that effects the whole world or setting, usually improving it.',
	// 	],
	// 	'QuestBlocks'=>[
	// 		//not the nightmare discussed below that is just about how narratives work. We need instead to make Quest Blocks build a narrative.
	// 		['Block'=>'Foundation', 'BlockDescription'=>'The Foundation Block establishes the Quest Status at the beginning of the Quest. The Foundation assigns all the Elements (Characters and Descendants alike) a Quest Element Type. During this block the Quest Giver is shown to have authority to grant the Quest (a father asks for his child to be protected, a rich man offers money to a merchant for goods he does not currently stock, an officer relays an order to enlisted men, etc).', 'BlockNodus'=>'The Nodus of the Foundation is based on how the protagonist responds to the Quest Giver.<ul><li>If the protagonist accepts the Quest too easily or lightly then there will be Warnings given by other Characters (at least one of which will have equal or superior authority to the Quest Giver) not to take the Quest too lightly (or at all).</li><li>If the protagonist refuses the Quest too quickly, (or in some cases, at all) then the Quest Giver may up their offer, offer a better explanation, or try to explain how important the Quest is, or serious they are, occasionally the Opposition will show its hand at this point and perform some terrible action that confirms the Quest Giver&#39;s story</li><li>If the protagonist thinks long and hard about the Quest before agreeing reluctantly to proceed then usually there is no further trouble.</li><ul>'
	// 		],
	// 		['Block'=>'Preparation', 'BlockDescription'=>'The Preparation Block is usually about the now confirmed Quester planning and preparing for what is to come. They may gather resources, go shopping, book travel, pack a bag, sell their belongings, close up shop or say goodbye to loved ones. It is during this time that the Quester may meet with other Questers intending to complete the same Quest. These may be companions (Sam, Merry and Pippin accompany Frodo from the Shire) or rivals (other competitors in a competition, for example) depending upon the situation and Quest.', 'BlockNodus'=>'The Nodus of Preparation is created by the machinations of the Opposition, although they themselves should never appear. It may be that they will have an Enemy Agent placed near the Quester, or Quest Giver, informing the Opposition on what is occurring, or more often the shadows of their distant actions have local repercussions for the Quester, making it difficult for them to glean accurate intelligence. Enemy misinformation can also occur at this time making the Quester not understand the Quest properly, or throwing doubt on the validity of the  '],
	// 		//['Block'=>'', 'BlockDescription'=>'', 'BlockNodus'=>''],

	// 	],

	// 	// 'QuestBlocks'=>[
	// 	// 	[ 'Block'=>'Quest Given', 'BlockDescription'=>'This block establishes the Quest with the Quest giver giving it to the protagonist. Sometimes the Quest will include a map to a Location that will be in the Quest giver&#39;s possession.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>1,'Chunk'=>'Introduction','ChunkDescription'=> 'The protagonist is introduced and the authority of the Quest Giver is established. Sometimes the Quest giver will have tasked the protagonist with the Quest some time before the events of the Quest, this is common with the cases of eldest children who promise parents that they will protect their younger siblings, the Introduction will remind the protagonist of this vow, and cause some harm to befall the younger sibling, or the sibling will vanish initiating the Quest. It is normal during this chunk for the protagonist to become aware of the Quest Map, although it does not enter their possession yet.'],
	// 	// 		['ChunkID'=>2,'Chunk'=>'(Option A) Rejection','ChunkDescription'=> 'The protagonist rejects the Quest Giver or the Quest, refusing it. This is especially common when the Quest giver has dubious authority.'],
	// 	// 		['ChunkID'=>2,'Chunk'=>'(Option B) Warning','ChunkDescription'=> 'The Quester is warned against some activity or location, often this will be by some one with equivalent or greater authority to the Quest giver. Sometimes this warning will be a universal Taboo, such as "No one may enter the shrine", but more often it is specifically intended for the Quester. For example, if given the Quest by their father, the eldest sibling will be told by a mother, uncle or step-father not to go after their lost sibling. In some Quests the warning is against the Quest Map, which is in the Warner'],
	// 	// 		['ChunkID'=>3,'Chunk'=>'(Option A) Sale','ChunkDescription'=> 'The Quest giver ups their offer, or explains the Quest better to the protagonist, or the Opposition will perform some terrible action that confirms the Quest givers authority (attacking the protagonists friends or remaining family for example). This eventually results in the protagonist accepting the Quest, receiving the Quest Map, or the Quest fails and that triggers the Failure Repercussions'],
				
	// 	// 		['ChunkID'=>3,'Chunk'=>'(Option B) Disregarding','ChunkDescription'=> 'The Quester will disregard the warning given, or events and even the opposition will conspire to cause the warning to be forgotten. Sometimes the enemy agent will break the Taboo, entering the shrine, in the example above, and the Quester follows out of some idea of stopping or saving them. Often times this causes the Quester to break some other Taboo, and make matters worse, and usually is all part of the plan of the enemy agent who has a greater, deeper understanding of the situation.'],
	// 	// 	]],
	// 	// 	[ 'Block'=>'Prepare', 'BlockDescription'=>'The Protagonist makes any preparations for the Quest and then sets off.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>4,'Chunk'=>'Planning','ChunkDescription'=> 'A sensible Quester does not Quest without a plan (and often a Map). They should work out what they need to do to succeed. Conversely, the Opposition will require information about the Quester too. The Opposition will often utilise tricks and disguises to get close to the Quester (usually through an Enemy Agent character), perhaps meeting with their parents or family to learn about them and to find out what they know. The Enemy Agent may even steal the Quest Map at this time (although often the Map will have been at least partially memorised by the Quester allowing them to act).'],
	// 	// 		['ChunkID'=>5,'Chunk'=>'Packing','ChunkDescription'=> 'Once they have a plan the Quester will pack up for their adventure. This can be as easy as grabbing a go-bag, or as complex as packing a tour bus. The Opposition may also now know what they need to succeed (having gained some inside information from their trickery, such as stealing the Quest Map). If the enemy agent has not been revealed then they may disappear at this point, as they leave to inform the opposition.' ],
	// 	// 		['ChunkID'=>6,'Chunk'=>'Leaving','ChunkDescription'=> 'The time comes for the Quester to leave on the quest. Sometimes this chunk will incur problems that can be similar to a Snag or even a Fray Event, as events or people may conspire to keep the Quester at home. Examples can include the enemy agent returning under orders and making trouble for the Quester with their family, there may be threats made, especially to the remaining friends and family by the opposition, which is usually presented by an Informer, the enemy agent or an agent of chaos.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'Stepping Out', 'BlockDescription'=>'The Quester begins their Quest, journeying towards the destination, or awaiting their enemies.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>7,'Chunk'=>'Hurry up and wait','ChunkDescription'=> 'Quests take time, whether it is time wasted in queues, travel time, or time waiting for the enemy to appear. During this time the Opposition may make some advancement, Gain or have a Revelation.'],
	// 	// 		['ChunkID'=>8,'Chunk'=>'Pressure','ChunkDescription'=> 'Something will happen, it might be that there are signs of the enemy, some accident may occur, or it may be the tolls of travelling, but Tension levels will rise and something occurs that includes but are not limited to abduction, fights, theft, forgotten items, food poisoning, plundering, banishment, expulsion, missed connections, crashes, checkpoints, murders, threats, forced marriages, assaults, bad dreams. Whatever happens should not directly involve the Opposition however.'],
	// 	// 		['ChunkID'=>9,'Chunk'=>'Arrival','ChunkDescription'=> 'Either the Quester now arrives where they need to be (or at least the first location they must visit), or the enemy arrives at the location of the Quester. At this point in the Quest the Quester discovers the nature of the Opposition, usually the Enemy Agent is not revealed at this point, but they may reveal knowledge of the Opposition that would be difficult to glean without direct contact.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'New Sights', 'BlockDescription'=>'The Quester sees some new sights, exploring the Location they are in, seeing or sensing in a new way, or seeing the Opposition perform some wonder they could not.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>10,'Chunk'=>'Seeing the sights','ChunkDescription'=> 'The Quester explores their new Location or may discover, gain or learn some new Proficiency, Skill or Descendant that lets them see the world in a new light. Often this new ability is stolen or learned from some member of the Opposition while fighting them.'],
	// 	// 		['ChunkID'=>11,'Chunk'=>'It&#39;s all Fun and Games','ChunkDescription'=> 'The Quester develops through bonding with others, having fun, and learning about themselves, and their environment. If they have not developed a new Skill or Talent recently they probably do this now. Here begins their adventure proper.'],
	// 	// 		['ChunkID'=>12,'Chunk'=>'Until Someone Loses An Eye','ChunkDescription'=> 'Something occurs that dramatically ends the fun and games. This can result in someone being badly injured, even losing an eye, or some of their new ability. The Quester may encounter another Character on their path, and is tested in some manner through interrogation, combat, puzzles or more.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'Climbing Up', 'BlockDescription'=>'The Quester now discovers the problems of their new world or abilities and must seek to overcome them, in so doing they become more experienced and powerful.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>13,'Chunk'=>'Building Up','ChunkDescription'=> 'The Quester withstands the rigours of the test, failing or injury (losing an eye), frees a captive, reconciles disputing parties or otherwise wins through the difficulty, because of this secrets are revealed to the Quester, usually by an Informer, or Supporter, but occasionally by the Agent of Chaos, or even the Opposition. They may learn of new problems caused by the Opposition, or learn some aspect of the Oppositions plan.'],
	// 	// 		['ChunkID'=>14,'Chunk'=>'Changing Up','ChunkDescription'=> 'Something causes changes for the Quester (and often the whole Narrative) yet again. This is usually because the Quester acquires use of assistance (often a magical item) as a consequence of their actions. Items can be magical rings, cloaks, weapons, potions, scrolls, books, or foods (peaches of immortality, etc). This item may be stolen (at great risk), purchased (for a great cost), summoned (via a long and often dangerous ritual), constructed (fashioned from ingredients the Quester has sourced), found (usually in some horde, dungeon or temple) or the Quester may be rewarded it. Of course this assistance can also be the earned loyalty, friendship and aid of a Supporter.'],
	// 	// 		['ChunkID'=>15,'Chunk'=>'Turning Up','ChunkDescription'=> 'The Quester is somehow led to (or dreams or has a vision of, is transported to, shanghaied, or dragged into) a vital location where they find evidence that something has appeared to be one thing, but turns out to be something else. Traditionally, this is the moment that the Enemy Agent is finally revealed, or that the Agent of Chaos works against the Quester. Occasionally the Quester will discover that they have been working for the Opposition this whole time at this point. This may be the moment they discover their new power is considered evil by some, or that they discover it is not unique.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'Decisions', 'BlockDescription'=>'The Quester commits themselves to solving the problems that stop them from completing the Quest.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>16,'Chunk'=>'Contention','ChunkDescription'=> 'While the Quester is off-balance, responding and reacting to the reversal of Turning Up, the Opposition shows their hand, perhaps sending troops to engage either in battle or some nature of contest.'],
	// 	// 		['ChunkID'=>17,'Chunk'=>'Actions','ChunkDescription'=> 'The Quester takes some dramatic and often foolish action as a result of their reaction and the Opposition showing themselves. Often the Quester is marked in some manner as a result of their actions, perhaps receiving a distinctive scar or a cosmetic item like a distinctive piece of jewellery or clothing such as a uniform.'],
	// 	// 		['ChunkID'=>18,'Chunk'=>'Dedication','ChunkDescription'=> 'The Questers regroup, and recover. They gather supplies and learn proficiencies and skills they need to learn.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'Decisions', 'BlockDescription'=>'The Quester commits themselves to solving the problems that stop them from completing the Quest.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>16,'Chunk'=>'Contention','ChunkDescription'=> 'While the Quester is off-balance, responding and reacting to the reversal of Turning Up, the Opposition shows their hand, perhaps sending troops to engage either in battle or some nature of contest.'],
	// 	// 		['ChunkID'=>17,'Chunk'=>'Actions','ChunkDescription'=> 'The Quester takes some dramatic and often foolish action as a result of their reaction and the Opposition showing themselves. Often the Quester is marked in some manner as a result of their actions, perhaps receiving a distinctive scar or a cosmetic item like a distinctive piece of jewellery or clothing such as a uniform.'],
	// 	// 		['ChunkID'=>18,'Chunk'=>'Dedication','ChunkDescription'=> 'The Questers regroup, and recover. They gather supplies and learn proficiencies and skills they need to learn.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'Decisions', 'BlockDescription'=>'The Quester commits themselves to solving the problems that stop them from completing the Quest.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>16,'Chunk'=>'Contention','ChunkDescription'=> 'While the Quester is off-balance, responding and reacting to the reversal of Turning Up, the Opposition shows their hand, perhaps sending troops to engage either in battle or some nature of contest.'],
	// 	// 		['ChunkID'=>17,'Chunk'=>'Actions','ChunkDescription'=> 'The Quester takes some dramatic and often foolish action as a result of their reaction and the Opposition showing themselves. Often the Quester is marked in some manner as a result of their actions, perhaps receiving a distinctive scar or a cosmetic item like a distinctive piece of jewellery or clothing such as a uniform.'],
	// 	// 		['ChunkID'=>18,'Chunk'=>'Dedication','ChunkDescription'=> 'The Questers regroup, and recover. They gather supplies and learn proficiencies and skills they need to learn.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'Bleakness', 'BlockDescription'=>'Here the protagonist faces defeat and victory seems impossible.',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>19,'Chunk'=>'Begin Again','ChunkDescription'=> 'The Quester now knows the trials they must truly face to complete the Quest, and begins anew.'],
	// 	// 		['ChunkID'=>20,'Chunk'=>'Barrier','ChunkDescription'=>'Someone or something (often the Agent of Chaos, Opposition, or a Dragon) stands between the Quester and the objective. The Quester usually defeats this Barrier by using their new found abilities.'],
	// 	// 		['ChunkID'=>21,'Chunk'=>'The Fall','ChunkDescription'=> 'Despite the Quester&#39;s resolve and skills, or sometimes because of them, all now seems lost. The Opposition seems to have won their Quest already.'],
	// 	// 		]
	// 	// 	],
	// 	// 	[ 'Block'=>'', 'BlockDescription'=>'',
	// 	// 	'QuestChunks'=>[
	// 	// 		['ChunkID'=>22,'Chunk'=>'','ChunkDescription'=> ''],
	// 	// 		['ChunkID'=>23,'Chunk'=>'','ChunkDescription'=> ''],
	// 	// 		['ChunkID'=>24,'Chunk'=>'','ChunkDescription'=> ''],
	// 	// 		]
	// 	// 	],
	// 	// 	]
	// 	]
	// ];

// Describe the object of the quest and why it’s important. You don’t have to start the story with this statement, but it should come near the beginning, explaining why you’ve arrived in New Guinea, for example.
// Set out on the quest. What do you bring? How do you prepare?
// Describe the journey and the difficulties of achieving it.
// Describe whether you achieve the goal or not.

// BLOCK 1 – here the protagonist faces defeat and victory seems impossible (Setup)
// CH19 – Trials – the Character(s) know what they must do now, what they must overcome (setup)
// CH20 – Pinch – somebody or something gets in the way of the character(s) doing what they need to do (event/conflict)
// CH21 – Darkest Moment – All seems lost (resolution)
// BLOCK 2 – here the protagonist must find power and take action (Conflict)
// CH22 – Power Within – the character(s) rally and refuse to give up (setup)
// CH23 – Action – the antagonistic forces rear their ugly head again and must be thwarted (conflict)
// CH24 – Converge the character(s) gather themselves for a sort of last supper (resolution)
// BLOCK 3 – here the protagonist fights, wins and resolves the quest (Resolution)
// CH25 – Battle – the time has come for the final battle (can be literal or figurative) (setup)
// CH26 – Climax  – the battle is either lost or won (depending on the type of story you’re telling) (conflict)
// CH27 – Resolution – the aftermath of the battle, the character(s) have grown into different people from those at the beginning of the story  (resolution)
	

// 13.HERO'S REACTION: The hero responds to the actions of their future donor; perhaps withstanding the rigours of a test and/or failing in some manner, freeing a captive, reconciles disputing parties or otherwise performing good services. This may also be the first time the hero comes to understand the villain's skills and powers, and uses them for good.

// 14.RECEIPT OF A MAGICAL AGENT: The hero acquires use of a magical agent as a consequence of their good actions. This may be a directly acquired item, something located after navigating a tough environment, a good purchased or bartered with a hard-earned resource or fashioned from parts and ingredients prepared by the hero, spontaneously summoned from another world, a magical food that is consumed, or even the earned loyalty and aid of another.

// 15.GUIDANCE: The hero is transferred, delivered or somehow led to a vital location, perhaps related to one of the above functions such as the home of the donor or the location of the magical agent or its parts, or to the villain.

// 16.STRUGGLE: The hero and villain meet and engage in conflict directly, either in battle or some nature of contest.

// 17.BRANDING: The hero is marked in some manner, perhaps receiving a distinctive scar or granted a cosmetic item like a ring or scarf.

// 18.VICTORY: The villain is defeated by the hero – killed in combat, outperformed in a contest, struck when vulnerable, banished, and so on.

// 19.LIQUIDATION: The earlier misfortunes or issues of the story are resolved; object of search are distributed, spells broken, captives freed.

// 20.RETURN: The hero travels back to their home.

// 21.PURSUIT: The hero is pursued by some threatening adversary, who perhaps seek to capture or eat them.

// 22.RESCUE: The hero is saved from a chase. Something may act as an obstacle to delay the pursuer, or the hero may find or be shown a way to hide, up to and including transformation unrecognisably. The hero's life may be saved by another.

// 23.UNRECOGNIZED ARRIVAL: The hero arrives, whether in a location along their journey or in their destination, and is unrecognised or unacknowledged.

// 24.UNFOUNDED CLAIMS: A false hero presents unfounded claims or performs some other form of deceit. This may be the villain, one of the villain's underlings or an unrelated party. It may even be some form of future donor for the hero, once they've faced their actions.

// 25.DIFFICULT TASK: A trial is proposed to the hero – riddles, test of strength or endurance, acrobatics and other ordeals.

// 26.SOLUTION: The hero accomplishes a difficult task.

// 27.RECOGNITION: The hero is given due recognition – usually by means of their prior branding.

// 28.EXPOSURE: The false hero and/or villain is exposed to all and sundry.

// 29.TRANSFIGURATION: The hero gains a new appearance. This may reflect aging and/or the benefits of labour and health, or it may constitute a magical remembering after a limb or digit was lost (as a part of the branding or from failing a trial). Regardless, it serves to improve their looks.

// 30.PUNISHMENT: The villain suffers the consequences of their actions, perhaps at the hands of the hero, the avenged victims, or as a direct result of their own ploy.

// 31.WEDDING: The hero marries and is rewarded or promoted by the family or community, typically ascending to a throne.		

}
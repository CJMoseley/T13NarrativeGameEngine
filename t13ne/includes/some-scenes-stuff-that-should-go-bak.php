static public function buildScene($name, $act, $side, $scenetype, $conflict){
	error_log("build Scene '{$name}', '{$act}','{$side}','{$scenetype}' ".json_encode($conflict));
	if($scenetype=="Random"){
		$scenetype=array_rand(array_flip(['Hook', 'Revelation', 'Ordeal', 'Test', 'Gain', 'The Ends','The Fray','The Snag','Recoiling','Sweeping','Picking']),1);
	}
	$scene=array('For'=>$name, 'Act'=>$act,'Side'=>$side, 'Scene'=>$scenetype, 'Conflict'=>$conflict);

	switch($scenetype){
		case 'Hook':
		$scene['Cards']=array('Hook'=>'1','Hook_Aspect'=>'1');
		$scene['Description']='Hooks draw Primary Characters into the Conflict. They also have a tendency to gather secondary and tertiary Characters as well.';
		$scene['Titles']=array('Adjectives'=>array('Arisen', 'Aroused', 'Bound', 'Broken','Buckled','Begun','Chanced','Departed','Launched','Created','Entered','Edged','Flown','Drawn','Alpha',''),
				'Verbs'=>array('Activating','Allowing','Appearing','Arising','Arousing','Backing','Birthing','Blanching','Bolting','Bouncing','Bounding','Bowing','Breaking','Buckling','Bucking','Bulging','Chancing','Coming Into Being','Commencing','Convulsing','Counting','Creating','Darting','Dawning','Departing','Deriving','Drawing','Edging','Embarking','Entering','Establishing','Flying','Finding','Founding','Getting Going','Getting','Heading','Helping','Incepting','Intercepting','Inciting','Initiating','Instigating','Introducing','Jumping','Jumping','Kicking-off','Launching','Leaping','Leaving','Lighting','Leading','Recoiling','Rising','Opening','Running','Springing','Startling','Starting', 'Growing','Arriving','Beginning','Priming','Seizing', 'Setting Out', 'Leaving',),
				'Positions'=>array('Hooked','On The Line','Caught','Inside','Within','Contained'),
				'Expressions'=>array('A New Rival','A Fresh Start','The Worst Friend','The Best Of Enemies','An Old Rival','Someone New In Town','A New Fighter Enters','Unlikely Allies','Someone In Need','A Damsel In Distress','A Herald','A Town-crier','A Wanted Poster','A Store','A Fresh Corpse','A New Case','An Early Morning Jogger','A Bar-tender','A Commuter',''),
				'Nouns'=>array('Activation', 'Allowance', 'Alpha', 'Appearance', 'Backing', 'Birth', 'Bolt', 'Bounce', 'Bow', 'Break', 'Buck', 'Bulge', 'Chance', 'Come Into Being', 'Commence', 'Commencement', 'Convulsion', 'Countdown', 'Create', 'Dart', 'Dawn', 'Dawning', 'Day One', 'Depart', 'Derivation', 'Draw', 'Drawing', 'Draw Back', 'Edge', 'Embark', 'Embarkation', 'Engender', 'Enter Upon', 'Establish', 'Exit', 'First Step', 'Flying Start', 'Found', 'Foundation', 'Get Going', 'Get Under Way', 'Go Ahead', 'Handicap', 'Head Start', 'Helping Hand', 'Hit The Road', 'Inaugurate', 'Inauguration', 'Inception', 'Incite', 'Initiate', 'Initiation', 'Instigate', 'Institute', 'Introduce', 'Introduction', 'Issue', 'Jar', 'Jerk', 'Jump', 'Jump The Gun', 'Jump-off', 'Kick-off', 'Launch', 'Lay Foundation', 'Lead', 'Leap', 'Leave', 'Light', 'Odds', 'Onset', 'Open', 'Opening','Opportunity', 'Origin', 'Originate', 'Outset', 'Pioneer', 'Quail', 'Recoil', 'Rise', 'Rouse', 'Running Start', 'Sally Forth', 'Scare', 'See Light', 'Set In Motion', 'Set Out', 'Set Up', 'Shock', 'Shrink', 'Shy', 'Source', 'Spasm', 'Sponsorship', 'Spring', 'Spring', 'Square One', 'Start', 'Startle', 'Take-off', 'Turn', 'Turn On', 'Twitch', 'Vantage', 'Wince','Fishing', 'Beginning', 'Rising', 'Catching', 'Catching On' ));
		break;
		case 'Revelation':
			$scene['Cards']=array('About'=>'1', 'Vector'=>'1', 'Info'=>'O', 'Alternate'=>'O', 'Detail'=>'OM');
			$scene['Description']='Revelations reveal something about the Conflict or Plot to the Characters. Typically a Revelation tells the Characters something about the Villain, or the Prize they are after. Revelations usually consist of 2 or more cards that define: What the information is about, what the actual info is, the vector the Revelation is revealed by, and perhaps some Alternative Information that might be revealed (in case you can\'t use the Info), and a detail that is involved somehow.';
			$scene['Titles']=array('Adjectives'=>array('Adventurous','Truthful','Certain','Bookish','Clever','Boring','Explicable','Anecdotal','Fictional','Factual','Counter-Factual','False','True','Unlikely','Improbable','Impossible','Rumoured','Gossipy','Legendary','Famous','Infamous','Talkative','Loquacious','Gregarious','Chatty','Experimental','Theoretical','Spotted','Commonly','Informative','Untrue','Truly','Puzzlingly','Transparent','Clear','Obvious','Likely','Probable','Improbable','Impossible','Possible'),
				'Verbs'=>array('Accounting','Coding','Answering','Betraying','Divulging','Explaining','Mazing','Questioning','Losing','Exposing','Monologuing', 'Gossiping',' Talking','Revealing','Publishing','Exploring','Proving','Probing','Pointing Out','Story-telling','Singing','Rhyming','Observing','Theorizing','Uncovering', 'Unearthing','Unveiling','Overhearing','Spotting','Sighting','Puzzling','Quizzing','Investigating','Inquiring'),
				'Positions'=>array('In','On','Sat','In The Drawing Room','On The Train','In Space','In The Library','Armed With A'),
				'Expressions'=>array('An Adventurer','A Rival Gang','Another Group','Your Parents','A Teacher','A Mentor','An Investigator','A Detective','A Source','A Mole','A Spy','An Agent','A Merchant','A Shop Assistant','A Trader','A Poster','The News','A News Crew','A Journalist','An Author','A Sage','Someone Smart','A Scientific Paper','Some Scientists','Some Employees','An Employer','A Historian','An Archivist','A Librarian','A Doctor','A Professor','A Lawyer','A Solicitor','A Barrister','A Clinician','A Barber','A Hairdresser','A Chance Encounter','A Bus Driver','A Taxi Driver','A Bank Teller','A Secret Source','An Unlikely Source','A Reputable Source','A Phone Call','An Internet Search'),
				'Nouns'=>array('Account', 'Adumbration', 'Adventure', 'Advice', 'Allegory', 'Anecdote', 'Announcement', 'Answer', 'Apocalypse',  'Article', 'Autobiography', 'Beat', 'Betrayal', 'Big Picture', 'Biography', 'Blow By Blow', 'Book', 'Break', 'Broadcasting', 'Canard', 'Catching On','Chronicle', 'Cliffhanger', 'Clue', 'Clues', 'Cock-and-bull Story', 'Codes', 'Comedy', 'Communication',  'Cue', 'Cypher', 'Danger Sign', 'Data', 'Description', 'Diaries', 'Diary', 'Discovery', 'Display', 'Divination', 'Disclosure', 'Drama', 'Earful', 'Education', 'Enlightening', 'Epic', 'Epiphany', 'Evidence', 'Exhibition', 'Explanation', 'Expose', 'Exposition', 'Exposure', 'Exposé', 'Eye-opener', 'Fable', 'Fabrication', 'Facts', 'Fairy Tale', 'Falsehood', 'Falsity', 'Fantasy', 'Fear', 'Feature', 'Fib', 'Fiction', 'Fiction', 'Flags', 'Flash', 'Folk-Tale', 'Footage', 'Foreshadowing', 'Gag', 'Good News', 'Gossip', 'Grape Vine', 'Hearing', 'History', 'Hope', 'Illumination', 'Info', 'Inquiry','Information', 'Information', 'Inspiration', 'Journal', 'Leak', 'Learning', 'Legend', 'Light', 'Lightning Bolt', 'Log', 'Long And Short Of It', 'Manifestation', 'Memoir', 'Misrepresentation', 'Myth', 'Narration', 'Narrative', 'News', 'News', 'News Item', 'Non-Fiction', 'Novel', 'Old Saw', 'Oracle', 'Parable', 'Picture', 'Pot-Boiler', 'Prevarication', 'Proclamation', 'Proof', 'Prophecy', 'Publication', 'Puzzle', 'Question', 'Recital', 'Record', 'Red Flag', 'Red Herrings', 'Relation', 'Report', 'Revelation', 'Romance', 'Rumours', 'Saga', 'Scoop', 'Scoop', 'Scroll', 'Sequel', 'Serial', 'Showing', 'Sign', 'Spiel', 'Story', 'Tale', 'Tale', 'Tapestry', 'Teaching', 'Text', 'The Latest', 'Theory', 'Tip', 'Transparency', 'Tragedy', 'Truth',  'Untruism', 'Untruth',  'Version', 'Video', 'Vision','Visions', 'Warning', 'White Lie', 'Wisdom', 'Yarn'));
		break;
		case 'Ordeal':
			$scene['Cards']=array('Ordeal_Type'=>'1','Stakes'=>'1', 'Obstacles'=>'1', 'Ordeal_Spread'=>'1','Stages'=>'1', 'Motional'=>'O', 'Fight'=>'O', 'Suggested_Action'=>'O' );
			$scene['Description']='Ordeals test Characters in a complex way (more than a single dice roll or a Facet Test). Ordeals can range from Low Stakes Ordeals (like doing the Crossword), to Paradoxical Stakes Ordeals, such as solving a crossword puzzle, while exchanging gunfire with time-travelling religious extremists, during a car chase, in order to save your grandfather before he meets your grandmother. Action generally, and Fights in particular, involve an Ordeal. Ordeals are usually created by playing a number of cards to define everything about the Ordeal (from the Type, Stakes, Number of Obstacles you should draw and add, to a suggested action that could be taken, or a description of a Stage)';
			$scene['Titles']=array('Adjectives'=>array('Bandy','Deadly','Competitive','Desperately','Dangerously','Proved','Proven','Difficult','Hard','Harder','Easy','Easier','Simple','Complicated','Tricky','Dangerous','injurious','Insulting',''),
				'Verbs'=>array('Running','Coping','Calling','Assessing','Arguing','Asking','Questioning','Fighting','Brawling','Battling','Duelling','Gaming','Playing','Hiding','Seeking','Grilling','Interrogating','Searching','Working','Building','Buying','Purchasing','Acquiring','Getting','Dashing','Dodging','Racing','Fleeing','Running','Escaping','Entering','Breaking and Entering','Gigging','Giggling','Insulting','Competing'),
				'Positions'=>array('Gone','Escaped','Lost In','Forgotten'),
				'Expressions'=>array('A Performer','A Contestant','A Hostile Force','An Enemy Group','A Creator','A Smith','A Salesman','A Competitor','Another Team','A Group of Rivals','The Police','Security Guards','An Interloper','A New Player','Subversive Elements','Unknown Assailants','A Criminal Gang','People','The Crowds','A Client','A Follower','A Heroic Idiot','A Brave Soul','A Lost Soul','A Difficult Time'),
				'Nouns'=>array('Battle','Challenge','Clash','Contend','Contest','Face','Fight','Play','Spar','Try','Vie','Wrestle','Attempt','Bid','Collide','Emulate','Encounter','Essay','Fence','Grapple','Joust','Oppose','Rival','Strive','Struggle','Tilt','Tussle','Go After','Go For', 'Jockey for Position', 'Lock', 'Hunt', 'Match', 'Game', 'Pit', 'Run', 'Scramble', 'Seek', 'Hide', 'Participation', 'Argument', 'Argue', 'Shout', 'Cry', 'Prey','Activity','Affliction','Agony','Analysis','Analyse','Anguish','Appointment','Approval','Ask','Assay','Assessment','Assignment','Attempt','Berth','Billet','Blue Book','Business','Calamity','Calvary','Capacity','Career','Catechism','Catechize','Check','Chore','Comp','Confirm','Confirmation','Connection','Corroboration','Countdown','Craft','Criterion','Competition','Cross','Cross-examine','Crucible','Daily Grind','Demonstrate','Difficulty','Distress','Dry Run','Elimination','Engagement','Essay','Evaluation','Exam','Examination','Examine','Experiment','Experimentalise','Faculty','Final','Fling','Function','Gig','Try-Out','Give The Third Degree','Go','Grill','Grind','Handicraft','Inquest','Inquire','Inquiry','Inspection','Interrogate','Investigate','Investigation','Lick','Line','Livelihood','Look Into','Make A Trial Run','Match Up','Means','Metier','Niche','Nightmare','Nine-to-five','Occupation','Office','Operation','Oral','Ordeal','Pick One\'s Brains','Place','Pop Quiz','Position','Post','Posting','Preliminary','Probation','Probing','Profession','Proof','Prove','Prove Out','Pump','Pursuit','Put To The Test','Query','Question','Questionnaire','Racket','Rat Race','Scrutiny','Search','See How It Flies','See How Wind Blows','Send Up A Balloon','Shake Down','Shibboleth','Shotgun','Situation','Spot','Stack Up','Standard','Stint','Substantiate','Substantiation','Swindle','Task','Test','Test','Torment','Torture','Touchstone','Trade','Trial','Trial And Error','Trial Run','Tribulation','Try','Try On','Try On For Size','Try Out','Try-Out','Validate','Verification','Verify','Visitation','Vocation','Work','Yardstick'));
			break;
		case 'The Ends':
			$scene['Cards']=array();
			$scene['Description']='The Ends are what the Primary Characters want, usually described as Quests. Maybe they have to defeat an Army attacking their home town, or find a husband before their birthday.';
			$scene['Titles']=array('Adjectives'=>array('Final','Extreme','Chosen','Decided','Drowned','Drifted','Ordered','Wanted','Needed','Intended','Determined','Willed','Projected','Anticipated','Hunted','Stolen','Taken','Kidnapped'),
				'Verbs'=>array('Seeking','Justifying','Requiring','Needing','Starving','Drowning','Drifting','Planning','Wanting','Grasping','Desiring','Ending','Starting','Deciding','Patterned','Tricking','Choosing'),
				'Positions'=>array('Intended','In Need Of', 'In Want Of'),
				'Expressions'=>array('A Person','A Victim','Another Rival','A Seeker','An Investigator','An Agent','A Soldier','A Wife','A Lawyer','An Heir','An Heiress','A Trickster','A Thief','A Musician','A Performer','A Poet','An Artist'),
				'Nouns'=>array('Goals', 'Ends', 'Wants', 'Needs', 'Requirements', 'Means', 'Justifications', 'Quest', 'Sought', 'Wanted', 'Plans', 'Cunning','Aim', 'Angle', 'Animus', 'Arrangement', 'Aspiration', 'Big Picture', 'Borderline', 'Bound', 'Boundary', 'Butt End', 'Confine', 'Contrivance', 'Course Of Action', 'Cusp', 'Deadline', 'Deal', 'Design', 'Device', 'Disposition', 'Drift', 'Edge', 'Expedient', 'Extent', 'Extremity', 'Foot', 'Game Plan', 'Gimmick', 'Goal', 'Ground Plan', 'Head', 'Heel', 'Idea', 'Intent', 'Intention', 'Layout', 'Limitation', 'Machination', 'Mark', 'Meaning', 'Means', 'Method', 'Neb', 'Nib', 'Object', 'Objective', 'Orderliness', 'Outline', 'Pattern', 'Picture', 'Platform', 'Plot', 'Point', 'Policy', 'Procedure', 'Program', 'Project', 'Projection', 'Prong', 'Proposal', 'Proposition', 'Purpose', 'Reason', 'Scenario', 'Spire', 'Stratagem', 'Strategy', 'Stub', 'Stump', 'Suggestion', 'System', 'Tactics', 'Tail', 'Tail End', 'Term', 'Terminal', 'Termination', 'Terminus', 'Tip', 'Top', 'Treatment', 'Trick', 'Ultimate', 'Undertaking', 'Where One\'s Heading'));
			break;
		case 'The Fray':
			$scene['Cards']=array('Fray'=>'1');
			$scene['Description']='The Fray is what keeps the Characters from their Ends, all the things that complicate that Quest. They have a huge, glorious, and bloody battle with the invading army.';
			$scene['Titles']=array('Adjectives'=>array('Fraught','Afraid','Worried', 'Concerned', 'Darkening','Complicated','Changed','Warped','Twisted','Shrunken','Corrupted','Hard','Harder','Tough','Gritty','Bedevilled','Ground','Worn','Torn', 'Blackened','Burnt','Broken','Burst','Damaged','Hurt','Troubled', 'Tormented','Tortured','Bleeding','Bloody','Bruised','Battered','Combated','Disputed','Resisted','Resistant'),
				'Verbs'=>array('Worrying','Thinning','Concerning', 'Darkening','Fighting','Brawling','Bashing','Complicating', 'Changing','Twisting', 'Defeating','Tearing','Ripping','Burning','Flaming','Grinding','Waiting','Unravelling','Engaging','Rubbing','Burning','Dazzling','Troubling','Torturing','Suffering','Hurting','Bleeding','Struggling','Climbing','Opposing','Conflicting','Arguing','Crusading','Quarrelling','Boxing','Punching','Stabbing','Shooting','Sniping','Clashing','Campaigning','Arguing','Debating','Trying','Working','Labouring','Figuring Out','Thinking','Defeating','Beating','Wrestling','Skirmishing','Tackling','Combating','Conquering','Racing','Dashing','Fleeing','Flying','Running','Escaping','Firing','Fire-Fighting','Countering','Resisting'),
				'Positions'=>array('In Waiting','Waiting On','Facing','Facing Off Against','Torturing'),
				'Expressions'=>array('A Street Tough','A Thug','A Drunk','A Victim','The Victim','Victims','Criminals','Attackers','The Attackers', 'An Opposing Force','An Ally','An Enemy','Just Someone','Someone','Someone Else','A Performer','An Artist','A Musician','A Poet'),
				'Nouns'=>array('Fight', 'Battle','Fracas','Melee','Affray','Brawl','Broil','Brouhaha','Combat','Disturbance','Engagement','Quarrel','Riot','Row','Ruckus','Rumble','Rumpus','Scuffle','Set-to','Battle Royalle','Erode','Frazzle','Unravel','Wear away','Chafe','Fret','Ravel','Rip','Rub','Tatter','Tear', 'Wear', 'Ragged', 'Threadbare', 'Thinning', 'Worries', 'Concerns', 'Darkening', 'Gloaming', 'Changing', 'Hotting up', 'Flames', 'Danger', 'Grind', 'Work', 'Labour', 'Hard Labour', 'Harder','Soldier','Sportsman','Hero','Villain','Combatant','Cop','Trouble','Strife','Feud','Contest','Melee','Scrimmage','Squabble','Maelstrom','Contention','Tangle','Realm','Hurdle','Complication','Mire','Frenzy','Scratch','Affray','Battle','War','Gauntlet','bout','Struggle','Defence','Match','Bout','Ring','Gunfight','Duel','Race','Dash','Tussle','Fighter','Soldier','Fight','Warfare','Warrior','Flee','Squabble','Contest','Confrontation','Stand','Fire-Fight','Argument','Dispute','Resistance','Dogfight','Clash','Boxer','Crusader'));
			break;
		case 'The Snag':
		 $scene['Cards']=array('Snag'=>'1');
		 $scene['Description']='The Snag is the complication that renders the actions of the Characters winning through the Fray moot somehow. They defeat the army, only to hear that it merely the scout force for a larger invasion force led by a Prince from the next kingdom over.';
		 $scene['Titles']=array('Adjectives'=>array('Accidental','Complicated','Upset','Messed Up','Broken','Lost','Unspoken','Denied','Draconic','Draconian','Demented','Disturbed','Broken','Crashed','Crushed','Heartbroken','Star-Crossed','Cursed','Curdled','Gone Bad','Inadvertent','Unintended','Casual','Extrinsic','Unintentional','Unforeseen','Unexpected','Fortuitous','Unexpected','Coincidence','Random','Involuntary','Occasional','Unanticipated','Crashed','Haphazard','Intoxicated','Drunk','Drugged','Sporadic','Episodic','Temporary','Problematical','Problematic','Hitched','Glitched','Caught','Hung','Complicated','Impediment','Trapped','Hindrance','Anomalous','Only','Major','Serious','Technical','Minor','Potential','Obvious','Hidden','Supernatural','Bureaucratic','Tiny','Small','Big','Nasty','Nice','Armed','Injurious','Harmful','Sudden','Dangerous','Sore','Ill','Risky','Messy','Cloudy','Damned','Little','Deep','Deeper','Deepest','Grave','Terrible','Worse','Impending','Dire','Foul','Dreadful','Grievous','Threatened','Stressed','Shaken','Surprised','Perilous','Precarious','Unsafe','Treacherous','Hazardous','Challenging','Daring','Critical','Harmful','Sinister','Disastrous','Inhospitable','Hellish','Nightmarish','Troublesome','Unpredictable','Arduous','Foolhardy','Unstable','Grim','Unpromising','Stormy','Chancy','Tumultuous','Ominous','Deadly','Unwise','Precipitous','Unpleasant','Worrisome','Daunting','Dauntless','Turbulent','Harrowing','Bleak','Tortuous','Murky','Slippery','Uncharted','Troubling','Hopeless','Unpalatable','Tense','Gruelling','Painful','Bizarre','Stark','Darkest','Desperate'),
				'Verbs'=>array('Hunting','Seeking','Scraping','Fixing','Looking','Exploring','Ripping','Tearing','Impeding','Stopping','Hampering','Troubling','Breaking','Catching','Ripping','Hurting','Sticking','Encountering','Clearing','Perching','Breaking','Hoping','Looking','Waiting','Threatening','Bothering','Disturbing','Distracting','Perturbing','Afflicting','Unhinging','Troubling','Causing','Avoiding','Brewing','Erupting','Saving','Expecting','Heading','Stirring','Spelling','Fermenting','Flaring'),
				'Positions'=>array('Held Back','Held Up','Awaiting'),
				'Expressions'=>array('The Complicating Factor','A Crash','A Pile-Up','A Mugging','A Traffic Jam','A Traffic Snarl','A Traitor','The Mole','An Agent of a Foreign Power','A Bug','A Glitch'),
				'Nouns'=>array('Barrier','Bug','Crunch','Difficulty','Disadvantage','Drawback','Glitch','Hitch','Hold-Up','Hurdle','Impediment','Inconvenience','Obstacle','Stumbling Block','Bar','Blockade','Brake','Catch','Clog','Crimp','Cropper','Curb','Drag','Fix','Hamper','Hole','Knot','Obstruction','Pickle','Problem','Puzzler','Scrape','Spot','Catch-22','The Rub','Tight Spot', 'Rip', 'Ripping', 'Tear', 'Tearing', 'Hazard', 'Haphazard', 'Trouble', 'Bad News', 'News','Bore','Trouble','Disquiet','Distress','Stress','Troublemaker','Punk','Punks','Fuss','Hassle','Problem','Turbulence','Mess','Headache','Predicament','Strife','Ruckus','Dilemma','Disadvantage','Misfortune','Pickle','Trap','Confusion','Accident','Injury','Insult','Insults','Embarrassment','Jeopardy','Fault','Peril','Hell'));
		break;
		case 'Recoiling':
			$scene['Cards']=array('Psych_Recoil'=>'123');
			$scene['Description']='Recoiling is Where the Characters respond emotionally to the previous Snag/Warp. Faced with the news that they must battle again tomorrow, do they collapse to their knees in defeat, or celebrate the victory anyway?';
			$scene['Titles']=array('Adjectives'=>array('Affectionate','Loving','Hating','Capricious','Amorous','Attached','Lovely','Friendly','Hateful','Beloved','Loved','Enchanted', 'Glamorous','Beauty', 'Beautiful', 'Pretty','Captivating','Magical','Happy','Sad','Shocked','Afraid','Scared','Feared','Dismayed','Pleased','Satisfied','Displeased','Emotional','Temperamental','Mental','Psychic','Psychological','Fainted','Swooned','Nauseated','Sickened','Happy','Loudest','Busy','Busy','Loudest','Uncontrollable','Involuntary','Hysterical','Pathological','Excessive','Inappropriate','Crazy','Wild','Boisterous','Spontaneous','Violent','Raucous','Nervous','Jolly','Unamused','Amused','Serious','Scared','Startled','Shocked','Terrified','Horrified'),
				'Verbs'=>array('Loving','Breathing','Adoring','Hating','Enchanting','Casting','Captivating','Disappointing','Cringing','Gaping','Quivering','Suppurating','Prickling','Lurching','Ossifying','Shuddering','Cowering','Shrieking','Squirming','Gnawing','Flailing','Gesticulating','Giggling','Swooning','Fainting','Creeping','Sneering','Pitying','Jolting','Betraying','Joking','Weeping','Yelling','Shouting','Howling','Glaring','Sobbing','Bawling','Screaming','Wailing','Grieving','Whining','Crying','Mourning','Laughing','Muttering','Mumbling','Clutching','Sighing','Flinching','Starting','Blinking','Shaking','Cringing','Pleading','Whispering','Panicking','Shivering','Groaning','Exclaiming','Clapping','Applauding','Chuckling','Panting','Pleading'),
				'Positions'=>array('Turn Away','Turning Away From','Turning Toward','Drawn Toward','Scared Away','Away From'),
				'Expressions'=>array('Yobs','Youths','A Gang','Ruffians','Thugs','Friends','A Friend','An Old Friend', 'A New Friend','An Old Flame','A Surprise','An Unexpected Guest','An New Arrival','Another Fellow'),
				'Nouns'=>array('State of Mind','Air','Atmosphere','Attitude','Adulation','Affection','Allegiance','Amity','Amorousness','Amour','Appreciation','Ardency','Ardour','Attachment','Aura','Backfire','Baulk','Bent','Blanch','Blench','Blink','Blues','Caprice','Carom','Case','Character','Cherishing','Colour','Condition','Cringe','Crotchet','Crush','Cue','Delight','Demur','Depression','Desire','Devotedness','Devotion','Disposition','Dodge','Doldrums','Draw Back','Duck','Dumps','Emotion','Emotion','Enchantment','Enjoyment','Falter','Fancy','Feel','Feeling','Fervour','Fidelity','Flame','Flinch','Fondness','Frame Of Mind','Friendship','Hankering','Hesitate','Humour','Idolatry','Inclination','Inclination','Individuality','Infatuation','Involvement','Jerk','Kick','Like','Lust','Mad For','Melancholy','Mind','Partiality','Passion','Personality','Piety','Pleasure','Propensity','Pull Back','Quail','Quake','Rapture','React','Rebound','Reel','Regard','Relish','Respect','Response','Scene','Semblance','Sentiment','Shake','Shirk','Shrink','Shudder','Shy Away','Soft Spot','Soul','Spirit','Spring','Start','Step Back','Stick','Stickle','Strain', 'Shrink Away','Swerve','Taste','Temperament','Tendency','Tenderness','Tremble','Turn Away','Waver','Weakness','Wince','Wish','Withdraw','Worship','Yearning','Zeal'));
		break;
		case 'Sweeping':
			$scene['Cards']=array('Sweeping'=>'1');
			$scene['Description']='Sweeping is where the Characters recover from the events of the previous Warp, and make preparations for what comes next. Sweeping can sometimes mean Gains or Revelations for the Characters. As they tend their wounds, patch their armour back together, and sharpen their blades for the next day, the Characters discover one of the enemies uniforms undamaged.';
			$scene['Titles']=array('Adjectives'=>array('Unproblematic','Aided','Helped','Restored','Revived','Rested','Healed','Elastic','Reclaimed','Redeemed','Rescued','Resilient','Reposed','Relaxing','Limp','Soothing','Quiescent','Dormant','Potential','Recharged','Activated','Recumbent','Incumbent','Acquiescent','Accepting','Receiving','Gained','Hypothetical','Grave','Idle','Suspended','Unused','Sedentary','Unreactive','Under-Active','Inactive','Reactive','Supine','Dull','Quiet','Sluggish','Passive','Indolent','Latent','Off Duty','Still','Unmoving','Static','Held','Sprawled','Sat','End','Sleepless','Restful','Restless','Cradled','Bed-ridden','Nestled','Face down','Asleep'),
				'Verbs'=>array('Resting','Recharging','Lasting','Deactivating','Disabling','Sleeping','Slumbering','Lazing','Dilating','Intensifying','Collecting','Socialising','Partying','Mobilising','Massing','Collating','Assembling','Flocking','Garnering','Involving','Concentrating','Reaping','Raising','Waiting','Hoping','Interpreting','Disseminating','Breaking','Snoozing','Convalescing','Reclining','Communing','Gazing','Cradling','Holding','Dozing','Meditating','Fixing','Repairing','Eating','Holidaying','Tending','Worrying','Contemplating','Squatting','Recovering',' Hanging','Slouching','Nesting','Hibernating','Sunning','Staying'),
				'Positions'=>array('Sat In','Sat On','Laying On','Laying By','Sitting On', 'Sitting In','Standing','Resting On','Atop','Kneeling On','Nesting In', 'Staying In'),
				'Expressions'=>array('A Doctor', 'Medics','A Nurse','The Nurses','The Ambulance Driver','A Paramedic','A Healer','Doctors','Paramedics','Early Responders','A First-Aider','A Helpful Stranger','An Unhelpful Stranger','A Passer-by','Someone From The Crowd','The Crowd'),
				'Nouns'=>array('Accomplish','Accretion','Accrual','Accumulation','Achieve','Achievement','Addition','Advance','Advance','Advancement','Advantage','Ameliorate','Annex','Attain','Attainment','Augment','Balance','Base','Basis','Be', 'At Ease','Based','Comfortable','Contingent','Dependent','Founded','Quiet','Seated','Supported','Upheld','Bed','Benefit','Boost','Bottom','Bottom Of The Barrel','Break','Breathe','Breather','Breathing Space','Bring In','Build Up','Build-Up','Calm','Calmness','Capture','Cessation','Clear','Coffee Break','Collect','Comfort','Complete','Compose Oneself','Composure','Consummate','Count','Cut','Cut-Off','Dividend','Downtime','Doze','Dream','Dreaminess','Dregs','Dross','Drowse','Earn','Earnings','Ease','Ease Off','Ease Up','Emolument','Enlarge','Enlist','Establish','Excess','Expand','Footing','Forty Winks','Found','Fulfil','Gather','Get','Glean','Gravy','Ground','Ground','Groundwork','Grow','Growth','Halt','Hang','Harvest','Have','Headway','Heel','Hike','Holder','Holiday','Hush','Idle','Idleness','Improve','Improvement','Income','Increase','Increase','Increment','Interlude','Intermission','Interval','Land','Lay','Laze','Lean','Lean','Leavings','Leftovers','Leisure','Let Down','Let Up','Letup','Lie','Lie By','Lie Down','Lie Still','Loaf','Loll','Lounge','Lucre','Lull','Make','Make A Killing','Motionlessness','Move Forward','Nap','Nap','Net','Nod','Obtain','Odds And Ends','Others','Overtake','Parley','Pause','Pay-Off','Peace','Pedestal','Pediment','Perfect','Pick Up','Pillar','Predicate','Proceeds','Procure','Produce','Profit','Prophet','Progress','Progress','Promote','Prop','Put Feet Up','Quiescence','Quiet','Quietude','Rack Up','Reach','Realize','Reap','Receipts','Recess','Recline','Recreation','Refresh Oneself','Refreshment','Relax','Relaxation','Relief','Rely','Remains','Remnant','Repose','Reside','Residual','Residue','Residuum','Respite','Return','Rise','Roost','Rump','Score','Seat','Seating','Secure','Settle','Share','Shelf','Siesta','Silence','Sit','Sit Down','Slack','Slack Off','Slacken','Sleep','Slumber','Snooze','Somnolence','Spell','Stand','Stand Still','Standstill','Stay','Stillness','Stop','Stretch Out','Stretch Out','Succeed','Superfluity','Support','Surplus','Take','Take A Break','Take A Nap','Take Five','Take It Easy','Take Life Easy','Take Ten','Take Time Out','Time Off','Tranquillity','Trestle','Turn','Unbend','Unlax','Unwind','Up','Upping','Vacation','Velvet','Win Over','Wind Down','Yield'));
		break;
		case 'Picking':
			$scene['Cards']=array('Decisions'=>'234');
			$scene['Description']='Picking is Where the Characters choose how the Story will proceed and what will happen next. Now they are faced with a choice, do they muster their forces and meet the army on the march, do they fortify their position and wait for the siege to come, or does one of them don the uniform and try to assassinate or kidnap the prince?';
			$scene['Titles']=array('Adjectives'=>array('Preferred','Selected','Alternative','Elected','Pointing','Major','Minor','Lesser','Greater','Conscious','Deliberate','Own', 'Careful','Decisive','Thorough','Elective','Selective','Willing','Choosy','Free','Pitched','Sensible','Uniform','Wise','Rhetorical','Applicable','Appropriate','Apt','Assigned','Blank','Consenting','Decided','Deducted','Designated','Desired','Described','Deterministic','Discretionary','Eligible','Esoteric','Favourite','Freewill','Good','Bad','Indecisive','Indifferent','Liked','Many','Next','Last','Opportune','Ordered','Preferable','Reasoned','Solved','Sorted','Selective','Responsible','Thoughtful','Designated','Picked','Tempted','Favoured','Chosen'),
				'Verbs'=>array('Selecting','Opting','Preferring','Electing','Deciding','Determining','Designating','Picking','Entrusting','Wanting','Assigning','Agreeing','Forsaking','Choosing','Persuading','Shunning','Favouring','Tempting','Voting','Appointing','Hesitating','Trusting','Thinking','Forcing','Evaluating','Disliking','Liking','Judging','Courting','Forking'),
				'Positions'=>array('Between','Caught Between','Choosing Between'),
				'Expressions'=>array('A Situation','A Dilemma','A Choice','A Chooser','A Decision Maker','One of the Choices','A Leader','A Chief','An Officer','A Noble','A Law-Man'),
				'Nouns'=>array('Accommodation','Accord','Accumulate','Aces','Adjudication','Ad-judicature','Adjustment','Agreement','Arbitration','Arrangement','Backbone','Bag','Best','Break Open','Choice','Compromise','Crack','Cream','Cull','Cup Of Tea','Cut','Decide Upon','Decidedness','Decision','Decisiveness','Declaration','Dent','Determination','Determination','Doggedness','Draw','Druthers','Earnestness','Elect','Elite','End','Finding','Finger','Firmness','Fix Upon','Flower','Force','Fortitude','Gather, Harvest','Go Down The Line','Grit','Hand-pick','Hit','Indent','Iron Will','Jimmy','Judgement','Mark','Name','Obstinacy','Open','Opinion','Opt For','Outcome','Perseverance','Persistence','Pick And Choose','Pick Out','Pluck','Pluck','Prearrangement','Prefer','Preference','Preference','Pride','Prime','Prize','Pry','Pull','Purpose','Purposefulness','Purposiveness','Reconciliation','Resoluteness','Resolution','Resolve','Result','Ruling','Say So','Select','Selection','Sentence','Separate','Seriousness','Settle On','Settlement','Showdown','Sift Out','Single Out','Slot','Sort Out','Spine','Strike','Stubbornness','Tab','Tag','Take','Take It Or Leave It','Tap','Call','Nod','Top','Tops','Understanding','Verdict','Volition','Will','Will Power','Winnow'));
		break;
		case 'Gain':
			$scene['Cards']=array('Gain'=>'1');
			$scene['Description']='Gains give something to one of the Characters to help move the Story on. Sometimes this might be payment for a job they did, or it might be a discovery that will directly connect to the Story. This may be information. It is normal to play a separate card to define the actual Gain that is made.';
			$scene['Titles']=array(
'Adjectives'=>array('Most','Financial','Economic','Hopeful','Clear','Net','Meanest','Acquired','Best','Personal','Current','Private','Average','Secondary','Overall','Potential','Monetary','Taxable','Excessive','Substantial','Mutual','Pecuniary','Differential','Proportional','Material','Spiritual','Selfish','Worldly','Territorial','Modest','Incremental','Tangible','Dishonest','Chargeable','Speculative','Modal','Illicit','Sordid','Achievable','Normalised','Captured','Valuable','Cheap','Expensive','Pricey','Costly','Inexpensive','Over-Priced','Bargain','Affordable','Friendly','Economical','Wasteful','Exorbitant','Luxury','Harsh','Unlikely','Likely', 'Generous','Priceless','Cherished','Wanted','Precious','High-End','High-Grade','High-Cost','High-Class','Rich','Poor','Richer','Poorer','Low-Cost','Cheaper','Silver','Golden','Silvered','Shiny','Sparkly'),
				'Verbs'=>array('Affording','Saving','Caching','Procuring','Increasing','Winning','Attaining','Obtaining','Earning','Reaching','Making','Gaining','Regaining','Achieving','Improving','Reaping','Giving','Getting','Seeking','Accruing','Generating','Earning','Providing','Seizing','Accumulating','Building','Growing','Extracting','Mining','Recovering','Retrieving','Attracting','Gathering','Attracting','Succeeding','Taking','Securing','Keeping','Stealing','Appropriating','Funding','Paying','Getting Paid','Plundering','Pillaging','Thieving','Robbing','Burgling','Capturing','Enslaving','Discounting','Learning','Clutching','Dazzling','Sparkling','Shining','Collecting'),
				'Positions'=>array('On','Priced Out','In Stock','On Sale','On Shelves','On A Map','At A','With A','On The'),
				'Expressions'=>array('A Backer','The Investors','Your Backers','Some Investors','The Customers','A Customer','A Client','The Client','An Accountant', 'The Bank','The Tax Man','Foreign Interests','A Distant Relative','A Foreign Investor','A Secret Backer','A Dangerous Client','A Rich Client'),
				'Nouns'=>array(
				'Abundance','Accomplishment','Accretion','Accrual','Accumulation','Achievement','Acquirement','Acquiring','Acquisition','Addition','Advance','Advancement','Advantage','Aggrandizement','Allowance','Allies','Ally','Annuity','Apple Of One\'s Eye','Arrival','Ascendancy','Assimilating','Attainment','Augmentation','Avail','Award','Benefit','Bite','Bonanza','Bonus','Boost','Booty','Bottom Line','Build-Up','Bull\'s-eye','Buy','Cache','Capital','Capturing','Cash','Catch','Catching','Chunk','Clean Sweep','Clean-up','Collection','Commission','Completion','Confiscating','Conquest','Control','Corner','Cut','Darling','Defeat','Defeating','Destruction','Discount','Dollars','Dinero','Dividend','Division','Dominion','Donation','Duty','Earnings','Emolument','Emoluments','Feat','Feather In Cap','Fee','Find','Finish','Fortune','Fulfilment','Friend','Friends','Funds','Gain','Gaining','Gate','Gem','Getting','Gift','Gold','Goods','Graft','Grand Slam','Grant','Grasping','Gravy','Gross','Growth','Harvest','Headway','Hike','Hit','Hoard','Holdout','Hole In One','Hot Goods','Improvement','Income','Increase','Increment','Inheritance','Interest','Jewel','Juice','Killing','Kitty','Laurels','Learning','Loot','Lucre','Make','Mastering','Mission Accomplished','Miser','Money','Nest Egg','Net','Nonpareil','Obtaining','Obtainment','Output','Out-turn','Overthrow','Paragon','Payment','Pay-off','Pearl','Pounds','Percent','Percentage','Pickings','Piece','Piece Of The Action','Pile','Pillage','Plum','Plunder','Points','Pool','Possession','Pot','Premium','Prey','Pride','Joy','Prize','Proceeds','Produce','Product','Production','Profit','Progress','Property','Proportion','Purchase','Pursuing','Pursuit','Quarry','Quota','Rapine','Rate','Ratio','Raven','Reaching','Realization','Reaping','Receipt','Receipts','Recovery','Redemption','Remuneration','Reserve','Retrieval','Return','Revenue','Reward','Riches','Richness','Rise','Salary','Salvage','Saving','Score','Sterling','Section','Securing','Security','Seizing','Share','Skim','Slice','Silver','Snatching','Split','Spoil','Stakes','Store','Stuff','Subjugation','Succeeding','Superiority','Supremacy','Surplus','Sweep','Take','Taking','Takings','Taste','Gold','Trappings','Treasure','Treasure Trove','Triumph','Turnout','Up','Upper Hand','Upping','Upset','Valuables','Value','Velvet','Wages','Wealth','Winning','Yield'));
		break;
		case 'Test':
			$scene['Cards']=array('Test'=>1,'Difficulty'=>'123');
			$scene['Description']='Some Scenes are nothing but a single Test (which usually occur during narrative play naturally), often with a lot of discussion around them. Tests are usually a single dice roll, like a Facet Test, and usually a Test of one of the Conflict Facets. A Yarn-Teller should have some idea what the Difficulty is, what will occur on a pass, a fail, and what a Stalemate could look like. Occasionally Tests may be a single roll against an Opponent (such as the Villain). You can find example Tests in the Ordeal details for a card.';
			$scene['Titles']= array(
				'Adjectives'=>array('Testy','Difficult','Tricky','Obvious','Careful','Tiring','Quick','Sudden','Empirical','Experimental','Checked','Proved','Verified','Oral','Non-verbal','Reactive','Positive','Negative','Simple','Easy','Sensitive','Crucial','Objective','Useful','Reliable','Valid','Unreliable','Useless','Static','Active','Abnormal','Stringent','Routine','Mathematical','Self','Occult','Utter','Rank','Conclusive','Fallible','Infallible','Digital','Intrinsic','Hard','Stressful','Disagreeable','Nerve-wracking','Dangerous','Unnecessary','Necessary'),
				'Verbs'=>array('Failing','Passing','Succeeding','Winning','Losing','Drawing','Studying','Working','Struggling','Staying','Trying','Testing','Practising','Explaining','Questioning','Attempting', 'Endeavouring','Aim','Hoping','Discussing','Theorising','Experimenting','Figuring','Conspiring','Pushing','Pretending','Labouring','Hurrying','Plotting','Thinking','Exerting', 'Asking','Assessing','Calling','Invalidating','Validating'),
				'Positions'=>array('Between','Failing','On The Winning Line', 'Prosecuting','Look Into','Examining','Staring At','Watching'),
				'Expressions'=>array('An Umpire','A Rival Team','A Competitor','The Tester','A Tester','An Umpire','A Referee','An Employer','An Employee','A Contestant','The Examiner','A Professor','The Teacher','A Thief','A Victim','A Bully'),
				'Nouns'=>array('Activity','Affliction','Agony','Analysis','Anguish','Appointment','Approval','Assess','Assessment','Assignment','Attempt','Berth','Billet','Blue Book','Business','Calamity','Calling','Calvary','Capacity','Career','Catechism','Catechize','Check','Chore','Confirm','Confirmation','Connection','Corroboration','Countdown','Craft','Criterion','Cross','Cross-examine','Crucible','Daily Grind','Demonstrate','Difficulty','Distress','Dry Run','Elimination','Engagement','Essay','Evaluation','Exam','Examination','Examine','Experiment','Faculty','Final','Fling','Function','Gig','Try-Out','Try-Outs','Third-Degree','Go','Grill','Grind','Handicraft','Inquest','Inquire','Inquiry','Inspection','Interrogate','Investigation','Line','Livelihood','Match Up','Means','Metier','Niche','Nightmare','Nine-to-five','Occupation','Office','Opening','Operation','Oral','Ordeal','Pick One\'s Brains','Place','Pop Quiz','Position','Post','Posting','Preliminary','Probation','Probing','Profession','Proof','Pump','Test','Query','Question','Questionnaire','Racket','Rat-Race','Scrutiny','Search','Shake Down','Shibboleth','Shotgun','Situation','Spot','Stack Up','Standard','Stint','Substantiate','Substantiation','Swindle','Task','Torment','Torture','Touchstone','Trade','Trial','Trial And Error','Trial Run','Tribulation','Try','Try On','Try On For Size','Try Out','Try-Out','Validate','Verification','Verify','Visitation','Vocation','Work','Yardstick'));
		break;
		default:
		break;
	}
	$scene['Suggested_Titles']=self::buildTitle($scene);
	return $scene;
}
static public function buildFrame($name, $conflict){
	$scenes=array();
	if (isset($conflict['Sides'])){
		foreach($conflict['Sides'] as $side=>$data){
			$scenes[]=self::buildScene($name, 'Frame', $side, 'Hook', $conflict);
			$scenes[]=self::buildScene($name,'Frame',$side,'Revelation', $conflict);
		}
	}
	return $scenes;
}
static public function buildWarp($name, $side, $conflict){
	return array(self::buildScene($name,'Loom',$side,'The Ends', $conflict),self::buildScene($name,'Loom', $side, 'The Fray', $conflict),self::buildScene($name,'Loom', $side, 'The Snag', $conflict));
}
static public function buildWeft($name, $side, $conflict){
	return array(self::buildScene($name,'Loom',$side,'Recoiling', $conflict),self::buildScene($name,'Loom', $side, 'Sweeping', $conflict),self::buildScene($name,'Loom', $side, 'Picking', $conflict));
}
static public function buildLoom($name, $conflict){
	$NoSides=$conflict['NoSides'];
	$scenes=array();
	$noLooms=2*($NoSides-1);
	$x=0;
	for($i=0;$i<=$noLooms;$i++){
		foreach ($conflict['Sides'] as $side=>$data){
		$x++;
			if (!($i*$x)%2){
				$scenes=array_merge($scenes,self::buildWeft($name, $side, $conflict));
				$scenes=array_merge($scenes,self::buildWarp($name, $side, $conflict));
			}else{
				$scenes=array_merge($scenes,self::buildWarp($name, $side, $conflict));
				$scenes=array_merge($scenes,self::buildWeft($name, $side, $conflict));
			}
		}
	}
	return $scenes;
}
static public function buildZenith($name, $conflict){
	$scenes=array();
	error_log('buildZenith ');

	foreach($conflict['Sides'] as $side=>$facets){
			$scenes[]=self::buildScene($name,'Zenith', $side, 'Ordeal', $conflict);

			$scenes[]=array('Act'=>'Zenith','For'=>$name, 'Side'=>$side, 'Scene'=>'Completion', 'Conflict'=>$conflict, 'Description'=>'Completions come in a variety of forms based on what the Primary Characters managed to do. [t13ne type="tabledisplay" array="plotresolutions" /]', 'Titles'=>
				array(
					'Expressions'=>['The Big Bad','The Murderer','The End of Level Bad Guy','A Bodyguard','A Dinner Guest','The Gathered Guests','The Suspects','An Army','A Horde','The People','A Person','The Non-Humans','The Alien','The Mutants','Those People','That Person','The Villain','The Master','The Mastermind','The Super-Villain','A Villain','A Genius','A Criminal Genius','The Napoleon of Crime','The Final Guardian','The Last Man Standing','The Winner'],
					'Verbs'=>array('Closing','Finishing','Ceasing', 'Stopping', 'Closing', 'Drawing', 'Emptying', 'Completing', 'Fulfilling', 'Dying', 'Darkening'),
					'Adjectives'=>array('Dead', 'Finished', 'Over', 'Completed', 'Concluded', 'Closed', 'Opened', 'Locked', 'Determined', 'Focused', 'Final', 'Targeted', 'Sacked', 'Perfected', 'Dumped', 'Given', 'Last', 'Terminal', 'Fatal', 'High Stakes', 'End', 'Legendary', 'Futuristic', 'Future', 'Ultimate', 'Penultimate', 'Done'),
					'Nouns'=>array('Closure', 'Conclusion', 'Finish', 'Issue', 'Outcome', 'Resolution', 'Result', 'Retirement', 'Accomplishment', 'Achievement', 'Adjournment', 'Attainment', 'Cease', 'Cessation', 'Close', 'Closing', 'Consequence', 'Consummation', 'Culmination', 'Curtain', 'Denouement', 'Desuetude', 'Determination', 'Discontinuance', 'Execution', 'Expiration', 'Expiry', 'Finale', 'Finis', 'Fulfilment', 'Omega', 'Pay-off', 'Perfection', 'Realization', 'Target', 'Termination', 'Terminus', 'Upshot', 'Wind-up', 'Bottom-Line', 'Desistance', 'Last Word', 'Sign-off', 'Wrap-up', 'Grand Final', 'The End', 'Fin', 'One Last Thing', 'That\'s all folks!')));
			$scenes[]=self::buildScene($name,'Zenith', $side, 'Gain',$conflict);
		}
	return $scenes;
}
static public function buildLogue($name, $conflict){
	$scenes=array();
	//a logue is usually no more than 1 or two Scenes;
	$logueScenes=array('Revelation', 'Ordeal', 'Test', 'Fray', 'Sweeping', 'Gain');
	$sides=['Dominant','Pressed','Above','Below','Internal','External','Shadows'];
	$length=round($conflict['NoSides']*(self::RNG(20,85)/100));
	for ($i=0; $i<=$length;$i++){
		$scenes[]=self::buildScene($name, 'Logue', array_rand(array_flip($sides),1), array_rand(array_flip($logueScenes),1),$conflict);
	}
	return $scenes;
}

static public function buildNewConflict($size,$post_id,$scene=''){
	$facetsarr=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	$cf=$facetsarr;
	shuffle($facetsarr);
	$sides=ceil(1+(T13Boons::getBoonDraw(self::RNG(1,(2+$size*8)))));
	$newConflict=array('Size'=>$size,'Post'=>$post_id,'NoSides'=>$sides,'Sides'=>array());
	for($i=0;$i<$sides;$i++){
		$conf=T13Types::$conflictSides[$i];
		$exp=array_values(array_rand(array_flip($conf['Titles']['Expressions'],self::RNG(1,1+round($size/2)))));
		$facets=array_values(array_rand(array_flip($cf,$size)));
		$newConflict['Sides']=array($conf['Type']=>['Expressions'=>$exp,'Facets'=>$facets]);
	}
	if (is_array($scene)){
		$newConflict['Titles'][]=self::buildTitle($scene);
	}else{
		$newConflict['Titles'][]=self::buildTitle(self::buildScene('An Example Scene for A New Conflict','Logue', T13Types::$conflictSides[self::RNG(0,$size-1)], 'Random', $oldConflict));
	}
		$statblock=T13Statblock::randomiseStats(0,$alt, intval(round(13*$size/24)),24);
		$newConflict['Statblock']=T13Statblock::plotStats($statblock, $size, $post_id);
		// error_log('after plot stats ='.json_encode($newConflict['Statblock']));
		$newConflict['StatHTML']=T13Statblock::writeStatblockSC($post_id);
		error_log('New Conflict: '.json_encode($newConflict));
	return $newConflict;
}
static public function buildStory($name,$conflict){
	error_log('Building Story '.$name);
	if (!isset(self::$deck)){self::buildDecks();}
	$story = array('StorySize'=>'Story','Name'=>$name, 'Conflict'=>$conflict,'Scenes'=>array());
	if (self::RNG(1,10)==10){$story['Scenes']=array_merge($story['Scenes'],self::buildLogue($name.' -Prologue',$conflict));}
	$story['Scenes']=array_merge($story['Scenes'],self::buildFrame($name.' -Frame',$conflict));
	if (self::RNG(1,10)==10){$story['Scenes']=array_merge($story['Scenes'],self::buildLogue($name.' -Interlogue',$conflict));}
	$story['Scenes']=array_merge($story['Scenes'],self::buildLoom($name.' -Loom',$conflict));
	if (self::RNG(1,10)==10){$story['Scenes']=array_merge($story['Scenes'],self::buildLogue($name.' -Exologue',$conflict));}
	$story['Scenes']=array_merge($story['Scenes'],self::buildZenith($name.' -Zenith',$conflict));
	if (self::RNG(1,10)==10){$story['Scenes']=array_merge($story['Scenes'],self::buildLogue($name.' -Epilogue',$conflict));}
	return $story;
}
static public function buildSandBox($name,$conflict){
	error_log('Building SandBox '.$name);
		if (!isset(self::$deck)){self::buildDecks();}
	$sandbox = array('StorySize'=>'Sandbox','Name'=>$name, 'Conflict'=>$conflict,'Sandbox'=>array());
	foreach($conflict['Sides'] as $side=>$sideVal){
		$sandbox['Sandbox']['Sides'][$side]=array('Expressions'=>[],);
		foreach($sideVal['Expressions'] as $i=>$exp){
			$sandbox['Sandbox']['Sides'][$side]['Expressions'][$exp]=array('Scenes'=>[],'Expressions'=>[],'Nouns'=>[],'Verbs'=>[],'Adjectives'=>[],'Positions'=>[]);
			$sandbox['Sandbox']['Sides'][$side]['Expressions'][$exp]['Scenes']=self::buildScene('Sandbox "Scene" for '.$name, 'Sandbox', $side, 'Random', $conflict);

			foreach($sideVal['Facets'] as $i=>$facet){
				$facetTitles=T13Facets::getFacetTitles($facet);
				$newExpressions=$facetTitles['Expressions'];
				$ne=array_rand(array_flip($newExpressions));
				unset($newExpressions);
				$nouns=$facetTitles['Nouns'];
				$noun=array_rand(array_flip($nouns),2);
				unset($nouns);
				$verbs=$facetTitles['Verbs'];
				$verb=array_rand(array_flip($verbs),2);
				unset($verbs);
				$adjectives=$facetTitles['Adjectives'];
				$adj=array_rand(array_flip($adjectives),2);
				unset($adjectives);
				$positions=$facetTitles['Positions'];
				$position=array_rand(array_flip($positions),2);
				unset($positions);
				$sandbox['Sides'][$side]['Expressions'][$exp]['Nouns'][]=$noun[0];
				$sandbox['Sides'][$side]['Expressions'][$exp]['Verbs'][]=$verb[0];
				$sandbox['Sides'][$side]['Expressions'][$exp]['Adjectives'][]=$adj[0];
				$sandbox['Sides'][$side]['Expressions'][$exp]['Positions'][]=$position[0];
				$sandbox['Sides'][$side]['Expressions'][$exp]['Expressions'][$ne]=array('Scenes'=>[self::buildScene('Sandbox "Scene" for '.$name, 'Sandbox', $side, 'Random', $conflict)],'Nouns'=>[$noun[1]],'Verbs'=>[$verb[1]],'Adjectives'=>[$adj[1]],'Positions'=>[$position[1]]);
			}

		}

	}
	return $sandbox;
}
static public function buildSubConflict($nusize=2,$post_id=0,$oldConflict='',$scene=''){
	$nusize = intval($nusize);
	$oldsize = intval(count($oldConflict['Sides']['Dominant']['Facets']));
	$sides=ceil(1+(T13Boons::getBoonDraw(self::RNG(1,(2+$nusize*8)))));
	if ($sides>7){$sides=7;}
	if ($sides<2){$sides=2;} //these are hard limits and imposed here for safety.
	$newConflict=array('Debug'=>'BuildSubConflict', 'Size'=>$nusize, 'post_id'=>$post_id, 'NoSides'=>$sides,'Sides'=>array(),'Titles'=>array());
	$facetsarr=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	$cf=array();
	if (!is_array($oldConflict)){
		$psize=$nusize+self::RNG(1,$nusize);
		if ($psize>24){$psize=24;}
		$oldConflict=self::buildNewConflict($psize,$post_id,self::buildScene('An Example Scene', 'Logue', $side, 'Random'));}
	$expressions=array();
	foreach($oldConflict['Sides'] as $sidename=>$side){
		$exp=count($side['Expressions']);
		$perExp=ceil(count($side['Facets'])/$exp);
		foreach($side['Expressions'] as $e=>$ntity){
			$expressions[]=array('Entity'=>$ntity,'Side'=>$sidename,'Facets'=>array_values(array_rand($side['Facets'],$perExp)));
		}
	}
	shuffle($expressions);
	for($i=0;$i<$sides;$i++){
		$side=T13Types::$conflictSides[$i];
		if (!isset($newConflict['Sides'][$side])){
			$newConflict['Sides']=array($side=>['Expressions'=>[],'Facets'=>[]]);
			if (count($newConflict['Sides'][$side]['Facets']<$nusize)){
				$e=array_pop($expressions);
				$newConflict['Sides'][$side]['Expressions'][]=$e['Expressions']['Entity'];
				$newConflict['Sides'][$side]['Facets']=array_keys(array_flip(array_merge($newConflict['Sides'][$side]['Facets'],$e['Facets'])));
			}elseif(count($newConflict['Sides'][$side]['Facets']>$nusize)){
				$newConflict['Sides'][$side]['Facets']=array_slice($newConflict['Sides'][$side]['Facets'],0,$nusize);
			}
			$newConflict['Titles'][]=self::buildTitle(self::buildScene('An Example Scene', 'Logue', $side, 'Random', $oldConflict));
		}
	}
	if (!isset($oldConflict['Statblock'])){
		// error_log('no conflict statblock');
			$statblock=T13Statblock::randomiseStats(0,$post_id, intval(round(13*$nusize/24)),24);
			// error_log('added random statblock'.json_encode($statblock).' to plot');
		}else{
			// error_log('statblock specified');
			$statblock=T13Statblock::getStats($post_id,$oldConflict['Statblock']);
			// error_log('just used the Statblock I was passed'.json_encode($statblock));
		}
		$newConflict['Statblock']=T13Statblock::plotStats($statblock, $nusize, $post_id);
		// error_log('after plot stats ='.json_encode($newConflict['Statblock']));
		$newConflict['StatHTML']=T13Statblock::writeStatblockSC($post_id);
		// error_log('New Conflict Stats ='.$newConflict['StatHTML']);
		error_log('New Sub-Conflict:'.json_encode($newConflict));
return $newConflict;
}
static public function buildNeConflict($size='2',$alt=0, $new=true,$name='This Example Scene'){
	$size=intval($size);
	$newConflict=array('Debug'=>' buildConflict ', 'Size'=>$size, 'Post'=>$alt);
	$facetsarr=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	if (!is_null($conflict)){
		$cf=array();
		$cf[]=array_rand(array_flip($facetsarr),1);
		foreach (T13Types::$conflictSides as $i=>$side){
			if (isset($conflict['Sides'][$side['Type']]['Expressions'])){

			}
			if (isset($conflict['Sides'][$side['Type']]['Facets'])){
				$cf=array_keys(array_flip(array_merge($cf, $conflict['Sides'][$side['Type']]['Facets'])));
			}
		}
	}else{
		$cf=$facetsarr;
	}
	shuffle($cf);
	error_log('Shuffled conflict facets='.json_encode($cf));
	if ($new){
		error_log('New Conflict Evoked');
		$sides=ceil(1+(T13Boons::getBoonDraw(self::RNG(1,(2+$size*8)))));
		if ($sides>7){$sides=7;}
		if ($sides<2){$sides=2;} //these are hard limits and imposed here for safety.
		//error_log($sides.' Sides to new Conflict');
		$newConflict=array('NoSides'=>$sides, 'Sides'=>array());
		if (count($cf)<$sides*$size){
			$cf=$facetsarr;
			shuffle($cf);
		}
		$perSide=ceil(count($cf)/$sides);
		//error_log('per side ='.$perSide);
		if ($perSide>$size){
			$perSide=$size;
			//error_log('Too many perside, reduce to actual size '.$size);
		}
		$fafosi=array_chunk($cf,$perSide);
		//error_log('fafosi created from chunks'.json_encode($fafosi));
		foreach($fafosi as $i=>$facets){
			if($i>=$sides){break;}
			//error_log('iterating $fafosi['.$i.'] facets='.json_encode($facets) );
			$nuf=$size-count($facets);
			if($nuf>0){
				//error_log('nuff bigger than 0');
				//error_log('nuf='.$nuf);
				$left=array_values(array_diff($facetsarr, array_keys(array_flip($facets))));
				error_log('left='.json_encode($left));
				$nu=array_rand(array_flip($left),$nuf);
				if (!is_array($nu)){
					$nu=array($nu);
				}
				$fa=array_merge($facets,$nu);
				//error_log('proposed facets='.json_encode($fa));
				$newConflict['Sides'][T13Types::$conflictSides[$i]['Type']]=array('Facets'=>array_slice($fa,0,$size));
			}else{
				$newConflict['Sides'][T13Types::$conflictSides[$i]['Type']]=array('Facets'=>array_slice($facets,0,$size));
			}
		}
		if (!isset($conflict['Statblock'])){
		// error_log('no conflict statblock');
			$statblock=T13Statblock::randomiseStats(0,$alt, intval(round(13*$size/24)),24);
			// error_log('added random statblock'.json_encode($statblock).' to plot');
		}else{
			// error_log('statblock specified');
			$statblock=T13Statblock::getStats($alt,$conflict['Statblock']);
			// error_log('just used the Statblock I was passed'.json_encode($statblock));
		}
		$newConflict['Statblock']=T13Statblock::plotStats($statblock, $size, $alt);
		// error_log('after plot stats ='.json_encode($newConflict['Statblock']));
		$newConflict['StatHTML']=T13Statblock::writeStatblockSC($alt);
		// error_log('New Conflict Stats ='.$newConflict['StatHTML']);
		error_log('Final New Conflict='.json_encode($newConflict));

		for($i=0;$i<$sides*$size;$i++){
			$scene=self::buildScene($name, 'Logue', T13Types::$conflictSides[self::RNG(1,$sides)]['Type'] , 'Random', $newConflict);
			$newConflict['Titles'][]=self::buildTitle($scene);
		}

		return $newConflict;
	}else{
		return $conflict;
	}
}
static public function buildArc($name, $post_id,$conflict, $subplots=1){
	error_log('building Chapter Arc'.$name);
	if (!is_array($conflict)||$conflict==NULL||count($conflict['Sides']['Dominant']['Facets'])<2){
		error_log('buildArc called without conflict!');
		$conflict=self::buildNewConflict(self::RNG(2,6),$post_id);
	}
	$story=self::buildStory($name,$conflict);
	$story=self::buildFromStory($name, $conflict, $story, $post_id, $subplots);
	$arc=array('Name'=>$name,'StorySize'=>'Volume','MainStory'=>$story, 'Chapters'=>$subplots);
	return $arc;
}
static public function buildVolume($name, $post_id,$conflict, $chapterArcs=1){
	error_log('Building Volume '.$name);
	if (!is_array($conflict)||$conflict==NULL||count($conflict['Sides']['Dominant']['Facets'])<6){
		error_log('buildVolume called without conflict!');
		$conflict=self::buildNewConflict(self::RNG(6,12),$post_id);
	}
	$story=self::buildStory($name,$conflict);
	$story=self::buildFromStory($name, $conflict, $story, $post_id, $chapterArcs);
	$volume=array('Name'=>$name,'StorySize'=>'Volume','MainStory'=>$story, 'ChapterArcs'=>$chapterArcs);
	return $volume;
}
static public function buildEpic($name, $post_id,$conflict, $noVolumes=1){
	error_log('Building Epic'.$name);
	if (!is_array($conflict)){
		if ($conflict==NULL){
			if (count($conflict['Sides']['Dominant']['Facets'])<12){
				error_log('buildEpic called without suitable conflict!');
				$conflict=self::buildNewConflict(self::RNG(12,18),$post_id);
			}
		}else{
			error_log('Conflict is Null');
		}
	}else{
		error_log('Conflict isn\'t an array');
	}
		$story=self::buildStory($name,$conflict);
		$story=self::buildFromStory($name, $conflict, $story, $post_id, $noVolumes);
		$epic=array('Name'=>$name,'StorySize'=>'Epic','MainStory'=>$story, 'Volumes'=>$noVolumes);

	return $epic;
}
static public function buildCycle($name,$post_id,$conflict, $epics=1){
	error_log('building cycle '.$name);
	if (is_array($conflict)){
		if($conflict!=NULL){
			if (count($conflict['Sides']['Dominant']['Facets'])<24){
				error_log('buildCycle called without suitable conflict! '.count($conflict['Sides']['Dominant']['Facets']) .' '.json_encode($conflict));
				$conflict=self::buildNewConflict(24,$post_id,self::buildScene('An Example Scene', 'Logue', $side, 'Random', $conflict));

			}
		}else{
			error_log('Cycle Conflict is Null');

		}
	}else{
		error_log('Conflict isn\'t an Array!');
	}
	$story=self::buildSandBox($name,$conflict);
	//$story=self::buildFromStory($name, $conflict, $story, $post_id, $epics);
	$cycle=array('Name'=>$name,'StorySize'=>'Cycle','MainStory'=>$story, 'Epics'=>1);
	error_log('Built Cycle.'.json_encode($cycle));
	return $cycle;
}
static public function buildFromStory($name, $conflict, $story, $post_id, $number){
	error_log('building "'.$name.'"" story');

	$noScenes=count($story['Scenes']);
	while($number){
		$s=self::RNG(0,$noScenes-1);
		$scene=$story['Scenes'][$s];
		if (isset($scene['Act'])){
			if (!isset($story['Acts'])){$story['Acts']=array();}
			if (!isset($story['Acts'][$scene['Act']])){
				$title=self::buildTitle($scene);
				$scene['Conflict']['Titles'][]=$title;
				$story['Acts'][]=array($scene['Act']=>self::buildFromAct($title, $conflict, $scene['Act'], $name, $post_id));
				if (!isset($scene['MainStory'])){
					$neoSize=self::RNG(1,intval($story['Act'][$scene['Act']]['ActStory']['Conflict']['Size'])-1);
					$neoconf=self::buildSubConflict($neoSize,$post_id,$scene);
					$ti=self::buildTitle($scene);
					$neoconf['Titles'][]=$ti;
					$story['Scenes'][$s]=['MainStory'=>self::buildFromConflict($ti,$name, $neoconf,$post_id)];
					$number--;
				}
			}
		}
	}

	return $story;
}
static public function buildTitle($data){
	$titles=array(
		'Verbs'=>array('Conflicting', 'Engaging', 'Illuminating', 'Crushing', 'Talking', 'Raiding', 'Brooding', 'Prancing', 'Dancing', 'Stalking', 'Fighting','Standing','Waiting','Lurking','Killing','Slaying','Moving','Falling','Dying','Climbing','Stalling','Hanging','Toppling','Firing','Drowning','Voting'),
		'Nouns'=>array('Dragon', 'Lion', 'Eagle', 'Tiger', 'Salmon', 'Shark', 'Sword', 'Axe', 'Flame', 'Gun','Unicorn','Spider', 'Scorpion', 'Centipede', 'Human', 'Ape', 'Monkey', 'Giant', 'Faery','Squirrel','Tengu','Goblin','Earth', 'Ice', 'Song','Poem', 'Saga', 'Adventure', 'Doom', 'Wyrd', 'Loom', 'Fate','Goddesses', 'Gods', 'Spirit', 'Howl', 'Cry', 'Message', 'Warchief', 'Armourer', 'Weaponsmith', 'Ironmonger', 'Fisher', 'King', 'Rat', 'Demon', 'Skull', 'Bones','Hawk', 'Dove', 'Rose', 'Crown', 'Thorns', 'Teeth', 'Force', 'Church', 'Scroll','Music', 'Tale', 'Bane', 'Wolf', 'Moon', 'Flower', 'Holly', 'Bat', 'Crow', 'Coyote', 'Dog', 'Cat', 'Talbot', 'Hound', 'Hunter', 'Bow', 'Boat', 'Ship', 'School', 'Fish', 'Sheep', 'Goat', 'Bull', 'Halberd', 'Gauntlet', 'Shadow', 'Light', 'Mystery', 'Falcon', 'Gryphon', 'Griffin', 'Girl', 'Woman', 'Mother', 'Father','Man', 'Boy', 'Game', 'Grace', 'Beauty', 'Shield', 'Copper', 'Silver', 'Violin', 'Guitar', 'Horns', 'Mage', 'Sorcerer', 'Wizard', 'Witch', 'Blood', 'Oak', 'Elm', 'Elder', 'Hazel', 'Pine', 'Weasel', 'Mouse', 'Thrush', 'Nightingale', 'Milk', 'Quartz', 'Granite', 'Clay', 'Mud', 'Enchanter', 'Sorceress', 'Enchantress', 'Spell-thrower', 'Werewolf', 'Werebear', 'Wereboar','Weretiger','Werefox','Werehyena','Wyvern','Lizard','Monster', 'Vampire','Prince','Princess','King','Queen','Elephant','Parchment','Map','Pirate','Tarot','Knife','Dagger', 'Gun','Marble','Statue','Musician','Hangman','Ferryman','Farmer','Guild','Coven','Covenant','Agreement','Hog','Hare','Rabbit','Living','Dead','Predator','Hunter','Huntsman','Bear','Badger','Raven','Shop','Store','Home','House','Rock','Stone','Curse','Spell','Glyph','Wyrd','Word','God','Horse','Horses','Donkey','Mule','Wife','Husband','Time-traveller','Ring','Wolves','Tavern', 'Pub','Inn','Hound','Skeleton', 'Zombie','Magpie','Vulture','Buzzard','Snake','Cobra','Python','Eel'),
		'Adjectives'=>array('Red', 'Blue','Black','White','Yellow','Orange','Green','Dark','Enormous','Small','Rebellious', 'Brown', 'Pink', 'Rose', 'Warm', 'Cold', 'Flaming', 'Bloody', 'Terrible', 'Good', 'Bad','Steel','Gold', 'Flint', 'Stone','Chaotic','Lawful','Awful','Disastrous','Worse','Worst','Badder','Brainless','Hungry','Ravening','Approaching','Coming','Piercing','Living','Conflicted','Cursed','Giddy','Dizzy','Terrible','Haunted','Smelly','Stinking','Foul','Stagnant', 'Cruel','Crude','Rude','Haggard','Golden','Timid','Weak','Strong','Wild','Wet','Dry','Narrow','Wide','Big','Little'),
		'Positions'=>array('On','By','In','At','Of','&amp;','Versus'),
		'Expressions'=>array('Him','He','Her','She','Them','Some People','Your Friends','Your Love','The Boyfriend','The Girlfriend','A Partner','A Potential Lover','A Couple','I','We','Those People','Enough People','The PCs','One of the PCs','A Rival','A Rival Group','A Rival Company','A Husband','A Father','A Family Man','A Woman','A Mother','A Wife','A Housewife','A Single Parent','An Uncle','An Aunt','A Cousin','A Brother','A Sister','A Neice','A Nephew','A Pet','An Assistant','A Lieutenant', 'Her Majesty', 'His Majesty',)

	);
	$masterStory=$data['For'];
	$index=0;
//sets default before the searching
	if (is_array($titles['Nouns'])){
		$index+=count($titles['Nouns']);
		$noun=T13Types::arrayGetValue($titles['Nouns'],self::RNG(0,$index));
		$second=T13Types::arrayGetValue($titles['Nouns'],self::RNG(0,$index));
	}
	if (is_array($titles['Adjectives'])){
		$index+=count($titles['Adjectives']);
		$adj=T13Types::arrayGetValue($titles['Adjectives'],self::RNG(0,$index));
		$other = T13Types::arrayGetValue($titles['Adjectives'],self::RNG(0,$index));
	}
	if (is_array($titles['Verbs'])){
			$index+=count($titles['Verbs']);
		$verb =  T13Types::arrayGetValue($titles['Verbs'],self::RNG(0,$index));
	$verbing=T13Types::arrayGetValue($titles['Verbs'],self::RNG(0,$index));
	}
	if (is_array($titles['Positions'])){
			$index+=count($titles['Positions']);
		$position=T13Types::arrayGetValue($titles['Positions'],self::RNG(0,$index));
		$altpos=T13Types::arrayGetValue($titles['Positions'],self::RNG(0,$index));
	}
	if (is_array($titles['Expressions'])){
			$index+=count($titles['Expressions']);
		$exp=T13Types::arrayGetValue($titles['Expressions'],self::RNG(0,$index));
		$expre=T13Types::arrayGetValue($titles['Expressions'],self::RNG(0,$index));
	}
	if (isset($data['Conflict']['Sides'])){
		foreach($data['Conflict']['Sides'] as $side=>$facets){
			if (array_key_exists('Expressions', $facets)){
				$titles['Expressions']=array_merge($titles['Expressions'],$facets['Expressions']);
			}else{error_log('Expressions not found: '.json_encode($facets));}
			$facet=$facets['Facets'][0];
			$index+=intval($facet);
			$facetTitles=T13Facets::getFacetTitles($facet);
			if (isset($facetTitles)){
				$titles['Nouns']=array_merge($titles['Nouns'],$facetTitles['Nouns']);
				$titles['Adjectives']=array_merge($titles['Adjectives'],$facetTitles['Adjectives']);
				$titles['Verbs']=array_merge($titles['Verbs'],$facetTitles['Verbs']);
				$titles['Positions']=array_merge($titles['Positions'],$facetTitles['Positions']);
				$titles['Expressions']=array_merge($titles['Expressions'],$facetTitles['Expressions']);
			}
		}
		if (!isset($data['Side'])){
			$data['Side']=$data['Conflict']['Sides'][array_rand(array_flip(array_keys($data['Conflict']['Sides'])))];
		}
	}else{error_log('No data for ["Conflict"]["Sides"] found in '.json_encode($data));}
	$master=T13Types::arrayGetValue($masterStory, self::RNG(0,$index) );
	if (isset($data['Scene']['Titles']['Nouns'])){
		$titles['Nouns']=array_merge($titles['Nouns'],$data['Scene']['Titles']['Nouns']);
		$titles['Verbs']=array_merge($titles['Verbs'],$data['Scene']['Titles']['Verbs']);
		$titles['Adjectives']=array_merge($titles['Adjectives'],$data['Scene']['Titles']['Adjectives']);
		$titles['Positions']=array_merge($titles['Positions'],$data['Scene']['Titles']['Positions']);
		$titles['Expressions']=array_merge($titles['Expressions'],$data['Scene']['Titles']['Expressions']);
	}
	foreach(T13Types::$conflictSides as $i=>$type){
		if ($data['Side']==$type['Type']){
			$titles['Nouns']=array_merge($titles['Nouns'],$type['Titles']['Nouns']);
			$titles['Adjectives']=array_merge($titles['Adjectives'],$type['Titles']['Adjectives']);
			$titles['Verbs']=array_merge($titles['Verbs'],$type['Titles']['Verbs']);
			$titles['Positions']=array_merge($titles['Positions'],$type['Titles']['Positions']);
			$titles['Expressions']=array_merge($titles['Expressions'],$type['Titles']['Expressions']);
			break;
		}
	}
	$index+=count($titles['Nouns'])+count($titles['Adjectives'])+count($titles['Verbs'])+count($titles['Positions'])+count($titles['Expressions']);
	if (is_array($titles['Nouns'])){
		$noun=T13Types::arrayGetValue($titles['Nouns'],self::RNG(0,$index));
		$second=T13Types::arrayGetValue($titles['Nouns'],self::RNG(0,$index));
	}
	if (is_array($titles['Adjectives'])){
		$adj=T13Types::arrayGetValue($titles['Adjectives'],self::RNG(0,$index));
		$other = T13Types::arrayGetValue($titles['Adjectives'],self::RNG(0,$index));
	}
	if (is_array($titles['Verbs'])){
		$verb =  T13Types::arrayGetValue($titles['Verbs'],self::RNG(0,$index));
		$verbing=T13Types::arrayGetValue($titles['Verbs'],self::RNG(0,$index));
	}
	if (is_array($titles['Positions'])){
		$position=T13Types::arrayGetValue($titles['Positions'],self::RNG(0,$index));
		$altpos=T13Types::arrayGetValue($titles['Positions'],self::RNG(0,$index));
	}
	if (is_array($titles['Expressions'])){
		$exp=T13Types::arrayGetValue($titles['Expressions'],self::RNG(0,$index));
		$expre=T13Types::arrayGetValue($titles['Expressions'],self::RNG(0,$index));
	}
	$act=$data['Act'];
	$patterns=array(
		"{$exp}",
		"{$exp} {$verb}",
		"{$adj} {$noun}",
		"{$adj} {$verb}",
		"{$other} {$noun}",
		"The {$noun} &amp; The {$second}",
		"{$verb} {$noun}",
		"{$verb} {$adj}",
		"The {$adj} {$noun}",
		"{$position} {$noun}",
		"{$noun} {$position} {$second}",
		"The {$verb}, {$adj} {$noun}",
		"Never {$verbing}",
		"The {$other} {$verbing} {$noun}",
		"{$verb} {$noun} {$position} {$exp}",
		"The {$noun} {$position} The {$second}",
		"{$noun} {$altpos} {$adj} {$second}",
		"{$position} {$noun}, {$altpos} {$second}",
		 "{$exp} {$position} The {$second}",
		 "The {$adj}",
		 "{$adj} &amp; {$other}",
		 "No {$verb}",
		 "{$exp} &amp; The {$noun} {$position} {$second}",
		 "The {$noun}'s {$second}",
		 "{$exp} vs {$expre}",
		 "{$exp} &amp; {$expre}",
		 "{$exp} {$position} {$adj} {$noun}",
		"{$exp}, {$expre}, And The {$adj}, {$other} {$noun}",
		 "{$expre} {$altpos} {$verbing} {$noun}"
	);
	//error_log ('patterns='.json_encode($patterns));
	unset ($titles);
	$title=array(T13Types::arrayGetValue($patterns,self::RNG(0,$index)),T13Types::arrayGetValue($patterns,self::RNG(0,$index)),T13Types::arrayGetValue($patterns,self::RNG(0,$index)));
	error_log('Suggested Titles: '.join(', ',$title));
	return $title;
}
static public function buildFromAct($name, $conflict, $act, $storyname, $post_id){
	error_log('BuildFromAct '.$storyname.' '.$act);
	$act=array('Act'=>$act, 'For'=>$storyname, 'ActStory'=>array() );
	if (isset($conflict)){
		if (is_array($conflict)){

			$size=count($conflict['Sides']['Dominant']['Facets']);

			switch($act['Act']){
				case 'Logue':
					$act['Description']='Logue Subplots are short, sudden events that focus on a single issue.';
					$nuSize=self::RNG((1+floor($size/12)),(1+floor($size/7)));

					break;
				case 'Frame':
					$act['Description']='Frame Subplots are full of world-building with a focus on individual sides of the conflict (during the Hooks).';
					$nuSize=self::RNG((1+floor($size/5)),(1+floor(2^$size/3)));

					break;
				case 'Loom':
					$act['Description']='Loom Subplots pit various sides of the Conflict against each other via each sides Warps and Wefts.';
					$nuSize=self::RNG((2+floor($size/3)),(1+floor(19*$size/24)));

					break;
				case 'Zenith':
				$act['Description']='Zenith Subplots tie up threads, bringing about confrontations, battles and wars. Final victory or failure are always options during a Zenith Subplot.';
					$nuSize=self::RNG((1+floor($size/7)),(1+floor(7*$size/11)));

					break;
				default:
					die('Unexpected Act encountered.');
				break;
			}
			error_log('New Size ='.$nuSize);
			$nuconflict=self::buildSubConflict($nuSize,$post_id, $conflict, true,$name);
			$act['ActStory']=self::buildFromConflict($name,$storyname, $conflict, $post_id);
		}
	}
	return $act;
}
static public function buildFromConflict($name,$for, $conflict, $post_id){
	error_log('buildFromConflict for '.$for);
	$tract=array( 'For'=>$for, 'MainStory'=>array());
	if (isset($conflict)){
		if (is_array($conflict)){
			if (is_array($conflict['Sides']['Dominant']['Facets'])){
			$size=count($conflict['Sides']['Dominant']['Facets']);
			error_log('Size ='.$size);
			switch($size){
				case 1:
				case 2:
					$tract['MainStory']=self::buildStory(array_rand(array_flip(['The Story Of ', 'A Tale Of ', 'A Song Of','The Tale Of ','The Ballad Of '])).$name.'',$conflict);
					break;
				case 3:
				case 4:
				case 5:
				case 6:
					$tract['MainStory']=self::buildArc(array_rand(array_flip(['The Arc Of ', 'A Tale Of ', 'A Song Of ','The Case Of ', 'The Secret Of ','The Ballard Of ','The Diary Of'])).$name.'', $post_id, $conflict);
					break;
				case 7:
				case 8:
				case 9:
				case 10:
				case 11:
					$tract['MainStory']=self::buildVolume(array_rand(array_flip(['The Book Of ', 'Libre ', 'Volume: ', 'The Tome Of ','The Diary Of ','The '])).$name.'',$post_id, $conflict);
					break;
				case 12:
				case 13:
				case 14:
				case 15:
				case 16:
				case 17:
				case 18:
				case 19:
				case 20:
				case 21:
				case 22:
				case 23:$tract['MainStory']=self::buildEpic(''.array_rand(array_flip(['The Song Of ', 'The Saga Of ', 'The Epic Of ', 'The History Of ', 'The Prophecy Of '])).$name.'',$post_id, $conflict);
					break;
				case 24:
					$tract['MainStory']=self::buildCycle(array_rand(array_flip(['The Cycle Of ', 'The Legend Of ', 'The Myth Of '])).$name.' (Cycle)',$post_id, $conflict);
					break;
				default:
				die('Conflict Size Error');
				break;
				}

			}else{error_log ("Does this look like a conflict?    ".json_encode($conflict));}
		}
	}
	return $tract;
}

static public function yarnTeller($spread,$hand,$conflict, $name, $terms){
	error_log('YarnTeller');
	$html='<!-- yarnTeller conflict='.json_encode($conflict);
	 if (isset($spread)){
		if (isset($hand)){
			if (is_array($hand)){
				$handsize=count($hand);
			}else{
				$handsize=$hand;
			}
		}
		$html.=' handsize='.$handsize;
		if (isset(self::$deck)){
			if (is_array(self::$deck)){
				$decks=count(self::$deck)/54;
			}elseif(is_numeric($deck)){
				$decks=$deck;
				$deck=self::buildDecks($decks);
			}

		}else{
			$decks=2;
			$deck=self::buildDecks($decks);
		}
		$html.=' decks='.$decks;
		//$gotspread=self::getSpread($spread,0);
		//$html.=' gotspread='.json_encode($gotspread);

		if($handsize==$hand){
			$hand=self::drawHand($handsize);
			if (count($hand)<$handsize){
				//we reached the end of the deck;
				self::endRound();
				//anything else we need to do?
			}
		}
		$ret=array();
		$post_id=$terms['post_id'];
		switch ($spread){
			case "Cycle":
				$requiredcards=self::buildCycle($name,$post_id, $conflict);
			break;
			case "Epic":
				$requiredcards=self::buildEpic($name,$post_id,$conflict);
			break;
			case "Volume":
				$requiredcards=self::buildVolume($name,$post_id,$conflict);
			break;
			case "Arc":
				$requiredcards=self::buildArc($name,$post_id,$conflict);
			break;
			case "Story":
				$requiredcards= self::buildStory($name,$post_id,$conflict);
			break;
			case "Frame":
				$requiredcards = self::buildFrame($name,$post_id,$conflict);
			break;
			case "Loom":
				$requiredcards = self::buildLoom($name,$post_id, $conflict);
			break;
			case "Zenith":
				$requiredcards = self::buildZenith($name,$post_id, $conflict);
			break;
			case "Warp":
			 $requiredcards = self::buildWarp($name, $post_id,$conflict);
			 break;
			case "Weft":
				$requiredcards = self::buildWeft($name,$post_id, $conflict);
			break;
			case "Scene":
				$requiredcards = self::buildScene($name,$post_id, 'Pressed', 'Random', $conflict);
			break;
			default:
				$requiredcards = die('Hey there, what were you hoping to find?');
			break;
		}
			$html.= ' requiredcards='.json_encode($requiredcards);
			$html.=' //-->';
			error_log('dumping required cards'.json_encode($requiredcards));
			$html.=self::dealCards($requiredcards, $hand, $handsize,$terms);
			$html.='';
			unset($ret);
			unset($gotspread);
			return $html;
		}/*else{
			die('That ain\'t no spread o\'mine.');
		}*/

	}
	static public function getSpread($spread, $i){
		foreach (self::$narrativeSpreads as $spred){
			if ($spred['Type']==$spread){
				return array('Depth'=>$i,'Spreda'=>$spred);
			}
		}
	}
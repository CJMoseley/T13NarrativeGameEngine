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
 * Fired during plugin activation. Geometry
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Geometry{
	public static $geometries= array(
			array('Name'=>'Void', 'Geometry'=>0, 'Geometry_Description'=>'Void Characters are a composite of all other numbers, and a reflection of nothingness as well. They have infinite potential, at least unless some other force acts upon them. ', 'Chi'=>'<strong>Gain Chi</strong> when you encourage others to join you, speak, or are inclusive.', 'Yang'=>'<strong>Gain Yang</strong> by acting knowlegeable, even if they know nothing.', 'Yin'=>'<strong>Gain Yin</strong> when they act unambitious, uninterested or bored.', 'Stress'=>'<strong>Gain Stress</strong> when you are tested, examined, studied, measured or compete against others (allowing ranking to take place).', 'Goal'=>'Erratic','Goal_Description'=>'They define their goals only to ignore them, they may work towards some goal, only to abandon it later.','Gift'=>'Boundless', 'Gift_Description'=>'They are powerful, full of limitless potential, and seem indefatigable. They add +1 Success Level to any action that requires energy, activity or motion.','Suggested_Personality'=>4,'Harmonic'=>[1,2,3,4,5,10], 'Dissonant'=>[6,7,8,12,13],'Proficiencies'=>[['Name'=>'Void','Description'=>'An empty space, often left after something has fallen away, a complete lack of anything, something ineffective, unenforceable or not binding.','Facet'=>'Wyrd'],['Name'=>'Potential','Description'=>'A measure of possibility, or something that isn’t true, but has a possibility of becoming true. Often used to describe a latent skill or ability that may be developed.','Facet'=>'Liberty'],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Circle', 'Geometry'=>1, 'Geometry_Description'=>'Circle Characters are determined innovators, creative-thinkers and natural loners and are often perceived as leaders.','Chi'=>'<strong>Gain Chi </strong> by acting confidently, boldly, or alone.', 'Yang'=>'<strong>Gain Yang </strong> by acting self-important, domineering or courageous.', 'Yin'=>'<strong>Gain Yin </strong> by acting self-critical, stubborn, or innovative.', 'Stress'=>'<strong>Gain Stress</strong> when you follow orders or do what you are told.', 'Goal'=>'Personality','Goal_Description'=>'They define their goals from their Personality (or Personalities), usually this is based on their Motivations and is usually expressed as a Quest of the same Facet. An Idol character, for example, motivated by a desire to be adored, may make it their personal quest to brave some famous peril, or charm the most people they can (by becoming famous).', 'Gift'=>'Determination', 'Gift_Description'=>'They are determined people. They add +1 Success Level on any Action where determination, resolve, self-sacrifice, fixation or stubbornness may help.', 'Suggested_Personality'=>4, 'Harmonic'=>[1,3,5,8], 'Dissonant'=>[4,6,12,13],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]), 
			array('Name'=>'Half-Moon', 'Geometry'=>2, 'Geometry_Description'=>'Half-Moon Characters are co-operative, harmony seeking diplomats, but they can become manipulative and petty.', 'Chi'=>'<strong>Gain Chi </strong> by co-operating with others (including following orders), acting diplomatic, or patient.', 'Yang'=>'<strong>Gain Yang </strong> by acting sensitive, petty, or detail-orientated.', 'Yin'=>'<strong>Gain Yin </strong> by acting intuitive, childish, or supportive.', 'Stress'=>'<strong>Gain Stress</strong> when you see conflict.', 'Goal'=>'Group','Goal_Description'=>'They are dedicated to the goals of a group or pact. Sometimes they will even dedicate themselves to helping another Character achieve their personal Goals. Their goals will chance and shift as they join and leave groups, and make or lose allies.', 'Gift'=>'Harmony', 'Gift_Description'=>'The Half-Moon Geometry are sensitive, diplomatic people. They add +1 Success Level on any Action where they are working with others.', 'Suggested_Personality'=>13, 'Harmonic'=>[2,4,8,10], 'Dissonant'=>[5,7,11,13],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Triangle', 'Geometry'=>3,'Geometry_Description'=>'Triangle Characters are intelligent, creative, expressive, often artistic types. They love to talk, being entertaining and all ways have a story to tell, but it may turn gossipy and superficial.', 'Chi'=>'<strong>Gain Chi </strong> when you communicate, express yourself, or tell a story.', 'Yang'=>'<strong>Gain Yang </strong> by acting optimistic, creatively, intelligently, or by exaggerating.', 'Yin'=>'<strong>Gain Yin </strong> by acting emotionally volatile, superficial, insincere, or by sharing gossip.', 'Stress'=>'<strong>Gain Stress</strong> when someone will not listen to you.', 'Goal'=>'Core','Goal_Description'=>'Their goals are based upon their Core(s), usually defined as a Quest that opposes their Core Facet&#39;s Quest. For example, a Wielder Core (Burden) does not themselves have an Obtain Quest, their Goal instead is to protect or guard the Descendant they wield and keep some enemy or rival from Obtaining it.', 'Gift'=>'Quick', 'Gift_Description'=>'The Triangle Geometry makes people who are witty, quicker thinkers. They add +1 Success Level to any Action where speed, wit, agility, swiftness or rapid thinking may be a helpful factor.', 'Suggested_Personality'=>11, 'Harmonic'=>[1,3,6,10], 'Dissonant'=>[2,4,7,9],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Square', 'Geometry'=>4, 'Geometry_Description'=>'Square Characters are dependable, trustworthy and hard-working, but can be rigid and narrow-minded.','Chi'=>'<strong>Gain Chi </strong> when you are productive, helpful, or conservative.', 'Yang'=>'<strong>Gain Yang </strong> by building, acting rigid, or bossy.', 'Yin'=>'<strong>Gain Yin </strong> by complaining, thinking literally or working hard.', 'Stress'=>'<strong>Gain Stress</strong> when you take a Failure Level from any source.', 'Goal'=>'Social','Goal_Description'=>'They prefer social goals, like making many friends, being a good member of society, helping those in need, supporting the local community. Such goals can often easily accommodate group goals and the goals of friends.', 'Gift'=>'Stability', 'Gift_Description'=>'The Square Geometry makes people more stable. They add +1 Success Level to any Action where stability, strength, security, constancy, steadiness, or maturity may be a factor.', 'Suggested_Personality'=>3, 'Harmonic'=>[1,4,9,13], 'Dissonant'=>[3,5,7,12],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),	
			array('Name'=>'Pentagon', 'Geometry'=>5,'Geometry_Description'=>'Pentagon Characters are the freedom-loving risk-takers, they may be fearless, or foolish.', 'Chi'=>'<strong>Gain Chi </strong> by acting brave, reckless, or by having fun.', 'Yang'=>'<strong>Gain Yang </strong> by acting rebellious, trying to effect change, or emotional.', 'Yin'=>'<strong>Gain Yin </strong> by acting resilient, flexible or foolish.', 'Stress'=>'<strong>Gain Stress</strong> when they make any commitment.', 'Goal'=>'Story','Goal_Description'=>'These Characters are only interesting in having a great story to tell at the end. They leap at any chance to test, prove, or improve themselves, and this will often land them neck-deep in a narrative that will sweep them along.', 'Gift'=>'Adventurous', 'Gift_Description'=>'The Pentagon Geometry are more adventurous than others. They add +1 Success Level on any Action that is risk-taking, rash, reckless, potentially hazardous, brave or foolhardy.', 'Suggested_Personality'=>5, 'Harmonic'=>[2,3,5,10], 'Dissonant'=>[1,6,8,12],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Hexagon', 'Geometry'=>6,'Geometry_Description'=>'The Hexagon are as hard working and responsible as the Square, but with more wit and creativity. They tend to think on the big picture, rather than the details.', 'Chi'=>'<strong>Gain Chi </strong> by nurturing others (which may be seen as meddling and include giving them Chi, or making food), or being supportive, or by dealing with the big-picture.', 'Yang'=>'<strong>Gain Yang </strong> by acting sensible, responsible, or self-important.', 'Yin'=>'<strong>Gain Yin </strong> by acting romantic, sensual, or self-indulgent.', 'Stress'=>'<strong>Gain Stress</strong> if you do not do something to help when you can.', 'Goal'=>'Grand','Goal_Description'=>'They are likely to set themselves the most ambitious, grand and lofty goals. These are the sort to declare they will be Emperor of Known Space, or change the world somehow. Sometimes they even manage it.', 'Gift'=>'Vision', 'Gift_Description'=>'The Hexagon Character is often a visionary, this might mean they see actual visions, or that they have a very developed imagination. They add +1 Success Level to any action to do with perception, prophecy or visual arts.', 'Suggested_Personality'=>23, 'Harmonic'=>[3,4,6,12], 'Dissonant'=>[1,5,7,10],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Heptagon', 'Geometry'=>7,'Geometry_Description'=>'The Heptagon (sometimes Septagon) Character is the intellectual, but intuitive, deep — to the point of over — thinker. They can be wise, but may become aloof.', 'Chi'=>'<strong>Gain Chi </strong> by making guesses (positing theories) or plans, asking questions, and analysing things.', 'Yang'=>'<strong>Gain Yang </strong> by changing your mind, being proved right, or being pessimistic.', 'Yin'=>'<strong>Gain Yin </strong> by being intuitive, being proved wrong, or acting aloof.', 'Stress'=>'<strong>Gain Stress</strong> when you lie.', 'Goal'=>'Deep','Goal_Description'=>'They set Deep goals for themselves, these may be grave, serious, sincere, intense, heartfelt, abstruse, artful, obscure or profound goals that often give deeper meaning to the Character&#39;s life, and mainly express as a broadly educational, spiritual, magical, technological, charitable, scientific or artistic pursuit.', 'Gift'=>'Wisdom', 'Gift_Description'=>'The Heptagon Geometry makes people wise, they are deep thinkers, philosophical, knowledgeable, but intuitive and spiritual as well. They add +1 Success Level to any Action where wisdom, knowledge, logic, calculation, or raw intellect may be a factor.', 'Suggested_Personality'=>15, 'Harmonic'=>[1,5,7,11], 'Dissonant'=>[2,3,6,10],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Octagon', 'Geometry'=>8,'Geometry_Description'=>'Octagon Characters are powerful, ambitious, but ultimately materialistic individuals.', 'Chi'=>'<strong>Gain Chi </strong> by acting disciplined, materialistic, or ambitious.', 'Yang'=>'<strong>Gain Yang </strong> by acting rebellious, bossy, or generous.', 'Yin'=>'<strong>Gain Yin </strong> by acting opinionated, relaxed, or persevering.', 'Stress'=>'<strong>Gain Stress</strong> when you take a Failure Level from any source.', 'Goal'=>'Status-Quo','Goal_Description'=>'These characters are invested in preserving the status quo, they dislike change, and like things they way they are. Their goals are usually purely material and are always a reflection of the status quo, personal goals include riches, luxuries,safety, security and purely physiological needs, such as food, clothing or shelter.', 'Gift'=>'Manifestation', 'Gift_Description'=>'The Octagon Geometry makes people better at physically manifesting their dreams, this can make them into powerful politicians, business people, cut-throats and thieves or even feared magicians. They add +1 Success Level to any Action to do with the physical, material manifestation of their dreams, schemes, and desires. ', 'Suggested_Personality'=>2, 'Harmonic'=>[2,4,8,11], 'Dissonant'=>[5,7,9,13],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Nonagon', 'Geometry'=>9, 'Geometry_Description'=>'Nonagon Characters are deeply spiritual people, intuitive, compassionate and caring, they are natural humanitarians, and passionate fighters against injustice, especially in the status quo.', 'Chi'=>'<strong>Gain Chi </strong> by acting generous, compassionate, or idealistic.', 'Yang'=>'<strong>Gain Yang </strong> by arguing, acting passionate or knowledgeable.', 'Yin'=>'<strong>Gain Yin </strong> by agreeing with another or acting Big-headed/arrogant or submissive.', 'Stress'=>'<strong>Gain Stress</strong> when you percieve another being harmed.', 'Goal'=>'Humanitarian','Goal_Description'=>'They are driven to save human lives, alleviate pain and suffering, and generally help people. They may change the world, reform society, and will succeed, die or become rich and famous trying.', 'Gift'=>'Spirit', 'Gift_Description'=>'The Nonagon Geometry makes Characters more spiritual, more intuitive and compassionate. They feel deep, strong connections with others (and even things and places), and this can cause them to rise to protect, help, aid and defend others from injustice and harm. They add +1 Success Level to any Action where their Spirit or Passion may help, especially aiding, helping, protecting or defending others or fighting injustice.', 'Suggested_Personality'=>18, 'Harmonic'=>[1,3,9,12], 'Dissonant'=>[2,7,8,10],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Decagon', 'Geometry'=>10,'Geometry_Description'=>'Decagon Characters are like Circle Characters turned up to, well 10. They are more independent than Circles, but also work better with others.', 'Chi'=>'<strong>Gain Chi </strong> when you act alone, or for the good of others.', 'Yang'=>'<strong>Gain Yang </strong> by acting responsible, sincere or dogmatic.', 'Yin'=>'<strong>Gain Yin </strong> by acting loyal, determined, or intolerant.', 'Stress'=>'<strong>Gain Stress</strong> when affected by any emotion.', 'Goal'=>'Impossible','Goal_Description'=>'These Characters set impossible, absurd, impractical goals that they can fail at over and over again, each time achieving something more. These Goals are often set by the Character&#39;s Personality, but are amplified in scale, scope and difficulty to be practically unachievable. For example, an Idol could choose to brave a truly terrible threat, or to charm everyone, the whole world.', 'Gift'=>'Resolve', 'Gift_Description'=>'The Decagon Geometry makes people determined to the point of working themselves to the bone to achieve their goals. They add +2 Success Levels to any Action but take a Flesh Wound for that resolve.', 'Suggested_Personality'=>19, 'Harmonic'=>[3,5,8,10], 'Dissonant'=>[2,4,6,11],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Undecagon', 'Geometry'=>11,'Geometry_Description'=>'Undecagon Characters are mystically amplified Half-Moon Characters (they are a 2 turned up to 11!). Undecagon Characters can be so intuitive as to even believe themselves Psychic, and even prove it to some.', 'Chi'=>'<strong>Gain Chi </strong> by co-operating with others or being patient, knowledgeable, or vague.', 'Yang'=>'<strong>Gain Yang </strong> by acting sensitive, disciplined, or intelligent.', 'Yin'=>'<strong>Gain Yin </strong> by acting psychic, immature or altruistic.', 'Stress'=>'<strong>Gain Stress</strong> when you are specific or proved wrong.', 'Goal'=>'Secret','Goal_Description'=>'The Character has secrets, and one of the things they keep secret is what their own goals are. Often their secret goals may seem to ally with another’s, but often this alliance will be a one way street, with the Secret Goal, or just the secrecy itself, eventually undermining the pact. Sometimes a character’s secret goal may simply be to keep a secret, if this is so, it is rarely their own secret they are keeping, but someone else’s important secret.' , 'Gift'=>'Psychic', 'Gift_Description'=>'The Undecagon Geometry is so about intuition, and so in tune with the world around them, that it makes people seem psychic. They add +1 Success Level on any Action where they might be able to claim Psychic assistance, resonance or similar.', 'Suggested_Personality'=>14, 'Harmonic'=>[2,5,7,13], 'Dissonant'=>[4,8,9,10],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Dodecagon', 'Geometry'=>12, 'Geometry_Description'=>'Dodecagon Characters are something of an intersection of circles, half-moons and triangles, they are gifted communicators and creative types, but with strong social ties that off-set rugged independence.', 'Chi'=>'<strong>Gain Chi </strong> when you cooperate with others, or act creatively.', 'Yang'=>'<strong>Gain Yang </strong> by arguing, fighting with or insulting others.', 'Yin'=>'<strong>Gain Yin </strong> by agreeing with others, asking their opinon, or following them.', 'Stress'=>'<strong>Gain Stress</strong> when you are unable to make your point.', 'Goal'=>'Melded','Goal_Description'=>'The Character has Melded goals, that incorporate their Personality, Group and Core goals, and except when they are diametrically opposed, they incorporate the goals of their companions into their own goals. Sometimes when opposed by someone in the group they will simply pause that goal while the opposing person is around.', 'Gift'=>'Communication', 'Gift_Description'=>'The Dodecagon Geometry makes characters extremely communicative. In fact, they may add +1 Success Levels to any attempt to communicate with another character, this weirdly rises to + 2 Success Levels if the Dodecagon and the target do not share a language.', 'Suggested_Personality'=>9, 'Harmonic'=>[1,2,3,12], 'Dissonant'=>[4,5,7,8],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']]),
			array('Name'=>'Triskaidecagon', 'Geometry'=>13,'Geometry_Description'=>'Triskaidecagon Characters are a sort of dark reflection of the stability and social nature of the Square. ', 'Chi'=>'<strong>Gain Chi </strong> when you are focused, pragmatic, or evasive.', 'Yang'=>'<strong>Gain Yang </strong> by acting independent, assured, or determined.', 'Yin'=>'<strong>Gain Yin </strong> by acting diligent, pedantic or by complaining.', 'Stress'=>'<strong>Gain Stress</strong> whenever outcomes are uncertain, or unobvious.', 'Goal'=>'Complex','Goal_Description'=>'They set themselves long and complex goals that have many steps and many contingencies. Their plans always assume luck will be factor (usually working against them) and they break huge goals down into smaller manageable tasks. Because of this, they are often focused on achieving the next step in their complex plan. They can appear capricious or mercurial as their goals seem to shift and change as the steps unfold, but know that there is always a much greater plan in motion in their head.', 'Gift'=>'Luck', 'Gift_Description'=>'The Triskaidecagon Geometry makes people have extreme luck. Sadly you can never tell if the luck will be good or bad. On any Action they may roll a 1d6 Luck dice. <div class="t13ne-tablewrap"><table class="t13ne-table"><thead><tr><th>Roll</th><th>Result</th></tr></thead><tbody><tr><td>1</td><td>+2 Failure Levels</td></tr><tr><td>2-3</td><td>+1 Failure Level</td></tr><tr><td>4-5</td><td>+1 Success Level</td></tr><tr><td>6</td><td>+2 Success Levels</td></tr></tbody></table></div>', 'Suggested_Personality'=>6, 'Harmonic'=>[7,8,9,13], 'Dissonant'=>[1,3,4,5],'Proficiencies'=>[['Name'=>'','Description'=>'','Facet'=>''],['Name'=>'','Description'=>'','Facet'=>'']])
		);
		private static $numerology = array(
			array("Letter"=>'bh',"Number"=>2),
			array("Letter"=>'gh',"Number"=>3),
			array("Letter"=>'sh',"Number"=>3),
			array("Letter"=>'ch',"Number"=>8),
			array("Letter"=>'ph',"Number"=>8),
			array("Letter"=>'th',"Number"=>9),
			array("Letter"=>'ts',"Number"=>9),
			array("Letter"=>'tz',"Number"=>9),
			array("Letter"=>'a',"Number"=>1),
			array("Letter"=>'b',"Number"=>2),
			array("Letter"=>'c',"Number"=>2),
			array("Letter"=>'d',"Number"=>4),
			array("Letter"=>'e',"Number"=>5),
			array("Letter"=>'f',"Number"=>8),
			array("Letter"=>'g',"Number"=>3),
			array("Letter"=>'h',"Number"=>8),
			array("Letter"=>'i',"Number"=>1),
			array("Letter"=>'j',"Number"=>1),
			array("Letter"=>'k',"Number"=>2),
			array("Letter"=>'l',"Number"=>3),
			array("Letter"=>'m',"Number"=>4),
			array("Letter"=>'n',"Number"=>5),
			array("Letter"=>'o',"Number"=>7),
			array("Letter"=>'p',"Number"=>8),
			array("Letter"=>'q',"Number"=>1),
			array("Letter"=>'r',"Number"=>2),
			array("Letter"=>'s',"Number"=>6),
			array("Letter"=>'t',"Number"=>4),
			array("Letter"=>'u',"Number"=>6),
			array("Letter"=>'v',"Number"=>6),
			array("Letter"=>'w',"Number"=>6),
			array("Letter"=>'x',"Number"=>6),
			array("Letter"=>'y',"Number"=>1),
			array("Letter"=>'z',"Number"=>7),
			array("Letter"=>'-',"Number"=>0),
			array("Letter"=>"'","Number"=>0),
			array("Letter"=>'.',"Number"=>0)
		);
		
		public static $keys = array(
			array('Key'=>'C','Description'=>'A pure key of innocence, naive courage and simple, triumphant strength when Major. When Minor it becomes languishing, longing, obscure, sad and love-sick.','Alt'=>'B&sharp;','Syllable'=>'Do','Colour'=>['Red','#FF0000'],'Frequency'=>130.81,'Sharps'=>0,'Flats'=>0, 'Relative_Minor'=>9, 'Fifth'=>7, 'Fourth'=>5, 'index'=>0, ),
			array('Key'=>'C&sharp;','Description'=>'An emotionally constrained and confused Major key, it can smile or shed a tear, but extreme emotions become confusing and erratically expressed. In Minor it becomes a lamentation, a disappointed wail, a sigh of lost love and failed friendships.', 'Alt'=>'D&flat;','Syllable'=>'Di/Ra','Colour'=>['Violet','#CF9BFF'],'Frequency'=>138.59,'Sharps'=>7,'Flats'=>5, 'Relative_Minor'=>10, 'Fifth'=>8, 'Fourth'=>6, 'index'=>1),
			array('Key'=>'D','Description'=>'A key of triumph — powerful and majestic, with perhaps a hint of cruelty and can be quarrelsome, at least in Major, where it is a key for declarations and war-cries. In Minor it becomes softer, more serious, more feminine and even melancholic or pious.','Alt'=>'E𝄫','Syllable'=>'Re','Colour'=>['Yellow','#FFFF00'],'Frequency'=>146.83, 'Sharps'=>2,'Flats'=>0, 'Relative_Minor'=>11,'Fifth'=>9, 'Fourth'=>7, 'index'=>2),
			array('Key'=>'D&sharp;','Description'=>'A key of intimacy, delicate, devotional, it has an air of prayer to it, although it can feel cruel and hard too, and can turn haunting, brooding, plaintive, feminine, or despairing as it shifts from Major to Minor.','Alt'=>'E&flat;','Syllable'=>'Ri/Ma','Colour'=>['Flesh','#F1DADA'],'Frequency'=>155.56,'Sharps'=>0,'Flats'=>3, 'Relative_Minor'=>0, 'Fifth'=>10, 'Fourth'=>8, 'index'=>3),
			array('Key'=>'E','Description'=>'A key of delights, joy, and noisy pleasures in Major, that becomes more naive, innocent and has an air of hopeful optimism against great adversity in Minor.','Alt'=>'F&flat;','Syllable'=>'Mi','Colour'=>['Sky-blue','#E4FBFF'],'Frequency'=>164.81,'Sharps'=>4,'Flats'=>0, 'Relative_Minor'=>1, 'Fifth'=>11, 'Fourth'=>9, 'index'=>4),
			array('Key'=>'F','Description'=>'A key of compliance, calm and acceptance in Major, that becomes depressive, even funereal, and miserable in Minor.','Alt'=>'E&sharp;','Syllable'=>'Fa','Colour'=>['Deep-Red','#800000'],'Frequency'=>174.61,'Sharps'=>0,'Flats'=>1, 'Relative_Minor'=>2, 'Fifth'=>0, 'Fourth'=>10, 'index'=>5),
			array('Key'=>'F&sharp;','Description'=>'A key of besting difficulties, the sigh of relief, and long fought success in Major, but in Minor it is a key of discontent, resentment and gloom-filled passions.','Alt'=>'G&flat;','Syllable'=>'Fi/Se','Colour'=>['Bright-Blue','#00CDFF'],'Frequency'=>185.00,'Sharps'=>6,'Flats'=>6, 'Relative_Minor'=>3, 'Fifth'=>1, 'Fourth'=>11, 'index'=>6),
			array('Key'=>'G','Description'=>'A key of peaceful, gentle emotion, in Major, it can even achieve an idyllic, buccolic quality, like a faithful friend, but in Minor it becomes uneasy, resentful, discontented, and dwells in the past.','Alt'=>'G','Syllable'=>'Sol/So','Colour'=>['Orange','#FF6500'],'Frequency'=>196.00,'Sharps'=>1,'Flats'=>0, 'Relative_Minor'=>4, 'Fifth'=>2, 'Fourth'=>0, 'index'=>7),
			array('Key'=>'G&sharp;','Description'=>'The key of eternity, it sits in judgement, inevitable and as grave as death, even in Major. In Minor it becomes a complaint, a struggle with difficulty, that squeezes the heart to death.','Alt'=>'A&flat;','Syllable'=>'Si/Lo','Colour'=>['Magenta','#FF00FF'],'Frequency'=>207.65, 'Sharps'=>0,'Flats'=>4, 'Relative_Minor'=>5,'Fifth'=>3, 'Fourth'=>1, 'index'=>8),
			array('Key'=>'A','Description'=>'A key of hope, innocent love, youth and deep satisfaction while Major, even in Minor it is still tender and caring, although it carries a more pious, sometimes even sanctimonious, more mature attitude.','Alt'=>'B𝄫','Syllable'=>'La','Colour'=>['Green','#2FCD30'],'Frequency'=>220.00,'Sharps'=>3,'Flats'=>0, 'Relative_Minor'=>6, 'Fifth'=>4, 'Fourth'=>2, 'index'=>9),
			array('Key'=>'A&sharp;','Description'=>'A cheerful key, full hope and aspiration in Major, that turns very sour, surly, mocking and dour in Minor. In Major it is the sound of a clear conscience, in Minor the sound of one so laden with guilt that suicide is on their mind.','Alt'=>'B&flat;','Syllable'=>'Li/Te','Colour'=>['Steel','#8D8B8D'],'Frequency'=>233.08,'Sharps'=>0,'Flats'=>2, 'Relative_Minor'=>7, 'Fifth'=>5, 'Fourth'=>3, 'index'=>10),
			array('Key'=>'B','Description'=>'A key of wild passions and jarringly coloured emotions in Major, but in Minor this becomes the key of patience, submission to another will and utter devotion to a higher power.','Alt'=>'C&flat;','Syllable'=>'Ti/Si','Colour'=>['Blue','#0000FE'],'Frequency'=>246.94,'Sharps'=>5,'Flats'=>7, 'Relative_Minor'=>8, 'Fifth'=>6, 'Fourth'=>4, 'index'=>11),
			array('Key'=>'C','Description'=>'A pure key of innocence, naive courage and simple, triumphant strength when Major. When Minor it becomes languishing, longing, and love-sick.','Alt'=>'B&sharp;','Syllable'=>'Do','Colour'=>['Red','#FF0000'],'Frequency'=>261.63, 'Sharps'=>0,'Flats'=>0, 'Relative_Minor'=>9,'Fifth'=>7, 'Fourth'=>5, 'index'=>12),
		);

public static $pitches = array(
			array('Pitch'=>'C','House'=>'Support', 'Description'=>'Support of others is the greatest of blessings. This beat is about allies, friends, pacts, communities, charity, networking, wish fulfilment, and occasionally love.','Questions'=>'Who are this Character’s friends and supporters? What club or society memberships might they have? Who knows them, and for what? Are they famous, infamous or anonymous? To whom do they belong, who do they love and who do they care about? Is the Character supportive of others, or do they rely on others for support? What are their ideals and hopes for the future? Who are they friends with, and what ideals do they share with them? Who logically and ethically are their enemies? If a vote was taken, how many would side with the Character, and how many vote against?', 'Ruler'=>'Earth / Aquarius / Saturn / Uranus','Alt'=>'B&sharp;','Syllable'=>'Do','Harmonic_Facets'=>'Dominion, Heresy, Quiet', 'Suggested_Tones'=>'Conversational, Political, Fantasy, Suspense, Combative'),
			array('Pitch'=>'C&sharp;','House'=>'Order', 'Description'=>'Order is the spoken command, and a shared communication. This beat is about communication, transportation, distribution, generosity, development, intelligence, gadgets, ephemera, locomotion, siblings, or occasionally directions.','Questions'=>'How does the Character or group communicate with others, are they talkative, vivid and loquacious or stoic, staid and mute? Are they generous, sharing and caring, or mean, selfish and friendless? Are they social, asocial or anti-social? What is their neighbourhood like, do they get on with those who live near them? When they leave their home are they more likely to walk, take public transport, drive, be driven or even fly? What are they working on? What are they carrying in their pockets?', 'Ruler'=>'Gemini / Mercury', 'Alt'=>'D&flat;','Syllable'=>'Di/Ra','Harmonic_Facets'=>'Gossamer', 'Suggested_Tones'=>'Immoral, Sincere, Conversational, Political'),
			array('Pitch'=>'D','House'=>'Health', 'Description'=>'Health is more than a physical and mental state, it affected by what we eat and what we do. This beat is about routines, employment, services, jobs, training, skills, talents, diets, courage, vitality, strength, or occasionally about healthcare.','Questions'=>'How does this Character keep themselves healthy and safe? What illnesses do they suffer from? Do they have some regime they maintain, a strict diet, a gym routine? Do they have to maintain, perform maintenance, or conform to a regular schedule? Does their work keep them healthy, out in the fresh air working their body, or do they have a desk job and little free time, leading them to a hunched and sallowed future? Who do they look to for leadership, and who looks to them? Who works for them, what sort of boss are they, and who do they work for, what is their own boss like?', 'Ruler'=>'Metal / Virgo / Mercury','Alt'=>'E𝄫','Syllable'=>'Re','Harmonic_Facets'=>'Rook, Virtue', 'Suggested_Tones'=>'Political, Comedy, Eerie, Historical, Restful, Combative, Romantic, Medical'),
			array('Pitch'=>'D&sharp;','House'=>'Passage', 'Description'=>'Passage can mean a corridor or travel, and travel broadens the mind, and either has purpose. This beat is about purpose, education, training, learning, foreign travel, law, ethics, expansion, cultural differences, beliefs or occasionally exploration.','Questions'=>'Where is this Character going? Where have they been, and what did they see there? What does the Character see when they close their eyes? What do they dream at night, especially those nights they awaken in a cold sweat? To what cultures have they been exposed, how broad-minded are they? How well-educated, well-travelled, well-read, and well-informed are they? Have they been taught, were they raised in a religion or with a certain philosophy? What laws and ethics do they support? Who do they know over seas, or on other worlds, and how, and why, do they communicate? ', 'Ruler'=>'Saggitarius / Jupiter','Alt'=>'E&flat;','Syllable'=>'Ri/Ma','Harmonic_Facets'=>'Trial, Yonder', 'Suggested_Tones'=>'Visceral, Combative, Odyssey'),
			array('Pitch'=>'E','House'=>'Life', 'Description'=>'Life is all-encompassing, and full of firsts. This beat is about a first, often this will be a Hook for a new Plot, but it can be about first-impressions, first-love, first-car, first-house, first-job, first-boss, first-kill, first-death, first-loss, first-win, or occasionally self-image.','Questions'=>'What is the nature of the Character or group? How resourceful are they? Why are they the way they are? What are their history, beginnings, outlook and impressions? Where did they come from, and what do they want to achieve? What do they look like?', 'Ruler'=>'Wood / Aries / Mars','Alt'=>'F&flat;','Syllable'=>'Mi','Harmonic_Facets'=>'Inertia, Nature, Orthodox, Wyrd', 'Suggested_Tones'=>'Suspense, Saga, Visceral, Historical, Magical, Sincere, Combative, Action'),
			array('Pitch'=>'F','House'=>'Kingdom', 'Description'=>'Kingdom is also called the house of Enterprise. This beat is about governance, authority, fathers, patriarchy, society, achievements, motivations, ambitions and occasionally the character’s career.','Questions'=>'What are this Character’s achievements, what have they done with their life? What are this Character’s motivations, are they still seeking something or have they reached some conclusion? What prestige, honours or accolades have they ever received? What are their responsibilities? What drives them, do they want to make the world a better place, or see it burn? What are their ambitions, what do they want to be, do they have a career goal, or are they just drifting from job to job? What is their Leadership style, or are they more of a follower, in which case, what sort of authority do they respect?', 'Ruler'=>'Capricorn / Saturn','Alt'=>'E&sharp;','Syllable'=>'Fa','Harmonic_Facets'=>'Enigma', 'Suggested_Tones'=>'Dark, Saga, Investigative, Mystery, Creative'),
			array('Pitch'=>'F&sharp;','House'=>'Parent', 'Description'=>'Parent is also othe House of Home and Family. This beat is about heritage, ancestry, motherhood, guardianship, pets, comfort, security, environment, household matters, and occasionally a house.','Questions'=>'Who is this Character or Group? Who were their people, who are they descended from? What is their house, their home, their homeland? How comfortable, secure and protective is their home? What unconscious resources are available to them? What buried treasure might they find if they were to dig in their own backyard?', 'Ruler'=>'Cancer / Luna','Alt'=>'G&flat;','Syllable'=>'Fi/Se','Harmonic_Facets'=>'None/Any', 'Suggested_Tones'=>'Fantasy, Surreal, Magical, Creative'),
			array('Pitch'=>'G','House'=>'Rehabilitation', 'Description'=>'Rehabilitation is also called the House of Sacrifice. This beat is often a Revelation, but can be about blackmail, secrecy, privacy, seclusion, retreat, intuition, completion, miracles, luck, addictions, and occsionally healing.','Questions'=>'What is this Character keeping private? What are their secrets? What are their unconscious desires and goals? What are the revelations that they seek? What do they want to know? How much can they guess? How intuitive, lucky, mystical or magical are they? What and whose secrets are they trying to unearth, how well protected are they, and which secrets are they trying to keep and from whom? Who do they forgive, and who will remain unforgiven? Who are their unknown enemies, those who oppose them in secret, perhaps while claiming to be friends? Where do they go to be alone? What do they do when they are alone? Where do they sleep, meditate, rest or pray?', 'Ruler'=>'Fire / Pisces/ Jupiter / Neptune','Alt'=>'G','Syllable'=>'Sol/So','Harmonic_Facets'=>'Fury', 'Suggested_Tones'=>'Creative, Mystery, Action, Suspense'),
			array('Pitch'=>'G&sharp;','House'=>'Spouse', 'Description'=>'Spouses are partners in all things, and marriages the original contracts and diplomatic treaties. This beat is about partnerships, marriages, contracts, business, diplomacy, bureaucracy or officials.','Questions'=>'Who does this Character trust? Who are their business partners, lovers and friends? How diplomatic and balanced is the Character? Who do they call an enemy, and who a friend? What side of the Conflict are they on, is it the side you imagine? Who are the Character’s Rivals and Allies and what are they like?', 'Ruler'=>'Libra / Venus','Alt'=>'A&flat;','Syllable'=>'Si/Lo','Harmonic_Facets'=>'Key, Miasma, Sin', 'Suggested_Tones'=>'Investigative, Eerie, Immoral, Romantic'),
			array('Pitch'=>'A','House'=>'Gain', 'Description'=>'Gain is gathering of things of value. This beat is usually a Gain, but it might be about money, wealth, ownership, possessions, acquisitions, cultivation, substance or occasionally self-worth.','Questions'=>'What is this Character or group worth? Do they have resources, and if so are they poor, rich or are material things immaterial to them? What is the culture and nature of the Character, are they of substance, and what do they value?', 'Ruler'=>'Water / Taurus / Venus','Alt'=>'B𝄫','Syllable'=>'La','Harmonic_Facets'=>'Burden, Craft, Phoenix', 'Suggested_Tones'=>'Romantic, Dark, Creative, Medical, Immoral'),
			array('Pitch'=>'A&sharp;','House'=>'Child','Description'=>'Children naturally find the fun in things, bringing their parents and friends great pleasure. This beat is about entertainment, games, gambling, risk-taking, creative self-expression, actual children (or fertility), or occasionally romantic infatuations.','Questions'=>'How is this Character still like a child? Do they play games, take risks, or are they mature and stable instead? What entertainment brings them pleasure? What do they enjoy and who do they enjoy it with? Do they express themselves creatively, through hobbies like drama, art, music and dance, do they bring this creative expression to their day job, or are they instead a creative wasteland? If they were to go to an art gallery, cinema or concert hall, what would catch their attention, what would they hope to see or hear?', 'Ruler'=>'Leo / Sol','Alt'=>'B&flat;','Syllable'=>'Li/Te','Harmonic_Facets'=>'Liberty, Zeal', 'Suggested_Tones'=>'Medical, Surreal, Sincere, Comedy, Political'),
			array('Pitch'=>'B','House'=>'Death', 'Description'=>'Death is the great Transformer, and it points to cycles of death and of life. These beats are about commitments, business deals, sexual relationships, self-transformation, rebirth, regneration, karma and debts.','Questions'=>'What does this Character fear? What or who is holding them back? Who will they become when they realise they are can transform themselves? What passions drive the Character? Who would they leave it all for? What is this Character’s inevitable doom? How much do they owe others, whether aid or revenge? How much will they payback and how much will they pay forwards?', 'Ruler'=>'Scorpio / Mars / Pluto','Alt'=>'C&flat;','Syllable'=>'Ti/Si','Harmonic_Facets'=>'Awe, Jeer', 'Suggested_Tones'=>'Emotional, Action, Odyssey, Emotional, Comedy, Dark, Combative'),
		);
		static public function getKey($key){
			$tone = intval($key);
			$kno=abs(ceil($tone/12));
			if ($kno<1){$kno=1;}
			$freq = ($kno>2?($kno-2):1)/(($kno<4)?(4-$kno):1);
			$key=self::$keys[abs($tone%12)];
			$key['Frequency']=$key['Frequency']*$freq;
			return ['Key'=>$key, 'KeyNo'=>$kno];
		}
		static public function writeKeys($key){
			$num = intval($key);
			$tone = self::getKey($num);
			$kno = $tone['KeyNo'];
			$key=$tone['Key'];
            $hex=$key['Colour'][1];
            $bg='255,255,255';
            $alpha = 0.1;
            $hex1=floor(hexdec($hex[1].$hex[2])/2);
            $hex2=floor(hexdec($hex[3].$hex[4])/2);
            $hex3=floor(hexdec($hex[5].$hex[6])/2);                 
            if (( $hex1 + $hex2 + $hex3)/1.5>136){
                $bg='0,0,0';
            }
            $style="color: {$hex}; background-color: rgba({$hex1},{$hex2},{$hex3},{$alpha}); text-shadow:1px 1px 2px rgba({$bg},1), 0px 0px 4px rgba({$bg},0.9), 0px 0px 8px rgba({$bg},0.8), 0px 0px 16px rgba({$bg},0.7), 0px 0px 20px rgba({$bg},0.6) !important ; padding:0.4em;";
            
			return "<details class=\"t13ne-tone-key\" data-tone=\"{$num}\"><summary class=\"t13ne-tone-key\"><strong>Key:<span style=\"padding:0.2em;\"><em style=\"{$style}\">{$key['Key']}</em> <ins style=\"color:#000;text-decoration:none;\">{$kno}</ins></span></strong></summary><p><strong>Alternate Name:</strong> {$key['Alt']}</p><p><strong>Sharps and Flats: </strong>{$key['Sharps']}&sharp; &amp; {$key['Flats']}&flat;</p><p><strong>Syllable: </strong>{$key['Syllable']}</p><p><strong>Associated Colour: </strong><span style=\"{$style}\">{$key['Colour'][0]}</style></p><p><strong>Frequency: </strong>{$key['Frequency']} Hz.</p><small>{$key['Description']}</small></details>";
		}
		public static $orderOfSharps = array('5','0','7','2','9','4','11');
		public static $orderOfFlats = array('11','4','9','2','7','0','5');
		public static $RomanChords = array(
		
		array('Name'=>'I','Degree'=>'Tonic','Quality'=>'Major','indexer'=>0,'Chord'=>'Major-Triad','Notes'=>[0,4,7],'Description'=>'The Tonic is essentially the Root Note or First Degree of the Major Scale and Chord. This is usually a base of stability, and is Major. It is often the opening state of a progression, or a Character Arc, and is often the return point at the Resolution. This is usually a place of happiness, or at least the devil you know.','Character_Expression'=>'The Character is at home here, this is their natural environment, where they are happiest. Sometimes this is a goal, a hoped for dream that they have never experienced.'),
		array('Name'=>'i','Degree'=>'Tonic','Quality'=>'Minor','indexer'=>0,'Chord'=>'Minor-Triad','Notes'=>[0,3,7],'Description'=>'This is the Root of the Minor Scale and Chord. Progressions that begin in Minor typically indicate instability, sadness, loss or emotional weight within the whole structure. It can act as a resolution, but this is less certain, unless it indicates a return to an initial condition.','Character_Expression'=>'The Character is from here, but this isn’t what anyone would call home. There is something deeply sad about their home life or emotional condition right from the start. Orphans and abuse victims would be strong examples of this chord.'),
		array('Name'=>'I<sup>7</sup>','Degree'=>'Tonic','Quality'=>'Major','indexer'=>0,'Chord'=>'Dominant-Seventh','Notes'=>[0,4,7,10],'Description'=>'The Tonic is the Root of the Major Scale and Chord, but in this case the expression is more soulful, giving this a haunted or deeper emotional quality.','Character_Expression'=>'The Character is never at home here, but it reminds them of home, in some wistful way. This may be some dream of home, or a powerful sense of nostalgia at work, but it isn\'t home yet' ),
		array('Name'=>'ii','Degree'=>'Supertonic','Quality'=>'Major','indexer'=>2,'Chord'=>'Minor-Triad','Notes'=>[2,5,9],'Description'=>'The Supertonic is the second Degree of the Scale and is one whole step above the Tonic. Typically this is a Minor Chord in the Major Scale. The ii chord has a lot of harmonic motion, and offers a choice, the progression can continue from here, moving to the Subdominant (IV) — unless it just came from there, when the other route is almost certain — or Dominant (V) where it resolves down by a Fifth.','Character_Expression'=>'The Character experiences a set back, often in the form of a negative emotional experience (although any Loss or Failure will substitute).'),
		array('Name'=>'ii<sup>o</sup>','Degree'=>'Supertonic','Quality'=>'Minor','indexer'=>2,'Chord'=>'Diminished-Triad','Notes'=>[2,5,8],'Description'=>'The Supertonic is the second Degree of the Scale and is one whole step above the Tonic. Typically this is a Diminished (and often Inverted) Minor Chord in the Minor Scale and has a lot of harmonic motion, and offers a choice, the progression can continue from here, moving to the Subdominant (IV) — unless it just came from there, when the other route is almost certain — or Dominant (V) where it resolves down by a Fifth. This Diminished Supertonic often replaces the ii Minor chord to bring soulful depth and tragic sadness to a progression.','Character_Expression'=>'The Diminished ii chord is a powerful and unexpected event, that brings strongly negative emotions and often a Fray event that targets the Character.'),
		array('Name'=>'ii<sup>7</sup>','Degree'=>'Supertonic','Quality'=>'Minor','indexer'=>2,'Chord'=>'Dominant-Seventh','Notes'=>[2,6,9,12],'Description'=>'The Supertonic is the second Degree of the Scale and is one whole step above the Tonic. Typically this is a Dominant 7th Chord in the Minor Scale. The ii chord has a lot of harmonic motion, and offers a choice, the progression can continue from here, moving to the Subdominant (IV) — unless it just came from there, when the other route is almost certain — or Dominant (V) where it resolves down by a Fifth.','Character_Expression'=>'The Dominant 7th Minor drips and oozes Tension. Typically this increases the Tension Level one to three levels (depending upon the circumstance).'),
		array('Name'=>'&flat;II','Degree'=>'Supertonic','Quality'=>'Phrygian','indexer'=>1,'Chord'=>'Major-Triad','Notes'=>[1,5,8],'Description'=>'The Flatted Supertonic is the second Degree of the Phrygian Scale and is one semi-tone above the Tonic. The &flat;II chord can resolve straight back to the tonic or push on to the dominant as you need. It lends a surprise, but positive attitude when used in a progression.','Character_Expression'=>'The flat II has a blues jazz feel about it, that can indicate a surprise, or a some shift out of context.'),
		array('Name'=>'iii','Degree'=>'Mediant','Quality'=>'Major','indexer'=>4,'Chord'=>'Minor-Triad','Notes'=>[4,8,11],'Description'=>'The Mediant Chord sits half way between the Tonic (I) and the Dominant (V) and is a minor chord in amongst the Majors. It can have a lot of uses as the minor nature adds natural tension within the progression, bringing darkness to a Major chord progression as adversity raises its head. The iii chord is weakly predominant, and rarely progresses directly to the Dominant (V). The iii Chord is a step into the unknown or a tragic moment that profoundly effects them.','Character_Expression'=>'The Mediant brings a hint of darkness and an increase in Tension. Usually raising the Tension and Stakes by one Level each.'),
		array('Name'=>'&flat;III','Degree'=>'Mediant','Quality'=>'Minor','indexer'=>3,'Chord'=>'Major-Triad','Notes'=>[3,7,10],'Description'=>'The Mediant Chord sits half way between the Tonic (I) and the Dominant (V) and sits as a Major Chord among the Minor progression. However where it brings surprises is if it is used in a Major Scale, where it becomes the Flat-III and is borrowed from C Minor. ','Character_Expression'=>'The Flat Third Major Chord is a shocking or dangerous development. Tensions and Stakes are raised, usually at least two steps, and things seem bad for the Character.'),
		array('Name'=>'III','Degree'=>'Mediant','Quality'=>'Minor','indexer'=>3,'Chord'=>'Major-Triad','Notes'=>[3,7,10],'Description'=>'The Mediant Chord sits half way between the Tonic (I) and the Dominant (V) and sits as a Major Chord among the Minor progression. However where it brings surprises is if it is used in a Major Scale. ','Character_Expression'=>'The Major Third Chord is a bright surprise, but this surprise brings uncertainty. Tension and Stakes are raised usually two steps, with a surprise, that is usually pleasant.'),
		array('Name'=>'III<sup>7</sup>','Degree'=>'Mediant','Quality'=>'Minor','indexer'=>3,'Chord'=>'Dominant-Seventh','Notes'=>[3,7,10,13],'Description'=>'The Mediant Chord sits half way between the Tonic (I) and the Dominant (V) and sits as a Dominant Chord among the Minor progression. This makes it a soulful moment in the progression, full of tension and surprise.','Character_Expression'=>'A Dominant Seventh indicates a soulful or sorrowful moment. Tensions may fall, but the Stakes are raised to Soul-Stakes.'),
		array('Name'=>'iii<sup>7</sup>','Degree'=>'Mediant','Quality'=>'Minor','indexer'=>4,'Chord'=>'Minor-Seventh','Notes'=>[4,7,11,14],'Description'=>'The Mediant Chord sits half way between the Tonic (I) and the Dominant (V) and sits as a Minor Chord among the Minor progression. The iii Minor Seventh is a rare and dangerous chord','Character_Expression'=>'The Minor Seventh brings genuine danger to a Character. Tensions and Stakes are raised up to three steps and to High or Extreme Stakes. Ordeals and Obstacles are the vibes of the Minor Seventh,'),
		array('Name'=>'IV','Degree'=>'Subdominant','Quality'=>'Major','indexer'=>5,'Chord'=>'Major-Triad','Notes'=>[5,9,12],'Description'=>'The Subdominant is so called because it is as far below the tonic as the dominant is above it. This lends the subdominant an air of relaxing or sinking away from the tonic, that can act as a recapitulation, reminder or exposition about something from earlier. Modulation to the IV often leads to a Leading Tone (vii) being lowered to a Subtonic (vii).','Character_Expression'=>'The Major Subdominant is a rest or respite. Tension and Stakes are lowered one to two levels.'),
		array('Name'=>'IV<sup>7</sup>','Degree'=>'Subdominant','Quality'=>'Major','indexer'=>5,'Chord'=>'Dominant-Seventh','Notes'=>[5,9,12,15],'Description'=>'The Subdominant is so called because it is as far below the tonic as the dominant is above it. This lends the subdominant an air of relaxing or sinking away from the tonic, that can act as a recapitulation, reminder or exposition about something from earlier. Modulation to the IV<sup>7</sup> usually indicates a rapid return to the tonic, it is a powerful, both harmonic and dissonant, major and minor chord.','Character_Expression'=>'The Subdominant Dominant Seventh carries a sense of conclusion, and of diminished Stakes, but it can be a misleading one, as this may be the end of a bar not the verse. Tensions usually hold steady and may even raise a level, but the Stakes lower two levels.'),
		array('Name'=>'IV<sup>M7</sup>','Degree'=>'Subdominant','Quality'=>'Major','indexer'=>5,'Chord'=>'Major-Seventh','Notes'=>[5,9,11,16],'Description'=>'The Subdominant is so called because it is as far below the tonic as the dominant is above it. This lends the subdominant an air of relaxing or sinking away from the tonic, that can act as a recapitulation, reminder or exposition about something from earlier. Modulation to the IV often leads to a Leading Tone (vii) being lowered to a Subtonic (&flat;VII).','Character_Expression'=>''),
		array('Name'=>'iv','Degree'=>'Subdominant','Quality'=>'Minor','indexer'=>5,'Chord'=>'Minor-Triad','Notes'=>[5,8,12],'Description'=>'The Subdominant is so called because it is as far below the tonic as the dominant is above it. This lends the subdominant an air of relaxing or sinking away from the tonic, that can act as a recapitulation, reminder or exposition about something from earlier.','Character_Expression'=>''),
		array('Name'=>'iv<sup>7</sup>','Degree'=>'Subdominant','Quality'=>'Minor','indexer'=>5,'Chord'=>'Dominant-Seventh','Notes'=>[5,9,12,15],'Description'=>'The Subdominant is so called because it is as far below the tonic as the dominant is above it. This lends the subdominant an air of relaxing or sinking away from the tonic, that can act as a recapitulation, reminder or exposition about something from earlier. The Dominant Seventh increases the Predominance of the chord, pushing it on towards the tonic. It can act as a harmonic surprise, and raises harmonic tension.','Character_Expression'=>''),
		array('Name'=>'V','Degree'=>'Dominant','Quality'=>'Major','indexer'=>7,'Chord'=>'Major-Triad','Notes'=>[7,11,14],'Description'=>'The Dominant is the second most important degree of the Diatonic Scale after the Tonic. This chord adds an instability to the situation that can only be resolved by the Tonic. Traditionally after the V there is always an I.','Character_Expression'=>''),
		array('Name'=>'V<sup>7</sup>','Degree'=>'Dominant','Quality'=>'Major','indexer'=>7,'Chord'=>'Dominant-Seventh','Notes'=>[7,11,14,17],'Description'=>'The Dominant is the second most important degree of the Diatonic Scale after the Tonic. This chord adds an instability to the situation, that in the Dominant-Seventh chord’s case adds tri-tone tension that can only be resolved by the Tonic. Traditionally after the V7 is a good place to slip in a vi or VI chord, as it can feel like a resolution step.','Character_Expression'=>''),
		array('Name'=>'v','Degree'=>'Dominant','Quality'=>'Minor','indexer'=>7,'Chord'=>'Minor-Triad','Notes'=>[7,10,14],'Description'=>'The Dominant is the second most important degree of the Diatonic Scale after the Tonic. This minor v chord does not carry the same push towards the tonic, and can feel weak in leading towards the resolution. So it is often substituted with a V or V<sup>7</sup> chord. However it can be used as part of a diversion, fake-out, or on going emotional progression if there is another route back to the tonic.','Character_Expression'=>''),
		array('Name'=>'vi','Degree'=>'Submediant','Quality'=>'Major','indexer'=>9,'Chord'=>'Minor-Triad','Notes'=>[9,12,16],'Description'=>'The Submediant is half-way between the subdominant and the tonic. Can also be called the Superdominant, but this is somewhat misleading. Progression to the Submediant is uncommon, except when following a V<sup>7</sup> or iii where Descending Fifths will lead to the ii, and descending thirds will lead to a IV.'),
		array('Name'=>'vii<sup>o</sup>','Degree'=>'Leading-Tone','Quality'=>'Major','indexer'=>11,'Chord'=>'Diminished-Seventh','Notes'=>[11,14,17,20],'Description'=>'The Leading-Tone is the seventh Degree of the Scale and is only a semitone away away from the tonic again. This limits the notes that can be used in the chord, to those of a Diminished-Triad, that strongly wishes to resolve back to the Tonic.','Character_Expression'=>''),
		array('Name'=>'vii','Degree'=>'Leading-Tone','Quality'=>'Major','indexer'=>11,'Chord'=>'Leading-Tone-Triad','Notes'=>[11,14,17],'Description'=>'The Leading-Tone is the seventh Degree of the Scale and is only a semitone away away from the tonic again. This limits the notes that can be used to the Leading-Tone-Triad (which is an incomplete form of the Dominant Seventh). This Leading-Tone Triad is a very rare ','Character_Expression'=>''),
		array('Name'=>'&flat;vii','Degree'=>'Subtonic','Quality'=>'Mixolydian','indexer'=>10,'Chord'=>'Minor-Triad','Notes'=>[10,13,17],'Description'=>'The Subtonic is a whole tone below the tonic, sometimes this is a &flat;vii as in the Mixolydian Mode. The Flatted Seventh has room to be a minor triad that still wants to resolve towards the tonic, but can also move down a fifth to the iii, or a fourth to the iv.','Character_Expression'=>''),
		array('Name'=>'&flat;VII','Degree'=>'Subtonic','Quality'=>'Mixolydian','indexer'=>10,'Chord'=>'Major-Triad','Notes'=>[10,14,17],'Description'=>'The Subtonic is a whole tone below the tonic, sometimes this is a &flat;vii as in the Mixolydian Mode. The Flatted Seventh has room to be a Major triad that still wants to resolve towards the tonic, but can also move down a fifth to the iii, or a fourth to the iv. The &flat;VII is often a harmonic and emotional surprise, a place we never expected to be, which can make it tricky to use in Character Progressions unless you have a clear idea what is expected and can subvert that expectation somehow.','Character_Expression'=>''),
		array('Name'=>'VI','Degree'=>'Submediant','Quality'=>'Minor','indexer'=>8,'Chord'=>'Major-Triad','Notes'=>[8,11,15],'Description'=>'The Submediant is half-way between the subdominant and the tonic. Can also be called the Superdominant, but this is somewhat misleading. Progression to the Submediant is uncommon, and it rarely appears as a Major even in Minor Quality progressions, when it does it brings some success, positivity or a high note to the Character progression.','Character_Expression'=>''),
		array('Name'=>'VII','Degree'=>'Subtonic','Quality'=>'Dominant','indexer'=>10,'Chord'=>'Major-Triad','Notes'=>[10,13,17],'Description'=>'The Subtonic is a whole tone below the tonic, a Major Subtonic Chord is only possible in the melodic major or Aeolian Dominant scale. It is often used as a borrowed &flat;VII.','Character_Expression'=>''),
		array('Name'=>'VII','Degree'=>'Leading-Tone','Quality'=>'Minor','indexer'=>11,'Chord'=>'Major-Triad','Notes'=>[11,15,18],'Description'=>'The Leading-Tone Major Chord is a rare find in a transition and is often replaced with the Diminished form. ','Character_Expression'=>''),		
	);

	public static $progressions=array(
		array('Name'=>'12Bar/ I-I-I-I-IV-IV-I-I-V-IV-I-I','Progression'=>['I','I','I','I','IV','IV','I','I','V','IV','I','I'],'Quality'=>'Major','Character_Progression'=>'12 Bar Blues are notable for the fast changes and quick beats. However it can be difficult to realise the changes are fast when they repeat on the bar.'),
		array('Name'=>'Canon/ I-V-vi-iii-IV-I-IV-V','Progression'=>['I','V','vi','iii','IV','I','IV','V'],'Quality'=>'Major','Character_Progression'=>'The Canon progression named after Pachibel’s Canon in D has a light, loving feeling, where each Chord builds lightly upon the emotions displayed before until a loving harmony is arranged.'),
		array('Name'=>'I-&flat;VII-I','Progression'=>['I','&flat;VII','I'],'Quality'=>'Mixolydian','Character_Progression'=>'Falling a whole tone to the Subtonic and then rising again gives a surprising take on the I-V-I pattern that carries as much energy, but is equally as repetitive with time. This is a series of surprising events that return to normality afterward over and over again.'),
		array('Name'=>'I-ii-V-I','Progression'=>['I','ii','V','I'],'Quality'=>'Major','Character_Progression'=>'This is a Major progression that relies implies a journey, the Character will stumble to cope with some aspect, but then rise above it, grasp it and go on to return home better somehow. '),
		array('Name'=>'I-ii-vi-IV-I','Progression'=>['I','ii','vi','IV','I'],'Quality'=>'Major','Character_Progression'=>'This is a Major Progression that relies on a return to resolve. This has a very mixed feeling because of hte strong Minor presence, and implies a great loss or personal sorrow along the way. It is often a journey, where we stumble and fall, but then something lifts us before we return home.'),
		array('Name'=>'I-iii-&flat;VII-ii','Progression'=>['I','iii','&flat;VII','ii'],'Quality'=>'Major','Character_Progression'=>'This is a progression variant of the Cliche that replaces the Submediant with the Mixolydian Subtonic, and uses the relative minors of the Majors, these are often arranged to descend through each progression, giving a sense of collapse. The additional use of minors creates more of a sense of falling emotionally, adding a sense of desperation to the progression.'),
		array('Name'=>'I-&flat;III-IV-iv','Progression'=>['I','&flat;III','IV','iv'],'Quality'=>'Major','Character_Progression'=>'This is an uncommon progression, that indicates something strange or unusual is at hand. The progression is filled with surprises, and has a strange downward energy, that usually doesn\'t end well for the heroes.'),
		array('Name'=>'I-&flat;III-IV-V','Progression'=>['I','&flat;III','IV','V'],'Quality'=>'Major','Character_Progression'=>'This is a powerful rejoicing progression, it has no Minor components '),
		array('Name'=>'I-III-IV-V','Progression'=>['I','&flat;III','IV','V'],'Quality'=>'Major','Character_Progression'=>''),
		array('Name'=>'I-iii-IV-V','Progression'=>['I','iii','IV','V'],'Quality'=>'Major','Character_Progression'=>'This is the classic building tension progression. We start at home, something changes and home isn\'t as safe as it once was, then some positive forces add additional tension, twice, before we fall back to the tonic, releasing all the gained tension, and repeat.' ),
		array('Name'=>'I-iii-IV-vi','Progression'=>['I','iii','IV','vi'],'Quality'=>'Major','Character_Progression'=>''),
		array('Name'=>'i-III-IV-VI','Progression'=>['i','III','IV','VI'],'Quality'=>'Major','Character_Progression'=>''),		
		array('Name'=>'i-III-iv-VI','Progression'=>['i','III','iv','VI'],'Quality'=>'Minor','Character_Progression'=>''),
		array('Name'=>'I-III-vi','Progression'=>['I','III','vi'],'Quality'=>'Major','Character_Progression'=>''),
		array('Name'=>'I-III7-IV7-II7-V7-I','Progression'=>['I','III<sup>7</sup>','IV<sup>7</sup>','II<sup>7</sup>','V<sup>7</sup>','I'],'Quality'=>'Mixolydian/Major','Character_Progression'=>''),
		array('Name'=>'I-IV-&flat;VII-IV-I','Progression'=>['I','IV','&flat;VII','IV','I'],'Quality'=>'Major','Character_Progression'=>'This is a progression variant of the Cliche that replaces the Submediant with the Mixolydian Subtonic, but never utilises the Dominant. Instead we climb to a surprising place, and then descend to home again. This can repeat, with the "I"s becoming merged in the cycle, which can then create a '),
		array('Name'=>'I-IV-I','Progression'=>['I','IV','I'],'Quality'=>'Major','Character_Progression'=>'Rising from the tonic to subdominant to fall again to the tonic, gives a shocking variant on the I-V-I which still carries a lot of energy, as is repetitive is more satisfying than the predictable authentic cadence.'),
		array('Name'=>'I-IV-I-V','Progression'=>['I','IV','I','V'],'Quality'=>'Major','Character_Progression'=>''),
		array('Name'=>'I-IV-ii-V','Progression'=>['I','IV','ii<sup>o</sup>','V'],'Quality'=>'Major','Character_Progression'=>''),
		array('Name'=>'i-iv-v','Progression'=>['i','iv','v','Quality'=>'Minor'],'Character_Progression'=>''),
		array('Name'=>'I-IV-V','Progression'=>['I','IV','V'],'Quality'=>'Major','Character_Progression'=>'The I-IV-V progression is a standard progression that often opens pieces as it clearly defines the key, and establishes the quality of the tone as well. In Character terms these are three positive emotional experiences that define the Character, and wind up the tension, without changing them at all.'),
		array('Name'=>'I-IV-V-IV','Progression'=>['I','IV','V','IV'],'Quality'=>'Major','Character_Progression'=>'A variant on the Cliche that ignores the Submediant for the subdominant. This gives a harmonic rocking feeling to the progression.'),
		array('Name'=>'I-IV-vii<sup>o</sup>-iii-vi-ii-V-I','Progression'=>['I','IV','vii<sup>o</sup>','iii','vi','ii','V','I'],'Quality'=>'Major','Character_Progression'=>'The Circle of Fifths progression extended through the entire scale (including the diminished fifth). Theoretically this circle can continue indefinitely, each rotation adding complexity as the minors add losses, obstacles and Hazards, where as the Major chords add successes and gains, that may feel hollow due to the descending tones.'),
		array('Name'=>'I-V-&flat;VII-IV','Progression'=>['I','V','&flat;VII','IV'],'Quality'=>'Major','Character_Progression'=>'This is a progression variant of the Cliche that replaces the Submediant with the Mixolydian Subtonic, these are often arranged to descend through each progression, giving a sense of structured collapse to the whole progression.'),
		array('Name'=>'I-V-I','Progression'=>['I','V','I'],'Quality'=>'Major','Character_Progression'=>'Rising from the tonic to dominant to fall again to the tonic is known as authentic cadence, and while it carries a lot of energy, it quickly becomes repetitive and predictable.'),
		array('Name'=>'I-V-vi-IV','Progression'=>['I','V','vi','IV'],'Quality'=>'Major','Character_Progression'=>'This progression is a Cliche to the point that "every" optimistic pop song uses this progression. This is a we stumble, but we get up, kind of progression.'),
		array('Name'=>'I-V-vi-iii','Progression'=>['I','V','vi','iii'],'Quality'=>'Major','Character_Progression'=>'This progression is almost the Cliche, but here we climb, stumble and fall. It tends to be a heartache'),
		array('Name'=>'I-vi-II-IV','Progression'=>['I','vi','III','IV'],'Quality'=>'Major','Character_Progression'=>''),
		array('Name'=>'I-vi-ii-V','Progression'=>['I','vi','ii','V'],'Quality'=>'Major','Character_Progression'=>'A variant on the Circle Progression that was common in 50s pop and rock music, sometimes known as the Doo-wap progression. This gives a collapsing progression that falls into a blues '),
		array('Name'=>'i-VI-III-VII','Progression'=>['i','VI','III','VII'],'Quality'=>'Minor','Character_Progression'=>''),
		array('Name'=>'I-vi-IV-V','Progression'=>['I','vi','IV','V'],'Quality'=>'Major','Character_Progression'=>'Common in popular music, especially in the 50s and 60s, it can also be the basis of the 80s Rock Ballad, as the Major Tonic leads straight into the Submediant colour and darkness, before falling to the subdominant and climbing to the dominant once again (although often structured as a fall). '),
		array('Name'=>'ii-&flat;VII-IV-I','Progression'=>['ii','&flat;VII','IV','I'],'Quality'=>'Major','Character_Progression'=>'Alternative Rock and Punk-Pop Mixolydian variant, we start in a bad place, move to a strange place (a backdoor turnaround), before something happens that finally brings resolution.'),
		array('Name'=>'ii-V-I','Progression'=>['ii','V','I'],'Quality'=>'Major','Character_Progression'=>'The ii-V-I turnaround as it is known is a common cadential chords progression used in a lot of musical genres, from Jazz to hip-hop via country. The jump from Minor Supertonic to Major Dominant and then drop to Major Tonic, blends the Major and Minor parts of the Key fully, before revealing the Tonic. This brings sorrow and joy together to define the key as whole.'),
		array('Name'=>'iii-I-V-ii','Progression'=>['iii','I','V','ii'],'Quality'=>'Major','Character_Progression'=>'Alternative, we start in a bad place, recover slightly, make some kind of personal progress or success, and then descend into a bad place once again.'),
		array('Name'=>'IV-I-V-vi','Progression'=>['IV','I','V','vi'],'Quality'=>'Major','Character_Progression'=>'This progression variant of the Cliche that occurs a lot in Pop music '),
		array('Name'=>'IV-ii-vi-iii','Progression'=>['IV','ii','vi','iii'],'Quality'=>'Major','Character_Progression'=>'Alternative, the reliance on the minor chords from the Major Scale adds a lot of darkness and loss to the progression. Which starts in a good place, falls and climbs (but to a shaky place) and then falls to the end.'),
		array('Name'=>'V-IV-I','Progression'=>['V','IV','I'],'Quality'=>'Major','Character_Progression'=>'The V-IV-I progression is also known as the Blues Turnaround, and is seen as backwards to the normal I-IV-V progression, and gives an impression it is unwinding from the Dominant towards the Tonic. This gives the progression an air of relaxation.'),
		array('Name'=>'V-vi-IV-I','Progression'=>['V','vi','IV','I'],'Quality'=>'Major','Character_Progression'=>'This is a progression variant of the Cliche. It starts strong and bright, rises into a troublesome minor, before falling back towards stability, and resolution.'),
		array('Name'=>'vi-ii-V-I','Progression'=>['vi','ii','V','I'],'Quality'=>'Major','Character_Progression'=>'Called the Circle Progression, it is considered the strongest and most predictable of the harmonic progressions, as each change is a descending Fifth or Ascending Fourth. It is not quite the true Circle, but covers most of the Scale.'),
		array('Name'=>'vi-IV-I-V','Progression'=>['vi','IV','I','V'],'Quality'=>'Major','Character_Progression'=>'This is a pessimistic variant of the Cliche that turns up a lot in all genres. The start in Minor creates a sense of longing or loss in the beginning, that never feels quite resolved, even after passing through the I chord. This can also be expressed as a "Don’t-Something-Me" song (trust, love, forget, hurt, etc), or a recognition that something is wrong with the Character, and that’s okay.'),
	);
		public static $CharacterEffects = array(
			array('Effect'=>-6,'Name'=>'Traumatic','Description'=>'This is a powerfully negative experience for the Characters involved.','Character_Effect'=>'The Card atop the Discard Pile acts as a Stress Card. The Character effected must spend Stress equal to the Pips of the Card to accept the Stress effect or the Card will become a Trauma.'),
			array('Effect'=>-5,'Name'=>'Fray','Description'=>'This is a Yarn Fray event, typically narrated by the Yarn-Teller responsible for the Character’s Arc.','Character_Effect'=>'The Card atop the Discard Pile acts as a Fray that will affect the Characters during this Beat or Bar.'),
			array('Effect'=>-4,'Name'=>'Snag','Description'=>'This is a Yarn Snag event, typically narrated by the Yarn-Teller responsible for the Character’s Arc.','Character_Effect'=>'The Card atop the Discard Pile acts as a Snag that will affect the Characters during this Beat or Bar.'),
			array('Effect'=>-3,'Name'=>'Hurdle','Description'=>'This is a Facet Hurdle event, typically narrated by the Yarn-Teller responsible for the Character’s Arc.','Character_Effect'=>'The Card atop the Discard Pile provides a Facet Hurdle that will effect the Characters during this Beat or Bar.'),
			array('Effect'=>-2,'Name'=>'Negative Emotion','Description'=>'There is a Negative Emotion associated with the current situation, this effect is typically narrated by the Player of the Character affected.','Character_Effect'=>'The Card atop the Discard Pile becomes +1 Card Negative Emotional Effect that affects the Characters with a Psych Attack Emotional Effect during this Beat or Bar.'),
			array('Effect'=>-1,'Name'=>'Failure','Description'=>'There is an air of failure about the situation. This effect is usually narrated by the Referee.','Character_Effect'=>'The Referee may either narrate the Card atop the Discard Pile as a Facet Failure Level or demand the Character must Discard a Card from their Hand or Pool as the Failure for each Action the Character takes during the Beat or Bar.'),
			array('Effect'=>0,'Name'=>'Home','Description'=>'This is where the Character is naturally at home. It may be literally their territory, but most likely it is the social and geographical situation to which they are habituated.','Character_Effect'=>'Adds +1 Generic Success Level that the Player may add to each Action the Character takes during the Beat or Bar.'),
			array('Effect'=>1,'Name'=>'Stressful','Description'=>'The situation around the Character is stressful for them.','Character_Effect'=>'The Character Gains Stress during the Beat or each Beat of the Bar.'),
			array('Effect'=>2,'Name'=>'Positive Emotion','Description'=>'There is a Positive Emotion associated with the current situation, this effect is typically narrated by the Player of the Character affected.','Character_Effect'=>'The Card atop the Discard Pile becomes +1 Card Positive Emotional Effect that affects the Characters with an Emotional Effect during this Beat or Bar.'),
			array('Effect'=>3,'Name'=>'Relief','Description'=>'This is a restful situation that allows a Character to rest and recuperate.','Character_Effect'=>'The Character can rest, this will usually Relieve all current Stress, Strain and Shock the Character has over the Bar.'),
			array('Effect'=>4,'Name'=>'Revelation','Description'=>'This is a Yarn Revelation Event, typically narrated by the Yarn-Teller responsible for the Character’s Arc.','Character_Effect'=>'The Card atop the Discard Pile acts as a Revelation (which may be expanded by the Yarn-Teller with additional cards and may create a Lore for the Character) this Revelation plays out over the Beat or Bar.'),
			array('Effect'=>5,'Name'=>'Gain','Description'=>'This is a Yarn Gain Event, typically narrated by the Yarn-Teller responsible for the Character’s Arc.','Character_Effect'=>'The Card atop the Discard Pile acts as a Gain Event that plays out over the Beat or Bar.'),

		);

		public static $intervalRatios= array(
			array('Name'=>'Unison','Ratio'=>1,'Effect'=>1,'Interval'=>0,'Description'=>'Unison is the same note twice, as such it has no harmonics or dissonance, which gives it no power, and no emotional content. The relationship has a smoothness and peace to it, but has will and insistence too.'),
			array('Name'=>'Minor-Second','Ratio'=>(16.0/15.0),'Effect'=>-4,'Interval'=>1,'Description'=>'The Minor-Second is a difference of one semi-tone. This gives is a melancholic relationship, displeasurable, dull and dark, there is a certain weak, uptight, anguish to it. This is a relationship that has humiliation and pain baked in. There is a sense of roughness, derangement, shyness or illness to this relationship, that may express as occasional fear or anger.'),
			array('Name'=>'Major-Second','Ratio'=>(9.0/8.0),'Effect'=>-2,'Interval'=>2,'Description'=>'The Major-Second is a difference of a whole tone. This relationship is dissonant, a pain-filled torment, but has hints of stability, which gives it tension — a sense of longing and eagerness. This is the sensation of asking a question and waiting for an answer, there is a sense of motion and vulgarity to this. It is a wish and a displeasure simultaneously.'),
			array('Name'=>'Minor-Third','Ratio'=>(6.0/5.0),'Effect'=>1,'Interval'=>3,'Description'=>'The Minor-Third is a difference of three semi-tones, and brings a tragic dissonance with a sad harmony. This is a deeply emotional and sometimes tragic relationship, perhaps painful at times, but still sweet. It is a lament of discouraging sadness wrapped in heavy shadows.'),
			array('Name'=>'Major-Third','Ratio'=>(5.0/4.0),'Effect'=>3,'Interval'=>4,'Description'=>'The Major-Third is a difference of two tones, and this brings a rich harmonic strength. This is usually a bright, joyful relationship, full of positive energy and laughter, but that same energy and strength cannot become furious, quite due to the inherent hope and balance.'),
			array('Name'=>'Perfect Fourth','Ratio'=>(4.0/3.0),'Effect'=>4,'Interval'=>5,'Description'=>'The Perfect Fourth is a difference of five semi-tones and has a perfection about it (hence the name). This is a strong, buoyant relationship, but is not without active tension, pathos and sad times, but they serve to make it stronger. The Perfect Fourth can be firm, hard and cold, even indifferent to emotions, but it is always successful.'),
			array('Name'=>'Tri-tone','Ratio'=>(25.0/18.0),'Effect'=>-5,'Interval'=>6,'Description'=>'The Tritone, or Devil\'s interval, is three whole tones wide and has a violent dissonance to it. The relationship is filled with mysterious tension, restless, anxious, excitement and uncertainty, it has surprises, a soupçon of pretension, more than an air of destructive danger, and devilishly spicy heat. All of which can be terrible or great depending upon the context.'),
			array('Name'=>'Perfect Fifth','Ratio'=>(3.0/2.0),'Effect'=>5,'Interval'=>7,'Description'=>'The Perfect Fifth, stretches over seven semi-tones and is the epitome of opposites attracting, hence the Perfect in the name. The relationship is completely stable, healthy, and pleasurable, it is not prone to any fights or internally caused sadness, as it is internally cheerful, gentle and bright. Loving, certain and calm, it is the essence of balance, but can feel hollow.'),
			array('Name'=>'Minor-Sixth','Ratio'=>(8.0/5.0),'Effect'=>-1,'Interval'=>8,'Description'=>'The Minor-Sixth and its four tone interval brings some dark dissonance to the relationship. There is anguish, upsets, discontentment and instability to the relationship, it floats between pleasure and pain, and can be stressful and strained or shadowed and pitiful.'),
			array('Name'=>'Major-Sixth','Ratio'=>(5.0/3.0),'Effect'=>3,'Interval'=>9,'Description'=>'The Major-Sixth and its nine semi-tone interval brings tension as the relationship wants to resolve to Perfection, but cannot. There is a sweetness to the relationship, but no stability, it is a radiant will-they won\'t-they situation that can satisfy in the short term, but lacking true stability may fly apart at anytime.'),
			array('Name'=>'Minor-Seventh','Ratio'=>(16.0/9.0),'Effect'=>-2,'Interval'=>10,'Description'=>'The Minor-Seventh is marked by the five whole tones of interval. This is a sad, painful, and unsatisfying relationship, but that has warmth, romance and love. Such relationships may leave both partners bewildered, strained and stressed when they are over, but while they are happening it is just a dynamic exaltation of love.'),
			array('Name'=>'Major-Seventh','Ratio'=>(15.0/8.0),'Effect'=>-4,'Interval'=>11,'Description'=>'The Major-Seventh is an eleven semi-tone interval (or one semi-tone down from the octave). It is a bitter, tense relationship, often gloomy, wicked, and prideful and generable disagreeable, but it can be marked by some optimism, pride, hope and rebellion that lends it brightness.'),
			array('Name'=>'Octave','Ratio'=>0.5,'Effect'=>5,'Interval'=>12,'Description'=>'A whole Octave separates these notes and this brings perfect consonance. The relationship is generally an easy, stable one, but it is not without energy and strength, in fact the Octave relationship can be too intense, too strong, a majesty that becomes solemn or even severe sometimes. It is courageous and heroic while being stable and solid.'),
			array('Name'=>'Minor-Ninth','Ratio'=>(32.0/15.0),'Effect'=>-3,'Interval'=>13,'Description'=>'The Minor-Ninth is marked by an interval of an Octave plus a semitone. This is a relationship with sadness and just a hint of chaos.'),
			array('Name'=>'Major-Ninth','Ratio'=>(9.0/4.0),'Effect'=>-1,'Interval'=>14,'Description'=>'The Major Ninth brings a dissonance that adds spice to the relationship. This is the not quite harmony of a brass band, it can feel slick and bitter.'),
			array('Name'=>'Minor-Tenth','Ratio'=>(12.0/5.0),'Effect'=>-2,'Interval'=>15,'Description'=>'The Minor Tenth or more often Augmented-Ninth is perhaps the saddest of the Ninths, as a hint of consonance joins the dissonance. It is darkness wrapped in tears, and adds a sorrow to any group it joins. '),
			array('Name'=>'Major Tenth','Ratio'=>(5.0/2.0),'Effect'=>3,'Interval'=>16,'Description'=>'The Major Tenth or Diminished Eleventh has a strong relationship with the Major Third with additional brightness. This is the interval of a joyous, harmonious, relationship filled with laughter.'),
			array('Name'=>'Perfect-Eleventh','Ratio'=>(8.0/3.0),'Effect'=>5,'Interval'=>17,'Description'=>'The Perfect Eleventh is a Perfect Fourth an Octave apart. Which raises the energy of the Fourth creating a more positive and emotional feeling to the relationship.'),
			array('Name'=>'Augmented-Eleventh','Ratio'=>(25.0/9.0),'Effect'=>-6,'Interval'=>18,'Description'=>'The Augmented Eleventh or Diminished Twelfth is a Tritone and an Octave apart. This raises the dissonance and creates a more troubled and dangerous relationship that includes threats of abuse and death.'),
			array('Name'=>'Perfect-Twelfth','Ratio'=>(3.0/1.0),'Effect'=>3,'Interval'=>19,'Description'=>'The Perfect Twelfth is a Perfect Fifth above the Octave and carries a stability and bright consonance, that sadly is less stable than the Perfect Fifth. Unlike the Fifth the these relationships are weaker, while still cheerful, open and light, and as such can feel superficial, hollow and stark.'),
			
		);
	public static $chords = array(
		array('Type'=>'Power','Description'=>'Also called a dyad. Power Chords are not real chords and lack support from a third degree of the scale, without this additional support from outside they can never be completely stable, but can sound stark, loud and powerful.','Notes'=>'0,7','Symbol'=>'5'),
		array('Type'=>'Power','Description'=>'Also called a Fifth chord. Power Chords are not real chords and lack support for the fifth,  from a third degree of the scale, although in this case they have an added Octave that reinforces the root, they can never be completely stable, but will sound powerful, loud and aggressive.','Notes'=>'0,7,12','Symbol'=>'ind'),
		array('Type'=>'Major-Triad','Description'=>'A powerful expression of the root note, usually bringing cheerfulness, confidence and satisfaction.','Notes'=>'0,4,7','Symbol'=>'Δ'),
		array('Type'=>'Major-Sixth','Description'=>'A bright confident expression of the root note, often more thoughtful and contemplative.','Notes'=>'0,4,7,9','Symbol'=>'maj6'),
		array('Type'=>'Major-Seventh','Description'=>'This is a serene and easy expression of the root note, it has a more romantic sound, that adds both softness and exhilaration.','Notes'=>'0,4,7,11','Symbol'=>'maj<sup>7</sup>'),
		array('Type'=>'Major-Ninth','Description'=>'This is an open and free expression of the root note, it has a more optimistic sound than the Seventh, an added brightness.','Notes'=>'0,2,4,7,11','Symbol'=>'maj<sup>9</sup>'),
		array('Type'=>'Dominant-Seventh','Description'=>'This is an edgy, soulful or funky expression of the root note.','Notes'=>'0,4,7,10','Symbol'=>'dom7'),
		array('Type'=>'Dominant Ninth','Description'=>'This is an edgy, soulful or funky expression of the root note.','Notes'=>'0,2,4,7,10','Symbol'=>'9'),
		array('Type'=>'Dominant Ninth (no 5)','Description'=>'This is an edgy, soulful or funky expression of the root note.','Notes'=>'0,2,4,10','Symbol'=>'V<sup>9</sup>'),
		array('Type'=>'Dominant Minor Ninth','Description'=>'This is an edgy, dramatic expression of the root note. Full of threat and danger.','Notes'=>'0,1,4,7,10','Symbol'=>'<sup>7&flat;9</sup>'),
		array('Type'=>'Augmented-Triad','Description'=>'This is a less emotional expression of the root note. That adds confusing aspects to amaze, astonish and surprise, like the twinkling of faery charms as they ensorcel everyone.','Notes'=>'0,4,8','Symbol'=>'aug'),
		//array('Type'=>'Augmented-Sixth','Description'=>'This chord is typically a more emotionally fraught expression of the bass note, rather than the root note. As such it is commonly used predominantly to resolve towards a dominant chord.','Notes'=>'0,1,4,8','Symbol'=>'aug<sup>6</sup>'),
		array('Type'=>'Augmented-Seventh','Description'=>'The original expression of the root note is more emotionally foggy, layers of emotional confusion and a deep sense of unease abound, overriding much of the original notes emotion.','Notes'=>'0,4,8,10','Symbol'=>'aug<sup>7</sup>'),
		array('Type'=>'Minor-Triad','Description'=>'A darker, sadder expression of the root note, it brings tenseness, apprehension and melancholy to the note.','Notes'=>'0,3,7','Symbol'=>'min'),
		array('Type'=>'Minor-Sixth','Description'=>'A dark majestic expression of the root note. Full of brooding Mystery, it is full of building tension, before an ultimate betrayal.','Notes'=>'0,3,7,9','Symbol'=>'min<sup>6</sup>'),
		array('Type'=>'Minor-Seventh','Description'=>'A mellow, but moody expression of the root note. This can be a surprising and lively experience','Notes'=>'0,3,7,10','Symbol'=>'min<sup>7</sup>'),
		array('Type'=>'Minor-Ninth','Description'=>'A creepy, ominous, but bluesy expression of the root note. This brings complexity to the emotions as well as a darkness, it adds brightness.','Notes'=>'0,1,3,7,10','Symbol'=>'min<sup>7</sup>'),
		array('Type'=>'Minor-Major-Seventh','Description'=>'Also called the Hitchcock chord. This is the most mysterious expression of the root note, it most evokes a question, mystery or suspicion.','Notes'=>'0,3,7,11','Symbol'=>'min<sup>maj7</sup>'),
		array('Type'=>'Diminished-Triad','Description'=>'A tense spooky expression of the root note. That indicates a fair amount of suspicion and emotional duplicity within the chord.','Notes'=>'0,3,6','Symbol'=>'dim'),
		array('Type'=>'Diminished-Seventh','Description'=>'Perhaps the most emotionally tense expression of the root note, full of suspense, bordering on panic.','Notes'=>'0,3,6,9','Symbol'=>'dim<sup>7</sup>'),
		array('Type'=>'Half-Diminished-Seventh','Description'=>'A dramatic and powerful expression of the root note, full of rich tension and drama.','Notes'=>'0,3,6,10','Symbol'=>'<sup>ø7</sup>'),
		array('Type'=>'Suspended Fourth','Description'=>'A delightfully tense expression of the root note, that adds a little emotional complexity to the situation.','Notes'=>'0,5,7','Symbol'=>'<sup>sus4</sup>'),
		array('Type'=>'Major-Subdominant-Add-Six','Description'=>'An emotionally warm, relaxed expression of the root note, that often has a certain sense of emotional solace to it.','Notes'=>'0,5,9','Symbol'=>'IV<sup>maj6</sup>'),
		array('Type'=>'Six/Nine','Description'=>'A relaxed, bluesy, but stable expression of the root note.','Notes'=>'0,2,4,7,9','Symbol'=>'<sup>6/9</sup>'),
		array('Type'=>'Add Nine','Description'=>'A steely, austere and cold expression of the root note, as additional dissonance adds confusion to the original emotion.','Notes'=>'0,2,4,7','Symbol'=>'<sup>Add9</sup>'),
		array('Type'=>'Minor Six/Nine','Description'=>'A relaxed and bluesy, stable but melancholy expression of the root note.','Notes'=>'0,2,3,7,9','Symbol'=>'MI<sup>6/9</sup>'),
		array('Type'=>'Neapolitan Sixth','Description'=>'','Notes'=>'0,2,3,7,9','Symbol'=>'MI<sup>6/9</sup>'),

	);
	

	static public function getKeyFromKey($key,$mode){
		switch ($mode) {
			case 'minor':
			case 'relative':
			case 'relative minor':
			case '6th':
			case 'relmin':
			case 6:
				return ($key+9);
				break;
			case 'fifth':
			case '5th':
			case 5:
				return ($key+7);
				break;
			case 'fourth':
			case '4th':
			case 4:
				return ($key+5);
				break;
			default:
				return ($key);
				break;
		}
	}
	static public function crunchNumbers($num){
		while ($num>13){
			$num=array_sum(str_split($num));
		}
		return $num;
	}
	static public function getInterval($note, $root){
		
		$t=abs(intval($note)-intval($root));
		if($t<20){
			$ret = self::$intervalRatios[$t];

		}else{
			$tt=$t%12;
			if ($tt==0){{$tt=12;}}
			$ret= self::$intervalRatios[$tt];
			$ret['Name']='Compound-'.$ret['Name'];
			$ret['Description']='This interval is a compound of at least one Octave and '.$ret['Description'];
			$ret['Interval']=$t;
			$ret['Ratio']=$ret['Ratio']/(1+floor($t/12));
		}
		
		return ['Interval'=>$ret,'root'=>$root,'note'=>$note];		
	}
	static public function getIntervals($tones,$root=0){
		//var_dump($tones);
		if (is_string($tones)){$tones=T13Types::arrayify($tones);}
		if (is_array($tones)){
			//we have tones. Now we need to build an interval list.
			//var_dump($tones);
			$ret =[];
			foreach($tones as $i=>$toner){
				foreach($tones as $id=>$tone){
					if ($id>$i){
						array_push($ret,self::getInterval($tone+$root,$toner+$root));
					}
				}
			}
			return T13Types::makeUniqueArray($ret);
		}
	}

	static public function getChord($notes,$mode,$root){
		//var_dump($notes);
		if (is_array($notes)){$tones = $notes; $notes = implode(',', $tones);}
		if (is_string($notes)){$tones=T13Types::arrayify($notes);}

		$intervals = self::getIntervals($tones,$root);
		$c=count($tones);
		if ($c<6&&$c>1){
			//possible matches strings faster than arrays...
			
			
			foreach (self::$chords as $id=>$chord){
				if ($notes == $chord['Notes']){
					return ['Root'=>$root,'Chord'=>$chord,'Mode'=>$mode];
					break;
				}
			}
		}
		$intext='This Tone Cluster contains the following intervals <ul class="t13ne-intervals">';
		foreach ($intervals as $i=>$int){
			//var_dump($int);
			
			$intext.='<li class="t13ne-interval"><details><summary>';
			
			$intext.="<strong>{$int['Interval']['Name']}</strong></summary> — <p><strong>Root: </strong> ".self::writeKeys($int['root'])."</p><p><strong>Note: </strong> ".self::writeKeys(intval($int['note']))."</p><p> {$int['Interval']['Description']}</p>";
						
			$intext.='</details></li>';
		}
		
		return ['Root'=>$root,'Chord'=>['Type'=>'Tone Cluster','Description'=>'Not a true Chord in any recognised sense, but may have a Chord like quality (or may be a complicated Inversion of some actual Chord, or some collection of chords). Stability is rarely guarranteed, unless the mode is particularly stable.'.$intext,'Root'=>$root,'Notes'=>$tones,'Symbol'=>'TC'],'Mode'=>$mode];
		
		
	}
	static public function getTones($search,$distance){
		$matches=[];
		$searches=array_sum($search)+$distance;
		$numb=count($search);
		foreach (T13Types::$tonalModes as $id => $mode) {
			$c=count($mode['ModalNumbers']);
			if ($numb<$c){
				if ($mode['Type']!=="Chromatic"&&T13Types::contains($search,$mode['ModalNumbers'])){
					//print_r('Mode='.$mode['Type'].json_encode($mode['ModalNumbers']).' search='.json_encode($search).'<br/>');
					$matches[]=['id'=>$id,'Mode'=>$mode];
				}
			}
		}
		
		//print_r('<br/> c='.$c);
		usort($matches, function($a,$b){return count($a['Mode']['ModalNumbers'])-count($b['Mode']['ModalNumbers']);});
		$c=ceil(count($matches)/3); //(we only want the smallest matches... )
		//print_r($c."<br/>");
		if ($c>0){
			$tonalmode=$matches[$searches%$c]['id'];
			$tonename=$matches[$searches%$c]['Mode']['Type'];
			$modaltones = $matches[$searches%$c]['Mode']['ModalNumbers'];
		}else{
			$tonalmode = count(T13Types::$tonalModes)-1;
			$tonename = 'Chromatic';
			$modaltones = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
		}
		
		return ['tonalmode'=>$tonalmode,'modaltones'=>$modaltones,'tonename'=>$tonename];

	}
	static public function correctTones($tones){
		if (is_array($tones)){
			$tones= array_keys(array_flip($tones)); //remove dupes
			sort($tones); //sort
			$bass=intval($tones[0]); //locate lowest
			$notes=[];
			foreach ($tones as $tone){
				array_push($notes,(intval($tone) - $bass));
			}
			return ['Root'=>$bass,'Tones'=>$notes];
		}
	}


	static public function calculateChord($tones){
		//var_dump($tones);
		if (is_array($tones)&&count($tones)>2){
			$correct=self::correctTones($tones);
			$mode=self::getTones($correct['Tones'],1);
			$chord=self::getChord($correct['Tones'],$mode,$correct['Root']);
			return $chord;
		}
	}
	static public function calculateHarmonics($geo=1,$soul=3,$facade=4,$initial=2,$length=10,$aka=[]){
		//step 1 
		//calculate additional note
		$ac=count($aka); 
		$ghost=($geo+$soul+$facade+$initial+$length);
		if ($ac>2){
			$av = intval(array_sum(array_keys(array_flip($aka)))/$ac);
			$ghost = $av;//$aka[$ghost%($ac-1)];	
		}else{
			$ghost=self::crunchNumbers($ghost);
		}

		
		//order the notes
		$notes=[intval($geo),intval($soul),intval($facade),intval($initial),intval($ghost)];
		//var_dump($notes);
		//print_r('<br/>'.json_encode($notes).$length);
		$match=($facade==$soul||$facade==$geo||$facade==$initial);
		sort($notes);
		//print_r('<br/>'.json_encode($notes).$length);
		//step 2 Identify the key and correct notes for key
		$key = $notes[0];
		$notes = array_keys(array_flip(array_merge($notes,$aka)));
		//print_r('<br/>168:'.json_encode($notes).$length);
		sort($notes);
		//print_r('<br/>170:'.json_encode($notes).$length);
		$corrected=[];
		foreach($notes as $i=>$note){
			$corrected[]=(13+$note-$key)%13;
		}
		sort($corrected);
		//print_r('<br/>corrected'.json_encode($corrected).' len='.$length.' key='.$key.' <br/>');
		$mode=self::getTones($corrected,array_sum($notes));
		//print_r('<br/>'.json_encode($notes).' corrected='.json_encode($corrected).' mode='.json_encode($mode));
		$tonalmode =$mode['tonalmode'];
		$modaltones =$mode['modaltones'];
		$perfect =0;
		$sustained = 0;
		$wolf = 0;
		$nemesis = 0;
		//step 3 identify the first applicable tonal mode for all	
		$harmonics=[];
		$dissonants=[];
		for ($i=0; $i < 14; $i++) { 
			$num = 1+($i+$key-1)%13;
			//print_r('num='.$num.'<br/>');
			if (in_array($i,$modaltones)){
				$harmonics[]= $num;
			}else{
				$dissonants[]=$num;
			}
		}
		
		$harm=count($harmonics);
		if ($harm<1||count($dissonants)<1){ //still found chromatic or something else went wrong.
			$harmonics = array_keys(array_flip(array_merge($notes,self::$geometries[$key%13]['Harmonic'])));
			$harm=count($harmonics);
			
		}
		
		$diss=count($dissonants);
		if ($diss<1){
			
			$dissonants = array_keys(array_flip(array_merge([1+(($geo+$soul+$facade+$initial+$length)%13)],self::$geometries[$key%13]['Dissonant'])));
			$harmonics = array_diff($harmonics,$dissonants);
			$diss=count($dissonants);
			
		}
		
		
		sort($harmonics);
		sort($dissonants);
	 	if (in_array($soul,$harmonics)){
     	 	$perfect = $soul;
     	}elseif(in_array(($soul-9), $harmonics)){
     		$perfect = $soul-9;
     	}elseif(in_array($ghost, $harmonics)){
     		$perfect = $ghost;
     	}elseif(in_array(($ghost-9), $harmonics)){
     	 	$perfect = $ghost-9;
     	}elseif(in_array($facade, $harmonics)){
     		$perfect = $facade;
     	}elseif(in_array(($facade-9), $harmonics)){
     	 	$perfect = $facade-9;
     	}else{
     	 	$perfect =  $harmonics[$soul%$harm];	
      	}
     	if (in_array($soul, $dissonants)){
     		$sustained = $soul;
     	 }elseif(in_array(($soul-9), $dissonants)){
     	 	$sustained = $soul-9;
     	 }elseif(in_array($ghost, $dissonants)){
     		$sustained = $ghost;
     	}elseif(in_array(($ghost-9), $dissonants)){
     		$sustained = $ghost-9;
     	 }elseif(in_array($facade, $dissonants)){
     		$sustained = $facade;
     	}elseif(in_array(($facade-9), $dissonants)){
     		$sustained = $facade-9;
     	}else{
     		$sustained = $dissonants[$facade%$diss];
     	}
     	$harmony = array_values(array_diff($harmonics, [$perfect]));
 		$disss = array_values(array_diff($dissonants, [$sustained]));
 		$ch =count($harmony);
 		$cd= count($disss);
 		if ($cd!==0&&$ch!==0){
 			$wolf =$harmony[abs($geo+$facade+$soul+$initial)%$ch];
  			$nemesis = $disss[abs($geo+$soul+$facade+$ghost)%$cd];
 		}
 		$key=abs((46+$key-$nemesis+$wolf-$geo+$soul-$facade+$ghost-$initial+$length)%88);

		//print_r('<br/>'.json_encode($notes).' h='.json_encode($harmonics).' d='.json_encode($dissonants));
		
		return ['notes'=>$notes,'corrected'=>$corrected,'key'=>$key,'len'=>$length,'Mode'=>$mode,'ModalTone'=>$tonalmode,'Harmonic'=>$harmonics,'Dissonant'=>$dissonants,'Perfect'=>$perfect,'Wolf'=>$wolf,'Sustained'=>$sustained,'Nemesis'=>$nemesis, 'Ghost'=>$ghost];

	}
	static public function getGeoTerms($name){
		$geo=array(self::getGeometryFromString($name));

		$key = self::calculateGeoKey($name);
		//error_log(json_encode($key));
		switch ($geo[0]){
			case 10: $geo[]=1;
			break;
			case 11:$geo[]=2;
			break;
			case 12:$geo[]=3;
			break;
			case 13:$geo[]=4;
		}
		foreach ($geo as $g){
			$geoText=T13Geometry::writeGeometry($g, false,0);
			$geoterm = term_exists( $geoText['GeoName'], 't13geo');
			if(!is_null($geoterm)){
				$ret[]=intval($geoterm['term_id']);
			//error_log(json_encode($key['Key']));
			}
			
			$keyterm = term_exists($key['Key']['Key'],'t13geo');
			if(!is_null($keyterm)){
				$ret[]=intval($keyterm['term_id']);
			}
			
		}

		return $ret;
	}
	static public function tidyName($name){
		if (!is_string($name)){
			$name=json_encode($name);
		}
		$name=strtolower(trim($name));
		$patterns[0] = '/[á|â|à|å|ä]/';
	    $patterns[1] = '/[ð|é|ê|è|ë]/';
	    $patterns[2] = '/[í|î|ì|ï]/';
	    $patterns[3] = '/[ó|ô|ò|ø|õ|ö]/';
	    $patterns[4] = '/[ú|û|ù|ü]/';
	    $patterns[5] = '/æ/';
	    $patterns[6] = '/ç/';
	    $patterns[7] = '/ß/';	    
	    $replacements[0] = 'a';
	    $replacements[1] = 'e';
	    $replacements[2] = 'i';
	    $replacements[3] = 'o';
	    $replacements[4] = 'u';
	    $replacements[5] = 'ae';
	    $replacements[6] = 'c';
	    $replacements[7] = 'ss';   
	    $name = preg_replace($patterns, $replacements, $name);
	    $name =preg_replace('/[^A-Za-z,.]/', '', $name);
	    return $name;
	}
	static public function getGeometryFromString($name){
		$geo=0;
		$name=self::tidyName($name);
		foreach (self::$numerology as $num){
			if (T13Types::contains($name, $num['Letter'])){
				$geo+=substr_count($name, $num['Letter'])*$num['Number'];
			}
		}
		$geo=self::crunchNumbers($geo);
		return (int)$geo;
	}
	static public function getAllGeometeriesFromTitle($title){
		
	}
	static public function geometryScript(){
		$geos=array();
		foreach(self::$geometries as $geo=>$geometry){
			$ge=self::writeGeo($geo,false);
			//$geos[]=$ge['Text'];
		}
		$script = 'var t13neGeometries='.json_encode(self::$geometries).';
jQuery(document).ready(function($){
	console.log("bootstrapping ReactDOM from jQuery Hack");

  $("[data-geo]").each(function( index ) {console.log("geometry rewrite!");
  geo=$(this).attr("data-geo");
  $(this).html(t13neGeometries[geo]);
 });   
$("body").on("focus", "[contenteditable]", function() {
const $this = $(this);
$this.data("before", $this.html());
}).on("blur keyup paste input", "[contenteditable]", function() {
const $this = $(this);
if ($this.data("before") !== $this.html()) {
    $this.data("before", $this.html());
    $this.trigger("change");
}});
$("body").on("change",".t13ne-display-name", function(){
	const idtime=new Date();
	const $this = $(this);
	const name=$this.html;
	const id = "changed" + idtime.getTime();
	console.log("id generated: "+id);
	$this.parents("div.t13ne-name").attr("id", id);
	console.log($this.parents("div.t13ne-name"));
	ReactDOM.render(window.T13NE.CE(window.T13NE.Name, { "data-t13name": name} ),  document.getElementById(id));
	});

	});
		';
		return $script;
	}
	static public function writeGeometry($name,$showname=true,$forcegeo=0){
		return self::writeGeo($name,$showname,$forcegeo);
	}
	static public function writeGeoText($g=0){
		$geo = self::$geometries[$g];
	return "<details class=\"t13ne-name\"><summary><span class=\"t13ne-geonum\">{$g}</span></summary><span class=\"t13ne-geoname\"> {$geo['Name']} </span><p class=\"t13ne-description\"><strong>Description: </strong> {$geo['Geometry_Description']}</p><p class=\"t13ne-goal\"><strong>Goal: {$geo['Goal']}</strong> — {$geo['Goal_Description']}</p><p class=\"t13ne-gain\">{$geo['Chi']}</p><p class=\"t13ne-yang\">{$geo['Yang']}</p><p class=\"t13ne-yin\">{$geo['Yin']}</p><p class=\"t13ne-stress\">{$geo['Stress']}</p><p class=\"t13ne-gift\"><strong>Gift: {$geo['Gift']} </strong><br/><span class=\"t13ne-description\">{$geo['Gift_Description']}</span></p></details>";

	}
	static public function writeBlock($g,$facade,$soul,$tone,$harmonies,$perfect,$wolf,$dissonants,$nemesis,$sustained,$initial,$key,$ghost,$fullname,$akas){
		$g=intval($g);
		$soul=intval($soul);
		$facade=intval($facade);
		$initial=intval($initial);
		$ghost=intval($ghost);
		//should probably reduce 10+ to <9 on these but I don't want to...
		$glist = ['Primary'=>$g,'Nascent'=>$initial,'Facade'=>$facade,'Soul'=>$soul,'Ghost'=>$ghost];
		$gdlist = array(
			'Primary'=>array('Gain'=>'Always','Stress'=>'Primary','Goal'=>'Primary','Description'=>'The Primary Number is the geometry associated with the Character’s main name. The Primary geometry is always active, able to gain Chi, Yin, Yang and Stress.','Active'=>'when conscious.'),
			'Nascent'=>array('Gain'=>'When Stressed','Stress'=>'Secondary','Goal'=>'Stressed','Description'=>'The Nascent Number is the geometry that they began as, and will regress towards when they are Stressed. The Nascent Stressor is always active. When the Character is Stressed the Nascent Geometry becomes semi-dominant, allowing this Chi Gain, Stressor and Goal to be active.','Active'=>'when stressed.'),
			'Facade'=>array('Gain'=>'When Unstressed','Stress'=>'Fake','Goal'=>'Pretend','Description'=>'The Facade Number is the geometry that the Character projects, and pretends to be. When Stressed a Character drops their Facade, and loses the ability to Gain Chi, or a desire to work towards that Goal. While a Character may fake being Stressed by their Facade they are never really stressed by it.','Active'=>'when unstressed.'),
			'Soul'=>array('Gain'=>'Soul','Stress'=>'Soul','Goal'=>'Personal','Description'=>'The Soul Number is the geometry that the Character is most drawn towards, what they would like to be. Soul Stressors are always active as are Soul Chi Gains however a Character rarely works directly towards their Soul Goal, but may incorporate it into their other Goals.','Active'=>'when preoccupied, daydreaming or unconscious.'),
			'Ghost'=>array('Gain'=>'Shadow','Stress'=>'Shadow','Goal'=>'Unconscious','Description'=>'The Ghost Number is a geometry that the Character has some additional preference for, often from a past-life or alternate. Shadow Chi Gains, Goals and Stressors are only active when the Yarn-Teller says, and are usually tied to an Arc or past-life Story.','Active'=>'when active according to the Yarn-Teller of this Character’s Arc.'),
		);
		$chis=[];
		$goals=[];
		$stressors=[];
		$texts=[];
		$multipliers=array_fill(0, 14, 0);
		foreach ($glist as $x=>$y){
			if ($multipliers[$y]==0){
				
				if ($y==$g){$multipliers[$y]++;}
				if ($y==$initial){$multipliers[$y]++;}
				if ($y==$facade){$multipliers[$y]++;}
				if ($y==$soul){$multipliers[$y]++;}
				if ($y==$ghost){$multipliers[$y]++;}
				$chis[$x]= ['text'=>(($multipliers[$y]>1)? $multipliers[$y].' &times; ':'').'</strong>'.self::$geometries[$y]['Chi'],'g'=>$y];
				$goals[$x]=['text'=>self::$geometries[$y]['Goal'].' </strong></summary> — '.self::$geometries[$y]['Goal_Description'],'g'=>$y];
				$stressors[$x]=['text'=>(($multipliers[$y]>1)? $multipliers[$y].' &times; ':'').'</strong>'.self::$geometries[$y]['Stress'],'g'=>$y];
			}else{
				$matches=[];
				if ($y==$g&&$x!=='Primary'){array_push($matches,'Primary');}
				if ($y==$initial&&$x!=='Nascent'){;array_push($matches,'Nascent');}
				if ($y==$facade&&$x!=='Facade'){array_push($matches,'Facade');}
				if ($y==$soul&&$x!=='Soul'){array_push($matches,'Soul');}
				if ($y==$ghost&&$x!=='Ghost'){array_push($matches,'Ghost');}
				$matchess=implode(" / ",$matches);
				$chis[$x]= ['text'=>"{$matchess} Atunement</strong> — Gains multiplied for \"{$gdlist[$matches[0]]['Gain']}\" {$gdlist[$x]['Active']}",'g'=>$y];
				$goals[$x]=['text'=>"Atuned with {$gdlist[$matches[0]]['Goal']} </strong></summary> — increased desire to achieve the {$gdlist[$matches[0]]['Goal']} Goal, created by the {$matchess} Number, {$gdlist[$x]['Active']}",'g'=>$y];
				$stressors[$x]=['text'=>"{$gdlist[$x]['Stress']} Stressor: Atuned with {$gdlist[$matches[0]]['Stress']}</strong> — increases Stress generated by the {$gdlist[$matches[0]]['Stress']} or {$matchess} Stressor, {$gdlist[$x]['Active']}",'g'=>$y];
			}
			
			$texts[$x]=['text'=>self::writeGeoText($y)];
		}
		$chiText='<ul class="t13ne-gain">';
		foreach($chis as $x=>$chi){
			//remove duplicates?
			
			if ($multipliers[$chi['g']]>0){

				$chiText.="<li class=\"t13ne-gain\" title=\"{$gdlist[$x]['Description']}\"><strong>{$gdlist[$x]['Gain']}: {$chi['text']}</li>";
			}
		}
		$chiText.='</ul>';
		$goalText='<ul class="t13ne-goals">';
		foreach($goals as $x=>$goal){
			//remove duplicates?
			
			if ($multipliers[$goal['g']]>0){
				$goalText.="<li class=\"t13ne-goal\" title=\"{$gdlist[$x]['Description']}\"><details><summary><strong>{$gdlist[$x]['Goal']} Goal: {$goal['text']} </details></li>";
			}
		}
		$goalText.='</ul>';
		$stressText='<ul class="t13ne-stressors">';
		foreach ($stressors as $x=>$stress){
			//remove duplicates?
			if ($multipliers[$stress['g']]>0){
				$stressText.="<li class=\"t13ne-stress\"  title=\"{$gdlist[$x]['Description']}\"><strong>{$gdlist[$x]['Stress']} Stressor:  {$stress['text']}</li>";
			}
			
			
		}
		$stressText.='</ul>';
		
		
		$keyText = self::writeKeys($key);
		$geo = self::$geometries[$g];
		$soulGift = '<p class="t13ne-gift"><strong>Soul Gift (1 Chi to activate): '.self::$geometries[$soul]['Gift'].'</strong><br/><span class="t13ne-description">'.self::$geometries[$soul]['Gift_Description'].'</span></p>';
		return "<span class=\"t13ne-geonum\">{$g}</span><span class=\"t13ne-geoname\"> {$geo['Name']} </span><p class=\"t13ne-description\"><strong>Description: </strong> {$geo['Geometry_Description']}</p>

		<details class=\"t13ne-goals\"><summary><strong>Goals</strong></summary>{$goalText}</details><br/><details class=\"t13ne-gain\"><summary><strong>Chi Gains</strong></summary>{$chiText}</details><br/><details class=\"t13ne-gain\"><summary><strong>Sway Gains</strong></summary><p class=\"t13ne-yang\">{$geo['Yang']}</p><p class=\"t13ne-yin\">{$geo['Yin']}</p></details><br/><details class=\"t13ne-stress\"><summary><strong>Stressors</strong></summary>{$stressText}</details><br/><details class=\"t13ne-gifts\"><summary><strong>Gifts</strong></summary><p class=\"t13ne-gift\"><strong>Gift: {$geo['Gift']} </strong><br/><span class=\"t13ne-description\">{$geo['Gift_Description']}</span></p>{$soulGift}</details><br/><details class=\"t13ne-numbers\"><summary><strong>Numbers</strong></summary><p class=\"t13ne-geo-nascent\"><strong>Nascent Number: </strong>{$texts['Nascent']['text']} <small>The Nascent Number is the geometry that they began as, and will regress towards  when stressed.</small></p><p class=\"t13ne-geo-soul\"><strong>Soul Number:</strong> {$texts['Soul']['text']} <small>This number describes the geometry that they are most drawn towards and seek to be.</small></p><p class=\"t13ne-geo-facade\"><strong>Facade Number:</strong> {$texts['Facade']['text']} <small>This number describes the facade that the Character projects.</small></p><p class=\"t13ne-geo-ghost\"><strong>Ghost Number:</strong> {$texts['Ghost']['text']} <small>This ghost number indicates a negative shadow aspect perhaps a past life or nomative variant.</small></p></details><div class=\"t13ne-modal-tone\">{$keyText}<strong>Scale / Mode: {$tone['Type']}</strong><br/><span class=\"t13ne-description\"><small>{$tone['Description']}</small></span><br/><span class=\"t13ne-description\">{$tone['Character']}</span></div><p class=\"t13ne-harmony\"><strong>Harmonic Numbers</strong> : $harmonies <br/><strong>\"Perfect\" Harmony </strong>: $perfect<br/><strong>\"Wolf\" Harmony</strong>: $wolf</p><p class=\"t13ne-dissonant\"><strong>Dissonant Numbers</strong> : $dissonants <br/><strong>\"Sustained\" Dissonant </strong>: $sustained<br/><strong>\"Nemesis\" Dissonant</strong>: $nemesis</p>
		 ";
	}
	static public function writeGeoNum($g){
		return ' ('.$g.(($g>9)?'/'.($g-9):'').')';
	}
	static public function calculateFullGeo($name='', $forcegeo=0){
		$alsoKnownAs='';
		$akaNums =0;
		$ret=[];
		if (is_numeric($name)){$fullname="{$name}";}
		if (is_string($name)){
			$name=T13Types::arrayify($name);
		}
		if (is_array($name)){
			$cn=count($name);

			switch($cn){
				case 0:
					$name='Unknown';
					break;
				case 1:
					$akas =$name;
					$name=$name[0];
					$fullname = $name;
				break;
				case 2:
					$akas=$name;
					$fullname = $name[1];
					$name= $name[0];
					break;
				case 3:
				//var_dump($name);
					$akas=T13Types::arrayify($name[2]);
					$fullname =$name[1];
					$name=$name[0];
				//var_dump($name);
				break;
				default:
					$akas = $name;
					$fullname = $name[1];
					$name=$name[0];
				break;
			}
		}
		if (!isset($fullname)){$fullname = $name;}
		if (isset($akas)){
			$akaNums =[];
			if (is_array($akas)){
				
				$akalist=$akas;
			}else{
				
				$akalist=T13Types::arrayify($akas);
			}	
			$akalist = array_keys(array_flip($akalist));		
			if (is_array($akalist)){
				foreach ($akalist as $ak => $aka) {
					$a=intval(self::getGeometryFromString($aka));
					if ($a){
						if (in_array($a, $akaNums)){
							if ($a>9){$akaNums[$ak]=($a-9);}
						}else{
							$akaNums[$ak]=$a;
						}
						
						//var_dump($a);
						$akalist[$ak]=$aka.self::writeGeoNum($a);
					}
					
				}
			}
			$alsoKnownAs=implode(', ', $akalist);
			//print_r($alsoKnownAs.'<br/>');
			//var_dump($akaNums);
		}
		$ret['Name'] = $name;

		$ret['AKAs'] = $alsoKnownAs;
		$ret['AKANums'] = $akaNums;
		$ret['Full'] = self::getGeometryFromString($fullname);
		$ret['Facade'] = self::getGeometryFromString( preg_replace('#[aeiouy\s]+#i', '', $fullname));
		$ret['Soul'] =  self::getGeometryFromString( preg_replace('#[bcdfghjklmnpqrstvwxz\s]+#i', '', $fullname));
		$ret['Initial'] = self::getGeometryFromString(mb_substr(trim($fullname), 0, 1, "UTF-8"));
		$ret['Len'] = strlen($name);
		$ret['Flen'] = strlen($fullname);
		$ret['Fullname'] = $fullname.self::writeGeoNum($ret['Full']);
		if (is_array($forcegeo)){$forcegeo=$forcegeo[0];}
		if (is_string($name)&&$forcegeo==0){
			$g=self::getGeometryFromString($name);
		}elseif(is_numeric($name)&&$forcegeo==0){
			if ($name<14&&$name>0){
				$g=$name;
			}else{$g=0;}
		}else{
			$g=$forcegeo;
		}
		$ret['GeometryNumber'] =$g;
		$ret['Geo'] = self::$geometries[$g];
		if (isset($akaNums)&&is_array($akaNums)){
			$ret['GeoHarmonics'] = self::calculateHarmonics($g,$ret['Soul'],$ret['Facade'],$ret['Initial'],$ret['Flen'],$akaNums);
		}else{
			$ret['GeoHarmonics'] = self::calculateHarmonics($g,$ret['Soul'],$ret['Facade'],$ret['Initial'],$ret['Len']);
		}		
		return $ret;
	}
	static public function calculateGeoKey($name, $forcegeo=0){
		$geo = self::calculateFullGeo($name, $forcegeo);
		return self::getKey($geo['GeoHarmonics']['key']);

	}
	static public function writeName($name){
		$geo=T13Geometry::writeGeo($name,true,0);
		return '<div class="t13ne-name">'.$geo['GeoText'].'</div>';
	}
	static public function writeGeo($name, $showname=true,$forcegeo=0){
		$geo = self::calculateFullGeo($name, $forcegeo);
		//error_log("geo".json_encode($geo));
		//print_r('<br/>'.$name.'='.json_encode($geoh));
		     	
		$harmonies = implode(", ", $geo['GeoHarmonics']['Harmonic']);
		$dissonants = implode(", ", $geo['GeoHarmonics']['Dissonant']);

		if ($showname){
			if (!is_string($geo['Fullname'])){$geo['Fullname']=json_encode($geo['Fullname']);}
			if (is_array($geo['AKAs'])){$geo['AKAs']=implode(', ',$geo['AKAs']);}
			if ($geo['Fullname']!==''){
				$fulltext="<p class=\"t13ne-full-name\"><strong>Full Name:</strong> {$geo['Fullname']}</p>";
			}else{
				$fulltext='<p class=\"t13ne-full-name\"><strong>Full Name:</strong> Unknown</p>';
			}
			if ($geo['AKAs']!==''){
				$aktext="<p class=\"t13ne-akas\"><strong>Also Known As:</strong> {$geo['AKAs']}</p>";
			}else{
				$aktext='<p class=\"t13ne-akas\"><strong>Also Known As:</strong> No Known Aliases</p>';
			}
			$nam=" <span title=\"Fullname: {$geo['Fullname']} Also Known As: {$geo['AKAs']}\">&nbsp;<span class=\"t13ne-display-name\" contenteditable=\"true\">{$geo['Name']}</span></summary>{$geo['Fullname']}{$aktext}<strong> Geometry: </strong>";
		}else{
			$nam=' <strong>Geometry: </strong> ';
		}
		$script="<script></script>";
		$tone=T13Types::$tonalModes[$geo['GeoHarmonics']['ModalTone']];
		$gText="<aside class=\"t13ne-geometry\"><strong >Name:&nbsp;</strong><details class=\"t13ne-name\"><summary> {$nam} ";
		$ggtext=self::writeBlock($geo['GeometryNumber'],$geo['Facade'],$geo['Soul'],$tone,$harmonies,$geo['GeoHarmonics']['Perfect'],$geo['GeoHarmonics']['Wolf'],$dissonants,$geo['GeoHarmonics']['Nemesis'],$geo['GeoHarmonics']['Sustained'],$geo['Initial'],$geo['GeoHarmonics']['key'],$geo['GeoHarmonics']['Ghost'],$geo['Fullname'],$geo['AKAs']);
		$gText.=$ggtext;

		$harmonies = array($geo['GeometryNumber']=>array('geonum'=>$geo['GeometryNumber'],'harmonies'=>$geo['GeoHarmonics']['Harmonic'],'perfect'=>$geo['GeoHarmonics']['Perfect'], 'wolf'=>$geo['GeoHarmonics']['Wolf'], 'dissonants'=>$geo['GeoHarmonics']['Dissonant'], 'sustained'=>$geo['GeoHarmonics']['Sustained'], 'nemesis'=>$geo['GeoHarmonics']['Nemesis'], 'soul'=>$geo['Soul'], 'facade'=>$geo['Facade'], 'initial'=>$geo['Initial'],'key'=>$geo['GeoHarmonics']['key'], 'ghost'=>$geo['GeoHarmonics']['Ghost']));
		if ($geo['GeometryNumber']>9&&($forcegeo==0||$forcegeo!==$geo['GeometryNumber'])){
			$altg=self::$geometries[$geo['GeometryNumber']-9];


			$altgn=$geo['GeometryNumber']-9;
			if (isset($geo['AKANums'])&&is_array($geo['AKANums'])){
				$geoa = self::calculateHarmonics($altgn,$geo['Soul'],$geo['Facade'],$geo['Initial'],$geo['Len'],$geo['AKANums']);
			}else{
				$geoa = self::calculateHarmonics($altgn,$geo['Soul'],$geo['Facade'],$geo['Initial'],$geo['Len']);
			}
			$keya=$geoa['key'];
			$altg['Harmonic']=$geoa['Harmonic'];
			$altg['Dissonant']=$geoa['Dissonant'];
			//$agd = count($altg['Dissonant']);
      		//$agh = count($altg['Harmonic']);      		
      		$altharm = implode(", ", $altg['Harmonic']);
      		$altdis = implode(", ", $altg['Dissonant']);
      		$altper=$geoa['Perfect'];
     		$altsus=$geoa['Sustained'];
     		$altwlf=$geoa['Wolf'];
     		$altnem=$geoa['Nemesis'];
     		$altghost=$geoa['Ghost'];
     		$atone=T13Types::$tonalModes[$geoa['ModalTone']];
			$altg_text='<p><details><summary>Or ';
			$atext = self::writeBlock($altgn,$geo['Facade'],$geo['Soul'],$atone,$altharm,$altper,$altwlf,$altdis,$altnem,$altsus, $geo['Initial'],$keya,$altghost,$geo['Fullname'],$geo['AKAs']);
			$altg_text.=$atext.'
			<br/></details></p>';
			$harmonies = array($geo['GeometryNumber']=>array('geonum'=>$geo['GeometryNumber'],'harmonies'=>$geo['GeoHarmonics']['Harmonic'],'perfect'=>$geo['GeoHarmonics']['Perfect'], 'wolf'=>$geo['GeoHarmonics']['Wolf'], 'dissonants'=>$geo['GeoHarmonics']['Dissonant'], 'sustained'=>$geo['GeoHarmonics']['Sustained'], 'nemesis'=>$geo['GeoHarmonics']['Nemesis'], 'soul'=>$geo['Soul'], 'facade'=>$geo['Facade'],'initial'=>$geo['Initial'],'key'=>$geo['GeoHarmonics']['key'],'ghost'=>$geo['GeoHarmonics']['Ghost']),
			$altgn=>array('geonum'=>$altgn,'harmonies'=>$altg['Harmonic'],'perfect'=>$altper, 'wolf'=>$altwlf, 'dissonants'=>$altg['Dissonant'], 'sustained'=>$altsus, 'nemesis'=>$altnem,'soul'=>$geo['Soul'], 'facade'=>$geo['Facade'], 'initial'=>$geo['Initial'],'key'=>$keya,'ghost'=>$altghost));
		}else{
			$altgeo=0;
			$altg_text="";
		} 
		
		return array('GeoName'=>$geo['Name'],'GeoText'=>$gText.$altg_text.'</details></aside>','Name'=>$name, 'Harmonics'=>$harmonies, 'BaseGeoNum'=>$geo['GeometryNumber']);
	}
	static public function updateImpressionGrid($grid,$x,$y,$value, $display=false){
		$value=intval(ltrim($value,"\n\r\t\v\x00\+"));
		if ($display){
			print_r('updateImpressionGrid  grid='.json_encode($grid).'Updating Char x='.json_encode($x).' opinon of Char y='.json_encode($y).' by value='.json_encode($value).' <br/>');
		}
		//print_r("<br/> '$value' ".gettype($value));
		//print_r("<br/> '".json_encode($grid[$x][$y])."' ".gettype($grid[$x][$y]));
		if (isset($grid[$x][$y]['Value'])&&is_numeric($value)){
			$grid[$x][$y]['Value']+=$value;
			
		}
		return $grid;
	}
	static public function calculateImpressions($names, $forcegeos='0',$modifiers='0'){
		$names = T13Types::arrayify($names);
		$rng=false;
		$n=count($names);
		$nn=$n*$n;
		$forcegeos=preg_replace('/\s+/', '', $forcegeos);
		$modifiers=preg_replace('/\s+/', '', $modifiers);
		$geos = T13Types::arrayify($forcegeos);
		//var_dump($names);
		//var_dump($forcegeos);
		//var_dump($geos);

		$g=count($geos);
		$max_len=0;
		foreach($names as $name){
			if (is_string($name)){
				$len = strlen($name);
			}
			if (is_array($name)){
				$len = strlen($name[0]);
			}
			if ($len>$max_len){$max_len=$len;}
		}
		
			
		if (is_string($modifiers)){
			if ($modifiers=="rng"){
				$modifiers=[];
				for ($i=0;$i<=$nn;$i++){
					$modifiers[$i]=T13Dice::RNG(0,10,-5);
				}
				$rng='<small title="Authors can specify the modifiers to make this random modifier list vanish">Modifiers applied:'.json_encode($modifiers).'</small>';
			}else{
				$modifiers = T13Types::arrayify($modifiers);
			}
		}
		//if (count($modifiers)!==$n*$c){$modifiers='0';}
		$maxw=intval(ceil(100/($n+1)));
		$max_len+=5;
		$output = '<div class="t13ne-tablewrap"><table class="t13ne-table"><thead><tr><th style="min-width:'.$max_len.'em; max-width:'.$maxw.'%;">Names</th>';
		$nameslist = array();
		$geolist =array();
		$glist =array();
		$grid = array(array());
		
		foreach($names as $id=>$name){
			
			if (is_array($geos)&&array_key_exists($id, $geos)){
				//print_r("<br/>{$id} is array and array key exists");
				$thisgeo=T13Geometry::writeGeo($name, true, $geos[$id%$g]);
			}else{
				//print_r("<br/>{$id} is not array or key not found".json_encode($geos[$id%$g]));
				$geos[$id%$g]=0;
				$thisgeo=T13Geometry::writeGeo($name, true, 0);
			}
			foreach($thisgeo['Harmonics'] as $ge=>$geo){
				//var_dump($thisgeo);
				$geo['Name']= $thisgeo['GeoName']." ({$ge}/ N{$geo['initial']}/ S{$geo['soul']}/ F{$geo['facade']}/ G{$geo['ghost']})";
				$geo['GeoT']=T13Geometry::writeGeo($name, true, $ge);
				array_push($geolist, $geo);
				array_push($nameslist, $geo['Name']);
				array_push($glist,$ge); //list of geometries...
				$output.="<th style=\"min-width:{$max_len}em; max-width:{$maxw}%;\">{$geo['Name']}</th>";
			}
		}
		$output.='</tr></thead><tbody>';
		$num =  count($geolist);
		$mods =is_array($modifiers)?count($modifiers):1;
		//var_dump($modifiers);
		//var_dump($mods);
		if ($modifiers=='0'||$modifiers==[0]){
			for ($i=0; $i<$num;$i++){
				for ($j=0;$j<$num;$j++){
					$grid[$i][$j]['Value'] = 0;
					$grid[$i][$j]['Mod'] = 0;
				}
			}
		}else{
			if ($num==$mods){
				for ($i=0;$i<$num;$i++){
					if (is_numeric($modifiers[$i])){
						for ($j=0;$j<$num;$j++){
							$grid[$i][$j]['Value']=$modifiers[$i];
							$grid[$i][$j]['Mod']=$modifiers[$i];
						}
					}
					
				}
			}else{
				
				if ($mods>1){
					for ($i=0; $i<$num;$i++){
						if (is_string($modifiers[$i%$mods])){
							$modifiers[$i]==T13Types::arrayify($modifiers[$i%$mods]);
						}
						if(is_array($modifiers[$i])){
							$grid[$i]['Value']=$modifiers[$i];
							$grid[$i]['Mod']=$modifiers[$i];
						}else{
							for ($j=0;$j<$num;$j++){
								$grid[$i][$j]['Value'] = $modifiers[($i*$num+$j)%$mods];
								$grid[$i][$j]['Mod'] = $modifiers[($i*$num+$j)%$mods];
							}
						}
						
					}
				}else{
					for ($i=0; $i<$num;$i++){
						for ($j=0;$j<$num;$j++){
							$grid[$i][$j]['Value'] = $modifiers[0];
							$grid[$i][$j]['Mod'] = $modifiers[0];
						}
					}
				}
				

			}


		}
		//print_r(json_encode($modifiers));
		//print_r(json_encode($geolist));
		//print_r(json_encode($nameslist));
		//print_r('<br/>');
		$chords=array(array());
		foreach($geolist as $id=>$geo){
			//for each Character

			$souls=array_keys($glist,$geo['soul']);
			foreach($souls as $char){		
				$grid = self::updateImpressionGrid($grid,$id,$char,+1);
			}
			$souls=array_keys($glist,$geo['facade']);
			foreach($souls as $char){
				$grid = self::updateImpressionGrid($grid,$id,$char,+1);
				if ($geo['facade']!==$geo['soul']&&$geo['facade']!==$geo['geonum']&&$geo['facade']!==$geo['initial']&&$geo['facade']!==$geo['ghost'] ){
					$grid = self::updateImpressionGrid($grid,$char,$id,-2);
				}else{
					$grid = self::updateImpressionGrid($grid,$char,$id,+1);
				}
			}

			foreach($geo['harmonies'] as $harmony=>$geometry){
				$row=T13Types::$numberTypes[0];
				$souls=array_keys($glist,$geometry);
				foreach($souls as $char){
					$grid = self::updateImpressionGrid($grid,$id,$char,$row['Impression']);
					$grid = self::updateImpressionGrid($grid,$char,$id,$row['Reaction']);
				}
			}

						
			foreach($geo['dissonants'] as $harmony=>$geometry){
				$row=T13Types::$numberTypes[3];
				$souls=array_keys($glist,$geometry);
				foreach($souls as $char){
					$grid = self::updateImpressionGrid($grid,$id,$char,-1);
					//$grid = self::updateImpressionGrid($grid,$char,$id,-1);
				}
			}		
			
			$souls=array_keys($glist,$geo['perfect']);
			$row=T13Types::$numberTypes[1];
			foreach($souls as $char){
				$grid = self::updateImpressionGrid($grid,$id,$char,$row['Impression']);
				$grid = self::updateImpressionGrid($grid,$char,$id,$row['Reaction']);
			}
			$souls=array_keys($glist,$geo['wolf']);
			$row=T13Types::$numberTypes[2];
			foreach($souls as $char){
				$grid = self::updateImpressionGrid($grid,$id,$char,$row['Impression']);
				$grid = self::updateImpressionGrid($grid,$char,$id,$row['Reaction']);
			}
			$souls=array_keys($glist,$geo['sustained']);
			$row=T13Types::$numberTypes[4];
			foreach($souls as $char){
				$grid = self::updateImpressionGrid($grid,$id,$char,$row['Impression']);
				$grid = self::updateImpressionGrid($grid,$char,$id,$row['Reaction']);
			}
			$souls=array_keys($glist,$geo['nemesis']);
			$row=T13Types::$numberTypes[5];
			foreach($souls as $char){
				$grid = self::updateImpressionGrid($grid,$id,$char,$row['Impression']);
				$grid = self::updateImpressionGrid($grid,$char,$id,$row['Reaction']);
			}
			//var_dump($geo);
			
			//var_dump($souls);
			$groupChord=[intval($geo['key'])];
			$keyNames=[];
			foreach($geolist as $id2=>$char){
				//var_dump($char);
				array_push($groupChord,intval($char['key']));
				

				$interval=self::getInterval(intval($char['key']), intval($geo['key']));
				//print_r('<br/>'.$id.':'.$id2.' Ratio:'.$ratio);
				$effect=$interval['Interval']['Effect'];
				$effec=($effect>0)?'+'.$effect:$effect;
				$chords[$id][$id2]="<details class=\"t13ne-interval\"><summary><strong>Interval: {$interval['Interval']['Name']} ({$effec})</strong></summary><p>{$interval['Interval']['Description']}</p>";
				$keyNames[$char['key']][]=$char['Name'];
						//$chords[$id2][$id]='Chord: '.$interval['Name'].'('.$effec.')';
				$grid = self::updateImpressionGrid($grid,$id,$id2,$effect);	

				//$grid = self::updateImpressionGrid($grid,$id,$id2,$effect);
				//$grid = self::updateImpressionGrid($grid,$id2,$id,$effect);
				
			}
			$groupChord = self::calculateChord($groupChord);
			$chords['ChordGroup']=$groupChord;
			//var_dump($groupChord);			
		}
		//print_r(json_encode($grid));
		foreach($geolist as $x=>$row){
			
			$output.="<tr><td><strong>{$row['Name']}</strong>{$row['GeoT']['GeoText']}</td>";
			$running=0;
			//print_r($row);
			//print_r('<br/>glist');
			///print_r($glist);
			//print_r('<br/>');
			foreach ($glist as $y=>$gn){
				$impno = $grid[$x][$y]['Value'];
				$mod=0;
				if (isset($grid[$x]['Mod'])){$mod=$grid[$x]['Mod'];}
				if (isset($grid[$x][$y]['Mod'])){$mod=$grid[$x][$y]['Mod'];}
				if (isset($chords[$x][$y])){$chord=$chords[$x][$y];}

				if (is_array($mod)){$mod = implode(', ',$mod);}
				if (is_numeric($mod)&&$mod>0){$mod = '+'.$mod;}
				if ($impno>10){$impno=10;}
				if ($impno<-10){$impno=-10;}
				$running+=$impno;
				$impression = "This shouldn't have appeared here";
				foreach (T13Types::$socialOrdealLevels as $solevel){
					if ($solevel['Level']==$impno){
						$output.="<td class=\"t13ne-social-ordeal-level-{$impno}\"><details><summary>{$solevel['Impression']} {$solevel['Type']} ({$impno})</summary> — {$solevel['Description']} </details> <br/>Applied Modifiers: {$mod}<br/>{$chord}</td>";
						break; 
					}
				}
				
			}

			$output.="</tr>";
		}
		if (isset($chords['ChordGroup'])){
				$chor=$chords['ChordGroup'];
				//var_dump($chor);
				
				$keyText = self::writeKeys($chor['Root']);
				$mode = T13Types::$tonalModes[$chor['Mode']['tonalmode']];
				//var_dump($mode);
				$modeText = "<section class=\"t13ne-tonal-mode\"><strong>Mode: {$mode['Type']}</strong><p class=\"t13ne-description\">{$mode['Description']}</p><p class=\"t13ne-character\">{$mode['Group']}</p></section>";
				$notestext='<ul class="t13ne-chord-notes t13ne-comma-list">';
				if (is_string($chor['Chord']['Notes'])){
					$chor['Chord']['Notes'] = T13Types::arrayify($chor['Chord']['Notes']);
				}
				//var_dump($chor);
				//var_dump($keyNames);
				foreach($chor['Chord']['Notes'] as $me=>$note){
					$ke =intval($note)+intval($chor['Root']);
					$key = self::writeKeys($ke);
					$tnn='here';
					//var_dump($keyNames);
					if (is_array($keyNames[$ke])){
						switch (count($keyNames[$ke])){
							case 0:
							$tnn='Error occured';
							break;
							case 1:
							$tnn = $keyNames[$ke][0];
							break;
							case 2:
							$tnn = $keyNames[$ke][0].' and '.$keyNames[$ke][1];
							break;
							default:
							foreach ($keyNames[$ke] as $nm){
								$tnn.=$nm.', ';
							}

						}
						
					}
					$notestext.="<li class=\"t13ne-chord-note\">{$key} {$tnn}</li>";
					
				}
				$notestext.='</ul>';
				$chordText= "<details><summary><strong>{$chor['Chord']['Symbol']}</strong></summary><strong>Chord Name: {$chor['Chord']['Type']}</strong>{$notestext}<p class=\"t13ne-description\">{$chor['Chord']['Description']}</p><p class=\"t13ne-mode\">{$modeText}</p></details>";

				$groupChordText = "<strong>Group Chord: </strong>{$keyText}{$chordText}";
			}
		unset($geolist);
		unset($glist);
		unset($namelist);
		return $output.='</tbody></table><article class="t13ne-chord">'.$groupChordText.'</article></div>'.$rng;
	}
}
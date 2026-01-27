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
 * Fired during plugin activation. Chars
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Chars{
	// Chars come in so many different types that we may need to extend this for all the different types... but I rather hope not.
	// We have to include the Alternates for the other Characters, but I think that these wil be Chars of their own. In other words some Characters are nothing but an array of other Characters... Not sure how we are going to represent them properly, other than having seperate Chars for each alternate...

public static $namesounds= array("vowels"=>array("a","a","a","a", "ae","ae", "ai","ai", "a", "a", "au", "ay","ay","ay", "a", "a","e","e","e","e","e", "e", "ea", "e", "ee","e", "ei", "eo","e", "eu", "ey", "i", "i", "i", "i", "i", "ia","ia","ia","ia","ia", "ie","ie","ie","ie","ie","i", "i", "io","io","io", "io","i", "iu", "o","o","o","o","o", "oa", "oe","o", "oi","oo", "ou", "ou","o", "oy","o", "u", "ua", "ue","u", "ui", "u", "u", "u","'","y"), "consonants"=>array("b","b","c","d","d","f","f","g","h","h","j", "j","k","l","m","m","n","n","p","p","r","s","t","v","w","x","y","z","b","b","c","d","d","d","f","f","g","g","g","k","k","k","k","k","k","l","m","m","m","m","m","r","r","r","r","r","r","r","r","s","s","s","s","t","t","t","t","w","r","r","s","t"),	"end_dbl_consonants"=>array("bb","bb","bb","bb","bb","bd","bt","cc","ck","ck ","ck","ck ","dd","dd","dd","dt","ff","ff","ff","gg","gg ","gh","ld","lf","lf ","ll ","ll","lf","lf ","ll ","ll","lf","lf ","ll ","ll","lp","lv","lk","lk ","lc","ld ","ld","ld","ll","lp ","lm","ln","lk ","lc","mm","mm","mp","mt ","mn","ng","nt","nd","nt","nd","nt","nd","nt","nd","nk","nd","pp","rb","rf","rf","rf","rd","rd ","rd","rd ","rd","rd ","rd","rd ","rp ","rp","rr","rr ","rt","rt ","rs","rr ","rt","rt ","rs","rr ","rt","rt ","rs", "rs","rl","rld ","rk","rk","rk","rc","rst ","rnt","ss","ss","ss","ss","ss","sh","st","tt", "tt ","th","th ","ts","ft", "ft ","wn","yt","zz","zz ","ry ","ry","rry","tty","ty","ry","ty","ly","ly","by","bly","ctly","mpt","rnt","rmt","rmp"), "start_dbl_consonants"=>array("br","br","bl","bl","bw","ch","ch","ch","chr","cl","cl","cr","dh","dr","dr","dw","fl","fl","fh","fr","fr","fr","gh","gl","gr","gr","dj","jh","kn","kn","kl","kr","kr","ph","ph","ph","phr","pl","pl","pr","pr","pr","pr","qu","rh","sh","shr","sh","sh","sl","st","sl","st","st","st","shr","str","str","th","th","th","th","tr","thr","thr","th","tr","tr","tr","thr","vy","wh","wr","wr","wr","xh","y","tz","br","ch","cl","cr","dr","fl","fr","gl","gr","kr","pl","pr","pw","sh","sl","st","sr","str","th","tr","thr","wr"),

					"patterns"=>array(array("cv","cv","vc","cvc", "sve", "sv","ve", "sv",'svc','cve'),array("svcv","svev","cvec","cvcv","svcve","cvcve", "vsve", "vcve", "vsvc"),array("svcvcve","svcvcv","svevcv","svevcve","cvcvcv","cvcvcve","cvcveve","cvcvevc"),array("cvcvcvcv", "svcvcvcve", "vsvcvcvc","svcvcvcv", "cvcvcvcve", "vcvsvcve" ))
				);

static public function createRandomName($syllables=1){
	$name="";
	$pats=count(self::$namesounds['patterns']);
	if ($syllables<$pats){
		$syll =$syllables-1;
		$pattern = self::$namesounds['patterns'][$syll][array_rand(self::$namesounds['patterns'][$syll])];
	}else{
		$pattern = self::$namesounds['patterns'][$pats-1][array_rand(self::$namesounds['patterns'][$pats-1])];
		$syll=$syllables-$pats;
		if ($syll<$pats){
			$pattern .= self::$namesounds['patterns'][$syll][array_rand(self::$namesounds['patterns'][$syll])];
		}else{
			while (strlen($pattern)<$syllables){
			$pattern=substr_replace($pattern, self::$namesounds['patterns'][0][array_rand(self::$namesounds['patterns'][0])], T13Dice::RNG(1, strlen($pattern)-1));
			}
		}


	}

	$pattern = self::$namesounds['patterns'][$syll][array_rand(self::$namesounds['patterns'])];
	for ($j =0;$j<strlen($pattern);$j++){
		$char = $pattern[$j];
		switch($char){
			case "c":
			$name.=self::$namesounds['consonants'][array_rand(self::$namesounds['consonants'])];

			break;
			case "v":
			$name.=self::$namesounds['vowels'][array_rand(self::$namesounds['vowels'])];

			break;
			case "e":
			$name.=self::$namesounds['end_dbl_consonants'][array_rand(self::$namesounds['end_dbl_consonants'])];

			break;
			case "s":
			$name.=self::$namesounds['start_dbl_consonants'][array_rand(self::$namesounds['start_dbl_consonants'])];
			break;
		}
	}

	return $name;
}
		private static $coreChars = array( //$name,$altType, $description,$alts[$alt_id,$altType,$alt_name,$statblock,$annexes,$profs,$descs],$facets,$genres,$eras, $scope, $publish=false,$parent
			array('Name'=>'Josephine Bloggs', 'Scale'=>3,'Genre'=>'T13 Core', 'Era'=>'Timeless', 'Facet'=>'All Facets', 'Scope'=>'Omniversal', 'Char_Type'=>6, 'PCType'=>3, 'Sway'=>array('Yarn'=>0,'Chi'=>0, 'Yin'=>0,'Yang'=>0),'Description'=>'Jo Bloggs is a standard, average, one might even say example, character. She\'s an average person, who you can easily drop into any situation, where she will probably get killed, unless she quickly specialises. She is an example Detailed Character.','Cards'=>['Pool'=>[],'Hand'=>[],'Significators'=>[],'Style_Pools'=>[['Traditional'=>0],[]]], 'Alts'=>array(
				array('Alternate'=>'0', 'Alt_Type'=>0,'Alt_Name'=>'Jo','Statblock'=>'3:13:15=45', 'Incarna'=>13, 'Alt_Similarity'=>0, 'Alt_Integration'=>0, 'PCType'=>1, 'Styles'=>['Traditional','Natural'],
					'Annexes'=>array(
						array('Name'=>'Personality', 'Persona'=>'Hallow', 'Core'=>'Prevailer', 'ABoon'=>'%%', 'Annex_Type'=>7,
							'Profs'=>array(
								array('Prof'=>'Goals', 'Prof_Description'=>'Goals are the things that we are working towards, they are also a way of scoring points in some sports...', 'Facet'=>'Yonder', 'ProfInAnnex'=>10),
							),
							'Hitches'=>array(
							array("Hitch"=>0, "Facet"=>"Awe", "Name"=>"Nervous", "Description"=>"Some people are just naturally nervous, they jump and start at the slightest thing and may find it hard to concentrate.", "HBoon"=>11, "HitchType"=>4, "Resolved"=>0),
							array("Hitch"=>0, "Facet"=>"Burden", "Name"=>"Tender Hearted", "Description"=>"Some people are just more sentimental than others.", "HBoon"=>8, "HitchType"=>4, "Resolved"=>0),
							array("Hitch"=>0, "Facet"=>"Heresy", "Name"=>"Superstitious", "Description"=>"Superstition is very common, and whether its lucky numbers, black cats, the number Thirteen or walking under a ladder, lots of things can set a Character off.", "HBoon"=>10, "HitchType"=>3, "Resolved"=>0)
							)
						),
						array('Name'=>'Working Hard', 'Description'=>'Some people are just great at working hard, no matter what the task they will work until the job is done.', 'Annex_Type'=>3, 'ABoon'=>'%%',
							'Profs'=>array(
									array('Prof'=>'Work', 'Prof_Description'=>'Work is employment, exertion or effort towards a particular goal.', 'Facet'=>'Craft', 'ProfInAnnex'=>0),
									array('Prof'=>'Hard', 'Prof_Description'=>'Some materials are Hard, almost impossible to penetrate, but just like the adjective, Hard can also mean more difficult. The Hard Proficiency represents the resilience and defensiveness of the Rook Facet as well as Resistance and Difficulties.', 'Facet'=>'Rook', 'ProfInAnnex'=>1),
									array('Prof'=>'Progress', 'Prof_Description'=>'Developmental activity toward a goal is how the dictionary defines progress, which is how you get anywhere, one step at a time. Progress is often seen as an improvement, rather than simply a change, it is not enough to walk anywhere, the destination must be better, or at least higher, than where you started.', 'Facet'=>'Inertia', 'ProfInAnnex'=>2),
									array('Prof'=>'Deception', 'Prof_Description'=>'Deceiving people and making them believe untrue things, like their cheque is in the mail, you weren\'t doing what they thought, or that you were really working, not just reading social media.', 'Facet'=>'Heresy', 'ProfInAnnex'=>9),
									array('Prof'=>'Talking', 'Prof_Description'=>'Talking is the simplest form of communication for most Characters. It presupposes an understanding of language and an ability to hear spoken words though.', 'Facet'=>'Yonder', 'ProfInAnnex'=>8),
							)
						),
						array('Name'=>'Doing Activities', 'Description'=>'Quite possibly the most basic Annexes one can have. It can be used for almost anything, but rarely does anything well.', 'Annex_Type'=>1, 'ABoon'=>'%%',
							'Profs'=>array(
								array('Prof'=>'Effort', 'Prof_Description'=>'Effort is energy placed toward accomplishing a goal.', 'Facet'=>'Virtue', 'ProfInAnnex'=>0),
								array('Prof'=>'Activities', 'Prof_Description'=>'Activities are simply actions that someone is doing. This proficiency is incredibly unspecific, and will never act as two Proficiencies for the Proficiency Test.', 'Facet'=>'Zeal', 'ProfInAnnex'=>1)
							)
						),
						array('Name'=>'Sensing Stuff', 'Description'=>'A simple sense skill, can be used for perception checks like listening, or spot bleeding obvious/hidden.', 'Annex_Type'=>1, 'ABoon'=>'%%',
							'Profs'=>array(
								array('Prof'=>'Stuff', 'Prof_Description'=>'Stuff is a generic term for all physical objects, characters and locations. It is unspecific and will never act as two Proficiencies for the Proficiency Test.', 'Facet'=>'Burden', 'ProfInAnnex'=>0),
								array('Prof'=>'Senses', 'Prof_Description'=>'Senses is the general name for how Characters perceive the world around them. Individual senses include vision, hearing, scent, taste, touch, thermoception, and many more.', 'Facet'=>'Key', 'ProfInAnnex'=>1)
							)
						),
						array('Name'=>'Networking', 'Description'=>'Networking is a subset of Social Skills that specialises in interactions with people and maintaining connections. Networking will allow characters to have contacts in particular fields (depending upon the rarity of the field according to the Referee), and may even allow them Allies too.', 'Annex_Type'=>2, 'ABoon'=>'%%',
							'Profs'=>array(
								array('Prof'=>'People', 'Prof_Description'=>'People is a pretty generic term for lots of persons...', 'Facet'=>'Dominion', 'ProfInAnnex'=>0),
								array('Prof'=>'Communications', 'Prof_Description'=>'Communications are the way we communicate, speech, writings, in fact all languages, are perhaps just a communications technology (or perhaps vice versa). Of course modern communications technologies are much more advanced, allowing us to send pictures of kittens all over the planet for no real reason what so ever.', 'Facet'=>'Yonder', 'ProfInAnnex'=>1),
								array('Prof'=>'Networks', 'Prof_Description'=>'Networks are collections of connections, that connect nodes which might people information, things, locations or people.', 'Facet'=>'Dominion', 'ProfInAnnex'=>3)
							)
						),
						array('Name'=>'Day-to-Day Survival', 'Description'=>'Day-to-day survival is keeping the body moving, not dying, not losing your job, managing to get enough food, medicine, shelter, or whatever else you need to keep on keeping on.', 'Annex_Type'=>2, 'ABoon'=>'%%',
							'Profs'=>array(
								array('Prof'=>'Enduring', 'Prof_Description'=>'Enduring is simply the ability to keep on going no matter what has happened. You might endure a wound that would kill a lesser person immediately, but it does nothing to reduce the wound or making it easier to survive.', 'Facet'=>'Inertia', 'ProfInAnnex'=>0),
								array('Prof'=>'Survival', 'Prof_Description'=>'Continuing to live despite all the stuff stacked against you can be a real challenge.', 'Facet'=>'Inertia', 'ProfInAnnex'=>1),
								array('Prof'=>'Living', 'Prof_Description'=>'Living is the thing that separates living matter from dead, and we really don\'t have a much better definition than that.', 'Facet'=>'Nature', 'ProfInAnnex'=>2)
							)
						)
					),
					'Descendants'=>array(
						array('Name'=>'Stone Axe','IncarnaFacet'=>'Trial', 'LocationFacet'=>'n/a', 'DescendantType'=>0, 'Era'=>'Prehistory', 'Scope'=>'Multiversal', 'Description'=>'The Stone (or more correctly Flint) Axe is one of humankind\'s first tools. The Axe consists of a sharpened stone, sometimes attached to a wooden handle (although not always, the axehead can be held neatly in the palm of the hand also).','Owner'=>'Josephine Bloggs','Annexes'=>array(
							array('Name'=>'Chopping', 'Annex_Type'=>2, 'Description'=>'Chopping is a primitive Hack attack, and was one of the first deadly Annexes developed in weapons technology after the Pound attack.', 'Statblock'=>'3:13:15=45', 'ABoon'=>'%%','Profs'=>array(
									array('Facet'=>'Craft', 'Prof'=>'Knapping', 'Prof_Description'=>'Knapping is the crafting process of shaping stones by chipping away rock to make a sharp edge, it works especially well on glassy volcanic rock and flint.' , 'ProfInAnnex'=>0),
									array ('Facet'=>'Trial', 'Prof'=>'Prehistoric Weapons', 'Prof_Description'=>'The Prehistoric Weapon Proficiency covers all early weapons mankind invented, including, hammers, axes, spears, arrows, blowguns, slings and swords.', 'ProfInAnnex'=>1),
									array('Facet'=>'Quiet', 'Prof'=>'Stave', 'Prof_Description'=>'Staves (or staffs) are thick wooden sticks that were the most common handles for tools and weapons for hundreds of millennia.', 'ProfInAnnex'=>4),
									array('Facet'=>'Burden', 'Prof'=>'Flint Tool', 'Prof_Description'=>'Flint tools were the height of technology for most of the neolithic era.' , 'ProfInAnnex'=>6),
									array('Facet'=>'Nature', 'Prof'=>'Leather Bindings', 'Prof_Description'=>'Water soaked sinew and leather can be used to fix and attach two materials together. As the leather or sinew dries it tightens making the two bound objects fairly inseparable.', 'ProfInAnnex'=>8),
								)
							)
						),
						 'Hitches'=>array(
							array('Name'=>'Stone Axe Upkeep','Facet'=>'Craft', 'Specify'=>1, 'HitchType'=>7, 'Description'=>'The Stone Axe will constantly degrade, requiring repairs or rebuilding from an appropriate stone, wood and leather or animal sinew bindings.', 'HBoon'=>6)
						)
					),
					array('Name'=>'Rented Apartment','IncarnaFacet'=>'Yonder', 'LocationFacet'=>'Urban', 'DescendantType'=>3, 'Era'=>'Modern', 'Scope'=>'Multiversal', 'Description'=>'The Rented Apartment is the most common residence in the modern world (and quite a lot of possible futures). They are usually quite a small place (although larger ones exist).','Owner'=>'Josephine Bloggs','Annexes'=>array(
							array('Size'=>7, 'Name'=>'Size', 'Annex_Type'=>6),
							array('Name'=>'Small Modern Apartment', 'Annex_Type'=>1, 'Description'=>'A small, modern apartment is a simple residence. Big enough for one or two people to live in. It has a bedroom (or two), a bathroom, and an open plan common area, with a kitchenette. The Apartment comes fully furnished for the modern age, and even has a few days food and some emergency supplies.', 'Statblock'=>'3:13:15=45', 'ABoon'=>'%%',
							'Profs'=>array(
								array('Facet'=>'Craft', 'Prof'=>'Modern Technology', 'Prof_Description'=>'Modern technology is a all wi-fi connected, with broadband internet. Power is cheap and convenient and data is available in at least three different channels, from phone, internet, and cable or satellite TV.' , 'ProfInAnnex'=>0),
								array ('Facet'=>'Yonder', 'Prof'=>'Housing', 'Prof_Description'=>'Housing is a standard that most of us enjoy. Whether a cave, a hovel, or a luxury apartment or mansion.', 'ProfInAnnex'=>1),
								)
							)
						),
						 'Hitches'=>array(
							array('Name'=>'Weekly Rent','Facet'=>'Craft', 'Specify'=>0, 'HitchType'=>8, 'Description'=>'Weekly Rent must be paid weekly or you lose the Descendant that you are renting.', 'HBoon'=>9)
						)
					),
					array('Name'=>'Society', 'IncarnaFacet'=>'Dominion', 'LocationFacet'=>'n/a','DescendantType'=>8, 'Era'=>'Timeless', 'Scope'=>array('Limited Scope', 'Location'), 'Genre'=>'T13 Core', 'Description'=>'Society is always a Local Pact, our society is different to their society, but of course how big "Our" society is can be very different depending which society you are talking about. The society of a pre-historical Nomad is very different in Size (and the most powerful Pact Member, probably) than a Citizen of the Galaxy. This will be reflected in the Annexes and Costs that you use.', 'Annexes'=>array(
							array('Name'=>'Omniversal Group','Annex_Type'=>5,'Description'=>'This group is Omniversal in nature. All people of any sort are potentially members of the group and hence its enormous potential value.', 'Pact'=>array('PactMember'=>'Josephine Bloggs', 'MaxChar'=>'Solo', 'GroupSize'=>'2000000000000000000000', )),
							array('Name'=>'Contacts', 'Annex_Type'=>3, 'Statblock'=>'13:26:15=45', 'ABoon'=>'%%','Description'=>'Society is always a matter of not what you know, but who. If you are a member of a society, you will have Contacts within that society. Contacts can help you out, perhaps getting something cheaper, or more illegal than you might be able to find normally, or they might have information, opportunities or skills that you desire.', 'Profs'=>array(
									array('Facet'=>'Orthodox','Prof'=>'Memory','Prof_Description'=>'Memory is the ability to store information for later retrieval. Computer Memory is generally perceived as more permanent and less "lossy" than biological memory, which is so notoriously bad, when combined with our flawed perceptions, it is a wonder any of us can ever remember anything.', 'ProfInAnnex'=>0),
									array('Facet'=>'Dominion','Prof'=>'Societies','Prof_Description'=>'Societies are groups (or Pacts) of persons or people associated together for religious, benevolent, cultural, scientific, political, patriotic, geographical, or other purposes.', 'ProfInAnnex'=>1),
									array('Facet'=>'Key','Prof'=>'Recall','Prof_Description'=>'Recall is the ability to accurately remember information from memory. It can be used to recall any piece of information that has been stored.', 'ProfInAnnex'=>2),
									array('Facet'=>'Yonder','Prof'=>'Addresses','Prof_Description'=>'Addresses are simply a form directions to get to a specific recipient. They include email and postal addresses as well as perhaps phone numbers and ', 'ProfInAnnex'=>7),
									array('Facet'=>'Nature','Prof'=>'Faces','Prof_Description'=>'Faces are what humans perceive the front of a head to be. Our brains are so well built to perceive faces that we spot them even when they are not really present. Faces usually consist of eyes, occasionally ears, and a mouth set around a nose, but some parts may be missing and it still be a face.', 'ProfInAnnex'=>6)
								)
							)
						)
					)
				)
			)
		)
	),
	array('Name'=>'Joseph Bloggs', 'Scale'=>2 , 'Genre'=>'T13 Core', 'Era'=>'Timeless', 'Scope'=>'Omniversal', 'Char_Type'=>4, 'PCType'=>1, 'Sway'=>array('Yarn'=>0,'Chi'=>0,'Yin'=>0,'Yang'=>0),'Description'=>'Joseph Bloggs (Joe to his friends) is a standard, average, one might even say example, character. He\'s an average person, who you can easily drop into any situation, where he will probably get killed. He is an example Lite Character','Lite'=>array( 'Persona'=>'Hallow', 'Core'=>'Prevailer', 'ABoon'=>'%%', 'Annex_Type'=>7, 'PCType'=>1,
		'Hitches'=>array(
		array("Hitch"=>0, "Facet"=>"Awe", "Name"=>"Nervous", "Description"=>"Some people are just naturally nervous, they jump and start at the slightest thing and may find it hard to concentrate.", "HBoon"=>11, "HitchType"=>4, "Resolved"=>0),
		array("Hitch"=>0, "Facet"=>"Burden", "Name"=>"Tender-hearted", "Description"=>"Some people are just more sentimental than others.", "HBoon"=>8, "HitchType"=>4, "Resolved"=>0),
		array("Hitch"=>0, "Facet"=>"Heresy", "Name"=>"Superstitious", "Description"=>"Superstition is very common, and whether its lucky numbers, black cats, the number Thirteen or walking under a ladder, lots of things can set a Character off.", "HBoon"=>10, "HitchType"=>3, "Resolved"=>0)
		),
		'Profs'=>array(
			array('Prof'=>'Sport (Association Football)', 'Prof_Description'=>'Sports are competitions based around a physical activity, usually they involve running and some other sort skill like ball control or racquet skills. This one is for the English game association football, better known as Soccer.', 'Facet'=>'Trial', 'ProfInAnnex'=>10, 'Multiplier'=>2),
			array('Prof'=>'Day Job', 'Prof_Description'=>'A Day job is continuous work, it might not be the most exciting job in the world, but the hours are regular, and the work not too hard.', 'Facet'=>'Craft', 'ProfInAnnex'=>10, 'Multiplier'=>4),
			array('Prof'=>'Adventures', 'Prof_Description'=>'Adventures just happen to some people, they can\'t step out of the door without interplanetary pirates shanghaiing them, or something. Still better to have some experience when danger is happening.', 'Facet'=>'Liberty', 'ProfInAnnex'=>10,'Multiplier'=>2),
			array('Prof'=>'Survival', 'Prof_Description'=>'Survival is something all life forms are programmed for. Knowing to find food, warmth and shelter are instincts that some people choose to ignore at their own peril.', 'Facet'=>'Nature', 'ProfInAnnex'=>10, 'Multiplier'=>1),
			array('Facet'=>'Craft', 'Prof'=>'Modern Technology', 'Prof_Description'=>'Modern technology is all wi-fi connected, with broadband internet. Power is cheap and convenient and data is available in at least three different channels, from phone, internet, and cable or satellite TV.' , 'ProfInAnnex'=>10, 'Multiplier'=>1)

		),
	))
);
public static function writeCharacterScript(){
	return 'window.T13NE.NameSounds = '.json_encode(self::$namesounds).';';
}
	public static function displayChars($author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any', $scope='any', $parent='any'){
		return T13Elements::getT13Elements('Character', array('Author'=>$author,'Geo'=>$geo,'Tags'=>$tags,'Facet'=>$facet,'Genre'=>$genre,'Era'=>$era, 'Scope'=>$scope, 'Parent'=>$parent));
    }
	static public function displayChar($char,$mode='fancy'){
		$cssmode=strtolower($mode);
	//var_dump($char);
	//shortcode character display... modes could be pact, full, fancy, collapse?

	$csr=T13Elements::getT13Element('Char',$char);
	$rethtml = $csr['HTML-header'];
	$charObj = $csr['Element'];
	$facet=$csr['Facet'];
	$terms=$csr['Terms'];
	$charTyper = $terms['Element'];
	if ($facet!='%'){
		$displayFacet=T13Facets::writeFacet($facet,'fancy');
	    }
	/*WP_Post Object
			(
			    [ID] =>
			    [post_author] =>
			    [post_date] =>
			    [post_date_gmt] =>
			    [post_content] =>
			    [post_title] =>
			    [post_excerpt] =>
			    [post_status] =>
			    [comment_status] =>
			    [ping_status] =>
			    [post_password] =>
			    [post_name] =>
			    [to_ping] =>
			    [pinged] =>
			    [post_modified] =>
			    [post_modified_gmt] =>
			    [post_content_filtered] =>
			    [post_parent] =>
			    [guid] =>
			    [menu_order] =>
			    [post_type] =>
			    [post_mime_type] =>
			    [comment_count] =>
			    [filter] =>
			)*/
			if (!is_wp_error($charObj)){
				if (!is_array($charTyper)){
					$charTyper=array($charTyper);
				}
				foreach ($charTyper as $char_Type){
					$chart=$char_Type->name;
					switch (strtolower($chart)){
						case 'full':
						$charT='Dramatis Personae Character';
						break;
						case 'detailed':
						$charT='Detailed Character';
						break;
						case 'lite':
						$charT='Lite Character';
						break;
						case 'archetype':
						$charT='Archetype Character';
						break;
						case 'extra':
						case 'pattern':
						$charT='Extra';
						break;
						case 'character':
						case 'char':
						case 'weaver':
						$charT='Character';
						break;
						default:
						$charT = "{$chart} wasn't recognised";
						break;
					}
				}
				switch ($cssmode){
					case 'pact':
					$rethtml.="<div class=\"t13ne-char-{$cssmode}<strong>Pact Member: </strong>";
					case 'link':

						$rethtml.="<strong class=\"t13ne-chartitle\">{$charT}: </strong><a href=\"\">{$charObj->post_title}</a>";
					default:
						$rethtml.="<div class=\"t13ne-char-{$cssmode}\"><strong class=\"t13ne-chartitle\">{$charT}: </strong><details><summary>";
						$rethtml.=' <span class="t13ne-title"> <q>'.$charObj->post_title.'</q> </span>';
						$rethtml.='</summary>';
						$content=$charObj->post_content;
						$rethtml.='<div class="t13ne-postdata">'.do_shortcode($content).'</div>';

						$rethtml.=$csr['Date'].'</details></div>';
					break;
				}
				return $rethtml.$csr['HTML-footer'];
			}else{
				return json_encode($charObj);
			}
    }
    static public function displayCharType($type){
	if (is_numeric($type)){
			$typ=T13Types::$charTypes[$type]['Type'];
		}else{
			foreach(T13Types::$charTypes as $ctyp){
				if ($type==$ctyp['Type']){
					$typ=$ctyp;
					break;
				}
			}
		}
	return "<details class=\"t13ne-char-type\" data-type=\"{$typ['Type']}\"><summary><strong>Character Type: </strong> {$typ['Type']}</summary><p class=\"t13ne-description\">{$typ['Description']}</p><p class=\"t13ne-rules\">{$type['Rules']}</p></details>";
    }


     static public function extraContent($name,$data, $nuElement,$publish ){
		$extraContent='This is where the Extras Name, Annexes and Hitches appear. This is not written yet. But is basically a Descendant call with some extra character data. ';
		return array('Content'=>$extraContent,'Base_Cost'=>0,'Min_Cost'=>0);
    }
    static public function liteContent($name, $lite, $data, $publish){
	$liteTerms=$data['Terms'];
	//Lite can have I-Ching (but not Facets), Incarna, Core, Persona, Hitches, and LiteProfs. But Hitches give one Prof per Bane.
	$liteContent='<!--Lite Character--><section class="t13ne-lite">';
	if (isset($lite['I-Ching'])){
		$liteContent .= T13Statblock::displayIChing($lite['I-Ching']);
	}elseif(isset($lite['Statblock'])){
		$liteContent .= T13Statblock::displayIChing($lite['Statblock']);
	}
	if (isset($lite['Persona'])){
			$liteContent.="<h4>{$name} Lite Personality</h4><ul class=\"t13ne-personality-annex\" data-debug=\"".json_encode($lite).'">';
			if ($lite['Persona']&&isset($lite['Core'])){

				$liteContent.="<li class=\"t13ne-persona t13ne-tooltip\" >[t13ne type=\"select\" select=\"persona\" selected=\"{$lite['Persona']}\" /]<div class=\"t13ne-tooltip\">The Persona of the Personality Annex controls how the Character will behave by guiding what motivates them, what they avoid and how they gain Chi.</div></li><li class=\"t13ne-core t13ne-tooltip\" >[t13ne type=\"select\" select=\"core\" selected=\"{$lite['Core']}\" /]<div class=\"t13ne-tooltip\">The Core of the Personality Annex grants additional abilities to a Character, or an additional way of generating Chi (even additional Personas).</div></li>";
				$profcount=0;
				if (isset($lite['Hitches'])){
					if (is_string($lite['Hitches'])){
						$lite['Hitches']=json_decode($lite['Hitches']);
					}
					$countHitches=count($lite['Hitches']);
					$red=T13Boons::getBoonReduced($countHitches);
					$liteContent.="<div class=\"t13ne-count-hitches t13ne-hidden\" data-count=\"{$countHitches}\" data-reduced-count=\"{$red}\"></div>";
					$hitchterms=$data['Terms'];
					$hitchTerms['Parent']=$data['post_id'];
					foreach ($lite['Hitches'] as &$handi){
						if ($handi['Hitch']==0){ //this hitch isn't installed...
							$handi['HitchTier']=0;
							if (($handi['HBoon']>10)&&($handi['HBoon']<=20)){
								$handi['HitchTier']=1;
							}else if($handi['HBoon']>20){
								$handi['HitchTier']=2;
							}
							$hitchTerms['Facet']=$handi['Facet'];
							$handi['Hitch']=T13Elements::addT13Element('Hitch',$handi['Name'],$handi,$hitchTerms, $publish);
						}
						if ($handi['Resolved']){
							$banepoints=4; //resolved Handicaps are considered at 20.
						}else{
							$banepoints=T13Boons::getBoonReduced($handi['HBoon'],false);
						}
						$profcount+=$banepoints;
						$htier=strtolower(T13Hitches::$hitchTiers[$handi['HitchTier']]['Tier']);
						$personality['Value']+=T13Boons::getBoonValue($handi['HBoon']);
						$liteContent.="<li class=\"t13ne-hitches t13ne-tooltip t13ne-{$htier}\" data-boon=\"{$handi['HBoon']}\">[t13ne type=\"hitch\" hitch=\"{$handi['Hitch']['post_id']}\" hboon=\"{$handi['HBoon']}\" boon=\"20\" char=\"{$data['post_id']}\" resolved=\"{$handi['Resolved']}\" /]<div class=\"t13ne-tooltip\">Hitches add Proficiency Slots to Lite Characters. This adds {$banepoints} Slots</div></li>";
					}
					$liteContent.='</ul>';
				}

			}
		}
		if (isset($lite['Alts'])){
			//Lite Alts are lites/Extras...
			$liteContent.='<h4> Lite Alternates </h4><ul class="t13ne-lite-alts">';
			foreach($lite['Alts'] as $alt){
				if (isset($alt['Name'])){$lname=$alt['Name'];}
				if (isset($alt['Alt_Name'])){$lname=$alt['Alt_Name'];}
				if (isset($alt['Lite_Name'])){$lname=$alt['Lite_Name'];}
				if (isset($alt['Extra_Name'])){$lname=$alt['Extra_Name'];}
				if (isset($lname)){
					switch($alt['Char_Type']){
						case 0: //vex
						case 1: //chorus
						case 2: //cast
						case 3: //Force-of-Nature
						//extras
							$exterms=$liteTerms;
							$alt['Extra']=T13Elements::addT13Element('Extra', $lname, $alt, $exterms, $publish);
							$liteContent.="<li>[t13ne type=\"char\" char=\"{$alt['Extra']['post_id']}\"]</li>";
						break;
						case 4:
						//lite
							$alTerms=$liteTerms;
							$alt['Lite']=T13Elements::addT13Element('Lite', $lname, $alt, $alTerms, $publish);
							$liteContent.="<li>[t13ne type=\"char\" char=\"{$alt['Lite']['post_id']}\"]</li>";
						break;
						default:
							$liteContent.='<li>Alt not compatible with Lite Character.</li>';
					}
				}else{
					die('no Name found for Lite Alt '.json_encode($alt).' in ');
				}
			}
		}
	if (isset($lite['Profs'])){
		$liteProfs=array();
		if ($profcount){
			$profsleft=$profcount;
			foreach ($lite['Profs'] as $prof){
				if (isset($prof['Prof'])){
					if (is_string($prof['Prof'])){
						$pterms=$liteTerms;
						$pterms['Facet']=$prof['Facet'];
						//
					}elseif (is_numeric($prof['Prof'])){
						$prof['id']=T13Elements::getT13Element('Proficiency', $prof['Prof']);
						$prof['Prof']=$prof['id']['Element']->post_title;
						$prof['Prof_Description']=$prof['id']['Element']->post_content;
						$pterms=$prof['id']['Terms'];
					}
					if (!isset($liteProfs[$prof['Prof']])){
						$liteProfs[$prof['Prof']]=$prof;
						$liteProfs[$prof['Prof']]['Count']=1;
					}else{
						$liteProfs[$prof['Prof']]['Count']++;
					}
				}else{
					$liteProfs[]='No Proficiency Found';
				}
				$profsleft--;
			}
			$liteContent.='<h4> Lite Proficiencies </h4><ul class="t13ne-lite-profs">';
			foreach($liteProfs as $nm=>$lp){
				if(isset($lp['Count'])){
						$rule=T13Types::$liteBoons[$lp['Count']-1];
					}else{$rule=array('Boon_Equivalent'=>0, 'Type'=>'Broken', 'Description'=>'There\'s something mighty fishy about this here Lite Proficiency.');
					}//array('Type'=>'Proficiency','Description'=>'The equivalent of a single Facet.','Boon_Equivalent'=>10),
				//$lp['Profs']['Prof_Description']
				$scale=0;
				if (isset($lite['Scale'])){$scale=intval($lite['Scale']);}
				$lboon=T13Boons::writeFullBoon($rule['Boon_Equivalent']+$scale);
				$liteProfs['Profs'][] = T13Elements::addT13Element('Proficiency', $nm, $lp, $pterms, $publish);
				$facetText=T13Facets::getFacet($lp['Facet']);
				$liteContent.="<li><details class=\"t13ne-lite-prof\"><summary><strong>{$nm} </strong> &times; <span class=\"t13ne-prof-count\">{$lp['Count']}</span></summary><p class=\"t13ne-description\">{$lp['Prof_Description']}</p><p class=\"t13ne-rules\"><strong>{$rule['Type']}</strong> — {$rule['Description']}<p class=\"t13ne-prof-facet\">{$facetText}</p></details> <strong>Boon Equivalent: </strong> {$lboon}</li>";
			}
			$liteContent.='</ul><p class="t13ne-lite-profs">Proficiency Slots remaining: <span class="t13ne-prof-slots">'.$profsleft.'</span></p></section>';
		}
	}
		return array('Content'=>$liteContent, 'LiteProfs'=>$liteProfs['Profs'], 'Hitches'=>$countHitches);
    }
    static public function altContent($name,$alt, $terms, $publish){
		//$eltype,$name,$data,$terms, $publish=true

	$prepare=T13Elements::addT13Element(T13Types::$charTypes[$alt['Char_Type']]['Type'],$name, $alt, $terms, $publish);


	//var_dump($prepare);

	if (is_wp_error($prepare['post_id'])){die("Error: Critical error while trying to add Alt Char {$alt['Alt_Name']}");}

	return $prepare;
    }
    static public function charContent($name, $char, $data, $publish){
	// This needs some careful thought to break out from the other stuff... EDIT HERE
	$ret=array('Min_Cost'=>1,'Base_Cost'=>0);
		$geo=$data['Terms']['Geo'];
		$charText=array('Character'=>'<!-- Character/Extra //-->','Annexes'=>'<!-- Annexes //-->','Lites'=>'<!--Lite Char //-->','Alts'=>'<!-- Char Alts //-->',   'Extras'=>'<!-- Extra Char //-->', 'Descendants'=>'<!-- Char Descendants//-->');
		$PCType='';
	$typ='';
	$alttype='';
	$similarity='';
	$integration='';
	$incarna='';
	$stats='';
	$statSC='';
	$description = '<!--Char Description //-->';
	if (isset($char['Description'])){
		$description = T13Sanitize::sanitize($char['Description']);
	}else{
		$desc=json_encode($char);
		$pos=strpos('"Description":',$desc);
		if ($pos){
			$desc=substr($desc, $pos+13);
			$pos=strpos('"', $desc);
			$description=substr($desc, $pos);
		}
	}
		if (isset($char['Char_Type'])){
		$typ="[t13ne type=\"select\" select=\"chartype\" selected=\"{$char['Char_Type']}\" /]";
		$chi=T13Sway::getSwayForType(T13Types::$charTypes[$char['Char_Type']]);
		$ret['Base_Cost'] = $chi['Chi'];
		$ret['Min_Cost'] =$chi['Chi'];

	    }
	    if (isset($char['PCType'])){
		$PCType="[t13ne type=\"select\" select=\"pctype\" selected=\"{$char['PCType']}\" /]";
	    }
	    if (isset($char['Alt_Type'])){
			$alttype="[t13ne type=\"select\" select=\"alttype\" selected=\"{$char['Alt_Type']}\" /]";
		}else{
			$alttype='<!-- Alt Type unspecified, probably a container //-->';
		}
		if (isset($char['Alt_Similarity'])){
		$similarity="[t13ne type=\"select\" select=\"similaritytypes\" selected=\"{$char['Alt_Similarity']}\" /]";
	    }else{
		$similarity='<!-- alt similarity //-->';
	    }
	    if(isset($char['Alt_Integration'])){
		$integration="[t13ne type=\"select\" select=\"integrationtypes\" selected=\"{$char['Alt_Integration']}\" /]";
	    }else{
		$intergration='<!-- alt integration //-->';
	    }
	    if (isset($char['Incarna'])){
		$incarna="[t13ne type=\"select\" select=\"incarna\" selected=\"{$char['Incarna']}\" /]";
	    }else{
		$incarna='<!-- Incarna not defined... Full or Detailed Container probably //-->';
	    }
	//'Alt'=>array('Alternate'=>'0', 'Alt_Type'=>0,'Alt_Name'=>'Jo','Statblock'=>'3:13:15=45', 'Annexes'=>array(
	if (isset($char['Statblock'])){
			$stats=T13Statblock::getStats($data['post_id'],$char['Statblock'],true);
			$char['Scale']=$stats['Scale'];
			//$statText=T13Statblock::writeStatblock($stats);
			$statSC=T13Statblock::writeStatblockSC($data['post_id']);
		}else{
			if (isset($data['Terms']['Parent'])){
				$stats=T13Statblock::getStats($data['Terms']['Parent_id'],0, true);
				//$statText=T13Statblock::writeStatblock($stats);
				$statSC=T13Statblock::writeStatblockSC($data['Terms']['Parent_id']);
			}
		}

		$facets=array();
		if (isset($char['Alts'])){
			$alts=$char['Alts'];
			if (isset($char['Facet'])){
				if ($char['Facet']=="%%"||$data['Terms']['Facet']=='%%'){
					$hfs=self::getHighestFacets($alts,3);
					$facets=array_keys($hfs);
				}
			}
			$charText['Alts'].='<h2>Alternates</h2><ul class="t13ne-character-alts">';
			$terms=$data['Terms'];
			$terms['Parent']=$name;
			if (isset($data['post_id'])){
			$terms['Parent_id']=$data['post_id'];
		    }
		$calts=count($alts);
		if ($calts>4){
			$typ='<!--Too many Alts to be Lite or Detailed -->[t13ne type="select" select="chartype" selected="7" /]';
		}
		foreach($alts as $alt){
			$charText['Alts'].='<!-- debug '.htmlentities(json_encode($alt)).'//-->';
			if (!isset($alt['Scale'])){if(isset($char['Scale'])){$alt['Scale']=$char['Scale'];}}
			if (isset($alt['id'])){
				if (!is_array($alt['id'])){
					$alt['id']=T13Elements::getT13Element('Alt',$alt['id']);
					$alt['Name']=$alt['id']['Element']->post_title;
					$terms=$alt['id']['Terms'];
					$alt['Description']=$alt['id']['Element']->post_content;
				}

			}
			if (!isset($alt['Description'])&&isset($description) ){$alt['Description']=$description;}
			if (is_array($facets)){
				$terms['Facet']=$facets+array($alt['Incarna']);

			}
			if (is_string($name) && ($alt['Alt_Name']||$alt['Name'])){
				if (isset($alt['Alt_Name'])){
					$alt_name=$alt['Alt_Name'];
				}elseif(isset($alt['Name'])){
					$alt_name=$alt['Name'];
				}
					$nom=T13Types::$altTypes[$alt['Alt_Type']]['Name_Rule'];
					$nom=str_replace('%parent_name%', $name, $nom);
					$nom=str_replace('%name%', $alt_name, $nom);
					$alt_name=$nom;
				}
				if (!isset($alt['Char_Type'])&&isset($char['Char_Type'])){$alt['Char_Type']=$char['Char_Type'];}else{$alt['Char_Type']=0;}
			$alt_stuff=self::altContent($alt_name,$alt, $terms, $publish);
			$alt_tx=htmlentities(json_encode($alt_stuff));
			if (is_numeric($alt_stuff['post_id'])){
				$alt['id']=$alt_stuff;
			}else{
				die("Error: Critical error while trying to add Alt Char {$alt['Alt_Name']}");
			}
			$charText['Alts'].="<li data-alt=\"{$alt_tx}\">[t13ne type=\"alt\" char=\"{$alt['id']['post_id']}\" /]</li>";
		}
			$charText['Alts'].='</ul>';
		 }

	if (isset($char['Descendants'])&&isset($char['Statblock'])){
		if (is_array($char['Descendants'])&&$char['Descendants']){
			$desc=self::buildDescendants($char['Descendants'], $data, $char['Statblock'], $publish, $name);
			$charText['Descendants']=$desc['Content'];
			$ret['Base_Cost']+=$desc['Base_Cost'];
		}else{$charText['Descendants']=json_encode($char);}
	}

	if (isset($char['Annexes'])&&isset($char['Statblock'])){
			$anne=self::buildCharAnnexes($char['Annexes'], $char['Statblock'], $publish, $data, $name);
			$charText['Annexes']=$anne['Content'];
			$ret['Base_Cost']=$anne['Base_Cost'];
	}
	if (isset($char['Lite'])){
		if (!isset($char['Lite']['Scale'])){if (isset($char['Scale'])){$char['Lite']['Scale']=$char['Scale'];}}
		$lite=self::liteContent($name,$char['Lite'],$data,$publish);
		$charText['Lite']=$lite['Content'];
	}
		if (isset($anne)&&isset($char['PCType'])&&isset($stats)){
			//needs to calculate the Master Annex and derive the Yin and Yang from the Facets.... FOr the Max values...
			//values can be set in the shortcode.
			$chiText="<!-- Chi Text -->";
			if (isset($stats['Yin'])){
				$maxYin=$stats['Yin'];
				$maxYang=$stats['Yang'];
				$maxTwists=0;
				if (isset($anne['Sway'])){
					if (isset($anne['Sway'][0]['Value'])){
						$hitches= isset($anne['Sway'][0]['Hitches']) ? $anne['Sway'][0]['Hitches']:0;
						$woes=isset($anne['Sway'][0]['Woes']) ? $anne['Sway'][0]['Woes']:0;
						if($woes){
							$maxTwists=$hitches;
						}
						switch($char['PCType']){
							case 0; //extra
							$maxChi=$anne['Sway'][0]['Boon'];
							$maxYarn=$anne['Sway'][0]['Red'];
							break;
							case 2; //goblin
							case 1; //grunt
							$maxChi=$anne['Sway'][0]['Boon'];
							$maxYarn=$anne['Sway'][0]['Red'];
							break;
							case 4: //demon
							case 3://hero
							$maxChi=$anne['Sway'][0]['Value'];
							$maxYarn=$anne['Sway'][0]['Boon'];
							break;
							case 6: //demonlord
							case 5://yarn-teller
							case 7: //bulmas
							case 8: //kaiju
							$maxChi=T13Boons::getBoonValue($anne['Sway'][0]['Value']);
							$maxYarn=$anne['Sway'][0]['Value'];
							break;
							default:
							//should never appear
							break;
						}

				}else{
					$chiText.=json_encode($anne['Sway']);
				}
			}else{
				$chiText.=json_encode($anne['Sway']);
			}
		}else{
			$chiText.=json_encode($anne['Sway']);
		}
			$chiText.="<div class=\"t13ne-sway-box\"><p class=\"t13ne-chi\"><strong>Max Chi: </strong>{$maxChi}</p>";
		if ($char['PCType']>4){$chiText.="<p class=\"t13ne-yarn\"><strong>Max Yarn: </strong>{$maxYarn}</p>";}
		if ($maxTwists){$chiText.="<p class=\"t13ne-twists\"><strong>Max Twists: </strong>{$maxTwists}</p>";
		if($char['PCType']%1){$chiText.='<small class="t13ne-disclaimer">This Character Type should not have access to Twists. It appears they have at least one Woe and require editing.</small>';}
		}
		$chiText.="<p class=\"t13ne-yin\"><strong>Max Yin: </strong>{$maxYin}</p><p class=\"t13ne-yang\"><strong>Max Yang: </strong>{$maxYang}</p></div>";
	}else{
		$chiText="<!-- Chi Text Not Found-->";
	}
	$charContent=implode('<!--glue::-->', array_values($charText));
	//	$descendText=self::buildDescendants($alt['Descendants'], $nuaid, $alt['Statblock'], $publish, $alt['Alt_Name'], $terms, $parent);
		// 	$annexText=self::buildCharAnnexes($alt['Annexes'],$nuaid, $alt['Statblock'], $publish, $alt['Alt_Name']);
	$ret['Content'] = $geo['GeoText'].$typ.$charText['Alts'].$char['PCType'].$description.$statSC.$incarna.$similarity.$integration.$chiText.$charContent;
		//$ret['Content'] = $geo['GeoText'].$typ. $altType.T13Sanitize::sanitize($data['Description']).$charText;
	return $ret;
	}
   /**/
    static public function buildCharAnnexes($annexes, $statSC, $publish, $data, $name=""){
	//$alt['Annexes'],$nuaid, $alt['Statblock'], $publish, $alt['Alt_Name'], $terms)
	$annexText='<ul class="t13ne-annex-list" data-annexes="true">';
	$sway=array();
	$baseCost=0;
	if ($name==""){
		$parent_post=get_post($data['post_id']);
		$name=$parent_post->post_title;
	}
	$pactargs='';
	if (isset($annexes['Annexes'])){$annexes=$annexes['Annexes'];}
	if (isset($annexes['Name'])){$annexes=array($annexes);}
	foreach($annexes as $annex){
		$pactargs='';
		//$annexText.='<!-- Annex -->';
			if ($annex==$annexes[0]){$masterAnnex=true;}else{$masterAnnex=false;}
			$atyp=T13Types::$annexTypes[$annex['Annex_Type']];
			if (!isset($annex['Statblock'])){$annex['Statblock'] = $statSC;}
			//return array('ID'=>$post_id,'Cost'=>$baseCost, 'Orig_ID'=>$nuid, 'Prof'=>$prof_id);
			if ($annex['Name']=='Pact'||$annex['Annex_Type']==5){
				//Yarn-Tellers and Demons can be built as a Pact! Somewhat...
				$annex['Name']="{$name}'s {$annex['Name']} Pact";
				if (!isset($annex['Description'])){$annex['Description']="<p class=\"t13ne-description\">In T13 Pacts are the term we use to represent any group that the Character is a member of. Of course, some Characters, like Abehini Pilots, Gestalt Mercari or Lord Vermis can be a swarm of beings with a single Hive mind. This is more likely a Social group that {$name} has joined.";}
				$pactargs='annex="pact" boon="'.$annex['ABoon'].'" pactargs="'.json_encode(array('Pact'=>'%nuid','num_members'=>$annex['Members'],'max_character'=>$annex['MaxChar'])).'"';
				//$annex['Cost']=16+$annex['Members']['Yarn']+$annex['MaxChar']['Yarn'];
			}elseif ($annex['Name']=="Size"||($annex['Annex_Type']==6)||isset($annex['Size'])){
				$annex['Name']="{$name}'s Size Annex";
				if (!isset($annex['Description'])){$annex['Description']="<p class=\"t13ne-description\">The Size Annex is the Master Annex of a Location. It defines the size of the Location, from a small cupboard (at normal Scales) to the whole Omniverse. Characters that have a Size Annex are either sentient Locations/Vehicles, or Kaiju - huge Monsters... like whales, or larger creatures like hyper-space hydras, radioactive dinosaurs, and leviathan lepidoptra.</p>";}
				//locations have a Size array -it doesn't get logged the same way as other Annexes
				$pactargs="annex=\"size\" boon=\"{$annex['ABoon']}\"";
				//$annex['Cost']=12+$annex['ABoon'];
			}elseif ($annex['Name']=='Personality'||$annex['Annex_Type']==7||isset($annex['Persona'])){
				$annex['Name']=$name."'s Personality Annex";
				if (!isset($annex['Description'])){
					$annex['Description']="<p>This is {$name}'s Personality Annex.</p><p>It combines together at least one Persona (which tells us about the face the Character shows the world), at least one Core (which tell us about who a Character really is), and Hitches (which tell us all the things that people have problems with). </p>";
				}
				//$tmp=array(array('Persona'=>$annex['Persona'],'Core'=>$annex['Core'], 'Hitches'=>$annex['Hitches']))+$annex['Profs'];
				//$annex['Profs']=$tmp;
			}
			$aterms=$data['Terms'];
			$aterms['Parent']=$name;
			$aterms['Parent_id']=$data['post_id'];

			$annex['Description'].="<small class=\"t13ne-disclaimer\">Annex added automatically as part of adding <a href=\"{$data['URL']}\" data-post-id=\"{$data['post_id']}\">Character: {$name}</a>. <br/></small>";
			$anne=T13Elements::addT13Element('Annex', $annex['Name'], $annex, $aterms, $publish );
			$baseCost+=$anne['BaseCost'];
			$hitches=isset($anne['Hitches']) ? $anne['Hitches'] : 0;
			$reducedHitches=isset($anne['RedHitches']) ? $anne['RedHitches'] : 0;
			$woes=isset($anne['Woes']) ? $anne['Woes'] :0;
			if ($pactargs==''){
				//$name,$coreA['Type'],$coreA['Profs'], $coreA['Description'], $coreA['Boon'], $coreA['Statblock'], $f_id, $g_id, $e_id, $s_id, true, 0,0
				$pactargs=' annex="'.$anne['post_id'].'"  boon="'.$annex['ABoon'].'" ';
			}
			$annexText.='<li class="t13ne-annex" name="'.$annex['Name'].'" >[t13ne type="annex" '.$pactargs.' /]</li>';
			//adjust cost for subannexes
			$sway[]=array('Value'=>$anne['Value'],'Boon'=>$anne['Boon'], 'Red'=>T13Boons::getBoonReduced($anne['Boon']),'Hitches'=>$hitches, 'RedHitches'=>$reducedHitches, 'Woes'=>$woes);
		}
		$annexText.="</ul>";
		return array ('Content'=>$annexText,'Base_Cost'=>$baseCost, 'Sway'=>$sway);
    }
    static public function buildDescendants($descendants=0, $data='', $stats='', $publish=0, $parentname='' ){
	//($alt['Descendants'], $nuaid, $alt['Statblock'], $publish, $alt['Alt_Name'], $terms, $creator
	$rethtml='<!-- T13NE Char Descendants //-->';
	//$rethtml.='<!--'.json_encode($descendants).'//-->';
	$baseCost=0;
	if (is_array($descendants)){
		if ($parentname==""){
			$parent_post=get_post($data['post_id']);
			$parentname=$parent_post->title;
		}
		$rethtml.='<section class="t13ne-descendants"><h4>Descendants</h4><ul class="t13ne-descendants">';
		foreach($descendants as $d){
			//if set locally in the array then pass them on...
			if (isset($d['Genre'])){$terms['Genre']=$d['Genre'];}
			if (isset($d['Era'])){$terms['Era']=$d['Era'];}
			if (isset($d['Scope'])){$terms['Scopes']=$d['Scope'];}
			if (isset($d['Creator'])){$terms['Creator']=$d['Creator'];}
			if (isset($d['Facet'])){$terms['Facet']=$d['Facet'];}
			$terms['Owner']=$parentname;
			$d['Statblock']=$stats;
			$terms['Parent']=$parentname;
			$terms['Parent_id']=$data['post_id'];
			if (!isset($terms['Creator'])){$terms['Creator']=$parentname;}
			$d['id']=T13Elements::addT13Element('Descendant', $d['Name'], $d, $terms, $publish);
			$baseCost+=$d['id']['BaseCost'];
			//$d['id']=T13Descendants::addDescendant($d['Name'],$d['Incarna'],$d['LocationType'], $d['DescType'],$d['Description'],$d['Annexes'],$d['Hitches'],$d['Incarna'],$genres,$eras, $scopes, $publish, $parid,$creator, $parid);
			//$rethtml.="<li>[t13ne type=\"descendant\" desc=\"{$d['id']['post_id']}\"]</li>";
			$rethtml.="<li><a href=\"{$d['id']['URL']}\">Descendant: {$d['Name']}</a></li>";
		}
		$rethtml.='</ul></section>';
	}
	return array('Content'=>$rethtml,'Base_Cost'=>$baseCost);
    }
    static public function addAlt($type, $parent_name, $description, $alt,$terms, $publish=false,$parent=''){
	$prepare=self::prepChar($alt['Alt_Name'], $type, $alt['Alt_Type'], $parent_name, $terms['Facets'],$terms['Ggenres'],$terms['Eras'], $terms['Scope'], $terms['Parent']);
	$post_id=$prepare['post_id'];
	//var_dump($prepare);
	if (is_numeric($post_id)){$nuaid=$post_id;
	}elseif(is_array($post_id)){$nuaid=$post_id['ID'];
	}elseif(is_object($post_id)){$nuaid=$post_id->ID;}
	if (!$nuaid){die("Error: Critical error while trying to add Alt Char {$alt['Alt_Name']}");}
	$geo=$prepare['geo'];
	$type=$prepare['type'];
	$altType=$prepare['atype'];
	$similarity="[t13ne type=\"select\" select=\"similaritytypes\" selected=\"{$alt['Alt_Similarity']}\" /]";
	$integration="[t13ne type=\"select\" select=\"integrationtypes\" selected=\"{$alt['Alt_Integration']}\" /]";
	$incarna="[t13ne type=\"select\" select=\"incarna\" selected=\"{$terms['Facet']}\" /]";
	//'Alt'=>array('Alternate'=>'0', 'Alt_Type'=>0,'Alt_Name'=>'Jo','Statblock'=>'3:13:15=45', 'Annexes'=>array(
	if ($alt['Statblock']){
			$stats=T13Statblock::getStats($nuaid,$alt['Statblock']);
			//$statText=T13Statblock::writeStatblock($stats);
			$statSC=T13Statblock::writeStatblockSC($nuaid);
		}else{
			if ($parent){
				$stats=T13Statblock::getStats($nuaid);
				//$statText=T13Statblock::writeStatblock($stats);
				$statSC=T13Statblock::writeStatblockSC($nuaid);
			}
		}
		$creator = T13_Types::getUserID();
		$descendText=self::buildDescendants($alt['Descendants'],  $alt['Statblock'], $publish, $alt['Alt_Name'], $terms, $creator);
		$annextext=self::buildCharAnnexes($alt['Annexes'], $alt['Statblock'], $publish, $alt['Alt_Name'], $terms);
	$content = $geo['GeoText'].$type.$altType.T13Sanitize::sanitize($description).$statSC.$incarna.$similarity.$integration.$annextext.$descendText;
	$post_id=self::updateChar($nuaid, $content, $publish);
	return $post_id;
    }
    static public function getHighestFacets($alts,$numbertoget=4, $inc=false){
	$f=array();
	$best=array();
	$incarnas=array();
	foreach($alts as $a){
		$a['Stats']=T13Statblock::getStats(1,$a['Statblock']);
		$best=T13Statblock::bestStats($a['Stats'],$best);
		if (isset($a['Incarna'])&&$inc){
			$incarnas[]=$a['Incarna'];
		}
	}
	$ordered = T13Statblock::orderStats($best);
	if (is_array($ordered)){
		$ordered=array_slice($ordered, $numbertoget);
	    }
	if ($inc){$ordered=array_flip($incarnas)+$ordered;}
	return $ordered;
    }

    static public function installChars(){
	if ( ! function_exists( 'post_exists' ) ) {
		//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}

		$c=count(self::$coreChars);
		$installed=array('char'=>0, 'of'=>$c, 'install'=>0);
	foreach(self::$coreChars as $core){
			if (isset($core['Specify'])&&isset($core['Name'])){
				if ($core['Specify']){
				$name= $core['Name'].' (Specify)';
				}else{$name=$core['Name'];}
			}else{
				$name=$core['Name'];
			}
			$name=T13Sanitize::sanitize($name);
			if ($name==''){$name='Error Unnamed Descendant';}
			$installed['exist']=post_exists($name);
		if ($installed['exist']){
			$installed['desc']=$name;
			$installed['debug']=' '.$installed['exist'].' post exists already \n\r';
			$installed['install']++;
		}else{
			$installed['desc']=$name;
			$installed['debug']=json_encode(self::installChar($installed['install'])).'
			';
			$installed['install']++;
			return $installed;
		}
	}
	return $installed;
    }
	static public function installChar($install){
		if (count(self::$coreChars)>$install){
			$coreC=self::$coreChars[$install];
			$name=$coreC['Name'];
			$era= term_exists($coreC['Era'], 't13era');
			$genre= term_exists($coreC['Genre'],'t13genre');
			$scope = term_exists($coreC['Scope'], 't13scope');
			$terms['Scope'] = intval($scope['term_id']);
			$terms['Genre'] = intval($genre['term_id']);
			$terms['Era'] =intval($era['term_id']);
			return T13Elements::addT13Element('Character', $name, $coreC, $terms, true );

		}
	}
	  /*
 static public function addChar($name, $type, $description, $alts, $terms, $publish=false,$parent){
		if ($facets=="%%"){
			$hfs=self::getHighestFacets($alts,3);
			$facets=array_keys($hfs);
		}
	$prepare=self::prepChar($name, $type, null, $terms, $parent);
	$post_id=$prepare['post_id'];
	if (is_numeric($post_id)){$nucharid=$post_id;
	}elseif(is_array($post_id)){$nucharid=$post_id['ID'];
	}elseif(is_object($post_id)){$nucharid=$post_id->ID;}
	if (!$nucharid){die("Error: Critical error while trying to add Alt Char {$alt['Alt_Name']}");}
	$geo=$prepare['geo'];
	$type=$prepare['type'];
	if (is_array($facets)){
		$facet=$facets[0];
	}
	$charText='<h2>Alternates</h2><ul class="t13ne-character-alts">';
	foreach($alts as $alt){
		if (!$alt['Description']){$alt['Description']==$description;}
		$alt_stuff=self::addAlt($type,$name,$alt['Description'], $alt, $alt['Incarna'], $genres, $eras, $scope, $publish, $nucharid);
		$alt_tx=json_encode($alt_stuff);
		if (is_numeric($alt_stuff)){
			$alt['id']=$alt_stuff;
		}elseif(isset($altstuff['ID'])){
		$alt['id']=$alt_stuff['ID'];
	}
		$charText.="<li data-alt=\"{$alt_tx}\">[t13ne type=\"alt\" char=\"{$alt['id']}\" /]</li>";
	}
		$charText.='</ul>';
		$content = $geo['GeoText'].$type. $altType.T13Sanitize::sanitize($description).$charText;
	$post_id=self::updateChar($nucharid, $content, $publish);
		return $post_id;
    }

	  static public function buildHitches($hitches, $nuid, $statSC){
	//array("Hitch"=>0, "Facet"=>"Awe", "Name"=>"Nervous", "Description"=>"Some people are just naturally nervous, they jump and start at the slightest thing and may find it hard to concentrate.", "HBoon"=>11, "HType"=>6, "Resolved"=>0),
	$hitchtext='';
	$stats=T13Statblock::getStats($nuid,$statSC);
	foreach ($hitches as &$hitch){
		if ($hitch['Hitch']){
			//we have an id!
		}else{
			$hitch['Hitch']=T13hitches::addHitch( $hitch['Name'], $hitch['Description'].'<p class="t13ne-disclaimer">Hitch automatically added as part of adding  <a href="'.esc_url(get_permalink($post_id)).'">Descendant: '.$name.'</a></p>', $hitch['Type'], $hitch['Facet'], $g_id, $e_id, $s_id, $publish, $post_id,$creator, $nuid);
			if (is_array($hitch['Hitch'])){
				$hitch['Hitch']=json_encode($hitch['Hitch']);
			}
		}
		$stat=T13Statblock::getBoonForFacet($hitch['Facet'],$nuid);
		$hitch['Boon']=$stat['Scale']+$stat['Boon'];
		$hitch['Shortcode']="[t13ne type=\"hitch\" hitch=\"{$hitch['Hitch']}\" $boon=\"{hitch['Boon']}\" hboon=\"{$hitch['HBoon']}\" alt=\"{$nuid}\" resolved=\"{$hitch['Resolved']}\" /]";
		$hitchtext.="<li class=\"t13ne-hitch\" data-hitch=\"{$hitch['Hitch']}\" data-hboon=\"{$hitch['HBoon']}\" >{$hitch['Shortcode']}</li>";
	}
	return array('Hitches'=>$hitches, 'HitchText'=>$hitchtext);
    }
    static public function prepChar($name, $type, $altType, $parent_name=false, $terms, $parent=0){
		$typer='Character';
	$suffix='';
	if ( ! function_exists( 'post_exists' ) ) {
		//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		$name=T13Sanitize::sanitize($name);
		$post_parent=0;
		if ($parent&&!$parent_name){
			$parent_post=get_post($parent);
		$parent_name=$parent_post->title;
		$post_parent=$parent_post['ID'];
	}
		if ($parent&&!$post_parent){
			if (get_post_status($parent)){
				$post_parent=$parent;
			}
		}
		if (isset($parent_name)&&!$post_parent){
			$post_parent = post_exists($parent_name);
		}
		$terms['Parent']=$parent_name;
		$terms=T13Types::typeTerms('Character',$name,$terms);

		//things to do: get each alt and build a page for them, then link them with a shortcode in this character.
		//addAlt()

		if ($parent_name && $name){
			$nom=T13Types::$altTypes[$altType]['Name_Rule'];
			$nom=str_replace('%parent_name%', $parent_name, $nom);
			$nom=str_replace('%name%', $name, $nom);
			$name=$nom;
		}
		$description='Placeholder Content';
		$typ="[t13ne type=\"select\" select=\"chartype\" selected=\"{$type}\" /]";
		//$alttype="[t13ne type=\"select\" select=\"alttype\" selected=\"{$altType}\" /]";
		$content=$terms['Geo']['GeoText'].$typ.$description;
		$post_id=post_exists( $name );
		if ($post_id){
			$typeo=T13Types::checkTaxon($typer, 't13type', $post_id);
			if (strtolower($typeo)){
				$suffix=' '.$typer;
				$post_id=post_exists($name.$suffix);
			}
		}


		if (!$post_id){
			$post_id = wp_insert_post( array (
			    'post_type' => 'element',
			    'post_title' => $name.$suffix,
			    'post_content' => $content,
			    'post_parent' => $post_parent,
			    'post_status' => 'draft',
			    'comment_status' => 'closed',   // if you prefer
			    'ping_status' => 'closed'    // if you prefer
			),true);
			$term_taxonomy_ids=wp_set_object_terms($post_id, $terms['Taxon_id'],'t13type', true);
			$term_taxonomy_ids=wp_set_object_terms($post_id, $terms['Facet_id'],'t13facet', true);
			$term_taxonomy_ids = wp_set_object_terms($post_id, $terms['Genre_id'],'t13genre', true);
			$term_taxonomy_ids = wp_set_object_terms($post_id, $terms['Era_id'], 't13era', true);
			$term_taxonomy_ids = wp_set_object_terms($post_id, $terms['Scope_id'], 't13scope', true);
			$term_taxonomy_ids = wp_set_object_terms($post_id, $terms['Geo_id'], 't13geo', true);
		}
	return array('post_id'=>$post_id, 'Terms'=>$terms, 'atype'=>$alttype);
    }
    static public function updateChar($nuid, $content, $publish){
	if ($publish){
			$publish ='publish';
		}else{
			$publish ='draft';
		}
	$post_id = wp_update_post( array (
				'ID'=>$nuid,
				'post_type' => 'element',
				'post_content' => $content,
				'post_status' => $publish,
				'comment_status' => 'open',
				'ping_status'=>'open'),true );
		return $post_id;
    }*/
}

<?php

/**
 * Define the knots php functionality
 *
 * knots are an array of objects or object that holds arrays of objects... they come in types
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 */

/**
 * Define the Knots functionality.
 *
 * 
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */

	define('TIE_UNKNOTTED',0);
	define('TIE_THREAD',1);
	define('TIE_TEXT',2);
	define('TIE_T13',4);
	define('TIE_SECRET',8);
	define('TIE_ROOT',16);
	define('TIE_CHANNEL',32);
	define('TIE_VALUE',64);
	define('TIE_BOON',128);
	define('TIE_BANE',256);
	define('TIE_GNARL',512);
	define('TIE_TANGLE',1024);
	define('TIE_UMBRAL',2048);
	define('TIE_NIMBED',4096);
	define('TIE_TRIGGER',8192);	
	define('TIE_EDGE',16384);
	define('TIE_GLOW',32768);
	define('TIE_PERSONA',65536);
	define('TIE_CORE',1<<17);
	define('TIE_RESOLVED',1<<18);
	define('TIE_MONSTER',1<<19);
	define('TIE_SUCCESS',1<<20);
	define('TIE_FAILURE',1<<21);
	define('TIE_WOUND',1<<22);
	define('TIE_CARD',1<<23);
	define('TIE_LITE',1<<24);
	define('TIE_CONFLICT',1<<25);
	define('TIE_LINK',1<<26);
	define('TIE_EVENT',1<<27);
	define('TIE_RESERVED',1<<28);
class T13_Ne_Knots {
	// Knots combine T13 Elements with thresholds to create larger object chains and entities.
	// all larger elements contain knots and are usually knotted to other systems... but we begin with Annexes and Hitches.
	// This basically needs to handle both Annexes and Hitches through the use of the Knot (we may expand nots beyond this later but for now it has to handle bothe Annex and Hitch)
	// Annex form.
	//		An Annex is a list of Proficiencies (and a Statblock - although technically only Values or Boons from tied Profs are used...). Each Prof can be tied into the Annex by a specific knot.
	//		A Hitch is a list of Proficiencies with a single Boon that defines the Hitch. Each Prof can be tied into the Hitch by a Specific knot.

	// public static $knotTypes = array( 
		
		//array('Type'=>'Unkotted','Description'=>'Unknotted Threads are lumps of forgotten projects and should be fixed or repaired less they become D&aelig;mons.','KnotNumber'=>0,'Hidden'=>'Often','Add'=>0,'Cost'=>0,'Rule'=>'Unknotted Threads may be marked as Increated, creating Neechies.'),

		// array('Type'=>'Thread','Description'=>'Threads are Proficiencies (and diagetic Descriptive Texts that Annexes, Characters, Descendants, and Hitches require).','KnotNumber'=>1,'Hidden'=>0,'Add'=>'ID','Cost'=>1,'Rule'=>'Indicates a Thread that has been tied onto some other thread.'),
		// array('Type'=>'Diagetic_Text','Description'=>'Diagetic Text is a Thread that cannot act as a Proficiency, but only as a note, such as the description of a Character or Descendant, or the text of a letter or book "in-universe".','KnotNumber'=>2,'Hidden'=>0,'Add'=>'Text','Cost'=>0,'Rule'=>'Diagetic Text is "in-universe" text that may be read aloud by a Yarn-Teller, Referee or Player.'),
		// array('Type'=>'T13','Description'=>'Sometimes we tie none threads (such as knots and patterns) into other knots and patterns. Such as Hitches to Personality Annexes, Annexes into Descendants, or Characters into Pacts. This knot type does that.' ,'KnotNumber'=>4,'Hidden'=>0,'Add'=>['T13','ID'],'Cost'=>0,'Rule'=>'Adds a none-Proficiency to a Knot.'),
		// array('Type'=>'Secret','Description'=>'Secret knots are often used to keep some aspect of a Knot unknown to players for some reason. This is often Text intended to be read only by the Author, Referee, or current Yarn-Teller, it may be some plot point or spoiler for the narrative.','KnotNumber'=>8,'Hidden'=>'Secret','Add'=>['Secret','Statblock'],'Cost'=>0,'Rule'=>'Secret Text intended for only the Author, Referee, and perhaps the current Yarn-Teller (Author and Referee decide).'),
		// array('Type'=>'Root','Description'=>'A Root knot defines the Root of an Annex, or the Root of a Hitch (Hitch Type).','KnotNumber'=>16,'Hidden'=>0,'Add'=>'Facet','Cost'=>1,'Rule'=>'Indicates the Root Facet of an annex or hitch'),
		// array('Type'=>'Channel','Description'=>'A Channel Knot indicates the Facet that an Annex acts through (or the Hitch Type of a Hitch when combined with the Root).','KnotNumber'=>32,'Hidden'=>0,'Add'=>'Facet','Cost'=>0,'Rule'=>''),

		// array('Type'=>'Value','Description'=>'Indicates a Value is tied on. Typical for Skill, Talent and Power Annexes.','KnotNumber'=>64,'Hidden'=>0,'Add'=>'Value','Cost'=>0,'Rule'=>'Adds a Value or Statblock to an Annex (typically).'),

		// array('Type'=>'Boon','Description'=>'Indicates a Boon is tied on. Typically this is used on Super-Annexes.','KnotNumber'=>128,'Hidden'=>0,'Add'=>'Boon','Cost'=>0,'Rule'=>'Directly Adds a Boon to another Boon'),

		// array('Type'=>'Bane','Description'=>'Indicates a Bane is tied on. Typically a Bane is a negative Boon, tied onto a Hitch.','KnotNumber'=>256,'Hidden'=>0,'Add'=>'Bane','Cost'=>0,'Rule'=>'Adds a Bane to a Hitch (typically) or subtracts a Bane from a Boon.'),
		// array('Type'=>'Gnarl','Description'=>'A Gnarl is a knot used to tie a complication into a Hitch (usually).','KnotNumber'=>512,'Hidden'=>0,'Add'=>0,'Cost'=>'Gnarl','Rule'=>'Adds a Gnarl to a Hitch (or Annex)'),
		// array('Type'=>'Tangle','Description'=>'A Tangle is a knot used to a ties a complication into an Annex (usually). A Tangle interacts with Umbrals and Nimbeds in an Annex.','KnotNumber'=>1024,'Hidden'=>0,'Add'=>0,'Cost'=>'Umbral','Rule'=>'Adds a Tangle to an Annex (or Hitch).'),
		// array('Type'=>'Umbral','Description'=>'Ties a Proficiency as an Umbral usually into an Annex.','KnotNumber'=>2048,'Hidden'=>0,'Add'=>0,'Cost'=>'Umbral','Rule'=>'Adds an Umbral Cost to an Annex (or Hitch).'),
		// array('Type'=>'Nimbed','Description'=>'Ties a Proficiency as a Nimbed, usually into an Annex.','KnotNumber'=>4096,'Hidden'=>0,'Add'=>'Nimbed','Cost'=>0,'Rule'=>'Adds a Nimbed effect to a Character’s Actions with an Annex, or Actions against a Character with a Hitch.'),
		// array('Type'=>'Trigger','Description'=>'Trigger Proficiencies can be tied into Hitches (and some Annexes) and determine how and when they are activated.','KnotNumber'=>8192,'Hidden'=>'Potentially','Add'=>'Trigger','Cost'=>0,'Rule'=>'Adds a Trigger condition or situation to a Hitch or Annex.'),
		// array('Type'=>'Edge','Description'=>'Adds a Facet Edge to an Annex, typically this is combined with a 2nd Nimbed of the same Facet, or a (Resolved) Hitch.','KnotNumber'=>16384,'Hidden'=>0,'Add'=>'Edge','Cost'=>0,'Rule'=>'Adds a Facet Edge to an Annex'),
		// array('Type'=>'Glow','Description'=>'Adds a Facet Glow to an Annex (typically this is combined with a third Nimbed of the same Facet.','KnotNumber'=>32768,'Hidden'=>0,'Add'=>'Glow','Cost'=>0,'Rule'=>'Adds a Facet Glow to an Annex'),
		// array('Type'=>'Persona','Description'=>'Adds a Persona to an Annex (usually a Personality Annex).','KnotNumber'=>65536,'Hidden'=>0,'Add'=>'Persona','Cost'=>'Persona','Rule'=>'Adds a Persona to a Personality Annex'),
		// array('Type'=>'Core','Description'=>'Adds a Core to an Annex (usually a Core Annex).','KnotNumber'=>131072,'Hidden'=>0,'Add'=>'Core','Cost'=>'Core','Rule'=>'Adds a Core to a Personality'),
		// array('Type'=>'Resolved_Hitch','Description'=>'Adds a Resolved Hitch to an Annex, typically this will act as a Core, Persona, Edge or Monster Facet as required.','KnotNumber'=>262144,'Hidden'=>0,'Add'=>'Resolved','Cost'=>0,'Rule'=>'Adds a Resolved Hitch to a Personality Annex or Descendant.'),
		// array('Type'=>'Monster_Facet','Description'=>'Adds a Monster Facet to an Annex (typically a Personality Annex, although not always).','KnotNumber'=>524288,'Hidden'=>'Possibly','Add'=>'Monster','Cost'=>'Monster','Rule'=>'Adds a Monster Facet'),
		// array('Type'=>'Success_Levels','Description'=>'Adds Success Levels to a Hitch or Annex typically as part of a Gnarl, Tangle, Umbral, Nimbed, etc.','KnotNumber'=>1048576,'Hidden'=>1,'Add'=>'Successes','Cost'=>0,'Rule'=>'Adds a number of Successes.'),
		// array('Type'=>'Failure_Levels','Description'=>'Adds Failure Levels to a Hitch or Annex typically as part of a Gnarl, Tangle, Umbral, Nimbed, etc.','KnotNumber'=>2097152,'Hidden'=>1,'Add'=>'Failures','Cost'=>'Failures','Rule'=>'Adds a number of Failures.'),
		// array('Type'=>'Wound','Description'=>'Ties a Wound to an Annex (often this restricts what the Annex can do, or is created by a Hitch).','KnotNumber'=>4194304,'Hidden'=>0,'Add'=>'Wound','Cost'=>0,'Rule'=>'Ties a Wound to the Annex or Hitch'),
		// array('Type'=>'Card','Description'=>'Ties a card to an Annex or Hitch (may be a Wound, may be a Significator).','KnotNumber'=>1<<23,'Hidden'=>0,'Add'=>'Card','Cost'=>0,'Rule'=>'Adds a Card to the Annex or Hitch.'),
		// array('Type'=>'Lite','Description'=>'Lite Knots indicate Lite Characters, Descendants, Annexes, or Proficiencies.','KnotNumber'=>1<<24,'Hidden'=>0,'Add'=>'Lite','Cost'=>'Lite','Rule'=>'Indicates a Lite Element. Lite Annexes use multiple Lite Proficiencies'),
		// array('Type'=>'Conflict','Description'=>'Conflict knot indicates a Thread, Character or other Element that is also acting as a Conflict Embodiment.','KnotNumber'=>1<<25,'Hidden'=>'Always','Add'=>'Conflict','Cost'=>'Conflict','Rule'=>'Indicates the presence of a Conflict Embodiment which may become Monstrous and change Boon or Bane.'),
		// array('Type'=>'Link','Description'=>'A Link knot adds a connection to some external resource, such as a web-page, image, video or audio file.','KnotNumber'=>1<<26,'Hidden'=>'Style','Add'=>['URI','Link'],'Cost'=>0,'Rule'=>'Adds an External URI such as external images, videos, etc or a link to an external web page such as wikipedia or campfire.'),
		// array('Type'=>'Reserved','Description'=>'','KnotNumber'=>1<<27,'Hidden'=>0,'Add'=>0,'Cost'=>0,'Rule'=>'Reserved'),
	//);
	
	public static $prototypeHitch =array(
		array('ID'=>123, 'Bane'=>13, 'Facet'=>'facet', 'Knot'=>TIE_THREAD+TIE_ROOT+TIE_CHANNEL+TIE_BANE), // 1+16+32+256 the root + channel of a hitch defines the Facet of the Hitch the bane of a hitch (13) -- this could  add a Statblock ID that would lend its Hitch Facet Boon and make it Secret as well instead.  
		array('ID'=>124,'Knot'=>TIE_THREAD+TIE_GNARL,'Gnarl'=>'facet'), //1+512 the  first gnarl of the hitch, it can have up to 3
		array('ID'=>125,'Knot'=>TIE_THREAD+TIE_TRIGGER), //1+8192 the first trigger of the hitch. it can have more... This will use the Thread to define the Trigger.
	);

	public static $prototypeAnnex = array(
		array('ID'=>123,'Knot'=>TIE_THREAD+TIE_ROOT), // thread 1, root 16, (Value or Boon could be specified)
		array('Statblock'=>123,'Knot'=>TIE_SECRET+TIE_VALUE), //secret value Statblock loading (provides all Values for Facet Values),
		array('ID'=>124,'Knot'=>TIE_THREAD+TIE_CHANNEL+TIE_TANGLE), //thread Channel and Tangle
		array('ID'=>125,'Knot'=>TIE_THREAD+TIE_UMBRAL), //thread,Umbral
		array('ID'=>126,'Knot'=>TIE_THREAD+TIE_NIMBED), //thread, nimbed
	);

	public static $prototypeknot = array( //basic and scrubby
		'Names'=>['Short Skill Name','Full Skill Name','Also Known As Skill'],
		'ID'=>0,
		'Statblock'=>0, //set below
		'Value'=>184, // set from statblock (101+83)
		'Boon'=>0,
		'Bane'=>0,
		'Knots'=>array(
			array('ID'=>0, 'Names'=>['Root Prof','Full Root Prof','AKA Root Prof'],'Description'=>'Description of the Root Prof','Facet'=>'Awe','Knot'=>TIE_THREAD+TIE_ROOT),
			array('ID'=>0,'Names'=>['Channel Prof','Another Full Channel Prof Name','AKA another Channel Prof'],'Description'=>'Description of the Channel Prof','Facet'=>'Burden','Knot'=>TIE_THREAD+TIE_CHANNEL),
			array('Statblock'=>'shortcode','Knot'=>TIE_SECRET+TIE_VALUE),// statblock requires extraction of Awe and Burden Values.
		),

	);



	/*static public $knottypes = array(
		array('Type'=>'Chain', 'Description'=>'A list of post ids that should be loaded'),
		array('Type'=>'Profs', 'Description'=>'A list of proficiencies with boons and values'),
		array('Type'=>'Profs2', 'Description'=>'A list of proficiencies with a statblock'),
		array('Type'=>'Annexes', 'Description'=>'A list of Annexes'),
		array('Type'=>'Members', 'Description'=>'A list of Characters'),
		array('Type'=>'Facets', 'Description'=>'A list of Personas, Cores, Hitches'),
		array('Type'=>'Entities', 'Description'=>'A list of a statblock, incarna, and annexes (including Size, Members, Personality etc)'),
		array('Type'=>'Cards', 'Description'=>'A list of cards and position meanings'),
		array('Type'=>'Chronology', 'Description'=>'A list of events (may be branching)'),
		array('Type'=>'Patterns', 'Description'=>'A list of Descendants, Characters, etc'),
		array('Type'=>'Thresholds', 'Description'=>'A list of liminal connections (or links) used to build maps and such in knotchains.'),
		array('Type'=>'KnotChain', 'Description'=>'A list of threads, knots, patterns, or weavers'),
	);
// profs look like ['&1', 'id','name','Description','Facet','ProfInAnnex ()','UmbralBoon (not scaled)','Value of Nimbed Boon (+scale)']

	public static function tie($array, $knotType){
		$ret=array('&'.$knotType);
		switch ($knotType){
			case 0:
				foreach($array[0] as $key=>$value){
					$obj=T13Types::getT13Element('All', $value,1);
					array_push($ret, array($value=>array('Name'=>$obj['Element']->post_title, 'Description'=>$obj['Element']->post_content, 'Facet'=>$obj['Facet'])));
				}
			break;
			case 1:
				foreach ($array[0] as $i=>$prof){
					if (isset($prof['Name'])){
						array_push($ret, array($prof['id'], $prof['Name'], $prof['Description'], $prof['Facet'], $prof['ProfInAnnex'], $prof['Boon'], $prof['Value']));
					}
					if (isset($prof['Prof'])){
						array_push($ret, array($prof['id'], $prof['Prof'], $prof['Prof_Description'], $prof['Facet'], $prof['ProfInAnnex'], $prof['Boon'], $prof['Value']));
					}
					if (is_numeric($prof)){
						//dangit an id
						$post=T13Types::getT13Element('Thisun', $prof,1);
						$scaleboon = T13Statblock::getBoonForFacet($post['Facet'], $prof['id'], $post['statblock']);
						array_push($ret, array($post['post_id'], $post['Element']->post_title, $post['Element']->post_content, $post['Facet'], $i, $scaleboon['Boon'], T13Boons::getBoonValue($scaleboon['Scale']+$scaleboon['Boon'])));
					}
					
				}
			break;
			case 2:
				$statblock = T13Statblock::getThisStatblock($array[0]);	
				foreach($array[1] as $i=>$prof){
					$scaleboon = T13Statblock::getBoonForFacet($prof['Facet'], $prof['id'], $statblock);
					array_push($ret, array($prof['id'], $prof['Name'], $prof['Description'], $prof['Facet'],$scaleboon['Boon'],T13Boons::getBoonValue($scaleboon['Scale']+$scaleboon['Boon'])));
				}
			break;
			case 3:
				foreach($array[0] as $i=>$annex){
					if (is_numeric($annex)){
						$annex = T13Types::getT13Element('All', $annex,1);
					}
					if (!isset$annex['statblock']&&isset($annex['StatblockID'])){
						$annex['statblock'] = T13Statblock::getThisStatblock($annex['StatblockID']);	
					}else{
						if (isset($annex['id'])){
							$annex['statblock'] = T13Statblock::getThisStatblock($annex['id']);
						}
						
					}

					
				}
			break;
		}
		return $ret;
	}
	public static function tieknot($knot){
		//going to assume its mostly right, this might be dangerous, but I want this to be fast
		switch ($knot['KnotType']){
			case "Chain":
			case 0:
				return self::tie(array($knot['Chain']),0);
			break;
			case "Profs":
			case 1:
				return self::tie(array($knot['ProfsList']),1);
			break;
			case "Profs2":
			case 2:
				return self::tie(array($knot['Statblock'],$knot['ProfsList'],2);
			break;
			case "Annexes":
			case 3:
				return self::tie(array($knot['AnnexList']),3);
			break;
			case "Members":
			case 4:
				return self::tie(array($knot['MembersList']),4);
			break;
			case "Facets":
			case 5:
				return self::tie(array($knot['FacetsList']),5);
			break;
			case "Entities":
			case 6:
				return self::tie(array($knot['Statblock'], $knot['Incarna'],$knot['AnnexList']),6);
			break;
			case "Cards":
			case 7:
				return self::tie(array($knot['Cards'], $knot['Positions']),7);
			break;
			case "Chronology":
			case 8:
				return self::tie(array($knot['Events']),8);
			break;
			case "Patterns":
			case 9:
				return self::tie(array($knot['PatternList']),9);
			break;
			case "Thresholds":
			case 10:
				return self::tie(array($knot['KnotChain'], $knot['LinkList']),10);
			break;
			case "KnotChain":
			case 11:
				return self::tie(array($knot['KnotChain']),11);
			break;
			default:
				return self::tie($knot, $knot['KnotType'])
		}
	}
	public static function convertknot($knot){
		$ret=array();
		if (is_array($knot)){
			if (isset($knot['KnotType'])){
				$ret = self::tieknot($knot);
			}
			if (isset($knot[0])){
				$ret = self::untieknot($knot);
			}
		}
		return $ret;
	}
*/	
}
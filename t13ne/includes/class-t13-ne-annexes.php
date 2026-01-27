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
 * Fired during plugin activation. Annexes
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Annexes{
	//annexes are a list of stuff tied together by thresholds. This makes them a type of Knot, just like a Hitch.
	public static $installed=0;

	public static $coreAnnexes = array(
		array('Name'=>'Nerves of Steel', 'Annex_Type'=>3, 'Description'=>'Nerves of Steel Annex can be used as a Psychological Defence. A Character with Nerves of Steel can be expected to climb to high places, dangle themselves off edges, face impossible odds, and even force themselves to eat things that aren\'t even technically food. It should be noted that the Nerves of Steel are somewhat a performance. They can still occasionally be spooked, or surprised.', 'Statblock'=>'0:13,13:45=13','ABoon'=>'%%', 'Specify'=>false,
			'Profs'=>array(
				array('Facet'=>'Nature', 'Prof'=>'Nerves', 'Prof_Description'=>'Nerves carry signals through the flesh, from sensor organs to the brain, or from the brain to muscle tissues. They are part of the regulation and control systems built into flesh.', 'ProfInAnnex'=>2, 'Specify'=>0, 'Tangle'=>1),
				array ('Facet'=>'Awe', 'Prof'=>'Cool', 'Prof_Description'=>'Free from excessive emotion, relaxed and in control of themselves. Cool is always fashionable and doesn\'t really care what you think about it.', 'ProfInAnnex'=>1, 'Specify'=>0, 'Tangle'=>0),
				array('Facet'=>'Awe', 'Prof'=>'Willpower', 'Prof_Description'=>'Willpower is a measure of how control of themselves someone is. A strong will can effect great change, especially if using magic.', 'ProfInAnnex'=>3, 'Specify'=>0, 'Tangle' => 0),
				array('Facet'=>'Awe', 'Prof'=>'Bravery', 'Prof_Description'=>'Bravery is the ability to face your fears and carry on. It is highly prized amongst heroes and military men, although the latter do occasionally prefer foolhardy.', 'ProfInAnnex'=>3, 'Specify'=>0, 'Tangle'=>0),
				array('Facet'=>'Rook', 'Prof'=>'Resistance', 'Prof_Description'=>'Resistance is an ability to not be effected by something, especially adversely effected.', 'ProfInAnnex'=>4, 'Specify'=>0, 'Tangle' => 0)
			),
		),
	);
	public static function getSomeAnnexes(){
		global $post;
		$order=array('parent','auth','geo','facet','era','genre','scope','tags');
		$current=get_current_user_id();
		$auth=array(0,$current);
		 //$author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any',$scope='any',$parent='any'
		$geo=get_the_terms($post,'geo');
		$tags=get_the_terms($post,'post_tag');
		$facet=get_the_terms($post,'facet');
		$t13Core=get_term_by('name','T13Core', 'genre');
		$genre=array(get_the_terms($post,'genre'),$t13Core);
		$timeless=get_term_by('name', 'Timeless', 'era');
		$era=array(get_the_terms($post,'era'), $timeless);
		$omniversal= get_term_by('name','Omniversal','scope');
		$scope=array(get_the_terms($post,'scope'),$omniversal);
		$parent=$post->ID;
		$annexArray=array();
		while(count($annexArray)<20&&count($order)){
			$annexes=self::getAnnexes((in_array('auth',$order)? $auth:'any'),(in_array('geo',$order)? $geo:'any'),(in_array('tags',$order)? $tags:'any'),(in_array('facet',$order)? $facet:'any'),(in_array('genre',$order)? $genre:'any'),(in_array('era',$order)? $era:'any'),(in_array('scope',$order)? $scope:'any'),(in_array('parent',$order)? $parent:0));
			$annexArray=array_unique($annexArray+$annexes);
			array_shift($order);
		}
		return $annexArray;
	}
	public function terms($author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any',$scope='any',$parent='any'){
		return ['Author'=>$author,'Geo'=>$geo,'Tags'=>$tags, 'Facet'=>$facet,'Genre'=>$genre,'Era'=>$era,'Scope'=>$scope,'Parent'=>$parent];
	}
	static public  function getAnnexes($author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any',$scope='any',$parent='any'){
		$terms = ['Author'=>$author,'Geo'=>$geo,'Tags'=>$tags, 'Facet'=>$facet,'Genre'=>$genre,'Era'=>$era,'Scope'=>$scope,'Parent'=>$parent];
		return T13Elements::getT13Elements('Annex', $terms, 'Array');
	}
	static public function displayAnnexes($tags='any',$geo='any', $facet='any',$genre='any',$era='any', $scope='any', $author='any', $parent=0){$terms=['Author'=>$author,'Geo'=>$geo,'Tags'=>$tags, 'Facet'=>$facet,'Genre'=>$genre,'Era'=>$era,'Scope'=>$scope,'Parent'=>$parent];
		return T13Elements::getT13Elements('Annex',$terms,  'html');
	}
    static public function displaySizeAnnex($boon){
	$sway=T13Sway::getFromSwayTable(0,$boon,0);
	$boonText=T13Boons::writeFullBoon($boon,true);
	$rethtml='<div class="t13ne-annex"><strong class="t13ne-annextitle">Size Annex: </strong><details><summary>'.$boonText.'</summary><p>'.$sway['Location_Size'].'</p></details></div>';
	return $rethtml;
    }
    static public function displayPactAnnex($pact, $boon, $members){
	//this needs setting up
	//$pact is the descendants post_id
	//$boon is a forced boon if not calculated (%%)
	//$members is an array of alts (postIds or actual list? Will look at both... used to calculate the $boon if unforced.)
	if (!$boon||$boon='%%'){
		if (is_string($members)){
			$json=json_decode($members);
			if ($json['num_members']){
				$number=$json['num_members'];
			}
			if ($json['max_character']){
				$maxChar=$json['max_character'];
			}
			$sway=T13Sway::getSwayByGroupSize($number);
			$charSway=T13Sway::getSwayForType(array('Type'=>$maxChar));
		}
	}
	$boonText=T13Boons::writeFullBoon($boon,true);
	$rethtml='<div class="t13ne-annex"><strong class="t13ne-annextitle">Pact Annex: </strong><details><summary>'.$boonText.'</summary><p><strong>Group Size: </strong>'.$sway['Group_Size'].' (+'.$sway['Yarn'].')</p><div><strong>Highest Character Type: </strong> <details><summary> '.$charSway['Type'].'</summary><p>'.$charSway['Sway_Type_Description'].' (+'.T13Boons::getBoonReduced($charSway['Chi']).')</p></div></details></div>';
	return $rethtml;
    }

    static public function displayAnnex($annex=0,$boon='%%',$args=array()){
	//var_dump($args);
	//shortcode annex display...
	if (is_string($annex)&&$annex!='#'){
		//based on the name
		$anne=strtolower($annex);
		if ($anne=="size"&&isset($args['Size'])){
			if ($args['Size']>0){
				return self::displaySizeAnnex($boon);
			}
		}
		if ($anne=="pact"){
			$pactargs=json_decode($args['PactArgs']);
			return self::displayPactAnnex($args['Pact'], $boon, $pactargs);
		}
		if($anne=="personality"){
			return self::displayPersonalityAnnex( $args['Persona'],$args['Core'],  T13Types::arrayify($args['Hitches']), $args['Name'],$args['Stats'],$boon, $args['Annexes']);
		}
	}

    }
    static public function getAnnex($id){
		return T13Elements::getT13Element('Annex',$id);
    }
    static public function oldget($asr){
	$annexObj=$asr['Element'];
	$rethtml=$asr['HTML-header'];
	if (!is_wp_error($annexObj)){
			//$user=T13Types::displayUser($annexObj->post_author);
		$rethtml.='<div class="t13ne-annex"><details><summary><strong class="t13ne-annextitle">Annex: '.$annexObj->post_title.'</strong></summary><div class="t13ne-postdata">'.do_shortcode($annexObj->post_content).'</div>'.$asr['Date'].'</details></div>';
		return $rethtml.$asr['HTML-footer'];
	}else{
		return json_encode($annexObj).$asr['HTML-footer'];
	}
    }
    static public function writeAnnex($annex, $alt, $maxprofs=false){



	if (isset($annex['Boon'])){
		$boon = $annex['Boon'];
	}
	if (isset($annex['ID'])){
		$annexObj = T13Elements::getT13Element('Annex',$annex['ID']);
		$name = $annexObj['Name'];
		$content =do_shortcode($annexObj['Content']);
		$profs = T13Proficiencies::profsFromThresholds($annexObj['Thresholds']);
		$earl = $annexObj['URL'];
	}else{

		//var_dump($annex);

		$name = $annex['Name'];
		if (isset($annex['Description'])){
			$content = isset($annex['Description'])?$annex['Description']:'This Annex has not been specified with a description.';
		}else{$content='Unspecidied Annex: there should be better data here.';}
		$profs = $annex['Profs'];
		$earl = $earl = '#local-annex'.md5(json_encode($annex));
	}
	$geo = T13Geometry::writeGeo($name);
		$name = $geo['GeoText'];

		$datestamp =  date_i18n( __( 'l jS \o\f F Y', 'textdomain' ) );
		$currentUser=get_current_user_id();
		$user = T13Types::displayUser($currentUser);
		$date ="<small><p class=\"t13ne-postdata\"><span class=\"t13ne-date\">Posted : {$datestamp}.</span></p><p class=\"t13ne-author\"> Created by: {$user}</p></small>";
		if (!isset($annex['Facets'])){
			$pfs=[];
			foreach($annex['Profs'] as $prof){
				$pfs[]=$prof['Facet'];
			}
			$facets = T13Types::arrayify(implode(', ',$pfs));
		}else{
			$facets = T13Types::arrayify($annex['Facet']);
		}
		$facets = T13Facets::getTheseFacets($facets);

		$ftext = '';
		$faceT='';
		foreach($facets as $facet){
			$ftext .= ' t13ne-'.T13Types::csser($facet['FacetName']);
			$faceT .= "<div class=\"t13ne-facet\">[t13ne type=\"facet\" facet=\"{$facet['FacetIndex']}\" mode=\"fancy\" /]</div>";
		}
		$geon = intval($geo['BaseGeoNum']);
		//var_dump($facet);
		$geom = 't13ne-geo-geo'.$geon.(($geon>9)?' t13ne-geo-geo'.($geon-9):'');
		$css=' t13ne-annex t13ne-type-annex '.$ftext.' t13ne-genre-xp t13ne-era-unknown '.$geom.' t13ne-scope-dev';

	$ret='<!-- wp:t13ne-element --><article class="t13ne-element '.$css.'"><div class="t13ne-scope-styler"><div class="t13ne-genre-styler"><div class="t13ne-era-styler"><div class="t13ne-facet-styler"><div class="t13ne-tag-styler"><div class="t13ne-cat-styler"><div class="t13ne-geometry-styler"><div class="t13ne-type-styler"><section class="t13ne-element '.$css.'"><details><summary><strong class="t13ne-annextitle">Annex: </strong><strong class="t13-annex-name"><a href="'.$earl.'">'.$name.'</a></strong></summary>';
	$ret.=$content;
	//write name details

	//write description and
	//write profs and rules
	//calculate boon from prof facets if not set
	$text =[];
	$super=0;
	switch($annex['Type'] && !$maxprofs){
		case 'Skill':
		case 1:
			$maxprofs=2;
		break;
		case 'Talent':
		case 2:
			$maxprofs=5;
		break;
		case 'Power':
		case 3:
			$maxprofs = 8;
		break;
		case 'Super-Annex':
		case 4:
			$maxprofs = 8;
			$super=true;
		break;
		default:
			$maxprofs=1;
			break;
	}


	$profData = T13Proficiencies::profLister($profs, $maxprofs, false, '',$alt, $super);

	$ret.=$profData['HTML'];
	unset($profData['HTML']);
	//write boon
	$cval=0;
	$cboon=0;
	$plist = $profData['DATA'];


	foreach($plist as $key=>$profi){
			if ($key!=='HTML'){
			//var_dump($key);
			//var_dump($prof);
			foreach($profi['DATA'] as $keya=>$prof){
				if ($keya!=='HTML'){
					foreach($prof as $keyb=>$prf){
						//var_dump($keyb);
						//var_dump($prf);

						if (isset($prf['Boon'])&&$prf['AddBoon']){
							if ($super&&T13Types::contains($prf['Use'],['Root','Channel'])){
								//super annexes add Boons of Root and Channel.
								$cboon+=$prf['Boon'];
							}else{
								$cval+=T13Boons::getBoonValue($prf['Boon']);
							}

						}
					}

				}

			}
			}
	}
	if ($cboon){$cval+=T13Boons::getBoonValue($cboon);}
	if (isset($boon)){
		$boonText = T13Boons::writeFullBoon($boon, true, false, false);

		if ($cval&&$cval!==T13Boons::getBoonValue($boon)){
			$boonText .='<br/>Calculated: '.$boonText=T13Boons::writeFullBoon($cval, true, false, true);
		}
	}else{
		$boonText=T13Boons::writeFullBoon($cval, true, false, true);
	}
	$ret.="</details>{$boonText}<img id=\"T13Logo\" name=\"T13Logo\" /></section></div></div></div></div></div></div></div></div></article>";
	return $ret;
    }
    static public function subProfs($annexes=array(), $maxProfs=1,$alt=0){
	if (!is_array($annexes)){$annexes=T13Types::arrayify($annexes);}
	$ret=[];
	foreach ($annexes as $i=>$annex){
		if (!is_array($annex)){$annex=T13Types::arrayify($annex);}
		$cp=count($annex['Profs']);
		if (count($ret)<$maxProfs&&($annex['Type']=='Proficiency'||$annex['Type']===0||$cp==1)){
			$ps=T13Proficiencies::profLister($annex['Profs'],0, false, 'Free',$alt);
			$ret[]=$ps['HTML'];
		}
	}

	return $ret;
    }
    static public function subSkills($annexes='', $maxSkills=1,$alt=0){
	if (!is_array($annexes)){$annexes=T13Types::arrayify($annexes);}
	$ret=[];
	foreach ($annexes as $i=>$annex){

		if (!is_array($annex)){$annex=T13Types::arrayify($annex);}
		if (count($ret)<$maxSkills&&($annex['Type']=='Skill'||$annex['Type']==1||count($annex['Profs'])==2)){
			$ret[]=self::writeAnnex($annex,$alt, 2);
		}
	}

	return $ret;
    }
    static public function subTalents($annexes='', $maxTalents=1, $maxProfs=1,$alt=0){
	if (!is_array($annexes)){$annexes=T13Types::arrayify($annexes);}
	$ret=[];
	foreach ($annexes as $i=>$annex){
		if (!is_array($annex)){$annex=T13Types::arrayify($annex);}
		if (count($ret)<$maxTalents&&($annex['Type']=='Talent'||$annex['Type']==2||count($annex['Profs'])>2)){
			$ret[]=self::writeAnnex($annex,$alt, $maxProfs);
		}
	}
	return $ret;
    }
    static public function subPowers($annexes='', $maxPower=1, $maxProfs=1,$alt=0){
	if (!is_array($annexes)){$annexes=T13Types::arrayify($annexes);}
	$ret=[];
	foreach ($annexes as $i=>$annex){
		if (!is_array($annex)){$annex=T13Types::arrayify($annex);}
		$cp=count($annex['Profs']);
		if ($annex['Type']=='Power'||$annex['Type']==3||($cp>2&&$cp<=$maxProfs)){
			$ret[$i]=self::writeAnnex($annex,$alt, $maxProfs);
		}
	}
	return $ret;
    }
     static public function subSupers($annexes=0,$alt=0, $maxProfs=4){
	if (!is_array($annexes)){$annexes=T13Types::arrayify($annexes);}
	$ret=[];
	foreach ($annexes as $i=>$annex){
		if (!is_array($annex)){$annex=T13Types::arrayify($annex);}
		if ($annex['Type']=='Super-Annex'||$annex['Type']==4){
			$ret[$i]=self::writeAnnex($annex,$alt, $maxProfs);
		}
	}
	return $ret;
    }
    static public function subAnnexes($MasterBoon=13, $annexes='', $maxHitch=0, $minHitch=0, $hitchCount=0, $masterAnnexType=1, $alt=0){
	$profs=false;
	$skills=false;
	$talents=false;
	$powers=false;
	$supers=false;
	$ret='<article class="t13ne-annexes"><strong>Sub-Annexes</strong>';
	if (!is_array($annexes)){$annexes=T13Types::arrayify($annexes);}
	//var_dump($annexes);
	$red = T13Boons::getBoonReduced($MasterBoon);

	switch($masterAnnexType){
		case 'personality':
		case 'Personality':
		case 7:
			$profs =self::subProfs($annexes,$red,$alt);
			$skills= self::subSkills($annexes, $red,$alt);
			$mh=T13Boons::getBoonReduced($maxHitch);
			$talents=self::subTalents($annexes, min($red,count($skills),$mh ), T13Boons::getBoonReduced($hitchCount),$alt);
			$powers=self::subPowers($annexes,min(T13Boons::getBoonReduced($red),T13Boons::getBoonReduced($mh),T13Boons::getBoonReduced(count($talents))),$hitchCount, $alt);
			$supers = self::subSupers($annexes,$alt,$hitchCount);
		break;
		case 'super-annex':
		case 'Super-Annex':
		case 4:
			$profs = self::subProfs($annexes,$red,$alt);
			$skills = self::subSkills($annexes,$red,$alt);
			$talents= self::subTalents($annexes,$red, max(T13Boons::getBoonReduced($hitchCount),1),$alt);
			$powers = self::subPowers($annexes,2, max(4, min($hitchCount)),$alt);
			break;
		case 'power':
		case 'Power':
		case 3:
			$profs = self::subProfs($annexes,$red,$alt);
			$skills = self::subSkills($annexes,$red,$alt);
			$talents= self::subTalents($annexes,2, max(T13Boons::getBoonReduced($hitchCount),1),$alt);
			$powers = self::subPowers($annexes,1, max(4, min($hitchCount)),$alt);
			break;
		case 'Talent':
		case 'talent':
		case 2:
			$profs = self::subProfs($annexes,$red,$alt);
			$skills=self::subSkills($annexes,2,$alt);
			$talents= self::subTalents($annexes,1, max(T13Boons::getBoonReduced($hitchCount),1),$alt);
			$powers=0;
			break;
		default:
			$profs = 0;
				$skills=0;
				$talents=0;
				$powers=0;
			break;
	}
	if ($profs){
		$ret.='<section class="t13ne-profs"><p><strong>Proficiencies</strong></p><ol><li>';
		$ret.=implode('</li><li>',$profs);
		$ret.='</li></ol></section>';
	}
	if($skills){
		$ret.='<section class="t13ne-skills"><p><strong>Skills</strong></p><ol><li>';
		$ret.=implode('</li><li>',$skills);
		$ret.='</li></ol></section>';
	}
	if ($talents){
		$ret.='<section class="t13ne-talents"><p><strong>Talents</strong></p><ol><li>';
		$ret.=implode('</li><li>',$talents);
		$ret.='</li></ol></section>';
	}
	if ($powers){
		$ret.='<section class="t13ne-powers"><p><strong>Powers</strong></p><ol><li>';
		$ret.=implode('</li><li>',$powers);
		$ret.='</li></ol></section>';
	}
	if ($supers){
		$ret.='<section class="t13ne-supers"><p><strong>Supers</strong></p><ol><li>';
		$ret.=implode('</li><li>',$supers);
		$ret.='</li></ol></section>';
	}



	$ret.='</article>';
	return $ret;
    }
    static public function displayProfAnnex($annex){
	if (is_numeric($annex)){
		$annex = self::getAnnex($annex);
	}
	if (T13Types::is_Json($annex)){
		$annex=T13Types::arrayify($annex);
	}
	if (isset($annex['Thresholds'])){
		//this should be used to build the proflist for the annex.
		//var_dump($annex['Thresholds']);
		$profs=[];

	}
	if (isset($annex['Name'])&&isset($annex['Content'])){
		//we have some stuff we may be able to proceed/
		$nameText = T13Geometry::writeName($annex['Name']);
		$rethtml=$annex['HTML-header'];
		$rethtml.="<div class=\"t13ne-annex\"><details><summary><strong class=\"t13ne-annex-title\">Annex: {$nameText}</strong></summary><div class=\"t13ne-postdata\">{$annex['Content']}</div>{$annex['Date']}</details></div>";



		$rethtml.=$annex['HTML-footer'];
		return $rethtml;
	}
    }
  /*   static public function displaySizeAnnex($boon=0,$size=0){
	if (isset($size)){
		if ($size!=$boon){
			if ($size>1){
				$boon=intval($size&$boon);
			}
		}
	}
	$boonText=T13Boons::writeFullBoon(intval($boon),true);
	$sway=T13Sway::searchSway(array('Chi'=>intval($boon),'Location_Size'=>true));
	if (!isset($sway['Location_Size'])){
		$sway=T13Sway::searchSway(array('Yarn'=>T13Boons::getBoonReduced(intval($boon),false), 'Location_Size'=>true));
	}
	$sizeType=$sway['Location_Size'];
	return "<details class=\"t13ne-size-annex\"><summary class=\"t13ne-tooltip\"><span class=\"t13ne-size\"><strong>Size:</strong> {$sizeType}</span><div class=\"t13ne-tooltip\"Size Annexes are most important to enormous things like Locations, Giants, and Kaiju. Humans technically do have a hidden Size Annex that has a Boon of -1 to 1. This can be modified into a Smaller (or negative) Size by Scale.</div></summary> equivalent to {$boonText}</details>";
    } */
    static public function displayPersonalityAnnex($personas='',$cores='',$hitches='',$name="Unnamed",$stats=0,$boon='%', $annexes=array()){
	//error_log("displayPersonalityAnnex".json_encode(func_get_args()));
	//var_dump($annxes);
	$name=T13Types::arrayify($name);
	if ($boon[0]=='%'){$boon=0;$value=0;}
	$ret = '<div class="t13ne-personality"><details class="t13ne-personality-annex"><summary><strong>'.$name[0].'’s Personality Annex:</strong></summary><ul css="t13ne-annex-list"><li>';
	if (!is_array($personas)){
		$personas =T13Types::arrayify($personas);
	}
	if (!is_array($cores)){$cores=T13Types::arrayify($cores);}
	if (!is_array($hitches)){$hitches=T13Types::arrayify($hitches);}
	$alt=T13Statblock::getNewStatblock();
	//var_dump($alt);
	$stats=T13Statblock::getStats($alt,$stats,0);
	$minHitch = 26;
	$maxHitch =0;
	$cHitch = count($hitches);
	$Text=[];
	$profs=[];
	$psychosocial=[];
	foreach ($personas as $pers => $facet) {
		$pB = T13Statblock::getBoonForFacet($facet,$alt);
		array_push($Text, T13Facets::displayPersona($facet).' '.T13Boons::writeFullBoon($pB));
		array_push($psychosocial, T13Facets::getFacetAspectHTML($facet,'Psychosocial', 'li', '&nbsp;—&nbsp;'));
		$value += T13Boons::getBoonValue($pB);
	}
	foreach ($cores as $cors => $facet) {
		$pB = T13Statblock::getBoonForFacet($facet,$alt);
		array_push($Text,T13Facets::displayCore($facet).' '.T13Boons::writeFullBoon($pB));
		array_push($psychosocial, T13Facets::getFacetAspectHTML($facet,'Psychosocial', 'li', '&nbsp;—&nbsp;'));
		$value += T13Boons::getBoonValue($pB);
	}
	foreach ($hitches as $hit => $hitch) {
		$hita =T13Hitches::displayHitch($hitch, $alt);
		array_push($Text, $hita['Text']);
			//foreach($hita['Profs'] as $hp){
				//$profs[]=$hp;
			//}
			array_push($psychosocial, T13Facets::getFacetAspectHTML($hita['Facet'],'Psychosocial', 'li', '&nbsp;&mdash;&nbsp;'));
			$pB = $hita['Bane'];
			if ($pB>$maxHitch){$maxHitch=$pB;}
			if ($pB<$minHitch){$minHitch=$pB;}
			$value += T13Boons::getBoonValue($pB);
		}
		$ret.=implode('</li><li>', $Text);
		$ret.='</li></ul><details><summary><strong>Suggested Psychosocial Spaces</strong></summary><ul><li>';
		$psychosocial = array_keys(array_flip($psychosocial));
		$ret.=implode('</li><li>', $psychosocial);
		$ret.='</li></ul></details><br/>';
		$ret.= T13Boons::writeFullBoon($value,1,0,1);

		//var_dump($profs);
		//$data =T13Proficiencies::profLister($profs,T13Boons::getBoonDraw($value), false, 'Free',$alt);
		//$ret.= $data['HTML'];
		$ret.= self::subAnnexes(T13Boons::getboonReduced($value), $annexes, $maxHitch, $minHitch, $cHitch,'personality', $alt);

		return $ret.'</div>';
	}
	static public function pactContent($name='Pact',$annex='', $data='', $publish=0 ){
		error_log('PactContent::'.json_encode(['name'=>$name,'annex'=>$annex,'data'=>$data,'publish'=>$publish]));
		$annexContent.='<h4>Pact</h4><ul class="t13ne-pact-details">';
		$name.=' Pact Annex for '.$data['Terms']['Parent'];
		$annex['Annex_Type']=5;
		$groupsize=0;
		$maxCharChi=0;
		foreach($annex['Pact'] as $pact){
			$annexContent='<ul class="t13ne-pact-annex">';
			if (isset($pact['PactMember'])){
				if (is_string($pact['PactMember'])){
					$member=wp_get_page_by_title($pact['PactMember']);
					$annexContent.="<li>[t13ne type=\"char\" char=\"{$member->ID}\" mode=\"pact\" /]</li>";
				}elseif(is_numeric($pact['PactMember'])){
					$annexContent.="<li>[t13ne type=\"char\" char=\"{$pact['PactMember']}\" mode=\"pact\" /]</li>";
				}
				$groupsize++;

			}elseif(isset($pact['GroupSize'])){
				if ($pact['GroupSize']!=$groupsize){
					if (is_numeric($pact['GroupSize'])){
						$groupsize+=$pact['GroupSize'];
					}
				}
				$levels=T13Sway::getSwayByGroupSize($groupsize);
				$b=$levels['Chi'];
				$bb=T13Boons::getBoonDraw($groupsize);
				$groupBoon=T13Boons::writeFullBoon($bb);
				$annexContent.="<li data-boon=\"{$sway['Chi']}\"><details><summary><strong>Membership Total: </strong><span class=\"t13ne-group-size\">{$groupsize}</span></summary><span class=\"t13ne-chi\">Levels: {$levels['Chi']}</span> {$groupBoon}</details></li>";
			}elseif(isset($pact['MaxChar'])){
				if (is_numeric($pact['MaxChar'])){
					$sway= T13Sway::getFromSwayTable($pact['MaxChar']);
					$chars=T13Sway::elementTypeSway($sway['Chi'], $type="Characters");
					if (isset($chars['Type'])){
						$ctype="<div class=\"t13ne-tooltip\">{$chars['Type']}<span class=\"t13ne-tooltip\">{$chars['Sway_Type_Description']}</div>";
					}elseif(isset($chars[0]['Type'])){
						$ctype='<ul class="t13ne-dice-list">';
						foreach($chars as $char){
							$ctype.="<li class=\"t13ne-tooltip\">{$char['Type']}<div class=\"t13ne-tooltip\">{$char['Sway_Type_Description']}</div></li>";
						}
						$ctype.='</ul>';
					}
					if ($maxCharChi<$sway['Chi']){
						$maxCharChi=$sway['Chi'];
					}
				}elseif(is_string($pact['MaxChar'])){

					$chi=T13Sway::getSwayForType($pact['MaxChar']);
					$ctype=$chi['Type'];
					if ($maxCharChi<$chi['Chi']){
						$maxCharChi=$chi['Chi'];
					}
				}
				$maxYarn=T13Boons::getBoonReduced($maxCharChi);
				$annexContent.="<li class=\"t13-pact t13ne-tooltip\" data-minimum-boon=\"{$maxYarn}\"><span class=\"t13ne-tooltip\">Minimum Boon required: {$maxYarn}</span><strong>Maximum Character: </strong><span class=\"t13ne-type \">$ctype</span></li>";
			}
		}
		return array('html'=>$annexContent, 'Max-Yarn'=>$maxYarn);
	}

	static private function addProfToAnnex($annexid=0, $profid=0){
	//not sure how this will work is a an annex stored as a list of profids?
		error_log('addProfToAnnex::'.json_encode(['Annex'=>$annexid,'prof'=>$profid]));

		return null; // because I have no idea what it returns yet...
	}
	static public function costicator($prof,$data,$stats){
		error_log('costicator::'.json_encode(['prof'=>$prof,'data'=>$data,'stats'=>$stats]));
		$ret=array();
		if (isset($prof['Boon'])){
			$bo=T13Statblock::getBoonForFacet($prof['Facet'],$data['post_id'],$stats);
			$scale=$bo['Scale'];
			$b=$bo['Boon']+$bo['Scale'];
		}

		switch ($prof['ProfInAnnex']){
			case 0:
			case 1:
			$ret['AnnexFacet'] = $prof['Facet'];
			case 2:
			$ret['TangleFacet'] = $prof['Facet'];
			case 3:
			$ret['UmbralBoon']=$bo['Boon'];
			$ret['NimbedBoon']=$b;
			$ret['UmbralValue']=T13Boons::getBoonValue($b);
			if ($prof['ProfInAnnex']>1){
				$ret['Cost']=1-$bo['Boon'];
			}
			break;
			case 4:
			$ret['UmbralBoon']=$bo['Boon'];
			$ret['NimbedBoon']=$b;
			$ret['UmbralValue']=0;
			$ret['Cost']=$b+1;
			break;
			case 5:
			$ret['Cost']=1;
			$ret['UmbralValue']=0;
			break;
			case 6:
			$ret['Cost']=0;
			$ret['UmbralValue']=T13Boons::getBoonValue($b);
			$ret['Conflict']='true';
			break;
			case 7:
			$ret['Cost']=0;
			$ret['UmbralValue']=T13Boons::getBoonValue($b);
			$ret['Conflict']=false;
			case 8:
			case 9:
			case 10:
			$ret['Cost']=0;
			$ret['UmbralValue']=T13Boons::getBoonValue($b);
			$ret['Conflict']=false;
			default:
			$ret['Cost']=0;
			$ret['UmbralValue']=0;
			$ret['Conflict']=false;
			break;
		}
		return $ret;

	}

	static public function createPersonalityAnnex($annex,$data){
		error_log('createPersonalityAnnex::'.json_encode(['Annex'=>$annex,'data'=>$data]));
		$currentUser=get_current_user_id();
		$user = T13Types::displayUser($currentUser);
		$terms=$data['Terms'];
		$annexid = $data['post_id'];
		$thresholds=array();
		$boons=array();
		if (isset($annex['Stats'])){
			$stats=T13Statblock::getStats($annexid,$annex['Stats']);
			$statblocks = T13Statblock::getStatID($annexid);
		}elseif(isset($annex['Statblock'])){
			$stats=T13Statblock::getStats($data['post_id'],$annex['Statblock']);
			$statblocks = T13Statblock::getStatID($annexid);
		}else{
			if ($terms['Parent_id']){
				$stats=T13Statblock::getStats($terms['Parent_id']);
				$statblocks = T13Statblock::getStatID($terms['Parent_id']);
			}
			if ($terms['Creator_id']){
				$stats=T13Statblock::getStats($terms['Creator_id']);
				$statblocks = T13Statblock::getStatID($terms['Parent_id']);
			}
		}
		$statblock = $statblocks[0];
		if(isset($annex['Hitches'])){
			if (!T13Types::contains($annex['Name'], 'Personality Annex')){
				$annex['Name'].= " Personality Annex";
				$annex['Annex_Type']=7;
			}
			if (($annex['Hitches']&&isset($annex['Hitches']['Persona']))||(isset($annex['Profs'])&&T13Types::contains($annex['Profs'],'Persona'))){
				//better create a Personality Group and tie it to the Annex
				if (!T13Types::checkType('Annex', $annexid)){
					error_log("createProfAnnex:: You gotta target an Annex's post id, Dude.");
					return null;
				}
				//okay got an Annex, see if it already exists as a Threshold Annex Group
				$groupid = T13Thresholds::getGroupID($annexid);
				if (!$groupid){
					//build a group
					$groupid = T13Thresholds::addThisGroup("List Group for Personality Annex: {$annex['Name']}","Annex Group added automatically for Annex:{$annex['Name']} by {$user}",'list', $annexid);
					$thresholds[]=T13Thresholds::tieThreshold('creator', 'owns', "This Annex {$annex['Name']} Element created an Annex Group Prof List", $annexid,null,$groupid,$statblock, null,null, false,null);
				}
				$facetsarr=array();
				$cost=0;
				$sway = T13Sway::getSwayForType('Personality');
				$minCost = $sway['Chi'];
				$cost +=$minCost;

				if (isset($annex['Hitches'])){
					if (is_string($annex['Hitches'])){
						$annex['Hitches']=json_decode($annex['Hitches']);
					}
					$countHitches=count($annex['Hitches']);
					$woeIst=0;
					$red=T13Boons::getBoonReduced($countHitches);
					$hitchterms=$data['Terms'];
					$hitchTerms['Parent']=$data['post_id'];
					foreach ($annex['Hitches'] as &$hitch){
						if (isset($hitch['Persona'])){
							$persona = T13Facets::getThisFacetAspect($hitch['Facet'],'Persona','Name');
							$prof = T13Elements::getT13Element('Prof', T13Elements::getTitleFromNames(array(T13Sanitize::sanitize($persona).' Persona', T13Sanitize::sanitize($persona.'('.$hitch['Facet']['FacetName'].' Persona) Proficiency'),T13Sanitize::sanitize($hitch['Facet']['FacetName'].' Persona Proficiency'))));
							$profid = $prof->ID;
							$bp=T13Statblock::getBoonForFacet($hitch['Facet'],$data['post_id'],$stats);
							$pb=$bp['Boon']+$bp['Scale'];
							$personality['Value']+=T13Boons::getBoonValue(intval($pb));
							$boons[]=$pb;

							$thresholds[]=T13Thresholds::tieThreshold('personality', 'persona', "Adds {$hitch['Persona']} prof to {$annex['Name']}.", $profid,$annexid,$groupid,$statblock,$hitch['Facet'],0, false,null);
							$facetsarr[]=$hitch['Facet'];
						}
						if (isset($hitch['Core'])){
							$core = T13Facets::getThisFacetAspect($hitch['Facet'],'Core');
							$prof = T13Elements::getT13Element('Prof', T13Elements::getTitleFromNames(array(T13Sanitize::sanitize($core).' Core', T13Sanitize::sanitize($core.'('.$hitch['Facet']['FacetName'].' Core) Proficiency'),T13Sanitize::sanitize($hitch['Facet']['FacetName'].' Core Proficiency'))));
							$profid = $prof->ID;
							$bp=T13Statblock::getBoonForFacet($hitch['Facet'],$data['post_id'],$stats);
							$pb=$bp['Boon']+$bp['Scale'];
							$personality['Value']+=T13Boons::getBoonValue(intval($pb));
							$boons[]=$pb;
							$thresholds[]=T13Thresholds::tieThreshold('personality', 'core',  "Adds {$hitch['Core']} prof to  {$annex['Name']}. May specify Core data such as I-Chings or Significator cards as required.", $profid,$annexid,$groupid,$statblock,$hitch['Facet'],0, false, isset($hitch['Core']['Data'])?($hitch['Core']['Data']):((isset($hitch['Data'])?($hitch['Data']):null)));
							$facetsarr[]=$hitch['Facet'];
						}
							if ($hitch['Hitch']==0){ //this hitch isn't installed...
							$hitchFacetBoon=T13Statblock::getBoonForFacet($hitch['Facet'],$annexid,$stats);
							$boon=$hitchFacetBoon['Scale']+$hitchFacetBoon['Boon'];
							$hitch['HitchTier']=0;
							$woeIst+=0;
							if (($hitch['HBoon']>$boon/2)&&($hitch['HBoon']<=$boon)){
								$hitch['HitchTier']=1;
								$woeIst+=0;
							}else if($hitch['HBoon']>$boon){
								$hitch['HitchTier']=2;
								$woeIst+=1;
							}
							$hitchTerms['Facet']='';
							$hitchTerms['Facet']=$hitch['Facet'];
							$hitch['Hitch']=T13Elements::addT13Element('Hitch',$hitch['Name'],$hitch,$hitchTerms, true);

						}
							if ($hitch['HitchTier']>2){ //resolved
								$bh=T13Statblock::getBoonForFacet($hitch['Facet'],$annexid,$stats);
								$boon=$bh['Scale']+$bh['Boon'];
								$boons[]=$bh;
							}else{
								$boons[]=$hitch['HBoon'];

							}
							$htier=strtolower(T13Types::$hitchTiers[$hitch['HitchTier']]['Direction']);
							$thresholds[]=T13Thresholds::tieThreshold('personality', $htier, "Adds a Hitch to {$annex['Name']}.", $hitch['Hitch'],$annexid,$groupid,$statblock,$prof['Facet'],$hitch['HBoon'], false,null);
							$personality['Value']+=T13Boons::getBoonValue(intval($boon));

						}

					}

					if (isset($annex['Profs'])){
						foreach($annex['Profs'] as &$prof){
							$profa = get_page_by_title( $prof['Prof']);
							$profid = $profa->ID;
							if (T13Types::contains($prof['Prof'], 'Persona')&&$prof['ProfInAnnex']==8){
								$bp=T13Statblock::getBoonForFacet($prof['Facet'],$data['post_id'],$stats);
								$pb=$bp['Boon']+$bp['Scale'];
								$personality['Value']+=T13Boons::getBoonValue(intval($pb));
								$boons[]=$pb;
								$thresholds[]=T13Thresholds::tieThreshold('personality', 'persona',  "Adds {$prof['Prof']} to  {$annex['Name']}.", $profid,$annexid,$groupid,$statblock,$prof['Facet'],$pb, false,null);
							}
							if (T13Types::contains($prof['Prof'], 'Core')&&$prof['ProfInAnnex']==9){
								$bp=T13Statblock::getBoonForFacet($prof['Facet'],$data['post_id'],$stats);
								$pb=$bp['Boon']+$bp['Scale'];
								$personality['Value']+=T13Boons::getBoonValue(intval($pb));
								$boons[]=$pb;
								$thresholds[]=T13Thresholds::tieThreshold('personality', 'core',  "Adds {$prof['Prof']} to  {$annex['Name']}.", $profid,$annexid,$groupid,$statblock,$prof['Facet'],$pb, false,null);
							}
							if (T13Types::contains($prof['Prof'], 'Hitch')&&$prof['ProfInAnnex']==10){
								$bp=T13Statblock::getBoonForFacet($prof['Facet'],$data['post_id'],$stats);
								$pb=$bp['Boon']+$bp['Scale'];
								if (!$prof['HBoon']){ //no HBoon is set assume Maxed Flaws
									$personality['Value']+=T13Boons::getBoonValue(intval($pb));
									$boons[]=$pb;
									$htier=strtolower(T13Types::$hitchTiers[1]['Direction']);
								}else{
									$hitchFacetBoon=T13Statblock::getBoonForFacet($prof['Facet'],$annexid,$stats);
									$boon=$hitchFacetBoon['Scale']+$hitchFacetBoon['Boon'];
									$personality['Value']+=T13Boons::getBoonValue(intval($prof['HBoon']));
									$hitchtier=0;
									$woeIst+=0;
									if (($prof['HBoon']>$boon/2)&&($prof['HBoon']<=$boon)){
										$hitchtier=1;
										$woeIst+=0;
									}else if($prof['HBoon']>$boon){
										$hitchtier=2;
										$woeIst+=1;
									}
									$htier=strtolower(T13Types::$hitchTiers[$hitchtier]['Direction']);
								}

								$thresholds[]=T13Thresholds::tieThreshold('personality', $htier,  "Adds {$prof['Prof']} to  {$annex['Name']} as Hitch.", $profid,$annexid,$groupid,$statblock,$prof['Facet'],$prof['HBoon'], false,null);
							}
						}



					}
				}
			}
			$val=(isset($personality['Value'])) ?$personality['Value'] : (isset($value) ?$value : 0);
			$boon= T13Boons::getBoonReduced($val,false);
			$cost +=$boon;
			if (!isset($woeIst)){$woeIst=-1;}

			return array('Boon'=>$boon,'Value'=>$val,'Thresholds'=>$thresholds, 'Hitches'=>$countHitches, 'RedHitches'=>$red, 'Woes'=>$woeIst);
		}
		static public function createPactAnnex($annex,$data){
	//builds a group assigns thresholds to connect people to the group.
	// complicated by the fact people can leave and enter, but then so can profs in an annex.. oh oh :(

	//find the group if it exists.

	//if it doesn't exist (because it probably doesn't yet) create the new Pact

	//add the list of actual Characters or the cheat sheet Chars.
	//Merge Character Stats to create Pact Stats.
			error_log('createPactAnnex::'.json_encode(['Annex'=>$annex,'data'=>$data]));
			$currentUser=get_current_user_id();
			$user = T13Types::displayUser($currentUser);
			$terms=$data['Terms'];
			$annexid = $data['post_id'];
			$thresholds=array();
			$boons=array();
			$boon=0;
			$basecost=0; //this is meant to get calculated... isn't yet.
			$val=0; // combines the values
			$minCost=0;
			$facetsarr=array();
			if (isset($annex['Stats'])){
				$stats=T13Statblock::getStats($annexid,$annex['Stats']);
				$statblocks = T13Statblock::getStatID($annexid);
			}elseif(isset($annex['Statblock'])){
				$stats=T13Statblock::getStats($data['post_id'],$annex['Statblock']);
				$statblocks = T13Statblock::getStatID($annexid);
			}else{
				if ($terms['Parent_id']){
					$stats=T13Statblock::getStats($terms['Parent_id']);
					$statblocks = T13Statblock::getStatID($terms['Parent_id']);
				}
				if ($terms['Creator_id']){
					$stats=T13Statblock::getStats($terms['Creator_id']);
					$statblocks = T13Statblock::getStatID($terms['Parent_id']);
				}
			}
			$statblock = $statblocks[0];
			if(isset($annex['Pact'])||$annex['Annex_Type']==5){
			//$name=$annex['Name'].' Pact Annex for '.$data['Terms']['Parent'];
				$annex['Annex_Type']=5;
				$groupsize=0;
				$maxChar=0;
				if (!isset($annex['Pact']['Group_ID'])){
				// no group_id set so we see if it's in the db already.
					$groupid = T13Thresholds::getGroupID($annexid);
				}else{
				//we were told a group id, so see if it really exists.
					$groupid = T13Thresholds::getGroupID($annex['Pact']['Group_ID']);
				}
				if (!$groupid){
				//build a group
					$groupid = T13Thresholds::addThisGroup("Pact Group for Annex: {$annex['Name']}","Pact Group added automatically for Annex:{$annex['Name']}",'pact', $annexid);
					$thesholds[]=T13Thresholds::tieThreshold('creator', 'owns', "This Annex Element:{$annex['Name']} created a Pact Group ", $annexid,null,$groupid,$statblock, null,null, false,null);
				}

				if (isset($annex['Pact']['PactMembers'])){
					foreach($annex['Pact']['PactMembers'] as $member){
						$maxCharChi = 0;
						if (isset($member['Member'])){
							if (is_string($member['Member'])){
								$thismember=wp_get_page_by_title($member['Member']);

							}elseif(is_numeric($member['Member'])){
								$thismember = $member['Member'];
							}

						}
						if (isset($thismember)){
							$objterms = T13Types::collectTaxonomies($thismember);
							error_log( "pact members this member objterms: ".json_encode( $objterms));
							if (is_array($objterms)){
								foreach ($objterms as $key => $term) {
									switch($term->slug){
										case 'characters':
										case 'extras':
										$groupsize++;
										break;
										case 'pacts':
										if (isset($member['GroupSize'])){
											if (is_numeric($member['GroupSize'])&&$member['GroupSize']!=$annex['Pact']['GroupSize']){
												$groupsize+=$member['GroupSize'];
											}
										}
										break;
										case 'archetypes':
										case 'lites':
										case 'details':
										case 'full':
										//?? not sure
										break;
										case 'grunt':
										$sway= T13Sway::getFromSwayTable('Grunt');
										break;
										case 'hero':
										$sway= T13Sway::getFromSwayTable('Hero');
										break;
										case 'yarn-teller':
										$sway= T13Sway::getFromSwayTable('Yarn-Teller');
										break;
										case 'goblin':
										$sway= T13Sway::getFromSwayTable('Goblin');
										break;
										case 'demon':
										$sway= T13Sway::getFromSwayTable('Demon');
										break;
										case 'demonlord':
										$sway= T13Sway::getFromSwayTable('Demon-Lord');
										break;
										case 'vex':
										$sway= T13Sway::getFromSwayTable('Vex');
										break;
										case 'chorus':
										$sway= T13Sway::getFromSwayTable('Chorus');
										break;
										case 'cast':
										$sway= T13Sway::getFromSwayTable('Cast');
										break;
										case 'fon':
										$sway= T13Sway::getFromSwayTable('Force-of-Nature');
										break;
									}
									if ($maxCharChi<$sway['Chi']){
										$maxCharChi=$sway['Chi'];
									}
								}
							}
						}
					}
				}


		}/*elseif(isset($pact['GroupSize'])){
				if ($pact['GroupSize']!=$groupsize){
					if (is_numeric($pact['GroupSize'])){
						$groupsize+=$pact['GroupSize'];
					}
				}
				$levels=T13Sway::getSwayByGroupSize($groupsize);
				$b=$levels['Chi'];
				$bb=T13Boons::getBoonDraw($groupsize);
				$groupBoon=T13Boons::writeFullBoon($bb);
				$annexContent.="<li data-boon=\"{$sway['Chi']}\"><details><summary><strong>Membership Total: </strong><span class=\"t13ne-group-size\">{$groupsize}</span></summary><span class=\"t13ne-chi\">Levels: {$levels['Chi']}</span> {$groupBoon}</details></li>";
			}elseif(isset($pact['MaxChar'])){
				if (is_numeric($pact['MaxChar'])){
					$sway= T13Sway::getFromSwayTable($prof['MaxChar']);
					$chars=T13Sway::elementTypeSway($sway['Chi'], $type="Characters");
					if (isset($chars['Type'])){
						$ctype="<div class=\"t13ne-tooltip\">{$chars['Type']}<span class=\"t13ne-tooltip\">{$chars['Sway_Type_Description']}</div>";
					}elseif(isset($chars[0]['Type'])){
						$ctype='<ul class="t13ne-dice-list">';
						foreach($chars as $char){
							$ctype.="<li class=\"t13ne-tooltip\">{$char['Type']}<div class=\"t13ne-tooltip\">{$char['Sway_Type_Description']}</div></li>";
						}
						$ctype.='</ul>';
					}
					if ($maxCharChi<$sway['Chi']){
						$maxCharChi=$sway['Chi'];
					}
				}elseif(is_string($pact['MaxChar'])){

					$chi=T13Sway::getSwayForType($prof['MaxChar']);
					$ctype=$chi['Type'];
					if ($maxCharChi<$chi['Chi']){
						$maxCharChi=$chi['Chi'];
					}
				}
				$maxYarn=T13Boons::getBoonReduced($maxCharChi);
				$annexContent.="<li class=\"t13-pact t13ne-tooltip\" data-minimum-boon=\"{$maxYarn}\"><span class=\"t13ne-tooltip\">Minimum Boon required: {$maxYarn}</span><strong>Maximum Character: </strong><span class=\"t13ne-type \">$ctype</span></li>";
			}
		}*/

		return  array('Thresholds'=>$thresholds,'Basecost'=>$basecost, 'MinCost'=>$minCost, 'Boon'=>$boon,'Facets'=>$facetsarr, 'Value'=>$val, 'Hitches'=>0, 'RedHitches'=>0, 'Woes'=>0);
	}
	static public function changeProfAnnex($annexid,$change){
		$thresholds =[];
		error_log('changeProfAnnex::'.json_encode(['annexid'=>$annexid,'change'=>$change]));
		$current=get_current_user_id();
		if (T13Types::checkType('Annex',$annexid)){
			$annex = T13Elements::getT13Element('Annex',$annexid);
			error_log('ChangeProfAnnex:: Annex ='.json_encode($annex));
		}else{
			error_log("ChangeProfAnnex::no Annex specified");
			return false;
		}
		if (isset($change['Group'])){
			error_log('changeProfAnnex:: Group ID passed in'.$change['Group']);
			$groupid = $change['Group'];
		}else{
			error_log('changeProfAnnex:: Group ID not passed in'.$change['Group']);
			$groupid = T13Thresholds::getGroupID($annexid);
		}
		error_log('changeProfAnnex:: groupid ='.json_encode($groupid));
		if (isset($change['Statblock'])){
			$statblock = $change['Statblock'];
		}else{
			$statblocks = T13Statblock::getStatID($annexid);
			$statblock = 0;
			if (isset($statblocks)&&(isset($statblocks[0]))){
				$statblock = $statblocks[0];
			}

		}
		error_log('changing prox annex '.json_encode(array('annex'=>$annex,'groupid'=>$groupid,'statblock'=>$statblock)));
		if (isset($change['Change'])&&isset($change['Profs'])){
			foreach($change['Profs'] as $prof){
				if (!isset($prof['post_id'])){
					//no id set
					if (isset($prof['Prof'])){
						if (is_numeric($prof['Prof'])){
							$prof_id = $prof['Prof'];
						}
						if (is_string($prof['Prof'])&&isset($prof['Facet'])){
							//yeah we're adding this one...
							$profterms=$annex['Terms'];
							if (!isset($prof['Content'])){
								if(isset($prof['Prof_Description'])){
									$prof['Content'] = $prof['Prof_Description'];
								}else{
									if (isset($prof['Description'])){
										$prof['Content']=$prof['Description'];
									}else{
										error_log("ChangeProfAnnex:: no description or id of Prof specified");
										return false;
									}
								}
							}
							$prof['Content'].="<small class=\"t13ne-disclaimer\" >This Proficiency was automatically added when adding <a href=\"{$annex['URL']}\">Annex: {$annex['Name']}</a>.</small>";
							$profterms['Facet']= $prof['Facet'];
							$profterms['Parent']=$annex['post_id'];
							$profname = array(T13Sanitize::sanitize($prof['Prof']),T13Sanitize::sanitize($prof['Facet'].' '. $prof['Prof'].' Proficiency'), T13Sanitize::sanitize($prof['Facet'].' Proficiency'));
							//this should perfomr a check if something with that name already exists. If it does link to that one.



							$prof_id = T13Elements::T13ElementExists($profname);
							if (!$prof_id){
								$prof_id = T13Elements::addT13Element('Proficiency', $profname, $prof, $profterms, true);
							}

						}else{
							error_log("changeProfAnnex:: stringy prof but no Facet specified error");
						}
					}else{
						error_log("changeProfAnnex:: no 'Prof' or 'post_id's set in Profs array");
					}
					if (isset($prof_id)){
						$prof = T13Elements::getT13Element('Proficiency',$prof_id);
					}
					switch ($change['Change']){

						case 'add':
						error_log('ChangeProfAnnex:: Change Add');
						if (is_null($prof_id)){
							error_log("createProfAnnex :: Proficiency annexes need proficiencies with post ids, my dude.");
							return false;
						}else{
							//we have the prof_id and groupid build a Threshold
							$stats=$annex['Stats']; //probably this is all guesswork as I failed to comment originally.
							$cost = self::costicator($prof, $annex, $stats);

							if (isset($cost['AnnexFacet'])){
								$facetsarr[]=$cost['AnnexFacet'];
							}
							$costs[]=$cost;
							if ($prof['ProfInAnnex']){
								$prft=array('root','channel','tangle','umbral','nimbed','extra');

								switch ($prof['ProfInAnnex']){
									case 0:
									case 'root':
									error_log('adding Root');
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'root', "Added a Proficiency to an Annex as the Annex Root. In this case {$prof['Prof']} was added into {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock,$prof['Facet'],0, false,null);

									break;
									case 1:
									case 'channel':
									error_log('adding Channel');
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'channel', "Added a Proficiency to an Annex as the Annex Channel. In this case {$prof['Prof']} was added into {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock,$prof['Facet'],0, false,null);

									break;
									case 2:
									case 'tangle':
									error_log('adding Tangle');
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'tangle', "Added a Proficiency to an Annex as a Tangle. In this case {$prof['Prof']} was added into {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock,$prof['Facet'],$cost['Cost'], false,null);

									break;
									case 3:
									case 'umbral':
									error_log('adding Umbral');
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'umbral',  "Added a Proficiency to an Annex as an Umbral. In this case {$prof['Prof']} was added into {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock,$prof['Facet'],$cost['Cost'], false,null);

									break;
									case 4:
									case 'nimbed':
									error_log('adding Nimbed');
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'nimbed', "Added a Proficiency to an Annex as a Nimbed. In this case {$prof['Prof']} was added into {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock,$prof['Facet'],$cost['Cost'], false,null);

									break;
									case 5:
									case 'extra':
									error_log('adding Extra');
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'extra', "Added a Proficiency to an Annex as an Extra granted to those who use it. In this case {$prof['Prof']} was added into {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock,$prof['Facet'],$cost['Cost'], false,null);
									break;
									case 6:
									case 'conflict':
									error_log('adding Conflict');
										//expects Conflict sides as separate Groups, arrary('Conflict'=>array('Card'=>4);
										//is it pull, push, external or hidden?
									if (isset($prof['Conflict']['Card'])){
										$prof['Conflict']['Conflict_Embodiment'] = T13Cards::$yarn[$prof['Conflict']['Card']]['Conflict_Embodiment'];
										$prof['Conflict']['Facet_Embodiment'] = T13Cards::$yarn[$prof['Conflict']['Card']]['Facet_Embodiment'];
									}

									switch ($prof['Conflict']['Conflict_Embodiment']){
										case 0:
										case 'Hidden':
										$type='hidden';
										break;
										case 1:
										case 'Pull':
										$type = 'pull';
										break;
										case 2:
										case 'Push':
										$type = 'push';
										break;
										case 3:
										case 'External':
										$type = 'external';
										break;
									}
									switch ($prof['Conflict']['Facet_Embodiment']){
										case 0:
										case 'Incarna':
										$direction ='incarna';
										break;
										case 1:
										case 'Persona':
										$direction ='persona';
										break;
										case 2:
										case 'Core':
										$direction ='core';
										break;
										case 3:
										case 'Hitch':
										$direction ='hitch';
										break;
										case 4:
										case 'Monster':
										$direction ='monster';
										break;
										case 5:
										case 'Proficiency':
										$direction ='proficiency';
										break;
										case 6:
										case 'Annex':
										if (isset($prof['Conflict']['ProfInAnnex'])){
											if (is_numeric($prof['Conflict']['ProfInAnnex'])){
												$direction  = $prft[$prof['Conflict']['ProfInAnnex']];
											}
											if (is_string($prof['Conflict']['ProfInAnnex'])){
												$direction = $prof['Conflict']['ProfInAnnex'];
											}
										}else{
											$direction = (string) array_rand($prft);
										}

										break;
										case 7:
										case 'Proficiency':
										$direction ='proficiency';
										break;
										case 8:
										case 'Ordeal/Test':
										$direction = (string) array_rand('ordeal','test');
										break;
										case 9:
										case 'Obstacle':
										$direction ='obstacle';
										break;
										case 10:
										case 'Descendant':
										$direction ='descendant';
										break;
										case 11:
										case 'Location':
										$direction ='location';
										break;
										case 12:
										case 'Pact-Descendant':
										case 'Pact':
										$direction ='pact';
										break;
										case 13:
										case 'Quest':
										$direction ='quest';
										break;
										case 14:
										case 'Lore':
										$direction ='lore';
										break;
										case 15:
										case 'Emotions':
										$direction ='emotions';
										break;
										case 7:
										case 'Failure':
										$direction ='failure';
										break;
										default:
										$direction = $prof['Conflict']['Conflict_Embodiment'];
										break;
									}
									$thresholds[]=T13Thresholds::tieThreshold($type, $direction, "Added The Conflict Proficiency indicating the relation of the Conflict to the Embodiment ({$type}) ({$direction}). The Target Element of this threshold is usually an Embodiment Character, the group usually represents the Conflict Side.", $prof_id,$annexid,$groupid,$statblock, $prof['Facet'],null, false,array('Prof'=>$prof_id,'Annex'=>$annexid, 'Conflict'=>$prof['Conflict']));
									break;
									case 7:
									case 'liteprof':
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'multiply', "Added the Proficiency to itself to form a Lite Proficiency Annex {$prof['Prof']} / {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock, $prof['Facet'],$prof['Multiplier'], false,array('Multiplier'=>$prof['Multiplier']));

									break;
									case 8:
									case 9:
									case 10:
									case 'Personality':
									case 'Persona':
									case 'Core':
									case 'Hitch':
									if (isset($prof['Prof'])){
										if (is_string($prof['Prof'])){
											if (T13Types::contains($prof['Prof'],'Persona')){
												$thresholds[]=T13Thresholds::tieThreshold('prof','persona', "Added to indicate the Proficiency {$prof['Prof']} is a Persona of {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock, null, null, false,null);
											}
											if (T13Types::contains($prof['Prof'],'Core')){
												$thresholds[]=T13Thresholds::tieThreshold('prof','core',"Personality {$prof['Prof']}", "Added to indicate the Proficiency {$prof['Prof']} is a Core of {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock, null, null, false,null);
											}
											if (T13Types::contains($prof['Prof'],'Hitch')){
												$thresholds[]=T13Thresholds::tieThreshold('prof','hitch',"Added (probably when it shouldn't have) to indicate the Proficiency {$prof['Prof']} is a Hitch of {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock, null, null, false,null);
											}
											if (T13Types::contains($prof['Prof'],'Monster')){
												$thresholds[]=T13Thresholds::tieThreshold('prof','monster', "Added to indicate the Proficiency {$prof['Prof']} is a Resolved Hitch Monster Proficiency of {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock, null, null, false,null);
											}
											if (T13Types::contains($prof['Prof'],'Resolved')){
												$thresholds[]=T13Thresholds::tieThreshold('prof','resolved', "Added to indicate the Proficiency {$prof['Prof']} is a Resolved Hitch Edge of {$annex['Name']}", $prof_id,$annexid,$groupid,$statblock, null, null, false,null);
											}
										}

									}

									break;
									case 11:
									case 't13':
									$thresholds[]=T13Thresholds::tieThreshold('prof', 'owns', "Added to indicate the Proficiency {$prof['Prof']} is actually a 'Sub-Annex', 'Character', 'Descendant' or similar owned by {$annex['Name']}.", $prof_id,$annexid,$groupid,$statblock, null, null, false,null);

									break;

									default:
									//none
									break;
								}
							}
						}
						error_log('tying thresholds for annexes ='.json_encode($thresholds));
						break;
						case 'remove':
					//this has to sever the threshold that previously tied the Prof and the Annex...
						error_log('ChangeProfAnnex :: Change Removing threshold...');
						$removed=array();
						$thresholds=T13Thresholds::getThreshold(null, array('Root'=>$annexid, 'Target'=>$prof_id), null, null, null, null, 'prof');
						if (!is_null($thresholds)&&is_array($threshold)&&count($thresholds)==1){
							$removed[]=T13Thresholds::untieThreshold($thresholds[0]);
						}
						error_log('Threshold ='.json_encode($thresholds).' removed ='.json_encode($removed));
						break;
						default:
						break;

					}
				}
			}
		}
		return $thresholds;
	}
	static public function createProfAnnex($annex, $data){
		 //expects annex and data of the form of
		error_log('createProfAnnex:'.json_encode(['Annex'=>$annex,'Data'=>$data]));
		$currentUser=get_current_user_id();
		$user = T13Types::displayUser($currentUser);
		$terms=$data['Terms'];
		$thresholds=array();

		//check annexid targets an annex?
		//should be done by T13Types::checkType('Annex', $annexid=0, $elname=0)
		$annexid = $data['post_id'];
		error_log('Setting Stats for annexid ='.$annexid);
		if (isset($annex['Stats'])){
			error_log('Found Stats'.json_encode($annex['Stats']));
			$stats=T13Statblock::getStats($annexid,$annex['Stats']);
			$statblocks = T13Statblock::getStatID($annexid);
		}elseif(isset($annex['Statblock'])){
			error_log('Found Statblock'. json_encode( $annex['Statblock'] ));
			$stats=T13Statblock::getStats($data['post_id'],$annex['Statblock']);
			$statblocks = T13Statblock::getStatID($annexid);
		}else{
			if ($terms['Parent_id']){
				error_log('Found Parent='. $terms['Parent_id']);
				$stats=T13Statblock::getStats($terms['Parent_id']);
				$statblocks = T13Statblock::getStatID($terms['Parent_id']);
			}elseif ($terms['Creator_id']){
				error_log('Found creator=' . $terms['Creator_id']);
				$stats=T13Statblock::getStats($terms['Creator_id']);
				$statblocks = T13Statblock::getStatID($terms['Parent_id']);
			}
		}
		error_log('Found statblocks'. json_encode( $statblocks ));
		if (isset($statblocks)&&is_array($statblocks)&&isset($statblocks[0])){
			$statblock = $statblocks[0];
		}
		if (!T13Types::checkType('Annex', $annexid)){
			error_log("createProfAnnex:: You gotta target an Annex's post id, Dude.");
			return null;
		}
		//okay got an Annex, see if it already exists as a Threshold Annex Group
		$groupid = T13Thresholds::getGroupID($annexid);
		error_log('group id for annex ='.$groupid.' for '.$annexid);
		if (!$groupid||is_null($groupid)){
			//group not found build a group
			$groupid = T13Thresholds::addThisGroup("List Group for Annex: {$annex['Name']}","Annex Group added automatically for Annex:{$annex['Name']} by {$user}",'list', $annexid);
			$thesholds[]=T13Thresholds::tieThreshold('creator', 'owns', "List Group for Annex:{$annex['Name']} created", "This Annex Element created an Annex Group Prof List", $annexid,null,$groupid,$statblock, null,null, false,null);
		}
		$facetsarr=array();
		$costs=array();
		error_log('group id for annex ='.$groupid.' for '.$annexid.' and thresholds...'.json_encode($thresholds));
		//we might need to add the Proficiency if this is an Annex defining Profs in it.

		//does the proficiency exist already and do we actually have all the data we need to make it? if we don't?
		//better get a description ready.


		//proficiencies for the annex and tie them in...
		if (isset($annex['Profs'])){
			$aroot=-1;
			$achan=-1;
			$atang=-1;
			foreach ($annex['Profs'] as $index=>&$prof){
				//this loop checks if the annex has a tangle, a root and a channel if it can't find something it tries to copy something close
				if (isset($prof['ProfInAnnex'])){
					if ($prof['ProfInAnnex']==0){
						//the Root...
						$aroot=$index;

					}
					if ($prof['ProfInAnnex']==1){
						//the Channel...
						$achan=$index;
					}
					if ($prof['ProfInAnnex']==2||$prof['Tangle']){
						//the tangle...
						$atang=$index;
					}
				}
				if ($atang<0&&$aroot>0&&$achan>0){
					// so the tangle isn't set but we have both a root and a channel... set the root to be the tangle.
					$annex['Profs'][]=$annex['Profs'][$aroot]; //copy the root
					$annex['Profs'][$aroot]['ProfInAnnex']=2; //create the tangle
					$annex['Profs'][$aroot]['Tangle']=1;
				}
				if ($atang>0&&$aroot>0&&$achan<0){
					//no channel everything else.
					$annex['Profs'][] = $annex['Profs'][$atang]; //copy the tangle
					$annex['Profs'][$atang]['ProfInAnnex'] = 1; //create the channel
					$annex['Profs'][$atang]['Tangle'] = 0;
				}
				if ($atang>0 && $aroot < 0 && $achan > 0) {
					//no root everything else.
					$annex['Profs'][] = $annex['Profs'][$atang]; //copy the tangle
					$annex['Profs'][$atang]['ProfInAnnex'] = 0; //create the root
					$annex['Profs'][$atang]['Tangle'] = 0;
				}
				if ($atang<0 && $aroot < 0 && $achan > 0) {
					//only channel set (lite)
					$annex['Profs'][] = $annex['Profs'][$achan]; //copy the channel
					$annex['Profs'][$achan]['ProfInAnnex'] = 0; //create the root
					$annex['Profs'][] = $annex['Profs'][$achan]; //copy out the root
					$annex['Profs'][$achan]['ProfInAnnex'] = 2; //create the tangle
					$annex['Profs'][$achan]['Tangle'] = 1;
				}
				if ($atang > 0 && $aroot < 0 && $achan < 0) {
					//only tangle set (lite).
					$annex['Profs'][] = $annex['Profs'][$atang]; //copy the tangle
					$annex['Profs'][$atang]['ProfInAnnex'] = 0; //create the root
					$annex['Profs'][$atang]['Tangle'] = 0;
					$annex['Profs'][] = $annex['Profs'][$atang];
					$annex['Profs'][$atang]['ProfInAnnex'] = 1; //create the channel
					$annex['Profs'][$atang]['Tangle'] = 0;
				}
				if ($atang < 0 && $aroot > 0 && $achan < 0) {
					//only root set (lite).
					$annex['Profs'][] = $annex['Profs'][$aroot]; //copy the root
					$annex['Profs'][$aroot]['ProfInAnnex'] = 1; //create the channel
					$annex['Profs'][$aroot]['Tangle'] = 0;
					$annex['Profs'][] =$annex['Profs'][$aroot];
					$annex['Profs'][$aroot]['ProfInAnnex'] = 2; //create the tangle
					$annex['Profs'][$aroot]['Tangle'] = 1;
				}

			}
			//then add all the stuff.
			$thresholds[] = T13Annexes::changeProfAnnex($annexid, array('Change'=>'Add', 'Profs'=>$annex['Profs'], 'Group'=>$groupid, 'Statblock'=>$statblock, 'Stats'=>$stats));
		}

		error_log('Thresholds = '.json_encode($thresholds));

		// calculate the total boon and cost
		$basecost=0;
		$sway=T13Sway::getSwayForType(T13Types::$annexTypes[$annex['Annex_Type']]['Type']);
		$minCost=$sway['Chi'];
		$basecost = $minCost;
		$facets=array();
		if ($annex['Annex_Type']!=4&&$annex['Annex_Type']!=8){ //super annex or conflict
			$value=0;
			foreach($costs as $cost){
				$value+=$cost['UmbralValue'];
				$basecost+=$cost['Cost'];
			}
			$boonb=T13Boons::getBoonReduced($value);

		}else{
			foreach($costs as $cost){
				$boonb+=$cost['UmbralValue']>0?$cost['NimbedBoon']:0;
			}
		}
		if (isset($annex['ABoon'])){
			if($annex['ABoon']=='%%'){
				$boon=$boonb;
			}elseif(!is_numeric($annex['ABoon'])){
				$boon=$boonb;
			}else{
				$boon=intval($annex['ABoon']);
			}
		}
		//tie the group to the post
		$thresholds[]=T13Thresholds::tieThreshold('annex', 'reads', "{$annex['Name']} access", "This Annex Element owns a copy of an Annex Group 'Prof' List. It may for example be a Skill version of a Super-Power, but we'll see.", $annexid,null,$groupid,$statblock, null, null, false,array('Boon'=>$boon,'Basecost'=>$basecost));
		error_log('Thresholds...'.json_encode($thresholds));
		return array('Thresholds'=>$thresholds,'Basecost'=>$basecost, 'MinCost'=>$minCost, 'Boon'=>$boon,'Facets'=>$facetsarr, 'Value'=>$value, 'Woes'=>-1, 'Hitches'=>0, 'RedHitches'=>0 );
	 }
	 static public function annexContent($name='Apparently Unnamed Annex',$annex='', $data='', $publish=0){
		error_log('annexContent::'.json_encode(['Name'=>$name,'Annex'=>$annex,'data'=>$data,'Publish'=>$publish]));
	/*expects $content.=$annexContent['Content'];
					$terms=$annexContent['Terms'];
					$ret['BaseCost']=$annexContent['Base_Cost'];
					$ret['Prof']=$annexContent['Prof'];
					$ret['MinCost']=$annexContent['Min_Cost'];
					$ret['Boon']=$annexContent['Boon'];
					$ret['Value']=$annexContent['Value'];
					$ret['Hitches']=$annexContent['Hitches'];
					$ret['RedHitches']=$annexContent['RedHitches'];
					$ret['Woes']=$annexContent['Woes']; */
					if ($name=='Apparently Unnamed Annex'){
						if (isset($annex['Name'])){
							$name = $annex['Name'];
						}else{
							error_log('annexContent:: Annexes require names. This one has been unspecified and so fails core conformity.');
							return false;
						}
					}
					if (!isset($annex['Name'])){$annex['Name'] = $name;}
					if (is_null($data['post_id'])){
						error_log('annexContent:: annex requires a post id for core conformity');
						return false;
					}
					$annexid = $data['post_id'];
					if (isset($annex['Annex_Type'])){
						$annexType = $annex['Annex_Type'];
					}
					if (isset($annex['Pact'])){
						$annexType = 5;
					}
					if (isset($annex['Size'])){
						$annexType = 6;
					}
					if (isset($annex['Persona'])){
						$annexType = 7;
					}
					if (isset($annex['Conflict'])){
						$annexType = 8;
					}
					if ($annex['Annex_Type']==-1){
						$profs=$annex['Profs'];
						if (isset($profs[0]['Prof'])){
							$count=count($profs);
							switch($count){
								case '1':
								$annexType=0;
								break;
								case '2':
								$annexType=1;
								break;
								case '3':
								case '4':
								$annexType=2;
								break;

								default:
								$annexType=3;
								break;
							}
						}
					}
					error_log('annexContent:: Annex Type='.$annexType);
		 //  	array('Type'=>'Annex_Root','Description'=>'The Root of an Annex, normally adds Value to its Annex.','AddBoonValue'=>1, 'Short'=>'Root'),//0
			// array('Type'=>'Annex_Channel','Description'=>'The Channel of an Annex, normally adds Value to its Annex.','AddBoonValue'=>1, 'Short'=>'Channel'),//1
			// array('Type'=>'Annex_Tangle', 'Description'=>'The Proficiency stands for the Tangle and displaces either the Root or Channel when selected', 'AddBoonValue'=>1, 'Short'=>'Person'),//2
			// array('Type'=>'Umbral','Description'=>'Adds Value to an Annex, but the Annex will only activate if the User meets the Umbral  and Tangle Costs.','AddBoonValue'=>1, 'Short'=>'Umbral'),//3
			// array('Type'=>'Nimbed','Description'=>'Grants an Annex a specific Focus.','AddBoonValue'=>0, 'Short'=>'Nimbed'),//4
			// array('Type'=>'Extra_Slot', 'Description'=>'Personality and Master-Annexes can store additional Proficiencies in Extra Proficiency Slots. This is one such slot.', 'AddBoonValue'=>0, 'Short'=>'Slot'),//5
			// array('Type'=>'Conflict_Prof', 'Description'=>'Conflict Proficiencies define the sides of the Plot, and of course help define the Embodiments, like Monsters, Tones, Characters, Locations, and so on.', 'AddBoonValue'=>1, 'Short'=>'Conflict'),//6
			// array('Type'=>'Lite_Prof', 'Description'=>'Lite Proficiencies are only used in Lite Annexes. They have a multiplier rather than having multiple different Proficiencies.', 'AddBoonValue'=>0, 'Short'=>'Lite'),//7
			// array('Type'=>'Persona', 'Description'=>'The Proficiency stands for the Persona of a Personality Annex.', 'AddBoonValue'=>1, 'Short'=>'Person'),//8
			// array('Type'=>'Core', 'Description'=>'The Proficiency stands for the Core of a Personality Annex.', 'AddBoonValue'=>1, 'Short'=>'Core'),//9
			// array('Type'=>'Hitch', 'Description'=>'The Proficiency stands for the Hitch of a Personality Annex.', 'AddBoonValue'=>1, 'Short'=>'Hitch'),//10
			 // array('Type'=>'T13', 'Description'=>'The Proficiency stands for another T13 Element, such as another Annex, a Hitch or a pattern like a Descendant or Character.', 'AddBoonValue'=>0, 'Short'=>'T13'),//11
					switch ($annexType){
						case 0:
						case 'Lite':
						if (isset($profs[0]['ProfInAnnex'])&&$profs[0]['ProfInAnnex']==7){
					//if??
							$thresholds=self::createProfAnnex($annex, $data);
							error_log('lite Prof Annex created');
						}
						break;
						case 1:
						case 'Skill':
						$thresholds=self::createProfAnnex($annex, $data);
						error_log('Skill Prof Annex created');
						break;
						case 2:
						case 'Talent':
						$thresholds=self::createProfAnnex($annex, $data);
						error_log('Talent Prof Annex created');
						break;
						case 3:
						case 'Power':
						$thresholds=self::createProfAnnex($annex, $data);
						error_log('Power Prof Annex created');
						break;
						case 4:
						case 'Super-Annex':
						$thresholds=self::createProfAnnex($annex, $data);
						error_log('Super Prof Annex created');
						break;
						case 5:
						case 'Pact':
						$thesholds=self::createPactAnnex($annex,$data);
						error_log('Pact Annex created');

						break;
						case 6:
						case 'Size':
				//$thresholds = self::createSizeAnnex($annex, $data);
						error_log('Size Annex created?');
						break;
						case 7:
						case 'Personality':
						$thesholds=self::createPersonalityAnnex($annex,$data);
						error_log('Personality Annex created');
						break;
						case 5:
						case 'Conflict':
						$thresholds=self::createConflictAnnex($annex,$data);
						error_log('Conflict Annex created');
						break;
					}

		// $profData['Prof_Description']=$description."<small class=\"t13ne-disclaimer\">This Proficiency was created automatically by adding Annex: <a href=\"{$data['URL']}\" data-post-id=\"{$data['post_id']}\">&ldquo;{$annex['Name']}&rdquo;</a>. <br/></small>";
		// $terms['Facet']=$thresholds['Facets'];
		// $profterms['Facet']=$thresholds['Facets'];
		// $profterms['Parent']=$data['post_id'];
		// if ($terms['Parent']!=0){$altText='<div class="t13ne-alt-reference" data-alt="'.$terms['Parent_id'].'"></div>';}else{$altText='';}
		// if ($terms['Creator']!=0){$creatorText='<div class="t13ne-creator-reference" data-creator="'.$terms['Creator_id'].'"></div>';}else{$creatorText='';}
		// $prof_id=T13Elements::addT13Element('Proficiency', $name, $profData, $profterms, $publish);
					$description = '<p>This is an Annex that has not been given a description for some reason. The annex is named (presumably), but for reason nothing was input, or found, for the actual Annex description. As a result you got to see this Text. I&#39;d edit it away if I were you.., soon as you get chance.</p>';
					if (isset($data['Content'])){
			//it may be called content... should probably.
						$description= T13Sanitize::sanitize($data['Content']);
					}
					if (isset($data['Description'])){
			//but I sometimes I went with Description
						$description =T13Sanitize::sanitize($data['Description']);
					}

					$profDesc='Proficiency for the '.$name.' Annex. '.$description."<small class=\"t13ne-disclaimer\">This Proficiency was created automatically by adding Annex: <a href=\"{$data['URL']}\" data-post-id=\"{$data['post_id']}\">&ldquo;{$name}&rdquo;</a>. <br/> </small>";
					$terms['Facet']=$thresholds['Facets'];
					$profterms['Facet']=$thresholds['Facets'];
					$profterms['Parent']=$data['post_id'];
					if ($terms['Parent']!=0){$altText='<div class="t13ne-alt-reference" data-alt="'.$terms['Parent_id'].'"></div>';}else{$altText='';}
					if ($terms['Creator']!=0){$creatorText='<div class="t13ne-creator-reference" data-creator="'.$terms['Creator_id'].'"></div>';}else{$creatorText='';}
					$prof_id = T13Proficiencies::tryAddingProf($name, false, $profDesc, $profterms);
		//$prof_id=T13Elements::addT13Element('Proficiency', $name, $profData, $profterms, $publish);
					if (isset($thresholds['Content'])){
			//there's content in the thresholds... might want to display that could be important.
						$description.=T13Sanitize::sanitize($thresholds['Content']);
					}
					$content=$data['Terms']['Geo']['GeoText'].$description.$altText.$creatorText;

					return array('Content'=>$content, 'Base_Cost'=>$thresholds['Basecost'], 'Min_Cost'=>$thresholds['MinCost'], 'Prof'=>$prof_id, 'Terms'=>$terms, 'Value'=>$thresholds['Value'], 'Boon'=>$thresholds['Boon'], 'Hitches'=>$thresholds['Hitches'], 'RedHitches'=>$thresholds['RedHitches'], 'Woes'=>$thresholds['Woes']);
				}

				static public function installAnnexes(){
					if ( ! function_exists( 'post_exists' ) ) {
		//if posts exists doesn't load it.
						require_once( ABSPATH . 'wp-admin/includes/post.php' );
					}
					self::$installed=0;
					$c=count(self::$coreAnnexes);

					$installed=array('annex'=>0, 'of'=>$c, 'install'=>0);
					foreach(self::$coreAnnexes as $core){
						if (isset($core['Specify'])){
							$name= $core['Name'].' (Specify)';
						}else{
							$name=$core['Name'];
						}
						$name=T13Sanitize::sanitize($name);
						if ($name==''){$name='Error Unnamed Annex';}
						if (post_exists($name)){
							$installed['annex']='Already installed "'.$name.'" ...Skipping ';
							$installed['install']++;
						}else{
							$installed['annex']=$name;
							$installed['debug']=json_encode(self::installAnnex($installed['install'])).'  \n\r';
							$installed['install']++;
							return $installed;
						}

					}
					return $installed;
				}
				static public function annexName($name,$profs){
		//"{$coreA['Profs'][0]['Facet']} to {$coreA['Profs'][1]['Facet']} Annex",
					foreach($profs as $prof){
						if ($prof['ProfInAnnex']==0){$root = $prof['Facet'];}
						if ($prof['ProfInAnnex']==1){$channel = $prof['Facet'];}
						if ($prof['ProfInAnnex']==2||$prof['Tangle']){$tangle = $prof['Facet'];}
					}
					if (isset($tangle)){
			//we have a tangle
						if (!isset($root)){$root = $tangle;}
						if (!isset($channel)){$channel = $tangle;}
					}else{
						if (isset($root)&&isset($channel)){$tangle = $root;}
					}
					return array($name, "A {$root} to {$channel} tangled with {$tangle} Annex", "{$name} Annex");
				}
				static public function installAnnex($i){
					if (count(self::$coreAnnexes)>$i){

						$coreA=self::$coreAnnexes[$i];

						if (isset($coreA['Specify'])&&$coreA['Specify']){
							$name= $coreA['Name'].' (Specify)';
						}else{
							$name=$coreA['Name'];
							$coreA['Specify']=false;
						}
						$name=self::annexName($name,$coreA['Profs']);
						$terms=array();
						$terms['Facet'] = array($coreA['Profs'][0]['Facet'], $coreA['Profs'][1]['Facet']);
						$terms['Genre'] = 'T13 Core';
						$terms['Scope'] = 'Omniversal';
						$terms['Era']   = 'Timeless';

			//$name,$atype=-1,$profs,$description, $boon, $statblock, $facet,$genres,$eras, $scope, $publish=false, $alt=0, $creator=0
						$post_id=T13Elements::addT13Element('Annex',$name,$coreA, $terms, true, true);
						error_log('install annex ('.$i.' post id = '.json_encode(['post_id'=>$post_id]));
					}
					return $post_id;
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

		}
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
 * Fired during plugin activation. Plots
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Plots{
	//ploys come in lots of different sizes so we may need to extend this class for that... we'll see what we can cram in here...
	public static $plotRanks = array(
	array('Rank'=>'Scene','Description'=>'Scenes are the rank and file of the Plot army. They examine a single aspect of a Conflict. Scenes can be called Tracts when they are a part of a larger Story.', 'Example'=>'Our Hero meets our Villain for the first time.', 'Conflicts'=>'1 (Simple-Complete)', 'Suggested_Number_of_Embodiments_per_Facet'=>1,'Scope'=>'Focused — May focus on a single, or select few, Characters or Locations. Several Locations / Stages may be passed through during a Scene.','Maximum_Plot_Hand_Size'=>26, 'Minimum_Plot_Hand_Size'=>5), //0 'Max_Location'=>'InterStellar Empire''Target_Yarn_Limit'=>27
	array('Rank'=>'Act','Description'=>'Acts are the NCOs of the plot Army. They marshal Scenes into the Frame, Loom, Zenith structure.', 'Example'=>'Everything up to the first ad break is usually the Frame Act of a TV show.', 'Conflicts'=>'1 (Simple-Complex)', 'Suggested_Number_of_Embodiments_per_Facet'=>1,'Scope'=>'Limited — Usually focuses on at least a third of the available Locations and Characters of a Tale, without visiting or referencing all available Locations or Characters','Maximum_Plot_Hand_Size'=>26, 'Minimum_Plot_Hand_Size'=>6), //1 'Target_Yarn_Limit'=>29,'Max_Location'=>'Galactic Cluster'
	array('Rank'=>'Story','Description'=>'Stories examine a single Conflict usually no more complicated than Complex, and most often Simple to Complete. Stories are usually self contained, and do not relate to other larger Plots. This gives a Story a little more lee-way to create larger Locations than a Chapter usually can. Use Chapter instead if the Story is part of a larger Narrative.', 'Example'=>'Short Stories, Pilot Episodes of TV shows, Short plays or films, or One-Off adventures are all Stories.', 'Conflicts'=>'1 (Simple-Complete)', 'Suggested_Number_of_Embodiments_per_Facet'=>1,'Scope'=>'Closed — A Story\'s Scope is usually limited to a Specific Location (although usually large such as a Town, City, or even a Galaxy) and certain set of Characters. Characters and Locations from beyond the Story may be referenced, but are generally not required by the Story/','Maximum_Plot_Hand_Size'=>26, 'Minimum_Plot_Hand_Size'=>7),//2, 'Target_Yarn_Limit'=>32,'Max_Location'=>'Local Multiverse'
	array('Rank'=>'Chapter','Description'=>'Chapters usually examine a single Simple to Complete Conflict between multiple Sides, although multiple Simple Conflicts may occur during the Chapter instead. Chapters may also act as Tracts of a Volume, or Acts of an Arc.', 'Example'=>'Chapters of books, Episodes of TV shows, and individual comic-books are all Chapters.', 'Conflicts'=>'1-2 (Simple-Complete)', 'Suggested_Number_of_Embodiments_per_Facet'=>2,'Scope'=>'Open — A Chapter has a much larger Scope than a Story generally, although it is usually more focused (examining aspects of the larger Volume Conflict), they draw Characters and Locations from across the whole Volume (and may reference the Epic or Cycle).','Maximum_Plot_Hand_Size'=>26, 'Minimum_Plot_Hand_Size'=>8), //3, 'Target_Yarn_Limit'=>30,'Max_Location'=>'Known Space'
	array('Rank'=>'Arc','Description'=>'Arcs examine two or more Simple Conflicts, or one Complex Conflict, usually at least one Sub-Plot extends a Story. Arcs can be Scenes (Tracts) of an Epic Demon&#39;s, or Acts of a Volume.', 'Example'=>'Arcs are a Novella, Two-part Special, Play or Movie in complexity.', 'Conflicts'=>'1-2 (Simple-Complex)','Suggested_Number_of_Embodiments_per_Facet'=>4,'Scope'=>'Limited — An Arc utilises a limited selection of Characters and Locations from a Volume or larger, but generally has more than a Story due to the greater complexity.','Average_Plot_Hand_Size'=>37, 'Minimum_Plot_Hand_Size'=>9), //4, 'Target_Yarn_Limit'=>31, 'Max_Location'=>'Whole Universe'
	array('Rank'=>'Volume','Description'=>'A Narrative of many interwoven Stories and Arcs that can be told to a satisfying conclusion. Volumes may be an Act of an Epic, but are just a Scene (or Tract) within a Cycle.', 'Example'=>'Volumes represents a complete Novel, or a Season/Series of a TV show, or a whole roleplaying game campaign.', 'Conflicts'=>'3-6 (Simple-Exceptional)', 'Suggested_Number_of_Embodiments_per_Facet'=>8,'Scope'=>'Partial — A Volume can access almost all Characters and Locations of an Epic or Cycle, but generally favours a part or only some Characters.','Maximum_Plot_Hand_Size'=>50, 'Minimum_Plot_Hand_Size'=>10),//5 , 'Target_Yarn_Limit'=>32, 'Max_Location'=>'Local Multiverse'
	array('Rank'=>'Epic','Description'=>'Epics represent a full and complete work.  Epics can also be thought of as Acts of a Cycle.', 'Example'=>'A complete Franchise Canon. Several Volumes are gathered together into a Trilogy (or series of books or movies). In TV terms Epics are all the Seasons of a TV show, but not necessarily the reboot or movies. Large sprawling RPG campaigns can be Epics too, but more normally this would be all the collected Modules of a game series that you own, like D&D\'s Dark Sun, Greyhawk, Forgotten Realms, Dragonlance or your home-brew world.', 'Conflicts'=>'1-18 (Simple-Exceptional)','Suggested_Number_of_Embodiments_per_Facet'=>16,'Scope'=>'Complete — The Epic references all Characters and Locations (but not necessarily all Eras or Alternates).','Maximum_Plot_Hand_Size'=>50, 'Minimum_Plot_Hand_Size'=>17), //6, 'Target_Yarn_Limit'=>33, 'Max_Location'=>'Local Omniverse'
	array('Rank'=>'Cycle','Description'=>'The summation of everything smaller than themselves, they hold together whole imaginary multiverses, containing potentially billions of Characters, Locations and individual Stories. ', 'Example'=>'Cycles bind whole book series, plus all the unpublished background material, encyclopaedia entries and the fan-fiction together. Cycles form the entirety of the DC and Marvel franchises, comic-books, TV shows, Movies and the games played by costumed kids. All the Stories, Novels, Movies, and TV shows that touch on the Cthulhu Mythos, or Greek Mythology, or Vampire lore could all be within a Cycle. In RPG terms the Cycle is represented by Source Books, all the Campaigns, modules, adventures, movies and novellas that a game may have spawned across all editions, plus every game ever played there by any gaming group, including the home-brewed spin-off versions.', 'Conflicts'=>'8-48 (Simple-Exceptional)','Suggested_Number_of_Embodiments_per_Facet'=>32,'Scope'=>'Exhaustive — Over the course of a Cycle every Character, Alternate, Era, Location and well everything is referenced.','Maximum_Plot_Hand_Size'=>52, 'Minimum_Plot_Hand_Size'=>21)//7, 'Target_Yarn_Limit'=>34, 'Max_Location'=>'Omniverse'
	);

	private static $corePlots = array(
		array('Name'=>'Terminal Thirteen Omniverse', 'Description'=>'<p>The Terminal Thirteen Omniverse supports the entire game. Every story, and every other Cycle is supported by the Terminal Thirteen Cycle. Within the confines of the Terminal Thirteen Omniverse everything is possible. Robed wizards can fireball giant mecha, cyborg ninjas can flit through the shadows of dinosaurs, and dragons can destroy cathedrals while jet fighters scramble to defend them. The Omniverse is built on a huge temporal paradox, created as the final actions of the Paradox War, with a time-line protected by several groups and organizations, operating from many different temporal periods.</p><p>As such, the Omniverse can explore every imaginable Conflict. If you really need to run a story where mages, werewolves and cyborgs team up to fight an invasion of intelligent cheeses, that\'s possible in T13.</p><p>In some ways Terminal Thirteen is our <em>real</em> universe, as long as you accept that in our universe, every Fortean event, every true-life ghost story, UFO abduction, or Conspiracy Theory, is <em>in some sense</em> true. In actual fact, our world is probably a realistic quantum alternate of T13, but those Fortean events occasionally leak through, at least for some people.</p><p>You can adventure in any Era of the Terminal Thirteen Universe, from Antediluvian era of the Atlantis Myth (Hyperborea, Cymmeria as well as advanced Technology, and so on, is optional), through the Mythic Age (whether you see the Greek gods as divine beings, advanced aliens, or the Nephilim Cradle caretakers of civilization) to the Iron Age (and the F&aelig;rwars), Medieval and Modern History (largely as written, less a few Immortals, Nephilim, Time-Travellers, Extra-dimensional beings, and Faery remnants). After the modern world, we have a number of Science-Fiction options that involve Cyberpunk / Transhuman / Singularity-spiced dystopias or utopias, early and slow space exploration (with new, emergent human and AI sub-species), later we have rapid space exploration and exploitation (and splintering off of human species), and off into a future of ancient intergalactic trade routes and warfare.</p><p>Because of this broad background (and some of the other Cycles that touch on it) you usually don\'t need to build your own Cycle to play your game idea. Most game concepts fit somewhere in the T13 Cycle as Epics that define their own local multiverse.', 'PlotRank'=>7, 'ActType'=>5, 'SceneType'=>0, 'PlotType'=>0, 'Conflict'=>array("NoSides"=>7, "Size"=>24,
				"Sides"=>array(
					"Dominant"=>[
						"Expressions"=>['The Dinosaiveans', 'The Temporal Accords','Council of M&ouml;bius','Time Patrol','Terran Trade Federation'],
						"Facets"=>[21,16,22,23, 0, 9, 5, 6, 7, 8,10,11,12,13,14,15,17,18,19,20, 4, 2, 3, 1]],
					"Pressed"=>[
						"Expressions"=>['The Paradox Warrriors','Paradox Protection Agency','Eusaivean Brass','Cyberwraiths','The Nihonese Empire'],
						"Facets"=>[20,13, 8,17, 4, 2, 5, 6, 7, 9,10,11,12,19,14,15,16,18,21,22,23, 4, 3, 1]],
					"Above"=>[
						"Expressions"=>["Wyrd","Dai-Nubathor","The Prime Anomaly",'Omniverse Protectorate','The Parliament of Time','Norridi','The Court of Eternity','The Empress of Hyperspace'],
						"Facets"=>[ 7, 4,14, 3, 6, 8, 9,10,11,12,13,15,16,17,18,19,20,21,22,23, 2, 1, 5, 0]],
					"Internal"=>[
						"Expressions"=>['Rebel Eusaiveans','Rogue Eusaiveans','The Rebels','Nephilim Cradle','Project Bootstrap','Project Nephilim','Eelafin','Faery Remnants','The Followers of Teucoi','All-Walkers'],
						"Facets"=>[ 6,10,12,20, 4, 5, 7, 8, 9,11,13,14,15,16,17,18,19,21,22,23, 0, 1, 2, 3]],
					"Below"=>[
						"Expressions"=>['Normal People','The Citizens of the Omniverse','Chronomasters','Temporal Adjustment Bureau'],
						"Facets"=>[ 0, 2, 3, 4,22,18,21, 1, 5, 6, 7, 8, 9,10,11,12,13,14,16,17,15,19,20,23]],
					"External"=>[
						"Expressions"=>['The Lords Temporal', 'Vorgue Industrial Corporate', 'Special Committee for Aoristic Management','Time-Travellers', 'Ireeeans'],
						"Facets"=>[14,19,20,21,22,13, 3, 4, 0, 1, 5,23,15,16,17,18,11, 2, 6, 7, 8, 9,10,12]],
					"Shadows"=>[
						"Expressions"=>['Blakk','Patron D&aelig;mon of Dominion','The Codex Regius Universe','Psibertek','Blakk\'s Apple','The Kirk of Death','Mot','Patron D&aelig;mon of Nature(Death)'],
						"Facets"=>[ 3,10,12, 6, 7, 8,17,18,22, 9,14,15,19,20,21, 5,13,11, 2, 0, 1, 2, 4, 16]]),
				"Statblock"=>"13:26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26:47=13",
				'Titles'=>array('The Paradox War'=>array(
					"NoSides"=>5,
					 "Sides"=>array(
						'Dominant'=>[
							"Expressions"=>['The Bulm&auml;s','Eusaiveans','Norridi'],
							"Facets"=>[21,23,16,0,9,5,6,7,8,10,11,12,13,14,15,17,18,19,20]
						],
						'Pressed'=>[
							'Expressions'=>['Desi','Teucoi','Garner'],
							"Facets"=>[11,13,8,17,4,5,6,7,9,10,12,19,14,15,16,18,21,2,22]
						],
						"Above"=>[
							"Expressions"=>["Wyrd","Dai-Nubathor"],
							"Facets"=>[7,4,14,3,6,8,9,10,11,12,13,15,16,17,18,19,20,21,22]
						],
						"Internal"=>[
							"Expressions"=>['Rebel Eusaiveans','Rogue Eusaiveans','Nephilim Cradle','The Fae','Yuan Wang'],
							"Facets"=>[6,10,12,20,4,5,7,8,9,11,13,14,15,16,17,18,19,21,22,23]
						],
						"External"=>[
							"Expressions"=>['Blakk','Dai-Nubathor','Wyrd','Gravitational Anomalies'],
							"Facets"=>[3,23,11,2,6,7,8,9,10,12,14,15,16,17,18,19,20,21,22,13]
						],
					),
					"Titles"=>['An0ma1y','First Shadow','Cu1ture B0mb','Second Shadow','Chronoclysm'],
					"Statblock"=>"13:25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25:13=28",
				)
				 ) ),
	'Yarn_Events'=>array('Deck'=>array(52,21,47,41,34,20,28,37,35,49,13,39,29,36,51,12,16,50,44,0,3,47,48,18,31,22,27,31,50,21,14,29,53,34,9,35,3,42,19,23,9,19,27,17,30,46,4,0,49,11,38,26,13,25,25,17,10,33,26,51,32,2,48,24,32,45,11,46,41,8,43,45,10,1,2,28,40,23,36,14,44,5,1,22,24,18,6,16,5,20,53,12,39,6,37,8,4,38,15,33,7,42,30,43,15,52,7,40),'Spreads'=>array('Cycle')),
			'Genre'=>'T13 Core','Suggested_Number_of_Embodiments_per_Facet'=>1,'Scope'=>'Omniversal',
			'Era'=>'Timeless',
			'Facets'=>array('Awe','Burden','Craft','Dominion','Enigma','Fury','Gossamer','Heresy','Inertia','Jeer','Key','Liberty','Miasma','Nature','Orthodox','Phoenix','Quiet','Rook','Sin','Trial','Virtue','Wyrd','Yonder','Zeal'),
			'Subplots'=>array('Epics'=>array(),'Volumes'=>array(), 'Arcs'=>array(),'Stories'=>array()),
			'Hooked_Characters'=>array(),
			'Plot_Characters'=>array(),
			'Descendants'=>array(),
			'Annexes'=>array(),
			'Proficiencies'=>array()
		)
	);
	static public function displayYarnEvents($yarndata=[],$hand=5, $conflict=[]){
		$ret='<section class="t13ne-yarn-events">';
		$carddata=array();
		if (isset($yarndata['Deck'])&&isset($yarndata['Spreads'])){
			T13Cards::$deck=$yarndata['Deck'];
			foreach ($yarndata['Spreads'] as $spread){
				$carddata[]=T13Cards::dealspread($spread,false, $hand,$conflict['NoSides']);
			}
		}else{

			$carddata[]='Well something went wrong here. : '.json_encode($yarndata);
		}
		$ret.=join('<!--join Yarn Events//-->',$carddata);
		return $ret.'</section>';
	}
	static public function displayConflict($conflict, $terms){
		$conf=json_encode($conflict);
		$ret='<!-- conflict='.$conf.' //-->';
		$ret.='<section class="t13ne-conflict"><h3>Conflict</h3><strong>Number of Sides:</strong> '.$conflict['NoSides'];
		$boonValues=array();
		$value=0;
		$conflictFacets=0;
		foreach($conflict['Sides'] as $side=>$data){
			$css=strtolower($side);
			$boos=array();
			$value=0;
			$ret.="<div class=\"t13ne-{$css}-facets\" data-{$side}=\"".json_encode($data['Facets'])."\"><h4>{$side} Side</h4><h5>Named Entities (Characters and Pacts) </h5><ul class=\"t13ne-conflict-expressions\">";
			if (isset($data['Expressions'])){
				foreach($data['Expressions'] as $an=>$charent){
					$ret.="<li>{$charent}</li>";
				}
			}else{
				$ret.="This should be data ".json_encode($data)." from {$side} of ".json_encode($conflict['Sides']);
			}


			$ret.="</ul><h5>{$side} Facets</h5><details><summary></summary><ul class=\"t13ne-facet-list\" style=\"display:inline-block;\">";
			foreach($data['Facets'] as $i=>$d){
				$ret.="<li class=\"t13ne-{$css}-facet\"  >[t13ne type=\"facet\" facet={$d} mode=\"jscript\" /]</li>";
				$boo=T13Statblock::getBoonForFacet($d,0, $conflict['Statblock']);
				$boos[]=$boo;

				$conflictFacets++;
			}
			foreach($boos as $b){
				$value+=T13Boons::getBoonValue($b['Scale']+$b['Boon']);
			}
			$boos=T13Boons::getBoonReduced($value);
			$boonValues[]=$value;
			$boonText=T13Boons::writeFullBoon($boos, true);
			$ret.="</ul></details><p class=\"t13ne-annex\"><strong>{$side} Annex</strong> —{$boonText} </p></div>";

		}
		if (isset($conflict['Titles'])){

			$scr='conflict'.md5($conf);
			$ret.='<h3>Suggested Titles</h3><script>var '.$scr.'='.$conf.'</script><ul>';
			unset ($conf);
			foreach($conflict['Titles'] as $num=>$title){
				if (is_string($title)){
					$ret.="<li><a onclick=\"buildStory({$title},{$scr})\" class=\"t13ne-create-subplot\">{$title}</a></li>";
				}else{
					$ret.='<li>'.$num;
					$subcon=self::displayConflict($title,$terms);
					$ret.=$subcon['Text'];
					$ret.='</li>';
				}

			}
			$ret.="</ul>";
		}

		$value=0;
		foreach($boonValues as $v){
			$value+=$v;
		}
		$boon=T13Boons::getBoonReduced($value);
		$boonText=T13Boons::writeFullBoon($boon, true);
		$ret.="<p class=\"t13ne-conflict-boon\"><strong>Conflict Total</strong> — {$boonText}</p>";
		if (isset($conflict['StatHTML'])){
			$statSC=$conflict['StatHTML'];
		}else{
			if (isset($conflict['Statblock'])){
				$stats=T13Statblock::getStats($terms['post_id'],$conflict['Statblock'],true);
				$conflict['Scale']=$stats['Scale'];
				//$statText=T13Statblock::writeStatblock($stats);
				$statSC=T13Statblock::writeStatblockSC($terms['post_id']);
			}else{
				if (isset($terms['Terms']['Parent'])){
					$stats=T13Statblock::getStats($terms['Terms']['Parent_id'],0, true);
					//$statText=T13Statblock::writeStatblock($stats);
					$statSC=T13Statblock::writeStatblockSC($terms['Terms']['Parent_id']);
				}
			}
		}
		$ret.=$statSC;
		return array('Text'=>$ret.'</section>', 'ConflictBoon'=>intval($boon), 'ConflictFacets'=>$conflictFacets, 'Conflict'=>$conflict);
	}
	static public function displayPlots($author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any', $scope='any', $parent='any'){
		return T13Elements::getT13Elements('Plot', $author,$geo,$tags,$facet,$genre,$era, $scope, $parent);
    }
	static public function displayPlot($plot){
	//var_dump($plot);
	//shortcode ploticap display...
	if ( ! function_exists( 'wp_get_recent_posts' ) ) {
		//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-includes/post.php' );
		}
	if (is_numeric($plot)){
		//probably an id
		$plotObj = get_post($plot );
		$faceterm = wp_get_post_terms($plot, 'facet');
	}elseif (is_string($plot)&&$plot!='#'){
		//based on the name
		$plotObj=get_page_by_title( $plot, 'Object', 'element' );
		$faceterm = wp_get_post_terms($plotObj->ID);
	}elseif ($plot=='#'){
		//, 'tax_query'=>array(array('taxonomy' => 't13type',      		'field' => 'name',       		'terms' => 'Plot',       		'operator'=>'IN'))
		$ploti = wp_get_recent_posts(array('post_type'=>'element', 'numberposts'=>'1'), 'Object');
		//var_dump($ploti);
		$plotObj = $ploti[0];
		$faceterm = wp_get_post_terms($plotObj->ID);
	}
	foreach (T13Facets::$facets as $f){
		if (strtolower($f['FacetInitial'])==$faceterm->slug){
			$facet=$f;
			break;
		}
	}
	$displayFacet=T13Facets::writeFacet($facet,'fancy');
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
			if (!is_wp_error($plotObj)){
				$rethtml='<div class="t13ne-plot"><strong class="t13ne-plottitle">Plot: </strong><details><summary>';
				$rethtml.=' <span class="t13ne-title"> <q>'.$plotObj->post_title.'</q> </span>';
				$rethtml.='</summary>';

				$content=$plotObj->post_content;
				$rethtml.='<div class="t13ne-postdata">'.$content.'</div>';
				$rethtml.='<p class="t13ne-postdata"<span class="t13ne-date">Posted : '.$plotObj->post_date.' .</span> <span class="t13ne-author"> Created by: '.get_user_by('id', $plotObj->post_author).'</span></p></details></div>';
				return $rethtml;
			}else{
				return json_encode($plotObj);
			}
    }
	 static public function plotContent($name, $plotdata, $terms, $publish){
		$mincost=0;
		$basecost=0;
		$content='';
		if (isset($plotdata['PlotRank'])){
			$rankText="[t13ne type=\"select\" select=\"plotrank\" selected=\"{$plotdata['PlotRank']}\" /]";
		}
		if (isset($plotdata['PlotType'])){
			$TypeText="[t13ne type=\"select\" select=\"plottype\" selected=\"{$plotdata['PlotType']}\" /]";
		}
		if (isset($plotdata['ActType'])){
			$ActText="[t13ne type=\"select\" select=\"acttype\" selected=\"{$plotdata['ActType']}\" /]";
		}
		if (isset($plotdata['SceneType'])){
			$SceneText="[t13ne type=\"select\" select=\"scenetype\" selected=\"{$plotdata['SceneType']}\" /]";
		}

			//$conflict=self::displayConflict(T13Cards::buildConflict(24,$terms['post_id']), $terms);
			$conflict=self::displayConflict($plotdata['Conflict'],$terms);

		if (isset($plotdata['Yarn_Events'])&&isset($conflict)){
			$yarnText=self::displayYarnEvents($plotdata['Yarn_Events'], T13Boons::getBoonDraw($conflict['ConflictBoon']), $conflict['Conflict']);

		}
		if (isset($plotdata['Description'])){$description=$plotdata['Description'];}else{$description='This plot seems to have er.. lost the plot...';}
		$content=$terms['Terms']['Geo']['GeoText'].$description.$rankText.$TypeText.$ActText.$SceneText.$conflict['Text'].$yarnText;
		return array('Terms'=>$terms, 'Content'=>$content, 'Base_Cost'=>$basecost, 'Min_Cost'=>$mincost);
	 }

    static public function installPlots(){
	if ( ! function_exists( 'post_exists' ) ) {
		//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		$c=count(self::$corePlots);
		$installed=array('plot'=>0, 'of'=>$c, 'install'=>0);

	foreach(self::$corePlots as $core){
			if (isset($core['Specify'])){
				if ($core['Specify']){
					$name= $core['Name'].' (Specify)';
				}else{
					$name=$core['Name'];
				}
			}else{
				$name=$core['Name'];
			}
			$name=T13Sanitize::sanitize($name);
		if (post_exists($name)){
				$installed['install']++;
				$installed['desc']=$name;
				$installed['debug']=' '.$name.' post exists already \n\r';
		}else{
			$installed['plot']=$name;
			$installed['install']+=self::installPlot($installed['install'],$name);
			$installed['debug']=json_encode(($installed['install']));
			return $installed;
		}
	}
		return $installed;
    }
	static public function installPlot($install,$name){
		if (count(self::$corePlots)>$install){
			$coreP=self::$corePlots[$install];

			$terms=array('Facet'=>$coreP['Facets'], 'Genre'=>$coreP['Genre'],'Suggested_Number_of_Embodiments_per_Facet'=>1,'Scope'=>$coreP['Scope'],'Era'=>$coreP['Era']);
			$post_id_array=T13Elements::addT13Element('Plot', $name, $coreP, $terms, true,0 );
			//self::addHitch( $name, $coreP['Description'], $f_id, $g_id, $e_id, $s_id, true );
			return 1;
		}
	}
}

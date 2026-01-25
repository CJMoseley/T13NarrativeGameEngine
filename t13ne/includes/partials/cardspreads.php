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
 * Fired during plugin activation. Boons
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 *
 */
class T13Cardspreads{
    public static $conflictSpreads = array (
		array('Type'=>'Simple', 'Alternate'=>'Conflict(2x2)','Max_Facets'=>2, 'Array'=>[['card', 'card'],['card','card']], 'Description'=>'The Simplest of Conflict spreads, limited in what it can display. Ideal for simple stories. There are limited Facets involved and that makes these ideal for short stories and especially the early sub-Plots of a larger Conflict / Plot', 'Sides'=>'Dominant, Pressed, Above, DeeperShadows'),
		array('Type'=>'Internalised', 'Alternate'=>'Conflict(3x3)','Max_Facets'=>4, 'Array'=>[['card', 'card', 'card'],['card','card', 'card'], ['card','card','card']], 'Description'=>'The ideal size for smaller stories with multiple sides and medium complexity. Internalised Conflicts have at least one side have some internal strife (often the Dominant or Pressed side).', 'Sides'=>'Dominant, Pressed, Above, Internal,  Shadows, DeeperShadows'),
		array('Type'=>'Balanced', 'Alternate'=>'Conflict(4x4)','Max_Facets'=>8, 'Array'=>[['card', 'card','card','card'],['card', 'card','card','card'],['card', 'card','card','card'],['card', 'card','card','card']], 'Description'=>'The ideal complexity of plot for most on going Story Arcs (up to Volume Size), allows for a good number of differing Characters.', 'Sides'=>'Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows'),
		array('Type'=>'Complete', 'Alternate'=>'Conflict(5x5)','Max_Facets'=>12, 'Array'=>[['card', 'card','card','card', 'card'],['card', 'card','card','card', 'card'],['card', 'card','card','card', 'card'],['card', 'card','card','card', 'card'],['card', 'card','card','card', 'card']], 'Description'=>'Most Conflicts don\'t require more detail than a Complete Conflict. The Sides will have plenty of Embodiments and they can interact in complex ways as there will often be Shared Facets on multiple sides, that suggests interactions and Tensions.' , 'Sides'=>'Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows'),
		array('Type'=>'Complex', 'Alternate'=>'Conflict(6x6)','Max_Facets'=>18, 'Array'=>[['card', 'card','card','card', 'card', 'card'],['card', 'card','card','card', 'card', 'card'],['card', 'card','card','card', 'card', 'card'],['card', 'card','card','card', 'card', 'card'],['card', 'card','card','card', 'card', 'card'],['card', 'card','card','card', 'card', 'card'],], 'Description'=>'A more complex spread, intended for vary large Complex plots, usually with lots of twists and turns in the narrative as Characters change Sides and Alliances throughout the Tale.', 'Sides'=>'Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows'),
		array('Type'=>'Exceptional', 'Alternate'=>'Conflict(7x7)','Max_Facets'=>24, 'Array'=>[['card', 'card','card','card', 'card', 'card','card'],['card', 'card','card','card', 'card', 'card','card'],['card', 'card','card','card', 'card', 'card','card'],['card', 'card','card','card', 'card', 'card','card'],['card', 'card','card','card', 'card', 'card','card'],['card', 'card','card','card', 'card', 'card','card'],['card', 'card','card','card', 'card', 'card','card'],], 'Description'=>'An Exceptionally complex Plot usually reserved for the largest and most complex Plots, although you may get good usage of Exceptional Conflicts in Political Volumes, which rely on Complex interactions between the Sides.', 'Sides'=>'Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows'),


	);
	public static $sceneSpreads =array(
		array('Type'=>'Random','Description'=>'The most basic, random definition of a Scene, mostly just an excuse of an event, often unplanned improvising by a "Pantser" Yarn-Teller. Consists of two cards, a Scene Beat Type and a Scene Significator. Depending on the created Beat Type other cards will usually be required.', 'Array'=>[['sceneBeatType','Single'], ['Significator["Scene"]','Single']]),
		array('Type'=>'Hook','Description'=>'Hooks are how Stories get Characters involved in themselves. This usually takes place during the Frame (although you can be in one Story\'s Frame during another Stories Zenith). Consists of three cards, a Scene Significator, a Hook which describes the Hook event, and the Hook Aspect, which defines the aspect of the Character that the Story is attempting to Hook.', 'Array'=>[['Significator["Scene"]','Single'], ['Hook','Single'], ['Hook_Aspect','Single']] ),
		array('Type'=>'Gain','Description'=>'The Character makes a Gain, although what exactly the Gain is will be defined by the Gain card. Consists of two cards, a Scene Significator, and a Gain card.', 'Array'=>[['Significator["Scene"]','Single'], ['Gain','Single']]),
		array('Type'=>'Revelations','Description'=>'The Character finds out some information about the some aspect of the Story. Revelations vary in number of cards from 3 (or more normally 4) to 7, as some are optional', 'Array'=>[['Significator["Scene"]','Single'], ['About','Single'],['Vector','Single'],['Info','Optional'],['Alternate','Optional'],['Details','Optional'],['Details','Optional']]),
		array('Type'=>'Test','Description'=>'The Test is a trial of a Character. Usually the Test is based on one of the Facets of the Conflict. The Difficulty is usually set by the Yarn-Teller or Referee, based on what ever needs be accomplished or purchased. Consists of two cards, a Scene Significator, and a Gain card.', 'Array'=>[['Significator["Scene"]','Single'], ['Gain','Single']]),
	);

	//array(array(array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect')),array(array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect'),array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect')),array(array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect'),array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect'),array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect')),array(array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect'),array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect'),array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect'),array('self::$yarn','Hook'), array('self::$yarn','Hook_Aspect')))
	public static $narrativeSpreads =array(
		array('Type'=>'None', 'Positions'=>array(array(NULL)), 'Note'=>'This Event does not require cards.'),

		array('Type'=>'Scene', 'Positions'=>array(
			array('self::$yarn','Beat_Type', 'Single')), 'Note'=>'This single card defines the rest of the spread.'),
		array('Type'=>'Gain', 'Positions'=>array(
			array('self::$yarn','Gain', 'Single')), 'Note'=>'Character makes a gain.'),
		array('Type'=>'Revelation', 'Positions'=>array(
			array('self::$revelations','About','Single'),
			array('self::$revelations','Info','Optional'),
			array('self::$revelations','Alternate','Optional'),
			array('self::$revelations','Vector','Single'),
			array('self::$revelations','Details','Optional')),
			'Note'=>'Revelations reveal something about the world, the conflict, a character, or the plot.'),
		array('Type'=>'Ordeal', 'Positions'=>array(
			array('self::$ordeals', 'Stakes', 'Single'),
			array('self::$ordeals', 'Test', 'Optional'),
			array('self::$ordeals', 'Suggested_Action', 'Optional'),
			array('self::$ordeals', 'Stages', 'Optional'),
			array('self::$ordeals', 'Obstacles', 'Single'),
			array('self::$ordeals', 'Ordeal_Spread', 'Single'),
			array('self::$ordeals', 'Motional', 'Single'),
		), 'Note'=>'Ordeals vary in size considerably from single stage Tests through to Motionals with Multiple Stages, Obstacles and Fights.' ),
		array('Type'=>'Obstacle',
			'Positions'=>array(
				array('self::$obstacles','Type','Single'),
				array('self::$cards','Pips','ObstacleDifficulty'),
			), 'Note'=>'Obstacles have a Type and a Difficulty (which can be set between 2 and 45).'),
		 array('Type'=>'Stage', 'Positions'=>array(
			array('self::$ordeals','Stage','Single'),
			array('self::$cards','Pips','StageDifficulty'),
			array('self::$obstacles','Type','OptionalMulti'),
			array('self::$cards','Pips','ObstacleDifficulty'),
		 ),
			 'Note'=>'This is a Stage of an Ordeal, it can feature multiple Obstacles.'),
		array('Type'=>'Hook', 'Positions'=>array(array('self::$yarn','Hook', 'Single'),array('self::$yarn', 'Hook_Aspect', 'Single')), 'Note'=>'Hooks Hook the Conflict Embodiments (especially the PCs). Sometimes they will hook a Pact (like a Party of PCs), instead of individual PCs.'),
		array('Type'=>'The Fray', 'Positions'=>array(array('self::$yarn','Fray','Single')),'Note'=>'The Fray is a Quest, Test, Ordeal or similar that presses the Pressed Characters.'),
		array('Type'=>'The Snag', 'Positions'=>array(array('self::$yarn','Snag','Single')),'Note'=>'The Snag is a complication or problem that plagues the Pressed Characters.'),
		array('Type'=>'Warp', 'Spreads'=>array(array('The Ends'=>'None', 'The Fray'=>'Single', 'The Snag'=>'Single')), 'Note'=>'Warps press the pressed sides of the Conflict.'),
		array('Type'=>'Sweeping', 'Positions'=>array(array('self::$yarn','Sweeping','Single')),'Note'=>'Sweeping is some minor (or occasionally major) Gain, Revelation and so on for the Pressed Characters.'),
		array('Type'=>'Weft', 'Spreads'=>array(array('Recoiling'=>'None', 'Sweeping'=>'Single', 'Choosing'=>'None')), 'Note'=>'Wefts rest the pressed sides of the Conflict. Note that Cards may be used to generate Choosing choices (but not directly).'),
		array('Type'=>'Frame', 'StakeModifier'=>-1,'Spreads'=>array(
			array('Hook'=>'Multiple','Revelation'=>'Multiple')), 'Note'=>'Frames define the Conflict of a story, setting the Scene for what is to come.'),
	array('Type'=>'Loom_pair','StakeModifier'=>0,'Spreads'=>array(
		array('Warp'=>'Single','Weft'=>'Single'),
		array('Weft'=>'Single', 'Warp'=>'Single')), 'Note'=>'A Loom Pair always consists of A Warp and a Weft in either order.'),
	array('Type'=>'Loom','StakeModifier'=>0,'Spreads'=>array(
		array('Loom_pair'=>'Multiple')), 'Note'=>'A Loom should be at least twice the length of the Frame, and can be enormous. It is the main body of the Story and is usually about two-thirds of the total plot.'),
	array('Type'=>'Zenith','StakeModifier'=>1,'Spreads'=>array(
		array('Ordeal'=>'Single','Completion'=>'None', 'Gain'=>'Single')),'Note'=>'A Zenith is the finale of the Story.'),
	array('Type'=>'Logue','StakeModifier'=>1,'Spreads'=>array(array('Revelation'=>'Single','Warp'=>'Optional', 'Weft'=>'Optional')),'Note'=>'The Logue can be used as a break from the main story, or to prologue, or epilogue, the Story.'),
	array('Type'=>'Story', 'StakeModifier'=>0,'MinConflictFacets'=>2,'MaxConflictFacets'=>4,'Spreads'=>array(array('Frame'=>'Single','Loom'=>'Single', 'Zenith'=>'Single','Logue'=>'Optional'),array('Frame'=>'Single','Loom'=>'Multiple','Zenith'=>'Single', 'Logue'=>'Optional')),'Note'=>'Stories are the backbone of the Game. They are intended to be scalable for any use.'),
	array('Type'=>'Tract', 'StakeModifier'=>0,'MinConflictFacets'=>2, 'MaxConflictFacets'=>6,'Spreads'=>array(array('Scene'=>'Single', 'Story'=>'Single')), 'Note'=>'Tracts are Stories, Arcs, or Volumes that act as Scenes of Larger Stories (Volumes, Epics or Cycles). You can also call them Episodes or Chapters if you prefer.'),
	array('Type'=>'Arc', 'StakeModifier'=>0, 'MinConflictFacets'=>4,'MaxConflictFacets'=>8,'Spreads'=>array(array('Story'=>'Multiple')),'Note'=>'Arcs are two-parters and longer stories, such as Novellas and Movies.'),
	array('Type'=>'Volume', 'StakeModifier'=>0, 'MinConflictFacets'=>6, 'MaxConflictFacets'=>12,'Spreads'=>array(array('Story'=>'Single', 'Tract'=>'Multiple', 'Arc'=>'Optional')),'Note'=>'Volumes are long form fiction, like Novels or a whole series of a show.'),
	array('Type'=>'Epic', 'StakeModifier'=>0, 'MinConflictFacets'=>8,'MaxConflictFacets'=>24,'Spreads'=>array(array('Volume'=>'Multiple', 'Tract'=>'Multiple','Story'=>'Optional')),'Note'=>'Epics are extremely long form fiction, consisting of entire book series from trilogies to dodecologies'),
	array('Type'=>'Cycle', 'StakeModifier'=>0,'MinConflictFacets'=>12, 'MaxConflictFacets'=>48,'Spreads'=>array(array( 'Epic'=>'Multiple','Story'=>'Optional')),'Note'=>'Cycles are huge mythologies like Vampire-lore or Greek Myth. They may or may not have a Narrative that threads the Cycle.'),
	);
static public function getObstaclesForFacet($facetName){
	$ret=[];
	foreach(self::$cards as $key=>$card){
		if ($facetName=="all"||T13Types::contains($card['Facet'], $facetName)){
			array_unshift($ret,self::$obstacles[$key]);
		}
	}
	return $ret;
}

static public function writeCardScript(){
		$jscard=self::$cards;
        $c = count(self::$cards);
		for($i=0;$i<$c;$i++){
			//error_log('adding card '.$i);
		 self::$cards[$i]['Svg']= 'images/cards-svg/'.self::$cards[$i]['Svg'].'.svg';
		 self::$cards[$i]['Yarn']=self::$yarn[$i];
		 self::$cards[$i]['Yarn']['Revelations']=self::$revelations[$i];
		 self::$cards[$i]['Obstacle']=self::$obstacles[$i];
		 //self::$cards[$i]['Yarn']['Hyper']=self::writeYarn(self::$yarn[$i], 'fancy', $i);
		 self::$cards[$i]['Tarot']=self::$tarot[$i];
		 self::$cards[$i]['Ordeal']=self::$ordeals[$i];
		 foreach (self::$cards[$i]['Ordeal'] as $ok => $ov) {
				self::$cards[$i]['Ordeal'][$ok]=do_shortcode($ov);
		 }
		// self::$cards[$i]['Wound']['Hyper']=stripslashes(T13Wounds::getWound(self::$cards[$i]['Wound_Level'],'svg'));
		 self::$cards[$i]['Lea']=self::$lea[$i];
		//self::$cards[$i]['Lea']['Hyper']=self::writeLea(self::$lea[$i]);
		//self::$cards[$i]['HTML']=self::getCard($i,'fancy',1,1);
		 //self::$cards[$i]['Carte']=self::getCard($i,'svg',1,1);
         self::$cards[$i]['Stress']=self::$stressCards[$i];
         self::$cards[$i]['Trauma']=self::$traumaCards[$i];
         self::$cards[$i]['Age']=self::$socialAgeCards[$i];
		}
		$jscard=json_encode((array)self::$cards);
		//error_log('cards encoded');
	 unset(self::$cards['Yarn']);
	 unset (self::$cards['Ordeal']);
	 unset (self::$cards['Obstacle']);
	 unset(self::$cards['Tarot']);
     unset(self::$cards['Lea']);
     unset(self::$cards['Stress']);
     unset(self::$cards['Trauma']);
     unset(self::$cards['Age']);
     //reclaim some memory.
	 //error_log("building decks");
	 self::$deck[0]=json_encode(self::buildDecks(2));
	 $deck = self::$deck[0];
	// error_log("decks are built");
	 //unset(self::$cards['Hyper']);
	 //unset(self::$cards['Carte']);
		return "window.T13NE.Cards={$jscard};
		window.T13NE.Deck={$deck};";
		//window.T13NE.Spreads={};
		//window.T13NE.Spreads.Conflicts = {self::$conflictSpreads};

	}


	static public function quickCard($number,$handsize){
		if ($number>$handsize){$number=$handsize;}
		$cartes=array();
		if ($number>0){
			for($i=0;$i<$number;$i++){
				$cartes[]=self::RNG(0,53);
			}
		}else{
			$cartes='No Card';
		}
		return $cartes;
	}
	static public function maybeQuickCard($number, $handsize){
		$cartes=array('No Card');
		for ($i=0;$i<$number;$i++){
			if (self::RNG(0,10)<$handsize){
				$cartes[$i]=self::RNG(0,53);
			}else{
				$cartes[$i]='No Card';
			}
		}
		sort($cartes);
		return $cartes;
	}
	static public function dealHand($number, $hand, $handsize){
		//first lets make sure the deck is upto date

		if($number>0){
			$cartes=array();
			if (count($hand)<$number){$hand=self::drawHand($handsize);} //no cards? new hand...
			for ($i=0;$i<$number;$i++){
				$cartes[$i]=array_pop($hand); //get a card
			}
		}else{$cartes='No Card';}
		return $cartes;
	}
	static public function maybeDealHand($number, $hand, $handsize){
		$cartes=array();
		for($i=0;$i<$number;$i++){
			if (self::RNG(0,12)<$handsize){
				$cartes[$i]=self::dealHand(1,$hand,$handsize);
			}else{
				$cartes[$i]='No Card';
			}
		}
		return $cartes;
	}
	static public function displayCardAspect($aspect,$cards){
		$ret="<!-- t13ne spread //-->";
		if (T13Types::is_Json($cards)){$cards=json_decode($cards);}
		if (is_array($cards)){
			foreach($cards as $i=>$card){
				if ($card=='No Card'){
					$ret.='<div class="t13ne-narrative-spread t13ne-card-spot">
									<div class="t13ne-poolhand" data-mode="jsvg">
										<div class="t13ne-cardwrap-jsvg">';
					$ret.='			<img src="'. plugins_url(). '/t13ne/images/cards-svg/nocard.svg" class="t13ne-svgcard" />
										</div>
									</div>';
					$ret.='	<figcaption>No Card Selected</figcaption>';
					$ret.='</div>';
				}else{
					$ret.='<div class="t13ne-narrative-spread t13ne-card-spot">';
				$ret.=self::getCard($card,'jsvg',1,1);
				$re = self::createDoom($card, $aspect);
				$ret.=$re['Text'].'</div>';
				}


			}
		}elseif (is_numeric($cards)){
			$ret.='<div class="t13ne-narrative-spread t13ne-card-spot">';
			$ret.=self::getCard($cards,'jsvg',1,1);
			$re = self::createDoom($cards, $aspect);
			$ret.=$re['Text'].'</div>';
		}elseif($cards=='No Card'){
			$ret.='<div class="t13ne-narrative-spread t13ne-card-spot"><div class="t13ne-poolhand" data-mode="jsvg"><div class="t13ne-cardwrap-jsvg">';
			$ret.='<img src="'. plugins_url(). '/t13ne/images/cards-svg/nocard.svg" class="t13ne-svgcard" /></div></div>';
			$ret.='<figcaption>No Card Selected</figcaption>';
			$ret.='</div>';
		}
		return $ret;
	}
	static public function writeCardAspect($aspect,$card){
		$title=str_replace('_', ' ', $aspect);
		$aspect=str_replace('The ','', $aspect);
		$css=strtolower(str_replace('_','-',$aspect));
		if (!is_numeric($card)){$card=json_encode($card);}
		return "<figure class=\"t13ne-doom-{$css}\" title=\"{$title}\"><strong>{$title}</strong>".self::displayCardAspect($aspect,$card)."</figure>";
	}
	static public function displayDoomSpread($playedCards){
		$ret='<!--displayDoomSpread //-->';
		foreach($playedCards as $number=>$array){
			if (!is_numeric($number)&&(is_numeric($array)||$array=="No Card")){
					$ret.=self::writeCardAspect($number, $array);
			}else{
				foreach ($array as $key=>$data){
					if (!is_numeric($key)&&(is_numeric($data)||$data=='No Card')){
						$ret.=self::writeCardAspect($key,$data);
					}else{
					 foreach($data as $k=>$c){
					 	if (!is_numeric($k)&&(is_numeric($c)||$c=='No Card')){
					 		$ret.='<!--Facet {$k} //-->'.self::writeCardAspect($k,$c);
					 	}
					 }
					}
				}
			}
		}
		return $ret;
	}

	static public function dealCards($requiredcards,$hand, $handsize,$terms){
		$ret=array('HTML'=>'<section class="t13ne-card-table">');
		$ret['HTML'].="<div class=\"t13ne-narrative-spread\"><h3>{$requiredcards['Name']}: {$requiredcards['StorySize']}</h3>";
		$ret['Played']=array();

		$MainStory=T13Types::extractSubArrays($requiredcards,'MainStory');
		foreach($MainStory as $story=>$data){
			//error_log('a MainStory !');
			$ret['HTML'].='<!-- Story='.$story.' data='.json_encode($data).'//-->';
			$ret['HTML'].="<div class=\"t13ne-narrative-spread\" data-story=\"{$story}\"><h4>{$data['Name']}</h4>";
			$re=T13Plots::displayConflict($data['Conflict'],$terms);
			$ret['HTML'].=$re['Text'];
			$ret['HTML'].="<details><summary><strong>Random Embodiments</strong></summary><ul>";
				foreach($data['Conflict']['Sides'] as $k=>$side){
					$ret['HTML'].='<li><strong>'.$k.' Side Embodiments</strong>'.self::writeCardAspect('Conflict_Embodiment',self::RNG(0,53)).'</li>';
					foreach($side['Facets'] as $n=>$facet){
						$ret['HTML'].='<li>[t13ne type="facet" data-mode="jscript" facet="'.$facet.'" /]'.self::writeCardAspect('Facet_Embodiment',self::RNG(0,53)).'</li>';
					}
				}
			$ret['HTML'].='</ul></details>';
			$scenes=T13Types::extractSubArrays($requiredcards,'Scenes');
			//error_log('Extracted Scenes='.json_encode($scenes));
			$ret['HTML'].='<!-- Extracted Scenes='.json_encode($scenes).'//-->';
			$j=0;
			foreach($scenes as $i=>$story){
				//error_log('Story='.json_encode($story));
				if (is_array($story)){
					foreach($story as $k=>$scene){
						$j++;
						if (is_array($scene['Side'])){
							if (isset($scene['Side']['Sides'])){
								$side=array_rand($scene['Side']['Sides'],1);
							}else{
								$side=array_rand($data['Conflict']['Sides'],1);
							}

						}elseif(is_string($scene['Side'])){
							$side=$scene['Side'];
						}
						$ret['HTML'].='<!--'.json_encode($scene).'//-->';
						$ret['HTML'].="<div class=\"t13ne-scene\"><h5>Scene {$j}: For {$scene['For']} — {$scene['Scene']} Side:{$side}</h5><p class=\"t13ne-description\">{$scene['Description']}</p>";
						$ret['HTML'].='<h6>Card Spread</h6>';
						if (is_array($scene['Cards'])){
							foreach($scene['Cards'] as $carte=>$cards){
								switch ($cards){
									case '1':
									case 1:
										$re=self::quickCard(1,$handsize);
										$ret['HTML'].=self:: writeCardAspect($carte,$re);
									break;
									case 'O':
										if (self::RNG(1,$handsize)>3){
											$re=self::maybeQuickCard(1,$handsize);
											$ret['HTML'].=self:: writeCardAspect($carte,$re);
										}else{

											$ret['HTML'].=self:: writeCardAspect($carte,'No Card');
										}
									break;
									case 'OM':
										$re=self::maybeQuickCard(self::RNG(1,$handsize), $handsize);
										usort($re, (function ($a,$b){return strlen($a)-strlen($b);}));
										$ret['HTML'].=self:: writeCardAspect($carte,$re);
									break;
									case '123':
										$re=self::quickCard(self::RNG(1,3),$handsize);
										usort($re, (function ($a,$b){return strlen($a)-strlen($b);}));
										$ret['HTML'].=self:: writeCardAspect($carte,$re);
									break;
									case '234':
										$re=self::quickCard(self::RNG(2,4),$handsize);
										usort($re, (function ($a,$b){return strlen($a)-strlen($b);}));
										$ret['HTML'].=self:: writeCardAspect($carte,$re);
									break;
									default:
									 $ret['HTML'].=self::writeCardAspect($carte,'No Card');
									break;
								}
							}
						}else{error_log('cards not found in '.json_encode($scene));}
					}
				}else{error_log('Bad Story Data');}


				//$ret['HTML'].=self::displayDoomSpread($ret['Played'][$i]);
				$ret['HTML'].="</div>";
			}
			$ret['HTML'].='</div>';
		}
		$ret['HTML'].='</div></section>';
		unset($requiredcards);
		unset($scene);
		unset($data);
		return $ret['HTML'];
	}

	static private function RNG($min = 0, $max = 53, $mod=0) {
		if ($min>$max){$max=$min+1;}
			if (function_exists('random_int')):
					return random_int($min, $max)+$mod; // more secure
			elseif (function_exists('mt_rand')):
					return mt_rand($min, $max)+$mod; // faster
			endif;
			return rand($min, $max)+$mod; // old
	}

	static private function addCards(){
		//actually this is gone now!
	}

	static public function buildSelector($cardMode,$selected){
	 $rethtml="<!--cardbuildSelector ({$cardMode}, {$selected}) //-->";
	 $rethtml.='';
	 return $rethtml;
	}
	static private function writeCard($card, $mode='fancy',$i=null, $aspect='Stress'){
		if (!isset($i)){$i=$card;}
		switch ($mode){
			case "card":
			return "";
			case "svg":
			return '<img src="'. plugins_url(). '/t13ne/images/cards-svg/'.$card['Svg'].'.svg" class="t13ne-svgcard" /><div class="t13ne-svgpips"><div class="t13ne-textpips">'.$card['Pips'].T13Suits::getSuit($card['Suit'],'Full').'</div></div><div class="t13ne-svg-facet"><div>'.$card['Facet'].'</div></div>';
			break;
			case "uni":
			return '<span class="t13ne-unicard">'.$card['Unicode'].'</span>';
			break;
			case "text":
			return '<span class="t13ne-textcard">'.$card['Card'].T13Suits::getSuit($card['Suit'],'Full').'</span>';
			break;
			 case "full":
			return '<span class="t13ne-fullcard">'.$card['Card'].T13Suits::getSuit($card['Suit'],'Full').'</span><span class="t13ne-textpips">'.$card['Pips'].'</span>';
			break;
			case "fancy":
				$earl= plugins_url().'/t13ne/images/cards-svg/'.$card['Svg'].'.svg';
				return '<div class="t13ne-fancycard" style="background-image: url(\''.$earl.'\')!important; background-size:51% 51%;"><span class="t13ne-unicard">'.$card['Unicode'].'</span><span class="t13ne-fancycard">'.$card['Card'].T13Suits::getSuit($card['Suit'],'Full').'</span><span class="t13ne-textpips"><strong>Pips: </strong>'.$card['Pips'].'</span></div><span class="t13ne-card-facet"><detail><summmary><strong>Facet(s): </strong></summary>'.T13Facets::getFacetForCard($card['Facet'],"full").'</detail></span>';
				break;
			case "jscript":
				return "<figure id=\"t13ne-card-{$i}\" t13card=\"{$i}\" data-t13necard=\"{$i}\" data-t13neordeal=\"0\" data-t13newyrd=\"0\" data-t13neyarn=\"0\" data-t13nelea=\"0\" data-t13nefaceup=\"faceup\"  data-mode=\"jscript\"  data-t13nefaceup=\"faceup\" class=\"t13ne-loading\"></figure>";
				break;
			case "jsvg":
			return "<figure  id=\"t13ne-card-{$i}\" t13card=\"{$i}\" data-t13necard=\"{$i}\" data-t13neordeal=\"0\" data-t13newyrd=\"0\" data-t13neyarn=\"0\" data-t13nelea=\"0\" data-t13nefaceup=\"faceup\" data-mode=\"jsvg\" class=\"t13ne-loading\"></figure>";
			break;
            case "table":
            return '<tr><td>'.$card['Unicode'].'<span class="t13ne-fullcard">'.T13Suits::getSuit($card['Suit'],'Full').'</span><span class="t13ne-textpips">'.$card['Pips'].'</span></td><td>'.(isset($card[$aspect]))?($card[$aspect]):("Error: what's ".$aspect).'</td></tr>';
            break;
			default:
			return '<span class="t13ne-defaultcard">'.[$card]['Corner'].T13Suits::getSuit($card['Suit'],'Symbol').'</span><span class="t13ne-textpips">('.$card['Pips'].' Pips)</span>';
			break;
	 }
	}
    static private function writeStress($stress){
        $ret="<div class=\"t13ne-card-stress\"><details class=\"t13ne-stress\"><summary><strong>Stress</strong></summary>";
        $ret.="<header class=\"t13ne-stress-effect\"><strong>{$stress['Type']}</strong></header>";
        $ret.="<main class=\"t13ne-description\">{$stress['Description']}</main>";
        $ret.="<footer class=\"t13ne-rules\"><strong>Rules </strong> — {$stress['Rules']}</footer>";
        $ret .='</details></div>';
        unset ($stress);
        return $ret;
    }
    static private function writeTrauma($trauma){
        $ret="<div class=\"t13ne-card-trauma\"><details class=\"t13ne-trauma\"><summary><strong>Trauma</strong></summary>";
        $ret.="<header class=\"t13ne-trauma-effect\"><strong>{$trauma['Type']}</strong></header>";
        $ret.="<main class=\"t13ne-description\">{$trauma['Description']}</main>";
        $ret.="<footer class=\"t13ne-rules\"><strong>Rules </strong> — {$trauma['Rules']}</footer>";
        $ret .='</details></div>';
        unset ($trauma);
        return $ret;
    }
	static private function writeLea($lea){
		$ret="<div class=\"t13ne-card-lea\"><details class=\"t13ne-lea\"><summary><strong>Lea</strong></summary>";
		$ret.="<p class=\"t13ne-colour\"><strong>Path Colour —</strong> {$lea['PathColour']}</p>";
		$ret.="<p class=\"t13ne-bulmas\"><strong>Allowed Bulmäs —</strong> {$lea['Bulmas']}</p>";
		$ret.="<p class=\"t13ne-animal-category\"><strong>Animal Category —</strong> {$lea['AnimalCategory']}</p>";
		$ret.="<p class=\"t13ne-animal-example\"><strong>Example Animal —</strong> {$lea['Example']}</p>";
		 $ret.="<p class=\"t13ne-notes\"><strong>Notes —</strong> {$lea['Notes']}</p>";
		$ret.="</details></div>";
		unset($lea);
		return $ret;
	}
	static private function writeOrdeal($ord,$mode){
		 $ret="";
		switch($mode){
			case "full":
			case "text":
			case "fancy":
			case "uni":
			case "svg":
			default:
			$ret.="<details class=\"t13ne-ordeal-{$mode}\"><summary><strong>Ordeal</strong></summary>";
			foreach ((array)$ord as $key => $value){
				$k=str_replace("_", "-", $key);
				$css=strtolower($k);
				if (array_key_exists($key.'_Description', $ord)){
					$ord[$key.'_Description']=do_shortcode($ord[$key.'_Description']);
					$ret.="<details class=\"t13ne-{$css}\"><summary><strong>{$k}: </strong> {$value} </summary><p class=\"t13ne-description\">{$ord[$key.'_Description']}</p></details></span>";
				}elseif(!T13Types::contains($key, '_De')){
					$value=do_shortcode($value);
					$ret.="<p class=\"t13ne-{$css}\"><strong>{$k} </strong> — {$value}</p>";
				}
			}
			$ret.='</details>';
			break;
		}
		unset($ord);
		unset($mode);
		return $ret;
	}
	static private function writeRevelation($rev, $mode='full'){
		$ret="";
		switch($mode){
			case "full":
			case "text":
			case "fancy":
			case "uni":
			case "svg":
			default:
			$ret.="<details class=\"t13ne-revelation-{$mode}\"><summary><strong>Revelation</strong></summary>";
			foreach ((array)$rev as $key => $value){
				$k=str_replace("_", "-", $key);
				$css=strtolower($k);
				if (array_key_exists($key.'_Description', $rev)){
					$ret.="<details class=\"t13ne-{$css}\"><summary><strong>{$k}: </strong> {$value} </summary><p class=\"t13ne-description\">{$rev[$key.'_Description']}</p></details></span>";
				}elseif(!T13Types::contains($key, '_De')){
					$ret.="<p class=\"t13ne-{$css}\"><strong>{$k} </strong> — {$value}</p>";
				}
			}
			$ret.='</details>';
			break;
		}
		unset ($rev);
		unset($mode);
		return $ret;
	}
	static private function writeObstacle($obs,$mode='full'){
		$ret="";
	 switch($mode){
			case "full":
			case "text":
			case "fancy":
			case "uni":
			case "svg":
			default:
			$ret.="<span class=\"t13ne-obstacle-{$mode}\"><details class=\"t13ne-obstacle\"><summary><strong>Obstacle:</strong>{$obs['Type']}</summary>";
			$ret.="<p class=\"t13ne-description\">{$obs['Description']}</p></details></span>";
			break;
		}
		unset($obs);
		unset($mode);
		return $ret;
	}
	static private function writeArchetype($arc,$mode='full'){
		$ret="";
		$personality = T13Facets::getPersona($arc['Persona']);
		$core = T13Facets::getFacetComponent($arc['Core'],'core');
		$Hitch =T13Facets::getFacetComponent($arc['Hitch'],'hitch');
		switch ($mode) {
			case 'full':
			case "text":
			case "fancy":
			case "uni":
			case "svg":
			default:
				$ret.="<div class=\"t13ne-archetypes\"><details><summary><strong>Archetype Character: </strong>{$arc['Archetype']}</summary>";
				$ret.=" {$personality} ";
				$ret.="{$core}";
				$ret.="{$Hitch}";
				$ret.="<p class=\"t13ne-description\">{$arc['Description']}</p>";
				$ret.="</details></div>";

			break;
		}
		unset($arc);
		unset($mode);
		unset($personality);
		unset($core);
		unset($Hitch);
		return $ret;
	}

	static private function writeYarn($card, $mode='fancy', $in=0){
		if (!isset (self::$revelations)){self::addCards();}
		$obstacle=self::writeObstacle(self::$obstacles[$in],$mode);
		$reveal = self::writeRevelation(self::$revelations[$in], $mode);
		$ordeal=self::writeOrdeal(self::$ordeals[$in],$mode);
		$archetype = self::writeArchetype($card['NPC'],$mode);
		if ($mode=="text"||$mode=="full"||$mode=="uni"||$mode=="fancy"){
			return "<div class=\"t13ne-yarn-{$mode}\">
			<details><summary><strong>Yarn</strong> <br/>{$card['Yarn_Name']}</summary>
			<span class=\"t13ne-description\">{$card['Yarn_Description']}</span>
			<span class=\"t13ne-significator\">
				<details>
					<summary class=\"t13ne-significator\"><strong>Significator</strong></summary>
					<aside class=\"t13ne-plot\"><strong>Plot: </strong> {$card['Significator']['Plot']}</aside>
					<aside class=\"t13ne-side\"><strong>Side: </strong> {$card['Significator']['Side']}</aside>
					<aside class=\"t13ne-char\"><strong>Character: </strong> {$card['Significator']['Character']}</aside>
					<aside class=\"t13ne-scene\"><strong>Scene: </strong> {$card['Significator']['Scene']}</aside>
				</details>
			</span>
			<span class=\"t13ne-scene\">
				<details>
					<summary class=\"t13ne-scene-type\">
						<strong>Scene: </strong> ".T13Types::$sceneBeatTypes[$card['Beat_Type']]['Type']."
					</summary>
					<aside class=\"t13ne-description\">".T13Types::$sceneBeatTypes[$card['Beat_Type']]['Description']."</aside>
				</details>
			</span>
			<span class=\"t13ne-conflict-embodiment\">
				<details>
					<summary class=\"t13ne-conflict-embodiment\">
						<strong>Conflict Embodiment: </strong> ".T13Types::$conflictEmbodiments[$card['Conflict_Embodiment']]['Type']."
					</summary>
					<aside class=\"t13ne-description\">".T13Types::$conflictEmbodiments[$card['Conflict_Embodiment']]['Description']."</aside>
				</details>
			</span>

			<span class=\"t13ne-facet-embodiment\">
				<details>
					<summary class=\"t13ne-facet-embodiment\">
						<strong>Facet Embodiment: </strong> ".T13Types::$embodimentTypes[$card['Facet_Embodiment']]['Type']."
					</summary>
					<section class=\"t13ne-description\">".T13Types::$embodimentTypes[$card['Facet_Embodiment']]['Description']."</section>
				</details>
			</span>
			 {$archetype}
			 <span class=\"t13ne-hook\">
				<details>
					<summary class=\"t13ne-hook\">
						<strong>Hook: </strong> {$card['Hook']}
					</summary>
					<aside class=\"t13ne-description\">{$card['Hook_Description']}</aside>
					<details class=\"t13ne-hook-aspect\">
						<summary><strong>Hook Aspect: </strong>{$card['Hook_Aspect']}</summary>
						<section class=\"t13ne-description\">{$card['Aspect_Description']}</section>
					</details>
				</details>
			</span>
			{$obstacle}
			<span class=\"t13ne-gain\">
				<details>
					<summary class=\"t13ne-gain\">
						<strong>Gain </strong>
					</summary>
					<aside class=\"t13ne-description\">{$card['Gain']}</aside>
				</details>
			</span>
			<span class=\"t13ne-fray\">
				<details>
					<summary class=\"t13ne-fray\">
						<strong>Fray: </strong> {$card['Fray']}
					</summary>
					<aside class=\"t13ne-description\">{$card['Fray_Description']}</aside>
				</details>
			</span>
			<span class=\"t13ne-snag\">
				<details>
					<summary class=\"t13ne-snag\">
						<strong>Snag: </strong> {$card['Snag']}
					</summary>
					<aside class=\"t13ne-description\">{$card['Snag_Description']}</aside>
				</details>
			</span>
			<span class=\"t13ne-sweeping\">
				<details>
					<summary class=\"t13ne-sweeping\">
						<strong>Sweeping: </strong> {$card['Sweeping']}
					</summary>
					<aside class=\"t13ne-description\">{$card['Sweeping_Text']}</aside>
				</details>
			</span>
		 {$reveal}
		 {$ordeal}
		 </details>
			</div>
				";
		}else{
			return "<div class=\"t13ne-yarn-{$mode}\"><div>
			<details><summary> <strong>Yarn</strong> <br/>{$card['Yarn_Name']}</summary>
				<span class=\"t13ne-yarn-{$mode}\">
				<p class=\"t13ne-description\">{$card['Yarn_Description']}</p>
				<span class=\"t13ne-significator\">
				<details>
					<summary class=\"t13ne-significator\"><strong>Significator</strong></summary>
					<p class=\"t13ne-plot\"><strong>Plot: </strong> {$card['Significator']['Plot']}</p>
					<p class=\"t13ne-side\"><strong>Side: </strong> {$card['Significator']['Side']}</p>
					<p class=\"t13ne-char\"><strong>Character: </strong> {$card['Significator']['Character']}</p>
					<p class=\"t13ne-scene\"><strong>Scene: </strong> {$card['Significator']['Scene']}</p>
				</details>
			</span>
				<span class=\"t13ne-scene\">
					<details>
						<summary class=\"t13ne-scene-type\">
							<strong>Scene: </strong> ".T13Types::$sceneBeatTypes[($card['Beat_Type'])] ['Type']."
						</summary>
						<p class=\"t13ne-description\">".T13Types::$sceneBeatTypes[$card['Beat_Type']]['Description']."</p>
					</details>
				</span>
				<span class=\"t13ne-conflict-embodiment\">
					<details>
						<summary class=\"t13ne-conflict-embodiment\">
							<strong>Conflict Embodiment: </strong> ".T13Types::$conflictEmbodiments[$card['Conflict_Embodiment']]['Type']."
						</summary>
						<p class=\"t13ne-description\">".T13Types::$conflictEmbodiments[$card['Conflict_Embodiment']]['Description']."</p>
					</details>
				</span>
				<span class=\"t13ne-facet-embodiment\">
					<details>
						<summary class=\"t13ne-facet-embodiment\">
							<strong>Facet Embodiment: </strong> ".T13Types::$embodimentTypes[$card['Facet_Embodiment']]['Type']."
						</summary>
						<p class=\"t13ne-description\">".T13Types::$embodimentTypes[$card['Facet_Embodiment']]['Description']."</p>
					</details>
				</span>
				 {$archetype}
				 <span class=\"t13ne-hook\">
					<details>
						<summary class=\"t13ne-hook\">
							<strong>Hook: </strong> {$card['Hook']}
						</summary>
						<p class=\"t13ne-description\">{$card['Hook_Description']}</p>
						<details class=\"t13ne-hook-aspect\">
							<summary><strong>Hook Aspect: </strong>{$card['Hook_Aspect']}</summary>
							<p class=\"t13ne-description\">{$card['Aspect_Description']}</p>
						</details>
					</details>
				</span>
					{$obstacle}
				<span class=\"t13ne-gain\">
					<details>
						<summary class=\"t13ne-gain\">
							<strong>Gain </strong>
						</summary>
						<p class=\"t13ne-description\">{$card['Gain']}</p>
					</details>
				</span>
				 <span class=\"t13ne-fray\">
				<details>
					<summary class=\"t13ne-fray\">
						<strong>Fray: </strong> {$card['Fray']}
					</summary>
					<p class=\"t13ne-description\">{$card['Fray_Description']}</p>
				</details>
			</span>
				 <span class=\"t13ne-snag\">
				<details>
					<summary class=\"t13ne-snag\">
						<strong>Snag: </strong> {$card['Snag']}
					</summary>
					<p class=\"t13ne-description\">{$card['Snag_Description']}</p>
				</details>
			</span>
			<span class=\"t13ne-sweeping\">
				<details>
					<summary class=\"t13ne-sweeping\">
						<strong>Sweeping: </strong> {$card['Sweeping']}
					</summary>
					<p class=\"t13ne-description\">{$card['Sweeping_Text']}</p>
				</details>
			</span>
				{$reveal}
				{$ordeal}
				</span>
				</details>

				</div></div>";
		}
	}
	static private function writeTarot($card,$mode){
		if ($mode=="text"||$mode=="full"||$mode=="uni"||$mode=="fancy"){
			return '<div class="t13ne-tarot-'.$mode.'"><details><summary class="t13ne-wyrdtarot"><strong> Wyrd Tarot: </strong> '.$card['WyrdTarot'].' </summary><p class="t13ne-normal"><strong> Normal: </strong>'.$card['Normal'].'</p><p class="t13ne-crossed"><strong> Crossed: </strong>'.$card['Crossed'].'</p></details></div>';
		}else{
			 return '<div class="t13ne-tarot-'.$mode.'"><div><strong class="t13ne-wyrdtarot">'.$card['WyrdTarot'].': </strong> <details><summary></summary><span class="t13ne-normal"><strong>Normal: </strong>'.$card['Normal'].'</span><p class="t13ne-crossed"><strong>Crossed: </strong>'.$card['Crossed'].'</p></details></div></div>';
		}

	}

 static public function getCard($in, $mode="text", $wyrd = 1, $yarn =1, $stress=1){
		$ret='<div class="t13ne-poolhand" mode="'.$mode.'">';
		if (is_numeric($in)){
			$ret.='<figure class="t13ne-cardwrap-'.$mode.'" ';
			if ($mode=='jscript'||$mode =='jsvg'){
				$key=md5(uniqid(rand(), true));
			 $ret.=" id=\"t13ne-card-{$key}\" t13card=\"{$in}\" data-t13necard=\"{$in}\" data-mode=\"{$mode}\" data-t13neordeal=\"{$wyrd}\" data-t13newyrd=\"{$wyrd}\" data-t13nelea=\"{$yarn}\" data-t13neyarn=\"{$yarn}\" data-t13nestress=\"{$stress}\" data-t13nefaceup=\"faceup\"  class=\"t13ne-loading\">";
			}else{
				$card=self::$cards[$in];
				if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
					$ret.='<details><summary>'.self::writeCard($card,$mode).'</summary>';
				}else{
					$ret.=self::writeCard($card,$mode);
				}

				if ($yarn){
					$ret.=self::writeYarn(self::$yarn[$in],$mode, $in);
				}
				if ($wyrd){
					$ret.=self::writeTarot(self::$tarot[$in],$mode);
				}
                if ($stress){
                    $ret.=self::writeStress(self::$stressCards[$in]);
                }
				$ret.=T13Wounds::getWound($card['Wound_Level'],$mode);
				//$ret.=T13Facets::writeSuitAttacks($card['Suit']);
				if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
					$ret.='</details>';
				}
				$ret.='</figure>';
			}
		}else {
			if(is_array($in)){
				//a hand/pool
				foreach ($in as $k=>$i){
					$ret.='<figure class="t13ne-cardwrap-'.$mode.'"';
					if(($mode=='jscript'||$mode=='jsvg')&&is_numeric($i)){
						//$i--;
						$key=md5(uniqid(rand(), true));
						$ret.= " id=\"t13ne-card-{$k}-{$i}-{$key}\" t13card=\"{$i}\" data-t13necard=\"{$i}\" data-mode=\"{$mode}\" data-t13neordeal=\"{$wyrd}\" data-t13newyrd=\"{$wyrd}\" data-t13nelea=\"{$yarn}\" data-t13neyarn=\"{$yarn}\" data-t13nestress=\"{$stress}\"  data-t13nefaceup=\"faceup\"  class=\"t13ne-loading\">";
					}else{
						if (is_numeric($i)){
							if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
								$ret.='<details><summary>'.self::writeCard(self::$cards[$i-1],$mode).'</summary>';
							}else{
								$ret.=self::writeCard(self::$cards[$i],$mode,$i);
							}
						 if ($yarn){
							 $ret.=self::writeYarn(self::$yarn[$i],$mode, $i);
							}
							if ($wyrd){
								$ret.=self::writeTarot(self::$tarot[$i],$mode);
							}
                             if ($stress){
                                $ret.=self::writeStress(self::$stressCards[$in]);
                                 $ret.=self::writeTrauma(self::$traumaCards[$in]);
                            }
							$ret.=T13Wounds::getWound(self::$cards[$i]['Wound_Level'],$mode);
							$ret.=T13Facets::writeSuitAttacks(self::$cards[$i]['Suit']);
							if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
								$ret.='</details>';
							}

						}else{

							$ret.=self::writeCard($i,$mode,$i);

						 if ($yarn){
							 $ret.=self::writeYarn($i['Yarn'],$mode, $i);
							}
							if ($wyrd){
								$ret.=self::writeTarot($i['Tarot'],$mode);
							}
                             if ($stress){
                                $ret.=self::writeStress(self::$stressCards[$in]);
                                 $ret.=self::writeTrauma(self::$traumaCards[$in]);
                            }
							$ret.=T13Wounds::getWound($i['Wound_Level'],$mode);
							$ret.=T13Facets::writeSuitAttacks($i['Suit']);
							if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
								$ret.='</details>';

							}
						}

					}
					$ret.='</figure>';
						}
						unset($i);
				}
			}
			if ($in=="all"){

				for($i=0;$i<54;$i++){
					$ret.='<figure class="t13ne-cardwrap-'.$mode.'" ';
					if($mode=='jscript'||$mode=='jsvg') {
						$ret.=" id=\"t13ne-card-{$i}\" t13card=\"{$i}\" data-t13necard=\"{$i}\" data-mode=\"{$mode}\" data-t13neordeal=\"{$wyrd}\" data-t13newyrd=\"{$wyrd}\" data-t13nelea=\"{$yarn}\" data-t13neyarn=\"{$yarn}\" data-t13nestress=\"{$stress}\" data-t13nefaceup=\"faceup\" > card {$i} loading";
					}else{
						if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
							$ret.='><details><summary>'.self::writeCard(self::$cards[$i],$mode).'</summary>';
						}else{
							$ret.=self::writeCard(self::$cards[$i],$mode);
						}
						if ($yarn){
							$ret.=self::writeYarn(self::$yarn[$i],$mode, $i);
						}
						if ($wyrd){
							$ret.=self::writeTarot(self::$tarot[$i],$mode);
						}
                         if ($stress){
                            $ret.=self::writeStress(self::$stressCards[$in]);
                            $ret.=self::writeTrauma(self::$traumaCards[$in]);
                        }
						$ret.=T13Wounds::getWound(self::$cards[$i]['Wound_Level'], $mode);
						 $ret.=T13Facets::writeSuitAttacks(self::$cards[$i]['Suit']);
						if ($mode!="fancy"&&$mode!="full"&&$mode!="svg"&&$mode!="jscript"&&$mode!="jsvg"){
							$ret.='</details>';
						}
					}
					$ret.='</figure>';
				}
			}
		unset($card);
		unset($in);
		unset($yarn);
		unset($wyrd);
		unset($mode);
		return $ret.'</div>' ;
	}

	static private function overUnder(){
		//error_log("overunder");
		$tmp = self::$deck[0];
		$tmpa=array();
		while (count($tmp)){
			$tmpa[]=array_shift($tmp);
			$tmpa[]=array_pop($tmp);
		}
		self::$deck[0]=$tmpa;
	}
	static private function underOver(){
		//error_log("underOver");
		$tmp = self::$deck[0];
		$tmpa=array();
		while (count($tmp)){
			$tmpa[]=array_pop($tmp);
			$tmpa[]=array_pop($tmp);
			$tmpa[]=array_shift($tmp);
			$tmpa[]=array_shift($tmp);
		}
		unset($tmp);
		self::$deck[0]=$tmpa;
		unset($tmpa);
	}
	static private function riffle(){
		$nocards=count(self::$deck[0]);
	// error_log("riffle");
		list($tmpa,$tmpb)=array_chunk(self::$deck[0], ceil($nocards/2));
		$tmp=array();
		while (count($tmp)<=$nocards){
			$i=self::RNG(1,3);
			while (--$i){
				$tmp[]=array_pop($tmpa);
			}
			 $i=self::RNG(1,3);
			 while (--$i){
				$tmp[]=array_pop($tmpb);
			}
		}
		$tmp=array_values(array_filter($tmp));
		//error_log("riffled");
		unset($tmpa);
		unset($tmpb);
		self::$deck[0]=$tmp;
		unset($tmp);
	}
	static private function overhand(){
		//error_log("overhand shuffle");
		$nocards=count(self::$deck[0]);
		$tmp = array_reverse(array_chunk(self::$deck[0], 6));
		$tmpa = array();
		foreach($tmp as $tm){
			$tmpa = array_merge($tmpa,$tm);
		}
		unset($tmp);
		self::$deck[0]=$tmpa;
		unset($tmpa);
	}
	static private function cutDeck(){
		//error_log("cut Deck");
		$nocards=count(self::$deck[0]);
		$cut=self::RNG(3,$nocards-3);
		$tmp=self::$deck[0];
		$tmpa=array();
		while (--$cut){
			$tmpa[]=array_shift($tmp);
		}
		self::$deck[0]=array_merge($tmp,$tmpa);
		unset($tmp);
		unset($tmpa);
	}
	 static private function shuffleDeck($num =1){
		shuffle(self::$deck[0]);
			while (--$num){
				//error_log("shuffle {$num}");
			 $r=self::RNG(1,4);
			 //$r=0;
			 switch($r){
				case 0:
				 self::overhand();
				case 1:
				//error_log("simple shuffle");
					shuffle(self::$deck[0]);
				break;
				case 2:
					self::riffle();
				break;
				case 3:
				self::overUnder();
				break;
				case 4:
				self::underOver();
			 }
			}
			self::cutDeck();
	}

	static public function buildDecks($num=2){
		if (!isset(self::$cards)){self::addCards();}
		self::$noDecks=$num;
		//error_log("building deck num={$num}  noDecks={self::$noDecks}");
		self::$deck[0]=range(0,53);
		while (--$num>0){
			//error_log("building deck num={$num}  noDecks={self::$noDecks}");
			self::$deck[0]=array_merge(self::$deck[0],range(0,53));
		}
		//error_log("shuffling");
		self::shuffleDeck(3);
		//print_r(self::$deck);
		return self::$deck[0];
	}
	static public function drawHand($handsize=1){
		$handsize++;
		if (!isset(self::$deck[0])){self::buildDecks();}
		if (!is_array(self::$deck[0])){self::buildDecks();}
		if (count(self::$deck[0])<$handsize){
			//not enough cards left in the deck so reset the deck.
			self::endRound();
			self::buildDecks();
		}
		$hand=array();
		while (--$handsize&&self::$deck[0]){
			$pop=array_pop(self::$deck[0]);
			if (!is_null($pop)){$hand[]=intval($pop);}else{$hand[]=intval(self::RNG(0,53,0));}
		}
		return $hand;
	}
	static public function drawCards($cardsToDraw=0, $wyrd=1){
		$ret='';
		$draw=self::drawHand($cardsToDraw);
		$ret.= self::getCard($draw, 'jsvg', $wyrd, 1);
		return '<span class="t13ne-draw"><strong>Drawn: </strong>'.$ret.'</span>';
	}
	static public function findCard($input){
		if (!isset(self::$cards)){self::addCards();}
		if (is_numeric($input)){
			return $input;
		}elseif(is_array($input)){
			if (array_key_exists('Suit', $input)&&array_key_exists('Pips', $input)){
				foreach (self::$cards as $card => $values) {
					if (($values['Pips']==$input['Pips'])&&($values['Suit']==$input['Suit'])){
						return $card;
					}
				}
			}
		}elseif(is_string($input)){
			$suit=5;
			foreach(T13Suits::$suits as $s => $values){
				if (T13Types::contains($input, $values['Suit'])||T13Types::contains($input, $values['Icon'])||T13Types::contains($input, $values['Html'])){
					$suit=$s;
					break;
				}
			}
			foreach(self::$cards as $card => $val){
				if ((T13Types::contains($input, $val['Card_Corner'])||T13Types::contains($input, $val['Card'])||T13Types::contains($input,$val['Pips']))&&($suit==$val['Suit'])){
					return $card;
				}
			}
		}
	}
	static public function getCardText($card, $getThis){
	 $card=self::findCard($card);
	 if ($getThis=='wyrd'||$getThis=='tarot'){return self::$tarot[$card];}
	 if ($getThis=='yarn'){return self::$yarn[$card];}
	 if ($getThis=='revelations'){return self::$revelations[$card];}
	 if ($getThis=='ordeals'){return self::$ordeals[$card];}
	 if ($getThis=='obstacle'){return self::$obstacles[$card];}
     if ($getThis=='stress'){return self::$stressCards[$card];}
     if ($getThis=='trauma'){return self::$traumaCards[$card];}
	 $yarns=self::$yarn[$card];
	 foreach($yarns as $key=>$val){
		if ($getThis==$key){return $val;}
	 }
	 $revs=self::$revelations[$card];
	 foreach($revs as $key=>$val){
		if ($getThis==$key){return $val;}
	 }
	 $ordeal=self::$ordeals[$card];
	 foreach($ordeal as $key=>$val){
		if ($getThis==$key){return $val;}
	 }
	}

	static private function createRevelationDoomText($card=0, $revelationAspect='About'){
        $card = abs($card%53);
		if (array_key_exists($revelationAspect, self::$revelations[$card])){
		return self::$revelations[$card][$revelationAspect].'</strong> — '.self::$revelations[$card][$revelationAspect.'_Description'];
		}else{
			return "Buggered</strong> Looked for card:{$card} to reveal {$revelationAspect} but didn't find it.";
		}
	}

	static private function createDoom($cards=0,$yarnAspect='Beat_Type'){
		if (!is_array($cards)){$cards=array($cards);}
		$ret="";
		foreach($cards as $i=>$card){
			if (!is_numeric($card)){$ret.='<figcaption><strong>No Card Selected</strong></figcaption>';}else{
                $card=abs($card%53);
				$ret = '<figcaption><strong>';
				switch ($yarnAspect){
					case 'Hook_Aspect':
						 $ret.=self::$yarn[$card]['Hook_Aspect'].'</strong> — '.self::$yarn[$card]['Aspect_Description'];
					break;
					case 'Gain':
						$ret.='Gain </strong> — '.self::$yarn[$card]['Gain'];
						break;
					case 'Sweeping':
						$ret.=self::$yarn[$card][$yarnAspect].'</strong> — '.self::$yarn[$card][$yarnAspect.'_Text'];
					break;
					case 'Beat_Type':
						$ret.=T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Type'].'</strong> — '.T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Description'] .' —'.T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Rule'];
					break;
					case 'Conflict_Embodiment':
						$ret.=T13Types::$conflictEmbodiments[self::$yarn[$card]['Conflict_Embodiment']]['Type'].'</strong> —'.T13Types::$conflictEmbodiments[self::$yarn[$card]['Conflict_Embodiment']]['Description'];
						break;
					case 'Facet_Embodiment':
					$ret.=T13Types::$embodimentTypes[self::$yarn[$card]['Facet_Embodiment']]['Type'].'</strong> —'.T13Types::$embodimentTypes[self::$yarn[$card]['Facet_Embodiment']]['Description'];
						break;
					case 'About':
					case 'Info':
					case 'Vector':
					case 'Alternate':
					case 'Detail':
					$ret.=self::createRevelationDoomText($card,$yarnAspect);
					break;
					case 'Ordeal_Type':
					case 'Ordeal_Spread':
					case 'Stages':
					case 'Stakes':
					case 'Obstacles':
					case 'Suggested_Action':
					case 'Stage':
					case 'Motional':
					case 'Fight':
					$ret.=self::$ordeals[$card][$yarnAspect].'</strong>';
					if (array_key_exists($yarnAspect.'_Description', self::$ordeals)){
						$ret.=' — '.self::$ordeals[$card][$yarnAspect.'_Description'];
					}
					break;
					case 'Test (Facet)':
					$ret.='Test</strong> — '.self::$ordeals[$card][$yarnAspect];

					break;
					case 'Tide_of_Battle':
						$ret.= self::$ordeals[$card]['Tide_of_Battle'].'</strong> &mdash '.self::$ordeals[$card]['Tide_of_Battle_Text'];
					break;
					case 'Type':
					case 'Obstacle':
					case 'Obstacle_Type':
					$ret.=self::$obstacles[$card]['Type'].'</strong> — '.self::$obstacles[$card]['Description'];
					break;
					case 'Psych_Recoil':
					$ret.="</strong>The Recoiling Cards represent a single Psych Attack of one to three cards. Based on the events of the Fray and Snag this may be a Positive or Negative Emotional effect as the Yarn-Teller describes. ";
					break;
					case 'Difficulty':
					$ret.="</strong>The Difficulty is set by these cards.";
					default:
						if (array_key_exists($yarnAspect, self::$yarn[$card])){
							 $ret.='<!-- '.$yarnAspect.' //-->'.self::$yarn[$card][$yarnAspect].'</strong> — '.self::$yarn[$card][$yarnAspect.'_Description'];
							}else{
								$ret.="</strong> well I tried to retrieve {$yarnAspect} for card {$card} - didn't find it.";
							}
					 break;
				}
			 $ret.='</figcaption>';
			}
		}
		return array('Card'=>$card, 'Text'=>$ret);
	}
	static public function endOrdeal(){
		//ends the Ordeal
	}
	static public function endRound(){
		//all the stuff required to end a round
		//then either start a new one or end the ordeal.
		return self::newRound();
	}
	static public function newOrdeal(){
		//a new Ordeal. Called when an Ordeal is entered.
		// calls newround at the end
		self::newRound();
	}
	static public function newRound(){
		// does initiative and so on.


	}
static public function getFacetObstacles($facet){
	if (is_numeric($facet)){
		$facet = T13Facets::getFacetNameFor($facet);
	}
	$obstaclelist=self::getObstaclesForFacet($facet);
	$rethtml='<strong>Suggested Obstacles</strong><ul>';
	foreach($obstaclelist as $key=>$obstacle){
		$rethtml.='<li>'.self::writeObstacle($obstacle).'</li>';
	}
	return $rethtml.'</ul>';
}
static public function getSignificator($card, $side){
	$sig=self::$yarn[$card];
	$ret=['Name'=>$sig['Yarn_Name'], 'Description'=>$sig['Yarn_Description'], 'Plot'=>$sig['Significator']['Plot'], 'Side'=>$sig['Significator']['Side'], 'Character'=>$sig['Significator']['Character'], 'Scene'=>$sig['Significator']['Scene']];
	$ret['Html']="<div class=\"t13ne-significator {$card} {$side}\"><strong>Significator</strong> — <details><summary>{$ret['Name']}</summary><div class=\"t13ne-description\">{$ret['Description']}</div><div class=\"t13ne-significator-plot\"><strong>Plot</strong>: {$ret['Plot']}</div><div class=\"t13ne-significator-side\"><strong>Side</strong>: {$ret['Side']}</div><div class=\"t13ne-significator-char\"><strong>Character</strong>: {$ret['Character']}</div><div class=\"t13ne-significator-scene\"><strong>Scene</strong>: {$ret['Scene']}</div></details></div>";
	return $ret;
}

	 static public function conflictspread($type,$cards){
	 	$rhtml = '';
	 	$rhtml .='<!--'.json_encode( $type ).'//-->';
	 	$rhtml .='<!--'.json_encode( $cards ).'//-->';
		if (!is_array($cards)){
			$cards=T13Types::arrayify($cards);

		}else{
			if (isset($cards[0][0])){
				T13Types::array_flatten($cards);

			}

		}
		$cardno=sqrt(count($cards)-9)-2;
		$cardspread = null;

		foreach (self::$conflictSpreads as $key => $spread) {
			$rhtml.="<!-- checking {$key} spread -->";

			$jsp=json_encode( $spread );
			$rhtml.="<!-- checking {$jsp} against {$type}//-->";
		 	if ($type==$spread['Type']){
		 		$cardspread = $spread;

		 		foreach ($cardspread['Array'] as $row => $rowvalue) {
		 			foreach($rowvalue as $column => $colvalue){
		 				$rhtml .="<!-- placing a card @{$row}:{$column}={$colvalue} //-->";
		 				if ($colvalue=="card"){

		 					$cardspread['Array'][$row][$column] = array_shift($cards);
		 				}
		 			}
		 		}
		 	}
		 }

		 //$rhtml .='<!-- JSON Spread:'.json_encode( $cardspread ).'//-->';
		$ltype = strtolower($type);
		$lalt = strtolower($cardspread['Alternate']);
		 $rhtml .= '<section class="t13ne-spread alignwide"><div class="t13ne-conflict-spread '.$ltype.' '.$lalt.'"><h4>'.$cardspread['Type'].' '.$cardspread['Alternate'].'</h4>'."<details><summary>&nbsp;</summary><p>{$cardspread['Description']}</p></details>";

		foreach($cardspread['Array'] as $rind => $row){
			$rhtml .='<div class="t13ne-card-spread-row">';

				//$rhtml .= "<!--{$rind}-{$cind}-{$row} //-->";
				$rhtml.= self::getCard($row, 'jsvg', 1, 1);
				$rhtml.='</div>';
			}


		 $rhtml.='</div>';
		 $rhtml.='<div class="t13ne-conflict-data '.strtolower($cardspread['Type']).'">';
		 $rhtml.='<strong>Plot Significator</strong> (+1 card)';
		 $sig=array_pop($cards);
		 $significator=self::getSignificator($sig, "plot");
		 $rhtml.=self::getCard($sig, 'jsvg', 1, 1);
		 $rhtml.=$significator['Html'];
		 foreach(T13Types::$conflictSides as $index=>$side){
		 	$rhtml.='<h5>'.$side['Type'].'</h5>';
		 	$rhtml.='<details><summary>...</summary><p class="t13ne-description"> '.$side['Description'].' </p><p class="t13ne-rules"> '.$side['Rules'].' </p></details>';

		 	switch ($index){
		 		case 0:
		 		case "Dominant":
		 			$thiscardlist = T13Types::array_flatten($cardspread['Array']);
		 			$afacet=false;
		 			$show = true;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 1:
		 		case "Pressed":
		 			$thiscardlist =T13Types::swappairs(T13Types::array_flatten($cardspread['Array']));
		 			$afacet=true;
		 			$show=true;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 2:
		 		case "Above":
		 			$thiscardlist = T13Types::array_flatten(T13Types::rotate2darray($cardspread['Array']));
		 			$afacet=false;
		 			$show = true;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 3:
		 		case "Internal":
		 			$thiscardlist = T13Types::array_flatten(T13Types::explodyArray($cardspread['Array']));
		 			$afacet=true;
		 			$show = count($cardspread['Array'])>2;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 4:
		 		case "Below":
		 			$thiscardlist = T13Types::swappairs(T13Types::array_flatten(T13Types::rotate2darray($cardspread['Array'])));
		 			$afacet=true;
		 			$show = count($cardspread['Array'])>3;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 5:
		 		case "External":
		 			$thiscardlist = T13Types::array_flatten(T13Types::spiralise2dArray($cardspread['Array']));
		 			$afacet=false;
		 			$show = count($cardspread['Array'])>3;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 6:
		 		case "Shadows":
		 			$thiscardlist = T13Types::swappairs(T13Types::array_flatten(T13Types::diagonalArray($cardspread['Array'])));
		 			$afacet=false;
		 			$show = true;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		case 7:
		 		case "DeeperShadows":
		 			$thiscardlist = T13Types::array_flatten(T13Types::magicsquares($cardspread['Array']));
		 			$afacet=true;
		 			$show = count($cardspread['Array'])>2;
		 			$rhtml.="<!-- show:{$show} ".json_encode($cardspread['Array']).' :'.json_encode($thiscardlist).'-->';
		 		break;
		 		default:
		 		$thiscardlist =array_reverse(T13Types::array_flatten(T13Types::magicsquares($cardspread['Array'])));
		 		$afacet=false;
		 		$show=true;
		 		break;
		 	}
		 	//$thiscardlist=T13Types::array_flatten($thiscardlist);
		 	$count=count($thiscardlist);
		 	$jc =json_encode( $thiscardlist );
		 	$rhtml.="<!-- thiscardlist: {$count}: {$jc} --><div class=\"t13ne-conflict-side\">";

		 	if ($show&&$count){
		 		$card=$thiscardlist[0];
			 	$significator=self::getSignificator($card, 'side side'.$index);
			 	$rhtml.=self::getCard($card, 'jsvg', 1, 1);
			 	if ($index==1){
			 		$rhtml.='<p>The Significator of the Pressed side often does not represent the Pressed side as they are most often intended to be Player Characters), but rather represents something that the Plot cannot do well (if at all). It is also worth noting that for the Pressed side any suggestions for Embodiments can be altered to meet the needs of your party.</p>';
			 	}
			 	$rhtml.=$significator['Html'];
		 		$rhtml .='<div class="t13ne-tablewrap"><table class="t13ne-table"><thead><tr><th> Suggested Embodiment </th><th> Suggested Facet </th></tr></thead><tbody>';
		 		for ($i=0;$i<$cardspread['Max_Facets'];$i++){
					
		 		$cardno=$thiscardlist[(2*$i)%$count];
		 		$cn =((2*$i)+1)%$count;
                if (isset($thiscardlist[$cn])){
                    $cardnext=$thiscardlist[$cn];
                }else{
                    $cardnext=self::quickCard(1,1);
                }
				if (is_array($cardnext)) {
					$cardnext = $cardnext[0];
				}
				$jcn= json_encode( $cardno);
				$jccn = json_encode($cardnext);
		 		$jc = json_encode( $thiscardlist );
					error_log('cardnext=' . $jccn);
		 		$rhtml.="<!-- cardno:{$jcn} (cn)({$cn})cardnext:{$jccn}: of:$jc //-->";
		 		$cart = self::$yarn[$cardno];
		 		$ce =T13Types::$conflictEmbodiments[$cart['Conflict_Embodiment']];
		 		$fe =T13Types::$embodimentTypes[$cart['Facet_Embodiment']];
		 		if (isset(self::$cards[$cardnext]['Facet'])){
                    $fa = self::$cards[$cardnext]['Facet'];
                }else{
                    //somethings gone wrong return all facets.
                    $fa='Awe, Burden, Craft, Dominion, Enigma, Fury, Gossamer, Heresy, Inertia, Jeer, Key, Liberty, Miasma, Nature, Orthodox, Phoenix, Quiet, Rook, Sin, Trial, Virtue, Wyrd, Yonder, Zeal';
                }
		 		$ret = T13Facets::getThisCardFacet($fa,$afacet,$fe);
		 		$carte = self::$cards[$cardno];
		 		$suit = $carte['IconSuit'];
		 		$id =$carte['Card'].' '.$suit.' '.$carte['Unicode'];
		 		$carte=self::$cards[$cardnext];
		 		$suit = $carte['IconSuit'];
		 		$sid =$carte['Card'].' '.$suit.' '.$carte['Unicode'];
		 		$rhtml.="<tr><td ><details><summary>{$ce['Type']}&nbsp;</summary><p class=\"t13ne-description\"> {$ce['Description']} </p></details> &nbsp; <details><summary>{$fe['Type']} ( {$id} ) </summary><p class=\"t13ne-description\"> {$fe['Description']} </p></details></td><td> {$ret} ( {$sid} )</td></tr>";
		 		}
	 		$rhtml.='</tbody></table></div></div>';
		 	}else{
		 		$rhtml.="Side not indicated by spread.</div>";
		 	}

	}
	return $rhtml.'</div></section>';
	}
	static public function getCardName($card){
        $card=abs($card%53);
		return '<details><summary>'.self::$yarn[$card]['Yarn_Name'].'</summary><p>'.self::$yarn[$card]['Yarn_Description'].'</p></details>';

	}
	static public function getAspectText($card,$aspect='Beat_Type'){
        $card =abs($card%53);
		$title=false;
		$thisaspect =false;
		$text='';
        $rules ='';
		switch ($aspect){
			//PathColour,Bulmas,AnimalCategory,Bodypart,Notes
			case 'PathColor':
			case 'color':
			case 'pathcolor':
				$title = 'Path Color';
				$thisaspect =  self::$lea[$card]['PathColour'];
				break;
			case 'PathColour':
			case 'colour':
			case 'pathcolour':
				$title = 'Path Colour';
				$thisaspect = self::$lea[$card][$aspect];
				break;
			case 'Bulmas':
			case 'bulmas':
				$title = 'Bulmäs';
				$thisaspect =  self::$lea[$card][$aspect];
				break;
			case 'Animal':
			case 'animal':
			case 'Animalpath':
			case 'AnimalCategory':
				$title = 'Animal Category';
				$thisaspect = self::$lea[$card]['AnimalCategory'];
				break;
			case 'Bodypart':
			case 'BodyPart':
			case 'Body_Part':
			case 'bodypart':
				$title = 'Body Part';
				$thisaspect =  self::$lea[$card]['Bodypart'];
				break;
			case 'Notes':
			case 'lea-notes':
			case 'LeaNotes':
				$title = 'Notes';
				$thisaspect = self::$lea[$card]['Notes'];
				break;
			case 'Ages':
			case 'socialAge':
			case 'Social':
				$title = 'Social Age';
				$thisaspect = self::$socialAgeCards[$card]['Type'];
				$text = self::$socialAgeCards[$card]['Description'];
				$rules = self::$socialAgeCards[$card]['Rules'];
			break;
			case 'Hook_Aspect':
				$title = 'Hook Aspect';
				$thisaspect = self::$yarn[$card]['Hook_Aspect'];
				$text =self::$yarn[$card]['Aspect_Description'];
			break;
			case 'Gain':
				$title = 'Gain';
				$thisaspect = '';
				$text =self::$yarn[$card]['Gain'];
				break;
			case 'Beat_Type':
				$title='Beat Type';
				$thisaspect = T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Type'];
				$text = T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Description'] .' <p><strong>Rule</strong>  — '.T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Rule'].'</p>';
                $rules=T13Types::$sceneBeatTypes[self::$yarn[$card]['Beat_Type']]['Rule'];
			break;
			case 'Conflict_Embodiment':
				$title='Conflict Embodiment';
				$thisaspect = T13Types::$conflictEmbodiments[self::$yarn[$card]['Conflict_Embodiment']]['Type'];
				$text = T13Types::$conflictEmbodiments[self::$yarn[$card]['Conflict_Embodiment']]['Description'];
				break;
			case 'Facet_Embodiment':
				$title='Facet Embodiment';
				$thisaspect = T13Types::$embodimentTypes[self::$yarn[$card]['Facet_Embodiment']]['Type'];
				$text = T13Types::$embodimentTypes[self::$yarn[$card]['Facet_Embodiment']]['Description'];
				break;
			case 'About':
			case 'Info':
			case 'Vector':
			case 'Alternate':
			case 'Detail':
				$title=$aspect;
				if (array_key_exists($aspect, self::$revelations[$card])){
					$thisaspect = self::$revelations[$card][$aspect];
					$text = self::$revelations[$card][$aspect.'_Description'];
				}else{
					$thisaspect = '?';
					$text = 'An error has occurred';
				}


			break;
			case 'Ordeal_Type':
			case 'Ordeal_Spread':
			case 'Stages':
			case 'Stakes':
			case 'Test':
			case 'Obstacles':
			case 'Suggested_Action':
			case 'Stage':
			case 'Motional':
			case 'Fight':
			case 'Tide_of_Battle':
				$title=str_ireplace('_', ' ', $aspect);
				$text=false;
				if (array_key_exists($aspect, self::$ordeals[$card])){
					$thisaspect = self::$ordeals[$card][$aspect];
					if (isset(self::$ordeals[$card][$aspect.'_Description'])){
						$text = self::$ordeals[$card][$aspect.'_Description'];
					}
					if (isset(self::$ordeals[$card][$aspect.'_Text'])){
						$text = self::$ordeals[$card][$aspect.'_Text'];
					}
					foreach (T13Types::$ordealTypes as $key=>$ot){
						if ($ot['Type']==$thisaspect){
							$text =$ot['Description'];
							break 2;
						}
					}

				}else{
					$thisaspect = '?';
					$text = 'An error has occurred';
				}

			break;
			case 'Test':
				$title='Test';
				$text=false;
				if (array_key_exists($aspect, self::$ordeals[$card])){
					$thisaspect = self::$ordeals[$card][$aspect];
					if (isset(self::$ordeals[$card][$aspect.'_Description'])){
						$text = self::$ordeals[$card][$aspect.'_Description'];
					}
					if (isset(self::$ordeals[$card][$aspect.'_Text'])){
						$text = self::$ordeals[$card][$aspect.'_Text'];
					}
					foreach (T13Types::$ordealTypes as $key=>$ot){
						if ($ot['Type']==$thisaspect){
							$text =$ot['Description'];
							break 2;
						}
					}

				}else{
					$thisaspect = '?';
					$text = 'An error has occurred';
				}

			break;
			case 'Obstacle_Type':
			case 'Obstacle':
				$title = 'Obstacle';
				$thisaspect = self::$obstacles[$card]['Type'];
				$text = self::$obstacles[$card]['Description'];
			break;
            case 'Stress':
                $title='Stress';
                $thisaspect = self::$stressCards[$card]['Type'];
                $text = self::$stressCards[$card]['Description'];
                $rules = self::$stressCards[$card]['Rules'];
                break;
                case 'Trauma':
                $title='Trauma';
                $thisaspect = self::$traumaCards[$card]['Type'];
                $text = self::$traumaCards[$card]['Description'];
                $rules = self::$traumaCards[$card]['Rules'];
                break;
			case 'Difficulty':
				$title = 'Difficulty';
				$thisaspect = self::$cards[$card]['Pips'];
				$text = 'Pips added.';
			break;
			default:
			if (array_key_exists($aspect, self::$yarn[$card])){
				$title=str_ireplace('_', ' ', $aspect);
				$thisaspect = self::$yarn[$card][$aspect];
				if (array_key_exists($aspect.'_Description', self::$yarn[$card])){
					$text = self::$yarn[$card][$aspect.'_Description'];
				}
				if (array_key_exists($aspect.'_Text', self::$yarn[$card])){
					$text = self::$yarn[$card][$aspect.'_Text'];
				}
			}else{
				if (array_key_exists($aspect,T13Facets::$facets[0])||$aspect=='QSF'||$aspect=='SF'||$aspect=='OTH'){
					$fa = self::$cards[$card]['Facet'];
					$text = T13Facets::getThisCardFacet($fa,0,$aspect);
					if ($aspect=='QSF'){$aspect = 'Quest / Success / Failure';}
					if ($aspect=='SF'){$aspect = 'Success / Failure';}
					if ($aspect=='OTH'){$aspect = 'Ordeal / Test / Hurdle';}
					$title=str_ireplace('_', ' ', $aspect);

					$thisaspect = str_ireplace('_', ' ', $aspect);

						//a facet aspect
					}
			}

			break;
		}
		return array('Title'=>$title,'Text'=>$text, 'Aspect'=>$thisaspect, 'Rules'=>$rules);

	}
	static public function getCardAspectHTML($card, $aspect='Beat_Type', $displaycard=true){
		$title = 'something';
        $card=intval($card);
		$ret ='<div class="t13ne-card-and-text"><!-- card:'."{$card}- aspect:{$aspect}- displaycard:{$displaycard}- -->";
		$theseaspects=array();
		if ($displaycard){
			$ret .= self::getCard($card%53, 'jsvg', 1, 1);
		}

		if (T13Types::contains ($aspect,'/')){
			$ret.='<!--debug / -->';
			$title=str_ireplace('_', ' ', $aspect);
			$title=str_ireplace('/', ' / ', $title);
			$aspect=str_ireplace('Quest/Success/Failure', 'QSF', $aspect);
			$aspect=str_ireplace('Success/Failure', 'SF', $aspect);

			if (T13Types::contains(strtolower($aspect),'test')){
				$testText = self::getAspectText($card,'Test');
				$ret.='<!-- testText='.$testText['Title'].' -->';
			}
			$aspect=str_ireplace('Ordeal/Test/Hurdle', 'OTH', $aspect);

			$aspects=T13Types::arrayify($aspect);

			$texts =array();
			foreach ($aspects as $in=>$asp){
				$ret.='<!-- aspect loop= '.$asp.' -->';
				$theseaspects[] = self::getAspectText($card,$asp);
				 // = $at['Aspect']
				//$titles[] = $at['Title'];
				//$texts[] =$at['Text'];
			}
		}else{
			$ret .='<!-- these '.$aspect.' -->';
			$theseaspects[]=self::getAspectText($card,$aspect);
			if (is_array($theseaspects)&&isset($theseaspects[0]['Title'])){
				$title = $theseaspects[0]['Title'];
			}else{
                error_log("Title not found for these aspects:  ".json_encode($theseaspects));
            }
		}
		//$ret.='<!-- '.json_encode( $title ).' =='.json_encode( $theseaspects ).' -->'; whoo that broke stuff...
		$ret .='<article class="t13ne-card-text">';
		if (strlen($title)>1){$ret.='<strong>'.$title.'</strong> — ';}
		if ($displaycard){
			$ret.= '<details><summary>'.self::$yarn[$card]['Yarn_Name'].'</summary><p>'.self::$yarn[$card]['Yarn_Description'].'</p>';
			$close='</details>';
			$open = ['<section>','</section>'];
		}else{
			$ret.='<section>';
			$close ='</section>';
			$open = ['<details>','</details>'];
		}
		if (isset($theseaspects[0]['Aspect'])){
			$ret.='<!-- isset theseaspects[0] -->';
			foreach($theseaspects as $ind=>$as){

					if ($as['Title']!==$as['Aspect']&&$as['Title']!=''){
						$ret .='<!-- title != aspect -->'.$open[0].'<summary><strong>'.$as['Title'].': '.$as['Aspect'].'</strong></summary>';
					}else{
						$ret .='<!-- title == aspect -->'.$open[0].'<summary><strong>'.$as['Aspect'].'</strong></summary>';
					}
					
					if (T13Types::contains($as['Title'],'Test')&&isset($testText)){$as['Text'].='<p>'.self::$yarn[$card]['Yarn_Name'].' also emphasizes this '.$testText['Title'].': '.$testText['Aspect'].' '.$testText['Text'].'</p>';}
					if (strlen($as['Text'])>1){
						$ret.='<!-- text --> — '.$as['Text'];
					}
					$ret.=$open[1];
				}
			}else if (isset($theseaspects['Aspect'])){

				$ret .='<!-- aspect '.json_encode( $theseaspects ).'-->'.$theseaspects['Aspect'].' ';
				if (strlen($theseaspects['Text'])>1){
					$ret.='<!-- text --> — '.$theseaspects['Text'];
				}
			}
		$ret.=$close.'</article>';
		return  "".$ret.'</div>';
	}
    static public function cardTable($aspect,$suits="all"){
        $aspects=T13Types::arrayify($aspect);
        $min =0;
        $max=12;
        $ret='<div class="t13ne-tablewrap"><table class="t13ne-table t13ne-cardtable">';
        $ret.='<thead><tr><th>Card</th>';
        foreach($aspects as $aspect){
            $css=strtolower($aspect);
			$asp =self::getAspectText(0,$aspect);
            $ret.="<th class=\"t13ne-{$aspect}\">{$asp['Title']}</th>".(($asp['Rules']&&$asp['Rules']!=='')?('<th>Rules</tr>'):(''));
        }
        $ret.='</tr></thead><tbody>';

        switch ($suits){
            case "0":
            case "diamonds":
            $min=0;
            $max=12;
            break;
            case "1":
            case "hearts":
            $min=13;
            $max=25;
            break;
            case "2":
            case "clubs":
            $min=26;
            $max=38;
            break;
            case "3":
            case "spades":
            $min=39;
            $max=51;
            break;
            case "4":
            case "wild":
            $min=52;
            $max=53;
            break;
             case "all":
            case "All":
            default:
            $min=0;
            $max=53;
            break;
        }
        for ($i=$min; $i <= $max ; $i++) {
            $cor = self::$cards[$i%54];
            $yar = self::getCardName($i);
            $suit = T13Suits::getSuit($cor['Suit'],'Full');
             $ret.="<tr><td class=\"t13ne-card\"><span class=\"t13ne-unicard\">{$cor['Unicode']}</span> {$cor['Card_Corner']}{$suit} <span class=\"t13ne-textpips\">({$cor['Pips']})</span><div class=\"t13ne-yarn\">{$yar}</div></td>";
            foreach ($aspects as $aspect){
                 $asp = self::getAspectText($i,$aspect);
                 $ret.='<td class="t13ne-description"><strong>'.$asp['Aspect'].'</strong>'.(($asp['Text']!=='')?(' — '.$asp['Text']):('')).'</td>'.(($asp['Rules']!=='')?('<td class="t13ne-rules">'.$asp['Rules'].'</td>'):(''));
            }
            $ret.='</tr>';
        }
        $ret.='</table></div>';
        return $ret;
    }

	static public function scenespread($cardlist){
		$ret = '<section class="t13ne-spread scene"><h4>Scene</h4>';
		// scene significator
		$sig =array_shift($cardlist);
		$significator=self::getSignificator($sig, 'scene');
		$ret.=self::getCard($sig, 'jsvg', 1, 1);
		$ret.=$significator['Html'];
		//Beat Type
		$beat = array_shift($cardlist);
		$ret.= self::getCardAspectHTML($beat,'Beat_Type');
		return $ret.'</section>';
	}
	static public function revelationspread($cardlist, $loreout=false){
		if ($loreout){
			$ret = '<section class="t13ne-spread lore"><h4>Lore</h4>';
		}else{
			$ret = '<section class="t13ne-spread revelation"><h4>Revelation</h4>';
		}

		$cards=$cardlist;
		$characterScale = T13StatBlock::getCurrentCharScale();
		$nlc = count($cardlist);
		$lore = array();

		$displaylist='<div class="t13ne-cards">';
		foreach ($cardlist as $index => $card) {
            $card=abs($card%54);
			$cards[$index] = array('Card'=>self::getCard($card, 'jsvg', 1, 1), 'Name'=>self::getCardName($card),'About'=>self::getCardAspectHTML($card,'About',false), 'Info'=>self::getCardAspectHTML($card,'Info',0),'Vector'=>self::getCardAspectHTML($card,'Vector',0),'Alternate'=>self::getCardAspectHTML($card,'Alternate',0),'Detail'=>self::getCardAspectHTML($card,'Detail',0), 'Facet'=> T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],0,'Facet'), 'Lore'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Lore'), 'Tangle'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Tangle'),'Umbral'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Umbral'),'Nimbed'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Nimbed'),'Annex_Root'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Annex_Root'),'Annex_Channel'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Annex_Channel'),'Pips'=>self::$cards[$card]['Pips'],'Hitch'=>T13Facets::getThisCardFacet(self::$cards[$card]['Facet'],false,'Hitch'));
			$displaylist .= '<span class="t13ne-card-and-name">'.$cards[$index]['Card'].$cards[$index]['Name'].'</span>';
			//$lore.='<p class="t13ne-lore"><span class="t13ne-facet-lore"><strong>Annex Proficiency Facet</strong> — '.$cards[$index]['Facet'].'<strong>Boon</strong> — '.T13Boons::writeBoon((11+$cards[$index]['Pips']+$characterScale)).'</span><span class="t13ne-hitch-lore"><strong>Hitch</strong> &mdash '.T13Facets::getThisCardFacet(self::$cards[$card]['Hitch'].'<strong>Boon</strong> — '.writeBoon($cards[$index]['Pips']+$characterScale-1).'</span></p>';
		}
		//$lore.='<div class="t13ne-lore"></div>';
		$ret .= $displaylist.'</div>';
		foreach ($cards as $index =>$cardarr){
			$ind = $index+1;
			if (!$loreout){
				$ret .="<div class=\"t13ne-revelation rev{$index}\"><h5>Revelation #{$ind}</h5>";
			}else{
				$ret.= '<div class="t13ne-lore lore{$index}">';
			}
			$lore[$index] = '';

			if ($nlc>1){
				$i = $index%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['About'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Lore type</strong> — '.$cards[$i]['Lore'].'</div>';
			}
			if ($nlc>1){
				$i= ($index+1)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Vector'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Lore Hitch</strong> — '.$cards[$i]['Hitch'].'</div>';
			}
			if ($nlc>2){
				$i=($index+2)%$nlc;
				if (!$loreout){
					$ret .='<div class="t13ne-flex"><span class="t13ne-choose"><strong>Choose from</strong></span><div class="t13ne-flexbox-pair">'.$cards[$i]['Info'].'</div><div class="t13ne-flexbox-pair">';
					$ret .=$cards[$i]['Alternate'].'</div></div>';
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Root Facet</strong> — '.$cards[$i]['Annex_Root'].'</div>';
			}

			if ($nlc>3){
				$i =($index+3)%$nlc;
				if (!$loreout){
					$ret .='<div class="t13ne-flex"><span class="t13ne-choose"><strong>Choose from</strong></span><div class="t13ne-flexbox-triple">'.$cards[($index+3)%$nlc]['Alternate'].'</div><div class="t13ne-flexbox-triple">';
					$ret .= $cards[$i]['Info'].'</div><div class="t13ne-flexbox-triple">';
					$ret .= $cards[$i]['Detail'].'</div></div>';
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Channel Facet</strong> — '.$cards[$i]['Annex_Channel'].'</div>';
			}
			if ($nlc>4){
				$i=($index+5)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Tangle</strong> — '.$cards[$i]['Tangle'].'</div>';
			}
			if ($nlc>5){
				$i=($index+6)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Umbral</strong> — '.$cards[$i]['Umbral'].'</div>';
			}
			if ($nlc>6){
				$i=($index+7)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Nimbed</strong> — '.$cards[$i]['Nimbed'].'</div>';
			}
			if ($nlc>7){
				$i=($index+8)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Nimbed</strong> — '.$cards[$i]['Nimbed'].'</div>';

			}
			if ($nlc>8){
				$i=($index+9)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Umbral</strong> — '.$cards[$i]['Umbral'].'</div>';

			}
			if ($nlc>9){
				$i=($index+10)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Nimbed</strong> — '.$cards[$i]['Nimbed'].'</div>';

			}
			if ($nlc>10){
				$i=($index+11)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Nimbed</strong> — '.$cards[$i]['Nimbed'].'</div>';

			}
			if ($nlc>11){
				$i=($index+12)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Nimbed</strong> — '.$cards[$i]['Nimbed'].'</div>';
			}
			if ($nlc>12){
				$i=($index+13)%$nlc;
				if (!$loreout){
					$ret .=$cards[$i]['Detail'];
				}
				$lore[$index] .='<div class="t13ne-lore"><strong>Umbral</strong> — '.$cards[$i]['Umbral'].'</div>';

			}
			if (!$loreout){
				$ret.='<details class="t13ne-lore"><summary><strong>Revelation #'.$ind.' Lore</strong></summary>'.$lore[$index].'</details>';
			}else{
				$ret.='<details class="t13ne-lore"><summary><strong>Lore #'.$ind.'</strong></summary>'.$lore[$index].'</details>';
			}

			$ret.='</div>';
		}

		return $ret.'</section>';
	}
	static public function gainspread($cards){
		$ret = '<section class="t13ne-spread gain"><h4>Gain</h4>';
		if (is_array($cards)){
			$card = $cards[0];
		}else{
			$card =$cards;
		}
		$ret .= self::getCardAspectHTML($card,'Gain',1);
		return $ret.'</section>';

	}
	static public function difficultysubspread($cards){
		$diff =0;
		$ret = '<div class="t13ne-flex"><div class="t13ne-choose"><strong>Difficulty</strong></div>';

		foreach($cards as $index=>$card){
            $card=abs($card%54);
			$diff+=self::$cards[$card]['Pips'];
			$ret .= self::getCardAspectHTML($card,'Difficulty',1);
		}
		$ret.= '<p class="t13ne-diff-box"><strong>Total</strong><span class="t13ne-difficulty">'.$diff.'</span></p>';
		return $ret.'</div>';
	}

	static public function hookspread ($cards, $side){
		$ret ='<section class="t13ne-spread hook"><h5>Hook for '.$side.'</h5>';
        if (is_array($cards)&&isset($cards[0])&&isset($cards[1])){
            $ret.=self::getCardAspectHTML($cards[0],'Hook',1);
            $ret.=self::getCardAspectHTML($cards[1],'Hook_Aspect',1);
        }else{
            $ret.=self::getCardAspectHTML($cards,'Hook',1);
            $ret.=self::getCardAspectHTML($cards,'Hook_Aspect',1);
        }

		return $ret .='</section>';
	}
	static public function framespread ($cards, $nosides=0){
		$ret = '<section class="t13ne-spread frame"><h3>Frame</h3>';
		// Hooks ... one per Side (how do we know number of Sides that is set by the Conflict...)
		// well... the number of cards should be calculable...
		// Hooks and Hook aspect cards needs a pair per side (minimum of 2 for PC side)
		// Revelation (which is a grand Revelation not 3 card so at least 5 Cards)
		$cn = count($cards);
		if (!$nosides){
			switch ($cn){
			case 0:
			case 1:
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:return null;
			case 7:
			case 8:
				$nosides=1;
			break;
			case 9:
			case 10:
				$nosides=2;
			break;
			case 11:
			case 12:
				$nosides=3;
			break;
			case 13:
			case 14:
				$nosides=4;
			break;
			case 15:
			case 16:
				$nosides=5;
			break;
			case 17:
			case 18:
				$nosides=6;
			break;
			case 19:
			case 20:
				$nosides=7;
			break;
			default:
				$nosides=8;
			break;
			}
		}else{
			switch($nosides){
				case 1:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$revelation =self::revelationspread(array_slice($cards,2));
				break;
				case 2:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$revelation =self::revelationspread(array_slice($cards,4));
				break;
				case 3:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$hook['DeeperShadows'] = self::hookspread(array_slice($cards,4,2),'Deeper Shadows');
				$revelation =self::revelationspread(array_slice($cards,6));
				break;
				case 4:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$hook['DeeperShadows'] = self::hookspread(array_slice($cards,4,2),'Deeper Shadows');
				$hook['Above'] = self::hookspread(array_slice($cards,6,2),'Above');
				$revelation =self::revelationspread(array_slice($cards,8));
				break;
				case 5:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$hook['DeeperShadows'] = self::hookspread(array_slice($cards,4,2),'Deeper Shadows');
				$hook['Above'] = self::hookspread(array_slice($cards,6,2),'Above');
				$hook['Internal'] = self::hookspread(array_slice($cards,8,2),'Internal');
				$revelation =self::revelationspread(array_slice($cards,10));
				break;
				case 6:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$hook['DeeperShadows'] = self::hookspread(array_slice($cards,4,2),'Deeper Shadows');
				$hook['Above'] = self::hookspread(array_slice($cards,6,2),'Above');
				$hook['Internal'] = self::hookspread(array_slice($cards,8,2),'Internal');
				$hook['Shadows'] = self::hookspread(array_slice($cards,10,2),'Shadows');
				$revelation =self::revelationspread(array_slice($cards,12));
				break;
				case 7:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$hook['DeeperShadows'] = self::hookspread(array_slice($cards,4,2),'Deeper Shadows');
				$hook['Above'] = self::hookspread(array_slice($cards,6,2),'Above');
				$hook['Internal'] = self::hookspread(array_slice($cards,8,2),'Internal');
				$hook['Below'] = self::hookspread(array_slice($cards,10,2),'Below');
				$hook['Shadows'] = self::hookspread(array_slice($cards,12,2),'Shadows');
				$revelation =self::revelationspread(array_slice($cards,14));
				break;
				default:
				$hook['Pressed'] = self::hookspread(array_slice($cards,0,2),'Pressed');
				$hook['Dominant'] = self::hookspread(array_slice($cards,2,2),'Dominant');
				$hook['DeeperShadows'] = self::hookspread(array_slice($cards,4,2),'Deeper Shadows');
				$hook['Above'] = self::hookspread(array_slice($cards,6,2),'Above');
				$hook['Internal'] = self::hookspread(array_slice($cards,8,2),'Internal');
				$hook['Below'] = self::hookspread(array_slice($cards,10,2),'Below');
				$hook['External'] = self::hookspread(array_slice($cards,12,2),'External');
				$hook['Shadows'] = self::hookspread(array_slice($cards,14,2),'Shadows');
				$revelation =self::revelationspread(array_slice($cards,16));
				break;

			}
		}

		foreach($hook as $ind=>$hk){
			$side = strtolower($ind);
			$ret.="<div class=\"t13ne-hook {$side}\">{$hk}</div>";
		}
		$ret.="<div class=\"t13ne-revelation\">{$revelation}</div>";
		return $ret .'</section>';



	}

	static public function weftspread($cards, $side='Pressed'){
		$ret='<section class="t13ne-spread weft"><h4>Weft Spread for '.$side.'</h4><details><summary></summary>';
		// recoiling 0-3 cards based on the previous Warp
		$ret.='<p class="t13ne-recoiling"><h5>Recoiling</h5> Recoiling takes place following the previous Warp (or whatever). Recoiling affects all Characters with between 0 and 3 cards as a Psych attack, based on the events that the Character experienced. If they were attacked and shot at then they will probably have a Negative Emotional reaction to that bad experience, if they were cheered at and hailed as heroes then they may have a Positive Emotional reaction to that. The number of cards and the nature of the attack will vary based upon the events that have happened, watching your friend\'s brain redecorate a wall is a lot worse of an experience that watching mud spray on a wall, although perhaps not as bad as having to shoot a stranger so that his head redecorates (although that will depend very much on genre and tone).</p>';
		$ret.='<p class="t13ne-sweeping"><h5>Sweeping</h5> The Character / Side ('.$side.') now makes some kind of sweeping gain, revelation, rest time or some sort of helpful break. '.self::getCardAspectHTML($cards[0],'Sweeping',1).'</p>';
		$ret.= '<p class="t13ne-picking"><h5>Picking</h5>The Characters must now be offered a choice between two or more goals or even Warps that they might choose between. These can be represented by a choice between two cards which you can use as a choice of Quests that will become the next "The Ends".'.self::getCardAspectHTML($cards[1],'Quest/Fray',1).'or'.self::getCardAspectHTML($cards[2],'Quest/Fray',1).'</p>';
		// Sweeping 1 card
		// Picking offers a choice of at least two Warps

		return $ret.'</details></section>';
	}
	static public function warpspread($cards, $side='Pressed'){
		$ret='<section class="t13ne-spread warp"><h4>Warp Spread for  '.$side.'</h4><details><summary></summary>';
		// 2 cards 1 Fray 1 Snag
		$carda = array_shift($cards);
		$cardb = array_shift($cards);
		$ret.='<p class="t13ne-the-ends"><h5>The Ends</h5>The Character / Side ('.$side.') should set their own Ends for the Warp. These are usually defined as a Quest (often chosen in the previous Weft\'s Picking, but stated here and now for the Yarn-Teller and Referee.</p>';
		$ret.='<p class="t13ne-the-fray"><h5>The Fray</h5>The Character / Side ('.$side.') suffers during through a problem or combination of problems.'.self::getCardAspectHTML($carda,'Fray',1).'</p>';
		$ret.='<p class="t13ne-the-snag"><h5>The Snag</h5>The Character / Side ('.$side.') suffers some additional penalty of problem that may compound the problem of the Fray or render it meaningless later.'.self::getCardAspectHTML($cardb,'Snag',1).'</p>';
		return $ret.'</details></section>';
	}
	 static public function loomspread($cards, $nosides=2){
		$ret='<section class="t13ne-spread loom"><h3>Loom Spread</h3>';
		$sides = ['Pressed', 'Dominant', 'DeeperShadows','Above','Internal','Below','External','Shadows'];
		// number of sides set by size of hand? Not sure this might need to be set another way because it is beginning to seem important.
		$i=0;
		while (count($cards)>5){
			$thecards = array(array_shift($cards),array_shift($cards));
			$ret.=self::warpspread($thecards,$sides[$i%$nosides]);
			$thecards = array(array_shift($cards),array_shift($cards),array_shift($cards));
			$ret.=self::weftspread($thecards,$sides[$i%$nosides]);
			$i++;
		}
		$thecards = array(array_shift($cards),array_shift($cards));
		$ret.=self::warpspread($thecards,'Pressed');
		$thecards = array(array_shift($cards),array_shift($cards),array_shift($cards));
		$ret.=self::weftspread($thecards,'Pressed');
		return $ret.'</section>';
	}
	static public function obstaclespread($cards){
		$ret='<section class="t13ne-spread obstacle"><h5>Obstacle Spread</h5>';
		$card = array_shift($cards);
		$ret.=self::getCardAspectHTML($card,'Obstacle',1);
		$card = array(array_shift($cards),array_shift($cards),array_shift($cards));;
		$ret.=self::difficultysubspread($card);

		return $ret.'</section>';
	}
	static public function stagespread($cards){
		$ret = '<section class="t13ne-spread stage"><h4>Stage</h4>';
		//stage
		//stage type 1
		$nc=count($cards)-1;
		if ($nc>-1){
			$card = array_shift($cards);
			$ret.=self::getCardAspectHTML($card,'Stage',1);
		}
		//stage diff 1-3
		if ($nc>1){
			$diff = array(array_shift($cards),array_shift($cards),array_shift($cards));
			$ret.=self::difficultysubspread($diff);
		}
		if ($nc>4){
			//bigger stages tend to have obstacles
			$ret.=self::obstaclespread($cards);
		}
		//$ret .= self::getCardAspectHTML($card,'Gain',1);
		return $ret.'</section>';
	}
	static public function ordealspread($cards){
		$nc = count($cards);
		//error_log('ordeal spread :'.json_encode($cards));
		$ret='<section class="t13ne-spread zenith"><h4>Ordeal Spread</h4>';
		$card = array_shift($cards);
		$ret.=self::getCardAspectHTML($card,'Stakes',1);
		$card = array_shift($cards);
		$ret.=self::getCardAspectHTML($card,'Ordeal_Spread',1);
		$card = array_shift($cards);
		$ret.=self::getCardAspectHTML($card,'Obstacles',1);
		$card = array_shift($cards);
		$ret.=self::getCardAspectHTML($card,'Stages',1);

		if ($nc>5){
			$card = array_shift($cards);
			$ret.=self::getCardAspectHTML($card,'Motional',1);
		}
		if ($nc>6){
			$card = array_shift($cards);
			$ret.=self::getCardAspectHTML($card,'Test',1);
		}
		if ($nc>7){
			$card = array_shift($cards);
			$ret.=self::getCardAspectHTML($card,'Suggested_Action',1);
		}
		return $ret.'</section>';
	}
	static public function zenithspread($cards, $nosides){
		$ret='<section class="t13ne-spread zenith"><h3>Zenith Spread</h3>';
		$gain = array_pop($cards);
		$ret.=self::ordealspread($cards,$nosides);
		$ret.=self::gainspread($gain);

		return $ret.'</section>';

	}
	static public function loguespread($cards, $side){
		$ret='<section class="t13ne-spread logue"><h3>Logue Spread for '.$side.'</h3>';
		$warp=array(array_pop($cards),array_pop($cards));
		$weft =array(array_pop($cards),array_pop($cards), array_pop($cards));
		$ret.=self::revelationspread($cards);
		$ret.='<p class="t13ne-description">Plus either one or both of...</p>';
		$ret.=self::warpspread($warp, $side);
		$ret.=self::weftspread($weft, $side);

		return $ret.'</section>';
	}

	static public function threecardspread($cards){
		$ret='<section class="t13ne-spread 3card t13ne-flex"><h3>3 Card Situation / Plight Spread</h3>';
		$ret.='<!-- cards='.json_encode( $cards ).' -->';
		$ret.='<!-- tao-0-'.json_encode(self::$cards[$cards[0]]['Tao']).' -->';
		$ret.='<!-- tao-1-'.json_encode(self::$cards[$cards[1]]['Tao']).' -->';
		$ret.='<!-- tao-2-'.json_encode(self::$cards[$cards[2]]['Tao']).' -->';
		$ret.='<p class="t13ne-description">The 3 card spread can be used to create Trigrams for small "Quests" called Plights as required.</p>';

		$ret.='<div class="t13ne-flexbox-triple"><h4>History</h4>'.self::getCardAspectHTML($cards[0],'History/Obstacle',1);
		$ret.='</div><div class="t13ne-flexbox-triple"><h4>Present</h4>'.self::getCardAspectHTML($cards[1],'Situation/Quest',1);
		$ret.='</div><div class="t13ne-flexbox-triple"><h4>Solution</h4>'.self::getCardAspectHTML($cards[2],'Solution/Ordeal',1);
		$trigrams = T13IChing::getTrigrams(T13IChing::calculateLogicalTrigram([
			[self::$cards[$cards[0]]['Tao'][0],self::$cards[$cards[1]]['Tao'][0]],
			[self::$cards[$cards[1]]['Tao'][1],self::$cards[$cards[2]]['Tao'][0]],
			[self::$cards[$cards[2]]['Tao'][1],self::$cards[$cards[0]]['Tao'][1]],
		],));
		$ret.='</div><!-- trigrams-'.json_encode($trigrams).' -->';

		$tri_text = T13IChing::displayTrigrams($trigrams,true, ['Beginning','Ending']);
		$ret.='<div class="t13ne-trigrams"><h4>Trigrams</h4>'.$tri_text;
		$ret.='</div>';


		return $ret.'</section>';
	}
	static public function sixcardspread($cards){
		$ret='<section class="t13ne-spread t13ne-quest t13ne-flex"><h3>6 Card Quest Spread</h3>';
		$ret.='<!-- cards='.json_encode( $cards ).' -->';
		$ret.='<!-- tao-0-'.json_encode(self::$cards[$cards[0]]['Tao']).' -->';
		$ret.='<!-- tao-1-'.json_encode(self::$cards[$cards[1]]['Tao']).' -->';
		$ret.='<!-- tao-2-'.json_encode(self::$cards[$cards[2]]['Tao']).' -->';
		$ret.='<!-- tao-3-'.json_encode(self::$cards[$cards[3]]['Tao']).' -->';
		$ret.='<!-- tao-4-'.json_encode(self::$cards[$cards[4]]['Tao']).' -->';
		$ret.='<!-- tao-5-'.json_encode(self::$cards[$cards[5]]['Tao']).' -->';

		$ret.='<p class="t13ne-description">The 6 Card spread is used to define a Quest. Each card defines a line of the two Hexagrams that the cards create. This defines the whole Present Quest Situation, and the Solution. The cards also define the History, Quest, and Solution, as well as some additional Questions the Quest asks and each line also creates an Ordeal or Test that is part of the Quest and can also define Hurdles, Obstacles, Successes and Failures as the lines and trigrams suggest.</p>';
		$logicalTgrams= array (
			[
				[self::$cards[$cards[0]]['Tao'][0],self::$cards[$cards[1]]['Tao'][0]],
				[self::$cards[$cards[1]]['Tao'][1],self::$cards[$cards[2]]['Tao'][0]],
				[self::$cards[$cards[2]]['Tao'][1],self::$cards[$cards[3]]['Tao'][0]],
			],
			[
				[self::$cards[$cards[3]]['Tao'][1],self::$cards[$cards[4]]['Tao'][0]],
				[self::$cards[$cards[4]]['Tao'][1],self::$cards[$cards[5]]['Tao'][0]],
				[self::$cards[$cards[5]]['Tao'][1],self::$cards[$cards[0]]['Tao'][1]],
			],
		);
		$trigrams = [T13IChing::getTrigrams(T13IChing::calculateLogicalTrigram($logicalTgrams[0])),T13IChing::getTrigrams(T13IChing::calculateLogicalTrigram($logicalTgrams[1]))];
		$ret.='<!-- trigrams-'.json_encode($trigrams).' -->';
		// The cards exist mainly to create the Iching for the Quest.
		$hex = T13IChing::calcHexFromTrigrams($trigrams[0][0],$trigrams[1][0]);
		$hex2 = T13IChing::calcHexFromTrigrams($trigrams[0][1],$trigrams[1][1]);
		$ret.='<!-- hex1-'.json_encode($hex).' -->';
		$ret.='<!-- hex2-'.json_encode($hex2).' -->';
		$ret.= T13IChing::displayIChing($hex,$hex2,false, true); 
		$ret.='<div class="t13ne-flexbox-triple"><h4>Line 6 : Father of Solution (Question)</h4>'.self::getCardAspectHTML($cards[5],'Question/Ordeal/Test/Hurdle/Obstacle/Success/Failure',1).'</div>';
		$ret.='<div class="t13ne-flexbox-triple"><h4>Line 5 : Solution</h4>'.self::getCardAspectHTML($cards[4],'Solution/Ordeal/Test/Hurdle/Obstacle/Success/Failure',1).'</div>';
		$ret.='<div class="t13ne-flexbox-triple"><h4>line 4 : Mother of Solution (Question)</h4>'.self::getCardAspectHTML($cards[3],'Question/Ordeal/Test/Hurdle/Obstacle/Success/Failure',1).'</div>';
		$ret.='<div class="t13ne-flexbox-triple"><h4>Line 3 : Father of Quest (Question) </h4>'.self::getCardAspectHTML($cards[2],'Question/Ordeal/Test/Hurdle/Obstacle/Success/Failure',1).'</div>';
		$ret.='<div class="t13ne-flexbox-triple"><h4>Line 2 : Quest (Situation) </h4>'.self::getCardAspectHTML($cards[1],'Situation/Ordeal/Test/Hurdle/Obstacle/Quest/Success/Failure',1).'</div>';
		$ret.='<div class="t13ne-flexbox-triple"><h4>Line 1 : Mother of Quest (History)</h4>'.self::getCardAspectHTML($cards[0],'History/Ordeal/Test/Hurdle/Obstacle/Success/Failure',1).'</div>';

		return $ret.'</section>';

	}

	static public function geasspread ($cards){
		$ret=self::revelationspread($cards, false);
		$ret.=self::sixcardspread($cards);
		return $ret;
	}

	 static public function dealspread ($spread, $cards=false, $handsize =1, $nosides=8){
	 	// think this is a bit broken as it needs to work with the deck continuously.
	 	$sides = ['Pressed', 'Dominant', 'DeeperShadows','Above','Internal','Below','External','Shadows'];
	 	if ($cards&&$cards!=='all'){
	 		//cards are set so don't draw
           // error_log('Cards='.json_encode($cards));
	 	}else{
	 		$cards = self::drawHand($handsize);
	 	}


		if ($spread){
			$nope = "<p class=\"t13ne-card-error\">Your hand is only {$handsize} cards and this spread needs more cards. In fact it needs ";
			$cc = count($cards);
			if ($cc<$handsize){return "something has gone wrong and spread = {$spread}, cards= {$cards}, handsize = {$handsize}, and number of sides = {$nosides}";}
			switch (strtolower($spread)){
				case 'simple':
				case 'conflict(2x2)':
				case '2x2':
				if ($cc>4){$cards = array_slice($cards, 0, 5);}
				if ($handsize<5){return $nope.'5 cards</p>';}
				return self::conflictspread('Simple', $cards);
				break;
				case 'internalised':
				case 'internalized':
				case 'conflict(3x3)':
				case '3x3':
				if ($cc>9){$cards = array_slice($cards, 0, 10);}
				if ($handsize<10){return $nope.'10 cards</p>';}
				return self::conflictspread('Internalised', $cards);
				break;
				case 'balanced':
				case 'conflict(4x4)':
				case '4x4':
				if ($cc>16){$cards = array_slice($cards, 0, 17);}
				if ($handsize<17){return $nope.'17 cards</p>';}
				return self::conflictspread('Balanced', $cards);
				break;
				case 'complete':
				case 'conflict(5x5)':
				case '5x5':
				if ($cc>25){$cards = array_slice($cards, 0, 26);}
				if ($handsize<26){return $nope.'26 cards</p>';}
				return self::conflictspread('Complete', $cards);
				break;
				case 'complex':
				case 'conflict(6x6)':
				case '6x6':
				if ($cc>36){$cards = array_slice($cards, 0, 37);}
				if ($handsize<37){return $nope.'37 cards</p>';}
				return self::conflictspread('Complex', $cards);
				break;
				case 'exceptional':
				case 'conflict(7x7)':
				case '7x7':
				if ($cc>49){$cards = array_slice($cards, 0, 50);}
				if ($handsize<50){return $nope.'50 cards</p>';}
				return self::conflictspread('Exceptional', $cards);
				break;
				case 'scene':
				if ($cc>2){$cards = array_slice($cards, 0,2 );}
				if ($handsize<2){return $nope.'2 cards</p>';}
				return self::scenespread($cards);
				case 'revelation':
				if ($cc>12){$cards = array_slice($cards, 0,12);}
				if ($handsize<3){return $nope.'3 cards</p>';}
				return self::revelationspread($cards);
				break;
				case 'gain':
				if ($cc>1){$cards = array_slice($cards,0,1);}
				if ($handsize<1){return $nope.'1 card</p>';}
				return self::gainspread($cards);
				break;
				case 'stage':
				if ($cc>7){$cards = array_slice($cards,0,7);}
				if ($handsize<4){return $nope.'4 cards</p>';}
				return self::stagespread($cards);
				break;
				case 'frame':
				if ($cc>26){$cards = array_slice($cards,0,26);}
				if ($handsize<7){return $nope.'7 cards</p>';}
				return self::framespread($cards, $nosides);
				break;
				case 'hook':
				if ($cc>2){$cards =array_slice($cards,0,2);}
				if ($handsize<2){return $nope.'2 cards</p>';}
				return self::hookspread($cards,'This Character\'s Side');
				break;
				case 'loom':
				if ($cc>50){$cards = array_slice($cards,0,50);}
				if ($handsize<10){return $nope.'10 cards</p>';}
				return self::loomspread($cards,$nosides);
				break;
				case 'zenith':
				if ($cc>10){$cards = array_slice($cards,0,10);}
				if ($handsize<6){return $nope.'6 cards</p>';}
				return self::zenithspread($cards,$nosides);
				break;
				case 'logue':
				if ($cc>17){$cards = array_slice($cards,0,18);}
				if ($handsize<7){return $nope.'7 cards</p>';}
				return self::loguespread($cards,$sides[$nosides%8]);
				break;
				case 'ordeal':
				if ($cc>50){$cards = array_slice($cards,0,50);}
				if ($handsize<5){return $nope.'5 cards</p>';}
				return self::ordealspread($cards);
				break;
				case 'obstacle':
				if ($cc>4){$cards = array_slice($cards,0,5);}
				if ($handsize<2){return $nope.'2 cards</p>';}
				return self::obstaclespread($cards);
				break;
				case 'weft':
				if ($cc>3){$cards = array_slice($cards,0,3);}
				if ($handsize<3){return $nope.'3 cards</p>';}
				return self::weftspread($cards,$sides[$nosides%8]);
				break;
				case 'warp':
				if ($cc>2){$cards = array_slice($cards,0,2);}
				if ($handsize<2){return $nope.'2 cards</p>';}
				return self::warpspread($cards,$sides[$nosides%8]);
				break;
				case 'past-present-future':
				case 'situation':
                case 'plight':
				case 'tri':
				case '3card':
				if ($cc>3){$cards = array_slice($cards,0,3);}
				if ($handsize<3){return $nope.'3 cards</p>';}
				return self::threecardspread($cards);
				break;
				case 'quest':
				case '6card':
				if ($cc>6){$cards = array_slice($cards,0,6);}
				if ($handsize<6){return $nope.'6 cards</p>';}
				return self::sixcardspread($cards);
				break;
				case 'geas':
				case '6cards':
				if ($cc>6){$cards = array_slice($cards,0,6);}
				if ($handsize<6){return $nope.'6 cards</p>';}
				return self::geasspread($cards);
				break;
				default:
				return 'spread not found';
				break;
			}
		}
	}
}
<?php

/**
 * Register all actions and filters for the plugin
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 */

/**
 * Register all actions and filters for the plugin.
 *
 * Maintain a list of all hooks that are registered throughout
 * the plugin, and register them with the WordPress API. Call the
 * run function to execute the list of actions and filters.
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */

class T13_Ne_Database {
	protected $session;
	protected $current;
	protected $tablecache;
	protected $User;
	protected $Creator;
	const VIEWPUBLIC=1;
	const VIEWMINE=2;
	const VIEWMYPLAYERS=4;
	const VIEWMYREFS=8;
	const VIEWMYAUTHORS=16;
	const VIEWMYSUPERREFS=32;
	const EDITMINE=64;
	const EDITPLAYERS=128;
	const EDITREFS=256;
	const EDITAUTHORS=512;
	const EDITSUPERREF=1024;
	const EDITPUBLIC=2048;
	const PACKAGES=2000;
	public function __construct() {

		$this->session = array();
		$this->current = array();
		$this->tablecache = array();
		$this->Creator = array('Creator', 'Member','Founder', 'User','Events');

	}
	public function install($package){
		if (is_admin()){
		  	if (current_user_can( 'activate_plugins' )){
				return $this->installPackage($package['package']);
			} return array('message'=>'You do not have permissions to activate this plugin.');
		}
		return array('message'=>'Hey you&#039;re not in the admin section!');
	}
	private function installPackage($package){
		global $wpdb;
		$retvar=array('message'=>'Attempting '.$package, 'package'=>$package, 'error'=>$wpdb->last_query);
		require_once dirname(__FILE__).'/partials/t13-install-db.php';
		return $retvar;
	}
	
	private function addAnnex($name, $type, $boon, $die, $game, $public=false, $profslist=[], $statblock=1, $scope=1, $auxname=false, $creator=0){
		//var_dump($boon);
		//sanitize input;
		$user=$this->currentUser();
		$name=$this->Sanitize($name);
		$type=$this->Sanitize($type);
		$boon=$this->Sanitize($boon);
		$die=$this->Sanitize($die);
		//$facet=$this->Sanitize($facet);
		$game=$this->Sanitize($game);
		$auxname=$this->Sanitize($auxname);
		$public=(bool)$public&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('publish_posts');
		//$spec=(bool)$spec&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('edit_others_pages');
		if (!isset($creator)){$creator=$user->Users_Id;}
		//add row
		$stats=$this->get_Stats($statblock);
		$annexno=0;
		$calc=array();
		$cost=0;
		$coster="Annex: ";
		//add proficiencies for new Annex to both root and channel facet
		if (is_array($profslist)){
			$profacc=0;
			foreach ($profslist as $prof){
				if (is_array($prof)){
					$prof=(object)$prof;
					//Array means add the Prof
					$profno=$this->addProf($prof->Prof_Name, $prof->Prof_Description, $prof->Prof_Facet, $game, $prof->Prof_Public, $this->contains($prof->Prof_Name, '(Specif'), $prof->Prof_Scope);
					foreach ($stats as $sp){
						if ($sp->Facet==$prof->Prof_Facet){
							$prof->Prof_Boon = $sp->Facet_Boon;
							
						}
						if ($sp->Antifacet==$prof->Prof_Facet){
							$prof->Prof_Boon = $sp->Antifacet_Boon;
							
						}
					}
					if (!isset($prof->Annex_F_Type)){
						switch ($profacc){
							case 0:
								$prof->Annex_F_Type=1;
								$root=$prof->Prof_Facet;
								$calc[]=$prof->Prof_Boon;
							break;
							case 1:
								$prof->Annex_F_Type=2;
								$channel=$prof->Prof_Facet;
								$calc[]=$prof->Prof_Boon;
							break;
							default:
							 if ($profacc % 3==0){
							 	$prof->Annex_F_Type=$this->RNG(3,6);
							 	$calc[]=$prof->Prof_Boon;
							 	$cost+=1-$prof->Prof_Boon;
							 	$coster.=" - Umbral Boon ({$prof->ProfBoon}) ";
							 }else{
							 	$prof->Annex_F_Type=$this->RNG(7,10);
							 	$cost+=1+$prof->Prof_Boon;
							 	$coster.=" + Nimbed Boon ({$prof->ProfBoon}) ";
							 }
							break;
						}
					}
				}
				if ($boon=='Calculate'){
					$boon=0;
					$value=0;
					foreach($calc as $cal){
						$value=$value+(int)$this->getBoonValue($cal);
					}
					$boon=(int)$this->getBoonReduced($value);
				}
				
				$dice=$this->getDiceForBoon($boon,$die);
				if (!$annexno){$annexno=$this->addRowTo(array('Annex_Name'=>$name,'Annex_Geometry'=>$this->getGeometryFromString($name), 'Annex_Type'=>$type, 'Annex_Boon'=>$boon,  'Annex_Dice'=>$dice->Dice_Id, 'Annex_Game'=>$game, 'Annex_Public'=>$public, 'Annex_Creator'=>$user->Users_Id), 'Annexes', TRUE);}
				$this->addProfToAnnex($annexno,$profno, $prof->Annex_F_Type, $prof->Prof_Boon);	
				$profacc++;
			}
		}
	$this->addProf($name, 'This Proficiency added automatically for the '.$name.' Annex Root.', $root, $game, $public, FALSE, $scope);
	$this->addProf($name, 'This Proficiency added automatically for the '.$name.' Annex Channel.', $channel, $game, $public, FALSE, $scope);
	if ((bool)$auxname && $name!=$auxname){
		$this->addProf('Use: '.$auxname, 'This Proficiency added automatically for the '.$auxname.' Descendant.', $root, $game, $public, FALSE, $scope);
		$this->addProf('Use: '.$auxname, 'This Proficiency added automatically for the '.$auxname.' Descendant.', $channel, $game, $public, FALSE, $scope);
	}
	$cost+=(int)$boon;
				$coster.= " + Annex Boon ({$boon}) ";
				$ctype=(($type-1)%4);
				$add=$this->getChiCost('Annexes', $ctype);
				$cost += $add;
				$coster.= " + annextype={$ctype}: ({$add})  ";
	return array('Annexno'=>$annexno,'Cost'=>$cost, 'Coster'=>$coster);

	}
	private function addBaseDice($dicebucket){
		//we're going to need a base array of dice....
		$dice=array();
		
		//now we need to build the dice table...
		foreach ($dicebucket as $die){
			for($i=1;$i<8;$i++){
				$dice[]=array('Die'=>"{$i}{$die['Die']}", 'Minimum_Score'=>(float)$die['Minimum_Score']*(float)$i, 'Maximum_Score'=>(float)$die['Maximum_Score']*(float)$i, 'Average_Score'=>(float)$die['Average_Score']*(float)$i);
				$r=$i;
				while ($r>0){
					$dice[]=array('Die'=>"{$i}{$die['Die']}-{$r}", 'Minimum_Score'=>(float)$die['Minimum_Score']*(float)$i-(float)$r, 'Maximum_Score'=>(float)$die['Maximum_Score']*(float)$i-(float)$r, 'Average_Score'=>(float)$die['Average_Score']*(float)$i-(float)$r);
					$r--;
				}
				for ($j=1;$j<6;$j++){
					$dice[]=array('Die'=>"{$i}{$die['Die']}+{$j}", 'Minimum_Score'=>(float)$die['Minimum_Score']*(float)$i+(float)$j, 'Maximum_Score'=>(float)$die['Maximum_Score']*(float)$i+(float)$j, 'Average_Score'=>(float)$die['Average_Score']*(float)$i+(float)$j);
				}
			}

		}
		$lastboon=$this->get_LastRow('Boons');
		foreach($dice as $die){
		
			$die['Boon']=$this->addBoonDice((object)$die);
			if ($die['Average_Score']<=$lastboon->Score){
				$this->addRowTo($die, 'Dice', TRUE);
			}
		}
	}
	private function addBoonDice($die){
		$baseboon=(int)$this->getBoonValue($die->Average_Score);
		$topboon=(int)$this->getBoonValue($die->Average_Score+0.5);
		$mod=$topboon-$baseboon;
		$min=$this->getBoonValue($die->Minimum_Score);
		$max=$this->getBoonValue($die->Maximum_Score);
		return (int)$baseboon+(($this->RNG($min,$max))%$mod);
	}
	private function addBoonRow(){
		global $wpdb;
		$tb=$this->tablePrefix('Boons');
		$last=$wpdb->get_var("SELECT MAX(Boons_Id) FROM {$tb}",0,0);
		
		$row=array();
		for ($i=0;$i<999;$i++){
			$boon=$last+$i;
			if ($boon==0){
				$value=0;$score=(float)0.0;$draw=0;$boon=0;
			}else{
				$value=$this->getBoonValue($boon);
				$score=$this->getBoonReduced($boon, TRUE, TRUE);
				$draw=$this->getBoonReduced(floor($score), TRUE, FALSE);
			}
			$row[]=array('Draw'=>$draw, 'Score'=>(float)$score, 'Boon'=>$boon, 'Value'=>$value);
		}	
		return $this->addRows($row,$tb);
}
	
	private function addDescendant($name, $desc, $incarna, $game, $descentype=1, $statblock=1, $public =FALSE, $scope=1, $profs=[], $annexes=[], $handicaps=[], $costmods=[], $creator=0){
		$basecost=0;
		$coster="";
		
		$user=$this->currentUser();
		$name=$this->Sanitize($name);
		$desc=$this->Sanitize($desc);
		$incarna=$this->Sanitize($incarna);
		$game=$this->Sanitize($game);
		$descentype=$this->Sanitize($descentype);
		$statblock=$this->Sanitize($statblock);
		$public=(bool)$public&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('publish_posts');
		$scope=$this->Sanitize($scope);
		if ($scope==10){
			$scope = 9+(int)($user->UserCode&&self::EDITPUBLIC&&current_user_can('update_core'));
		}
		if (!isset($creator)){$creator=$user->Users_Id;}
		$basecost+=count($profs)-2;
		
		switch ($descentype){
			case 1:
			case 2:
			case 5:
			case 6:
			if (is_array($annexes)){
				if (isset($annexes[0]->Annex_Type)){
					$mincost=$this->getChiCost('Descendants',1+(($annexes[0]->Annex_Type)-1)%4);
				}
			}else{
				if (isset($annexes->annex_Type)){
					$mincost=$this->getChiCost('Descendants',1+(($annexes->Annex_Type)-1)%4);
				}
			}
			break;
			case 3:
			case 7:
			$mincost=$this->getChiCost('Descendants', 'Location');
			$basecost+=$mincost;
			$coster.=" + $mincost={$mincost} ";
			break;
			case 4: 
			case 8:
			$mincost=$this->getChiCost('Descendant','Pact Descendant');
			$basecost+=$mincost;
			$coster.=" + $mincost={$mincost} ";
			break;
		}
		
		$args=array('Descendant_Name'=>$name, 'Descendant_Geometry'=>$this->getGeometryFromString($name), 'Descendant_Incarna'=>$incarna,'Descendant_Game'=>$game,'Descendant_Type'=>$descentype, 'Descendant_Statblock'=>$statblock, 'Descendant_Creator'=>$creator, 'Descendant_Public'=>$public, 'Descendant_Description'=>$desc, 'Descendant_Scope'=>$scope);
		$val=$this->generateContainerPost(array('Title'=>'Descendant_Name', 'Game_Genre'=>'T13 Core', 'Thumbnail'=>'T13-Logo','Container'=>'Descendant_Post', 'Status'=>'publish'),$args, 'Descendants');
		$desno=$this->addRowTo($val,'Descendants', TRUE);
		$retr=array('Descendant'=>$desno);
		$retr['profs'][]=$this->addProf('Descendant: '.$name, 'This Proficiency added automatically for the '.$name.' Descendant.'.$desc, $incarna, $game, $public, FALSE, $scope);
		$ac=0;
		if (is_array($annexes)){
			foreach ($annexes as $annex){
				if (is_array($annex)){
					$ann=(object)$annex;
					//array means add...
					if (!isset($ann->Annex_Name)){$ann->Annex_Name=$name;}
					$annexno=$this->addAnnex($ann->Annex_Name, (int)$ann->Annex_Type, (int)$ann->Annex_Boon, $ann->Annex_Dice, $game, $public, $profs, $statblock, $scope, $name, $creator);
				}else{
					$annexno['Annexno']=$annex;
					$annexno['Cost']=$this->getAnnexCost($annex);
				}

				$retr['desc-annexes'][]=$this->addRowTo(array('Descendant'=>$desno,'Annex'=>$annexno['Annexno']), 'Descendant_Annexes', TRUE);
				$basecost+=((bool)$ac)?$this->getBoonReduced($annexno['Cost']):$annexno['Cost'];
				$coster.= " + annexno['Cost']= {$annexno['Cost']} ({$annexno['Coster']}) ";
				$ac++;
			}
		}
		if (is_array($handicaps)){
			foreach ($handicaps as $hand){
				if (is_array($hand)){
					$hand=(object)$hand;
					$handno=$this->addHandicap($hand->Handicap_Name, $hand->Handicap_Description, $hand->Handicap_Facet, $game, $hand->Handicap_Type, $public, FALSE, $scope, $creator);

				}else{$handno=$hand;}
				$retr['desc-handicaps'][]=$this->addRowTo(array('Descendant'=>$desno, 'Handicap'=>$handno, 'Handicap_Boon'=>$hand->Handicap_Boon), 'Descendant_Handicaps', TRUE);
				$basecost-=$hand->Handicap_Boon;
				$coster.= " - handis={$hand->Handicap_Boon} ";
			}
		}
		$maxmod=(int)max(array_values($costmods));
		$retr['maxmod']=$maxmod;
		switch ($maxmod){
			case 1:
			$normalcost= max(array($mincost,(int)$this->getBoonReduced($basecost)));
			$retr['normal']=$normalcost;
			$retr['costmod']="boon reduced";
			break;
			case 2:
			$normalcost= max(array($mincost,2*(int)$this->getBoonReduced($basecost)));
			$retr['normal']=$normalcost;
			$retr['costmod']="boon reduced x2";
			break;
			case 3:
			$normalcost= max(array($mincost,(int)$basecost));
			$retr['normal']=$normalcost;
			$retr['costmod']="base";
			break;
			case 4:
			$normalcost=max(array($mincost, 2*(int)$basecost));
			$retr['normal']=$normalcost;
			$retr['costmod']="base x2";
			break;
			case 5:
			$normalcost=max(array($mincost, 3*(int)$basecost));
			$retr['normal']=$normalcost;
			$retr['costmod']="base x3";
			break;
			case 6:
			$normalcost=max(array($mincost, (int)$this->getBoonValue((int)$basecost)));
			$retr['normal']=$normalcost;
			$retr['costmod']="base value";
			break;

		}
		$retr['coster']=$coster;
		$retr['desc-cost']=$this->addRowTo(array('Descendant'=>$desno,'Base_Cost'=>$basecost, 'Commonality'=>$costmods['Commonality'],'State'=>$costmods['State'], 'Age'=>$costmods['Age'], 'Normal_Cost'=>$normalcost),'Descendant_Costs', TRUE);
		return $retr;
	}
	private function addHandicap($name,$desc,$facet, $game=1, $type=1, $public=TRUE, $spec=TRUE,  $scope=1, $creator=0){
		$user=$this->currentUser();
		$name=$this->Sanitize($name);
		$desc=$this->Sanitize($desc);
		$facet=$this->Sanitize($facet);
		$game=$this->Sanitize($game);
		$type=$this->Sanitize($type);
		$public=(bool)$public&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('publish_posts');
		$spec=(bool)$spec&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('edit_others_pages')&&$this->contains($name,'(Specif');
		$scope=$this->Sanitize($scope);
		if ($scope==10){
			$scope = 9+(int)($user->UserCode&&self::EDITPUBLIC&&current_user_can('update_core'));
		}
		if (!isset($creator)){$creator=$user->Users_Id;}
		//sanitize inputs;
		//add rows to Handicaps 
		$args=array('Handicap_Name'=>$name, 'Handicap_Geometry'=>$this->getGeometryFromString($name), 'Handicap_Facet'=>$facet,'Handicap_Game'=>$game, 'Handicap_Type'=>$type, 'Handicap_Creator'=>$creator, 'Handicap_Public'=>$public, 'Handicap_Specify'=>$spec, 'Handicap_Description'=>$desc, 'Handicap_Scope'=>$scope);
		$handno=$this->addRowTo( $args,'Handicaps', TRUE);
		$this->addProf($name, "Proficiency added automatically for Handicap: <q>{$name}</q> . {$desc} ", $facet, $game, $public, $spec, $scope, $creator);
		return $handno;
	}
	private function addProf($name, $desc, $facet, $game, $public =FALSE, $spec=FALSE, $scope=1, $creator=0){
		$user=$this->currentUser();
		$name=$this->Sanitize($name);
		$desc=$this->Sanitize($desc);
		$facet=$this->Sanitize($facet);
		$game=$this->Sanitize($game);
		$public=(bool)$public&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('publish_posts');
		$spec=(bool)$spec&&$user->UserCode&&self::EDITPUBLIC&&current_user_can('edit_others_pages')&&$this->contains($name, '(Specif');
		$scope=$this->Sanitize($scope);
		if ($scope==10){
			$scope = 9+(int)($user->UserCode&&self::EDITPUBLIC&&current_user_can('update_core'));
		}
		
		if (!isset($creator)){$creator=$user->Users_Id;}
		//sanitize inputs;
		//add row to Profs..
		$args= array('Prof_Name'=>$name,'Prof_Geometry'=>$this->getGeometryFromString($name),'Prof_Facet'=>$facet, 'Prof_Game'=>$game, 'Prof_Creator'=>$creator, 'Prof_Public'=>$public, 'Prof_Specify'=>$spec, 'Prof_Description'=>$desc, 'Prof_Scope'=>$scope);
		$ret=$this->addRowTo( $args,'Proficiencies',TRUE);
		return $ret;
	}
	private function addProfToAnnex($annex, $prof, $type, $boon=13){
		return $this->addRowTo(array('Annex'=>$annex, 'Proficiency'=>$prof, 'Annex_F_Type'=>$type, 'Prof_Boon'=>$boon), 'Annex_Proficiencies', TRUE);
	}
	private function addStatPair($facet, $boon, $joined=TRUE, $anti=-1, $antiboon=-1){
		if ($joined){$antiboon=27-$boon;}
		else{
			if ($antiboon>-1){
				$antiboon++;
			}}
		$boon++;
		if ($anti==-1){
			switch ($facet){
				case 1:
				$sp=array('Facet'=>1,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>10, 'Antifacet_Boon'=>$antiboon);
				break;
				case 2:
				$sp=array('Facet'=>7,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>2, 'Antifacet_Boon'=>$boon);
				break;
				case 3:
				$sp=array('Facet'=>3,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>14, 'Antifacet_Boon'=>$antiboon);
				break;
				case 4:
				$sp=array('Facet'=>4,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>23, 'Antifacet_Boon'=>$antiboon);
				break;
				case 5:
				$sp=array('Facet'=>14,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>5, 'Antifacet_Boon'=>$boon);
				break;
				case 6:
				$sp=array('Facet'=>6,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>17, 'Antifacet_Boon'=>$antiboon);
				break;
				case 7:
				$sp=array('Facet'=>7,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>14, 'Antifacet_Boon'=>$antiboon);
				break;
				case 8:
				$sp=array('Facet'=>8,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>15, 'Antifacet_Boon'=>$antiboon);
				break;
				case 9:
				$sp=array('Facet'=>24,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>9, 'Antifacet_Boon'=>$boon);
				break;
				case 10:
				$sp=array('Facet'=>1,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>10, 'Antifacet_Boon'=>$boon);
				break;
				case 11:
				$sp=array('Facet'=>11,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>5, 'Antifacet_Boon'=>$antiboon);
				break;
				case 12:
				$sp=array('Facet'=>12,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>22, 'Antifacet_Boon'=>$antiboon);
				break;
				case 13:
				$sp=array('Facet'=>16,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>13, 'Antifacet_Boon'=>$boon);
				break;
				case 14:
				$sp=array('Facet'=>3,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>14, 'Antifacet_Boon'=>$boon);
				break;
				case 15:
				$sp=array('Facet'=>8,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>15, 'Antifacet_Boon'=>$boon);
				break;
				case 16:
				$sp=array('Facet'=>16,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>13, 'Antifacet_Boon'=>$antiboon);
				break;
				case 17:
				$sp=array('Facet'=>6,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>17, 'Antifacet_Boon'=>$boon);
				break;
				case 18:
				$sp=array('Facet'=>20,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>18, 'Antifacet_Boon'=>$boon);
				break;
				case 19:
				$sp=array('Facet'=>19,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>21, 'Antifacet_Boon'=>$antiboon);
				break;
				case 20:
				$sp=array('Facet'=>20,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>18, 'Antifacet_Boon'=>$antiboon);
				break;
				case 21:
				$sp=array('Facet'=>19,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>21, 'Antifacet_Boon'=>$boon);
				break;
				case 22:
				$sp=array('Facet'=>12,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>22, 'Antifacet_Boon'=>$boon);
				break;
				case 23:
				$sp=array('Facet'=>4,'Facet_Boon'=>$antiboon, 'Joined'=>$joined, 'Antifacet'=>23, 'Antifacet_Boon'=>$boon);
				break;
				case 24:
				$sp=array('Facet'=>24,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>9, 'Antifacet_Boon'=>$antiboon);
				break;
			}
		}else{
			$sp=array('Facet'=>$facet,'Facet_Boon'=>$boon, 'Joined'=>$joined, 'Antifacet'=>$anti, 'Antifacet_Boon'=>$antiboon);
		}
		return $this->addRowTo($sp, 'Statpairs', TRUE);
	}
	private function addRowTo($row, $table, $log=true){
		global $wpdb;
		$user=$this->currentUser();
		$tb=$this->whichTable($table);
		//should be trusted data stuff it in.
			$wpdb->insert($tb[0], $row);
			$retu=$wpdb->insert_id;
			// if ($this->tableExists('Events')&&$log){
			// 	$d= $this->addRowTo(array('Eventable'=>'Added', 'Description'=>"User added: row({$retu}) to {$table}", 'EventType'=>2, 'DateTime'=> current_time( 'mysql', 1 ), 'User'=>$user->Users_Id), 'Events', FALSE);
			// }
		return $retu;
	}
	private function addRows($rows = array(), $tb='') {
    global $wpdb;
    // Setup arrays for Actual Values, and Placeholders
    $values = array();
    $place_holders = array();
    $query_columns = implode(',', array_keys($rows[0]));
    $pv =array_values($rows[0]);
    $placeholders=array();
    foreach ($pv as $key=>$val){
    	if (is_float($val)){
    		$placeholders[]='%f';
    	}elseif(is_integer($val)){
    		$placeholders[]='%d';
    	}else{
    		$placeholders[]='%s';
    	}
    }
    if (2*count($placeholders)<count($rows)){
	    $ph=implode(',',$placeholders);	
	    $query = "INSERT INTO {$tb} ({$query_columns}) VALUES ";
            foreach($rows as $row){
                $values=array_merge($values,array_values($row));       
                $place_holders[]="({$ph})";
            }
	    $query .= implode(', ', $place_holders);
    	if($wpdb->query($wpdb->prepare($query, $values))){
    	    return true;
    	} else {
    	    return false;
    	}
    }else{
    	foreach($rows as $row){
    		$this->addRowTo($row,$tb, false);
    	}
    }
}
	private function addSwayRow(){
		global $wpdb;
		$tb=$this->tablePrefix('Sway_Table');
		$last=$wpdb->get_var("SELECT MAX(Sway_Table_Id) FROM {$tb}",0,0);
		$rows=array();
		for ($i=0;$i<=999;$i++){
			$it=$last+$i;
			$rows[]=array('Sway'=>$it*2, 'Chi'=>$it, 'Yarn'=>$this->getBoonReduced($it));
		}
		return $this->addRows($rows,$tb);
	}
	private function addTable($package,$table, $columns, $indices, $foreignkeys, $help, $values=null, $stuff=false){
		global $wpdb;
		$id=$table.'_Id';
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		$tb=$this->tablePrefix($table);
		$charset=$wpdb->get_charset_collate().";";
		$this->dropTable($tb);
		$addIndex="";
		if ($indices!=""){
			if (is_string($indices)){
			  $addIndex=", KEY {$indices} ({$indices}) ";
			}else if(is_array($indices)){
			  $addIndex=" ";
			  foreach($indices as $index){
			   $addIndex.=",
			   KEY {$index} ({$index}) ";
			  }
			}
		}
		$addForeign="";
		if ($foreignkeys!=""){
			if(is_array($foreignkeys)){
				$addForeign=" ";
				foreach($foreignkeys as $fkey){
					$addForeign.=", 
					FOREIGN KEY ({$fkey['LocalCol']}) REFERENCES {$this->tablePrefix($fkey['Table'])}({$fkey['ForCol']})";
				}
			}
		}
		$sql_pass="";
		$sql_schema=array();
		foreach($columns as $col){
			//var_dump($col);
			$sql_pass.=" {$col['Name']} {$col['Type']} NULL DEFAULT NULL,
			";
			$sql_schema[]=$col;
		}
		$addForeign.=", 
					FOREIGN KEY ({$fkey['LocalCol']}) REFERENCES {$this->tablePrefix($fkey['Table'])}({$fkey['ForCol']})";
		$sql = "CREATE TABLE {$tb} ( {$id} INTEGER NOT NULL AUTO_INCREMENT ,
		{$sql_pass} 
		 PRIMARY  KEY   ({$id})
		{$addIndex} 
		{$addForeign}) COLLATE {$charset}";
		dbDelta( $sql );
		if ((bool)count($values)){
			if ($help['ContainerPost']){
				foreach($values as $val){
					$val=$this->generateContainerPost($help['ContainerPost'],$val, $table);
					$id=$this->addRowTo($val,$table,true);
				}
			}else{
				$this->addRows($values, $tb);
			}
		}
		if ($this->tableExists('Events')){
			$d= $this->addRowTo(array('Eventable'=>'Installation', 'Description'=>'System Installed Table: '.$table.' as part of Package: {'.$package.'}', 'EventType'=>1, 'DateTime'=> current_time( 'mysql', 1 ), 'User'=>1), 'Events', TRUE);
		}
		//and we keep a record...

		$d=$this->addRowTo(array('Tablename'=>$table, 'Description'=>$help["Description"], 'Tooltip'=>$help["Tooltip"], 'JSchema'=>json_encode($sql_schema), 'JKeys'=>json_encode($foreignkeys),'HelpText'=>$help["HelpText"], 'Code'=>$help["Code"], 'ContainerPost'=>(bool)$help['ContainerPost'], 'Container'=>$help['ContainerPost']['Container'], 'DisplayRow'=>$help['DisplayRow'], 'Template'=>$help['Template']), $this->tablePrefix("TableHelp"), TRUE);

	}
	private function calculateHandicapTier($facet,$boon,$statblock){
				$stats=$this->get_Stats($statblock);
				foreach ($stats as $sp){
					if ($facet==$sp->Facet){$tierboon=$sp->Facet_Boon;}
					if ($facet==$sp->Antifacet){$tierboon=$sp->Antifacet_Boon;}
				}
				$tier=1;
				if ($boon>$tierboon/2){$tier=2;}
				if ($boon>$tierboon){$tier=3;}
				return $tier;
	}
	private function canISeeThis($input){
		//was way too slow...
		return ($input);		
	}
	private function contains($haystack,$needle){
		if (is_string($needle)){
			return (bool)stripos(" ".$haystack, $needle);
		}else{
			$ret=0;
			foreach((array)$needle as $need){
				if((bool)stripos(" ".$haystack, $need)){
					return TRUE;
				}
			}
		}
		return FALSE;
	}

	public function crunchNumbers($num){
		while ($num>13){
			$num=array_sum(str_split($num));
		}
		return $num;
	}
	public function currentUser(){
		//echo('current user');
		if (isset($this->User)){
			return $this->User;
		}else{
			// meant for the system to return the current User.
			if ($this->tableExists("Users")){
					$current_user = wp_get_current_user();
				if ( 0 == $current_user->ID ) {
		   			 // Not logged in.
					return NULL;
				} else {
		    		// Logged in.
		    		$this->User=$this->get_Row("Users","Wp_id =".$current_user->ID);
		    		if (!$this->User && $GLOBALS['T13NE_Installed']>=self::PACKAGES){
		    			//new user?
		    			$curr=wp_get_current_user();
		    			$newuser=array('UserCode'=>self::VIEWPUBLIC|self::VIEWMINE|self::EDITMINE, "WP_id"=>$curr->ID, 'eMail'=>$curr->user_email, 'Name'=>$curr->display_name, 'Geometry'=>$this->getGeometryFromString($curr->display_name), 'Avatar'=>get_avatar($curr->user_email,50));
		    			$this->addRowTo('Users',$newuser);
		    			$this->User=$this->get_Row("Users","Wp_id =".$current_user->ID);
		    		}
		    		if ($this->tableExists('Group_Members')){
			    		$this->User->Groups=array_column($this->get_Rows('Group_Members', 'Group_Member', $this->User->Users_Id),'Game_Group');
			    	}
		    		return $this->User;		 
				}
			}
		}
	}
	
	public function dropAll($pass){
		$mess="";
		if (($pass>0)&&is_admin()&&current_user_can( 'activate_plugins' )){
			$allposts= get_posts( array('post_type'=>T13Types::$post_type,'numberposts'=>-1) );
			$count=count($allposts);
			$counter=100;
			foreach ($allposts as $eachpost) {
				if(($counter)&&$count){
					$counter--;
					wp_delete_post( $eachpost->ID, true );
				}else{
					$mess=count($allposts).' Remain, Reset Again!';
					return array('message'=>'T13 Posts removed '.$mess, 'installationpackage'=>0,'script'=>'window.reload();'.json_encode(T13Types::$post_type), 'debug'=>json_encode(T13Types::$post_type));
				}
			}

		}
		return array('message'=>'All T13 Posts removed :'.$mess, 'installationpackage'=>0,'script'=>'window.reload();');
	}
	private function dropTable($table){
		global $wpdb;
		$tb=$this->tablePrefix($table);
		$wpdb->query("SET FOREIGN_KEY_CHECKS=0;");
		$wpdb->query("DROP TABLE IF EXISTS {$tb}");
		$wpdb->query("SET FOREIGN_KEY_CHECKS=1;");
	}
	private function findGeo($element){
		$jschema=json_decode($element['Table']->JSchema);
		foreach ($jschema as $scheme){
			foreach ($scheme as $key=>$value){
				if ($this->contains($value, "geo")){
					return $value;
				}
			}
		}
		return 0;
	}
	private function findReferences($reftable, $refRow, $DataLevel, $normalmode=TRUE){
		$tabs=array_reverse($this->get_TableHelp());
		$refs=array();
		
		$refs['debug']="Code: {$reftable->Code}, DataLevel: {$DataLevel}, Normal={$normalmode}";
		//searches all tables for references to the the current row.
		if (!$this->contains($reftable->Code,"Open")||!$normalmode|| $this->contains($reftable->Code,'Extend')){
			foreach($tabs as $tab){
				$refs['debug'].="\n --> Tab:{$tab->Tablename} ";
				if (isset($tab->Code)){
					if (!$this->contains($tab->Code,"Open")||!$normalmode|| $this->contains($reftable->Code,'Extend')){
						$refs['debug'].=" Tab code:{$tab->Code} or not normal mode ={$normalmode}";
						if ((!isset($tab->Container))&&($tab->Tablemname!==$reftable->Tablename)){
							$refs['debug'].='not a container / datalevel='.$DataLevel;
							//don't reference every table, or ones that have their own container page. That's just stupid.
							if (isset($tab->JKeys)){
								$Jkeys=json_decode($tab->JKeys);
								//loads the stored foreign keys.
								foreach((array)$Jkeys as $jkey){
									if (isset($reftable->Tablename)&&(isset($jkey->Table))){
										if ($reftable->Tablename==$jkey->Table&&(!$this->contains($reftable->Template,$tab->Tablename)||!$normalmode|| $this->contains($reftable->Code,'Extend'))){
											if (isset($refRow->{$jkey->ForCol})){		
											$refs['debug'].=' isset,';
											$ret=array();
												$rows=$this->getAllSecuredRows(array($tab->Tablename, $tab),$jkey->LocalCol, $refRow->{$jkey->ForCol});
												$refs['debug'].=' '.count($rows).' rows found ';
												foreach((array)$rows as $row){
													if (isset($tab->Container)){
														$refs['debug'].=' container ';
														if (isset($row->{$tab->Container})){
															$refs['debug'].='row has container';
															$row->PostId=$row->{$tab->Container};
														}		
													}
													$ret[]=$row;
												}
												$idft="{$tab->Tablename}_Id";								
												if (count($ret)>0&&isset($ret[0]->$idft)){
													if (($this->contains($tab->Code,'Extend')||($this->contains($tab->Code,'Direct')))&&($row!==$refRow && !$this->contains($tab->Code,'Boon'))){
														$refs['debug'].='Direct Table Extension';
														foreach ($row as $keyd=>$vald){
															if ($this->contains($keyd,'_Id')){
																$refs[]=array('Table'=>$tab,'Rows'=>$ret,'Direct'=>$this->getElement($tab->Tablename,$vald, $DataLevel+1));
																$refs['debug'].=" ...Added Element... ";
																break;
															}
														}
													}else{
														if ($row!=$refRow&&$tab!=$reftable){
															$refs[]=array('Table'=>$tab,'Rows'=>$ret, 'Normal'=>$normalmode);
															$refs['debug'].=" ...Added reference... ";
														}
													}									
													//$refs['debug'].=" Found something!, ";
												}	
											}else{
												$refs['debug'].="| {$reftable->Tablename} referenced but not this id,";
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		return $this->makeReferencesUnique($refs);
	}
	private function generateContainerPost($container, $value, $tables){
		// we need to make a T13-element post for this and return the $value with it added.
		if (isset($container['Game_Genre'])){
			$term = term_exists( $container['Game_Genre'],  'game-genre' );
		}
		if (!isset($term)){$term=array('term_id'=>'');}
		if (isset($container['Parent'])){
			$parent=$this->get_container_by_title($container['Parent']);
		}else{$parent=0;}
		if (isset($container['Thumbnail'])){
			$thum_id=$this->get_attachment_id_by_title($container['Thumbnail']);
		}
		$post_args=array(
        'post_content' => '<div id="container" name="container"><h2>'.str_replace('_', ' ', $tables).' Container</h2></div>
         [T13NE /]',
        'post_content_filtered' => '',
        'post_title' => $tables.': '.$value[$container['Title']],
        'post_excerpt' => '',
        'post_status' => $container['Status'],
        'post_type' => 't13-element',
        'post_parent' => $parent,
        'menu_order' => 0,
        'context' => '', 
        'tax_input'=>array($term['term_id']),
        '_thumbnail_id'=>$thum_id
    );
		$post=wp_insert_post($post_args, true);
		$retvalue=$value;
		$retvalue[$container['Container']]=$post;
		return $retvalue;
	}
	private function getAllSecuredRows($table, $getcol, $where ){
		if (!$where||!$getcol||!$table){return NULL;}
		global $wpdb;
		$tb=$this->tablePrefix($table[0]);
		if (is_numeric($where)){
			$eq='=';
			$val=(int)$where;
		}elseif(is_array($where)){
			$eq='IN';
			$val='('.implode(',',$where).')';
		}else{
			$eq='LIKE';
			$val="'%".$wpdb->esc_like($where)."%'";
		}
		$t=$table[1];
		$user=$this->currentUser();
		if ($this->contains($t->Code,'INTERNAL')||$this->contains($t->Code,'Direct'||$this->contains($t->Code, 'Open'))){
			$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$getcol} {$eq} {$val} ;"; // LIMIT {$off}, {$pagesize};
			return $wpdb->get_results($sql);
			//echo " sql: {$sql} \n  -";
		}else{
			$codes=explode(',', $t->Code);
			$wher=array();
			foreach ($codes as $code){
				if ($this->contains($code, 'Public')&&$user->UserCode&&self::VIEWPUBLIC){
					$wher[]= " {$code} > 0 ";
				}
				if ($this->contains($code, 'Scope')&&$user->UserCode&&self::VIEWPUBLIC){
					$wher[]=" {$code} > 9 ";
				}
				if($this->contains($code, $this->Creator)&&$user->UserCode&&self::VIEWMINE){
					$wher[]=" {$code}={$user->Users_Id} ";
					if (isset($user->Groups)&&$user->UserCode&&self::VIEWMYPLAYERS){
						
						$myPlayers=$this->getMyPlayers($user->Groups);
						if ((bool)count($myPlayers)){
							$wher[]=" {$code} IN (".implode(',',$myPlayers).")";
						}
					}
				}
			}	
			$w=count($wher);
			switch($w){
				case 0:
				$where='';
				break;
				case 1:
				$where= ' AND '.$wher[0];
				break;
				case 2:
				$where=" AND ({$wher[0]} OR {$wher[1]}) ";
				break;
				case 3:
				$where= " AND ({$wher[0]} OR {$wher[1]} OR {$wher[2]}) ";
				break;
				case 4:
				$where= " AND ({$wher[0]} OR {$wher[1]} OR {$wher[2]} OR {$wher[3]}) ";
				break;

			}
			$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$getcol} {$eq} {$val} {$where} "; 
			$rows = $wpdb->get_results($sql);
			$ret=array();
			reset($codes);
			foreach($rows as $row){
				foreach ($codes as $code){
					if ($this->contains($t->Code,'INTERNAL')||$this->contains($t->Code,'Direct'||$this->contains($t->Code, 'Open'))){
						$row->Editable=current_user_can('edit_published_pages');
						break;
					}
					if ($this->contains($code,$this->Creator)&&$user->UserId==$row->$code){
					   $row->Editable=current_user_can('edit_posts');
					}
					if ($this->contains($code,$this->Creator)){
						$myPlayers=$this->getMyPlayers($user->Groups);
						foreach ($myPlayers as $player){
							if ($player==$row->$code){
								 $row->Editable=current_user_can('edit_others_posts');
								 break;
							}
						}
					}
				}
				$ret[]=$row;
			}
			return $ret;
		}		
	}
	private function getAnnexCost($annex){
		$row=$this->get_Rows('Annexes','Annexes_Id', $annex);
		$cost=$row->Annex_Boon;
		$cost+=$this->getChiCost('Annexes',1+(($row->Annex_Type-1)%4));
		return $cost;
	}
	private function getBoonValue($boon){
		if ($boon<=0){
			return 0;
		}elseif ($boon>=99850){
			return 9223372036854775807;
		}else{
  			return round($boon*(pow(2,(pow($boon,(1/3))))));
  		}
  	}
    private function getBoonReduced($boon, $longhand=false, $score=false){
    	global $wpdb;
    	if (is_numeric($boon)){
    		if ($longhand&&$boon>1&&$boon<9223372036854775807){
	    		for($i=1;$i<=$boon;$i++){
	    			$b=$this->getBoonValue($i/2);
	    			if ($b<=$boon){
	    				if ($score){
	    					$ret= $i/2;
	    				}else{
	    					$ret= floor($i/2);
	    				}
	    			}
	    			if ($b>$boon){$i=$boon+1;break;}
	    		}
	    		return $ret;
    		}
    		if($boon<=2){
    			return $boon/2;
    		}else{
  		  		$tb = $this->tablePrefix('Boons');
  		  		return  $wpdb->get_var("SELECT MAX(Boon) FROM {$tb} WHERE Value<={$boon}",0,0);
   			}
   		}
   	}
 	private function getBoonScore($boon){
 		global $wpdb;
 		if (is_numeric($boon)){
 			$tb=$this->tablePrefix('Boons');
 			return $wpdb->get_var("SELECT Score FROM {$tb} WHERE Boon={$boon}",0,0);
 		}
 	}
 	private function getBoonDraw($boon){
 		global $wpdb;
 		if (is_numeric($boon)){
 			$tb=$this->tablePrefix('Boons');
 			return $wpdb->get_var("SELECT Draw FROM {$tb} WHERE Boon={$boon}",0,0);
 		}
 	}
 	private function get_attachment_id_by_title( $title ) {
	    global $wpdb;
	    $attachments = $wpdb->get_results( "SELECT * FROM $wpdb->posts WHERE post_title = '$title' AND post_type = 'attachment' ", OBJECT );
	    if ( $attachments ){
	    	$attachment_id = $attachments[0]->guid;
	    }else{
	        return 'image-not-found';
	    }
	    return $attachment_id;
	}
	private function getChiCost($type,$row){
		global $wpdb;
		$rows= $this->get_Rows('Type_Sway_Table', 'Element_Type', $type);
		if(is_string($row)){
			foreach($rows as $ro){
				foreach ($ro as $key=>$val){
					if ($row==$val){
						return $ro->Chi;
					}
				}
			}
		}elseif (is_integer($row)){
			if (isset($rows[$row])){
				return $rows[$row]->Chi;
			}
		}
	}
	private function get_container_by_title($parent){
		global $wpdb;
        $re = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->posts WHERE post_title = %s AND post_type='t13-element'", $parent ));
        return $re;
    }
    private function getDiceForBoon($boon,$preferred=NULL){
    	$score=$this->getBoonScore($boon);
    	$baseboon=$this->getBoonValue($score);
    	$dice=$this->get_Rows('Dice', 'Average_Score', $score);
    	
    	if ($dice){
    		$dice=$this->sortDice($dice, 'Die');
    		//var_dump($dice);
    		if ($preferred){
    			foreach ($dice as $die){
    				if ($preferred==$die->Die||$preferred==$die->Dice_Id)
    					{$ret=$die;}
    			}
    		}else{
	    		$ret = $dice[$this->RNG(0,$boon)%count($dice)];
	    	}
    		return $ret;
    	}
    }
    public function getDropdowns($data){
    	$drops=$data['Dropdowns'];
    	$ret=array();
    	if (is_array($drops)){
    		foreach($drops as $drop){
    			$code=$drop->code;
    			$col=$drop->column;
    			$ova=$drop->ova;
    			$spec=$drop->spec;    			
    		}
    	}
    	return $ret;
    }
    private function getElement($table_id, $row_id, $DataLevel){
    	$debug="getElement('{$table_id}','{$row_id}','{$DataLevel}')";
    	global $wpdb;
    	$table=$this->whichTable($table_id);
    	if ($this->contains($row_id, 'N')){
    		$debug.="row contains an 'N' ";
    		$row_id=str_replace('T', '', $row_id);
    		$row_id=str_replace('E', 'N', $row_id);
    		$row_id=str_replace('O', '.', $row_id);
    		$id=explode('N', $row_id);
    		$rowd=$id[0];
    		//$debug .=print_r($id,true);
    		if ($id[1]>0){
	    		$col=substr($table[1]->JSchema,$id[1],$id[2]);
	    		}else{
	    		$col=$table[1]->Tablename.'_Id';
	    	}
	    	$debug.=" col={$col}";    		
	    	$roq=$this->get_Rows($table[0], $col, $id[0]);
	    	if (isset($roq)){
	    		$debug.="roq={$roq}";
	    		foreach ($roq[0] as $key=>$val){
	    				if ($this->contains($key,"_Id")){
	    					$debug.="BAM! we have a value:{$val}";
	    					$rowd=$val;
	    					break;
	    			}
	    		}
	    	}
    				
    	}else{$rowd=$row_id;}
    	$row = $this->getSecuredRow($table,$rowd);
    	if (!$row){$debug.="something went wrong! This wasn't secured maybe";
    		if ($this->contains($table[1]->Code, "Open")){$row=$roq;}
    	}
       	$row->DataLevel=$DataLevel;
    	$el=array('Table'=>$table[1], 'Row'=>$row, 'Top'=>false,'SQL'=>$wpdb->last_query, 'debug'=>$debug);
   		
		if (isset($el['Table']->JKeys)){
			$jkeys=json_decode($el['Table']->JKeys);
			if (isset($jkeys)){
				foreach((array)$jkeys as $jkey){	
					if (isset($jkey->LocalCol)&&isset($row->{$jkey->LocalCol})){
						if (isset($el['Table']->JSchema)){
							$schema=json_decode($el['Table']->JSchema);
							foreach($schema as $scheme){
								if ($scheme->Name==$jkey->LocalCol){
									$el['debug'].='jkey localcol match'; //something wrong with the logic for post ids here....
									$ft=$this->get_Row('TableHelp', " Tablename LIKE '%{$jkey->Table}%'");
									$rid=$el['Row']->{$jkey->LocalCol};
									if ($this->contains($jkey->ForCol, '_Id')){
										$el['debug'].="forrow = rid"+$rid;
										$forrow=$rid;

									}else{
										$encopde=strpos($ft->JSchema, $jkey->ForCol).'E'.strlen($jkey->ForCol);
										$rid=str_replace('.', 'O', $rid);
										$forrow='T'.$rid.'N'.$encopde;
									}
										
									// }
									if(isset($ft->Container)){
										$el['debug'].='Container';
										$pid=$row->{$ft->Container};
									}else{
										$el['debug'].='No Container:'+json_encode($ft);
										$pid=null;
									}
									$for[]=array(
										'PostId'=>$pid,
										'Table'=>$ft,
										'ForCol'=>$jkey->ForCol,
										'ForRow'=>$forrow,
										'ForId'=>$rid,
										'LocalCol'=>$jkey->LocalCol,
										'CSS'=>$scheme->CSS,
										'Edit'=>$scheme->Edit,
										'Tooltip'=>$scheme->Tooltip,
										'TableId'=>$ft->TableHelp_Id);
								}
							}
						}
						$el['Row']->FK=$for;
						// $row->{$key->LocalCol}=array(
						// 	'ForTable'=>$t->Tablename,
						// 	'LocalCol'=>$key->LocalCol,
						// 	 'Table'=>$this->get_Row('TableHelp', " Tablename LIKE '%{$key->Table}%'"), 
						// 	 'Row'=>array_pop($this->get_Rows($key->Table, $key->ForCol, $row->{$key->LocalCol})));
					}
				}
			}
		}
    	return $el;
    }
 	private function getElementByPostId($pid){
 		//echo('getElementByPost');
 		global $wpdb;
 		$el=array();
 		$tbs=$this->get_Rows('TableHelp', 'ContainerPost', 1);
 		foreach ($tbs as $poss){
 			if (isset($poss->Container)){
 				$row=$this->get_Row($poss->Tablename, "{$poss->Container} = {$pid}");
 				if ((bool)$row) {
 					$el= $this->getElement($poss->TableHelp_Id, $row->{"{$poss->Tablename}_Id"},0); 
 					$el['Top']=TRUE;
 					
 					return $el;
 				}
 			}
 		}
 	}
	public function get_Geometry($geo){
		return $this->get_Table("Geometry", "Geometry =".$geo);
	}
	public function getGeometryFromString($name){
		global $wpdb;
		$geo=0;
		$name=strtolower(trim($name));
		$patterns[0] = '/[á|â|à|å|ä]/';
	    $patterns[1] = '/[ð|é|ê|è|ë]/';
	    $patterns[2] = '/[í|î|ì|ï]/';
	    $patterns[3] = '/[ó|ô|ò|ø|õ|ö]/';
	    $patterns[4] = '/[ú|û|ù|ü]/';
	    $patterns[5] = '/æ/';
	    $patterns[6] = '/ç/';
	    $patterns[7] = '/ß/';
	    $patterns[8] = '/bh/';
	    $patterns[9] = '/[gh|sh]/';
	    $patterns[10] = '/[ch|ph]/';
	    $patterns[11] = '/[tz|th|ts]/';
	    $replacements[0] = 'a';
	    $replacements[1] = 'e';
	    $replacements[2] = 'i';
	    $replacements[3] = 'o';
	    $replacements[4] = 'u';
	    $replacements[5] = 'ae';
	    $replacements[6] = 'c';
	    $replacements[7] = 'ss';
	    $replacements[8] = 'b';
	    $replacements[9] = 'g';
	    $replacements[10] = 'h';
	    $replacements[10] = 'dn';
	    $name = preg_replace($patterns, $replacements, $name);
	    $name =preg_replace('/[^A-Za-z,.]/', '', $name);
		$tb= $this->tablePrefix("Gematria");
		for ($i=0; $i<=strlen($name); $i++){
			$s = substr($name,$i,1);
	   		$sql= "SELECT Number FROM $tb WHERE Letter LIKE '{$s}'";
	   		$geo=$geo+=$wpdb->get_var($sql);
		}
			$geo=$this->crunchNumbers($geo);
			return (int)$geo;
	}
	public function getInstalled(){
		//echo('get installed');
		//nothing installed yet, but this checks if we're all installed by reading the event table.
		$GLOBALS['T13NE_Installed'] = 0;
		if ($this->tableExists("TableHelp")){
			$db=$this->get_Row('TableHelp'," Tablename LIKE 'Events'");
			if (isset($db->TableHelp_Id)){
				if ($this->tableExists('Events')){
					$events = $this->get_Rows('Events', 'EventType', 1 );
					$evt=array_pop($events);
					$package=preg_replace('/(.*)\{(.*)\}(.*)/sm', '\2', $evt->Description);
					$GLOBALS['T13NE_Installed'] = (int)($package);
				}
				if ($GLOBALS['T13NE_Installed']>=self::PACKAGES){
					return true;
				} else{return false;}
			}else{
				$GLOBALS['T13NE_Installed']=0;
				return false;
			}
		}
		return false;
	}
	private function getMyPlayers($groups){
		global $wpdb;
		$grp=$this->tablePrefix('Group_Members');
		$g=count($groups);
		$user=$this->currentUser();
		if (is_array($groups)){
			if ($g>1){
			$players = $wpdb->get_results("SELECT Group_Member FROM {$grp} WHERE Player = 1 AND Game_Group IN (".implode(',',$groups).")");
			}elseif ($g==1){
				$players = $wpdb->get_results("SELECT Group_Member FROM {$grp} WHERE Player = 1 AND Game_Group = {$groups[0]}"); 
			}
			else{return null;}
		}elseif(is_numeric($groups)){
			$players = $wpdb->get_results("SELECT Group_Member FROM {$grp} WHERE Player = 1 AND Game_Group ={$groups}"); 
		}
		
		$playrs=$wpdb->get_col();
	
		return $playrs;
	}
	private function get_LastRow($table){
		global $wpdb;
		//echo('get row');
		$tb=$this->tablePrefix($table);
		$sql="SELECT * 
			FROM {$tb} 
			WHERE {$table}_Id=(SELECT MAX({$table}_Id) FROM {$tb});";
			//echo " sql: {$sql} \n  -";
			return $wpdb->get_row($sql);
		
	}
	private function get_Row($table, $where){
		global $wpdb;
		//echo('get row');
		$tb=$this->tablePrefix($table);
		$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$where}  ;";
			//echo " sql: {$sql} \n  -";
			return $wpdb->get_row($sql);
		
	}
	private function get_Rows($table, $getcol, $where, $pagesize = 32, $page=0){
		global $wpdb;
		//echo ('getrows)');
		$tb=$this->tablePrefix($table);
		$off=($pagesize*$page);
		if (is_numeric($where)){
			$eq='=';
			$val=1*$where;
		}elseif(is_array($where)){
			$eq='IN';

			$val='('.implode(',',$where).')';
		}else{
			$eq='LIKE';
			$val="'%".$wpdb->esc_like($where)."%'";
		}
		$sql="SELECT * 	
		FROM {$tb} 
		WHERE {$getcol} {$eq} {$val}"; // LIMIT {$off}, {$pagesize};
		return $wpdb->get_results($sql);
	}
	private function getSecuredRow($table,$rowid){
		global $wpdb;
		//var_dump($table);
		$tb=$this->tablePrefix($table[0]);
		$t=$table[1];
		$user=$this->currentUser();
		$where= $table[1]->Tablename.'_Id ='.$rowid;
		if ($this->contains($t->Code,'INTERNAL')||$this->contains($t->Code,'Direct'||$this->contains($t->Code, 'Open'))){
			$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$where}  ;";
			//echo " sql: {$sql} \n  -";
			return $wpdb->get_row($sql);
		}else{
			$codes=explode(',', $t->Code);
			
			$wher=array();
			$edit=current_user_can('delete_published_pages');
			foreach ($codes as $code){
				if ($this->contains($code, 'Public')&&$user->UserCode&&self::VIEWPUBLIC){
					$wher[]= " {$code} = TRUE ";
					$edit=current_user_can('edit_published_pages');
				}
				if ($this->contains($code, 'Scope')&&$user->UserCode&&self::VIEWPUBLIC){
					$wher[]=" {$code}>9 ";
				}
				if($this->contains($code, $this->Creator)&&$user->UserCode&&self::VIEWMINE){
					$wher[]=" {$code}=$user->Users_Id";
					$edit=current_user_can('edit_posts');
					if (isset($user->Groups)&&$user->UserCode&&self::VIEWMYPLAYERS){
						$myPlayers=$this->getMyPlayers($user->Groups);
						
						if ((bool)count($myPlayers)){
							$wher[]=" {$code} IN (".implode(',',(array)$myPlayers).")";
							$edit=current_user_can('edit_others_posts');
						}
					}
				}
				
			}
			
			$w = count($wher);
			switch ($w){
				case 1:
				$where.= ' AND '.$wher[0];
				break;
				case 2:
				$where.=" AND ({$wher[0]} OR {$wher[1]})";
				break;
				case 3:
				$where.= " AND ({$wher[0]} OR {$wher[1]} OR {$wher[2]})";
				break;
				case 4:
				$where.= " AND ({$wher[0]} OR {$wher[1]} OR {$wher[2]} OR {$wher[3]})";
				break;
			}
			$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$where}  ;";
			//echo " sql: {$sql} \n  -";
			$ret= $wpdb->get_row($sql);
			$ret->Editable=$edit;
			return $ret;
		}
	}
	private function getSecuredRows($table, $getcol, $where, $pagesize = 32, $page=0){
		global $wpdb;
		$tb=$table[0];
		$off=$pagesize*($page);
		if (is_numeric($where)){
			$eq='=';
			$val=1*$where;
		}elseif(is_array($where)){
			$eq='IN';

			$val='('.implode(',',$where).')';
		}else{
			$eq='LIKE';
			$val="'%".$wpdb->esc_like($where)."%'";
		}
		$t=$table[1];
		$user=$this->currentUser();
		if ($this->contains($t->Code,'INTERNAL')||$this->contains($t->Code,'Direct'||$this->contains($t->Code, 'Open'))){
			$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$getcol} {$eq} {$val} LIMIT {$off},{$pagesize}"; // LIMIT {$off}, {$pagesize};
			return $wpdb->get_results($sql);
			//echo " sql: {$sql} \n  -";
		}else{
			$codes=explode(',', $t->Code);
			$wher=array();
			$edit=current_user_can('delete_published_pages');
			foreach ($codes as $code){
				if ($this->contains($code, 'Public')&&$user->UserCode&&self::VIEWPUBLIC){
					$wher[]= " {$code} = 1 ";
						$edit=current_user_can('edit_published_pages');
				}
				if ($this->contains($code, 'Scope')&&$user->UserCode&&self::VIEWPUBLIC){
					$wher[]=" {$code} > 9 ";
				}
				if($this->contains($code, $this->Creator)&&$user->UserCode&&self::VIEWMINE){
					$wher[]=" {$code}={$user->Users_Id} ";
					if (isset($user->Groups)&&$user->UserCode&&self::VIEWMYPLAYERS){
						$edit=current_user_can('edit_posts');
						$myPlayers=$this->getMyPlayers($user->Groups);
						if ((bool)count($myPlayers)){
							$where[]=" {$code} IN (".implode(',',$myPlayers).")";
							$edit=current_user_can('edit_others_posts');
						}
					}
				}
			}	
			$w=count($wher);
			switch($w){
				case 0:
				$where='';
				break;
				case 1:
				$where.= ' AND '.$wher[0];
				break;
				case 2:
				$where.=" AND ({$wher[0]} OR {$wher[1]}) ";
				break;
				case 3:
				$where.= " AND ({$wher[0]} OR {$wher[1]} OR {$wher[2]}) ";
				break;
				case 4:
				$where.= " AND ({$wher[0]} OR {$wher[1]} OR {$wher[2]} OR {$wher[3]}) ";
				break;

			}
			$sql="SELECT * 	
			FROM {$tb} 
			WHERE {$getcol} {$eq} {$val} {$where} LIMIT {$off}, {$pagesize}"; 
			$rows = $wpdb->get_results($sql);
			$ret =array('Rows'=>$rows);
			$ret['Page']=$off;
			$ret['Pagesize']=$pagesize;
			return $ret;
		}		
	}
	private function get_Stats($statblock){
		$stats=array();
		$st=$this->get_Row('Statblock', 'Statblock_Id = '.$statblock);
		foreach ($st as $key=>$val){
			if ($this->contains($key,'Stat')){
				$stats[]=$this->get_Row('Statpairs', 'Statpairs_Id = '.$val);
			}
		}
		return $stats;
	}	
	private function get_Table($table, $pagesize =100,$page =0, $asc=TRUE){
		global $wpdb;
		$tb=$this->tablePrefix($table);
		$id=$table.'_Id';
		$desc = ($asc? "ORDER BY {$id} ASC":"ORDER BY {$id} DESC");
		$p=$pagesize*$page;
		$r= $wpdb->get_results("SELECT *
			FROM {$tb} 
			WHERE {$id} > {$p} {$desc} LIMIT {$pagesize} ;");
		return $r;
	}
	private function getTableOfRow($input){
		$table="";
		$ts=$this->get_TableHelp();
		if (is_array($input)){
			$in=$input[0];
		}else{
			$in=$input;
		}
		foreach ($in as $key=>$val){
			if ($this->contains($key,'Id')){
				$t=substr($key, 0, strpos($key, '_Id'));
				break;
			}
		}
		foreach($ts as $tr){
			if ($tr->Tablename==$t){
				$table=$tr;
				break;
			}
		}
		return $table;
	}
	private function get_TableHelp(){
		if (isset($this->tablecache)&&(bool)$this->tablecache){
			return $this->tablecache;
		}else{
			global $wpdb;
			$this->tablecache = $wpdb->get_results("SELECT *
				FROM ".$this->tablePrefix());
			return $this->tablecache;
		}	
	}
	private function getTemplates($reftable, $refelem, $DataLevel){
		$tabs=array_reverse($this->get_TableHelp());
		$refs=array(array('Elems'=>array(array('Elem'=>$refelem))));
		$ret=array();
		$refs['debug']='Templated>>';
		if (isset($reftable->Template)&&($DataLevel<3)){
			$refs['debug'].=" Template: {$reftable->Template} ";
			if (strlen($reftable->Template)>1){
				if ($this->contains($reftable->Template, ',')){
					$templates=explode(',', $reftable->Template);
					$refs['debug'].=" array built ";
				}else{
					$templates=array($reftable->Template);
					$refs['debug'].=" single Template ";
				}
				foreach($templates as $temp){
					$refs['debug'].=" {$temp}: ";
					if (strlen($temp)>0){
						foreach ($tabs as $tab){
							$ret=array();
							if ($tab->Tablename==$temp){
								$refs['debug'].=" tab: {$tab->Tablename} ";
								//table for template
								$JKeys=json_decode($tab->JKeys);
								foreach((array)$JKeys as $jkey){
									$refs['debug'].=" jkey Table: {$jkey->Table},";
									if ($reftable->Tablename==$jkey->Table){
										$rows=$this->getAllSecuredRows(array($temp,$tab),$jkey->LocalCol,$refelem['Row']->{$jkey->ForCol});
										//$refs['debug'].=' getAllSecuredRows(array('.json_encode($temp).','.json_encode($tab).'),'.json_encode($jkey->LocalCol).','.json_encode($refelem['Row']->{$jkey->ForCol}).')';
										foreach ((array)$rows as $row){
											if (isset($tab->Container)){
												$refs['debug'].=' container ';
												if (isset($row->{$tab->Container})){
													//$refs['debug'].='row has container';
													$row->PostId=$row->{$tab->Container};
												}		
											}
											$ret[]=array('Elem'=>$this->getElement($temp,$row->{$temp.'_Id'},$DataLevel+1));
										}
										$refs[]=array('Elems'=>$ret);
									}
								}
							
							}
						}
					}
				}
				
			}		
		}
		return $this->makeReferencesUnique($refs);
	}
	public function getView($request){
		//expects unsanitized request. 
		if (isset($request)){
			$package=$request['package'];
			$DataLevel=$request['package']['datalevel'];
			//var_dump($package);
			if (isset($package['obj'])){
				switch ($package['obj']){
					case 'ContainerPost':
					//we don't have anything but a container post.
					$element=$this->getElementByPostId($package['id']);
					$element['Template']=$this->getTemplates($element['Table'], $element,1);
					$element['Referenced']=$this->findReferences($element['Table'], $element['Row'],$DataLevel, true);
					$element['Referers']='loaded';
					break;

					case 'GetThis':
					if (isset($package['code'])){
						$code=$package['code'];
						$args=explode('-', $code);
						$element=$this->getElement($this->Sanitize($args[0]),$this->Sanitize($args[1]),$DataLevel);
						if (!isset($element->Table->ContainerPost)|$DataLevel<2){
							$element['Template']=$this->getTemplates($element['Table'], $element,1);
						}
						//$element['Reffed']=$this->findReferences($element['Table'], $element['Row'],$DataLevel+1);
					}else{
						$element=array("mode"=>'End');
					}
					break;
					case 'ForceGetRefs':
					if (isset($package['code'])){
						$code=$package['code'];
						$args=explode('-', $code);	
						$element=$this->getElement($this->Sanitize($args[0]),$this->Sanitize($args[1]),$DataLevel);
						$element['Referenced']=$this->findReferences($element['Table'], $element['Row'],$DataLevel,FALSE);
						$element['Referers']='loaded';
						
					}else{
						$element=array("mode"=>'End');
					}
					break;
					case 'GetThisRefs':
					if (isset($package['code'])){
						$code=$package['code'];
						$args=explode('-', $code);	
						$element=$this->getElement($this->Sanitize($args[0]),$this->Sanitize($args[1]),$DataLevel);
						$element['Referenced']=$this->findReferences($element['Table'], $element['Row'],$DataLevel,TRUE);
						$element['Referers']='loaded';
						
					}else{
						$element=array("mode"=>'End');
					}
					break;
					default:
					$element=array("mode"=>'End');
					
				}
			}
		}
		$element['Code']='#'.$package['code'];
		return $element;
	}
	
	
	private function keepRows($rows, $where, $mode='OR'){
		//accepts where array and $rows $mode has values of OR or AND
		$ret=array();
		if (is_array($where[0])){
			foreach ($rows as $row){
				foreach($where as $w){
					if ($row->{$w[0]}==$w[1]){
						$ret[]=$row;
					}
				}	
			}
			switch ($mode){
				case 'AND':
					$ret=array_unique(array_diff($ret,array_unique($ret)));
				break;
				default: 
					$ret=array_unique($ret);
			}	
		}else{
			foreach ($rows as $row){
				if ($row->{$where[0]}==$where[1]){
						$ret[]=$row;
				}	
			}
		}
		return $ret;
	}
	public function load_database(){
		// Database interface instatiated by plugin loaded call. 
		return $this->getInstalled();
	}
	public function makeEdit($data){
		global $wpdb;
		$editgo=FALSE;
		//var_dump($data);
		if ($data['mode']=="Change" && isset($data['package'])){
			$package=$data['package'];
			//var_dump($package);

			$user=$this->currentUser();
			$DataLevel=$package['datalevel'];
			if (isset($package['code'])){
				$code=$package['code'];
				if ($this->contains($code,'T13_shortcoded')){
					//echo("shortcoded");
					if (isset($package['thisun'])){
						$args=explode('-',$package['thisun']);
					}
				}else{
					$args=explode('-', $code);
				}
				
				if (isset($args)){
					$oe=$this->getElement($this->Sanitize((int)$args[0]),$this->Sanitize((int)$args[1]),$DataLevel);
					$oe['debugs'][]="Debug on";
					$oe['Code']=$code;
					if (isset($package['edit'])){
							$oe['debugs'][]=", package edit";
							$edit=$this->Sanitize($package['edit']);
					$oe['debugs'][]=", sanitized package edit";
						if (isset($package['column'])){
							$oe['debugs'][]=",column declared";
							$column=0;
							$colclasses=$this->Sanitize($package['column']);
							$oe['debugs'][]="colclasses='{$colclasses}'";
							$colclass=array_reverse(explode(' ',$colclasses));
							foreach($colclass as $class){
								$oe['debugs'][]="class:{$class}";
								$schem=json_decode($oe['Table']->JSchema);
								foreach($schem as $sche){
									//$oe['debugs'][]="schema:";
									foreach($sche as $k=>$v){
										//$oe['debugs'][]="k:{$k}  v:{$v}";
										if ($k=='CSS'&& $v==$class){
											$column=$sche->Name;
											$oe['debugs'][]="column:{$column}";
											break 3;
										}
									}
								}
								
							} 
						}else{$oe['debugs'][]="column not found";}
						if (isset($package['ova'])){
							$ova=$package['ova'];
							$oe['debugs'][]=",ova found";
							if ($this->contains(json_encode($oe),$ova)){
								$oe['debugs'][]=", ova matches";
								$editgo=TRUE;
							}
						}else{$oe['debugs'][]="ERROR:: no ova!";}
					}else{$oe['debugs'][]="ERROR:: no package edit!".json_encode($package);}
				}
			}
		}

		if ($editgo){
			$tab_id=0;
			$row_id=0;
			if (isset($oe['Row'])){
				$oe['debugs'][]=", found Row";
				if (isset($oe['Row']->Editable)){
					if ($oe['Row']->Editable){
						// foreach($oe as $oi){
						// 	$oe['debugs'][]=", found oi====".json_encode($o);
						// 	foreach ($oi as $o){
						// 	$oe['debugs'][]=", found o==".json_encode($o);
						foreach ($oe['Row'] as $key=>$value){
							$oe['debugs'][]="key:{$key}' => val:".json_encode($value);
							if ($this->contains($key,'_Id')){
								$oe['debugs'][]=", found Id";
								$tab_id=$key;
								$row_id=$value;

							}elseif ($this->contains($key,$column)){
								$oe['debugs'][]="{$key}:{$column}";
								if ($value==$ova){
									$oe['debugs'][]=", found Ova";
									//$oe['Row']->$key=$edit;
									$table=$this->tablePrefix($oe['Table']->Tablename);
									$oe['debugs'][]="Table={$table}";
									if ($this->contains($column, "Name")){
										$geoname=$this->findGeo($oe);
										$geo = $this->getGeometryFromString($edit);
										$change=array("{$column}"=>$edit, "{$geoname}"=>$geo);
									}else{
										$change=array("{$column}"=>$edit);
									}
									$oe['debugs'][]="Change array:".json_encode($change);
									$where=array("{$tab_id}"=>"{$row_id}");
									$oe['debugs'][]="WHERE=".json_encode($where);
									$oe['updated']=$wpdb->update($table,$change,$where);
									$oe['debugs'][]=" updated (".$oe['updated'].')';
								//----------build-update-data----------------------
									$oe['Update']=$this->getElement($this->Sanitize($args[0]),$this->Sanitize($args[1]),$DataLevel);
									$oe['Template']=$this->getTemplates($oe['Table'], $oe,1);
									$oe['Referenced']=$this->findReferences($oe['Table'], $oe['Row'],$DataLevel, true);
									return $oe;							
								}else{
									$oe['debugs'][]="VALUE=".json_encode($value);
									$oe['debugs'][]="OVA=".json_encode($ova);
								}								
							}
						}
						// 	}
						// }
					}
				}else{
					$oe['debugs'][]="ERROR:: No Edit Allowed!";
				}
			}
		wp_send_json_error("ERROR:: Edit failed ".json_encode($oe));
		}else{
			wp_send_json_error("ERROR:: Edit disallowed ".json_encode($oe));
		}
	}
	private function makeReferencesUnique($refs){
		$thru=array();
		$out=array();
		foreach($refs as $ref){
			$thru[]=json_encode($ref);
		}
		$thru=array_unique($thru);
		foreach($thru as $thr){
			if (strlen((string)$thr)>0){
				$out[]=json_decode($thr);
			}
		}
		return $out;
	}
	private function RNG($min = 1, $max = 20, $mod=0) {
	    if (function_exists('random_int')){
	        return random_int($min, $max)+$mod; // more random
	    }elseif (function_exists('mt_rand')){
	        return mt_rand($min, $max)+$mod; // faster
	    }else{
	   		return rand($min, $max)+$mod; // old clunky but universal
		}
	}
	private function Sanitize($c,$len=16777215){
		if (is_numeric($c)){
			if (is_float($c)){
				$c =floatval($c);
			}
			if (is_int($c)){
				$c=intval($c);
			}
		}
		if (is_string($c)){
			$c=trim(stripcslashes($c)); //strip escapes
			$c=html_entity_decode($c); //decode incase encoded
			$c=strip_tags($c, '<a><abbr><address><area><article><aside><audio><b><bdi><bdo><blockquote><br><canvas><caption><cite><code><col><colgroup><dd><del><details><dfn><div><dl><dt><em><figcaption><figure><footer><h2><h3><h4><h5><h6><header><hgroup><hr><i><img><ins><kbd><label><legend><li><map><mark><menu><meter><nav><ol><p><pre><q><rp><rt><ruby><s><samp><section><small><source><span><strong><sub><summary><sup><table><tbody><td><tfoot><th><thead><time><tr><track><tt><u><ul><var><video><wbr>');
			$c=preg_replace("/on\S*=/i", "data-naughty=", $c);
			$c=str_replace(' &',' &amp;', $c);
			$c=str_replace("'",'&#39;', $c);
			//$c=str_replace('"','&#34;', $c);
			$c=str_replace("`",'&#96;', $c);
			$c=str_replace('´','&#180;', $c);
			$c=str_replace('’', '&#146;', $c);
			if (strlen($c)>$len){
				$c=substr($c,0,$len);
			}
		//$c=htmlspecialchars($c, ENT_HTML5|ENT_SUBSTITUTE, 'UTF-8',TRUE); //encode non html
		/*
		$c = preg_replace("/=/", "=\"\"", $c); 
		$c = preg_replace("/&quot;/", "&quot;\"", $c); 
		$tags = "/&lt;(\/|)(\w*)(\ |)(\w*)([\\\=]*)(?|(\")\"&quot;\"|)(?|(.*)?&quot;(\")|)([\ ]?)(\/|)&gt;/i";
		$replacement = "<$1$2$3$4$5$6$7$8$9$10>";
		$c = preg_replace($tags, $replacement, $c);
		$c = preg_replace("/=\"\"/", "=", $c);*/
		}


		
		return $c;
	}

	private function sortDice() { 
    //get args of the function 
    $args = func_get_args(); 
    $c = count($args); 
    if ($c < 2){return false;} 
    //get the array to sort 
    $array = array_splice($args, 0, 1); 
    $array = $array[0]; 
    //sort with an anoymous function using args 
    usort($array, function($a, $b) use($args) { 
        $i = 0; 
        $c = count($args); 
        $cmp = 0; 
        while($cmp == 0 && $i < $c){ 
        	$cp1=$a->$args[$i];
        	$cp2=$b->$args[$i];
            $cmp = strnatcmp((string)$cp1,(string)$cp2); 
            $i++; 
        } 
        return $cmp; 
    }); 
    return $array; 
} 
	private function tablePrefix($table='TableHelp'){
		global $wpdb;
		if (is_string($table)){
			$pre=$wpdb->prefix."T13_NE_";
			if (!$this->contains($table, $pre)){
				return $pre.$table;
			}else{
				return $table;
			}
		}
	}
	private function tableExists($table){
		global $wpdb;
		//$wpdb->get_var("SHOW TABLES LIKE '".$wpdb->prefix."posts'"); //clears the results
		$tb=$this->tablePrefix($table);
		//if(strtolower($wpdb->get_var("SHOW TABLES LIKE '{$tb}'")) == strtolower($tb)){return true;}else{return false;}
		return false;
	}
	private function trashPosts($tb){
		//doesn't work and needs to use tableHelp Contaier to check all pages of the posts...
		$tra=$this->get_Table($tb->Tablename);
		foreach($tra as $tr){
			if (isset($tb->Container)){
				$post_id=$tr->{$tb->Container};
				 wp_trash_post($post_id);
				}
		}
	}
	
	private function validateSchema($rtv, $tb){
		//var_dump($tb);
		//var_dump($rtv);
		$schema=json_decode($tb->JSchema);
			
		if ($schema){
			$valid=true;
			//var_dump($rtv);
			//var_dump($schema);
		}else{
			$valid =false;
			//var_dump($rtv);
			//var_dump($tb);
		}
		$ret=array();
		$format = array();
		$filter_arr = array();
		foreach($schema as $schem)
			$type=$schem->Type;
			if ($this->contains($type,'INTEGER')){
				array_merge($filter_arr,array("{$schem->Name}"=>'FILTER_VALIDATE_INT'));
				$format[]='%d';
			}elseif($this->contains($type,'MEDIUMTEXT')){
				$len=16777215;
				switch (strtolower($schema->Name)){
					case "email": 
					array_merge($filter_arr,array("{$schem->Name}"=>'FILTER_SANITIZE_EMAIL'));
					$format[]='%s';
					break;
					case "url": 
					array_merge($filter_arr,array("{$schem->Name}"=>'FILTER_SANITIZE_URL'));
					$format[]='%s';
					break;
					case "description":
					array_merge($filter_arr,array('Description'=> array('filter'=>'FILTER_CALLBACK', 'options'=>function ($value){return T13Sanitize::sanitize($value);})));
					default:
					array_merge($filter_arr,array("{$schem->Name}"=>'FILTER_SANITIZE_FULL_SPECIAL_CHARS'));
					$format[]='%s';
					break;
				}
			}elseif($this->contains($type, 'VARCHAR')){
				$len = (int)$type;
				switch (strtolower($schema->Name)){
					case "email": 
					array_merge($filter_arr,array("{$schem->Name}"=>'FILTER_SANITIZE_EMAIL'));
					$format[]='%s';
					break;
					case "url": 
					array_merge($filter_arr,array("{$schem->Name}"=>array('FILTER_SANITIZE_URL', 'options'=>function ($value){return T13Sanitize::SanitizePath($value);})));
					$format[]='%s';
					break;
					case "description":
					array_merge($filter_arr,array('Description'=> array('filter'=>'FILTER_CALLBACK', 'options'=>function ($value){return T13Sanitize::sanitize($value);})));
					default:
					array_merge($filter_arr,array("{$schem->Name}"=>'FILTER_SANITIZE_FULL_SPECIAL_CHARS'));
					$format[]='%s';
					break;
				}
				
			}elseif($this->contains($type, 'BIGINT')){
				array_push($filter_arr,array("{$schem->Name}"=>'FILTER_VALIDATE_FLOAT'));
				$format[]='%f';		
		}
		$ret=array(filter_var_array($rtv, $filter_arr),$format);
		if ($valid){return $ret;}else{return null;}
	}
	private function whichTable($table){
		if (is_numeric($table)){
			$tbs=$this->get_Row("TableHelp","TableHelp_Id = {$table}");
			$tb=$this->tablePrefix($tbs->Tablename);			
		}else{
			//echo " which table? $table ";
			global $wpdb;
			$tb=str_ireplace($wpdb->prefix."T13_NE_", '', $table);	
			$tbs=$this->get_Row("TableHelp","Tablename LIKE '{$tb}'");
			$tb=$this->tablePrefix($table);	
		}
		return array($tb,$tbs);
	}
	public function enqueue_scripts() {	}
}

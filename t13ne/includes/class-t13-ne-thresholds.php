<?php

/**
 * Define the thresholds php functionality
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
 * Define the Threshold functionality.
 *
 * Thresholds are used for building and storing connections for the database... largely replicating things from wordpress metadata but it's our own thing
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Thresholds{


	static private function tablename($table){
		global $wpdb;
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		if (!T13Types::contains($table,$wpdb->prefix.'t13_ne_')){
			$tb=$wpdb->prefix.'t13_ne_'.T13Sanitize::sanitize($table);
		}else{
			$tb=$table;
		}

		return $tb;
	}
	static private function cleartable($tb){
		global $wpdb;
		$wpdb->query("SET FOREIGN_KEY_CHECKS=0;");
		$wpdb->query("DROP TABLE IF EXISTS {$tb}");
		$wpdb->query("SET FOREIGN_KEY_CHECKS=1;");
	}
	static private function getRows($table, $col=array('0=1'), $match='', $like='='){
		global $wpdb;
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		//error_log("getRows ::{$table}:".json_encode( $col ));
		$tb = self::tablename($table);
		if (is_array($col)){

			$sql = "SELECT * FROM {$tb} WHERE ";
			foreach($col as $no=>$c){
				$c = T13Sanitize::sanitize($c);
				$sql.=($no>0)?' AND '.$c:$c;
			}
			$sql.=';';
			error_log('getRows:: sql='.$sql);
			$ret = $wpdb->get_results($sql);
			error_log('getRows:: results='.json_encode($ret));
			return $ret;
		}else{
			$like = T13Sanitize::sanitize($like);
			$col=T13Sanitize::sanitize($col);
			$match = T13Sanitize::sanitize($match);
			if (is_string($col)&&T13Types::contains($col, ',')){
				$search = "SELECT * FROM {$tb} WHERE '{$match}' IN ({$col});";
			}else{
				if (is_numeric($match)&&$like!=='LIKE'){
					$search = "SELECT * FROM {$tb} WHERE {$col} = {$match};";
				}else{
					$search = "SELECT * FROM {$tb} WHERE {$col} {$like} '%{$match}%';";
				}
			}
			error_log ('getRows:: search= '.$search);
			$ret = $wpdb->get_results($wpdb->prepare($search));
			error_log('getRows:: results=' . json_encode($ret));
			return $ret;
		}
	}
	static private function checkRowExists($table,$row){
		//error_log('checkRowExists::'.$table.'::'.json_encode( $row ));
		global $wpdb;
		$tb = self::tablename($table);
		$sql = "SELECT * FROM {$tb} WHERE ";
		foreach ($row as $key=>$value){
			if (!is_null($value)){
				$key = T13Sanitize::sanitize($key);
				$value = T13Sanitize::sanitize($value);
				if ($value===true){$value=1;}
				if ($value===false){$value=0;}
				if (is_numeric($value)){
					$sql.="  `{$key}`  = {$value}  AND ";
				}else{

					if (is_array($value)&&count($value)){
						$value = implode(', ', $value);
						$sql .= "  `{$key}`  IN ({$value}) AND ";
					}else{
						if (is_string($value)&&$value!==""){
							$sql .="  `{$key}` LIKE '%{$value}%'  AND ";
						}

					}

				}
			}

		}
		$sql .=" 1=1";
		//error_log("checkRowExists SQL='{$sql}'");
		$result = json_encode( $wpdb->get_results($sql));
		return $result!=='[]';
	}
	static private function addRowTo($row, $table){
		//error_log('addRowTo'.json_encode( $row ));
		global $wpdb;
		$tb=self::tablename($table);
		$check=self::checkRowExists($table,$row);

		if (!$check){
			//should be trusted data stuff it in.
			//error_log("attempting addRowTo: {$tb} :: row:".json_encode( $row ));
			$result =json_encode($wpdb->insert($tb, $row));

			return $wpdb->insert_id;
		}else{
			//error_log("addRowTo:: Threshold already exists", $check);
			return false;
		}
	}
	static private function addRows( $rows = array(),$table='') {
		//error_log('addRows'.json_encode($rows));
    global $wpdb;
    $wpdb->show_errors();
    $tb = self::tablename($table);
    // Setup arrays for Actual Values, and Placeholders
    $values = array();
    $place_holders = array();
    $query_columns = T13Sanitize::sanitize(implode(',', array_keys($rows[0])));
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
	    //error_log("addRows::SQL : {$query}");
	if($wpdb->query($wpdb->prepare($query, $values))){
	    return true;
	} else {
		//error_log("addRows:: ".$wpdb->print_error());
	    return false;
	}
    }else{
	foreach($rows as $row){
		self::addRowTo($row,$table);
	}
    }
}

	static private function addtable($table, $sql, $rows = null){
		global $wpdb;
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		$tb=self::tablename($table);
		$id=$table.'ID';
		self::cleartable($tb);
		//$charset=$wpdb->get_charset_collate();
		$sqlcore = "CREATE TABLE {$tb} ( `{$id}` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY ,
		{$sql}
		);";
		$wpdb->query( $sqlcore );
		dbDelta();
		if (!is_null($rows)){
			self::addRows( $table,$rows);
		}

	}
	static public function addGroup($input=[]){
		$group =[];
		foreach($input as $key=>$value){
			if (is_array($value)){self::addGroup($value);}else{
				$value = T13Sanitize::sanitize($value);
			}
			if ($key=="PostID"&&!is_null($value)){
				if(!is_string(get_post_status( $value ))){
					//error_log("addGroup:: FAILURE:: Group targets non-existent Pact");
					return null;
				}

			}
			if ($key=="GroupType"){
				if ($value>count(T13Types::$groupTypes)||$value<0){
					//error_log("addGroup:: FAILURE:: GroupType {$value} is not found");
					return null;
				}
			}
			$group[$key]=$value;
		}
		unset($input);
		return self::addRowTo($group, 'Groups');
	}

	static public function addThreshold($input){
		//error_log('addThreshold::'.json_encode( $input ));
		$threshold =[];
		foreach ($input as $key => $value) {
			if (is_array($value)){self::addThreshold($value);}else{
				$value=T13Sanitize::sanitize($value);
			}
			if (T13Types::contains($key, 'Element')&&!is_null($value)){
				$element=get_post_status( $value );
				if (!is_string($element)){
					//error_log("addThreshold:: FAILURE:: T13 Thresholds MUST have a valid post id for each element");
					return NULL;
				}
			}
			if ($key=='TargetGroup'&&!is_null($value)){
				$group = self::checkRowExists('Groups',array('GroupsID'=>$value));
				if (is_null($group)){
					//error_log("addThreshold:: WARNING:: T13 Threshold references Group that does not exist... If a Group is specified for a Threshold we expect a valid Groups_ID");
				}
			}
			if ($key=='Statblock'&&!is_null($value)){
				if (is_array($value)){
					$value = T13Statblock::getStatIDs($value);
					if (is_array($value)){
						$value=$value[0];
					}
				}
				$statblock = self::checkRowExists('Statblocks', array('Statblock_Id'=>$value));
				if (is_null($statblock)){
					//error_log("add Statblock:: WARNING:: T13 Threshold references Statblock that does not exist... If a Statblock is specified we expect a valid ID.");
				}
			}
			if ($key == 'Data'){
				if (is_array($value)){
					$value =json_encode($value);
				}
			}

			$threshold[$key]=$value;
		}
		unset($input);
		$current_user = wp_get_current_user();
		$threshold['User']=$current_user->ID;

		return self::addRowTo($threshold,'Thresholds');
	}

	static public function getCrossRefs($d, $dir=null){
		//error_log('getCrossRefs('.json_encode( $d).':'.$dir.')');
		if (isset($d['CrossRef'])){
			$xref=explode(', ',$d['CrossRef']);
			foreach($xref as $xr){
				if (T13Types::contains($xr,'!')&&is_null($dir)||T13Types::contains($xr, '!'.$dir)){
					$d['Opposites'][] = self::getDirection(ltrim($xr, '!'),'opposite');
				}
				if (T13Types::contains($xr,'~')&&is_null($dir)||T13Types::contains($xr, '~'.$dir)){
					$d['Associated'][] = self::getDirection(ltrim($xr, '~'),'similar');
				}
				if ($xr==ltrim($xr,'!~')||$xr==$dir){
					$d['Synonym'][] = self::getDirection($xr,'synonym');
				}
			}
		}
		return $d;
	}
	static public function getGroupTypes($types, $mode='#'){
		$t=array();
		if (is_null($types)){return null;}
		if (is_string($types)){
			$types = T13Types::arrayify($types);
		}
		if (is_array($types)){
			foreach($types as $in=>$type){
				if (is_numeric($type)){
					$t[$in]=T13Types::$groupTypes[$type];
					$t[$in]['index']=$type;
				}
				if (is_string($type)){
					foreach(T13Types::$thresholdTypes as $thr=>$threshold){
						if ($threshold == $type){
							$t[$in]=$threshold;
							$t[$in]['index']=$thr;
						}
					}
				}
			}
		}
		switch($mode){
			case "#":
				if (count($types)==1&&isset($t[0])&&isset($t[0]['index'])&&!is_null($t[0]['index'])){return $t[0];}
				if (is_array($t)){
					return array_map(function ($val){return $val['index'];}, $t);
				}
			break;
			case "search":
			if (is_array($t)&&count($t)>1){
				$t['SQL'] = ' AND GroupType IN (';
				foreach ($t as $index=>$type){
					$t['SQL'] .= "{$type['index']}, ";
				}
				$t['SQL'].='1313131313131313)';
			}else{
				$t['SQL'] = " AND GroupType = {$t[0]['index']}";
			}
			default:
				return $t;
			break;
		}


	}
	static public function getGroupType($group){
		$g=self::getGroupTypes($group,'#');
		if (isset($g['index'])){
			return $g['index'];
		}else{
			return false;
		}
	}
	static public function getThresholdTypes($types, $mode='#'){
		//error_log('getThresholdTypes::'.json_encode( $types).'::'.$mode );
		$t=array();
		if (is_null($types)){return null;}
		if (is_string($types)){
			$types = T13Types::arrayify($types);
			//error_log('getThresholdTypes arrayifying string::'.json_encode( $types ));
		}
		if (is_array($types)){

			//error_log('getThresholdTypes ARRAY');
			foreach($types as $in=>$type){
				//error_log('getThresholdTypes::'.$in.'::'.$type);
				if (is_numeric($type)){
					$t[$in]=T13Types::$thresholdTypes[$type];
					$t[$in]['index']=$type;
				}
				if (is_string($type)){
					foreach(T13Types::$thresholdTypes as $thr=>$threshold){
						//error_log('getThresholdTypes::'.$thr.'::'.json_encode( $threshold));
						if ($threshold == $type|| $threshold['Type']==$type){
							//error_log('getThresholdTypes found '.$type.' in '. json_encode( $threshold));
							$t[$in]=$threshold;
							$t[$in]['index']=$thr;
							break;
						}
					}
				}
			}
		}
		//error_log("getThresholdTypes::{$mode}".json_encode( $t ));
		switch($mode){
			case "#":
				if (isset($t['index'])&&!is_null($t['index'])){return $t['index'];}
				if (is_array($t)&&count($t)){
					$r = array_map(function ($val){return $val['index'];}, $t);
					//error_log('getThresholdTypes returning '.json_encode( $r ));
					if (count($r)==1){$r=$r[0];}
					return $r;
				}
			break;
			case "search":
			if (is_array($t)&&count($t)>1){
				$t['SQL'] = ' AND ThresholdType IN (';
				foreach ($t as $index=>$type){
					$t['SQL'] .= "{$type['index']}, ";
				}
				$t['SQL'].='1313131313131313)';
			}else{
				$t['SQL'] = " AND ThresholdType = {$t[0]['index']}";
			}
			default:

				return $t;
			break;
		}

	}
	static public function getThresholdType($type){
		return  self::getThresholdTypes($type,'#');
	}
	static public function getDirection($dir, $mode){
		//error_log('getDirection::'.$dir.'::'.$mode);
		$d=array('index'=>$dir);
		if (is_null($dir)){return null;}
		if (is_numeric($dir)){
			$d=T13Types::$thresholdDirections[$dir];
			$d=self::getCrossRefs($d);
			$d['index']=$dir;

		}else{
			foreach(T13Types::$thresholdDirections as $index=>$threshold){
				if ($threshold['Type']==$dir){
					$d = $threshold;
					$d['index'] = $index;
				}
				if (T13Types::contains($threshold['CrossRef'], $dir)){
					$d=self::getCrossRefs($d, $dir);
				}
			}
		}
		switch ($mode){
			case "#";
				return $d['index'];
				break;
			case "opposite":
			case "search":
				$d['SQL'] = " AND ThresholdDirection IN ({$d['index']}";
				$d['OSQL'] = " AND ThresholdDirection NOT IN ({$d['index']}";
				foreach($d['Associated'] as $direction){
					$d['SQL'].=", {$direction['Index']}";
					$d['OSQL'].=", {$direction['Index']}";
				}
				foreach($d['Synonym'] as $direction){
					$d['SQL'].=", {$direction['index']}";
					$d['OSQL'].=", {$direction['index']}";
				}
				$d['SQL'].=')';
				$d['OSQL'].=')';
				if (isset($d['Opposites'])){
					$d['SQL'].=' AND ThresholdDirection NOT IN (';
					$d['OSQL'].=' AND ThresholdDirection IN (';
					$args =[];
					foreach($d['Opposites'] as $direction){
						$args[]=$direction['index'];
					}
					$args = implode(', ', $args);
					$d['SQL'].= $args.')';
					$d['OSQL'].= $args.')';
				}
			default:
				return $d;
				break;
		}
	}//thresholdtypes
	/*array(
array('Type'=>'alternate', 'Description'=>'These thresholds indicate the Element (Character, Pact, or Extra Descendant) is an alternate of a Character.')
array('Type'=>'belongs', 'Description'=>'These thresholds indicate the Element belongs to the group, like the Descendants of a Character.'),//0
array('Type'=>'cartesian', 'Description'=>'These thresholds indicate a Cartesian co-ordinate that specifies a position in some dimensional space, 1 dimensional for a single value, often 2d for surface maps and hex crawls, and even most dungeons), sometimes 3d (for realistic caverns and buildings), rarely 4d (time is included as well, key events begin or end Eras), occasionally 5d(branching time-lines and multiple choices can be represented this way). They are most often used to place Locations on a map (which will be referenced as well).'),//1
array('Type'=>'channel', 'Description'=>'These thresholds indicate the Element is a Channelling Prof, Persona Facet, or leading member'),//2
array('Type'=>'choice', 'Description'=>'These threshold represents a choice that may be made, only a single object may be selected from the group'),//3
array('Type'=>'contact', 'Description'=>'These thresholds indicates the element has a way of contacting a member of a group'),//4
array('Type'=>'creator', 'Description'=>'The threshold indicates this Element created the link group (making them a special member)'), //5
array('Type'=>'difficulty', 'Description'=>'These thresholds require a generated Score to pass (common to Tests, Ordeals, and Obstacles)'),//6
array('Type'=>'encountered', 'Description'=>'The threshold indicates the Element has encountered the group (or at least a member)'),//7
array('Type'=>'holds', 'Description'=>'The Element holds or contains the link group, like a pact and its members, or rooms and the furniture'),//8
array('Type'=>'loop', 'Description'=>'These thresholds indicate objects form a scroll that loops around stepping incrementally (usually by +1)'),//9
array('Type'=>'member', 'Description'=>'the Element is a member of the link group'),//10
array('Type'=>'metaphysical', 'Description'=>'The Element is metaphysically joined to the link group'),//11
array('Type'=>'negative', 'Description'=>'These thresholds indicate an Element is a negative effect, like a Wound, hitch, Umbral Prof, or negative member for the group'),//12
array('Type'=>'opposed', 'Description'=>'This Element is opposed to the link group somehow.'),//13
array('Type'=>'owns', 'Description'=>'The Element owns the  group'),//14
array('Type'=>'positive', 'Description'=>'These thresholds indicate an Element is a postive effect, like a Wound, Prof, Annex, Nimbed Prof, or positive member for the group'),//15
array('Type'=>'power', 'Description'=>'These thresholds indicate power or 3rd tier membership of a group'),//16
array('Type'=>'pull', 'Description'=>'These thresholds indicate pull Embodiment effects on a group or element'),//17
array('Type'=>'push', 'Description'=>'These thresholds indicates a push embodiment effect on a group or element'),//18
array('Type'=>'random', 'Description'=>'These thresholds randomly select objects from a group of objects, like drawing them from a bag'),//19
array('Type'=>'relative', 'Description'=>'The threshold is relative but structural, the threshold may vary, for example "Descendant A is to the left of Descendant B is true when you are looking from the north, but not the south"'),//20
array('Type'=>'root', 'Description'=>'The Element is a Root Prof, Core Facet, or most common member'),//21
array('Type'=>'scroll', 'Description'=>'These thresholds move along a list of objects, but only a selection are readable at a time. Like an old tape drive, or a scroll, scrolls can be paged or scrolling (which move a line after a certain amount of gametime or realtime).'),//22
array('Type'=>'skill', 'Description'=>'These thresholds indicate skill or lowest tier membership of a group'),//23
array('Type'=>'structural', 'Description'=>'These thresholds indicate structural connections, like rooms being inside a house, or a mountain being outside and far to the south. Structural thresholds are usually two-way (or are duplicated).'),//24
array('Type'=>'super', 'Description'=>'These thresholds indicate super or top tier membership of a group'),//25
array('Type'=>'talent', 'Description'=>'These thresholds indicate talent or 2nd tier membership of a group'),//26
array('Type'=>'way', 'Description'=>'These thresholds connect this descendant to that descendant with a direction, as a way that can be travelled, many locations can be placed in a group to create a long road with many locations along it. Ways usually two-way (there and back again), and are considered structural'),//27
array('Type'=>'window', 'Description'=>'These thresholds allow some or all senses to be used through them, but they cannot easily be passed through. Window thresholds are usually two-way when physical, but may be one way for magical effects. Windows can be turned into way thresholds to allow passage quite easily (they just need to be big enough and open enough)'),//28
		);
	*/
	static public function findWayFrom($element, $direction, $mode){
		//first things... get the direction and its opposites
		$direction = self::getDirection($direction,'search');
		switch ($mode){
			case "all":
				$types = null;
			break;
			case "ways":
				$types = array ('way', 'structural', 'cartesian', 'relative', 'chain');
			break;
			case "look":
			case "hear":
			case "sense":
			case "smell":
				$types = array ('way', 'structural', 'cartesian', 'relative', 'window', 'holds','chain');
			break;
			case "annex":
				$types = array('prof','annex','chain');
			break;
			case "character":
				$types = array('belongs', 'holds', 'owns','creator','skill', 'talent', 'power', 'super', 'alternate', 'annex', 'prof', 'chain');
			break;
			case "hitch":
				$types = array('owns','affects');
			break;
			default:
				$types = null;
			break;
		}
		$way = array('Root'=>$element, 'Elements'=>array($element=>T13Elements::getT13Element('any',$element)), 'Groups'=>array(), 'Errors'=>array(), 'Thresholds'=>array());
		$way['Thresholds']=self::getThreshold(null, $element, null, $direction, true, $types);
		foreach($way['Threshold'] as $index=>$threshold){
			$threshold=(array)$threshold;
			$way['Elements'][$threshold['RootElement']]=T13Elements::getT13Element('thisun', $threshold['RootElement'],1);
			if (!is_null($threshold['TargetElement'])){
				if (!isset($way['Elements'][$threshold['TargetElement']])){
					$way['Elements'][$threshold['TargetElement']]=T13Elements::getT13Element('thisun', $threshold['TargetElement']);
				}
			}
			if (!is_null($threshold['TargetGroup'])){
				if (!isset($way['Groups'][$threshold['TargetGroup']])){
					$way['Groups'][$threshold['TargetGroup']]=self::getGroupObjects($threshold['TargetGroup']);
				}
			}

		}
		return $way;

	}
	static public function getThreshold($id=null, $post_id=null, $group=null, $statblock=null, $direction=null, $TwoWay=null, $types=null){
		$search = array();
		if (!is_null($id)){$search[]="ThesholdsID = {$id}";}
		if (!is_null($post_id)){
			if (is_numeric($post_id)){
				//only one post id check both root and target
				$search[]=" ( RootElement = {$post_id} OR TargetElement = {$post_id} ) ";
			}else{
				if (is_array($post_id)&&isset($post_id['Root'])&&isset($post_id['Target'])){
					//has root and target but they could be either way around.
					$search[]=" (( RootElement = {$post_id['Root']} AND TargetElement = {$post_id['Target']} ) OR ( RootElement = {$post_id['Target']} AND TargetElement = {$post_id['Root']} ))";
				}
			}
		}
		if (!is_null ($group)){
			if (is_string($group)){
				$group = self::getGroupID($group);
			}
			$search[] = " TargetGroup = {$group} ";
		}
		if (!is_null($statblock)){
			$search[] = " Statblock = {$statblock} ";
		}
		if (!is_null($direction)){
			$direction =self::getDirection($direction,'search');
			$search[]=$direction['SQL'];
		}
		if (is_null($types)){
			//get by types
			$types = self::getThresholdType($types);
			$search[]=$types['SQL'];
		}
		return self::getRows('Thresholds', $search);

	}
	static public function getGroupID($input){
		if (is_string($input)&&!is_numeric($input)){
			$grp = self::getGroups(null, $input); //by name
		}else{
			$grp = self::getGroups(null, null, $input); //by postid
		}
		if (is_null($grp)){
			$grp = self::getGroups($input); //by groupid
		}
		if (!is_null($grp)){
			//error_log('getGroupID grp='.json_encode($grp));
			if (is_array($grp)&&isset( $grp['GroupsID'])){
				return $grp['GroupsID'];
			}else{
				return false;
			}
			if (is_object($grp)){
				return $grp->GroupsID;
			}
		}else{
			//none found so...
			return false;
		}
	}
	static public function getGroups($id=null, $name=null, $post=null){
		if (!is_null($id)){
			if (is_numeric($id)){
				return self::getRows('Groups', 'GroupsID', intVal($id));
			}elseif (is_array($id)) {
				$id = implode(',',$id);
				return self::getRows('Groups',$id, 'GroupsID');
			}
		}
		if (!is_null($name)&&is_string($name)){
			return self::getRows('Groups', 'Name', $name, 'LIKE');
		}
		if (!is_null($post)){
			if (is_numeric($post)){
				return self::getRows('Groups', 'PostID', intVal($post));
			}

		}
	}
	static public function getGroupObjects($group, $depth=3){
		$elements=array('Thresholds'=>array(),'Posts'=>array(), 'Groups'=>'','Errors'=>array() );
		if (is_numeric($group)){
			$grp=self::getGroupID($group);
			if (is_null($grp)){
				$grp =self::getGroups(null, null, $group);
			}
		}else{
			$grp = self::getGroups(null, $group);
		}
		if (!is_null($grp)){
			$elements['Groups']['Root']=$grp;
			$references = self::getThreshold(null, null, $grp->GroupsID);
			if (!is_null($grp->PostID)){
				$references[count($references)]=T13Elements::getT13Element('any',$grp->PostID);
			}
		}else{
			$elements['Errors'][]="Error:: group '{$group}' not found.";
		}
		if (!is_null($references)){
			foreach($references as $index=>$ref){
				$elements['Thresholds'][$index] = $ref;
				if (!is_null($ref->RootElement)){
					if(!isset($elements['Posts'][$ref->RootElement])){
						$elements['Posts'][$ref->RootElement]=T13Elements::getT13Element("some", $ref->RootElement);
					}

				}
				if (!is_null($ref->TargetElement)){
					if (!isset($elements['Posts'][$ref->TargetElement])){
						$elements['Targets'][$ref->TargetElement] = T13Elements::getT13Element("these", $ref->TargetElement);
					}

				}
				if (!is_null($ref->TargetGroup)){
					if ($depth>0){
						$elements['Groups'][$ref->TargetGroup] = self::getGroupObjects($ref->TargetGroup, $depth-1);
					}

				}
			}
		}else{
			$elements['Errors'][]="getGroupObjects:: FAILURE :: No References found to group {$group}";
		}
		return $elements;
	}
	static public function walkThresholdFrom($threshold=null, $element=null, $group=null, $limit=13, $direction='out'){
		$walk=array();
		if (!is_null($threshold)){
			$tT = self::getThreshold($threshold);
		}
		if (!is_null($element)){
			$tE = self::getThreshold(null,$threshold);
			$tG = self::getThreshold(null, null, $threshold);
		}
		if (!is_null($group)){
			$gG = self::getThreshold(null, null, $threshold);
		}
		//and here I need to examine what the data is we get back and build that walk tree...

		return $walk;
	}
	static public function checkPostid($post=null){
		if (is_null($post)){return null;}
		$el = T13Elements::getT13Element('Any', $post);
		if (isset($el['post_id'])){
			return $el['post_id'];
		}else{
			return null;
		}

	}
	static public function checkGroup($groupid=null,$mode='#'){
		if (is_null($groupid)){return null;}
		if (is_numeric($groupid)){
			//is id a group id or pact id?...
			$group=self::getGroupID($groupid);
			if (!$group){
				$group = self::getGroups(null,null,$groupid);
			}
		}else{
			if (is_string($groupid)){
				$group = self::getGroups(null,$groupid);
			}
		}
		if (isset($group->GroupsID)&&$mode=='#'){return $group->GroupsID;}else{return $group;}
	}
	static public function addThisGroup($name,$description,$groupType, $postid){
		$group =array();
		$group['Name'] = T13Sanitize::sanitize($name);
		$group['Description'] = T13Sanitize::sanitize($description);
		$group['GroupType'] = self::getGroupType($groupType);
		$group['PostID'] = self::checkPostid($postid);
		return self::addGroup($group);
	}
	static public function tieThreshold($type, $direction, $description, $element, $target=null,$group=null,$statblock=null, $facet=null, $diff=null, $twoway=false,$data=array()){
		$type=self::getThresholdTypes($type,'#');
		$direction = self::getDirection($direction,'#');
		$description=T13Sanitize::sanitize($description);
		$element=self::checkPostid($element);
		$target=self::checkPostid($target);
		$group= self::checkGroup($group,'#');
		$statblock=T13Statblock::isStatblock($statblock);
		$facet = isset($facet)?T13Facets::getFacetIndex($facet):null;
		$diff = is_integer($diff)?$diff:null;
		$twoway = boolval($twoway);
		$data=T13Sanitize::sanitize($data);
		if (!is_null($type)){
			$threshold = array('Description'=>$description, 'RootElement'=>$element, 'ThresholdType'=>$type, 'ThresholdDirection'=>$direction, 'TargetElement'=>$target,'TargetGroup'=>$group, 'Statblock'=>$statblock, 'Facet'=>$facet, 'ThresholdDiff'=>$diff,'TwoWay'=>$twoway,'Data'=>$data);
			//this should check if a threshold of the correct type already ties the root and target... if this is a minor change we should adjust the row that already exists (like a hitch changes tier etc).
			$check = self::getThreshold(null, ['Root'=>$element,'Target'=>$target], $group, $statblock, $direction, $twoway, $type);
			if ($check!==null){
				// this threshold exists already in some form.

			}else{
				// nope this is new.
				return self::addThreshold($threshold);
			}
			//so we need to do the check and branch...


		}else{
			return false;
		}

	}
	static public function untieThreshold($threshold){
		global $wpdb;
		$tb=self::tablename('Thresholds');
		// passes in the whole row which must be checked...
		// deletes a row, if you are allowed to delete it...
		$current_user = wp_get_current_user();
		$User=$current_user->ID;
		if ($threshold['User']==$User){
			//well you seem to own it...
			return $wpdb->delete($tb,$threshold);
			//should delete the row.
		}else{
			error_log('You should own the Threshold if you want to delete or untie it.');
			return false;
		}
	}
	static public function addMemberToPact($groupid,$memberid){
		$group=self::checkGroup($groupid,'obj');
		$member = self::checkPostid($memberid);
		return self::tieThreshold('member','in',"Automatically added when Member ({$member}) was added to Group ({$group->GroupsID}) / Element ({$group->PostID}).", $member,$group->PostID, $group->GroupsID, null, false, []);
	}

	static public function readThreshold($threshold){
		if (isset($threshold['ThresholdType'])){
			$threshold['Type'] = T13Types::$thresholdTypes[$threshold['ThresholdType']];
			$threshold['Direction'] = T13Types::$thresholdDirections[$threshold['ThresholdDirection']];

		}
		return $threshold;
	}

	static public function installThresholds(){
		global $wpdb;

		/* not sure that we need these yet...
		self::addtable('ThresholdDirections',"`Type` TEXT NOT NULL UNIQUE,
			`Description` LONGTEXT NULL DEFAULT NULL,
			`Cross-Ref` LONGTEXT NULL DEFAULT NULL
			", $thresholdDirections );
		self::addtable('ThresholdTypes',"`Type` TEXT NOT NULL UNIQUE,
			`Description` LONGTEXT NULL DEFAULT NULL
			", T13Types::$thresholdTypes);
		self::addtable('GroupTypes',"`Type` TEXT NOT NULL UNIQUE,
			`Description` LONGTEXT NULL DEFAULT NULL
			", T13Types::$groupTypes);
			*/

		self::addtable('Groups', "`Name` TEXT NOT NULL,
			`Description` LONGTEXT DEFAULT NULL,
			`GroupType` INTEGER NOT NULL DEFAULT 0,
			`PostID` BIGINT(20) DEFAULT 0", array(array('Name'=>'Control Group', 'Description'=>'Default Control Group was created as a first test of the installation.','GroupType'=>6, 'PostID'=>0)));
		self::addtable('Thresholds', "`Description` LONGTEXT DEFAULT NULL,
			`RootElement` BIGINT(20)  DEFAULT NULL,
			`ThresholdType` INTEGER NOT NULL DEFAULT 0,
			`ThresholdDirection` INTEGER  DEFAULT NULL,
			`TargetElement` BIGINT(20) DEFAULT NULL,
			`TargetGroup` BIGINT(20)  DEFAULT NULL,
			`Statblock` BIGINT (20) DEFAULT NULL,
			`Facet` INTEGER Default NULL,
			`ThresholdDiff` INTEGER DEFAULT NULL,
			`TwoWay` BOOLEAN NOT NULL DEFAULT FALSE,
			`User` BIGINT (20) NOT NULL DEFAULT 0,
			`Data` LONGTEXT
			", array(array('Description'=>'T13 Threshold Control was created as a first test of the Threshold system and breaks at least one of the rules because it doesn’t actually connect anything to anything else.', 'RootElement'=>NULL,'ThresholdType'=>0,'ThresholdDirection'=>0, 'TargetElement'=>NULL, 'TargetGroup'=>0,'Statblock'=>0, 'Facet'=>NULL, 'ThresholdDiff'=>NULL, 'TwoWay'=>FALSE, 'Data'=>json_encode( array('Name'=>'Test Threshold') ))));
		return  array('install'=>1, 'of'=>1 ,'threshold'=>'Groups Established. Control Group Created. Limen Established.');

    }
}

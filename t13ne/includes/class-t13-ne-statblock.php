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
 * Fired during plugin activation. Statblock
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Statblock{

	private static $statblock = array(
		'Name'=>'Universal',
		'Hex'=>array(0,63),
		'Scale'=>0, 'Stats'=>array(
			array('Facet'=>0,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>9, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>2,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>13, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>3,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>22, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>5,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>16, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>6,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>1, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>7,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>14, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>10,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>4, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>11,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>21, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>15,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>12, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>18,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>20, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>19,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>17, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
			array('Facet'=>23,'Facet_Boon'=>13, 'Facet_Sway'=>0,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>8, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0)
		)
	);
	public static $mystats = array(
		array(
			'Name'=>'Multiversal/a1',
			'Hex'=>array(32,33),
			'Scale'=>7, 'Stats'=>array(
				array('Facet'=>0,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>9, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>2,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>13, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>3,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>22, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>5,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>16, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>6,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>1, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>7,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>14, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>10,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>4, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>11,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>21, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>15,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>12, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>18,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>20, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>19,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>17, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0),
				array('Facet'=>23,'Facet_Boon'=>13, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>8, 'Antifacet_Boon'=>13, 'AntiFacet_Sway'=>0)
			)
		),
		array(
			'Name'=>'Omniversal/Cycles',
			'Hex'=>array(0,0),
			'Scale'=>13, 'Stats'=>array(
				array('Facet'=>0,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>9, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>2,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0,'Antifacet'=>13, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>3,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>22, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>5,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>16, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>6,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>1, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>7,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>14, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>10,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>4, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>11,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>21, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>15,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>12, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>18,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>20, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>19,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>17, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0),
				array('Facet'=>23,'Facet_Boon'=>26, 'Facet_Sway'=>0, 'Facet_Mutation_Matrix'=>0, 'Joined'=>FALSE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>8, 'Antifacet_Boon'=>26, 'AntiFacet_Sway'=>0)
			)
		)
	);
static public function getNewStatblock(){
	return count(self::$mystats);
}
static public function buildStats($stat=[13],$sway=[0]){
		//var_dump($stat);
	$stats=array(13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13);
	$count=count($stat);
	if (is_array($sway)){
		$swaya=count($sway);
	}else{
		if (is_numeric($sway)&&$sway>24){
			$sway=[intval($sway/24)];
		}else{
			$sway=[0];
		}
		$swaya=1;
	}

	if ($count<23){
		for ($i=0;$i<12;$i++){
			$stats[$i]=intval($stat[$i%$count]);
			$stats[$i+12]=26-intval($stats[$i]);
		}
	}else{
		for ($i=0;$i<24;$i++){
			$stats[$i]=intval($stat[$i%$count]);
		}
	}
		//var_dump($stats);
	return array(
		array('Facet'=>0,'Facet_Boon'=>$stats[0], 'Facet_Sway'=>$sway[0],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[0]==(26-$stats[12])), 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>9, 'Antifacet_Boon'=>$stats[12], 'AntiFacet_Sway'=>$sway[1%$swaya]),
		array('Facet'=>2,'Facet_Boon'=>$stats[1], 'Facet_Sway'=>$sway[2%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[1]==(26-$stats[13])), 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>13, 'Antifacet_Boon'=>$stats[13], 'AntiFacet_Sway'=>$sway[3%$swaya]),
		array('Facet'=>3,'Facet_Boon'=>$stats[2], 'Facet_Sway'=>$sway[4%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[2]==(26-$stats[14])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>22, 'Antifacet_Boon'=>$stats[14], 'AntiFacet_Sway'=>$sway[5%$swaya]),
		array('Facet'=>5,'Facet_Boon'=>$stats[3], 'Facet_Sway'=>$sway[6%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[3]==(26-$stats[15])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>16, 'Antifacet_Boon'=>$stats[15], 'AntiFacet_Sway'=>$sway[7%$swaya]),
		array('Facet'=>6,'Facet_Boon'=>$stats[4], 'Facet_Sway'=>$sway[8%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[4]==(26-$stats[16])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>1, 'Antifacet_Boon'=>$stats[16], 'AntiFacet_Sway'=>$sway[9%$swaya]),
		array('Facet'=>7,'Facet_Boon'=>$stats[5], 'Facet_Sway'=>$sway[10%$swaya], 'Facet_Mutation_Matrix'=>0,   'Joined'=>($stats[5]==(26-$stats[17])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>14, 'Antifacet_Boon'=>$stats[17], 'AntiFacet_Sway'=>$sway[11%$swaya]),
		array('Facet'=>10,'Facet_Boon'=>$stats[6], 'Facet_Sway'=>$sway[12%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[6]==(26-$stats[18])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>4, 'Antifacet_Boon'=>$stats[18], 'AntiFacet_Sway'=>$sway[13%$swaya]),
		array('Facet'=>11,'Facet_Boon'=>$stats[7], 'Facet_Sway'=>$sway[14%$swaya], 'Facet_Mutation_Matrix'=>0,   'Joined'=>($stats[7]==(26-$stats[19])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>21, 'Antifacet_Boon'=>$stats[19], 'AntiFacet_Sway'=>$sway[15%$swaya]),
		array('Facet'=>15,'Facet_Boon'=>$stats[8], 'Facet_Sway'=>$sway[16%$swaya], 'Facet_Mutation_Matrix'=>0,   'Joined'=>($stats[8]==(26-$stats[20])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>12, 'Antifacet_Boon'=>$stats[20], 'AntiFacet_Sway'=>$sway[17%$swaya]),
		array('Facet'=>18,'Facet_Boon'=>$stats[9], 'Facet_Sway'=>$sway[17%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[9]==(26-$stats[21])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>20, 'Antifacet_Boon'=>$stats[21], 'AntiFacet_Sway'=>$sway[19%$swaya]),
		array('Facet'=>19,'Facet_Boon'=>$stats[10], 'Facet_Sway'=>$sway[20%$swaya],  'Facet_Mutation_Matrix'=>0,  'Joined'=>($stats[10]==(26-$stats[22])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>17, 'Antifacet_Boon'=>$stats[22], 'AntiFacet_Sway'=>$sway[21%$swaya]),
		array('Facet'=>23,'Facet_Boon'=>$stats[11], 'Facet_Sway'=>$sway[22%$swaya], 'Facet_Mutation_Matrix'=>0,   'Joined'=>($stats[11]==(26-$stats[23])),'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>8, 'Antifacet_Boon'=>$stats[23], 'AntiFacet_Sway'=>$sway[23%$swaya])
	);

}
static public function setStats($alt=0,$stats=[13], $sway=[0], $scale=0,$hex=array('%','%'), $name='Unnamed'){
	//error_log('SetStats '.json_encode( array('alt'=>$alt,'stats'=>$stats,'sway'=>$sway,'scale'=>$scale,'hex'=>$hex,'Name'=>$name)));
	if ($name == "Unamed" || is_numeric($name) && $name == $alt && $alt>0) {
			//the name has not been set. Pull the title
		$name = get_the_title($alt);
	}

	if (is_array($sway)){
		$swaya=count($sway);
	}else{
		if (is_numeric($sway)&&$sway>24){
			$sway=[$sway/24];
		}else{
			$sway=[0];
		}
		$swaya=1;
	}
	if ($alt==0){$alt=self::getNewStatblock();}

	$stats=self::buildStats($stats,$sway);
	$count=24;

	if (is_array($hex)&&($hex[0]=='%')){
		if (is_array($stats)){
			$hex=T13IChing::calculateIChing($stats);
		}else{
				//var_dump($stats);
			$hex=array(T13Dice::RNG(0,63),T13Dice::RNG(0,63));
		}
	}
	self::$mystats[$alt] = array('Name'=>$name,'Hex'=>$hex,'Scale'=>$scale, 'Stats'=>$stats, 'Alt'=>$alt);
	self::db_SetStatblock(self::$mystats[$alt], 'new', $alt);
	return self::$mystats[$alt];
}
static function plotAdjustLimit($plotSize){
	switch(round(intval($plotSize)/2)){
		case 0:return 19;
		case 1:
		case 2:
		case 3: return 20;
		case 4:
		case 5: return 21;
		case 6: return 22;
		case 7: return 23;
		case 8:
		case 9:return 24;
		case 10:
		case 11:return 25;
		case 12:return 26;
	}
}
static public function setFacetSway($statblock, $facet, $sway){
	$error="Worked";

}
static public function plotStats($statblock,$plotSize,$alt=0){
		//these are random attributes for plots to mimic all the people they have Hooked...
	if (!is_numeric($alt)){$alt=0;}
	$limit=self::plotAdjustLimit($plotSize);
		// error_log('PlotStats Limit='.$limit);
	if (!is_array($statblock)){$statblock=self::getStats($alt,$statblock);}
	if ($statblock['Scale']!=floor($plotSize/1.8)){
		$statblock['Scale']=floor($plotSize/1.8);
			// error_log('Scale updated');
	}
	for ($i=0;$i<12;$i++){

			// error_log('Updating Statpair'.$i);
		$statblock['Stats'][$i]['Joined']=0;
		if ($statblock['Stats'][$i]['Facet_Boon']<13){
				// error_log($statblock['Stats'][$i]['Facet_Boon'].' Stat increasing to 13...');
			$statblock['Stats'][$i]['Facet_Boon']=13; }
			$statblock['Stats'][$i]['Facet_Boon']+=$plotSize;
			// error_log('stat increased by $plotSize '.$plotSize);
			if ($statblock['Stats'][$i]['Facet_Boon']>$limit){
				$statblock['Stats'][$i]['Facet_Boon']=$limit;
				// error_log('Stat reduced to limit '.$limit);
			}
			if ($statblock['Stats'][$i]['Antifacet_Boon']<13){
				// error_log($statblock['Stats'][$i]['Antifacet_Boon'].' antistat increased to 13...');
				$statblock['Stats'][$i]['Antifacet_Boon']=13;}
				$statblock['Stats'][$i]['Antifacet_Boon']+=$plotSize;
			//error_log('antistat increased by $plotSize'.$plotSize);
				if ($statblock['Stats'][$i]['Antifacet_Boon']>$limit){
					$statblock['Stats'][$i]['Antifacet_Boon']=$limit;
				// error_log('AntiStat reduced to limit '.$limit);
				}
			}
			$statblock['Hex']=T13IChing::calculateIChing($statblock['Stats']);
			self::$mystats[$alt]=$statblock;
		//self::getStats($alt,)
			return self::encodeStatblock($alt);
		}
		static public function randomiseStats($type=0,$alt=0, $scale=0, $statno=12){
			$stats=array();
			for($i=0;$i<=$statno;$i++){
				if ($type==0){$typer=T13Dice::RNG(1,7,0);}else{$typer=$type;}
				switch ($typer){
					case '1':
					$stats[]=intval(T13Dice::RNG (1,25,0));
					break;
					case '2':
					$stats[]=intval(T13Dice::RNG(1,12,0)+T13Dice::RNG(0,13,0));
					break;
					case '3':
					$stats[]=intval(T13Dice::RNG(1,6,0)+T13Dice::RNG(1,6,0)+T13Dice::RNG(1,6,0));
					break;
					case '4':
					$stats[]=intval(13+T13Dice::RNG(0,13,0)-T13Dice::RNG(0,13,0));
					break;
					case '5':
					$stats[]=intval(8+T13Dice::RNG(0,10,0));
					break;
					case '6':
					$stats[]=intval(T13Dice::RNG(6,20,0));
					break;
					default:
					$stats[]=intval(T13Boons::getBoonReduced(T13Dice::RNG(1,200,0)));
					break;
				}

			}
			return self::setStats($alt,$stats, $scale,'%',$alt);
		}
		static public function orderStats($statblock){
			$order=array();
			if (isset($statblock['Stats'])){
				foreach ($statblock['Stats'] as $s){
					$order[]=array($s['Facet']=>$s['Facet_Boon']+$s['Facet_Mutation_Matrix']);
					$order[]=array($s['Antifacet']=>$s['Antifacet_Boon']+$s['Antifacet_Mutation_Matrix']);
				}
				$order=arsort($order);
			}
			return $order;
		}
		static public function bestStats($in,$compare){
			self::$mystats['Best']=$in;
			if(!isset($compare['Scale'])){
				$compare=self::$mystats[0];
			}
			$inscale=$in['Scale'];
			$coscale=$compare['Scale'];
			foreach(self::$mystats['Best']['Stats'] as $key=>$best){
				if (($best['Facet_Boon']+$inscale+$best['Facet_Mutation_Matrix'])<($compare[$key]['Facet_Boon']+$coscale+$compare[$key]['Facet_Mutation_Matrix'])){
					self::$mystats['Best']['Stats'][$key]['Facet_Boon']=$compare[$key]['Facet_Boon']+$coscale-$inscale;
					self::$mystats['Best']['Stats'][$key]['Facet_Mutation_Matrix']=$compare[$key]['Facet_Mutation_Matrix'];
				}
				if (($best['Antifacet_Boon']+$inscale+$best['Antifacet_Mutation_Matrix'])<$compare[$key]['Antifacet_Boon']+$coscale+$compare[$key]['Antifacet_Mutation_Matrix']){
					self::$mystats['Best']['Stats'][$key]['Antifacet_Boon']=$compare[$key]['Antifacet_Boon']+$coscale-$inscale;
					self::$mystates['Best']['Stats'][$key]['Antifacet_Mutation_Matrix'] = $compare[$key]['Antifacet_Mutation_Matrix'];
				}
				self::$mystats['Best'][$key]['Joined'] = (bool) (self::$mystats['Best'][$key]['Facet_Boon']==26-self::$mystats['Best'][$key]['Antifacet_Boon']);
			}
			self::$mystats['Best']['Hex']=T13IChing::calculateIChing(self::$mystats['Best']['Stats']);
			return self::$mystats['Best'];
		}
		static public function getBoonForFacet($facet=0,$alt=0, $statblock='%'){
			//var_dump($facet);
			if ($statblock=='%'){
				$statblock=self::getStats($alt);
			}
			if (is_numeric($facet)){
				$facet=T13Facets::$facets[$facet];
			}elseif (is_string($facet)){
				foreach(T13Facets::$facets as $f)
				{
					if ($facet===$f||$facet==$f['FacetInitial']||$facet==$f['FacetName']||$facet==$f['Persona']['Name']||$facet==$f['Core']){
						$facet=$f;
						break;
					}
				}
			}
			if (is_numeric($statblock)){
				$statblock=self::getStats($statblock);
			}elseif(is_string($statblock)){
				self::loadStatsfromSC($statblock,$alt);
				$statblock=self::$mystats[$alt];
			}
			if (is_array($statblock)){
				$scale=$statblock['Scale'];
				$stats=$statblock['Stats'];
				foreach($stats as $statpair){
					if ($facet['FacetIndex']===$statpair['Facet']||$facet['FacetName']===$statpair['Facet']){
						//var_dump([$facet['FacetIndex'],$facet['FacetName'],$statpair['Facet']]);
						return array('Scale'=>$scale,'Boon'=>intVal($statpair['Facet_Boon'])+intVal($statpair['Facet_Mutation_Matrix']));
					}elseif($facet['FacetIndex']==$statpair['Antifacet']||$facet['FacetName']==$statpair['Antifacet']){
						return array('Scale'=>$scale, 'Boon'=>intVal($statpair['Antifacet_Boon'])+intVal($statpair['Antifacet_Mutation_Matrix']));
					}
				}
			}else{
			//couldn't find it defaults to 0:13
				return array('Scale'=>0, 'Boon'=>13);
			}
		}
		static public function writeStatPair($statpair, $scale=0){
		//var_dump($statpair);
			$facet=T13Facets::getFacet($statpair['Facet']);
			$antifacet=T13Facets::getFacet($statpair['Antifacet']);
			$maxyang=intval($statpair['Facet_Boon'])+intval($scale)+intval($statpair['Facet_Mutation_Matrix']);
			$maxyin= intval($statpair['Antifacet_Boon']) + intval($scale) +intval($statpair['Antifacet_Mutation_Matrix']);
			$boon = T13Boons::writeFullBoon($maxyang,1);
			$yang = $statpair['Facet_Sway'];
			$sway = T13Facets::$facets[$statpair['Facet']]['Sway'];
			$yin = $statpair['AntiFacet_Sway'];
			$join = $statpair['Joined'];
			$asway =  T13Facets::$facets[$statpair['Antifacet']]['Sway'];
			$adjective = T13Facets::getFacetAdjective($statpair['Facet'], $maxyang);
			$antiboon =  T13Boons::writeFullBoon($maxyin,1);
			$antiAdjective = T13Facets::getFacetAdjective($statpair['Antifacet'],$maxyin);
			return array('HTML'=>"<div class=\"t13ne-statpair\"><div class=\"t13ne-left\"><span class=\"t13ne-facet\" data-facet-{$statpair['Facet']}=\"{$statpair['Facet_Boon']}\">{$facet}</span> <span class=\"t13ne-facet-adjective\"><strong>{$adjective}</strong></span><span class=\"t13ne-boon\">{$boon}</span> <span class=\"t13ne-sway\"  data-yang=\"{$yang}\" > <strong>{$sway}</strong>: {$yang}</span> <span class=\"t13ne-facet-joined\"><input class=\"t13ne-joined\" type=\"checkbox\" value = \"{$join}\" ".($join? 'checked':'')."/></span></div><div class=\"t13ne-right\"><span class=\"t13ne-antifacet\" data-facet-{$statpair['Antifacet']}=\"{$statpair['Antifacet_Boon']}\" data-yin=\"{$yin}\">{$antifacet}</span> <span class=\"t13ne-antfacet-adjective\"><strong>{$antiAdjective}</strong></span> <span class=\"t13ne-antiboon\" data-antiboon=\"{$statpair['Antifacet_Boon']}\" title=\"Facet Boon\">{$antiboon}</span> <span class=\"t13ne-sway\"  data-yin=\"{$yin}\" title=\"Facet Sway\"> <strong>{$asway}</strong>: {$yin}</span></div></div>",'MaxYin'=>$maxyin, 'MaxYang'=>$maxyang,);

		}
		static public function getCurrentCharScale(){
			$statblock=self::getStats(0);
			return $statblock['Scale'];
		}
		static public function writeStatBlock($statblock){
			$statblockj= json_encode($statblock);
			//error_log('writeStatBlock::'.$statblockj);
			$rethtml='<!--t13ne-statblock //--><section class="t13ne-statblock" data-statcode="'.self::encodeStatblock($statblock).'" data-alt="'.$statblock['Alt'].'">';
			$count=0;
			if (!is_array($statblock)){
				foreach(self::$mystats as $altstats){
					$rethtml.="<figure class=\"t13ne-alt-block\" data-block=\"{$count}\" data-statblock=\"{$statblockj}\">";
					$scale=$altstats['Scale'];
					$stats=$altstats['Stats'];
					$iching=T13IChing::displayIChing($altstats['Hex']);
					if ($stats){
						$maxyin=0;
						$maxyang=0;
						foreach ((array)$stats as $statpair){
							$ret=self::writeStatPair($statpair, $scale);
							$rethtml .= $ret['HTML'];
							$maxyin+=$ret['MaxYin'];
							$maxyang+=$ret['MaxYang'];
						}
					}
					$count++;
					$rethtml.="<div class=\"t13ne-yang t13ne-left\"><strong>Max-Yang: </strong>{$maxyang}</div><div class=\"t13ne-yin t13ne-right\"><strong>Max-Yin: </strong>{$maxyin}</div>";
					$rethtml.='</figure>'.$iching;
				}
			}else{
				$rethtml.="<figure class=\"t13ne-alt-block\" data-block=\"{$count}\">";
				$scale=$statblock['Scale'];
				$stats=$statblock['Stats'];
				if (!isset($statblock['Hex'])){$statblock['Hex']=T13IChing::calculateIChing($stats);}
				$iching=T13IChing::displayIChing($statblock['Hex']);
				$maxyin=0;
				$maxyang=0;
				foreach ($stats as $statpair){
					$ret = self::writeStatPair($statpair, $scale);
					$rethtml .= $ret['HTML'];
					$maxyin+=$ret['MaxYin'];
					$maxyang+=$ret['MaxYang'];
				}
				$rethtml.="<div class=\"t13ne-yang t13ne-left\"><strong>Max-Yang: </strong>{$maxyang}</div><div class=\"t13ne-yin t13ne-right\"><strong>Max-Yin: </strong>{$maxyin}</div>";
				$rethtml.='</figure>'.$iching;
				$count++;
			}
			$rethtml.='</section>';
			return $rethtml;
		}

		static public function getStats($alt=0,$statshortcode='',$getSway=0){
			$stats=0;
			if (!is_numeric($alt)){$alt=0;}
			if ($statshortcode&&!isset(self::$mystats[$alt])){
				self::loadStatsfromSC($statshortcode,$alt);
			}
			if (isset(self::$mystats[$alt])){
				if(!$getSway){
					return self::$mystats[$alt];
				}
			}else{
				if ($alt>0){
					self::$mystats[$alt] = self::db_getStatblock(null, $alt);
					if (is_null(self::$mystats[$alt])){
						$pst=get_post($alt, 'Object');
						if (!is_wp_error($pst)&&is_object($pst)){
							if ($pst->ID==$alt){
							//if a shortcode Statblock exists then it should pop in.
								$tmpo=apply_filters('the_content',$pst->post_content);

							}
						}
					}
					if (self::$mystats[$alt]){
						if(!$getSway){return self::$mystats[$alt];}
					}

				}
			//and if not found... return the default
				if (!$getSway){return self::$mystats[0];}
			}
			if (isset(self::$mystats[$alt])){
				$yin=0;
				$yang=0;
				foreach(self::$mystats[$alt]['Stats'] as $stp){
					$yang+=$stp['Facet_Boon']+self::$mystats[$alt]['Scale']+$stp['Facet_Mutation_Matrix'];
					$yin+=$stp['Antifacet_Boon']+self::$mystats[$alt]['Scale']+$stp['Antifacet_Mutation_Matrix'];
				}
				return self::$mystats[$alt]+array('Yin'=>$yin,'Yang'=>$yang,'ID'=>$alt);
			}
		}


		static public function changeFacet($facet=0,$change=0, $stats=0){
			$chicost=0;
			if (!isset($stats['Stats'])){
				if (is_numeric($stats)){
					$stats=self::getStats($stats);
				}
			}
			foreach(self::$mystats as &$fp){
				if ($facet==$fp['Facet']){
					$fp['Facet_Boon']+=$change;
					$chicost+=$fp['Facet_Boon']+$fp['Facet_Mutation_Matrix'];
					if ($fp['Joined']){
						$fp['Antifacet_Boon']+=-$change;
						$chicost+=$fp['Antifacet_Boon']+$fp['Antifacet_Mutation_Matrix'];
					}
				}elseif($facet==$fp['Antifacet']){
					if ($fp['Joined']){
						$fp['Facet_Boon']+=-$change;
						$chicost+=$fp['Facet_Boon']+$fp['Facet_Mutation_Matrix'];
					}
					$fp['Antifacet_Boon']+=$change;
					$chicost+=$fp['Antifacet_Boon']+$fp['Antifacet_Mutation_Matrix'];
				}
			}
			return $chicost;
		}

		static public function displayIChing($input){
			if (is_numeric($input)){
				if ($input>0&&$input<65){
					return T13IChing::displayIChing($input);
				}
				if ($input>64){
					$stats=self::getStats($input);
				}
			}
			if (is_array($input)){
				if (count($input)==2&&is_numeric($input[0])&&$input[0]>=0&&$input[0]<65){
					return T13IChing::displayIChing($input);
				}else{
					foreach ($input as $key=>$val){

						if ($key=='Hex'){
							return T13IChing::displayIChing($val);
						}
						if ($key=='post_id'){
							$stats=self::getStats($val);
						}
					}
				}
			}
			if (is_string($input)){
				$stats=self::getStats(0,$input);
			}
			if (isset($stats)){
				if (!isset($stats['Hex'])){
					$stats['Hex']=T13IChing::calculateIChing($stats);
				}
				return T13IChing::displayIChing($stats['Hex']);
			}
			return false;
		}
		static public function loadStatsfromSC($statstring, $alt=0){
		//note loadStats passes in the shortcode statblock format. The alt may not be a character and can be am annex, descendant, plot or character...
			$s=explode(':', $statstring);
			if (!is_numeric($alt)){$alt=0;}
			if ($s[1]=="rand"||!is_numeric($s[0])){
				$s[0]=intval($s[0]);
				self::randomiseStats(0,$alt,$s[0]);
			}else{
				$scale=$s[0];
				$st=explode(',', $s[1]);
				$hex=explode('=',$s[2]);
				$sway=(isset($s[3])?$s[3]:[0]);

			//$alt=0,$stats=[13], $sway=[0], $scale=0,$hex=array('%','%'), $name='Unnamed'
				self::setStats($alt,$st,$sway,$scale,$hex,$alt);
			}
			return self::writeStatblock(self::$mystats[$alt]);
		}
		static public function displayStatblock($stats,$alt){
		//generates transferrable shortcode...
			if ($alt=='#'){
				try{
					$posti = wp_get_recent_posts(array('post_type'=>'element', 'numberposts'=>'1', 'tax_query'=>array(array ('taxonomy' => 't13type','field' => 'name','terms' => 'Character','operator'=>'IN'))), 'Object');
			// if alt is hashed use the most recent character.
					$Obj = $posti[0];
					if (!is_wp_error($Obj)&&is_object($Obj)){
						$alt=$Obj->ID;
					}else{
						$alt=count(self::$mystats);
					}
				}catch(Exception $e){
					$alt=count(self::$mystats);
				}
			}
			if ($alt=='new'||$alt=='child'){
				try{
					$alt=get_the_ID();
					if ($stats=='new'){
						$stats='0:rand';
					}
					if ($stats=='child'){
						$stats='-3:rand';
					}
				}catch(Exception $e){
					$alt=count(self::$mystats);
				}
			}
			if ($alt=='parent'){
				if (is_numeric($stats)){
					if (post_exists($stats)){
						$alt=wp_get_post_parent_id( $stats );
						$stats=self::getStats($alt);
					}
				}else{
					$alt=wp_get_post_parent_id( get_the_ID() );
					$stats=self::getStats($alt);
				}
			}
			if ($stats=='get'){
				$stats=self::getStats($alt);
			}
			if (!is_numeric($alt)){$alt=count(self::$mystats);}
			if (is_array($stats)){self::$mystats[$alt]=$stats;
				return self::writeStatblock($stats);
			}elseif (is_string($stats)){
				return self::loadStatsfromSC($stats,$alt);
			}elseif (is_numeric($stats)){
				$stats=self::getStats($stats);
				return self::writeStatblock($stats);
			}
		}
		static public function writeStatblockSC($alt){
			if (!is_numeric($alt)){$alt=0;}
			return '[t13ne type="statblock" stats="'.self::encodeStatblock($alt).'" alt="'.$alt.'" /]';
		}
		static public function encodeStatblock($alt){
		//var_dump(self::$mystats);

			if (!is_numeric($alt)){$alt=count(self::$mystats)-1;}
			if (is_numeric($alt)&&$alt>count(self::$mystats)-1){$alt=count(self::$mystats)-1;}
			if (isset(self::$mystats[$alt])){
				$scale=self::$mystats[$alt]['Scale'];
				$statsi=self::$mystats[$alt]['Stats'];
				$stats=array();
				$antistats=array();
			}
			if (isset(self::$mystats[$alt]['Hex'])){
				$hex=self::$mystats[$alt]['Hex'];
			}else{$hex=array(T13Dice::RNG(0,63),T13Dice::RNG(0,63));}
			if (isset($statsi)){
				foreach($statsi as $statpair){
					$stats[]=$statpair['Facet_Boon'];
					$yangsway[]=$statpair['Facet_Sway'];
					$antistats[]=$statpair['Antifacet_Boon'];
					$yinsway[]=$statpair['AntiFacet_Sway'];
				}
				$st=implode(',', array_merge($stats, $yangsway, $antistats, $yinsway));
				return "{$scale}:{$st}:{$hex[0]}={$hex[1]}";
			}
		}
		static public function getAntiFacet($facet){
			$facet=T13Facets::getFacet($facet,'array');
			return $facet['AntiFacet'];
		}
		static public function db_SetStatblock($stats,$statblockID='new', $postid=-1){
			global $wpdb;
		// 'Hex'=>array(32,33),
		// 'Scale'=>0, 'Stats'=>array(
		// 	0AJ array('Facet'=>0,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>9, 'Antifacet_Boon'=>13),
		// 	1CN array('Facet'=>2,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>13, 'Antifacet_Boon'=>13),
		// 	2DY array('Facet'=>3,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>22, 'Antifacet_Boon'=>13),
		// 	3FQ array('Facet'=>5,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>16, 'Antifacet_Boon'=>13),
		// 	4GB array('Facet'=>6,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>1, 'Antifacet_Boon'=>13),
		// 	5HO array('Facet'=>7,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>14, 'Antifacet_Boon'=>13),
		// 	6KE array('Facet'=>10,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>4, 'Antifacet_Boon'=>13),
		// 	7LW array('Facet'=>11,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>21, 'Antifacet_Boon'=>13),
		// 	8PM array('Facet'=>15,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>12, 'Antifacet_Boon'=>13),
		// 	9SV array('Facet'=>18,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>20, 'Antifacet_Boon'=>13),
		// 	10TR array('Facet'=>19,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>17, 'Antifacet_Boon'=>13),
		// 	11ZI array('Facet'=>23,'Facet_Boon'=>13,'Facet_Mutation_Matrix'=>0, 'Joined'=>TRUE, 'Antifacet_Mutation_Matrix'=>0, 'Antifacet'=>8, 'Antifacet_Boon'=>13)
		// )) ##outdated as it does not include Facet Sway
			$row = array(
				'name'=>T13Sanitize::sanitize($stats['Name']),
				'scale'=>intVal($stats['Scale']),
				'hexagram1'=>intVal($stats['Hex'][0]),
				'hexagram2'=>intVal($stats['Hex'][1]),
				'wpost'=>intVal($postid),
				'alt'=>isset($stats['Alt'])?intVal($stats['Alt']):intVal($postid),
			);
			$defaultorder=[[0,9],[2,13],[3,22],[5,16],[6,1],[7,14],[10,4],[11,21],[15,12],[18,20],[19,17],[23,8]];
			for($i=0;$i<12;$i++){
				$row['facet'.$i] = isset($stats['Stats'][$i]['Facet'])?$stats['Stats'][$i]['Facet']:$defaultorder[$i][0] ;
				$row["facet{$i}_boon"] = isset($stats['Stats'][$i]['Facet_Boon'])?$stats['Stats'][$i]['Facet_Boon']:13;
				$row["facet{$i}_sway"] = isset($stats['Stats'][$i]['Facet_Sway'])?$stats['Stats'][$i]['Facet_Sway']:0;
				$row["facet{$i}_mutation_matrix"] = isset($stats['Stats'][$i]['Facet_Mutation_Matrix'])?$stats['Stats'][$i]['Facet_Mutation_Matrix']:0;
				$row['joined'.$i] = isset($stats['Stats'][$i]['Joined'])?$stats['Stats'][$i]['Joined']?TRUE:FALSE:TRUE;
				$row["antifacet{$i}_mutation_matrix"] = isset($stats['Stats'][$i]['Antifacet_Mutation_Matrix'])?$stats['Stats'][$i]['Antifacet_Mutation_Matrix']:0;
				$row['antifacet'.$i] = isset($stats['Stats'][$i]['Antifacet'])?$stats['Stats'][$i]['Antifacet']:$defaultorder[$i][1];
				$row["antifacet{$i}_boon"] = isset($stats['Stats'][$i]['Antifacet_Boon'])?$stats['Stats'][$i]['Antifacet_Boon']:13;
				$row["antifacet{$i}_sway"] = isset($stats['Stats'][$i]['Antifacet_Sway'])?$stats['Stats'][$i]['Antifacet_Sway']:0;
			}
			if ($statblockID!=='new'){
			//this updates the table for a known statblock
				return $wpdb->update($wpdb->prefix.'T13_NE_Statblocks', $row, array('Statblock_Id'=>$statblockID), array('%s','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d'), array('%d'));
			}else{
			//this creates a new statblock for the stats to live in
				$wpdb->insert($wpdb->prefix.'T13_NE_Statblocks', $row, array('%s','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d', '%d','%d','%d','%d','%d'));
				$newid = $wpdb->insert_id;
				return $newid;
			}
		}
		static public function db_convert($ret){
		//error_log('db_convert:'.json_encode( $ret ));
			if (isset($ret['hexagram1'])&&isset($ret['antifacet11_boon'])){

				return array(
					'Name'=>$ret['name'],
					'post_id'=>isset($ret['wpost'])?$ret['wpost']:null,
					'Alt'=>$ret['alt'],
					'Hex'=>array($ret['hexagram1'],$ret['hexagram2']),
					'Scale'=>$ret['scale'], 'Stats'=>array(
						array('Facet'=>$ret['facet0'],'Facet_Boon'=>$ret['facet0_boon'],'Facet_Sway'=>$ret['facet0_sway'], 'Facet_Mutation_Matrix'=>$ret['facet0_mutation_matrix'], 'Joined'=>$ret['joined0'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet0_mutation_matrix'], 'Antifacet'=>$ret['antifacet0'], 'Antifacet_Boon'=>$ret['antifacet0_boon'], 'Antifacet_Sway'=>$ret['antifacet0_sway']),
						array('Facet'=>$ret['facet1'],'Facet_Boon'=>$ret['facet1_boon'],'Facet_Sway'=>$ret['facet1_sway'], 'Facet_Mutation_Matrix'=>$ret['facet1_mutation_matrix'], 'Joined'=>$ret['joined1'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet1_mutation_matrix'], 'Antifacet'=>$ret['antifacet1'], 'Antifacet_Boon'=>$ret['antifacet1_boon'], 'Antifacet_Sway'=>$ret['antifacet1_sway']),
						array('Facet'=>$ret['facet2'],'Facet_Boon'=>$ret['facet2_boon'],'Facet_Sway'=>$ret['facet2_sway'], 'Facet_Mutation_Matrix'=>$ret['facet2_mutation_matrix'], 'Joined'=>$ret['joined2'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet2_mutation_matrix'], 'Antifacet'=>$ret['antifacet2'], 'Antifacet_Boon'=>$ret['antifacet2_boon'], 'Antifacet_Sway'=>$ret['antifacet2_sway']),
						array('Facet'=>$ret['facet3'],'Facet_Boon'=>$ret['facet3_boon'],'Facet_Sway'=>$ret['facet3_sway'], 'Facet_Mutation_Matrix'=>$ret['facet3_mutation_matrix'], 'Joined'=>$ret['joined3'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet3_mutation_matrix'], 'Antifacet'=>$ret['antifacet3'], 'Antifacet_Boon'=>$ret['antifacet3_boon'], 'Antifacet_Sway'=>$ret['antifacet3_sway']),
						array('Facet'=>$ret['facet4'],'Facet_Boon'=>$ret['facet4_boon'],'Facet_Sway'=>$ret['facet4_sway'], 'Facet_Mutation_Matrix'=>$ret['facet4_mutation_matrix'], 'Joined'=>$ret['joined4'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet4_mutation_matrix'], 'Antifacet'=>$ret['antifacet4'], 'Antifacet_Boon'=>$ret['antifacet4_boon'], 'Antifacet_Sway'=>$ret['antifacet4_sway']),
						array('Facet'=>$ret['facet5'],'Facet_Boon'=>$ret['facet5_boon'],'Facet_Sway'=>$ret['facet5_sway'], 'Facet_Mutation_Matrix'=>$ret['facet5_mutation_matrix'], 'Joined'=>$ret['joined5'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet5_mutation_matrix'], 'Antifacet'=>$ret['antifacet5'], 'Antifacet_Boon'=>$ret['antifacet5_boon'], 'Antifacet_Sway'=>$ret['antifacet5_sway']),
						array('Facet'=>$ret['facet6'],'Facet_Boon'=>$ret['facet6_boon'],'Facet_Sway'=>$ret['facet6_sway'], 'Facet_Mutation_Matrix'=>$ret['facet6_mutation_matrix'], 'Joined'=>$ret['joined6'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet6_mutation_matrix'], 'Antifacet'=>$ret['antifacet6'], 'Antifacet_Boon'=>$ret['antifacet6_boon'], 'Antifacet_Sway'=>$ret['antifacet6_sway']),
						array('Facet'=>$ret['facet7'],'Facet_Boon'=>$ret['facet7_boon'],'Facet_Sway'=>$ret['facet7_sway'], 'Facet_Mutation_Matrix'=>$ret['facet7_mutation_matrix'], 'Joined'=>$ret['joined7'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet7_mutation_matrix'], 'Antifacet'=>$ret['antifacet7'], 'Antifacet_Boon'=>$ret['antifacet7_boon'], 'Antifacet_Sway'=>$ret['antifacet7_sway']),
						array('Facet'=>$ret['facet8'],'Facet_Boon'=>$ret['facet8_boon'],'Facet_Sway'=>$ret['facet8_sway'], 'Facet_Mutation_Matrix'=>$ret['facet8_mutation_matrix'], 'Joined'=>$ret['joined8'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet8_mutation_matrix'], 'Antifacet'=>$ret['antifacet8'], 'Antifacet_Boon'=>$ret['antifacet8_boon'], 'Antifacet_Sway'=>$ret['antifacet8_sway']),
						array('Facet'=>$ret['facet9'],'Facet_Boon'=>$ret['facet9_boon'],'Facet_Sway'=>$ret['facet9_sway'], 'Facet_Mutation_Matrix'=>$ret['facet9_mutation_matrix'], 'Joined'=>$ret['joined9'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet9_mutation_matrix'], 'Antifacet'=>$ret['antifacet9'], 'Antifacet_Boon'=>$ret['antifacet9_boon'], 'Antifacet_Sway'=>$ret['antifacet9_sway']),
						array('Facet'=>$ret['facet10'],'Facet_Boon'=>$ret['facet10_boon'],'Facet_Sway'=>$ret['facet10_sway'], 'Facet_Mutation_Matrix'=>$ret['facet10_mutation_matrix'], 'Joined'=>$ret['joined10'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet10_mutation_matrix'], 'Antifacet'=>$ret['antifacet10'], 'Antifacet_Boon'=>$ret['antifacet10_boon'], 'Antifacet_Sway'=>$ret['antifacet10_sway']),
						array('Facet'=>$ret['facet11'],'Facet_Boon'=>$ret['facet11_boon'],'Facet_Sway'=>$ret['facet11_sway'], 'Facet_Mutation_Matrix'=>$ret['facet11_mutation_matrix'], 'Joined'=>$ret['joined11'], 'Antifacet_Mutation_Matrix'=>$ret['antifacet11_mutation_matrix'], 'Antifacet'=>$ret['antifacet11'], 'Antifacet_Boon'=>$ret['antifacet11_boon'], 'Antifacet_Sway'=>$ret['antifacet11_sway']),
					)
);
}
if (isset($ret['Stats'])&&is_array($ret['Stats'])&&isset($ret['post_id'])&&is_array($ret['Hex'])){
	$row = array(
		'name'=>T13Sanitize::sanitize($ret['Name']),
		'scale'=>$ret['Scale'],
		'hexagram1'=>$ret['Hex'][0],
		'hexagram2'=>$ret['Hex'][1],
		'alt'=>$ret['Alt'],
		'wpost'=>isset($ret['post_id'])?$ret['post_id']:null,
	);
	$defaultorder=[[0,9],[2,13],[3,22],[5,16],[6,1],[7,14],[10,4],[11,21],[15,12],[18,20],[19,17],[23,8]];
	for($i=0;$i<12;$i++){
		$row['facet'.$i] = isset($ret['Stats'][$i]['Facet'])?$ret['Stats'][$i]['Facet']:$defaultorder[$i][0] ;
		$row["facet{$i}_boon"] = isset($ret['Stats'][$i]['Facet_Boon'])?$ret['Stats'][$i]['Facet_Boon']:13;
		$row["facet{$i}_sway"] = isset($ret['Stats'][$i]['Facet_Sway'])?$ret['Stats'][$i]['Facet_Sway']:0;
		$row["facet{$i}_mutation_matrix"] = isset($ret['Stats'][$i]['Facet_Mutation_Matrix'])?$ret['Stats'][$i]['Facet_Mutation_Matrix']:0;
		$row['joined'.$i] = isset($ret['Stats'][$i]['Joined'])?$ret['Stats'][$i]['Joined']?TRUE:FALSE:TRUE;
		$row["antifacet{$i}_mutation_matrix"] = isset($ret['Stats'][$i]['Antifacet_Mutation_Matrix'])?$ret['Stats'][$i]['Antifacet_Mutation_Matrix']:0;
		$row['antifacet'.$i] = isset($ret['Stats'][$i]['Antifacet'])?$ret['Stats'][$i]['Antifacet']:$defaultorder[$i][1];
		$row["antifacet{$i}_boon"] = isset($ret['Stats'][$i]['Antifacet_Boon'])?$ret['Stats'][$i]['Antifacet_Boon']:13;
		$row["antifacet{$i}_sway"] = isset($ret['Stats'][$i]['Antifacet_Sway'])?$ret['Stats'][$i]['Antifacet_Sway']:0;
	}
	return $row;
}
return $ret;

}
static public function db_getStatblock($statblockID=NULL,$postID=NULL){
	global $wpdb;
	$tb =$wpdb->prefix."T13_NE_Statblocks";
	$ret=NULL;
	if (!is_null($statblockID)){
		$ret= $wpdb->get_results("SELECT * FROM {$tb} WHERE Statblock_Id = {$statblockID}");
	}
	if (!is_null($postID)){
		$ret= $wpdb->get_results("SELECT * FROM {$tb} WHERE wpost = {$postID}");
	}
	if (!is_null($ret)||(is_array($ret)&&count($ret))){
		return self::db_convert($ret);
	}else{

			//the default return.
		return T13Statblock::$statblock;
	}
}
static public function getStatIDs($row){
	error_log('getStatIDs:: row='.json_encode($row));
	global $wpdb;
	$tb =$wpdb->prefix."T13_NE_Statblocks";
	if (isset($row['Stats'])&&isset($row['Hex'])&&is_array($row['Stats']&&is_array($row['Hex']))){
		$row = self::db_convert($row);
	}
	$sql = "SELECT `Statblock_Id` FROM {$tb} WHERE ";
	foreach ($row as $key=>$value){
		if (!is_null($value)){
			$key = T13Sanitize::sanitize($key);
			$value = trim(T13Sanitize::sanitize($value));
			$sql.=" `{$key}` ";
			if (is_numeric($value)){
				$sql.=" = {$value}";
			}else{
				$sql .=" LIKE '%{$value}%' ";
			}
			$sql.=" AND ";
		}

	}
	$sql .=" 1=1";
	error_log('getStatIds sql='.$sql);
	$result = $wpdb->get_results($sql);
	error_log('getStatIds result='.json_encode($result));
	return $result;
}
static public function getStatID($these){
	if (is_numeric($these)){
		return self::getStatIDs(array('wpost'=>$these));
	}
	if (is_array($these)){
		return self::getStatIDs(self::db_convert($these));
	}
	if (is_string($these)){
		return self::getStatIDs(array('name'=>$these));
	}
	return null;

}
static public function getThisStatBlock($id=NULL){
	if (is_null($id)){return null;}
	if (is_numeric($id)){
		if (isset($id)&&isset(self::$mystats[$id])){
			$statblock= self::$mystats[$id];
		}
		$statblock = self::db_getStatblock($id);
		if (json_encode( $statblock ) === json_encode(T13Statblock::$statblock)){
				//might be a post id instead...
			$statblock = self::db_getStatblock(null, $id);
		}
	}else{
		if (T13Types::is_Json($id)){
			$statblock=json_decode($id, true);
		}else{
			$statblock = self::getStats('SC',$id);
		}
	}
		self::$mystats[$id]=$statblock; //cached in case we need it more than once.
		return $statblock;
	}

	static public function getPostStats($postid){
		$statblock = self::db_getStatblock(null, $postid);
		error_log("getPostStats::".$statblock);
		self::$mystats[$statblock['Statblock_Id']] = $statblock;
		return $statblock;
	}
	static public function isStatblock($id=NULL){
		if (is_null($id)){return null;}
		$stat=self::getThisStatBlock($id);
		if(json_encode( $stat ) === json_encode(T13Statblock::$statblock)){
			return 0;
		}
		return $id;
	}
	static public function installStatblocks(){
		global $wpdb;
		$id='Statblock_Id';
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		$tb=$wpdb->prefix."T13_NE_Statblocks";
		$charset=$wpdb->get_charset_collate();
		$wpdb->query("SET FOREIGN_KEY_CHECKS=0;");
		$wpdb->query("DROP TABLE IF EXISTS {$tb}");
		$wpdb->query("SET FOREIGN_KEY_CHECKS=1;");
		$tb2 = $wpdb->prefix.'posts';

		$sqlpass=" `wpost` BIGINT(20) NULL DEFAULT NULL,
		`name` VARCHAR(22) NULL DEFAULT NULL,
		`alt` BIGINT(20) NULL DEFAULT NULL,
		";
		for ($i=0;$i<12;$i++){
			$sqlpass.="`facet{$i}` INTEGER NULL DEFAULT NULL,
			`facet{$i}_boon` INTEGER NULL DEFAULT NULL,
			`facet{$i}_sway` INTEGER NULL DEFAULT NULL,
			`facet{$i}_mutation_matrix` INTEGER NULL DEFAULT NULL,
			`joined{$i}` BOOLEAN NULL DEFAULT NULL,
			`antifacet{$i}_mutation_matrix` INTEGER NULL DEFAULT NULL,
			`antifacet{$i}` INTEGER NULL DEFAULT NULL,
			`antifacet{$i}_boon` INTEGER NULL DEFAULT NULL,
			`antifacet{$i}_sway` INTEGER NULL DEFAULT NULL,";
		}

		$sqlpass.="
		`scale` INTEGER NULL DEFAULT NULL,
		`hexagram1` INTEGER NULL DEFAULT NULL,
		`hexagram2` INTEGER NULL DEFAULT NULL,
		";

		$sql = "CREATE TABLE {$tb} ( `{$id}` INTEGER NOT NULL AUTO_INCREMENT ,
			{$sqlpass}
			PRIMARY  KEY (`{$id}`)
		);";
		//FOREIGN KEY (`wpost`) REFERENCES `{$tb2}`(`ID`)
		$wpdb->query( $sql );
		dbDelta();
		T13Statblock::db_SetStatblock(T13Statblock::$statblock );
		foreach (T13Statblock::$mystats as $key => $stats) {
			T13Statblock::db_SetStatblock($stats);
		}
		// $c=count(self::$coreHitches);

		// $installed=array('block'=>0, 'of'=>$c, 'install'=>0);
  //   	foreach(self::$coreHitches as $core){
		// 	if ($core['Specify']){
		// 		$name= $core['Name'].' (Specify)';
		// 	}else{
		// 		$name=$core['Name'];
		// 	}
		// 	$type=T13Types::$hitchTypes[$core['HitchType']];
		// 	$facethitchtype = T13Facets::$facets[T13Facets::getFacetIndex($core['Facet'])]['Hitch'];
		// 	$name=T13Sanitize::sanitize($name)+':'+T13Sanitize::sanitize($name)+" Hitch:"+$core['Facet']+' '+$facethitchtype+' '+$type['Type']+' Hitch';
		// 	if ($name==''){$name='Error Unnamed Hitch';}
  //   		if (post_exists($name)){
  //   			$installed['hitch']=$name;
  //   			$installed['install']++;
  //   		}else{
  //   			$installed['hitch']=$name;
  //   			$installed['install']+=self::installHitch($installed['install']);
  //   			return $installed;
  //   		}

  //   	}
		return 1;
	}
	static public function mutateFacet($facet,$mutation){
		$chicost=0;
		foreach(self::$mystats as &$fp){
			if ($facet==$fp['Facet']){
				$fp['Facet_Mutation_Matrix']+=$mutation;
				$chicost+=$fp['Facet_Mutation_Matrix'];
			}elseif($facet==$fp['Antifacet']){
				$fp['Antifacet_Mutation_Matrix']+=$mutation;
				$chicost+=$fp['Antifacet_Mutation_Matrix'];
			}
		}
		return $chicost;
	}
	static public function mutateStats($mutationmatrix=array(0=>0,1=>0,2=>0,3=>0,4=>0,5=>0,6=>0,7=>0,8=>0,9=>0,10=>0,11=>0,12=>0,13=>0,14=>0,15=>0,16=>0,17=>0,18=>0,19=>0,20=>0,21=>0,22=>0,23=>0), $stats=0){
		//this applies a mutation matrix to a Stat. This will not directly affect Facet Boons, but will affect Values, and Costs.
		if (!isset($stats['Stats'])){
			if (is_numeric($stats)){
				$stats=self::getStats($stats);
			}
		}
		if ($stats['Stats']){
			foreach ($stats['Stats'] as &$statpair){
				$statpair['Facet_Mutation_Matrix'] = $mutationmatrix[$statpair['Facet']];
				$statpair['AntiFacet_Mutation_Matrix'] = $mutationmatrix[$statpair['Antifacet']];
			}
		}
		return $stats;
	}

}
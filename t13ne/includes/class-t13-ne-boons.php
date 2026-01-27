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
 */
class T13Boons{
	static public function getBoonAbsolute($boon){
		if (is_array($boon)){
			return intval($boon['Scale'])+intval($boon['Boon']);
		}else{
			return $boon;
		}
	}
	static public function addBoons(){
		$value=0;
		$ats=func_get_args();
		if (isset($ats)){
			if (is_string($ats[0])){
				$boons=explode('+',$ats[0]);
			}
			foreach ($boons as $boon){
				$value+=self::getBoonValue($boon);
			}
			$nboon=self::getBoonReduced($value);
			if ($value>self::getBoonValue($nboon)){
				$nboon+=1;
			}
			return $nboon;
		}
		return 'Well that worked! Try adding Boons together.';
	}
	static public function getHalfBoon($boon){
		return (self::getBoonReduced(0.5*self::getBoonValue($boon)));
	}
	static public function getBoonValue($boon){
		$boon= self::getBoonAbsolute($boon);
		$mul=1;
		if ($boon<0){$boon=abs($boon);$mul=-1;}
		if ($boon==0){
			$mul=0;
			return 0;
		}elseif ($boon>=99850){
			//try local
			return '<script>var currentScript=document.currentScript||(function(){var scripts = document.getElementsByTagName("script");return scripts[scripts.length-1];});window.T13NE.Render(window.T13NE.CE("span",{className:"t13ne-bignumbers"},window.T13NE.Boon.getBoonValue('.$boon.')),currentScript.parentElement);</script>';


		}else{
			return $mul*round($boon*(pow(2,(pow($boon,(1/3))))));
		}
	}

	static public function getBoonReduced($boon, $score=false){
		$mul=1;
		$boon= self::getBoonAbsolute($boon);
		if (is_numeric($boon)){
			if ($boon<0){$boon=abs($boon);$mul=-1;}
			if ($boon>1&&$boon<9223372036854775807){
				$ret='boon='.$boon;
				$min=round(pow(($boon-1),1/3)*log ($boon-1))-1;
				$ret.=' min='.$min;
				for($i=$min;$i<=$boon;$i++){
					$b=self::getBoonValue($i/2);
					if ($b<=$boon){
						if ($score){
							$retval= $i/2;
						}else{
							$retval= floor($i/2);
						}
					}
					if ($b>=$boon){$i=$boon+1;return $retval*$mul;}else{
						$ret.=' '.$i.'=/='.$b;
					}
				}
				return $ret*$mul;
			}
			if($boon<=2){
				return $mul*$boon/2;
			}
		}else{
			return "Look I don't know how this happened, but that ({$boon}) was no Boon.";
		}
	}
	static public function getBoonScore($boon){
		return self::getBoonReduced($boon,true);
	}
	static public function getBoonDraw($boon){
		return self::getBoonReduced(self::getboonReduced($boon));
	}
	static public function boonTable($min=1,$max=26){
		$ret='<div class="t13ne-tablewrap"><table class="t13ne-table"><thead><tr><th class="t13ne-draw">Draw 🃏</th><th class="t13ne-score">Score</th><th><span class="t13ne-boon"><strong>Boon</strong></span></th><th class="t13ne-value">Value</th><th class="t13ne-supervalue">Super-Value</th><th class="t13ne-boon-dice"> 🎲 </th></tr></thead><tbody>';
		if ($min<1){$min=1;}
		if ($max<=$min){$max=$min+1;}
		for ($i=$min;$i<=$max;$i++){
			$ret.='<tr><td class="t13ne-draw">'.self::getBoonDraw($i).'</td>';
			$ret.='<td class="t13ne-score">'.self::getBoonReduced($i).'</td>';
			$ret.='<td class="t13ne-boon"><strong>'.$i.'</strong></td>';
			$ret.='<td class="t13ne-value">'.self::getBoonValue($i).'</td>';
			$ret.='<td class-"t13ne-supervalue">'.self::getBoonValue(self::getBoonValue($i)).'</td>';
			$ret.='<td class="t13ne-boon-dice">'.T13Dice::getDiceForBoon($i,false).'</td></tr>';
		}
		$ret.='</tbody><tfoot><tr><td class="t13ne-draw">Draw 🃏</td><td class="t13ne-score">Average Score</td><td class="t13ne-boon"><strong>Boon</strong></td><td class="t13ne-value">Value</td><td class="t13ne-supervalue">Super-Value</td><td class="t13ne-boon-dice"> 🎲 </td></tr></tfoot></table></div>';
		return $ret;
	}
	static public function writeBoon($boon){
		return '<span class="t13ne-boon" data-t13ne-boon="'.$boon.'"><strong>'.$boon.'</strong> (Value:'.number_format(self::getBoonValue($boon)).') ['.number_format(self::getBoonReduced($boon)).'/'.number_format(self::getBoonDraw($boon)).']</span>';
	}
	static public function writeBane($boon){
		return '<span class="t13ne-bane" data-t13ne-bane="'.$boon.'"><strong>'.$boon.'</strong> (Value:'.number_format(self::getBoonValue($boon)).') ['.number_format(self::getBoonReduced($boon)).'/'.number_format(self::getBoonDraw($boon)).']</span>';
	}
	static public function writeFullBoon($boon, $t=true, $bane=false, $annex=false){
		//var_dump($boon);
		$boon=self::getBoonAbsolute($boon);

		if (is_numeric(intval($boon))){
			if ($annex){ //annex passes in Value not Boon
				$value = $boon;
				$val = number_format($value);
				$boon = self::getBoonReduced($value);
				$woon =number_format($boon);
				$super = number_format(self::getBoonValue($value));
				$score = number_format(self::getBoonReduced($boon));
				$draw = number_format(self::getBoonDraw($boon));
				$dice = T13Dice::getDiceForBoon($boon);
				}else{
				$woon =number_format($boon);
				$val = number_format(self::getBoonValue($boon));
				$super = number_format(self::getBoonValue(self::getBoonValue($boon)));
				$score = number_format(self::getBoonReduced($boon));
				$draw = number_format(self::getBoonDraw($boon));
				$dice = T13Dice::getDiceForBoon($boon);
			}
			$title='';
			if ($t){
				$title='Boon: ';
				$scoret='Score';
				$drawt='Draw 🃏';
				if ($bane){
					$title = 'Bane: ';
					$scoret='Marks';
					$drawt='Ruins';
				}
			}

				return "<details class=\"t13ne-bane\" data-t13ne-bane=\"{$boon}\"><summary><strong>{$title} {$woon}</strong>[{$score}/{$draw}]</summary><section>
			<div class=\"t13ne-dice\"><strong>Dice 🎲: </strong>{$dice}</div>
			<div class=\"t13ne-score\"><strong title=\"Average Rolled Score\">{$scoret}: </strong>[{$score}]</div>
			<div class=\"t13ne-draw\"><strong title=\"Average Card Draws\">{$drawt} : </strong>{$draw}</div>
			<div class=\"t13ne-value\"><strong>Value: </strong>({$val})</div>
			<div class=\"t13ne-super-value\"><strong>Super-Value: </strong> {{$super}}</div></section>
			</details>";





			// return $boon.$t.'<div class="t13ne-boon" data-t13ne-boon="'.$boon.'"><strong>'.((bool)$t?'Boon: ':'').number_format($boon).'</strong> '.((bool)$t?' 🎲 : ':'').T13Dice::getDiceForBoon($boon).' ('.(bool)$t?'Value : ':''.number_format(self::getBoonValue($boon)).') '.' {'.(bool)$t?'Super-Value : ':''.number_format(self::getBoonValue(self::getBoonValue($boon))).'} [<details><summary>'.((bool)$t?'Score: ':'').number_format(self::getBoonReduced($boon)).'/'.((bool)$t?'Draw: ':'').number_format(self::getBoonDraw($boon)).'] </div>';
		}else{
			return "This '{$boon}' is not a boon!";
		}
	}
	static public function boonvsboon($boon,$vsboon){
		//the original Boon Test from the 1994 version of the game.
		$ret="<!-- boon vs boon -->";
		$aval=self::getBoonValue($boon);
		$bval=self::getBoonValue($vsboon);
		$pera=round(100*($aval/($aval+$bval)));
		return $ret.'<span class="t13ne-boonvsboon"><span class="result">Percentage Chance='.$pera.'% </span><a href="#" onclick="rolldice(\'d100\');" id="diceroll:'.md5(time().'Yeah, make it a unique ID.'.T13Dice::RNG(6000)).'">Roll</a></span> ';
	}
}
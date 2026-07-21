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
 * Fired during plugin activation. Input Sanitizer
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Sanitize{
	//Generic sanitizer for database entrys...
 	static public function sanitize($c,$len=16777215){
 		if (is_array($c)){
 			foreach($c as $key=>$val){
 				if ($key == self::sanitize($key)){
 					$c[$key]=self::sanitize($val);
 				}else{
 					error_log('Nasty unsanitary data key ('.json_encode($key).') found');
 				}
 			}
 		}
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
			$c=preg_replace('/\s+/', ' ', $c);//remove duplicate spaces;
			$c=html_entity_decode($c); //decode incase encoded
			$c=strip_tags($c, '<a><abbr><address><area><article><aside><audio><b><bdi><bdo><blockquote><br><canvas><caption><cite><code><col><colgroup><dd><del><details><dfn><div><dl><dt><em><figcaption><figure><footer><h2><h3><h4><h5><h6><header><hgroup><hr><i><img><ins><kbd><label><legend><li><map><mark><menu><meter><nav><ol><p><pre><q><rp><rt><ruby><s><samp><section><small><source><span><strong><sub><summary><sup><table><tbody><td><tfoot><th><thead><time><tr><track><tt><u><ul><var><video><wbr>');
			$c=preg_replace("/on\S*=/i", "data-naughty=", $c);
			$c=str_replace(' & ',' &amp; ', $c);
			$c=str_replace("\'",'&#39;', $c);
			$c=str_replace("'",'&#39;', $c);
			//$c=str_replace('"','&#34;', $c);
			$c=str_replace("`",'&#96;', $c);
			$c=str_replace('´','&#180;', $c);
			$c=str_replace('‵','&#8245;',$c);
			$c=str_replace('‘', '&#8216;', $c);
			$c=str_replace('’', '&#8217;', $c);
			$c=str_replace('˝', '&#733;', $c);
			$c=str_replace('″', '&#8243;', $c);
			$c=str_replace('“', '&#8220;', $c);
			$c=str_replace('”', '&#8221;', $c);
			$c=str_replace('’', '&#146;', $c);
			$c=str_replace('♣', '&clubs;', $c);
			$c=str_replace('♥', '&hearts;', $c);
			$c=str_replace('♠', '&spades;', $c);
			$c=str_replace('♦', '&diams;', $c);
			$c=str_replace('T13 ', '&#120139;13 ', $c);
			if (strlen($c)>$len){
				$c=substr($c,0,$len);
			}
			//$c=htmlspecialchars($c, ENT_HTML5|ENT_SUBSTITUTE, 'UTF-8',TRUE); //encode non html
		
		}		
		return $c;
	}
	static public function SanitizePath($path){
		//may need fixing on live!
		if (T13Types::contains($path,':\\')){
			$path=str_ireplace('//', '\\', $path);
			$path=str_ireplace('\/', '\\', $path);
		}else{
			$path=str_ireplace('\/', '/', $path);
		}
		return $path;
	}
}
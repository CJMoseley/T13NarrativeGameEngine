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
 * Fired during plugin activation. Games
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Games{
	//Games are our containers. Most things like Proficiencies should be applied to individual games. the Game should tell us all the Profs, Characters, Descendants and Plots that are available. 
	private static $coreGames = array();
	public static  function displayGames($author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any', $scope='any', $parent='any'){
		return T13Elements::getT13Elements('Game', $author,$geo,$tags,$facet,$genre,$era, $scope, $parent);
    }
	static public function displayGame($game){
    	//var_dump($game);
    	//shortcode gameicap display...
    	if ( ! function_exists( 'wp_get_recent_posts' ) ) {
    		//if posts exists doesn't load it.
   			 require_once( ABSPATH . 'wp-includes/post.php' );
		}
    	if (is_numeric($game)){
    		//probably an id
    		$gameObj = get_post($game );
    		$faceterm = wp_get_post_terms($game, 'facet');
    	}elseif (is_string($game)&&$game!='#'){
    		//based on the name
    		$gameObj=get_page_by_title( $game, 'Object', 'element' );	
    		$faceterm = wp_get_post_terms($gameObj->ID);
    	}elseif ($game=='#'){
    		//, 'tax_query'=>array(array('taxonomy' => 't13type',      		'field' => 'name',       		'terms' => 'Game',       		'operator'=>'IN'))
    		$gamei = wp_get_recent_posts(array('post_type'=>'element', 'numberposts'=>'1'), 'Object');
    		//var_dump($gamei);
    		$gameObj = $gamei[0];
    		$faceterm = wp_get_post_terms($gameObj->ID);
    	}
    	$facets=T13Facets::getFacetArr();
    	foreach ($facets as $f){
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
			if (!is_wp_error($gameObj)){
				$rethtml='<div class="t13ne-game"><strong class="t13ne-gametitle">Game: </strong><details><summary>';
				$rethtml.=' <span class="t13ne-title"> <q>'.$gameObj->post_title.'</q> </span>';
				$rethtml.='</summary>';
		
				$content=$gameObj->post_content;
				$rethtml.='<div class="t13ne-postdata">'.$content.'</div>';
				$rethtml.='<p class="t13ne-postdata"<span class="t13ne-date">Posted : '.$gameObj->post_date.' .</span> <span class="t13ne-author"> Created by: '.get_user_by('id', $gameObj->post_author).'</span></p></details></div>';
				return $rethtml;
			}else{
				return json_encode($gameObj);
			}
    }

	 static public function addGame($name,$description,$facets,$genres,$eras, $scope, $publish=false){
    	//add a single Game. This is adding a custom post programmatically.
    	//better santitize that name...
    	$typer='Game';
    	$suffix='';
    	if ( ! function_exists( 'post_exists' ) ) {
    		//if posts exists doesn't load it.
   			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		if ($publish){
			$publish ='publish';
		}else{
			$publish ='draft';
		}
		$name=T13Sanitize::sanitize($name);
		//echo('adding Handicap: '.$name);
		$geo=T13Geometry::writeGeometry($name, false);
		$geo_id=T13Geometry::getGeoTerms($name);
		if (is_string($facets)){
			$faceterm = term_exists( $facets, 't13facet');
			$f_id= intval($faceterm['term_id']);
		}else{
			$f_id=$facets;
		}
		if (is_string($genres)){
			$gterm = term_exists( $genres, 't13facet');
			$g_id= intval($gterm['term_id']);
		}else{
			$g_id=$genres;
		}
		if (is_string($eras)){
			$eterm = term_exists( $eras, 't13facet');
			$e_id= intval($eterm['term_id']);
		}else{
			$e_id=$eras;
		}
		if (is_string($scopes)){
			$sterm = term_exists( $scopes, 't13facet');
			$s_id= intval($sterm['term_id']);
		}else{
			$s_id=$scopes;
		}
		
		$content=$geo['GeoText'].$typ.T13Sanitize::sanitize($description);
		$post_id=post_exists( $name );
		if ($post_id){
			$typeo=T13Types::checkTaxon($typer, 't13type', $post_id);
			if (strtolower($typeo)){
				$suffix=' '.$typer;
				$post_id=post_exists($name.$suffix);
			}
		}
		if (!$post_id){
		$game="<div class=\"t13ne-game\">";
		
		$post_id = wp_insert_post( array (
			    'post_type' => 'game',
			    'post_title' => $name.$suffix,
			    'post_content' => $content,
			    'post_status' => $publish,
			    'comment_status' => 'closed'   // if you prefer
			    //'ping_status' => 'closed',    // if you prefer
			),true);
			$term_taxonomy_ids=wp_set_object_terms($post_id, $f_id,'t13facet', true);			
			$term_taxonomy_ids = wp_set_object_terms($post_id, $genres,'t13genre', true);			
			$term_taxonomy_ids = wp_set_object_terms($post_id, $eras, 't13era', true);	
			$term_taxonomy_ids = wp_set_object_terms($post_id, $scope, 't13scope', true);
			$term_taxonomy_ids = wp_set_object_terms($post_id, $geo_id, 't13geo', true);		
		}
		return $post_id;
    }
    static public function installGames(){
    	if ( ! function_exists( 'post_exists' ) ) {
    		//if posts exists doesn't load it.
   			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		$c=count(self::$coreGames);
		$installed=array('game'=>0, 'of'=>$c, 'install'=>0);
		
    	foreach(self::$coreGames as $core){
			if ($core['Specify']){
				$name= $core['Name'].' (Specify)';
			}else{
				$name=$core['Name'];
			}
			$name=T13Sanitize::sanitize($name);
    		if (post_exists($name)){
    				$installed['install']++;
    		}else{
    			$installed['game']=$name;
    			$installed['install']+=self::installGame($installed['install']);
    			return $installed;
    		}
    	}
    }
	static public function installGame($install){
		if (count(self::$coreGames)>$install){

			$coreG=self::$coreGames[$install];
			if ($coreG['Specify']){
				$name= $coreG['Name'].' (Specify)';
			}else{
				$name=$coreG['Name'];
			}
			$rooterm = term_exists( $coreG['RootFacet'], 't13facet');
			$channelterm =  term_exists( $coreG['ChannelFacet'], 't13facet');
			$f_id= array(intval($rooterm['term_id']), intval($channelterm['term_id']));
			$genre= term_exists($coreG['Genre'],'t13genre');
			$scope = term_exists($coreG['Scope'], 't13scope');
			$s_id = intval($scope['term_id']);
			$g_id = intval($genre['term_id']);
			$era= term_exists($coreG['Era'], 't13era');
			$e_id =intval($era['term_id']);
			self::addHandicap( $name, $coreG['Description'], $f_id, $g_id, $e_id, $s_id, true );
			return 1;			
		}	
		
	}
}
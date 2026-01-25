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
 * Fired during plugin activation. Descendants
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Descendants{
	//Descendants can store Chi. Each time you store an amount of Chi equal to the maximum dice roll of the Master Annex you may add an Edge.
	// Each time you manage to add Yarn equal to the maximum Dice Roll you may add a Glow.
		public static $coreDescs = array(
			array('Name'=>'Zeitgeist','IncarnaFacet'=>'Awe', 'LocationFacet'=>'n/a', 'DescendantType'=>2, 'Description'=>'The Zeitgeist is the spirit of the age, it sums up the feelings bubbling in society expressed in this time periods, mores, cultures, fashions, art and technology. The Zeitgeist is not always available to everyone who lives in an age, many feel that their time is not now, but was some point in their youth, or that they are living for the future.', 'Annexes'=>array(
				array('Name'=>'Spirit of the Age', 'Annex_Type'=>3, 'Description'=>'The Spirit of the Age governs the mores and affects of the time period. It includes knowledge of the fads, fashions and ideas', 'Statblock'=>'2:15,11:%=%', 'ABoon'=>'%%',
				'Profs'=>array(
					array('Facet'=>'Inertia', 'Prof'=>'Time', 'Prof_Description'=>'Time is the non-spatial dimensions that we we exist in. We don\'t perceive time the same way as we do the spatial dimensions of our continuum, instead seemingly we exist in the now, but due to relativity that we have all potentially taken different routes to reach that now, some longer or shorter (usually by a few microseconds at most) than others. Time is often simplified to a linear dimension that passes from past to future, but that simplistic model is in many ways an illusion. In fact time is not truly linear, but has a topological dimension of less than one (it isn\'t truly linear since we naturally appear to move in only one direction) which at the very least makes it fractal in nature.' , 'ProfInAnnex'=>0),
					array ('Facet'=>'Awe', 'Prof'=>'Spiritual', 'Prof_Description'=>'Spirit is the Incarna of the Awe Facet, being Spiritual can be a direct reflection of this, but may also reflect religious and even social beliefs, beyond actual spirits and souls.', 'ProfInAnnex'=>1),
					array('Facet'=>'Dominion', 'Prof'=>'Society', 'Prof_Description'=>'Society is the the word we use for the largest Groups. Most people of any populations are members of some society or another, even if just the national and supra-national communities.', 'ProfInAnnex'=>3),
					array('Facet'=>'Awe', 'Prof'=>'Fashion', 'Prof_Description'=>'Fashion is the style of the culture, expressed through the clothes, art and music of the time. Fashion may be faddish, coming and going quickly, but also evolves slowly over time, the modern business suit, which developed from the more formal Victorian suit, varies by season in colour, number of buttons, cuffs, cuts, vents and pockets, but the suit itself is little changed for over a hundred years.' , 'ProfInAnnex'=>6),
					array('Facet'=>'Wyrd', 'Prof'=>'Fate', 'Prof_Description'=>'Fate is the concept that events can be be pre-destined. That certain things happen because it is "their time". For some fate is a self-evident fact, for others it is nothing but conincidence.', 'ProfInAnnex'=>7),

				)
			)
			),
			 'Hitches'=>array(
					array('Facet'=>'Key', 'HitchType'=>3, 'Name'=>'Restricted (Continuity)','Description'=>'A Restricted Continuity is like a temporal jurisdiction. When applied to the Spirit of an Age, the continuity of course refers to the age itself, be it the "Summer of Love" or an actual Era. Time travellers and the like will find it harder to access any beneifts of the zeitgeist if they are temporally (or significantly socially) displaced. Also Continuity is also restricted by universe and therefore local history. WWII for example is only Multiversal, not Omniversal, so its Zeitgeist may become paradoxical.', 'HBoon'=>11)
			)
			
		)
	);
	public static function displayDescendants($terms){
		
		return T13Elements::getT13Elements('Descendant', $terms);
    }
	static public function displayDescendant($descendant){
	//var_dump($descendant);
	//shortcode descendanticap display...
		if ( ! function_exists( 'wp_get_recent_posts' ) ) {
			//if posts exists doesn't load it.
				 require_once( ABSPATH . 'wp-includes/post.php' );
		}
		$dsr=T13Elements::getT13Element('Descendant',$descendant);
		$rethtml = $dsr['HTML-header']; 
		$descendantObj = $dsr['Element'];
		$facet=$dsr['Facet'];
		$displayFacet="";
		$DescTyper = $dsr['Terms']['Element']; 
		if ($facet!='%'){
	    	$displayFacet=T13Facets::writeFacet($facet,'jscript');
	    }
		if (!is_wp_error($descendantObj)){
			if (is_array($DescTyper)){
					$descT=$DescTyper[0]->name;
				}
			$rethtml='<div class="t13ne-descendant"><strong class="t13ne-descendanttitle">'.$descT.': </strong><details><summary>';
			$rethtml.=' <span class="t13ne-title"> <q>'.$descendantObj->post_title.'</q> </span>';
			$rethtml.="<p class=\"t13ne-incarna-facet\"><strong>Descendant Incarna</strong>{$displayFacet}</p>";
			$rethtml.='</summary>';
	
			$content=$descendantObj->post_content;
			$rethtml.='<div class="t13ne-postdata">'.$content.'</div>'.$dsr['Date'].'</div>';
			
			return $rethtml.$dsr['HTML-footer'];
		}else{
			return json_encode($descendantObj);
		}
    }
    static public function descendantContent($name, $data, $dat, $publish){
    	$ret=array();
    	//$typeSC="[t13ne type=\"select\" select=\"desctypes\" selected=\"{$data['DescendantType']}\"/]";
    	if (isset($data['DescendantType'])){
    		$type= T13Types::$descendantTypes['Raw'][$data['DescendantType']];
    		$typeText="[t13ne type=\"select\" select=\"desctypes\" selected=\"{$data['DescendantType']}\"/]";
    	}else{
    		$type= T13Types::$descendantTypes['Raw'][0];
    		$typeText="[t13ne type=\"select\" select=\"desctypes\" selected=\"0\"/]";
    	}
		if (isset($data['IncarnaFacet'])){
			$incarnaText= "[t13ne type=\"select\" select=\"facetdescendants\" selected=\"{$data['IncarnaFacet']}\" /]";
		}
		$locationText='';
		if (isset($data['LocationFacet'])){
			if ($data['LocationFacet']!='n/a'){
				$locationText= "[t13ne type=\"select\" select=\"facetlocation\" selected=\"{$data['LocationFacet']}\" /]";
			}
		}		
		$baseCost=$type['Cost'];
		$annextext='<h3>Annexes</h3><ul class="t13ne-annexlist">';
		foreach($data['Annexes'] as $annex){
			if ($annex==$data['Annexes'][0]){$masterAnnex=true;}else{$masterAnnex=false;}
			$atyp=T13Annexes::$annexType[$annex['Annex_Type']];
			//return array('ID'=>$post_id,'Cost'=>$baseCost, 'Orig_ID'=>$nuid, 'Prof'=>$prof_id);
			if ($annex['Name']=='Pact'){
				$pactargs='annex="pact" boon="'.$annex['ABoon'].'" pactargs="'.json_encode(array('Pact'=>'nuid','num_members'=>$annex['Members'],'max_character'=>$annex['MaxChar'])).'"';
				$baseCost=16;
			}else{
				$pactargs='';
			}
			if ($annex['Name']=="Size"||isset($annex['Size'])){
				//locations have a Size array -it doesn't get logged the same way as other Annexes
				if (!isset($annex['ABoon'])){
					$annex['ABoon']=$annex['Size'];
				}else{
					if (!is_numeric($annex['ABoon'])){
						$annex['ABoon']=$annex['Size'];
					}
				}
				$pactargs="annex=\"Size\" size=\"{$annex['Size']}\" boon=\"{$annex['ABoon']}\" ";
				$baseCost=12;
			}else{
				$pactargs='';
			}
			if ($pactargs==''){
				//$name,$coreA['Type'],$coreA['Profs'], $coreA['Description'], $coreA['Boon'], $coreA['Statblock'], $f_id, $g_id, $e_id, $s_id, true, 0,0
				$annexterms=$dat['Terms'];
				if (!isset($annex['Description'])){
					$annex['Description']=$data['Description'].="<small class=\"t13ne-disclaimer\">Annex automatically added as part of adding <a href=\"{$dat['URL']}\">Descendant: {$name}</a>. </small>";
				}
				$annex['Description'].="<small class=\"t13ne-disclaimer\">Annex automatically added as part of adding <a href=\"{$dat['URL']}\">Descendant: {$name}</a>. </small>";
				foreach($annex['Profs'] as $prof){
					if ($prof['ProfInAnnex']<2){
						if (is_array($annexterms['Facet'])){
							$annexterms['Facet'][]=$prof['Facet'];
						}else{
							$annexterms['Facet']=array($annexterms['Facet'],$prof['Facet']);
						}
					}
				}
				//$countProfs=count($annex['Profs']);
				$temp=T13Elements::addT13Element('Annex',$annex['Name'],$annex,$annexterms, $publish);
				//$annex['id']=T13Annexes::addAnnex( $annex['Name'],$annex['Type'],$annex['Profs'], $annex['Description'].'<p class="t13ne-disclaimer">Annex automatically added as part of adding <a href="'.esc_url(get_permalink($post_id)).'">Descendant: '.$name.'</a></p>', $annex['ABoon'], $annex['Statblock'], $f_id, $g_id, $e_id, $s_id, $publish, $nuid, $creator, $nuid);
				$pactargs=" annex=\"{$temp['post_id']}\"  boon=\"{$annex['ABoon']}\" ";
				}	
				$annextext.='<li class="t13ne-annex">[t13ne type="annex" '.$pactargs.' /]</li>';
				//adjust cost for subannexes
				if ($masterAnnex){
					$baseCost+=$temp['BaseCost'];
					$minCost=$temp['MinCost'];
				}else{
					$baseCost+=T13Boons::getBoonReduced($annex['BaseCost']);
				}
			}
			
			$annextext.='</ul>';
			$hitchtext='<h3>Hitches</h3><ul class="t13ne-hitchlist">';
			foreach($data['Hitches'] as $hitch){ //$name,$description,$type,$facet,$genres,$eras, $scope, $publish=false
				$hterms=$dat['Terms'];
				$hterms['Parent']=$dat['post_id'];
				
				$nuid=0;
				if (isset($hterms['Owner_id'])){
					$nuid=$hterms['Owner_id'];
				}else{
					$nuid=$dat['post_id'];
				}

				$hterms['Facet']=$hitch['Facet'];
				$hitch['Description'].="<small class=\"t13ne-disclaimer\">Hitch automatically added as part of Descendant: <a href=\"{$dat['URL']}\">{$name}</a>. <br/></small>";
				$hitch['Hitch']=T13Elements::addT13Element('Hitch',$hitch['Name'], $hitch, $hterms, $publish);
				
				$hitchtext.="<li class=\"t13ne-hitch\" data-hitch=\"{$hitch['Hitch']['post_id']}\" data-hboon=\"{$hitch['HBoon']}\" >[t13ne type=\"hitch\" hitch=\"{$hitch['Hitch']['post_id']}\" hboon=\"{$hitch['HBoon']}\" char=\"{$nuid}\" boon='%%' resolved=\"0\" /]</li>";
				$baseCost-=$hitch['HBoon'];
			}// $handBoo=10, $boon=13, $alt=0
			$hitchtext.='</ul>';
			
			if (isset ($alt)&&$alt!=0){$altText='<div class="t13ne-alt-reference" data-alt="'.$alt.'"></div>';}else{$altText='<div class="t13ne-alt-reference" data-alt="'.$post_id.'"></div>';}
			if ($creator!=0){$creatorText='<div class="t13ne-creator-reference" data-creator="'.$creator.'"></div>';}else{$creatorText='';}
			$costText='';
			$costArr=array('Commonality','State','Age');
			
			$costsArr=array(T13Boons::getBoonReduced($baseCost),2*T13Boons::getBoonReduced($baseCost),$baseCost,2*$baseCost, 3*$baseCost, T13Boons::getBoonValue($baseCost));
			foreach($costsArr as &$cost){
				if ($cost<$minCost){$cost=$minCost;}
			}
			
			$costText='<div class="t13ne-tablewrap"><table class="t13ne-cost-table"><caption class="t13ne-table-label">Descendant Cost Modifiers</caption><thead><tr><th>'.$costArr[0].'</th><th>'.$costArr[1].'</th><th>'.$costArr[2].'</th><th>Chi Cost</th></tr></thead><tbody>';
			for($i=0;$i<=5;$i++){
				$costText.='<tr>';
				foreach($costArr as $arr){
					$descTArr=T13Types::$descendantTypes[$arr][$i];
					$costText.="<td><details><summary>{$descTArr['Type']}</summary><p class=\"t13ne-description\">{$descTArr['Description']}</p><p class=\"t13ne-cost\">{$descTArr['Cost_Modifier']}</p></details></td>";
				}

				$costText.='<td>'.$costsArr[$i].'</td>';
			}
			$costText.='</tbody></table></div>';
			$content=$dat['Terms']['Geo']['GeoText'].T13Sanitize::sanitize($data['Description']).$typeText.$incarnaText.$locationText.$annextext.$hitchtext.$costText.$altText.$creatorText;
			$profData=array('Facet'=>$data['IncarnaFacet'],'Prof_Description'=>$data['Description']."<small class=\"t13ne-disclaimer\">Proficiency automatically added as part of Descendant: <a href=\"{$data['URL']}\"> {$name}</a>. <br/></small>");
			$profTerms=$dat['Terms'];
			$profTerms['Facet']=$data['IncarnaFacet'];
			$prof_id = T13Elements::addT13Element('Proficiency', $name, $profData, $profTerms, $publish);
			return array('Content'=>$content, 'Base_Cost'=>$baseCost, 'Prof'=>$prof_id);
    }
	/* static public function addDescendant($name,$incarna,$locationType, $descType,$description,$annexes,$hitches,$facets,$genres,$eras, $scopes, $publish=false, $alt=0,$creator=0, $parent=0){
    	$typer='Desc';
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
		$descendant="<div class=\"t13ne-descendant\">";
		
		$name=T13Sanitize::sanitize($name);
		if ($name==''){$name='Error Unnamed Descendant';}
		$geo=T13Geometry::writeGeometry($name, false);
		$post_id=post_exists( $name );
		if ($post_id){
			$typeo=T13Types::checkTaxon($typer, 't13type', $post_id);
			if (strtolower($typeo)){
				$suffix=' '.$typer;
				$post_id=post_exists($name.$suffix);
			}
		}
		if (!$post_id){
			if (is_string($incarna)){

				$incarnaterm=term_exists(T13Facets::getFacetNameFor($incarna),'t13facet');
				$f_id[]=intval($incarnaterm['term_id']);
			}
			if (is_string($locationType)){
				$fl=T13Facets::getFacetNameFor($locationType);
				if (is_string($fl)){
					$locaterm=term_exists($fl);
					$f_id[]=intval($locaterm);
				}
			}
			if (is_string($facets)){
				$faceterm = term_exists( $facets, 't13facet');
				$f_id[]= intval($faceterm['term_id']);
			}else{
				$f_id=$f_id+$facets;
			}
			if (is_string($genres)){
				$gterm = term_exists( $genres, 't13genre');
				$g_id= intval($gterm['term_id']);
			}else{
				$g_id=$genres;
			}
			if (is_string($eras)){
				$eterm = term_exists( $eras, 't13era');
				$e_id= intval($eterm['term_id']);
			}else{
				$e_id=$eras;
			}
			if (is_string($scopes)){
				$sterm = term_exists( $scopes, 't13scope');
				$s_id= intval($sterm['term_id']);
			}else{
				$s_id=$scopes;
			}
			$post_parent=0;
			if ($parent){
				if (get_post_status($parent)){
					$post_parent=$parent;
				}
			}
			$geo_id=T13Geometry::getGeoTerms($name);
			$placeholder = "place holder content for ".$name;
			$post_id = wp_insert_post( array (
				    'post_type' => 'element',
				    'post_title' => $name.$suffix,
				    'post_content' => $placeholder,
				    'post_parent'=>$post_parent,
				    'post_status' =>'draft',
				    'comment_status' => 'closed'   // if you prefer
				    //'ping_status' => 'closed',    // if you prefer
				),true);
			$nuid=$post_id;
			$term_taxonomy_ids = wp_set_object_terms($post_id, $f_id,'t13facet', true);			
			$term_taxonomy_ids = wp_set_object_terms($post_id, $g_id,'t13genre', true);			
			$term_taxonomy_ids = wp_set_object_terms($post_id, $e_id, 't13era', true);	
			$term_taxonomy_ids = wp_set_object_terms($post_id, $s_id, 't13scope', true);
			$term_taxonomy_ids = wp_set_object_terms($post_id, $geo_id, 't13geo', true);
			$typeSC="[t13ne type=\"select\" select=\"desctypes\" selected=\"{$descType}\"/]";
			$type= T13Types::$descendantTypes['Raw'][$descType];
			$incarnaText= "[t13ne type=\"select\" select=\"facetdescendants\" selected=\"{$incarna}\" /]";
			if ($locationType!='n/a'){
				$locationText= "[t13ne type=\"select\" select=\"facetlocation\" selected=\"{$locationType}\" /]";
			}else{
				$locationText='';
			}
			$typeText="[t13ne type=\"select\" select=\"desctypes\" selected=\"{$descType}\"/]";
			$baseCost=$type['Cost'];
			$minCost=$baseCost;
			$annextext='<h3>Annexes</h3><ul class="t13ne-annexlist">';
			foreach($annexes as $annex){
				if ($annex==$annexes[0]){$masterAnnex=true;}else{$masterAnnex=false;}
				$atyp=T13Annexes::$annexType[$atype];
				//return array('ID'=>$post_id,'Cost'=>$baseCost, 'Orig_ID'=>$nuid, 'Prof'=>$prof_id);
				if ($annex['Name']=='Pact'){
					$pactargs='annex="pact" boon="'.$annex['ABoon'].'" pactargs="'.json_encode(array('Pact'=>$nuid,'num_members'=>$annex['Members'],'max_character'=>$annex['Max_Char'])).'"';
					$annex['Cost']=16+$annex['Members']['Yarn']+$annex['Max_Char']['Yarn'];
				}else{
					$pactargs='';
				}
				if ($annex['Name']=="Size"){
					//locations have a Size array -it doesn't get logged the same way as other Annexes
					$pactargs="annex=\"Size\" boon=\"{$annex['ABoon']}\"";
					$annex['Cost']=12+$annex['ABoon'];
				}else{
					$pactargs='';
				}
				if ($pactargs==''){
					//$name,$coreA['Type'],$coreA['Profs'], $coreA['Description'], $coreA['Boon'], $coreA['Statblock'], $f_id, $g_id, $e_id, $s_id, true, 0,0
					$annex['id']=T13Annexes::addAnnex( $annex['Name'],$annex['Type'],$annex['Profs'], $annex['Description'].'<p class="t13ne-disclaimer">Annex automatically added as part of adding <a href="'.esc_url(get_permalink($post_id)).'">Descendant: '.$name.'</a></p>', $annex['ABoon'], $annex['Statblock'], $f_id, $g_id, $e_id, $s_id, $publish, $nuid, $creator, $nuid);
					$pactargs=' annex="'.$annex['id']['ID'].'"  boon="'.$annex['ABoon'].'" ';
				}	
				$annextext.='<li class="t13ne-annex">[t13ne type="annex" '.$pactargs.' /]</li>';
				//adjust cost for subannexes
				if ($masterAnnex){
					$baseCost+=$annex['id']['Cost'];
				}else{
					$baseCost+=T13Boons::getBoonReduced($annex['id']['Cost']);
				}
			}
			$costArr=array('Commonality','State','Age');
			$costsArr=array(T13Boons::getBoonReduced($baseCost),2*T13Boons::getBoonReduced($baseCost),$baseCost,2*$baseCost, 3*$baseCost, T13Boons::getBoonValue($baseCost));
			foreach($costsArr as &$cost){
				if ($cost<$minCost){$cost=$minCost;}
			}
			$costText='';
			$costText='<table class="t13ne-cost-table"><thead><tr><th>'.$costArr[0].'</th><th>'.$costArr[1].'</th><th>'.$costArr[2].'</th><th>Chi Cost</th></tr></thead><tbody>';
			for($i=0;$i<=5;$i++){
				$costText.='<tr>';
				foreach($costArr as $arr){
					$descTArr=T13Types::$descendantTypes[$arr][$i];
					$costText.="<td><details><summary>{$descTArr['Type']}</summary><p class=\"t13ne-description\">{$descTArr['Description']}</p><p class=\"t13ne-cost\">{$descTArr['Cost_Modifier']}</p></details></td>";
				}

				$costText.='<td>'.$costsArr[$i].'</td>';
			}
			$costText.='</tbody></table>';
			$annextext.='</ul>';
			$hitchtext='<h3>Hitches</h3><ul class="t13ne-hitchlist">';
			foreach($hitches as $hitch){ //$name,$description,$type,$facet,$genres,$eras, $scope, $publish=false
				$hitch['id']=T13Hitches::addHitch( $hitch['Name'], $hitch['Description'].'<p class="t13ne-disclaimer">Hitch automatically added as part of adding  <a href="'.esc_url(get_permalink($post_id)).'">Descendant: '.$name.'</a></p>', $hitch['Type'], $hitch['Facet'], $g_id, $e_id, $s_id, $publish, $post_id,$creator, $nuid);
				$hitchtext.='<li class="t13ne-hitch" data-hitch="'.$hitch['id']['post-id'].'" data-hboon="'.$hitch['HBoon'].'" >[t13ne type="hitch" hitch="'.$hitch['id']['post-id'].'" hboon="'.$hitch['HBoon'].'" alt="{$nuid}" resolved="0" /]</li>';
				$baseCost-=$hitch['HBoon'];
			}// $handBoo=10, $boon=13, $alt=0
			$hitchtext.='</ul>';
			
			if ($alt!=0){$altText='<div class="t13ne-alt-reference" data-alt="'.$alt.'"></div>';}else{$altText='<div class="t13ne-alt-reference" data-alt="'.$post_id.'"></div>';}
			if ($creator!=0){$creatorText='<div class="t13ne-creator-reference" data-creator="'.$creator.'"></div>';}else{$creatorText='';}
			$content=$geo['GeoText'].T13Sanitize::sanitize($description).$typeText.$incarnaText.$locationText.$annextext.$hitchtext.$costText.$altText.$creatorText;
			$post_id = wp_update_post( array (
				'ID'=>$nuid,
				'post_type' => 'element',
				'post_title' => $name.$suffix,
				'post_content' => $content,
				'post_status' => $publish,
				'comment_status' => 'open',
				'ping_status'=>'open'),true );

		}
		return array('ID'=>$post_id,'Costs'=>$costsArr, 'Content'=>$content);
    }*/
    static public function installDescendants(){
    	if ( ! function_exists( 'post_exists' ) ) {
    		//if posts exists doesn't load it.
   			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		
		$c=count(self::$coreDescs);
		$installed=array('desc'=>0, 'of'=>$c, 'install'=>0, 'debug'=>'Begun: \n\r');
    	foreach(self::$coreDescs as $core){
			if (isset($core['Specify'])){
				$name= $core['Name'].' (Specify)';
			}else{
				$name=$core['Name'];
			}
			$name=T13Sanitize::sanitize($name);	
			if ($name==''){$name='Error Unnamed Descendant';}
			$installed['exist']=post_exists($name);
    		if ($installed['exist']){
    			$installed['desc']=$name;
    			$installed['debug'].=' '.$installed['exist'].' post exists already \n\r';
    			$installed['install']++;    			
    		}else{
    			$installed['desc']=$name;
    			$installed['debug'].=json_encode(self::installDesc($installed['install'])).'  \n\r';
    			$installed['install']++;
    			return $installed;
    		}
    	}
    	return $installed;
    }
	static public function installDesc($install){
		if (count(self::$coreDescs)>$install){

			$coreD=self::$coreDescs[$install];
			if (isset($coreD['Specify'])){
				$name= $coreD['Name'].' (Specify)';
			}else{
				$name=$coreD['Name'];
			}
			$terms=array('Facet'=>array($coreD['IncarnaFacet'], $coreD['Annexes']['Profs'][0]['Facet'],$coreD['Annexes']['Profs'][1]['Facet']), 'Genre'=>'T13 Core', 'Scope'=>'Omniversal', 'Era'=>'Timeless');
			$post_id = T13Elements::addT13Element('Descendant', $name, $coreD, $terms, true);				
		}	
		return $post_id;	
	}
}
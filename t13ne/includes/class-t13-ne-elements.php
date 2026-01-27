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
 * Fired during plugin activation. T13 Elements
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Elements{

	private static $valids = array(
		'Thread'=>'TEXT',
		'Bane'=>'NUMBER',
		'Name'=>['TEXT','TEXT','TEXT'],
		'Description'=>'TEXT',
		'Genre'=>'GENRE',
		'Era'=>'ERA',
		'Scope'=>'SCOPE',
		'Facet'=>'FACET',

		'Prof'=>['Name']
	);
	static public function validateElement($data){
		if (!is_array($data)){T13Types::arrayify($data);}
		if (!isset($data['Type'])){
			//Type has not been set so this could be any type.
			error_log("Data for T13Element has no type");
			return false;
		}
		switch($data['Type']){
			case "Prof":
			case "Proficiency":
				if (self::validateProf($data)){
					//valid Prof

				}
			break;
		}
	}
	static public function validateProf($data){
		//Proficiency requires: Names, Description, Facet(s)
		return is_array($data)&&self::validateNames(self::namesFromNames($data['Name']))&&self::validateDescription($data['Description']);
	}
	static public function validateNames($name){
		return is_array($name)&&(isset($name[0])&&is_string($name[0])&&count($name[0])>0)&&(isset($name[1])&&is_string($name[1])&&count($name[1])>0)&&(isset($name[2])&&is_string($name[2])&&count($name[2])>0);
	}
	static public function validateDescription($desc){
		return (is_string($desc)&&(strlen($desc)>0));

	}
	static public function namesFromNames($names){
		if (!is_array($names)){T13Types::arrayify($names);}
		$c=count($names);
		//var_dump($names);
		switch ($c) {
			case 0:
				$names=['Unknown', 'No Name Specified','Someone forgot to give this a name, unknown elemental'];
				break;
			case 1:
				$name = T13Sanitize::sanitize($names[0]);
				$names=[$name,$name,$name];
				break;
			case 2:
				$names = [T13Sanitize::sanitize($names[0]),T13Sanitize::sanitize($names[1])];
				$names=[$names[0],$names[1],$names[0].', '.$names[1]];
			default:

				$names=[T13Sanitize::sanitize($names[0]),T13Sanitize::sanitize($names[1]),T13Sanitize::sanitize($names[2])];
				break;
		}
		return $names;
	}
	static public function titleFromNames($names, $specify=false){
		if (is_string($names)){
			if ($names==""){return false;}
			$names = T13Types::arrayify($names);

		}
		$names=self::namesFromNames($names);
		//var_dump($names);
		for ($i=0;$i<3;$i++){
			if ($specify){
				if (!T13Types::contains($names[$i]," (Specify)")){
					$names[$i].=" (Specify)";
				}

			}else{
				if (T13Types::contains($names[$i]," (Specify)")){
					str_ireplace(' (Specify)', '', $names[$i]);
				}
			}

		}
		$title = implode('~-~', $names);
		//error_log("titleFromNames:: created `{$title}`");
		return $title;
	}
	static public function namesFromTitle($title){
		if (is_string($title)){
			 return explode('~-~', $title);
		}
		if (is_array($title)){
			return $title;
		}
	}
	static public function T13ElementExists($name, $specify=false){
		global $wpdb;

		if (is_array($name)){
			$title = self::titleFromNames($name,$specify);
		}else{
			$title = $name ;
			$name= self::namesFromTitle($title);
		}
		$checkpost =intval($wpdb->get_var("SELECT count(post_title) FROM $wpdb->posts WHERE post_title LIKE '%$title%'"));
		$semipost =intval($wpdb->get_var("SELECT count(post_title) FROM $wpdb->posts WHERE post_title LIKE '%$name[0]%'"));
		if ($checkpost==0&&$semipost==0){
			//error_log("T13ElementExists:: nothing like {$title} found {$checkpost} / {$semipost}");
			return false;
		}else{
			$cpost = post_exists($title);
			//error_log("T13ElementExists:: something like {$title} found post count = {$checkpost} / {$semipost} cpost ={$cpost} ");

			return $cpost;
		}
	}

	static public function getElementTerms($elementObj){
		$terms['Facet'] = wp_get_post_terms($elementObj->ID, 't13facet');
		$terms['Genre'] = wp_get_post_terms($elementObj->ID, 't13genre');
		$terms['Era']=wp_get_post_terms($elementObj->ID, 't13era');
		$terms['Geo'] = wp_get_post_terms($elementObj->ID, 't13geo');
		$terms['Scope'] = wp_get_post_terms($elementObj->ID, 't13scope');
		$terms['Category']= wp_get_post_terms($elementObj->ID, 'category');
	}
	static public function AlternateName($eltype, $names){
		if (is_string($names)){
			error_log('AlternateName:: '.$names);
			$names = explode('~-~', $names);
		}
		if (is_array($names)){
			for ($i=0;$i<3;$i++){
				if (is_string($names[$i])){
					$names[$i]=T13Sanitize::sanitize($names[$i]);
					//error_log('AlternateName:: entry #'.$i.' '.$names[$i]);
					if (is_string($eltype)){
						if (!T13Types::contains($names[$i]," {$eltype}")){
							$names[$i].=" {$eltype}";
						}else{
							if (T13Types::contains($names[$i]," {$eltype}")){
								str_ireplace(' {$eltype}', '', $names[$i]);
							}
						}
					}elseif(is_array($eltype)){
						if (!T13Types::contains($names[$i],$eltype)){
							$names[$i].=" ".implode(', ',$eltype);
						}else{
							foreach($eltype as $el=>$type){
								str_ireplace($type, '', $names[$i]);
							}

						}
					}
				}else{
					error_log('AlternateName:: problem with # '.$i);
				}
			}
		}
		$title = implode('~-~', $names);
		//error_log("Alternate Name:: returns `{$title}`");
		return $title;
	}
static public function findByContent($content){
	global $wpdb;
	$checkpost =intval($wpdb->get_var("SELECT post_id FROM $wpdb->posts WHERE post_content like '%$content%'"));
	//error_log("findByContent:: {$checkpost}");
	return $checkpost;
}

	static public function findBestFit($eltype, $findthis, $originalName){

	}
	static public function prepareElement($eltype, $name, $terms, $spec=false, $forceinstall=0){
		if ( ! function_exists( 'post_exists' ) ) {
			//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}

		$name=self::titleFromNames($name, $spec);
		$terms=T13Types::typeTerms($eltype,$name,$terms);
		$random_suffixes=array('Copy','Clone', 'Duplicate', 'Double', '2', 'Two', 'Another', 'B', 'Second', 'Again', 'Mark', 'II', 'Doppelganger', 'Deux','Part 2','Redux','Sequel', 'Do-over','Replicant','Doubled','Cloned','Duplicated','Copy','Copied','Renamed','Revenge','& the Temple of Doom', '+', '+1', 'Return', 'Repeat', 'Ditto', '"', '!', '*','Twin', 'Duplex', 'Replica', 'Duplication','Photocopy','Replication','Photostat','Xerox','Analogue','Carbon','Companion','Copycat','Counterfeit','Counterpart','Dupe','Facsimile','Fake','Imitation','Knockoff','Likeness','Match','Parallel','Phony','Pirate','Recurrence','Repetition','Ringer','Second','Similarity','The','Replicated','Ersatz','Mockery','Dark','Jinx','Edit','Amended','.','x');
		$suffix='';
		$post_id=post_exists( $name );
		if ($post_id&&!$forceinstall){
			//this post name exists already.
			if (isset($terms['t13postid'])==$post_id){
				//there's a reason for that, this must be an edit...
				$post_id = wp_insert_post( array (
					'post_id'=>$terms['t13postid'],
					'post_type' => 'element',
					'post_title' => $name,
					'post_content' => 'Placeholder Content for '.$eltype.':'.$name.$suffix.json_encode($terms),
					'post_status' => 'draft',
					'post_parent'=>$terms['Parent_id'],
					'comment_status' => 'closed'   // if you prefer
					//'ping_status' => 'closed',    // if you prefer
				),true);
				T13Types::setTaxonomy($post_id,$terms);
				return array('post_id'=>$post_id, 'URL'=>esc_url(get_permalink($post_id)), 'Terms'=>$terms);
			}
			$terms['t13error']=array('Text'=>'An Element of this name already existed','Original_Post_ID'=>$post_id);
			error_log("prepareElement:: An Element of this name already exists postid = {$post_id}");
			$typeo=T13Types::checkTaxon($eltype, 't13type', $post_id);
			if ($typeo['Term']!=$eltype){
				$name = self::AlternateName($typeo['Term'], $name);
				$post_id = post_exists($name);
			}
			while ($post_id>0){
					// still exists!
					$rn=T13Dice::RNG(0,count($random_suffixes));
					$suffix.=" ".$random_suffixes[$rn];
					$terms['t13error']['Text'].="... attempted resolution by adding suffix '{$suffix}' to name ";
					$post_id=post_exists($name.$suffix);

				}
		}
		if (!$post_id||$forceinstall){

			//if (!isset($terms['Parent_id'])){$terms['Parent_id']=0;}
			$post_id = wp_insert_post( array (
				'post_type' => 'element',
				'post_title' => $name.$suffix,
				'post_content' => 'Placeholder Content for '.$eltype.':'.$name.$suffix.json_encode($terms),
				'post_status' => 'draft',
				'post_parent'=>$terms['Parent_id'],
				'comment_status' => 'closed'   // if you prefer
				//'ping_status' => 'closed',    // if you prefer
			),true);
			T13Types::setTaxonomy($post_id,$terms);
			return array('post_id'=>$post_id, 'URL'=>esc_url(get_permalink($post_id)), 'Terms'=>$terms);
		}else{
			return 0;
		}
	}
	static public function addT13Element($eltype,$names,$data,$terms=array('Parent'=>0, 't13postid'=>"new", 'Facet'=>'All Facets', 'Era'=>'Timeless', 'Scope'=>'Developmental', 'Genre'=>'T13 Core', 'Data'=>'', 'Debug-addElement'=>'<!--adding element without term data //-->'), $publish=true, $forceinstall=0 ){
		//data is unsanitized.
		if (!$eltype){return false;}
		$content="";
		if ($names==''){
			$names=array();
			if(isset($data['Name'])){
				$names[0]=$data['Name'];
			}elseif(isset($terms['Geo']['Name'])){
				$names[0]=$terms['Geo']['Name'];}
			else{$names[0]='Unnamed';}
			if (isset($data['FullName'])){
				$names[1]=$data['FullName'];
			}elseif (isset($data['t13fullname'])){
				$names[1]=$data['t13fullname'];
			}else{
				$names[1]='Unknown '.$eltype;
			}
			if (isset($data['Alt_Name'])){
				$names[2]=$data['Alt_Name'];
			}elseif (isset($data['AKA'])){
				$names[2]=$data['AKA'];
			}elseif (isset($data['t13aka'])){
				$names[2]=$data['t13aka'];
			}else{
				$names[2]='Dunno, what-cha-ma-call-it, ';
			}

		}
		$name=self::titleFromNames($names,$data['Specify']);

		$ret=array();

		if (isset($data['Facet'])){
			$terms=T13Types::updateTerms($terms,'Facet', $data['Facet']);
		}else{
			$terms=T13Types::updateTerms($terms,'Facet', 'All Facets');
		}
		if (isset($data['Owner'])){
			$terms=T13Types::updateTerms($terms,'Owner', $data['Owner']);
		}

		$terms=T13Types::typeTerms($eltype,$name,$terms);
		if (!isset($terms['Parent_id'])){$terms['Parent_id']=0;}
		if ($eltype=="Proficiency"||$eltype=="prof"||$eltype=="Thread"||$eltype=="threads"){
			if (isset($terms['Data'])){
				$terms['Data']=[];
			}
		}
		$specify = isset($data['Specify'])?$data['Specify']:true;
		$nuElement=self::prepareElement($eltype, $name, $terms, $specify, $forceinstall);

		if ($nuElement && !is_wp_error($nuElement['post_id'])){
			$terms=$nuElement['Terms'];
			switch ($eltype){
				case "Loom":
				case "Tapestry":
					$eltype=array('Tapestry');
					//$loomContent=T13Tapestries::loomContent($name, $data, $nuElement, $publish);
					//$content=$loomContent['Content'];
					//$terms=$loomContent['Terms'];
					//$ret['BaseCost'] = $loomContent['Base_Cost'];
					//$ret['MinCost']=$loomContent['Min_Cost'];
				break;
				case "Game":
					$eltype=array('Tapestry','Game');
					//$gameContent=T13Tapestries::gameContent($name, $data, $nuElement, $publish);
					//$content=$gameContent['Content'];
					//$terms=$gameContent['Terms'];
					//$ret['BaseCost'] = $gameContent['Base_Cost'];
					//$ret['MinCost']=$gameContent['Min_Cost'];
				break;
				case "Narrative":
					$eltype=array('Tapestry','Narrative');
					//$narrativeContent=T13Tapestries::narrativeContent($name, $data, $nuElement, $publish);
					//$content=$narrativeContent['Content'];
					//$terms=$narrativeContent['Terms'];
					//$ret['BaseCost'] = $narrativeContent['Base_Cost'];
					//$ret['MinCost']=$narrativeContent['Min_Cost'];
				break;
				case 'Plot':
				case 'Story':
				case 'Episode':
				case 'Chapter':
				case 'Arc':
				case 'Volume':
				case 'Epic':
				case 'Cycle':
				case 'Tale':
					$eltype=array('Weaver','Plot');
					$plotContent=T13Plots::plotContent($name, $data, $nuElement, $publish);
					$content=$plotContent['Content'];
					$terms=$plotContent['Terms'];
					$ret['BaseCost'] = $plotContent['Base_Cost'];
					$ret['MinCost']=$plotContent['Min_Cost'];
				break;
				case 'Annex':
				case 'Annexes':
					$eltype=array('Knot','Annex');
					$annexContent=T13Annexes::annexContent($name,$data, $nuElement,$publish);
					$content=$annexContent['Content'];
					$terms=$annexContent['Terms'];
					$ret['BaseCost']=$annexContent['Base_Cost'];
					$ret['Prof']=$annexContent['Prof'];
					$ret['MinCost']=$annexContent['Min_Cost'];
					$ret['Boon']=$annexContent['Boon'];
					$ret['Value']=$annexContent['Value'];
					$ret['Hitches']=$annexContent['Hitches'];
					$ret['RedHitches']=$annexContent['RedHitches'];
					$ret['Woes']=$annexContent['Woes'];
				break;
				case 'Hitch':
				case 'Hitches':
				case 'handicap':
					$eltype=array('Knot','Hitch');
					$hitchContent=T13Hitches::hitchContent($name, $data, $nuElement,$publish);
					$content=$hitchContent['Content'];
					$terms=$hitchContent['Terms'];

				break;
				case 'Descendant':
				case 'Location':
				case 'Pact':
					$eltype=array('Pattern','Descendant');
					$descendantContent= T13Descendants::descendantContent($name, $data, $nuElement, $publish);
					$content.=$descendantContent['Content'];
					$ret['BaseCost']=$descendantContent['Base_Cost'];
					$ret['MinCost']=$descendantContent['Min_Cost'];
				break;
				case 'Character':
				case 'Full':
					$eltype=array('Weaver','Character','Full');
					$charContent=T13Chars::charContent($name, $data, $nuElement, $publish);
					$content.=$charContent['Content'];
					$ret['BaseCost'] = $charContent['Base_Cost'];
					$ret['MinCost']=$charContent['Min_Cost'];
				break;
				case 'Detailed':
					$eltype=array('Weaver','Character','Detailed');
					$charContent=T13Chars::charContent($name, $data, $nuElement, $publish);
					$content.=$charContent['Content'];
					$ret['BaseCost'] = $charContent['Base_Cost'];
					$ret['MinCost']=$charContent['Min_Cost'];
				break;
				case 'Archetype':
					$eltype=array('Weaver','Character','Archetype');
					//$charContent=T13Chars::archetypeContent($name, $data, $nuElement, $publish);
					//$content.=$charContent['Content'];
					//$ret['BaseCost'] = $charContent['Base_Cost'];
					//$ret['MinCost']=$charContent['Min_Cost'];
					break;
				case 'Lite':
				$eltype=array('Weaver','Character','Lite');
					$liteContent=T13Chars::liteContent($name, $data, $nuElement, $publish);
					$content.=$liteContent['Content'];
					$ret['BaseCost'] = $liteContent['Base_Cost'];
					$ret['MinCost']=$liteContent['Min_Cost'];
					break;
				case 'Vex':
				case 'Chorus':
				case 'Cast':
				case 'Force of Nature':
				case 'Extra':
					$eltype=array('Pattern','Character','Extra');
					$extraContent=T13Chars::extraContent($name,$data, $nuElement,$publish);
					$content.=$extraContent['Content'];
					$ret['BaseCost'] = $extraContent['Base_Cost'];
					$ret['MinCost']=$extraContent['Min_Cost'];
				break;
				case 'Proficiency':
				case 'prof':
				case 'Proficiencies':
					$eltype=array('Thread','Proficiency');
					if (isset($data['Content'])){
						$content.=$data['Content'];
					}elseif(isset($data['Prof_Description'])){
						$content.=$data['Prof_Description'];
					}elseif (isset($data['Description'])){
						$content.=$data['Description'];
					}
					//proficiciencies need no data...
					$terms['Data']=[];
					$ret['BaseCost']=1;
					$ret['MinCost']=1;
					break;
				case 'Map':
					$eltype=array('Thread','Map');
					$content.=$data['Description'];
					break;
				default:
					$eltype=array('Thread','Note');
					if (isset($data['Prof_Description'])){
						$content.=$data['Prof_Description'];
					}else{
						$content.=$data['Description'];
					}

				break;
				}
			$ret['Original_id']=$nuElement['post_id'];
			$terms=T13Types::typeTerms($eltype, $name, $terms);
			//$content.="<code class=\"debug\">{$terms['debug-html']}</code>";
			$ret['post_id']=self::updateElement($nuElement['post_id'], $content, $terms, $publish);
		}


		return $ret;

	}

	 static public function updateElement($nuid, $content, $terms, $publisht=0){
		if ($publisht){
			$publisht ='publish';
		}else{
			$publisht ='draft';
		}
		//if(!isset($terms['Parent_id'])){$terms['Parent_id']=0;}
		$post_id = wp_update_post( array (
				'ID'=>$nuid,
				'post_type' => 'element',
				'post_content' => $content,
				'post_status' => $publisht,
				'post_parent'=>$terms['Parent_id'],
				'comment_status' => 'open',
				'ping_status'=>'open'),true );
		T13Types::setTaxonomy($post_id,$terms);
		return $post_id;
	}

	static public function getT13Element($taxon='', $element=0, $number=1){
		$tax_str=T13Types::correctTaxon($taxon);

		if ( ! function_exists( 'wp_get_recent_posts' ) ) {
			//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-includes/post.php' );
		}
		if (is_array($element)){
			$element = self::titleFromNames($element);
		}
		if (is_numeric($element)){
			//probably an id

			$elementObj = get_post($element);

		}
		if (is_string($element)&&$element!='#'){
			//based on the name

			$right=false;
			$taxis=explode(',', $tax_str);

			$c_tax=array();
			$names=array($element); //pop the element into an array
			foreach($taxis as $t){
				$ta=term_exists($t,'t13type');
				if (!is_wp_error($ta)){
					if (is_object($ta)){
						$c_tax[]=$ta->term_id;
					}elseif (is_array($ta)){
						$c_tax[]=$ta['term_id'];
					}

				}
				if (!T13Types::contains($element,$t)){
					//add names with the taxonomy appended
					$names[]=$element.' '.trim($t);
				}else{
					//and removed
					$names[]=str_ireplace(' '.$t, '', $element);
				}


			}
			while (!$right&&count($names)){
				//find the right name
				$elementObj=get_page_by_title( array_shift($names), 'Object', 'element' );

				if (!is_object($elementObj)){
					//okay that failed so we didn't have the right name
					$args = array("post_type" => "element", "s" => self::titleFromNames($names), 'post_per_page'=>$number, 'tax_query'=>array(
				array(
					'taxonomy' => 't13type',
					'field' => 'term_id',
					'terms' => $c_tax,
					'operator'=>'IN') ));
					$query = get_posts( $args );
					foreach($query as $el){
						if (is_object($elementObj)){
							$terms['Type'] = wp_get_post_terms($elementObj->post_id, 't13type');

							foreach ($terms['Type'] as $kt => $kv) {
								//parse results find the best match since we didn't have an id. Really always pass a numerical id when you can.
								if (T13Types::contains($tax_str,$kv->name)){$right=true;break 2;}
							}
						}
					}
				}
				if (is_object($elementObj)){
					$terms['Type'] = wp_get_post_terms($elementObj->post_id, 't13type');

					foreach ($terms['Type'] as $kt => $kv) {
						if (T13Types::contains($tax_str,$kv->name)){$right=true;break 2;}
					}
				}
			}

		}
		if ($element=='#'){
			// we got nothing apart from '#' so we find the closest match for the rest from latest in the hopes it was what they were working on recently.

			$args=array('post_type'=>'element', 'post_per_page'=>$number, 'tax_query'=>array(
				array(
					'taxonomy' => 't13type',
					'field' => 'term_id',
					'terms' => $c_tax,
					'operator'=>'IN')
			));

			$elementi = wp_get_recent_posts($args, 'Object');
			if (!is_wp_error($elementi)){
				//didn't break so we probably have a load of them...
				$elementObj = $elementi[0];
				$elementObj->OtherResults=$elementi;

			}else{
				//var_dump($elementi);
			}
		}
		if (is_object($elementObj)){
			$earl=esc_url(get_permalink($elementObj));
			$terms=array();
			$terms['Data'] = wp_get_post_terms($elementObj->ID, 't13data');
			$terms['Element'] = wp_get_post_terms($elementObj->ID, 't13type');
			$terms['Facet'] = wp_get_post_terms($elementObj->ID, 't13facet');
			$terms['Genre'] = wp_get_post_terms($elementObj->ID, 't13genre');
			$terms['Era']=wp_get_post_terms($elementObj->ID, 't13era');
			$terms['Geo'] = wp_get_post_terms($elementObj->ID, 't13geo');
			$terms['Scope'] = wp_get_post_terms($elementObj->ID, 't13scope');
			$terms['Category']= wp_get_post_terms($elementObj->ID, 'category');
			$terms['Tags']= wp_get_post_terms($elementObj->ID, 'post_tag');
			$terms['Parent'] =$elementObj->post_parent;
			$facet='%'; //used to find the Facet for Proficiencies, Hitches, Descendants...
			$facets=array();
			//var_dump($elementObj);

			if (isset($terms['Facet'])){
				if (!is_wp_error($terms['Facet'])){
					if (is_object($terms['Facet'])){
						$terms['Facet']=array($terms['Facet']);
					}
					if (count($terms['Facet'])>0){
						//var_dump($terms['Facet']);
						$facetnames=array();
						foreach($terms['Facet'] as &$term){
							$facetnames[]=$term->Name;
						}
						$facets=T13Facets::getFacet($facetnames,'array');
						if (isset($facets['Yang'])){
							$facet=$facets;
						}elseif(isset($facets[0]['Yang'])){
							$facet=$facets[0];
						}elseif(isset($facets[0][0]['Yang'])){
							$facet=$facets[0][0];
						}
					}
				}
			}
			//var_dump($facets);
			if ($facet=='%'&&count($facets)){
				foreach ($facets as $f){
					$facet=$f;
					break;
				}
			}
			//$terms=self::typeTerms()
			$css='';
			if (is_array($terms['Element']) ){
				foreach($terms['Element'] as $t){
					$css.=' t13ne-type-'.$t->slug;
					unset($t);
				}
			}else{
				$css.=' t13ne-type-'.$terms['Element']->slug;
			}

			if (!count($facets)&&isset($facet['FacetName'])){
				$css.=' t13ne-'.strtolower($facet['FacetName']);
			}else{
				foreach($facets as &$fct){
					$css.=' t13ne-'.strtolower($fct['FacetName']);
					unset($fct);
				}
			}
			if (!is_string($terms['Genre'])){
				foreach ($terms['Genre'] as $g){
					$css .=' t13ne-genre-'.$g->slug;
					unset($g);
				}
			}else{
				$css .=' t13ne-genre-'.$terms['Genre']->slug;
			}
			if(!is_string($terms['Era'])){
				foreach ($terms['Era'] as $e){
					$css .=' t13ne-era-'.$e->slug;
					unset($e);
				}
			}else{ $css .=' t13ne-era-'.$terms['Era']->slug;}
			if (!is_string($terms['Geo'])){
				foreach ($terms['Geo'] as $go){
					$css .=' t13ne-geo-'.$go->slug;
					unset($go);
				}
			}else{
				$css .=' t13ne-geo-'.$terms['Geo']->slug;
			}

			if (!is_string($terms['Scope'])){
				foreach($terms['Scope'] as &$s){
					$css .=' t13ne-scope-'.$s->slug;
				}
			}else{
				$css .=' t13ne-scope-'.$terms['Scope']->slug;
			}
			if (!is_string($terms['Data'])){
				foreach($terms['Data'] as &$s){
					$css .=' t13ne-data-'.$s->slug;
				}
			}else{
				$css .=' t13ne-scope-'.$terms['Data']->slug;
			}
			$ret='<!-- wp:t13ne-element --><article class="t13ne-element '.$css.'"><div class="t13ne-scope-styler"><div class="t13ne-genre-styler"><div class="t13ne-era-styler"><div class="t13ne-facet-styler"><div class="t13ne-tag-styler"><div class="t13ne-cat-styler"><div class="t13ne-geometry-styler"><div class="t13ne-type-styler"><img id="T13Logo" name="T13Logo" />';
			$user=T13Types::displayUser($elementObj->post_author);
			$datestamp="<small><p class=\"t13ne-postdata\"><span class=\"t13ne-date\">Posted : {$elementObj->post_date}.</span></p><p class=\"t13ne-author\"> Created by: {$user}</p></small>";
			$statblock = T13StatBlock::getThisStatblock($elementObj->ID);
			$thresholds = T13Thresholds::getThreshold(null, $elementObj->ID);
			$elname = T13Types::arrayify($elementObj->post_title);
			$elcontent = do_shortcode($elementObj->post_content);
			return array('Name'=>$elname, 'Content'=>$elcontent, 'HTML-header'=>$ret,'HTML-footer'=>'</div></div></div></div></div></div></div></div></article>','URL'=>$earl,'Element'=>$elementObj, 'Facet'=>$facet, 'Terms'=>$terms, 'Date'=>$datestamp, 'post_id'=>$elementObj->ID, 'statblock'=>$statblock, 'CSS'=>'t13ne-element '.$css, 'Thresholds'=>$thresholds);
		}else{
			var_dump($element);
			var_dump($taxon);
			var_dump($elementObj);
		}
	}
	static public function getT13Elements($type,$terms, $arraymode='html', $number=5 , $relative='OR',$search='',$post_type='element',$sub_type=''){
		if ( ! function_exists( 'post_exists' ) ) {
			//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		$css='t13ne-element ';
		if ($sub_type!==''){$post_type=$sub_type;}
		$args = array(
			's'=> $search,
			'post_type' => $post_type,
			'post_status' => 'publish',
			'posts_per_page'=>$number,
		);


		if (isset($terms['Parent'])){

			if (is_string($terms['Parent'])){
				$args['post_parent']=post_exists($terms['Parent']);
				$css.="t13ne-parent-{$terms['Parent']} ";
			}elseif(is_numeric($terms['Parent'])){
				$args['post_parent']=$terms['Parent'];
				$css.="t13ne-parent-{$terms['Parent']} ";
			}elseif(is_array($terms['Parent'])){
				$args['post_parent__in']=$terms['Parent'];
				$css.="t13ne-parent-multiple ";
			}
		}
		if (isset($terms['Author'])){
			if (is_array($terms['Author'])){
				$args['author__in']=$terms['Author'];
				$css.='t13ne-author-multiple ';
			}else{
				$args['author']=$terms['Author'];
				$css.="t13ne-author-{$terms['Author']}";
			}
		}
		if (isset($terms['Tags'])){
			if (is_array($terms['Tags'])){
				$args['tags__in']=$terms['Tags'];
				$css.="t13ne-tags-multiple ";
			}else{
				$args['tag']=$terms['Tags'];
				$css.="t13ne-tags-{$terms['Tags']} ";
			}
		}
		$tax_query=array();
		$tax_query2=array();
		$type=explode(',',$type);
		if (!is_array($type)){
			$type=array($type);
		}
		$c_tax=array();
			foreach($type as $t){
				$ta=term_exists($t,'t13type');
				if (!is_wp_error($ta)){
					if (is_object($ta)){
						$c_tax[]=$ta->term_id;
					}elseif (is_array($ta)){
						$c_tax[]=$ta['term_id'];
					}

				}
			}
		$tax_query[]=array (
					'taxonomy' => 't13type',
					'field' => 'term_id',
					'terms' => $c_tax,
					'operator'=>'IN'
				);
		foreach ($type as $k=>$typ){
			if (!is_numeric($typ)){$typ=json_encode($typ);}
			$css.="t13ne-type-{$typ} ";
		}
		if (isset($terms['Geo'])&&!!$terms['Geo']){
			if (!is_array($terms['Geo'])){
				$geoa=array($terms['Geo']);
			}else{
				$geoa=$terms['Geo'];
			}
			$tax_query2[]=array (
					'taxonomy' => 't13geo',
					'field' => 'term_id',
					'terms' => $geoa,
					'operator'=>'IN'
				);
			foreach ($geoa as $k=>$g){
				if (!is_string($g)){$g=json_encode($g);}
				$css.="t13ne-geo-{$g} ";
			}
		}

		if (isset($terms['Facet'])&&!!$terms['Facet']){
			if (!is_array($terms['Facet'])){
				$terms['Facet']=array($terms['Facet']);
			}
			$tax_query2[]=array (
					'taxonomy' => 't13facet',
					'field' => 'term_id',
					'terms' => $terms['Facet'],
					'operator'=>'IN'
				);
			foreach ($terms['Facet'] as $k=>$typ){
				if (!is_string($typ)){$typ=json_encode($typ);}
				$css.="t13ne-facet-{$typ} ";
			}
		}
		if (isset($terms['Genre'])&&!!$terms['Genre']){
			if (!is_array($terms['Genre'])){
				$terms['Genre']=array($terms['Genre']);
			}
			$tax_query2[]=array (
				'taxonomy' => 't13genre',
				'field' => 'term_id',
				'terms' => $terms['Genre'],
					'operator'=>'IN'
				);
			foreach ($terms['Genre'] as $k=>$typ){
				if (!is_string($typ)){$typ=json_encode($typ);}
				$css.="t13ne-genre-{$typ} ";
			}

		}
		if (isset($terms['Era'])&&!!$terms['Era']){
			if (!is_array($terms['Era'])){
				$terms['Era']=array($terms['Era']);
			}
			$tax_query2[]=array (
				'taxonomy' => 't13era',
				'field' => 'term_id',
				'terms' => $terms['Era'],
					'operator'=>'IN'
				);
			foreach ($terms['Era'] as $k=>$typ){
				if (!is_string($typ)){$typ=json_encode($typ);}
				$css.="t13ne-era-{$typ} ";
			}
		}
		if (isset($terms['Scope'])&&!!$terms['Scope']){
			if (!is_array($terms['Scope'])){
				$terms['Scope']=array($terms['Scope']);
			}
			$tax_query2[]=array (
				'taxonomy' => 't13scope',
				'field' => 'term_id',
				'terms' => $terms['Scope'],
					'operator'=>'IN'
				);
			foreach ($terms['Scope'] as $k=>$typ){
				if (!is_string($typ)){$typ=json_encode($typ);}
				$css.="t13ne-scope-{$typ} ";
			}
		}
		if (isset($terms['Data'])&&!!$terms['Data']){
			if (!is_array($terms['Data'])){
				$terms['Data']=array($terms['Data']);
			}
			$tax_query2[]=array (
				'taxonomy' => 't13data',
				'field' => 'term_id',
				'terms' => $terms['Data'],
					'operator'=>'IN'
				);
			foreach ($terms['Data'] as $k=>$typ){
				if (!is_string($typ)){$typ=json_encode($typ);}
				$css.="t13ne-data-{$typ} ";
			}
		}
		$args['tax_query']=array();
		if (count($tax_query)>1||count($tax_query2)>0){
			if (count($tax_query2)>1){
				$tax_query2=array('relation'=>$relative, $tax_query2);
			}
			$tax_query=array('relation'=>'AND',$tax_query, $tax_query2);
		}

		$args['tax_query']=$tax_query;
		$ret=array();
		$postes=[];
		$rethtml = '<!-- T13NE Queried //-->';

		$els = new WP_Query( $args );

		if (is_wp_error($els)){
			$els=json_encode($els);
			$ret[]=array('Type'=>$els);
			$rethtml.='<h2>Error</h2><code>'.$els.'</code>';
		}else{
			$css=strtolower($css);
			if( $els->have_posts() ){

				$rethtml .= '<ul class="t13ne-elements">';
				while( $els->have_posts() ){
					$els->the_post();
					$id=get_the_id();

					if (is_wp_error($id)){
						$id=0;
						$ret[]=json_encode($id);
						$rethtml.=json_encode($id);
					}
					$typing=get_the_title();
					if (is_wp_error($typing)){
						$typing = json_encode($typing);
					}
					$desc=get_the_content();
					if (is_wp_error($desc)){
						$desc=json_encode($desc);
					}
					$postes[]=array('post_id'=>$id,'post_title'=>$typing,'post_content'=>$desc);
					$ret[$id]=array('Type'=>$typing, 'Description'=>$desc, 'Thresholds'=>T13Thresholds::getThreshold(null,$id));
					$rethtml .= "<li class=\"{$css}\">{$typing}</li>";
				}
				$rethtml .= '</ul>';
			}
		}
		wp_reset_postdata();
		switch ($arraymode){
			case 'HTML':
			case 'html':
			case 'HtmlArray':
			case 'HTMLARRAY':
				return $rethtml;
			break;
			case 'json':
				return array($args,$els,$postes,$ret);
			default:
				return $ret;
			break;
		}
	}
	public static function get_element_rest($id){
		$elementObj = get_post($id);
		error_log("get_element_rest::",$id,$elementObj);
		$statblock = T13StatBlock::getPostStats($id);
		$thresholds = T13Thresholds::getThreshold(null, $id);
		if (isset($elementObj)){
			$earl=esc_url(get_permalink($elementObj));
			$terms=array();
			$terms['Data'] = wp_get_post_terms($elementObj->ID, 't13data');
			$terms['Type'] = wp_get_post_terms($elementObj->ID, 't13type');
			$terms['Facet'] = wp_get_post_terms($elementObj->ID, 't13facet');
			$terms['Genre'] = wp_get_post_terms($elementObj->ID, 't13genre');
			$terms['Era']=wp_get_post_terms($elementObj->ID, 't13era');
			$terms['Geo'] = wp_get_post_terms($elementObj->ID, 't13geo');
			$terms['Scope'] = wp_get_post_terms($elementObj->ID, 't13scope');
			$terms['Category']= wp_get_post_terms($elementObj->ID, 'category');
			$terms['Tags']= wp_get_post_terms($elementObj->ID, 'post_tag');
			$terms['Parent'] =$elementObj->post_parent;
		}
		return array('id'=>$id, 'element'=>$elementObj, 'statblock'=>$statblock, 'thresholds'=>$thresholds, 'url'=>$earl, 'terms'=>$terms);
	}
}
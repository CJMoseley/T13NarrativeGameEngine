<?php
/**
 *
 *
 * @package    T13_Narrative_Engine
 * @license   GPL-2.0+
 */
/**
 * Register blocks for Gutenberg
 *
 * @package T13NE_Blocks
 */
class T13NE_Blocks {
//really not sure how they work or what should go here yet. So until that time I'll hack something togather, for now.
	public function init() {
		// Add the post types and taxonomies
		add_action( 'init', array( $this, 'addBlocks' ) );
	}
	public static function buildScripts(){

		return (object)['Taxon'=>self::t13getTerms()];
	}
	static public function t13getTerms(){
		global $wpdb;
		//echo ('getrows)');
		$sql="SELECT *
		FROM  {$wpdb->term_taxonomy}
		INNER JOIN {$wpdb->terms} ON {$wpdb->term_taxonomy}.term_id={$wpdb->terms}.term_id
		WHERE 1"; // LIMIT {$off}, {$pagesize};
		return $wpdb->get_results($sql);
	}
	static public function t13ne_dynamic_render_callback($atts,$content){
		$rethtml="";
		// postid:status.postid,
  //         forcesaver: "fs:"+Date.now().toString(36) +"-"+ Math.random().toString(36).substr(2, 6)+"-"+ Math.random().toString(36).substr(2, 6)+"-"+ Math.random().toString(36).substr(2, 6),
  //         t13name:status.title,
  //         t13description:status.content,
  //         eras:status.era,
  //         genre:status.genre,
  //         facets:status.facets,
  //         geo:status.geo,
  //         scope:status.scope,
  //         eltype:status.eltype,
  //         tags:status.tags,
  //         cats:status.cats
		$rethtml.='<p>Attributes from render callback: '.json_encode($atts);

		$rethtml.='</p><p>'.json_encode($content).'</p>';
		switch ($atts['type']){
			case 'prof':
				$rethtml.=T13Proficiencies::displayProf($atts['prof']) ;
			break;
			case 'annex':
				$rethtml.=T13Annexes::displayAnnex($atts['annex'],$atts['boon'], array('Size'=>$atts['size'], 'Pact'=>$atts['pact'], 'Members'=>$atts['members'], 'Personality'=>$atts['personality'],'Core'=>$atts['core'], 'Hitches'=>json_decode($atts['hitches'])));
			break;
			case 'hitch':
				$rethtml.=T13Hitches::displayHitchSC($atts['hitch'], $atts['hboon'], $atts['boon'], $atts['char'], $atts['resolved']);
			break;
			case 'descendant':
			case 'desc':
				$rethtml.=T13Descendants::displayDescendant($atts['desc']);
			break;
			case 'character':
			case 'char':
			case 'alt':
				$rethtml.=T13Chars::displayChar($atts['char']);
			break;
			case 'plot':
				$rethtml.="Plot";
			break;
			case 'statblock':
				$rethtml .= T13Statblock::displayStatblock($atts['stats'],$atts['alt']);
				break;
			}
	return $rethtml;

	}
	public function t13ne_search_for_blocks($request){
		$terms=$request->get_params();
		if($terms['post_type']!==''){$post_type=$terms['post_type'];}
		if ($terms['subtype']!==''){$post_type=$terms['subtype'];}
		$args = array(
			's'=> $terms['s'],
			'post_type' => $post_type,
			'post_status' => 'publish',
			'posts_per_page'=>$terms['per_page'],
		);
		if (isset($terms['Parent'])){
			if (is_string($terms['Parent'])){
				$args['post_parent']=post_exists($terms['Parent']);
			}elseif(is_numeric($terms['Parent'])){
				$args['post_parent']=$terms['Parent'];
			}elseif(is_array($terms['Parent'])){
				$args['post_parent__in']=$terms['Parent'];
			}
		}
		if (isset($terms['Author'])){
			if (is_array($terms['Author'])){
				$args['author__in']=$terms['Author'];
			}else{
				$args['author']=$terms['Author'];
			}
		}
		if (isset($terms['post_tags'])){
			if (is_array($terms['post_tags'])){
				$args['tags__in']=$terms['post_tags'];
			}else{
				$args['tag']=$terms['post_tags'];
			}
		}
		$tax_query=array();
		$tax_query2=array();
		if (isset($terms['t13type'])&&!!$terms['t13type']){
			//we have t13type specified.
			if (!is_array($terms['t13type'])){
				$ctax=array($terms['t13type']);
			}else{
				$ctax=$terms['t13type'];
			}
		}else{
			//none specified so build a list of all...
			$tx=get_terms(array(
			    'taxonomy' => 't13type',
			    'hide_empty' => true,
			) );
			foreach ($tx as $key => $value) {
				$ctax[]=$value->term_id;
			}
		}
		$tax_query[]=array (
					'taxonomy' => 't13type',
					'field' => 'term_id',
					'terms' => $ctax,
					'operator'=>'IN'
				);
		foreach ($terms as $key =>$value){
			if (T13Types::contains($key,'t13')&&$key!=='t13types'){
				if (isset($terms[$key])&&!!$terms[$key]){
					if (!is_array($terms[$key])){
						$geoa=array($terms[$key]);
					}else{
						$geoa=$terms[$key];
					}
					$tax_query2[]=array (
						'taxonomy' => $key,
						'field' => 'term_id',
						'terms' => $geoa,
						'operator'=>'IN'
					);
				}
			}
		}

		$args['tax_query']=array();
		if (count($tax_query)>1||count($tax_query2)>0){
			if (count($tax_query2)>1){
				$tax_query2=array('relation'=>'OR', $tax_query2);
			}
			$args['tax_query']=array('relation'=>'AND',$tax_query, $tax_query2);
		}
		$ret=array();
		$els = new WP_Query( $args );
		if (is_wp_error($els)){
			//went wrong
			$els=json_encode($els);
			$ret[]=array('Query'=>$els);
		}else{
			$data=[];
			foreach($els->posts as $post){
				$thresholds = T13Thresholds::getThreshold(null, $post->ID);
				$ret[]= array('id'=>$post->ID, 'title'=>$post->post_title , 'link'=>$post->guid, 'date'=>$post->post_date_gmt, 'author'=>$post->post_author, 'password'=>$post->post_password, 'type'=>$post->post_type, 'thresholds'=>$thresholds);
			}

		}
		return $ret;
	}
	public function t13ne_get_element($request){
		$dat = $request->get_params();
		return T13Elements::get_element_rest( $dat['id']?$dat['id']:0);
		//getThreshold($dat['thresholdid']?$dat['thresholdid']:NULL,$dat['postid']?$dat['postid']:NULL,$dat['statblockid']?$dat['statblockid']:NULL,$dat['direction']?$dat['direction']:NULL,NULL,$dat['types']?$dat['types']:NULL);

	}
	public static function t13ne_add_element($request){
		//needs to check the following does the t13postid exist (and do they own it?)
		//does the name already exist under a different id (but the same types) (has someone made this before)
		//adds t13error as a passback for those effects
		$dat=$request->get_params();
		$terms=array('post_tags'=>$dat['post_tags'],'category'=>$dat['category'],'Parent'=>$dat['parent'], 't13postid'=>$dat['t13postid'], 'Facet'=>$dat['facet'], 'Era'=>$dat['t13era'], 'Scope'=>$dat['t13scope'], 'Genre'=>$dat['t13genre'],'T13Data'=>$dat['t13data'], 'T13Types'=>$dat['t13type'], 'T13Facets'=>$dat['t13facet']);
		$eltype= $dat['eltype'];
		if (T13Types::contains($dat['title'], ':')){
			$names = explode(':', $dat['title']);
		}else{
			$names=array($dat['title'], "", "");
		}
		$name = T13Sanitize::sanitize($names[0]);
		$fullname = T13Sanitize::sanitize($dat['FullName']?$dat['FullName']:$names[1]);
		$altname = T13Sanitize::sanitize($dat['Altname']?$dat['Altname']:$names[2]);
		$content =T13Sanitize::sanitize($dat['content']);
		$specify = strtolower($dat['specify']);
		if ($specify!=="false"&&$specify!=="0"){$specify=TRUE;}
		$data= array('Title'=>$name,'Description'=>$content,'Specify'=>$specify, 'Facet'=>$dat['facet'], );
		$nuelement=T13Types::addElement($eltype,array($name, $fullname, $altname),$data,$terms);
		return $nuelement;
	}

	public function t13ne_register_add_element_route(){
		 register_rest_route( 't13ne/v1', '/addt13/', array(

        // By using this constant we ensure that when the WP_REST_Server changes our readable endpoints will work as intended.
        'methods'  => WP_REST_Server::ALLMETHODS,
        // Here we register our callback. The callback is fired when this endpoint is matched by the WP_REST_Server class.
        'callback' => [$this,'t13ne_add_element'],
        'args'=>[
			'title'=>['required'=>TRUE,'type'=>'string'],
				 'content'=>['required'=>TRUE,'type'=>'string'],
				 'parent'=>['type'=>'string',],
				 't13postid'=>['type'=>'string'],
				 'facet'=>['type'=>'string'],
				 'eltype'=>['type'=>'string'],
				 't13genre'=>['type'=>'array'],
				 't13type'=>['type'=>'array'],
				 't13facet'=>['type'=>'array'],
				 't13data'=>['type'=>'array'],
				 't13scope'=>['type'=>'array'],
				 't13era'=>['type'=>'array'],
				 'post_tags'=>['type'=>'array'],
				 'cateogry'=>['type'=>'array'],
				 'specify'=>['type'=>'string'],
			],'permission_callback'=>function (){return current_user_can( 'edit_posts' );}
    ) );
	}
	public function t13ne_register_element_route(){
		register_rest_route('t13ne/v1', '/elems/', array(
			'methods'=>WP_REST_Server::READABLE,
			'callback'=>[$this,'t13ne_get_element'],
			'args'=>['id'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint']],'permission_callback'=>function (){return true;}
			));
	}
	public function t13ne_get_statblocks($request){
		$dat = $request->get_params();
		return T13Statblock::db_getStatblock($dat['statblockid']?$dat['statblockid']:NULL,$dat['postid']?$dat['postid']:NULL);
	}
	public function t13ne_set_statblock($request){
		$dat = $request->get_params();
		$stats = array();
		for($i=0;$i<12;$i++){
			$stats[$i] = array('Facet'=>$dat['facet'.$i], 'Facet_Boon'=>$dat["facet{$i}_boon"], 'Joined'=>$dat['joined'.$i], 'Antifacet'=> $dat['antifacet'.$i] ? $dat['antifacet'.$i] : T13Facets::$facets[$dat['facet'.$i]]['AntiFacet'], 'Antifacet_Boon'=> $dat["antifacet{$i}_boon"]? $dat["antifacet{$i}_boon"] : 26-$dat["facet{$i}_boon"]);
		}
		return T13Statblock::db_SetStatblock(array('Scale'=>$dat['scale'],'Hexagram'=>array($dat['hexagram1'],$dat['hexagram2']), 'Stats'=>$stats),$dat['statblockid'], $dat['postid']);
	}
	public function t13ne_register_set_statblock(){
		register_rest_route('t13ne/v1', '/setstatblock/', array(
			'methods'=>WP_REST_Server::ALLMETHODS,
			'callback'=>[$this,'t13ne_set_statblock'],
			'args'=>['statblockid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'postid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'scale'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'hexagram1'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'hexagram2'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet0'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet0_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined0'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet0'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet0_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet1'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet1_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined1'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet1'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet1_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet2'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet2_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined2'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet2'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet2_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet3'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet3_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined3'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet3'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet3_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet4'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet4_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined4'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet4'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet4_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet5'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet5_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined5'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet5'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet5_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet6'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet6_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined6'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet6'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet6_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet7'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet7_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined7'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet7'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet7_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet8'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet8_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined8'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet8'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet8_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet9'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet9_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined9'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet9'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet9_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet10'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet10_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined10'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet10'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet10_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet11'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'facet11_boon'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'joined11'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet11'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'antifacet11_boon'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
		],'permission_callback'=>function (){return current_user_can('edit_posts');}));
	}
	public function t13ne_register_statblock_route(){
		register_rest_route('t13ne/v1', '/statblocks/', array(
			'methods'=>WP_REST_Server::READABLE,
			'callback'=>[$this,'t13ne_get_statblocks'],
			'args'=>['statblockid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			'postid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint']],'permission_callback'=>function (){return true;})

	);
	}
	public function t13ne_get_thresholds($request){
		$dat = $request->get_params();
		return T13Thresholds::getThreshold($dat['thresholdid']?$dat['thresholdid']:NULL,$dat['postid']?$dat['postid']:NULL,$dat['statblockid']?$dat['statblockid']:NULL,$dat['direction']?$dat['direction']:NULL,NULL,$dat['types']?$dat['types']:NULL);
	}
	static public function t13ne_set_thresholds($request){
		$dat = $request->get_params();
		return T13Thresholds::tieThreshold($dat['type']?$dat['type']:NULL, $dat['direction']?$dat['direction']:NULL, $dat['name']?$dat['name']:NULL, $dat['description']?$dat['description']:NULL, $dat['postid']?$dat['postid']:NULL,$dat['targetid']?$dat['targetid']:NULL,$dat['group']?$dat['group']:NULL,$dat['statblockid']?$dat['statblockid']:NULL, $dat['twoway']?$dat['twoway']:NULL,$dat['data']?$dat['data']:NULL);
	}
	public function t13ne_register_threshold_route(){
		//$id=null, $post_id=null, $group=null, $statblock=null, $direction=null, $TwoWay=null, $types=null
		register_rest_route('t13ne/v1', '/thresholds/', array(
			'methods'=>WP_REST_Server::READABLE,
			'callback'=>[$this,'t13ne_get_thresholds'],
			'args'=>['thresholdid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'postid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'statblockid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'direction'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'types'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			],'permission_callback'=>function (){return true;}));
	}
	public function t13ne_register_set_threshold_route(){
		//$id=null, $post_id=null, $group=null, $statblock=null, $direction=null, $TwoWay=null, $types=null
		register_rest_route('t13ne/v1', '/setthresholds/', array(
			'methods'=>WP_REST_Server::ALLMETHODS,
			'callback'=>[$this,'t13ne_set_thresholds'],
			'args'=>[
				'type'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'direction'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'name'=>['required'=>true, 'type'=>'string', 'sanitize_callback' => array('T13Sanitize','sanitize')],
				'postid'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'targetid'=>['required'=>true, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'group'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'statblockid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'twoway'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'data'=>['required'=>false, 'type'=>'string', 'sanitize_callback' => array('T13Sanitize','sanitize')],
			],'permission_callback' => function () {
		      return current_user_can( 'edit_posts' );
		    })
	);
	}
	public static function t13ne_get_groups($request){
		$dat = $request->get_params();
		return T13Thresholds::getGroups($dat['groupsid']?$dat['groupsid']:NULL, $dat['name']?$dat['name']:NULL, $dat['postid']?$dat['postid']:NULL);
	}
	public static function t13ne_set_group($request){
		$dat = $request->get_params();
		return T13Thresholds::addThisGroup( $dat['name']?$dat['name']:NULL, $dat['description']?$dat['description']:NULL, $dat['grouptype']?$dat['grouptype']:NULL,  $dat['postid']?$dat['postid']:NULL);
	}
	public function t13ne_register_group_route(){
		//$id=null, $post_id=null, $group=null, $statblock=null, $direction=null, $TwoWay=null, $types=null
		register_rest_route('t13ne/v1', '/groups/', array(
			'methods'=>WP_REST_Server::READABLE,
			'callback'=>[$this,'t13ne_get_groups'],
			'args'=>['groupsid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'groupname'=>['required'=>false, 'type'=>'string', 'sanitize_callback' => array('T13Sanitize','sanitize')],
				'postid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			],'permission_callback'=>function (){return true;}));
	}
	public function t13ne_register_set_group_route(){
		//$id=null, $post_id=null, $group=null, $statblock=null, $direction=null, $TwoWay=null, $types=null
		register_rest_route('t13ne/v1', '/setgroup/', array(
			'methods'=>WP_REST_Server::ALLMETHODS,
			'callback'=>[$this,'t13ne_set_thresholds'],
			'args'=>['name'=>['required'=>false, 'type'=>'string', 'sanitize_callback' => array('T13Sanitize','sanitize')],
				'description'=>['required'=>false, 'type'=>'string', 'sanitize_callback' => array('T13Sanitize','sanitize')],
				'grouptype'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
				'postid'=>['required'=>false, 'type'=>'integer', 'sanitize_callback' => 'absint'],
			],'permission_callback'=>function (){return current_user_can( 'edit_posts' );}));
	}
	public function t13ne_register_search_route(){
		 register_rest_route( 't13ne/v1', '/search/', array(
		 //(\&|\?)?s=(?P<s>\w+)?(\&per_page=)(?P<per_page>\d+)?(\&post_type=)?(?P<post_type>\w+)?(\&subtype=)?(?P<subtype>\w+)?((\&t13type=|\&t13type\[]=)(?P<t13type>\w+))*((\&t13genre=|\&t13genre\[]=)(?P<t13genre>\w+))*((\&t13scope=|\&t13scope\[]=)(?P<t13scope>\w+))*((\&t13facet=|\&t13facet\[]=)(?P<t13facet>\w+))*((\&t13era=|\&t13era\[]=)(?P<t13era>\w+))*
        // By using this constant we ensure that when the WP_REST_Server changes our readable endpoints will work as intended.
        'methods'  => WP_REST_Server::READABLE,
        // Here we register our callback. The callback is fired when this endpoint is matched by the WP_REST_Server class.
        'callback' => [$this,'t13ne_search_for_blocks'],
        'args'=>[
			's'=>['required'=>TRUE,'type'=>'string' ],
				'post_types'=>['type'=>'string','default'=>'any' ],
				'subtypes'=>['type'=>'string','default'=>'',],
				't13geo'=>['type'=>'array',],
				't13type'=>['type'=>'array',],
				't13facet'=>['type'=>'array'],
				't13scope'=>['type'=>'array'],
				't13era'=>['type'=>'array'],
				't13data'=>['type'=>'array'],
				'post_tags'=>['type'=>'array'],
				'cateogry'=>['type'=>'array']
			],'permission_callback'=>function (){return true;}
    ) );
	}
	static public function registerT13neBlock($name, $blocked=false, $metad=false, $callback=false){

		wp_enqueue_script(
			't13ne-'.$name,
		    plugins_url()."/t13ne/blocks/{$name}/{$name}.js",
		    array('t13ne-components','T13NEbase','jquery' ));
		wp_enqueue_style('t13ne-css-'.$name, plugins_url() ."/t13ne/blocks/{$name}/{$name}.css");
		if ($blocked){
			wp_register_script(
				't13ne-'.$name.'1',
				plugins_url() . "/t13ne/blocks/{$name}/block.js",
				array( 'wp-blocks', 'wp-element','wp-editor', 'wp-data',
				'wp-i18n','wp-components','T13NEbase','t13ne-components','t13ne-'.$name )
			);
			 wp_enqueue_style('t13ne-css-block-'.$name, plugins_url() . "/t13ne/blocks/{$name}/block.css");
			if ($callback) {
				register_block_type( 't13ne/t13ne-'.$name, array(
			        'editor_script' => 't13ne-'.$name.'1',
			        'editor_style'=>'t13ne-css-block-'.$name,
			        'style'=>'t13ne-css-'.$name,
				'script'=>'t13ne-'.$name,
				'render_callback'=>'T13NE_Blocks','t13ne_dynamic_render_callback'
			    ));
			}else{
				register_block_type( 't13ne/t13ne-'.$name, array(
			        'editor_script' => 't13ne-'.$name.'1',
			        'editor_style'=>'t13ne-css-block-'.$name,
			        'style'=>'t13ne-css-'.$name,
				'script'=>'t13ne-'.$name,
			    ));
			}

		}
		if ($metad){
			 register_post_meta( 'post', 'author', array(
		        'show_in_rest' => true,
		    ) );
		}
    }
    public function t13ne_register_rest_routes(){
	$this->t13ne_register_search_route();
	$this->t13ne_register_statblock_route();
	$this->t13ne_register_set_statblock();
	$this->t13ne_register_add_element_route();
	$this->t13ne_register_element_route();
	$this->t13ne_register_set_group_route();
	$this->t13ne_register_group_route();
	$this->t13ne_register_set_threshold_route();
	$this->t13ne_register_threshold_route();

    }
	public static function addBlocks(){
		global $wp;
		wp_enqueue_script( 'T13NEbase', dirname(plugin_dir_url( __FILE__ )) . '/public/js/t13ne-base.js', array( 'jquery' ) );
		$t13=self::buildScripts();
		$user = wp_get_current_user();
		$data = array();
		$data['id'] = $user->ID;
		$data['username'] = $user->user_login;
		$data['name'] = $user->display_name;
		$data['first_name'] = $user->first_name;
		$data['last_name'] = $user->last_name;
		$data['email'] = $user->user_email;
		$data['url'] = $user->user_url;
		$data['description'] = $user->description;
		$data['link'] = get_author_posts_url( $user->ID, $user->user_nicename );
		$data['nickname'] = $user->nickname;
		$data['slug'] = $user->user_nicename;
		$data['roles'] = array_values( $user->roles );
		$data['registered_date'] = date( 'c', strtotime( $user->user_registered ) );
		$data['capabilities'] = (object) $user->allcaps;
		$data['extra_capabilities'] = (object) $user->caps;
		$data['logged_in']= is_user_logged_in();
		$page=array();
		$page['wp_url']=add_query_arg( $wp->query_string, '', home_url( $wp->request ) );
		$page['guessed']=wp_guess_url();
		$page['admin']=is_admin();
		$page['admin_bar_showing']=is_admin_bar_showing();
		$page['time']= date('d/m/Y h:i:s a', time());
		$page['admin_url']=admin_url();
		$page['get_post_link']=get_edit_post_link();
		wp_localize_script('T13NEbase', 'T13NEbase' , array( 'Taxon'=>$t13, 'User'=>$data, 'Page'=>$page ));
		// react components
		wp_enqueue_script( 'react', 'https://unpkg.com/react@15.6.2/dist/react.js', false, false);
		wp_enqueue_script( 'react-dom', 'https://unpkg.com/react-dom@15.6.2/dist/react-dom.js', array('json2'), false, false);
		wp_enqueue_script(
	        't13ne-components',
	        plugins_url( "../blocks/components.js", __FILE__ ),
	        array(  'react', 'react-dom','wp-blocks', 'wp-element','wp-editor', 'wp-data',
            'wp-i18n','wp-components','T13NEbase','jquery', 'lodash', 'wp-block-library', 'wp-compose', 'wp-core-data', )
		);
		self::registerT13neBlock("attacks");
		self::registerT13neBlock("boons",);
		self::registerT13neBlock("facets",true);
		//self::registerT13neBlock("cardtable");
		//self::registerT13neBlock("dates");
		self::registerT13neBlock("dice");
		self::registerT13neBlock("geometry",true);
		self::registerT13neBlock("nametag",true);
		self::registerT13neBlock("wounds",true);
		//self::registerT13neBlock("t13netables");
		self::registerT13neBlock("suits");
		self::registerT13neBlock("cards",true);
		// T13Block Components
		self::registerT13neBlock("statblocks");

		//self::registerT13neBlock("note");
		self::registerT13neBlock("proficiencies");
		self::registerT13neBlock("annex");
		//self::registerT13neBlock("characters");
		//self::registerT13neBlock("descendants");
		//self::registerT13neBlock("games");
		self::registerT13neBlock("hitches");
		//self::registerT13neBlock("plots");
		//self::registerT13neBlock("lite");
		//self::registerT13neBlock("map");
		//self::registerT13neBlock("mindmap");
		//self::registerT13neBlock("rules", true);
		//self::registerT13neBlock("widgets", true, true, true);
		self::registerT13neBlock("avatar",true, true);
		self::registerT13neBlock("searchbox");

		//error_log("added profs");

		// T13 Container (the only one we should make directly addable as a wordpress block - profs are a prof in a container...)
		self::registerT13neBlock("container",true);
		self::registerT13neBlock("store");
		//error_log("added container");
	}
}
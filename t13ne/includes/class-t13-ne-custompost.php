<?php
/**
 *
 *
 * @package    T13_Narrative_Engine
 * @license   GPL-2.0
 */
/**
 * Register post types and taxonomies.
 *
 * @package Element post_type
 */
class T13_Element_Registrations {
	public $post_type;
	static public $post_types = array(
		array('Short'=>'Element','Singular'=>'T13 Element','Plural'=>'T13 Elements', 'Description'=>'T13 Elements are how we store all T13 Annexes, Characters, Descendants, Games, Handicaps, Plots and Proficiencies.'),
		array('Short'=>'Rules','Singular'=>'T13 Rule','Plural'=>'T13 Rules', 'Description'=>'T13 Rules are stored in these rule pages. If you want to find out about how to play games, make Tests, or create Characters, or Plots these are the pages you ned to read.')
		//array('Short'=>'Game','Singular'=>'Game','Plural'=>'Games', 'Description'=>'Games are the meat and potatoes of the T13 Narrative Engine. Usually a Game has players and a ref, but it can also be used by Authors as a Work-in-progress Project.')
	);
	static public $taxonomies = array(
		array('Short'=>'Type', 'Singular'=>'Element-Type', 'Plural'=>'Element-Types', 'Description'=>'T13 Elements always require an Element Type. Whether they are a Weaver like a Player Character or a Plot, a Pattern like an Extra, a Location, or that rusty old sword, a Knot, like an Annex or Hitch, or a Thread like a Proficiency such as "Gyscopic Stabilization" or "Legs".'),
		array('Short'=>'Genre', 'Singular'=>'Genre', 'Plural'=>'Genres', 'Description'=>'Genres are how we divide up sections of the Omniverse according to the types of Elements available. Genres tend to either too broad, or too specific, for anyone\'s needs. For this reason you may find things tagged into multiple Genres, like perhaps axes turn up in Fantasy and Horror, but rarely in Science-Fiction. Vibro-axes on the other hand...'),
		array('Short'=>'Facet', 'Singular'=>'Facet', 'Plural'=>'Facets', 'Description'=>'The Facets are the major axes of a 24 dimensional phase space that every part of the game is modelled within. Or... they are the stuff that everything is made from.'),
		array('Short'=>'Era', 'Singular'=>'Historical Era', 'Plural'=>'Historical Eras', 'Description'=>'Eras are how we define when an object or concept is from. If you are looking at an the Era defines whether it is more likely to be a sharp-rock tied to a stick or a composite alloy wood-felling axe.'),
		array('Short'=>'Scope', 'Singular'=>'Narrative Scope', 'Plural'=>'Narrative Scopes', 'Description'=>'Narrative Scopes are how we define how multiversal, or important a thing is. Somethings like Rocks are so common you find them pretty much everywhere, other things like cursed VHS tapes, Photon Cutlasses, or Psibernetics are specific to at most a Multiverse.'),
		array('Short'=>'Geo', 'Singular'=>'Geometry', 'Plural'=>'Nominative Geometries', 'Description'=>'Nominative Geometries are how we store the Gematria of names for every element in the game. When you search for something those with matching Geometries should be considered first. Randomly generated Characters will often use Geometries to randomly assign Proficiencies, Annexes and Hitches.'),
		array('Short'=>'Data', 'Singular'=>'Element Datum', 'Plural'=>'Element Data', 'Description'=>'Element Data is used to store additional searchable data about the Elements involved.')
		  );
	public function init() {
		// Add the post types and taxonomies
		add_action( 'init', array( $this, 'register' ) );
	}
	public function load_post(){
		return true;
	}

	private function link_taxonomy(){
		foreach (static::$taxonomies as $tax){
			$t = strtolower('t13'.$tax['Short']);
			foreach(static::$post_types as $posti){
				$p= strtolower($posti['Short']);
				register_taxonomy_for_object_type( $t, $p );
			}
		}
	}

	public function register() {
		do_action('t13ne_register_post_types');
		$this->register_post_types();
		$this->register_taxonomy_categories();
		$this->link_taxonomy();
		$this->add_terms();
		$this->add_images();
		flush_rewrite_rules();

	}
	private function register_post_types(){
		$i=0;
		foreach(static::$post_types as $type){
			$this->register_post_typer($type,$i);
			$this->post_type[]=strtolower($type['Short']);
			T13Types::$post_type[]=strtolower($type['Short']);
			$i++;
		}
	}
	/**
	 * Summary of unregister_t13ne
	 * @return void
	 */
	static public function unregister_t13ne(){
		foreach(static::$post_types as $type){
			unregister_post_type( strtolower($type['Short']) );
		}
		foreach(static::$taxonomies as $tax){
			unregister_taxonomy( strtolower('t13'.$tax['Short'] ));
		}
	}
	public function t13ne_metabox_callback($args){
		global $post;
		//edit the multipurpose metabox.
		// Add a nonce field so we can check for it later.
			wp_nonce_field( 't13ne_nonce', 't13ne_nonce' );
		    $value = get_post_meta( $post->ID, '_t13ne_multipurpose', true );
		    //echo '<textarea style="width:100%" id="t13ne_multipurpose" name="t13ne_multipurpose">' . esc_attr( $value ) . '</textarea>';

	}
	private function t13ne_metabox($args){
		//var_dump($args);
		//echo('===$args');
		add_meta_box('t13ne_metabox', __( 'T13 Narrative Engine Multipurpose Meta Box', 't13ne' ),
        't13ne_metabox_callback');
	}
	protected function register_post_typer($type,$i) {
		$regterm =strtolower($type['Short']);
		$args = array(
			'labels'          	 => array(
			'name'               => __( $type['Singular'], 't13ne' ),
			'singular_name'      => __( $type['Singular'], 't13ne' ),
			'add_new'            => __( 'Add '.$type['Plural'].' here', 't13ne' ),
			'add_new_item'       => __( 'Add an '.$type['Singular'].' here', 't13ne' ),
			'edit_item'          => __( 'Edit '.$type['Short'], 't13ne' ),
			'new_item'           => __( 'New '.$type['Short'], 't13ne' ),
			'view_item'          => __( 'View '.$type['Short'], 't13ne' ),
			'search_items'       => __( 'Search '.$type['Plural'], 't13ne' ),
			'not_found'          => __( 'No '.$type['Plural'].' found', 't13ne' ),
			'not_found_in_trash' => __( 'No '.$type['Plural'].' in the trash', 't13ne' ),
			'parent_item_colon'  => __('Parent of this '.$type['Singular'].':','t13ne'),
			'menu_name' 		 => __($type['Plural'],'t13ne'),
			'register_meta_box_cb' => 't13ne_metabox'
		),
			'supports'        => array('author','title','excerpt','trackbacks','page-attributes','editor','thumbnail','comments','revisions', 'post-types','custom-fields'),
			'show_in_rest'    => true,
			'public'          => true,
			'description'	  => $type['Description'],
			'capability_type' => 'post',
			'hierarchical'    => true,
			'rewrite'         => array( 'slug' => $regterm, 'with_front' => 't13ne'), // Permalinks format
			'show_in_nav_menus' =>true,
			'show_in_menu'	  => 't13ne-menu',
			'show_in_admin_bar'=> true,
			'menu_position'   => 3,
			'menu_icon'       => 'dashicons-hammer',
			'taxonomies' 	  => array('post_tag', 'category'),
			'show_ui'           => true,
			'show_tagcloud'     => true,
			'can_export'        => true,
			'has_archive'		=> true,
			'show_admin_column' => true,
			'exclude_from_search' => false,
			'publicly_queryable' => true,
			'query_var'         => true,
		);
		$args = apply_filters( 't13ne_'.$type['Short'].'_register', $args );
		register_post_type($regterm, $args);
	}
	protected function register_taxonomy_categories() {
		do_action('t13ne_register_taxonomy_categories');
		foreach (static::$taxonomies as $f){
			$regterm=strtolower('t13'.$f['Short']);

			$args = array(
				'labels'            => array(
				'name'                       => __( $f['Plural'], 't13ne' ),
				'singular_name'              => __( $f['Singular'], 't13ne' ),
				'menu_name'                  => __( $f['Plural'], 't13ne' ),
				'edit_item'                  => __( 'Edit '.$f['Short'].'s', 't13ne' ),
				'update_item'                => __( 'Update '.$f['Short'].'s', 't13ne' ),
				'add_new_item'               => __( 'Add New '.$f['Short'].'s', 't13ne' ),
				'new_item_name'              => __( 'New  '.$f['Plural'].' Name', 't13ne' ),
				'all_items'                  => __( 'All  '.$f['Plural'], 't13ne' ),
				'search_items'               => __( 'Search  '.$f['Plural'], 't13ne' ),
				'popular_items'              => __( 'Popular  '.$f['Plural'], 't13ne' ),
				'separate_items_with_commas' => __( 'Separate  '.$f['Plural'].' with commas', 't13ne' ),
				'add_or_remove_items'        => __( 'Add or remove  '.$f['Plural'], 't13ne' ),
				'choose_from_most_used'      => __( 'Choose from the most used  '.$f['Plural'], 't13ne' ),
				'not_found'                  => __( 'No  '.$f['Plural'].' found.', 't13ne' ),
			),
				'public'            => true,
				'description'		=>$f['Description'],
				'show_in_nav_menus' => true,
				'show_in_menu'	  => true,
				'show_ui'           => true,
				'show_in_rest'		=> true,
				'show_tagcloud'     => true,
				'can_export'        => true,
				'has_archive'		=> true,
				'hierarchical'      => true,
				'rewrite'           => array( 'slug' => strtolower($f['Short']),'with_front' => 't13ne' ),
				'show_admin_column' => true,
				'exclude_from_search'=> false,
				'publicly_queryable' => true,
				'capability_type'   => 'post',
				'query_var'         => true,

			);
			$args = apply_filters( 't13ne_'.$regterm.'_tax_args', $args );
			register_taxonomy($regterm, $this->post_type, $args );
		}
	}
	private function add_images(){
      global $wpdb;
	    $attachments = $wpdb->get_results( "SELECT * FROM $wpdb->posts WHERE post_title = 'T13-Logo' AND post_type = 'attachment' ", OBJECT );
	    if (!$attachments||$attachments==[]||is_null($attachments)||is_wp_error($attachments)){
		require_once(ABSPATH . 'wp-admin/includes/media.php');
		require_once(ABSPATH . 'wp-admin/includes/file.php');
		require_once(ABSPATH . 'wp-admin/includes/image.php');
		$media = media_sideload_image(plugin_dir_url(plugin_dir_path(__DIR__ ) ).'images/t13.png', 0, 'T13-Logo','id');
	  }
	}
	public function t13ne_filter_admin($args ){
		if ($args=='rules'||$args=='element'){
			$taxonomies = array('t13type', 't13genre', 't13facet', 't13era','t13scope','t13geo','t13data' );
			foreach ( $taxonomies as $taxonomy_slug ) {
				// Retrieve taxonomy data
				$taxonomy_obj = get_taxonomy( $taxonomy_slug );
				$taxonomy_name = $taxonomy_obj->labels->name;

				// Retrieve taxonomy terms
				$terms = get_terms( $taxonomy_slug );

				// Display filter HTML
				echo "<select name='{$taxonomy_slug}' id='{$taxonomy_slug}' class='postform'>";
				echo '<option value="">' . sprintf( esc_html__( 'Show All %s', 't13ne' ), $taxonomy_name ) . '</option>';
				foreach ( $terms as $term ) {
					printf(
						'<option value="%1$s" %2$s>%3$s (%4$s)</option>',
						$term->slug,
						( ( isset( $_GET[$taxonomy_slug] ) && ( $_GET[$taxonomy_slug] == $term->slug ) ) ? ' selected="selected"' : '' ),
						$term->name,
						$term->count
					);
				}
				echo '</select>';
			}
		}
	}
	private function add_terms(){
		$regterm= strtolower('t13'.static::$taxonomies[0]['Short']);
		if (!term_exists('Tapestry', $regterm)){
			wp_insert_term('Tapestry',$regterm, array('description'=> 'Tapestries are the meat and potatoes of the T13 Narrative Engine. These are the living past-present and future on Wyrd\'s Loom, where the Skeins of lives, weave patterns from chaos. Usually a Tapestry can be used as a Game and has Players, a Ref, and maybe some associated Rules too, but it can also be used by Authors as a Work-in-progress or Outline (not that they might not want a Rule or two too. Narrative Tapestries are usually more linear in nature, as they have have a single Story to tell (although not always), where as Game Tapestries tend to adapt the Tapestry as Player Characters and Plots tangle.','slug' => 'tapestries','parent'=> 0));
			$tapestry=term_exists('Tapestry', $regterm);
			wp_insert_term('Game',$regterm, array('description'=> 'Games are how we play through a T13 Tapestry. They are meant to present a slice of the Omniverse for you to explore and play through/with. One T13 Game can be a very different experience to another, despite being built on the same Narrative Engine.','slug' => 'games','parent'=> $tapestry['term_id']));
			wp_insert_term('Narrative',$regterm, array('description'=> 'Narratives are how we outline Stories, Novels and Series. They tend to be a lot more linear than Games (as writers tend to have slightly more control over their own PCs than someone elses, although in some case not much). Hopefully you\'ll find a few of my Shorts and even a Novel or Two here. Or can work on your own ideas.','slug' => 'narratives','parent'=> $tapestry['term_id']));
			wp_insert_term('Weaver',$regterm, array('description'=> 'Weavers create the Tapestry from the patterns. They are our main Characters (in some cases whole groups of them as Pacts) and Plots.','slug' => 'weavers','parent'=> 0));
			$weavers=term_exists('Weaver', $regterm);
			wp_insert_term('Character',$regterm, array('description'=> 'Characters are we hope the most self-explanatory part of the T13 Narrative Engine. Characters can be split into Player Characters (or Protagonist Characters), and NPCs (Non-Player Characters) or "Side" Characters, that are handled by the Yarn-Teller.','slug' => 'characters','parent'=> $weavers['term_id']));
			$characters=term_exists('Character', $regterm);
			wp_insert_term('Lite',$regterm, array('description'=> 'Lite Characters are simplified Protagonist Characters intended for short stories, one-off games, and younger players. They may be used as PCs and NPCs as required. They can be converted into other Character Types, but work best in their own all-Lite Tapestries. They always use Extras as Alts. ','slug' => 'lites','parent'=> $characters['term_id']));
			wp_insert_term('Archetype',$regterm, array('description'=> 'Archetype Characters are slightly simplified Player and Protagonist Characters intended for quick beginnings, and easy set-up. They can be used as NPCs (particularly minion level Grunts or low-powered Goblins) with ease, and can easily be expanded into Detailed Characters. Archetype Characters are usually created by at least one NPC Yarn Card. More Cards create more complex and powerful Archetypes.','slug' => 'archetypes','parent'=> $characters['term_id']));
			wp_insert_term('Detailed',$regterm, array('description'=> 'Detailed Characters are how most major Characters are intended to be. You get plenty of details to base the Characterisation off, they are usually limited in number of Alts (suitable for most Characters). A Detailed Character will have at least one set of Facets, I-Ching, and at least one Personality, Core and Hitch (an Alt - these can reflect different aspects of characters or different incarnations, bodies, quantum-selves, demonic possessions, past-lives and so on). They will have Proficiencies and may have Skills, Talents and Powers depending on how advanced they are. Detailed Characters almost always have Descendants.','slug' => 'details','parent'=> $characters['term_id']));
			wp_insert_term('Full',$regterm, array('description'=> 'Full Characters are the most important and detailed Characters in the system. They are essentially intended for gods, Yarn-Tellers and other very important Characters. PCs that reach the level of Full Characters are few and far between, and it tends to happen in the late Loom Epic of the Cycle. Characters this powerful are always Doom-weavers and usually Yarn-Tellers, affecting the patterns and Tapestry around them to at least the same degree as any Plot. Full Characters can have many Alts.','slug' => 'full','parent'=> $characters['term_id']));
			wp_insert_term('Grunt',$regterm, array('description'=> 'Grunts are the normal folks, the muggles, low-level adventurers, PCs without alternates.','slug' => 'grunt','parent'=> $characters['term_id']));
			wp_insert_term('Hero',$regterm, array('description'=> 'Hero Characters are powerful individuals who in T13 usually have more than one alternate existence, perhaps they have a past-life or a quantum alternate that they are aware of.','slug' => 'hero','parent'=> $characters['term_id']));
			wp_insert_term('Yarn-Teller',$regterm, array('description'=> 'Yarn-Teller Characters are the most powerful Characters in the game, they are god-like beings who either have centuries of life experience or are multi-dimensional beings in some way.','slug' => 'yarn-teller','parent'=> $characters['term_id']));
			wp_insert_term('Goblin',$regterm, array('description'=> 'Goblin Characters the least powerful of those individuals who are Twisted by the power of the Increated. They usually have a single Woes Hitch','slug' => 'goblin','parent'=> $characters['term_id']));
			wp_insert_term('Demon',$regterm, array('description'=> 'Demon Characters are powerful hero Characters touched by the Twists of the Increated. They often have a number of Woes.','slug' => 'demon','parent'=> $characters['term_id']));
			wp_insert_term('Demon-Lord',$regterm, array('description'=> 'Demon-Lords are Yarn-Teller Characters corrupted by the Twists of the Increated. They are powerful and dangerous emissaries of the Increated, often functioning as lieutenants to the Patron D&aelig;mons of Shades.','slug' => 'demonlord','parent'=> $characters['term_id']));
			wp_insert_term('Plot',$regterm, array('description'=> 'Plots are a major component of the T13 Narrative Engine, they set the universe in motion, creating stories, descendants and characters to populate the game and keep the Players entertained. Plots are Weavers, manipulating the Tapestry from behind to promote and explore their particular Conflict.','slug' => 'plots','parent'=> $weavers['term_id']));
			wp_insert_term('Spinner',$regterm, array('description'=> 'Spinners are used to randomly create Patterns (and occasionally other Weavers). A Spinner is essentially a random set of tables that can produce themed content. You can set up Spinners to create NPC names, Descriptions, random treasure tables, and all sorts of other goodness.','slug' => 'spinner','parent'=> $weavers['term_id']));
			wp_insert_term('Pattern',$regterm, array('description'=> 'Patterns are reusable things that Weavers use to create the Tapestry. They are our Locations, Extras, Descendants and Social Structures (Pacts and Extras).','slug' => 'patterns','parent'=> 0));
			$patterns= term_exists('Pattern', $regterm);
			wp_insert_term('Structure',$regterm, array('description'=> 'Structures describe how Games work, they are the frameworks that we use to create Game-loops and Narrative Components. Structures can be Game Structures, Scenario Structures, Campaign Structures, Episode Structures and so on.','slug' => 'structure','parent'=> $patterns['term_id']));
			wp_insert_term('Descendant',$regterm, array('description'=> 'Descendants are free-floating Annexes, often with a Hitch or two, and are how we model everything from simple props (your equipment), education and training, to Locations, and even groups, guilds, nations or species.','slug' => 'desc','parent'=> $patterns['term_id']));
			$descendants= term_exists('Descendant', $regterm);
			wp_insert_term('Location',$regterm, array('description'=>'Locations are a specific type of Descendant that is a place. Technically they are all Yonder-based Descendants. Plots require at least one Location be specified.','slug' => 'locations','parent'=> $descendants['term_id']));
			wp_insert_term('Pact',$regterm, array('description'=> 'Pacts are a specific type of Descendant that is a Group of individuals. Technically they are all Dominion based Descendants. They can be used to model all groups from small to enormous.','slug' => 'pacts','parent'=> $descendants['term_id']));
			wp_insert_term('Extra',$regterm, array('description'=> 'Extras are sub-set of Characters that are just patterns. They consist of at least one Annex. They may be given additional smaller Annexes beneath the primary one. They may also be given Hitches. Extras are usually just used as NPCs, however it is possible to use Extras as Alts...','slug' => 'extras','parent'=> $patterns['term_id']));
			$extras= term_exists('Extra', $regterm);
			wp_insert_term('Vex',$regterm, array('description'=> 'Vexes are the smallest and weakest of the Extras. They are a single Skill Annex.','slug' => 'vex','parent'=>$extras['term_id']));
			wp_insert_term('Chorus',$regterm, array('description'=> 'Chorus are the most common Extra. They are a single Talent Annex, along with some optional Skills.','slug' => 'chorus','parent'=>$extras['term_id']));
			wp_insert_term('Cast',$regterm, array('description'=> 'Cast extras are Extras that are almost as important as actual Characters. They are based around a Power Annex with some optional Talent and Skill Annexes.','slug' => 'cast','parent'=>$extras['term_id']));
			wp_insert_term('Force-of-Nature',$regterm, array('description'=> 'Force-of-Nature Extras are the most powerful Extras. They are based around a Super-Annex usually with additional Power, Talent and Skill Annexes.','slug' => 'fon','parent'=>$extras['term_id']));
			wp_insert_term('Knot',$regterm, array('description'=> 'Knots are what we build Patterns from. They are the main components of the system, made from knotting together one or more threads: Annexes and Hitches.','slug' => 'knots','parent'=>0));
			$knots = term_exists('Knot', $regterm);
			wp_insert_term('Hitch',$regterm, array('description'=> 'Hitches are how to model Quirks, Flaws, and Woes. The Hitch tells us what is wrong with a Character or Descendant. How are they limited, what can they not do easily.','slug' => 'hitches','parent'=> $knots['term_id']));
			wp_insert_term('Annex',$regterm, array('description'=> 'Annexes are how we model Skills, Talents, Powers and Super-Skills, they are a primary component of Characters and Descendants','slug' => 'annexes','parent'=> $knots['term_id']));
			wp_insert_term('Thread',$regterm, array('description'=> 'Threads are the ephemera of the T13 Game, such as individual Proficiencies, that are nothing more than aspects of the Facets.','slug' => 'threads','parent'=> 0));
			$threads = term_exists('Thread', $regterm);
			wp_insert_term('Proficiency',$regterm, array('description'=> 'Proficiencies are the smallest unit of the T13 Narrative Engine. They are the smallest unit of knowledge or practice of a subject. Proficiencies can point to individual, specific things or broad categories of terms. Both "War" and "AK-47" could be used to handle an actual AK-47, but the specific would count twice (in an actual War both could also count twice, if the Yarn-Teller is very kind).','slug' => 'prof','parent'=> $threads['term_id']));
			wp_insert_term('Note',$regterm, array('description'=> 'Sometimes you need to make notes. Perhaps because you don\'t want to add a Proficiency for some reason.','slug' => 'notes','parent'=> $threads['term_id']));
			wp_insert_term('Diegesis',$regterm, array('description'=> 'Diegesis is also called Diegetic Lore, Flavour Text or Fluff. It is a piece of in-world media or narration. Examples might include quotes, Yarn-Teller Narrations, in-game lore, and planned revelations.','slug' => 'diegesis','parent'=> $threads['term_id']));
			wp_insert_term('Map',$regterm, array('description'=> 'Useful for Yarn-Tellers and Referees to help describe a Location or Ordeal. They are mostly a picture, with some details attached.','slug' => 'maps','parent'=> $threads['term_id']));
		}
		$regterm= strtolower('t13'.static::$taxonomies[1]['Short']);
		if (!term_exists('T13 Core', $regterm)){
			wp_insert_term('Experimental',$regterm, array('description'=> 'Experimental Genre usually means someone hasn\'t decided exactly what Genre this is meant to be, or it does not fit any Genre or the T13 Core' ,'slug' => 'xp','parent'=> 0));
			wp_insert_term('T13 Core',$regterm, array('description'=> 'The Omniversal Core — you can and will encounter Core genre objects stuff in every other genre. The T13 Core defines every Omniversal concept, which include things like life, rocks, planets, atmospheres, even space-time itself.','slug' => 'core','parent'=> 0));
			$parent_term = term_exists( 'T13 Core', $regterm );
			wp_insert_term('Speculative Fiction',$regterm, array('description'=> 'Speculative Fiction is a catch-all term for all "What if?" questions in literature. It is the fiction of thought experiments, and can span genres from fantasy, horror and science-fiction. Speculative fiction often uses metaphors to explore tricky real-world situations, these can be delicate analogies, dripping with satirical insights, or clumsy mockeries that do not bear deep scrutiny.','slug' => 'sf','parent'=> $parent_term['term_id']));
			wp_insert_term('Contemporary',$regterm, array('description'=> 'Contemporary fiction, set in the allegedly real world. Although contemporary settings can vary in "accuracy" significantly while remaining "realistic". Contemporary fiction often explores social situations and may question society without resorting to metaphors.','slug' => 'contemporary','parent'=> $parent_term['term_id']));
			wp_insert_term('Weird Fiction',$regterm, array('description'=> 'Weird Fiction blends contemporary and speculative fiction genres together as it pre-dates the creations of Fantasy, Science-Fiction and Horror, which arose from it, and along side it. It sometimes asks questions, but rarely provides even metaphorical answers, and is more interested in the effect it creates in the audience than the characters. Weird Fiction exists in a world where folkore and ghost stories have some truth to them, but the real truth is more macabre, and far more alien, and much more darkly fantastic than anyone might guess. This is the genre that tries to scare, even perhaps terrify and even horrify, but it also to create a fascination, sense of wonder, and even to invoke reverence where it may. ','slug' => 'weird','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Speculative Fiction', $regterm );
			wp_insert_term('Fantasy',$regterm, array('description'=> 'Fantasy Fiction asks questions such as "What if Magic was real?", "What if monsters existed?" and "What if gods walked amongst us?". Fantasy is always some how different from the real-world, although the laws of biology, chemistry and physics may seem similar at first glance, there is something very different here, like how time flows differently in fairy-land, how gryphons and hippogriffs generate enough lift to fly, and require gold to nest their eggs, and these are often worlds with powerful magic (although it is not always necessary it goes a long way towards explaining how dragons can work).','slug' => 'fantasy','parent'=> $parent_term['term_id']));
			wp_insert_term('Science-Fiction',$regterm, array('description'=> 'Science Fiction asks questions like "What if we could time-travel?", "What if we could travel to the stars?" and "What if we all lived in a computer simulation inside a computer simulation?". Science-Fiction is limited in several ways in how it can answer hte questions it asks. If the Science is being used correctly it should keep reality nearby for easy reference, although often as scientific understanding changes what was once science-fiction can become fantasy or weird fiction as the science diverges from the narrative. Science-Fiction can be awkward and tricky, set the future too close, and your technology may be too difficult to believe in, set it too far in the future annd only our science can ground the story, that is otherwise skipping between stars.','slug' => 'science-fiction','parent'=> $parent_term['term_id']));
			wp_insert_term('Horror',$regterm, array('description'=> 'Horror Fiction asks similar questions to both Fantasy and Science-Fiction, it just presents the answers as much darker, coloured in blood and brooding. Yes, magic exists and is addictive and corrupting. Monsters exists and some people keep them like pets, feeding them their enemies. The gods that walk amongst us do so to feed. Time-travel is possible, but you will change your own history so that you can never return to your own time. The stars, and their peoples, will not be friendly when we reach them. And yes, we are in a simulation, and you do not want to know why, or who runs it. Horror is half of Weird Fiction in terms of the emotions it invokes, although it can invoke fascination, it tries for horror as a priority, although often can only manage fear.','slug' => 'horror','parent'=> $parent_term['term_id']));

			$parent_term = term_exists( 'Contemporary', $regterm );
			wp_insert_term('War',$regterm, array('description'=> 'War stories are usually Adventure stories, although with a strong emphasis on Historical or Contemporary Military actions, with occasional hints of other genres from Science-Fiction or Horror.','slug' => 'war','parent'=> $parent_term['term_id']));
			wp_insert_term('Romance',$regterm, array('description'=> 'Romances were originally tales of adventure, which often had some aspect of the hero getting the girl as a reward for their adventures. Later the romance changed emphasis with the love story, usually from the heroine\'s perspective taking the centre stage against a backdrop that might include adventure or other themes.','slug' => 'romance','parent'=> $parent_term['term_id']));
			wp_insert_term('Adventure',$regterm, array('description'=> 'Adventure stories are the classical romance, although the action and conflict is emphasised more now over the love story that once shared the stage with the adventure. Adventure stories usually feature young, male protagonists who may be explorers, archaeologists, scientists, or most often military men. They are usually much less cerebral than thrillers, and the Stakes are often higher.','slug' => 'adventure','parent'=> $parent_term['term_id']));
			wp_insert_term('Thriller',$regterm, array('description'=> 'Thrillers are stories of spies, crimes and action heroes. Conspiracies, murders and very human monsters are the tropes of these stories.','slug' => 'thriller','parent'=> $parent_term['term_id']));
			wp_insert_term('Historical',$regterm, array('description'=> 'Historical fiction takes place at some point in the past, often by using historical contemporary fiction as a guide. Historical fiction often explores a specific moment in history from some unconsidered perspective.','slug' => 'historical','parent'=> $parent_term['term_id']));
			wp_insert_term('Comedy',$regterm, array('description'=> 'Comedies are contemporary tales intended to amuse. Their narratives and conflicts usually take a back seat to the effect the narration has on the audience. Comedies often rely on confusing situations and events, or ridiculous, foolish Characters to amuse the audience.','slug' => 'comedy','parent'=> $parent_term['term_id']));
			wp_insert_term('Tragedy',$regterm, array('description'=> 'Tragedies are contemporary tales (although often historical) that tell the tale of a fall from grace, or of human suffering, that is usually intended to act as a catharsis for the audience. Tragedies commonly feature themes of flawed characters, mistakes being made and bloody revenge. Otherwise they can often be considered Historical or Romances.','slug' => 'tragedy','parent'=> $parent_term['term_id']));
			wp_insert_term('Soap-Opera',$regterm, array('description'=> 'Soap-operas are domestic contemporary stories based around small events, such as familial and neighbourly conflicts, that usually rely on sentimentality and melodrama. Soap opera stories usually focus on small events, with little to no lasting impact, although the occasional story will have powerful ramifications later.','slug' => 'soap-opera','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Thriller', $regterm );
			wp_insert_term('Spy Thriller',$regterm, array('description'=> 'Thrillers that focus on spy-craft, foreign powers, and secret agents make up a good amount of what most people think of as Thrillers. These are complicated games of deception and counter-intelligence, controlling what the enemy knows and what they think they know.','slug' => 'spy','parent'=> $parent_term['term_id']));
			wp_insert_term('Techno-thriller',$regterm, array('description'=> 'Techno-thrillers are thrillers that focus on technology and details, generally. They usually like to get their facts right, whether about computers, genetics, forensics, martial arts, or military specs, but on occasion wander into Science-Fiction, such as anti-matter bombs or too advanced artificial intelligence. Techno-Thrillers can also become Spy-fi if the spy gadgets get too science-fiction.','slug' => 'techno','parent'=> $parent_term['term_id']));
			wp_insert_term('Crime Thriller',$regterm, array('description'=> 'The Crime Thriller is probably the oldest and most famous of the Crime stories, crime thrillers are a large genre with a number of sub-genres of their own, but all focus on crime and criminal enterprises, the law enforcement who try to catch them, and the lawyers that try to defend and prosecute them.','slug' => 'crime','parent'=> $parent_term['term_id']));
			wp_insert_term('Medical Thriller',$regterm, array('description'=> 'Medical thrillers are sometimes a Techno-thriller set in a hospital, other times they are more like detective novels with the doctor hunting down the pathogen killer. Then there are stories about doctors operating in terrible conditions, such as during a pandemic or war. Medical thrillers, rather like medics themselves can often have a dark and especially macabre humour about themselves.','slug' => 'medical','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Crime Thriller', $regterm );
			wp_insert_term('Detective',$regterm, array('description'=> 'Detective stories focus on the detective, be they a hard-boiled private eye, a consulting detective, or a nosy great Aunt. The crime is usually murder, although occasionally the Murder is part of a larger criminal conspiracy.','slug' => 'detective','parent'=> $parent_term['term_id']));
			wp_insert_term('Murder Mystery',$regterm, array('description'=> 'Murder Mysteries are related to the Detective stories, but with a slightly different focus. In them the emphasis is upon the complex mysteries of the murder, "Who did this thing?", "Why did they do it?", and in the case of locked room mysteries, "How did they do that?".','slug' => 'murder-mystery','parent'=> $parent_term['term_id']));
			wp_insert_term('Hardboiled',$regterm, array('description'=> 'The Hard-boiled detective story is a detective story that places less emphasis on mystery and more emphasis on suspense and action. The mysteries in Hard Boiled stories tend to be simpler, less psychological, and the story tends to play out more as an adventure, with fist and gun fights, as well as a lot of hard drinking and gruff characterisation.','slug' => 'hardboiled','parent'=> $parent_term['term_id']));
			wp_insert_term('Caper',$regterm, array('description'=> 'Capers are Crime stories that focus on the criminals, and upon the crime they commit. Classic examples of the type include heists, con jobs and stings. Capers are often quite comedic, given the subject matter, and may treat death quite lightly.','slug' => 'caper','parent'=> $parent_term['term_id']));
			wp_insert_term('Courtroom Drama',$regterm, array('description'=> 'Courtroom dramas and Legal thrillers are about the attorneys and evidence, arguments and investigations being played out in a courtroom setting. Courtroom dramas are often very far removed from actual court proceedings, as many authors are not lawyers.','slug' => 'courtroom','parent'=> $parent_term['term_id']));

			$parent_term = term_exists( 'Fantasy', $regterm );

			wp_insert_term('High Fantasy',$regterm, array('description'=> 'High Fantasy is fantasy with epic scope. Magic is strongly present in the world, and can accomplish unbelievable things, but has no value judgement associated, a magician can be good or evil, but is usually powerful. Monsters are present and even common, although the most powerful forms, such as Balrogs, and intelligent, fire-breathing Dragons are usually less common.','slug' => 'high-fantasy','parent'=> $parent_term['term_id']));
			wp_insert_term('Low Fantasy',$regterm, array('description'=> 'Low fantasy is more grounded fantasy, closer to historical fiction than mythology. Monsters are fewer and more scientifically plausible, and magic is rare and low-powered when it is encountered. In low-fantasy you might find a dragon skeleton, but a living dragon is unlikely (unless it is just a large monitor lizard).','slug' => 'low-fantasy','parent'=> $parent_term['term_id']));
			wp_insert_term('Swords and Sorcery',$regterm, array('description'=> 'This is primitive fantasy mixed with cosmic horror. Magic exists, as a remnant of ancient civilisations that acts as a corrupting force upon humans. The heroes are brave, strong warriors and thieves who swing swords, or use bow and arrows, and rarely wear more than leather armour. Villains will be powerful, evil magicians, often with strong metal armour wearing henchmen.','slug' => 'swords-sorcery','parent'=> $parent_term['term_id']));
			wp_insert_term('Dark Fantasy',$regterm, array('description'=> 'This is fantasy with most of the light and hope extracted, the Epic battles are between grey and even darker grey, and most stories are tales of revenge and petty vices, that swerve into horror territory regularly. Magic when it appears in Dark-Fantasy is usually a negative power, held by specific bloodlines, dark gods and demons.','slug' => 'dark-fantasy','parent'=> $parent_term['term_id']));
			wp_insert_term('Portal Fantasy',$regterm, array('description'=> 'Portal Fantasy is a specific form of Fantasy that asks the question, "What if a normal person could explore this Fantasy world". They have a lot of cross=over with Adventures and Romances, but take place in a fantastical world that is often a unique setting rather than a generic medieval Fantasy, such as Oz, Narnia, or Barsoom. Portal Fantasy is often strongly reliant on Quests to carry the narrative.','slug' => 'portal','parent'=> $parent_term['term_id']));
			wp_insert_term('Magic Realism',$regterm, array('description'=> 'Magic Realism is in some ways the opposite of portal fantasy, in that magic "leaks" into the contemporary world. Usually such magical events are low-powered supernatural events.','slug' => 'magic-realism','parent'=> $parent_term['term_id']));

			$parent_term = term_exists( 'Science-Fiction', $regterm );
			wp_insert_term('Sci-Fi',$regterm, array('description'=> 'Sci-Fi is the action version of the more cerebral science-fiction. It is still has spaceships, robots, and aliens, but is a lot more "Pew-Pew" in it\'s story lines and plotting. In Sci-Fi the science is de-emphasised, glossed over with terms like hyperspace, time-machine, and computer.','slug' => 'sci-fi','parent'=> $parent_term['term_id']));
			wp_insert_term('Cyberpunk',$regterm, array('description'=> 'Originally Science fiction set five minutes into the future, a world of cyber upgrades and artificial intelligence, where corporations and nations are pitched in battle for only resources left, people. These days the themes and stories are closer to Grim-Modern.','slug' => 'cyberpunk','parent'=> $parent_term['term_id']));
			wp_insert_term('Steam-punk',$regterm, array('description'=> 'Steam-punk originally blended Cyberpunk with a dash of Fantasy and Horror. It stripped away some of the computers and electricity and replacing it with... Steam, Mad-Science, and maybe a bit of Victorian occultism, it kept the cyber upgrades and robot tropes though.','slug' => 'steam-punk','parent'=> $parent_term['term_id']));
			wp_insert_term('Diesel-punk',$regterm, array('description'=> 'Mad-science with internal combustion. Usually an adventure set in a strange alternate version of the mid-twentieth century. The emphasis is on adventure, engines, engineers, pilots and aeronautics usually.','slug' => 'diesel-punk','parent'=> $parent_term['term_id']));
			wp_insert_term('Atom-punk',$regterm, array('description'=> 'Could also be called Mad-science-fiction. A combination of tropes from dated science-fiction that has since had it\'s science disproved, and all the various Scientific-Romance and Punk genres.','slug' => 'atom-punk','parent'=> $parent_term['term_id']));
			wp_insert_term('Scientific-Romance',$regterm, array('description'=> 'Early European science fiction, when it was created it was the equivalent of the Techno-thriller or Cyberpunk, believably close, but that now seems to be a bizarre mix of Historical, Adventure, and Steam-punk tropes.','slug' => 'sci-rom','parent'=> $parent_term['term_id']));
			wp_insert_term('Science-Fantasy',$regterm, array('description'=> 'Space-Wizards, Space-Princesses, alien warriors... You know the stuff. This blends Fantasy (particularly the Swords and Sorcery style) stories and tropes with Science-Fiction settings, usually.','slug' => 'sci-fantasy','parent'=> $parent_term['term_id']));
			wp_insert_term('Post-Apocalyptic',$regterm, array('description'=> 'Disaster has struck the earth and civilization has collapsed, mostly... Small groups struggle to survive in the face of a world gone mad somehow, as the nature of the apocalypse varies immensely across the genre from environmental collapse, pandemics, blinding meteor storms combined with man-eating plants, or atomic and thermo-nuclear wars. Often the least scientific of the science-fiction sub-genres, as mutants, psychics, and magic often appear too.','slug' => 'apocalypse','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Sci-Fi', $regterm );
			wp_insert_term('Space Opera',$regterm, array('description'=> 'Space Opera is epic sci-fi, the technology of science-fiction is left completely behind for what looks like god-like magical technology that can destroy whole stars let alone planets. Space Opera has a lot of cross-over with Science-Fantasy, although the technology looks like magic, it isn\'t really ,and usually has bigger explosions.','slug' => 'space-opera','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Horror', $regterm );
			wp_insert_term('Paranormal',$regterm, array('description'=> 'Paranormal fiction is a cross-over genre that blends Horror and Fantasy fiction with Contemporary Modern or Historical settings','slug' => 'horror','parent'=> $parent_term['term_id']));
			wp_insert_term('Cosmic Horror',$regterm, array('description'=> 'Cosmic Horror is Horror with super-powerful aliens and their advanced technologies. These Ancient Aliens truly are god-like, immortal beings, humans are at the very best their property, and the human mind will break rather than face the truth...','slug' => 'cosmic-horror','parent'=> $parent_term['term_id']));
		}
		$regterm=strtolower('t13'.static::$taxonomies[2]['Short']);
		if (!term_exists('All Facets', $regterm)){
			wp_insert_term('All Facets', $regterm , array('description'=>'Facets are important to T13 as everything in the Omniverse is created from them.' ,'slug' => 'all','parent'=> 0));
			$parent_term= term_exists('All Facets',$regterm);
			foreach (T13Facets::$facets as $facet){
				wp_insert_term($facet['FacetName'], $regterm , array('description'=>$facet['Description'] ,'slug' => strtolower($facet['FacetInitial']),'parent'=> $parent_term['term_id']));
			}
		}
		$regterm=strtolower('t13'.static::$taxonomies[3]['Short']);
		if (!term_exists('Timeless',$regterm)){
			wp_insert_term('Unknown',$regterm, array('description'=> 'Unknown usually means that this is anachronistic in every time period, or that someone has forgotten to actually decide what Era is is really from.','slug' => 'unknown','parent'=> 0));
			wp_insert_term('Timeless',$regterm, array('description'=> 'Timeless means you can find this in any time periods','slug' => 'timeless','parent'=> 0));
			$parent_term = term_exists( 'Timeless', $regterm );
			wp_insert_term('Modern',$regterm, array('description'=> 'The Modern day is really a broad swathe from the late 20th century to early 21st. Rendered particularly difficult to target precisely as it keeps moving. It is the Information age, Space Age, Digital Age, or Post-modern age depending who you ask.','slug' => 'modern','parent'=> $parent_term['term_id']));
			wp_insert_term('Future',$regterm, array('description'=> 'Any time period that follows the Modern Era is a Future Era.','slug' => 'future','parent'=> $parent_term['term_id']));
			wp_insert_term('Past',$regterm, array('description'=> 'Any time period before the modern day is history.','slug' => 'history','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'History', $regterm );
			wp_insert_term('Pre-history',$regterm, array('description'=> 'Pre-history is all history that pre-dates records. Most of the past falls within this Era.','slug' => 'pre-history','parent'=> $parent_term['term_id']));
			wp_insert_term('Ancient History',$regterm, array('description'=> 'Ancient History ranges from 3600 BC to 500 CE, and covers the major developments of civilization that we still adhere to today. Writing, mathematics and science all owe their existence to records from this time period, be it the Chinese, Greek, Egyptian or Sumerian civilizations. Recorded History does not extend further back than this.','slug' => 'ancient','parent'=> $parent_term['term_id']));
			wp_insert_term('Medieval',$regterm, array('description'=> 'The Middle Ages range from 500 CE to 1500 CE','slug' => 'medieval','parent'=> $parent_term['term_id']));
			wp_insert_term('Cold War',$regterm, array('description'=> 'The Cold War extends from the 1940s to around 1995. It is the age of two super-powers and could also be called the Space Age, due to the development of space exploration technology, as well as nuclear weapons.','slug' => 'cold-war','parent'=> $parent_term['term_id']));
			wp_insert_term('World War II',$regterm, array('description'=> 'World War II Era begins around 1935 with the invasion of Abyssinia by Italy, however it doesn\'t really get going until 1939 (or even 1941 if you\'re American), when Nazi Germany invades Poland. The war lasts until 1945. The period is the most obvious catalyst for the modern age.','slug' => 'ww2','parent'=> $parent_term['term_id']));
			wp_insert_term('Interbellum',$regterm, array('description'=> 'Between the world wars. A bright hopeful time for some countries and in others a dark shadow rises. This is the time of the Great Depression, the New Deal, and the rise of of Dictators. This period is also known as the Golden Age of Heroes, which in some universes means the peak of pulp magazine heroes and in others the emergence of superheroes.','slug' => 'interbellum','parent'=> $parent_term['term_id']));
			wp_insert_term('The Great War',$regterm, array('description'=> 'The Great War begins in 1914 and ends in 1918. It is the first modern mechanised war, which basically means machine guns and tanks exist, and aerial bombardments were possible of civilian populations.','slug' => 'cold-war','parent'=> $parent_term['term_id']));
			wp_insert_term('Edwardian',$regterm, array('description'=> 'The Early Twentieth Century. Called the Progressive Era in America. It was a time of great scientific discovery and social changes that directly leads to the modern day. It could be known as the Electric Age, as early electronics appear.','slug' => 'edwardian','parent'=> $parent_term['term_id']));
			wp_insert_term('Victorian',$regterm, array('description'=> 'The period of the height of the British Empire (1837-1901). Britain was at the world\'s largest superpower, with strong political ties to Russia and Germany. During this period the American Civil War takes place, and western societies undergo the first moves away from true Monarchy and rampant Capitalism towards more Social Democratic systems of governance, including the Suffrage movement in Western Cultures.','slug' => 'victorian','parent'=> $parent_term['term_id']));
			wp_insert_term('Romantic Period',$regterm, array('description'=> 'The Romantic period can be seen as poetic and cultural reaction to the Industrial revolution which is taking place at the same time. It is something of a cultural and literary revolution that influences the early Victorian era (1770-1850) ','slug' => 'romantic','parent'=> $parent_term['term_id']));
			wp_insert_term('Industrial Revolution',$regterm, array('description'=> 'A period of great scientific discovery, characterised by the appearance of modern engineering materials, beginning with cast iron and Steam engine driven machines (from 1760s on). This era has a lot of overlaps with the Victorian era that follows it, and the Enlightenment before it. It is also referred to as the Regency Era in Britain, due to the Hanoverian Regents (also called the Georgian Era)','slug' => 'industrial-revolution','parent'=> $parent_term['term_id']));
			wp_insert_term('Enlightenment',$regterm, array('description'=> 'The Enlightenment or Age of reason begins with the scientific renaissance (1600s), and extends until the French revolutionary period (1776). Western culture develops philosophically, scientifically, and culturally during this period. It is the period of Symphonies and Operas. In Britain it is also known as the Stuart Era (1603-1714) after the Jacobean and Carolean kings. It leads to the English Civil War(s) (1642-1651) and eventually the establishment of a more modern form of Parliamentary democracy.','slug' => 'enlightenment','parent'=> $parent_term['term_id']));
			wp_insert_term('Renaissance',$regterm, array('description'=> 'The Renaissance or Age of Discovery (1400-1600) begins with the exploration by the Portuguese of the West-Coast of Africa. It marks the end of the stagnation of the Middle Ages and the start of Modern Era.  Culturally in Europe this period is known as the Renaissance. In Britain it is referred to as the Tudor period (1485-1603) and the later part is called the Elizabethan Era (1550s-1603). It is the period where modern science is created, extracted by magicians and alchemists from Greek and Roman writings.','slug' => 'renaissance','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Ancient History', $regterm );
			wp_insert_term('Iron-Age',$regterm, array('description'=> 'The Iron-Age is a relatively short period that begins during prehistory and ends with the beginnings of writing in certain areas. Iron-Age settlements in northern Europe continue long after the fall of Rome in the south, as there was no local writing culture except some Runic or Ogham texts that are fragmentary. For this reason we place generic Iron-Age here, contemporary with the Hellenistic, Roman and even some Dark-Age Historical periods.','slug' => 'iron-age','parent'=> $parent_term['term_id']));
			wp_insert_term('Roman',$regterm, array('description'=> 'The Romans represent the end of Antiquity. Their culture arises during the Greek Hellenistic period, and they proceed to conquer much of Europe, with Iron-Age technology that includes early mechanisation and advanced construction techniques that are later lost until the modern age, such as concrete and automatic milling machinery. ','slug' => 'roman','parent'=> $parent_term['term_id']));
			wp_insert_term('Greek',$regterm, array('description'=> 'The Greek civilization arises out of a dark-age following the fall of the Minoan culture around 8000 BCE. It is a transition period when modern civilization, religion, science and philosophy begins, and is considered when European Pre-history becomes history, with the surviving works of actual Greek historians cataloguing events during the period and before. This period is broken into smaller ages, from the Greek Dark Age, through the Classical Period, and into the Post-Alexandrian Hellenistic period. Technologically very advanced the Greeks developed a number of technologies that are still used today, including the crane and lighthouses','slug' => 'greek','parent'=> $parent_term['term_id']));
			wp_insert_term('Egyptian',$regterm, array('description'=> 'The Egyptian Empire grew out of Stone-Age cultures as the desertification of northern Africa created the Sahara and forced the wandering hunter-gatherers to settle around the Nile. They developed metal working, probably as a result with trade with other cultures, as well as local discoveries, and there is evidence of an extensive trade network that eventually included the Minoans, and may have extended to Asia and even the Americas. Egypt bridges the change between Pre-history and history as they developed writing, although much of this knowledge was forgotten until the modern age. At the end of the Neolithic era, the Upper and Lower kingdoms united into the Dynastic Empire, around the time Stone Henge was built in England. Eventually the Egyptian empire is subsumed by the Greek, after the conquering of Alexander the Great, thousands of years after the building of the pyramids.','slug' => 'egyptian','parent'=> $parent_term['term_id']));
			wp_insert_term('Minoan',$regterm, array('description'=> 'The Minoan, or Atlantean culture as it appears now to be, largely pre-dates the Greek period, and were contemporaries of the Pyramid building Pharaohs in Egypt. They represented a peak trade culture that traded across the Mediterranean until their civilization was disrupted by a volcanic eruption that destroyed their capital city and harmed all their major colonies with tsunamis. The technology of the Minoans was highly advanced for the period, perhaps higher than the Egyptians at that time, with strong evidence of indoor plumbing and advanced medicinal practices, that were lost and rediscovered in the Greek period.','slug' => 'minoan','parent'=> $parent_term['term_id']));
			wp_insert_term('Sumerian',$regterm, array('description'=> 'The Sumerian civilization in the middle-east, pre-dates even the Egyptian Dynasties and appears to be the birthplace of civilization, including the development of writing, agriculture and settled living. Sumerian Civilization may represent a hold over from some lost stone-age civilization, or may have had extraterrestrial or time-traveller influences according to some "historians", as they represent a sudden leap in technology and life-style changes that are attributed to gods. The Sumerians themselves began as a stone-age culture, but developed metallurgy and began the bronze-age. The civilization later became or was replaced by the Akkadian and Assyrian empires, around the time the Giza pyramids were constructed.','slug' => 'sumerians','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Pre-history', $regterm );
			wp_insert_term('Bronze-Age',$regterm, array('description'=> 'The Bronze Age represents the end of human pre-history. Several Bronze Age civilizations are considered Ancient History rather than Pre-History as they developed writing during this period. Earliest recorded Sword and Chariot technologies come from this period, with some evidence of long-distance trade across the landmasses and oceans.','slug' => 'bronze-age','parent'=> $parent_term['term_id']));
			wp_insert_term('Ice Age',$regterm, array('description'=> 'Earth has had many Ice-Ages during the Billions of years of Pre-History, these are periods of strong ice accumulation, which have even reached the Equator during the early Earth. Normally we concern ourselves with the latest Ice-Age, or Younger Dryas when nomadic human (and related hominid) tribes spread across the globe. Technically, this age overlaps with the Stone-Age significantly, and falls within the larger Pleistocene.','slug' => 'ice-age','parent'=> $parent_term['term_id']));
			wp_insert_term('Stone Age',$regterm, array('description'=> 'The Stone-Age is back when we were all cavemen, before we officially invented houses and living in cities (although we may have built giant stone temples, we\'re a little uncertain on that). Rather like now, the height of technology was silicon based.','slug' => 'stone-age','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Stone-Age', $regterm );
			wp_insert_term('Mesolithic',$regterm, array('description'=> 'The Mesolithic is second stone age of humanity, also called the Middle Stone Age. Stone technology is more advanced, with evidence of spear, axe and arrow technology. There is good evidence of textiles, including weaving and pottery and primitive farming technologies, as the Mesolithic follows the end of the Ice-Age. There is some evidence of stone buildings, although many coastal locations are flooded through Europe and Asia, causing a semi-dark-age of cultural collapses. Burial Mounds are common for cultural leaders. Large animal hunting appears reduced, with more emphasis on gathering, this may be due to extinctions and range restrictions of ice-age animals, or represent a cultural change, as animal husbandry also begins during this period.','slug' => 'mesolithic','parent'=> $parent_term['term_id']));
			wp_insert_term('Neolithic',$regterm, array('description'=> 'The Neolithic or New Stone Age represents the peak of stone-age technology. Stone and mud-brick buildings are common and the first cities are usually considered to begin in this age with the widespread adoption of farming technologies. Stone temples and underground excavations are constructed during the Neolithic, with the oldest confirmed construction at Gobekli Tepe around 10,000 BCE. Animal Husbandry, Farming, Pottery and weaving technologies are quite advanced. In the Neolithic metal working and mettallurgy begin, with gold, silver and copper working in the late Neolithic.','slug' => 'neolithic','parent'=> $parent_term['term_id']));
			wp_insert_term('Paleolithic',$regterm, array('description'=> 'The Paleolithc is first stone age of humanity, also called the Old Stone Age. Technology is limited to primitive stone shaping, although probably antler and wood shaping also occurred, as well as primitive textile technologies and fire-starting. Humans and human like hominids are spreading across the globe slowly, as hunter-gatherers.','slug' => 'paleolithic','parent'=> $parent_term['term_id']));
			wp_insert_term('Pleistocene',$regterm, array('description'=> 'The Pleistocene represents the period of time from 2.5 million years ago until the end of the last ice-age. It is characterised by a number of ice-ages and cataclysmic volcanic eruptions that caused a number of animal extinctions (including the almost extinction of all hominid species). Human evolution is generally considered to have taken place during this period, although some evidence of early tool using apes has been found.','slug' => 'pleistocene','parent'=> $parent_term['term_id']));
			wp_insert_term('Cenozoic',$regterm, array('description'=> 'The Cenezoic Era is the terms used to describe the period following the extinction event at the end of of the Mesozoic, 66 Million years ago. It is the period of modern mammalian and avian evolution and domination of the ecosystem. During the Cenozoic mammls and birds evolved from small creatures to mega-fauna, including whales, elephants. Technically, the modern age falls within the Cenozoic Era, although there are good reasons to consider the human altered modern climate as the beginnings of a separate Era.','slug' => 'cenozoic','parent'=> $parent_term['term_id']));
			wp_insert_term('Mesozoic',$regterm, array('description'=> 'The Mesozoic Era is the middle period of life on Earth. Characterised as the Age of the Dinosaurs. We still know comparatively little about this period of Earth\'s history, and in the T13 Core Universe this period included a sentient dinosaur sub-species developed by the Time-Traveller Norridi. The Dinosaivean civilization is later integrated with the Eusaivean Civilization.','slug' => 'mesozoic','parent'=> $parent_term['term_id']));
			wp_insert_term('Paleozoic',$regterm, array('description'=> 'The Paleozoic Era is the period of pre-history when invertebrates first evolved, during this period life moved from only being in the sea to first colonizing land. the first fish, amphibians and tetrapods all evolve during this era. There are numerous periods within the Era, from the Cambrian, Ordovician, Silurian, Carboniferous, and Permian periods, each characterised by some form of development or extinction event of their own.','slug' => 'paleozoic','parent'=> $parent_term['term_id']));
			wp_insert_term('Precambrian',$regterm, array('description'=> 'The Precambrian Era was the first and earliest era of the Earth\'s existence. During this era life first evolved, potentially while the planet was still technically being formed during the heavy bombardment of the Hadean Eon, however we know that life must have existed by the Archaeon Eon, as oxygen liberation began then, leading to the Proterozoic when the first multi-cellular animals evolved. In some universes, such as the Lovecraftian Mythos Universe, this is when numerous alien species first colonized the Earth.','slug' => 'precambrian','parent'=> $parent_term['term_id']));
			$parent_term = term_exists( 'Mesozoic', $regterm );
			wp_insert_term('Cretaceous',$regterm, array('description'=> 'The Cretaceous is that period of Earth\'s history when all the most famous dinosaurs were running about. Dinosaurs had reached their peak, and had even started to degenerate, being replaced by the younger bird sub-species. In the T13 universe, this is the peak of the Dinosaivean culture, when they begin the spread away from Earth in the first migrations into space.','slug' => 'cretaceous','parent'=> $parent_term['term_id']));
			wp_insert_term('Jurassic',$regterm, array('description'=> 'The Jurassic is the period of the age of dinosaurs when the dinosaurs really conquered the Earth. Many of the other giant reptile species went extinct during this period largely due to climatic changes and competition from arising dinosaur species. The first birds evolved from therapod dinosaurs during this period, and the first modern lizards are also from this period. Sometimes during the Jurassic Norridi creates the Dinosaivean culture in the T13 universe.','slug' => 'jurassic','parent'=> $parent_term['term_id']));
			wp_insert_term('Triassic',$regterm, array('description'=> 'The Triassic is that period of Earth\'s history when dinosaurs first evolved and developed, along with early mammals and reptiles. It is believed that numerous early time-traveller settlements were developed in this period by Norridi, that later developed into the local Dinosaivean culture in the T13 Universe.','slug' => 'cretaceous','parent'=> $parent_term['term_id']));


			$parent_term = term_exists( 'Future', $regterm );

			wp_insert_term('20 minutes in the Future',$regterm, array('description'=> 'The near future, which may be somewhat predictable. Computer and Nano-scale technologies develop alongside increasing social unrest and disenfranchisement of the poor. Often the setting of Cyberpunk fiction, this period represent the beginnings of Trans-human people.','slug' => '20-mins-future','parent'=> $parent_term['term_id']));
			wp_insert_term('Singularity',$regterm, array('description'=> 'The Singularity is a looming future event where the rate of technological achievement will exceed our ability to predict it. It is categorised by the creation of the first truly Sentient Artificial Intelligences, which in some scenarios immediately begin destroying, or subjugating, humanity, in others humanity blends with these AIs creating Trans-human species such as Eusaiveans and Cyberwraiths. In still others, humanity controls the AIs, and after some problems, harnesses them to assist humanity.','slug' => 'singularity','parent'=> $parent_term['term_id']));
			wp_insert_term('Apocalypse',$regterm, array('description'=> 'A future environmental, warfare, or runaway-technology-caused apocalypse wipes out most of humanity. Severe environmental damage may wipe as much as 90% of life from the Earth leaving only bacteria in a worst case scenario, usually Apocalypses are actually about the fall of society (rather than all life), and the hopeful (or at least not entirely pessimistic) survival of a small group against this adversity, and the BDSM-leather-clad, occasionally mutant, biker-punks... There\'s a lot of them, for some reason.','slug' => 'apocalypse','parent'=> $parent_term['term_id']));
			wp_insert_term('Egression',$regterm, array('description'=> 'The Egression is the great diaspora of humanity out into the galaxy. It may take the form of colonization, or integration and trade with an already present Galactic Federation of some sort. Humankind (or the AIs that inherit and surpass our culture) move away from Earth and spread across the Stars. It is categorized by huge, space-going vessels known as Colony ships that are often generational vessels, and later by Faster-than-light ships such as Warp drives (Void Runners) and Wormhole drives.','slug' => 'egression','parent'=> $parent_term['term_id']));
			wp_insert_term('Human Space',$regterm, array('description'=> 'The distant future, mankind (or our inheritors) are spread out across the Galaxy in huge social structures with trillions of members. Typically characterised by wars between factions, and with non-conforming Alien species, it is, in most time-lines, a loose alliance, a trade federation, rather than a more rigid single political entity. This flexibility in social systems and mimetic diversity is considered an important factor in its success, although you cannot overlook humanities technology including Trans-human technologies that allow humans to adapt to non-terrestrial environments.','slug' => 'human-space','parent'=> $parent_term['term_id']));
			wp_insert_term('Post-Human Space',$regterm, array('description'=> 'The far future, when our distant descendants have modified themselves, medically, genetically, or evolutionarily so that they are better adapted to their new home-worlds, hybridized with alien species, or shrugged free from biological matter. Humanity is shattered into myriad different species, many of which have no contact with each other due to the size of Post-Human Space. Trade between Post-Human species is often subdued, over-shadowed by ideological disputes between the various groups. From time to time, colonies collapse, or fall back into dark ages and are forgotten, or older lost colonies re-emerge, filled with new vigour, and a desire to right long misremembered wrongs.','slug' => 'post-human','parent'=> $parent_term['term_id']));

		}
		$regterm=strtolower('t13'.static::$taxonomies[4]['Short']);
		if (!term_exists('Development',$regterm)){
			wp_insert_term('Development',$regterm, array('description'=> 'This scope implies the element is under development and not ready to be "published" yet.','slug' => 'dev','parent'=> 0));

			wp_insert_term('Omniversal',$regterm, array('description'=> 'This scope implies the element is available in all universes at all times. The scope is reserved for the most generic things possible (like the system core).','slug' => 'omni','parent'=> 0));
			wp_insert_term('Limited',$regterm, array('description'=> 'This scope implies the element is limited in availability somehow. Limited scope almost always restricts access to the element by Genres and Eras, but there are even stricter limits.','slug' => 'limited','parent'=> 0));
			$parent_term = term_exists( 'Limited', $regterm );
			wp_insert_term('Referee', $regterm, array('description'=>'This scope implies that the element is intended only for Referees, this is Ref-only knowledge, and not to be accessed by any other Players, not even other Yarn-Tellers, usually. This often includes hidden Plots, secrets and specific rules, such as House Rules.','slug'=>'ref', 'parent'=>$parent_term['term_id']));
			wp_insert_term('Multiversal',$regterm, array('description'=> 'This scope implies that the element is available in most universes, it might not be truly Omniversal, but it is pretty generic. The element may still be restricted by Era and Genre.','slug' => 'multi','parent'=> $parent_term['term_id']));
			wp_insert_term('Game',$regterm, array('description'=> 'This scope implies that the element is available in one Game. It is reasonably common to restrict specific things to a single game. The Mechs developed during play in one Game are not necessarily available to other Characters playing in the same Universe.','slug' => 'game','parent'=> $parent_term['term_id']));
			wp_insert_term('Universal',$regterm, array('description'=> 'This scope implies that the element is available within one game Universe. It may also be restricted by Genre, and usually by Era as well. For example, the magic spells used by a Character in one Fantasy universe are often very different to that in another, although some Fantasy Multiverses exist where "Fireball" is always a similar effect.','slug' => 'verse','parent'=> $parent_term['term_id']));
			wp_insert_term('Location',$regterm, array('description'=> 'This scope implies that the element is available in one Location only. It is important to remember that Locations usually have smaller Locations within them that will also have access. Referees can use this to restrict items to a single system, planet, town or even building as they wish. For example, military rank strictly only carries weight within the territory that particular military controls.','slug' => 'location','parent'=> $parent_term['term_id']));
			wp_insert_term('Plot Specific',$regterm, array('description'=> 'This scope implies that the element is available in one Plot. The Plot might be a single Scene or an entire Cycle as required. This can allow a Yarn-Teller to introduce a new faction for a specific story-line, including specific Descendants and Proficiencies, which will not be available beyond that plot. A Character who has played through that Plot may retain these elements, but once lost they may not be repurchased without some re-occurrence of that Plot.','slug' => 'plot','parent'=> $parent_term['term_id']));
			wp_insert_term('Private',$regterm, array('description'=> 'This scope implies the element is private to the creator, and those people they have shared it with. As an example, the secret of a Character\'s real identity may be a secret known only to the Player, the Yarn-Teller, and perhaps the Referee.','slug' => 'private','parent'=> 0));
		}
		$regterm=strtolower('t13'.static::$taxonomies[5]['Short']);
		if (!term_exists('Void',$regterm)){
			foreach(T13Geometry::$geometries as $g=>$geo){
				wp_insert_term($geo['Name'],$regterm, array('description'=>"<span class=\"t13ne-name\"><span class=\"t13ne-geonum\">{$g} {$geo['Geometry']}  </span> <span class=\"t13ne-geoname\"> {$geo['Name']}</span><p class=\"t13ne-description\"><strong>Description: </strong>{$geo['Geometry_Description']}</p><p class=\"t13ne-gain\">{$geo['Chi']}</p><p class=\"t13ne-yang\">{$geo['Yang']}</p><p class=\"t13ne-yin\">{$geo['Yin']}</p><details class=\"t13ne-gift\"><summary><strong>Gift: </strong> {$geo['Gift']}</summary><p class=\"t13ne-description\">{$geo['Gift_Description']}</p></details></span>",'slug' => 'geo'.$geo['Geometry'],'parent'=> 0));
			}
			for ($i=0;$i<12;$i++){
				$key = T13Geometry::getKey($i);
				error_log('Key='.json_encode($key));
				wp_insert_term($key['Key']['Key'],$regterm, array('description'=>$key['Key']['Description'], 'slug'=>'geokey-'.$key['Key']['Syllable'], 'Parent'=>0));
			}
		}
		$regterm=strtolower('t13'.static::$taxonomies[6]['Short']);
		/*if (!term_exists('HitchData',$regterm)){
			wp_insert_term('HitchData',$regterm, array('description'=> 'All Hitches use Hitch Data to store the types of Hitches.','slug' => 'hitchdata','parent'=> 0));
			$parent_term = term_exists( 'HitchData', $regterm );
			foreach(T13Hitches::$hitchTypes as $h=>$typE){
				wp_insert_term($typE['Type'],$regterm, array('description'=>$typE['Description'],'slug' => 'hitchtype'.$h ,'parent'=> $parent_term['term_id']));
			}
			foreach(T13Hitches::$hitchTiers as $h=>$typE){
				wp_insert_term($typE['Tier'],$regterm, array('description'=>$typE['Description'],'slug' => 'hitchtier'.$h ,'parent'=> $parent_term['term_id']));
			}	}*/

		if (!term_exists('DescendantData',$regterm)){

			wp_insert_term('DescendantData',$regterm, array('description'=> 'All Descendants use DescendantData to store additional information.','slug' => 'descdata','parent'=> 0));
			$parent_term = term_exists( 'DescendantData', $regterm );

			foreach(T13Types::$descendantTypes['Raw'] as $pc=>$type){
				$slug ='desctype'.$pc;
				wp_insert_term($type['Type'],$regterm, array('description'=>$type['Description'],'slug' => $slug ,'parent'=> $parent_term['term_id']));
			}
			foreach(T13Types::$descendantTypes['Commonality'] as $pc=>$type){
				$slug = $slug ='desccommon'.$pc;
				wp_insert_term($type['Type'],$regterm, array('description'=>$type['Description'],'slug' => $slug ,'parent'=> $parent_term['term_id']));
			}
			foreach(T13Types::$descendantTypes['Age'] as $pc=>$type){
				 $slug ='descage'.$pc;
				wp_insert_term($type['Type'],$regterm, array('description'=>$type['Description'],'slug' => $slug ,'parent'=> $parent_term['term_id']));
			}
			foreach(T13Types::$descendantTypes['State'] as $pc=>$type){
				$slug ='descstate'.$pc;
				wp_insert_term($type['Type'],$regterm, array('description'=>$type['Description'],'slug' => $slug ,'parent'=> $parent_term['term_id']));
			}
			foreach(T13Types::$descendantSizes as $pc=>$type){
				$slug ='descsize'.$pc;
				wp_insert_term($type['Type'],$regterm, array('description'=>$type['Description'],'slug' => $slug ,'parent'=> $parent_term['term_id']));
			}
		}
		if (!term_exists('AnnexData',$regterm)){

			wp_insert_term('AnnexData',$regterm, array('description'=> 'All Annexes use AnnexData to store additional information.','slug' => 'annexdata','parent'=> 0));
			$parent_term = term_exists( 'AnnexData', $regterm );
			foreach(T13Types::$annexTypes as $pc=>$type){
				$slug ='annextype'.$pc;
				wp_insert_term($type['Type'],$regterm, array('description'=>$type['Description'],'slug' => $slug ,'parent'=> $parent_term['term_id']));
			}
		}
	}
}
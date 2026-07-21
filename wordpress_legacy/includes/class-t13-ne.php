<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */

class T13_Ne {
	protected $loader;
	protected $plugin_name;
	protected $version;
	protected $t13ne_blocks;
	protected $plugin_ajax;
	protected $plugin_post;

	
	public function __construct() {
		//error_log('constructor function');
		if ( defined( 'PLUGIN_NAME_VERSION' ) ) {
			$this->version = PLUGIN_NAME_VERSION;
		} else {
			$this->version = '5.5.5';
		}
		$this->plugin_name = 't13ne';
		$this->load_dependencies();
		$this->set_locale();
		$this->define_Ajax_Engine();
		$this->define_CustomPosts();
		$this->define_admin_hooks();
		$this->define_public_hooks();
		$this->define_Blocks();
	}

	private function load_dependencies() {
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-loader.php';
		//error_log("T13NE: loaded loader");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-i18n.php';
		//error_log("T13NE: loaded i18n");
		//require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-wordchains.php';
		require_once plugin_dir_path( dirname( __FILE__ )) . 'admin/class-t13-ne-admin.php';
		//error_log("T13NE: loaded admin scripts");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-sanitize.php';
		//error_log("T13NE: loaded sanitizer");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-geometry.php';
		//error_log("T13NE: loaded geometry");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-types.php';
		//error_log("T13NE: loaded types");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-elements.php';
		//error_log("T13NE: loaded elements");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-boons.php';
		//error_log("T13NE: loaded boons");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-dice.php';
		//error_log("T13NE: loaded dice");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-sway.php';
		//error_log("T13NE: loaded sway");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-suits.php';
		//error_log("T13NE: loaded card suits");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-facets.php';
		//error_log("T13NE: loaded facets");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-wounds.php';
		//error_log("T13NE: loaded wounds");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-statblock.php';
		//error_log("T13NE: loaded statblocks");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-thresholds.php';
		//error_log("T13NE: loaded thresholds");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-cards.php';
		//error_log("T13NE: loaded cards");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-iching.php';
		//error_log("T13NE: loaded ichings");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-custompost.php';
		//error_log("T13NE: loaded custompost");	
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-proficiencies.php';
		//error_log("T13NE: loaded proficiencies");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-knots.php';
		//error_log("T13NE: loaded knots");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-hitches.php';
		//error_log("T13NE: loaded hitches");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-annexes.php';
		//error_log("T13NE: loaded annexes");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-descendants.php';
		//error_log("T13NE: loaded descendants");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-chars.php';
		//error_log("T13NE: loaded characters");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-conflicts.php';
		//error_log("T13NE: loaded conflicts");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-plots.php';
		//error_log("T13NE: loaded plots");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-games.php';
		//error_log("T13NE: loaded games");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'public/class-t13-ne-public.php';
		//error_log("T13NE: loaded public scripts");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-ajaxengine.php';
		//error_log("T13NE: loaded ajaxengine");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-rules.php';
		//error_log("T13NE: loaded rules");
		require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-blocks.php';
		//error_log("T13NE: loaded blocks");
		

		$this->loader = new T13_Ne_Loader();
		
	}
	private function set_locale() {
		//error_log('setting locale');
		$plugin_i18n = new T13_Ne_i18n();
		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );
	}
	private function define_Blocks(){
		//error_log('defining blocks');
		$this->t13ne_blocks= new T13NE_Blocks();
		$this->t13ne_blocks->init();
		$this->loader->add_action('rest_api_init',$this->t13ne_blocks, 't13ne_register_rest_routes');
		
	}	
	private function define_Ajax_Engine(){
		//error_log('defining Ajax_engine');
		$this->plugin_ajax = new T13_Ne_AjaxEngine();
		$this->loader->add_action('plugins_loaded', $this->plugin_ajax, 'load_ajax');
		$this->loader->add_action( 'wp_enqueue_scripts', $this->plugin_ajax, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $this->plugin_ajax, 'enqueue_scripts' );
		$this->loader->add_action('wp_ajax_T13_ne_ajax_engine', $this->plugin_ajax, 'ajax_engine');
		$this->plugin_ajax->define_database();
		$this->loader->add_action('plugins_loaded', $this->plugin_ajax->ajax_database, 'load_database');
		$this->loader->add_action( 'wp_enqueue_scripts',$this->plugin_ajax->ajax_database, 'enqueue_scripts' );
		$this->plugin_ajax->define_display();
		$this->loader->add_action('plugins_loaded', $this->plugin_ajax->ajax_display, 'load_display');
		$this->loader->add_action( 'wp_enqueue_scripts', $this->plugin_ajax->ajax_display, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $this->plugin_ajax->ajax_display, 'enqueue_scripts' );
	
	}
	private function define_CustomPosts(){
		//error_log('adding Custom Post types');
		$this->plugin_post = new T13_Element_Registrations();
		$this->plugin_post->init();
		$this->loader->add_action('restrict_manage_posts', $this->plugin_post,'t13ne_filter_admin');
		//error_log("T13NE defining custom posts");
		$i=0;
		foreach(array($this->plugin_post) as $plug){
			$this->loader->add_action('plugins_loaded',$plug, 'load_post');
			if ( is_admin() ) {	
				require plugin_dir_path( __FILE__ ) . 'class-t13-ne-post-admin.php';
				$post_type_admin[$i] = new T13_Element_Admin($plug );
				$post_type_admin[$i]->init();
			}
			$i++;
		}
		
	}
	private function define_admin_hooks() {
		////error_log('defining admin hooks');
	
		// Create a new instance of the T13_Ne_Admin class
		$plugin_admin = new T13_Ne_Admin( $this->get_plugin_name(), $this->get_version() );
	
		// Add action hook to enqueue styles on admin pages
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
	
		// Add action hook to enqueue scripts on admin pages
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );
	
		// Add action hook to perform admin initialization tasks
		$this->loader->add_action('admin_init', $plugin_admin, 'T13_admin_init');
	
		// Add action hook to add T13 pages to the admin menu
		$this->loader->add_action( 'admin_menu', $plugin_admin, 'add_T13_pages' );
	
		// Add action hook to modify the admin head section
		$this->loader->add_action( 'admin_head', $plugin_admin, 'welcome_screen_remove_menus' );
	
		
		$this->loader->add_action( 'init', $plugin_admin, 'T13_init' );
	
		// Get the base name of the plugin file
		$plugin_basename = plugin_basename( plugin_dir_path( __DIR__ ) . $this->plugin_name . '.php' );
	
		// Add filter hook to add custom action links to the plugin
		$this->loader->add_filter( 'plugin_action_links_' . $plugin_basename, $plugin_admin, 'add_action_links' );
			
		//error_log('Admin_Hooks set');
	}
	
	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {
		//error_log('setting public_hooks');
		$plugin_public = new T13_Ne_Public( $this->get_plugin_name(), $this->get_version() );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );


	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		//error_log('Run!');
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		//error_log('getting plugin name');
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    T13_Ne_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		//error_log('getting loader');
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		//error_log('getting version');
		return $this->version;
	}

}

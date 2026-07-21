<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/admin
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13_Ne_Admin {
	private $plugin_name;
	private $version;
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version = $version;
	}
	public function enqueue_styles() {
		
		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in T13_Ne_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The T13_Ne_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/t13-ne-admin.css', array(), $this->version, 'all' );

	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	
	public function add_T13_pages() {
		add_dashboard_page( 'Welcome To T13 Narrative Engine','T13 NE','read','T13-NE-dashboard',array($this,'display_welcome_screen'));

		add_menu_page('T13 Narrative Engine','T13 NE','read','t13ne-menu',array($this,'display_welcome_screen'),'dashicons-hammer',6);
		add_submenu_page('t13ne-menu', 'Historical Era', 'Eras', 'manage_options', 'edit-tags.php?taxonomy=t13era');
		add_submenu_page('t13ne-menu', 'Game-Genre', 'Genres', 'manage_options', 'edit-tags.php?taxonomy=t13genre');
		add_submenu_page('t13ne-menu', 'Narrative Scopes', 'Scopes', 'manage_options', 'edit-tags.php?taxonomy=t13scope');
		add_submenu_page('t13ne-menu', 'Facets', 'Facets', 'manage_options', 'edit-tags.php?taxonomy=t13facet');
		add_submenu_page('t13ne-menu', 'T13 Types', 'T13 Types', 'manage_options', 'edit-tags.php?taxonomy=t13type');
		add_submenu_page('t13ne-menu', 'ElementData', 'T13 Data', 'manage_options', 'edit-tags.php?taxonomy=t13data');
		add_options_page( 'T13 Narrative Engine Settings', 'T13 NE', 'manage_options', $this->plugin_name, array($this, 'display_options_page'));
		
	}
	
	public function add_action_links( $links ) {
	    /*
	    *  Documentation : https://codex.wordpress.org/Plugin_API/Filter_Reference/plugin_action_links_(plugin_file_name)
	    */
	     $settings_link = array(
	    '<a href="' . admin_url( 'options-general.php?page=' . $this->plugin_name ) . '">' . __('Settings', $this->plugin_name) . '</a>',
	   );
	  	 $dashboard_link = array(
	    '<a href="' . admin_url( '/index.php?page=t13ne-menu') .'">'.__('T13 Home', $this->plugin_name) . '</a>',
	   );
	   return array_merge(  $settings_link, $dashboard_link, $links );
	}
	
	public function display_welcome_screen(){
		if (isset($GLOBALS["T13NE_Installed"])){
			//
			if ($GLOBALS["T13NE_Installed"]>=2000){
				include_once 'partials/t13-welcome-screen-display.php';
			}else{
				include_once 'partials/t13-installation-screen-display.php';
			}
		}
	}
	
	
	public function enqueue_scripts() {
		
		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/t13-ne-admin.js', array( 'jquery' ), $this->version, false );
		wp_localize_script( $this->plugin_name, 'T13_Ne_AjaxEngine' , array( 'tinonce' => wp_create_nonce('T13_NE_AJAX_Nonce'), 'installpackage'=>$GLOBALS['T13NE_Installed']) );
		

	}
	public function T13_admin_init() {
		$a = session_status();
		if (PHP_SESSION_NONE ===$a){
			if(!session_id()){
				session_start( [
					'read_and_close' => true,
				] );
			}
		}
		if (PHP_SESSION_DISABLED === $a||PHP_SESSION_ACTIVE ===$a){return;}

		$settings = ['gamerules', 'games', 'sessions', 'plots', 'characters', 'descendants', 'proficiencies'];
		foreach($settings as $s=>$set){
			register_setting($this->plugin_name, $this->plugin_name.$set, array('type'=>'boolean', 'description'=>'options', 'value'=>NULL, 'default_value'=>true,'sanitize_callback'=>'validate'));
		}
    	
		session_write_close();	 
 	}
	 public function T13_init() {
		$a = session_status();
		if (PHP_SESSION_NONE ===$a){
			if(!session_id()){
				session_start( [
					'read_and_close' => true,
				] );
			}
		}
		if (PHP_SESSION_DISABLED === $a||PHP_SESSION_ACTIVE ===$a){return;}

    	register_setting($this->plugin_name, 'T13NE_Options', array($this, 'validate'));
		session_write_close();	 
 	}

	public function welcome_screen_remove_menus() {
    		remove_submenu_page( 'index.php', 'T13-dashboard' );
	}
		
	
	public function display_options_page() {
		include_once 'partials/t13-ne-admin-display.php';
	}
	public function validate($input) {
    // All checkboxes inputs 
    $valid = array();
    //Cleanup
    $valid['t13negamerules'] = (isset($input['t13negamerules']) && !empty($input['t13negamerules'])) ? 1 : 0;
    $valid['t13negames'] = (isset($input['t13negames']) && !empty($input['t13negames'])) ? 1: 0;
    $valid['t13nesessions'] = (isset($input['t13nesessions']) && !empty($input['t13nesessions'])) ? 1 : 0;
    $valid['t13neplots'] = (isset($input['t13neplots']) && !empty($input['t13neplots'])) ? 1 : 0;
    $valid['t13necharacters'] = (isset($input['t13necharacters']) && !empty($input['t13necharacters'])) ? 1 : 0;
    $valid['t13nedescendants'] = (isset($input['t13nedescendants']) && !empty($input['t13nedescendants'])) ? 1 : 0;
     $valid['t13neproficiencies'] = (isset($input['t13neproficiencies']) && !empty($input['t13neproficiencies'])) ? 1 : 0;
    return $valid;
 	}
}

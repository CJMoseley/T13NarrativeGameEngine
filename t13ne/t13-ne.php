<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              http://www.cjmoseley.co.uk
 * @since             1.0.0
 * @package           T13_Ne
 *
 * @wordpress-plugin
 * Plugin Name:       T13-NarrativeEngine
 * Plugin URI:        T13-NE
 * Description:       This is the Terminal Thirteen Narrative Engine, it lets you build T13 Narrative Elements and play them (a bit). 
 * Version:           1.0.0
 * Author:            CJMoseley
 * Author URI:        http://www.cjmoseley.co.uk
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       t13-ne
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'T13_Narrative_Engine_VERSION', '1.0.4' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-t13-ne-activator.php
 */
function activate_t13_ne() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-t13-ne-activator.php';
	T13_Ne_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-t13-ne-deactivator.php
 */
function deactivate_t13_ne() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-t13-ne-deactivator.php';
	T13_Ne_Deactivator::deactivate();
}
error_log('setting hooks for activation sna deactivation');
register_activation_hook( __FILE__, 'activate_t13_ne' );
register_deactivation_hook( __FILE__, 'deactivate_t13_ne' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-t13-ne.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_t13_ne() {
	$plugin = new T13_Ne();
	$plugin->run();
}
run_t13_ne();

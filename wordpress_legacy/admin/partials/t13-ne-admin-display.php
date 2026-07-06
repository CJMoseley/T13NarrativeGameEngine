<?php
/**
 * Provide a admin area view for the plugin
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/admin/partials
 */
//Grab all options
//delete_option($this->plugin_name);
$defaults = '{"gamerules":1,"games":1,"sessions":1,"plots":1,"characters":1,"descendants":1,"proficiencies":1}';
$options = get_registered_settings();

//echo(var_dump($options));
// if (is_array($options)) {
//     add_option($this->plugin_name, $default, '', 'yes');
//     $options = (get_option($this->plugin_name,$default));
// }
// echo (json_encode($options));
// t13_Options
$t13_gamerules = $options['t13negamerules']['value'];

//echo (var_dump($t13_gamerules));
$t13_games = $options['t13negames']['value'];
$t13_sessions = $options['t13nesessions']['value'];
$t13_plots = $options['t13neplots']['value'];
$t13_characters = $options['t13necharacters']['value'];
$t13_descendants = $options['t13nedescendants']['value'];
$t13_proficiencies = $options['t13neproficiencies']['value'];
settings_fields('T13NE_Options');
do_settings_sections('T13NE_Options');
$t13_game_installed = $GLOBALS['T13NE_Installed'];
?>
<!-- This file should primarily consist of HTML with a little bit of PHP. -->
<div class="wrap">
    <h2><?php echo esc_html(get_admin_page_title()); ?></h2>
    <img id="T13Logo"/>
    <p>
<?php //echo 'game installed:'. print_r($t13_game_installed); ?>
    <form method="post" name="t13ne_options" action="options.php">
    	 <?php settings_fields('T13NE_Options'); ?>
		<fieldset>
            <legend class="screen-reader-text"><span>Game Engine Installed</span></legend>
            
               <input type="checkbox" id="<?php echo $this->plugin_name;?>gamerules" name="<?php echo $this->plugin_name; ?>gamerules" value="1" <?php checked($t13_gamerules, 1); ?>/><label for="<?php echo $this->plugin_name; ?>gamerules">
                <span><?php esc_attr_e('Game Engine Installation', $this->plugin_name); ?></span>
            </label>
        </fieldset>
<?php if ($t13_game_installed){
?>
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Games</span></legend>
            
                <input type="checkbox" id="<?php echo $this->plugin_name; ?>games" name="<?php echo $this->plugin_name; ?>games" value="1" <?php checked($t13_games, 1); ?>/><label for="<?php echo $this->plugin_name; ?>games">
                <span><?php esc_attr_e('Manage Games', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <!-- remove injected CSS from comments widgets -->
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Sessions</span></legend>
            
                <input type="checkbox" id="<?php echo $this->plugin_name; ?>sessions" name="<?php echo $this->plugin_name; ?>sessions" value="1" <?php checked($t13_sessions, 1); ?>/><label for="<?php echo $this->plugin_name; ?>sessions">
                <span><?php esc_attr_e('Manage Sessions', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <!-- remove injected CSS from gallery -->
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Plot Demons</span></legend>
           
                <input type="checkbox" id="<?php echo $this->plugin_name; ?>plots" name="<?php echo $this->plugin_name; ?>plots" value="1" <?php checked($t13_plots, 1); ?> /> <label for="<?php echo $this->plugin_name; ?>plots">
                <span><?php esc_attr_e('Manage Plot Demons', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <!-- add post,page or product slug class to body class -->
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Characters</span></legend>
            
                <input type="checkbox" id="<?php echo $this->plugin_name;?>characters" name="<?php echo $this->plugin_name; ?>characters" value="1" <?php checked($t13_characters, 1); ?>/><label for="<?php echo $this->plugin_name; ?>characters">
                <span><?php esc_attr_e('Manage Characters', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <fieldset>
            <legend class="screen-reader-text"><span>Manage Descendants</span></legend>
           
                <input type="checkbox" id="<?php echo $this->plugin_name;?>descendants" name="<?php echo $this->plugin_name; ?>descendants" value="1" <?php checked($t13_descendants, 1); ?>/> <label for="<?php echo $this->plugin_name; ?>descendants">
                <span><?php esc_attr_e('Manage Descendants', $this->plugin_name); ?></span>
            </label>
        </fieldset>
<fieldset>
            <legend class="screen-reader-text"><span>Manage Proficiencies</span></legend>
            
                <input type="checkbox" id="<?php echo $this->plugin_name;?>proficiencies" name="<?php echo $this->plugin_name; ?>proficiencies" value="1" <?php checked($t13_proficiencies, 1); ?> /><label for="<?php echo $this->plugin_name; ?>proficiencies">
                <span><?php esc_attr_e('Manage Proficiencies', $this->plugin_name); ?></span>
            </label>
        </fieldset>
        
<?php }else{
	?><p>The system is currently disabled. You must install the Game Engine to make this work. </p> 
	<?php
	}
 submit_button('Save all changes', 'primary','submit', TRUE); ?></form>
</div>
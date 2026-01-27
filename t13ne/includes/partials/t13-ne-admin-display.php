<?php

/**
 * Provide a admin area view for the plugin
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_ne
 * @subpackage T13_ne/admin/partials
 */

 //Grab all options
        $options = get_option($this->plugin_name,1);

        // t13_Options
        $t13_gamerules = $options['gamerules'];
        $t13_games = $options['games'];
        $t13_sessions = $options['sessions'];
        $t13_plots = $options['plots'];
        $t13_characters = $options['characters'];
        $t13_descendants = $options['descendants'];
        $t13_proficiencies = $options['proficiencies']
    ?>

    <?php
        settings_fields($this->plugin_name);
        do_settings_sections($this->plugin_name);
    ?>

<!-- This file should primarily consist of HTML with a little bit of PHP. -->
<div class="wrap">
    <h2><?php echo esc_html(get_admin_page_title()); ?></h2>
    <img id="T13RPGLogo"/>
    <p>

    <form method="post" name="game_options" action="options.php">
	 <?php settings_fields($this->plugin_name); ?>
		<fieldset>
            <legend class="screen-reader-text"><span>Keep Game Engine Installed</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-gamerules">
               <input type="checkbox" id="<?php echo $this->plugin_name;?>-gamerules" name="<?php echo $this->plugin_name; ?>[gamerules]" value="1" <?php checked($t13_gamerules, 1); ?>/>
                <span><?php esc_attr_e('Game Engine Installation', $this->plugin_name); ?></span>
            </label>
        </fieldset>
<?php if ($t13_game_installed){

?>
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Games</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-games">
                <input type="checkbox" id="<?php echo $this->plugin_name; ?>-games" name="<?php echo $this->plugin_name; ?>[games]" value="1" <?php checked($t13_games, 1); ?>/>
                <span><?php esc_attr_e('Manage Games', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <!-- remove injected CSS from comments widgets -->
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Sessions</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-sessions">
                <input type="checkbox" id="<?php echo $this->plugin_name; ?>-sessions" name="<?php echo $this->plugin_name; ?>[sessions]" value="1" <?php checked($t13_sessions, 1); ?>/>
                <span><?php esc_attr_e('Manage Sessions', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <!-- remove injected CSS from gallery -->
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Plot Demons</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-plots">
                <input type="checkbox" id="<?php echo $this->plugin_name; ?>-plots" name="<?php echo $this->plugin_name; ?>[plots]" value="1" <?php checked($t13_plots, 1); ?> />
                <span><?php esc_attr_e('Manage Plot Demons', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <!-- add post,page or product slug class to body class -->
        <fieldset>
            <legend class="screen-reader-text"><span>Manage Characters</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-characters">
                <input type="checkbox" id="<?php echo $this->plugin_name;?>-characters" name="<?php echo $this->plugin_name; ?>[characters]" value="1" <?php checked($t13_characters, 1); ?>/>
                <span><?php esc_attr_e('Manage Characters', $this->plugin_name); ?></span>
            </label>
        </fieldset>

        <fieldset>
            <legend class="screen-reader-text"><span>Manage Descendants</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-descendants">
                <input type="checkbox" id="<?php echo $this->plugin_name;?>-descendants" name="<?php echo $this->plugin_name; ?>[descendants]" value="1" <?php checked($t13_descendants, 1); ?>/>
                <span><?php esc_attr_e('Manage Descendants', $this->plugin_name); ?></span>
            </label>
        </fieldset>
<fieldset>
            <legend class="screen-reader-text"><span>Manage Proficiencies</span></legend>
            <label for="<?php echo $this->plugin_name; ?>-proficiencies">
                <input type="checkbox" id="<?php echo $this->plugin_name;?>-proficiencies" name="<?php echo $this->plugin_name; ?>[proficiencies]" value="1" <?php checked($t13_proficiencies, 1); ?> />
                <span><?php esc_attr_e('Manage Proficiencies', $this->plugin_name); ?></span>
            </label>
        </fieldset>

<?php }else{
	?> <p>The system is currently disabled. You must install the Game Engine to make this work. </p>
	<?php
	}
 submit_button('Save all changes', 'primary','submit', TRUE); ?>

    </form>

</div>
<?php
/**
 * Installation Page
 *
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Rpg
 * @subpackage T13_Rpg/admin/partials
 */

 ?>
  <div class="wrap">
    <h2>Install the T13 RPG Engine</h2>
    <img id="T13RPGLogo"/>
    <p>
	You need to click the button to start installing the full Game Engine. This can take a while.
    </p>
    <form method="post" name="installationForm" id="installationForm" action="options.php">
	 <?php settings_fields($this->plugin_name);
	?>
		<fieldset id="installer" name="installer">
            <legend class="screen-reader-text"><span>Game Engine Installer</span></legend>
            <input type="hidden" id="<?php echo $this->plugin_name;?>-Installer" name="<?php echo $this->plugin_name; ?>-Installer" value="1" />
            <label for="<?php echo $this->plugin_name; ?>-Installer">
                <span><?php esc_attr_e('Game Engine Installation', $this->plugin_name); ?>
                    <div style="width:100%;">
                    <input class="t13progressbar" type="button" id="install" name="install" value="Begin Installation" />
                    </div>
                 </span>
            </label>
                 <div id="bubbleanchor" class="bubbleanchor">
                     <span id="bubbleshere"></span>
                 </div>

        </fieldset>
	</form>
  </div>

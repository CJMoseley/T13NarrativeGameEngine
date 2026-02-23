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

 ?><div class="wrap">
    <h2>Install the T13 Narrative Engine</h2>
    <img id="T13Logo" />
    <p>
	You need to click the button to start installing the full Game Engine. This can take a while. And on some services will fail and may require restarting repeatedly until the engine is installed.
    </p>
    <form method="post" name="installationForm" id="installationForm" action="options.php">
	 <?php settings_fields($this->plugin_name);
	?>
		<fieldset id="installer" name="installer">
            <legend class="screen-reader-text"><span>Game Engine Installer</span></legend>
            <input type="hidden" id="t13installer" name="t13installer" value="1" />
            <div style="width:100%;">
                <input class="t13progressbar" type="button" id="install" name="install" value="Begin Installation" /><br/>
                <label for="install">Click button to begin</label>
            </div>
            <div id="bubbleanchor" class="bubbleanchor">
                <span id="bubbleshere"></span>
            </div>

        </fieldset>
	</form>
    <span><a onclick='resetdb();'>Reset DB</a> or reload and attempt to continue.</span>
  </div>

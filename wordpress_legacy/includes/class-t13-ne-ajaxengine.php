<?php
class T13_Ne_AjaxEngine {
	//This emgine largely deprecated for gutenberg React engine
	protected $message;
	protected $package;
	public $ajax_display;
	public $ajax_database;
	
	
	public function ajax_engine(){
  		if (isset($_REQUEST['request'])){
  			$requestno=$_REQUEST['request'];
  		}
  		if (isset($_REQUEST["ajaxengine"])){
  			$this->package = $_REQUEST["ajaxengine"];
  			$mode=$this->package["mode"];
  			if (isset($this->package['package']['datalevel'])){
  				$DataLevel=$this->package['package']['datalevel'];
  			}
  		} else {wp_send_json_error("Component not requested");die("erk!");}
  		if (isset($_REQUEST["security"])){
	  		$nonce = $_REQUEST["security"];
	  	}else{die("Erk...No Security??? Erk");}
  		if ( wp_verify_nonce( $nonce, 'T13_NE_AJAX_Nonce') ){
	  		if (isset($mode)){
	  			 $start_time = time();
		  		switch ($mode){
		  			case "Install":
		  			wp_send_json_success(array('mode'=>'Installing', "chunk"=>$this->ajax_database->install($this->package), 'timer'=>time()-$start_time));
		  			break; 
		  			case "View":
		  			wp_send_json_success(array('mode'=>'View', 'chunk'=>$this->ajax_display->View($this->ajax_database->getView($this->package), $requestno, $DataLevel ), 'timer'=>time()-$start_time));
		  			break;
		  			case "Refer":
		  			wp_send_json_success(array('mode'=>'Refer', 'chunk'=>$this->ajax_display->Refer($this->ajax_database->getView($this->package), $requestno, $DataLevel ), 'timer'=>time()-$start_time));
		  			break;
		  			case "Change":
		  			wp_send_json_success(array('mode'=>'Change', 'chunk'=>$this->ajax_display->Change($this->ajax_database->makeEdit($this->package), $requestno,$DataLevel), 'timer'=>time()-$start_time));
		  			break;
		  			case "Copy":
		  			wp_send_json_success(array('mode'=>'Copy', 'chunk'=>$this->ajax_display->Copy($this->package), 'timer'=>time()-$start_time));
		  			break;
		  			case "New":
		  			wp_send_json_success(array('mode'=>'New', 'chunk'=>$this->ajax_display->New($this->package), 'timer'=>time()-$start_time));
		  			break;
		  			case "ResetDB":
		  			wp_send_json_success(array('mode'=>'ResetDB', 'chunk'=>$this->ajax_database->dropAll($this->package), 'timer'=>time()-$start_time));
		  			break;
		  			case "Dropdown":
		  			wp_send_json_success(array('mode'=>'Dropdown', 'chunk'=>$this->ajax_display->ShowDropdowns($this->ajax_database->getDropdowns($this->package), $requestno, $DataLevel ), 'timer'=>time()-$start_time));
					default:
					wp_send_json_success(array("mode"=>'End',  "chunk"=>array("script"=>'console.log("finished");'), 'timer'=>time()-$start_time));

				 }
			}  

		}else{
			wp_send_json_error("Died from security failure.");
		}

	}
	public function define_database(){
		require_once plugin_dir_path( dirname(__FILE__)).'includes/class-t13-ne-db.php';
		$this->ajax_database = new T13_Ne_Database();
	}
	public function define_display(){
		require_once plugin_dir_path( dirname(__FILE__)).'includes/class-t13-ne-display.php';
		$this->ajax_display = new T13_Ne_Display();
	}
	public function getInstalled(){
		if (isset($this->ajax_database)){
			return $this->ajax_database->getInstalled();
		}else{
			$this->define_database();
			return $this->ajax_database->getInstalled();
		}		
	}
	public function getAjaxPackage(){
		if (isset($this->package)){
			return $this->package;
		}else{
			return null;
		}
	}
	public function load_ajax(){
		//placeholder triggered on load plugin... Instatiate here.
		require_once plugin_dir_path( dirname(__FILE__)).'includes/class-t13-ne-db.php';
		require_once plugin_dir_path( dirname(__FILE__)).'includes/class-t13-ne-display.php';
		$this->define_database();
		$this->define_display();
		return true;
	}
	public function enqueue_styles(){
		//wp_register_style( 't13ne-style', plugins_url( 't13ne/public/css/t13-ne-public.css' ) );
		//wp_enqueue_style( 't13ne-style' );
	}
	public function enqueue_scripts() {		
		/*wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/t13-ne-admin.js', array( 'jquery' ), $this->version, false );
		
		wp_localize_script( $this->plugin_name, 'T13_Ne_AjaxEngine' , array( 'installpackage'=>$GLOBALS['T13NE_Installed'], 'tinonce' => wp_create_nonce('install_T13_once')) );
*/
	}
	/*public function ajax_installer(){
  		include_once(plugin_dir_path(__FILE__ )).'t13-game-stallation.php';
  		if (isset($_REQUEST["package"])){
  			$this->package = $_REQUEST["package"];
  		}
  		if (isset($_REQUEST["security"])){
	  		$nonce = $_REQUEST["security"];
	  	}
  		//if ( wp_verify_nonce( $nonce, 'install_T13_once' ) ){
	  		if (isset($this->package)){
		  		$this->sett13AjaxHerald($this->package,"Installation of Package".$this->package."Requested");
		  		if (is_admin()){
		  			if (current_user_can( 'activate_plugins' )){		
						wp_send_json_success($ajax_database->database_creation());
				     }else{
				     	
				     	wp_send_json_failure("Not Allowed to Activate!");
				    }
				}else{
					wp_send_json_failure("Must be accessed from Admin area.");
				}
			}else{
				wp_send_json_failure("Failure no package selected.");
			}
		//}else{
			wp_send_json_failure("Failure, security nonce not acccepted.");

		//}

	}*/

	
}
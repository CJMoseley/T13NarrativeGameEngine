<?php
class T13_Ne_Display {
	protected $Creator;

	public function __construct() {
		$this->Creator = array('Creator', 'Member','Founder', 'User');

	}
	private function buildDisplay($pattern, $value, $key, $scheme, $css, $edit, $tooltip, $DataLevel='X', $row=1, $tab=1){
		$ret = $pattern;
		$sc=substr($scheme,0,8);
		$ed=htmlentities($edit);
		$valuen=htmlentities($value);
		if (!isset($DataLevel)){
			$DataLevel=$_REQUEST["ajaxengine"]['package']['datalevel'];
		}
		if ($DataLevel>0){$references="unloaded";}else{$references="loaded";}

		$edor="class=\"t13tool editable {$css}\" data-edit-html=\"{$ed}\" data-tooltip=\"{$tooltip}\" data-level=\"{$DataLevel}\" data-referers=\"{$references}\" data-ova=\"{$valuen}\"";
		$ret= str_replace('class="'.$css.'"', $edor, $ret);
		switch ($sc) {
			case 'BIT':
				if ((bool)$this->contains($key,'Yang')){
					if ($value){
						$ret=str_replace('%'.$key.'%','<span class="yang">&#9866;</span> ', $ret);
					}else{
						$ret=str_replace('%'.$key.'%','<span class="yin">&#9867;</span> ', $ret);
					}
				}else{
					if ($value){
						$ret=str_replace('%'.$key.'%','<span class="tick">&#10004;</span> ', $ret);
					}else{
						$ret=str_replace('%'.$key.'%','<span class="cross">&#10060;</span> ', $ret);
					}
				}
			break;
			default:
				$ret=str_replace('%'.$key.'%', $value, $ret);
			break;

		}

		return $ret;
	}
	private function buildDirectReferences($refs,$DataLevel='Y'){
		$html="";
		foreach ((array)$refs as $ref){
			if (isset($ref->Direct)){
				foreach($ref->Rows as $row){
					$html.='<!-- built Direct Reference //-->'.$this->buildView($ref->Direct->Table, $row, json_decode($ref->Direct->Table->JSchema), FALSE, $DataLevel).'<!-- finished Ref //-->';
				}
			}
		}
		return $html;
	}
	private function buildReferences($refs, $DataLevel='X'){
		$debugs=json_encode($refs);
		$html="<script>var referenceDebug={$debugs}</script>";
		unset($refs['debug']);
		$c=0;

		$h='';
		$loading=array('Please Wait', 'Hold Please', "I'll get to it", 'Give us a minute', 'Patience is a virtue', 'Might be a while', 'Data Unloaded', 'Will Load', 'Still waiting', 'Patience is the companion of wisdom','Are there a lot of these?','How many are left now?', 'Eventually', 'Patience Please', 'Please Wait for this to load', 'Waiting', 'Waiting to load', 'Holding', 'Still on the server', 'Coming', 'Resting', 'Waiting on connection', 'Placeholder Text', "Rome wasn't built in a day", "Rome wasn't loaded in a day", "I hope you're not on mobile", 'This needs to be loaded', 'Will Load', 'Not Yet Loaded', 'Unloaded Data', 'Wait For It', 'Stagnating', 'Erm...', 'We will get this one', 'Time is an illusion', 'Tick Tock', '...', 'ERROR: Data Unloaded.', 'ERROR: Out of Cats', 'ERROR: Data not found yet', "I've run out of ideas", 'Time is a hunk of will be, being sliced into rashers of was', 'Whatever', 'It\'ll get here when it gets here', 'It is out there, somewhere', 'This could be faster, but then you couldn\'t do a lot', 'Sorry it\'s so slow', 'Pending', 'Working on this one', '...', 'Is this another one?', 'And this one?', 'You just keep loading more', 'There\'s probably more to load isn\'t there...', 'Probably not the Last one', 'Sooo Sloooow', 'Awaiting Bandwidth', 'Trying not to kill the Servers.');
		foreach ((array)$refs as $ref){
			if (isset($ref->Direct)){
				if (!$this->contains($ref->Direct->Table->Template,$ref->Table->Tablename)){
					$html.='<div class="direct-reference">'.$this->buildView($ref->Direct->Table, $ref->Direct->Row, json_decode($ref->Direct->Table->JSchema), FALSE, $DataLevel).'</div>';
				}
			}
			if (!$ref->Normal){
				if ((bool)count($ref->Rows)){
					$reference=str_replace('_', ' ', $ref->Table->Tablename);
					$css=strtolower(str_replace('_','-',$ref->Table->Tablename));
					$tooltip=$ref->Table->Tooltip;
					$cou=count($ref->Rows);
					$open =($cou<8)? 'open':'closed';

					if ($DataLevel<2||!$ref->Normal){
						$h .="<li class=\"fromTables\"><details {$open}><summary data-tooltip=\"{$tooltip}\"><strong>$cou {$reference}</strong></summary><ul class=\"{$css}\">";
						$rows=(array)($ref->Rows);
						$accelerate=(int)round(count($refs));
						//$rows=array_unique($rows);
						foreach ($rows as $row){
							$loadmsg=$loading[$this->RNG(0, count($loading)-1)];
							foreach ($row as $k=>$v){
								if ($this->contains($k,'_Id')){
									$rowid=str_replace('.', 'O', $v);
									$encopde=(0+strpos($ref->Table->JSchema, $k));
									$forrow='T'.$rowid.'N'.$encopde.'E'.strlen($k);
									break;
								}
							}
							$rid = 'noIdeaWhatThisShouldLookLikeYet';
							$x="<li><div id=\"{$ref->Table->TableHelp_Id}-{$forrow}-{$DataLevel}\" class=\"reference t13-unloaded \" data-level=\"{$DataLevel}\" data-referers=\"unloaded\" data-riddle=\"{$rid}\">{$loadmsg}</div></li>";
							if (!$this->contains($h,$x)){
								$h.=$x;
								$c++;
							}
						}
						$h.='</ul></li>';
					}
				}
			}
		}
		if((bool)$c && strlen($h)>0){
			$html.= "<hr><div class=\"referencedby\"> <details open><summary><strong>Referenced {$c} Times</strong></summary><ul>";
			$html.=$h;
			$html.='</ul></details></div>';
		}

		return $html;
	}
	private function buildTemplate($templates,$DataLevel,$code){
		$html="<div class=\"template\" id=\"{$code}-template\" data-thisid=\"{$code}\">";
		$dl=$DataLevel;
		//$html.='<code>'.json_encode($templates).'</code>';
		foreach ($templates as $template){
			if (isset($template->Elems)&&(!is_string($template))){
				$elems=$template->Elems;
				$html.='<ul class="template-'.strtolower(str_replace('_', '-', $elems[0]->Elem->Table->Tablename.'">'));
				foreach ($elems as $elem){
					if (isset($elem->Elem->Row)){
						$row=$elem->Elem->Row;
						$tab=$elem->Elem->Table;
						$html.='<li class="template-elem">'.$this->buildView($tab, $row, json_decode($tab->JSchema),!$dl, $dl).'</li>';
						$dl++;
					}else{$html.="<!--Not found //-->";}
				}
				$html.='</ul>';
			} //else{$html.='<code> Tried to add '.json_encode($template). " but failed </code>";}
		}
		$html.='</div>';
		return $html;
	}
	private function buildView($table, $row, $scheme, $top, $DataLevel='X'){
		$ret=$table->DisplayRow;
		$row=(object)$row;
		$ren="{$table->Tablename}_Id";
		$rowid=$row->$ren;
		$ret=str_replace('%level%', (string)$DataLevel+1, $ret);
		$ret=str_replace('%tab-tooltip%', $table->Tooltip, $ret);
		$ret=str_replace('%tab-help%', $table->HelpText, $ret);
		if (isset($table->Container)){
			if (!$top&$DataLevel>0){
				$postid=$row->{$table->Container};
				$link=get_permalink($postid);
				$title=get_the_title($postid);
				return "<a href=\"{$link}\" class=\"container-link\">{$title}</a>";
			}
		}
		if (isset($row->Editable)){
			$editable=$row->Editable;
		}else{
			$editable=current_user_can('edit_plugins');
		}
		$getref[]="<a class=\"getref\" onclick=\"getwithrefs({$table->TableHelp_Id},{$rowid},{$DataLevel}, this);\" title=\"Find more references to this Element\">More</a>";
		if ($editable){
			$edit=" <a class=\"editbutton\" onclick=\"t13Edit({$table->TableHelp_Id},{$rowid},{$DataLevel},this)\">Edit</a> ";
		}else{
			$edit="";
		}
		$reference = 'Thingy';
		$copyedit=" <ul class=\"copy-controls\" id=\"copy-{$table->TableHelp_Id}-{$rowid}-{$DataLevel}\"><li><a onclick=\"copyform({$table->TableHelp_Id},{$rowid},{$DataLevel});\">Copy and Edit this Element</a></li><li><a onclick=\"addnew({$table->TableHelp_Id}, {$rowid}, {$DataLevel});\">Add a new {$reference}</a></li></ul>";

		foreach($row as $key=>$value){
			$DataLevel++;
			if (isset($row->FK)){
				foreach ($row->FK as $fork) {
				$fork=(array)$fork;
					if ($fork['LocalCol']==$key){
						$ed=htmlentities($fork['Edit']);
						if (is_string($value)){str_replace('%s', $value, $ed);}
						if (is_numeric($value)){str_replace('%n', $value, $ed);}
						if (is_float($value)){str_replace('%f', $value, $ed);}
						if (is_a($value, 'DateTime')){str_replace('%dt', $value, $ed);}
						$tooltip=$fork['Tooltip'];

						$loadThisLater="id=\"{$fork['TableId']}-{$fork['ForRow']}-{$DataLevel}\" data-thisid=\"{$fork['TableId']}-{$fork['ForRow']}-{$DataLevel}\" class=\"t13-unloaded t13-unreferenced t13tool editable {$fork['CSS']}\" data-edit-html=\"{$ed}\" data-riddle=\"{$fork['ForId']}\" data-tooltip=\"{$tooltip}\" data-level=\"{$DataLevel}\" ";
						$ret= str_replace('class="'.$fork['CSS'].'"', $loadThisLater, $ret);
					}
				}
			}

			foreach ($scheme as $chem){
				if ($chem->Name==$key){
					$ret = $this->buildDisplay($ret, $value, $key, $chem->Type, $chem->CSS, $chem->Edit, $chem->Tooltip, $DataLevel, $rowid, $table->TableHelp_Id);
				}
			}
		}
		$ret=$getref[0].$ret.$edit;
		if ($this->contains($table->Code,$this->Creator)){
			$reference=str_replace('_', ' ', $table->Tablename);
			//var_dump($table);
			//var_dump($row);
			$ret.=$copyedit;
		}
		return $ret;
	}
	public function Change($data, $requestnumber, $DataLevel){
		$data['Top']=!($DataLevel==0);
		return $this->View($data, $requestnumber, $DataLevel);
	}
	public function New($data,$requestnumber,$DataLevel){
		return T13Types::addElement($data->eltype,$data->name,$data->data,$data->terms,true);
	}
	private function contains($haystack,$needle){
		T13Types::contains($haystack,$needle);
	}
	public function load_display(){
		//placeholder triggered on load plugin... Instatiate here.
		add_shortcode('T13_NE', array($this,'t13ne_shortcode'));
		add_shortcode('T13ne', array($this,'t13ne_shortcode'));
		add_shortcode('T13_ne', array($this,'t13ne_shortcode'));
		add_shortcode('t13ne', array($this,'t13ne_shortcode'));
		add_shortcode('T13NE', array($this,'t13ne_shortcode'));
		add_shortcode('t13_ne', array($this,'t13ne_shortcode'));
		$this->Creator = array('Creator', 'Member','Founder', 'User');
		return true;
	}
	public function enqueue_styles(){
		//wp_register_style( 't13ne-style', plugins_url( 't13ne/public/css/t13-ne-public.css' ) );
		//wp_enqueue_style( 't13ne-style' );

	}
	public function enqueue_scripts() {	}
	public function display_table($tableroes, $header=''){
		$tb='placeholder';
		$ret='<div class="t13ne-tablewrap"><table class="t13-table" id="{$tb}" name="{$tb}">';
		if ($header!=''){
			$ret.='<thead><tr>';
			foreach ($header as $key=>$value){
				$ret.='<td data-key="{$key}">$value</td>';
			}
			$ret.='</tr></thead>';
		}
		$ret.='<tbody>';
		foreach($tableroes as $tablerow){
			$ret.='<tr>';
			foreach($tablerow as $key=>$val){
				$ret.='<td data-key="{$key}">{$val}</td>';
			}
			$ret.='</tr>';
		}
		$ret.='</tbody></table></div>';
		return $ret;
	}

	public function Refer($data, $requestnumber, $DataLevel){
		$html='';
		$html.=$this->buildReferences($data['Referenced'],$DataLevel+1);
		return array('html'=>$html, 'code'=>$data['Code'], 'data'=>$data, 'request'=>$requestnumber, 'reqlevel'=>$DataLevel, 'script'=>'setTimeout(loadNext,2);');
	}
	private function RNG($min = 1, $max = 20, $mod=0) {
	    if (function_exists('random_int')):
	        return random_int($min, $max)+$mod; // more secure
	    elseif (function_exists('mt_rand')):
	        return mt_rand($min, $max)+$mod; // faster
	    endif;
	    return rand($min, $max)+$mod; // old
	}
	public function t13ne_shortcode($atts, $content = null)	{
		//require_once plugin_dir_path( dirname( __FILE__ )) . 'includes/class-t13-ne-boons.php';

		$rethtml='<!-- t13ne-shortcode "'.urlencode(json_encode($atts)).'"// -->';
		if (isset($atts)||isset($content)){
			$at=shortcode_atts( array(
				'alt'=>'#',
				'annex'=>'#',
				'annexes'=>'[]',
				'array'=>'stakes',
				'aspect'=>'Monster',
				'attack'=>'all',
				'boon'=>13,
				'boons'=>'13+13',
				'card'=>-1,
				'cards'=>'all',
				'char'=>'#',
				'conflict'=>false,
				'core'=>'0',
				'cost'=>0,
				'data'=>'null data',
				'desc'=>'#',
				'dice'=>'1d6+1',
				'display'=>'Quest',
				'element' => 1,
				'facet'=>'all',
				'frogsincarpet'=>'Hello Dave.',
				'geo'=>0,
				'geos'=>[0],
				'handsize'=>5,
				'hitch'=>'#',
				'hitches'=>'[]',
				'hboon'=>'10',
				'max'=>26,
				'members'=>'["num_members":"5", "max_character":"mercari"]',
				'min'=>1,
				'mode'=>'full',
				'mods'=>'0',
				'name'=>'Joe Bloggs',
				'names'=>'Joe, Fred',
				'pact'=>'#',
				'personality'=>0,
				'persona'=>0,
				'prof'=>'#',
				'random'=>'facet',
				'resolved'=>0,
				'select'=>'facet',
				'selected'=>0,
				'sides'=>8,
				'size'=>0,
				'spread'=>'cycle',
				'stats'=>'-0:13,13,13,13,13,13,13,13,13,13,13,13:60=12',
				'sub'=>'',
				'suit'=>'all',
				'swaytype'=>'',
				'tarot'=>1,
				'title'=>"",
				'type' => 'null',
				'value' =>1,
				'vsboon'=>27,
				'wound'=>0,
				// ...etc
			), $atts );

			if (isset($at['type'])){
				switch ($at['type']) {
					case 'select':
						$rethtml.=T13Types::selectFromArray($at);
					break;
					case 'addboons':
						$rethtml.='<span class="t13ne-result">Adding Boons'.$at['boons'].' = '.T13Boons::writeFullBoon (T13Boons::addBoons($at['boons'])).'</span>';
						break;
					case 'suit':
						$rethtml .=T13Suits::getSuit($at['suit'], $at['mode']);
						break;
					case 'facet':
						$rethtml .= T13Facets::getFacet($at['facet'], $at['mode']);
						break;
					case 'attack':
						$rethtml.= T13Suits::getAttack($at['attack'], $at['mode']);
						break;
					case 'bookofchanges':
						$rethtml .= T13IChing::bookOfChanges();
						break;
					case 'boontable':
						$rethtml.=T13Boons::boonTable($at['min'],$at['max']);
						break;
					case 'value':
						$rethtml.="(Value:".T13Boons::getBoonValue($at['boon']).')';
						break;
					case 'valuetest':
					case 'testvalue':
					case 'boonvsboon':
						$rethtml.='<!--boonvsboon-->'.T13Boons::boonvsboon($at['boon'],$at['vsboon']);
						break;
					case 'cards':
						$rethtml.=T13Cards::getCard($at['cards'],$at['mode']);
						break;
					case 'draw':
						$rethtml.=T13Cards::drawCards($at['cards'],$at['tarot']);
						break;
					case 'wounds':
						$rethtml.=T13Cards::getWound($at['wound']);
						break;
					case 'roll':
						$rethtml.='Roll ('.$at['dice'].')='.T13Dice::rollDice($at['dice']);
						break;
					case 'prof':
						$rethtml.=T13Proficiencies::displayProf($at['prof']) ;
					break;
					case 'boon':
					case 'boons':
						$rethtml.=T13Boons::writeFullBoon($at['boon']);
					break;
					case 'annex':
						$rethtml.=T13Annexes::displayAnnex($at['annex'],$at['boon'], array('Size'=>$at['size'], 'Pact'=>$at['pact'], 'Members'=>$at['members'], 'Persona'=>$at['persona'],'Core'=>$at['core'], 'Name'=>$at['name'], 'Stats'=>$at['stats'], 'Hitches'=>$at['hitches'], 'Annexes'=>$at['annexes']));
					break;
					case 'hitch':
						$rethtml.=T13Hitches::displayHitch($at['hitch'], $at['hboon'], $at['boon'], $at['char'], $at['resolved']);
					break;
					case 'descendant':
					case 'desc':
						$rethtml.=T13Descendants::displayDescendant($at['desc']);
					break;
					case 'character':
					case 'char':
					case 'alt':
						$rethtml.=T13Chars::displayChar($at['char']);
					break;
					case 'plot':
						$rethtml.="Plot";
					break;
					case 'statblock':
						$rethtml .= T13Statblock::displayStatblock($at['stats'],$at['alt']);
						break;
					 case 'swaytable':
						$rethtml.=T13Sway::swayTable($at['swaytype']);
					break;
					case 'name':
						$geo=T13Geometry::writeGeo($at['name'],true,$at['geo']);
						$rethtml.='<div class="t13ne-name">'.$geo['GeoText'].'</div>';
					break;
					case 'core':
					$rethtml.=T13Facets::displayPersona($at['core']);
					break;
					case 'persona':
					$rethtml.=T13Facets::displayPersona($at['persona']);
					break;
					case 'resolved':
					$rethtml.=T13Facets::displayResolved($at['resolved']);
					break;
					case 'displaytable':
					case 'table':
					case 'tabledisplay':
					$rethtml.=T13Types::tableDisplay($at['array'],$at['sub'], $at['title']);
					break;
					case 'attacktable':
					$rethtml.=T13Suits::attackTable($at['attack']);
					break;
					case 'cardaspect':
					$rethtml.=T13Cards::displayCardAspect($at['aspect'], $at['card']);
					break;
					case 'suittable':
					case 'suitable':
					$rethtml.=T13Suits::suitTable();
					break;
					case 'woundtable':
					$rethtml.=T13Wounds::WoundTable();
					break;
					case 'facemotable':
					$rethtml.=T13Facets::writeEmotions();
					break;
					case 'facetsuitaspect':
					case "facetaspects":
					$rethtml.=T13Facets::writeFacetAspectTable($at['suit'],$at['aspect']);
					break;
					case 'chicosttable':
					$rethtml.=T13Sway::costTable($at['aspect']);
					break;
					case 'cardtable':
					$rethtml.=T13Cards::cardTable($at['aspect'], $at['suit']);
					break;
					case 'random':
					$rethtml.=T13Types::displayRandom($at['random'],$at['aspect']);
					break;
					case 'spread':
					$rethtml .= T13Cards::dealspread($at['spread'], $at['cards'], $at['handsize'], $at['sides']);
					break;
					case 'impressions':
					if (isset($at['geos'])&&$at['geos']!==[0]){
						$geo=$at['geos'];
					}elseif (isset($at['geo'])&&$at['geo']!==0){
						$geo=$at['geo'];
					}else{
						$geo=0;
					}
					$rethtml .= T13Geometry::calculateImpressions($at['names'],$geo,$at['mods']);
					break;
					default:
					$rethtml.= '<span class="caption">' . do_shortcode($content) . '</span>';
					break;
				}
			}


		}else{
			global $post;
			$this->t13_post=$post;
			$post_id= $post->ID;
			$rethtml='';
			$rethtml.='<script>';
			$rethtml.='var containerPost=true;';
			$rethtml.="var postid={$post_id};";
			$rethtml.='</script><div id="bubbleanchor" class="bubbleanchor"><span id="bubbleshere"></span></div><div id="T13Prog" class="t13progressbar">Getting Data...</div><div id="T13_shortcoded-0-0"></div>';
			// this will display our message before the content of the shortcode
		}
		return  do_shortcode($rethtml);
	}
	public function View($data, $requestnumber, $DataLevel){
		$html="";
		if (isset($data['updated'])){
			$html .="<div class=\"updated\" data-update={$data['updated']}><strong>Element Updated</strong></div>";
			$html .=$this->buildView($data['Update']['Table'],$data['Update']['Row'], json_decode($data['Update']['Table']->JSchema), $data['Top'], $DataLevel);
		}
		 if (isset($data['Template'])){
			$html.=$this->buildTemplate($data['Template'], $DataLevel, ltrim($data['Code'],'#'));
			$html.=$this->buildReferences($data['Referenced'],$DataLevel+1);
		 }
		 if ($html==""){
			if (isset($data['Table'])){
				$html.=$this->buildView($data['Table'], $data['Row'], json_decode($data['Table']->JSchema), $data['Top'], $DataLevel);
				//$html.=$this->buildDirectReferences($data['Reffed'],$DataLevel+1);
				//$html.=$this->buildReferences($data['Referenced'],$DataLevel+1);
			}
		 }
		return array('html'=>$html, 'code'=>$data['Code'], 'data'=>$data, 'request'=>$requestnumber, 'reqlevel'=>$DataLevel, 'script'=>'setTimeout(loadNext,2);');
	}
}

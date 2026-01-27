<?php

/**
 * Fired during plugin activation
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0
 *
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 */

/**
 * Fired during plugin activation. Proficiencies
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Proficiencies
{
	//proficiencies are an interesting aside, I think they should be handled as a custom post type, but we need them to be a addable part of other things (as the Annexes for example. so this may not be the best way of handling them. They could be added to the db sepately as I originally intended, but I need to think on this a little... For now we'll try a custom post... so look in custom posts)...
	private static $installed = 0;
	public static $profsArray;
	public static $profUses = array(
		0 => 'ProficiencySlot',
		1 => 'HitchType',
		2 => 'Gnarl',
		3 => 'Trigger',
		4 => 'PTrigger',
		5 => 'Umbral',
		6 => 'Root',
		7 => 'Channel',
		8 => 'Tangle',
		9 => 'Nimbed',
		10 => 'Edge',
		11 => 'Glow',
		12 => 'Success',
	);
	public static function getSomeProfs()
	{
		global $post;
		if ($post) {


			$current = get_current_user_id();
			$auth = array(0, 1, $current);
			//$author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any',$scope='any',$parent='any'
			$terms['Geo'] = T13Types::buildTerms('t13geo', 'Void', $post->ID);
			$terms['Tags'] = get_the_terms($post, 'post_tag');
			$terms['Facet'] = T13Types::buildTerms('t13facet', 'All Facets', $post->ID);
			$terms['Genre'] = T13Types::buildTerms('t13genre', 'T13 Core', $post->ID);
			$terms['Era'] = T13Types::buildTerms('t13era', 'Timeless', $post->ID);
			$terms['Scope'] = T13Types::buildTerms('t13scope', 'Omniversal', $post->ID);
			$terms['Parent'] = $post->ID;
		}
		if (!is_array(self::$profsArray)) {
			$tempArray = T13Elements::getT13Elements('Proficiency', $terms, 'Array', 5, 'OR');
			$temp = array();
			foreach ($tempArray as $key => $val) {
				$temp[] = serialize($val);
			}
			$temp = array_unique($temp);
			$profs = array();
			foreach ($temp as $key => $val) {
				$profs[] = unserialize($val);
			}
			self::$profsArray = $profs;
		}
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $auth,$any,$any,$any,$any,$any, $any, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$geo,$any,$any,$any,$any, $any, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$any,$tags,$any,$any,$any, $any, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$any,$any,$facet,$any,$any, $any, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$any,$any,$any,$genre,$any, $any, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$any,$any,$any,$any,$era, $any, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$any,$any,$any,$any,$any, $scope, $any, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $any,$any,$any,$any,$any,$any, $any, $parent, 'Array', 2);
		//$profsArray+=T13Elements::getT13Elements('Proficiency', $auth,$geo,$tags,$facet,$genre,$era, $scope, $parent, 'Array', 2, 'AND');

		return self::$profsArray;
	}
	public static function getProfs($author = 'any', $geo = 'any', $tags = 'any', $facets = 'any', $genres = 'any', $eras = 'any', $scopes = 'any', $parent = 'any')
	{
		$terms = array();
		//$author='any',$geo='any',$tags='any',$facet='any',$genre='any',$era='any',$scope='any',$parent='any'
		$terms['Geo'] = $geo;
		$terms['Tags'] = $tags;
		$terms['Facet'] = $facets;
		$terms['Genre'] = $genres;
		$terms['Era'] = $eras;
		$terms['Scope'] = $scopes;
		$terms['Parent'] = $parent;
		$terms['Author'] = $author;
		$tempArray = T13Elements::getT13Elements('Proficiency', $terms, 'Array', 5, 'OR');
		$temp = array();
		foreach ($tempArray as $key => $val) {
			$temp[] = serialize($val);
		}
		unset($tempArray);
		$temp = array_unique($temp);
		$profs = array();
		foreach ($temp as $key => $val) {
			$profs[] = unserialize($val);
		}
		unset($temp);
		return $profs;
	}

	static public function displayProfs($author = 'any', $geo = 'any', $tags = 'any', $facets = 'any', $genres = 'any', $eras = 'any', $scopes = 'any', $parent = 'any')
	{
		$profs = self::getProfs($author, $geo, $tags, $facets, $genres, $eras, $scopes, $parent);
		$rethtml .= '<ul class="t13ne-profs">';
		foreach ($profs as $id => $prof) {
			$rethtml .= '<li class="t13ne-prof"><a href="' . get_permalink($id) . '">' . $prof['Type'] . '</a></li>';
		}
		$rethtml .= '</ul>';
		return $rethtml;
	}
	static public function profsFromThresholds($thresholds)
	{
		$profs = [];
		foreach ($thresholds as $threshold) {
			if ($threshold['Direction'] == 'Root') {
				$profs[] = $threshold['ID'];

			}
		}
		return $profs;
	}
	static public function profDetailsText($texts)
	{
		if (!isset($texts[0])) {
			$texts = [$texts];
		}
		if (!isset($texts[0]['Use'])) {
			exit(json_encode($texts));
		}
		$ret = "<details><summary><strong>{$texts[0]['Use']}</strong></summary>";
		foreach ($texts as $text) {
			$ret .= "<div><strong>{$text['Facet']} {$text['Use_Aspect']}</strong></div><div class=\"t13ne-description\">{$text['Use_Text']}</div>";
			if (isset($text['Boon'])) {
				$boon = T13Boons::writeFullBoon($text['Boon']);
				$ret .= "<div class=\"t13ne-boon\"><small>Effective Facet Boon: {$boon}</small></div>";
			}

		}
		return $ret . '</details>';
	}
	static public function profLister($profs, $maxprofs, $hitch = false, $forceUse = '', $alt = 0, $super = false, $gnarls = 3)
	{
		$rethtml = '<div class="t13ne-profs"><ol>';
		$cp = count($profs);
		$profdata = [];
		$nims = ['Free', 'Nimbed', 'Edge', 'Glow', 'Success'];
		//Woes can have max 3 Gnarls but should vary by Tier so is passed in, or specified by 'Use'
		for ($i = 0; $i <= $maxprofs; $i++) {

			if (isset($profs[$i])) {
				if (!isset($profs[$i]['Use'])) {
					if ($forceUse !== '') {
						$profs[$i]['Use'] = $forceUse;
					} else {
						if ($hitch) {
							$prof[$i]['Use'] = 'PTrigger';
							if ($i == 0) {
								if ($maxprofs > 2) {
									$prof[$i]['Use'] = 'HitchType, Gnarl, Trigger';
								} elseif ($cp > $gnarls) {
									$profs[$i]['Use'] = 'PTrigger, HitchType';
								} else {
									$profs[$i]['Use'] = 'HitchType';
								}

							}

							if ($i > 0 && $i <= $gnarls) {
								$profs[$i]['Use'] = 'Gnarl, PTrigger';
							}
							if ($i > $gnarls) {
								$profs[$i]['Use'] = 'PTrigger,Slot';
							}
						} else {
							$nimbedfacet = [];
							switch ($i) {
								case 0:
									$prof[$i]['Use'] = 'Root';
									if ($cp == 3) {
										$prof[$i]['Use'] .= ', Tangle';
									}
									if ($super) {
										$prof[$i]['Use'] .= ', Nimbed, Edge, Glow';
									}
									break;
								case 1:
									$prof[$i]['Use'] = 'Channel';
									if ($super) {
										$prof[$i]['Use'] = 'Channel, Nimbed, Edge, Glow';
									}
									break;
								case 2:
									if ($cp > 3) {
										$prof[$i]['Use'] = 'Tangle';
									} else {
										$prof[$i]['Use'] = 'Umbral';
									}
									break;
								case 3:
									$prof[$i]['Use'] = 'Umbral';
									break;
								case 4:
								case 5:

									$nimbedfacet[$profs[$i]['Facet']] = (isset($nimbedfacet[$profs[$i]['Facet']])) ? ($nimbedfacet[$profs[$i]['Facet']] + 1) : 1;
									$prof[$i]['Use'] = $nims[max($nimbedfacet[$profs[$i]['Facet']], 4)];
									break;
								case 6:
									$prof[$i]['Use'] = 'Umbral';
									break;
								case 7:
								case 8:
								case 9:
									$nimbedfacet[$profs[$i]['Facet']] = (isset($nimbedfacet[$profs[$i]['Facet']])) ? 1 : $nimbedfacet[$profs[$i]['Facet']];
									$prof[$i]['Use'] = $nims[max($nimbedfacet[$profs[$i]['Facet']], 4)];
									break;
								case 10:
									$prof[$i]['Use'] = 'Umbral';
									break;
								case 11:
								case 12:
								case 13:
								case 14:
									$nimbedfacet[$profs[$i]['Facet']] = (isset($nimbedfacet[$profs[$i]['Facet']])) ? 1 : $nimbedfacet[$profs[$i]['Facet']];
									$prof[$i]['Use'] = $nims[max($nimbedfacet[$profs[$i]['Facet']], 4)];
									break;
								default:
									$prof[$i]['Use'] = "Free";
									break;

							}

						}
					}

				}
				$profdata[$i] = T13Proficiencies::displayProfHTML($profs[$i], $alt);
				$rethtml .= '<li>' . $profdata[$i]['HTML'] . '</li>';
				unset($profdata[$i]['HTML']);
			} else {
				$rethtml .= '<li>Empty Slot - Choose a suitable Proficiency. </li>';
			}
		}
		$rethtml .= '</ol></div>';
		return ['HTML' => $rethtml, 'DATA' => $profdata];
	}

	static public function profUses($facets, $uses, $alt = 0)
	{
		$useText = '<div class="t13ne-rules">The Proficiency defines its use as ';
		if (is_string($uses)) {
			$uses = T13Types::arrayify($uses);
		}
		foreach ($uses as $use) {
			$texts = [];
			foreach ($facets as $facet) {
				//var_dump($facet);
				$boon = T13Statblock::getBoonForFacet($facet['FacetIndex'], $alt);
				switch ($use) {
					case 'HitchType':
					case 1:
						$texts[] = ['Use' => 'Hitch Type', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Hitch'], 'Use_Text' => $facet['Hitch_Text'], 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'Gnarl':
					case 2:
						$texts[] = ['Use' => 'Gnarl', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Gnarl'], 'Use_Text' => $facet['Gnarl_Text'], 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'Trigger':
					case 3:
						$texts[] = ['Use' => 'Trigger', 'Facet' => $facet['FacetName'], 'Use_Aspect' => 'Trigger', 'Use_Text' => '<div class="t13ne-description">Trigger Proficiencies describe the circumstances under which the Hitch will Trigger. Larger Hitches will always have more Triggers. It can be sometimes difficult to create a suitable Trigger for the Proficiency. Here are some ideas:<ul><li>Specific Actions: ' . $facet['Action'] . '— ' . $facet['Action_Text'] . '</li><li>Specific Tests: ' . $facet['Test'] . '— ' . $facet['Test_Text'] . '</li><li>Specific Quests: ' . $facet['Quest'] . '— ' . $facet['Quest_Text'] . '</li><li>Specific Ordeals: ' . $facet['Ordeal'] . '— ' . $facet['Ordeal_Text'] . '</li><li>Specific Locations: ' . $facet['Location'] . '— ' . $facet['Location_Text'] . '</li><li>Specific Descendant: ' . $facet['Descendants'] . '— ' . $facet['Descendants_Text'] . '</li><li>Specific Herald: ' . $facet['Herald'] . '— ' . $facet['Herald_Text'] . '</li><li>Specific Tones: ' . $facet['Tone'] . '— ' . $facet['Tone_Text'] . '</li></ul></div>', 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'PTrigger':
					case 4:
						$texts[] = ['Use' => 'Trigger', 'Facet' => $facet['FacetName'], 'Use_Aspect' => 'Potential Trigger', 'Use_Text' => '<div class="t13ne-description">Potential Trigger Proficiencies describe the circumstances under which the Hitch will Trigger (but you haven\'t chosen an actual Trigger yet). Larger Hitches will always have more Triggers. It can be sometimes difficult to create a suitable Trigger for the Proficiency. Here are some ideas:<ul><li>Specific Actions: ' . $facet['Action'] . '— ' . $facet['Action_Text'] . '</li><li>Specific Tests: ' . $facet['Test'] . '— ' . $facet['Test_Text'] . '</li><li>Specific Quests: ' . $facet['Quest'] . '— ' . $facet['Quest_Text'] . '</li><li>Specific Ordeals: ' . $facet['Ordeal'] . '— ' . $facet['Ordeal_Text'] . '</li><li>Specific Locations: ' . $facet['Location'] . '— ' . $facet['Location_Text'] . '</li><li>Specific Descendant: ' . $facet['Descendants'] . '— ' . $facet['Descendants_Text'] . '</li><li>Specific Herald: ' . $facet['Herald'] . '— ' . $facet['Herald_Text'] . '</li><li>Specific Tones: ' . $facet['Tone'] . '— ' . $facet['Tone_Text'] . '</li></ul></div>', 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'Umbral':
					case 5:
						$texts[] = ['Use' => 'Umbral', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Umbral'], 'Use_Text' => $facet['Umbral_Text'], 'Boon' => $boon, 'AddBoon' => true];
						break;
					case 'Root':
					case 6:
						$texts[] = ['Use' => 'Annex Root', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Annex_Root'], 'Use_Text' => $facet['Annex_Root_Text'], 'Boon' => $boon, 'AddBoon' => true];
						break;
					case 'Channel':
					case 7:
						$texts[] = ['Use' => 'Annex Channel', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Annex_Channel'], 'Use_Text' => $facet['Annex_Channel_Text'], 'Boon' => $boon, 'AddBoon' => true];
						break;
					case 'Tangle':
					case 8:
						$texts[] = ['Use' => 'Tangle', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Tangle'], 'Use_Text' => $facet['Tangle_Text'], 'Boon' => $boon, 'AddBoon' => true];

						break;
					case 'Nimbed':
					case 9:
						$texts[] = ['Use' => 'Nimbed', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Nimbed'], 'Use_Text' => $facet['Nimbed_Text'], 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'Edge':
					case 10:
						$texts[] = ['Use' => 'Edge', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Edge'], 'Use_Text' => $facet['Edge_Text'], 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'Glow':
					case 11:
						$texts[] = ['Use' => 'Glow', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Glow'], 'Use_Text' => $facet['Glow_Text'], 'Boon' => $boon, 'AddBoon' => false];
						break;
					case 'Success':
					case 12:
						$texts[] = ['Use' => 'Success', 'Facet' => $facet['FacetName'], 'Use_Aspect' => $facet['Success'], 'Use_Text' => $facet['Success_Text'], 'Boon' => $boon, 'AddBoon' => false];
						break;
					default:
						$texts[] = ['Use' => 'Proficiency Slot', 'Facet' => $facet['FacetName'], 'Use_Aspect' => 'Proficiency Slot', 'Use_Text' => 'The Proficiency stored here can be used to create Annexes during Profiency Crises.', 'Boon' => $boon, 'AddBoon' => false];
						break;
				}
			}

			$useText .= self::profDetailsText($texts);
		}
		return ['HTML' => $useText . '</div>', 'DATA' => $texts];
	}

	static public function displayProfHTML($profdata, $alt = 0)
	{
		//var_dump($profdata);
		if (isset($profdata['ID'])) {
			$profObj = T13Elements::getT13Element('Proficiency', $profdata['ID']);
			$profname = T13Geometry::writeName($profObj['Element']->post_title);
			$description = $profObj['Element']->post_content;
			$date = $profObj['Date'];
			$css = $profObj['CSS'];
			$facet = $profObj['Facet'];
			$header = $profObj['HTML-header'];
			$footer = $profObj['HTML-footer'];
			$prof_id = $profObj['post_is'];
			$earl = $profObj['URL'];
		} else {
			//not installed...
			$name = '';
			$prof_id = '#';
			if (isset($profdata['Name'])) {
				$name = $profdata['Name'];
			} else if (isset($profdata['Prof_Name'])) {
				$name = $profdata['Prof_Name'];
			} else {
				$name = 'Unspecified Proficiency~-~Proficiency has not been specified~-~Error Thread Not Found, Unknown or unspecified Proficiency, Phantom Prof';
			}
			$geo = T13Geometry::writeGeo($name);
			$profname = $geo['GeoText'];
			$description = isset($profdata['Description']) ? $profdata['Description'] : 'This Proficiency has not been specified or created. Basically you shouldn\'t have seen this here ever';
			$datestamp = date_i18n(__('l jS \o\f F Y', 'textdomain'));
			$currentUser = get_current_user_id();
			$user = T13Types::displayUser($currentUser);
			$date = "<small><p class=\"t13ne-postdata\"><span class=\"t13ne-date\">Posted : {$datestamp}.</span></p><p class=\"t13ne-author\"> Created by: {$user}</p></small>";
			$facets = isset($profdata['Facet']) ? T13Types::arrayify($profdata['Facet']) : 'all';
			$facets = T13Facets::getTheseFacets($facets);

			$ftext = '';
			$faceT = '';
			foreach ($facets as $facet) {
				$ftext .= ' t13ne-' . T13Types::csser($facet['FacetName']);
				$faceT .= "<div class=\"t13ne-facet\">[t13ne type=\"facet\" facet=\"{$facet['FacetIndex']}\" mode=\"fancy\" /]</div>";
			}
			$geon = intval($geo['BaseGeoNum']);
			//var_dump($facet);
			$geom = 't13ne-geo-geo' . $geon . (($geon > 9) ? ' t13ne-geo-geo' . ($geon - 9) : '');
			$css = ' t13ne-type-prof ' . $ftext . ' t13ne-genre-xp t13ne-era-unknown ' . $geom . ' t13ne-scope-dev';
			$header = '<!-- wp:t13ne-element --><article class="t13ne-element ' . $css . '"><div class="t13ne-scope-styler"><div class="t13ne-genre-styler"><div class="t13ne-era-styler"><div class="t13ne-facet-styler"><div class="t13ne-tag-styler"><div class="t13ne-cat-styler"><div class="t13ne-geometry-styler"><div class="t13ne-type-styler"><img id="T13Logo" name="T13Logo" />';
			$footer = '</div></div></div></div></div></div></div></div></article>';
			$earl = '#local-proficiency' . md5(json_encode($profdata));
		}
		//var_dump($profdata);
		if (isset($profdata['Use'])) {
			$uses = T13Types::arrayify($profdata['Use']);
			$useText = self::profUses($facets, $uses, $alt);
		} else {
			$useText = self::profUses($facets, 'Free', $alt);
		}

		return [
			'HTML' => "{$header}<section class=\"t13ne-element {$css}\" data-prof-id=\"{$prof_id}\" data-facet=\"{$facet['FacetIndex']}\">
		<details><summary><strong class=\"t13ne-proftitle\">Proficiency: </strong><strong class=\"t13-prof-name\"><a href=\"{$earl}\">{$profname}</a></strong></summary><div class=\"t13ne-postdata\">{$description}</div>{$faceT}{$date}</details>{$useText['HTML']}</section>{$footer}",
			'DATA' => $useText
		];
	}

	static public function displayProf($prof)
	{
		//var_dump($prof);
		//shortcode proficiency display...
		$rethtml = '<!-- Proficiency //-->';

		$profObj = T13Elements::getT13Element('Proficiency', $prof);
		$prof_id = $profObj['post_id'];
		$rethtml .= $profObj['HTML-header'];
		if (isset($profObj['Element'])) {
			if (!T13Types::areWeEditing($prof_id)) {
				//editing
				$rethtml .= "<div class=\"t13ne-proficiency\" data-prof-id=\"{$prof_id}\"><details><summary><strong class=\"t13ne-proftitle\">Proficiency: </strong><strong class=\"t13-prof-name\">{$profObj['Element']->post_title}</strong></summary><div class=\"t13ne-postdata\">{$profObj['Element']->post_content}</div>{$profObj['Date']}</details></div>";
			} else {
				$rethtml .= do_shortcode("<!--prof {$prof_id} -->[t13ne type =\"select\" select=\"profs\" prof=\"{$prof_id}\" /]");

			}
			//$rethtml.=json_encode($profObj);
			return $rethtml . $profObj['HTML-footer'];
		} else {
			return 'ERROR DEBUG::' . json_encode($profObj);
		}
	}

	static public function addProficiency($name, $description, $facets = 0, $genres = 0, $eras = 0, $scopes = 'Development', $publish = false, $parent = 0)
	{

		$data = array('Content' => $description);
		$terms = array();
		if ($facets) {
			$terms['Facet'] = $facets;
		} else {
			die("Proficiencies need a Facet specified.");
		}
		if ($genres) {
			$terms['Genre'] = $genres;
		}
		if ($eras) {
			$terms['Era'] = $eras;
		}
		if ($scopes) {
			$terms['Scope'] = $scopes;
		}
		if (($parent)) {
			$terms['Parent'] = $parent;
		}
		$post_id = T13Elements::addT13Element('Proficiency', $name, $data, $terms, $publish);
		return $post_id;
	}
	static public function tryAddingProfs($names, $specify, $description, $terms, $instal = true)
	{
		$ret = [];
		if (is_array($names)) {
			foreach ($names as $n => $name) {
				$ret[] = self::tryAddingProf($name, $specify[$n], $description[$n], $terms, $instal);
			}
		}
		return $ret;
	}
	static public function tryAddingProf($name, $specify, $description, $terms, $instal = true)
	{
		//checks if a proficiency exists before trying to install it...
		$el = T13Elements::T13ElementExists($name, $specify);
		if ($el) {
			return false;
		} else {
			//error_log("tryAddingProf:: adding Prof");
			if (instal) {
				$GLOBALS['T13NE_Proficiencies_Installed']++;
				return T13Elements::addT13Element('Proficiency', $name, array('Specify' => $specify, 'Content' => $description), $terms, true, true);
			}
			return false;
		}

	}
	static public function installProfs()
	{
		$profargs = array(
			array('Type' => 'Facet', 'Source' => 'FacetName', 'Name' => '', 'Description' => '<div class="t13ne-description"><p>Every Facet has it\'s own Proficiency that you can Specify into more specific Proficiencies when you need them. This one is for [REPLACE_TEXT]. </p></div>', 'Specify' => true),
			array('Type' => 'Incarna', 'Source' => 'Incarna', 'Name' => ' Incarna', 'Description' => '<div class="t13ne-description"><p>This Proficiency covers all Characters and Descendants that have a specific Incarna. Making it useful whenever you are dealing with the Incarna. This one is [REPLACE_TEXT] </p></div>', 'Specify' => false),
			array('Type' => 'Persona', 'Source' => 'Persona', 'Name' => ' Persona', 'Description' => '<div class="t13ne-description"><p>This Proficiency covers all Characters that have a specific Persona. Making it useful whenever you are dealing with the Persona. This Proficiency can also mimic a Persona in a Descendant Master Annex. [REPLACE_TEXT] </p></div>', 'Specify' => false),
			array('Type' => 'Core', 'Source' => 'Core', 'Name' => ' Core', 'Description' => '<div class="t13ne-description"><p>This Proficiency covers all Characters that have a specific Core as part of their Personality Annex. Making it useful whenever you are dealing with the Core. This one is [REPLACE_TEXT] </p></div>', 'Specify' => false),
			array('Type' => 'Attack', 'Source' => 'Attack', 'Name' => ' Attacks', 'Description' => '<div class="t13ne-description"><p>This Proficiency covers a variety of attack in the system. It can be useful for making those attacks or stopping them. This specific Proficiency is for the [REPLACE_TEXT] Attacks.</p></div>', 'Specify' => false),
			array('Type' => 'Wound', 'Source' => 'Attack', 'Name' => ' Wounds', 'Description' => '<div class="t13ne-description"><p>A Proficiency covering everything to do with treating, soaking, creating, or applying one of the systems Wound types. These Proficiencies can be further specified into Fresh, Untreated, Festering, etc. This Proficiency is for the [REPLACE_TEXT] Wounds.</p></div>', 'Specify' => true),
			array('Type' => 'Descendants', 'Source' => 'Descendants', 'Name' => ' Descendants', 'Description' => '<div class="t13ne-description"><p>A proficiency for all Descendants of a certain type. Whether you are using a Descendant, building one, buying one, or have one thrust upon your person, this Proficiency can help. <br/> This Proficiency can be specified to cover specific sub-types of Descendants (such as Locations, Weapons, Armours, etc), within the type of [REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Location', 'Source' => 'Location', 'Name' => ' Locations', 'Description' => '<div class="t13ne-description"><p>A proficiency for all Yonder Descendants (Locations) of a specific sub-type. Whether you are building a Location, buying one, trying  to survive in, or are just stood in one, this Proficiency can help. This Proficiency is usually specified for a specific building such as the Character\'s home or business.</p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Monster', 'Source' => 'Monster', 'Name' => ' Monsters', 'Description' => '<div class="t13ne-description"><p>A proficiency for all monsters with a specific Monster Facet. This Proficiency can help Characters track, hunt, investigate and kill Monsters of this type. Usually, this Proficiency is further specified by the actual name of the monster, such as Vampire, Werewolf, Sasquatch, Wendigo, Orc, Martian, etc. </p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Quest', 'Source' => 'Quest', 'Name' => ' Quests', 'Description' => '<div class="t13ne-description"><p>A Proficiency for all Quests of a specific type. This Proficiency can help Characters set, or complete, a specific type of Quest. Usually these Proficiencies are specified to the actual Quest that is being Tasked. </p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Style', 'Source' => 'Style', 'Name' => ' Styles', 'Description' => '<div class="t13ne-description"><p>A proficiency for particular Ordeal Styles. This Proficiency grants a Character (or Descendant) access to a particular Style Reserve, allowing Sway (in the form of Dice or Cards) to be Prepared into the Reserve. Some Styles are more Specific than others. </p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Tone', 'Source' => 'Tone', 'Name' => ' Tone', 'Description' => '<div class="t13ne-description"><p>A proficiency for a particular Facet Tone. This Proficiency grants a Character (or Descendant) access to a particular Facet Tone. Familiarity with Tones includes broad knowledge of the types of plots and situations that may arise during or because of the Tone:  </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Hitch', 'Source' => 'Hitch', 'Name' => ' Hitches', 'Description' => '<div class="t13ne-description"><p>A Proficiency for all Hitches of a Specific type, which can help people to cope with, or create these types of Hitches. Usually Hitches are specified more.</p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Resolved', 'Source' => 'Resolved_Hitch', 'Name' => ' Resolved Hitch', 'Description' => '<div class="t13ne-description"><p>A Proficiency for all Resolved Hitches of a certain type. It can help Characters to Resolve Hitches or help them act as though they have.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Sway', 'Source' => 'Sway', 'Name' => ' Sway', 'Description' => '<div class="t13ne-description"><p>A Proficiency for using a specific Facet Sway to produce change in the world and the Character themselves sometimes. Facet Sway may be spent due to Umbrals, or may be generated as a Score, and is somewhat inter-changeable with Chi and therefore other forms of Sway.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Failure', 'Source' => 'Failure', 'Name' => ' Failures', 'Description' => '<div class="t13ne-description"><p>A proficiency for a specific type of failure, this can help a Character create or deal with this sort of Failure better when they occur.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Hurdle', 'Source' => 'Hurdle', 'Name' => ' Hurdles', 'Description' => '<div class="t13ne-description"><p>A proficiency for Characters that create or repeatedly encounter a particular Hurdle and learn to get better at it.</p>[REPLACE_TEXT</div>', 'Specify' => false),
			array('Type' => 'Edge', 'Source' => 'Edge', 'Name' => ' Edge', 'Description' => '<div class="t13ne-description"><p>Each Facet has an Edge that it can lend to an Annex or Descendant under certain circumstances. This proficiency allows Characters to create a Descendant with the Edge by storing Sway in the Descendant to create a Trophy (or Monolith or Artefact). </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Glow', 'Source' => 'Glow', 'Name' => ' Glow', 'Description' => '<div class="t13ne-description"><p>Each Facet has a Glow that it can lend to an Annex or Descendant under certain circumstances. This proficiency allows Characters to create a Descendant with the Glow by storing Chi in the Descendant to create a Monolith (or Artefact). </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Action', 'Source' => 'Action', 'Name' => ' Actions', 'Description' => '<div class="t13ne-description"><p>Each Facet has a single Action that it performs best (and it could be argued is the essence of understanding the Facet). This proficiency allows the Character to use this particularly facet tuned action.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Narrative_Moment', 'Source' => 'Narrative_Moment', 'Name' => ' Narrative Moment', 'Description' => '<div class="t13ne-description"><p>This Proficiency defines a specific Narrative Moment that a Yarn-Teller character may take if they were particularly adapt at creating said moments</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Emotion', 'Source' => 'Emotion_Negative', 'Name' => ' Negative Emotional State', 'Description' => '<div class="t13ne-description"><p>One of the negative emotions that a Character may experience. This Proficiency indicates that a Character has a lot of experience with the emotion and can repress or control it somewhat or knows how to induce the emotion in others.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Emotion', 'Source' => 'Emotion_Positive', 'Name' => ' Positive Emotional State', 'Description' => '<div class="t13ne-description"><p>One of the Positive Emotions that a Character may experience. This Proficiency indicates the Character has a lot of experience with this emotion and may be able to suppress it, or knows how to induce the emotion in others.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Success', 'Source' => 'Success', 'Name' => ' Successes', 'Description' => '<div class="t13ne-description"><p>Each Facet can add Success Levels to an action that make the action succeed in a specific manner. Characters with this proficiency are often more likely to be able to create these Success Levels and cope when an opponent has them</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Herald', 'Source' => 'Herald', 'Name' => ' Herald', 'Description' => '<div class="t13ne-description"><p>The Herald is intended to announce the presence of a particular Facet , and is often used to create specific foreshadowing for Tests and Quests, as well as use in Umbrals. Characters may use the Proficiency to indicate a familiarity with the Herald, which may be especially useful for Yarn-Teller Characters. </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Ordeal', 'Source' => 'Ordeal', 'Name' => ' Ordeals', 'Description' => '<div class="t13ne-description"><p>This proficiency covers general ordeals from a specific Facet. Character&#39;s will usually specify the Proficiency for the Ordeal they practice most, such as "Test-of-Faith" or "Crossing-that-Bridge". This particular general Ordeal Proficiency covers: </p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Question', 'Source' => 'Question', 'Name' => ' Questions', 'Description' => '<div class="t13ne-description"><p>A Proficiency for all Questions related to a specific Facet (and usually used during Umbral and Tangle costs). These Questions are all also related to Enigma of course. </p>[REPLACE_TEXT]</div>', 'Specify' => true),
			array('Type' => 'Tangle', 'Source' => 'Tangle', 'Name' => ' Tangles', 'Description' => '<div class="t13ne-description"><p>A Proficiency for dealing with Facet Tangles, that are used to generate costs and limitations for Talents and Powers. </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Umbral', 'Source' => 'Umbral', 'Name' => ' Umbrals', 'Description' => '<div class="t13ne-description"><p>A Proficiency for a Facet Umbrals. This proficiency gives a Character a slight advantage when trying to deal with the Umbral costs or limitations on a Talent or Power. </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Nimbed', 'Source' => 'Nimbed', 'Name' => ' Nimbed', 'Description' => '<div class="t13ne-description"><p>A Proficiency for a Facet Nimbed. Nimbeds add advantages to a Talent or Power. This Proficiency is not intended to be used by Characters directly for normal reasons, but might be useful to a Yarn-Teller or Plot for reasons. </p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Gnarl', 'Source' => 'Gnarl', 'Name' => ' Gnarl', 'Description' => '<div class="t13ne-description"><p>A Proficiency for a Facet Gnarl. Gnarls add additional costs to Triggered Hitches.</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			array('Type' => 'Lore', 'Source' => 'Lore', 'Name' => ' Lore', 'Description' => '<div class="t13ne-description"><p>A proficiency for a specific type of Lore associated with a Character. Lores are a specific type of Descendant, that are used to model information discovered about a Character during this course of a narrative. In this case the specifics of this Lore are as follows:</p>[REPLACE_TEXT]</div>', 'Specify' => false),
			//array('Type'=>'', 'Source'=>'', 'Name'=>' ','Description'=>'<div class="t13ne-description"><p></p>[REPLACE_TEXT]</div>','Specify'=>false),

		);
		$someProficiencies = array(array('Title' => 'Cryptids~-~Sub Type of Skulker Monster Proficiency~-~Cryptid Monsters, Alien Big Cats, Almas, Bigfoots, Bunyips, Chupacabras, Jersey Devil, Kraken, Lake Monsters, Leeds Devil, Living Dinosaurs, Mammoths, Mokele-Mbembe, Mongolian Death Worms, Mothman, Nagas, Nessie, Orang Pendek, Relic Hominids, Sasquatches, Sea-Serpents, Skunk Apes, Tasmanian Tigers, Thunderbirds, Yeren, Yetis, Yowies ', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for a subset of Skulker Monsters. Cryptids are animals or monsters that are denied by normal science. They may be relics, or unique survivors, of extinct species, such as the Coelacanth, or living dinosaurs, or ice age animals, or be beasts described in the native folklore that have never been spotted by scientists, such as the Almasty, Bigfoot or Yeti. Cryptids are by their nature elusive, but they may even have supernatural seeming abilities that make them even more difficult to spot or track, such as being naturally transdimensional, or telepathy.  Usually, this Proficiency is further specified by the actual name of the specific Cryptid, such as Alien Big Cats, Almas, Bigfoots, Bunyips, Chupacabras, the Jersey (Leeds) Devil, Kraken, Lake Monsters, Living Dinosaurs, Mammoths, Mokele-Mbembe, Mongolian Death Worms, Mothman, Nagas, Nessie, Orang Pendek, Relic Hominids, Sasquatches, Sea-Serpents, Skunk Apes, Tasmanian Tigers, Thunderbirds, Yeren, Yetis, or Yowies.</p> <!-- /wp:paragraph --> <!-- wp:heading {"level":3,"className":"t13ne-description"} --> <h3 class="t13ne-description">Monster Cryptid</h3> <!-- /wp:heading --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">The Monster is a Cryptid, which are a subset of Skulker Monsters. Skulkers start with a Monster Pool of Enigma Score. Skulkers may add Enigma Draw cards to their Monster Pool whenever they hide, and if they hide completely for a Chi Extend Duration equal to the Enigma Boon they may add Enigma Score cards to the Monster Pool (e.g. Enigma Boon 12 grants 1 card when they hide, but if the Skulker hides until Dawn / Dusk / Noon or Midnight they may add 4 cards to the Pool). Skulkers must discard half their Monster Pool any time they are spotted or found out. They may add Monster Pool Size Reduced Success Levels to any stealthy or hidden actions or preparations. Skulkers may play Monster Pool cards as Preparation for another’s actions. Although Cryptids can do this, they usually restrict this Preparation to creating fleeing actions for those that spot them.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Enigma', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Robots~-~Robots Proficiency~-~Mechanimals, Mechanical People, Robota, Droids, Drones, Serfware', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for the care, maintenance, building, programming, repairing, and destroying the artificial, usually mechanical, sometimes sentient beings called robots. From remote control drones, to human appearing androids and gynoids, robots can be built from clockwork and gears, or nano-muscle and bio-mechanical components. </p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Robots are T13 Core Genre, because they are found in all genres. Robots are ubiquitous in science-fiction, where they are usually a sentient servitor species, but in the modern day they are more likely to be simply computer controlled tools, performing repetitive menial tasks, in fantasy Robots are often mechanical beings, powered by a combination of magic and clockwork, historically mechanical "robots" are simple devices that repeat a series of actions. The details of the type of Robot varies by genre, era, type and model, and therefore this proficiency is usually specified.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Craft', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Charm~-~Charm Proficiency~-~Charms, Charming, Charisma, Befriend, Charismatic, Debonair, Delightful', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description"> Charm is the quality of having, or presenting, a pleasant, agreeable, front. Charming people may naturally be more tolerant, polite, and friendly, or they may have learned ways of putting people at their ease. There is some aspect of physical attractiveness to charms, but it is more that if you are charming enough people will find you more physically attractive.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Charm can be used to reduce another Character\'s social resistance, allowing charismatic people to persuade, convince and dissuade people by words, or even body language alone. Charisma can be a naturally acquired skill-set, or can also be taught, although it is worth noting that charm is largely cultural, a truly charming person will quickly adopt cultural norms, allowing them to be charming after a few days or weeks of exposure to the new culture.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Awe', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Brave~-~Bravery Proficiency~-~Brave, Bravery, Courage, Courageous, Daring, Fearlessness, Gallantry, Grit, Mettle, Nerves-of-Steel, Valor', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">The quality of the mind, spirit or personality of a person that allows them to face challenges, difficulties, dangers, events and emotions that cause fear, terror or horror, without allowing the fear to control them. Brave people face their fears, feel the anxiety, stage or flight nerves, and do it anyway. Often so well that those observing them may believe they do not feel fear at all.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Bravery is not exactly a resistance to fear, so much as a psychological coping mechanism. It allows one to live with, control and even conquer fears, just as other coping mechanisms can allow someone to conquer their Laments, or even Madnesses.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Awe', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Emotions~-~Emotions Proficiency~-~Attitude(Specify),Attitudes, Aura(Specify), Auras, Character, Disposition, Emotions, Emotion(Specify), Emotional, Empathetic, Empathic, Feeling, Feeling(Specify), Feelings, Mood(Specify), Moods, Sympathetic, Sympathies, Temperament(Specify)', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Emotions are a non-volitional, non-cognitive state of consciousness that powerful influences and affects the person experiencing them. What does that mean? Well, non-volitional means that we don\'t choose our emotional responses, at least not consciously, which is what the non-cognitive bit means. The emotions we feel and express are a result of external stimuli, learnt responses and neuro-chemical releases.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Emotions can be experienced, seen in others and recognised, as well as controlled, unleashed, bottled and worked through by application of this Proficiency. It is essential to many psychic powers, such as empathic abilities, aura reading and many magical techniques. </p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Awe', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Spirits~-~Spirits Proficiency~-~Ka, Cyberwraiths, Spirit(Specify), Spirits, Soul(Specify), Souls, Apparition(Specify), Apparitions, Phantasm(Specify), Phantasms, Phantom(Specify), Phantoms, Poltergeist(Specify), Poltergeists, Shade(Specify), Shades, Shadow(Specify), Shadows, Spectre(Specify), Spectres, Spook(Specify), Spooks, Sprite(Specify), Sprites, Wraith(Specify), Wraiths, Eidolon(Specify), Eidolons, Supernatural Being(Specify), Supernatural beings, Sapient Personality Template(Specify), Sapient Personality Templates, Soulware(Specify), Soulwarez', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">An incorporeal being, usually conscious, sometimes supernatural, that exists separate from material existence, although it can usually affect change on material existence by a living, kinetic, force that spirits supply to biological entities to keep them alive, but can be used to psycho-kinetically move material objects such as furniture and lighter objects (assuming around human strength). Spirits are alleged to exist in a separate non-corporeal world (which in some universes is an extension of a Nephilim cradle known as the Ethereal holographic plane or spirit world).</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Depending upon Genre, Era and varying by local Multiverse, spirits are either living souls, the recorded personalities of the dead (stored in the Nephilim cradle), or multidimensional beings that lack corporeal form. In some places and times they are considered superstition, in others high science, and for the Bulm&aumlaut;s they are considered sacred, and tasty. The Increated though have the most use for Spirits, enslaving them to generate Sway to create and empower the Increated\'s actions (including granting the Increated spirit like powers). In fact the Increated use souls as food, masonry, plant food, currency and deciding whether to shorten their names.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Awe', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Materials~-~Materials Proficiency~-~Material(Specify), Matter(Specify), Stuff(Specify), Things(Specify), Physical, Earthly, Substance(Specify), Substantial, Corporeal', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for handling, cataloguing, creating and working with material, in the sense of physical matter, made from atoms and imbued with the information we call form. Usually specified into a specialised knowledge of a particular material (such as Sandstone, Polyurethane, or Concrete) depending upon the setting and genre. It is similar to other proficiencies such as "Metals" which are a form of Material.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A single generic, to be specified Proficiency for all physical matter, although generally this one is meant to be focused on non-metallic, non-organic solids, but they can be specified beneath it, too.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Burden', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Storage~-~Storage Proficiency~-~Cache(Specify), Caches, Store(Specify), Stores, Bank(Specify), Banks, Storeroom(Specify), Storerooms, Cargo(Specify), Cargoes, Stockpile(Specify), Stockpiles, Repository(Specify), Repositories, Depot(Specify), Depots, Arsenal(Specify), Arsenals, Warehouse(Specify), Warehouses, Warehousing, Magazine(Specify), Magazines, Stash(Specify), Stashes, Reserve(Specify), Reserves, Stock(Specify), Stocks, Collection(Specify), Collections, Pile(Specify), Piles, Gathering(Specify), Gatherings, Harvest(Specify), Harvesting(Specify), Harvests', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for the act of storage, placing reserves or large amounts of a physical substance somewhere safe, so you will have it available later. Having plenty of something is a very Burden thing, caches of equipment, stocks of food, ammunition cases, all of that stuff. Even money can be stockpiled, both in the form of a treasure-trove, but in a bank account. This proficiency can cover collections, gatherings, stockpiles and a number of other things.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Gathering together resources is what Burden in all about. Owning more than you can possibly carry is a fairly advanced concept in social development, and leads to all sorts of complications in society, such as concepts of legal ownership, leadership, kings and lots of other nonsense. But it begins with keeping food for later, an act even insects can do.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Burden', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Dig~-~Dig Proficiency~-~Bank, Bore, Bulldoze, Burrow, Burrowing, Caving, Digging, Drill, Drilling, Excavation, Excavating, Earthworks, Mining, Mine(Specify), Shovel(Specify), Sift(Specify), Tunnel, Tunnelling, Worm', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for moving and travelling through earth. Many animals and jobs rely upon this Burden proficiency, that is often specified for the material being dug or sought by digging.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Digging is a simple activity, that is considered hard work, moving huge amounts of earth to create a tunnel is a massive undertaking, but relies on a single proficiency at the end of the day, as common to Boring machines as maggots.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Burden', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Tools~-~Tools Proficiency~-~Tool(Specify), Hammers, Crowbars, Screwdrivers, Spanners, Wrenches, Saws, Scrapers, Axes, Knives, Cutting Tool(Specify), Utensils, Utensil(Specify), Implement(Specify), Device(Specify), Gadget(Specify), Devices, Gadgets, Implements, Rasps, Files, Rakes, Shovels, Spades, Picks, Pickaxes, Pliers, Shears, Scissors, Bolt-cutters, Staplers', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A Tool is a device that helps you do some work. Such things are the product of craft and the child of craft. Tools are used to make more tools, more complex tools, from all sorts of materials. A lot of tool use is about knowing what tool is for what job and how best to use it for that job is usually obvious when you have the correct tool. Some jobs require specialised tools, but even the most specialised tools are ultimately descended from this Proficiency.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">It all begins with banging rocks together, and discovering principles like the wedge, the lever, the helix, and an understanding of the construction of the physical world that allows abstract principles to imbue matter with a specific form that enables them to help you perform that job. This is knowledge, imagination, and physical principles working together, which is what Craft is all about. </p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Craft', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Jobs~-~Jobs Proficiency~-~Work(Specify), Working, Task(Specify), Grind(Specify), Vocation(Specify), Job(Specify), Profession(Specify), Employment(Specify), Craft(Specify), Smith(Specify), Build(Specify), Make(Specify), Occupation(Specify)', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A job is a task or activity that one does to improve your chances of survival. Usually you are paid for the jobs you do, but different systems exist in different societies and settings. In general though a job usually involves one of the following, creation, maintenance, speculation on, curating, storing, or trading of a Tool, Device, or Resource, usually with a limited specialisation (a lock smith makes locks, keys and padlocks, a blacksmith works solely with iron, a goldsmith usually makes jewellery from gold).</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A job is everything from a household task to a multi-national project leader. And this is the Proficiency for all that. Any Marketable Skill is a Occupation, a marketable Talent is usually a Vocation, and Professions are often the realm of Marketable Powers, although there is crossover between the latter two.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Craft', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Machines~-~Machines Proficiency~-~Machines, Device(Specific) Vehicles, Craft, Boats, Canoes, Rafts, Ships, Carriages, Cars, Wagons, Trucks, Machine(Specify), Vehicle(Specify), Craft(Specify), Boat(Specific), Ship(Specific)', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for advanced Tools, which we call machines. Machines usually have a complex design (although some are very basic) which allows them to perform a complex task, such as measuring, detecting, moving, or creating something else. The earliest of these machines were probably boats, which allowed people to float on water, and with sails and oars, to travel great distances with significant speed.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description"> </p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Craft', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Mastery~-~Mastery Proficiency~-~Authorities, Authority(Specify), Command(Specify), Commands, Control(Specify), Controls, Direct(Specify), Directs, Discipline(Specify), Dominate(Specific), Domination, Govern(Specify), Government, Guide(Specify), Guidance, Lead(Specify), Leading, Leadership, Manage(Specify), Management, Manipulate(Specify), Manipulation, Mastery(Specify), Masterful, Rule(Specify), Ruling, Subjugate(Specify), Subjugation', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency to show proficiency... When you have control of something, when you can guide, or lead it where you will, when you can manipulate or command others, or have sufficient command over yourself then you have achieved Mastery, and Dominion over a domain.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Mastery is about control, self-control, and control of others. Mastery is the state of being a master, which usually means being the one in control, the leader, ruler or Management. Mastery can also mean understanding what something is about completely, even what those tiny controls do on that machine, because machine controls are as much an extension of Mastery as Subjugating slaves might be.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Dominion', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Shapes~-~Shapes Proficiency~-~Shape(Specific), Cubes, Circles, Spheres, Sphere(Specify), Cones, Cuboid(Specify), Volumes, Volume(Specify) Cylinders, Tetrahedrons, Humanoid, Planes, Lines, Triangles, Squares, Rectangles, Circles, Oblongs, Oblate Spheroids, Pear-shaped, Discs, Polygon(Specify), Polygonal Prism(Specify), Domain-shape, Geographical-shape', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A Proficiency that governs the shapes of things, from natural shapes, like those of plants and animals to the simplest platonic shapes, such as the Sphere and Cube. The Proficiency allows a character to understand the limits of a particular shape, to create things that conform to such as shape (such as in a fire-ball spell or a humanoid sculpture).</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Dominion always has a domain, and a domain has limits, one of those ways of measuring a domain limit is as a shape. Maps for example show the shapes of the relative countries that the country\'s leaders control. A specified shape proficiency can grant the owner a deep understanding of the shapes properties.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Dominion', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Leadership~-~Leadership Proficiency~-~Autocracy, Anarchy, Aristocracy, Confederacy, Democracy, Dictatorship, Elitism, Fascism, Federalism, Meritocracy, Monarchy, Nepotism, Oligarchy, Parliament, Plutocracy, Republic, Representative Democracy, Senate, Socialism, Technocracy, Theocracy, Totalitarianism, Union', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Leadership is about dominance, getting others to do what needs to be done. Good Leaders don\'t micro-manage, they don\'t tell, they simply lead. With their followers all knowing their duties, and what is expected from them, from a few well chosen words. Bad Leaders demand respect instead of earning it, command others to do things they would not dare, and punish those who fail them, rather than rewarding their efforts.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency to do with leadership, all forms of leadership are political systems, and all systems and methods of control are Dominion-based on some level, this single proficiency can handle leading a team of two or a nation, especially with some specialisation (ideally in how you want to lead).</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Dominion', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Systems~-~Systems Proficiency~-~Arrangement(Specify), Arrangements, System(Specify), Network(Specify), Protocol(Specify), Protocols, Networks, Networking, Groups, Group(Specify), Organisation(Specify), Organise(Specific), Scheme(Specify), Plan(Specify), Classification(Specify), Schemes, Plans, Classifications', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">A proficiency for the act of organising things. This is one of the most basic Dominion Proficiencies as it is from this that all Sciences and Organisations ultimately descend.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Organisations and Systems are not the same as Pact-Descendants, Pact-Descendants are groups, but only groups of people are Pact-Descendants, a fleet of cars for example is just a number of descendants. Systems and Organisations are collections of principles that allow organization of a group of things to take place. This underpins everything from computer systems to systems of government.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Dominion', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Concealment~-~Concealment Proficiency~-~Hide(Specify), Hiding, Hidden, Lost, Camouflaged, Cloaked, Cloaking Device, Concealed(Specify), Invisibility, Unobserved, Hidden from(Specify)', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Concealment is a simple Enigma, hiding is a riddle, but a visual riddle, where something is hidden from view, if you cannot see something it becomes difficult to guess of its existence. Hiding is about moving things to positions where they are difficult to perceive correctly. Visual illusions can be used to hide things, although this is somewhat similar to masking...</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description"></p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Enigma', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Ferocity~-~Ferocity Proficiency~-~Passionate, Impassioned(Specify), Angry, Rage, Frenzied, Berserk, Berserker, Aggression, Aggressive, Frustrated, Violent', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Raw fury is a force of powerful, passionate, aggression. Anger or blind ferocity can be a great motivator, and drive a Character forwards in hard times. The Pinnacle of this aggressive stance is the Berserker\'s shield-chewing Rage, where their anger is so great they ignore anything less than a Maiming Wound automatically, and occasionally even Mortal Wounds are ignored for a while.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">This is a proficiency about harnessing aggression and anger and making it work for you. Raw Fury can be intimidating, powerful and deadly.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Fury', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), array('Title' => 'Grip~-~Grip Proficiency~-~Hold(Specify), Holding, Gripping, Grasp, Clasp, Cling, Anchor(Specify), Clutch, Grapple, Hook, Clutch, Clench, Stickiness', 'Description' => '<!-- wp:group --> <div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Grip is about holding on. The strength in your fingers and hands affects how well you can climb, how much you can lift, and a host of things in between.</p> <!-- /wp:paragraph --> <!-- wp:paragraph {"className":"t13ne-description"} --> <p class="t13ne-description">Gossamer governs clinging strength, whether it is the a cobweb, or a spider clinging to a wall, or a strongman lifting a weight.</p> <!-- /wp:paragraph --></div></div> <!-- /wp:group -->', 'Facet' => 'Gossamer', 'Genre' => 'T13 Core', 'Scope' => 'Omniversal', 'Era' => "Timeless", 'Specify' => true), );
		$c = count(T13Facets::$facets) * count($profargs);
		$sp = count($someProficiencies);
		$d = $c + $sp;
		$instal = $GLOBALS['T13NE_Proficiencies_Installed'];
		while ($instal < $d) {
			if ($instal < $c) {
				$facet = T13Facets::$facets[floor($instal / count($profargs))];
				//add a Prof for each Facet
				$argno = $instal % count($profargs);
				$type = $profargs[$argno]['Type'];
				$source = $profargs[$argno]['Source'];
				$fsrc = $facet[$source];
				$namefrag = $profargs[$argno]['Name'];
				$fname = $facet['FacetName'];
				$terms = array();
				$terms['Facet'] = $facet['FacetName'];
				if ($source == "Question") {
					$terms['Facet'] = array($facet['FacetName'], 'Enigma');
				}
				if ($source == "Location") {
					$terms['Facet'] = array('Yonder', $facet['FacetName']);
				}
				$terms['Genre'] = 'T13 Core';
				$terms['Scope'] = 'Omniversal';
				$terms['Era'] = 'Timeless';
				$description = $profargs[$argno]['Description'];
				$specify = $profargs[$argno]['Specify'];
				$replaceText = '';
				//error_log('debugging: '.$type);
				switch ($type) {
					case "Facet":
						$replaceText = T13Facets::getFacet($facet['FacetInitial']);
						$name = array(
							T13Sanitize::sanitize($fsrc),
							T13Sanitize::sanitize("{$fsrc} ({$fname} {$type}){$namefrag} Proficiency"),
							T13Sanitize::sanitize("{$fsrc}, {$fsrc}{$namefrag}, {$fname} {$type} Proficiency")
						);
						break;
					case "Attack":
					case "Wound":
						$name = array(
							T13Sanitize::sanitize($fsrc . $namefrag),
							T13Sanitize::sanitize($fsrc . ' (' . $fname . ' ' . $type . ') ' . $namefrag . " Proficiency"),
							T13Sanitize::sanitize($facet['FacetName'] . ' ' . $type . " Proficiency")
						);
						$replaceText = '<div><header>' . $facet['Attack'] . '</header><main>' . T13Suits::replaceEmojis($facet['Attack_Modes']) . '</main></div>';
						break;
					case "Persona":
						$replaceText = T13Facets::displayPersona($facet['FacetInitial']);
						$name = array(
							T13Sanitize::sanitize($fsrc['Name'] . $namefrag),
							T13Sanitize::sanitize($fsrc['Name'] . ' (' . $fname . ' ' . $type . ') ' . $namefrag . " Proficiency"),
							T13Sanitize::sanitize($facet['FacetName'] . ' ' . $type . " Proficiency")
						);
						break;
					case 'Narrative_Moment':
						$name = array(
							T13Sanitize::sanitize($fsrc . $namefrag),
							T13Sanitize::sanitize($fsrc . ' (' . $fname . ' ' . $type . ') ' . $namefrag . " Proficiency"),
							T13Sanitize::sanitize($facet['FacetName'] . ' ' . $type . " Proficiency")
						);
						$replaceText = '<div><h3>Narrative Moment ' . $facet[$source] . '</h3><p>' . $facet['Narrative_Text'] . '</p></div>';
						break;
					case 'Emotion':
						// this one is weird as it adds 3 simultaneously
						$emun = ['One', 'Two', 'Three'];
						$replaceText = ['<div><h3>Emotion ' . $facet[$source][0]['Name'] . '</h3><p>' . $facet[$source][0]['Description'] . '/p</div>', '<div><h3>Emotion ' . $facet[$source][1]['Name'] . '</h3><p>' . $facet[$source][1]['Description'] . '/p</div>', '<div><h3>Emotion ' . $facet[$source][2]['Name'] . '</h3><p>' . $facet[$source][2]['Description'] . '/p</div>'];
						foreach ($facet[$source] as $emono => $emotion) {
							//error_log('Emotion: '.json_encode($emotion));
							$namee = array(
								T13Sanitize::sanitize($emotion['Name']),
								T13Sanitize::sanitize($emotion['Name'] . ' (' . $fname . ' ' . $type . ')' . $namefrag . ' Proficiency'),
								T13Sanitize::sanitize("{$emotion['Name']}, {$emotion['Name']}{$namefrag}, {$emotion['Name']} {$type}, {$emun[$emono]} Card {$facet['FacetName']} {$type} Proficiency")
							);
							$description = str_replace("[REPLACE_TEXT]", $replaceText[$emono], $description);
							$emoInstal = T13Proficiencies::tryAddingProf($namee, $specify, $description, $terms, true);
						}

						break;
					default:
						$name = array(
							T13Sanitize::sanitize($fsrc),
							T13Sanitize::sanitize($fsrc . ' (' . $fname . ' ' . $type . ') ' . $namefrag . " Proficiency"),
							T13Sanitize::sanitize("{$fsrc}, {$fsrc} {$namefrag}, {$fname} {$type} Proficiency")
						);
						$replaceText = '<div><h3>' . $type . ' ' . $facet[$source] . '</h3><p>' . $facet[$type . '_Text'] . '</p></div>';
						break;
				}

				if ($type !== "Emotion") {

					if (!is_array($replaceText)) {
						$description = str_replace("[REPLACE_TEXT]", $replaceText, $description);
					}

					if (self::tryAddingProf($name, $specify, $description, $terms, true)) {
						return array('prof' => $name[1], 'install' => $instal++, 'of' => $d, 'facet' => $facet['FacetName']);
					} else {
						$instal++;
					}
				} else {
					if ($emoInstal) {
						return array('prof' => $name[1], 'install' => $instal++, 'of' => $d, 'facet' => $facet['FacetName']);
					} else {
						$instal++;
					}
				}
			} else {
				// and the specified Profs
				$prof = $someProficiencies[($instal - $c) % $sp];
				$terms = array();
				$terms['Facet'] = $prof['Facet'];
				$terms['Genre'] = $prof['Genre'];
				$terms['Scope'] = $prof['Scope'];
				$terms['Era'] = $prof['Era'];
				if (self::tryAddingProf($name, $specify, $description, $terms, true)) {
					return array('prof' => $prof['Title'], 'install' => $instal, 'of' => $d, 'facet' => $prof['Facet']);
				} else {
					$instal++;
				}

			}
		}
	}

	/*WP_Post Object
			   (
				   [ID] =>
				   [post_author] =>
				   [post_date] =>
				   [post_date_gmt] =>
				   [post_content] =>
				   [post_title] =>
				   [post_excerpt] =>
				   [post_status] =>
				   [comment_status] =>
				   [ping_status] =>
				   [post_password] =>
				   [post_name] =>
				   [to_ping] =>
				   [pinged] =>
				   [post_modified] =>
				   [post_modified_gmt] =>
				   [post_content_filtered] =>
				   [post_parent] =>
				   [guid] =>
				   [menu_order] =>
				   [post_type] =>
				   [post_mime_type] =>
				   [comment_count] =>
				   [filter] =>
			   )*/
}
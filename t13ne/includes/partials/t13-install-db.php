<?php
//error_log('Installing package'.$package);
switch ((int)$package){
	case 0:
		//error_log('Beginning Installation package 0');
		$basepath=dirname(plugin_dir_path(__DIR__ ));
		$basepath = str_replace('\\','/', $basepath);
		$baseurl= plugin_dir_url(plugin_dir_path(__DIR__ ) );
		//error_log('Basepath set to '.$basepath);
		$script="if (!T13NE){var T13NE={\"t13file\":\"{$basepath}\", \"t13url\":\"{$baseurl}\"};}
		";
		$script.='
		'. T13Facets::writeFacetScript();
		//error_log('Facet script loaded');
		$script.='
		'. T13Suits::writeSuitScript();
		//error_log('Suit script loaded');
		$script.=T13Types::writeTypesScript();
		//error_log('Type script loaded');
		$script.='
		'.T13Wounds::writeWoundScript();
		//error_log('Wound Script loaded');
		$script.='
		'.T13Chars::writeCharacterScript();
		//error_log('Characters Script loaded');
		$script.='
		'.T13Geometry::geometryScript();

		$script.='
		'.T13Cards::writeCardScript();
		$script.='
		'. T13Dice::writeDiceScript();
		////error_log('Installing '.$script);
		$path=$basepath."/public\/js\/t13ne-base.js";
		$path=T13Sanitize::SanitizePath($path);
		//error_log('Installing path'.$path);
		$myfile = fopen($path, "w+") or die("Unable to open file!");
		//error_log('Opened File'.$path);
		//echo fread($myfile,filesize("webdictionary.txt"));
		fwrite($myfile, $script) or die("Installation write failed!");
		//error_log('Written file '.$path);
		fclose($myfile) or die("Can't close file!");
		//error_log('Closing file'.$path);
		$retvar= array('message'=>'Installation Begun', 'package'=>1, 'error'=>$wpdb->last_query);
	break;
	case 1:
		$installed = T13Rules::installRules();
		if ($installed['install']>=$installed['of']){$package++;}
		$retvar= array('message'=>'Installing T13 Core Rules: '.$installed['rule'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>$wpdb->last_query , 'debug'=>$installed['debug']);
	break;
	case 2:
		$GLOBALS['T13NE_Proficiencies_Installed'] = 0;
		$installed = T13Proficiencies::installProfs();
		if($installed['install']>=$installed['of']){$package++;}
		//error_log('installed='.json_encode( $installed ));
		$retvar= array('message'=>'Installing T13 '.$installed['facet'].' Core Proficiencies: '.$installed['prof'].' ('.$installed['install'].' of '.$installed['of'].')' , 'package'=>((int)$package), 'error'=>json_encode( $wpdb->last_query));
	break;
	case 3:
		$installed = T13Statblock::installStatblocks();
		if ($installed['install']>=$installed['of']){$package++;}
		$retvar= array('message'=>'Installing T13 Statblocks:'.$installed['block'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>json_encode( $wpdb->last_query));
	break;
	case 4:
		$installed = T13Thresholds::installThresholds();
		if ($installed['install']>=$installed['of']){$package++;}
		$retvar= array('message'=>'Installing T13 Thresholds: '.$installed['threshold'], 'package'=>((int)$package), 'error'=>json_encode( $wpdb->last_query));
	break;
	case 5:
		$installed = T13Hitches::installHitches();
		//error_log('installed='.json_encode( $installed ));
		if ($installed['install']>=$installed['of']){$package++;}
		$retvar= array('message'=>'Installing T13 Core Hitches: '.$installed['hitch'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>json_encode( $wpdb->last_query));
	break;
	case 6:
		$installed =T13Annexes::installAnnexes();
		//error_log('installed='.json_encode($installed));
		if ($installed['install']>=$installed['of']){$package++;}
		$retvar= array('message'=>'Installing T13 Core Annexes: '.$installed['annex'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>$wpdb->last_query);
	break;
	// case 5:
	// 	$installed = T13Descendants::installDescendants();
	// 	if ($installed['install']>=$installed['of']){$package++;}
	// 	$retvar= array('message'=>'Installing T13 Core Props &amp; Descendants:'.$installed['desc'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>$wpdb->last_query , 'debug'=>$installed['debug']);
	// break;
	// case 6:
	// 	$installed = T13Chars::installChars();
	// 	if ($installed['install']>=$installed['of']){$package++;}
	// 	$retvar= array('message'=>'Installing T13 Core Characters: '.$installed['char'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>$wpdb->last_query , 'debug'=>$installed['debug']);
	// break;
	// case 7:
	// 	$installed =T13Plots::installPlots();
	// 	if ($installed['install']>=$installed['of']){$package++;}
	// 	$retvar= array('message'=>'Installing T13 Core Plots: '.$installed['plot'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>$wpdb->last_query , 'debug'=>$installed['debug']);
	// break;
	// case 5:
	// 	$installed = T13Games::installGames();
	// 	if ($installed['install']>=$installed['of']){$package++;}
	// 	$retvar= array('message'=>'Installing T13 Core Games: '.$installed['game'].' ('.$installed['install'].' of '.$installed['of'].')', 'package'=>((int)$package), 'error'=>$wpdb->last_query , 'debug'=>$installed['debug']);
	// break;

	default:
		$retvar=array('message'=>'That&#39;s All Folks! ', 'package'=>2000, 'error'=>$wpdb->last_query);
	break;
}

//?>
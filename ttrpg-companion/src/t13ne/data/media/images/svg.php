<?php
header('Content-type: image/svg+xml');
$shape = $_GET['shape'];
	$color =  "";
	if ($_GET['r']){
		$color.=$_GET['r'].",";
	}else{
		$color.=rand(0,255).",";
	}
	if ($_GET['g']){
			$color.=$_GET['g'].",";
		}else{
			$color.=rand(0,255).",";
	}
	if ($_GET['b']){
			$color.=$_GET['b'].",";
		}else{
			$color.=rand(0,255).",";
	}
	if ($_GET['a']){
			$color.=$_GET['a'];
		}else{
			$color.=(rand(25,80)/100);
	}
	if (!$shape){
	$shape = rand (1,6);
	} ?>
<?php echo'<?xml version="1.0" encoding="utf-8" ?>';?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 800 600" preserveAspectRatio="none" width="800" height="600">

	<title>Moire</title>
	<desc></desc>
	<style type="text/css">
	<![CDATA[
	]]>
	</style>

	<defs>
		<? if ($shape==1){ ?>
			<symbol id="shape">
			<?php
			$x=rand(0,800);
				$y=rand(0,600);
			for ($i=0; $i<500;$i++){
			?>
				<circle cx="<?php echo $x;?>" cy="<?php echo $y;?>" r="<?php echo 3.2*$i;?>" stroke="rgba(<?php echo $color;?> )" stroke-width="0.4" fill="none" />
			<?php }?>
		<?php } elseif ($shape==2){ ?>
			<symbol id="shape">
			<?php
			$offset=rand(-5,5);
			 for ($i=-80;$i<400;$i++){
			 ?>
			 <line x1="<?php echo $i*2 ; ?>" y1="0" x2="<?php echo $offset+($i*2) ;?>" y2="900"
			   style="stroke:rgba(<?php echo $color;?>);stroke-width:0.4"/>
			 <?php } ?>
		<?php } elseif ($shape==3){ ?>
			<symbol id="shape">
			<?php
			$offset=rand(-4,4);
			 for ($i=-40;$i<225;$i++){
			?>
			<line x1="0" y1="<?php echo $i*3; ?>" x2="600" y2="<?php echo $offset+($i*4);?>"
					   style="stroke:rgba(<?php echo $color; ?>;stroke-width:0.4"/>
			 <?php } ?>
		<?php } elseif ($shape==4){ ?>
			<symbol id="shape">
			<?php
				$offset=rand(35,70)*0.1;
				$x=rand(0,800);
				$y=rand(0,600);
			 for ($i=0;$i<300;$i++){
			?>
			<ellipse cx="<?php echo $x ?>" cy="<?php echo $y;?>" rx="<?php echo $i*$offset;?>" ry="<?php echo $i*2;?>"
  style="fill:none;stroke:rgba(<?php echo $color;?>);stroke-width:0.4"/>
			 <?php } ?>
		<?php } elseif ($shape==5){ ?>
			<symbol id="shape">
			<?php
			$cu=rand(-50,155);
			$cur=rand (-150,50);
			$curv=rand(-500,500);
			$curve=rand (-50,50);
			 for ($i=-40;$i<400;$i++){
			?>
			   <path id="u" d="M <?php echo $i*2; ?> 0 q <?php echo $curv;?> <?php echo $curve;?> <?php echo $i*2;?> 1450 c <?php echo $cu.' '.$cur.' '.$i*$cu.' '.$curv.' '.$i*4; ?> 600" />
			 <?php }?>
		<?php } elseif ($shape==6){ ?>
			<symbol id="shape">
			<?php
			$cu=rand(-50,5);
			$cur=rand (-50,5);
			$curv=rand(-500,500);
			$curve=rand (-500,500);
			 for ($i=-50;$i<400;$i++){
			?>
			   <path id="u" d="M <?php echo $i*2; ?> 0 c <?php echo $cu;?> <?php echo $cur;?> <?php echo $curv;?> <?php echo $curve;?> <?php echo $i*2;?> 600" />
			 <?php }
			}?>
			 </symbol>
	</defs>
	<use x="0" y="0"  width="1600" height="900" fill="none" stroke-width="0.4"
stroke="rgba(<?php echo $color;?>)" xlink:href="#shape"/>
</svg>
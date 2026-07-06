<?php
header('Content-type: image/svg+xml');
$size = $_GET['size'];
$density = $_GET['density']+1;
echo'<?xml version="1.0" encoding="utf-8" ?>';
?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 <?php echo $size." ".$size ;?>" PreserveAspectRatio ="MidXMidY slice" width="100%" height="100%">

	<title>Stars</title>
	<desc>Truly random star field</desc>
	<style type="text/css">
	<![CDATA[
	]]>
	</style>

	<defs>
	<filter id="f0" x="0" y="0">
	      <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
    </filter>
	<filter id="f1" x="0" y="0">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
    </filter>
    <filter id="f2" x="0" y="0">
	      <feGaussianBlur in="SourceGraphic" stdDeviation="13" />
    </filter>
    <?php
    	for ($i=0;$i<$density;$i++){
			$x= rand(0,$size);
			$y= rand(0,$size);
			$a= (rand(1,100)/100);
			$r= rand(1,$size/4)/($size/3);
			$spike=30;
			$color = rand(120,255).",".rand(50,200).",".rand(60,255);
			$color = rand(120,255).",".rand(50,200).",".rand(60,255); ?>
		<radialGradient id="gstar<?php echo $i;?>" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
			<stop offset="0%" style="stop-color:rgb(<?php echo $color;?>); stop-opacity:1" />
			<stop offset="100%" style="stop-color:rgb(<?php echo $color;?>);stop-opacity:0" />
		</radialGradient>
	    <symbol id="star<?php echo $i ; ?>">
		     <circle cx="<?php echo $x?>" cy="<?php echo $y;?>" r="<?php echo $r*20;?>" style="stroke:rgba(<?php echo $color;?>,0.3);stroke-width:<?php echo $r;?>;fill:url(#gstar<?php echo $i;?>);opacity:0.3;" />
		     <polygon  points="<?php
		     echo ($x-($r*$spike)).','.$y;?> <?php
		     echo ($x-$r).",".($y-$r); ?> <?php
		     echo $x.",".($y-($r*$spike));?> <?php
		     echo $x+$r.",".($y-$r);?> <?php
		     echo ($x+($r*$spike)).",".$y;?> <?php
		     echo ($x+$r).",".($y+$r);?> <?php
		     echo $x.",".($y+($r*$spike));?> <?php
		     echo ($x-$r).','.($y+$r);
		     ?>" style="fill:url(#gstar<?php echo $i;?>);opacity:0.2;stroke:none;" />
			<circle cx="<?php echo $x?>" cy="<?php echo $y;?>" r="<?php echo ($r*2.5);?>" style="stroke:none;fill:rgba(255,255,255,0.6);" />
			<circle cx="<?php echo $x?>" cy="<?php echo $y;?>" r="1" style="stroke:none;fill:rgba(255,255,255,1);" />
		</symbol>
		<?php }

			for($i=0;$i<$density;$i++){
		?>
			<symbol id="stars<?php echo $i ;?>">
			<?php
				for ($j=0;$j<($size/10);$j++){
					$color = rand(120,255).",".rand(50,200).",".rand(60,255);
					?>
<circle cx="<?php echo rand(0,$size);?>" cy="<?php echo rand(0,$size);?>" r="<?php echo rand(1,$density)/(2*$density/3);?>" stroke="none" fill="rgb(<?echo $color ;?>)" opacity="<?php echo rand(15,100)/100 ?>" />
<circle cx="<?php echo rand(0,$size);?>" cy="<?php echo rand(0,$size);?>" r="0.8" stroke="none" fill="rgb(<?echo $color ;?>)" opacity="0.3" />
<circle cx="<?php echo rand(0,$size);?>" cy="<?php echo rand(0,$size);?>" r="0.3" stroke="none" fill="rgb(<?echo $color ;?>)" opacity="0.3" />
			   	<?php } ?>
			</symbol>
			<?php }
			for ($i=0;$i<$density;$i++){
			$color = rand(120,255).",".rand(50,200).",".rand(60,255);?>
			$color2 = rand(120,255).",".rand(50,200).",".rand(60,255);?>
			<radialGradient id="grad<?php echo $i;?>" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
						<stop offset="0%" style="stop-color:rgb(<?php echo $color2;?>); stop-opacity:1" />
						<stop offset="100%" style="stop-color:rgb(<?php echo $color2;?>);stop-opacity:0" />
			</radialGradient>
			<radialGradient id="ggrad<?php echo $i;?>" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
									<stop offset="0%" style="stop-color:rgb(<?php echo $color;?>); stop-opacity:1" />
									<stop offset="100%" style="stop-color:rgb(<?php echo $color;?>);stop-opacity:0" />
			</radialGradient>
			<radialGradient id="gggrad<?php echo $i;?>" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
									<stop offset="0%" style="stop-color:rgb(<?php echo $color;?>); stop-opacity:0" />
									<stop offset="30%" style="stop-color:rgb(<?php echo $color;?>);stop-opacity:0.8" />
									<stop offset="50%" style="stop-color:rgb(<?php echo $color2;?>);stop-opacity:0.4" />
									<stop offset="80%" style="stop-color:rgb(<?php echo $color2;?>);stop-opacity:0.9" />
									<stop offset="100%" style="stop-color:rgb(<?php echo $color2;?>);stop-opacity:0" />

			</radialGradient>
				<symbol id="nebula<?php echo $i; ?>">
				 <?php
				 $x=rand($size*0.3,$size*0.7);
				 $y=rand($size*0.3,$size*0.7);
				 $a= (rand(1,100)/100);
				$r= rand(1,$size/4)/($size/3);
				$sizing=rand(($size*0.7),$size*1.3)/$i;
				$sizang=rand($size*0.7,$size*1.3)/$i;
				?>

					<ellipse cx="<?php echo $x+(rand(-$sizing*0.9,$sizing*0.9));?>" cy="<?php echo $y+(rand($sizang*0.6,$sizang*0.6)) ;?>" rx="<?php echo $sizing;?>" ry="<?php echo $sizang;?>" style="stroke:none;fill:url(#grad<?php echo $i;?>);opacity:0.03;" transform = "rotate<?php echo rand(0,359).' 50% 50%';?> " />
					<ellipse cx="<?php echo $x+(rand(-$sizing*0.8,$sizing*0.8));?>" cy="<?php echo $y+(rand(-$sizang*0.8,$sizang*0.8));?>" rx="<?php echo $sizing*0.9 ;?>" ry="<?php echo $sizang*0.8;?>" style="stroke:none;fill:url(#ggrad<?php echo $i;?>);opacity:0.04;"  transform = "rotate<?php echo rand(0,359).' 50% 50%';?> " />
					<ellipse cx="<?php echo $x+(rand(-$sizing*0.6,$sizing*0.6));?>" cy="<?php echo $y+(rand(-$sizang*0.6,$sizang*0.6));?>" rx="<?php echo $sizing*0.7;?>" ry="<?php echo $sizang*0.7;?>" style="stroke:none;fill:url(#gggrad<?php echo $i;?>);opacity:0.05;"  transform = "rotate<?php echo rand(0,359).' 50% 50%';?> " />
					<ellipse cx="<?php echo $x+(rand(-$sizing*0.5,$sizing*0.5));?>" cy="<?php echo $y+(rand(-$sizang*0.3,$sizang*0.3)) ;?>" rx="<?php echo $sizing*0.6;?>" ry="<?php echo $sizang*0.6;?>" style="stroke:none;fill:url(#ggrad<?php echo $i;?>);opacity:0.06;" transform = "rotate<?php echo rand(0,359).' 50% 50%';?> " />
					<ellipse cx="<?php echo $x+(rand(-$sizing*0.4,$sizing*0.4));?>" cy="<?php echo $y+(rand(-$sizang*0.4,$sizang*0.4));?>" rx="<?php echo $sizing*0.5;?>" ry="<?php echo $sizang*0.5;?>" style="stroke:none;fill:url(#grad<?php echo $i;?>);opacity:0.07;"  transform = "rotate<?php echo rand(0,359).' 50% 50%';?> " />
					 <circle cx="<?php echo $x+(rand(-$sizing*0.8,$sizing*0.8));?>" cy="<?php echo $y+(rand($sizang*0.8,$sizang*0.8));?>" r="<?php echo $r*30;?>" style="stroke:rgba(<?php echo $color;?>,0.3);stroke-width:<?php echo $r;?>;fill:url(#ggrad<?php echo $i;?>);opacity:0.06;" />
					<circle cx="<?php echo $x+(rand(-12,12));?>" cy="<?php echo $y+(rand(-12,12));?>" r="<?php echo $r*12;?>" style="stroke:rgba(<?php echo $color;?>,0.3);stroke-width:<?php echo $r;?>;fill:url(#grad<?php echo $i;?>);opacity:0.08;" />
					<circle cx="<?php echo $x;?>" cy="<?php echo $y;?>" r="<?php echo $r*5;?>" style="stroke:none;?>;fill:url(#grad<?php echo $i;?>);opacity:0.2;" />
			<circle cx="<?php echo $x?>" cy="<?php echo $y;?>" r="0.5" style="stroke:none;fill:rgba(255,255,255,1);" />
					<ellipse cx="<?php echo $x;?>" cy="<?php echo $y;?>" rx="<?php echo $sizing;?>" ry="<?php echo $sizang;?>" style="stroke:none;fill:url(#gggrad<?php echo $i;?>);opacity:0.08;filter:url(#f2);"  transform = "rotate<?php echo rand(0,359).' 50% 50%';?> " />
				</symbol>
			<?php } ?>

	</defs>
	<rect x="0" y="0" width="100%" height="100%" style="stroke:none;fill:rgb(0,0,0);" />
	<?php
		for ($i=1;$i<$density;$i++){?>
		<use x="0" y="0"  width="100%" height="100%" xlink:href="#nebula<?php echo $i; ?>" style="filter:url(#f2);"/>
		<use x="0" y="0"  width="100%" height="100%" xlink:href="#stars<?php echo $i ;?>"/>
			<use x="0" y="0"  width="100%" height="100%" xlink:href="#stars<?php echo $i ;?>" transform = "rotate(90 50% 50%)"/>
		<use x="0" y="0"  width="100%" height="100%" xlink:href="#star<?php echo$i; ?>" />
		<use x="0" y="0"  width="100%" height="100%" xlink:href="#star<?php echo$i; ?>" transform = "rotate(90 50% 50%)"/>
		<?php } ?>
	<rect x="0" y="0" width="100%" height="100%" style="stroke:none;fill:none;filter:url(#f2);" />
</svg>
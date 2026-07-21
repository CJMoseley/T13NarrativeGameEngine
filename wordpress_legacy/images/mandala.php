<?php
header('Content-type: image/svg+xml');
$size = $_GET['size'];
$grid = floor($size/10);
$words = $_GET['words'];
$layers = str_word_count($words);
$wordarr= str_word_count($words,1);
srand($grid+$layers);
echo'<?xml version="1.0" encoding="utf-8" ?>';
?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 <?php echo $size." ".$size ;?>" PreserveAspectRatio ="MidXMidY slice" width="100%" height="100%">

	<title>Mandala</title>
	<desc>Random Mandala <?php echo "grid=".$grid;?></desc>
	<style type="text/css">
	<![CDATA[
	]]>
	</style>

	<defs>
		<filter id="f0" x="0" y="0">
			<feGaussianBlur in="SourceGraphic" stdDeviation="3" />
   	 	</filter>

   	 	<?php for ($i=0;$i<$layers;$i++){
			/*main construction loop by word*/?>
			<?php if (rand(1,5)<=3){ ?>
<radialGradient id="fill<?php echo $i; ?>" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><?php $stepcol=100/(rand(2,12));
for ($j=0;$j<=100;$j=$j+$stepcol){ ?><stop offset="<?php echo $j; ?>%" style="stop-color:rgb(<?php echo rand(0,255).','.rand(0,255).','.rand(0,255);?>); stop-opacity:<?php echo (rand(1,10)/15);?>" /><?php } ?>
		</radialGradient>
		<?php }else{
		$dire=rand(0,16);?>
<linearGradient id="fill<?php echo $i; ?>" x1="<?php echo (100*($dire<8)); ?>%" y1="<?php echo (($dire>4)&&($dire<12))*100; ?>%" x2="<?php echo ($dire %2)*100; ?>%" y2="<?php echo ($dire>8)*100; ?>%"><?php $stepcol=100/(rand(2,8));
for ($j=0;$j<=100;$j=$j+$stepcol){ ?><stop offset="<?php echo $j; ?>%" style="stop-color:rgb(<?php echo rand(0,255).','.rand(0,255).','.rand(0,255);?>); stop-opacity:<?php echo (rand(1,10)/15);?>" /><?php } ?>
		</linearGradient>
		<?php } ?>

			<symbol id="word<?php echo $i; ?>">
				<?php
				for ($j = 0, $w="".$wordarr[$i], $k = strlen($w); $j < $k; $j++) {
				    $decarr = ord($wordarr[$i]{$j});
				    $x=4+floor($grid*(1+((($decarr-33)*0.5)%8)));
				    $y=4+floor($grid*(1+($decarr %8)));

					if ($j==0){
						echo '<path d="M '.$x.','.$y;
					}else{
						$type=rand(1,4);
						if ($type==1){
							echo ' L'.$x.','.$y;
						}elseif ($type==2){
							echo ' S'.$x.','.$y.' '.rand($size/3,2*$size/3).','.rand($size/3,2*$size/3);
						}elseif ($type==3){
							echo ' T'.$x.','.$y.' '.rand($size/3,2*$size/3).','.rand($size/3,2*$size/3);
						}elseif ($type==4){
							echo ' C'.$x.','.$y.' 50%,50% '.rand($size/3,2*$size/3).','.rand($size/3,2*$size/3);
						}
					}
 				 }?> Z" style="fill:url(#fill<?php echo $i;?>);stroke-width:0.3;stroke:rgb(<?php echo rand(120,255).','.rand(120,255).','.rand(120,255);?>)"/>
			</symbol>

			<?php }?>

	</defs>
	<rect x="0" y="0" width="100%" height="100%" style="stroke:none;fill:none;" />
	<circle cx="50%" cy="50%" r="43%" style="fill:none;stroke-width:0.1;stroke:rgb(120,120,120);opacity:0.7;"/>
	<circle cx="50%" cy="50%" r="45%" style="fill:none;stroke-width:0.1;stroke:rgb(120,120,120);opacity:0.7;"/>
	<path d="M 35% 35% l <?php echo 0.45*$size ;?> 0 l <?php echo cos(2*pi()/3) * $size*0.45;?> <?php echo sin(2*pi()/3) * $size*0.45;?>%
l <?php echo cos(4*pi()/3) * $size*0.45;?>% <?php echo sin(4*pi()/3) * $size*0.45;?>%" style="fill:none;stroke-width:01;stroke:rgb(255,120,120);opacity:0.7;"/>


		<?php
			for ($i=0;$i<$layers;$i++){?>
				<use x="0" y="0"  width="100%" height="100%" xlink:href="#word<?php echo $i; ?>" style="filter:url(#f0);" />

			<?php } ?>

</svg>

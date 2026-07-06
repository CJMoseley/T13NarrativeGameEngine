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
 * Fired during plugin activation. Geometry
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Conflicts{

	public static $baseConflict=array();
	public static $expressions=array();
	static public function prepareConflict($name='',$facets='',$side='',$size=1,$description='',$words=''){
		//The Manifestation of a side. These are stand-ins for Hooked Characters and Organizations.
		$somewords=array(
			'People'=>[
				'The Bad Guy,The Enemy,The Rival'=>['VerbActor'=>['L(ie/ies/ying/ied)','Cheat(/s/ing/ed)','Seduc(e/es/ing/ed)','Plan(/s/ning/ned)','Plot(/s/ting/ted)','Stalk(/s/ing/ed)','F(all/alls/alling/ell/allen) In Love','Fanc(y/ies/ying/ied)','Lov(e/es/ing/ed)','Long(/s/ing/ed)','Want(/s/ing/ed)','Need(/s/ing/ed)','Arrang(e/es/ing/ed)','Caus(e/es/ing/ed)','Forc(e/es/ing/ed)','Push(/s/ing/ed)','Persuad(e/es/ing/ed)','Confus(e/es/ing/ed)','Negotiat(e/es/ing/ed)','Gambl(e/es/ing/ed)','Bet(/s/ting/ted)','Wager(/s/ing/ed)','Hurt(/s/ing/)','Kill(/s/ing/ed)','Damag(e/es/ing/ed)','Murder(/s/ing/ed)','Gain(/s/ing/ed)','W(in/ins/inning/on)','Fram(e/es/ing/ed)','Captur(e/es/ing/ed)','Fool(/s/ing/ed)','Punch(/es/ing/ed)','Sho(ot/ots/oting/t)','Fir(e/es/ing/ed)','Br(eak/eaks/eaking/oke)','Ignor(e/es/ing/ed)'],'VerbTarget'=>['Accept(/s/ing/ed)','Help(/s/ing/ed)','Assist(/s/ing/ed)','Lov(e/es/ing/ed)','Stalk(/s/ing/ed)','Question(/s/ing/ed)','Persuad(e/es/ed)','Award(/s/ing/ed)','Reward(/s/ing/ed)','Prais(e/es/ing/ed)','Gift(/s/ing/ed)','G(ive/ives/iving/ave/iven)']],
				'The Hero,The Good Guy'=>['VerbActor'=>['React(/s/ing/ed)','Protect(/s/ing/ed)','Tr(y/ies/ying/ied)','F(ind/inds/inding/ound)','Sav(e/es/ing/ed)','Stop(/s/ping/ped)','Fail(/s/ing/ed)','Struggl(e/es/ing/ed)','Hop(e/es/ing/ed)','Believ(e/es/ing/ed)','Lov(e/es/ing/ed)','Work(/s/ing/ed)','Los(e/es/ing/t)'],'VerbTarget'=>['Rob(/s/bing/bed)','Kidnap(/s/ping/ped)','Hurt(/s/ing/)','Harm(/s/ing/ed)','Distract(/s/ing/ed)','Misle(ad/ads/ading/ed)','Shout(/s/ing/ed) At','Insult(/s/ing/ed)','Disparag(e/es/ing/ed)','Lectur(e/es/ing/ed)','Fram(e/es/ing/ed)','Abandon(/s/ning/ned)','Le(ave/aves/aving/ft)','Seduc(e/es/ing/ed)']],
				'The Heroine,The Good Girl'=>['VerbActor'=>['Fanc(y/ies/ying/ied)','F(ight/ights/ighting/ought)','Struggl(e/es/ing/ed)','Los(e/es/ing/t)','Lov(e/es/ing/ed)','Ignor(e/es/ing/ed)','Sav(e/es/ing/ed)','F(ind/inds/inding/ound)','St(eal/eals/ealing/ole/olen)'],'VerbTarget'=>['Kidnap(/s/ping/ped)','Captur(e/es/ing/ed)','Persuad(e/es/ing/ed)','Hurt(/s/ing/)','Rap(e/es/ing/ed)','Help(/s/ing/ed)','Misle(ad/ads/ading/d)','Distract(/s/ing/ed)','Fram(e/es/ing/ed)','Le(ave/aves/aving/ft)','Seduc(e/es/ing/ed)']],
				'The Bad Girl,The Femme Fatale'=>['VerbActor'=>['Seduc(e/es/ing/ed)','Le(ave/aves/aving/ft)','Abandon(/s/ning/ned)','L(ie/ies/ying/ied','Cheat(/s/ing/ed)','Betray(/s/ing/ed)','Distract(/s/ing/ed)','Hurt(/s/ing/)','Fram(e/es/ing/ed)','Fool(/s/ing/ed)','Slap(/s/ing/ed)','Kill(/s/ing/ed)','Posion(/s/ing/ed)','Ignor(e/es/ing/ed)'],'VerbTarget'=>['G(ive/ives/iving/ave)','Admir(e/es/ing/ed)','Lust(/s/ing/ed) After','Long(/s/ing/ed) For','Want(/s/ing/ed)','Kill(/s/ing/ed)']],
				'The Police,A Detective,Constable,The Sheriff,A Deputy,Police Officer'=>['VerbTarget'=>['Avoid(/s/ing/ed)','Evad(e/es/ing/ed)','Ellud(e/es/ing/ed)','Injur(e/es/ing/ed)','Los(e/es/ing/t)','Escap(e/es/ing/ed)'],'VerbActor'=>['Arrest(/s/ing/ed)','H(old/olds/olding/eld)','Chas(e/es/ing/ed)','Radio(/s/ing/ed)','Call(/s/ing/ed)','Fir(e/es/ing/ed)','Warn(/s/ing/ed)','Watch(/s/ing/ed)','Observ(e/es/ing/ed)','Record(/s/ing/ed)','Handcuff(/s/ing/ed)','Investigat(e/es/ing/ed)','Suspect(/s/ing/ed)','Cover(/s/ing/ed)']],
			],
			'Nouns'=>['Something(/s)','Nothing(/s)','Thing(/s)','McGuffin(/s)','Plot Token(/s)','Plot Point(/s)','Plot Device(/s)','Stuff','Bits and Bobs','Doo-hick(ey/ies)','Wossname(/s)'],
			'Verbs'=>['Go(/es/ing/ne)','Do(/es/ing/ne)','(Am/Is/Are/Were/Was/Will be/Have Been/Will Have Been)','(Have/Has/Have/Had/'],
			'Positions'=>['Relative'=>['On','By','In','Outside Of','Under','Over','Above','After','Around','Before','Behind','Below','Beside','Between','Down','Far From','Inside','Near','Next To','Off','On','Out Of','Start','Through','Up','In-Front Of'],'Absolute'=>['Outside','Beginning','Indoors','Outdoors','Bottom','End','Finish','Left','Middle','Right','Top','Upside-Down','Front','Out','Far']],
			'Locations'=>[
				'House(/s),Apartment(/s),Flat(/s),Home(/s)'=>['Expressions'=>['Home Sweet Home','Housemate(/s),Flatmate(/s)','Homemaker,House-Wife,House-Husband,House-Spouse'],'VerbTarget'=>['Own(/s/ing/ed)','Rent(/s/ing/ed)','Clean(/s/ing/ed)','Live(/s/ing/ed) In','Burn(/s/ing/ed) Down','Repair(/s/ing/ed)','Damag(e/es/ing/ed)','Decorat(e/es/ing/ed)','Tid(y/ies/ying/ied)','Purchas(e/es/ing/ed)','Haunt(/s/ing/ed)','Inhabit(/s/ing/ed)'],'VerbActor'=>['St(and/ands/anding/stood)','S(it/its/itting/at)'],'Adjectives'=>['Cosy','Warm','Delapidated','Run-Down','Cheap','Poor','Shoddy','Small','Tiny','Low-Rent','Expensive','Large','Big','Enormous','Luxurious','Luxury','Exclusive','Secure'],'Nouns'=>['Computer(/s),Games Console(/s),Board Game(/s),Playing-Card(/s)','Media Centre(/s),Television(/s),TV(/s),Stereo(/s),Games Console(/s)','Light(/s),Light-Bulb(/s),Chandelier(/s),Candle(/s),Gas-Light(/s)','Rug(/s),Carpet(/s),Floorboard(/s),Vinyl Floor(/s),Floor Tile(/s)','Sofa(/s),Couch(/es),Chais-Lounge(/s),Settee(/s),Bench(/es),Suite(/s)','Chair(/s),Table(/s),Armchair(/s)','Coffee Table(/s),Book-Shel(f/ves),Media-Centre(/s),Wardrobe(/s),Cupboard(/s),Piano(/es),Counter(/s),Breakfast Bar(/s)','Family Portrait(/s),Mirror(/s),Landscape(/s),Photograph(/s),Vase(/s),Candlestick(/s),Poster(/s),Painting(/s),Statue(/s),Flower(/s),Throw(/s),Tapestr(y/ies),','Book(/s),DVD(/s),Video Tape(/s),CD(/s),Record(/s),Tape(/s),Disk(/s),Memory Card(/s),USB-Stick(/s),Tablet(/s),Telephone(/s)','Door(/s),Threshold(/s),Step(/s),Stair(/s),Hall(/s),Landing(/s)'],'Locations'=>['Living Room(/s),Lounge(/s),Sitting-Room(/s),Parlour(/s)','Bedroom(/s)','Bathroom(/s),Shower-Room(/s),Toilet(/s),Wash-Room','Kitchen(/s),Kitchette(/s)','Spare Room(/s),Spare Bedroom(/s),Music Room(/s),Conservator(y/ies),Home Office(/s),Game Room(/s),Librar(y/ies)','Utility Room(/s),Washing-Room,Laundr(y/ies),Pantr(y/ies),']],
				'Office(/s)'=>['Expressions'=>['A Day At The Office','Office Space'],'Nouns'=>['Desk(/s),Cubicle(/s)','Computer(/s),Telephone(/s),Stamp(/s),File(/s),Paper(/s),Book(/s),Pen(/s),Stationary'],'Adjectives'=>['Administrable','Official','Corporate','Bureaucratic','Formal','Clerical','Responsible','Organized','Institutional','Executive','Entrepreneurial','Industrial','Strategic','Operational','Enterprising','Main-Stream','Staid','Business-Like','Financial','Multinational','International','Local','Retail','Plutocratic','Transactional','Political', 'Administrative','Innovative'],'VerbTarget'=>['S(ell/ells/elling/old)','B(uy/uys/uying/ought)','Le(ad/ads/ading/d)','Contact(/s/ing/ed)','Merg(e/es/ing/ed)','Accru(e/es/ing/ed)'],'VerbActor'=>['B(uy/uys/uying/ought)','S(ell/ells/elling/old)','Establish(/s/ing/ed)','Found(/s/ing/ed)','Acquir(e/es/ing/ed)','Manufactur(e/es/ing/ed)','Pa(y/ys/ying/id)','Invest(/s/ing/ed)','Financ(e/es/ing/ed)','Liquidat(e/es/ing/ed)','Hir(e/es/ing/ed)','Employ(/s/ing/ed)','Insur(e/es/ing/ed)','Assur(e/es/ing/ed)','Organis(e/es/ing/ed)','Borrow(/s/ing/ed)','Len(d/ds/ding/t)','Loan(/s/ing/ed)','T(ake/akes/aking/ook)'],'Locations'=>['Cubicle(/s)','Filing Room(/s),Records Room(/s),Archive(/s),Machine Room(/s)','Staff Room(/s),Staff Lounge(/s)','Reception(/s),Lobb(y/ies)','Meeting-Room(/s),Board-Room(/s)','Toilet(/s),Wash-Room(/s)']]],
		);
		if ($name==''){
			//The Manifestation has no name so it has to generate one.
			//Expressions can be things like "Desi", or "The Temporal Accords", so we'll need to create them from the side or facet, or a name generator.
			$name=self::nameGenerator(array_rand(array_flip(['Desi','Sophia','Caitlin','Lorgas Rouman','Den Draper','Josephine Bloggs','Jo','John','Thor Odinson','Dale Ardent','Flash Gordon','Ellen Ripley','John Doran','Wayne Murray','Dave Dickinson','Alastair Brown','Lara Benbow','Desi Clary','Jamie Davison','Susan Anne Wilson','Jason Langham','Giles Stokes','Jennifer Stokes','Patrick Hegarty','Airam Wolfgangski','Dan Oldroyd','Benedict Osbaldeston','Dominic Osbaldeston','Benjamin Taxman','Teague','Michael Knott','Edward Bennett','Lisa Hark','Sarah Jane Smith','Christopher John Moseley','Melita Rogers','Hugo Weaving','Stiofán Dubhghaill','Emrys Gwillion','Ithaqua Jones','Nardan','Howard Phillip Lovecraft','Robert Anson Heinlein','Terrence David John Pratchett','Denethor','Finrod Felagund','Nyarlathotep','Cthulhu','Andrew Jackson','Alex Murray','David Klein','Victor Bogart','Penelope Angelica Hanover','Ian Rushdon','Cristobal Juan Mosugarley','Andy','Ben','Bob','Tim','Timothy Grainger','Jeremy','Jim Kirk','James Tiberius Kirk','Loui Daragos','Alexander','Jack','Jill','Mario','Alphonse','Alf','Alfred','Tina','Morgan Le Fey','Valerie','Kyle','Nathan','Imogen Williams','Ruby','Alan Moore','Topher Jackson','Tim Wilde','Leena Gildottir','Mark Caldwell','Brian Hudson','John "Hutch" Hutchinson','Kim Wilde','Peter Harrison','Simon Boone','Piers Pearce-Jones','Luke Kelphlun','Martin Newman','Andrew Cross','Andy Moran','Gareth Morgan','Hugh Lloyd','Rhodri Evan-Jones','Samantha Dickens','Tom','Thomas Beckett','Si','Mose','Hope','Evelynne','Evalyn','Rose','Lizzy','Liz','Lilian','Lilly','Ashley','Solomon','Howard','Loki','Luke','Kate','Jane','Janet','Kieran','Clement','Cleo','Jill','Rob','Kyle','Karl','Carl','Gino','Mario','Hugh','Hugo','Ruth','Beth','Bethany','Jean','Eve','Juliette','Blaire','Ann','Anne','Abby','Abe','Bill','Barry','Barbara','Bobby','Bunty','Chrissy','Christine','Carla','Camille','Cameron','Cam','Cat','Dog','Derek','Dennis','Den','Dan','Don','Donald','Daniel','Danielle','Danny','Danni','Dani','Dara','Dana','Darla','Eva','Edward','Ed','Edd','Eddy','Eddie','Eric','Erik','Fred','Frederick','Fiona','Freddy','Fi','Gideon','Giles','Gillian','Gewn','Gwendolyn','Honor','Harry','Iris','Ian','Joe','Joseph','Jeane','Kim','Kit','Kitt','Lynne','Louise','Lulu','Laura','Lara','Lana','Lala','Larry','Mo','Mike','Martin','Martang','Mart','Matt','Matty','Matthew','Mark','Marcus','Marc','Marco','Marline','Madeline','Netty','Nancy','Norbert','Norman','Nina','Norris','Nathan','Natalie','Nat','Nath','Orin','Otto','Orla','Oscar','Osric','Penny','Penelope','Peter','Pedro','Pablo','Paul','Pauline','Pauly','Pete','Pietro','Petra','Primrose','Polly','Quin','Queeny','Richard','Rick','Rik','Richy','Robert','Rob','Robin','Robby','Robbi','Riahna','Ricky','Rickie','Ricki','Roberta','Remmy','Romeo','Simon','Simone','Susan','Suzanne','Sue','Sarah','Sara','Sasha','Sacha','Sidney','Sid','Sophie','Tristan','Tristram','Terrence','Terry','Teri','Tina','Thomas','Tom','Tommy','Tommi','Timmy','Tim','Timothy','Ursula','Urane','Vernon','Vera','Vivian','Viv','Wayne','William','Will','Willie','Wallace','Wally','Wendy','Warwick','Wolf','Xena','Yvonne','Ygrain','Yves','Yani','Zuko','Zeb','Zack','Zachariah','Zebedee'])));
		}
		if ($facets==''){
			//number of facets... This based on the size
			$facets=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
			shuffle($facets);
			$facets=array_rand(array_flip($facets),$size);
		}
		if ($side==''){
			//No side set, set one (probably a higher one)
			$sides=self::RNG(0,round(1+(T13Boons::getBoonDraw(self::RNG(1,(2+$size*8))))));
			$side=T13Types::$conflictSides[$sides]['Type'];
		}
		if ($words==''){
			$words=$somewords;
		}else{
			$words=self::array_merge_recursive_distinct($words,$somewords);
		}
		foreach($facets as $i=>$facet){
			//$wordi=T13Facets::getFacetTitles($facet);
			$words['People']=self::array_merge_recursive_distinct($words['People'],T13Types:: extractSubArrays($words, 'People'));
			$words['Adjectives']=self::array_merge_recursive_distinct($words['Adjectives'],T13Types:: extractSubArrays($words, 'Adjectives'));
			$words['Nouns']=self::array_merge_recursive_distinct($words['Nouns'],T13Types:: extractSubArrays($words, 'Nouns'));
			$words['Verbs']=self::array_merge_recursive_distinct($words['Verbs'],T13Types:: extractSubArrays($words, 'Verbs'));
			$words['Locations']=self::array_merge_recursive_distinct($words['Locations'],T13Types:: extractSubArrays($words, 'Locations'));
			$words['Positions']=self::array_merge_recursive_distinct($words['Positions'],T13Types:: extractSubArrays($words, 'Positions'));
		}
		$expression=array('Name'=>$name,'Facets'=>$facets,'Side'=>$side,'Words'=>$words,'Description'=>$description);
		return $expression;
	}
	static public function array_merge_recursive_distinct(){
        if (func_num_args() < 2) {
        	trigger_error(__FUNCTION__ .' needs two or more array arguments', E_USER_WARNING);
        	return;
		}
	    $arrays=func_get_args();
	    $merged=array();
	    while ($arrays){
	        $array=array_shift($arrays);
	        if (!is_array($array)){
	            trigger_error(__FUNCTION__ .' encountered a non array argument', E_USER_WARNING);
	            return;
	        }
	        if (!$array){continue;}
	        foreach ($array as $key=>$value)
	            if (is_string($key)){
	                if (is_array($value)&&array_key_exists($key, $merged)&&is_array($merged[$key])){
	                    $merged[$key] = call_user_func(__FUNCTION__, $merged[$key], $value);
	                }else{
	                    $merged[$key] = $value;
	                }
	            }else{
	                $merged[] = $value;
	            }
	    }
	    return $merged;
	}
	static public function nameGenerator($example){
		$example=iconv('UTF-8', 'ASCII//TRANSLIT', $example);
		$consonants=['b','bh','br','bl','mb','b','c','cl','ck','qu','ch','ct','cz','d','dd','d','dr','dh','dj','f','ff','fh','rf','fr','fl','ft','f','g','gg','gh','rg','gr','gw','gt','\'','g','hn','hr','wh','h','j','jh','j','k','kl','kr','kh','k\'z','k','l','ll','lm','lk','lf','lph','lp','ld','ln','lt','lb','ls','l','m','mm','mh','rm','rc','rk','rck','rh','rt','rs','rg','rp','rr','rqu','r','m','n','nn','rn','ng','nk','nc','nl','np','n','pl','p','pp','pr','pt','ph','pw','p','q','r','rt','rs','rd','r','s','ss','sh','st','sn','sm','shl','shr','scr','sw','sp','spl','s','tch','tt','th','tr','thr','ts','tz','t\'k','t\'p','t','v','rv','lv','v','w','wr','wh','wn','w','x','y','yh','yr','yl','yt','z','zz','zw','zt','t\'k','gs','ks','ns','ds','bs','ws','mc','md','z'];
		$vowels=['a','e','i','o','u','y','ey','ay','ai','ae','ao','au','eau','ua','oo','ou','ia','ya','ee','aa','oa','uo','ui','ie','ei','io','oi','iu','yu','uy','iou','yi','uou','aio','oia','uia','ouia','oe','ea','o\''];
		$c=$consonants;
		shuffle($c);
		$v=$vowels;
		shuffle($v);
		$example=str_ireplace($vowels, $v, $example);
		$example=str_ireplace($consonants, $c, $example);
		return $example;
	}
	static public function selectFacets($size,$NoSides,$facets=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]){
		$facetsarr=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
		$fac=count($facets);
		$ret=array();
		shuffle($facets);
		if (!$fac%$size){
			$ret=array_chunk($facets,$size);
		}else{
			for($i=0;$i<$NoSides;$i++){
				if ($fac>$size){
					$ret[]=array_rand(array_flip($facets),$size);
				}else{
					$left=array_values(array_diff($facetsarr, array_keys(array_flip($facets))));
					$ret[]=array_merge($facets,array_rand(array_flip($left),$size-$fac));
				}	
			}			
		}
		return $ret;
	}
	static public function buildManifestation($name='',$hook='',$hook_aspect='',$facets='',$boon='',$description='',$words=''){
		if ($name==''){
			$name=self::nameGenerator( array_rand( array_flip( ['Desi','Sophia','Caitlin','Lorgas Rouman','Den Draper','Josephine Bloggs','Jo','John','Thor Odinson','Dale Ardent','Flash Gordon','Ellen Ripley','John Doran','Wayne Murray','Dave Dickinson','Alastair Brown','Lara Benbow','Desi Clary','Jamie Davison','Susan Anne Wilson','Jason Langham','Giles Stokes','Jennifer Stokes','Patrick Hegarty','Airam Wolfgangski','Dan Oldroyd','Benedict Osbaldeston','Dominic Osbaldeston','Benjamin Taxman','Teague','Michael Knott','Edward Bennett','Lisa Hark','Sarah Jane Smith','Christopher John Moseley','Melita Rogers','Hugo Weaving','Stiofán Dubhghaill','Emrys Gwillion','Ithaqua Jones','Nardan','Howard Phillip Lovecraft','Robert Anson Heinlein','Terrence David John Pratchett','Denethor','Finrod Felagund','Nyarlathotep','Cthulhu','Andrew Jackson','Alex Murray','David Klein','Victor Bogart','Penelope Angelica Hanover','Ian Rushdon','Cristobal Juan Mosugarley','Andy','Ben','Bob','Tim','Timothy Grainger','Jeremy','Jim Kirk','James Tiberius Kirk','Loui Daragos','Alexander','Jack','Jill','Mario','Alphonse','Alf','Alfred','Tina','Morgan Le Fey','Valerie','Kyle','Nathan','Imogen Williams','Ruby','Alan Moore','Topher Jackson','Tim Wilde','Leena Gildottir','Mark Caldwell','Brian Hudson','John "Hutch" Hutchinson','Kim Wilde','Peter Harrison','Simon Boone','Piers Pearce-Jones','Luke Kelphlun','Martin Newman','Andrew Cross','Andy Moran','Gareth Morgan','Hugh Lloyd','Rhodri Evan-Jones','Samantha Dickens','Tom','Thomas Beckett','Si','Mose','Hope','Evelynne','Evalyn','Rose','Lizzy','Liz','Lilian','Lilly','Ashley','Solomon','Howard','Loki','Luke','Kate','Jane','Janet','Kieran','Clement','Cleo','Jill','Rob','Kyle','Karl','Carl','Gino','Mario','Hugh','Hugo','Ruth','Beth','Bethany','Jean','Eve','Juliette','Blaire','Ann','Anne','Abby','Abe','Bill','Barry','Barbara','Bobby','Bunty','Chrissy','Christine','Carla','Camille','Cameron','Cam','Cat','Dog','Derek','Dennis','Den','Dan','Don','Donald','Daniel','Danielle','Danny','Danni','Dani','Dara','Dana','Darla','Eva','Edward','Ed','Edd','Eddy','Eddie','Eric','Erik','Fred','Frederick','Fiona','Freddy','Fi','Gideon','Giles','Gillian','Gewn','Gwendolyn','Honor','Harry','Iris','Ian','Joe','Joseph','Jeane','Kim','Kit','Kitt','Lynne','Louise','Lulu','Laura','Lara','Lana','Lala','Larry','Mo','Mike','Martin','Martang','Mart','Matt','Matty','Matthew','Mark','Marcus','Marc','Marco','Marline','Madeline','Netty','Nancy','Norbert','Norman','Nina','Norris','Nathan','Natalie','Nat','Nath','Orin','Otto','Orla','Oscar','Osric','Penny','Penelope','Peter','Pedro','Pablo','Paul','Pauline','Pauly','Pete','Pietro','Petra','Primrose','Polly','Quin','Queeny','Richard','Rick','Rik','Richy','Robert','Rob','Robin','Robby','Robbi','Riahna','Ricky','Rickie','Ricki','Roberta','Remmy','Romeo','Simon','Simone','Susan','Suzanne','Sue','Sarah','Sara','Sasha','Sacha','Sidney','Sid','Sophie','Tristan','Tristram','Terrence','Terry','Teri','Tina','Thomas','Tom','Tommy','Tommi','Timmy','Tim','Timothy','Ursula','Urane','Vernon','Vera','Vivian','Viv','Wayne','William','Will','Willie','Wallace','Wally','Wendy','Warwick','Wolf','Xena','Yvonne','Ygrain','Yves','Yani','Zuko','Zeb','Zack','Zachariah','Zebedee' ]))) ;}
		$geo=T13Geometry::getGeometryFromString($name);
		if ($hook==''){$hook=T13Dice::RNG(0,53);}
		if ($aspect=''){$aspect=T13Dice::RNG(0,53);}
		if ($facets=''){$facets=T13Dice::RNG(0,23);}
		$facet=array_rand(array_flip($facets));
		if ($boon==''){$boon=T13Dice::RNG(5,13,13);}
		if ($description=''){
			$description='This manifestation of the Plot is probably a Character, but might be a thing, most often they are characters They have a single Facet they are good at, and so sometimes you may want to combine them into a single character, but that is really up to the Yarn-Teller, Referee, or Weaver of the Stories. This one was created randomly by the system and has not yet been properly described. One day perhaps I\'ll have the budget to run an AI to write description texts that use the words it loads... You can help fund that by donating or buying my books. But until then you need to edit this text.';}
		if ($words==''){
			//this should pick the appropriate word from the 
			$words=T13WordChains::getFacetWords($facets);
		}
		return array(
			'Name'=>$name,
			'Geometry'=>$geo,
			'Hook'=>$hook,
			'Hook_Aspect'=>$hook_aspect,
			'Highest_Facet'=>$facet,
			'Highest_Boon'=>$boon,
			'Description'=>$description,
			'Words'=>$words
		);
	}
	static public function buildEmptyConflict($title='Unnamed Conflict',$type='Narrative',$NoSides='',$size='',$facets='',$post_id='',$statblock=''){
		if ($facets==''){$facets=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];}
		if ($post_id==''){$post_id=0;}
		if ($size==''){$size=T13Dice::RNG(1,24);}
		if ($NoSides==''){$NoSides=self::RNG(2,round(1+(T13Boons::getBoonDraw(self::RNG(1,(2+$size*8))))));}
		if ($statblock==''){$statblock=T13Statblock::randomiseStats(0,$post_id, intval(round(13*$size/24)),24);}
		$conflict=array(
			'Title'=>$title,
			'Type'=>$type,
			'Post'=>$post_id,
			'NoSides'=>$NoSides,
			'Size'=>$size,
			'Facets'=>self::selectFacets($size,$NoSides,$facets),
			'Statblock'=>T13Statblock::plotStats($statblock, $size, $post_id),
			'StatHTML'=>T13Statblock::writeStatblockSC($post_id),
			'Manifestations'=>[]
		); 
		for($i=0;$i<$NoSides;$i++){

			$conflict['Manifestation'][]=self::addSideToConflict($conflict,T13Types::$conflictSides[$i]);
		}
		return $conflict;
	}
	static public function buildTitle($facets,$size,$nosides){
	$titles=array();
	if (isset($facets)){
		foreach($facets as $facet){
			$facettitles=T13Facets::getFacetTitles($facet);
			if (isset($facetTitles)){
				$titles=array_merge($titles,$facetTitles);
			}
		}
	}
	$index=count($titles['Nouns'])+count($titles['Adjectives'])+count($titles['Verbs'])+count($titles['Positions'])+count($titles['Expressions']);
	if (is_array($titles['Nouns'])){
		$noun=T13Types::arrayGetValue($titles['Nouns'],self::RNG(0,$index));
		$second=T13Types::arrayGetValue($titles['Nouns'],self::RNG(0,$index));
	}
	if (is_array($titles['Adjectives'])){
		$adj=T13Types::arrayGetValue($titles['Adjectives'],self::RNG(0,$index));
		$other = T13Types::arrayGetValue($titles['Adjectives'],self::RNG(0,$index));
	}
	if (is_array($titles['Verbs'])){
		$verb =  T13Types::arrayGetValue($titles['Verbs'],self::RNG(0,$index));
		$verbing=T13Types::arrayGetValue($titles['Verbs'],self::RNG(0,$index));
	}
	if (is_array($titles['Positions'])){
		$position=T13Types::arrayGetValue($titles['Positions'],self::RNG(0,$index));
		$altpos=T13Types::arrayGetValue($titles['Positions'],self::RNG(0,$index));
	}
	if (is_array($titles['Expressions'])){
		$exp=T13Types::arrayGetValue($titles['Expressions'],self::RNG(0,$index));
		$expre=T13Types::arrayGetValue($titles['Expressions'],self::RNG(0,$index));
	}
	
	$patterns=array(
		"{$exp}",
		"{$exp} {$verb}",
		"{$adj} {$noun}",
		"{$adj} {$verb}",
		"{$other} {$noun}", 
		"The {$noun} &amp; The {$second}",
		"{$verb} {$noun}", 
		"{$verb} {$adj}",
		"The {$adj} {$noun}",
		"{$position} {$noun}",
		"{$noun} {$position} {$second}",
		"The {$verb}, {$adj} {$noun}",
		"Never {$verbing}",
		"The {$other} {$verbing} {$noun}", 
		"{$verb} {$noun} {$position} {$exp}", 
		"The {$noun} {$position} The {$second}",
		"{$noun} {$altpos} {$adj} {$second}",
		"{$position} {$noun}, {$altpos} {$second}",
		 "{$exp} {$position} The {$second}",
		 "The {$adj}",
		 "{$adj} &amp; {$other}",
		 "No {$verb}",
		 "{$exp} &amp; The {$noun} {$position} {$second}",
		 "The {$noun}'s {$second}",
		 "{$exp} vs {$expre}",
		 "{$exp} &amp; {$expre}",
		 "{$exp} {$position} {$adj} {$noun}",
		"{$exp}, {$expre}, And The {$adj}, {$other} {$noun}",
		 "{$expre} {$altpos} {$verbing} {$noun}"
	);
	//error_log ('patterns='.json_encode($patterns));
	unset ($titles);
	$title=array(T13Types::arrayGetValue($patterns,self::RNG(0,$index)),T13Types::arrayGetValue($patterns,self::RNG(0,$index)),T13Types::arrayGetValue($patterns,self::RNG(0,$index)));
	error_log('Suggested Titles: '.join(', ',$title));
	return $title;
	
}
	static public function buildNewConflict($size,$post_id,$scene=''){
	$facetsarr=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	$cf=$facetsarr;
	shuffle($facetsarr);
	$sides=ceil(1+(T13Boons::getBoonDraw(self::RNG(1,(2+$size*8)))));
	$title=self::buildTitle($facetsarr,$size,$sides);
	$facets=array_rand(array_flip($facetsarr),$size);
	$newConflict=self::buildEmptyConflict($title,'Narrative',$sides,$size,$facets,$post_id,'');
	
		// error_log('after plot stats ='.json_encode($newConflict['Statblock']));
		//$newConflict[
		error_log('New Conflict: '.json_encode($newConflict));
	return $newConflict;
}
	static public function addSideToConflict($conflict,$side, $facets='',$names='',$hooks='',$aspects='',$descriptions='',$words=''){
		//add a side to a Conflict
		if ($names==''){$names=[''];}
		if ($hooks==''){$hooks=[''];}
		if ($aspects==''){$aspects=[''];}
		if ($descriptions==''){$descriptions=[''];}
		if ($words==''){$words=[''];}
		$key=$conflict['NoSides']+1;
		if ($facets=''){
			$nofacets=T13Dice::RNG(round(intval($conflict['Size']/($key))),$conflict['Size']);
			$sides=self::selectFacets($nofacets,$key,$conflict['Facets']);
			$facets=$sides[array_rand($sides)];
			$facet=$facets[array_rand($facets)];
		}
		
		$boon = T13Statblock::getBoonForFacet($facet,0,$conflict['Statblock']);
		$side = array('Manifestation'=>self::buildManifestation($names[$key], $hooks[$key], $aspects[$key], $facets, $boon, $descriptions[$key],$words[$key]));
		
		return $side;
	}
	

}

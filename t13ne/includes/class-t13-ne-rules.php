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
 * Fired during plugin activation. Input Sanitizer
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    T13_Ne
 * @subpackage T13_Ne/includes
 * @author     CJMoseley <t13@cjmoseley.co.uk>
 */
class T13Rules{
	// rules at the moment are separated into rules pages, in a future model we may change this to store rules individually.
	public static $coreRules = array(
		array('RulePage'=>'Boons', 'Description'=>'<!-- wp:paragraph -->
<p>T13 uses a number system called Boons to convert "real world" values into game specific usefulness (like Card Draws or Dice Rolls for your Facets or Skill Annexes). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Boons are usually accessed directly on this table, looking up the equivalent Dice Rolls for any Boon. Sometimes you may be adding Values together and then looking up that Value on the table to find the Boon, this can happen when building Annexes, or when Characters work together very closely (it can for example be used to describe situations where coordinated groups work together in an Ordeal) </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="boontable" min="0" max="1000" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>When creating Annexes or Pact Descendants (see those pages for details) we typically add Values of Boons together to find a new Value. For example, if a number of Boon 13 Characters are working together, then we have only to multiply a Value of 66 by the number of characters, this new Value can be looked up on the table, where any Value over a Boon Value counts as the next highest Boon (e.g. a Value of 1 is still Boon 1 and a Value of 67 is Boon 14). 2 Characters working together will produce a Value of 132, the equivalent of Boon 21.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"t13ne-tablewrap"} -->
<div class="wp-block-group t13ne-tablewrap"><!-- wp:table {"className":"t13ne-table"} -->
<figure class="wp-block-table t13ne-table"><table class="has-fixed-layout"><thead><tr><th><strong>Number of Boon 13 Characters</strong></th><th><strong>Equivalent Boon</strong></th></tr></thead><tbody><tr><td>2</td><td>21</td></tr><tr><td>3</td><td>26</td></tr><tr><td>4</td><td>31</td></tr><tr><td>5</td><td>35</td></tr><tr><td>6</td><td>39</td></tr><tr><td>7</td><td>42</td></tr><tr><td>8</td><td>45</td></tr><tr><td>9</td><td>48</td></tr><tr><td>10</td><td>51</td></tr><tr><td>100</td><td>157</td></tr><tr><td>1000</td><td>874</td></tr></tbody></table><figcaption class="wp-element-caption">Multiple Average Characters working together</figcaption></figure>
<!-- /wp:table --></div>
<!-- /wp:group -->

'),
		array('RulePage'=>'Geometry, Gematria and Numerology','Description'=>'<!-- wp:paragraph -->
<p>In T13 names are important, this is especially true of Character names, which have a profound effect on how those Characters act and behave in the system. This is accomplished by using a specific system of Numerology or Gematria to calculate a specific set of numbers for every Character from the letters of their name.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This begins by taking the name the Character is known by and looking up the individual letters of the name, and adding those numbers together. When you have added all the numbers up you may end up with a pretty big number, you then add the individual digits of the number to together, and keep doing that, until you get a single number between 1 and 13 (although note that numbers over 9 offer you a choice of two Geometries to choose from.  E.g. Desi has 4+5+6+1 = 16 = 1+6 = 7 so Desi has a Gematria number of 7. We call this Gematria the Character Geometry Number.</p>
<!-- /wp:paragraph -->

<!-- wp:table {"className":"t13ne-table"} -->
<figure class="wp-block-table t13ne-table"><table><thead><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td></tr></thead><tbody><tr><td>A</td><td>B</td><td>G</td><td>D</td><td>E</td><td>S</td><td>O</td><td>Ch</td><td>Th</td></tr><tr><td>J</td><td>Bh</td><td>Gh</td><td>M</td><td>N</td><td>U</td><td>Z</td><td>F</td><td>Ts</td></tr><tr><td>Q</td><td>C</td><td>L</td><td>T</td><td>&nbsp;</td><td>V</td><td>&nbsp;</td><td>H</td><td>Tz</td></tr><tr><td>Y</td><td>K</td><td>Sh</td><td>&nbsp;</td><td>&nbsp;</td><td>W</td><td>&nbsp;</td><td>P</td><td>&nbsp;</td></tr><tr><td>I</td><td>&nbsp;R</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>X</td><td>&nbsp;</td><td>Ph</td><td>&nbsp;</td></tr></tbody></table><figcaption>T13 Gematria Table</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The first letter of the name (the initial) is used to calculate the Nascent Number. This is the Geometry that the Character returns towards when stressed. If the Nascent Number differes from the Geometry number then the number will add an Additional Stressor, which is another way that the Character will gain Stress. If the Nascent number matches the Geometry Number then the Soul or Facade Number may end up adding the additional Stress. For Desi the D gives a Nascent number of 4.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Next we calculate the Facade and Soul Numbers of the name. Facade Numbers are calculated from just the consonants of the name. Soul Number is calculated from just the vowels of the name. We generally consider a "y" as a vowel for ease of calculation here. The Facade number is how the Character presents themselves to the universe, and they also gain Chi like their Facade number dictates as well as their own Geometry. The Soul Number offers the Character a Soul Gift which is just like their normal Geometry Gift, but which costs them a point of Chi to activate.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Finally there are the Dissonant and Harmonic numbers which relate to musical modes and scales, to determine which numbers are harmonic with the Character and which are Dissonant. The Nascent, Facade and Soul may find a resonance in these numbers, with one or the other appearing as the Perfect Harmony or Sustained Dissonant when they can. Otherwise they are calculated in complex ways that you probably shouldn&#39;t attempt by hand. Instead, the system will do all those calculations for you and present you with all the data necessary. Here&#39;s a fully calculated example of Desi for you to look at.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="name" name="Desi" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Geometry has a powerful effect on the Character, deciding how each version of the Character (by name) gains Chi, Yin, Yang and what Gifts they have available to them. Which Character Geometries they will get on best with (the Soul Number or Perfect Harmony) and which they will not (the Nemesis Dissonant).</p>
<!-- /wp:paragraph -->'),
array('RulePage'=>'Facet Folio', 'Description'=>'<!-- wp:paragraph -->
<p>T13 like most RPGs abstracts real-world characteristics into something that we model in the game. In the most popular roleplaying games you find six Attributes or Stats that traditionally govern the Character’s Strength, Dexterity, Stamina, Intelligence, Wisdom and Charisma, but then add different mechanisms to determine how lawful, chaotic, good or evil a Character may be. In T13, Stats are actually created by combining the real hidden Attributes of the system.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>T13 uses 24 "Attributes" (although they are bound together to make opposed Pairs, and may be combined to create Stats that are used by Archetype Characters) that are known as Facets (as in the facets of the character) each Facet has a recognised Anti-Facet that opposes it, and for most Characters their rating in a Facet negatively impacts their rating in the Anti-Facet, automatically providing balance for high powered Stats. A Character with a 16 Boon in Awe is limited to a 10 Boon in Jeer, so they are a little more likely to intimidate or impress someone, than make them laugh. This balancing effect can be lost when using created Stats, where a Stat might contain both the Facet and its antifacet could be in the same or a different Stat.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Facet List</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->
[t13ne type="facet" facet="all"/]
<!-- /wp:shortcode -->
<!-- wp:html -->
<aside class="t13ne-rules t13ne-box">
<p><strong>Optional Rule:</strong> In some games, in order to make them more unique, or support a particular setting better, some Facets may have different Anti-Facets, for example, the Author may have decided that in their game, which features the spider-trickster god Anansi, that Gossamer is the opposite of Orthodox and Heresy the opposite of Burden. In such a setting, physical strength and knowledge of truth are opposed, one either goes to the library or the gym, and a Character is either comfortably well-off, or a liar or fantasist. Such changes can have profound effects on how the game plays, and how the world of the game feels during play. </p>

<p>Note that even more extreme changes can be made, where a Facet changes from Yin to Yang, for example if Wyrd became a Yang Facet opposed by Yin Jeer, the the Yang Liberty may be opposed by a Yin Awe. This could create a world where Chaos and Law are not opposed, but the laws of magic and man are allied with dreams and freedoms against the character’s inner emotional turmoil and potentially the spiritual worlds. </p>

<p>Such changes can be common in Tapestries that have Stats that break the normal Facet and Anti-Facet apart, although the original pairings still stand, they can be difficult to see through the fog created by the Tapestry Stats.</p></aside>
<!-- /wp:html -->'),
        array('RulePage'=>'I-Ching','Description'=>'<!-- wp:paragraph -->
<p>In T13 there is a reason that we consider some Sway Yin and some Yang, a reason that the Facets are split this way. That reason is the I-Ching or Book of Changes, which can be used to examine Characters and situations within the system to create greater depth and more interesting Characters.</p>
<!-- wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters are created by twelve pairs of Facets, much like a pair of Hexagrams is made from 12 Lines, each Hexagram being 6 lines long.  Characters can therefore create two Hexagrams by comparing their Yin and Yang Facet Boons. If the Character’s Yang Facet Boon is greater than the Yin Facet Boon that will create a Yang or solid line. If the Facets are the same the Player can choose or roll randomly.  Quest Hexagrams are completely different and to do with Quest spreads for cards (you can read more of them in the <a href="/card-spreads/">Card spreads</a> rules).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="bookofchanges" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>That table shows you the individual Hexagrams, and you can see largely how they work. Changing lines are the lines that change between Hexagrams (counting from the bottom as line 1 to the top as line 6). So if you go from a Hexagram that is all broken Yin lines to all Yang lines then all 6 of the Changing Lines will apply. If both Hexagrams match for a Character then they will instead of gaining access to the Changing Lines get a special unchanging I-Ching ability. Changing Lines also affect Quests and how they work, in a similar way.</p>
<!-- /wp:paragraph -->
            '),
		array('RulePage'=>'Tao Sway', 'Description'=>'<!-- wp:paragraph -->
<p>The least powerful form of Sway is divided into Yin and Yang, which together we call Tao Sway. Because it is the least powerful it is the most easily generated, often by Facet or Annex Dice Rolls. Although the I-Ching and Geometry can also grant a Character Yin or Yang as well. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Any generated Score is, at its most basic, the equivalent of either Yin or Yang, depending upon the action being attempted. So if you add Tao Yin Sway to a Yin Facet action each point of Yin will add +1 to the rolled Score of one of the dice.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, if Josephine Bloggs tries to Search a crime scene for clues, she could roll her Key Facet Dice (4d3-3) which can roll between 1 and 9 and will average at 5. This generates between 1 Yang Sway and 9 Yang Sway depending on the dice roll. This is the typical way that Tao Sway is created by Facets, as an obvious burst of purposeful or receptive energy.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is possible that a Character may wish to generate a less obvious burst of energy, perhaps trying to accumulate Sway for some purpose. The Difficulty of this roll is usually set at 2 (Spot Obvious Test), a Character can conceal this Sway accumulation by increasing the Difficulty to generate Sway they also increase the Difficulty to Spot that Sway generation. For example, a Character could set the Difficulty to 8. Only accumulating Yin or Yang on rolls of 8 or higher. Which would also set the Difficulty to spot the Action to 8.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Gaining Tao Yin &amp; Yang from I-Ching or Geometry</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="t13ne-wrapper">
<div class="t13ne-tablewrap">
<table class="t13ne-table t13ne-sway">
<thead>
<tr>
<th>Type</th>
<th>Tao Sway Gained from I-Ching / Geometry </th>
<th>Maximum Tao Sway Stored</th>
</tr>
</thead>
<tbody>
<tr>
<td>Patterns (Descendant / Extra) </td>
<td>1</td>
<td>Master Annex Maximum Dice Roll for both Yin and Yang</td>
</tr>
<tr>
<td> Grunt / Goblin</td>
<td>1</td>
<td>Stored on Facet Boons as Facet Sway</td>
</tr>
<tr>
<td>Hero / Demon</td>
<td>Personality Annex Draw (Boon Double Reduced)</td>
<td>Stored on Facet Boons as Facet Sway</td>
</tr>
<tr>
<td>Yarn-Teller / Demon-Lord</td>
<td>Personality Annex Score (Boon Reduced)</td>
<td>Stored on Facet Boons as Facet Sway</td>
</tr>
</tbody>
</table>
</div>
</div>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Patterns (which include Descendants and Extras) can only store as much Tao Yin and Yang as their Master Annex’s maximum dice roll. So an Extra Character with a 3d6 Master Annex could Store 18 Yin and 18 Yang maximum. For a Grunt Character each Boon of a Yang Facet can store 1 point of Yang and vice versa for Yin. These Boons are affected by the Character’s Scale so more powerful Characters can usually store more Sway. However, it should be noted that once stored in this way Tao Sway becomes Facet Sway, which can behave quite differently to Tao Sway, unless it is always Banal.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters can also store their Tao Sway in Descendants that they own. Although this usually creates Chi in the Descendant. See the Rules on <a href="/patterns/">Patterns</a> which include Extras and Descendants.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Sway Table</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Sway Table is where this information comes together and you can look up how much Tao Sway / rolled Score is required to do something. This allows you to calculate Difficulties. Generally, if you are working with Tao Sway it will usually be considered Banal, whatever it is trying to accomplish, but this may be modified by the Yarn-Teller or Referee as required by the Tapestry. Rolled Facet Scores are even more likely to be modified, with the Tapestry affecting whether a Difficulty should be calculated from Banal, Intrepid, Bold or even Monstrous and Twisted Sway effects.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->

'),
		array('RulePage'=>'Facet Sway', 'Description'=>'<!-- wp:paragraph -->
<p>When Tao Yin or Tao Yang is stored on a Facet it is changed to become Facet Sway. Each Facet has its own name that it calls its own Sway, and a special optional rule that may be used, if the Facet is particularly potent. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Sway"/]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Facet Sway Potency</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13, Facets can vary in Potency relative to each other. Consider an Artificer character and a Wizard, in one world they may both use Craft to do their thing.<br/>If the Wizard can throw a fireball with his magic, then the artificer can build and throw a bomb with his. <br/>In another world the Artificer uses Craft, but the Mage uses Heresy, now it is not so obvious if the Artificer can throw a bomb, just because the Wizard can throw a Fireball. In fact, unless we know the relative potency of the two Facets we cannot tell who is the more capable.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="facetSwayPotencyTypes" title="Facet Sway Potency Types"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Facet Sway points can be treated differently depending upon the Game, Character and Tapestry rules. For example, in games with Fæ it is not uncommon for Axioms to be used to empower magic as though the Axioms were Bold (or even Monstrous), in most Tapestries Axioms are only Bold when working in courts of law. In a rough and tumble frontier setting, Axioms may only be Intrepid, even for legal use, and in a lawless super-villain game we might would expect Axioms to always be treated as Banal.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Narrative as well as the setting can effect which Facet Sway we consider Banal, Intrepid, or Bold. If the Conflict involves Dominion oppressing Nature then it would be reasonable for Dominion’s Support to be Intrepid or even Bold, where as Nature’s Health may be treated as Banal, or perhaps Intrepid compared to that Bold Support. </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Altering Facet Potency</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Typically Facet Potency is defined for an "Era" within a Tapestry, so altering Facet Potency would indicate a change of Era. What do we mean by an Era? An Era is a period of time that has something about it that ties the period together (this is not a Geological Era). Generally the shortest period of time that can be called an Era is a Decade (66 Pips), and most social Eras are actually 60 year long Revolutions (83 Pips), but all Eras begin with a single Season (32 Pips).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normally altering Facet potency should mean a change of "Era", and this does somewhat hold true, however to paraphrase William Gibson, "Eras are not evenly distributed." Some places can be a part of a new Era before other places have even really joined the last one. So this tells us that an Era must affect a minimum sized area, the size of a Large Town (32 Pips) seems appropriate here, with an Era appearing where ever the discovery was made, and then spreading from there with time.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Fundamentally, the decision to create a new Era lies with the current Yarn-Teller, and the repercussions can be pretty bad, so other Yarn-Tellers can ignore the new Era in their narratives until everything is settled, and it seems appropriate to adopt it themselves. That isn’t to say only a Yarn-Teller can alter Facet Sway potencies, but they and the Referee will be signing off and narrating it, so... yeah.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Changing Facet Sway potency is a Mutate Change (32 Pips), it must last a Season at least (32 Pips) and affect at least a Large Town (32 Pips). Which makes the Difficulty either (96 Pips) 2294 Score or (32 Pips) 289 Score depending upon the dice system you are using. Which is 8-16 Yarn for a Yarn-Teller if they wanted to do this.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Facet to Facet Conversion</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Conversion of Facet Sway between types alters with the types of Characters that you are using, and the style of game play being used.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Sometimes you want to convert Sway between different Facet Sway. How this happens is based on the genre of the Game and the Characters doing the converting, as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="facetSwayConversionTypes" title="Conversion Types" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Generating Facet Sway</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Creating Facet Sway is as easy as storing Tao Sway. Dice rolls for Actions generate Scores and these are converted Directly into Tao Sway Scores. Roll a 12 and that is 12 Tao Sway, which when stored creates 12 Facet Sway. However, this means when a Character is, for example, using a Healing Annex to generate Health directly. That rolled 12 Tao Sway could become the equivalent of a roll of 877, for free by becoming Monstrous Health, Bold Health is the equivalent of 59 Score, and even Intrepid Health would be the equivalent of a roll of 21.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Directly generating Facet Sway can have a profound effect, not just on the Scores generated, but on how we calculate Difficulties and determine the outcomes of rolls. If Joe Bloggs is using Key to Search a room, then how powerful Key is is going to determine what Joe could find in the room. Let’s say Joe rolls a 6 on a Key check. If Key is Banal that 6 allows them to spot something Overt or Recognizable. If Key is Intrepid that 6 lets them spot something Ambiguous. If Key is Bold that 6 spots something Inconspicuous. If Key is Monstrous then Joe could spot anything despite a Blatant distraction going on.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are a number ways you can look at and handle this Generated Facet Sway. Which you use will depend upon the settings and stories that you are trying to run, high simulation and grounded realistic games will be grounded, but for a giant Mecha, super-humans, or Kaiju story you might want to allow some of this nonsense.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Grounded</strong> — Intended to be gritty and narratively realistic. This is hard-boiled detectives, gritty vigilante, and grim-dark low-fantasy vibes. <ul><li>Dice rolls can only generate Tao Sway directly.</li><li>Converting Tao Sway to Facet Sway takes 1 Phase (not one Moment). Sway is not converted until the next Phase.</li><li>Conversion is Fixed, once you have created Facet Sway it is stuck as Facet Sway unless converted to Chi.</li></ul></li><li><strong>Pragmatic</strong> — Mostly grounded, but prone to the occasional ridiculousness for narrative reasons. This is where gritty cinema and most literature lies.<ul><li>Dice rolls can only generate Tao Sway directly.</li><li>Tao Sway can be converted to Facet Sway during the same Moment (character Action).</li><li>Facet Sway is usually Transferable, but can vary.</li></ul></li><li><strong>Romance</strong> — Intended to step away from the more realistic, and into a vague fantasy realm. This is where a lot of movies (especially Action movies) and genre fiction lies.<ul><li>Dice rolls can generate Facet Sway directly, but usually create Tao Sway.</li><li>The Difficulty to generate Facet Sway varies by type, (see above).</li><li>Conversion between Facets is usually Fixed or Transferrable.</li></ul></li><li><strong>Quixotic</strong> — Intended for high-fantasy, high concept science-fiction and comic-book super-heroics. <ul><li>Dice rolls generate Facet Sway or Tao Sway as required. Typically Facet Sway is generated.</li><li>Difficulty to generate Facet Sway is 1 for Banal, Intrepid and Bold, but Monstrous uses Diff 8.</li><li>Conversion is usually Transferrable, although some Characters may access Færy or Mercurial Conversion.</li></ul></li><li><strong>Fairy-Tale</strong> — Intended for the highest fantasy, or most mundane mythologies.<ul><li>All Dice rolls generate Facet Sway and not Tao Sway or Scores.</li><li>Difficulty to generate Facet Sway is always 1.</li><li>Conversion between Facets is always Færy or Transferrable.</li></ul></li><li><strong>Legend</strong> — Intended for the most incredible and unbelievably fantastical mythologies.<ul><li>All Dice rolls generate Facet Sway and not Scores or Tao Sway.</li><li>Difficulty to generate Sway is always 1.</li><li>Conversion is usually Mercurial for most Characters.</li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Sway Table</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Sway Table is where all this information comes together and you can look up how much Facet Sway is required to do something. Remember that the Yarn-Teller and Referee decide whether the Facet Sway or Score is Banal, Intrepid, Bold, Monstrous or Twisted in the circumstance that you are using it, depending upon the character, genre and setting.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->
'),
		array('RulePage'=>'Chi', 'Description'=> '<!-- wp:paragraph -->
<p>Chi is a the middle-tier form of Sway, created by adding together points of Tao or Facet Sway. Chi is much more powerful than Tao Sway because of this, and allows Characters that can store and manipulate it to modify aspects of reality as well as themselves.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>1 point of Chi is technically created by adding 1 Yin to 1 Yang, but since Yin and Yang contain their own opposites in small amounts, you can also create Chi from 2 Yin or 2 Yang. When converting Facet Sway (or larger amounts of Tao Sway) into Chi the Referee has a choice of methods. It should be noted that the Ref can extend this Banal-Intrepid-Bold power dichotomy to how Annexes work too (with variant rules such as, Skills are Banal unless both Facets match, Powers would be Intrepid unless Root and Channel match then they would be Bold, Super-Annexes are always Bold), and these power states can exist together, so some actions may be Banal while others (often as technologies are invented and commercialised) are Intrepid or Bold. Commonly, what is Banal, Intrepid or Bold for each Facet changes with the Era, if everything technological is Banal during the Stone-Age (except working Stone), then crossing the Atlantic is very difficult and will take weeks if not months. By the modern era you can purchase a ticket and fly in hours, which is definitely Bold, although boat technology is still only Intrepid. In some universes, Magic begins Bold (or even Monstrous) during the golden-age, but falls off in power to an Intrepid medieval silver-age fantasy, or even a Banal "no magic" Grim-dark bronze or iron-age setting.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Banal</strong>: In a Banal game the points of Tao Facet Sway are Reduced, just like a Boon is Reduced to find a Score. So converting 66 points of Yin would generate 13 points of Chi. For a Banal, historical-fantasy, modern thriller, twenty-minutes-in-the-future sci-fi or cyberpunk game (which is more realistic and simulationist) where the Characters are more likely to be Grunts or occasionally low-powered Heroes) the amount of Chi that can be generated by rolling dice is very low, and Difficulties are all calculated for Tao Sway. Getting almost anything difficult done will require an Ordeal.</li><li><strong>Intrepid</strong>: In an intrepid game, such as a heroic, sci-fi or low-fantasy game, characters are generally Heroes, Fae hybrids (or commoners) or some Bulmäs Characters. Facet Sway (and Tao Sway if all Facets are Intrepid) are halved to create Chi. Difficulties are generally a little lower for Characters in Intrepid games, only twice the Pips Difficulty. This is the normal mode for most mid-power genre-mashing T13 games, dice rolls can get you most things, Ordeals are necessary for powerful stuff.</li><li><strong>Bold</strong>: In a Bold campaign you are dealing with super-heroics, space-opera or high-fantasy and Facet sway is equivalent to Chi. If all Facets are Bold then Tao Sway is also equivalent. This is how the strongest super-heroes, færy nobles, arch mages, Yarn-tellers, some powerful Bulmäs and most Plots operate. Difficulties are calculated as Chi or Pips and much more is possible with even a Facet roll. This style of play is great for Omniversal Yarn-Teller games, as it allows more to be accomplished with a single roll, reserving Ordeals for serious business.</li><li><strong>Monstrous</strong>: In a Monstrous campaign you are dealing with extreme genres, such as Kaiju-heroics, weird science-fiction, Grimdark and Eldritch fantasy and Mythic-sagas. Monster Facets are augmented, often using their Super-Value rather than Value, Value rather than Boon, Boon rather than Score, and Score rather than Draw. Characters with Monster Facets can convert Facet Sway and those Facet Rolls (including Annexes that Channel through that Facet) into Yarn directly, allowing them to perform incredible feats that can easily involve gods dying and stars being torn apart as part of the sideshow, usually though the Monster is cruelly focused on the protagonists.</li><li><strong>Twisted</strong>: Twisted Campaigns are dark tortuous horror shows with Patron D&aelig;mons directly involved, celestial pantheon soap-operas, or something else, equally weird. This is the realm of Mythology, Weird-Fiction, Cosmic Horror and Loony Toons story-telling, and is actually where Plots live. Facet Sway and Scores, as well as Difficulties, for the Twisted Demons and weird beings, can be converted directly into Twists at this level, creating incredible situations becomes relatively easy when even one Proficiency Die could open U-space, travel 5 million years, affect a large planet, or create Carnage+ Wounds at low Stakes.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>It should be noted that in T13, while your Campaign may be Twisted or Monstrous, most Characters will be limited to only being Bold in that setting. Likewise even in a Banal setting Monster Facets add a benefit, but they probably are not truly Monstrous, but could be at least Intrepid, or more often Bold. For Intrepid games it is very common to have a few abilities and Characters in the setting be Banal or Bold instead of universally Intrepid, and Monsters are always at least Bold or Monstrous. Demons and Goblins are usually Twisted, although they are more commonly used as simple Monsters in fantasy, where they may be only Bold or Monstrous occasionally (in fact Goblins are often depicted as Banal), however most fantasy demons and goblins are not true Demons or Goblins which should be rarely and carefully used, even a humble Goblin can destroy any Banal Intrepid or Bold campaign, if the Yarn-Teller is not paying careful attention.</p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h3>Chi and Character Types</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Chi is the divine breath that powers all living things, and as such can be manipulated to create great works, living beings, and even Divine magical effects (although not often at Intrepid power levels). It can only be directly manipulated by Hero characters such as Mercari, Paradox Warriors, Adult Bulmäs, or Yarn-Tellers such as Solos, or Doom-Weaver Monsters like the Fae.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Chi can be stored by Characters according to their type. The type of the Character also governs how much Chi they Gain from a Chi Gain event (such as a powerful success or Personality Chi Gain).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="chiClass" title="Character Chi Classes"/]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h3>Rolled Chi</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is also worth noting that when creating Chi with an Annex, the Difficulty is set at 2 (or 1 if a Bold Facet) and the Score rolled may be Halved (for Intrepid Facets) or Reduced to find the Chi generated (for Banal Facets). So if Jo Bloggs wants to generate Chi and uses her "Working Hard" which channels through Rook and rolls 14 (Diff 2 beaten by 12), that grants 6 Chi in an Intrepid Rook game (halving the 12 available if the game had Bold Rook) or 4 Chi in a Banal Rook game (Reducing the 12)).</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Sway Table</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Sway Table is where all this information comes together and you can look up how much Chi is required to do something. Difficulties of tests can of course vary as usual based on the character, setting and genre as the Referee and Yarn-Teller decide.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->
'),
		array('RulePage'=>'Yarn', 'Description'=>'<!-- wp:paragraph -->
<p>Yarn is as far above Chi as Chi is above both Yin and Yang. Yarn can directly manipulate reality, change history, ignore or alter physical snd narrative laws, allowing Characters to step between worlds, or even create new side-step universes. Yarn is super-condensed Sway, arguably the most refined form (although Yarn can in some cases be further refined to create Twists). </p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Normal Yarn</strong> — normal Yarn is what the transdimensional beings such as Gestalt Mercari (those who are aware of their alternate existences in other times and universes), Solos (who are unique beings across the multiverse), or Yarn-Tellers use to manipulate reality. They can use Yarn to directly manipulate narratives, creating objects, Characters or even Universes from nothing, as they will. Normal Yarn is the power of true Magic, able to carve existence to the magician’s will, and actually exists within all living beings even Extras (although usually not as much). Normal Yarn is usually Intrepid, but can be Banal for some instances.</li><li><strong>F&aelig;ry Yarn</strong> — F&aelig;ry Yarn includes an extra point of Chi and either Yin (for Seelie) or Yang (for Unseelie) in each point of Yarn. It can only be created by those of powerful Fae bloodlines (or by extremely powerful magics such as divine magic). F&aelig;ry Yarn is capable of everything that Yarn or Twists are capable of (although F&aelig;ry Yarn must be Reduced yet again to create Twist effects). Seelie (Yin) F&aelig;ry Yarn is considered Blessed, Divine or Angelic within some contexts, and may be called Divine Yarn instead. Unseelie (Yang) F&aelig;ry Yarn is sometimes considered Malevolent, Diabolical or Demonic, and may be called Devil Yarn. Actions enhanced with F&aelig;ry Yarn is always Monstrous when it matches "flavour" with what is being attempted, and is usually Bold when opposed, so a Seelie character will have higher difficulties attacking with Yarn than an Unseelie character, but a much easier time defending.</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>It is worth noting that Yarn cannot be "stored" exactly, as it is converted into Chi (and sometimes Sway) when Stored. This also complicates spending Yarn, if you are full of Chi then you might have perhaps 20 Yarn (131 Chi), if you choose to spend a point of Yarn then the amount of Chi you must spend isn’t 2 points of Chi, instead it is 10 Chi, which reduces you to 19 Yarn (121 Chi). Yarn always works this way, coming off the top. Conversely, gaining Yarn also works the same way, gaining 1 Yarn when you have 19 already gives you 10 Chi not just 2. It is because of this effect that even when Grunt Characters die they release all their stored Chi as a burst of Yarn, that may allow them a final sacrificial Success. Such events are usually marked as at least a Crux event if not a Causal Nexus or worse.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Reality Manipulation For Beginners</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yarn can be used to directly manipulate reality around a Yarn-Teller. They can make statements, and by backing those statements up with (enough) Yarn they can make them real. You can change anything about the world at any time, but so can every Yarn-Teller in the world, so if you change something someone else doesn’t want changed, you will have to put more Yarn into what you want than they can put in to stop you. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, during play Donna the Yarn-Telling Assassin needs to enter a large building (4 Yarn), rather than walk around, she declares that the building is painted yellow (the colour of her coat), that would be a Cosmetic Change (1 Yarn) to the building (4 Yarn), and that there is a room on this side of the building that has a fire-exit that doesn’t lock properly, a Distort Change (2 Yarn) to a Room (2 Yarn).  This means that the minor cosmetic change costs 5 Yarn, the new fire-exit would cost 4 Yarn. Donna could pay 9 Yarn and in the building, the CEO, who is also a Yarn-Teller, would feel the changes, and be able to cancel it for 9 Yarn. Donna would have to force the issue then, by adding more Yarn, or she can be cunning and from the beginning pay only the 5 Yarn for the Cosmetic change. Because the 5 Yarn is enough to do the Fire-exit anyway it covers that expense too. It also allows the CEO to deny the colour change for only 1 Yarn (the actual Cosmetic change), letting the other 4 Yarn still happen, as the CEO figures that the change only targets the building. In fact, these 4 Yarn can still make the change to the room and the CEO won’t even notice. Of course, if the CEO was going to spend 5 Yarn then we would be back into adding more Yarn again.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normally people can notice that a building has suddenly changed colour, or that the architects for some reason put a fire-exit in a bathroom stall. This can lead to clues that Yarn-Tellers have been active, which other Yarn-Tellers can sense, and obviously counter. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Because of this there are a number of different methods that a Yarn-Teller can use to hide their manipulations.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Side-step</strong>: Why bother changing the universe around you if there is a perfectly good one nearby that already has the changes you need? Side-stepping to that universe solves the problem, you don’t have to worry about some Yarn-Teller stopping you, you just go where it is already true, do what you need to and then pop back again. Getting back either means paying the same cost again or limiting how long you side-step for. A Side-Step costs 1 Yarn, but Chi can be used to create an Extend Duration that will send you back when it is over.</li><li><strong>Quantum Swap</strong>: Why go to the trouble of side-stepping yourself to another universe, if you can just side-step the thing you want to change with one from that universe. Quantum swapping usually involves swapping something like a building here for one in another universe, so you have to pay for an extra target. Usually this cost is covered by 1 extra Yarn. However, during a Quantum swap, other minor details such as pieces of art, movie quotes, brand logos and so on, will also randomly swap between the worlds. This can cause "Mandela Effects" (where normal people remember the world in the old configuration) that may lead to even some Grunts being aware that something has changed. </li><li><strong>Retcon</strong>: A Retcon is when you change something so that it was always that way. This simply adds 2 Yarn to the cost for a minimal change, such as altering the spelling of a name, and most Retcons where a Character’s personal history changes add 4 Yarn, but an Extreme Retcon, where all of History is changed (such as "the Asteroid missed the Earth, Dinosaurs never died out") will add 7 Yarn to the cost. Retcons change the past around the Yarn-Teller that makes them, if they want some other people to not be affected they will have to pay for those Targets to ignore the Retcon. Mercari and other Yarn-Tellers may pay this ignore cost themselves if the change is in some way important to them. For example, the owner of a building may very well be aware of the colour of their building, as would anyone who lived opposite the building, when they first encounter the building after the Retcon they will have the option to accept or ignore the Retcon (and pay).</li><li><strong>Flip-Flop</strong>: A Flip-flop is a technique where something is changed, and then sometime later changes back. Flip-Flops can be a very powerful way of hiding a change, perhaps the change is only true for a second or two. The Flip-flop must be given a Duration (usually 1 Yarn as this covers 1 second to 1 moment (90 seconds ish) although obviously this can be longer and while specified in Chi is paid in Yarn). Cancelling the Flip-flop is possible, but unless they know the exact Chi Duration that the Flip is happening for, another Yarn-Teller runs the risk of cancelling the Flop, and not the Flip, especially if they notice something is changing, but don’t know exactly what is going on. Cancelling a Flip-Flop requires exactly matching the Duration of the Flip-Flop, otherwise the Yarn-Tellers cancelling a Flip-Flop can leave the universe (or at least the people in it) confused as to which way around it should be, causing a situation that makes things change between the two states almost randomly.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Sway Table</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Sway Table is where all this information comes together and you can look up how much Yarn is required to do something. Yarn is usually used by the Referee, Yarn-Tellers, and some Monsters as the fiddly details of the setting, genre and characters have little impact at this level of abstraction and power. Who cares how Difficult the lock is to pick if you can rearrange reality so doors were never invented, or you are tall enough to stamp on the building the door is in.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->'),
		array('RulePage'=>'Twists', 'Description'=> '<!-- wp:paragraph -->
<p>Twists are a narrative power like Yarn, subverted by the Increated to grant themselves some measure of existence. Twists are at once the ultimate refined and condensed form of Sway, and are not Sway at all, from another perspective. While Twists can be spun from Færy Yarn (by Reducing the Yarn you get the number of Twists generated), they are technically not a refined form of Sway. Twists are most similar to Shocks, the most powerful form of Stress that a Character can hold, but it is hard to say if this is because Twists are inherently shocking, or if the Shock created the Twist.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If Sway allows living beings to push reality around, and influence existence, Twists are like a cheat-code used by the Increated to break those rules, they were intended to be the most powerful forms of Narrative Magic only usable by beings like Færy Royalty, Angels and Gods. For this reason, they were built to exist only momentarily, creating whole changes in the Tapestry without a need to make sense. The Increated create Twists more easily than they do Sway, and so value Sway much more highly than Twists alone, as Twists can never be converted back into other Sway forms.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Increated like existing, and they have discovered tricks to helping them do it. The greatest of those tricks was leveraging human beliefs, magical and occult knowledge, and Twists to grant themselves semi-existence. The second greatest trick they discovered was that they could fuse their beings with living beings who had reasons to invite them in. Characters with Hitches so bad that they are known as Woes draw Increated to them, from the fleeting sub-animal intellects of the Neechies to the incredibly powerful and practically existing, by sheer force of belief, Patron D&amp;allig;mons, and everything in between.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For this reason Characters with a Woe Hitch find themselves generating Twists with their Woes. They may also end up with an Alt who is an Increated and may add Lores or Nightmare Forms (depending on the genre and Character Arc), or if the Increated was just one of the local Neechies then there will be no Alt to speak of. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Twists can only be stored on Hitches, usually one point per Hitch, but in extreme cases one per Ruin may be possible. Stored Twists have the following effects on the Hitch and Character. There is a hard limit though, no Character can ever generate or spend more than 28 Twists in one go. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>While Twists can only be stored on Hitches, it is possible to gain more Twists than your current number of Hitches. When this occurs additional Twists can be converted to Shocks, Yarn, Chi or Sway as the Character wishes. It should be noted that Shocks stored this way should still Shock the Character (although note below on Shocking Twists).</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>The Hitch Will effectively gain a Bane when a Twist is stored in it, this does not otherwise affect the Hitch.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Storing a Twist on a Hitch will add a Twisted Facet effect (see below).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>one of:<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Sense that Hitch (within Hitch Bane as Chi Location on The Sway Table) automatically. Spending 1 Chi the Location may be calculated as Yarn instead. E.g. A character with Arachnophobia x15 can detect another arachnophobe (and potentially anyone with any phobia or Irrational Hitch) within a building, paying 1 Chi will extend that range to a Large City.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Tone affinity. The Character can draw a Wyrd Tarot/Yarn Card or Ordeal card any time they act in accord with their Hitch’s Facet Tone. E.g. That Arachnophobe can draw a card any time they act Emotionally.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>+1 Wound / Success Level with the Hitch Facet Attack type. E.g. Arachnophobia would grant a +1 Level to Duck attacks.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>May change to the Hitch’s Facet Incarna for a duration equal the Hitch Banes as Chi on the Limit Duration table for free. Chi may be spent to extend the duration (costs as Chi Extend Duration). E.g. Our Arachnophobic Demon can turn into a Spirit (Ka) for a moment (3 Rounds). </li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Twisted Facets</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Twists were never meant to have a continued existence, they were meant to be momentary existing bursts of magically created and focused Faery Yarn, they were not mean to be stored, and were certainly not meant to be stored in living beings. Because of this when a Character with a Woe makes a Gain by having the Hitch trigger, and they should gain a huge amount of Yarn (or Shocks), but don\'t because the Increated takes that Sway and swaps it for Twists instead. So the Character ends up storing Twists in themselves on their Hitch. This alters the Character immediately giving them a Twisted Facet.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetaspects" suit="all" aspect="Twisted" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Twists are always considered high-powered, and while costs in Twists may appear as halves or even quarters you cannot split a Twist, or spend a half Twist, but you can combine two half costs into a whole point and do two things at once. Twists can achieve specific things that Yarn cannot, such creating Dark Territory, Dark Matter, Never-Time and Dark Pacts.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Twist Effects</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li><strong>Sway Multiplication</strong>&nbsp;— Multiply any singular Score or Sway by 1+Twists spent.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><strong>Twisted Assault</strong>&nbsp;— Twists can be used to enhance any attack you are currently making. 1 point of Twist will let you add a card from your Ordeal Pool, 2 points lets you Pull, play and make Unsoakable 1 Card.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><strong>Ignore Facet</strong>&nbsp;— Twists spent allows you to ignore all aspects of the specified Facet for a Twist based Duration. Spending 1 Twist will allow you to ignore all aspects of Burden (for example) for 1 action (perhaps allowing them to step through a wall of solid rock, or ignore the price of something and pay with a bean), 6 Twists would allow you to ignore Burden for a Week. A Character or Dark Matter Descendant that is Ignoring a Facet can still generate a score in the Ignored Facet i.e. a Character who is ignoring Rook (and hence Defences) can still generate a score to defend themselves or others (but they won’t need to versus a Quash attack).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><strong>Sway Vampirism</strong></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1d2 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1d4 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1d6 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1d8 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1d10 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1d12 yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>2d6 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>4d3 Yarn etc... to a maximum of 14. 4d6 Yarn</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><strong>Twist Fate</strong>&nbsp;— Twists can be used to create new events and even Characters much like Yarn. However, Twists can also break some of the rules of reality and do things like introduce things that shouldn’t exist in the universe, like temporal paradoxes, genre-mashed magical effects in a hard-science universe (or vice-versa). However, anything created or summoned by Twists is non-permanent, it must continually pay to have its existence extended, and these Extend Durations must be paid in Sway, Chi or Yarn, never in Twists. The effects of Twisted Fates are permanent though, a Burn Wound caused by a momentary, magically-summoned flame still lingers after the flame has ceased to be.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><strong>Negation</strong>&nbsp;— Negation is possibly the most powerful of the effects that Twists can have. Negation allows Twists to be used to cancel anything, a powerful Demon-lord could use Negation to cancel the last year of history, winding time back for the whole world. Negation costs Twice the normal Twist cost for whatever you are trying to achieve. Negating a Year (3.5 Twists), for a whole world (6), would cost 19 Twists total, negating the last attack performed on you (a 25 Pip attack for example) would cost 5 Twists.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li><strong>Shocking Twists</strong>&nbsp;— Twists and Shocks are almost the same thing. A Goblin or Demon can spend 1 Twist to convert all their Shocks into Twists. Demons and Demon-lords can sometimes do this to others, either draining the Shocks as their own Twists or creating new Goblins or Demons. Twists can also be used to create Shocks in a Character or Descendant, usually this is a result of what the Goblin or Demon did, but it can just be a direct transfer. Most importantly any Character with any Twists currently Stored can act when they have Shocked Dice (although they cannot use the Shocked Dice for their normal rolls they can use other Dice for their normal uses).</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Gaining Twists</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Twists are usually gained by triggering a Woe, when the Sway Gain that should take place is hijacked by one of the Increated and a Twist is offered instead. But Twists can be generated by an Annex (usually at 1 or 2 points at a time) as it is possible for F&amp;aelig;ry Yarn to be spun into Twists, by Elven magick (Reducing generated Yarn - see Yarn generation in the Yarn Rules). However, there is one other way that Increated, and some Goblins, Demons and Demon-Lords can generate potentially enormous amounts of Twists in one go.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Nightmare Fuel</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An Increated (Dæmon or Neechie) that is near a character (or possessing them) can attempt to Nightmare Fuel itself. Tapping into the character’s memories, experiences and unconscious fears (Hitches, Annex, Proficiencies, and Descendants) to create a Nightmare form for itself.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Nightmare Fuel Source grants potentially vast amounts of Twists that the Increated can use to not only create its own existence, but may also use to Twist the Fuel Source into being a Goblin, Demon or Demon-Lord (forcing them to take a Woe via an Unsoakable Mortal Wound for 4.5 Twists at Low Stakes). Any additional Twists gained beyond the limits of the number of Hitches (or Banes occasionally), especially above the Hard Twist limit of 28, will be converted to Shocks, Yarn, Chi or Sway as appropriate.</p>
<!-- /wp:paragraph -->

<!-- wp:table {"className":"t13ne-table t13ne-nightmare-fuel"} -->
<figure class="wp-block-table t13ne-table t13ne-nightmare-fuel"><table class="has-fixed-layout"><thead><tr><th>Nightmare Fuel Source</th><th>Mechanical Source</th><th>Twists gained  <br><strong> (to a Max of 28)</strong> </th></tr></thead><tbody><tr><td>Memories / Forgotten Stories</td><td> <strong>Proficiency</strong> </td><td>1</td></tr><tr><td>Experiences / Learning</td><td>Skill <strong>Annex</strong></td><td><strong>Annex </strong>Draw</td></tr><tr><td>Imagination / Creativity</td><td>Talent <strong>Annex</strong></td><td><strong>Annex </strong>Score</td></tr><tr><td>Profession / Magical Knowledge</td><td>Power <strong>Annex</strong></td><td><strong>Annex </strong>Boon</td></tr><tr><td>Formal Training / Books / Pacts / Locations</td><td> <strong>Descendant</strong> </td><td><strong>Descendant </strong>Master Annex Boon</td></tr><tr><td>Known Fears / Nightmares / Beliefs etc</td><td> <strong>Hitch</strong></td><td><strong>Hitch Boon</strong></td></tr><tr><td>Months of Practice / Years of Experience</td><td><strong>Scale</strong></td><td><strong>Personality Annex</strong> Boon</td></tr><tr><td>Unconscious Fears / Soul</td><td><strong>Personality Annex</strong></td><td><strong>Personality Annex</strong> Boon</td></tr></tbody></table></figure>
<!-- /wp:table -->
<!-- wp:heading {"level":3} -->
<h3>Nightmare Form</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Nightmare Form is a supernaturally powerful, monstrous form that an Increated can briefly inhabit while Nightmare Fuelled. The Increated reaches into the mind of their Nightmare Fuel Source and finds some form from their nightmares, superstitions, or religion that they can take on and inhabit. These forms usually come with folkloric or logical weaknesses, and can also be added to Goblins, Demons, Demon-Lords or even Descendants the Increated possesses.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, reaching into the mind of a nearby horror movie fan would grant the Increated the ability to become a vampire, werewolf, zombie, knife-fingered dream-stalking burn victim, hockey-masked killer, leather-clad fetish demons... you know... the one who looks like someone turned the mattress on a bed of nails, or whatever you like in phantoms and scary clown things. A science-fiction fan may provide all manner of aliens from acid-blooded space-wasps to unknowable hyper-geometric intelligences or sentient colours, as well as time-travelling shape-shifting assassin robots, or a doppelganger clone of themselves. A religious person might provide angelic or demonic forms, ancestor spirits, devas, djinn, dybbuk, ifrit, imps, kami, oni, or a saint, depending upon their religion of course. Children can be fertile grounds for Nightmare Fuel, providing horrific forms, but this may limit the behaviour the form can achieve, with such child-provoked forms often behaving in terrifying, but illogical ways, scaring the child, but failing to actually capture, kidnap, or eat them, although as it relies on what the child has been exposed to, not always.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Nightmare forms grant the Character (Increated, Goblin, etc) Monster Facets and additional Annexes, at a cost of additional Hitches. Typically a Nightmare Form is treated as a Descendant that they gain access to. Often, for simplicity’s sake, the Nightmare form consists of a Single Annex with balancing Hitches. The Annex’s Root and Channelling Facet become Monster Facets for the affected Character (or Descendant).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Nightmare Form can only be maintained as long as it has access to the Nightmare Fuel that created it. If the character providing the Nightmare Form is killed then the Form will be lost immediately.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>E.g. An Increated that possesses a corpse (Skill Descendant [0.5] + Puppet Possession [1.5] = 2 Twists) in Eastern Europe, finds that when the shuffling puppet approaches a local, their beliefs in ‘Vampyre’ legends grant them 12 Twists that they can spend immediately, upgrading their possession and accessing a Nightmare Form:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example"> “Vampyre Abilities” Boon 34 (d8+4) "Blood"(N), "Folklore" (H<sup>U-L</sup>), "Lust"(S) — In daylight halve Score  Hitch: Dependence (Blood)(Q-Mystical-"Practice" must spend time hunting) (x14) : Monster Facets N Temperamental, S Villain</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The 34 Boons of Vampyre abilities is paid for by 20 Boons from the Umbral and 14 from Hitch. Should they remove themselves from the locals, flying from town for example, they will once again lose access to the Nightmare Form, unless they can find another source.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Nightmare Refuelling</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Every now and then Increated want a little more Nightmare Fuel, but how to get more fuel from a source? Well there are four ways.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Find a new source. You can’t change Nightmare Forms whilst you have one on, so the new Fuel source must have an applicable Proficiency, Annex, or Hitch. A good tactic is to hit a crowd for Nightmare Fuel, you can keep pulling from all targets, especially if you target those with contagious Hitches.</li><li>Retap the original Nightmare Fuel source. Pay Chi (or Sway for Chi) equal to the number of Twists that will be gained. E.g. if targeting a Hitch x24 they must pay 24 Chi. However, the Re-tapped Source will be drained one Boon (so that Hitch becomes Boon 23). Annexes of Boon 1 become Proficiencies, Proficiencies will be lost, Hitches of Boon 1 are Resolved, if a source is lost then the Nightmare Form will also be lost.</li><li>Create a new source: Once you have a Nightmare form, it is generally pretty easy to create a new source. You just have to use the form to convince someone it exists. Characters usually believe in things that they have seen, and definitely believe in things that have chewed their leg off, or whatever. Nightmare forms will try to create new Hitches such as "Fear of Vampyres" (or whatever), and then immediately tap them.</li><li>Steal Source: Increated have a reputation for consuming souls. In actual fact, while they do Steal Souls, they don’t actually eat them. Instead, they transfer the Character to Shades, where they are tortured (or some other intense experience) to create belief in the realm and the Increated that brought them there. Taking a Source to Shades requires paying their summoning cost with Twists. However, once in Shades the Souls will provide Twists and Chi back. A Stolen Source can be tapped as often as the Twists Extend Limit (in Yarn). So a 4 Twists source can be tapped once per day. The Increated can either take the Twists, or take twice that in Chi instead. All the Stolen Souls one Increated has stolen form a Pact in Shades and the whole Pact can be tapped as a Master Annex by the Increated.</li></ul>
<!-- /wp:list -->
<!-- wp:heading -->
<h2>Sway Table</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Sway Table is where all this information comes together and you can look up how Twists are required to do something. The Increated find Twists easy to create, which is why they are so powerful compared to normal characters. A character with Twists can alter the entire world in a single action, with enough effort and no opposition.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->
'),
		array('RulePage'=>'Sway', 'Description'=>'<!-- wp:paragraph -->
<p>In T13 Sway is used to measure how effective, powerful or expensive something is. It is a measure of a Character’s wealth, power, and destiny all at once. Sway comes in the following flavours which are used for specific tasks within the system. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Sway Types</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li><strong>Yin &amp; Yang (Tao) Sway</strong> — Tao Sway is the smallest form of Sway and is generally known as Yin or Yang, each one equals a +/- 1 on a rolled Yin or Yang Facet Score. It can be used by most Characters to make simple purchases such as learning Proficiencies, or buying Descendants. You can read more in the Tao Sway rules. </li>
<li><strong>Facet Sway</strong> — Facet Sway varies in name by Facet, and can behave differently based on the type of character wielding it and the genre of the Story or Game. Facet Sway varies immensely in what it can do based on the type used. Health can heal, Wealth can make purchases, etc.To find out more look at the Facet Sway rules.</li>
<li><strong>Chi</strong> — Chi is the next most powerful form of Sway, and is generally a +/- 2 to any rolled Score. It is made from Yin and Yang being combined together. Chi can be used to make purchases, but also can bend the reality of the world, allowing precognitive effects, reloading reality back to a previous saved state and more. You can read more about Chi and how it can bend reality in the Chi rules.</li>
<li><strong>Yarn</strong> — Yarn is to Chi as Chi is to Tao Sway. It is the most powerful Sway that can easily be produced, and allows Stories to be woven into the world, each single point of Yarn can alter a rolled Score by +/- 5. Yarn is a tool of Yarn-Tellers and is the meta-currency used by Plots to create and manipulate characters and stories. To find out more read the Yarn rules.</li>
<li><strong>Twists</strong> — Just as Chi can be spun into Yarn, if you continue to spin Yarn you get Twists. Twists don’t even really exist they are Increated, just like those that invented them and rely on them for their continued "existence". However, adding a single Twist to a roll will alter the Score by at least +/- 10.</li></ul>
<!--/wp:list -->

<!-- wp:heading -->
<h2>Sway Table</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Sway Table is where all this information comes together and you can look up how much Chi (or Yarn or Tao Sway / rolled Score) is required to do something.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Calculating Difficulties</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>T13 uses the Sway Table to calculate the Difficulty of everything and anything that the Characters try to do within the narrative. The way that Difficulty is calculated by the Referee or Yarn-Teller depends on the dice roll method that is being used in the game for that Action, as well as details about the setting, character and genre.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Value</strong> — Value Tests are usually conducted only between Facets or Annexes, they do not beat Difficulties exactly (although a Value can be calculated from a Difficulty, just like a Value can be found from a Facet Score). So if you were to attack a character with Value Tests you might compare your Trial to their Rook to determine what happens. To find out more about <a href="/test-value/">Tests (Value) you should read the rules on them.</li><li><strong>Dice Pool</strong> — in a Dice Pool Test where each dice rolled creates a separate Score, the Difficulty is generally set by the Yarn-Teller as equal to the highest individual Difficulty listed on the Sway Table. To find out more about <a href="/test-dice/">Tests (Dice Pool)</a> read the rules on them.</li>
<li><strong>Single Roll</strong> — The Difficulty is calculated by adding all pertinent Difficulties together from the Sway Table. This creates a much larger Difficulty, but all Dice rolled are added together to calculate the Score. To find out more about <a href="/test-dice/">Tests (Single Roll)</a> see the rules on them.</li>
<li><strong>Card Draw</strong> — A Card Draw Test is calculated as Single Roll, but is then Reduced to set the Pips required by the Card Draw.</li>
<li><strong>Ordeal</strong> — For Ordeals the Difficulty is usually calculated as a Single Roll (overall), but this Difficulty is then divided over the various Stages of the Ordeal. </li>
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>It should be noted that Yarn-Tellers and Referees have a number of ways that they can calculate a Difficulty to make something harder or easier depending upon factors in the setting and character. For example, if you are playing in an epic space-opera universe then you would probably expect all technology to calculate Difficulties as if it were Bold (as Chi), where as in a modern day setting technology may be considered Intrepid for most purposes, but a few hundred years ago technology would always use a Banal Difficulty. This doesn’t just apply to technology, as everything in the system can also have differing Difficulties.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you are playing a Wizard Character, for example, then magic may be almost non-existent, or all powerful, with Difficulties reflecting these differences. Additionally, the Single Roll Difficulties for magic can vary greatly, with how the magic is performed in the world being reflected in the Difficulty that the Wizard must generate to cast a spell. In one setting summoning a spirit may be considered Epic magic that involves portal magic, in another it may simply be a summoning charm, both would also add the Master Annex Boon or Personality Boon of the Spirit in question, but a summoning charm will always be easier to perform than epic portal magic. Indeed magic can be so easy that throwing fireballs in some settings is as simple as being from the right nation and swinging your arms around to just make a "Fry Attack", in others it will require training from a mage-guild to at least level 5 as well as learning and specifically memorising the right spell.</p>
<!-- /wp:paragraph -->
'),

		array('RulePage'=>'Card Guide', 'Description'=>'<!-- wp:paragraph -->
<p>T13 uses ordinary playing cards to model aspects of the narrative and how Ordeals (such as Combat) are run. Each card can be used in a variety of ways, and include all sorts of details that can help a Yarn-Teller out if they are stuck for ideas. Generally a double deck of poker or bridge cards is used  with two jokers (one red and one black) for 108 Cards Total. This is the minimum play deck that is suggested, and should work for most play group sizes, however larger groups (6 or more Players including a Referee) may require a triple or even larger Deck. Alternatively each Player may have a single 54 card Deck each, keeping the decks unmixed, which can work better with games not played at a single table or suitable VT.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Ordeal Cards</strong> — During Ordeals cards may be played to represent the actions of the Character, causing them to move, talk, work, strike, dodge, etc. as required by their player. Characters draw cards into their Ordeal Pool based on their annex’s Draw, and play a number of cards based on the Annex Tier (1 for a Facet or Skill, 2+ for Talents, etc.). A Character may hold no more Ordeal Cards (at the end of their turn) in their Ordeal Pool than their current Scale + The Number of Active Hitches that they have (this does not include Resolved Hitches) - This is known as their Ordeal Pool Limit.</li><li><strong>Wyrd Tarot Cards</strong> — During play Grunts, Mercari and Solo level Characters (especially those with direct access to Chi) can play cards from their Wyrd Tarot Hand at any time. <ol><li>Every Character and Descendant (including Pacts) has one place where a card can be played. </li><li>Non-Court cards are played to this spot and then discarded (revealing any cards they cover). </li><li>Court cards are played to this spot then stay there, having their effect until they are covered or discarded. </li><li>Cards may be played face-down, covering a Court-Card and removing its effect until the Character takes an Action, then the card is turned over and has its normal effect (which will usually then be discarded).</li><li>Wyrd Tarot cards  can only be played upon Characters and Descendants that a Character can touch or affect with Ordeal cards (if you attack someone you can also play a Wyrd Tarot card upon them).</li><li>The Wyrd Tarot Hand varies in size based on the Character’s stored Chi. Comparing the amount of Chi the Character currently has to their Maximum Chi results in a %.  <div class="t13ne-table-wrap"><table class="t13ne-table"><thead><tr><th></th><th>Grunt</th><th>Mercari</th><th>Solo</th></tr></thead><tbody><tr><td>Chi % required per card</td><td>100%</td><td>20%</td><td>10%</td></tr><tr><td>Max Wyrd Tarot Hand</td><td>0-1*</td><td>5</td><td>10</td></tr></tbody></table></div> <small>* Referees may decide if Grunts get any access to Wyrd Tarot Cards (or not).</small></li></ol></li><li><strong>Yarn Cards</strong> — Very powerful Characters such as Solos, and Referee Plots can play cards from their Hands and Pool as Yarn Cards. Yarn cards can have incredibly powerful effects on a narrative, and should generally be handled with care, however it is rare that you will achieve much with a single Yarn Card. Usually a selection of cards is played together to produce the effect required. <aside class="t13ne-example">For example, if you play a card as a new Scene (a Warp), you (or another Yarn-Teller) should play cards for the Fray and the Snag of that Warp Scene. Revelation, Gains, Ordeals, etc. all theoretically require additional cards that further define exactly what is happening. However, a Yarn-Teller should not be bound by only the cards they have, if they know what Details they wish to reveal in a Revelation, they do not have to find the exact card any card will do, but an exact card could be required if they didn’t already know what details should be revealed. In general, it is best if any Scene a Yarn-Teller is creating on the fly has a minimum of 3 cards. The Scene Beat Type (e.g. The Forest — indicates the Scene is a Revelation), The Scene Significator (e.g. The Wraith — indicates a spooky or unsettling Revelation), and The Scene Specifics (which in the case of a Revelation is the About, Information, Details, etc and can be specified with a card for each)</aside> Playing cards in this way can appear tiring as you may use up all your cards in both your Ordeal Pool and Wyrd Tarot hand, but can have profound impacts on Stories and the world in general. Referees must be willing to share the creation of the story with the players if they have access to Yarn cards. Players too must accept that sometimes even if they have appropriate cards to destroy the universe in one fell swoop, that does not mean the game will be best served by them playing them.</li></ol>
<!-- /wp:list -->

<!-- wp:html -->
<section class="t13ne-card-list">[t13ne type="cards" mode="jsvg" cards="all"/]</section>
<!-- /wp:html -->'),
		array('RulePage'=>'Card Spreads', 'Description'=>'<!-- wp:paragraph -->
<p>In T13 how you play cards is almost as important as the cards you play. Referees and Yarn-Tellers will often develop a Plot with cards, using the Yarn-Cards in a number of ways.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Plot Spreads</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Plot Spreads are the most powerful spreads, creating a new Plot from nothing but a few turns of the cards. Each size of Plot has a Spread associated with it. This spread includes the Plot Significator as well as any other Spreads the Plot may require such as:</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Conflict Spreads</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Plot is defined the first thing that is defined is the Conflict </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Conflict spreads can increase in complexity several times with greater and more complex conflicts being created with more cards. As you can see on this table:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="conflictSpreads" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The most simple is a 2x2 pattern that uses 5 cards as this example shows. If you need more examples see the <a href="/conflict-spreads/">Conflict Spreads</a> Rules page.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="simple" handsize="5" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Act Spreads</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Plot has Acts and an Act in T13 has its own unique card spread that helps define it. Typically we use a 3 Act structure (although there are variations that can be used for 4 and 5 Act structures they are largely variants).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4 class="wp-block-heading">Frame Act Spread</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Frame Act Spread includes a Hook Spread for each Side (or Character) that must be hooked in the conflict, and one Revelation Spread that defines the Plot somehow.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="frame" handsize="15" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":5} -->
<h5 class="wp-block-heading">Hook Spreads</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Hooks are created specifically for each Side of a Conflict, and it should be noted that they can be created on their own. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="hook"  handsize="3" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":4} -->
<h4 class="wp-block-heading">Loom Act Spread</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Loom Spreads consist of Pairs of Warp and Weft Spreads, or Weft and Warp if you prefer, for each Side in the Conflict. The Loom has as many Warp-Weft pairs as the Yarn-Teller wishes (although usually you will have at least one pair per Side plus another pair). Loom Spreads can become more complicated with complex narrative-weaving techniques. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="Loom" handsize="15" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":5} -->
<h5 class="wp-block-heading">Warp Spreads</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Warp Scenes require Warp Spreads. These help define the Warp. No cards are required for "The Ends" of the Warp, as these are defined by what the Characters are trying to achieve. "The Fray" and "The Snag" both require 1 card that define what they are (which may require more cards such as in an Ordeal Spread).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="warp" handsize="14" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":5} -->
<h5 class="wp-block-heading">Weft Spread</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Weft Spreads define firstly how bad the emotional backlash was to the last Warp with a "Recoiling" spread of 0 to 3 cards. This can be treated as as a Psych attack on the Characters, at its most simple. Then 1 card sets the "Sweeping" up. Finally "Picking" must define the possible choices the Characters can make, these are usually narrative choices not connected to the cards, but cards can be used to provide "routes" if required.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="weft" handsize="14" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":5} -->
<h5 class="wp-block-heading">Zenith Act Spread</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Zenith Spreads consist of a Single Ordeal Spread and a single Gain Spread. The Zenith also has a Completion event, but this is decided narratively based on what the Characters have all accomplished during the narrative.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="zenith" handsize="15" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":5} -->
<h5 class="wp-block-heading">Logue Act Spreads</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Logue Spreads are formed from a Revelation primarily, but may also have an optional Warp and/or Weft Spread. Logues usually are one Sided, affecting and involving only one of the Conflict Sides directly, although more can be involved especially in Revelation and Warp Scenes.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="logue" handsize="15" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Scene Spreads</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Scene that the Yarn-Teller narrates and the PCs are involved with will actually have a card spread involved that defines things about the Scene. All Scenes for example will have at least two cards that serves as a Significator for that Scene and define the Beat Type for the Scene. Different Beat Types require different additional cards.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="scene" handsize ="5"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Ordeal Spreads</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Argueably both the most complex and most fun Scene type is the Ordeal. Ordeals can use lots of cards to define details of themselves, with a card for the Stakes, and optional cards for defining the Test, Suggested Action, Stages (including in some cases the whole map), Obstacles, Motional and Types of Ordeal Stage Spreads. For more details about Ordeals see the <a href="/ordeals/">Ordeals Rules page</a>, but here is a summary of Ordeal types and how they use cards.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealTypes"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":4} -->
<h4 class="wp-block-heading">Stage Spreads</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>As well as Ordeal Spreads we have Stage Spreads, which define the Stages in more detail that were set in the Ordeal Spread. 1 Card Defines the Stage Type, 1-3 cards define the Stage Difficulty in Pips. Then additional cards may define the number of Obstacles and each Obstacle gets its own spread.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="stage" handsize = "5" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":5} -->
<h5 class="wp-block-heading">Obstacle Spreads</h5>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Even within a Stage Spread we have Obstacle Spreads, which will define some of the Obstacles in the Stages of the Ordeal (Obstacles can also be defined at the Conflict Level as Embodiments). These Spreads usually consist of at least 2 cards with 1 defining the Type of Obstacle and between 1 and 3 cards defining the Difficulty of the Obstacle in Pips.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="obstacle" handsize="2" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Gains</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Gain spreads are typically 1 card (although this can be modified) that grants a Gain to either the Side or a single Character. Some Gains may draw multiple cards for each Side if multiple Sides are making a Gain.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="gain" handsize="1" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Revelations (and Lores)</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Revelations can vary in number of cards from 3 to 12. Although sometimes the dealt cards are no more than suggestions, if you know what the Revelation is going to reveal already.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The first Revelation card reveals what the Revelation is About, what fact is being revealed here? And is most often ignored if the Yarn-Teller knows what they want to Reveall. The Second card is the Vector, how is the information being revealed. The Third card reveals the actual specific information revealed, and you have a choice on each card of Info or Alternate to reveal.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="revelation" handsize="3" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Optionally you may add the following extra cards, which can reveal one additional piece of information (or another Alternate), and any additional cards reveal "Details".</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="revelation" handsize="12" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>You should also note that every Revelation also reveals a potential Lore about one of the Characters (usually the opposition). Bigger Revelations can create more powerful Lores as you should see.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Plight or Situation Spreads</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Situation spreads are great for setting up a small problem, or Plight, that is larger than an Obstacle, but not as important as a Plot. A Plight Spread usually describes a simple Quest that the Character must accomplish, often as some additional complication to a larger Plot (although you can run perfectly good games just using Plights). Plights consist of 3 Cards. History represents the situation that created the Plight, it can also represent an Obstacle that may be used in the Quest. The Present card represents the actual Situation and the Quest that must be done. The Solution Card represents the ideal Solution to the Plight, although it will also assign an Ordeal that may represent another possible (but less ideal) Solution. Plights do not generate Hexagrams, but do generate 2 Lower Trigrams, that define how the Plight Quest should unfold, and what steps (Tests, Ordeals etc) are involved in the Quest.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="plight" handsize="3" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Quest Spreads</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Quest spreads are a simple Narrative device that creates a Quest. Quests are situations that must be completed by Characters for various reasons, sometimes for a reward, most often out of duty, devotion or some other Hitch. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Quest spreads are like Plights, but they define a full Quest, that includes Hexagrams that modify the Quest, as well as providing additional information about the Quest, its background, additional Tests, Ordeals, Obstacles and Hurdles that the Characters may face, and how the Solution might be reached. The Hexagrams are defined with line 1 as the lowest and line 6 as the highest in each case.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The main difference between a true Quest and a Plight is that a Quest asks Questions about the Character while they are involved in the Quest. These Questions sometimes concern the reason for the Quest and the Situation. Additionally the Hexagram lines and the trigrams give more details about how their cards may be used to construct the Quest. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="quest" handsize="6" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Geas Spread</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Geas spreads are a 6 card spread that reuses the same cards to create both a Quest, a Revelation and a Lore. Geas Spreads are usually tied to some curse or Hitch that a Character must overcome, but they can be used simply to add some world-building to a Quest. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Revelation usually reveals something about the Character, such as the nature of the curse, taboo, duty, devotion or whatever enforces the Geas, some Lore that surrounds them, something about nature of the Quest, or just some world-building Lore.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="geas" handsize="6" /]
<!-- /wp:shortcode -->
		'),
array('RulePage'=>'Conflict Spreads','Description'=>'<!-- wp:paragraph -->
<p>Conflict spreads can increase in complexity several times with greater and more complex conflicts being created with more cards. This page will show you a randomly created example of each size of Conflict spread. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plots always require an extra Significator card beyond the square grid that informs the Yarn-Teller how the Plot should be formed.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can see from each Conflict Spread what the Significators of each involved Side are. The smallest Conflicts are between 2 Facets, with the Dominant, Pressed, Above and DeeperShadows Sides present. The largest Conflicts involve all Facets and Sides (Dominant, Pressed, Above, Below, Internal, External, Shadows and DeeperShadows. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is worth noting that Facet Embodiments do not always match the Facet of the card that providing that Embodiment. This can be confusing, but Facet Embodiments are based of the Yarn-Card rather than the actual Card Facet. This means the Embodiment may want a different suit to the card that set it.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>As you can see on this table:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="conflictSpreads" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>It might help for a reminder about the Sides of Conflicts</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="conflictSides" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Simple 5 Card Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The simplest Plots are suitable for short stories or early Sub-Plots. The also make ideal starter games.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="simple" handsize="5" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Internalised 10 Card Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Internalised Conflicts create small stories of medium complexity, where at least one side has some internalised conflicts.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="internalised" handsize="10" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Balanced 17 Card Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Balanced Conflicts are perfect for long Arcs and Volumes, These Conflicts can easily spool up a Novella on their own, and require quite a large cast of Characters (many of which may die along the way).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="4x4" handsize="17" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Complete 26 Card Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Complete Conflicts are big enough for almost any purpose. There are plenty of movies and novels that aren\'t even this complex. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="5x5" handsize="26" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Complex 37 Card Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Complex Conflicts are perfect for long twisty complicated plots where there will be shared Facets on multiple sides of the Conflict (potentially).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="spread" spread="6x6" handsize="37" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Exceptional 50 Card Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Exceptional Conflicts are as big and as complicated as Conflict should ever get. Most Narratives should not be this complicated, unless you are writing a dense political thriller or trying to create a mythological Cycle.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
 [t13ne type="spread" spread="7x7" handsize="50" /]

<!-- /wp:shortcode -->
		'),
    array('RulePage'=>'Proficiencies','Description'=>'<!-- wp:paragraph -->
<p>In T13 we describe a Character’s abilities in terms of the things that they can do. Usually this is expressed most simply as a Proficiency Thread (or just a Proficiency, Thread, or Prof). A Proficiency Thread is a mimetic unit in T13, if you have a Proficiency in something then you know a lot about it, you may even have a deep and nuanced understanding of the thing you have a Proficiency in. Proficiencies in the system are virtual Threads woven from Facet Sway that we weave to create more complex models, and that makes Proficiency Threads are the most basic object in the system.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There really isn\'t much to know about Proficiency Threads, they are really very simple: </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Proficiency Name</strong> — What is this a proficiency for?</li><li><strong>Description</strong> — What is this thing that we have a Proficiency for, what does it look like, is it physical or a concept, can we count it, what can we do with this knowledge?</li><li><strong>Facet</strong> — Every Proficiency has a Facet, some have more than one Facet that they can be associated with. In fact, it is quite common for more complex Proficiencies to be available to multiple Facets as those complex Threads contains hints of all the Facets.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Proficiencies are the most simple part of the T13 System, but everything else is constructed from these <q>memetic</q> building blocks. Because of this Proficiency Threads have a simple cost of 2 Sway or 1 Chi. Although Characters can be limited in how many Proficiencies they can hold at once (and potentially limited in how many Proficiencies of a given Facet they may have), they are almost always able to buy a new Proficiency somehow.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Proficiencies are used by Characters to model all the things that the Character knows about. Because this knowledge is contained within the Proficiencies, having a Proficiency Thread in a particular topic grants a Character an ability or knowledge in and about that topic. This will allow the Character to know how to apply their Boon Dice from a Facet or Annex to the best affect possible. Having extra Proficiencies that are applicable to the task you are attempting can potentially grant you extra Dice to add to the roll. We call these extra dice <strong>Proficiency Dice</strong> and they can have a profound impact on not just the Test or task being attempted, but the Character and even the plot or setting sometimes. </p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h2>Proficiency Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Character in T13 makes a Dice Roll they also must look at how many Proficiencies you have that are applicable to the task being attempting. If a Proficiency is particularly applicable it may count double for this Test. So if you have a Proficiency in Repairing Swords and you are asked to repair a sword then you would effectively have 2 Proficiencies. However, if you had a Swords Proficiency and a Repairs Proficiency then they would probably be considered generic and would also count as 2 Proficiencies not 4.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="noProfDice" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>So the Character can roll some Proficiency Dice, but what sort of Proficiency Dice? Well Edges (these are special effects on Annexes or Descendants) can alter these Dice, but the base Proficiency Dice are set as follows. Smaller Dice cause more Proficiency Crises, larger Dice add more Score, but have less Crises. The default is a D6 for the Profiency Dice.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="profDice" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Proficiency Crisis</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If your Proficiency Dice roll maximum or minimum (all 6s or all 1s normally) then you are experiencing a Proficiency Crisis. A Proficiency Crisis has a number of effects, which vary depending on whether the roll has passed or not.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="t13ne-tablewrap"><table class="wp-block-table t13ne-table"><thead><tr><td>Roll</td><td>Crisis</td><td>Result</td></tr></thead><tbody><tr><td>Success</td><td>1s (Snake Eyes)</td><td>Automatically Borderline/Stalemate</td></tr><tr><td>Success</td><td>6s (Boxcars)</td><td>Reversal of Success</td></tr><tr><td>Failure</td><td>1s (Snake Eyes)</td><td>Reversal of Success</td></tr><tr><td>Failure</td><td>6s (Boxcars)</td><td>Automatic Borderline/Stalemate</td></tr></tbody></table></div>
<!-- /wp:html -->

<!-- wp:list -->
<ul><li><strong>Automatic Stalemate</strong> — Regardless of the roll involved the action was not successful, or a failure, a Crisis has occurred and the action remains unresolved.</li><li><strong>Reversal of Success</strong> — Whatever the result of the roll as well as the rolled result you will also experience the opposite level of failure. So if you roll Boxcars on a Superior Success you’ll also experience a Serious failure.</li><li><strong>Redeal</strong> — When a Crisis occurs each player may elect to keep one Wyrd Tarot or Yarn card from their hand or in play (note that Ordeal Pools are not affected). The rest of the Wyrd Tarot Cards (including the deck, the discard pile and any cards in play) are gathered and shuffled. Then all hands are re-dealt once more (to full).</li><li><strong>Autosave</strong> — A Proficiency Crisis automatically creates a new ‘Save’ Chronolith with 4 Chi stored for each Proficiency Die and Card involved in the Crisis.</li><li><strong>Annexing</strong> — A Proficiency Crisis automatically lets a Character combine the Proficiencies being rolled into a new Skill, Talent or Power, assuming they have the free slots. A Character with no free Annex slots may opt to create instead a new Descendant, but the Descendant must be non-physical (such as an idea) and must be purchased (at half price though, which is nice), although it is created as though it is a new Annex (so all Facet Boons, Values, etc. are treated as the Character’s Facet Boons).</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Proficiency Potency</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Proficiencies are affected by the Potency Level of their Facet in the Tapestry. A "Spirits" Proficiency represents folklore and religious knowledge if Awe is Banal, for an Intrepid Awe Tapestry "Spirits" are more nebulous, invisible and intangible, but still perceivable, and the Proficiency indicates a Character has some intuitive or actual knowledge of the Spirits. Bold Awe "Spirits" can be perceived and have a real existence. A Character will have experince of dealing with them. Monstrous Awe would indicate "Spirits" that are real monsters with truly powerful Awe Monster Facets can exist in the universe, as you may find in most Fantasy Universes and Horror stories, and the Proficiency will include practical knowledge of dealing with and controlling spririts. Twisted Awe would indicate Spirits are all infested by the Increated and have reality destroying abilities and ambitions. </p>
<!-- /wp:paragraph -->

'),
array('RulePage'=>'Hitches', 'Description'=>'<!-- wp:paragraph -->
<p>In T13, Hitches are a Knot that places restrictions on Characters and Descendants and limits how the Character or Descendant will behave under certain conditions. Hitches are a Knot combining a Thread, a Boon (usually called a Bane), and a Hitch Type.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hitches are created in a number of ways, they may be background aspects of the Character, Quirks and Flaws that the Character begins with, or may gain as part of their personal Arc. Other Hitches are created by Mortal+ Wounds during play, where they represent traumas and usually form Natural Scar Hitches (although not always).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hitches can also be created during in play in another way. Situations and emotional traumas (such as actual Traumas) can blend Threads (usually in the form of Proficiencies) to create a new Hitch (or at least new to that Character). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, if a Character falls down the stairs into a cellar, and come around in a dark and silent basement, wrapped in spider webs, with spiders running over them, they could be justified in freaking out a bit. This could allow their Player to combine the any of the Threads of "Spiders"<sup>Nature</sup>, "Fear"<sup>Awe</sup>, "Darkness"<sup>Enigma</sup>, "Silk"<suup>Gossamer</sup>, "Cobwebs"<sup>Inertia</sup>, "Eight-Legged"<sup>Nature</sup>, "More-Than-4-Legs"<sup>Jeer</sup>, "Webs"<sup>Dominion</sup>, "Weaving"<sup>Craft</sup>, "Basement"<sup>Burden</sup>, "Silence"<sup>Quiet</sup>, and "Swarms"<sup>Dominion</sup>. The Player can pick the Threads they wish to combine and create the Character’s new Hitch. Each Thread woven together will bring with it a Facet that identifies which Hitch Type or Gnarl the new Hitch may have.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Anatomy of a Hitch</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Hitch in T13 is described as follows: </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Name</strong> — All Hitches need a name, like "Arachnophobia".</li><li><strong>Description</strong> — Along with a Name a Description will help people understand the Hitch.</li><li><strong>Bane</strong> — The Bane is the Boon of the Hitch (Boon and Bane can be used interchangeably for Hitches). The Bane of the Hitch tells us how powerful the Hitch is. Hitch Banes Reduce to Marks (instead of Scores) and Ruins instead of Draws.</li><li><strong>Proficiencies</strong> — just like the Annex is made more powerful by knotting in more Proficiency Threads, so too are Hitches made more troublesome by tying on more Proficiencies. Typically a Hitch must have as many Proficiencies as it has Marks (Banes Reduced), but these Proficiencies come in types.<ul><li><strong>Hitch Type Proficiency</strong> — Every Hitch has to have a Proficiency that determines the type of the Hitch. Arachnophobia can use "Fear"<sup>Awe</sup> to create a Awe-based Irrational Hitch (with Irrational Fear being the result), or they might use "Spiders"<sup>Nature</sup> to create a Scars Hitch (in this case perhaps Mental Scars would be appropriate or a permanent deformity to their skull from the fall). The "Webs"<sup>Dominion</sup> could create a Social Hitch, "Cobwebs"<sup>Inertia</sup> could add a Lament, or "More-Than-4-Legs"<sup>Jeer</sup> could create an Odd Hitch. "Silence"<sup>Quiet</sup> could create a Mild Hitch, or "Silk"<sup>Gossamer</sup> might create a Binding Hitch, paralysing the Character when spiders are around them, perhaps.</li><li><strong>Trigger Proficiencies</strong> — Trigger Proficiencies are what causes the Hitch to Trigger when they are present. Every Hitch must have at least 1 Trigger Proficiency. Arachnophobia for instance is usually Triggered when the Character senses spiders. "Spiders"<sup>Nature</sup> will usually act as the Trigger Proficiency, but other Trigger Proficiencies could be added, such as "Cobwebs"<sup>Inertia</sup> or "More-than-4-Legs"<sup>Jeer</sup>. The Facet of a Trigger Proficiency is usually unimportant unless that Trigger also acts as a Gnarl Modifier.</li><li><strong>Gnarl Proficiencies</strong> — Gnarl Proficiencies control what happens when the Hitch is Triggered. Does it Cost the Character something, complicate things with extra Difficulties, burn the Character, Block them? In this case the Player might elect to use "Webs" a Dominion-based Proficiency as a Gnarl, creating a limit to all Full-Actions, or they may use the Gossamer-based "Silk" to add a Tangling Gnarl (which would use an additional Trigger Proficiency as an Gnarl Modifier, using the Craft-based "Weaving" would add Difficulty to any Actions, or "Cobwebs"<sup>Inertia</sup> would cost Time, slowing them down. Other options include "Silence" adding a Suppression Gnarl, or "More-Than-4-Legs" could add a Feelings Gnarl, or using "Fear" again to create an Emotions Gnarl that adds a Psych Attack, or "Spider" could add an Instinct Gnarl.</li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Hitch Type</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Hitch Type Proficiency is usually considered the most important aspect of the Hitch, although this is largely because the Hitch has only one. The Hitch Facet defines how the Hitch works, what its thing is, and someof how it does it.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Hitch"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Gnarl Proficiencies</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Then the Gnarls of the Hitch are important, the Hitch Gnarls usually affect the Character or Descendant that has the Hitch, but they can also affect the User of a Descendant, Allies, or random passers-by, depending upon the Gnarl. Each Gnarl is different and larger Hitches have more than one Gnarl.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Gnarl"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Hitch Tier</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Which leads us to the issue of the Hitch Tier. You might notice that the different Hitches behave differently depending upon if they are a Quirk, Flaw or Woe. Each Tier behaves differently because they are very different in intended effect. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters are expected to have a selection of Quirks, that define minor aspects of the Character. Additionally, they should have at least a couple of Flaws, with perhaps as many as a handful, and at least one serious Flaw. Only the most powerful of Characters actually have Woes. Woes are generally reserved for Goblins, Demons, and Demon-Lords, as well as a few others plagued by the Increated. Although it is said that a few Færy Nobility and Fantasy Heroes can possess pure Woes that give them Yarn, and not Twists, most do not. Instead they must carefully manage their Flaws, keeping them below their Facet Boons, to avoid Increated attention.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="hitchTiers" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>You can see how the impact of the Tiers affects the Hitch directly. A Hitch must have as many Proficiencies as the Marks of the Hitch. Which usually means the additional Proficiencies can act as additional Triggers and Gnarls (although there is a limit on Gnarls). Some small Quirks will not have enough Proficiencies to have a separate Hitch Type, Trigger and Gnarl, and so a single Proficiency may end up doing double or even triple duty.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Lets consider a simple Hitch that a Character may have. Such as the easy to understand "Scars" Hitches. Scars are the normal hitches a Character takes after they have recovered from an injury. A small Scar for example can look like this:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Quirk: "Small Scar" × 3[1/0.5] (N) [Scars]{Trigger} <sup>Gnarl: Instinct Flinch</sup></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>While this Small Scar Quirk is possible in the system, it is self-referential, and is based on the Proficiency of the <em>real</em> "Small Scar" Hitch. Which is created by combining more simple Proficiency Threads together, in much the same way, they could be combined to create an Annex instead of a Hitch.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A more interesting Small Scars Quirk then requires 2 different Proficiencies ("Scars" and "Small" at the minimum, although note here, that one Proficiency must do at least double duty as Type, Trigger or Gnarl) and therefore must have minimum Banes of 5 for the Quirk, although a Character with an Awe of 20 could have a Quirk of Bane 10, this is not going to be very common. Most Quirks will be of the order of 5 to 9, a very few may get as high as 12.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Quirk: <span class="t13ne-hitch">"Small Scar" × 5 [2/1] "A small scar of that exact type that one rarely remembers exactly how one got it." [Scars]{Trigger} "Scar" (N), "Small" (D) <sup>Gnarl: Limit (47/14/3)</sup></span></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When we move beyond Quirks into the more powerful Flaws, and then Woes, the numbers of Proficiencies available is usually no longer any sort of limiting factor to the Hitch. You may have each Proficiency doing a separate job, which could look like this.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Flaw: <span class="t13ne-hitch">"Small Mysterious Scar" × 13 [4/1] "A small scar of that exact type that one rarely remembers exactly how one got it." [Scars] "Scar" (N), {Trigger} "Mysterious" (E), "Small" (D) <sup>Gnarl: Limit (39/10/2)</sup>, "Mystery" (E) <sup>Gnarl: Shadows (Mysterious Umbral demands secrecy or Questions Failure Level)</sup></span></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>As Hitches grow bigger with time, Players may have opportunity to change and refine their Hitches often, sometimes keeping Gnarls and Triggers the same, other times having their Hitches evolve and change. This is entirely normal and should be mostly the Player’s decision, although the current Yarn-Teller (or the Yarn-Teller running this Character’s Arc) and Referee should be consulted, the Player is always considered the Author of their Character.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Banes, Marks and Ruins</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Hitches have an equivalent to Boons, but being negative in nature we give them a different name, Banes, and we generally note the Banes with a number. With any Boon we can note the Score and the Draw, and Banes are no different. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Hitch Banes — Usually a number between 1 and 50, although rarely will they get bigger than 30.</li><li>Hitch Marks — The equivalent of Scores and usually affect Pip Difficulties.</li><li>Hitch Ruins — The equivalent of a Boons Draw and can negate discard and draw cards.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Adding Hitches</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Hitches are sometimes added to Characters and Descendants during play, most often by being Wounded by a Mortal or worse Wound. Occasionally Players or Referees will wish to add a Hitch to a Character for Narrative reasons (for example if a close friend, or family member dies then you may want a Lament). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When adding a new Hitch like this the Player, Yarn-Teller and Referee should agree the Bane of the Hitch (rather than using the Character’s Miasma Score, which determines how big Hitches created by Wounds are usually). Players should clear new Hitches with their Referee and the current Yarn-Teller (or the specific Yarn-Teller running that Character’s Arc if appropriate), as Hitches have a direct impact on the Character’s power level, adding to their Personality Annex, and the maximum Scale the Character can access. Additionally care should be take when adding Hitches as you can force Characters to change Experience Tier or Character Type .</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Triggering Hitches</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Hitch is triggered (you see a spider when Arachnophobic, or another Character sees your Scars), it has its effect based on the Gnarls and Tier. This is always a negative effect,  Stressing a Character out, making Actions more Difficult or Limited as appropriate, so you might think there is a good reason to make triggers as unlikely as possible (by making it not Arachnophobia say, but instead a fear of Babies called Smelvetta), all the advantages of having a Phobia without the drawback of the Yarn-Teller accidentally triggering it. Yarn-Tellers hate that sort of thing, and are likely to create a Plot where the Character has to enter an orphanage where all the children inside are called Smelvetta, just to trigger the Hitch over and over again.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So to balance this negative effect from triggering a Hitch you gain something to compensate, this Gain usually depends upon the Character Type and the Hitch Tier, but is usually Chi or Twists. Quirks usually grant Chi although they can grant Yin or Yang if they are very small. Flaws grant Chi (or occasionally Yarn) and Woes almost always grant Twists, but can grant Yarn occasionally, if the Character and setting align.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Hitch Limits</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The number of Hitches that a Character may have is limited by both the type of Character that is being built (or is creating the Descendant — as a Descendant shares Facets and Hitch limits with its creator or current owner depending upon the Incarna of the Descendant) and their experience Tier.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="pcType" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The Experience Tier of the Character is also important to the number of Hitches.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="experienceTiers" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>So for example when building a Fresh Demon they could have between 4 and 6 Hitches, but a Veteran Paradox Warrior (Hero) would have between 5 and 7 Hitches. Theoretically both Characters are on a par, although the Twists of the Demon’s Woes will give the Demon a significant advantage in many ways.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Revolving and Resolving Hitches</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Over time Hitches sometimes become stale, perhaps they haven’t been triggered in a long time, or something happens that means the Hitch no longer makes narrative or logical sense. A simple, common example might be that if you have a "Persecuted by Sheriff Jones" × 15, but Sheriff Jones just retired, then it might be time to resolve or revolve that Hitch.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Revolving the Hitch simply means that we change the details of the Hitch. Normally revolving a Hitch will cause its Bane to increase by one, but you can also pay Chi to reduce the Bane at this time if you want. So in the example of "Persecuted by Sheriff Jones" could become "Persecuted by the Sheriff" × 16. Now, whoever the new Sheriff is, you know they will persecute you also, and moving towns or even county won’t help here either.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Then again sometimes you might actually resolve a Hitch instead of just revolving it. Perhaps you saved Sheriff Jones’ life, it wouldn’t then make sense for him to carry on with the Persecution. Or perhaps you go see a Psychiatrist or Psychologist to get treatment for your Arachnophobia, Post Traumatic Stress Disorder, or Mental Scars. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Usually resolution comes from a Story (often a subplot of the Character Arc), it is always an option when one of the sides embodies as a Hitch Facet. So if an Arachnophobe Character defeats a Terror monster (who no doubt used a spidery form or controlled swarms of spiders to tap that Arachnophobia) then it makes sense to have them no longer afraid of normal spiders.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Resolved Hitches can change as follows. Quirk and Flaw Hitches are effectively lost, replaced instead with one of the types of Resolved Hitches. Which no longer adds the Hitch Value to the Character’s  Personality Annex it instead adds the full Facet Value as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>A new Persona from the same Facet, so an Awe Emotional Hitch could become an additional Idol Persona in their Personality Annex. This is a Resolved Hitch Persona.</li><li>A new Core from the same Facet, so that Phobia could become an Enhancer Core. This is a Resolved Hitch Core.</li><li>A Resolved Hitch Edge from that Facet, the Phobia becomes Valour, granting extra Success Levels for bravery. This is a Resolved Hitch Edge and is usually the preferred resolution.</li><li>or finally, and this is usually reserved for bad guys and NPCs, but occasionally a Hero might also folllow this path, the Character gains a Monster Facet and Monster Pool, in this case the Phobia would make them into a Terror. This is a Resolved Hitch Monster.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Resolved Woes are slightly different, they still resolve into the above types, but only up to the Facet Boon, this leaves Boons that we haven’t dealt with which the Referee may decide what to do with. The options are:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Discard the remaining Hitch Banes— This leaves the Character diminished, and should be treated as a punishment of sorts. E.g. The Character with a Harrowed Woe "Persecuted by Sheriff Jones" secretly kills the Sheriff, they resolve the Dominion Woe, and might add a Leader Persona. However, the Ref decides to discard the remaining Boons, reducing the Character’s Personality Annex. They are made lesser for the killing.</li><li>Add the remaining Hitch Banes to the Facet, increasing it to the level of the former Woe, this will however also reduce the Anti-Facet by the same number of Boons (if Joined). This alters a Character permanently and can diminish or harm the concept, so use this wisely. E.g. The Character’s Dominion would be pushed up to the Boon of the "Persecuted" Woe, and they would also lose Yonder. This can imply that with the Sheriff gone, the Character assumes some leadership role in the community, perhaps over some criminal gang. Facets can only rise to a maximum of Boon 25 plus the current Scale, beyond this the Boons must be either Discarded or moved to a new Hitch.</li><li>Add a new Hitch, with Banes equal to the difference in Facet Boons and Woe Banes. Usually this "Shadow" Hitch is related, but tangential to the original Woe. So, maybe the Character "Persecuted by Sheriff Jones" × 28  tried to help the Sheriff against the Villain. When it was revealed to be one of Jones’ Deputies, the Sheriff realised they had been wrong all this time, and apologised, before shooting the Deputy and dying. The original Woe is resolved, but the Character’s Dominion is only 18, this adds a new Hitch such as "Lament for Sheriff Jones", "Wanted for a crime they did not commit" or "Found Not Guilty" equal to the difference in Boons and Banes (in this case 10), and depending which way the townsfolk take the scene when they find it, and if there were any witnesses.</li></ul>
<!-- /wp:list -->'),
array('RulePage'=>'Annexes', 'Description'=> '<!-- wp:paragraph -->
<p>Annexes in T13 are constructed by combining Proficiencies together, first two Proficiency Threads are tied together to create a Skill, then as more Proficiencies are tied in the Skill becomes a Talent, or eventually a Power. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Annexes can be thought of like a musical chord, made up of individual notes (Proficiencies), but that all work together through harmony and dissonance to create a unique and more powerful and complex sound.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Proficiencies are like a unit of knowledge and experience. Imagine an early human, who has a Burden Proficiency in "Earth" and a Quiet Proficiency in "Plants" because they are both things they have knowledge of. By combining this knowledge of Earth and Plants they create a new Quiet-Burden Annex that is called "Herbal Supplies", which will now let them roll a bigger die than either their Burden or Quiet Facet Dice, when they are trying to find or identify herbs and plants.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Crisis Annexes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Crisis Annexes are created during play, when a Character rolls a Proficiency Crisis (or plays a Crisis card) they may fuse the rolled Proficiencies together and create a Skill or Talent (depending on how many were rolled), or increase either into being a Power.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, if a Character is trying to pick a lock, and has Proficiencies in "Locks" (a Key Prof) and "Tools" (a Craft Prof) they would roll 1d6 as a Proficiency die. If this die rolls a 1 or a 6 that creates a Crisis, "Locks" and "Tools" can be combined to create "Lock-picking" (C-K) or "Lock-smithing" (K-C). If they also had a "Silent" (Quiet Prof) that they also used, they would roll 2d6, a crisis would only occur on a 2 or a 12 but could create either Skill as a Talent with a Quiet Umbral, or perhaps a new Talent, such as "Sensory-Trance" (QCK), "Flow-State" (QKC) "Woodcraft" (QKC) or "Writing"(CKQ).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The created Annex should be useful to the Action that was being attempted at the time. In the case above, that could mean the Lock-picking or Lock-smithing are the most probable, but Sensory-Trance is possible as is Flow-state as they were just in the flow... but the Woodcraft and Writing annexes would not be. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is best if the Channelling Facet of the Annex reflects the Facet Test that was called for (if known), this prioritizes Lock-picking (or Sensory-Trance) over Lock-smithing or Flow-State as the created Annex.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A kind Referee might allow the new Annex to be rolled and replace the Facet from the original roll, or even add it to the Action Roll as an additional die.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Anatomy of an Annex</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Annexes are, like Hitches, a type of what we call a Knot in T13. Knots are built from the smaller components, usually Threads (although Pact Annexes use Characters instead of Threads). For most Character Annexes, the most important of the Threads are Proficiencies, and it is these Proficiencies and the Characters become tied together forming an Annex. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Annexes always have a Root Proficiency and a Channel Proficiency. The Facets of these Proficiencies govern what the Annex can do and achieve.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Annex" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Different types of Annex are built differently and have different uses:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="annexTypes" title="Annex Types Table" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Tangle</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Tangle of the Annex is a complication that adds a cost, limit, or restriction to the use of the Annex. Each Tangle interacts with the Umbral and Nimbed Proficiencies in a different way, but Tangles do not effect the Boon of the Annex directly. Every Annex has a Tangle which is most commonly also the Root of the Annex.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Tangles" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The Tangle can be any Proficiency already in the Annex, whether the Root, the Channel, or an Aura Proficiency, and can be changed whenever the Annex is redefined.  While technically a Skill has to have a Tangle, it will have no effect until the Annex has at least one Aura Proficiency, which means you can redefine the Tangle when you make a Skill into a Talent, or Talent into a Power, anyway.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Aura Proficiencies</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Within Talents, Powers and Super-Annexes when additional Proficiencies are added they are called Aura Proficiencies. Aura Proficiencies have a special effect that they influence the Annex with. Each Aura Proficiency interacts with the Tangle, increasing the cost, but the Auras come in two main types: The shadowy and yin-like Umbrals, and the bright and yang-like Nimbeds.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Purchasing Aura Proficiencies and adding them to a Talent, power or Super-Annex is fairly easy although the cost or difficulty will vary based on the Annex Type. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Adding a Proficiency as a Nimbed to a Talent after construction would have a Cost of 1 (the Proficiency being purchased) + 5 (altering a Talent) for a total of 6 Chi.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Umbrals</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Umbrals are the dark, yin-like aspects of Annexes. They give an Annex greater strength, but in return they add limits, penalties, and rules beyond those of the Tangle.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Any Umbral Proficiencies usually add their value to the Annex Value. So a Quiet of 16 could add another 83 value. That’s Value 232 which is Boon 29! However, Umbrals always add an additional cost or penalty to using the Annex, which varies by Facet and which type of Umbral you choose. Umbrals also interact with the Tangle of the Annex, as noted above, to add additional restrictions, limits and costs.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Annexes are limited in the number of possible Umbrals that they may have too, depending on if you want a Simplified system or complex and varying by type of Annex. See Annex Types Table above.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Umbrals" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Umbrals have various costs based on the Umbral Boon of the Facet. The Umbral Boon is the Facet Boon, ignoring any Scale modifiers or Monster Facet multipliers. A Character might be Scale 5 with an Umbral Boon of 13, this Umbral would count as Boon 13 for calculating Umbral costs, but would add 111 Value (the Value of Boon 18 which is Boon 13 at Scale 5).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Nimbeds</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Nimbeds are the bright, shining, yang-like aspects of Annexes. They add tricks and effects to the Annex, but do not increase the Boon of the Annex at all (usually). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Nimbed abilities always expand what you can achieve with an Annex, and can never act as any sort of limit. Nimbeds are completely positive in nature, but that means they must be limited somehow, otherwise everyone would just add every Nimbed to everything. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are two limits therefore placed on Nimbeds, the first being the limit of how many Proficiencies can be placed in a Talent or Power, the second limit is based on the number of Umbrals the Annex has and varies as follows by Setting and Annex Type. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="annexNimbedSlots" title="Annex Nimbed Slots" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Nimbeds do not add to the Value of the Annex, but do add some trick or special ability to the Annex. If you have multiple Nimbeds of the same Facet then the Nimbeds add an Edge or a Glow</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Nimbeds" /]
<!-- /wp:shortcode -->

<!-- wp:list -->
<ul><li>Two Nimbeds of a Facet generally add the Edge for that Facet.</li><li>Three Nimbeds of the same Facet add a Glow for that Facet.</li><li>Four or more Nimbeds of the same Facet each add an Automatic Success Level of the appropriate Facet.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Calculating Boons</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Annex Boons are generally calculated by adding Facet Values together for the Root and Channel Facet for a Skill. It is normal, if you don’t know your own Facets (perhaps you are using an Extra), to use the Stats of the Plot, or Setting, or you may assume a Boon of 13 (value 66) that is modified by your current Scale. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If a Character has a Craft of 13 (66) and a Key of 16 (83) then that gives Lock-picking a Value of 149 which gives a Boon of 22. If that Character is raised to Scale 1, then their Craft becomes effective Boon 14 (74) with a Key of effective Boon 17 (92); that creates a lock-picking Value of 166 or Boon 24, raising it by 2 Boons. However, adding another Scale raises that Boon to only 25.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule</strong> — Monster Facets can behave a little differently depending upon the Setting and Genre.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="monsterFacetRules" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Super-Annexes work differently, directly adding the Facet Boons, so the Lock-picking Super-Skill would have a Boon of 29 (see Super-Annexes)</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Talents</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When you are rolling Proficiencies in an Annex roll (perhaps after creating that Lock-picking Skill) if another Proficiency Crisis occurs, you may, create a new Skill or you may add one of the Crisis Proficiencies to the Skill Annex you rolled to create a Talent. Sometimes the Proficiency you rolled is one of the Proficiencies already in the Annex, when this occurs it is usual to purchase another Proficiency from the same Facet for half price.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>E.g. if you use the Lock-picking Skill to pick a lock and used "Lock" and "Tool" from the Annex as your Proficiencies. A Crisis occurs which could double up your "Lock" and "Tool" proficiencies, so for 1 Chi you could add the Craft Proficiency "Intricate" or "Lockpicks" and the Key Proficiency "Skeleton-keys", "Clasps", "Locking" or "Lock-smithing" or something else entirely as required, and agreed with their Arc Yarn-Teller and the Referee.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Powers</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Powers are essentially bigger Talents made from more Proficiencies. They are created when Talents are improved beyond their limits (called a Limit Break), although low-powered Powers can be created from a single Proficiency Crisis, especially if they are given multiple Umbrals early on. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Powers tend to grow slowly if Proficiency Crisis are the only way they are improved, however some Authors and Players will want to rush to maximising the power of their new Power. So they will spend Chi, Sway or time in practice to purchase more Proficiencies for the Annex. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Super-Annexes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Additionally, Yarn-Teller characters can have Super-Annexes, which might be a Super-Skill, Super-Talent or Super-Power, depending how they assign the Super-Annex. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Proficiency in a Super-Annex adds the Nimbed of its Facet (or an Edge, Glow, or Facet Success), and Umbrals and Tangles still add Value to the Annex. <br>Super-Annex Root and Channel add their Boons together directly to find their combined Value. E.g. Super-Lock-picking would add Craft 13 and Key 16 to give Boon 29 and then add additional Value from any Umbrals (such as Quiet mentioned above) on top of a Value of 244, so the Super-Talent would have a Value of 244+83=327 that’s Boon 35. It would also have Craft, Key, and Quiet Nimbeds</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normally a Yarn-Teller may have 1 Super-Annex (although there are some ways to get more). This Super-Annex is promoted from one of the Character’s current Annexes, and although a new Annex may replace the one promoted, this promotion does not deactivate the Slot, so it may still be used to support a Talent or Power.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Purchasing Annexes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Let’s face it, sometimes you need a new Skill, but don’t want to have to wait until a Crisis comes about in play, perhaps you are creating an experienced Character, or adding a new Alternate to a Character, and it doesn’t make sense to make them all start as Fresh Grunts, or then again maybe you have free slots and can get some training from a Guild or Mentor. There’s lots of reasons you might want to purchase an Annex.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Annexes have a fairly easy to calculate Chi Cost:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Base Cost of the Annex Type + The Boon of the Annex + The Cost of every Proficiency + The Nimbed Boons - The Umbral Boons</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="chicosttable" aspect="Annexes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>This means that Lock-picking Skill discussed above could be purchased for a total of : 2+22+2= 26 Chi. These Annex costs are also used to calculate the costs of Descendants, and Characters that have them (although usually Reduced if not a Master Annex).</p>
<!-- /wp:paragraph -->'),
	array('RulePage'=>'Monsters','Description'=>'<!-- wp:paragraph -->
<p>In T13 Monsters are a special type of Character that have additional abilities. Monsters are given at least one Monster Facet and access to a Monster Pool of cards that the Monster Facets govern the use of.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Monsters are often Conflict Embodiments, created by a Plot as a powerful adversary for a party of Heroes. Although in many Fantasy settings Monsters are endemic, they usually represent Conflict Embodiments at the Cycle level as parts of the Geo-Plot that builds the world setting.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Monsters, their Facets and Monster Pools can behave in a number of different ways. The Type of Monster, governs their description, the Value (and Boon) of the Monster Facet, as well as the initial Size of the Monster Pool, the Limit it can reach and how many cards shoud be Drawn to the Pool when it can Draw.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="monsterFacetRules" /]
<!-- /wp:shortcode -->



'),
    array('RulePage'=>'Patterns (Extras & Descendants)', 'Description'=> '<!-- wp:paragraph -->
<p>In T13 every aspect of the Game is built from smaller Components, Proficiency Threads and Facet Boons are combined to create Knots like Annexes and Hitches, and Knots can be combined to create Patterns.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Patterns are recurring things, that you might use once, or every time you use the system, as required. They can be pretty diverse, with Patterns including:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Extras: Who are the minimal Characters, Animals or Mobs, usually built around a Single Annex sometimes with a Hitch. Extras are usually created from a Yarn Card NPC Archettpe, which specifies a Persona, a Core and a Hitch, for each NPC type. Extras can also be easily given additional Annexes, Hitches or even Monster Facets to make them more powerful, and more of a challenge for PCs to defeat. </li><li>Descendants: Descendants are harder to understand. They are everything else that you might find in the universe, that isn’t a Character or Animal.  To start with it can easiest to think of Descendants as Props, things like the tools a Character might carry around, weapons, equipment, armour. Although, Descendants are so much more than that, they can be magic spells, martial arts, software, knowledge from books, reputations, guilds, companies, families, buildings, forests, land, planets, and much more.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Regardless of the type the Pattern is still largely the same. They consist of at least one Annex, called the Master Annex. A Pattern may have other Annexes, but is restricted in how many it can have and their type. If your Master Annex is a Power with Boon 45 then the Pattern could have 10 other Annexes, and the other Annexes could be at most Talent Annexes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normally with a Pattern you can have as many Talents as Skills (but no more) and the number of Talents Reduced (Score of a Boon) gives the number of Powers that can be had. So a Power 45 Boon could have 5 Skills and 5 Talents,  Power 51 Boon could have 6 Skills and 5 Talents. A Super-Skill Boon 45 could have 5 Skills, 4 Talents, 1 Power.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Number of Skills can be limited by the Referee, to the Ruins (Boon Draw / Boon Double Reduced), Banes (Boon Score / Boon Reduced) or the Boon of the Patterns largest Hitch, or not at all as they prefer. Character created Patterns are usually limited to the Ruins for Grunts, Banes for Heroes, and Boons for Yarn-Tellers, but the Referee and Plots are not limited in the same way (although it can help to be consistent).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Some Patterns can have special Master Annexes, these special Master Annexes sit above even Super-Annexes in terms of what they can unlock. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li> Extras for example can have Personality Annexes (which converts them into Archetype Characters). Personality Annexes are built from Hitches, Personas and Cores, and you can have up to 13 Hitches.</li><li> Locations (and Kaiju which are Extras with added Size) can have a Size Annex, which just reflects how big the Location is (using the Sway Table look up the Size and the Chi cost) the Boon of the Size Annex should match the Chi Cost.</li><li>Pacts have a Pact Annex.  The Pact Annex is exactly like the Size Annex of a Location, using the Group Size. However, the Pact Annex should also be at least equal to the Highest Personality Annex in the Pact. </li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Pattern Incarna</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Patterns should always have a Facet Incarna, to help decide what sort of Pattern it is. Extras for example are usually Flesh which is the Nature Incarna (although Spirits would be Awe Incarna).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Extras usually have a Character Incarna, such as these.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Incarna"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Where as Descendants have their own slightly different Incarna, that can specify what sort of Descendant they are.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Descendants"/]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Pattern Costs</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Building Patterns doesn’t come free. You can’t just merge a few Proficiencies and suddenly have a Laser Rifle, or new Castle. Patterns always have a long term cost.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> Of course, all of this should be handled by the server, but just in case you need to do it by hand, the cost is calculated as follows.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Patterns Cost (see Descendant or Extra Costs on the Sway Table) in Chi. e.g. A Location starts at 16 Chi.</li><li>+The Master Annex  Cost in Chi. The Annex Cost is calculated from the Boon, + all Nimbed Boons - all Umbral Boons + 1 for each Proficiency in the Annex.</li><li>+The Annex Cost Reduced of each additional Annex.</li><li>-The Boon of any Hitches the Pattern may have.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>This gives the Base Cost of the Pattern. That is then modified by things like the commonality of the Descendant (does everyone have one? must be cheap then). Commonality decides what type of Sway that the Pattern can be purchased with.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="descendantTypes" sub="Commonality"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The State that you found a physical Descendant in is also important.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="descendantTypes" sub="State"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>and finally Age of the Descendant also affects the cost (although not for Locations generally).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="descendantTypes" sub="Age"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The Setting Author or Referee has final say which of these modifiers should be applied, generally this would be the applicable modifiers that raises the price most. All Applicable modifiers should be applied to the Base Cost and then the Cost should be paid as appropriate. Generally speaking mulitplication and division should be applied before addition or subtraction. For example an Ancient Dirty Common Descendant would have the Base Cost &divide; 2  - 8 which should be paid in Chi.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Trophies, Prizes, Artefacts, Edges and Glows</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13, if you keep a Descendant for a long time, and look after it well, it becomes special. Hero Characters, like Mercari, can force additional Chi into a Descendant and make it special more quickly. We call these special Descendants "Trophies" although they also come in other flavours like Prizes, Chronoliths, and Real-Estate (created deliberately by Heroes), or even Artefacts and Provinces (deliberately created by Yarn-Tellers).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Trophies and Seats</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Trophies are normally created by Characters using a Descendant, Seats are their equivalent for Locations, technically Events are related to them when they ahve been performed. Slowly, under the right circumstances, Sway and Chi can accumulate in the Descendant. This can be accelerated by Geometry, I-Ching, and Nimbeds, but typically is the result of the Weilder gaining Chi from Success Levels when using the Descendant for its intended purpose.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Trophies can only store Chi or Yin and Yang equal to the maximum Score that their Annexes can generate (which is also usually the Stress Limit for each Boon Die see Stress).  So, if the Descendant Food Mixer only had a Master Annex that rolls 2d10-1 then that Trophy could store 19 Chi or 19 Yin and 19 Yang. If it also had a 1d8 Sub-Annex (in blending say) then it could store 27 Chi.  We call this amount of Chi the "Edge Tier Cost" as it can be used to purchase Edges for the Descendant. Note that a stored point of Yin and a stored point of Yang, or 2 points of Yin, or 2 Points of Yang, are all equal to a point of stored Chi.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> While a Trophy stores Chi, it may have an Edge, which grants it (or its wielder) some special bonus or ability. So that "Food Mixer" Descendant could hold 1-27 Chi and have an Edge.  </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Prizes, Real Estate and Chronoliths</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If a Trophy or Seat is full of Chi then it cannot naturally gain Chi any more. A Hero Character or Yarn-Teller may be able to force more Chi into the Trophy or Seat creating a Prize (also called a Monolith if made of rocks and gems or Real-Estate in the case of a Location). This creates a second Edge Tier that can be filled with Chi. Each Tier is the same size as the last and each Tier adds an Edge to the Prize or Real-Estate. So every Prize or Real-Estate begins with 2 Edges. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Prize (or Monolith in the case of Prized stones) can store Chi equal to the Value of the Boon of the Edge Tier Cost. So 27 Chi Edge Tier Cost Prize could store 216 Chi. We call this the Glow Tier Cost, and if a Prize reaches that amount of Stored Chi it can promote one of its Edges into being a Glow instead. It should be noted that this also limits the number of possible Edges that a Descendant can have. The example above could have at most 9 Edges when not full of Chi, and 8 and 1 Glow when full of Chi. Each time a Prize is filled it may change which Edge is a Glow, if it loses any Chi then the Glow will revert to being an Edge.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Chronoliths are events with Chi stored in them, any Moment, Duration or Age can be an event as can a single instant, adding Chi to an instant of time allows Hero Characters to manipulate those events in interesting ways, such as treating them a savepoint, reloading back to them later. Chronoliths generally have a Chi Edge Tier Cost of 8 Chi, but they can increase the Edge Tier Cost to grant them more Edges, if required.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Artefacts and Provinces</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Artefacts are even more powerful than Prizes, they can only be created by a Yarn-Teller, who must push the Chi over the Glow Limit by storing Yarn in the Descendant. They can also push Real-Estate into being Provinces</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each time an Artefact fills Chi to the Glow Tier Cost it may promote another Edge into being a Glow. Each time an Artefact loses Chi below a Glow Tier Cost a Glow will be demoted to an Edge again. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>An Artefact cannot have more Glows than Edges, and can never add another Edge, so eventually a balance is found. Our example Artefact could start with 1 Glow and 8 Edges with a total of 216 Chi, but could reach 4 Glows and 5 Edges after storing a total of 648 Chi in the Artefact, and would demote one Glow if it lost even 1 Chi.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Edges and Glows</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Edges add minor abilities and bonuses to a Descendant, some of which may affect the User or Owner (who may not be the same person if you lend the Descendant to someone, or steal one or find one in the wild). Glows are more powerful versions of the Edges, and are much more major abilities.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Glows and Edges come in two types. The first types can only be used on Descendants, and so are called Descendant Edges and Glows.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="descendantEdges" title="Descendant Edges and Glows"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The second type of Edge and Glow vary by Facet and are limited to Edge and Glow effects on the Annexes of the Descendant. They are often less powerful than the Descendant Edge and Glows, but are more diverse in flavour and result.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suits="all" aspect="Edge" title="Facet Edges" /]
<!-- /wp:shortcode -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suits="all" aspect="Glow" title="Facet Glows" /]
<!-- /wp:shortcode -->

'),
array('RulePage'=>'Pact Descendants','Description'=>'<!-- wp:paragraph -->
<p>In T13, we consider any group of people that share a common goal, no matter how loosely they are associated, as a Pact Descendant. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Pact Descendants can be used by Characters to summon allies from the Pact, get training, or in the case of companies draw a salary of Chi from the Pact. Pact Descendants can be as small as two people in a partnership of any type, to as large as the entirety of humanity across the Omniverse (an Omniversal Species Pact), and everything in between.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Anatomy of a Pact</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Pacts are built much like any Annex, as a collection of Proficiencies and Annexes, the Master Annex of a Pact is a variant of a Size Annex called a Pact Annex. A Pact Annex is is built not from Proficiency Threads, but from the Characters in the Pact. Technically you could consider each Character to add a portion of their own Personality Value to the Pacts they join, but that implies the Value is used up, when this is not strictly the case, and would require a complex model that no one has time for.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Instead, the normal way to calculate the Pact Annex Boon is based on the number of members and the most powerful member of the Pact (where the power of the Pact is based on their Character Type).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="chicosttable" aspect="Character"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>You want the Chi Cost for the Character Type. So a Pact with a Yarn-Teller member has a minimum Boon of 21.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Group size of the Membership is also important again adding the Chi for the size of the appropriate size of the Membership.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="chicosttable" aspect="Group_Size" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>So you can see that a Pact of 5 Vexes would have a Boon of 5, but a group of around a hundred Heroes would have a Boon of 25. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This gives us the Boon of the Pact, but tells us nothing about the structure or even what sort of membership the Pact has. Or even how a Character becomes a member.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="chicosttable" aspect="Pact" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Every Pact has a Pact Boon, and several Proficiencies, and depending upon the Pact Type a number of Sub-Annexes. The Pact also has a number of Tiers. The Maximum number of Tiers is equal to the Pact Score. So those 5 Vexes we discussed, their Pact would have 2 Tiers.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If a group of Characters come together in the same space then they have formed a group, and along with it technically a Group Pact, although no one has necessarily paid to join the group, or paid to create it, it just exists.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In this "unpaid" situation we consider all members to be Tier 0 Members. Tier 0 Belonging Membership offers no benefits, but has not associated costs either. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So Purchasing membership is the only way to get the benefits of the Pact. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Pact Descendant Costs: Pacts Base Costs are calculated like any normal Descendant:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Base Cost = Pact Type Cost + Pact Boon + each Sub-Annex cost Reduced - Bane of any Hitches +1 Per Extra Proficiency.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Membership Tiers</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Pacts have a number of Tiers equal to the Pact Score. A Character can purchase any Membership Type at any Tier (and yes you can have Tier 0 Sovereigns, typically they know nothing about the Pact and what their duties in the Pact are, but are technically in charge).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Tier that a Character has purchased controls the number of Annexes and Proficiencies that a Character can access in the Pact. A Character with Tier 4 Executive Access can access 1 Power, and 3 Talents, Skills or Proficiencies from the Pact. It is usual with Pacts to purchase the most powerful type of Annex for that membership first, as there are no requirements unless stated by the Pact itself.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Purchasing Membership has a cost equal to the Base Cost of the Pact + the Membership Type Cost × the Tier being purchased. This creates the Membership Base Cost.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So a Tier 0 always adds 0 to the Pact Cost no matter what Tier is being purchased, but they equally add no Annexes or Proficiencies.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This Membership Base Cost can be modified by the Commonality  Reputation and History of the Pact, as follows.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="descendantTypes" sub="Commonality" title="Commonality of Pact" /]
[t13ne type="displaytable" array="descendantTypes" sub="Pact_Reputation" title="Reputation"/]

[t13ne type="displaytable" array="descendantTypes" sub="Pact_History" title="History"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>All applicable modifiers on the Pact should be applied, so a Common Traditional Public Pact (such as membership of the local library) should have a cost equal to the Base Cost in Chi or Bold Facet Sway.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Pact Ages</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Pact is given a Significator Card. This card defines the Age of the Pact. A Pact Age defines the social age that the Pact is currently experiencing, that might be an Age of Opportunity all the way through to an Age of Incursion.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="cardtable" aspect="socialAge" suit="all"]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The Social Age defines what issues face the Pact at this time, although it is up to the Yarn-Teller how much these effect the current Plots and so on. Although, it is recommended that the Social Age reflects the situation of the Tapestry and the current Plots whenever possible.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Typically, the Social Age of the Pact is defined by the Yarn-Teller or Author who created the Pact (or the Tapestry) when they built it. However, Social Ages are not fixed and some circumstances can force a the Social Age to change. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Narrative Necessity</strong> — If the Plot needs the Social Age to change then the Yarn-Teller running that Plot can play a card to replace the Social Age. Typically the Plot will require a specific Age, but perhaps one close will substitute if the card is not available.</li><li><strong>Rule Requirement</strong>  — Each Social Age has rules that govern how that Age works, sometimes the Age also has rules that define what brings the Age to an end. If these Rules Requirements are met the Social Age is changed to the current card atop the Discard Pile.</li><li><strong>Durational Demand</strong> — Social Ages have a natural lifespan that is based on the Boon of the Pact as a Chi Extend Duration. So a group of 5 Vexes will change Age every few minutes or Short Scene. The hundred(ish) Heroes will change Age every week. Human societies are also limited to a maximum Social Age of 60 Years regardless of their actual Boon, but Immortals and other races can have much longer limits, depending upon the setting. Although even Gods are usually limited to at most a Galactic Revolution of 230 million years for a Social Age.</li></ul>
<!-- /wp:list -->
'),
        array('RulePage'=>'Character Catalysts','Description'=>'<!-- wp:paragraph -->
<p>T13 is a Narrative Engine, which means you can use it to create narratives, whether a short-story or a twenty-volume epic fantasy novel series (theoretically, the most I have actually used it for is single Trilogy, with some associated short-stories, so far). Narratives in this sense can be created by a single Author, who can control and tweak every aspect of the narrative, Characters and conflicts from every side, or they can be created by a group of players, improvising a game together. Narratives work best when Characters are not just involved in the events that are occurring around them, but when their motivations and goals are linked to the Narrative that is being created. We call these huge lists of different types of potential motivations, Character Catalysts.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Catalyst Types</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Characters have a number of baked in goals, motivations, drives, desires, wishes, urges, dreams, tensions and pressures upon them that all blend together. Some are internal to a Character, others are external forces created by Pacts, Plots or Events that belong to the Tapestry, but these are not the only types. Each type of Catalyst is a little different and enourages certain behaviours from the Character in different ways.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="characterCatalysts" title="Types of Character Catalysts" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>These Types of Catalysts have limited ways that can affect a Character, limited largely to Carrot and/or  Stick. They might offer a Gain of something, for some preferred behaviour, or they add additional Obstacles, Hazards, Turms or similar, if a Character does not behave as they want, ideally every Catalyst can be summarised for a Yarn-Teller or Referee as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Catalyst Factor</strong> — What is the situation the Catalyst is referring to? What is required of the Character, what must they do or not do?</li><li><strong>Catalyst Carrot</strong> — What incentives are being offered the Character to conform to the Catalyst Factor? What are they being offered to comply? Typically a Gain is offered as a Carrot, this might be a few points of Yin, a bucket of Chi, an additional Success on an Action, or a powerful new Descendant.</li><li><strong>Catalyst Stick</strong> — What will happen if the Character doesn’t? What will go wrong if they do? What are the consequences of the Factor? Often a Stick will include creating additional Hazards, Turns, Failure Levels and Wounds for the Character or may even affect entire Nations (depending upon the Catalyst).</li><li><strong>Catalyst Bluff</strong> — What is no one telling the Character about this Factor? What lies are people telling here? Sometimes the Catalyst Bluff is simply that the Factor, Carrot, or Stick is not actually what it seems. Bluffs should be kept secret from the Character, and only revealed when appropriate to the narrative (if the Factor involves walking into a minefield, then a Bluff may keep that secret until someone steps on a mine, if no one spots it earlier).</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Catalysts can have a lot different effects and purposes depending upon not just the type, but the Factors, Carrots, Sticks and Bluffs in play. While every Catalyst must have a Factor specified, not every Catalyst will have a Carrot, Bluff or Stick, although usually it will have at least one. If a Catalyst does not have a Carrot for example, then there is almost always a Stick involved. If a Catalyst has no Stick, then the Carrot <strong><em>must</em></strong> be specified. Bluffs are strictly optional, although Yarn-Tellers are encouraged to consider what Bluff might be appropriate for any Catalyst, as not only will thinking about the potential Bluffs create a better Catalyst, it may also reveal potential Turns and even Twists in the tale.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters can have a number of potential Catalysts open to them at any time. A Player, or an Author, could randomly determine which Catalyst a Character is currently most concerned about, although most Players will bear in mind the relative Carrots and Perils and usually do their best to keep themselves healthy, wealthy and happy as much as possible.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Psychosocial Character Catalysis</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The way that you use Psychosocial Action Spaces in the game has a profound effect upon the way that Character Catalysts can work within the Narrative and game. Private Psychosocial Spaces are effectively a complex board game that can model the internal psychic landscape of a Character. Within this space various Psychosocial Characters can wander, most importantly, the Character’s internal selves. Depending upon the exact Psychosocial model being used, there may be a single internal self, or a number (for example an Id, Ego and Super-Ego representation, or a Self, Shadow and other Jungian Archetypes). Typically moving these Characters around will expose different parts of the Self to each other. This can be roleplayed out, or it can be treated as a board game, where the interactions define the surface Catalysts that are roleplayed. For writers this internalised activity can create internal monologues, intrusive thoughts, as well as complex interacting motivations and characterisation.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Within the Psychosocial Space all the internal Characters move, some Characters are inherent to the space (acting as Guards, or Entertainers, and so on within that space). Encountering these internal Characters can reveal aspects of the Character. If the inner Self is meeting a guard, then perhaps their outer-self will unexpectedly act in a defensive or suspicious manner, if they are chatting to an entertainer, perhaps they might begin to whistle, hum or sing under their breath, or suddenly tell a joke that "occurs" to them. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you are using a Jungian model, then there will be Archetypes, who may blend aspects of external Characters, as they represent the Archetype for the Character. If a Character thinks of another Character in a mentor-like way, then they may become a robed wizard, or school teacher in the Psychosocial space. When an internal Character encounters an Archetype like this their external Character usually begins to take on aspects of the Archetype themselves.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Additionally memories of other people will exist as Characters within the Psychosocial space, these Characters are internal representations of how the Character believes these people might be and react, so they often have imagined goals and motives that are not truly those of the real Character, often distorted by a lack of true understanding. Meeting these Characters can create emotional responses in the Character, that they often cannot explain easily away, until they realise the reason they exploded at their boss is because they reminded them of their school bully, or whatever.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Interactions between the internal Characters, particularly with the Inner Self can make the Character think about those external people, reprioritize or even create new Catalysts so that they try to get in touch with them. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Inner Self is present in a Psychosocial Location that is connected to a particular motivation, Drive, Wish, Desire, etc, this motivation will be particularly important to the Character at that time.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<aside class="t13ne-example"><p>For example, Kevin the Pious, is engaged in a pitched battle with the fallen angel Meteriel. During the battle Kevin uses his "Redeeming Stare" Power to affect Meteriel. Meteriel’s Inner Self is currently in both his Passions and his Darkness, specifically the intersection of those areas responsible for Meteriel taking pleasure and pride in killing mortals.</p><p>Kevin uses "Redeeming Stare" to create a Psychosocial Throw, with 3 Cards. Ideally Kevin would Throw Meteriel into his Principles (specificially "Thou Shalt not kill"), but he quickly realises he doesn’t have enough Pips to achieve that. Instead, Kevin throws Meteriel’s Inner Self deeper into his Darkness. This allows Meteriel’s original Alt, who does not remember the fall to emerge.</p><p>Of course, Meteriel will not remain in this confused state long, the Alt will naturally reach for his memories and remember his fall, which will condemn this Alt back into the Darkness and allow the Fallen Meteriel to remerge once again. But it will buy Kevin at least a little time, perhaps time enough for a prayer.</p></aside>
<!-- /wp:html -->

<!-- wp:heading -->
<h2>Catalyst Collisions</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes a Character may have two Catalysts that oppose each other. If, for example, a Character wishes to become the richest Billionaire, but also want to explore space, then they might find that the cost of exploring space endangers their ability to be the richest Billionaire (at least if they are doing it right). When this occurs, two Catalysts coming into conflict, we call it a Catalyst Collision.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During a Catalyst Collision a Character can ignore all other Catalysts, except the two that are colliding. They should then assess the two Catalysts directly against each other. Catalysts can be scored by the Character as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Compare Sticks</strong> — The Sticks of the two Catalysts should be compared. The Catalyst that has the worst Stick (in the Character’s or Player’s opinion) is scored with a 5, the other Catalyst scores 3 if it has a Stick and 0 if it has none.</li><li><strong>Compare Carrots</strong> — The Carrots of the two Catalysts should be compared. The Catalyst that has the best Carrot (in the Character’s opinion) is scored with a 3, the other Catalyst scores 2 if it has a Carrot, or 0 if it doesn’t.</li><li><strong>Compare Bluffs</strong> This is more tricky as the Character cannot know the Bluffs until they have been revealed, so each revealed Bluff on a Catalyst typically adds +1 to that Catalyst, regardless of how it changed the Catalyst (better the devil you know).</li><li><strong>Compare Factors</strong> — The Factors of the two Catalysts should be compared. The Catalyst that has the more simply accomplished Factor will score 2 the other will score 1.</li><li><strong>Compare Scores</strong> — Both Catalysts now have a numerical Score that can be compared. The Catalyst with the higher Score is considered the more important for the Character and should receive the focus. <ul><li>A Catalyst that Scores 5 less than another is either completely removed, or a Bluff must be revealed that causes a second round of comparisons. Think of a truck hitting a little car, that little car better be surprisingly made of Orichalcum or enchanted against crashes, or it is toast.</li><li>A Catalyst that Scores 1-4 points less is going to be ignored for now, but is not removed. Think of two similar-but different sized cars crashing, the larger car will still travel forwards, but the smaller car will be forced back. </li><li>If the two Catalysts are exactly balanced, and both have more than 3 points, then they will create a new Internalised Plot for the Character that will attempt to resolve this Collision with a Conflict. This is a head-on collision between trucks. Chances are, both are going to be wiped out, along with a lot of collateral damage.</li><li>If the two Catalysts are exactly balanced with less than 3 points, then the Catalysts will be merged. This is like two cars hitting each other head on. The cars are likely to be both wrecked, twisted together by the forces. This creates a new Catalyst that encompasses both former Catalysts as best it can, although it often becomes more a hinderance to the Character than a real goal.</li><li>If two Catalysts are exactly balanced and have more than 7 points each then both Catalysts will be removed. This represents a Character moving past these Goals or Desires. This may cause a Hitch to resolve, or a Character to change the name they use (change Geometry), change their Facet Boons (swapping Yin and Yang Boons to change I-Ching), change Persona, or Core. It can even unhook a Character Embodiment (although Plots typically hate that, and will immediately try to Hook a replacement, however they rarely try to rehook the same Character).</li></ul></li></ol>
<!-- /wp:list -->

            '),
		array('RulePage'=>'Modelling Resources','Description'=> '
		<!-- wp:paragraph -->
<p>In T13, Resources can be modelled in a number of different ways, but all Resources are essentially Sway. The wealth of a multinational corporation, for example, is just an amount of Burden-flavoured Facet Sway, but much of that wealth would be tied up in other ways. Some of it is combined with other resources, such as the company’s international reach (Yonder Facet Sway), or their political support (Dominion Facet Sway), which creates Chi instead, that could be invested back into the Characters that own it, or the Pact itself. But there are many ways the resources of the company can be modelled.</p>
<!-- /wp:paragraph -->
<!-- wp:heading -->
<h2>Resource Models</h2>
<!-- /wp:heading -->
<!-- wp:list -->
<ul><li><strong>Sway</strong> — A lot of resources can be modelled as Sway. Sway can be stored by Characters and Descendants, although Pact Descendants can store even more. This methood is very precise, but becomes an effort in accounting.</li><li><strong>Style Reserves</strong> — During Ordeals cards can be Prepared into Style Reserves. These Style Reserves can store Sway in the form of Prepared Score (Tao Sway), and Prepared Cards (Chi). Style Reserves are generally not meant to represent stored resources beyond the Ordeal.</li><li><strong>Sway Cache</strong> — Sway Cache are a simple way to store a Resource, consisting of nothing but a Proficiency to describe the Resource and a Score (e.g. "Wallet of Cash" Score: 7). <ul><li>This Score is always Facet aligned with the Proficiency used, so a Wealth Burden Score must have a Burden Proficiency.</li><li>Creating a Resource Cache is cheap, as the only cost is the Proficiency that must be purchased with the Score being stored (that wallet of cash was created with a Wealth Roll of 9 so 2 Wealth purchase the Proficiency).</li><li>When a Sway Cache is used you may elect to use either the Proficiency or the Score, but not both. For example, using a Wallet full of Cash could either add the 7 Score to an Action, helping purchase something, or the Proficiency could be used to build a Wealth Annex.</li><li>Score can be spent from a Sway Cache, but with a cost of 2 Score each time it is accessed (so spending 2 Wealth from the Wallet of cash will result in "Wallet of Cash" Score:3).</li><li>Sway Caches can be merged together if they are of the same Facet, but this destroys both Sway Caches and their Proficiencies, but creates a new Sway Cache with a free Proficiency and a combined Score (e.g. Adding together 2, or more, Wallets of Cash could create a "Bag of Cash" (14) or perhaps a "Briefcase full of Cash" (21) as more are added).</li></ul></li><li><strong>Annexes</strong> — An Annex can represent a managed resource. A Character or Descendant could have a "Wealth" Annex, generating Wealth Burden-Flavoured Facet Sway. The Boon of the Annex here represents the amount of Wealth, not in the same way as a pile of Sway, but rather how much Wealth the Annex can generate with a single Action. </li><li><strong>Trophies</strong> — Characters can also store Chi within Descendants. This makes the Descendant into a Trophy, Monolith or Artefact.</li></ul>
<!--/wp:list -->

<!-- wp:heading -->
<h2>Resource Management</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Lots of games use Resource Management as more than a simple mechanic, but an actual part of the gameplay cycle. You may have to farm food to survive, or harvest XP to get levels for enchantments, gather troops to your cause, arm those troops and feed them, or simply acquire gold for purchases. Resources are important ways of measuring survival and success. T13 can easily accommodate such play through the use of Sway and Ordeals, and here are presented some examples of how a Yarn-Teller can handle resource management. In general, these examples are based on Wealth (the Burden <span class="t13ne-blackcard">&clubs</span> Yin Sway), but any Facet Sway could be the Resource that requires accumulation, spending or nurturing.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is important when dealing with Resource Management to bear in mind the relative power levels of the Facet Sways. In a civilised environment, for example, Wealth will often be Bold, but in a more rural environment wealth becomes less important, becoming only Intrepid, in the wilds far from any shopping Wealth is Banal at best. Just as Facet Sway can vary in power with genre and setting Resources can also. Resources are directly tied to Facet Sway after all.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<p><strong>Optional Rule: </strong> During Survival situations there is an ongoing drain of Sway from every Character. The Sway Drain is typically 1 of the Facet Sway, such as Breath, Surge, etc. However, how often the Drain occurs is based on the situation the Character finds themselves in. <ul><li>A Character who is in a Vacuum for example will lose a Breath every 3 Rounds.</li><li>A Character in a desert without water will lose an Endurance every hour</li><li>A Character naked in Snow would lose a Fever every five minutes.</li><li>A Character without food, would lose Health every 2-8 hours depending upon how often they usually eat.</li><li>A spy or undercover cop in a deep cover situation may lose a Cover or Guise every day.</li><li>A politician may lose a Support each week that they continue with an unpopular policy.</li><li>A Character who is wallowing in minor debts may suffer a lose of a Wealth every month.</li></ul></p>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Managing Sway can be as simple as having to meet a Difficulty with Yarn, Chi or Wealth (Burden Yin), in much the same way as a Test is rolled, but the Difficulty involved is too great to manage with a single roll or even during a normal Ordeal. Most Resource Management Ordeals are usually about managing larger things than a simple purchase though, and several Action types are included specifically for this sort of thing.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Harvest</strong>: A Harvest Action gathers an amount of a specific Facet Sway. The amount of Sway gleaned from a Harvest is usually a small, but steady amount. Harvest actions vary in implementation as follows:<ul><li>Take 1 Point of the Sway for a Harvest. You can simply make 1 Wealth point per turn.</li><li>Pay 1 Point of Facet Sway from a suited Facet and Roll a Facet Die for the Harvest (or gather the Facet Score). Pay a Surge, or Support and gather points of Wealth.</li><li>Pay 2, 4 or 5 Points of suited Facet Sway (depending upon Bold, Intrepid or Banal) to Play a card from your Ordeal Pool, gaining Twice the Card Pips in Facet Sway. However, the suit played must match the required Facet (so Wealth requires playing a Club).</li></ul></li><li><strong>Payment</strong>: A Payment Action represents ongoing costs and difficulties that the Ordeal contains. Payment actions are called for by the Yarn-Teller or Referee every few Phases usually. Although, you can usually make a Payment early, and skip the next Payment action (but only the next one). <ul><li>Payment Actions can occur randomly (triggered by any Dice rolling a result that the digits add to 1 or 10 e.g. 1,10,19,28,37,46,55 etc this is based on the gematria of Payment).</li><li>Payment Actions can occur regularly (once every few Actions, Phases or every Round or Stage for example).</li><li>Payment Actions can occur in some sequence (such as in Phases 1, 5, 8, 10, 11 and 12) or other preplanned order.</li><li>Payments can have a set cost (often a proportion of the Difficulty) such as 12 Wealth.</li><li>Payments can have a random cost (usually based on a Facet die) such as 2d4-1 Wealth for Burden Boon 13.</li></ul></li><li><strong>Store</strong>: You can put resources away because you have an excess. You cannot have more points of a Facet Sway than that Facet Boon, so in order to create huge amounts of specific Sway it must be stored. Storing Sway is usually done by either converting into Chi (which is usually lossy with 5 Sway creating only 2 Chi for Storage for example), storing in a Style Reserve (such as the Aiming Reserve) or by creating Trophies or Sway Caches (see Resources).</li><li><strong>Resource Replenishment</strong>, Chi can be converted into Resource Sway by making a specific Resource Replenishment action (such as Healing in the case of replenishing Health). This is done by making a Resource Replenishment Facet Roll on the Facet that you are trying to convert the Sway <strong>into</strong>. A Replenishment roll fills up a Resource to the Maximum (usually the Facet Boon including Scale).<ul><li>The Difficulty of the roll is equal to the number of Resource Sway that you are trying to create. So if you have a Nature of 13 and currently have 6 points of Health, the Difficulty to Replenish would be 7.</li></ul><ul><li>If this Difficulty is beaten then Chi may be converted into Resource Sway as required. The Chi spent is usually doubled to create the amount of the Resource Sway, although a Higher-powered game, or because of  an easily accessible item or Skill, you may receive the Value of the Chi as a Boon instead.</li><li>Failure to pass the Difficulty means that you cannot convert Chi into the Resource, however you can pay 1 Chi to replenish 1 Sway (half the Chi is lost).</li></ul></li><li><strong>Convert Facet Sway</strong>: You can convert Sway between types with this Action. Converting Sway can be done in a number of ways:<ul><li>Conversion to Tao Yin or Tao Yang Sway (costs 1 point of Facet Sway). This allows you convert Cheers into Wealth for 1 Cheer.</li><li>Conversion to Chi and back. This might allow you to convert Breath into Wealth via a usually Low-powered conversion. 5 Breath becomes 2 Chi, which then becomes 4 Wealth.</li><li>Direct Conversion. The Score of one Facet can be Converted to the Score of another, with a cost of 1. E.g. If you have a Facet pair at Burden 18 and Gossamer 8 then you can convert 5 Wealth into (3-1=) 2 Breaths or 3 Breaths into (5-1=) 4 Wealth. </li></ul></li><li><strong>Trade</strong>: You can swap resources with another Character. Perhaps you Trade your Breaths for their Wealth, doing some work for them stacking their trade goods. <ul><li>Trades are usually carried out on a Facet Score to Facet Score basis, with anything better than Conversion being considered a good trade. E.g. If your Gossamer is 13 and Burden 13, you can Trade up to 4 of either and consider them equal in value, an employer may have a Gossamer of 8 and Burden 18 letting them Trade up to 3 Breaths or 5 Wealth. They therefore think 5 Wealth is an appropriate Trade for 3 Breaths (better than the 2 they can convert themselves). They offer 5 Wealth and you Trade 4 Breaths. Both of you should feel good about that Trade.</li></ul></li><li><strong>Attack</strong>: Attacks can be made directly by resources on another’s resources, but they behave a little differently to normal Ordeal attacks (although if they are used in combination they are treated as "Financial Attacks" regardless of the Facet). <ul><li>Attacks usually cost 4/8/12 Sway to begin. This draws and Plays 1 card.</li><li>The Card does direct Resource damage (destroying 2 Sway per Pip) if suited with the Resource being spent, or the Resource being attacked, otherwise it does 1 Sway per Pip.</li><li>Multiple cards can be played and drawn at once for higher costs as seen on the Sway Table. </li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Death, Injury and Healing by Resources</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is normal for the Facet Sway of a Character’s Incarna Facet to be called their Incarna Sway. It is this Facet Sway that the Character uses to keep their body together and functioning. Most often this Incarna Sway is Nature’s Health Sway. Incarna Sway behaves a lot like Chi for the purposes of physical actions to do with their body, and is never considered low-powered for Incarna purposes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normally a Resource Attack can just attack the targeted resource without needing special Rules, but when the targeted Resource is an Incarna Sway then we get some slightly different issues.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Wounds are taken by losing Incarna Sway. The number of points lost determines the Wound taken in the attack just as Card Pips. 10 Health lost at once is equal to a Crippling Wound at Higher Stakes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>However, if a Character loses all their Health then immediately another Wound card is drawn and applied on top of any caused by the attack. This ends that attack (even if they had only 1 Incarna Sway left). So a Character on 5 Health who is hit for 10 is now on 0 Health and takes a Crippling Wound (probably) and draws a Mortal Wound randomly as well.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Character with 0 Incarna Sway cannot use their body or form for any purpose. They are effectively unconscious, or paralysed, until they get at least one point of Incarna Sway back, although their exact state varies by what the Incarna is. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is usual for a Character to immediately convert Chi or another Facet Sway into at least 1 Incarna Sway if they have none. Some Characters will immediately refill their Incarna Sway completely, but others will hang around 1 for a while.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Counter-intuitively Characters may spend Incarna Sway as though it was Chi to Remove Wounds or Heal them (as noted on the Sway table). This is usually done over time, to pay off large Wounds (as removing a Mortal Wound completely costs 43 Health normally). When paying off a Wound like this the Character may store the Health (or Chi) on the Wound until paid off in full. It is more normal to Heal a Mortal Wound into a Crippling Wound for only 24 Health, again the Health can be accumulated on the Wound.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Character with no Sway who is attacked is generally dead, and unplayable thereafter. Even Increated don’t generally come back from being completely drained of everything (although since Shades does not interact with time linearly they may still turn up again).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Normal Ordeals and Resource Attacks</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In a normal Ordeal, only Resource attacks affect the Character’s resources, draining them of a Specific Sway or Chi based on Pips as Yarn.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Generally speaking the Resources attacked should be specified during the card play and are paid immediately. Most combat attacks for instance will attack a Character’s Incarna Sway (Nature Facet Sway or Health), but attacks may target any Resource with a suitable Narration / or Narrative reasoning.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Playing a card and defending against them is performed as normal, but when Wounds are assigned they do not have the normal effects, but instead drain the Sway Resources of the Character. Exactly as described above for Resource Ordeals.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>As another optional Rule, any attack that will take more than half the Character’s current Resource can be spread to other Resources as well. So if a three card attack is focused on Health the cards (An Ace of Diamonds, 5 of Spades and 6 of Hearts),  may cause 4, 2 and 2 points of Health, for a total of 8 (and 27 Pips Total) , this causes more than half the Health to be lost in one go (13 Nature would give 13 Health) so the Player will lose 6 Health, and 2 Points of Health must be paid by another Resource. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Yarn-Teller must agree the other Sway used (for example Dignity, Wealth or Effort). These Points of Damage are paid on a 2 for 1 basis (so the Attack could take 4 points of Effort instead of the extra 2 Points of Health) when paid in another Sway Resource, or they may be paid in Chi, however when paying in Chi the calculation is a bit different. If there were no Health Points the 27 Pips would try to drain 216 Chi, but we’ve already dealt with 6 of the 8 Health Points. So instead we look up the Super-Value of Boon 2 and pay that in Chi (16 Chi).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Another optional Rule that can be used during a Resource Attack is that if any Resource loses more points than the Facet Score in one blow then the Character is considered Staggered (and take 1 GRT). So any Health Attack that causes more than 4 Points of Health to be lost in one attack (if Nature Facet is Boon 13), will cause the Character to be staggered for 1 GRT.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Resource Attacks are only possible if individual Facet Resources are used in the game, otherwise use the standard Economic rules that effect only Sway or Chi as standard on a Pip for point basis.</p>
<!-- /wp:paragraph -->
		'),
		array('RulePage'=>'Test (Value)', 'Description'=>'<!-- wp:paragraph -->
<p>In T13 you can test things by comparing Values. This can be done directly with the largest Value automatically winning. Generally this is done by using the opposed Facet. So a Miasma Value is used to create a Value that a Phoenix healing Value would compare to. None direct comparisons are also possible, although usually a Yang Facet will oppose a Yin Facet. And Values can be added from multiple sources. For example, if two characters use their Zeal of 13 {Value 66} to push a car (with an Inertia of 18 {111}) then adding their Values gives 66+66=132 Value, so they succeed in pushing the car.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Values can also be calculated from Difficulties. Normally by taking the Difficulty selected and looking up the Value as though it were a Score. So a Difficulty of 13 would require a Value of 1087 to beat (or 17 Boon 13 people working together). Value Tests are not generally considered the best Tests to use against a Difficulty however, as rolls are much more interesting in a game context, where Dice Pool, Single Roll and Card Draw Tests are generally preferred. However, Yarn-tellers and Referees can just complicate a Value Test if they prefer.</p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h2>Complicating Value Tests</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When the comparison is not a pair of opposed Facets the Referee may impose additional complications to the Test in the form of Failure Levels.
 For example, when pushing a Car Characters might want to use their Gossamer rather than their Zeal, since Gossamer is a Spades Facet, and Zeal is a Diamonds Facet the Test will add a Failure Level (Perhaps a Fumble, making one of the Characters drop something on the road as they push). Failure Levels should be added if the Facet is a different coloured Suit (Red or Black). Another Failure Level is added if you oppose a Yin Facet with another Yin Facet or a Yang Facet with another Yang Facet. See the Rules Page on <a href="/success-and-failure-levels/">Success and Failure Levels</a> for more details.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> Maybe that is a bit too certain for you and your gamers. Maybe you think that one guy pushing a car should be possible, but don’t want to reduce the Inertia of the car... Or perhaps you just want a chance to fail when Values should guarantee success. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you want a more random Value comparison you can use a percentage chance. Decide who is being Tested (usually the one with the smaller Value) and then divide their Value by the combined Value of both sides and multiply by 100 to create a percentage. The above car pushing example gives one person a 66/66+111 = 37% chance of moving the car. For two people pushing as above, we instead Test if the car can resist them (111/243) = 46% chance that the car will successfully resist.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can then roll a d100 and see if you can get lower than the % calculated.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Further Complicating Value Tests</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The problem with the Value Test is that it usually supplies either a pass or a fail. It has limited ways of gaining Success and Failure Levels. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I don’t know about you, but for me that just isn’t good enough for a truly fun experience. So here are some options to confuse and excite the results.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Doubles are special. If you roll a d100 and the units and the tens match the digit, then that can indicate an extra Success Level or Failure Level, depending on if it would be a pass or fail.</li><li>Multiples. If you roll a multiple of the required number on the Value Test then you gain extra Failure Levels, if you roll less than half, third or a quarter you Gain Success Levels. e.g. If the Test is set at 34% if you roll 68 that’s an additional Failure Level, if you roll 17 that’s an extra Success Level.</li><li>Numerology: If the digits are added together and then collapsed in the Germatria method of Geometries that can create an additional number from 1-13. e.g. rolling 24 gives us a 6. If this number matches the Character’s Geometry then they gain an additional Success Level regardless of pass or failure.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>To see more about Success and Failure Levels read the Rules on Success Levels.</p>
<!-- /wp:paragraph -->'),
		array('RulePage'=>'Test (Card Draw)', 'Description'=>'
<!-- wp:paragraph -->
<p>In T13 it is possible to conduct a Test against a single Facet (potentially using an Annex) using Ordeal Cards instead of dice. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Card Draw Test is intended to be used when a Test has multiple Characters competing and can either act as a standard Test or have only one winner, but you do not want to conduct a full Ordeal for this situation. This is usually due to a time or pacing constraint. The Card Draw Test works best for a Test where multiple Characters are interacting, and ideally are competing in some way, an ideal example may be a quick foot race between the Characters to get to the cafeteria. This is more of a Character moment than anything else and the idea of running a full Ordeal eveytime would fill most Yarn-Tellers or Referees with dread. Instead, we can simplify that whole Ordeal into a single Card Draw Test that will rank our runners, and even potentially reveal consequences for those who are not fast enough.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Card Draw Test works as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Yarn-Teller must set a Difficulty for the Card Draw Test. This is usually done as a Chi  / Bold / (Pips) Difficulty (although this can be altered to Monstrous or Intrepid if the Yarn-Teller has specific Monster Facets in play, or a situation is particularly Difficult). This Difficulty can also be created with an Ordeal Card.</li><li>Each Character involved in the Test should Draw a single Ordeal Card, this card is not added to a Pool, but instead adds its Pips to the Facet or Annex Draw. E.g. a Trial of 16 could add +2 Pips to a Trial Test.</li><li>Card Pips can also be adjusted by the Suit of the card played. Each Facet&#39;s own Suit acts as a Trump for its Tests, adding +2 Pips. E.g. Spades <span class="t13ne-blackcard">♠</span> will add +2 Pips on a Trial Test. </li><li>The Anti-Facet of the Suit being Tested defines the Opposed Suit. The Opposed Suit adds a Failure Level automatically. E.g. For Trial, Rook is the Anti-Facet, so Clubs <span class="t13ne-blackcard">♣</span> suffer a Failure Level automatically.</li><li>Any Suit with the opposite colour may also incur a Failure Level. So in this example Trial case all Diamonds <span class="t13ne-redcard">♦</span> and Hearts <span class="t13ne-redcard">♥</span> add a Failure Level.</li><li>Each applicable Proficiency will add +1 if it is from an Unsuited Facet, +2 for an Unsuited but same coloured Facet and +5 for a Suited Facet. E.g. If the card Played is a Diamond <span class="t13ne-redcard">&diams;</span> then any Awe, Craft, Orthodoc, Quiet, Virtue and Zeal Proficiencies that are applicable to the Test will add +5 each, any Hearts <span class="t13ne-redcard">&hearts;</span> Facet Proficiencies (Enigma, Heresy, Jeer, Liberty, Nature or Phoenix) would add +2, anything else +1. Note to help with speeding up Card Draw Tests, all Proficiencies should have their Suit marked on paper Character Sheets (or Proficiency lists should be grouped by Suit)</li><li>Chi can be spent to add a +1. Stress can be Gained (note not spent) to the Die (Annex or Facet) to add +1. Strains can be Gained by the Die to add a +2. A Shock may be Gained to add +5. All Gained Stress, Strains and Shock will apply after this Test is completed until Relieved normally. Characters may not Overstress their Die, Fully Strain it or Shock themselves more than once.</li><li>To Pass the Test you need to beat the Difficulty of the Test, the total Pips can also be graded, with the Character with the highest Pips being granted an additional Success Level. Yarn-Tellers may add additional Success Levels for second and even third place if they like, noting that would add three Success Levels to the highest scoring Character. Additionally Failure Levels may be added to each Character below any arbitary placing below first. This can mean the Character in second placing might have 2 Success Levels and a Failure Level complicating their "win".</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Complicating the Card Draw Test</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes it can be too simple to look at the results of a Card Draw Test as simply a numbers game. The cards the Characters have chosen to play can have nuance beyond the numerical values of Pips and their Suit. Take for example the 2<span class="t13ne-redcard">&diams;</span>, in most Card Draw Tests a two is a pretty terrible result and while you may beat a Difficulty if you can find enough applicable Suited Proficiencies, it is a pretty poor start. However Card Draw Tests are not Ordeals, and these cards can have additional effects. That 2<span class="t13ne-redcard">&diams;</span> is also The Wraith Yarn-Card, a Distract Wound, a Foe Wyrd Tarot card, a Worries Distress card, a Flashback Trauma, and all sorts of Ordeal effects. And some or all of these effects are available to certain Characters.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Yarn-Teller could use that card to create a Ghost Story, that is at least a Vex Jumpscare Obstacle (with an associated Psych Attack), or a Spiritual Crisis Hurdle, or a Change of Heart Turn that would affect everyone. A Hero could use the Foe card to make everyone Foes, all alliances are abandonned as they make it every Character for themselves (effectively playing it on the whole group at once), this could have a profound effect upon a situation, and may effectively hand eveyone else a Failure Level. A Grunt or Extra is more limited, but can still find interesting uses for the card within the Ordeal narration options, where we find the Suggested Action "Intimidate" or "Entrancing" either of which  used appropriately will add at least one additional Success Level, as could the suggested Test (Attitude / Art  / Charm / Cool / Spirit), with some appropriate narration, depending upon the situation. Any Character can resort to using their card as a Fumble, Critical, Failure, Success, Wound, Distress or even Trauma card that could be applied to everyone (including themselves, it should be noted for those fans of Pyrrhyic Victories) however such uses are subject to Yarn-Teller approval, based on the situation. For example during a foot race to lunch that 2<span class="t13ne-redcard">&diams;</span> may become an Embarrassing Fumble for eveyone, but a Haunted Failure or an Artistic Success Level seems unlikely (without some quick-witted persuasion of the current Yarn-Teller).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So the cards can add complications to the narration of the Test basically, but also can alter the number of Success and Failure Levels that a Character has. So we can create more interesting situations where the person who rolled Highest may not have the most Success Levels, and so are not actually the one who won. Additional Failure Levels can also complicate the situation for the person who rolled Highest, they may have to abandon Success Levels to avoid issues from Failure Levels, to say nothing of Characters potentially ending the Test with Wounds, Distress or Traumas that they may have to live with.</p>
<!-- /wp:paragraph -->

'),
		array('RulePage'=>'Test (Dice)', 'Description'=>'<!-- wp:paragraph -->
<p>In T13 if you want to rapidly Test something, but want some manner or degree of measuring how successfully they have passed (or failed) the Test, then a Dice Roll is the way to go.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Dice Rolls can be made for any Boon, in fact many Boons have multiple dice available to them, and you can choose any dice from any smaller Boon as well. To accelerate play many games set a table rule that you must select the die used for any specific roll, to alter it you may have to pay to alter the Annex or Facet to change the roll, other games may allow you to pick which die to use every time you roll. Referees will usually allow you to change die under exceptional and narrative circumstances. Yarn-Tellers may insist on a change of Dice if a Character travels to a new universe.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Refs can ask for all sorts of different things as a Test, but what they are actually after is usually a Facet Test. Facet tests are based on Testing a single Facet, although often the Player decides the Facet they use to try and pass the Test the Referee should know the Test involved to know which Facet is Trump and which Facets are Misfits. Trump Facets receive a +5 Score bonus when you Test the same Facet, and a Success Level, Misfit Facets suffer from Failure Levels that may colour the nature of the Success.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Generally though you don’t just make Facet Tests in T13, Characters have more powerful abilities than just their native attributes, they have Skills, Talents and even Powers to help them accomplish their goals. But how do you decide if an Annex or Descendant can be used to make a Test?  </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>It is literally named that</strong> — You’d be surprised how often the Yarn-Teller might say, "Okay, everyone make a Spot Hidden test," or perhaps say "Listen Tests, everyone." well those are both probably Key (or maybe Quiet) Facet Tests, but if one Character has an Annex called "Superior Senses" then it makes sense to roll that for both.</li><li><strong>Channelling Facet</strong> — If your Annex has the same Channelling Facet as the Facet being Tested then you should normally be able to use it, unless there is some reason the Ref disagrees. Perhaps when the engine of you Space Fighter fails, the Ref calls for a "Spacefighter Mechanic roll" with a Craft Trump to assist in repairs, while you may have a Craft Channelling Facet on your "Origami" Annex, it’s unlikely that a tiny paper crane is going to be much use, then again if the Space Fighter is an Origami Kite fighter made from folding nanotechnology, then maybe it would be perfect. </li><li><strong>Root Facet</strong> — If asked to perform a Test to decide how much the Character knows about the King’s Guard (which is an Orthodox Trump), it is unlikely that their "Scientific Method" Annex is going to be helpful at all, even though it is made from an Orthodox Root. If the Player insisted on using it, then the Referee would be justified in adding up to 3 Failure Levels automatically to this Test.</li><li><strong>It may be useful</strong>  — Just like individual Facets can sometimes be used that aren’t the Trump Facet, an Annex with only a peripheral association can be used (but may incur Failure Levels). "Military Training" can be useful in many situations that aren’t Trial or Orthodox Trump Facet Tests, but sometimes that training will work against you a little, or a lot.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>What Dice To Roll</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>For free a Character can Roll the following Dice:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Boon Dice (Facet or Annex) + Proficiency Dice + Descendant Dice (if you have an applicable Descendant Annex). You note what each Pool rolls (its Score) and what the Total Score is.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Simple right? We better talk at least a little about Proficiencies and how they work. In fact, it is so important that I think we better have a header.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Proficiency Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Character in T13 makes a Dice Roll they also must look at how many Proficiencies you have that are applicable to the task being attempting. If a Proficiency is particularly applicable it may count double for this Test. So if you have a Proficiency in Repairing Swords and you are asked to repair a sword then you effectively have 2 Proficiencies.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="t13ne-tablewrap"><table class="wp-block-table t13ne-table"><thead><tr><td>Number of Proficiencies</td><td>Result / Proficiency Dice</td></tr></thead><tbody><tr><td>0</td><td>Rolled score is Halved</td></tr><tr><td>1</td><td>No modifiers or special rules</td></tr><tr><td>2</td><td>+1d6 Prof Dice</td></tr><tr><td>3</td><td>+2d6 Prof Dice</td></tr><tr><td>4</td><td>+3d6 Prof Dice</td></tr></tbody></table></div>
<!-- /wp:html -->

<!-- wp:heading {"level":3} -->
<h3>Proficiency Crisis</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If your Proficiency Dice roll maximum or minimum (all 6s or all 1s normally) then you are experiencing a Proficiency Crisis. A Proficiency Crisis has a number of effects, which vary depending on whether the roll has passed or not.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="t13ne-tablewrap"><table class="wp-block-table t13ne-table"><thead><tr><td>Roll</td><td>Crisis</td><td>Result</td></tr></thead><tbody><tr><td>Success</td><td>1s (Snake Eyes)</td><td>Automatically Borderline/Stalemate</td></tr><tr><td>Success</td><td>6s (Boxcars)</td><td>Reversal of Success</td></tr><tr><td>Failure</td><td>1s (Snake Eyes)</td><td>Reversal of Success</td></tr><tr><td>Failure</td><td>6s (Boxcars)</td><td>Automatic Borderline/Stalemate</td></tr></tbody></table></div>
<!-- /wp:html -->

<!-- wp:list -->
<ul><li><strong>Automatic Stalemate</strong> — Regardless of the roll involved the action was not successful, or a failure, a Crisis has occurred and the action remains unresolved.</li><li><strong>Reversal of Success</strong> — Whatever the result of the roll as well as the rolled result you will also experience the opposite level of failure. So if you roll Boxcars on a Superior Success you’ll also experience a Serious failure.</li><li>When a Crisis occurs each player may elect to keep one Wyrd Tarot or Yarn card from their hand or in play (note that Ordeal Pools are not affected). The rest of the Wyrd Tarot Cards (including the deck, the discard pile and any cards in play) are gathered and shuffled. Then all hands are re-dealt once more (to full).</li><li>A Proficiency Crisis automatically creates a new ‘Save’ Chronolith.</li><li>A Proficiency Crisis automatically lets a Character combine the Proficiencies and Annexes being rolled into a new Skill, Talent or Power, assuming they have the free slots. A Character with no free Annex slots may opt to create instead a new Descendant, but the Descendant must be non-physical (such as an idea) and must be purchased (at half price though, which is nice), although it is created as though it is a new Annex (so all Facet Boons, Values, etc. are treated as the Character’s Facet Boons).</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Descendant Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>You may have noticed that in addition to the Boon and Proficiency Dice you are also allowed to add Descendant Dice. This Die comes from an applicable Annex on one of your Descendants. Perhaps for example you are making a Perception based Key check and own a pair of binoculars, it would be totally appropriate to add the Binoculars die to the roll. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Deciding whether a Descendant is appropriate should never be too difficult, just use the same rules as deciding if an Annex can be used, but the Ref will, as ever, act as final arbitrator on what is allowed in a roll. For example, if a Character has a Reputation (a Lore Descendant) for being a great swordsman, then it would make sense to add that during a Fencing match.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Difficulty</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Yarn-Teller or Referee sets the Difficulty of the Test, and the way they do it is no mystery. Everything in T13 can easily be assigned a Difficulty  by looking it up on the Sway table. However, there are several different ways that the Ref can arrange Difficulties and calculate pass and failure.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Difficulties are looked up on the Sway Table, but you might notice that there are actually 4 columns that claim they can be Difficulty, and the numbers are wildly different between them. This is because in T13 the setting can change how effective a Facet (or anything else) is at doing something in the universe. For example, creating a Flesh Wound can have wildly different Difficulties depending upon the how you are creating it.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Stakes</strong> — The Stakes of a situation can wildly affect how Difficult it is to create a Flesh Wound (see the Rules on Stakes), with a Low Stakes Flesh Wound starting at 15 Pips/Chi, but a High-Stakes Flesh Wound is only 5 Pips/Chi. For this reason it is fairly common to ignore Stakes when using the Sway Table.</li>
<li><strong>Potency</strong> — How potent the Facet (or character or the technology used) is then effects how those Pips/Chi are converted into actual Difficulty. Low Stakes Flesh Wound in a Banal Facet/technology would have a Difficulty of 83, but a the same Low Stakes Flesh Wound with an Intrepid Facet or tech would be a Difficulty of 30, and a Bold technology or Facet would make that Diff 15, under rare circumstances a Monster might be able to create a Low Stakes Flesh Wound with a Diff of 4 or Higher. High Stakes would give Difficulties of 16/10/5/2 for the same Flesh Wound in each circumstance.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Because of this variation it is generally wise to calculate Difficulty for Pips/Chi or Bold and then adjust from there as required, as each other Difficulty can be calculated from that. With Monstrous being Bold Reduced as a Value Reduces to a Boon, Intrepid being twice Bold and Banal being the Value of the Bold as a Boon.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Single Roll</strong> — The crunchy way to go about setting and passing the Difficulty is to add all the pieces up to find a Total Difficulty. You do the same with the Dice that you roll, totalling them together. This determines whether you beat the Difficulty and Succeed, or don’t beat it and fail. You determine additional Success Levels by rolling multiples of the Difficulty, or by rolling specific numbers (see below). Which makes extreme Successes or Failures unlikely. Example: If you wish to create a Flesh Wound (Diff 10) on a Vex Extra (Diff 4) means you need to beat a Difficulty of 14. Want to Flesh wound the whole Omniverse at once? That’s Diff 652 instead. Perhaps you want that Vex Character to remember meeting you some years ago. That would usually be a Minimal Retcon, which would add 12 to the Difficulty. <p>The Ref can add modifiers to this Difficulty, such as trying to do modify the Vex’s memory without anyone else spotting what is going on would add an extra 16 Difficulty.</p> </li><li><strong>Pools</strong> — Pools are a faster, rougher system for calculating levels of success. Each Dice Pool is kept separate, Proficiency Dice, each Annex or Facet Die, and each Descendant Die. The Difficulty of each Dice Pool is equal to the Pips/Chi Cost that the action is attempting. So when affecting a Vex (Pip 2) with a Flesh Wound (Pip 5) the Flesh Wound is the highest Difficulty and sets the difficulty of each Pool at 5. If one die beats the Difficulty then it is a success, each additional die that beats the difficulty adds a Success Level. If all dice are below the Difficulty then a Failure has occurred with each die below the Difficulty creating an additional Failure Level. If one die exactly matches the Difficulty, one passes and one fails then you would have a Stalemate. Kind Referees may allow Pools to be added to try and beat the Difficulty if all rolls are too low.</li><li><strong>Card Draw</strong> — The third way of resolving a simple Test is to use cards (much like during an Ordeal). In this case the Average Draw (or Rolled Score Reduced for Proficiency Dice) is used to draw cards from the deck. Cards can then be played (usually between 1 and 4 depending on the Annex being used) to beat the Difficulty (Calculated from the Reduced Addition Difficulty or as a Score as the Yarn-Teller prefers)</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>I Need To Roll Higher</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Okay, so maybe the Difficulty is higher than you can possibly roll, (perhaps you are trying to effect too many people at once or something) even with all the Proficiencies, and your Power being rolled. You want to be able to add more Dice to the roll and increase that Score, right? Well, you can! Assuming the Ref agrees that you should be able to add in your "Eagle Eyes" Talent as well as your "Animal Senses" Power then why not? All you have to do is pay a little extra cost.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you have already added a Die and would like to add it again, that can be done with Stress. Stress is a lot like Chi, only available to every Character, and small amounts add Score or Pips exactly like Chi can, but it can be spent to Strain Dice, letting them be rolled again and added to their previously rolled Score (see the rules pages on <a href="/stress/">Stress</a> and  <a href="/strains-and-straining-dice/">Strains and Straining Dice</a>). If you do not have enough Stress, or just have too much Chi then you can spend that instead. However the Chi cost is not related to the Stress costs, instead it is based on what sort of roll the Character wishes to make.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="t13ne-tablewrap"><table class="wp-block-table t13ne-table"><thead><tr><td>Add die to pool</td><td>Sway</td><td>Chi</td><td>Yarn</td></tr></thead><tbody><tr><td>Facet</td><td>2</td><td>1</td><td>1</td></tr><tr><td>Skill</td><td>4</td><td>2</td><td>1</td></tr><tr><td>Talent</td><td>10</td><td>5</td><td>2</td></tr><tr><td>Power</td><td>14</td><td>7</td><td>2</td></tr><tr><td>Trophy (skill/talent/power)</td><td>16</td><td>8</td><td>3</td></tr><tr><td>Super-Annex / Monolith (skill/talent/power) / Location</td><td>24</td><td>12</td><td>4</td></tr><tr><td>Real Estate / Pact</td><td>32</td><td>16</td><td>5</td></tr><tr><td>Artefact / Province</td><td>42</td><td>21</td><td>6</td></tr></tbody></table></div>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p><strong>Optional Rule: </strong> If a Character spends Chi to roll additional Dice from the Table above then the Die that is rolled will automatically Gain 1 Strain. This is because Chi is being used to Strain Dice without Stress being spent (see the <a href="/stress/">Stress</a> and  <a href="/strains-and-straining-dice/">Strains</a> rules pages for details)</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hang on a minute though, you might be asking, why would I want to add another die that can’t roll high enough to beat the Difficulty? Well, when you pay to add extra dice you can actually add those dice to any one of the Pools you have already rolled, or create a new Dice Pool, this means you can improve a Score that doesn\'t beat a Difficulty or add a new Pool that does as you prefer.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It should be noted that characters who have many Artefacts and Monoliths within their Province and Real Estates can spend enormous amounts to produce extremely high scores. Beware when storming that Vampire Lord’s Castle atop the mountains beyond the forest. And Refs should note the potentially world shattering experiments possible in a Province Laboratory with an Artefact Particle Accelerator, and Monolithed Computers…</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Result Of The Roll</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The dice roll Score is compared to the Difficulty of the test, or to an opponent’s Score. Or the number of</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Whichever side rolls higher (or rolls higher than the set Diff) has succeeded although by how much depends on how high they roll, or how many dice beat the Difficulty.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If both sides roll the same (or exactly roll the Diff) then they have reached a Borderline/Stalemate, where they have not failed, but haven’t really succeeded either.&nbsp;</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Borderlines can be considered a "Yes, But..." Statement, where the Character succeeds, just barely, but also incurs some penalty (a Failure Level) at the same time. This is generally the preferred choice as it moves on the story, but is not always feasible.</li><li>Stalemates can be though of as a "Nearly There..." , where the Character is stuck, not failing, but not yet Succeeding. This should not be the preferred option unless the situation is already Tense or Dramatic (climbing up a cliff would be a good time to use a Nearly There, or a competition that then moves into the Sudden Death round after).</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>A Proficiency Crisis (caused by rolling maximum or minimum on your proficiency dice) causes you to take both the level of success that you have rolled and the equivalent failure as well, or the failure, you rolled and the equivalent success).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The following table governs levels of success based on how much you defeat the Difficulty, or opponents Score. To find out more on Success and Failure Levels see their RulePage.</p>
<!-- /wp:paragraph -->

<!-- wp:table {"className":"t13ne-table"} -->
<table class="wp-block-table t13ne-table"><thead><tr><td>Roll / Passes</td><td>Result Name</td><td>Result Description</td></tr></thead><tbody><tr><td>&gt; Diff x3 /<br> 3 Passes</td><td>Superior Success</td><td>Better than you wanted (see Extra Success Levels)</td></tr><tr><td>&gt; Diff x2 / <br>2 Passes</td><td>Complete Success</td><td>You succeed as you wanted</td></tr><tr><td>&lt; Diff x2 / <br>1 Pass</td><td>Moderate Success</td><td>You wanted more, but you succeed. <br>Or perhaps you Succeeded but have a Failure Level.</td></tr><tr><td>Diff</td><td>Borderline<br>Stalemate</td><td>Borderline Success, but also take a Failure Level.<br>Neither Success or Failure... yet</td></tr><tr><td>&gt; Diff /2 or <br>1 Failure</td><td>Moderate Failure</td><td>You have failed, but only just, you should be able to try again. <br>Or perhaps you failed, but have a Success Level</td></tr><tr><td>&lt; Diff /2 or <br>2 Failures</td><td>Complete Failure</td><td>You have failed, and ruined any chances of trying again.</td></tr><tr><td>&lt; 0 or <br>3 Failures</td><td>Serious Failure</td><td>You failed, and things got worse (see extra failure levels)</td></tr></tbody></table>
<!-- /wp:table -->

<!-- wp:heading -->
<h2>Criticals and Fumbles</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Criticals are an optional rule that can apply to any roll. They are usually used for rolled combat, although can be used elsewhere. Criticals are something extra powerful that happens when a certain number is rolled. The Numerology method of adding digits larger than 13 can be used to crunch the number down to compare it. For example, rolling a 17 would become an 8. If the Character rolling has a Perfect Harmony of 8 then they have rolled a Critical, if they had a Nemesis Dissonant of 8 then they would have rolled a Fumble. A Fumble is where something has gone wrong with an action, such as losing a Descendant you were trying to use or similar. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Fumbles and Criticals are based on the Facet being rolled, or the Channelling Facet of an Annex, or on specific cards and specific Nimbeds, Umbrals or Tangles. Fumbles are inherent to Gossamer Tangles and Failures. Criticals are inherent to Key’s Sharp Nimbeds as well.</p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h2>Or Ordeals</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes these simple Tests are not enough to make a Story fun. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you want to craft a sword during an adventure, it makes sense to just roll a Test most of the time, but if this sword is meant to end a particular threat — such as killing the Vampire Prince, piercing Ghul-flesh, or exploiting a noticed weakness in a dragon’s scales — then the Yarn-Teller may prefer to use an Ordeal instead. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Ordeals break the Test down into multiple smaller Stages that create a more detailed Narrative. It is worth noting that if you are in an Ordeal, you might still be asked to Roll Tests. Perhaps, during that sword creation Ordeal our Smith-Adventurer’s hammer breaks, the Ref could make our hero repair it, or craft a replacement during the next Stage, or they could just make a roll to buy a replacement hammer. It is common for Purchase Rolls and so called "Summoning" Rolls like this to be rolled even during Ordeals, although they can be replaced with Ordeal Obstacles and the like.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>To find out more about Ordeals and how they work, read the <a href="/ordeals/">Ordeals Rules Page</a>.</p>
<!-- /wp:paragraph -->'),
		array('RulePage'=>'Stakes','Description'=>'
<!-- wp:paragraph -->
<p>In T13 we have a system for deciding how dangerous a situation is. This is known as The Stakes. Ordeals are particularly based heavily on the Stakes, you can’t really decide when the Ordeal ends without knowing the Stakes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Ordeals come in differing levels of risk. In a High Stakes Ordeal, like Combat, failure and death is always an option, but the same Combatants meeting for a Fencing Competition are unlikely to kill each other in Medium Stakes, and when training before the competition both competitors would be much more controlled, and the risk of injury and Stake would be very low.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="stakes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>While these Stakes are Omniversal, some stories and games may add some specific Stakes. For example, Seelie Stakes, and Unseelie Stakes are a bit of a standard for games with F&aelig;ry and Eelafin Characters, and would be detailed but are not Standard otherwise. Referees and Yarn-Tellers can create custom Stakes as well.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Creating Custom Stakes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There are several things to think about before you make a custom Stake:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"className":"t13ne-stakes"} -->
<ul class="t13ne-stakes"><li>How deadly are Ordeal cards? — They can be a multiple of the Base Cost from ×1 to ×3, have a +/- 1 to the Wound Level of the Ordeal card, or have a standard or Random Pip modifier. So you might make each card have +5 Pips but require ×3 Base Value to Summon and make the Limit -1 Class. This would allow large attacks to be deadly, but smaller attacks would tend to fall around the middle, and would effectively remove Distracts.</li><li>How long is an Ordeal? — Is the Stage a specific number of Phases long, and if so how many from 1 to 26? Does every Character get the same number of Phases per Stage? Is there a limit on the number of Phases per Round? Or a limit on the total number of Phases ?</li><li>How does the Stake effect the Ordeal? — How does an Ordeal of this Stake end? Is there a limited number of Rounds, or Phases and then is failure automatic? Is there an Automatic failure if any Stage is failed? Or do Failure Levels have to be accumulated before the whole Ordeal is failed?</li><li>How big is the Ordeal Wild Pool? — Larger Wild Pools create quicker, more destructive rounds. Smaller Wild Pools lead to less dangerous, longer Ordeals.</li><li>How Many Soak Levels are Characters allowed? — There is a balance to be made here though. More dangerous Ordeal cards can be balanced by more Soak Levels, which reduces the full damage somewhat (spreading it to Armour Descendants and the like).</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Your custom Stake will be a careful blend of these factors to create something new, and you can create interesting new Ordeal types for your Custom Stakes too.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Example Custom Stake: Honour</h3>
<!-- /wp:heading -->

<!-- wp:list {"className":"t13ne-stakes"} -->
<ul class="t13ne-stakes"><li>During each Round you begin with a Round Wild Pool (that assists in making Tricks) of 2 cards.</li><li>Wounds have their Base Pip Costs Doubled (×2), their Limit card is increased by 1 and each has +2 Pips. So a Distract Wound requires 2 or higher. A Flesh Wound can be played with two 3s. A Mortal Wound has a cost of 32 Pips which could be reached with three 10s.</li><li>Virtue Score Phases to the Stage. Orthodox Draw Round-Limit to the Ordeal or automatic failure. However you may quit the Ordeal at any time to a Stalemate situation.</li><li>Maximum Soak Levels: 1</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>This Honour Stake might be useful in a chivalric or samurai based story, perhaps anything courtly or romantic can also find uses for it under the right circumstances. Within the Honour Stakes insults and insulting behaviour are easier (as noted by the lowered card Limit and the +2 Pips), and so are more cutting, and the opponent gets less Soak than you might otherwise expect, but while dangerous attacks are possible, they are more or less equivalent to Medium Stakes (due to the ×2) in difficulty. Additionally, the Honour Stakes limit how long you can maintain an Honour Ordeal, but you can always quit and force a Stalemate if you think you won’t win out, or haven’t failed a Stage yet. It is quite a fun Ordeal to throw a couple of Chivalrous Characters into whenever they meet, especially fun if they are on opposed sides.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Examples: F&aelig;ry Stakes</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The F&aelig;ry Stakes of Seelie and Unseelie are similar, in that only particular Games and Characters can access them, but the actual Ordeals can vary greatly. In general, you can use either when a Character meets a F&aelig;ry, depending upon the F&aelig;ry met, and the time of year and day. You can also run the two simultaneously, with the F&aelig;ry Stakes blending together, as often it is not obvious which they are when you first meet a F&aelig;ry. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Seelie Stakes:</strong> During the day, and in the summer the Faeries are at their most benign and friendly. They are jokers, and pranksters, but there is little malicious to their activities. Engaging with them can however be dangerous, as they forget how easily broken Mortals are, but usually quickly remember before things get too deadly.  Seelie Stakes can indicate that a F&aelig;ry is meant to be helping the Character achieve some Doomed goal set by Wyrd, but they rarely are upfront about such things. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Round Wild Pool: 4 Cards</li><li>Wounds (Limit is -1 Level)(Distract: 5-7, Flesh: 8-9, Maim: 10-J, Cripple: Q-K, Mortal: A, etc)</li><li>Wound Cost (x3) e.g. Distract 6, Flesh 15, Maim 24, Cripple 30, Mortal 42, Carnage 63 Pips.</li><li>Pips per card +1d6 (e.g. a 2 could add 3-8 Pips a Joker adds 16-21 Pips).</li><li>Liberty Score Phases per Stage. Wyrd Boon Phases Round-Limit or automatic failure. </li><li>Maximum Soak Levels: 2</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><strong>Unseelie Stakes:</strong> During night, in the dead of winter, the Fae are fickle and devilish beasts, as quick to kill as to prank, and even their pranks have a certain deadly malignancy that make them dangerous to even glance at. Spiteful and mean creatures, the Unseelie Fae are powerfully murderous often without provocation. Unseelie stakes are often a sign that you are going against your own destiny, as the Unseelie Faeries are often tasked with rearranging destinies to fit Wyrd’s plans (although only when the Loom can take them being removed from it).</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Round Wild Pool: 3 Cards</li><li>Wound Limits +1 (Flesh 2-4, etc)</li><li>Wound Costs (x2) e.g. Distract 4+, Flesh 10+, Maim 16+, Cripple 20+, Mortal 28+, Carnage 42+, Carnage+ 52</li><li>Pips per card +1d6.</li><li>Wyrd Draw Phases per Stage. Liberty Score Phases Round-Limit or automatic failure.</li><li>Maximum Soak Levels: 3</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Blended Stakes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is important to remember that Stakes can be blended, so while you are jogging in the park at Low Stakes, a mugging would raise the Stakes to Medium (or maybe even High if there is a knife or a gun involved), and when the police start taking pot-shots at the Mugger as he runs away, the Stakes raise to High (or even Extreme if those guys are SWAT or Cyborg-Cops that have mistaken you for an accomplice, not a victim), all the while the original jog in the park continues at Low Stakes... If it turns out that one of the Cops is actually your Love Interest, the Soul-Stakes of that relationship may come into play while the two Characters interact, and the moment a time-traveller appears telling the police that they have the wrong guy then Paradoxical Stakes are invoked.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>While the Higher Stake sections effect Wound Summoning Costs and so on, they do not affect the original Jog Stakes (or your ability to complete the Jog, unless you are injured during the events). Conversely the lack of time constraint on the Jog in no way effects the time-limit the Police impose on you to surrender. So while you may have to wait, and even have your day in court, one day you can complete that fateful jog.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Blended Stake Obstacles</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Stakes can be further complicated by Obstacles. The Yarn-Teller may decide that it makes no sense for a certain Obstacle to be Low, or even Medium Stakes, and so rules that dangerous Traps must be treated as High or even Extreme Stakes. A Shopping Obstacle, on the other hand, while it might bankrupt you (creating an Lacking Hitch), is hardly likely to kill you, and may be made automatically Medium or Low Stakes (depending on what is being shopped for and the state of the Character’s finances.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In general, it is advised that Obstacles match the common Stakes, and Ordeals are constructed accordingly, with the Stakes ramping up through Trap-ridden sections, and shopping in town is usually a Low risk event.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>When to Change Stakes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Moving between Stakes can require some practice. In general, if during an Ordeal something changes dramatically then the Stakes are probably shifting. The most obvious rules are this though.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"className":"t13ne-stakes"} -->
<ul class="t13ne-stakes"><li>If everyone is talking and standing around, it is probably Low Stakes</li><li>If everyone is rushing to get something done, then it is probably Medium Stakes</li><li>If someone is waving a sword, or a gun, around it is already High Stakes</li><li>If someone is firing a machinegun, cannon or fireball, it’s already Extreme Stakes</li><li>If someone says they’d sell their soul, or love someone else, bam — that’s Soul Stakes</li><li>The moment anyone is displaced in time, interacting with themselves in another dimension, or someone can directly see the back of their own head somehow, it’s paradoxical Stakes and everyone should be very careful...</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Early in a Story (the Frame Act) you should keep the Stakes generally Low or perhaps Medium, although it will also be guided by the Suspense Level of the Story. The Stakes should rise during each Warp of the Loom, with the Suspense, until the Stakes are Extreme, Soul or Paradoxical in the Zenith. However, this can get complicated with multiple interacting Storylines, and also feel like you are only ever raising the Stakes of the situation. Feel free to reduce the Stakes at least a Level whenever the Character’s take a Weft Loom Scene, as they rest, recover and recuperate.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Increasing the stakes without Increasing the Stakes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes during a Story you need to raise the stakes of the game for a Character without actually changing the actual Stakes at all. This is especially common when we need to ratchet up the Suspense in a Story during the Late Loom, but we don’t want to jump up to Extreme or Soul Stakes just yet. There are, of course, plenty of ways that you can increase the apparent Stakes and Suspense, without actually increasing the mechanical Stakes at all. These include:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"className":"t13ne-stakes"} -->
<ul class="t13ne-stakes"><li><strong>Threaten something they Love —</strong> Okay, it may be a bit obvious, but you can capture an Ally or Love Interest and threaten to kill them. This has no effects on the mechanical Stakes, but the Character will feel the Stakes ratchet up.</li><li><strong>Add, or shorten, a Time-Limit —</strong> The Medium Stakes Ordeal is a timed Ordeal usually. You have to get something done in a certain time. Well, imagine finding out what you thought was a six week project, is actually only a four week project, in the middle of week 3. That may cause tensions to rise.</li><li><strong>Ramping up the Damage — </strong>It is possible to modify the Pips of each card as part of the Stakes. You could easily add a +3 Pips modifier and make everything a little more deadly for a while.</li><li><strong>Bake in Success or Failure </strong> <strong>—</strong> Stakes can have automatic Success or Failure Levels guaranteed, no matter what the PCs (or NPCs) do. Nothing reduces the threat of the Stakes as easily as having a guaranteed Success Level or 5, and the inverse is also true. </li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Stakes and Blinds</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In some Games when a Character enters an Ordeal Round, or makes a roll, they are required to bet some resource or potential Wounds on the outcome. Often this bet is set by the Yarn-Teller or Referee as a Blind Bet. Blinds are usually related to the activity being attempted and the larger Stakes surrounding the circumstance. Basically, the Yarn-Teller might set the Blind as 1 point of Sway (usually specified by Facet in these sorts of games) for a Low Stakes event, but could set it at a Carnage Wound for an Extreme Stakes combat, with little to no chance of survival. Each Player must match the Blind (although they can raise the bet, betting more Sway or adding Wounds if they think they can do better). If a Player raises the bet then all other Character Players (NPCs as well as PCs) must also either match the bet or fold. Folding means they will not enter the Round or Roll. Matching the bet means that they will pay the Sway or take the Wound. Each Success Level that a Player generates on the Roll, or during card play, allows them to offset some part of the bet (an amount of Sway, or a Level of a Wound). The Ultimate bet that a Player can make is to go "All-In", this risks the whole Character (not just an Alt, or Wounds), and failure will mean they are lost.</p>
<!-- /wp:paragraph -->

'),
		array('RulePage'=>'Success and Failure Levels', 'Description'=> '<!-- wp:paragraph -->
<p>In T13 any Test or Ordeal Result can be modified by Success and Failure Levels. These can mitigate the worst disasters, or act as unintended consequences on what would otherwise be a Complete Success.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>These Success and Failure Levels may come from the results of the Test itself, the Facets being used, Tone, Cards in Play, Annexes, Unchanging I-Ching, Descendant or Character Edges, Player choice ("If he has a gun on me, can I add a Failure Level on my bluff, just from nerves?"), Yarn-Teller choice ("He fires the gun at you, misses but hits the gas cannister, it explodes... that’s a lot of damage... I’ll add a Failure Level call it Plot Armour... Two Crippling Wounds."), Referee Choice ("That explosion is technically an Overload, and no one is wearing ear defenders or similar soak layers, so you can all add a Failure Level on your Soak, too. The attack will target any sensory Annexes or Personality, or creating a Deaf Loss of Sense Hitch.") and a number of other in-game effects. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can gain Success and Failure Levels during Tests (including Value and Rolled Tests) and Ordeals in the following ways:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Doubles</strong>: If you roll a Die or Pool and the units and the tens match digit (e.g. 11,22,33, or 133), then that can indicate an extra Success Level or Failure Level, depending on if the roll would be a pass or fail.</li><li><strong>Multiples</strong>: If you roll a multiple of the Difficulty then you gain extra Success Levels, if you roll less than half, third, quarter, fifth, etc you gain Failure Levels. e.g.  So if the Difficulty is only 2 and you roll 14 you would gain a Success Level for every 2 Score rolled over 4. That’s +5 Success Levels! If the Difficulty is 60 and you only roll 10 then that is less than a half (30), a third (20), a quarter (15), a fifth (12) and equals a sixth (10) of the Difficulty so you add 4 Failure Levels.</li><li><strong>Numerology:</strong> Optional Rule: If the digits are added together and then collapsed in the method of Geometries, that creates an additional number from 1-13. e.g. rolling 24 gives us 2+4= a 6. If this number matches the Character’s Geometry then they can gain an additional Success Level regardless of pass or fail. However if the number matches their Nemesis number then that will add a Failure Level.</li><li><strong>Trump and Misfit Facets:</strong> Trump Facets and Suits can affect how well Characters can do, adding Success Levels. Of course, using the wrong Facet can add between 1 and 3 Failure Levels. See the rules below.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Trump Facets and Misfit Facets</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yarn-Tellers and Referees can ask for all sorts of different things as a Test, but what they are actually after is usually a Facet Test. Normally, the Yarn-Teller won’t ask for the specific Facet they wish to Test, instead couching it in terms of what you are trying to achieve, something within the tale, not of the rules. <br/>For example, if you state you are going to try hiding and ambushing the bad guy, the Yarn-Teller could ask you to "Roll to hide". <br/>Hiding is usually an Enigma Test, so using Enigma not only makes sense, but should have a +5 to the Roll / Score, +2 Pips when using a Diamond (<span class="t13ne-redcard">&hearts;</span>) suited card during an Ordeal, and add a Success Level as well. That’s potentially 3 times using the correct Facet and card suit adds a bonus. This is because you can actually try and "hide" in a number of different ways, not just using Enigma. The Referee or Yarn-Teller should allow good (or bad) narration, use of the situation, surroundings, and Character abilities to allow other Facets to be used. Although, this is easier to do the more closely allied to the Trump Facet the chosen Facet is.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Misfit Facets add Failure Levels to the result of a Test or Ordeal by using the wrong Facet. A Facet can be wrong in 3 ways, that each add one Failure Level.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ol><li><strong>Yin / Yang</strong> — If the Trump Facet is Yang then all Yin Facets are Misfit Facets and add 1 Failure Level, or vice versa. This may be ignored by kind Yarn-Tellers, especially if they share a Suit with the Trump.</li><li><strong>Red / Black</strong> — If the Trump Facet is a Red Suit then all Black Suited Facets are Misfit Facets and add 1 Failure Level.</li><li><strong>Anti-Facet</strong> — Every Facet has its own Anti-Facet that it is considered the opposite of. This Facet Automatically adds 3 Failure Levels if you try to use it.</ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Players might look at their Skills, or Talents and realise that they have a "Disguise" Skill, that Channels through Heresy, it would make sense then for them to "Disguise" themselves, rather than just "Hiding", but if someone else has a "Hiding" Skill we would expect them to get all the Trump bonuses, where as the Disguise would not. Annexes normally use their Channelling Facet for Scores they generate. So Players should state their Score and Facet, and might want to note their Root Facet for the Annex too incase it is a better choice (although then again it can make things worse if it is opposed too so...).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hiding is an Enigma Facet action, Enigma is a Yin <span class="t13ne-redcard">&hearts;</span> Facet. This means that using any Heart is easily possible, but does not gain a Facet Trump bonus, they do gain a +2 Pip bonus during an Ordeal though. For example:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Enigma - "I hide behind a tree. Enigma Score 12." Which the Yarn-Teller would recognise as a 17 because of the +5.</li><li>Heresy - "I will disguise myself as an old beggar and await them on the roadside. Heresy Score 22." — which could add a Disbelief Failure Level.</li><li>Jeer - "I will cloak us all in an illusion. Jeer Score 34" — which will stand.</li><li>Liberty - "I rely on Luck to not be noticed. Liberty Score 26" — note that Liberty is Yang which should add an Unlucky Failure Level, you can’t rely on luck all the time.</li><li>Nature - "I shall use my natural camouflage chromatophores and the forest to blend in. Nature Score 12" </li><li>Phoenix - "I will <em><strong>help</strong></em> hide the others close to the road, and then retreat further back in the woods. Phoenix Score 14" Phoenix is Yang and adds a Burnt Failure Level, in this case getting scratched by thorns or stung as they hide.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Any Diamonds (<span class="t13ne-redcard">&diams;</span>) are the next most likely to work. They don’t get any Trump bonuses, but it is normal for the opposite tao (Yin/Yang) to incur a Failure Level as a penalty (so for Enigma as Yin, all Yang Facets take an Failure Level). </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Awe - "I was a hunter in a past-life, that should let me hide pretty well. Awe Score 18." The Yarn-Teller should note a Yang imposed Failure Level on the Result, that might result in them Flashing back, perhaps even forgetting their modern self for a while.</li><li>Craft - "I can construct a hiding place, from some leaves and branches. Craft Score 18" The Yarn-Teller could respond,  "It’ll mean a bit of extra work, I’ll have to see if you can do it in time," because of the Extra Work Failure Level.</li><li>Orthodox - "I’ve got training in camouflage techniques under military training. Orthodox Score 18."</li><li>Quiet -"I just sit down behind a wall, and keep perfectly still. Quiet Score... 8"</li><li>Virtue - "I’ll just have to hope I’m not spotted! Virtue Score 20"</li><li>Zeal - "I’m not good at hiding, but if I run around the corner, I should be out of sight. Zeal Score 18" The Referee notes that a Failure Level could result in them running too far away to be useful.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Then we have the Black cards, they share little in common with Enigma, generally, and so incur a penalty in the form of a single Failure Level. Additionally, Yang Facets will incur a second Failure Level.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Burden - "I can create a crowd to hide in by throwing some cash in the air. Burden Score 23" The Yarn-Teller or Refere will note one Failure Level, with a Financial Loss being the most likely result.</li><li>Dominion -"I can try and blend with the crowd, and use Psychology to not attract attention. Dominion Score 14" They should note 2 Failure Levels, with some sort of Scandal as a possibility, perhaps they kiss someone to avoid notice, only to attract the wrong attention.</li><li>Fury - "Sure, I’ll hide, I’ll dive into the ditch and hide under the water. Fury Score 14" This is definitely a stretch... and the Yarn-Teller and Referee note two Failure Levels with Stress being the most likely Failure.</li><li>Gossamer - "I’ll just grab a hold of some branches and hold them in front of me. Gossamer Score 16." That is 2 Failure Levels with Fumbles being preferred, maybe they will drop their weapons when the Ambush actually happens.</li><li>Inertia - "I’ll just lie here, and cover myself over with leaves and dirt so they can’t see me. Inertia Score 14"  Note a single Failure Level, which may slow them down when getting out of the leaves. </li><li>Key - "I’ll stand on the road and watch for them. It’s just me so it shouldn’t ruin the Ambush completely, and I’ll be able to time the attack perfectly. Key Score 19" The Yarn-Teller and Referee should note the 3 Failure Levels this will incur, which could be enough of a Catch to ruin the whole ambush.</li><li>Miasma - "I can build a fire with wet leaves, that will create a lot of smoke we can hide in. Miasma Score 14" The Yarn-Teller and Referee should both note the Failure level which means the Foul Conditions might make everyone choke and cough a little.</li><li>Rook - "I’ll find the thickest wall to stand behind. Rook Score 18." Which adds a Failure Level, which means they should be prompted by the Yarn-Teller or Referee to explain how they are self-defeating, or have some impact imposed by the Yarn-Teller.</li><li>Sin - "Easy, I’ll kill the nearby peasants and stack the bodies up to hide behind. Sin Score 34" That’s 2 Failure Levels that emphasise the Weaknesses of the PC (in this case his Murder-hobo lifestyle).</li><li>Trial - "I was school hide and seek champion, and a great warrior. Trial Score 22" That’s 2 Failure Levels as Forfeits, meaning they may end up winning, but getting immediately arrested, or the Ref may give the bad guy more armour as a balancer.</li><li>Wyrd - "I’ll cast some magic to hide us all in the Astral realm. Wyrd Score 18" That’s a single Failure Level noted, which has a Just theme, perhaps an Astral Beast will ambush them while they lie in wait...</li><li>Yonder - "I will keep heading along the road and that should draw them into the Ambush, right? Yonder Score 21." The Referee notes the Failure Level will be a Trip, will they stumble, or simply go too far away to be useful in the Ambush?</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":2} -->
<h2>Success Level Effects</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Success Levels can have a variety of different effects, depending on the Narrative, the action attempted, and how many Success Levels are being spent on an Effect. Success Levels vary in type by Facet, which creates a Facet Flavoured Success as follows: </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Success"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Beyond what a Facet Success Level may accomplish there are also Generic Success Levels that you may receive from the roll or cards. Generic Success Levels behave as below.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<aside class="t13ne-example"><h3>Example</h3><p>Darren is a Demon-hunting Mercari, who is tracking a Skunkape.</p><p>He rolls on his "Tracking" Talent, and scores a Moderate success with an extra 6 success levels (from Tone, cards and Talent Nimbeds). This grants him a Superior success, he has tracked the Skunkape, but he also has an additional 5 Success level effects.</p><p>Darren decides to take the Yarn card on himself option, but he isn’t a Yarn-Teller himself, so the current Yarn-Teller or Referee draws and plays the 10 of hearts (The Jester), they could play it as a Revelation, perhaps revealing the Skunkape’s hair, scat, DNA, or Home, or as a Gain of a Powerful Ally, but instead it is decided to play the Jester as a Sweeping effect.</p><p>Darren becomes the "Wandering Fool" tracking the cryptid through the bayous and swamps; along the way he finds an amazing Cajun restaurant next to a jetty. The owner not only feeds him well, but also tells him of his own encounter with Skunkape, right behind the restaurant, late the previous evening.</p></aside>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2>Extra Failure Levels</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Failure Levels act to mitigate your successes, complicate stalemates, and turn your failures into disasters. They can represent unforeseen consequences, complications or problems that occur to the Character, even if they pass a Test the complications may make it seem not worth it. Failure Levels work in a similar manner to Success Levels, but are usually decided by the Author, Yarn-Teller, or Referee, not the Player.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Failure levels are often typed by Facet. Each Facet has a particular style of Failure that it prefers to use. Where possible the Yarn-Teller or Referee should try to make the failure fit the Failure type of the Facet being used. Although with some Annexes you may find that the Failure type should reflect the Root, Tangle, Umbrals, or even a Nimbed of the Annex.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Failure"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Like Successes Failure Levels can also be Generic, and Faceted Failures can also combine with Generic Failures.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<aside class="t13ne-example"><h3>Example</h3><p>Darren the Demon-hunter reaches the Skunkape’s nest. The Demonic hominid is nowhere to be seen, so Darren decides to hide himself and wait in ambush.</p><p>He rolls to hide (an Enigma test), but doesn’t do very well, he passes the Pool difficulty, but also fails the Least Difficulty on two dice.</p><p>While he manages to hide himself he also picks up 2 Failure Levels. The Referee and Yarn-Teller decide that Darren should have Questions, the first question is why has he got so itchy all of a sudden? And then the itching becomes a burning as he realises he has hidden himself on an ant nest. The Yarn-Teller pulls an Ordeal card and applies it, a 7 of Spades means an Unsoakable Flesh Wound.</p></aside>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2>Generic Success and Failure Levels</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Success and Failure Levels can also be Generic, although they come in a variety of types, classes and categories.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="successAndFailureLevels" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":2} -->
<h2>Proficiency Crisis and Success Level effects</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is normal when having a Proficiency Crisis to end up with both Success and Failure Level Effects, whenever possible Yarn-Tellers and Referee should try to not have the two effects cancel each other.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If a Superior Success grants the character Sway, then they should not lose Sway from the Failure levels they also incur. Instead, apply the Loss to an Ally, or as a Gain to an enemy. If Facet Sway rules are being used then loses can be in a different Facet Sway to gains instead, a loss of Breaths, for example may gain you some Surges.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Card play does not quite work this way, since the cards will probably not directly oppose each other. You may draw and play an Ordeal card and an opponent may also draw and play at the same time, they may interfere, but it is unlikely they will directly cancel, and will probably create a more interesting narrative if they do interfere somehow.</p>
<!-- /wp:paragraph -->


'),

array('RulePage'=>'Wounds','Description'=>'<!-- wp:paragraph -->
<p>Cards played in Attack are said to summon Wounds, and apply them to the target. These Cards as Wounds are then Soaked by Armour, Annexes and the Rook Facet, after this the cards on Descendants and Characters represent damage and injuries to the Character or Descendants.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Wounds in T13 are based on the cards (and the Stakes see the <a href="/stakes/">Stakes rules page</a> for details), although Wounds can be summoned, applied and so on outside of Ordeals also. The different Levels of Wound have radically different effects on the Character (or Descendant) that’s Wounded.  </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="woundtable" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Summoning Wounds</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we normally use Ordeal Cards to Summon Wounds. Although Wounds can also be summoned, stabilised and healed by Scores and Chi, when appropriate. However, these methods all mimic the Ordeal Cards with Chi replacing Pips, or being used to calculate required Scores in Sway.  See the <a href="/sway/">Sway Table Rules for details.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The cards played to attack, summon a Wound as follows. </p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>The highest card defines the maximum Wound Level that can be summoned by the attack (this is the Wound Limit Card or just the Wound Card). So, at most Stakes, an Ace or a Joker must be in an attack to unlock Carnage Wounds.</li><li>The Total Pips must beat the Summoning Cost of the Wound for the current Stakes. So the Ace of Spades (16 Pips) can summon a Mortal Wound at High Stakes, but an Ace of Diamonds (14 Pips) can summon only a Crippling Wound.&nbsp; &nbsp;<br>Additional cards can help increase the Wound (as can Tricks). To play the Ace of Spades as a Carnage Wound requires only a 3 of Spades or 5 of any other suit.</li><li>Pips that are left over from the attack may purchase additional lower wounds, or may stay with the original as additional Difficulty. <br>e.g. Play an Ace of Spades and a Jack of Diamonds in High Stakes you could have a 27 Pip Carnage Wound or a 21 Pip Carnage Wound and a 6 Pip Flesh Wound.</li><li>The Attack classes of each Facet have differing effects that may modify the Wound level:
[t13ne type="facetsuitaspect" suit="all" aspect="Attack"/]
[t13ne type="attacktable" attack="Attack_Classes" /]
</li><li>The Damage Type may also alter the Wound Level: [t13ne type="attacktable" attack="Damage_Types" /] </li></ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Soaking Wounds and Reducing Damage</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Character or Descendant potentially takes damage from an attack, the Wounds may be reduced by the Characters various Soak-Layers of armour and other protection (such as dodges, parries, Chi expenditure, and so on). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In T13 we talk about Soak-Layers implying that these are layers that must be penetrated to cause a Wound. You might begin with an outer layer such as a Power-Field, or Force-Shroud, then perhaps a cloak made from Advanced-Kevlar, over an Advanced Polymer Plate and steel chain-mail shirt, over a padded vest, before you finally get down to a "Tough" Annex. Depending upon the Stakes, you will get to use some, or all, of these Soak-Layers to reduce and absorb the damage. In general, we start at the outer-most layer and work in, although Players should choose which layers are used first. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Armour and Shields tend to accumulate damage as they protect you, and can quickly end up destroyed if you don’t take time to repair, and replace it, as it fails.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="attacktable" attack="Defence_Modes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Hero and Yarn-Teller Characters can also use Chi to lower wounds a level, or even remove them entirely, if they have enough Chi available.  This can also be used to make repairs to armour and other defences as they accumulate Wounds.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Chi used in this way must meet the Base Chi cost for a Wound of that type at "Lower" Stakes. So when struck by a Carnage Wound the cost to reduce it to a Mortal Wound is 21 Chi.  This can then be repeated, so the Mortal Wound can be reduced for 16 Chi, and so on... Removing a Carnage Wound entirely would cost. 21+16+12+8+5+2 = 64 Chi (see <a href="/chi/">Chi Rules Page</a>).<br/> Heroes and Yarn-Tellers can also play Wyrd Tarot or Yarn-Cards to reduce, remove and affect Wounds in other ways. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This Soaking or reducing of damage must take place during the Ordeal Round. At the end of the Ordeal Round the damage is applied.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Applying Wounds</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p> All Wounds are applied at the end of an Ordeal Round as follows. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Distract Wounds: Any Distract Wounds that have not been dealt with in the Round can be discarded by matching Limit Pip Equivalents from the remaining Ordeal Pool. E.g. Dealing with 4 Distracts in High Stakes causes Frank the Psycho to hand over 2 Pips per Distract, he discards an 8♦ to be rid of them all.</li><li>Flesh Wounds can be discarded for a cost of 1 card for each Wound, drawn randomly from the remaining Ordeal Pool, or they will automatically aggravate a Wound already in place one level and are then are discarded. E.g. 3 Flesh Wounds could cost 3 cards from your Pool or two cards could aggravate the third into a Crippling Wound.</li><li>Maiming Wounds cost a Proficiency Slot and this should be deleted at this time. This will impact the affected Annex, usually removing an Umbral or Nimbed, depending on the Wounded Proficiency, but Annexes can be disabled by losing Root, Channel or Tangle.</li><li>Crippling Wounds cost an Annex slot, and should have been applied during the Round (although you can do it now). Nothing more is generally required although note that a Crippled active Personality Annex stops the Character from entering the next Round (as they are unconscious) unless an Alt takes over the body.</li><li>Carnage and Mortal Wounds add Hitches to Characters and Descendants. They should be applied at this time as the Wound, Yarn-Teller, and Referee recommends. These often stop a Character from entering the next round (although Quantum Immortality may be invoked by some Heroes, letting another Alternate take over the body).</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Recording Wounds</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we record the total Pips and Suit of the Limit card that created the Wound on the Character or Descendant when the Wound is taken, we also keep a track of how the Wound has so far been treated (or not). <br>e.g. A 17 Pip Diamonds suited Crippling Wound would be noted on the affected Annex as "Crippled: 17<span class="t13ne-redcard">♦</span>". You might also want to note the freshness of the Wound and the Damage Type, if they will have any effect.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Wounds on Characters begin as Fresh, but quickly become Untreated, or Stabilised, and can become Reopened, or Festering with time.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="woundFreshType"]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Stabilising, Healing and Treating Wounds</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13, unlike many Dungeon-based RPGs, we don’t always have a Healer / Cleric Character in the Party. For this reason we have multiple ways that a Character might be healed, we also have the slightly cinematic concept of a Stabilized Wound, which is a sort of half-way healed Wound that allows you to carry on doing things (but might reopen if you over-tax yourself). Most often during an Ordeal, if you are injured, you aren’t going to have much chance to get Magical or Divine Healing, but you can quite easily Stabilize your Wounds.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Narrative Healing is used during the Round usually when you are in combat, but is often very limited in what it can achieve (see the table below). However, you can Stabilize Wounds relatively easily by playing a card that matches suit (or use a <span class="t13ne-redcard">♥</span> Trump) and beats the Pips of the individual Wound.  </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Wounds can also be treated, in various ways, to try and cure or fix them. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This is the complete table of Wound treatment methods, you can see which ones are instantly usable, and those that have a separate Ordeal of their own. In general, a Healer will require some experience with using their type of Healing on a given Character Incarna, or they will suffer penalties (usually requiring at least one suitable Proficiency or a guaranteed Failure Level). Surgery on an Earth Incarna Character is quite different to that on a Flesh Incarna, and would be penalised, although once they’ve said "Damnit, I’m a Doctor not a bricklayer" a couple of times, and purchased a Stonemason Proficiency then they would lose the automatic Failure Level on that Incarna.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="healingModes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Damage to Descendants (and Extras) is generally dealt with as though the Wounds were Fresh or Untreated. Descendant Wounds can be Stabilised, or Fixed, it is rare that Descendant Wounds ever Fester. However, the methods used to do this are varied depending upon the type of the Descendant, Incarna, etc. Extras generally use the same methods of Healing as Characters.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Fixing Descendants generally requires a suitable Ordeal that the Referee may base on one of the Character Healing modes. Mechanical repairs are usually closest to Chirurgery, or Surgery. Repairs to Knowledge Descendants and their ilk can be handled with Psychotherapy or Natural Regeneration, and so on.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Psychology Effects</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Character is affected by a Psych attack, the Wound has an additional Psychological component that the system models as a Negative or Positive Emotional reaction. Sticks and stones will break bones, but words can have profound effects on the psyche.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Psychosocial States / Emotions</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>In T13 Psychosocial States can be used to represent a number of concepts, such as trances, group madness, and an individual Character’s emotional state. Characters affect each other inside of their heads, pushing them into different mental, physical, social and spiritual states. Psych wounds attacks are the main method used to alter another Character’s mental or emotional state, so it stands to reason that these States are modelled as Wounds.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yes, in T13 you can be Wounded with Emotions. This may seem obvious for Negative Emotions like Fear, Sorrow and Hatred, but is less obvious when the Wound is for Positive Emotions, such as Happiness, Hope and Love. These emotions can be just as powerful as the Negative Emotions, and can alter Characters just as profoundly, it’s just that usually they have more positive effects upon the Character. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Love may create a Devotion Hitch for example, but might also allow a Character to alter their Core, or Personality, or add a new Skill, Talent or Power as well. Hope may make a Character blind to their situation very easily, and Happiness can always make a Character complacent.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facemotable" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Each Wound Type has a Psych Normal Ruling (that applies to the 1 and 2 card Emotions, such as Fear and Terror) and a Psych Extreme Rule (that applies only to a 3+ card Emotion such as Horror). The number of cards defines the intensity of the State that will be felt.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters can only hold a number of cards in Psychosocial States equal to their Awe Score. This is the equivalent of the number of Physical Wounds Nature allows a Character to store, although differs in effect. Characters can only experience a few Psychosocial States simultaneously and this is reflected in the way that Psych Wounds work. New Psych Wounds can push the cards of older Psychosocial States out, removing that State or Emotion, and this may appear to be effectively "healing" that Wound. However, discarding Psychosocial States in this way will create Stress equal to the Pips of the Discarded Card. This does however Stabilise the Psych Wound automatically, although it does not Heal it necessarily (it may represent a chance to), and the Character should now express a lesser form of the Emotion Terror not Horror for example.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normal attacks, like Physical Attacks, can have a Psychological component sometimes (this can be due to Nimbed effects or just extreme circumstances), but most Psych effects come from Psych Attacks (like Bedlam, Lecture and Duck).</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Any Psych Attack can have a Psych effect, which is based purely off how many cards are involved in the Attack.</li><li>The number of Cards that eventually penetrate the defence is not important to deciding the Emotion type, only the number that it begins with (1,2,3+).</li><li>The Psychological component (or Psych Attack) can be Soaked with any of the Psych Defences noted (usually a Psych Soak). This can take place in conjunction with other Soaks such as Physical, Energy or Magical Soaks</li><li>Each Wound that is taken will have its additional Psychological Effects (with the type Normal, or Extreme based on the initial number of cards).</li><li>Positive Emotional Effects do not actually Wound the Character necessarily, and even the Psych effects are often discarded the moment the "Wound" has been Stabilized, but Extreme effects are more likely to be permanent.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Traumas</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Traumas are the worst form of Stress and are essentially Stress-induced Soul-Stakes Wounds, and as such are a combination of physical, emotional, and spiritual stresses. Characters and Descendants can only store Traumas on their Annexes or Incarna Facet Scores (acknowledging some Characters have more than one Incarna). Any new Trauma can replace or reopen an old Stabilised Trauma if no free Trauma slots are available.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Traumas are not soaked like an Attack or a Psych Effect. Traumas are essentially Unsoakable Attacks that combine features of Normal Wounds and Negative (often Extreme) Psych Effects (usually Descendants may or may not suffer Psych effects or may pass them on to their User via a normal Psych Effect).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Trauma like any Wound is made from a number of cards. A Trauma will always involve at least one card (which can also define the negative emotion associated with the Trauma) and usually will involve several cards working together. </p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h2>Healing Traumas</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Traumas are a combination of physical injury, a psychological effect and often a spiritual correlation, that is difficult to successfully treat without high-powered magic or advanced neuro-therapy. Traumas, in fact, are never technically healed, but can be stabilised .</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Traumas</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Damaging Locations and Giant Characters</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>You may have noticed that the way the system has been described so far, it is possible that a Character could punch the ground, draw a few Carnage cards and destroy the Planet. Which not only isn’t very simulationist, it doesn’t make much Narrative sense either.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This is because Locations (and in fact any Vehicle, Kaiju, or giant Characters) have a Size Annex, and a Size Annex directly affects how they play cards and soak damage. The rule is that the difference in Size Shifts the Card Pips by the Score of the difference in Sizes as a Boon. The Yarn-Teller and Referee agree when these Size Shifts (or Size Bonus and Penalties) take place and apply. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If that sounds complicated, let’s look at an example. If Jim jumps into a sports car (a vehicle with a Size Annex of 3), and is shot at by Kerry (who as a human is Size 1) with a machine-gun then all the individual cards of Kerry’s attack will shifted down 1 Pip (a difference of Size 2 which has been Reduced to a Score of 1 from a Boon of 2). Making it a little less likely that Jim is badly injured. If Jim swerves the car and rams into Kerry, running her down. All the cards of Jim’s Crash Attack are then Shifted up 1 Pip, making him a little more likely to injure Kerry. These Size Shift Pips are inherent to the cards and the Wounds they create.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This becomes very important when for example a huge Kaiju attacks a City. The Kaiju has a Size of 20, the city itself a Size of 35. That Size Shifts all the Kaiju’s attacks on the City by (15 Reduced gives 4 Pips). If Jim and Kerry joined up to fight the Kaiju, Kerry would be at a (-19 Reduced -5) on all cards played with her machine-gun, Jim in his car would be at (17 which is also a -5). Meanwhile every action taken by the Kaiju would have +5 Pips on each card to affect Jim and Kerry. These changes to Pips do not effect the Wound Limit of cards, but it is worth noting that even at Extreme Stakes the reduction in Pips means that if you are trying to affect a Planet for example (Size 153) Jim and Kerry would both have a -22 Pips to <strong><em>every</em> card</strong> they played to try and damage the planet under them, not even enough to Distract the planet. Even the Kaiju trying to attack the planet would have a SIze Shift of 133 and have a -20 to each card.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Giant Kaiju cause a lot of collateral damage. This is handled by also drawing the difference in Size (Double Reduced to create a Draw) as additional potential cards on the attack. This means if the Kaiju plays a 10 of Diamonds to move, that would hurt any Size 1 people in the way as a 10+5=15 Pip Crippling attack (and they would also Draw another 2 (Boon 19  gives Draw 2) Cards to add to that attack, either of which may lift the Wound Limit). A tree along the route may be Size 8 which would take a 14 Pip Crippling Wound and also Draw an extra card. (20-8 =12 Reduced to 4 Reduced to 1). </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Size Shifts and Area of Effect</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Some Annexes have an Area of Effect (the Dominion Realm Success). This gives the Annex a Size of its own, which works just as above, under most circumstances. The Area of Effect also takes into account the Size of the Character or Descendant that has the Annex. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Perhaps that Kaiju has a breath weapon (Flame, or even Radioactive Plasma, breath is fairly common amongst such beasts). The Kaiju is Size 20 (+5) and its Dominion is 18(+5), this would give an Area of Effect equal to Yarn 10, which would let the Kaiju’s breath weapon effect all of a large city.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Alternatively, if a human wants to attack a Kaiju, then having an area of effect weapon like a grenade or missile launcher, or a plasma or Splat cannon can really help even the odds. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When comparing these Area of Effect to Location Sizes it’s important to remember that Location Sizes are always measured in Chi, so you must convert the Area of Effect from Yarn to Chi before calculating the Size Shift Pips the Attack may have (or be Penalised by).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If a Grenade has a Yarn Size of 2  (a couple of rooms) that’s a Chi Size of 7, which means going up against a Size 20 Kaiju the grenade is at a Size difference of 13 (with a -4 Pips).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Parrying, Blocking, Dodging, Soaking, and Size.</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Size effects everything about an Attack, including how the Attack can be defended against. A Parry, for example must match the Pips of the Kaiju’s or Location’s attack including the Size Shift Pips, the same goes for a Block. Dodges are even worse with each card of the Attack having a bonus, all of which must be beaten to Dodge the attack.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Larger Parries and Blocks could have difficulty parrying smaller attacks too, but here the Size works for the larger thing. Allowing them more freedom in matching the attack Pips as they don’t have to use all the Size Shift Pips. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Soaks and Armour are also affected in this way, which can create some odd situations, such as when attacked by a 10 of Diamonds with +5 Pips, if your Armour Draws the Ace of Diamonds, the armour will Soak the Crippling Wound, and pass through a Carnage wound. Potentially killing you in your armour, which could be easily repaired. Conversely, if you are wearing a suit of Mech Armour (armour that has Size as a vehicle) then it could add its Size Shift Pips to an incoming attack from a smaller opponent, but only when you want it too.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Referees and Yarn-Tellers should usually not allow Size Shift Pips to add to a Dodge roll, Kaiju rarely dodge anything but other Kaiju.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Resource Wounds</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Resource Wounds are an alternative or optional rule that extends the Economic Attack types to include all other forms of Wounds. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In a normal game, only Economic attacks affect the Character’s resources, draining them of Chi based on Pips as Yarn, but in this optional rule all Wound Cards cause Sway damage paid from the various Facet Sway stores the Character has. Normally Characters have a lot less of these Sway Resources than Chi it should be noted, so slightly different systems are used to make this play out.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Generally speaking the Resources attacked should be specified during the card play and are paid immediately. Most combat attacks for instance will attack a Character’s Health (Nature Facet Sway), but attacks may target any Resource with a suitable Narration / or Narrative reasoning.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Playing cards and defending against them is performed as normal above, but when Wounds are assigned they do not have the normal effects, but instead drain the Sway Resources of the Character.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Usually each card causes its Pips Reduced as a Resource Damage (1-4 points each card). Characters who are reduced to zero (0) are unable to continue, although exactly why varies by Resource. A Character that has a Health of zero is considered Dead. No additional Hitches are created or anything like that, they are just dead.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In this variant, Chi can be converted into Resource Sway only by making a specific Resource Replenishment action (such as Healing in the case of replenishing Health). This is done by making a Resource Replenishment Roll on the Facet that you are trying to convert the Sway to. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Difficulty of the roll is equal to the number of Resource Sway that you are trying to create. So if you have a Nature of 13 and currently have 6 points of Health, the Difficulty to Replenish would be 7. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If this Difficulty is beaten then Chi may be converted into Resource Sway as required to top up the Resource. The Chi spent is usually doubled to create the amount of the Resource Sway, although in a Higher-powered game you may receive the Value of the Chi as a Boon instead. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Failure to pass the Difficulty means that you cannot convert Chi into the Resource, however you can pay 1 Chi to replenish 1 Sway (half the Chi is lost).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>As another optional Rule, any attack that will take more than half the Character’s current Resource can be spread to other Resources as well. So if a three card attack is focused on Health the cards (An Ace of Diamonds, 5 of Spades and 6 of Hearts),  may cause 4, 2 and 2 points of Health, for a total of 8 (and 27 Pips Total) , this causes more than half the Health to be lost in one go (13 Nature would give 13 Health) so the Player will lose 6 Health, and 2 Points of Health must be paid by another Resource. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Yarn-Teller must agree the other Sway used (for example Dignity, Wealth or Effort). These Points of Damage are paid on a 2 for 1 basis (so the Attack could take 4 points of Effort instead of the extra 2 Points of Health) when paid in another Sway Resource, or they may be paid in Chi, however when paying in Chi the calculation is a bit different. If there were no Health Points the 27 Pips would try to drain 216 Chi, but we’ve already dealt with 6 of the 8 Health Points. So instead we look up the Super-Value of Boon 2 and pay that in Chi (16 Chi).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Another optional Rule that can be used during a Resource Attack is that if any Resource loses more points than the Facet Score in one blow then the Character is considered Staggered (and take 1 GRT). So any Health Attack that causes more than 4 Points of Health to be lost in one attack (if Nature Facet is Boon 13), will cause the Character to be staggered for 1 GRT.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Resource Attacks are only possible if individual Facet Resources are used in the game, otherwise use the standard Economic rules that effect only Sway or Chi as standard on a Pip for point basis.</p>
<!-- /wp:paragraph -->
'),
		array('RulePage' => 'Death and Immortality', 'Description' => '<!-- wp:paragraph -->
<p>It is a fact of life that people die. So Character Death is something that we have to consider in T13. Not every would be hero is going to save the day, sometimes they aren’t even going to be able to save themselves. Then again, T13 is an Omniversal game, and that means that anything should be possible, including a number of types of immortality. So how do we deal with death, and the undying?</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>The Dead Hitch</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Firstly, a Dead Character in T13 is usually much the same actual Character as they were when they were alive. The only difference is that will have a Formation Facet Hitch that is specified as "Dead", for most Characters this is a Nature Scars Hitch. The Dead Hitch stops all living functions of the body, including whether cellular (such as regeneration), metabolic (such as protein making), muscular (such as breathing or moving) and neural (such as thought and perception), of course due to the way Hitches work in T13 it is possible for a Character to be only partly dead, able to move, breath and think, but with the Dead Hitch just complicating these activities. This can make it seem that Death is, in someway, optional for a Character, and this can be true.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Opting to Die</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes a Yarn-Teller, or a Character Player, will opt to let a Character they are playing die. Occasionally a situation may make this the only sensible and logical choice, for example after a number of Carnage Wounds, that were narrated as explosions, decapitation, burning and disintergration, it makes far more sense for a Character to die, rather than try and struggle through the Dead Hitchs.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When a Character chooses to die, their current Tao Sway, Facet Sway and Chi is released as a burst of Yarn. This burst of Yarn can have dramatic effects on Character’s and Descendants that are present. Depending upon the genre and situation a Character may be gifted Annexes, Proficiencies or Descendants (often in the form of an inheritance) by another Character’s death. Transferring Annexes and Proficiencies from a dead Character to a living one can be achieved by creating a new (but similar) Annex, or by creating a Descendant from the original Annexes and handing that Descendant over. Of course, Character deaths can also have profound effects on Plots. These Yarn bursts can be harvested by some entities and magic, such as Increated, who will use this Yarn burst as sustenance.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Opting to Not Die</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Let’s be honest under most circumstances a Player is not going to want to let their Character die. Instead they will struggle against this in every way possible. Dead Characters can struggle along, clilnging to life, perhaps staggering, or crawling, or just managing to survive in a coma, hoping to eventually heal their Wounds and resolve that Dead Handicap somehow. There are a few varied methods that can allow that, but they mainly rely on spending Chi to undo damage taken somehow.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Reloading Chronoliths</strong> — The first choice of a dying Mercari is to simply Reload their last Chronolith. Of course, reloading requires Chi expenditure, based on how long ago the Chronolith was and how much Chi was invested in it.</li><li><strong>Quantum Dodging</strong> — An expensive option open to powerful Mercari and Yarn-Tellers, they can side-step from the reality you were injured in to a nearby one where you weren’t. Typically the last Wound is side-stepped, although the whole fight, accident, Ordeal, Scene or day can be side-stepped with escalating costs. Typically side-stepping will be more expensive than Reloading, and has the advantage that other Mercari will not sense the side-step occuring.</li><li><strong>Chi Negation</strong> — Chi is a powerful tool for manipulating reality, and even Heroes who haven’t mastered Chronoliths or side-stepping can still use Chi to negate incoming attacks, discard or make less serious Wounds and Heal Wounds they have recieved faster (even instanly under some circumstances).</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>The Inevitable</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>So you have tried not dying in a variety of interesting ways, and it just hasn’t stuck. Usually this is because the Character has run out of Chi that they can use to counter the effects of the Omniverse. Eventually they just cannot fight the inevitable any longer and they must accept death. They will still create a Chronolith with their Yarn-burst death, although this will be smaller than that created by a Character who elected to die while full of Chi. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>After Life</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Of course, what happens after life is a profound part of existence and the Yarn-Teller and Referee should have some idea of what actually happens to a Character upon death. T13 provides a few choices that can let you build your own world’s lore about death, and final passing.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="deathTypes" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Enforcing Mortality</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Death, it may appear is rather avoidable. Character’s may seem to have choices that can always stop them from dying. Wounds can be soaked, healed, and even if a Wound creates a Hitch, that Hitch does not have to be deadly one. Which begs the question, if it is so hard to die, how do Characters die anyway. Is every bad guy an immortal able to shrug off even micro-nuke bullets? Well, sorta yes and definitely no.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Tellers have a lot of ability to end Characters. A Yarn-Teller can declare any of their own NPCs dead at a moment’s notice, and although it is considered bad form to kill another Yarn-Teller’s NPCs, it is usually possible (Immortal beings aside) and the Referee can adjudicate if Yarn-Tellers disagree. Similarly, Player Characters can be killed, and sometimes this will stop them from being played (although not always, it depends on the game and genre, of course).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Tellers that wish to kill a PC should focus on stacking "Dead" Scar Hitches on the PC, but only to the limit of their Nature Boon. You do not want a Character to jump to "Undead" status via a Woe. Although if you, a Yarn-Teller, are trying to kill a PC that is generally a sign that something has gone wrong with your Narrative. Plots don’t generally like to destroy their own Embodiments if they can help it (unless they are hoping for an upgrade somehow... in which case, why not discuss that potential upgrade with the player and potentially add it as an Alt or Lore), although it can happen as a result of certain Quest Embodiments, etc. Now, that isn’t to say there are no good reasons to kill a PC, there are plenty, ranging from needing to raise Stakes and Suspense, to the Player has become bored of the Character and has a new PC in mind.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h3>Consensual Murder</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If a Player has decided they have had enough of playing a particular PC, and that they want a new experience, and you have checked with them as the Yarn-Teller, then feel free to murder that PC. As a Yarn-Teller you might have a Plot that requires a Character is sacrificed, if this is the case then making your sacrifice be the Character that a Player is bored of will make the most sense. Some Yarn-Tellers may persuade a Player into becoming the sacrifice Character by appealing to their sense of drama or whatever. This would also count as a Consensual Murder.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h3>Narrative Homicide</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes a Plot demands blood. Perhaps a Plot is trying to raise the stakes, to make everyone take it a little more seriously. Sometimes it will set two Characters against each other in a fight to the death, because honour, glory, justice or revenge. Other times the Narrative will create such an emotional turmoil around a Character that they will tragically suicide, death becoming their only way out. Then again in a Battle Royale, or Slasher movie, only one Character can survive, and everyone else must die, although this kind of Plot should never be dropped on a group mid-campaign without a lot of foreshadowing and discussion wih your Players, these structures work best for short campaigns and one shots, although this will vary by group and some will be very down for thinning the herd with a potential Total Party Killer. Remember that in T13 you can always have the Battle Royale take place in a simulation or alternate world as a "What if?" Plot if desired, although in this situation death is technically removed from the table.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h3>Death Actions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Sometimes a Character will have a suicidal impulse or purpose that they are willing to accomplish at any cost. Characters lay their lives down for honour, loyalty, duty, love and even for a punchline. Any of these can drive a PC to throw themselves into a battle they cannot hope to win, usually to "buy time" or similar for another Character to get into position or escape. In T13, Characters who are willing to throw away their lives like that are rewarded. They can use the Yarn released by their death action to achieve things that may not strictly have been possible for them before. This Dying wish and Death Action Yarn-burst are quite powerful, but it should be remembered that Yarn-Tellers are still capable of negating them with their own Yarn. That said whatever a Yarn-Teller can do to incorporate another Character’s Death Wish into their Narrative they should do. At the very least a Dying Wish should always be able to add Failure Levels to the opposition, and most often those Failure Levels will act as a Delay, buying the other Characters time. Of course, other Characters want to be remembered for their glories, and so they may take another Character (often a Monster) with them as they die, and Yarn-Tellers should be willing to allow this, but remember often Monsters killed this way have off-spring, mates, or parents waiting to emerge for a sequel.</p>
<!-- /wp:paragraph -->

'),
		array('RulePage'=>'Ordeals', 'Description'=>'<!-- wp:paragraph -->
<p>In T13 when we are dealing with complex large Tests, such as action sequences we break the Test down into smaller Tests and call this an Ordeal. During an Ordeal we usually use cards to resolve actions, and you can see an example card here. Click on it to see more details about the card.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="draw" cards="1" mode="jscript" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Types of Ordeal</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Ordeals can cover a huge variety of Tests and situations, you can get a grasp of this from looking at the Yarn/Ordeal section of any of the cards. Here’s a few randomly drawn cards to examine:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="draw" cards="4" mode="jscript" tarot="1" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Referees (and Yarn-Tellers) can use card Draws to randomly determine the Ordeal Type, Stakes, a suggested Test, the number of Obstacles in the Ordeal, a suggested Action (which usually falls within the suggested Test), a suggested Stage, a suggested type of Fight or the type of Motional Ordeal.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="trumps">Trumps</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>During Ordeals we use the term Trumps for the Suit most suited for the task. It should be noted that any card can be used to perform any sort of action, but some Suits are better suited to some actions. For example any card can Heal a Wound that matches suit, but you can use Hearts to essentially match any Suit. Often, this is what Trump means in Ordeals, the Suit will automatically match a different Suit (or has some other bonus).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>However, there is another use of Trump that applies more generally in Ordeals that do not include direct conflict, arguments or combat. If you are using the right Suit for the Test at hand (for example when preparing ingredients playing a Diamond) then you can add <strong>+2 Pips</strong> to the action which you can think of as a 2 of whatever Suit, or add to the Trump itself (it can even cause Spades to unlock a Wound with a Lower Limit card (see Attacks and Wounds).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Trumps tend to match the Facet Suit of the action or Test. You can see how this works here. [t13ne type="suitable" /]</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Ordeal Procedure</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When the Yarn-Teller declares that you are entering an Ordeal they will usually declare "Roll Profs" or "Roll Initiative" which is the same thing for a combat Ordeal. But there is actually a procedure that should be followed.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Stakes</strong> — The Yarn-Teller (or Ref) should decide (and usually announce) the Stakes of the Ordeal. Ordeal Stakes vary from Low Stakes (where there is really nothing at risk) to Soul Stakes (where your Soul is on the line), see <a href="#stakes">Stakes</a>.</li><li><strong>Roll Proficiency Dice</strong> — When an Ordeal begins the first thing that you need to do is find suitable Proficiencies for the Ordeal. This works just like the Proficiency Dice for a standard Test. So, at most you need to find four Proficiencies.
<div class="t13ne-tablewrap">
<table class="t13ne-table">
<thead>
<tr>
<th>Number of Applicable Profs</th>
<th>Result</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>No Proficiencies applicable means the Character cannot act until the end of the first Phase, and all Draws are halved through the Round.</td>
</tr>
<tr>
<td>1</td>
<td>1 Applicable Proficiency allows you to draw a single card into your Ordeal Pool.</td>
</tr>
<tr>
<td>2</td>
<td>Roll 1 Prof Die (1d6 normally) and Draw as appropriate (see below).</td>
</tr>
<tr>
<td>3</td>
<td>Roll 2 Prof Dice (2d6 normally) and Draw as below</td>
</tr>
<tr>
<td>4</td>
<td>Roll 3 Prof Dice (3d6) and Draw as below.</td>
</tr>
</tbody>
</table>
</div>
<p>You Draw cards equal to the Draw of the Boon (or the Score Reduced). This table summarises the first few so you can get the idea.</p>
<table class="t13ne-table">
<thead>
<tr>
<th>Score</th><th>Draw</th>
</tr>
</thead>
<tbody>
<tr>
<td>1-4</td><td>1</td>
</tr><tr>
<td>5-7</td><td>2</td>
</tr><tr>
<td>8-11</td><td>3</td>
</tr><tr>
<td>12-15</td><td>4</td>
</tr><tr>
<td>16-20</td><td>5</td>
</tr><tr>
<td>21-25</td><td>6</td>
</tr><tr>
<td>26-31</td><td>7</td>
</tr>
</tbody>
</table>
</li><li><strong>Play by Stages, Phases, and Rounds</strong> — Play then begins, order determined by POISE, see Rules for <a href="/ordeal-rounds/">Ordeal Rounds</a> and <a href="/ordeal-stages/">Ordeal Stages</a>.</li></ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2><a id="stakes" name="stakes"></a>Stakes</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Ordeals come in differing levels of risk. In a High Stakes Ordeal like Combat failure and death is always an option, but the same Combatants meeting for a Fencing Competition are unlikely to kill each other in Medium Stakes, and when training before the competition both competitors would be much more controlled, and the risk of injury and Stake would be very low.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="stakes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>See the <a href="/stakes/">Rules page on Stakes</a> for more details.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Ordeal Time</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Time in Ordeals can vary greatly, a lot more time passes during a shipwright building a yacht than takes place over a bank heist and both are longer than a 100 metre dash, yet we can model all three with the same Ordeal (at least on paper). The Time taken by each is very different, but the system doesn’t really care, in fact one of them could be taking place on board a spaceship travelling at close to the speed of light and really take millennia to finish, with time dilation.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Time is not a linear experience for human beings and so it isn’t linear in Ordeals either. Ordeals deal with Time as a Narrative flow, this flow is broken into Rounds, Stages and Phases which we’ll look at in a bit, but it is important to remember that time flow is subjective. Minutes can feel like hours, or vice versa, and this is the sensation of time that Ordeals use.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Round</strong> — The Round is a Game Mechanic structure that can encapsulate several Stages or we can pass through multiple Stages in a Round. Narratively speaking, a Round is about three pages of a Comic Book, or several pages of a Novel. A lot can happen during a Round, as the Round ends only when the Round Wild Pool is emptied or if the card deck is emptied.</li><li><strong>Stage</strong> — A Stage is a Narrative Structure in the Ordeal. A Stage can be thought of as being a Location (and in a Motional Ordeal it usually is a Location) or a step in the Ordeal (like those of a twelve-step program, or the instructions for self-assembly furniture). While you are in the Stage you may have Obstacles that must be overcome and a Stage Difficulty (which can represent the size or the difficulty in traversing a Location or the difficulty of the step). Stages of Ordeals are like Scenes of a Story (and can be treated this way by larger Plots). Narratively speaking a Stage is usually at least three panels of a comic-book and a page of a Story.</li><li><strong>Phase</strong> — A Phase is a cycle of single narrative moments, it can be a page or a single panel of a comic-book, or a paragraph (or even sentence) of a Story, depending on the panel or sentence. During a Phase each Character gets to have a Moment, where they can take a turn, make a full-action, half-action, or wait as required. These actions may all take place simultaneously, but they are resolved according to the Phase Order Initiative System that you are using (so if there are multiple panels or sentences you know what order they should go in).</li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Rounds</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Round is the largest and most important structure of the Ordeal. The Round controls how play proceeds, deciding the order of Actions and who may act when. You can read the rules page on <a href="/ordeal-rounds/">Ordeal Rounds</a> to find out more.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="phases">Phases</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Phase is a collection of single narrative events or ‘Moments’. At its fastest, in High Stakes situations like action sequences or fights, a Phase lasts about half a second of subjective time (it feels about as long in a Never-Time bubble, or travelling in Time, or whatever, as it does at normal pace), and is just about long enough for each Character to do a few quick things, usually an Full-Action or Half-Action (drawing and/or playing 1 or more cards). To find out more about Phases and timing read the Rules for <a href="/ordeal-rounds/">Ordeal Rounds</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 id="range">Action Spaces</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>All Action within the Ordeal takes place in what we refer to as an Action Space. This Action Space can be a close representation of a real space, some imaginary space, or some Psychosocial space such as a dreamworld or imagination. It is the Action Space and how it is constructed that controls how cards are played to move Characters aroud in the Space. See the Rules on <a href="/action-spaces/">Action Spaces</> (with reference to <a href="/ordeal-stages/">Ordeal Stages</a> also) for details.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealTerrain" /][t13ne type="table" array="ordealFiringType" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3 id="stages">Stages</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Stages of an Ordeal are often procedural points of the Ordeal that the Character is working through, although they can instead describe the Action Space. You can find out more by reading the rules page on <a href="/ordeal-stages/">Ordeal Stages</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Tide of Battle (Optional Rule)</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These are optional rules intended to make combat, and particularly large scale battles simpler to manage and more Narrative.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tide of Battle follows from the Rounds of the Ordeal and can only occur during combat. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tide of Battle can either work for you, when it is said to be Flowing, or work against you, when it is said to be Ebbing. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Tide of Battle is decided at the end of each Round (by the Referee), usually with Flowing going to the Characters that have (in order of importance):</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>Won the most Tricks during the Round.</li><li>Inflicted the largest Wounds</li><li>Soaked or Avoided the most damage.</li><li>Played the most cards in Preparation or Movement.</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>conversely the Ebbing Tide generally goes to Characters who have:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>Taken the most Wounds cards</li><li> Taken Carnage + Wounds</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Each Stage of the Ordeal becomes affected by an Ordeal Card, that is drawn and played by the Referee or Yarn-Teller, and Narrated to all Characters as part of the Staging. The card defines the current Tide of Battle circumstances, perhaps indicating that the Flowing forces are breaking through, or that the Ebbing forces are regrouping, this adds semi-tactical nuances to the situation, beyond those indicated by how the coma.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When the Tide is in your favour you may receive Flow Success Levels. If the Tide is against you you can receive Ebb Failure Levels, in very rare circumstances you might receive Ebb Success Levels or Flow Failure Levels.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="tidalSuccesses"/]
<!-- /wp:shortcode -->

'),
array('RulePage'=>'Ordeal Rounds','Description'=>'<!-- wp:paragraph -->
<p>The Round is the largest and most important structure that we use in an Ordeal. The Round controls the pace of the action and helps break Ordeals into smaller, more understandable "chunks", but the Round is purely a game-mechanic structure, it serves only the game, and not the Narrative. Rounds are initiated whenever an Ordeal is declared, and ends when either the Round Wild Pool or the Deck is emptied.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Round Wild Pool</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A defining point of a T13 Round is the Round Wild Pool. This is a pool of cards that are potentially used by every Character involved in the Ordeal. The Pool varies in size based on the Stakes of the Ordeal. The Round Wild Pool can vary from 2-6 Ordeal Cards. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Blended Stakes can modify the Round Wild Pool, with a Low Stakes Ordeal, with a High Stakes component using the Medium or even High Stakes Round Wild Pool to increase the potential danger and threat.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>These Cards are dealt face-up onto the table where everyone can see them during the Round.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When making an Action, if a Character can make an Ordeal Trick with a card from the Round Wild Pool then they may take the Wild Pool card and add it to the Action they are currently making. For example if you can match a card from the Round Wild Pool with a card from your Pool, they can be played together as a Pair. This would allow one of the Pair to be played as a Wyrd Tarot card Promise.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When all cards are played from the Round Wild Pool then the Round will end.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can also find out more about Narrative Tricks, what they are, and how they affect the Narrative in the Rules page for <a href="/narrative-tricks/">Narrative Tricks</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Rounds and Stages</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Round is a game-mechanic structure, Stages are a Narrative structure. These two structural systems combine to create the flow of all Ordeals, and can vary greatly from Ordeal to Ordeal.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Racetrack</strong> — The Characters can work through several Stages (possibly even repeating a number of Stages, as you might race around a track) in a single round. This is especially common in Action sequences, where Characters are moving through a number of Stages during a single Round of the Ordeal.</li><li><strong>Gradual</strong> — The Characters can work through several Rounds while remaining in a single Stage. This is more common in gradual Ordeals where Characters have to accumulate resources to make purchases, or perform years of research to make a breakthrough.</li><li><strong>In-Step</strong> — Each Round is specifically tied to a Single Stage. The Stage cannot be completed, without also completing the Round (and vice-versa). This effect is usually created by making the Round Wild Pool only 1 or 2 cards big, and works well with heist style Ordeals, or any situation where there is a clearly stepped plan.</li><li><strong>In-Flux</strong> — Rounds and Stages are completely unconnected to each other. The first Stage may take two Rounds to complete, but the later Stages may all be completed in a single Round, or vice-versa. This is the usual chaos that most Ordeals exists in.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Round Procedure</h2>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Roll Proficiencies</strong> — A Proficiency Roll is how we begin an Ordeal. The Proficiencies should be appropriate to the Ordeal being attempted, in Higher Stakes Ordeals you would probably be allowed to use Proficiencies for any weapons you carry, or martial arts you may know, as well as Proficiencies like "Fast", "Quick-witted". Normally at this point you only roll Proficiency Dice (it is possible for an Annex, Descendant or Facet to also be rolled if the Referee and Yarn-Teller agree, although usually the Annex must have a Quiet Automatic Activation Nimbed specifically for this purpose). The Score of this roll is Reduced to find a Draw and this number of Ordeal Cards are drawn to form the initial Ordeal Pool (which may be beyond the Ordeal Pool Limit, at this time).<br>Extra Success Levels may draw an additional card. Failure Levels may cost a card each.</li><li><strong>Narrate Stage Card(s)</strong> — The Yarn-Teller should reveal the difficulty of this Round’s 1st Stage (by revealing the Ordeal Cards or telling the Players the difficulty) while describing the Stage (or Location) and narrating the Ordeal at this time. <br>The Yarn-Teller may allow characters with knowledge of the Location (or the procedure) to see the coming Stages, allowing them to plan ahead. <br>Sometimes the Yarn-Teller will keep the Stage Difficulty, or most often the Obstacles secret. They might show one route, but a short-cut, or secret technique that is unknown, would be kept face-down (or even off the table) until it is discovered. <br>Characters may start in different Stages, with different Stage Difficulties, if that is the case this would be the time to tell them that. They may even have different goals and even different Stakes. That’s all up to the Yarn-Teller and Referee.</li><li><strong>Deal Round Wild Pool</strong> <strong> —</strong> The cards of the Round Wild Pool should be dealt according to the current Stakes of the Ordeal.</li><li><strong>Begin Round Phases</strong> — Start the Phase Order according to the Initiative System you prefer to use.</li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3 id="duringround">During the Round</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Rounds proceed by Phases, through Stages (or across/between Stages if they are acting as proxies for Locations). With each Character taking their actions in turn. The number of Phases per Stage and number of Stages is generally controlled by the the Yarn-Teller.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 id="endofround">End of the Round</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Round ends at the moment that the Deck is exhausted (the last card is drawn or dealt) or a Trick is played that includes the final Round Wild Pool card. The end of the Round breaks the narrative flow a little, as combatants back off to assess the situation, gauge the severity of their wounds, assess ammo levels, those being chased stop to catch their breath, look behind them, and that kind of thing.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>All RT and GRT Chips are immediately handed in. They will have no effect on the next Round.</li><li>All Ordeal Pools are immediately counted and that number Reduced (take the Score of the Boon), then you hand back all but the reduced number of cards.</li><li>It is normal to apply all damage before the next Round. See Wounds Rule Page for how to apply Wounds. </li><li>Returned Ordeal Cards are shuffled, the next Round Wild Pool is dealt (or selected), and then Proficiency Dice may be rolled to draw additional cards for the next Round. These are added to the remaining Pool from the last Round. Highest number of cards begins the first Phase of the next Round.</li></ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 id="phases">Rounds and Phases</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Phase is a collection of single Narrative events or ‘Moments’, usually consisting of one Moment for each Character in the Ordeal. At its fastest, in a High Stakes situation like Combat, a Phase lasts about half a second of subjective time (it feels about as long in a Never-Time bubble, or travelling in Time, or whatever, as it does at normal pace), and is just about long enough for each Character to do a few quick things, usually an Full-Action or Half-Action (drawing and/or playing 1 or more cards). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During an extended Ordeal, a Phase could be a day, a week or even centuries long (more if travelling in time as well), with many things happening that aren’t narrated around the Ordeal.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In short, in a Phase we have some "things" happen, each thing caused by someone, usually to something or someone else.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Ordeal proceeds by Phases, in a Phase each Character gets at least one Action where you might be able to draw and play cards, narrating the action, or you might be stuck waiting for a Power to cool-down (in GRT).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Normally, a Stage has a limited number of Phases (decided by the Stakes and Yarn-Teller), if the Character fails to play cards that are higher than the Stage difficulty (for that purpose alone – you can’t count that cracking shot you pulled off in phase 4) by the end of the Phases of the Stage, then they have failed that Stage.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Phase Order Initiative System </h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The order that Characters can take their Moments and act in during a Phase is determined by what we call the Phase Order Initiative System (POIS), there are a number of different ways that POIS can be deployed.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Sweeping Spotlight POIS </strong> — Start with the Player to the current Yarn-Teller’s left or right (after they have described the Scene, Stage, Situation and Stakes) and go around handing the spotlight off to the left or right.</li><li><strong>Yarn-Teller Directed POIS</strong> — The Yarn-Teller points the "camera" at the interesting action (while letting the boring stuff happen off camera). This means they follow the Characters that are actively fighting, shooting or whatever, then turn to those who are hiding, waiting, digging in, and so on and say "So, what have you been doing?"</li><li><strong>Ordeal Pool POIS</strong> — The Order proceeds from the Character with the largest Ordeal Pool (by number of cards) down to the smallest. This can work very well, but changing Pool sizes and Preparations can complicate the procedure immensely. In general, a Prepared Reserve does not count towards initiative Order, unless noted for a Style Reserve Pool (such as Speedster).</li><li><strong>Card POIS</strong> — Each Character must assign at least one card from their Ordeal Pool as their Initiative Card(s) for the Round (or Stage). Play proceeds from highest Pips to lowest Pips. The cards assigned for initiative cannot be used for another purpose, but can be swapped out or added to whenever a Character Draws a card (which can allow a Character to take more than one Action a Phase). Playing an Initiative Card means it will not be available for initiative next Phase.</li><li><strong>Scored POIS</strong> — The Character with the highest Zeal, Inertia, Fury or Quiet Score goes first and so on down to the lowest. This is can be rolled to give some random factor. Score Ties can be broken by Boon, Value or die roll as required. Annexes may be used if they are appropriate.</li><li><strong>Pay Sway POIS</strong> — You can pay with Sway (usually Facet Sway Verve, Endurance, Surges or Serenity — although Breaths, Health and so on may also be used). Those who pay more go faster, optionally Heroes may add Chi, Yarn-Tellers may add Yarn. This Action Economy system is best used for tactical and strategic games where you want limited randomness, for a more cinematic and random flavour try combining with the previous three modes.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Sometimes one side may have an advantage of surprise, in these cases they should act first, regardless of Initiative, but only for the first Phase.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 id="takingactions">Moments and Taking Actions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>During a Phase each Character gets usually one Moment, this is their go, chance, or turn (some careful play and strategies can get you more than one Moment), the time for them to act and hopefully shine. During your Moment you can elect to take a Full-Action or a Half-Action, unless you are already affected by GRT. But we’ll get to that in a moment. Normally all Moments are considered to be overlapping, with POIS order determining when each Moment begins, but they all end simultaneously at the end of the Phase. This is when the Yarn-Teller or Referee should narrate the Phase’s Action.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4 id="fullactions">Full Actions with Descendants and Annexes</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When you use a Descendant, or an Annex, during a Ordeal you get to draw new cards as well as playing at least one card.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is normal during Ordeals to not roll for these actions, instead take the average (it should be noted that the average will be halved if you are not Proficient, but otherwise Proficiencies are not rolled or checked during an Action). These Averages are noted on the Boon of the Annex or Descendant as the Score and more importantly the Draw.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>You should pay any Umbral costs associated with the Descendant or Annex before drawing any cards (in case they fail). In some situations failure to activate the Annex may cause automatic failure, so be sure you meet all the Umbral Conditions.</li><li>A Descendant or Annex draws the Boon Draw cards (Score Reduced). If rolling Score and reducing the number of cards looks like this helpful table <div class="t13ne-tablewrap"> <table class="t13ne-table"> <thead> <tr> <th>Rolled Score</th> <td>0</td> <td>1</td> <td>2-4</td> <td>5-7</td> <td>8-11</td> <td>12-15</td> <td>16-20</td> <td>21-25</td> <td>26-31</td> <td>32-37</td> <td>38-44</td> </tr> </thead> <tbody> <tr> <th>Number of Cards</th> <td>0</td> <td>0.5*</td> <td>1</td> <td>2</td> <td>3</td> <td>4</td> <td>5</td> <td>6</td> <td>7</td> <td>8</td> <td>9</td> </tr> </tbody> </table></div> <p>*A half card is one card but the Pips are halved. </p></li><li>Having drawn your cards then you may play at least one card. The number you can play is based on the Annex Type, and varies from 1-4, but some Nimbeds and Success Level Effects can let you play more.<br> <br>When playing cards, if you could play a Trick that would use a card from the Round Wild Pool, then remove it from the Round Wild Pool and add it to the Action. <br><br>Additional cards (such as from Trick play) may be used as normal, or to pay the costs of Range, or multiple Targets as appropriate. They can also be used to reduce the Reaction Time of that Annex or Descendant. <br><br>You may be able to play cards on the Stage Difficulty while playing other cards to perform other actions such attacking another competitor (unless restricted by Umbrals or Hitches).</li><li>Having played cards you should now Discard cards over your Ordeal Pool Limit (number of Hitches + Scale).</li><li>Having Discarded you now draw Reaction Time chips, and any Global Reaction Time Chips that are required.</li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4 id="halfactions">Half Actions</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Half-Actions are another way of getting things done during an Ordeal. They don’t incur any Reaction Time penalties, and therefore are an excellent way of progressing through an Ordeal – if you have a good enough Pool.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Half-Actions are simple Facet based actions. This allows them to either:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Wait</strong>: And draw a card (some Refs may allow a Character to draw equal to the appropriate Facet Draw, but usually this will be one anyway).</li><li><strong>Quick Action</strong>: Play a single card from your Ordeal Pool without any GRT or RT.</li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4 id="rt">Reaction Times</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a character takes a Full-action (drawing new cards and then playing them) there is a lag, or cool down, before they can use that Descendant or Annex again. This is called Reaction Time.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For Annexes, the normal Reaction Time is equal to the Reduced Boon, but this will often be modified by Tangles, Umbrals or Nimbeds or a Hitch Gnarl. Descendants are additionally limited by their physical size (like a rifle is slower than a pistol and a dagger is faster than a battle-axe, although that isn’t to say that a magical battle-axe isn’t faster than normal dagger, but it couldn’t be faster than a dagger with the same enchantments).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type = "displaytable" array ="descendantSizes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Some Umbrals and Nimbeds can completely alter the way that RT (and GRT work) be sure to check with your Referee.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It can be useful to keep track of these Reaction Times with poker chips (use Red Chips for RT). After a Descendant or Annex takes an action take a number of chips equal to its RT – less any paid off with cards of course (we suggest using different colour chips for normal RT and Global RT).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each phase where you don’t use that Descendant or Annex you can discard a chip from its stack. You may discard RT chips even if you are in GRT or Shocked.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can reduce Reaction Times on individual actions by paying Pips from cards during an Action or Half-Action i.e. When playing 3 cards using his ‘Dark Magic’ power Nigel the Necromancer uses one of the cards (a 5 of Diamonds) to reduce the Dark Magic RT by 5.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once an Annex or Descendants RT has been reduced to zero it can be used in a Full-Action again.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule: </strong>It is possible to use an Annex or Descendant that is in Reaction Time, but only by the Character or Descendant taking Stress equal to the remaining RT. This can create a more realistic, gritty feel to Ordeals. As it has a less gamified sense of time, however this will accelerate Drama within a Plot while also forcing more rest periods on the Characters to cope with the higher Stress. This rule can be simplified for speed of play to Characters or Descendants take Stress equal to the half the RT and ignore Reaction Time rules otherwise, however this variant does reduce the tactical options available to Players.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4 id="grt">Global Reaction Time</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Global Reaction Time (GRT) is a more powerful form of Reaction Time that rather than stopping an Annex from being used stops a Character or Descendant from taking any actions (Full or Half). You cannot draw, or play, any cards while you have Global RT chips (and technically cannot roll dice either without straining). Passive Annexes as well as armour (Rook Incarna) Descendants may still act independently to draw/play cards and soak wounds in GRT.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Global Reaction Time is related to Shock and the Stunned result of a Shock Dice being rolled creates GRT that is unrelated to the Character’s own Actions. Similarly Shocking attacks (amongst others) can also apply GRT to a Character or Descendant before they have acted.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It should be noted that GRT chips affect only the Character or Descendant that has them. If you use a Power-based Blaster Rifle’s “Scope” Talent, then the Descendant draws RT chips equal to Scope RT and 1 GRT. The Rifle may not be used again until the GRT is paid off. The character holding the Rifle may still take actions.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Generally the GRT of any Action relates directly to the number of cards that it may play simultaneously (or the type of Annex, see <a href="annexcards">table</a>). Particularly large Reaction Times (on a powerful Descendant usually) and some Umbrals can affect the GRT of an action.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> You can reduce the GRT of an Action with cards, just like RT. A chip (or point) of GRT costs 5 Pips to pay-off this way though, so a Joker is required to pay off three chips of GRT simultaneously. </p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div id="annexcards" class="t13ne-tablewrap">
<table class="t13ne-table">
<thead>
<tr>
<th>Type</th>
<th>Global RT / Extra Cards playable</th>
</tr>
</thead>
<tbody>
<tr>
<td>Skill, Skill-type descendant or light Prop (e.g. Dagger, Pistol or Wand)</td>
<td>0</td>
</tr>
<tr>
<td>Talent, Talent-type descendant or Average Prop (e.g. Sword, Submachine Gun or Staff)</td>
<td>1</td>
</tr>
<tr>
<td>Power, Power-type descendant or Heavy Prop (e.g. Warhammer, Rifle or Tome)</td>
<td>2</td>
</tr>
<tr>
<td>Super-Skill, Super-Skill Descendants or Very Heavy Prop (e.g. Halberd, Cannon, etc)</td>
<td>3</td>
</tr>
<tr>
<td>Super-Annexes, Super-type Descendant or Ridiculously Heavy Prop (e.g. Anime Warhammer, Siege Engine, Battering Ram)</td>
<td>4</td>
</tr>
</tbody>
</table>
</div>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Note that the GRT is equal to the <em><strong>extra</strong></em> cards played. A Facet plays 1 card and so does a Skill, neither incurs a GRT penalty. A Super-Power on the other hand plays 5 cards, with those 4 extra cards having a 4 GRT cost.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is worth noting again that a Character or Descendant can act during GRT, but only by spending Stress to roll Strain Dice and then Draw and Play as usual. This action does not generally create additional GRT, and any cards Played as a result can be used to cancel GRT or RT as required. If the Annex Strained is also in RT then it will also generate Stress. Because of this it is possible for an action in GRT to Shock the Character or Descendant and thereby end up deeper in GRT afterward.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>What can you do with a Half-Action or Action?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Half-Actions consist of either drawing a card or playing a single card (although it is possible that a Trick or Reserve Pool may allow additional cards to be played). Actions can draw and play one or more cards, sometimes allowing multiple simultaneously <em>actions</em> such as:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Moving</strong> — Movement around the Location or Stage (positioning for an attack is a good example). Movement works much like Range (see <a href="/actions-spaces/">Action Spaces</a> and <a href="/ordeals/">Ordeals</a> for Rules), depending on the type of motion that you engage in and the terrain you move through.[t13ne type="table" array="ordealTerrain" /][t13ne type="table" array="ordealMotionType" /]</li><li><strong>Prepare</strong> — You can Prepare any sort of action, playing a card turned sideways is how we show that. When a card is prepared you usually say what that Preparation consists of (or what it is for) and into which Style Reserve you are Preparing it. <br>For example playing two fives, you might say that you are dropping to the ground and sighting on the enemy, using your Tactical Reserve, which would allow you to use the Prepared cards on your next shot, as a Prepared Defence if you are attacked, to Hide, or to break and run if necessary. Alternatively, maybe you would play to your Aiming Style Reserve, which you can only use to attack, but can hold over the end of the Round. As well as Preparing Cards you can prepare Pips, Rolled Score, or unrolled Dice into the Reserve (which can be helpful to not Draw too many cards at once).</li><li><strong>Deal with an Obstacle</strong> — Obstacles get in the way. Some are dangerous Traps, or slippery floors, but some are no more complicated than a closed door.<br>Obstacles can be strewn around the Stages, placed in the middle of the Stage, or separating the Stages from each other. <br>If the Obstacle is obvious then it should be described by the Referee (or Yarn-Teller) to the Players when they enter the Stage. If it isn’t obvious then the description should contain some hint, for example a decapitated skeleton in the middle of the room, or broken arrows against a wall, or small holes in a fresco.&nbsp;<br>Obstacles are defined by a card that sets the type of Obstacle, and then 1 or 2 Difficulty cards (they are added together to create the Pips Difficulty).&nbsp;<br>Hidden Obstacles are more complicated, and can require the Yarn-Teller to call for a "Spot Hidden Obstacles" Key Test, or a passive Key Test. Traps usually have a hidden trigger as well as the hidden Trap, although occasionally a trigger may be more obvious or more hidden than the actual trap.<ul><li><em>Spot the Obstacle</em> — The Characters can declare that they are searching for Traps (and their Triggers, which are more often hidden) or something similar ("I’m scanning the room with my Multi-corder / Cybernetic Eye / Eelafin Senses / etc"). This should generally be prompted by some detail of the narration (such as the headless skeleton). <br>They then play a card to spot the Obstacle, the Obstacle can draw a card to represent how hidden it is. <br>Hearts are the Trump for Hiding, Spades for spotting and each adds +2 Pips. <br>Characters may Spot Obstacles automatically if they are Walking or Crawling (rather than running) at lower Stakes, or if they Prepare an Attack, Defence or movement that will pass through, or near, the Obstacle. Alternatively, the Yarn-Teller can make a passive Key Test for all the Characters and Narrate what they see appropriately. At the very least there should be some indication that there is potential danger present in the description given.</li><li><em>Pass the Obstacle</em> — If the Obstacle is visible simply play a card (or cards) that matches suit (with at least one card) with the Obstacle type and the Difficulty Pips. You have to beat the Pips if you cannot match Suit.&nbsp; This allows you to Pass the Obstacle, without triggering or engaging with it.<br>In the case of a hidden Obstacle, this is the point where the Yarn-Teller must narrate the action, explaining that the Character hears a "Click" or feels a trip wire against their leg, or feels the flagstone drop. They may even ask what they want to do next. Players may be able to play a card to describe their action, such as raising their shield (Prepare a defence), dive aside (usually with Diamonds), then the trap triggers. The Player action may help, or hinder them as the Yarn-Teller narrates that the floor they run on suddenly turns slippery, a bang goes off, the floor falls away, or the Character runs into the glass, or whatever is appropriate for the Obstacle. Then the Obstacle cards are usually revealed, as any Wounds are summoned, or a way around is achieved.</li><li><em>Disable the Obstacle</em> — To disable an Obstacle (so that the door is unlocked, held open, or the Trap is no longer dangerous) you should beat the Difficulty Pips twice over, and must match Suit (or Trump) with at least one of the cards you use. To randomise the pass amount the Yarn-Teller can modify the Difficulty Pips by +1d6-1d6.<br>Although, of course it isn’t strictly necessary to disable the lock in the door if you just hold it open after passing, so use some sense here (or make wedging or opening&nbsp;a door a Disabling Test).</li><li><em>Failure to Pass</em> — If you can’t scrape enough Pips together then you cannot move through the Obstacle. In the case of a Trap (and some of the others too) the Obstacle will Wound (or at least try to) those who cannot pass it, usually, or at least those who try to pass it and fail (they fall through the trapdoor).&nbsp;Now they may try again, or more normally someone will have to Disable the Obstacle (wedge the trap door open and dangle a rope into the pit).</li></ul></li><li><strong>Beat the Stage Diff</strong> — Passing the Stage Difficulty is what the Stage is often all about. So, of course, a Character can play cards towards defeating the Stage Difficulty. <br>Stage Difficulties do not require specific Suits, but they are often Trumped by a specific Suit. See <a href="#trumps">Trumps</a>. <br>Stage Difficulties can usually vary from a single card up to 3 cards (2 - 45 Pips), and are set by the&nbsp;Yarn-Teller (or Referee), some exceptionally complex Ordeals may even have higher Difficulties.</li><li><strong>Attack</strong> — You can play any card (or cards) to attack another Character or Descendant. <ul><li>Each Facet has its own preferred attack, and the Attacks of the Suits reflect that. [t13ne type="facetsuitaspect" suits="all" aspect="Attack"] </li><li>The Spades Trump can make every sort of Attack and all Spades have a +2 Pip modifier when attacking. </li><li>You can read about how Wounds are Summoned, created and applied in the Wounds Rulepage.</li></ul><ul><li>Resource Attacks are covered on the Alternate Ordeals  Rulepage. </li></ul></li><li><strong>Defence</strong> — You can also play cards to defend yourself from attack. Card defences also vary by card Suit as you can see on the table in the <a href="#trumps">Trumps</a> section. The types of defences and how they work are shown here. [t13ne type="attacktable" attack="Defence_Modes" /]</li><li><strong>Healing</strong> — During most Ordeals you have to rely on Narrative Healing, which can be quite limited, unless you have some sort of magical healing, hyper-medicines, or accelerated regeneration. See the rules on <a href="/wounds/">Wounds</a> for more details.</li></ul>
<!-- /wp:list -->'),
array('RulePage'=>'Ordeal Stages','Description'=>'<!-- wp:paragraph -->
<p>T13 uses Ordeals to model complex situations and combinatory Tests, especially combat scenarios, complex social interactions and Descendant Creation Ordeals.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>We break Ordeals down into Stages in a number of different ways depending upon the needs of the Narrative, the type of Ordeal and the expectations of the Characters and Players.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Stages and Ordeal Types</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Stages are arranged in various configurations by Ordeal Type.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealTypes"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The Stages of an Ordeal can represent a number of different things, depending upon the type of Ordeal that is being represented. These include:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Geographical Locations: Each Stage can be a room in a dungeon, a town on road, or a path through a forest. In this case, crossing the Stage (to pass to the next one) requires beating the Difficulty of the Stage, and represents the Difficulty of crossing a street, walking up hill, climbing a cliff, surviving a fall, etc.</li><li>Procedural Point: Each Stage can be a point of procedure in a Method or process. In this case the Difficulty of a Stage must be beaten before the Character can proceed to the next. For example, The Scientific Method can be represented by 5 Stages (although you can break this into finer Stages also if required) each Stage having its own Difficulty.<ol><li>Formulate a Question on a Topic — this will include researching the Topic to see what is known about it. (e.g. If you are trying to cure a disease you should research everything known about the disease to) </li><li>Create Hypothesis / Identify Variables / Make Prediction — The Hypothesis is a conjecture based on all the available knowledge.  The variables are measurable data that you can compare. The Predicition is the result that can be expected if the Hypothesis is proved E.g. You might conjecture that Vitamin D will disrupt the virus, the variables would then be, the rates of illness in the population and the levels of vitamin D in that population, and the rates of survival and recovery. The Prediction being that those with higher Vitamin D are more likely to have better outcomes.</li><li>Test Hypothesis / Conduct Experiment / Gather Data — This is often considered the most important step (usually by non-scientists although some scientists can feel this way too), and often can even be an Ordeal in its own right, as the experiment has numerous steps and operations that could be Stages in their own right. E.g. You may need to draw blood, inject meds, conduct scans, monitor temperatures, heart rate, blood pressure, vitamin levels, or a host of other complex procedures.</li><li>Analyse Results / Data — This is sometimes considered the most important step (usually by scientists as they feel this is where the real science happens, proving or disproving the hypothesis), and again could be broken into smaller Stages or even a separate Ordeal. This can be a complex statistical analysis of thousands of Test results, or it could be a detailed study of a single result. </li><li>Communicate Results / Write Paper — This is actually the most important step in the scientific process, although it is often forgotten, as it is through communicating these results that science as a whole grows. Your paper is added to the body of knowledge on the topic and adds more information to the available research for the next question that is asked. </li></ol></li><li>Psychosocial Stages: Sometimes the Stages can represent Psychosocial states such as emotions that a Character will experience while in that state. In this case the Difficulty can represent the complexity of a particular emotional or social state, such as maintaining a calm exterior while being harassed. Psychosocial Stages are often arranged in quite unusual ways, the emotion of Sadness for example, is usually placed closer to Happiness than Love or Anger, although there is no reason that all emotional states could not be one step from each other in a network.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Stage Difficulty</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Stage has a Difficulty that is set usually between 2 and 45 (1-3 cards). Stage Difficulty is usually considered in Pips or Chi, rather than Score or Sway. But you can convert between the two as required.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Perhaps for example when considering Item Creation a Character may design a new Descendant that has a total Score cost of several hundred Chi. This would be impossibly expensive to buy, and incredibly difficult to obtain with a single roll. However, an Ordeal can break this cost up, often the simplest way to break up an Item Creation cost is to calculate a sensible number of Stages and Difficulties for each Stage, by finding the factors of the Difficulty. This, combined with the idea that Stage Difficulty can vary between 2 and 45, gives us some ideas of around where to look.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If we have a Difficulty of 242 for example, has factors of 11 and 22 that could work, with 11 Stages with a Difficulty of 22 each. Although, typically you would not want each Stage to have exactly the same Difficulty and you may wish to reduce the number of Stages and raise the Difficulty. Differing arrangements of Stages can let a Character shortcut their way through an Ordeal with a lower Difficulty than might be expected if the Yarn-Teller or Referee arranges the Stages correctly.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can also offer different paths through the Ordeal, based on how different Stages go as not every Ordeal has to be a railroad.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Describing the Stage</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is usually the Referee or Yarn-Teller’s job to describe the Stage as the Characters enter it.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Stage is a Location, then the Referee/Yarn-Teller should describe the physical attributes of the Location. How does the Location look? Does it smell of anything? What can the Characters hear? Is there weather? Is it warm, cold, damp, what do the Characters feel? If there are Psychology effects involved, what else might the Character sense?</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Location has a large Vegetation Annex, for example,<p>If the Location has a large Vegetation Annex, for example, then describe the scents of the forest, hints of pine, damp rotting wood, crisp floral hints and distant perfumes, sunlight is dappled by the susurrating leaves and the shadows stir and dance with the wind.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When the Stage is not a Location, but a step in a procedure or a similar event, then the Referee/Yarn-Teller will still be required to provide Location information about where the Stage takes place, but more importantly they must explain the Stage requirements to the Players. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, when beginning an Descendant Creation Ordeal, the Referee/Yarn-Teller may describe the first Stage as Preparation, and explain that the work space needs to be cleared, the second Stage may require the materials to be gathered, or for a design to be made. Eventually the Referee/Yarn-Teller may be describing how the "Flangelhoop" is too tight, and they need to "Ramajack" the "Throtweebler", or whatever.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Ordeal Stages and Tide of Battle</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>During combat based ordeals you can use the Tide of Battle rules to add complications and twists to the combat. Each Round one side will be able to claim that the Tide of the Battle is Flowing with them. This allows the Yarn-Teller or Referee to affect the Stage of the Ordeal with a Tide of Battle Ordeal card. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tide of Battle cards can have various effects, but usually boost the abilities of the Flowing Side against the Ebbing Side, although they can alter the situation radically including changing the Tide of Battle so that the Ebbing Side Flows next and vice-versa</p>
<!-- /wp:paragraph -->
'),
array('RulePage'=>'Narrative Tricks','Description'=>'<!-- wp:paragraph -->
	<p>During a card Test or Ordeal if a Character plays a special Trick there are specific Narrative results that may result.</p>
	<!-- /wp:paragraph -->
	<!-- wp:heading -->
	<h2>Narrative Tricks</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph -->
	<p>The type of Ordeal Tricks that a character can play on another vary with the number of cards that can be played, and can unlock types of Narrative Tricks.</p>
	<!-- /wp:paragraph -->

	<!-- wp:shortcode -->
	[t13ne type="table" array="narrativeTricks" /]
	<!-- /wp:shortcode -->

	<!-- wp:heading -->
	<h2>Narrative Trick Types</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph -->
	<p>The Tricks can unlock different types of Narrative effects which can have the following effects.</p>
	<!-- /wp:paragraph -->

	<!-- wp:shortcode -->
	[t13ne type="table" array="narrativeTrickTypes" /]
	<!-- /wp:shortcode -->

	<!-- wp:heading -->
	<h2>Sets</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph -->
<p>The types of Narrative that Narrative Tricks can tell with Pairs, Sets, Wildsets and Nth-of-a-kind Tricks can be further limited by the card that is being played. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This limitation is usually based upon what the signification of this set is. For example if a Trick is a Set of 2s this would emphasise Conflicts, Opposition and Choices during the Karmic Shift that is created. This is usually based on the Face Value of the card (although Trumps can match at +2 Pips if the Yarn-Teller allows it, but they then act as that Face Value, e.g. a Trump 10 is the same as a None-Trump Queen although this tops out at the Ace).</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div id="cardsetmeaning" class="t13ne-tablewrap">
<table class="t13ne-table">
<thead>
<tr>
<th>Card</th>
<th>Narrative Meaning</th>
</tr>
</thead>
<tbody>
<tr>
<td>2</td>
<td>Twos signify conflict, opposition and choices. They can indicate crossroads, partings, separations, and changes of direction.</td>
</tr>
<tr>
<td>3</td>
<td>Threes signify creativity and and communication. They can indicate hope, imagination, inspiration and conversations.</td>
</tr>
<tr>
<td>4</td>
<td>Fours signify stability and foundations. They usually indicate some foundation, whether an organization or a building, that may have its foundation weakened, damaged or strengthened by the narrative.</td>
</tr>
<tr>
<td>5</td>
<td>Fives signify change and challenges</td>
</tr>
<tr>
<td>6</td>
<td>Sixes signify harmony and adaptation, but they can also indicate hard work or unexpected challenges.</td>
</tr>
<tr>
<td>7</td>
<td>Sevens signify surprises, whether in the sense of conspiracy, illnesses and light hearted fun.</td>
</tr>
<tr>
<td>8</td>
<td>Eights signify karma and mostly in the form of karmic retributions, if someone has been having a bad time now is the time they will be rewarded, if they have been running amok they will now have to pay that price.</td>
</tr>
<tr>
<td>9</td>
<td>Nines signify fortune, monetary rewards and cash prizes.</td>
</tr>
<tr>
<td>10</td>
<td>Tens indicate a completion, whether the actual end of the story or the end of a character or phase.</td>
</tr>
<tr>
<td>J</td>
<td>Jacks signify youth, high spirits, parties, quarrels, protection, privilege and disagreements.</td>
</tr>
<tr>
<td>Q</td>
<td>Queens signify an older female, matriarchy, scandals, social events, curiosity, love, wisdom, sinister manipulations and betrayal.</td>
</tr>
<tr>
<td>K</td>
<td>Kings dignify an older mature male, the patriarchy, business acumen, wisdom, knowledge and good advice.
</td>
</tr>
<tr>
<td>A</td>
<td>Aces signify beginnings, meetings and unions. They can indicate love-interests, chance encounters, alliances, and friendships.</td>
</tr>
</tbody>
</table>
</div>
<!-- /wp:html -->

	'),
array('RulePage'=>'Social Ordeals', 'Description'=>'<!-- wp:paragraph -->
<p>Social Ordeals are how we track things like levels of friendship, enmity, first impressions, persuasion, lying through your teeth and getting away with it, and even emotional attacks and Psychological aspects of  the interactions between Characters in the world. Often Characters that could be friends will be pitted against each other by circumstances of a Narrative (such as them being Rivals or Foils), or natural enemies may be forced to work together due to a common threat, but either way, eventually the Personalities and Geometries of the Characters may overcome these Narrative Problems and they will revert to form.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Impressions</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we track character interactions via the use of a sliding scale that we call Impressions. When two Characters first meet they create an immediate Zeroth Impression. This Zeroth Impression is then modified by the Social Ordeal Rules during the Scene where they met to create the Character’s First Impressions of each other. Impressions are usually measured using the Social Ordeal Level scale. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>As well as that First Impression, which Character&#39;s will usually keep, they will also have a Current Impression. This Current Impression can differ greatly from the First Impression, and can replace the First Impression if it is sustained for long enough. For example, while two Characters may have a First Impression that each other is "Someone to talk to" if one of them is a jerk during all their interactions, while the other is generally nice, then these Current Impressions may eventually change, with the Jerk finally deciding the other is actually Someone Interesting, while the other Character comes to think of the Jerk as well "A bit of a Jerk" (or something worse).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This occurs when the Current Impression is at least two or more levels above or below their First Impression, whatever that may be, for at least three Scenes where they interact. </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Geometry and Zeroth Impressions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>First Impressions in T13 are Character reactions to another Character and are governed initially by Character Geometries (note that each "Also Known As" alternative name that a Character has, will have its own Geometry. In some cases these Nominative forms will have completely different Geometries, but these names are all for the same person ...)</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="name" name="Robert" /]
<!-- /wp:shortcode -->

<!-- wp:shortcode -->
[t13ne type = "name" name="Bob" /]
<!-- /wp:shortcode -->

<!-- wp:shortcode -->
[t13ne type = "name" name="Bobby" /]
<!-- /wp:shortcode -->

<!-- wp:shortcode -->
[t13ne type = "name" name="Rob" /]
<!-- /wp:shortcode -->

<!-- wp:shortcode -->
[t13ne type = "name" name="Robbie" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Robert and Bob are the same person, but those who call him Robert (perhaps in work) see him as a Square, a hard-worker but pretty boring. his Friends see him as Bob or Rob depending when exactly they met him and as a Half-Moon, an intuitive type, or even as a bit Psychic (if Bob is more Undecagon), his family call him Bobby and see him as a risk-taking Pentagon, in his own mind he calls himself Robbie and sees himself as a Circle, a creative loner.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You should note that each Character has a number of Harmonics and Dissonant numbers that affect them personally. Robbie is Harmonic with Geometries 1, 3, 5, 6, 8, 10, 12, and 13, but Dissonant with 2, 4, 7, 9, and 11. This indicates that the Robbie persona may not get on too well with the Bob and Rob personas. This effect can be compounded the other way, but in this case does not, although you can see something occuring in Bob and Bobby where they are both Dissonant with each other. This can be used by the Yarn-Teller to create stories that pit "Robbie" against "Bob" or "Rob" somehow, or simply mix Bobby’s old school friends with Bob’s friends to highlight those differences. To really create some trouble and Stress for the Character invite all of his Friends and work colleagues to one party.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Geometries are more complicated than a simply Geometry, Characters also have a Soul Geometry (calculated by removing all the vowels from the name). Characters are drawn towards this Soul geometry, granting them a Success Level whenever they interact with them, and to that Geometry when they interact with them.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In addition to the main Geometry a Character also has a Facade that they maintain, which is calculated from the Character’s name with all the consonants removed. This Facade behaviour can be complicated with a Character maintaining a separate Facade to their normal Geometry and Soul Geometry, or their Facade may match their normal or Soul Geometry. We refer to the first as "Geometry Masking" and it often makes the Geometry that you are masking as uncomfortable (adding a Failure Level). However, those who Facade as a Geometry are drawn towards that Geometry and therefore that Geometry will have a Success Level affecting the Facading Character. This effectively complicates Zeroth Impressions, depending on the Character’s Geometry Masking.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In general, when dealing with Harmonics and Dissonants you deal with Impressions (what the Character thinks of a Character of that Geometry) and Reactions (what those of that Geometry think of the Character back). Positive Impressions and Reactions add Success Levels, negative Impressions and Reactions add Failure Levels instead.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You might notice notice that amongst the Harmonics and Dissonant Numbers there are some special numbers, such as Perfect Harmonics, Wolf Harmonics, Sustained Dissonants and Nemesis Dissonants. These have more profound Impressions and Reactions, that stack on top of the normal Dissonance or Harmony. It is actually </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="numberTypes" title="Harmonic Types"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>So let’s consider the various Roberts (we can simplify and decide which Bob, Rob or Robbie is turning up) meeting Mary. We can use impressions to see what Mary thinks of the different Roberts, and what Bob or Rob think of Robert, Bobby, etc. We can say for example that practically psychic Bob and more down-to-earth Rob each pick 11 and 2 respectively.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="impressions" names="Mary,Robert,Robbie,Bob,Bobby,Rob" geo="8,4,1,11,5,2" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Depending how Mary is introduced, she could have a very different experience. Under most circumstances, however Robert is introduced, Mary will be at least polite back. The various Roberts though are a different story. Introduced to the almost psychic Bob (11/7/4) he will be cautious of her and she will be polite back to him. If she is introduced to Rob she is sincere, but he is only polite back, and if she had met him as Bobby in school, Bobby would have been sincere to her, but she would have only been polite to him.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Let’s consider a second situation, where Mary meets a new group of people without Robert. This small group includes Suzanne, Jaques, and Darryl.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="impressions" names="Mary,Suzanne,Jaques,Darryl" geo="8,8,2,4" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Jaques likes pretty much everyone, he trusts Mary, and she is affectionate back, but is cautious around Suzanne as she has an aversion to him. Darryl on the other hand, disapproves of both Mary and Suzanne, and they are distrusting or disapproving back, but he thinks affectionately of Jaques, who is only polite back. Suzanne is very much the outsider, disapproving, distrusting or having an aversion to all the others.</p>
<!-- /wp:paragraph -->


<!-- wp:heading {"level":2} -->
<h2>Social Ordeal Actions</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 there is no limit to what sort of social actions you can make, but there is a list that should get you started. On the Table below you will see Types of Actions available, along with the suggested Facets that they should use for those Actions, as well as a Description of what is likely to occur. In general, Social Actions will always impact both Characters, altering their Current Impressions of each other away from the Zeroth Impression each time.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="socialOrdealActions" title="Social Ordeal Actions" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Social Ordeals can create Psych Effects, Wound Characters, and move a Character in Psychosocial spaces. In fact, Social Ordeal Levels are a Psychosocial Action Space that manages the network of interactions between Characters. With a Success Level improving the Impression, and a Failure Level reducing the current Impression (typically, it is usually assumed that you want people to like you). However, Social exchanges can move a Character in multiple Psychosocial Spaces simultaneously. It should also be noted that although a Social Ordeal Action specifies that it can improve an Impression by +5 Levels, this would usually require 5 Success or Failure Levels to achieve, although Yarn-Tellers, Players and Referees can agree that for example a single Blackmail Success or Failure could have a -5 Level effect this would be unusual, as usually the Blackmail effect itself could require the Success Levels to not be dismissed as a joke.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Social Ordeals in Diverse Psychosocial Action Spaces</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 Characters are complex beings, not only is a Character a person, who has a (admittedly imagined) physical existence, but they also have a Psychosocial existence that is largely unconnected to their physical form. Sure, when they are awake, focused and performing complex physical tasks then they are perhaps completely connected to their physical existence, but the moment they remember a memory, think about a lover, or have a conversation with another Character, they are making Actions in a Psychosocial space. Now every Character has their own mindscape, which is their unique Psychosocial space. In T13, this Psychosocial space can be explored, delved into, so we can learn more about Characters by exploring their mindscapes, where the Character\'s inner-self can move around inside their own mindscape.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This isn\'t perhaps as strange a concept as you may think. Our conscious mind, may focus on our perceptions, emotions and feelings while we watch a film, then think about the ramifications while chatting with friends, moving to memory to recall specific scenes or lines that were watched, and perhaps into daydreams and fantasies that are conjured in the imagination as the friend suggests another way the movie could have gone. These are all movement within the Psychosocial Action Space of the Character’s mindscape.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There’s more going on than just what the Character is experiencing in their own mindscape, after all each other Character is moving around in their own mindscape while experiencing the physical world as well (also simulated in the game). Simultaneously each Character’s Impressions are constantly altering, and there will be additional Psychosocial Action Spaces that the Characters may also be working through, such as within their workplace social structure, or through mindgames the Villain is playing with them.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Mindscapes and Eidolons</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Within a mindscape (or any similar Psychosocial Spaces) you will encounter a genius loci for that space that is known as the Eidolon. For a Character their Eidolon is a representation of the Character\'s Gestalt (the sum of all their Alts and mental figments), this means that while the Eidolon contains an aspect of the Character\'s inner-self, it is not directly controlled by that inner-self. Think of the Eidolon of a Psychosocial space as almost a Dungeonmaster character, who builds and maintains the Psychosocial Space, and typically has reasons for keeping aspects of themelves apart, such as not allowing their inner-self access to their own traumatic memories. The Eidolon is both the Character and the mindscape they inhabit, and has different goals and objectives to any of the individual components of the Character. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Within the Psychosocial Space that the Eidolon controls, it is usually considered the most powerful being, often having an aspect of a lesser Divinity, exactly like a "real" space may have a "real" Genius-Loci, which is effectively a "small-god" or lesser divinity, or a time period may have a zeitgeist, or spirit of the age. Eidolons can be confused, misdirected, hidden from and overpowered occasionally, especially by Characters such as powerful Psychics, other lesser and greater Divinities or Demonic entities, but such effects should be difficult to achieve (or be important to the Plot, I guess). Eidolons are typically considered to be a Super-Value version of the Character within their own Psychosocial Space, but can be calculated as a full Gestalt if required (although the full Gestalt will normally have a lower power-level than the assumed Super-Value normally). More complex Psychosocial Spaces may include Eidolons that represent the full Gestalt personality of every member of the Pact or Space. Such Eidolons are best thought of as a collective spirit, patron deity, or similar rather than as an actual Character.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="EidolonTypes" title="Social Ordeal Levels" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Social Ordeal Levels</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Impressions are one continuous aspect of all Social Ordeal Psychosocial Action Spaces. In a Psychosocial Action Space that holds multiple people and how they interact with each other, the Lines that connect the Characters are each holding that Character’s Impressions of each other. These Impressions are actually only one aspect of what we call the Social Ordeal Level. Each Level has an Impression associated, a name for that Type of Level, a description of what that means, and the most likely results of a social exchange with a Character that holds this Impression of you.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Typically altering a Character’s impression of you by a Social Ordeal Level requires at least one Success or Failure Level. However moving more than one Impression Level is possible with additional Success or Failure Levels. Typically the number of Success or Failure Levels Reduced will indicate a suitable number of Impression Levels. This means that for two brothers with a Kinship Impression of each other to come to actual Violence Social Ordeal Level within one exchange would norally require 131 Success or Failure Levels.</p>
<!-- /wp:paragraph -->


<!-- wp:shortcode -->
[t13ne type="displaytable" array="socialOrdealLevels" title="Social Ordeal Levels" /]
<!-- /wp:shortcode -->



    '),
array('RulePage'=>'Alternate Ordeals', 'Description'=>'<!-- wp:paragraph -->
<p>Ordeals (with their Stages, Rounds and Phases, and card play) are a quite complex part of the game, and a strong combination of the crunchiness of simulation play and the flexibility of free-form narrative play, but they don’t suit every Player, or every situation. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For these reasons we offer up some alternative ways of handling Ordeals that can be used instead of, or alongside, a standard Ordeal. Of course, these additional Ordeal types are purely optional, but can be very useful for certain situations and genres as they have a very different game-feel.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Snap-fire Ordeals</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Snap-fire Ordeals are a variant of normal Ordeals intended for high Suspense and Open Conflict scenes. Snap-fire Ordeals can take place as part of a larger Ordeal, and are often handled alongside them, often a Snap-fire Ordeal is ideal for rapid action scenes, like the most dangerous Stages of a chase, or a last ditch battle. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During Snap-fire Ordeals normal player Actions are limited by a single card called the Snap-fire card. Generally, only one Character gets to perform a Full-Action in each Phase, but all Characters get to take a Half-Action instead.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Snap-fire card is turned at the start of the Phase, and controls play during that Phase. Which Character gets to perform a Full-Action is chosen by a bidding system.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Snap-fire bidding works according to Phase Order Initiative System (POIS) and Tide of Battle as follows:<ul><li>Sweeping spotlight POIS, the next three Characters on the Flowing side get to bid on the Snap-fire card, which moves around the group with each Snap-fire card. Two Characters from the Ebbing side also get to bid, and they will also cycle around.</li><li>Yarn-Teller Directed POIS, the Yarn-Teller picks who gets to bid. Usually at least one Character from the Ebbed side should be allowed to bid, and most of the Flowing side.</li><li>Ordeal Pool POIS, Characters may bid if they have more cards in their Ordeal Pool than half the Snap-fire card Pips when Flowing and more cards than the Pips when Ebbed.</li><li>Card POIS (Recommended for Snap-fire), Characters may bid when they have Initiative cards with more Pips than the Snap-fire card Pips Reduced when Flowing and the Snap-fire Pips when Ebbed. </li><li>Scored POIS, Characters may bid when they have a Score of Twice (&times; 2) the Snap-fire card\'s Reduced Pips when Flowing and Twice the Pips when Ebbed.</li><li>Pay Sway POIS, Characters must pay a blind of the Snap-fire card\'s Pips Reduced in Sway to buy into the bids when Flowing and all the Snap-Fire Pips when Ebbed. This can be added to all other modes to allow all Characters to bid. </li></ul></li><li>Bids may be made in:<ul><li>Sway: Specific Facet Sway, Chi, Yarn or Twists (Yarn Reduced) may be used to bid. Bids must be paid before the attempt can be made.</li><li>Success Levels: Bidding Success Levels is a bet that you will get a certain number of Success Levels, the highest bid wins. Failure to reach this number of Success Levels means Snap-Failure.</li><li>Failure Levels: Bidding Failure Levels adds that number of Automatic Failure Levels that must be overcome to succeed.</li><li>Wound Limits: Bidding Wound Limits set the Wound Limits for the cards that will be played, betting Mortal, for example, states you will try to create or will take a Mortal Wound. The Wound Pips must be paid for this level of Wound at the current Stakes, with the Full-Action, or Snap-Failure occurs.</li><li>Relative bids can be calculated from Sway, using the Sway Table, the highest bid takes the Snap-fire card, adds it to their Ordeal Pool, and pays their bid.</li></ul><ul><li>They may then take a standard Full-Action, the Snap-fire card counting as one of their card draws. Umbrals should now be paid. Failure of Umbrals causes a Snap-failure.</li><li>All Characters that lost the bid may now take a Half-Action (they do not have to pay their bid) usually in the Order of the bids.</li><li>Characters that didn’t get a chance to bid now may take a Half-Action in any order (but usually Flowing first).</li></ul></li><li>At any point during procedure, any Character who has a matching card (by Pips) in their Ordeal Pool, or a Style Reserve, to the Snap-fire card may draw the Snap-fire card and add it to their Ordeal Pool. This immediately interrupts any bids under way.<ul><li>The card must match Pips, and Colour and Suit may be used to break ties. E.g. If the Snap-fire card is the Jack of Hearts and Jim tries to claim it with a Jack of Clubs, Liz beats that with a Jack of Diamonds, but Dave beats even her with his own Jack of Hearts. Miscalling a Snap-fire action results in an immediate Snap-failure. </li><li>The Character may then declare a Half-Action (just keeping the Draw) or they may attempt a Full-Action, where they pay their Umbrals (or risk a Snap-Failure) and continue their Draw and then Play cards (that must include the Snap-pair, ideally as a Set) or take a Snap-Failure. </li><li>After their Action (Half or Full) a new Phase begins. Because of this kind Referees may ask for matches before resolving the POIS Order or determining Bidders, with a late call counting as a miscall. Less kind Referees may allow a call to take place even after the winning Bid has been played. Creating a Snap-failure on the Bid winner. </li></ul></li><li>After all actions in the Phase the Snap-fire card is replaced for the next Phase.</li><li>Referees and Yarn-Tellers can bid and match cards as NPCs just like other Characters. </li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Snap-Failure</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Snap-Failures occur when someone tried to claim the Snap-fire card and something went wrong. Maybe they miscalled Snap-fire and didn’t have a matching card, or maybe they didn’t make their bid (didn’t generate enough Success Levels, overcome the number of Failure Levels, or couldn’t generate enough Pips for their Wound Limit), or they failed their Umbrals somehow...</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Snap-failures are terrible turns of events that depend upon the Snap-fire card played and the situation. Generally, a Snap-Failure will drop a Character out of an Ordeal, causing failure and often injury, but sometimes they divert entire Plots, or corrupt Characters. Snap-Failure can create additional complications at almost any level, usually low-level complications affect Grunts, where as the greatest complications are created by Yarn-Tellers failing. The current Yarn-Teller or Referee may use the Snap-fire card as:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>... an Obstacle, created by the Character’s actions. The new Obstacle usually has a Diff equal to the Difficulty of the Snap-fire. A common and solid choice.</li><li>... a Yarn-card with the Snap-Failure causing a Snag, or Fray as required. This is usually reserved for Yarn-Teller Characters, but not always.</li><li>... an Unsoakable Wound taken by the Character (or one of their Descendants). Always a good choice, as accidents can always happen.</li><li>... as a Facet based:<ul><li>... Test: The Snap-Failure causing a new Test can be an excellent use depending upon the Facet, and is suitable for all Characters.</li><li>... Failure: A specific Snap-Failure can be great, but should not be forced if they don’t match the situation.</li><li>... Turn: A Snap-Failure can divert an entire narrative if it happens at the right time, good for Heroes and Yarn-Tellers, usually too powerful for Grunts.</li><li>... Narrative Moment: Narrative moments can make for a diverting failure, and are very good for Grunts, but are often not applicable to the current situation.</li></ul><ul><li>... Quest: Quests, especially small ones, can be great when a snap-failure happens, although they may not always fit the situation.</li><li>... Ordeal (Ordeals within Ordeals are not generally recommended but can work, occasionally).</li><li>... Twisted: Only Bids that used Twists should result in Twisted Snap-Failures, and not all bids that involve Twists have to, although they are often strangely applicable. </li></ul></li></ul>
<!-- /wp:list -->



<!-- wp:heading -->
<h2>Yarn-Tangling Ordeal</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Yarn-Tangling Ordeal is how T13 handles a Moderated Retcon situation, such as when someone travels back in time and changes the past, but not quite enough to completely alter history in between. Yarn-Tangling occurs when:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Two or more Yarn-Tellers disagree about something that should be an established fact (such as the name of the current or even last King or the funny quote from last year\'s hit comedy).</li><li>Anyone tries to time-travel to deliberately alter the past in some small but specific way, and especially to "correct" history after it has already been changed by a time-traveller (often the same time-traveller).</li><li>Two or more Yarn-Tellers disagree about the outcome of an event that is taking place, or may take place in the future, and spend Yarn to alter reality in direct conflict with each other.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Yarn-Tangling Ordeals almost always take place at Paradoxical Stakes, universes can be diverted, created and destroyed by Yarn-Tangling Ordeals, so Referees should always be paying careful attention.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Tangling Ordeals take place in an abstract manner, as the Yarn-Tellers (and perhaps Heroes) involved throw their will and Yarn into determining the nature of reality. Narration of this Ordeal is complicated as Yarn-Tellers are themselves battling mentally, magically, or technologically to literally control reality.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Character attempts to gain some modicum of control over reality, history, or the paradox. Differing aspects of reality are governed by the suits as detailed below.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Diamonds: What rumours, art, books, and movies exist about what happened. How do people imagine it? How was it glorified or explained away? What art or music did it inspire or create?</li><li>Hearts:What myths, jokes and lies are told about what happened. How do people try to forget it? How do people twist what happened and who does that twisting? What do the conspiracy theorists think happened and what lies do people believe really happened?</li><li>Clubs: What really happened there, what were the actual facts? Who profitted from the situation? Who did they profit off and what do those people think happened?</li><li>Spades: How things are perceived, or remembered. What do people think happened? What do the History books say happened? What is the general man on the street’s opinion?</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>All of this boils down to a special card Ordeal. This involves trying to control one of the suits of the cards at a time. This is usually decided by the Referee, with a suggested order of Clubs, Hearts, Diamonds and Spades, as this defines what really happened, how that was twisted and lied about, the art and cultural response that was created, before deciding from all that what the man on the street thinks about it all, but you can modify this order as you like to match the importance to the change in history.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>All competing Yarn-Tellers Draw 3 Cards to create a Yarn-Tangle Pool. </li><li>The Referee should turn over the top card of the deck to create a Discard pile if there is none.</li><li>Each Round every Character must try and get 3 suited cards with a total Pip value of exactly 31. Each Round they must try to get a different suit (but they decide in what order).</li><li>Phases involve each Character paying a Blind bet of 1 Yarn (paid in Chi); Drawing a card from either the top of the Deck, or from the Discard pile; adding it to their Yarn-Tangle Pool and then Discarding a card face up to the Discard pile. </li><li>During your turn instead of Drawing, you may attempt to Knock-Out another Character, this involves both Characters revealing their Yarn-Tangle Pool, and narrating their suggestion for the Retcon. The Challenged Character gets to make a Draw and Discard before they show their Pool automatically.</li><li>The Yarn-Tangle Pools are first compared by suits alone. If one Character has more suited cards (of any suit) than the other then they win, knocking out the other Character.</li><li>If both Characters have the same number of suited cards then Pips are compared with the highest (up to a maximum of 31) winning and Knocking-Out the other Character.</li><li>Knocked out Characters take their own Yarn-Tangle Pool as a 3 card Negative Emotion Psych Attack or as a Backlash Yarn Situation Spread as they prefer, and may not participate further in the Round.</li><li>If a Character has Yarn-Tangle Pool of 32 Pips or more during a Knock-Out then they are Bust. A Bust Character is Knocked-Out, and may not continue in the Ordeal at all.</li><li>After a Character is knocked out play continues, until all Characters bar one are knocked out, or someone get exactly 31 Pips on 3 suited cards.</li><li>If all other Characters are knocked-out then the survivor takes the Round in whatever suit they have most of.</li><li>At any time if a Character gets 31 on 3 suited cards they declare a Blitz. A Blitz ends the Round, and are counted towards deciding who wins the Ordeal overall. </li><li>The First Character to win 4 Rounds, one in each suit wins the Ordeal. However, if they win a Suit and then later concede that suit to someone else they must incorporate the ideas that Character promoted for that Suit.</li></ul>
<!-- /wp:list -->

	'),
array('RulePage'=>'Action Spaces','Description'=> '<!-- wp:paragraph -->
<p>When playing a game or writing a story we have to model the world of the Narrative. Events that take place in the universe of the story take place in this Narrative Space, every conversation, every exchange of Sway or Score. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Now when Characters are talking to each other and ambling around, we don’t need a very clear model of the space, but if someone decides to try and shoot someone, or dive for cover, or run up and brain someone with a frying pan, then we need a slightly more advanced Narrative Space, we call this Action Space.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Action Space can be defined in a number of ways, depending upon how simulationist you need to Action Space to be. Now, many may be quick to assume that more simulationist is better, but the simulation is generally of a physical space. Not all Action Spaces are necessarily physical, Psychosocial spaces exist beyond physical, such as dreams, mindscapes, friendship groups, and spiritual realms where a strictly simulationist Action Space will work against you if the space is inappropriate. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="actionSpaces" title="Action Spaces" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Terrain Types</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we classify the types of Terrain within the Action Space into one of 3 different physical types. This controls how we create Difficulties from Distances to give Range Diffs that are used in both ranged attacks and movement.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealTerrain" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h3>Terrain Modifiers</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Of course there is more to Terrain than just how open it is, and there are many factors that can affect Motion, Reach and Range within an Action Space beyond the Type. Typically we include the following as potential modifiers to the Terrain, which may alter the Difficulty to complete a specific Action in the Space.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealTerrainModifiers" /]
<!-- /wp:shortcode -->


<!-- wp:heading -->
<h2>Handling Range and Reach</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Ranged Actions, such as shooting a gun, always have an associated Cost. This cost varies with the type of Terrain and how the Action itself has been made. This is the Firing Type and modifies how Range Difficulties are calculated from Distances. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Similar to Range is also Reach, Reach affects melee attacks with long weapons in similar ways. Reach is usually measured as though the weapon is braced, although some circumstances such as trying to wield a long weapon with only one hand can make this the equivalent of Hip-firing.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealFiringType" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Reach and Descendants</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Reach mainly affects physical Descendants, although it is possible that an Annex may have a Reach, such as a cephalopods "Tentacles" Annex. It is more normal to give an Annex a Range if possible so that it can act at a distance, but Reach may make more logical sense in some circumstances. Generally, if a physical connection is made, that is Reach, not Range.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Usually a Descendant can only use its Master Annex when it is between Reach metres or Reach Pips distance to the target (although Sub-Annexes may be used at Yarn-Teller’s discretion). So a Two-handed long sword has a Reach of 3, this means it is intended to be used at most 3 metres from the target. Because 3 Reduces to 1 the long Sword can strike a Character a metre away in Confined situations, but it is not able to strike a Character with the Master Annex any closer than one metre.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In general, Reach is set when the Descendant is created and is tied to the physical size of the Descendant (as is RT and GRT). Reach can be increased and altered, by making physical changes to the Character or Descendant (tentacles can grow, or be cybernetically enhaced), but must reflect the actual physical size of the Character or Descendant. You can\'t build a sword that is a metre long, and give it a Reach of 4 metres, that just doesn\'t make sense.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is worth noting that Reach is affected by Size Annexes, a dagger built for a Kaiju is still hand-held for the Kaiju, although it would be a Kaiju-weapon for a normal Character. So a Descendant’s Size Annex when present will alter the actual Reach in metres. This is usually done by multiplying the standard Reach by the Size Score (Size Annex Boon Reduced) although Yarn-Tellers and Referees can make adjustments where required, if a giant robot Character has a giant Zweihander sword, it will probably be proportional to their own size, having a Reach around the robot\'s height at most.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="descendantSizes" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Reach Actions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When you are wielding a weapon, and you actually know how to use it, you can use that weapon in more tactical ways. More proficiency with your chosen weapon will grant you additional techniques, that allow you to use the weapon in more effective ways. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, a spear is a good weapon, especially for a battlefield, but once the enemy gets closer than the Reach, it may become difficult to use effectively, a master spear-warrior will know how to move and hold the spear, to bring the pointy end to bear on the enemy once again. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This holds true of any Descendant, and how Reach can be extended or contracted. It is worth noting that these Reach Actions are always affected by the Action Space and Terrain. Fighting in a busy melee for example, restricts Reach much more than fighting in a Closed or Open Space will. Using the right Action with the right weapon can effectively cancel the weapon’s Reach, allowing the spear-master to stab someone he is grappling, or giving someone skilled with a knife the ability lunge forward a few metres and connect.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="reachActions" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Handling Motion</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Character’s motion around the Action Space is of course important to how these games and Narratives play out. Whether it is a fight on top of a moving train or truck, a race through No Man’s Land, a swirling aerial combat on giant eagle or griffon back, or a space-flight along a surface trench to a bombable surface vent.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In T13, we utilise similar rules to how we handle Range to handle motion through the Space. Ordeal Motion is handled in cards and Chi or Ordeal Pips of Difficulty. Although, of course a rolled Score or Sway can be used as well, usually Zeal/Verve or Inertia/Endurance will count as Intrepid, but other Sway will not (assuming a physical Action Space rather than a Psychosocial one, in a Psychosocial Action Space almost any Facet Sway may be considered Intrepid, selected by the Space Author, Yarn-Teller or Referee). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Size Annexes also affect motion in T13, with the Size Annex generally adding the Size Score (Annex Boon Reduced) to the Pips of movement actions for exceptionally large objects. This is not particularly simulationist, but not many simulations will let giant radioactive dinosaurs stand, let alone walk along punching and tail swiping radio towers. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Typically Movement through a Space is considered in terms of the Metres that the Character wishes to traverse. This defines the Difficulty of the Action based on the Terrain Type and the Motion Type that is being employed. Consider Super-Greg, who got super-powers from ingesting a radioactive scotch-egg, he Plays a Jack of Diamonds (11 Pips) as a Movement Action: If he is Flying straight in Open Terrain that would count as 22 Pips of Travel, which would mean he moved 153 metres, but if he was trying to Crawl through a Confined Space he could use 11 Pips to defend or hide himself while he Crawled 1 metre. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealMotionType" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Tactical Engagement</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It can be useful, at the very least tactically, to consider how closely Characters are engaged with each other. This includes optional rules for handling disengaging an opponent that you are already engaged with.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Generally speaking, Characters who are rolling around on the floor grappling, probably need pulling off each other, and even then kicks and punches will still fly at their target. Meanwhile Characters who are being covered with a machine gun cannot just flee without risking being shot.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="ordealEngagementType" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>You can also read more about Psychosocial Action Spaces in their specific Rule page.</p>
<!-- /wp:paragraph -->

'),
array('RulePage'=>'Psychosocial Action Spaces', 'Description'=>'<!-- wp:paragraph -->
<p>In T13 there are numerous ways that we can model everything about a character, from their geometry, personality, persona, core, and I-Ching,  their hang-ups and problems in the terms of Hitches, their abilities in the form of Annexes, knowledge in the form of Proficiencies and Descendants which can also model the character&#39;s possessions, vehicles, weapons, tools, pets and allies, however perhaps the most powerful tool for working with characters are Psychosocial Action Spaces.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Psychosocial Action Spaces can model things about characters and Pacts. We can use Geometry to decide how two characters feel about each other on Zeroth impression (or First impression), and track what their current impressions of each other are. This is a simple model, a Psychosocial Action Space, that creates a grid of every character against every other character, with an impression from -10 (Violent) to 10 (Kinship) in each box. Or the lines may appear between Characters, colour-coded or simply marked with a number. But we can go deeper, adding other dimensions, and to do this we have to explore Psychosocial Action Spaces and what they be.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Psychosocial Action Spaces are imaginary territories that can overlay the physical world. They are the webs of interaction and emotional intertextuality similar to the interconnections and through lines of destiny that the Fæ perceive as the Tapestry of Wyrd, or the soul paths in the Lea that Bulmäs can perceive and follow (which are examples of other Psychosocial Spaces). You can use them in a number of interesting ways.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>You can use a Psychosocial Action Space to think about groups (especially Pacts), how the members interact with each other, what their emotional distance is from one another, and the relative strengths their interconnections.</li><li>You can use a Psychosocial Action Space to model the connections between a Character’s Alts, how those differing versions of a character are connected and respond to each other across realities as they meet in this space.</li><li>You can use Psychosocial Action Spaces to consider a single Alt’s mindscape, the connections between their memories, emotions, unconscious, subconscious and behaviour.</li><li>You can use them to model psionic, doom-reading and soul-walking abilities, exploring and probing a single character’s mind with telepathy, their predestined fate can be read by F&aelig;ry magic, or they can access hidden depths of power within their soul, such as skills achieved in a past-life.</li><li>Psychosocial Action Spaces can also model spirit-realms, dreamworlds, faery-lands, wonderlands, worlds-of-fiction, imaginariums, hallucinations, illusions, and other fantasy worlds, that may have dramatically different rules and even physics, in many cases they are not at all simulations, but metaphors, allegories, delusions, or even projections on top of physical realty.</li><li>Psychosocial Action Spaces can model all kinds of neurological and mental traumas, for example within the mind of a Character with a compulsion to bite their fingernails when anxious, there may be found "biting fingernails" right in the middle of anxiety, perhaps as a coping mechanism or some sort of emotional release, this Space may even have an Edge or Glow that allows it to Relieve Stress, although more likely it will create more. Or within a "Fractured Mind" you may find random cracks that interrupt communications and travel through the Character’s Mindscape.</li></ul>
<!-- /wp:list -->


<!-- wp:paragraph -->
<p>Games and even certain genres can rely on certain Psychosocial Action Spaces existing. For example, if there is a "Spirit World" in a horror story then how that spiritual realm borders on the human collective unconscious such as dreamscapes, the individual’s subconscious awareness, and the Id, Ego and judgemental Super-Ego, might be useful knowledge for a Psychic Detective Character, or for the Yarn-Teller. The Character’s powers may allow him to "Astrally Project", but is the "Astral Plane" a section of the Spirit World, or a slice of a Jungian collective unconsciousness, or a window to some inner mental space? The answers to these questions can be very important to the world-building of the setting, and once set should not be arbitrarily changed. These Psychosocial Action Spaces are maps to the mind of the Characters too, and while every character is unique and should have a unique Psychosocial Action Space for their inner mind, there are always a chance of similarities between Characters.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Building Psychosocial Action Spaces</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Psychosocial Action Spaces are best considered as a simplified version of a more complex space. The webs of interconnectivity between Characters, their proficiencies, their Conflicts, even the Plots that push and pull Characters about are all embedded within their own complex Psychosocial Spaces, and this can be an extreme amount of information to try and flatten onto a simple map. Because of this it is always important to know what information the Psychosocial Action Space is trying to convey. Because of this there are "Classes" of Psychosocial Action Spaces (that are really just more or less focused) and vary by the subject matter.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Class 1: Private</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The first class is Private. This class of Psychosocial Action Space is usually the Mindscape of a singular character (often a singular Alt). Typically the Psychosocial Action Space will have the same shape as the Character’s Primary Geometry. Within that shape are a number of smaller Spaces in  the Psychosocial Action Space. These Psychosocial Spaces are normally tied to the Facets of the Character (as well as their Geometry), with pronounced Spaces for the Character’s Incarna, Persona, Core and Hitches, as well as their Facets with the largest Boons. Typically a Private Psychosocial Space will have between 3 and 12 larger or important Facet Spaces within it.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Psychosocial"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>It should be noted that although a Character may be listed as having only 3 Facet Spaces listed, they will have all Facets Spaces available somewhere, although often smaller Facet Spaces are compressed or hidden within larger Spaces. It would be a very unusual Character who had no Secrets at all, for example, even if they are not a large part of the Character.</p>
<!-- /wp:paragraph -->


<!-- wp:heading {"level":4} -->
<h4>Empathic Maps</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Empathic Maps are super-simplified Psychosocial Spaces intended for Characters who are not as important, such as generic NPCs. Several NPCs will typically utilise the same Empathic Map, and their Characters may exist on the same Psychosocial state without the Characters interacting, so it is often easiest for a Yarn-Teller to pick a single Empathic Map for all their Extras of a given type (or have all of them on a single Map for a very simplified experience).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Empathic Maps are divided into a number of "Locations" depending how complex they are required to be. These Locations are actually constructed by combining a number of Psychosocial States for simplicity.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The simplest recommended Empathic Map is the triangular map. Very simply looks like this:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="t13ne-triangle-list"><li><strong>Thoughts and Feelings</strong> — The Character who is here is thinking and feeling things, this is usually an internal state, they may appear unaware of their surroundings, as though dazed or confused, working through their feelings or they may be consumed by an Emotional effect.<small>Combines Temperament, Humour, Thoughts, Dreamscape, Broadness, Sickness, Darkness and Judgement</small></li><li><strong>Intentions and Reactions</strong> — The Character who is here is acting, reacting and moving towards their goals.<small>Combines Wishes, Muscle-Memory, Secrets,  Principles, Urges, Passions, Mental Defences, and Drives.</small></li><li><strong>Beliefs and Education</strong> — The Character who is here is communicating their beliefs or knowledge to another person, or learning from another person. This can be in the form of reading or a debate, argument or worse.<small>Combines Supernature, Folk, Masks, Perceptions, Language, Knowledge, Memories, and Arsenal.</small></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>A Character, such as a simple Vex, or perhaps, Chorus Extra, should begin in one of the states. A Character can move from any State to any other, either of their own volition or by being moved in the Psychosocial Action Space. There is a second variant of this intended for "mindless" animals and simpler minds.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="t13ne-triangle-list"><li><strong>Content</strong> — The animal is content and probably resting, it may even be asleep, it may wake if disturbed by pressure, sound or smell which will immediately move it to one of the other states.</li><li><strong>Seeking</strong> — The animal is awake and typically seeking something, with a priority of water (unless aquatic), food, company, shelter or "entertainment". The animal may use tracking, or some other ability to locate and move towards their selected target. They are goal-oriented and may not perceive much beyond that goal, although a target with a higher priority may distract them.</li><li><strong>Agitated</strong> — The animal is very alert, and may even be experiencing the Fight-Flight-Freeze response. Typically this is the space when an animal is threatened, or has found what they sought, such as discovering food, attacking prey, or has finding a suitable mate. </li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Typically the animal or animalistic mind will cycle through these states as their day progresses, waking from sleep to seeking something, finding it and  unless prompted by something to move backwards or forwards. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>More complicated Characters such as Cast and Archetype Characters can benefit from a more complex Empathy Map. The Elemental Temperaments of greek philosophy work quite adequately for most dramatic purposes.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="t13ne-quadrant-list"><li><strong>Water / Phlegmatic (Hearts <span class="t13ne-redcard">&hearts;</span>)</strong> — When a Character is phlegmatic they are calm, rational and unemotional. Although they may exhibit dry humour, and perhaps smile wryly or stare disappointedly.<br/> It can also represent tiredness, sleeping, boredom or recovering. <small>Constructed from the States of Secrets, Masks, Humour, Dreamscape, Urges, Passions. </small></li><li><strong>Air /  Sanguine (Spades <span class="t13ne-blackcard">&spades;</span>)</strong> — When a Character is sanguine they are optimistic and almost overwhelmingly positive, usually this will be expressed in social engagement and chat, although rousing speeches are also possible.<br/> It can also represent focus, curiosity, engagement, and experiencing most positive emotional states. <small>Constructed from the States of Language, Memories, Perception, Sickness, Arsenal, Broadness</small></li><li><strong>Earth / Melancholic (Diamonds <span class="t13ne-redcard">&diams;</span>)</strong> — When a Character is melancholic they are usually feeling sadness or depression, typically this manifests as either throwing yourself into doing (often a mindless repetitive task), studying something, or spending time deep in thought.<br/>It can also represent normal daily activity, being suspicious, or mildly stressful states such as trying to find your keys in a hurry. <small>Constructed from the States of Supernature, Muscle-memory, Knowledge, Thoughts, Principles and Drives</small></li><li><strong>Fire / Choleric (Clubs <span class="t13ne-blackcards">&clubs;</span>)</strong> — When a Character is choleric they are agitated, irritable and grumpy, quick to shout and quick to cast judgement, they can be close to snapping, and occasionally paranoid.<br/>It can also represent being threatened, angry (or similar negative emotional states), or any extremely stressful situation, such as engaging in combat. <small>Constructed from the States of Wishes, Folk, Temperament, Mental Defences, Darkness, Judgement</small></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>A Character can move from any Quadrant to any adjacent Quadrant, such that a Phlegmatic Character may easily become Sanguine or Melancholic, but takes longer to move to Choleric, the diagonal opposite (essentially requiring two moves). Characters can begin in their own random state or their Author/Player may choose, emotional effects in place may close access to the Phlegmatic space or reduce the effectiveness of the Emotional effect depending upon the game setting, genre etc.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Archetype Characters and most PCs will find the Elemental Temperaments a little restrictive, with limited choices in the Psychosocial Space. The Hexagonal Empathic Map can work for these more complex Characters while keeping things fairly psycho-geographically simple.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="t13ne-hexagonal-list"><li><strong>Socializing</strong> — The Character is socializing, making friends, chatting and gossiping, or perhaps quietly watching a movie with friends. Socializing is usually a Stress Relief for extroverted Characters, but may cause introverted Characters to Gain Stress.<small>Combines Folk, Masks, Secrets and Language.</small></li><li><strong>Mood</strong> — The Character is experiencing a specific emotion or mood, laughing, crying, etc. A Mood is often a response to something the Character has seen or done. This space may contain a number of Emotions that the Character is most comfortable with feeling. <small>Combines Temperament, Humour, Sickness and Darkness.</small></li><li><strong>Considering</strong> — The Character is thinking, this might be mentally weighing the consequences of an action, struggling with some ethical quandary, trying to defend their position in a debate or trying to persuade another. Thinking is usually Stress Relief for Introverted Characters, but is a Stress Gain for introverts. <small>Combines Thoughts, Mental Defences, Judgement and Principles.</small></li><li><strong>Aware</strong> — The Character is sensing and aware of something (even if what they are perceiving is not technically a real thing, such as a hallucination or a dream). <small>Combines Perception, Supernature, Dreamscape and Arsenal.</small></li><li><strong>Focused</strong> — The Character is focused on the task at hand, be that doing something, remembering something, or just ignoring something else. <small>Combines Knowledge, Muscle-Memories, Memories and Broadness.</small></li><li><strong>Yearning</strong> — The Character is currently driven by some motivation, goal or desire, often to achieve or accomplish something, this will often manifest as planning, or just wanting, before they take action. <small>Combines Urges, Wishes, Drives and Passions.</small></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>The most complex Characters should have their own Private Psychosocial Spaces, that act as an Empathic Map, however these can be complicated to create (reflecting the Geometry of the Character as well as their individual Personality Annex). Which can be a little much for a Yarn-Teller to create on the fly, so the Hexagonal Empathy map can often be substituted (simply note the important internal Spaces within their Boxes and perhaps link a few of them outside their own box.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Class 2: Clique</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Second class is Clique. This class of Psychosocial Action space relies heavily on a concept called Social Ordeal Levels. You can see them here: </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="socialOrdealLevels" title="Social Ordeal Levels" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Typically altering an impression up or down one Social Ordeal Level requires one Success or Failure Level per Social Ordeal Level. Although it should be noted that Betrayal can move a Character from +10 to -10 in a single Level Change, and it is possible to also move from Violent to Kinship under the right circumstances with a single Success or Failure Level also. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Social Ordeal Levels describe the nature of interactions between Characters or groups, be they a small group of friends, the workers at a company, political parties, or the bitterest rivals and enemies. We can use Social Ordeal Levels in an impressions grid, as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="impressions" names=\'{"0": {"0": "Dempsey","1": "Robert Jonathon Alan Dempsey","2": "Bob, Bobby, Robbie, Robert Dempsey, Dempsey"},"1": {"0": "Marie","1": "Dana Marie Ann Collins","2": "Dana, Mary, Marie, DM Collins, Dana Collins"},"2": {"0": "Spider","1": "Kevin Roderick “Spider” Webb","2": "Spider, Kev, Webby, Kevin Webb"},"3":{"0":"Lucy","1":"Luciana Marigold Whitchurch","2":"Lucy, Luciana, Lucy Whitchurch"}}\' geos= "6,4,8,3" mods="0,-1,-3,3,2,0,4,-2,2,7,0,2,2,-2,3,0" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The impressions grid is a simple way to look at a group of Characters and see how each pair interact. The Impressions grid is not particularly useful beyond this however, although it can indicate likely friendships and enmities it is limited at modelling true social closeness. The Impressions Grid will often lead to a Social Map.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Social Map</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Social Maps typically involve Space for each Character. With connecting "Communication" lines linking to every other Character they know. Social closeness is usually shown via proximity on the Map, with friends placed so close their Spaces may overlap somewhat, those who are more distant will appear further away.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The lines that represent communications and connections between Characters will often be colour-coded to reflect the nature of the connection. Usually the following model is used for ease:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong class="t13ne-redline">Red Line — </strong> Red lines usually indicate negative relations, such as between Opposed Pushed Embodiments. Red is the line between Enemies, who usually only communicate hate to each other.</li><li><strong  class="t13ne-yellowline">Yellow Line —</strong> Yellow lines indicate Neutral relations, such as when there is no opposition or alliance, but Characters may know each other fairly well. This often indicates a familiar, but not friendly connection, such as distant family members or work colleagues may exhibit.</li><li><strong class="t13ne-greenline">Green Line — </strong> Green lines indicate Characters who have positive interactions and experiences with each other, like good friends or close family. Often this can also indicate two Characters with a Pulled attraction for each other, regardless of their Sides Oppositions etc. (Romeo and Juliet both experienced strong attraction for each other despite their opposed families).</li><li><strong class="t13ne-blueline">Blue Line —</strong> Blue Lines indicate a situation where Characters are fairly Neutral to each other, but it is often because of a situation of Push meeting Pull. This could be a love-hate relationship, unrequited love (especially dues to mixed sexualities), uncertainty, or hestiancy on one or both sides.</li></ul>
<!-- /wp:list -->

<!-- wp:html -->
<p>An example Social Map can be created from the impressions Grid above. <figure><figcaption>An example Social Map</figcaption><img id ="socialmap" name="socialmap" /></figure></p>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Additional Data can be coded into the lines, if necessary. For example line types may be used to indicate the Character (Character 1 uses solid lines, Character 2 uses Dashes, Character 3 uses Dots etc) types of relationships, as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Solid Lines (&#65073;) —</strong> Solid lines indicate strong connections, where physical contact is possible. These people meet often in physical (or at least virtual) space.</li><li><strong>Dashed Lines (&#9478;)—</strong> Dashed lines typically weak direct communications, such as texts, letters, phone calls etc.</li><li><strong>Wavy Lines (&#11838;) —</strong> Wavy lines typically indicate only indirect communication is possible. These Characters may not know each other at all, but have heard of each other’s existence through mutual contacts, anonymous notes and memos, or semi-anonymous directives from on high.</li><li><strong>Dotted Lines (&#10311;) —</strong> Dotted lines are sometimes used to indicate Characters who are unaware of each others existence, but who have some connection or indirect influence on each other anyway (such as being members of the same library, political party or secret society).</li><li><strong>Arrowed Lines (&Uarr;;) — </strong> Arrowed Lines are usually used to indicate a communication or influence that is one way only. These are often quite rare, as even the most dictatorial and removed leaders are affected by their populace to some degree.</li><li><strong>No Line — </strong> No Line connecting the Characters means there is no connection between them (although they may still have "connections" in the form of both living in the same street or country, these are irrelevent to each other).</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Class 3: Underworlds</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Some Psychosocial Spaces overlap the Physical Action Spaces, these can represent Spiritual Realms such as the Lea, nearby Otherworlds (such as Faery), or a Psychosocial overlay, like a criminal underworld. Characters in the "real" world are also somewhat present in the Underworld, usually at the same location. The Underworld is essentially a layer of additional notes that can be visible to some Players.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<p>Consider a Mapped Action Space, in this case a small island:<figure><figcaption>An example Fantasy Map<img id="TestMap" name="TestMap" ></figure></p>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>This map has no key currently but we can identify a number of townships from the map, it may be useful to create an Impressions Grid before we draw in the lines...</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="impressions" names=\'{"0": {"0": "Gantham", "1": "The Town of Gantham", "2": "Gantam, Gantham Market"}, "1": {"0": "Rockport", "1": "The Town of Rockport", "2": "Rockport Docks, Rockport"}, "2": {"0": "Yon", "1": "The village of Yon", "2": "Yon"}, "3":{"0":"Yewhaven", "1":"The City of Yewhaven", "2":"Yewhaven, Yewhaven Docks, Yewhaven Shambles"}, "4":{"0":"Wyrmsbridge", "1":"The Town of Wyrmsbridge", "2":"Wyrmsbrig, Vernsbridge"}, "5":{"0":"Jedsfrom", "1":"The Town of Jedsfrom", "2":"Jedsfrom, Jetsum, Jedsfrom Manor"}, "6":{"0":"The Barrows", "1":"The Barrow Mounds", "2":"Barrows, The old tombs, The Barrow Goblins"}, "7":{"0":"Orcsness", "1":"The Goblin Citadel of Orcsness", "2":"Orcsnest, Orkness, Awksness"}, "8":{"0":"Draktor Keep", "1":"Draktor Keep", "2":"The Black Keep, Dragon Tower Keep, The Lich Hold"}, "9":{"0":"Wood Goblins", "1":"The Goblin Tribe of the Boar", "2":"Boar Tribe Goblins, Forest Goblins, Goblin Archers, Goblin Rangers, Woodlins"}, "10":{"0":"Cave Goblins", "1":"The Goblin Tribe of Black Fire", "2":"Black Fire Tribe Goblins, Black Goblins, Cave Goblins, Cavern Goblins"}}\' geos= \'8,7,13,1,9,1,7,3,6,6,5\' mods=\'0,1,3,0,0,0,0,0,0,0,0,3,0,7,0,4,0,0,0,-8,0,0,0,7,0,-5,-10,-2,0,0,-5,-4,-3,0,0,2,0,-1,0,-6,-9,0,-7,-3,0,4,-1,-4,0,0,0,0,5,0,4,0,0,0,-3,4,0,6,0,0,0,0,4,-5,2,1,2,4,2,5,-1,-5,-2,-5,-5,-5,-12,-3,-5,-3,0,-4,5,3,-2,-4,-3,4,-2,-5,0,0,0,3,-5,0,1,-2,-8,0,-5,6,4,-3,0,4,0,-2,3,3,4,0,-3,1,-7,-1,0,0\'/]
<!-- /wp:shortcode -->

<!-- wp:html -->
<p>Over this map, we add an Underworld that shows us the territories that are controlled by different species and how the individual towns and villages feel about each other. This creates additional understanding, as we realise that the spirits of Draktor Keep are opposed to both the Human occupation and the Goblinoids upon what they see as their Island. The Barrow Goblins are allied with the humans in Jedsfrom, but only Neutral with the Wood Goblins, and have no contact with the Goblins of Orcsness. The Humans of Yewshaven are effectively at war with the Goblins in the Forest and those in Orcsness, but have no knowledge of the Barrow Goblins, but Yewshaven has strained relations with the other Human towns in the East. <figure><figcaption>An Underworld Map of the same Map</figcaption><img id="Underworld" name="Underworld" />
</figure></p>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Psychosocial Spaces are technically Descendants (just like Locations), although it is not often that they are detailed in that way, but they can have Annexes, as well as Descendant Edges and Glows of their own, and this applies to the Territories on the Island. The Spirit Territory for example may have a "Spirit World" Annex, with a Numinous Edge, that allows the Spirits to affect the Humans and vice versa. The Human Territory meanwhile probably has a "Trade" Annex with a Rewarding Edge. The Goblins however are linked by a "Brutal" Annex that grants all Goblins a Storm Edge.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Of course this is a basic Underworld Map, it details the regions and how each township views its neighbours, and is a suitable overview of politics on the Island for a group of Fantasy Adventurers who have recently arrived. After the Characters have spent some time on this island, and have acquired better intelligence they may have a more detailed map (the Yarn-Teller would normally require it), perhaps noting the major political Characters in each township, and their individual relationships across the island. </p>
<!-- /wp:paragraph -->


<!-- wp:heading {"level":3} -->
<h3>Class 4 : Mercurial</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Where Underworlds reflect a real-world, that is largely static across time, Mercurial Spaces are chaotic, changeable and random. Which is a problematical thing to model in a stable manner, such as you might create on a piece of paper.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<p>Mercurial Spaces always use the following map:</p>
<figure class="t13ne-map"><figcaption>The Mercurial Map</figcaption><img id="chaosmap" name="chaosmap" alt="An SVG image of the Mercurial Map"></figure>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Firstly, you might wonder why we would want a changeable space? Complex crowd behaviours, as well as more complex Economic systems, Dreamscapes and Fantasy-lands are particularly well represented by Mercurial Maps, as are Faerie-lands and Labyrinths, and they can be suitable Mindscapes for exceptionally insane, as well as Fae-touched Characters, as well as perhaps the Lea near a Bulmäs who has lost control of their themselves, forming a Soul-storm. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Such Mercurial Spaces though can be frustrating as well as confusing, and they should never be used as part of a Plot that has a strong Mystery or Puzzle component, as their chaotic nature may be detrimental to Player fun, that said Political Plots can benefit from using Mercurial Spaces to represent the more Chaotic aspects of crowds and social changes. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Map is quite complex, and it should be noted that there exist three types of node within the map. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The square-white nodes (numbered 1-24) are considered the most stable and least Chaotic nodes (they are called Stable nodes). These have multiple lines of connection that are often unblocked by other lines and can be given a description for the Space or person they represent. Often they will represent individual Facets or Facet Psychosocial Spaces for ease.</li><li>The mauve-triangles, numbered 1-0/12 are considered semi-stable, as they always have multiple lines of connection that do not cross different coloured lines on the way, but are themselves unstable, changing and moving. <ul><li>To represent this each of these nodes adds 1d12 to the node number to determine the actual node encountered (0 may add 12 if a number higher than 6 is rolled on the 1d12). <ul><li>The Yarn-Teller running the Mercurial Space should decide how and when the 1d12 is rerolled, to alter the nodes. </li><li>The Yarn-Teller can set the d12 directly, which can be used to create ordered movement (although note that some nodes will not always be available).</li><li>The d12 can be rolled every few Phases, Rounds or something based on real world minutes, being stable in between.</li><li>The d12 can be rerolled anytime anyone tries to enter any of them. When this method is used this can either:<ul><li>Leave every Character in the original node</li><li>Move each Character to their new appropriate Node.</li></ul></li></ul></li><li>These nodes can be treated as shadows or reflections of the stable square-white nodes. </li><li>Note that Nodes 1 and Node 24 are half as likely to occur than the others.</li></ul></li><li>The blue-circles are the most chaotic part of the map, close to the centre. Imagine them all swirling and looping along the lines constantly, such that it is almost impossible to tell where each one is. These are numbered 0-24 and are usually considered place holders for different dice that are rolled to discover the actual node. <ul><li>All of them could be replaced with a d24 (rolled with a d12 and any other dice: Even on the other Dice adds 12 to the 1d12 roll, odd adds 0 to the 1d12), or specific dice can replace specific nodes. These are normally considered separate Spaces to the other Nodes, but can be reflections again if necessary.</li><li>All of them could be replaced with a d4 that is then rolled to enter 1 of 4 Spaces, or each "Node" could have its own table of Spaces or States that may be entered.</li><li>Entering these nodes may trigger other Characters to reroll and chance Location, or not (usually not, see below).</li><li>Usually, if a Node has a Character in it it is locked to that a specific Space, if another Character enters the same Node then they will arrive in the same Location. Although in truly Chaotic situations either:<ul><li>A new Character entering the Node will only arrive in the same Space if  they roll the same Location.</li><li>or a New Character arriving in the Node will re-randomise the Space, effectively moving the Character already there.</li></ul></li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4>Motion in Mercurial Spaces</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Mercurial spaces have multiple types of motion possible. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Travel along a green line is usually given a static Difficulty. <ul><li>This may be defined as a single value for all Green lines (e.g. Diff 4 Pips).</li><li>This may be defined on a line by line basis (e.g. 1→2 may be Diff  4 Pips, but 1→12 is Diff 7).</li><li>Green lines add no Difficulty when crossed, and can be joined anywhere. However, Green lines can only be "ridden" to a Node.</li></ul></li><li>Travel along a Blue line is usually given a variable Difficulty.<ul><li>Often this is defined as single dice roll that is used to calculate the Difficulty of all Blue lines (e.g. All blue lines are given a Difficulty of 1d6+1 say or 2d6 even), this Difficulty is rolled each time. This Difficulty can be set as a random card Draw instead, usually at 1 Card.</li></ul><ul><li>Blue lines to specific Nodes may be given specific Dice or Drawn Card Difficulties (e.g. All travel to a 0 node may have a base Difficulty of 3 random cards).</li><li>Blue lines can only be entered or exited at nodes.</li><li>Crossing a Blue line typically incurs a set Difficulty for each line crossed (e.g. while travelling from 1→11 on a Green line, a Character crosses two blue lines, each add +3 Pips to the Difficulty).</li></ul></li><li>Mauve or Purple lines are always somewhat random in nature. They are always dashed to make them easier to spot.<ul><li>The Difficulty to travel is usually set randomly for each transit. (e.g. Difficulty of 2d6 Pips would be rolled every time).</li><li>Crossing any of these lines also incurs a Random Difficulty Penalty for the whole transit (e.g. crossing any number of Purple lines will add a Difficulty of 1d6 Pips).</li><li>These lines can be entered or exited anywhere at no additional Difficulty. So rather than crossing a purple line you can move to travelling along it.</li></ul></li><li>Brown lines while they are shaped similar to Mauve lines they work completely differently.<ul><li>Difficulty to travel is always a Static Difficulty, but must be paid for each section of the Brown line. If the Brown line crosses any other line (except Mauve which are all passed at once) the Character stops at that intersection until they pay again. (E.g. Travelling from White Square 1 to White Square 24 on a circular brown line must cross a Blue Line so pays 2 pips for the section up to that line, then crosses the Blue line paying +3 Pips, then continues paying a further 2 Pips to the Green line, that also crosses a Mauve adding +1d6... )</li><li>Crossing Brown lines accumulates Difficulty, adding +1 Pip Difficulty for the first line crossed, +2 for the second line crossed, +1d6 for the third line crossed, then at the fourth and fifth we add 1d6+1 and 1d6+2, then 2d6 for the sixth, and so on. This can cause a Character to have to stop at a Brown line, then continue on in another move, that will again accumulate Difficulty.</li><li>Brown lines can be entered or exited anywhere, but doing so costs 1 Pip of movement. </li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>This is best summarised with an table, like this example one:</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="t13ne-tablewrap"><table class="t13ne-table" title = "Example Mercurial Difficulty Table"><tbody><tr><td>Colour Line</td><td>Following</td><td>Crossing</td><td>Entering</td><td>Leaving</td></tr><tr><td>Green</td><td>4 Pips whole line</td><td>0 Pips</td><td>Anywhere 0 Pips</td><td>Only at a Node</td></tr><tr><td>Blue</td><td>1d6+1  Pips</td><td>+3 Pips each</td><td>Only at a Node 0 Pips</td><td>Only at a Node 0 Pips</td></tr><tr><td>Mauve</td><td>2d4+2 Pips</td><td>+1d6 Pips</td><td>Anywhere 0 Pips</td><td>Anywhere 0 Pips</td></tr><tr><td>Brown</td><td>+2 Pips per section</td><td>+1 / +2 / +1d6 / +1d6+1 / +1d6+2/ 2d6 / 2d6+1 for each crossing during a single move action</td><td>Anywhere +1 Pip</td><td>Anywhere +1 Pip</td></tr></tbody></table></div>
<!-- /wp:html -->

	'),

array('RulePage'=>'Tapestries', 'Description'=>'
<!-- wp:paragraph -->
<p>In T13, the Tapestry is the Alpha and Omega of the World-Building process, it is where we begin, and where we end. Tapestries are the plans, scaffolding, and building blocks that we build our Games and Narratives with. Typically, a Tapestry will define the setting and everything else that you need to know about the Game, or Narrative, from the tiniest details, like what colour insects live in which areas of the local forest, all the way to huge details like where in the Omniverse the story is happening.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Because of the way T13 works, you can start out with an idea for a Tapestry, build down into the fine details, expanding the Tapestry as you add Plots, Descendants, Characters, Annexes, Hitches, Notes, Maps and Proficiencies. Or you can begin from a single Location, Character, Descendant, or even a Proficiency, and build up, and out from there, exploring progressively larger areas and narratives, as you prefer.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Tapestry can tell you what Rules a Game (or Story) might use, what Genres it conforms to, and what the world of the Narrative — which can be the whole of the Omniverse (if you really want), although usually Referees and Authors stick to their own Multiverses, or maybe just a single town and it’s weird other-world equivalent — looks like in the various Eras that might be visited (assuming time-travel is allowed, even if you don’t allow time-travel, it can be very useful to know something about the recent and distant past, for world-building purposes).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Early on the Tapestry might be a few collected ideas, a mood board for development. Later, after you have done some work, it becomes a guidebook or outline to produce your game or narrative. Eventually, a Tapestry can be a sandbox or even a whole game in its entirety, telling you everything you need to know to run that game from beginning to end, or a clear framework that a novel can be written from.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tapestries can begin with a few ideas, but we try to collect and collate these thoughts early on, and build an elevator pitch to the whole idea, this might be as simple as, "A hero rises to protect the down-trodden", or "A darkness rises in the land", or be as complex as "In a city that transcends all of space and time, we follow a schizoid gumshoe detective, and his imaginary friends, as they try to solve a murder with no body, no weapon, no suspects, and perhaps no victim."</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>We add to this pitch the Motto of the Tapestry, which may be something like, "Keep them guessing", "Spell everything out", "Dance around the subject", "Bigger Explosions", "As seen on TV", "Spectacular Extravaganza" or "You can never have too many Ninjas", or perhaps something more sensible, such as "Lawyers can’t argue physics". </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Motto of the Tapestry is meant to inform the rest of the Tapestry. It gives us some overarching themes or just some goals or intentions. If you have no ideas about a particular Scene or Story, refer back to the Motto of the Tapestry, it will help your Tapestry feel more coherent if the Motto is regularly worked into the Narrative.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Maps and pictures can be added during any phase of a Tapestry’s weaving. They can be helpful for showing specifics of locations ("Where’s the Trap?"), or for expressing moods and feelings that would require many more words. Generally, it is better to create your own maps and images for your own Tapestries, but there are plenty of resources available on the internet.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> You can also begin building Events that you know are part of the History of the World, as well as key points of the Story that you want to tell. These Events should always be considered guidelines at this point, you are making out a rough sketch, or prototype of the Tapestry, not its final form. Characters (especially Player Characters) often bend and break these Events when they get involved in them, and a good Yarn-Teller knows that things rarely go as they planned. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There is a balance to be found between Events that are so big the Characters cannot hope to affect them, such as Cataclysms and Disasters, but which have a profound influence on the Characters, and those smaller Events, such as someone missing a bus, that the Characters might easily influence, but which have no profound repercussions. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In a game, huge Events beyond a Player Character’s reach and control can feel linear, not unlike Rail-roading, as there is nothing the PCs can do to affect it, but as long as the more minor Events ripple out from the major, which can be influenced by the Player’s choices, then the Player’s feel as though they have agency. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Let’s consider a Disaster scenario where a Comet strikes the Northern Kingdom. Depending upon how the Yarn-Teller handles this Event and the situation the Players will react differently.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the PCs are in the Northern Kingdom and are immediately destroyed by the Comet, that’s obviously bad. Okay, some Heroes may be able to wind back time a little, get some warnings out, and possibly escape in a second iteration of events, but that’s still not great.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Having a comet hit the Northern Kingdom and utterly destroy it is fine, if, first of all, the PCs don’t live in the Northern Kingdom. Then it is just news that they will hear. The following collapse of civilization, darkened skies and disastrous harvests in the south, roving bands of robbers, and caravans of migrants, will impact them, but allow PCs to take advantage of the chaos somehow, or at least make meaningful decisions for their own safety and survival.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Some Events are considered too large to be meaningfully impacted by Characters, cosmic events, acts of god, that sort of thing. We call these <strong>Boundless Events</strong> as they are almost unlimited in Scope and are rarely controlled by PCs. Unbounded Events include things like the formation of stars, planets and the beginnings of life, plus events like the mass extinctions that came before us. Boundless Events are cosmic in scope and scale.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Smaller than Boundless Events are <strong>Sacrosanct Events</strong> that are events that were set in motion by gods and other divine beings, the birth of a new religion (or god) is generally considered a Sacrosanct Event. Often the works of Saints and other Holy people are considered Sacrosanct, which can extend to the establishment of individual Temples and Churches. Grunts and Heroes may understand the Sacrosanct Event as being of "Religious Importance", and time-travellers are often wise to avoid tampering with these events, for many reasons. It is worth noting that there is considerable apparent cross-over between Boundless events and Sacrosanct events in many cultures, with Boundless events being attributed as Sacrosanct by members of specific religions. In these cases the Boundless event is considered simply as having a greater Scope than a normal Sacrosanct event.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Less significant than Sacrosanct Events are the <strong>Keep Events</strong>. Keep Events are protected or fortified spans of time that can last for centuries in some cases (Sub-Roman Britain [400AD-700AD approx] are a Keep Event held by the Chronomasters in many timelines), any Yarn-Teller that enters the Keep Event becomes another Keeper of the event (tasked with preserving the event as stated) any Keeper who tries to alter the Keep event will be immediately ejected from the Keep event to an Alternate Time-line nearby. Grunts and Heroes may understand Keep Events as "Fortified Historical Periods" or "Protected Chronologies"</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Cascade Events</strong> are events that may began small, but grow with time, like a domino effect, often spreading as Social Interactions amongst millions of people, until they reach almost Boundless Event size.  They include the largest events of human history, and are referred to by Grunts and Heroes as "The Tide of History", "Uncontrollable Chain of Events", or "Escalating Causal Sequences". Cascade Events are usually not directable or divertable, although occasionally less powerful Cascades can be "tweaked" by powerful Yarn-Teller Pacts. Yarn-Tellers may struggle to even influence a Cascade once it is under-way, and many find themselves swept along, or escape via a Causal Nexus or Crux to found a new timeline.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Causal Nexus Events</strong>, Causal Nexuses are created by multiple Yarn-Tellers interacting to manipulate a time-line together (essentially by stacking Cruxes on top of each other). Causal Nexuses can be considered as "Hardened History" or "Static Chronological Events" by Grunts and Heroes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Smaller than Causal Nexus Events are <strong>Crux Events</strong>, which are powerful events created by Yarn-Tellers when they divert history and  create new time-lines and alternate worlds. Cruxes can also be created by the Death of any Character liberating their Chi and Sway as Yarn in that moment. Cruxes can be considered as "Tipping-points in History" or "Chronologically Strategic Events" by Grunts and Heroes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The smallest of Tapestry events are <strong>Chronoliths</strong>. These are moments of time that are used by Heroes (particularly Mercari and Paradox Warriors) as anchor moments in history, that they imbue with Chi so they can reload and return to that moment with greater ease. Chronoliths may be understood by some Grunts and Heroes as simply as memorable, or targetable, moments "Dawn this morning", "Monday, 12pm"  or "Remember that time you lost your keys, and we had to break into the house through the bedroom window?" </p>
<!-- /wp:paragraph -->
'),
array('RulePage'=>'Subplots', 'Description'=>'<!-- wp:paragraph -->
<p>Plots in T13 are rarely solitary things. Even a single Story is broken into 3 structural Acts and numerous Scenes, that are each technically a Plot in their own right and can burst into side Stories.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When we build a new game-world we could start with a single Story, but it usually makes more sense to create an overview, and begin sketching in from the top down. The overview in this sense is the the beginnings of the Cycle.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Cycle can be joined by Epics, Volumes, Arcs and Stories/Chapters, that describe the Cycle with finer and finer granularity, to create more detailed interwoven Narratives. Even if we just extend the first line down from the Hook of the Cycle, down to the Hook of the Chapter, that’s already 4 different (although probably related) Conflicts each with different Sides and Narratives all beginning to interact. Imagine how complex it could get when you have an Epic History, or an Epic Saga, that pre-dates the current Epic, adding their influences too. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So, when we create a new Plot, we should expect it to spawn at least one Subplot. Yarn-Tellers should prepare at least a little list of potential Subplots that may be spawned, it doesn&#39;t have to be a complete or even extensive list, just try to note down the most obvious potential Subplots that you see in the larger Plots. For example, if the current Plot has two Sides who are at open war, then the obvious Subplots can be summoned up as "Romeo & Juliet" (where a Character from each Side become romantically entangled creating a new Conflict within the larger Conflict), "Enemy Mine" (where a Character from each side are trapped together and must learn to live with each other, save each others lives from external threats and become friends), "".</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Subplots can also be spawned in, created during play. Yarn-Tellers are always throwing in a new Subplot here or there, and we’ll get to that. But there are other ways that Subplots can be spawned.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Obviously Plots interact, for example a Descendant, or Geo Plot, may interact simply with a Quest Plot to capture, hold, or retrieve, the Descendant (even if it is a Location, or even a Pact), as well as Character Plots for the owner (or a resident, or member), or those on the Quest.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters are usually working on their own Character Arc, surrounded by others working on theirs. These Plots will also interact and spawn Subplots. Even when the Characters aren’t Yarn-Tellers themselves.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When Plots interact in these ways, new Conflicts are often spawned, as the Embodiments are placed in Tense and Dramatic situations. No Character (unless they are the Yarn-Teller of that Story) should be able to identify their own Embodiment in any particular Plot. They may make Alliances or Enemies of Embodiments that are nothing to do with their current situation, creating new Conflicts that can spawn even new Cycles occasionally.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Conflict Plots are spawned by the interactions between Characters, even when they are not technically Embodiments of the current Plot. If two Characters come into Tension with each other (if they are both in a Scene with a Suspense of 5 or higher) but they are not Embodiments of the Plot that has created the Scene, then a new Conflict can be generated between them, such as between their Persona Facets. Cards can be played by all present Yarn-Tellers, to create a new Conflict (usually only Dominant and Pressed sides are established by cards, the other sides follow from narrative logic, normally).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Destiny plots are easily spawned by Characters making predictions about what may happen next. During this prediction some Conflict must also be mentioned, or at least intended, "You let him go? Great, he’ll probably be the Big Bad next season!" - implies that the Character that they let go will be one side’s (probably the Dominant, Above or External) embodiment, and the party will be Pressed. Where as "You let him go? Great he’ll be sneaking back with his mates to kill us in the night." implies he will be part of the Shadows of a future adventure.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you create a Subplot then it should be your responsibility. If you are a Yarn-Teller, then make the notes you need and build a future adventure about it. If you aren’t a Yarn-Teller, then tell the Referee and they should make a note of it and use it if another Yarn-Teller doesn’t. Don’t worry though, T13 does have a mechanic for reminding the Referee and other Yarn-Tellers about other Plots, but we’ll get to that in a bit.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Subplots as Acts</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Often the easiest way to break down a huge Plot is to think of it like a single Story. In T13 we think of Stories as having a generic 3 (or more) Act Plot.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The First Act (usually about a sixth to quarter of the Plot’s Scenes) is called the Frame. This is what defines and exposes the premise and Conflict of the Story. It establishes the world, reveals the situation, and often the villain, or the first face the villains Side uses. At this point in the Story the Conflict is often only a low Suspense, a pull, or a push between the sides.</li><li>The second Act, the Loom, works the Conflict. This is where we see the Oppression, see the Pressed side struggle beneath the Dominant’s yoke, watched by the Above, crushing down on the Below. This is when the Internal rebellion shows itself, when the External forces make themselves known, and the Shadows stir.  Suspense rises, and can draw Characters into situations that they are not prepared for. This is the moment when in an Action movie the hero is fighting his way through the underlings, trying to get a lead on the villain, or the detective is interviewing suspects and hunting out clues. This might be when the true enemy is discovered to exist, often after the first has been dealt with. This is usually the majority of any Story (at least half and often two-thirds), and the Stakes and Suspense are constantly raising and then falling slightly less throughout the Loom.</li><li>Finally, we reach the Zenith. If the tension and pressures in the story still hasn’t broken into true Conflict, it’s now, or never. With arguments, accusations, or even assassinations taking place. This is the time of final last-ditch battles, or the grand reveal, who-dunnit? What does the monster look like? Who is the enemy? The twist in the tale may come now, that diverts the next Story, or the larger Plot, as the Shadow sides suddenly make their move. The Stakes are at their highest during the Zenith, Extreme and Soul Stakes levels are common in all forms of literature, and Paradoxical Stakes are common enough in Science-Fiction, Fantasy and Horror tales. The Zenith is where the Conflict reaches a conclusion of some sort. Although, the nature of that conclusion varies depending upon factors like the actions the Characters take and how successful they are.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>This means that for a Cycle Plot there could be three Epics, Frame, Loom and Zenith, for the Cycle.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can always assign a Plot one of the following Act Types:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="actTypes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p> So as a Referee, do you just start with the Players in the Frame Epic and build that?</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Well, usually the Frame Epic is often the ancient history of the world. And a truly well built Cycle may actually have a History (the facts of history) and a Saga (a folklore believed to be the History, which differs in details). The Characters of the Frame Epics are the old gods, demigods, kings and heroes of lore. The important history of the world, laid out in the History (and Saga) sets up the later Plots that you want to play through (as well as potentially defining heaps of Lores that may be used later).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You might detail the History, and/or Saga — You may even play through it (or at least visit moments through time-travel, flash-backs, past-lives, or historical Revelations), but it is rarely necessary to know every detail of the Frame Epics.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Loom Epic is usually where the main body of our tales play out. If the Frame Epic is the Ancient History of the world, the Loom is Modern History leading to the Present day, when the big Stories happen. The Loom Epic lays out the thrust of the major conflict and how it affects the Story World. Usually the Loom begins some time in recent History, although just occasionally a Loom begins at the first Hook. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Early on, the PCs have no chance or hope to influence these events. They are the concerns of Emperors, Popes and gods, not a farmer’s son who wants to learn how to swing a (laser) sword, and shoot a (plasma) bow by an old knight. Later, however, when the farmer’s son has joined an army, risen to the rank of General and won the ear of a Pope, or an Emperor, then they may influence the Epic Loom plot.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Finally, the Zenith Epic is the approaching Future that you are working to bring about, or stave off as much as possible. Perhaps the Zenith represents a Prophecy, the predicted end of days, Armageddon, or Ragnarok. Of course, the future could be unwritten, in which case you won’t need to detail it. You may want know what the Zenith Epic is (or in some cases you may want to play through the Zenith Epic — perhaps as some sort of Armageddon, or Apocalypse storyline), but generally you won’t need to know too many details about the end of the Cycle, as it lies beyond the Scope of the Story-telling. The Cycles of Classical Mythologies, for example, simply seem to fade away. We do not know what happened to the Greek, Phoenician, Gaulish, Celtic, or Roman Gods, did they leave, die, or are they still living somewhere here? Their stories just stopped. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Subplots as Tracts</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Acts have Scenes, they are made up of these smaller chunks, just as Stories are made of Acts. When we are breaking up Cycles into Epics, Volumes become like Scenes of the Cycle Plot, but we call them Tracts normally, to indicate that these are more complicated than a simple Scene.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tracts do not usually focus on a single "Scene" of the Cycle for a whole Volume, but instead we share several "Scenes" across a Volume. You could focus a Volume on a single Scene if you wanted, TV shows sometimes do this, focusing on a Single Scene Tract and Story for a whole season, but more normally you will group a few together, and tell more than one Story at once.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tracts follow the format of Scenes, in that they are broken into clear types that we can categorise. Early in the Frame Epic we could have several Hook Volumes and perhaps least one Revelation Volume, but it is be more common to condense them into a single Frame Volume (Assembling Super Hero teams aside) that sets up the rest of the series. During the Loom Epic we can have Warp and Weft Volumes. Since the Warp is made from 3 Parts (Ends, Fray, Snag) this is similar to the Acts of a Story as well, breaking those Volumes into smaller Arcs.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Alternatively, you might find that each Volume is better as a mix of several Warps and Wefts. With the individual Scenes slipping into or encompassing several within a Chapter of the Volume. It all depends on how deeply you want to weave your Stories, as it is a lot easier to write a Chapter around a Single Tract "Scene" than to incorporate several higher-level "Scenes" into a single coherent Chapter.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>While a Volume is a Scene (Tract) of a Cycle it is still potentially an Act of an Epic, and you can combine Tracts and Acts together as required (just because you have 3 Acts at each level doesn’t mean you have to have 9 Tracts below that level). Any number of Tracts can form an Act, just as any number of Scenes can form an Act in a Story.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="sceneBeatTypes" /]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Subplots as Components, Stages, Tests or Quests</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When you look below the level of Scenes of a Story you start to break things into Scene Components, Ordeal Stages, Tests or Quests as components of larger Plots.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Warp and Weft Scenes can, for example, be further broken down into Scene Components, which can appear as similar to Acts within a Story. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="sceneComponents" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>If Epics are like Acts of a Cycle, and Volumes are like Scenes of a Cycle, then an Arc can be seen as The Fray of a Cycle, with Chapters like the Ordeal Stages of a Cycle. These parts can be seen as a single step in the much greater plots that are going on.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Similarly, simple Tests (or more complex Quests) can also be considered smaller components of larger Narratives. What appears, from the perspective of a Cycle, as a simple Test (perhaps made by one Nation against another) will be a complex Narrative of its own, at the level of the Arc and the Characters involved in the "Test of Nations" Tract.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Quest is the ultimate example of that, as Quests sit completely outside the Plots, as Facet components that can drive Plots themselves. On some level, a Quest is a simple task set for a Character or Pact, but on another level it can be an Epic in its own right.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Care and Feeding of your Subplot</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Subplots just like Plots have requirements to work. Not only do they have to have Sides that create Characters and Descendants that all have to be detailed, but they need play time to work.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If a Yarn-Teller is in charge of a Subplot it is their responsibility. They are meant to deal with the Plots and Subplots they have created. The Referee should make a record of any Subplots like this, when they are assigned to a Yarn-Teller. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Subplot should then proceed by having the Yarn-Teller play the appropriate Yarn cards to unlock each Scene of the Subplot. Perhaps the next Scene is a Revelation, then the Yarn-Teller would require a Yarn card with a Revelation Scene Beat Type (any 5 or a Queen). If they play the card that triggers the Scene, they must then narrate it. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each session that the Yarn-Teller narrates, that does not touch on the Subplot, the Referee should remove a point of Yarn from the Subplot (although don’t change the original Yarn cost). If the Subplot is mentioned in the Narration and moved on somehow (even if only a Stage of an Ordeal, or meeting an Obstacle) then the Ref doesn’t remove a point of Yarn. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Subplot becomes empty of Yarn, which may happen after many sessions without being mentioned, then it will go rogue. The Referee, or another Yarn-Teller, may take over that Plot and use it as they wish (hopefully not as a stick to beat the Yarn-Teller for forgetting about it), although they cannot change the Conflict, they can alter the Embodiments if required, for free. </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Rogue Subplot Procedure</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li> The Ref should poll the Players as to whether the Rogue Subplot should be dropped, if they all agree then the Subplot is retired (although a Yarn-Teller may recycle it later). </li><li>If the Players decide the Subplot should stand, then a bidding war begins, with each Yarn-Teller bidding Yarn to take over the Subplot. </li><li>The Subplot is immediately refilled with Yarn and becomes the responsibility of the winning Yarn-Teller. They may now use that Subplot, and are responsible for its feeding.</li><li>If no one bids on the Subplot, then it becomes the Referee’s responsibility. They should incorporate the Subplot into their Narrative as normal. </li><li>Referees may decide treat the Rogue Subplot as a Rejection Completion event, promote the Plot, add a Subplot that addresses the Rejection, and start a new Story that Hooks the original Yarn-Teller.</li></ul>
<!-- /wp:list -->
'),
array('RulePage'=>'Character Arcs', 'Description'=>'<!-- wp:paragraph -->
<p>In T13, Character Arcs can be handled in two different ways. The first way is simply that a Yarn-Teller is assigned to run the Character Arc as an Arc level Plot. With the standard Conflict and so on. This is considered Plot-driven play, and is fairly standard. The other way is Character-driven Character Arcs and they function in a very different way.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Compositions</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Compositions are a musical term, that can cover pretty much any piece of music, from any genre, whether it is a guitar/jet-engine riff from a Death Metal track or a piano concerto they are both Compositions. They share a lexicon of music, such as Pitches, Rhythms, Chords and Time Signatures, and in T13 we hijack that  lexicon and way of thinking to consider interpersonal Character relationships and how they are modelled. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Composition then in T13 is something akin to an film score, telling us the emotional beats and thrills of the Characters, this can work along side or instead of plotted drama to create Character Drama. To do this we need to open our model and look at what we mean by a Composition.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Tuning</strong> — Tunings are collections of Pitches, Notes, Tones and Keys that create a "Tune". <ul><li>Each Character has a Key and so they may be "in tune" with a Composition if it uses certain Pitches and Notes.</li><li>Each Pitch, Note and Key has a unique relationship with every other Pitch, Note and Key, they all interact differently.</li><li>Pitches, Notes and Tones can be arranged, and played together as Chords. Chords have a stronger impact than an individual Pitch, Note or Tone.</li><li>Pitches, Notes and Tones (and Chords) can be arranged in sequences, with Rhythms to create lines, voices, melodies or tunes as well.</li></ul></li><li><strong>Rhythms</strong> — Rhythms are patterns of events such as movements, that define the Beats, Bar and Tempo of the Composition.<ul><li><strong>Beats</strong> — Beats are of course related to Yarn Card Story Beats, however which beat is used is defined in a more formulaic way that still allows for improvisation. Rhythms are made of Beats that alternate these are called Strong Beats (that often begin a Bar) and Weak Beats that normally end a Bar</li><li><strong>Bar</strong> — The Bar (or measure) is a segment of time that can hold a number of Beats. In Character Compositions the Bar is often the equivalent of a Scene although it can also behave as an Act. The number of Beats in the Bar defines the Time Signature of the Composition and typically defines how many Beats we get before a Chord Change, and how many Pitches, Notes and Tones are allowed within the Bar.</li><li><strong>Tempo</strong> — for a Composition the Tempo is not usually expressed in Beats per minute or a similar metric meter, instead use a scale of heavy, creeping, leisurely, moderate, brisk, hurried and hasty. With implied Difficulties, Obstacles, Hurdles and Stakes varying across Tempos.</li></ul></li><li><strong>Lyrics</strong> — Lyrics often contain narrative details that help flesh out the emotional story of the Composition, perhaps explaining the fear, or happiness with some words. Lyrics can have powerful effects on Extras, becoming almost a script they are using.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>The Types of Compositions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There are various types of Composition that a Yarn-Teller (or Conductor as they are often called because they "run" or "conduct" Compositions) can choose to employ, based on the Characters and Descendants that are available. Although they are given differing names, and can have special rules and uses, they all conform to the same rules of Compositions, and fundamentally behave in similar ways.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="characterCompositions" title="Character (and Descendant) Composition types"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>The Composition of Compositions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we use a lot of terms that borrow from music, especially when talking about Character Arcs. But the chief musical terms here are Pitches, Notes, Tones and Keys. Which with music are largely the same thing, but in T13, each is a unique point of the system that interacts with the other musical terms.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Pitches</strong> — Pitches are ideas put forwards by each Yarn-Teller during the Bar. Each Pitch asks Questions about the Characters involved in them, but also has a unique relationship with each Character via their Key and the Notes.</li><li><strong>Notes</strong> — Notes are how we think about the Plot like aspects of a Character Arc. Notes can bring back aspects of the Arc from earlier, foreshadow later parts, add Characters and remove them and so on. </li><li><strong>Tones</strong> — Tones are defined for a Scene and are not usually related to Pitches, but can be tied to Notes. The Tone of a Scene defines the sorts of things that can happen during a Scene. See Tones</li><li><strong>Keys</strong> — Characters have Keys set from their Geometry. This Key is defined as part of the Character, and indicates how the the Character is effected by Different Pitches and Notes.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Pitches</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Pitch is the name we give to notes or tones when they appear in Compositions. Characters have a Key defined by their Geometry (in fact the Character’s Geometry defines a lot about how they are represented and affected by the Composition. This is because Geometry is unaffected by the type of the Character. Jonathon “John” Smith the Solo is geometrically identical to Jonathon "John" Smith the Extra.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="name" name="John | Jonathon “John” Smith | Johnny, John Smith, Jonathon Smith, Smiffy, Mister Smith" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>John Smith here is an G♯ Character. So he will be drawn into any Composition that is in G♯ as it will resonate with his Character.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Depending upon the Compositions that surround him, he might even be drawn into more than one. However, there are also Compositions that he will not be "in-tune" with. These Compositions may either ignore him or have odd, unintended influences upon him. This will be up to the Yarn-Teller who is running (or Conducting) the individual Composition.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Pitches and Character Voices</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These are the absolute Pitches, each has an associated House. The House lists questions that the Characters (Players usually), and the Yarn-Teller Conducting the Composition, should ask themselves about the Characters. Each House also has a Ruler, an astrological sign and planets that we’ll look at later (see Astrological Rulers), as well as a list of Facets that share that Key and suggested Tones for the Pitch (see Tones).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="pitches" title="The Keys/Pitches and what they can mean"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>If a Composition is being improvised (rather than pre-written) Yarn-Tellers can Pitch different Pitches next. Each Yarn-Teller may choose a Pitch, by asking a Question. Then each Player of a Character affected by the Arc may select one of the Pitches that their Character will voice, Yarn-Tellers (and the Author or Player of the Character) may also add a Note at this time (see Notes). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During a Pre-written Composition the Pitches are preselected, but each Character in the Arc will still be offered a choice of Pitches from the Bar Chord that they may voice.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During a Bar each Character need not be present for every Beat, the Conductor of the Composition should decide who is present in a Scene according to the usual Narrative Logic, as well as what voicings are required for the Beat and Bar. So not all Characters will be necessarily be present and voiced at the same time (this allows a Referee or Yarn-Teller to focus more on the voicings that are present at that time).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Some Characters may choose to not voice a particular Pitch, or are not required to by the Conductor, instead they will Rest. If they are not resting then they will still suffer the Notes and the Tone of the Beat.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>All Voiced Characters will interact with the Pitch. They will have to "Answer the Question" the Pitch raises about the Character. Although this Question and Answering should not be thought of as a direct questioning. The Question the Yarn-Teller is asking such as "Who do you think you are?" should not be answered directly by the Character (no Character should state "I think I am a hero!" in response). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Instead, this is a case of show not tell, and even the Question the Pitch raises is not directly asked by the Conductor. So the Conductor should instead describe the Scene, but with the Questions in mind, "Who do you think you are?" is a question usually asked by someone with authority  (be it social, political, legal, religious, spiritual, etc) so this Beat or Bar should be set in a place of some public, official or private authority. The Conductor might put the Characters upon a public stage such as a television news show, or in the official chambers of a guild-master. Characters should show us the answers to the Questions the Pitches and Yarn-Tellers raised, through their actions and conversations. If the Player thinks the Character is a hero, they should show this through attempting acts of bravery and courage, not bravado and crowing.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Relative Pitch</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In addition to the Absolute Pitch, that is declared for a Beat or Bar, there is also the Relative Pitch, which is how the Pitch interacts with a Character’s personal Key. This Relative Pitch governs how the Beat will be experienced by the Character based on the different Intervals between the Character’s Key and the Pitch.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>We consider the Relative Pitch in terms of Semi-tone Intervals, to make counting these intervals easier we usually use a Chromatic Scale of 12 Pitches (although due to Octaves the actual Intervals we consider tends to be at most an Interval of 19 (the Perfect Twelfth), this could be expanded more to include perhaps as much as two Octaves, however the Octave adds less difference to the Interval beyond the Twelfth than we normally consider important. It is perfectly possible to consider Relative Pitches within a different Scale, such as a "Mixolydian" or "Locrian" Scale as part of a more advanced technique, where some Relative Pitches will become "Blues" Notes external to the Scale, which can have a separate effect on Notes. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You’ll note that different relative Pitches can have the same Character Effect, and so the Effects the Characters experience are on a separate table. This means two tables are required, with some quick looking up.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="intervalRatios" title="The Intervals of Relative Pitches"/]
[t13ne type = "displaytable" array="CharacterEffects" title = "The Character Effects"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The observant among you may have noticed that for any given pair of Pitches there are two available Intervals: </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So, if a Character is an A♯4 and a Composition has an A♯ pitch for a Beat, then that is a Unison which is Stressful for the Character in some way, or it can be treated as an Octave which is a Gain Event for the Character based on the Discard Pile top card. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Composition has a pitch of D instead then that can be an Interval of 8 (a Minor-Sixth: A Failure) or 4 (a Major-Third: A Relief) depending which way you count. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is usual to try to alternate between positive and negative effects on the Strong or Weak beat, but Conductors are not restricted in how they apply the Beats in anyway (see Beats). </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Astrological Rulers</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Absolute pitch is noted as having an Astrological Ruler. Astrological Rulers can be used in a number of different ways. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Astrological cycle progresses through the year with the Sun rising in each Astrological sign in turn (beginning and ending the year in Capricorn). This can indicate a Pitch based on the time of year.</li><li>Chinese astrology considers the cycle of 12 Zodiacal animals slightly differently, with each having a Year as well as period of time in the year. The Chinese Animals are related to but different from the Western Zodiac.</li><li>The Mayan Zodiac breaks the Zodiac into 20 Signs not the usual 12, with some overlap to the other two systems, but reuses those signs for each day of part of their calendar. </li><li>The Planets that rule each House have their own cycles and associations that can suggest a Pitch based on those associations. For example Mars is long associated with combat and war, so during a war perhaps a B Pitch may be suggested.</li><li>The Planets have associations in Magic and Alchemy that indicate sympathetic vibrations that the Planets have with the universe. </li><li>Astrological Signs and Chinese Elements can be used to grant Characters additional ways of Gaining Chi and Stress and Relieving Stress. These effects may be stacked, or be mutually exclusive depending upon the setting and game.</li></ul>
<!-- /wp:list -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="astrologySigns" title="Zodiac signs"/]
[t13ne type="displaytable£ array="fiveChineseElements" title="The Chinese Elements (5 Changes)" /]
[t13ne type="displaytable" array="planets" title="Planetary Correspondences and Meanings" /]
<!-- /wp:shortcode -->


<!-- wp:heading {"level":3} -->
<h3>Notes</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Composition Character Arc is unfolding, it is trying to tell a Story without a central Conflict. There is no Plot forcing a Story to unfold a certain way, directing and moving Characters about by Pushing Pressures and Pulling Tensions on Characters. Instead the Composition relies on Suspense being created by the interplay of Pitches, Notes, Tones and Keys.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Notes are used to bring some "Story-like" aspects to Compositions, Notes can be used in a lot of different ways. Depending upon the type of Note that is being used. Notes come in 4 main flavours.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Character Notes</strong> — Character Notes are obviously the most important Notes in a Character Arc. Character Notes can perform any of the following tasks <ul><li><strong>Enter / Exeunt a Character</strong> — Characters are not always around, and events in their own life can cause them to leave or move about. Friends and Allies can have things they have to deal with, (especially if they are involved in some Quest or Plot that is going on at the time) that can take them away for a bit, and Rivals and Enemies can always turn up in the darndest places, and they too have lives that take them away from time to time. Basically, if a Yarn-Teller is trying to say "This Character is not going to be around for some reason" or "Has returned from that thing they were doing" then this is the Note to use.</li><li><strong>Working Through Something</strong> — Characters are often "working through something", whether a Quest, Situation, Hurdle, Hitch, Ordeal, Test or Obstacle. A Yarn-Teller can use a Note to add one of these effects to the Bar. This is in addition to any particular Relative Pitch effects that might be occurring.</li><li><strong>Direction</strong> — sometimes a Yarn-Teller needs a Character to act a certain way, and the Player needs to be told some piece of information without resorting to a Flashback or Revelation. A Direction Note can do this, and is often passed to the Player without being read aloud. Yarn-Tellers are free to write anything on Direction Notes, "Act surprised when I reveal the Big Bad.", "Do nothing, this note is for paranoia purposes only", "You do not want them to discover the identity of the killer, because you are the killer." etc.</li><li><strong>Consequences and Repercussions</strong> — Characters do all sorts of things that can have all sorts of consequences and repercussions. These Character Notes are used to remind the Character of things they did earlier, and to make those earlier choices have some sort of Karmic or developmental impact so they can learn from the experience. Referees will often add consequences or repercussions for Characters if the Yarn-Teller responsible for the Character Arc forgets.</li></ul></li><li><strong>Setting Notes</strong> — Setting Notes are used to bring attention to the setting of the Composition for a number of reasons. <ul><li><strong>Change of Location</strong> — When a Character Arc leads a Character from one place to another, such as from their rural childhood home to their modern life in the big city, then a Change of Location Note is required. The importance of this is to usually emphasise the differences between the locations and the effects they have on the Character. Note also that Changing Locations can Add and Remove several Characters at once with a single Note.</li><li><strong>Season Change</strong> — Seasons are how we define periods of time in the setting. Typically a Change of Season Note will indicate the passage of time during a Composition. Sometimes the Season will refer to a an actual Season, such as how over the course of a Character Arc Winter may thaw into Spring, and then a hot Summer. But other times such a Season can indicate a major event within the setting, as the setting and all the Characters passes into a Season of War or a Season of Famine. </li></ul></li><li><strong>Story Notes</strong> — Story notes are Notes passed to the Composition from some Weaver such as a Plot (or Yarn-Teller). Referees and Yarn-Tellers often use Story Notes to nudge and guide Character Arcs especially when the Arc is a part of a Volume, Epic or Cycle. Story Notes are usually of the following forms <ul><li><strong>Lorics</strong> — Lore from a Plot can be applied during a Character Arc. If a Character receives a Lore during a Character Arc this may appear as a Loric Story Note.</li><li><strong>Atavistic</strong> — When a Character is an Embodiment of a Plot they are drawn into the Central Conflict of that Plot. Plot Suspense will usually do this when a Plot is active, but even an inactive Plot can fire off a Atavistic Story Note. This will make an Opposed Embodiment from that Plot Embody in the Bar or Beat. Examples of this include a Hazard, Test, Ordeal, Quest, Descendant, Character or Monster Embodiment.</li><li><strong>Continuity</strong> — Continuity Story Notes can be amongst the most important notes that a Character Arc can take. Continuity notes cover changes to the Setting caused by narrative causality. Say the king is killed sometime in the first Verse, well news of the death and coronation of the new king should be recorded in the Character Arc through a Continuity Note. The old king can no longer appear in the Character Arc, except perhaps as a Spirit or Dream Character. This takes precedence over Character Notes and Season Change Notes.</li><li><strong>Tonal</strong> — Tonal Story Notes are used to pass Tones into the Composition. Tones change what a Scene is trying to accomplish and can affect how well a whole Bar can work. (See Tones)</li></ul></li><li><strong>Blue Notes</strong> — Blue Notes are the final type of Note and are created by using a Pitch that falls outside of the musical Scale of a Character in the Arc. Blues notes have their usual Pitch effects, however something about the situation will be off somehow. Examples include <ul><li><strong>Genre-Phreaking</strong> — Pulling a Character or Descendant from a completely different context, such as a different genre movie, game or book and dropping it into a Character Arc is an example of Genre-Phreaking. It can be used delicately to <strong><em>Genre-bend</em></strong>, adding a little Romance or Mystery to a Fantasy tale  about Goblin Hunting Elves for example. Applied more vigorously it can <strong><em>Genre-Shift</em></strong>, as the Fantasy Elven Kingdom moves into war against a technologically superior Goblin foe, the Arc incorporates more War genre tropes. Applied with unilateral force Genre-Phreaking can <strong><em>Genre-Mashup</em></strong> where two or more Genres begin to merge, but are not quite syncretic, so Goblin scientists have created mechanical body-parts, and potion injectors to augment themselves for battle, but are still fighting Elven archers and mages. Then finally <strong><em>Genre-Smash</em></strong> is possible where a new genre emerges, from the blend, as Elves adapt and break beyond their traditional roles they adapt and wrap their bodies in living armour made from Ent-wood, shed Forest Dragon skins and Druidic blood magics. All the Yarn-Tellers embrace and adapt to their new setting genre of Mecha-Fantasy.</li><li><strong>Temporal Tampering</strong> — What can we say sometimes time-travel happens, and the universe can get Retconned. When this happens a Character Arc can be tampered with too, and Blues notes or Continuity Notes are usually the easiest way to deal with this.</li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Tones</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Tone of a Bar or Beat is very distinct to the Pitch, although it can be tied to them, it can make for a fragmentary and chaotic Character Arc. Typically the Tone of Scenes will change organically through Play, as Characters succeed and fail they will push different Tones upon the Scenes of the Bar, however more control than this is possible for Yarn-Tellers. They can shape the Tone directly, by card play and Notes.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetaspects" suit="all" aspect="Tone"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Each Scene should have a Tone chosen by the Yarn-Teller from the suggested Tones for that Pitch. Bars and even entire Compositions can have their Tone determined this way. Lyrics will however override Pitch, and if a lyric suggests Characters talking away into the night, then a Conversational Tone is probably called for.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Tempos and Tempo Changes</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>All Compositions have a Tempo, unlike in modern music this isn’t thought of as some "Beats per minute" number, instead we think of Tempo in a more Composition sensitive manner, more similar to the old Italian terms.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="compositionTempos" title="The Tempos of Compositions"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>These Tempos are considered fixed Tempos, but not every Composition will stick to the same Tempo, throughout. Compositions can change Tempo by simply jumping up or down in speed in the middle of the Composition, and this is usually considered normal, if a tad unusual. Typically, such Tempo changes will move only 1 or 2 steps, such as Moderate to Hurried and back, but there is no strict rule stopping a Composition from alternating between Grave and Hasty, but such a Composition will feel lurching and unstable (but if that’s what you are going for, more power to you). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In addition to jumping Tempos, there are the gradual changes: Accelerando, where the tempo accelerates slowly through the piece as time becomes short and the pace must increase, and Ritardando where the pace decreases and the tempo slows gradually through the Composition. Typically Accelerando is used when time is running short for some reason, and Ritardando should be used when a situation is worsening or collapsing.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Accelerando can even begin very gravely, but every few bars the Tempo climbs by one step. Ritardando causes the Temp to slide down a step every few bars. While it can seem tempting to use Accelerando and Ritardando exclusively the set Tempos may work better for any given arc than either. Accelerando is very specifically intended for when time is running short, and Ritardando is very specifically intended for when a situation is collapsing and getting worse.</p>
<!-- /wp:paragraph -->

'),
array('RulePage'=>'Drama', 'Description'=>'<!-- wp:paragraph -->
<p>Drama in T13 is a result of the Suspense in the Plot, and Stress in the Characters, bubbling over. When Drama occurs the Yarn-Teller should assess the current state of the Game and Story and decide how to move forwards. Sometimes, the Drama created by the system will be appropriate, sometimes it won’t, but Yarn-Tellers can adjust the result if necessary to create better Narratives. For example, if a Prod is rolled and perhaps a Hook was suggested, but every Embodiment Character is engaged fully with the Plot, then a Prod is out of place and redundant. Instead, the Yarn-Teller should ignore the listed Drama and add an Atmospheric, Hazard or a Break instead.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Tellers can use a moment of Drama in a number of different ways, depending upon the Genre, Tone and the specifics of the Tapestry or Plot. Drama might be a jump scare, a touch of world-building, a nudge, complication or an aside from the main narrative. Drama is always broken into the following types:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="suspenseDramas"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":2} -->
<h2>Dramatic Systems</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Drama occurs naturally in real life, we don’t need to invent or inject it. Our emotions, successes and failures combine to create a natural Drama that we live through as the story of our life. In stories Drama needs to be injected, the author raises and controls Suspense, making the audience worry about Characters and their situation. In a gaming context, we need to build Suspense and create Drama in other ways. So we have some Dramatic Systems that we use to inject that Drama into the game and the narrative.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are a number of ways that Drama can be injected by the game by the system, they are in no particular order.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Player Choice</strong>: Characters can become awash with Stress and Strains, placing them one mistake away from being Shocked or suffering Traumas. To avoid this fate a Player can elect to relieve Stress with Drama (subject to the Dramatic Stress Limit).</li><li><strong>Shock Dice</strong>: Shocked Dice (that are Stressed or Strained beyond their limits) can roll a result that will create Drama (or at least the opportunity for Drama).</li><li><strong>Drama Dice</strong>: Drama Dice can directly create Drama from the Drama Pool.</li><li><strong>Drama Cards</strong>: Yarn-Tellers can create Drama on each other and other Characters, by using their Yarn Cards as Drama.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Drama Dice Pool</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we can model Dramatic Tension or Suspense with the Drama Dice Pool. Each Drama Die that is added is rolled into the Drama Pool. Drama Dice can vary a lot depending upon who is adding the Drama Die and why they are adding it. Drama Dice Pools can vary in size, but always begin with 0 Dice at the start of the episode, or session (although Drama Dice Pools can be preserved and recorded to continue later if need be. Typically only the size of the Pool is recorded when this is used. With the Referee rolling this new Drama Dice Pool at the start of the new session.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Various players can add additional Dice to the Drama Dice Pool at various times.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Characters typically add Character Drama Dice when they wish to Relieve Stress with Drama.</li><li>Yarn-Tellers may add Atmospheric Drama Dice to the Drama Pool for 1 Chi when they are narrating.</li><li>Yarn-Tellers and the Referee can add other Drama Dice, each Plot should have its own Drama Dice and Pool type which varies how, when, and what types of drama can occur.</li><li>After any change in the Dice Pool size or composition a Yarn-Teller can reroll the entire Dice Pool, potentially creating Drama, for a cost of 1 Yarn. This is usually used if a Character removes Drama Dice, but the Yarn-Teller wishes to raise Suspense immediately or if adding an Atmospheric Drama Dice didn’t create Drama when they wanted some.</li></ul>
<!-- /wp:list -->

<!-- wp:shortcode -->
[T13NE type="tabledisplay" array="dramaDice" title="Drama Dice Types"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":4} -->
<h4>Triggering Drama</h4>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li>Drama is triggered and created by two (or more) dice rolling the same number in the Drama Pool. The type of dice rolled does not matter a 1 is a 1 whether rolled on a D20 or a D2</li><li>Plot Authors (current Yarn-Tellers) and Referees can set Plots to have specific Drama Dice (see above table) and Drama Pool Types as follows: [t13ne type="tabledisplay" array="dramaPools" title="Drama Pool Types"] </li><li>A single Die cannot create Drama alone, ever. <ul><li>Not in a Void Pool, even with ignored Dice.</li><li>Not if the Character is Overstressed</li><li>Not if the base required for Latent Drama has been lowered to 1.</li></ul></li><li>Any Drama for any Plot can be triggered, but typically the smaller Pools will trigger more often, because of this the largest Pools are given preference, if 3 1s are rolled in the Drama Pool, if no Fire Plot is currently available, then a Water Plot could trigger off 2 of the 1s and create an Atmospheric instead.</li><li>It is possible for multiple Plots to trigger Drama simultaneously, but they cannot use the same dice. If five dice were rolled and rolled 3 4s and 2 3s the Water Plot would create a Hazard and the Fire Plot would create a Prod. When this occurs both Yarn-Tellers are current, although they can only narrate their own Plots, the Referee may direct the order of narration (largest Plot / Pool first / by Drama Type e.g. Numerical Order, etc) or they may compete to narrate as usual.</li><li>The Drama Pool can grow to a maximum size that will then Trigger Drama regardless of the numbers rolled on the Drama Dice. We call this Latent Drama, and the Pool’s maximum size is called the Latent Drama Pool Limit. The Latent Drama Pool Limit is usually set by the Yarn-Teller (or Referee or Author) from the current Scene’s Suspense Level Latent Drama Pool Limit.</li><li>Latent Drama completely empties the Drama Pool when it occurs, so Latent Drama can only occur infrequently.</li><li>Only one Plot may claim Latent Drama at a time, the Plot must be present in the current Scene, and ideally should be a "parent" of the current Scene. Smaller Stories and Arcs take preference over Volumes, Epics and Cycles, generally.</li><li>The same Plot can only claim Latent Drama up to 3 times in a row, and then another Plot (often a grandparent Plot) <strong><em>must</em></strong> receive the Latent Drama.</li><li>Characters who are Overstressed on any Die require 1 less Drama Die than normal to trigger Drama (think of the Overstressed as rolling an extra die with every result (although again they cannot trigger Water Pools with only 1 Die).</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4>Latent Drama</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Latent Drama unlike normal Drama is inevitable, rather than random. Random Drama may postpone the Latent Drama, but eventually the Latent Drama should occur. It is because of this that Latent Drama can only be claimed by the same Plot upto 3 times in a row. Ideally Yarn-Tellers should vary the Latent Drama as much as possible, swapping which Plot receives the Latent Drama each time, but it is not always possible, and sometimes you want to focus on one Plot for a time. However this 3 Latent Drama Limit forces Yarn-Tellers (or Referees) to change it up eventually. Because Latent Drama is not random it does not randomly decide what Drama occurs. Instead Latent Drama is both formulaic and gives the power to the Yarn-Teller as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Latent Drama always includes an Atmospheric or Narrative Moment. The Latent Drama will always ground the Drama in the world somehow, usually by use of a genre specific Atmospheric or Character-driven Narrative Moment.</li><li>Latent Drama always creates additional problems for the Characters when it occurs. So Latent Drama will always add a Hazard often a Fray (although note that Hazards should always be appropriate for the Suspense Level).</li><li>Latent Dramas may additionally act as a Prod, Break, or Ratchet for any Character or the Plot, but it may only act as one. Typically Latent Dramas will work Plot Ratchets first (especially if the Ratchet has not been used yet), Prod Characters (targetting the ones who are most unengaged with the Plot), or give Characters a Break (targetting the Characters who are most injured or deepest engaged in the Plot) with that priority.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4>Drama Storms, How We Avoid Them, and Why We Sometimes Don’t</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When Characters are over-stressed, especially in smaller pooled, higher Suspense Plots, then it is possible for Drama to trigger immediately after another Drama. When this happens it can feel like the Drama is taking over. This is called a Drama Storm, where the Plot or Yarn-Teller loses control of the Narrative as Stress and Suspense Levels take over as the major forces. Drama Storms may seem like they might be fun, but they can overtax the Yarn-Tellers and Referee. So instead of letting Drama Storms just happen continuously&#8230;</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Immediately after rolling to create Drama, the Drama Dice that rolled the same results are removed from the Pool. If, for example, six dice roll the same result triggering Drama (or possible Dramas if Water or Fire types), but this removes those 6 Dice from the Drama Pool. This decreases the chance of more Drama immediately occurring. Although Drama Storms are still possible in large Drama Pools they should quickly empty the Pool and stabilize.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule: </strong> When Drama occurs the Yarn-Teller (or Referee) can elect to remove additional Drama Dice from the Drama Pool. This is always based on the requirements of the current Plot, which will not want too much random Drama occurring during certain dramatically important Scenes, as random hazards, breaks, prods and even atmospherics can make for a confusing element if they coincide with an intended Story Beat, especially a Revelation or a Hook for some new larger Plot. It can appear tempting to remove additional Drama Dice if many Characters are already Overstressed, Strained and Shocked, but this will reduce the chance of Drama reducing these Characters’ Stress, instead allow or even encourage the Drama Storm, hand out Breaks, Atmospherics and Hazards and once the Drama has unfolded the Characters should be less Stressed and able to continue.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Suggested and Rejected Drama</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When the Drama Pool dice roll the same number that creates Drama. The exact type of Drama created is <strong><em>suggested</em></strong> by the number the Dice rolled. There are after all 6 types of Drama and 6 sides to a d6. It only makes sense that if you roll six 3s then the Suggested Drama is a Hazard.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Of course, if the Yarn-Teller does not concur with the randomly rolled Drama (or cannot work out how to integrate it into that Character’s or Plot’s current narrative) then they can reject that Drama in one of two ways. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Reject the Drama Type</strong> — The Yarn-Teller believes that Drama Dice has rolled a result that makes no narrative sense for that Character, but the Character does deserve some dramatic attention and so the Yarn-Teller can change the Drama Type to something more suitable. However, this change is not free and will cost the Plot or Yarn-Teller 1 Yarn.</li><li><strong>Reject the Target</strong> — Sometimes the Drama is perfect for the setting, has perfect timing and makes perfect narrative sense, just not for the current target. When this is the case the Yarn-Teller can redirect the Drama to another Character for a cost of 1 Yarn. The Character that created the Drama should automatically lose 1 Stress, Strain or Shock regardless, but will not lose Stress, Shock or Strains from the Drama. The Yarn-Teller should also play a card as a Drama on the original Target, which they can select from their Hand or Pool.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>The Character that created the Drama should automatically lose 1 Stress, Strain or Shock anyway. If their Drama is rejected their Player can Play any Wyrd Tarot or Ordeal Card from their Pool or Hand as a Stress Effect on the Character, which may create a Trauma under the usual circumstances. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Yarn-Teller can redirect the Suggested Drama, however, redirecting say a Prod to a Character who needs Prodding instead of the Character who triggered the Drama is not entirely free. First, the Character that rolled the Drama has to have their Drama rejected, as above, allowing them to reduce their Stress.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Secondly, the Yarn-Teller must spend 1 point of Yarn to redirect the Drama to a Character that needs it. This might direct a Prod at a Character who is ignoring the Plot or a Break to a Character who is too invested or Stressed.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Card based Drama</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yarn-Tellers can play cards as Drama. They simply play the card they wish to use and claim it as Drama, just as they can play cards to create new Scenes or even new Stories as easily. In fact, creating Drama should be cheaper, and in terms of cards is generally cheaper as a single card can define at least some Dramas. You can see how the cards are used on the Suspense Dramas table above. The Cards can of course also suggest Drama in other ways, for example a Hazard suggested on the card may be perfect.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Atmospherics</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Atmospherics are simple "flavour-text" events that happen to keep the Player (and Character) tension up, or can relieve some tension and relax the Suspense. Atmospherics relieve 1 Stress from the Stressed Character, as they experience some relief from the Stress of the Situation, but not much. They can also indicate a change of Suspense Level up or down one. Atmospherics are commonly genre specific and can and should vary considerably. Every Location and Story should have a least one example Atmospheric that you can use once or twice. Some good examples include: </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Contemporary genre specifically uses Atmospherics to ground the story in the current Era. Social media notifications (in the very modern day), news coverage (from apps, TV, radio, newspaper vendor, or a herald depending upon the era), real world events, spilled drinks, sticky floors, shouts from the street, nearby traffic noise (perhaps occasionally a crashing noise), distant sirens / bells or owl hoots.  </li><li>Horror specifically uses Atmospherics to add spooky factors to otherwise mundane activities (an ill omen such as an owl screech, strange knocking or scraping noises outside, off-colour skies, a door they know was closed is found open, or even a glimpse of something terrible).</li><li>Cosmic Horror often uses Atmospherics to enhance the sense of despair and existential angst that floods the genre. Bizarre corpses, unexplained illnesses, odd individuals (specifically Extras that seem "off" somehow), or  unusual languages, texts or artistic endeavours, madness and terror run hand in hand in Cosmic Horror too, unsettling atmospherics serve both.</li><li>Fantasy usually uses Atmospherics to imply a sense of the extra-mundane. Weird tracks in the forests, odd foods or flowers, strange noises from a bush, weird glowing writings, enchanted mushrooms, and monstrous corpses, statues or skeletons.</li><li>Dark Fantasy uses Atmospherics like Fantasy, but emphasises the grim reality of the world. Things like starving peasants, lame animals, strange smells, beggars, animal dung, and the occasional gibbeted criminal. </li><li>Science-fiction uses Atmospherics as part of world-building, such as watching the two suns set, observing an unusual alien as it glides past, weird holographic advertising drones, minor malfunctioning robots, sunlight catching the planetary rings, glinting off a space station, sky hook, or defence shields, or watching an armoured moon rise.</li><li>Cyberpunk uses Atmospherics like science-fiction, but also adds in more punk and noire aspects that act to ground the science-fiction in piles of grit. Flickering LEDs flash in piles of garbage; drug-dealers push their genetically modified, synthetically engineered and designer wares; surveillance drones hum and patrol overhead, issuing fines electronically direct to your phone; flickering screens flash personally selected advertisements at any persons retina that points their way, while overly loud and catchy music from a dozen shops and floating signs mix into a pink noise that sets the nerves on edge as it force pumps nostalgia direct into the ears.</li><li>Steam-punk combines Cyberpunk with Fantasy to create a blend of the two, only with even more smoke and noise. Distant engines, oily smells, clouds of smoke, clanking automatons, distant air ships, sudden klaxons, sirens, bells or whistles as some eccentrically engineered invention rattles past, holes punched in ticker-tapes hiss through reels as ticking but sonorous auto-orchestras, belt out advertising jingles and military marches, and just occasionally, a sprinkle of faery dust and soot.</li><li>Science-Fantasy blends the best of Sci-Fi and Fantasy together, and so its Atmospherics blend the two as well. Ancient space ruins, weird aliens with laser swords, barbarians with plasma guns, robot slaves working and secretly planning a revolt, space-wizards with special effects, or crashed space cruisers are all valid Atmospherics.</li><li>Thrillers usually uses Atmospherics to ground the story and give some sense of a broader conspiracy. Strange overheard conversations, news coverage of Embodiment Characters, a sense of being watched, strangers in town asking questions, or hearing a strange noise when ending a phone call.</li><li>Comedies usually uses Atmospherics as a set up for a later joke. Although the occasional jump scare or surreal event also appears. Weird behaviour, funny posters, bizarre character names that turn out to be important to a pun later are all good choices.</li><li>War stories and Disasters usually use Atmospherics to remind the Characters (players and audience) how dangerous the situation is. Distant explosions pounding the souls of your feet before the sound reaches you, acrid scents tinge the air, as unknown materials smoke and burn, and who knows what chemical weapons drift on the wind, zinging ricochets impact walls and floors near the characters, the sky makes a sound like unzipping thunder as one side’s air support overflies the area, burning rubble shrieks as though tortured as it collapses under its own weight, twisted metal skeletons mark the graves of buildings, machinery and crashed vehicles, some remains of a telephone exchange, power substation or industrial centre flashes and showers sparks around as it goes, half-skeletal corpses litter the streets, encouraging the more adventurous rats out in the daytime, spent ammunition cases jingle as they are kicked by marching boots, and sliding into a water-logged crater to claim its cold, wet mud as cover, only to discover the gas victims that line the pool, are all good War Atmospherics.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Narrative Moments</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Narrative Moments are small (usually social) events that examine some aspect of the Character. Narrative Moments are intended to represent a moment of characterization, perhaps revealing something about a Characters nature or persona that wasn’t shown before, but they can also become a Break from the Plot, or a Prod in the right direction from another Character, if that is needed. While Narrative Moments can become Prods and Breaks if needed, they generally focus on mundane and social situations and interactions that are at best peripheral to the main Conflict and are usually far removed. Narrative Moments usually relieve Stress based on the Facet Dice of the Character’s Narrative Moment Facet (e.g. A Narrative Moment for a Character with a Fury of Boon 19 would create "Fuel for the Ire" which will then relieve 1d8+1 Stress). Narrative Moments are associated with specific Facets (and can therefore be determined randomly from Cards as required). Some solid examples include:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type = "facetsuitaspect" suit="all" aspect="Narrative_Moment" Title ="Narrative Moments by Facet" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Hazards</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Hazards are events that pose some danger or threat to the Character. They vary with the Suspense Level, current Stress, and Stakes significantly and come in a number of different types. Hazards can be anything from a  slippery wet floor, through wandering monsters, to a random stop by a psychotic cyborg cop.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hazards vary in Stress relieved by Type, but have a minimum of 2.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="narrativeHazards"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Prods</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Prods are events that happen to the Hooked Characters either when they ignore the Plot, the Plot thinks they are ignoring the Characters on the other sides of the Conflict, or their Player underplays the Suspense Level in their roleplay and the Yarn-Teller feels they need a reminder. Prods can also raise the Suspense Level or Stakes of a Scene, should the Yarn-Teller or Referee feel it necessary.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Prods can vary greatly in what they accomplish and should be tailored to the Character and Plot or Scene that is being played through. Prods generally relieve 2 Stress. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Essentially a Prod is like an Auxiliary Hook, if the Character wasn’t Hooked well enough, they may need a Prod to keep them involved. That isn’t to say that there was some failure of the Hook, necessarily (although that can be the problem sometimes), but rather that even the best players, and most dedicated Characters need a Prod in the right direction sometimes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You may also need to tailor particular Prods for particular Players. If Geoff is always ruining the drama between two other Characters with off-colour jokes, and inappropriate comments, then perhaps it would be appropriate for the town-guard to find his humour less than respectful, and for him to spend a night in the cells, or having to pay a hefty fine. Similarly, Janet, who plays a red-suited mercenary superhero type, insists on making apparently fourth-wall breaking comments, that Janet apparently thinks she’s making out-of-character, she might be surprised to have the head of the tech firm she’s working for respond to the comment, and have Janet’s Character sectioned and treated for their delusion.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Be careful with using Prods on Players this way though, everyone should be having fun, even Geoff and Janet. These sort of Prods should only be used if Geoff, or Janet, are ruining the game for others, if everyone laughs at Geoff’s jokes and then is straight back to the action, or enjoys Janet’s meta-commentary, and it leads them to realise some plot point that they had actually overlooked, then all is good, don’t Prod them. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Of course, if Geoff’s jokes are getting in the way, like he made everyone laugh when they were supposed to be sneaking, or Janet keeps telling the guys she’s fighting that they can’t hit her with a 7 then absolutely use the Prod. Just remember that the Prod <strong><em>has</em></strong> to move the Conflict on somehow, it isn’t a punishment for Players, it is a Narrative Device that raises the Suspense Level or Stakes, and pushes the Story forward.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Perhaps Geoff, after getting arrested, hears word of a criminal mastermind who fits the description they have of the baddy. Or maybe Janet discovers that the Doctors in the Sanatorium that she was sent to are all heading into the basement every eighth day wearing red robes and masks, just like the cult they were trying to track down (they could be another "cell" or the people they are looking for).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is good practice to create a Prod for each Scene you are creating as an Author, just in case the Players try to ignore or bypass this Scene. In these cases, the Prod may be obvious, such as if the "Lord of Light" is gathering his troops for battle and the Players decide to ride away, the Prod would indicate that the Lord of Light should capture the town, and will have plenty of time to find out from the inhabitants who was there before he arrived, also rumours of the PCs cowardice in the face of the "Lord of Light" might may start to spread, probably only a few hours behind them.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Prods can vary in type greatly, and should really be specific to the Scene and Plot, but here are some simple, generic examples to give you some ideas:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="narrativeProds" title ="Prods" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Breaks</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Breaks are in many ways the opposite of a Prod. Where Prods try to move the Conflict forward, raising the Suspense and drawing the sides together so that the Plot’s Conflict is resolved, Breaks pause the Conflict, lowering the Stakes and the Suspense, pushing the two sides further apart again.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Breaks are especially useful if the Player Characters are being a little too efficient in tracking the bad guy down, or have worked out his scheme from the very first clue that the Yarn-Teller dropped. You don’t want the PCs to skip through your prepared materials too quickly, after all. Breaks can also be ideal if a Character has been badly injured, or is very Stressed, has a lot of Strains or Shocks.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Breaks relieve a Character all current Stress, as such they are the perfect way to calm things down for a Character who is Overstressed, Strained or Shocked. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Breaks can also be useful for the following reasons.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Ssupense has ramped up too high, or too quickly, and needs to be calmed down again.</li><li>Players are acting out a higher level of Suspense Level than the Scene.</li><li>Characters are already very Stressed, perhaps even Shocked, and you know the Plot is about to make things worse for them, and think a little Break may help.</li><li>Characters are advancing the Plot too quickly and you need to slow their progress to control the pacing.</li><li>Everything is out of control, you have no idea what is happening and really need some breathing space and thinking time.</li><li>The Stakes and Story have spiralled out of control and you are about to kill, or have killed, a Character you did not mean to target.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Basically, if Ted keeps insisting that they must storm the castle right now, when you’ve got a whole campaign about raising a peasant army planned, he needs a Break.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Break should reduce the Suspense Level of the Scene, by at least one, and can even reset it down to Suspense Level 0: "Exhausted" under the right circumstances. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Breaks, like Prods should be specific to the Story and Scene, and are usually prepared beforehand by the Scene Author, but using a generic emergency break is sometimes necessary — especially to calm Ted down. You can get an idea of what might constitute a suitable Break from some generic examples:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="narrativeBreaks" title="Breaks" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Ratchets</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Ratchets are a type of Drama that connects the Suspense and Character Stress to the Narrative directly. Ratchets are sometimes one way ladders of events that will occur during the plot. Some may be actual timed events, but they trigger when appropriate to the Suspense and relieve Stress when they do. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Ratchets vary in cost greatly, with a minimum of 1 Stress each Level. Ratchets can have specific Stress costs at Specific Levels as the Yarn-Teller, Author, or Referee prefers.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It should be noted that the more stress-inducing a Ratchet is meant to be the lower its Stress relief should be. A Ratchet that is meant to allow relaxation should have a higher Stress relief. An Average Ratchet Stress Relief should be around a 6 and can vary between 2 and 10.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Ratchets should be events that are specific to the Story being told. Although there are some "generic" Direct Suspense Level Ratchets that can apply to any Pulled or Pushed Character Embodiments, and could be set up for any potential Conflict. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Some examples might include:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Dominant vs. Pressed Sides of the Story represent a fairly repeatable pattern of events tied closely to the Suspense-Level.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Suspense 0</strong>: Dominance is impossible without some Tension or Pressure. Embodiments of different Sides of the Conflict should not meet at this level, in fact they can only be present in the Scene together if one, or both, aren’t conscious.</li><li><strong>Low Suspense (1-3)</strong>: Active but limited displays of Dominance can occur, such as privileged, bullish, or other negative behaviours. Pressed side may become aware of Dominant Embodiment through Revelations, but not their actions directly.</li><li><strong>Medium Suspense (4-6)</strong>:  Pressed side has at least one negative encounter with an representative of the Dominant Side. Dominant side will demonstrate dominant behaviour such as ordering the Pressed Side, mild insults and ignoring them.</li><li><strong>High Suspense (7-8)</strong>: Embodiments should appear in a Scene together, this may be cordial, formal, a press event, whatever. This is the moment the Pressed Side reveals themself to the Dominant Side by behaviour and speech. From this point forward it should be obvious who the Dominant Embodiment is. Pressed Embodiments should feel the approach of the  Dominant Embodiment (or a representative). There will be some demonstration of Dominance, which will involve 2 Failure Levels on all Pressed Actions.</li><li><strong>Open Conflict (9-10)</strong>: The Dominant Embodiment will focus their attention and power on the Pressed Embodiment. The Pressed Embodiment may believe they have some advantage over the Dominant Side. They may be wrong, or very wrong. The Dominant Side will hurt someone, usually the Pressed Side or a Pressed Ally. The Pressed Side should be injured, insulted or humiliated by the Dominant Side during.</li><li><strong>Tragic Conflict (10-11)</strong>, Either or both Embodiments have to be badly injured (Maim or worse) by the end of the Scene. An Ally of one Side (usually the Pressed Side) may sacrifice themself to protect their side’s Embodiment. Dominant Side may express or be replaced by Monster Embodiments. Dominant Side Embodiments that are injured (or killed) may be augmented or replaced by Monster Embodiments.</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Often a Ratchet will not have Suspense Levels noted, instead each time the Ratchet is "activated" the Ratchet will climb or fall a layer on a Ladder-like Ratchet such as this one, for a Security Guard Ratchet.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>Guards actively asleep at their posts, missing or unconscious. 1 Success Level on Hide or Sneak attempts. Relieves 10 Stress.</li><li>Guards bored and distracted: no special rules. Relieves 8 Stress.</li><li>Guards are alert, but stationary : 1 Failure Level on Hiding or Sneak attempts. Relieves 6 Stress</li><li>Guards patrol, looking for intruders, but not expecting to find them: 2 Failure Levels on Hide or Sneak, 4 Stress.</li><li>Guards are aware there is an intruder: 3 Failure Levels on hide or Sneak, 3 Stress relieved.</li><li>Intruder alarms are ringing: 5 Failure Levels on Hide or Sneak. 2 Stress.</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Which will work for most infiltration Ordeals or Stories.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Then there’s :</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>Strange smells on the air (Low Suspense), 10 Stress</li><li>Animals behave strangely (Low Suspense), 8 Stress</li><li>Rumbling noises, but no lightning (Medium Suspense), 6 Stress</li><li>Birds leave the area (Medium Suspense ), 5 Stress</li><li>Strange auras around the mountain at night (High Suspense), 4 Stress</li><li>Volcano erupts (Open Conflict), 3 Stress</li><li>Pyroclastic flow engulfs your side of the volcano (Tragic Conflict), 2 Stress</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Which can be modified for almost any disaster situation. Ratchets can be easily built for any Scene, Act, or Story adding complications to any situation as the situation responds to Character Stress, Shocks and Drama rolls.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Dramatic Challenges</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Referee or an Author (which might include a prepared Yarn-Teller) can set a Dramatic Challenge, a Dramatic Challenge occurs as a special example of Drama. The point of a Dramatic Challenge is to decide which Yarn-Teller gets to narrate the Drama that is occurring, and the winner of the Dramatic Challenge will usually take the narrative lead on the rest of the Story. A Yarn-Teller might declare a Dramatic Challenge to hand away Narration duties so they can concentrate on their Character for a bit.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Referee (or Author) declares a Dramatic Challenge as well as the Drama such as Hazard.</li><li>Only Yarn-Tellers (and their ilk such as Demon-Lords) can be involved in Dramatic Challenges. Heroes, Grunts, and even Goblins and Demons cannot Narrate and so cannot participate in a Dramatic Challenge.</li><li>Each Yarn-Teller must bid Stress that they are willing to take and describe their version of the Drama (e.g. "4 Stress for a Failure Hazard", etc). The Stress Bid is unrelated to the Stress relieved by the Drama as the Target of the Narration will be relieved.</li><li>Yarn-Tellers, beginning with the highest bidder, will take the Stress that they Bid and add it to their Stress. <ul><li>If the highest Bidding Yarn-Teller is not Shocked by the Stress they just took, they will now Narrate the Challenge Drama. The Dramatic Challenge is won. Other bidders will now lose Stress equal to their Bids.</li><li>If the Character is Shocked, or if all their Dice are Overstressed after taking the Bid, they immediately take a Stress Effect (usually a Trauma) and drop out of the Challenge. The next highest bidder will now take the Stress they Bid and repeat until a winner is found or every Yarn-Teller is Shocked.</li><li>If all Yarn-Tellers are shocked then narration reverts to the Referee, until the first Yarn-Teller is not Shocked again, when they will take over.</li></ul></li></ul>
<!-- /wp:list -->'),
array('RulePage'=>'Stress','Description'=>'<!-- wp:paragraph -->
<p>Each Character and Descendant also has Stress. Stress can be thought of as being related to Sway (particularly Chi) and perhaps Twists. Stress has a number of related forms, Stress itself is the most common, then we have Strains, Shocks (which are quite common) and finally Traumas. This is a complex relationship as you will see.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Gaining Stress</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Characters and Descendants can gain Stress in a number of ways. Usually Stress is gained in small amounts from a variety of sources, although it is possible for a combination of events to add vast amounts of Stress in a single catastrophe.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Hitches can add Stress via Orthodox Stress Gnarls.</li><li>Characters may Gain Stress from their Geometry, and additionally from Astrological signs, or a number of other Character choices (that are often Game or Setting specific).</li><li>Characters may Gain Stress from their Personas, note the Gain Stress component of what the Persona Avoids for each.</li><li>Characters Gain Stress from their I-Ching. Each Hexagram provides a mechanism for the Character to Gain Stress, typically a Character will have only one method active at a time (either the Present or Future). Typically the Hexagram that last gained <em><strong>Chi</strong></em> for the Character is considered the active Hexagram. Only the active Hexagram can Gain Stress. This adds an additional complication of tracking the active Hexagram, although a single coin can track Present or Future with Heads and Tails, it must be flipped over when the appropriate Chi Gain is made.</li><li>Some Wounds and Emotional Effects can create Stress for the Character.</li><li>Some Nimbeds and Glows can create Stress in others.</li><li>Characters can gain Stress from other Characters directly (Stress can be passed between Characters and spread).</li><li>Embodiment Characters also gain Stress from their active Plots. This is particularly common in Higher Suspense Scenes and Conflict Scenes if Characters do not engage with the Plot’s other Embodiment Characters directly.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Typically when a Character Gains Stress they Gain 1 Stress. Although some Settings can and will alter this.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule</strong>: Characters can Gain Stress as though it was Sway or Chi. This is usually to make a more Dramatic Setting, such as a Superheroic setting, or a more tough survival experience. In the Cosmic Horror genre, for example, any encounter with the Horrors themselves will cause a Gain of 1d6 Stress. In general, higher levels of Stress make for grittier settings and stories, but lots of Stress can mean lots of Distress and Traumas, so there is a balance to be found. A good way of balancing additional Stress is to allow Characters more options in Relieving Stress. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Teller Characters may also Bid Stress on Dramatic Challenges (see <a href="/drama/">Drama Rules</a>), this Bid is how much Stress the Character is willing to take in order to continue the Narration.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule</strong>: Negative Emotional Effects in addition to potentially creating Psych Wounds, can also add Stress to the Target. Stress is usually calculated differently depending upon the type of game. In Banal games each card adds its Pips to the Character’s current Stress. In Intrepid Games this becomes the Pips Reduced (1-4 each card). In Bold Games this becomes +1 Stress only for any Wound card greater than Flesh (8+ Pips) reducing Stress gained greatly. Note that some Characters will Gain or Relieve Stress when effected by Negative (or Positive Emotions). They will make their normal Stress Gain in addition to any specified by these Rules, but typically ignore Stress Gains if they are Relieved by the Emotional effect.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can cancel gaining a point of Stress with a point of Chi, but all the Stress gained must be cancelled at once. If a Character gains 22 Stress they can’t pay 21 Chi to gain 1 Stress, but they can pay 22 Chi to gain no Stress.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Storing Stress</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Characters and Descendants can both store Stress in the same ways. Stress can only be stored on a Boon Die, so Descendants can only store Stress on their Annex Dice, where Characters can store Stress on their Annex and Facet Dice. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Die can only safely store as much Stress as the highest Score the Die can roll. So 2d6 can store up to 12 Stress. This is called the <strong>Stress Limit</strong> of the Die.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Die has a Limit based on the Minimum roll +1. This is called the <strong>Stress-Strain Limit</strong> of the Die and is important for determining when Strain Dice may be rolled (see <a href="/starins-and-straining-dice/">Strains and Strain Dice rules</a>)</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If a Die has any Stress stored on it, then it is called a Stressed Die. If a Die is storing Stress equal to the maximum rolled Score then the Die is considered Overstressed.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule</strong>: One way that Stress can be recorded in game session is by setting an appropriate Annex or Facet Die to the current Stress. Each time Stress is added, lost or spent the Die is changed to match the new Stress. Current Stress should be noted before rolling the Die for any purpose so that it can be returned to the Stress stored after the roll. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Stressed Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An Annex or Facet Die that has any Stress stored on it is called a Stressed Die (plural Dice).</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>A Stressed Die can store Stress up to the Maximum roll of the Die (the Die Stress Limit).</li><li>The Stressed Die’s minimum roll plus one (+1) is known as the Stress-Strain Limit and is important for Strains and Straining Dice. It is the minimum Stress that must be stored on a Stressed Dice to allow it to become a Strain Dice.</li><li>A Stressed Die can spend Stress to add bonuses to rolls or to purchase Dramas according to the current Suspense Level.</li><li>Spending less Stress than the Stress-Strain Limit will add a +2 to a Roll of that Die or +1 Pips to any Played Card per point of Stress spent.</li><li>Spending more Stress than the Stress-Strain Limit will result in the creation of a Strain Dice (see Strains).</li><li>Spending Stress on Strain Dice often creates Strains that must be stored on the Stressed (or now Strained) Die.</li><li>Filling a Die with Stress to the Stress Limit (Maximum Roll) will turn the Stressed Die into an Overstressed Die (see Overstressed DIce).</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Overstressed Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An Annex or Facet that has Stress equal to the maximum Die roll for that Boon (the Stress Limit) is considered Overstressed. An Overstressed Die cannot store more Stress for a Character or Descendant. Any attempt to store more Stress on the Die will instead convert Stress to Shock (see Shocked Dice). An Overstressed Die cannot spend Stress to improve rolls and cannot add Strain Dice, but can still spend Stress on Dramas when appropriate.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule: </strong> Whenever a Character with an Overstressed Die gains Stress they may spend that Stress to add a Die (usually a D6) to the Drama Pool regardless of the Dramatic Stress Limit.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When a Character has an Overstressed Die and they interact with another Character socially, 1 Stress will be Relieved from each Overstressed Dice and added to the the Character that they are interacting with.</p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h2>Stress Relief</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Characters can Relieve Stress, getting rid of it before it accumulates too much, in a number of ways. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>A Character’s Name Germatria and Geometry define at least one way a Character can Relieve Stress. Additionally I-Ching and Astrology can be used to create additional Stress Reliefs (at the cost of additional Stressors).</li><li>Stress can be Relieved by Dramas, but exactly how depends upon which rules variant you are using (see below). Some Settings, Stress and Suspense Levels will create Drama more consistently than others.</li><li>Stress can be Relieved by spending Stress to purchase Stress Card Effects when Shocked.</li><li>Stress Effects and Traumas the Character has can offer additional ways that Stress may be Relieved.</li><li>Positive Emotional Affects can Relieve Stress, as Characters burst out laughing, nod in approval, stand resolute, or whatever. Typically Positive Emotional Effects will negate Stress as follows: Each card of a Positive emotion will cancel a number of Stress equal to its Pips Reduced. So a Jack can cancel 3 Stress. It is also worth noting that Positive Emotional Effects (particularly Extreme ones) can remove Hitches and Ongoing Stress Effects instantly.</li><li>All Characters can Relieve Stress by making other Characters Stress. If a Character is in social contact with another, then they can deliberately transfer 1 Stress to that Character with any appropriate Social Ordeal Action (simply telling them their concerns for example).</li><li>If a Character has more Stress than another Character, and at least one Overstressed or Fully Strained Die, then they are considered "Histrionic". Histrionic Characters may use Social Ordeal Actions to transfer Stress to another Character. Typically a Histrionic Character will Relieve 1 Stress for each Overstressed Die +1 additional Stress, however the Character they are interacting with will Gain Stress equal to the amount the Histrionic Character lost +1 Additional Stress. Histrionic Characters who Gain Stress from Social Interactions will always Gain +1 additional Stress (if 2 Histrionic Characters are interacting this gets very stressful).</li><li>Yarn-Tellers can relieve Stress during Dramatic Challenges (see Dramatic Challenges in the <a href="/drama/">Drama Rules</a>).</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Stress, Distress and Drama</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Drama can be both a source of Stress and a relief from the terrible effects that too much Stress can have on a Character. A sudden Hazard for example can obviously create Stress for the Character, but it can also Relieve building Stress, as the bad thing that you were expecting to happen has happened. This can provide cathartic relief just like a Positive Emotion might. Some Dramatic Events can actually cause a Distress or Trauma Card to come into play (see <a href="/shocks-and-shocked-dice/">Shock Dice</a> and <a href="/distress-and-traumas/">Distress and Traumas</a>).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Drama and Stress Effect has its own Stress Cost that can be paid effectively relieving that Stress. Dramas and Stress Effects only remove Stress from the Target of the Drama or the Character or Descendant receiving the Stress Effect.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The "Stressed-Out" Break in particular will cause a Stress Effect as a Drama, usually applying the Current Scene’s Significator as a Distress Card Stress Effect that will affect the Character moving forward. This will remove Stress equal to the Pips of the card (or create Trauma if they do not have enough Stress) (see <a href="/distress-and-traumas/">Distress and Traumas</a>).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Drama can occur to a Character when they have accumulated enough Stress to become potentially Shocked (actually being Shocked, having at least one Overstressed Die or one Fully-Strained Die) or if they have accumulated enough Stress over all to pass a specific limit. This limit is called the Dramatic Stress Limit and is set by the Scene Author, Yarn-Teller or Referee, usually calculated from the current Scene’s Suspense Level (0-11) by some method such as a percentage of the Total Stress the Character can store when every Die is Overstressed (however this can be difficult to set for groups before play). A standard Dramatic Stress Limit is noted for each Suspense Level, that can be used if needed.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>If a Character has more Stress than the Dramatic Stress Limit then they are considered "Emphatic". Emphatic Characters are able to spend Stress to roll a Drama Die into the Drama Pool during their Action.</li><li>Characters who have less points of Stress than Half the Current Suspense Level’s Dramatic Stress Limit are considered "Reserved". Reserved Characters are often targetted by Histrionic and Emphatic Characters as their unstressed demeanour can appear cold, diffident, asocial, distant or even secretive.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><strong>Optional Rule: </strong> To simplify when a Character can spend Stress on Drama a simple rule can be set in place, such as if the Suspense Level is higher than 2 then any Embodiment Character may spend Stress on Drama. If the Suspense Level is higher than 4 then any Character may spend Stress on Drama. This simplified rule option is the preferred Lite Stress method.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Adding a Drama Die (usually d6 Character Drama) to the Drama Pool will relieve 1 Stress and may create Drama as per its normal Rules which will relieve additional Stress.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule: </strong> If Stress is building too quickly in your group, with a lot of Drama being created as a result, consider allowing the Drama Die to Relieve Stress equal to the result the Drama Die rolled (usually a 1d6, so an average of 3.5 Stress Relieved). </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Stress and Strains</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Stress is very powerful, and can have a very negative effect upon a Character, but it can also have a more positive effect. Stress can be spent to boost dice rolls. The minimum cost in Stress is one greater than the minimum possible roll on the Die, so to Strain a 2d6+1 will require a minimum of 4 Stress to be spent. Spending less Stress than this at once does have a benefit though, adding a bonus Score or Pips as though Chi had been spent on the Action, but automatically adding a Strain to the Die. The Stress spent on adding a Strain Die can be converted into Strains or Relieved depending upon what happens with the roll (see Strains and Straining Dice)</p>
<!-- /wp:paragraph -->

')
,array('RulePage'=>'Strains and Straining Dice','Description'=>'<!-- wp:paragraph -->
<p>Stress is a powerful force, it can build up in a Character and effect their decision making and abilities, as they push Stressed Dice to do more they begin Straining those Dice, and sometimes that Strain has a negative effect upon the Dice, at least until you can heal those Strained muscles and brain-cells.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Strains</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Character pushes an Annex by using the Stress stored on it, (or by boosting it with Chi see optional rule below) they can either directly add Score to the roll (as if Spending Chi on the roll, but with the disadvantage of creating 1 Strain on the Die) or they can create a Strain Die that they can add to an Action Roll. This Strain Die will either count as its own Die in a Pool or add to the total roll as required. Sometimes Straining Dice will create a Strain, the Strains created have to be stored. Each Die can store as many Strains as the Stress-Strain Limit. So a 1d3-1 can safely hold 1 Strain, but a 2d6 can store 3. If a Die has Strains then the Die is considered Strained. If a Die has more Strains than the Stress-Strain Limit (such as 2 Strain on a 1d3-1) then it is now considered Shocked.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Optional Rule</strong>: Characters who spend Sway, Chi or Yarn boosting Actions (either directly or by adding additional Descendant or Annex dice to the Pool), also add a Strain to those Dice, as they push themselves harder. This rule is intended to add a gritty fatigue mechanic to even Yarn-Teller play.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Straining Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Stress works a lot like Chi when it comes to adding it to Pips or Scores that are generated, although when used this way Stress spent will always create Strains. However Stress can also be used to Strain Dice, allowing additional Dice to be rolled in the Pool. We call these additional Dice <strong>Strain Dice</strong> as they represent the Character using Stress to Strain their body, mind and soul to push themselves to be stronger than normal. We call this <strong>Straining the Die</strong> as it creates a Strain Die and potentially a Strain that will have to be stored on the Stressed Die creating a Strained Die (see below).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When a Character spends more Stress from an Annex or Facet than the minimum roll for that Die (at least equal to the Stress-Strain Limit), then they may add that Boon Die as a Strain Die to their Action roll. A Character who has a Boon 10 in a Facet may have choosen a Boon Die of 1d2+2, 5d2-4, 1d4+1 or 1d6, if they chose 1d6 or 5d2-4 which both have a minimum roll of 1 and so 2 Stress are required to add either die, however 1d4+1 has a minimum roll of 2 this means 3 Stress are required to add it, and a 1d2+2 costs 4 Stress to be added. Spending less Stress than this number will add the Stress to the roll (exactly like Banal Chi) but will also add 1 Strain to the Die. This is intended to encourage saving Stress to levels where Strain Dice are rolled, as there is then a chance of Relieving some Stress without incurring Strains.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>While the Strain Die is added to the Character’s Action Score, the roll is also individually important as the Annex or Facet can become Strained, Stressed again, or cause Drama depending upon the result of the roll: </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>If the Strain Die rolls a Score lower than the Stress spent to Strain the Die then the Die Gains 1 Strain (or 1 Shock in the case of a Fully Strained Die), but all the spent Stress is Relieved. e.g. a 1d4+1 costs at least 3 Stress to roll, and can hold up to 5 Stress. If a Character pays 4 Stress to Strain the Die and it rolls 2 or 3 then 4 Stress is Relieved and 1 Strain is gained.</li><li>If the roll is equal or higher than the Stress spent to Strain the Die then the Die does not gain a Strain, but the Dice will only Relieve Stress down to the Stress-Strain Limit. e.g. if the 1d4+1 rolls 5 after paying 4 Stress then the Die does not gain a Strain, but only Relieves 1 Stress as the Stress returns to the Stress-Strain Limit of 3.</li><li>A Facet or Annex Boon Die can store a total number Strains equal to the Stress-Strain Limit before it becomes Shocked (see Strained Dice however).</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>A Stressed Annex’s Strain Dice can be used to Relieve a lot of Stress at once, however often this Stress will effectively be converted into Strains. Strains have a negative impact upon that Die. A Dice with even a single Strain is considered Strained. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Strained Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Die has Strains then the Die is considered <strong>Strained</strong>. A Strained Die suffers a penalty equal to the current Strains on the Die. E.g. a 1d6 Descendant can Store up to 6 Stress and 2 Strains, if it is Strained with 1 Strain then it will now roll 1d6-1, a 1d4+1 can store upto 5 Stress and upto 3 Strains, if it is Strained with 1 Strain then it becomes a 1d4. This penalty affects all rolls of the Die, such as Facet or Annex Rolls and Strained Dice can still be rolled as Strain Dice, although with the Strained Penalty they are more likely to Strain more. This penalty does not effect the Limits of the Die, the Stress Limit and Stress-Strain Limits are unchanged.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Strained Dice can safely store Strains equal to Stress-Strain Limit, at that point the Strained Dice will be able to roll -1 which if rolled will automatically generate Failure Levels in the appropriate Facet (the Channelling Facet of an Annex). Strained Dice that are <strong>Fully Strained</strong> (Strains equal to the Stress-Strain Limit) that roll lower than the Stress spent to Strain the Die will add a Shock instead (see Shocked Dice). </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Relieving Strains</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It should be noted that where as a Character may have a number of ways of Relieving Stress there are very limited ways of Relieving Strains directly. The most common way is through suitable rest and recuperation, but there are other ways available.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Characters and Descendants can relieve Strains on Strained Dice by paying the minimum Chi equivalent of the Strains as Yarn (e.g. 2 Strains are Relieved by 5 Chi).</li><li>Strains can also be "Healed" during Ordeals by beating this Chi cost with Pips <span class="t13ne-redcard">&hearts;</span> are Trumps for this Action.</li><li>The easiest way to remove Strains though is Time with the Extend Duration of the Strains as Yarn indicating the amount of time that must be rested to heal all Strains. Resting completely for a few Seconds (or an Ordeal Stage) should be enough to rest one Strain away, but no more will be rested away until a short resting Scene has happened, or the Character or Descendant has sat out a Quick Ordeal, and so on.</li><li>Stress effects can also alter how Strains can be relieved, as can Traumas, with some Traumas completely removing all Strains.</li></ul>
<!-- /wp:list -->

')
,array('RulePage'=>'Shocks and Shocked Dice','Description'=>'<!-- wp:paragraph -->
<p>When Stress has reached its limit, when a Character is Overstressed, has Strained their Dice as far as they go, then we enter the realm of Shock. Shocks are the most powerful form of Stress, and are generally dealt with on a point for point basis. A point of Shock is in many ways indistinguishable from a single Twist, or a point of GRT and can be considered identical for cancelling purposes.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Shock</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Die has more effective Strains than its Stress-Strain Limit (minimum roll), then each point of Strain over the Limit is counted as a point of Shock. When a Die has more Stress than its Stress Limit (maximum roll) then each point of Stress over that maximum is also counted as a point of Shock.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Shock is the most powerful form of Stress, and can cause a Character to lose their ability to act consciously. Shocked Extras are usually considered defeated and unable to continue a fight for example. Shocked Grunts and Heroes are extremely limited in what they can do to recover, being unable to pay Sway or Chi until the Shocks are Relieved. Even Shocked Yarn-Tellers cannot Narrate or spend Yarn, until the Shocks are Relieved.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Shocked Dice</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Die has any number of Shocks it is called a Shocked Die. A Shocked Die cannot store more Strains, or Stress, until it has lost all its current Shocks. Characters and Descendants that have Shocks cannot perform any Action except rolling their Shocked Dice. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Shocked Dice cannot generate a normal Score to perform Actions, and Characters and Descendants are often effectively locked in Global Reaction Time until their Shocks are Relieved. Shocks are typically Relieved by the Character spending time in GRT, taking a Distress or Trauma effect, or occasionally adding Drama Dice to the Drama Pool, depending upon the result of the rolled Shocked Die.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array="shockDice" title="Shock Dice Results"]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>To find out more about Distress Stress effects and Traumas see the rules on <a href="/distress-and-traumas/">Distress and Traumas</a>.</p>
<!-- /wp:paragraph -->


<!-- wp:heading -->
<h2>Relieving Shocks</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Shocks are difficult and expensive to get rid of without rolling Shocked Dice, but it is possible to negate them with Twists or Chi. <br>Look up the total number of Shocks as though they were Twists and pay the Chi equivalent (the Super-Value to the Boon). This can get very expensive, negating 5 Shocks simultaneously will cost 92 Chi, and as such may only be open to Yarn-Tellers and the most powerful of Heroes. Goblin and Demonic Characters are more likely to use their Twists to negate Shock. This can either be down by spending a Twist to negate a Shock in themselves or others, or by converting the Shock in another Character into a Twist for themselves. <br>Shocks are usually negated by being rolled, however there is one other way Shock can be Relieved.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Passing out from Shock</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Shock can be converted into a period of unconsciousness, this is the preferred method for NPCs, and Lite Games, where you rarely want to be rolling Shock Dice or using Stress cards or Traumas for anything less than a Cast Extra, instead the Character can just lose consciousness. Passing out from Shock isn’t only for NPCs and Lite Characters though, sometimes a Yarn-Teller can use Passing out as a Break for the Characters, or the Player may not want to risk all the potential Traumas and Drama they might accumulate.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>in the real world Shock can easily overwhelm a Character, causing them to lose consciousness. Typically there are 3 types: </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Dizzy Spell:</strong> A Dizzy Spell is not a true lack of consciousness, but a Character will fall to the ground during a Dizzy Spell, and typically loses awareness of their surroundings. This trades 1 point of Shock for a 2 Card Attack on themselves (Soaked as normal). This Attack is usually made at Current Stakes. The Character can, but probably should not stand up again immediately, and is considered down for at least a Phase, or the rest of the Round.</li><li><strong>Blackout:</strong> A Blackout is a complete loss of consciousness, also called a Faint or a Syncope. Typically this unconsciousness lasts at most a few seconds, where the Character will collapse to the ground as though dead, and injuries during the collapse are common. A Blackout usually Trades 2 Shocks for a 1 Card Unsoakable Wound, but if the Character stands up again in the same Scene / Ordeal they will automatically Gain back 1 Shock.</li><li><strong>K.O. / Coma:</strong> A K.O is a knock-out, where the brain is injured by acceleration or hitting the skull, Coma is an extended period of unconsciousness that usually results from a brain injury. This works as follows:<ul><li>The amount of time spent unconscious is equal to the Extend Duration based on the number of Shocks as <strong><em>Yarn</em></strong> (note not Twists). E.g. 1 Shock means seconds unconscious. 3 Shocks means around 16 hours unconscious. 6 Shocks means a Week of Coma. 12 Shocks would cause up to 6 years of Coma.</li></ul><ul><li>Characters may Discard their Style Reserve while in Coma. This can reduce the Coma Duration by Relieving  Shocks.<ul><li>The cost to Relieve 1 Shock is equal to the Total number of Shocks as <strong><em>Twists</em></strong>. E.g. 3 Shocks costs 32 Pips to Discard 1 Shock. 2 Shocks costs 16 Pips and 1 Shock 5 Pips. So completely Discarding 3 Shocks requires 53 Pips Total.</li></ul><ul><li>Discarded Wildcards count as Trumps adding a total of 17 Pips.</li><li>Only 1 Card may be Discarded a Phase while a Character is Unconscious (this means a Character must spend some time in a Coma even if only a few Actions) but all Discarded Pips accumulate until enough accumulate to Relieve a Shock.</li></ul></li><li>Prolonged time in Coma will require nursing for most Characters. Characters who are unconscious usually cannot feed or drink without assistance and may suffer from effects like muscle wasting becoming bed-bound even upon awakening. <ul><li>Time unconscious will typically Drain Health, Wealth or another Facet Sway equal to the Duration (so equal to the Shocks as Yarn). </li><li>Endurance, Hope, Health and Securities are typically considered Bold for this purpose so spending just shy of 8 hours unconscious would Drain 8 of these Facet Sway.</li></ul><ul><li>Wealth, Support, Serenity and Merits are more variable, with good science-fiction medical care Wealth or Support may count as Bold (as Health), but modern care would be Intrepid (8 hours of Coma would Drain 16 Wealth / Support), historical medicine would usually be Banal (8 Hours Drains 32 Wealth or Support). Serenity and Merits are usually variable based on the setting, psychic or divine healing could make it Bold, Intrepid or Banal, depending how strong they are in the setting.</li><li>Other Facet Sway are typically Banal (although Settings vary).</li></ul></li><li>These effects work with each other. So if a Character has 5 Shocks and elects to a K.O. / Coma then initially that is a Weekend or Moon Phase in Coma. They may Discard Style Reserve to Relieve these Shocks however 92 Pips are required to Relieve 1 Shock, which is probably going to use up around 10 to 14 cards. That leaves them with 4 Shocks (59 Pips to reduce again) or around a day unconscious (until Dawn, Dusk, Noon, Midnight). A day unconscious is going to Drain up to 12 Health, or 59 other Facet Sway (Breath, Surges etc), or if they are hospitalised probably 24 Wealth.</li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:shortcode -->
[t13ne type="swaytable" /]
<!-- /wp:shortcode -->

')
,array('RulePage'=>'Distress and Traumas','Description'=>'

<!-- wp:paragraph -->
<p>Stress can have powerful effects on a Character, some of them are ongoing, and some of them create Attacks on the Character that can have permanent effects upon the Character too (exceptionally permanent in the case of "Dead" Woes). When a Shock Die is rolled it can create a Distress / Trauma situation. Each Shocked Die that rolls a Distress / Trauma result adds a Distress Card to the Character or Descendant. Typically a Character must Discard one of their own cards from their Style Reserve, Ordeal Pool, or Hand to become the Distress Card. The Stress Effects vary by Distress card as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="cardtable" suits="all" aspect="Stress" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The rules for whether a Distress / Trauma result creates a Distress ongoing Stress Effect or a Trauma are as follows:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>If the Character or Descendant has enough Stress, then they can easily match the Pips of the Stress Effect card and take the Stress Effect.</li><li>Distress Card Stress Effects fill a Trauma slot unless replaced by an actual Trauma.</li><li>If a Character already has filled all their Trauma Slots with Distress Cards then the new Distress should replace any Distress that it has more Pips than.</li><li>If no Slot is available the Distress Card will automatically become a Trauma Card instead (and the Stress is still Relieved).</li><li>If a Character or Descendant cannot pay Stress equal to a Card’s Pips then the card is instead a Trauma.</li><li>Traumas are treated like Attacks or Wounds, with a Trauma Limit card and total Trauma Pips, except Traumas have additional Stress, Strain and Shock effects over a normal Wound and Traumas are not soaked (see Traumas).</li></ul>
<!-- /wp:list -->


<!-- wp:shortcode -->
[t13ne type="cardtable" suits="all" aspect="Trauma" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Characters and Descendants can store one Trauma on each Annex Die. Traumas cannot be stored on Facet Dice, however Characters with Facets can store additional Traumas on their Incarna Wound Slots.</p>
<!-- /wp:paragraph -->

'),
array('RulePage'=>'Tension, Pressure and Suspense','Description'=> '
<!-- wp:paragraph -->
<p>Tension, Pressure and Suspense in T13 is a complex system that we use to model Dramatic and Character Tension, Pressure and Suspense within the Ludo-Narrative experience. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Tension, Pressure and Suspense are created by Plots and Characters, and drive the narrative and game forwards. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Tension pulls Embodiment Characters, perhaps into a relationship or situation.</li><li>Pressure pushes Embodiment Characters into things, usually into competition, fights or arguments with other Embodiments. </li><li>Suspense Level is a measure of how strong the Elemental Change is, how strongly the Pressures and Tensions effect the Embodiment Characters.</li><li>Functionally Tension and Pressure are the same thing, a Narrative force that moves Characters around the Narrative. They both rely on Suspense and Suspense Levels to measure their effectiveness.</li><li>While a Plot may think of its Character Embodiments as Pulled or Pushed, there is no difference functionally. A Plot could refer to a Character as Pulled, but actually only use Pressure to influence them.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>There are 5 Types of Tension and 5 Types of Pressure, but it is usually simpler to consider these types together as the 5 Chinese Elements or Changes.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="fiveChanges" title="The Chinese Elements or Changes" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>This defines 5 types of Tension and 5 types of Pressure which we can use in a number of ways. It can be helpful to think of Tension as a Yin effect, perhaps more associated with the Yin Facets and Pressure as a Yang effect and Yang Facets, but this is far from a rule.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Suspense Levels tell us how powerful these Tensions and Pressures are, what they can do to a Character, how far they will make a Character go. Suspense defines the narrative, as the Suspense Level normally climbs from the beginning of the tale to the climax, and then falls off quickly as the Plot is resolved (although other forms are possible, this is the most satisfying generally). </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="suspenseLevels" title="Suspense Levels" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Note that the Suspense Level can make Pulled and Pushed Embodiment Characters feel compelled to act certain ways, this compulsion should never be applied to Player Characters, but only Hooked NPC Embodiments (typically the bad-guys will be compelled), Yarn-Tellers running Plots do not narrate Actions for Characters who have Players like this, Players may decide to conform to this compulsion however. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is also worth noting that NPCs that are solely pushed by a Pressure from a Plot (or Pulled by a Tension) can feel "hollow" if they have no motivation for the Action they are being pushed into. Yarn-Tellers should be aware that each Embodiment should have their own goals and motivations, which should add depth to why the Character is doing what they are doing. If a Plot is going to be a Metal plot and use Medal Tension to pull Characters together then, it would help if the Characters Hooked want to compete against others, and have something to gain and something to lose, even if its only a bet with another Character.  </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Stakes during a Scene can always be higher than the Suspense-Level may suggest. If a Character pulls out a gun (or the equivalent), the Stakes will always climb to High or Extreme (although it may cause the Suspense-Level to jump as well). Conversely, if the Stakes are Extreme, everyone holstering their weapons could lower the Stakes to High, but there is a chance that something about the environment is making the Stakes Extreme, such as artillery shells, kill-bots, meteors, or volcanic ejecta raining down on the area. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> Also note that Pulled and Pushed Characters in some genres and settings may reveal Monster Facets at certain Suspense Levels. External Monster Embodiments are similarly restricted, but ignore setting and genre conventions. Monster Facets are typically added by the Plot from the Facets available to that Side of the Conflict, although Facets neutral to the Conflict can also be added. In any given Scene, regardless of genre or setting, a Monster may only reveal they have access to a number of Monster Facets equal to the Suspense Level. This allows  Monsters to grow in power, revealing more diabolical quirks and abilities as the Suspense grows.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Tracking Suspense, Pressures and Tensions</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li>Plots (including the current Act and Scene) should each have a Suspense Level and an Element. Every Plot that is currently in play should have an entry, from Cycle or Epic all the way down to the current Scene. Typically the current Scene will be from the Plot that has the highest Suspense Level (although see <a href="/narrative-weaving/">Narrative Weaving Rules</a> and the Editor Role).</li><li>Characters have an effective Suspense Level that is equivalent to the highest Pressure or Tension that they are currently experiencing. An Embodiment Character should have all Tensions and Pressures recorded for them. </li><li>Characters may be connected by Tension or Pressure to another Embodiment Character. This should be decided by a combination of the Yarn-Teller responsible for the Plot and the events that have occurred so far (if the Characters have not yet met, then no connection should be present, unless there is some unseen influence one has over the other, conversely if the two flirted outrageously in an earlier Scene then later Ardour Tensions may draw them together).<ul><li>The intensity of the Tension or Pressure is recorded when the Character receives it from the Plot. A Character should behave according to the Levels of Tension and Pressure they experience. So an Engaged Rooting Tension should pull a Character into invest</li><li>Embodiment Characters always have a Tension from a Pulled Embodiment, and a Pressure from Pushed Embodiments. Hidden Embodiments usually have both.</li><li>As the Plot or Scene changes Suspense Level it will create new Tensions and Pressures on the Embodiments, that may connect to different Embodiments.</li></ul></li><li>When Suspense Level increases for a Plot, the Element of the Plot changes following the Generative path: Wood becomes Fire, Fire becomes Earth, Earth becomes Metal, Metal becomes Water, and Water becomes Wood. This will create new higher Suspense Tensions and Pressures for the Character Embodiments, but will not alter the ones they previously had.</li><li>When Suspense Level decreases for a Plot the Yarn-Teller has a choice, either will result in new lower Tensions and Pressures. <ul><li>causing the Element to change according to the Insulting Cycle: Wood becomes Metal, Metal becomes Fire, Fire becomes Water, Water becomes Earth and Earth becomes Wood. </li><li>or using the Destructive Cycle: Wood becomes Earth, Earth becomes Water, Water becomes Fire, Fire becomes Metal and Metal becomes Wood.</li></ul></li><li>Tensions and Pressures can interact according to the various Cycles.<ul><li> When two Tensions or Pressures exist in Generative cycle the Parent reinforces the child. This means the parent is superseded by the child. Fire’s Ardour becomes unimportant while the lovers are separated by Earth’s Rifting, but the Ardour still burns between them, and fuels their Rifting Tension to be returned.</li><li>When two Tensions or Pressures exist in Destructive Cycle and Insulting Cycle with each other the Suspense Level of each becomes important. <ul><li>The Grandparent and Grandchild are only balanced if the Grandparent is 2 Suspense Levels lower than the Grandchild. </li><li>The Grandparent will destroy the Grandchild if it has a Suspense Level higher than the 2 below the Grandchild. This destruction removes the Tension or Pressure created by the Grandchild. Even a "Tragic" Coin Pressure, where a Character may be on the verge of bankruptcy or even starvation fades away if the Character experiences even a "Bloody" Heat Pressure, where they might decide an armed robbery or mugging could be the solution to their money woes.</li><li>The Grandchild will insult the Grandparent if it has a more than 2 Suspense Levels more than the Grandparent. The insulted Grandparent will steal whole Suspense Levels from the Grandchild until they are back in balance, or the Grandchild is destroyed. So a Bloody 9 Peer Pressure insults Engaged 5 Growth Pressure,  this reduces the Peer Pressure to 8 and increases the Growth Pressure to 6 and they find balance. However, if that had been only Intense 8 Peer Pressure the Growth would have stolen a Level to create a 7-6 difference, and the Peer Pressure would have been destroyed as the Character outgrew that Peer group perhaps.</li></ul></li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>During a long Plot, such as a Volume of many Chapters, the Suspense may rise and fall a lot, causing the Plot to cycle around the Five Changes repeatedly. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>For example: The beginning of a Volume opens with an Awake Metal Scene, this creates Medal Tensions (competition) and Coin Pressures (financial) on the Pulled and Pushed Embodiments. </li><li>Naturally, the Suspense then climbs to Aware Water, creating new Fathomless Pressures (introspection) and Surface Tensions (between groups or places) that build on the previous influences. The Character thinks about their money worries, or is offered a new position with a different team.</li><li>Alert Wood follows, Rooting Tensions now build on Surface Tensions, an Growth Pressures build on Fathomless, perhaps the Character has been recruited to a new team, and has to feel their way around a new environment, or having realised what they were doing wrong have a new idea. </li><li>Engaged Fire now follows on, creating Ardour Tension, as perhaps the Character finds a new Love Interest or perhaps a new sports agent... and Heat Pressure now builds. The Engaged Fire also destroys the original Medal Tension and Coin Pressure the Character had, these are simply no longer present for this Character. As they are now perhaps devoted to their new love interest or arguing with their old team.</li><li>Suspenseful Earth is next, and adds Rifting Tension and Peer Pressure. The Character and their love interest, or family, or perhaps the new team, are separated somehow. Or perhaps the new team pressures the Character to renounce their old allegiances, which they feel happy to do after the arguments. This also destroys the Water’s Surface Tension and Fathomless Pressure.</li><li>Emotional Metal is next and perhaps indicates a return to the original situation, the Character and his new team are entering a competition again. They may struggle to find money for entry fees, or be pitted against the Character’s old team. This also destroys the Rooting Tension or Growth Pressure that the Character felt when he arrived at the new team.</li><li>...and so on...</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Plots can cycle around, sometimes Pulling Embodiments by Tensions, other times Pushing with Pressures. Just because a Character was Pulled by an Ardour doesn’t mean they can’t be Pushed by Peer Pressure later.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Current Suspense Level </h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Plot, whether it be a Cycle, and Epic, or an Act or a Scene has its own Suspense Level. Plots that are early on and smaller will usually have lower Suspense Levels, but later the Stories from that big Epic plot that are already deep into it, are going to often have much higher Suspense Levels. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Even a single Story will have a Story Suspense Level, a current Act Suspense Level and a current Scene Suspense Level. In general, we consider the Scene to be more important than the Act or Story. This is because for the Characters only the Scene can truly be relevant, as the Scene is the closest Plot in scope to the Characters, the Characters are only essential to a specific Scene, an Act or Story could theoretically discard them as Embodiments for something else in another Scene. Suspense Levels are often recorded on Plots with a number between zero and eleven.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Suspense Level of the Act or the Plot is fairly unimportant to the Characters (although the Yarn-Teller should be aware of what the Act and Plot can do to their Embodiment Characters).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Current Scene may raise or lower according to the events occurring in the Narrative. If the Scene ends up more than 2 Suspense Levels different to the Act then it will pull the Act. So an "Engaged" Act can support an "Aware" to "Emotional" Current Scene. If the Scene were to decrease to "Awake" it would lower the Act to "Alert", if it increases to "Intense" then the Act would become "Suspenseful".</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This 2 Suspense Levels difference between Plot Ranks extends beyond Scenes, Acts and Stories; Stories (or Chapters) can differ up to 2 Suspense Levels to their Arcs, Arcs can vary 2 from their Volume, Volumes 2 from their Epic and Epics 2 from their Cycle. Any more than this and they will effect them.  </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>An easy way to track these Suspense Levels in play is by placing a D12  (12 as Level 0) on the appropriate part of this diagram (which is easily copied or printed). You can use multiple D12s to track the current Scene, current Act and any active Plots as needed. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Green lines on this diagram show Generative order, and the red lines show Destructive order clockwise and Insulting order anticlockwise, counter-clockwise, or widdershins, as you prefer. Although any pentagonal diagram would do.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<figure>
<svg width="500" height="500" version="1.1" viewBox="0 0 132.29 132.29" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <marker id="t13nee" overflow="visible" orient="auto">
   <path transform="scale(.8) rotate(180) translate(12.5)" d="m0 0 5-5-17.5 5 17.5 5-5-5z" fill="#007400" fill-rule="evenodd" stroke="#007400" stroke-width="1pt"></path>
  </marker>
  <marker id="t13neb" overflow="visible" orient="auto">
   <path transform="matrix(-.8 0 0 -.8 -10 0)" d="m0 0 5-5-17.5 5 17.5 5z" fill="#007400" fill-rule="evenodd" stroke="#007400" stroke-width="1pt"></path>
  </marker>
  <marker id="t13nec" overflow="visible" orient="auto">
   <path transform="matrix(-.8 0 0 -.8 -10 0)" d="m0 0 5-5-17.5 5 17.5 5z" fill="#007400" fill-rule="evenodd" stroke="#007400" stroke-width="1pt"></path>
  </marker>
  <marker id="t13ned" overflow="visible" orient="auto">
   <path transform="matrix(-.8 0 0 -.8 -10 0)" d="m0 0 5-5-17.5 5 17.5 5z" fill="#007400" fill-rule="evenodd" stroke="#007400" stroke-width="1pt"></path>
  </marker>
  <marker id="t13nea" overflow="visible" orient="auto">
   <path transform="matrix(-.8 0 0 -.8 -10 0)" d="m0 0 5-5-17.5 5 17.5 5z" fill="#007400" fill-rule="evenodd" stroke="#007400" stroke-width="1pt"></path>
  </marker>
 </defs>
 <g opacity=".66868">
  <circle transform="rotate(140)" cx="-8.7576" cy="-92.858" r="57" fill-opacity="0" marker-end="" stroke="#007400" stroke-dasharray="2.33, 1.165" stroke-miterlimit="3.8" stroke-width="1.165"></circle>
  <g fill="none" stroke="#007800" stroke-width=".865">
   <path d="m57.227 121.4c-2.0385-0.42096-2.522 0.10429-2.522 0.10429" marker-start="url(#t13ned)" opacity="1"></path>
   <path d="m10.048 73.909c-0.35222-2.0515-1.0178-2.3099-1.0178-2.3099" marker-start="url(#t13nea)" opacity="1"></path>
   <path d="m37.751 16.656c1.7849-1.0709 1.7849-1.7849 1.7849-1.7849" marker-start="url(#t13nee)"></path>
   <path d="m105.98 24.417c1.4307 1.5119 2.1278 1.3579 2.1278 1.3579" marker-start="url(#t13neb)" opacity="1"></path>
   <path d="m115.57 94.62c-1.0356 1.8056-0.68729 2.4288-0.68729 2.4288" marker-start="url(#t13nec)" opacity="1"></path>
  </g>
 </g>
 <g opacity=".61044">
  <path transform="scale(.26458)" d="m376.42 420.94-124.89-91.823-123.49 93.69 48.737-147.15-127.27-88.495 155.01 0.87982 44.837-148.38 47.063 147.69 154.98-3.2109-125.92 90.399z" fill-opacity="0" stroke="#970000" stroke-dasharray="8.8063, 4.40315" stroke-miterlimit="3.8" stroke-width="4.4032"></path>
  <path d="m54.113 49.755-7.3399 23.182 19.779 14.144 19.564-14.44-7.6877-23.069-24.315 0.18285" fill="none" stroke="#820000" stroke-dasharray="2.13, 1.065" stroke-width="1.065"></path>
 </g>
 <ellipse cx="66.722" cy="12.922" rx="10.741" ry="10.995" fill="#f04000" stroke="#ff3c3b" stroke-dashoffset="10.65" stroke-opacity=".95862" stroke-width="1.065"></ellipse>
 <text transform="translate(1.7849 4.985)" x="58.186298" y="11.066106" font-family="sans-serif" font-size="7.0556px" stroke-width=".26458" style="inline-size:0;line-height:1.25;white-space:pre" xml:space="preserve"><tspan x="58.186298" y="11.066106" font-size="7.0556px" stroke-width=".26458">Fire</tspan></text>
 <ellipse cx="118.87" cy="49.04" rx="10.741" ry="10.995" fill="#f0f0a0" stroke="#f0f002" stroke-dashoffset="10.65" stroke-width="1.065"></ellipse>
 <text transform="translate(51.818 40.573)" x="58.186298" y="11.066106" font-family="sans-serif" font-size="7.0556px" stroke-width=".26458" style="inline-size:0;line-height:1.25;white-space:pre" xml:space="preserve"><tspan x="58.186298" y="11.066106" font-size="7.0556px" stroke-width=".26458">Earth</tspan></text>
 <ellipse cx="99.952" cy="111.73" rx="10.741" ry="10.995" fill="#e1e0e2" stroke="#d7d7d7" stroke-dashoffset="10.65" stroke-width="1.065"></ellipse>
 <text transform="translate(32.369 102.74)" x="58.186298" y="11.066106" font-family="sans-serif" font-size="7.0556px" stroke-width=".26458" style="inline-size:0;line-height:1.25;white-space:pre" xml:space="preserve"><tspan x="58.186298" y="11.066106" font-size="7.0556px" stroke-width=".26458">Metal</tspan></text>
 <ellipse cx="33.555" cy="111.02" rx="10.741" ry="10.995" fill="#00003c" stroke="#003" stroke-dashoffset="10.65" stroke-width="1.065"></ellipse>
 <text transform="translate(-35.086 102.55)" x="58.186298" y="11.066106" fill="#ffffff" font-family="sans-serif" font-size="7.0556px" stroke-width=".26458" style="inline-size:0;line-height:1.25;white-space:pre" xml:space="preserve"><tspan x="58.186298" y="11.066106" fill="#ffffff" font-size="7.0556px" stroke-width=".26458">Water</tspan></text>
 <ellipse cx="11.066" cy="49.237" rx="10.741" ry="10.995" fill="#36eeb6" stroke="#00eed7" stroke-dashoffset="10.65" stroke-width="1.065"></ellipse>
 <text transform="translate(-57.575 40.77)" x="58.186298" y="11.066106" font-family="sans-serif" font-size="7.0556px" stroke-width=".26458" style="inline-size:0;line-height:1.25;white-space:pre" xml:space="preserve"><tspan x="58.186298" y="11.066106" font-size="7.0556px" stroke-width=".26458">Wood</tspan></text>
</svg>
</figure>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p>Usually with this method Plots, Acts and Scenes have their Suspense Level recorded after play, between sessions. This means an ongoing Plot that keeps returning may have a dramatically different Suspense Level to the current Plot, and Suspense Levels can shift between them, as we move between Scenes of different Plots. This is one method of Narrative Weaving, as Plots gain and lose suspense during Stories</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Changing Suspense Level</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There are a number of reasons that Suspense Level may change during a Story.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Narrative Necessity</strong> Sometimes the Tale demands that the Good Guy and Bad Guy fight to the death, so it might be necessary to raise the Suspense to Bloody or Tragic so that they can. Narrative Necessity trumps anything else, it can even set the Suspense Level to the Catastrophic when the Embodiments first meet. </li><li><strong>Triggered Anticipation</strong> Every Suspense Level has some Trigger Event that can theoretically set the Suspense Level to that Level. Players who kill another Embodiment should expect that the Suspense be instantly set to Tragic, and that is reasonable generally, however the issue is with lowering Suspense Levels, or raising Suspense Levels more than 2 to 5 Levels at once (depending upon the genre and setting), those should never be guaranteed, and are entirely up to the Yarn-Teller and the Narrative Necessity.  </li><li><strong>Dramatic Demands</strong> Whenever Drama occurs the Suspense Level should shift, either up or down 1 Level. The Yarn-Teller running the Narrative should decide if the Suspense moves up or down. As a general rule, if Characters are already badly injured, things are moving too quickly, or you can’t see how to use the next Change effectively in the plot lower the Suspense Level, otherwise keep riding that elevator up.</li><li><strong>Outcome Obligations</strong> If a Character takes actions that counter the Pressure or Tension that they were being influenced by, then it makes sense if the Suspense falls as a result. Conversely, if the Characters take actions that increase their Tensions or Pressures, then it makes sense if the Suspense rises. Often, this will actually cause a Drama to occur, but sometimes it can be necessary for the Suspense to be knocked up or down based on the outcomes of Character Actions.<ul><li>For example a Character who is influenced by Medal Tension, may decide to quit the hobby or their job (perhaps creating a Coin Pressure instead) to avoid the Tension, or they may decide to avoid a competition they know a Rival might attend. This would lower the Suspense a level. </li><li>Or they might make a bet, or vow, that they are going to beat a particular rival, which would increase that Tension (and could even add additional Coin Pressure). This would increase the Suspense a Level.</li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>How the Suspense Level changes actually occur can be looked at two main ways:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Yarn-Teller can look at the Suspense Levels to decide what the result should be, like the Suspense Level Triggers of Triggered Anticipation. If a Character is being powerfully "Emotional" influencing everyone, then perhaps this is an "Emotional" Scene all of a sudden.</li><li>The Yarn-Teller can decide which of the Five Changes the result should be and change the Suspense as though the Outcome had stepped that many Levels, climbing by using the Generative Cycle and descending via the Insulting and Destructive. <ul><li>For example, if in a Water 3 "Aware" Suspense state, a Character, influenced by either a Fathomless Pressure (some internalisation) or Surface Tension (caused at the interface of two or more social groups) we’ll say they are alone mulling things over, when they decide they should host a competition (perhaps as a way of getting revenge, or proving something to themselves), and we want to jump straight to that competition, we can move from Water to Metal and add a Suspense Level each time, creating a Metal 7 "Emotional" Suspense.</li><li>Or perhaps they want a more fun, game-like competition, like a poker game with drinks after work, or some video games to unwind, we can use the Destructive Cycle, drop 2 Levels, travelling past Fire to a Metal 1 "Cool" state.</li><li>Or use a combination, such as Insulting to slide back to Earth and then Generative, to Metal 3 "Aware". This might indicate that there was another Embodiment at the fun game of cards, or perhaps as an online opponent.</li><li>Of course whichever way you do it, it creates a more or less important and powerful Metal effect on the Character. Which can have an impact on any previously generated Tensions and Pressures the Character may be feeling.</li></ul></li><li>Ideally a combination of both should be used. Where the Character Actions and Intentions both set the Level of Suspense and decide the appropriate Change to set the current Scene to, and to note the changes that may make to next Scene, both in terms of what is planned but also how the Plot will react to these changes. </li></ul>
<!-- /wp:list -->

'),

array('RulePage'=>'Narrative Weaving', 'Description'=>'
<!-- wp:paragraph -->
<p>In T13 Plots are considered to be similar to Characters, and are a type of Weaver just like a Character, they "act" (although not in a stagecraft or physical sense) to create compelling Narratives for the Characters to engage in. A lot of this is handled by what we call Tension and Narrative Weaving. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plots (whether they be Stories or Cycles) all use the same techniques for weaving the Narrative.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>First we consider the Acts of the Narrative. Generally, T13 uses a basic 3 Act structure, although you can modify that as you like, by adding additional "Looms". Here’s a summation of how we categorise Plots as Acts.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="actTypes"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>A five Act "Dramatic Arc" structure, for example, is said to consist of Exposition, Rising Action, Climax, Falling Action, and Catastrophe. Which is modelled simply as Frame, Loom (rising Stakes and Tension draws the Embodiments together), Loom (the turning point, often where Tension snaps to Rational Conflict, or where things really go bad for the Oppressed side, and usually consists of a single Warp and Weft), Loom (which consists of fewer Characters as Embodiments are often whittled down and some sense of suspense) and Zenith (where the Conflict is resolved and the Plot Tension — and Character Stress — is released). In T13 representation of the Dramatic Arc is more closely tied to the Tension-Level of the Plot than to our </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Acts themselves are broken into Scenes. And larger Narratives can have smaller stories called Tracts that act exactly like Scenes of an Act. Scenes and Tracts come in various types that we call Beat Types, a Scene is the quanta of T13 storytelling, the smallest "story" we can tell, and these Beats are essentially the simplest Plots that exist.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="sceneBeatTypes"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":2} -->
<h2>The Frame</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Frame of a Narrative is when the various threads of the tale are arranged, the back-story is woven, and the Characters are Hooked by the Plot. </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Hooks</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is possible to prepare a Hook for each Facet of the Conflict, but you only need to use one per Character, and normally Hooks for NPCs are not necessary (we usually consider them Hooked before play begins, how this happened may be revealed later, but only if it turns out to be important somehow). So, in general, you only need to prepare a Hook for each Facet used by a side a Player Character will be on (or a Hook for each PC) and only need to play through the Hooks until all Player Characters are Hooked. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You might find for example that Hooking one Character Hooks the entire party into the Plot, in which case the Hook acted on the whole party as a Pact Hook, and only one Scene was required. The Plot does not then need to play any other Hooks as everyone important is now Hooked, but perhaps you want to Hook another PC to a different Side of the Conflict, well you can if you want. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hooks are defined in two parts a Hook and a Hook Aspect. The Hook defines what the Plot does to attract the attention of the Characters, does it have a messenger burst in declaring the enemy is on the march? Or is this a more subtle plot, willing to nudge and hint at its existence a few times before the Characters even notice ("Look, this bandit has the same crab tattoo as that guy with the guns on the beach. I wonder if they are friends or something?". The Hook Aspect defines what part of the Character the Hook is set in. Is it trying to draw in a Character with the right Personality, or one with the right Hitch?. Hook Aspects can even be used to help define the Conflict, if you know a Character is going to be Hooked by a Hitch for example then picking a Facet they have a Hitch in is not a stretch.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="cardtable" suits="all" aspect="Hook,Hook_Aspect" title="Hooks And Hook Aspects" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>After the Hooks are set (however many were required) comes the first Revelation Scene.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Revelations</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Revelations are how we reveal information to the players in a structured way. Revelations aren’t always important to a Plot, but are always important to the weaving. Normally, Revelations are just key information that the Yarn-Teller feels the Players (or readers) need to make sense of the narrative, but the first Revelation of a Story, the Frame Revelation is a little different.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This Revelation Scene may include multiple normal Revelations and should reveal things about the Background / Setting, Sides of the Conflict, Characters and Plot. If you aren’t sure what sort of information you want to reveal, or how, you can draw Yarn cards to create a Revelation, or at least give you some ideas about what you might want to reveal.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Revelation should reveal what the Revelation is About, the Information Revealed (or the Alternative for that card) and the Vector by which it is revealed. Additionally, you may reveal additional Details with extra cards, if you want. Each Revelation can play a number of cards equal to the Draw of that Sides Conflict Annex (with a minimum of 3).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It can be quite interesting to consider the Revelation cards as a Pool, and consider them in different orders. This can be especially useful for creating Revelations on the fly. If you’ve used one Revelation of 3 cards already, and suddenly need a new one, you can just shuffle the order of the previous one.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Sometimes the Revelation will reveal some Lore about a Character that was not previously known about them. Often this will be in the form of a revealed piece of the Character’s history, and can come as a surprise to the Yarn-Teller or Referee. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you suddenly find out that your bad guy was once shot in the face and survived, but carries terrible scars, or that he once killed a bear with a rock, or is actually a shape-shifting lizard, then you need to handle that and incorporate these Revelations into the Narrative moving forwards. The way we do that is with a Lore Descendant, you can find out more about how to create Lore Descendants on the Plot Descendants Rule Page, but they are made from the Revelation’s Yarn-Cards. For this reason Revelations always include a potential Lore that can be revealed.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Revelation Scene can be smeared throughout the whole Frame, with individual Revelations taking place during each of the Hooks, or as a specific Scene of its own, as the Yarn-Teller prefers.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="cardtable" suits="all" aspect="About,Info,Vector,Alternate,Detail" /]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":2} -->
<h2>The Loom</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Loom is the majority of the Narrative, it should always be at least twice the length of the Frame (and in many cases is much longer). The easiest way of insuring that is to make sure that each Scene of the Frame, has at least one Warp and one Weft in the Loom.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Side of the Central Conflict should also have at least one Warp and one Weft (even if they did not have a Hook Scene of their own), and often each Facet will have its own Warp and Weft as part of the whole Conflict.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Warps and Wefts are broken up into smaller Scene Components (although they can be expanded into whole Scenes if a Loom is particularly short of Warps and Wefts), which can be treated as the "acts" of a single Warp or Weft, or can even treated as different Scenes in their own right. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Components usually form a cycle throughout the Loom, with The Ends following after Picking, The Fray following the Ends, etc. However, The Snag does not always follow the Fray, sometimes interacting with, or even preceding it. Recoiling can follow the Fray directly then, although sometimes Sweeping can be displaced to before the Recoiling, or after the Picking, by a Yarn-Teller for some Narrative reason. Most often these alterations are made to make sense of how Warps and Wefts interact with each other, with the Sweeping being moved to interact with the opposed side’s The Snag rather than The Fray.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="sceneComponents"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Warps and Wefts</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Loom is the most complex part of the Plot, this is where the "magic" of the T13 Narrative Engine happens. At its simplest, when there are only 2 sides of a Conflict the Engine works by having the Dominant Side take a Warp when the pressed side takes a Weft and vice-versa.  It might help to think of two threads, the Dominant and Pressed sides have one each, that twist together, when a thread is moving Left that is a Weft, moving right that’s a Warp. </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Interweaving Scenes - a simple example</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The interplay of Warps and Wefts creates the events of the Scenes. Let’s examine a Scene from a Sin vs Virtue Conflict. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">We’ll make a few quick assumptions to make this as simple as possible. Firstly, both Embodiments are Character Personas, a Fiend (Gerald the Necromancer) vs a Hallow (Sister Mary-Immaculata). Persona Embodiments are easily identified and at times crushingly obvious, but they will do for a simple example.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">Early in the Story, the two are at low Suspense Levels, so they are not strongly drawn together. At low Tension the two may not even appear in a Scene together. At this point if Sister Mary-Immaculata makes a Gain, it will have no impact on the Fray or Snag that Gerald has to get through to raise his Undead army. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">However later in the Loom, the Tension has reached Passionate Level, now Sister Mary-Immaculata’s Fray (The Mask) forces her undercover in the next village that Gerald is due to subjugate, she will also have a Snag (The Crown) which will have to do with her personal responsibilities that she feels for the souls of those about her. Meanwhile, Gerald has his own Sweeping (The Swamp) a Shower Scene, implying that Gerald needs some cleansing, or perhaps gets caught in a rain shower. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">The blending of these Scene Components could be that when Gerald arrives in the village, Sister Mary-Immaculata is now posing as Tammy, a buxom, but adventurous maid. She enters the village and tries to find employment, but the innkeeper has two daughters and no need for a third barmaid. Then there’s a loud bang from the stables, she rushes out and finds a man laid out on the floor, with a stallion bucking in front of him and a knight frantically yelling. Seeing the man on the floor is unconscious and bleeding, she quickly drags him back, away from hooves, and begins cleaning the wound to assess the damage. She risks revealing she is a nun if she were to pray for divine aid, and so pulls out her first-aid kit, and begins stitching the cut, and then uses smelling salts to wake him. The knight (Sir Kelvin Bathred), having calmed his horse, comes into the inn, trying to find out how Frank (the stable-hand) is, and apologise for his horse. He sees Tammy finishing the bandaging and asks the innkeeper who she is. Before Sister Mary-Immaculata knows what is happening, Tammy has a job as a maid in Sir Kelvin’s household.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">Gerald meanwhile arrives in the village and is greeted by Sir Kelvin, who invites Gerald to his home. Gerald is weary from his travels and agrees at once, asking if he might take a bath before dinner. So Tammy the maid is ordered to draw Gerald a bath, with the knowledge that if she were to harm Gerald, Sir Kelvin would face the charges. Gerald goes to bathe and discovers he’s has reopened one of his wounds. He asks for assistance, now Sir Kelvin knows Tammy has some healing skills, due to the incident with Frank the Stablehand and Sir Kelvin’s stallion, and offers those skills to Gerald, who technically is in need of her skills... What should Sister Mart-Immaculata do, should she give succour to her enemy, reveal her true nature to Sir Kelvin, or take this opportunity to end the Necromancer’s threat though it would break her word and the honour of Sir Kelvin? What would you do? </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Interweaving More Than Two Sides</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When there are more than two sides this becomes a much more complex interaction. If you have three Sides, and think of three threads, then the obvious idea is to plait those threads, with each thread moving left being a Weft and right a Warp, which happens in pairs, with the other thread not moving, and therefore doesn’t take a Warp or a Weft. It may take a random Scene (determined by a Yarn Card) or simply have no Scene if the Embodiment is not appearing.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">In this example, we could have Sir Kelvin (a Hero) be the Embodiment of Gossamer. During Sister Mary-Immaculata’s Fray, he has a Fray of his own, (the event with his horse), but later with Gerald he takes a Sweeping (The Burn-out) a minor Test or Ordeal (in this case playing host to the Necromancer).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For four sides this becomes even more complex, with multiple possible patterns possible, from pairs swapping and then the other pairs swapping, so half the sides take a Warp and the other half a Weft, then reverse, or you could make one side Warp past three sides Wefts then the next side does the same. Depending upon the exact pattern chosen this can result in multiple Warps, or Wefts, occurring in a row for any given side.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This is okay, but you will often find that the Wefts and Warps themselves begin to fragment and tangle, events that should be simultaneous may make more sense following each other. Characters tend to react to Warps as they happen, so you end up with a Recoiling event happening at the start of a Warp, or perhaps the Character is hurt by each Warp in turn and then needs to heal extensively, so several Healing Wefts may actually be combined. Additionally, during chained Warps, the Snags may become separated from their Frays, or interact with the next Fray, or a Weft, instead. In short, it can get messy, and that is okay.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Whenever there are even numbers of Sides there is always an option to split the sides in two and then just have them alternate. During Conflicts with odd numbers of sides you could elect to split them, with one group just having an extra side, or randomly decide on one thread each round that will either have no event (or a random one) at that time. However, there is nothing wrong with a narrative getting messy in practice if you understand the structure underneath, you can always simplify later.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"t13ne-example"} -->
<p class="t13ne-example">In our example, it would make sense for Sister Mary-Immaculata to take multiple Frays in a row while in the village. The Yarn-Teller can extend the Mask’s Fray, repeating it as she still has to hide as Tammy in later Scenes. However, they can elect to add some other Snags, like The Myth’s Fable - where she must actually lie, and The Butcher’s Big Bad Snag. This means that Gerald has Two Monster Facets when he and "Tammy" meet - He’s a Necromancer so Villain (S) and Maker (C) are the most obvious Monster Facets, and he also has Plot Armour from The Butcher Snag.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the party of PCs has been Hooked on a single Side then this can allow simplification of the sides, where a side is either with the PCs, or against them, but the Yarn-Teller should be wary of this simplification as it removes huge amounts of complexity that can be achieved by having the PCs interact with the other sides sometimes as allies, sometimes indifferently, sometimes as foes and sometimes not at all. The actions of other sides can also become background to decisions made by the PCs even though they have never met anyone from that side, through their interactions with other sides. This can allow a Yarn-Teller to create a more realistic feeling world, where Characters they have no knowledge of, and who have no knowledge of them, interact with the Players and their Character decisions.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It can be helpful to only consider Warps as occurring when one side is being affected by another. Sister Mary-Immaculata is forced into disguise as a Warp, so she must be hiding from another side (probably Gerald’s side), but then has her encounter with Sir Kelvin. Sir Kelvin is also experiencing a Warp, but then immediately switches to a Weft as he encounters Tammy and is assisted by her, she still continues to experience the Warp’s Fray of hiding, but also her Snag of responsibility. Sir Kelvin immediately after being healed is affected by another Warp and feels compelled to find out more about the maid who has helped his people, and who he feels indebted to. This could in turn force a Weft upon Sister Mary-Immaculata, where she makes a gain of a job (that perhaps she doesn’t want), but she still has the Warp from Gerald’s side affecting her, she still must hide.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Treating the sides of the Conflict as weaving or braiding threads, can give you interesting ideas for how the sides might interact and allows complex Stories to emerge from even a simple Conflict Loom. The Referee or Yarn-Teller can combine Scenes together, so if three sides are experiencing simultaneous Warps, and another three are taking Wefts, they could combine the Frays into some enormous Fray, where Ordeals and Tests are taking place during a Quest. The same can be true of Sweeping during the Wefts, with combined Gain, Revelations as well as Recovery all being possible simultaneously as an Elf Queen helps the party out or something.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Since, only the Scenes with Player Characters (or Protagonists) in them really need to be played (or written), if there are no PCs involved in the Scene, then you can simply skip it (although it is worth thinking about what occurred during them as it will add depth to the narrative if NPCs turn up with new injuries, hitches, purchases or training after a suitable break). These skipped Scenes never need to be played out, but events that happened during them may later be revealed with the help of Lores standing in for those Gains that were never "made" if need be.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>The Rules of the Loom</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When creating the Loom there are rules that are worth bearing in mind throughout the weaving, they are presented in no particular order, and only one is always more important than the others (although the others will shift in position from game to game, group to group, and even story to story):</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>The Believable Loom</strong>: Also known as Suspension of Disbelief. Belief is a powerful force in a narrative. If something is believable, at least within the context of the story, then Players and other consumers (like readers) will have a much easier time accepting the story. The Referee or Yarn-Teller should try to weave a narrative that everyone can believe happened to those Characters. Sometimes one of the other Rules will allow Suspension of Disbelief to continue, because it was just so cool, or funny, but in general you should try to make the narrative feel plausible. That means if you establish rules of magic, or a super-technology, or mutagenic abilities for your Characters, don’t break them, work with those rules you’ve established and everything will feel more real.</li><li><strong>The Logical Loom</strong>: Also known as the Rule of Narrative Logic. Few Scenes of the Loom exist in isolation, generally each Scene should follow logically from what came before. If the Story is about the war between two rival Clans then logically, the war will start small with a minor attack, and build to a huge climatic battle between the sides. It would be illogical to have both sides suddenly come together in peace because one side murdered the ruler of the other, instead that side would plan revenge.</li><li><strong>The Surprise Loom</strong>: Also known as the Rule of Subverted Expectations. The Logical Loom is predictable, and creates formulaic stories. If your Players or readers can easily predict the end of the Story from the opening, then you need surprises. The Surprises should not necessarily break the logic, but represent a change in circumstances that could not be foreseen. Perhaps an external party suddenly attacks the land of warring Clans, forcing them to work together, or perhaps the side with the largest army suddenly suffers a natural disaster, such as a famine, that reverses their fortunes. Surprises can come from Yarn Cards, Stress Events, or as a result of Failure Levels on Tests, as well as being planned by a Character. </li><li><strong>The Automatic Loom</strong>: Also known as the Rule of Flow. Some Scenes suggest themselves automatically, without any real logic or sense of purpose, they just feel right at that point in the narrative. This often occurs because Players don’t behave in a logical way (from a the Yarn-Teller’s perspective), and Characters certainly don’t. Yarn-Tellers learn to read and go with these changes to maintain the flow of the Story. Be careful with the rule of Flow, while the Automatic Loom can be your friend for a Scene or two, it can quickly escalate if you don’t abide by the other rules, and the whole narrative can spiral out of control.</li><li><strong>The Wyrd Loom</strong>: Sometimes known as the Rule of Fate, this Rule is most important when there are prophecies, or time-travel involved. If the future is meant to go a certain way, then the Plot and the Characters may act illogically to bring this about. If the warring Clans are historically known to finally ally through marriage, despite the problems they faced, then that becomes a Rule that defines how events unfold. The Plot will try and keep the Story on track, and can use time-travellers, or even Fae to keep it there.</li><li><strong>The Glorious Loom</strong>: Also known as The Rule of Cool. Let’s face it, sometimes Players come up with an idea so gloriously cool that the Yarn-Teller has to incorporate it into the Narrative, even though it breaks one, or even all, of the other Rules. The Rule of Cool traditionally indicates that if something is awesome enough, it becomes believable, but we advise you to beware of clichés, clichés can look and sound cool, but aren’t really. This can also become confusing because cool is always very subjective. Some people may think what you suggest / planned is cool, others may think it’s very uncool.</li><li><strong>The Comedic Loom</strong>: Also known as the Rule of Funny. There is an argument that in a Comedy genre anything funny is allowed, no matter how illogical or world-breaking it may be. Humour can be an effective tool in narrative building, but can also break a Plot if it is taken too far. Yarn-Tellers, should always allow something humorous to happen because of Players, but be prepared to have to rebuild Tension, and repair any damage to the Plot based on the other Rules.</li><li><strong>The Tonal Loom</strong>: Also known as the Rule of Drama / Fear / Romance / Funny (again). The Tonal Loom is very like the Comedic Loom, but applies to another, usually genre specific situation. Comedy is not limited to comedies, and fear is not limited to Horror stories. However, usually you want your Rules to reflect the Genre and Tone of the whole. Working with the Tone and Genre is important part of the believable Loom, but here each Tone offers a new way for the Suspension of Disbelief to continue. In Horror if the monster is scary enough, it gets a pass from disbelief, or in a Romance an event that might be unbelievable, because the logistics of arranging it are almost impossible, can become overridden by "Aaw, how romantic!" </li><li><strong>The Numeric Loom</strong>: Also known as The Rule of Rolls. We use dice-rolls, Scores, Ordeal Card Pips and other Character related or generated numbers in the game to decide how well things go for the Characters. Perhaps the PCs just roll terribly, and can’t build that device they wanted, or perhaps they can’t hold the keep, or maybe they just kill everyone they fight because they always draw Wild cards. In general, you should let that happen. PCs and other Embodiments probably shouldn’t die (at least not until the Zenith, and never regularly), but they can certainly get captured, injured and lost. Rolls can act as a Prod or a Break too, adding Stress, Strains or resulting in Shock, Drama or heightening Tension, so they should always be allowed to stand, even if they initially seem to be pushing your Narrative somewhere you never thought it would go.</li><li><strong>The Doomed Loom</strong>: Also known as The Rule of Cards. Yarn Cards are often how we decide what Scenes to give a Narrative, although they are just one Rule out of many and the Yarn-Teller should balance the needs of the Narrative against what the cards suggest. The Yarn-Teller (usually as a Plot) plays cards from their Hand or Pool to guide the Narrative. The cards may decide that a Fray consists of a Battle, or that it is an Item Creation Ordeal, as well as what the Snags should be, or they may define the Scene Significator, the Revelations learnt, or what Gain was made. The Yarn-Teller can look to the Cards that are in play as well to help spark a scenario or scene. A Mercari with a Wyrd Tarot card played on them could suffer the equivalent Yarn Card’s Snag, or the Discard Pile might might point you in the right direction, hinting at what is actually going on at Yarn-Teller level.</li><li><strong>The Collaborative Loom</strong>: Also called the Rule of Cooperation. When playing a game, it is important to play together. The PCs and the NPCs have to weave the story together, and while the Player Characters may be on different sides, the Yarn-Teller and Referee should not consider themselves to be the Player’s enemies in anyway. These are people you want to have fun with, not punish for not seeing your glorious vision with the clarity you have. Work with them, incorporate their actions properly, and never, ever, ignore what they want to achieve. The Players are their to have fun and it is impossible to really have fun if the Yarn-Teller or Referee is removing your agency. The Plot may pit Characters against each other, but Players should be enjoying that struggle or the Plot and Yarn-Teller running it have failed.</li><li><strong>The Entertaining Loom</strong>: Also known as The Rule of Fun. Most people play games, or read fiction to have fun. So <strong><em>the most important</em></strong> Rule when weaving a Narrative is, that it should be fun for the Players or Audience. Entertaining Players is usually a case of finding out what sort of Narratives and games a Player enjoys most. Players come in lots of types (see the Coping with Players Rules page) and everyone has different things they enjoy in a game or Story. Don’t forget though that the Game should also be fun for the Referee and Yarn-Teller as well as just the PC Players. If you aren’t enjoying the games you are running, then something needs to change. Be aware of the "Gamesmaster Fiat" as well with this rule. Just because the Yarn-Teller thinks its fun to try and kill the PCs without warning, doesn’t mean they necessarily will, and forcing events on Characters purely for the Lolz is the worst thing a Referee can do (Rule of Funny may disagree).</li><li><strong>The Tensioned Loom</strong>: Also known as the rule of Suspense. The Suspense Level of the current Scene can be seen as the most important factor of a Plot, it governs which Characters are allowed to mix together, and sets rules for the sorts of interactions that should be allowed between Embodiments. Player Characters, of course, can often ride roughshod over these rules, with Embodiment Characters interacting when their Players like, not when the Suspense Level demands it, but the Yarn-Teller should try and maintain these rules where they can, or adjust the Scene Tension-Level to match the actions of the Characters involved, then adjust the other Suspense Levels of the Act and Plot. Often when running multiple simultaneous Plots it can be hard to know which Scene from which Plot to run next. The Tensioned Loom states that the Plot with the highest Tension-Level should take the lead, all other needs being equal.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Some Referees, Games, or Universes will add additional Rules to this base list. Some Tapestries may structure the rules in a particular order, often a Genre piece will place The Tonal Loom in position one, but this is not always the case. Games should often place the Entertaining Loom in the higher positions, and authors may also wish to keep the audience in mind no matter what the rest of the system is telling them should happen, if they don’t believe their audience would enjoy what is presented they should be free to ignore, redraw, or reframe what is happening.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>The Zenith</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Zenith is the culmination of the Plot. It is what the Plot has been building towards this whole time. The Zenith can vary in form depending upon the type of Narrative, the genre and other factors like the number of Sides and the Suspense Level.  There are a number of optional plot points that you can use here in any Order or blending, not every type needs to be present in the Zenith and only one is guaranteed or required:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li> <strong>The Final Revelation</strong>:  If there is any information left to give the PCs (or the reader) this is the moment to drop that data. Final Revelations are the moment the hero realises what must be done, and perhaps even how to do it, often this is the moment we learn who the killer was, their motives, and how they did it. These can be multiple stacked Revelations, just like a Frame Revelation, revealing Lore about the Bad Guy that powers them up or explains their abilities that have already been demonstrated. This can also occur in an Epilogue, revealing the new state of the world following a Completion, here the Lores revealed may dictate the eventual fates of numerous characters.</li><li><strong>The Final Ordeal</strong>: Often a fight, occasionally a battle, the Final Ordeal is the culmination of everything that has gone before it. It will have the highest Stakes so far (or at least equal highest), and usually has the Highest Stage Difficulties (up to 4-7 cards per Stage). </li><li><strong>The Final Test</strong>: Usually a Final Test is a Test of resolve, intelligence, or courage, and should more of a roleplaying experience than a dice-rolling experience. But inevitably there will be a single dice-roll that will be important for the Character.</li><li><strong>The Final Reward</strong>: Usually after, or just before the Narrative is complete there will be a Final Reward, a Gain that the Pressed side makes, this might be the weapon that lets them win the war, or the prize that they have won (such as the princesses hand or a throne, crown and kingdom), most often it is the marriage (or at least a symbolic kiss) at the end of the Romance.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Resolving and Completing</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Zenith is when the Plot is resolved, and Plots can resolve in a lot of different ways, depending on how the PCs and NPCs have behaved, rolled and interacted. Sometimes despite their best efforts the PCs may have failed to ever really interact with the Story, other times the Plot may have pushed them around completely, and the Characters may have been bashed about, mauled and killed by a Plot, occasionally with good grace and some luck the PCs may have won the day, and made dramatic changes to the world, more often they defeat one villain only for another to rise within days to fill the power vacuum.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="plotResolutions"]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":2}-->
<h2>Pacing and Suspense</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Pacing games and Narratives is a slightly arcane art. There can be a temptation to make everything fast-paced and exciting, but if everything is fast-paced, then it begins to feel the same as being moderately paced.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The way around this is to increase and decrease the pacing, speeding up and slowing down, to create differences in pace. When the pace changes dramatically this contrast creates a greater sense of pace than going full-on all the time.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A fast action sequence of a death-defying underwater chase feels faster if it follows a scene of relaxing on a boat. Conversely, resting in the brig of the enemy submarine after being captured will feel much slower paced because it follows a chase than it would have done as the opening Scene of a Hook.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Suspense varies significantly through the Narrative as well. The fact that high Suspense-Levels are required for all Embodiments to be present, and particularly high Suspense-Levels can cause Plots to throw Monster Facets on their Embodiments. Monsters grow in power as the Suspense-Level increases, able to reveal more abilities to the other Sides Embodiments. This can cause a Yarn-Teller to associate high-suspense with quick pace, but actually Action Scenes can happen at lower Suspense-Levels, but with higher Stakes than the Suspense-level may recommend, because Action is not as suspenseful and tense, as a slower high tension Scene can be much higher in Suspense-level. Action Scenes are stressful, and often dramatic, adding Stress and Strain to Characters, which can in turn lead to Shocks, Dramas and changes to the current Suspense-Level, but those changes do not always have to be to higher Suspense-Levels.</p>
<!-- /wp:paragraph -->
')
,
array('RulePage'=>'Modelling Weather', 'Description'=>'<!-- wp:paragraph -->
<p>Weather is complex stuff, especially across the whole Omniverse, there are planets out there where it hails diamonds, or rains molten metal, and that&apos;s without crazy Fantasy stuff, we know these places exist within our own universe.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Weather is a complex, chaotic system, and it is almost impossible to calculate a true system that is completely predictive. So instead, we generally use random tables and cycles.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td>Roll</td><td>Winter</td><td>Spring</td><td>Summer</td><td>Autumn</td><td>Weird</td></tr><tr><td>1</td><td>Ice</td><td>Light Snow</td><td></td><td></td><td></td></tr><tr><td>2</td><td>Freeze</td><td>Mist</td><td></td><td></td><td></td></tr><tr><td>3</td><td>Frost</td><td>Frost</td><td></td><td></td><td></td></tr><tr><td>4</td><td>Crisp</td><td>Warming</td><td></td><td></td><td></td></tr><tr><td>5</td><td>Cool</td><td>Overcast</td><td></td><td></td><td></td></tr><tr><td>6</td><td>Mist</td><td>Drizzle</td><td></td><td></td><td></td></tr><tr><td>7</td><td>Light Snow</td><td></td><td></td><td></td><td></td></tr><tr><td>8</td><td>Heavy Snow</td><td></td><td></td><td></td><td></td></tr><tr><td>9</td><td>Blizzard</td><td></td><td></td><td></td><td></td></tr><tr><td>10</td><td>White-Out</td><td></td><td></td><td></td><td></td></tr></tbody></table><figcaption class="wp-element-caption">simple weather table(1d10)</figcaption></figure>
<!-- /wp:table -->

<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td>Roll</td><td>Temperature / Precipitation Type</td><td>Cloud Cover</td><td>Preciptation</td><td>Wind</td><td>Weird</td></tr><tr><td>1</td><td>Bleak / Solid (Ice Pellets /  Snow/ Ice)</td><td>Clear Skies: 0% Cover</td><td>Parched</td><td>Still: The air is too still allowing smells and warmth to build up.</td><td>Insect Swarms: Locusts, flies, flying ants, something like that.</td></tr><tr><td>2</td><td>Freezing / Solid (Snow / Ice)</td><td>High Cirrus: 1–10% Cover</td><td>Dry</td><td>Light Air: Smoke drifts and ripples appear on water, but you will probably not feel it.</td><td>Strange precipitation: Rains of blood, fish, frogs, jelly, petals and sand.</td></tr><tr><td>3</td><td>Cold / Solid (Frost / Snow /  Ice Pellets / Hail)</td><td>Haze: 11-20% Cover</td><td>Dew / Frost</td><td>Gentle Breeze: You will feel the wind, leaves rustle.</td><td>Noctilucent Clouds /  Aurora: Strange lights in the sky.</td></tr><tr><td>4</td><td>Cool / Liquid (Dew / Sleet / Hail)</td><td>Mists and Haze: 21–30% Cover</td><td>Heavy Dew / Hoar Frost</td><td>Fresh: You can fly a flag or a kite</td><td>Tornado, Whirlwind, Waterspout: A twister, a swirling vortex of wind, cloud, and dust or water.</td></tr><tr><td>5</td><td>Average / Liquid (Rain)</td><td>Fluffy clouds: 31-60%</td><td>Morning and Evening Mists</td><td>Breezy: Enough wind that you\'d want a coat.</td><td>Heat Burst: Sudden rising of temperature after a storm.</td></tr><tr><td>6</td><td>Comfortable / Liquid (Rain)</td><td>Broken Clouds: - 61-80%</td><td>Spitting / Spotting (light drops of rain/ flakes of snow)</td><td>Windy: Strong steady wind that shakes large branches.</td><td>Heat Inversion: Hot air trapped over cold air.</td></tr><tr><td>7</td><td>Warm / Liquid (Rain)</td><td>Layered Clouds: 81-100% Cover High</td><td>Drizzle (falling mists of rain or snow crystals)</td><td>Gusting: Strong winds, whole trees shake, buffeting.<br></td><td>Firestorm: Often started by lightning. May include fire twisters.</td></tr><tr><td>8</td><td>Hot / Vapour (Humidity / Virga / Mist)</td><td>Foggy: 100% Cover Low </td><td>Showers (Sporadic rains of varying intensity)</td><td>Gale: Walking is made difficult, huge waves and twigs and branches may snap from trees.</td><td>Dust storms: Haboobs, dust devils and sandstorms, lots of wind and tiny flying stones.</td></tr><tr><td>9</td><td>Sweltering / Gas ( Humidity / Smoke / Toxic / Steam)</td><td>Overcast - 100% Cover Mid and High</td><td>Rain (Continuous rain over several hours)</td><td>Storm: Huge waves and storm surges, Trees uprooted, buildings damaged.</td><td>Thunderstorms: Lightning and thunder. Mostly the rumbles and shocks.</td></tr><tr><td>10</td><td>Burning / Plasma (Fire, lightning, burning liquids)</td><td>Dark Skies: 100% Cover thickest cloud</td><td>Torrential Rain (Heavy downpours of water, cloud burst and rainstorms, often causes localised flooding)</td><td>Hurricane: Wide spread damage and destruction</td><td>St. Elmo\'s Fire: A Coronal DIscharge from a tall pointed object such as a spire or mast, Often proceeds a lightning strike or volcanic eruption.</td></tr></tbody></table><figcaption class="wp-element-caption">simple weather table (1d10)</figcaption></figure>
<!-- /wp:table -->'),
array('RulePage'=>'Characters and Plots', 'Description'=>'<!-- wp:paragraph -->
<p>T13 is a Narrative Engine, designed to create Stories and play games that create stories (although with a simulationist philosophy). Stories need Characters to fill the roles of the Narrative. In T13, Stories can embody the Conflict in many different ways, but most commonly a Character acts as the Embodiment of at least one Side of the Conflict and usually this means they are the Embodiment of a particular Facet. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="embodimentTypes"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>More Complex Characters occur when they are the Embodiment of more than a single Facet or even Side of a Conflict, or when they embody more than one Conflict simultaneously, perhaps causing Internal Conflicts in the Character as they try to reconcile these different Narrative forces and Tensions. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It can help to think of most Characters as conforming to one of these Narrative Archetypes. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="narrativeArchetypes"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>Character Hooks</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>During the Frame Act of any Narrative the Plot tries to Hook Characters, and their players to the Plot. The reasons for this include:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Plots Need Characters</strong> — Plots cannot act themselves, they can’t examine or work a Conflict without Embodiments, and Characters make the most useful and effective embodiments.</li><li><strong>Plots get their Facet Boons from Hooked Characters</strong> — When a Character is Hooked the Plot gets to replace Facet Boons with the Character’s. This causes Plots to target Characters with the Highest Facets for Hooking. Note that for simplicity’s sake we often standardise the Facet Boons of larger Plots (a Cycle, for example, already Hooks everyone in the universe the Cycle contains, so we can say with some confidence that there will be a Scale 13,  26 Boon somewhere now Hooked).</li><li><strong>Playing The Game</strong> — It is a lot easier to bring a Character to care about the Plot if it has also Hooked the Player of that Character somehow. Plots tempt Players by providing tempting ideas, from the basics like, "You like to kick ass? Have I got a bad-ass for you to try and kick." to "You like puzzles? I’ve got a locked room murder mystery, with secret societies of time-travellers, set in a pan-dimensional labyrinth, that connects all human settlements, from Atlantis to Zebulon-9, into one huge city."</li><li><strong>Plots can only affect Hooked Characters and Extras</strong> — Plots can play cards, and spend Yarn to affect Hooked Characters and Extras only. So the only way a Plot can directly affect a PC is by Hooking them, that isn’t to say that the Plot can’t make an Extra attack an unhooked Character (in fact that might Hook them), but the Plot cannot play any Yarn cards on that Character specifically. Plots can get around this by Hooking the Party Pact so they can affect everyone at once where applicable.</li><li><strong>Only Hooked Characters Gain</strong> — Gains are events when a side of the Conflict gets or makes something for themselves. They are how the Plot pays out to the Hooked Characters (and is part of the Conflict Resolution). Unhooked Characters may get a share of a Gain, but never get a Gain of their own.</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Player Characters are usually Hooked to the Pressed side of a Conflict (although sometimes they are Hooked to the Dominant, it is uncommon to play through Tragic Fall Plots with PCs). It is also possible, but rare, for a PC to be Hooked to one of the other sides of a Conflict (although usually not to the Shadows, and never to the Deeper Shadows sides).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Dominant side of the Conflict must be at least one Boon Higher than the Pressed Facet, and any Pressed Character’s Facet Boon, and all Conflict Facets have a Minimum Boon of 13 in all cases. When preparing Conflicts without Hooking Characters before hand, the Dominant Facet can be set to Boon 26 and Pressed Facets to Boon 13. These figures can be updated once the Characters are Hooked.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<aside class="t13ne-example"><p>We’ll examine a simple Story Plot. The Story is a Murder mystery with an Sin (Murder) vs Key (Detecting) Conflict. We obviously want to Hook a Detective (who fortunately often have Sleuth Personalities and High Keys).</p>
<p>Rick Torrence is a suitable gumshoe to Hook, and the Plot goes for a standard cry for help, the sexy widow (who may be a Femme-Fatale), asks him to help find her husband’s killer, as the insurance firm and police are calling it suicide. If Rick Torrence has a Key Boon of 17 and that is the Highest Hooked Character Key Boon, then the Plot also has a Boon 17 for the Key Conflict Boon.</p>
<p>Rick has a 15 Sin, but since the Conflict sets Sin as Dominant over Key then it must be so. The Plot Conflict therefore gets a Sin of 18 (one Boon Higher than the Pressed side), if Rick had a Sin of 19 then the Plot would have been able to claim a Sin Boon of 20 (one Boon Higher than the Highest Boon Hooked). All Plots have a minimum Conflict Boon of 13 for the Dominant Facet (even if they Hooked all the wrong Characters for this Story).</p>
</aside>
<!-- /wp:html -->

<!-- wp:heading {"level":3} -->
<h3>Non-Player Characters</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>NPCs are usually created by the Plot in response to the Characters that have been Hooked. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>They represent everyone else in the world and come in different types. Most are just Extras, they aren’t really important in the same way as a player Character and we don’t need to know much about them. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Some, like Rivals should be similarly detailed Characters to the PCs (or at least Cast Extras). When you Hook any Character you may automatically Hook one (or more) of their Rivals, sometimes to the same side, more often to the opposite.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="rivals"]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>You don’t generally need to include a Hook Scene for the NPCs (however you can if you want). TV shows, Novels and Films do occasionally do this, showing us some inciting event for the bad guy, or showing them first becoming aware of the Plot that they are now working for.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>NPCs are created often as mirrors, foils, or challenges for the PCs, and when a Character is Hooked you should include Characters to oppose them. You can use Rivals, Monsters, Cast Extras, Archetypes or even other Detailed Characters as the opposition, as you wish.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plots gain Yarn from every Character that they create. You can think of this as being the Cost in Yarn for that Character, and no matter how many you have, you only have to pay for the first. So if you add a Vex Extra that "costs" 1 Yarn, 1 point is added to the Plot’s Yarn.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Teller Characters trying to do the same thing for one of their own schemes, would have to pay this cost (usually by rolling to generate enough Score with whatever reality-bending ability they are using, or paying the Yarn cost with Chi). However, it is also possible for a Yarn-Teller to spawn a Subplot from another Plot and then the Subplot will create its own Extras and other Characters without the Yarn-Teller having to pay these costs. It should be noted thought that Yarn-Tellers do not, and cannot, have complete control over any Plot. Plots are always subject to interference from other Yarn-Tellers, particularly other Plots.</p>
<!-- /wp:paragraph -->'),
array('RulePage' =>'Plot Descendants' , 'Description'=>'<!-- wp:paragraph -->
<p>Plots create Descendants, most Descendants they create are automatic, as Plots fill worlds with buildings, vehicles, clothes, corporations, business, churches, in fact everything that isn’t a person or animal (and even some of them) is probably a Descendant.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plots usually have two types of Plot Descendants, important and casual. Casual Descendants are set dressing, the TV in corner, the phone on the wall, the cars and street-lights on the roads, the trees in the wood, the flitting space-shuttles and star-fighters about the space port. These Descendants aren’t usually important enough to really worry about. They are there because the description says they are, and unless someone wants to watch the news, call a friend, drive, chop one down, or sneak aboard one, we don’t need to think about them. Even the act of using them doesn’t make them important, they are still just a casual Plot Descendant.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Important Descendants mean something to the Plot and the system too. Important Descendants might be that magic ring, or Djinn-infested lamp, holy relics, prototype weapons, the bad guy’s powered armour, space-fighter, battle-moon, castle, or lair. They are important, because the Plot needs them for some reason, most often as a Location for the Story to play out in.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Locations</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Every Scene should have a Location (although it doesn’t have to be unique to that Scene). Every Plot should keep a list of its own Locations. It is recommended that each Plot, or tale, has at least one unique Location, as it helps to make Plots feel more unique. Unique, memorable Locations make for better, more memorable Narratives, and usually more fun games. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plots don’t need to create and pay for Locations, instead some of these Locations add to the Yarn of the Plot. It is assumed each Scene has at least one Location for free, with a Size no greater than the Central Conflict Annex. Additional Locations "cost" 4 Yarn (+ the Location’s Size in Yarn). So adding a Room adds 6 Yarn to the Plot, adding a new Country (such as a small Nation State) adds 21 Yarn.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>These Yarn "costs" are added to the Yarn of the Plot, and is used to pay for Gains that Characters Hooked by the Plot make.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>MacGuffins, Plot Coupons and Devices</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Physical Descendants can serve a variety of purposes for a Plot. First we have the MacGuffin. The MacGuffin is a Plot device, an object that Characters on all sides of the Conflict want. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The MacGuffin traditionally isn’t actually important to the Plot for any reason other than to drive the Plot forwards. However, for a MacGuffin to work the Characters have to want it, and in a game situation that usually means that the MacGuffin has to be expensive, useful or powerful. Examples might include prototype weapons and technology, magic weapons, and for some reason, Falcon statues from Malta... </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plot Coupons are probably best thought of as the pieces of a MacGuffin, although in the case of a Pact-Descendant, they can represent Members (we’re getting the band back together). They must be collected to be redeemed for an actual MacGuffin or Device. Plot Coupons turn up in video game plots quite often and occasionally in movies; just collect these shards, parts, or pieces from these dungeons, or opponents, and we can assemble the snazzy gauntlet of universal demi-genocide, the symbol of the goddesses’ powers, or whatever. Plot Coupons usually reflect the Facets of the Conflict (as Descendant, Lore or Pact-Descendants) in some way, for example, when assembling the Band each member will represent a different Facet, or if collecting Crystals each one will have a different colour, or name, and some power inspired by the Facet or one of its Proficiencies.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Devices are Descendants that aren’t really important to the Plot, but are usually important to the Characters. Devices are often things like magic weapons in high fantasy, they don’t usually drive the Plot forwards themselves, but they may help Characters move the Plot on. Devices can be as simple as a dagger, or as complex as a learning a School of Magic. What is important about a Plot Device is that a Character is given the Device by the Plot (often as a Gain), to help examine the Conflict. Because the Device is "of the Plot" it must Embody the Plot Conflict some how, usually as the Descendant Incarna, but a subtle Plot would Embody it as a Hitch, or as the Proficiencies of probably the Master Annex. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Regardless of whether the Plot is using a MacGuffin, Plot Coupons, or Devices they have to be paid for by the Plot. Plots however care nothing about the Boon of a MacGuffin, etc. only the type of the Descendant is important.  Skill Descendants cost 1 Yarn, Talent 2 Yarn and so on up to 6 Yarn for an Artefact (see the Sway Table). Again these "costs" are actually granted to the Plot and paid out in Gains (usually of the actual McGuffin etc).</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Pacts</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Pacts are, perhaps, the most important Descendants that a Plot can have, after all Plots create Pacts with the Characters they Hook. For Narrative purposes, Pacts are often the most important Descendants a Plot can create or use.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Pacts are groups of Characters, if the party of PCs is a Pact, then the Plot can Hook the whole party with a single Hook, and then create a Pact to oppose them. Perhaps the Plot will create a Ninja Clan, Thieves Guild, or Criminal gang to oppose the PCs.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Pacts are purchased for 5 or 6 Yarn as a base, but like Locations the Size of the Pact is also important and adds the higher Yarn cost of either the Group Size or the Character Types (a Pact with one Yarn-Teller or several hundred Heroes both add 6 Yarn). </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Lores</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Lores are a special sort of Descendant that Plots grant to Characters (usually NPCs) through Revelations. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Perhaps a Player Character finds out that the Bad Guy is a Vampire through a Revelation (like noticing he has no Shadow or Reflection, this would create a Lore for the Bad Guy, that would grant them a "Vampire powers" Power Annex and a "Blood Dependence" Hitch (we’ll get to the sizes and details in a bit).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Lores come in three types:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Distinction: Distinctions are the least powerful Lores. Distinctions can only create Skills, or sometimes Talents, and Quirk Hitches. They are created by 2-3 Revelation Cards.</li><li>Reputations: Reputations are more powerful than Distinctions, they can create Powers, Talents and Skills and Quirk and Flaw Hitches. They are created by 2-8 Revelation Cards.</li><li>Legends: Legends are the most powerful form of Lore. They can create Super-Annexes, Powers, Talents and Skills, and Woe, Flaws and Quirk Hitches. They are created by at least 4 Revelation Cards. </li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4>Building Lores from the Revelation Cards. </h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Lores generally are constructed from Revelation cards as follows. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each card of the Revelation can represent a Facet (the Facet for each is noted on the Card,  e.g. a 2 of Diamonds is Awe). The Facet has an effective Boon based on: 11 + Character Scale + Card Pips. Usually the Yarn-Teller will specify the Proficiencies that the Lore accesses (based on the Information revealed).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>E.g. From 2 cards at Scale 0 (for simplicity’s sake), a 8 of Hearts (Nature: 19) and a King of Diamonds (Awe:24), could create a Nature-Awe "Scary" Skill with a Boon of 33 (Value 298), additional cards can add Facets as Umbrals and Nimbeds to create Talents or Powers, as required. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Revelation has two pairs of the same Facets, then you may make a Super-Annex Legend.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Creating Hitches is usually a matter of taking one of the Facets from the Card (or a separate card may be used, if you have any left from the Revelation) or the Facet’s Anti-Facet. Generally the Hitch will have Boon equal to Scale + Pips -1 (to the limit of that Facet Hitch Type for the Character, so Quirk Hitches are usually small enough) with multiple cards with the same Facet stacking Pips to create larger Flaws and Woes when appropriate. E.g. The 8 of Hearts could create a Boon 7 Scars or Impoverished Hitch at Scale 0, a King of Diamonds could create a Boon 12 Fear or Exposed Hitch. Multiple cards can combine together to create larger Hitches (e.g. a Queen of Diamonds could add a Boon 11 Impoverished or Scars Hitch to the 8 of Hearts, creating a Flaw or even Woe Hitch).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is fairly common to create these Lores when preparing the Plot for play, but they can be created on the fly by experienced Referees without too much hassle. One trick to creating suitable Lores quickly is to have a suitable list of possible Lores prepared for the Game, Plot, Location, Genre, or Era as required. It can help to think of Lores as additional information that might be revealed about the Character such as: </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>History — Lores are often about a Character or Descendant’s history, perhaps they lived through a plague, or a particular battle, either way the events will have left Scars and indicates that they have skills for an extreme circumstance such as surviving that event, such as immunity to the plague.</li><li>Species — Usually human, but not always, finding out that the Bad Guy is actually an Elf, an Orc, Giant, or a Tengu, will make a big difference to the abilities they have.</li><li>Bloodline — What family someone is from can be very important in some circumstances, tribes, clans, nobility and the fact that their grandfather was a dragon can all give a Character access to different Annexes and Hitches.</li><li>Mutations — some mutations include weird allergies, food intolerances, unusual or strangely coloured features, tumours, skin lesions, or working bat wings... depends on the genre and setting.</li><li>Job — what job a person does can tell you a lot about them and their capabilities, whether its an occupation like taxi-driver or forester, a vocation like priest or doctor, or a profession like architect, lawyer or scientist.</li><li>Hobbies — knowing what a person likes to do with their spare time can be invaluable to working out what they can do, someone who practices a sport or musical instrument will have skills that others don’t.</li><li>Descendants — knowing that someone is a member of a Pact, owns a particular Location, or is the current owner of the Talisman of Ultimate Evil can be essential information, although usually the Descendant would be specified before hand (and may even have Lores of its own). </li></ul>
<!-- /wp:list -->

' ),
		array('RulePage'=>'Plots in T13', 'Description'=>'<!-- wp:paragraph -->
<p>T13 has a unique way to think about narratives and their impact on the universe. Human beings are unique, as far as we know, for being the only species that tells stories, in fact we even tell stories to our selves, creating narratives from all the events that happen to us. It is how we understand things best. So into what could be a strict simulation of reality, full of numbers and facts, we add Plots to guide and shepherd Characters into creating something that feels like a story. We consider the Plot to be a sort of Character, a Plot Daemon (in the computing sense) if you will, trying to direct (although it may more closely resemble herding cats) the Characters, most commonly to explore aspects of specific Conflicts between Facets. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Conflict is like the Personality of the Plot, it decides how powerful the Plot is and often what the Plot wishes to achieve. The Conflict also governs the sorts of Stories that the Plot can tell (or is a part of). Like a lot of things in T13 we can consider the Conflict to be a type of Annex, in this case the Central Conflict is the Master Annex of the Plot.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>As well as the Conflict, the Plot is also where we store all the plot specific Characters, Locations and Descendants that the Plot may throw around.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Plot Rank</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Rank of a Plot is one way that we can determine how powerful it is. Larger Ranked Plots can affect more Characters, even entire universes can be rearranged by even the middle-ranking ones. Plots range in Rank from Scene to Cycle.
</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="plotRanks"/]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Conflicts</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Conflicts are the meat of almost every narrative. There are a few exceptions, but in general conflict drives the T13 Narrative Engine. Stories are shaped by Character’s experiences, their successes, and failures, and the Conflict pushes at Characters, creating situations that test them, causing them to fail and succeed (and a whole lot of in between the two as well).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Now, you may be saying, "No, I don’t like Conflict as a narrative force, I prefer Event-driven, or (more likely) Character-driven Narratives." Well, that’s fair enough, but what we mean in T13 by a Conflict isn’t necessarily two Opposed sides fighting (although it can mean that). In fact, both of those narrative forms, Event-Driven and Character-Driven narratives, actually utilise Conflicts, but they embody the Conflict completely within the Character(s) or Events themselves. One Character or Event can embody both sides of a Conflict, and create drama and tension within the normal scope of any Event or Character driven narrative, without a shot fired or even an angry word spoken. The T13, Conflict can even play out as a romance, which is about as far removed from most peoples idea of Conflict as you can get.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In games of T13, the Plot and therefore the Conflict,<em> must always </em> take a back seat to <strong>Player decisions</strong>. The Plot cannot force the Players to take certain actions, but it can usually limit their choices, just as the positions of doors and windows may limit what you can see, and which room you enter next. There is a careful balance to be found when gaming between the Players, their Characters, and the Plots. Good Referees and Yarn-Tellers should expect that not every Plot will work out, and never exactly as planned, and that you should talk to your Players about what they would find as acceptable future Plots, as well as using fore-shadowing and other devices. Good Players will also work as a Yarn-Teller, as a Hero, or even a Grunt, with the other Players, including the Referee, towards making the story better and more dramatic, and therefore more fun, rather than just trying to "win". There is little drama in winning, but much more in failure, or even near-failure.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>A Simple Opposed Conflict</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13, the Conflict is defined by using the Facets. We can start by considering a simple Opposed Conflict.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This Conflict appears again and again, throughout literature, dramas, and other forms of fiction, as <strong>"Good"</strong> vs <strong>"Evil"</strong>. This is the Conflict at its most simple, primal, and understandable. Good is a Proficiency of the Virtue Facet and Evil is a Proficiency of the Sin Facet, it doesn’t really get more simple than that.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Sin is the stronger of the Two in this Conflict usually, so we call this the "Dominant" side. The Evil oppresses the Good, who must be helped and are called the "Pressed" side. For this reason, we consider the T13 Conflict as Sin vs Virtue. So that we know which side is Dominant and which is Pressed from the position. Tensions between the Embodiments of Sin and Embodiments of Virtue create the Story, which we will look at later.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Actually though, the iconic Good against Evil Conflict rarely occurs in isolation, Orthodox and Heresy (Truth and Lies), Liberty and Wyrd (Freedom and Justice / Fate) and other Facets or Proficiencies also tend to get mixed in to the Conflict more often than not. In fact, a truly powerful Plot could have all the Facets involved perhaps forming two opposed sides (often Yang Facets vs Yin Facets), or even all the Facets on both sides, just with the Dominant Side having higher Boons. In fact, a two Facet Conflict is probably too simplistic. Instead, we recommend at least four Facets are present in even simplest Story Conflicts, this allows for a number of sides to have a more than one Character Embodiment, which allows for more complex interactions and narratives.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Conflict Total</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When we use T13 to measure something as nebulous as the sides of the Conflict, we ground this by thinking in terms of Boons. Typically, a Plot will have Boons that usually have a value between 13 and 26 (adjusting for Scale this could be much higher or a little lower) for each Facet that is involved in the Conflict. For the Central Conflict (and the most important Conflict Total) you add the Boons of every Facet involved in the Conflict directly. So two Boon 13 Facets create a Boon 26 Conflict Total.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Conflict Totals can vary a lot, based on the Characters that are involved in those Plots, which can make them very difficult to create on the fly. It can be hard to know which side of a Conflict should be more powerful and what that means in terms of Boons.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="table" array = "characterBoons" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Each side in a Conflict has a number of Facets available to it (and a Boon for each Facet, usually based on the Hooked Characters Facet Boons). This allows a Conflict Total for each side to be calculated (by directly adding the Boons), effectively creating a Super-Annex for each Conflict side.<br/>A Plot therefore can be thought of as having a minimum of 3 annexes.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Conflict Annexes</h4>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>The Central Conflict</strong> — the whole thing, all the Facets on both sides. This is the Plot’s Conflict Total. It is the largest Annex available to the Plot, and is used to calculate the Hand the Plot can play as a Yarn-Teller</li><li><strong>The Dominant Side</strong> — which is the side that has control of the situation at the beginning. This might represent the status-quo, the elite, or the bad guys depending on the actual situation. The plot will usually rely on this Conflict Total to assist the Dominant side of the Conflict during the Plot (adding it to rolls or drawing extra cards as the Plot requires to keep the Dominant side ahead, along the way).</li><li><strong>The Pressed Side</strong> — this is the side that the hero or heroine belongs to. Often the Plot doesn’t use this side very much (but it can be used for determining the size of Gains and similar rewards during the Narrative).</li></ol>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Complicating Conflicts</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Of course, simple, opposed Conflicts between a Dominant side and a Pressed side aren’t the only way that Conflicts can drive the Plot forward (although they are the easiest to understand). Here are some other options:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Both Sides are the Same</strong> — Generally, both sides of any conflict think they are the good guys. Sometimes it can just be hard to tell which side is worse. When you really want to play with this you can put the same Facets on both sides. Perhaps two evil, authoritarian city-states clash in battle, both may have Sin, Orthodox and Dominion on their side, or two Holy Orders compete for the Grace of God with Virtue, Orthodox and Wyrd on their sides. The point is, a balanced Conflict can be spun out into oodles of narratives. As there is rarely any clear winner, the plot keeps Revolving coming up with new generals, armies and lords from either side to grind upon.</li><li><strong>More than Two sides</strong> — Sometimes (actually quite often) Conflicts can be much more complicated than one side versus the other. Conflicts can have multiple sides and they can interact in complex ways. You don’t have to have every side represented, and often sides will join together becoming a new larger version of one of those sides as the Plot progresses [t13ne type="tabledisplay" array="conflictSides" /]</li><li><strong>Asymmetric Conflicts</strong> — Just as you can have multiple sides, those sides don’t have to be equal in their power. You can give the Dominant side of a Conflict more Facets than the Pressed side(s), or less commonly the Pressed side may have a Facet advantage, but generally should still a smaller Conflict Total.</li><li><strong>Cooperative Conflicts</strong> — Sometimes enemies come together and work towards common goals, this is sometimes because of a worse side appearing (often a new Dominant or Above side), but it can be for other reasons. Tensions will still push and pull at the sides, trying to break the cooperation between them.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Yarn-Telling and Plots</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Plots are generally how the Referee uses Yarn-Telling and Yarn cards. The Plots are the Referee’s Yarn-Tellers. To represent this we give each Plot at least one Yarn-Card as a Plot Significator. The Plot can Play any Yarn-card as its Plot Significator, at no Cost. You can give each Side of a Plot a separate Significator (although we rarely give the Pressed side their own — see below), so the Central Conflict might be A &clubs; (The Court), which means the over all themes are probably a legal case or set in a king’s court, while the Dominant Side Annex may have an 8 &diams; (The Cultist), implying a conspiracy is afoot.
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p><strong>Pressed Side Significator</strong> — The Pressed Side of a Conflict does not have a Significator in the usual sense. Instead, the Pressed Side Significator indicates something that the Plot is lacking, or limited by, often in regard to the Pressed Side.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Referees can use cards to randomly build any Plot from components like Scenes and Acts. This is done through a Plot Hand.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Plot has a Plot Hand that can hold as many cards as the Maximum for its type (and has a Minimum Size that it must Draw if it falls below). However, generally it Draws according to the Side being affected’s Conflict Annex Draw. When creating Sweeping events, Gains and Revelations for the Pressed side, the Plot can add the Pressed Side’s Conflict Draw. In fact, that holds true for every side. If the DeeperShadows need to Draw and Play cards then they should use their side’s Conflict Draw to do it. Only rarely will the Conflict use its Central Conflict Annex to Draw, if it is trying to gain a big enough hand to create a Conflict Spread or and Act spread for example.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Referee (and occasionally other Yarn-Tellers) can play from this Plot Hand as they need to (and can play cards as Yarn, Wyrd Tarot and Ordeal cards as they wish for the Dominant side). This Plot Hand is similar to a single Player Character’s Wyrd Tarot Hand and Ordeal Pool combined, just like most Yarn-Teller’s Yarn cards. Yarn-Tellers and Referees can add their own Yarn-Cards into any Plot Spread they are creating along with the Plot Hand.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is largely up to the Referee when and how the Plot plays these cards, but these are the main types that we consider.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="tabledisplay" array="plottingTypes"/]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Embodiments</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Embodiments are how the Facets of a Conflict interact in the Narrative. Usually the most important Embodiments of the Conflict are the main Characters, often the actual Facet will embody as a Character’s Incarna, Persona, Core or as a Hitch, but Plots also Embody as other aspects of the Story.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="embodimentTypes"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Tension between Embodiments drives the Narratives in T13, by which we mean that if you Embody one side of a simple Conflict in one Character perhaps as a Persona, and the other side of the Conflict is embodied in a Location say, then the Character will feel drawn (or even pushed) towards that Location. Events should coincide to force that Character to that Location (although usually not via a fait-accompli or Deus-Ex-Machina). Revelations, Clues, and hints in the Story should point the Character to the Location, instead. Tension also means that the longer the Character avoids reaching the Location the more Tension will build creating Drama and Prods.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Characters</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Plots need Characters, and create Characters during the Narrative, to find out more read the <a href="/creating-characters/">Characters</a> and <a href="/plots-in-t13/">Plots rules</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Weaving Narratives and Tension</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>How the Characters, cards, events and Embodiments interact is what creates the Narrative of the Tale. Narratives also rely on something we call Tension to draw Characters together, and encourage interactions between the Facet Embodiments of the different Sides of the Conflict. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can see the Rules Page on <a href="/tension-pressure-and-suspense/">Tension, Pressure and Suspense</a> and <a href="/narrative-weaving/">Narrative Weaving for more details.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Plot Descendants</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Just like Plots need Characters to move their Conflict on, they also need Descendants. At the very least they require a Location where the Conflict can be worked through. See the rules on <a href="/plot-descendants/">Plot Descendants</a> for more details.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Plot Motifs</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Plots can have recurring motifs, that turn up again and again throughout the Plot. Each time you use a Motif that you’ve given a Plot it adds 1 Yarn to the Plot’s Yarn.  The Plot Motif can be very varied, but is usually a single specified Proficiency. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, by selecting a Motif of "Scorpion" the Plot can can add Yarn any time a Scorpion turns up in the Story. These could be a scorpion in a boot, a giant scorpion, a Skorpion machine pistol, or a Japanese company called "Sasori Security", a Scorpion Logo, a Character with a scorpion tattoo, or someone with a birthday in late October or early November (star sign Scorpio). With each use adding a point of Yarn.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Plots and Subplots</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Big Plots spawn smaller Plots all the time, perhaps the huge Alien invasion begins with a more subtle infiltration, or a single scout drone landing, getting damaged, and interacting with some kids on bikes. To find out more read the rules page on <a href="/subplots/">Subplots</a>.</p>
<!-- /wp:paragraph -->
			'),
array('RulePage'=>'Character Arcs','Description'=>'<!-- wp:paragraph -->
<p>In T13, Character Arcs can be handled in two different ways. The first way is simply that a Yarn-Teller is assigned to run the Character Arc as an Arc level Plot. With the standard Conflict and so on. This is considered Plot-driven play, and is fairly standard. The other way is Character-driven Character Arcs and they function in a very different way.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Compositions</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Compositions are a musical term, that can cover pretty much any piece of music, from any genre, whether it is a guitar/jet-engine riff from a Death Metal track or a piano concerto they are both Compositions. They share a lexicon of music, such as Pitches, Rhythms, Chords and Time Signatures, and in T13 we hijack that  lexicon and way of thinking to consider interpersonal Character relationships and how they are modelled. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Composition then in T13 is something akin to an film score, telling us the emotional beats and thrills of the Characters, this can work along side or instead of plotted drama to create Character Drama. To do this we need to open our model and look at what we mean by a Composition.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Tuning</strong> — Tunings are collections of Pitches, Notes, Tones and Keys that create a "Tune". <ul><li>Each Character has a Key and so they may be "in tune" with a Composition if it uses certain Pitches and Notes.</li><li>Each Pitch, Note and Key has a unique relationship with every other Pitch, Note and Key, they all interact differently.</li><li>Pitches, Notes and Tones can be arranged, and played together as Chords. Chords have a stronger impact than in individual Pitch, Note or Tone.</li><li>Pitches, Notes and Tones (and Chords) can be arranged in sequences, with Rhythms to create lines, voices, melodies or tunes as well.</li></ul></li><li><strong>Rhythms</strong> — Rhythms are patterns of events such as movements, that define the Beats, Bar and Tempo of the Composition.<ul><li><strong>Beats</strong> — Beats are of course related to Yarn Card Story Beats, however which beat is used is defined in a more formulaic way that still allows for improvisation. Rhythms are made of Beats that alternate these are called Strong Beats (that often begin a Bar) and Weak Beats that normally end a Bar</li><li><strong>Bar</strong> — The Bar (or measure) is a segment of time that can hold a number of Beats. In Character Compositions the Bar is often the equivalent of a Scene although it can also behave as an Act. The number of Beats in the Bar defines the Time Signature of the Composition and typically defines how many Beats we get before a Chord Change, and how many Pitches, Notes and Tones are allowed within the Bar.</li><li><strong>Tempo</strong> — for a Composition the Tempo is not usually expressed in Beats per minute or a similar metric meter, instead use a scale of grave, creeping, leisurely, moderate, brisk, hurried and hasty. With implied Difficulties, Obstacles, Hurdles and Stakes varying across Tempos.</li></ul></li><li><strong>Lyrics</strong> — Lyrics often contain narrative details that help flesh out the emotional story of the Composition, perhaps explaining the fear, or happiness with some words. Lyrics can have powerful effects on Extras, becoming almost a script they are using.</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>The Types of Compositions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There are various types of Composition that a Yarn-Teller (or Conductor as they are often called in Compositions) can choose to employ, based on the Characters and Descendants that are available. Although they are given differing names they all conform to the same rules of Composition.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="characterCompositions" title="Character (and Descendant) Composition types"/]
<!-- /wp:shortcode -->

<!-- wp:heading {"level":3} -->
<h3>The Composition of Compositions</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In T13 we use a lot of terms that borrow from music, especially when talking about Character Arcs. But the chief musical terms here are Pitches, Notes, Tones and Keys. Which with music are largeley the same thing, but in T13 each is a unique point of the system that interacts with the other musical terms.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Pitches</strong> — Pitches are ideas put forwards by each Yarn-Teller during the Bar. Each Pitch asks Questions about the Characters involved in them, but also has a unique relationship with each Character via their Key and the Notes.</li><li><strong>Notes</strong> — Notes are how we think about the Plot-like aspects of a Character Arc. Notes can bring back aspects of the Arc from earlier, foreshadow later parts, add Characters and remove them and so on. </li><li><strong>Tones</strong> — Tones are defined for a Scene and is not related to Pitches, but can be tied to Notes. The Tone of a Scene defines the sorts of things that can happen during a Scene. See Tones</li><li><strong>Keys</strong> — Characters have Keys set from their Geometry. This Key is defined as part of the Character, and indicates how the the Character is effected by Different Pitches and Notes (if not Tones)</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Pitches</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A Pitch is the name we give to notes or tones when they appear in Compositions. Characters have a Key defined by their Geometry (in fact the Character’s Geometry defines a lot about how they are represented and affected by the Composition. This is because Geometry is unaffected by the type of the Character. Jonathon “John” Smith the Solo is geometrically identical to Jonathon "John" Smith the Extra.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="name" name="John | Jonathon “John” Smith | Johnny, John Smith, Jonathon Smith, Smiffy, Mister Smith" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>John Smith here is an A♯ Character. So he will be drawn into any suitable Composition that is in A♯ as it will resonate with his Character.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Depending upon the Compositions that surround him, he might even be drawn into more than one, perhaps he is a religious person drawn into a Hymn as well as a Grunt drawn into a March. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>However, there are also Compositions that he will not be "in-tune" with. These Compositions may either ignore him, never giving him a voice, although they may have odd, unintended influences upon the world around him, or may draw him in for some specific Bars or Beats and have odd influences on him directly. This will be up to the Yarn-Teller who is running (or Conducting) the individual Composition. For example any Melody may draw him in even if woefully out of Key.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Pitches and Character Voices</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These are the absolute Pitches, each has an associated House. The House lists questions that the Characters (Players usually), and the Yarn-Teller Conducting the Composition, should ask themselves about the Characters. Each House also has a Ruler, an astrological sign and planets that we’ll look at later (see Astrological Rulers), as well as a list of Facets that share that Key and suggested Tones for the Pitch (see Tones).</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="pitches" title="The Keys/Pitches and what they can mean"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>If a Composition is being improvised (rather than pre-written) Yarn-Tellers can Pitch different Pitches next. Pitches can be suggested by a common progressions, musical theory, or whimsy as the Conductor sees fit. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Yarn-Teller may choose a Pitch, by asking a Question. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Then each Player of a Character affected by the Arc may select one of the Pitches that their Character will voice, Yarn-Tellers (and the Author or Player of the Character) may also add a Note at this time (see Notes). Sometimes the Composition will have set voices for certain Characters, which means they will have to voice a specific Pitch. Although they will still have a choice of Relative Pitch they can use. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During a Pre-written Composition the Pitches are preselected, but each Character in the Arc will still be offered a choice of Pitches from the Bar Chord that they may voice.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>During a Bar each Character need not be present for every Beat, the Conductor of the Composition should decide who is present in a Scene according to the usual Narrative Logic, as well as what voicings are required for the Beat and Bar. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Not all Characters will be necessarily be present and voiced at the same time (this allows a Referee or Yarn-Teller to focus more on the voicings that are present at that time).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Some Characters may choose to not voice a particular Pitch, or are not required to by the Conductor, instead they will Rest. If they are not resting then they will still suffer the Notes and the Tone of the Beat.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>All Voiced Characters will interact with the Pitch. They will have to "Answer the Question" the Absolute Pitch raises about the Character.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p> This Question and Answering should not be thought of as a direct questioning, though. The Question the Yarn-Teller is asking such as "Who do you think you are?" should not be answered directly by the Character (no Character should state "I think I am a hero!" in response). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Instead, this is a case of show, not tell, and even the Question the Pitch raises is not directly asked by the Conductor. So the Conductor should instead describe the Scene, but with the Questions in mind. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>"Who do you think you are?" is a question usually asked by someone with authority  (be it social, political, legal, religious, spiritual, etc) so this Beat or Bar should be set in a place of some public, official or private authority. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In response, the Conductor might put the Characters upon a public stage such as a television news show, in the official chambers of a guild-master, or perhaps at the centre of a massive legal situation. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Characters should then show us the answers to the Questions the Pitches and Yarn-Tellers raised, through their actions and conversations. If the Player thinks the Character is a hero, they should show this through attempting acts of bravery and courage, not bravado and crowing.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Relative Pitch</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In addition to the Absolute Pitch, that is declared for a Beat or Bar, there is also the Relative Pitch, which is how the Pitch interacts with a Character’s personal Key. This Relative Pitch governs how the Beat will be experienced by the Character based on the different Intervals between the Character’s Key and the Pitch.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>We consider the Relative Pitch in terms of Semi-tone Intervals, to make counting these intervals easier we usually use a Chromatic Scale of 12 Pitches (although due to Octaves the actual Intervals we consider tends to be at most an Interval of 19 (the Perfect Twelfth), this could be expanded more to include perhaps as much as two Octaves, however the Octave adds less difference to the Interval beyond the Twelfth than we normally consider important. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is perfectly possible to consider Relative Pitches within a different Scale, such as a "Mixolydian" or "Locrian" Scale as part of a more advanced technique, where some Relative Pitches will become "Blues" Notes external to the Scale, which can have a separate effect on Notes. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You’ll note that different relative Pitches can have the same Character Effect, and so the Effects the Characters experience are on a separate table. This means two tables are required, with some quick looking up.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type ="displaytable" array="intervalRatios" title="The Intervals of Relative Pitches"/]
[t13ne type = "displaytable" array="CharacterEffects" title = "The Character Effects"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>The observant among you may have noticed that for any given pair of Pitches there are two available Intervals: </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>So, if a Character is an A♯4 and a Composition has an A♯ pitch for a Beat, then that is a Unison which is Stressful for the Character in some way, or it can be treated as an Octave which is a Gain Event for the Character based on the Discard Pile top card. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the Composition has a pitch of D instead then that can be an Interval of 8 (a Minor-Sixth: A Failure) or 4 (a Major-Third: A Relief) depending which way you count. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It is usual to try to alternate between positive and negative effects on the Strong or Weak beat, but Conductors are not restricted in how they apply the Beats in anyway (see Beats). </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Astrological Rulers</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Absolute pitch is noted as having an Astrological Ruler. Astrological Rulers can be used in a number of different ways. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>The Astrological cycle progresses through the year with the Sun rising in each Astrological sign in turn (beginning and ending the year in Capricorn). This can indicate a Pitch based on the time of year.</li><li>The Planets that rule each House have their own cycles and associations that can suggest a Pitch based on those associations. For example Mars is long associated with combat and war, so during a war perhaps a B Pitch may be suggested.</li><li>The Planets have associations in Magic and Alchemy that indicate sympathetic vibrations that the Planets have with the universe. </li><li>Astrological Signs can be used to grant Characters additional ways of Gaining Chi and Stress and Relieving Stress. This can also act to suggest Pitches for specific Characters (even if they are not actually the Pitch of the Character).</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Notes</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Composition Character Arc is unfolding, it is trying to tell a Story without a central Conflict. There is no Plot forcing a Story to unfold a certain way, directing and moving Characters about by Pushing and Pulling Tensions on Characters. Instead the Composition relies on Tension being created by the interplay of Pitches, Notes, Tones and Keys.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Notes are used to bring some "Story-like" Narrative aspects to Compositions, Notes can be used in a lot of different ways. Depending upon the type of Note that is being used. Notes come in 4 main flavours.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Character Notes</strong> — Character Notes are obviously the most important Notes in a Character Arc. Character Notes can perform any of the following tasks <ul><li><strong>Working Through Something</strong> — Characters are often "working through something", whether a Quest, Situation, Hurdle, Hitch, Ordeal, Test or Obstacle. A Yarn-Teller can use a Note to add one of these effects to the Bar. This is in addition to any particular Relative Pitch effects that might be occurring.</li><li><strong>Direction</strong> — sometimes a Yarn-Teller needs a Character to act a certain way, and the Player needs to be told some piece of information without resorting to a Flashback or Revelation. A Direction Note can do this, and is often passed to the Player without being read aloud. Yarn-Tellers are free to write anything on Direction Notes, "Act surprised when I reveal the Big Bad.", "Do nothing, this note is for paranoia purposes only", "You do not want them to discover the identity of the killer, because you are the killer." etc.</li><li><strong>Consequences and Repercussions</strong> — Characters do all sorts of things that can have all sorts of consequences and repercussions. These Character Notes are used to remind the Character of things they did earlier, and to make those earlier choices have some sort of Karmic or developmental impact so they can learn from the experience. Referees will often add consequences or repercussions for Characters if the Yarn-Teller responsible for the Character Arc forgets.</li><li><strong>Enter / Exeunt a Character</strong> — Characters are not always around, and events in their own life can cause them to leave or move about. Friends and Allies can have things they have to deal with, (especially if they are involved in some Quest or Plot that is going on at the time) that can take them away for a bit, and Rivals and Enemies can always turn up in the darndest places, and they too have lives that take them away from time to time. Basically, if a Yarn-Teller is trying to say "This Character is not going to be around for some reason" or "Has returned from that thing they were doing" then this is the Note to use.</li></ul></li><li><strong>Setting Notes</strong> — Setting Notes are used to bring attention to the setting of the Composition for a number of reasons. <ul><li><strong>Change of Location</strong> — When a Character Arc leads a Character from one place to another, such as from their rural childhood home to their modern life in the big city, then a Change of Location Note is required. The importance of this is to usually emphasise the differences between the locations and the effects they have on the Character. Changing Locations is similar to the Enter / Exeunt Character Note and can Add and Remove several Characters at once with a single Note, as most Extra Characters are associated with specific Locations.</li><li><strong>Season Change</strong> — Seasons are how we define periods of time in the setting. Typically a Change of Season Note will indicate the passage of time during a Composition. Sometimes the Season will refer to a an actual Season, such as how over the course of a Character Arc Winter may thaw into Spring, and then a hot Summer. But other times such a Season can be metaphorical in nature, and indicate a major event within the setting, such as a Season of War, Election Season, or a Season of Famine.</li></ul></li><li><strong>Story Notes</strong> — Story notes are Notes passed to the Composition from some Weaver such as a Plot (or Yarn-Teller). Referees and Yarn-Tellers often use Story Notes to nudge and guide Character Arcs especially when the Arc is a part of a Volume, Epic or Cycle. Story Notes are usually of the following forms <ul><li><strong>Lorics</strong> — Lore from a Plot can be applied during a Character Arc. If a Character receives a Lore during a Character Arc this may appear as a Loric Story Note.</li><li><strong>Atavistic</strong> — When a Character is an Embodiment of a Plot they are drawn into the Central Conflict of that Plot. Plot Susupense will usually do this when a Plot is active, but even an inactive Plot can fire off a Atavistic Story Note. This will make an Opposed Embodiment from that Plot Embody in the Bar or Beat. Examples of this include Character Embodiments as well as any External Embodiments from an Annex to a Turn, and yes that include Monsters.</li><li><strong>Continuity</strong> — Continuity Story Notes can be amongst the most important notes that a Character Arc can take. Continuity notes cover changes to the Setting caused by narrative causality. Say the king is killed sometime in the first Verse, well news of the death and coronation of the new king should be recorded in the Character Arc through a Continuity Note. The old king can no longer appear in the Character Arc, except perhaps as a Spirit or Dream Character. This takes precedence over Character Notes and Season Change Notes.</li><li><strong>Tonal</strong> — Tonal Story Notes are used to pass Tones into the Composition. Tones change what a Scene is trying to accomplish and can affect how well a whole Bar can work. (See Tones)</li></ul></li><li><strong>Blue Notes</strong> — Blue Notes are the final type of Note and are created by using a Pitch that falls outside of the musical Scale of a Character in the Arc. Blues notes have their usual Pitch effects, however something about the situation will be off somehow. Examples include: <ul><li><strong>Figments</strong> — Sometimes a Character who is out of tune with the Composition will experience the Blue note as a Figment. Figments can be daybreams, fantasies, delusions, hallucinations, illusions, phantasms, visions, dreams, or nightmares. A Figment might be a bad dream, an imagined (or real for that matter depending upon genre) encounter with a ghost, a prophetic dream, or a momentary hallucination that someone is wearing different clothes than they really are. Figments are usually blink and you miss it double takes, where the Character thinks they see, hear or smell something, only to look again and realise they are mistaken. Often other Characters who are more in tune with the Composition will have different experiences of this event.</li><li><strong>Genre-Phreaking</strong> — Pulling a Character or Descendant from a completely different context, such as a different genre movie, game or book and dropping wholesale it into a Character Arc is an example of Genre-Phreaking. <ul><li>It can be used delicately to <strong><em>Genre-bend</em></strong>, adding a little Romance or Mystery to a Fantasy tale  about Goblin Hunting Elves for example. </li><li>Applied more vigorously it can <strong><em>Genre-Shift</em></strong>, as the Fantasy Elven Kingdom moves into war against a technologically superior Goblin foe, the Arc incorporates more War genre tropes. </li><li>Applied with unilateral force Genre-Phreaking can <strong><em>Genre-Mashup</em></strong> where two or more Genres begin to merge, but are not quite syncretic, so Goblin scientists have created mechanical body-parts, and potion injectors to augment themselves for battle, but are still fighting Elven archers and mages. </li><li>Then finally <strong><em>Genre-Smash</em></strong> is possible where a new genre emerges, from the blend, as Elves adapt and break beyond their traditional roles they adapt and wrap their bodies in living armour made from Ent-wood, shed Forest Dragon skins and Druidic blood magics. All the Yarn-Tellers embrace and adapt to their new setting genre of Mecha-Fantasy.</li></ul></li><li><strong>Temporal Tampering</strong> — What can we say sometimes time-travel happens, and the universe can get Retconned. When this happens a Character Arc can be tampered with too, and Blue Notes or Continuity Notes are usually the easiest way to deal with this.</li><li><strong>Incursion</strong>  — There are things from outside the world of men that sometimes reach in for some reason. Perhaps beings from another planet, another world, another plane or some void beyond are present for some reason. If so this Blue Note is a perfect way to introduce a sudden Incursion of something alien, spiritual or Increated. </li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Tones</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Tone of a Bar or Beat is very distinct to the Pitch, although it can be tied to them, it can make for a fragmentary and chaotic Character Arc. Typically the Tone of Scenes will change organically through Play, as Characters succeed and fail they will push different Tones upon the Scenes of the Bar, however more control than this is possible for Yarn-Tellers. They can shape the Tone directly, by card play and Notes.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetaspects" suit="all" aspect="Tone"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Each Scene should have a Tone chosen by the Yarn-Teller from the suggested Tones for that Pitch. Bars and even entire Compositions can have their Tone determined this way. Lyrics will however override Pitch, and if a lyric suggests Characters talking away into the night, then a Conversational Tone is probably called for.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Tempos and Tempo Changes</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>All Compositions have a Tempo, unlike in modern music this isn’t thought of as some "Beats per minute" number, instead we think of Tempo in a more Composition sensitive manner, more similar to the old Italian terms.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="compositionTempos" title="The Tempos of Compositions"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Additionally Tempo can change, either jumping from one to another Tempo class, or accessing the Accelerando or Ritardando tempos. Accelerando should be used when there is a deadline that becomes imposed, and time starts to run short. Ritardando should be used when a situation gets more serious as time goes on, with growing problems and rising dangers. In both cases the tempo change makes the situation more serious and important, drawing attention to it. A Composition could begin in moderate </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Lyrics</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When a Composition has lyrics they can act as Notes, informing the Conductor of emotional or Narrative content that they may wish to include. If you are using for example a Pop song as a Composition guide, then lyrics about heartache and loss will guide a Conductor to make a Character suffer heartache or loss.</p>
<!-- /wp:paragraph -->

'),
array('RulePage'=>'Coping With Players', 'Description'=>'<!-- wp:paragraph -->
<p>If you were to go online and read stories about roleplaying games you will find a lot of RPG Horror stories, these vary from games that fell apart, Games Masters that weren’t, and Players that no one in their right mind would want to talk to, let alone play with. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Roleplaying is a big, if still a bit fringe and geeky hobby, there are a lot of Players out there, and while no two are exactly the same, there are trends and types that you can observe in the wild.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Referees and Yarn-Tellers may not get to choose who their players are, and T13 is a complex game to try and explain quickly. It can behave like a simulation, if that’s what you want, but favours a more Narrative style of play than some games. There’s no limits on the Genres or Tone that a game of T13 might take, some games may be Nihilistic Cosmic Horror, others are Grim-Dark fantasies, and still others are comedic steam-punk extravaganzas. And there’s nothing to stop you from blending, mashing and layering different Tones and Genres together. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This means it has the potential to attract a lot of different Players from various backgrounds and throw them all into a Plot together. T13 is also one of the few roleplaying games that encourages not only intra-party Conflicts, but even internal conflicts in one Character (and that’s without getting into having Alternates played by different Players in a single Character, or the other shenanigans that are possible and even encouraged in the system). In short, there’s a lot going on, which can make it tricky for Referees to know what should happen next sometimes, and can make it hard for Players to agree on a style of play that suits the current game. The following tips can help.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Types of Players</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There are lots of different player types, and it can help to identify what sort of players you have, as it will help you to have fun with these people. Of course, most real people will display aspects of two, or even three, Player Types, rather than just one. </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="playerPlayTypes"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Knowing who your players are can let you understand the sorts of stories they will engage with most easily, and the sorts of situations and Conflicts that they want to explore through play. This knowledge is invaluable to planning your game out, so how can you find out what you players want to play when you maybe have never roleplayed with them before?</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Session Zero</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When you are setting up a game, it is often a good idea to know what style of play the Players like. Knowing what your players like is a good first step to building a fun narrative that they will all enjoy and engage in enthusiastically. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can get at lot of this stuff sorted by hosting a Session Zero, which is where explain your ideas for the game, what sorts of Characters the Players are expected to play, what the genre (or genres) will be, any special rules or systems like special technologies, or magic that will be available, and all that good stuff. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Session Zero is a great time to make Characters, and you can start when the Characters were children (Children start out with a Scale that is negative - how negative depends upon the child) Play a scene or two from their lives as kids, introduce some early friends, allies and potential rivals, perhaps introduce an early Mentor. Feel free to skip time forwards, move some Facets up or down as appropriate to how and what the Character is doing, hand out appropriate Proficiencies. Let Skills, a Talent or two and occasionally a Power emerge during this play (the Proficiency Crisis will happen rarely, but can be forced with Wyrd Tarot cards). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Try skipping time forwards a few years, after each suggestion they make about the Character, and then try to show a Scene from that period of the Character’s life. For example, if has been suggested that Geena got given a robot on her 14th birthday, that kept breaking down, or overheating, and that encouraged her to learn Robotics, programming and AI Psychology. Then skip forwards to Geena in college where she develops a technique for running machine learning algorithms on machines with half the power of normal, effectively halving the cost, or doubling the upper limits if what the Robot can achieve. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In general, Session Zero should be run for all Characters simultaneously as they have known each other for a while. This should allow you to build a party of Characters, some of whom may have connections going back years, with a sense of shared history between them. It may lead them to share ambitions, even. Sometimes it can be better to have Session Zero ignore the Characters childhoods, instead focusing on how they met as group, be it at university, in boot camp, or that one day in the tavern, as necessary.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Of course, this is T13, not every character has a normal life, or upbringing, so you should roleplay through the first time each of the Characters met. Perhaps when most of the Characters were around 8, the Robot Character was constructed. It didn’t arrive until a few weeks later, when it was purchased by one of the Character’s parents. But it wasn’t until that fateful night, when those parents were killed by the Land Pirates, that its overtaxed and jury-rigged CPU was shocked into true sentience, and it protected the children and hid with them until the Land Pirates were long gone. Since then, it and the others, have had to keep the secrets of that night. Session Zero would include the birthday party where the kids knew each other, and was the first time they met the Robot, as well as a Scene from that "Fateful Night". Earlier in the Session, the other kids may have had a few experiences that they shared that the Robot didn’t.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The goal of Session Zero is to set up the Story that you are planning to run. Session Zero might include Frame Revelations about the Cycle, or Epic, but is essentially a Prologue for each Character, and is not a real part of the Story (although it may be referenced later - especially when the Party encounters the Land Pirates again).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Session Zero is intended to give the Players an expectation about the game, it lets them know the world(s) and get a handle on their place in it. This can be extended into the first Story that you play, but usually during one of the early stories there will be some kind of inciting event that subverts that expectation <em>slightly</em> and shapes where the Characters will be going from then on. In our rough example, perhaps the Robot Uprising will begin, and our Robot chum, will have to decide whether they are loyal to their Human friends or their Robotic compatriots.</p>
<!-- /wp:paragraph -->
'),
array('RulePage'=>'Creating Characters', 'Description'=>'<!-- wp:paragraph -->
<p>Characters in T13 vary a lot depending upon what you are using them for, and how detailed the game is. The complete list of current types is as follows.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="charTypes" title="Character Types"/]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Creating Characters should be as easy as saying add Character (or Extra), which will then open a Character Editor, but if you are working on paper to create Characters these rules are written out below to help. It will also let you understand what the Character creation is actually doing, when you use it. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Extras: Extras are usually used as NPC characters, and simple alternates, and are almost exactly the same as a Descendant.<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>Extras range in type from the incredibly simple and least powerful Vex, through Chorus, up to the complex Cast and powerful Forces-Of-Nature (see the Extras Types).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Extras are built like a Descendant, but because they are sapient they may have Personas, Cores and I-Ching, as well as Geometries.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Extras can be defined directly from the Plot for its NPCs (see the table for Archetype NPCs for the Boon of Skills, Talents and Powers), or you can just use the Quick example table below to give you some ideas.</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:group -->
<div class="wp-block-group"><!-- wp:table {"hasFixedLayout":false,"className":"t13ne-table"} -->
<figure class="wp-block-table t13ne-table"><table><thead><tr><td class="has-text-align-center" data-align="center">Quick example</td><td>Dice</td><td>Cards Draw / Play</td></tr></thead><tbody><tr><td class="has-text-align-center" data-align="center">Vex: Small Animal</td><td>1d6</td><td>1/1</td></tr><tr><td class="has-text-align-center" data-align="center">Vex: Dog</td><td>1d8(4)</td><td>1/1</td></tr><tr><td class="has-text-align-center" data-align="center">Vex: Trouble</td><td>2d6(7)</td><td>2/1</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Cops</td><td>3d4(7)</td><td>2/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Large Animal</td><td>2d8(9)</td><td>3/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Real Trouble</td><td>3d6(10)</td><td>3/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Lion</td><td>2d10(11)</td><td>3/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Tiger</td><td>2d10+1(12)</td><td>4/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Bear</td><td>2d12(13)</td><td>4/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Oh My!</td><td>4d6(14)</td><td>4/2</td></tr><tr><td class="has-text-align-center" data-align="center">Chorus: Elephant</td><td>2d10+4(15)</td><td>4/2</td></tr><tr><td class="has-text-align-center" data-align="center">Cast: Gangster</td><td>3d8+2(15)</td><td>4/3</td></tr><tr><td class="has-text-align-center" data-align="center">Cast: Detective</td><td>3d10(16)</td><td>5/3</td></tr><tr><td class="has-text-align-center" data-align="center">Cast: Soldier</td><td>5d6 (17)</td><td>5/3</td></tr><tr><td class="has-text-align-center" data-align="center">Force of Nature: Stampede</td><td>4d8(18)</td><td>5/4</td></tr><tr><td class="has-text-align-center" data-align="center">Force of Nature: Minor Disaster</td><td>6d6(21)</td><td>6/4</td></tr><tr><td class="has-text-align-center" data-align="center">Force of Nature: Natural Disaster</td><td>7d6(24)</td><td>6/4</td></tr><tr><td class="has-text-align-center" data-align="center">Force of Nature: Cataclysm</td><td>4d10+4(26)</td><td>7/4</td></tr></tbody></table></figure>
<!-- /wp:table --></div>
<!-- /wp:group -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="extraTypes"/]
<!-- /wp:shortcode -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>The Lite Character: Lite Characters are intended to be used in Lite games, smaller one shot Stories, and games for younger players.<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>Lite Characters have between 1 and 13 Hitches- these work exactly like normal, but slightly simplified in that all Hitches below 10 are Quirks, Flaws have a Boon of 10-19 and all Hitches with a Boon of 20 or more are Woes.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>For each Hitch Bane the Lite Character may select a Proficiency. If you want, you can multiply/combine proficiencies to make the Lite equivalent of Annexes (see below).<br>Lite Characters are considered to have Facets of Boon 13 modified for Scale for Umbral and Nimbed Purposes (although Referees are welcome to use a different Boon if they prefer. You can also use the Boon of Hitches to determine an appropriate Facet Boon). The equivalent Boon (and Dice) may be altered by the Referee (across all equivalent Lite Characters).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Lite characters may have Geometry (calculated from their name), Personality, and Core (both selected from one of their Proficiency or Hitch Facets) and may randomly select I-Ching (if a PC they really should have the set)</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Lite characters store Yin on their Hitches and hold Yang on their Proficiencies and store the Value of the Hitch Boon, or equivalent (a x10 Hitch can hold 45 Yin where as Strong x4 could store 59 Yang).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Lite characters store Chi like normal PCs for their type, but the Personality Annex is calculated from the Hitch Values plus the highest Proficiency as a Boon. That is… Personality Annex Boon is equal to Max Yin looked up as Value to a Boon + Highest Proficiency Boon equivalent (e.g. a character with a Super-skill [x8+] would add 32 to their Personality Annex Boon).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Lite Characters can store 1 Wound per Proficiency/Annex and can only stack a Maximum of 3 of the same Wound type before they increase a Level.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Lite Characters can use "Extras" (usually Cast or Chorus Extras) as their Alternates. </li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="liteBoons" title="Lite Boons"/]
<!-- /wp:shortcode -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>The Archetype<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>Archetype Characters are meant to be created quickly, they are often built from card draws and vary in power level as a Detailed or Full Character.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Archetypes often simplify a Detailed Character by combining Facets of the same Boon together into Stats.<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>An example from the most popular RPGs could be, Strength (G, T, F, M), Dexterity(Z, C, R, Y), Stamina (P, B, I, N), Intelligence (K, D, O, Q), Wisdom(A, E, V, W) and Charisma (L, S, J, H).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>You can use Facets as Four Stats most easily if you use the Facet Suits, and can use the suits as Elemental Stats as well, Hearts are Water, Diamonds are Earth, Clubs is Air and Spades are Fire, for example.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Another example is to have all Yin and Yang Facets on the same Boon, giving a Character a Yin Stat and a Yang Stat.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>The Simplest Archetypes use the same Boon for all Facets (usually Boon 13).</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Archetypes usually have their Facets defined by the Plot that they are associated with. This makes NPCs for those plots faster to generate. You can see a table below that shows how to generate Boons from the Plot. </li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Archetypes have their Persona, Core and 1 Hitch defined from a single card. More Cards can be drawn to add additional Hitches if they are required.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Archetypes can have Age categories and so on, as the Ref or Yarn-Teller requires.</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><strong>Half-Boon</strong>: The Half-Boon is used during the creation of NPCs from a Plot’s Conflict. Half-Boons are calculated by taking a Boon halving the Value and looking up that Value as a Boon. But you should be able to find it on the Plot Conflict Boon anyway. It should be noted that the Half-Boon is different to just dividing the Boon by two, as these will give very different numbers.</p>
<!-- /wp:paragraph -->

<!-- wp:table {"hasFixedLayout":false,"align":"wide","className":"t13ne-table"} -->
<figure class="wp-block-table alignwide t13ne-table"><table><thead><tr><td>Power Level</td><td>Facet Boon</td><td>Skill Boon</td><td>Talent Boon</td><td>Power Boon</td></tr></thead><tbody><tr><td>Simple</td><td>13+Scale</td><td>21+Scale</td><td>26+Scale (1 Umbral 1 Nimbed)</td><td>31+Scale (2 Umrals 3 Nimbeds)</td></tr><tr><td>Low Power</td><td>Conflict Score</td><td>Half-Boon</td><td>Conflict Boon divided by 2&nbsp;(1 Umbral)</td><td>Conflict Boon (1 Umbral 2 Nimbeds)</td></tr><tr><td>Medium Power</td><td>Reduced (Conflict Boon + Conflict Half-Boon)</td><td>Half-Boon +5</td><td>Conflict Boon&nbsp;(1 Umbral, 1 Nimbed)</td><td>Conflict Boon + 5 (1 Umbral 2 Nimbeds</td></tr><tr><td>High Power</td><td>Conflict Boon divided by 2</td><td>Conflict Boon Halved + Conflict Score</td><td>Conflict Boon (1 Umbral 2 Nimbeds)</td><td>Conflict Boon + Conflict Score (2 Umbrals 4 Nimbeds)</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p><strong>Hitches</strong>: Usually as Facets. NPCs are usually limited to one Hitch more than the highest number in the party normally. They can be a little more powerful, but not too much. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Personality Boon</strong>: Either calculate from Values (as Detailed), or equal to the Conflict Boon.<br><strong>Number of Skills / Talents</strong>: Conflict Score or calculate.<br><strong>Number of Powers</strong>: Conflict Draw<br><strong>Proficiencies</strong>: See this table instead</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="NPCProficiencies"/]
<!-- /wp:shortcode -->

<!-- wp:table {"hasFixedLayout":false,"align":"wide","className":"t13ne-table"} -->
<figure class="wp-block-table alignwide t13ne-table"><table><thead><tr><td>Example Annex</td><td>Example Boon</td><td>Example Dice</td><td>Cards draw/play</td></tr></thead><tbody><tr><td>Skill</td><td>28</td><td>d4+5 (7)</td><td>2/1</td></tr><tr><td>Talent</td><td>35</td><td>d6+5/td&gt;</td><td>3/2</td></tr><tr><td>Power</td><td>48</td><td>d10+5</td><td>4/3</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>The Detailed Character<ol><li>Depending upon the game and Plots PCs may begin in the Grunt Tier, Hero Tier or as Yarn-Teller Tier Characters. Most often PCs begin as Fresh Detailed Grunts, it is recommended that all new Players start this way (or with a Lite Character first). </li></ol><!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>They may also begin play as Younger Characters. Younger Characters are not as powerful as adults in most ways, and have negative Scale that will reduce both their Facets and Anti-Facets and therefore their Annexes. Additionally Youths adjust their Proficiency Dice, which can make Crises more common, but reduces what they are capable of, this reflects Younger Characters faster learning, but lower skill levels.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Detailed Characters will always have a Stat Block of Facets, each Facet is assigned a Boon of 13, but these may be moved up to 25 or down to 1 (along with their Anti-Facet moving down to 1 or up to 25). So a Gossamer Boon of 14 or 20 would force a Burden Boon of 12 or 6. Detailed Characters store Yin and Yang Sway on the Boons of their Stat-Block, so the maximum Yin they can store is equal to all their Yin Facet Boons (+Scale) added together, and the maximum Yang is calculated from Yang Facet Boons. If all Facets are 13 and Scale is 0 then Yin and Yang can both store 156 Sway.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Detailed Characters build a Personality Annex with at least one Persona, one or more Cores and at least one Hitch. Although they may have more of each type in the form of extra and Resolved Hitches or by Coalescing Alternates. Hitches typically are made from Proficiencies and offer Proficiencies for the Personality Annex to begin with. Note that Proficiencies in a Hitch are locked and must be copied into Personality Profiency Slots before they can be used to increase rolls etc.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Detailed Characters always have a Geometry calculated from the Character’s name and have at least one I-Ching, that is usually calculated from their Statblock, but may be random, or selected as the Referee prefers.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Detailed Characters may have a number of Active Proficiencies equal to their Personality Score (Boon Reduced), Fresh Characters that are Younger may be have less Proficiency slots filled (Refs may choose, 1 Prof, Personality Draw Proficiencies, Half-filled - half the Prof slots are filled, or all bar one slot is filled).</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Fresh Detailed Characters usually build Annexes from Proficiencies during play, but Referees may choose to allow some Annexes ahead of time. Characters may have as many Annex Slots as their Personality Score (or one per filled Prof Slot). However, they are restricted in Annex types differently.</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:shortcode -->
[t13ne type="displaytable" array="pcType" title="Player Character Types" /]
[t13ne type="displaytable" array="experienceTiers" title="Experience Tiers"/]
[t13ne type="displaytable" array="ageCategories" title="Age Categories"/]
[t13ne type="displaytable" array="altTypes" title="Alternate Types"/]
[t13ne type="displaytable" array="similarityTypes" title="Similarity Types"/]
[t13ne type="displaytable" array="integrationTypes" title="Intergration Types"/]
[t13ne type="displaytable" array="annexTypes" title="Annex Types"/]
<!-- /wp:shortcode -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Full Characters<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>Full Characters are the most complex T13 Characters. They are even more Detailed than a Detailed Character as essentially they are a Pool of Detailed Characters living as one Trans-dimensional being. A Full Character is essentially at least Two Detailed Characters as Alternates, Full Characters must have multiple Alternates, these might be Past-Lives, Quantum-selves, or something more exotic... Alternates may be Detailed Characters, Archetype Characters, Lite Characters or "Extras" as required or desired.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Full Characters can Unjoin Facets and Anti-Facets allowing them to have high scores in both, however unjoined Facets cost twice as much to change as Joined Facets. So increasing a Boon 13 Facet and Anti-Facet to Boon 14 would cost 26 Chi each.</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->'),
array('RulePage'=>'Yarn-Tellers, Weavers, and Plots', 'Description'=>'<!-- wp:paragraph -->
<p>In a T13 Game, Players can either be Grunts (or maybe Goblins) working for more important people, or they can be Heroes who bend their own fates, slip between universes, but are still mostly pushed by circumstances and the plots of others, or they can be Yarn-Tellers and be a part of narration of the story. However, while Yarn-Tellers can be Weavers, they are themselves still the subjects of Weavers themselves, notably other Yarn-Teller’s Narration, Plots, and the whims of the cards.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yarn-Tellers are narrators, or point-of-view Characters. They can tell us part of the story they experienced, their own way. As such, they get to make some of the story up. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>They have a number of tricks that they can perform to accomplish this, but unfortunately other Yarn-Tellers have the same tricks at their disposal, and the Referee has a few more, just to keep the big Plots satisfied (and fed). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That’s because while Yarn-Tellers may be narrators, and story-tellers themselves, they are not Authors writing a Novel, or Wyrd herself (usually), so they are subject to the events that are taking place around them, just like everyone else.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Generally the Yarn-Teller Characters are subject to larger Plots, like the greater cycles of History, acts of the Divine, the Forgotten, and the Increated, and never forget the potential catastrophes of open-ended Multi-(or Inter)-dimensional Wars.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Narration</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Narration is what sets a Yarn-Teller apart from other Characters, and it grants Players immense power, and with that power a huge responsibility. You see, if you have been playing a Grunt, who managed to survive long enough that he developed into a Hero, up until now all the narration, when you think about it was probably been done by one person at the table, the Referee. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In some games, where the Referee is called a Games-Master or Dungeon-something-or-other, they literally have to do all the heavy lifting of narration, this is similar to T13 Grunt play. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Other Story-based roleplaying games have a more collective story-telling experience. Often there will still be a Lead Narrator for the Story, but Characters narrate their own actions and the results with the Lead Narrator (or whatever they call them) perhaps modifying the narrated result with a "Yes, but..." style of complication. This is similar to T13 Heroic play, where the Characters could narrate their actions, but the Referee would still determine the final results.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This leads us to T13 Yarn-Teller narration. Each Yarn-Teller Character has their own Stories they want to tell, whether it is the tale of their rise to power, fame, glory, a quiet retirement surrounded by grand-children, or a different happy ever-after. Players too probably have ideas for tales, perhaps sparked by some events earlier, or Characters they met along the way. Players often have ideas for Arcs that other Characters in the group could have. And here is where Yarn-Teller Characters shine.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A Yarn-Teller Player can narrate events, almost exactly like a Referee. The main difference is the Yarn-Teller Characters have to follow some rules about their Narration.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>If you are mid-narration and the Referee says something, stop narrating and check what it was. It might be important to the game, or it might have been them asking for the chips, but better to be safe than narrate something they are immediately going to ret-con.</li><li>Your narration should be from your Character’s perspective, and usually in their voice. If the Character has a lose relationship with the truth, then no one expects them to be a reliable narrator, and that will allow them a lot a easy ret-cons if they need to.</li><li>While your narration is from your Character’s perspective you are expected to narrate the reactions of NPCs to other Player Character’s actions. If you don’t the Referee, or any other Yarn-Teller could use them as a vehicle to Seize the Spotlight and continue narration.</li><li>Yarn-Telling is a more gruelling and tiring experience than playing a Character normally, so it is okay to hand the reins off to another Yarn-Teller while you collect your thoughts or recover. You’ll always be able to take the Spotlight again later.</li><li>Try not to interrupt another Yarn-Teller when they are narrating. Even if you have paid for the privilege. Wait, until they have at least finished the statement they were making, and if possible try to continue their narration in your own style instead as you spend your Yarn. </li><li>Yarn-Teller’s narration is more limited in Scope than a Referee’s narration, generally. Yarn-Tellers can use only the following perspectives<ul><li>1st Person: Yarn-Tellers are free to use almost all 1st person statements such as "I draw my sword", "I decapitate the guard with my telekinesis", "I see you get shot by the other guards, taking a Crippling Wound".</li><li>2nd Person: Yarn-Tellers are limited in that they cannot compel another Player Character’s actions by narration alone. You can say "Your counter-attack has no effect," or "As you step forward the floor tile clicks under your foot, a moment before a huge explosion," in response to things they have said they are doing, but you can’t say, "You decide to walk into a trap," or "You feel sad about what you did to me earlier, and give me the treasure," as these would not respect the Character’s or Player’s agency. Unlike usual the compelled Character’s Player and not the Referee is the final arbiter here.</li><li>3rd Person limited: Yarn-Tellers can employ a range of 3rd Person narrative techniques, but they should avoid 3rd Person Omniscient narration. That is to say describe what is available via your own Character’s senses, don’t reach into Character’s minds and describe their thoughts.</li></ul></li></ul>
<!-- /wp:list -->

<!-- wp:group -->
<div class="wp-block-group"><!-- wp:heading -->
<h2>Yarn-Teller Voices</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yarn-Tellers are narrators of the story. They usually narrate from a first-person  perspective (and occasionally a second or even third person perspective, especially for the Referee). However, there are different styles of Yarn-Telling and we call these styles the Voices of the Yarn-Tellers.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>The Bedlamite</strong>: A Yarn-Teller Character who is actually delusional, or perhaps who is coloured by previous trauma, or emotional dysfunction. Bedlamites create Stories that blur the lines of reality and fantasy, favouring prophecies, dream scenes, Monsters, fringe science and Conspiracy Theories.</li><li><strong>The Blowhard</strong>: A Yarn-Teller Character who likes to move the Plot forwards themselves, they create Stories for their own Character to make Gains and to make themselves look good.</li><li><strong>The Borrowed Bard</strong>: A Yarn-Teller who delights in retelling other peoples stories with a new spin. Often they borrow Shakespeare, or some movie or TV show, and can be just as guilty of Railroading as the Historian, unable to adapt the Plot to the actions of other Players.</li><li><strong>The Builder</strong>: A Yarn-Teller who like making maps and letting Players explore them. Don’t expect Stories with deep Plots, but do expect days of travel, which can be used for Characterization. Builders are often also quite tactical, and most favour modelled and simulationist play.</li><li><strong>The Clown</strong>: A Yarn-Teller Character who does not take narrations seriously and consciously plays with conventions, truth, and the reader’s expectations. Clowns create Stories to make others laugh, or create confusion and absurdity.</li><li><strong>The Daredevil</strong>: A Yarn-Teller who mainly likes narrating action sequences. Their Stories can be superficial, but are usually fun. Daredevils can get out of control though, and accidentally arrange unsurvivable situations that can cause Retcons and Showdowns to occur to allow Characters to survive.</li><li><strong>The Fabulist</strong>: A Yarn-Teller Character who lies and ignores established facts about the game world. Fabulists favour complex fantasies, and lighter themes, but mostly just run roughshod over other people’s world-building efforts.</li><li><strong>The Grim</strong>: A Yarn-Teller who delights in gritty realism and negative consequences. The Grim is most likely to kill a Character as part of their Story, and their Stories are often complex and filled with moral ambiguities and shades of grey.</li><li><strong>The Historian</strong>: A Yarn-Teller who draws their complex, often politically charged, dense Plots from actual history. They change the names, and may combine a few Characters (or separate one person into two), to make it less obvious, usually. They can however end up like a Railroader, unable to change history.</li><li><strong>The Journalist</strong>: A Yarn-Teller who may actually be a chronicler or reporter, but that’s not what’s important about them. The Journalist delights in noting, recording and reusing things from other Yarn-Teller’s narration, their Stories are woven deeply into the world, they reuse others Characters and Locations.</li><li><strong>The Kid</strong>: A Yarn-Teller Character who has a limited view of the complexity of Stories, and the world. They favour simple Stories, usually Good-vs-Evil, Monster-of-the-Week, and The-Bad-Guys-Done-It types of Plots, and rarely narrate reasonable responses from law enforcement, politicians and other authorities.</li><li><strong>The Noire</strong>: A Yarn-Teller who uses plenty of metaphors and darker themes, but often tell fairly simple Stories, with only a minor twist or two (and in fact many of the twists they use are almost tropes of their preferred genres).</li><li><strong>The Pantser</strong>: A Yarn-Teller who mainly narrates off the cuff. Pantsers can be great, reacting to other Yarn-Tellers and Heroes easily, but they can also be random, and easily forget things they have improvised before.</li><li><strong>The Practised Genius</strong>: A Yarn-Teller who mixes all of the other Yarn-Teller types together into something that isn’t an incoherent mess. This isn’t a Voice that is even real, it’s more of where we are all wanting to get, but no one has ever really managed it.</li><li><strong>The Purple Poet</strong>: A Yarn-Teller who favours long words, and longer descriptions. They often are great world-builders, but their plots are often overly-complex and difficult to follow.</li><li><strong>The Thespian</strong>: A Yarn-Teller who mainly narrates their stories through the Extras and NPCs. These are often Yarn-"Show-don’t-Tellers", and as such their Plots can be light on Exposition and Revelations tend to be hidden in Red Herring conversations.</li><li><strong>The Train Driver</strong>: A Yarn-Teller who specialises in narrating pre-written stories. They may be great writers, or trope masters, but they don’t play well with others.</li><li><strong>The Visionary</strong>: A Yarn-Teller who specialises in narrating visual descriptions. They can treat their Stories as describing cinema, and sometimes are so busy using symbolism and references that they may fail to include an actual Story.</li><li><strong>The Watson</strong>: A Yarn-Teller who narrates Stories where they make themselves a lesser, or support role for another Character. Watsons are usually detail-oriented and quite grounded, their Stories often feature powerful NPCs.</li></ul>
<!-- /wp:list --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3} -->
<h3>Facet based Narration</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each Facet has its own suggested Narration Technique. These techniques can each make narration more fun and engaging, they can act as pointers for Players with less experience with Narration, or be used to offer Narration Challenges or as part of a Narrative Showdown.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Narration Challenges are set by the Referee, and are usually of the form, narrate this Scene with this Facet’s Narration Technique. Experienced groups could have the current Narration Facet be decided by the current card atop the Discard pile, changing everytime even a Hero plays a Wyrd tarot card. Failure to narrate in technique will incur additional Failures automatically. Successfully using the Narration could grant additional Successes, but more often a Gain would be an appropriate reward.  </p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="facetsuitaspect" suit="all" aspect="Narration" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>As an Optional rule the Character’s Persona(s), Core(s) and Hitches can grant the Yarn-Teller access to a limited number of narration techniques. This can be useful to give Characters distinct narrative voices, or to create a continual Narration Challenge.<br> Referees can also use this table to suggest narration techniques that they might use based on Conflict Embodiments, the current Tone, and the current roster of PCs or NPCs.   </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Yarn-Telling Techniques</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There are a number of Yarn-Telling techniques that T13 uses to gamify the Yarn-Telling narration. </p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Seize The Spotlight</strong>: Yarn-Tellers can spend at least 1 Yarn to seize the spotlight, grab the talking stick, become the Point of View Character, or however you think of it, anyway this lets them narrate the current scene. <ul><li>During their Narration they can describe things how they want, and others are encouraged to stick to those descriptions later, unless they want to spend more Yarn to seize control back.</li><li> The Referee can always spend more Yarn than anyone else to seize control back, however all Yarn spent by the Referee must be noted on the Plot and paid out in the Gains. </li><li>When Yarn-Telling you still have the same cards to interpret. If the Significator of the Scene is "The Priest" then whatever the Scene is it has to have some spiritual or ecclesiastical connection. If the Scene is a Revelation then the information that you must reveal is described in the cards too (and may reference a Yarn-Teller’s Plot that you have no information for — which can be a good reason to never Steal the Spotlight during a Revelation. </li><li>Passing the Spotlight: After you’ve narrated a bit, be it a Scene Introduction, or an Act or whatever, you can decide where the Spotlight goes next. Passing Narration like this can be interrupted for 1 Yarn again, and goes to the highest bidder in a bidding war. </li></ul></li><li><strong>I Bet It’s...</strong> : Yarn-Tellers can interrupt the Yarn-Teller, even the Referee to edit a detail, and change something about a situation. The Editor must bet Yarn on their Edit, if it is accepted by all the other Yarn-Tellers then the Yarn is returned and they get their edit, if the edit is rejected then the Yarn spent is lost. The Referee should gauge Tone and Genre on adjudicating edits as well as the needs of the Plots. The minimum Yarn bet (the blind) is usually the Yarn cost of the detail (Annex, Descendant, Character, Province, etc) that is being changed.</li><li><strong>Scene Bending</strong>: Yarn-Tellers can adjust a Scene that is currently being narrated by the Referee or another Yarn-Teller, this is done by playing a Yarn-Card to replace one in the Scene already. Scenes have a Scene Beat Type, a Scene Significator, and then details that depend upon the Beat Type. The Played card must be incorporated into the Narration in one of these possible card positions as the Player wishes.</li><li><strong>Spawn Subplot</strong>: Yarn-Tellers can play any card with a Hook Scene Type (any Ace) to start creating a new Subplot. <ul><li>They can then play cards to define the Conflict, Plot Significator, the Hook, and so on.</li><li>Spawned Subplots are usually Stories or Tracts, and you can think of them as the Yarn-Teller getting to guest GM a session, although you don’t have to play through them in one go and the Referee doesn’t actually give up the reins entirely.</li><li>The Yarn-Teller is the narrator of their Subplot, they define the Conflict and Hooks, they generally narrate the actions of the Plot’s Extras and Archetype NPCs, and can, of course, Hook themselves, other Player Characters, or Referee Characters from other Plots.  </li><li>The Yarn-Teller now owns that Subplot and can use the appropriate cards to unlock the next Scene of their Subplot, Revelations for example are triggerable with a 5 or Queen, a Subplot must be closed with a King (Completion).</li><li>The Yarn-Teller must play their own cards to define each Scene of the Subplot in turn, alternating Warps (or Tests and Ordeals)  and Wefts (or Revelations and Gains) through the Loom, and a Final Ordeal, Test, Gain or Revelation, before the Completion.</li><li>Normally a Yarn-Teller Character is Hooked to their own Subplot.</li><li>Yarn-Tellers are responsible for care, feeding and maintenance of their Subplots, failure to feed a Subplot can result in it feeling abandoned, and an abandoned Subplot becomes the Referee’s Plot.</li><li> Subplots must be fed Yarn by having interactions with Characters, although how often depends on the Referee and the number of other Yarn-Tellers in the narrative, as well as the cards available, of course. Failure to feed a Subplot (by playing a card that could have triggered a Scene) results in removing Yarn from the Subplot. If the Subplot ends up empty of Yarn it becomes Rogue and may become another Yarn-Teller’s responsibility.</li></ul></li><li><strong>Retcons, Flashbacks and "It could have happened that way, or..."</strong>: Yarn-Tellers can argue about a Scene and decide they want to change something that already happened. This has a cost, and an element of risk too. The Cost depends on the nature of the Retcon and Change (see the the Sway Table) or how far back in time the change is being made (Extend Duration) whichever is larger. The risk comes from the fact that after you finish your alternate history, the other Yarn-Tellers must vote between the versions, as to which version is the universe that they continue. What’s more, after the first Retcon is paid for then every Yarn-Teller can add their own potential Retcon, for only 1 Yarn (although if you are full of Chi that can be quite a lot), with all Yarn-Tellers voting for the best version of the Scene by their own criteria.</li><li><strong>"Yes... And..."</strong>: Yarn-Telling is about building exciting stories, while you can retcon things, it is much better to accept the Story as it is being told, but add you own turns (and occasionally Twists) to the Story. Agreeing with another Yarn-Teller and then building upon what they have said will pay you 1 Yarn, giving you enough Chi to reach the next Yarn point (up to filling your Character).</li><li>"<strong>Yes... But..."</strong>: Complications make Stories more interesting, if you think a Story has become boring, why not interrupt to add a complication to another Yarn-Teller’s story? Adding a complication to another’s story involves paying a point of Yarn and playing a Yarn card as a Snag. The Yarn-Teller must incorporate the Snag (or replace it with a Snag of their own from their own Hand or Pool). If they replace the card, you get your Yang back, otherwise that Yarn goes to the Plot or Subplot you interrupted.</li><li><strong>"No... But..."</strong>: Trashing other people’s ideas is pretty mean, but sometimes they haven’t understood what you are trying to do, and could have ruined your Story, but you have to admit they did give you a good idea. If you cancel someone else’s narration by paying Yang, but incorporate something from their attempt into your own Retcon, or retelling, then they get 1 Yarn and so do you.</li><li><strong>Narrative Showdown</strong>: Narrative Showdowns can occur whenever a Scene becomes contested between two or more Yarn-Tellers. During a Narrative Showdown two Yarn-Tellers construct their own parallel Narratives, and then a third Yarn-Teller (usually the Referee) must pick between them. <ul><li>A Showdown is declared by the Referee. The Defendant will defend the narrative as it stands, the Challenger wishes to change the Narrative to incorporate their changes.</li><li>The Yarn-Tellers involved in the Showdown must draw a card. The Challenger Draws first, the Defendant second.</li><li>Each side may still back out by discarding the card, and concede the narration, or they may bet that they can narrate the card. </li></ul><ul><li>The Challenger decides what aspect of the card will be narrated. They might choose a Warp aspect such as a Snag, or a Weft aspect such as a Gain. </li><li>The Challenger also decides the opening bid and the Stakes. Generally, Showdowns have Wounds and / or Yarn bet on them, for example you might bet Three Mortal Wounds and 20 Yarn on your narration.</li><li>The Defendant may either Fold (and concede the Narration — negating the challenged Scene), Call (matching that bet and agreeing to narrate) or Raise (increasing the bet and putting the Challenger in the position of having to Fold, Call or Raise themselves). The largest bet that can be made is "All-In" which will hand the Character over to the other as a new Alt (and should only be used in extreme circumstances, or as part of a Highlander / Battle-Royale scenario).</li></ul><ul><li>Whichever Yarn-Teller calls must narrate their card first, in the decided manner, using the same aspect, and accepting the bet. <ul><li>If they are the Challenger they narrate a Scene to replace the one they Challenged, now as either a Warp on themselves that gives them the Wounds they agreed on (including potentially death), or as a Weft for the Challenged Yarn-Teller that costs them Yarn (and may even make their Character into an Alt of the Challenged Character).</li><li>The Challenged Yarn-Teller must narrate the Scene as though it followed their own original Challenged Scene, either as a Warp on themselves (with Wounds) or as a Weft on the Challenger (with Yarn or potentially a Character on the line).</li><li>Regardless of who is narrating what, those Bets are not yet  paid.</li></ul></li></ul><ul><li>The Yarn-Tellers must then agree who follows them, usually the Referee, but any other Yarn-Teller will do. If they cannot decide, they may instead roll a d6 each, repeatedly, with the lowest roll losing. </li><li>Whoever narrates next then draws a card. It must be narrated to follow one of the two scenarios described, and is known as a Judgement. It either upholds the original Challenged Scene, and the Defendants Scene that follows, or it follows the replacement Scene and the Challenger wins. Which way it goes will depend upon the Player’s belief of which makes the most sense and what card they have Drawn to follow. </li><li>The Judgement should also, where possible, now redress the issue of  who lost the bet. Returning to the winner their bet Yarn with a Gain, or Healing them, and causing Wounds to the loser. Basically, the bets are now Paid. If both Characters went "All-In" then as the winning Character "dies", Quantum Immortality kicks in, merging their consciousness with the other "Show-downer", and then they become the Dominant Personality. In some games, the Loser of the Showdown may now play their Character as a Split Alt in that Character, but more normally they go and create a new replacement Character (often a Fresh of the same power level).</li></ul></li><li><strong>Quantum Contest</strong>: Quantum Contests very like Narrative Showdowns, but are left unresolved. They are advanced techniques, that create stylistic choices like unreliable Narrators. Ambiguity is often the hallmark of the Quantum Contest, we like to think that history happened a certain way, a Quantum Contest implies that history can actually be multiple choice. <ul><li>Each Yarn-Teller that contests a Scene can narrate it themselves. They must pay for the right, however, by using a Retcon as the base cost.</li><li>Each Yarn-Teller narrates the Scene (with the other Players reacting as normal to the events that occur) including playing through any Ordeals, Tests, etc.</li><li>All versions of the narration are considered equal. No one version is decided as the "True" version and the game moves on to the next Scene. All Players can decide for themselves which one was true for them, and Hero Characters (especially Mercari and Paradox Warriors) can claim to remember two or more versions with no problems. All versions of events can be referenced as having happened, later. Gains made in one version may be different to those made in another, but both are available to those who made the Gains. The only caveat to this is that a Grunt Character must choose which Gain they made if they have a choice between two in each telling. The Grunt will only remember the history that they got the Gain from. Conversely, it is fine for another Grunt in the same game to remember the other version, especially if they were the one who got the gain in their memory.</li><li>Eventually the events may become remembered by those who were there as some strange mix of the two distinct histories. Even by Grunts who only really remember one version, if the alternative is repeated around them enough, they’ll incorporate the history they don’t remember. Referees can narrate some weird mixes of how people talk about things to give Players (or readers) the idea.  </li></ul></li><li><strong>Yarn-Tangling Ordeal</strong>: An Alternative to the Narrative Showdown and Quantum Contest that allows card play to determine exactly what happens during a complex Yarn-Weaving with multiple Yarn-Tellers competing. See Alternate Ordeals Rulepage for detail.</li></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>Yarn-Tellers and Plots</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Generally speaking, Plots are Yarn-Tellers themselves, therefore Yarn-Tellers can create Plots, just as Plots can create Yarn-Teller Characters. However, setting a Plot in motion is not an easy thing for any Yarn-Teller to perform. Let’s think about an example of how a Yarn-Teller may get a Plot rolling. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Imagine a Wizard, we’ll call him Magister John Elfolk, he’s a Yarn-Teller. While Magister Elfolk is travelling to the capitol, he is accosted by a gang of ruffians, he could easily destroy the ruffians, of course, but instead asks why they would risk attacking a mage. He cows the gang with a few simple cantrips and a threat from a summoned Plasma Elemental, but asks them why. The leader of the gang, a Hero called Jim Chapel responds that the local Lord, Baron Darkonfell, has raised taxes on their homes fourteen times in six months, driving them to crime.  Magister Elfolk decides to investigate, and a few spells later discovers that the Baron is another Yarn-Teller, and quite a powerful one at that, but that the Baron is indeed raising ridiculous taxes over and over on his lands. Annoyed at the disturbance to his travels and blaming the Baron, the Wizard decides to create a Subplot of his own to harass the Baron. He can create a Subplot by using any Ace Yarn card and then set the Conflict so that it will Hook Jim Chapel and probably Hook Baron Darkonfell, although there is no real guarantee that the Baron will bite, unless John Elfolk wants to hang around and force the issue, by getting Hooked himself, which he clearly isn’t. Now the Subplot is ready to go, and John Elfolk can go on his way, with Jim Chapel now effectively his agent of revenge. At least, until Baron Darkonfell realises a Plot has Hooked him and narrates a better ending for himself, as Elfolk is unlikely to continue feeding the Plot cards afterward.</p>
<!-- /wp:paragraph -->'),
array('RulePage'=>'Embedded Facet Conflicts', 'Description'=>'<!-- wp:paragraph -->
<p>It can help in T13 to think of the facets as having an embedded Conflict. Every Yin Facet is opposed to every Yang Facet. This creates two sides, but these are not like sides of a war, these are more like the genders of their patrons, somewhat unattached to the Facet itself.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Each Facet in fact has a unique relationship with its opposite, and all Facets interact through the usual Harmonic System.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="impressions" names="Awe, Burden, Craft, Dominion, Enigma, Fury, Gossamer, Heresy, Inertia, Jeer, Key, Liberty, Miasma, Nature, Orthodox, Phoenix, Quiet, Rook, Sin, Trial, Virtue, Wyrd, Yonder, Zeal" geo="3,6,8,7,10,8,7,9,1,13,8,9,8,5,9,12,8,9,3,11,6,4,6,7" mods="0" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>To make things more interesting we can add a random number between -5 and 5 to the impression grid (we can also add specific modifiers but they must be specified by an Author). You can see what a difference this can make.</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->
[t13ne type="impressions" names="Awe, Burden, Craft, Dominion, Enigma, Fury, Gossamer, Heresy, Inertia, Jeer, Key, Liberty, Miasma, Nature, Orthodox, Phoenix, Quiet, Rook, Sin, Trial, Virtue, Wyrd, Yonder, Zeal" geo="3,6,8,7,10,8,7,9,1,13,8,9,8,5,9,12,8,9,3,11,6,4,6,7" mods="rng" /]
<!-- /wp:shortcode -->

<!-- wp:paragraph -->
<p>Any Red indicates two Facets that have come to direct Conflict. Any Green indicates two Facets that have probably allied somewhere (often creating Annexes or similar that represent important technologies or other systems within the setting). Each time you refresh this page you should see different Red and Green Facets, indicating different potential alliances and conflicts within the system.</p>
<!-- /wp:paragraph -->
    '),
array('RulePage'=>'Types of Games', 'Description'=>'<!-- wp:paragraph -->
<p>T13 is very versatile, and you can use the system to play a lot of different games that have their own playstyles. These can be described by the following game Axes:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Narrative: The Narrative axis controls how Story-like the game play may be. This can range from, not at all, to completely.<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Not at all: There are no Yarn-Teller Player Characters, there are few to none Hero Player Characters, and most Characters are Grunts or Lite. Plots tend to be Geo-Plots (usually Dungeon or Hex Crawls), created solely by the Referee. Play tends to be very Simulationist, and Tactical.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Weak Narratives: Player Characters may be of any type, but tend to be Heroes. Players are generally involved in Referee Plots. Plots are usually one huge sweeping Epic, or Cycle, that carries the Players along, or Monster of the Week style Stories that provide episodes. Some Players may guide the Plot by discussing goals with the Referee.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Strong Narratives: Players may be any type, but are generally Yarn-Tellers. Plots come in all shapes and sizes, often with Stories and Arcs being handled by different Players. Players are encouraged to run Character specific Arcs for one another. Referee usually governs the strongest Plots themselves, but does not have to.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Completely Narrative: All Players are Yarn-Tellers, each acting as the Referee to their own Plots, for the other Players.</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Simulationist: The Simulationist axis controls how closely you wish to model physical laws and reality. Pure Simulation is great for some games, but some Genres are not well suited to simulation. High Fantasy can be particularly badly handled by pure simulation.<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Pure Simulation: Value Tests are the only Tests needed. Ordeals are not used. Note many Nimbeds are effectively useless in a Simulation, so you may wish to use more Umbrals instead.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Loose Simulation: All Tests may be performed at times. Ordeals may be dealt with through Card Play, or Dice Rolls as preferred. Dice Rolls tend to be additive rather than Pools. Difficulties are usually based on adding all Difficulties from the Sway Table, rather than Value comparisons or Dice Pools.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Winging It: Tests are usually performed with Dice Pool-rolls, Ordeals use cards, and the Yarn-Teller decides which are which. Pool Difficulties are usually calculated from the Highest Difficulty on the Sway Table of the action being attempted.</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Tactical: The Tactical axis controls how strategic, or tactical, the gameplay is.<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Battle-Minis: Highly Tactical play, where Characters are represented on a Battle-board map, that represents the Location (and may be gridded). All ranges, movement, and so on, during Ordeals must be dealt with in terms of the Grid/Scale.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Cinematic: Semi-Tactical play, usually using a map of the Location, but movement and range is based on simple Bands usually Melee 0-2 m, Close 2-5 m, Medium 5-100 m, Long 100-500 m and Extreme 500+ m.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Arena of the Mind: Mostly non-tactical play. There is no need for a map, but the Yarn-Teller does their best to remember Character locations and keep ranges consistent. Tactical play is often stilted.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Theatre of the Mind: Non-tactical play, the map is largely unimportant, objects and Characters may teleport about as required by the narration. Strategy can still apply in terms of cards played and so on, but there is no Tactics as such.</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Setting Flexibility: The Setting Flexibility axis controls how much creative control the Players have over the setting.<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Fixed: The players have little creative control over the setting. The setting is defined by the Referee, or some other Author, but is not modified in play except perhaps for ownerships of Descendants or minor Character deaths. Fixed Settings usually have strict timelines that cannot be disrupted. Major Characters mentioned in the timeline cannot have permanent changes that do not appear in the time-line already. Such Plot Armour usually protects important characters from any Wounds worse than Maiming automatically.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Restricted: Referee and Yarn-Tellers may adjust and adapt the setting, but only to accepted limits (usually set by the Referee or Author). Restricted settings for example may be altered in major ways by Character actions, a Character can kill the Emperor and affect history, or discover a new technology or magic and alter the world, but such changes such as who the next Emperor will be are decided by the Referee (or Author). This is the typical setting flexibility of most TTRPGs.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>World-building: Referee and Players may create new aspects of the setting, as long as they do not contradict some already established rule, or fact of the setting. For example, if a Player has stated, "No Wizards" or "No Guilds", you can’t later add a Wizard’s Guild in a town (a Conjurer’s Club would be fine). Because of this, it is often advisable to not create entirely exclusionary rules, perhaps instead of No Wizards, the rule might be "Wizards are illegal in the kingdom", allowing another country to have legal Wizards. Specific Players are usually given "control" over their own aspects, such as allowing the Rogue Character to define how Thieves guilds work, who runs the local branch, etc. This is the level of Creative flexibility offered in most Story Games.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Reflexive Continuity: Much like World-Building, only any Rule or aspect of the setting that is created has a Yarn-Cost. Any Yarn-Teller can pay Yarn to break that Rule for a one-off story, or even change it from now on. This allows Worlds to surprise, move on, and adapt during gameplay in ways that World-Building games cannot. It should be noted that none Yarn-Teller Characters can create Rules (and with Million-to-one-shots even change accepted Rules) just as in a World-Building game. This level of Flexibility is the suggested level of </li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Fluid: Referee and Yarn-Tellers may change any aspect of the world during narration, including creating new Retcons, continents, etc. Fluid games can be fun, but feel more dream-like and less real.  </li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>These axes all combine together to describe the exact nature of the game, but beyond that there is the Setting (including the Genre) that will further flavour the exact nature of the game or narrative created.</p>
<!-- /wp:paragraph -->'),
		array('RulePage'=>"Learning the Rules", 'Description'=>'<!-- wp:paragraph -->
<p>T13 is a complex series of interlocking systems that can be daunting to learn and use. So there is only one real way to learn, someone has to read the rules and try and understand them. However, you don’t all have to read all the rules at the start.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>To begin learning the game you can begin very simply, with Extra / Lite Characters, simplified Lite Annexes, simple Geometry (ignore everything but the main Number which is the easiest one to calculate), a Persona and a Core, 1 simple and specific Hitch, and Value or Dice Tests, maybe play a game set in a simple, primitive setting, literally a wandering tribe of hunters, the group is initially just the players. Initially the Referee will make the Plots small and simple, often creating Geo-Plots for simplicities sake. Over time the tribe grows, and so the Ref adds more rules, perhaps such as Sway, Stress, Tension and Drama.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Over play the simple, probably historical setting may add hints of fantasy, horror, or science-fiction, if the tribe encounters, dinosaurs, lizard-folk, or aliens perhaps in their wanders. Then again the setting may be revealed to be post-apocalyptic, or entirely fantastic early on as the two suns or shattered moons first rise on their adventures. It is even possible that the tribe may just wander from their usual route and encounter a modern city. All of that is up to the Referee or setting Author.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Eventually the Players might grow bored of their Lite Characters, who seem weighed down with simple Hitches, so they start thinking about starting a new one... Instead of creating a new Character, an Archetype or Detailed Character sheet of that Lite Character is almost a new game (Archetypes are a slightly simplified Character that are more similar to familiar systems such as TSRs famous publication). More complex Plots based on Yarn Spreads and larger Facet Conflicts that spread over several Episodes or sessions should be used to increase the entertainment for the players. Or Character Arcs and Compositions could add a deeper roleplaying experience.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Suddenly they can see new ways they could change the Character they have. To combine the Proficiencies they have in complicated ways, to fill Skill, Talent and perhaps Power slots that the Lite version hadn’t unlocked. They have more complex Hitches that vary in effect more than the Lite, and their Talents and Powers are less generic, and probably more powerful than they thought.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Sooner or later your Characters are all Grunts, each with detailed Character sheets, with full Geometries and I-Chings, they have a number of Descendants that they have constructed, but they are getting bored of the setting. By this time you have added Card Tests and Ordeals, mostly for the speed and narrative complexity of Ordeals, and should be using multiple Plots of different sizes at once. With at least one Volume Plot governing the overall Narrative. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If the setting has become stale, then it is time to shake the setting up. T13 has numerous ways you can do this, perhaps your Tribe of nomads are offered a life in a settlement, or maybe suddenly dragons erupt across the world, or aliens invade, or perhaps the tribe’s Shaman actually opens that portal to the Spirit World that the frog told him about. The world and setting can change suddenly, but it can also change gradually. Perhaps you retire those characters and create new ones born a thousand years later, in the city that their ancestors first founded.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>At some moment in the game one of the "new" Characters will need a Proficiency or Annex from one of their old Characters. In that moment, make them a Hero (if you can), suddenly they will gain access to Chi and Wyrd Tarot. This changes the nature of the game immensely, as the Characters can bend and warp reality in new and direct ways. By this time the leading Plot should either be an Epic or even a Cycle. After this point in T13 Games multiversality (either directly or via time-travel) usually becomes a common component. When Universes are only separated by the number of "What-If?" questions then it becomes easy to ask, "What if this Character was born in a Fantasy world, and became an elemental-mage?" or "What if this Character was given a super-soldier serum when they joined the army?". Often in T13 games these alternates are revealed because only 1 Character passes through the portal to the new world, everyone else will play Characters from that new world.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Eventually after several universes or epochs, with several Characters in one Character effectively, they will Coalesce (or Solo) and become a Yarn-Teller. This changes the game yet again as the Characters can directly narrate their own narratives, using Yarn Cards and Spreads, and each must learn to manage Plots, and Conflicts. Individual Characters should consider having at least one Volume or Epic that they are running for the other Players. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Next time you start playing you can all begin as Yarn-Tellers, Heroes or Grunts as you like. Or perhaps someone will play an Eelafin, Toon, Dæmon or Bulmäs Character, adding more diverse rules and more complexity to the Setting.</p>
<!-- /wp:paragraph -->

		'),
		array('RulePage'=>"Referee's Rules", 'Description'=>'<!-- wp:paragraph -->
<p>In T13, during play (things work a little differently for Authors who don’t have to worry about Players running away from their Plots and trying to start their own), one of the Players takes the role of the Referee. The Referee has a number of special roles such as:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li><strong>Narration</strong> — The Referee usually begins the narration in T13. In <a href="/creating-characters/">Grunt and Hero</a> games the Referee may do all of the narration in the game. Later in the game, or in more advanced games, other Characters may become <a href="/yarn-tellers-weavers-and-plots/">Yarn-Tellers</a> and then they will narrate parts (perhaps even most) of the game, even running their own side <a href="/plots-in-t13/">Plots</a> or at least <a href="/subplots/">Subplots</a>.</li><li><strong>Adjudicating Rules</strong> — Most of the reason the Referee is called the Referee is because they adjudicate any rules decisions (like deciding how <a href="/sway/">Difficult</a> something should be). The Referee always has final say over other Yarn-Tellers by the rights of GM Fiat, but their primary task should always to keep the game flowing and fun.</li><li><strong>NPC Actor</strong> — Often the Referee plays most of the Non-Player Characters (usually Extras), giving them voices and mannerisms to distinguish them from each other. Of course, each Yarn-Teller may narrate NPCs as well as their own Character, but the Referee is always available to add another NPC voice.</li><li><strong>Plot Interpreter</strong> — The Referee wrangles the Plots that are lurking behind the Scenes, Scenarios and Stories that unfold through play. Other Yarn-Tellers may manipulate Plots, but only the Referee can decide what happens when Yarn-Teller’s Plots interact.</li><li><strong>Author &amp; Curate The Universe</strong> — Everything that is unique about the game universe (or local multiverse) in that corner of the Omniverse is the Referee’s to play with. The Referee is usually considered as an Author, who may literally draw up a map of the world, or the continent, or just the village that the game starts in, of course, sometimes a Ref wants to set a game in someone else’s universe (I have a few you can look over, they might at least give you a few ideas) perhaps something Lovecraftian or movie influenced? Referee’s like all Authors are free to plagiarise anything from other material, curate it into their game, although an author of a non-commercial game setting doesn’t have to worry about copyright as much as the Author of a Novel or Scriptwriter must, so they often don’t file off the serial numbers quite as hard.
</li><li><strong>Banker / Croupier / Dealer</strong> — T13 uses both dice and cards in play, and perhaps poker chips as well. Usually Players make the rolls for their own Characters, but a good Ref should have dice available just in case. The Ref is responsible for the cards. They should shuffle, deal and keep the deck (although they may wish to assign those duties). The Referee should also have the chip piles nearby for handing to the Players.</li><li><strong>Make it Fun</strong> — This is absolutely the most important part of being the Referee, as the Ref has the hard job of managing everyone’s expectations, such as trying to work out how to handle the Narrative based Storylines, and Character-led narratives some of the players want play, against the ones who just want to kick down doors and slay monsters (BTW you can have and do both).</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>If you’ve never roleplayed before and haven’t been a Dungeon Master, Story-Teller or Games Master in some other game, then you should really take your time reading the rules, fully digest them, decide which one’s you think sound the most fun, and start with Lite or Grunt Characters.<br>You can think of T13 like a toolkit, slowly adding, or removing rules as your group style of play emerges. When a Rule says Optional, it really is Optional, you might be losing something by not using that Rule, but it might be something your group doesn’t like anyway. Although I would not recommend changing Rules out in the middle of an Ordeal, generally Rules changes should be done between sessions where necessary.</p>
<!-- /wp:paragraph -->'),
		array('RulePage'=>'Core Concepts', 'Description'=>'<p>Before we teach you how to use this system to build all the characters you might ever want, we need to talk a little about how the system works and the core concepts that your should know about.</p><p>T13 is built around simple concepts that stack together to create conplex characters. <ol><li><strong><a href="/facet-folio/">Facets</a></strong> — Facets are the aspects of reality (and everything in it, including the Characters) that we use in T13 to model the Omniverse. You can find out more about the Facets on the <a href="/facet-folio/">Facet Folio rules page</a>). Most things in the system are classified by Facets, they describe what things are made from (Incarna), what sort of person they are (Persona / Monster / Hitches / Core) and what sort of things they can do (Umbrals and Nimbeds)</li><li><strong><a href="/boons/">Boons</a></strong> — Boons are the number system of the model, and Character Facets can have Boons, as can Skills, equipment, even Locations. Real world values like weight in kilos can be converted into T13 Boons to give you exact model within the system (although you don’t often need to think about anything more than an average human who has Boon 13 in every Facet, and how this Character differs from them). Boons give Characters access to Dice that generate Scores, or be used to generate card Draws.</li><li><strong><a href="/proficiencies/">Proficiencies</a></strong> — Proficiencies are the memetic Threads that hold the Omniverse together. Everything that exists can be described by a Proficiency, everything that a Character can do can be summed up by a single Proficiency. Proficiencies are described in terms of their Facet and little more.</li><li><strong><a href="/annexes/">Annexes</a></strong> — Annexes are created by combining the threads of Proficiencies together to create the knots of Skills, Talents, Powers (and Super-Annexes) of Characters and Descendants. Annexes have a Boon that tells you how powerful it is, and governs the dice it might roll, how many cards it may draw etc. Annexes can also have costs and benefits that they gain from knotted Proficiencies acting as tangles, umbrals or nimbeds.</li>
			<li><strong><a href="/hitches/">Hitches</a></strong> — hitches are the dark shadows of Annexes, Proficiencies working together to create restrictions placed on Characters and Descendants. Hitches tell us what the Character or Descendant is not good at, what they don’t like doing, and what makes them afraid, angry or sad (amongst other things). Hitches have a Bane (the equivalent of a Boon) that tells you how powerfully it affects the Character when the Hitch is triggered, but Proficiencies also govern the Type of Hitch, the Gnarls that occur when it is triggered and what Triggers the Hitch in the first place.</li><li><strong><a href="/patterns-extras-descendants/">Descendants</a></strong> — Descendants are used in the system to model things that aren’t Characters (or Ref stuff like plots). They might be equipment, locations, things the Character has learnt, or even simple Characters in their own right (called Extras).</li>
			<li><strong><a href="/creating-characters/">Characters</a></strong> — T13 Characters vary in complexity from simple starter Characters to ridiculously complex detailed Gods and demons with eons of experience to draw on. Players can play anything they can imagine, although the Referee and Yarn-Tellers will have to agree any PC fits with their game concept (if you are playing in a Dark-Fantasy genre then a giant Robot may not be the best fit).</li>
			<li><strong><a href="/plots-in-t13/">Plots</a></strong> — Plots (or more properly Plot D&aelig;mons - to borrow from computing and the occult) are used by Referees and Yarn-Tellers to create Stories that Characters get involved in. Plots are the major narrative force in the engine, second only to Characters themselves.</li></ol>')
	);
	public static $menuentries = [];

	static public function addRule($name, $content, $facets='All Facets', $genres='T13 Core', $eras='Timeless', $scopes='Omniversal', $publish=true,$parent=0 ){
		$name=T13Sanitize::sanitize($name);
		$content='<!-- wp:html -->
<div class="t13ne-style-block"><div id="T13Logo" name="T13Logo"></div></div>
<!-- /wp:html -->
'.$content;
		$post_id=post_exists( $name );
		if ($post_id){
			return $post_id;
		}else{
			if ($publish){
				$publish ='publish';
			}else{
				$publish ='draft';
			}
			if (is_string($facets)){
				$faceterm = term_exists( 'All Facets', 't13facet');
				$f_id= intval($faceterm['term_id']);
			}else{
				$f_id=$facets;
			}
			if (is_string($genres)){
				$gterm = term_exists( $genres, 't13genre');
				$g_id= intval($gterm['term_id']);
			}else{
				$g_id=$genres;
			}
			if (is_string($eras)){
				$eterm = term_exists( $eras, 't13era');
				$e_id= intval($eterm['term_id']);
			}else{
				$e_id=$eras;
			}
			if (is_string($scopes)){
				$sterm = term_exists( $scopes, 't13scope');
				$s_id= intval($sterm['term_id']);
			}else{
				$s_id=$scopes;
			}
			if (is_array($f_id)){
				$facetsarr=$f_id;
			}else{
				$facetsarr[]=$f_id;
			}
			$post_parent=0;
			if ($parent){
				if (get_post_status($parent)){
					$post_parent=$parent;
				}
			}
			$geo=T13Geometry::writeGeometry($name, false);
			$geo_id=T13Geometry::getGeoTerms($name);
			$post_id = wp_insert_post( array (
				    'post_type' => 'rules',
				    'post_title' => $name,
				    'post_content' => $content,
				    'post_status' => $publish,
				    'post_parent'=>$post_parent,
				    'comment_status' => 'closed',   // if you prefer
				    'ping_status' => 'closed',    // if you prefer
				),true);
				$term_taxonomy_ids = wp_set_object_terms($post_id, $facetsarr,'t13facet', true);
				$term_taxonomy_ids = wp_set_object_terms($post_id, $g_id,'t13genre', true);
				$term_taxonomy_ids = wp_set_object_terms($post_id, $e_id, 't13era', true);
				$term_taxonomy_ids = wp_set_object_terms($post_id, $s_id, 't13scope', true);
				$term_taxonomy_ids = wp_set_object_terms($post_id, $geo_id, 't13geo', true);
			return $post_id;
		}
	}

	 static public function installRules(){
	if ( ! function_exists( 'post_exists' ) ) {
		//if posts exists doesn't load it.
			 require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		$c=count(self::$coreRules);
		$installed=array('char'=>0, 'of'=>$c, 'install'=>0,'debug'=>'Rules:');

	foreach(self::$coreRules as $core){
			$name=T13Sanitize::sanitize($core['RulePage']);
			if ($name==''){$name='Error Unnamed Rule Page';}
			$installed['exist']=post_exists($name);
		if ($installed['exist']){
				$installed['ID']=$installed['exist'];
			$installed['rule']=$name;
			$installed['debug'].=' '.$installed['exist'].' post exists already \n\r';
			$installed['install']++;

				//T13Types::addT13Menu('T13 Rules', array('Name' => $name, 'Type' => 'Rule', 'ID' => $installed['ID'], 'Description' => 'A T13 Rule is an optional chunk of the Narrative Engine. You don’t have to read, or use, them all. This one is just about ' . $name, 'URL' => get_permalink($installed['ID']), 'Item_Type' => 'post_type', 'Type' => 'rules'));
		}else{
			$installed['rule']=$name;
			$installed['ID']=self::installRule($installed['install']);
			$installed['debug'].=json_encode($installed['ID']).'
			';
				T13Types::addT13Menu('T13 Rules', array('Name' => $name, 'Type' => 'Rule', 'ID' => $installed['ID'], 'Description' => 'A T13 Rule is an optional chunk of the Narrative Engine. You don’t have to read, or use, them all. This one is just about ' . $name, 'URL' => get_permalink($installed['ID']), 'Item_Type' => 'post_type', 'Type' => 'rules'));
			$installed['install']++;

			return $installed;
		}
	}
	return $installed;
    }

	static public function installRule($install){
		if (count(self::$coreRules)>$install){
			$coreR=self::$coreRules[$install];
			$name=T13Sanitize::sanitize($coreR['RulePage']);
			$facets='All Facets';
			$genre = 'T13 Core';
			$scope = 'Omniversal';
			$era = 'Timeless';
			return self::addRule( $name, $coreR['Description'], $facets, $genre, $era, $scope, true,0);
		}
	}
}
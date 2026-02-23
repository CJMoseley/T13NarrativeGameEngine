<?php
/**
 * The Welcome Screen
 *
 * @link       http://www.cjmoseley.co.uk
 * @since      1.0.0a
 *
 * @package    T13_Rpg
 * @subpackage T13_Rpg/admin/partials
 */
 ?>
<div class="wrap">
    <h2>Welcome to T13 Narrative Engine</h2><img id="T13Logo" />
    <p>T13 began life as a table-top roleplaying game way back in the 1990s. Since then the system has been refined and honed such that now it is an utterly unique narrative engine. This is the game that allows you to play any sort of character from any genre. You can even play alongside any other sort of character from any other genre and the system will cope. You don’t even need to download any extra books or extensions. The whole Omniverse is literally at your fingertips.</p>

	<p>Okay, that’s a pretty bold statement, but as you explore the system you’ll find that it is completely true.</p>

	<p>This version of the system is based upon the books of Indie Science-fiction author CJ Moseley (me). It is intended to literally allow you to play any collection of characters you like as a balanced group. Don’t believe me? Well, we once had a 1930’s pulp archaeologist, a Greek warrior princess, a vampire accountant, a Necromancer, an 1890s deductive consulting detective, a Cyberpunk Ambulance driver and a Blackfoot Shaman all discovering that they were, in fact, the same person. This is not your usual kick the door in and slay the dragon roleplaying game, but you can do that if you want.<p>

	<p>But this game is not just a game. It can be a powerful Tool for writers and authors as well. This is because the Narrative Engine builds Conflict and Character driven plots, that are fun to play through, or to flesh out into an entire novel series. The system is built around a number of key components that interact to allow all manner of shennanigans to be modelled.</p>
	<hr/>
	<h2>T13 Modelling The Omniverse</h2>
	<p>The T13 system is built to model whole Universes with relative ease. It is a game where Characters are capable of interacting with other versions of themselves, their past-lives, or anything else you can imagine. To do this we have a simple Modelling system that can interact with itself in very complex ways. The model is based on the following components.

	<ul class="t13-list">
		<li class="model-component"><h4>Facets</h4><span class="model-text">The system defines within the universe as a combination of these 24 Stats. they work a bit like Strength or Dexterity (and so on) in other roleplaying games, only there's more of them, and some are opposites to each other. You can find out more by looking at any detailed character. The number that a Character has in each Facet is called the Boon. A Character Facet Boon is limited to between 0 (in rare cases) and 26 (although this is modified by the Character's Scale as well).</span></li>
		<li class="model-component"><h4>Boons</h4><span class="model-text">The Number system of T13. Each Boon has a die (or dice) associated with it, as well as the average roll of the dice (sometimes called the Reduced Boon or Score), and a Value which is used in Annex calculations. The Boons are much more important to you if you are playing in Table-Top Games that don't use this plugin to generate everything. Hopefully you should never need to worry about them with the Narrative Engine.</span></li>
		<li class="model-component"><h4>Characters</h4><span class="model-text">Made from collections of Annexes, Handicaps and Proficiencies, Characters are the most important part of any Game or Story. You can create Characters with various levels of details, from simple Extras, through Archetypes, Lite, and <abbr title="Player Character or Protagonist Character">PCs</abbr>. Characters in T13 may also have more than one Alternate, in the same Character. Alternates may be versions of the Character from a different universe, or various reincarnations (past-lives) or just different personalities in an identity disorder.</span></li>
		<li class="model-component"><h4>Proficiencies</h4><span class="model-text">Or Profs as they are also known, are the smallest units of knowledge that the system recognises. Think of them as mimetic units, or chunks of information the Character has. For example, a Soldier Character may have a <q>War</q> Trial Proficiency, this covers all the Character's knowledge of Wars and equipment they might use in Wars. Things that Characters can do are modelled by putting together Proficiencies to make the Character's Skills, Talents and so on (these are called Annexes). <br/> During any Roll a Character looks to see how many Proficiencies they have that are applicable.<br/>
			<div class="t13ne-tablewrap"><table class="t13ne-table" style="display:inline-table; font-size:10px;">
				<thead><tr><th>Number of Profs</th><th>Result</th></tr></thead>
				<tbody>
				<tr><td>0</td><td>Halve Score</td></tr>
				<tr><td>1</td><td>No Effect</td></tr>
				<tr><td>2</td><td>Add 1 Proficiency Die (usually a d6)</td></tr>
				<tr><td>3</td><td>Add 2 Proficiency Dice (usually 2d6)</td></tr>
				<tr><td>4</td><td>Add 3 Proficiency Dice (usually 3d6)</td></tr>
				</tbody>
			</table></div>

			A Proficiency can be very specific or very general, and that's okay, but a very specific Proficiency will count twice during a Roll when it is used. If you manage to have enough Proficiencies to roll a Proficiency Die then if all the Proficiency Dice rolled score maxium or minimum then a Proficiency Crisis has occured. During a Proficiency Crisis the Proficiencies that caused the Crisis may be added together to create an Annex (or may be added to the Annex rolled to increase its Type). During a Prof Crisis it is usual for the Ref to gather back cards (except the one card the PCs may keep in their Hand or any Ordeal Cards in play or Pools) and shuffle the Deck.<br/>

		 The Referee has final say on whether a Proficiency counts or not. </span></li>
		<li class="model-component"><h4>Annexes</h4><span class="model-text">Made by combining Proficiencies together, they come in a number of sizes, from Skill, Talent, Power, up to Super-Skill. An Annex can have a much larger Boon than a solitary Facet, which means they can roll very large dice, generate large Scores, and do much more complex or difficult things.</span></li>
		<li class="model-component"><h4>Handicaps</h4><span class="model-text">Where Facets, Proficiencies and Annexes are all good things for Characters, the Handicap is the opposite. Handicaps limit what Characters can do (or at least get away with), but at the same time are necessary to increase the power-level of a Character. Handicaps govern how large Personality Annexes can be, how many Skills a PC can have</span></li>
		<li class="model-component"><h4>Descendant</h4><span class="model-text">Used to model almost everything that isn't a Character (and some Characters!), a Descendant is a collection of Annexes, Proficiencies and often Handicaps.</span></li>
		<li class="model-component"><h4>Locations</h4><span class="model-text">A special type of Descendant that models a place (and large vehicles) within the system. Locations have an Special Annex called a Size Annex that tells us how big they are.</span></li>
		<li class="model-component"><h4>Plot Demons</h4><span class="model-text">The part of the model that governs the Story that is being told. Plot Demons are the hidden stage managers of a Story. They look after all the Descendants, locations, Characters and so on of any Story, whether a single night's adventure or the Epic Tale of the Founding of that fantasy kingdom you're setting the story in. Plot demons are a very flexible and versatile way of tracking Stories, embodying Conflicts and generally making up great balanced adventures and fun tales of anguish and woe. </span></li>
	</ul>
	<h2>Getting Started</h2>
	<p>This plugin has been designed and written so that you should be able to jump right in. To get started all you should have to do is view one of the Game Pages.
</div>

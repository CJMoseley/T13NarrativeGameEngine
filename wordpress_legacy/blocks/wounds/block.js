(function (blocks, editor, element, data, i18n,components ) {
	 var el = element.createElement;
	 var { __ } = i18n;
	 

  blocks.registerBlockType("t13ne/t13ne-wound", {
	title: __("T13 Wound"),
	description: __("In T13 we handle damage to Characters and Descendants within the model with the concept of Wounds. Wounds can range from nothing at all (which has no effected) to Carnage+ Wounds that instantly create new Woe Hitches on their target."),
	icon: window.T13NE.WoundIcon,
	keywords: [
		__("wound"),
		__("injury"),
		__("damage")
	],
	inserter:false,
	category: "common",
	attributes: {
		id:{
			type:"string",
			source:"attribute",
			attribute:"id",
			selector:"div"
		},
		level: {
			default:"0",
			source: "attribute",
			attribute: "data-t13newound-level",
			selector: "article.t13ne-wound"
		},
		className:{
			type:"string",
			default:"t13ne-wound",
			attribute:"className",
			selector:"div"
		}
		
	},
	edit: function (props) {
		console.log("edit wound block props",props);
		var widder=props.clientID;
		//console.log("widder",widder);
		function onChange( newlevel ) {
			console.log("onChange event",newlevel)
	        props.setAttributes( { level: newlevel, className:props.attributes.className, id:widder } );
	    }
		return [el(editor.InspectorControls, null,
			el(components.PanelBody, {
				title: __('Select Wound Level', 't13level') },
			el(components.PanelRow, null, el(window.wp.components.SelectControl,{
				label:"Pick a Wound",
				value: props.attributes.level,
				options:window.T13NE.WoundLevels,
				onChange:onChange})))),
				el("div",{ id:widder,"data-t13newound-level":props.attributes.level, "className":props.className+"-div"},el( window.T13NE.Wound, {id:widder+"-wou", "data-t13newound-level":props.attributes.level, "className":props.className+"-wound t13ne-wound" },null))];
	},

	save: function (props) {
		var widder=window.T13NE.getT13ID("div[data-t13newound-level].t13ne-wound","wound",window.T13NE.This(this,props));
		//console.log("widder",widder);
		console.log("wound block save called, props:",props);
	  return el("div",{id:props.attributes.id!==undefined?props.attributes.id:widder,"data-t13newound-level":props.attributes.level, "className":props.className+"-div"},el (window.T13NE.Wound, {id:props.attributes.id+"-wou","data-t13newound-level":props.attributes.level, "className":props.className+" t13ne-wound"}, null));
	}});

	})(
	window.wp.blocks,
	window.wp.editor,
	window.wp.element,
	window.wp.data,
	window.wp.i18n,
	window.wp.components);

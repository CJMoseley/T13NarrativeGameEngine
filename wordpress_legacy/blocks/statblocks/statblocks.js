//"{$scale}:{$st}:{$hex[0]}={$hex[1]}"
if (!window.T13NE.Statblocks){window.T13NE.Statblocks={};}
window.T13NE.Statblocks.Statblock = class extends window.T13NE.Component{
	/* expecting facet pairs like array
	 (
		[	{"aFacet": 0, "aFacetBoon":13, "bFacet":9, "bFacetBoon":13, "joined":true},
			{"aFacet": 2, "aFacetBoon":13, "bFacet":13, "bFacetBoon":13, "joined":true},
			{"aFacet": 3, "aFacetBoon":13, "bFacet":22, "bFacetBoon":13, "joined":true},
			{"aFacet": 5, "aFacetBoon":13, "bFacet":16, "bFacetBoon":13, "joined":true},
			{"aFacet": 6, "aFacetBoon":13, "bFacet":1, "bFacetBoon":13, "joined":true},
			{"aFacet": 7, "aFacetBoon":13, "bFacet":14, "bFacetBoon":13, "joined":true},
			{"aFacet": 10, "aFacetBoon":13, "bFacet":4, "bFacetBoon":13, "joined":true},
			{"aFacet": 11, "aFacetBoon":13, "bFacet":21, "bFacetBoon":13, "joined":true},
			{"aFacet": 15, "aFacetBoon":13, "bFacet":12, "bFacetBoon":13, "joined":true},
			{"aFacet": 18, "aFacetBoon":13, "bFacet":20, "bFacetBoon":13, "joined":true},
			{"aFacet": 19, "aFacetBoon":13, "bFacet":17, "bFacetBoon":13, "joined":true},
			{"aFacet": 23, "aFacetBoon":13, "bFacet":8, "bFacetBoon":13, "joined":true}
		]
	)
	*/
	constructor (props){
		super(props);
		this.rearrange=this.rearrange.bind(this);
		this.state={
			"statblockID":this.props['data-statblockid']?this.props['data-statblockid']:-1,
			"scale":this.props["data-scale"]?this.props['data-scale']:"Pending",
			"facetpairs":this.props['data-facetpairs']?JSON.parse(this.props["data-facetpairs"]):"Pending",
			"edit":this.props["data-edit"],
		}
	}
	loadStatblock=()=>{
		if (this.state.facetpairs == "Pending" && this.state.statblockID!==-1){
			var stats= window.wp.data.select('t13ne/t13store').readStatBlock(this.state.statblockID);
		}
	}

	rearrange=(neworder)=>{
		//rearranges the order of the statpairs
		this.setState({"facetpairs":neworder});
	}

	render(){
		var ret=[];
		for(var i=0; i<this.state.facetpairs.length; i++){
			ret[ret.length]=window.T13NE.CE(window.T13NE.Statblocks.Statpair, {className:this.props.className, "data-scale":this.state.scale, "data-edit":this.state.edit, "data-a-facet":this.state.facetpairs[i].aFacet, "data-a-facet-boon":this.state.facetpairs[i].aFacetBoon, "data-joined":this.state.facetpairs[i].joined, "data-b-facet":this.state.facetpairs[i].bFacet, "data-b-facet-boon":this.state.facetpairs[i].bFacetBoon });
		}
		return window.T13NE.CE("div", {className:this.props.className+" t13ne-statblock"}, ret);
	}

}



window.T13NE.Statblocks.Statpair = class extends window.T13NE.Component{
	constructor(props){
		super(props);
		this.onJoin=this.onJoin.bind(this);
		this.onAFacetChange=this.onAFacetChange.bind(this);
		this.onBFacetChange=this.onBFacetChange.bind(this);
		this.onABoonChange=this.onABoonChange.bind(this);
		this.onBBoonChange=this.onBBoonChange.bind(this);
		this.id = this.props.id;

		if (this.props["data-joined"]){
			this.state={
			"scale":this.props["data-scale"],
			"aFacet":this.props["data-a-facet"],
			"aFacetBoon":this.props["data-a-facet-boon"],
			"joined":true,
			"bFacet":this.props["data-b-facet"],
			"bFacetBoon":26-parseInt(this.props["data-a-facet-boon"]),
			"edit":this.props["data-edit-mode"],
			};
		}else{
			this.state={
				"scale":this.props["data-scale"],
				"aFacet":this.props["data-a-facet"],
				"aFacetBoon":this.props["data-a-facet-boon"],
				"joined":false,
				"bFacet":this.props["data-b-facet"],
				"bFacetBoon":this.props["data-b-facet-boon"],
				"edit":this.props["data-edit-mode"],
			}
		}	
	}
	onJoin=(ev) =>{
		var joi=ev.target.getAttribute("checked");
		
		if (joi&&this.state.bFacetBoon!==26-this.state.aFacetBoon){
			this.setState({"joined":joi, "bFacetBoon":26-this.state.aFacetBoon});
		}else{
			this.setState({"joined":joi});
		}
	}
	onAFacetChange=(ev)=>{
		var afacet =ev.target.value;
		this.setState({"aFacet":afacet}); 
	}
	onBFacetChange=(ev)=>{
		var bfacet =ev.target.value;
		this.setState({"bFacet":bfacet}); 
	}
	onABoonChange=(ev)=>{
		var aBoon =parseInt(ev.target.value);
		this.setState({"aFacetBoon":aBoon}); 
		if (this.state.joined){
			this.setState({"bFacetBoon":26-aBoon});
		}
	}
	onBBoonChange=(ev)=>{
		var bBoon =parseInt(ev.target.value);
		this.setState({"bFacetBoon":bBoon}); 
	}
	render(){
		if (!this.id){this.id =window.T13NE.getT13ID("input[type=\"checkbox\"].t13ne-joined","joined",window.T13NE.This(this,this.props));}
		return window.T13NE.CE("div",{className:this.props.className+"-div t13ne-statpair"},
			window.T13NE.CE("div", {className:this.props.className+"-div-div t13ne-statpair t13ne-statpair-stat-a"},
				window.T13NE.CE(window.T13NE.FacetShort,{className:this.props.className+"-a t13ne-statpair t13ne-a-facet", "data-facet":this.state.aFacet, "data-edit":this.state.edit, "onChange":this.onAFacetChange, "data-a":true, "data-b":false},null), 
				window.T13NE.CE(window.T13NE.Boon.DisplayBoon,{className:this.props.className+"-a-boon t13ne-statpair t13ne-a-facet-boon", "data-boon":this.state.aFacetBoon, "data-edit":this.state.edit, "onChange":this.onABoonChange, "data-scale":this.state.scale},null)
				),
			(this.state.joined&&this.state.edit)?window.T13NE.CE("range",{className:this.props.className+"-range t13ne-statpair t13ne-boon edit", "onChange":this.onABoonChange, min:0, max:26}, null):null,
			window.T13NE.CE("input",{className:this.props.className+"-joined t13ne-statpair t13ne-joined", type:"checkbox", onChange:this.onJoin, checked:this.state.joined, id:this.id+"-join"},null),
			window.T13NE.CE("div", {className:this.props.className+"-div-div t13ne-statpair t13ne-statpair-stat-b"},
				window.T13NE.CE(window.T13NE.FacetShort,{className:this.props.className+"-b t13ne-statpair t13ne-b-facet", "data-facet":this.state.bFacet, "data-edit":this.state.edit, "onChange":this.onBBoonChange, "data-a":false, "data-b":true},null), 
				window.T13NE.CE(window.T13NE.Boon.DisplayBoon,{className:this.props.className+"-b-boon t13ne-statpair t13ne-b-facet-boon", "data-boon":this.state.bFacetBoon, "data-edit":this.state.edit, "onChange":this.onBBoonChange, "data-scale":this.state.scale},null)
				
				));

	}
}
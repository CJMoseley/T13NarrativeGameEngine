
window.T13NE.Avatar = class extends window.T13NE.Component {
  constructor(props) {
    super(props);
     }
	render() {
    return window.T13NE.CE("figure", { className: this.props.className+" t13ne-avatar" },
    window.T13NE.CE("details", {className: this.props.className},
    window.T13NE.CE("summary", { className:  this.props.className+" t13ne-tooltip" },
    window.T13NE.CE("img", { alt: this.props["data-t13ne-name"], title: this.props["data-t13ne-name"],src: this.props["data-t13ne-url"], className:  this.props.className+" avatar photo" },null),
    ),
    window.T13NE.CE("p", {className: this.props.className+" link"}, 
     window.T13NE.CE("a", {href:this.props["data-t13ne-link"], className:this.props.className+" t13ne-tooltip"}, this.props["data-t13ne-name"])),
    window.T13NE.CE(window.T13NE.T13Geometry,{ className: this.props.className+" geometry", name: this.props["data-t13ne-name"]},null),
    window.T13NE.CE("p", { className: this.props.className+" t13ne-description" }, this.props["data-t13ne-desc"])));
  }
};

//proficiency.js -- and attempt at a React only component.


class T13neProficiency extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return React.createElement("div", { class: "t13ne-proficiency", "data-prof-id": props.profid },
    React.createElement("details", null,
    React.createElement("summary", null,
    React.createElement("strong", { class: "t13ne-proftitle" }, "Proficiency: "), React.createElement("strong", { class: "t13-prof-name" }, props.profName)),

    React.createElement("div", { class: "t13ne-postdata" },
    props.profContent),

    React.createElement("small", null,
    React.createElement("p", { class: "t13ne-postdata" },
    React.createElement("span", { class: "t13ne-date" }, "Posted : "+props.postdate)),

    React.createElement("p", { class: "t13ne-author" }, " Created by: "),
    React.createElement(T13neAvatar, null))));



  }}
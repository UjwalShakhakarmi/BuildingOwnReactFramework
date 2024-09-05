// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />{" "}
//   </div>
// );
//  createElement("div", null, a, b) returns:

// {
//   "type": "div",
//   "props": { "children": [a, b] }
// }
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}
// The children array could also contain primitive values like strings or numbers. So we’ll wrap everything that isn’t an object inside its own element and create a special type for them: TEXT_ELEMENT.
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
function render(element, container) {
  //TODO create dom nodes
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  // we need to do here is assign the element props to the node.
  //The function returns true if the key is not equal to "children", and false otherwise.
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  element.props.children.forEach((child) => render(child, dom));
  container.appendChild(dom);
}
const Didact = {
  createElement,
  render,
};
/** @jsx Didact.createElement */
const element = Didact.createElement(
  "div",
  { id: "foo" },
  //WE ARE BUILDING OUR OWN FRAMEWORK SO WE NAMED AS "DIDACT"

  Didact.createElement("a", null, "Hello!! World"),
  Didact.createElement("b")
);
const container = document.getElementById("root");
Didact.render(element, container);

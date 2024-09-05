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
function createDom(fiber) {
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
  return dom;
}
function updateDom(dom, prevProps, nextProps) {
  // TODO
}
function commitRoot() {
  //we recursively append all the nodes to the dom.
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    //We also add the alternate property to every fiber. This property is a link to the old fiber, the fiber that we committed to the DOM in the previous commit phase.
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}
let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = [];

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  // You can think of requestIdleCallback as a setTimeout,
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  //The next fiber to work on could be:
  //The current fiber's child (if it has any).
  //If no child, then it looks for the fiber's sibling.
  //If neither child nor sibling is available, it moves back up the tree to the parent to look for the parent's sibling.
  // Create a DOM node (like <div>, <a>, etc.) if it doesn't exist yet
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // Get the children elements from the fiber's props
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
  // Return the next unit of work (child, sibling, or move up the tree)
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  // Loop through each element and create a new fiber for each
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    const sameType = oldFiber && element && element.type == oldFiber.type;
    if (sameType) {
      //update the node
      //we create a new fiber keeping the DOM node from the old fiber and the props from the element.
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      //TODO add this node
      const newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        dom: null, // DOM will be created later
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      //delete oldFiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    // Set the first child of the fiber
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      // Set the sibling relationship for other children
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
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

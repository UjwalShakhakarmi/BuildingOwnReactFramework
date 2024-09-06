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
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}
const isEvent = (key) => key.startsWith("on");

const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent) // Find all event listeners
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key)) // If they don't exist or have changed
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2); // Convert "onClick" to "click"
      dom.removeEventListener(eventType, prevProps[name]); // Remove the old event listener
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty) // Find all properties except events and children
    .filter(isGone(prevProps, nextProps)) // If they don't exist in nextProps
    .forEach((name) => {
      dom[name] = ""; // Remove the property
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty) // Find all properties except events and children
    .filter(isNew(prevProps, nextProps)) // If they are new or changed
    .forEach((name) => {
      dom[name] = nextProps[name]; // Update the property
    });

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent) // Find all event listeners
    .filter(isNew(prevProps, nextProps)) // If they are new or changed
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2); // Convert "onClick" to "click"
      dom.addEventListener(eventType, nextProps[name]); // Add the new event listener
    });
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
requestIdleCallback(workLoop);
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
const container = document.getElementById("root");
const rerender = (value) => {
  const element = (
    <div>
      <input value={value} />
      <h2>Hello</h2>
    </div>
  );
  Didact.render(element, container);
};

rerender("asdfsdf");
// const element = Didact.createElement(
//   "div",
//   { id: "foo" },
//   //WE ARE BUILDING OUR OWN FRAMEWORK SO WE NAMED AS "DIDACT"

//   Didact.createElement("a", null, "Hello!! World"),
//   Didact.createElement("b")
// );

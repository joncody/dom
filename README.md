# `dom.js` – Minimal, Chainable DOM Utility

A **lightweight, modern alternative to jQuery** for selecting and manipulating DOM elements with a clean, chainable API.

`dom` prioritizes **clarity, safety, and interoperability** — delivering powerful DOM control without bloat.

> 📦 **Zero runtime dependencies** • ⚡ **Chainable & immutable** • 🌲 **Pure ES module**

---

## ✅ Features

- 🎯 **Flexible Selection**  
  Accepts CSS selectors, DOM nodes, `NodeList`s, arrays of nodes, and `dom` instances.
- ⛓️ **Chainable API**  
  Fluent method chaining for expressive, readable code.
- 🧵 **Class Management**  
  `addClass`, `removeClass`, `toggleClass`, `hasClass`, `getClassName`
- 🏷️ **Attributes & Data**  
  Safe `attr()` and `data()`—pass `null` to remove.
- 📝 **Content Control**  
  `text()` (XSS-safe) and `html()` (use cautiously).
- 🎨 **CSS Styling**  
  Get/set computed or inline styles with automatic `camelCase` ↔ `kebab-case` conversion.
- 🌲 **DOM Traversal**  
  `parents()`, `children()`, `next()`, `prev()`, `siblings()`, `select()`, `selectAll()`
- 🔁 **Clone & Create**  
  `clone()` and `dom.create(tag)` for element generation.
- ⚡ **Event Handling**  
  `on()`, `off()`, `once()` with optional capture phase support.
- 🧊 **Immutable Interface**  
  All returned objects are frozen to prevent accidental mutation.

---

## 📦 Installation

Place `dom.js` in your project:

```bash
your-project/
└── dom.js
```

Then import:

```js
import dom from './dom.js';
```

> 💡 `dom` relies on `utils.js` for helpers: `isNode`, `objectType`, `camelCase`, and `kebabCase`.

---

## 🧠 Quick Examples

### Select and manipulate
```js
dom("p.intro")
  .addClass("highlight")
  .text("Updated safely!")
  .on("click", () => console.log("Clicked!"));
```

### Create and insert
```js
const modal = dom.create("div")
  .addClass("modal")
  .html("<p>Trusted content only!</p>");

document.body.appendChild(modal.get(0));
```

### Work with collections
```js
dom("li.item")
  .toggleClass("selected", true)
  .data("index", "1")
  .css("color", "blue");
```

### Traverse & filter
```js
// Direct children
const items = dom("ul").children(); // -> dom([<li>, <li>])

// Sibling navigation
dom("#middle").next().addClass("highlight");
dom(".active").siblings().removeClass("active");

// First matching descendant
const first = dom("#nav").select("li:first-child");

// All matching descendants
const allButtons = dom(".toolbar").selectAll("button");
```

---

## 📚 API Reference

### 🟢 Initialization

| Method | Description |
|--------|-------------|
| `dom(selector)` | Creates a selection from a CSS string, `Node`, `NodeList`, array of `Node`s, or a `dom` instance. |
| `dom.create(tagName)` | Creates and returns a new `dom`-wrapped element (only valid HTML tags allowed). |

---

### 🏷️ Attributes & Data

| Method | Description |
|--------|-------------|
| `attr(name)` | Get attribute value(s) as array. |
| `attr(name, value)` | Set attribute on all elements. |
| `attr(name, null)` | Remove attribute. |
| `data(name)` | Get `dataset` value(s). |
| `data(name, value)` | Set `dataset` property. |
| `data(name, null)` | Delete dataset property. |

> All setter forms return the `dom` instance for chaining.

---

### 🧵 Classes

| Method | Description |
|--------|-------------|
| `addClass(token)` | Adds one or more space-separated classes. |
| `removeClass(token)` | Removes one or more classes. |
| `toggleClass(token, [force])` | Toggles class; `force` (boolean) sets state explicitly. |
| `hasClass(token)` | Returns `true` **only if all** selected elements have the class. |
| `getClassName()` | Returns array of `className` strings (one per element). |

---

### 📝 Content

| Method | Description |
|--------|-------------|
| `text()` | Returns array of `textContent` values. |
| `text(value)` | Sets `textContent` (safe from XSS). |
| `html()` | Returns array of `innerHTML` strings. |
| `html(value)` | Sets `innerHTML` (**use only with trusted input!**). |

---

### 🎨 Styles

| Method | Description |
|--------|-------------|
| `css(name)` | Returns array of **computed** style values (e.g., `css("font-size")`). |
| `css(name, value)` | Sets inline style using `camelCase` or `kebab-case` (e.g., `css("background-color", "#fff")`). |
| `css(name, null)` | Removes inline style property. |

---

### 🌲 Traversal & Structure

| Method | Description |
|--------|-------------|
| `children()` | Returns direct children of each element as a new `dom` object. |
| `parents()` | Returns a new `dom` object containing the parent element of each selected element if it has one. |
| `next()` | Returns the **next sibling element** of each selected element (skips text/comment nodes). |
| `prev()` | Returns the **previous sibling element** of each selected element (skips text/comment nodes). |
| `siblings()` | Returns all **sibling elements** (excluding self); deduplicates when multiple selected elements share siblings. |
| `select(selector)` | Finds **first** matching descendant per element (`querySelector`). |
| `selectAll(selector)` | Finds **all** matching descendants per element (`querySelectorAll`). |
| `clone([deep])` | Clones all elements (`deep = true` by default); returns new `dom` object. |
| `get([index])` | Returns element at index, or a **copy** of the full array if no index. |
| `length()` | Returns number of selected elements. |

---

### 🗑️ DOM Removal

| Method | Description |
|--------|-------------|
| `remove()` | Removes all selected elements from the DOM. |

---

### ⚡ Events

| Method | Description |
|--------|-------------|
| `on(type, fn, [capture])` | Adds event listener to all elements. |
| `off([type], [fn], [capture])` | Removes event listener(s). |
| `once(type, fn, [capture])` | Adds a one-time listener; auto-removes after first trigger. |

> Callback signature: `fn(event)`

---

### 🔧 Utilities

| Method | Description |
|--------|-------------|
| `each(fn)` | Iterates over elements: `fn(element, index, array)`. Context = `dom` instance. |
| `addItem(val)` | Adds more elements to the current selection. |
| `removeItem(index)` | Removes element at `index` from the internal selection array. |

---

## ⚠️ Security Note

- ✅ **`text()` is safe** — uses `textContent`, immune to XSS.
- ⚠️ **`html()` is dangerous** — uses `innerHTML`. **Only use with fully trusted content.**

---

## 📄 License

See [LICENSE](./LICENSE)

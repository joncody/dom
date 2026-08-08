import dom from "../../../src/dom.js";

function createTestRunner() {
    const resultsContainer = document.getElementById("test-results");
    const summaryContainer = document.getElementById("summary");

    let currentGroupBody = null;
    let failedAssertions = 0;
    let passedAssertions = 0;
    let totalAssertions = 0;

    function assert(condition, message) {
        totalAssertions += 1;
        const entry = document.createElement("div");

        if (condition === true) {
            passedAssertions += 1;
            entry.className = "log-entry pass";
            entry.textContent = "[PASS] " + message;
            console.log("%c[PASS] " + message, "color: #4caf50;");
        } else {
            failedAssertions += 1;
            entry.className = "log-entry fail";
            entry.textContent = "[FAIL] " + message;
            console.error("[FAIL] " + message);
        }

        if (currentGroupBody !== null) {
            currentGroupBody.appendChild(entry);
        }
    }

    function assertThrows(fn, message) {
        totalAssertions += 1;
        const entry = document.createElement("div");
        try {
            fn();
            failedAssertions += 1;
            entry.className = "log-entry fail";
            entry.textContent = "[FAIL] " + message + " (Did not throw)";
            console.error("[FAIL] " + message + " (Did not throw)");
        } catch (ignore) {
            passedAssertions += 1;
            entry.className = "log-entry pass";
            entry.textContent = "[PASS] " + message + " (Threw as expected)";
            console.log(
                "%c[PASS] " + message + " (Threw as expected)",
                "color: #4caf50;"
            );
        }

        if (currentGroupBody !== null) {
            currentGroupBody.appendChild(entry);
        }
    }

    function group(title) {
        if (currentGroupBody !== null) {
            console.groupEnd();
        }
        console.group(title);

        const groupEl = document.createElement("div");
        const headerEl = document.createElement("div");

        groupEl.className = "test-group";
        headerEl.className = "group-header";
        headerEl.textContent = title;

        currentGroupBody = document.createElement("div");
        currentGroupBody.className = "group-body";

        groupEl.appendChild(headerEl);
        groupEl.appendChild(currentGroupBody);
        resultsContainer.appendChild(groupEl);
    }

    function renderSummary(startTime) {
        if (currentGroupBody !== null) {
            console.groupEnd();
        }

        const elapsed = performance.now() - startTime;
        const duration = elapsed.toFixed(2);
        const statusClass = (
            failedAssertions === 0
            ? "summary-pass"
            : "summary-fail"
        );

        const summaryText = (
            "Total Assertions: " + String(totalAssertions)
            + " | Passed: " + String(passedAssertions)
            + " | Failed: " + String(failedAssertions)
            + " | Execution Time: " + duration + " ms"
        );

        console.info(
            "%c" + summaryText,
            "font-weight: bold; font-size: 1.1em; color: #82aaff;"
        );

        summaryContainer.innerHTML = (
            "Total Assertions: <strong>" + String(totalAssertions) +
            "</strong> | Passed: <span class='" + statusClass + "'>" +
            String(passedAssertions) + "</span> | Failed: <span class='" +
            statusClass + "'>" + String(failedAssertions) +
            "</span> | Execution Time: <strong>" + duration + " ms</strong>"
        );
    }

    return Object.freeze({
        assert,
        assertThrows,
        group,
        renderSummary
    });
}

function runAllTests() {
    const runner = createTestRunner();
    const startTime = performance.now();
    const fixture = document.getElementById("test-fixture");

    function resetFixture() {
        fixture.innerHTML = "";
    }

    // -------------------------------------------------------------------------
    // GROUP 1: Factory Instantiation & Selector Resolution
    // -------------------------------------------------------------------------
    runner.group("1. Factory Instantiation & Selector Resolution");

    resetFixture();
    const element = document.createElement("div");
    element.id = "target-node";
    fixture.appendChild(element);

    const selectorWrapper = dom("#target-node");
    runner.assert(
        selectorWrapper.length() === 1,
        "CSS selector string '#target-node' resolves to 1 element"
    );

    const nodeWrapper = dom(element);
    runner.assert(
        nodeWrapper.length() === 1,
        "Direct DOM element reference wraps successfully"
    );

    const wrappedCopy = dom(selectorWrapper);
    runner.assert(
        wrappedCopy.length() === 1,
        "Wrapping existing dom() instance extracts elements correctly"
    );

    const nodeListWrapper = dom(document.querySelectorAll("#target-node"));
    runner.assert(
        nodeListWrapper.length() === 1,
        "Wrapping a NodeList resolves elements correctly"
    );

    const collectionWrapper = dom(fixture.children);
    runner.assert(
        collectionWrapper.length() === 1,
        "Wrapping an HTMLCollection resolves elements correctly"
    );

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement("span"));
    fragment.appendChild(document.createElement("span"));
    const fragmentWrapper = dom(fragment);
    runner.assert(
        fragmentWrapper.length() === 2,
        "DocumentFragment expands into its element children"
    );

    const mixedArrayWrapper = dom([element, "not-a-node", 123]);
    runner.assert(
        mixedArrayWrapper.length() === 0,
        "Array containing non-node values rejects and returns empty wrapper"
    );

    runner.assert(
        dom(null).length() === 0 && dom(undefined).length() === 0,
        "Passing null or undefined returns empty wrapper"
    );

    runner.assert(
        dom(12345).length() === 0 && dom(true).length() === 0,
        "Passing numbers or booleans returns empty wrapper"
    );

    const createdDiv = dom.create("DIV");
    runner.assert(
        createdDiv.length() === 1 && createdDiv.get(0).tagName === "DIV",
        "dom.create('DIV') handles uppercase tags and creates valid element"
    );

    const invalidTag = dom.create("invalid-custom-tag-12345");
    runner.assert(
        invalidTag.length() === 0,
        "dom.create() with un-whitelisted tag returns empty wrapper"
    );

    runner.assert(
        dom.create(null).length() === 0 && dom.create("").length() === 0,
        "dom.create() with null or empty string returns empty wrapper"
    );

    // -------------------------------------------------------------------------
    // GROUP 2: Encapsulation & Immutability
    // -------------------------------------------------------------------------
    runner.group("2. Encapsulation & Immutability (Crockford Standards)");

    const sampleDom = dom("#target-node");
    runner.assert(
        Object.isFrozen(sampleDom) === true,
        "Returned dom API spec object is frozen with Object.freeze()"
    );

    runner.assert(
        Object.isFrozen(dom) === true,
        "dom factory object is frozen with Object.freeze()"
    );

    runner.assert(
        Object.isFrozen(dom.create) === true,
        "dom.create function is frozen with Object.freeze()"
    );

    runner.assertThrows(function () {
        sampleDom.length = 999;
    }, "Mutating frozen API property fails in strict mode");

    runner.assertThrows(function () {
        sampleDom.customProp = true;
    }, "Adding property to frozen API object fails in strict mode");

    runner.assert(
        sampleDom.elements === undefined,
        "Internal elements array is encapsulated via closure"
    );

    // -------------------------------------------------------------------------
    // GROUP 3: Core Inspection & Copy Methods
    // -------------------------------------------------------------------------
    runner.group("3. Core Inspection & Copy Methods (length, get, each)");

    resetFixture();
    const el1 = document.createElement("span");
    const el2 = document.createElement("span");
    fixture.appendChild(el1);
    fixture.appendChild(el2);

    const spanWrapper = dom("span");
    runner.assert(
        spanWrapper.length() === 2,
        "length() returns exact count of matched elements"
    );

    runner.assert(
        spanWrapper.get(0) === el1 && spanWrapper.get(1) === el2,
        "get(index) returns element at valid index"
    );

    const allGet = spanWrapper.get();
    runner.assert(
        Array.isArray(allGet) === true && allGet.length === 2,
        "get() without arguments returns Array copy of all elements"
    );

    allGet.push(document.createElement("p"));
    runner.assert(
        spanWrapper.length() === 2,
        "Mutating array returned by get() does not alter internal closure state"
    );

    const outOfBoundsGet = spanWrapper.get(999);
    runner.assert(
        Array.isArray(outOfBoundsGet) === true && outOfBoundsGet.length === 2,
        "get() with out-of-bounds index returns array copy fallback"
    );

    const negativeGet = spanWrapper.get(-1);
    runner.assert(
        Array.isArray(negativeGet) === true && negativeGet.length === 2,
        "get() with negative index returns array copy fallback"
    );

    let count = 0;
    const chained = spanWrapper.each(function (el, index) {
        count += 1;
        runner.assert(
            typeof index === "number"
            && el !== null
            && typeof el.nodeType === "number",
            "each() callback receives element and numeric index"
        );
    });

    runner.assert(
        count === 2,
        "each() iterates over all elements in collection"
    );

    runner.assert(
        chained === spanWrapper,
        "each() returns api instance for method chaining"
    );

    runner.assert(
        spanWrapper.each(null) === spanWrapper,
        "each() with non-function returns api instance gracefully"
    );

    // -------------------------------------------------------------------------
    // GROUP 4: Collection Management
    // -------------------------------------------------------------------------
    runner.group("4. Collection Management (addItem, removeItem)");

    resetFixture();
    const itemA = document.createElement("p");
    const itemB = document.createElement("p");
    const itemC = document.createElement("p");

    const coll = dom(itemA);
    runner.assert(coll.length() === 1, "Initial collection length is 1");

    coll.addItem(itemB);
    runner.assert(
        coll.length() === 2,
        "addItem() with Node increases length to 2"
    );

    coll.addItem([itemC]);
    runner.assert(
        coll.length() === 3,
        "addItem() with Array increases length to 3"
    );

    coll.removeItem(1);
    runner.assert(
        coll.length() === 2 && coll.get(1) === itemC,
        "removeItem(1) removes middle element and updates index mapping"
    );

    coll.removeItem(999);
    runner.assert(
        coll.length() === 2,
        "removeItem() with out-of-bounds index leaves collection unchanged"
    );

    coll.removeItem(-1);
    runner.assert(
        coll.length() === 2,
        "removeItem() with negative index leaves collection unchanged"
    );

    // -------------------------------------------------------------------------
    // GROUP 5: Attribute & Dataset Operations
    // -------------------------------------------------------------------------
    runner.group("5. Attribute & Dataset Operations (attr, data)");

    resetFixture();
    const attrBox = dom.create("div");
    fixture.appendChild(attrBox.get(0));

    attrBox.attr("id", "box-1");
    runner.assert(
        attrBox.get(0).getAttribute("id") === "box-1",
        "attr(name, value) sets element attribute"
    );

    const attrValues = attrBox.attr("id");
    runner.assert(
        attrValues[0] === "box-1",
        "attr(name) returns array of attribute values"
    );

    attrBox.attr("id", null);
    runner.assert(
        attrBox.get(0).hasAttribute("id") === false,
        "attr(name, null) removes attribute from element"
    );

    runner.assert(
        attrBox.attr(123) === attrBox,
        "attr() with non-string attribute name returns api gracefully"
    );

    attrBox.data("role", "admin");
    runner.assert(
        attrBox.get(0).dataset.role === "admin",
        "data(name, value) sets dataset property"
    );

    const dataValues = attrBox.data("role");
    runner.assert(
        dataValues[0] === "admin",
        "data(name) returns array of dataset values"
    );

    attrBox.data("role", null);
    runner.assert(
        attrBox.get(0).dataset.role === undefined,
        "data(name, null) deletes dataset property"
    );

    runner.assert(
        attrBox.data(123) === attrBox,
        "data() with non-string dataset name returns api gracefully"
    );

    // -------------------------------------------------------------------------
    // GROUP 6: Class Name Manipulation & Predicates
    // -------------------------------------------------------------------------
    runner.group("6. Class Name Manipulation & Predicates");

    resetFixture();
    const classBox1 = dom.create("div");
    const classBox2 = dom.create("div");
    const classMulti = classBox1.addItem(classBox2);

    classMulti.addClass("card active");
    runner.assert(
        classBox1.hasClass("card") === true
        && classBox2.hasClass("card") === true,
        "addClass() adds multiple space-separated classes to all elements"
    );

    runner.assert(
        classMulti.hasClass("card") === true,
        "hasClass() returns true when ALL elements in collection contain class"
    );

    classBox2.removeClass("card");
    runner.assert(
        classMulti.hasClass("card") === false,
        "hasClass() returns false when ANY element in collection lacks class"
    );

    runner.assert(
        classMulti.hasClass("") === false
        && classMulti.hasClass(123) === false,
        "hasClass() with invalid tokens returns false"
    );

    classBox1.toggleClass("highlight");
    runner.assert(
        classBox1.hasClass("highlight") === true,
        "toggleClass() toggles class on"
    );

    classBox1.toggleClass("highlight");
    runner.assert(
        classBox1.hasClass("highlight") === false,
        "toggleClass() toggles class off"
    );

    classBox1.toggleClass("forced", true);
    runner.assert(
        classBox1.hasClass("forced") === true,
        "toggleClass(token, true) forces class presence"
    );

    classBox1.toggleClass("forced", false);
    runner.assert(
        classBox1.hasClass("forced") === false,
        "toggleClass(token, false) forces class removal"
    );

    const classNames = classMulti.getClassName();
    runner.assert(
        Array.isArray(classNames) === true && classNames.length === 2,
        "getClassName() returns array of class names matching elements count"
    );

    // -------------------------------------------------------------------------
    // GROUP 7: Content Getter & Setter Safety
    // -------------------------------------------------------------------------
    runner.group("7. Content Getter & Setter Safety (text, html)");

    resetFixture();
    const contentBox = dom.create("div");

    contentBox.text("Safe Text Content");
    runner.assert(
        contentBox.get(0).textContent === "Safe Text Content",
        "text(value) sets element textContent"
    );

    const texts = contentBox.text();
    runner.assert(
        texts[0] === "Safe Text Content",
        "text() returns array of textContent strings"
    );

    runner.assert(
        contentBox.text(12345) === contentBox
        && contentBox.get(0).textContent === "Safe Text Content",
        "text(nonString) returns api without mutating content"
    );

    contentBox.text("");
    runner.assert(
        contentBox.get(0).textContent === "",
        "text('') clears text content"
    );

    contentBox.html("<span>Nested Span</span>");
    runner.assert(
        contentBox.get(0).children.length === 1,
        "html(value) sets element innerHTML"
    );

    const htmls = contentBox.html();
    runner.assert(
        htmls[0] === "<span>Nested Span</span>",
        "html() returns array of innerHTML strings"
    );

    runner.assert(
        contentBox.html(12345) === contentBox
        && contentBox.get(0).children.length === 1,
        "html(nonString) returns api without mutating HTML"
    );

    contentBox.html("");
    runner.assert(
        contentBox.get(0).children.length === 0,
        "html('') clears inner HTML"
    );

    // -------------------------------------------------------------------------
    // GROUP 8: Scoped DOM Traversal & Deduplication
    // -------------------------------------------------------------------------
    runner.group("8. Scoped DOM Traversal & Deduplication");

    resetFixture();
    const parentDiv = document.createElement("div");
    const child1 = document.createElement("span");
    child1.className = "item";
    const child2 = document.createElement("span");
    child2.className = "item";
    const child3 = document.createElement("span");

    parentDiv.appendChild(child1);
    parentDiv.appendChild(child2);
    parentDiv.appendChild(child3);
    fixture.appendChild(parentDiv);

    const parentDom = dom(parentDiv);
    const childrenDom = parentDom.children();
    runner.assert(
        childrenDom.length() === 3,
        "children() returns wrapper with all child elements"
    );

    const child1Dom = dom(child1);
    const nextDom = child1Dom.next();
    runner.assert(
        nextDom.get(0) === child2,
        "next() returns next sibling element"
    );

    const child3Dom = dom(child3);
    runner.assert(
        child3Dom.next().length() === 0,
        "next() when no next sibling exists returns empty wrapper"
    );

    const child2Dom = dom(child2);
    const prevDom = child2Dom.prev();
    runner.assert(
        prevDom.get(0) === child1,
        "prev() returns previous sibling element"
    );

    runner.assert(
        child1Dom.prev().length() === 0,
        "prev() when no previous sibling exists returns empty wrapper"
    );

    const parentResult = child1Dom.parents();
    runner.assert(
        parentResult.get(0) === parentDiv,
        "parents() returns parent element wrapper"
    );

    const detachedNode = dom(document.createElement("div"));
    runner.assert(
        detachedNode.parents().length() === 0,
        "parents() on detached node returns empty wrapper"
    );

    const siblingsDom = child2Dom.siblings();
    runner.assert(
        siblingsDom.length() === 2
        && siblingsDom.get(0) === child1,
        "siblings() returns all child siblings excluding target self"
    );

    runner.assert(
        detachedNode.siblings().length() === 0,
        "siblings() on detached node returns empty wrapper"
    );

    const selectedSub = parentDom.select(".item");
    runner.assert(
        selectedSub.length() === 1,
        "select() returns first matching scoped descendant"
    );

    runner.assert(
        parentDom.select(123) === parentDom,
        "select() with non-string token returns api"
    );

    const selectedAllSub = parentDom.selectAll(".item");
    runner.assert(
        selectedAllSub.length() === 2,
        "selectAll() returns all matching scoped descendants"
    );

    runner.assert(
        parentDom.selectAll(123) === parentDom,
        "selectAll() with non-string token returns api"
    );

    // -------------------------------------------------------------------------
    // GROUP 9: DOM Manipulation & Clone Modes
    // -------------------------------------------------------------------------
    runner.group("9. DOM Manipulation & Clone Modes (clone, remove)");

    resetFixture();
    const styleBox = dom.create("div");
    styleBox.get(0).appendChild(document.createElement("p"));
    fixture.appendChild(styleBox.get(0));

    const deepClone = styleBox.clone(true);
    runner.assert(
        deepClone.get(0).children.length === 1,
        "clone(true) performs deep clone including element children"
    );

    const shallowClone = styleBox.clone(false);
    runner.assert(
        shallowClone.get(0).children.length === 0,
        "clone(false) performs shallow clone excluding element children"
    );

    styleBox.remove();
    runner.assert(
        fixture.children.length === 0,
        "remove() detaches element from DOM parent"
    );

    const detachedRemove = dom(document.createElement("div"));
    runner.assert(
        detachedRemove.remove() === detachedRemove,
        "remove() on detached node executes safely without throwing"
    );

    // -------------------------------------------------------------------------
    // GROUP 10: Style Computation & Conversion
    // -------------------------------------------------------------------------
    runner.group("10. Style Computation & Conversion (css)");

    resetFixture();
    const cssBox = dom.create("div");
    fixture.appendChild(cssBox.get(0));

    cssBox.css("color", "rgb(255, 0, 0)");
    runner.assert(
        cssBox.get(0).style.color === "rgb(255, 0, 0)",
        "css(name, value) sets inline CSS property"
    );

    cssBox.css("font-size", "16px");
    runner.assert(
        cssBox.get(0).style.fontSize === "16px",
        "css() converts kebab-case property name to camelCase style property"
    );

    const computedStyles = cssBox.css("font-size");
    runner.assert(
        computedStyles[0] === "16px",
        "css(name) reads computed style property value"
    );

    cssBox.css("color", null);
    runner.assert(
        cssBox.get(0).style.color === "",
        "css(name, null) removes inline CSS property"
    );

    runner.assert(
        cssBox.css(123) === cssBox,
        "css() with non-string property name returns api gracefully"
    );

    // -------------------------------------------------------------------------
    // GROUP 11: Event Registration & Deregistration
    // -------------------------------------------------------------------------
    runner.group("11. Event Registration & Deregistration (on, off)");

    resetFixture();
    const btnDom = dom.create("button");
    fixture.appendChild(btnDom.get(0));

    let clickCount = 0;
    const clickHandler = function () {
        clickCount += 1;
    };

    runner.assert(
        btnDom.on(123, clickHandler) === btnDom,
        "on() with invalid event type returns api gracefully"
    );

    runner.assert(
        btnDom.on("click", "not-a-function") === btnDom,
        "on() with non-function callback returns api gracefully"
    );

    btnDom.on("click", clickHandler);
    btnDom.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        clickCount === 1,
        "on() registers event handler that executes on dispatch"
    );

    btnDom.off("click", clickHandler);
    btnDom.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        clickCount === 1,
        "off(type, fn) deregisters specific event handler"
    );

    let multiCount = 0;
    const h1 = function () {
        multiCount += 1;
    };
    const h2 = function () {
        multiCount += 10;
    };

    btnDom.on("custom", h1);
    btnDom.on("custom", h2);
    btnDom.get(0).dispatchEvent(new Event("custom"));
    runner.assert(
        multiCount === 11,
        "Multiple event handlers register and fire for same event type"
    );

    btnDom.off("custom");
    btnDom.get(0).dispatchEvent(new Event("custom"));
    runner.assert(
        multiCount === 11,
        "off(type) removes all event handlers for specific event type"
    );

    btnDom.on("custom", h1);
    btnDom.off();
    btnDom.get(0).dispatchEvent(new Event("custom"));
    runner.assert(
        multiCount === 11,
        "off() with no arguments removes all event handlers across all types"
    );

    // -------------------------------------------------------------------------
    // GROUP 12: One-Time Events & Batch Processing
    // -------------------------------------------------------------------------
    runner.group("12. One-Time Events & Batch Processing (once)");

    resetFixture();
    const b1 = dom.create("button");
    const b2 = dom.create("button");
    const btnGroup = b1.addItem(b2);
    fixture.appendChild(b1.get(0));
    fixture.appendChild(b2.get(0));

    let batchCount = 0;
    btnGroup.on("click", function () {
        batchCount += 1;
    });

    b1.get(0).dispatchEvent(new Event("click"));
    b2.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        batchCount === 2,
        "on() registers handlers across all elements in multi-element wrapper"
    );

    let onceCount = 0;
    b1.once("click", function () {
        onceCount += 1;
    });

    b1.get(0).dispatchEvent(new Event("click"));
    b1.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        onceCount === 1,
        "once() executes handler exactly once and auto-deregisters"
    );

    runner.renderSummary(startTime);
}

runAllTests();

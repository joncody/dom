import dom from "../../../src/dom.js";

function create_test_runner() {
    const results_container = document.getElementById("test-results");
    const summary_container = document.getElementById("summary");

    let current_group_body = null;
    let failed_assertions = 0;
    let passed_assertions = 0;
    let total_assertions = 0;

    function group(title) {
        if (current_group_body !== null) {
            console.groupEnd();
        }
        console.group(title);

        const group_el = document.createElement("div");
        const header_el = document.createElement("div");

        group_el.className = "test-group";
        header_el.className = "group-header";
        header_el.textContent = title;

        current_group_body = document.createElement("div");
        current_group_body.className = "group-body";

        group_el.appendChild(header_el);
        group_el.appendChild(current_group_body);
        results_container.appendChild(group_el);
    }

    function assert(condition, message) {
        total_assertions += 1;
        const entry = document.createElement("div");

        if (condition === true) {
            passed_assertions += 1;
            entry.className = "log-entry pass";
            entry.textContent = "[PASS] " + message;
            console.log("[PASS] " + message);
        } else {
            failed_assertions += 1;
            entry.className = "log-entry fail";
            entry.textContent = "[FAIL] " + message;
            console.error("[FAIL] " + message);
        }

        if (current_group_body !== null) {
            current_group_body.appendChild(entry);
        }
    }

    function assert_throws(fn, message) {
        total_assertions += 1;
        const entry = document.createElement("div");
        try {
            fn();
            failed_assertions += 1;
            entry.className = "log-entry fail";
            entry.textContent = "[FAIL] " + message + " (Did not throw)";
            console.error("[FAIL] " + message + " (Did not throw)");
        } catch (ignore) {
            passed_assertions += 1;
            entry.className = "log-entry pass";
            entry.textContent = "[PASS] " + message + " (Threw as expected)";
            console.log("[PASS] " + message + " (Threw as expected)");
        }

        if (current_group_body !== null) {
            current_group_body.appendChild(entry);
        }
    }

    function render_summary(start_time) {
        if (current_group_body !== null) {
            console.groupEnd();
        }

        const elapsed = performance.now() - start_time;
        const duration = Math.round(elapsed * 100) / 100;
        let status_class = "summary-fail";

        if (failed_assertions === 0) {
            status_class = "summary-pass";
        }

        const summary_text = (
            "Total Assertions: " +
            String(total_assertions) +
            " | Passed: " +
            String(passed_assertions) +
            " | Failed: " +
            String(failed_assertions) +
            " | Execution Time: " +
            duration +
            " ms"
        );

        console.info(summary_text);

        summary_container.innerHTML = (
            "Total Assertions: <strong>" +
            String(total_assertions) +
            "</strong> | Passed: <span class='" +
            status_class +
            "'>" +
            String(passed_assertions) +
            "</span> | Failed: <span class='" +
            status_class +
            "'>" +
            String(failed_assertions) +
            "</span> | Execution Time: <strong>" +
            duration +
            " ms</strong>"
        );
    }

    return Object.freeze({
        assert,
        assert_throws,
        group,
        render_summary
    });
}

function run_all_tests() {
    const runner = create_test_runner();
    const start_time = performance.now();
    const fixture = document.getElementById("test-fixture");

    function reset_fixture() {
        fixture.innerHTML = "";
    }

    // -------------------------------------------------------------------------
    // GROUP 1: Factory Instantiation & Selector Resolution
    // -------------------------------------------------------------------------
    runner.group("1. Factory Instantiation & Selector Resolution");

    reset_fixture();
    const element = document.createElement("div");
    element.id = "target-node";
    fixture.appendChild(element);

    const selector_wrapper = dom("#target-node");
    runner.assert(
        selector_wrapper.length() === 1,
        "CSS selector string '#target-node' resolves to 1 element"
    );

    const node_wrapper = dom(element);
    runner.assert(
        node_wrapper.length() === 1,
        "Direct DOM element reference wraps successfully"
    );

    const wrapped_copy = dom(selector_wrapper);
    runner.assert(
        wrapped_copy.length() === 1,
        "Wrapping existing dom() instance extracts elements correctly"
    );

    const node_list = dom(document.querySelectorAll("#target-node"));
    runner.assert(
        node_list.length() === 1,
        "Wrapping a NodeList resolves elements correctly"
    );

    const collection_wrapper = dom(fixture.children);
    runner.assert(
        collection_wrapper.length() === 1,
        "Wrapping an HTMLCollection resolves elements correctly"
    );

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement("span"));
    fragment.appendChild(document.createElement("span"));
    const fragment_wrapper = dom(fragment);
    runner.assert(
        fragment_wrapper.length() === 2,
        "DocumentFragment expands into its element children"
    );

    const mixed_array = dom([element, "not-a-node", 123]);
    runner.assert(
        mixed_array.length() === 0,
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

    const created_div = dom.create("DIV");
    runner.assert(
        created_div.length() === 1 && created_div.get(0).tagName === "DIV",
        "dom.create('DIV') handles uppercase tags and creates valid element"
    );

    const invalid_tag = dom.create("invalid-custom-tag-12345");
    runner.assert(
        invalid_tag.length() === 0,
        "dom.create() with un-whitelisted tag returns empty wrapper"
    );

    runner.assert(
        dom.create(null).length() === 0 && dom.create("").length() === 0,
        "dom.create() with null or empty string returns empty wrapper"
    );

    // -------------------------------------------------------------------------
    // GROUP 2: Encapsulation & Immutability
    // -------------------------------------------------------------------------
    runner.group("2. Encapsulation & Immutability");

    const sample_dom = dom("#target-node");
    runner.assert(
        Object.isFrozen(sample_dom) === true,
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

    runner.assert_throws(function () {
        sample_dom.length = 999;
    }, "Mutating frozen API property fails in strict mode");

    runner.assert_throws(function () {
        sample_dom.customProp = true;
    }, "Adding property to frozen API object fails in strict mode");

    runner.assert(
        sample_dom.elements === undefined,
        "Internal elements array is encapsulated via closure"
    );

    // -------------------------------------------------------------------------
    // GROUP 3: Core Inspection & Copy Methods
    // -------------------------------------------------------------------------
    runner.group("3. Core Inspection & Copy Methods (length, get, each)");

    reset_fixture();
    const el1 = document.createElement("span");
    const el2 = document.createElement("span");
    fixture.appendChild(el1);
    fixture.appendChild(el2);

    const span_wrapper = dom("span");
    runner.assert(
        span_wrapper.length() === 2,
        "length() returns exact count of matched elements"
    );

    runner.assert(
        span_wrapper.get(0) === el1 && span_wrapper.get(1) === el2,
        "get(index) returns element at valid index"
    );

    const all_get = span_wrapper.get();
    runner.assert(
        Array.isArray(all_get) === true && all_get.length === 2,
        "get() without arguments returns Array copy of all elements"
    );

    all_get.push(document.createElement("p"));
    runner.assert(
        span_wrapper.length() === 2,
        "Mutating array returned by get() does not alter internal state"
    );

    const out_of_bounds = span_wrapper.get(999);
    runner.assert(
        out_of_bounds === null,
        "get() with out-of-bounds index returns null"
    );

    const negative_get = span_wrapper.get(-1);
    runner.assert(
        negative_get === null,
        "get() with negative index returns null"
    );

    let count = 0;
    const chained = span_wrapper.each(function (el, index) {
        count += 1;
        runner.assert(
            typeof index === "number" &&
            el !== null &&
            typeof el.nodeType === "number",
            "each() callback receives element and numeric index"
        );
    });

    runner.assert(
        count === 2,
        "each() iterates over all elements in collection"
    );

    runner.assert(
        chained === span_wrapper,
        "each() returns api instance for method chaining"
    );

    runner.assert(
        span_wrapper.each(null) === span_wrapper,
        "each() with non-function returns api instance gracefully"
    );

    // -------------------------------------------------------------------------
    // GROUP 4: Collection Management
    // -------------------------------------------------------------------------
    runner.group("4. Collection Management (addItem, removeItem)");

    reset_fixture();
    const item_a = document.createElement("p");
    const item_b = document.createElement("p");
    const item_c = document.createElement("p");

    const coll = dom(item_a);
    runner.assert(coll.length() === 1, "Initial collection length is 1");

    coll.addItem(item_b);
    runner.assert(
        coll.length() === 2,
        "addItem() with Node increases length to 2"
    );

    coll.addItem([item_c]);
    runner.assert(
        coll.length() === 3,
        "addItem() with Array increases length to 3"
    );

    coll.removeItem(1);
    runner.assert(
        coll.length() === 2 && coll.get(1) === item_c,
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

    reset_fixture();
    const attr_box = dom.create("div");
    fixture.appendChild(attr_box.get(0));

    attr_box.attr("id", "box-1");
    runner.assert(
        attr_box.get(0).getAttribute("id") === "box-1",
        "attr(name, value) sets element attribute"
    );

    const attr_values = attr_box.attr("id");
    runner.assert(
        attr_values[0] === "box-1",
        "attr(name) returns array of attribute values"
    );

    attr_box.attr("id", null);
    runner.assert(
        attr_box.get(0).hasAttribute("id") === false,
        "attr(name, null) removes attribute from element"
    );

    runner.assert(
        attr_box.attr(123) === attr_box,
        "attr() with non-string attribute name returns api gracefully"
    );

    attr_box.data("role", "admin");
    runner.assert(
        attr_box.get(0).dataset.role === "admin",
        "data(name, value) sets dataset property"
    );

    const data_values = attr_box.data("role");
    runner.assert(
        data_values[0] === "admin",
        "data(name) returns array of dataset values"
    );

    attr_box.data("role", null);
    runner.assert(
        attr_box.get(0).dataset.role === undefined,
        "data(name, null) deletes dataset property"
    );

    runner.assert(
        attr_box.data(123) === attr_box,
        "data() with non-string dataset name returns api gracefully"
    );

    // -------------------------------------------------------------------------
    // GROUP 6: Class Name Manipulation & Predicates
    // -------------------------------------------------------------------------
    runner.group("6. Class Name Manipulation & Predicates");

    reset_fixture();
    const class_box_1 = dom.create("div");
    const class_box_2 = dom.create("div");
    const class_multi = class_box_1.addItem(class_box_2);

    class_multi.addClass("card active");
    runner.assert(
        class_box_1.hasClass("card") === true &&
        class_box_2.hasClass("card") === true,
        "addClass() adds multiple space-separated classes to all elements"
    );

    runner.assert(
        class_multi.hasClass("card") === true,
        "hasClass() returns true when ALL elements contain class"
    );

    class_box_2.removeClass("card");
    runner.assert(
        class_multi.hasClass("card") === false,
        "hasClass() returns false when ANY element lacks class"
    );

    runner.assert(
        class_multi.hasClass("") === false &&
        class_multi.hasClass(123) === false,
        "hasClass() with invalid tokens returns false"
    );

    class_box_1.toggleClass("highlight");
    runner.assert(
        class_box_1.hasClass("highlight") === true,
        "toggleClass() toggles class on"
    );

    class_box_1.toggleClass("highlight");
    runner.assert(
        class_box_1.hasClass("highlight") === false,
        "toggleClass() toggles class off"
    );

    class_box_1.toggleClass("forced", true);
    runner.assert(
        class_box_1.hasClass("forced") === true,
        "toggleClass(token, true) forces class presence"
    );

    class_box_1.toggleClass("forced", false);
    runner.assert(
        class_box_1.hasClass("forced") === false,
        "toggleClass(token, false) forces class removal"
    );

    const class_names = class_multi.getClassName();
    runner.assert(
        Array.isArray(class_names) === true && class_names.length === 2,
        "getClassName() returns array of class names matching elements count"
    );

    // -------------------------------------------------------------------------
    // GROUP 7: Content Getter & Setter Safety
    // -------------------------------------------------------------------------
    runner.group("7. Content Getter & Setter Safety (text, html)");

    reset_fixture();
    const content_box = dom.create("div");

    content_box.text("Safe Text Content");
    runner.assert(
        content_box.get(0).textContent === "Safe Text Content",
        "text(value) sets element textContent"
    );

    const texts = content_box.text();
    runner.assert(
        texts[0] === "Safe Text Content",
        "text() returns array of textContent strings"
    );

    runner.assert(
        content_box.text(12345) === content_box &&
        content_box.get(0).textContent === "Safe Text Content",
        "text(nonString) returns api without mutating content"
    );

    content_box.text("");
    runner.assert(
        content_box.get(0).textContent === "",
        "text('') clears text content"
    );

    content_box.html("<span>Nested Span</span>");
    runner.assert(
        content_box.get(0).children.length === 1,
        "html(value) sets element innerHTML"
    );

    const htmls = content_box.html();
    runner.assert(
        htmls[0] === "<span>Nested Span</span>",
        "html() returns array of innerHTML strings"
    );

    runner.assert(
        content_box.html(12345) === content_box &&
        content_box.get(0).children.length === 1,
        "html(nonString) returns api without mutating HTML"
    );

    content_box.html("");
    runner.assert(
        content_box.get(0).children.length === 0,
        "html('') clears inner HTML"
    );

    // -------------------------------------------------------------------------
    // GROUP 8: Scoped DOM Traversal & Deduplication
    // -------------------------------------------------------------------------
    runner.group("8. Scoped DOM Traversal & Deduplication");

    reset_fixture();
    const parent_div = document.createElement("div");
    const child_1 = document.createElement("span");
    child_1.className = "item";
    const child_2 = document.createElement("span");
    child_2.className = "item";
    const child_3 = document.createElement("span");

    parent_div.appendChild(child_1);
    parent_div.appendChild(child_2);
    parent_div.appendChild(child_3);
    fixture.appendChild(parent_div);

    const parent_dom = dom(parent_div);
    const children_dom = parent_dom.children();
    runner.assert(
        children_dom.length() === 3,
        "children() returns wrapper with all child elements"
    );

    const child_1_dom = dom(child_1);
    const next_dom = child_1_dom.next();
    runner.assert(
        next_dom.get(0) === child_2,
        "next() returns next sibling element"
    );

    const child_3_dom = dom(child_3);
    runner.assert(
        child_3_dom.next().length() === 0,
        "next() when no next sibling exists returns empty wrapper"
    );

    const child_2_dom = dom(child_2);
    const prev_dom = child_2_dom.prev();
    runner.assert(
        prev_dom.get(0) === child_1,
        "prev() returns previous sibling element"
    );

    runner.assert(
        child_1_dom.prev().length() === 0,
        "prev() when no previous sibling exists returns empty wrapper"
    );

    const parent_result = child_1_dom.parents();
    runner.assert(
        parent_result.get(0) === parent_div,
        "parents() returns parent element wrapper"
    );

    const detached_node = dom(document.createElement("div"));
    runner.assert(
        detached_node.parents().length() === 0,
        "parents() on detached node returns empty wrapper"
    );

    const siblings_dom = child_2_dom.siblings();
    runner.assert(
        siblings_dom.length() === 2 && siblings_dom.get(0) === child_1,
        "siblings() returns all child siblings excluding target self"
    );

    runner.assert(
        detached_node.siblings().length() === 0,
        "siblings() on detached node returns empty wrapper"
    );

    const selected_sub = parent_dom.select(".item");
    runner.assert(
        selected_sub.length() === 1,
        "select() returns first matching scoped descendant"
    );

    runner.assert(
        parent_dom.select(123) === parent_dom,
        "select() with non-string token returns api"
    );

    const selected_all_sub = parent_dom.selectAll(".item");
    runner.assert(
        selected_all_sub.length() === 2,
        "selectAll() returns all matching scoped descendants"
    );

    runner.assert(
        parent_dom.selectAll(123) === parent_dom,
        "selectAll() with non-string token returns api"
    );

    // -------------------------------------------------------------------------
    // GROUP 9: DOM Manipulation & Clone Modes
    // -------------------------------------------------------------------------
    runner.group("9. DOM Manipulation & Clone Modes (clone, remove)");

    reset_fixture();
    const style_box = dom.create("div");
    style_box.get(0).appendChild(document.createElement("p"));
    fixture.appendChild(style_box.get(0));

    const deep_clone = style_box.clone(true);
    runner.assert(
        deep_clone.get(0).children.length === 1,
        "clone(true) performs deep clone including element children"
    );

    const shallow_clone = style_box.clone(false);
    runner.assert(
        shallow_clone.get(0).children.length === 0,
        "clone(false) performs shallow clone excluding element children"
    );

    style_box.remove();
    runner.assert(
        fixture.children.length === 0,
        "remove() detaches element from DOM parent"
    );

    const detached_remove = dom(document.createElement("div"));
    runner.assert(
        detached_remove.remove() === detached_remove,
        "remove() on detached node executes safely without throwing"
    );

    // -------------------------------------------------------------------------
    // GROUP 10: Style Computation & Conversion
    // -------------------------------------------------------------------------
    runner.group("10. Style Computation & Conversion (css)");

    reset_fixture();
    const css_box = dom.create("div");
    fixture.appendChild(css_box.get(0));

    css_box.css("color", "rgb(255, 0, 0)");
    runner.assert(
        css_box.get(0).style.color === "rgb(255, 0, 0)",
        "css(name, value) sets inline CSS property"
    );

    css_box.css("font-size", "16px");
    runner.assert(
        css_box.get(0).style.fontSize === "16px",
        "css() converts kebab-case property name to camelCase style property"
    );

    const computed_styles = css_box.css("font-size");
    runner.assert(
        computed_styles[0] === "16px",
        "css(name) reads computed style property value"
    );

    css_box.css("color", null);
    runner.assert(
        css_box.get(0).style.color === "",
        "css(name, null) removes inline CSS property"
    );

    runner.assert(
        css_box.css(123) === css_box,
        "css() with non-string property name returns api gracefully"
    );

    // -------------------------------------------------------------------------
    // GROUP 11: Event Registration & Deregistration
    // -------------------------------------------------------------------------
    runner.group("11. Event Registration & Deregistration (on, off)");

    reset_fixture();
    const btn_dom = dom.create("button");
    fixture.appendChild(btn_dom.get(0));

    let click_count = 0;
    function click_handler() {
        click_count += 1;
    }

    runner.assert(
        btn_dom.on(123, click_handler) === btn_dom,
        "on() with invalid event type returns api gracefully"
    );

    runner.assert(
        btn_dom.on("click", "not-a-function") === btn_dom,
        "on() with non-function callback returns api gracefully"
    );

    btn_dom.on("click", click_handler);
    btn_dom.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        click_count === 1,
        "on() registers event handler that executes on dispatch"
    );

    btn_dom.off("click", click_handler);
    btn_dom.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        click_count === 1,
        "off(type, fn) deregisters specific event handler"
    );

    let multi_count = 0;
    function h1() {
        multi_count += 1;
    }
    function h2() {
        multi_count += 10;
    }

    btn_dom.on("custom", h1);
    btn_dom.on("custom", h2);
    btn_dom.get(0).dispatchEvent(new Event("custom"));
    runner.assert(
        multi_count === 11,
        "Multiple event handlers register and fire for same event type"
    );

    btn_dom.off("custom");
    btn_dom.get(0).dispatchEvent(new Event("custom"));
    runner.assert(
        multi_count === 11,
        "off(type) removes all event handlers for specific event type"
    );

    btn_dom.on("custom", h1);
    btn_dom.off();
    btn_dom.get(0).dispatchEvent(new Event("custom"));
    runner.assert(
        multi_count === 11,
        "off() with no arguments removes all event handlers across all types"
    );

    // -------------------------------------------------------------------------
    // GROUP 12: One-Time Events & Batch Processing
    // -------------------------------------------------------------------------
    runner.group("12. One-Time Events & Batch Processing (once)");

    reset_fixture();
    const b1 = dom.create("button");
    const b2 = dom.create("button");
    const btn_group = b1.addItem(b2);
    fixture.appendChild(b1.get(0));
    fixture.appendChild(b2.get(0));

    let batch_count = 0;
    btn_group.on("click", function () {
        batch_count += 1;
    });

    b1.get(0).dispatchEvent(new Event("click"));
    b2.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        batch_count === 2,
        "on() registers handlers across all elements in multi-element wrapper"
    );

    let once_count = 0;
    b1.once("click", function () {
        once_count += 1;
    });

    b1.get(0).dispatchEvent(new Event("click"));
    b1.get(0).dispatchEvent(new Event("click"));
    runner.assert(
        once_count === 1,
        "once() executes handler exactly once and auto-deregisters"
    );

    runner.render_summary(start_time);
}

run_all_tests();

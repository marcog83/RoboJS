/**
 * Created by marco.gobbi on 21/01/2015.
 */

import EventDispatcher from "../core/events/event-dispatcher";


export default  function () {

    var REGISTERED_ELEMENTS = {};

    function create(id) {
        return function (Mediator) {
            var customProto = Mediator();
            var proto = Object.assign(Object.create(HTMLElement.prototype), customProto, {dispatcher: EventDispatcher});
            document.registerElement(id, {prototype: proto});
            return true;

        }
    }


    function findMediators(definitions, loader) {
        return function (node) {
            var id = node.tagName.toLowerCase();
            if (REGISTERED_ELEMENTS[id]) {
                return Promise.resolve(true)
            } else {
                REGISTERED_ELEMENTS[id] = true;
                return loader.load(definitions[id]).then(create(id));
            }

        }
    }

    function hasMediator(definitions) {
        return function (node) {
            var id = node.tagName.toLowerCase();
            return (definitions[id] && !REGISTERED_ELEMENTS[id])
        }
    }

//w3c all tags
    var KE = ["abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "command", "datalist", "dd", "del", "details", "dfn", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "map", "mark", "menu", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var", "video", "wbr"];
    var query = KE.map(e=>":not(" + e + ")").reduce((prev, curr)=>prev + curr, "*");

    function getAllElements(node) {
        return [node].concat([].slice.call(node.querySelectorAll(query), 0));
        //return [node].concat([].slice.call(node.getElementsByTagName("*"), 0));
    }


    return Object.freeze({
        destroy: _ =>true,
        findMediators,
        hasMediator,
        getAllElements
        , dispose: _=>_

    })
};
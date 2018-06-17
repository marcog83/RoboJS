/**
 * Created by marcogobbi on 07/05/2017.
 */
 
import Handler from "../../core/display/Handler";

const KE = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1 ", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "main", "map", "mark", "menu", "menuitem", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"];
const query = KE.map(e => ":not(" + e + ")").reduce((prev, curr) => prev + curr, "*");


export default class CustomElementHandler extends Handler {
    REGISTERED_ELEMENTS:Object;
    definitions:Object;
    dispatcher:EventTarget;

    constructor(params) {
        super(params);
        this.REGISTERED_ELEMENTS = {};

    }

    updateCache(id) {
        this.REGISTERED_ELEMENTS[id] = true;
        return this.REGISTERED_ELEMENTS;
    }

    inCache(id) {
        return !!this.REGISTERED_ELEMENTS[id];
    }

    getDefinition(node) {
        return this.definitions[node.tagName.toLowerCase()];
    }

    create(node, Mediator) {
        let tagName = "";
        let dispatcher = this.dispatcher;
        if (!this.inCache(node.tagName.toLowerCase())) {
            tagName = node.tagName.toLowerCase();
            if (!tagName.match(/-/gim)) {
                throw new Error("The name of a custom element must contain a dash (-). So <x-tags>, <my-element>, and <my-awesome-app> are all valid names, while <tabs> and <foo_bar> are not.");
            }
            window.customElements.define(tagName, class extends Mediator {
                constructor() {
                    super(dispatcher);
                }
            });

            this.updateCache(tagName);
        }
        return tagName;
    }

    hasMediator(node) {
        let id = node.tagName.toLowerCase();
        return !!this.getDefinition(node) && !this.inCache(id);
    }

    getAllElements(node) {
        return [node].concat([].slice.call(node.querySelectorAll(query), 0));
    }

    dispose() {
    }

    destroy() {
    }
}

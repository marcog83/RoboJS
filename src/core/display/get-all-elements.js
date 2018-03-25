/**
 *
 * @param node {HTMLElement}
 * @return {Array}
 */
export default function (node) {


    const nodes = [].slice.call(node.querySelectorAll("[data-mediator]"), 0);
    if (node.getAttribute("data-mediator")) {
        nodes.unshift(node);
    }
    return nodes;
}
/**
 * Created by marcogobbi on 01/04/2017.
 */

export default function ( node) {
    var result=[];
    if(!!node.getAttribute("data-mediator")){
        result.push(node);
    }
    return result.concat(Array.from(node.querySelectorAll("[data-mediator]")));
}
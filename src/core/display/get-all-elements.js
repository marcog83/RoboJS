/**
 * Created by marcogobbi on 01/04/2017.
 */
//import map from "../../internal/_map"
//function identity(x){return x;}
export default function (node) {
    //  var hrstart = process.hrtime();


    //  var nodes=map(identity,node.querySelectorAll("[data-mediator]"));
    var nodes = [].slice.call(node.querySelectorAll("[data-mediator]"), 0);
    if (!!node.getAttribute("data-mediator")) {
        nodes.unshift(node);
    }
    // var hrend = process.hrtime(hrstart);
    //  console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
    return nodes;
}
import _isArray from "./_isArray";

function _isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
}

export default function (x) {
    const isArray = Array.isArray || _isArray;
    if (!x) {
        return false;
    }
    if (isArray(x)) {
        return true;
    }

    if ("object" !== typeof x) {

        return false;
    }
    if (_isString(x)) {
        return false;
    }
    if (x.nodeType === 1) {
        return !!x.length;
    }
    if (x.length === 0) {
        return true;
    }
    if (x.length > 0) {
        return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
    }
    return false;
}
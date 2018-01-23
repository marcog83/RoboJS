function _isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
};
export default function (x) {
    let result = false;
    if (Array.isArray(x)) {
        result = true;
    }
    if (!x) {
        result = false;
    }
    if (typeof x !== 'object') {
        result = false;
    }
    if (_isString(x)) {
        result = false;
    }
    if (x.nodeType === 1) {
        result = !!x.length;
    }
    if (x.length === 0) {
        result = true;
    }
    if (x.length > 0) {
        result = x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
    }
    return result;
}
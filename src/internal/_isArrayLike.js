function _isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
};
const _isArray = Array.isArray || function (val) {
    return (val != null &&
        val.length >= 0 &&
        Object.prototype.toString.call(val) === '[object Array]');
};
export default function (x) {

    if (_isArray(x)) {
        return true;
    }
    if (!x) {
        return false;
    }
    if (typeof x !== 'object') {
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
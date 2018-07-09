const _root = (typeof self === "object" && self.self === self && self) ||
    (typeof global === "object" && global.global === global && global) || window || self;

export default _root;
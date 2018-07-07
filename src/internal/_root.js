const _root = (typeof self === "object" && self.self === self && self) ||
    (typeof global === "object" && global.global === global && global) || self;

export default _root;
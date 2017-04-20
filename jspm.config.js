SystemJS.config({
  paths: {
    "npm:": "jspm_packages/npm/",
    "robojs/": "src/"
  },
  browserConfig: {
    "baseURL": "/"
  },
  transpiler: "plugin-babel",
  packages: {
    "robojs": {
      "main": "robojs.js",
      "meta": {
        "*.js": {
          "loader": "plugin-babel"
        }
      }
    }
  },
  map: {
    "plugin-babel": "npm:systemjs-plugin-babel@0.0.21"
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json"
  ],
  map: {
    "assert": "npm:jspm-nodelibs-assert@0.2.1",

    "buffer": "npm:jspm-nodelibs-buffer@0.2.3",
    "constants": "npm:jspm-nodelibs-constants@0.2.1",
    "crypto": "npm:jspm-nodelibs-crypto@0.2.1",
    "events": "npm:jspm-nodelibs-events@0.2.2",
    "fs": "npm:jspm-nodelibs-fs@0.2.1",
    "os": "npm:jspm-nodelibs-os@0.2.1",
    "path": "npm:jspm-nodelibs-path@0.2.3",
    "process": "npm:jspm-nodelibs-process@0.2.1",
    "stream": "npm:jspm-nodelibs-stream@0.2.1",
    "string_decoder": "npm:jspm-nodelibs-string_decoder@0.2.1",
    "util": "npm:jspm-nodelibs-util@0.2.2",
    "vm": "npm:jspm-nodelibs-vm@0.2.1"
  },
  packages: {

    "npm:babel-preset-es2015@6.24.1": {
      "map": {
        "babel-plugin-transform-es2015-block-scoping": "npm:babel-plugin-transform-es2015-block-scoping@6.24.1",
        "babel-plugin-transform-es2015-arrow-functions": "npm:babel-plugin-transform-es2015-arrow-functions@6.22.0",
        "babel-plugin-transform-es2015-modules-commonjs": "npm:babel-plugin-transform-es2015-modules-commonjs@6.24.1",
        "babel-plugin-transform-es2015-duplicate-keys": "npm:babel-plugin-transform-es2015-duplicate-keys@6.24.1",
        "babel-plugin-transform-es2015-destructuring": "npm:babel-plugin-transform-es2015-destructuring@6.23.0",
        "babel-plugin-check-es2015-constants": "npm:babel-plugin-check-es2015-constants@6.22.0",
        "babel-plugin-transform-es2015-block-scoped-functions": "npm:babel-plugin-transform-es2015-block-scoped-functions@6.22.0",
        "babel-plugin-transform-es2015-classes": "npm:babel-plugin-transform-es2015-classes@6.24.1",
        "babel-plugin-transform-es2015-shorthand-properties": "npm:babel-plugin-transform-es2015-shorthand-properties@6.24.1",
        "babel-plugin-transform-es2015-modules-amd": "npm:babel-plugin-transform-es2015-modules-amd@6.24.1",
        "babel-plugin-transform-es2015-object-super": "npm:babel-plugin-transform-es2015-object-super@6.24.1",
        "babel-plugin-transform-es2015-modules-systemjs": "npm:babel-plugin-transform-es2015-modules-systemjs@6.24.1",
        "babel-plugin-transform-es2015-unicode-regex": "npm:babel-plugin-transform-es2015-unicode-regex@6.24.1",
        "babel-plugin-transform-es2015-spread": "npm:babel-plugin-transform-es2015-spread@6.22.0",
        "babel-plugin-transform-es2015-for-of": "npm:babel-plugin-transform-es2015-for-of@6.23.0",
        "babel-plugin-transform-es2015-computed-properties": "npm:babel-plugin-transform-es2015-computed-properties@6.24.1",
        "babel-plugin-transform-es2015-function-name": "npm:babel-plugin-transform-es2015-function-name@6.24.1",
        "babel-plugin-transform-es2015-sticky-regex": "npm:babel-plugin-transform-es2015-sticky-regex@6.24.1",
        "babel-plugin-transform-es2015-typeof-symbol": "npm:babel-plugin-transform-es2015-typeof-symbol@6.23.0",
        "babel-plugin-transform-es2015-literals": "npm:babel-plugin-transform-es2015-literals@6.22.0",
        "babel-plugin-transform-es2015-modules-umd": "npm:babel-plugin-transform-es2015-modules-umd@6.24.1",
        "babel-plugin-transform-es2015-template-literals": "npm:babel-plugin-transform-es2015-template-literals@6.22.0",
        "babel-plugin-transform-regenerator": "npm:babel-plugin-transform-regenerator@6.24.1",
        "babel-plugin-transform-es2015-parameters": "npm:babel-plugin-transform-es2015-parameters@6.24.1"
      }
    },
    "npm:babel-preset-es2017@6.24.1": {
      "map": {
        "babel-plugin-syntax-trailing-function-commas": "npm:babel-plugin-syntax-trailing-function-commas@6.22.0",
        "babel-plugin-transform-async-to-generator": "npm:babel-plugin-transform-async-to-generator@6.24.1"
      }
    },
    "npm:babel-preset-es2016@6.24.1": {
      "map": {
        "babel-plugin-transform-exponentiation-operator": "npm:babel-plugin-transform-exponentiation-operator@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-modules-amd@6.24.1": {
      "map": {
        "babel-plugin-transform-es2015-modules-commonjs": "npm:babel-plugin-transform-es2015-modules-commonjs@6.24.1",
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-block-scoping@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-types": "npm:babel-types@6.24.1",
        "lodash": "npm:lodash@4.17.4"
      }
    },
    "npm:babel-plugin-transform-es2015-arrow-functions@6.22.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-modules-commonjs@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-plugin-transform-strict-mode": "npm:babel-plugin-transform-strict-mode@6.24.1",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-duplicate-keys@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-plugin-check-es2015-constants@6.22.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-destructuring@6.23.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-block-scoped-functions@6.22.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-classes@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-optimise-call-expression": "npm:babel-helper-optimise-call-expression@6.24.1",
        "babel-helper-replace-supers": "npm:babel-helper-replace-supers@6.24.1",
        "babel-helper-function-name": "npm:babel-helper-function-name@6.24.1",
        "babel-helper-define-map": "npm:babel-helper-define-map@6.24.1",
        "babel-messages": "npm:babel-messages@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-shorthand-properties@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-object-super@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-helper-replace-supers": "npm:babel-helper-replace-supers@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-modules-systemjs@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-helper-hoist-variables": "npm:babel-helper-hoist-variables@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-computed-properties@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-spread@6.22.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-unicode-regex@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-helper-regex": "npm:babel-helper-regex@6.24.1",
        "regexpu-core": "npm:regexpu-core@2.0.0"
      }
    },
    "npm:babel-plugin-transform-es2015-function-name@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-function-name": "npm:babel-helper-function-name@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-sticky-regex@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-regex": "npm:babel-helper-regex@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-for-of@6.23.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-typeof-symbol@6.23.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-literals@6.22.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-async-to-generator@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-plugin-syntax-async-functions": "npm:babel-plugin-syntax-async-functions@6.13.0",
        "babel-helper-remap-async-to-generator": "npm:babel-helper-remap-async-to-generator@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-modules-umd@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-plugin-transform-es2015-modules-amd": "npm:babel-plugin-transform-es2015-modules-amd@6.24.1",
        "babel-template": "npm:babel-template@6.24.1"
      }
    },
    "npm:babel-plugin-transform-exponentiation-operator@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-plugin-syntax-exponentiation-operator": "npm:babel-plugin-syntax-exponentiation-operator@6.13.0",
        "babel-helper-builder-binary-assignment-operator-visitor": "npm:babel-helper-builder-binary-assignment-operator-visitor@6.24.1"
      }
    },
    "npm:babel-plugin-transform-es2015-template-literals@6.22.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-plugin-transform-es2015-parameters@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-call-delegate": "npm:babel-helper-call-delegate@6.24.1",
        "babel-helper-get-function-arity": "npm:babel-helper-get-function-arity@6.24.1"
      }
    },
    "npm:babel-template@6.24.1": {
      "map": {
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "lodash": "npm:lodash@4.17.4",
        "babylon": "npm:babylon@6.16.1"
      }
    },
    "npm:babel-traverse@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "lodash": "npm:lodash@4.17.4",
        "babel-messages": "npm:babel-messages@6.23.0",
        "invariant": "npm:invariant@2.2.2",
        "babel-code-frame": "npm:babel-code-frame@6.22.0",
        "globals": "npm:globals@9.17.0",
        "debug": "npm:debug@2.6.3",
        "babylon": "npm:babylon@6.16.1"
      }
    },
    "npm:babel-plugin-transform-strict-mode@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-types@6.24.1": {
      "map": {
        "lodash": "npm:lodash@4.17.4",
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "to-fast-properties": "npm:to-fast-properties@1.0.2",
        "esutils": "npm:esutils@2.0.2"
      }
    },
    "npm:babel-runtime@6.23.0": {
      "map": {
        "core-js": "npm:core-js@2.4.1",
        "regenerator-runtime": "npm:regenerator-runtime@0.10.3"
      }
    },
    "npm:babel-helper-optimise-call-expression@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-helper-replace-supers@6.24.1": {
      "map": {
        "babel-helper-optimise-call-expression": "npm:babel-helper-optimise-call-expression@6.24.1",
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-messages": "npm:babel-messages@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-helper-function-name@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-helper-get-function-arity": "npm:babel-helper-get-function-arity@6.24.1"
      }
    },
    "npm:babel-helper-define-map@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "lodash": "npm:lodash@4.17.4",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-function-name": "npm:babel-helper-function-name@6.24.1"
      }
    },
    "npm:babel-plugin-transform-regenerator@6.24.1": {
      "map": {
        "regenerator-transform": "npm:regenerator-transform@0.9.11"
      }
    },
    "npm:babel-messages@6.23.0": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0"
      }
    },
    "npm:babel-helper-regex@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "lodash": "npm:lodash@4.17.4",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-helper-builder-binary-assignment-operator-visitor@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-explode-assignable-expression": "npm:babel-helper-explode-assignable-expression@6.24.1"
      }
    },
    "npm:babel-helper-hoist-variables@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:regenerator-transform@0.9.11": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "private": "npm:private@0.1.7"
      }
    },
    "npm:babel-helper-remap-async-to-generator@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-template": "npm:babel-template@6.24.1",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-helper-function-name": "npm:babel-helper-function-name@6.24.1"
      }
    },
    "npm:babel-helper-get-function-arity@6.24.1": {
      "map": {
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:babel-helper-call-delegate@6.24.1": {
      "map": {
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1",
        "babel-helper-hoist-variables": "npm:babel-helper-hoist-variables@6.24.1"
      }
    },
    "npm:babel-code-frame@6.22.0": {
      "map": {
        "esutils": "npm:esutils@2.0.2",
        "js-tokens": "npm:js-tokens@3.0.1",
        "chalk": "npm:chalk@1.1.3"
      }
    },
    "npm:regexpu-core@2.0.0": {
      "map": {
        "regjsgen": "npm:regjsgen@0.2.0",
        "regjsparser": "npm:regjsparser@0.1.5",
        "regenerate": "npm:regenerate@1.3.2"
      }
    },
    "npm:babel-helper-explode-assignable-expression@6.24.1": {
      "map": {
        "babel-traverse": "npm:babel-traverse@6.24.1",
        "babel-runtime": "npm:babel-runtime@6.23.0",
        "babel-types": "npm:babel-types@6.24.1"
      }
    },
    "npm:invariant@2.2.2": {
      "map": {
        "loose-envify": "npm:loose-envify@1.3.1"
      }
    },
    "npm:loose-envify@1.3.1": {
      "map": {
        "js-tokens": "npm:js-tokens@3.0.1"
      }
    },
    "npm:debug@2.6.3": {
      "map": {
        "ms": "npm:ms@0.7.2"
      }
    },
    "npm:regjsparser@0.1.5": {
      "map": {
        "jsesc": "npm:jsesc@0.5.0"
      }
    },
    "npm:chalk@1.1.3": {
      "map": {
        "escape-string-regexp": "npm:escape-string-regexp@1.0.5",
        "has-ansi": "npm:has-ansi@2.0.0",
        "strip-ansi": "npm:strip-ansi@3.0.1",
        "supports-color": "npm:supports-color@2.0.0",
        "ansi-styles": "npm:ansi-styles@2.2.1"
      }
    },
    "npm:has-ansi@2.0.0": {
      "map": {
        "ansi-regex": "npm:ansi-regex@2.1.1"
      }
    },
    "npm:strip-ansi@3.0.1": {
      "map": {
        "ansi-regex": "npm:ansi-regex@2.1.1"
      }
    },
    "npm:jspm-nodelibs-stream@0.2.1": {
      "map": {
        "stream-browserify": "npm:stream-browserify@2.0.1"
      }
    },
    "npm:stream-browserify@2.0.1": {
      "map": {
        "readable-stream": "npm:readable-stream@2.2.9",
        "inherits": "npm:inherits@2.0.3"
      }
    },
    "npm:readable-stream@2.2.9": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "process-nextick-args": "npm:process-nextick-args@1.0.7",
        "string_decoder": "npm:string_decoder@1.0.0",
        "buffer-shims": "npm:buffer-shims@1.0.0",
        "util-deprecate": "npm:util-deprecate@1.0.2",
        "isarray": "npm:isarray@1.0.0",
        "core-util-is": "npm:core-util-is@1.0.2"
      }
    },
    "npm:string_decoder@1.0.0": {
      "map": {
        "buffer-shims": "npm:buffer-shims@1.0.0"
      }
    },
    "npm:jspm-nodelibs-buffer@0.2.3": {
      "map": {
        "buffer": "npm:buffer@5.0.6"
      }
    },
    "npm:buffer@5.0.6": {
      "map": {
        "ieee754": "npm:ieee754@1.1.8",
        "base64-js": "npm:base64-js@1.2.0"
      }
    },
    "npm:jspm-nodelibs-os@0.2.1": {
      "map": {
        "os-browserify": "npm:os-browserify@0.2.1"
      }
    },
    "npm:jspm-nodelibs-crypto@0.2.1": {
      "map": {
        "crypto-browserify": "npm:crypto-browserify@3.11.0"
      }
    },
    "npm:crypto-browserify@3.11.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "browserify-cipher": "npm:browserify-cipher@1.0.0",
        "create-hmac": "npm:create-hmac@1.1.4",
        "create-hash": "npm:create-hash@1.1.2",
        "public-encrypt": "npm:public-encrypt@4.0.0",
        "create-ecdh": "npm:create-ecdh@4.0.0",
        "pbkdf2": "npm:pbkdf2@3.0.9",
        "randombytes": "npm:randombytes@2.0.3",
        "diffie-hellman": "npm:diffie-hellman@5.0.2",
        "browserify-sign": "npm:browserify-sign@4.0.4"
      }
    },
    "npm:create-hmac@1.1.4": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "create-hash": "npm:create-hash@1.1.2"
      }
    },
    "npm:create-hash@1.1.2": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "cipher-base": "npm:cipher-base@1.0.3",
        "ripemd160": "npm:ripemd160@1.0.1",
        "sha.js": "npm:sha.js@2.4.8"
      }
    },
    "npm:public-encrypt@4.0.0": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2",
        "randombytes": "npm:randombytes@2.0.3",
        "browserify-rsa": "npm:browserify-rsa@4.0.1",
        "parse-asn1": "npm:parse-asn1@5.1.0",
        "bn.js": "npm:bn.js@4.11.6"
      }
    },
    "npm:pbkdf2@3.0.9": {
      "map": {
        "create-hmac": "npm:create-hmac@1.1.4"
      }
    },
    "npm:browserify-sign@4.0.4": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "create-hash": "npm:create-hash@1.1.2",
        "create-hmac": "npm:create-hmac@1.1.4",
        "browserify-rsa": "npm:browserify-rsa@4.0.1",
        "parse-asn1": "npm:parse-asn1@5.1.0",
        "bn.js": "npm:bn.js@4.11.6",
        "elliptic": "npm:elliptic@6.4.0"
      }
    },
    "npm:diffie-hellman@5.0.2": {
      "map": {
        "randombytes": "npm:randombytes@2.0.3",
        "bn.js": "npm:bn.js@4.11.6",
        "miller-rabin": "npm:miller-rabin@4.0.0"
      }
    },
    "npm:browserify-cipher@1.0.0": {
      "map": {
        "browserify-des": "npm:browserify-des@1.0.0",
        "browserify-aes": "npm:browserify-aes@1.0.6",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0"
      }
    },
    "npm:browserify-des@1.0.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "cipher-base": "npm:cipher-base@1.0.3",
        "des.js": "npm:des.js@1.0.0"
      }
    },
    "npm:browserify-aes@1.0.6": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "create-hash": "npm:create-hash@1.1.2",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
        "cipher-base": "npm:cipher-base@1.0.3",
        "buffer-xor": "npm:buffer-xor@1.0.3"
      }
    },
    "npm:evp_bytestokey@1.0.0": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2"
      }
    },
    "npm:cipher-base@1.0.3": {
      "map": {
        "inherits": "npm:inherits@2.0.3"
      }
    },
    "npm:browserify-rsa@4.0.1": {
      "map": {
        "randombytes": "npm:randombytes@2.0.3",
        "bn.js": "npm:bn.js@4.11.6"
      }
    },
    "npm:create-ecdh@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "elliptic": "npm:elliptic@6.4.0"
      }
    },
    "npm:parse-asn1@5.1.0": {
      "map": {
        "browserify-aes": "npm:browserify-aes@1.0.6",
        "create-hash": "npm:create-hash@1.1.2",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
        "pbkdf2": "npm:pbkdf2@3.0.9",
        "asn1.js": "npm:asn1.js@4.9.1"
      }
    },
    "npm:sha.js@2.4.8": {
      "map": {
        "inherits": "npm:inherits@2.0.3"
      }
    },
    "npm:elliptic@6.4.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "bn.js": "npm:bn.js@4.11.6",
        "hmac-drbg": "npm:hmac-drbg@1.0.1",
        "minimalistic-crypto-utils": "npm:minimalistic-crypto-utils@1.0.1",
        "hash.js": "npm:hash.js@1.0.3",
        "brorand": "npm:brorand@1.1.0",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:miller-rabin@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "brorand": "npm:brorand@1.1.0"
      }
    },
    "npm:des.js@1.0.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:hmac-drbg@1.0.1": {
      "map": {
        "hash.js": "npm:hash.js@1.0.3",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0",
        "minimalistic-crypto-utils": "npm:minimalistic-crypto-utils@1.0.1"
      }
    },
    "npm:hash.js@1.0.3": {
      "map": {
        "inherits": "npm:inherits@2.0.3"
      }
    },
    "npm:asn1.js@4.9.1": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "bn.js": "npm:bn.js@4.11.6",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:jspm-nodelibs-string_decoder@0.2.1": {
      "map": {
        "string_decoder": "npm:string_decoder@0.10.31"
      }
    }
  }
});

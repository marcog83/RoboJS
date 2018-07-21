/**
 * Created by mgobbi on 20/04/2017.
 */
const arityFn=(function (FUNCTIONS) {
    return (arity, fn) => {
        if (typeof arity !== 'number') {
            throw new TypeError('Expected arity to be a number, got ' + arity);
        }
        if (!FUNCTIONS[arity]) {
            let params = [];



            for (let i = 0; i < arity; i++) {
                params.push('_' + i);
            }

            FUNCTIONS[arity] = new Function(
                'fn',
                'return function arity' + arity + ' (' + params.join(', ') + ') { return fn.apply(this, arguments); }'
            );
        }

        return FUNCTIONS[arity](fn);
    };
})({});
export default  arityFn;
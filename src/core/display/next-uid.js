/**
 * Created by mgobbi on 31/03/2017.
 */
const REG_EXP = /[xy]/g;
const STRING = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
export default  () => {
    return STRING.replace(REG_EXP, c => {
        let r = Math.random() * 16 | 0;
        let v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    })
};
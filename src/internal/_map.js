/**
 * Created by mgobbi on 20/04/2017.
 */
import curry from "./_curry";
export default curry((fn, list) => {
  //  return Array.from(list).map(fn);
    var idx=0;
    var length=list.length;
    var result=[];
    for(idx;idx<length;idx++){
        result[idx]=fn(list[idx])
    }

    return result
})
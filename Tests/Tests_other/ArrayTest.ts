//Bug: pos argument > 2 (because only arrays with max 3 positions are created)
function f(arr :string[],pos:number):string{
    return arr[pos];
}
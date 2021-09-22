interface f1{
    foo(n:number):number,
    bar(n:number):number
}

interface f2{
    (p1:number):number,
    x:number
}

interface f3{
    x:number,
    y:number
}

function test(param1:f1, param2:f2, param3:f3):void{
}
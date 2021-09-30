class Person {
    name:string;
    friend:string
    constructor(x:string|number, y:any);
    constructor(abc:string|number){
        this.name=<string>abc;
    }

    walk(friend:string,dist:number) : number {
        this.friend = friend;
        return dist;
    }
}

function Hello(x:string):number{
    return 2;
}
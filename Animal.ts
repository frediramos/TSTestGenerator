class Animal {
    position:number =0;
    constructor(x:number,y:number);
    constructor(x:number){
        this.position=x;
    }
    walk(dist:number,friend:Animal) : number {
        this.position += dist;
        return dist;
    }
}

class Person {
    name:string;
    friend:string
    constructor(abc:string){
        this.name=abc;
    }

    walk(friend:string,dist:number) : number {
        this.friend = friend;
        return dist;
    }
}
class Animal {
    
    friend:Animal;
    position:number =0;
    constructor(x:number){
        this.position=x;
    }
    walk(dist:number,partner:Animal) : void {
        this.friend=partner;
        this.position += dist;
    }
}

function walk(x:number):number{
    return x;
}

class Person{}

class Animal{
    friend:Person;
    constructor(x:Person,y:number);
    constructor(x:Person){
        this.friend=x;
    }
}

class Person {
    pet:number|Animal;
    constructor(y:number|Animal){
        this.pet=y;
    }
}

class Alien {
    prey:number|Animal;
    age:number;
    constructor(z:number|Animal, w:number){
        this.prey = z;
        this.age = w;
    }
}
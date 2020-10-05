class Animal{
    friend:Person;
    constructor(x:Person,y:number);
    constructor(x:Person){
        this.friend=x;
    }
}

class Person {
    pet:Animal;
    constructor(y:Animal){
        this.pet=y;
    }
}

class Alien {
    prey:Animal;
    constructor(z:Animal){
        this.prey = z;
    }
}
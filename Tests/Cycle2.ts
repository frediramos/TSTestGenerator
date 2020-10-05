class Animal{
    friend:Person;
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


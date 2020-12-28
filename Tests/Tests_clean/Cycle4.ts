class Animal{
    friend:Animal|number;
    constructor(x:Animal|number){
        this.friend=x;
    }
}

class Person {
    human:Person|number;
    constructor(y:Person|number){
        this.human=y;
    }
}


function Hello(A:Animal, B:Person) {
}
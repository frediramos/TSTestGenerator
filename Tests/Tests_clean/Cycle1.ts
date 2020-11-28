class Animalx{
    friend:Animalx;
    age:number;
    constructor(x:Animalx, y:number){
        this.friend=x;
        this.age = y;
    }
}
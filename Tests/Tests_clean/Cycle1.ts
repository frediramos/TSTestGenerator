class Animalx{
    friend:Animalx;
    age:number;
    constructor(x:Animalx, y:number|undefined, z:string);
    constructor(x:Animalx, y:number|undefined) {
        this.friend=x;
        this.age = y;
    }
}
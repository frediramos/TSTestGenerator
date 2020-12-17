class Animalx{
    friend:Animalx;
    age:number;
    constructor(x:Animalx, y:any, z:number|string)
    constructor(x:Animalx, y:number, z:number|string){
        this.friend=x;
        this.age = y;
        if(typeof z === "number") 
            this.age += z;
        else
            console.log(z);
    }
}
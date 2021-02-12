class Animalx{
    friend:Animalx;
    age:number;
    constructor(x:Animalx, y:number) {
        this.friend=x;
        this.age = y;
    }

    public older(years: number): void {
        this.age = this.age + years;
    }
}

function sumOfAnimalsAge(x:Animalx, y:Animalx) : number {
    return x.age + y.age;
}
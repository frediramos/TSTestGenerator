//Bug: Cat constructor with position <= 2

class Animal {
    private position: number;
    constructor(position: number) {
        this.position = position;
    }
    public walk(distance: number): void {
        this.position = this.position + distance;
    }
}

class Cat extends Animal {
    private name: string;
    private breed: number;
    constructor(position: number, name: string, breed: number) {
        super(position);
        this.name = name;
        if(position>2)
            this.breed = breed;
    }
    public meow(): string {
        var breed_str = this.breed.valueOf();
        return "Meow!! I’m " + this.name + " and I am a " + breed_str + " cat!";
    }
}

class Sphynx extends Cat {
    constructor(position: number, name: string) {
        super(position, name, 3);
    }
}

class Dog {
    private position: number;
    constructor(position: number) {
        this.position = position;
    }
    public walk(distance: number): void {
        this.position = this.position + distance;
    }
}

class Cat {
    private name: string;
    constructor(name: string) {
        this.name = name;
    }
    public meow(): string {
        return "Meow!! I’m " + this.name + "!";
    }
}
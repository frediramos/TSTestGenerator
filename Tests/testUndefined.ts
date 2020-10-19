class Student {
    private readonly name: string;
    private classes: string[] = [];

    constructor(n: string, cs: string[]) {
        this.name = n;
        this.classes = cs;
    }


    describe() : string{
        return 'Student: ' + this.name;
    }

    addClasses(c: string){
        this.classes.push(c);
    }

    getClasses() {
        console.log('Number of classes: ' + this.classes.length);
        console.log('Classes: ' + this.classes);
    }
}

class Animal {
    
    name:string;
    position:number =0;
    constructor(x:number){this.position=x}
    walk(dist:number,nome:string) : void {
        this.name=nome;
        this.position += dist;
    }
}
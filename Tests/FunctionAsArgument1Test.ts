class B {
    constructor(){}
   sayHi() : string { 
      return "B says Hi"; 
   }
}

class A { 
	b : B; 
	constructor (x: number, y: number) {
	   if (x > 22) {
		  this.b = new B();    
	   }
	}
	sayHi () : string { 
	  return this.b.sayHi(); 
	}
}


function f(g : (a: number, b: string) => number, w: number) : string { 
	var x = g(w, "xpto"); 
	var a = new A(x, 33);
	return a.sayHi();  
}
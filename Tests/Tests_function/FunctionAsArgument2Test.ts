//Bug: C's constructor with x <= 22

class D {
    constructor(){}
   sayHi() : string { 
      return "D says Hi"; 
   }
}

class C { 
	d : D; 
	constructor (x: number, y: number) {
	   if (x > 22) {
		  this.d = new D();    
	   }
	}
	sayHi () : string { 
	  return this.d.sayHi(); 
	}
}


function l(g : (h : (j : number) => number, b: string) => number, w: number) : string { 
    var magic = function(m : number){
        return m;
    }
	var x = g(magic, "xpto"); 
	var c = new C(x, 33);
	return c.sayHi();  
}
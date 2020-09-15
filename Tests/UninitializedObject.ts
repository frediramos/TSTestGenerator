class A {
   x: number;
   b: B;

   // BUG: y <= 22 && x > 10

   constructor (x: number, y: number) {
      this.x = x;
      if (y > 22) {
         this.b = new B(x);
      }
      this.g();
   }

   f() : number {
      return this.b.h(this.x);
   }

   g() : number {
      if (this.x > 10) {
         return this.f();
      }
      return 0;
   }

}

class B {
   x: number;

   constructor (x: number) {
      this.x = x;
   }

   h(y:number) : number {
      return this.x + y;
   }
}
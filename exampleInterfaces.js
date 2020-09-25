/**
 * 
 * 
 interface LabeledValue {
  label: string;
  lab():string;
}

class Price implements LabeledValue {
  label:string;
  lab(){
    return this.label;
  }
}

function printLabel(labeledObj: LabeledValue) {
  console.log(labeledObj.label);
}
 * 
 */

/** Mock Constructor + mock methods */

function LabeledValue() {
    var ss = symb_string(ss);
    this.label = ss; 
}

LabeledValue.prototype.lab = function () {
    var ss = symb_string(ss);
    return ss; 
}

function testPrintLabel() {
  var lv = new LabeledValue(); 
  printLabel(lv); 
}









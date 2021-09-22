const chars ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function symb():void{
}

function symb_number():number{
    return Math.random();
}

function symb_string():string{
    let result = ' ';
    var length = symb_number();
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * length));
    }
    return result;
}

function choice(limit:number, suffix:string):number{
    return Math.floor(Math.random() * limit);
}
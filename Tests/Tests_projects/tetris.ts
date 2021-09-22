var BlockData =[
    [
        [
            [0,0,1,0,],
            [0,0,1,0,],
            [0,0,1,0,],
            [0,0,1,0,],
        ],
        [
            [0,0,0,0,],
            [1,1,1,1,],
            [0,0,0,0,],
            [0,0,0,0,],
        ],
    ],
    [
        [
            [1,1,],
            [1,1,]
        ],
    ],
    [
        [
            [0,1,0,],
            [1,1,1,],
            [0,0,0,]        
        ],
        [
            [1,0,0,],
            [1,1,0,],
            [1,0,0,]        
        ],
        [
            [1,1,1,],
            [0,1,0,],
            [0,0,0,]
        ],
        [
            [0,1,0,],
            [1,1,0,],
            [0,1,0,]        
        ]
    ],
    [
        [
            [1,1,0,],
            [0,1,1,],
            [0,0,0,]        
        ],
        [
            [0,1,0,],
            [1,1,0,],
            [1,0,0,]        
        ],
    ],
    [
        [
            [0,1,1,],
            [1,1,0,],
            [0,0,0,]
        ],
        [
            [1,0,0,],
            [1,1,0,],
            [0,1,0,]
        ]
    ],
    [
        [
            [1,0,0,],
            [1,1,1,],
            [0,0,0,]
        ],
        [
            [0,1,0,],
            [0,1,0,],
            [1,1,0,]
        ],
        [
            [1,1,1,],
            [0,0,1,],
            [0,0,0,]
        ],
        [
            [1,1,0,],
            [1,0,0,],
            [1,0,0,]
        ]
    ]
    ,
    [
        [
            [0,0,1,],
            [1,1,1,],
            [0,0,0,]
        ],
        [
            [1,1,0,],
            [0,1,0,],
            [0,1,0,]
        ],
        [
            [1,1,1,],
            [1,0,0,],
            [0,0,0,]
        ],
        [
            [1,0,0,],
            [1,0,0,],
            [1,1,0,]
        ]
    ]
];

enum BlockStatus {
    closed, opened
}

enum GameStatus{
    Running,Finish, Fail
}

//array iterate callback
interface TraceBlockFunc{
    (source:Block,x:number,y:number): void;
}

class Point {
    x:number = 0;
    y:number = 0;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}

class Util {
    public static randomInt =  function(max:number) : number{
        return (Math.random() * max )| 0;
    }
}

class Block {
     position : Point;
     status : BlockStatus = BlockStatus.closed;
     shape : number = -1;
}

// nodejs인지 체크
function checkNode():boolean{
    try{
        var doc = document;
    }
    catch(exception)
    {
        return true;
    }
    return false;
}

class ShapeBlock {
    blocks : number[][][];
    shapesLength : number = 0;
    private currentShape : number = 0;
    constructor(block:any){
        this.shapesLength = block.length;
        this.blocks = block;
    }

    public getCurrentShape() : number {
        return this.currentShape;
    }
    public getCurrentShapeData() : number[][] {
        return this.blocks[this.currentShape];
    }

    public getNextShape() :number{
        /* 16.12.05 괄호 빠짐 */
        return (this.currentShape +1) % this.shapesLength;
    }

    public getNextShapeData() : number[][]{
        return this.blocks[this.getNextShape()];
    }

    public nextShape():number{
        this.currentShape = this.getNextShape();
        return this.currentShape;
    }
}

// game 실제 진행되는 클래스
class GameMap{

    // block data map
    private table:Block[][] ;

    // map size
    private size:Point;

    // 새로운 block 추가할때 시작포인트
    private insertPosition : Point ;

    // 유저가 움직이는 블럭 데이타
    private controlBlock : ShapeBlock;

    // 유저가 움직이는 블럭 데이타의 위치
    private controlPosition : Point;

    public init(size:Point) : void{
        this.size = size;
        this.insertPosition = new Point(size.x/2-1,-1);
        this.initMap();
    }

    // map를 빈블럭으로 초기화
    private initMap() :void{
        this.table = [];
        for(var i=0 ; i< this.size.x; i++){
            this.table[i] = [];
            for(var j= 0; j< this.size.y ; j++){
                this.table[i][j] = new Block();
                this.table[i][j].position = new Point(i,j);
            }
        }
    }

    // 블럭 추가
    public insertBlock(container:ShapeBlock){
        this.controlBlock = container;
        this.controlPosition = new Point(this.insertPosition.x,this.insertPosition.y);
    }

    // control block을 map에 복사
    private copyBlock(container:ShapeBlock, position : Point){

        var arrays: number[][] = container.getCurrentShapeData();
        var shape: number = container.getCurrentShape();

        // controlblock의 크기에 맞쳐 배열 반복 복사
        for(var i= 0; i< arrays.length ; i++)
        {
            for (var j=0; j<arrays[0].length ;j++){
                var x : number = position.x + i;
                var y : number = position.y + j;
                if (arrays[i][j] > 0)
                {
                    this.table[x][y].shape = arrays[i][j];
                    this.table[x][y].status = BlockStatus.opened;
                }
            }
        }
    }

    // 좌표가 map의 범위에 포함되어있는지 체크
    private containsTable(x:number, y:number) : boolean {
        if (0 > x)
            return false;
        if (x >= this.size.x)
            return false;
        if (y < 0)
            return false;
        if (y >= this.size.y)
            return false;
        return true;
    }

    // 좌표가 map의 범위에 포함되어있는지 체크
    private validTable(x:number, y:number) : boolean {
        if (0 > x)
            return false;
        if (x >= this.size.x)
            return false;
        if (y >= this.size.y)
            return false;
        return true;
    }

    // controlblock을 위아래좌우 이동시 블럭이 변경가능한지 체크
    private validBlockChange(container:ShapeBlock, position:Point) :boolean{
        var width = container.getCurrentShapeData().length;
        var arrays = container.getCurrentShapeData();
        //console.log(width);
        for(var j= 0; j< arrays.length ; j++)
        {
            for (var i=0; i<arrays[0].length ;i++){
                // 빈블럭은 패스
                if (arrays[i][j] <= 0)
                    continue;

                var x = position.x + i;
                var y = position.y + j;
                // 맵 범위에 벗어나면 false
                if (!this.validTable(x,y)){
                    return false;
                }
                if (y>0)
                {
                    // 특정위치에 블럭이 존재하면 false
                    if (this.table[x][y].status == BlockStatus.opened){
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // down 또는 fall하여 바닥도착시 블럭 복사
    private arriveContainrer(){
        this.copyBlock(this.controlBlock,this.controlPosition);
        this.checkBlockClear();
    }

    private checkBlockClear(){
        var rows = this.checkDeleteRow();
        
                console.log(rows);
        this.clearRow(rows);
        this.replaceRow(rows);
    }
    // map에서 삭제할 row를 list로 반환
    private checkDeleteRow() : number[] {
        var deleteRows : number[] = [];
        for (var i = this.size.y-1 ;  i >=0 ; i--){
            var fullRow : boolean = true;
            // 모든 칸이 다 채워져있는지 확인
            for ( var j = 0 ; j < this.size.x ; j++){
                if (this.table[j][i].shape < 0){
                    fullRow = false;
                    break;
                }
            }

            if (fullRow){
                deleteRows.push(i);
            }
        }

        return deleteRows;
    }

    // 특정row을 blank row 으로 전환
    private clearRow(rows:number[]){
        rows.forEach(i => {
            for ( var j = 0 ; j < this.size.x ; j++){
                this.table[j][i].shape = -1;
                this.table[j][i].status = BlockStatus.closed;
            }
        });

        // rows.forEach(i => {
        //     for ( var j = 0 ; j < this.size.x ; j++){
        //         this.table[i][j].shape = this.table[i+1][j].shape;
        //     }
        // });
    }

    private replaceRow(rows : number[]) {
        var offset : number  = 0;
        var deleteRow =  rows.shift();
        if(!deleteRow)
            return;
        for (var y = this.size.y-1 ;  y >0 ; y--){
            if (deleteRow==y){
                offset++;
                deleteRow = rows.shift();
            }

            if (offset == 0)
            {
                continue;
            }

            for (var x = 0 ; x < this.size.x ; x++){
                var srcBlock : Block = this.table[x][y-1];
                var destBlock : Block = this.table[x][y-1+offset];
                destBlock.shape = srcBlock.shape;
                destBlock.status = srcBlock.status;
                srcBlock.shape = -1;
                srcBlock.status = BlockStatus.closed;
            }
        }
    }

    public doRight() : boolean{
        var newPosition =  new Point(this.controlPosition.x+1,this.controlPosition.y);
        var refresh : boolean  =false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }

        return refresh;
    }

    public doLeft(): boolean{
        var newPosition = new Point(this.controlPosition.x-1,this.controlPosition.y);
        var refresh : boolean = false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }

        return refresh;
    }

    // to do : validcheck 만들어야함
    public doUp(): boolean{
        var width = this.controlBlock.getCurrentShapeData().length;
        var x = this.controlPosition.x;
        var xSize = this.size.x;
        /* 16.12.05 오른쪽에 붙어있을때 버그발생 */
        if(x+width <= xSize)
          this.controlBlock.nextShape();

        return false;
    }

    public doDown(): boolean{
        var newPosition =  new Point(this.controlPosition.x,this.controlPosition.y+1);
        var refresh : boolean = false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }

        if (!refresh)
            this.arriveContainrer();
        return refresh;
    }

    public doSpace(): boolean{
        while(this.doDown()){
            //pass;
        }
        return true;
    }

    // map block을 callback에 전달 rendering은 render에서 담당
    public renderMap(callback:TraceBlockFunc) : void {
        for (var y : number  = 0 ; y < this.size.y ; y++){
            for (var x : number = 0 ; x < this.size.x ; x++){
                callback(this.table[x][y], x,y);
            }
        }
    }

    // control block을 callback에 전달 rendering은 render에서 담당
    public renderControl(callback:Function){
        if (!this.controlBlock)
            return;
        var block =  this.controlBlock.getCurrentShapeData();
        for (var y : number  = 0 ; y < block[0].length ; y++){
            for (var x : number = 0 ; x < block.length ; x++){
                var renderPosX = this.controlPosition.x + x;
                var renderPosY = this.controlPosition.y + y;
                if (this.containsTable(renderPosX,renderPosY)){
                    callback(block[x][y], renderPosX,renderPosY);
                }
            }
        }
    }
}

class Renderer {
    private gameMap : Element[][] =[];
    private nextBlock : Element[][] = [];

    // html element 생성
    // map과 nextBlock 을 blank css로 초기화
    public init(size:Point){
        if (checkNode()){
            return;
        }

        // array init
        for (var y = 0 ; y < size.y ; y++ ){
            this.gameMap[y] = [];
        }

        var tableElement =document.createElement("table");
        tableElement.setAttribute("id","game");
        for( var y = 0 ; y < size.y ; y++ ){
            var tr = document.createElement("tr");
            for (var x = 0 ; x < size.x ; x++){
                var td = document.createElement("td");
                td.setAttribute("class","block blank ");
                this.gameMap[x][y] = td;
                tr.appendChild(td);
            }
            tableElement.appendChild(tr);
        }
        document.getElementById('game').appendChild(tableElement);

        // array init
        for (var y = 0 ; y < 5 ; y++ ){
            this.nextBlock[y] = [];
        }

        var nextBlockElement = document.createElement("table");
        nextBlockElement.setAttribute("id","nextblockTable");//2016.12.13 현 엘리먼트를 감싸는 아이디와 동일 해서 수정.
        for( var y = 0 ; y < 5 ; y++ ){
            var tr = document.createElement("tr");
            for (var x = 0 ; x < 5 ; x++){
                var td = document.createElement("td");
                td.setAttribute("class","block blank");
                this.nextBlock[x][y] = td;
                tr.appendChild(td);
            }
            nextBlockElement.appendChild(tr);
        }

        document.getElementById('nextblock').appendChild(nextBlockElement);
    }

    // block의 상태에따라 css 변경
    public render(gameMap : GameMap){
        var elements = this.gameMap
        gameMap.renderMap(function(object:Block, x: number, y:number){
            switch(object.status){
                case BlockStatus.opened:
                    elements[x][y].setAttribute("class","block opened");
                break;
                case BlockStatus.closed:
                    elements[x][y].setAttribute("class","block closed");
                break;
            }
        });
        gameMap.renderControl(function(object:number, x: number, y:number){
            switch(object){
                case 1:
                    elements[x][y].setAttribute("class","block opened");
                break;
            }
        });
    }

    public renderNextBlock(block:ShapeBlock){

    }
}

class Game{

    // game 영역
    private gameMap : GameMap;

    // html renderer
    private renderer : Renderer;

    // block drop timer
    private timer : number =0;

    // nexblock
    private nextBlock : ShapeBlock;

    // 블럭모양 리소스저장
    private resourceBlock : ShapeBlock[] = [];

    public run() : void {
        this.gameMap = new GameMap();
        var size : Point = new Point(10,20);
        this.renderer = new Renderer();
        this.gameMap.init(size);
        this.renderer.init(size);

        if (!checkNode()){
            document.addEventListener("keydown",this.OnKeyDown.bind(this));
        }

        this.initBlockResource();
        setInterval(this.timeLoop,1000,this);
    }

    // 게임에 사용될 블럭 초기화
    private initBlockResource(){

        var blockcount = BlockData.length;

        //BlockData를 ShapeBlock Array로 변환
        BlockData.forEach(element => {
            var size =element[0].length;
            var block : ShapeBlock =  new ShapeBlock(element);
            this.resourceBlock.push(block);

        });

        // 새로운블럭과 nextblock set
        var selectIndex : number =  Util.randomInt(blockcount);
        var selectedBlock : ShapeBlock = this.resourceBlock[selectIndex];

        this.pushNewBlock(selectedBlock);
    }

    // 블럭을 map에 추가하고 nextblock set
    private pushNewBlock(block :ShapeBlock){
        this.gameMap.insertBlock(block);
        var nextIndex : number = Util.randomInt( BlockData.length);
        this.nextBlock = this.resourceBlock[nextIndex];
    }

    // debug
    private ArrayPrint(array:Array<any>){
        array.forEach(element=>{
            console.log(element);
        })
    }

    // timer에 맞쳐 블럭 down
    private timeLoop(obj:Game) {
        var result =obj.gameMap.doDown();
        obj.nextBlocks();
        if (!result){
          obj.pushNewBlock(obj.nextBlock);
        }
        obj.render();
    }

    /*2016.12.13 nextBlocks 다음에 나올 블록 모양 노출*/
    private nextBlocks(){
        var nextArray = this.nextBlock.blocks;
        var nextBlockTable = document.getElementById("nextblockTable");
        var nextBlockChild = nextBlockTable.children;

        for(var y = 0; y < nextBlockChild.length; y++){
          for(var x = 0; x < nextBlockChild[y].children.length; x++){
            nextBlockChild[y].children[x].setAttribute("class", "block blank");
          }
        }

        for(var n = 0; n < nextArray.length; n++){
          for(var i = 0; i < nextArray[n].length; i++){
            for(var j = 0; j < nextArray[n][i].length; j++){
                if(nextArray[n][nextArray[n].length - 1 - i][j] == 1){
                  nextBlockChild[i].children[j].setAttribute("class", "block opened");
                }else{
                  nextBlockChild[i].children[j].setAttribute("class", "block blank");
                }
            }
          }
        }

    }

    private OnKeyDown(evt:FacadeKeyBoardEvent) : any{

        switch(evt.code){
            case "ArrowUp":
                this.gameMap.doUp();
                this.render();
                break;
            case "ArrowDown":
                // 블럭이 바닥에 도착햇으면 새로운 블럭 생성
                var result =this.gameMap.doDown();
                if (!result){
                    this.pushNewBlock(this.nextBlock);
                }
                this.render();
                break;
            case "ArrowLeft":
                this.gameMap.doLeft();
                this.render();
                break;
            case "ArrowRight":
                this.gameMap.doRight();
                this.render();
                break;
            case "Space":
                this.gameMap.doSpace();
                this.pushNewBlock(this.nextBlock);
                this.render();
                break;
        }
    }

    private render() : void{
        this.gameOver();
        this.renderer.render(this.gameMap);
    }

    /*2016.12.13게임오버시 필요한 함수만 생성. 필요한 값을 찾지 못해 아직 만들지 못함*/
    private gameOver(): Boolean{
      return true;
    }
}

function run(){
    var world : Game = new Game();
    world.run();
}

class FacadeKeyBoardEvent {
    code;
}
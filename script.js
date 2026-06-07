const BOARD_SIZE = 9;

const boardEl =
document.getElementById("board");

const turnDisplay =
document.getElementById("turnDisplay");

const selectedInfo =
document.getElementById("selectedInfo");

let currentTurn = "black";

let selectedPiece = null;

let pieces = [];

let fields = [];

let captured = {
  black: [],
  white: []
};

let skillMode = null;

let skillPiece = null;

let skillTargets = [];

function createPiece(data){

  return {

    id: crypto.randomUUID(),

    promoted:false,

    killCount:0,
    
    restTurns:0,

    converted:false,

    statuses:[],

    fields:[],
    
    warpFieldUses:2,
    
    restFieldUses:2,

    turnLife:null,

    ...data
  };
}

function setupGame(){
console.log("setupGame開始");
  pieces = [];

  fields = [];

  currentTurn = "black";

  selectedPiece = null;

  isDraftPhase = true;

  blackDraft = [];

  whiteDraft = [];

  placedCount = {
    black:0,
    white:0
  };
  
  pieces.push(
  createPiece({
    type:"王",
    team:"black",
    x:4,
    y:8,
    moveType:"king"
  })
);

pieces.push(
  createPiece({
    type:"玉",
    team:"white",
    x:4,
    y:0,
    moveType:"jewel"
  })
);

  render();
console.log("render終わり");
  createDraftUI();
  console.log("createDraftUI終わり");
}

function render(){

  boardEl.innerHTML = "";

  turnDisplay.textContent =
  `現在ターン: ${currentTurn}`;

  for(let y=0;y<BOARD_SIZE;y++){

    for(let x=0;x<BOARD_SIZE;x++){

      const cell =
      document.createElement("div");

      cell.className =
      "cell " +
      (
        (x+y)%2===0
        ? "dark"
        : "light"
      );

      cell.dataset.x = x;
      cell.dataset.y = y;

      const fieldHere =
      fields.find(
        f => f.x===x && f.y===y
      );

      if(fieldHere){

        cell.classList.add(fieldHere.type);
      }

      const piece =
      getPieceAt(x,y);

      if(piece){

        cell.textContent = piece.type;

        cell.classList.add(

          piece.team === "black"
          ? "piece-black"
          : "piece-white"
        );
      }

      cell.addEventListener(
        "click",
        ()=>onCellClick(x,y)
      );

      boardEl.appendChild(cell);
    }
  }
if(selectedPiece){

    selectedInfo.textContent =
    `${selectedPiece.type}
    キル:${selectedPiece.killCount}`;

  }else{

    selectedInfo.textContent = "なし";
  }

}
  // ========================
// 開始前ドラフトシステム
// ========================

// プレイヤーが最初に選べる駒一覧
const START_SELECTABLE = [
  "歩",
  "銀",
  "香",
  "桂",
  "角",
  "飛",
  "金",
  "砲",
  "姫",
  "賢",
]

// 現在ドラフト中か
let isDraftPhase = true;

// 黒が選んだ駒
let blackDraft = [];

// 白が選んだ駒
let whiteDraft = [];

// 何個置いたか
let placedCount = {
  black:0,
  white:0
};

// ドラフトUI作成
function createDraftUI(){

  const side =
  document.querySelector(".side");

  const draftDiv =
  document.createElement("div");

  draftDiv.id = "draftUI";

  draftDiv.innerHTML = `
    <h2>駒選択</h2>
    <div id="draftButtons"></div>
  `;

  side.prepend(draftDiv);

  const buttons =
  document.getElementById("draftButtons");

  START_SELECTABLE.forEach(type=>{

    const btn =
    document.createElement("button");

    btn.textContent = type;

    btn.addEventListener("click",()=>{

      selectDraftPiece(type);
      
      )
    };

// 現在ドラフト中か
let isDraftPhase = true;

// 黒が選んだ駒
let blackDraft = [];

// 白が選んだ駒
let whiteDraft = [];

// 何個置いたか
let placedCount = {
  black:0,
  white:0
};

// ドラフトUI作成
function createDraftUI(){

  const side =
  document.querySelector(".side");

  const draftDiv =
  document.createElement("div");

  draftDiv.id = "draftUI";

  draftDiv.innerHTML = `
    <h2>駒選択</h2>
    <div id="draftButtons"></div>
  `;

  side.prepend(draftDiv);

  const buttons =
  document.getElementById("draftButtons");

  START_SELECTABLE.forEach(type=>{

    const btn =
    document.createElement("button");

    btn.textContent = type;

    btn.addEventListener("click",()=>{

      selectDraftPiece(type);
    });

    buttons.appendChild(btn);
  });
}

// 駒選択
function selectDraftPiece(type){

  if(!isDraftPhase){

    return;
  }

  const currentDraft =
  currentTurn === "black"
  ? blackDraft
  : whiteDraft;

  if(currentDraft.length >= 3){

    return;
  }

  currentDraft.push(type);

  alert(
    `${currentTurn} が ${type} を選択`
  );

  if(currentDraft.length >= 3){

    alert(
      `${currentTurn} は配置してください`
    );
  }
}

// ドラフト配置
function placeDraftPiece(type,x,y){

  pieces.push(

    createPiece({

      type,

      team:currentTurn,

      x,
      y,

      moveType:
      convertMoveType(type)
    })
  );

  placedCount[currentTurn]++;

  // 3個置いたら交代
  if(placedCount[currentTurn] >= 3){

    if(currentTurn === "black"){

      currentTurn = "white";

      alert("白のターン");
    }
    else{

      isDraftPhase = false;

      currentTurn = "black";

      alert("ゲーム開始！");
    }
  }

  render();
}

// moveType変換
function convertMoveType(type){

  switch(type){

    case "歩":
      return "pawn";

    case "銀":
      return "silver";

    case "香":
      return "lance";

    case "桂":
      return "knight";

    case "角":
      return "bishop";

    case "飛":
      return "rook";

    case "金":
      return "gold";

    case "砲":
      return "cannon";
    
    case "姫":
      return "princess";

    case "賢":
      return "wise";

    case "王":
      return "king";

    case "玉":
      return "jewel";

    default:
      return "none";
  }
}

function onCellClick(x,y){
  
  if(skillMode){
    handleSkillClick(x,y);
    return;
  }
  
  if(isDraftPhase){

  const currentDraft =
  currentTurn === "black"
  ? blackDraft
  : whiteDraft;

  if(
    currentDraft.length >
    placedCount[currentTurn]
  ){

    // 黒は下3段
    if(
      currentTurn === "black" &&
      y < 6
    ){

      alert("黒は下3段に置く");
      return;
    }

    // 白は上3段
    if(
      currentTurn === "white" &&
      y > 2
    ){

      alert("白は上3段に置く");
      return;
    }

    // 重複配置禁止
    if(getPieceAt(x,y)){

      return;
    }

    const type =
    currentDraft[
      placedCount[currentTurn]
    ];

    placeDraftPiece(type,x,y);

    return;
  }
}

  const clickedPiece =
  getPieceAt(x,y);

  if(
  clickedPiece &&
  clickedPiece.team === currentTurn
  ){

  if(clickedPiece.restTurns > 0){

    alert("この駒は休み中");
    return;
  }

  selectedPiece = clickedPiece;

  render();
  highlightMoves(clickedPiece);

  return;
}

  if(selectedPiece){

    const moves =
    generateMoves(selectedPiece);

    const valid =
    moves.find(
      m => m.x===x && m.y===y
    );

    if(valid){

      movePiece(selectedPiece,x,y);
    }
  }
}

function handleSkillClick(x,y){

  switch(skillMode){

    case "wiseWarp":

      placeWiseField(
        skillPiece,
        x,
        y,
        "warpField"
      );

      finishSkill();

      break;

    case "wiseRest":

      placeWiseField(
        skillPiece,
        x,
        y,
        "restField"
      );

      finishSkill();

      break;

    case "silverPawn2":

      silverTargetClick(
        x,
        y,
        ["歩","歩"]
      );

      break;

    case "silverPawnLance":

      silverTargetClick(
        x,
        y,
        ["歩","香"]
      );

      break;
  }
}

  function finishSkill(){

    skillMode = null;

    skillPiece = null;

    skillTargets = [];

    endTurn();
  
  }

function movePiece(piece,x,y){

  const target =
  getPieceAt(x,y);

  if(
    target &&
    target.team !== piece.team
  ){

    capturePiece(piece,target);
  }

  piece.x = x;
  piece.y = y;

  applyFieldEffects(piece);

  if(piece.type === "飛"){

    piece.remainingActions--;

    if(piece.remainingActions > 0){

      selectedPiece = piece;

      render();

      return;
    }
  }

  endTurn();
}

function endTurn(){

  currentTurn =
  currentTurn === "black"
  ? "white"
  : "black";

  selectedPiece = null;

  for(const p of pieces){

    if(p.type === "飛"){

      p.remainingActions = 2;
      
    }
    
    if(p.restTurns > 0){

    p.restTurns--;

    }

    if(p.turnLife !== null){

      p.turnLife--;

      if(p.turnLife <= 0){

        removePiece(p);
      }
    }
  }
}

  updateFields();

  render();
}

function capturePiece(attacker,target){

  attacker.killCount++;

  if(attacker.type === "玉"){

    target.team = attacker.team;

    target.converted = true;
    
    return;
  }
  
  if(target.type === "姫"){
    removePiece(attacker);
  }
  
  removePiece(target);

  checkWinner();
}

function checkWinner(){

  const teams =
  [...new Set(
    pieces.map(p => p.team)
  )];

  if(teams.length <= 1){

    alert(
      `${teams[0]} の勝利！`
    );
  }
}

function removePiece(piece){

  pieces =
  pieces.filter(
    p => p.id !== piece.id
  );
}

function getPieceAt(x,y){

  return pieces.find(
    p => p.x===x && p.y===y
  );
}

function inside(x,y){

  return (
    x >= 0 &&
    x < BOARD_SIZE &&
    y >= 0 &&
    y < BOARD_SIZE
  );
}

function generateMoves(piece){

  switch(piece.moveType){

    case "pawn":
      return pawnMoves(piece);

    case "silver":
      return around(piece,3);

    case "lance":
      return orthogonal(piece,1);

    case "knight":
      return diagonal(piece,5);

    case "bishop":

      return [

        ...orthogonal(piece,1),

        ...diagonal(piece,2)
      ];

    case "rook":

      if(piece.remainingActions === 2){

        return orthogonal(piece,2);
      }

      return orthogonal(piece,4);

    case "gold":
      return around(piece,3);
    
    case "cannon":
      return orthogonal(piece,1);
    
    case "princess":
      return around(piece,2);

    case "wise":
      return around(piece,2);
      
    case "king":
      return around(piece,2);

    case "jewel":
      return around(piece,3);

    default:
      return [];
  }
}

function pawnMoves(piece){

  if(piece.killCount === 0){

    return around(piece,3);
  }

  if(piece.killCount === 1){

    return around(piece,4);
  }

  return around(piece,6);
}
    
function around(piece,range){

  const result = [];

  for(let dx=-range;dx<=range;dx++){

    for(let dy=-range;dy<=range;dy++){

      if(dx===0 && dy===0){

        continue;
      }

      const nx = piece.x + dx;
      const ny = piece.y + dy;

      if(!inside(nx,ny)){

        continue;
      }

      const target =
      getPieceAt(nx,ny);

      if(
        !target ||
        target.team !== piece.team
      ){

        result.push({
          x:nx,
          y:ny
        });
      }
    }
  }

  return result;
}

function orthogonal(piece,range){

  const result = [];

  for(let i=1;i<=range;i++){

    addMove(
      result,
      piece,
      piece.x+i,
      piece.y
    );

    addMove(
      result,
      piece,
      piece.x-i,
      piece.y
    );

    addMove(
      result,
      piece,
      piece.x,
      piece.y+i
    );

    addMove(
      result,
      piece,
      piece.x,
      piece.y-i
    );
  }

  return result;
}

function diagonal(piece,range){

  const result = [];

  for(let i=1;i<=range;i++){

    addMove(
      result,
      piece,
      piece.x+i,
      piece.y+i
    );

    addMove(
      result,
      piece,
      piece.x-i,
      piece.y-i
    );

    addMove(
      result,
      piece,
      piece.x+i,
      piece.y-i
    );

    addMove(
      result,
      piece,
      piece.x-i,
      piece.y+i
    );
  }

  return result;
}

function addMove(
  result,
  piece,
  x,
  y
){

  if(!inside(x,y)){

    return;
  }

  const target =
  getPieceAt(x,y);

  if(
    !target ||
    target.team !== piece.team
  ){

    result.push({x,y});
  }
}

function highlightMoves(piece){
  const cells =
  document.querySelectorAll(".cell");
  // 選択中コマを黄色に
  cells.forEach(cell=>{
    if(
      Number(cell.dataset.x) === piece.x &&
      Number(cell.dataset.y) === piece.y
    ){
      cell.classList.add("selected");
    }
  });

  const moves =
  generateMoves(piece);
  // 動ける場所を薄黄色に
  moves.forEach(move=>{
    cells.forEach(cell=>{
      if(
        Number(cell.dataset.x) === move.x &&
        Number(cell.dataset.y) === move.y
      ){
        cell.classList.add("highlight");
      }
    });
  });
}

function updateFields(){

  fields = [];

  for(const piece of pieces){

    if(piece.type === "香"){

      for(let y=0;y<9;y++){

        for(let x=0;x<9;x++){

          fields.push({

            type:"buffField",

            x,
            y
          });
        }
      }
    }

    if(piece.type === "角"){

      createRadiusField(
        piece,
        1,
        "warpField"
      );
    }
    
    if(piece.type === "砲"){
      
      createCrossField(
        piece,
        7,
        "restField"
      );
    }

    if(piece.type === "王"){

      createRadiusField(
        piece,
        1,
        "restField"
      );
    }

    if(piece.type === "桂"){

      if(piece.killCount >= 1){

        createRadiusField(

          piece,

          piece.killCount >= 2
          ? 2
          : 1,

          "warpField"
        );
      }
    }
  }
}
    
    function applyFieldEffects(piece){
      
      const field =
        fields.find(
          f =>
            f.x === piece.x &&
            f.y === piece.y
        );
      
      if(!field){
        return;
      }

      if(field.type === "warpField"){
        applyWarpField(piece);
      }

      if(field.type === "restField"){
        applyRestField(piece);
      }
    }

    function applyWarpField(piece){

      const candidates = [];

      for(let dx=-3;dx<=3;dx++){

        for(let dy=-3;dy<=3;dy++){

          const nx = piece.x + dx;
          const ny = piece.y + dy;

          if(!inside(nx,ny)){
            continue;
          }

          if(getPieceAt(nx,ny)){
            continue;
          }
          
          const fieldHere =
            fields.find(
              f =>
                f.x === nx &&
                f.y === ny
            );

          if(fieldHere){
            continue;
          }

          candidates.push({
            x:nx,
            y:ny
          });
        }
      }

      if(candidates.length === 0){
        return;
      }
      
      const target =
        candidates[
        Math.floor(
          Math.random()
          * candidates.length
        )
        ];

      piece.x = target.x;
      piece.y = target.y;
    }
    
    function applyRestField(piece){

      if(piece.type === "銀"){
        return;
      }
      
      if(piece.restTurns <= 0){
        piece.restTurns = 1;
      }
    }
    
    function createRadiusField(
      piece,
      radius,
      type
    ){
      
      for(let dx=-radius;dx<=radius;dx++){

        for(let dy=-radius;dy<=radius;dy++){

          const x = piece.x + dx;
          const y = piece.y + dy;
          
          if(!inside(x,y)){

            continue;
          
          }

          fields.push({
            type,
            x,
            y
          });
        }
      }
    }

    function createCrossField(
      piece,
      range,
      type
    ){

      for(let i=-range;i<=range;i++){

        const x1 = piece.x + i;
        const y1 = piece.y;
        
        if(inside(x1,y1)){

          fields.push({
            type,
            x:x1,
            y:y1
          });
        }

        const x2 = piece.x;
        const y2 = piece.y + i;

        if(inside(x2,y2)){

          fields.push({
            type,
            x:x2,
            y:y2
          });
        }
      }
    }
    
//スキル
    
    function showSkillButtons(piece){

      const area =
  
        document.getElementById("skillArea");

      area.innerHTML = "";

      if(piece.type === "賢"){

        addSkillButton(
          "ワープ配置",
          ()=>{

            skillMode =
              "wiseWarp";
            
            skillPiece =
              selectedPiece;
          }
        );

        addSkillButton(
          "休み配置",
          ()=>{

            skillMode =
              "wiseRest";

            skillPiece =
              selectedPiece;
          }
        );
      }

      if(piece.type === "銀"){
        
        addSkillButton(
          "歩×2",
          ()=>{

            skillMode =
              "silverPawn2";

            skillPiece =
              selectedPiece;
          }
        );
        
        addSkillButton(
          "歩＋香",
          ()=>{

            skillMode =
              "silverPawnLance";

            skillPiece =
              selectedPiece;
          }
        );
      }
    }
    
    function addSkillButton(
      text,
      callback
    ){
      const btn =
        document.createElement("button");

      btn.textContent = text;

      btn.onclick = callback;

      document
        .getElementById("skillArea")
        .appendChild(btn);
    }
    
    function useSilverSkill(
      silver,
      mode
    ){

      const spots =
        around(silver,1);

      if(mode === "silverPawn2"){

        spawnClone(
          silver,
          spots[0],
          "歩"
        );

        spawnClone(
          silver,
          spots[1],
          "歩"
        );
      }

      if(mode === "silverPawnLance"){

        spawnClone(
          silver,
          spots[0],
          "歩"
        );

        spawnClone(
          silver,
          spots[1],
          "香"
        );
      }
    }
    
    function spawnClone(
      silver,
      pos,
      type
    ){

      if(!pos){
        return;
      }

      pieces.push(

        createPiece({

          type:type,

          team:silver.team,

          x:pos.x,

          y:pos.y,

          moveType:
            convertMoveType(type)
        })
      );
    }

function silverTargetClick(
  x,
  y,
  spawnTypes
){

  const dx =
  Math.abs(
    x - skillPiece.x
  );

  const dy =
  Math.abs(
    y - skillPiece.y
  );

  if(
    dx > 1 ||
    dy > 1
  ){

    return;
  }

  if(getPieceAt(x,y)){

    return;
  }

  skillTargets.push({
    x,
    y
  });

  if(
    skillTargets.length < 2
  ){

    return;
  }

  removePiece(
    skillPiece
  );

  for(
    let i=0;
    i<2;
    i++
  ){

    pieces.push(

      createPiece({

        type:
        spawnTypes[i],

        team:
        skillPiece.team,

        x:
        skillTargets[i].x,

        y:
        skillTargets[i].y,

        moveType:
        convertMoveType(
          spawnTypes[i]
        )
      })
    );
  }

  finishSkill();

  render();
}

function placeWiseField(
  piece,
  x,
  y,
  fieldType
){

  if(piece.type !== "賢"){

    return;
  }

  if(fieldType === "warpField"){

    if(piece.warpFieldUses <= 0){

      alert("ワープ設置回数切れ");
      return;
    }

    piece.warpFieldUses--;

  }else{

    if(piece.restFieldUses <= 0){

      alert("休み設置回数切れ");
      return;
    }

    piece.restFieldUses--;
  }

  fields.push({

    type:fieldType,

    x,
    y,

    permanent:true
  });

  render();
}

document
.getElementById("resetBtn")
.addEventListener(
  "click",
  setupGame
);

console.log(typeof createDraftUI);

setupGame();

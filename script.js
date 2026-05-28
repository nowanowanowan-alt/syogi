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

function createPiece(data){

  return {

    id: crypto.randomUUID(),

    promoted:false,

    killCount:0,

    statuses:[],

    fields:[],

    turnLife:null,

    ...data
  };
}

function setupGame(){

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

  render();

  createDraftUI();
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
  "金"
];

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

    case "王":
      return "king";

    case "玉":
      return "jewel";

    case "神":
      return "god";

    default:
      return "none";
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

function onCellClick(x,y){// ========================
// ドラフト配置処理
// ========================

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

    selectedPiece = clickedPiece;

    highlightMoves(clickedPiece);

    render();

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

  specialTransform(piece);

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

    if(p.turnLife !== null){

      p.turnLife--;

      if(p.turnLife <= 0){

        removePiece(p);
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

    return;
  }

  captured[attacker.team]
  .push(target.type);

  if(
    target.type === "王" ||
    target.type === "玉"
  ){

    spawnPrincess(target);
  }

  removePiece(target);
}

function spawnPrincess(deadPiece){

  pieces.push(

    createPiece({

      type:"姫",

      team:deadPiece.team,

      x:4,

      y:
      deadPiece.team === "black"
      ? 8
      : 0,

      moveType:"none",

      turnLife:2
    })
  );
}

function specialTransform(piece){

  if(
    piece.type === "角" &&
    piece.x === 4 &&
    piece.y === 4
  ){

    piece.type = "神";

    piece.moveType = "god";

    piece.turnLife = 5;
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
      return around(piece,3,false);

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
      return around(piece,4,false);

    case "king":
      return around(piece,2,true);

    case "jewel":
      return around(piece,3,false);

    case "god":

      return [

        ...orthogonal(piece,3),

        ...diagonal(piece,5)
      ];

    default:
      return [];
  }
}

function pawnMoves(piece){

  if(piece.killCount === 0){

    return around(piece,3,true);
  }

  if(piece.killCount === 1){

    return around(piece,4,false);
  }

  return around(piece,6,false);
}

function around(
  piece,
  range,
  diagonalAllowed
){

  const result = [];

  for(let dx=-range;dx<=range;dx++){

    for(let dy=-range;dy<=range;dy++){

      if(dx===0 && dy===0){

        continue;
      }

      if(!diagonalAllowed){

        if(
          Math.abs(dx)+Math.abs(dy)
          > range
        ){

          continue;
        }
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

  render();

  const moves =
  generateMoves(piece);

  const cells =
  document.querySelectorAll(".cell");

  moves.forEach(move=>{

    cells.forEach(cell=>{

      if(
        Number(cell.dataset.x)
        === move.x &&
        Number(cell.dataset.y)
        === move.y
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

document
.getElementById("resetBtn")
.addEventListener(
  "click",
  setupGame
);

setupGame();

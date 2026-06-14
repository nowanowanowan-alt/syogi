const BOARD_SIZE = 9;

const boardEl =
document.getElementById("board");

const turnDisplay =
document.getElementById("turnDisplay");

const selectedInfo =
document.getElementById("selectedInfo");

let currentTurn = "black";

let roundCount = 1;

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

let kingRestLine = null;

let kingRestRow = null;
let kingRestCol = null;

let wiseMoveAfterSkill = false;

const FRONT_DRAFT_1 = [
  "歩",
  "角",
  "桂"
];

const BACK_DRAFT = [
  "香",
  "砲",
  "姫",
  "賢"
];

const FRONT_DRAFT_2 = [
  "銀",
  "桂",
  "飛",
  "金"
];

let draftPool = [

  "歩",
  "銀",
  "香",
  "桂",
  "角",
  "飛",
  "金",
  "砲",
  "姫",
  "賢"

];

let draftRound = 1;

let draftOrder = [];

let draftTurn = 0;

let currentChoices = [];

let selectedDraftPiece = null;

let placingDraftPiece = false;

let blackFrontCount = 0;

let whiteFrontCount = 0;

const SILVER_GACHA = [

  {type:"歩",weight:10},
  {type:"香",weight:10},
  {type:"角",weight:10},
  {type:"桂",weight:10},
  {type:"飛",weight:10},
  {type:"金",weight:10},
  {type:"砲",weight:10},
  {type:"姫",weight:10},
  {type:"賢",weight:10},

  {type:"王",weight:5},
  {type:"玉",weight:5}
];

function createPiece(data){

  return {

    id: crypto.randomUUID(),

    promoted:false,

    killCount:0,    
    
    summonedCount:0,
    
    restTurns:0,

    converted:false,

    statuses:[],

    fields:[],
    
    isSubstituteUsed:false,

    remainingActions:2,
    
    warpFieldUses:2,
    
    restFieldUses:2,
    
    rebellionFieldUses:2,
  
    bishopWarpUses:2,

    bishopWarpReady:false,

    controlledBy:null,
    
    controlTurns:0,

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

  render();}
  
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

document
.getElementById("startBtn")
.onclick=startDraft;

//========================
// ドラフト
//========================

function startDraft(){

  blackDraft = [];
  whiteDraft = [];

  draftPickIndex = 0;

  draftOrder = [

    "black",
    "white",
    "black",
    "white",
    "white",
    "black"
  ];

  showDraftChoices();
}
  
function showDraftChoices(){

  const player =
  draftOrder[
    draftPickIndex
  ];

  const choices =
  getCurrentDraftChoices();

  const area =
  document
  .getElementById(
    "draftButtons"
  );

  area.innerHTML = "";

  choices.forEach(type=>{

    const btn =
    document.createElement(
      "button"
    );

    btn.textContent =
    type;

    btn.onclick = ()=>{

      pickDraftPiece(
        player,
        type
      );
    };

    area.appendChild(btn);
  });

  turnDisplay.textContent =
  `${player} のピック`;
}
  
function pickDraftPiece(player,type){

  selectedDraftPiece = type;

  placingDraftPiece = true;

  currentTurn = player;

  render();
}
  
function getCurrentDraftChoices(){

  if(draftRound === 1){

    return [
      "歩",
      "角",
      "桂"
    ];
  }

  if(draftRound === 2){

    return randomThree([
      "香",
      "砲",
      "姫",
      "賢"
    ]);
  }

  if(draftRound === 3){

    return randomThree([
      "銀",
      "桂",
      "飛",
      "金"
    ]);
  }

  return [];
}

function placeDraftPiece(type,x,y,team){

  pieces.push(

    createPiece({

      type,

      team,

      x,

      y,

      moveType:
      convertMoveType(type)
    })
  );

  placingDraftPiece = false;
  selectedDraftPiece = null;

  draftPickIndex++;

  if(draftPickIndex >= draftOrder.length){

    draftPickIndex = 0;

    draftRound++;

    if(draftRound >= 4){

      isDraftPhase = false;

      currentTurn = "black";

      alert("ゲーム開始！");

      render();

      return;
    }
  }

  render();

  showDraftChoices();
}
    
function canPlaceDraftPiece(
  x,
  y
){

  if(draftRound === 2){

    return currentTurn==="black"
      ? y===8
      : y===0;
  }

  return currentTurn==="black"
    ? y===7
    : y===1;
}
  
function finishDraft(){

  isDraftPhase = true;

  currentTurn =
  "black";

  alert(
    "配置フェーズ開始"
  );

  render();
}

function randomThree(array){

  const pool = [...array];

  const result = [];

  while(result.length < 3){

    const index = Math.floor(
      Math.random() * pool.length
    );

    result.push(
      pool.splice(index,1)[0]
    );
  }

  return result;
}
    
//========================
// 通常ゲーム
//========================
    
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

    case "騎":
      return "rider";

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
  
  const bishopReady =
    pieces.find(
      p =>
        p.type === "角" &&
        p.team === currentTurn &&
        p.bishopWarpReady
    );

  if(
    bishopReady &&
    clickedPiece &&
    clickedPiece.id !== bishopReady.id
  ){

    alert(
      "角の特殊スキル待機中"
    );

    return;
  }
  
  if(skillMode){
    handleSkillClick(x,y);
    return;
  }
  
  if(isDraftPhase){

    if(!placingDraftPiece){
      return;
  }
    
    if(!canPlaceDraftPiece(x,y)){
      return;
  }

    if(getPieceAt(x,y)){
      return;
    }

    placeDraftPiece(
      selectedDraftPiece,
      x,
      y,
      currentTurn
    );

    return;
  }

  const clickedPiece =
  getPieceAt(x,y);

  if(wiseMoveAfterSkill){

    if(clickedPiece !== skillPiece){

      return;
    }
  }

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
    showSkillButtons(clickedPiece);

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

    case "wiseRebellion":

      placeWiseField(
        skillPiece,
        x,
        y,
        "rebellionField"
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
    
    case "summonRider":

      if(
        summonRider(
        skillPiece,
        x,
        y
        )
        ){
      finishSkill();
      break;
      }
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
    clickedPiece &&
    ownerOf(clickedPiece) === currentTurn
  ){

    capturePiece(piece,target);
  }

  piece.x = x;
  piece.y = y;
  
  if(
    piece.type === "角" &&
    piece.bishopWarpReady
  ){
    bishopReturnWarp(piece);
  }
  else{
    applyFieldEffects(piece);
  }

  if(piece.type === "飛"){

    piece.remainingActions--;

    if(piece.remainingActions > 0){

      selectedPiece = piece;

      render();
      highlightMoves(piece);
      
      return;
    }
  }

  if(wiseMoveAfterSkill){

    wiseMoveAfterSkill = false;

    piece.canMoveAfterSkill = false;

    endTurn();

    return;
  }
  endTurn();
}

function endTurn(){

  const oldTurn =
  currentTurn;

  currentTurn =
  currentTurn === "black"
  ? "white"
  : "black";

  if(
    oldTurn === "white" &&
    currentTurn === "black"
  ){

    processRoundEnd();
    
    updateWiseBuff();
  }

  selectedPiece = null;

  updateFields();

  render();
}

function processRoundEnd(){

  roundCount++;
  
  kingRestLine =
    Math.floor(
      Math.random()*9
    );
  
  kingRestRow =
    Math.floor(
      Math.random()*9
    );

  kingRestCol =
    Math.floor(
      Math.random()*9
    );
  
  for(const p of pieces){

    if(p.restTurns > 0){

      p.restTurns--;
    }

    if(
      p.turnLife !== null
    ){

      p.turnLife--;

      if(p.turnLife <= 0){

        removePiece(p);
      }
    }
  }
  fields = fields.filter(f=>{

    if(f.duration === undefined){

      return true;
    }

    f.duration--;

    return f.duration > 0;
  });
}

function capturePiece(attacker,target){
  const princess =
    pieces.find(
      p =>
        p.team === target.team &&
        p.type === "姫" &&
        !p.isSubstituteUsed
    );

  attacker.killCount++;

  if(attacker.type === "玉"){

    target.team = attacker.team;

    target.converted = true;
    
    return;
  }
  
  if(target.type === "姫"){
    removePiece(attacker);
  }
  if(
    princess &&
    target.type !== "姫"
  ){

    princess.isSubstituteUsed = true;

    removePiece(princess);

    return;
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

function ownerOf(piece){

  return (
    piece.controlledBy ??
    piece.team
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
      return orthogonal(piece,3);

    case "lance":
      return orthogonal(piece,1);

    case "knight":
      if(isOnBuffField(piece)){
        return orthogonal(piece,2);
      }
      return orthogonal(piece,1);

    case "rider":
      return riderMoves(piece);

    case "bishop":
      return diagonal(piece,6);

    case "rook":

      // 1回目
      if(piece.remainingActions === 2){

        return orthogonal(piece,4);
      }

      // 2回目（強化）
      if(isOnBuffField(piece)){

        return [

          ...orthogonal(piece,2),
          ...diagonal(piece,2)
        ];
      }

  // 2回目（通常）
      return orthogonal(piece,2);
      
    case "gold":
      return goldMoves(piece);
    
    case "cannon":
      return orthogonal(piece,1);
    
    case "princess":
      if(isOnBuffField(piece)){
        return diagonal(piece,3);
      }
      return diagonal(piece,2);
      
    case "wise":
      return around(piece,2);
      
    case "king":
      return orthogonal(piece,2);

    case "jewel":
      return orthogonal(piece,2);

    default:
      return [];
  }
}

function pawnMoves(piece){

  let effectiveKills =
  piece.killCount;

  if(isOnBuffField(piece)){

    effectiveKills++;
  }

  if(effectiveKills === 0){

    return orthogonal(piece,3);
  }

  if(effectiveKills === 1){

    return [

      ...orthogonal(piece,4),

      ...diagonal(piece,4)
    ];
  }

  return around(piece,4);
}

function riderMoves(piece){
  
  const result = [];

  const dir =
  piece.team === "black"
  ? -1
  : 1;

  for(let i=1;i<=9;i++){

    const x = piece.x;
    const y = piece.y + dir*i;

    if(!inside(x,y)){
      continue;
    }

    addMove(
      result,
      piece,
      x,
      y
    );
  }
  return result;
}

function goldMoves(piece){

  const result = [];

  const normal = [
    [-2,-3],[-1,-3],[1,-3],[2,-3],

    [-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],

    [-1,-1],[1,-1],

    [-1,1],[1,1],

    [-2,2],[-1,2],[0,2],[1,2],[2,2],

    [-2,3],[-1,3],[1,3],[2,3]
  ];

  const buff = [
    [-1,-1],[0,-1],[1,-1],
    [-1,0],[1,0],
    [-1,1],[0,1],[1,1]
  ];

  for(const [dx,dy] of normal){

    addMove(
      result,
      piece,
      piece.x + dx,
      piece.y + dy
    );
  }

  if(isOnBuffField(piece)){

    for(const [dx,dy] of buff){

      addMove(
        result,
        piece,
        piece.x + dx,
        piece.y + dy
      );
    }
  }

  return result;
}

function isOnBuffField(piece){

  return fields.some(
    f =>
      f.type === "buffField" &&
      f.team === piece.team &&
      f.x === piece.x &&
      f.y === piece.y
  );
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
    
//========================
// フィールド
//========================
    
function updateFields(){

  fields = [];

  for(const piece of pieces){

    if(piece.type === "香"){

      for(let y=0;y<9;y++){

        for(let x=0;x<9;x++){

          fields.push({

            type:"buffField",
            team:piece.team,
            x,
            y
          });
        }
      }
    }

    if(
      piece.type === "角" &&
      isOnBuffField(piece)
    ){

      createRadiusField(
        piece,
        1,
        "warpField"
      );
    }
    
    if(
      piece.type === "騎" &&
      isOnBuffField(piece)
    ){

      createRadiusField(
        piece,
        1,
        "warpField"
      );
    }
    
    if(piece.type === "砲"){
      createCannonField(piece);
    }

    if(piece.type === "王"){

      createRadiusField(
        piece,
        1,
        "deathField"
      );
      createKingWarpField(piece);
    }
    
    if(kingRestLine !== null){

      for(let x=0;x<9;x++){

        fields.push({

          type:"restField",
          x,
          y:kingRestLine
        });
      }
      
      if(isOnBuffField(piece)){

        for(let x=0;x<9;x++){

          fields.push({
  
            type:"restField",
            x,
            y:kingRestRow
          });
        }

        for(let y=0;y<9;y++){

          fields.push({
      
            type:"restField",
            x:kingRestCol,
            y
          });
        }
      }
    }

    if(piece.type === "玉"){

      createRebellionField(piece);
    }
  }
}

function updateWiseBuff(){

  const allies =
  pieces.filter(
    p => p.type !== "賢"
  );

  const wisePieces =
  pieces.filter(
    p => p.type === "賢"
  );

  for(const wise of wisePieces){

    const teamAllies =
    allies.filter(
      p => p.team === wise.team
    );

    if(teamAllies.length===0){
      continue;
    }

    const target =
    teamAllies[
      Math.floor(
        Math.random()
        * teamAllies.length
      )
    ];

    fields.push({
      type:"buffField",
      team:wise.team,
      x:target.x,
      y:target.y,
      duration:1
    });
  }
}

function applyFieldEffects(piece){
      
  const field =
    fields.find(
      f =>
        f.x === piece.x &&
        f.y === piece.y
    );
  
  if(piece.type === "姫"){
    reflectFieldEffects(piece);
    return;
  }
      
  if(!field){
    return;
  }

  if(field.type === "warpField"){
    applyWarpField(piece);
  }

  if(field.type === "restField"){
    applyRestField(piece);
  }

  if(field.type === "rebellionField"){
    applyRebellionField(piece);
  }

  if(field.type === "deathField"){
    applyDeathField(
      piece,
      field
    );
  }
}

function applyWarpField(piece){
  if(piece.type === "角" ||
     piece.type === "王"
    ){
    return;
  }

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
  if(piece.type === "銀" ||
     piece.type === "角" ||
     piece.type === "金" ||
     piece.type === "王"
    ){
    return;
  }
      
  if(piece.restTurns <= 0){
    piece.restTurns = 1;
  }
}
    
function applyRebellionField(piece){

  const field =
  fields.find(
    f =>
      f.x === piece.x &&
      f.y === piece.y &&
      f.type === "rebellionField"
  );
  
  if(
    piece.type === "王" ||
    piece.type === "賢"
  ){
    return;
  }

  if(!field){
    return;
  }

  if(field.team === piece.team){
    return;
  }

  piece.controlledBy =
  field.team;

  piece.controlTurns = 1;
}

function applyDeathField(piece){

  if(piece.type === "王" ||
     piece.type === "姫"
    ){
    return;
  }

  if(
    piece.team === field.team
    ){
    return;
  }

  removePiece(piece);

  checkWinner();
}

function reflectFieldEffects(princess){

  const field =
  fields.find(
    f =>
      f.x === princess.x &&
      f.y === princess.y
  );

  if(!field){
    return;
  }

  if(field.type === "rebelField"){
    return;
  }

  for(const piece of pieces){

    if(piece.team === princess.team){
      continue;
    }

    if(field.type === "warpField"){

      applyWarpField(piece);
    }

    if(field.type === "restField"){

      applyRestField(piece);
    }

    if(field.type === "rebelField"){

      applyRebelField(piece);
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
      team:piece.team,
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

function createCannonField(piece){

  const dir =
  piece.team === "black"
  ? -1
  : 1;

  const pattern = [

    [0,1],

    [0,2],

    [-1,3],[0,3],[1,3],

    [-1,4],[0,4],[1,4],

    [-2,5],[-1,5],[0,5],[1,5],[2,5],

    [-1,6],[0,6],[1,6]
  ];

  if(isOnBuffField(piece)){

    pattern.push(
      [-2,4],[2,4],
      [-2,3],[2,3]
    );
  }

  for(const [dx,dy] of pattern){

    const x = piece.x + dx;
    const y = piece.y + dir * dy;

    if(!inside(x,y)){
      continue;
    }

    fields.push({
      type:"restField",
      x,
      y
    });
  }
}

function createKingWarpField(piece){

  for(let i=1;i<=3;i++){

    addField(
      piece.x+i,
      piece.y+i,
      "warpField"
    );

    addField(
      piece.x+i,
      piece.y-i,
      "warpField"
    );

    addField(
      piece.x-i,
      piece.y+i,
      "warpField"
    );

    addField(
      piece.x-i,
      piece.y-i,
      "warpField"
    );
  }
}

function createRebellionField(piece){

  const dir =
  piece.team === "black"
  ? -1
  : 1;

  const pattern = [

    [-1,1],[0,1],[1,1],

    [-2,2],[-1,2],[0,2],[1,2],[2,2],

    [-3,3],[-2,3],[-1,3],[0,3],[1,3],[2,3],[3,3],

    [-2,4],[-1,4],[0,4],[1,4],[2,4],
  ];

  for(const [dx,dy] of pattern){

    const x = piece.x + dx;
    const y = piece.y + dir * dy;

    if(!inside(x,y)){
      continue;
    }

    fields.push({
      type:"rebellionField",
      x,
      y,
      team:piece.team
    });
  }
}
    
//========================
// 特殊スキル
//========================
    
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
        
    if(isOnBuffField(piece)){

      addSkillButton(
        "反逆配置",
        ()=>{
          skillMode = "wiseRebellion";
          skillPiece = piece;
        }
      );
    }
  }
      
  if(piece.type === "桂"){
    addSkillButton(
      "騎召喚",
      ()=>{

        skillMode =
          "summonRider";

        skillPiece =
          piece;

        highlightSkillTargets(piece);
      }
    );
  }
      
  if(piece.type === "角"){

    addSkillButton(
      "帰還ワープ",
      ()=>{

        if(
          piece.bishopWarpUses <= 0
        ){
          alert("使用回数切れ");
          return;
        }

        piece.bishopWarpReady = true;

        alert(
          "次の行動後にワープ"
        );
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


function rollSilverUnit(){

  const total =
  SILVER_GACHA.reduce(
    (a,b)=>a+b.weight,
    0
  );

  let r =
  Math.random()*total;

  for(const item of SILVER_GACHA){

    r -= item.weight;

    if(r<=0){
      return item.type;
    }
  }

  return "歩";
}

function useBuffedSilverSkill(){

  const randomType =
  rollSilverUnit();

  skillMode =
  "silverBuff";

  skillTargets = [];

  skillSpawnTypes = [
    "歩",
    randomType
  ];
}

function highlightSkillTargets(piece){

  render();

  const cells =
  document.querySelectorAll(".cell");

  // 桂
  if(piece.type === "桂"){

    const targetY =
    piece.team === "black"
    ? 8
    : 0;

    cells.forEach(cell=>{

      const x =
      Number(cell.dataset.x);

      const y =
      Number(cell.dataset.y);

      if(y !== targetY){
        return;
      }

      if(getPieceAt(x,y)){
        return;
      }

      cell.classList.add("highlight");
    });
  }

  if(piece.type === "銀"){

    const targets =
      around(piece,1);

    targets.forEach(move=>{

      cells.forEach(cell=>{

        if(
          Number(cell.dataset.x) === move.x &&
          Number(cell.dataset.y) === move.y
        ){

          if(!getPieceAt(move.x,move.y)){
            cell.classList.add("highlight");
          }
        }
      });
    });
  }

  if(piece.type === "賢"){
    
    cells.forEach(cell=>{

    cell.classList.add("highlight");
    });
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
  
function summonRider(
  piece,
  x,
  y
){

  if(piece.summonedCount >= 5){

    alert(
      "これ以上召喚できません"
    );

    return false;
  }

  // 黒は最下段
  if(
    piece.team === "black" &&
    y !== 8
  ){

    alert(
      "最下段に置いてください"
    );

    return false;
  }

  // 白は最上段
  if(
    piece.team === "white" &&
    y !== 0
  ){

    alert(
      "最上段に置いてください"
    );

    return false;
  }

  if(getPieceAt(x,y)){

    alert(
      "そのマスには置けません"
    );

    return false;
  }

  pieces.push(

    createPiece({

      type:"騎",

      team:piece.team,

      x,
      y,

      moveType:"rider"
    })
  );

  piece.summonedCount++;

  render();

  return true;
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
  
  if(fieldType === "rebellionField"){

    if(piece.rebellionFieldUses <= 0){

      alert("反逆設置回数切れ");
      return;
    }

    piece.rebellionFieldUses--;
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

  function finishWiseFieldSkill(){

    skillMode = null;
    
    skillPiece.canMoveAfterSkill = true;

    wiseMoveAfterSkill = true;

    render();
  }

function bishopReturnWarp(piece){

  piece.bishopWarpReady = false;

  piece.bishopWarpUses--;

  alert(
    "特殊スキルの効果によりワープ"
  );

  const targetY =
  piece.team === "black"
  ? 7
  : 1;

  const candidates = [];

  for(let x=0;x<9;x++){

    if(!getPieceAt(x,targetY)){

      candidates.push(x);
    }
  }

  if(candidates.length === 0){
    return;
  }

  const randomX =

  candidates[
    Math.floor(
      Math.random()
      * candidates.length
    )
  ];

  piece.x = randomX;
  piece.y = targetY;
}

document
.getElementById("resetBtn")
.addEventListener(
  "click",
  setupGame
);

setupGame();

const BOARD_SIZE = 9;

const boardEl =
document.getElementById("board");

const turnDisplay =
document.getElementById("turnDisplay");

let currentTurn = "black";

let roundCount = 1;

let selectedPiece = null;

let selectedCell = null;

let pieces = [];

let fields = [];

let skillMode = null;

let skillPiece = null;

let skillTargets = [];

let skillSpawnTypes = [];

let kingRestLine=null;

let kingRestRow=null;

let wiseMoveAfterSkill = false;

let draftRound = 1;

let isDraftPhase=false;

let draftOrder = [];

let draftPickIndex = 0;

let blackDraft=[];

let whiteDraft=[];

let placedCount={};

let selectedDraftPiece = null;

let placingDraftPiece = false;

let currentDraftChoices = [];

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

    killCount:0,    
    
    summonedCount:0,
    
    restTurns:0,

    isSubstituteUsed:false,

    remainingActions:2,
    
    warpFieldUses:3,
    
    restFieldUses:3,
    
    rebellionFieldUses:2,
  
    bishopWarpUses:2,

    bishopWarpReady:false,

    buffTurns:0,

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
      
      const fieldList =
        fields.filter(f=>f.x===x&&f.y===y);
      const types = fieldList.map(...)
      
      if(types.includes("warpField")){cell.classList.add("warpField");}
      if(types.includes("restField")){cell.classList.add("restField");}
      if(types.includes("rebellionField")){cell.classList.add("rebellionField");}
      if(types.includes("deathField")){cell.classList.add("deathField");}
      
      if(fieldList.length >= 2){
        let icon = "";
        if(types.includes("deathField")){icon += "☠️";}
        if(types.includes("restField")){icon += "🚫";}
        if(types.includes("rebellionField")){icon += "💫";}
        if(types.includes("warpField")){icon += "🌀";}
        cell.innerHTML += `
        <div class="fieldIcon">
        ${icon}
        </div>
        `;
        cell.classList.add("multiField");
      }
      
      const piece =
        getPieceAt(x,y);
      if(piece){
        cell.innerHTML = `
        <div class="piece ${ownerOf(piece)}">
        <div class="badge-top"></div>
        <div class="piece-body">${piece.type}</div>
        <div class="badge-bottom"></div>
        </div>
        `;

        const pieceDiv=cell.querySelector(".piece");
        if(piece.team==="white"){
          pieceDiv.style.transform="rotate(180deg)";
        }
        
        if(piece.restTurns>0){
          cell.classList.add("resting");
          pieceDiv.querySelector(".badge-bottom").textContent=
            "🚫"+piece.restTurns;
        }
        
        let rotation = piece.team==="white" ? 180 : 0;
        if(piece.controlTurns>0){
          cell.classList.add("controlled");
          rotation += 180;
          pieceDiv.querySelector(".badge-bottom").textContent=
            "🌀"+piece.controlTurns;
        }
        pieceDiv.style.transform=`rotate(${rotation}deg)`;
        
        if(piece.type==="香"){
          pieceDiv.querySelector(".badge-top").textContent="⚔️";
        }else if(piece.buffTurns>0){
          pieceDiv.querySelector(".badge-top").textContent=
            "⚔️"+piece.buffTurns;
        }
      }
      
      if(fieldList.length >= 2){
        cell.innerHTML += `
        <div class="fieldIcon">
        ${icon}
        </div>`;
      }
      if(
        selectedCell &&
        selectedCell.x===x &&
        selectedCell.y===y
      ){
        cell.classList.add("selected");
      }

      cell.onclick = () => onCellClick(x,y);

      boardEl.appendChild(cell);

      if(
        isDraftPhase &&
        placingDraftPiece &&
        canPlaceDraftPiece(x,y) &&
        !getPieceAt(x,y)
      ){
        cell.classList.add("highlight");
      }
    }
  }

  if(!selectedPiece && !selectedCell){
    updatePieceInfo(null);
  }
  
  document
    .getElementById("startBtn")
    .onclick=()=>{
      document
        .getElementById("startBtn")
        .style.display="none";
      document
        .getElementById("draftUI")
        .style.display="block";
      startDraft();
    };
}

//========================
// ドラフト
//========================

function startDraft(){

  blackDraft = [];
  whiteDraft = [];
  
  draftRound = 1;
  draftPickIndex = 0;
  
  placingDraftPiece = false;
  selectedDraftPiece = null;

  setDraftOrder();
  
  currentDraftChoices =
    getCurrentDraftChoices();
  
  showDraftChoices();
}

function setDraftOrder(){

  if(draftRound === 1){

    draftOrder = [
      "black",
      "white"
    ];
  }

  else if(draftRound === 2){

    draftOrder = [
      "black",
      "white"
    ];
  }

  else{

    draftOrder = [
      "white",
      "black"
    ];
  }
}

function showDraftChoices(){

  const player =
  draftOrder[
    draftPickIndex
  ];

  const choices =
    currentDraftChoices;

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
    `第${draftRound}ラウンド　${player} のピック`;
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

    if(draftRound < 4){
      
      setDraftOrder();
      currentDraftChoices =
        getCurrentDraftChoices();
    }

    if(draftRound >= 4){
      
      isDraftPhase = false;
      document.getElementById("draftUI").style.display = "none";
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
  
  const clickedPiece =
  getPieceAt(x,y);

  const bishopReady =
    pieces.find(
      p =>
        p.type === "角" &&
        p.team === currentTurn &&
        p.bishopWarpReady
    );
  
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
  if(skillMode){
    handleSkillClick(x,y);
    return;
  }
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
  if(wiseMoveAfterSkill){
    if(clickedPiece !== skillPiece){
      return;
    }
  }

  if(clickedPiece){
    if(ownerOf(clickedPiece)===currentTurn){
      selectedPiece = clickedPiece;
      selectedCell = null;
      updatePieceInfo(clickedPiece);
      render();
      if(clickedPiece.restTurns===0){
        highlightMoves(clickedPiece);
        showSkillButtons(clickedPiece);
      }else{
        alert("この駒は休み中");
      }
      return;
    }
  }
  if(!clickedPiece){
    if(selectedPiece){
      const moves = generateMoves(selectedPiece);
      const canMove = moves.some(
        m => m.x===x && m.y===y
      );
      if(canMove){
        movePiece(selectedPiece,x,y);
        return;
      }
    }
    selectedPiece=null;
    selectedCell = {x,y};
    updateFieldInfo(x,y);
    render();
    return;
  }
  
  selectedPiece = null;
  selectedCell = {x,y};
  updateFieldInfo(x,y);
  render();
}

function handleSkillClick(x,y){

  switch(skillMode){

    case "wiseWarp":

      if(placeWiseField(skillPiece, x, y, "warpField")){
        finishWiseFieldSkill();
     }

      break;

    case "wiseRest":

      if(placeWiseField(skillPiece, x, y, "restField")){
        finishWiseFieldSkill();
     }

      break;

    case "wiseRebellion":

      if(placeWiseField(skillPiece, x, y, "rebellionField")){
        finishWiseFieldSkill();
     }

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

    case "silverBuff":

      silverTargetClick(
        x,
        y,
        skillSpawnTypes
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
  const target = getPieceAt(x,y);
  if( target && ownerOf(target)!==ownerOf(piece)){
    capturePiece(piece,target);
  }
  piece.x = x;
  piece.y = y;
  if(piece.type==="王"){
    kingRestLine=Math.floor(Math.random()*9);
    kingRestRow=null;
    if(isBuffed(piece)){
      do{
        kingRestRow=Math.floor(Math.random()*9);
      }while(kingRestRow===kingRestLine);
    }
    updateFields(true);
  }
  
  if(piece.type === "角" && piece.bishopWarpReady){
    render();
    setTimeout(()=>{
      bishopReturnWarp(piece);
      render();
      setTimeout(()=>{
        endTurn();
      },400);
    },400);
    return;
  }else{
    updateFields(true);
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
  
  for(const piece of pieces){
    if(piece.type==="飛"){
        piece.remainingActions=2;
    }
  }
  
  selectedPiece = null;

  updatePieceInfo(null);

  updateFields();

  render();
}

function processRoundEnd(){

  kingRestLine = null;
  kingRestRow = null;

  roundCount++;
  
  for(const p of [...pieces]){

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
    
    if(p.controlTurns>0){

      p.controlTurns--;

      if(p.controlTurns===0){

        p.controlledBy=null;
      }
    }
  }
  
  fields =
fields.filter(field=>{

    if(!field.ownerId){

        return true;
    }

    if(field.duration===Infinity){

        return true;
    }

    field.duration--;

    return field.duration>0;
});
}

function capturePiece(attacker,target){
  if(!target){
    return;
  }
  const princess =
    pieces.find(
      p =>
        p.team === target.team &&
        p.type === "姫" &&
        !p.isSubstituteUsed
    );

  attacker.killCount++;
  
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

  if(teams.length ===1){

    alert(
      `${teams[0]} の勝利！`
    );
  }

  if(teams.length ===0){
    alert("引き分け");
    return;
  }
}

function removePiece(piece){

  pieces =
  pieces.filter(
    p => p.id !== piece.id
  );

if(selectedPiece?.id===piece.id){
    selectedPiece=null;
}

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
      if(isBuffed(piece)){
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
      if(isBuffed(piece)){

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
      if(isBuffed(piece)){
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

  if(isBuffed(piece)){

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

  if(isBuffed(piece)){

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
        ownerOf(target)!==ownerOf(piece)
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
    ownerOf(target)!==ownerOf(piece)
  ){

    result.push({x,y});
  }
}

function highlightMoves(piece){
  const moves = generateMoves(piece);
  moves.forEach(move=>{
    const cell = document.querySelector(
      `[data-x="${move.x}"][data-y="${move.y}"]`
    );
    if(cell){
      cell.classList.add("highlight");
    }
  });
}
    
//========================
// フィールド
//========================

function applySingleField(piece, field){
  switch(field.type){
    case "deathField":
      applyDeathField(piece, field);
      break;
    case "restField":
      applyRestField(piece, field);
      break;
    case "rebellionField":
      applyRebellionField(piece, field);
      break;
    case "warpField":
      applyWarpField(piece, field);
      break;
  }
}

function applyFieldEffects(piece){
  const fieldList =
    fields.filter(
      f=>f.x===piece.x && f.y===piece.y
    );
  if(piece.type==="姫"){
    reflectFieldEffects(piece);
    return;
  }
  if(fieldList.length===0){
    return;
  }
  // 優先順位
  const priority = [
    "deathField",
    "restField",
    "rebellionField",
    "warpField"
  ];
  fieldList.sort(
    (a,b)=>
      priority.indexOf(a.type)-
      priority.indexOf(b.type)
  );
  for(const field of fieldList){
    applySingleField(piece,field);
    if(!pieces.includes(piece)){
      return;
    }
  }
}

function triggerField(field){
  for(const piece of [...pieces]){
    if(piece.x!==field.x) continue;
    if(piece.y!==field.y) continue;
    if(piece.type==="姫"){
      reflectFieldEffects(piece);
    }else{
      applySingleField(piece,field);
    }
    if(!pieces.includes(piece)){
      break;
    }
  }
}

function updateFields(trigger=false){
  const king=
    pieces.find(p=>p.type==="王");
  fields =
    fields.filter(
      f=>f.ownerId
    );
  for(const piece of pieces){
    if(
      piece.type === "角" &&
      isBuffed(piece)
    ){
      createRadiusField(piece,1,"warpField",trigger);
    }
    if(
      piece.type === "騎" &&
      isBuffed(piece)
    ){
      createRadiusField(piece,1,"warpField",trigger);
    }
    if(piece.type === "砲"){
      createCannonField(piece,trigger);
    }
    if(piece.type === "王"){
      createRadiusField(piece,1,"deathField",trigger);
      createKingWarpField(piece,trigger);
    }
    
    if(kingRestLine!==null && king){
      for(let x=0;x<9;x++){
        const field={
          type:"restField",
          team:king.team,
          x,
          y:kingRestLine
        };
        fields.push(field);if(trigger){
          triggerField(field);
        }
      }
      if(isBuffed(king)){
        for(let x=0;x<9;x++){
          const field={
            type:"restField",
            team:king.team,
            x,
            y:kingRestRow
          };
          fields.push(field);if(trigger){
            triggerField(field);
          }
        }
      }
    }
    if(piece.type === "玉"){
      createRebellionField(piece,trigger);
    }
  }
}

function updateWiseBuff(){

  // 全員の強化をリセット

  for(const p of pieces){

    if(p.buffTurns>0){
       p.buffTurns--;
    }

  }

  const wisePieces =

    pieces.filter(p => p.type === "賢");

  for(const wise of wisePieces){

    const allies =

      pieces.filter(

        p =>

          p.team === wise.team &&

          p.type !== "賢"

      );

    if(allies.length === 0){

      continue;

    }

    const target =

      allies[

        Math.floor(

          Math.random()*allies.length

        )

      ];

    target.buffTurns=1;

  }

}

function isBuffed(piece){

    if(piece.buffTurns>0) return true;

    return pieces.some(

        p=>

            p.type==="香" &&

            p.team===piece.team

    );

}

function applyWarpField(piece,field){

  if(field.team===piece.team){
    return;
  }

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
    
function applyRestField(piece,field){ 
  
  if(field.team===piece.team){
    return;
  }
  
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
    
function applyRebellionField(piece,field){
  
  if(field.team===piece.team){
    return;
  }
  
  if(
    piece.type === "王" ||
    piece.type === "賢"
  ){
    return;
  }

  if(!field){
    return;
  }

  piece.controlledBy =
  field.team;

  piece.controlTurns = 1;
}

function applyDeathField(piece,field){

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
  const list = fields.filter(
    f=>f.x===princess.x && f.y===princess.y
  );
  if(list.length===0){
    return;
  }
  for(const field of list){
    if(field.type==="rebellionField"){
      continue;
    }
    for(const piece of [...pieces]){
      if(piece.team===princess.team){
        continue;
      }
      switch(field.type){
        case "warpField":
          applyWarpField(piece,field);
          break;
        case "restField":
          applyRestField(piece,field);
          break;
        case "deathField":
          applyDeathField(piece,field);
          break;
      }
    }
  }
}

function createRadiusField(piece,radius,type,trigger = false){
  for(let dx=-radius;dx<=radius;dx++){
    for(let dy=-radius;dy<=radius;dy++){
      const x = piece.x + dx;
      const y = piece.y + dy;
      if(!inside(x,y)){
        continue;
      }
      const field = {
        type,
        team: piece.team,
        x,
        y,
        trigger:"enter"
      };
      fields.push(field);
      if(trigger){
        triggerField(field);
      }
    }
  }
}

function addField(x,y,type,team,duration,trigger=false){
  if(!inside(x,y)){
    return;
  }
  const field={
    type,team,x,y,duration
  };
  fields.push(field);
  if(trigger){
    triggerField(field);
  }
}

function createCannonField(piece,trigger=false){
  const dir =
  piece.team === "black"
  ? -1
  : 1;
  const pattern = [
    [0,1],[0,2],[-1,3],[0,3],[1,3],[-1,4],[0,4],[1,4],[-2,5],[-1,5],[0,5],[1,5],[2,5],[-1,6],[0,6],[1,6]
  ];
  if(isBuffed(piece)){
    pattern.push(
      [-2,4],[2,4],[-2,3],[2,3]
    );
  }
  for(const [dx,dy] of pattern){
    const x = piece.x + dx;
    const y = piece.y + dir * dy;
    if(!inside(x,y)){
      continue;
    }
    const field={
      type:"restField",
      team:piece.team,
      x,
      y
    };
    fields.push(field);
    if(trigger){
      triggerField(field);
    }
  }
}

function createKingWarpField(piece,trigger=false){
  for(let i=1;i<=3;i++){
    addField(
      piece.x+i,
      piece.y+i,
      "warpField",
      piece.team
    );
    addField(
      piece.x+i,
      piece.y-i,
      "warpField",
      piece.team
    );
    addField(
      piece.x-i,
      piece.y+i,
      "warpField",
      piece.team
    );
    addField(
      piece.x-i,
      piece.y-i,
      "warpField",
      piece.team
    );
  }
}

function createRebellionField(piece,trigger=false){
  const dir =
    piece.team === "black"
    ? -1
    : 1;
  const pattern = [ 
    [-1,1],[0,1],[1,1],[-2,2],[-1,2],[0,2],[1,2],[2,2],[-3,3],[-2,3],[-1,3],[0,3],[1,3],[2,3],[3,3],[-2,4],[-1,4],[0,4],[1,4],[2,4],
  ];
  for(const [dx,dy] of pattern){
    const x = piece.x + dx;
    const y = piece.y + dir * dy;
    if(!inside(x,y)){
      continue;
    }
    const field={
    type:"rebellionField",x,y,team:piece.team
    };
    fields.push(field);
    if(trigger){
      triggerField(field);
    }
  }
  if(isBuffed(piece)){
    createRadiusField(
      piece,1,"rebellionField"
    );
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
        
    if(isBuffed(piece)){

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

if(isBuffed(piece)){
        
    addSkillButton(
      "歩+ランダム１コマ",
      ()=>{
          useBuffedSilverSkill();
          skillPiece = piece;
      }
    ); 
}else{

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

function placeWiseField(piece,x,y,fieldType){
  if(piece.type !== "賢"){
    return false;
  }
  if(fieldType === "rebellionField"){
    if(piece.rebellionFieldUses <= 0){
      alert("反逆設置回数切れ");
      return false;
    }
    piece.rebellionFieldUses--;
  }
  if(fieldType === "warpField"){
    if(piece.warpFieldUses <= 0){
      alert("ワープ設置回数切れ");
      return false;
    }
    piece.warpFieldUses--;
  }
  else if(fieldType === "restField"){
    if(piece.restFieldUses <= 0){
      alert("休み設置回数切れ");
      return false;
    }
    piece.restFieldUses--;
  }
  
  const field={
    type:fieldType,
    team:piece.team,
    x,
    y,
    duration:
      fieldType==="rebellionField"
      ?1
      :Infinity,
    ownerId:piece.id
  };
  
  fields.push(field);
  triggerField(field);
  render();
  return true;
}

function finishWiseFieldSkill(){
  skillMode = null;
  wiseMoveAfterSkill = true;
  updateFields();
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
    )];
  const target=getPieceAt(randomX,targetY);
  piece.x = randomX;
  piece.y = targetY;
  if(
    target &&
    ownerOf(target)!==ownerOf(piece)
  ){
    capturePiece(piece,target);
  }
  updateFields(true);
}

//========================
// 表示
//========================

function updatePieceInfo(piece){

    const info =
    document.getElementById("pieceInfo");

    if(!piece){

        info.innerHTML="コマ未選択";
        return;
    }

    info.innerHTML=
`
<h3>${piece.type}</h3>

<b>状態</b><br>
${getStatusText(piece)}

<hr>

<b>移動</b><br>
${getMoveDescription(piece)}

<hr>

<b>スキル</b><br>
${getSkillDescription(piece)}

<hr>

<b>特殊スキル</b><br>
${getUniqueDescription(piece)}
`;
}

function getStatusText(piece){

    let text=[];

    if(piece.restTurns>0){

        text.push(
        `🚫休み ${piece.restTurns}`);
    }

    if(piece.controlTurns>0){

        text.push(
        `🌀反逆 ${piece.controlTurns}`);
    }

    if(isBuffed(piece)){

        text.push(
        `⚔️強化 ${piece.buffTurns}`);
    }

    if(piece.type=="香"){

        text.push("⚔️全体強化");
    }

    if(text.length==0){

        return "なし";
    }

    return text.join("<br>");
}

function getMoveDescription(piece){

    switch(piece.type){

        case "歩":

            if(piece.killCount>=2){
                return "周囲４";
            }

            if(piece.killCount===1){
                return "たてよこななめ４";
            }

            return "たてよこ３";

        case "銀":
            return "たてよこ３";

        case "香":
            return "たてよこ１";

        case "桂":
            return isBuffed(piece)
                ? "たてよこ２"
                : "たてよこ１";

        case "騎":
            return "正面９";

        case "角":
            return "ななめ６";

        case "飛":
            return isBuffed(piece)
                ? "たてよこ４→たてよこななめ２(2回行動)"
                : "たてよこ４→たてよこ２(2回行動)"; 

        case "金":
            return isBuffed(piece)
                ? "通常＋周囲１"
                : "特殊移動";

        case "砲":
            return isBuffed(piece)
                ? "たてよこ２"
                : "たてよこ１";

        case "姫":
            return isBuffed(piece)
                ? "ななめ３"
                : "ななめ２";

        case "賢":
            return "周囲２";

        case "王":
        case "玉":
            return "たてよこ２";
    }

    return "";
}

function getSkillDescription(piece){

    switch(piece.type){

        case "歩":
            return "なし";

        case "銀":
            return "休み無効";

        case "香":
            return "味方全員を強化";

        case "桂":
            return "なし";

        case "騎":
            return "なし";

        case "角":
            return "ワープ・休み無効";

        case "飛":
            return "なし";

        case "金":
            return "休み無効";

        case "砲":
            return "前方に休みフィールド";

        case "姫":
            return "即死無効、フィールド反射、自分を倒したコマを道連れにして倒す、初めに倒された味方の身代わりになって倒される";

        case "賢":
            return "反逆無効、毎ターンランダムな味方1体を強化";

        case "王":
            return isBuffed(piece)
                ? "ワープ・休み・即死無効、周囲１マスに即死フィールド、ななめ３マスにワープフィールド、行動後ランダムな２列に休みフィールド"
                : "ワープ・休み・即死無効、周囲１マスに即死フィールド、ななめ３マスにワープフィールド、行動後ランダムな１列に休みフィールド";

        case "玉":
            return isBuffed(piece)
                ? "反逆無効、前方扇状・周囲１マスに反逆フィールド"
                : "反逆無効、前方扇状に反逆フィールド";
    }

    return "なし";
}

function getUniqueDescription(piece){

    switch(piece.type){

        case "歩":
            return "なし";

        case "銀":
            return isBuffed(piece)
                ? "歩１体+ランダムなコマ１体に分身"
                : "歩１体or歩１体+香１体に分身";

        case "香":
            return "なし";

        case "桂":
            return "最後列に騎を召喚(最大5体)";

        case "角":
            return "使用後の移動後、２列目のランダムな位置に即時ワープ(2回)";

        case "飛":
            return "なし";

        case "金":
            return "なし";

        case "砲":
            return "なし";

        case "姫":
            return "なし";

        case "賢":
            return isBuffed(piece)
                ? "永続するワープ・休みフィールド(3回)、通常の反逆フィールド(1回)を任意のマス上に配置してから行動"
                : "永続するワープ・休みフィールドを任意のマス上に配置してから行動(3回)";

        case "王":
            return "なし";

        case "玉":
            return "なし";
    }

    return "なし";
}

function updateFieldInfo(x,y){

    const info =
        document.getElementById("pieceInfo");

    const list =
        fields.filter(
            f=>f.x===x&&f.y===y
        );

    let html=
`<h3>マス情報</h3>
(${x},${y})
`;

    if(list.length===0){

        html+=`
<hr>
フィールドなし
`;

        info.innerHTML=html;

        return;
    }

    for(const field of list){

        html+=getFieldDescription(field);
    }

    info.innerHTML=html;
}

function getFieldDescription(field){

    let icon="";
    let name="";
    let effect="";

    switch(field.type){

        case "deathField":

            icon="☠️";
            name="即死";
            effect="敵が踏むと即死";
            break;

        case "restField":

            icon="🚫";
            name="休み";
            effect="敵が踏むと1ターン休み";
            break;

        case "rebellionField":

            icon="💫";
            name="反逆";
            effect="敵が踏むと1ターン寝返る";
            break;

        case "warpField":

            icon="🌀";
            name="ワープ";
            effect="敵が踏むとランダムワープ";
            break;
    }

    const owner =
        field.team===currentTurn
        ? "味方"
        : "敵";

    return `
<hr>

<b>${icon} ${name}</b>

<br>

所有：
<b>${owner}</b>

<br>

${effect}
`;
}

document
.getElementById("resetBtn")
.addEventListener(
  "click",
  setupGame
);

setupGame();

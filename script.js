const BOARD_SIZE = 9;

const boardEl =
document.getElementById("board");

const turnDisplay =
document.getElementById("turnDisplay");

let currentTurn = "black";

let roundCount = 1;

let selectedPiece = null;

let selectedCell = null;

let highlights = [];

let pieces = [];

let fields = [];

let skillMode = null;

let skillPiece = null;

let skillTargets = [];

let skillSpawnTypes = [];

let skillUnlocked = {
    black:false,
    white:false
};

let kingRestLine=null;

let kingRestRow=null;

let wiseMoveAfterSkill = false;

let reviveTarget = null;

let reviveMode = false;

let teamLostCount = {
    black:0,
    white:0
};

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

let battleLogs=[];

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

skillUnlocked = {
    black:false,
    white:false
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

teamLostCount = {
    black:0,
    white:0
};

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

document.getElementById("draftBackBtn").onclick =
    cancelDraftPlacement;

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
      
      const fieldList =
        fields.filter(f=>f.x===x&&f.y===y);
      const types = fieldList.map(f=>f.type);
      
      if(types.includes("warpField")){cell.classList.add("warpField");}
      if(types.includes("restField")){cell.classList.add("restField");}
      if(types.includes("rebellionField")){cell.classList.add("rebellionField");}
      if(types.includes("deathField")){cell.classList.add("deathField");}
      
      let icon = "";
      if(fieldList.length >= 2){
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
        <div class="piece-wrapper">
        <div class="piece ${ownerOf(piece)}">
        <div class="piece-body">${piece.type}</div>
        </div>
        <div class="badge-top"></div>
        <div class="badge-bottom"></div>
        </div>
        `;

        const wrapper = cell.querySelector(".piece-wrapper");
       
        const topBadge = wrapper.querySelector(".badge-top");
        const bottomBadge = wrapper.querySelector(".badge-bottom");

updatePieceAppearance(piece,wrapper);
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

if(
    reviveMode &&
    highlights.some(h => h.x === x && h.y === y)
){
    cell.classList.add("highlight");
}
    }
  }

if(selectedPiece){
    updatePieceInfo(selectedPiece);
}

else if(selectedCell){
    updateFieldInfo(selectedCell.x, selectedCell.y);
}

else if(isDraftPhase && placingDraftPiece){

    updatePieceInfo(
        createPreviewPiece(
            selectedDraftPiece,
            currentTurn
        )
    );
}
else{
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

document.getElementById("draftSelected").textContent = "";

draftBackBtn.style.display = "none";

  choices.forEach(type=>{

    const btn =
    document.createElement(
      "button"
    );

    btn.textContent =
    type;

btn.dataset.type = type;

btn.onmouseenter = ()=>{

    const preview = createPiece({
        type,
        team:player,
        moveType:convertMoveType(type)
    });

    updatePieceInfo(
      createPreviewPiece(type,player)
    );
};

btn.onclick = ()=>{

    document
      .querySelectorAll("#draftButtons button")
      .forEach(b=>b.classList.remove("selected"));

    btn.classList.add("selected");

    pickDraftPiece(player,type);
};

    area.appendChild(btn);
  });

  turnDisplay.textContent =
    `第${draftRound}ラウンド　${player} のピック`;

updatePieceInfo(
    createPreviewPiece(
        choices[0],
        player
    )
);

}
  

function createPreviewPiece(type,team){

    return{

        type,
        team,
        moveType:convertMoveType(type),

        killCount:0,
        restTurns:0,
        controlTurns:0,
        buffTurns:0,

        summonedCount:0,
        bishopWarpUses:2,
        warpFieldUses:3,
        restFieldUses:3,
        rebellionFieldUses:1
    };
}

function pickDraftPiece(player,type){

  selectedDraftPiece = type;

  placingDraftPiece = true;

  draftBackBtn.style.display = "block";

document.getElementById("draftSelected").textContent =
    `${type} を選択中`;

updatePieceInfo(
    createPreviewPiece(type, player)
);

document.getElementById("draftUI").style.visibility="hidden";

document.getElementById("draftBackBtn").style.display = "block";

  currentTurn = player;

  document
    .querySelectorAll("#draftButtons button")
    .forEach(b=>b.classList.remove("selected"));

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

document.getElementById("draftBackBtn").style.display = "none";

if(isDraftPhase){
    document.getElementById("draftUI").style.visibility="visible";
}

  selectedDraftPiece = null;

  draftBackBtn.style.display = "none";

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

function cancelDraftPlacement(){

    placingDraftPiece = false;
    selectedDraftPiece = null;

    document.getElementById("draftUI").style.visibility = "visible";

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
pieces.some(
    p=>
    p.type==="角" &&
    p.team===currentTurn &&
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
    placeDraftPiece(selectedDraftPiece,x,y,currentTurn);
    return;
  }

  if(reviveMode){

    if(highlights.some(h=>h.x===x && h.y===y)){

        reviveTarget.x=x;
        reviveTarget.y=y;

        pieces.push(reviveTarget);

        reviveMode=false;
        reviveTarget=null;

        highlights=[];

        render();
    }
    return;
}

if(skillMode){
    handleSkillClick(x,y);
    return;
  }
  if(
    skillPiece &&
    skillPiece.type==="角" &&
    skillPiece.bishopWarpReady &&
    clickedPiece!==skillPiece
){
    alert("角の特殊スキル待機中");
    return;
}

  if(wiseMoveAfterSkill){
    if(clickedPiece !== skillPiece){
      return;
    }
  }

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
  if(clickedPiece){

if(
    roundCount===1 &&
    ["飛","金","砲","王","玉"].includes(clickedPiece.type)
){
    alert("1ラウンド目に動けないコマです");
    return;
}

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
    selectedPiece=null;
    selectedCell = {x,y};
    updateFieldInfo(x,y);
    render();
    return;
  }
  clearSkillButtons();
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
    clearSkillButtons();
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
  logMove(piece,x,y);
  if(piece.type==="王"){
    kingRestLine=Math.floor(Math.random()*9);
logKingRest(piece,kingRestLine);
    kingRestRow=null;
    if(isBuffed(piece)){
      do{
        kingRestRow=Math.floor(Math.random()*9);
logKingRest(piece,kingRestRow);

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
    for(const field of fields){
      triggerField(field);
    }
  }
  

if(piece.type === "飛"){

    piece.remainingActions--;

    if(
        piece.remainingActions > 0 &&
        piece.restTurns === 0 &&
        piece.controlTurns === 0
    ){
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

  clearSkillButtons();

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

if(!canTeamAct(currentTurn)){

    addLog(`⏭ ${teamName(currentTurn)}は行動できる駒がないためターンをパス`);

    const skipped = currentTurn;

    currentTurn =
        currentTurn==="black"
        ? "white"
        : "black";

    if(skipped==="white"){
        processRoundEnd();
        updateWiseBuff();
    }
}
  
  for(const piece of pieces){
    if(piece.type==="飛"){
        piece.remainingActions=2;
    }
  }
  
  selectedPiece = null;

  updatePieceInfo(null);

  updateFields();

  updateSkillUnlock();

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

function updateSkillUnlock(){

    for(const team of ["black","white"]){

        const shouldUnlock =
            roundCount >= 3 &&
            teamLostCount[team] >= 1;

        if(
            shouldUnlock &&
            !skillUnlocked[team]
        ){
            skillUnlocked[team] = true;

            addLog(
                `✨ ${teamName(team)}チームの特殊スキルが解放！`
            );
        }
    }
}

function canTeamAct(team){

    return pieces.some(piece=>{

        if(ownerOf(piece)!==team) return false;

        if(piece.restTurns>0) return false;

        return generateMoves(piece).length>0;

    });

}

function capturePiece(attacker,target){

  if(!target) return;

  logCapture(attacker,target);

  const princess =
    pieces.find(
      p =>
        p.team === target.team &&
        p.type === "姫" &&
        !p.isSubstituteUsed
    );

  attacker.killCount++;

  if(attacker.type==="歩"){
    logPawnPower(attacker,attacker.killCount);
  }

  // 身代わり
  if(
    princess &&
    target.type !== "姫"
  ){
    logPrincessSacrifice(princess);
    logPrincessSave(princess,target);

    princess.isSubstituteUsed = true;

    removePiece(princess);

    reviveTarget = target;
    reviveMode = true;
    highlightRespawnSquares(piece.team);
    render();

    return;
  }

  // 本当に姫を倒したときだけ道連れ
  if(target.type==="姫"){
    removePiece(target);
    removePiece(attacker);
    logPrincessRevenge(target,attacker);
    checkWinner();
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
      `${teamName(teams[0])} の勝利！`
    );
  }

  if(teams.length ===0){
    alert("引き分け");
    return;
  }
}

function removePiece(piece){
  teamLostCount[piece.team]++;
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
    [-3,-3],[-2,-3],[2,-3],[3,-3],

    [-3,-2],[-2,-2],[-1,-2],[1,-2],[2,-2],[3,-2],

    [-2,-1],[2,-1],

    [-2,1],[2,1],

    [-3,2],[-2,2],[-1,2],[1,2],[2,2],[3,2],

    [-3,3],[-2,3],[2,3],[3,3]
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

function highlightRespawnSquares(team){

    highlights = [];

    const first = team === "black" ? 8 : 0;
    const second = team === "black" ? 7 : 1;

    for(let x=0;x<9;x++){
        if(!getPieceAt(x,first)){
            highlights.push({x,y:first});
        }
    }

    if(highlights.length===0){
        for(let x=0;x<9;x++){
            if(!getPieceAt(x,second)){
                highlights.push({x,y:second});
            }
        }
    }
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

function triggerField(field){

    const princess =
        pieces.find(
            p =>
                p.x===field.x &&
                p.y===field.y &&
                p.type==="姫"
        );

    if(princess){
        reflectField(field, princess);
        return;
    }

    for(const piece of [...pieces]){

        if(piece.x!==field.x) continue;
        if(piece.y!==field.y) continue;

        applySingleField(piece,field);

        if(!pieces.includes(piece)){
            break;
        }
    }
}

function updateFields(trigger=false){
  const processed = new Set();
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
    if(piece.type === "玉"){
      createRebellionField(piece,trigger);
    }
  }

 if(kingRestLine!==null && king){
      for(let x=0;x<9;x++){
        const field={
          type:"restField",
          team:king.team,
          x,
          y:kingRestLine,
          ownerId: king.id
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
            y:kingRestRow,
            ownerId: king.id
          };
          fields.push(field);if(trigger){
            triggerField(field);
          }
        }
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
    logWiseBuff(wise,target);

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

function isImmuneToField(piece, fieldType){

  switch(fieldType){

    case "warpField":
      return ["角","王"].includes(piece.type);

    case "restField":
      return ["銀","角","金","王"].includes(piece.type);

    case "rebellionField":
      return ["王","玉","賢"].includes(piece.type);

    case "deathField":
      return ["王","姫"].includes(piece.type);

    default:
      return false;
  }
}

function applyWarpField(piece,field){

  if(field.team===piece.team){
    return;
  }

  if(
    piece.type==="角" ||
    piece.type==="王"
){
    logGuard(piece,"ワープフィールド");
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
  logWarp(field,piece,target.x,target.y);
}
    
function applyRestField(piece,field){ 
  
  if(field.team===piece.team){
    return;
  }
  
  if(
    piece.type==="銀" ||
    piece.type==="角" ||
    piece.type==="金" ||
    piece.type==="王"
){
    logGuard(piece,"休みフィールド");
    return;
}
  if(piece.restTurns <= 0){
    piece.restTurns = 1;
    logRest(field,piece);
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
    logGuard(piece,"反逆フィールド");
    return;
  }

  if(!field){
    return;
  }

  piece.controlledBy =
  field.team;

  piece.controlTurns = 1;
  logRebellion(field,piece);
}

function applyDeathField(piece,field){

  if(
    piece.type==="王" ||
    piece.type==="姫"
){
    if(field.team !== piece.team){
        logGuard(piece,"即死フィールド");
    }
    return;
}

  if(
    piece.team === field.team
    ){
    return;
  }

  logDeathField(field,piece);
  removePiece(piece);
  checkWinner();
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
        ownerId: piece.id,
        trigger:"enter"
      };
      fields.push(field);
      if(trigger){
        triggerField(field);
      }
    }
  }
}

function addField(x,y,type,team,duration,trigger=false,ownerId=null){
  if(!inside(x,y)){
    return;
  }
  const field={
    type,team,x,y,duration,ownerId
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
      y,
      ownerId: piece.id
    };
    fields.push(field);
    if(trigger){
      triggerField(field);
    }
  }
}

function createKingWarpField(piece,trigger=false){
  for(let i=2;i<=3;i++){
    addField(
      piece.x+i,
      piece.y+i,
      "warpField",
      piece.team,
      1,
      trigger,
      piece.id
    );
    addField(
      piece.x+i,
      piece.y-i,
      "warpField",
      piece.team,
      1,
      trigger,
      piece.id
    );
    addField(
      piece.x-i,
      piece.y+i,
      "warpField",
      piece.team,
      1,
      trigger,
      piece.id
    );
    addField(
      piece.x-i,
      piece.y-i,
      "warpField",
      piece.team,
      1,
      trigger,
      piece.id
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
    type:"rebellionField",x,y,team:piece.team, ownerId: piece.id
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

  clearSkillButtons();

  if(!skillUnlocked[piece.team]){
    return;
  }

  const area =
  
    document.getElementById("skillArea");

  area.innerHTML = "";

  if(piece.type === "賢"){

    addSkillButton(
      "ワープ配置",
      ()=>{

        skillMode="wiseWarp";
        logSkill(piece,"ワープ配置");
            
        skillPiece =
          selectedPiece;
      }
    );

    addSkillButton(
      "休み配置",
      ()=>{

        skillMode ="wiseRest";
        logSkill(piece,"休み配置");

        skillPiece =
          selectedPiece;
      }
    ); 
        
    if(isBuffed(piece)){

      addSkillButton(
        "反逆配置",
        ()=>{
          skillMode = "wiseRebellion";
          logSkill(piece,"反逆配置");
          skillPiece = piece;
        }
      );
    }
  }
      
  if(piece.type === "桂"){
    addSkillButton(
      "騎召喚",
      ()=>{

        skillMode="summonRider";
        logSkill(piece,"騎召喚");

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
        logSkill(piece,"帰還ワープ");

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
          logSkill(piece,"歩+ランダム１コマ");
          skillPiece = piece;
      }
    ); 
}else{

addSkillButton(
      "歩×2",
      ()=>{

        skillMode ="silverPawn2";
        logSkill(piece,"歩×2");

        skillPiece =
          selectedPiece;
      }
    );
        
    addSkillButton(
      "歩＋香",
      ()=>{

        skillMode ="silverPawnLance";
        logSkill(piece,"歩+香");

        skillPiece =
          selectedPiece;
      }
    );
  }
}
}

function clearSkillButtons(){
    document.getElementById("skillArea").innerHTML = "";
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
  logSummon(piece,x,y);
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

    clearSkillButtons();

    skillMode = null;

    wiseMoveAfterSkill = true;

    selectedPiece = skillPiece;

    render();

    highlightMoves(skillPiece);

    skillPiece=null;
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
  updateFields(true);
}


//========================
// ログ
//========================

function addLog(text){

    battleLogs.unshift(text);

    if(battleLogs.length>100){
        battleLogs.pop();
    }

    const log=document.getElementById("battleLog");

    if(log){
        log.innerHTML=battleLogs.join("<br>");
    }
}

function teamName(team){
    return team==="black" ? "黒" : "赤";
}

function logMove(piece,x,y){
    addLog(
        `▶ ${teamName(piece.team)}の${piece.type}が(${x},${y})へ移動`
    );
}

function logCapture(attacker,target){
    addLog(
        `⚔ ${teamName(attacker.team)}の${attacker.type}が${teamName(target.team)}の${target.type}を撃破`
    );
}

function logWarp(field,piece,x,y){

    addLog(
        `🌀 ${teamName(field.team)}の${field.type==="warpField"?"ワープフィールド":"スキル"}により${teamName(piece.team)}の${piece.type}が(${x},${y})へワープ`
    );
}

function logRest(field,piece){
    addLog(
        `💤 ${teamName(field.team)}の休みフィールドにより${teamName(piece.team)}の${piece.type}が1ターン休み`
    );
}

function logRebellion(field,piece){
    addLog(
        `💫 ${teamName(field.team)}の反逆フィールドにより${teamName(piece.team)}の${piece.type}が1ターン反逆`
    );
}

function logDeathField(field,piece){
    addLog(
        `☠ ${teamName(field.team)}の即死フィールドにより${teamName(piece.team)}の${piece.type}を撃破`
    );
}

function logGuard(piece,effect){
    addLog(
        `🛡 ${teamName(piece.team)}の${piece.type}は${effect}を無効化`
    );
}

function logSkill(piece,name){
    addLog(
        `✨ ${teamName(piece.team)}の${piece.type}が特殊スキル「${name}」を使用`
    );
}

function logKingRest(piece,row){
    addLog(
        `👑 ${teamName(piece.team)}の王のスキル「休み列」により y=${row} が休みフィールドになった`
    );
}

function logPawnPower(piece,level){
    addLog(
        `⭐ ${teamName(piece.team)}の歩の移動が${level}段階強化`
    );
}

function logWiseBuff(wise,target){
    addLog(
        `⭐ ${teamName(wise.team)}の賢のスキル「味方強化」により次のターンは${teamName(target.team)}の${target.type}が強化`
    );
}

function logSummon(piece,x,y){
    addLog(
        `🐎 ${teamName(piece.team)}の桂の特殊スキル「騎召喚」により騎が(${x},${y})に召喚`
    );
}

function logPrincessSacrifice(piece){
    addLog(
        `👸 ${teamName(piece.team)}の姫がスキル「身代わり」により撃破`
    );
}

function logPrincessSave(princess,target){
    addLog(
        `👸 姫のスキル「身代わり」により${teamName(target.team)}の${target.type}が復活`
    );
}

function logPrincessRevenge(princess,attacker){
    addLog(
        `💥 姫の道連れで${teamName(attacker.team)}の${attacker.type}を撃破`
    );
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
                return ` 【最大強化中】周囲４` ;
            }

            if(piece.killCount===1){
                return ` 【強化中】たてよこななめ４<br>あと1キルで周囲４` ;
            }

            return ` 【未強化】たてよこ３<br>
あと1キルでたてよこななめ３<br>
あと2キルで周囲４` ;

        case "銀":
            return "たてよこ３";

        case "香":
            return "たてよこ１";

        case "桂":
            return isBuffed(piece)
                ? "【強化中】たてよこ*２*"
                : "たてよこ１";

        case "騎":
            return "正面９";

        case "角":
            return "ななめ６";

        case "飛":
            return isBuffed(piece)
                ? "【強化中】たてよこ４→たてよこ*ななめ*２(2回行動)"
                : "たてよこ５→たてよこ１(2回行動)"; 

        case "金":
            return isBuffed(piece)
                ? "【強化中】通常*＋周囲１*"
                : "特殊移動";

        case "砲":
            return isBuffed(piece)
                ? "【強化中】たてよこ*２*"
                : "たてよこ１";

        case "姫":
            return isBuffed(piece)
                ? "【強化中】ななめ３"
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
            return ` 即死無効<br>
フィールド反射<br>
自分を倒したコマを道連れにして倒す<br>
初めに倒された味方の身代わりになって倒される` ;

        case "賢":
            return ` 反逆無効<br>
毎ターンランダムな味方1体を強化` ;

        case "王":
            return isBuffed(piece)
                ? ` 【強化中】<br>
ワープ・休み・即死無効<br>
周囲１マスに即死フィールド<br>
ななめ３マスにワープフィールド<br>
行動後ランダムな*２列*に休みフィールド` 
                : ` ワープ・休み・即死無効<br>
周囲１マスに即死フィールド<br>
ななめ３マスにワープフィールド<br>
行動後ランダムな１列に休みフィールド` ;

        case "玉":
            return isBuffed(piece)
                ? ` 【強化中】<br>
反逆無効<br>
前方扇状・*周囲１マス*に反逆フィールド` 
                : ` 反逆無効<br>
前方扇状に反逆フィールド` ;
    }

    return "なし";
}

function getUniqueDescription(piece){

    switch(piece.type){

        case "歩":
            return "なし";

        case "銀":
            return isBuffed(piece)
                ? ` 【強化中】<br>
歩１体+*ランダムな*コマ１体に分身` 
                : "歩２体or歩１体+香１体に分身";

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
                ? ` 【強化中】<br>
永続するワープ・休みフィールド(3回)、*通常の反逆フィールド(1回)*を任意のマス上に配置してから行動` 
                : ` 永続するワープ・休みフィールドを任意のマス上に配置してから行動(3回)` ;

        case "王":
            return "なし";

        case "玉":
            return "なし";
    }

    return "なし";
}

function updateFieldInfo(x,y){

    const info =
        document.
getElementById("pieceInfo");

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
            effect="敵が踏むと周囲4マス以内のランダムな位置にワープ";
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

function updatePieceAppearance(piece,wrapper){

  const pieceDiv =
    wrapper.querySelector(".piece");

  const topBadge =
    wrapper.querySelector(".badge-top");

  const bottomBadge =
    wrapper.querySelector(".badge-bottom");

  topBadge.textContent = "";
  bottomBadge.textContent = "";

  pieceDiv.classList.remove("rebel");

  let rotation =
    piece.team==="white" ? 180 : 0;

  if(piece.controlTurns>0){
    rotation += 180;
  }

  pieceDiv.style.transform =
    `rotate(${rotation}deg)`;

  if(
    piece.restTurns>0 &&
    !["銀","角","金","王"].includes(piece.type)
  ){
    bottomBadge.textContent =
      "🚫"+piece.restTurns;
  }

  if(
    piece.controlTurns>0 &&
    !["王","玉","賢"].includes(piece.type)
  ){
pieceDiv.classList.add("rebel");
    bottomBadge.textContent =
      "🌀"+piece.controlTurns;
  }

  if(piece.type==="香"){
    topBadge.textContent="⚔️";
  }
  else if(isBuffed(piece)){
    topBadge.textContent="⚔️";

    if(piece.buffTurns>0){
      topBadge.textContent=
        "⚔️"+piece.buffTurns;
    }
  }
}

document
.getElementById("resetBtn")
.addEventListener(
  "click",
  setupGame
);

document.getElementById("draftBackBtn").onclick = () => {

    placingDraftPiece = false;
    selectedDraftPiece = null;

    document.getElementById("draftSelected").textContent = "";
    document.getElementById("draftBackBtn").style.display = "none";

    document.getElementById("draftUI").style.visibility = "visible";

    render();
};

setupGame();

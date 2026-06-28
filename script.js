const boardEl =
document.getElementById("board");

const turnDisplay =
document.getElementById("turnDisplay");

let gameMode = "normal";

let turnActionsLeft = 1;

let TURN_ACTIONS = 1;

let movedPieces = [];

let boardSize = 9;

let BOARD_SIZE = 9;

let currentTurn = "black";

let roundCount = 1;

let fieldBreakTurns = 0;

let selectedPiece = null;

let selectedCell = null;

let highlights = [];

let pieces = [];

let fields = [];

let skillMode = null;

let skillPiece = null;

let skillSpawnTypes = [];

let skillUnlocked = {
    black:false,
    white:false
};

let kingRestLine=null;

let kingRestRow=null;

let wiseMoveAfterSkill = false;

let silverSpawnTypes = [];

let silverSpawnTargets = [];

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

    fieldBreakUses:1,
    
    warpFieldUses:3,
    
    restFieldUses:3,
    
    rebellionFieldUses:1,
  
    bishopWarpUses:2,

    bishopWarpReady:false,

    buffTurns:0,

    guardEffect:false,

    reflectEffect:false,

    controlledBy:null,
    
    controlTurns:0,

    turnLife:null,

    ...data
  };
}

function setupGame(){
  const selectedMode =
document.querySelector(
'input[name="mode"]:checked'
).value;

gameMode = selectedMode;

switch(gameMode){

case "normal":

    BOARD_SIZE=9;

    TURN_ACTIONS=1;

    break;

case "fast":

    BOARD_SIZE=9;

    TURN_ACTIONS=2;

    break;

case "15":

    BOARD_SIZE=15;

    TURN_ACTIONS=1;

    break;
}

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
    x:Math.floor(BOARD_SIZE/2),
    y:BOARD_SIZE-1,
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
    x:Math.floor(BOARD_SIZE/2),
    y:0,
    moveType:"jewel"
  })
);

turnActionsLeft = TURN_ACTIONS;

  render();

document.getElementById("draftBackBtn").onclick =
    cancelDraftPlacement;

}
  
function render(){
  boardEl.innerHTML = "";
  document.getElementById("roundDisplay").textContent =
    `Round ${roundCount}`;

document.getElementById("turnDisplay").textContent =
    ownerName(currentTurn)+" のターン";

const state =
document.getElementById("battleState");

if(fieldBreakTurns>0){
    state.innerHTML=
        `🌿 戦場浄化中<br>
        あと ${fieldBreakTurns} ラウンド`;
}else{
    state.textContent="";
}

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

const types =
    [...new Set(fieldList.map(f=>f.type))];

if(types.includes("warpField")){cell.classList.add("warpField");}
if(types.includes("restField")){cell.classList.add("restField");}
if(types.includes("rebellionField")){cell.classList.add("rebellionField");}
if(types.includes("deathField")){cell.classList.add("deathField");}

if(types.length >= 2){

    let icon = "";

    if(types.includes("deathField")) icon += "☠️";
    if(types.includes("restField")) icon += "⏳";
    if(types.includes("rebellionField")) icon += "💫";
    if(types.includes("warpField")) icon += "🌀";

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
       
updatePieceAppearance(piece,wrapper);
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

function ownerName(team){
    return team==="black"
        ? "⚫ 黒"
        : "🔴 赤";
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

if(reviveMode==="princess"){

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

if(reviveMode==="silver"){

silverSpawnTargets.push({x,y});

if(silverSpawnTargets.length<2){

    highlights =
        highlights.filter(
            h=>!(h.x===x && h.y===y)
        );

    render();

    return;
}

for(let i=0;i<2;i++){

    const pos=silverSpawnTargets[i];

    pieces.push(createPiece({

        type:silverSpawnTypes[i],

        team:currentTurn,

        x:pos.x,

        y:pos.y,

        moveType:convertMoveType(
            silverSpawnTypes[i]
        )
    }));
}

silverSpawnTargets=[];
silverSpawnTypes=[];

reviveMode=false;

highlights=[];

alert(
`銀の特殊スキルにより分身します。
1列目に2体配置してください。`
);

endTurn();

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
    ["飛","砲","王","玉"].includes(clickedPiece.type)
){
    alert("1ラウンド目に動けないコマです");
    return;
}

    if(ownerOf(clickedPiece)===currentTurn){

if(movedPieces.includes(clickedPiece.id) && clickedPiece.remainingActions===2){
    alert("このコマはこのターンすでに行動しています");
    return;
}

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

function movePiece(piece,x,y){
    const target = getPieceAt(x,y);
    if( target && ownerOf(target)!==ownerOf(piece)){
        capturePiece(piece,target);
    }
    piece.x = x;
    piece.y = y;
    updateFields(false);
    const steppedFields =
        fields.filter(f=>f.x===piece.x && f.y===piece.y);
    for(const field of steppedFields){
        triggerField(field);
    }
    
    if(piece.type==="賢"){
        applyWiseBuff(piece);
    }
    if(piece.type==="王"){
        kingRestLine=Math.floor(Math.random()*BOARD_SIZE);
        logKingRest(piece,kingRestLine);
        kingRestRow=null;
        if(isBuffed(piece)){
            do{
                kingRestRow=Math.floor(Math.random()*BOARD_SIZE);
                logKingRest(piece,kingRestRow);
            }while(kingRestRow===kingRestLine);
        }
        updateFields(false);
        triggerFieldsCreatedBy(piece.id);
    }
    if(piece.type === "角" && piece.bishopWarpReady){
        render();
        setTimeout(()=>{
            bishopReturnWarp(piece);
            render();
            setTimeout(()=>{
                turnActionsLeft--;
                if(turnActionsLeft>0){
                    clearSkillButtons();
                    render();
                    alert(`あと${turnActionsLeft}回行動できます`);
                    return;
                }
                endTurn();
            },400);
        },400);
        return;
    }else{
        updateFields(false);
        triggerFieldsCreatedBy(piece.id);
    }
    if(piece.type === "飛"){
        piece.remainingActions--;
        if(
            piece.remainingActions > 0 &&
            piece.restTurns === 0 &&
            piece.controlTurns === 0
        ){
            selectedPiece = piece;
            selectedCell = {
                x: piece.x,
                y: piece.y
            };
            render();
            highlightMoves(piece);
            showSkillButtons(piece);
            return;
        }
    }
  
    if(wiseMoveAfterSkill){
        wiseMoveAfterSkill = false;
        if(!movedPieces.includes(piece.id)){
            movedPieces.push(piece.id);
        }
        
        selectedPiece = null;
        selectedCell = null;
        turnActionsLeft--;
        if(turnActionsLeft>0){
            render();
            alert(`あと${turnActionsLeft}体行動できます`);
            return;
        }
        endTurn();
        return;
    }
    endTurn();
    return;
}

function endTurn(){
    turnActionsLeft = TURN_ACTIONS;
    movedPieces = [];
    clearSkillButtons();

    const oldTurn = currentTurn;
    currentTurn =
        currentTurn === "black"
        ? "white"
        : "black";
    
    selectedPiece = null;
    selectedCell = null;
    
    if(
        oldTurn === "white" &&
        currentTurn === "black"
    ){
        processRoundEnd();
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

if(fieldBreakTurns>0){
    fieldBreakTurns--;
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
                `${teamName(team)}チームの特殊スキルが解放！`
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
    removePiece(target);

    reviveTarget = {
      ...target
    };

    reviveMode = true;

    highlightRespawnSquares(target.team);

    alert(
        `姫のスキル「身代わり」により${target.type}が復活\n1列目に再配置してください`
    );
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
        if(isBuffed(piece)){
           return orthogonal(piece,4);
         }
        return orthogonal(piece,5);
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
        return diagonal(piece,4);
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

  for(let i=1;i<=BOARD_SIZE;i++){

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

function orthogonal(piece, range){

    const result = [];

    const dirs = [
        [1,0],
        [-1,0],
        [0,1],
        [0,-1]
    ];

    for(const [dx,dy] of dirs){

        for(let i=1;i<=range;i++){

            const x = piece.x + dx*i;
            const y = piece.y + dy*i;

            if(!inside(x,y)) break;

            const target = getPieceAt(x,y);

            if(!target){

                result.push({x,y});
                continue;
            }

            if(ownerOf(target)!==ownerOf(piece)){
                result.push({x,y});
            }
            break;
        }
    }

    return result;
}

function diagonal(piece, range){

    const result = [];

    const dirs = [
        [1,1],
        [1,-1],
        [-1,1],
        [-1,-1]
    ];

    for(const [dx,dy] of dirs){

        for(let i=1;i<=range;i++){

            const x = piece.x + dx*i;
            const y = piece.y + dy*i;

            if(!inside(x,y)) break;

            const target = getPieceAt(x,y);

            if(!target){

                result.push({x,y});
                continue;
            }

            if(ownerOf(target)!==ownerOf(piece)){
                result.push({x,y});
            }

            break;
        }
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

    const first = team === "black" ? BOARD_SIZE-1 : 0;
    const second = team === "black" ? BOARD_SIZE-2 : 1;

    for(let x=0;x<BOARD_SIZE;x++){
        if(!getPieceAt(x,first)){
            highlights.push({x,y:first});
        }
    }

    if(highlights.length===0){
        for(let x=0;x<BOARD_SIZE;x++){
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

function triggerFieldsCreatedBy(ownerId){

    for(const field of fields){

        if(field.ownerId !== ownerId) continue;

        triggerField(field);
    }
}

function updateFields(trigger=false){
    if(fieldBreakTurns>0){
        fields=[];
        return;
    }
    const king=
        pieces.find(p=>p.type==="王");
    fields =
        fields.filter(f=>f.ownerId);
    for(const piece of pieces){
        if(piece.type === "角" && isBuffed(piece)){
            createRadiusField(piece,1,"warpField",trigger);
        }
        if(piece.type === "騎" && isBuffed(piece)){
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
        for(let x=0;x<BOARD_SIZE;x++){
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
            for(let x=0;x<BOARD_SIZE;x++){
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

function applyWiseBuff(wise){

    for(const p of pieces){

        if(ownerOf(p)!==ownerOf(wise)){
            continue;
        }

        p.buffTurns = 0;
    }

    for(const p of pieces){

        if(ownerOf(p)!==ownerOf(wise)){
            continue;
        }

        p.buffTurns = 1;

        logWiseBuff(wise,p);
    }
}

function isBuffed(piece){

    if(piece.buffTurns > 0){
        return true;
    }

    return pieces.some(
        p =>
            p.type === "香" &&
            ownerOf(p) === ownerOf(piece)
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

function reflectField(field, princess){

    // 反射しないフィールド
    if(
        field.type==="deathField" ||
        field.type==="rebellionField"
    ){
        return;
    }

    const owner =
        pieces.find(
            p=>p.id===field.ownerId
        );

    if(!owner){
        return;
    }

    applySingleField(
        owner,
        {
            ...field,
            team:princess.team
        }
    );
}

function applyWarpField(piece,field){

  if(field.team===ownerOf(piece)){
    return;
  }

  if(
    piece.type==="角" ||
    piece.type==="王"
){
    showGuardEffect(piece);
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
  
  if(field.team===ownerOf(piece)){
    return;
  }
  
  if(
    piece.type==="銀" ||
    piece.type==="角" ||
    piece.type==="金" ||
    piece.type==="王"
){
    showGuardEffect(piece);
    logGuard(piece,"休みフィールド");
    return;
}
  if(piece.restTurns <= 0){
    piece.restTurns = 1;
    logRest(field,piece);
  }
}
    
function applyRebellionField(piece,field){
  
  if(field.team===ownerOf(piece)){
    return;
  }
  
  if(
    piece.type === "王" ||
    piece.type === "賢"
  ){
    showGuardEffect(piece);
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
        showGuardEffect(piece);
        logGuard(piece,"即死フィールド");
    }
    return;
}

  if(
    ownerOf(piece)==field.team
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

    const button =
        document.getElementById("skillButton");

    const area =
        document.getElementById("skillArea");

    area.style.display="none";

    button.onclick=()=>{

        area.style.display=

            area.style.display==="block"

            ? "none"

            : "block";
    };
    document.getElementById("skillArea").style.display="none";

if(!skillUnlocked[piece.team]){

    button.disabled=false;

    button.textContent="🔒 特殊スキル";

    addSkillButton(
        "第3ラウンド以降\n味方が1体倒されると解放",
        ()=>{},
        false
    );

    return;
}

    button.disabled=false;
    button.textContent="特殊スキル";

    area.innerHTML="";

  const hasSkill =

    ["銀","香","桂","角","賢"].includes(piece.type);

if(!hasSkill){

    button.disabled=false;

    button.textContent="特殊スキル";

    addSkillButton(
        "このコマは特殊スキルを持ちません",
        ()=>{},
        false
    );

    return;
}

  if(piece.type === "賢"){

    addSkillButton(
      ` ワープ配置(${piece.warpFieldUses}/3)` ,
      ()=>{

        skillMode="wiseWarp";
        logSkill(piece,"ワープ配置");
            
        skillPiece =
          selectedPiece;
      },
      piece.warpFieldUses>0
    );

    addSkillButton(
      ` 休み配置(${piece.restFieldUses}/3)` ,
      ()=>{

        skillMode ="wiseRest";
        logSkill(piece,"休み配置");

        skillPiece =
          selectedPiece;
      },
      piece.restFieldUses>0
    ); 
        
    if(isBuffed(piece)){

      addSkillButton(
        ` 反逆配置(${piece.rebellionFieldUses}/1)` ,
        ()=>{
          skillMode = "wiseRebellion";
          logSkill(piece,"反逆配置");
          skillPiece = piece;
        },
       piece.rebellionFieldUses>0
      );
    }
  }

if(piece.type==="香"){
    addSkillButton(
        `戦場浄化 (${piece.fieldBreakUses}/1)`,
        ()=>{
            useFieldBreak(piece);
        },
        piece.fieldBreakUses>0
    );
}

      
  if(piece.type === "桂"){
    addSkillButton(
      ` 騎召喚(${5-piece.summonedCount}/5)` ,
      ()=>{

        skillMode="summonRider";
        logSkill(piece,"騎召喚");

        skillPiece =
          piece;

        highlightSkillTargets(piece);
      },
      piece.summonedCount<5
    );
  }
      
  if(piece.type === "角"){

addSkillButton(

`帰還ワープ (${piece.bishopWarpUses}/2)`,

()=>{
    piece.bishopWarpReady = true;

    skillPiece = piece;
    skillMode = "bishopWarp";

    logSkill(piece,"帰還ワープ");

    alert("次の行動後に2列目のランダムなマスにワープ");

},

piece.bishopWarpUses>0
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
addSkillButton(
    "キャンセル",
    cancelSkill
);
}

function finishSkill(){
    clearSkillButtons();
    skillMode = null;

    skillPiece = null;

    turnActionsLeft--;

if(turnActionsLeft>0){

    render();

    return;
}

endTurn();
  
  }

function cancelSkill(){

    // 角の帰還ワープだけ取り消す
    if(
        skillMode === "bishopWarp" &&
        skillPiece
    ){
        skillPiece.bishopWarpReady = false;
    }

    const piece = skillPiece;

    skillMode = null;
    skillPiece = null;
    wiseMoveAfterSkill = false;

    clearSkillButtons();

    if(piece && pieces.includes(piece)){

        selectedPiece = piece;
        selectedCell = {
            x: piece.x,
            y: piece.y
        };

        render();
        highlightMoves(piece);
        showSkillButtons(piece);

    }else{

        selectedPiece = null;
        selectedCell = null;
        render();
    }
}

function addSkillButton(text,callback,enabled=true){

    const btn=document.createElement("button");

    btn.textContent=text;

    btn.disabled=!enabled;

    btn.onclick=callback;

    document
        .getElementById("skillArea")
        .appendChild(btn);
}

function clearSkillButtons(){

    const area=document.getElementById("skillArea");

    area.innerHTML="";

    area.style.display="none";
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

  skillSpawnTypes = [
    "歩",
    randomType
  ];
}

function highlightSkillTargets(piece){

  render();

  const cells =
  document.querySelectorAll(".cell");

  if(piece.type === "桂"){

    const targetY =
    piece.team === "black"
    ? BOARD_SIZE-1
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

if(!highlights.some(h=>h.x===x&&h.y===y)){
    return;
}

  silverSpawnTypes = spawnTypes;
  removePiece(skillPiece);
  highlightRespawnSquares(skillPiece.team);
  reviveMode = "silver";

}

function useFieldBreak(piece){

    piece.fieldBreakUses--;

    fieldBreakTurns = 3;

    fields = [];

    for(const p of pieces){

        if(ownerOf(p)!==ownerOf(piece)){
            continue;
        }

        p.restTurns = 0;

        p.controlTurns = 0;

        p.controlledBy = null;
    }

    addLog(
        `🌿 ${teamName(piece.team)}の香が特殊スキル「戦場浄化」を使用`
    );

    finishSkill();
}

  
function summonRider(piece,x,y){

  if(piece.summonedCount >= 5){

    alert(
      "これ以上召喚できません"
    );

    return false;
  }

  // 黒は最下段
  if(
    piece.team === "black" &&
    y !== BOARD_SIZE-1
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
    ? BOARD_SIZE-2
    : 1;
  const candidates = [];
  for(let x=0;x<BOARD_SIZE;x++){
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
 
  piece.x = randomX;
  piece.y = targetY;
  updateFields();
}


//========================
// モード選択
//========================

function applyGameMode(mode){

    gameMode = mode;

    switch(mode){

        case "normal":

            TURN_ACTIONS = 1;
            boardSize = 9;
            break;

        case "fast":

            TURN_ACTIONS = 2;
            boardSize = 9;
            break;

        case "large":

            TURN_ACTIONS = 1;
            boardSize = 16;
            break;
    }

    BOARD_SIZE = boardSize;
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

document.getElementById("draftBackBtn").style.display = "none";

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
 document.getElementById("draftBackBtn").style.display= "block";

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
 document.getElementById("draftBackBtn").style.display= "none";

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
      ? y===BOARD_SIZE-1
      : y===0;
  }

  return currentTurn==="black"
    ? y===BOARD_SIZE-2
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
        `⏳ ${teamName(field.team)}の休みフィールドにより${teamName(piece.team)}の${piece.type}が1ターン休み`
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

function showGuardEffect(piece){

    piece.guardEffect = true;

    render();

    setTimeout(()=>{

        if(!pieces.includes(piece)) return;

        piece.guardEffect = false;

        render();

    },3000);
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

function logWiseBuff(wise){
    addLog(
        `⭐ ${teamName(wise.team)}の賢が味方全員を強化`
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
        `⏳休み ${piece.restTurns}`);
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
                ? "【強化中】たてよこ４→たてよこななめ２(2回行動)"
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
                ? "【強化中】ななめ４"
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
            return ` 反逆無効<br>行動後味方全員を強化` ;

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
            return `3ラウンドの間すべてのフィールドを消滅<br>味方全員の状態異常を解除`;

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

            icon="⏳";
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
      "⏳"+piece.restTurns;
  }

  if(
    piece.controlTurns>0 &&
    !["王","玉","賢"].includes(piece.type)
  ){
pieceDiv.classList.add("rebel");
    bottomBadge.textContent =
      "🌀"+piece.controlTurns;
  }

if(piece.reflectEffect){
    topBadge.textContent = "🪞";
}

if(piece.guardEffect){
    topBadge.textContent = "🛡";
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

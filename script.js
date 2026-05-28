body{
  background:#1b1b1b;
  color:white;
  font-family:sans-serif;
}

.topbar{
  display:flex;
  gap:20px;
  align-items:center;
}

.game{
  display:flex;
  gap:30px;
  margin-top:20px;
}

#board{
  display:grid;
  grid-template-columns:repeat(9,70px);
  grid-template-rows:repeat(9,70px);

  border:3px solid white;
}

.cell{
  width:70px;
  height:70px;

  border:1px solid #666;

  display:flex;
  justify-content:center;
  align-items:center;

  font-size:28px;

  cursor:pointer;

  position:relative;
}

.cell.dark{
  background:#2b2b2b;
}

.cell.light{
  background:#3b3b3b;
}

.highlight{
  background:#2d6a4f !important;
}

.warpField::after{
  content:"W";

  position:absolute;
  top:2px;
  right:4px;

  color:#00b4ff;
  font-size:12px;
}

.restField::after{
  content:"R";

  position:absolute;
  top:2px;
  right:4px;

  color:#ff4d6d;
  font-size:12px;
}

.buffField::after{
  content:"B";

  position:absolute;
  top:2px;
  right:4px;

  color:#ffd60a;
  font-size:12px;
}

.side{
  width:250px;
}

.piece-black{
  color:#7ee787;
}

.piece-white{
  color:#ff7b72;
}

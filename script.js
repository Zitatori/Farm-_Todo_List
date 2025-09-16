/* ====== Farm Todo: タスク種別→動物スポーン（完全置き換え） ====== */

// DOM
const canvas = document.getElementById("farm");
const ctx = canvas.getContext("2d");

// 画像読み込み
const bg = new Image(); bg.src = "images/fields.png";
const IMAGES = {
  chicken: new Image(),
  cow: new Image(),
  rabbit: new Image(),
  sheep: new Image(),
};
IMAGES.chicken.src = "images/chicken.png";
IMAGES.cow.src     = "images/cow.png";
IMAGES.rabbit.src  = "images/rabbit.png";   // ← ここは rabbit（bが2つ）
IMAGES.sheep.src   = "images/sheep.png";

// 読み込み失敗チェック（出ない時はConsole確認）
for (const [k, img] of Object.entries(IMAGES)) {
  img.onerror = () => console.error("[IMG missing]", k, img.src);
}

// タスク種別 → 動物キー
const TYPE_TO_ANIMAL = {
  programming: "chicken", // 左上の畑
  sport:       "cow",     // 右上の畑
  house:       "sheep",   // 左下の畑
  kids:        "rabbit",  // 右下の畑
};


// === 4つの畑の矩形（x,y,w,h）を返す ===
// 数値は 900x520 の例。あなたの画像に合わせて後で微調整してOK
function zoneRects() {
  return {
    chicken: { x:  40, y: 265, w: 320, h: 135 },
    cow:     { x: 510, y: 100, w: 320, h: 135 }, // ← 265 → 235
    sheep:   { x:  70, y: 420, w: 320, h:  90 },
    rabbit:  { x: 510, y: 100, w: 320, h:  90 }, // ← 420 → 390
  };
}


// 矩形内で重なり回避しつつランダム配置
function findFreeSpotInRect(existing, rect, w, h) {
  for (let i = 0; i < 60; i++) {
    const x = Mat　h.floor(rect.x + Math.random() * (rect.w - w));
    const y = Math.floor(rect.y + Math.random() * (rect.h - h));
    const box = { x, y, w, h };
    const hit = existing.some(o => !(box.x+box.w<o.x || o.x+o.w<box.x || box.y+box.h<o.y || o.y+o.h<box.y));
    if (!hit) return { x, y };
  }
  // 最後は中央に妥協
  return { x: rect.x + (rect.w - w)/2, y: rect.y + (rect.h - h)/2 };
}


// 状態
let animals = [];            // {imgKey, x, y, w, h}
const ANIMAL_SIZE = 72;

// 初期描画
bg.onload = drawFarm;

// イベント
document.getElementById("addTask").addEventListener("click", addTask);
document.getElementById("taskInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// タスク追加
function addTask() {
  const input   = document.getElementById("taskInput");
  const typeSel = document.getElementById("taskType");
  const text = input.value.trim();
  if (!text) return;

  const li = document.createElement("li");
  li.dataset.type = typeSel.value; // ← 種別をタスクに記録

  // 左（テキスト + バッジ）
  const left = document.createElement("span");
  left.textContent = text + " ";
  const badge = document.createElement("span");
  badge.textContent = typeSel.options[typeSel.selectedIndex].textContent;
  badge.style.fontSize = ".8rem";
  badge.style.color = "#155724";
  badge.style.background = "#d4edda";
  badge.style.padding = "2px 8px";
  badge.style.borderRadius = "999px";
  left.appendChild(badge);

  // 右（Doneボタン）
  const doneBtn = document.createElement("button");
  doneBtn.textContent = "🐥 Done!";
  doneBtn.className = "done-btn";
  doneBtn.onclick = () => completeTask(li, doneBtn);

  const right = document.createElement("div");
  right.appendChild(doneBtn);

  li.append(left, right);
  document.getElementById("taskList").appendChild(li);
  input.value = "";
}

// 完了 → 種別に応じて動物スポーン
function completeTask(li, btn) {
  li.style.textDecoration = "line-through";
  li.style.opacity = "0.6";
  if (btn) btn.disabled = true;

  const type = li.dataset.type || "study";
  const animalKey = TYPE_TO_ANIMAL[type] || "chicken";
  addAnimal(animalKey);
}

// 動物追加（canvasに描画）
function addAnimal(imgKey) {
  animals.push({
    imgKey,
    x: Math.random() * (canvas.width - ANIMAL_SIZE - 10),
    y: canvas.height / 2 + Math.random() * (canvas.height / 2 - ANIMAL_SIZE - 10),
    w: ANIMAL_SIZE,
    h: ANIMAL_SIZE,
  });
  drawFarm();
}

// 描画
function drawFarm() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  animals.forEach((a) => {
    const img = IMAGES[a.imgKey];
    if (img && img.complete) {
      ctx.drawImage(img, a.x, a.y, a.w, a.h);
    }
  });
}
// ===== クリックで4畑の枠を作るキャリブレーター（一時利用） =====
(function calibrator(){
  // いまの zoneRects() の値を初期値として使う
  let ZONES = zoneRects();

  const key2zone = { '1':'chicken', '2':'cow', '3':'sheep', '4':'rabbit' };
  let target = 'chicken';
  let clicks = [];

  // クリックで左上→右下を取る
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left) * canvas.width  / r.width);
    const y = Math.round((e.clientY - r.top)  * canvas.height / r.height);
    clicks.push({x,y});
    if (clicks.length === 2) {
      const [a,b] = clicks; clicks = [];
      const x1 = Math.min(a.x,b.x), y1 = Math.min(a.y,b.y);
      const w  = Math.abs(a.x-b.x), h = Math.abs(a.y-b.y);
      ZONES[target] = { x:x1, y:y1, w, h };
      console.log(`updated ${target}`, ZONES[target]);
      drawFarm();
    }
  });

  // 1〜4で対象切替、Ctrl/⌘+CでJSONコピー
  window.addEventListener('keydown', (e) => {
    if (key2zone[e.key]) {
      target = key2zone[e.key];
      console.log('target:', target);
    }
    if ((e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey)) {
      const json = JSON.stringify(ZONES, null, 2);
      navigator.clipboard?.writeText(json).catch(()=>{});
      console.log('=== Paste this into zoneRects() ===\n', json);
    }
  });

  // ゾーン枠を上描き表示するため、drawFarmをラップ
  // ゾーン枠を上描き表示するため、drawFarmをラップ
const _drawFarm = drawFarm;
drawFarm = function(){
  _drawFarm();

  const labelMap = {
    chicken: "Programming 🐔",
    cow:     "Sport 🐄",
    sheep:   "House 🐑",
    rabbit:  "Kids 🐇",
  };

  for (const [k, r] of Object.entries(ZONES)) {
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.font = "14px system-ui";
    ctx.fillText(labelMap[k] || k, r.x + 6, r.y + 18); // ← ここだけ置換
    ctx.restore();
  }
};

  // zoneRects を ZONES を返す版に一時差し替えたい場合はこれでもOK
  // (既存の zoneRects() はそのままでOKなら無視)
  window.zoneRects = function(){ return ZONES; };
})();

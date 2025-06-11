// — CONFIGURÁ TUS CREDENCIALES DE FIREBASE
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const resetBtn = document.getElementById("resetBtn");
const statusDiv = document.getElementById("status");

const players = ["Player1","Player2","Player3","Player4","Player5","Player6"];
const positions = [
  {x:150,y:150},{x:400,y:100},{x:650,y:150},
  {x:150,y:450},{x:400,y:500},{x:650,y:450}
];

let playerId = null;
let currentHolder = null;

// Dibuja jugadores en canvas
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  players.forEach((p,i) => {
    ctx.beginPath();
    ctx.arc(positions[i].x, positions[i].y, 40, 0, 2*Math.PI);
    ctx.fillStyle = (p === currentHolder) ? "orange" : "lightgray";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    ctx.fillText(p, positions[i].x - 30, positions[i].y + 6);
  });
}

// Pasar pelota
function passBall(toPlayer) {
  if (currentHolder !== playerId) {
    statusDiv.textContent = "No tienes la pelota.";
    return;
  }
  db.collection("game").doc("state").set({ holder: toPlayer });
}

// Escucha cambios en la pelota
function listenGameState() {
  db.collection("game").doc("state")
    .onSnapshot(doc => {
      currentHolder = doc.data().holder;
      draw();
      statusDiv.textContent = `Pelota en: ${currentHolder}`;
    });
}

// Unirse al juego
joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!players.includes(name)) {
    alert("Debés usar Player1 a Player6");
    return;
  }
  playerId = name;
  statusDiv.textContent = `Conectado como ${playerId}`;
  listenGameState();
  db.collection("game").doc("state").get().then(doc => {
    if (!doc.exists || !doc.data().holder) {
      db.collection("game").doc("state").set({ holder: "Player1" });
    }
  });
  draw();
};

// Reiniciar juego
resetBtn.onclick = () => {
  db.collection("game").doc("state").set({ holder: "Player1" });
  statusDiv.textContent = "Juego reiniciado";
  draw();
};

// Manejo de clic para pasar la pelota
canvas.addEventListener("click", e => {
  if (!playerId) return alert("Primero uníte.");
  const x = e.offsetX, y = e.offsetY;
  players.forEach((p,i) => {
    const dx = x - positions[i].x, dy = y - positions[i].y;
    if (Math.hypot(dx,dy) < 40) passBall(p);
  });
});

// Dibujo inicial
draw();

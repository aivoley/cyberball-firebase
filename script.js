// — CONFIGURÁ TUS CREDENCIALES DE FIREBASE
const firebaseConfig = {
   apiKey: "AIzaSyCmn9mkX9M4BSz1xH2dAzTv4zfto3yCVZg",
    authDomain: "cyberball-firebase.firebaseapp.com",
    projectId: "cyberball-firebase",
    storageBucket: "cyberball-firebase.firebasestorage.app",
    messagingSenderId: "293555459308",
    appId: "1:293555459308:web:d76aec886cbb21709bc1c9",
    measurementId: "G-4X79M02HXR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const resetBtn = document.getElementById("resetBtn");
const statusDiv = document.getElementById("status");

const players = ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6"];
const positions = [
  { x: 150, y: 150 }, { x: 400, y: 100 }, { x: 650, y: 150 },
  { x: 150, y: 450 }, { x: 400, y: 500 }, { x: 650, y: 450 }
];

let playerId = null;
let currentHolder = null;
let botPlayers = [];

// Dibuja los jugadores en el canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  players.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(positions[i].x, positions[i].y, 40, 0, 2 * Math.PI);
    ctx.fillStyle = (p === currentHolder) ? "orange" : "lightgray";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    ctx.fillText(p, positions[i].x - 30, positions[i].y + 6);
  });
}

// Pasar la pelota
function passBall(toPlayer) {
  if (currentHolder !== playerId) return;
  db.collection("game").doc("state").set({ holder: toPlayer });
  db.collection("passes").add({ from: playerId, to: toPlayer, time: new Date().toISOString() });
}

// Lógica automática de bots
function botLogic(botName) {
  db.collection("game").doc("state").onSnapshot(doc => {
    const holder = doc.data().holder;
    if (holder === botName) {
      setTimeout(() => {
        const others = players.filter(p => p !== botName);
        const randomTarget = others[Math.floor(Math.random() * others.length)];
        db.collection("game").doc("state").set({ holder: randomTarget });
        db.collection("passes").add({ from: botName, to: randomTarget, time: new Date().toISOString() });
      }, Math.random() * 2000 + 1000); // entre 1 y 3 segundos
    }
  });
}

// Escuchar estado del juego
function listenGameState() {
  db.collection("game").doc("state").onSnapshot(doc => {
    if (!doc.exists) return;
    currentHolder = doc.data().holder;
    draw();
    statusDiv.textContent = `Pelota en: ${currentHolder}`;
  });
}

// Asignar bots automáticamente si no están definidos
function assignBotsIfNeeded() {
  db.collection("game").doc("bots").get().then(doc => {
    if (!doc.exists) {
      const shuffled = [...players].sort(() => 0.5 - Math.random());
      botPlayers = shuffled.slice(0, 2);
      db.collection("game").doc("bots").set({ bots: botPlayers });
    } else {
      botPlayers = doc.data().bots;
    }

    // Si este cliente es un bot, arrancar la lógica
    if (botPlayers.includes(playerId)) {
      botLogic(playerId);
    }
  });
}

// Unirse al juego
joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!players.includes(name)) {
    alert("Usá un nombre entre Player1 y Player6");
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

  assignBotsIfNeeded();
  draw();
};

// Reiniciar juego
resetBtn.onclick = () => {
  db.collection("game").doc("state").set({ holder: "Player1" });
  db.collection("game").doc("bots").delete();
  db.collection("passes").get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    batch.commit();
  });
  statusDiv.textContent = "Juego reiniciado.";
  draw();
};

// Manejar clicks para pasar pelota
canvas.addEventListener("click", e => {
  if (!playerId) return alert("Primero uníte.");
  const x = e.offsetX, y = e.offsetY;
  players.forEach((p, i) => {
    const dx = x - positions[i].x;
    const dy = y - positions[i].y;
    if (Math.hypot(dx, dy) < 40) passBall(p);
  });
});

// Dibujo inicial
draw();

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

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// Posiciones fijas para 6 jugadores
const positions = [
  { x: 150, y: 150 },
  { x: 400, y: 100 },
  { x: 650, y: 150 },
  { x: 150, y: 450 },
  { x: 400, y: 500 },
  { x: 650, y: 450 }
];

// Pedir nombre
let playerName = prompt("¿Cómo te llamás?").trim();
let playerPosition = null;
let currentBallHolder = null;

// Asignar jugador automáticamente
async function registerPlayer() {
  const snapshot = await db.collection("players").get();
  const players = snapshot.docs.map(doc => doc.data());
  const takenPositions = players.map(p => p.position);
  const availablePosition = [0, 1, 2, 3, 4, 5].find(pos => !takenPositions.includes(pos));

  if (availablePosition === undefined) {
    alert("La sala ya está llena (6 jugadores).");
    return;
  }

  const alreadyExists = players.some(p => p.name === playerName);
  if (!alreadyExists) {
    await db.collection("players").add({ name: playerName, position: availablePosition });
  }

  playerPosition = availablePosition;

  // Si nadie tiene la pelota, dársela al primero que entra
  const stateDoc = await db.collection("game").doc("state").get();
  if (!stateDoc.exists || !stateDoc.data().holder) {
    await db.collection("game").doc("state").set({ holder: playerName });
  }

  listenForChanges();
  drawPlayers();
}

// Escuchar cambios del juego
function listenForChanges() {
  db.collection("game").doc("state").onSnapshot(doc => {
    if (doc.exists) {
      currentBallHolder = doc.data().holder;
      drawPlayers();
    }
  });

  db.collection("players").onSnapshot(() => {
    drawPlayers();
  });
}

// Dibujar jugadores
async function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const snapshot = await db.collection("players").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const pos = positions[data.position];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 40, 0, 2 * Math.PI);
    ctx.fillStyle = data.name === currentBallHolder ? "orange" : "lightgray";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(data.name, pos.x - 30, pos.y + 5);
  });
}

// Pasar la pelota a otro jugador
canvas.addEventListener("click", async (e) => {
  const x = e.offsetX;
  const y = e.offsetY;

  const snapshot = await db.collection("players").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const pos = positions[data.position];
    const dx = x - pos.x;
    const dy = y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 40 && currentBallHolder === playerName && data.name !== playerName) {
      db.collection("game").doc("state").set({ holder: data.name });
    }
  });
});

// Botón de reinicio (opcional)
document.getElementById("resetBtn")?.addEventListener("click", async () => {
  const snapshot = await db.collection("players").get();
  if (!snapshot.empty) {
    const first = snapshot.docs[0].data();
    await db.collection("game").doc("state").set({ holder: first.name });
  }
});

registerPlayer();

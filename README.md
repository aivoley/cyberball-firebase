# Cyberball 6 jugadores (Firebase + Vercel)

## 🚀 Instalación

1. Crea un proyecto en Firebase y agrega credenciales en `script.js`.
2. En Firestore, crea la colección `game` y el documento `state`.
3. Sube todos los archivos a un nuevo repo en GitHub.
4. Despliega en Vercel configurado como "Static Site".
5. Todas las personas abren la URL, ingresan su nombre (Player1-6) y juegan.

## ⚙️ Cómo funciona

- Cada jugador puede pasar la pelota solo si la tiene.
- El estado de la pelota se sincroniza en tiempo real.
- Botón "Reiniciar" permite volver a Player1.

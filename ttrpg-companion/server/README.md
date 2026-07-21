WormholeRacersJS - Signaling and Task Server

This small Node.js server provides a WebSocket-based signaling and task orchestration endpoint for the WormholeRacersJS prototype.

Features
- WebSocket registration for clients
- A simple `/assign` HTTP endpoint to broadcast `taskAssign` messages to compute-capable clients

Setup
1. Install Node.js (v16+ recommended).
2. From this `server/` folder run:

```powershell
npm install
npm start
```

3. Server listens on port `3000` by default. Check health at `http://localhost:3000/health`.

Assigning a task
- POST to `http://localhost:3000/assign` with JSON body:

```json
{ "task": { "taskId": "seg-0-31", "startPoint": {"x":0,"y":0,"z":0}, "endPoint": {"x":1000,"y":50,"z":-200}, "segments": 32, "baseRadius": 20, "freqs": {"f1":300,"f2":400,"f3":150,"f4":250}, "env": {"techLevel":15,"criminality":0.2,"localColourFreq":600.0,"darkMatter":0.05} } }
```

The server will broadcast a `taskAssign` message to compute-capable clients (or to all clients if none advertise compute capability).

Notes
- This server is a prototype: it does not persist results and does minimal verification. Use it for local testing and prototyping task distribution.

import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dgram from "node:dgram";
import os from "node:os";
const PORT = 53317;
const BROADCAST_ADDR = "255.255.255.255";
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}
function startUDPDiscovery(deviceName) {
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  socket.on("listening", () => {
    socket.setBroadcast(true);
    const address = socket.address();
    console.log(`[UDP] Escuchando beacons en el puerto ${address.port}`);
  });
  socket.on("message", (msg, rinfo) => {
    const myIP = getLocalIP();
    if (rinfo.address === myIP) return;
    try {
      const data = JSON.parse(msg.toString());
      console.log(`[UDP] Dispositivo encontrado:`, data, `desde ${rinfo.address}`);
    } catch (e) {
    }
  });
  socket.bind(PORT);
  const sendBeacon = () => {
    const payload = JSON.stringify({
      alias: deviceName,
      deviceType: "desktop",
      port: PORT
    });
    const message = Buffer.from(payload);
    socket.send(message, 0, message.length, PORT, BROADCAST_ADDR, (err) => {
      if (err) console.error("[UDP] Error enviando beacon:", err);
    });
  };
  const intervalId = setInterval(sendBeacon, 3e3);
  return () => {
    clearInterval(intervalId);
    socket.close();
  };
}
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname$1, "preload.mjs")
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname$1, "../dist/index.html"));
  }
}
app.whenReady().then(() => {
  startUDPDiscovery("PC-Escritorio-Etec");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

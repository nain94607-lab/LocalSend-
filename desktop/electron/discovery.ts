
import dgram from 'node:dgram';
import os from 'node:os';

const PORT = 53317;
const BROADCAST_ADDR = '255.255.255.255';

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export function startUDPDiscovery(deviceName: string) {
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  socket.on('listening', () => {
    socket.setBroadcast(true);
    const address = socket.address();
    console.log(`[UDP] Escuchando beacons en el puerto ${address.port}`);
  });

  socket.on('message', (msg, rinfo) => {
    const myIP = getLocalIP();
    if (rinfo.address === myIP) return;

    try {
      const data = JSON.parse(msg.toString());
      console.log(`[UDP] Dispositivo encontrado:`, data, `desde ${rinfo.address}`);
    } catch (e) {
      // Ignorar mensajes con formato distinto
    }
  });

  socket.bind(PORT);

  const sendBeacon = () => {
    const payload = JSON.stringify({
      alias: deviceName,
      deviceType: 'desktop',
      port: PORT
    });

    const message = Buffer.from(payload);
    socket.send(message, 0, message.length, PORT, BROADCAST_ADDR, (err) => {
      if (err) console.error('[UDP] Error enviando beacon:', err);
    });
  };

  const intervalId = setInterval(sendBeacon, 3000);

  return () => {
    clearInterval(intervalId);
    socket.close();
  };
}
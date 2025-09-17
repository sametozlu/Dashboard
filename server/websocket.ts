import { Server as SocketIOServer } from 'socket.io';
import type { Server } from 'http';
import { hardwareBridge } from './hardware-bridge';
import { storage } from './storage';

export function setupWebSocket(httpServer: Server) {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0
        ? allowedOrigins
        : (process.env.NODE_ENV === 'development'
          ? ['http://localhost:3000', 'http://127.0.0.1:3000']
          : false),
      credentials: true
    }
  });

  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('No session found'));
      }

      const sessionId = cookies
        .split(';')
        .find(c => c.trim().startsWith('sessionId='))
        ?.split('=')[1];

      if (!sessionId) {
        return next(new Error('No session ID found'));
      }

      const session = await storage.getSession(sessionId);
      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Invalid session'));
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as any).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);
    
    // Join user to a room for personalized updates
    const user = (socket as any).user;
    socket.join(`user:${user.id}`);

    // Send initial system status
    socket.emit('system:status', {
      connected: true,
      timestamp: Date.now()
    });

    // Handle hardware data requests
    socket.on('hardware:subscribe', (dataType: string) => {
      console.log(`Client ${socket.id} subscribed to ${dataType}`);
      socket.join(`hardware:${dataType}`);
      
      // Send initial data
      sendInitialHardwareData(socket, dataType);
    });

    socket.on('hardware:unsubscribe', (dataType: string) => {
      console.log(`Client ${socket.id} unsubscribed from ${dataType}`);
      socket.leave(`hardware:${dataType}`);
    });

    // Handle hardware control commands
    socket.on('hardware:control', async (data) => {
      try {
        let result;
        
        switch (data.action) {
          case 'setPowerModuleState':
            result = await hardwareBridge.setPowerModuleState(data.moduleId, data.enabled);
            break;
          case 'setDCCircuitState':
            result = await hardwareBridge.setDCCircuitState(data.circuitId, data.enabled);
            break;
          case 'startBatteryTest':
            result = await hardwareBridge.startBatteryTest(data.batteryId, data.testType);
            break;
          case 'acknowledgeAlarm':
            result = await hardwareBridge.acknowledgeAlarm(data.alarmId);
            break;
          case 'setOperationMode':
            result = await hardwareBridge.setOperationMode(data.mode);
            break;
          default:
            throw new Error(`Unknown hardware control action: ${data.action}`);
        }

        socket.emit('hardware:control:response', {
          success: true,
          data: result,
          requestId: data.requestId
        });

        // Broadcast update to all clients subscribed to relevant data
        broadcastHardwareUpdate(io, data.action);

      } catch (error) {
        socket.emit('hardware:control:response', {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: data.requestId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  // WebSocket sunucusu kurulduktan sonra, donanım verisini frontend'e aktar
  hardwareBridge.on('hardwareData', (data: string) => {
    try {
      // C programından gelen JSON veriyi parse et
      const parsedData = JSON.parse(data);
      
      if (parsedData.type === 'system_status') {
        // Sistem durumu ve rectifier verilerini broadcast et
        io.to('hardware:rectifiers').emit('hardware:rectifiers', {
          data: parsedData.rectifiers,
          timestamp: Date.now()
        });
        
        io.to('hardware:systemStatus').emit('hardware:systemStatus', {
          data: parsedData.data,
          timestamp: Date.now()
        });
        
        // Genel hardware verisi olarak da gönder
        io.emit('hardware:raw', {
          data: parsedData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error parsing hardware data:', error);
      // Parse edilemezse ham veri olarak gönder
      io.emit('hardware:raw', {
        data,
        timestamp: Date.now()
      });
    }
  });

  // Set up periodic data broadcasting
  setupPeriodicBroadcast(io);

  return io;
}

async function sendInitialHardwareData(socket: any, dataType: string) {
  try {
    let data;
    
    switch (dataType) {
      case 'powerModules':
        data = await hardwareBridge.getPowerModules();
        break;
      case 'batteries':
        data = await hardwareBridge.getBatteryInfo();
        break;
      case 'acInputs':
        data = await hardwareBridge.getACInputs();
        break;
      case 'dcOutputs':
        data = await hardwareBridge.getDCOutputs();
        break;
      case 'alarms':
        data = await hardwareBridge.getActiveAlarms();
        break;
      case 'systemStatus':
        data = await hardwareBridge.getSystemStatus();
        break;
      case 'rectifiers':
        // Rectifier verisi için özel case
        data = await hardwareBridge.getPowerModules(); // Geçici olarak power modules kullan
        break;
      default:
        return;
    }

    socket.emit(`hardware:${dataType}`, {
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    socket.emit(`hardware:${dataType}:error`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}

function setupPeriodicBroadcast(io: SocketIOServer) {
  // Broadcast hardware updates every 5 seconds
  setInterval(async () => {
    try {
      // Get all hardware data
      const [powerModules, batteries, acInputs, dcOutputs, alarms, systemStatus] = await Promise.all([
        hardwareBridge.getPowerModules(),
        hardwareBridge.getBatteryInfo(),
        hardwareBridge.getACInputs(),
        hardwareBridge.getDCOutputs(),
        hardwareBridge.getActiveAlarms(),
        hardwareBridge.getSystemStatus()
      ]);

      const timestamp = Date.now();

      // Broadcast to subscribed clients
      io.to('hardware:powerModules').emit('hardware:powerModules', { data: powerModules, timestamp });
      io.to('hardware:batteries').emit('hardware:batteries', { data: batteries, timestamp });
      io.to('hardware:acInputs').emit('hardware:acInputs', { data: acInputs, timestamp });
      io.to('hardware:dcOutputs').emit('hardware:dcOutputs', { data: dcOutputs, timestamp });
      io.to('hardware:alarms').emit('hardware:alarms', { data: alarms, timestamp });
      io.to('hardware:systemStatus').emit('hardware:systemStatus', { data: systemStatus, timestamp });

    } catch (error) {
      console.error('Error broadcasting hardware data:', error);
    }
  }, 5000);

  // Broadcast alarm updates more frequently (every 2 seconds)
  setInterval(async () => {
    try {
      const alarms = await hardwareBridge.getActiveAlarms();
      io.to('hardware:alarms').emit('hardware:alarms', { 
        data: alarms, 
        timestamp: Date.now() 
      });
    } catch (error) {
      console.error('Error broadcasting alarm data:', error);
    }
  }, 2000);
}

function broadcastHardwareUpdate(io: SocketIOServer, action: string) {
  // Determine which data types need to be updated based on the action
  const updateMap: Record<string, string[]> = {
    'setPowerModuleState': ['powerModules', 'systemStatus'],
    'setDCCircuitState': ['dcOutputs', 'systemStatus'],
    'startBatteryTest': ['batteries'],
    'acknowledgeAlarm': ['alarms'],
    'setOperationMode': ['systemStatus']
  };

  const dataTypesToUpdate = updateMap[action] || [];
  
  // Trigger immediate update for affected data types
  dataTypesToUpdate.forEach(async (dataType) => {
    try {
      let data;
      
      switch (dataType) {
        case 'powerModules':
          data = await hardwareBridge.getPowerModules();
          break;
        case 'batteries':
          data = await hardwareBridge.getBatteryInfo();
          break;
        case 'dcOutputs':
          data = await hardwareBridge.getDCOutputs();
          break;
        case 'alarms':
          data = await hardwareBridge.getActiveAlarms();
          break;
        case 'systemStatus':
          data = await hardwareBridge.getSystemStatus();
          break;
      }

      if (data) {
        io.to(`hardware:${dataType}`).emit(`hardware:${dataType}`, {
          data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`Error updating ${dataType}:`, error);
    }
  });
}
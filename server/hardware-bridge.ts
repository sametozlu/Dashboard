import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import net from 'net'; // TCP client için ekleme
import { STM32Bridge } from './stm32-bridge';

export interface PowerModule {
  moduleId: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  isActive: boolean;
  hasFault: boolean;
}

export interface BatteryInfo {
  batteryId: number;
  voltage: number;
  current: number;
  temperature: number;
  capacityPercent: number;
  isCharging: boolean;
  testInProgress: boolean;
}

export interface ACPhase {
  phaseId: number;
  voltage: number;
  current: number;
  frequency: number;
  power: number;
  isNormal: boolean;
}

export interface DCCircuit {
  circuitId: number;
  voltage: number;
  current: number;
  power: number;
  isEnabled: boolean;
  loadName: string;
}

export interface AlarmData {
  alarmId: number;
  severity: number; // 0=Info, 1=Warning, 2=Critical
  timestamp: number;
  isActive: boolean;
  messageKey?: string;
  message?: string;
}

export interface SystemStatus {
  mainsAvailable: boolean;
  batteryBackup: boolean;
  generatorRunning: boolean;
  operationMode: number; // 0=Auto, 1=Manual, 2=Test
  systemLoad: number;
  uptimeSeconds: number;
}

class HardwareBridge extends EventEmitter {
  private hwProcess: ChildProcess | null = null;
  private isInitialized = false;
  private commandQueue: Array<{ command: string, resolve: Function, reject: Function }> = [];
  private isProcessing = false;
  private isSimulationMode = true; // Gerçek donanım bağlandığında false yapılacak
  private realHardwareConnected = false; // Gerçek donanım durumu
  private tcpClient: net.Socket | null = null; // TCP client referansı
  private tcpBuffer: string = '';
  private hasLoggedTcpError: boolean = false;
  private stm32Bridge: STM32Bridge | null = null; // STM32 bridge referansı
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastUpdateTs: number = 0;
  
  // Configurable via environment vars
  private readonly tcpHost: string = process.env.HARDWARE_TCP_HOST || '127.0.0.1';
  private readonly tcpPort: number = Number(process.env.HARDWARE_TCP_PORT || 9000);
  private readonly hardwareEnabled: boolean = (() => {
    if (process.env.HARDWARE_ENABLED === 'true') return true;
    if (process.env.HARDWARE_ENABLED === 'false') return false;
    // Default: production'da true, development'ta false
    return process.env.NODE_ENV === 'production';
  })();

  constructor() {
    super();
    this.initializeHardware();
  }

  private async initializeHardware(): Promise<void> {
    try {
      if (this.hardwareEnabled) {
        // STM32 bridge'i başlat
        this.initializeSTM32Bridge();
        // Donanım TCP sunucusuna bağlan
        this.connectToHardwareTCP();
      } else {
        // Donanım dev ortamında devre dışı: simülasyonda başla
        this.isSimulationMode = true;
      }
      this.isInitialized = true;
      this.emit('initialized');
      // Simülasyon polling'i kaldırıldı, gerçek donanımda TCP'den veri beklenir
    } catch (error) {
      if (!this.hasLoggedTcpError) {
        console.error('Failed to initialize hardware:', error);
        this.hasLoggedTcpError = true;
      }
      this.emit('error', error);
    }
  }

  /**
   * STM32 bridge'i başlatır ve event listener'ları ayarlar
   */
  private initializeSTM32Bridge(): void {
    try {
      this.stm32Bridge = new STM32Bridge();
      
      // Event listener'ları ayarla
      this.stm32Bridge.on('powerModuleData', (data) => {
        this.emit('powerModuleData', data);
      });
      
      this.stm32Bridge.on('batteryData', (data) => {
        this.emit('batteryData', data);
      });
      
      this.stm32Bridge.on('acInputData', (data) => {
        this.emit('acInputData', data);
      });
      
      this.stm32Bridge.on('dcOutputData', (data) => {
        this.emit('dcOutputData', data);
      });
      
      this.stm32Bridge.on('alarmData', (data) => {
        this.emit('alarmData', data);
      });
      
      this.stm32Bridge.on('systemStatusData', (data) => {
        this.emit('systemStatusData', data);
      });
      
      this.stm32Bridge.on('connected', () => {
        console.log('STM32 Bridge: Connected to hardware');
        this.realHardwareConnected = true;
        this.isSimulationMode = false;
      });
      
      this.stm32Bridge.on('disconnected', () => {
        console.log('STM32 Bridge: Disconnected from hardware');
        this.realHardwareConnected = false;
        this.isSimulationMode = true;
      });
      
      this.stm32Bridge.on('error', (error) => {
        console.error('STM32 Bridge error:', error);
        this.emit('error', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize STM32 bridge:', error);
      this.emit('error', error);
    }
  }

  /**
   * Donanım C sunucusuna TCP ile bağlanır ve veri alır.
   * Alınan veri EventEmitter ile 'hardwareData' event'i olarak yayınlanır.
   */
  private connectToHardwareTCP() {
    // Temiz önceki bağlantı/timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.tcpClient) {
      try { this.tcpClient.removeAllListeners(); this.tcpClient.destroy(); } catch {}
    }

    this.tcpClient = new net.Socket();
    this.tcpClient.connect(this.tcpPort, this.tcpHost, () => {
      console.log('C donanım sunucusuna TCP ile bağlanıldı.');
      this.realHardwareConnected = true;
      this.isSimulationMode = false;
      this.reconnectAttempts = 0;
    });
    this.tcpClient.on('data', (data: Buffer) => {
      // Gelen veriyi buffer'da biriktir, satır satır işle
      this.tcpBuffer += data.toString();
      let lines = this.tcpBuffer.split('\n');
      this.tcpBuffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          // Donanımdan gelen her satırı event olarak yayınla
          this.emit('hardwareData', line.trim());
          this.lastUpdateTs = Date.now();
        }
      }
    });
    const scheduleReconnect = (reason: string) => {
      this.realHardwareConnected = false;
      this.isSimulationMode = true;
      const base = 1000;
      const max = 30000;
      this.reconnectAttempts = Math.min(this.reconnectAttempts + 1, 30);
      const delay = Math.min(base * Math.pow(2, this.reconnectAttempts - 1), max);
      console.log(`TCP bağlantı koptu (${reason}). ${Math.floor(delay/1000)}s sonra tekrar denenecek...`);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connectToHardwareTCP(), delay);
    };
    this.tcpClient.on('close', () => scheduleReconnect('close'));
    this.tcpClient.on('error', (err) => {
      if (!this.hasLoggedTcpError) {
        console.error('TCP client hata:', err);
        this.hasLoggedTcpError = true;
      }
      scheduleReconnect('error');
    });
  }

  public getLastUpdateTs(): number {
    return this.lastUpdateTs;
  }

  private async executeCommand(command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ command, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.commandQueue.length > 0) {
      const { command, resolve, reject } = this.commandQueue.shift()!;
      
      try {
        const result = await this.processCommand(command);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  private async processCommand(command: string): Promise<any> {
    const cmd = JSON.parse(command);
    
    // Gerçek donanım bağlıysa gerçek komutları çalıştır, yoksa simülasyon kullan
    if (this.realHardwareConnected && !this.isSimulationMode) {
      return await this.executeRealHardwareCommand(cmd);
    } else {
      return await this.executeSimulatedCommand(cmd);
    }
  }

  // Gerçek donanım komutları - gerçek C kütüphanesi ile haberleşme
  private async executeRealHardwareCommand(cmd: any): Promise<any> {
    // TODO: Buraya gerçek C kütüphanesi çağrıları eklenecek
    console.log(`Executing real hardware command: ${cmd.action}`);
    
    switch (cmd.action) {
      case 'getPowerModules':
        // Gerçek güç modülü verilerini al
        return await this.getRealPowerModulesData();
      
      case 'getBatteryInfo':
        // Gerçek pil verilerini al
        return await this.getRealBatteryInfoData();
      
      case 'getACInputs':
        // Gerçek AC giriş verilerini al
        return await this.getRealACInputsData();
      
      case 'getDCOutputs':
        // Gerçek DC çıkış verilerini al
        return await this.getRealDCOutputsData();
      
      case 'getActiveAlarms':
        // Gerçek alarm verilerini al
        return await this.getRealActiveAlarmsData();
      
      case 'getSystemStatus':
        // Gerçek sistem durumunu al
        return await this.getRealSystemStatusData();
      
      default:
        throw new Error(`Unsupported real hardware command: ${cmd.action}`);
    }
  }

  // Simülasyon komutları - test ve geliştirme için
  private async executeSimulatedCommand(cmd: any): Promise<any> {
    switch (cmd.action) {
      case 'getPowerModules':
        return this.simulatePowerModules();
      
      case 'getBatteryInfo':
        return this.simulateBatteryInfo();
      
      case 'getACInputs':
        return this.simulateACInputs();
      
      case 'getDCOutputs':
        return this.simulateDCOutputs();
      
      case 'getActiveAlarms':
        return this.simulateActiveAlarms();
      
      case 'getSystemStatus':
        return this.simulateSystemStatus();
      
      case 'setPowerModuleState':
        return { success: true, moduleId: cmd.moduleId, enabled: cmd.enabled };
      
      case 'setDCCircuitState':
        return { success: true, circuitId: cmd.circuitId, enabled: cmd.enabled };
      
      case 'startBatteryTest':
        return { success: true, batteryId: cmd.batteryId, testType: cmd.testType };
      
      case 'acknowledgeAlarm':
        return { success: true, alarmId: cmd.alarmId };
      
      case 'setOperationMode':
        return { success: true, mode: cmd.mode };
      
      default:
        throw new Error(`Unknown command: ${cmd.action}`);
    }
  }

  private simulatePowerModules(): PowerModule[] {
    return [
      {
        moduleId: 1,
        voltage: 53.5 + (Math.random() - 0.5) * 0.2,
        current: 45.2 + (Math.random() - 0.5) * 2,
        power: 2.4 + (Math.random() - 0.5) * 0.1,
        temperature: 42 + (Math.random() - 0.5) * 4,
        isActive: true,
        hasFault: false
      },
      {
        moduleId: 2,
        voltage: 53.4 + (Math.random() - 0.5) * 0.2,
        current: 44.8 + (Math.random() - 0.5) * 2,
        power: 2.39 + (Math.random() - 0.5) * 0.1,
        temperature: 44 + (Math.random() - 0.5) * 4,
        isActive: true,
        hasFault: false
      },
      {
        moduleId: 3,
        voltage: 53.6 + (Math.random() - 0.5) * 0.2,
        current: 45.5 + (Math.random() - 0.5) * 2,
        power: 2.44 + (Math.random() - 0.5) * 0.1,
        temperature: 41 + (Math.random() - 0.5) * 4,
        isActive: true,
        hasFault: false
      },
      {
        moduleId: 4,
        voltage: 0,
        current: 0,
        power: 0,
        temperature: 25,
        isActive: false,
        hasFault: false
      }
    ];
  }

  private simulateBatteryInfo(): BatteryInfo[] {
    return [
      {
        batteryId: 1,
        voltage: 12.6 + (Math.random() - 0.5) * 0.1,
        current: 0.1 + (Math.random() - 0.5) * 0.05,
        temperature: 24 + (Math.random() - 0.5) * 2,
        capacityPercent: 87 + Math.floor((Math.random() - 0.5) * 4),
        isCharging: false,
        testInProgress: false
      },
      {
        batteryId: 2,
        voltage: 12.5 + (Math.random() - 0.5) * 0.1,
        current: 0.1 + (Math.random() - 0.5) * 0.05,
        temperature: 25 + (Math.random() - 0.5) * 2,
        capacityPercent: 85 + Math.floor((Math.random() - 0.5) * 4),
        isCharging: false,
        testInProgress: false
      },
      {
        batteryId: 3,
        voltage: 12.7 + (Math.random() - 0.5) * 0.1,
        current: 0.1 + (Math.random() - 0.5) * 0.05,
        temperature: 24 + (Math.random() - 0.5) * 2,
        capacityPercent: 89 + Math.floor((Math.random() - 0.5) * 4),
        isCharging: false,
        testInProgress: false
      },
      {
        batteryId: 4,
        voltage: 12.6 + (Math.random() - 0.5) * 0.1,
        current: 0.1 + (Math.random() - 0.5) * 0.05,
        temperature: 26 + (Math.random() - 0.5) * 2,
        capacityPercent: 86 + Math.floor((Math.random() - 0.5) * 4),
        isCharging: false,
        testInProgress: false
      }
    ];
  }

  private simulateACInputs(): ACPhase[] {
    return [
      {
        phaseId: 1,
        voltage: 230.5 + (Math.random() - 0.5) * 2,
        current: 12.3 + (Math.random() - 0.5) * 1,
        frequency: 50.0,
        power: 2.83 + (Math.random() - 0.5) * 0.1,
        isNormal: true
      },
      {
        phaseId: 2,
        voltage: 231.2 + (Math.random() - 0.5) * 2,
        current: 11.8 + (Math.random() - 0.5) * 1,
        frequency: 50.0,
        power: 2.73 + (Math.random() - 0.5) * 0.1,
        isNormal: true
      },
      {
        phaseId: 3,
        voltage: 229.8 + (Math.random() - 0.5) * 2,
        current: 12.1 + (Math.random() - 0.5) * 1,
        frequency: 50.0,
        power: 2.78 + (Math.random() - 0.5) * 0.1,
        isNormal: true
      }
    ];
  }

  private simulateDCOutputs(): DCCircuit[] {
    const loadNames = ["Telecom", "Security", "Network", "Lighting", "Spare", "Spare"];
    
    return loadNames.map((loadName, index) => ({
      circuitId: index + 1,
      voltage: index < 4 ? 53.5 + (Math.random() - 0.5) * 0.2 : 0,
      current: index < 4 ? 6 + Math.random() * 10 : 0,
      power: index < 4 ? (53.5 + (Math.random() - 0.5) * 0.2) * (6 + Math.random() * 10) : 0,
      isEnabled: index < 4,
      loadName
    }));
  }

  private simulateActiveAlarms(): AlarmData[] {
    const currentTime = Math.floor(Date.now() / 1000);
    const alarms = [];
    
    // Critical alarm (occasionally)
    if (Math.random() > 0.7) {
      alarms.push({
        alarmId: 101,
        severity: 2, // Critical
        timestamp: currentTime - 180,
        isActive: true,
        messageKey: "powerOutageMainGridLost"
      });
    }
    
    // Warning alarms (more frequent)
    if (Math.random() > 0.5) {
      alarms.push({
        alarmId: 102,
        severity: 1, // Warning
        timestamp: currentTime - 600,
        isActive: true,
        messageKey: "highTempRectifier2"
      });
    }
    
    if (Math.random() > 0.6) {
      alarms.push({
        alarmId: 103,
        severity: 1, // Warning
        timestamp: currentTime - 900,
        isActive: true,
        messageKey: "lowBatteryVoltageGroup1"
      });
    }
    
    // Info notifications (frequent)
    if (Math.random() > 0.3) {
      alarms.push({
        alarmId: 104,
        severity: 0, // Info
        timestamp: currentTime - 1200,
        isActive: true,
        messageKey: "systemMaintenanceTime"
      });
    }
    
    return alarms;
  }

  private simulateSystemStatus(): SystemStatus {
    return {
      mainsAvailable: true,
      batteryBackup: true,
      generatorRunning: false,
      operationMode: 0, // Auto
      systemLoad: 75 + (Math.random() - 0.5) * 10,
      uptimeSeconds: Math.floor(Date.now() / 1000) - 9240000 // ~107 days ago
    };
  }



  // Gerçek donanım entegrasyonu metodları
  private async getRealPowerModulesData(): Promise<PowerModule[]> {
    // TODO: Gerçek C kütüphanesi çağrısı
    // Bu metodda gerçek güç modüllerinden voltaj, akım, güç verilerini alacak
    console.log('Getting real power module data from hardware...');
    throw new Error('Real hardware not connected yet');
  }

  private async getRealBatteryInfoData(): Promise<BatteryInfo[]> {
    // TODO: Gerçek pil verilerini al
    // Pil voltajı, akımı, sıcaklığı, kapasite yüzdesi
    console.log('Getting real battery data from hardware...');
    throw new Error('Real hardware not connected yet');
  }

  private async getRealACInputsData(): Promise<ACPhase[]> {
    // TODO: Gerçek AC giriş verilerini al
    // AC voltaj, akım, frekans verileri
    console.log('Getting real AC input data from hardware...');
    throw new Error('Real hardware not connected yet');
  }

  private async getRealDCOutputsData(): Promise<DCCircuit[]> {
    // TODO: Gerçek DC çıkış verilerini al
    // DC voltaj, akım, güç verileri
    console.log('Getting real DC output data from hardware...');
    throw new Error('Real hardware not connected yet');
  }

  private async getRealActiveAlarmsData(): Promise<AlarmData[]> {
    // TODO: Gerçek alarm verilerini al
    // Sistem alarmları ve uyarıları
    console.log('Getting real alarm data from hardware...');
    throw new Error('Real hardware not connected yet');
  }

  private async getRealSystemStatusData(): Promise<SystemStatus> {
    // TODO: Gerçek sistem durumunu al
    // Şebeke durumu, pil yedekleme, jeneratör durumu
    console.log('Getting real system status from hardware...');
    throw new Error('Real hardware not connected yet');
  }

  // Donanım bağlantı durumu kontrolü
  public isRealHardwareConnected(): boolean {
    return this.realHardwareConnected;
  }

  // Donanım bağlantısını etkinleştir
  public enableRealHardware(): void {
    this.realHardwareConnected = true;
    this.isSimulationMode = false;
    console.log('Real hardware mode enabled');
  }

  // Simülasyon moduna geç
  public enableSimulationMode(): void {
    this.realHardwareConnected = false;
    this.isSimulationMode = true;
    console.log('Simulation mode enabled');
  }

  // STM32 bridge'e komut gönder
  public sendSTM32Command(commandId: number, targetId: number, action: number, parameter: number): boolean {
    if (this.stm32Bridge && this.stm32Bridge.isConnectedToHardware()) {
      return this.stm32Bridge.sendCommand(commandId, targetId, action, parameter);
    }
    return false;
  }

  // STM32 bridge bağlantı durumu
  public isSTM32Connected(): boolean {
    return this.stm32Bridge ? this.stm32Bridge.isConnectedToHardware() : false;
  }

  // API fonksiyonları
  async getPowerModules(): Promise<PowerModule[]> {
    if (this.isSimulationMode) {
      return this.simulatePowerModules();
    } else {
      return this.getRealPowerModulesData();
    }
  }

  async setPowerModuleState(moduleId: number, enabled: boolean): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isSimulationMode) {
        return { success: true, message: `Power module ${moduleId} ${enabled ? 'enabled' : 'disabled'} (simulation)` };
      } else {
        // Gerçek donanım komutu gönder
        const success = this.sendSTM32Command(1, moduleId, enabled ? 2 : 3, 0);
        return { success, message: success ? `Power module ${moduleId} ${enabled ? 'enabled' : 'disabled'}` : 'Command failed' };
      }
    } catch (error) {
      return { success: false, message: 'Error setting power module state' };
    }
  }

  async getBatteryInfo(): Promise<BatteryInfo[]> {
    if (this.isSimulationMode) {
      return this.simulateBatteryInfo();
    } else {
      return this.getRealBatteryInfoData();
    }
  }

  async startBatteryTest(batteryId: number, testType: number): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isSimulationMode) {
        return { success: true, message: `Battery ${batteryId} test started (simulation)` };
      } else {
        // Gerçek donanım komutu gönder
        const success = this.sendSTM32Command(2, batteryId, 2, testType);
        return { success, message: success ? `Battery ${batteryId} test started` : 'Command failed' };
      }
    } catch (error) {
      return { success: false, message: 'Error starting battery test' };
    }
  }

  async getACInputs(): Promise<ACPhase[]> {
    if (this.isSimulationMode) {
      return this.simulateACInputs();
    } else {
      return this.getRealACInputsData();
    }
  }

  async getDCOutputs(): Promise<DCCircuit[]> {
    if (this.isSimulationMode) {
      return this.simulateDCOutputs();
    } else {
      return this.getRealDCOutputsData();
    }
  }

  async setDCCircuitState(circuitId: number, enabled: boolean): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isSimulationMode) {
        return { success: true, message: `DC circuit ${circuitId} ${enabled ? 'enabled' : 'disabled'} (simulation)` };
      } else {
        // Gerçek donanım komutu gönder
        const success = this.sendSTM32Command(3, circuitId, enabled ? 2 : 3, 0);
        return { success, message: success ? `DC circuit ${circuitId} ${enabled ? 'enabled' : 'disabled'}` : 'Command failed' };
      }
    } catch (error) {
      return { success: false, message: 'Error setting DC circuit state' };
    }
  }

  async getActiveAlarms(): Promise<AlarmData[]> {
    if (this.isSimulationMode) {
      return this.simulateActiveAlarms();
    } else {
      return this.getRealActiveAlarmsData();
    }
  }

  async acknowledgeAlarm(alarmId: number): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isSimulationMode) {
        return { success: true, message: `Alarm ${alarmId} acknowledged (simulation)` };
      } else {
        // Gerçek donanım komutu gönder
        const success = this.sendSTM32Command(4, alarmId, 1, 0);
        return { success, message: success ? `Alarm ${alarmId} acknowledged` : 'Command failed' };
      }
    } catch (error) {
      return { success: false, message: 'Error acknowledging alarm' };
    }
  }

  async getSystemStatus(): Promise<SystemStatus> {
    if (this.isSimulationMode) {
      return this.simulateSystemStatus();
    } else {
      return this.getRealSystemStatusData();
    }
  }

  async setOperationMode(mode: number): Promise<{ success: boolean; message: string }> {
    try {
      if (this.isSimulationMode) {
        return { success: true, message: `Operation mode set to ${mode} (simulation)` };
      } else {
        // Gerçek donanım komutu gönder
        const success = this.sendSTM32Command(5, 0, 1, mode);
        return { success, message: success ? `Operation mode set to ${mode}` : 'Command failed' };
      }
    } catch (error) {
      return { success: false, message: 'Error setting operation mode' };
    }
  }

  cleanup(): void {
    if (this.hwProcess) {
      this.hwProcess.kill();
      this.hwProcess = null;
    }
    
    if (this.stm32Bridge) {
      this.stm32Bridge.disconnect();
      this.stm32Bridge = null;
    }
    
    this.isInitialized = false;
  }
}

export const hardwareBridge = new HardwareBridge();
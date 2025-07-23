import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import net from 'net'; // TCP client için ekleme

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

  constructor() {
    super();
    this.initializeHardware();
  }

  private async initializeHardware(): Promise<void> {
    try {
      // Donanım TCP sunucusuna bağlan
      this.connectToHardwareTCP();
      this.isInitialized = true;
      this.emit('initialized');
      // Simülasyon polling'i kaldırıldı, gerçek donanımda TCP'den veri beklenir
    } catch (error) {
      console.error('Failed to initialize hardware:', error);
      this.emit('error', error);
    }
  }

  /**
   * Donanım C sunucusuna TCP ile bağlanır ve veri alır.
   * Alınan veri EventEmitter ile 'hardwareData' event'i olarak yayınlanır.
   */
  private connectToHardwareTCP() {
    this.tcpClient = new net.Socket();
    this.tcpClient.connect(9000, '127.0.0.1', () => {
      console.log('C donanım sunucusuna TCP ile bağlanıldı.');
      this.realHardwareConnected = true;
      this.isSimulationMode = false;
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
        }
      }
    });
    this.tcpClient.on('close', () => {
      console.log('C donanım sunucusu bağlantısı kapandı.');
      this.realHardwareConnected = false;
      this.isSimulationMode = true;
    });
    this.tcpClient.on('error', (err) => {
      console.error('TCP client hata:', err);
      this.realHardwareConnected = false;
      this.isSimulationMode = true;
    });
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

  // Public API methods
  async getPowerModules(): Promise<PowerModule[]> {
    const command = JSON.stringify({ action: 'getPowerModules' });
    return await this.executeCommand(command);
  }

  async setBowerModuleState(moduleId: number, enabled: boolean): Promise<any> {
    const command = JSON.stringify({ 
      action: 'setPowerModuleState', 
      moduleId, 
      enabled 
    });
    return await this.executeCommand(command);
  }

  async getBatteryInfo(): Promise<BatteryInfo[]> {
    const command = JSON.stringify({ action: 'getBatteryInfo' });
    return await this.executeCommand(command);
  }

  async startBatteryTest(batteryId: number, testType: number): Promise<any> {
    const command = JSON.stringify({ 
      action: 'startBatteryTest', 
      batteryId, 
      testType 
    });
    return await this.executeCommand(command);
  }

  async getACInputs(): Promise<ACPhase[]> {
    const command = JSON.stringify({ action: 'getACInputs' });
    return await this.executeCommand(command);
  }

  async getDCOutputs(): Promise<DCCircuit[]> {
    const command = JSON.stringify({ action: 'getDCOutputs' });
    return await this.executeCommand(command);
  }

  async setDCCircuitState(circuitId: number, enabled: boolean): Promise<any> {
    const command = JSON.stringify({ 
      action: 'setDCCircuitState', 
      circuitId, 
      enabled 
    });
    return await this.executeCommand(command);
  }

  async getActiveAlarms(): Promise<AlarmData[]> {
    const command = JSON.stringify({ action: 'getActiveAlarms' });
    return await this.executeCommand(command);
  }

  async acknowledgeAlarm(alarmId: number): Promise<any> {
    const command = JSON.stringify({ 
      action: 'acknowledgeAlarm', 
      alarmId 
    });
    return await this.executeCommand(command);
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const command = JSON.stringify({ action: 'getSystemStatus' });
    return await this.executeCommand(command);
  }

  async setOperationMode(mode: number): Promise<any> {
    const command = JSON.stringify({ 
      action: 'setOperationMode', 
      mode 
    });
    return await this.executeCommand(command);
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

  cleanup(): void {
    if (this.hwProcess) {
      this.hwProcess.kill();
      this.hwProcess = null;
    }
    this.isInitialized = false;
  }
}

export const hardwareBridge = new HardwareBridge();
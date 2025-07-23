// WebSocket event types for type-safe communication

export interface ServerToClientEvents {
  // System events
  'system:status': (data: { connected: boolean; timestamp: number }) => void;
  
  // Hardware data events
  'hardware:powerModules': (data: { data: any[]; timestamp: number }) => void;
  'hardware:batteries': (data: { data: any[]; timestamp: number }) => void;
  'hardware:acInputs': (data: { data: any[]; timestamp: number }) => void;
  'hardware:dcOutputs': (data: { data: any[]; timestamp: number }) => void;
  'hardware:alarms': (data: { data: any[]; timestamp: number }) => void;
  'hardware:systemStatus': (data: { data: any; timestamp: number }) => void;
  
  // Error events
  'hardware:powerModules:error': (data: { error: string; timestamp: number }) => void;
  'hardware:batteries:error': (data: { error: string; timestamp: number }) => void;
  'hardware:acInputs:error': (data: { error: string; timestamp: number }) => void;
  'hardware:dcOutputs:error': (data: { error: string; timestamp: number }) => void;
  'hardware:alarms:error': (data: { error: string; timestamp: number }) => void;
  'hardware:systemStatus:error': (data: { error: string; timestamp: number }) => void;
  
  // Control response events
  'hardware:control:response': (data: {
    success: boolean;
    data?: any;
    error?: string;
    requestId: string;
  }) => void;
}

export interface ClientToServerEvents {
  // Subscription events
  'hardware:subscribe': (dataType: string) => void;
  'hardware:unsubscribe': (dataType: string) => void;
  
  // Control events
  'hardware:control': (data: HardwareControlRequest) => void;
}

export interface HardwareControlRequest {
  action: 'setPowerModuleState' | 'setDCCircuitState' | 'startBatteryTest' | 'acknowledgeAlarm' | 'setOperationMode';
  requestId: string;
  moduleId?: number;
  circuitId?: number;
  batteryId?: number;
  alarmId?: number;
  enabled?: boolean;
  testType?: number;
  mode?: number;
}

export interface InterServerEvents {
  // Events between server instances (for scaling)
}

export interface SocketData {
  // Data stored per socket connection
  user: {
    id: number;
    username: string;
  };
}

// Hardware data types
export interface PowerModuleData {
  moduleId: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  isActive: boolean;
  hasFault: boolean;
}

export interface BatteryData {
  batteryId: number;
  voltage: number;
  current: number;
  temperature: number;
  capacityPercent: number;
  isCharging: boolean;
  testInProgress: boolean;
}

export interface ACInputData {
  phaseId: number;
  voltage: number;
  current: number;
  frequency: number;
  power: number;
  isNormal: boolean;
}

export interface DCOutputData {
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
  message: string;
}

export interface SystemStatusData {
  mainsAvailable: boolean;
  batteryBackup: boolean;
  generatorRunning: boolean;
  operationMode: number; // 0=Auto, 1=Manual, 2=Test
  systemLoad: number;
  uptimeSeconds: number;
}
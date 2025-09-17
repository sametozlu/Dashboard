import { EventEmitter } from 'events';
import net from 'net';

// STM32 Packet Types (from stm32_interface.h)
enum STM32PacketType {
    POWER_MODULE = 0x01,
    BATTERY = 0x02,
    AC_INPUT = 0x03,
    DC_OUTPUT = 0x04,
    ALARM = 0x05,
    SYSTEM_STATUS = 0x06,
    COMMAND = 0x07,
    RESPONSE = 0x08
}

// STM32 Packet Structure
interface STM32Packet {
    headerHigh: number;    // 0xAA
    headerLow: number;     // 0x55
    packetType: number;
    length: number;
    data: Buffer;
    checksum: number;
}

// STM32 Data Structures
interface STM32PowerModuleData {
    moduleId: number;
    voltage: number;       // mV
    current: number;       // mA
    power: number;         // mW
    temperature: number;   // Celsius
    status: number;        // Bit flags
    faultFlags: number;    // Bit flags
}

interface STM32BatteryData {
    batteryId: number;
    voltage: number;       // mV
    current: number;       // mA
    temperature: number;   // Celsius
    capacity: number;      // Percentage
    charging: boolean;
    testStatus: boolean;
}

interface STM32ACInputData {
    phaseId: number;
    voltage: number;       // V * 10
    current: number;       // A * 10
    frequency: number;     // Hz * 10
    power: number;         // W
    status: number;        // Bit flags
}

interface STM32DCOutputData {
    circuitId: number;
    voltage: number;       // mV
    current: number;       // mA
    power: number;         // mW
    enabled: boolean;
    loadName: string;      // 6 chars max
}

interface STM32AlarmData {
    alarmId: number;
    severity: number;      // 0=Info, 1=Warning, 2=Critical
    timestamp: number;     // Unix timestamp
    isActive: boolean;
    message: string;       // 7 chars max
}

interface STM32SystemStatusData {
    mainsAvailable: boolean;
    batteryBackup: boolean;
    generatorRunning: boolean;
    operationMode: number; // 0=Auto, 1=Manual, 2=Test
    systemLoad: number;    // Percentage * 10
    uptimeSeconds: number;
}

// Converted Data Interfaces (for frontend)
interface PowerModule {
    moduleId: number;
    voltage: number;       // V
    current: number;       // A
    power: number;         // W
    temperature: number;   // Celsius
    isActive: boolean;
    hasFault: boolean;
}

interface BatteryInfo {
    batteryId: number;
    voltage: number;       // V
    current: number;       // A
    temperature: number;   // Celsius
    capacityPercent: number;
    isCharging: boolean;
    testInProgress: boolean;
}

interface ACPhase {
    phaseId: number;
    voltage: number;       // V
    current: number;       // A
    frequency: number;     // Hz
    power: number;         // W
    isNormal: boolean;
}

interface DCCircuit {
    circuitId: number;
    voltage: number;       // V
    current: number;       // A
    power: number;         // W
    isEnabled: boolean;
    loadName: string;
}

interface AlarmData {
    alarmId: number;
    severity: number;
    timestamp: number;
    isActive: boolean;
    message: string;
}

interface SystemStatus {
    mainsAvailable: boolean;
    batteryBackup: boolean;
    generatorRunning: boolean;
    operationMode: number;
    systemLoad: number;
    uptimeSeconds: number;
}

class STM32Bridge extends EventEmitter {
    private tcpClient: net.Socket | null = null;
    private isConnected = false;
    private buffer = Buffer.alloc(0);
    private readonly host: string;
    private readonly port: number;
    private reconnectInterval: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor(host: string = '127.0.0.1', port: number = 9000) {
        super();
        this.host = host;
        this.port = port;
        this.connect();
        this.startHeartbeat();
    }

    private connect(): void {
        this.tcpClient = new net.Socket();
        
        this.tcpClient.on('connect', () => {
            console.log(`STM32 Bridge: Connected to ${this.host}:${this.port}`);
            this.isConnected = true;
            this.emit('connected');
            this.stopReconnect();
        });

        this.tcpClient.on('data', (data: Buffer) => {
            this.handleIncomingData(data);
        });

        this.tcpClient.on('close', () => {
            console.log('STM32 Bridge: Connection closed');
            this.isConnected = false;
            this.emit('disconnected');
            this.startReconnect();
        });

        this.tcpClient.on('error', (error) => {
            console.error('STM32 Bridge: TCP error:', error);
            this.isConnected = false;
            this.emit('error', error);
        });

        this.tcpClient.connect(this.port, this.host);
    }

    private startReconnect(): void {
        if (this.reconnectInterval) return;
        
        this.reconnectInterval = setInterval(() => {
            console.log('STM32 Bridge: Attempting to reconnect...');
            this.connect();
        }, 5000);
    }

    private stopReconnect(): void {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendHeartbeat();
            }
        }, 30000); // 30 seconds
    }

    private sendHeartbeat(): void {
        const heartbeat = Buffer.from([0xAA, 0x55, 0x00, 0x00, 0x00]);
        this.sendData(heartbeat);
    }

    private handleIncomingData(data: Buffer): void {
        // Add new data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);
        
        // Process complete packets
        while (this.buffer.length >= 5) { // Minimum packet size
            const packet = this.parsePacket();
            if (!packet) break; // Incomplete packet
            
            this.processPacket(packet);
        }
    }

    private parsePacket(): STM32Packet | null {
        // Look for packet header
        const headerIndex = this.buffer.indexOf(0xAA);
        if (headerIndex === -1) {
            this.buffer = Buffer.alloc(0); // Clear buffer if no header found
            return null;
        }
        
        if (headerIndex > 0) {
            this.buffer = this.buffer.slice(headerIndex); // Remove data before header
        }
        
        // Check if we have enough data for a complete packet
        if (this.buffer.length < 5) return null;
        
        // Check second header byte
        if (this.buffer[1] !== 0x55) {
            this.buffer = this.buffer.slice(1); // Skip invalid header
            return null;
        }
        
        const packetType = this.buffer[2];
        const length = this.buffer[3];
        const totalLength = 5 + length; // header + type + length + data + checksum
        
        if (this.buffer.length < totalLength) return null;
        
        // Extract packet
        const packet: STM32Packet = {
            headerHigh: this.buffer[0],
            headerLow: this.buffer[1],
            packetType: packetType,
            length: length,
            data: this.buffer.slice(4, 4 + length),
            checksum: this.buffer[4 + length]
        };
        
        // Validate checksum
        if (this.validateChecksum(packet)) {
            // Remove processed packet from buffer
            this.buffer = this.buffer.slice(totalLength);
            return packet;
        } else {
            // Invalid checksum, skip this packet
            this.buffer = this.buffer.slice(1);
            return null;
        }
    }

    private validateChecksum(packet: STM32Packet): boolean {
        let checksum = 0;
        
        // Calculate checksum for header + type + length + data
        checksum ^= packet.headerHigh;
        checksum ^= packet.headerLow;
        checksum ^= packet.packetType;
        checksum ^= packet.length;
        
        for (let i = 0; i < packet.data.length; i++) {
            checksum ^= packet.data[i];
        }
        
        return checksum === packet.checksum;
    }

    private processPacket(packet: STM32Packet): void {
        try {
            switch (packet.packetType) {
                case STM32PacketType.POWER_MODULE:
                    const powerModule = this.parsePowerModuleData(packet.data);
                    if (powerModule) {
                        this.emit('powerModuleData', powerModule);
                    }
                    break;
                    
                case STM32PacketType.BATTERY:
                    const battery = this.parseBatteryData(packet.data);
                    if (battery) {
                        this.emit('batteryData', battery);
                    }
                    break;
                    
                case STM32PacketType.AC_INPUT:
                    const acInput = this.parseACInputData(packet.data);
                    if (acInput) {
                        this.emit('acInputData', acInput);
                    }
                    break;
                    
                case STM32PacketType.DC_OUTPUT:
                    const dcOutput = this.parseDCOutputData(packet.data);
                    if (dcOutput) {
                        this.emit('dcOutputData', dcOutput);
                    }
                    break;
                    
                case STM32PacketType.ALARM:
                    const alarm = this.parseAlarmData(packet.data);
                    if (alarm) {
                        this.emit('alarmData', alarm);
                    }
                    break;
                    
                case STM32PacketType.SYSTEM_STATUS:
                    const systemStatus = this.parseSystemStatusData(packet.data);
                    if (systemStatus) {
                        this.emit('systemStatusData', systemStatus);
                    }
                    break;
                    
                default:
                    console.log(`STM32 Bridge: Unknown packet type: 0x${packet.packetType.toString(16)}`);
            }
        } catch (error) {
            console.error('STM32 Bridge: Error processing packet:', error);
        }
    }

    private parsePowerModuleData(data: Buffer): PowerModule | null {
        if (data.length < 12) return null;
        
        try {
            const moduleData: STM32PowerModuleData = {
                moduleId: data[0],
                voltage: data.readUInt16LE(1),
                current: data.readUInt16LE(3),
                power: data.readUInt16LE(5),
                temperature: data[7],
                status: data[8],
                faultFlags: data[9]
            };
            
            return {
                moduleId: moduleData.moduleId,
                voltage: moduleData.voltage / 1000, // Convert mV to V
                current: moduleData.current / 1000, // Convert mA to A
                power: moduleData.power / 1000,     // Convert mW to W
                temperature: moduleData.temperature,
                isActive: (moduleData.status & 0x01) !== 0,
                hasFault: (moduleData.faultFlags & 0xFF) !== 0
            };
        } catch (error) {
            console.error('STM32 Bridge: Error parsing power module data:', error);
            return null;
        }
    }

    private parseBatteryData(data: Buffer): BatteryInfo | null {
        if (data.length < 10) return null;
        
        try {
            const batteryData: STM32BatteryData = {
                batteryId: data[0],
                voltage: data.readUInt16LE(1),
                current: data.readUInt16LE(3),
                temperature: data[5],
                capacity: data[6],
                charging: (data[7] & 0x01) !== 0,
                testStatus: (data[8] & 0x01) !== 0
            };
            
            return {
                batteryId: batteryData.batteryId,
                voltage: batteryData.voltage / 1000, // Convert mV to V
                current: batteryData.current / 1000, // Convert mA to A
                temperature: batteryData.temperature,
                capacityPercent: batteryData.capacity,
                isCharging: batteryData.charging,
                testInProgress: batteryData.testStatus
            };
        } catch (error) {
            console.error('STM32 Bridge: Error parsing battery data:', error);
            return null;
        }
    }

    private parseACInputData(data: Buffer): ACPhase | null {
        if (data.length < 11) return null;
        
        try {
            const acData: STM32ACInputData = {
                phaseId: data[0],
                voltage: data.readUInt16LE(1),
                current: data.readUInt16LE(3),
                frequency: data.readUInt16LE(5),
                power: data.readUInt16LE(7),
                status: data[9]
            };
            
            return {
                phaseId: acData.phaseId,
                voltage: acData.voltage / 10,    // Convert 10x to actual V
                current: acData.current / 10,    // Convert 10x to actual A
                frequency: acData.frequency / 10, // Convert 10x to actual Hz
                power: acData.power,             // Already in W
                isNormal: (acData.status & 0x01) !== 0
            };
        } catch (error) {
            console.error('STM32 Bridge: Error parsing AC input data:', error);
            return null;
        }
    }

    private parseDCOutputData(data: Buffer): DCCircuit | null {
        if (data.length < 12) return null;
        
        try {
            const dcData: STM32DCOutputData = {
                circuitId: data[0],
                voltage: data.readUInt16LE(1),
                current: data.readUInt16LE(3),
                power: data.readUInt16LE(5),
                enabled: (data[7] & 0x01) !== 0,
                loadName: data.slice(8, 14).toString('ascii').replace(/\0/g, '')
            };
            
            return {
                circuitId: dcData.circuitId,
                voltage: dcData.voltage / 1000, // Convert mV to V
                current: dcData.current / 1000, // Convert mA to A
                power: dcData.power / 1000,     // Convert mW to W
                isEnabled: dcData.enabled,
                loadName: dcData.loadName
            };
        } catch (error) {
            console.error('STM32 Bridge: Error parsing DC output data:', error);
            return null;
        }
    }

    private parseAlarmData(data: Buffer): AlarmData | null {
        if (data.length < 16) return null;
        
        try {
            const alarmData: STM32AlarmData = {
                alarmId: data.readUInt32LE(0),
                severity: data[4],
                timestamp: data.readUInt32LE(5),
                isActive: (data[9] & 0x01) !== 0,
                message: data.slice(10, 17).toString('ascii').replace(/\0/g, '')
            };
            
            return {
                alarmId: alarmData.alarmId,
                severity: alarmData.severity,
                timestamp: alarmData.timestamp * 1000, // Convert to milliseconds
                isActive: alarmData.isActive,
                message: alarmData.message
            };
        } catch (error) {
            console.error('STM32 Bridge: Error parsing alarm data:', error);
            return null;
        }
    }

    private parseSystemStatusData(data: Buffer): SystemStatus | null {
        if (data.length < 8) return null;
        
        try {
            const statusData: STM32SystemStatusData = {
                mainsAvailable: (data[0] & 0x01) !== 0,
                batteryBackup: (data[1] & 0x01) !== 0,
                generatorRunning: (data[2] & 0x01) !== 0,
                operationMode: data[3],
                systemLoad: data.readUInt16LE(4),
                uptimeSeconds: data.readUInt16LE(6)
            };
            
            return {
                mainsAvailable: statusData.mainsAvailable,
                batteryBackup: statusData.batteryBackup,
                generatorRunning: statusData.generatorRunning,
                operationMode: statusData.operationMode,
                systemLoad: statusData.systemLoad / 10, // Convert 10x to actual percentage
                uptimeSeconds: statusData.uptimeSeconds
            };
        } catch (error) {
            console.error('STM32 Bridge: Error parsing system status data:', error);
            return null;
        }
    }

    public sendCommand(commandId: number, targetId: number, action: number, parameter: number): boolean {
        if (!this.isConnected) return false;
        
        const commandData = Buffer.alloc(8);
        commandData[0] = commandId;
        commandData[1] = targetId;
        commandData[2] = action;
        commandData[3] = parameter;
        commandData.writeUInt32LE(0, 4); // Reserved field
        
        const packet = this.createPacket(STM32PacketType.COMMAND, commandData);
        return this.sendData(packet);
    }

    private createPacket(type: number, data: Buffer): Buffer {
        const packet = Buffer.alloc(5 + data.length);
        packet[0] = 0xAA; // Header high
        packet[1] = 0x55; // Header low
        packet[2] = type;
        packet[3] = data.length;
        data.copy(packet, 4);
        
        // Calculate checksum
        let checksum = 0;
        for (let i = 0; i < packet.length - 1; i++) {
            checksum ^= packet[i];
        }
        packet[packet.length - 1] = checksum;
        
        return packet;
    }

    private sendData(data: Buffer): boolean {
        if (!this.isConnected || !this.tcpClient) return false;
        
        try {
            this.tcpClient.write(data);
            return true;
        } catch (error) {
            console.error('STM32 Bridge: Error sending data:', error);
            return false;
        }
    }

    public isConnectedToHardware(): boolean {
        return this.isConnected;
    }

    public disconnect(): void {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.tcpClient) {
            this.tcpClient.destroy();
            this.tcpClient = null;
        }
        
        this.isConnected = false;
    }
}

export { STM32Bridge, STM32PacketType };
export type { 
    PowerModule, BatteryInfo, ACPhase, DCCircuit, AlarmData, SystemStatus,
    STM32Packet, STM32PowerModuleData, STM32BatteryData, STM32ACInputData,
    STM32DCOutputData, STM32AlarmData, STM32SystemStatusData
};

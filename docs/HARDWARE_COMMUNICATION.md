# Hardware Communication Protocol

Bu doküman, gömülü yazılım ve backend arasındaki haberleşme protokolünü açıklamaktadır.

## Genel Bakış

Sistem iki ana bileşen arasında haberleşme kurar:
1. **Backend Server** - Node.js/Express tabanlı API sunucusu
2. **Gömülü Yazılım** - C/C++ ile yazılmış donanım kontrol modülü

## Haberleşme Yöntemleri

### 1. WebSocket Real-Time Communication
- **Port**: 5000 (HTTP sunucusu ile aynı port)
- **Protocol**: Socket.IO
- **Authentication**: Session-based authentication

### 2. Hardware Bridge
- **Dosya**: `server/hardware-bridge.ts`
- **Amaç**: Gömülü yazılım ile backend arasında köprü görevi
- **Mod**: Simülasyon / Gerçek donanım

## Desteklenen Donanım Komutları

### Güç Modülleri (Power Modules)
```typescript
// Veri alma
await hardwareBridge.getPowerModules()
// Dönen format: PowerModule[]

// Modül durumu değiştirme
await hardwareBridge.setBowerModuleState(moduleId: number, enabled: boolean)
```

### Pil Sistemi (Battery System)
```typescript
// Pil bilgileri alma
await hardwareBridge.getBatteryInfo()
// Dönen format: BatteryInfo[]

// Pil testi başlatma
await hardwareBridge.startBatteryTest(batteryId: number, testType: number)
```

### AC Giriş (AC Input)
```typescript
// AC giriş verilerini alma
await hardwareBridge.getACInputs()
// Dönen format: ACPhase[]
```

### DC Çıkış (DC Output)
```typescript
// DC çıkış verilerini alma
await hardwareBridge.getDCOutputs()
// Dönen format: DCCircuit[]

// DC devre durumu değiştirme
await hardwareBridge.setDCCircuitState(circuitId: number, enabled: boolean)
```

### Alarm Sistemi
```typescript
// Aktif alarmları alma
await hardwareBridge.getActiveAlarms()
// Dönen format: AlarmData[]

// Alarm onaylama
await hardwareBridge.acknowledgeAlarm(alarmId: number)
```

### Sistem Durumu
```typescript
// Sistem durumunu alma
await hardwareBridge.getSystemStatus()
// Dönen format: SystemStatus

// İşletim modu değiştirme
await hardwareBridge.setOperationMode(mode: number)
// 0=Auto, 1=Manual, 2=Test
```

## WebSocket Event Types

### Client → Server
- `hardware:subscribe` - Veri tipine abone ol
- `hardware:unsubscribe` - Veri tipinden çık
- `hardware:control` - Donanım kontrolü gönder

### Server → Client
- `hardware:powerModules` - Güç modülü verileri
- `hardware:batteries` - Pil verileri
- `hardware:acInputs` - AC giriş verileri
- `hardware:dcOutputs` - DC çıkış verileri
- `hardware:alarms` - Alarm verileri
- `hardware:systemStatus` - Sistem durumu
- `hardware:control:response` - Kontrol komut yanıtı

## Gerçek Donanım Entegrasyonu

### C Kütüphanesi Entegrasyonu
```c
// hardware/hardware_interface.h dosyasında tanımlı fonksiyonlar:

// Güç modülü verileri alma
int get_power_module_data(PowerModuleData* data, int max_modules);

// Pil verileri alma
int get_battery_data(BatteryData* data, int max_batteries);

// AC giriş verileri alma
int get_ac_input_data(ACInputData* data, int max_phases);

// DC çıkış verileri alma
int get_dc_output_data(DCOutputData* data, int max_circuits);

// Alarm verileri alma
int get_alarm_data(AlarmData* data, int max_alarms);

// Sistem durumu alma
int get_system_status(SystemStatusData* status);

// Kontrol komutları
int set_power_module_state(int module_id, int enabled);
int set_dc_circuit_state(int circuit_id, int enabled);
int start_battery_test(int battery_id, int test_type);
int acknowledge_alarm(int alarm_id);
int set_operation_mode(int mode);
```

### Gerçek Donanım Modu Etkinleştirme
```typescript
// Simülasyon modundan gerçek donanım moduna geçiş
hardwareBridge.enableRealHardware();

// Simülasyon moduna geri dönüş
hardwareBridge.enableSimulationMode();

// Donanım bağlantı durumu kontrolü
const isConnected = hardwareBridge.isRealHardwareConnected();
```

## Güvenlik Özellikleri

### 1. Kimlik Doğrulama
- Tüm API endpoint'leri session tabanlı kimlik doğrulama gerektirir
- WebSocket bağlantıları da aynı session sistemini kullanır

### 2. Input Validation
- Tüm gelen veriler Zod şemaları ile doğrulanır
- Rate limiting middleware aktif
- Input sanitization işlemi yapılır

### 3. Error Handling
- Structured error responses
- Güvenlik açığı vermeyecek şekilde error masking
- Comprehensive logging

## Data Flow

```
Gömülü Yazılım ←→ Hardware Bridge ←→ API Endpoints ←→ WebSocket ←→ Frontend
```

1. **Gömülü yazılım** donanım verilerini okur
2. **Hardware Bridge** bu verileri standardize eder
3. **API Endpoints** HTTP istekleri karşılar
4. **WebSocket** real-time güncellemeler gönderir
5. **Frontend** verileri görselleştirir

## Development vs Production

### Development Mode
- Simülasyon modu aktif
- Mock veriler kullanılır
- Extensive logging
- Hot reload support

### Production Mode
- Gerçek donanım modu
- Actual hardware data
- Optimized performance
- Security hardening

## Testing

### Unit Tests
```bash
npm run test:hardware
```

### Integration Tests
```bash
npm run test:integration
```

### Hardware Simulation Tests
```bash
npm run test:simulation
```

## Monitoring

### Health Checks
- `/api/hardware/health` - Donanım sağlık kontrolü
- WebSocket connection monitoring
- Performance metrics

### Logging
- Structured JSON logging
- Hardware communication logs
- Error tracking
- Performance monitoring

## Deployment Considerations

1. **Port Configuration**: Ensure port 5000 is accessible
2. **Hardware Permissions**: Proper device access permissions
3. **Real-time Requirements**: Low latency network configuration
4. **Backup Systems**: Fallback mechanisms for hardware failures
5. **Monitoring**: Comprehensive system monitoring

## Future Enhancements

1. **MQTT Integration** - IoT device communication
2. **Database Persistence** - Historical data storage
3. **Advanced Analytics** - Predictive maintenance
4. **Remote Management** - Cloud-based monitoring
5. **Multi-site Support** - Distributed system management
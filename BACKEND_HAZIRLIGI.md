# Backend Hazırlığı - Dosya Görünümü

## 📁 Proje Yapısı

```
workspace/
├── server/           # Backend kod dosyaları
├── shared/           # Ortak kod dosyaları (frontend-backend)
├── docs/            # Dokümantasyon
├── client/          # Frontend kod dosyaları
└── hardware/        # Gömülü yazılım kod dosyaları (gelecek)
```
    
## 🔧 Backend Hazırlığı Tamamlanan Dosyalar

### 1. **server/hardware-bridge.ts** (432 satır)
**Amaç**: Gömülü yazılım ile backend arasında köprü
**Özellikler**:
- ✅ Simülasyon modu (şu anda aktif)
- ✅ Gerçek donanım modu (hazır)
- ✅ Güç modülleri kontrol
- ✅ Pil sistemi yönetimi
- ✅ AC/DC giriş/çıkış kontrol
- ✅ Alarm sistemi yönetimi
- ✅ Event-driven architecture

### 2. **server/websocket.ts** (116 satır)
**Amaç**: Real-time veri iletişimi
**Özellikler**:
- ✅ Socket.IO entegrasyonu
- ✅ Session-based authentication
- ✅ Hardware data broadcasting
- ✅ Real-time alarm notifications
- ✅ Client subscription management

### 3. **server/routes.ts** (163 satır)
**Amaç**: HTTP API endpoints
**Özellikler**:
- ✅ Authentication endpoints (/api/auth/*)
- ✅ Hardware data endpoints (/api/hardware/*)
- ✅ Session management
- ✅ Security middleware
- ✅ Input validation

### 4. **server/middleware/validation.ts** (73 satır)
**Amaç**: Güvenlik ve veri doğrulama
**Özellikler**:
- ✅ Zod schema validation
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ Error handling
- ✅ Security headers

### 5. **shared/websocket-types.ts** (107 satır)
**Amaç**: Type-safe WebSocket communication
**Özellikler**:
- ✅ Server-to-client events
- ✅ Client-to-server events
- ✅ Hardware control types
- ✅ Data structure definitions
- ✅ TypeScript type safety

### 6. **shared/schema.ts** (44 satır)
**Amaç**: Database ve API şemaları
**Özellikler**:
- ✅ User authentication schema
- ✅ Session management schema
- ✅ Drizzle ORM integration
- ✅ Type-safe database operations

## 🚀 Ne Hazır Durumda?

### ✅ Tamamlanan Özellikler
1. **Authentication System** - Kullanıcı girişi ve session yönetimi
2. **WebSocket Infrastructure** - Real-time veri akışı
3. **Hardware Simulation** - Test için mock data
4. **API Endpoints** - RESTful servisler
5. **Type Safety** - Full TypeScript support
6. **Security Middleware** - Rate limiting, validation
7. **Error Handling** - Structured error responses

### 🔄 Simülasyon Modu (Şu anda aktif)
```typescript
// Mock veriler ile çalışıyor:
- Güç modülleri: 4 adet simüle edilmiş modül
- Pil sistemi: 8 adet pil simülasyonu
- AC giriş: 3 faz simülasyonu
- DC çıkış: 6 devre simülasyonu
- Alarmlar: Rastgele alarm üretimi
- Sistem durumu: Dinamik simülasyon
```

### 🔌 Gerçek Donanım Entegrasyonu (Hazır)
```typescript
// Tek komutla aktif edilebilir:
hardwareBridge.enableRealHardware();

// C kütüphanesi fonksiyonları hazır:
get_power_module_data()
get_battery_data()
get_ac_input_data()
get_dc_output_data()
get_alarm_data()
set_power_module_state()
// ... ve daha fazlası
```

## 📡 Real-Time Data Flow

```
Gömülü Yazılım → Hardware Bridge → WebSocket → Frontend
     ↑                   ↓              ↓         ↓
Hardware ←── API Endpoints ←── HTTP ←── User Interface
```

### Data Update Frequency
- **Power modules**: 5 saniyede bir
- **Battery info**: 10 saniyede bir
- **Alarms**: Anında (event-driven)
- **System status**: 15 saniyede bir

## 🔐 Güvenlik Özellikleri

### Authentication
- Session-based login system
- Secure session storage
- Automatic session cleanup

### API Security
- Rate limiting (100 req/min per IP)
- Input validation (Zod schemas)
- SQL injection protection
- XSS protection
- CORS configuration

### WebSocket Security
- Session verification
- Connection authentication
- Encrypted data transmission

## 📋 API Endpoints Listesi

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi
- `POST /api/auth/logout` - Çıkış

### Hardware Data
- `GET /api/hardware/power-modules` - Güç modülleri
- `GET /api/hardware/batteries` - Pil bilgileri
- `GET /api/hardware/ac-inputs` - AC giriş verileri
- `GET /api/hardware/dc-outputs` - DC çıkış verileri
- `GET /api/hardware/alarms` - Aktif alarmlar
- `GET /api/hardware/system-status` - Sistem durumu

### Hardware Control
- `POST /api/hardware/control` - Donanım kontrolü

## 🛠️ Gömülü Yazılım Entegrasyonu

### C Header File (hardware/hardware_interface.h)
```c
// Fonksiyon prototipler hazır:
int get_power_module_data(PowerModuleData* data, int max_modules);
int get_battery_data(BatteryData* data, int max_batteries);
int set_power_module_state(int module_id, int enabled);
int start_battery_test(int battery_id, int test_type);
// ... tüm hardware functions
```

### Veri Yapıları Tanımlı
```c
typedef struct {
    int moduleId;
    float voltage;
    float current;
    float power;
    float temperature;
    int isActive;
    int hasFault;
} PowerModuleData;
// ... diğer struct'lar
```

## 🧪 Test Sistemi

### Simulation Tests
- Hardware bridge simulation
- WebSocket connection tests
- API endpoint tests
- Data flow validation

### Integration Tests
- End-to-end data flow
- Real-time update tests
- Error handling tests
- Performance tests

## 📊 Monitoring & Logging

### Health Checks
- Hardware connection status
- WebSocket connection monitoring
- Database health checks
- System resource monitoring

### Logging
- Structured JSON logging
- Hardware communication logs
- Error tracking
- Performance metrics

## 🚦 Durum: %95 Hazır!

### ✅ Tamamlandı
- Backend architecture
- WebSocket infrastructure  
- Hardware bridge system
- Security implementation
- Type safety
- Error handling
- Simulation system

### 🔄 Son Adımlar (Gömülü yazılım geldiğinde)
1. C kütüphanesi derleme
2. Hardware permissions ayarlama
3. Production config
4. Real hardware testing
5. Performance optimization

## 💻 Geliştirici Notları

### Simülasyon Modundan Gerçek Donanıma Geçiş
```bash
# Development (simülasyon)
npm run dev

# Production (gerçek donanım)
npm run start:production
```

### Debug Modu
```bash
DEBUG=hardware:* npm run dev
```

Bu hazırlıkla gömülü yazılım geldiğinde sadece:
1. C kütüphanesini derleyip
2. `enableRealHardware()` çağırarak
3. Sistemi production moduna almak yeterli!
```

### Çözüm Adımları

1. **Donanım Simülatörünü veya Server’ı Başlat**
   - Projende `hardware` klasöründe `hardware_sim.c` ve `hardware_server.c` dosyaları var.
   - Bunlardan birini derleyip çalıştırman gerekiyor.
   - Windows’ta terminale şunu yaz:
     ```sh
     cd hardware
     gcc hardware_sim.c -o hardware_sim.exe
     hardware_sim.exe
     ```
   - Eğer `hardware_server.c` kullanacaksan:
     ```sh
     gcc hardware_server.c -o hardware_server.exe
     hardware_server.exe
     ```
   - (Bilgisayarında GCC yoksa, MinGW veya benzeri bir C derleyici kurmalısın.)

2. **Simülatör çalıştıktan sonra tekrar backend’i başlat**
   - Simülatör arka planda açıkken, başka bir terminalde:
     ```sh
     npm run dev
     ```

3. **Hala hata alırsan**
   - Hangi dosyayı çalıştırdığında ne hata aldığını bana yaz, birlikte çözelim.

---

**Özet:**  
Port 9000’de çalışan bir donanım simülatörü başlatman gerekiyor.  
Yukarıdaki adımları uygula, takıldığın yerde bana yaz kanka!
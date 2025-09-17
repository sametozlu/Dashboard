# STM32 Donanım Entegrasyonu - Detaylı Dokümantasyon

## 📋 Genel Bakış

Bu dokümantasyon, NetmonDashboard v3 projesinde STM32 mikrodenetleyici ile donanım entegrasyonunun nasıl yapılacağını detaylandırır. Sistem, TCP üzerinden binary protokol kullanarak STM32'den gerçek zamanlı veri alır ve işler.

## 🏗️ Mimari Yapı

```
[STM32 Hardware] ←→ [TCP Server] ←→ [STM32 Bridge] ←→ [Hardware Bridge] ←→ [Frontend]
```

### Bileşenler:
1. **STM32 Hardware**: Gerçek donanım veya simülatör
2. **TCP Server**: Port 9000'de çalışan veri sunucusu
3. **STM32 Bridge**: Binary protokol parser ve veri dönüştürücü
4. **Hardware Bridge**: Mevcut donanım arayüzü
5. **Frontend**: React dashboard

## 📦 Veri Paket Yapısı

### Paket Header (5 byte)
```
[0xAA][0x55][Type][Length][Data...][Checksum]
```

- **Header**: 0xAA 0x55 (sabit)
- **Type**: Paket tipi (1 byte)
- **Length**: Veri uzunluğu (1 byte)
- **Data**: Gerçek veri (N byte)
- **Checksum**: XOR checksum (1 byte)

### Paket Tipleri
```c
enum STM32PacketType {
    POWER_MODULE = 0x01,      // Güç modülü verisi
    BATTERY = 0x02,           // Pil verisi
    AC_INPUT = 0x03,          // AC giriş verisi
    DC_OUTPUT = 0x04,         // DC çıkış verisi
    ALARM = 0x05,             // Alarm verisi
    SYSTEM_STATUS = 0x06,     // Sistem durumu
    COMMAND = 0x07,           // Komut
    RESPONSE = 0x08           // Yanıt
};
```

## 📊 Veri Yapıları ve Byte Boyutları

### 1. Güç Modülü Verisi (12 byte)
```c
typedef struct {
    uint8_t module_id;        // 1 byte  - Modül ID (1-4)
    uint16_t voltage;         // 2 byte  - Voltaj (mV, 0-100000)
    uint16_t current;         // 2 byte  - Akım (mA, 0-100000)
    uint16_t power;           // 2 byte  - Güç (mW, 0-10000000)
    uint8_t temperature;      // 1 byte  - Sıcaklık (°C, 0-150)
    uint8_t status;           // 1 byte  - Durum (bit flags)
    uint8_t fault_flags;      // 1 byte  - Hata bayrakları
    uint8_t reserved[4];      // 4 byte  - Gelecek kullanım için
} stm32_power_module_data_t;
```

**Toplam: 12 byte**

### 2. Pil Verisi (10 byte)
```c
typedef struct {
    uint8_t battery_id;       // 1 byte  - Pil ID (1-4)
    uint16_t voltage;         // 2 byte  - Voltaj (mV, 0-15000)
    uint16_t current;         // 2 byte  - Akım (mA, 0-10000)
    uint8_t temperature;      // 1 byte  - Sıcaklık (°C, 0-100)
    uint8_t capacity;         // 1 byte  - Kapasite (% 0-100)
    uint8_t charging;         // 1 byte  - Şarj durumu (0/1)
    uint8_t test_status;      // 1 byte  - Test durumu (0/1)
    uint8_t reserved[2];      // 2 byte  - Gelecek kullanım için
} stm32_battery_data_t;
```

**Toplam: 10 byte**

### 3. AC Giriş Verisi (11 byte)
```c
typedef struct {
    uint8_t phase_id;         // 1 byte  - Faz ID (1-3)
    uint16_t voltage;         // 2 byte  - Voltaj (V*10, 0-5000)
    uint16_t current;         // 2 byte  - Akım (A*10, 0-1000)
    uint16_t frequency;       // 2 byte  - Frekans (Hz*10, 0-1000)
    uint16_t power;           // 2 byte  - Güç (W, 0-100000)
    uint8_t status;           // 1 byte  - Durum (bit flags)
    uint8_t reserved[2];      // 2 byte  - Gelecek kullanım için
} stm32_ac_input_data_t;
```

**Toplam: 11 byte**

### 4. DC Çıkış Verisi (12 byte)
```c
typedef struct {
    uint8_t circuit_id;       // 1 byte  - Devre ID (1-6)
    uint16_t voltage;         // 2 byte  - Voltaj (mV, 0-100000)
    uint16_t current;         // 2 byte  - Akım (mA, 0-100000)
    uint16_t power;           // 2 byte  - Güç (mW, 0-10000000)
    uint8_t enabled;          // 1 byte  - Etkin (0/1)
    uint8_t load_name[6];     // 6 byte  - Yük adı (6 karakter)
} stm32_dc_output_data_t;
```

**Toplam: 12 byte**

### 5. Alarm Verisi (16 byte)
```c
typedef struct {
    uint32_t alarm_id;        // 4 byte  - Alarm ID
    uint8_t severity;         // 1 byte  - Önem (0-2)
    uint32_t timestamp;       // 4 byte  - Unix timestamp
    uint8_t is_active;        // 1 byte  - Aktif (0/1)
    uint8_t message[7];       // 7 byte  - Mesaj (7 karakter)
} stm32_alarm_data_t;
```

**Toplam: 16 byte**

### 6. Sistem Durumu (8 byte)
```c
typedef struct {
    uint8_t mains_available;  // 1 byte  - Şebeke mevcut (0/1)
    uint8_t battery_backup;   // 1 byte  - Pil yedekleme (0/1)
    uint8_t generator_running;// 1 byte  - Jeneratör çalışıyor (0/1)
    uint8_t operation_mode;   // 1 byte  - Çalışma modu (0-2)
    uint16_t system_load;     // 2 byte  - Sistem yükü (%*10)
    uint16_t uptime_seconds;  // 2 byte  - Çalışma süresi (saniye)
} stm32_system_status_t;
```

**Toplam: 8 byte**

## 🔧 Kurulum ve Derleme

### Gereksinimler
- MinGW-w64 veya benzer C derleyici
- Windows için Winsock2 kütüphanesi

### Derleme
```bash
cd hardware
make -f Makefile.windows
```

### Çalıştırma
```bash
# STM32 Simülatörü
./stm32_simulator.exe

# Hardware Server
./hardware_server.exe
```

## 📡 Veri Akışı

### 1. Veri Gönderimi (STM32 → Server)
```
STM32 → Binary Packet → TCP → STM32 Bridge → Event → Frontend
```

### 2. Komut Gönderimi (Server → STM32)
```
Frontend → Command → STM32 Bridge → Binary Packet → TCP → STM32
```

## 🚀 Kullanım Örnekleri

### STM32 Bridge Başlatma
```typescript
import { STM32Bridge } from './stm32-bridge';

const stm32Bridge = new STM32Bridge('127.0.0.1', 9000);

stm32Bridge.on('powerModuleData', (data) => {
    console.log('Power Module:', data);
});

stm32Bridge.on('batteryData', (data) => {
    console.log('Battery:', data);
});
```

### Komut Gönderme
```typescript
// Güç modülünü etkinleştir
stm32Bridge.sendCommand(1, 1, 1, 1);

// Pil testini başlat
stm32Bridge.sendCommand(2, 1, 2, 1);
```

## 🔍 Hata Ayıklama

### Log Seviyeleri
- **Info**: Normal veri akışı
- **Warning**: Bağlantı sorunları
- **Error**: Protokol hataları

### Yaygın Sorunlar
1. **Checksum Hatası**: Veri bozulması
2. **Paket Eksik**: TCP buffer overflow
3. **Bağlantı Kopması**: Network timeout

## 📈 Performans Özellikleri

### Veri Hızı
- **Güç Modülü**: Her 1 saniyede 4 modül
- **Pil**: Her 1 saniyede 4 pil
- **AC Giriş**: Her 1 saniyede 3 faz
- **DC Çıkış**: Her 1 saniyede 6 devre
- **Sistem Durumu**: Her 1 saniyede 1 paket

### Toplam Veri Hızı
- **Paket/saniye**: ~20
- **Byte/saniye**: ~300
- **Gecikme**: <100ms

## 🔒 Güvenlik

### Veri Doğrulama
- Header kontrolü (0xAA 0x55)
- Checksum doğrulama (XOR)
- Veri uzunluğu kontrolü
- Range validation

### Ağ Güvenliği
- TCP bağlantısı (port 9000)
- Heartbeat mekanizması
- Otomatik yeniden bağlanma

## 🔮 Gelecek Geliştirmeler

### Planlanan Özellikler
1. **SSL/TLS**: Şifreli iletişim
2. **Compression**: Veri sıkıştırma
3. **Batch Processing**: Toplu veri işleme
4. **Real-time Alerts**: Anlık uyarılar

### Genişletilebilirlik
- Yeni sensör tipleri eklenebilir
- Farklı protokol versiyonları desteklenebilir
- Çoklu STM32 desteği

## 📚 Referanslar

### STM32 Dokümantasyonu
- [STM32F4 Reference Manual](https://www.st.com/resource/en/reference_manual/dm00031020-stm32f405-415-stm32f407-417-stm32f427-437-and-stm32f429-439-advanced-arm-based-32-bit-mcus-stmicroelectronics.pdf)

### Network Protokolleri
- [TCP/IP Protocol](https://tools.ietf.org/html/rfc793)
- [Binary Protocol Design](https://en.wikipedia.org/wiki/Binary_protocol)

### C Programming
- [GNU C Library](https://www.gnu.org/software/libc/)
- [Socket Programming](https://beej.us/guide/bgnet/)

## 🤝 Destek

### Sorun Bildirimi
- GitHub Issues kullanın
- Detaylı hata mesajları ekleyin
- Sistem bilgilerini paylaşın

### Katkıda Bulunma
- Pull Request gönderin
- Kod standartlarına uyun
- Test coverage ekleyin

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0
**Yazar**: NetmonDashboard Team

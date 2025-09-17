# STM32 Gömülü Yazılım - NetmonDashboard v3

Bu klasör, NetmonDashboard v3 projesi için STM32F4xx mikrodenetleyici gömülü yazılımını içerir.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Donanım Gereksinimleri](#donanım-gereksinimleri)
- [Yazılım Gereksinimleri](#yazılım-gereksinimleri)
- [Kurulum](#kurulum)
- [Derleme](#derleme)
- [Programlama](#programlama)
- [Test](#test)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Hata Ayıklama](#hata-ayıklama)
- [Sık Sorulan Sorular](#sık-sorulan-sorular)

## 🎯 Genel Bakış

STM32 gömülü yazılımı, güç sistemi bileşenlerini izlemek ve kontrol etmek için tasarlanmıştır:

### Ana Özellikler
- **4x Güç Modülü İzleme** (Rectifier)
- **2x Pil İzleme** (Battery)
- **3x AC Giriş İzleme** (AC Input)
- **8x DC Çıkış İzleme** (DC Output)
- **Gerçek Zamanlı Alarm Sistemi**
- **UART İletişim Protokolü**
- **ADC Sensör Okuma**
- **GPIO Kontrol**

### İletişim Protokolü
- **UART**: 115200 baud, 8N1
- **Paket Formatı**: `[0xAA][0x55][Type][Length][Data...][Checksum]`
- **Veri Hızı**: 2 saniyede bir güncelleme
- **Heartbeat**: 5 saniyede bir

## 🔧 Donanım Gereksinimleri

### Mikrodenetleyici
- **STM32F407VGT6** (ARM Cortex-M4, 168MHz)
- **Flash**: 1MB
- **RAM**: 192KB
- **GPIO**: 114 pin

### Sensörler ve Bağlantılar
```
ADC Kanalları:
- PA0-PA3: Güç modülü voltaj okuma
- PA4-PA5: Pil voltaj okuma
- PA6-PA8: AC giriş voltaj okuma
- PB0-PB1: Akım sensörü okuma
- PC0-PC2: Sıcaklık sensörü okuma

GPIO Kontrol:
- PA0-PA3: Güç modülü enable
- PA4-PA5: Pil enable
- PC13: Alarm LED
- PC14: Status LED

UART:
- PA9: TX (USART1)
- PA10: RX (USART1)

SPI (Opsiyonel):
- PA5: SCK
- PA6: MISO
- PA7: MOSI
- PA4: CS
```

### Güç Gereksinimleri
- **Çalışma Voltajı**: 3.3V
- **Maksimum Akım**: 150mA
- **Güç Tüketimi**: ~500mW

## 💻 Yazılım Gereksinimleri

### Geliştirme Ortamı
- **STM32CubeIDE** veya **STM32CubeMX**
- **ARM GCC Toolchain** (arm-none-eabi-gcc)
- **OpenOCD** (debugging için)
- **ST-Link Utility** (programming için)

### Kütüphaneler
- **STM32F4xx HAL Driver**
- **CMSIS Core**
- **CMSIS DSP** (opsiyonel)

## 🚀 Kurulum

### 1. STM32CubeMX Projesi Oluşturma
```bash
# STM32CubeMX'i açın
# Yeni proje oluşturun
# MCU: STM32F407VGT6
# Pin konfigürasyonu:
# - ADC1: PA0-PA3, PA4-PA5, PA6-PA8, PB0-PB1, PC0-PC2
# - GPIO: PA0-PA5 (Output), PC13-PC14 (Output)
# - USART1: PA9 (TX), PA10 (RX)
# - TIM2: 100ms interrupt
# - SPI1: PA5-PA7 (opsiyonel)
```

### 2. Kod Dosyalarını Kopyalama
```bash
# Ana dosyaları kopyalayın
cp stm32_main.c Core/Src/main.c
cp stm32_interface.* ./
cp power_monitor.h battery_monitor.h ac_monitor.h alarm_system.h ./

# Makefile'ı kopyalayın
cp Makefile.stm32 Makefile
```

### 3. Proje Yapısı
```
STM32_Project/
├── Core/
│   ├── Inc/
│   │   ├── main.h
│   │   ├── gpio.h
│   │   ├── adc.h
│   │   ├── usart.h
│   │   └── tim.h
│   └── Src/
│       ├── main.c
│       ├── gpio.c
│       ├── adc.c
│       ├── usart.c
│       └── tim.c
├── Drivers/
│   ├── STM32F4xx_HAL_Driver/
│   └── CMSIS/
├── stm32_interface.c
├── stm32_interface.h
├── power_monitor.h
├── battery_monitor.h
├── ac_monitor.h
├── alarm_system.h
└── Makefile
```

## 🔨 Derleme

### STM32CubeIDE ile
1. **File → Import → Existing Projects into Workspace**
2. Proje klasörünü seçin
3. **Project → Build All**

### Makefile ile
```bash
# Tüm projeyi derle
make all

# Sadece temizlik
make clean

# Boyut bilgisi
make size

# Yardım
make help
```

### Derleme Çıktıları
- `netmon_stm32.elf` - ELF dosyası
- `netmon_stm32.bin` - Binary dosya (programlama için)
- `netmon_stm32.hex` - Hex dosya
- `netmon_stm32.map` - Memory map

## ⚡ Programlama

### ST-Link ile
```bash
# Binary dosyayı programla
make flash

# Doğrulama ile programla
make flash-verify

# Flash'ı sil
make erase

# Cihazı resetle
make reset
```

### ST-Link Utility ile
1. **ST-Link Utility**'yi açın
2. **Target → Connect**
3. **File → Open file** → `netmon_stm32.bin`
4. **Target → Program & Verify**

### OpenOCD ile
```bash
# Debug oturumu başlat
make debug

# Monitor modu
make monitor
```

## 🧪 Test

### 1. Donanım Testi
```bash
# LED testi
# PC13 (Alarm LED) ve PC14 (Status LED) yanıp sönmeli

# UART testi
# PA9/PA10 pinlerinde veri akışı olmalı
```

### 2. Sensör Testi
```bash
# ADC okuma testi
# Voltaj, akım ve sıcaklık değerleri okunmalı

# GPIO testi
# Güç modülü enable pinleri kontrol edilebilmeli
```

### 3. İletişim Testi
```python
# Python ile test
import serial
import time

ser = serial.Serial('COM3', 115200, timeout=1)

while True:
    if ser.in_waiting:
        data = ser.read(ser.in_waiting)
        print(data.hex())
    time.sleep(0.1)
```

### 4. Protokol Testi
```python
# Paket gönderme testi
packet = bytes([0xAA, 0x55, 0x07, 0x04, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x05])
ser.write(packet)
```

## 📚 API Dokümantasyonu

### Ana Fonksiyonlar

#### `main()`
Ana program döngüsü. Sistem başlatma ve sürekli izleme.

#### `Read_Power_Modules()`
Güç modüllerinden veri okuma ve işleme.

#### `Read_Batteries()`
Pil sistemlerinden veri okuma ve işleme.

#### `Read_AC_Inputs()`
AC giriş sistemlerinden veri okuma ve işleme.

#### `Read_DC_Outputs()`
DC çıkış sistemlerinden veri okuma ve işleme.

#### `Update_System_Status()`
Sistem durumunu güncelleme.

#### `Process_Commands()`
Gelen komutları işleme.

#### `Send_Data_Packet()`
Veri paketi gönderme.

### Veri Yapıları

#### `stm32_power_module_data_t`
```c
typedef struct {
    uint8_t module_id;        // Modül ID (1-4)
    uint16_t voltage;         // Voltaj (mV)
    uint16_t current;         // Akım (mA)
    uint16_t power;           // Güç (mW)
    uint8_t temperature;      // Sıcaklık (°C)
    uint8_t status;           // Durum bitleri
    uint8_t fault_flags;      // Hata bitleri
    uint8_t reserved[4];      // Gelecek kullanım
} stm32_power_module_data_t;
```

#### `stm32_battery_data_t`
```c
typedef struct {
    uint8_t battery_id;       // Pil ID (1-2)
    uint16_t voltage;         // Voltaj (mV)
    uint16_t current;         // Akım (mA)
    uint8_t temperature;      // Sıcaklık (°C)
    uint8_t capacity;         // Kapasite (%)
    uint8_t charging;         // Şarj durumu
    uint8_t test_status;      // Test durumu
    uint8_t reserved[2];      // Gelecek kullanım
} stm32_battery_data_t;
```

### Komut Formatı
```c
typedef struct {
    uint8_t command_id;       // Komut ID
    uint8_t target_id;        // Hedef ID
    uint8_t action;           // Aksiyon (0=Get, 1=Set, 2=Start, 3=Stop)
    uint8_t parameter;        // Parametre
    uint32_t reserved;        // Gelecek kullanım
} stm32_command_t;
```

## 🐛 Hata Ayıklama

### Debug Pinleri
```
PC13: Alarm LED (Hata durumunda yanıp söner)
PC14: Status LED (Normal çalışmada yanıp söner)
PA9: UART TX (Debug mesajları)
PA10: UART RX (Komut alma)
```

### Debug Mesajları
```c
// Hata durumunda
printf("ERROR: %s\n", error_message);

// Debug bilgisi
printf("DEBUG: Voltage=%d mV, Current=%d mA\n", voltage, current);

// Sistem durumu
printf("STATUS: Uptime=%lu, Load=%d%%\n", uptime, load);
```

### GDB Debug
```bash
# GDB başlat
arm-none-eabi-gdb netmon_stm32.elf

# Breakpoint koy
(gdb) break main
(gdb) break Read_Power_Modules

# Çalıştır
(gdb) run

# Değişkenleri incele
(gdb) print power_modules[0]
(gdb) print system_status
```

### Log Dosyaları
```c
// Flash'a log yazma
void write_log(const char* message) {
    // Flash write implementation
}

// Log okuma
void read_logs(void) {
    // Flash read implementation
}
```

## ❓ Sık Sorulan Sorular

### Q: STM32 hangi pinleri kullanıyor?
**A:** 
- PA0-PA3: Güç modülü voltaj okuma (ADC)
- PA4-PA5: Pil voltaj okuma (ADC)
- PA6-PA8: AC giriş voltaj okuma (ADC)
- PB0-PB1: Akım sensörü okuma (ADC)
- PC0-PC2: Sıcaklık sensörü okuma (ADC)
- PA0-PA3: Güç modülü enable (GPIO Output)
- PA4-PA5: Pil enable (GPIO Output)
- PC13: Alarm LED (GPIO Output)
- PC14: Status LED (GPIO Output)
- PA9: UART TX
- PA10: UART RX

### Q: Veri gönderme sıklığı nedir?
**A:** 
- Normal veri: 2 saniyede bir
- Heartbeat: 5 saniyede bir
- Alarm: Anında (tetiklendiğinde)

### Q: Hangi sensörler destekleniyor?
**A:**
- **Voltaj**: 0-100V (ADC ile)
- **Akım**: 0-100A (Akım sensörü ile)
- **Sıcaklık**: -40°C to +125°C (Sıcaklık sensörü ile)
- **Frekans**: 45-55Hz (AC için)

### Q: Kaç tane güç modülü destekleniyor?
**A:** Maksimum 4 güç modülü (Rectifier)

### Q: Pil testi nasıl yapılır?
**A:** 
```c
// Pil testini başlat
stm32_send_command(2, 1, 2, 1); // Battery 1, Start test

// Test durumunu kontrol et
if (batteries[0].test_status == 1) {
    // Test devam ediyor
}
```

### Q: Alarm sistemi nasıl çalışır?
**A:**
- **Info**: Bilgi mesajı (LED yanmaz)
- **Warning**: Uyarı (LED yavaş yanıp söner)
- **Critical**: Kritik (LED hızlı yanıp söner)
- **Emergency**: Acil (LED sürekli yanar)

### Q: Veri formatı nedir?
**A:** Binary paket formatı:
```
[0xAA][0x55][Type][Length][Data...][Checksum]
```

### Q: Hangi komutlar destekleniyor?
**A:**
- **Get**: Veri okuma
- **Set**: Değer ayarlama
- **Start**: İşlem başlatma
- **Stop**: İşlem durdurma

### Q: Flash memory nasıl kullanılıyor?
**A:**
- **Konfigürasyon**: Kalibrasyon değerleri
- **Log**: Sistem logları
- **Alarm History**: Alarm geçmişi

## 📞 Destek

### Sorun Bildirimi
- GitHub Issues kullanın
- Detaylı hata mesajları ekleyin
- Donanım ve yazılım versiyonlarını belirtin

### Geliştirme
- Pull Request gönderin
- Kod standartlarına uyun
- Test coverage ekleyin

---

**Son Güncelleme**: 2024  
**Versiyon**: 1.0  
**Yazar**: NetmonDashboard Team  
**Lisans**: MIT

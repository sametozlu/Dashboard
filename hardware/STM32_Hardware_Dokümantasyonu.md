# STM32 Hardware Dokümantasyonu - NetmonDashboard v3

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Donanım Mimarisi](#donanım-mimarisi)
3. [Sensör Sistemi](#sensör-sistemi)
4. [İletişim Protokolü](#iletişim-protokolü)
5. [Alarm Sistemi](#alarm-sistemi)
6. [Güç Yönetimi](#güç-yönetimi)
7. [Test ve Doğrulama](#test-ve-doğrulama)
8. [Geliştirme Rehberi](#geliştirme-rehberi)

---

## 🎯 Genel Bakış

NetmonDashboard v3 projesinin hardware kısmı, STM32F407VGT6 mikrodenetleyici tabanlı bir güç sistemi izleme ve kontrol platformudur. Bu sistem, güç kaynaklarını, pilleri, AC/DC sistemlerini gerçek zamanlı olarak izler ve kontrol eder.

### Ana Özellikler
- **4x Güç Modülü İzleme** (Rectifier)
- **2x Pil İzleme** (Battery)
- **3x AC Giriş İzleme** (AC Input)
- **8x DC Çıkış İzleme** (DC Output)
- **Gerçek Zamanlı Alarm Sistemi**
- **UART İletişim Protokolü**
- **ADC Sensör Okuma**
- **GPIO Kontrol**

---

## 🔧 Donanım Mimarisi

### Mikrodenetleyici: STM32F407VGT6
- **CPU**: ARM Cortex-M4 @ 168MHz
- **Flash**: 1MB
- **RAM**: 192KB
- **GPIO**: 114 pin
- **ADC**: 12-bit, 16 kanal
- **UART**: 6 adet
- **SPI**: 3 adet
- **I2C**: 3 adet

### Pin Konfigürasyonu

#### ADC Kanalları (Sensör Okuma)
```
PA0: Güç Modülü 1 Voltaj (ADC1_IN0)
PA1: Güç Modülü 2 Voltaj (ADC1_IN1)
PA2: Güç Modülü 3 Voltaj (ADC1_IN2)
PA3: Güç Modülü 4 Voltaj (ADC1_IN3)
PA4: Pil 1 Voltaj (ADC1_IN4)
PA5: Pil 2 Voltaj (ADC1_IN5)
PA6: AC Faz 1 Voltaj (ADC1_IN6)
PA7: AC Faz 2 Voltaj (ADC1_IN7)
PA8: AC Faz 3 Voltaj (ADC1_IN8)
PB0: Akım Sensörü 1 (ADC1_IN9)
PB1: Akım Sensörü 2 (ADC1_IN10)
PC0: Sıcaklık Sensörü 1 (ADC1_IN11)
PC1: Sıcaklık Sensörü 2 (ADC1_IN12)
PC2: Sıcaklık Sensörü 3 (ADC1_IN13)
```

#### GPIO Kontrol Pinleri
```
PA0-PA3: Güç Modülü Enable (Output)
PA4-PA5: Pil Enable (Output)
PC13: Alarm LED (Output)
PC14: Status LED (Output)
```

#### UART İletişim
```
PA9: UART1 TX (Veri Gönderme)
PA10: UART1 RX (Komut Alma)
```

#### SPI (Opsiyonel)
```
PA5: SPI1 SCK
PA6: SPI1 MISO
PA7: SPI1 MOSI
PA4: SPI1 CS
```

---

## 📡 Sensör Sistemi

### Voltaj Sensörleri

#### Güç Modülü Voltaj Okuma
```c
// ADC değerini voltaja çevirme
voltage_mv = (adc_value * 3300) / 4096;

// Kalibrasyon
calibrated_voltage = voltage_mv * voltage_calibration_factor;

// Hata kontrolü
if (voltage_mv < 45000 || voltage_mv > 55000) {
    // Voltaj hatası
    fault_flags |= FAULT_VOLTAGE_LOW;
}
```

#### Pil Voltaj Okuma
```c
// Pil voltajı (0-15V aralığı)
battery_voltage_mv = (adc_value * 15000) / 4096;

// Kapasite hesaplama
if (battery_voltage_mv > 13000) {
    capacity = 100;
} else if (battery_voltage_mv > 12000) {
    capacity = 75;
} else if (battery_voltage_mv > 11000) {
    capacity = 50;
} else if (battery_voltage_mv > 10000) {
    capacity = 25;
} else {
    capacity = 0;
    // Düşük pil uyarısı
}
```

#### AC Voltaj Okuma
```c
// AC voltaj (200-250V aralığı)
ac_voltage_10x = (adc_value * 2500) / 4096;

// Frekans okuma (45-55Hz)
ac_frequency_10x = frequency_sensor_reading;

// Güç hesaplama
ac_power_w = (ac_voltage_10x * ac_current_10x) / 10;
```

### Akım Sensörleri

#### DC Akım Okuma
```c
// Akım sensörü (örn: ACS712)
current_ma = (adc_value - current_offset) * current_sensitivity;

// Kalibrasyon
calibrated_current = current_ma * current_calibration_factor;

// Güç hesaplama
power_mw = (voltage_mv * current_ma) / 1000;
```

#### AC Akım Okuma
```c
// AC akım sensörü
ac_current_10x = (adc_value - ac_current_offset) * ac_current_sensitivity;

// RMS hesaplama
ac_current_rms = ac_current_10x / sqrt(2);
```

### Sıcaklık Sensörleri

#### Sıcaklık Okuma
```c
// Sıcaklık sensörü (örn: LM35)
temperature_c = (adc_value * 3300) / 4096 / 10;

// Kalibrasyon
calibrated_temperature = temperature_c + temperature_offset;

// Hata kontrolü
if (temperature_c > 60) {
    // Sıcaklık hatası
    fault_flags |= FAULT_TEMPERATURE_HIGH;
}
```

---

## 📡 İletişim Protokolü

### Paket Formatı
```
[0xAA][0x55][Type][Length][Data...][Checksum]
```

### Paket Bileşenleri
- **Header**: 0xAA 0x55 (Sabit)
- **Type**: Paket tipi (1 byte)
- **Length**: Veri uzunluğu (1 byte)
- **Data**: Veri (0-59 byte)
- **Checksum**: XOR checksum (1 byte)

### Paket Tipleri

#### 1. Güç Modülü Verisi (Type: 0x01)
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

#### 2. Pil Verisi (Type: 0x02)
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

#### 3. AC Giriş Verisi (Type: 0x03)
```c
typedef struct {
    uint8_t phase_id;         // Faz ID (1-3)
    uint16_t voltage;         // Voltaj (V * 10)
    uint16_t current;         // Akım (A * 10)
    uint16_t frequency;       // Frekans (Hz * 10)
    uint16_t power;           // Güç (W)
    uint8_t status;           // Durum bitleri
    uint8_t reserved[2];      // Gelecek kullanım
} stm32_ac_input_data_t;
```

#### 4. DC Çıkış Verisi (Type: 0x04)
```c
typedef struct {
    uint8_t circuit_id;       // Devre ID (1-8)
    uint16_t voltage;         // Voltaj (mV)
    uint16_t current;         // Akım (mA)
    uint16_t power;           // Güç (mW)
    uint8_t enabled;          // Etkin mi?
    uint8_t load_name[6];     // Yük adı (6 karakter)
} stm32_dc_output_data_t;
```

#### 5. Alarm Verisi (Type: 0x05)
```c
typedef struct {
    uint32_t alarm_id;        // Alarm ID
    uint8_t severity;         // Önem seviyesi
    uint32_t timestamp;       // Zaman damgası
    uint8_t is_active;        // Aktif mi?
    uint8_t message[7];       // Mesaj (7 karakter)
} stm32_alarm_data_t;
```

#### 6. Sistem Durumu (Type: 0x06)
```c
typedef struct {
    uint8_t mains_available;    // Şebeke mevcut mu?
    uint8_t battery_backup;     // Pil yedeklemesi aktif mi?
    uint8_t generator_running;  // Jeneratör çalışıyor mu?
    uint8_t operation_mode;     // Operasyon modu
    uint16_t system_load;       // Sistem yükü (% * 10)
    uint16_t uptime_seconds;    // Çalışma süresi
} stm32_system_status_t;
```

#### 7. Komut (Type: 0x07)
```c
typedef struct {
    uint8_t command_id;       // Komut ID
    uint8_t target_id;        // Hedef ID
    uint8_t action;           // Aksiyon (0=Get, 1=Set, 2=Start, 3=Stop)
    uint8_t parameter;        // Parametre
    uint32_t reserved;        // Gelecek kullanım
} stm32_command_t;
```

### Checksum Hesaplama
```c
uint8_t calculate_checksum(const uint8_t* data, uint8_t length) {
    uint8_t checksum = 0;
    for (uint8_t i = 0; i < length; i++) {
        checksum ^= data[i];
    }
    return checksum;
}
```

### Veri Gönderme Sıklığı
- **Normal veri**: 2 saniyede bir
- **Heartbeat**: 5 saniyede bir
- **Alarm**: Anında (tetiklendiğinde)

---

## 🚨 Alarm Sistemi

### Alarm Seviyeleri
```c
#define ALARM_SEVERITY_INFO      0x00  // Bilgi
#define ALARM_SEVERITY_WARNING   0x01  // Uyarı
#define ALARM_SEVERITY_CRITICAL  0x02  // Kritik
#define ALARM_SEVERITY_EMERGENCY 0x03  // Acil
```

### Alarm Kategorileri
```c
#define ALARM_CATEGORY_POWER     0x01  // Güç modülü
#define ALARM_CATEGORY_BATTERY   0x02  // Pil
#define ALARM_CATEGORY_AC        0x03  // AC giriş
#define ALARM_CATEGORY_DC        0x04  // DC çıkış
#define ALARM_CATEGORY_SYSTEM    0x05  // Sistem
#define ALARM_CATEGORY_COMM      0x06  // İletişim
#define ALARM_CATEGORY_TEMP      0x07  // Sıcaklık
#define ALARM_CATEGORY_MAINT     0x08  // Bakım
```

### Önceden Tanımlı Alarm ID'leri
```c
#define ALARM_ID_VOLTAGE_LOW     1000  // Düşük voltaj
#define ALARM_ID_VOLTAGE_HIGH    1001  // Yüksek voltaj
#define ALARM_ID_CURRENT_HIGH    1002  // Yüksek akım
#define ALARM_ID_TEMP_HIGH       1003  // Yüksek sıcaklık
#define ALARM_ID_POWER_OVERLOAD  1004  // Güç aşırı yükü
#define ALARM_ID_COMM_FAULT      1005  // İletişim hatası
#define ALARM_ID_BATTERY_LOW     2000  // Düşük pil
#define ALARM_ID_BATTERY_FAULT   2001  // Pil hatası
#define ALARM_ID_AC_FAULT        3000  // AC hatası
#define ALARM_ID_PHASE_LOSS      3001  // Faz kaybı
#define ALARM_ID_DC_FAULT        4000  // DC hatası
#define ALARM_ID_SYSTEM_FAULT    5000  // Sistem hatası
#define ALARM_ID_MAINTENANCE     6000  // Bakım gerekli
```

### Alarm İşleme
```c
void handle_alarm(uint32_t alarm_id, uint8_t severity, const char* message) {
    if (alarm_count < MAX_ALARMS) {
        active_alarms[alarm_count].alarm_id = alarm_id;
        active_alarms[alarm_count].severity = severity;
        active_alarms[alarm_count].timestamp = HAL_GetTick() / 1000;
        active_alarms[alarm_count].is_active = 1;
        strncpy((char*)active_alarms[alarm_count].message, message, 7);
        active_alarms[alarm_count].message[7] = '\0';
        alarm_count++;
        
        // Alarm paketi gönder
        send_alarm_packet();
        
        // Kritik alarmlar için LED yanıp söndür
        if (severity == ALARM_SEVERITY_CRITICAL) {
            toggle_alarm_led();
        }
    }
}
```

---

## ⚡ Güç Yönetimi

### Güç Hesaplamaları

#### DC Güç
```c
// Güç hesaplama
power_mw = (voltage_mv * current_ma) / 1000;

// Verimlilik hesaplama
efficiency = (output_power / input_power) * 100;

// Güç faktörü (AC için)
power_factor = real_power / apparent_power;
```

#### AC Güç
```c
// Gerçek güç
real_power_w = voltage_v * current_a * power_factor;

// Görünür güç
apparent_power_va = voltage_v * current_a;

// Reaktif güç
reactive_power_var = sqrt(apparent_power² - real_power²);
```

### Sistem Yükü Hesaplama
```c
void calculate_system_load() {
    uint32_t total_power = 0;
    
    // DC çıkışlardan toplam güç
    for (int i = 0; i < MAX_DC_CIRCUITS; i++) {
        if (dc_outputs[i].enabled) {
            total_power += dc_outputs[i].power;
        }
    }
    
    // Sistem yükü yüzdesi
    uint32_t max_power = 2400000; // 2.4kW max
    system_status.system_load = (total_power * 1000) / max_power;
}
```

### Operasyon Modları
```c
#define OPERATION_MODE_AUTO    0x00  // Otomatik
#define OPERATION_MODE_MANUAL  0x01  // Manuel
#define OPERATION_MODE_TEST    0x02  // Test
```

---

## 🧪 Test ve Doğrulama

### Donanım Testi

#### LED Testi
```c
void test_leds() {
    // Status LED testi
    HAL_GPIO_WritePin(STATUS_LED_PORT, STATUS_LED_PIN, GPIO_PIN_SET);
    HAL_Delay(1000);
    HAL_GPIO_WritePin(STATUS_LED_PORT, STATUS_LED_PIN, GPIO_PIN_RESET);
    
    // Alarm LED testi
    HAL_GPIO_WritePin(ALARM_LED_PORT, ALARM_LED_PIN, GPIO_PIN_SET);
    HAL_Delay(1000);
    HAL_GPIO_WritePin(ALARM_LED_PORT, ALARM_LED_PIN, GPIO_PIN_RESET);
}
```

#### ADC Testi
```c
void test_adc() {
    uint32_t adc_value;
    
    // ADC başlat
    HAL_ADC_Start(&hadc1);
    
    // Okuma
    HAL_ADC_PollForConversion(&hadc1, 100);
    adc_value = HAL_ADC_GetValue(&hadc1);
    
    // Durdur
    HAL_ADC_Stop(&hadc1);
    
    printf("ADC Value: %lu\n", adc_value);
}
```

#### UART Testi
```c
void test_uart() {
    char test_message[] = "UART Test Message\n";
    HAL_UART_Transmit(&huart1, (uint8_t*)test_message, strlen(test_message), 100);
}
```

### İletişim Testi

#### Python ile Test
```python
import serial
import time

# Seri port bağlantısı
ser = serial.Serial('COM3', 115200, timeout=1)

# Veri okuma
while True:
    if ser.in_waiting:
        data = ser.read(ser.in_waiting)
        print(f"Received: {data.hex()}")
    time.sleep(0.1)
```

#### Paket Gönderme Testi
```python
# Komut paketi gönderme
command_packet = bytes([
    0xAA, 0x55,  # Header
    0x07,        # Type (Command)
    0x04,        # Length
    0x01,        # Command ID
    0x01,        # Target ID
    0x01,        # Action (Set)
    0x01,        # Parameter
    0x00, 0x00, 0x00, 0x00,  # Reserved
    0x05         # Checksum
])

ser.write(command_packet)
```

### Sensör Kalibrasyonu

#### Voltaj Kalibrasyonu
```c
void calibrate_voltage(uint8_t channel, uint16_t reference_mv) {
    uint32_t adc_value = read_adc_channel(channel);
    uint16_t calculated_mv = (adc_value * 3300) / 4096;
    
    // Kalibrasyon faktörü hesapla
    voltage_calibration[channel] = (float)reference_mv / calculated_mv;
}
```

#### Akım Kalibrasyonu
```c
void calibrate_current(uint8_t channel, uint16_t reference_ma) {
    uint32_t adc_value = read_adc_channel(channel);
    uint16_t calculated_ma = (adc_value - current_offset) * current_sensitivity;
    
    // Kalibrasyon faktörü hesapla
    current_calibration[channel] = (float)reference_ma / calculated_ma;
}
```

---

## 🛠️ Geliştirme Rehberi

### Proje Yapısı
```
hardware/
├── stm32_main.c              # Ana program
├── stm32_interface.h/c       # İletişim protokolü
├── power_monitor.h           # Güç modülü izleme
├── battery_monitor.h         # Pil izleme
├── ac_monitor.h             # AC giriş izleme
├── alarm_system.h           # Alarm sistemi
├── Makefile.stm32           # Derleme dosyası
├── README_STM32.md          # Dokümantasyon
└── test_stm32.c            # Test programı
```

### Derleme Komutları
```bash
# Tüm projeyi derle
make -f Makefile.stm32 all

# Temizlik
make -f Makefile.stm32 clean

# STM32'ye programla
make -f Makefile.stm32 flash

# Debug oturumu
make -f Makefile.stm32 debug
```

### Hata Ayıklama

#### Debug Pinleri
```
PC13: Alarm LED - Hata durumunda yanıp söner
PC14: Status LED - Normal çalışmada yanıp söner
PA9: UART TX - Debug mesajları
PA10: UART RX - Komut alma
```

#### Debug Mesajları
```c
// Hata durumunda
printf("ERROR: %s\n", error_message);

// Debug bilgisi
printf("DEBUG: Voltage=%d mV, Current=%d mA\n", voltage, current);

// Sistem durumu
printf("STATUS: Uptime=%lu, Load=%d%%\n", uptime, load);
```

### Performans Optimizasyonu

#### Bellek Kullanımı
- **Flash**: ~50KB (program + veri)
- **RAM**: ~20KB (değişkenler + buffer)
- **Stack**: ~2KB

#### Zamanlama
- **Ana döngü**: 100ms
- **Veri gönderme**: 2s
- **Heartbeat**: 5s
- **ADC okuma**: 10ms

### Güvenlik Önlemleri

#### Veri Doğrulama
```c
bool validate_packet(const stm32_packet_t* packet) {
    // Header kontrolü
    if (packet->header_high != 0xAA || packet->header_low != 0x55) {
        return false;
    }
    
    // Uzunluk kontrolü
    if (packet->length > MAX_PACKET_SIZE - 5) {
        return false;
    }
    
    // Checksum kontrolü
    uint8_t calculated_checksum = calculate_checksum(
        (uint8_t*)packet, packet->length + 4
    );
    
    return calculated_checksum == packet->checksum;
}
```

#### Hata Kurtarma
```c
void error_handler() {
    // Tüm çıkışları güvenli duruma getir
    disable_all_outputs();
    
    // Alarm LED'ini hızlı yanıp söndür
    while (1) {
        HAL_GPIO_TogglePin(ALARM_LED_PORT, ALARM_LED_PIN);
        HAL_Delay(100);
    }
}
```

---

## 📊 Veri Formatları

### Voltaj Formatları
- **DC Voltaj**: mV cinsinden (örn: 53000 = 53.0V)
- **AC Voltaj**: V*10 cinsinden (örn: 2305 = 230.5V)
- **Pil Voltaj**: mV cinsinden (örn: 12600 = 12.6V)

### Akım Formatları
- **DC Akım**: mA cinsinden (örn: 45200 = 45.2A)
- **AC Akım**: A*10 cinsinden (örn: 123 = 12.3A)
- **Pil Akım**: mA cinsinden (örn: 100 = 0.1A)

### Güç Formatları
- **DC Güç**: mW cinsinden (örn: 2400000 = 2.4kW)
- **AC Güç**: W cinsinden (örn: 2830 = 2.83kW)

### Sıcaklık Formatları
- **Sıcaklık**: Celsius cinsinden (örn: 25 = 25°C)

### Frekans Formatları
- **Frekans**: Hz*10 cinsinden (örn: 500 = 50.0Hz)

---

## 🔮 Gelecek Geliştirmeler

### Planlanan Özellikler
1. **WiFi Modülü**: ESP32 entegrasyonu
2. **Bluetooth**: Mobil uygulama desteği
3. **Web Server**: Yerel web arayüzü
4. **Data Logging**: SD kart desteği
5. **Remote Control**: Uzaktan kontrol
6. **Predictive Maintenance**: Öngörülü bakım

### Genişletilebilirlik
- **Yeni Sensör Tipleri**: Farklı sensör desteği
- **Protokol Versiyonları**: Geriye uyumlu protokol
- **Çoklu STM32**: Master-Slave mimarisi
- **Cloud Integration**: Bulut entegrasyonu

---

## 📞 Destek ve İletişim

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

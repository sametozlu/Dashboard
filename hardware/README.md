# Hardware Integration - STM32

Bu klasör, NetmonDashboard v3 projesi için STM32 mikrodenetleyici entegrasyonunu içerir.

## 📁 Dosya Yapısı

```
hardware/
├── stm32_interface.h          # STM32 protokol tanımları
├── stm32_interface.c          # STM32 protokol implementasyonu
├── stm32_simulator.c          # STM32 simülatör programı
├── hardware_server.c           # Basit TCP sunucu
├── test_stm32.c               # Test programı
├── Makefile.windows           # Windows derleme dosyası
└── README.md                  # Bu dosya
```

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- MinGW-w64 veya benzer C derleyici
- Windows için Winsock2 kütüphanesi

### 2. Derleme
```bash
cd hardware
make -f Makefile.windows
```

### 3. Çalıştırma
```bash
# STM32 Simülatörü (port 9000'de dinler)
./stm32_simulator.exe

# Test programı
./test_stm32.exe

# Hardware server
./hardware_server.exe
```

## 🔧 Makefile Hedefleri

```bash
# Tüm programları derle
make -f Makefile.windows all

# Sadece STM32 simülatörünü derle
make -f Makefile.windows stm32_simulator.exe

# Test programını derle
make -f Makefile.windows test_stm32.exe

# Temizlik
make -f Makefile.windows clean

# Yardım
make -f Makefile.windows help
```

## 📡 STM32 Protokol

### Paket Yapısı
```
[0xAA][0x55][Type][Length][Data...][Checksum]
```

### Veri Tipleri
- **Güç Modülü**: 12 byte (voltaj, akım, güç, sıcaklık)
- **Pil**: 10 byte (voltaj, akım, kapasite, sıcaklık)
- **AC Giriş**: 11 byte (voltaj, akım, frekans, güç)
- **DC Çıkış**: 12 byte (voltaj, akım, güç, durum)
- **Alarm**: 16 byte (ID, önem, timestamp, mesaj)
- **Sistem Durumu**: 8 byte (şebeke, pil, jeneratör, yük)

### Veri Formatı
- **Voltaj**: mV cinsinden (örn: 53500 = 53.5V)
- **Akım**: mA cinsinden (örn: 45200 = 45.2A)
- **Güç**: mW cinsinden (örn: 2400000 = 2.4kW)
- **Sıcaklık**: Celsius cinsinden
- **Frekans**: Hz*10 cinsinden (örn: 500 = 50.0Hz)

## 🧪 Test

### Test Programı
```bash
./test_stm32.exe
```

Bu program şunları test eder:
- Veri parsing fonksiyonları
- Paket oluşturma
- Checksum hesaplama
- Komut gönderme

### Simülatör Test
```bash
# Terminal 1: Simülatörü başlat
./stm32_simulator.exe

# Terminal 2: Test client (Python ile)
python -c "
import socket
s = socket.socket()
s.connect(('127.0.0.1', 9000))
data = s.recv(1024)
print(data.hex())
s.close()
"
```

## 🔌 Entegrasyon

### Node.js Backend
```typescript
import { STM32Bridge } from './stm32-bridge';

const stm32Bridge = new STM32Bridge('127.0.0.1', 9000);

stm32Bridge.on('powerModuleData', (data) => {
    console.log('Power Module:', data);
});
```

### Komut Gönderme
```typescript
// Güç modülünü etkinleştir
stm32Bridge.sendCommand(1, 1, 1, 1);

// Pil testini başlat
stm32Bridge.sendCommand(2, 1, 2, 1);
```

## 🐛 Hata Ayıklama

### Yaygın Sorunlar
1. **Port 9000 kullanımda**: Başka program portu kullanıyor olabilir
2. **Derleme hatası**: MinGW kurulu değil
3. **Bağlantı hatası**: Firewall engelliyor olabilir

### Debug Modu
```bash
# Verbose output ile derle
make -f Makefile.windows CFLAGS="-Wall -Wextra -std=c99 -O2 -DDEBUG"
```

## 📊 Performans

### Veri Hızı
- **Paket/saniye**: ~20
- **Byte/saniye**: ~300
- **Gecikme**: <100ms

### Bellek Kullanımı
- **STM32 Simülatör**: ~2MB
- **Test Program**: ~1MB
- **Hardware Server**: ~1MB

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

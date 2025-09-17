// hardware/rectifier_monitor.c
// Bu program gerçek rectifier verilerini okuyup TCP üzerinden Node.js backend'e gönderir
// SMU'da çalışacak ana program

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <winsock2.h>
#include <windows.h>
#include <time.h>
#pragma comment(lib, "ws2_32.lib")

// Rectifier veri yapısı
typedef struct {
    int rectifier_id;
    float voltage;      // Voltaj (V)
    float current;      // Akım (A)
    float power;        // Güç (W)
    float temperature;  // Sıcaklık (°C)
    int status;         // Durum (0=Off, 1=On, 2=Fault)
    time_t timestamp;   // Zaman damgası
} RectifierData;

// Sistem durumu
typedef struct {
    int total_rectifiers;
    float total_power;
    float system_voltage;
    float system_current;
    int alarm_status;
} SystemStatus;

// Global değişkenler
SOCKET server_socket;
int is_running = 1;
RectifierData rectifiers[10];  // Maksimum 10 rectifier
SystemStatus system_status;

// Rectifier verisi oku (simülasyon - gerçekte donanım API'si kullanılacak)
RectifierData read_rectifier_data(int rect_id) {
    RectifierData data;
    data.rectifier_id = rect_id;
    
    // Simüle edilmiş veri - gerçekte donanımdan okunacak
    data.voltage = 48.0 + (rand() % 100) / 100.0;  // 48.00 - 48.99V
    data.current = 10.0 + (rand() % 200) / 100.0;  // 10.00 - 11.99A
    data.power = data.voltage * data.current;
    data.temperature = 25.0 + (rand() % 200) / 10.0;  // 25.0 - 44.9°C
    data.status = (rand() % 100 < 95) ? 1 : 2;  // %95 ihtimalle çalışıyor
    data.timestamp = time(NULL);
    
    return data;
}

// Sistem durumunu güncelle
void update_system_status() {
    system_status.total_rectifiers = 4;  // 4 rectifier var
    system_status.total_power = 0;
    system_status.system_voltage = 0;
    system_status.system_current = 0;
    system_status.alarm_status = 0;
    
    for (int i = 0; i < system_status.total_rectifiers; i++) {
        if (rectifiers[i].status == 1) {  // Sadece çalışan rectifier'lar
            system_status.total_power += rectifiers[i].power;
            system_status.system_voltage += rectifiers[i].voltage;
            system_status.system_current += rectifiers[i].current;
        }
        if (rectifiers[i].status == 2) {  // Fault durumu
            system_status.alarm_status = 1;
        }
    }
    
    if (system_status.total_rectifiers > 0) {
        system_status.system_voltage /= system_status.total_rectifiers;
        system_status.system_current /= system_status.total_rectifiers;
    }
}

// JSON formatında veri oluştur
char* create_json_data() {
    static char json_buffer[4096];
    char temp_buffer[256];
    
    // Sistem durumu
    sprintf(json_buffer, "{\"type\":\"system_status\",\"data\":{\"total_rectifiers\":%d,\"total_power\":%.2f,\"system_voltage\":%.2f,\"system_current\":%.2f,\"alarm_status\":%d,\"timestamp\":%ld},\"rectifiers\":[",
        system_status.total_rectifiers,
        system_status.total_power,
        system_status.system_voltage,
        system_status.system_current,
        system_status.alarm_status,
        time(NULL)
    );
    
    // Rectifier verileri
    for (int i = 0; i < system_status.total_rectifiers; i++) {
        sprintf(temp_buffer, "{\"id\":%d,\"voltage\":%.2f,\"current\":%.2f,\"power\":%.2f,\"temperature\":%.1f,\"status\":%d,\"timestamp\":%ld}",
            rectifiers[i].rectifier_id,
            rectifiers[i].voltage,
            rectifiers[i].current,
            rectifiers[i].power,
            rectifiers[i].temperature,
            rectifiers[i].status,
            rectifiers[i].timestamp
        );
        
        strcat(json_buffer, temp_buffer);
        if (i < system_status.total_rectifiers - 1) {
            strcat(json_buffer, ",");
        }
    }
    
    strcat(json_buffer, "]}");
    return json_buffer;
}

// TCP sunucusu başlat
int start_tcp_server() {
    WSADATA wsa;
    struct sockaddr_in server;
    
    // Winsock başlat
    if (WSAStartup(MAKEWORD(2,2), &wsa) != 0) {
        printf("Winsock başlatılamadı. Hata: %d\n", WSAGetLastError());
        return 0;
    }
    
    // Socket oluştur
    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket == INVALID_SOCKET) {
        printf("Socket oluşturulamadı. Hata: %d\n", WSAGetLastError());
        return 0;
    }
    
    // Sunucu ayarları
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = INADDR_ANY;
    server.sin_port = htons(9000);
    
    // Bind
    if (bind(server_socket, (struct sockaddr *)&server, sizeof(server)) == SOCKET_ERROR) {
        printf("Bind başarısız. Hata: %d\n", WSAGetLastError());
        return 0;
    }
    
    // Dinle
    listen(server_socket, 3);
    printf("Rectifier Monitor TCP Sunucusu başlatıldı - Port 9000\n");
    printf("Node.js backend bağlantısı bekleniyor...\n");
    
    return 1;
}

// Ana veri gönderme döngüsü
void data_sending_loop() {
    SOCKET client_socket;
    struct sockaddr_in client;
    int c = sizeof(struct sockaddr_in);
    
    while (is_running) {
        // Bağlantı kabul et
        client_socket = accept(server_socket, (struct sockaddr *)&client, &c);
        if (client_socket == INVALID_SOCKET) {
            printf("Bağlantı kabul edilemedi. Hata: %d\n", WSAGetLastError());
            continue;
        }
        
        printf("Node.js backend bağlandı! Veri gönderiliyor...\n");
        
        // Sürekli veri gönder
        while (is_running) {
            // Rectifier verilerini oku
            for (int i = 0; i < 4; i++) {
                rectifiers[i] = read_rectifier_data(i + 1);
            }
            
            // Sistem durumunu güncelle
            update_system_status();
            
            // JSON veriyi oluştur ve gönder
            char* json_data = create_json_data();
            int result = send(client_socket, json_data, strlen(json_data), 0);
            
            if (result == SOCKET_ERROR) {
                printf("Veri gönderilemedi. Bağlantı koptu.\n");
                break;
            }
            
            printf("Veri gönderildi: %s\n", json_data);
            Sleep(2000);  // 2 saniyede bir güncelle
        }
        
        closesocket(client_socket);
    }
}

// Sinyal işleyici (Ctrl+C için)
void signal_handler(int sig) {
    printf("\nProgram durduruluyor...\n");
    is_running = 0;
    closesocket(server_socket);
    WSACleanup();
    exit(0);
}

int main() {
    printf("=== RECTIFIER MONITOR - SMU VERSIYONU ===\n");
    printf("Bu program rectifier verilerini okuyup TCP üzerinden Node.js backend'e gönderir\n");
    printf("Port: 9000\n");
    printf("Çıkmak için Ctrl+C\n\n");
    
    // Random seed
    srand(time(NULL));
    
    // TCP sunucusu başlat
    if (!start_tcp_server()) {
        printf("TCP sunucusu başlatılamadı!\n");
        return 1;
    }
    
    // Ana döngü
    data_sending_loop();
    
    return 0;
}

// hardware/hardware_server.c
// Bu program, donanım verisini TCP üzerinden gönderen örnek bir C sunucusudur.
// Node.js backend bu sunucuya bağlanıp veri alabilir.
// Windows için hazırlanmıştır, Linux için socket başlıkları değiştirilebilir.

#include <stdio.h>
#include <string.h>
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")

int main() {
    WSADATA wsa;
    SOCKET s, new_socket;
    struct sockaddr_in server, client;
    int c;
    char *message = "Donanimdan veri: 12.5V, 1.2A\n";

    // Winsock başlat
    printf("Winsock başlatılıyor...\n");
    if (WSAStartup(MAKEWORD(2,2),&wsa) != 0) {
        printf("Başlatılamadı. Hata Kodu: %d\n", WSAGetLastError());
        return 1;
    }

    // Socket oluştur
    s = socket(AF_INET, SOCK_STREAM, 0);
    if (s == INVALID_SOCKET) {
        printf("Socket oluşturulamadı. Hata Kodu: %d\n", WSAGetLastError());
        return 1;
    }

    // Sunucu ayarları
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = INADDR_ANY;
    server.sin_port = htons(9000); // 9000 portu

    // Bağla
    if (bind(s, (struct sockaddr *)&server, sizeof(server)) == SOCKET_ERROR) {
        printf("Bind başarısız. Hata Kodu: %d\n", WSAGetLastError());
        return 1;
    }

    // Dinle
    listen(s, 3);
    printf("Bağlantı bekleniyor...\n");
    c = sizeof(struct sockaddr_in);
    new_socket = accept(s, (struct sockaddr *)&client, &c);
    printf("Bağlantı alındı!\n");

    // Sürekli veri gönder
    while(1) {
        send(new_socket, message, strlen(message), 0);
        Sleep(1000); // 1 saniye bekle
    }

    closesocket(s);
    WSACleanup();
    return 0;
} 
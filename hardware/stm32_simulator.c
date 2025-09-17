#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <time.h>
#include <math.h>

// STM32 Packet Structure
#define STM32_HEADER_HIGH    0xAA
#define STM32_HEADER_LOW     0x55
#define STM32_MAX_PACKET_SIZE 64

typedef enum {
    PACKET_TYPE_POWER_MODULE = 0x01,
    PACKET_TYPE_BATTERY      = 0x02,
    PACKET_TYPE_AC_INPUT     = 0x03,
    PACKET_TYPE_DC_OUTPUT    = 0x04,
    PACKET_TYPE_ALARM        = 0x05,
    PACKET_TYPE_SYSTEM_STATUS = 0x06,
    PACKET_TYPE_COMMAND      = 0x07,
    PACKET_TYPE_RESPONSE     = 0x08
} stm32_packet_type_t;

typedef struct {
    uint8_t header_high;
    uint8_t header_low;
    uint8_t packet_type;
    uint8_t length;
    uint8_t data[STM32_MAX_PACKET_SIZE - 5];
    uint8_t checksum;
} stm32_packet_t;

// Data structures
typedef struct {
    uint8_t module_id;
    uint16_t voltage;      // mV
    uint16_t current;      // mA
    uint16_t power;        // mW
    uint8_t temperature;   // Celsius
    uint8_t status;        // Bit flags
    uint8_t fault_flags;   // Bit flags
    uint8_t reserved[4];   // Future use
} stm32_power_module_data_t;

typedef struct {
    uint8_t battery_id;
    uint16_t voltage;      // mV
    uint16_t current;      // mA
    uint8_t temperature;   // Celsius
    uint8_t capacity;      // Percentage
    uint8_t charging;      // 0=Not charging, 1=Charging
    uint8_t test_status;   // 0=No test, 1=Test in progress
    uint8_t reserved[2];   // Future use
} stm32_battery_data_t;

typedef struct {
    uint8_t phase_id;
    uint16_t voltage;      // V * 10
    uint16_t current;      // A * 10
    uint16_t frequency;    // Hz * 10
    uint16_t power;        // W
    uint8_t status;        // Bit flags
    uint8_t reserved[2];   // Future use
} stm32_ac_input_data_t;

typedef struct {
    uint8_t circuit_id;
    uint16_t voltage;      // mV
    uint16_t current;      // mA
    uint16_t power;        // mW
    uint8_t enabled;       // 0=Disabled, 1=Enabled
    uint8_t load_name[6];  // Load name (6 chars max)
} stm32_dc_output_data_t;

typedef struct {
    uint32_t alarm_id;
    uint8_t severity;      // 0=Info, 1=Warning, 2=Critical
    uint32_t timestamp;    // Unix timestamp
    uint8_t is_active;     // 0=Inactive, 1=Active
    uint8_t message[7];   // Message (7 chars max)
} stm32_alarm_data_t;

typedef struct {
    uint8_t mains_available;    // 0=No, 1=Yes
    uint8_t battery_backup;     // 0=No, 1=Yes
    uint8_t generator_running;  // 0=No, 1=Yes
    uint8_t operation_mode;     // 0=Auto, 1=Manual, 2=Test
    uint16_t system_load;       // Percentage * 10
    uint16_t uptime_seconds;    // Uptime in seconds
} stm32_system_status_t;

// Function prototypes
uint8_t calculate_checksum(const uint8_t* data, uint8_t length);
void create_packet(uint8_t packet_type, const uint8_t* data, uint8_t data_length, stm32_packet_t* packet);
void send_packet(int client_socket, const stm32_packet_t* packet);
void simulate_power_modules(int client_socket);
void simulate_batteries(int client_socket);
void simulate_ac_inputs(int client_socket);
void simulate_dc_outputs(int client_socket);
void simulate_alarms(int client_socket);
void simulate_system_status(int client_socket);

int main() {
    int server_socket, client_socket;
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_len = sizeof(client_addr);
    
    // Create socket
    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket == -1) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }
    
    // Set socket options
    int opt = 1;
    if (setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt failed");
        exit(EXIT_FAILURE);
    }
    
    // Configure server address
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(9000);
    
    // Bind socket
    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }
    
    // Listen for connections
    if (listen(server_socket, 3) < 0) {
        perror("Listen failed");
        exit(EXIT_FAILURE);
    }
    
    printf("STM32 Simulator: Listening on port 9000...\n");
    
    // Accept client connection
    client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &client_len);
    if (client_socket < 0) {
        perror("Accept failed");
        exit(EXIT_FAILURE);
    }
    
    printf("STM32 Simulator: Client connected from %s:%d\n", 
           inet_ntoa(client_addr.sin_addr), ntohs(client_addr.sin_port));
    
    // Main simulation loop
    while (1) {
        // Send different types of data periodically
        simulate_power_modules(client_socket);
        usleep(1000000); // 1 second
        
        simulate_batteries(client_socket);
        usleep(1000000); // 1 second
        
        simulate_ac_inputs(client_socket);
        usleep(1000000); // 1 second
        
        simulate_dc_outputs(client_socket);
        usleep(1000000); // 1 second
        
        simulate_system_status(client_socket);
        usleep(1000000); // 1 second
        
        // Send alarms occasionally
        if (rand() % 10 == 0) { // 10% chance
            simulate_alarms(client_socket);
        }
        
        usleep(1000000); // 1 second
    }
    
    close(client_socket);
    close(server_socket);
    return 0;
}

uint8_t calculate_checksum(const uint8_t* data, uint8_t length) {
    uint8_t checksum = 0;
    for (uint8_t i = 0; i < length; i++) {
        checksum ^= data[i];
    }
    return checksum;
}

void create_packet(uint8_t packet_type, const uint8_t* data, uint8_t data_length, stm32_packet_t* packet) {
    packet->header_high = STM32_HEADER_HIGH;
    packet->header_low = STM32_HEADER_LOW;
    packet->packet_type = packet_type;
    packet->length = data_length;
    
    // Copy data
    memcpy(packet->data, data, data_length);
    
    // Calculate and set checksum
    packet->checksum = calculate_checksum((uint8_t*)packet, data_length + 4);
}

void send_packet(int client_socket, const stm32_packet_t* packet) {
    int total_size = 5 + packet->length; // header + type + length + data + checksum
    send(client_socket, packet, total_size, 0);
}

void simulate_power_modules(int client_socket) {
    stm32_packet_t packet;
    stm32_power_module_data_t module_data;
    
    // Simulate 4 power modules
    for (int i = 0; i < 4; i++) {
        if (i < 3) { // Active modules
            module_data.module_id = i + 1;
            module_data.voltage = 53500 + (rand() % 200) - 100; // 53.5V ± 0.1V
            module_data.current = 45200 + (rand() % 4000) - 2000; // 45.2A ± 2A
            module_data.power = module_data.voltage * module_data.current / 1000; // mW
            module_data.temperature = 42 + (rand() % 8) - 4; // 42°C ± 4°C
            module_data.status = 0x01; // Active
            module_data.fault_flags = 0x00; // No faults
        } else { // Inactive module
            module_data.module_id = i + 1;
            module_data.voltage = 0;
            module_data.current = 0;
            module_data.power = 0;
            module_data.temperature = 25;
            module_data.status = 0x00; // Inactive
            module_data.fault_flags = 0x00; // No faults
        }
        
        memset(module_data.reserved, 0, sizeof(module_data.reserved));
        
        create_packet(PACKET_TYPE_POWER_MODULE, (uint8_t*)&module_data, sizeof(module_data), &packet);
        send_packet(client_socket, &packet);
        
        printf("Sent power module %d data: %.2fV, %.2fA, %.2fW, %d°C\n", 
               module_data.module_id,
               module_data.voltage / 1000.0f,
               module_data.current / 1000.0f,
               module_data.power / 1000.0f,
               module_data.temperature);
    }
}

void simulate_batteries(int client_socket) {
    stm32_packet_t packet;
    stm32_battery_data_t battery_data;
    
    // Simulate 4 batteries
    for (int i = 0; i < 4; i++) {
        battery_data.battery_id = i + 1;
        battery_data.voltage = 12600 + (rand() % 200) - 100; // 12.6V ± 0.1V
        battery_data.current = 100 + (rand() % 100) - 50; // 0.1A ± 0.05A
        battery_data.temperature = 24 + (rand() % 4) - 2; // 24°C ± 2°C
        battery_data.capacity = 85 + (rand() % 8) - 4; // 85% ± 4%
        battery_data.charging = (rand() % 10 == 0); // 10% chance of charging
        battery_data.test_status = 0; // No test in progress
        
        memset(battery_data.reserved, 0, sizeof(battery_data.reserved));
        
        create_packet(PACKET_TYPE_BATTERY, (uint8_t*)&battery_data, sizeof(battery_data), &packet);
        send_packet(client_socket, &packet);
        
        printf("Sent battery %d data: %.2fV, %.2fA, %d°C, %d%%, charging: %s\n", 
               battery_data.battery_id,
               battery_data.voltage / 1000.0f,
               battery_data.current / 1000.0f,
               battery_data.temperature,
               battery_data.capacity,
               battery_data.charging ? "Yes" : "No");
    }
}

void simulate_ac_inputs(int client_socket) {
    stm32_packet_t packet;
    stm32_ac_input_data_t ac_data;
    
    // Simulate 3 AC phases
    for (int i = 0; i < 3; i++) {
        ac_data.phase_id = i + 1;
        ac_data.voltage = 2305 + (rand() % 40) - 20; // 230.5V ± 2V
        ac_data.current = 123 + (rand() % 20) - 10; // 12.3A ± 1A
        ac_data.frequency = 500; // 50.0Hz (fixed)
        ac_data.power = ac_data.voltage * ac_data.current / 10; // W
        ac_data.status = 0x01; // Normal
        
        memset(ac_data.reserved, 0, sizeof(ac_data.reserved));
        
        create_packet(PACKET_TYPE_AC_INPUT, (uint8_t*)&ac_data, sizeof(ac_data), &packet);
        send_packet(client_socket, &packet);
        
        printf("Sent AC phase %d data: %.1fV, %.1fA, %.1fHz, %.1fW\n", 
               ac_data.phase_id,
               ac_data.voltage / 10.0f,
               ac_data.current / 10.0f,
               ac_data.frequency / 10.0f,
               ac_data.power);
    }
}

void simulate_dc_outputs(int client_socket) {
    stm32_packet_t packet;
    stm32_dc_output_data_t dc_data;
    const char* load_names[] = {"Telecom", "Secur", "Netwk", "Light", "Spare", "Spare"};
    
    // Simulate 6 DC circuits
    for (int i = 0; i < 6; i++) {
        dc_data.circuit_id = i + 1;
        
        if (i < 4) { // Active circuits
            dc_data.voltage = 53500 + (rand() % 200) - 100; // 53.5V ± 0.1V
            dc_data.current = 6000 + (rand() % 10000); // 6-16A
            dc_data.power = dc_data.voltage * dc_data.current / 1000; // mW
            dc_data.enabled = 1; // Enabled
        } else { // Spare circuits
            dc_data.voltage = 0;
            dc_data.current = 0;
            dc_data.power = 0;
            dc_data.enabled = 0; // Disabled
        }
        
        strncpy((char*)dc_data.load_name, load_names[i], 6);
        
        create_packet(PACKET_TYPE_DC_OUTPUT, (uint8_t*)&dc_data, sizeof(dc_data), &packet);
        send_packet(client_socket, &packet);
        
        printf("Sent DC circuit %d data: %.2fV, %.2fA, %.2fW, enabled: %s, load: %s\n", 
               dc_data.circuit_id,
               dc_data.voltage / 1000.0f,
               dc_data.current / 1000.0f,
               dc_data.power / 1000.0f,
               dc_data.enabled ? "Yes" : "No",
               dc_data.load_name);
    }
}

void simulate_alarms(int client_socket) {
    stm32_packet_t packet;
    stm32_alarm_data_t alarm_data;
    static uint32_t alarm_counter = 100;
    
    // Random alarm generation
    if (rand() % 20 == 0) { // 5% chance
        alarm_data.alarm_id = alarm_counter++;
        alarm_data.severity = rand() % 3; // 0=Info, 1=Warning, 2=Critical
        alarm_data.timestamp = time(NULL);
        alarm_data.is_active = 1;
        
        const char* messages[] = {"HighTemp", "LowVolt", "OverCur", "Fault", "Warning", "Info"};
        strncpy((char*)alarm_data.message, messages[rand() % 6], 7);
        
        create_packet(PACKET_TYPE_ALARM, (uint8_t*)&alarm_data, sizeof(alarm_data), &packet);
        send_packet(client_socket, &packet);
        
        printf("Sent alarm: ID=%d, Severity=%d, Message=%s\n", 
               alarm_data.alarm_id, alarm_data.severity, alarm_data.message);
    }
}

void simulate_system_status(int client_socket) {
    stm32_packet_t packet;
    stm32_system_status_t status_data;
    static uint32_t uptime = 0;
    
    status_data.mains_available = 1; // Mains available
    status_data.battery_backup = 1; // Battery backup active
    status_data.generator_running = 0; // Generator not running
    status_data.operation_mode = 0; // Auto mode
    status_data.system_load = 750 + (rand() % 200) - 100; // 75% ± 10%
    status_data.uptime_seconds = uptime;
    
    uptime += 1; // Increment uptime
    
    create_packet(PACKET_TYPE_SYSTEM_STATUS, (uint8_t*)&status_data, sizeof(status_data), &packet);
    send_packet(client_socket, &packet);
    
    printf("Sent system status: Mains=%s, Battery=%s, Generator=%s, Load=%.1f%%, Uptime=%ds\n", 
           status_data.mains_available ? "Yes" : "No",
           status_data.battery_backup ? "Yes" : "No",
           status_data.generator_running ? "Yes" : "No",
           status_data.system_load / 10.0f,
           status_data.uptime_seconds);
}

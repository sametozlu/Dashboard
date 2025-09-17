#ifndef STM32_INTERFACE_H
#define STM32_INTERFACE_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

// STM32 Communication Protocol Constants
#define STM32_HEADER_HIGH    0xAA
#define STM32_HEADER_LOW     0x55
#define STM32_MAX_PACKET_SIZE 64
#define STM32_TIMEOUT_MS     1000

// Packet Types
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

// STM32 Packet Structure
typedef struct {
    uint8_t header_high;
    uint8_t header_low;
    uint8_t packet_type;
    uint8_t length;
    uint8_t data[STM32_MAX_PACKET_SIZE - 5];
    uint8_t checksum;
} stm32_packet_t;

// Power Module Data (12 bytes)
typedef struct {
    uint8_t module_id;
    uint16_t voltage;      // mV (e.g., 53500 = 53.5V)
    uint16_t current;      // mA (e.g., 45200 = 45.2A)
    uint16_t power;        // mW (e.g., 2400000 = 2.4kW)
    uint8_t temperature;   // Celsius
    uint8_t status;        // Bit flags
    uint8_t fault_flags;   // Bit flags
    uint8_t reserved[4];   // Future use
} stm32_power_module_data_t;

// Battery Data (10 bytes)
typedef struct {
    uint8_t battery_id;
    uint16_t voltage;      // mV (e.g., 12600 = 12.6V)
    uint16_t current;      // mA (e.g., 100 = 0.1A)
    uint8_t temperature;   // Celsius
    uint8_t capacity;      // Percentage (0-100)
    uint8_t charging;      // 0=Not charging, 1=Charging
    uint8_t test_status;   // 0=No test, 1=Test in progress
    uint8_t reserved[2];   // Future use
} stm32_battery_data_t;

// AC Input Data (11 bytes)
typedef struct {
    uint8_t phase_id;
    uint16_t voltage;      // V * 10 (e.g., 2305 = 230.5V)
    uint16_t current;      // A * 10 (e.g., 123 = 12.3A)
    uint16_t frequency;    // Hz * 10 (e.g., 500 = 50.0Hz)
    uint16_t power;        // W (e.g., 2830 = 2.83kW)
    uint8_t status;        // Bit flags
    uint8_t reserved[2];   // Future use
} stm32_ac_input_data_t;

// DC Output Data (12 bytes)
typedef struct {
    uint8_t circuit_id;
    uint16_t voltage;      // mV (e.g., 53500 = 53.5V)
    uint16_t current;      // mA (e.g., 6000 = 6.0A)
    uint16_t power;        // mW
    uint8_t enabled;       // 0=Disabled, 1=Enabled
    uint8_t load_name[6];  // Load name (6 chars max)
} stm32_dc_output_data_t;

// Alarm Data (16 bytes)
typedef struct {
    uint32_t alarm_id;
    uint8_t severity;      // 0=Info, 1=Warning, 2=Critical
    uint32_t timestamp;    // Unix timestamp
    uint8_t is_active;     // 0=Inactive, 1=Active
    uint8_t message[7];   // Message (7 chars max)
} stm32_alarm_data_t;

// System Status Data (8 bytes)
typedef struct {
    uint8_t mains_available;    // 0=No, 1=Yes
    uint8_t battery_backup;     // 0=No, 1=Yes
    uint8_t generator_running;  // 0=No, 1=Yes
    uint8_t operation_mode;     // 0=Auto, 1=Manual, 2=Test
    uint16_t system_load;       // Percentage * 10 (e.g., 750 = 75.0%)
    uint16_t uptime_seconds;    // Uptime in seconds
} stm32_system_status_t;

// Command Structure (8 bytes)
typedef struct {
    uint8_t command_id;
    uint8_t target_id;     // Module/Battery/Circuit ID
    uint8_t action;        // 0=Get, 1=Set, 2=Start, 3=Stop
    uint8_t parameter;     // Parameter value
    uint32_t reserved;     // Future use
} stm32_command_t;

// Function Declarations

// Packet handling
bool stm32_validate_packet(const stm32_packet_t* packet);
uint8_t stm32_calculate_checksum(const uint8_t* data, uint8_t length);
bool stm32_parse_packet(const uint8_t* raw_data, uint8_t length, stm32_packet_t* packet);

// Data conversion utilities
float stm32_voltage_to_float(uint16_t voltage_mv);
float stm32_current_to_float(uint16_t current_ma);
float stm32_power_to_float(uint16_t power_mw);
float stm32_frequency_to_float(uint16_t frequency_10x);

// Command sending
bool stm32_send_command(uint8_t command_id, uint8_t target_id, uint8_t action, uint8_t parameter);

// Data parsing functions
bool stm32_parse_power_module(const uint8_t* data, stm32_power_module_data_t* module);
bool stm32_parse_battery(const uint8_t* data, stm32_battery_data_t* battery);
bool stm32_parse_ac_input(const uint8_t* data, stm32_ac_input_data_t* ac_input);
bool stm32_parse_dc_output(const uint8_t* data, stm32_dc_output_data_t* dc_output);
bool stm32_parse_alarm(const uint8_t* data, stm32_alarm_data_t* alarm);
bool stm32_parse_system_status(const uint8_t* data, stm32_system_status_t* status);

#ifdef __cplusplus
}
#endif

#endif // STM32_INTERFACE_H

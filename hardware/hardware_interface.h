#ifndef HARDWARE_INTERFACE_H
#define HARDWARE_INTERFACE_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

// Hardware status codes
typedef enum {
    HW_STATUS_OK = 0,
    HW_STATUS_ERROR = -1,
    HW_STATUS_TIMEOUT = -2,
    HW_STATUS_NOT_CONNECTED = -3,
    HW_STATUS_INVALID_PARAM = -4
} hw_status_t;

// Power module structure
typedef struct {
    uint8_t module_id;
    float voltage;
    float current;
    float power;
    float temperature;
    bool is_active;
    bool has_fault;
} power_module_t;

// Battery information
typedef struct {
    uint8_t battery_id;
    float voltage;
    float current;
    float temperature;
    uint8_t capacity_percent;
    bool is_charging;
    bool test_in_progress;
} battery_info_t;

// AC input phase data
typedef struct {
    uint8_t phase_id;
    float voltage;
    float current;
    float frequency;
    float power;
    bool is_normal;
} ac_phase_t;

// DC output circuit data
typedef struct {
    uint8_t circuit_id;
    float voltage;
    float current;
    float power;
    bool is_enabled;
    char load_name[32];
} dc_circuit_t;

// Alarm data structure
typedef struct {
    uint32_t alarm_id;
    uint8_t severity;  // 0=Info, 1=Warning, 2=Critical
    uint32_t timestamp;
    bool is_active;
    char message[128];
} alarm_t;

// System status
typedef struct {
    bool mains_available;
    bool battery_backup;
    bool generator_running;
    uint8_t operation_mode;  // 0=Auto, 1=Manual, 2=Test
    float system_load;
    uint32_t uptime_seconds;
} system_status_t;

// Function declarations for hardware interface

// Initialization and cleanup
hw_status_t hw_init(void);
hw_status_t hw_cleanup(void);

// Power module functions
hw_status_t hw_get_power_modules(power_module_t* modules, uint8_t* count);
hw_status_t hw_set_power_module_state(uint8_t module_id, bool enable);
hw_status_t hw_set_target_voltage(float voltage);

// Battery functions
hw_status_t hw_get_battery_info(battery_info_t* batteries, uint8_t* count);
hw_status_t hw_start_battery_test(uint8_t battery_id, uint8_t test_type);
hw_status_t hw_stop_battery_test(uint8_t battery_id);

// AC input functions
hw_status_t hw_get_ac_inputs(ac_phase_t* phases, uint8_t* count);

// DC output functions
hw_status_t hw_get_dc_outputs(dc_circuit_t* circuits, uint8_t* count);
hw_status_t hw_set_dc_circuit_state(uint8_t circuit_id, bool enable);

// Alarm functions
hw_status_t hw_get_active_alarms(alarm_t* alarms, uint8_t* count);
hw_status_t hw_acknowledge_alarm(uint32_t alarm_id);
hw_status_t hw_clear_alarm(uint32_t alarm_id);

// System control functions
hw_status_t hw_get_system_status(system_status_t* status);
hw_status_t hw_set_operation_mode(uint8_t mode);
hw_status_t hw_system_restart(void);
hw_status_t hw_system_shutdown(void);

// Network and communication
hw_status_t hw_send_snmp_trap(const char* message);
hw_status_t hw_test_network_connection(void);

// GPS and location
hw_status_t hw_get_gps_coordinates(float* latitude, float* longitude, float* altitude);
hw_status_t hw_get_system_time(uint32_t* timestamp);
hw_status_t hw_set_system_time(uint32_t timestamp);

// Temperature and environmental sensors
hw_status_t hw_get_ambient_temperature(float* temperature);
hw_status_t hw_get_humidity(float* humidity);
hw_status_t hw_get_door_status(bool* is_open);

// Logging and data storage
hw_status_t hw_log_data_point(const char* parameter, float value, uint32_t timestamp);
hw_status_t hw_get_historical_data(const char* parameter, uint32_t start_time, 
                                  uint32_t end_time, float* values, uint32_t* count);

#ifdef __cplusplus
}
#endif

#endif // HARDWARE_INTERFACE_H
#include "hardware_interface.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>

// Simulated hardware state
static bool hw_initialized = false;
static power_module_t power_modules[4];
static battery_info_t batteries[4];
static ac_phase_t ac_phases[3];
static dc_circuit_t dc_circuits[6];
static alarm_t active_alarms[10];
static system_status_t system_status;
static uint8_t active_alarm_count = 0;

// Initialize hardware simulation
hw_status_t hw_init(void) {
    if (hw_initialized) {
        return HW_STATUS_OK;
    }
    
    srand((unsigned int)time(NULL));
    
    // Initialize power modules
    for (int i = 0; i < 4; i++) {
        power_modules[i].module_id = i + 1;
        power_modules[i].voltage = 53.4f + (rand() % 10) * 0.1f;
        power_modules[i].current = (i < 3) ? 44.0f + (rand() % 20) * 0.1f : 0.0f;
        power_modules[i].power = power_modules[i].voltage * power_modules[i].current / 1000.0f;
        power_modules[i].temperature = 40.0f + (rand() % 10);
        power_modules[i].is_active = (i < 3);
        power_modules[i].has_fault = false;
    }
    
    // Initialize batteries
    for (int i = 0; i < 4; i++) {
        batteries[i].battery_id = i + 1;
        batteries[i].voltage = 12.6f + (rand() % 5) * 0.1f;
        batteries[i].current = 0.1f + (rand() % 10) * 0.01f;
        batteries[i].temperature = 24.0f + (rand() % 6);
        batteries[i].capacity_percent = 85 + (rand() % 10);
        batteries[i].is_charging = false;
        batteries[i].test_in_progress = false;
    }
    
    // Initialize AC phases
    const char* phase_names[] = {"L1", "L2", "L3"};
    for (int i = 0; i < 3; i++) {
        ac_phases[i].phase_id = i + 1;
        ac_phases[i].voltage = 230.0f + (rand() % 20) * 0.1f;
        ac_phases[i].current = 11.0f + (rand() % 30) * 0.1f;
        ac_phases[i].frequency = 50.0f;
        ac_phases[i].power = ac_phases[i].voltage * ac_phases[i].current / 1000.0f;
        ac_phases[i].is_normal = true;
    }
    
    // Initialize DC circuits
    const char* load_names[] = {"Telecom", "Security", "Network", "Lighting", "Spare", "Spare"};
    for (int i = 0; i < 6; i++) {
        dc_circuits[i].circuit_id = i + 1;
        dc_circuits[i].voltage = (i < 4) ? 53.4f + (rand() % 5) * 0.1f : 0.0f;
        dc_circuits[i].current = (i < 4) ? 6.0f + (rand() % 100) * 0.1f : 0.0f;
        dc_circuits[i].power = dc_circuits[i].voltage * dc_circuits[i].current;
        dc_circuits[i].is_enabled = (i < 4);
        strncpy(dc_circuits[i].load_name, load_names[i], sizeof(dc_circuits[i].load_name) - 1);
    }
    
    // Initialize system status
    system_status.mains_available = true;
    system_status.battery_backup = true;
    system_status.generator_running = false;
    system_status.operation_mode = 0; // Auto
    system_status.system_load = 75.0f;
    system_status.uptime_seconds = 107 * 24 * 3600; // 107 days
    
    hw_initialized = true;
    return HW_STATUS_OK;
}

hw_status_t hw_cleanup(void) {
    hw_initialized = false;
    return HW_STATUS_OK;
}

// Power module functions
hw_status_t hw_get_power_modules(power_module_t* modules, uint8_t* count) {
    if (!hw_initialized || !modules || !count) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    // Simulate real-time updates
    for (int i = 0; i < 4; i++) {
        if (power_modules[i].is_active) {
            power_modules[i].current = 44.0f + (rand() % 20) * 0.1f;
            power_modules[i].power = power_modules[i].voltage * power_modules[i].current / 1000.0f;
            power_modules[i].temperature = 40.0f + (rand() % 10);
        }
    }
    
    memcpy(modules, power_modules, sizeof(power_modules));
    *count = 4;
    return HW_STATUS_OK;
}

hw_status_t hw_set_power_module_state(uint8_t module_id, bool enable) {
    if (!hw_initialized || module_id < 1 || module_id > 4) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    power_modules[module_id - 1].is_active = enable;
    if (!enable) {
        power_modules[module_id - 1].current = 0.0f;
        power_modules[module_id - 1].power = 0.0f;
        power_modules[module_id - 1].temperature = 25.0f;
    }
    
    return HW_STATUS_OK;
}

hw_status_t hw_set_target_voltage(float voltage) {
    if (!hw_initialized || voltage < 48.0f || voltage > 58.0f) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    for (int i = 0; i < 4; i++) {
        if (power_modules[i].is_active) {
            power_modules[i].voltage = voltage;
        }
    }
    
    return HW_STATUS_OK;
}

// Battery functions
hw_status_t hw_get_battery_info(battery_info_t* batteries_out, uint8_t* count) {
    if (!hw_initialized || !batteries_out || !count) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    // Simulate battery voltage fluctuations
    for (int i = 0; i < 4; i++) {
        batteries[i].voltage = 12.6f + (rand() % 5) * 0.01f;
        batteries[i].current = 0.1f + (rand() % 10) * 0.01f;
        batteries[i].temperature = 24.0f + (rand() % 3);
    }
    
    memcpy(batteries_out, batteries, sizeof(batteries));
    *count = 4;
    return HW_STATUS_OK;
}

hw_status_t hw_start_battery_test(uint8_t battery_id, uint8_t test_type) {
    if (!hw_initialized || battery_id < 1 || battery_id > 4) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    batteries[battery_id - 1].test_in_progress = true;
    return HW_STATUS_OK;
}

hw_status_t hw_stop_battery_test(uint8_t battery_id) {
    if (!hw_initialized || battery_id < 1 || battery_id > 4) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    batteries[battery_id - 1].test_in_progress = false;
    return HW_STATUS_OK;
}

// AC input functions
hw_status_t hw_get_ac_inputs(ac_phase_t* phases, uint8_t* count) {
    if (!hw_initialized || !phases || !count) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    // Simulate AC fluctuations
    for (int i = 0; i < 3; i++) {
        ac_phases[i].voltage = 230.0f + (rand() % 10) * 0.1f;
        ac_phases[i].current = 11.0f + (rand() % 20) * 0.1f;
        ac_phases[i].power = ac_phases[i].voltage * ac_phases[i].current / 1000.0f;
    }
    
    memcpy(phases, ac_phases, sizeof(ac_phases));
    *count = 3;
    return HW_STATUS_OK;
}

// DC output functions
hw_status_t hw_get_dc_outputs(dc_circuit_t* circuits, uint8_t* count) {
    if (!hw_initialized || !circuits || !count) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    // Simulate load variations
    for (int i = 0; i < 6; i++) {
        if (dc_circuits[i].is_enabled) {
            dc_circuits[i].current = 6.0f + (rand() % 100) * 0.1f;
            dc_circuits[i].power = dc_circuits[i].voltage * dc_circuits[i].current;
        }
    }
    
    memcpy(circuits, dc_circuits, sizeof(dc_circuits));
    *count = 6;
    return HW_STATUS_OK;
}

hw_status_t hw_set_dc_circuit_state(uint8_t circuit_id, bool enable) {
    if (!hw_initialized || circuit_id < 1 || circuit_id > 6) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    dc_circuits[circuit_id - 1].is_enabled = enable;
    if (!enable) {
        dc_circuits[circuit_id - 1].voltage = 0.0f;
        dc_circuits[circuit_id - 1].current = 0.0f;
        dc_circuits[circuit_id - 1].power = 0.0f;
    } else {
        dc_circuits[circuit_id - 1].voltage = 53.4f;
    }
    
    return HW_STATUS_OK;
}

// Alarm functions
hw_status_t hw_get_active_alarms(alarm_t* alarms, uint8_t* count) {
    if (!hw_initialized || !alarms || !count) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    memcpy(alarms, active_alarms, active_alarm_count * sizeof(alarm_t));
    *count = active_alarm_count;
    return HW_STATUS_OK;
}

hw_status_t hw_acknowledge_alarm(uint32_t alarm_id) {
    if (!hw_initialized) {
        return HW_STATUS_ERROR;
    }
    
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            // Mark as acknowledged (you might want to add an acknowledged field)
            return HW_STATUS_OK;
        }
    }
    
    return HW_STATUS_INVALID_PARAM;
}

hw_status_t hw_clear_alarm(uint32_t alarm_id) {
    if (!hw_initialized) {
        return HW_STATUS_ERROR;
    }
    
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            // Remove alarm from active list
            for (int j = i; j < active_alarm_count - 1; j++) {
                active_alarms[j] = active_alarms[j + 1];
            }
            active_alarm_count--;
            return HW_STATUS_OK;
        }
    }
    
    return HW_STATUS_INVALID_PARAM;
}

// System control functions
hw_status_t hw_get_system_status(system_status_t* status) {
    if (!hw_initialized || !status) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    // Update uptime
    system_status.uptime_seconds += 1;
    
    memcpy(status, &system_status, sizeof(system_status_t));
    return HW_STATUS_OK;
}

hw_status_t hw_set_operation_mode(uint8_t mode) {
    if (!hw_initialized || mode > 2) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    system_status.operation_mode = mode;
    return HW_STATUS_OK;
}

hw_status_t hw_system_restart(void) {
    if (!hw_initialized) {
        return HW_STATUS_ERROR;
    }
    
    // Simulate system restart
    printf("System restart initiated...\n");
    return HW_STATUS_OK;
}

hw_status_t hw_system_shutdown(void) {
    if (!hw_initialized) {
        return HW_STATUS_ERROR;
    }
    
    // Simulate system shutdown
    printf("System shutdown initiated...\n");
    return HW_STATUS_OK;
}

// Network and communication
hw_status_t hw_send_snmp_trap(const char* message) {
    if (!hw_initialized || !message) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    printf("SNMP Trap sent: %s\n", message);
    return HW_STATUS_OK;
}

hw_status_t hw_test_network_connection(void) {
    if (!hw_initialized) {
        return HW_STATUS_ERROR;
    }
    
    // Simulate network test
    return (rand() % 10 > 1) ? HW_STATUS_OK : HW_STATUS_TIMEOUT;
}

// GPS and location
hw_status_t hw_get_gps_coordinates(float* latitude, float* longitude, float* altitude) {
    if (!hw_initialized || !latitude || !longitude || !altitude) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    *latitude = 39.9334f + (rand() % 100) * 0.0001f;
    *longitude = 32.8597f + (rand() % 100) * 0.0001f;
    *altitude = 850.0f + (rand() % 100) * 0.1f;
    
    return HW_STATUS_OK;
}

hw_status_t hw_get_system_time(uint32_t* timestamp) {
    if (!hw_initialized || !timestamp) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    *timestamp = (uint32_t)time(NULL);
    return HW_STATUS_OK;
}

hw_status_t hw_set_system_time(uint32_t timestamp) {
    if (!hw_initialized) {
        return HW_STATUS_ERROR;
    }
    
    // In real implementation, this would set system time
    printf("System time set to: %u\n", timestamp);
    return HW_STATUS_OK;
}

// Temperature and environmental sensors
hw_status_t hw_get_ambient_temperature(float* temperature) {
    if (!hw_initialized || !temperature) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    *temperature = 18.0f + (rand() % 100) * 0.1f;
    return HW_STATUS_OK;
}

hw_status_t hw_get_humidity(float* humidity) {
    if (!hw_initialized || !humidity) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    *humidity = 60.0f + (rand() % 200) * 0.1f;
    return HW_STATUS_OK;
}

hw_status_t hw_get_door_status(bool* is_open) {
    if (!hw_initialized || !is_open) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    *is_open = false; // Door is closed
    return HW_STATUS_OK;
}

// Logging and data storage
hw_status_t hw_log_data_point(const char* parameter, float value, uint32_t timestamp) {
    if (!hw_initialized || !parameter) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    printf("Log: %s = %.2f at %u\n", parameter, value, timestamp);
    return HW_STATUS_OK;
}

hw_status_t hw_get_historical_data(const char* parameter, uint32_t start_time, 
                                  uint32_t end_time, float* values, uint32_t* count) {
    if (!hw_initialized || !parameter || !values || !count) {
        return HW_STATUS_INVALID_PARAM;
    }
    
    // Simulate returning some historical data
    uint32_t data_points = (end_time - start_time) / 3600; // Hourly data
    if (data_points > *count) {
        data_points = *count;
    }
    
    for (uint32_t i = 0; i < data_points; i++) {
        values[i] = 50.0f + (rand() % 100) * 0.1f; // Simulated values
    }
    
    *count = data_points;
    return HW_STATUS_OK;
}
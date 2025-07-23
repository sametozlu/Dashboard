#include "hardware_interface.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    printf("NetMon Hardware Interface Test\n");
    printf("==============================\n\n");

    // Initialize hardware
    printf("1. Initializing hardware...\n");
    hw_status_t status = hw_init();
    if (status != HW_STATUS_OK) {
        printf("Failed to initialize hardware: %d\n", status);
        return 1;
    }
    printf("Hardware initialized successfully.\n\n");

    // Test power modules
    printf("2. Testing power modules...\n");
    power_module_t modules[4];
    uint8_t module_count = 4;
    
    status = hw_get_power_modules(modules, &module_count);
    if (status == HW_STATUS_OK) {
        printf("Found %d power modules:\n", module_count);
        for (int i = 0; i < module_count; i++) {
            printf("  Module %d: %.1fV, %.1fA, %.2fkW, %.1f°C, %s\n",
                   modules[i].module_id,
                   modules[i].voltage,
                   modules[i].current,
                   modules[i].power,
                   modules[i].temperature,
                   modules[i].is_active ? "Active" : "Inactive");
        }
    } else {
        printf("Failed to get power modules: %d\n", status);
    }
    printf("\n");

    // Test battery info
    printf("3. Testing battery information...\n");
    battery_info_t batteries[4];
    uint8_t battery_count = 4;
    
    status = hw_get_battery_info(batteries, &battery_count);
    if (status == HW_STATUS_OK) {
        printf("Found %d batteries:\n", battery_count);
        for (int i = 0; i < battery_count; i++) {
            printf("  Battery %d: %.1fV, %.2fA, %.1f°C, %d%%, %s\n",
                   batteries[i].battery_id,
                   batteries[i].voltage,
                   batteries[i].current,
                   batteries[i].temperature,
                   batteries[i].capacity_percent,
                   batteries[i].is_charging ? "Charging" : "Not charging");
        }
    } else {
        printf("Failed to get battery info: %d\n", status);
    }
    printf("\n");

    // Test AC inputs
    printf("4. Testing AC inputs...\n");
    ac_phase_t phases[3];
    uint8_t phase_count = 3;
    
    status = hw_get_ac_inputs(phases, &phase_count);
    if (status == HW_STATUS_OK) {
        printf("Found %d AC phases:\n", phase_count);
        for (int i = 0; i < phase_count; i++) {
            printf("  Phase %d: %.1fV, %.1fA, %.1fHz, %.2fkW, %s\n",
                   phases[i].phase_id,
                   phases[i].voltage,
                   phases[i].current,
                   phases[i].frequency,
                   phases[i].power,
                   phases[i].is_normal ? "Normal" : "Fault");
        }
    } else {
        printf("Failed to get AC inputs: %d\n", status);
    }
    printf("\n");

    // Test DC outputs
    printf("5. Testing DC outputs...\n");
    dc_circuit_t circuits[6];
    uint8_t circuit_count = 6;
    
    status = hw_get_dc_outputs(circuits, &circuit_count);
    if (status == HW_STATUS_OK) {
        printf("Found %d DC circuits:\n", circuit_count);
        for (int i = 0; i < circuit_count; i++) {
            printf("  Circuit %d (%s): %.1fV, %.1fA, %.0fW, %s\n",
                   circuits[i].circuit_id,
                   circuits[i].load_name,
                   circuits[i].voltage,
                   circuits[i].current,
                   circuits[i].power,
                   circuits[i].is_enabled ? "Enabled" : "Disabled");
        }
    } else {
        printf("Failed to get DC outputs: %d\n", status);
    }
    printf("\n");

    // Test system status
    printf("6. Testing system status...\n");
    system_status_t sys_status;
    
    status = hw_get_system_status(&sys_status);
    if (status == HW_STATUS_OK) {
        printf("System Status:\n");
        printf("  Mains: %s\n", sys_status.mains_available ? "Available" : "Not available");
        printf("  Battery: %s\n", sys_status.battery_backup ? "Available" : "Not available");
        printf("  Generator: %s\n", sys_status.generator_running ? "Running" : "Not running");
        printf("  Mode: %s\n", 
               sys_status.operation_mode == 0 ? "Auto" :
               sys_status.operation_mode == 1 ? "Manual" : "Test");
        printf("  Load: %.1f%%\n", sys_status.system_load);
        printf("  Uptime: %u seconds\n", sys_status.uptime_seconds);
    } else {
        printf("Failed to get system status: %d\n", status);
    }
    printf("\n");

    // Test control functions
    printf("7. Testing control functions...\n");
    
    // Test setting power module state
    printf("Setting power module 4 to active...\n");
    status = hw_set_power_module_state(4, true);
    printf("Result: %s\n", status == HW_STATUS_OK ? "Success" : "Failed");
    
    // Test setting DC circuit state
    printf("Setting DC circuit 5 to enabled...\n");
    status = hw_set_dc_circuit_state(5, true);
    printf("Result: %s\n", status == HW_STATUS_OK ? "Success" : "Failed");
    
    // Test setting operation mode
    printf("Setting operation mode to manual...\n");
    status = hw_set_operation_mode(1);
    printf("Result: %s\n", status == HW_STATUS_OK ? "Success" : "Failed");
    printf("\n");

    // Test alarms
    printf("8. Testing alarm system...\n");
    alarm_t alarms[10];
    uint8_t alarm_count = 10;
    
    status = hw_get_active_alarms(alarms, &alarm_count);
    if (status == HW_STATUS_OK) {
        printf("Active alarms: %d\n", alarm_count);
        for (int i = 0; i < alarm_count; i++) {
            printf("  Alarm %u: Severity %d, %s\n",
                   alarms[i].alarm_id,
                   alarms[i].severity,
                   alarms[i].message);
        }
    } else {
        printf("Failed to get alarms: %d\n", status);
    }
    printf("\n");

    // Test GPS coordinates
    printf("9. Testing GPS coordinates...\n");
    float latitude, longitude, altitude;
    status = hw_get_gps_coordinates(&latitude, &longitude, &altitude);
    if (status == HW_STATUS_OK) {
        printf("GPS: %.4f°N, %.4f°E, %.1fm\n", latitude, longitude, altitude);
    } else {
        printf("Failed to get GPS coordinates: %d\n", status);
    }
    printf("\n");

    // Test environmental sensors
    printf("10. Testing environmental sensors...\n");
    float temperature, humidity;
    bool door_open;
    
    status = hw_get_ambient_temperature(&temperature);
    if (status == HW_STATUS_OK) {
        printf("Ambient temperature: %.1f°C\n", temperature);
    }
    
    status = hw_get_humidity(&humidity);
    if (status == HW_STATUS_OK) {
        printf("Humidity: %.1f%%\n", humidity);
    }
    
    status = hw_get_door_status(&door_open);
    if (status == HW_STATUS_OK) {
        printf("Door: %s\n", door_open ? "Open" : "Closed");
    }
    printf("\n");

    // Cleanup
    printf("11. Cleaning up...\n");
    status = hw_cleanup();
    if (status == HW_STATUS_OK) {
        printf("Hardware cleanup successful.\n");
    } else {
        printf("Hardware cleanup failed: %d\n", status);
    }

    printf("\nTest completed.\n");
    return 0;
}
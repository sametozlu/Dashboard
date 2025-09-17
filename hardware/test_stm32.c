#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "stm32_interface.h"

// Test data
static uint8_t test_power_module_data[] = {
    0x01,           // Module ID: 1
    0x34, 0xD1,     // Voltage: 53500 mV (53.5V) - Little Endian
    0x34, 0xB0,     // Current: 45200 mA (45.2A) - Little Endian
    0x40, 0x25,     // Power: 2400000 mW (2.4kW) - Little Endian
    0x2A,           // Temperature: 42°C
    0x01,           // Status: Active
    0x00,           // Fault flags: No faults
    0x00, 0x00, 0x00, 0x00  // Reserved
};

static uint8_t test_battery_data[] = {
    0x01,           // Battery ID: 1
    0x34, 0x31,     // Voltage: 12600 mV (12.6V) - Little Endian
    0x64, 0x00,     // Current: 100 mA (0.1A) - Little Endian
    0x18,           // Temperature: 24°C
    0x55,           // Capacity: 85%
    0x00,           // Charging: No
    0x00,           // Test status: No test
    0x00, 0x00      // Reserved
};

static uint8_t test_ac_input_data[] = {
    0x01,           // Phase ID: 1
    0x09, 0x09,     // Voltage: 2305 (230.5V) - Little Endian
    0x7B, 0x00,     // Current: 123 (12.3A) - Little Endian
    0xF4, 0x01,     // Frequency: 500 (50.0Hz) - Little Endian
    0x1B, 0x0B,     // Power: 2830W - Little Endian
    0x01,           // Status: Normal
    0x00, 0x00      // Reserved
};

static uint8_t test_dc_output_data[] = {
    0x01,           // Circuit ID: 1
    0x34, 0xD1,     // Voltage: 53500 mV (53.5V) - Little Endian
    0x70, 0x17,     // Current: 6000 mA (6.0A) - Little Endian
    0x40, 0x25,     // Power: 2400000 mW (2.4kW) - Little Endian
    0x01,           // Enabled: Yes
    'T', 'e', 'l', 'e', 'c', 'o'  // Load name: "Telecom"
};

static uint8_t test_alarm_data[] = {
    0x65, 0x00, 0x00, 0x00, // Alarm ID: 101 - Little Endian
    0x02,                     // Severity: Critical
    0x65, 0x4E, 0x5F, 0x00, // Timestamp: 1640995200 - Little Endian
    0x01,                     // Is active: Yes
    'H', 'i', 'g', 'h', 'T', 'e', 'm'  // Message: "HighTem"
};

static uint8_t test_system_status_data[] = {
    0x01,           // Mains available: Yes
    0x01,           // Battery backup: Yes
    0x00,           // Generator running: No
    0x00,           // Operation mode: Auto
    0xEE, 0x02,     // System load: 750 (75.0%) - Little Endian
    0x40, 0x8D, 0x03, 0x00  // Uptime: 240000 seconds - Little Endian
};

// Test functions
void test_power_module_parsing() {
    printf("\n=== Testing Power Module Data Parsing ===\n");
    
    stm32_power_module_data_t module_data;
    if (stm32_parse_power_module(test_power_module_data, &module_data)) {
        printf("✓ Power module data parsed successfully\n");
        printf("  Module ID: %d\n", module_data.module_id);
        printf("  Voltage: %d mV (%.2f V)\n", module_data.voltage, stm32_voltage_to_float(module_data.voltage));
        printf("  Current: %d mA (%.2f A)\n", module_data.current, stm32_current_to_float(module_data.current));
        printf("  Power: %d mW (%.2f W)\n", module_data.power, stm32_power_to_float(module_data.power));
        printf("  Temperature: %d°C\n", module_data.temperature);
        printf("  Status: 0x%02X\n", module_data.status);
        printf("  Fault flags: 0x%02X\n", module_data.fault_flags);
    } else {
        printf("✗ Failed to parse power module data\n");
    }
}

void test_battery_parsing() {
    printf("\n=== Testing Battery Data Parsing ===\n");
    
    stm32_battery_data_t battery_data;
    if (stm32_parse_battery(test_battery_data, &battery_data)) {
        printf("✓ Battery data parsed successfully\n");
        printf("  Battery ID: %d\n", battery_data.battery_id);
        printf("  Voltage: %d mV (%.2f V)\n", battery_data.voltage, stm32_voltage_to_float(battery_data.voltage));
        printf("  Current: %d mA (%.2f A)\n", battery_data.current, stm32_current_to_float(battery_data.current));
        printf("  Temperature: %d°C\n", battery_data.temperature);
        printf("  Capacity: %d%%\n", battery_data.capacity);
        printf("  Charging: %s\n", battery_data.charging ? "Yes" : "No");
        printf("  Test status: %s\n", battery_data.test_status ? "In progress" : "No test");
    } else {
        printf("✗ Failed to parse battery data\n");
    }
}

void test_ac_input_parsing() {
    printf("\n=== Testing AC Input Data Parsing ===\n");
    
    stm32_ac_input_data_t ac_data;
    if (stm32_parse_ac_input(test_ac_input_data, &ac_data)) {
        printf("✓ AC input data parsed successfully\n");
        printf("  Phase ID: %d\n", ac_data.phase_id);
        printf("  Voltage: %d (%.1f V)\n", ac_data.voltage, stm32_frequency_to_float(ac_data.voltage));
        printf("  Current: %d (%.1f A)\n", ac_data.current, stm32_frequency_to_float(ac_data.current));
        printf("  Frequency: %d (%.1f Hz)\n", ac_data.frequency, stm32_frequency_to_float(ac_data.frequency));
        printf("  Power: %d W\n", ac_data.power);
        printf("  Status: 0x%02X\n", ac_data.status);
    } else {
        printf("✗ Failed to parse AC input data\n");
    }
}

void test_dc_output_parsing() {
    printf("\n=== Testing DC Output Data Parsing ===\n");
    
    stm32_dc_output_data_t dc_data;
    if (stm32_parse_dc_output(test_dc_output_data, &dc_data)) {
        printf("✓ DC output data parsed successfully\n");
        printf("  Circuit ID: %d\n", dc_data.circuit_id);
        printf("  Voltage: %d mV (%.2f V)\n", dc_data.voltage, stm32_voltage_to_float(dc_data.voltage));
        printf("  Current: %d mA (%.2f A)\n", dc_data.current, stm32_current_to_float(dc_data.current));
        printf("  Power: %d mW (%.2f W)\n", dc_data.power, stm32_power_to_float(dc_data.power));
        printf("  Enabled: %s\n", dc_data.enabled ? "Yes" : "No");
        printf("  Load name: %s\n", dc_data.load_name);
    } else {
        printf("✗ Failed to parse DC output data\n");
    }
}

void test_alarm_parsing() {
    printf("\n=== Testing Alarm Data Parsing ===\n");
    
    stm32_alarm_data_t alarm_data;
    if (stm32_parse_alarm(test_alarm_data, &alarm_data)) {
        printf("✓ Alarm data parsed successfully\n");
        printf("  Alarm ID: %d\n", alarm_data.alarm_id);
        printf("  Severity: %d\n", alarm_data.severity);
        printf("  Timestamp: %d\n", alarm_data.timestamp);
        printf("  Is active: %s\n", alarm_data.is_active ? "Yes" : "No");
        printf("  Message: %s\n", alarm_data.message);
    } else {
        printf("✗ Failed to parse alarm data\n");
    }
}

void test_system_status_parsing() {
    printf("\n=== Testing System Status Data Parsing ===\n");
    
    stm32_system_status_data_t status_data;
    if (stm32_parse_system_status(test_system_status_data, &status_data)) {
        printf("✓ System status data parsed successfully\n");
        printf("  Mains available: %s\n", status_data.mains_available ? "Yes" : "No");
        printf("  Battery backup: %s\n", status_data.battery_backup ? "Yes" : "No");
        printf("  Generator running: %s\n", status_data.generator_running ? "Yes" : "No");
        printf("  Operation mode: %d\n", status_data.operation_mode);
        printf("  System load: %d (%.1f%%)\n", status_data.system_load, status_data.system_load / 10.0f);
        printf("  Uptime: %d seconds\n", status_data.uptime_seconds);
    } else {
        printf("✗ Failed to parse system status data\n");
    }
}

void test_packet_creation() {
    printf("\n=== Testing Packet Creation ===\n");
    
    stm32_packet_t packet;
    if (stm32_create_packet(PACKET_TYPE_POWER_MODULE, test_power_module_data, sizeof(test_power_module_data), &packet)) {
        printf("✓ Packet created successfully\n");
        printf("  Header: 0x%02X 0x%02X\n", packet.header_high, packet.header_low);
        printf("  Type: 0x%02X\n", packet.packet_type);
        printf("  Length: %d\n", packet.length);
        printf("  Checksum: 0x%02X\n", packet.checksum);
        
        // Validate packet
        if (stm32_validate_packet(&packet)) {
            printf("✓ Packet validation successful\n");
        } else {
            printf("✗ Packet validation failed\n");
        }
    } else {
        printf("✗ Failed to create packet\n");
    }
}

void test_checksum_calculation() {
    printf("\n=== Testing Checksum Calculation ===\n");
    
    uint8_t test_data[] = {0xAA, 0x55, 0x01, 0x0C, 0x01, 0x34, 0xD1, 0x34, 0xB0, 0x40, 0x25, 0x2A, 0x01, 0x00};
    uint8_t expected_checksum = 0x00; // Calculate manually
    
    uint8_t calculated_checksum = stm32_calculate_checksum(test_data, sizeof(test_data) - 1);
    printf("  Calculated checksum: 0x%02X\n", calculated_checksum);
    printf("  Expected checksum: 0x%02X\n", expected_checksum);
    
    if (calculated_checksum == expected_checksum) {
        printf("✓ Checksum calculation correct\n");
    } else {
        printf("✗ Checksum calculation incorrect\n");
    }
}

void test_command_sending() {
    printf("\n=== Testing Command Sending ===\n");
    
    // Test command: Enable power module 1
    bool result = stm32_send_command(1, 1, 1, 1);
    if (result) {
        printf("✓ Command sent successfully\n");
    } else {
        printf("✗ Failed to send command\n");
    }
}

int main() {
    printf("STM32 Interface Test Program\n");
    printf("============================\n");
    
    // Run all tests
    test_power_module_parsing();
    test_battery_parsing();
    test_ac_input_parsing();
    test_dc_output_parsing();
    test_alarm_parsing();
    test_system_status_parsing();
    test_packet_creation();
    test_checksum_calculation();
    test_command_sending();
    
    printf("\n=== Test Summary ===\n");
    printf("All tests completed!\n");
    
    return 0;
}

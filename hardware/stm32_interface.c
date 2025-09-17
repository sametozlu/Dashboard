#include "stm32_interface.h"
#include <string.h>
#include <stdio.h>

// Packet validation
bool stm32_validate_packet(const stm32_packet_t* packet) {
    if (!packet) return false;
    
    // Check header
    if (packet->header_high != STM32_HEADER_HIGH || 
        packet->header_low != STM32_HEADER_LOW) {
        return false;
    }
    
    // Check length
    if (packet->length > STM32_MAX_PACKET_SIZE - 5) {
        return false;
    }
    
    // Check checksum
    uint8_t calculated_checksum = stm32_calculate_checksum(
        (const uint8_t*)packet, 
        packet->length + 4  // header + type + length + data
    );
    
    return calculated_checksum == packet->checksum;
}

// Calculate XOR checksum
uint8_t stm32_calculate_checksum(const uint8_t* data, uint8_t length) {
    uint8_t checksum = 0;
    for (uint8_t i = 0; i < length; i++) {
        checksum ^= data[i];
    }
    return checksum;
}

// Parse raw data into packet structure
bool stm32_parse_packet(const uint8_t* raw_data, uint8_t length, stm32_packet_t* packet) {
    if (!raw_data || !packet || length < 5) {
        return false;
    }
    
    // Copy data
    memcpy(packet, raw_data, length);
    
    // Validate packet
    return stm32_validate_packet(packet);
}

// Data conversion utilities
float stm32_voltage_to_float(uint16_t voltage_mv) {
    return (float)voltage_mv / 1000.0f;  // Convert mV to V
}

float stm32_current_to_float(uint16_t current_ma) {
    return (float)current_ma / 1000.0f;  // Convert mA to A
}

float stm32_power_to_float(uint16_t power_mw) {
    return (float)power_mw / 1000.0f;    // Convert mW to W
}

float stm32_frequency_to_float(uint16_t frequency_10x) {
    return (float)frequency_10x / 10.0f; // Convert 10x to actual frequency
}

// Send command to STM32
bool stm32_send_command(uint8_t command_id, uint8_t target_id, uint8_t action, uint8_t parameter) {
    // This function would implement the actual communication protocol
    // For now, it's a placeholder that would send data over UART/SPI/USB
    
    stm32_command_t cmd = {
        .command_id = command_id,
        .target_id = target_id,
        .action = action,
        .parameter = parameter,
        .reserved = 0
    };
    
    // TODO: Implement actual communication
    // Example: uart_send_data((uint8_t*)&cmd, sizeof(cmd));
    
    printf("STM32 Command: ID=%d, Target=%d, Action=%d, Param=%d\n", 
           command_id, target_id, action, parameter);
    
    return true;
}

// Parse power module data
bool stm32_parse_power_module(const uint8_t* data, stm32_power_module_data_t* module) {
    if (!data || !module) return false;
    
    memcpy(module, data, sizeof(stm32_power_module_data_t));
    
    // Validate data ranges
    if (module->voltage > 100000 ||    // Max 100V
        module->current > 100000 ||    // Max 100A
        module->temperature > 150) {   // Max 150°C
        return false;
    }
    
    return true;
}

// Parse battery data
bool stm32_parse_battery(const uint8_t* data, stm32_battery_data_t* battery) {
    if (!data || !battery) return false;
    
    memcpy(battery, data, sizeof(stm32_battery_data_t));
    
    // Validate data ranges
    if (battery->voltage > 15000 ||   // Max 15V
        battery->current > 10000 ||   // Max 10A
        battery->temperature > 100 || // Max 100°C
        battery->capacity > 100) {    // Max 100%
        return false;
    }
    
    return true;
}

// Parse AC input data
bool stm32_parse_ac_input(const uint8_t* data, stm32_ac_input_data_t* ac_input) {
    if (!data || !ac_input) return false;
    
    memcpy(ac_input, data, sizeof(stm32_ac_input_data_t));
    
    // Validate data ranges
    if (ac_input->voltage > 5000 ||   // Max 500V
        ac_input->current > 1000 ||   // Max 100A
        ac_input->frequency > 1000 || // Max 100Hz
        ac_input->power > 100000) {   // Max 100kW
        return false;
    }
    
    return true;
}

// Parse DC output data
bool stm32_parse_dc_output(const uint8_t* data, stm32_dc_output_data_t* dc_output) {
    if (!data || !dc_output) return false;
    
    memcpy(dc_output, data, sizeof(stm32_dc_output_data_t));
    
    // Validate data ranges
    if (dc_output->voltage > 100000 || // Max 100V
        dc_output->current > 100000) { // Max 100A
        return false;
    }
    
    return true;
}

// Parse alarm data
bool stm32_parse_alarm(const uint8_t* data, stm32_alarm_data_t* alarm) {
    if (!data || !alarm) return false;
    
    memcpy(alarm, data, sizeof(stm32_alarm_data_t));
    
    // Validate data ranges
    if (alarm->severity > 2 ||        // Max severity level 2
        alarm->timestamp > 0xFFFFFFFF) { // Max timestamp
        return false;
    }
    
    return true;
}

// Parse system status data
bool stm32_parse_system_status(const uint8_t* data, stm32_system_status_t* status) {
    if (!data || !status) return false;
    
    memcpy(status, data, sizeof(stm32_system_status_t));
    
    // Validate data ranges
    if (status->operation_mode > 2 || // Max mode 2
        status->system_load > 1000) { // Max 100.0%
        return false;
    }
    
    return true;
}

// Helper function to create packet
bool stm32_create_packet(uint8_t packet_type, const uint8_t* data, uint8_t data_length, stm32_packet_t* packet) {
    if (!packet || !data || data_length > STM32_MAX_PACKET_SIZE - 5) {
        return false;
    }
    
    packet->header_high = STM32_HEADER_HIGH;
    packet->header_low = STM32_HEADER_LOW;
    packet->packet_type = packet_type;
    packet->length = data_length;
    
    // Copy data
    memcpy(packet->data, data, data_length);
    
    // Calculate and set checksum
    packet->checksum = stm32_calculate_checksum((uint8_t*)packet, data_length + 4);
    
    return true;
}

// Debug function to print packet contents
void stm32_print_packet(const stm32_packet_t* packet) {
    if (!packet) return;
    
    printf("STM32 Packet:\n");
    printf("  Header: 0x%02X 0x%02X\n", packet->header_high, packet->header_low);
    printf("  Type: 0x%02X\n", packet->packet_type);
    printf("  Length: %d\n", packet->length);
    printf("  Data: ");
    
    for (uint8_t i = 0; i < packet->length; i++) {
        printf("0x%02X ", packet->data[i]);
    }
    printf("\n");
    printf("  Checksum: 0x%02X\n", packet->checksum);
}

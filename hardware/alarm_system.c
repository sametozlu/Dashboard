/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : alarm_system.c
  * @brief          : NetmonDashboard v3 - Alarm System Implementation
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#include "alarm_system.h"
#include "stm32_interface.h"
#include "main.h"
#include <string.h>
#include <stdio.h>

/* Private variables ---------------------------------------------------------*/
static alarm_entry_t active_alarms[MAX_ALARMS];
static alarm_history_t alarm_history[ALARM_HISTORY_SIZE];
static uint8_t active_alarm_count = 0;
static uint8_t history_count = 0;
static uint8_t history_index = 0;
static bool alarm_enabled[MAX_ALARMS];
static uint8_t alarm_severity[MAX_ALARMS];
static uint32_t alarm_threshold[MAX_ALARMS];

/* Private function prototypes -----------------------------------------------*/
static void add_to_history(uint32_t alarm_id, uint8_t severity, uint8_t action);
static void send_alarm_packet(uint32_t alarm_id, uint8_t severity, const char* message);
static void update_alarm_leds(void);

/* USER CODE BEGIN 0 */

/**
 * @brief Initialize alarm system
 */
void alarm_system_init(void) {
    // Clear all alarms
    memset(active_alarms, 0, sizeof(active_alarms));
    memset(alarm_history, 0, sizeof(alarm_history));
    
    active_alarm_count = 0;
    history_count = 0;
    history_index = 0;
    
    // Initialize alarm configuration
    for (int i = 0; i < MAX_ALARMS; i++) {
        alarm_enabled[i] = true;
        alarm_severity[i] = ALARM_SEVERITY_WARNING;
        alarm_threshold[i] = 0;
    }
    
    // Set specific alarm severities
    alarm_severity[ALARM_ID_VOLTAGE_LOW - 1000] = ALARM_SEVERITY_WARNING;
    alarm_severity[ALARM_ID_VOLTAGE_HIGH - 1000] = ALARM_SEVERITY_CRITICAL;
    alarm_severity[ALARM_ID_CURRENT_HIGH - 1000] = ALARM_SEVERITY_CRITICAL;
    alarm_severity[ALARM_ID_TEMP_HIGH - 1000] = ALARM_SEVERITY_WARNING;
    alarm_severity[ALARM_ID_POWER_OVERLOAD - 1000] = ALARM_SEVERITY_CRITICAL;
    alarm_severity[ALARM_ID_COMM_FAULT - 1000] = ALARM_SEVERITY_WARNING;
    alarm_severity[ALARM_ID_BATTERY_LOW - 1000] = ALARM_SEVERITY_WARNING;
    alarm_severity[ALARM_ID_BATTERY_FAULT - 1000] = ALARM_SEVERITY_CRITICAL;
    alarm_severity[ALARM_ID_AC_FAULT - 1000] = ALARM_SEVERITY_CRITICAL;
    alarm_severity[ALARM_ID_PHASE_LOSS - 1000] = ALARM_SEVERITY_CRITICAL;
    alarm_severity[ALARM_ID_DC_FAULT - 1000] = ALARM_SEVERITY_WARNING;
    alarm_severity[ALARM_ID_SYSTEM_FAULT - 1000] = ALARM_SEVERITY_EMERGENCY;
    alarm_severity[ALARM_ID_MAINTENANCE - 1000] = ALARM_SEVERITY_INFO;
    
    // Set thresholds
    alarm_threshold[ALARM_ID_VOLTAGE_LOW - 1000] = 45000;  // 45V
    alarm_threshold[ALARM_ID_VOLTAGE_HIGH - 1000] = 55000; // 55V
    alarm_threshold[ALARM_ID_CURRENT_HIGH - 1000] = 50000; // 50A
    alarm_threshold[ALARM_ID_TEMP_HIGH - 1000] = 60;       // 60°C
    alarm_threshold[ALARM_ID_POWER_OVERLOAD - 1000] = 2400000; // 2.4kW
    alarm_threshold[ALARM_ID_BATTERY_LOW - 1000] = 10000;  // 10V
}

/**
 * @brief Raise an alarm
 */
void alarm_system_raise_alarm(uint32_t alarm_id, uint8_t severity, uint8_t category, const char* message) {
    // Check if alarm is already active
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            return; // Alarm already active
        }
    }
    
    // Check if we have space for new alarm
    if (active_alarm_count >= MAX_ALARMS) {
        return; // No space for new alarm
    }
    
    // Add new alarm
    alarm_entry_t* alarm = &active_alarms[active_alarm_count];
    alarm->alarm_id = alarm_id;
    alarm->severity = severity;
    alarm->category = category;
    alarm->state = ALARM_STATE_ACTIVE;
    alarm->timestamp = HAL_GetTick() / 1000;
    alarm->acknowledged_by = 0;
    alarm->acknowledged_time = 0;
    alarm->cleared_time = 0;
    
    // Copy message
    strncpy((char*)alarm->message, message, ALARM_MESSAGE_MAX_LEN);
    alarm->message[ALARM_MESSAGE_MAX_LEN] = '\0';
    
    active_alarm_count++;
    
    // Add to history
    add_to_history(alarm_id, severity, 0); // 0 = Raised
    
    // Send alarm packet
    send_alarm_packet(alarm_id, severity, message);
    
    // Update LED indicators
    update_alarm_leds();
}

/**
 * @brief Acknowledge an alarm
 */
void alarm_system_acknowledge_alarm(uint32_t alarm_id, uint8_t user_id) {
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            active_alarms[i].state = ALARM_STATE_ACKNOWLEDGED;
            active_alarms[i].acknowledged_by = user_id;
            active_alarms[i].acknowledged_time = HAL_GetTick() / 1000;
            
            // Add to history
            add_to_history(alarm_id, active_alarms[i].severity, 1); // 1 = Acknowledged
            
            // Update LED indicators
            update_alarm_leds();
            break;
        }
    }
}

/**
 * @brief Clear an alarm
 */
void alarm_system_clear_alarm(uint32_t alarm_id) {
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            // Add to history
            add_to_history(alarm_id, active_alarms[i].severity, 2); // 2 = Cleared
            
            // Remove alarm from active list
            for (int j = i; j < active_alarm_count - 1; j++) {
                active_alarms[j] = active_alarms[j + 1];
            }
            active_alarm_count--;
            
            // Update LED indicators
            update_alarm_leds();
            break;
        }
    }
}

/**
 * @brief Clear all alarms
 */
void alarm_system_clear_all_alarms(void) {
    for (int i = 0; i < active_alarm_count; i++) {
        add_to_history(active_alarms[i].alarm_id, active_alarms[i].severity, 2); // 2 = Cleared
    }
    
    active_alarm_count = 0;
    memset(active_alarms, 0, sizeof(active_alarms));
    
    // Update LED indicators
    update_alarm_leds();
}

/**
 * @brief Check if alarm is active
 */
bool alarm_system_is_alarm_active(uint32_t alarm_id) {
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            return true;
        }
    }
    return false;
}

/**
 * @brief Get active alarm count
 */
uint8_t alarm_system_get_active_alarm_count(void) {
    return active_alarm_count;
}

/**
 * @brief Get critical alarm count
 */
uint8_t alarm_system_get_critical_alarm_count(void) {
    uint8_t count = 0;
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].severity >= ALARM_SEVERITY_CRITICAL) {
            count++;
        }
    }
    return count;
}

/**
 * @brief Get active alarms
 */
void alarm_system_get_active_alarms(alarm_entry_t* alarms, uint8_t* count) {
    *count = active_alarm_count;
    if (alarms != NULL) {
        memcpy(alarms, active_alarms, sizeof(alarm_entry_t) * active_alarm_count);
    }
}

/**
 * @brief Get alarm history
 */
void alarm_system_get_alarm_history(alarm_history_t* history, uint8_t* count) {
    *count = history_count;
    if (history != NULL) {
        memcpy(history, alarm_history, sizeof(alarm_history_t) * history_count);
    }
}

/**
 * @brief Check power module alarms
 */
void alarm_system_check_power_alarms(stm32_power_module_data_t* modules, uint8_t count) {
    for (int i = 0; i < count; i++) {
        stm32_power_module_data_t* module = &modules[i];
        
        // Voltage alarms
        if (module->voltage < alarm_threshold[ALARM_ID_VOLTAGE_LOW - 1000]) {
            if (!alarm_system_is_alarm_active(ALARM_ID_VOLTAGE_LOW + i)) {
                char message[8];
                snprintf(message, sizeof(message), "V_LOW_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_VOLTAGE_LOW + i, ALARM_SEVERITY_WARNING, ALARM_CATEGORY_POWER, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_VOLTAGE_LOW + i)) {
                alarm_system_clear_alarm(ALARM_ID_VOLTAGE_LOW + i);
            }
        }
        
        if (module->voltage > alarm_threshold[ALARM_ID_VOLTAGE_HIGH - 1000]) {
            if (!alarm_system_is_alarm_active(ALARM_ID_VOLTAGE_HIGH + i)) {
                char message[8];
                snprintf(message, sizeof(message), "V_HIGH_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_VOLTAGE_HIGH + i, ALARM_SEVERITY_CRITICAL, ALARM_CATEGORY_POWER, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_VOLTAGE_HIGH + i)) {
                alarm_system_clear_alarm(ALARM_ID_VOLTAGE_HIGH + i);
            }
        }
        
        // Current alarms
        if (module->current > alarm_threshold[ALARM_ID_CURRENT_HIGH - 1000]) {
            if (!alarm_system_is_alarm_active(ALARM_ID_CURRENT_HIGH + i)) {
                char message[8];
                snprintf(message, sizeof(message), "I_HIGH_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_CURRENT_HIGH + i, ALARM_SEVERITY_CRITICAL, ALARM_CATEGORY_POWER, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_CURRENT_HIGH + i)) {
                alarm_system_clear_alarm(ALARM_ID_CURRENT_HIGH + i);
            }
        }
        
        // Temperature alarms
        if (module->temperature > alarm_threshold[ALARM_ID_TEMP_HIGH - 1000]) {
            if (!alarm_system_is_alarm_active(ALARM_ID_TEMP_HIGH + i)) {
                char message[8];
                snprintf(message, sizeof(message), "T_HIGH_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_TEMP_HIGH + i, ALARM_SEVERITY_WARNING, ALARM_CATEGORY_TEMP, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_TEMP_HIGH + i)) {
                alarm_system_clear_alarm(ALARM_ID_TEMP_HIGH + i);
            }
        }
        
        // Power overload alarms
        if (module->power > alarm_threshold[ALARM_ID_POWER_OVERLOAD - 1000]) {
            if (!alarm_system_is_alarm_active(ALARM_ID_POWER_OVERLOAD + i)) {
                char message[8];
                snprintf(message, sizeof(message), "P_OVER_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_POWER_OVERLOAD + i, ALARM_SEVERITY_CRITICAL, ALARM_CATEGORY_POWER, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_POWER_OVERLOAD + i)) {
                alarm_system_clear_alarm(ALARM_ID_POWER_OVERLOAD + i);
            }
        }
    }
}

/**
 * @brief Check battery alarms
 */
void alarm_system_check_battery_alarms(stm32_battery_data_t* batteries, uint8_t count) {
    for (int i = 0; i < count; i++) {
        stm32_battery_data_t* battery = &batteries[i];
        
        // Battery low voltage
        if (battery->voltage < alarm_threshold[ALARM_ID_BATTERY_LOW - 1000]) {
            if (!alarm_system_is_alarm_active(ALARM_ID_BATTERY_LOW + i)) {
                char message[8];
                snprintf(message, sizeof(message), "BAT_LOW_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_BATTERY_LOW + i, ALARM_SEVERITY_WARNING, ALARM_CATEGORY_BATTERY, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_BATTERY_LOW + i)) {
                alarm_system_clear_alarm(ALARM_ID_BATTERY_LOW + i);
            }
        }
        
        // Battery fault
        if (battery->capacityPercent < 10) {
            if (!alarm_system_is_alarm_active(ALARM_ID_BATTERY_FAULT + i)) {
                char message[8];
                snprintf(message, sizeof(message), "BAT_FAULT_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_BATTERY_FAULT + i, ALARM_SEVERITY_CRITICAL, ALARM_CATEGORY_BATTERY, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_BATTERY_FAULT + i)) {
                alarm_system_clear_alarm(ALARM_ID_BATTERY_FAULT + i);
            }
        }
    }
}

/**
 * @brief Check AC input alarms
 */
void alarm_system_check_ac_alarms(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    for (int i = 0; i < count; i++) {
        stm32_ac_input_data_t* ac = &ac_inputs[i];
        
        // AC fault (voltage out of range)
        if (ac->voltage < 2000 || ac->voltage > 2500) { // 200V - 250V
            if (!alarm_system_is_alarm_active(ALARM_ID_AC_FAULT + i)) {
                char message[8];
                snprintf(message, sizeof(message), "AC_FAULT_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_AC_FAULT + i, ALARM_SEVERITY_CRITICAL, ALARM_CATEGORY_AC, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_AC_FAULT + i)) {
                alarm_system_clear_alarm(ALARM_ID_AC_FAULT + i);
            }
        }
        
        // Phase loss (frequency out of range)
        if (ac->frequency < 450 || ac->frequency > 550) { // 45Hz - 55Hz
            if (!alarm_system_is_alarm_active(ALARM_ID_PHASE_LOSS + i)) {
                char message[8];
                snprintf(message, sizeof(message), "PHASE_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_PHASE_LOSS + i, ALARM_SEVERITY_CRITICAL, ALARM_CATEGORY_AC, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_PHASE_LOSS + i)) {
                alarm_system_clear_alarm(ALARM_ID_PHASE_LOSS + i);
            }
        }
    }
}

/**
 * @brief Check DC output alarms
 */
void alarm_system_check_dc_alarms(stm32_dc_output_data_t* dc_outputs, uint8_t count) {
    for (int i = 0; i < count; i++) {
        stm32_dc_output_data_t* dc = &dc_outputs[i];
        
        // DC fault (voltage out of range)
        if (dc->enabled && (dc->voltage < 45000 || dc->voltage > 55000)) { // 45V - 55V
            if (!alarm_system_is_alarm_active(ALARM_ID_DC_FAULT + i)) {
                char message[8];
                snprintf(message, sizeof(message), "DC_FAULT_%d", i + 1);
                alarm_system_raise_alarm(ALARM_ID_DC_FAULT + i, ALARM_SEVERITY_WARNING, ALARM_CATEGORY_DC, message);
            }
        } else {
            if (alarm_system_is_alarm_active(ALARM_ID_DC_FAULT + i)) {
                alarm_system_clear_alarm(ALARM_ID_DC_FAULT + i);
            }
        }
    }
}

/**
 * @brief Check system alarms
 */
void alarm_system_check_system_alarms(stm32_system_status_t* status) {
    // System fault (communication timeout, etc.)
    if (status->uptimeSeconds > 0 && status->systemLoad > 950) { // 95% load
        if (!alarm_system_is_alarm_active(ALARM_ID_SYSTEM_FAULT)) {
            alarm_system_raise_alarm(ALARM_ID_SYSTEM_FAULT, ALARM_SEVERITY_EMERGENCY, ALARM_CATEGORY_SYSTEM, "SYS_FAULT");
        }
    } else {
        if (alarm_system_is_alarm_active(ALARM_ID_SYSTEM_FAULT)) {
            alarm_system_clear_alarm(ALARM_ID_SYSTEM_FAULT);
        }
    }
}

/**
 * @brief Set alarm enabled/disabled
 */
void alarm_system_set_alarm_enabled(uint32_t alarm_id, bool enabled) {
    if (alarm_id >= 1000 && alarm_id < 1000 + MAX_ALARMS) {
        alarm_enabled[alarm_id - 1000] = enabled;
    }
}

/**
 * @brief Set alarm severity
 */
void alarm_system_set_alarm_severity(uint32_t alarm_id, uint8_t severity) {
    if (alarm_id >= 1000 && alarm_id < 1000 + MAX_ALARMS) {
        alarm_severity[alarm_id - 1000] = severity;
    }
}

/**
 * @brief Set alarm threshold
 */
void alarm_system_set_alarm_threshold(uint32_t alarm_id, uint32_t threshold) {
    if (alarm_id >= 1000 && alarm_id < 1000 + MAX_ALARMS) {
        alarm_threshold[alarm_id - 1000] = threshold;
    }
}

/**
 * @brief Get alarm enabled status
 */
bool alarm_system_get_alarm_enabled(uint32_t alarm_id) {
    if (alarm_id >= 1000 && alarm_id < 1000 + MAX_ALARMS) {
        return alarm_enabled[alarm_id - 1000];
    }
    return false;
}

/**
 * @brief Get alarm severity
 */
uint8_t alarm_system_get_alarm_severity(uint32_t alarm_id) {
    if (alarm_id >= 1000 && alarm_id < 1000 + MAX_ALARMS) {
        return alarm_severity[alarm_id - 1000];
    }
    return ALARM_SEVERITY_INFO;
}

/**
 * @brief Get alarm threshold
 */
uint32_t alarm_system_get_alarm_threshold(uint32_t alarm_id) {
    if (alarm_id >= 1000 && alarm_id < 1000 + MAX_ALARMS) {
        return alarm_threshold[alarm_id - 1000];
    }
    return 0;
}

/**
 * @brief Send alarm notification
 */
void alarm_system_send_alarm_notification(uint32_t alarm_id) {
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            send_alarm_packet(alarm_id, active_alarms[i].severity, (char*)active_alarms[i].message);
            break;
        }
    }
}

/**
 * @brief Send alarm summary
 */
void alarm_system_send_alarm_summary(void) {
    // Send summary packet with all active alarms
    stm32_packet_t packet;
    packet.header_high = 0xAA;
    packet.header_low = 0x55;
    packet.type = 0x08; // Alarm summary type
    packet.length = sizeof(stm32_alarm_data_t) * active_alarm_count;
    
    // Copy alarm data
    for (int i = 0; i < active_alarm_count; i++) {
        stm32_alarm_data_t* alarm_data = (stm32_alarm_data_t*)(packet.data + i * sizeof(stm32_alarm_data_t));
        alarm_data->alarm_id = active_alarms[i].alarm_id;
        alarm_data->severity = active_alarms[i].severity;
        alarm_data->timestamp = active_alarms[i].timestamp;
        alarm_data->is_active = 1;
        strncpy((char*)alarm_data->message, (char*)active_alarms[i].message, 7);
        alarm_data->message[7] = '\0';
    }
    
    // Calculate checksum
    packet.checksum = calculate_checksum((uint8_t*)&packet, packet.length + 4);
    
    // Send packet
    HAL_UART_Transmit(&huart1, (uint8_t*)&packet, packet.length + 5, 100);
}

/**
 * @brief Send alarm history
 */
void alarm_system_send_alarm_history(uint32_t start_time, uint32_t end_time) {
    // Implementation for sending alarm history
    // This would send historical alarm data within the specified time range
}

/**
 * @brief Save alarms to flash
 */
void alarm_system_save_alarms_to_flash(void) {
    // Implementation for saving alarm configuration to flash memory
    // This would save alarm thresholds, severities, and enabled states
}

/**
 * @brief Load alarms from flash
 */
void alarm_system_load_alarms_from_flash(void) {
    // Implementation for loading alarm configuration from flash memory
    // This would restore alarm thresholds, severities, and enabled states
}

/**
 * @brief Clear alarm history
 */
void alarm_system_clear_alarm_history(void) {
    history_count = 0;
    history_index = 0;
    memset(alarm_history, 0, sizeof(alarm_history));
}

/**
 * @brief Get severity string
 */
const char* alarm_system_get_severity_string(uint8_t severity) {
    switch (severity) {
        case ALARM_SEVERITY_INFO: return "INFO";
        case ALARM_SEVERITY_WARNING: return "WARNING";
        case ALARM_SEVERITY_CRITICAL: return "CRITICAL";
        case ALARM_SEVERITY_EMERGENCY: return "EMERGENCY";
        default: return "UNKNOWN";
    }
}

/**
 * @brief Get category string
 */
const char* alarm_system_get_category_string(uint8_t category) {
    switch (category) {
        case ALARM_CATEGORY_POWER: return "POWER";
        case ALARM_CATEGORY_BATTERY: return "BATTERY";
        case ALARM_CATEGORY_AC: return "AC";
        case ALARM_CATEGORY_DC: return "DC";
        case ALARM_CATEGORY_SYSTEM: return "SYSTEM";
        case ALARM_CATEGORY_COMM: return "COMM";
        case ALARM_CATEGORY_TEMP: return "TEMP";
        case ALARM_CATEGORY_MAINT: return "MAINT";
        default: return "UNKNOWN";
    }
}

/**
 * @brief Get state string
 */
const char* alarm_system_get_state_string(uint8_t state) {
    switch (state) {
        case ALARM_STATE_INACTIVE: return "INACTIVE";
        case ALARM_STATE_ACTIVE: return "ACTIVE";
        case ALARM_STATE_ACKNOWLEDGED: return "ACKNOWLEDGED";
        case ALARM_STATE_CLEARED: return "CLEARED";
        default: return "UNKNOWN";
    }
}

/**
 * @brief Get alarm duration
 */
uint32_t alarm_system_get_alarm_duration(uint32_t alarm_id) {
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            return (HAL_GetTick() / 1000) - active_alarms[i].timestamp;
        }
    }
    return 0;
}

/**
 * @brief Check if alarm is acknowledged
 */
bool alarm_system_is_alarm_acknowledged(uint32_t alarm_id) {
    for (int i = 0; i < active_alarm_count; i++) {
        if (active_alarms[i].alarm_id == alarm_id) {
            return active_alarms[i].state == ALARM_STATE_ACKNOWLEDGED;
        }
    }
    return false;
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Add entry to alarm history
 */
static void add_to_history(uint32_t alarm_id, uint8_t severity, uint8_t action) {
    if (history_count < ALARM_HISTORY_SIZE) {
        alarm_history[history_count].alarm_id = alarm_id;
        alarm_history[history_count].severity = severity;
        alarm_history[history_count].timestamp = HAL_GetTick() / 1000;
        alarm_history[history_count].action = action;
        history_count++;
    } else {
        // Ring buffer - overwrite oldest entry
        alarm_history[history_index].alarm_id = alarm_id;
        alarm_history[history_index].severity = severity;
        alarm_history[history_index].timestamp = HAL_GetTick() / 1000;
        alarm_history[history_index].action = action;
        history_index = (history_index + 1) % ALARM_HISTORY_SIZE;
    }
}

/**
 * @brief Send alarm packet via UART
 */
static void send_alarm_packet(uint32_t alarm_id, uint8_t severity, const char* message) {
    stm32_packet_t packet;
    packet.header_high = 0xAA;
    packet.header_low = 0x55;
    packet.type = 0x05; // Alarm packet type
    packet.length = sizeof(stm32_alarm_data_t);
    
    stm32_alarm_data_t* alarm_data = (stm32_alarm_data_t*)packet.data;
    alarm_data->alarm_id = alarm_id;
    alarm_data->severity = severity;
    alarm_data->timestamp = HAL_GetTick() / 1000;
    alarm_data->is_active = 1;
    strncpy((char*)alarm_data->message, message, 7);
    alarm_data->message[7] = '\0';
    
    // Calculate checksum
    packet.checksum = calculate_checksum((uint8_t*)&packet, packet.length + 4);
    
    // Send packet
    HAL_UART_Transmit(&huart1, (uint8_t*)&packet, packet.length + 5, 100);
}

/**
 * @brief Update alarm LED indicators
 */
static void update_alarm_leds(void) {
    uint8_t critical_count = alarm_system_get_critical_alarm_count();
    
    if (critical_count > 0) {
        // Blink alarm LED for critical alarms
        HAL_GPIO_TogglePin(ALARM_LED_PORT, ALARM_LED_PIN);
    } else if (active_alarm_count > 0) {
        // Solid alarm LED for non-critical alarms
        HAL_GPIO_WritePin(ALARM_LED_PORT, ALARM_LED_PIN, GPIO_PIN_SET);
    } else {
        // Turn off alarm LED
        HAL_GPIO_WritePin(ALARM_LED_PORT, ALARM_LED_PIN, GPIO_PIN_RESET);
    }
    
    // Status LED indicates system health
    if (active_alarm_count == 0) {
        // Solid green for healthy system
        HAL_GPIO_WritePin(STATUS_LED_PORT, STATUS_LED_PIN, GPIO_PIN_SET);
    } else {
        // Blink status LED for any alarms
        HAL_GPIO_TogglePin(STATUS_LED_PORT, STATUS_LED_PIN);
    }
}

/* USER CODE END 0 */

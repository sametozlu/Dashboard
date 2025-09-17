/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : safety_system.c
  * @brief          : NetmonDashboard v3 - Safety System Implementation
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#include "safety_system.h"
#include "stm32_interface.h"
#include "main.h"
#include <string.h>
#include <stdio.h>

/* Private variables ---------------------------------------------------------*/
static uint8_t safety_state = SAFETY_STATE_NORMAL;
static uint8_t warning_count = 0;
static uint8_t critical_count = 0;
static uint32_t last_check_time = 0;
static uint32_t uptime_start = 0;
static bool last_check_results[6] = {true, true, true, true, true, true};
static char last_warning_message[64] = "";
static uint16_t voltage_min_mv = VOLTAGE_CRITICAL_LOW_MV;
static uint16_t voltage_max_mv = VOLTAGE_CRITICAL_HIGH_MV;
static uint16_t current_max_ma = CURRENT_CRITICAL_HIGH_MA;
static uint8_t temperature_max_c = TEMP_CRITICAL_HIGH_C;
static uint32_t power_max_mw = POWER_CRITICAL_HIGH_MW;

/* Private function prototypes -----------------------------------------------*/
static void update_safety_state(void);
static void log_safety_event(uint8_t check_type, bool passed, const char* message);

/* USER CODE BEGIN 0 */

/**
 * @brief Initialize safety system
 */
void safety_system_init(void) {
    safety_state = SAFETY_STATE_NORMAL;
    warning_count = 0;
    critical_count = 0;
    last_check_time = 0;
    uptime_start = HAL_GetTick();
    
    // Initialize all check results as safe
    for (int i = 0; i < 6; i++) {
        last_check_results[i] = true;
    }
    
    // Clear warning message
    memset(last_warning_message, 0, sizeof(last_warning_message));
    
    // Set default safety thresholds
    voltage_min_mv = VOLTAGE_CRITICAL_LOW_MV;
    voltage_max_mv = VOLTAGE_CRITICAL_HIGH_MV;
    current_max_ma = CURRENT_CRITICAL_HIGH_MA;
    temperature_max_c = TEMP_CRITICAL_HIGH_C;
    power_max_mw = POWER_CRITICAL_HIGH_MW;
}

/**
 * @brief Check all safety parameters
 */
void safety_system_check_all(void) {
    uint32_t current_time = HAL_GetTick();
    
    // Check if enough time has passed since last check
    if (current_time - last_check_time < SAFETY_CHECK_INTERVAL) {
        return;
    }
    
    last_check_time = current_time;
    
    // Perform all safety checks
    bool voltage_safe = safety_system_check_voltage(NULL, 0);
    bool current_safe = safety_system_check_current(NULL, 0);
    bool temperature_safe = safety_system_check_temperature(NULL, 0);
    bool power_safe = safety_system_check_power(NULL, 0);
    bool communication_safe = safety_system_check_communication();
    bool system_safe = safety_system_check_system_health();
    
    // Store results
    last_check_results[0] = voltage_safe;
    last_check_results[1] = current_safe;
    last_check_results[2] = temperature_safe;
    last_check_results[3] = power_safe;
    last_check_results[4] = communication_safe;
    last_check_results[5] = system_safe;
    
    // Update safety state
    update_safety_state();
}

/**
 * @brief Get current safety state
 */
uint8_t safety_system_get_state(void) {
    return safety_state;
}

/**
 * @brief Check if system is safe
 */
bool safety_system_is_safe(void) {
    return safety_state == SAFETY_STATE_NORMAL || safety_state == SAFETY_STATE_WARNING;
}

/**
 * @brief Emergency shutdown
 */
void safety_system_emergency_shutdown(void) {
    safety_state = SAFETY_STATE_EMERGENCY;
    
    // Shutdown all modules
    safety_system_shutdown_all_modules();
    
    // Log emergency event
    log_safety_event(SAFETY_CHECK_SYSTEM, false, "EMERGENCY SHUTDOWN ACTIVATED");
    
    // Set critical count
    critical_count++;
}

/**
 * @brief Reset safety system
 */
void safety_system_reset(void) {
    safety_state = SAFETY_STATE_NORMAL;
    warning_count = 0;
    critical_count = 0;
    
    // Reset all check results
    for (int i = 0; i < 6; i++) {
        last_check_results[i] = true;
    }
    
    // Clear warning message
    memset(last_warning_message, 0, sizeof(last_warning_message));
}

/**
 * @brief Check voltage safety
 */
bool safety_system_check_voltage(stm32_power_module_data_t* modules, uint8_t count) {
    if (modules == NULL || count == 0) {
        // Simulate voltage check for demo
        static uint16_t simulated_voltage = 53000; // 53V
        static int8_t variation = 1;
        
        simulated_voltage += variation;
        if (simulated_voltage > 55000 || simulated_voltage < 45000) {
            variation = -variation;
        }
        
        bool safe = (simulated_voltage >= voltage_min_mv && simulated_voltage <= voltage_max_mv);
        
        if (!safe) {
            char message[64];
            snprintf(message, sizeof(message), "Voltage out of range: %d mV", simulated_voltage);
            safety_system_issue_warning(SAFETY_CHECK_VOLTAGE, message);
        }
        
        return safe;
    }
    
    // Check actual module voltages
    for (int i = 0; i < count; i++) {
        if (modules[i].voltage < voltage_min_mv || modules[i].voltage > voltage_max_mv) {
            char message[64];
            snprintf(message, sizeof(message), "Module %d voltage unsafe: %d mV", 
                    modules[i].moduleId, modules[i].voltage);
            safety_system_issue_warning(SAFETY_CHECK_VOLTAGE, message);
            return false;
        }
    }
    
    return true;
}

/**
 * @brief Check current safety
 */
bool safety_system_check_current(stm32_power_module_data_t* modules, uint8_t count) {
    if (modules == NULL || count == 0) {
        // Simulate current check for demo
        static uint16_t simulated_current = 25000; // 25A
        static int8_t variation = 2;
        
        simulated_current += variation;
        if (simulated_current > 30000 || simulated_current < 20000) {
            variation = -variation;
        }
        
        bool safe = (simulated_current <= current_max_ma);
        
        if (!safe) {
            char message[64];
            snprintf(message, sizeof(message), "Current too high: %d mA", simulated_current);
            safety_system_issue_warning(SAFETY_CHECK_CURRENT, message);
        }
        
        return safe;
    }
    
    // Check actual module currents
    for (int i = 0; i < count; i++) {
        if (modules[i].current > current_max_ma) {
            char message[64];
            snprintf(message, sizeof(message), "Module %d current too high: %d mA", 
                    modules[i].moduleId, modules[i].current);
            safety_system_issue_warning(SAFETY_CHECK_CURRENT, message);
            return false;
        }
    }
    
    return true;
}

/**
 * @brief Check temperature safety
 */
bool safety_system_check_temperature(stm32_power_module_data_t* modules, uint8_t count) {
    if (modules == NULL || count == 0) {
        // Simulate temperature check for demo
        static uint8_t simulated_temp = 45; // 45°C
        static int8_t variation = 1;
        
        simulated_temp += variation;
        if (simulated_temp > 55 || simulated_temp < 35) {
            variation = -variation;
        }
        
        bool safe = (simulated_temp <= temperature_max_c);
        
        if (!safe) {
            char message[64];
            snprintf(message, sizeof(message), "Temperature too high: %d°C", simulated_temp);
            safety_system_issue_warning(SAFETY_CHECK_TEMPERATURE, message);
        }
        
        return safe;
    }
    
    // Check actual module temperatures
    for (int i = 0; i < count; i++) {
        if (modules[i].temperature > temperature_max_c) {
            char message[64];
            snprintf(message, sizeof(message), "Module %d temperature too high: %d°C", 
                    modules[i].moduleId, modules[i].temperature);
            safety_system_issue_warning(SAFETY_CHECK_TEMPERATURE, message);
            return false;
        }
    }
    
    return true;
}

/**
 * @brief Check power safety
 */
bool safety_system_check_power(stm32_power_module_data_t* modules, uint8_t count) {
    if (modules == NULL || count == 0) {
        // Simulate power check for demo
        static uint32_t simulated_power = 1200000; // 1.2kW
        static int32_t variation = 50000;
        
        simulated_power += variation;
        if (simulated_power > 1500000 || simulated_power < 900000) {
            variation = -variation;
        }
        
        bool safe = (simulated_power <= power_max_mw);
        
        if (!safe) {
            char message[64];
            snprintf(message, sizeof(message), "Power too high: %d mW", simulated_power);
            safety_system_issue_warning(SAFETY_CHECK_POWER, message);
        }
        
        return safe;
    }
    
    // Check actual module powers
    for (int i = 0; i < count; i++) {
        if (modules[i].power > power_max_mw) {
            char message[64];
            snprintf(message, sizeof(message), "Module %d power too high: %d mW", 
                    modules[i].moduleId, modules[i].power);
            safety_system_issue_warning(SAFETY_CHECK_POWER, message);
            return false;
        }
    }
    
    return true;
}

/**
 * @brief Check communication safety
 */
bool safety_system_check_communication(void) {
    // Simulate communication check for demo
    static uint32_t last_comm_time = 0;
    uint32_t current_time = HAL_GetTick();
    
    // Simulate occasional communication issues
    if (current_time - last_comm_time > 30000) { // Every 30 seconds
        last_comm_time = current_time;
        
        // 5% chance of communication failure
        if ((rand() % 100) < 5) {
            safety_system_issue_warning(SAFETY_CHECK_COMMUNICATION, "Communication timeout detected");
            return false;
        }
    }
    
    return true;
}

/**
 * @brief Check system health
 */
bool safety_system_check_system_health(void) {
    // Simulate system health check for demo
    static uint32_t last_health_check = 0;
    uint32_t current_time = HAL_GetTick();
    
    if (current_time - last_health_check > 60000) { // Every minute
        last_health_check = current_time;
        
        // Check if any critical failures occurred
        if (critical_count > 5) {
            safety_system_issue_warning(SAFETY_CHECK_SYSTEM, "Too many critical failures");
            return false;
        }
        
        // Check uptime
        uint32_t uptime = safety_system_get_uptime_seconds();
        if (uptime > 86400) { // 24 hours
            // Simulate occasional system issues after long uptime
            if ((rand() % 100) < 10) {
                safety_system_issue_warning(SAFETY_CHECK_SYSTEM, "System stability degraded");
                return false;
            }
        }
    }
    
    return true;
}

/**
 * @brief Issue safety warning
 */
void safety_system_issue_warning(uint8_t check_type, const char* message) {
    if (message != NULL) {
        strncpy(last_warning_message, message, sizeof(last_warning_message) - 1);
        last_warning_message[sizeof(last_warning_message) - 1] = '\0';
    }
    
    warning_count++;
    
    // Log the warning
    log_safety_event(check_type, false, message);
    
    // Update safety state if needed
    if (safety_state == SAFETY_STATE_NORMAL) {
        safety_state = SAFETY_STATE_WARNING;
    }
}

/**
 * @brief Reduce power of specific module
 */
void safety_system_reduce_power(uint8_t module_id, uint8_t percentage) {
    // This would interface with power management system
    // For now, just log the action
    char message[64];
    snprintf(message, sizeof(message), "Reducing power of module %d by %d%%", module_id, percentage);
    log_safety_event(SAFETY_CHECK_POWER, true, message);
}

/**
 * @brief Shutdown specific module
 */
void safety_system_shutdown_module(uint8_t module_id) {
    // This would interface with power management system
    // For now, just log the action
    char message[64];
    snprintf(message, sizeof(message), "Shutting down module %d", module_id);
    log_safety_event(SAFETY_CHECK_SYSTEM, true, message);
}

/**
 * @brief Shutdown all modules
 */
void safety_system_shutdown_all_modules(void) {
    // This would interface with power management system
    // For now, just log the action
    log_safety_event(SAFETY_CHECK_SYSTEM, true, "Shutting down all modules");
}

/**
 * @brief Set voltage limits
 */
void safety_system_set_voltage_limits(uint16_t min_mv, uint16_t max_mv) {
    voltage_min_mv = min_mv;
    voltage_max_mv = max_mv;
}

/**
 * @brief Set current limit
 */
void safety_system_set_current_limit(uint16_t max_ma) {
    current_max_ma = max_ma;
}

/**
 * @brief Set temperature limit
 */
void safety_system_set_temperature_limit(uint8_t max_c) {
    temperature_max_c = max_c;
}

/**
 * @brief Set power limit
 */
void safety_system_set_power_limit(uint32_t max_mw) {
    power_max_mw = max_mw;
}

/**
 * @brief Get warning count
 */
uint8_t safety_system_get_warning_count(void) {
    return warning_count;
}

/**
 * @brief Get critical count
 */
uint8_t safety_system_get_critical_count(void) {
    return critical_count;
}

/**
 * @brief Get last check result for specific type
 */
bool safety_system_get_last_check_result(uint8_t check_type) {
    if (check_type < 6) {
        return last_check_results[check_type];
    }
    return false;
}

/**
 * @brief Get last warning message
 */
const char* safety_system_get_last_warning_message(void) {
    return last_warning_message;
}

/**
 * @brief Get system uptime in seconds
 */
uint32_t safety_system_get_uptime_seconds(void) {
    return (HAL_GetTick() - uptime_start) / 1000;
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Update safety state based on check results
 */
static void update_safety_state(void) {
    uint8_t failed_checks = 0;
    
    // Count failed checks
    for (int i = 0; i < 6; i++) {
        if (!last_check_results[i]) {
            failed_checks++;
        }
    }
    
    // Determine new safety state
    if (failed_checks == 0) {
        safety_state = SAFETY_STATE_NORMAL;
    } else if (failed_checks <= 2) {
        safety_state = SAFETY_STATE_WARNING;
    } else if (failed_checks <= 4) {
        safety_state = SAFETY_STATE_CRITICAL;
        critical_count++;
    } else {
        safety_state = SAFETY_STATE_EMERGENCY;
        critical_count++;
    }
}

/**
 * @brief Log safety event
 */
static void log_safety_event(uint8_t check_type, bool passed, const char* message) {
    // This would typically log to a safety log file or system
    // For now, just update internal state
    
    if (!passed) {
        // Increment appropriate counters
        if (safety_state >= SAFETY_STATE_CRITICAL) {
            critical_count++;
        } else {
            warning_count++;
        }
    }
    
    // In a real system, this would write to flash memory or send to monitoring system
}

/* USER CODE END 0 */



/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : power_monitor.c
  * @brief          : NetmonDashboard v3 - Power Module Monitor Implementation
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#include "power_monitor.h"
#include "stm32_interface.h"
#include "sensor_library.h"
#include "main.h"
#include <math.h>

/* Private variables ---------------------------------------------------------*/
static voltage_divider_config_t voltage_sensors[MAX_POWER_MODULES];
static acs712_config_t current_sensors[MAX_POWER_MODULES];
static lm35_config_t temperature_sensors[MAX_POWER_MODULES];
static uint16_t voltage_limits_min[MAX_POWER_MODULES];
static uint16_t voltage_limits_max[MAX_POWER_MODULES];
static uint16_t current_limits[MAX_POWER_MODULES];
static uint8_t temperature_limits[MAX_POWER_MODULES];
static bool power_modules_enabled[MAX_POWER_MODULES];

/* Private function prototypes -----------------------------------------------*/
static void read_power_module_data(uint8_t module_id, stm32_power_module_data_t* module);
static void update_power_module_status(uint8_t module_id, stm32_power_module_data_t* module);
static bool check_voltage_faults(uint8_t module_id, uint16_t voltage_mv);
static bool check_current_faults(uint8_t module_id, uint16_t current_ma);
static bool check_temperature_faults(uint8_t module_id, uint8_t temperature_c);
static bool check_power_faults(uint8_t module_id, uint32_t power_mw);

/* USER CODE BEGIN 0 */

/**
 * @brief Initialize power monitor system
 */
void power_monitor_init(void) {
    // Initialize voltage sensors (ADC channels 0-3)
    for (int i = 0; i < MAX_POWER_MODULES; i++) {
        voltage_divider_init(&voltage_sensors[i], ADC_CHANNEL_0 + i, 47000, 3300); // 53V range
        voltage_limits_min[i] = VOLTAGE_MIN_MV;
        voltage_limits_max[i] = VOLTAGE_MAX_MV;
    }
    
    // Initialize current sensors (ADC channels 9-12)
    for (int i = 0; i < MAX_POWER_MODULES; i++) {
        acs712_init(&current_sensors[i], ADC_CHANNEL_9 + i, ACS712_30A_SENSITIVITY);
        current_limits[i] = CURRENT_MAX_MA;
    }
    
    // Initialize temperature sensors (ADC channels 11-14)
    for (int i = 0; i < MAX_POWER_MODULES; i++) {
        lm35_init(&temperature_sensors[i], ADC_CHANNEL_11 + i);
        temperature_limits[i] = TEMPERATURE_MAX_C;
    }
    
    // Enable all power modules by default
    for (int i = 0; i < MAX_POWER_MODULES; i++) {
        power_modules_enabled[i] = true;
    }
}

/**
 * @brief Read power module data
 */
void power_monitor_read_data(stm32_power_module_data_t* modules, uint8_t count) {
    for (int i = 0; i < count && i < MAX_POWER_MODULES; i++) {
        read_power_module_data(i, &modules[i]);
    }
}

/**
 * @brief Update power module status
 */
void power_monitor_update_status(stm32_power_module_data_t* modules, uint8_t count) {
    for (int i = 0; i < count && i < MAX_POWER_MODULES; i++) {
        update_power_module_status(i, &modules[i]);
    }
}

/**
 * @brief Check power module faults
 */
bool power_monitor_check_faults(stm32_power_module_data_t* module) {
    bool has_fault = false;
    module->fault_flags = 0;
    
    // Check voltage faults
    if (check_voltage_faults(module->moduleId - 1, module->voltage)) {
        module->fault_flags |= FAULT_VOLTAGE_LOW | FAULT_VOLTAGE_HIGH;
        has_fault = true;
    }
    
    // Check current faults
    if (check_current_faults(module->moduleId - 1, module->current)) {
        module->fault_flags |= FAULT_CURRENT_HIGH;
        has_fault = true;
    }
    
    // Check temperature faults
    if (check_temperature_faults(module->moduleId - 1, module->temperature)) {
        module->fault_flags |= FAULT_TEMPERATURE_HIGH;
        has_fault = true;
    }
    
    // Check power faults
    if (check_power_faults(module->moduleId - 1, module->power)) {
        module->fault_flags |= FAULT_POWER_OVERLOAD;
        has_fault = true;
    }
    
    // Update status flags
    if (has_fault) {
        module->status = STATUS_FAULT;
    } else if (power_modules_enabled[module->moduleId - 1]) {
        module->status = STATUS_ENABLED | STATUS_RUNNING;
    } else {
        module->status = STATUS_ENABLED;
    }
    
    return has_fault;
}

/**
 * @brief Handle power module command
 */
void power_monitor_handle_command(uint8_t module_id, uint8_t command, uint8_t parameter) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    switch (command) {
        case 0: // Get status
            // Status will be read in next data cycle
            break;
            
        case 1: // Set enabled/disabled
            power_modules_enabled[module_id] = (parameter != 0);
            if (power_modules_enabled[module_id]) {
                HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, RECTIFIER_1_ENABLE_PIN << module_id, GPIO_PIN_SET);
            } else {
                HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, RECTIFIER_1_ENABLE_PIN << module_id, GPIO_PIN_RESET);
            }
            break;
            
        case 2: // Start module
            power_modules_enabled[module_id] = true;
            HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, RECTIFIER_1_ENABLE_PIN << module_id, GPIO_PIN_SET);
            break;
            
        case 3: // Stop module
            power_modules_enabled[module_id] = false;
            HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, RECTIFIER_1_ENABLE_PIN << module_id, GPIO_PIN_RESET);
            break;
            
        default:
            break;
    }
}

/**
 * @brief Calculate power module efficiency
 */
float power_monitor_calculate_efficiency(stm32_power_module_data_t* module) {
    if (module->power == 0) return 0.0f;
    
    // Efficiency = (Output Power / Input Power) * 100
    // For rectifiers, input power is typically AC power
    // This is a simplified calculation
    uint32_t input_power = module->power + (module->power * 0.1f); // Assume 10% losses
    return ((float)module->power / input_power) * 100.0f;
}

/**
 * @brief Calculate power factor
 */
uint32_t power_monitor_calculate_power_factor(stm32_power_module_data_t* module) {
    // Power factor = Real Power / Apparent Power
    // For DC systems, power factor is typically 1.0 (100%)
    // This is a placeholder for AC power factor calculation
    return 1000; // 1.0 * 1000 for integer representation
}

/**
 * @brief Read voltage from ADC
 */
uint16_t power_monitor_read_voltage_adc(uint8_t channel) {
    if (channel >= MAX_POWER_MODULES) return 0;
    
    return voltage_divider_read_voltage_mv(&voltage_sensors[channel]);
}

/**
 * @brief Read current from ADC
 */
uint16_t power_monitor_read_current_adc(uint8_t channel) {
    if (channel >= MAX_POWER_MODULES) return 0;
    
    return (uint16_t)acs712_read_current_ma(&current_sensors[channel]);
}

/**
 * @brief Read temperature from ADC
 */
uint8_t power_monitor_read_temperature_adc(uint8_t channel) {
    if (channel >= MAX_POWER_MODULES) return 0;
    
    return (uint8_t)lm35_read_temperature(&temperature_sensors[channel]);
}

/**
 * @brief Calibrate voltage sensor
 */
void power_monitor_calibrate_voltage(uint8_t module_id, uint16_t reference_mv) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    voltage_divider_calibrate(&voltage_sensors[module_id], reference_mv / 1000.0f);
}

/**
 * @brief Calibrate current sensor
 */
void power_monitor_calibrate_current(uint8_t module_id, uint16_t reference_ma) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    acs712_calibrate(&current_sensors[module_id], reference_ma / 1000.0f);
}

/**
 * @brief Calibrate temperature sensor
 */
void power_monitor_calibrate_temperature(uint8_t module_id, uint8_t reference_c) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    lm35_calibrate(&temperature_sensors[module_id], reference_c);
}

/**
 * @brief Set voltage limits
 */
void power_monitor_set_voltage_limits(uint8_t module_id, uint16_t min_mv, uint16_t max_mv) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    voltage_limits_min[module_id] = min_mv;
    voltage_limits_max[module_id] = max_mv;
}

/**
 * @brief Set current limit
 */
void power_monitor_set_current_limit(uint8_t module_id, uint16_t max_ma) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    current_limits[module_id] = max_ma;
}

/**
 * @brief Set temperature limit
 */
void power_monitor_set_temperature_limit(uint8_t module_id, uint8_t max_c) {
    if (module_id >= MAX_POWER_MODULES) return;
    
    temperature_limits[module_id] = max_c;
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Read individual power module data
 */
static void read_power_module_data(uint8_t module_id, stm32_power_module_data_t* module) {
    if (module_id >= MAX_POWER_MODULES || module == NULL) return;
    
    // Read voltage
    module->voltage = voltage_divider_read_voltage_mv(&voltage_sensors[module_id]);
    
    // Read current
    module->current = (uint16_t)acs712_read_current_ma(&current_sensors[module_id]);
    
    // Read temperature
    module->temperature = (uint8_t)lm35_read_temperature(&temperature_sensors[module_id]);
    
    // Calculate power (P = V * I)
    module->power = (module->voltage * module->current) / 1000; // Convert to mW
    
    // Set module ID
    module->moduleId = module_id + 1;
    
    // Set active status
    module->isActive = power_modules_enabled[module_id];
    
    // Check for faults
    module->hasFault = power_monitor_check_faults(module);
}

/**
 * @brief Update power module status
 */
static void update_power_module_status(uint8_t module_id, stm32_power_module_data_t* module) {
    if (module_id >= MAX_POWER_MODULES || module == NULL) return;
    
    // Update status based on current state
    if (module->hasFault) {
        module->status = STATUS_FAULT;
    } else if (power_modules_enabled[module_id] && module->voltage > VOLTAGE_MIN_MV) {
        module->status = STATUS_ENABLED | STATUS_RUNNING;
    } else if (power_modules_enabled[module_id]) {
        module->status = STATUS_ENABLED;
    } else {
        module->status = 0;
    }
}

/**
 * @brief Check voltage faults
 */
static bool check_voltage_faults(uint8_t module_id, uint16_t voltage_mv) {
    if (module_id >= MAX_POWER_MODULES) return false;
    
    return (voltage_mv < voltage_limits_min[module_id] || 
            voltage_mv > voltage_limits_max[module_id]);
}

/**
 * @brief Check current faults
 */
static bool check_current_faults(uint8_t module_id, uint16_t current_ma) {
    if (module_id >= MAX_POWER_MODULES) return false;
    
    return (current_ma > current_limits[module_id]);
}

/**
 * @brief Check temperature faults
 */
static bool check_temperature_faults(uint8_t module_id, uint8_t temperature_c) {
    if (module_id >= MAX_POWER_MODULES) return false;
    
    return (temperature_c > temperature_limits[module_id]);
}

/**
 * @brief Check power faults
 */
static bool check_power_faults(uint8_t module_id, uint32_t power_mw) {
    if (module_id >= MAX_POWER_MODULES) return false;
    
    return (power_mw > POWER_MAX_MW);
}

/* USER CODE END 0 */

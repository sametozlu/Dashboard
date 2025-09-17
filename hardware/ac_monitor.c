/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : ac_monitor.c
  * @brief          : NetmonDashboard v3 - AC Input Monitor Implementation
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#include "ac_monitor.h"
#include "stm32_interface.h"
#include "sensor_library.h"
#include "main.h"
#include <math.h>

/* Private variables ---------------------------------------------------------*/
static voltage_divider_config_t voltage_sensors[MAX_AC_PHASES];
static acs712_config_t current_sensors[MAX_AC_PHASES];
static uint16_t voltage_limits_min[MAX_AC_PHASES];
static uint16_t voltage_limits_max[MAX_AC_PHASES];
static uint16_t current_limits[MAX_AC_PHASES];
static uint16_t frequency_limits_min[MAX_AC_PHASES];
static uint16_t frequency_limits_max[MAX_AC_PHASES];
static bool ac_phases_enabled[MAX_AC_PHASES];
static uint32_t phase_voltage_history[MAX_AC_PHASES][10]; // For frequency calculation
static uint8_t phase_history_index[MAX_AC_PHASES];

/* Private function prototypes -----------------------------------------------*/
static void read_ac_phase_data(uint8_t phase_id, stm32_ac_input_data_t* ac_input);
static void update_ac_phase_status(uint8_t phase_id, stm32_ac_input_data_t* ac_input);
static bool check_ac_voltage_faults(uint8_t phase_id, uint16_t voltage_10x);
static bool check_ac_current_faults(uint8_t phase_id, uint16_t current_10x);
static bool check_ac_frequency_faults(uint8_t phase_id, uint16_t frequency_10x);
static uint16_t calculate_frequency_from_voltage(uint8_t phase_id, uint16_t voltage_10x);
static uint32_t calculate_ac_power(uint16_t voltage_10x, uint16_t current_10x, float power_factor);

/* USER CODE BEGIN 0 */

/**
 * @brief Initialize AC monitor system
 */
void ac_monitor_init(void) {
    // Initialize voltage sensors (ADC channels 6-8)
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        voltage_divider_init(&voltage_sensors[i], ADC_CHANNEL_6 + i, 250000, 3300); // 250V range
        voltage_limits_min[i] = AC_VOLTAGE_MIN_10X;
        voltage_limits_max[i] = AC_VOLTAGE_MAX_10X;
    }
    
    // Initialize current sensors (ADC channels 13-15)
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        acs712_init(&current_sensors[i], ADC_CHANNEL_13 + i, ACS712_30A_SENSITIVITY);
        current_limits[i] = AC_CURRENT_MAX_10X;
    }
    
    // Initialize frequency limits
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        frequency_limits_min[i] = AC_FREQUENCY_MIN_10X;
        frequency_limits_max[i] = AC_FREQUENCY_MAX_10X;
        phase_history_index[i] = 0;
    }
    
    // Enable all AC phases by default
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        ac_phases_enabled[i] = true;
    }
}

/**
 * @brief Read AC input data
 */
void ac_monitor_read_data(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    for (int i = 0; i < count && i < MAX_AC_PHASES; i++) {
        read_ac_phase_data(i, &ac_inputs[i]);
    }
}

/**
 * @brief Update AC input status
 */
void ac_monitor_update_status(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    for (int i = 0; i < count && i < MAX_AC_PHASES; i++) {
        update_ac_phase_status(i, &ac_inputs[i]);
    }
}

/**
 * @brief Check AC input health
 */
bool ac_monitor_check_health(stm32_ac_input_data_t* ac_input) {
    if (ac_input == NULL) return false;
    
    uint8_t phase_id = ac_input->phaseId - 1;
    
    // Check voltage faults
    if (check_ac_voltage_faults(phase_id, ac_input->voltage)) {
        return false;
    }
    
    // Check current faults
    if (check_ac_current_faults(phase_id, ac_input->current)) {
        return false;
    }
    
    // Check frequency faults
    if (check_ac_frequency_faults(phase_id, ac_input->frequency)) {
        return false;
    }
    
    return true;
}

/**
 * @brief Handle AC input command
 */
void ac_monitor_handle_command(uint8_t phase_id, uint8_t command, uint8_t parameter) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    switch (command) {
        case 0: // Get status
            // Status will be read in next data cycle
            break;
            
        case 1: // Set enabled/disabled
            ac_phases_enabled[phase_id] = (parameter != 0);
            break;
            
        case 2: // Start phase
            ac_phases_enabled[phase_id] = true;
            break;
            
        case 3: // Stop phase
            ac_phases_enabled[phase_id] = false;
            break;
            
        default:
            break;
    }
}

/**
 * @brief Calculate power factor
 */
float ac_monitor_calculate_power_factor(stm32_ac_input_data_t* ac_input) {
    if (ac_input == NULL) return 0.0f;
    
    // Power factor = Real Power / Apparent Power
    // This is a simplified calculation
    uint32_t apparent_power = ac_input->voltage * ac_input->current / 10; // VA
    uint32_t real_power = ac_input->power; // W
    
    if (apparent_power > 0) {
        return (float)real_power / apparent_power;
    }
    
    return 1.0f; // Default power factor
}

/**
 * @brief Calculate total power
 */
uint32_t ac_monitor_calculate_total_power(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    uint32_t total_power = 0;
    
    for (int i = 0; i < count && i < MAX_AC_PHASES; i++) {
        total_power += ac_inputs[i].power;
    }
    
    return total_power;
}

/**
 * @brief Detect phase loss
 */
bool ac_monitor_detect_phase_loss(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    for (int i = 0; i < count && i < MAX_AC_PHASES; i++) {
        if (ac_inputs[i].voltage < AC_VOLTAGE_MIN_10X) {
            return true; // Phase loss detected
        }
    }
    return false;
}

/**
 * @brief Read voltage from ADC
 */
uint16_t ac_monitor_read_voltage_adc(uint8_t channel) {
    if (channel >= MAX_AC_PHASES) return 0;
    
    return voltage_divider_read_voltage_mv(&voltage_sensors[channel]) / 100; // Convert to V*10
}

/**
 * @brief Read current from ADC
 */
uint16_t ac_monitor_read_current_adc(uint8_t channel) {
    if (channel >= MAX_AC_PHASES) return 0;
    
    return (uint16_t)acs712_read_current_ma(&current_sensors[channel]) / 100; // Convert to A*10
}

/**
 * @brief Read frequency from ADC
 */
uint16_t ac_monitor_read_frequency_adc(uint8_t channel) {
    if (channel >= MAX_AC_PHASES) return 0;
    
    uint16_t voltage_10x = ac_monitor_read_voltage_adc(channel);
    return calculate_frequency_from_voltage(channel, voltage_10x);
}

/**
 * @brief Calibrate voltage sensor
 */
void ac_monitor_calibrate_voltage(uint8_t phase_id, uint16_t reference_10x) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    voltage_divider_calibrate(&voltage_sensors[phase_id], reference_10x / 10.0f);
}

/**
 * @brief Calibrate current sensor
 */
void ac_monitor_calibrate_current(uint8_t phase_id, uint16_t reference_10x) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    acs712_calibrate(&current_sensors[phase_id], reference_10x / 10.0f);
}

/**
 * @brief Calibrate frequency sensor
 */
void ac_monitor_calibrate_frequency(uint8_t phase_id, uint16_t reference_10x) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    // Frequency calibration is typically done by measuring known frequency
    // This is a placeholder for frequency calibration
}

/**
 * @brief Set voltage limits
 */
void ac_monitor_set_voltage_limits(uint8_t phase_id, uint16_t min_10x, uint16_t max_10x) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    voltage_limits_min[phase_id] = min_10x;
    voltage_limits_max[phase_id] = max_10x;
}

/**
 * @brief Set current limit
 */
void ac_monitor_set_current_limit(uint8_t phase_id, uint16_t max_10x) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    current_limits[phase_id] = max_10x;
}

/**
 * @brief Set frequency limits
 */
void ac_monitor_set_frequency_limits(uint8_t phase_id, uint16_t min_10x, uint16_t max_10x) {
    if (phase_id >= MAX_AC_PHASES) return;
    
    frequency_limits_min[phase_id] = min_10x;
    frequency_limits_max[phase_id] = max_10x;
}

/**
 * @brief Calculate real power
 */
uint32_t ac_monitor_calculate_real_power(stm32_ac_input_data_t* ac_input) {
    if (ac_input == NULL) return 0;
    
    return calculate_ac_power(ac_input->voltage, ac_input->current, 0.9f); // Assume 0.9 power factor
}

/**
 * @brief Calculate apparent power
 */
uint32_t ac_monitor_calculate_apparent_power(stm32_ac_input_data_t* ac_input) {
    if (ac_input == NULL) return 0;
    
    return ac_input->voltage * ac_input->current / 10; // VA
}

/**
 * @brief Calculate reactive power
 */
uint32_t ac_monitor_calculate_reactive_power(stm32_ac_input_data_t* ac_input) {
    if (ac_input == NULL) return 0;
    
    uint32_t apparent_power = ac_monitor_calculate_apparent_power(ac_input);
    uint32_t real_power = ac_monitor_calculate_real_power(ac_input);
    
    if (apparent_power > real_power) {
        return (uint32_t)sqrt((float)(apparent_power * apparent_power - real_power * real_power));
    }
    
    return 0;
}

/**
 * @brief Check phase balance
 */
bool ac_monitor_check_phase_balance(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    if (count < 3) return true; // Not enough phases to check balance
    
    uint16_t voltage_sum = 0;
    for (int i = 0; i < count; i++) {
        voltage_sum += ac_inputs[i].voltage;
    }
    
    uint16_t average_voltage = voltage_sum / count;
    
    // Check if any phase deviates more than 5% from average
    for (int i = 0; i < count; i++) {
        uint16_t deviation = abs(ac_inputs[i].voltage - average_voltage);
        if (deviation > (average_voltage * 5 / 100)) {
            return false; // Unbalanced
        }
    }
    
    return true; // Balanced
}

/**
 * @brief Calculate phase angle
 */
float ac_monitor_calculate_phase_angle(stm32_ac_input_data_t* ac_input) {
    if (ac_input == NULL) return 0.0f;
    
    // Phase angle calculation based on voltage and current
    // This is a simplified calculation
    float power_factor = ac_monitor_calculate_power_factor(ac_input);
    return acos(power_factor) * 180.0f / M_PI; // Convert to degrees
}

/**
 * @brief Detect phase reversal
 */
bool ac_monitor_detect_phase_reversal(stm32_ac_input_data_t* ac_inputs, uint8_t count) {
    if (count < 3) return false; // Need at least 3 phases
    
    // Check phase sequence (simplified)
    // In normal sequence: L1-L2-L3 should be 120° apart
    // This is a placeholder for phase reversal detection
    return false;
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Read individual AC phase data
 */
static void read_ac_phase_data(uint8_t phase_id, stm32_ac_input_data_t* ac_input) {
    if (phase_id >= MAX_AC_PHASES || ac_input == NULL) return;
    
    // Read voltage
    ac_input->voltage = voltage_divider_read_voltage_mv(&voltage_sensors[phase_id]) / 100; // Convert to V*10
    
    // Read current
    ac_input->current = (uint16_t)acs712_read_current_ma(&current_sensors[phase_id]) / 100; // Convert to A*10
    
    // Calculate frequency from voltage
    ac_input->frequency = calculate_frequency_from_voltage(phase_id, ac_input->voltage);
    
    // Calculate power
    ac_input->power = calculate_ac_power(ac_input->voltage, ac_input->current, 0.9f);
    
    // Set phase ID
    ac_input->phaseId = phase_id + 1;
    
    // Set normal status
    ac_input->isNormal = ac_monitor_check_health(ac_input);
}

/**
 * @brief Update AC phase status
 */
static void update_ac_phase_status(uint8_t phase_id, stm32_ac_input_data_t* ac_input) {
    if (phase_id >= MAX_AC_PHASES || ac_input == NULL) return;
    
    // Update status based on health and enabled state
    if (!ac_phases_enabled[phase_id]) {
        ac_input->isNormal = false;
    } else if (ac_monitor_check_health(ac_input)) {
        ac_input->isNormal = true;
    } else {
        ac_input->isNormal = false;
    }
}

/**
 * @brief Check AC voltage faults
 */
static bool check_ac_voltage_faults(uint8_t phase_id, uint16_t voltage_10x) {
    if (phase_id >= MAX_AC_PHASES) return false;
    
    return (voltage_10x < voltage_limits_min[phase_id] || 
            voltage_10x > voltage_limits_max[phase_id]);
}

/**
 * @brief Check AC current faults
 */
static bool check_ac_current_faults(uint8_t phase_id, uint16_t current_10x) {
    if (phase_id >= MAX_AC_PHASES) return false;
    
    return (current_10x > current_limits[phase_id]);
}

/**
 * @brief Check AC frequency faults
 */
static bool check_ac_frequency_faults(uint8_t phase_id, uint16_t frequency_10x) {
    if (phase_id >= MAX_AC_PHASES) return false;
    
    return (frequency_10x < frequency_limits_min[phase_id] || 
            frequency_10x > frequency_limits_max[phase_id]);
}

/**
 * @brief Calculate frequency from voltage
 */
static uint16_t calculate_frequency_from_voltage(uint8_t phase_id, uint16_t voltage_10x) {
    if (phase_id >= MAX_AC_PHASES) return AC_FREQUENCY_NOMINAL_10X;
    
    // Store voltage in history for frequency calculation
    phase_voltage_history[phase_id][phase_history_index[phase_id]] = voltage_10x;
    phase_history_index[phase_id] = (phase_history_index[phase_id] + 1) % 10;
    
    // Simple frequency calculation based on voltage variations
    // This is a placeholder - real implementation would use zero-crossing detection
    return AC_FREQUENCY_NOMINAL_10X; // 50Hz
}

/**
 * @brief Calculate AC power
 */
static uint32_t calculate_ac_power(uint16_t voltage_10x, uint16_t current_10x, float power_factor) {
    // P = V * I * cos(φ)
    uint32_t apparent_power = voltage_10x * current_10x / 10; // VA
    return (uint32_t)(apparent_power * power_factor); // W
}

/* USER CODE END 0 */

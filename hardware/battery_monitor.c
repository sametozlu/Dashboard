/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : battery_monitor.c
  * @brief          : NetmonDashboard v3 - Battery Monitor Implementation
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#include "battery_monitor.h"
#include "stm32_interface.h"
#include "sensor_library.h"
#include "main.h"
#include <math.h>

/* Private variables ---------------------------------------------------------*/
static voltage_divider_config_t voltage_sensors[MAX_BATTERIES];
static acs712_config_t current_sensors[MAX_BATTERIES];
static lm35_config_t temperature_sensors[MAX_BATTERIES];
static uint16_t voltage_limits_min[MAX_BATTERIES];
static uint16_t voltage_limits_max[MAX_BATTERIES];
static uint16_t current_limits[MAX_BATTERIES];
static uint8_t temperature_limits[MAX_BATTERIES];
static uint8_t battery_types[MAX_BATTERIES];
static bool battery_test_running[MAX_BATTERIES];
static uint8_t battery_test_state[MAX_BATTERIES];
static uint32_t battery_test_start_time[MAX_BATTERIES];
static uint32_t battery_cycle_count[MAX_BATTERIES];
static uint32_t battery_last_charge_time[MAX_BATTERIES];

/* Private function prototypes -----------------------------------------------*/
static void read_battery_data(uint8_t battery_id, stm32_battery_data_t* battery);
static void update_battery_status(uint8_t battery_id, stm32_battery_data_t* battery);
static uint8_t calculate_capacity_from_voltage(uint16_t voltage_mv, uint8_t battery_type);
static void update_battery_test(uint8_t battery_id, stm32_battery_data_t* battery);
static bool check_battery_health(uint8_t battery_id, stm32_battery_data_t* battery);

/* USER CODE BEGIN 0 */

/**
 * @brief Initialize battery monitor system
 */
void battery_monitor_init(void) {
    // Initialize voltage sensors (ADC channels 4-5)
    for (int i = 0; i < MAX_BATTERIES; i++) {
        voltage_divider_init(&voltage_sensors[i], ADC_CHANNEL_4 + i, 15000, 3300); // 15V range
        voltage_limits_min[i] = BATTERY_VOLTAGE_MIN_MV;
        voltage_limits_max[i] = BATTERY_VOLTAGE_MAX_MV;
    }
    
    // Initialize current sensors (ADC channels 10-11)
    for (int i = 0; i < MAX_BATTERIES; i++) {
        acs712_init(&current_sensors[i], ADC_CHANNEL_10 + i, ACS712_5A_SENSITIVITY);
        current_limits[i] = BATTERY_CURRENT_MAX_MA;
    }
    
    // Initialize temperature sensors (ADC channels 12-13)
    for (int i = 0; i < MAX_BATTERIES; i++) {
        lm35_init(&temperature_sensors[i], ADC_CHANNEL_12 + i);
        temperature_limits[i] = BATTERY_TEMP_MAX_C;
    }
    
    // Initialize battery types (default: Lead Acid)
    for (int i = 0; i < MAX_BATTERIES; i++) {
        battery_types[i] = BATTERY_TYPE_LEAD_ACID;
        battery_test_running[i] = false;
        battery_test_state[i] = TEST_STATE_IDLE;
        battery_cycle_count[i] = 0;
        battery_last_charge_time[i] = 0;
    }
}

/**
 * @brief Read battery data
 */
void battery_monitor_read_data(stm32_battery_data_t* batteries, uint8_t count) {
    for (int i = 0; i < count && i < MAX_BATTERIES; i++) {
        read_battery_data(i, &batteries[i]);
    }
}

/**
 * @brief Update battery status
 */
void battery_monitor_update_status(stm32_battery_data_t* batteries, uint8_t count) {
    for (int i = 0; i < count && i < MAX_BATTERIES; i++) {
        update_battery_status(i, &batteries[i]);
    }
}

/**
 * @brief Check battery health
 */
bool battery_monitor_check_health(stm32_battery_data_t* battery) {
    if (battery == NULL) return false;
    
    return check_battery_health(battery->batteryId - 1, battery);
}

/**
 * @brief Start battery test
 */
void battery_monitor_start_test(uint8_t battery_id) {
    if (battery_id >= MAX_BATTERIES) return;
    
    battery_test_running[battery_id] = true;
    battery_test_state[battery_id] = TEST_STATE_RUNNING;
    battery_test_start_time[battery_id] = HAL_GetTick() / 1000;
}

/**
 * @brief Stop battery test
 */
void battery_monitor_stop_test(uint8_t battery_id) {
    if (battery_id >= MAX_BATTERIES) return;
    
    battery_test_running[battery_id] = false;
    battery_test_state[battery_id] = TEST_STATE_IDLE;
}

/**
 * @brief Calculate battery capacity from voltage
 */
uint8_t battery_monitor_calculate_capacity(uint16_t voltage_mv, uint8_t battery_type) {
    return calculate_capacity_from_voltage(voltage_mv, battery_type);
}

/**
 * @brief Calculate remaining time
 */
float battery_monitor_calculate_remaining_time(stm32_battery_data_t* battery) {
    if (battery == NULL || battery->current == 0) return 0.0f;
    
    // Calculate remaining time based on current discharge rate
    // This is a simplified calculation
    float remaining_capacity_ah = (battery->capacityPercent / 100.0f) * 100.0f; // Assume 100Ah capacity
    float current_a = battery->current / 1000.0f;
    
    if (current_a > 0) {
        return remaining_capacity_ah / current_a; // Hours
    }
    
    return 0.0f;
}

/**
 * @brief Calculate cycle count
 */
uint32_t battery_monitor_calculate_cycle_count(stm32_battery_data_t* battery) {
    if (battery == NULL) return 0;
    
    return battery_cycle_count[battery->batteryId - 1];
}

/**
 * @brief Read voltage from ADC
 */
uint16_t battery_monitor_read_voltage_adc(uint8_t channel) {
    if (channel >= MAX_BATTERIES) return 0;
    
    return voltage_divider_read_voltage_mv(&voltage_sensors[channel]);
}

/**
 * @brief Read current from ADC
 */
uint16_t battery_monitor_read_current_adc(uint8_t channel) {
    if (channel >= MAX_BATTERIES) return 0;
    
    return (uint16_t)acs712_read_current_ma(&current_sensors[channel]);
}

/**
 * @brief Read temperature from ADC
 */
uint8_t battery_monitor_read_temperature_adc(uint8_t channel) {
    if (channel >= MAX_BATTERIES) return 0;
    
    return (uint8_t)lm35_read_temperature(&temperature_sensors[channel]);
}

/**
 * @brief Calibrate voltage sensor
 */
void battery_monitor_calibrate_voltage(uint8_t battery_id, uint16_t reference_mv) {
    if (battery_id >= MAX_BATTERIES) return;
    
    voltage_divider_calibrate(&voltage_sensors[battery_id], reference_mv / 1000.0f);
}

/**
 * @brief Calibrate current sensor
 */
void battery_monitor_calibrate_current(uint8_t battery_id, uint16_t reference_ma) {
    if (battery_id >= MAX_BATTERIES) return;
    
    acs712_calibrate(&current_sensors[battery_id], reference_ma / 1000.0f);
}

/**
 * @brief Calibrate temperature sensor
 */
void battery_monitor_calibrate_temperature(uint8_t battery_id, uint8_t reference_c) {
    if (battery_id >= MAX_BATTERIES) return;
    
    lm35_calibrate(&temperature_sensors[battery_id], reference_c);
}

/**
 * @brief Set voltage limits
 */
void battery_monitor_set_voltage_limits(uint8_t battery_id, uint16_t min_mv, uint16_t max_mv) {
    if (battery_id >= MAX_BATTERIES) return;
    
    voltage_limits_min[battery_id] = min_mv;
    voltage_limits_max[battery_id] = max_mv;
}

/**
 * @brief Set current limit
 */
void battery_monitor_set_current_limit(uint8_t battery_id, uint16_t max_ma) {
    if (battery_id >= MAX_BATTERIES) return;
    
    current_limits[battery_id] = max_ma;
}

/**
 * @brief Set temperature limit
 */
void battery_monitor_set_temperature_limit(uint8_t battery_id, uint8_t max_c) {
    if (battery_id >= MAX_BATTERIES) return;
    
    temperature_limits[battery_id] = max_c;
}

/**
 * @brief Set battery type
 */
void battery_monitor_set_battery_type(uint8_t battery_id, uint8_t type) {
    if (battery_id >= MAX_BATTERIES) return;
    
    battery_types[battery_id] = type;
}

/**
 * @brief Start capacity test
 */
void battery_monitor_start_capacity_test(uint8_t battery_id) {
    if (battery_id >= MAX_BATTERIES) return;
    
    battery_test_running[battery_id] = true;
    battery_test_state[battery_id] = TEST_STATE_RUNNING;
    battery_test_start_time[battery_id] = HAL_GetTick() / 1000;
}

/**
 * @brief Start impedance test
 */
void battery_monitor_start_impedance_test(uint8_t battery_id) {
    if (battery_id >= MAX_BATTERIES) return;
    
    battery_test_running[battery_id] = true;
    battery_test_state[battery_id] = TEST_STATE_RUNNING;
    battery_test_start_time[battery_id] = HAL_GetTick() / 1000;
}

/**
 * @brief Start voltage test
 */
void battery_monitor_start_voltage_test(uint8_t battery_id) {
    if (battery_id >= MAX_BATTERIES) return;
    
    battery_test_running[battery_id] = true;
    battery_test_state[battery_id] = TEST_STATE_RUNNING;
    battery_test_start_time[battery_id] = HAL_GetTick() / 1000;
}

/**
 * @brief Get test results
 */
bool battery_monitor_get_test_results(uint8_t battery_id, uint8_t* results, uint8_t* length) {
    if (battery_id >= MAX_BATTERIES || results == NULL || length == NULL) return false;
    
    if (battery_test_state[battery_id] == TEST_STATE_COMPLETE) {
        // Return test results (simplified)
        results[0] = battery_test_state[battery_id];
        results[1] = (uint8_t)((HAL_GetTick() / 1000) - battery_test_start_time[battery_id]);
        *length = 2;
        return true;
    }
    
    return false;
}

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Read individual battery data
 */
static void read_battery_data(uint8_t battery_id, stm32_battery_data_t* battery) {
    if (battery_id >= MAX_BATTERIES || battery == NULL) return;
    
    // Read voltage
    battery->voltage = voltage_divider_read_voltage_mv(&voltage_sensors[battery_id]);
    
    // Read current
    battery->current = (uint16_t)acs712_read_current_ma(&current_sensors[battery_id]);
    
    // Read temperature
    battery->temperature = (uint8_t)lm35_read_temperature(&temperature_sensors[battery_id]);
    
    // Calculate capacity from voltage
    battery->capacityPercent = calculate_capacity_from_voltage(battery->voltage, battery_types[battery_id]);
    
    // Determine charging state
    if (battery->current > 100) { // 100mA threshold
        battery->isCharging = true;
        battery_last_charge_time[battery_id] = HAL_GetTick() / 1000;
    } else if (battery->current < -100) {
        battery->isCharging = false;
        // Increment cycle count on discharge
        if (battery_last_charge_time[battery_id] > 0) {
            battery_cycle_count[battery_id]++;
            battery_last_charge_time[battery_id] = 0;
        }
    }
    
    // Set battery ID
    battery->batteryId = battery_id + 1;
    
    // Set test status
    battery->testInProgress = battery_test_running[battery_id];
    
    // Update test if running
    if (battery_test_running[battery_id]) {
        update_battery_test(battery_id, battery);
    }
}

/**
 * @brief Update battery status
 */
static void update_battery_status(uint8_t battery_id, stm32_battery_data_t* battery) {
    if (battery_id >= MAX_BATTERIES || battery == NULL) return;
    
    // Check battery health
    bool is_healthy = check_battery_health(battery_id, battery);
    
    // Update status based on health and test state
    if (battery_test_running[battery_id]) {
        battery->testInProgress = true;
    } else if (!is_healthy) {
        battery->testInProgress = false;
    } else {
        battery->testInProgress = false;
    }
}

/**
 * @brief Calculate capacity from voltage
 */
static uint8_t calculate_capacity_from_voltage(uint16_t voltage_mv, uint8_t battery_type) {
    switch (battery_type) {
        case BATTERY_TYPE_LEAD_ACID:
            if (voltage_mv >= 13000) return 100;
            else if (voltage_mv >= 12500) return 90;
            else if (voltage_mv >= 12000) return 75;
            else if (voltage_mv >= 11500) return 50;
            else if (voltage_mv >= 11000) return 25;
            else if (voltage_mv >= 10500) return 10;
            else return 0;
            
        case BATTERY_TYPE_LITHIUM:
            if (voltage_mv >= 14000) return 100;
            else if (voltage_mv >= 13500) return 90;
            else if (voltage_mv >= 13000) return 75;
            else if (voltage_mv >= 12500) return 50;
            else if (voltage_mv >= 12000) return 25;
            else if (voltage_mv >= 11500) return 10;
            else return 0;
            
        case BATTERY_TYPE_NICKEL:
            if (voltage_mv >= 12000) return 100;
            else if (voltage_mv >= 11500) return 90;
            else if (voltage_mv >= 11000) return 75;
            else if (voltage_mv >= 10500) return 50;
            else if (voltage_mv >= 10000) return 25;
            else if (voltage_mv >= 9500) return 10;
            else return 0;
            
        default:
            return 0;
    }
}

/**
 * @brief Update battery test
 */
static void update_battery_test(uint8_t battery_id, stm32_battery_data_t* battery) {
    if (battery_id >= MAX_BATTERIES || battery == NULL) return;
    
    uint32_t test_duration = (HAL_GetTick() / 1000) - battery_test_start_time[battery_id];
    
    // Simple test logic - complete after 60 seconds
    if (test_duration >= 60) {
        battery_test_state[battery_id] = TEST_STATE_COMPLETE;
        battery_test_running[battery_id] = false;
        battery->testInProgress = false;
    }
}

/**
 * @brief Check battery health
 */
static bool check_battery_health(uint8_t battery_id, stm32_battery_data_t* battery) {
    if (battery_id >= MAX_BATTERIES || battery == NULL) return false;
    
    // Check voltage range
    if (battery->voltage < voltage_limits_min[battery_id] || 
        battery->voltage > voltage_limits_max[battery_id]) {
        return false;
    }
    
    // Check current range
    if (abs(battery->current) > current_limits[battery_id]) {
        return false;
    }
    
    // Check temperature range
    if (battery->temperature > temperature_limits[battery_id]) {
        return false;
    }
    
    // Check capacity
    if (battery->capacityPercent < BATTERY_CAPACITY_CRIT) {
        return false;
    }
    
    return true;
}

/* USER CODE END 0 */

/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : sensor_library.c
  * @brief          : NetmonDashboard v3 - Sensor Library Implementation
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#include "sensor_library.h"
#include "main.h"
#include <math.h>

// ADC reference voltage and resolution
#define ADC_REFERENCE_VOLTAGE_MV  3300      // 3.3V
#define ADC_RESOLUTION            4096      // 12-bit

/* USER CODE BEGIN 0 */

/**
 * @brief Initialize voltage divider sensor
 */
void voltage_divider_init(voltage_divider_config_t* config, uint8_t channel, uint32_t r1, uint32_t r2) {
    if (config == NULL) return;
    
    config->adc_channel = channel;
    config->r1_ohms = r1;
    config->r2_ohms = r2;
    config->calibration_factor = 1.0f;
    config->offset_mv = 0;
}

/**
 * @brief Read voltage from voltage divider sensor
 */
uint16_t voltage_divider_read_voltage_mv(voltage_divider_config_t* config) {
    if (config == NULL) return 0;
    
    // Read ADC value
    uint16_t adc_value = read_adc_channel(config->adc_channel);
    
    // Convert ADC to voltage
    float voltage_v = convert_adc_to_voltage(adc_value);
    
    // Apply voltage divider formula: V_out = V_in * (R2 / (R1 + R2))
    float input_voltage_v = voltage_v * (config->r1_ohms + config->r2_ohms) / config->r2_ohms;
    
    // Apply calibration and offset
    uint16_t result_mv = (uint16_t)(input_voltage_v * 1000.0f * config->calibration_factor + config->offset_mv);
    
    return result_mv;
}

/**
 * @brief Calibrate voltage divider sensor
 */
void voltage_divider_calibrate(voltage_divider_config_t* config, float reference_voltage) {
    if (config == NULL || reference_voltage <= 0) return;
    
    // Read current voltage
    uint16_t current_mv = voltage_divider_read_voltage_mv(config);
    float current_v = current_mv / 1000.0f;
    
    // Calculate calibration factor
    if (current_v > 0) {
        config->calibration_factor = reference_voltage / current_v;
    }
}

/**
 * @brief Initialize ACS712 current sensor
 */
void acs712_init(acs712_config_t* config, uint8_t channel, uint16_t sensitivity) {
    if (config == NULL) return;
    
    config->adc_channel = channel;
    config->sensitivity_mv_per_a = sensitivity;
    config->calibration_factor = 1.0f;
    config->offset_ma = 0;
}

/**
 * @brief Read current from ACS712 sensor
 */
int16_t acs712_read_current_ma(acs712_config_t* config) {
    if (config == NULL) return 0;
    
    // Read ADC value
    uint16_t adc_value = read_adc_channel(config->adc_channel);
    
    // Convert ADC to voltage
    float voltage_v = convert_adc_to_voltage(adc_value);
    
    // Convert voltage to current: I = (V - V_offset) / sensitivity
    // ACS712 outputs Vcc/2 (1.65V) when current is 0A
    float voltage_offset_v = ADC_REFERENCE_VOLTAGE_MV / 2000.0f; // Vcc/2
    float voltage_diff_v = voltage_v - voltage_offset_v;
    
    // Convert to current in mA
    float current_ma = (voltage_diff_v * 1000.0f) / config->sensitivity_mv_per_a;
    
    // Apply calibration and offset
    int16_t result_ma = (int16_t)(current_ma * config->calibration_factor + config->offset_ma);
    
    return result_ma;
}

/**
 * @brief Calibrate ACS712 current sensor
 */
void acs712_calibrate(acs712_config_t* config, float reference_current) {
    if (config == NULL) return;
    
    // Read current value
    int16_t current_ma = acs712_read_current_ma(config);
    float current_a = current_ma / 1000.0f;
    
    // Calculate calibration factor
    if (current_a != 0) {
        config->calibration_factor = reference_current / current_a;
    }
    
    // Set offset to center the reading around 0A
    config->offset_ma = 0;
}

/**
 * @brief Initialize LM35 temperature sensor
 */
void lm35_init(lm35_config_t* config, uint8_t channel) {
    if (config == NULL) return;
    
    config->adc_channel = channel;
    config->calibration_factor = 1.0f;
    config->offset_c = 0;
}

/**
 * @brief Read temperature from LM35 sensor
 */
float lm35_read_temperature(lm35_config_t* config) {
    if (config == NULL) return 0.0f;
    
    // Read ADC value
    uint16_t adc_value = read_adc_channel(config->adc_channel);
    
    // Convert ADC to voltage
    float voltage_v = convert_adc_to_voltage(adc_value);
    
    // LM35 outputs 10mV/°C, so temperature = voltage / 0.01
    float temperature_c = voltage_v / 0.01f;
    
    // Apply calibration and offset
    float result_c = temperature_c * config->calibration_factor + config->offset_c;
    
    return result_c;
}

/**
 * @brief Calibrate LM35 temperature sensor
 */
void lm35_calibrate(lm35_config_t* config, float reference_temperature) {
    if (config == NULL) return;
    
    // Read current temperature
    float current_temp = lm35_read_temperature(config);
    
    // Calculate calibration factor
    if (current_temp != 0) {
        config->calibration_factor = reference_temperature / current_temp;
    }
    
    // Set offset to center the reading
    config->offset_c = 0;
}

/**
 * @brief Read ADC channel value
 */
uint16_t read_adc_channel(uint8_t channel) {
    // This is a placeholder - in real implementation, this would use STM32 HAL ADC functions
    // For now, return a simulated value based on channel
    static uint16_t simulated_values[16] = {
        2048, 2050, 2046, 2052,  // Channels 0-3 (Power modules)
        1024, 1026,               // Channels 4-5 (Batteries)
        1536, 1538, 1540,         // Channels 6-8 (AC inputs)
        2048, 2050,               // Channels 9-10 (Current sensors)
        512, 514,                 // Channels 11-12 (Temperature sensors)
        1536, 1538, 1540, 1542   // Channels 13-15 (Additional sensors)
    };
    
    if (channel < 16) {
        // Add some variation to simulate real sensor readings
        uint16_t base_value = simulated_values[channel];
        int16_t variation = (rand() % 10) - 5; // ±5 ADC counts
        return (uint16_t)(base_value + variation);
    }
    
    return 0;
}

/**
 * @brief Convert ADC value to voltage
 */
float convert_adc_to_voltage(uint16_t adc_value) {
    // Convert 12-bit ADC value to voltage
    // V = (ADC_value / ADC_resolution) * V_ref
    return (float)adc_value / ADC_RESOLUTION * (ADC_REFERENCE_VOLTAGE_MV / 1000.0f);
}

/**
 * @brief Convert voltage to ADC value
 */
uint16_t convert_voltage_to_adc(float voltage) {
    // Convert voltage to 12-bit ADC value
    // ADC_value = (V / V_ref) * ADC_resolution
    if (voltage < 0) voltage = 0;
    if (voltage > (ADC_REFERENCE_VOLTAGE_MV / 1000.0f)) {
        voltage = ADC_REFERENCE_VOLTAGE_MV / 1000.0f;
    }
    
    return (uint16_t)(voltage / (ADC_REFERENCE_VOLTAGE_MV / 1000.0f) * ADC_RESOLUTION);
}

/* USER CODE END 0 */



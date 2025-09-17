/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file    sensor_library.h
  * @brief   Real sensor library for STM32F407
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#ifndef SENSOR_LIBRARY_H
#define SENSOR_LIBRARY_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

// ADC channel definitions
#define ADC_CHANNEL_0     0
#define ADC_CHANNEL_1     1
#define ADC_CHANNEL_2     2
#define ADC_CHANNEL_3     3
#define ADC_CHANNEL_4     4
#define ADC_CHANNEL_5     5
#define ADC_CHANNEL_6     6
#define ADC_CHANNEL_7     7
#define ADC_CHANNEL_8     8
#define ADC_CHANNEL_9     9
#define ADC_CHANNEL_10    10
#define ADC_CHANNEL_11    11
#define ADC_CHANNEL_12    12
#define ADC_CHANNEL_13    13
#define ADC_CHANNEL_14    14
#define ADC_CHANNEL_15    15

// ACS712 current sensor sensitivity (mV/A)
#define ACS712_5A_SENSITIVITY     185
#define ACS712_20A_SENSITIVITY    100
#define ACS712_30A_SENSITIVITY    66

// LM35 temperature sensor sensitivity (mV/°C)
#define LM35_SENSITIVITY          10

// Voltage divider configuration structure
typedef struct {
    uint8_t adc_channel;
    uint32_t r1_ohms;        // High side resistor
    uint32_t r2_ohms;        // Low side resistor
    float calibration_factor; // Calibration multiplier
    uint16_t offset_mv;      // Offset in millivolts
} voltage_divider_config_t;

// ACS712 current sensor configuration structure
typedef struct {
    uint8_t adc_channel;
    uint16_t sensitivity_mv_per_a; // Sensitivity in mV/A
    float calibration_factor;       // Calibration multiplier
    int16_t offset_ma;             // Offset in milliamps
} acs712_config_t;

// LM35 temperature sensor configuration structure
typedef struct {
    uint8_t adc_channel;
    float calibration_factor; // Calibration multiplier
    int8_t offset_c;         // Offset in Celsius
} lm35_config_t;

// Function prototypes for voltage divider
void voltage_divider_init(voltage_divider_config_t* config, uint8_t channel, uint32_t r1, uint32_t r2);
uint16_t voltage_divider_read_voltage_mv(voltage_divider_config_t* config);
void voltage_divider_calibrate(voltage_divider_config_t* config, float reference_voltage);

// Function prototypes for ACS712 current sensor
void acs712_init(acs712_config_t* config, uint8_t channel, uint16_t sensitivity);
int16_t acs712_read_current_ma(acs712_config_t* config);
void acs712_calibrate(acs712_config_t* config, float reference_current);

// Function prototypes for LM35 temperature sensor
void lm35_init(lm35_config_t* config, uint8_t channel);
float lm35_read_temperature(lm35_config_t* config);
void lm35_calibrate(lm35_config_t* config, float reference_temperature);

// Utility functions
uint16_t read_adc_channel(uint8_t channel);
float convert_adc_to_voltage(uint16_t adc_value);
uint16_t convert_voltage_to_adc(float voltage);

#ifdef __cplusplus
}
#endif

#endif // SENSOR_LIBRARY_H



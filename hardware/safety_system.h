/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file    safety_system.h
  * @brief   Safety and error management system for STM32F407
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

#ifndef SAFETY_SYSTEM_H
#define SAFETY_SYSTEM_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include "stm32_interface.h"

// Safety system configuration
#define MAX_SAFETY_CHECKS     10
#define SAFETY_CHECK_INTERVAL 1000  // 1 second
#define EMERGENCY_SHUTDOWN_DELAY 5000 // 5 seconds

// Safety thresholds
#define VOLTAGE_CRITICAL_LOW_MV  40000  // 40V
#define VOLTAGE_CRITICAL_HIGH_MV 60000  // 60V
#define CURRENT_CRITICAL_HIGH_MA 120000 // 120A
#define TEMP_CRITICAL_HIGH_C     80     // 80°C
#define POWER_CRITICAL_HIGH_MW   3000000 // 3kW

// Safety states
#define SAFETY_STATE_NORMAL      0x00
#define SAFETY_STATE_WARNING     0x01
#define SAFETY_STATE_CRITICAL    0x02
#define SAFETY_STATE_EMERGENCY   0x03
#define SAFETY_STATE_SHUTDOWN    0x04

// Safety actions
#define SAFETY_ACTION_NONE       0x00
#define SAFETY_ACTION_WARNING    0x01
#define SAFETY_ACTION_REDUCE     0x02
#define SAFETY_ACTION_SHUTDOWN   0x03
#define SAFETY_ACTION_EMERGENCY  0x04

// Safety check types
#define SAFETY_CHECK_VOLTAGE     0x01
#define SAFETY_CHECK_CURRENT     0x02
#define SAFETY_CHECK_TEMPERATURE 0x03
#define SAFETY_CHECK_POWER       0x04
#define SAFETY_CHECK_COMMUNICATION 0x05
#define SAFETY_CHECK_SYSTEM      0x06

// Function prototypes
void safety_system_init(void);
void safety_system_check_all(void);
uint8_t safety_system_get_state(void);
bool safety_system_is_safe(void);
void safety_system_emergency_shutdown(void);
void safety_system_reset(void);

// Individual safety checks
bool safety_system_check_voltage(stm32_power_module_data_t* modules, uint8_t count);
bool safety_system_check_current(stm32_power_module_data_t* modules, uint8_t count);
bool safety_system_check_temperature(stm32_power_module_data_t* modules, uint8_t count);
bool safety_system_check_power(stm32_power_module_data_t* modules, uint8_t count);
bool safety_system_check_communication(void);
bool safety_system_check_system_health(void);

// Safety actions
void safety_system_issue_warning(uint8_t check_type, const char* message);
void safety_system_reduce_power(uint8_t module_id, uint8_t percentage);
void safety_system_shutdown_module(uint8_t module_id);
void safety_system_shutdown_all_modules(void);

// Configuration functions
void safety_system_set_voltage_limits(uint16_t min_mv, uint16_t max_mv);
void safety_system_set_current_limit(uint16_t max_ma);
void safety_system_set_temperature_limit(uint8_t max_c);
void safety_system_set_power_limit(uint32_t max_mw);

// Status and monitoring
uint8_t safety_system_get_warning_count(void);
uint8_t safety_system_get_critical_count(void);
bool safety_system_get_last_check_result(uint8_t check_type);
const char* safety_system_get_last_warning_message(void);
uint32_t safety_system_get_uptime_seconds(void);

#ifdef __cplusplus
}
#endif

#endif // SAFETY_SYSTEM_H



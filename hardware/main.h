/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.h
  * @brief          : Header for main.c file.
  *                   This file contains the common defines of the application.
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

/* Define to prevent recursive inclusion -------------------------------------*/
#ifndef __MAIN_H
#define __MAIN_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "stm32f4xx_hal.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "stm32_interface.h"
#include "power_monitor.h"
#include "battery_monitor.h"
#include "ac_monitor.h"
#include "alarm_system.h"
/* USER CODE END Includes */

/* Exported types ------------------------------------------------------------*/
/* USER CODE BEGIN ET */

/* USER CODE END ET */

/* Exported constants --------------------------------------------------------*/
/* USER CODE BEGIN EC */

/* USER CODE END EC */

/* Exported macro ------------------------------------------------------------*/
/* USER CODE BEGIN EM */

/* USER CODE END EM */

/* Exported functions prototypes ---------------------------------------------*/
void Error_Handler(void);

/* USER CODE BEGIN EFP */

/* USER CODE END EFP */

/* Private defines -----------------------------------------------------------*/
/* USER CODE BEGIN Private defines */

// GPIO Pin Definitions
#define STATUS_LED_Pin       GPIO_PIN_14
#define STATUS_LED_GPIO_Port GPIOC
#define ALARM_LED_Pin        GPIO_PIN_13
#define ALARM_LED_GPIO_Port  GPIOC

// Power Module Enable Pins
#define POWER_MODULE_1_EN_Pin    GPIO_PIN_0
#define POWER_MODULE_1_EN_GPIO_Port  GPIOA
#define POWER_MODULE_2_EN_Pin    GPIO_PIN_1
#define POWER_MODULE_2_EN_GPIO_Port  GPIOA
#define POWER_MODULE_3_EN_Pin    GPIO_PIN_2
#define POWER_MODULE_3_EN_GPIO_Port  GPIOA
#define POWER_MODULE_4_EN_Pin    GPIO_PIN_3
#define POWER_MODULE_4_EN_GPIO_Port  GPIOA

// Battery Enable Pins
#define BATTERY_1_EN_Pin     GPIO_PIN_4
#define BATTERY_1_EN_GPIO_Port   GPIOA
#define BATTERY_2_EN_Pin     GPIO_PIN_5
#define BATTERY_2_EN_GPIO_Port   GPIOA

// ADC Channel Definitions
#define ADC_CHANNEL_POWER_MODULE_1_VOLTAGE   ADC_CHANNEL_0
#define ADC_CHANNEL_POWER_MODULE_2_VOLTAGE   ADC_CHANNEL_1
#define ADC_CHANNEL_POWER_MODULE_3_VOLTAGE   ADC_CHANNEL_2
#define ADC_CHANNEL_POWER_MODULE_4_VOLTAGE   ADC_CHANNEL_3
#define ADC_CHANNEL_BATTERY_1_VOLTAGE        ADC_CHANNEL_4
#define ADC_CHANNEL_BATTERY_2_VOLTAGE        ADC_CHANNEL_5
#define ADC_CHANNEL_AC_PHASE_1_VOLTAGE       ADC_CHANNEL_6
#define ADC_CHANNEL_AC_PHASE_2_VOLTAGE       ADC_CHANNEL_7
#define ADC_CHANNEL_AC_PHASE_3_VOLTAGE       ADC_CHANNEL_8
#define ADC_CHANNEL_CURRENT_SENSOR_1         ADC_CHANNEL_9
#define ADC_CHANNEL_CURRENT_SENSOR_2         ADC_CHANNEL_10
#define ADC_CHANNEL_TEMPERATURE_SENSOR_1     ADC_CHANNEL_11
#define ADC_CHANNEL_TEMPERATURE_SENSOR_2     ADC_CHANNEL_12
#define ADC_CHANNEL_TEMPERATURE_SENSOR_3     ADC_CHANNEL_13

// System Configuration
#define SYSTEM_CLOCK_FREQUENCY   168000000  // 168 MHz
#define UART_BAUDRATE            115200
#define ADC_RESOLUTION           4096       // 12-bit ADC
#define ADC_REFERENCE_VOLTAGE    3300       // 3.3V reference

// Timing Configuration
#define MAIN_LOOP_PERIOD_MS      100        // 100ms main loop
#define DATA_SEND_PERIOD_MS      2000       // 2s data send
#define HEARTBEAT_PERIOD_MS      5000       // 5s heartbeat
#define ADC_READ_PERIOD_MS       10         // 10ms ADC read

// Safety Limits
#define MAX_VOLTAGE_MV           55000      // 55V max
#define MIN_VOLTAGE_MV           45000      // 45V min
#define MAX_CURRENT_MA           50000      // 50A max
#define MAX_TEMPERATURE_C        60         // 60°C max
#define MAX_POWER_MW             2400000    // 2.4kW max

// Watchdog Configuration
#define WATCHDOG_TIMEOUT_MS      5000       // 5s watchdog timeout

/* USER CODE END Private defines */

#ifdef __cplusplus
}
#endif

#endif /* __MAIN_H */



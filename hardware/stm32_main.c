/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : NetmonDashboard v3 - STM32 Power System Monitor
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2024 NetmonDashboard Team
  * All rights reserved.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "adc.h"
#include "dma.h"
#include "spi.h"
#include "tim.h"
#include "usart.h"
#include "gpio.h"
#include "stm32f4xx_hal.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "stm32_interface.h"
#include "power_monitor.h"
#include "battery_monitor.h"
#include "ac_monitor.h"
#include "alarm_system.h"
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
#define SYSTEM_TICK_MS          100
#define DATA_SEND_INTERVAL_MS   2000
#define HEARTBEAT_INTERVAL_MS   5000
#define MAX_RECTIFIERS          4
#define MAX_BATTERIES           2
#define MAX_AC_PHASES           3
#define MAX_DC_CIRCUITS         8

// GPIO Pin Definitions
#define RECTIFIER_1_ENABLE_PIN  GPIO_PIN_0
#define RECTIFIER_2_ENABLE_PIN  GPIO_PIN_1
#define RECTIFIER_3_ENABLE_PIN  GPIO_PIN_2
#define RECTIFIER_4_ENABLE_PIN  GPIO_PIN_3
#define RECTIFIER_ENABLE_PORT   GPIOA

#define BATTERY_1_ENABLE_PIN    GPIO_PIN_4
#define BATTERY_2_ENABLE_PIN    GPIO_PIN_5
#define BATTERY_ENABLE_PORT     GPIOA

#define ALARM_LED_PIN           GPIO_PIN_13
#define ALARM_LED_PORT          GPIOC

#define STATUS_LED_PIN          GPIO_PIN_14
#define STATUS_LED_PORT         GPIOC

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
/* USER CODE BEGIN PV */
// System state
static uint32_t system_uptime = 0;
static uint8_t system_mode = 0; // 0=Auto, 1=Manual, 2=Test
static uint8_t mains_available = 1;
static uint8_t battery_backup = 0;
static uint8_t generator_running = 0;

// Data structures
static stm32_power_module_data_t power_modules[MAX_RECTIFIERS];
static stm32_battery_data_t batteries[MAX_BATTERIES];
static stm32_ac_input_data_t ac_inputs[MAX_AC_PHASES];
static stm32_dc_output_data_t dc_outputs[MAX_DC_CIRCUITS];
static stm32_system_status_t system_status;
static stm32_alarm_data_t active_alarms[10];
static uint8_t alarm_count = 0;

// Communication
static uint8_t rx_buffer[256];
static uint8_t tx_buffer[256];
static uint16_t rx_index = 0;
static uint8_t packet_ready = 0;

// Timers
static uint32_t last_data_send = 0;
static uint32_t last_heartbeat = 0;
static uint32_t last_status_update = 0;

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */
static void SystemInit_Config(void);
static void GPIO_Init_Config(void);
static void Read_Power_Modules(void);
static void Read_Batteries(void);
static void Read_AC_Inputs(void);
static void Read_DC_Outputs(void);
static void Update_System_Status(void);
static void Process_Commands(void);
static void Send_Data_Packet(uint8_t packet_type);
static void Send_Heartbeat(void);
static void Handle_Alarm(uint32_t alarm_id, uint8_t severity, const char* message);
static void Toggle_Status_LED(void);
static void Toggle_Alarm_LED(void);
/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/**
 * @brief  System initialization
 * @param  None
 * @retval None
 */
static void SystemInit_Config(void)
{
    // Initialize system variables
    memset(power_modules, 0, sizeof(power_modules));
    memset(batteries, 0, sizeof(batteries));
    memset(ac_inputs, 0, sizeof(ac_inputs));
    memset(dc_outputs, 0, sizeof(dc_outputs));
    memset(&system_status, 0, sizeof(system_status));
    memset(active_alarms, 0, sizeof(active_alarms));
    
    // Initialize power modules
    for (int i = 0; i < MAX_RECTIFIERS; i++) {
        power_modules[i].module_id = i + 1;
        power_modules[i].status = 1; // Enabled
    }
    
    // Initialize batteries
    for (int i = 0; i < MAX_BATTERIES; i++) {
        batteries[i].battery_id = i + 1;
        batteries[i].capacity = 100; // Full
    }
    
    // Initialize AC inputs
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        ac_inputs[i].phase_id = i + 1;
        ac_inputs[i].status = 1; // Available
    }
    
    // Initialize DC outputs
    for (int i = 0; i < MAX_DC_CIRCUITS; i++) {
        dc_outputs[i].circuit_id = i + 1;
        dc_outputs[i].enabled = 1; // Enabled
        strcpy((char*)dc_outputs[i].load_name, "LOAD");
    }
    
    // Initialize system status
    system_status.mains_available = 1;
    system_status.battery_backup = 0;
    system_status.generator_running = 0;
    system_status.operation_mode = 0; // Auto
    system_status.system_load = 0;
    system_status.uptime_seconds = 0;
}

/**
 * @brief  GPIO initialization for control pins
 * @param  None
 * @retval None
 */
static void GPIO_Init_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    
    // Enable GPIO clocks
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();
    
    // Configure rectifier enable pins as outputs
    GPIO_InitStruct.Pin = RECTIFIER_1_ENABLE_PIN | RECTIFIER_2_ENABLE_PIN | 
                         RECTIFIER_3_ENABLE_PIN | RECTIFIER_4_ENABLE_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(RECTIFIER_ENABLE_PORT, &GPIO_InitStruct);
    
    // Configure battery enable pins as outputs
    GPIO_InitStruct.Pin = BATTERY_1_ENABLE_PIN | BATTERY_2_ENABLE_PIN;
    HAL_GPIO_Init(BATTERY_ENABLE_PORT, &GPIO_InitStruct);
    
    // Configure LED pins as outputs
    GPIO_InitStruct.Pin = STATUS_LED_PIN;
    HAL_GPIO_Init(STATUS_LED_PORT, &GPIO_InitStruct);
    
    GPIO_InitStruct.Pin = ALARM_LED_PIN;
    HAL_GPIO_Init(ALARM_LED_PORT, &GPIO_InitStruct);
    
    // Set initial states
    HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, 
                     RECTIFIER_1_ENABLE_PIN | RECTIFIER_2_ENABLE_PIN | 
                     RECTIFIER_3_ENABLE_PIN | RECTIFIER_4_ENABLE_PIN, GPIO_PIN_SET);
    
    HAL_GPIO_WritePin(BATTERY_ENABLE_PORT, 
                     BATTERY_1_ENABLE_PIN | BATTERY_2_ENABLE_PIN, GPIO_PIN_SET);
    
    HAL_GPIO_WritePin(STATUS_LED_PORT, STATUS_LED_PIN, GPIO_PIN_SET);
    HAL_GPIO_WritePin(ALARM_LED_PORT, ALARM_LED_PIN, GPIO_PIN_RESET);
}

/**
 * @brief  Read power module data from ADC and sensors
 * @param  None
 * @retval None
 */
static void Read_Power_Modules(void)
{
    for (int i = 0; i < MAX_RECTIFIERS; i++) {
        // Read voltage from ADC (example: ADC channel 0-3 for rectifiers)
        uint32_t adc_value = 0;
        HAL_ADC_Start(&hadc1);
        HAL_ADC_PollForConversion(&hadc1, 100);
        adc_value = HAL_ADC_GetValue(&hadc1);
        HAL_ADC_Stop(&hadc1);
        
        // Convert ADC value to voltage (mV)
        // Assuming 3.3V reference and 12-bit ADC
        power_modules[i].voltage = (adc_value * 3300) / 4096;
        
        // Read current (example: using current sensor)
        // This would be implemented based on your current sensor
        power_modules[i].current = 45000 + (rand() % 1000); // 45A + random
        
        // Calculate power (mW)
        power_modules[i].power = (power_modules[i].voltage * power_modules[i].current) / 1000;
        
        // Read temperature (example: using temperature sensor)
        power_modules[i].temperature = 25 + (rand() % 20); // 25-45°C
        
        // Update status based on readings
        if (power_modules[i].voltage < 45000 || power_modules[i].voltage > 55000) {
            power_modules[i].fault_flags |= 0x01; // Voltage fault
            Handle_Alarm(1000 + i, 2, "VOLT_FAULT");
        } else {
            power_modules[i].fault_flags &= ~0x01;
        }
        
        if (power_modules[i].temperature > 60) {
            power_modules[i].fault_flags |= 0x02; // Temperature fault
            Handle_Alarm(2000 + i, 2, "TEMP_FAULT");
        } else {
            power_modules[i].fault_flags &= ~0x02;
        }
    }
}

/**
 * @brief  Read battery data
 * @param  None
 * @retval None
 */
static void Read_Batteries(void)
{
    for (int i = 0; i < MAX_BATTERIES; i++) {
        // Read battery voltage
        uint32_t adc_value = 0;
        HAL_ADC_Start(&hadc1);
        HAL_ADC_PollForConversion(&hadc1, 100);
        adc_value = HAL_ADC_GetValue(&hadc1);
        HAL_ADC_Stop(&hadc1);
        
        batteries[i].voltage = (adc_value * 15000) / 4096; // 0-15V range
        batteries[i].current = 100 + (rand() % 200); // 0.1-0.3A
        batteries[i].temperature = 20 + (rand() % 15); // 20-35°C
        
        // Calculate capacity based on voltage
        if (batteries[i].voltage > 13000) {
            batteries[i].capacity = 100;
        } else if (batteries[i].voltage > 12000) {
            batteries[i].capacity = 75;
        } else if (batteries[i].voltage > 11000) {
            batteries[i].capacity = 50;
        } else if (batteries[i].voltage > 10000) {
            batteries[i].capacity = 25;
        } else {
            batteries[i].capacity = 0;
            Handle_Alarm(3000 + i, 2, "BAT_LOW");
        }
        
        // Determine charging status
        batteries[i].charging = (batteries[i].current > 0) ? 1 : 0;
    }
}

/**
 * @brief  Read AC input data
 * @param  None
 * @retval None
 */
static void Read_AC_Inputs(void)
{
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        // Read AC voltage (example: using voltage transformer)
        ac_inputs[i].voltage = 2300 + (rand() % 100); // 230V ±5V
        ac_inputs[i].current = 100 + (rand() % 50);   // 10A ±2.5A
        ac_inputs[i].frequency = 500 + (rand() % 10); // 50Hz ±0.5Hz
        ac_inputs[i].power = (ac_inputs[i].voltage * ac_inputs[i].current) / 10;
        
        // Check if mains is available
        if (ac_inputs[i].voltage > 2000 && ac_inputs[i].frequency > 450) {
            ac_inputs[i].status = 1; // Available
        } else {
            ac_inputs[i].status = 0; // Not available
            Handle_Alarm(4000 + i, 1, "AC_FAULT");
        }
    }
}

/**
 * @brief  Read DC output data
 * @param  None
 * @retval None
 */
static void Read_DC_Outputs(void)
{
    for (int i = 0; i < MAX_DC_CIRCUITS; i++) {
        // Read DC output voltage and current
        dc_outputs[i].voltage = 53000 + (rand() % 1000); // 53V ±0.5V
        dc_outputs[i].current = 5000 + (rand() % 2000);  // 5A ±1A
        dc_outputs[i].power = (dc_outputs[i].voltage * dc_outputs[i].current) / 1000;
        
        // Check if circuit is enabled
        if (dc_outputs[i].enabled) {
            // Verify voltage is within range
            if (dc_outputs[i].voltage < 52000 || dc_outputs[i].voltage > 54000) {
                Handle_Alarm(5000 + i, 1, "DC_FAULT");
            }
        }
    }
}

/**
 * @brief  Update system status
 * @param  None
 * @retval None
 */
static void Update_System_Status(void)
{
    // Update uptime
    system_uptime += SYSTEM_TICK_MS;
    system_status.uptime_seconds = system_uptime / 1000;
    
    // Check mains availability
    mains_available = 0;
    for (int i = 0; i < MAX_AC_PHASES; i++) {
        if (ac_inputs[i].status) {
            mains_available = 1;
            break;
        }
    }
    system_status.mains_available = mains_available;
    
    // Check battery backup
    battery_backup = (mains_available == 0) ? 1 : 0;
    system_status.battery_backup = battery_backup;
    
    // Calculate system load
    uint32_t total_power = 0;
    for (int i = 0; i < MAX_DC_CIRCUITS; i++) {
        if (dc_outputs[i].enabled) {
            total_power += dc_outputs[i].power;
        }
    }
    
    uint32_t max_power = 2400000; // 2.4kW max
    system_status.system_load = (total_power * 1000) / max_power; // Percentage * 10
    
    // Update generator status (if applicable)
    system_status.generator_running = generator_running;
    
    // Update operation mode
    system_status.operation_mode = system_mode;
}

/**
 * @brief  Process incoming commands
 * @param  None
 * @retval None
 */
static void Process_Commands(void)
{
    if (!packet_ready) return;
    
    stm32_packet_t packet;
    if (stm32_parse_packet(rx_buffer, rx_index, &packet)) {
        if (packet.packet_type == PACKET_TYPE_COMMAND) {
            stm32_command_t cmd;
            memcpy(&cmd, packet.data, sizeof(stm32_command_t));
            
            // Process command based on target
            switch (cmd.target_id) {
                case 1: // Power module control
                    if (cmd.action == 1) { // Set
                        if (cmd.parameter == 1) {
                            HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, RECTIFIER_1_ENABLE_PIN, GPIO_PIN_SET);
                        } else {
                            HAL_GPIO_WritePin(RECTIFIER_ENABLE_PORT, RECTIFIER_1_ENABLE_PIN, GPIO_PIN_RESET);
                        }
                    }
                    break;
                    
                case 2: // Battery control
                    if (cmd.action == 2) { // Start test
                        batteries[0].test_status = 1;
                        Handle_Alarm(6000, 0, "BAT_TEST");
                    }
                    break;
                    
                case 3: // System control
                    if (cmd.action == 1) { // Set mode
                        system_mode = cmd.parameter;
                    }
                    break;
            }
            
            // Send response
            Send_Data_Packet(PACKET_TYPE_RESPONSE);
        }
    }
    
    packet_ready = 0;
    rx_index = 0;
}

/**
 * @brief  Send data packet
 * @param  packet_type: Type of packet to send
 * @retval None
 */
static void Send_Data_Packet(uint8_t packet_type)
{
    stm32_packet_t packet;
    uint8_t data_length = 0;
    
    switch (packet_type) {
        case PACKET_TYPE_POWER_MODULE:
            data_length = sizeof(stm32_power_module_data_t);
            memcpy(packet.data, &power_modules[0], data_length);
            break;
            
        case PACKET_TYPE_BATTERY:
            data_length = sizeof(stm32_battery_data_t);
            memcpy(packet.data, &batteries[0], data_length);
            break;
            
        case PACKET_TYPE_AC_INPUT:
            data_length = sizeof(stm32_ac_input_data_t);
            memcpy(packet.data, &ac_inputs[0], data_length);
            break;
            
        case PACKET_TYPE_DC_OUTPUT:
            data_length = sizeof(stm32_dc_output_data_t);
            memcpy(packet.data, &dc_outputs[0], data_length);
            break;
            
        case PACKET_TYPE_SYSTEM_STATUS:
            data_length = sizeof(stm32_system_status_t);
            memcpy(packet.data, &system_status, data_length);
            break;
            
        case PACKET_TYPE_ALARM:
            if (alarm_count > 0) {
                data_length = sizeof(stm32_alarm_data_t);
                memcpy(packet.data, &active_alarms[0], data_length);
            }
            break;
    }
    
    if (data_length > 0) {
        stm32_create_packet(packet_type, packet.data, data_length, &packet);
        
        // Send via UART
        HAL_UART_Transmit(&huart1, (uint8_t*)&packet, data_length + 5, 100);
    }
}

/**
 * @brief  Send heartbeat packet
 * @param  None
 * @retval None
 */
static void Send_Heartbeat(void)
{
    // Send system status as heartbeat
    Send_Data_Packet(PACKET_TYPE_SYSTEM_STATUS);
}

/**
 * @brief  Handle alarm
 * @param  alarm_id: Alarm ID
 * @param  severity: Severity level (0=Info, 1=Warning, 2=Critical)
 * @param  message: Alarm message
 * @retval None
 */
static void Handle_Alarm(uint32_t alarm_id, uint8_t severity, const char* message)
{
    if (alarm_count < 10) {
        active_alarms[alarm_count].alarm_id = alarm_id;
        active_alarms[alarm_count].severity = severity;
        active_alarms[alarm_count].timestamp = HAL_GetTick() / 1000;
        active_alarms[alarm_count].is_active = 1;
        strncpy((char*)active_alarms[alarm_count].message, message, 7);
        active_alarms[alarm_count].message[7] = '\0';
        alarm_count++;
        
        // Send alarm packet
        Send_Data_Packet(PACKET_TYPE_ALARM);
        
        // Toggle alarm LED for critical alarms
        if (severity == 2) {
            Toggle_Alarm_LED();
        }
    }
}

/**
 * @brief  Toggle status LED
 * @param  None
 * @retval None
 */
static void Toggle_Status_LED(void)
{
    static uint8_t led_state = 0;
    led_state = !led_state;
    HAL_GPIO_WritePin(STATUS_LED_PORT, STATUS_LED_PIN, led_state ? GPIO_PIN_SET : GPIO_PIN_RESET);
}

/**
 * @brief  Toggle alarm LED
 * @param  None
 * @retval None
 */
static void Toggle_Alarm_LED(void)
{
    static uint8_t alarm_led_state = 0;
    alarm_led_state = !alarm_led_state;
    HAL_GPIO_WritePin(ALARM_LED_PORT, ALARM_LED_PIN, alarm_led_state ? GPIO_PIN_SET : GPIO_PIN_RESET);
}

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_ADC1_Init();
  MX_SPI1_Init();
  MX_TIM2_Init();
  MX_USART1_UART_Init();

  /* USER CODE BEGIN 2 */
  // Initialize system
  SystemInit_Config();
  GPIO_Init_Config();
  
  // Start timers
  HAL_TIM_Base_Start_IT(&htim2);
  
  // Send initial status
  Send_Data_Packet(PACKET_TYPE_SYSTEM_STATUS);
  
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    uint32_t current_time = HAL_GetTick();
    
    // Read sensor data every 100ms
    if (current_time - last_status_update >= SYSTEM_TICK_MS) {
      Read_Power_Modules();
      Read_Batteries();
      Read_AC_Inputs();
      Read_DC_Outputs();
      Update_System_Status();
      last_status_update = current_time;
      
      // Toggle status LED
      Toggle_Status_LED();
    }
    
    // Send data every 2 seconds
    if (current_time - last_data_send >= DATA_SEND_INTERVAL_MS) {
      Send_Data_Packet(PACKET_TYPE_POWER_MODULE);
      Send_Data_Packet(PACKET_TYPE_BATTERY);
      Send_Data_Packet(PACKET_TYPE_AC_INPUT);
      Send_Data_Packet(PACKET_TYPE_DC_OUTPUT);
      last_data_send = current_time;
    }
    
    // Send heartbeat every 5 seconds
    if (current_time - last_heartbeat >= HEARTBEAT_INTERVAL_MS) {
      Send_Heartbeat();
      last_heartbeat = current_time;
    }
    
    // Process incoming commands
    Process_Commands();
    
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Configure the main internal regulator output voltage 
  */
  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 8;
  RCC_OscInitStruct.PLL.PLLN = 168;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
  RCC_OscInitStruct.PLL.PLLQ = 4;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks 
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_5) != HAL_OK)
  {
    Error_Handler();
  }
}

/* USER CODE BEGIN 4 */
/**
  * @brief  UART Receive Complete Callback
  * @param  huart: UART handle
  * @retval None
  */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1) {
        uint8_t received_byte;
        HAL_UART_Receive(&huart1, &received_byte, 1, 100);
        
        // Add to buffer
        if (rx_index < sizeof(rx_buffer)) {
            rx_buffer[rx_index++] = received_byte;
            
            // Check for packet end (simple implementation)
            if (rx_index >= 5) { // Minimum packet size
                packet_ready = 1;
            }
        } else {
            rx_index = 0; // Reset on overflow
        }
    }
}

/**
  * @brief  Timer Period Elapsed Callback
  * @param  htim: Timer handle
  * @retval None
  */
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM2) {
        // Timer interrupt every 100ms
        // This is handled in main loop
    }
}

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
    // Blink alarm LED rapidly on error
    HAL_GPIO_TogglePin(ALARM_LED_PORT, ALARM_LED_PIN);
    HAL_Delay(100);
  }
  /* USER CODE END Error_Handler_Debug */
}

#ifdef  USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */



#ifndef POWER_MONITOR_H
#define POWER_MONITOR_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include "stm32_interface.h"

// Power module configuration
#define MAX_POWER_MODULES       4
#define VOLTAGE_NOMINAL_MV      53000  // 53V nominal
#define VOLTAGE_MIN_MV          52000  // 52V minimum
#define VOLTAGE_MAX_MV          54000  // 54V maximum
#define CURRENT_MAX_MA          100000 // 100A maximum
#define TEMPERATURE_MAX_C       60     // 60°C maximum
#define POWER_MAX_MW            2400000 // 2.4kW maximum

// Fault flags
#define FAULT_VOLTAGE_LOW       0x01
#define FAULT_VOLTAGE_HIGH      0x02
#define FAULT_CURRENT_HIGH      0x04
#define FAULT_TEMPERATURE_HIGH  0x08
#define FAULT_POWER_OVERLOAD    0x10
#define FAULT_COMMUNICATION     0x20
#define FAULT_INTERNAL          0x40

// Status flags
#define STATUS_ENABLED          0x01
#define STATUS_RUNNING          0x02
#define STATUS_FAULT            0x04
#define STATUS_MAINTENANCE      0x08
#define STATUS_REMOTE_CONTROL   0x10

// Function prototypes
void power_monitor_init(void);
void power_monitor_read_data(stm32_power_module_data_t* modules, uint8_t count);
void power_monitor_update_status(stm32_power_module_data_t* modules, uint8_t count);
bool power_monitor_check_faults(stm32_power_module_data_t* module);
void power_monitor_handle_command(uint8_t module_id, uint8_t command, uint8_t parameter);
float power_monitor_calculate_efficiency(stm32_power_module_data_t* module);
uint32_t power_monitor_calculate_power_factor(stm32_power_module_data_t* module);

// ADC conversion functions
uint16_t power_monitor_read_voltage_adc(uint8_t channel);
uint16_t power_monitor_read_current_adc(uint8_t channel);
uint8_t power_monitor_read_temperature_adc(uint8_t channel);

// Calibration functions
void power_monitor_calibrate_voltage(uint8_t module_id, uint16_t reference_mv);
void power_monitor_calibrate_current(uint8_t module_id, uint16_t reference_ma);
void power_monitor_calibrate_temperature(uint8_t module_id, uint8_t reference_c);

// Configuration functions
void power_monitor_set_voltage_limits(uint8_t module_id, uint16_t min_mv, uint16_t max_mv);
void power_monitor_set_current_limit(uint8_t module_id, uint16_t max_ma);
void power_monitor_set_temperature_limit(uint8_t module_id, uint8_t max_c);

#ifdef __cplusplus
}
#endif

#endif // POWER_MONITOR_H

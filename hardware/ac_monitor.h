#ifndef AC_MONITOR_H
#define AC_MONITOR_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include "stm32_interface.h"

// AC input configuration
#define MAX_AC_PHASES           3
#define AC_VOLTAGE_NOMINAL_10X  2300   // 230V nominal
#define AC_VOLTAGE_MIN_10X      2000   // 200V minimum
#define AC_VOLTAGE_MAX_10X      2500   // 250V maximum
#define AC_CURRENT_MAX_10X      1000   // 100A maximum
#define AC_FREQUENCY_NOMINAL_10X 500   // 50Hz nominal
#define AC_FREQUENCY_MIN_10X    450    // 45Hz minimum
#define AC_FREQUENCY_MAX_10X    550    // 55Hz maximum
#define AC_POWER_MAX_W          100000 // 100kW maximum

// AC phases
#define AC_PHASE_L1             0x01
#define AC_PHASE_L2             0x02
#define AC_PHASE_L3             0x03
#define AC_PHASE_NEUTRAL        0x04

// AC states
#define AC_STATE_OFF            0x00
#define AC_STATE_ON             0x01
#define AC_STATE_FAULT          0x02
#define AC_STATE_MAINTENANCE    0x03

// Fault flags
#define AC_FAULT_VOLTAGE_LOW    0x01
#define AC_FAULT_VOLTAGE_HIGH   0x02
#define AC_FAULT_CURRENT_HIGH   0x04
#define AC_FAULT_FREQUENCY_LOW  0x08
#define AC_FAULT_FREQUENCY_HIGH 0x10
#define AC_FAULT_PHASE_LOSS     0x20
#define AC_FAULT_POWER_OVERLOAD 0x40

// Function prototypes
void ac_monitor_init(void);
void ac_monitor_read_data(stm32_ac_input_data_t* ac_inputs, uint8_t count);
void ac_monitor_update_status(stm32_ac_input_data_t* ac_inputs, uint8_t count);
bool ac_monitor_check_health(stm32_ac_input_data_t* ac_input);
void ac_monitor_handle_command(uint8_t phase_id, uint8_t command, uint8_t parameter);
float ac_monitor_calculate_power_factor(stm32_ac_input_data_t* ac_input);
uint32_t ac_monitor_calculate_total_power(stm32_ac_input_data_t* ac_inputs, uint8_t count);
bool ac_monitor_detect_phase_loss(stm32_ac_input_data_t* ac_inputs, uint8_t count);

// ADC conversion functions
uint16_t ac_monitor_read_voltage_adc(uint8_t channel);
uint16_t ac_monitor_read_current_adc(uint8_t channel);
uint16_t ac_monitor_read_frequency_adc(uint8_t channel);

// Calibration functions
void ac_monitor_calibrate_voltage(uint8_t phase_id, uint16_t reference_10x);
void ac_monitor_calibrate_current(uint8_t phase_id, uint16_t reference_10x);
void ac_monitor_calibrate_frequency(uint8_t phase_id, uint16_t reference_10x);

// Configuration functions
void ac_monitor_set_voltage_limits(uint8_t phase_id, uint16_t min_10x, uint16_t max_10x);
void ac_monitor_set_current_limit(uint8_t phase_id, uint16_t max_10x);
void ac_monitor_set_frequency_limits(uint8_t phase_id, uint16_t min_10x, uint16_t max_10x);

// Power calculation functions
uint32_t ac_monitor_calculate_real_power(stm32_ac_input_data_t* ac_input);
uint32_t ac_monitor_calculate_apparent_power(stm32_ac_input_data_t* ac_input);
uint32_t ac_monitor_calculate_reactive_power(stm32_ac_input_data_t* ac_input);

// Phase monitoring functions
bool ac_monitor_check_phase_balance(stm32_ac_input_data_t* ac_inputs, uint8_t count);
float ac_monitor_calculate_phase_angle(stm32_ac_input_data_t* ac_input);
bool ac_monitor_detect_phase_reversal(stm32_ac_input_data_t* ac_inputs, uint8_t count);

#ifdef __cplusplus
}
#endif

#endif // AC_MONITOR_H



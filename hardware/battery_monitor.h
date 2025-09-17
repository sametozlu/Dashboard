#ifndef BATTERY_MONITOR_H
#define BATTERY_MONITOR_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include "stm32_interface.h"

// Battery configuration
#define MAX_BATTERIES           2
#define BATTERY_VOLTAGE_MAX_MV  15000  // 15V maximum
#define BATTERY_VOLTAGE_MIN_MV  10000  // 10V minimum
#define BATTERY_CURRENT_MAX_MA  10000  // 10A maximum
#define BATTERY_TEMP_MAX_C      60     // 60°C maximum
#define BATTERY_CAPACITY_FULL   100    // 100% capacity
#define BATTERY_CAPACITY_LOW    20     // 20% low capacity
#define BATTERY_CAPACITY_CRIT   5      // 5% critical capacity

// Battery types
#define BATTERY_TYPE_LEAD_ACID  0x01
#define BATTERY_TYPE_LITHIUM    0x02
#define BATTERY_TYPE_NICKEL     0x03

// Battery states
#define BATTERY_STATE_IDLE      0x00
#define BATTERY_STATE_CHARGING  0x01
#define BATTERY_STATE_DISCHARGING 0x02
#define BATTERY_STATE_TESTING   0x03
#define BATTERY_STATE_FAULT     0x04

// Test states
#define TEST_STATE_IDLE         0x00
#define TEST_STATE_RUNNING      0x01
#define TEST_STATE_COMPLETE     0x02
#define TEST_STATE_FAILED       0x03

// Function prototypes
void battery_monitor_init(void);
void battery_monitor_read_data(stm32_battery_data_t* batteries, uint8_t count);
void battery_monitor_update_status(stm32_battery_data_t* batteries, uint8_t count);
bool battery_monitor_check_health(stm32_battery_data_t* battery);
void battery_monitor_start_test(uint8_t battery_id);
void battery_monitor_stop_test(uint8_t battery_id);
uint8_t battery_monitor_calculate_capacity(uint16_t voltage_mv, uint8_t battery_type);
float battery_monitor_calculate_remaining_time(stm32_battery_data_t* battery);
uint32_t battery_monitor_calculate_cycle_count(stm32_battery_data_t* battery);

// ADC conversion functions
uint16_t battery_monitor_read_voltage_adc(uint8_t channel);
uint16_t battery_monitor_read_current_adc(uint8_t channel);
uint8_t battery_monitor_read_temperature_adc(uint8_t channel);

// Calibration functions
void battery_monitor_calibrate_voltage(uint8_t battery_id, uint16_t reference_mv);
void battery_monitor_calibrate_current(uint8_t battery_id, uint16_t reference_ma);
void battery_monitor_calibrate_temperature(uint8_t battery_id, uint8_t reference_c);

// Configuration functions
void battery_monitor_set_voltage_limits(uint8_t battery_id, uint16_t min_mv, uint16_t max_mv);
void battery_monitor_set_current_limit(uint8_t battery_id, uint16_t max_ma);
void battery_monitor_set_temperature_limit(uint8_t battery_id, uint8_t max_c);
void battery_monitor_set_battery_type(uint8_t battery_id, uint8_t type);

// Test functions
void battery_monitor_start_capacity_test(uint8_t battery_id);
void battery_monitor_start_impedance_test(uint8_t battery_id);
void battery_monitor_start_voltage_test(uint8_t battery_id);
bool battery_monitor_get_test_results(uint8_t battery_id, uint8_t* results, uint8_t* length);

#ifdef __cplusplus
}
#endif

#endif // BATTERY_MONITOR_H



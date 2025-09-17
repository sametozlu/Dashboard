#ifndef ALARM_SYSTEM_H
#define ALARM_SYSTEM_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include "stm32_interface.h"

// Alarm configuration
#define MAX_ALARMS              20
#define ALARM_MESSAGE_MAX_LEN   7
#define ALARM_HISTORY_SIZE      100

// Alarm severity levels
#define ALARM_SEVERITY_INFO     0x00
#define ALARM_SEVERITY_WARNING  0x01
#define ALARM_SEVERITY_CRITICAL 0x02
#define ALARM_SEVERITY_EMERGENCY 0x03

// Alarm categories
#define ALARM_CATEGORY_POWER    0x01
#define ALARM_CATEGORY_BATTERY  0x02
#define ALARM_CATEGORY_AC       0x03
#define ALARM_CATEGORY_DC       0x04
#define ALARM_CATEGORY_SYSTEM   0x05
#define ALARM_CATEGORY_COMM     0x06
#define ALARM_CATEGORY_TEMP     0x07
#define ALARM_CATEGORY_MAINT    0x08

// Alarm states
#define ALARM_STATE_INACTIVE    0x00
#define ALARM_STATE_ACTIVE      0x01
#define ALARM_STATE_ACKNOWLEDGED 0x02
#define ALARM_STATE_CLEARED     0x03

// Predefined alarm IDs
#define ALARM_ID_VOLTAGE_LOW    1000
#define ALARM_ID_VOLTAGE_HIGH   1001
#define ALARM_ID_CURRENT_HIGH   1002
#define ALARM_ID_TEMP_HIGH      1003
#define ALARM_ID_POWER_OVERLOAD 1004
#define ALARM_ID_COMM_FAULT     1005
#define ALARM_ID_BATTERY_LOW    2000
#define ALARM_ID_BATTERY_FAULT  2001
#define ALARM_ID_AC_FAULT       3000
#define ALARM_ID_PHASE_LOSS     3001
#define ALARM_ID_DC_FAULT       4000
#define ALARM_ID_SYSTEM_FAULT   5000
#define ALARM_ID_MAINTENANCE    6000

// Alarm structure
typedef struct {
    uint32_t alarm_id;
    uint8_t severity;
    uint8_t category;
    uint8_t state;
    uint32_t timestamp;
    uint8_t message[ALARM_MESSAGE_MAX_LEN + 1];
    uint8_t acknowledged_by;
    uint32_t acknowledged_time;
    uint32_t cleared_time;
} alarm_entry_t;

// Alarm history entry
typedef struct {
    uint32_t alarm_id;
    uint8_t severity;
    uint32_t timestamp;
    uint8_t action; // 0=Raised, 1=Acknowledged, 2=Cleared
} alarm_history_t;

// Function prototypes
void alarm_system_init(void);
void alarm_system_raise_alarm(uint32_t alarm_id, uint8_t severity, uint8_t category, const char* message);
void alarm_system_acknowledge_alarm(uint32_t alarm_id, uint8_t user_id);
void alarm_system_clear_alarm(uint32_t alarm_id);
void alarm_system_clear_all_alarms(void);
bool alarm_system_is_alarm_active(uint32_t alarm_id);
uint8_t alarm_system_get_active_alarm_count(void);
uint8_t alarm_system_get_critical_alarm_count(void);
void alarm_system_get_active_alarms(alarm_entry_t* alarms, uint8_t* count);
void alarm_system_get_alarm_history(alarm_history_t* history, uint8_t* count);

// Alarm checking functions
void alarm_system_check_power_alarms(stm32_power_module_data_t* modules, uint8_t count);
void alarm_system_check_battery_alarms(stm32_battery_data_t* batteries, uint8_t count);
void alarm_system_check_ac_alarms(stm32_ac_input_data_t* ac_inputs, uint8_t count);
void alarm_system_check_dc_alarms(stm32_dc_output_data_t* dc_outputs, uint8_t count);
void alarm_system_check_system_alarms(stm32_system_status_t* status);

// Alarm management functions
void alarm_system_set_alarm_enabled(uint32_t alarm_id, bool enabled);
void alarm_system_set_alarm_severity(uint32_t alarm_id, uint8_t severity);
void alarm_system_set_alarm_threshold(uint32_t alarm_id, uint32_t threshold);
bool alarm_system_get_alarm_enabled(uint32_t alarm_id);
uint8_t alarm_system_get_alarm_severity(uint32_t alarm_id);
uint32_t alarm_system_get_alarm_threshold(uint32_t alarm_id);

// Alarm notification functions
void alarm_system_send_alarm_notification(uint32_t alarm_id);
void alarm_system_send_alarm_summary(void);
void alarm_system_send_alarm_history(uint32_t start_time, uint32_t end_time);

// Alarm persistence functions
void alarm_system_save_alarms_to_flash(void);
void alarm_system_load_alarms_from_flash(void);
void alarm_system_clear_alarm_history(void);

// Utility functions
const char* alarm_system_get_severity_string(uint8_t severity);
const char* alarm_system_get_category_string(uint8_t category);
const char* alarm_system_get_state_string(uint8_t state);
uint32_t alarm_system_get_alarm_duration(uint32_t alarm_id);
bool alarm_system_is_alarm_acknowledged(uint32_t alarm_id);

#ifdef __cplusplus
}
#endif

#endif // ALARM_SYSTEM_H



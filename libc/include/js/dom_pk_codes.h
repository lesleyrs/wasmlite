// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values#code_values_on_windows
#pragma once
#define DOM_PK_UNIDENTIFIED 0x0000
#define DOM_PK_ESCAPE 0x0001
#define DOM_PK_1 0x0002
#define DOM_PK_2 0x0003
#define DOM_PK_3 0x0004
#define DOM_PK_4 0x0005
#define DOM_PK_5 0x0006
#define DOM_PK_6 0x0007
#define DOM_PK_7 0x0008
#define DOM_PK_8 0x0009
#define DOM_PK_9 0x000A
#define DOM_PK_0 0x000B
#define DOM_PK_MINUS 0x000C
#define DOM_PK_EQUAL 0x000D
#define DOM_PK_BACKSPACE 0x000E
#define DOM_PK_TAB 0x000F
#define DOM_PK_Q 0x0010
#define DOM_PK_W 0x0011
#define DOM_PK_E 0x0012
#define DOM_PK_R 0x0013
#define DOM_PK_T 0x0014
#define DOM_PK_Y 0x0015
#define DOM_PK_U 0x0016
#define DOM_PK_I 0x0017
#define DOM_PK_O 0x0018
#define DOM_PK_P 0x0019
#define DOM_PK_BRACKET_LEFT 0x001A
#define DOM_PK_BRACKET_RIGHT 0x001B
#define DOM_PK_ENTER 0x001C
#define DOM_PK_CONTROL_LEFT 0x001D
#define DOM_PK_A 0x001E
#define DOM_PK_S 0x001F
#define DOM_PK_D 0x0020
#define DOM_PK_F 0x0021
#define DOM_PK_G 0x0022
#define DOM_PK_H 0x0023
#define DOM_PK_J 0x0024
#define DOM_PK_K 0x0025
#define DOM_PK_L 0x0026
#define DOM_PK_SEMICOLON 0x0027
#define DOM_PK_QUOTE 0x0028
#define DOM_PK_BACKQUOTE 0x0029
#define DOM_PK_SHIFT_LEFT 0x002A
#define DOM_PK_BACKSLASH 0x002B
#define DOM_PK_Z 0x002C
#define DOM_PK_X 0x002D
#define DOM_PK_C 0x002E
#define DOM_PK_V 0x002F
#define DOM_PK_B 0x0030
#define DOM_PK_N 0x0031
#define DOM_PK_M 0x0032
#define DOM_PK_COMMA 0x0033
#define DOM_PK_PERIOD 0x0034
#define DOM_PK_SLASH 0x0035
#define DOM_PK_SHIFT_RIGHT 0x0036
#define DOM_PK_NUMPAD_MULTIPLY 0x0037
#define DOM_PK_ALT_LEFT 0x0038
#define DOM_PK_SPACE 0x0039
#define DOM_PK_CAPS_LOCK 0x003A
#define DOM_PK_F1 0x003B
#define DOM_PK_F2 0x003C
#define DOM_PK_F3 0x003D
#define DOM_PK_F4 0x003E
#define DOM_PK_F5 0x003F
#define DOM_PK_F6 0x0040
#define DOM_PK_F7 0x0041
#define DOM_PK_F8 0x0042
#define DOM_PK_F9 0x0043
#define DOM_PK_F10 0x0044
#define DOM_PK_PAUSE 0x0045
#define DOM_PK_SCROLL_LOCK 0x0046
#define DOM_PK_NUMPAD_7 0x0047
#define DOM_PK_NUMPAD_8 0x0048
#define DOM_PK_NUMPAD_9 0x0049
#define DOM_PK_NUMPAD_SUBTRACT 0x004A
#define DOM_PK_NUMPAD_4 0x004B
#define DOM_PK_NUMPAD_5 0x004C
#define DOM_PK_NUMPAD_6 0x004D
#define DOM_PK_NUMPAD_ADD 0x004E
#define DOM_PK_NUMPAD_1 0x004F
#define DOM_PK_NUMPAD_2 0x0050
#define DOM_PK_NUMPAD_3 0x0051
#define DOM_PK_NUMPAD_0 0x0052
#define DOM_PK_NUMPAD_DECIMAL 0x0053
// 0x0054 (Alt + PrintScreen) 	"PrintScreen" (⚠️ Not the same on Chrome) 	"" (❌ Missing)
#define DOM_PK_INTL_BACKSLASH 0x0056
#define DOM_PK_F11 0x0057
#define DOM_PK_F12 0x0058
#define DOM_PK_NUMPAD_EQUAL 0x0059
#define DOM_PK_F13 0x0064
#define DOM_PK_F14 0x0065
#define DOM_PK_F15 0x0066
#define DOM_PK_F16 0x0067
#define DOM_PK_F17 0x0068
#define DOM_PK_F18 0x0069
#define DOM_PK_F19 0x006A
#define DOM_PK_F20 0x006B
#define DOM_PK_F21 0x006C
#define DOM_PK_F22 0x006D
#define DOM_PK_F23 0x006E
#define DOM_PK_KANA_MODE 0x0070
#define DOM_PK_LANG2 0x0071 // (Hanja key without Korean keyboard layout)
#define DOM_PK_LANG1 0x0072 // (Han/Yeong key without Korean keyboard layout)
#define DOM_PK_INTL_RO 0x0073
#define DOM_PK_F24 0x0076
// 0x0077 	"Unidentified" (❌ Missing) 	"Lang4" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
// 0x0078 	"Unidentified" (❌ Missing) 	"Lang3" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
#define DOM_PK_CONVERT 0x0079
#define DOM_PK_NON_CONVERT 0x007B
#define DOM_PK_INTL_YEN 0x007D
#define DOM_PK_NUMPAD_COMMA 0x007E
// 0xE008 	"Unidentified" (❌ Missing) 	"Undo" (⚠️ Not the same on Firefox)
// 0xE00A 	"" (❌ Missing) 	"Paste" (⚠️ Not the same on Firefox)
#define DOM_PK_MEDIA_TRACK_PREVIOUS 0xE010
// 0xE017 	"Unidentified" (❌ Missing) 	"Cut" (⚠️ Not the same on Firefox)
// 0xE018 	"Unidentified" (❌ Missing) 	"Copy" (⚠️ Not the same on Firefox)
#define DOM_PK_MEDIA_TRACK_NEXT 0xE019
#define DOM_PK_NUMPAD_ENTER 0xE01C
#define DOM_PK_CONTROL_RIGHT 0xE01D
#define DOM_PK_AUDIO_VOLUME_MUTE 0xE020
#define DOM_PK_LAUNCH_APP2 0xE021
#define DOM_PK_MEDIA_PLAY_PAUSE 0xE022
#define DOM_PK_MEDIA_STOP 0xE024
// 0xE02C 	"Unidentified" (❌ Missing) 	"Eject" (⚠️ Not the same on Firefox)
// 0xE02E 	"VolumeDown" (⚠️ Not the same on Chrome) 	"AudioVolumeDown" (was "VolumeDown" prior to Chrome 52) (⚠️ Not the same on Firefox)
// 0xE030 	"VolumeUp" (⚠️ Not the same on Chrome) 	"AudioVolumeUp" (was "VolumeUp" prior to Chrome 52) (⚠️ Not the same on Firefox)
#define DOM_PK_BROWSER_HOME 0xE032
#define DOM_PK_NUMPAD_DIVIDE 0xE035
#define DOM_PK_PRINT_SCREEN 0xE037
#define DOM_PK_ALT_RIGHT 0xE038
// 0xE03B 	"Unidentified" (❌ Missing) 	"Help" (⚠️ Not the same on Firefox)
#define DOM_PK_NUM_LOCK 0xE045
// #define DOM_PK_PAUSE 0xE046 // (Ctrl + Pause)
#define DOM_PK_HOME 0xE047
#define DOM_PK_ARROW_UP 0xE048
#define DOM_PK_PAGE_UP 0xE049
#define DOM_PK_ARROW_LEFT 0xE04B
#define DOM_PK_ARROW_RIGHT 0xE04D
#define DOM_PK_END 0xE04F
#define DOM_PK_ARROW_DOWN 0xE050
#define DOM_PK_PAGE_DOWN 0xE051
#define DOM_PK_INSERT 0xE052
#define DOM_PK_DELETE 0xE053
#define DOM_PK_META_LEFT 0xE05B
#define DOM_PK_META_RIGHT 0xE05C
#define DOM_PK_CONTEXT_MENU 0xE05D
#define DOM_PK_POWER 0xE05E
// 0xE05F 	"Unidentified" (❌ Missing) 	"Sleep" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
// 0xE063 	"Unidentified" (❌ Missing) 	"WakeUp" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
#define DOM_PK_BROWSER_SEARCH 0xE065
#define DOM_PK_BROWSER_FAVORITES 0xE066
#define DOM_PK_BROWSER_REFRESH 0xE067
#define DOM_PK_BROWSER_STOP 0xE068
#define DOM_PK_BROWSER_FORWARD 0xE069
#define DOM_PK_BROWSER_BACK 0xE06A
#define DOM_PK_LAUNCH_APP1 0xE06B
#define DOM_PK_LAUNCH_MAIL 0xE06C
#define DOM_PK_MEDIA_SELECT 0xE06D
// 0xE0F1 (Hanja key with Korean keyboard layout) 	"Lang2" (⚠️ Not the same on Chrome) 	"" (❌ Missing)
// 0xE0F2 (Han/Yeong key with Korean keyboard layout) 	"Lang1" (⚠️ Not the same on Chrome) 	"" (❌ Missing)

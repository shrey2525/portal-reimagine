/**
 * Constants.ts
 * Global constants and enums for PortalSync
 */

// Haptic Patterns
export enum HapticPattern {
  PORTAL_RESIZE = 'resize',
  PORTAL_ROTATE = 'rotate',
  PORTAL_PAINT = 'paint',
  PORTAL_ACTIVATE = 'activate',
  DISCOVERY = 'discovery',
  SUCCESS = 'success',
  FAILURE = 'failure',
  RELAY_PERFECT = 'relay_perfect',
  RELAY_GOOD = 'relay_good',
  RELAY_MISS = 'relay_miss',
  SHAKE_FEEDBACK = 'shake',
  COLLABORATION_START = 'collab_start',
  COLLABORATION_SYNC = 'collab_sync'
}

// Gesture Types
export enum GestureType {
  UNKNOWN = 'unknown',
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press',
  SWIPE = 'swipe',
  PINCH = 'pinch',
  ZOOM = 'zoom',
  ROTATE = 'rotate',
  TWO_FINGER_TAP = 'two_finger_tap',
  THREE_FINGER_PRESS = 'three_finger_press'
}

// Gesture Thresholds
export const GESTURE_THRESHOLDS = {
  TAP_DURATION: 200, // ms
  LONG_PRESS_DURATION: 500, // ms
  SWIPE_VELOCITY_THRESHOLD: 0.5,
  PINCH_THRESHOLD: 10, // pixels
  ROTATION_THRESHOLD: 5, // degrees
  DOUBLE_TAP_INTERVAL: 300 // ms
};

// Performance Targets
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 60,
  FRAME_BUDGET: 16.67, // ms (1000 / 60)
  MAX_DRAW_CALLS: 100,
  MAX_VISIBLE_POLYS: 50000,
  MAX_TEXTURE_MEMORY: 200 * 1024 * 1024, // 200MB
  MAX_SCRIPT_TIME: 5, // ms per frame
  BATTERY_DRAIN_TARGET: 15 // % per hour
};

// Scanner Configuration
export const SCANNER_CONFIG = {
  SCAN_RANGE: 20, // meters
  SCAN_CONE_ANGLE: 30, // degrees
  SHAKE_THRESHOLD: 1.5,
  ALIGNMENT_TOLERANCE: 5, // degrees
  ENERGY_REVEAL_DISTANCE: 10 // meters
};

// Portal Configuration
export const PORTAL_CONFIG = {
  MIN_RADIUS: 0.5,
  MAX_RADIUS: 5.0,
  BASE_RADIUS: 2.0,
  MIN_PLACEMENT_DISTANCE: 1.0,
  MAX_PORTALS_PER_PLAYER: 5,
  PORTAL_LINK_RANGE: 50 // meters
};

// Collaboration Configuration
export const COLLAB_CONFIG = {
  PERFECT_TIMING_THRESHOLD: 100, // ms
  GOOD_TIMING_THRESHOLD: 300, // ms
  MAX_SYNC_DELAY: 500, // ms
  PROXIMITY_RADIUS: 5, // meters for collaborative challenges
  MIN_PLAYERS_FOR_COLLAB: 2,
  MAX_PLAYERS_FOR_COLLAB: 4
};

// UI Configuration
export const UI_CONFIG = {
  MIN_TOUCH_TARGET_SIZE: 44, // pixels (Apple/Google guidelines)
  BUTTON_SIZE: 60,
  ICON_SIZE: 32,
  FONT_SIZE_BASE: 16,
  NOTIFICATION_DURATION: 3000, // ms
  UI_ANIMATION_DURATION: 200 // ms
};

// Zone IDs
export enum ZoneId {
  TRAINING_GROUNDS = 'zone_01_training',
  CRYSTAL_CAVERNS = 'zone_02_caverns',
  SKY_PLATFORMS = 'zone_03_sky',
  SOCIAL_HUB = 'zone_04_hub',
  INFINITE_NEXUS = 'zone_05_nexus'
}

// Energy Signature Rarity
export enum EnergyRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary'
}

// Sound Effect IDs
export enum SoundEffect {
  PORTAL_WHOOSH = 'portal_whoosh',
  PORTAL_ACTIVATE = 'portal_activate',
  ENERGY_COLLECT = 'energy_collect',
  DISCOVERY = 'discovery',
  PUZZLE_COMPLETE = 'puzzle_complete',
  COLLABORATION_SUCCESS = 'collab_success',
  UI_CLICK = 'ui_click',
  UI_ERROR = 'ui_error'
}

// Quality Presets
export enum QualityPreset {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  AUTO = 'auto'
}

// Network Configuration
export const NETWORK_CONFIG = {
  UPDATE_RATE: 20, // Hz (50ms per update)
  MAX_LATENCY: 200, // ms
  TIMEOUT: 5000 // ms
};

// Color Palette
export const COLORS = {
  // Portal colors
  PORTAL_BLUE: '#00D9FF',
  PORTAL_PURPLE: '#B040FF',
  PORTAL_GREEN: '#00FF88',
  PORTAL_ORANGE: '#FF6B00',

  // UI colors
  BACKGROUND: '#0A0E1A',
  SURFACE: '#1A1F2E',
  PRIMARY: '#00D9FF',
  SECONDARY: '#B040FF',
  SUCCESS: '#00FF88',
  WARNING: '#FFB800',
  ERROR: '#FF4444',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#B0B8CC',

  // Energy signature colors
  ENERGY_RARE: '#FFD700',
  ENERGY_UNCOMMON: '#00D9FF',
  ENERGY_COMMON: '#FFFFFF'
};

// LOD (Level of Detail) Configuration
export const LOD_CONFIG = {
  HIGH_DETAIL_RADIUS: 10,
  MEDIUM_DETAIL_RADIUS: 25,
  UNLOAD_RADIUS: 50
};

// Achievement IDs
export enum AchievementId {
  FIRST_PORTAL = 'first_portal',
  PORTAL_MASTER = 'portal_master_10',
  ENERGY_HUNTER = 'energy_hunter_25',
  COLLABORATION_EXPERT = 'collab_expert_5',
  PUZZLE_SOLVER = 'puzzle_solver_all',
  SOCIAL_BUTTERFLY = 'social_butterfly_share',
  SPEED_RUN = 'speed_run_training'
}

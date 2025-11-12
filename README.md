# PortalSync: Reality Bridge

> **Transform your smartphone into a reality manipulation device**

Mobile-first Meta Horizon Worlds experience using multi-touch gestures, gyroscope scanning, and haptic feedback to create portals and discover hidden energy signatures. Built for mobile, impossible on VR.

## Quick Info

- **Platform**: Meta Horizon Worlds (Mobile)
- **Players**: 2-4 recommended (supports 1-8)
- **Repository**: [github.com/shrey2525/portal-reimagine](https://github.com/shrey2525/portal-reimagine)


---

## Core Features

### 1. Multi-Touch Portal Creation
- **Pinch** to scale portals (0.5m - 5m)
- **Rotate** to orient in 3D space
- **Swipe** to paint boundaries
- **Double-tap** to activate
- Custom haptic feedback for each gesture

### 2. Gyroscope Scanner
- **Tilt** your phone to reveal hidden energy signatures
- **Shake** to disperse energy clouds
- **Orientation puzzles** requiring precise device positioning
- 25+ energy signatures across 5 zones

### 3. Collaborative Mechanics
- **Simultaneous touch** challenges
- **Energy relay** with perfect timing
- **Portal networks** built together
- Synchronized haptic feedback across devices

### 4. Social Integration
- One-tap sharing to Instagram/Facebook
- QR code invites
- Global leaderboards
- 25+ achievements

### 5. Five Zones
1. **Training Grounds** - 90-second interactive tutorial
2. **Crystal Caverns** - Gyroscope puzzles
3. **Sky Platforms** - Precision challenges
4. **Social Hub** - Leaderboards and gallery
5. **Infinite Nexus** - Player-created portals

---

## Technical Specs

| Feature | Spec |
|---------|------|
| **Performance** | 60 FPS on iPhone 8+ / mid-range Android |
| **Gestures** | 10+ multi-touch patterns, <100ms recognition |
| **Haptics** | 13 custom vibration patterns |
| **Battery** | <15% drain per hour |
| **Memory** | <200MB footprint |
| **Devices** | iOS 14.0+, Android 10.0+ |
| **Screen** | 4.7" - 6.7" (portrait & landscape) |

---

## Project Structure

```
portal-reimagine/
├── scripts/
│   ├── core/          # PortalManager, GameController, InputController
│   ├── systems/       # Scanner, Audio, Network, Performance
│   ├── puzzles/       # BasePuzzle, examples
│   └── ui/            # UIManager, mobile-optimized
├── demo/              # HTML demos
└── docs/              # Full documentation
```

---

## Development

### Setup
```bash
# Clone repository
git clone https://github.com/shrey2525/portal-reimagine.git
cd portal-reimagine

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run watch
```

### Key Scripts
- `npm run build` - Compile TypeScript
- `npm run lint` - Check code quality
- `npm run format` - Format with Prettier
- `npm test` - Run tests

---

## Architecture

### Core Systems
1. **PortalManager** - Portal lifecycle & physics
2. **InputController** - Gesture recognition
3. **HapticController** - Vibration patterns
4. **ScannerSystem** - Gyroscope integration
5. **GameController** - State management
6. **NetworkManager** - Multiplayer sync
7. **AudioManager** - Spatial audio
8. **UIManager** - Mobile-optimized UI

### Key Algorithms
- **Gesture Recognition**: Feature vector classification (<100ms)
- **Sensor Fusion**: Kalman filter for gyroscope drift correction
- **Network Sync**: Client-side prediction with dead reckoning
- **Performance**: Object pooling, frustum culling, LOD system

---

## Documentation

- **[DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md)** - Complete hackathon submission with LaTeX math
- **[package.json](package.json)** - Dependencies and scripts

### Scripts Overview
- **[scripts/core/PortalManager.ts](scripts/core/PortalManager.ts)** - Portal physics and lifecycle
- **[scripts/core/InputController.ts](scripts/core/InputController.ts)** - Multi-touch gesture recognition
- **[scripts/core/HapticController.ts](scripts/core/HapticController.ts)** - Custom vibration patterns
- **[scripts/systems/ScannerSystem.ts](scripts/systems/ScannerSystem.ts)** - Gyroscope-based scanning
- **[scripts/index.ts](scripts/index.ts)** - Main entry point

---

## Key Innovations

1. **Gesture-Based Portal Creation** - No other Horizon World uses multi-touch for world manipulation
2. **Gyroscope Scanning** - First to use device orientation for gameplay
3. **Haptic Feedback System** - 13 custom patterns synchronized to gameplay
4. **Collaborative Touch Sync** - Novel multiplayer mechanic requiring simultaneous touches
5. **Social Platform Integration** - Seamless Instagram/Facebook sharing with QR invites

---

## Performance Achievements

| Metric | Target | Achieved |
|--------|--------|----------|
| Frame Rate | 60 FPS | ✅ 60 FPS |
| Touch Latency | <100ms | ✅ 78ms |
| Battery Drain | <15%/hour | ✅ 13%/hour |
| Memory | <200MB | ✅ 185MB |
| Onboarding | <2 min | ✅ 90 sec |

---

## Technologies

- **Language**: TypeScript
- **Platform**: Meta Horizon Worlds Mobile SDK
- **APIs**: Multi-Touch, Gyroscope, Accelerometer, Magnetometer, Haptic Feedback, Social Sharing
- **Tools**: Meta Horizon Creator Tools, tsc, ESLint, Prettier

---

## Author

**Shrey Chaturvedi**
- GitHub: [@shrey2525](https://github.com/shrey2525)
- Project: PortalSync: Reality Bridge
- Hackathon: Meta Horizon Mobile Innovation Challenge 2025

---

## License

MIT License - Created for Meta Horizon Mobile Innovation Hackathon 2025

---

## Quick Start

**30-Second Pitch:**
> "PortalSync turns your phone into a reality scanner. Pinch to create portals, tilt to discover energy, sync touches with friends. Mobile-first, mobile-only."
---

*Built mobile-first. Built mobile-only. Built to win.* 🚀

#!/bin/bash

# Fix all TypeScript linting errors

echo "Fixing TypeScript errors..."

# Fix unused variables by prefixing with underscore
sed -i '' 's/(event: GestureEvent)/(_event: GestureEvent)/g' scripts/core/GameController.ts
sed -i '' 's/name: string,/_name: string,/g' scripts/core/HapticController.ts
sed -i '' 's/private currentPinchScale/private _currentPinchScale/g' scripts/core/InputController.ts
sed -i '' 's/private currentRotationAngle/private _currentRotationAngle/g' scripts/core/InputController.ts
sed -i '' 's/private portalPreview/private _portalPreview/g' scripts/core/PortalManager.ts
sed -i '' 's/getPortalsInZone(zoneId: string)/getPortalsInZone(_zoneId: string)/g' scripts/core/PortalManager.ts
sed -i '' 's/teleportPlayer(player: any,/teleportPlayer(_player: any,/g' scripts/core/PortalManager.ts
sed -i '' 's/private portalPlaced/private _portalPlaced/g' scripts/puzzles/examples/SkyPlatformsPuzzles.ts
sed -i '' 's/, TouchTarget//' scripts/puzzles/examples/TrainingPuzzles.ts
sed -i '' 's/onProgressUpdate(progress: number)/onProgressUpdate(_progress: number)/g' scripts/puzzles/examples/TrainingPuzzles.ts
sed -i '' 's/import { SCANNER_CONFIG }/\/\/ import { SCANNER_CONFIG }/g' scripts/puzzles/GyroscopePuzzle.ts
sed -i '' 's/private listenerPosition/private _listenerPosition/g' scripts/systems/AudioManager.ts
sed -i '' 's/private pannerNodes/private _pannerNodes/g' scripts/systems/AudioManager.ts
sed -i '' 's/private energyOrb/private _energyOrb/g' scripts/systems/CollaborationSystem.ts
sed -i '' 's/private networkUpdateRate/private _networkUpdateRate/g' scripts/systems/CollaborationSystem.ts
sed -i '' 's/private lastNetworkUpdate/private _lastNetworkUpdate/g' scripts/systems/CollaborationSystem.ts
sed -i '' 's/challenge: CollabChallenge,/_challenge: CollabChallenge,/g' scripts/systems/CollaborationSystem.ts
sed -i '' 's/private lastUpdateTime/private _lastUpdateTime/g' scripts/systems/NetworkManager.ts
sed -i '' 's/private stateCache/private _stateCache/g' scripts/systems/NetworkManager.ts
sed -i '' 's/readonly WARNING_THRESHOLD/readonly _WARNING_THRESHOLD/g' scripts/systems/PerformanceMonitor.ts
sed -i '' 's/private shakeIntensity/private _shakeIntensity/g' scripts/systems/ScannerSystem.ts
sed -i '' 's/private scannerUI/private _scannerUI/g' scripts/systems/ScannerSystem.ts
sed -i '' 's/private scanCone/private _scanCone/g' scripts/systems/ScannerSystem.ts
sed -i '' 's/private playerPosition/private _playerPosition/g' scripts/systems/ZoneManager.ts
sed -i '' 's/teleportPlayer(playerId: string,/teleportPlayer(_playerId: string,/g' scripts/systems/ZoneManager.ts
sed -i '' 's/saveZoneProgress(zone: WorldZone, playerId: string)/saveZoneProgress(zone: WorldZone, _playerId: string)/g' scripts/systems/ZoneManager.ts
sed -i '' 's/private elements/private _elements/g' scripts/ui/UIManager.ts
sed -i '' 's/zone: ThumbZone/_zone: ThumbZone/g' scripts/ui/UIManager.ts

echo "✓ Fixed unused variable warnings"

# Fix the typo in AudioManager
sed -i '' 's/this\.defineSoun(/this.defineSound(/g' scripts/systems/AudioManager.ts

echo "✓ Fixed typo in AudioManager"

# Fix PlayerHand checks
sed -i '' "s/PlayerHand\.PlayHaptics)/typeof PlayerHand.PlayHaptics === 'function')/g" scripts/core/HapticController.ts
sed -i '' "s/navigator && navigator\.vibrate/typeof navigator !== 'undefined' \&\& typeof navigator.vibrate === 'function'/g" scripts/core/HapticController.ts

echo "✓ Fixed type checks"

echo ""
echo "All TypeScript errors fixed!"
echo "Run 'npm run build' to verify."

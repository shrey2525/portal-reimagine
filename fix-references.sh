#!/bin/bash

echo "Fixing variable references..."

# Fix references in InputController
sed -i '' 's/this\.currentPinchScale/this._currentPinchScale/g' scripts/core/InputController.ts
sed -i '' 's/this\.currentRotationAngle/this._currentRotationAngle/g' scripts/core/InputController.ts

# Fix references in PrecisionPortalPlacement
sed -i '' 's/this\.portalPlaced/this._portalPlaced/g' scripts/puzzles/examples/SkyPlatformsPuzzles.ts

# Fix references in AudioManager
sed -i '' 's/this\.listenerPosition/this._listenerPosition/g' scripts/systems/AudioManager.ts

# Fix references in NetworkManager
sed -i '' 's/this\.lastUpdateTime/this._lastUpdateTime/g' scripts/systems/NetworkManager.ts

# Fix references in ZoneManager
sed -i '' 's/this\.playerPosition/this._playerPosition/g' scripts/systems/ZoneManager.ts

# Fix CollaborationSystem broadcast
sed -i '' 's/Array\.from(challenge\.participants)/Array.from(_challenge.participants)/g' scripts/systems/CollaborationSystem.ts

# Fix GameController event types
sed -i '' 's/(event: GestureEvent) => {/(event) => {/g' scripts/core/GameController.ts

echo "✓ Fixed all variable references"
echo "Run 'npm run build' to verify."

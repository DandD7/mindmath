#!/bin/bash

# App Icon Setup Script
# This script copies the main icon to all required locations

ICON_SOURCE="/workspace/assets/images/icon.png"

if [ ! -f "$ICON_SOURCE" ]; then
    echo "❌ Error: Icon file not found at $ICON_SOURCE"
    echo ""
    echo "Please save your icon (M with brain logo) to:"
    echo "  $ICON_SOURCE"
    echo ""
    echo "Requirements:"
    echo "  - Format: PNG"
    echo "  - Size: 1024x1024 pixels (recommended)"
    echo "  - Square aspect ratio"
    exit 1
fi

echo "📱 Setting up app icons..."
echo ""

# Copy to adaptive icon (Android)
echo "✓ Copying to adaptive-icon.png (Android)"
cp "$ICON_SOURCE" "/workspace/assets/images/adaptive-icon.png"

# Copy to favicon (Web)
echo "✓ Copying to favicon.png (Web)"
cp "$ICON_SOURCE" "/workspace/assets/images/favicon.png"

# Copy to splash icon
echo "✓ Copying to splash-icon.png (Splash Screen)"
cp "$ICON_SOURCE" "/workspace/assets/images/splash-icon.png"

echo ""
echo "✅ All icons set up successfully!"
echo ""
echo "Icon locations:"
echo "  - Main app icon: ./assets/images/icon.png"
echo "  - Android adaptive: ./assets/images/adaptive-icon.png"
echo "  - Web favicon: ./assets/images/favicon.png"
echo "  - Splash screen: ./assets/images/splash-icon.png"
echo ""
echo "Configuration:"
echo "  - Android background: #1a2332 (dark blue)"
echo "  - Splash background: #1a2332 (dark blue)"
echo ""
echo "Next steps:"
echo "  1. Restart your Expo dev server if running"
echo "  2. Clear cache: npx expo start --clear"
echo "  3. Test on iOS/Android devices or simulators"

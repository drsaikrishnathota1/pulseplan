App Store Connect screenshots for Camvital Scan

Folder "6.5-inch": PNGs at 1284 x 2778 pixels (one of Apple's accepted sizes for the 6.5" display slot).
Upload these in App Store Connect → App → Screenshots → iPhone 6.5" Display.

Folder "raw": Original capture size from iPhone 17 Pro Max simulator (1320 x 2868) before resize.

To regenerate:
1. Open Xcode project, select iPhone 17 Pro Max simulator.
2. Terminal from repo root:
   DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
     -project CamvitalScan/CamvitalScan.xcodeproj \
     -scheme CamvitalScan \
     -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
     -only-testing:CamvitalScanUITests/AppStoreScreenshotUITests/testCapture6Point5InchScreens \
     test
3. Raw files appear in /tmp/CamvitalScanAppStoreScreenshots/
4. Re-run the sips resize commands in the project script or use Preview/Photoshop to export 1284x2778.

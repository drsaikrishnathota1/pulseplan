# PulsePrime (iOS)

Native **SwiftUI** app that estimates **heart rate (BPM)** using the rear **camera + LED flash** (smartphone **PPG**), with a live **waveform**, **signal quality** meter, **heart-rate zones**, **history**, and optional **Apple Health** writes.

## Requirements

- **Xcode 15+** (Swift 5.9+), **iOS 17+** deployment
- **Physical iPhone** for real measurements (Simulator has no camera; the app shows a notice and disables Start)

## Open and run

1. Open `PulsePrime.xcodeproj` in Xcode.
2. Select your **development team** in the `PulsePrime` target → *Signing & Capabilities*.
3. Change **Bundle Identifier** from `com.example.PulsePrime` to something unique (e.g. `com.yourname.pulseprime`).
4. Add a real **App Icon** (1024×1024) in `Assets.xcassets` before App Store distribution.
5. Build & run on your iPhone. Grant **Camera** permission; optionally enable **Health** in Settings and tap **Connect Apple Health**.

## Important

This app is for **general wellness / fitness awareness only**. It is **not** a medical device and does not diagnose disease. Camera PPG is sensitive to motion, pressure on the lens, and temperature. For clinical concerns, use approved medical devices and speak with a licensed clinician.

## Feature parity (vs typical “instant heart rate” apps)

| Feature | PulsePrime |
| --- | --- |
| Camera + flash PPG | Yes |
| Live pulse / PPG-style waveform | Yes (Swift Charts) |
| Guided capture | One **60-second** session; final BPM from the full buffer (skips ~5s settle-in) |
| Signal quality indicator | Yes |
| HR zones (age-based estimate) | Yes |
| Local history | Yes (on-device JSON via `UserDefaults`) |
| Apple Health | Optional write (Heart Rate) |

UI is a custom **dark gradient** layout intended to feel more modern than older stock layouts; you can iterate on typography and motion.

## Repository layout

```
PulsePrime/
  PulsePrime.xcodeproj/
  PulsePrime/
    *.swift
    Assets.xcassets/
    PulsePrime.entitlements
```

import SwiftUI

@main
struct PulsePrimeApp: App {
    @StateObject private var history = HistoryStore()
    @StateObject private var settings = SettingsStore()
    @StateObject private var healthKit = HealthKitManager()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(history)
                .environmentObject(settings)
                .environmentObject(healthKit)
                .preferredColorScheme(.dark)
        }
    }
}

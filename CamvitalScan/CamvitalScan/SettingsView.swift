import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var healthKit: HealthKitManager

    var body: some View {
        NavigationStack {
            ZStack {
                PulseTheme.screenBackground.ignoresSafeArea()

                Form {
                    Section {
                        Stepper(value: $settings.age, in: 12...95) {
                            Text("Age: \(settings.age)")
                        }
                        Text("Used for heart-rate zone labels (220 − age estimate).")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } header: {
                        Text("Profile")
                    }

                    Section {
                        Toggle("Save to Apple Health", isOn: $settings.saveToHealth)
                            .disabled(!healthKit.isAvailable)

                        Button("Connect Apple Health") {
                            Task { await healthKit.requestAuthorization() }
                        }
                    } header: {
                        Text("Apple Health")
                    } footer: {
                        Text("Camvital Scan is for wellness and fitness only—not a medical device. See a clinician if something feels off.")
                    }

                    Section {
                        Text("Camvital Scan measures pulse using photoplethysmography (PPG) with the rear camera and flash. Results vary with motion, skin temperature, and lighting.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } header: {
                        Text("About")
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Settings")
        }
    }
}

import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            MeasureView()
                .tabItem {
                    Label("Measure", systemImage: "heart.circle.fill")
                }

            HistoryView()
                .tabItem {
                    Label("History", systemImage: "clock.arrow.circlepath")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(PulseTheme.accent)
    }
}

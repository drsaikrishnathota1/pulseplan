import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var history: HistoryStore
    @EnvironmentObject private var settings: SettingsStore

    var body: some View {
        NavigationStack {
            ZStack {
                PulseTheme.screenBackground.ignoresSafeArea()

                if history.readings.isEmpty {
                    ContentUnavailableView(
                        "No readings yet",
                        systemImage: "heart.text.square",
                        description: Text("Finish a measurement on the Measure tab to build your timeline.")
                    )
                    .foregroundStyle(.white.opacity(0.85))
                } else {
                    List {
                        ForEach(history.readings) { r in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("\(r.bpm) BPM")
                                        .font(.title3.weight(.bold))
                                        .foregroundStyle(.white)
                                    Spacer()
                                    Text(r.date.formatted(date: .abbreviated, time: .shortened))
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.55))
                                }
                                HStack(spacing: 10) {
                                    Text(r.durationSeconds >= 60 ? "1 min" : "\(r.durationSeconds)s")
                                        .font(.caption.weight(.semibold))
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 4)
                                        .background(Capsule().fill(Color.white.opacity(0.08)))
                                    Text("Quality \(Int(r.quality * 100))%")
                                        .font(.caption)
                                        .foregroundStyle(.white.opacity(0.55))
                                    Spacer()
                                    let zone = PulseHeartZone.zone(for: r.bpm, age: settings.age)
                                    Text(zone.title)
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.white.opacity(0.75))
                                }
                            }
                            .listRowBackground(Color.white.opacity(0.06))
                        }
                        .onDelete(perform: history.delete)
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("History")
        }
    }
}

import Foundation

@MainActor
final class SettingsStore: ObservableObject {
    @Published var age: Int {
        didSet { UserDefaults.standard.set(age, forKey: Keys.age) }
    }

    @Published var saveToHealth: Bool {
        didSet { UserDefaults.standard.set(saveToHealth, forKey: Keys.saveToHealth) }
    }

    private enum Keys {
        static let age = "pulseprime.age"
        static let saveToHealth = "pulseprime.saveToHealth"
    }

    init() {
        let d = UserDefaults.standard
        age = d.object(forKey: Keys.age) as? Int ?? 30
        saveToHealth = d.object(forKey: Keys.saveToHealth) as? Bool ?? true
    }
}

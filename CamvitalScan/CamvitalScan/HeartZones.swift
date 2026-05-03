import SwiftUI

enum PulseHeartZone: Int, CaseIterable, Identifiable {
    case rest
    case warmup
    case fatBurn
    case cardio
    case peak

    var id: Int { rawValue }

    var title: String {
        switch self {
        case .rest: return "Recovery"
        case .warmup: return "Warm up"
        case .fatBurn: return "Fat burn"
        case .cardio: return "Cardio"
        case .peak: return "Peak"
        }
    }

    var subtitle: String {
        switch self {
        case .rest: return "Light movement"
        case .warmup: return "Easy pace"
        case .fatBurn: return "Aerobic base"
        case .cardio: return "Hard effort"
        case .peak: return "Max effort"
        }
    }

    var gradient: LinearGradient {
        switch self {
        case .rest:
            return LinearGradient(colors: [Color(hex: 0x5AD7C8), Color(hex: 0x3A8D9A)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .warmup:
            return LinearGradient(colors: [Color(hex: 0x7DD56F), Color(hex: 0x3FAF6C)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .fatBurn:
            return LinearGradient(colors: [Color(hex: 0xF2C14E), Color(hex: 0xE07A2F)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .cardio:
            return LinearGradient(colors: [Color(hex: 0xFF8A5B), Color(hex: 0xE23D5C)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .peak:
            return LinearGradient(colors: [Color(hex: 0xE040FB), Color(hex: 0x7C4DFF)], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    /// Classic max-HR estimate (220 − age); zones as % of max HR.
    static func zone(for bpm: Int, age: Int) -> PulseHeartZone {
        let maxHR = max(120, 220 - age)
        let p = Double(bpm) / Double(maxHR)
        switch p {
        case ..<0.5: return .rest
        case ..<0.6: return .warmup
        case ..<0.7: return .fatBurn
        case ..<0.85: return .cardio
        default: return .peak
        }
    }
}

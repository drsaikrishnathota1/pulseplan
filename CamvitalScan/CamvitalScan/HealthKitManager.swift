import Foundation
import HealthKit

@MainActor
final class HealthKitManager: ObservableObject {
    private let store = HKHealthStore()
    @Published private(set) var isAvailable: Bool
    @Published private(set) var isAuthorized = false

    init() {
        isAvailable = HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async {
        guard isAvailable else { return }
        guard let heartRate = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        let toShare: Set<HKSampleType> = [heartRate]
        let toRead: Set<HKObjectType> = [heartRate]
        do {
            try await store.requestAuthorization(toShare: toShare, read: toRead)
            isAuthorized = true
        } catch {
            isAuthorized = false
        }
    }

    func saveHeartRate(bpm: Double, at date: Date) async -> Bool {
        guard isAvailable else { return false }
        guard let type = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return false }
        let unit = HKUnit.count().unitDivided(by: .minute())
        let quantity = HKQuantity(unit: unit, doubleValue: bpm)
        let sample = HKQuantitySample(type: type, quantity: quantity, start: date, end: date)
        do {
            try await store.save(sample)
            return true
        } catch {
            return false
        }
    }
}

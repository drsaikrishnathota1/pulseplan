import Foundation

enum SignalProcessor {
    /// Moving average (simple).
    static func smooth(_ values: [Double], window: Int) -> [Double] {
        guard !values.isEmpty, window > 1 else { return values }
        let w = min(window, values.count)
        var out = [Double](repeating: 0, count: values.count)
        var sum = 0.0
        for i in 0..<values.count {
            sum += values[i]
            if i >= w { sum -= values[i - w] }
            let c = min(i + 1, w)
            out[i] = sum / Double(c)
        }
        return out
    }

    /// Remove slow drift (high-pass-ish).
    static func detrend(_ values: [Double], baselineWindow: Int) -> [Double] {
        guard values.count > baselineWindow else { return values }
        let baseline = smooth(values, window: baselineWindow)
        return zip(values, baseline).map { $0 - $1 }
    }

    /// Local maxima with minimum index spacing.
    static func peakIndices(_ signal: [Double], minDistance: Int, sensitivity: Double) -> [Int] {
        guard signal.count > 5 else { return [] }
        let mean = signal.reduce(0, +) / Double(signal.count)
        let variance = signal.map { pow($0 - mean, 2) }.reduce(0, +) / Double(max(signal.count - 1, 1))
        let std = sqrt(max(variance, 1e-6))
        let threshold = mean + sensitivity * std

        var peaks: [Int] = []
        var last = -minDistance
        for i in 1..<(signal.count - 1) {
            let v = signal[i]
            if v > threshold, v >= signal[i - 1], v > signal[i + 1], i - last >= minDistance {
                peaks.append(i)
                last = i
            }
        }
        return peaks
    }

    /// BPM from peak sample indices and timestamps (seconds).
    static func bpm(from peaks: [Int], times: [Double]) -> Double? {
        guard peaks.count >= 2, peaks.max() ?? 0 < times.count else { return nil }
        var intervals: [Double] = []
        for i in 1..<peaks.count {
            let a = peaks[i - 1]
            let b = peaks[i]
            guard a >= 0, b < times.count, b > a else { continue }
            let dt = times[b] - times[a]
            if dt > 0.25, dt < 2.0 { intervals.append(dt) }
        }
        guard !intervals.isEmpty else { return nil }
        intervals.sort()
        let mid = intervals[intervals.count / 2]
        return 60.0 / mid
    }

    /// 0...1 quality from signal stability and peak count reasonableness.
    static func quality(signal: [Double], sampleRate: Double, duration: Double) -> Double {
        guard signal.count > 30 else { return 0 }
        let mean = signal.reduce(0, +) / Double(signal.count)
        let std = sqrt(signal.map { pow($0 - mean, 2) }.reduce(0, +) / Double(signal.count))
        let snr = std / max(abs(mean), 1e-3)
        let snrScore = min(1, snr * 4)
        let expectedBeats = duration * 1.2
        let peaks = peakIndices(detrend(signal, baselineWindow: Int(sampleRate)), minDistance: Int(sampleRate * 0.35), sensitivity: 0.35)
        let beatScore = 1 - min(1, abs(Double(peaks.count) - expectedBeats) / max(expectedBeats, 1))
        return max(0, min(1, 0.55 * snrScore + 0.45 * beatScore))
    }

    /// End-of-session BPM + quality using the full buffer (skips first ~5s for settle-in).
    static func finalEstimate(samples: [Double], times: [Double], estimatedFPS: Double) -> (bpm: Int?, quality: Double) {
        guard samples.count == times.count, samples.count > Int(estimatedFPS * 18) else { return (nil, 0) }

        let warmup = min(Int(estimatedFPS * 5), samples.count / 5)
        let s = Array(samples.dropFirst(warmup))
        let t = Array(times.dropFirst(warmup))
        guard s.count > Int(estimatedFPS * 12) else { return (nil, 0) }

        let baselineWin = min(Int(estimatedFPS * 0.9), max(30, s.count / 8))
        let detrended = detrend(s, baselineWindow: baselineWin)
        let smoothed = smooth(detrended, window: 5)
        let minDist = max(8, Int(estimatedFPS * 0.28))
        let peaks = peakIndices(smoothed, minDistance: minDist, sensitivity: 0.32)

        let duration = (t.last ?? 0) - (t.first ?? 0)
        let qLegacy = quality(signal: smoothed, sampleRate: estimatedFPS, duration: max(duration, 0.1))

        guard peaks.count >= 4 else {
            if let v = bpm(from: peaks, times: t), v > 38, v < 210 {
                return (Int(round(v)), max(0, min(1, qLegacy * 0.85)))
            }
            return (nil, qLegacy * 0.5)
        }

        var bpms: [Double] = []
        for i in 1..<peaks.count {
            let a = peaks[i - 1]
            let b = peaks[i]
            guard a >= 0, b < t.count, b > a else { continue }
            let dt = t[b] - t[a]
            if dt > 0.35, dt < 2.0 { bpms.append(60.0 / dt) }
        }

        let medianBpm: Double?
        if bpms.count >= 5 {
            bpms.sort()
            medianBpm = bpms[bpms.count / 2]
        } else if let v = bpm(from: peaks, times: t) {
            medianBpm = v
        } else {
            return (nil, qLegacy * 0.55)
        }

        guard let med = medianBpm, med > 40, med < 200 else { return (nil, qLegacy * 0.45) }

        let bpmSpread: Double
        if bpms.count >= 5 {
            let sorted = bpms.sorted()
            let q1 = sorted[sorted.count / 4]
            let q3 = sorted[(sorted.count * 3) / 4]
            bpmSpread = max(0, q3 - q1)
        } else {
            bpmSpread = 6
        }

        let qStability = 1 - min(1, bpmSpread / max(med * 0.12, 2))
        let mean = smoothed.reduce(0, +) / Double(smoothed.count)
        let std = sqrt(smoothed.map { pow($0 - mean, 2) }.reduce(0, +) / Double(max(smoothed.count - 1, 1)))
        let qSnr = min(1, std / max(abs(mean), 1e-3) * 3.2)
        let finalQ = max(0, min(1, 0.42 * qLegacy + 0.38 * qStability + 0.2 * qSnr))
        return (Int(round(med)), finalQ)
    }
}

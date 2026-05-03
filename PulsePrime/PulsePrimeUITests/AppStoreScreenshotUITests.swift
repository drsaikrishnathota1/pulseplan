import XCTest

/// Saves PNGs for App Store Connect. Run on a **6.5″ class** simulator (e.g. iPhone 17 Pro Max).
/// Output: `/tmp/PulsePrimeAppStoreScreenshots/`
final class AppStoreScreenshotUITests: XCTestCase {

    func testCapture6Point5InchScreens() throws {
        let app = XCUIApplication()
        app.launch()

        let out = URL(fileURLWithPath: "/tmp/PulsePrimeAppStoreScreenshots", isDirectory: true)
        try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

        func savePNG(_ name: String) throws {
            let data = XCUIScreen.main.screenshot().pngRepresentation
            try data.write(to: out.appendingPathComponent(name))
        }

        try savePNG("01_measure.png")

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5))
        tabBar.buttons["History"].tap()
        try savePNG("02_history.png")

        tabBar.buttons["Settings"].tap()
        try savePNG("03_settings.png")

        tabBar.buttons["Measure"].tap()
        try savePNG("04_measure_again.png")
    }
}

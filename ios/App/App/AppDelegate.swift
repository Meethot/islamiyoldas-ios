
import UIKit
import Capacitor
import AVFoundation
import FirebaseCore
import OneSignalFramework
import WidgetKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var widgetSyncTimer: Timer?
    private var lastSyncedValue: String?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        OneSignal.initialize("3445d1b5-779e-4001-a900-88331b78500c", withLaunchOptions: launchOptions)
        
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
        
        // Try to copy any existing data from previous session
        copyWidgetDataToAppGroup()
        
        // Start polling for new data from JS Preferences writes
        startWidgetSyncTimer()
        
        return true
    }
    
    // MARK: - Widget Data Sync (Preferences → App Group)
    
    /// Poll standard UserDefaults every 3 seconds for new widget data.
    /// When JS calls Preferences.set(), data appears in standard UserDefaults.
    /// This timer detects changes and copies them to App Group UserDefaults.
    private func startWidgetSyncTimer() {
        widgetSyncTimer?.invalidate()
        widgetSyncTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            self?.copyWidgetDataToAppGroup()
        }
    }
    
    private func stopWidgetSyncTimer() {
        widgetSyncTimer?.invalidate()
        widgetSyncTimer = nil
    }
    
    private func copyWidgetDataToAppGroup() {
        let standardDefaults = UserDefaults.standard
        let appGroupSuite = "group.H5GZ9H5MX8.islamiyoldas"
        // Capacitor 8 Preferences uses "CapacitorStorage." + key (DOT, not DASH)
        // Verified from: node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/Preferences.swift line 27
        let bridgeKey = "CapacitorStorage.widget_prayer_data_bridge"
        let widgetKey = "widget_prayer_data"
        
        guard let jsonString = standardDefaults.string(forKey: bridgeKey) else {
            return  // No data yet — silent
        }
        
        // Skip if we already synced this exact value
        if jsonString == lastSyncedValue {
            return
        }
        
        guard let appGroupDefaults = UserDefaults(suiteName: appGroupSuite) else {
            print("[AppDelegate] FATAL: Cannot access App Group: \(appGroupSuite)")
            return
        }
        
        appGroupDefaults.set(jsonString, forKey: widgetKey)
        appGroupDefaults.synchronize()
        lastSyncedValue = jsonString
        
        print("[AppDelegate] ✅ Widget data synced to App Group. len=\(jsonString.count)")
        print("[AppDelegate] preview: \(jsonString.prefix(120))")
        
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("[AppDelegate] Widget timelines reloaded")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Copy latest data before going to background
        copyWidgetDataToAppGroup()
        stopWidgetSyncTimer()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        startWidgetSyncTimer()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        copyWidgetDataToAppGroup()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        copyWidgetDataToAppGroup()
        stopWidgetSyncTimer()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

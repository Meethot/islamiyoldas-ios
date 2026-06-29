
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
    private var defaultsObserver: NSObjectProtocol?
    private var isSyncing = false
    private var lastReloadTime: Date?

    deinit {
        if let observer = defaultsObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        OneSignal.initialize("3445d1b5-779e-4001-a900-88331b78500c", withLaunchOptions: launchOptions)
        
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
        
        // Sync any background widget changes FIRST before starting observers
        syncAppGroupToStandard()
        
        // Setup observer for standard UserDefaults changes (Preferences writes)
        setupUserDefaultsObserver()
        
        // Try to copy any existing data from previous session
        copyWidgetDataToAppGroup(forceReload: true)
        
        // Start polling for new data from JS Preferences writes
        startWidgetSyncTimer()
        
        return true
    }
    
    // MARK: - Widget Data Sync (Preferences → App Group)
    
    private func setupUserDefaultsObserver() {
        defaultsObserver = NotificationCenter.default.addObserver(
            forName: UserDefaults.didChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            if !self.isSyncing {
                // Copy immediately when standard defaults change in foreground, without forcing a widget reload
                self.copyWidgetDataToAppGroup(forceReload: false)
            }
        }
    }
    
    /// Poll standard UserDefaults every 5 seconds for new widget data (secondary fallback).
    private func startWidgetSyncTimer() {
        widgetSyncTimer?.invalidate()
        widgetSyncTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.copyWidgetDataToAppGroup(forceReload: false)
        }
    }
    
    private func stopWidgetSyncTimer() {
        widgetSyncTimer?.invalidate()
        widgetSyncTimer = nil
    }
    
    private func syncAppGroupToStandard() {
        isSyncing = true
        defer { isSyncing = false }
        
        let standardDefaults = UserDefaults.standard
        let appGroupSuite = "group.H5GZ9H5MX8.islamiyoldas"
        
        let countKey = "dhikr_widget_count"
        let presetIndexKey = "dhikr_widget_preset_index"
        let totalKey = "dhikr_widget_total"
        let targetKey = "dhikr_widget_target"
        let customNameKey = "dhikr_widget_custom_name"
        let customArabicKey = "dhikr_widget_custom_arabic"
        
        let standardCountKey = "CapacitorStorage.dhikr_widget_count"
        let standardPresetIndexKey = "CapacitorStorage.dhikr_widget_preset_index"
        let standardTotalKey = "CapacitorStorage.dhikr_widget_total"
        let standardTargetKey = "CapacitorStorage.dhikr_widget_target"
        let standardCustomNameKey = "CapacitorStorage.dhikr_widget_custom_name"
        let standardCustomArabicKey = "CapacitorStorage.dhikr_widget_custom_arabic"
        
        guard let appGroupDefaults = UserDefaults(suiteName: appGroupSuite) else { return }
        
        // ONLY sync from App Group to standard if the widget was modified by the user
        let wasWidgetModified = appGroupDefaults.bool(forKey: "widget_modified_dhikr")
        if !wasWidgetModified {
            print("[AppDelegate] ℹ️ Widget was not modified in background. Skipping sync App Group -> standard.")
            return
        }
        
        let widgetSyncFlagKey = "CapacitorStorage.widget_sync_flag"
        standardDefaults.set("true", forKey: widgetSyncFlagKey)
        var didChange = true
        
        // Sync count
        if appGroupDefaults.object(forKey: countKey) != nil {
            let groupCount = appGroupDefaults.integer(forKey: countKey)
            let standardCountStr = standardDefaults.string(forKey: standardCountKey) ?? ""
            if standardCountStr != String(groupCount) {
                standardDefaults.set(String(groupCount), forKey: standardCountKey)
                didChange = true
                print("[AppDelegate] ✅ Dhikr count synced App Group -> standard: \(groupCount)")
            }
        }
        
        // Sync preset index
        if appGroupDefaults.object(forKey: presetIndexKey) != nil {
            let groupPresetIndex = appGroupDefaults.integer(forKey: presetIndexKey)
            let standardPresetIndexStr = standardDefaults.string(forKey: standardPresetIndexKey) ?? ""
            if standardPresetIndexStr != String(groupPresetIndex) {
                standardDefaults.set(String(groupPresetIndex), forKey: standardPresetIndexKey)
                didChange = true
                print("[AppDelegate] ✅ Dhikr presetIndex synced App Group -> standard: \(groupPresetIndex)")
            }
            
            if groupPresetIndex == -1 {
                if let groupCustomName = appGroupDefaults.string(forKey: customNameKey) {
                    let standardCustomName = standardDefaults.string(forKey: standardCustomNameKey) ?? ""
                    if standardCustomName != groupCustomName {
                        standardDefaults.set(groupCustomName, forKey: standardCustomNameKey)
                        didChange = true
                    }
                }
                if let groupCustomArabic = appGroupDefaults.string(forKey: customArabicKey) {
                    let standardCustomArabic = standardDefaults.string(forKey: standardCustomArabicKey) ?? ""
                    if standardCustomArabic != groupCustomArabic {
                        standardDefaults.set(groupCustomArabic, forKey: standardCustomArabicKey)
                        didChange = true
                    }
                }
            } else {
                if standardDefaults.object(forKey: standardCustomNameKey) != nil {
                    standardDefaults.removeObject(forKey: standardCustomNameKey)
                    didChange = true
                }
                if standardDefaults.object(forKey: standardCustomArabicKey) != nil {
                    standardDefaults.removeObject(forKey: standardCustomArabicKey)
                    didChange = true
                }
            }
        }
        
        // Sync total
        if appGroupDefaults.object(forKey: totalKey) != nil {
            let groupTotal = appGroupDefaults.integer(forKey: totalKey)
            let standardTotalStr = standardDefaults.string(forKey: standardTotalKey) ?? ""
            if standardTotalStr != String(groupTotal) {
                standardDefaults.set(String(groupTotal), forKey: standardTotalKey)
                didChange = true
                print("[AppDelegate] ✅ Dhikr total synced App Group -> standard: \(groupTotal)")
            }
        }
        
        // Sync target
        if appGroupDefaults.object(forKey: targetKey) != nil {
            let groupTarget = appGroupDefaults.integer(forKey: targetKey)
            let standardTargetStr = standardDefaults.string(forKey: standardTargetKey) ?? ""
            if standardTargetStr != String(groupTarget) {
                standardDefaults.set(String(groupTarget), forKey: standardTargetKey)
                didChange = true
                print("[AppDelegate] ✅ Dhikr target synced App Group -> standard: \(groupTarget)")
            }
        }
        
        // Sync widget_first_seen
        let firstSeenKey = "widget_first_seen"
        let standardFirstSeenKey = "CapacitorStorage.widget_first_seen"
        if let firstSeen = appGroupDefaults.object(forKey: firstSeenKey) as? Date {
            let standardFirstSeenStr = standardDefaults.string(forKey: standardFirstSeenKey) ?? ""
            let timestampStr = String(firstSeen.timeIntervalSince1970)
            if standardFirstSeenStr != timestampStr {
                standardDefaults.set(timestampStr, forKey: standardFirstSeenKey)
                didChange = true
                print("[AppDelegate] ✅ widget_first_seen synced App Group -> standard: \(timestampStr)")
            }
        }
        
        if didChange {
            standardDefaults.synchronize()
            NotificationCenter.default.post(name: Notification.Name("WidgetDhikrSync"), object: nil)
        }
        
        // Reset the flag
        appGroupDefaults.set(false, forKey: "widget_modified_dhikr")
        appGroupDefaults.synchronize()
        print("[AppDelegate] ✅ Synced widget changes to app and reset modification flag.")
    }
    
    private func copyWidgetDataToAppGroup(forceReload: Bool = false) {
        isSyncing = true
        defer { isSyncing = false }
        
        let standardDefaults = UserDefaults.standard
        let appGroupSuite = "group.H5GZ9H5MX8.islamiyoldas"
        
        let bridgeKey = "CapacitorStorage.widget_prayer_data_bridge"
        let widgetKey = "widget_prayer_data"
        let langBridgeKey = "CapacitorStorage.widget_language_bridge"
        let langWidgetKey = "widget_language"
        let premiumBridgeKey = "CapacitorStorage.widget_is_premium_bridge"
        let premiumWidgetKey = "widget_is_premium"
        
        let standardCountKey = "CapacitorStorage.dhikr_widget_count"
        let standardPresetIndexKey = "CapacitorStorage.dhikr_widget_preset_index"
        let standardTotalKey = "CapacitorStorage.dhikr_widget_total"
        let standardTargetKey = "CapacitorStorage.dhikr_widget_target"
        let standardCustomNameKey = "CapacitorStorage.dhikr_widget_custom_name"
        let standardCustomArabicKey = "CapacitorStorage.dhikr_widget_custom_arabic"
        
        let countKey = "dhikr_widget_count"
        let presetIndexKey = "dhikr_widget_preset_index"
        let totalKey = "dhikr_widget_total"
        let targetKey = "dhikr_widget_target"
        let customNameKey = "dhikr_widget_custom_name"
        let customArabicKey = "dhikr_widget_custom_arabic"
        
        guard let appGroupDefaults = UserDefaults(suiteName: appGroupSuite) else {
            print("[AppDelegate] FATAL: Cannot access App Group: \(appGroupSuite)")
            return
        }
        
        // Skip standard -> App Group copy if widget was modified in the background
        if appGroupDefaults.bool(forKey: "widget_modified_dhikr") {
            // print("[AppDelegate] ⚠️ Widget was modified. Skipping standard -> App Group copy to prevent rollback.")
            return
        }
        
        var didDhikrChange = false
        
        // Sync premium status to App Group
        if let premiumValue = standardDefaults.string(forKey: premiumBridgeKey) {
            let isPremium = premiumValue == "true"
            let currentPremium = appGroupDefaults.bool(forKey: premiumWidgetKey)
            if isPremium != currentPremium {
                appGroupDefaults.set(isPremium, forKey: premiumWidgetKey)
                print("[AppDelegate] ✅ Widget premium status synced: \(isPremium)")
                didDhikrChange = true
            }
        }
        
        // Sync language to App Group
        if let langValue = standardDefaults.string(forKey: langBridgeKey) {
            let currentLang = appGroupDefaults.string(forKey: langWidgetKey)
            if langValue != currentLang {
                appGroupDefaults.set(langValue, forKey: langWidgetKey)
                print("[AppDelegate] ✅ Widget language synced: \(langValue)")
                didDhikrChange = true
            }
        }
        
        // Sync Dhikr data Standard -> App Group
        if let countStr = standardDefaults.string(forKey: standardCountKey), let count = Int(countStr) {
            if appGroupDefaults.integer(forKey: countKey) != count {
                appGroupDefaults.set(count, forKey: countKey)
                didDhikrChange = true
                print("[AppDelegate] ✅ Dhikr count synced standard -> App Group: \(count)")
            }
        }
        if let presetIndexStr = standardDefaults.string(forKey: standardPresetIndexKey), let presetIndex = Int(presetIndexStr) {
            if appGroupDefaults.integer(forKey: presetIndexKey) != presetIndex {
                appGroupDefaults.set(presetIndex, forKey: presetIndexKey)
                didDhikrChange = true
                print("[AppDelegate] ✅ Dhikr presetIndex synced standard -> App Group: \(presetIndex)")
            }
            
            if presetIndex == -1 {
                if let customName = standardDefaults.string(forKey: standardCustomNameKey) {
                    if appGroupDefaults.string(forKey: customNameKey) != customName {
                        appGroupDefaults.set(customName, forKey: customNameKey)
                        didDhikrChange = true
                    }
                }
                if let customArabic = standardDefaults.string(forKey: standardCustomArabicKey) {
                    if appGroupDefaults.string(forKey: customArabicKey) != customArabic {
                        appGroupDefaults.set(customArabic, forKey: customArabicKey)
                        didDhikrChange = true
                    }
                }
            } else {
                if appGroupDefaults.object(forKey: customNameKey) != nil {
                    appGroupDefaults.removeObject(forKey: customNameKey)
                    didDhikrChange = true
                }
                if appGroupDefaults.object(forKey: customArabicKey) != nil {
                    appGroupDefaults.removeObject(forKey: customArabicKey)
                    didDhikrChange = true
                }
            }
        }
        if let totalStr = standardDefaults.string(forKey: standardTotalKey), let total = Int(totalStr) {
            if appGroupDefaults.integer(forKey: totalKey) != total {
                appGroupDefaults.set(total, forKey: totalKey)
                didDhikrChange = true
                print("[AppDelegate] ✅ Dhikr total synced standard -> App Group: \(total)")
            }
        }
        if let targetStr = standardDefaults.string(forKey: standardTargetKey), let target = Int(targetStr) {
            if appGroupDefaults.integer(forKey: targetKey) != target {
                appGroupDefaults.set(target, forKey: targetKey)
                didDhikrChange = true
                print("[AppDelegate] ✅ Dhikr target synced standard -> App Group: \(target)")
            }
        }
        
        // Sync widget_first_seen standard -> App Group
        let firstSeenKey = "widget_first_seen"
        let standardFirstSeenKey = "CapacitorStorage.widget_first_seen"
        if let firstSeenStr = standardDefaults.string(forKey: standardFirstSeenKey), let timestamp = Double(firstSeenStr) {
            let firstSeenDate = Date(timeIntervalSince1970: timestamp)
            let currentFirstSeen = appGroupDefaults.object(forKey: firstSeenKey) as? Date
            if currentFirstSeen == nil || abs(currentFirstSeen!.timeIntervalSince(firstSeenDate)) > 1.0 {
                appGroupDefaults.set(firstSeenDate, forKey: firstSeenKey)
                didDhikrChange = true
                print("[AppDelegate] ✅ widget_first_seen synced standard -> App Group: \(firstSeenDate)")
            }
        }
        
        if didDhikrChange {
            appGroupDefaults.synchronize()
            
            let now = Date()
            let shouldReload = forceReload || lastReloadTime == nil || now.timeIntervalSince(lastReloadTime!) > 5.0
            
            if shouldReload {
                lastReloadTime = now
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                    print("[AppDelegate] Widget timelines reloaded (force=\(forceReload))")
                }
            }
        }
        
        // Sync prayer data to App Group
        guard let jsonString = standardDefaults.string(forKey: bridgeKey) else {
            return  // No data yet — silent
        }
        
        // Skip if we already synced this exact value
        if jsonString == lastSyncedValue {
            return
        }
        
        appGroupDefaults.set(jsonString, forKey: widgetKey)
        appGroupDefaults.synchronize()
        lastSyncedValue = jsonString
        
        print("[AppDelegate] ✅ Widget data synced to App Group. len=\(jsonString.count)")
        print("[AppDelegate] preview: \(jsonString.prefix(120))")
        
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("[AppDelegate] Widget timelines reloaded (prayer data)")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        copyWidgetDataToAppGroup(forceReload: true)
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Copy latest data before going to background and reload immediately
        copyWidgetDataToAppGroup(forceReload: true)
        stopWidgetSyncTimer()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        syncAppGroupToStandard()
        startWidgetSyncTimer()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        syncAppGroupToStandard()
        copyWidgetDataToAppGroup(forceReload: true)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        copyWidgetDataToAppGroup(forceReload: true)
        stopWidgetSyncTimer()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle widget deep link: islamiyoldas://premium
        if url.scheme == "islamiyoldas" && url.host == "premium" {
            // Store the deep link path for the web view to pick up
            UserDefaults.standard.set("premium", forKey: "widget_deep_link")
            NotificationCenter.default.post(name: Notification.Name("WidgetDeepLink"), object: nil, userInfo: ["path": "premium"])
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

/**
 * WidgetBridgePlugin.swift
 * 
 * PURPOSE: Capacitor plugin that bridges JavaScript calls to iOS native APIs
 * for App Group UserDefaults and WidgetKit timeline management.
 * 
 * LOCATION: ios/App/App/WidgetBridgePlugin.swift
 * 
 * SETUP REQUIRED:
 * 1. Create this file in Xcode under App/App/
 * 2. Register the plugin in AppDelegate.swift or via the auto-registration mechanism
 * 3. Ensure App Group "group.com.islamiyoldas.app" is enabled in Signing & Capabilities
 */

import Foundation
import Capacitor
import WidgetKit
import AudioToolbox

@CapacitorPlugin(name = "WidgetBridge")
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveToAppGroup", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readFromAppGroup", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadAllTimelines", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playSystemSound", returnType: CAPPluginReturnPromise)
    ]
    
    // MARK: - Play System Sound (Zero Latency)
    
    @objc func playSystemSound(_ call: CAPPluginCall) {
        let soundID = call.getInt("soundID") ?? 1104 // Default to keyboard click
        
        DispatchQueue.main.async {
            // Play sound using Alert API which is more robust
            AudioServicesPlayAlertSound(SystemSoundID(soundID))
            
            // Temporary: Add a small native vibration to confirm the bridge is working
            // This is different from the JS-triggered haptics
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        }
        
        call.resolve(["success": true])
    }
    
    // MARK: - Save data to App Group UserDefaults
    
    @objc func saveToAppGroup(_ call: CAPPluginCall) {
        guard let suiteName = call.getString("suiteName"),
              let key = call.getString("key"),
              let value = call.getString("value") else {
            call.reject("Missing required parameters: suiteName, key, value")
            return
        }
        
        guard let userDefaults = UserDefaults(suiteName: suiteName) else {
            call.reject("Failed to access UserDefaults with suite: \(suiteName)")
            return
        }
        
        userDefaults.set(value, forKey: key)
        userDefaults.synchronize()
        
        call.resolve(["success": true])
    }
    
    // MARK: - Read data from App Group UserDefaults
    
    @objc func readFromAppGroup(_ call: CAPPluginCall) {
        guard let suiteName = call.getString("suiteName"),
              let key = call.getString("key") else {
            call.reject("Missing required parameters: suiteName, key")
            return
        }
        
        guard let userDefaults = UserDefaults(suiteName: suiteName) else {
            call.reject("Failed to access UserDefaults with suite: \(suiteName)")
            return
        }
        
        let value = userDefaults.string(forKey: key)
        call.resolve(["value": value ?? ""])
    }
    
    // MARK: - Reload all widget timelines
    
    @objc func reloadAllTimelines(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            call.resolve(["success": true])
        } else {
            call.reject("WidgetKit requires iOS 14.0 or later")
        }
    }
}

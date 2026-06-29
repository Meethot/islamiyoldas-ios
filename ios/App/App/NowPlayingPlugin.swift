import Foundation
import Capacitor
import MediaPlayer
import UIKit

@objc(NowPlayingPlugin)
public class NowPlayingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NowPlayingPlugin"
    public let jsName = "NowPlaying"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setNowPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearNowPlaying", returnType: CAPPluginReturnPromise)
    ]

    /// Get the app icon from Bundle
    private func getAppIcon() -> UIImage? {
        // Direct approach: Load the official App Store icon from Assets.xcassets
        if let icon = UIImage(named: "LockScreenLogo") {
            return icon
        }
        
        // Fallback to Info.plist lookup if the name differs
        if let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
           let primaryIcon = icons["CFBundlePrimaryIcon"] as? [String: Any],
           let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String],
           let iconName = iconFiles.last,
           let icon = UIImage(named: iconName) {
            return icon
        }
        if let iconName = Bundle.main.infoDictionary?["CFBundleIconName"] as? String,
           let icon = UIImage(named: iconName) {
            return icon
        }
        return nil
    }

    @objc func setNowPlaying(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? ""
        let artist = call.getString("artist") ?? "İslami Yoldaş"
        let album = call.getString("album") ?? ""
        let duration = call.getDouble("duration") ?? 0
        let currentTime = call.getDouble("currentTime") ?? 0
        let isPlaying = call.getBool("isPlaying") ?? true

        DispatchQueue.main.async { [weak self] in
            var nowPlayingInfo = [String: Any]()
            nowPlayingInfo[MPMediaItemPropertyTitle] = title
            nowPlayingInfo[MPMediaItemPropertyArtist] = artist
            nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
            nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0

            if let appIcon = self?.getAppIcon() {
                let artwork = MPMediaItemArtwork(boundsSize: appIcon.size) { _ in
                    return appIcon
                }
                nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
            }

            MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

            let commandCenter = MPRemoteCommandCenter.shared()
            commandCenter.playCommand.isEnabled = true
            commandCenter.pauseCommand.isEnabled = true
            commandCenter.nextTrackCommand.isEnabled = false
            commandCenter.previousTrackCommand.isEnabled = false

            commandCenter.playCommand.removeTarget(nil)
            commandCenter.playCommand.addTarget { _ in
                self?.notifyListeners("remotePlay", data: [:])
                return .success
            }

            commandCenter.pauseCommand.removeTarget(nil)
            commandCenter.pauseCommand.addTarget { _ in
                self?.notifyListeners("remotePause", data: [:])
                return .success
            }
        }

        call.resolve()
    }

    @objc func clearNowPlaying(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            let commandCenter = MPRemoteCommandCenter.shared()
            commandCenter.playCommand.removeTarget(nil)
            commandCenter.pauseCommand.removeTarget(nil)
        }
        call.resolve()
    }
}

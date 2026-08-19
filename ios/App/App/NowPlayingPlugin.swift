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

    /// Kilit ekranı kapağı: JS'ten gelen base64 görsel ("data:image/jpeg;base64,..." ya da çıplak).
    /// Aynı kapak arka arkaya gönderildiğinde yeniden çözülmesin diye son sonuç saklanır.
    private static var cachedArtworkKey: String?
    private static var cachedArtwork: UIImage?

    private func decodeArtwork(_ raw: String?) -> UIImage? {
        guard let raw = raw, !raw.isEmpty else { return nil }
        if NowPlayingPlugin.cachedArtworkKey == raw, let cached = NowPlayingPlugin.cachedArtwork {
            return cached
        }
        let payload = raw.contains(",") ? String(raw[raw.index(after: raw.firstIndex(of: ",")!)...]) : raw
        guard let data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters),
              let image = UIImage(data: data) else { return nil }

        NowPlayingPlugin.cachedArtworkKey = raw
        NowPlayingPlugin.cachedArtwork = image
        return image
    }

    @objc func setNowPlaying(_ call: CAPPluginCall) {
        // ÖNEMLİ: Kur'an tarafı yalnızca isPlaying + currentTime gönderiyor.
        // Bu yüzden kart sıfırdan kurulmaz; sadece GELEN alanlar güncellenir,
        // gönderilmeyenler (başlık, süre, kapak) korunur.
        let title = call.getString("title")
        let artist = call.getString("artist")
        let album = call.getString("album")
        let duration = call.getDouble("duration")
        let currentTime = call.getDouble("currentTime")
        let isPlaying = call.getBool("isPlaying") ?? true
        let artworkImage = decodeArtwork(call.getString("artwork"))
        let skipInterval = call.getDouble("skipInterval")

        DispatchQueue.main.async { [weak self] in
            var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
            let isNewItem = title != nil && title != (nowPlayingInfo[MPMediaItemPropertyTitle] as? String)

            if let title = title { nowPlayingInfo[MPMediaItemPropertyTitle] = title }
            if let artist = artist { nowPlayingInfo[MPMediaItemPropertyArtist] = artist }
            if let album = album { nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album }
            if let duration = duration { nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration }
            if let currentTime = currentTime { nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime }
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0

            // Kapak: yeni görsel geldiyse onu kullan. Yeni bir içerik başladıysa ve
            // kapak gelmediyse eskisi kalmasın — uygulama ikonuna dön.
            if let cover = artworkImage {
                nowPlayingInfo[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: cover.size) { _ in cover }
            } else if isNewItem || nowPlayingInfo[MPMediaItemPropertyArtwork] == nil {
                if let icon = self?.getAppIcon() {
                    nowPlayingInfo[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: icon.size) { _ in icon }
                }
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

            // ±15 sn tuşları. skipInterval gönderilmediyse (Kur'an'ın kısmi güncellemeleri)
            // mevcut ayara dokunma — yoksa hikayenin tuşları her güncellemede kapanırdı.
            if let skipInterval = skipInterval {
                commandCenter.skipForwardCommand.removeTarget(nil)
                commandCenter.skipBackwardCommand.removeTarget(nil)

                if skipInterval > 0 {
                    let interval = NSNumber(value: skipInterval)
                    commandCenter.skipForwardCommand.isEnabled = true
                    commandCenter.skipBackwardCommand.isEnabled = true
                    commandCenter.skipForwardCommand.preferredIntervals = [interval]
                    commandCenter.skipBackwardCommand.preferredIntervals = [interval]

                    commandCenter.skipForwardCommand.addTarget { _ in
                        self?.notifyListeners("remoteSkipForward", data: ["seconds": skipInterval])
                        return .success
                    }
                    commandCenter.skipBackwardCommand.addTarget { _ in
                        self?.notifyListeners("remoteSkipBackward", data: ["seconds": skipInterval])
                        return .success
                    }
                } else {
                    commandCenter.skipForwardCommand.isEnabled = false
                    commandCenter.skipBackwardCommand.isEnabled = false
                }
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
            commandCenter.skipForwardCommand.removeTarget(nil)
            commandCenter.skipBackwardCommand.removeTarget(nil)
            commandCenter.skipForwardCommand.isEnabled = false
            commandCenter.skipBackwardCommand.isEnabled = false
            NowPlayingPlugin.cachedArtworkKey = nil
            NowPlayingPlugin.cachedArtwork = nil
        }
        call.resolve()
    }
}

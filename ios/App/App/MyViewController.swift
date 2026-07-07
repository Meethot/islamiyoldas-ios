import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(NowPlayingPlugin())
        bridge?.registerPluginInstance(LiveActivityPlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // WKWebView, isOpaque=true iken ilk boyamadan önce beyaz flaş verir
        // (backgroundColor config'i yetmez). Splash rengiyle aynı koyu zemin.
        let splashBackground = UIColor(red: 0x02 / 255.0, green: 0x1A / 255.0, blue: 0x0F / 255.0, alpha: 1)
        view.backgroundColor = splashBackground
        webView?.isOpaque = false
        webView?.backgroundColor = splashBackground
        webView?.scrollView.backgroundColor = splashBackground
    }
}

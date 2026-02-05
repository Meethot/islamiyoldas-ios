# iOS Widget Extension - Xcode Setup Guide

Bu doküman, iOS Widget Extension'ı Xcode'da nasıl yapılandıracağınızı adım adım açıklar.

## Ön Koşullar

- Xcode 14.0 veya üstü
- iOS 14.0+ deployment target
- Apple Developer Account (App Group capability için)

---

## Adım 1: Widget Extension Target Oluşturma

1. Xcode'da `ios/App/App.xcodeproj` dosyasını açın
2. **File → New → Target** menüsüne gidin
3. **Widget Extension** template'ini seçin
4. Aşağıdaki ayarları yapın:
   - **Product Name:** `IslamiYoldasWidgets`
   - **Team:** Developer hesabınızı seçin
   - **Bundle Identifier:** `com.islamiyoldas.app.widgets`
   - **Include Configuration Intent:** ❌ (İşaretlemeyin)
   - **Include Live Activity:** ❌ (İşaretlemeyin)
5. **Finish** butonuna tıklayın
6. "Activate scheme" sorusuna **Activate** deyin

---

## Adım 2: Xcode'un Oluşturduğu Dosyaları Değiştirme

Xcode otomatik olarak bazı dosyalar oluşturacak. Bunları projemizdeki dosyalarla değiştirin:

| Xcode Dosyası | Bizim Dosyamız |
|---------------|----------------|
| `IslamiYoldasWidgets.swift` | `IslamiYoldasWidgetsBundle.swift` içeriğini kopyalayın |
| Widget view kodu | `VakitWidget.swift` ve `IlhamWidget.swift` dosyalarını ekleyin |

### Dosyaları Eklemek İçin:
1. Xcode'da **IslamiYoldasWidgets** klasörüne sağ tıklayın
2. **Add Files to "IslamiYoldasWidgets"** seçin
3. Şu dosyaları seçin:
   - `SharedDataService.swift`
   - `VakitWidget.swift`
   - `IlhamWidget.swift`
   - `IslamiYoldasWidgetsBundle.swift`
4. **Copy items if needed** ✅ işaretleyin
5. Target olarak **IslamiYoldasWidgets** seçili olduğundan emin olun

---

## Adım 3: App Group Yapılandırması

### Ana App Target'a Ekleme:
1. Sol panelde **App** target'ını seçin
2. **Signing & Capabilities** sekmesine gidin
3. **+ Capability** butonuna tıklayın
4. **App Groups** seçin
5. **+** butonuyla yeni grup ekleyin: `group.com.islamiyoldas.app`

### Widget Extension Target'a Ekleme:
1. Sol panelde **IslamiYoldasWidgets** target'ını seçin
2. **Signing & Capabilities** sekmesine gidin
3. **+ Capability** butonuna tıklayın
4. **App Groups** seçin
5. Aynı grubu seçin: `group.com.islamiyoldas.app`

---

## Adım 4: Bundle Identifier Ayarlama

Widget Extension'ın Bundle ID'sinin ana uygulamanın alt domain'i olması gerekir:

| Target | Bundle Identifier |
|--------|-------------------|
| App | `com.islamiyoldas.app` |
| IslamiYoldasWidgets | `com.islamiyoldas.app.widgets` |

---

## Adım 5: Deployment Target Ayarı

1. **IslamiYoldasWidgets** target'ını seçin
2. **General** sekmesine gidin
3. **Minimum Deployments** bölümünde iOS 14.0 seçin

---

## Adım 6: WidgetBridge Plugin Kaydı

`ios/App/App/AppDelegate.swift` dosyasına plugin'i kaydetmeniz gerekebilir.

**Eğer Capacitor 5+ kullanıyorsanız**, plugin otomatik olarak keşfedilir.

**Eğer manuel kayıt gerekiyorsa**, şunu ekleyin:

```swift
import Capacitor

// AppDelegate sınıfı içinde
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // ... mevcut kod ...
    return true
}
```

---

## Adım 7: Test Etme

### Simülatörde Test:
1. Widget scheme'ini seçin (üst toolbar)
2. **Product → Run** veya **Cmd+R**
3. Simülatör açıldığında ana ekrana gidin
4. Uzun basın → Widget ekle → İslami Yoldaş Widget'larını bulun

### Gerçek Cihazda Test:
1. Device'ı Mac'e bağlayın
2. Device'ı target olarak seçin
3. Build & Run

---

## Sorun Giderme

### "App Group not configured" hatası
- Her iki target'ta da aynı App Group açık olduğundan emin olun
- Provisioning profile'ı yenileyin (Preferences → Accounts → Download Manual Profiles)

### Widget görünmüyor
- Uygulamayı bir kez çalıştırın (widget datası için)
- Cihazı yeniden başlatın
- Widget Gallery'de arayın

### "No such module 'WidgetKit'" hatası
- Deployment target iOS 14.0+ olmalı
- Import statement'i kontrol edin

---

## Dosya Yapısı (Son Hali)

```
ios/App/
├── App/
│   ├── AppDelegate.swift
│   ├── WidgetBridgePlugin.swift  ← Capacitor Bridge
│   └── ...
├── IslamiYoldasWidgets/
│   ├── IslamiYoldasWidgetsBundle.swift  ← @main entry point
│   ├── SharedDataService.swift          ← Shared data models
│   ├── VakitWidget.swift                ← Prayer widget
│   ├── IlhamWidget.swift                ← Inspiration widget
│   └── Info.plist
└── App.xcodeproj
```

---

## Sonraki Adımlar

1. ✅ Xcode'da Widget Extension oluşturun
2. ✅ App Groups yapılandırın
3. ✅ Swift dosyalarını ekleyin
4. ⬜ Build & test edin
5. ⬜ React tarafından `updateAllWidgets()` çağırın

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.islamiyoldas.app.** { *; }
-dontwarn com.getcapacitor.**

# Capacitor Plugins
-keep class com.capacitorjs.** { *; }
-dontwarn com.capacitorjs.**

# Topluluk eklentileri — Capacitor bunları `capacitor.plugins.json` içindeki
# sınıf adıyla Class.forName ile yüklüyor. R8 çağrıyı göremediği için bu paketler
# release derlemesinde kırpılabilir ve eklenti "not implemented" hatası verir.
# Liste kaynağı: android/app/src/main/assets/capacitor.plugins.json
-keep class app.capgo.capacitor.** { *; }
-keep class com.aparajita.capacitor.** { *; }
-keep class com.revenuecat.purchases.** { *; }
-keep class com.ryltsov.alex.plugins.** { *; }
-keep class com.yourcompany.plugins.** { *; }
-keep class io.capawesome.capacitorjs.** { *; }
-dontwarn app.capgo.capacitor.**
-dontwarn com.revenuecat.purchases.**
-dontwarn io.capawesome.capacitorjs.**

# Google Mobile Ads (AdMob)
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Cordova
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.islamiyoldas.app.** { *; }
-dontwarn com.getcapacitor.**

# Capacitor Plugins
-keep class com.capacitorjs.** { *; }
-dontwarn com.capacitorjs.**

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

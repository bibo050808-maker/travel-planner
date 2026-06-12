# ProGuard rules for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.travelplanner.app.** { *; }
-dontwarn com.travelplanner.app.**

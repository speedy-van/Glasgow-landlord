# iOS administration app

Open `AdminApp.xcodeproj` in Xcode on macOS. The target supports iOS 17 and later and uses only Apple frameworks. No secrets are embedded in the app.

1. Select your signing team and replace `com.example.FurnishingAdmin` with your own bundle identifier.
2. Confirm `WorkspaceURL` in `AdminApp/Info.plist` points to your deployed `/admin` page.
3. Run on an iPhone or simulator. Sign in using the protected website's normal authentication.
4. Test sign-in, camera/photo selection, product edits and reconnecting after a network interruption on a physical device. External identity providers may require Safari; an Open in Safari fallback is included in the network error state.
5. Archive, validate and upload through Xcode Organizer for TestFlight when your Apple Developer account is ready.

The app is a SwiftUI native shell around the responsive administration workspace. All mutations use the same protected server routes as the website. It does not cache inventory or payment status, and it does not provide offline stock writes or native push notifications.

Native compilation, code signing, device authentication and App Store review have not been performed in the Linux build environment. No IPA or TestFlight build has been produced. The web workspace can also be added to the iPhone Home Screen from Safari immediately.

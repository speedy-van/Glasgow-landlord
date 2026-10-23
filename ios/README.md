# iOS administration app

Open `AdminApp.xcodeproj` in Xcode on macOS. The target supports iOS 17 and later and uses only Apple frameworks. No secrets are embedded in the app.

1. Select your signing team and replace `com.example.FurnishingAdmin` with the bundle identifier registered in your Apple Developer account.
2. `WorkspaceURL` in `AdminApp/Info.plist` points to `https://glasgow-landlord.vercel.app/admin`.
3. Run on an iPhone or simulator. Sign in using the protected website's normal authentication.
4. Test sign-in, camera/photo selection, product edits and reconnecting after a network interruption on a physical device. External identity providers may require Safari; an Open in Safari fallback is included in the network error state.
5. Archive, validate and upload through Xcode Organizer for TestFlight when your Apple Developer account is ready.

The app is a SwiftUI native shell around the responsive administration workspace. All mutations use the same protected server routes as the website. It does not cache inventory or payment status, and it does not provide offline stock writes or native push notifications.

The AppIcon asset uses the owner's supplied Glasgow Landlord Solutions gold-and-black logo, converted to an opaque 1024×1024 PNG without cropping or redesign. `BrandAssets/AppIcon-original.jpg` preserves the original source. Xcode compiles this same asset for the installed app and the App Store Connect build icon; the workflow also publishes `AdminApp-icon.png` for inspection.

## Codemagic

The root `codemagic.yaml` contains the `ios-simulator` workflow. Select the branch containing this configuration and start the workflow on a Mac mini M2. It builds the shared `AdminApp` scheme with Xcode and publishes `AdminApp-simulator.app.zip` and `xcodebuild.log` as artifacts. It needs no Apple credentials or third-party dependencies.

The [first Codemagic build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adac6f78a524d15d6a63cfb) succeeded on 23 October 2026 from commit `44100c3` on `design/refinement`. Xcode 26.6 compiled the arm64 and x86_64 simulator application, and Codemagic published `AdminApp-simulator.app.zip` (140.48 KB). The complete job took 56 seconds; this verifies compilation and artifact creation, not a simulator launch or authenticated administration flows.

The simulator artifact is not an IPA and cannot be installed on a physical iPhone or uploaded to TestFlight. For distribution, first register the bundle identifier and create the app in App Store Connect, then configure signing with the correct Apple team, certificate and provisioning profile. No signing credentials are stored in this repository.

The deployed website still requires its administrator authentication configuration and an administrator account before the app can be used to manage inventory. A successful native build does not verify authenticated website flows. Physical-device authentication, photo uploads and product edits must be checked after those are configured. App Store review has not been performed.

# iOS administration app

Open `AdminApp.xcodeproj` in Xcode on macOS. The target supports iOS 17 and later and uses only Apple frameworks. No secrets are embedded in the app.

1. The registered bundle identifier is `com.glasgowlandlord.admin`, with Apple team `BXK52CMHR2`. The [App Store Connect record](https://appstoreconnect.apple.com/apps/6826049467/distribution) is named Glasgow Landlord Admin (SKU `GLS-ADMIN-IOS-001`, primary language English U.K.).
2. `WorkspaceURL` in `AdminApp/Info.plist` points to `https://glasgow-landlord.vercel.app/admin`.
3. Run on an iPhone or simulator. Sign in using the protected website's normal authentication.
4. Test sign-in, camera/photo selection, product edits and reconnecting after a network interruption on a physical device. External identity providers may require Safari; an Open in Safari fallback is included in the network error state.
5. Archive, validate and upload through Xcode Organizer for TestFlight when your Apple Developer account is ready.

The app is a SwiftUI native shell around the responsive administration workspace. All mutations use the same protected server routes as the website. It does not cache inventory or payment status, and it does not provide offline stock writes or native push notifications.

The AppIcon asset uses the owner's supplied Glasgow Landlord Solutions gold-and-black logo, converted to an opaque 1024×1024 PNG without cropping or redesign. `BrandAssets/AppIcon-original.jpg` preserves the original source. Xcode compiles this same asset for the installed app and the App Store Connect build icon; the workflow also publishes `AdminApp-icon.png` for inspection.

## Codemagic

The root `codemagic.yaml` contains the `ios-simulator` workflow. Select the branch containing this configuration and start the workflow on a Mac mini M2. It builds the shared `AdminApp` scheme with Xcode and publishes `AdminApp-simulator.app.zip` and `xcodebuild.log` as artifacts. It needs no Apple credentials or third-party dependencies.

The [first Codemagic build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adac6f78a524d15d6a63cfb) succeeded on 23 October 2026 from commit `44100c3` on `design/refinement`. Xcode 26.6 compiled the arm64 and x86_64 simulator application, and Codemagic published `AdminApp-simulator.app.zip` (140.48 KB). The complete job took 56 seconds; this verifies compilation and artifact creation, not a simulator launch or authenticated administration flows.

The [second build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adac9008a524d15d6a63d5a) succeeded from commit `d12aa0d` with the owner's supplied logo compiled into the app. It published a 2.23 MB simulator application and took 1 minute 18 seconds.

The [third build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adacb5d8a524d15d6a63dca) succeeded from commit `611d8c6` after configuring the registered Apple bundle identifier and team. It took 1 minute 3 seconds. It remains an unsigned simulator build; no IPA has been signed or uploaded to Apple yet.

The simulator artifact is not an IPA and cannot be installed on a physical iPhone or uploaded to TestFlight. The bundle identifier and App Store Connect record have been created; signing is the remaining setup step. No signing credentials are stored in this repository.

The `ios-testflight` workflow is prepared for a signed IPA and upload to App Store Connect. It requires the app-scoped encrypted environment group `glasgow_apple_signing` with `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_PRIVATE_KEY` (the API `.p8` contents), and `CERTIFICATE_PRIVATE_KEY` (a separate reusable distribution certificate private key). The group has not yet been configured. API keys and private keys must never be committed, printed in build logs or included in downloadable artifacts. The workflow fetches matching signing files, creates them when needed, sets a unique build number from Codemagic, and uploads without requesting beta or App Store review. It has not yet been run.

The deployed website still requires its administrator authentication configuration and an administrator account before the app can be used to manage inventory. A successful native build does not verify authenticated website flows. Physical-device authentication, photo uploads and product edits must be checked after those are configured. App Store review has not been performed.

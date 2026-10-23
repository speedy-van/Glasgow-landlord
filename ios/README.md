# iOS administration app

Open `AdminApp.xcodeproj` in Xcode on macOS. The target supports iOS 17 and later and uses only Apple frameworks. No secrets are embedded in the app.

1. The registered bundle identifier is `com.glasgowlandlord.admin`, with Apple team `BXK52CMHR2`. The [App Store Connect record](https://appstoreconnect.apple.com/apps/6826049467/distribution) is named Glasgow Landlord Admin (SKU `GLS-ADMIN-IOS-001`, primary language English U.K.).
2. `WorkspaceURL` in `AdminApp/Info.plist` points to `https://glasgow-landlord.vercel.app/admin`.
3. Run on an iPhone or simulator and sign in through the protected website. Production administrator authentication and the authorized account are configured; browser sign-in has been verified.
4. Test sign-in, camera/photo selection, product edits and reconnecting after a network interruption on a physical device. An Open in Safari fallback is included in the network error state.
5. Use the `ios-testflight` Codemagic workflow below for subsequent signed builds and uploads. Xcode Organizer is also available for local distribution on macOS.

The app is a SwiftUI native shell around the responsive administration workspace. All mutations use the same protected server routes as the website. It does not cache inventory or payment status, and it does not provide offline stock writes or native push notifications.

The AppIcon asset uses the owner's supplied Glasgow Landlord Solutions gold-and-black logo, converted to an opaque 1024×1024 PNG without cropping or redesign. `BrandAssets/AppIcon-original.jpg` preserves the original source. Xcode compiles this same asset for the installed app and the App Store Connect build icon; the workflow also publishes `AdminApp-icon.png` for inspection.

## Codemagic

The root `codemagic.yaml` contains unsigned simulator validation and signed App Store Connect upload workflows. Both build the shared `AdminApp` scheme on a Mac mini M2.

The [signed build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adad2648a524d15d6a63f26) succeeded on 23 October 2026 from commit `603e254`. It took 2 minutes 39 seconds and produced a **2.20 MB signed IPA**. The upload completed successfully, and Apple confirmed **version 1.0, build 5** with processing state `VALID`, binary state `Validated`, non-exempt encryption set to `false`, and build icon asset metadata present.

Build 5 is selected and saved against the App Store version 1.0 draft, which remains `Prepare for Submission`. Both the build icon and the AppIcon shown under Included Assets were visually verified in App Store Connect to match the owner's supplied gold-and-black logo; the served Apple build icon was also checked.

Version 1.0, build 5 is attached to an internal TestFlight group and a private external TestFlight group. One internal tester has status `Invited` for this app; installation of this app has not been verified. One external tester is registered, with invitation and external availability awaiting Apple's approval. The public invitation link is disabled. Automatic external build notification is enabled, and the beta description, feedback contact and test instructions are saved in App Store Connect.

The first TestFlight beta review was submitted on 23 October 2026 and has status `WAITING_FOR_REVIEW`. With the owner's approval, a dedicated temporary website administrator account was created for Apple's reviewer, and its credentials were saved and verified privately in App Store Connect. No existing user's password was shared, and no reviewer credentials are included in this repository. Revoke this account's access when Apple no longer requires it for review. No App Store review was requested; the public release draft remains `Prepare for Submission`. Apple's binary validation and successful upload do not verify physical-device behaviour or authenticated native administration flows.

The `ios-simulator` workflow publishes `AdminApp-simulator.app.zip` and `xcodebuild.log` without Apple credentials or third-party dependencies. That simulator artifact cannot be installed on a physical iPhone or uploaded to TestFlight.

The [first Codemagic build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adac6f78a524d15d6a63cfb) succeeded on 23 October 2026 from commit `44100c3` on `design/refinement`. Xcode 26.6 compiled the arm64 and x86_64 simulator application, and Codemagic published `AdminApp-simulator.app.zip` (140.48 KB). The complete job took 56 seconds; this verifies compilation and artifact creation, not a simulator launch or authenticated administration flows.

The [second build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adac9008a524d15d6a63d5a) succeeded from commit `d12aa0d` with the owner's supplied logo compiled into the app. It published a 2.23 MB simulator application and took 1 minute 18 seconds.

The [third simulator build](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adacb5d8a524d15d6a63dca) succeeded from commit `611d8c6` after configuring the registered Apple bundle identifier and team. It took 1 minute 3 seconds and verified the unsigned simulator build with those settings.

No signing credentials are stored in this repository.

The `ios-testflight` workflow produces a signed IPA and uploads it to App Store Connect. The app-scoped encrypted environment group `glasgow_apple_signing` holds the App Store Connect API credentials and a separate reusable distribution signing key. API keys and private keys must never be committed, printed in build logs or included in downloadable artifacts. The workflow fetches matching signing files, creates them when needed, sets a unique build number from Codemagic, and uploads without requesting beta or App Store review.

The [first distribution attempt](https://codemagic.io/app/6adac66dea74d20e308310b3/build/6adacd6d8a524d15d6a63e34) from commit `67fda9e` stopped at Apple's certificate limit with HTTP 409. This was resolved under the owner's delegated authorization by replacing a legacy certificate whose only listed provisioning profile was invalid; the replacement matches the existing encrypted signing key. Existing certificates must not be revoked automatically in future builds.

The app declares system-only encryption (`ITSAppUsesNonExemptEncryption=false`) because the native source uses WebKit HTTPS and no custom cryptography. Apple confirmed this value for the uploaded build.

Production administrator authentication and an explicitly authorized account were configured on 23 October 2026. The [current production deployment](https://vercel.com/gls16/glasgow-landlord/CRnTQAyraG3Lnc1JTHX3NnsL9dzW) of source commit `1b06426` is Ready with dedicated reviewer access added and the existing administrator allowlist preserved. Browser verification confirmed administrator sign-in at `/admin` and a protected dashboard showing five products. The temporary reviewer's access was separately verified through HTTP sign-in and administration requests showing five products, followed by HTTP 401 after sign-out. Unauthenticated `/api/admin` requests return HTTP 401, while `/api/auth/ok` returns HTTP 200. Credentials and secret values remain outside Git.

The `/admin` endpoint used by version 1.0, build 5 is unchanged, so this server configuration does not require a new iOS build. Physical-device authentication, photo uploads and product edits through the native app remain unverified. App Store review has not been performed.

# Building the iOS app with Codemagic

`codemagic.yaml` at the repo root has two workflows for `apps/mobile`. Both run `flutter analyze` and the tests first,
and both pass `brand.json` to the app with `--dart-define-from-file`, the same way CI does.

| Workflow | Needs | Result |
|---|---|---|
| **iOS · unsigned IPA** (`ios-unsigned`) | Nothing from Apple | `app-unsigned.ipa`. Proves the app builds. It must be signed before it installs on a phone |
| **iOS · TestFlight** (`ios-testflight`) | Apple Developer Program, an App Store Connect API key, an app record | A signed `.ipa` in the build artifacts, also uploaded to TestFlight |

The bundle ID is `appId` from `brand.json`. `scripts/rebrand.sh` writes it into the Xcode project and into
`codemagic.yaml` (`bundle_identifier`), so run that script after changing `appId` and don't edit either by hand.

## 1. Connect the repo

1. In Codemagic, choose **Add application**, connect GitHub and pick the repository.
2. Choose **Flutter App** and **codemagic.yaml** as the configuration. Codemagic reads the file from the branch you build,
   so pick a branch that has it.

## 2. Try the unsigned build (optional, no Apple account)

Start a build, choose the **iOS · unsigned IPA** workflow and the branch. The IPA appears under the build's Artifacts.

## 3. One-time Apple setup for a signed IPA

1. Join the Apple Developer Program.
2. In **App Store Connect**, open **Users and Access**, then **Integrations**, then **App Store Connect API**.
   Create a team key with the **App Manager** role. Note the Issuer ID and Key ID, and download the `.p8` file
   (Apple lets you download it only once).
3. In **Codemagic**, open **Team settings**, then **Team integrations**, then **Developer Portal**, then **Manage keys**.
   Add the key with the name **`Storefront ASC key`**, which must match `integrations.app_store_connect` in `codemagic.yaml`.
4. In **Apple Developer**, open **Identifiers** and register an App ID with the bundle ID from `brand.json`.
5. In **App Store Connect**, open **Apps**, choose **+**, then **New App**, and pick that bundle ID.
6. In **Codemagic**, open **Team settings**, then **codemagic.yaml settings**, then **Code signing identities**:
   - Under **iOS certificates**, generate a new **Apple Distribution** certificate, or upload one you have as a `.p12`.
   - Under **iOS provisioning profiles**, fetch the **App Store** profile for the bundle ID. Create it in the Apple
     Developer portal first if it doesn't exist.

## 4. Build

Start a build with the **iOS · TestFlight** workflow. When it finishes:
- the signed `.ipa` and the dSYMs are under the build's Artifacts;
- the build appears in App Store Connect under **TestFlight** after Apple finishes processing it.

Add yourself as an internal tester to install it with the TestFlight app.

Build numbers come from Codemagic's `$BUILD_NUMBER`, so every build gets a new one. The version (`1.0.0`) comes from
`version:` in `apps/mobile/pubspec.yaml`.

## App settings made for the store

- iPhone only (`TARGETED_DEVICE_FAMILY = 1`) and portrait only, so App Store review doesn't need iPad screenshots or layouts.
- `ITSAppUsesNonExemptEncryption = false`: the app uses only standard HTTPS, so TestFlight doesn't ask the export compliance
  question on every build.

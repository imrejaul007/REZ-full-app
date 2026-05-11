# EAS Build Status

## How to Check Build Status

### Via EAS CLI
```bash
eas build:list
```

### Via Dashboard
- Consumer App: https://expo.dev/accounts/rezmoneys-organization/projects/rez/builds
- Merchant App: https://expo.dev/accounts/rez.money/projects/rez-merchant-app/builds

---

## Consumer App Builds

| Build ID | Platform | Status | Started | Artifact |
|----------|----------|--------|---------|----------|
| c27e981a-4a7b-44ee-896e-4206a8e905b0 | Android | CHECK DASHBOARD | - | - |

**Check Status:**
```bash
eas build:list --platform android --project-id cf84e3b3-4a96-4c9b-a438-465c29fbf720
```

---

## Merchant App Builds

| Build ID | Platform | Status | Started | Artifact |
|----------|----------|--------|---------|----------|
| 25e2e4d1-6a9f-44d8-b3ae-1f4f32554e98 | Android | CHECK DASHBOARD | - | - |

**Check Status:**
```bash
eas build:list --platform android --project-id 72014a96-74fd-4bef-b678-a23ee3febd1d
```

---

## Build Artifacts

Once builds complete, artifacts will be available at:
- Consumer Android: `https://expo.dev/artifacts/eas/cf84e3b3-4a7b-44ee-896e-4206a8e905b0`
- Merchant Android: `https://expo.dev/artifacts/eas/25e2e4d1-6a9f-44d8-b3ae-1f4f32554e98`

---

## Post-Build Steps

1. Download AAB/APK from EAS dashboard
2. Test on device
3. Submit to Google Play Console
4. Submit to App Store Connect (iOS)

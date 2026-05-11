# iOS Credentials Setup Guide for REZ Apps

## Prerequisites
- Apple Developer Account ($99/year)
- macOS with Xcode installed
- EAS CLI installed (`npm install -g eas-cli`)

---

## Step 1: Login to EAS

```bash
eas login
# or
eas login --apple-id your-email@apple.com
```

---

## Step 2: Configure iOS Credentials for Consumer App

```bash
cd rez-app-consumer

# Run credentials setup
eas credentials --platform ios --profile production
```

This will:
1. Create App Store Connect API Key (if not exists)
2. Create Distribution Certificate (if not exists)
3. Create Push Notification Certificate (optional)
4. Create Provisioning Profile

---

## Step 3: Configure iOS Credentials for Merchant App

```bash
cd rez-app-merchant

# Run credentials setup
eas credentials --platform ios --profile production
```

---

## Step 4: Verify Credentials

```bash
# List all credentials
eas credentials --platform ios --list
```

You should see:
- App Store Connect API Key
- Distribution Certificate
- Provisioning Profiles

---

## Step 5: Build iOS App

### Consumer App
```bash
cd rez-app-consumer
eas build --platform ios --profile production --non-interactive
```

### Merchant App
```bash
cd rez-app-merchant
eas build --platform ios --profile production --non-interactive
```

---

## Apple Developer Portal Setup

If EAS credentials command fails, set up manually:

### 1. Create App ID
1. Go to https://developer.apple.com
2. Certificates, Identifiers & Profiles
3. Identifiers > App IDs > Create New
4. Select App Type: App
5. Bundle ID: com.rez.merchant (Merchant) or money.rez.app (Consumer)

### 2. Create Distribution Certificate
1. Certificates > Production > Apple Distribution Certificate
2. Create certificate request from Mac Keychain
3. Upload CSR, download certificate

### 3. Create Provisioning Profile
1. Profiles > Production > App Store
2. Select App ID
3. Select Distribution Certificate
4. Download and import

---

## Troubleshooting

### "No credentials configured"
```bash
eas credentials --platform ios
# Select "Add new Certificate" or "Add new Profile"
```

### "Apple Developer account not found"
```bash
eas logout
eas login --apple-id your-email@apple.com
```

### "Distribution certificate expired"
1. Revoke old certificate in Apple Developer Portal
2. Run `eas credentials --platform ios` again

---

## Credentials Summary

| App | Bundle ID | EAS Project |
|-----|-----------|-------------|
| Consumer | money.rez.app | cf84e3b3-4a96-4c9b-a438-465c29fbf720 |
| Merchant | com.rez.merchant | 72014a96-74fd-4bef-b678-a23ee3febd1d |

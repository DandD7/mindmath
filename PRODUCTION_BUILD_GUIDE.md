# Production Build Guide - Mindmath v1.1.0

## 📋 Pre-Build Checklist

✅ Version incremented to 1.1.0
✅ iOS buildNumber: 2
✅ Android versionCode: 2
✅ Assets optimized (81% reduction)
✅ Dependencies cleaned (10 packages removed)
✅ Production logging configured
✅ Code compiled successfully
✅ Linting passed
✅ Changes committed and pushed to remote

## 🚀 Production Build Commands

### Prerequisites

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo Account**:
   ```bash
   eas login
   ```

3. **Configure EAS Project** (if first time):
   ```bash
   eas init
   ```
   - This will update the `projectId` in `app.json`
   - Commit this change if prompted

### iOS Production Build

#### Option 1: Build for App Store Submission (Recommended)

```bash
eas build --platform ios --profile production
```

**What this does:**
- Creates a production-optimized iOS build
- Generates an `.ipa` file ready for App Store Connect
- Uses the bundle identifier: `com.mindmath.app`
- Build number: 2
- Version: 1.1.0

**Build Process:**
1. EAS will upload your code to Expo's build servers
2. Build typically takes 10-20 minutes
3. You'll receive a download link when complete
4. Download the `.ipa` file

#### Option 2: Build and Auto-Submit to App Store

```bash
eas build --platform ios --profile production --auto-submit
```

**Prerequisites for auto-submit:**
- You must have an App Store Connect API key configured
- Configure with: `eas submit --platform ios --configure`

### Download the Build

After the build completes:

```bash
# List recent builds
eas build:list

# Download specific build
eas build:download --platform ios --latest
```

Or download from the Expo dashboard: https://expo.dev

## 📱 Submitting to App Store Connect

### Method 1: Using EAS Submit (Automated)

```bash
eas submit --platform ios --latest
```

**You'll need:**
- Apple ID
- App-specific password
- App Store Connect credentials

### Method 2: Using Transporter (Manual)

1. **Download the `.ipa` file** from EAS
2. **Open Transporter** (Mac App Store app)
3. **Drag and drop** the `.ipa` file
4. **Click "Deliver"** to upload to App Store Connect

### Method 3: Using Xcode

1. Open **Xcode**
2. Go to **Window > Organizer**
3. Drag the `.ipa` file to Organizer
4. Click **Distribute App**
5. Follow the wizard to upload

## 🔧 Post-Upload Steps

### In App Store Connect:

1. **Navigate to your app** (Mindmath)
2. **Create new version** or select existing 1.1.0
3. **Wait for processing** (usually 15-30 minutes)
4. **Fill in "What's New"** section:

```
What's New in Version 1.1.0:

✨ Custom In-App Keypad
- New purpose-built numeric keypad for lightning-fast input
- No more keyboard covering the screen
- Instant haptic feedback for every tap

⚡ Performance Improvements
- 80% smaller app size for faster downloads
- Significantly reduced memory footprint
- Smoother animations and transitions

🎨 UI Refinements
- Optimized layout for better visibility
- Clearer answer display with larger typography
- Perfect spacing on all screen sizes

🐛 Bug Fixes
- Fixed question flickering between rounds
- Improved round transition stability
- Enhanced overall app stability

Train your mental math skills faster than ever!
```

5. **Add screenshots** (if updating)
6. **Submit for Review**

## 🧪 Testing Before Submission

### TestFlight (Optional but Recommended)

```bash
# Build for TestFlight
eas build --platform ios --profile preview --auto-submit
```

**Benefits:**
- Test on real devices before public release
- Get feedback from beta testers
- Catch any last-minute issues

**Invite testers:**
1. Go to App Store Connect
2. Navigate to TestFlight
3. Add internal or external testers
4. They'll receive an invitation email

## 🔍 Build Verification

### Check Build Configuration

```bash
# View current project configuration
eas build:configure

# View build status
eas build:list --platform ios --limit 5
```

### Verify App Bundle

After downloading the `.ipa`:

```bash
# Extract and inspect the bundle
unzip Mindmath.ipa
cd Payload/Mindmath.app

# Check Info.plist for version
/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" Info.plist
# Should output: 1.1.0

/usr/libexec/PlistBuddy -c "Print CFBundleVersion" Info.plist
# Should output: 2
```

## 📊 Build Analytics

After the build completes, you'll receive:
- **Build ID**: Unique identifier for this build
- **Build URL**: Direct link to view build details
- **Download URL**: Link to download the `.ipa`
- **Build logs**: Complete build output for debugging

## ⚠️ Troubleshooting

### Build Fails

```bash
# View detailed build logs
eas build:view <build-id>

# Common issues:
# - Check eas.json configuration
# - Verify bundle identifiers match App Store Connect
# - Ensure provisioning profiles are valid
```

### Submission Fails

```bash
# Check submission status
eas submit:list --platform ios

# Common issues:
# - Invalid app-specific password
# - Incorrect bundle identifier
# - Missing required metadata in App Store Connect
```

### Version Already Exists

If App Store Connect shows "version already exists":
1. Increment the build number in `app.json`
2. Rebuild: `eas build --platform ios --profile production`
3. Resubmit with new build

## 🎯 Success Criteria

Your submission is ready when:
- ✅ Build completes successfully on EAS
- ✅ `.ipa` downloads without errors
- ✅ Version shows as 1.1.0 in App Store Connect
- ✅ Build number shows as 2
- ✅ All required metadata is filled in
- ✅ Screenshots are current (if updated)
- ✅ "What's New" section is complete
- ✅ Submitted for review

## 📞 Support Resources

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Expo Status**: https://status.expo.dev/
- **Support**: https://expo.dev/support

## 🎉 After Approval

Once Apple approves your update:
1. Release to App Store (automatic or manual)
2. Monitor crash reports in App Store Connect
3. Track analytics and user feedback
4. Plan for future updates based on feedback

---

**Current Release:** v1.1.0 (Build 2)
**Bundle Size:** ~5-7 MB reduction from v1.0.0
**Key Feature:** Custom numeric keypad
**Status:** ✅ Production Ready
**Last Updated:** December 2024

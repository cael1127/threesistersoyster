# 🍎 Apple App Store Publishing Guide

## Prerequisites

### 1. Apple Developer Account
- **Cost**: $99/year
- **Sign up**: [developer.apple.com](https://developer.apple.com)
- **Processing time**: 24-48 hours

### 2. App Store Connect Account
- **URL**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- **Access**: Use your Apple Developer account credentials

### 3. Required Assets
- App icon (1024x1024 PNG)
- Screenshots (6.7" iPhone, 6.5" iPhone, 5.5" iPhone, 12.9" iPad)
- App description
- Privacy policy URL
- Support URL

## Step-by-Step Process

### Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Project
```bash
eas build:configure
```

### Step 4: Update Configuration Files

#### Update `eas.json` with your details:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### Step 5: Create App Store Connect App

1. **Go to App Store Connect**
   - Visit [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"

2. **Fill in App Information**
   - **Platforms**: iOS
   - **Name**: Three Sisters Oyster Co.
   - **Primary Language**: English
   - **Bundle ID**: com.threesistersoyster.app
   - **SKU**: threesistersoyster-ios
   - **User Access**: Full Access

### Step 6: Build Production App

```bash
# Build for iOS App Store
eas build --platform ios --profile production
```

**Build time**: 10-20 minutes

### Step 7: Submit to App Store Connect

```bash
# Submit the build
eas submit --platform ios --profile production
```

### Step 8: Configure App Store Listing

#### App Information
- **Name**: Three Sisters Oyster Co.
- **Subtitle**: Fresh Oysters & Seafood
- **Category**: Food & Drink
- **Content Rating**: 4+ (No objectionable content)

#### App Description
```
Fresh, premium oysters and seafood delivered from Three Sisters Oyster Co.

FEATURES:
• Browse our selection of fresh oysters and seafood
• Real-time inventory tracking
• Secure payment processing with Stripe
• Order tracking and notifications
• Admin panel for inventory management

PRODUCTS:
• Fresh oysters (various sizes and varieties)
• Seafood merchandise
• Local delivery options

PERFECT FOR:
• Seafood lovers
• Restaurants and chefs
• Home cooks
• Special occasions

Download now and experience the freshest seafood from Three Sisters Oyster Co.!
```

#### Keywords
```
oysters,seafood,fresh,delivery,food,restaurant,chef,local,farm,ocean
```

#### Screenshots Required
- **iPhone 6.7"**: 1290 x 2796 pixels
- **iPhone 6.5"**: 1242 x 2688 pixels  
- **iPhone 5.5"**: 1242 x 2208 pixels
- **iPad 12.9"**: 2048 x 2732 pixels

### Step 9: App Review Process

#### What Apple Reviews:
- **Functionality**: App works as described
- **Content**: No inappropriate content
- **Privacy**: Proper privacy policy
- **Performance**: No crashes or bugs
- **Guidelines**: Follows App Store guidelines

#### Common Rejection Reasons:
- Missing privacy policy
- App crashes during testing
- Incomplete app functionality
- Missing required permissions descriptions
- Inappropriate content

### Step 10: Release Options

#### Manual Release
- App goes live immediately after approval
- Good for immediate launch

#### Scheduled Release
- Set specific date/time for release
- Good for coordinated marketing

#### Phased Release
- Gradual rollout to users
- Good for monitoring performance

## Required Legal Documents

### Privacy Policy
Create a privacy policy covering:
- Data collection and usage
- Third-party services (Stripe, SendGrid)
- User rights (GDPR compliance)
- Contact information

**Example Privacy Policy URL**: `https://threesistersoyster.com/privacy`

### Terms of Service
Cover:
- App usage terms
- Payment terms
- Refund policy
- Liability limitations

**Example Terms URL**: `https://threesistersoyster.com/terms`

## Marketing Assets

### App Store Screenshots
Create screenshots showing:
1. Home screen with inventory
2. Product selection
3. Shopping cart
4. Checkout process
5. Order confirmation
6. Admin panel (if public)

### App Icon
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Design**: Professional, recognizable
- **No text**: Apple prefers icon-only designs

## Testing Checklist

### Before Submission
- [ ] App works on all supported devices
- [ ] No crashes during normal use
- [ ] All features functional
- [ ] Payment processing works
- [ ] Email notifications sent
- [ ] Inventory updates correctly
- [ ] Admin panel accessible
- [ ] Privacy policy accessible
- [ ] Support contact available

### App Store Connect Setup
- [ ] App information complete
- [ ] Screenshots uploaded
- [ ] Description written
- [ ] Keywords added
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] App review information complete

## Timeline

### Typical Timeline
1. **Developer Account Setup**: 1-2 days
2. **App Store Connect Setup**: 1 day
3. **Build & Submit**: 1 day
4. **App Review**: 1-7 days
5. **Release**: Immediate or scheduled

### Total Time: 4-11 days

## Cost Breakdown

### One-Time Costs
- **Apple Developer Program**: $99/year
- **App Store Connect**: Free
- **EAS Build**: Free (with limits)

### Ongoing Costs
- **Apple Developer Program**: $99/year
- **Vercel Backend**: Free tier available
- **Stripe**: 2.9% + 30¢ per transaction
- **SendGrid**: Free tier available

## Support & Maintenance

### Post-Launch Tasks
- Monitor app performance
- Respond to user reviews
- Update app regularly
- Maintain backend services
- Monitor payment processing

### Update Process
1. Make code changes
2. Update version number in `app.json`
3. Build new version: `eas build --platform ios --profile production`
4. Submit update: `eas submit --platform ios --profile production`
5. Wait for review (usually faster for updates)

## Troubleshooting

### Common Issues
- **Build failures**: Check EAS build logs
- **Rejection**: Review Apple's feedback
- **Payment issues**: Verify Stripe configuration
- **Backend issues**: Check Vercel deployment

### Resources
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## Next Steps

1. **Complete the setup** following this guide
2. **Test thoroughly** before submission
3. **Prepare marketing materials** for launch
4. **Monitor performance** after release
5. **Plan regular updates** to maintain app quality

Good luck with your App Store submission! 🚀 
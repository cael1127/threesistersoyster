@echo off
echo ========================================
echo Three Sisters Oyster - App Store Publishing
echo ========================================
echo.

echo Step 1: Checking EAS CLI installation...
eas --version
if %errorlevel% neq 0 (
    echo ERROR: EAS CLI not found. Please install it first.
    echo Run: npm install -g eas-cli
    pause
    exit /b 1
)

echo.
echo Step 2: Please login to your Expo account...
echo (You'll be prompted for your Expo credentials)
eas login

echo.
echo Step 3: Configuring EAS project...
eas build:configure

echo.
echo Step 4: Building for iOS App Store...
echo This will take 10-20 minutes...
eas build --platform ios --profile production

echo.
echo Step 5: Submitting to App Store Connect...
echo (Make sure you've created the app in App Store Connect first)
eas submit --platform ios --profile production

echo.
echo ========================================
echo Publishing process completed!
echo ========================================
echo.
echo Next steps:
echo 1. Go to App Store Connect
echo 2. Complete your app listing
echo 3. Upload screenshots
echo 4. Submit for review
echo.
pause 
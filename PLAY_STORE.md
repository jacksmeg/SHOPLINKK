# ShopLinkk Play Store Release Guide

ShopLinkk is prepared as a Trusted Web Activity Android app that opens the live website at `https://www.shoplinkk.com`.

## Package

- App name: `ShopLinkk`
- Android package name: `com.jackstudios.shoplinkk`
- Launch URL: `https://www.shoplinkk.com/`
- Version name: `1.0.0`
- Version code: `1`
- Upload key: stored privately on this PC in `Documents/ShopLinkk-PlayStore-Secrets`
- Upload key file: `shoplinkk-upload-key-v2.p12`

## Build The Upload File

Run this from the project folder after the latest website deployment is live:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-android.ps1
```

The Play Store upload file will be created at:

```text
android/app-release-bundle.aab
```

## Upload To Google Play Console

1. Open the Google Play Console in your browser.
2. Create a new app named `ShopLinkk`.
3. Choose app type `App`.
4. Choose category `Shopping`.
5. Upload `android/app-release-bundle.aab` to an internal testing release first.
6. Complete the store listing, privacy policy, data safety, content rating, and app access sections.
7. Test with your own Gmail account before sending to production review.

## Store Listing Draft

Short description:

```text
Buy, sell, order food, and request riders around Dunkwa-on-Offin.
```

Full description:

```text
ShopLinkk connects buyers, sellers, restaurants, service providers, and riders in Dunkwa-on-Offin, Ghana. Browse products, order food, chat directly with sellers, follow stores, request deliveries, and discover local deals from trusted businesses.

ShopLinkk is built for local commerce. Users can inspect products, contact sellers, receive order updates, and manage marketplace activity from one simple app.
```

## Important Security Notes

- Do not commit the upload key or password file to GitHub.
- Do not share your Google Play Console password in chat.
- Change any password that has already been shared.
- Use internal testing before production.

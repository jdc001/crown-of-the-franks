# Packaging for the App Store

These files have not been built or tested: they are a starting point for whoever does the build on a Mac.

What is needed: a Mac with Xcode, Node.js, and an Apple Developer account.

1. Change `appId` in `capacitor.config.json` to your own reverse-domain identifier.
2. In this folder: `npm install`, then `npx cap add ios`, then `npm run ios`. Xcode opens with the project.
3. In Xcode: set the signing team, add the app icon (use `icon-512.png` scaled to 1024, without transparency), set the supported orientations, and run on a device.
4. Things to check on the device: saves survive closing the app (local storage inside the app), the share sheet opens for save files and result cards, sound starts after the first tap, and the safe areas (notch and home bar) are respected.
5. Before submitting: bundle the two typefaces (Cinzel and IM Fell English, both under the SIL Open Font License) inside `css/` so the first launch does not need a connection, and remove the Google Fonts link from `index.html`.
6. App Store Connect needs: a privacy policy URL (`privacy.html` in this repository, served by GitHub Pages), a support URL, screenshots for iPhone and iPad, an age rating questionnaire, and the "Data Not Collected" privacy label.

Android: `npm install @capacitor/android`, `npx cap add android`, and build with Android Studio.

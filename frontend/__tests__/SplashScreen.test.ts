import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '..');

const readText = (relativePath: string) =>
  fs.readFileSync(path.join(rootDir, relativePath), 'utf8');

const expectFile = (relativePath: string) => {
  const filePath = path.join(rootDir, relativePath);

  expect(fs.existsSync(filePath)).toBe(true);
  expect(fs.statSync(filePath).size).toBeGreaterThan(0);
};

describe('native splash screen assets', () => {
  it('configures iOS launch screen with the SplashLogo asset', () => {
    const launchScreen = readText('ios/CheckoutApp/LaunchScreen.storyboard');
    const imageSet = JSON.parse(
      readText(
        'ios/CheckoutApp/Images.xcassets/SplashLogo.imageset/Contents.json',
      ),
    );

    expect(launchScreen).toContain('image="SplashLogo"');
    expect(launchScreen).toContain('<image name="SplashLogo"');
    expect(launchScreen).toContain('contentMode="scaleAspectFit"');

    expect(imageSet.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: 'splash-logo.png',
          idiom: 'universal',
          scale: '1x',
        }),
        expect.objectContaining({
          filename: 'splash-logo@2x.png',
          idiom: 'universal',
          scale: '2x',
        }),
        expect.objectContaining({
          filename: 'splash-logo@3x.png',
          idiom: 'universal',
          scale: '3x',
        }),
      ]),
    );

    expectFile('ios/CheckoutApp/Images.xcassets/SplashLogo.imageset/splash-logo.png');
    expectFile('ios/CheckoutApp/Images.xcassets/SplashLogo.imageset/splash-logo@2x.png');
    expectFile('ios/CheckoutApp/Images.xcassets/SplashLogo.imageset/splash-logo@3x.png');
  });

  it('configures Android launch theme with the splash logo drawable', () => {
    const manifest = readText('android/app/src/main/AndroidManifest.xml');
    const baseStyles = readText('android/app/src/main/res/values/styles.xml');
    const api31Styles = readText(
      'android/app/src/main/res/values-v31/styles.xml',
    );
    const splashDrawable = readText(
      'android/app/src/main/res/drawable/splash_screen.xml',
    );
    const mainActivity = readText(
      'android/app/src/main/java/com/checkoutapp/MainActivity.kt',
    );

    expect(manifest).toContain('android:theme="@style/LaunchTheme"');
    expect(baseStyles).toContain('<style name="LaunchTheme"');
    expect(baseStyles).toContain('@drawable/splash_screen');
    expect(api31Styles).toContain('android:windowSplashScreenBackground');
    expect(api31Styles).toContain('android:windowSplashScreenAnimatedIcon');
    expect(api31Styles).toContain('@drawable/splash_logo');
    expect(splashDrawable).toContain('@android:color/white');
    expect(splashDrawable).toContain('@drawable/splash_logo');
    expect(mainActivity).toContain('setTheme(R.style.AppTheme)');

    [
      'drawable-mdpi',
      'drawable-hdpi',
      'drawable-xhdpi',
      'drawable-xxhdpi',
      'drawable-xxxhdpi',
    ].forEach(density => {
      expectFile(`android/app/src/main/res/${density}/splash_logo.png`);
    });
  });

  it('keeps the React Native master splash asset versioned', () => {
    expectFile('src/assets/images/splash-logo.png');
  });
});

'use strict';

const { withAppBuildGradle } = require('expo/config-plugins');

const begin = '// @generated begin jw-timer-release-signing';
const end = '// @generated end jw-timer-release-signing';

const signing = `
${begin}
android {
    signingConfigs {
        release {
            def releaseStore = System.getenv("JWTIMER_KEYSTORE_FILE")
                ?: new File(System.getProperty("user.home"), "JWTimer-Signing/jwtimer-release.jks").absolutePath
            def releasePassword = System.getenv("JWTIMER_KEYSTORE_PASSWORD")
            storeFile file(releaseStore)
            storePassword releasePassword
            keyAlias "jwtimer"
            keyPassword System.getenv("JWTIMER_KEY_PASSWORD") ?: releasePassword
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
${end}
`;

module.exports = function withReleaseSigning(config) {
    return withAppBuildGradle(config, (gradleConfig) => {
        if (gradleConfig.modResults.language !== 'groovy') {
            throw new Error('JW Timer release signing requires a Groovy app build.gradle.');
        }

        const previousBlock = /\r?\n?\/\/ @generated begin jw-timer-release-signing[\s\S]*?\/\/ @generated end jw-timer-release-signing\r?\n?/g;
        gradleConfig.modResults.contents =
            gradleConfig.modResults.contents.replace(previousBlock, '').trimEnd() + '\n' + signing;
        return gradleConfig;
    });
};
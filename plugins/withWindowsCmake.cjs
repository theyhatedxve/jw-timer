'use strict';

const { withAppBuildGradle } = require('expo/config-plugins');

const cmakeBlock = "// @generated begin jw-timer-windows-cmake\n// Keep Windows C++ object paths below legacy path limits.\nandroid {\n    externalNativeBuild {\n        cmake {\n            version \"3.31.1\"\n        }\n    }\n    defaultConfig {\n        externalNativeBuild {\n            cmake {\n                arguments \"-DCMAKE_OBJECT_PATH_MAX=240\"\n            }\n        }\n    }\n}\n// @generated end jw-timer-windows-cmake";

module.exports = function withWindowsCmake(config) {
    return withAppBuildGradle(config, (gradleConfig) => {
        if (gradleConfig.modResults.language !== 'groovy') {
            throw new Error('JW Timer Windows CMake configuration requires Groovy app build.gradle.');
        }
        const previousBlock = /\r?\n?\/\/ @generated begin jw-timer-windows-cmake[\s\S]*?\/\/ @generated end jw-timer-windows-cmake\r?\n?/g;
        gradleConfig.modResults.contents =
            gradleConfig.modResults.contents.replace(previousBlock, '').trimEnd() + '\n\n' + cmakeBlock + '\n';
        return gradleConfig;
    });
};
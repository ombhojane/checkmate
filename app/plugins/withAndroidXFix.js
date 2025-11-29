const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin to fix AndroidX compatibility with legacy Android Support libraries
 * Required for packages like @react-native-voice/voice that haven't migrated to AndroidX
 */
function withAndroidXFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;

      // Check if our fix is already added
      if (buildGradle.includes('exclude group: \'com.android.support\'')) {
        return config;
      }

      // Add the subprojects block before the last line
      const fixCode = `
// Exclude all com.android.support dependencies and force AndroidX
// Fix for packages like @react-native-voice/voice that use legacy support libraries
subprojects {
  afterEvaluate { project ->
    if (project.hasProperty('android')) {
      project.configurations.all {
        resolutionStrategy {
          force 'androidx.core:core:1.16.0'
          force 'androidx.appcompat:appcompat:1.7.1'
        }
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'appcompat-v7'
        exclude group: 'com.android.support', module: 'support-v4'
        exclude group: 'com.android.support', module: 'support-annotations'
        exclude group: 'com.android.support', module: 'support-core-utils'
        exclude group: 'com.android.support', module: 'versionedparcelable'
        exclude group: 'com.android.support', module: 'collections'
        exclude group: 'android.arch.lifecycle', module: 'runtime'
        exclude group: 'android.arch.lifecycle', module: 'common'
        exclude group: 'android.arch.core', module: 'common'
      }
    }
  }
}

`;

      // Insert before the last apply plugin line
      const insertPoint = buildGradle.lastIndexOf('apply plugin: "expo-root-project"');
      if (insertPoint !== -1) {
        config.modResults.contents = 
          buildGradle.slice(0, insertPoint) + 
          fixCode + 
          buildGradle.slice(insertPoint);
      } else {
        // Fallback: append at the end
        config.modResults.contents = buildGradle + '\n' + fixCode;
      }
    }
    return config;
  });
}

module.exports = withAndroidXFix;

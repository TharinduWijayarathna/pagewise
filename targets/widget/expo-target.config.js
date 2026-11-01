/** iOS home-screen + lock-screen widget ("Coming up"). Built by @bacons/apple-targets during prebuild. */
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'PagewiseWidget',
  displayName: 'Pagewise',
  deploymentTarget: '17.0',
  colors: {
    $widgetBackground: { light: '#F4EFE4', dark: '#22211E' },
    $accent: '#3F9A3D',
    ink: { light: '#1D1C19', dark: '#F4EFE4' },
    muted: { light: '#76746C', dark: '#A5A298' },
    soon: { light: '#B9473A', dark: '#E8806F' },
    calm: { light: '#3F9A3D', dark: '#7FCB7A' },
  },
  entitlements: {
    // Same App Group the app writes the snapshot to (src/lib/widgets.tsx). The main app gets it
    // from the expo-share-intent plugin (iosAppGroupIdentifier in app.json).
    'com.apple.security.application-groups': ['group.com.pagewise.app'],
  },
};

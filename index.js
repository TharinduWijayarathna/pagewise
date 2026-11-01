// App entry: Expo Router, plus the Android home-screen widget's background task.
import 'expo-router/entry';
import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/handler';

if (Platform.OS === 'android') registerWidgetTaskHandler(widgetTaskHandler);

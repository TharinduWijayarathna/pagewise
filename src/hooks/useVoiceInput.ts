import { useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

/**
 * Speech-to-text for the chat composer. While listening, `onText` receives
 * `prefix + transcript` so the words appear in the input as you speak.
 */
export function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const prefix = useRef('');

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (e) => {
    const said = e.results[0]?.transcript ?? '';
    onText((prefix.current ? `${prefix.current} ` : '') + said);
  });
  useSpeechRecognitionEvent('error', (e) => {
    setListening(false);
    if (e.error === 'no-speech' || e.error === 'aborted' || e.error === 'speech-timeout') return;
    if (e.error === 'not-allowed') {
      Alert.alert('Microphone access needed', 'Allow microphone access in Settings to ask questions by voice.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    Alert.alert('Voice typing unavailable', e.message || 'Speech recognition isn’t available on this device.');
  });

  const start = async (currentText: string) => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone access needed', 'Allow microphone access in Settings to ask questions by voice.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    prefix.current = currentText.trim();
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
    });
  };

  const listeningRef = useRef(false);
  listeningRef.current = listening;

  // stop() waits for a final result; if none arrives (e.g. silence), force-end so the mic never looks stuck.
  const stop = () => {
    ExpoSpeechRecognitionModule.stop();
    setTimeout(() => {
      if (listeningRef.current) {
        ExpoSpeechRecognitionModule.abort();
        setListening(false);
      }
    }, 1200);
  };

  return { listening, start, stop, toggle: (currentText: string) => (listening ? stop() : start(currentText)) };
}

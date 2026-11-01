import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts } from '@/constants/theme';
import { CheckIcon, SparklesIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { RichText } from '@/components/chat/RichText';

/** Three softly pulsing dots while Gemini is thinking. */
function TypingDots() {
  const v = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = v.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 380, useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [v]);
  return (
    <View style={styles.dots}>
      {v.map((o, i) => (
        <Animated.View key={i} style={[styles.dotAnim, { opacity: o, transform: [{ scale: o }] }]} />
      ))}
    </View>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      hitSlop={8}
      onPress={async () => {
        await Clipboard.setStringAsync(text.replace(/\*\*/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
    >
      {copied && <CheckIcon size={13} color={colors.greenDark} strokeWidth={2.2} />}
      <Text style={[styles.actionText, copied && { color: colors.greenDark }]}>{copied ? 'Copied' : 'Copy'}</Text>
    </Pressable>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.user}>
      <Text style={styles.userText}>{text}</Text>
    </View>
  );
}

/** Answer from Gemini. `streaming` shows a live, still-growing answer. */
export function AiBubble({ text, streaming, onPage }: { text: string; streaming?: boolean; onPage?: (page: number) => void }) {
  return (
    <View style={styles.ai}>
      <View style={styles.aiHead}>
        <GlossyIcon tone="ink" size={26} shape="circle" flat>
          {(c) => <SparklesIcon size={13} color={c} strokeWidth={1.9} />}
        </GlossyIcon>
        <Text style={styles.aiName}>Pagewise</Text>
        {streaming && !!text && <Text style={styles.live}>writing…</Text>}
      </View>
      {text ? <RichText text={text} onPage={onPage} /> : <TypingDots />}
      {!streaming && !!text && (
        <View style={styles.actions}>
          <CopyButton text={text} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  user: {
    alignSelf: 'flex-end',
    maxWidth: '84%',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    backgroundColor: '#262521',
  },
  userText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: '#FFFFFF' },
  ai: {
    alignSelf: 'stretch',
    marginTop: 12,
    padding: 16,
    paddingBottom: 12,
    borderRadius: 22,
    borderTopLeftRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#7D785F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiName: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  live: { fontFamily: fonts.regular, fontSize: 12, color: colors.faint },
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 6 },
  dotAnim: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.muted },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(38,37,31,0.12)',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
});

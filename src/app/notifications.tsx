import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { BellIcon, CheckIcon, SparklesIcon } from '@/components/ui/Icons';
import { CircleButton, GlassCard, ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { timeAgo } from '@/utils/format';
import { colors, fonts } from '@/constants/theme';

export default function Notifications() {
  const { notices, markAllRead } = useLibrary();
  const hasUnread = notices.some((n) => !n.read);

  // Mark as read when the user leaves the screen, so dots are visible while it's open.
  const markRef = useRef(markAllRead);
  markRef.current = markAllRead;
  useEffect(
    () => () => {
      markRef.current().catch(() => {});
    },
    [],
  );

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          onBack={goBackOr('/home')}
          title="Notifications"
          right={
            hasUnread ? (
              <CircleButton onPress={markAllRead}>
                <CheckIcon size={19} color={colors.text} strokeWidth={1.7} />
              </CircleButton>
            ) : undefined
          }
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {notices.length === 0 && (
            <GlassCard style={styles.empty}>
              <GlossyIcon tone="pearl" size={56}>
                {(c) => <BellIcon size={26} color={c} strokeWidth={1.6} />}
              </GlossyIcon>
              <Text style={styles.emptyText}>You’re all caught up.</Text>
            </GlassCard>
          )}
          {notices.map((n) => (
            <Pressable
              key={n.id}
              disabled={!n.docId}
              onPress={() => n.docId && router.push({ pathname: '/document/[id]', params: { id: n.docId } })}
              style={({ pressed }) => [styles.item, !n.read && styles.unread, pressed && { opacity: 0.8 }]}
            >
              <GlossyIcon tone={n.read ? 'pearl' : 'green'} size={40} flat={n.read}>
                {(c) => <SparklesIcon size={18} color={c} strokeWidth={1.7} />}
              </GlossyIcon>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.title} numberOfLines={1}>
                    {n.title}
                  </Text>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{timeAgo(n.at)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  item: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  unread: { backgroundColor: 'rgba(255,255,255,0.5)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0674F' },
  body: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: colors.muted, marginTop: 3 },
  time: { fontFamily: fonts.regular, fontSize: 12, color: colors.faint, marginTop: 6 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 34 },
  emptyText: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
});

import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { DocumentCard } from '@/components/document/DocumentCard';
import { BellIcon, PlusIcon, SearchIcon, StackedDocsIcon } from '@/components/ui/Icons';
import { CircleButton } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user } = useAuth();
  const { docs, notices, loading } = useLibrary();
  const [query, setQuery] = useState('');
  const unread = notices.some((n) => !n.read);
  const firstName = user?.name.split(' ')[0];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : docs.slice(0, 3);
  }, [query, docs]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {greeting()}
                {firstName ? `, ${firstName}` : ''}
              </Text>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Your Document</Text>
                <StackedDocsIcon size={28} />
              </View>
            </View>
            <CircleButton onPress={() => router.push('/notifications')} badge={unread}>
              <BellIcon size={20} color={colors.text} strokeWidth={1.5} />
            </CircleButton>
          </View>

          {/* search */}
          <View style={styles.search}>
            <SearchIcon size={18} color={colors.muted} strokeWidth={1.6} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Document"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          {/* recent */}
          <View style={styles.sectionRow}>
            <Text style={styles.section}>{query ? 'Results' : 'Recent'}</Text>
            <Pressable onPress={() => router.push('/documents')} hitSlop={8}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {list.map((d) => (
            <DocumentCard key={d.id} doc={d} />
          ))}
          {list.length === 0 && !!query && <Text style={styles.empty}>No documents match “{query}”.</Text>}
          {list.length === 0 && !query && loading && <ActivityIndicator style={{ marginVertical: 30 }} color={colors.muted} />}
          {list.length === 0 && !query && !loading && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyText}>
                Upload a PDF and Pagewise will read it, summarize it, and answer your questions.
              </Text>
            </View>
          )}

          {/* upload */}
          <Pressable
            onPress={() => router.push('/upload')}
            style={({ pressed }) => [styles.upload, pressed && { opacity: 0.7 }]}
          >
            <GlossyIcon tone="ink" size={46} shape="circle">
              {(c) => <PlusIcon size={21} color={c} strokeWidth={2.2} />}
            </GlossyIcon>
            <View>
              <Text style={styles.uploadTitle}>Upload a new document</Text>
              <Text style={styles.uploadSub}>PDF, up to 14 MB</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 130 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 27, color: colors.ink, letterSpacing: -0.8 },
  search: {
    marginTop: 26,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.search,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 0 },
  sectionRow: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: { fontFamily: fonts.medium, fontSize: 17, color: colors.muted },
  seeAll: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  emptyCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 6 },
  empty: { fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginVertical: 24 },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(38,37,31,0.22)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  uploadTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  uploadSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
});

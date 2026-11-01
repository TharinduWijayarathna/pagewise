import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { DocumentCard } from '@/components/document/DocumentCard';
import { FolderChips } from '@/components/document/FolderChips';
import { BellIcon, CalendarIcon, CameraIcon, CardsIcon, CloseIcon, PlusIcon, SearchIcon } from '@/components/ui/Icons';
import { PrivacyNote } from '@/components/document/PrivacyNote';
import { canScan, explainNoCamera } from '@/lib/scan';
import { dueCards, dueLabel, upcomingDates } from '@/utils/dates';
import { CircleButton } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';
import { plural } from '@/utils/format';

export default function Home() {
  const { docs, notices, loading, stats, folders } = useLibrary();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const unread = notices.some((n) => !n.read);
  const upcoming = useMemo(() => upcomingDates(docs, 60).slice(0, 3), [docs]);
  const due = useMemo(() => {
    const cards = dueCards(docs);
    // Open the document with the most cards waiting.
    const counts = new Map<string, number>();
    cards.forEach((c) => counts.set(c.docId, (counts.get(c.docId) ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { count: cards.length, docId: top?.[0] };
  }, [docs]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : docs.slice(0, 5);
  }, [query, docs]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* header: title + live summary · notifications */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Your documents</Text>
              <Text style={styles.summary}>
                {docs.length === 0
                  ? 'Upload a PDF to get started'
                  : `${plural(docs.length, 'document')} · ${plural(stats.totalQuestions, 'question')} asked`}
              </Text>
            </View>
            <CircleButton onPress={() => router.push('/notifications')} badge={unread}>
              <BellIcon size={20} color={colors.text} strokeWidth={1.6} />
            </CircleButton>
          </View>

          {/* search */}
          <View style={[styles.search, searchFocused && styles.searchFocused]}>
            <SearchIcon size={19} color={searchFocused ? colors.ink : colors.muted} strokeWidth={1.7} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your documents"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.clear} accessibilityLabel="Clear search">
                <CloseIcon size={13} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
            )}
          </View>

          {/* folders */}
          {(docs.length > 0 || folders.length > 0) && (
            <View style={styles.folders}>
              <FolderChips
                folders={folders}
                docs={docs}
                selected="all"
                onSelect={(id) => id !== 'all' && router.push({ pathname: '/folder/[id]', params: { id } })}
                onNew={() => router.push('/folder-form')}
                onOrganize={docs.length >= 2 ? () => router.push('/organize') : undefined}
              />
            </View>
          )}

          {/* coming up: deadlines from paperwork + flashcards due */}
          {!query && (upcoming.length > 0 || due.count > 0) && (
            <>
              <Text style={[styles.section, { marginTop: 30, marginBottom: 14 }]}>Coming up</Text>
              <View style={styles.upcoming}>
                {upcoming.map((k, i) => (
                  <Pressable
                    key={`${k.docId}${k.date}${k.label}`}
                    onPress={() => router.push({ pathname: '/document/[id]', params: { id: k.docId } })}
                    style={({ pressed }) => [styles.upRow, i > 0 && styles.upDivider, pressed && { opacity: 0.6 }]}
                  >
                    <GlossyIcon tone={k.days <= 3 ? 'rose' : 'pearl'} size={34} flat>
                      {(c) => <CalendarIcon size={16} color={c} strokeWidth={1.8} />}
                    </GlossyIcon>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upTitle} numberOfLines={1}>
                        {k.label}
                      </Text>
                      <Text style={styles.upSub} numberOfLines={1}>
                        {k.docTitle}
                      </Text>
                    </View>
                    <Text style={[styles.upWhen, k.days <= 3 && { color: '#C8503F' }]}>{dueLabel(k.date)}</Text>
                  </Pressable>
                ))}
                {due.count > 0 && due.docId && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/study/[id]', params: { id: due.docId! } })}
                    style={({ pressed }) => [styles.upRow, upcoming.length > 0 && styles.upDivider, pressed && { opacity: 0.6 }]}
                  >
                    <GlossyIcon tone="green" size={34} flat>
                      {(c) => <CardsIcon size={16} color={c} strokeWidth={1.8} />}
                    </GlossyIcon>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upTitle}>{plural(due.count, 'flashcard')} to review</Text>
                      <Text style={styles.upSub}>A few minutes keeps it fresh</Text>
                    </View>
                    <Text style={[styles.upWhen, { color: colors.greenDark }]}>Review</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {/* recent */}
          <View style={styles.sectionRow}>
            <Text style={styles.section}>{query ? 'Results' : 'Recent'}</Text>
            <Pressable onPress={() => router.push('/documents')} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
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

          {/* upload / scan */}
          <View style={styles.upload}>
            <Pressable
              onPress={() => router.push('/upload')}
              style={({ pressed }) => [styles.uploadMain, pressed && { opacity: 0.7 }]}
            >
              <GlossyIcon tone="ink" size={46} shape="circle">
                {(c) => <PlusIcon size={20} color={c} strokeWidth={2.2} />}
              </GlossyIcon>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>Add a document</Text>
                <Text style={styles.uploadSub}>PDF up to 14 MB, or Share → Pagewise</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => (canScan() ? router.push({ pathname: '/upload', params: { scan: '1' } }) : explainNoCamera())}
              hitSlop={6}
              accessibilityLabel="Scan a paper document"
              style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.7 }]}
            >
              <CameraIcon size={19} color={colors.ink} strokeWidth={1.7} />
              <Text style={styles.scanText}>Scan</Text>
            </Pressable>
          </View>
          <PrivacyNote compact style={{ marginTop: 14, justifyContent: 'center' }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 130 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink, letterSpacing: -1 },
  summary: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  search: {
    marginTop: 22,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 12,
    gap: 10,
    shadowColor: '#8C866F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  searchFocused: { backgroundColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(38,37,31,0.25)' },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: colors.text, paddingVertical: 0 },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folders: { marginTop: 18, marginRight: -24 },
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
  upcoming: {
    borderRadius: 22,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
  },
  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  upDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(38,37,31,0.12)' },
  upTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  upSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  upWhen: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  uploadMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  scanBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 58,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  scanText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.ink },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(38,37,31,0.22)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  uploadTitle: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  uploadSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
});

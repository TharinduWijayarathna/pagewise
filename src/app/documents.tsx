import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { DocumentCard } from '@/components/document/DocumentCard';
import { FolderChips } from '@/components/document/FolderChips';
import { PlusIcon, SearchIcon } from '@/components/ui/Icons';
import { CircleButton, ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';

const SORTS = ['Recent', 'Name', 'Pages'] as const;

export default function Documents() {
  const { docs, folders } = useLibrary();
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('all');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Recent');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inFolder = folder === 'all' ? docs : docs.filter((d) => d.folderId === folder);
    const out = q ? inFolder.filter((d) => d.title.toLowerCase().includes(q)) : [...inFolder];
    if (sort === 'Name') out.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Pages') out.sort((a, b) => b.pages - a.pages);
    return out;
  }, [docs, query, sort, folder]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          onBack={goBackOr('/home')}
          title="All Documents"
          subtitle={<Text style={styles.count}>{docs.length} files</Text>}
          right={
            <CircleButton onPress={() => router.push('/upload')}>
              <PlusIcon size={20} color={colors.text} strokeWidth={1.7} />
            </CircleButton>
          }
        />
        <FlatList
          data={list}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DocumentCard doc={item} />}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.search}>
                <SearchIcon size={18} color={colors.muted} strokeWidth={1.6} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search your documents"
                  placeholderTextColor={colors.faint}
                  style={styles.searchInput}
                />
              </View>
              {folders.length > 0 && (
                <View style={styles.folderRow}>
                  <FolderChips
                    folders={folders}
                    docs={docs}
                    selected={folder}
                    onSelect={setFolder}
                    onOrganize={docs.length >= 2 ? () => router.push('/organize') : undefined}
                  />
                </View>
              )}
              <View style={styles.sorts}>
                {SORTS.map((s) => (
                  <Pressable key={s} onPress={() => setSort(s)} style={[styles.sort, sort === s && styles.sortOn]}>
                    <Text style={[styles.sortText, sort === s && { color: '#FFFFFF' }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          }
          ListEmptyComponent={<Text style={styles.empty}>{folder === 'all' ? 'No documents found.' : 'No documents in this folder yet.'}</Text>}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  count: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  search: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.search,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 0 },
  folderRow: { marginTop: 16, marginRight: -20 },
  sorts: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  sort: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  sortOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  sortText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  empty: { fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 30 },
});

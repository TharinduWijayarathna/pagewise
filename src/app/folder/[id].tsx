import { FlatList, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { DocumentCard } from '@/components/document/DocumentCard';
import { FolderIcon, MoreIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { CircleButton, GlassCard, ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';
import { confirm, showActions } from '@/utils/actions';
import { plural } from '@/utils/format';

/** Documents inside one folder, with rename / delete. */
export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { folders, docs, deleteFolder } = useLibrary();
  const folder = folders.find((f) => f.id === id);
  const items = docs.filter((d) => d.folderId === id);

  if (!folder) {
    return (
      <Background>
        <SafeAreaView style={{ flex: 1 }}>
          <ScreenHeader title="Folder not found" onBack={goBackOr('/home')} />
        </SafeAreaView>
      </Background>
    );
  }

  const openMenu = () =>
    showActions(folder.name, [
      { label: 'Edit name & colour', onPress: () => router.push({ pathname: '/folder-form', params: { id: folder.id } }) },
      {
        label: 'Delete folder',
        destructive: true,
        onPress: () =>
          confirm(
            'Delete folder?',
            `“${folder.name}” will be removed. Its ${plural(items.length, 'document')} won’t be deleted — they’ll move to No folder.`,
            'Delete',
            async () => {
              await deleteFolder(folder.id);
              goBackOr('/home')();
            },
          ),
      },
    ]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          title={folder.name}
          subtitle={<Text style={styles.count}>{plural(items.length, 'document')}</Text>}
          onBack={goBackOr('/home')}
          right={
            <CircleButton onPress={openMenu}>
              <MoreIcon size={20} color={colors.text} strokeWidth={1.8} />
            </CircleButton>
          }
        />
        <FlatList
          data={items}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DocumentCard doc={item} />}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <GlassCard style={styles.empty}>
              <GlossyIcon tone="pearl" size={56}>
                {(c) => <FolderIcon size={26} color={c} strokeWidth={1.6} />}
              </GlossyIcon>
              <Text style={styles.emptyTitle}>This folder is empty</Text>
              <Text style={styles.emptyText}>
                Long-press any document and choose “Move to folder”, or use Organize with AI on the Home screen.
              </Text>
            </GlassCard>
          }
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  count: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 30 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginTop: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center' },
});

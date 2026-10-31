import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { CheckIcon, FolderIcon, FolderPlusIcon, FileTextIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { GlassCard, ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';

/** "Move to folder" picker. Param: `docId`. */
export default function MoveToFolder() {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const { getDoc, folders, docs, moveDoc } = useLibrary();
  const doc = getDoc(docId);
  if (!doc) return null;
  const current = doc.folderId ?? null;

  const pick = async (folderId: string | null) => {
    if (folderId !== current) await moveDoc(doc.id, folderId);
    router.back();
  };

  const Option = ({ id, label, icon, count }: { id: string | null; label: string; icon: React.ReactNode; count?: number }) => {
    const on = current === id;
    return (
      <Pressable onPress={() => pick(id)} style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={styles.optionLabel} numberOfLines={1}>
            {label}
          </Text>
          {count !== undefined && <Text style={styles.optionMeta}>{count} document{count === 1 ? '' : 's'}</Text>}
        </View>
        {on && <CheckIcon size={20} color={colors.greenDark} strokeWidth={2.4} />}
      </Pressable>
    );
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader
          title="Move to folder"
          subtitle={
            <Text style={styles.sub} numberOfLines={1}>
              {doc.title}
            </Text>
          }
          onBack={goBackOr('/home')}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={{ paddingVertical: 6 }}>
            <Option
              id={null}
              label="No folder"
              icon={
                <GlossyIcon tone="pearl" size={40} flat>
                  {(c) => <FileTextIcon size={18} color={c} strokeWidth={1.7} />}
                </GlossyIcon>
              }
            />
            {folders.map((f) => (
              <Option
                key={f.id}
                id={f.id}
                label={f.name}
                count={docs.filter((d) => d.folderId === f.id).length}
                icon={
                  <GlossyIcon tone="ink" size={40} flat>
                    {(c) => <FolderIcon size={18} color={c} strokeWidth={1.8} />}
                  </GlossyIcon>
                }
              />
            ))}
          </GlassCard>

          <Pressable
            onPress={() => router.replace({ pathname: '/folder-form', params: { moveDocId: doc.id } })}
            style={({ pressed }) => [styles.newFolder, pressed && { opacity: 0.7 }]}
          >
            <GlossyIcon tone="ink" size={40} shape="circle">
              {(c) => <FolderPlusIcon size={18} color={c} strokeWidth={1.8} />}
            </GlossyIcon>
            <Text style={styles.optionLabel}>New folder</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  optionLabel: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  optionMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  newFolder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(38,37,31,0.22)',
  },
});

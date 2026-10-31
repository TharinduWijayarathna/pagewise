import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { FolderIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader, TextField, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';
import { friendlyError } from '@/utils/format';

const SUGGESTIONS = ['Work', 'Research', 'Finance', 'Legal', 'Personal'];

/**
 * Create or rename a folder.
 * Params: `id` → rename that folder; `moveDocId` → after creating, move that document into it.
 */
export default function FolderForm() {
  const { id, moveDocId } = useLocalSearchParams<{ id?: string; moveDocId?: string }>();
  const { folders, createFolder, renameFolder, moveDoc } = useLibrary();
  const existing = folders.find((f) => f.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(undefined);
    setSaving(true);
    try {
      if (existing) {
        await renameFolder(existing.id, name);
      } else {
        const folderId = await createFolder(name);
        if (moveDocId) await moveDoc(moveDocId, folderId);
      }
      router.back();
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScreenHeader title={existing ? 'Rename folder' : 'New folder'} onBack={goBackOr('/home')} />
          <View style={styles.body}>
            <GlossyIcon tone="ink" size={64} style={{ alignSelf: 'center', marginBottom: 22 }}>
              {(c) => <FolderIcon size={28} color={c} strokeWidth={1.8} />}
            </GlossyIcon>
            <TextField
              label="Folder name"
              placeholder="e.g. Research"
              autoCapitalize="words"
              autoFocus
              maxLength={40}
              value={name}
              onChangeText={setName}
              onSubmitEditing={save}
              returnKeyType="done"
              error={error}
            />
            {!existing && (
              <View style={styles.suggestions}>
                {SUGGESTIONS.filter((s) => !folders.some((f) => f.name.toLowerCase() === s.toLowerCase())).map((s) => (
                  <Text key={s} style={styles.suggestion} onPress={() => setName(s)}>
                    {s}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <PillButton label={existing ? 'Save' : 'Create folder'} onPress={save} loading={saving} disabled={!name.trim()} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 12 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestion: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  actions: { paddingHorizontal: 40, paddingBottom: 16, paddingTop: 8 },
});

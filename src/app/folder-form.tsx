import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { CheckIcon, FolderIcon } from '@/components/ui/Icons';
import { FOLDER_COLORS, FOLDER_COLOR_KEYS, nextFolderColor, type FolderColorKey } from '@/constants/folderColors';
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
  const { folders, createFolder, updateFolder, moveDoc } = useLibrary();
  const existing = folders.find((f) => f.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState<FolderColorKey>(existing?.color ?? nextFolderColor(folders.map((f) => f.color)));
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(undefined);
    setSaving(true);
    try {
      if (existing) {
        await updateFolder(existing.id, { name, color });
      } else {
        const folderId = await createFolder(name, color);
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
          <ScreenHeader title={existing ? 'Edit folder' : 'New folder'} onBack={goBackOr('/home')} />
          <View style={styles.body}>
            <GlossyIcon fill={FOLDER_COLORS[color].top} size={64} style={{ alignSelf: 'center', marginBottom: 22 }}>
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
            <Text style={styles.label}>Colour</Text>
            <View style={styles.swatches}>
              {FOLDER_COLOR_KEYS.map((k) => {
                const on = k === color;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setColor(k)}
                    accessibilityLabel={`${FOLDER_COLORS[k].label}${on ? ', selected' : ''}`}
                    hitSlop={4}
                    style={[styles.swatchRing, on && { borderColor: FOLDER_COLORS[k].solid }]}
                  >
                    <View style={[styles.swatch, { backgroundColor: FOLDER_COLORS[k].solid }]}>
                      {on && <CheckIcon size={15} color="#FFFFFF" strokeWidth={2.8} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

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
  label: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted, marginBottom: 10, marginLeft: 4 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
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

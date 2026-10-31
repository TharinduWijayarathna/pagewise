import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { Doc, Folder } from '@/types/document';
import { FolderIcon, FolderPlusIcon, SparklesIcon } from '@/components/ui/Icons';

type Props = {
  folders: Folder[];
  docs: Doc[];
  /** Currently selected folder id; 'all' for everything. */
  selected?: string;
  onSelect: (id: string) => void;
  onNew?: () => void;
  onOrganize?: () => void;
};

/** Horizontal row: All · each folder (with count) · New folder · Organize with AI. */
export function FolderChips({ folders, docs, selected = 'all', onSelect, onNew, onOrganize }: Props) {
  const count = (id: string) => docs.filter((d) => (id === 'all' ? true : d.folderId === id)).length;

  const Chip = ({ id, label }: { id: string; label: string }) => {
    const on = selected === id;
    return (
      <Pressable onPress={() => onSelect(id)} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && { opacity: 0.75 }]}>
        {id !== 'all' && <FolderIcon size={15} color={on ? '#FFFFFF' : colors.text} strokeWidth={1.8} />}
        <Text style={[styles.label, on && { color: '#FFFFFF' }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.count, on && styles.countOn]}>
          <Text style={[styles.countText, on && { color: '#FFFFFF' }]}>{count(id)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip id="all" label="All" />
      {folders.map((f) => (
        <Chip key={f.id} id={f.id} label={f.name} />
      ))}
      {onNew && (
        <Pressable onPress={onNew} style={({ pressed }) => [styles.chip, styles.ghost, pressed && { opacity: 0.75 }]}>
          <FolderPlusIcon size={15} color={colors.text} strokeWidth={1.8} />
          <Text style={styles.label}>New folder</Text>
        </Pressable>
      )}
      {onOrganize && (
        <Pressable onPress={onOrganize} style={({ pressed }) => [styles.chip, styles.ai, pressed && { opacity: 0.75 }]}>
          <SparklesIcon size={15} color={colors.greenDark} strokeWidth={1.8} />
          <Text style={[styles.label, { color: colors.greenDark }]}>Organize with AI</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 24 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    maxWidth: 220,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  ghost: { borderStyle: 'dashed', borderColor: 'rgba(38,37,31,0.25)', backgroundColor: 'rgba(255,255,255,0.2)' },
  ai: { backgroundColor: 'rgba(93,180,88,0.12)', borderColor: 'rgba(93,180,88,0.35)' },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flexShrink: 1 },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(38,37,31,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted },
});

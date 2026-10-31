/**
 * Folder colour palette. Documents take their folder's colour, so you can tell
 * folders apart at a glance. Unfiled documents use the brand green, which is
 * deliberately NOT in the folder palette.
 */
export type DocTint = {
  /** Gradient for the coloured top of the document icon. */
  top: readonly [string, string];
  /** Gradient for the pale lower sheet. */
  base: readonly [string, string];
  /** Gradient for the folded corner. */
  fold: readonly [string, string];
  /** Solid colour for dots, chips and tags. */
  solid: string;
};

export type FolderColorKey = 'blue' | 'purple' | 'orange' | 'pink' | 'teal' | 'amber' | 'red' | 'slate';

export const UNFILED_TINT: DocTint = {
  top: ['#7FD07A', '#4DAA4A'],
  base: ['#E8F3E2', '#CFE3C8'],
  fold: ['#B6E6AE', '#6CC267'],
  solid: '#5DB458',
};

export const FOLDER_COLORS: Record<FolderColorKey, DocTint & { label: string }> = {
  blue: { label: 'Blue', top: ['#7DB3F5', '#3D7FD9'], base: ['#E4EEFB', '#C9DBF3'], fold: ['#B5D3FA', '#5C95E3'], solid: '#4A8FE7' },
  purple: { label: 'Purple', top: ['#AE96EC', '#7558C8'], base: ['#ECE7F9', '#D7CDF1'], fold: ['#CFC0F5', '#8B6FD6'], solid: '#8B6FD6' },
  orange: { label: 'Orange', top: ['#F7AE6E', '#E2742A'], base: ['#FCEDE0', '#F5D7BF'], fold: ['#FACBA0', '#EC8A44'], solid: '#F08A3C' },
  pink: { label: 'Pink', top: ['#F19AB3', '#D65579'], base: ['#FBE6EC', '#F3CAD6'], fold: ['#F7C1D0', '#E06C8D'], solid: '#E36C8D' },
  teal: { label: 'Teal', top: ['#62C8BE', '#21908A'], base: ['#DFF3F1', '#C0E6E2'], fold: ['#A3E0D9', '#34A99F'], solid: '#2FA59B' },
  amber: { label: 'Amber', top: ['#F1CF6B', '#D19E1D'], base: ['#FBF2DA', '#F2E0B0'], fold: ['#F7E1A0', '#E0B23A'], solid: '#D8A62A' },
  red: { label: 'Red', top: ['#EF8C80', '#C9473A'], base: ['#FBE5E2', '#F2C8C2'], fold: ['#F6BBB3', '#D65C4C'], solid: '#D65C4C' },
  slate: { label: 'Slate', top: ['#9AA6B5', '#5C6878'], base: ['#E9ECF0', '#D2D8DF'], fold: ['#C3CBD5', '#6E7B8B'], solid: '#6E7B8B' },
};

export const FOLDER_COLOR_KEYS = Object.keys(FOLDER_COLORS) as FolderColorKey[];

export const isFolderColor = (v: unknown): v is FolderColorKey =>
  typeof v === 'string' && v in FOLDER_COLORS;

/** Next colour not already used by a folder (cycles when all are taken). */
export function nextFolderColor(used: (string | undefined)[], offset = 0): FolderColorKey {
  const free = FOLDER_COLOR_KEYS.filter((k) => !used.includes(k));
  return free[offset] ?? FOLDER_COLOR_KEYS[(used.length + offset) % FOLDER_COLOR_KEYS.length];
}

/** Tint for a document given its folder's colour key (undefined = unfiled). */
export const tintFor = (color?: string | null): DocTint => (isFolderColor(color) ? FOLDER_COLORS[color] : UNFILED_TINT);

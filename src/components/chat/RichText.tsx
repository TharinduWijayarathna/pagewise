import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

/**
 * Renders the small Markdown subset Gemini is asked to use:
 * "### " titles, "- " bullets, "1. " steps, **bold**, and page refs like "(p. 4)".
 */

type Block =
  | { kind: 'title'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'step'; n: string; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'gap' };

function parse(src: string): Block[] {
  const out: Block[] = [];
  for (const raw of src.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      if (out.length && out[out.length - 1].kind !== 'gap') out.push({ kind: 'gap' });
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^#{1,6}\s+(.*)$/))) out.push({ kind: 'title', text: m[1] });
    else if ((m = line.match(/^[-*•]\s+(.*)$/))) out.push({ kind: 'bullet', text: m[1] });
    else if ((m = line.match(/^(\d+)[.)]\s+(.*)$/))) out.push({ kind: 'step', n: m[1], text: m[2] });
    else out.push({ kind: 'para', text: line });
  }
  while (out.length && out[out.length - 1].kind === 'gap') out.pop();
  return out;
}

const PAGE_REF = /(\((?:p|pp|page|pages)\.?\s*[\d\s,–-]+\))/gi;
const IS_PAGE_REF = /^\((?:p|pp|page|pages)\.?\s*[\d\s,–-]+\)$/i;

/** First page number in a ref like "(pp. 4–5)" → 4. */
const firstPage = (ref: string) => Number(ref.match(/\d+/)?.[0]) || undefined;

/** Inline: **bold** and page-reference chips (tappable when `onPage` is given). */
function Inline({ text, style, onPage }: { text: string; style?: object; onPage?: (page: number) => void }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={[styles.body, style]}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.bold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part
          .replace(/(^|\s)\*(\S)/g, '$1$2') // stray single asterisks
          .split(PAGE_REF)
          .filter(Boolean)
          .map((seg, j) =>
            IS_PAGE_REF.test(seg) ? (
              <Text
                key={`${i}-${j}`}
                style={styles.pageRef}
                onPress={onPage && firstPage(seg) ? () => onPage(firstPage(seg)!) : undefined}
                suppressHighlighting={false}
                accessibilityRole={onPage ? 'link' : undefined}
                accessibilityHint={onPage ? 'Opens this page of the PDF' : undefined}
              >
                {' '}
                {seg.replace(/[()]/g, '').replace(/^pages?\s*/i, 'p. ').trim().replace(/\s+/g, '\u00A0')}{' '}
              </Text>
            ) : (
              <Fragment key={`${i}-${j}`}>{seg}</Fragment>
            ),
          );
      })}
    </Text>
  );
}

export function RichText({ text, color, onPage }: { text: string; color?: string; onPage?: (page: number) => void }) {
  const blocks = parse(text);
  const tint = color ? { color } : undefined;
  return (
    <View>
      {blocks.map((b, i) => {
        const first = i === 0;
        switch (b.kind) {
          case 'gap':
            return <View key={i} style={{ height: 6 }} />;
          case 'title':
            return (
              <Text key={i} style={[styles.title, !first && { marginTop: 10 }, tint]}>
                {b.text.replace(/\*\*/g, '')}
              </Text>
            );
          case 'bullet':
            return (
              <View key={i} style={[styles.row, !first && { marginTop: 6 }]}>
                <View style={styles.dot} />
                <Inline text={b.text} style={[{ flex: 1 }, tint ?? {}]} onPage={onPage} />
              </View>
            );
          case 'step':
            return (
              <View key={i} style={[styles.row, !first && { marginTop: 6 }]}>
                <View style={styles.num}>
                  <Text style={styles.numText}>{b.n}</Text>
                </View>
                <Inline text={b.text} style={[{ flex: 1 }, tint ?? {}]} onPage={onPage} />
              </View>
            );
          default:
            return (
              <View key={i} style={!first && { marginTop: 4 }}>
                <Inline text={b.text} style={tint} onPage={onPage} />
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  bold: { fontFamily: fonts.semibold, color: colors.ink },
  title: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.ink, marginBottom: 4, letterSpacing: -0.2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginTop: 8.5 },
  num: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    paddingHorizontal: 5,
  },
  numText: { fontFamily: fonts.semibold, fontSize: 11, color: '#FFFFFF' },
  pageRef: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: '#2F7A2D',
    backgroundColor: 'rgba(93,180,88,0.14)',
  },
});

/**
 * One-line preview of a formatted answer (for lists like History):
 * drops section titles, removes bullets/bold, joins points with " · ".
 */
export const plainText = (md: string) =>
  md
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^#{1,6}\s/.test(l))
    .map((l) =>
      l
        .replace(/^(?:[-*•]|\d+[.)])\s+/, '')
        .replace(/\*\*/g, '')
        .replace(/\s*\((?:p|pp|page|pages)\.?\s*[\d\s,–-]+\)/gi, '')
        .replace(/[.:;]\s*$/, ''),
    )
    .join(' · ');

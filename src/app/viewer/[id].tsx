import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Pdf, { type PdfRef } from 'react-native-pdf';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';

/**
 * The real PDF, opened at a page. Page chips like "p. 4" in answers,
 * key dates, clauses and flashcards link here.
 */
export default function Viewer() {
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const { getDoc, hasLocalFile, pdfUri } = useLibrary();
  const doc = getDoc(id);
  const start = Math.max(1, Number(page) || 1);
  const [current, setCurrent] = useState(start);
  const [total, setTotal] = useState(doc?.pages ?? 0);
  const [error, setError] = useState<string>();
  const pdf = useRef<PdfRef>(null);
  const onDevice = !!id && hasLocalFile(id);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader
          onBack={goBackOr('/home')}
          title={doc?.title ?? 'Document'}
          subtitle={<Text style={styles.sub}>{total ? `Page ${current} of ${total}` : 'Opening…'}</Text>}
        />
        {!onDevice || error ? (
          <Text style={styles.missing}>
            {error ?? 'This PDF isn’t on this device. Upload it again to view its pages.'}
          </Text>
        ) : (
          <View style={styles.frame}>
            <Pdf
              ref={pdf}
              source={{ uri: pdfUri(id) }}
              page={start}
              style={styles.pdf}
              spacing={12}
              fitPolicy={0}
              enableDoubleTapZoom
              onLoadComplete={(n) => {
                setTotal(n);
                // Some platforms ignore `page` on first render; jump explicitly.
                if (start > 1) pdf.current?.setPage(Math.min(start, n));
              }}
              onPageChanged={(p, n) => {
                setCurrent(p);
                setTotal(n);
              }}
              onError={() => setError('Pagewise couldn’t open this PDF.')}
            />
          </View>
        )}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 3 },
  frame: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  pdf: { flex: 1, backgroundColor: 'transparent' },
  missing: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
});

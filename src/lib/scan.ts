import DocumentScanner, { ResponseType, ScanDocumentResponseStatus } from 'react-native-document-scanner-plugin';
import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Apple's document camera doesn't exist in the iOS Simulator: it opens and closes
 * at once, as if cancelled. Android emulators have a virtual camera, so they're fine.
 */
export const canScan = () => !(Platform.OS === 'ios' && !Device.isDevice);

export const NO_CAMERA_MESSAGE =
  'Scanning needs a camera, and the iOS Simulator doesn’t have one. Try it on a real iPhone or an Android phone.';

export const explainNoCamera = () => Alert.alert('Camera not available', NO_CAMERA_MESSAGE);

/** A4 at 72 dpi; each scanned page is fitted inside it. */
const PAGE = { width: 595, height: 842 };

/**
 * Opens the system document scanner (VisionKit on iOS, ML Kit on Android),
 * then joins the cropped pages into one PDF. Gemini reads the text in the
 * images directly, so no separate OCR step is needed.
 *
 * Returns null if the user cancelled.
 */
export async function scanToPdf(): Promise<{ uri: string; name: string; size?: number } | null> {
  const res = await DocumentScanner.scanDocument({ croppedImageQuality: 70, responseType: ResponseType.Base64, maxNumDocuments: 24 });
  const pages = res.scannedImages ?? [];
  if (res.status === ScanDocumentResponseStatus.Cancel || !pages.length) return null;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { margin: 0; }
    html, body { margin: 0; padding: 0; }
    .p { width: ${PAGE.width}px; height: ${PAGE.height}px; display: flex; align-items: center; justify-content: center; page-break-after: always; overflow: hidden; }
    .p:last-child { page-break-after: auto; }
    img { max-width: 100%; max-height: 100%; object-fit: contain; }
  </style></head><body>${pages
    .map((b64) => `<div class="p"><img src="${b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`}" /></div>`)
    .join('')}</body></html>`;

  const { uri } = await Print.printToFileAsync({ html, ...PAGE, margins: { left: 0, right: 0, top: 0, bottom: 0 } });
  const stamp = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return { uri, name: `Scan ${stamp}.pdf`, size: new File(uri).size ?? undefined };
}

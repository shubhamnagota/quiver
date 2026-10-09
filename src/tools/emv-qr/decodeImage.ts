/** Largest side we decode at; big photos are scaled down first, which also helps the decoder. */
const SIZES = [1200, 600];

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

/** Decodes QR pixels with jsQR, loaded only when an image is actually decoded. */
export async function decodePixels(data: Uint8ClampedArray, width: number, height: number): Promise<string | null> {
  const { default: jsQR } = await import('jsqr');
  return jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

async function nativeDetector(): Promise<BarcodeDetectorLike | null> {
  const Ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const formats = (await Ctor.getSupportedFormats?.()) ?? ['qr_code'];
    return formats.includes('qr_code') ? new Ctor({ formats: ['qr_code'] }) : null;
  } catch {
    return null;
  }
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This file couldn't be read as an image"));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url)) as Promise<HTMLImageElement>;
}

/**
 * Reads the QR code in an image entirely in the browser: the native
 * BarcodeDetector where available, otherwise jsQR. Nothing is uploaded.
 */
export async function decodeQrImage(file: Blob): Promise<string> {
  const img = await loadImage(file);
  const w0 = img.naturalWidth || 512;
  const h0 = img.naturalHeight || 512;
  const detector = await nativeDetector();

  for (const max of SIZES) {
    const scale = Math.min(1, max / Math.max(w0, h0));
    const width = Math.max(1, Math.round(w0 * scale));
    const height = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas is not available in this browser');
    // White backdrop so transparent PNGs/SVGs don't decode as black on black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    if (detector) {
      try {
        const [hit] = await detector.detect(canvas);
        if (hit?.rawValue) return hit.rawValue;
      } catch {
        // fall through to jsQR
      }
    }
    const { data } = ctx.getImageData(0, 0, width, height);
    const text = await decodePixels(data, width, height);
    if (text) return text;
    if (scale === 1) break;
  }
  throw new Error('No QR code found in this image. Try a sharper, closer crop of the code.');
}

/** The first image file in a drop or paste, if any. */
export function imageFrom(items: DataTransfer | null): File | null {
  if (!items) return null;
  for (const file of Array.from(items.files)) if (file.type.startsWith('image/')) return file;
  return null;
}

export type ClipboardContent = { kind: 'image'; file: File } | { kind: 'text'; text: string };

/**
 * Reads the clipboard after a click (the browser may ask for permission):
 * the first image if there is one, otherwise text, so a copied payload works too.
 */
export async function readClipboard(clipboard: Pick<Clipboard, 'read'> = navigator.clipboard): Promise<ClipboardContent> {
  let items: ClipboardItems;
  try {
    items = await clipboard.read();
  } catch (e) {
    if ((e as DOMException).name === 'NotAllowedError') {
      throw new Error('Clipboard access was blocked. Allow it for this site, or press ⌘V / Ctrl+V instead.', { cause: e });
    }
    throw new Error("Couldn't read the clipboard. Press ⌘V / Ctrl+V instead.", { cause: e });
  }
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'));
    if (type) return { kind: 'image', file: new File([await item.getType(type)], 'clipboard image', { type }) };
  }
  for (const item of items) {
    if (item.types.includes('text/plain')) {
      const text = (await (await item.getType('text/plain')).text()).trim();
      if (text) return { kind: 'text', text };
    }
  }
  throw new Error('The clipboard has no image or text. Copy a QR image first.');
}

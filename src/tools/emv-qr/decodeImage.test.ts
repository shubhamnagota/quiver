import { encode } from 'uqr';
import { decodePixels, imageFrom } from './decodeImage';
import { SPEC_SAMPLE } from './lib';

/** Renders a QR matrix to RGBA pixels, `scale` px per module, with a quiet zone. */
function rasterize(text: string, scale = 4, invert = false) {
  const { data } = encode(text, { ecc: 'M', border: 4 });
  const size = data.length * scale;
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dark = data[Math.floor(y / scale)]![Math.floor(x / scale)] !== invert;
      const v = dark ? 0 : 255;
      pixels.set([v, v, v, 255], (y * size + x) * 4);
    }
  }
  return { pixels, size };
}

describe('QR image decoding', () => {
  it('decodes an EMV payload, multi-byte characters included', async () => {
    const { pixels, size } = rasterize(SPEC_SAMPLE);
    expect(await decodePixels(pixels, size, size)).toBe(SPEC_SAMPLE);
  });

  it('decodes inverted (light on dark) codes', async () => {
    const { pixels, size } = rasterize('000201010211', 4, true);
    expect(await decodePixels(pixels, size, size)).toBe('000201010211');
  });

  it('returns null when there is no code', async () => {
    const blank = new Uint8ClampedArray(200 * 200 * 4).fill(255);
    expect(await decodePixels(blank, 200, 200)).toBeNull();
  });

  it('picks the first image from a drop or paste', () => {
    const png = new File([''], 'qr.png', { type: 'image/png' });
    const txt = new File([''], 'a.txt', { type: 'text/plain' });
    expect(imageFrom({ files: [txt, png] } as unknown as DataTransfer)).toBe(png);
    expect(imageFrom({ files: [txt] } as unknown as DataTransfer)).toBeNull();
    expect(imageFrom(null)).toBeNull();
  });
});

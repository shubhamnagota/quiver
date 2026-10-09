import { checkAddress, toChecksumAddress } from './cryptoAddress';

describe('checkAddress', () => {
  it('validates EIP-55 checksums (spec examples)', () => {
    for (const a of ['0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB']) {
      expect(checkAddress(a)).toMatchObject({ valid: true, chain: 'evm', kind: 'EVM (EIP-55 checksum)' });
    }
    expect(toChecksumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
    expect(checkAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD').valid).toBe(false);
    expect(checkAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toMatchObject({ valid: true, note: expect.stringMatching(/No checksum/) });
    expect(checkAddress('0x123').valid).toBe(false);
  });

  it('validates TRON addresses', () => {
    expect(checkAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toMatchObject({ valid: true, chain: 'tron' });
    expect(checkAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u')).toMatchObject({ valid: false, chain: 'tron' });
  });

  it('validates Bitcoin legacy and P2SH', () => {
    expect(checkAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toMatchObject({ valid: true, kind: 'Bitcoin legacy (P2PKH)' });
    expect(checkAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toMatchObject({ valid: true, kind: 'Bitcoin script (P2SH)' });
    expect(checkAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb').valid).toBe(false);
  });

  it('validates SegWit and Taproot (BIP173 / BIP350 vectors)', () => {
    expect(checkAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toMatchObject({ valid: true, kind: 'Bitcoin SegWit (bech32)' });
    expect(checkAddress('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4').valid).toBe(true);
    expect(checkAddress('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0')).toMatchObject({ valid: true, kind: 'Bitcoin Taproot (bech32m)' });
    expect(checkAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5').valid).toBe(false);
    // v0 program with a bech32m checksum is invalid (BIP350)
    expect(checkAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kemeawh').valid).toBe(false);
  });

  it('rejects unknown formats', () => {
    expect(checkAddress('hello').valid).toBe(false);
  });
});

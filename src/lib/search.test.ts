import { parseSearch, stringifySearch } from './search';

describe('search params', () => {
  it('round-trips strings without JSON coercion', () => {
    const search = stringifySearch({ input: '{"a":1}', n: '1700000000' });
    expect(parseSearch(search)).toEqual({ input: '{"a":1}', n: '1700000000' });
  });

  it('drops empty values', () => {
    expect(stringifySearch({ input: '', other: undefined })).toBe('');
  });
});

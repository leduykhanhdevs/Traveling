import { beforeEach, describe, expect, it } from '@jest/globals';
import { useOfflinePhrasesStore } from '../stores/offlinePhrasesStore';

describe('offlinePhrasesStore', () => {
  beforeEach(() => {
    useOfflinePhrasesStore.setState({ packs: {} });
  });

  it('starts with no downloaded phrase packs', () => {
    expect(useOfflinePhrasesStore.getState().packs).toEqual({});
  });

  it('downloads a 500 phrase pack for a country code', () => {
    useOfflinePhrasesStore.getState().downloadPack('vn');

    const vietnamPack = useOfflinePhrasesStore.getState().packs.vn;
    expect(vietnamPack).toHaveLength(500);
    expect(vietnamPack?.[0]).toEqual({
      id: 'vn-1',
      category: 'Arrival',
      source: 'Essential arrival phrase 1',
      translation: '[VN] Essential arrival phrase 1',
    });
  });

  it('removes only the requested country pack', () => {
    useOfflinePhrasesStore.getState().downloadPack('vn');
    useOfflinePhrasesStore.getState().downloadPack('jp');

    useOfflinePhrasesStore.getState().removePack('vn');

    expect(useOfflinePhrasesStore.getState().packs.vn).toBeUndefined();
    expect(useOfflinePhrasesStore.getState().packs.jp).toHaveLength(500);
  });
});

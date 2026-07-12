import { beforeEach, describe, expect, it } from '@jest/globals';
import { useOfflinePhrasesStore } from '../stores/offlinePhrasesStore';

describe('offlinePhrasesStore', () => {
  beforeEach(() => {
    useOfflinePhrasesStore.setState({ packs: {} });
  });

  it('starts with no downloaded phrase packs', () => {
    expect(useOfflinePhrasesStore.getState().packs).toEqual({});
  });

  it('downloads the real Vietnamese phrase pack for a country code', () => {
    useOfflinePhrasesStore.getState().downloadPack('vn');

    const vietnamPack = useOfflinePhrasesStore.getState().packs.vn;
    expect(vietnamPack).toHaveLength(17);
    expect(vietnamPack?.[0]).toEqual({
      id: 'vn-1',
      category: 'arrival',
      source: 'Where is the baggage claim?',
      translation: 'Khu nhận hành lý ở đâu?',
    });
    expect(vietnamPack?.every((phrase) => !/^\[[A-Z-]+]\s/.test(phrase.translation))).toBe(
      true,
    );
  });

  it('removes only the requested country pack', () => {
    useOfflinePhrasesStore.getState().downloadPack('vn');
    useOfflinePhrasesStore.getState().downloadPack('jp');

    useOfflinePhrasesStore.getState().removePack('vn');

    expect(useOfflinePhrasesStore.getState().packs.vn).toBeUndefined();
    expect(useOfflinePhrasesStore.getState().packs.jp).toHaveLength(17);
    expect(useOfflinePhrasesStore.getState().packs.jp?.[0]?.translation).toBe(
      '手荷物受取所はどこですか？',
    );
  });

  it('does not fabricate translations for an unsupported country', () => {
    useOfflinePhrasesStore.getState().downloadPack('xx');

    expect(useOfflinePhrasesStore.getState().packs.xx).toBeUndefined();
  });
});

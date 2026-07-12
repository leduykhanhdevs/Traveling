import { Volume2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

export type PhrasebookPhrase = {
  id: string;
  category: string;
  phrase: string;
};

type PhrasebookSheetProps = {
  onClose: () => void;
  onPlayPhrase: (phrase: PhrasebookPhrase) => void;
  phrases: readonly PhrasebookPhrase[];
  visible: boolean;
};

export const PhrasebookSheet = ({
  onClose,
  onPlayPhrase,
  phrases,
  visible,
}: PhrasebookSheetProps): JSX.Element => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categories = useMemo(
    () => [...new Set(phrases.map((phrase) => phrase.category))],
    [phrases],
  );
  const selectedCategory =
    activeCategory && categories.includes(activeCategory) ? activeCategory : categories[0] ?? null;
  const activePhrases = useMemo(
    () => phrases.filter((phrase) => phrase.category === selectedCategory),
    [phrases, selectedCategory],
  );

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          accessibilityLabel="Phrasebook bottom sheet"
          accessibilityViewIsModal
          className="max-h-[84vh] rounded-t-3xl border border-white/10 bg-surface px-5 pb-8 pt-5"
        >
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="font-inter-bold text-2xl text-white">Phrasebook</Text>
              <Text className="mt-1 font-inter text-sm text-zinc-400">Quick phrases for the moment</Text>
            </View>
            <TouchableOpacity
              accessibilityHint="Closes the phrasebook panel."
              accessibilityLabel="Close phrasebook"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              onPress={onClose}
            >
              <X color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          <FlatList
            accessibilityLabel="Phrasebook categories"
            className="mb-4 max-h-12"
            data={categories}
            horizontal
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const selected = item === selectedCategory;
              return (
                <TouchableOpacity
                  accessibilityHint={`Shows ${item} phrases.`}
                  accessibilityLabel={`${item} phrase category`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`mr-2 rounded-full px-4 py-2 ${selected ? 'bg-white' : 'bg-white/10'}`}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text className={`font-inter-semibold text-sm ${selected ? 'text-slate-950' : 'text-white'}`}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
          />

          <FlatList
            accessibilityLabel={`${selectedCategory ?? ''} phrases`}
            contentContainerClassName="gap-3 pb-3"
            data={activePhrases}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-inter-bold text-lg text-white">{item.phrase}</Text>
                    <View className="mt-3 self-start rounded-full bg-emerald-500/20 px-3 py-1">
                      <Text className="font-inter-semibold text-xs text-emerald-300">
                        ✓ Available offline
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    accessibilityHint={`Plays ${item.phrase} aloud.`}
                    accessibilityLabel={`Play phrase ${item.phrase}`}
                    accessibilityRole="button"
                    className="h-11 w-11 items-center justify-center rounded-full bg-primary"
                    onPress={() => onPlayPhrase(item)}
                  >
                    <Volume2 color="#FFFFFF" size={19} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <PrimaryButton
            accessibilityHint="Closes the phrasebook panel."
            className="mt-3"
            label="Done"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};

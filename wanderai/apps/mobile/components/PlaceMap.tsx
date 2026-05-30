import { Text, View } from 'react-native';

type PlaceMapProps = {
  lat: number;
  lng: number;
  title: string;
};

export const PlaceMap = ({ lat, lng, title }: PlaceMapProps): JSX.Element => (
  <View
    accessibilityLabel={`Map preview for ${title} at ${lat.toFixed(5)}, ${lng.toFixed(5)}.`}
    className="h-56 w-full justify-center rounded-lg bg-white/10 p-4"
  >
    <Text className="font-inter-bold text-white">{title}</Text>
    <Text className="mt-2 font-inter text-zinc-300">
      Map preview: {lat.toFixed(5)}, {lng.toFixed(5)}
    </Text>
  </View>
);

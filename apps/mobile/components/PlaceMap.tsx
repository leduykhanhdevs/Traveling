import { Image, Text, View } from 'react-native';

type PlaceMapProps = {
  lat: number;
  lng: number;
  title: string;
};

export const PlaceMap = ({ lat, lng, title }: PlaceMapProps): JSX.Element => {
  const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&l=map&size=650,350&pt=${lng},${lat},pm2rdl`;
  return (
    <View
      accessibilityLabel={`Map preview for ${title} at ${lat.toFixed(5)}, ${lng.toFixed(5)}.`}
      className="h-56 w-full overflow-hidden rounded-lg border border-white/10 bg-white/10"
    >
      <Image
        source={{ uri: mapUrl }}
        className="h-full w-full"
        resizeMode="cover"
      />
      <View className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-md">
        <Text className="font-inter-bold text-xs text-white" numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
};

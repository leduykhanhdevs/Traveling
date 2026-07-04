import MapView, { Marker } from 'react-native-maps';

type PlaceMapProps = {
  lat: number;
  lng: number;
  title: string;
};

export const PlaceMap = ({ lat, lng, title }: PlaceMapProps): JSX.Element => (
  <MapView
    accessibilityLabel={`Map preview for ${title} at ${lat.toFixed(5)}, ${lng.toFixed(5)}.`}
    className="h-56 w-full rounded-lg"
    initialRegion={{
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }}
  >
    <Marker
      coordinate={{
        latitude: lat,
        longitude: lng,
      }}
      title={title}
    />
  </MapView>
);

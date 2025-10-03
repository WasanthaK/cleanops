/**
 * GPS helper capturing location when available.
 */
export async function captureGps(): Promise<GeolocationCoordinates | null> {
  if (!('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

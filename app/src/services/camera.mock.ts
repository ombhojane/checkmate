// Mock camera service for Expo Go compatibility
// In production, you would replace this with actual expo-camera

export const useCameraPermissions = () => {
  return [null, () => Promise.resolve()];
};

export const Camera = {
  Constants: {
    Type: {
      Back: 0,
      Front: 1,
    },
    FlashMode: {
      Off: 0,
      On: 1,
      Auto: 2,
    },
  },
};

export const CameraView = () => null;

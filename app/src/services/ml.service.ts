import * as tf from '@tensorflow/tfjs';
// Optional: `@tensorflow/tfjs-react-native` is intentionally not a strict dependency
// to avoid peer dependency conflicts with Expo SDK versions. If installed and
// available (for bare or prebuilt apps), the library will be dynamically loaded
// and bundleResourceIO will be used to load local models. Otherwise, server-side
// inference will be used.
import AsyncStorage from '@react-native-async-storage/async-storage';

class MLModelService {
  private textModel: tf.LayersModel | null = null;
  private imageModel: tf.GraphModel | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    try {
      // Initialize TensorFlow.js for React Native
      await tf.ready();
      console.log('TensorFlow.js initialized');

      // Load local models
      await this.loadModels();
      
      this.isInitialized = true;
      console.log('ML models loaded successfully');
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
      throw error;
    }
  }

  private async loadModels(): Promise<void> {
    try {
      // Try loading @tensorflow/tfjs-react-native dynamically to enable bundled
      // model loading (bundleResourceIO) in bare workflow or prebuilt apps.
      let bundleResourceIO: any | null = null;
      try {
        // @ts-ignore - optional import may not exist depending on app workflow
        const tfjsRN = await import('@tensorflow/tfjs-react-native');
        bundleResourceIO = tfjsRN?.bundleResourceIO;
      } catch (e) {
        // Not available (e.g., managed Expo workflow with incompatible versions)
        const err: any = e;
        console.warn('Optional @tensorflow/tfjs-react-native not available, skipping local model loads:', err?.message ?? err);
      }

      // Load text classification model (for quick on-device checks)
      // In production, bundle lightweight models with the app and enable bundleResourceIO
      if (bundleResourceIO) {
        // const modelJson = require('./models/text-classifier/model.json');
        // const modelWeights = require('./models/text-classifier/weights.bin');
        // this.textModel = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
      }

      // Load image verification model (lightweight MobileNet-based)
      if (bundleResourceIO) {
        // this.imageModel = await tf.loadGraphModel(bundleResourceIO(imageModelJson, imageModelWeights));
      }

      console.log('Local models loaded (mock)');
    } catch (error) {
      console.warn('Could not load local models, will use server-side only:', error);
    }
  }

  async verifyTextLocally(text: string): Promise<{ score: number; confidence: number } | null> {
    if (!this.isInitialized || !this.textModel) {
      return null; // Fall back to server
    }

    try {
      // Preprocess text
      const tokens = this.tokenizeText(text);
      const tensor = tf.tensor2d([tokens], [1, tokens.length]);

      // Run inference
      const prediction = this.textModel.predict(tensor) as tf.Tensor;
      const scores = await prediction.data();

      // Cleanup
      tensor.dispose();
      prediction.dispose();

      return {
        score: Math.round(scores[0] * 100),
        confidence: scores[1] || 0.5,
      };
    } catch (error) {
      console.error('Local text verification failed:', error);
      return null;
    }
  }

  async verifyImageLocally(imageUri: string): Promise<{ score: number; confidence: number } | null> {
    if (!this.isInitialized || !this.imageModel) {
      return null; // Fall back to server
    }

    try {
      // Load and preprocess image
      // In production, use react-native-fs or expo-file-system
      // const image = await this.loadImage(imageUri);
      // const tensor = this.preprocessImage(image);

      // Run inference
      // const prediction = this.imageModel.predict(tensor) as tf.Tensor;
      // const scores = await prediction.data();

      // Cleanup
      // tensor.dispose();
      // prediction.dispose();

      // Mock response
      return {
        score: 75,
        confidence: 0.8,
      };
    } catch (error) {
      console.error('Local image verification failed:', error);
      return null;
    }
  }

  private tokenizeText(text: string): number[] {
    // Simple tokenization (in production, use proper tokenizer matching the model)
    const words = text.toLowerCase().split(/\s+/);
    return words.map((word) => this.wordToId(word)).slice(0, 128);
  }

  private wordToId(word: string): number {
    // Mock word-to-id mapping (in production, use actual vocabulary)
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  async cacheVerificationResult(id: string, result: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `verification_${id}`,
        JSON.stringify(result)
      );
    } catch (error) {
      console.error('Failed to cache result:', error);
    }
  }

  async getCachedVerificationResult(id: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`verification_${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached result:', error);
      return null;
    }
  }

  cleanup(): void {
    if (this.textModel) {
      this.textModel.dispose();
    }
    if (this.imageModel) {
      this.imageModel.dispose();
    }
    this.isInitialized = false;
  }
}

export const mlModelService = new MLModelService();

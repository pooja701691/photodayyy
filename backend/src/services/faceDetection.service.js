const path = require('path');
const sharp = require('sharp');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');

class FaceDetectionService {
  constructor() {
    this.modelsLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Initializes the WASM backend and loads model weights from disk.
   */
  async loadModels() {
    if (this.modelsLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      console.log('[FaceDetection] Initializing TensorFlow WASM backend...');
      await faceapi.tf.setBackend('wasm');
      await faceapi.tf.ready();
      console.log(`[FaceDetection] Backend set to: ${faceapi.tf.getBackend()}`);

      const modelPath = path.join(__dirname, '../../models');
      console.log(`[FaceDetection] Loading face-api models from: ${modelPath}`);

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

      this.modelsLoaded = true;
      console.log('[FaceDetection] All face-api models loaded successfully.');
    })();

    return this.loadingPromise;
  }

  /**
   * Detects all faces in an image buffer and calculates their 128-d vector embeddings.
   *
   * @param {Buffer} imageBuffer - Raw binary image buffer (JPEG, PNG, WebP, etc.)
   * @returns {Promise<Array<{ faceIndex: number, score: number, box: { x: number, y: number, width: number, height: number }, embedding: number[] }>>}
   */
  async detectAndEmbedFaces(imageBuffer) {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      throw new Error('Invalid image buffer provided for face detection');
    }

    await this.loadModels();

    let tensor = null;
    try {
      // 1. Decode image to raw RGB bytes using sharp
      const { data, info } = await sharp(imageBuffer)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 2. Create 3D tensor [height, width, 3]
      tensor = faceapi.tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);

      // 3. Detect all faces with landmarks and 128-d descriptors
      const detections = await faceapi
        .detectAllFaces(tensor)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // 4. Format detections
      return detections.map((det, index) => ({
        faceIndex: index,
        score: parseFloat(det.detection.score.toFixed(4)),
        box: {
          x: Math.round(det.detection.box.x),
          y: Math.round(det.detection.box.y),
          width: Math.round(det.detection.box.width),
          height: Math.round(det.detection.box.height),
        },
        embedding: Array.from(det.descriptor), // 128 elements Float32 -> Array of numbers
      }));
    } catch (error) {
      console.error('[FaceDetection] Error during face detection/embedding:', error.message);
      throw error;
    } finally {
      // Free tensor memory to prevent memory leaks
      if (tensor) {
        tensor.dispose();
      }
    }
  }
}

module.exports = new FaceDetectionService();

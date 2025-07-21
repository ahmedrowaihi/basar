import { expose, transfer } from 'comlink';
import { loadModels, detect as runDetect } from '../detection';
import { Human } from '@vladmandic/human';
import type { DetectionOptions, DetectionResult } from '../detection/types';

interface SerializableDetectionResult {
  result: DetectionResult['result'];
  gender?: DetectionResult['gender'];
  details?: {
    nsfw?: number[];
    human?: { face: number; };
    error?: string;
  };

  videoFrames?: {
    frameNumber: number;
    timestamp: number;
    result: DetectionResult['result'];
    nsfwScores?: number[];
    faceCount?: number;
  }[];
  videoSummary?: {
    totalFrames: number;
    nsfwFrames: number;
    faceFrames: number;
    maxNsfwScore: number;
    averageNsfwScore: number;
  };
}

interface QueueItem {
  id: string;
  bitmap: ImageBitmap;
  options: DetectionOptions;
  resolve: (result: SerializableDetectionResult) => void;
  reject: (error: Error) => void;
}

interface CacheEntry {
  result: SerializableDetectionResult;
  timestamp: number;
  options: DetectionOptions;
}

let ready = false;
let isProcessing = false;
const queue: QueueItem[] = [];
const cache = new Map<string, CacheEntry>();


async function hashImageBitmap(bitmap: ImageBitmap): Promise<string> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  

  const imageData = ctx.getImageData(0, 0, Math.min(bitmap.width, 100), Math.min(bitmap.height, 100));
  const data = imageData.data;
  
  let hash = 0;
  for (let i = 0; i < data.length; i += 4) {
    hash = ((hash << 5) - hash + data[i] + data[i + 1] + data[i + 2]) & 0xffffffff;
  }
  
  return hash.toString(16);
}


function createCacheKey(imageHash: string, options: DetectionOptions): string {
  return `${imageHash}_${JSON.stringify(options)}`;
}


function cleanCache() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, entry] of cache.entries()) {
    if (entry.timestamp < oneHourAgo) {
      cache.delete(key);
    }
  }
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;
    
    try {

      

      const imageHash = await hashImageBitmap(item.bitmap);
      const cacheKey = createCacheKey(imageHash, item.options);
      

      const cached = cache.get(cacheKey);
      if (cached) {

        item.resolve(cached.result);
        continue;
      }
      

      const result = await runDetect(item.bitmap, item.options);
      
      const serializableResult: SerializableDetectionResult = {
        result: result.result,
        gender: result.gender
      };
      
      if (result.details) {
        serializableResult.details = {};
        
        if (result.details.nsfw) {
          serializableResult.details.nsfw = result.details.nsfw;
        }
        
        if (result.details.error) {
          serializableResult.details.error = result.details.error;
        }
        

        if (result.details.human && result.details.human.face) {
          serializableResult.details.human = {
            face: result.details.human.face.length
          };
        }
      }
      

      cache.set(cacheKey, {
        result: serializableResult,
        timestamp: Date.now(),
        options: item.options
      });
      

      if (cache.size > 100) {
        cleanCache();
      }
      

      item.resolve(serializableResult);
    } catch (error) {
      console.error(`❌ Detection failed for ${item.id}:`, error);
      item.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  isProcessing = false;
}

async function init(modelUrl?: string) {
  if (ready) return;
  await loadModels({ 
    options: { nsfwModelUrl: modelUrl || '/models/nsfwjs/model.json' }, 
    HumanCtor: Human 
  });
  ready = true;
}

async function detect(
  bitmap: ImageBitmap, 
  opts: DetectionOptions = {}
): Promise<SerializableDetectionResult> {
  await init();
  
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substr(2, 9);
    const queueItem: QueueItem = {
      id,
      bitmap,
      options: opts,
      resolve,
      reject
    };
    
    queue.push(queueItem);
    processQueue();
  });
}

async function getQueueStatus() {
  return {
    queueLength: queue.length,
    isProcessing,
    ready,
    cacheSize: cache.size
  };
}

async function clearCache() {
  cache.clear();
}

export type WorkerAPI = {
  init(modelUrl?: string): Promise<void>;
  detect(input: ImageBitmap, opts?: DetectionOptions): Promise<SerializableDetectionResult>;
  getQueueStatus(): Promise<{ queueLength: number; isProcessing: boolean; ready: boolean; cacheSize: number }>;
  clearCache(): Promise<void>;
};

expose({
  init,
  detect: (bmp: ImageBitmap, o: DetectionOptions) => detect(bmp, o).then(result => transfer(result, [])),
  getQueueStatus,
  clearCache
}); 
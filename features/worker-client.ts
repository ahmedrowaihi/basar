import { transfer, wrap, type Remote } from 'comlink';
import type { DetectionOptions, DetectionResult } from './detection/types';
import type { WorkerAPI } from './worker';

let proxy: Remote<WorkerAPI> | null = null;

async function getProxy() {
  if (proxy) return proxy;
  

  const workerUrl = '/basar-worker/index.js';
  
  const worker = new Worker(workerUrl, { type: 'module' });
  proxy = wrap<WorkerAPI>(worker);
  await proxy.init();
  return proxy;
}

export async function detect(
  input: ImageBitmap | OffscreenCanvas | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  opts: DetectionOptions = {}
): Promise<DetectionResult> {
  const api = await getProxy();
  

  let bitmap: ImageBitmap;
  
  if (input instanceof ImageBitmap) {
    bitmap = input;
  } else if (input instanceof OffscreenCanvas) {
    bitmap = await createImageBitmap(input);
  } else {
    bitmap = await createImageBitmap(input);
  }
  
  const transferredBitmap = transfer(bitmap, [bitmap]);
  const result = await api.detect(transferredBitmap, opts);
  
  return {
    result: result.result,
    gender: result.gender,
    details: result.details ? {
      nsfw: result.details.nsfw,
      human: result.details.human ? { face: [] } : undefined,
      error: result.details.error
    } : undefined
  } as DetectionResult;
}

export async function getQueueStatus(): Promise<{ queueLength: number; isProcessing: boolean; ready: boolean; cacheSize: number }> {
  const api = await getProxy();
  return api.getQueueStatus();
}

export async function clearCache(): Promise<void> {
  const api = await getProxy();
  return api.clearCache();
}
import type * as tfType from "@tensorflow/tfjs-core";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import type { ModelsStorage } from "./models-storage";
export const NSFW_MODEL_KEY = "indexeddb://nsfw-model";
export const indexedDbStorage: ModelsStorage = {
    async getModel(tf: typeof tfType) {
        const models = await tf.io.listModels();
        return models[NSFW_MODEL_KEY]
            ? await loadGraphModel(NSFW_MODEL_KEY)
            : null;
    },
    async setModel(tf: typeof tfType, nsfwModel) {
        if (!nsfwModel) return;
        await nsfwModel.save(NSFW_MODEL_KEY);
    },
};

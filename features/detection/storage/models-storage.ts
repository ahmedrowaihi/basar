import type { GraphModel } from "@vladmandic/human";

export interface ModelsStorage {
    getModel(tf: any): Promise<GraphModel | null>;
    setModel(tf: any, nsfwModel: GraphModel): Promise<void>;
}

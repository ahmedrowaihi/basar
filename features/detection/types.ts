import type {
    Config,
    Result as HumanDetectResult,
    Human,
} from "@vladmandic/human";
import type { ModelsStorage } from "./storage/models-storage";


export interface DetectionOptions {
    detectNSFW?: boolean;
    detectGender?: boolean;
    detectMale?: boolean;
    detectFemale?: boolean;
    strictness?: number;
}


export interface ModelLoadOptions {
    nsfwModelUrl: string;
}


export type DetectionResultType = "nsfw" | "face" | "clear" | "error";

export interface DetectionResult {
    result: "nsfw" | "face" | "clear" | "error";
    gender?: "male" | "female" | "unknown" | null;
    details?: {
        nsfw?: number[];
        human?: any;
        error?: string;
    };

    videoFrames?: {
        frameNumber: number;
        timestamp: number;
        result: "nsfw" | "face" | "clear" | "error";
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

export interface LoadModelsArgs {
    options: ModelLoadOptions;
    HumanCtor: { new (userConfig?: Partial<Config>): Human };
    humanConfig?:
        | Partial<Config>
        | ((config: Partial<Config>) => Partial<Config>);
    modelsStorage?: ModelsStorage;
}

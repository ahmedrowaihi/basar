import type {
    Config,
    Result as HumanDetectResult,
    Human,
} from "@vladmandic/human";
import type { ModelsStorage } from "./storage/models-storage";

// Detection options for the API
export interface DetectionOptions {
    detectNSFW?: boolean;
    detectGender?: boolean;
    detectMale?: boolean;
    detectFemale?: boolean;
    strictness?: number; // 0-1, how strict the NSFW/gender detection should be
}

// Model loading options
export interface ModelLoadOptions {
    nsfwModelUrl: string;
}

// Possible detection results
export type DetectionResultType = "nsfw" | "face" | "clear" | "error";

export interface DetectionResult {
    result: DetectionResultType;
    gender?: "male" | "female" | "unknown" | null;
    details?: {
        nsfw?: number[];
        human?: HumanDetectResult;
        error?: string;
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

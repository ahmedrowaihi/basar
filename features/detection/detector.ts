import type * as tfType from "@tensorflow/tfjs-core";
import type { Config, GraphModel, Human } from "@vladmandic/human";
import { indexedDbStorage } from "./storage/indexeddb-storage";
import type {
    DetectionOptions,
    DetectionResult,
    LoadModelsArgs,
} from "./types";

let nsfwModel: GraphModel = null!;
let human: Human = null!;

/**
 * Loads the required models for detection (NSFW, face/gender).
 * - Loads the NSFW model from a local path (default: models/nsfwjs/model.json)
 * - Initializes Human.js for face/gender detection
 * @param options.nsfwModelUrl Path to NSFW model.json (default: models/nsfwjs/model.json)
 * @param options.humanModelUrl Optional: Human.js modelBasePath (default: CDN)
 */
export async function loadModels({
    options,
    HumanCtor,
    humanConfig = {},
    modelsStorage = indexedDbStorage,
}: LoadModelsArgs): Promise<void> {
    if (!HumanCtor) {
        throw new Error(
            "You must provide the Human.js constructor or an instance as an argument to loadModels"
        );
    }
    let HUMAN_CONFIG: Partial<Config> = {
        modelBasePath: "https://cdn.jsdelivr.net/npm/@vladmandic/human/models/",
        backend: "humangl",
        cacheSensitivity: 0.9,
        warmup: "none",
        async: true,
        face: {
            enabled: true,
            iris: { enabled: false },
            mesh: { enabled: false },
            emotion: { enabled: false },
            detector: {
                modelPath: "blazeface.json",
                maxDetected: 2,
                minConfidence: 0.25,
            },
            description: { enabled: true, modelPath: "faceres.json" },
        },
        body: { enabled: false },
        hand: { enabled: false },
        gesture: { enabled: false },
        object: { enabled: false },
        filter: { enabled: false },
    };
    if (typeof humanConfig === "function") {
        HUMAN_CONFIG = humanConfig(HUMAN_CONFIG);
    } else {
        HUMAN_CONFIG = { ...HUMAN_CONFIG, ...humanConfig };
    }

    human = new HumanCtor(HUMAN_CONFIG);
    await human.load();
    const tf = human.tf;

    const cachedNsfwModel = await modelsStorage.getModel(tf);
    if (cachedNsfwModel) {
        nsfwModel = cachedNsfwModel;
    } else {
        nsfwModel = (await tf.loadGraphModel(
            options.nsfwModelUrl
        )) as GraphModel;
        await modelsStorage.setModel(tf, nsfwModel);
    }

    if (tf && tf.zeros) {
        const tensor = tf.zeros([1, 224, 224, 3]);
        await human.detect(tensor);
        await nsfwModel.predict(tensor);
        tf.dispose(tensor);
    }
}

/**
 * Runs detection on an image/canvas element.
 * Returns a DetectionResult indicating NSFW/face/clear/error.
 */
export async function detect(
    input:
        | HTMLImageElement
        | HTMLVideoElement
        | HTMLCanvasElement
        | ImageBitmap,
    options: DetectionOptions = {}
): Promise<DetectionResult> {
    if (!nsfwModel || !human) {
        throw new Error("Models not loaded. Call loadModels() first.");
    }
    try {
        const tf = human.tf as typeof tfType;
        const tensor = tf.browser.fromPixels(input);
        let nsfw = false;
        let face = false;
        let gender: "male" | "female" | "unknown" | null = null;
        let details: DetectionResult["details"] = {};

        if (options.detectNSFW) {
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            const floatResized = tf.cast(resized, "float32");
            const normalized = tf.expandDims(tf.div(floatResized, 255.0), 0);
            const pred = nsfwModel.predict(normalized);
            let nsfwTensor: tfType.Tensor;
            if (Array.isArray(pred)) {
                nsfwTensor = pred[0];
            } else if (
                (pred as any).data === undefined &&
                typeof pred === "object"
            ) {

                nsfwTensor = Object.values(pred)[0];
            } else {
                nsfwTensor = pred as tfType.Tensor;
            }
            const nsfwPred = await nsfwTensor.data();
            details.nsfw = Array.from(nsfwPred);
            const strict = options.strictness ?? 0.5;
            if (nsfwPred.length === 2) {
                if (nsfwPred[1] > strict) nsfw = true;
            } else if (nsfwPred.length === 5) {
                if (
                    nsfwPred[1] > strict ||
                    nsfwPred[3] > strict ||
                    nsfwPred[4] > strict
                ) {
                    nsfw = true;
                }
            }
            tf.dispose([resized, floatResized, normalized]);
        }


        if (options.detectGender) {
            const predictions = await human.detect(input);
            details.human = predictions;
            if (predictions.face && predictions.face.length > 0) {

                let bestFace = predictions.face[0];
                for (const f of predictions.face) {
                    if ((f.genderScore ?? 0) > (bestFace.genderScore ?? 0)) {
                        bestFace = f;
                    }
                }
                if (
                    bestFace.gender &&
                    bestFace.genderScore &&
                    bestFace.genderScore > 0.5
                ) {
                    gender = bestFace.gender === "male" ? "male" : "female";
                } else {
                    gender = "unknown";
                }
                for (const f of predictions.face) {
                    if (
                        options.detectMale &&
                        f.gender === "male" &&
                        f.genderScore &&
                        f.genderScore > 0.5
                    )
                        face = true;
                    if (
                        options.detectFemale &&
                        f.gender === "female" &&
                        f.genderScore &&
                        f.genderScore > 0.5
                    )
                        face = true;
                    if (!options.detectMale && !options.detectFemale)
                        face = true;
                }
            }
        }

        tf.dispose(tensor);
        let result: DetectionResult["result"] = "clear";
        if (nsfw) result = "nsfw";
        else if (face) result = "face";
        return { result, gender, details };
    } catch (e) {
        return {
            result: "error",
            details: { error: (e as Error).message },
        };
    }
}

export function getTF() {
    return human ? (human.tf as typeof tfType) : null;
}

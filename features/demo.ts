import type { Human } from "@vladmandic/human";
import {
    applyBlur,
    detect,
    getTF,
    loadModels,
    removeBlur,
    setBlurDefaults,
} from "./main";

setBlurDefaults({
    amount: 20,
    grayscale: true,
});

declare global {
    interface Window {
        Human: {
            Human: typeof Human;
        };
    }
}

const unblurCheckbox = document.getElementById(
    "unblurHover"
) as HTMLInputElement;
let modelsLoaded = false;
async function ensureModelsLoaded(forceReload = false) {
    if (!modelsLoaded || forceReload) {
        if (forceReload) {
            console.log("Forcing reload of models...");
        }
        await loadModels({
            options: {
                nsfwModelUrl: "/models/nsfwjs/model.json",
            },
            HumanCtor: window.Human.Human,
        });
        modelsLoaded = true;
        console.log("Models loaded");
    }
}

document
    .getElementById("forceReloadBtn")
    ?.addEventListener("click", async () => {
        // Clear NSFW model from IndexedDB before reloading
        const tf = getTF();
        if (tf && tf.io && tf.io.removeModel) {
            try {
                await tf.io.removeModel("indexeddb://nsfw-model");
                console.log("Cleared NSFW model from IndexedDB");
            } catch (e) {
                console.warn("Failed to clear NSFW model from IndexedDB:", e);
            }
        }
        modelsLoaded = false;
        await ensureModelsLoaded(true);
        alert("Models reloaded from scratch!");
    });
async function runTest(file: File) {
    try {
        await ensureModelsLoaded();
    } catch (e) {
        console.error("Model loading error:", e);
        return;
    }
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.className = "media-preview";
    const container = document.createElement("div");
    container.className = "media-container";
    container.appendChild(img);
    const doDetection = async () => {
        console.log("Image loaded, running detection...");
        try {
            const result = await detect(img, {
                detectNSFW: true,
                detectGender: true,
            });
            console.log("Detection result:", result);
            const preview = document.getElementById("preview");
            if (!preview) return;
            preview.innerHTML = "";
            preview.appendChild(container);
            removeBlur(container);
            if (result.result === "nsfw" || result.result === "face") {
                applyBlur(container, {
                    unblurOnHover: unblurCheckbox?.checked,
                });
            }
            const summary = document.createElement("div");
            summary.className = "summary";
            summary.innerHTML = `<b>Result:</b> ${result.result} <b>Gender:</b> ${result.gender ?? "n/a"}`;
            preview?.appendChild(summary);
            const detailsElem = document.createElement("details");
            const summaryElem = document.createElement("summary");
            summaryElem.textContent = "Show details";
            detailsElem.appendChild(summaryElem);
            const pre = document.createElement("pre");
            pre.textContent = JSON.stringify(result.details, null, 2);
            detailsElem.appendChild(pre);
            preview?.appendChild(detailsElem);
        } catch (e) {
            console.error("Detection error:", e);
        }
    };
    img.onload = doDetection;
    img.onerror = (e) => {
        console.error("Image load error:", e);
    };
    img.src = URL.createObjectURL(file);
    if (img.complete) {
        doDetection();
    }
}
document.getElementById("fileInput")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const file = event.target.files?.[0];
    if (!file) return;
    runTest(file);
});
window.addEventListener("paste", (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
                runTest(file);
            }
            event.preventDefault();
            break;
        }
    }
});
// Video detection logic
const videoInput = document.getElementById("videoInput");
const videoPreview = document.getElementById("videoPreview");
let videoDetectionInterval: NodeJS.Timeout | null = null;
let lastVideoResult = {
    nsfw: false,
    face: false,
};
videoInput?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const file = event.target?.files?.[0];
    if (!file) return;
    runVideoTest(file);
});
async function runVideoTest(file: File) {
    try {
        await ensureModelsLoaded();
    } catch (e) {
        console.error("Model loading error:", e);
        return;
    }
    if (videoDetectionInterval) clearInterval(videoDetectionInterval);
    if (!videoPreview) return;
    videoPreview.innerHTML = "";
    lastVideoResult = {
        nsfw: false,
        face: false,
    };
    const video = document.createElement("video");
    video.controls = true;
    video.crossOrigin = "anonymous";
    video.className = "media-preview";
    const container = document.createElement("div");
    container.className = "media-container";
    container.appendChild(video);
    video.src = URL.createObjectURL(file);
    videoPreview?.appendChild(container);
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    const summary = document.createElement("div");
    summary.className = "summary";
    videoPreview?.appendChild(summary);
    const detailsElem = document.createElement("details");
    const summaryElem = document.createElement("summary");
    summaryElem.textContent = "Show details";
    detailsElem.appendChild(summaryElem);
    const pre = document.createElement("pre");
    detailsElem.appendChild(pre);
    videoPreview?.appendChild(detailsElem);
    video.addEventListener("loadeddata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        videoDetectionInterval = setInterval(async () => {
            if (video.paused || video.ended) return;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
                const result = await detect(canvas, {
                    detectNSFW: true,
                    detectGender: true,
                });
                lastVideoResult = {
                    nsfw: result.result === "nsfw",
                    face: result.result === "face",
                };
                summary.innerHTML = `<b>Result:</b> ${result.result} <b>Gender:</b> ${result.gender ?? "n/a"}`;
                pre.textContent = JSON.stringify(result.details, null, 2);
            } catch (e) {
                summary.innerHTML = "Detection error";
                pre.textContent = (e as Error).message;
            }
        }, 500);
    });
    video.addEventListener("ended", () => {
        if (videoDetectionInterval) clearInterval(videoDetectionInterval);
        removeBlur(container);
    });
}

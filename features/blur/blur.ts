import type { BlurOptions, BlurConfig } from "./types";

/**
 * This blur utility applies a CSS blur to the entire DOM element (e.g., <img>, <video>),
 * not just the detected face or NSFW region. This matches the original extension's behavior.
 *
 * For region-specific blurring (e.g., only the face area), use the div overlay utility below.
 */

const BLUR_CLASS = "hb-blur";
let globalConfig: BlurConfig = {
    amount: 20,
    grayscale: true,
    unblurOnHover: false,
};
let styleTag: HTMLStyleElement | null = null;

function ensureStyle(options: BlurOptions = {}) {
    const config = { ...globalConfig, ...options };
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "hb-blur-style";
        document.head.appendChild(styleTag);
    }
    let css = `.${BLUR_CLASS} {\n`;
    css += `  filter: blur(${config.amount ?? 20}px)${config.grayscale ? " grayscale(100%)" : ""} !important;\n`;
    css += `  transition: filter 0.1s ease !important;\n`;
    css += `  opacity: unset !important;\n`;
    css += `}\n`;
    if (config.unblurOnHover) {
        css += `.${BLUR_CLASS}:hover {\n`;
        css += `  filter: blur(0px)${config.grayscale ? " grayscale(0%)" : ""} !important;\n`;
        css += `  transition: filter 0.5s ease !important;\n`;
        css += `  transition-delay: 1s !important;\n`;
        css += `}\n`;
    }
    styleTag.textContent = css;
}

export function setBlurDefaults(config: BlurConfig) {
    globalConfig = { ...globalConfig, ...config };
    ensureStyle();
}

export function applyBlur(element: HTMLElement, options: BlurOptions = {}) {
    ensureStyle(options);
    element.classList.add(BLUR_CLASS);
}

export function removeBlur(element: HTMLElement) {
    element.classList.remove(BLUR_CLASS);
}

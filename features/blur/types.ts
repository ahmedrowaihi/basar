// Options for blurring
export interface BlurOptions {
  amount?: number; // Blur amount in px
  grayscale?: boolean;
  unblurOnHover?: boolean;
}

// For global config
export interface BlurConfig extends BlurOptions {}

// Region box (e.g., face or NSFW region)
export interface RegionBox {
  x: number; // left (px)
  y: number; // top (px)
  width: number; // (px)
  height: number; // (px)
}

export interface RegionBlurOptions extends BlurOptions {
  regions: RegionBox[];
  canvas?: HTMLCanvasElement; // Optional: use this canvas instead of creating a new one
}

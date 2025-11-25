
export enum AppStep {
  UPLOAD_SOURCE = 'UPLOAD_SOURCE',
  SELECT_MODE = 'SELECT_MODE',
  GENERATING = 'GENERATING',
  RESULTS = 'RESULTS'
}

export enum MimicMode {
  COMPOSITE = 'Composite',
  POSE = 'Pose',
  LIGHTING = 'Lighting',
  COMPOSITION = 'Composition',
  OUTFIT = 'Outfit',
  SCENE = 'Scene'
}

export interface ImageAsset {
  id: string;
  url: string;
  base64?: string;
  isLocal?: boolean;
}

export interface GenerationResult {
  id: string;
  url: string;
}

export const SAMPLE_SOURCES = [
  { id: 'src1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop' },
  { id: 'src2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop' },
  { id: 'src3', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop' }
];

export const SAMPLE_REFERENCES = [
  { id: 'ref1', url: 'https://picsum.photos/id/338/400/500' }, // Moody lighting
  { id: 'ref2', url: 'https://picsum.photos/id/64/400/500' }, // Portrait
  { id: 'ref3', url: 'https://picsum.photos/id/129/400/500' }, // Scene/Urban
  { id: 'ref4', url: 'https://picsum.photos/id/91/400/500' }, // Abstract/Pose
  { id: 'ref5', url: 'https://picsum.photos/id/177/400/500' }, // Nature/Vibe
];

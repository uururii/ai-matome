import { createPreviewClient } from './preview-client.js';

export const {
  getGenerationStatus, getGeneration, generateProfileImages, resumeGeneration,
} = createPreviewClient();

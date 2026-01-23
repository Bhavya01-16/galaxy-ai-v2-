import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

// ============================================================================
// INPUT/OUTPUT SCHEMAS
// ============================================================================

const CropImageInputSchema = z.object({
  imageData: z.string().min(1), // base64 data URL
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
  outputFormat: z.enum(["png", "jpeg", "webp"]).default("png"),
});

export type CropImageInput = z.infer<typeof CropImageInputSchema>;

export interface CropImageOutput {
  success: boolean;
  imageData?: string; // base64 cropped image
  width?: number;
  height?: number;
  format?: string;
  error?: string;
}

// ============================================================================
// CROP IMAGE TASK
// Note: In production, use Sharp or FFmpeg for real image processing
// ============================================================================

export const cropImageTask = task({
  id: "crop-image-task",
  maxDuration: 60,
  run: async (payload: CropImageInput): Promise<CropImageOutput> => {
    try {
      const validated = CropImageInputSchema.parse(payload);
      const { imageData, x, y, width, height, outputFormat } = validated;

      // Validate input is a data URL
      if (!imageData.startsWith("data:image/")) {
        return {
          success: false,
          error: "Invalid image data - must be a base64 data URL",
        };
      }

      // In production, use Sharp for actual cropping:
      // const sharp = require('sharp');
      // const buffer = Buffer.from(imageData.split(',')[1], 'base64');
      // const cropped = await sharp(buffer).extract({ left: x, top: y, width, height }).toBuffer();

      // For now, simulate the crop operation
      console.log(`[SIMULATED] Cropping image: ${width}x${height} at (${x}, ${y})`);
      
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        imageData: `[Cropped: ${width}x${height} from (${x},${y})]`,
        width,
        height,
        format: outputFormat,
      };
    } catch (error) {
      console.error("Crop image task error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

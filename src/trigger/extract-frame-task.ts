import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

// ============================================================================
// INPUT/OUTPUT SCHEMAS
// ============================================================================

const ExtractFrameInputSchema = z.object({
  videoData: z.string().min(1), // base64 data URL or file path
  timestamp: z.number().min(0), // seconds
  outputFormat: z.enum(["png", "jpg", "webp"]).default("png"),
});

export type ExtractFrameInput = z.infer<typeof ExtractFrameInputSchema>;

export interface ExtractFrameOutput {
  success: boolean;
  frameData?: string; // base64 extracted frame
  timestamp?: number;
  format?: string;
  error?: string;
}

// ============================================================================
// EXTRACT FRAME TASK
// Note: In production, use FFmpeg for real frame extraction
// ============================================================================

export const extractFrameTask = task({
  id: "extract-frame-task",
  maxDuration: 120, // Video processing can take time
  run: async (payload: ExtractFrameInput): Promise<ExtractFrameOutput> => {
    try {
      const validated = ExtractFrameInputSchema.parse(payload);
      const { videoData, timestamp, outputFormat } = validated;

      // Validate input
      if (!videoData || videoData.length < 10) {
        return {
          success: false,
          error: "Invalid video data",
        };
      }

      // In production, use FFmpeg for actual frame extraction:
      // const ffmpeg = require('fluent-ffmpeg');
      // ffmpeg(videoPath)
      //   .screenshots({ timestamps: [timestamp], filename: 'frame.png' })
      //   .on('end', () => { ... });

      // For now, simulate the extraction
      console.log(`[SIMULATED] Extracting frame at ${timestamp}s as ${outputFormat}`);
      
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        success: true,
        frameData: `[Frame at ${timestamp}s as ${outputFormat}]`,
        timestamp,
        format: outputFormat,
      };
    } catch (error) {
      console.error("Extract frame task error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

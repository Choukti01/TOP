import { z } from "zod";

export const seedStatusSchema = z.enum(["draft", "planted", "growing", "archived"]);

export const createSeedSchema = z.object({
  title: z.string().trim().min(3).max(120),
  problem: z.string().trim().min(10).max(2_000),
  desiredOutcome: z.string().trim().min(10).max(2_000)
});

export type CreateSeedInput = z.infer<typeof createSeedSchema>;

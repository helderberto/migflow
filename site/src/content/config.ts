import { defineCollection, z } from "astro:content";
import { CATEGORIES } from "../lib/playbooks";

const playbooks = defineCollection({
  type: "content",
  schema: z.object({
    from: z.string(),
    to: z.string(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { playbooks };

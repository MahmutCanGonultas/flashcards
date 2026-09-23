import { CATALOG } from "./catalog";
import type { Topic, TopicBody } from "./types";
import { BEGINNER } from "./beginner";
import { ELEMENTARY } from "./elementary";
import { PRE_INTERMEDIATE } from "./preIntermediate";

/** Every topic's page, keyed by slug; catalog.ts holds the order and titles. */
export const BODIES: Record<string, TopicBody> = { ...BEGINNER, ...ELEMENTARY, ...PRE_INTERMEDIATE };

/** The whole topics, in the learner's order. A catalog entry without a page is left out (the tests catch it). */
export const TOPICS: Topic[] = CATALOG.flatMap((meta) => (BODIES[meta.slug] ? [{ ...meta, ...BODIES[meta.slug] }] : []));

export const topicOf = (slug: string): Topic | undefined => TOPICS.find((t) => t.slug === slug);

// A returning visitor, as the home page knows them (server/visitor.ts reads it).

import type { RafeeqId } from "./rafeeq";

export type Visitor = { name: string | null; rafeeq: RafeeqId | null; level: number };

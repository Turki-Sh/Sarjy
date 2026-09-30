ALTER TABLE "memories" ADD COLUMN "topic" text DEFAULT 'you' NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "note" text;--> statement-breakpoint
-- Existing memories were key-value facts: file them under a topic by their key. Their note stays
-- empty, and they read as "label: value" until they are next updated.
UPDATE "memories" SET "topic" = CASE
  WHEN "key" LIKE 'favorite%' OR "key" LIKE '%_likes' OR "key" LIKE 'likes_%' THEN 'likes'
  WHEN "key" IN ('name', 'home_city', 'units', 'occupation', 'job', 'birthday', 'age') THEN 'you'
  ELSE 'other'
END;

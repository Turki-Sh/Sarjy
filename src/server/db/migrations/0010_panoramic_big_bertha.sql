CREATE TABLE "rafeeq_bonds" (
	"user_id" uuid NOT NULL,
	"rafeeq" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rafeeq_bonds_user_id_rafeeq_pk" PRIMARY KEY("user_id","rafeeq")
);
--> statement-breakpoint
ALTER TABLE "rafeeq_bonds" ADD CONSTRAINT "rafeeq_bonds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- The first four companions were renamed when the plush Rafeeqs took their names (Day 3): keep
-- everyone's companion, and its bond, on the look they picked.
UPDATE "users" SET "rafeeq" = CASE "rafeeq" WHEN 'rider' THEN 'dune' WHEN 'keeper' THEN 'lantern' WHEN 'scout' THEN 'fennec' WHEN 'drifter' THEN 'breeze' ELSE "rafeeq" END;--> statement-breakpoint
INSERT INTO "rafeeq_bonds" ("user_id", "rafeeq", "points") SELECT "id", "rafeeq", "rafeeq_bond" FROM "users" WHERE "rafeeq" IS NOT NULL AND "rafeeq_bond" > 0;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "rafeeq_bond";
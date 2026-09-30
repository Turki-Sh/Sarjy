CREATE TABLE "wallpapers" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"media_type" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallpapers" ADD CONSTRAINT "wallpapers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
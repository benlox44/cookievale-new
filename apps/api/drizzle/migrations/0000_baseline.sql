CREATE TYPE "public"."delivery_method" AS ENUM('pickup', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'paid', 'delivered');--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"product_name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_instagram" varchar(30) NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"availability_slot_id" integer,
	"description" text NOT NULL,
	"delivery_method" "delivery_method" DEFAULT 'pickup' NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"reference_photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_availability_slot_id_availability_slots_id_fk" FOREIGN KEY ("availability_slot_id") REFERENCES "public"."availability_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_availability_slots_date" ON "availability_slots" USING btree ("date");--> statement-breakpoint
CREATE INDEX "ix_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orders_availability_slot_active" ON "orders" USING btree ("availability_slot_id");--> statement-breakpoint
CREATE INDEX "ix_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ix_products_display_order" ON "products" USING btree ("display_order");
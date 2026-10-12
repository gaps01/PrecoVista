CREATE TABLE `marketplace_tokens` (
  `provider` text PRIMARY KEY NOT NULL,
  `encrypted_access_token` text NOT NULL,
  `encrypted_refresh_token` text,
  `expires_at` integer NOT NULL,
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `offers` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `external_id` text NOT NULL,
  `catalog_product_id` text,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `image_url` text,
  `item_url` text NOT NULL,
  `price_cents` integer NOT NULL,
  `currency` text NOT NULL DEFAULT 'BRL',
  `seller_id` text NOT NULL,
  `seller_name` text NOT NULL,
  `seller_level` text NOT NULL,
  `official_store` integer NOT NULL DEFAULT 0,
  `rating` real NOT NULL DEFAULT 0,
  `review_count` integer NOT NULL DEFAULT 0,
  `sold_quantity` integer NOT NULL DEFAULT 0,
  `trust_score` integer NOT NULL DEFAULT 0,
  `available` integer NOT NULL DEFAULT 1,
  `last_seen_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `offers_source_external_id_unique` ON `offers` (`source`, `external_id`);
--> statement-breakpoint
CREATE INDEX `offers_catalog_product_id_idx` ON `offers` (`catalog_product_id`);
--> statement-breakpoint
CREATE INDEX `offers_last_seen_at_idx` ON `offers` (`last_seen_at`);
--> statement-breakpoint
CREATE TABLE `price_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `offer_id` text NOT NULL,
  `price_cents` integer NOT NULL,
  `collected_at` text NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `price_snapshots_offer_time_idx` ON `price_snapshots` (`offer_id`, `collected_at`);

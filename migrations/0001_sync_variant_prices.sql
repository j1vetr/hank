UPDATE "product_variants" AS "variant"
SET "price" = "product"."base_price"
FROM "products" AS "product"
WHERE "variant"."product_id" = "product"."id"
  AND "variant"."price" IS DISTINCT FROM "product"."base_price";
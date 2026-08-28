UPDATE "product_variants" AS "variant"
SET "price" = "product"."base_price"
FROM "products" AS "product"
WHERE "variant"."product_id" = "product"."id"
  AND "variant"."price" IS DISTINCT FROM "product"."base_price";

UPDATE "auto_cart_campaigns"
SET "name" = '2 Ürün Al, 3. Üründe %50 İndirim Fırsatı',
    "description" = 'Sepetine herhangi 2 ürün ekle, indirim kapsamındaki ürünlerden 1 ürün daha al. Seçtiğin üçüncü üründe %50 indirim fırsatını yakala.',
    "customer_message" = NULL
WHERE "name" IS DISTINCT FROM '2 Ürün Al, 3. Üründe %50 İndirim Fırsatı'
   OR "description" IS DISTINCT FROM 'Sepetine herhangi 2 ürün ekle, indirim kapsamındaki ürünlerden 1 ürün daha al. Seçtiğin üçüncü üründe %50 indirim fırsatını yakala.'
   OR "customer_message" IS NOT NULL;
---
name: Stok kodu güncelleme politikası
description: Ürün stok kodu değiştiğinde hangi varyant kodlarının değiştirilebileceğine dair kullanıcı kararı.
---

Ürün stok kodu değiştiğinde yalnızca üründen türetilen varyant kodlarını güncelle. Ayrı verilmiş özel varyant kodlarını koru.

**Why:** Kullanıcı, özel kodları da yeniden oluşturan seçenek yerine üründen türetilen kodların güncellenmesini seçti.

**How to apply:** Eski kodları topluca düzeltirken yalnızca ortak bir öneki kanıt sayma. Eski ürün koduyla ilişkisi bilinmeyen varyant kodlarını özel kodlardan güvenilir biçimde ayıramıyorsan otomatik değiştirme.

Eski ve yeni siparişlerde gösterilen ve fatura aktarımında kullanılan stok kodu, ürün kartındaki güncel ana stok kodu olmalı. Beden veya renk eki ekleme. Varyantın özel kodunu saklamak, siparişlerde onu öncelikli göstermek anlamına gelmez.

**Why:** Kullanıcı, ürün kartında 203 yazarken eski siparişte STK3-M görünmesini istemediğini ve diğer ürünlerde de doğrudan güncel ürün kodunun kullanılmasını açıkça belirtti.

**How to apply:** Sipariş tarihi ne olursa olsun kodu güncel ürün kaydından oku. Daha önce kesilmiş harici faturaları veya kaydedilmiş bayi tekliflerini bu kuralla otomatik yeniden yazma.

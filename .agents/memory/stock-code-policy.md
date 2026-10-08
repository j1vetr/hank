---
name: Stok kodu güncelleme politikası
description: Ürün stok kodu değiştiğinde hangi varyant kodlarının değiştirilebileceğine dair kullanıcı kararı.
---

Ürün stok kodu değiştiğinde yalnızca üründen türetilen varyant kodlarını güncelle. Ayrı verilmiş özel varyant kodlarını koru.

**Why:** Kullanıcı, özel kodları da yeniden oluşturan seçenek yerine üründen türetilen kodların güncellenmesini seçti.

**How to apply:** Eski kodları topluca düzeltirken yalnızca ortak bir öneki kanıt sayma. Eski ürün koduyla ilişkisi bilinmeyen varyant kodlarını özel kodlardan güvenilir biçimde ayıramıyorsan otomatik değiştirme.

Stok kodlarının beden ve renk ekleri korunmalı. Ana ürün kodu 203 ise M varyantının kodu 203-M olmalı. Sipariş ve faturalarda varyant kodunu kullan, ana ürün koduyla ekleri kaldırma.

**Why:** Kullanıcı önceki yorumun yanlış olduğunu düzeltti. İstediği, eski STK3-M kodunun güncel ürün koduyla 203-M olarak onarılması. Beden ekinin kaldırılmasını istemiyor.

**How to apply:** Ürünün kodunun yanından çalıştırılan kontrol, önceden eski kalan kodları da karşılaştırabilmeli. Eski ürün kodu bilinmiyorsa beden ve renk ekleri yalnızca öneri oluşturmak için kullanılır. Kullanıcı eski ve yeni kodları görüp seçilen değişiklikleri onaylamadan bu önerileri kaydetme. Daha önce kesilmiş harici faturaları veya kaydedilmiş bayi tekliflerini otomatik yeniden yazma.

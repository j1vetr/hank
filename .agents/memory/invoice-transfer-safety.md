---
name: Fatura aktarımında belirsiz sonuçlar
description: BizimHesap aktarımında yeniden gönderim güvenliği ve eski kayıtların ele alınması.
---

BizimHesap isteğinin zaman aşımına uğraması veya bozuk yanıt dönmesi faturanın oluşmadığını kanıtlamaz. Aynı siparişi bu durumda otomatik veya körlemesine manuel yeniden gönderme.

**Why:** Açık API dokümanında idempotency anahtarı veya fatura sorgulama yöntemi bulunamadı. Yerel bir başarısızlık, karşı tarafta oluşturulmuş faturanın mükerrer oluşturulmasına neden olabilir.

**How to apply:** Ağ isteğinden önce kalıcı ve atomik gönderim kilidi al. Kesin ret ile belirsiz sonucu ayır. Sonucu kaydedemediysen kilidi serbest bırakma. Eski sistemde aktarım sonucu saklanmamış siparişleri hiç gönderilmemiş sayma. Mevcut fatura/tahsilat kayıtlarını otomatik yeniden oluşturma.

Fatura aktarımı ile tahsilat aktarımını ayrı kapsamlar olarak ele al.

**Why:** Kullanıcı, doğrulanmış fatura tutarı ve takip eksiklerinin düzeltilmesini onayladı. Tahsilat yöntemi için resmî API teyidi henüz yok.

**How to apply:** Fatura başarı durumundan tahsilatın işlendiği sonucunu çıkarma. Tahsilat entegrasyonu için doğrulanmış sağlayıcı yöntemini kullan.

Bu sitede ödeme PayTR üzerinden zaten alınıyor. İstenen iş BizimHesap'ta mevcut müşteri ve faturaya bu ödemenin tahsilat kaydını eklemek. BizimHesap'ın sanal POS kurulumunu bu işin önkoşulu olarak sunma.

**Why:** Kullanıcı bunu açıkça düzeltti. Yeni ödeme alma entegrasyonu istemiyor.

**How to apply:** Mevcut ödeme alma akışını koru. Dışarıda alınmış ödemenin muhasebe kaydını sağlayan yöntemi araştır.

BizimHesap'ın kendi PayTR sanal POS entegrasyonunu, bu sitede alınan PayTR ödemelerinin cari tahsilata aktarılmasıyla aynı özellik sayma.

**Why:** 2026-10-09 tarihinde resmî API dizini yalnızca sipariş/fatura ekleme ve ürün/depo/stok okumayı belgeliyordu. Resmî destek sayfası, başka yerde kullanılan PayTR hesabını BizimHesap'ta da kullanmak için ikinci mağaza kodu gerektiğini söylüyor. Bu, dış sitedeki ödemelerin otomatik eşleştiğini doğrulamıyor.

**How to apply:** Yeni tahsilat entegrasyonu öncesinde dış sitede alınmış başarılı ödemeyi müşteri ve fatura GUID'sine bağlayan yöntem, kasa/POS hesabı ve mükerrerlik referansını sağlayıcıdan teyit et. Belgede bulunmamasını özelliğin kesinlikle olmadığı şeklinde yorumlama. Kaynaklar: https://apidocs.bizimhesap.com/llms.txt ve https://destek.bizimhesap.com/portal/tr/kb/articles/sanal-p

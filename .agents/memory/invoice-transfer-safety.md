---
name: Fatura aktarımında belirsiz sonuçlar
description: BizimHesap aktarımında yeniden gönderim güvenliği ve eski kayıtların ele alınması.
---

BizimHesap isteğinin zaman aşımına uğraması veya bozuk yanıt dönmesi faturanın oluşmadığını kanıtlamaz. Aynı siparişi bu durumda otomatik veya körlemesine manuel yeniden gönderme.

**Why:** Açık API dokümanında idempotency anahtarı veya fatura sorgulama yöntemi bulunamadı. Yerel bir başarısızlık, karşı tarafta oluşturulmuş faturanın mükerrer oluşturulmasına neden olabilir.

**How to apply:** Ağ isteğinden önce kalıcı ve atomik gönderim kilidi al. Kesin ret ile belirsiz sonucu ayır. Sonucu kaydedemediysen kilidi serbest bırakma. Eski sistemde aktarım sonucu saklanmamış siparişleri hiç gönderilmemiş sayma. Mevcut fatura/tahsilat kayıtlarını otomatik yeniden oluşturma.

Fatura aktarımı ile tahsilat aktarımını ayrı kapsamlar olarak ele al.

**Why:** Kullanıcı, doğrulanmış fatura tutarı ve takip eksiklerinin düzeltilmesini onayladı. Sağlayıcının sonradan gönderdiği tahsilat yöntemleri, fatura başarısından otomatik olarak tahsilat başarısı çıkarılmasını haklı kılmaz.

**How to apply:** Fatura başarı durumundan tahsilatın işlendiği sonucunu çıkarma. Tahsilat entegrasyonu için doğrulanmış sağlayıcı yöntemini kullan.

Bu sitede ödeme PayTR üzerinden zaten alınıyor. İstenen iş BizimHesap'ta mevcut müşteri ve faturaya bu ödemenin tahsilat kaydını eklemek. BizimHesap'ın sanal POS kurulumunu bu işin önkoşulu olarak sunma.

**Why:** Kullanıcı bunu açıkça düzeltti. Yeni ödeme alma entegrasyonu istemiyor.

**How to apply:** Mevcut ödeme alma akışını koru. Dışarıda alınmış ödemenin muhasebe kaydını sağlayan yöntemi araştır.

Kullanıcı, sanal POS üzerinden tek çekim ödeme aldıklarını ve fatura tutarının tahsilat tutarıyla aynı olduğunu belirtti.

**Why:** Kullanıcının ödeme akışına ilişkin açık iş kuralı.

**How to apply:** Başarılı ödemelerin tahsilat aktarımını araştırırken tam fatura bedelinin ödendiği akışı esas al. Eşit tutarları, fatura oluşturmanın tahsilat kaydını da otomatik oluşturduğuna kanıt sayma.

Kullanıcının istediği çıktı BizimHesap müşteri sayfasındaki "Önceki Ödemeleri" bölümünde, ödeme şekli "Kredi Kartı" olan tahsilat kaydının otomatik oluşması. Müşteri sayfası ve soldaki fatura zaten oluşuyor, sağdaki tahsilat şu anda elle ekleniyor.

**Why:** Kullanıcı BizimHesap ekranıyla eksik davranışı açıkça tarif etti.

**How to apply:** Başarılı PayTR ödemesini mevcut müşteri ve ilgili faturayla ilişkilendir. Yalnızca fatura notu veya yerel ödendi durumunu değiştirmeyi tamamlanmış tahsilat entegrasyonu sayma. Önceden elle eklenmiş tahsilatları tekrar oluşturma.

Sağlayıcının 2026-10-27 tarihinde kullanıcı aracılığıyla gönderdiği özel belgeler, önce incelenen açık API dizininden daha kapsamlıdır. TXT notu kasa kimliğini faturaya `CashId` olarak göndermeyi tarif eder. Postman koleksiyonunda `GET /api/b2b/cashiers`, faturada `CashId` ve ayrıca `POST /api/b2b/AddCollection` bulunur.

**Why:** Tahsilat yöntemi bulunmadığı izlenimi eski belgelerin kapsamıyla sınırlıydı. Sonradan gönderilen kaynaklar bu eksikliği gideriyor fakat örnekler tüm ödeme türlerini veya yanıt sözleşmesini açıklamıyor.

**How to apply:** Yeni entegrasyonda bu kaynakları esas al. TXT'teki tekil `cashier` yazımı yerine Postman'daki çoğul `cashiers` yolunu dikkate al. Faturadaki `CashId` yoluyla tahsilat oluşuyorsa aynı ödeme için ayrıca `AddCollection` gönderme. Örnekteki `paymentType: "1"` değerinin kredi kartı olduğunu varsayma. Ayrı tahsilat örneğindeki müşteri kimliği GUID biçiminde olduğundan mevcut kaynak müşteri kimliğiyle eşleştirme sözleşmesini teyit et. Eski faturaları bu alanı eklemek amacıyla yeniden gönderme.

Kasa eşlemesi yönetici tarafından açıkça etkinleştirilir ve yalnızca yeni, başarılı, pozitif tutarlı PayTR siparişi oluşturulurken siparişe dondurulur. Kasa ayarının sonra değişmesi, eski veya tekrarlanan fatura gönderimlerinin kasasını değiştirmez. Fatura gönderim başarısı, bağımsız olarak doğrulanmış tahsilat başarısı diye sunulmaz.

**Why:** Kullanıcı yeni siparişlerde `CashId` aktarımını onaylarken eski faturaları ve elle girilmiş tahsilatları değiştirmememizi istedi. Canlı hesapta doğru kasa ve kredi kartı ödeme şekli ilk gerçek siparişte doğrulanmalı.

**How to apply:** Sadece doğrulanmış başarılı PayTR dönüşünden oluşturulan siparişlerde yapılandırma anlık görüntüsü alınır. Diğer kaynaklardan ve eski siparişlerde kasa sonradan global ayardan tamamlanmaz. Ayrı `AddCollection` gönderilmez. İlk yeni ödenmiş siparişte BizimHesap'ın müşteri ödeme geçmişinde tutarı ve kredi kartı şeklini doğrula.

2026-10-27 tarihinde BizimHesap'ın belgelenen kasa listeleme adresi, sağlayıcının uygulama alan adına HTTP 308 ile yönleniyor. Gerçek listeleme yanıtında başarı kodu 1 ve `data.cashiers` altında kasa kimliği ile başlığı var.

**Why:** Yönlendirmeleri tamamen engelleyen doğrudan belgelenmiş adres başarısız oldu. Otomatik yönlendirme ise kimlik doğrulama başlığını başka bir yere iletme riski taşıyor.

**How to apply:** Kimlik doğrulamalı, salt okunur kasa isteğinde doğrulanmış kanonik adresi doğrudan kullan ve yeniden yönlendirmeyi kapalı tut. Sağlayıcı yanıtı değişirse hata ver, tahminle kasa seçme veya korumasız yönlendirme açma.

BizimHesap'ın kendi PayTR sanal POS entegrasyonunu, bu sitede alınan PayTR ödemelerinin cari tahsilata aktarılmasıyla aynı özellik sayma.

**Why:** 2026-10-09 tarihinde resmî API dizini yalnızca sipariş/fatura ekleme ve ürün/depo/stok okumayı belgeliyordu. Resmî destek sayfası, başka yerde kullanılan PayTR hesabını BizimHesap'ta da kullanmak için ikinci mağaza kodu gerektiğini söylüyor. Bu, dış sitedeki ödemelerin otomatik eşleştiğini doğrulamıyor.

**How to apply:** Yeni tahsilat entegrasyonu öncesinde dış sitede alınmış başarılı ödemeyi müşteri ve fatura GUID'sine bağlayan yöntem, kasa/POS hesabı ve mükerrerlik referansını sağlayıcıdan teyit et. Belgede bulunmamasını özelliğin kesinlikle olmadığı şeklinde yorumlama. Kaynaklar: https://apidocs.bizimhesap.com/llms.txt ve https://destek.bizimhesap.com/portal/tr/kb/articles/sanal-p

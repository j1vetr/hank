---
name: Sunucuya taşınabilir paketler
description: Kendi Linux sunucusuna Git ile güncelleme ve paket indirme adreslerinin taşınabilirliği.
---

Kullanıcı uygulamayı kendi Linux sunucusunda Git ile güncelliyor ve npm install kullanıyor.

**Why:** Kullanıcı sunucudaki git pull çıktısını paylaştı ve npm install sırasında indirmelerin Replit'e özel adreslere bağlı olmamasını istedi.

**How to apply:** Paket değişikliklerini yalnızca Replit ortamında çalışması bakımından değerlendirme. Sunucuda standart npm kurulumu ile taşınabilirliği de koru.

Paket kurulum aracı package-lock.json içine Replit'in yalnızca içeriden erişilebilen paket indirme adreslerini yazabilir.

**Why:** Test bağımlılıkları kurulduktan sonra üç paketin resolved adresi bu şekilde kaydedildi. Bunlar kullanıcının ayrı sunucusundan erişilebilir kabul edilemez.

**How to apply:** Bağımlılık ekledikten sonra kilit dosyasını özel veya yerel adresler için kontrol et. Kurulmasına izin verilmiş paketlerde sürüm ve bütünlük değerlerini koruyarak herkese açık resmi npm adreslerini kullan, indirme ve bütünlük eşleşmesini doğrula. Güvenlik nedeniyle engellenmiş paketleri bu yöntemle atlatma.

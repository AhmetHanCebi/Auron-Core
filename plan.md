# PROJE PLANI — Karar Simülasyonu Motoru (MVP)

## Adım 1: Veri Modeli ve Kullanıcı Profili Şeması
- Kullanıcı durumu tanımla: `mevcut_durum` (fiziksel seviye, kalan süre, yoğunluk seviyesi)
- Seçim değişkenleri tanımla: `secimler[]` (antrenman_sikligi, beslenme_kalitesi, uyku, mental_hazirlik)
- Çıktı şeması: `senaryo_sonucu` (en_iyi, orta, en_kotu)

## Adım 2: Senaryo Motoru (Çekirdek Mantık)
- Kullanıcının seçimlerini alan bir fonksiyon yaz
- Her seçim kombinasyonu için dallanma ağacı oluştur
- 3 ana senaryo üret: İyimser / Gerçekçi / Kötümser
- Her senaryoya olasılık yüzdesi ata

## Adım 3: LLM Entegrasyon Katmanı
- Senaryo motorunun çıktısını LLM'e prompt olarak gönder
- LLM'den zengin, hikayeleştirilmiş senaryo anlatımı al
- Ton modu parametresi ekle: `koç` | `gerçekçi` | `hardcore`
- Prompt template'leri oluştur (maliyet optimizasyonu için)

## Adım 4: Boks Maçı MVP Senaryosu
- Patronun spesifik durumunu hardcode et (test case)
- 1 aylık zaman diliminde haftalık karar noktaları tanımla
- Hafta hafta seçim→sonuç simülasyonu çalıştır
- Çıktıyı formatla: haftalık durum raporu + maç günü projeksiyonu

## Adım 5: Kullanıcı Arayüzü (Basit CLI/Web)
- Kullanıcıdan durumunu alan form/sorular
- Seçimleri sunan interaktif menü
- Senaryo sonuçlarını gösteren çıktı ekranı
- Ton modu seçici (Koç/Gerçekçi/Hardcore)

## Adım 6: Önbellekleme ve Maliyet Optimizasyonu
- Sık tekrarlanan senaryo kalıplarını cache'le
- Template tabanlı cevaplar için LLM çağrısını atla
- Token kullanım takibi ekle

## Adım 7: Güvenlik ve Sınırlar
- Tıbbi/sağlık tavsiyesi disclaimer'ı ekle
- Tehlikeli önerileri filtreleyen guard-rail'ler koy
- Kullanıcı verisini güvenli sakla

## Adım 8: Test ve İterasyon
- Patronun boks senaryosunu uçtan uca test et
- Farklı seçim kombinasyonlarının tutarlılığını doğrula
- Ton modlarının doğru çalıştığını kontrol et
- Geri bildirime göre iterasyon yap
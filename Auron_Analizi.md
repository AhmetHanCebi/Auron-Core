## Derin Analiz Sentezi — Karar Simülasyonu Motoru

### Temel Kavrayış
Bu proje bir "boks antrenman uygulaması" değil. Patronun sorusu aslında evrensel bir ihtiyacı açığa çıkarıyor: **"Seçimlerimin sonuçlarını önceden görebilir miyim?"** Bu, bir **karar simülasyonu motoru**dur.

### First Principles Çıkarımı
- **Girdi:** Kullanıcının mevcut durumu (fiziksel hazırlık, zaman kısıtı, yaşam yoğunluğu)
- **Değişkenler:** Kullanıcının yapacağı seçimler (antrenman sıklığı, beslenme, dinlenme, mental hazırlık)
- **Çıktı:** Her seçim yolunun olası sonuçlarının simülasyonu (en iyi senaryo → en kötü senaryo)

### Çekirdek Değer Önerisi
**"Hareketsizlik İlacı"** — Belirsizlik felcini kıran bir araç. İnsanlar karar veremediğinde donuyor. Bu motor, her seçimin sonucunu somutlaştırarak harekete geçirir.

### Kritik Riskler ve Çözümler
| Risk | Çözüm |
|------|--------|
| Acımasız gerçekçilik kullanıcıyı kaçırır | **Ton modları** (Koç modu / Gerçekçi mod / Hardcore mod) |
| LLM maliyeti ölçekte patlar | Sık kullanılan senaryolar için önbellekleme + template katmanı |
| İçerik moderasyonu | Sağlık/tıbbi tavsiye sınırlarını net çiz, disclaimer sistemi |

### SCAMPER/MECE Konumlandırma
- **Substitute:** Koç/danışman yerine simülasyon motoru
- **Combine:** Senaryo planlama + motivasyon koçu + gerçekçi projeksiyon
- **Eliminate:** Genel fitness app karmaşıklığını çıkar, sadece karar→sonuç döngüsüne odaklan

### Antikırılganlık Notu
Sistem ne kadar çok senaryo işlerse o kadar güçlenir. Kullanıcı geri bildirimleri modeli keskinleştirir. Bu yapı doğası gereği **antikırılgan**.

### Ölçeklenebilirlik (TAM/SAM/SOM)
- **TAM:** Karar vermekte zorlanan herkes (milyarlarca insan)
- **SAM:** Spor/sağlık/kariyer gibi somut hedefleri olan bireyler
- **SOM:** Boks/dövüş sporları + fitness topluluğu (MVP odağı)

### Nihai Vizyon
Bir PR/FAQ formatında: *"Artık 'ya yaparsam, ya yapmazsam' döngüsünde kalmak yok. Seçimlerinin simülasyonunu gör, kararını ver, harekete geç."*
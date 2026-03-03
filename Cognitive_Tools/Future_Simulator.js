// ============================================================
// AURON - Bilişsel Modül: Future_Simulator
// Görev: Konu hakkında soru üret, simülasyon çalıştır, sonucu Vault'a kaydet
// ============================================================
const fs = require('fs');
const path = require('path');

const VAULT_SIMULATIONS_DIR = path.join(__dirname, '..', 'Vault', 'Simulations');
const DELIVERY_DIR = path.join(__dirname, '..', '..', 'Delivery');

/**
 * generateQuestions(topic)
 * -------------------------
 * Verilen konuyu analiz eder, eksik veri noktalarını tespit eder
 * ve CEO'ya sorulacak soruları Delivery/Auron_Sorular.md olarak yazar.
 * Checkpoint mantığı: Sorular üretilir -> CEO cevaplar -> answers.txt oluşur -> devam edilir.
 *
 * @param {string} topic - Analiz edilecek konu/fikir metni
 * @returns {string} Oluşturulan soru dosyasının yolu
 */
function generateQuestions(topic) {
    if (!topic || typeof topic !== 'string') {
        throw new Error('Geçerli bir konu metni gereklidir.');
    }

    // Konu hakkında kritik soru alanları
    const questionFramework = [
        { alan: 'Hedef Kitle', soru: 'Bu projenin birincil hedef kitlesi kim? Demografik ve psikografik profil nedir?' },
        { alan: 'Problem Tanımı', soru: 'Bu projenin çözdüğü temel problem nedir? Mevcut alternatifler neden yetersiz?' },
        { alan: 'Başarı Kriterleri', soru: 'Projenin başarılı sayılması için hangi metrikler/KPI\'lar karşılanmalı?' },
        { alan: 'Teknik Kısıtlar', soru: 'Teknoloji stack tercihleri, bütçe veya zaman kısıtlamaları var mı?' },
        { alan: 'Ölçek Beklentisi', soru: 'İlk fazda ve 1 yıl sonra beklenen kullanıcı/işlem hacmi nedir?' },
        { alan: 'Entegrasyon', soru: 'Mevcut sistemlerle (API, veritabanı, üçüncü parti servisler) entegrasyon gereksinimleri neler?' },
        { alan: 'Öncelik Sırası', soru: 'MVP kapsamında mutlaka olması gereken özellikler hangileri?' },
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let md = `# AURON - Stratejik Sorular\n`;
    md += `> **Konu:** ${topic.substring(0, 120)}...\n`;
    md += `> **Tarih:** ${new Date().toLocaleString('tr-TR')}\n`;
    md += `> **Durum:** CEO yanıtı bekleniyor\n\n`;
    md += `---\n\n`;
    md += `Aşağıdaki soruları yanıtlayıp \`answers.txt\` dosyası olarak Auron-Core dizinine bırakınız.\n\n`;

    questionFramework.forEach((item, i) => {
        md += `## ${i + 1}. ${item.alan}\n`;
        md += `**Soru:** ${item.soru}\n\n`;
        md += `**Cevap:** \n\n`;
    });

    md += `---\n*Bu dosya Auron Future_Simulator tarafından otomatik üretilmiştir.*\n`;

    // Delivery klasörüne yaz
    if (!fs.existsSync(DELIVERY_DIR)) {
        fs.mkdirSync(DELIVERY_DIR, { recursive: true });
    }

    const outputPath = path.join(DELIVERY_DIR, 'Auron_Sorular.md');
    fs.writeFileSync(outputPath, md, 'utf8');

    console.log(`[Future_Simulator] Sorular üretildi: ${outputPath}`);
    return outputPath;
}

/**
 * runSimulation(answersText)
 * -------------------------
 * CEO'nun answers.txt dosyasındaki cevaplarını alır,
 * stratejik simülasyon çalıştırır ve sonucu döner.
 * Bu fonksiyon ileride LLM çağrısıyla güçlendirilecektir.
 *
 * @param {string} answersText - answers.txt dosyasının içeriği
 * @returns {object} Simülasyon sonucu { title, date, answers, scenarios, recommendation, vaultLinks }
 */
function runSimulation(answersText) {
    if (!answersText || typeof answersText !== 'string') {
        throw new Error('Geçerli bir cevap metni gereklidir.');
    }

    console.log('[Future_Simulator] Simülasyon başlatılıyor...');

    // Cevapları parse et (basit bölümleme)
    const sections = answersText.split(/##\s+\d+\./g).filter(s => s.trim());

    const simulationResult = {
        title: 'Stratejik Gelecek Simülasyonu',
        date: new Date().toISOString(),
        answers: answersText,
        scenarios: [
            {
                name: 'İyimser Senaryo',
                description: 'Tüm varsayımlar doğrulanır, pazar koşulları elverişlidir.',
                probability: 'Orta-Yüksek',
                keyFactors: ['Erken pazar girişi', 'Güçlü kullanıcı geri bildirimi', 'Ölçeklenebilir mimari'],
            },
            {
                name: 'Temel Senaryo',
                description: 'Büyük sürpriz yok, planlanan tempoda ilerleme.',
                probability: 'Yüksek',
                keyFactors: ['Kontrollü büyüme', 'İteratif geliştirme', 'Odaklı MVP'],
            },
            {
                name: 'Kötümser Senaryo',
                description: 'Teknik borç birikir, pazar beklentileri karşılanmaz.',
                probability: 'Düşük-Orta',
                keyFactors: ['Kaynak yetersizliği', 'Rekabet baskısı', 'Teknik kısıtlar'],
            },
        ],
        recommendation: 'Simülasyon tamamlandı. Detaylı stratejik analiz için Auron LLM modülüne bağlanılması önerilir.',
        vaultLinks: ['[[Stratejik Analiz]]', '[[Senaryo Planlama]]', '[[Risk Değerlendirme]]'],
    };

    console.log('[Future_Simulator] Simülasyon tamamlandı.');
    return simulationResult;
}

/**
 * saveToVault(simulationResult)
 * -------------------------
 * Simülasyon sonucunu Vault/Simulations/ içine
 * Obsidian uyumlu markdown formatında kaydeder.
 * Kavramlar arası bağlantılar [[wiki-link]] formatındadır.
 *
 * @param {object} simulationResult - runSimulation() fonksiyonunun çıktısı
 * @returns {string} Kaydedilen dosyanın yolu
 */
function saveToVault(simulationResult) {
    if (!simulationResult || typeof simulationResult !== 'object') {
        throw new Error('Geçerli bir simülasyon sonucu gereklidir.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const fileName = `Sim_${timestamp}.md`;

    let md = `# ${simulationResult.title}\n`;
    md += `> **Tarih:** ${new Date(simulationResult.date).toLocaleString('tr-TR')}\n`;
    md += `> **Bağlantılar:** ${simulationResult.vaultLinks.join(' | ')}\n\n`;
    md += `---\n\n`;

    md += `## Senaryolar\n\n`;
    simulationResult.scenarios.forEach((scenario, i) => {
        md += `### ${i + 1}. ${scenario.name}\n`;
        md += `- **Açıklama:** ${scenario.description}\n`;
        md += `- **Olasılık:** ${scenario.probability}\n`;
        md += `- **Anahtar Faktörler:**\n`;
        scenario.keyFactors.forEach(f => {
            md += `  - ${f}\n`;
        });
        md += `\n`;
    });

    md += `## Öneri\n`;
    md += `${simulationResult.recommendation}\n\n`;

    md += `## İlgili Kavramlar\n`;
    simulationResult.vaultLinks.forEach(link => {
        md += `- ${link}\n`;
    });

    md += `\n---\n*Otomatik üretildi: Auron Future_Simulator*\n`;

    // Vault dizinini kontrol et
    if (!fs.existsSync(VAULT_SIMULATIONS_DIR)) {
        fs.mkdirSync(VAULT_SIMULATIONS_DIR, { recursive: true });
    }

    const outputPath = path.join(VAULT_SIMULATIONS_DIR, fileName);
    fs.writeFileSync(outputPath, md, 'utf8');

    console.log(`[Future_Simulator] Sonuç Vault'a kaydedildi: ${outputPath}`);
    return outputPath;
}

module.exports = {
    generateQuestions,
    runSimulation,
    saveToVault,
};

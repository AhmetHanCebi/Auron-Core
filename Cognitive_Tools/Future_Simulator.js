// ============================================================
// AURON - Bilişsel Modül: Future_Simulator
// Görev: Konu hakkında soru üret, simülasyon çalıştır, sonucu Vault'a kaydet
// ============================================================
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// GÜVENLİK KALKANI: Input Sanitasyonu — shell enjeksiyonunu engeller
function sanitizeInput(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/(["`$])/g, '\\$1');
}

// GÜVENLİK KALKANI: Sessiz Çöküş Engelleyici — hataları dosyaya yazar
function reportError(context, error) {
    const timestamp = new Date().toISOString();
    const report = `[${timestamp}] [${context}] ${error.message || error}\n`;
    try {
        if (!fs.existsSync(DELIVERY_DIR)) fs.mkdirSync(DELIVERY_DIR, { recursive: true });
        fs.appendFileSync(path.join(DELIVERY_DIR, 'Auron_Sistem_Hatasi.txt'), report, 'utf8');
    } catch (e) { /* dosya yazımı başarısız olursa en azından konsol çalışır */ }
}

const AURON_CORE_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = process.env.AURON_BASE_DIR || path.resolve(AURON_CORE_DIR, '..');
const VAULT_SIMULATIONS_DIR = path.join(AURON_CORE_DIR, 'Vault', 'Simulations');
const DELIVERY_DIR = path.join(ROOT_DIR, 'Delivery');

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
async function generateQuestions(topic) {
    if (!topic || typeof topic !== 'string') {
        throw new Error('Geçerli bir konu metni gereklidir.');
    }

    try {
        console.log('[Future_Simulator] LLM ile dinamik soru üretimi başlatılıyor...');

        // Claude CLI ile dinamik soru üretimi
        const safeTopic = sanitizeInput(topic);
        const llmPrompt = `Sen bir stratejik danışmansın. CEO'nun şu durumunu analiz etmek ve gelecek simülasyonu yapmak için kritik eksik bilgileri toplaman gerekiyor. Konu: '${safeTopic}'. Lütfen bu konunun bağlamına TAMAMEN UYGUN, simülasyonu şekillendirecek en kritik 5 soruyu üret. Çıktıyı doğrudan Markdown formatında, sorular ve altlarında CEO'nun doldurması için boş 'Cevap:' alanları olacak şekilde ver. Ekstra açıklama yapma.`;

        // Prompt'u geçici dosyaya yaz (uzun prompt'lar için güvenli yöntem)
        const tempPromptPath = path.join(__dirname, '..', '_question_prompt_temp.txt');
        fs.writeFileSync(tempPromptPath, llmPrompt, 'utf8');

        let md;
        try {
            const { stdout } = await exec(
                `claude --dangerously-skip-permissions -p "Lutfen su an bulundugun klasordeki '_question_prompt_temp.txt' dosyasini OKU ve icindeki gorevi yerine getir. JSON veya XML etiketleri kullanma, dogrudan benden istenen Markdown (veya düz metin) cevabini uret."`,
                {
                    cwd: path.join(__dirname, '..'),
                    encoding: 'utf-8',
                    timeout: 300000,
                    maxBuffer: 1024 * 1024 * 50,
                }
            );
            md = stdout;
        } finally {
            // Geçici dosyayı temizle
            try { fs.unlinkSync(tempPromptPath); } catch (e) {}
        }

        // Delivery klasörüne yaz
        if (!fs.existsSync(DELIVERY_DIR)) {
            fs.mkdirSync(DELIVERY_DIR, { recursive: true });
        }

        const outputPath = path.join(DELIVERY_DIR, 'Auron_Sorular.md');
        fs.writeFileSync(outputPath, md.trim(), 'utf8');

        console.log(`[Future_Simulator] Dinamik sorular üretildi: ${outputPath}`);
        return outputPath;
    } catch (err) {
        console.error('[Future_Simulator] Soru üretim hatası:', err.message);
        reportError('Future_Simulator - Soru Üretim', err);
        throw new Error('LLM ile soru üretimi başarısız oldu: ' + err.message);
    }
}

/**
 * runSimulation(answersText)
 * -------------------------
 * CEO'nun answers.txt dosyasındaki cevaplarını alır,
 * Claude CLI üzerinden gerçek bir LLM simülasyonu çalıştırır ve sonucu döner.
 *
 * @param {string} answersText - answers.txt dosyasının içeriği
 * @returns {object} Simülasyon sonucu { title, date, answers, scenarios, recommendation, vaultLinks }
 */
async function runSimulation(answersText) {
    if (!answersText || typeof answersText !== 'string') {
        throw new Error('Geçerli bir cevap metni gereklidir.');
    }

    console.log('[Future_Simulator] LLM destekli simülasyon başlatılıyor...');

    // Claude CLI ile dinamik senaryo üretimi
    const safeAnswers = sanitizeInput(answersText);
    const llmPrompt = `Sen bir stratejik gelecek simulatorusun. CEO'nun su cevaplarini analiz et:

${safeAnswers}

Lutfen bu verilere dayanarak Iyimser (Optimistic), Temel (Baseline) ve Kotumser (Pessimistic) olmak uzere 3 detayli senaryo uret. Ciktini sadece saf JSON formatinda ver. Baska hicbir sey yazma, sadece JSON ver.

JSON formati su sekilde olmali:
{
  "scenarios": [
    {
      "name": "Iyimser Senaryo",
      "description": "...",
      "probability": "...",
      "keyFactors": ["...", "...", "..."],
      "timeline": "...",
      "expectedOutcome": "..."
    },
    {
      "name": "Temel Senaryo",
      "description": "...",
      "probability": "...",
      "keyFactors": ["...", "...", "..."],
      "timeline": "...",
      "expectedOutcome": "..."
    },
    {
      "name": "Kotumser Senaryo",
      "description": "...",
      "probability": "...",
      "keyFactors": ["...", "...", "..."],
      "timeline": "...",
      "expectedOutcome": "..."
    }
  ],
  "recommendation": "Genel stratejik oneri...",
  "vaultLinks": ["[[Stratejik Analiz]]", "[[Senaryo Planlama]]", "[[Risk Degerlendirme]]"]
}`;

    // Prompt'u geçici dosyaya yaz (uzun prompt'lar için güvenli yöntem)
    const tempPromptPath = path.join(__dirname, '..', '_sim_prompt_temp.txt');
    fs.writeFileSync(tempPromptPath, llmPrompt, 'utf8');

    let rawOutput;
    try {
        const { stdout } = await exec(
            `claude --dangerously-skip-permissions -p "Lutfen su an bulundugun klasordeki '_sim_prompt_temp.txt' dosyasini OKU ve icindeki gorevi yerine getir. JSON veya XML etiketleri kullanma, dogrudan benden istenen saf JSON cevabini uret."`,
            {
                cwd: path.join(__dirname, '..'),
                encoding: 'utf-8',
                timeout: 300000,
                maxBuffer: 1024 * 1024 * 50,
            }
        );
        rawOutput = stdout;
    } catch (err) {
        console.error('[Future_Simulator] Claude CLI hatası:', err.message);
        reportError('Future_Simulator - Claude CLI Simülasyon', err);
        throw new Error('LLM simülasyonu başarısız oldu: ' + err.message);
    } finally {
        // Geçici dosyayı temizle
        try { fs.unlinkSync(tempPromptPath); } catch (e) {}
    }

    // LLM yanıtını JSON olarak ayrıştır (Simülatör Zırhı)
    // Strateji: Tıpkı main.js'deki cortex tag temizleme gibi, önce bilinen
    // sarmalayıcı etiketleri (```json```, <cortex>, vb.) regex ile soyar,
    // ardından temizlenmiş metin üzerinden JSON.parse yapar.
    let llmData;
    try {
        let jsonStr = rawOutput.trim();

        // Adım 1: ```json ... ``` veya ``` ... ``` bloğunu çıkar
        const codeBlockMatch = jsonStr.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        }

        // Adım 2: <cortex>...</cortex> veya <json>...</json> gibi XML etiketlerini temizle
        const xmlTagMatch = jsonStr.match(/<(?:cortex|json)>([\s\S]*?)<\/(?:cortex|json)>/i);
        if (xmlTagMatch) {
            jsonStr = xmlTagMatch[1].trim();
        }

        // Adım 3: Hâlâ saf JSON değilse, ilk { ve son } arasını al (fallback)
        if (!jsonStr.startsWith('{')) {
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }
        }

        llmData = JSON.parse(jsonStr);
        console.log('[Future_Simulator] JSON parse başarılı.');
    } catch (parseErr) {
        console.error('[Future_Simulator] JSON parse hatası:', parseErr.message);
        console.error('[Future_Simulator] Ham LLM çıktısı (ilk 500 karakter):', rawOutput.substring(0, 500));
        reportError('Future_Simulator - JSON Parse', parseErr);
        throw new Error('LLM yanıtı geçerli JSON formatında değil: ' + parseErr.message);
    }

    const simulationResult = {
        title: 'Stratejik Gelecek Simülasyonu (LLM Destekli)',
        date: new Date().toISOString(),
        answers: answersText,
        scenarios: llmData.scenarios || [],
        recommendation: llmData.recommendation || 'Simülasyon tamamlandı.',
        vaultLinks: llmData.vaultLinks || ['[[Stratejik Analiz]]', '[[Senaryo Planlama]]', '[[Risk Değerlendirme]]'],
    };

    console.log('[Future_Simulator] LLM destekli simülasyon tamamlandı.');
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
        if (scenario.timeline) md += `- **Zaman Çizelgesi:** ${scenario.timeline}\n`;
        if (scenario.expectedOutcome) md += `- **Beklenen Sonuç:** ${scenario.expectedOutcome}\n`;
        md += `- **Anahtar Faktörler:**\n`;
        (scenario.keyFactors || []).forEach(f => {
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

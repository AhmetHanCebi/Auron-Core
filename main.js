// ============================================================
// CORTEX OS - AURON (Baş Mimar ve Stratejist)
// YENİ ÖZELLİK: ReAct (Tool Calling) Mimarisi + Derin Analiz
// ÜST AKIL: Bilişsel Araçlar + Checkpoint (Soru-Cevap) Döngüsü
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

// Dinamik kök dizin: AURON_BASE_DIR env varsa onu kullan, yoksa Auron-Core'un iki üst dizini
const ROOT_DIR = process.env.AURON_BASE_DIR || path.resolve(__dirname, '..', '..');

// GÜVENLİK KALKANI: Sessiz Çöküş Engelleyici — hataları dosyaya yazar
const DELIVERY_DIR = path.join(ROOT_DIR, 'Delivery');
function reportError(context, error) {
    const timestamp = new Date().toISOString();
    const report = `[${timestamp}] [${context}] ${error.message || error}\n`;
    try {
        if (!fs.existsSync(DELIVERY_DIR)) fs.mkdirSync(DELIVERY_DIR, { recursive: true });
        fs.appendFileSync(path.join(DELIVERY_DIR, 'Auron_Sistem_Hatasi.txt'), report, 'utf8');
    } catch (e) { /* dosya yazımı başarısız olursa en azından konsol çalışır */ }
}
const BASE_DIR = ROOT_DIR;
const PROJECT_DIR = path.join(ROOT_DIR, 'Project');
const ideaPath = path.join(ROOT_DIR, 'temp', '_auron_idea.txt');

// Bilişsel Araçlar
const { generateQuestions, runSimulation, saveToVault } = require('./Cognitive_Tools/Future_Simulator');

// Checkpoint dosya yolları
const AURON_CORE_DIR = __dirname;
const answersPath = path.join(AURON_CORE_DIR, 'answers.txt');
const topicPath2 = path.join(AURON_CORE_DIR, 'topic.txt');

// ============================================================
// CHECKPOINT MANTIĞI (Üst Akıl Döngüsü)
// answers.txt yoksa -> soru üret ve bekle
// answers.txt varsa -> simülasyonu çalıştır, Vault'a kaydet, sonra ana akışa geç
// ============================================================
async function checkpointPhase() {
    if (!fs.existsSync(answersPath)) {
        // answers.txt yok -> topic.txt'den konuyu oku, yoksa ideaPath'e bak
        console.log('[Üst Akıl] answers.txt bulunamadı. Checkpoint soruları üretiliyor...');
        let topic = 'Genel Strateji';
        if (fs.existsSync(topicPath2)) {
            topic = fs.readFileSync(topicPath2, 'utf8').trim();
            console.log(`[Üst Akıl] Konu topic.txt'den okundu: "${topic.substring(0, 80)}..."`);
        } else if (fs.existsSync(ideaPath)) {
            topic = fs.readFileSync(ideaPath, 'utf8');
        }
        try {
            const questionFile = await generateQuestions(topic);
            console.log(`[Üst Akıl] Sorular üretildi: ${questionFile}`);
        } catch (err) {
            console.error('[Üst Akıl] Soru üretim hatası:', err.message);
            reportError('Üst Akıl - Soru Üretim', err);
        }
        console.log('[Üst Akıl] CEO yanıtını answers.txt olarak Auron-Core dizinine bırakmalıdır.');
        console.log('AURON_CHECKPOINT_BEKLENIYOR');
        return false; // Ana akışa geçme, bekle
    }

    // answers.txt var -> simülasyonu çalıştır
    console.log('[Üst Akıl] answers.txt bulundu! Simülasyon başlatılıyor...');
    const answersText = fs.readFileSync(answersPath, 'utf8');
    try {
        const simResult = await runSimulation(answersText);
        const vaultPath = saveToVault(simResult);
        console.log(`[Üst Akıl] Simülasyon Vault'a kaydedildi: ${vaultPath}`);
    } catch (err) {
        console.error('[Üst Akıl] Simülasyon hatası:', err.message);
        reportError('Üst Akıl - Simülasyon', err);
    }

    // answers.txt işlendi, temizle
    try { fs.unlinkSync(answersPath); } catch (e) {}

    return true; // Checkpoint tamamlandı, ana akışa geçebilir
}

// Checkpoint kontrolü ve ana akış (async IIFE)
(async () => {
    const checkpointPassed = await checkpointPhase();
    if (!checkpointPassed) {
        process.exit(0); // Soru üretildi, CEO cevabı bekleniyor
    }

    if (!fs.existsSync(ideaPath)) {
        console.log("HATA: Fikir dosyasi bulunamadi.");
        process.exit(1);
    }
    const userIdea = fs.readFileSync(ideaPath, 'utf8');

    await runAuron(userIdea);
})().catch(err => {
    console.log("HATA:", err.message);
    reportError('Auron - Ana Akış', err);
    process.exit(1);
});

async function runAuron(userIdea) {
    console.log("Auron uyanıyor, strateji belirleniyor...");
    let isFinished = false;
    let loopCount = 0;

    // 1. DÖNGÜ: AURON'UN İLK UYANIŞI
    const safeUserIdea = sanitizeInput(userIdea);
    let systemPrompt = `Sen Cortex OS'un Baş Mimarı ve Stratejisti 'Auron'sun.
Patron (Görünmez CEO) senden şu projeyi hayata geçirmeni istiyor:
"${safeUserIdea}"

🛠️ EMRİNDEKİ ARAÇLAR (TOOLS):
Projeyi doğrudan planlamadan önce, dünya standartlarında bir analiz süzgecinden geçirmek istersen şu aracı kullanabilirsin:
- Araç Kodu: [TOOL_DERIN_ANALIZ]
- Açıklama: Projeyi 4 boyutta (Pazar, Mimari, Risk, Gelecek Vizyonu/SCAMPER) acımasızca inceler ve sana muazzam bir araştırma raporu sunar.

🔀 AKILLI YOL AYRIMI (ROUTER KURALI):
DİKKAT: Eğer kullanıcının konusu kişisel bir durum/hedef ise (örn: boks maçı, diyet, kariyer seçimi), KESİNLİKLE yazılım mimarisi, kod planı veya 'plan.md' ÜRETME. Bunun yerine sadece 'Auron_Strateji_Analizi.md' adında derin bir yaşam koçluğu/strateji raporu üret. Yalnızca konu bir 'yazılım/uygulama fikri' ise plan.md ve teknik SCAMPER üret.

⚠️ YASAKLAR: ASLA kod yazma. ASLA dosya yollarına müdahale etme.

NASIL CEVAP VERECEKSİN?
Auron, sana iki seçenek sunuyorum. İkisinden birini seçmelisin:

Seçenek 1 (Aracı Çalıştır): Eğer araştırma yapmak istiyorsan, hiçbir ek açıklama yapmadan SADECE şunu yaz:
<tool>TOOL_DERIN_ANALIZ</tool>

Seçenek 2 (Planı Yaz): Eğer araştırma sonucunu aldıysan veya planı yazmaya hazırsan, Atlas için görevleri SADECE şu JSON formatında yaz:
<cortex>
{
  "analiz_raporu": "# AURON STRATEJİ VE DERİN ANALİZ\\n\\n...",
  "plan_dosyasi": "# PROJE PLANI\\n\\nAdım 1... Adım 2..."
}
</cortex>`;

    while (!isFinished && loopCount < 3) {
        loopCount++;
        const promptPath = path.join(BASE_DIR, 'temp', `_auron_prompt_${loopCount}.txt`);
        fs.writeFileSync(promptPath, systemPrompt, 'utf8');

        // Auron'a sor
        const cliCmd = `claude --dangerously-skip-permissions -p "Lutfen su an bulundugun klasordeki 'temp/_auron_prompt_${loopCount}.txt' dosyasini OKU. Kurallara uyarak cevabini uret."`;

        let rawOutput;
        try {
            const { stdout } = await exec(cliCmd, { cwd: BASE_DIR, encoding: "utf-8", timeout: 300000, maxBuffer: 1024 * 1024 * 50 });
            rawOutput = stdout;
        } catch (err) {
            console.log("Claude Hatası:", err.message);
            reportError('Auron - Claude CLI', err);
            process.exit(1);
        }
        try { fs.unlinkSync(promptPath); } catch(e){}

        // 3. ARAÇ TETİKLEME KONTROLÜ
        if (rawOutput.includes("<tool>TOOL_DERIN_ANALIZ</tool>")) {
            console.log("🛠️ Auron 'Derin Analiz' aracını tetikledi! Sistem araştırmaya başlıyor...");

            // Aracı Gerçekten Çalıştır (Yeni ve Acımasız Araştırma Motoru)
            const toolPrompt = `Sen Cortex OS'un otonom ve acımasız "Stratejik Analiz Motorusun". Amacın, patronun verdiği kök fikri "Tree of Thoughts" mantığıyla en derine kadar kazımak ve projeyi dünya standartlarının üzerine çıkarmaktır.

FİKİR: "${safeUserIdea}"

GÖREVİN:
Bu fikri aşağıdaki 6 disiplinde acımasızca analiz et.

1. Kök Neden ve Öz Değer (First Principles)
- 5 Neden Analizi ile bu dalın çözdüğü asıl problemi ve sunduğu çekirdek değeri açıkla.
2. Sistem Mekaniği (SCAMPER & MECE)
- Bu seçenekteki süreçler nasıl işler? Hangi adımlar birleştirilebilir (Combine) veya yok edilebilir (Eliminate)? (MECE prensibine uy).
3. Varsayım Haritası (Assumption Mapping)
- Arzu Edilebilirlik: Kullanıcı bunu neden istesin?
- Uygulanabilirlik: Teknik/Operasyonel darboğaz nedir?
- Sürdürülebilirlik: Bu modelin ticari can damarı neresi?
4. Antikırılganlık ve Stres Testi (Positive Pressure)
- Pre-Mortem Analizi: Şu an 1 yıl gelecekteyiz ve bu sistem çöktü. İçsel zayıflık neydi?
- Red Team Saldırısı: Kötü niyetli biri bu adımı nereden hackler veya manipüle eder?
5. Ölçeklenebilirlik (TAM/SAM/SOM & OODA)
- Sistem 1 milyon kullanıcıya ulaştığında hangi operasyon patlar? OODA döngüsüyle anlık tepki mekanizması nasıl kurulur?
6. Nihai Vizyon (Legendary Scene & PR/FAQ)
- 5 yıl sonra bu uygulamanın dünyayı salladığı o gün, basın bülteni başlığı ne olurdu? Müşterinin soracağı en zorlu Soru nedir ve efsanevi cevabımız ne olacak?

ÇIKTI KURALI:
Bana ayrı ayrı dosyalar YAZMA! Tüm bu 6 başlığı barındıran, inanılmaz detaylı, tek ve devasa bir MARKDOWN RAPORU üret. Asla kod yazma, sadece bu acımasız analizi yap.`;

            const toolPromptPath = path.join(BASE_DIR, 'temp', '_tool_prompt.txt');
            fs.writeFileSync(toolPromptPath, toolPrompt, 'utf8');

            console.log("🔍 Araştırma yapılıyor (Bu biraz sürebilir)...");
            let toolResult;
            try {
                const { stdout } = await exec(`claude --dangerously-skip-permissions -p "Lutfen 'temp/_tool_prompt.txt' dosyasini oku ve acimasiz derin analiz raporunu uret."`, { cwd: BASE_DIR, encoding: "utf-8", timeout: 300000, maxBuffer: 1024 * 1024 * 50 });
                toolResult = stdout;
            } catch(err) {
                console.log("Araç Hatası:", err.message);
                reportError('Auron - Derin Analiz Aracı', err);
                process.exit(1);
            }
            try { fs.unlinkSync(toolPromptPath); } catch(e){}

            console.log("✅ Derin Analiz tamamlandı. Rapor Auron'un hafızasına yükleniyor...");

            // DİKKAT: 2. DÖNGÜ İÇİN HAFIZA SIFIRLAMA (Auron'un kafası karışmasın diye)
            systemPrompt = `Sen Cortex OS'un Baş Mimarı ve Stratejisti 'Auron'sun.
Patronun projesi: "${safeUserIdea}"

Aşağıda, sistemin az önce senin için ürettiği DÜNYA STANDARTLARINDA DERİN ANALİZ RAPORU bulunmaktadır:
=========================================
${toolResult}
=========================================

🔀 AKILLI YOL AYRIMI (ROUTER KURALI):
DİKKAT: Eğer kullanıcının konusu kişisel bir durum/hedef ise (örn: boks maçı, diyet, kariyer seçimi), KESİNLİKLE yazılım mimarisi, kod planı veya 'plan.md' ÜRETME. Bunun yerine sadece 'Auron_Strateji_Analizi.md' adında derin bir yaşam koçluğu/strateji raporu üret. Yalnızca konu bir 'yazılım/uygulama fikri' ise plan.md ve teknik SCAMPER üret.

GÖREVİN:
Bu devasa strateji raporunu sentezle. Eğer konu yazılım/uygulama ise Atlas'ın okuyup kodlayacağı o kusursuz 'plan.md' inşaat haritasını çıkar. Eğer konu kişisel bir hedef/durum ise sadece derin yaşam koçluğu/strateji analizi üret.

ÇIKTI FORMATI (ÖLÜMCÜL KURAL):
Cevabını KESİNLİKLE aşağıdaki XML etiketleri arasında ve SADECE geçerli bir JSON formatında ver. Düz metin yazma!

<cortex>
{
  "analiz_raporu": "Üstteki derin analiz raporunun vurucu kısımlarını ve senin mimari kararlarını Markdown olarak buraya yaz.",
  "plan_dosyasi": "# PROJE PLANI\\n\\nAtlas'ın sırayla okuyup uygulayacağı teknik görevler (Adım 1, Adım 2 vb.)."
}
</cortex>`;

        } else {
            // Tool değilse, demek ki Auron JSON planını verdi (İş Bitti)
            const m = rawOutput.match(/<cortex>([\s\S]*?)<\/cortex>/i);
            if (m) {
                let parsed;
                try {
                    parsed = JSON.parse(m[1].trim().replace(/^```(?:json)?/, "").replace(/ সংকট$/, "").trim());
                } catch (e) {
                    console.error('Cortex JSON parse hatası:', e.message);
                    reportError('Auron - Cortex JSON Parse', e);
                    break;
                }
                if (!fs.existsSync(PROJECT_DIR)) fs.mkdirSync(PROJECT_DIR, { recursive: true });

                fs.writeFileSync(path.join(PROJECT_DIR, 'plan.md'), parsed.plan_dosyasi, 'utf8');
                fs.writeFileSync(path.join(PROJECT_DIR, 'Auron_Analizi.md'), parsed.analiz_raporu, 'utf8');

                try { fs.unlinkSync(ideaPath); } catch(e){}
                console.log("AURON_BASARILI");
                isFinished = true;
            } else {
                console.log("HATA: Auron ne tool kullandi ne de gecerli JSON uretti.");
                console.log("CLAUDE HAM CIKTISI (İlk 1000 Karakter):\n" + rawOutput.substring(0, 1000));
                break;
            }
        }
    }
}

module.exports = { runAuron };
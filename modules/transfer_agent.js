// ============================================================
// WORMHOLE TRANSFER AJANI - Solucan Deligi Dosya Isinlama Sistemi
// Projeler arasi otonom dosya transfer motoru
// ============================================================
const fs = require('fs');
const path = require('path');

// Kok dizin: main.js ile ayni mantik (Auron-Core'un iki ust dizini)
const ROOT_DIR = process.env.AURON_BASE_DIR || path.resolve(__dirname, '..', '..', '..');
const PROJECT_DIR = path.join(ROOT_DIR, 'Project');
const DELIVERY_DIR = path.join(ROOT_DIR, 'Delivery');

// Delivery klasoru yoksa olustur
if (!fs.existsSync(DELIVERY_DIR)) {
    fs.mkdirSync(DELIVERY_DIR, { recursive: true });
}

function wormholeScan() {
    try {
        // Project dizini yoksa henuz taranacak bir sey yok
        if (!fs.existsSync(PROJECT_DIR)) return;

        // Project altindaki tum klasorleri (projeleri) tara
        const projects = fs.readdirSync(PROJECT_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory());

        for (const project of projects) {
            const projectPath = path.join(PROJECT_DIR, project.name);
            const transferDir = path.join(projectPath, 'Delivery_Transfer');

            // Delivery_Transfer klasoru yoksa otonom olustur
            if (!fs.existsSync(transferDir)) {
                try {
                    fs.mkdirSync(transferDir, { recursive: true });
                    console.log(`[WORMHOLE] ${project.name}/Delivery_Transfer klasoru otonom olusturuldu.`);
                } catch (err) {
                    console.error(`[WORMHOLE] Klasor olusturma hatasi (${project.name}):`, err.message);
                    continue;
                }
            }

            // Delivery_Transfer icindeki dosyalari kontrol et ve tasi
            try {
                const files = fs.readdirSync(transferDir, { withFileTypes: true })
                    .filter(f => f.isFile());

                for (const file of files) {
                    const sourcePath = path.join(transferDir, file.name);
                    const destPath = path.join(DELIVERY_DIR, file.name);

                    try {
                        // Hedefte ayni isimde dosya varsa uzerine yazmayi engelle
                        let finalDest = destPath;
                        if (fs.existsSync(destPath)) {
                            const ext = path.extname(file.name);
                            const base = path.basename(file.name, ext);
                            const timestamp = Date.now();
                            finalDest = path.join(DELIVERY_DIR, `${base}_${timestamp}${ext}`);
                        }

                        fs.copyFileSync(sourcePath, finalDest);
                        fs.unlinkSync(sourcePath);
                        console.log(`[WORMHOLE] ${file.name} Delivery klasorune isinlandi! (Kaynak: ${project.name})`);
                    } catch (err) {
                        console.error(`[WORMHOLE] Dosya tasima hatasi (${file.name}):`, err.message);
                    }
                }
            } catch (err) {
                console.error(`[WORMHOLE] Delivery_Transfer okuma hatasi (${project.name}):`, err.message);
            }
        }
    } catch (err) {
        console.error('[WORMHOLE] Genel tarama hatasi:', err.message);
    }
}

// Ilk taramayi hemen yap, sonra 3 saniyede bir tekrarla
wormholeScan();
const wormholeInterval = setInterval(wormholeScan, 3000);

console.log('[WORMHOLE] Solucan Deligi Transfer Ajani aktif! (3sn aralikla tarama)');

module.exports = { wormholeScan, wormholeInterval };

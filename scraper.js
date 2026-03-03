const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log("🕵️ Iniciando o Robô Stealth para o Sympla...");
    let browser;

    try {
        console.log("Tentando abrir o navegador invisível...");
        // Trazemos o launch para dentro do try/catch com novas travas para servidor Linux
        browser = await puppeteer.launch({ 
            headless: "new",
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ] 
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log("Navegador aberto! Acessando O'Z Comedy no Sympla...");
        await page.goto('https://www.sympla.com.br/produtor/ozcomedy', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("Página carregada. Buscando os shows...");

        const shows = await page.evaluate(() => {
            const eventos = [];
            const cards = document.querySelectorAll('a[href*="/evento/"]');

            cards.forEach((card, index) => {
                if (index >= 8) return; 
                
                const url = card.href;
                const titleElement = card.querySelector('h1, h2, h3, h4');
                const nome = titleElement ? titleElement.innerText.trim() : "Show O'Z Comedy";
                const imgElement = card.querySelector('img');
                const img = imgElement ? imgElement.src : "";
                const textoCru = card.innerText;

                eventos.push({ nome, url, img, dataStr: textoCru });
            });

            return eventos;
        });

        // Só salva o arquivo se encontrou shows (evita apagar a agenda se der erro)
        if (shows.length > 0) {
            fs.writeFileSync('agenda.json', JSON.stringify(shows, null, 2));
            console.log(`✅ Sucesso! ${shows.length} shows capturados e salvos.`);
        } else {
            console.log("⚠️ A página carregou, mas nenhum show foi encontrado.");
        }

    } catch (error) {
        console.error("❌ ERRO FATAL no Node.js:", error);
        process.exit(1); // Força o log do GitHub a ficar vermelho para lermos o erro
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();

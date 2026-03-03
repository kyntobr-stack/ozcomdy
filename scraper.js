const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Adiciona a camuflagem para passar pelo Cloudflare
puppeteer.use(StealthPlugin());

(async () => {
    console.log("🕵️ Iniciando o Robô Stealth para o Sympla...");

    // Inicia o navegador invisível
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // Define um tamanho de tela padrão de desktop
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("Acessando a página do O'Z Comedy...");
        await page.goto('https://www.sympla.com.br/produtor/ozcomedy', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("Página carregada. Extraindo shows...");

        // Avalia a página e extrai os dados
        const shows = await page.evaluate(() => {
            const eventos = [];
            // O Sympla sempre usa links que contém "/evento/" para os cards
            const cards = document.querySelectorAll('a[href*="/evento/"]');

            cards.forEach((card, index) => {
                if (index >= 8) return; // Pega no máximo os 8 primeiros
                
                const url = card.href;
                
                // Tenta achar o título (geralmente em <h1>, <h2> ou <h3>)
                const titleElement = card.querySelector('h1, h2, h3, h4');
                const nome = titleElement ? titleElement.innerText.trim() : "Show O'Z Comedy";
                
                // Tenta achar a imagem
                const imgElement = card.querySelector('img');
                const img = imgElement ? imgElement.src : "";

                // Pega todo o texto do card para extrair a data depois
                // Como o Sympla muda as classes CSS constantemente, pegar o texto bruto é mais seguro
                const textoCru = card.innerText;

                eventos.push({
                    nome: nome,
                    url: url,
                    img: img,
                    dataStr: textoCru // O front-end pode ler isso e exibir
                });
            });

            return eventos;
        });

        // Salva o arquivo JSON
        fs.writeFileSync('agenda.json', JSON.stringify(shows, null, 2));
        console.log(`✅ Sucesso! ${shows.length} shows capturados e salvos em agenda.json.`);

    } catch (error) {
        console.error("❌ Erro durante a raspagem:", error.message);
    } finally {
        await browser.close();
    }
})();

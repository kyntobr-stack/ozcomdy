const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("🎭 Iniciando o Robô O'Z Comedy para o Sympla...");

    // Inicia o navegador invisível
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Disfarça o robô como um navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    try {
        console.log("Acessando a página do produtor...");
        await page.goto('https://www.sympla.com.br/produtor/ozcomedy', { waitUntil: 'networkidle2' });

        // Avalia a página e extrai os dados
        const shows = await page.evaluate(() => {
            const eventos = [];
            // O Sympla normalmente usa links que contém "/evento/"
            const cards = document.querySelectorAll('a[href*="/evento/"]');

            cards.forEach((card, index) => {
                if (index >= 8) return; // Limite de 8 shows
                
                const url = card.href;
                // Busca elementos de texto dentro do card
                const titleElement = card.querySelector('h3');
                const imgElement = card.querySelector('img');
                
                // Tenta achar a data (o Sympla costuma colocar a data em spans/divs logo acima ou abaixo do título)
                // Aqui pegamos todo o texto do card e tentamos isolar a parte da data/hora
                const allText = card.innerText; 
                
                eventos.push({
                    nome: titleElement ? titleElement.innerText : "Show O'Z Comedy",
                    url: url,
                    img: imgElement ? imgElement.src : "",
                    textoCru: allText // Salvamos o texto cru caso precise tratar no frontend
                });
            });

            return eventos;
        });

        // Salva o arquivo JSON
        fs.writeFileSync('agenda.json', JSON.stringify(shows, null, 2));
        console.log(`✅ Sucesso! ${shows.length} shows capturados e salvos em agenda.json.`);

    } catch (error) {
        console.error("❌ Erro ao capturar dados:", error);
    } finally {
        await browser.close();
    }
})();

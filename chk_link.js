const fs = require('fs');
const axios = require('axios');
const readline = require('readline');
const { format, parseISO } = require('date-fns');
const { promisify } = require('util');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const sleep = promisify(setTimeout);

const getChalk = async () => {
  return (await import('chalk')).default;
};

(async () => {
  const chalk = await getChalk();

  const clear = () => process.stdout.write('\x1Bc');
  const title = (t) => process.title = t;

  const colors = {
    ask: (qus) => `${chalk.magenta.bold('[?]')} ${qus}`,
    banner: (txt) => console.log(chalk.magenta.bold(txt)),
    error: (txt) => console.log(`${chalk.red.dim('[-]')} ${txt}`),
    success: (txt) => console.log(`${chalk.green.bold('[+]')} ${txt}`),
    warning: (txt) => console.log(`${chalk.yellow.dim('[!]')} ${txt}`),
    yellow: (txt) => chalk.yellow.bold(txt),
    darkYellow: (txt) => chalk.hex('#9B870C').bold(txt),
  };

  clear();
  title('Checker Link | https://discord.gg/g7AGfVJT94 ');

  colors.warning(colors.yellow("Vazado Por IcaroPJL\n"));

  rl.question(colors.ask("Velocidade (1 a 5): "), async (input) => {
    const delay = parseInt(input, 10);

    // Apaga a linha de entrada do usuário
    process.stdout.moveCursor(0, -1); // Move o cursor uma linha para cima
    process.stdout.clearLine(); // Apaga a linha atual

    const token = fs.readFileSync('token.txt', 'utf8').trim();
    const auth = { Authorization: token };

    let validCount = 0;
    let redeemedCount = 0;
    let invalidCount = 0;

    const outputDir = 'output_links';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    try {
      const r = await axios.get('https://ptb.discord.com/api/v9/users/@me', { headers: auth });
      if ([200, 201, 204].includes(r.status)) {
        colors.success("Token Válido.");
      } else {
        colors.error("Token Inválido.");
        process.exit();
      }
    } catch (e) {
      console.log(e)
      colors.error(`Erro ao tentar conectar à API do Discord: ${e.message}`);
      process.exit();
    }

    const updateTitle = () => {
      title(`Status - Válidos: ${validCount} | Resgatados: ${redeemedCount} | Inválidos: ${invalidCount}`);
    };

    const sort_ = (file, item) => {
      const data = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
      return data.includes(item);
    };

    const save = (file, data) => {
      fs.appendFileSync(file, data + "\n");
    };

    const check = async (promocode) => {
      try {
        const rs = await axios.get(`https://ptb.discord.com/api/v9/entitlements/gift-codes/${promocode}`, { headers: auth });
        if ([200, 204, 201].includes(rs.status)) {
          const data = rs.data;
          if (data.uses === data.max_uses) {
            colors.warning(`Resgatado => https://discord.com/billing/promotions/${promocode}`);
            save(`${outputDir}/resgatados.txt`, `https://discord.com/billing/promotions/${promocode}`);
            redeemedCount++;
          } else {
            try {
              const now = new Date();
              const expAt = data.expires_at.split('.')[0];
              const parsed = parseISO(expAt);
              const days = Math.abs((now - parsed) / (1000 * 60 * 60 * 24));
              const title = data.promotion.inbound_header_text;
              colors.success(`Válido => ${promocode.slice(0, -6)}****** | Dias Restantes: ${Math.floor(days)} | Expira em: ${format(parsed, 'yyyy-MM-dd HH:mm:ss')} | Promoção: ${title}`);
              save(`${outputDir}/validos.txt`, `https://discord.com/billing/promotions/${promocode}`);
              validCount++;
            } catch (e) {
              colors.error(`Erro ao analisar data: ${e.message}`);
              save(`${outputDir}/validos.txt`, `https://discord.com/billing/promotions/${promocode}`);
              validCount++;
            }
          }
        } else if (rs.status === 429) {
          const deta = rs.data;
          colors.warning(`Tomou Rate Limit Por ${deta.retry_after} Seconds!`);
          await sleep(deta.retry_after * 1000);
          await check(promocode);
        } else {
          colors.error(`Código Inválido => ${promocode} (Status ${rs.status})`);
          save(`${outputDir}/invalidos.txt`, promocode);
          invalidCount++;
        }
      } catch (e) {
        console.log(e)
        colors.error(`Erro ao tentar conectar à API do Discord: ${e.message}`);
        save(`${outputDir}/invalidos.txt`, promocode);
        invalidCount++;
      }
      updateTitle();
    };

    const start = async () => {
      const codes = fs.readFileSync('promos.txt', 'utf8').split('\n').filter(Boolean);
      for (const promo of codes) {
        const code = promo.replace('https://discord.com/billing/promotions/', '').replace('https://promos.discord.gg/', '').replace('/', '');
        await check(code);
        await sleep(delay * 150);
      }
      colors.success("Todos os links já foram Checkados!");
    };

    await start();
  });
})();

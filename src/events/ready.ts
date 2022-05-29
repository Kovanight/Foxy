import { AutoPoster } from 'topgg-autoposter'
import axios from 'axios'

export default class Ready {
    private client: any;

    constructor(client) {
        this.client = client;
    }

    async run(): Promise<void> {
        console.info(`[READY] - Shard ${Number(this.client.shard.ids) + 1} Está conectada com ${this.client.guilds.cache.size} Servidores!`);

        const status = [
            { name: "🐦 | Me siga no Twitter: @FoxyDiscordBot", type: 0 },
            { name: "💖 | Fui criada pelo WinG4merBR#6611", type: 3 },
            { name: `😍 | Me adicione usando /invite`, type: 1 },
            { name: `🤔 | Precisa de ajuda? Utilize /help`, type: 2 },
            { name: "🍰 | Minha comida preferida é pizza e bolo :3 💖", type: 5 }
        ];

        setInterval(() => {
            const randomStatus = status[Math.floor(Math.random() * status.length)];
            this.client.user.setPresence({ activities: [randomStatus] });
        }, 10000);

        // If your bot is in top.gg, you can uncomment this

        setInterval(() => {
            const dbl = AutoPoster(this.client.config.dblauth, this.client);
            dbl.on('posted', (stats) => {
                console.info("[DBL] - Stats posted!");
            });
        }, 86400000);
    }
}
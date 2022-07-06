import { Client, ClientOptions, Collection } from 'discord.js';
import { FoxyCommands } from './structures/command/BaseCommand';
import { FoxySettings, FoxyOptions } from './structures/ClientSettings';
import { App } from './structures/server/Server';
import DatabaseConnection from './structures/database/DatabaseConnection';
import WebhookManager from './structures/WebhookManager';
import i18next from 'i18next';
import InteractionManager from './structures/command/InteractionManager'
import i18nbackend from 'i18next-fs-backend';
import * as fs from 'fs';
const app = new App(8080);

export default class FoxyClient extends Client {
    public commands = new Collection<string, FoxyCommands>();
    public emotes: Object;
    public database: Object;
    public WebhookManager: Object;
    public config: FoxySettings;
    public ctx: InteractionManager;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
        this.config = require("../config.json");
        this.database = new DatabaseConnection(this);
        this.WebhookManager = new WebhookManager(this);
        this.ctx = new InteractionManager(this);
        this.emotes = require("./structures/json/emotes.json");
    }

    startFoxy(options: FoxyOptions) {
        this.loadLocales(options.locales);
        this.loadCommands(options.commands);
        this.loadEvents(options.events);
        app.startServer();
        super.login(options.token);
    }

    async loadLocales(path: string): Promise<void> {
        try {
            await i18next.use(i18nbackend).init({
                ns: ["commands", "events", "permissions", "subscriptions"],
                defaultNS: "commands",
                preload: fs.readdirSync(path),
                fallbackLng: "pt-BR",
                backend: { loadPath: `${path}/{{lng}}/{{ns}}.json` },
                interpolation: {
                    escapeValue: false,
                    useRawValueToEscape: true
                },
                returnEmptyString: false,
                returnObjects: true
            });
            return console.info(`[LOCALES] - Loaded ${i18next.languages.length} languages`);
        } catch (error) {
            return console.error(`Erro ao carregar locales: `, error);
        }
    }

    async loadCommands(path: string): Promise<void> {
        const commandFolders = fs.readdirSync(path);
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(path + `/${folder}`);
            for (const file of commandFiles) {
                const commandFile = await import(`${path}/${folder}/${file}`);
                const command = new commandFile.default(this);
                this.commands.set(command.config.name, command);
            }
        }
    }

    async loadEvents(path: string): Promise<void> {
        const eventFiles = fs.readdirSync(path);
        for (const file of eventFiles) {
            const eventFile = await import(`${path}/${file}`);
            const event = new eventFile.default(this);
            console.info(`[EVENTS] - Loaded ${file.split(".")[0]}`);
            this.on(file.split(".")[0], (...args) => event.run(...args));
        }
    }
}
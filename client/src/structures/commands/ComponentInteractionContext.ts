import { InteractionResponseTypes, InteractionCallbackData } from 'discordeno';
import { User } from 'discordeno/transformers';
import { ComponentInteraction } from '../types/interaction';
import { bot } from "../../index";
import { get } from 'https';
import { URL } from 'url';

export type CanResolve = 'users' | 'members' | false;
export default class <InteractionType extends ComponentInteraction = ComponentInteraction> {
    private replied = false;

    constructor(public interaction: InteractionType) { }

    get user(): User {
        return this.interaction.user;
    }

    get author(): User {
        return this.interaction.message?.interaction?.user as User;
    }

    get channelId(): bigint {
        return this.interaction.channelId ?? 0n;
    }

    get commandId(): bigint {
        return BigInt(this.interaction.data.customId.split('|')[2]);
    }

    get sentData(): string[] {
        return this.interaction.data.customId.split('|').slice(3);
    }

    makeReply(emoji: any, text: any): string {
        return `<:emoji:${emoji}> **|** ${text}`;
    }

    async respondInteraction(options: InteractionCallbackData & { attachments?: unknown[] },): Promise<void> {
        if (!this.replied) {
            await bot.helpers.sendInteractionResponse(this.interaction.id, this.interaction.token, {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: options,
            })
            this.replied = true;
            return;
        }

        await bot.helpers.editOriginalInteractionResponse(this.interaction.token, options)
    }

    async followUp(options: InteractionCallbackData): Promise<void> {
        await bot.helpers.sendFollowupMessage(this.interaction.token, {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: options,
        })
    }

    async getContent(url) {
        return new Promise((resolve, reject) => {
          get(url, (res) => {
            const {statusCode} = res;
            if(statusCode !== 200) {
              res.resume();
              reject(`Request failed. Status code: ${statusCode}`);
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {rawData += chunk});
            res.on('end', () => {
              try {
                const parsedData = JSON.parse(rawData);
                resolve(parsedData);
              } catch(e) {
                reject(`Error: ${e}`);
              }
            });
          }).on('error', (err) => {
            reject(`Error: ${err.message}`);
          })
        });
      }

      
    async getImage(command: string) {
        let baseURL = 'https://cdn.foxybot.win/images/';
        let url = new URL(baseURL + command);
        return await this.getContent(url.toString());
    }
    
    getEmojiById(id: BigInt) {
        return `<:emoji:${id}>`;
    }

    async sendReply(options: InteractionCallbackData & { attachments?: unknown[] }): Promise<void> {
        if (!this.replied) {
            this.replied = true;
            await bot.helpers.sendInteractionResponse(this.interaction.id, this.interaction.token, {
                type: InteractionResponseTypes.UpdateMessage,
                data: options,
            })
            return;
        }

        await bot.helpers.editOriginalInteractionResponse(this.interaction.token, options)
    }
}
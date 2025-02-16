import { createCommand } from "../../structures/commands/createCommand";
import { ApplicationCommandOptionTypes } from "discordeno/types";
import { bot } from "../../index";
import { lylist } from '../../structures/json/layoutList.json';

const choices = lylist.map(data => Object({ name: data.name, nameLocalizations: data.nameLocalizations, value: data.id }));
const LayoutCommand = createCommand({
    name: "layout",
    description: "[Social] Change your profile layout",
    descriptionLocalizations: {
        "pt-BR": "[Social] Mude o layout do seu perfil"
    },
    category: "economy",
    options: [
        {
            name: "set",
            nameLocalizations: {
                "pt-BR": "definir"
            },
            description: "[Social] Set your profile layout",
            descriptionLocalizations: {
                "pt-BR": "[Social] Defina o layout do seu perfil"
            },
            type: ApplicationCommandOptionTypes.SubCommand,
            options: [
                {
                    name: "layout",
                    nameLocalizations: {
                        "pt-BR": "layout"
                    },
                    description: "Choose your profile layout",
                    descriptionLocalizations: {
                        "pt-BR": "Escolha o layout do seu perfil"
                    },
                    type: ApplicationCommandOptionTypes.String,
                    choices: choices,
                    required: true
                }
            ]
        }
    ],
    execute: async (context, endCommand, t) => {
        const selectedOption = context.getOption<string>('layout', false, true);
        const layouts = lylist.map(data => data.id);
        if (!layouts.includes(selectedOption)) return context.sendReply({
            content: context.makeReply(bot.emotes.FOXY_CRY, t('commands:layouts.notFound'))
        });
        const userData = await bot.database.getUser(context.author.id);
        userData.layout = selectedOption;
        await userData.save();
        context.sendReply({
            content: context.makeReply(bot.emotes.FOXY_YAY, t('commands:layouts.changed'))
        })
        endCommand();
    }
});

export default LayoutCommand;
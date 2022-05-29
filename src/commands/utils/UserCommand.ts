import Command from "../../structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed, MessageActionRow, MessageButton } from "discord.js";

export default class ProfileCommand extends Command {
    constructor(client) {
        super(client, {
            name: "user",
            description: "Get user information",
            category: "utils",
            dev: false,
            data: new SlashCommandBuilder()
                .setName("user")
                .setDescription("[🛠 Utils] Get user information")
                .addSubcommand(option => option.setName("info").setDescription("[🛠 Utils] Get some user informtion").addUserOption(
                    option => option.setName("user").setDescription("The user ID or mention").setRequired(false)
                ))
                .addSubcommand(option => option.setName("avatar").setDescription("[🛠 Utils] Get some user's avatar").addUserOption(
                    option => option.setName("user").setDescription("The user ID or mention").setRequired(false)
                ))
        });
    }

    async execute(interaction, t): Promise<void> {
        const command = interaction.options.getSubcommand();
        const user = interaction.options.getUser("user") || interaction.user;
        if (!user) return interaction.reply(t('commands:global.noUser'));

        switch (command) {
            case "info": {
                const data = await this.client.api.users(user.id).get();

                if (data.banner) {
                    var banner = data.banner.startsWith("a_") ? ".gif?size=4096" : ".png?size=4096";
                    banner = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}${banner}`;
                }
                const userEmbed = new MessageEmbed()
                    .setThumbnail(user.avatarURL({ dynamic: true, size: 1024 }))
                    .addField(`:bookmark: ${t('commands:user.info.tag')}`, `\`${user.tag}\``)
                    .addField(`:date: ${t('commands:user.info.createdAt')}`, `\`${user.createdAt.toLocaleString(t.lng, { timeZone: "America/Sao_Paulo", hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })}\``)
                    .addField(`:computer: ${t('commands:user.info.userId')}`, `\`${user.id}\``)
                    .setImage(banner)

                const member = interaction.guild.members.cache.get(user.id);
                if (member) {
                    const memberRow = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setLabel(t('commands:user.member.permissions.button'))
                                .setCustomId("permissions")
                                .setStyle("PRIMARY"),
                            new MessageButton()
                                .setLabel(t('commands:user.info.avatar'))
                                .setCustomId("avatar")
                                .setStyle("PRIMARY")
                        )

                    const memberEmbed = new MessageEmbed()
                        .setTitle(t('commands:user.member.title', { user: user.username }))
                        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                        .addFields(
                            { name: t('commands:user.member.joinedAt'), value: `\`${member.joinedAt.toLocaleString(t.lng, { timeZone: "America/Sao_Paulo", hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })}\`` },
                            { name: t('commands:user.member.nickname'), value: `\`${member.nickname || t('commands:user.member.noNickname')}\`` },
                            { name: t('commands:user.member.role'), value: `${member._roles.map(r => `<@&${r}>`).join(", ")}` },
                        )

                    interaction.reply({ embeds: [userEmbed, memberEmbed], components: [memberRow] });
                } else {
                    const avatarRow = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setLabel(t('commands:user.info.avatar'))
                                .setCustomId("avatar")
                                .setStyle("PRIMARY")
                        )
                    interaction.reply({ embeds: [userEmbed], components: [avatarRow] });
                }

                const filter = i => i.customId === 'avatar' && i.user.id === interaction.user.id;
                const avatarCollector = interaction.channel.createMessageComponentCollector(filter, { max: 1, time: 15000 });

                avatarCollector.on('collect', async i => {
                    if (i.customId === 'avatar') {
                        const avatarEmbed = new MessageEmbed()
                            .setTitle(t('commands:user.avatar.title', { user: user.username }))
                            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setLabel(t('commands:user.avatar.click'))
                                    .setStyle("LINK")
                                    .setURL(user.displayAvatarURL({ size: 1024 })),

                            )
                        await interaction.followUp({ embeds: [avatarEmbed], ephemeral: true, components: [row] });
                        i.deferUpdate();
                        avatarCollector.stop();
                    } else if (i.customId === 'permissions') {
                        const permissions = member.permissions.toArray();
                        const embed = new MessageEmbed()
                            .setTitle(t('commands:user.member.permissions.title', { user: user.username }))
                            .setDescription(permissions.map(p => `\`${t(`permissions:${p}`)}\``).join(", "))
                            .setColor(0x00ff00)
                        interaction.followUp({ embeds: [embed], ephemeral: true });
                        i.deferUpdate();
                        avatarCollector.stop();
                    }
                });
                break;
            }

            case "avatar": {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel(t('commands:user.avatar.click'))
                            .setStyle("LINK")
                            .setURL(user.displayAvatarURL({ size: 1024 })),

                    )
                const avatarEmbed = new MessageEmbed()
                    .setTitle(t('commands:user.avatar.title', { user: user.username }))
                    .setImage(user.displayAvatarURL({ size: 2048 }))
                    .setFooter({ text: t('commands:user.avatar.footer') })

                await interaction.reply({ embeds: [avatarEmbed], components: [row] });
                break;
            }

            case "banner": {
                const data = await this.client.api.users(user.id).get();

                if (data.banner) {
                    var banner = data.banner.startsWith("a_") ? ".gif?size=4096" : ".png?size=4096";
                    banner = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}${banner}`;
                }
                if (!data.banner) return interaction.reply(t('commands:user.banner.noBanner'));

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel(t('commands:user.banner.click'))
                            .setStyle("LINK")
                            .setURL(banner),
                    )
                if (!banner) return interaction.reply(t('commands:user.banner.noBanner'));
                const bannerEmbed = new MessageEmbed()
                    .setTitle(t('commands:user.banner.title', { user: user.username }))
                    .setImage(banner)

                await interaction.reply({ embeds: [bannerEmbed], components: [row] });
            }
        }
    }
}
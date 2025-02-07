import { Interaction } from 'discordeno/transformers';
import { AllowedMentionsTypes, InteractionResponseTypes } from 'discordeno/types';
import i18next from 'i18next';

import { mentionUser } from '../../utils/discord/User';
import { MessageFlags } from '../../utils/discord/Message';
import { bot } from '../../index';
import ComponentInteractionContext from './ComponentInteractionContext';
import { ComponentInteraction } from '../types/interaction';


const componentExecutor = async (interaction: Interaction): Promise<void> => {
  const receivedCommandName = interaction.message?.interaction?.name;

  if (!receivedCommandName) return;
  if (!interaction.data?.customId) return;

  const [commandName] = receivedCommandName.split(' ');

  const errorReply = async (content: string): Promise<void> => {
    await bot.helpers
      .sendInteractionResponse(interaction.id, interaction.token, {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `<:emoji:${bot.emotes.FOXY_CRY}> | ${content}`,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [AllowedMentionsTypes.UserMentions] },
        },
      })
      .catch(() => null);
  };
  const user = await bot.database.getUser(interaction.user.id);
  const T = global.t = i18next.getFixedT(user.language ?? 'pt-BR');
  const command = bot.commands.get(commandName);

  if (!command) return errorReply(T('permissions:UNKNOWN_SLASH'));
  if (!command.commandRelatedExecutions || command.commandRelatedExecutions.length === 0) return;

  const isUserBanned = await user.isBanned;

  if (isUserBanned) {
    const bannedInfo = await {
      banReason: user.banReason,
    }

    return errorReply(
      T('permissions:BANNED_INFO', {
        banReason: bannedInfo?.banReason,
      }),
    );
  }



  const [executorIndex, interactionTarget] = interaction.data.customId.split('|');

  if (interactionTarget.length > 1 && interactionTarget !== `${interaction.user.id}`)
    return errorReply(
      T('permissions:NOT_INTERACTION_OWNER', { owner: mentionUser(interactionTarget) }),
    );

  const execute = command.commandRelatedExecutions[Number(executorIndex)];

  if (!execute) return errorReply(T('permissions:UNKNOWN_INTERACTION'));

  const context = new ComponentInteractionContext(interaction as ComponentInteraction);

  await new Promise((res) => {
    execute(context).catch((err) => {
      errorReply(
        T('events:error.title', {
          cmd: command.name,
        }),
      );

      console.error(err);
      // eslint-disable-next-line no-param-reassign
      if (typeof err === 'string') err = new Error(err);
    });

    res(undefined);
  });
};

export { componentExecutor };
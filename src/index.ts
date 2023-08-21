import { Client, Guild, IntentsBitField, TextChannel } from 'discord.js';
import { Logger } from './logger';

// Time constants
const ONE_MINUTE = 60 * 1_000;
const TEN_MINUTES = ONE_MINUTE * 10;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages],
});

client.login(process.env.BOT_TOKEN);

const logger = new Logger({ service: 'auto-void' });

client.on('ready', async () => {
  logger.info('Connected to discord');

  // Delete messages
  await deleteMessages();
});

let guild: Guild | undefined;
let channels: TextChannel[];

const getChannels = async () => {
  if (channels) return channels;

  // Fetch the guild
  guild = client.guilds.cache.get('927461441051701280');

  // Fetch the channel
  channels = [
    await guild?.channels.fetch('1142291559388303520') as TextChannel,
    await guild?.channels.fetch('1142320223681253458') as TextChannel
  ];

  return channels;
};

const deleteMessages = async () => {
  try {
    logger.info('Deleting messages');

    // Get the channels
    const channels = await getChannels();

    // Fetch all messages
    const messages = await Promise.all(Array.from(channels).map(async channel => {
      const messages = await channel.messages.fetch({ limit: 100 });
      return Array.from(messages.values());
    })).then(_ => _.flat());

    // Create timestamp
    const ONE_DAY_AGO = Date.now() - ONE_DAY;

    // Filter to only messages in the last 24 hours
    const messagesToDelete = messages.filter(message => message.createdTimestamp < ONE_DAY_AGO);

    logger.info('Attempting to delete messages', { count: messagesToDelete.length });

    // Attempt to delete all the messages
    const results = await Promise.allSettled(messagesToDelete.map(async message => message.delete()));
    const deleted = results.filter(result => result.status === 'fulfilled');
    const failedToDelete = results.filter(result => result.status === 'rejected');

    // Log how many failed to delete
    if (failedToDelete.length) logger.info(`Failed to delete ${failedToDelete.length} messages.`);

    // Log how many were deleted
    logger.info(`Deleted ${deleted.length}/${messages.length} messages.`);
  } catch (error: unknown) {
    logger.error('Failed to delete messages', { error });
  } finally {
    setTimeout(deleteMessages, TEN_MINUTES);
  }
};

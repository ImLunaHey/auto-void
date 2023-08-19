import { Client, Guild, IntentsBitField, TextChannel } from 'discord.js';

// Time constants
const ONE_MINUTE = 60 * 1_000;
const TEN_MINUTES = ONE_MINUTE * 10;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages],
});

client.login(process.env.BOT_TOKEN);

client.on('ready', async () => {
  console.info('Connected to discord');

  // Delete messages
  await deleteMessages();
});

let guild: Guild | undefined;
let channel: TextChannel | undefined;

const getChannel = async () => {
  if (channel) return channel;

  // Fetch the guild
  guild = client.guilds.cache.get('927461441051701280');

  // Fetch the channel
  channel = await guild?.channels.fetch('1142291559388303520') as TextChannel;

  return channel;
};

const deleteMessages = async () => {
  try {
    console.info('Deleting messages');

    // Get the channel
    const channel = await getChannel();

    // Fetch all messages
    const messages = await channel.messages.fetch({ limit: 100 });

    // Create timestamp
    const ONE_DAY_AGO = Date.now() - ONE_DAY;

    // Filter to only messages in the last 24 hours
    const messagesToDelete = messages.filter(message => message.createdTimestamp < ONE_DAY_AGO);

    // Attempt to delete all the messages
    const results = await Promise.allSettled(messagesToDelete.map(async message => message.delete()));
    const deleted = results.filter(result => result.status === 'fulfilled');

    // Log how many were deleted/not deleted
    console.info(`Deleted ${deleted.length}/${results.length} messages.`);
  } catch (error: unknown) {
    console.error('Failed to delete messages', error);
  } finally {
    setTimeout(deleteMessages, TEN_MINUTES);
  }
};

const TelegramBot = require('node-telegram-bot-api');

// Telegram bot token directly here
const token = '7861502352:AAHnJW2xDIZ6DL1khVo1Hw4mXvNYG5pa4pM';

const bot = new TelegramBot(token, { polling: true });

const userState = {};

// Start and Help Commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Use /create to send a movie post.');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Commands:\n/start\n/help\n/create - Create a movie post step-by-step');
});

// /create Command
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'awaitingPoster' };
  bot.sendMessage(chatId, 'Please send the **poster image link** (direct URL to image).');
});

// Handle all messages step-by-step
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userState[chatId] || text.startsWith('/')) return;

  const state = userState[chatId];

  if (state.step === 'awaitingPoster') {
    state.poster = text;
    state.step = 'awaitingName';
    bot.sendMessage(chatId, 'Please send the **movie name**.');
  } else if (state.step === 'awaitingName') {
    state.name = text;
    state.step = 'awaitingLanguage';
    bot.sendMessage(chatId, 'Please send the **language**.');
  } else if (state.step === 'awaitingLanguage') {
    state.language = text;
    state.step = 'awaitingAudio';
    bot.sendMessage(chatId, 'Please send the **audio info**.');
  } else if (state.step === 'awaitingAudio') {
    state.audio = text;

    // Final Poster with Caption
    const caption = `*${state.name}*\n\n` +
                    `Language: ${state.language}\n` +
                    `Audio: ${state.audio}`;

    try {
      await bot.sendPhoto(chatId, state.poster, {
        caption,
        parse_mode: 'Markdown'
      });
    } catch (err) {
      bot.sendMessage(chatId, 'Poster upload failed! Check your image link.');
    }

    delete userState[chatId]; // Clear state
  }
});

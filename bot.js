const TelegramBot = require('node-telegram-bot-api');

// Add your token here
const token = '7861502352:AAHnJW2xDIZ6DL1khVo1Hw4mXvNYG5pa4pM';

const bot = new TelegramBot(token, { polling: true });

const userState = {};

// Start and Help
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Use /create to generate a movie post.');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Commands:\n/create - Step-by-step movie post creation');
});

// /create Command
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'awaitingPoster' };
  bot.sendMessage(chatId, 'Please send the **poster image link**.');
});

// Main message handler
bot.on('message', (msg) => {
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
    bot.sendMessage(chatId, 'Choose the **language**:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Hindi', callback_data: 'lang_Hindi' }, { text: 'English', callback_data: 'lang_English' }],
          [{ text: 'Telugu', callback_data: 'lang_Telugu' }, { text: 'Tamil', callback_data: 'lang_Tamil' }]
        ]
      }
    });
  }
});

// Callback Query handler for buttons
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const state = userState[chatId];

  if (!state) return;

  const data = query.data;

  if (data.startsWith('lang_')) {
    state.language = data.replace('lang_', '');
    state.step = 'awaitingQuality';

    bot.editMessageText(`Language selected: ${state.language}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    bot.sendMessage(chatId, 'Choose the **video quality**:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'WEB-DL', callback_data: 'quality_WEBDL' }, { text: 'HDRip', callback_data: 'quality_HDRip' }],
          [{ text: 'HDTS', callback_data: 'quality_HDTS' }]
        ]
      }
    });
  }

  else if (data.startsWith('quality_')) {
    state.quality = data.replace('quality_', '');

    bot.editMessageText(`Quality selected: ${state.quality}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    // Final message with poster and caption
    const caption = `*${state.name}*\n\nLanguage: ${state.language}\nQuality: ${state.quality}`;

    bot.sendPhoto(chatId, state.poster, {
      caption,
      parse_mode: 'Markdown'
    });

    delete userState[chatId];
  }
});

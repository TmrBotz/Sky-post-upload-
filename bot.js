const TelegramBot = require('node-telegram-bot-api');

// Add your bot token here
const token = '7861502352:AAHnJW2xDIZ6DL1khVo1Hw4mXvNYG5pa4pM';

// Add your channel username or ID (with @ or -100 prefix)
const CHANNEL_ID = '-1001991464977'; // Or '-1001234567890'

// List of allowed admin user IDs
const ADMINS = [6987799874]; // Replace with your Telegram user IDs

const bot = new TelegramBot(token, { polling: true });
const userState = {};

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Use /create to generate a movie post.');
});

// Help command
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Commands:\n/create - Step-by-step movie post creation');
});

// /create command (admin only)
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!ADMINS.includes(userId)) {
    return bot.sendMessage(chatId, 'Access Denied: You’re not authorized to use this command.');
  }

  userState[chatId] = { step: 'awaitingPoster' };
  bot.sendMessage(chatId, 'Please send the **poster image link**.');
});

// Handle messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!userState[chatId] || text.startsWith('/')) return;
  if (!ADMINS.includes(userId)) return;

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

// Handle button callbacks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  if (!ADMINS.includes(userId)) {
    return bot.answerCallbackQuery(query.id, { text: 'Access Denied', show_alert: true });
  }

  const state = userState[chatId];
  if (!state) return;

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
  } else if (data.startsWith('quality_')) {
    state.quality = data.replace('quality_', '');

    bot.editMessageText(`Quality selected: ${state.quality}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    const caption = `<b><a href="https://t.me/Sky_Hub4u">#ɴᴇᴡ_ғɪʟᴇ_ᴀᴅᴅᴇᴅ ✅</a></b>\n\n<b>🔰Nᴀᴍᴇ:</b> <code>${state.name}</code>\n<b>✨Aᴜᴅɪᴏ:</b> ${state.language}\n<b>♻️Qᴜᴀʟɪᴛʏ:</b> ${state.quality}`;

    // Send to user (admin)
    bot.sendPhoto(chatId, state.poster, {
      caption,
      parse_mode: 'Markdown'
    });

    // Send to channel
    bot.sendPhoto(CHANNEL_ID, state.poster, {
      caption,
      parse_mode: 'Markdown'
    });

    delete userState[chatId];
  }
});

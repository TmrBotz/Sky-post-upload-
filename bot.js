const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// === CONFIGURATION ===
const token = '7861502352:AAHnJW2xDIZ6DL1khVo1Hw4mXvNYG5pa4pM'; // Replace with your bot token
const CHANNEL_ID = '-1001991464977'; // Replace with your channel username (or use numeric ID)
const ADMINS = [6987799874]; // Replace with your Telegram user IDs

// === BOT SETUP ===
const bot = new TelegramBot(token, { polling: true });
const userState = {};

// === /CREATE COMMAND ===
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!ADMINS.includes(userId)) return bot.sendMessage(chatId, 'Access Denied.');

  userState[chatId] = {
    step: 'poster',
    buttons: []
  };
  bot.sendMessage(chatId, 'Send <b>poster image link</b>:', { parse_mode: 'HTML' });
});

// === USER MESSAGES HANDLER ===
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const state = userState[chatId];

  if (!state || text.startsWith('/')) return;
  if (!ADMINS.includes(userId)) return;

  switch (state.step) {
    case 'poster':
      state.poster = text;
      state.step = 'name';
      bot.sendMessage(chatId, 'Send <b>movie name</b>:', { parse_mode: 'HTML' });
      break;

    case 'name':
      state.name = text;
      state.step = 'language';
      bot.sendMessage(chatId, 'Choose <b>language</b>:', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Hindi', callback_data: 'lang_Hindi' }, { text: 'English', callback_data: 'lang_English' }],
            [{ text: 'Telugu', callback_data: 'lang_Telugu' }, { text: 'Tamil', callback_data: 'lang_Tamil' }]
          ]
        }
      });
      break;

    case 'button_text':
      state.currentButton = { text };
      state.step = 'button_link';
      bot.sendMessage(chatId, `Send link for <b>${text}</b> button:`, { parse_mode: 'HTML' });
      break;

    case 'button_link':
      state.currentButton.link = text;
      state.buttons.push(state.currentButton);
      state.currentButton = null;

      bot.sendMessage(chatId, 'Choose an option:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Add Another', callback_data: 'add_another_button' }],
            [{ text: '⏭️ Skip', callback_data: 'finish_post' }]
          ]
        }
      });
      break;
  }
});

// === CALLBACK QUERIES ===
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  const state = userState[chatId];

  if (!state || !ADMINS.includes(userId)) return;

  if (data.startsWith('lang_')) {
    state.language = data.replace('lang_', '');
    state.step = 'quality';
    bot.editMessageText(`Language: ${state.language}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    bot.sendMessage(chatId, 'Choose <b>quality</b>:', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'WEB-DL', callback_data: 'quality_WEBDL' }, { text: 'HDRip', callback_data: 'quality_HDRip' }],
          [{ text: 'HDTS', callback_data: 'quality_HDTS' }]
        ]
      }
    });

  } else if (data.startsWith('quality_')) {
    state.quality = data.replace('quality_', '');
    state.step = 'type';
    bot.editMessageText(`Quality: ${state.quality}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    bot.sendMessage(chatId, 'Select <b>type</b>:', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '#MOVIE', callback_data: 'type_MOVIE' }, { text: '#SERIES', callback_data: 'type_SERIES' }],
          [{ text: '#ADULT', callback_data: 'type_ADULT' }, { text: '#ANIMATION', callback_data: 'type_ANIMATION' }],
          [{ text: '#TV_SHOW', callback_data: 'type_TV_SHOW' }]
        ]
      }
    });

  } else if (data.startsWith('type_')) {
    state.type = `#${data.replace('type_', '')}`;
    state.step = 'button_text';
    bot.editMessageText(`Type: ${state.type}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    bot.sendMessage(chatId, 'Send download <b>button text</b> or click <i>Skip</i> to post without buttons.', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⏭️ Skip', callback_data: 'finish_post' }]
        ]
      }
    });

  } else if (data === 'add_another_button') {
    state.step = 'button_text';
    bot.sendMessage(chatId, 'Send next <b>button text</b>:', { parse_mode: 'HTML' });

  } else if (data === 'finish_post') {
    sendFinalPost(chatId);
  }

  bot.answerCallbackQuery(query.id);
});

// === FINAL POST FUNCTION ===
function sendFinalPost(chatId) {
  const state = userState[chatId];
  if (!state) return;

  const caption = `<b>${state.name}</b>\n\nLanguage: <i>${state.language}</i>\nQuality: <u>${state.quality}</u>\n${state.type}`;

  const inlineKeyboard = state.buttons.length
    ? state.buttons.map(btn => [{ text: btn.text, url: btn.link }])
    : undefined;

  // Send to user
  bot.sendPhoto(chatId, state.poster, {
    caption,
    parse_mode: 'HTML',
    reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined
  });

  // Send to channel
  bot.sendPhoto(CHANNEL_ID, state.poster, {
    caption,
    parse_mode: 'HTML',
    reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined
  });

  delete userState[chatId];
}

// === DUMMY SERVER TO FIX PORT ISSUE ===
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

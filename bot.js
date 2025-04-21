const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// === CONFIGURATION ===
const token = '7547800997:AAGjBsVNm1BldEMDVQpZcz5bTrellDNUuQY'; // Replace with your bot token
const CHANNEL_ID = '-1002116377056'; // Replace with your channel ID
const ADMINS = [6987799874]; // Replace with admin Telegram user IDs

// === BOT SETUP ===
const bot = new TelegramBot(token, { polling: true });
const userState = {};

// === /start ===
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `<b>🖐️ Welcome ${msg.from.first_name} \n\nThis Is A SkyHub4u Official Movie Notification Post Creater.</b>`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Sky Hub4u", url: `https://t.me/Sky_Hub4u` },
          { text: "Admin", url: `https://t.me/Tmr_Developer` }
        ]
      ]
    }
  });
});

// === /CREATE COMMAND ===
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!ADMINS.includes(userId)) return bot.sendMessage(chatId, 'Access Denied.');

  userState[chatId] = {
    step: 'poster'
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
            [{ text: 'Hindi', callback_data: 'lang_Hindi' }, { text: 'Dual Audio', callback_data: 'lang_Dual Audio' }, { text: 'English', callback_data: 'lang_English' }],
            [{ text: 'Telugu', callback_data: 'lang_Telugu' }, { text: 'Hindi+Telugu', callback_data: 'lang_Hindi+Telugu' }, { text: 'Tamil', callback_data: 'lang_Tamil' }],
            [{ text: 'Bhojpuri', callback_data: 'lang_Bhojpuri' }, { text: 'Hindi+Tamil', callback_data: 'lang_Hindi+Tamil' }, { text: 'Gujarati', callback_data: 'lang_Gujarati' }],
            [{ text: 'Hindi+English', callback_data: 'lang_Hindi+English' }, { text: 'Malayalam', callback_data: 'lang_Malayalam' }, { text: 'Punjabi', callback_data: 'lang_Punjabi' }],
            [{ text: 'Bengali', callback_data: 'lang_Bengali' }, { text: 'Marathi', callback_data: 'lang_Marathi' }]
          ]
        }
      });
      break;

    case 'download_1080p':
      state.link1080p = text;
      state.step = 'download_720p';
      bot.sendMessage(chatId, 'Send 720p download link:');
      break;

    case 'download_720p':
      state.link720p = text;
      state.step = 'download_480p';
      bot.sendMessage(chatId, 'Send 480p download link:');
      break;

    case 'download_480p':
      state.link480p = text;
      sendFinalPost(chatId);
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
          [{ text: 'WEB-DL', callback_data: 'quality_WEB-DL' }, { text: 'PRE-HD', callback_data: 'quality_PRE-HD' }, { text: 'HDRip', callback_data: 'quality_HDRip' }],
          [{ text: 'HDTS', callback_data: 'quality_HDTS' }, { text: 'HDTC', callback_data: 'quality_HDTC' }, { text: 'All Quality', callback_data: 'quality_1080p, 720p, 480p' }],
          [{ text: 'BluRay', callback_data: 'quality_BluRay' }, { text: 'WebRip', callback_data: 'quality_WebRip' }, { text: 'CAMRip', callback_data: 'quality_CAMRip' }]
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
          [{ text: '#TV_SHOW', callback_data: 'type_TV_SHOW' }, { text: '#ANIME', callback_data: 'type_ANIME' }]
        ]
      }
    });

  } else if (data.startsWith('type_')) {
    state.type = `#${data.replace('type_', '')}`;
    bot.editMessageText(`Type: ${state.type}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    state.step = 'download_1080p';
    bot.sendMessage(chatId, 'Send 1080p download link:');
  }

  bot.answerCallbackQuery(query.id);
});

// === FINAL POST FUNCTION ===
function sendFinalPost(chatId) {
  const state = userState[chatId];
  if (!state) return;

  const caption = `<b><a href="https://t.me/Sky_hub4u">#ɴᴇᴡ_ғɪʟᴇ_ᴀᴅᴅᴇᴅ ✅</a>\n\n🔰Nᴀᴍᴇ:</b> <code>${state.name}</code> ⿻   |\n<b>✨Aᴜᴅɪᴏ: ${state.language}\n♻️Qᴜᴀʟɪᴛʏ: ${state.quality}</b>\n<b><a href="https://t.me/Sky_hub4u">${state.type}</a></b>\n\n<b>♡ ㅤ   ❍ㅤ     ⎙      ⌲
ˡᶦᵏᵉ  ᶜᵒᵐᵐᵉⁿᵗ  ˢᵃᵛᵉ   ˢʰᵃʳᵉ</b>`;

  const fixedButton = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "1080p", url: state.link1080p },
          { text: "720p", url: state.link720p },
          { text: "480p", url: state.link480p }
        ],
        [
          { text: "🔰 𝗠𝗼𝘃𝗶𝗲 𝗦𝗲𝗮𝗿𝗰𝗵 𝗚𝗿𝗼𝘂𝗽 🔰", url: "https://t.me/Sky_Movie_req4u" }
        ]
      ]
    },
    parse_mode: 'HTML',
    caption
  };

  bot.sendPhoto(chatId, state.poster, fixedButton);
  bot.sendPhoto(CHANNEL_ID, state.poster, fixedButton);

  delete userState[chatId];
}

// === DUMMY SERVER TO KEEP BOT ALIVE ===
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

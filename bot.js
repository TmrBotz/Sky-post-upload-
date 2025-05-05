const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios'); // For fetching TMDb API
const app = express();

// === CONFIGURATION ===
const token = '7591645551:AAHYPYrU4ah5HVdgIJGYUrLxRHjY62R84CY'; // Replace with your bot token
const CHANNEL_ID = '-1002116377056'; // Replace with your channel ID
const ADMINS = [6987799874]; // Replace with admin Telegram user IDs
const TMDB_API_KEY = '4b6e108d2d340e1c4da27a739feaf820'; // Replace with your TMDb API Key

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
    step: 'name'
  };
  bot.sendMessage(chatId, 'Send <b>movie name</b>:', { parse_mode: 'HTML' });
});

// === USER MESSAGES HANDLER ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const state = userState[chatId];

  if (!state || text.startsWith('/')) return;
  if (!ADMINS.includes(userId)) return;

  switch (state.step) {
    case 'name':
      state.name = text;
      state.step = 'searchMovie';
      const movieResults = await searchMovie(state.name);
      if (movieResults.length > 0) {
        state.movieId = movieResults[0].id;  // Choose the first result for simplicity
        state.step = 'posterStyle';
        bot.sendMessage(chatId, 'Choose <b>poster style</b> (Portrait or Landscape):', {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Portrait', callback_data: 'poster_Portrait' }, { text: 'Landscape', callback_data: 'poster_Landscape' }]
            ]
          }
        });
      } else {
        bot.sendMessage(chatId, 'No movie found with that name. Please try again.');
      }
      break;
  }
});

// === SEARCH MOVIE ON TMDB ===
async function searchMovie(movieName) {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${movieName}`);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching movie:', error);
    return [];
  }
}

// === CALLBACK QUERIES ===
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  const state = userState[chatId];

  if (!state || !ADMINS.includes(userId)) return;

  if (data.startsWith('poster_')) {
    const posterStyle = data.replace('poster_', '');
    state.posterStyle = posterStyle;
    const posterUrl = await getMoviePoster(state.movieId, posterStyle);
    state.poster = posterUrl;
    bot.editMessageText(`Poster Style: ${posterStyle}`, {
      chat_id: chatId,
      message_id: query.message.message_id
    });

    bot.sendMessage(chatId, 'Choose <b>language</b>:', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Hindi', callback_data: 'lang_Hindi' }, { text: 'Dual Audio', callback_data: 'lang_Dual Audio' }, { text: 'English', callback_data: 'lang_English' }],
          // Add other languages here
        ]
      }
    });
  }

  bot.answerCallbackQuery(query.id);
});

// === GET MOVIE POSTER FROM TMDB ===
async function getMoviePoster(movieId, posterStyle) {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const posterPath = posterStyle === 'Landscape' ? response.data.poster_path : response.data.backdrop_path;
    return `https://image.tmdb.org/t/p/w500${posterPath}`; // Fetch poster URL
  } catch (error) {
    console.error('Error fetching poster:', error);
    return '';
  }
}

// === FINAL POST FUNCTION ===
function sendFinalPost(chatId) {
  const state = userState[chatId];
  if (!state) return;

  const caption = `<b><a href="https://t.me/Sky_hub4u">#ɴᴇᴡ_ғɪʟᴇ_ᴀᴅᴅᴇᴅ ✅</a>\n\n🔰Nᴀᴍᴇ:</b> <code>${state.name}</code> ⿻   |\n<b>✨Aᴜᴅɪᴏ: ${state.language}\n♻️Qᴜᴀʟɪᴛʏ: ${state.quality}</b>\n<b><a href="https://t.me/Sky_hub4u">${state.type}</a></b>\n\n<b>♡ ㅤ   ❍ㅤ     ⎙      ⌲
ˡᶦᵏᵉ  ᶜᵒᵐᵐᵉⁿᵗ  ˢᵃᵛᵉ   ˢʰᵃʳᵉ</b>`;

  const fixedButton = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔰 𝗠𝗼𝘃𝗶𝗲 𝗦𝗲𝗮𝗿𝗰𝗵 𝗚𝗿𝗼𝘂𝗽 🔰", url: "https://t.me/Sky_Movie_req4u" }]
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

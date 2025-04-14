const TelegramBot = require('node-telegram-bot-api');

// Yahan apna token directly paste karo
const token = '7861502352:AAHnJW2xDIZ6DL1khVo1Hw4mXvNYG5pa4pM';

// Bot setup with polling
const bot = new TelegramBot(token, { polling: true });

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Main aapka Telegram bot hoon.');
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Commands:\n/start - Bot start kare\n/help - Help message');
});

// Reply to any other message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!msg.text.startsWith('/')) {
    bot.sendMessage(chatId, `Aapne ye likha: ${msg.text}`);
  }
});

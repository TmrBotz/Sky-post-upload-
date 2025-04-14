const TelegramBot = require('node-telegram-bot-api');

// Replace this with your bot token from @BotFather
const token = '7861502352:AAHnJW2xDIZ6DL1khVo1Hw4mXvNYG5pa4pM';

// Create a bot using polling
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Main aapka Telegram bot hoon.');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Commands:\n/start - Bot start kare\n/help - Help message');
});

// Reply to any other message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!msg.text.startsWith('/')) {
    bot.sendMessage(chatId, `Aapne ye message bheja: ${msg.text}`);
  }
});

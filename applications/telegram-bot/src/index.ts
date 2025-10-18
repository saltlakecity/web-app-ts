import { Bot, InlineKeyboard } from 'grammy';
import { config } from 'dotenv';

config();

const bot = new Bot(process.env.BOT_TOKEN!);

// Команда /start
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('Открыть Mini App', process.env.MINI_APP_URL!);
  
  await ctx.reply(
    '👋 Добро пожаловать в Student Council Bot!\n\n' +
    'Нажмите на кнопку ниже, чтобы открыть Mini App и заполнить формы:',
    { reply_markup: keyboard }
  );
});

// Команда /help
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📋 Доступные команды:\n\n' +
    '/start - Запустить бота и открыть Mini App\n' +
    '/help - Показать эту справку\n\n' +
    '🤖 Этот бот поможет вам заполнять формы студенческого совета через удобный интерфейс Mini App.'
  );
});

// Обработка неизвестных команд
bot.on('message', async (ctx) => {
  if (ctx.message.text && !ctx.message.text.startsWith('/')) {
    await ctx.reply(
      '🤔 Не понимаю эту команду. Используйте /help для получения справки.'
    );
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error('❌ Ошибка в боте:', err);
});

// Запуск бота в polling режиме
async function startBot() {
  try {
    console.log('🚀 Запуск Telegram бота...');
    
    // Запускаем polling
    await bot.start();
    console.log('🤖 Telegram Bot запущен в polling режиме');
    console.log(`📱 Mini App URL: ${process.env.MINI_APP_URL}`);
    
    // Обработка graceful shutdown
    process.once('SIGINT', () => bot.stop());
    process.once('SIGTERM', () => bot.stop());
    
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  }
}

// Запуск бота
startBot();

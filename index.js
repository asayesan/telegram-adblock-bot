const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = '5962067743:AAEqcpXrZ2YJnSYd0dHC_MQzbtUst3tUdTg';
const bot = new TelegramBot(token, {polling: true});

const wordDir = './word/';

const groups = {};

// dosyaları okuyup, groups değişkenine yükle
fs.readdir(wordDir, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }
  files.forEach((file) => {
    const groupId = file.replace('.txt', '');
    const filePath = wordDir + file;
    const words = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    groups[groupId] = words;
  });
});

// yeni bir yasaklı kelime ekle
bot.onText(/\/addword (.+)/, (msg, match) => {
  const groupId = msg.chat.id.toString();
  const word = match[1];
  if (!groups[groupId]) {
    groups[groupId] = [];
  }
  groups[groupId].push(word);
  fs.appendFile(wordDir + groupId + '.txt', word + '\n', (err) => {
    if (err) {
      console.error(err);
      return;
    }
    bot.sendMessage(groupId, `${word} kelimesi yasaklı kelimeler listesine eklendi!`);
  });
});

// yasaklı kelimeyi kaldır
bot.onText(/\/removeword (.+)/, (msg, match) => {
  const groupId = msg.chat.id.toString();
  const word = match[1];
  if (!groups[groupId]) {
    bot.sendMessage(groupId, `Henüz yasaklı kelime yok.`);
    return;
  }
  const index = groups[groupId].indexOf(word);
  if (index > -1) {
    groups[groupId].splice(index, 1);
    fs.writeFile(wordDir + groupId + '.txt', groups[groupId].join('\n') + '\n', (err) => {
      if (err) {
        console.error(err);
        return;
      }
      bot.sendMessage(groupId, `${word} kelimesi yasaklı kelimeler listesinden kaldırıldı!`);
    });
  } else {
    bot.sendMessage(groupId, `${word} kelimesi yasaklı kelimeler listesinde bulunamadı!`);
  }
});

// yasaklı kelimeleri kontrol et
bot.on('message', (msg) => {
  const chatId = msg.chat.id.toString();
  const words = groups[chatId];
  if (!words) {
    return;
  }
  const text = msg.text || msg.caption || '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (text.includes(word)) {
      bot.deleteMessage(chatId, msg.message_id);
      break;
    }
  }
});

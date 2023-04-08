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

bot.on('message', (msg) => {
  if (msg.chat.type === 'private' && msg.text === '/start') {
    bot.sendMessage(msg.chat.id, '<b>Merhaba @' + msg.from.username + ', ben özelleştirilmiş bir reklam engelleme botuyum. Gruplardaki belirlenen reklamları engellerim. Daha fazla detay için /info komutunu kullanabilirsin.</b>\n\n<i>Sürüm: Beta 2 --- Sahip: @Asyacuk --- Kanal: @Asyacukproject</i>', { parse_mode: 'HTML' });
  }
});


// Özel mesajda info mesajı gönder
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  const message = `
  <b>Telegram Adblock Bot</b>
  <i>Sürüm: Beta 0.2</i>
  <i>Beta sürümü olduğu için '*' ile belirtilen özellikler yakında eklenecek.</i>

  Bu bot ile gruplardaki belirlemiş olduğunuz reklamları engelleyebilirsiniz. (Eğer grup yöneticisi iseniz)

  Komutlar:
  /blockword (kelime/link) yasaklamak istediğiniz kelime/link giriniz.
  /unblockword (kelime/link) daha önce yasaklanan kelime/link' in yasağını kaldırır.
  */list Yasaklanmış kelimeleri listeler.
  */stats Yasaklanan kelimelerin istatistiğini görmenizi sağlar.
  */standartmode Standart reklam engelleme modunu etkinleştirir.
  */custommode Özelleştrilmiş reklam engelleme modu. Kendinize göre özelleştiriniz. (Standart modu iptal eder)
  /info Bot hakkında bilgi verir.

  `;
  bot.sendMessage(chatId, message, { parse_mode: "html" });
});


// yeni bir yasaklı kelime ekle
bot.onText(/\/blockword (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  bot.getChatMember(chatId, userId).then((chatMember) => {
    if (chatMember.status === "creator" || chatMember.status === "administrator") {
      const groupId = chatId.toString();
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
        bot.sendMessage(groupId, `${word} yasaklı kelimeler listesine eklendi.`);
      });
    } else {
      bot.sendMessage(chatId, "Bu komutu kullanmak için grup yöneticisi olmalısınız.");
    }
  });
});


// yasaklı kelimeyi kaldır
bot.onText(/\/unblockword (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  bot.getChatMember(chatId, userId).then((chatMember) => {
    if (chatMember.status === "creator" || chatMember.status === "administrator") {
      const groupId = chatId.toString();
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
          bot.sendMessage(groupId, `${word} yasaklı kelimeler listesinden kaldırıldı!`);
        });
      } else {
        bot.sendMessage(groupId, `${word} yasaklı kelimeler listesinde bulunamadı!`);
      }
    } else {
      bot.sendMessage(chatId, "Bu komutu kullanmak için grup yöneticisi olmalısınız.");
    }
  });
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
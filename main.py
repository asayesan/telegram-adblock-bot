import telegram
from telegram.ext import CommandHandler, MessageHandler, Filters, Updater

# Engellenen URL'leri saklamak için bir liste tanımlayın
engellenen_url_listesi = []

def engelle(bot, update):
    # Sadece grup yöneticileri "/engelle" komutunu kullanabilir
    if update.message.from_user.id in [admin.user.id for admin in bot.get_chat_administrators(update.message.chat_id)]:
        # Komutta belirtilen URL'yi engelleme listesine ekleyin
        engellenen_url_listesi.append(update.message.text.split(" ")[1])
        bot.send_message(chat_id=update.message.chat_id, text="{} engellendi.".format(update.message.text.split(" ")[1]))
    else:
        bot.send_message(chat_id=update.message.chat_id, text="Bu komutu kullanabilmek için grup yöneticisi olmalısınız.")

def mesaj_filtresi(bot, update):
    # Mesajda engellenen URL'lerden herhangi biri varsa, mesajı silin
    for engellenen_url in engellenen_url_listesi:
        if engellenen_url in update.message.text:
            bot.delete_message(chat_id=update.message.chat_id, message_id=update.message.message_id)

updater = Updater("5962067743:AAEqcpXrZ2YJnSYd0dHC_MQzbtUst3tUdTg")
updater.dispatcher.add_handler(CommandHandler("engelle", engelle))
updater.dispatcher.add_handler(MessageHandler(Filters.text, mesaj_filtresi))
updater.start_polling()

// ШАГ 5: Telegram бот — уведомление о заказах > 50,000 ₸
// Запуск: node bot.js
// Деплой: Railway / Render / любой сервер с node

import TelegramBot from "node-telegram-bot-api";
import express from "express";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // твой Telegram ID или ID группы
const CRM_KEY = process.env.CRM_KEY;
const THRESHOLD = 50000; // ₸

const bot = new TelegramBot(BOT_TOKEN);
const app = express();
app.use(express.json());

// Эмодзи по UTM-источнику
const utmEmoji = {
  instagram: "📸",
  tiktok: "🎵",
  google: "🔍",
  direct: "🔗",
  referral: "👥",
};

// Форматирование суммы
const fmt = (n) =>
  new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(n);

// RetailCRM шлёт POST на этот вебхук при каждом новом/изменённом заказе
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // отвечаем быстро чтобы CRM не зависал

  try {
    const clientId = req.body.clientId;
    const orderData = req.body.order;

    if (!orderData) return;

    // Получить полные данные заказа из API
    const params = new URLSearchParams({ apiKey: CRM_KEY });
    const r = await fetch(
      `${process.env.CRM_URL}/api/v5/orders/${orderData.id}?${params}`
    );
    const { order } = await r.json();

    const total = (order.items || []).reduce(
      (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1),
      0
    );

    if (total < THRESHOLD) return; // не наш случай

    const utm = order.customFields?.utm_source || "unknown";
    const emoji = utmEmoji[utm] || "📦";
    const city = order.delivery?.address?.city || "—";
    const products = (order.items || [])
      .map((i) => `  • ${i.productName} × ${i.quantity}`)
      .join("\n");

    const text = `
🔥 <b>Крупный заказ!</b>

👤 <b>${order.firstName} ${order.lastName}</b>
📍 ${city}
${emoji} Источник: <b>${utm}</b>

${products}

💰 <b>Сумма: ${fmt(total)}</b>
🆔 Заказ #${order.number}
    `.trim();

    await bot.sendMessage(CHAT_ID, text, { parse_mode: "HTML" });
  } catch (e) {
    console.error("Webhook error:", e);
  }
});

app.get("/", (_, res) => res.send("GBC Bot is running ✅"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Bot server on :${PORT}`));

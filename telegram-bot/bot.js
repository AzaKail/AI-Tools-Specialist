// Telegram бот с polling — проверяет новые заказы каждые 30 секунд
import TelegramBot from "node-telegram-bot-api";
import express from "express";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CRM_URL = process.env.CRM_URL;
const CRM_KEY = process.env.CRM_KEY;
const THRESHOLD = 50000;
const INTERVAL = 30000; // 30 секунд

const bot = new TelegramBot(BOT_TOKEN);
const app = express();

const utmEmoji = {
  instagram: "📸", tiktok: "🎵", google: "🔍", direct: "🔗", referral: "👥",
};

const fmt = (n) =>
  new Intl.NumberFormat("ru-KZ", {
    style: "currency", currency: "KZT", maximumFractionDigits: 0,
  }).format(n);

// Храним ID уже отправленных уведомлений чтобы не дублировать
const notified = new Set();

async function checkOrders() {
  try {
    const params = new URLSearchParams({ apiKey: CRM_KEY, limit: 50, page: 1 });
    const res = await fetch(`${CRM_URL}/api/v5/orders?${params}`);
    const data = await res.json();

    if (!data.success) return;

    for (const order of data.orders) {
      const total = (order.items || []).reduce(
        (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1), 0
      );

      if (total < THRESHOLD) continue;
      if (notified.has(order.id)) continue;

      notified.add(order.id);

      const utm = order.customFields?.utm_source || "direct";
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
      console.log(`Отправлено уведомление: заказ #${order.number}, ${fmt(total)}`);
    }
  } catch (e) {
    console.error("Ошибка polling:", e.message);
  }
}

// Запускаем polling
checkOrders(); // сразу при старте
setInterval(checkOrders, INTERVAL);
console.log(`Polling запущен, проверка каждые ${INTERVAL / 1000}с`);

// Health check
app.get("/", (_, res) => res.send("GBC Bot is running ✅"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Bot server on :${PORT}`));

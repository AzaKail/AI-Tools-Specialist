import fetch from "node-fetch";
import { createRequire } from "module";
import { config } from "dotenv";

config({ path: "../.env" });

const require = createRequire(import.meta.url);
const orders = require("./mock_orders.json");

const CRM_URL = process.env.CRM_URL;
const CRM_KEY = process.env.CRM_KEY;

async function createOrder(order) {
  // Убираем поля которых нет в демо-CRM
  const { orderType, orderMethod, ...cleanOrder } = order;

  const body = new URLSearchParams({
    apiKey: CRM_KEY,
    order: JSON.stringify(cleanOrder),
    site: "main",
  });

  const res = await fetch(`${CRM_URL}/api/v5/orders/create`, {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.id;
}

async function main() {
  console.log(`Загружаю ${orders.length} заказов...`);
  let ok = 0;
  let fail = 0;

  for (const [i, order] of orders.entries()) {
    try {
      const id = await createOrder(order);
      console.log(`[${i + 1}/${orders.length}] ✅ Создан заказ #${id}`);
      ok++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`[${i + 1}/${orders.length}] ❌ Ошибка:`, e.message);
      fail++;
    }
  }

  console.log(`\nГотово: ${ok} создано, ${fail} ошибок`);
}

main();
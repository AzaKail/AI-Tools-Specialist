// ШАГ 2: Загрузка заказов в RetailCRM
// Запуск: node 1_upload_to_retailcrm.js

import fetch from "node-fetch";
import orders from "./mock_orders.json" assert { type: "json" };

const CRM_URL = process.env.CRM_URL; // https://yourdomain.retailcrm.ru
const CRM_KEY = process.env.CRM_KEY; // API-ключ из RetailCRM

async function createOrder(order) {
  const body = new URLSearchParams({
    apiKey: CRM_KEY,
    order: JSON.stringify(order),
    site: "main", // slug вашего сайта в RetailCRM
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
      // Пауза чтобы не словить rate limit
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`[${i + 1}/${orders.length}] ❌ Ошибка:`, e.message);
      fail++;
    }
  }

  console.log(`\nГотово: ${ok} создано, ${fail} ошибок`);
}

main();

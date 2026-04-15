// ШАГ 3: Синхронизация RetailCRM → Supabase
// Запуск: node 2_sync_to_supabase.js

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const CRM_URL = process.env.CRM_URL;
const CRM_KEY = process.env.CRM_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // service_role ключ

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Получить все заказы из RetailCRM (с пагинацией)
async function fetchAllOrders() {
  const all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const params = new URLSearchParams({
      apiKey: CRM_KEY,
      limit: 100,
      page,
    });

    const res = await fetch(
      `${CRM_URL}/api/v5/orders?${params.toString()}`
    );
    const data = await res.json();

    if (!data.success) throw new Error(JSON.stringify(data.errors));

    all.push(...data.orders);
    totalPages = data.pagination.totalPageCount;
    console.log(`Страница ${page}/${totalPages}, получено ${data.orders.length} заказов`);
    page++;

    await new Promise((r) => setTimeout(r, 300));
  }

  return all;
}

// Преобразовать заказ CRM → строка для Supabase
function transformOrder(o) {
  const total = (o.items || []).reduce(
    (sum, item) => sum + (item.initialPrice || 0) * (item.quantity || 1),
    0
  );

  return {
    crm_id: o.id,
    number: o.number,
    status: o.status,
    first_name: o.firstName,
    last_name: o.lastName,
    phone: o.phone,
    email: o.email,
    city: o.delivery?.address?.city || null,
    utm_source: o.customFields?.utm_source || null,
    total_price: total,
    items_count: (o.items || []).length,
    items_json: JSON.stringify(o.items || []),
    created_at: o.createdAt || new Date().toISOString(),
  };
}

async function main() {
  console.log("Получаю заказы из RetailCRM...");
  const orders = await fetchAllOrders();
  console.log(`Всего заказов: ${orders.length}`);

  const rows = orders.map(transformOrder);

  // Upsert — если заказ уже есть, обновит; если нет — создаст
  const { error } = await supabase
    .from("orders")
    .upsert(rows, { onConflict: "crm_id" });

  if (error) {
    console.error("Ошибка Supabase:", error);
    process.exit(1);
  }

  console.log(`✅ Синхронизировано ${rows.length} заказов в Supabase`);
}

main();

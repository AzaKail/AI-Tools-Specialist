# GBC Analytics Dashboard — AI Tools Specialist Task

## Результат

| Компонент | Ссылка |
|---|---|
| 📊 Дашборд | https://gbc-dashboard-flax.vercel.app/ |
| 🤖 Telegram бот | https://ai-tools-specialist-production.up.railway.app/ |
| 💻 GitHub | https://github.com/AzaKail/AI-Tools-Specialist |

---

## Стек

- **RetailCRM** — источник заказов
- **Supabase** — база данных (PostgreSQL)
- **Vercel** — хостинг дашборда
- **Railway** — хостинг Telegram бота
- **Node.js** — скрипты синхронизации
- **Claude (claude.ai)** — AI-ассистент для генерации кода

---

## Как использовал Claude

Работал с Claude через браузер (claude.ai) — описывал задачу, получал код, адаптировал под свой стек и запускал. Ниже реальные промпты которые давал.

---

## Промпты

### 1. Анализ задания и планирование

**Промпт:**
> Вот архив с тестовым заданием на AI Tools Specialist. Разбери что внутри, проанализируй данные и предложи архитектуру решения с конкретным стеком.

**Что получил:** Claude разобрал `mock_orders.json` (50 заказов, города, UTM-источники, суммы), предложил стек RetailCRM → Supabase → Vercel + Telegram бот на Railway, расписал что нужно сделать по шагам.

---

### 2. Генерация всего проекта

**Промпт:**
> Сгенерируй полный проект: скрипт загрузки заказов в RetailCRM через API, синхронизацию RetailCRM → Supabase, аналитический дашборд с графиками по UTM/городам/суммам, и Telegram бот с уведомлениями о заказах свыше 50 000 ₸. Распиши пошагово что делать.

**Что получил:** Готовую структуру проекта с 5 файлами, SQL схемой для Supabase, подробным README с командами.

---

### 3. Получение реальных типов заказов из CRM

**Промпт:**
> Скрипт падает с ошибкой — orderType "eshop-individual" не существует в моём аккаунте RetailCRM. Как получить список реальных типов через API?

**Что получил:** Однострочник для терминала который дёрнул `/api/v5/reference/order-types` и вернул реальные коды.

---

### 4. Замена вебхуков на polling

**Промпт:**
> В демо-версии RetailCRM вебхуки недоступны — платная функция. Перепиши бота так чтобы он сам опрашивал CRM каждые 30 секунд и слал уведомления о новых крупных заказах.

**Что получил:** Переработанный `bot.js` с polling, дедупликацией через Set чтобы не слать одно уведомление дважды.

---

## Где застрял и как решил

### Проблема 1 — Node.js v24 ломает импорт JSON
**Ошибка:**
```
SyntaxError: Unexpected identifier 'assert'
```
**Причина:** Синтаксис `import x from './file.json' assert { type: 'json' }` убрали в Node 24.

**Решение:** Заменил на `createRequire` из модуля `module`:
```js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const orders = require("./mock_orders.json");
```

---

### Проблема 2 — `.env` не читается скриптом
**Ошибка:**
```
Error: supabaseUrl is required.
```
**Причина:** `dotenv` искал `.env` не там, путь был неверный.

**Решение:** Использовал встроенную функцию Node 24 — `--env-file` флаг:
```bash
node --env-file=../.env 2_sync_to_supabase.js
```

---

### Проблема 3 — orderType не существует в демо-CRM
**Ошибка:**
```
"OrderType" with "code"="eshop-individual" does not exist.
```
**Причина:** В демо-аккаунте RetailCRM только один тип заказа — `main`, а в `mock_orders.json` прописан `eshop-individual`.

**Решение:** Запросил реальные типы через API, убрал поля `orderType` и `orderMethod` из объекта перед отправкой:
```js
const { orderType, orderMethod, ...cleanOrder } = order;
```

---

### Проблема 4 — Railway деплоит весь репо вместо папки бота
**Ошибка:**
```
Railpack could not determine how to build the app.
```
**Причина:** Railway взял корень репозитория где нет `package.json`, вместо папки `telegram-bot`.

**Решение:** В Railway Settings → Root Directory → поставил `telegram-bot`.

---

### Проблема 5 — Вебхуки недоступны в демо RetailCRM
**Ситуация:** Настроил вебхук через Триггеры в RetailCRM, но уведомления не приходили. Оказалось — вебхуки это платная функция, в демо недоступна.

**Решение:** Переписал бота на polling — каждые 30 секунд сам запрашивает новые заказы из CRM и проверяет сумму.

---

## Итог

Полный пайплайн работает:
1. `mock_orders.json` → RetailCRM (через API скрипт)
2. RetailCRM → Supabase (синхронизация через API)
3. Supabase → Дашборд (realtime через Supabase JS)
4. RetailCRM → Telegram бот (polling каждые 30 сек, уведомления о заказах > 50 000 ₸)

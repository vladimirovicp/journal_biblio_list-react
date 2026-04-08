# Что происходит после выбора «Выберите Выпуск»

## 1. Изменение значения в селекте
- Пользователь выбирает выпуск в компоненте `IssueSelector`.
- В `onChange` передаётся `nid` выбранного выпуска.
- В `HomePage` обновляется локальный `selection`:
  - `scopeKey = "{selectedEnvironment}:{selectedBaseUrl}"`
  - `nid = выбранный nid`

## 2. Проверка актуальности выбора
- `selectedIssue` вычисляется только если `selection.scopeKey === scopeKey`.
- Если окружение или base URL сменились, старый выбор автоматически становится пустым.
- `activeSelectedIssue` дополнительно проверяет, что такой `nid` реально есть в загруженном списке `issues`.

## 3. Определение URI выбранного выпуска
- По `activeSelectedIssue` находится объект выпуска в `issues`.
- Из него берётся `selectedIssueUri`.

## 4. Запуск загрузки статей
- Хук `useJournalArticles` реагирует на изменения:
  - `selectedEnvironment`
  - `selectedBaseUrl`
  - `selectedIssueNid` (`activeSelectedIssue`)
  - `selectedIssueUri`
- Если `selectedIssueNid` пустой, статьи сбрасываются и запрос не выполняется.

## 5. API-запрос
- Вызывается `fetchJournalArticles(...)`.
- Формируется endpoint вида:
  - `/api/node.json?parameters[type]=journalarticle`
  - в dev через прокси-префикс (`/__proxy/...`).
- Выполняется запрос `requestJson` с `AbortController.signal`.

## 6. Фильтрация и нормализация статей
- Ответ проходит через `extractArticles(...)`.
- Для каждой статьи извлекаются ключевые поля (`id`, `title`, `journalLink`).
- Остаются только статьи, у которых `journalLink` совпадает с:
  - `selectedIssueNid`, или
  - `selectedIssueUri`.
- Дубликаты по `id` удаляются.

## 7. Состояния UI во время загрузки
- До ответа:
  - `isLoadingArticles = true`
  - показывается текст «Загрузка статей...»
- При успехе:
  - `articles` заполняется
  - `hasLoadedArticles = true`
  - `isLoadingArticles = false`
- При ошибке:
  - `articles = []`
  - `articlesError = "Не удалось загрузить список статей."`
  - `hasLoadedArticles = true`

## 8. Что видит пользователь
- Пока идёт запрос — индикатор загрузки.
- Если ошибка — сообщение об ошибке.
- Если статей нет — «Нет статей для выбранного выпуска».
- Если статьи есть — компонент `JournalArticles` выводит список заголовков.

## 9. Защита от гонок запросов
- При повторном выборе выпуска или размонтировании компонента предыдущий запрос отменяется через `abortController.abort()`.
- Это предотвращает запись устаревшего ответа в state.

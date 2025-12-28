# MemeOps Terminal

Десктоп-утилита для управления мем-токенами на BNB Chain (Four.meme).

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

## Сборка

```bash
npm run build
```

## Структура проекта

- `src/main/` - Electron main процесс
- `src/preload/` - Preload скрипты для IPC
- `src/renderer/` - React приложение
- `core/` - Бизнес-логика (vault, web3, storage, domain)

## Конфигурация

Настройки контрактов и RPC находятся в `core/config/default.json`.

**ВАЖНО**: Для работы с Four.meme необходимо добавить:
1. Адрес контракта Four.meme в `contracts.fourMeme.address`
2. ABI контракта Four.meme в `contracts.fourMeme.abi`

ABI можно получить из Four.meme GitBook "Protocol Integration".

## Безопасность

- Приватные ключи хранятся только в зашифрованном виде (AES-256-GCM)
- Пароль vault не сохраняется
- Все операции требуют разблокировки vault


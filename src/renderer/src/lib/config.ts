// Конфигурация для renderer процесса
// Основной конфиг находится в core/config/default.json
// Этот файл - копия для использования в браузере

export const config = {
  chain: {
    id: 56,
    name: 'BNB Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/'
  },
  contracts: {
    fourMeme: {
      address: '', // TODO: Добавить адрес контракта Four.meme
      abi: [] // TODO: Добавить ABI контракта Four.meme
    },
    erc20: {
      abi: [] // TODO: Добавить полный ERC20 ABI
    }
  },
  tx: {
    confirmations: 1,
    timeout: 300000,
    retryAttempts: 3
  }
}


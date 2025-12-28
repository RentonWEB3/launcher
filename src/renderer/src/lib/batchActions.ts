import { TxQueue } from './txQueue'
import { Wallet, parseEther, Contract, JsonRpcProvider } from 'ethers'
import { config } from './config'

// Создаем глобальную очередь транзакций
let txQueue: TxQueue | null = null

function getTxQueue(): TxQueue {
  if (!txQueue) {
    txQueue = new TxQueue(async (logData) => {
      // Используем IPC для логирования
      return await window.electronAPI.createTxLog(logData)
    })
  }
  return txQueue
}

function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(config.chain.rpcUrl)
}

function createSigner(privateKey: string): Wallet {
  return new Wallet(privateKey, getProvider())
}

function getFourMemeContract(signer: Wallet): Contract {
  const address = config.contracts.fourMeme.address
  if (!address) {
    throw new Error('Four.meme contract address not configured. Add it to core/config/default.json')
  }

  const MINIMAL_ABI = [
    'function buy(address token) payable',
    'function sell(address token, uint256 amount)'
  ]

  const abi = config.contracts.fourMeme.abi.length > 0
    ? config.contracts.fourMeme.abi
    : MINIMAL_ABI

  return new Contract(address, abi, signer)
}

function getERC20Contract(tokenAddress: string, signer: Wallet): Contract {
  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ]

  const abi = config.contracts.erc20.abi.length > 0 
    ? config.contracts.erc20.abi 
    : ERC20_ABI

  return new Contract(tokenAddress, abi, signer)
}

async function buyToken(signer: Wallet, tokenAddress: string, bnbAmount: bigint): Promise<any> {
  const contract = getFourMemeContract(signer)
  // TODO: Вызвать реальный метод buy после добавления ABI
  // return await contract.buy(tokenAddress, { value: bnbAmount })
  
  throw new Error('Four.meme ABI not configured. Add ABI to core/config/default.json')
}

async function sellToken(signer: Wallet, tokenAddress: string, amount: bigint): Promise<any> {
  const contract = getFourMemeContract(signer)
  // TODO: Вызвать реальный метод sell после добавления ABI
  // return await contract.sell(tokenAddress, amount)
  
  throw new Error('Four.meme ABI not configured. Add ABI to core/config/default.json')
}

export async function executeBatchBuy(
  taskId: string,
  tokenAddress: string,
  walletAddresses: string[],
  bnbAmountPerWallet: string
): Promise<void> {
  const queue = getTxQueue()
  const bnbAmount = parseEther(bnbAmountPerWallet)

  for (const walletAddress of walletAddresses) {
    const privateKey = await window.electronAPI.getWalletPrivateKey(walletAddress)
    const signer = createSigner(privateKey)

    const txPromise = buyToken(signer, tokenAddress, bnbAmount)
    
    await queue.add({
      id: `buy-${walletAddress}-${Date.now()}`,
      walletAddress,
      action: `Buy ${bnbAmountPerWallet} BNB`,
      txPromise,
      taskId
    })
  }
}

export async function executeBatchSell(
  taskId: string,
  tokenAddress: string,
  walletAddresses: string[],
  percent: number
): Promise<void> {
  const queue = getTxQueue()

  for (const walletAddress of walletAddresses) {
    const privateKey = await window.electronAPI.getWalletPrivateKey(walletAddress)
    const signer = createSigner(privateKey)

    // Получаем баланс токенов
    const tokenContract = getERC20Contract(tokenAddress, signer)
    const balance = await tokenContract.balanceOf(walletAddress)
    
    // Вычисляем количество для продажи
    const sellAmount = (balance * BigInt(Math.floor(percent * 100))) / BigInt(10000)
    
    if (sellAmount === 0n) {
      console.warn(`No tokens to sell for wallet ${walletAddress}`)
      continue
    }

    const txPromise = sellToken(signer, tokenAddress, sellAmount)
    
    await queue.add({
      id: `sell-${walletAddress}-${Date.now()}`,
      walletAddress,
      action: `Sell ${percent}%`,
      txPromise,
      taskId
    })
  }
}

export async function executeSellAllDev(
  taskId: string,
  tokenAddress: string,
  devWalletAddress: string
): Promise<void> {
  const queue = getTxQueue()
  const privateKey = await window.electronAPI.getWalletPrivateKey(devWalletAddress)
  const signer = createSigner(privateKey)

  // Получаем баланс токенов
  const tokenContract = getERC20Contract(tokenAddress, signer)
  const balance = await tokenContract.balanceOf(devWalletAddress)
  
  if (balance === 0n) {
    throw new Error('No tokens to sell')
  }

  const txPromise = sellToken(signer, tokenAddress, balance)
  
  await queue.add({
    id: `sell-all-dev-${Date.now()}`,
    walletAddress: devWalletAddress,
    action: 'Sell All (Dev)',
    txPromise,
    taskId
  })
}

export async function executeTransferTokens(
  taskId: string,
  tokenAddress: string,
  fromWalletAddress: string,
  toAddress: string,
  amount?: string
): Promise<void> {
  const queue = getTxQueue()
  const privateKey = await window.electronAPI.getWalletPrivateKey(fromWalletAddress)
  const signer = createSigner(privateKey)

  const tokenContract = getERC20Contract(tokenAddress, signer)
  
  let transferAmount: bigint
  if (amount) {
    transferAmount = parseEther(amount)
  } else {
    // Переводим весь баланс
    transferAmount = await tokenContract.balanceOf(fromWalletAddress)
    if (transferAmount === 0n) {
      throw new Error('No tokens to transfer')
    }
  }

  const txPromise = tokenContract.transfer(toAddress, transferAmount)
  
  await queue.add({
    id: `transfer-tokens-${fromWalletAddress}-${Date.now()}`,
    walletAddress: fromWalletAddress,
    action: `Transfer Tokens to ${toAddress.slice(0, 8)}...`,
    txPromise,
    taskId
  })
}

export async function executeTransferBNB(
  taskId: string,
  fromWalletAddress: string,
  toAddress: string,
  bnbAmount: string
): Promise<void> {
  const queue = getTxQueue()
  const privateKey = await window.electronAPI.getWalletPrivateKey(fromWalletAddress)
  const signer = createSigner(privateKey)

  const amount = parseEther(bnbAmount)
  const txPromise = signer.sendTransaction({
    to: toAddress,
    value: amount
  })
  
  await queue.add({
    id: `transfer-bnb-${fromWalletAddress}-${Date.now()}`,
    walletAddress: fromWalletAddress,
    action: `Transfer ${bnbAmount} BNB to ${toAddress.slice(0, 8)}...`,
    txPromise,
    taskId
  })
}

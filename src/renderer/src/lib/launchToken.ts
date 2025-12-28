import { Wallet, parseEther, Contract, JsonRpcProvider, TransactionReceipt } from 'ethers'
import { config } from './config'

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
    'function createToken(string memory name, string memory symbol, string memory logo, string memory social) returns (address)'
  ]

  const abi = config.contracts.fourMeme.abi.length > 0
    ? config.contracts.fourMeme.abi
    : MINIMAL_ABI

  return new Contract(address, abi, signer)
}

async function sendTx(txPromise: Promise<any>): Promise<{
  hash: string
  receipt?: TransactionReceipt
  status: 'pending' | 'success' | 'fail'
  error?: string
  confirmations?: number
}> {
  try {
    const tx = await txPromise
    const result: any = {
      hash: tx.hash,
      status: 'pending' as const
    }

    const receipt = await tx.wait(1) // 1 подтверждение для BNB Chain
    result.receipt = receipt
    result.status = receipt.status === 1 ? 'success' : 'fail'
    result.confirmations = receipt.confirmations

    return result
  } catch (error: any) {
    return {
      hash: error?.transaction?.hash || '',
      status: 'fail' as const,
      error: error.message || 'Unknown error'
    }
  }
}

export async function launchToken(
  taskId: string,
  devWalletAddress: string,
  name: string,
  symbol: string,
  logo: string,
  social: string
): Promise<string> {
  const privateKey = await window.electronAPI.getWalletPrivateKey(devWalletAddress)
  const signer = createSigner(privateKey)

  try {
    // Создаем токен
    const contract = getFourMemeContract(signer)
    // TODO: Вызвать реальный метод createToken после добавления ABI
    // const txPromise = contract.createToken(name, symbol, logo, social)
    // const result = await sendTx(txPromise)
    
    throw new Error('Four.meme ABI not configured. Add ABI to core/config/default.json')
    
    // Логируем транзакцию
    // const logData = {
    //   taskId,
    //   walletAddress: devWalletAddress,
    //   action: 'Launch Token',
    //   txHash: result.hash,
    //   status: result.status,
    //   error: result.error,
    //   confirmations: result.confirmations
    // }
    // await window.electronAPI.createTxLog(logData)

    // if (result.status === 'fail') {
    //   throw new Error(result.error || 'Failed to create token')
    // }

    // TODO: Извлечь адрес токена из receipt
    // return result.hash
  } catch (error: any) {
    // Логируем ошибку
    const logData = {
      taskId,
      walletAddress: devWalletAddress,
      action: 'Launch Token',
      txHash: '',
      status: 'fail' as const,
      error: error.message || 'Unknown error'
    }
    await window.electronAPI.createTxLog(logData)
    throw error
  }
}

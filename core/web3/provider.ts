import { JsonRpcProvider, Wallet } from 'ethers'
import config from '../config/default.json'

let provider: JsonRpcProvider | null = null

export function getProvider(): JsonRpcProvider {
  if (!provider) {
    provider = new JsonRpcProvider(config.chain.rpcUrl)
  }
  return provider
}

export function createSigner(privateKey: string): Wallet {
  return new Wallet(privateKey, getProvider())
}


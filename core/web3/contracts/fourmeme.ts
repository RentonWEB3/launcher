import { Contract } from 'ethers'
import { getProvider } from '../provider'
import config from '../../config/default.json'

// TODO: Добавить официальный ABI Four.meme в core/config/default.json
// Получить ABI можно из Four.meme GitBook "Protocol Integration"
// После добавления ABI, заменить MINIMAL_ABI на config.contracts.fourMeme.abi

const MINIMAL_ABI = [
  'function createToken(string memory name, string memory symbol, string memory logo, string memory social) returns (address)',
  'function buy(address token) payable',
  'function sell(address token, uint256 amount)',
  'function getTokenInfo(address token) view returns (tuple(string name, string symbol, address creator, uint256 totalSupply))'
]

export function getFourMemeContract(signer?: any): Contract {
  const address = config.contracts.fourMeme.address
  if (!address) {
    throw new Error('Four.meme contract address not configured. Add it to core/config/default.json')
  }

  const abi = config.contracts.fourMeme.abi.length > 0
    ? config.contracts.fourMeme.abi
    : MINIMAL_ABI

  if (signer) {
    return new Contract(address, abi, signer)
  }
  return new Contract(address, abi, getProvider())
}

// Adapter functions (заглушки для MVP)
export async function createToken(
  signer: any,
  name: string,
  symbol: string,
  logo: string,
  social: string
): Promise<string> {
  const contract = getFourMemeContract(signer)
  // TODO: Вызвать реальный метод createToken после добавления ABI
  // const tx = await contract.createToken(name, symbol, logo, social)
  // const receipt = await tx.wait()
  // return receipt.logs[0].address // предполагаемый адрес токена
  
  throw new Error('Four.meme ABI not configured. Add ABI to core/config/default.json')
}

export async function buyToken(
  signer: any,
  tokenAddress: string,
  bnbAmount: bigint
): Promise<any> {
  const contract = getFourMemeContract(signer)
  // TODO: Вызвать реальный метод buy после добавления ABI
  // return await contract.buy(tokenAddress, { value: bnbAmount })
  
  throw new Error('Four.meme ABI not configured. Add ABI to core/config/default.json')
}

export async function sellToken(
  signer: any,
  tokenAddress: string,
  amount: bigint
): Promise<any> {
  const contract = getFourMemeContract(signer)
  // TODO: Вызвать реальный метод sell после добавления ABI
  // return await contract.sell(tokenAddress, amount)
  
  throw new Error('Four.meme ABI not configured. Add ABI to core/config/default.json')
}


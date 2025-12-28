import { Contract } from 'ethers'
import { getProvider } from '../provider'
import config from '../../config/default.json'

// TODO: Добавить полный ERC20 ABI в core/config/default.json
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
]

export function getERC20Contract(address: string, signer?: any): Contract {
  const abi = config.contracts.erc20.abi.length > 0 
    ? config.contracts.erc20.abi 
    : ERC20_ABI
  
  if (signer) {
    return new Contract(address, abi, signer)
  }
  return new Contract(address, abi, getProvider())
}


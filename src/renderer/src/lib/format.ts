export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatBNB(wei: bigint): string {
  // TODO: Реализовать форматирование BNB
  return wei.toString()
}


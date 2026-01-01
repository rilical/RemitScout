export const applyShard = <T>(
  items: T[],
  shardIndex: number,
  shardCount: number,
): T[] => {
  if (!Number.isFinite(shardCount) || shardCount <= 1) {
    return items
  }
  const normalizedIndex =
    Number.isFinite(shardIndex) && shardCount > 0
      ? ((Math.floor(shardIndex) % shardCount) + shardCount) % shardCount
      : 0
  return items.filter((_, index) => index % shardCount === normalizedIndex)
}

export const partitionCorridors = <T>(items: T[], shardCount: number): T[][] => {
  if (!Number.isFinite(shardCount) || shardCount <= 0) return []
  const partitions: T[][] = Array.from({ length: shardCount }, () => [])
  for (let i = 0; i < items.length; i += 1) {
    partitions[i % shardCount].push(items[i])
  }
  return partitions
}

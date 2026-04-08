export const requestJson = async <T>(
  url: string,
  signal: AbortSignal,
): Promise<T> => {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

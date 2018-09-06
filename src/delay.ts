export type CancelablePromise<T> = Promise<T> & { cancel?: () => void }

export function delay (ms: number): CancelablePromise<void> {
  let onCancel = null
  const result: any = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve()
    }, ms)
    onCancel = () => {
      clearTimeout(timer)
      resolve()
    }
  })
  result.cancel = onCancel
  return result
}

export function immediate (): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve)
  })
}

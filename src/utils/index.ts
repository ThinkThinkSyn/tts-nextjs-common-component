export function getUtcTimestampInSeconds() {
  return Math.floor(Date.now() / 1000)
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let lastFunc: ReturnType<typeof setTimeout>
  let lastRan: number

  return ((...args) => {
    if (!lastRan) {
      func(...args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }) as T
}

// console.log(objectPick({a: 1, b: 2, c: 3}, 'a', 'b'))
export function objectPick<
  T extends { [key in U]: V },
  U extends string | number | symbol,
  V
>(obj: T, ...keys: U[]): Pick<T, U> {
  const len = keys.length
  let res = {} as typeof obj

  for (let index = -1; ++index < len; ) {
    const key = keys[index]
    if (key in obj) {
      res[key] = obj[key]
    }
  }
  return res
}

export function objectOmit<
  T extends { [key in U]: V },
  U extends string | number | symbol,
  V
>(obj: T, ...omitKeys: U[]): Omit<T, U> {
  const len = omitKeys.length
  let res = { ...obj }

  for (let index = -1; ++index < len; ) {
    const key = omitKeys[index]
    delete res[key]
  }
  return res
}

// https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type
// used to expend type, such as Omit<> and Pick<>. only for debug purpose because it erases type name. if used it in product, only use with Intersection Types
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type ExpandFunc<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandFunc<A>) => ExpandFunc<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never

export type ArrayToUnion<T extends readonly string[]> = T[number]

export * from "./chat"
export * from "./file"
export * from "./speech"
export * from "./storage"
export * from "./i18n"
export * from './chat'
export * from './file'
export * from './speech'
export * from './storage'
export * from './i18n'

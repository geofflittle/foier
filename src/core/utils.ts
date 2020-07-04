export const asyncReduce = <T, U>(arr: T[], rfn: (a: U, c: T) => Promise<U>, init: U): Promise<U> =>
    arr.reduce(async (acc: Promise<U>, cur: T) => rfn(await acc, cur), Promise.resolve(init))

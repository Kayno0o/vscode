export interface KCommand {
  callback: (...args: any[]) => Promise<void> | void
  name: string
}

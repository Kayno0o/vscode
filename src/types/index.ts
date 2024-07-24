export interface KCommand {
  callback: () => Promise<void> | void
  name: string
}

export type KCommand = {
  name: string
  callback: () => Promise<void>|void
};
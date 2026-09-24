export interface IQueueProvider {
  push<T = any>(message: T): Promise<void>;
  pushBatch<T = any>(messages: T[]): Promise<void>;
}

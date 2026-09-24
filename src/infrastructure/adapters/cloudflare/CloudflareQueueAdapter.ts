import { IQueueProvider } from '../../interfaces/IQueueProvider';

export class CloudflareQueueAdapter implements IQueueProvider {
  private queue: Queue<any>;

  constructor(queue: Queue<any>) {
    this.queue = queue;
  }

  async push<T = any>(message: T): Promise<void> {
    await this.queue.send(message);
  }

  async pushBatch<T = any>(messages: T[]): Promise<void> {
    await this.queue.sendBatch(messages.map(body => ({ body })));
  }
}

import { describe, it, expect } from 'vitest';
import { createMemoryContainer } from '../src/infrastructure/container';
import { FinanceService } from '../src/services/finance/financeService';
import { HostelService } from '../src/services/hostels/hostelService';
import { AcademicService } from '../src/services/academic/academicService';

describe('Infrastructure Adapters & Service Container', () => {
  it('should initialize MemoryContainer and execute Cache operations', async () => {
    const container = createMemoryContainer();
    expect(container).toBeDefined();

    // Cache operations
    await container.cache.set('test-key', { foo: 'bar' }, 60);
    const cached = await container.cache.get<{ foo: string }>('test-key');
    expect(cached).toEqual({ foo: 'bar' });

    const count = await container.cache.increment('counter-key', 60);
    expect(count).toBe(1);
    const count2 = await container.cache.increment('counter-key', 60);
    expect(count2).toBe(2);

    await container.cache.delete('test-key');
    const deleted = await container.cache.get('test-key');
    expect(deleted).toBeNull();
  });

  it('should execute Storage operations with MemoryStorageAdapter', async () => {
    const container = createMemoryContainer();
    const data = 'Hello COEKA Digital Campus';
    const uploadResult = await container.storage.upload('docs/readme.txt', data, 'text/plain');

    expect(uploadResult.key).toBe('docs/readme.txt');
    expect(uploadResult.sizeBytes).toBeGreaterThan(0);

    const downloaded = await container.storage.download('docs/readme.txt');
    expect(downloaded).not.toBeNull();
    const text = new TextDecoder().decode(downloaded!);
    expect(text).toBe(data);

    await container.storage.delete('docs/readme.txt');
    const afterDelete = await container.storage.download('docs/readme.txt');
    expect(afterDelete).toBeNull();
  });

  it('should execute Queue operations with MemoryQueueAdapter', async () => {
    const container = createMemoryContainer();
    await container.queue.push({ event: 'STUDENT_REGISTERED', matric: 'COEKA/2026/001' });
    await container.queue.pushBatch([
      { event: 'INVOICE_GENERATED', id: 'inv-1' },
      { event: 'INVOICE_GENERATED', id: 'inv-2' },
    ]);

    const memoryQueue = container.queue as any;
    expect(memoryQueue.messages.length).toBe(3);
  });

  it('should wire DI services cleanly with Container', async () => {
    const container = createMemoryContainer();
    const financeService = new FinanceService(container.db, container.cache, container.queue);
    const hostelService = new HostelService(container.db, container.cache);
    const academicService = new AcademicService(container.db, container.storage);

    // 1. Finance Invoices & Caching
    const invoices = await financeService.getInvoices('std-001');
    expect(invoices.length).toBeGreaterThan(0);
    expect(invoices[0].formattedDue).toContain('₦');

    // 2. Hostel Reservation Lock via Cache
    const reserveRes = await hostelService.reserveBedspace('b-101-3', 'std-001');
    expect(reserveRes.success).toBe(true);
    expect(reserveRes.reservedUntil).toBeGreaterThan(0);

    // Conflict lock should be rejected
    const conflictRes = await hostelService.reserveBedspace('b-101-3', 'std-002');
    expect(conflictRes.success).toBe(false);

    // 3. Academic Service Result & Transcript Storage
    const results = await academicService.getStudentSemesterResults('std-001', 'NCE');
    expect(results.semesterSummary.gpa).toBeGreaterThan(0);

    const transcript = await academicService.generateTranscript('std-001', 'Aondoaver Moses', 'COEKA/2026/NCE/084');
    expect(transcript.verificationHash).toBeDefined();
    expect((transcript as any).downloadUrl).toContain('transcripts/std-001_');
  });
});

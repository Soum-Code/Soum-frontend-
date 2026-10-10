import { describe, it, expect } from 'vitest';
import { datum, DatumStatus } from './stateModel';

describe('stateModel', () => {
  it('creates measured datums with exact value', () => {
    const d = datum.measured(0.35);
    expect(d.status).toBe<DatumStatus>('measured');
    expect(d.value).toBe(0.35);
  });

  it('creates pending datums with reason', () => {
    const d = datum.pending('Worker evaluating...');
    expect(d.status).toBe<DatumStatus>('pending');
    expect(d.reason).toBe('Worker evaluating...');
  });

  it('creates unmeasured datums with mandatory reason', () => {
    const d = datum.unmeasured('not exposed by the API yet');
    expect(d.status).toBe<DatumStatus>('unmeasured');
    expect(d.reason).toBe('not exposed by the API yet');
  });

  it('creates unreachable datums with service and start command', () => {
    const d = datum.unreachable(
      'Chat service (port 8100)',
      'uvicorn demo.chat_server:app --port 8100'
    );
    expect(d.status).toBe<DatumStatus>('unreachable');
    expect(d.service).toBe('Chat service (port 8100)');
    expect(d.instruction).toBe('uvicorn demo.chat_server:app --port 8100');
  });

  it('creates error datums with backend error message', () => {
    const d = datum.error('Model failed: 502 Bad Gateway');
    expect(d.status).toBe<DatumStatus>('error');
    expect(d.error).toBe('Model failed: 502 Bad Gateway');
  });
});

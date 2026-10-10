/**
 * The 5 Datum States for AgentPulse Observability.
 * 
 * In AgentPulse, every datum is in exactly one of five states:
 * - pending: requested, not yet evaluated
 * - measured: real value measured by the system
 * - unmeasured: the system does not produce it (renders em-dash "—" + tooltip reason)
 * - unreachable: the service did not answer (identifies which service and how to start it)
 * - error: the service answered with a failure (displays the error message)
 * 
 * Rule: There is no sixth state called "default".
 */

export type DatumStatus = 'pending' | 'measured' | 'unmeasured' | 'unreachable' | 'error';

export interface Datum<T = any> {
  status: DatumStatus;
  value?: T;
  reason?: string;
  service?: string;
  instruction?: string;
  error?: string;
}

export const datum = {
  measured: <T>(value: T): Datum<T> => ({
    status: 'measured',
    value,
  }),
  pending: <T = any>(reason = 'Evaluating in worker...'): Datum<T> => ({
    status: 'pending',
    reason,
  }),
  unmeasured: <T = any>(reason = 'not exposed by the API yet'): Datum<T> => ({
    status: 'unmeasured',
    reason,
  }),
  unreachable: <T = any>(service: string, instruction: string): Datum<T> => ({
    status: 'unreachable',
    service,
    instruction,
  }),
  error: <T = any>(error: string): Datum<T> => ({
    status: 'error',
    error,
  }),
};

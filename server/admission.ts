/** A lease follows real provider/tool promises, including work left after a timeout race. */
export type AgentWorkLease = {
  track<T>(operation: () => T | Promise<T>): Promise<T>;
  runnerFinished(): void;
};

export type AgentAdmission = {
  tryAcquire(): AgentWorkLease | null;
  active(): number;
};

export function createAgentAdmission(capacity = 2): AgentAdmission {
  const maximum = Number.isFinite(capacity) ? Math.max(1, Math.min(2, Math.floor(capacity))) : 2;
  let active = 0;

  return {
    active: () => active,
    tryAcquire() {
      if (active >= maximum) return null;
      active += 1;
      let pending = 0;
      let finished = false;
      let released = false;

      const releaseIfSettled = () => {
        if (finished && pending === 0 && !released) {
          released = true;
          active -= 1;
        }
      };

      return {
        track<T>(operation: () => T | Promise<T>): Promise<T> {
          if (finished) return Promise.reject(new Error("agent-work-after-finish"));
          pending += 1;
          let underlying: T | Promise<T>;
          try { underlying = operation(); }
          catch (error) { underlying = Promise.reject(error); }
          return Promise.resolve(underlying).then(
            (value) => { pending -= 1; releaseIfSettled(); return value; },
            (error) => { pending -= 1; releaseIfSettled(); throw error; },
          );
        },
        runnerFinished() {
          finished = true;
          releaseIfSettled();
        },
      };
    },
  };
}

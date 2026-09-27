import type { CoachAdvice, CoachProvider } from "../coach/types";

export const fakeCoachProvider: CoachProvider = {
  name: "fake",
  model: "deterministic-v1",
  async generate(statistics): Promise<{ output: CoachAdvice }> {
    const timingText = {
      early: "Pusti malo kasnije",
      late: "Pusti malo ranije",
      mixed: "Traži stabilniji tajming",
      consistent: "Dobar, stabilan tajming",
    }[statistics.timingBias];

    return { output: {
      headline: timingText,
      timingBias: statistics.timingBias,
      biggestMistakeFloor: statistics.biggestMistakeFloor,
      tip: `Na spratu ${statistics.biggestMistakeFloor} fokusiraj se na centar tornja pre puštanja.`,
    } };
  },
};

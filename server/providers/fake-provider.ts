import type { CoachAdvice, CoachProvider } from "../coach/types";

export const fakeCoachProvider: CoachProvider = {
  async generate(statistics): Promise<CoachAdvice> {
    const timingText = {
      early: "Pusti malo kasnije",
      late: "Pusti malo ranije",
      mixed: "Traži stabilniji tajming",
      consistent: "Dobar, stabilan tajming",
    }[statistics.timingBias];

    return {
      headline: timingText,
      timingBias: statistics.timingBias,
      biggestMistakeFloor: statistics.biggestMistakeFloor,
      tip: `Na spratu ${statistics.biggestMistakeFloor} fokusiraj se na centar tornja pre puštanja.`,
    };
  },
};

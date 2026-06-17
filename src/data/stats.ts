import { exercises } from "./exercises";
import { topics } from "./topics";

export type Stat = {
  id: string;
  value: string;
  label: string;
};

const exerciseCount = exercises.length;
const topicCount = topics.length;

export const stats: Stat[] = [
  {
    id: "problems",
    value: String(exerciseCount),
    label: `exercice${exerciseCount > 1 ? "s" : ""} corrigé${exerciseCount > 1 ? "s" : ""} dans ${topicCount} matière${topicCount > 1 ? "s" : ""}`,
  },
  {
    id: "steps",
    value: "100 %",
    label: "des solutions sont détaillées étape par étape",
  },
  {
    id: "devices",
    value: "Tous",
    label: "appareils — ordinateur, tablette, téléphone",
  },
  {
    id: "free",
    value: "100 %",
    label: "gratuit, sans compte requis",
  },
];

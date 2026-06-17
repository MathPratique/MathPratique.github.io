import type { Exercise } from "../data/exercises";
import { generateL1Quiz } from "./generators/L1";
import { generateL2Quiz } from "./generators/L2";
import { generateL3Quiz } from "./generators/L3";
import { generateL4Quiz } from "./generators/L4";
import { generateL5Quiz } from "./generators/L5";
import { generateL6Quiz } from "./generators/L6";
import { generateL7Quiz } from "./generators/L7";
import { generateL8Quiz } from "./generators/L8";
import { generateL9Quiz } from "./generators/L9";
import { generateL10Quiz } from "./generators/L10";
import { generateL11Quiz } from "./generators/L11";
import { generateL12Quiz } from "./generators/L12";
import { generateL13Quiz } from "./generators/L13";
import { generateL14Quiz } from "./generators/L14";
import { generateL15Quiz } from "./generators/L15";
import { generateL16Quiz } from "./generators/L16";
import { generateL17Quiz } from "./generators/L17";
import { generateL18Quiz } from "./generators/L18";
import { generateL19Quiz } from "./generators/L19";
import { generateL20Quiz } from "./generators/L20";

const generators: Record<string, () => Exercise[]> = {
  L1: generateL1Quiz,
  L2: generateL2Quiz,
  L3: generateL3Quiz,
  L4: generateL4Quiz,
  L5: generateL5Quiz,
  L6: generateL6Quiz,
  L7: generateL7Quiz,
  L8: generateL8Quiz,
  L9: generateL9Quiz,
  L10: generateL10Quiz,
  L11: generateL11Quiz,
  L12: generateL12Quiz,
  L13: generateL13Quiz,
  L14: generateL14Quiz,
  L15: generateL15Quiz,
  L16: generateL16Quiz,
  L17: generateL17Quiz,
  L18: generateL18Quiz,
  L19: generateL19Quiz,
  L20: generateL20Quiz,
};

export function hasQuizGenerator(lessonId: string): boolean {
  return lessonId in generators;
}

export function generateQuiz(lessonId: string): Exercise[] {
  const gen = generators[lessonId];
  if (!gen) return [];
  return gen();
}

export function availableQuizLessons(): string[] {
  return Object.keys(generators);
}

import { getChaptersForTopic, getLessonsForChapter } from "../../data/lessons";
import { exercises } from "../../data/exercises";
import AnimatedSection from "../ui/AnimatedSection";

type LessonNavProps = {
  topicId: string;
  onLessonClick: (lessonId: string) => void;
};

export default function LessonNav({ topicId, onLessonClick }: LessonNavProps) {
  const chapters = getChaptersForTopic(topicId);

  return (
    <div className="space-y-14">
      {chapters.map((chapter, ci) => {
        const lessons = getLessonsForChapter(chapter.id);
        return (
          <AnimatedSection key={chapter.id} delay={ci * 0.05}>
            <div className="mb-5">
              <h2 className="font-display text-2xl font-bold text-brand-900">
                {chapter.name}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const count = exercises.filter(
                  (e) => e.lessonId === lesson.id
                ).length;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onLessonClick(lesson.id)}
                    className="group flex h-full cursor-pointer flex-col rounded-2xl border border-brand-100 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 font-mono text-sm font-semibold text-brand-700 transition-colors duration-200 group-hover:bg-brand-600 group-hover:text-white">
                        {lesson.number}
                      </span>
                      <span className="font-mono text-xs text-ink-600">
                        {count} ex.
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold leading-tight text-brand-900">
                      {lesson.name}
                    </h3>
                  </button>
                );
              })}
            </div>
          </AnimatedSection>
        );
      })}
    </div>
  );
}

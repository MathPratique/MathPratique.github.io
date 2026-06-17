import clsx from "clsx";
import { topics } from "../../data/topics";

type TopicFilterProps = {
  active: string;
  onChange: (topicId: string) => void;
};

export default function TopicFilter({ active, onChange }: TopicFilterProps) {
  const options = [{ id: "all", name: "Toutes les matières" }, ...topics];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filtrer les exercices par matière"
    >
      {options.map((option) => {
        const isActive = active === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={clsx(
              "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
              isActive
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-brand-100 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700"
            )}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

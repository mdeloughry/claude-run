import { Circle, CircleCheck, Loader2, ListTodo } from "lucide-react";

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
}

interface TodoRendererProps {
  todos: TodoItem[];
}

function getStatusIcon(status: string) {
  if (status === "completed") {
    return <CircleCheck size={14} className="text-emerald-400" />;
  }
  if (status === "in_progress") {
    return <Loader2 size={14} className="text-amber-400 animate-spin" />;
  }
  return <Circle size={14} className="text-[var(--color-text-muted)]" />;
}

function getStatusClass(status: string) {
  if (status === "completed") {
    return "text-[var(--color-text-muted)] line-through";
  }
  if (status === "in_progress") {
    return "text-amber-200";
  }
  return "text-[var(--color-text-secondary)]";
}

export function TodoRenderer(props: TodoRendererProps) {
  const { todos } = props;

  if (!todos || todos.length === 0) {
    return null;
  }

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const totalCount = todos.length;

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <ListTodo size={14} className="text-violet-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Tasks</span>
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">
            {completedCount}/{totalCount}
          </span>
          <div className="w-16 h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
        <ul className="divide-y divide-[var(--color-border-subtle)]">
          {todos.map((todo, index) => (
            <li
              key={index}
              className="flex items-start gap-2.5 px-3 py-2 hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <span className="mt-0.5 flex-shrink-0">{getStatusIcon(todo.status)}</span>
              <span className={`text-xs leading-relaxed ${getStatusClass(todo.status)}`}>
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

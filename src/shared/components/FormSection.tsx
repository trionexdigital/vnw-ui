import { Button } from "@/shared/ui/button";
import { Edit2 } from "lucide-react";

interface FormField {
  label: string;
  value: string;
}

interface FormSectionProps {
  title: string;
  fields: FormField[];
  onEdit?: () => void;
  columns?: number;
}

export function FormSection({
  title,
  fields,
  onEdit,
  columns = 2,
}: FormSectionProps) {
  return (
    <div className="mb-4 rounded-lg border border-card-border bg-card p-3 text-card-foreground sm:mb-6 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
        {onEdit && (
          <Button
            onClick={onEdit}
            className="w-full border-info/35 bg-info-soft text-info hover:bg-info/15 sm:w-auto"
            variant="outline"
            size="sm"
          >
            <Edit2 className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Edit</span>
          </Button>
        )}
      </div>

      <div
        className={`grid gap-3 sm:gap-4 md:gap-6 ${
          columns === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : columns === 1
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {fields.map((field, index) => (
          <div key={index}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground sm:mb-2 sm:text-sm">
              {field.label}
            </label>
            <p className="break-words text-sm font-medium text-foreground sm:text-base">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

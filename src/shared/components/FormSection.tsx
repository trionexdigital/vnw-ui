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
    <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 border border-gray-200 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        {onEdit && (
          <Button
            onClick={onEdit}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 w-full sm:w-auto"
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
            <label className="text-xs sm:text-sm text-gray-600 block mb-1 sm:mb-2 font-medium">
              {field.label}
            </label>
            <p className="text-sm sm:text-base text-gray-900 font-medium break-words">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

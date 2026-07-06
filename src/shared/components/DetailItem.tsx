/**
 * Small read-only label/value pair used in patient info grids.
 * Extracted from the (previously duplicated) test PatientSection components.
 */
export const DetailItem = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
    <div className="flex flex-col space-y-0.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            {Icon && <Icon className="w-3 h-3" />} {label}
        </span>
        <span className="text-sm font-semibold break-words whitespace-normal">
            {value && value !== "" ? value : <span className="text-muted-foreground/50 font-normal">----</span>}
        </span>
    </div>
);

export default DetailItem;

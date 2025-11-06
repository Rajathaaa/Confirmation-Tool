import { Input } from "@/components/ui/input";
import { formatNumberInput, parseIndianNumber } from "@/lib/utils";

type Props = {
  value: string | number;
  onValueChange: (rawNumberString: string) => void; // emits unformatted numeric string
  placeholder?: string;
  className?: string;
};

export default function IndianNumberInput({ value, onValueChange, placeholder, className }: Props) {
  const display = value === undefined || value === null ? "" : formatNumberInput(String(value));

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const raw = parseIndianNumber(e.target.value); // strips commas
        onValueChange(raw.toString());
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BookingDatePickerProps {
  value?: Date;
  onChange: (value?: Date) => void;
}

export default function BookingDatePicker({ value, onChange }: BookingDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [time, setTime] = React.useState<string>(value ? format(value, "HH:mm") : "");

  React.useEffect(() => {
    // Sync from outside
    setDate(value);
    setTime(value ? format(value, "HH:mm") : "");
  }, [value]);

  const merge = (d?: Date, t?: string) => {
    if (!d) { onChange(undefined); return; }
    if (!t) { onChange(d); return; }
    const [hh, mm] = t.split(":").map((v) => parseInt(v, 10));
    const merged = new Date(d);
    if (!Number.isNaN(hh)) merged.setHours(hh);
    if (!Number.isNaN(mm)) merged.setMinutes(mm);
    merged.setSeconds(0, 0);
    onChange(merged);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { setDate(d); merge(d, time); }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={time}
          onChange={(e) => { setTime(e.target.value); merge(date, e.target.value); }}
          placeholder="Select time"
        />
      </div>
    </div>
  );
}

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date and time",
  disabled,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(value, "HH:mm") : ""
  );
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedDate(value);
    setTimeValue(value ? format(value, "HH:mm") : "");
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(date);
      if (timeValue) {
        const [hours, minutes] = timeValue.split(':');
        newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }
      setSelectedDate(date);
      onChange(newDateTime);
    } else {
      setSelectedDate(undefined);
      onChange(undefined);
    }
    setCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    if (selectedDate && time) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      onChange(newDateTime);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-2">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="relative">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-32"
            disabled={disabled}
          />
          <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          Selected: {format(value, "PPP 'at' HH:mm")}
        </p>
      )}
    </div>
  );
}
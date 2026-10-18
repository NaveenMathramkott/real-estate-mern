import type { ComponentProps, ReactNode } from "react";
import type { StyleProp } from "react-native";

import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { Input as GSInput, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Slider as GSSlider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@/components/ui/slider";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import {
  Select as GSSelect,
  SelectContent,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectScrollView,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch as GSSwitch } from "@/components/ui/switch";
import {
  Textarea as GSTextarea,
  TextareaInput,
} from "@/components/ui/textarea";
import { Text as GSText } from "@/components/ui/text";

/* ------------------------------------------------------------------ inputs */

/**
 * Gluestack splits a text field into a `Input` container and an `InputField`
 * that owns the actual text props. Callers keep passing `value`/`onChangeText`
 * straight through, and this wrapper forwards them to the field.
 */
export function Input({
  className = "",
  style,
  invalid,
  ...fieldProps
}: ComponentProps<typeof InputField> & {
  style?: StyleProp<any>;
  /** Paints the container border with the destructive token. */
  invalid?: boolean;
}) {
  return (
    <GSInput
      style={style}
      className={`h-11 rounded-lg border bg-card ${
        invalid ? "border-destructive" : "border-input"
      } ${className}`}
    >
      <InputField
        {...fieldProps}
        className="text-[15px] text-foreground placeholder:text-muted-foreground"
      />
    </GSInput>
  );
}

/** Same split as `Input`, for the multiline `Textarea` pair. */
export function Textarea({
  className = "",
  style,
  ...fieldProps
}: ComponentProps<typeof TextareaInput> & { style?: StyleProp<any> }) {
  return (
    <GSTextarea
      style={style}
      className={`min-h-24 rounded-lg border border-input bg-card ${className}`}
    >
      <TextareaInput
        {...fieldProps}
        className="text-[15px] text-foreground placeholder:text-muted-foreground"
      />
    </GSTextarea>
  );
}

/**
 * Labelled form row built on gluestack's `FormControl`, so the label, helper
 * text and error message share one accessibility contract across every form.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      <FormControlLabel>
        <FormControlLabelText className="text-sm text-muted-foreground">
          {label}
          {required ? " *" : ""}
        </FormControlLabelText>
      </FormControlLabel>
      {children}
      {error ? (
        <FormControlError>
          <FormControlErrorText className="text-xs text-destructive">
            {error}
          </FormControlErrorText>
        </FormControlError>
      ) : hint ? (
        <FormControlHelper>
          <FormControlHelperText className="text-xs text-muted-foreground">
            {hint}
          </FormControlHelperText>
        </FormControlHelper>
      ) : null}
    </FormControl>
  );
}

/* ------------------------------------------------------------------ select */

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

/**
 * Dropdown backed by gluestack's `Select`. Replaces the hand-rolled option
 * sheet: the same portal + backdrop + item list, with the platform's own
 * dismissal and focus handling.
 */
export function Select({
  label,
  value,
  placeholder = "Select…",
  options,
  onSelect,
  invalid,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  invalid?: boolean;
}) {
  const body = (
    <GSSelect
      isInvalid={invalid}
      selectedValue={value}
      onValueChange={(next) => {
        if (next !== value) onSelect(next);
      }}
      initialLabel={options.find((option) => option.value === value)?.label}
      placeholder={placeholder}
    >
      <SelectTrigger className="h-11 rounded-lg border border-input bg-card data-[invalid=true]:border-destructive">
        <SelectInput
          placeholder={placeholder}
          className="flex-1 text-[15px] text-foreground placeholder:text-muted-foreground"
        />
        <SelectIcon className="text-muted-foreground" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent className="max-h-80 border border-border bg-popover">
          <SelectScrollView>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                label={option.label}
                value={option.value}
                className="border-b border-border/60 px-4 py-3 last:border-b-0 data-[active=true]:bg-accent"
              />
            ))}
          </SelectScrollView>
        </SelectContent>
      </SelectPortal>
    </GSSelect>
  );

  if (!label) return body;

  return (
    <Field label={label} error={invalid ? " " : undefined}>
      {body}
    </Field>
  );
}

/* ------------------------------------------------------------------ switch */

/** Labelled on/off row built on gluestack's `Switch`. */
export function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <HStack className="items-center justify-between gap-3 py-2.5">
      <Box className="flex-1">
        <GSText className="text-base font-semibold text-foreground">
          {label}
        </GSText>
        {description ? (
          <GSText className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </GSText>
        ) : null}
      </Box>
      <GSSwitch
        isChecked={value}
        onToggle={(next: boolean) => onChange(next)}
        className="bg-border data-[checked=true]:bg-primary"
      />
    </HStack>
  );
}

/* ------------------------------------------------------------------ slider */

/**
 * Dual-thumb price range. React Native ships no range input and gluestack's
 * `Slider` is single-thumb, so two sliders are stacked over one track — the
 * lower one wins whenever it would cross the upper one.
 */
export function RangeSlider({
  min,
  max,
  step,
  lower,
  upper,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  lower: number;
  upper: number;
  onChange: (lower: number, upper: number) => void;
}) {
  return (
    <Box className="h-10 justify-center">
      <Box className="absolute inset-x-0 h-1 rounded bg-border" />
      <Box
        className="absolute h-1 rounded bg-primary"
        style={{
          left: `${((lower - min) / (max - min)) * 100}%`,
          right: `${100 - ((upper - min) / (max - min)) * 100}%`,
        }}
      />

      <GSSlider
        value={lower}
        minValue={min}
        maxValue={max}
        step={step}
        onChange={(next) => onChange(Math.min(next, upper), upper)}
        sliderTrackHeight={4}
        thumbSize={22}
        className="absolute inset-x-0"
      >
        <SliderTrack className="h-1 bg-transparent">
          <SliderFilledTrack className="bg-transparent" />
        </SliderTrack>
        <SliderThumb className="h-[22px] w-[22px] rounded-full border-2 border-primary bg-card" />
      </GSSlider>

      <GSSlider
        value={upper}
        minValue={min}
        maxValue={max}
        step={step}
        onChange={(next) => onChange(lower, Math.max(next, lower))}
        sliderTrackHeight={4}
        thumbSize={22}
        className="absolute inset-x-0"
      >
        <SliderTrack className="h-1 bg-transparent">
          <SliderFilledTrack className="bg-transparent" />
        </SliderTrack>
        <SliderThumb className="h-[22px] w-[22px] rounded-full border-2 border-primary bg-card" />
      </GSSlider>
    </Box>
  );
}

/* ------------------------------------------------------------------- loader */

export function Loader({ label }: { label?: string }) {
  return (
    <Center className="gap-2 py-8">
      <Spinner size="small" className="text-primary" />
      {label ? (
        <GSText className="text-sm text-muted-foreground">{label}</GSText>
      ) : null}
    </Center>
  );
}

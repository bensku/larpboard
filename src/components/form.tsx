import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { ReactNode } from "react";
import { Input } from "./ui/input";
import { useYjsValue } from "@/data/hooks";
import { Checkbox } from "./ui/checkbox";

export const Field = ({ id, label, children, grow }: { id: string; label: string; children: ReactNode; grow?: boolean }) => {
  return <div className={cn('flex flex-col space-x-2 mb-2 overflow-clip', grow && 'flex-grow')}>
    <Label htmlFor={id} className="ml-3 mb-1">{label}</Label>
    {children}
  </div>
}

export const FieldGroup = ({ children }: { children: ReactNode }) => {
  return <div className="flex gap-4 flex-wrap">
    {children}
  </div>
}

export const TextField = <T extends object, K extends keyof T>({ obj, field, label, grow }: { obj: T, field: K, label: string, grow?: boolean }) => {
  const [value, setValue] = useYjsValue(obj, field);
  return <Field id={String(field)} label={label} grow={grow}>
    <Input name={String(field)} value={value as string} onChange={(event) => setValue(event.target.value as T[K])} />
  </Field>
}

export const NumberField = <T extends object, K extends keyof T>({ obj, field, label, grow }: { obj: T, field: K, label: string, grow?: boolean }) => {
  const [value, setValue] = useYjsValue(obj, field);
  return <Field id={String(field)} label={label} grow={grow}>
    <Input type="number" name={String(field)} value={String(value)} onChange={(event) => setValue(parseInt(event.target.value) as T[K])} />
  </Field>
}

export const Toggle = <T extends object, K extends keyof T>({ obj, field, label, className }: { obj: T, field: K, label: string, className?: string }) => {
  const [value, setValue] = useYjsValue(obj, field);
  return <div className={cn('flex flex-row space-x-2 mb-2', className)}>
    <Label htmlFor={String(field)} className="ml-3 mb-1">{label}</Label>
    <Checkbox name={String(field)} checked={value as boolean} onCheckedChange={(checked) => setValue(checked as T[K])} />
  </div>
}
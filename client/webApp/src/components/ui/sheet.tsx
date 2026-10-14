import { XIcon } from "lucide-react";
import * as React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type SheetSide = "top" | "right" | "bottom" | "left";

const SIDE_CLASSES: Record<SheetSide, string> = {
  right:
    "inset-y-0 right-0 h-full w-4/5 border-l sm:max-w-md data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  left: "inset-y-0 left-0 h-full w-4/5 border-r sm:max-w-sm data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  top: "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom:
    "inset-x-0 bottom-0 h-auto max-h-[92vh] rounded-t-2xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
};

/**
 * Edge-anchored panel built on the Dialog primitive. Used for the mobile nav,
 * the results filter drawer and other overlay surfaces.
 */
export function Sheet({
  side = "right",
  open,
  onOpenChange,
  children,
}: {
  side?: SheetSide;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side}>{children}</SheetContent>
    </Dialog>
  );
}

export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { side?: SheetSide }) {
  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        "bg-background fixed z-50 flex flex-col gap-4 p-6 shadow-xl duration-300",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        SIDE_CLASSES[side],
        className,
      )}
      {...props}
    >
      {children}
      <DialogClose className="absolute top-5 right-5 cursor-pointer rounded-md p-1 opacity-70 transition hover:bg-accent hover:opacity-100">
        <XIcon className="size-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 pr-8", className)}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export const SheetTitle = React.forwardRef<
  React.ComponentRef<"h2">,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    data-slot="sheet-title"
    className={cn("font-display text-lg font-medium", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export const SheetDescription = React.forwardRef<
  React.ComponentRef<"p">,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="sheet-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;

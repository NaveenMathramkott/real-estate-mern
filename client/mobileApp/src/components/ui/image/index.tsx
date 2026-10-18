import React from "react";
import { createImage } from "@gluestack-ui/core/image/creator";
import { Platform, Image as RNImage } from "react-native";
import { tva } from "@gluestack-ui/utils/nativewind-utils";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";

const imageStyle = tva({
  base: "max-w-full",
  variants: {
    size: {
      "2xs": "h-6 w-6",
      xs: "h-10 w-10",
      sm: "h-16 w-16",
      md: "h-20 w-20",
      lg: "h-24 w-24",
      xl: "h-32 w-32",
      "2xl": "h-64 w-64",
      full: "h-full w-full",
      none: "",
    },
  },
});

const UIImage = createImage({ Root: RNImage });

type ImageProps = VariantProps<typeof imageStyle> &
  React.ComponentProps<typeof UIImage>;
// Patched from the generated source. Two upstream problems made every caller's
// `style` prop a no-op and gave images a hard-coded 80x80 default:
//
//   1. `style` was assigned *after* `{...props}`, so it overwrote whatever the
//      caller passed — on native it overwrote it with `undefined`.
//   2. `size` defaulted to "md", i.e. `h-20 w-20`, so an unsized image rendered
//      as a small box in the corner of its parent.
//
// The default is now "none" (no size classes): callers size their own images,
// and any `style` they pass is merged rather than discarded.
const Image = React.forwardRef<
  React.ComponentRef<typeof UIImage>,
  ImageProps & { className?: string }
>(function Image({ size = "none", className, style, ...props }, ref) {
  return (
    <UIImage
      className={imageStyle({ size, class: className })}
      {...props}
      ref={ref}
      style={[
        style,
        // Web lets the size classes win; native has no `revert-layer`.
        Platform.OS === "web"
          ? ({ height: "revert-layer", width: "revert-layer" } as object)
          : null,
      ]}
    />
  );
});

Image.displayName = "Image";
export { Image };

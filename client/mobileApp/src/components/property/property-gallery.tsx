import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { FlatList, useWindowDimensions } from "react-native";

import type { Property, PropertyMedia } from "@/lib/types";
import { useTheme } from "@/theme";
import { Box } from "@/components/ui/box";
import { Image as GSImage } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Txt } from "@/components/ui/primitives";

type Slide = { key: string; uri: string };

const THUMB_SIZE = 56;

function toSlides(media: PropertyMedia[], images?: string[]): Slide[] {
  const fromMedia = media
    .filter((item) => item.url && item.type === "image")
    .map((item) => ({ key: item._id, uri: item.url }));
  if (fromMedia.length > 0) return fromMedia;
  return (images ?? [])
    .filter(Boolean)
    .map((uri, index) => ({ key: `img-${index}`, uri }));
}

/**
 * Cover image.
 *
 * One full-bleed hero that fills its box and crops (`resizeMode="cover"`), with
 * a thumbnail strip underneath that picks which photo is the cover. Tapping the
 * hero opens every photo full-screen. A swipeable pager is deliberately not used
 * here: it hides the rest of the photography and makes the hero feel like a
 * slideshow rather than the listing's cover.
 */
export function PropertyGallery({
  property,
  media,
}: {
  property: Pick<Property, "_id" | "title" | "images" | "thumbnail">;
  media: PropertyMedia[];
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [coverIndex, setCoverIndex] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const slides = React.useMemo(
    () =>
      toSlides(
        media,
        property.images ?? (property.thumbnail ? [property.thumbnail] : []),
      ),
    [media, property.images, property.thumbnail],
  );

  // Measured rather than assumed: the gallery is full-bleed today, but a
  // percentage-based image collapses if it is ever nested in padded content.
  const [containerWidth, setContainerWidth] = React.useState(width);
  // 4:3 is the classic listing cover ratio — tall enough to show a room, short
  // enough to leave the price and specs above the fold.
  const height = Math.min(Math.round(containerWidth * 0.75), 420);

  // Media arriving after the first render can leave coverIndex out of range.
  const activeIndex = Math.min(coverIndex, Math.max(0, slides.length - 1));
  const cover = slides[activeIndex];

  const openAll = () => {
    setLightboxIndex(activeIndex);
    setExpanded(true);
  };

  if (!cover) {
    return (
      <Box
        className="items-center justify-center gap-2 bg-accent"
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
        style={{ width: containerWidth, height }}
      >
        <Ionicons name="image-outline" size={28} color="#647771" />
        <Txt variant="small" tone="muted">
          No photos yet
        </Txt>
      </Box>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View all ${slides.length} photos`}
        onPress={openAll}
      >
        <Box
          onLayout={(event) =>
            setContainerWidth(event.nativeEvent.layout.width)
          }
          style={{ width: containerWidth, height }}
        >
          <GSImage
            source={{ uri: cover.uri }}
            resizeMode="cover"
            alt={property.title ?? "Listing photo"}
            style={{ width: containerWidth, height }}
          />
          {slides.length > 1 ? (
            <Box className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-md bg-black/50 px-2 py-1">
              <Ionicons name="images-outline" size={12} color="#FFFFFF" />
              <Txt variant="tiny" className="text-white">
                {activeIndex + 1} / {slides.length}
              </Txt>
            </Box>
          ) : null}
        </Box>
      </Pressable>

      {slides.length > 1 ? (
        <FlatList
          data={slides}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          // Only a handful of thumbs are ever on screen.
          initialNumToRender={6}
          windowSize={5}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
          renderItem={({ item, index }) => {
            const selected = index === activeIndex;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Use photo ${index + 1} as cover`}
                onPress={() => setCoverIndex(index)}
              >
                <Box
                  className={`overflow-hidden rounded-lg bg-accent ${
                    selected ? "border-2" : "border"
                  }`}
                  style={{
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    borderColor: selected ? theme.primary : theme.border,
                    opacity: selected ? 1 : 0.6,
                  }}
                >
                  <GSImage
                    source={{ uri: item.uri }}
                    resizeMode="cover"
                    alt={`Photo ${index + 1}`}
                    style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                  />
                </Box>
              </Pressable>
            );
          }}
        />
      ) : null}

      {expanded ? (
        <Lightbox
          slides={slides}
          title={property.title}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setExpanded(false)}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  slides,
  title,
  index,
  onIndex,
  onClose,
}: {
  slides: Slide[];
  title?: string;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const safeIndex = Math.min(index, Math.max(0, slides.length - 1));

  return (
    <Box className="absolute inset-0 z-50 bg-black">
      <Box className="flex-row items-center gap-3 px-4 pb-3 pt-15">
        <Txt
          variant="subheading"
          numberOfLines={1}
          style={{ flex: 1, color: "#FFFFFF" }}
        >
          {title ?? "Photos"}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photos"
          onPress={onClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </Box>

      {/* Only the lightbox swipes — the listing hero is a cover, not a pager. */}
      <FlatList
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={safeIndex}
        getItemLayout={(_data, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        onMomentumScrollEnd={(event) =>
          onIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <GSImage
            source={{ uri: item.uri }}
            resizeMode="contain"
            alt={item.key}
            style={{ width, height: "100%" }}
          />
        )}
      />

      <Box className="items-center py-6">
        <Txt variant="small" className="text-neutral-300">
          {safeIndex + 1} of {slides.length}
        </Txt>
      </Box>
    </Box>
  );
}

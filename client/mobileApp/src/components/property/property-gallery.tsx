import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { FlatList, useWindowDimensions } from "react-native";

import type { Property, PropertyMedia } from "@/lib/types";
import { Box } from "@/components/ui/box";
import { Image as GSImage } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Txt } from "@/components/ui/primitives";

type Slide = { key: string; uri: string };

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
 * Full-bleed swipeable gallery with a tap-to-expand lightbox — the mobile
 * equivalent of the web app's grid gallery plus its modal viewer.
 */
export function PropertyGallery({
  property,
  media,
}: {
  property: Pick<Property, "_id" | "title" | "images" | "thumbnail">;
  media: PropertyMedia[];
}) {
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const slides = React.useMemo(
    () =>
      toSlides(
        media,
        property.images ?? (property.thumbnail ? [property.thumbnail] : []),
      ),
    [media, property.images, property.thumbnail],
  );

  const height = Math.min(Math.round(width * 0.66), 360);

  if (slides.length === 0) {
    return (
      <Box
        className="items-center justify-center gap-2 bg-accent"
        style={{ height }}
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
        accessibilityLabel={`Show all ${slides.length} photos`}
        onPress={() => {
          setLightboxIndex(index);
          setExpanded(true);
        }}
      >
        <Box>
          <FlatList
            data={slides}
            keyExtractor={(item) => item.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            // Offscreen images are pointless for a one-at-a-time gallery.
            initialNumToRender={2}
            windowSize={3}
            getItemLayout={(_data, itemIndex) => ({
              length: width,
              offset: width * itemIndex,
              index: itemIndex,
            })}
            onMomentumScrollEnd={(event) =>
              setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <GSImage
                source={{ uri: item.uri }}
                resizeMode="cover"
                alt={item.key}
                style={{ width, height }}
              />
            )}
          />
          <Box className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-md bg-black/45 px-2 py-1">
            <Ionicons name="images-outline" size={12} color="#FFFFFF" />
            <Txt variant="tiny" className="text-white">
              {index + 1} / {slides.length}
            </Txt>
          </Box>
        </Box>
      </Pressable>

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
  title: string;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();

  return (
    <Box className="absolute inset-0 z-50 bg-black">
      <Box className="flex-row items-center gap-3 px-4 pb-3 pt-15">
        <Txt
          variant="subheading"
          numberOfLines={1}
          style={{ flex: 1, color: "#FFFFFF" }}
        >
          {title}
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

      <FlatList
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
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
          {index + 1} of {slides.length}
        </Txt>
      </Box>
    </Box>
  );
}

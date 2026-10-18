import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import type { Property, PropertyMedia } from "@/lib/types";
import { useTheme } from "@/theme";
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
  const theme = useTheme();
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
      <View
        style={{
          height,
          backgroundColor: theme.accent,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons
          name="image-outline"
          size={28}
          color={theme.foregroundMuted}
        />
        <Txt variant="small" tone="muted">
          No photos yet
        </Txt>
      </View>
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
        <View>
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
              <Image
                source={{ uri: item.uri }}
                style={{ width, height }}
                contentFit="cover"
                transition={200}
              />
            )}
          />
          <View style={[styles.counter, { backgroundColor: theme.overlay }]}>
            <Ionicons name="images-outline" size={12} color="#FFFFFF" />
            <Txt variant="tiny" style={styles.counterText}>
              {index + 1} / {slides.length}
            </Txt>
          </View>
        </View>
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
    <View style={[StyleSheet.absoluteFill, styles.lightbox]}>
      <View style={styles.lightboxHeader}>
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
      </View>

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
          <Image
            source={{ uri: item.uri }}
            style={{ width, height: "100%" }}
            contentFit="contain"
          />
        )}
      />

      <View style={styles.lightboxFooter}>
        <Txt variant="small" style={{ color: "#D8D8D8" }}>
          {index + 1} of {slides.length}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  counterText: { color: "#FFFFFF" },
  lightbox: { backgroundColor: "#000000", zIndex: 200 },
  lightboxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  lightboxFooter: { paddingVertical: 24, alignItems: "center" },
});

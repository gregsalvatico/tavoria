import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VideoCarousel from "./VideoCarousel";
import { uniqueMediaItems, type MediaItem } from "./mediaTypes";

type Props = {
  media: MediaItem[];
  aspectRatio?: number;
};

function pointerX(event: any) {
  const native = event?.nativeEvent ?? event;
  return native?.pageX ?? native?.clientX ?? event?.pageX ?? event?.clientX ?? 0;
}

/** A scrollbar-free, looping horizontal media strip for profile/detail pages. */
export default function MediaCarousel({ media, aspectRatio = 4 / 3 }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0, moved: false, pointerId: null as number | null });
  const scrollOffsetRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const normalizedMedia = useMemo(() => uniqueMediaItems(media), [media]);
  const [cardWidth, setCardWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const gap = TAVORIA.space.sm;
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const displayWidth = width >= 1024 ? 260 : Math.min(250, Math.max(190, width * 0.68));
  const visibleCards = viewportWidth > 0
    ? Math.max(1, Math.floor((viewportWidth + gap) / (displayWidth + gap)))
    : 1;
  const shouldLoop = viewportWidth > 0 && normalizedMedia.length > 1 && normalizedMedia.length > visibleCards;
  const loopedMedia = useMemo(
    () => shouldLoop ? [normalizedMedia[normalizedMedia.length - 1], ...normalizedMedia, normalizedMedia[0]] : normalizedMedia,
    [normalizedMedia, shouldLoop]
  );

  useEffect(() => {
    if (shouldLoop && cardWidth > 0) {
      scrollRef.current?.scrollTo({ x: cardWidth + gap, animated: false });
    }
  }, [cardWidth, gap, shouldLoop]);

  const handlePointerDown = (event: any) => {
    if (!isDesktop || !shouldLoop) return;
    dragRef.current = {
      active: true,
      startX: pointerX(event),
      startOffset: scrollOffsetRef.current,
      moved: false,
      pointerId: null,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: any) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const distance = drag.startX - pointerX(event);
    if (Math.abs(distance) > 4) drag.moved = true;
    if (!drag.moved) return;
    const nextOffset = Math.max(0, drag.startOffset + distance);
    scrollOffsetRef.current = nextOffset;
    scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
  };

  const finishPointerDrag = (event?: any) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const moved = drag.moved;
    drag.active = false;
    if (moved && cardWidth > 0) {
      const step = cardWidth + gap;
      const snappedOffset = Math.max(0, Math.round(scrollOffsetRef.current / step) * step);
      scrollOffsetRef.current = snappedOffset;
      scrollRef.current?.scrollTo({ x: snappedOffset, animated: true });
    }
    setDragging(false);
  };

  const handleScroll = (event: any) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
  };

  if (!normalizedMedia.length) return null;

  const handleMomentumEnd = (offsetX: number) => {
    if (!shouldLoop || !cardWidth) return;
    const step = cardWidth + gap;
    const index = Math.round(offsetX / step);
    if (index === 0) {
      scrollRef.current?.scrollTo({ x: normalizedMedia.length * step, animated: false });
    } else if (index === loopedMedia.length - 1) {
      scrollRef.current?.scrollTo({ x: step, animated: false });
    }
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        style={isDesktop ? ({ cursor: dragging ? "grabbing" : "grab", userSelect: "none" } as any) : undefined}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onPointerDown={isDesktop ? handlePointerDown : undefined}
        onPointerMove={isDesktop ? handlePointerMove : undefined}
        onPointerUp={isDesktop ? finishPointerDrag : undefined}
        onPointerCancel={isDesktop ? finishPointerDrag : undefined}
        horizontal
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        snapToInterval={cardWidth ? cardWidth + gap : undefined}
        snapToAlignment="start"
        contentContainerStyle={{ gap }}
        onLayout={(event) => {
          setViewportWidth(event.nativeEvent.layout.width);
          setCardWidth(displayWidth || event.nativeEvent.layout.width);
        }}
        onMomentumScrollEnd={(event) => handleMomentumEnd(event.nativeEvent.contentOffset.x)}
      >
        {loopedMedia.map((item, index) => (
          <View
            key={`${item.kind}-${item.url}-${index}`}
            onLayout={index === 0 ? (event) => setCardWidth(event.nativeEvent.layout.width) : undefined}
            style={[styles.card, { aspectRatio, width: displayWidth }]}
          >
            {item.kind === "photo" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("talent.photos")}
                onPress={() => {
                  if (dragRef.current.moved) {
                    dragRef.current.moved = false;
                    return;
                  }
                  setPhotoPreview(item.url);
                }}
                style={styles.content}
              >
                <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
              </Pressable>
            ) : (
              <VideoCarousel urls={[item.url]} aspectRatio={aspectRatio} />
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={Boolean(photoPreview)} transparent animationType="fade" onRequestClose={() => setPhotoPreview(null)}>
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={() => setPhotoPreview(null)}
            style={styles.backdrop}
          />
          {photoPreview ? <Image source={{ uri: photoPreview }} resizeMode="contain" style={styles.fullImage} /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={() => setPhotoPreview(null)}
            style={styles.close}
          >
            <Feather name="x" size={24} color={TAVORIA.color.paper} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  card: { backgroundColor: TAVORIA.color.navy, borderRadius: TAVORIA.radius.medium, overflow: "hidden" },
  content: { height: "100%", width: "100%" },
  image: { height: "100%", width: "100%" },
  modal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  close: { elevation: 10, padding: 12, position: "absolute", right: 24, top: 24, zIndex: 10 },
  fullImage: { height: "82%", maxWidth: 960, width: "100%" },
});

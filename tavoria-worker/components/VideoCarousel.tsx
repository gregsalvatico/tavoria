import { Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
  DimensionValue,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";

type Props = {
  urls: (string | null)[];
  labels?: string[];
  width?: DimensionValue;
  height?: DimensionValue;
  aspectRatio?: number;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

const uniqueUrls = (urls: (string | null)[]) =>
  Array.from(new Set(urls.filter((url): url is string => Boolean(url))));

export default function VideoCarousel({
  urls,
  labels = [],
  width = "100%",
  height,
  aspectRatio = 16 / 9,
  showLabel = false,
  style,
}: Props) {
  const videoUrls = uniqueUrls(urls);
  if (!videoUrls.length) return null;
  return (
    <VideoCarouselContent
      videoUrls={videoUrls}
      labels={labels}
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      showLabel={showLabel}
      style={style}
    />
  );
}

function VideoCarouselContent({
  videoUrls,
  labels,
  width,
  height,
  aspectRatio,
  showLabel,
  style,
}: {
  videoUrls: string[];
  labels: string[];
  width: DimensionValue;
  height?: DimensionValue;
  aspectRatio: number;
  showLabel: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const activeUrl = videoUrls[Math.min(index, Math.max(0, videoUrls.length - 1))];
  const player = useVideoPlayer(activeUrl ?? "", (instance) => {
    instance.muted = true;
  });

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, videoUrls.length - 1)));
  }, [videoUrls.length]);

  const close = () => {
    // A native player can already be unloaded while the modal is closing.
    // Keep dismissal reliable even when pause() rejects or throws.
    try {
      player.pause();
    } catch {}
    setOpen(false);
  };

  const openPreview = () => {
    setOpen(true);
    try {
      player.muted = false;
      player.play();
    } catch {}
  };

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(videoUrls.length - 1, next)));
  };

  return (
    <View style={[styles.wrap, { width }, style]}>
      <View style={[styles.preview, height !== undefined ? { height } : { aspectRatio }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("talent.videos")}
          onPress={openPreview}
          style={styles.videoButton}
        >
          {/* expo-video does not support two VideoViews sharing one player on
              mobile. Leave the thumbnail view unmounted while the modal owns
              the player, otherwise playback can pause or detach. */}
          {!open ? <VideoView player={player} style={styles.video} nativeControls={false} contentFit="cover" /> : null}
          <View style={styles.playButton}>
            <Feather name="play" size={15} color={TAVORIA.color.paper} />
          </View>
        </Pressable>

        {videoUrls.length > 1 ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous video"
              disabled={index === 0}
              onPress={() => goTo(index - 1)}
              style={[styles.carouselButton, styles.carouselButtonLeft, index === 0 && styles.disabled]}
            >
              <Feather name="chevron-left" size={17} color={TAVORIA.color.navy} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next video"
              disabled={index === videoUrls.length - 1}
              onPress={() => goTo(index + 1)}
              style={[styles.carouselButton, styles.carouselButtonRight, index === videoUrls.length - 1 && styles.disabled]}
            >
              <Feather name="chevron-right" size={17} color={TAVORIA.color.navy} />
            </Pressable>
            <View style={styles.dots}>
              {videoUrls.map((url, dotIndex) => (
                <View key={url} style={[styles.dot, dotIndex === index && styles.dotActive]} />
              ))}
            </View>
          </>
        ) : null}
      </View>

      {showLabel && labels[index] ? (
        <Text style={styles.caption} numberOfLines={1}>{labels[index]}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modal}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("talent.close")} onPress={close} style={styles.backdrop} />
          {open ? (
            <VideoView player={player} style={styles.fullVideo} nativeControls allowsFullscreen contentFit="contain" />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={close}
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
  wrap: { gap: 7 },
  preview: {
    backgroundColor: TAVORIA.color.navy,
    borderRadius: TAVORIA.radius.medium,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  videoButton: { alignItems: "center", height: "100%", justifyContent: "center", width: "100%" },
  video: { height: "100%", width: "100%" },
  playButton: {
    alignItems: "center",
    backgroundColor: "rgba(14,26,36,0.76)",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    left: "50%",
    marginLeft: -21,
    marginTop: -21,
    position: "absolute",
    top: "50%",
    width: 42,
  },
  carouselButton: {
    alignItems: "center",
    backgroundColor: "rgba(247,244,238,0.92)",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    marginTop: -17,
    position: "absolute",
    top: "50%",
    width: 34,
  },
  carouselButtonLeft: { left: 8 },
  carouselButtonRight: { right: 8 },
  disabled: { opacity: 0.38 },
  dots: { alignItems: "center", bottom: 9, flexDirection: "row", gap: 5, justifyContent: "center", left: 0, position: "absolute", right: 0 },
  dot: { backgroundColor: "rgba(247,244,238,0.65)", borderRadius: 999, height: 5, width: 5 },
  dotActive: { backgroundColor: TAVORIA.color.orange, width: 14 },
  caption: { color: "#626B78", fontSize: 12 },
  modal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  close: { elevation: 10, padding: 12, position: "absolute", right: 24, top: 24, zIndex: 10 },
  fullVideo: { height: "82%", maxWidth: 960, width: "100%" },
});

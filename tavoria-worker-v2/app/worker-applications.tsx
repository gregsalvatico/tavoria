// Worker's "My applications" — list of shifts I applied to, with venue response status.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fillTemplate, telUrl, whatsAppUrl } from "../lib/contact";
import {
  getApplicationsForCurrentWorker,
  getCurrentWorkerFull,
} from "../lib/db";
import { t } from "../lib/i18n";
import { localizeRoles } from "../lib/positions";

const WORKER_LAST_SEEN_KEY = "gigi.worker.apps_last_seen";

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  venue_id: string;
  shift_id?: string;
  venue?: {
    id: string;
    name: string;
    type?: string;
    city?: string;
    photo_url?: string;
    venue_style?: string;
    phone?: string;
  };
  shift?: {
    id: string;
    roles?: string[];
    hours_start?: string;
    hours_end?: string;
    pay_amount?: number;
    pay_unit?: string;
    start_when?: string;
    start_date?: string;
  };
};

const VENUE_CAFE = require("../assets/venue-cafe.png");
const VENUE_TYPE_PHOTOS: Record<string, number> = {
  cafe: VENUE_CAFE,
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
};

type Filter = "all" | "waiting" | "interview" | "hired" | "declined";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting" },
  { id: "interview", label: "Interview" },
  { id: "hired", label: "Hired" },
  { id: "declined", label: "Declined" },
];

const STATUS_TO_FILTER: Record<string, Filter> = {
  pending: "waiting",
  starred: "waiting",
  interview_requested: "interview",
  hired: "hired",
  declined: "declined",
};

export default function WorkerApplications() {
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [workerName, setWorkerName] = useState<string>("");

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const rows = await getApplicationsForCurrentWorker();
      setApps(rows as ApplicationRow[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Mark "right now" as last-seen so the red "new" corner badges on the
    // home pills clear when the worker returns.
    AsyncStorage.setItem(WORKER_LAST_SEEN_KEY, new Date().toISOString()).catch(
      () => {}
    );
    // Fetch own first name once for prefilling WhatsApp messages
    (async () => {
      try {
        const w = await getCurrentWorkerFull();
        if (w?.first_name) setWorkerName(w.first_name as string);
      } catch {}
    })();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: apps.length,
      waiting: 0,
      interview: 0,
      hired: 0,
      declined: 0,
    };
    apps.forEach((a) => {
      const f = STATUS_TO_FILTER[a.status];
      if (f && f !== "all") c[f]++;
    });
    return c;
  }, [apps]);

  const filtered =
    filter === "all"
      ? apps
      : apps.filter((a) => STATUS_TO_FILTER[a.status] === filter);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>M</Text>y applications
        </Text>
        <Pressable onPress={() => load()} hitSlop={12} style={styles.iconBtn}>
          <Feather name="refresh-cw" size={20} color="#0E1A24" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0, maxHeight: 48 }}
      >
        {FILTERS.map((f) => {
          const on = filter === f.id;
          const count = counts[f.id];
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterChip, on && styles.filterChipOn]}
            >
              <Text style={[styles.filterChipTxt, on && styles.filterChipTxtOn]}>
                {f.label}{" "}
                <Text
                  style={[
                    styles.filterChipCount,
                    on && styles.filterChipCountOn,
                  ]}
                >
                  ({count})
                </Text>
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#F0531C" size="large" />
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyWrap}>
            <Feather name="alert-circle" size={32} color="#993556" />
            <Text style={styles.emptyTxt}>{errorMsg}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="send" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "No applications yet"
                : `No applications in "${
                    FILTERS.find((f) => f.id === filter)?.label
                  }"`}
            </Text>
            {filter === "all" && (
              <>
                <Text style={styles.emptyTxt}>
                  Browse shifts and apply to one — they show up here.
                </Text>
                <Pressable
                  onPress={() => router.push("/discover")}
                  style={styles.emptyCta}
                >
                  <Feather name="search" size={16} color="white" />
                  <Text style={styles.emptyCtaTxt}>Browse shifts</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          filtered.map((a) => (
            <ApplicationCard
              key={a.id}
              a={a}
              router={router}
              workerName={workerName}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ApplicationCard({
  a,
  router,
  workerName,
}: {
  a: ApplicationRow;
  router: ReturnType<typeof useRouter>;
  workerName: string;
}) {
  const v = a.venue;
  const s = a.shift;
  const typeKey = (v?.type || "cafe")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace("café", "cafe");
  const photo = v?.photo_url
    ? { uri: v.photo_url }
    : VENUE_TYPE_PHOTOS[typeKey] ?? VENUE_CAFE;

  const payStr =
    s?.pay_amount && s?.pay_unit
      ? `€${s.pay_amount}/${shortUnit(s.pay_unit)}`
      : null;
  const roleStr = localizeRoles(s?.roles ?? []).slice(0, 2).join(" · ") || "Shift";

  // Reveal contact when venue has acted positively
  const contactUnlocked =
    a.status === "interview_requested" || a.status === "hired";

  return (
    <View style={styles.rowWrap}>
      <Pressable
        onPress={() => {
          if (s?.id) {
            router.push({ pathname: "/shift-detail", params: { id: s.id } });
          }
        }}
        style={styles.row}
      >
        <Image source={photo} style={styles.thumb} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <View style={styles.line1}>
            <Text style={styles.venueName} numberOfLines={1}>
              {v?.name || "Venue"}
            </Text>
            {payStr && <Text style={styles.pay}>{payStr}</Text>}
          </View>
          <Text style={styles.role} numberOfLines={1}>
            {roleStr}
          </Text>
          <View style={styles.line3}>
            <StatusPill status={a.status} />
            <Text style={styles.timeTxt}>· {formatWhen(a.created_at)}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color="#9CA3AF" />
      </Pressable>

      {contactUnlocked && (
        <View style={styles.contactRow}>
          {v?.phone ? (
            <Pressable
              style={styles.waBtn}
              onPress={() => {
                const msg = fillTemplate(
                  t("contact.wa_msg_worker_to_venue"),
                  { name: workerName || "Tavoria", venue: v?.name ?? "" }
                );
                const url = whatsAppUrl(v.phone!, msg);
                if (url) Linking.openURL(url).catch(() => {});
              }}
            >
              <Feather name="message-circle" size={13} color="white" />
              <Text style={styles.waBtnTxt}>{t("contact.whatsapp")}</Text>
            </Pressable>
          ) : null}
          {v?.phone ? (
            <Pressable
              style={styles.callBtn}
              onPress={() => {
                const url = telUrl(v.phone!);
                if (url) Linking.openURL(url).catch(() => {});
              }}
            >
              <Feather name="phone-call" size={13} color="#185FA5" />
              <Text style={styles.callBtnTxt}>{t("contact.call")}</Text>
            </Pressable>
          ) : null}
          {v?.id && (
            <Pressable
              style={styles.venueBtn}
              onPress={() =>
                router.push({
                  pathname: "/venue-board",
                  params: { venueId: v.id },
                })
              }
            >
              <Feather name="briefcase" size={13} color="#0E1A24" />
              <Text style={styles.venueBtnTxt}>{t("contact.view_venue")}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending: {
      bg: "#F1EFE8",
      fg: "#6B7280",
      label: "Waiting for response",
    },
    starred: { bg: "#FCF6E8", fg: "#854F0B", label: "You're starred" },
    interview_requested: {
      bg: "#E6F1FB",
      fg: "#185FA5",
      label: "Interview requested",
    },
    hired: { bg: "#EAF3DE", fg: "#3B6D11", label: "Hired" },
    declined: { bg: "#FCEBEB", fg: "#993556", label: "Declined" },
  };
  const s = map[status] ?? { bg: "#F1EFE8", fg: "#6B7280", label: status };
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusTxt, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

function shortUnit(u: string) {
  if (u === "hour") return "h";
  if (u === "day") return "d";
  if (u === "week") return "wk";
  if (u === "month") return "mo";
  return u;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: { padding: 4, width: 32 },
  h1: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },

  filterRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  filterChipOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  filterChipTxt: { fontSize: 13, fontWeight: "700", color: "#0E1A24" },
  filterChipTxtOn: { color: "white" },
  filterChipCount: { fontWeight: "500", color: "#9CA3AF" },
  filterChipCountOn: { color: "rgba(255,255,255,0.7)" },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },
  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E1A24",
    marginTop: 8,
  },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  emptyCta: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0531C",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyCtaTxt: { color: "white", fontWeight: "800", fontSize: 14 },

  rowWrap: { marginBottom: 8 },
  contactRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    marginTop: -8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  waBtnTxt: { color: "white", fontWeight: "800", fontSize: 12 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E6F1FB",
    borderWidth: 1,
    borderColor: "#185FA5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  callBtnTxt: { color: "#185FA5", fontWeight: "800", fontSize: 12 },
  venueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(11,15,26,0.20)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  venueBtnTxt: { color: "#0E1A24", fontWeight: "800", fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#E5E5E0",
  },
  line1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  venueName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.2,
  },
  pay: { fontSize: 14, fontWeight: "900", color: "#F0531C" },
  role: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginTop: 3 },
  line3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  timeTxt: { fontSize: 11, color: "#9CA3AF" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusTxt: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

// Searchable country picker modal. ISO 3166-1 alpha-2 list, alphabetical.

import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COUNTRIES, Country, flagFromCode } from "../lib/countries";

type Props = {
  visible: boolean;
  selectedCode?: string | null;
  onClose: () => void;
  onSelect: (c: Country) => void;
  title?: string;
};

export default function CountryPicker({
  visible,
  selectedCode,
  onClose,
  onSelect,
  title = "Choose country",
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().startsWith(q)
    );
  }, [query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#0B0F1A" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search…"
            placeholderTextColor="#9CA3AF"
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x-circle" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.code}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const on = selectedCode === item.code;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={[styles.row, on && styles.rowOn]}
              >
                <Text style={styles.flag}>{flagFromCode(item.code)}</Text>
                <Text style={[styles.name, on && styles.nameOn]}>
                  {item.name}
                </Text>
                {on && <Feather name="check" size={18} color="#FF5A1F" />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTxt}>No country matches "{query}"</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAF7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  title: { fontSize: 17, fontWeight: "800", color: "#0B0F1A" },
  closeBtn: { padding: 4 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  search: { flex: 1, fontSize: 16, color: "#0B0F1A", padding: 0 },

  listContent: { paddingHorizontal: 14, paddingBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  rowOn: { backgroundColor: "#FFF4EE" },
  flag: { fontSize: 22 },
  name: { flex: 1, fontSize: 15, color: "#0B0F1A", fontWeight: "500" },
  nameOn: { color: "#FF5A1F", fontWeight: "700" },

  emptyWrap: { paddingVertical: 40, alignItems: "center" },
  emptyTxt: { color: "#6B7280", fontSize: 14 },
});

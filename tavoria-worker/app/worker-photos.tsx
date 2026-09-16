import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "../components/ActionButton";
import ResponsiveModal from "../components/ResponsiveModal";
import { FlowTopBar } from "../components/PagePrimitives";
import StickyFooter from "../components/StickyFooter";
import {
  getCurrentWorkerDocuments,
  type WorkerDocumentRecord,
  uploadWorkerDocument,
} from "../lib/db";
import { t } from "../lib/i18n";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";

type SelectedDocument = {
  uri: string;
  name?: string;
  mimeType?: string;
  size?: number;
};

export default function WorkerPhotos() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [documents, setDocuments] = useState<WorkerDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedDocument | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCurrentWorkerDocuments()
      .then((rows) => {
        if (!cancelled) setDocuments(rows);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason?.message ?? t("talent.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/candidate");
  };

  const pickDocument = async () => {
    setError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const defaultName = (asset.name ?? t("docs.document_default_name")).replace(/\.[^.]+$/, "").trim();
      setSelectedFile({
        uri: asset.uri,
        name: asset.name ?? undefined,
        mimeType: asset.mimeType ?? undefined,
        size: asset.size ?? undefined,
      });
      setDocumentName(defaultName || t("docs.document_default_name"));
      setNameError("");
    } catch (reason: any) {
      setError(reason?.message ?? t("talent.uploadError"));
    }
  };

  const saveDocument = async () => {
    const name = documentName.trim();
    if (!selectedFile) return;
    if (!name) {
      setNameError(t("docs.name_required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await uploadWorkerDocument({
        documentType: "document",
        documentName: name,
        uri: selectedFile.uri,
        originalName: selectedFile.name,
        mimeType: selectedFile.mimeType,
        fileSize: selectedFile.size,
      });
      setDocuments((current) => [saved, ...current]);
      setSelectedFile(null);
      setDocumentName("");
      setNameError("");
    } catch (reason: any) {
      setError(reason?.message ?? t("talent.uploadError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FlowTopBar
        onBack={close}
        center={<Text style={styles.topTitle}>{t("docs.title")}</Text>}
      />

      <ScrollView
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.title}>
          <Text style={styles.accent}>{t("docs.title").charAt(0)}</Text>
          {t("docs.title").slice(1)}
        </Text>
        <Text style={styles.intro}>{t("docs.intro")}</Text>

        <ActionButton
          label={t("docs.add_document")}
          icon="plus"
          onPress={() => void pickDocument()}
          style={styles.addButton}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("docs.saved_documents")}</Text>
          {loading ? (
            <ActivityIndicator color={TAVORIA.color.orange} style={styles.loading} />
          ) : documents.length ? (
            <View style={styles.list}>
              {documents.map((document) => (
                <View key={document.id} style={styles.documentRow}>
                  <View style={styles.documentIcon}>
                    <Feather
                      name={document.mime_type?.startsWith("image/") ? "image" : "file-text"}
                      size={18}
                      color={TAVORIA.color.orange}
                    />
                  </View>
                  <View style={styles.documentCopy}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {document.display_name || document.original_name || t("docs.document_default_name")}
                    </Text>
                    {document.original_name && document.original_name !== document.display_name ? (
                      <Text style={styles.documentFile} numberOfLines={1}>{document.original_name}</Text>
                    ) : null}
                  </View>
                  <Feather name="check-circle" size={18} color={TAVORIA.color.success} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="file-text" size={20} color={TAVORIA.color.muted} />
              <Text style={styles.emptyText}>{t("docs.empty")}</Text>
            </View>
          )}
        </View>

        <View style={styles.tip}>
          <Feather name="lock" size={15} color="#854F0B" />
          <Text style={styles.tipText}>{t("docs.encrypted_tip")}</Text>
        </View>
      </ScrollView>

      <StickyFooter desktopRow>
        <ActionButton label={t("common.done")} icon="check" onPress={close} />
      </StickyFooter>

      <ResponsiveModal
        visible={Boolean(selectedFile)}
        onClose={() => {
          if (!saving) setSelectedFile(null);
        }}
        panelStyle={styles.documentModalPanel}
      >
        <View style={styles.sheet}>
          {!isDesktop ? <View style={styles.grabber} /> : null}
          <Text style={styles.sheetTitle}>{t("docs.name_title")}</Text>
          <Text style={styles.sheetSub} numberOfLines={1}>{selectedFile?.name}</Text>
          <Text style={styles.inputLabel}>{t("docs.document_name")}</Text>
          <TextInput
            autoFocus
            value={documentName}
            onChangeText={(value) => {
              setDocumentName(value);
              if (nameError) setNameError("");
            }}
            placeholder={t("docs.document_name_placeholder")}
            placeholderTextColor={TAVORIA.color.muted}
            style={[styles.input, nameError && styles.inputError]}
            maxLength={120}
            editable={!saving}
          />
          {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
          <ActionButton
            label={t("docs.save_document")}
            icon="check"
            loading={saving}
            onPress={() => void saveDocument()}
            style={styles.sheetPrimary}
          />
          <Pressable
            disabled={saving}
            onPress={() => setSelectedFile(null)}
            style={({ hovered, pressed }) => [
              styles.cancel,
              hovered && styles.cancelHovered,
              pressed && styles.cancelPressed,
              saving && styles.cancelDisabled,
            ]}
          >
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </ResponsiveModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  documentModalPanel: { backgroundColor: TAVORIA.color.white, maxWidth: 560 },
  safe: { backgroundColor: TAVORIA.color.paperDeep, flex: 1 },
  topTitle: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 22 },
  content: { alignSelf: "center", paddingBottom: 32, paddingHorizontal: 20, paddingTop: 8, width: "100%" },
  contentDesktop: { maxWidth: 840, paddingHorizontal: 24 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 30, textAlign: "center" },
  accent: { color: TAVORIA.color.orange },
  intro: { color: TAVORIA.color.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" },
  addButton: { alignSelf: "center", marginTop: 22 },
  error: { color: TAVORIA.color.error, fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: "center" },
  section: { marginTop: 30 },
  sectionLabel: { color: TAVORIA.color.muted, fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  loading: { marginVertical: 28 },
  list: { gap: 8 },
  documentRow: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10 },
  documentIcon: { alignItems: "center", backgroundColor: TAVORIA.color.orangeSoft, borderRadius: TAVORIA.radius.small, height: 38, justifyContent: "center", width: 38 },
  documentCopy: { flex: 1, minWidth: 0 },
  documentName: { color: TAVORIA.color.navy, fontSize: 14, fontWeight: "700" },
  documentFile: { color: TAVORIA.color.muted, fontSize: 11, marginTop: 3 },
  empty: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, gap: 8, paddingHorizontal: 20, paddingVertical: 26 },
  emptyText: { color: TAVORIA.color.muted, fontSize: 13, textAlign: "center" },
  tip: { alignItems: "flex-start", backgroundColor: "#FAEEDA", borderRadius: TAVORIA.radius.medium, flexDirection: "row", gap: 8, marginTop: 18, paddingHorizontal: 14, paddingVertical: 12 },
  tipText: { color: "#854F0B", flex: 1, fontSize: 12, lineHeight: 17 },
  modalBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1 },
  sheet: { backgroundColor: TAVORIA.color.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 10 },
  grabber: { alignSelf: "center", backgroundColor: "rgba(14,26,36,0.18)", borderRadius: 2, height: 4, marginBottom: 16, width: 36 },
  sheetTitle: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 25 },
  sheetSub: { color: TAVORIA.color.muted, fontSize: 12, marginTop: 5 },
  inputLabel: { color: TAVORIA.color.muted, fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 0.8, marginTop: 20, textTransform: "uppercase" },
  input: { backgroundColor: TAVORIA.color.paper, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.small, borderWidth: 1, color: TAVORIA.color.navy, fontSize: 15, marginTop: 7, minHeight: 48, paddingHorizontal: 14 },
  inputError: { borderColor: TAVORIA.color.error },
  fieldError: { color: TAVORIA.color.error, fontSize: 12, marginTop: 5 },
  sheetPrimary: { marginTop: 20, width: "100%" },
  cancel: { alignItems: "center", borderRadius: TAVORIA.radius.small, marginTop: 8, paddingVertical: 12 },
  cancelHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  cancelPressed: { opacity: 0.72 },
  cancelDisabled: { opacity: 0.45 },
  cancelText: { color: TAVORIA.color.muted, fontSize: 14, fontWeight: "700" },
});

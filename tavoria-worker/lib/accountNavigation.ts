import { Feather } from "@expo/vector-icons";

export type AccountMenuRole = "venue" | "worker";
export type AccountMenuActionId = "share" | "language" | "change_pin" | "contact";

export type AccountMenuAction = {
  id: AccountMenuActionId;
  icon: keyof typeof Feather.glyphMap;
  labelKey: string;
  detailKey?: string;
};

export function getAccountMenuSections(role: AccountMenuRole): {
  roleActions: AccountMenuAction[];
  commonActions: AccountMenuAction[];
} {
  const roleActions: AccountMenuAction[] = [
    ...(role === "venue"
      ? [{
          id: "share" as const,
          icon: "share-2" as const,
          labelKey: "home_in.share_gigi",
        }]
      : []),
  ];

  return {
    roleActions,
    commonActions: [
      { id: "language", icon: "globe", labelKey: "language.pick" },
      { id: "change_pin", icon: "key", labelKey: "change_pin.drawer", detailKey: "change_pin.drawer_detail" },
      { id: "contact", icon: "mail", labelKey: "team_contact.title" },
    ],
  };
}

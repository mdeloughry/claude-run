export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgSurface: string;
  bgHover: string;
  bgSelected: string;
  bgCode: string;
  bgInput: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentHover: string;
  accentText: string;
  userBubble: string;
  userText: string;
  assistantBubble: string;
  assistantText: string;
  scrollbar: string;
  scrollbarHover: string;
}

export interface Theme {
  id: string;
  name: string;
  colorScheme: "dark" | "light";
  colors: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: "claude",
    name: "Claude",
    colorScheme: "dark",
    colors: {
      bg: "#1a1714",
      bgSecondary: "#1a1714",
      bgSurface: "#242019",
      bgHover: "#2a2622",
      bgSelected: "rgba(215, 118, 85, 0.18)",
      bgCode: "#1c1916",
      bgInput: "#242019",
      text: "#ece8e1",
      textSecondary: "#b8b0a4",
      textMuted: "#8a8078",
      textFaint: "#5e564e",
      border: "rgba(90, 80, 70, 0.4)",
      borderSubtle: "rgba(90, 80, 70, 0.25)",
      accent: "#D77655",
      accentHover: "#e08a6c",
      accentText: "#fff3ee",
      userBubble: "rgba(215, 118, 85, 0.65)",
      userText: "#fff3ee",
      assistantBubble: "rgba(168, 148, 122, 0.25)",
      assistantText: "#ece8e1",
      scrollbar: "#3a3530",
      scrollbarHover: "#504840",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    colorScheme: "dark",
    colors: {
      bg: "#09090b",
      bgSecondary: "#09090b",
      bgSurface: "#18181b",
      bgHover: "#1c1c20",
      bgSelected: "rgba(14, 116, 144, 0.3)",
      bgCode: "#18181b",
      bgInput: "#18181b",
      text: "#f4f4f5",
      textSecondary: "#d4d4d8",
      textMuted: "#71717a",
      textFaint: "#3f3f46",
      border: "rgba(39, 39, 42, 0.6)",
      borderSubtle: "rgba(39, 39, 42, 0.4)",
      accent: "#6366f1",
      accentHover: "#818cf8",
      accentText: "#e0e7ff",
      userBubble: "rgba(79, 70, 229, 0.8)",
      userText: "#e0e7ff",
      assistantBubble: "rgba(14, 116, 144, 0.5)",
      assistantText: "#f4f4f5",
      scrollbar: "#27272a",
      scrollbarHover: "#3f3f46",
    },
  },
  {
    id: "dawn",
    name: "Dawn",
    colorScheme: "light",
    colors: {
      bg: "#FAF9F5",
      bgSecondary: "#FAF9F5",
      bgSurface: "#F0EEE8",
      bgHover: "#EBE9E3",
      bgSelected: "rgba(193, 95, 60, 0.12)",
      bgCode: "#F0EEE8",
      bgInput: "#F0EEE8",
      text: "#1F1E1D",
      textSecondary: "#4a4540",
      textMuted: "#7a7268",
      textFaint: "#a8a098",
      border: "rgba(180, 170, 158, 0.4)",
      borderSubtle: "rgba(180, 170, 158, 0.25)",
      accent: "#C15F3C",
      accentHover: "#a84e2e",
      accentText: "#ffffff",
      userBubble: "rgba(193, 95, 60, 0.85)",
      userText: "#ffffff",
      assistantBubble: "rgba(220, 210, 195, 0.5)",
      assistantText: "#1F1E1D",
      scrollbar: "#c8c0b6",
      scrollbarHover: "#b0a898",
    },
  },
];

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

import pernas from "@/assets/ex/pernas.jpg";
import peito from "@/assets/ex/peito.jpg";
import costas from "@/assets/ex/costas.jpg";
import ombros from "@/assets/ex/ombros.jpg";
import bracos from "@/assets/ex/bracos.jpg";
import core from "@/assets/ex/core.jpg";
import gluteos from "@/assets/ex/gluteos.jpg";
import cardio from "@/assets/ex/cardio.jpg";
import pernasVideo from "@/assets/ex/pernas.mp4.asset.json";
import peitoVideo from "@/assets/ex/peito.mp4.asset.json";
import ombrosVideo from "@/assets/ex/ombros.mp4.asset.json";

type Media = { image: string; video?: string; label: string };

// Ilustrações com bonecos 3D (sem pessoas reais), escolhidas pelo nome/grupo do exercício.
const groups: { keys: string[]; media: Media }[] = [
  {
    keys: ["glute", "glúte", "quadril", "hip", "elevação pélvica", "abdu"],
    media: { image: gluteos, label: "Glúteos" },
  },
  {
    keys: [
      "agach",
      "leg",
      "perna",
      "quadr",
      "posterior",
      "panturr",
      "afundo",
      "stiff",
      "extensora",
      "flexora",
      "squat",
    ],
    media: { image: pernas, video: pernasVideo.url, label: "Pernas" },
  },
  {
    keys: ["supino", "peit", "crucif", "flexão", "chest", "peck", "voador"],
    media: { image: peito, video: peitoVideo.url, label: "Peito" },
  },
  {
    keys: ["remada", "costa", "puxada", "pulldown", "barra fixa", "dorsal", "row"],
    media: { image: costas, label: "Costas" },
  },
  {
    keys: ["ombro", "desenvolvimento", "elevação lateral", "deltoid", "militar"],
    media: { image: ombros, video: ombrosVideo.url, label: "Ombros" },
  },
  {
    keys: ["bíceps", "biceps", "tríceps", "triceps", "rosca", "braço", "antebraço"],
    media: { image: bracos, label: "Braços" },
  },
  { keys: ["abdom", "prancha", "core", "lombar", "oblíq"], media: { image: core, label: "Core" } },
  {
    keys: ["cardio", "esteira", "bike", "bicicleta", "corrida", "caminhada", "elíptico", "hiit"],
    media: { image: cardio, label: "Cardio" },
  },
];

export function exerciseMedia(name: string, muscleGroup?: string | null): Media | null {
  const text = `${name} ${muscleGroup ?? ""}`.toLowerCase();
  return groups.find((g) => g.keys.some((k) => text.includes(k)))?.media ?? null;
}

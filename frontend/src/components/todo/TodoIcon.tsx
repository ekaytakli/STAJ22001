const paths = {
  chevron: "M6 9l6 6 6-6",
  filter: "M4 7h16M7 12h10M10 17h4",
  tree: "M12 2L5 11h4l-6 7h7v4h4v-4h7l-6-7h4L12 2z",
  play: "M8 5l11 7-11 7V5z",
  pause: "M8 5v14M16 5v14",
  reset: "M3 11a9 9 0 1 1 2 7M3 4v7h7",
  download: "M12 3v12M7 10l5 5 5-5M4 17v4h16v-4",
  compact: "M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1",
  keyboard: "M3 5h18v14H3V5zM7 9h.01M11 9h.01M15 9h.01M7 13h.01M11 13h6",
  check: "M5 12l4 4L19 6",
  plus: "M12 5v14M5 12h14",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  clock: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  calendar: "M8 3v4M16 3v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1",
  folder: "M3 7V5h7l2 3h9v12H3V7z",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  logout: "M9 4H4v16h5M10 12h11M17 8l4 4-4 4",
  edit: "M14 5l5 5M4 20l5-1L21 7l-5-5L4 14v6z",
  trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7",
  arrow: "M5 12h14M14 7l5 5-5 5",
  leaf: "M5 19C-1 4 12 2 21 3c0 11-3 17-12 15M5 21L17 8",
  close: "M6 6l12 12M18 6L6 18",
} as const;
export default function TodoIcon({
  name,
  size = 20,
}: {
  name: keyof typeof paths;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

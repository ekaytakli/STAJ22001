export type TreeKind = "pine" | "oak" | "blossom";

// Vector trees keep the garden sharp at every zoom level without image downloads.
export function TreeShape({ kind = "oak" }: { kind?: TreeKind }) {
  return (
    <>
      <ellipse cx="50" cy="101" rx="28" ry="7" fill="#315640" opacity=".13" />
      <path d="M47 98L46 54h9l-2 44z" fill="#90704e" />
      <path d="M50 85L34 68M51 76l16-15" stroke="#90704e" strokeWidth="4" strokeLinecap="round" />
      {kind === "pine" ? <>
        <path d="M50 7L24 48h13L15 77q35 17 70 0L63 48h13z" fill="#3d795f" />
        <path d="M50 7v78q19-1 35-8L63 48h13z" fill="#2e624d" />
        <path d="M50 28L32 56h10L25 77" fill="none" stroke="#73a17b" strokeWidth="3" strokeLinecap="round" />
      </> : kind === "blossom" ? <>
        <path d="M29 76C8 73 10 46 25 42c-4-23 27-34 37-16 22-8 37 17 25 31 8 17-11 29-25 22-10 10-27 9-33-3" fill="#dba4b2" />
        <path d="M63 28c22-6 36 16 24 29 8 17-11 29-25 22-7 7-14 8-21 6 20-13 21-38 22-57" fill="#c78b9f" />
        <g fill="#f7d8dc"><circle cx="32" cy="48" r="4" /><circle cx="55" cy="34" r="3" /><circle cx="69" cy="57" r="4" /><circle cx="42" cy="69" r="3" /></g>
      </> : <>
        <path d="M26 76C7 73 9 48 24 42c-3-20 22-33 36-19 21-8 39 16 26 32 9 19-13 34-29 23-10 8-23 7-31-2" fill="#77a56b" />
        <path d="M60 23c21-8 39 16 26 32 9 19-13 34-29 23-8 6-16 7-24 3 22-9 33-33 27-58" fill="#5c8d58" />
        <path d="M27 54c-2-9 8-19 17-17" fill="none" stroke="#a8c58c" strokeWidth="5" strokeLinecap="round" />
      </>}
    </>
  );
}

export default function ForestTree({ kind = "oak", className = "" }: { kind?: TreeKind; className?: string }) {
  return <svg className={className} viewBox="0 0 100 112" fill="none" aria-hidden="true"><TreeShape kind={kind} /></svg>;
}

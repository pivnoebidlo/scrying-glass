// PDF files of the journal (the GM's books and adventures): where each one was left (page and zoom — localStorage of
// the window) and the side drawer that shows one over any tab (`peekPdf`).

export interface PdfPlace {
  page: number;
  // 'page-width', 'page-fit' or a number as a string («1.25»).
  scale: string;
}

const KEY = 'pdf.places';
const MAX = 200;

function load(): Record<string, PdfPlace> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, PdfPlace>;
  } catch {
    return {};
  }
}
let places = load();

export const placeOf = (path: string): PdfPlace | undefined => places[path];

export function savePlace(path: string, place: PdfPlace) {
  // The last opened go to the end: the oldest are forgotten first.
  const { [path]: _, ...rest } = places;
  const keys = Object.keys(rest);
  places = Object.fromEntries([...keys.slice(Math.max(0, keys.length - MAX + 1)).map((k) => [k, rest[k]!] as const), [path, place]]);
  try {
    localStorage.setItem(KEY, JSON.stringify(places));
  } catch {
    /* not remembered — not a problem */
  }
}

// The file was renamed or moved: its place follows it.
export function movePlace(from: string, to: string) {
  const p = places[from];
  if (p) savePlace(to, p);
}

// The drawer: the file and, if asked, the page to open (else where it was left).
export const pdfPeek = $state({ path: null as string | null, page: null as number | null, rev: 0 });

export function peekPdf(path: string, page: number | null = null) {
  pdfPeek.path = path;
  pdfPeek.page = page;
  pdfPeek.rev++;
}
export const closePdf = () => (pdfPeek.path = null);

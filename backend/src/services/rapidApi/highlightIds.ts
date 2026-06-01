export interface HighlightIdBundle {
  input: string;
  reelId: string;
  numericId: string;
  highlightUrl: string;
  pk?: string;
  shortcode?: string;
  id?: string;
  reel_id?: string;
  /** Full highlight object from client tap (debug + extra fields). */
  highlightObject?: Record<string, unknown>;
}

export function resolveHighlightIdBundle(
  highlightId: string,
  options?: {
    highlightReelId?: string;
    pk?: string;
    shortcode?: string;
    id?: string;
    reel_id?: string;
    highlightObject?: Record<string, unknown>;
  },
): HighlightIdBundle {
  const input = (options?.highlightReelId ?? highlightId).trim();
  const numericId = input.replace(/^highlight:/i, '').replace(/\D/g, '');
  const reelId = input.startsWith('highlight:')
    ? input
    : numericId
      ? `highlight:${numericId}`
      : input;

  const obj = options?.highlightObject;
  const objPk = obj ? stringField(obj, 'pk') : undefined;
  const objShortcode = obj ? stringField(obj, 'shortcode') : undefined;
  const objId = obj ? stringField(obj, 'id') : undefined;
  const objReelId = obj ? stringField(obj, 'reel_id', 'reelId') : undefined;

  const pk = options?.pk?.trim() || objPk || numericId || undefined;
  const shortcode = options?.shortcode?.trim() || objShortcode || undefined;
  const id = options?.id?.trim() || objId || reelId || undefined;
  const reel_id =
    options?.reel_id?.trim() || objReelId || numericId || reelId.replace(/^highlight:/, '');

  return {
    input,
    reelId,
    numericId,
    highlightUrl: numericId
      ? `https://www.instagram.com/stories/highlights/${numericId}/`
      : '',
    pk,
    shortcode,
    id,
    reel_id,
    highlightObject: obj,
  };
}

/** Every distinct ID string to try against highlight-stories APIs. */
export function collectHighlightIdCandidates(bundle: HighlightIdBundle): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (value: unknown) => {
    if (value == null) return;
    const text = String(value).trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    out.push(text);
  };

  add(bundle.reelId);
  add(bundle.id);
  add(bundle.numericId);
  add(bundle.pk);
  add(bundle.reel_id);
  add(bundle.shortcode);
  add(bundle.input);
  add(bundle.highlightUrl);

  if (bundle.numericId) {
    add(`highlight:${bundle.numericId}`);
  }

  const obj = bundle.highlightObject;
  if (obj) {
    add(obj.id);
    add(obj.pk);
    add(obj.reel_id);
    add(obj.reelId);
    add(obj.shortcode);
    add(obj.highlight_id);
    add(obj.numericId);
    const node = obj.node;
    if (node && typeof node === 'object') {
      const n = node as Record<string, unknown>;
      add(n.id);
      add(n.pk);
      add(n.reel_id);
    }
  }

  return out;
}

function stringField(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return undefined;
}

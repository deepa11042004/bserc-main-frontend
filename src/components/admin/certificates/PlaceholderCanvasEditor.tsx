"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Hash,
  QrCode,
  Save,
  Trash2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MousePointer2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type {
  CertPlaceholder,
  PlaceholderInput,
  TextAlign,
} from "@/types/emailServer";

interface UIPlaceholder extends PlaceholderInput {
  _key: string;
  _isNew?: boolean;
}

const DEFAULT_FONT_SIZE = 28;
const QR_DEFAULT_SIDE = 100;

const fromRow = (p: CertPlaceholder): UIPlaceholder => ({
  _key: String(p.id),
  placeholderKey: p.placeholder_key,
  x: p.x,
  y: p.y,
  width: p.width,
  height: p.height,
  fontFamily: p.font_family,
  fontSizePt: p.font_size_pt,
  fontColorHex: p.font_color_hex,
  fontWeight: p.font_weight,
  textAlign: p.text_align,
  isQr: !!p.is_qr,
  isSerial: !!p.is_serial,
  maxLength: p.max_length,
  sortOrder: p.sort_order,
});

const stripUI = (rs: UIPlaceholder[]): PlaceholderInput[] =>
  rs.map(({ _key, _isNew, ...rest }, idx) => {
    void _key;
    void _isNew;
    return { ...rest, sortOrder: idx };
  });

interface Props {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  initial: CertPlaceholder[];
  onSave: (placeholders: PlaceholderInput[]) => Promise<void>;
}

export function PlaceholderCanvasEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  initial,
  onSave,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [items, setItems] = useState<UIPlaceholder[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState<{
    key: string;
    offsetX: number; // image-pixel offset from placeholder top-left to mouse
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Hydrate from server data when it arrives
  useEffect(() => {
    setItems(initial.map(fromRow));
  }, [initial]);

  // Track displayed scale (image is responsive: width=100% of card, height=auto)
  const recomputeScale = useCallback(() => {
    const el = imgRef.current;
    if (!el || !imageWidth) return;
    const w = el.clientWidth;
    if (w > 0) setScale(w / imageWidth);
  }, [imageWidth]);

  useEffect(() => {
    recomputeScale();
    const ro = new ResizeObserver(recomputeScale);
    if (imgRef.current) ro.observe(imgRef.current);
    window.addEventListener("resize", recomputeScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recomputeScale);
    };
  }, [recomputeScale]);

  const selected = useMemo(
    () => items.find((i) => i._key === selectedKey) ?? null,
    [items, selectedKey]
  );

  const updateSelected = (patch: Partial<UIPlaceholder>) => {
    if (!selectedKey) return;
    setItems((rs) => rs.map((r) => (r._key === selectedKey ? { ...r, ...patch } : r)));
    setSaved(false);
  };

  const removeSelected = () => {
    if (!selectedKey) return;
    setItems((rs) => rs.filter((r) => r._key !== selectedKey));
    setSelectedKey(null);
    setSaved(false);
  };

  const addPlaceholder = (kind: "text" | "qr" | "serial") => {
    const cx = Math.round(imageWidth / 2);
    const cy = Math.round(imageHeight / 2);
    const nextKey =
      kind === "qr"
        ? "verification_qr"
        : kind === "serial"
          ? "certificate_id"
          : nextAvailableTextKey(items);
    const u: UIPlaceholder = {
      _key: crypto.randomUUID(),
      _isNew: true,
      placeholderKey: nextKey,
      x: cx - (kind === "qr" ? QR_DEFAULT_SIDE / 2 : 0),
      y: cy - (kind === "qr" ? QR_DEFAULT_SIDE / 2 : DEFAULT_FONT_SIZE / 2),
      width: kind === "qr" ? QR_DEFAULT_SIDE : 0,
      height: kind === "qr" ? QR_DEFAULT_SIDE : 0,
      fontFamily: "Helvetica",
      fontSizePt: kind === "serial" ? 12 : DEFAULT_FONT_SIZE,
      fontColorHex: "#1F2937",
      fontWeight: "NORMAL",
      textAlign: "CENTER",
      isQr: kind === "qr",
      isSerial: kind === "serial",
      maxLength: 200,
    };
    setItems((rs) => [...rs, u]);
    setSelectedKey(u._key);
    setSaved(false);
  };

  // ----- drag / select handlers -----

  const startDrag = (e: React.PointerEvent, key: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const item = items.find((i) => i._key === key);
    if (!item || !imgRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const rect = imgRef.current.getBoundingClientRect();
    const mouseImgX = (e.clientX - rect.left) / scale;
    const mouseImgY = (e.clientY - rect.top) / scale;
    setSelectedKey(key);
    setDrag({
      key,
      offsetX: mouseImgX - item.x,
      offsetY: mouseImgY - item.y,
      moved: false,
    });
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const mouseImgX = (e.clientX - rect.left) / scale;
      const mouseImgY = (e.clientY - rect.top) / scale;
      const newX = clamp(Math.round(mouseImgX - drag.offsetX), 0, imageWidth);
      const newY = clamp(Math.round(mouseImgY - drag.offsetY), 0, imageHeight);
      setItems((rs) =>
        rs.map((r) =>
          r._key === drag.key ? { ...r, x: newX, y: newY } : r
        )
      );
      if (!drag.moved) setDrag({ ...drag, moved: true });
      setSaved(false);
    },
    [drag, scale, imageWidth, imageHeight]
  );

  const onPointerUp = useCallback(() => {
    setDrag(null);
  }, []);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, onPointerMove, onPointerUp]);

  // Click empty canvas → deselect
  const onCanvasClick = () => setSelectedKey(null);

  // Keyboard: Delete removes, arrows nudge by 1px (Shift = 10px)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      const dx =
        e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (dx === 0 && dy === 0) return;
      e.preventDefault();
      updateSelected({
        x: clamp((selected?.x ?? 0) + dx, 0, imageWidth),
        y: clamp((selected?.y ?? 0) + dy, 0, imageHeight),
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, selected?.x, selected?.y, imageWidth, imageHeight]);

  // ----- save -----

  const save = async () => {
    setSaveError(null);
    // Validate before sending
    const seen = new Set<string>();
    for (const r of items) {
      if (!r.placeholderKey || !/^[a-zA-Z0-9_]+$/.test(r.placeholderKey)) {
        setSaveError(
          `Invalid placeholder name "${r.placeholderKey || "(empty)"}" — letters, digits and underscores only.`
        );
        return;
      }
      if (seen.has(r.placeholderKey)) {
        setSaveError(`Duplicate placeholder name "${r.placeholderKey}".`);
        return;
      }
      seen.add(r.placeholderKey);
    }
    setSaving(true);
    try {
      await onSave(stripUI(items));
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // ----- render -----

  const displayedW = imageWidth * scale;
  const displayedH = imageHeight * scale;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
      {/* ---------- Canvas ---------- */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => addPlaceholder("text")}>
            <Type className="size-4" /> Add text field
          </Button>
          <Button size="sm" variant="outline" onClick={() => addPlaceholder("serial")}>
            <Hash className="size-4" /> Add serial number
          </Button>
          <Button size="sm" variant="outline" onClick={() => addPlaceholder("qr")}>
            <QrCode className="size-4" /> Add QR code
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {saved && (
              <span className="text-xs text-emerald-300">Saved ✓</span>
            )}
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="bg-sky-500 text-white hover:bg-sky-400"
            >
              <Save className="size-4" /> {saving ? "Saving…" : "Save layout"}
            </Button>
          </div>
        </div>

        {saveError && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {saveError}
          </div>
        )}

        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden rounded-md ring-1 ring-[#1F1F23] bg-[#1F1F23]"
          onClick={onCanvasClick}
        >
          {/* The background image. width=100% so it fills the wrapper; height follows. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Certificate background"
            onLoad={recomputeScale}
            className="block w-full select-none"
            draggable={false}
          />
          {/* Overlay layer absolutely covers the image */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ width: displayedW, height: displayedH }}
          >
            {items.map((p) => (
              <PlaceholderMarker
                key={p._key}
                item={p}
                scale={scale}
                isSelected={p._key === selectedKey}
                onPointerDown={(e) => startDrag(e, p._key)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MousePointer2 className="size-3" /> Drag a marker to move it
          </span>
          <span>• Click empty area to deselect</span>
          <span>• Arrow keys nudge (Shift = 10 px) • Delete removes</span>
          <span className="ml-auto font-mono text-gray-600">
            {imageWidth} × {imageHeight} px · {(scale * 100).toFixed(0)}% view
          </span>
        </div>
      </div>

      {/* ---------- Properties panel ---------- */}
      <div className="rounded-md ring-1 ring-[#1F1F23] bg-[#0F0F12] p-4">
        {!selected ? (
          <PlaceholdersList
            items={items}
            onSelect={(k) => setSelectedKey(k)}
          />
        ) : (
          <SelectedProperties
            item={selected}
            onChange={updateSelected}
            onRemove={removeSelected}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        )}
      </div>
    </div>
  );
}

// ---------------- subcomponents ----------------

function PlaceholderMarker({
  item,
  scale,
  isSelected,
  onPointerDown,
}: {
  item: UIPlaceholder;
  scale: number;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const x = item.x * scale;
  const y = item.y * scale;

  if (item.isQr) {
    const w = (item.width || QR_DEFAULT_SIDE) * scale;
    const h = (item.height || QR_DEFAULT_SIDE) * scale;
    return (
      <div
        onPointerDown={onPointerDown}
        role="button"
        tabIndex={0}
        className={cn(
          "pointer-events-auto absolute cursor-move select-none rounded-sm border-2 border-dashed",
          isSelected
            ? "border-sky-400 bg-sky-400/15 shadow-[0_0_0_2px_rgba(56,189,248,0.5)]"
            : "border-sky-500/70 bg-sky-500/10 hover:border-sky-400"
        )}
        style={{ left: x, top: y, width: w, height: h }}
        title={`QR · ${item.placeholderKey}`}
      >
        <div className="absolute inset-x-0 -top-5 truncate text-center text-[10px] font-medium uppercase tracking-wide text-sky-300">
          {item.placeholderKey}
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-sky-300">
          <QrCode className="size-1/2 opacity-70" />
        </div>
      </div>
    );
  }

  // Text / serial placeholders: render a styled box that approximates the rendered text.
  const fontPx = (item.fontSizePt ?? DEFAULT_FONT_SIZE) * scale;
  const sample = item.isSerial
    ? "BSERC-2026-0001"
    : `{{${item.placeholderKey || "field"}}}`;
  const align = item.textAlign ?? "CENTER";

  // For CENTER align, x is the horizontal center of the text box; for LEFT it's the left
  // edge, RIGHT the right edge. We translate the overlay div accordingly so dragging
  // visually matches the rendered output.
  const translateX = align === "CENTER" ? "-50%" : align === "RIGHT" ? "-100%" : "0";

  return (
    <div
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
      className={cn(
        "pointer-events-auto absolute cursor-move whitespace-nowrap rounded-sm px-1 py-0.5 select-none",
        isSelected
          ? "outline outline-2 outline-sky-400 bg-sky-500/10"
          : "outline outline-1 outline-dashed outline-sky-500/40 hover:outline-sky-400/70"
      )}
      style={{
        left: x,
        top: y,
        transform: `translateX(${translateX})`,
        fontFamily: item.fontFamily,
        fontSize: fontPx,
        fontWeight: item.fontWeight === "BOLD" ? 700 : 400,
        color: item.fontColorHex,
        lineHeight: 1,
      }}
      title={item.placeholderKey}
    >
      <span className="pointer-events-none absolute -top-4 left-0 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-sky-300">
        {item.isSerial ? "Serial · " : ""}
        {item.placeholderKey}
      </span>
      {sample}
    </div>
  );
}

function PlaceholdersList({
  items,
  onSelect,
}: {
  items: UIPlaceholder[];
  onSelect: (k: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-3 text-sm">
        <h3 className="text-white">No placeholders yet</h3>
        <p className="text-gray-400">
          Use the buttons above the canvas to add fields. Once placed, click a marker on
          the image to edit its properties here.
        </p>
        <ul className="list-inside list-disc space-y-1 text-xs text-gray-500">
          <li><strong>Text field</strong> — maps to a column from your data file.</li>
          <li><strong>Serial number</strong> — auto-generated certificate ID.</li>
          <li><strong>QR code</strong> — links to the verification page.</li>
        </ul>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-white">Placeholders ({items.length})</h3>
      <p className="text-xs text-gray-500">
        Click one on the canvas — or below — to edit its properties.
      </p>
      <ul className="space-y-1">
        {items.map((p) => (
          <li key={p._key}>
            <button
              onClick={() => onSelect(p._key)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-gray-200 hover:bg-[#1F1F23]"
            >
              {p.isQr ? (
                <QrCode className="size-4 text-sky-400" />
              ) : p.isSerial ? (
                <Hash className="size-4 text-sky-400" />
              ) : (
                <Type className="size-4 text-sky-400" />
              )}
              <span className="truncate font-mono text-xs">
                {p.placeholderKey}
              </span>
              <span className="ml-auto text-[10px] text-gray-500">
                {p.x},{p.y}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SelectedProperties({
  item,
  onChange,
  onRemove,
  imageWidth,
  imageHeight,
}: {
  item: UIPlaceholder;
  onChange: (patch: Partial<UIPlaceholder>) => void;
  onRemove: () => void;
  imageWidth: number;
  imageHeight: number;
}) {
  const isQr = !!item.isQr;
  const isSerial = !!item.isSerial;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">
          {isQr ? "QR code" : isSerial ? "Serial number" : "Text field"}
        </h3>
        <button
          onClick={onRemove}
          aria-label="Remove placeholder"
          className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Field label={isQr ? "Placeholder name (for reference)" : "Placeholder name (matches data column)"}>
        <input
          value={item.placeholderKey}
          onChange={(e) => onChange({ placeholderKey: e.target.value })}
          placeholder={isQr ? "verification_qr" : isSerial ? "certificate_id" : "e.g. name"}
          className="w-full rounded border border-[#1F1F23] bg-[#0F0F12] px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="X (px)">
          <NumInput
            value={item.x}
            min={0}
            max={imageWidth}
            onChange={(v) => onChange({ x: v })}
          />
        </Field>
        <Field label="Y (px)">
          <NumInput
            value={item.y}
            min={0}
            max={imageHeight}
            onChange={(v) => onChange({ y: v })}
          />
        </Field>
      </div>

      {isQr ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width">
            <NumInput
              value={item.width ?? QR_DEFAULT_SIDE}
              min={20}
              max={imageWidth}
              onChange={(v) => onChange({ width: v, height: v })}
            />
          </Field>
          <Field label="Height">
            <NumInput
              value={item.height ?? QR_DEFAULT_SIDE}
              min={20}
              max={imageHeight}
              onChange={(v) => onChange({ height: v, width: v })}
            />
          </Field>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Font size (pt)">
              <NumInput
                value={item.fontSizePt ?? DEFAULT_FONT_SIZE}
                min={6}
                max={200}
                onChange={(v) => onChange({ fontSizePt: v })}
              />
            </Field>
            <Field label="Color">
              <input
                type="color"
                value={item.fontColorHex ?? "#1F2937"}
                onChange={(e) => onChange({ fontColorHex: e.target.value })}
                className="h-8 w-full cursor-pointer rounded border border-[#1F1F23] bg-[#0F0F12]"
              />
            </Field>
          </div>

          <Field label="Font">
            <select
              value={item.fontFamily ?? "Helvetica"}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full rounded border border-[#1F1F23] bg-[#0F0F12] px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
            >
              <option>Helvetica</option>
              <option>Times</option>
              <option>Courier</option>
            </select>
          </Field>

          <Field label="Weight">
            <select
              value={item.fontWeight ?? "NORMAL"}
              onChange={(e) =>
                onChange({ fontWeight: e.target.value as "NORMAL" | "BOLD" })
              }
              className="w-full rounded border border-[#1F1F23] bg-[#0F0F12] px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
            >
              <option value="NORMAL">Regular</option>
              <option value="BOLD">Bold</option>
            </select>
          </Field>

          <Field label="Alignment">
            <div className="flex gap-1">
              <AlignButton
                active={item.textAlign === "LEFT"}
                onClick={() => onChange({ textAlign: "LEFT" as TextAlign })}
                icon={AlignLeft}
              />
              <AlignButton
                active={(item.textAlign ?? "CENTER") === "CENTER"}
                onClick={() => onChange({ textAlign: "CENTER" as TextAlign })}
                icon={AlignCenter}
              />
              <AlignButton
                active={item.textAlign === "RIGHT"}
                onClick={() => onChange({ textAlign: "RIGHT" as TextAlign })}
                icon={AlignRight}
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              The X coordinate is the {item.textAlign === "LEFT" ? "left edge" : item.textAlign === "RIGHT" ? "right edge" : "horizontal center"} of the text.
            </p>
          </Field>
        </>
      )}

      <div className="rounded-md border border-[#1F1F23] bg-[#0F0F12] p-2 text-[11px] text-gray-500">
        Drag the marker on the canvas to reposition.
        Use arrow keys for 1 px nudges, Shift+arrow for 10 px.
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      className="w-full rounded border border-[#1F1F23] bg-[#0F0F12] px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
    />
  );
}

function AlignButton({
  active,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof AlignLeft;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded border px-2 py-1.5 text-xs text-gray-300",
        active
          ? "border-sky-500 bg-sky-500/15 text-sky-300"
          : "border-[#1F1F23] hover:border-[#2A2A30]"
      )}
    >
      <Icon className="mx-auto size-4" />
    </button>
  );
}

// ---------------- helpers ----------------

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

const nextAvailableTextKey = (items: UIPlaceholder[]): string => {
  const used = new Set(items.map((i) => i.placeholderKey));
  for (let i = 1; i <= 99; i++) {
    const candidate = `field_${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return "field";
};

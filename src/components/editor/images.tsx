"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { arrayMove } from "@dnd-kit/sortable";
import { ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEditor, useValue } from "./context";
import { SortableList, SortableRow, btnCls, inputCls } from "./fields";

type Img = { url: string; alt: string };
const MAX_W = 1600;

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const scale = Math.min(1, MAX_W / area.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("crop"))), "image/webp", 0.85));
}

function CropDialog({ file, aspect, onCancel, onDone }: {
  file: File; aspect: number; onCancel: () => void; onDone: (b: Blob) => Promise<void>;
}) {
  const [src] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!area) return;
    setBusy(true);
    try { await onDone(await cropToBlob(src, area)); } finally { URL.revokeObjectURL(src); setBusy(false); }
  }
  function cancel() { URL.revokeObjectURL(src); onCancel(); }

  return (
    <div role="dialog" aria-modal="true" aria-label="Recortar imagem" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg space-y-3 rounded-2xl bg-neutral-900 p-4">
        <div className="relative h-80 overflow-hidden rounded-lg bg-black">
          {src && <Cropper image={src} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />}
        </div>
        <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" className="w-full" />
        <div className="flex justify-end gap-2">
          <button type="button" className={btnCls} onClick={cancel} disabled={busy}>Cancelar</button>
          <button type="button" className={`${btnCls} bg-white text-black hover:bg-white/90`} onClick={confirm} disabled={busy || !area}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Recortar e enviar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Seleciona arquivo → recorta → envia ao bucket `media` → devolve a URL pública. */
function useUpload(aspect: number, onUploaded: (url: string) => void) {
  const { id } = useEditor();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setError("Use JPG, PNG ou WebP.");
    if (f.size > 15 * 1024 * 1024) return setError("Arquivo muito grande (máx. 15 MB).");
    setFile(f);
  }

  async function upload(blob: Blob) {
    const supabase = createClient();
    const path = `${id}/${crypto.randomUUID()}.webp`;
    const { error: err } = await supabase.storage.from("media").upload(path, blob, { contentType: "image/webp" });
    if (err) { setError("Falha no envio. Tente novamente."); setFile(null); return; }
    onUploaded(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    setFile(null);
  }

  const ui = (
    <>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {file && <CropDialog file={file} aspect={aspect} onCancel={() => setFile(null)} onDone={upload} />}
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </>
  );
  return { open: () => input.current?.click(), ui };
}

export function ImageField({ k, label, aspect = 4 / 5 }: { k: string; label: string; aspect?: number }) {
  const { set } = useEditor();
  const v = useValue<Img>(k);
  const up = useUpload(aspect, (url) => set(k, { ...v, url }));
  return (
    <div data-form-field={k} className="space-y-2">
      <p className="text-xs font-medium text-neutral-300">{label}</p>
      {v.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.url} alt={v.alt} className="h-32 rounded-lg border border-white/10 object-cover" />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnCls} onClick={up.open}><ImagePlus className="h-4 w-4" />{v.url ? "Trocar foto" : "Enviar foto"}</button>
        {v.url && <button type="button" className={btnCls} onClick={() => set(k, { ...v, url: "" })}>Remover</button>}
      </div>
      <input className={inputCls} placeholder="Texto alternativo (descrição da imagem)" value={v.alt} onChange={(e) => set(k, { ...v, alt: e.target.value })} />
      {up.ui}
    </div>
  );
}

export function ImageList({ k, label, aspect = 4 / 3, hint }: { k: string; label: string; aspect?: number; hint?: string }) {
  const { set } = useEditor();
  const items = (useValue<Img[]>(k) as Img[]) ?? [];
  const up = useUpload(aspect, (url) => set(k, [...items, { url, alt: "" }]));
  const ids = items.map((_, i) => String(i));
  return (
    <div data-form-field={k} className="space-y-2">
      <p className="text-xs font-medium text-neutral-300">{label}</p>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      <SortableList ids={ids} onMove={(from, to) => set(k, arrayMove(items, from, to))}>
        <div className="space-y-2">
          {items.map((im, i) => (
            <SortableRow key={i} id={String(i)} onRemove={() => set(k, items.filter((_, j) => j !== i))} handleLabel="Arrastar imagem">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt={im.alt} className="h-16 w-16 rounded-md object-cover" />
                <input
                  className={inputCls}
                  placeholder="Texto alternativo"
                  value={im.alt}
                  onChange={(e) => set(k, items.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                />
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableList>
      <button type="button" className={btnCls} onClick={up.open}><ImagePlus className="h-4 w-4" />Adicionar imagem</button>
      {up.ui}
    </div>
  );
}

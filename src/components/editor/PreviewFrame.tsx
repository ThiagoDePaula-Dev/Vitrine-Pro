"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";

export type Device = "desktop" | "tablet" | "mobile";
export const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

/**
 * Renderiza os filhos dentro de um iframe (para os breakpoints responsivos funcionarem de verdade),
 * via portal: o estado do editor atualiza o preview ao vivo, sem postMessage.
 */
export function PreviewFrame({ device, children, onFrame }: {
  device: Device; children: ReactNode; onFrame: (iframe: HTMLIFrameElement) => void;
}) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  function onLoad(e: SyntheticEvent<HTMLIFrameElement>) {
    const iframe = e.currentTarget;
    const doc = iframe.contentDocument;
    if (!doc) return;
    onFrame(iframe);
    doc.documentElement.lang = "pt-BR";
    doc.documentElement.className = document.documentElement.className; // variáveis das fontes (next/font)
    doc.head.replaceChildren(
      ...Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style')).map((n) => n.cloneNode(true)),
    );
    doc.body.style.margin = "0";
    setMount(doc.body);
  }

  return (
    <div className="flex h-full justify-center overflow-hidden bg-neutral-800 p-2">
      <iframe
        title="Pré-visualização da página"
        srcDoc="<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head><body></body></html>"
        onLoad={onLoad}
        style={{ width: DEVICE_WIDTH[device] }}
        className="h-full max-w-full rounded-lg bg-white shadow-xl transition-[width]"
      />
      {mount && createPortal(children, mount)}
    </div>
  );
}

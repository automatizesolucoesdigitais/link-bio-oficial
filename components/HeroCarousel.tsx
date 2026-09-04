"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown } from "lucide-react";

const services = [
  {
    image: "/services/bio-link-novo.jpg",
    title: "Criação de Bio Link",
    description: "Todos os seus canais, serviços e contatos em um único lugar.",
    orientation: "square" as const,
    fit: "cover" as const,
    positionDesktop: "center center",
    positionMobile: "center center",
  },
  {
    image: "/services/automacao-whatsapp-nova.webp",
    title: "Automação para WhatsApp",
    description: "Atendimento inteligente para responder, qualificar e converter clientes.",
    tag: "Automação com IA",
    orientation: "portrait" as const,
    fit: "cover" as const,
    positionDesktop: "center center",
    positionMobile: "center center",
  },
  {
    image: "/services/avaliacao-google-nfc.webp",
    title: "Avaliações no Google",
    description: "Facilite avaliações dos seus clientes com tecnologia NFC.",
    orientation: "landscape" as const,
    fit: "cover" as const,
    positionDesktop: "center 55%",
    positionMobile: "center 52%",
  },
  {
    image: "/services/placas-nfc.webp",
    title: "Placas NFC Inteligentes",
    description: "Tecnologia que conecta sua empresa aos clientes.",
    orientation: "portrait" as const,
    fit: "cover" as const,
    positionDesktop: "center 47%",
    positionMobile: "center 48%",
  },
  {
    image: "/services/criacao-sites.webp",
    title: "Criação de Sites",
    description: "Sites profissionais pensados para gerar resultados.",
    orientation: "landscape" as const,
    fit: "cover" as const,
    positionDesktop: "center 52%",
    positionMobile: "48% center",
  },
];

const AUTOPLAY_DELAY = 4500;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % services.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, isPaused]);

  function showSlide(index: number) {
    setActiveIndex((index + services.length) % services.length);
  }

  function finishDrag(clientX: number) {
    if (dragStartX.current === null) return;
    const distance = clientX - dragStartX.current;
    dragStartX.current = null;

    if (Math.abs(distance) < 42) return;
    showSlide(activeIndex + (distance < 0 ? 1 : -1));
  }

  return (
    <header
      className={`hero hero-${services[activeIndex].fit}`}
      aria-label="Apresentação dos serviços da Automatize"
      aria-roledescription="carrossel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showSlide(activeIndex - 1);
        if (event.key === "ArrowRight") showSlide(activeIndex + 1);
      }}
      onPointerDown={(event) => {
        dragStartX.current = event.clientX;
      }}
      onPointerUp={(event) => finishDrag(event.clientX)}
      onPointerCancel={() => {
        dragStartX.current = null;
      }}
    >
      <div className="hero-carousel" aria-hidden="true">
        {services.map((service, index) => (
          <div
            className={`hero-slide hero-slide-${index + 1} is-${service.orientation} fit-${service.fit} ${index === activeIndex ? "is-active" : ""}`}
            key={service.image}
            style={
              {
                "--position-desktop": service.positionDesktop,
                "--position-mobile": service.positionMobile,
              } as CSSProperties
            }
          >
            <div className="hero-slide-media">
              <img
                className="hero-slide-image"
                src={service.image}
                alt=""
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hero-overlay" aria-hidden="true" />

      <span className="hero-kicker">
        <span className="status-dot" /> Soluções digitais inteligentes
      </span>

      <button
        className="hero-pause"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsPaused((current) => !current);
        }}
        aria-label={isPaused ? "Retomar carrossel" : "Pausar carrossel"}
        aria-pressed={isPaused}
      >
        <span aria-hidden="true">{isPaused ? "▶" : "Ⅱ"}</span>
      </button>

      <div className="hero-service-copy" key={activeIndex}>
        {services[activeIndex].tag && (
          <small className="hero-service-tag">{services[activeIndex].tag}</small>
        )}
        <strong>{services[activeIndex].title}</strong>
        <span>{services[activeIndex].description}</span>
      </div>

      <div className="hero-indicators" aria-label="Selecionar serviço">
        {services.map((service, index) => (
          <button
            type="button"
            key={service.title}
            className={index === activeIndex ? "is-active" : ""}
            onClick={(event) => {
              event.stopPropagation();
              showSlide(index);
            }}
            aria-label={`Mostrar ${service.title}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>

      <a className="scroll-cue" href="#perfil" aria-label="Ir para o perfil">
        <ArrowDown size={18} strokeWidth={1.6} />
      </a>
    </header>
  );
}

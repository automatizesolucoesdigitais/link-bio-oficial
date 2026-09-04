"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Globe2,
  Mail,
  Nfc,
  Send,
  Sparkles,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
} from "@/components/BrandIcons";
import { HeroCarousel } from "@/components/HeroCarousel";
import { RobotMascot } from "@/components/RobotMascot/RobotMascot";

const whatsappBase = "https://wa.me/5588994362778";

const quickLinks = [
  { label: "Sobre a Automatize", href: "#sobre" },
  { label: "Soluções para empresas", href: "#solucoes" },
  { label: "Agendar avaliação gratuita", href: "#contato" },
  {
    label: "WhatsApp",
    href: `${whatsappBase}?text=${encodeURIComponent(
      "Olá! Gostaria de saber mais sobre os serviços da Automatize.",
    )}`,
    external: true,
    accent: true,
  },
];

const solutions = [
  {
    eyebrow: "PRIMEIRO PASSO",
    name: "Avaliação Gratuita",
    description: [
      "Conversamos com você para entender seus processos, dores e objetivos.",
      "Identificamos gargalos, oportunidades de automação e pontos onde sua empresa está perdendo dinheiro.",
      "Com base no diagnóstico, apresentamos a solução ideal com preços que fazem sentido para o seu negócio.",
    ],
    price: "GRÁTIS",
    cta: "Agendar avaliação",
    message: "Olá! Gostaria de agendar uma avaliação gratuita com a Automatize.",
    accent: "cyan",
    icon: Sparkles,
    zone: "card-avaliacao",
  },
  {
    eyebrow: "PRESENÇA DIGITAL",
    name: "Sites e Link na BIO",
    description: [
      "Criação de Páginas profissionais e personalizadas.",
      "Criação de Sites Instituicionais.",
      "Criação de Link na BIO profissinal e personalizada.",
    ],
    priceNote: "A partir de",
    price: "R$ 400",
    image: "/services/criacao-sites.webp",
    imagePosition: "center 52%",
    cta: "Quero ser encontrado",
    message: "Olá! Quero um site ou bio link profissional para a minha empresa.",
    accent: "blue",
    icon: Globe2,
    zone: "card-sites",
  },
  {
    eyebrow: "ATENDIMENTO",
    name: "Automação no WhatsApp e Instagram",
    description: [
      "Respostas com mais agilidade",
      "Acompanhamento de cada oportunidade",
      "Atendimento mais organizado",
    ],
    price: "SOB CONSULTA",
    image: "/services/automacao-ia.webp",
    imagePosition: "center 45%",
    cta: "Quero automatizar",
    message: "Olá! Quero automatizar o atendimento da minha empresa no WhatsApp e Instagram.",
    accent: "pink",
    icon: Bot,
    zone: "card-automacao",
  },
  {
    eyebrow: "UM TOQUE",
    name: "Placas NFC inteligentes",
    description: [
      "Placas com tecnologia NFC, para avaliação no google meu negócio.",
      "Com um simples toque no celular, seu cliente é direcionado para lhe avaliar."
    ],
    priceNote: "A partir de",
    price: "R$ 75",
    image: "/services/avaliacao-google-nfc.webp",
    imagePosition: "center 58%",
    cta: "Quero as placas NFC",
    message: "Olá! Quero conhecer as placas NFC inteligentes da Automatize.",
    accent: "cyan",
    icon: Nfc,
    zone: "card-nfc",
  },
];

export default function Home() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const company = String(form.get("company") || "").trim();
    const details = String(form.get("details") || "").trim();
    const message = [
      "Olá! Vim pelo Bio Link da Automatize e gostaria de conversar.",
      `Nome: ${name}`,
      company ? `Empresa: ${company}` : "",
      details ? `Objetivo: ${details}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setSent(true);
    window.open(`${whatsappBase}?text=${encodeURIComponent(message)}`, "_blank");
  }

  return (
    <main className="site-shell">
      <div className="bio-page">
        <HeroCarousel />

        <section className="profile-section" id="perfil" data-robot-zone="perfil">
          <div className="profile-mark" aria-label="Logo da Automatize">
            <div className="profile-mark-ring" aria-hidden="true" />
            <img
              src="/logo.png"
              alt="Automatize Soluções Digitais"
            />
          </div>

          <p className="micro-label">AUTOMAÇÃO · PLACAS NFC · SITES · LINK NA BIO</p>
          <h1>
            Automatize
            <span>Soluções Digitais</span>
          </h1>
          <p className="profile-tagline">
            Ajudando pequenas e médias empresas a melhorar a forma como atraem, atendem e se relacionam com seus clientes.
          </p>

          <nav className="social-row" aria-label="Canais de contato">
            <a
              href="https://automatizedigital.cloud/"
              target="_blank"
              rel="noreferrer"
              aria-label="Acessar site oficial"
            >
              <Globe2 />
            </a>
            <a
              href={`${whatsappBase}?text=${encodeURIComponent(
                "Olá! Gostaria de saber mais sobre os serviços da Automatize.",
              )}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Conversar pelo WhatsApp"
            >
              <WhatsAppIcon size={21} />
            </a>
            <a
              href="https://www.facebook.com/somos.automatize/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook da Automatize"
            >
              <FacebookIcon size={21} />
            </a>
          </nav>

          <nav className="quick-links" aria-label="Links principais">
            {quickLinks.map((link, index) => (
              <a
                href={link.href}
                key={link.label}
                className={link.accent ? "quick-link-whatsapp" : undefined}
                data-robot-cta={link.accent ? "whatsapp" : undefined}
                data-robot-priority={link.accent ? "1" : undefined}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
              >
                <span>{link.label}</span>
                {link.accent ? (
                  <WhatsAppIcon size={20} />
                ) : (
                  <span className="link-index">0{index + 1}</span>
                )}
              </a>
            ))}
          </nav>
        </section>

        <section className="about-section" id="sobre" data-robot-zone="sobre">
          <p className="section-number">01 / SOBRE</p>
          <h2 data-robot-target="sobre-titulo" data-robot-priority="2">
            Sua empresa mais organizada, presente e pronta para crescer.
          </h2>
          <p>
            Sua empresa pode perder clientes por não ser encontrada, demorar para responder ou não manter contato. A Automatize cria soluções digitais para melhorar sua presença e seu atendimento.
          </p>
          <div className="benefit-list">
            <div>
              <Globe2 />
              <span>Criamos sites e link na bio profissionais para sua empresa ser encontrada.</span>
            </div>
            <div>
              <Bot />
              <span>Criação de Automações para WhatsApp e Instagram.</span>
            </div>
            <div>
              <Nfc />
              <span>Criamos placas com NFC inteligentes.</span>
            </div>
          </div>
        </section>

        <section className="solutions-section" id="solucoes">
          <div className="section-heading" data-robot-zone="solucoes-intro">
            <p className="section-number">02 / SOLUÇÕES</p>
            <h2 data-robot-target="solucoes-titulo" data-robot-priority="2">
              Escolha como começar
            </h2>
            <p>
              Ser encontrado, responder mais rápido e manter contato — comece
              pelo que sua empresa mais precisa agora.
            </p>
          </div>

          <div className="solution-stack">
            {solutions.map((solution) => {
              const Icon = solution.icon;
              return (
                <article
                  className={`solution-wrap solution-${solution.accent}`}
                  key={solution.name}
                  data-robot-zone={solution.zone}
                >
                  <div className="solution-card">
                    {solution.image ? (
                      <div className="solution-media">
                        <img
                          src={solution.image}
                          alt=""
                          loading="lazy"
                          style={{ objectPosition: solution.imagePosition }}
                        />
                      </div>
                    ) : null}
                    <div className="solution-topline">
                      <span>{solution.eyebrow}</span>
                      <Icon size={20} strokeWidth={1.6} />
                    </div>
                    <div className="solution-title-row">
                      <h3 data-robot-target={solution.zone} data-robot-priority="2">
                        {solution.name}
                      </h3>
                      <strong>
                        {solution.priceNote ? (
                          <span className="price-note">
                            {solution.priceNote}
                          </span>
                        ) : null}
                        {solution.price}
                      </strong>
                    </div>
                    <ul>
                      {solution.description.map((item) => (
                        <li key={item}>
                          <Check size={13} strokeWidth={2.2} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    className="solution-cta"
                    data-robot-cta={solution.zone}
                    data-robot-priority="1"
                    href={`${whatsappBase}?text=${encodeURIComponent(solution.message)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {solution.cta} <ArrowRight size={17} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="contact-section" id="contato">
          <div className="contact-card" data-robot-zone="contato">
            <p className="section-number">03 / CONTATO</p>
            <h2 data-robot-target="contato-titulo" data-robot-priority="2">
              Conte o que você quer automatizar
            </h2>
            <p className="contact-intro">
              Envie um resumo. A conversa continua diretamente no WhatsApp.
            </p>

            <form onSubmit={handleSubmit}>
              <label>
                Seu nome <span>*</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Como podemos chamar você?"
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Empresa ou segmento
                <input
                  type="text"
                  name="company"
                  placeholder="Ex.: clínica, imobiliária, advocacia"
                  autoComplete="organization"
                />
              </label>
              <label>
                O que você deseja melhorar?
                <textarea
                  name="details"
                  placeholder="Conte brevemente sobre seu atendimento ou processo atual."
                  rows={4}
                />
              </label>
              <button type="submit" data-robot-cta="contato" data-robot-priority="1">
                <span>{sent ? "Abrir WhatsApp novamente" : "Enviar pelo WhatsApp"}</span>
                <Send size={18} />
              </button>
            </form>
            <small>
              Seus dados não são armazenados nesta página. Ao enviar, o WhatsApp
              será aberto com a mensagem pronta.
            </small>
          </div>
        </section>

        <footer data-robot-end="">
          <div className="footer-brand">
            <span className="status-dot" />
            <strong>AUTOMATIZE</strong>
          </div>
          <div className="footer-links">
            <a
              href={`${whatsappBase}?text=${encodeURIComponent(
                "Olá! Gostaria de saber mais sobre os serviços da Automatize.",
              )}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Falar no WhatsApp"
            >
              <WhatsAppIcon />
            </a>
            <a
              href="https://www.facebook.com/somos.automatize/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook da Automatize"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/somos.automatize/?hl=pt-br"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram da Automatize"
            >
              <InstagramIcon />
            </a>
            <a
              href="mailto:contato@automatizedigital.cloud"
              aria-label="Enviar e-mail"
            >
              <Mail size={17} />
            </a>
          </div>
          <p>© 2026 Automatize Soluções Digitais</p>
        </footer>
      </div>

      <RobotMascot />
    </main>
  );
}

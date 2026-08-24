import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Arrow } from "@/components/sx";

/* Closing moment: headline and actions over a starfield, with the card
   hovering above a planet's limb at the bottom of the frame. */
export function CTASection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--sx-bg)", borderTop: "1px solid var(--sx-line)" }}
    >
      <div aria-hidden="true" className="absolute inset-0 sx-stars" />
      <div aria-hidden="true" className="absolute inset-0 sx-grid" style={{ opacity: 0.45 }} />
      <div aria-hidden="true" className="sx-horizon-glow" style={{ bottom: "clamp(40px, 9vw, 120px)" }} />
      <div aria-hidden="true" className="sx-horizon" style={{ top: "calc(100% - clamp(70px, 11vw, 150px))" }} />
      <div aria-hidden="true" className="absolute inset-0 sx-noise" />

      <div
        className="sx-container relative"
        style={{ paddingTop: "clamp(112px, 14vw, 184px)", paddingBottom: "clamp(120px, 14vw, 200px)", textAlign: "center" }}
      >
        <Reveal>
          <div className="sx-overline flex items-center justify-center" style={{ gap: 12 }}>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: "var(--sx-line-strong)" }} />
            <span className="sx-accent">Banking, rebuilt</span>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: "var(--sx-line-strong)" }} />
          </div>

          <h2
            className="sx-display"
            style={{ marginTop: 28, fontSize: "clamp(44px, 7.4vw, 112px)", lineHeight: 0.92 }}
          >
            Where agents
            <br />
            <span style={{ color: "var(--sx-text-3)" }}>keep their money.</span>
          </h2>

          <p className="sx-lede" style={{ maxWidth: 520, margin: "28px auto 0" }}>
            Get set up in a few minutes. It costs nothing in beta, and your very first transfer is already private.
          </p>

          <div className="flex flex-wrap items-center justify-center" style={{ marginTop: 40, gap: 12 }}>
            <Link href="/signup" className="sx-btn sx-btn-primary sx-btn-lg">
              Create your account <Arrow />
            </Link>
            <a href="https://docs.sectoral.xyz" target="_blank" rel="noopener noreferrer" className="sx-btn sx-btn-secondary sx-btn-lg">
              Explore the docs
            </a>
          </div>
        </Reveal>

        {/* The card, hovering above the horizon */}
        <Reveal delay={140}>
          <div className="relative flex justify-center" style={{ marginTop: "clamp(64px, 8vw, 104px)" }}>
            {/* Light pooling under the card */}
            <div
              aria-hidden="true"
              className="absolute"
              style={{
                left: "50%",
                bottom: "-14%",
                width: "min(560px, 90%)",
                height: "38%",
                transform: "translateX(-50%)",
                background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255, 236, 216,0.32), transparent 72%)",
                filter: "blur(18px)",
              }}
            />
            {/* The float animation owns transform, so the tilt lives on the img */}
            <div className="sx-float relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/card.png"
                alt="Sectoral payment card"
                width={430}
                height={271}
                style={{
                  display: "block",
                  width: "clamp(260px, 32vw, 420px)",
                  height: "auto",
                  transform: "perspective(1200px) rotateX(14deg) rotateZ(-6deg)",
                  filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.65)) drop-shadow(0 0 40px rgba(255, 236, 216,0.16))",
                }}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

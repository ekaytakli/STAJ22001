import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import TodoIcon from "./todo/TodoIcon";
import "../pages/AuthPage.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-labelledby="auth-story-title">
        <Link to="/" className="auth-brand">
          <span>
            <TodoIcon name="check" size={24} />
          </span>
          odak.
        </Link>
        <div className="auth-story-content">
          <p className="auth-eyebrow">GÜNÜNE BİRAZ FERAHLIK</p>
          <h1 id="auth-story-title">
            Zihninde yer aç.
            <br />{" "}
            Gününe odaklan.
          </h1>
          <p>
            Yapacaklarını bir araya getir. Önceliklerini seç.
            <br />
            Her gün, kendi ritminde bir adım ileri.
          </p>
          <div className="auth-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <span className="art-center">
              <TodoIcon name="leaf" size={74} />
            </span>
            <span className="art-pill pill-one">
              <TodoIcon name="check" size={18} />
              Bir adım daha.
            </span>
            <span className="art-pill pill-two">
              <TodoIcon name="calendar" size={18} />
              Her şey yerli yerinde.
            </span>
          </div>
        </div>
        <p className="auth-story-footer">
          Daha az karmaşa. Sana daha çok alan.
        </p>
      </section>
      <section className="auth-form-area">
        <div className="auth-form-card">{children}</div>
        <p className="auth-bottom-note">Küçük adımlar. Daha sakin günler.</p>
      </section>
    </main>
  );
}

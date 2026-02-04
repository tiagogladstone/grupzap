"use client";

import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold">
              Grup<span className="text-[#25D366]">zap</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#problemas" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              Problemas
            </a>
            <a href="#funcionalidades" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              Preços
            </a>
            <a href="#faq" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              FAQ
            </a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              Entrar
            </a>
            <a
              href="#precos"
              className="px-4 py-2 text-sm font-medium text-white bg-[#25D366] rounded-lg hover:bg-[#128C7E] transition-colors"
            >
              Começar Grátis
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--border)]"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border)]">
            <div className="flex flex-col gap-4">
              <a href="#problemas" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                Problemas
              </a>
              <a href="#funcionalidades" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                Funcionalidades
              </a>
              <a href="#precos" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                Preços
              </a>
              <a href="#faq" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                FAQ
              </a>
              <hr className="border-[var(--border)]" />
              <a href="#" className="text-sm text-[var(--muted)]">
                Entrar
              </a>
              <a
                href="#precos"
                className="px-4 py-2 text-sm font-medium text-center text-white bg-[#25D366] rounded-lg"
              >
                Começar Grátis
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

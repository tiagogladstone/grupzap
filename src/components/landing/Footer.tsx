export function Footer() {
  return (
    <footer className="py-12 px-4 bg-[var(--card)] border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold">
                Grup<span className="text-[#25D366]">zap</span>
              </span>
            </a>
            <p className="text-sm text-[var(--muted)] mb-4">
              A ferramenta de gestão de grupos WhatsApp mais acessível do Brasil.
            </p>
            {/* Social links - Removidos temporariamente até ter contas reais */}
            <div className="flex gap-4">
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#funcionalidades" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#precos" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Preços
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  LGPD
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            © 2025 Grupzap. Todos os direitos reservados.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Feito com 💚 no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}

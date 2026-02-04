export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#25D366]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#128C7E]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-[#25D366] bg-[#25D366]/10 rounded-full border border-[#25D366]/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
          </span>
          50% mais barato que a concorrência
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
          Gerencie seus grupos de WhatsApp{" "}
          <span className="text-gradient">sem perder a sanidade</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-[var(--muted)] max-w-3xl mx-auto mb-8">
          Centralize todos os seus grupos em um dashboard, agende mensagens automáticas 
          e monitore a entrada de leads em tempo real. A ferramenta que faltava pro seu lançamento.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href="#precos"
            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-[#25D366] rounded-xl hover:bg-[#128C7E] transition-all transform hover:scale-105 glow"
          >
            Começar 7 dias grátis
          </a>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[#25D366] transition-all"
          >
            Ver como funciona
          </a>
        </div>

        {/* Social proof mini */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Cancele quando quiser</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Suporte em &lt;24h</span>
          </div>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="max-w-6xl mx-auto mt-16 px-4">
        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] glow">
          <div className="bg-[var(--card)] p-4">
            {/* Browser bar mockup */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-[var(--background)] rounded-lg px-4 py-1.5 text-sm text-[var(--muted)] text-center">
                  app.grupzap.com/dashboard
                </div>
              </div>
            </div>
            
            {/* Dashboard content placeholder */}
            <div className="bg-[var(--background)] rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Grupos Ativos", value: "24", color: "#25D366" },
                  { label: "Membros Total", value: "12.847", color: "#128C7E" },
                  { label: "Msgs Agendadas", value: "156", color: "#25D366" },
                  { label: "Novos Leads Hoje", value: "+342", color: "#128C7E" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--muted)] mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  "🚀 Lançamento Janeiro - 1.234 membros",
                  "💰 CPL Turma 12 - 856 membros", 
                  "🎯 Aquecimento - 2.341 membros",
                ].map((group, i) => (
                  <div key={i} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                      <span className="text-lg">{group.split(" ")[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{group.split(" - ")[0].substring(2)}</p>
                      <p className="text-sm text-[var(--muted)]">{group.split(" - ")[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

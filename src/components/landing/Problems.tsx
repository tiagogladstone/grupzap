export function Problems() {
  const problems = [
    {
      before: "Alternar entre 20+ grupos manualmente",
      after: "Dashboard centralizado com todos os grupos",
      icon: "🔄",
    },
    {
      before: "Acordar às 3h da manhã para enviar mensagem",
      after: "Agendamento automático no horário certo",
      icon: "⏰",
    },
    {
      before: "Não saber quantos leads entraram hoje",
      after: "Monitoramento de entrada em tempo real",
      icon: "📊",
    },
    {
      before: "Perder leads por grupo lotado",
      after: "Redirecionamento automático para novo grupo",
      icon: "🔀",
    },
    {
      before: "Pagar R$300+ em ferramentas complexas",
      after: "Planos a partir de R$97 (50% mais barato)",
      icon: "💰",
    },
    {
      before: "Suporte que demora dias para responder",
      after: "Atendimento em menos de 24 horas",
      icon: "💬",
    },
  ];

  return (
    <section id="problemas" className="py-20 px-4 bg-[var(--card)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 text-sm font-medium text-[#25D366] bg-[#25D366]/10 rounded-full mb-4">
            Chega de sofrimento
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Cansado de gerenciar grupos no braço?
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Se você já perdeu horas alternando entre grupos, esqueceu de enviar uma mensagem importante 
            ou não sabe quantos leads entraram hoje... nós entendemos.
          </p>
        </div>

        {/* Before/After Grid */}
        <div className="grid gap-4">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[#25D366]/50 transition-colors"
            >
              {/* Before */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-[var(--muted)]">{problem.before}</span>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-2xl">
                  {problem.icon}
                </div>
              </div>

              {/* After */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium text-[var(--foreground)]">{problem.after}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "Perfeito para começar",
      price: "97",
      period: "/mês",
      features: [
        "1 número conectado",
        "Até 10 grupos",
        "Agendamento de mensagens",
        "Monitoramento de entrada/saída",
        "Link de redirecionamento",
        "Suporte por email",
      ],
      cta: "Começar agora",
      popular: false,
    },
    {
      name: "Profissional",
      description: "Para lançadores sérios",
      price: "197",
      period: "/mês",
      features: [
        "3 números conectados",
        "Grupos ilimitados",
        "Agendamento de mensagens",
        "Monitoramento de entrada/saída",
        "Link de redirecionamento",
        "@Todos personalizado",
        "Relatórios avançados",
        "Integrações webhook",
        "Suporte prioritário",
      ],
      cta: "Começar agora",
      popular: true,
    },
    {
      name: "Agência",
      description: "Para times e agências",
      price: "397",
      period: "/mês",
      features: [
        "10 números conectados",
        "Grupos ilimitados",
        "Tudo do Profissional",
        "Sub-contas para clientes",
        "API personalizada",
        "Relatórios white-label",
        "Onboarding dedicado",
        "Suporte via WhatsApp",
      ],
      cta: "Falar com vendas",
      popular: false,
    },
  ];

  return (
    <section id="precos" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 text-sm font-medium text-[#25D366] bg-[#25D366]/10 rounded-full mb-4">
            Preços transparentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Sem surpresas, sem taxas escondidas. Cancele quando quiser, sem burocracia.
          </p>
        </div>

        {/* Comparison badge */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--card)] border border-[var(--border)]">
            <span className="text-sm text-[var(--muted)]">Concorrência cobra:</span>
            <span className="text-sm line-through text-red-500">R$ 197 - R$ 697</span>
            <span className="text-sm font-medium text-[#25D366]">Você paga até 50% menos!</span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-b from-[#25D366]/10 to-[var(--card)] border-2 border-[#25D366] scale-105"
                  : "bg-[var(--card)] border border-[var(--border)]"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#25D366] text-white text-sm font-medium rounded-full">
                  Mais popular
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-[var(--muted)] mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-[var(--muted)]">R$</span>
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-sm text-[var(--muted)]">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-[var(--muted)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#"
                className={`block w-full py-3 text-center rounded-xl font-medium transition-all ${
                  plan.popular
                    ? "bg-[#25D366] text-white hover:bg-[#128C7E]"
                    : "bg-[var(--background)] border border-[var(--border)] hover:border-[#25D366] text-[var(--foreground)]"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
            <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold">Garantia de 14 dias</p>
              <p className="text-sm text-[var(--muted)]">Se não gostar, devolvemos 100% do seu dinheiro. Sem perguntas.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

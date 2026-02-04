export function Testimonials() {
  const testimonials = [
    {
      quote: "Economizei 4 horas por dia só de não precisar ficar alternando entre grupos. No último lançamento, gerenciei 32 grupos sem estresse.",
      name: "Marina Silva",
      role: "Lançadora Digital",
      company: "MS Lançamentos",
      avatar: "MS",
    },
    {
      quote: "A concorrência cobra mais que o dobro e não tem metade das funcionalidades. O link de redirecionamento sozinho já paga o investimento.",
      name: "Carlos Eduardo",
      role: "Infoprodutor",
      company: "Método CEP",
      avatar: "CE",
    },
    {
      quote: "Finalmente um suporte que responde rápido! Tive um problema às 22h e em 30 minutos já estava resolvido. Isso não tem preço.",
      name: "Ana Beatriz",
      role: "Social Media",
      company: "ABM Agência",
      avatar: "AB",
    },
    {
      quote: "Gerencio os lançamentos de 8 clientes diferentes, tudo numa única plataforma. Minha produtividade triplicou desde que migrei.",
      name: "Roberto Mendes",
      role: "Gestor de Tráfego",
      company: "RM Performance",
      avatar: "RM",
    },
  ];

  return (
    <section className="py-20 px-4 bg-[var(--card)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 text-sm font-medium text-[#25D366] bg-[#25D366]/10 rounded-full mb-4">
            Quem usa, aprova
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Junte-se a centenas de lançadores que já simplificaram sua gestão de grupos.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-[#25D366]/50 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-[var(--foreground)] mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Clientes ativos" },
            { value: "15.000+", label: "Grupos gerenciados" },
            { value: "2M+", label: "Mensagens enviadas" },
            { value: "4.9/5", label: "Nota média" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-[#25D366] mb-2">{stat.value}</p>
              <p className="text-sm text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

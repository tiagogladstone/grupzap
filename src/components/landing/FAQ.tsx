"use client";

import { useState } from "react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "O Grupzap usa a API oficial do WhatsApp?",
      answer: "Usamos uma solução que permite gestão completa de grupos sem as limitações da API oficial. A API oficial do WhatsApp tem restrições severas para grupos (só libera para contas com +100.000 disparos). Nossa solução permite que você gerencie grupos com qualquer volume.",
    },
    {
      question: "Minha conta pode ser banida?",
      answer: "Seguimos todas as boas práticas para evitar banimentos. Não fazemos disparos em massa para números desconhecidos nem spam. Nossa ferramenta é focada em GRUPOS onde você já é administrador, com mensagens para pessoas que optaram por entrar. Além disso, incluímos um manual de boas práticas para proteger sua conta.",
    },
    {
      question: "Posso usar mais de um número?",
      answer: "Sim! O plano Starter permite 1 número, o Profissional permite 3 números e o Agência permite até 10 números conectados simultaneamente. Se precisar de mais, entre em contato para um plano personalizado.",
    },
    {
      question: "Consigo integrar com Hotmart, Kiwify, etc?",
      answer: "Sim! Nos planos Profissional e Agência, você tem acesso a integrações webhook com Hotmart, Kiwify, ActiveCampaign, PerfectPay e mais. Quando alguém compra seu produto, pode ser adicionado automaticamente ao grupo.",
    },
    {
      question: "E se eu não gostar?",
      answer: "Oferecemos garantia de 14 dias. Se por qualquer motivo você não ficar satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia. É só mandar uma mensagem para nosso suporte.",
    },
    {
      question: "Quanto tempo leva para configurar?",
      answer: "Menos de 5 minutos! Você escaneia o QR Code, seleciona os grupos que quer gerenciar e pronto. Não precisa instalar nada, não precisa de conhecimento técnico. Se precisar de ajuda, nosso suporte está disponível para te guiar.",
    },
    {
      question: "Vocês oferecem suporte?",
      answer: "Sim! Todos os planos incluem suporte. O Starter tem suporte por email (resposta em até 24h), o Profissional tem suporte prioritário, e o Agência tem suporte via WhatsApp para atendimento ainda mais rápido.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 text-sm font-medium text-[#25D366] bg-[#25D366]/10 rounded-full mb-4">
            Dúvidas frequentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Perguntas e respostas
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Tudo que você precisa saber antes de começar.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-[var(--muted)] flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-[var(--muted)]">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center">
          <p className="text-[var(--muted)] mb-4">Ainda tem dúvidas?</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[#25D366] bg-[#25D366]/10 rounded-xl hover:bg-[#25D366]/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Fale conosco no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

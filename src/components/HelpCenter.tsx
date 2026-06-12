import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, ArrowRight, ArrowDownRight, Compass } from 'lucide-react';
import { FAQ_ITEMS } from '../data';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFAQ, setSelectedFAQ] = useState<string | null>(null);

  const filteredFAQs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="help-center-comp" className="space-y-8">
      {/* Search Header and section description */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Central de Ajuda
          </h3>
          <p className="font-sans text-sm text-neutral-400">
            Encontre respostas diretas para as dúvidas mais frequentes antes de registrar sua solicitação.
          </p>
        </div>

        {/* Elegant Minimalist Search input */}
        <div className="relative w-full md:w-72">
          <input
            id="faq-search"
            type="text"
            placeholder="Pesquisar artigos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-neutral-950 border border-neutral-900 hover:border-neutral-800 focus:border-brand-blue rounded-full pl-9 pr-4 font-sans text-xs text-white placeholder-neutral-500 outline-none transition-all duration-300"
          />
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {filteredFAQs.length === 0 ? (
        <div className="border border-neutral-900 bg-neutral-950/20 py-10 rounded-xl text-center">
          <p className="text-xs font-sans text-neutral-500">Nenhum artigo encontrado para "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFAQs.map((faq) => {
            const isSelected = selectedFAQ === faq.id;

            return (
              <article
                id={`faq-article-${faq.id}`}
                key={faq.id}
                onClick={() => setSelectedFAQ(isSelected ? null : faq.id)}
                className={`p-6 border rounded-xl cursor-pointer bg-neutral-950 text-left transition-all duration-500 flex flex-col justify-between group ${
                  isSelected 
                    ? 'border-brand-blue bg-gradient-to-b from-neutral-950 to-neutral-950/20 shadow-[0_0_15px_var(--color-brand-blue-glow)]' 
                    : 'border-neutral-900 hover:border-neutral-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#0004C8] hover:text-brand-blue bg-neutral-950/60 border border-neutral-900 px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <ArrowDownRight className={`w-4 h-4 text-neutral-600 transition-transform duration-500 ${
                      isSelected ? 'rotate-90 text-brand-blue' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                    }`} />
                  </div>

                  <h4 className="font-display text-sm font-semibold text-white tracking-tight leading-snug group-hover:text-neutral-200 transition-colors">
                    {faq.question}
                  </h4>

                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 border-t border-neutral-900/60 font-sans text-xs text-neutral-400 leading-relaxed font-light">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isSelected && (
                  <div className="pt-4 mt-4 border-t border-neutral-950 flex items-center justify-between text-[10px] font-mono text-neutral-500 tracking-wider uppercase">
                    <span>Ler Resposta</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-brand-blue font-semibold">Saber mais</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

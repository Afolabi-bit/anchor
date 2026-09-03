"use client";

import { useState } from "react";
import { X, Search, Sparkles, Anchor, Sun, Moon, Compass, Shield, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { AnchorTemplate, ANCHOR_TEMPLATES } from "@/lib/templates";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

interface CommitmentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AnchorTemplate) => void;
}

export default function CommitmentLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: CommitmentLibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const categories = [
    "All",
    "Sobriety & Recovery",
    "Mental Health & Calm",
    "Physical Vitality",
    "Mindful Living",
  ];

  const filteredTemplates = ANCHOR_TEMPLATES.filter((t) => {
    const matchesCategory =
      selectedCategory === "All" || t.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.why.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (iconName: string, color: string) => {
    const props = { className: "w-5 h-5", style: { color } };
    switch (iconName) {
      case "Compass": return <Compass {...props} />;
      case "Sun": return <Sun {...props} />;
      case "Moon": return <Moon {...props} />;
      case "Shield": return <Shield {...props} />;
      case "Sparkles": return <Sparkles {...props} />;
      default: return <Anchor {...props} />;
    }
  };

  const handleSelect = (template: AnchorTemplate) => {
    triggerHaptic(15);
    onSelectTemplate(template);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#2C2520]/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative max-w-2xl w-full max-h-[85vh] bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl shadow-organic-lg clay-card flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Anchor Goal Library
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                  Thoughtfully curated, evidence-informed habit & recovery templates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#9E948A] hover:text-[#2C2520] rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Tabs */}
          <div className="p-6 pb-3 space-y-3 bg-[#FFFFFF]/50 dark:bg-[#25221F]/40 border-b border-[#EAE3D7] dark:border-[#38332E]">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#9E948A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates (e.g. alcohol, sleep, breathing, spending)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] focus:outline-none focus:border-[#C86D51]"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setSelectedCategory(cat);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917]"
                        : "bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#786F66] dark:text-[#A8A096]">
                No templates found matching your search.
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const templateColor = PALETTE_HEX[template.suggestedColorIndex] || "#C86D51";

                return (
                  <div
                    key={template.id}
                    className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs hover:border-[#C86D51] transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18]"
                        >
                          {renderIcon(template.icon, templateColor)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: templateColor }}
                            />
                            <h4 className="font-semibold text-sm text-[#2C2520] dark:text-[#ECE7E0]">
                              {template.name}
                            </h4>
                          </div>
                          <span className="text-[10px] text-[#786F66] dark:text-[#A8A096] uppercase tracking-wider font-medium">
                            {template.category}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelect(template)}
                        className="text-xs px-3.5 py-1.5 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium flex items-center gap-1 shadow-organic-sm cursor-pointer shrink-0 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adopt Anchor</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                      {template.description}
                    </p>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs font-serif italic text-[#2C2520] dark:text-[#ECE7E0]">
                      "{template.why}"
                    </div>

                    {template.suggestedActions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#9E948A] font-semibold block">
                          Suggested Daily Micro-Actions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {template.suggestedActions.map((act, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                            >
                              • {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

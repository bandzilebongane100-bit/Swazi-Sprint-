import React, { useState } from "react";
import { X, Mail, Phone, MapPin, Sparkles, Code, Briefcase, Copy, Check } from "lucide-react";
import { sounds } from "../sounds";

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const copyEmail = () => {
    sounds.playClick();
    navigator.clipboard.writeText("realbandzile@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyPhone = () => {
    sounds.playClick();
    navigator.clipboard.writeText("+268 76534385");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div id="developer_modal" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-purple-950/40 border border-purple-500/25 rounded-[32px] p-6 max-w-sm w-full relative overflow-hidden shadow-[0_20px_50px_rgba(124,58,237,0.3)]">
        
        {/* Background ambient glowing spheres */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-yellow-500/5 blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 bg-slate-950/65 rounded-full border border-white/5 hover:bg-slate-800 transition-colors cursor-pointer text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Header Profile */}
        <div className="text-center pb-4 mt-2">
          {/* Animated Avatar circle with initials */}
          <div className="relative inline-block">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 via-purple-500 to-indigo-500 rounded-full blur animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center font-black text-xl text-yellow-400">
              BK
            </div>
          </div>

          <h3 className="text-lg font-black uppercase text-white tracking-tight mt-3">
            Bandzile Kunene
          </h3>
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
            🇸🇿 Lead Programmer
          </span>
        </div>

        {/* Story details layout */}
        <div className="space-y-4">
          
          {/* Bio card */}
          <div className="p-3.5 bg-slate-950/65 border border-white/5 rounded-2xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-yellow-400 text-xs font-bold font-mono">
              <Sparkles size={12} className="fill-yellow-400" />
              <span>THE CREATOR</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Hi! I'm a <strong className="text-white">20-year-old developer</strong> with a deep passion for technology and software engineering. I love pushing artificial intelligence (AI) to its absolute limits to build clean, gorgeous, and performant web masterpieces!
            </p>
          </div>

          {/* Location journey card */}
          <div className="p-3.5 bg-slate-950/65 border border-white/5 rounded-2xl grid grid-cols-1 gap-2.5">
            <div className="flex items-start space-x-2">
              <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-mono text-slate-400 uppercase">Grew up in:</h4>
                <p className="text-[11px] text-white font-bold leading-normal">Mashobeni, Eswatini 🇸🇿</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin size={14} className="text-[#8b5cf6] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-mono text-slate-400 uppercase">Currently based in:</h4>
                <p className="text-[11px] text-white font-bold leading-normal">Manzini, Moneni 🇸🇿</p>
              </div>
            </div>
          </div>

          {/* Call to Collaboration Action */}
          <div className="p-3.5 bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border border-yellow-500/20 rounded-2xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-yellow-400 font-mono">
              <Briefcase size={12} />
              <span>OPENS FOR COLLAB</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              I am eager to contribute to Eswatini's growing digital space. I'd love for tech leaders, startups, and companies in Eswatini to reach out, test ideas together, and collaborate on cool stuff!
            </p>
          </div>

          {/* Contact Details Copyable */}
          <div className="space-y-2 pt-1">
            {/* Email */}
            <div className="flex items-center justify-between bg-slate-950 border border-white/5 p-2 rounded-xl text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail size={13} className="text-red-400" />
                <span className="font-mono text-[10px]">realbandzile@gmail.com</span>
              </div>
              <button
                onClick={copyEmail}
                className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Copy Email"
              >
                {copiedEmail ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between bg-slate-950 border border-white/5 p-2 rounded-xl text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone size={13} className="text-emerald-400" />
                <span className="font-mono text-[10px]">+268 76534385</span>
              </div>
              <button
                onClick={copyPhone}
                className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Copy Phone Index"
              >
                {copiedPhone ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

        </div>

        {/* Footer label */}
        <div className="text-center text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-5 pt-3 border-t border-white/5">
          Let's build Eswatini's creative future.
        </div>
      </div>
    </div>
  );
};

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaTimes, FaPaperPlane, FaCommentDots } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import { Input } from "@/components/ui/input";
import { chatAdvisorAction } from "@/app/actions/chat-advisor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export default function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy tu entrenador IA. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Send relative history to save tokens context
            const history = messages.slice(-6).concat(userMsg);
            const response = await chatAdvisorAction(history);

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error al comunicar. Intenta de nuevo." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="pointer-events-auto bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-[90vw] md:w-[400px] h-[500px] flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <FaRobot className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Antigravity Coach</h3>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> En línea
                                    </p>
                                </div>
                            </div>
                            <PremiumButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white/10 rounded-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <FaTimes />
                            </PremiumButton>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                        >
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-white/10 text-white rounded-bl-none'
                                            }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-primary-foreground/90" {...props} />,
                                                    a: ({ node, ...props }) => <a className="underline decoration-primary hover:text-primary transition-colors" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 rounded-2xl rounded-bl-none p-3 flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-zinc-900/30 flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pregunta sobre tu entrenamiento..."
                                className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
                                disabled={loading}
                            />
                            <PremiumButton
                                type="submit"
                                size="icon"
                                className="bg-primary hover:bg-primary/90 shrink-0"
                                disabled={loading || !input.trim()}
                            >
                                <FaPaperPlane className="h-4 w-4" />
                            </PremiumButton>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg shadow-primary/25 transition-colors group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? <FaTimes className="h-6 w-6" /> : <FaCommentDots className="h-6 w-6" />}
            </motion.button>
        </div>
    );
}

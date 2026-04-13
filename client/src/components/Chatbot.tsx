import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  basePrice: string;
  images: string[];
  slug: string;
  categoryName: string | null;
  variants: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
    price: string;
  }>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

const initialMessage: Message = {
  role: "assistant",
  content: "Merhaba! HANK Giyim Asistanı olarak size yardımcı olmak için buradayım. Ürünler hakkında sorularınızı yanıtlayabilir, size en uygun ürünleri önerebilirim. Size nasıl yardımcı olabilirim?",
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session and messages from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("chatbot_session");
    const savedMessages = localStorage.getItem("chatbot_messages");
    
    if (savedSession) {
      setSessionToken(savedSession);
    }
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved messages:", e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("chatbot_messages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionToken,
        }),
      });

      const data = await response.json();

      if (data.sessionToken && data.sessionToken !== sessionToken) {
        setSessionToken(data.sessionToken);
        localStorage.setItem("chatbot_session", data.sessionToken);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          products: data.products,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(parseFloat(price));
  };

  // Filter products to only show those mentioned in the message content
  const getRelevantProducts = (content: string, allProducts: Product[] | undefined) => {
    if (!allProducts || allProducts.length === 0) return [];
    
    // Find products whose names appear in the message
    const mentionedProducts = allProducts.filter(product => {
      const productNameLower = product.name.toLowerCase();
      const contentLower = content.toLowerCase();
      // Check if product name or significant part of it appears in content
      return contentLower.includes(productNameLower) || 
             productNameLower.split(' ').filter(word => word.length > 3).some(word => contentLower.includes(word));
    });
    
    // If we found mentioned products, return them; otherwise return first 3
    return mentionedProducts.length > 0 ? mentionedProducts.slice(0, 4) : allProducts.slice(0, 3);
  };

  // Format message content - remove markdown and add styling
  const formatContent = (content: string) => {
    // Remove ** markdown
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '$1');
    // Remove ## headers
    formatted = formatted.replace(/##\s*/g, '');
    return formatted;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            data-testid="chatbot-window"
          >
            <div className="bg-black px-4 py-3 flex items-center justify-between border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <img 
                  src="/uploads/branding/hank-icon.png" 
                  alt="HANK" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <span className="font-semibold text-white block text-sm">HANK Giyim Asistanı</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-xs text-violet-400">AI Destekli</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
                data-testid="chatbot-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[400px] overflow-y-auto p-4 space-y-4" data-testid="chatbot-messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{formatContent(msg.content)}</p>

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {getRelevantProducts(msg.content, msg.products).map((product) => (
                          <Link
                            key={product.id}
                            href={`/urun/${product.slug}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="bg-zinc-700/50 rounded-lg p-2 flex gap-3 hover:bg-zinc-700 transition-colors cursor-pointer">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-amber-400">
                                  {formatPrice(product.basePrice)}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  {product.variants
                                    .filter((v) => v.stock > 0)
                                    .map((v) => v.size)
                                    .filter((v, i, a) => a.indexOf(v) === i)
                                    .join(", ") || "Stokta yok"}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-zinc-800 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-600"
                  disabled={isLoading}
                  data-testid="chatbot-input"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors"
                  data-testid="chatbot-send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
        <AnimatePresence>
          {!isOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-black text-white px-4 py-3 rounded-xl shadow-2xl border border-white/30 cursor-pointer hover:border-white/50 transition-colors relative"
              onClick={() => { setIsOpen(true); setShowTooltip(false); }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span className="text-xs text-violet-400 font-medium">AI Asistan</span>
              </div>
              <p className="text-sm font-medium">Size yardımcı olabilir miyim?</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative">
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
              <span className="absolute inset-[-4px] rounded-full border-2 border-white/50 animate-pulse" />
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
            className="relative w-14 h-14 bg-black rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow border-2 border-white"
            data-testid="chatbot-toggle"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <img 
                src="/uploads/branding/hank-icon.png" 
                alt="HANK Asistan" 
                className="w-8 h-8 object-contain"
              />
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}

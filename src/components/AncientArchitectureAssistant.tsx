import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  callAncientArchitectureAI,
  getArchitectureContextByPath,
  type AncientArchitectureChatMessage,
} from '../services/ancientArchitectureAi';

type LinkedRoute = {
  path: string;
  label: string;
};

function AncientArchitectureAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AncientArchitectureChatMessage[]>([]);
  const [linkedRoutes, setLinkedRoutes] = useState<LinkedRoute[]>([]);
  const [showHint, setShowHint] = useState(true);

  const currentContext = useMemo(() => getArchitectureContextByPath(location.pathname), [location.pathname]);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setLinkedRoutes([]);
    setShowHint(true);
  }, [location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const sendQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: AncientArchitectureChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await callAncientArchitectureAI({
        pathname: location.pathname,
        question: trimmed,
        messages,
      });

      const assistantMessage: AncientArchitectureChatMessage = {
        role: 'assistant',
        content: result.answer,
        timestamp: Date.now() + 1,
      };

      setMessages([...nextMessages, assistantMessage]);
      setLinkedRoutes(result.linkedRoutes);
    } catch (error) {
      const fallback: AncientArchitectureChatMessage = {
        role: 'assistant',
        content: error instanceof Error ? `抱歉，AI 服务暂时不可用：${error.message}` : '抱歉，AI 服务暂时不可用，请稍后重试。',
        timestamp: Date.now() + 1,
      };
      setMessages([...nextMessages, fallback]);
      setLinkedRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && showHint && (
        <div className="fixed bottom-24 right-6 z-[70] w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-imperial-gold/20 bg-imperial-deeper/95 px-4 py-3 shadow-[0_0_28px_rgba(0,0,0,0.38)] backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-wider text-imperial-gold">如何开启问答？</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">点击右下角 <span className="text-imperial-gold">AI 建筑导师</span> 按钮，即可提问古建筑历史、结构、文化知识，并联动跳转相关页面。</p>
            </div>
            <button
              onClick={() => setShowHint(false)}
              className="text-xs text-gray-500 transition-colors hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setOpen((current) => !current);
          setShowHint(false);
        }}
        className="fixed bottom-6 right-6 z-[70] rounded-full border border-imperial-gold/40 bg-imperial-deeper/90 px-5 py-3 text-sm font-bold tracking-wider text-imperial-gold shadow-[0_0_24px_rgba(197,165,90,0.18)] backdrop-blur-md transition-all hover:scale-105 hover:bg-imperial-deeper"
      >
        <span className="inline-flex items-center gap-2">
          {!open && <span className="inline-block h-2 w-2 rounded-full bg-imperial-gold animate-pulse" />}
          {open ? '收起 AI 导师' : 'AI 建筑导师 · 点击提问'}
        </span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[70] flex h-[70vh] w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-imperial-gold/20 bg-imperial-deeper/95 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="border-b border-imperial-gold/15 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold tracking-wider text-imperial-gold">古建筑知识问答</h3>
                <p className="mt-1 text-[11px] tracking-wide text-gray-400">当前页面：{currentContext.name}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 transition-colors hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-400">{currentContext.summary}</p>
          </div>

          <div className="border-b border-imperial-gold/10 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {currentContext.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendQuestion(prompt)}
                  className="rounded-full border border-imperial-gold/20 px-3 py-1.5 text-[11px] text-imperial-gold transition-all hover:bg-imperial-gold/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="text-3xl">🏛️</div>
                <p className="mt-3 text-sm text-gray-400">向 AI 提问古建筑结构、历史、文化，或让它推荐您跳转到更适合的模块。</p>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={`${message.timestamp}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-imperial-gold/20 text-imperial-gold'
                        : 'bg-white/5 text-gray-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-gray-400">AI 正在整理回答...</div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {linkedRoutes.length > 0 && (
            <div className="border-t border-imperial-gold/10 px-4 py-3">
              <p className="mb-2 text-[11px] tracking-wide text-gray-500">推荐联动模块</p>
              <div className="flex flex-wrap gap-2">
                {linkedRoutes.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => {
                      navigate(route.path);
                      setOpen(false);
                    }}
                    className="rounded-full border border-imperial-gold/20 px-3 py-1.5 text-[11px] text-imperial-gold transition-all hover:bg-imperial-gold/10"
                  >
                    前往{route.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-imperial-gold/15 px-4 py-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void sendQuestion(input);
                  }
                }}
                placeholder="例如：斗拱为什么能抗震？"
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-imperial-gold/40"
                disabled={loading}
              />
              <button
                onClick={() => void sendQuestion(input)}
                disabled={!input.trim() || loading}
                className="rounded-xl bg-imperial-gold px-4 py-2 text-xs font-bold text-imperial-dark transition-all disabled:cursor-not-allowed disabled:opacity-40"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AncientArchitectureAssistant;

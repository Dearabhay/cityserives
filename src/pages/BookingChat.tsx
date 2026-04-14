import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, Send, Loader2, CheckCheck, Image, Mic, MapPin,
  X, Square, Play, Pause, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

type MessageType = "text" | "image" | "voice" | "location";

type ChatMessage = {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  message_type: MessageType;
  metadata: any;
  created_at: string;
  read: boolean;
};

// ── Voice Recorder Hook ──
function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stop = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === "inactive") {
        resolve(null);
        return;
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        mr.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        resolve(blob);
      };
      mr.stop();
    });
  };

  const cancel = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = () => {
        mr.stream.getTracks().forEach((t) => t.stop());
      };
      mr.stop();
    }
    setRecording(false);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return { recording, duration, start, stop, cancel };
}

// ── Voice Player Component ──
function VoicePlayer({ url, isMe }: { url: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setPlaying(false); setProgress(0); };
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    return () => { audio.pause(); audio.src = ""; };
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <button onClick={toggle} className="shrink-0">
        {playing ? (
          <Pause className={cn("w-5 h-5", isMe ? "text-primary-foreground" : "text-foreground")} />
        ) : (
          <Play className={cn("w-5 h-5", isMe ? "text-primary-foreground" : "text-foreground")} />
        )}
      </button>
      <div className="flex-1 h-1.5 bg-foreground/20 rounded-full overflow-hidden">
        <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ── Location Preview Component ──
function LocationPreview({ lat, lng, isMe }: { lat: number; lng: number; isMe: boolean }) {
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  const imgUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=300x150&maptype=mapnik&markers=${lat},${lng},red-pushpin`;

  return (
    <div className="space-y-1.5">
      <a href={mapUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={imgUrl}
          alt="Location"
          className="rounded-lg w-full max-w-[250px] border border-foreground/10"
          loading="lazy"
        />
      </a>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1 text-[10px] font-medium",
          isMe ? "text-primary-foreground/80" : "text-primary"
        )}
      >
        <ExternalLink className="w-3 h-3" /> Open in Maps
      </a>
    </div>
  );
}

// ── Main Component ──
const BookingChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const { user } = useAuth();
  const isVendor = location.pathname.startsWith("/vendor");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [otherName, setOtherName] = useState("User");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecorder();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Fetch booking
  useEffect(() => {
    if (!user || !bookingId) return;
    const fetchBooking = async () => {
      const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
      if (data) {
        setBooking(data);
        const otherId = isVendor ? data.customer_id : data.vendor_id;
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", otherId).single();
        setOtherName(profile?.full_name || (isVendor ? "Customer" : "Vendor"));
      } else {
        setBooking({ id: bookingId, service_type: "Plumbing", sub_service: "Pipe Leak Repair" });
        setOtherName(isVendor ? "Rahul Sharma" : "Raj Kumar");
      }
    };
    fetchBooking();
  }, [user, bookingId, isVendor]);

  // Fetch & subscribe messages
  useEffect(() => {
    if (!bookingId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages" as any).select("*")
        .eq("booking_id", bookingId).order("created_at", { ascending: true }) as any;
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `booking_id=eq.${bookingId}` },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Mark as read
  useEffect(() => {
    if (!user || !bookingId || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read);
    if (unread.length > 0) {
      supabase.from("chat_messages" as any).update({ read: true } as any)
        .eq("booking_id", bookingId).neq("sender_id", user.id).eq("read", false).then();
    }
  }, [messages, user, bookingId]);

  // ── Send Helpers ──
  const sendMessage = async (msgType: MessageType, message: string, metadata?: any) => {
    if (!user || !bookingId) return;
    setSending(true);

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`, booking_id: bookingId, sender_id: user.id,
      message, message_type: msgType, metadata, created_at: new Date().toISOString(), read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase.from("chat_messages" as any).insert({
      booking_id: bookingId, sender_id: user.id, message, message_type: msgType, metadata,
    } as any).select().single() as any;

    if (error) setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    else if (data) setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data : m));
    setSending(false);
  };

  const handleSendText = () => {
    if (!input.trim() || sending) return;
    const trimmed = input.trim();
    if (trimmed.length > 1000) return;
    setInput("");
    sendMessage("text", trimmed);
  };

  const uploadFile = async (file: Blob, ext: string): Promise<string | null> => {
    if (!user) return null;
    const path = `${bookingId}/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) { toast.error("Upload failed"); return null; }
    const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return publicUrl;
  };

  // Image
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB image"); return; }
    setShowAttachMenu(false);
    setSending(true);
    const url = await uploadFile(file, file.name.split(".").pop() || "jpg");
    if (url) await sendMessage("image", "📷 Photo", { url });
    setSending(false);
  };

  // Voice
  const handleVoiceStop = async () => {
    const blob = await voice.stop();
    if (!blob) return;
    setSending(true);
    const url = await uploadFile(blob, "webm");
    if (url) await sendMessage("voice", "🎤 Voice message", { url, duration: voice.duration });
    setSending(false);
  };

  // Location
  const handleShareLocation = () => {
    setShowAttachMenu(false);
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setSending(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await sendMessage("location", "📍 Location shared", { lat: latitude, lng: longitude });
        setSending(false);
      },
      () => { toast.error("Location access denied"); setSending(false); }
    );
  };

  const otherInitials = otherName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // ── Render Message Content ──
  const renderContent = (msg: ChatMessage, isMe: boolean) => {
    switch (msg.message_type) {
      case "image":
        return (
          <a href={msg.metadata?.url} target="_blank" rel="noopener noreferrer">
            <img src={msg.metadata?.url} alt="Shared" className="rounded-lg max-w-[250px] w-full" loading="lazy" />
          </a>
        );
      case "voice":
        return <VoicePlayer url={msg.metadata?.url} isMe={isMe} />;
      case "location":
        return <LocationPreview lat={msg.metadata?.lat} lng={msg.metadata?.lng} isMe={isMe} />;
      default:
        return <p className="break-words">{msg.message}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-heading font-bold text-primary">
          {otherInitials}
        </div>
        <div className="flex-1">
          <p className="text-sm font-heading font-semibold text-foreground">{otherName}</p>
          <p className="text-[10px] text-muted-foreground">{booking?.sub_service || booking?.service_type || "Chat"}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12"><p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p></div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                )}>
                  {renderContent(msg, isMe)}
                  <div className={cn("flex items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                    <span className={cn("text-[9px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {format(new Date(msg.created_at), "h:mm a")}
                    </span>
                    {isMe && (
                      <CheckCheck className={cn("w-3 h-3", msg.read ? "text-primary-foreground/80" : "text-primary-foreground/40")} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attach Menu Overlay */}
      {showAttachMenu && (
        <div className="bg-card border-t border-border px-4 py-3">
          <div className="flex gap-4 justify-center">
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Photo</span>
            </button>
            <button onClick={handleShareLocation} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors">
              <div className="w-11 h-11 rounded-full bg-success/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-success" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Voice Recording Bar */}
      {voice.recording && (
        <div className="bg-destructive/10 border-t border-border px-4 py-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-foreground flex-1">
            Recording... {Math.floor(voice.duration / 60)}:{(voice.duration % 60).toString().padStart(2, "0")}
          </span>
          <button onClick={voice.cancel} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          <Button size="icon" className="rounded-xl h-9 w-9" onClick={handleVoiceStop}>
            <Square className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Input Bar */}
      {!voice.recording && (
        <div className="sticky bottom-0 bg-card border-t border-border p-3">
          <div className="flex gap-2 max-w-lg mx-auto items-center">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={cn("p-2.5 rounded-xl transition-colors", showAttachMenu ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {showAttachMenu ? <X className="w-5 h-5" /> : <span className="text-lg font-bold">+</span>}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendText()}
              placeholder="Type a message..."
              maxLength={1000}
              className="flex-1 rounded-xl bg-muted border-none px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {input.trim() ? (
              <Button size="icon" onClick={handleSendText} disabled={sending} className="rounded-xl h-[46px] w-[46px] shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            ) : (
              <button onClick={voice.start} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        </div>
      )}
    </div>
  );
};

export default BookingChat;

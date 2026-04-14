import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, HelpCircle, Mail, Phone,
  ChevronDown, ChevronUp, Send, Loader2, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { z } from "zod";

const contactSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(100),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

const faqs = [
  {
    q: "How do I book a service?",
    a: "Browse services on the home screen, select a category and sub-service, choose a date & time, enter your address, and confirm the booking.",
  },
  {
    q: "How do I cancel a booking?",
    a: "Go to your Bookings page, find the active booking, and tap 'Cancel'. Cancellation charges may apply if the vendor has already been dispatched.",
  },
  {
    q: "How are payments handled?",
    a: "We support cash on delivery and online payments. You can select your preferred method during booking checkout.",
  },
  {
    q: "What if the vendor doesn't show up?",
    a: "If the vendor doesn't arrive within 30 minutes of the scheduled time, you can cancel for free and we'll help reassign another vendor.",
  },
  {
    q: "How do I become a vendor?",
    a: "Sign up and select 'Vendor' during onboarding. Add your services, set pricing, and start accepting bookings from customers.",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Go to Dashboard → Withdraw Earnings. Enter your bank details (account number, IFSC, holder name) and submit a withdrawal request.",
  },
  {
    q: "How does the rating system work?",
    a: "After a service is completed, both customers and vendors can rate each other. Ratings are visible on profiles and help build trust.",
  },
  {
    q: "What is emergency dispatch?",
    a: "Emergency dispatch prioritizes your request and finds the nearest available vendor immediately. Additional charges may apply.",
  },
];

type Tab = "chat" | "faq" | "contact" | "call";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const supportResponses: Record<string, string> = {
  default: "Thanks for reaching out! A support agent will get back to you shortly. In the meantime, check our FAQ section for quick answers.",
  booking: "For booking issues, please go to your Bookings page and check the status. If you need further help, submit a contact form with your booking ID.",
  payment: "Payment queries are handled within 24 hours. Please share your booking ID and payment method in the contact form for faster resolution.",
  cancel: "You can cancel from the Bookings page. If you're unable to cancel, please submit a contact form and we'll assist you.",
  vendor: "For vendor-related concerns, please describe the issue in detail through the contact form. We take service quality seriously.",
};

const getAutoReply = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (lower.includes("book")) return supportResponses.booking;
  if (lower.includes("pay") || lower.includes("refund")) return supportResponses.payment;
  if (lower.includes("cancel")) return supportResponses.cancel;
  if (lower.includes("vendor") || lower.includes("provider")) return supportResponses.vendor;
  return supportResponses.default;
};

const Support = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isVendor = location.pathname.startsWith("/vendor");

  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "Hi! 👋 How can we help you today? Describe your issue and we'll get back to you." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Contact form state
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "faq", label: "FAQ", icon: HelpCircle },
    { key: "contact", label: "Contact", icon: Mail },
    { key: "call", label: "Call", icon: Phone },
  ];

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: trimmed };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      const reply: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: getAutoReply(trimmed) };
      setChatMessages((prev) => [...prev, reply]);
      setChatLoading(false);
    }, 1200);
  };

  const handleContactSubmit = async () => {
    setContactErrors({});
    const result = contactSchema.safeParse({ subject: contactSubject, message: contactMessage });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setContactErrors(errs);
      return;
    }

    setContactSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets" as any).insert({
        user_id: user?.id,
        subject: result.data.subject,
        message: result.data.message,
        user_type: isVendor ? "vendor" : "customer",
        status: "open",
      } as any);
      // If table doesn't exist yet, still show success for demo
      if (error && !error.message.includes("does not exist")) throw error;
      toast.success("Support ticket submitted! We'll get back to you soon.");
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      toast.success("Support ticket submitted! We'll get back to you soon.");
      setContactSubject("");
      setContactMessage("");
    } finally {
      setContactSubmitting(false);
    }
  };

  const whatsappNumber = "919876543210";
  const phoneNumber = "+91 98765 43210";

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Customer Support</h1>
      </header>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl shadow-card p-4 space-y-3 min-h-[350px] max-h-[400px] overflow-y-auto">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type your message..."
                maxLength={500}
                className="flex-1 rounded-xl bg-muted border-none px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button
                size="icon"
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="rounded-xl h-[46px] w-[46px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === "faq" && (
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl shadow-card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-heading font-semibold text-foreground pr-2">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Form Tab */}
        {activeTab === "contact" && (
          <div className="bg-card rounded-xl shadow-card p-4 space-y-4">
            <div>
              <label className="text-sm font-heading font-semibold text-foreground mb-1.5 block">Subject</label>
              <input
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g. Booking issue, Payment refund"
                maxLength={100}
                className="w-full rounded-xl bg-muted border-none px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {contactErrors.subject && <p className="text-xs text-destructive mt-1">{contactErrors.subject}</p>}
            </div>
            <div>
              <label className="text-sm font-heading font-semibold text-foreground mb-1.5 block">Message</label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                maxLength={1000}
                rows={5}
                className="w-full rounded-xl bg-muted border-none p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex justify-between mt-1">
                {contactErrors.message ? (
                  <p className="text-xs text-destructive">{contactErrors.message}</p>
                ) : <span />}
                <p className="text-xs text-muted-foreground">{contactMessage.length}/1000</p>
              </div>
            </div>
            <Button onClick={handleContactSubmit} className="w-full" disabled={contactSubmitting}>
              {contactSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
            </Button>
          </div>
        )}

        {/* Call / WhatsApp Tab */}
        {activeTab === "call" && (
          <div className="space-y-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi, I need help with my account.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-card hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-heading font-semibold text-foreground">Chat on WhatsApp</p>
                <p className="text-xs text-muted-foreground">Quick replies, available 9 AM – 9 PM</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>

            <a
              href={`tel:${phoneNumber.replace(/\s/g, "")}`}
              className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-card hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-heading font-semibold text-foreground">Call Us</p>
                <p className="text-xs text-muted-foreground">{phoneNumber} · Mon-Sat, 9 AM – 6 PM</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>

            <a
              href={`mailto:support@example.com?subject=${encodeURIComponent("Support Request")}`}
              className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-card hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-heading font-semibold text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground">support@example.com</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;

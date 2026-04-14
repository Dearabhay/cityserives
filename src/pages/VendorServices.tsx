import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Wrench, IndianRupee, Clock, Check, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { serviceCatalogByCategory, serviceCategories } from "@/data/services";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Service = {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  active: boolean;
};

const allCategories = ["All", ...serviceCategories];

const VendorServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>("Plumbing");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "Plumbing", price: "", duration: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("vendor_services").select("*").eq("vendor_id", user.id).order("created_at").then(({ data }) => {
      if (data) setServices(data.map((d) => ({ id: d.id, name: d.name, category: d.category, price: d.price, duration: d.duration, active: d.active })));
      setLoading(false);
    });
  }, [user]);

  const filtered = filter === "All" ? services : services.filter((s) => s.category === filter);
  const myServiceNames = new Set(services.map((s) => `${s.name}-${s.category}`));

  const toggleActive = async (id: string) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;
    const { error } = await supabase.from("vendor_services").update({ active: !service.active }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setServices(services.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    toast.success("Service updated");
  };

  const handleSave = async () => {
    if (!user || !form.name || !form.price || !form.duration) { toast.error("Fill all fields"); return; }
    if (editId) {
      const { error } = await supabase.from("vendor_services").update({ name: form.name, category: form.category, price: Number(form.price), duration: form.duration }).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      setServices(services.map((s) => s.id === editId ? { ...s, name: form.name, category: form.category, price: Number(form.price), duration: form.duration } : s));
      toast.success("Service updated");
    } else {
      const { data, error } = await supabase.from("vendor_services").insert({ vendor_id: user.id, name: form.name, category: form.category, price: Number(form.price), duration: form.duration }).select().single();
      if (error) { toast.error(error.message); return; }
      setServices([...services, { id: data.id, name: data.name, category: data.category, price: data.price, duration: data.duration, active: data.active }]);
      toast.success("Service added");
    }
    setForm({ name: "", category: "Plumbing", price: "", duration: "" });
    setShowAdd(false);
    setEditId(null);
  };

  const handleEdit = (s: Service) => {
    setForm({ name: s.name, category: s.category, price: s.price.toString(), duration: s.duration });
    setEditId(s.id);
    setShowAdd(true);
    setShowCatalog(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vendor_services").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setServices(services.filter((s) => s.id !== id));
    toast.success("Service removed");
  };

  const addFromCatalog = async (cs: { name: string; price: number; duration: string }, category: string) => {
    if (!user) return;
    const key = `${cs.name}-${category}`;
    if (myServiceNames.has(key)) { toast.error("Already added"); return; }
    const { data, error } = await supabase.from("vendor_services").insert({ vendor_id: user.id, name: cs.name, category, price: cs.price, duration: cs.duration }).select().single();
    if (error) { toast.error(error.message); return; }
    setServices([...services, { id: data.id, name: data.name, category: data.category, price: data.price, duration: data.duration, active: data.active }]);
    toast.success(`${cs.name} added!`);
  };

  // Filter catalog by search
  const getFilteredCatalog = (cat: string) => {
    const items = (serviceCatalogByCategory[cat] || []).map((s) => ({ ...s, category: cat }));
    if (!catalogSearch.trim()) return items;
    return items.filter((s) => s.name.toLowerCase().includes(catalogSearch.toLowerCase()));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-heading font-bold text-foreground">My Services</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowCatalog(!showCatalog); setShowAdd(false); }}>
            {showCatalog ? "Close" : "Browse All"}
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowCatalog(false); setEditId(null); setForm({ name: "", category: "Plumbing", price: "", duration: "" }); }}>
            <Plus className="w-4 h-4" /> Custom
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Browse All Services Catalog */}
        {showCatalog && (
          <div className="space-y-3 animate-slide-up">
            <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
              <h3 className="text-sm font-heading font-semibold text-foreground">Browse & Add Services</h3>
              <p className="text-xs text-muted-foreground">Tap + to add any service to your list. You can edit pricing after adding.</p>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search services..."
                  className="h-10 rounded-xl pl-10"
                />
              </div>
            </div>

            {/* Category Accordion */}
            <div className="space-y-2">
              {serviceCategories.map((cat) => {
                const items = getFilteredCatalog(cat);
                if (catalogSearch && items.length === 0) return null;
                const isExpanded = expandedCat === cat;
                const addedCount = items.filter((s) => myServiceNames.has(`${s.name}-${s.category}`)).length;

                return (
                  <div key={cat} className="bg-card rounded-xl shadow-card overflow-hidden">
                    <button
                      onClick={() => setExpandedCat(isExpanded ? null : cat)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-heading font-semibold text-foreground">{cat}</p>
                          <p className="text-[10px] text-muted-foreground">{items.length} services {addedCount > 0 && `· ${addedCount} added`}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {items.map((cs, i) => {
                          const isAdded = myServiceNames.has(`${cs.name}-${cs.category}`);
                          return (
                            <div key={i} className={cn("flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0", isAdded && "bg-success/5")}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{cs.name}</p>
                                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                                  <span>₹{cs.price}</span>
                                  <span>{cs.duration}</span>
                                </div>
                              </div>
                              {isAdded ? (
                                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold">
                                  <Check className="w-3.5 h-3.5" /> Added
                                </div>
                              ) : (
                                <button
                                  onClick={() => addFromCatalog(cs, cat)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Add/Edit Form */}
        {showAdd && (
          <div className="bg-card rounded-xl p-4 shadow-card space-y-3 animate-slide-up">
            <h3 className="text-sm font-heading font-semibold text-foreground">{editId ? "Edit Service" : "Add Custom Service"}</h3>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" className="h-10 rounded-xl" />
            <div className="flex gap-2 flex-wrap">
              {serviceCategories.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, category: c })} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-all", form.category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price (₹)" type="number" className="h-10 rounded-xl flex-1" />
              <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration" className="h-10 rounded-xl flex-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowAdd(false); setEditId(null); }}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={handleSave}>{editId ? "Update" : "Save"}</Button>
            </div>
          </div>
        )}

        {/* My Services Filter */}
        {!showCatalog && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allCategories.map((c) => (
                <button key={c} onClick={() => setFilter(c)} className={cn("px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all", filter === c ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:border-primary/50")}>
                  {c}
                </button>
              ))}
            </div>

            {/* My Service List */}
            <div className="space-y-3">
              {services.length === 0 && !showAdd ? (
                <div className="bg-card rounded-xl p-8 shadow-card text-center space-y-3">
                  <Wrench className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">No services added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Browse all services to add from our catalog, or create a custom service</p>
                  </div>
                  <Button size="sm" onClick={() => { setShowCatalog(true); }}>
                    Browse All Services
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-card rounded-xl p-8 shadow-card text-center">
                  <Wrench className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No services in this category</p>
                </div>
              ) : (
                filtered.map((service) => (
                  <div key={service.id} className={cn("bg-card rounded-xl p-4 shadow-card transition-all", !service.active && "opacity-60")}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-heading font-semibold text-foreground">{service.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{service.category}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{service.price}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleActive(service.id)} className="mt-0.5">
                        {service.active ? (
                          <ToggleRight className="w-8 h-8 text-success" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(service)}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorServices;

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, ChevronDown, Search, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const VALID_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Brunei", "Bulgaria",
  "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Dominican Republic",
  "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Guatemala", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon",
  "Libya", "Lithuania", "Luxembourg", "Malaysia", "Maldives", "Malta", "Mexico",
  "Moldova", "Mongolia", "Montenegro", "Morocco", "Myanmar", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palestine", "Panama",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Saudi Arabia", "Scotland", "Senegal", "Serbia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania", "Thailand",
  "Tunisia", "Turkey", "UAE", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

export type AddressFields = {
  flat: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  country: string;
};

type AddressFormProps = {
  value: AddressFields;
  onChange: (fields: AddressFields) => void;
  compact?: boolean;
};

const validatePincode = (pincode: string, country: string): boolean => {
  if (!pincode.trim()) return true; // empty is not invalid, just incomplete
  const c = country.trim().toLowerCase();
  if (c === "india") return /^[1-9][0-9]{5}$/.test(pincode.trim());
  if (c === "united states" || c === "usa") return /^\d{5}(-\d{4})?$/.test(pincode.trim());
  if (c === "united kingdom" || c === "uk") return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(pincode.trim());
  if (c === "canada") return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(pincode.trim());
  // Generic: 3-10 alphanumeric
  return /^[A-Za-z0-9\s-]{3,10}$/.test(pincode.trim());
};

const validateCountry = (country: string): boolean => {
  if (!country.trim()) return true;
  return VALID_COUNTRIES.some(
    (c) => c.toLowerCase() === country.trim().toLowerCase()
  );
};

export const parseAddressToFields = (fullAddress: string, cityVal?: string): AddressFields => {
  // Best-effort parse from a single address string
  const parts = fullAddress.split(",").map((p) => p.trim());
  return {
    flat: "",
    street: parts[0] || "",
    area: parts[1] || "",
    city: cityVal || parts[2] || "",
    pincode: "",
    country: "India",
  };
};

export const fieldsToFullAddress = (f: AddressFields): string => {
  return [f.flat, f.street, f.area, f.city, f.pincode, f.country]
    .filter(Boolean)
    .join(", ");
};

const AddressForm = ({ value, onChange, compact }: AddressFormProps) => {
  const [pincodeError, setPincodeError] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-detect city & country from pincode
  const lookupPincode = useCallback(async (pincode: string) => {
    if (!pincode.trim() || pincode.trim().length < 4) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode.trim())}&format=json&addressdetails=1&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const addr = data[0].address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
        const country = addr.country || "";
        if (city || country) {
          onChange({
            ...value,
            pincode,
            city: city || value.city,
            country: country || value.country,
          });
        }
      }
    } catch {
      // silently fail
    } finally {
      setPincodeLoading(false);
    }
  }, [value, onChange]);

  useEffect(() => {
    if (value.pincode.trim().length >= 4) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => lookupPincode(value.pincode), 600);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value.pincode]);

  useEffect(() => {
    if (value.pincode.trim()) {
      setPincodeError(!validatePincode(value.pincode, value.country));
    } else {
      setPincodeError(false);
    }
  }, [value.pincode, value.country]);

const CountryDropdown = ({ value, onChange, height }: { value: string; onChange: (v: string) => void; height: string }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const matched = VALID_COUNTRIES.find(c => c.toLowerCase() === value.trim().toLowerCase());
  const filtered = search
    ? VALID_COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : VALID_COUNTRIES;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`w-full ${height} px-3 rounded-xl border border-input bg-background text-sm text-foreground flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring`}
          >
            <span className={matched ? "text-foreground" : "text-muted-foreground"}>
              {matched || "Select country"}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No countries found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <span className="flex-1">{c}</span>
                  {matched === c && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

  const update = (field: keyof AddressFields, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const h = compact ? "h-10" : "h-11";

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Flat / House No. <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <Input
          value={value.flat}
          onChange={(e) => update("flat", e.target.value)}
          placeholder="e.g. Flat 4B, House #12"
          className={`${h} rounded-xl`}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Street</label>
        <Input
          value={value.street}
          onChange={(e) => update("street", e.target.value)}
          placeholder="Street name"
          className={`${h} rounded-xl`}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Area / Locality</label>
        <Input
          value={value.area}
          onChange={(e) => update("area", e.target.value)}
          placeholder="Area or locality name"
          className={`${h} rounded-xl`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
          <Input
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="City"
            className={`${h} rounded-xl`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
            Pincode
            {pincodeLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          </label>
          <Input
            value={value.pincode}
            onChange={(e) => update("pincode", e.target.value)}
            placeholder="e.g. 110001"
            className={`${h} rounded-xl ${pincodeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {pincodeLoading && (
            <p className="text-[11px] text-primary mt-1">Auto-detecting city & country...</p>
          )}
          {pincodeError && (
            <p className="flex items-center gap-1 text-[11px] text-destructive mt-1">
              <AlertTriangle className="w-3 h-3" />
              Please enter a valid pincode
            </p>
          )}
        </div>
      </div>
      <CountryDropdown value={value.country} onChange={(c) => update("country", c)} height={h} />
    </div>
  );
};

export default AddressForm;

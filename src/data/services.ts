export type SubService = {
  name: string;
  price: number;
  duration: string;
};

export type ServiceCategory = {
  name: string;
  subs: SubService[];
};

export const serviceCatalog: ServiceCategory[] = [
  {
    name: "Plumbing",
    subs: [
      { name: "Pipe Leak Repair", price: 300, duration: "30 min" },
      { name: "Tap Installation", price: 500, duration: "45 min" },
      { name: "Drain Cleaning", price: 400, duration: "1 hr" },
      { name: "Bathroom Fitting", price: 1200, duration: "2 hrs" },
      { name: "Water Tank Cleaning", price: 800, duration: "1.5 hrs" },
      { name: "Toilet Repair", price: 350, duration: "45 min" },
      { name: "Water Heater Install", price: 900, duration: "1.5 hrs" },
      { name: "Pipeline Replacement", price: 1500, duration: "3 hrs" },
    ],
  },
  {
    name: "Salon",
    subs: [
      { name: "Haircut (Men)", price: 200, duration: "30 min" },
      { name: "Haircut (Women)", price: 400, duration: "45 min" },
      { name: "Hair Color", price: 1200, duration: "2 hrs" },
      { name: "Facial", price: 800, duration: "1 hr" },
      { name: "Manicure & Pedicure", price: 600, duration: "1 hr" },
      { name: "Bridal Makeup", price: 5000, duration: "3 hrs" },
      { name: "Threading/Waxing", price: 300, duration: "30 min" },
    ],
  },
  {
    name: "Electrician",
    subs: [
      { name: "Wiring Repair", price: 400, duration: "1 hr" },
      { name: "Switch/Socket Install", price: 250, duration: "30 min" },
      { name: "Fan Installation", price: 350, duration: "45 min" },
      { name: "MCB/Fuse Repair", price: 500, duration: "1 hr" },
      { name: "Chandelier Installation", price: 600, duration: "1 hr" },
      { name: "Inverter/UPS Setup", price: 800, duration: "1.5 hrs" },
      { name: "Doorbell Install", price: 200, duration: "20 min" },
      { name: "Electrical Inspection", price: 300, duration: "45 min" },
    ],
  },
  {
    name: "Cleaning",
    subs: [
      { name: "Full Home Cleaning", price: 1500, duration: "3 hrs" },
      { name: "Kitchen Deep Clean", price: 800, duration: "1.5 hrs" },
      { name: "Bathroom Cleaning", price: 600, duration: "1 hr" },
      { name: "Sofa Cleaning", price: 700, duration: "1 hr" },
      { name: "Carpet Cleaning", price: 900, duration: "1.5 hrs" },
      { name: "Window Cleaning", price: 500, duration: "1 hr" },
      { name: "Mattress Cleaning", price: 600, duration: "1 hr" },
      { name: "Move-in Deep Clean", price: 2500, duration: "5 hrs" },
    ],
  },
  {
    name: "Tutoring",
    subs: [
      { name: "Math Tutoring (1 hr)", price: 500, duration: "1 hr" },
      { name: "Science Tutoring (1 hr)", price: 500, duration: "1 hr" },
      { name: "English Tutoring (1 hr)", price: 400, duration: "1 hr" },
      { name: "Computer Basics", price: 600, duration: "1 hr" },
      { name: "Music Lessons", price: 700, duration: "1 hr" },
    ],
  },
  {
    name: "Painting",
    subs: [
      { name: "Room Painting (1 Room)", price: 3000, duration: "1 day" },
      { name: "Full Home Painting", price: 15000, duration: "3-5 days" },
      { name: "Wall Texture", price: 2500, duration: "1 day" },
      { name: "Waterproofing", price: 4000, duration: "2 days" },
      { name: "Exterior Painting", price: 8000, duration: "2-3 days" },
    ],
  },
  {
    name: "Carpentry",
    subs: [
      { name: "Furniture Assembly", price: 500, duration: "1 hr" },
      { name: "Door Repair", price: 400, duration: "45 min" },
      { name: "Shelf Installation", price: 350, duration: "30 min" },
      { name: "Wardrobe Repair", price: 600, duration: "1 hr" },
      { name: "Bed Repair", price: 500, duration: "1 hr" },
      { name: "Custom Furniture", price: 5000, duration: "3-5 days" },
    ],
  },
  {
    name: "AC Repair",
    subs: [
      { name: "AC Service", price: 500, duration: "1 hr" },
      { name: "Gas Refill", price: 1500, duration: "1.5 hrs" },
      { name: "AC Installation", price: 1200, duration: "2 hrs" },
      { name: "AC Uninstallation", price: 800, duration: "1 hr" },
      { name: "Compressor Repair", price: 2000, duration: "2 hrs" },
      { name: "AC Duct Cleaning", price: 700, duration: "1 hr" },
    ],
  },
  {
    name: "Cook",
    subs: [
      { name: "Breakfast Prep", price: 300, duration: "1 hr" },
      { name: "Lunch Cooking", price: 500, duration: "2 hrs" },
      { name: "Dinner Cooking", price: 500, duration: "2 hrs" },
      { name: "Party/Event Cooking", price: 2000, duration: "4 hrs" },
      { name: "Monthly Cook (30 days)", price: 8000, duration: "2 hrs/day" },
    ],
  },
  {
    name: "Car Wash",
    subs: [
      { name: "Exterior Wash", price: 300, duration: "30 min" },
      { name: "Interior Cleaning", price: 500, duration: "45 min" },
      { name: "Full Detailing", price: 1500, duration: "2 hrs" },
      { name: "Ceramic Coating", price: 5000, duration: "4 hrs" },
      { name: "Engine Cleaning", price: 800, duration: "1 hr" },
    ],
  },
  {
    name: "Pet Care",
    subs: [
      { name: "Dog Grooming", price: 800, duration: "1 hr" },
      { name: "Pet Bath", price: 500, duration: "45 min" },
      { name: "Pet Nail Trimming", price: 200, duration: "15 min" },
      { name: "Pet Walking (1 hr)", price: 300, duration: "1 hr" },
      { name: "Pet Sitting (Day)", price: 1000, duration: "8 hrs" },
    ],
  },
  {
    name: "Massage",
    subs: [
      { name: "Full Body Massage", price: 1200, duration: "1 hr" },
      { name: "Head & Shoulder", price: 500, duration: "30 min" },
      { name: "Foot Reflexology", price: 600, duration: "45 min" },
      { name: "Deep Tissue Massage", price: 1500, duration: "1 hr" },
      { name: "Aromatherapy", price: 1800, duration: "1.5 hrs" },
    ],
  },
];

/** Flat record version keyed by category name for vendor services */
export const serviceCatalogByCategory: Record<string, SubService[]> = Object.fromEntries(
  serviceCatalog.map((cat) => [cat.name, cat.subs])
);

/** All category names */
export const serviceCategories = serviceCatalog.map((c) => c.name);

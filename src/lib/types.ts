export type Role = "school" | "recruiter" | "admin" | "individual";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  role: Role;
  approval_status: ApprovalStatus;
  full_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

export type School = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_person: string | null;
  phone: string | null;
  website: string | null;
};

export type Recruiter = {
  id: string;
  company_name: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  contact_person: string | null;
  phone: string | null;
  website: string | null;
};

export type Student = {
  id: string;
  school_id: string;
  name: string;
  age: number | null;
  photo_url: string | null;
  skills: string[];
  preferred_location: string | null;
  preferred_timing: string | null;
  bio: string | null;
  training_completed: string | null;
  notes: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type StudentContact = {
  student_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  guardian_name: string | null;
};

export type JobListing = {
  id: string;
  recruiter_id: string;
  title: string;
  description: string | null;
  required_skills: string[];
  location: string | null;
  work_timing: string | null;
  base_pay: number;
  min_pay: number;
  max_pay: number;
  is_active: boolean;
  created_at: string;
};

export type ContactUnlock = {
  id: string;
  recruiter_id: string;
  student_id: string;
  created_at: string;
};

export const SKILL_OPTIONS = [
  "Data Entry", "Graphic Design", "Packaging", "Sorting", "Hospitality",
  "Computer Operations", "Document Scanning", "Quality Checking", "Gardening",
  "Baking", "Housekeeping", "Inventory Management", "Customer Greeting",
  "Assembly Line", "Photography", "Tally / Accounting",
];

export const TIMING_OPTIONS = [
  "Morning (9am-1pm)", "Afternoon (1pm-5pm)", "Full day", "Flexible",
];

// ---------------------------------------------------------------------------
// Merchandise Marketplace
// ---------------------------------------------------------------------------
export type OrderStatus = "pending" | "accepted" | "declined" | "fulfilled";

export type Product = {
  id: string;
  school_id: string;
  name: string;
  image: string | null;
  description: string | null;
  category: string;
  unit_price: number;
  min_qty: number;
  max_qty: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type MerchOrder = {
  id: string;
  product_id: string;
  school_id: string;
  recruiter_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  delivery_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const PRODUCT_CATEGORIES = [
  "Candles", "Apparel", "Tote Bags", "Greeting Cards", "Soaps",
  "Jewellery", "Stationery", "Home Decor", "Crafts", "Food & Treats",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  fulfilled: "Fulfilled",
};

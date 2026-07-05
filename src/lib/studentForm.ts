/** Shared parsing for the student profile form (used by school + individual). */

export function studentFields(formData: FormData) {
  const ageRaw = String(formData.get("age") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    age: ageRaw ? Number(ageRaw) : null,
    skills: formData.getAll("skills").map(String).filter(Boolean),
    preferred_location: String(formData.get("preferred_location") ?? "").trim() || null,
    preferred_timing: String(formData.get("preferred_timing") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    training_completed: String(formData.get("training_completed") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    is_visible: formData.get("is_visible") === "on",
  };
}

export function contactFields(formData: FormData) {
  return {
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    guardian_name: String(formData.get("guardian_name") ?? "").trim() || null,
  };
}

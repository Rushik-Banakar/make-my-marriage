"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/marketing/icon";
import { createWeddingSchema, suggestWeddingSlug, weddingDateToInstant, weddingSlugMaxLength } from "@/modules/weddings/schema";
import "@/components/weddings/wedding-setup.css";

const steps = ["Couple Details", "Wedding Details", "Review & Create"];
const titles = ["Every love story begins with two.", "Set the scene for your celebration.", "Your beautiful beginning, ready to save."];
const descriptions = [
  "Start with your names and your role. This will be a shared space for you and your partner.",
  "Set your date and location, give your celebration a name, then choose your timezone and address.",
  "Check the details before saving your wedding workspace as a private draft.",
];

export function CreateWeddingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [bride, setBride] = useState("");
  const [groom, setGroom] = useState("");
  const [seat, setSeat] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [slug, setSlug] = useState<string | null>(null);
  const address = slug ?? suggestWeddingSlug(bride, groom);
  const startAt = weddingDateToInstant(date, timezone);
  const dateLabel = startAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: timezone.trim() }).format(new Date(startAt)) : "Your date, when you’re ready";
  function goBack(to: number) { setError(""); setStep(to); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const details = { brideName: bride, groomName: groom, initialOwnerSeat: seat };
    if (step === 0) {
      const couple = createWeddingSchema.pick({ brideName: true, groomName: true, initialOwnerSeat: true }).safeParse(details);
      if (!couple.success) { setError("Enter both names and select whether you’re the bride or groom."); return; }
      setStep(1); return;
    }
    if (!startAt) { setError("Choose a valid wedding date and timezone."); return; }
    const parsed = createWeddingSchema.safeParse({ ...details, startAt, location, title, description, timezone, slug: address });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    if (step === 1) { setStep(2); return; }
    setPending(true);
    try {
      const response = await fetch("/api/v1/weddings", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error?.code === "SLUG_TAKEN") setStep(1);
        setError(response.status === 401 ? "Your session expired. Log in again before saving your wedding."
          : result.error?.message ?? "Your wedding could not be saved. Please try again.");
        return;
      }
      router.replace("/weddings/" + result.data.id); router.refresh();
    } catch { setError("The request could not finish. Check My Weddings before submitting again."); }
    finally { setPending(false); }
  }

  return <>
    <ol className="setup-progress" aria-label="Wedding setup progress">
      {steps.map((label, index) => <li key={label} className={index === step ? "active" : index < step ? "complete" : ""}>
        <button type="button" onClick={() => goBack(index)} disabled={index > step || pending} aria-current={index === step ? "step" : undefined}>
          <span className="setup-step-number">{index < step ? <Icon name="check" /> : index + 1}</span>
          <span><small>Step {index + 1} · {index === step ? "Active" : index < step ? "Completed" : "Upcoming"}</small><strong>{label}</strong></span>
        </button>
      </li>)}
    </ol>
    <div className="setup-layout">
      <section className="setup-panel" aria-labelledby="setup-title">
        <span className="setup-step-tag">Step {step + 1} of 3 · {steps[step]}</span>
        <h2 id="setup-title">{titles[step]}</h2><p className="setup-description">{descriptions[step]}</p>
        <form className="credentials-form wedding-setup-form" onSubmit={submit}>
          <fieldset disabled={pending}>
            {step === 0 && <div className="setup-fields">
              <div className="wedding-form-row">
                <label>Bride’s name<input name="brideName" autoComplete="off" maxLength={100} required value={bride} onChange={(e) => setBride(e.target.value)} /></label>
                <label>Groom’s name<input name="groomName" autoComplete="off" maxLength={100} required value={groom} onChange={(e) => setGroom(e.target.value)} /></label>
              </div>
              <label>Your role<select name="initialOwnerSeat" required value={seat} onChange={(e) => setSeat(e.target.value)}>
                <option value="" disabled>Select your role</option><option value="bride">I’m the bride</option><option value="groom">I’m the groom</option>
              </select></label>
              <p className="setup-info"><Icon name="people" />You’ll be the first co-owner. Partner invitations are coming in a future update.</p>
            </div>}
            {step === 1 && <div className="setup-fields">
              <label>Wedding date<input type="date" name="date" min="1900-01-01" max="9999-12-31" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label>Wedding city or location<input name="location" placeholder="e.g. Jaipur, Rajasthan" maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} aria-describedby="location-help" /></label>
              <small id="location-help">Add a city or venue if you have one in mind. You can leave this blank for now.</small>
              <label>Wedding title (optional)<input name="title" placeholder="Give your celebration a name" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label>Description (optional)<textarea name="description" rows={4} placeholder="A few words about your celebration…" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label>Wedding timezone<input name="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} list="wedding-timezones" maxLength={100} required aria-describedby="timezone-help" /></label>
              <datalist id="wedding-timezones">{["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney", "UTC"].map((zone) => <option key={zone} value={zone} />)}</datalist>
              <small id="timezone-help">Your date is shown in this timezone. Ceremony times can be added with events later.</small>
              <label>Wedding website address<input name="slug" value={address} onChange={(e) => setSlug(e.target.value)} minLength={3} maxLength={weddingSlugMaxLength} required aria-describedby="slug-help" /></label>
              <small id="slug-help">Reserve a unique URL name for your future wedding website, such as ananya-arjun. Use letters, numbers and single hyphens. Your website stays unpublished.</small>
            </div>}
            {step === 2 && <div className="setup-fields">
              <dl className="setup-review">
                <div><dt>Couple</dt><dd>{bride.trim()} &amp; {groom.trim()}</dd><button type="button" onClick={() => goBack(0)}>Edit couple</button></div>
                <div><dt>Wedding date</dt><dd>{dateLabel}</dd><button type="button" onClick={() => goBack(1)}>Edit details</button></div>
                <div><dt>City or location</dt><dd>{location.trim() || "Not set"}</dd></div>
                <div><dt>Wedding title</dt><dd>{title.trim() || "Not set"}</dd></div>
                <div><dt>Description</dt><dd className="setup-description-text">{description.trim() || "Not set"}</dd></div>
                <div><dt>Timezone</dt><dd>{timezone.trim()}</dd></div>
                <div><dt>Your role</dt><dd>Co-owner · {seat}</dd></div>
                <div><dt>Wedding website address</dt><dd>{address.trim().toLowerCase()}</dd></div>
              </dl>
              <p className="setup-info"><Icon name="lock" />Only active members can open your workspace. Your website starts unpublished.</p>
            </div>}
            {error && <p role="alert" className="account-error">{error} <Link href="/weddings">My Weddings</Link>{error.includes("session expired") && <> · <Link href="/login">Log in</Link></>}</p>}
            <footer className="setup-actions">
              {step > 0 ? <button type="button" className="account-button subtle" onClick={() => goBack(step - 1)}>← Back</button> : <Link className="account-text-link" href="/weddings">Cancel</Link>}
              <button className="account-button" type="submit" aria-busy={pending}>{pending ? "Creating your wedding…" : step === 2 ? "Create private wedding" : "Continue: " + steps[step + 1]} <Icon name="arrow" /></button>
            </footer>
          </fieldset>
        </form>
      </section>
      <aside className="setup-preview" aria-label="Wedding workspace preview">
        <div className="setup-preview-card">
          <p className="account-eyebrow"><span className="setup-live-dot" />Live workspace preview</p>
          <div className="setup-preview-canvas">
            <span className="account-eyebrow">Your celebration, together</span>
            <h3>{title.trim() || `${bride.trim() || "Bride"} & ${groom.trim() || "Groom"}`}</h3>
            {title.trim() && <p>{bride.trim() || "Bride"} &amp; {groom.trim() || "Groom"}</p>}
            <p><Icon name="calendar" />{dateLabel}</p>
            {location.trim() && <p>{location.trim()}</p>}
            {description.trim() && <p className="setup-description-text">{description.trim()}</p>}
            <div className="setup-preview-facts"><div><small>Workspace</small><strong>Private draft</strong></div><div><small>Your role</small><strong>{seat ? "Co-owner · " + seat : "Choose your role"}</strong></div></div>
          </div>
          <div className="setup-address"><span className="account-eyebrow">Wedding website address</span><p>{address.trim().toLowerCase() || "your-wedding"}</p><small>Reserved for your future website · unpublished</small></div>
          <h3 className="setup-next-title">Your first steps</h3>
          <ol className="setup-preview-rail"><li>Make it yours with your names</li><li>Set the date, place and celebration details</li><li>Create your private workspace</li></ol>
          <p className="setup-info"><Icon name="shield" />Your details are saved when you create the wedding. You’ll have full control as its first co-owner.</p>
        </div>
      </aside>
    </div>
  </>;
}

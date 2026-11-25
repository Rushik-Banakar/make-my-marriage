"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { localMinute, toInstant, visibilityLabels, type Ceremony } from "@/modules/planning/events-schema";

type Props = { event?: Ceremony; weddingId: string; timezone: string; weddingDay: string };
export function EventEditor({ event, weddingId, timezone, weddingDay }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = "/weddings/" + weddingId + "/events";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    function instant(field: "startAt" | "endAt") {
      const original = event?.[field];
      if (original && localMinute(original, timezone) === value(field)) return original;
      return toInstant(value(field), timezone);
    }
    const startAt = instant("startAt"), endAt = instant("endAt");
    if (!startAt || !endAt || Date.parse(endAt) <= Date.parse(startAt)) {
      setError("Choose valid times in the wedding timezone. End time must be after start time."); return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/v1" + base + (event ? "/" + event.id : ""), {
        method: event ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value("name"), startAt, endAt, description: value("description"), instructions: value("instructions"),
          venue: { displayName: value("venue"), address: value("address"), mapUrl: value("mapUrl") }, dressCode: value("dressCode"),
          visibility: value("visibility"), status: value("status"), expectedVersion: event?.version }),
      });
      if (!response.ok) throw new Error((await response.json()).error?.message || "Could not save the ceremony.");
      router.push(base); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the ceremony."); setBusy(false); }
  }
  return <form onSubmit={submit} className="credentials-form ceremony-form"><fieldset disabled={busy}>
    <legend>Schedule &amp; location</legend>
    <label>Ceremony name<input name="name" required maxLength={120} defaultValue={event?.name} placeholder="Choose or type a ceremony" list="ceremonies" /></label>
    <datalist id="ceremonies">{["Engagement","Mehendi","Haldi","Sangeet","Wedding","Reception"].map(name => <option key={name}>{name}</option>)}</datalist>
    <div className="ceremony-pair">{(["startAt","endAt"] as const).map((name,i) => <label key={name}>{i ? "Ends" : "Starts"} · {timezone}
      <input name={name} required type="datetime-local" defaultValue={event ? localMinute(event[name],timezone) : weddingDay + (i ? "T11:00" : "T10:00")} /></label>)}</div>
    <label>Venue name<input name="venue" defaultValue={event?.venue.displayName} maxLength={200} /></label>
    <div className="ceremony-pair"><label>Address<input name="address" defaultValue={event?.venue.address} maxLength={350} /></label>
      <label>Map link<input name="mapUrl" type="url" defaultValue={event?.venue.mapUrl} maxLength={1000} /></label></div>
    <label>Description<textarea name="description" defaultValue={event?.description} maxLength={2000} /></label>
    <label>Dress code<input name="dressCode" defaultValue={event?.dressCode} maxLength={200} /></label>
    <label>Special instructions<textarea name="instructions" defaultValue={event?.instructions} maxLength={2000} /></label>
    <div className="ceremony-pair"><label>Visibility<select name="visibility" defaultValue={event?.visibility || "invitedOnly"}>
      {Object.entries(visibilityLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    <label>Status<select name="status" defaultValue={event?.status || "scheduled"}>{["draft","scheduled","completed","cancelled"].map(s =>
      <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></label></div>
    {error && <p className="account-error" role="alert">{error}</p>}
    <div className="ceremony-actions"><Link href={base} className="account-text-link">Discard changes</Link><button className="account-button">{busy ? "Saving…" : "Save ceremony"}</button></div>
  </fieldset></form>;
}

import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getMyWedding } from "@/modules/weddings/service";
import { readEvents } from "@/modules/planning/events";
import { localMinute, visibilityLabels } from "@/modules/planning/events-schema";
import { EventEditor } from "@/components/planning/event-editor";
import { AccountBrand } from "@/components/account/account-brand";
import "@/components/account/account.css";
import "@/components/planning/itinerary.css";

export const metadata = { title: "Events & Wedding Itinerary — Make My Marriage", robots: { index: false, follow: false } };
export default async function EventsPage({ params, searchParams }: { params: Promise<{ weddingId: string }>; searchParams: Promise<{ edit?: string }> }) {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  const { weddingId } = await params;
  const wedding = await getMyWedding(weddingId, session.user.id);
  if (wedding?.myRole !== "admin") notFound();
  const { edit } = await searchParams;
  const events = await readEvents(weddingId, session.user.id);
  const selected = events.find(e => e.id === edit);
  if (edit && edit !== "new" && !selected) notFound();
  const base = "/weddings/" + weddingId + "/events";
  const day = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: wedding.timezone });
  const time = new Intl.DateTimeFormat("en-IN", { timeStyle: "short", timeZone: wedding.timezone });
  const timeline = new Map<string, typeof events>();
  for (const event of events.filter(e => e.status === "scheduled")) {
    const date = day.format(new Date(event.startAt));
    const list = timeline.get(date) ?? [];
    list.push(event);
    timeline.set(date, list);
  }
  return <div className="account-app"><header className="account-header"><AccountBrand /></header>
    <main className="weddings-main itinerary-main">
      <Link className="account-text-link" href={edit ? base : "/weddings/" + weddingId}>← {edit ? "Back to all events" : "Wedding workspace"}</Link>
      <div className="itinerary-heading"><div><p className="account-eyebrow">{wedding.title || wedding.brideName + " & " + wedding.groomName}</p>
        <h1>{edit ? selected?.name || "Add a ceremony" : "Events & Wedding Itinerary"}</h1>
        <p>{wedding.timezone}</p></div>
        {!edit && <Link className="account-button" href={base + "?edit=new"}>+ Add a ceremony</Link>}</div>
      {edit ? <EventEditor key={edit} event={selected} weddingId={weddingId} timezone={wedding.timezone}
        weddingDay={localMinute(wedding.startAt, wedding.timezone).slice(0,10)} /> :
        <div className="itinerary-layout"><aside className="itinerary-timeline"><h2>Day-by-day itinerary</h2>
          {!timeline.size && <p>Scheduled ceremonies will appear here in time order.</p>}
          {Array.from(timeline, ([date, items]) => <section key={date}><h3>{date}</h3><ol>{items.map(e =>
            <li key={e.id}><time>{time.format(new Date(e.startAt))}</time> <a href={"#event-" + e.id}>{e.name}</a></li>)}</ol></section>)}
        </aside><section aria-label="Ceremony details" className="ceremony-cards">{!events.length &&
          <article><h2>Plan your first ceremony</h2><p>Add its name, date and venue to start your shared itinerary.</p></article>}
          {events.map(e => <article key={e.id} id={"event-" + e.id}><div className="ceremony-meta"><span>{day.format(new Date(e.startAt))}</span><span>{e.status}</span></div>
            <h2>{e.name}</h2><p>{time.formatRange(new Date(e.startAt),new Date(e.endAt))}</p>
            {e.venue.displayName && <p>{e.venue.displayName}</p>}{e.venue.address && <p>{e.venue.address}</p>}
            {e.venue.mapUrl && <a href={e.venue.mapUrl} target="_blank" rel="noreferrer">Venue map</a>}
            {e.description && <p>{e.description}</p>}{e.dressCode && <p>Dress code · {e.dressCode}</p>}{e.instructions && <p>{e.instructions}</p>}
            <footer><span>{visibilityLabels[e.visibility]}</span><Link className="account-text-link" href={base + "?edit=" + e.id}>Edit ceremony →</Link></footer>
          </article>)}</section></div>}
    </main></div>;
}

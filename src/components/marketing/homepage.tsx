import type { ReactNode } from "react";
import { DemoPreview } from "@/components/marketing/demo-preview";
import { MobileNavigation } from "@/components/marketing/mobile-navigation";
import { Icon, type IconName } from "@/components/marketing/icon";
import "@/components/marketing/homepage.css";

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Make My Marriage home">
      <span className="brand-mark">M</span>
      <span>
        <strong>Make My Marriage</strong>
        <small>Plan together. Celebrate together.</small>
      </span>
    </a>
  );
}

function ButtonLink({
  href,
  children,
  secondary = false,
  gold = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  gold?: boolean;
}) {
  return (
    <a
      className={`cta ${secondary ? "secondary" : ""} ${gold ? "gold" : ""}`}
      href={href}
    >
      {children}
      {!secondary && <Icon name="arrow" />}
    </a>
  );
}

function SectionHeading({
  label,
  title,
  children,
  centered = true,
}: {
  label: string;
  title: string;
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={`section-heading ${centered ? "centered" : ""}`}>
      <span className="eyebrow">{label}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function Feature({
  id,
  number,
  label,
  title,
  text,
  points,
  children,
  reverse = false,
}: {
  id: string;
  number: string;
  label: string;
  title: string;
  text: string;
  points: string[];
  children: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div id={id} className={`feature-row ${reverse ? "reverse" : ""}`}>
      <div className="feature-copy">
        <span className="eyebrow">
          Feature {number} / {label}
        </span>
        <h3>{title}</h3>
        <p>{text}</p>
        <ul className="check-list">
          {points.map((point) => (
            <li key={point}>
              <Icon name="check" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="feature-visual">{children}</div>
    </div>
  );
}

function MiniPanel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="mini-panel">
      <div className="panel-title">
        <h4>{title}</h4>
        {badge && <span className="badge">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

const faqs = [
  [
    "Can our family use this without downloading an app?",
    "Yes. Make My Marriage is designed as a responsive web application, so the same workspace can be used in a browser on a computer, tablet, or phone.",
  ],
  [
    "How does the wedding budget work?",
    "Set an overall budget in INR and record each expense with its category, date, event, and payer. The remaining budget is your overall budget minus recorded expenses. A payer can be a family member even if they do not have an account.",
  ],
  [
    "Can we invite guests to some ceremonies but not others?",
    "Yes. Invitations are specific to each guest and event. People in the same family can be invited to different ceremonies, and each person can respond separately for the events they are invited to.",
  ],
  [
    "Who can see our guest details, expenses, and photos?",
    "The couple share ownership and grant organizers access to selected responsibilities. Public wedding pages show only approved information. Private gallery access requires verification and permission for the relevant albums.",
  ],
  [
    "Can I use this preview to plan my own wedding?",
    "This homepage currently contains a read-only sample wedding. The names, figures, and events are illustrative. Account creation and wedding management will be introduced as the application is developed.",
  ],
];

export function Homepage() {
  return (
    <div className="landing" id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#demo">Sample Workspace</a>
          </nav>
          <div className="header-actions">
            <a className="header-faq" href="#faq">
              FAQs
            </a>
          </div>
          <MobileNavigation />
        </div>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="container">
            <div className="hero-kicker">
              <span className="pill">
                <i />
                The modern way to plan your wedding
              </span>
              <span>Thoughtfully planned · Beautifully together</span>
            </div>
            <div className="hero-grid">
              <div className="hero-copy">
                <h1>
                  Your wedding.
                  <br />
                  Your people.
                  <br />
                  <em>One plan.</em>
                </h1>
                <p>
                  Plan every ceremony, manage your budget, and bring your family
                  together—all in one thoughtfully designed space.
                </p>
                <div className="button-row">
                  <ButtonLink href="#demo">Explore the Workspace</ButtonLink>
                  <ButtonLink href="#how-it-works" secondary>
                    See How It Works
                  </ButtonLink>
                </div>
                <div className="hero-reassurance">
                  <Icon name="flower" />
                  <p>
                    Made for Indian weddings, from the first celebration to the
                    final reception.
                  </p>
                </div>
              </div>
              <HeroPreview />
            </div>
          </div>
        </section>

        <section className="section alternate">
          <div className="container">
            <SectionHeading
              label="A little less coordination. A lot more celebration."
              title="A grand celebration shouldn’t mean chaotic coordination."
            >
              Multiple ceremonies. Different guest lists. A whole family helping
              out. Bring the details together, so nothing gets lost along the
              way.
            </SectionHeading>
            <div className="problem-grid">
              {(
                [
                  [
                    "chat",
                    "01 / Communication",
                    "Fragmented plans & lost updates",
                    "Important dates and decisions get buried in family chats, forwarded messages, and different versions of the same spreadsheet.",
                    "One shared view of the plan",
                  ],
                  [
                    "wallet",
                    "02 / Financial clarity",
                    "Expenses scattered across the family",
                    "When everyone is paying for different things, it’s hard to know what has been spent and how much of the budget remains.",
                    "Every expense and payer, recorded",
                  ],
                  [
                    "invite",
                    "03 / Invitations",
                    "Different events. Different guest lists.",
                    "Not everyone attends every ceremony. Family invitations and individual responses need a little more care than a single guest list.",
                    "The right invitation for each person",
                  ],
                ] as [IconName, string, string, string, string][]
              ).map(([icon, label, title, copy, outcome]) => (
                <article className="problem-card" key={title}>
                  <span className="icon-tile">
                    <Icon name={icon} />
                  </span>
                  <span className="eyebrow">{label}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <div className="problem-outcome">
                    <Icon name="check" />
                    {outcome}
                  </div>
                </article>
              ))}
            </div>
            <div className="section-banner">
              <span className="banner-icon">
                <Icon name="people" />
              </span>
              <div>
                <h3>One shared space. Everything in sync.</h3>
                <p>
                  A thoughtful home for the many details of an Indian wedding.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="section demo-section">
          <div className="container">
            <SectionHeading
              centered={false}
              label="Your wedding, at a glance"
              title="Everything you need, beautifully organized."
            >
              A shared view of your celebrations, tasks, recorded spending, and
              family responsibilities. Explore the tabs below with illustrative,
              read-only data.
            </SectionHeading>
            <DemoPreview />
          </div>
        </section>

        <section id="features" className="section alternate">
          <div className="container">
            <SectionHeading
              label="Made for every celebration"
              title="Thoughtfully designed for every part of your wedding."
            >
              From the first Mehendi plan to the final reception response, give
              every detail a place to belong.
            </SectionHeading>
            <div className="feature-list">
              <Feature
                id="events"
                number="01"
                label="Events & itinerary"
                title="Plan Every Celebration"
                text="From a vibrant Sangeet to the quiet moments before the wedding, keep each ceremony’s time, venue, and instructions together."
                points={[
                  "Create ceremonies that reflect your traditions",
                  "Keep your itinerary connected to the latest event details",
                ]}
              >
                <MiniPanel
                  title="Your wedding itinerary"
                  badge="Sample schedule"
                >
                  <div className="timeline-row">
                    <time>14:00</time>
                    <div>
                      <strong>Mehendi & family gathering</strong>
                      <small>Lakeside lawn · Mehendi</small>
                    </div>
                    <span className="badge">24 Nov</span>
                  </div>
                  <div className="timeline-row selected">
                    <time>19:00</time>
                    <div>
                      <strong>Wedding ceremony</strong>
                      <small>Garden pavilion · Wedding</small>
                    </div>
                    <span className="badge warm">26 Nov</span>
                  </div>
                  <div className="timeline-row">
                    <time>20:00</time>
                    <div>
                      <strong>Dinner & celebration</strong>
                      <small>Banquet hall · Reception</small>
                    </div>
                    <span className="badge">27 Nov</span>
                  </div>
                </MiniPanel>
              </Feature>
              <Feature
                id="budget"
                number="02"
                label="Budget & recorded expenses"
                title="Every Rupee Accounted For"
                text="Set your wedding budget and keep track of expenses paid by you and your family. See what you’ve spent, who paid, and what remains."
                points={[
                  "Group expenses by event, category, and payer",
                  "Export authorized expense records to CSV",
                ]}
                reverse
              >
                <MiniPanel
                  title="A clear picture of your spending"
                  badge="Sample expenses"
                >
                  <div className="sample-row">
                    <Icon name="wallet" />
                    <div>
                      <strong>Mehendi flowers & décor</strong>
                      <small>Paid by Priya · Mehendi</small>
                    </div>
                    <strong className="row-amount">₹50,000</strong>
                  </div>
                  <div className="sample-row">
                    <Icon name="wallet" />
                    <div>
                      <strong>Wedding catering</strong>
                      <small>Paid by Rajesh · Wedding</small>
                    </div>
                    <strong className="row-amount">₹75,000</strong>
                  </div>
                  <div className="mini-footnote">
                    One expense. One payer. A shared understanding.
                  </div>
                </MiniPanel>
              </Feature>
              <Feature
                id="planning"
                number="03"
                label="Tasks & family collaboration"
                title="Family, Perfectly Coordinated"
                text="Give every helping hand a clear responsibility. Assign tasks to your family and organizers, with the access they need to take care of their part."
                points={[
                  "Track assignees, due dates, and task status",
                  "Start with editable checklists for common ceremonies",
                ]}
              >
                <MiniPanel
                  title="A little help from your people"
                  badge="Assigned tasks"
                >
                  <div className="sample-row">
                    <div>
                      <strong>Confirm Mehendi decorations</strong>
                      <small>Assigned to Priya · Due 22 Nov</small>
                    </div>
                    <span className="badge dark">Completed</span>
                  </div>
                  <div className="sample-row">
                    <div>
                      <strong>Review the reception guest list</strong>
                      <small>Assigned to Rajesh · Due 23 Nov</small>
                    </div>
                    <span className="badge warm">In progress</span>
                  </div>
                </MiniPanel>
              </Feature>
              <Feature
                id="invitations"
                number="04"
                label="Guests & event-specific RSVP"
                title="The Right Invitation for Every Guest"
                text="Invite close family to intimate ceremonies and friends to the reception. Each person sees the events they’re invited to, with responses kept together."
                points={[
                  "Different event invitations within the same family",
                  "Share invitation links manually, including on WhatsApp",
                ]}
                reverse
              >
                <MiniPanel
                  title="A family invitation, thoughtfully arranged"
                  badge="Sample family"
                >
                  <div className="family-preview">
                    <span className="avatar">VS</span>
                    <div>
                      <strong>Vikram & Ananya Sharma</strong>
                      <small>Two family members · Wedding & reception</small>
                    </div>
                    <Icon name="invite" />
                  </div>
                  <div className="invitation-status">
                    <span>
                      Vikram · Wedding <b>Attending</b>
                    </span>
                    <span>
                      Ananya · Reception <b>Pending</b>
                    </span>
                  </div>
                </MiniPanel>
              </Feature>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionHeading
              label="Personal invitations. Clear responses."
              title="Every guest. Every celebration. Just the right invitation."
            >
              A family can share one invitation while each person responds to
              their own events. Keep the details personal and the headcounts
              clear.
            </SectionHeading>
            <div className="guest-grid">
              <MiniPanel
                title="Your guest list, by celebration"
                badge="Sample RSVP counts"
              >
                <p className="panel-description">
                  Responses are counted per person, for each invited event.
                </p>
                {[
                  [
                    "Mehendi",
                    "An intimate afternoon with family",
                    "110 invited",
                    "86 attending",
                  ],
                  [
                    "Wedding ceremony",
                    "Family and friends, together",
                    "264 invited",
                    "243 attending",
                  ],
                  [
                    "Reception",
                    "A celebration with everyone",
                    "320 invited",
                    "286 attending",
                  ],
                ].map(([name, desc, count, rsvp]) => (
                  <div className="guest-row" key={name}>
                    <div className="panel-title">
                      <strong>{name}</strong>
                      <span className="badge dark">{count}</span>
                    </div>
                    <small>{desc}</small>
                    <span className="badge">{rsvp}</span>
                  </div>
                ))}
              </MiniPanel>
              <div className="invitation-card-wrap">
                <div className="panel-title">
                  <span className="eyebrow">Your personal invitation</span>
                  <Icon name="invite" />
                </div>
                <div className="invitation-card">
                  <div className="panel-title">
                    <div>
                      <span className="eyebrow">
                        Together with our families
                      </span>
                      <h3>Meera & Aarav</h3>
                    </div>
                    <span className="monogram">M</span>
                  </div>
                  <div className="invite-recipient">
                    <small>With love, we invite</small>
                    <strong>The Sharma Family</strong>
                    <small>Sample invitation · 2 guests</small>
                  </div>
                  <div className="invitation-event">
                    <span>26 Nov · Wedding ceremony</span>
                    <span className="badge">Attending</span>
                  </div>
                  <div className="invitation-event">
                    <span>27 Nov · Reception</span>
                    <span className="badge warm">Pending</span>
                  </div>
                  <p className="sample-note">
                    Each family member responds separately to their invited
                    events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section alternate">
          <div className="container">
            <SectionHeading
              label="A thoughtful beginning"
              title="From the first plan to the final celebration."
            >
              Four simple steps to bring your wedding, your family, and all the
              little details together.
            </SectionHeading>
            <div className="steps-grid">
              {[
                [
                  "01",
                  "Your wedding",
                  "Create Your Wedding Hub",
                  "Add your names, dates, and location. Make room for your Mehendi, Haldi, Sangeet, wedding, and reception.",
                  "Your celebrations, your way",
                ],
                [
                  "02",
                  "Your people",
                  "Bring Your People Together",
                  "Invite your partner as an equal co-owner, then give family and organizers selected responsibilities.",
                  "Shared ownership. Thoughtful access.",
                ],
                [
                  "03",
                  "Your plan",
                  "Plan Everything in One Place",
                  "Assign tasks, record expenses, and organize invitations. Keep the important details in one shared workspace.",
                  "One clear view of the details",
                ],
                [
                  "04",
                  "Your celebration",
                  "Celebrate & Stay Connected",
                  "Share approved wedding details, collect event RSVPs, and give guests access to their permitted photo albums.",
                  "From invitations to memories",
                ],
              ].map(([number, label, title, text, note]) => (
                <article className="step-card" key={number}>
                  <span className="step-number">{number}</span>
                  <span className="eyebrow">{label}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <small>{note}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="section">
          <div className="container">
            <SectionHeading
              label="Shared joy. Thoughtful access."
              title="Your celebration. Your control."
            >
              Wedding details are personal. The couple decide who can help, what
              they can access, and which details are published for guests.
            </SectionHeading>
            <div className="roles-grid">
              {(
                [
                  [
                    "shield",
                    "01 / Shared ownership",
                    "The Couple",
                    "Both partners have equal owner privileges. Together, they manage the wedding, invite organizers, and control permissions.",
                    "Two co-owners, one wedding",
                  ],
                  [
                    "people",
                    "02 / Selected responsibilities",
                    "Family & Organizers",
                    "Family members and professionals receive access to selected tasks, events, expenses, or albums, as granted by the owners.",
                    "Access matched to their role",
                  ],
                  [
                    "invite",
                    "03 / Personal invitations",
                    "Guests & Families",
                    "Guests see their invited ceremonies and respond per event. Private photos require verification and album permission.",
                    "Only the details meant for them",
                  ],
                ] as [IconName, string, string, string, string][]
              ).map(([icon, label, title, text, note]) => (
                <article className="role-card" key={title}>
                  <span className="icon-tile dark">
                    <Icon name={icon} />
                  </span>
                  <span className="eyebrow">{label}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <small>{note}</small>
                </article>
              ))}
            </div>
            <div id="faq" className="faq">
              <h2>Frequently Asked Questions</h2>
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <Icon name="chevron" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="container">
            <span className="eyebrow">A little more together</span>
            <h2>Your wedding deserves a better plan.</h2>
            <p>
              Bring your plans out of scattered spreadsheets and family chats,
              and into one thoughtfully organized wedding workspace.
            </p>
            <div className="button-row">
              <ButtonLink href="#top" gold>
                Back to the Beginning
              </ButtonLink>
            </div>
            <small>
              Read-only sample · Made for Indian weddings · Designed for your
              browser
            </small>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Brand />
              <p>
                Thoughtfully planned. Beautifully together.
                <br />A shared home for your wedding celebrations.
              </p>
            </div>
            <nav aria-label="Product links">
              <span className="eyebrow">Product</span>
              <a href="#events">Events & itinerary</a>
              <a href="#budget">Budget & expenses</a>
              <a href="#invitations">Guests & invitations</a>
              <a href="#planning">Family collaboration</a>
            </nav>
            <nav aria-label="Information links">
              <span className="eyebrow">Good to know</span>
              <a href="#privacy">Roles & privacy</a>
              <a href="#faq">Frequently asked questions</a>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Make My Marriage</span>
            <span>Made for moments that matter</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="hero-preview" aria-label="Illustrative wedding dashboard">
      <div className="window-bar">
        <div>
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="window-dot" />
          <span>Make My Marriage</span>
        </div>
        <span>
          <Icon name="lock" />
          Sample workspace
        </span>
      </div>
      <div className="hero-preview-body">
        <div className="preview-wedding">
          <div>
            <span className="badge">Wedding preview</span>
            <h2>Aarav & Meera’s Wedding</h2>
            <p>
              <Icon name="location" />
              Lakeside lawn & Garden pavilion, Udaipur
            </p>
          </div>
          <div className="avatar-stack" aria-label="Sample wedding members">
            <span>AK</span>
            <span>MK</span>
            <span>+3</span>
          </div>
        </div>
        <div className="stat-grid">
          {[
            ["Recorded expenses", "₹8,40,000", "of ₹12,00,000 budget", 70],
            ["Tasks completed", "24 / 32", "A little closer, every day", 75],
            ["Wedding RSVP", "243 attending", "264 guests invited", 92],
          ].map(([label, value, caption, percent]) => (
            <div className="stat-card" key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{caption}</p>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="panel-title">
            <h3>Your celebrations</h3>
            <small>4 ceremonies</small>
          </div>
          <div className="ceremony-grid">
            {[
              ["Nov 24", "Mehendi", "Lakeside lawn"],
              ["Nov 25", "Haldi", "Inner courtyard"],
              ["Nov 26", "Wedding", "Garden pavilion"],
              ["Nov 27", "Reception", "Banquet hall"],
            ].map(([date, name, venue]) => (
              <div
                className={`ceremony ${name === "Wedding" ? "selected" : ""}`}
                key={name}
              >
                <small>{date}</small>
                <strong>{name}</strong>
                <span>{venue}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="panel-title">
            <h3>A little help from family</h3>
          </div>
          <div className="hero-task">
            <Icon name="check" />
            <span>Confirm the Mehendi venue</span>
            <span className="badge">Completed</span>
          </div>
          <div className="hero-task">
            <Icon name="flower" />
            <span>Choose flowers for the mandap</span>
            <span className="badge warm">In progress</span>
          </div>
        </div>
        <p className="preview-disclaimer">
          Illustrative data · No real wedding or guest information
        </p>
      </div>
    </div>
  );
}

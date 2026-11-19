"use client";

import { useState } from "react";
import { Icon } from "@/components/marketing/icon";

const views = ["Overview", "Tasks", "Expenses"] as const;

export function DemoPreview() {
  const [view, setView] = useState<(typeof views)[number]>("Overview");
  return (
    <div className="workspace-preview">
      <div className="workspace-toolbar">
        <h3>The wedding workspace</h3>
        <span className="badge">Read-only sample</span>
        <div
          className="preview-tabs"
          role="group"
          aria-label="Sample workspace view"
        >
          {views.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={view === item}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="workspace-columns" aria-live="polite">
        <div className="workspace-main">
          {view === "Overview" ? (
            <>
              <div className="panel-title">
                <h4>Upcoming celebrations</h4>
                <span className="eyebrow">Your shared itinerary</span>
              </div>
              <div className="sample-row">
                <span className="icon-tile dark">
                  <Icon name="flower" />
                </span>
                <div>
                  <strong>Mehendi by the Lake</strong>
                  <small>Lakeside lawn · 24 November · 14:00–18:30</small>
                  <span className="badge">110 guests invited</span>
                </div>
              </div>
              <div className="sample-row">
                <span className="icon-tile gold">
                  <Icon name="calendar" />
                </span>
                <div>
                  <strong>Wedding & Family Dinner</strong>
                  <small>Garden pavilion · 26 November · 19:00–23:00</small>
                  <span className="badge">264 guests invited</span>
                </div>
              </div>
              <h4 className="table-heading">Recorded spending by category</h4>
              <ExpenseTable />
            </>
          ) : view === "Tasks" ? (
            <>
              <div className="panel-title">
                <h4>A little progress, every day</h4>
                <span className="badge">24 of 32 complete</span>
              </div>
              {[
                ["Confirm the Mehendi venue", "Meera · Mehendi", "Completed"],
                [
                  "Choose flowers for the mandap",
                  "Priya · Wedding",
                  "In progress",
                ],
                [
                  "Finalize the reception playlist",
                  "Aarav · Reception",
                  "To do",
                ],
                ["Review family RSVP responses", "Rajesh · Wedding", "To do"],
              ].map(([title, meta, status]) => (
                <div className="sample-row task-row" key={title}>
                  <Icon name={status === "Completed" ? "check" : "calendar"} />
                  <div>
                    <strong>{title}</strong>
                    <small>{meta}</small>
                  </div>
                  <span
                    className={`badge ${status === "In progress" ? "warm" : ""}`}
                  >
                    {status}
                  </span>
                </div>
              ))}
              <p className="sample-note">
                Sample tasks only. Changes to a real wedding require an
                authorized account.
              </p>
            </>
          ) : (
            <>
              <div className="panel-title">
                <h4>Every expense, in one place</h4>
                <span className="badge">INR</span>
              </div>
              <div className="budget-summary">
                <div>
                  <small>Overall budget</small>
                  <strong>₹12,00,000</strong>
                </div>
                <div>
                  <small>Recorded expenses</small>
                  <strong>₹8,40,000</strong>
                </div>
                <div>
                  <small>Remaining budget</small>
                  <strong>₹3,60,000</strong>
                </div>
              </div>
              <ExpenseTable />
              <p className="sample-note">
                Remaining budget is the overall budget minus recorded expenses.
              </p>
            </>
          )}
        </div>
        <aside className="workspace-team">
          <div className="panel-title">
            <h4>Your people, together</h4>
            <span className="badge">2 co-owners</span>
          </div>
          <p>
            Shared ownership for the couple. Selected responsibilities for the
            people helping you.
          </p>
          {[
            ["MK", "Meera Kapoor", "Bride · Co-owner", "OWNER"],
            ["AS", "Aarav Sharma", "Groom · Co-owner", "OWNER"],
            ["PS", "Priya Sharma", "Events & assigned tasks", "ORGANIZER"],
          ].map(([initials, name, role, badge]) => (
            <div className="person-row" key={name}>
              <span className="avatar">{initials}</span>
              <div>
                <strong>{name}</strong>
                <small>{role}</small>
              </div>
              <span className={`badge ${badge === "OWNER" ? "dark" : "warm"}`}>
                {badge}
              </span>
            </div>
          ))}
          <div className="access-note">
            <div>
              <span className="eyebrow">Thoughtful permissions</span>
              <p>
                Expense details are only available to members with finance
                access.
              </p>
            </div>
            <Icon name="shield" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ExpenseTable() {
  return (
    <div className="expense-table-wrap">
      <table className="expense-table">
        <caption className="sr-only">
          Sample wedding expenses by category and payer
        </caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Paid by</th>
            <th scope="col">Recorded</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Catering & dining", "Rajesh", "₹4,50,000"],
            ["Venue", "Meera", "₹1,90,000"],
            ["Flowers & décor", "Priya", "₹1,20,000"],
            ["Photography", "Aarav", "₹80,000"],
          ].map(([category, payer, amount]) => (
            <tr key={category}>
              <td>
                <span className="table-dot" />
                {category}
              </td>
              <td>{payer}</td>
              <td>{amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

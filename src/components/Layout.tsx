import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/themes", label: "Theme Designer" },
  { to: "/settings", label: "Settings" },
  { to: "/guide", label: "Guide" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-8">
        <h1 className="text-xl font-bold tracking-wide text-amber-400" style={{ fontFamily: "Pacifico" }}>
          Pawsport
        </h1>
        <nav className="flex gap-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `text-sm px-3 py-1.5 rounded transition ${
                  isActive
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

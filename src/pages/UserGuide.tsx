export default function UserGuide() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-amber-400">User Guide</h1>
      <p className="text-slate-300 text-sm">
        A quick reference for using the PAWSPORT poster generator.
      </p>

      {/* Dashboard */}
      <Section title="Dashboard">
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
          <li>The main page shows all foster dogs pulled from the spreadsheet.</li>
          <li>Use the <strong className="text-white">Select All</strong> / <strong className="text-white">Clear</strong> buttons to manage your selection.</li>
          <li>Click individual checkboxes to pick specific dogs.</li>
          <li>Click a dog card to open the poster editor for that dog.</li>
        </ul>
      </Section>

      {/* Editing a Poster */}
      <Section title="Editing a Poster">
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
          <li>Click any dog card on the Dashboard to open the editor.</li>
          <li>Edit text fields (name, breed, weight, etc.) directly in the form.</li>
          <li>
            Adjust the photo using <strong className="text-white">Fill</strong> mode
            (crops to fill the frame) or <strong className="text-white">Fit</strong> mode
            (shows the full image with padding).
          </li>
          <li>Use the vertical slider to shift the crop position up or down.</li>
          <li>Click <strong className="text-white">Generate Poster</strong> to create the final print-ready image.</li>
          <li>Download the finished poster with the <strong className="text-white">Download</strong> button.</li>
        </ul>
      </Section>

      {/* Themes */}
      <Section title="Themes">
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
          <li>Switch between seasonal themes (Spring, Summer, Fall, Winter) from the Dashboard or Theme Designer.</li>
          <li>Open the <strong className="text-white">Theme Designer</strong> page to customize colors, fonts, and decorations.</li>
          <li>Changes are saved per theme and apply to all posters generated with that theme.</li>
          <li>You can create new themes or duplicate an existing one as a starting point.</li>
        </ul>
      </Section>

      {/* Bulk Actions */}
      <Section title="Bulk Actions">
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
          <li><strong className="text-white">Generate All</strong> builds posters for every dog in the list.</li>
          <li><strong className="text-white">Generate Selected</strong> builds posters only for checked dogs.</li>
          <li>After generation, use <strong className="text-white">Download ZIP</strong> to save all posters at once.</li>
          <li>
            Click <strong className="text-white">Email ZIP</strong> to send the ZIP by email.
            Enter a recipient address or leave it blank to use the default.
          </li>
        </ul>
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
          <li>Upload custom fonts (.ttf / .otf) to use in your themes.</li>
          <li>Upload background textures for poster designs.</li>
          <li>Uploaded assets become available in the Theme Designer immediately.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

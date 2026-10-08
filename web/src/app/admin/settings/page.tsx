import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin settings" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Settings</h1>

      <form className="admin-card space-y-4">
        <p className="font-black text-gray-900">Company</p>
        <input className="input-field" defaultValue="Mobilare" />
        <input className="input-field" defaultValue="bookings@mobilare.co.uk" />
        <input className="input-field" defaultValue="07984 884644" />
        <button type="button" className="btn-primary">
          Save company
        </button>
      </form>

      <form className="admin-card space-y-4">
        <p className="font-black text-gray-900">Booking defaults</p>
        <label className="block text-sm text-gray-600">
          Default success URL
          <input
            className="input-field mt-1"
            defaultValue="https://mobilare.co.uk/booking-success"
          />
        </label>
        <label className="block text-sm text-gray-600">
          Default cancel URL
          <input
            className="input-field mt-1"
            defaultValue="https://mobilare.co.uk/booking-cancel"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" defaultChecked className="accent-teal" />
          Require pay in full
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" defaultChecked className="accent-teal" />
          VAT-inclusive display
        </label>
        <button type="button" className="btn-primary">
          Save booking settings
        </button>
      </form>

      <form className="admin-card space-y-4">
        <p className="font-black text-gray-900">Notifications</p>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="accent-teal" />
          Email customer on payment received
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" defaultChecked className="accent-teal" />
          Email ops on new paid booking
        </label>
        <button type="button" className="btn-secondary">
          Save notifications
        </button>
      </form>
    </div>
  );
}

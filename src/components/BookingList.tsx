import { Booking } from "../types";
import { 
  FileText, 
  Edit3, 
  Trash2, 
  Search, 
  ChevronRight,
  MoreVertical,
  Calendar,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "../lib/utils";

interface BookingListProps {
  bookings: Booking[];
  loading: boolean;
  onGenerateInvoice: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onDelete: () => void;
  token: string;
}

export default function BookingList({ 
  bookings, 
  loading, 
  onGenerateInvoice, 
  onEdit, 
  onDelete,
  token 
}: BookingListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredBookings = bookings.filter(b => {
    const name = b.customer?.name || "";
    const bId = b.bookingId || "";
    const mobile = b.customer?.mobile || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           mobile.includes(searchTerm);
  }).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onDelete();
        setDeletingId(null);
      } else if (res.status === 401) {
        alert("Session expired. Please login again.");
        window.location.reload();
      }
    } catch (e) {
      console.error("Delete failed", e);
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-full" />
          <div className="h-4 w-32 bg-neutral-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, ID or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-sm text-neutral-500 font-medium">
          Showing {filteredBookings.length} bookings
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Booking ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Event Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-bold text-neutral-900">{booking.bookingId}</div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        {format(new Date(booking.bookingDate), "dd MMM yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{booking.customer.name}</div>
                      <div className="text-xs text-neutral-500">{booking.customer.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(booking.event.date), "dd MMM yyyy")}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                        <Users className="w-3 h-3" />
                        {booking.event.pax} PAX • {booking.event.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-neutral-900">₹{booking.payment.rentalAmount}</div>
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mt-1",
                        booking.payment.rentalAmount - booking.payment.amountReceived === 0 
                          ? "text-green-600" 
                          : "text-amber-600"
                      )}>
                        {booking.payment.rentalAmount - booking.payment.amountReceived === 0 ? "Paid" : "Pending"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deletingId === booking.id ? (
                          <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-100">
                            <span className="text-[10px] font-bold text-red-600 px-2 uppercase">Delete?</span>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 transition-colors"
                            >
                              YES
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-white border border-neutral-200 text-neutral-600 text-[10px] font-bold rounded hover:bg-neutral-50 transition-colors"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => onGenerateInvoice(booking)}
                              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all"
                              title="Generate Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEdit(booking)}
                              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(booking.id)}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-neutral-200 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-neutral-100">
          {filteredBookings.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-400">
              No bookings found
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-xs font-bold text-neutral-400">{booking.bookingId}</div>
                    <div className="font-bold text-neutral-900 text-lg">{booking.customer.name}</div>
                    <div className="text-sm text-neutral-500">{booking.customer.mobile}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-neutral-900">₹{booking.payment.rentalAmount}</div>
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      booking.payment.rentalAmount - booking.payment.amountReceived === 0 
                        ? "text-green-600" 
                        : "text-amber-600"
                    )}>
                      {booking.payment.rentalAmount - booking.payment.amountReceived === 0 ? "Paid" : "Pending"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(booking.event.date), "dd MMM yyyy")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {booking.event.pax} PAX
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  {deletingId === booking.id ? (
                    <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-100 w-full justify-between">
                      <span className="text-xs font-bold text-red-600 px-2 uppercase">Delete this booking?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                        >
                          YES
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-4 py-1.5 bg-white border border-neutral-200 text-neutral-600 text-xs font-bold rounded hover:bg-neutral-50 transition-colors"
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onGenerateInvoice(booking)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-all text-xs font-bold"
                      >
                        <FileText className="w-4 h-4" />
                        Invoice
                      </button>
                      <button
                        onClick={() => onEdit(booking)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg border border-neutral-200 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(booking.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-neutral-50 rounded-lg border border-neutral-200 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

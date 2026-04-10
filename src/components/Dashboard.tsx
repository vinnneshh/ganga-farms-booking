import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PlusCircle, 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  Calendar,
  Users,
  CreditCard,
  Search
} from "lucide-react";
import BookingForm from "./BookingForm";
import BookingList from "./BookingList";
import InvoiceGenerator from "./InvoiceGenerator";
import { Booking } from "../types";
import { cn } from "../lib/utils";

interface DashboardProps {
  onLogout: () => void;
  token: string;
}

type Tab = "view" | "create" | "invoice";

export default function Dashboard({ onLogout, token }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("view");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched bookings:", data.length);
        setBookings(data);
      } else if (res.status === 401) {
        onLogout();
      }
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleBookingCreated = async (booking?: Booking) => {
    await fetchBookings();
    if (booking) {
      setSelectedBooking(booking);
      setActiveTab("invoice");
    } else {
      setActiveTab("view");
    }
  };

  const handleGenerateInvoice = (booking: Booking) => {
    setSelectedBooking(booking);
    setActiveTab("invoice");
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setActiveTab("create");
  };

  const tabs = [
    { id: "view", label: "View Bookings", icon: LayoutDashboard },
    { id: "create", label: "Create Booking", icon: PlusCircle },
    { id: "invoice", label: "Generate Invoice", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="bg-neutral-900 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900 leading-none">
                  Booking Management System
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">
                  Ganga Farms
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab);
                if (tab.id === "create") {
                  setSelectedBooking(null);
                } else if (tab.id !== "invoice") {
                  setSelectedBooking(null);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-neutral-900 text-white shadow-md"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "view" && (
                <BookingList 
                  bookings={bookings} 
                  loading={loading} 
                  onGenerateInvoice={handleGenerateInvoice}
                  onEdit={handleEditBooking}
                  onDelete={fetchBookings}
                  token={token}
                />
              )}
              {activeTab === "create" && (
                <BookingForm 
                  onSuccess={handleBookingCreated} 
                  token={token} 
                  initialData={selectedBooking}
                />
              )}
              {activeTab === "invoice" && (
                <InvoiceGenerator 
                  booking={selectedBooking} 
                  onBack={() => setActiveTab("view")}
                  onEdit={() => setActiveTab("create")}
                  onDelete={() => {
                    fetchBookings();
                    setActiveTab("view");
                  }}
                  token={token}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

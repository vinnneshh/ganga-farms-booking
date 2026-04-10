import React, { useState, useEffect } from "react";
import { Booking } from "../types";
import { Calendar, User, MapPin, CreditCard, Info, Save, Loader2 } from "lucide-react";
import { amountToWords } from "../lib/utils";

interface BookingFormProps {
  onSuccess: (booking: Booking) => void;
  token: string;
  initialData?: Booking | null;
}

export default function BookingForm({ onSuccess, token, initialData }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Booking>>({
    bookingId: "",
    bookingDate: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    customer: {
      name: "",
      mobile: "",
      aadhar: "",
      address: "",
    },
    event: {
      date: "",
      pax: 0,
      type: "",
    },
    payment: {
      rentalAmount: 0,
      amountReceived: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode: "Cash",
      securityDeposit: 10000,
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        bookingId: "",
        bookingDate: new Date().toISOString().split("T")[0],
        checkIn: "",
        checkOut: "",
        customer: {
          name: "",
          mobile: "",
          aadhar: "",
          address: "",
        },
        event: {
          date: "",
          pax: 0,
          type: "",
        },
        payment: {
          rentalAmount: 0,
          amountReceived: 0,
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMode: "Cash",
          securityDeposit: 10000,
        },
      });
    }
  }, [initialData]);

  const balanceAmount = (formData.payment?.rentalAmount || 0) - (formData.payment?.amountReceived || 0);
  const totalDue = balanceAmount + (formData.payment?.securityDeposit || 0);
  const totalDueWords = amountToWords(totalDue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Submitting booking data:", JSON.stringify(formData));
      const url = initialData ? `/api/bookings/${initialData.id}` : "/api/bookings";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedBooking = await res.json();
        onSuccess(savedBooking);
      } else if (res.status === 401) {
        alert("Session expired. Please login again.");
        window.location.reload(); // Force reload to clear state and redirect to login
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save booking. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save booking", err);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateNested = (path: string, value: any) => {
    const keys = path.split(".");
    setFormData((prev) => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Details */}
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
            <Calendar className="w-5 h-5 text-neutral-400" />
            <h2 className="font-bold text-neutral-900">Booking Details</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Booking ID (Manual)</label>
              <input
                type="text"
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                className="input-field"
                placeholder="e.g. GF-1001"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Booking Date</label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Check-in Date & Time</label>
              <input
                type="datetime-local"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Check-out Date & Time</label>
              <input
                type="datetime-local"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
            <User className="w-5 h-5 text-neutral-400" />
            <h2 className="font-bold text-neutral-900">Customer Details</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Full Name</label>
              <input
                type="text"
                value={formData.customer?.name}
                onChange={(e) => updateNested("customer.name", e.target.value)}
                className="input-field"
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.customer?.mobile}
                  onChange={(e) => updateNested("customer.mobile", e.target.value)}
                  className="input-field"
                  placeholder="10-digit mobile"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Aadhar Number</label>
                <input
                  type="text"
                  value={formData.customer?.aadhar}
                  onChange={(e) => updateNested("customer.aadhar", e.target.value)}
                  className="input-field"
                  placeholder="12-digit Aadhar"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Address</label>
              <textarea
                value={formData.customer?.address}
                onChange={(e) => updateNested("customer.address", e.target.value)}
                className="input-field min-h-[80px] py-3"
                placeholder="Customer address"
                required
              />
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
            <Info className="w-5 h-5 text-neutral-400" />
            <h2 className="font-bold text-neutral-900">Event Details</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Event Date</label>
              <input
                type="date"
                value={formData.event?.date}
                onChange={(e) => updateNested("event.date", e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Number of Guests (PAX)</label>
              <input
                type="number"
                value={formData.event?.pax}
                onChange={(e) => updateNested("event.pax", parseInt(e.target.value) || 0)}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Event Type</label>
            <input
              type="text"
              value={formData.event?.type}
              onChange={(e) => updateNested("event.type", e.target.value)}
              className="input-field"
              placeholder="e.g. Birthday, Wedding, Corporate"
              required
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
            <CreditCard className="w-5 h-5 text-neutral-400" />
            <h2 className="font-bold text-neutral-900">Payment Details</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Rental Amount</label>
              <input
                type="number"
                value={formData.payment?.rentalAmount}
                onChange={(e) => updateNested("payment.rentalAmount", parseInt(e.target.value) || 0)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Amount Received</label>
              <input
                type="number"
                value={formData.payment?.amountReceived}
                onChange={(e) => updateNested("payment.amountReceived", parseInt(e.target.value) || 0)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Payment Date</label>
              <input
                type="date"
                value={formData.payment?.paymentDate}
                onChange={(e) => updateNested("payment.paymentDate", e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Payment Mode</label>
              <select
                value={formData.payment?.paymentMode}
                onChange={(e) => updateNested("payment.paymentMode", e.target.value)}
                className="input-field"
                required
              >
                <option value="Cash">Cash</option>
                <option value="PhonePe">PhonePe</option>
                <option value="GPay">GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Security Deposit</label>
            <input
              type="number"
              value={formData.payment?.securityDeposit}
              onChange={(e) => updateNested("payment.securityDeposit", parseInt(e.target.value) || 0)}
              className="input-field"
              required
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Balance Amount:</span>
              <span className="font-bold text-neutral-900">₹{balanceAmount}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-neutral-900 font-bold">Total Due Amount:</span>
              <span className="font-bold text-neutral-900 underline decoration-2 decoration-neutral-900 underline-offset-4">₹{totalDue}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 text-right">
              {totalDueWords}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2 min-w-[200px] justify-center"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              {initialData ? "Update Booking" : "Save Booking"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

import { useRef, useState } from "react";
import { Booking } from "../types";
import { 
  Download, 
  Printer, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { amountToWords, formatCurrency, cn } from "../lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface InvoiceGeneratorProps {
  booking: Booking | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  token?: string;
}

export default function InvoiceGenerator({ booking, onBack, onEdit, onDelete, token }: InvoiceGeneratorProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!booking) {
    return (
      <div className="premium-card p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-900">No Booking Selected</h2>
        <p className="text-neutral-500 max-w-xs mx-auto">
          Please select a booking from the list to generate an invoice.
        </p>
        <button onClick={onBack} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!token || !onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onDelete();
      } else {
        alert("Failed to delete booking.");
      }
    } catch (e) {
      console.error("Delete failed", e);
      alert("An error occurred while deleting.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setGenerating(true);

    try {
      console.log("Starting PDF generation...");
      const element = invoiceRef.current;
      
      // Wait a tiny bit for any layout shifts or font rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use a more robust configuration for html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: -window.scrollY, // Fix for scrolled pages
        onclone: (clonedDoc) => {
          // Find all elements in the cloned document and fix oklch colors
          const elements = Array.from(clonedDoc.getElementsByTagName("*"));
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            
            // Force standard colors on the container and its children
            if (htmlEl.classList.contains("invoice-container")) {
              htmlEl.style.backgroundColor = "#ffffff";
              htmlEl.style.color = "#171717";
            }

            // List of properties that might contain colors
            const colorProps = [
              "color", "background-color", "border-color", "box-shadow", "outline-color", "column-rule-color"
            ];
            
            const computedStyle = window.getComputedStyle(el);
            
            colorProps.forEach(prop => {
              const value = computedStyle.getPropertyValue(prop);
              if (value && value.includes("oklch")) {
                // Fallback to safe colors
                if (prop === "background-color") {
                   htmlEl.style.setProperty(prop, "#ffffff", "important");
                } else if (prop === "color") {
                   htmlEl.style.setProperty(prop, "#171717", "important");
                } else if (prop.includes("border") || prop.includes("color")) {
                   htmlEl.style.setProperty(prop, "#e5e5e5", "important");
                } else if (prop === "box-shadow") {
                   htmlEl.style.setProperty(prop, "none", "important");
                }
              }
            });
          });
        }
      });
      
      console.log("Canvas captured successfully");
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Ganga_Farms_Invoice_${booking.bookingId || "Booking"}.pdf`;
      pdf.save(fileName);
      console.log("PDF saved successfully:", fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again or use the Print button.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const balanceAmount = booking.payment.rentalAmount - booking.payment.amountReceived;
  const totalDue = balanceAmount + booking.payment.securityDeposit;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-100">
              <span className="text-xs font-bold text-red-600 px-2">Confirm Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "YES"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-600 text-xs font-bold rounded hover:bg-neutral-50 transition-colors"
              >
                NO
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button 
            onClick={onEdit} 
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Edit Details
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={generating}
            className="btn-primary flex items-center gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="flex justify-center">
        <div 
          ref={invoiceRef}
          className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl border border-neutral-200 print:shadow-none print:border-none print:p-0 invoice-container"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-neutral-900 pb-6 mb-8">
            <h1 className="text-4xl font-serif font-bold tracking-tight text-neutral-900 mb-1">
              GANGA FARMS BOOKING CONFIRMATION
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
              Premium Farmhouse Experience
            </p>
          </div>

          {/* Booking Meta */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-1">
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Booking ID</span>
                <span className="text-sm font-mono font-bold text-neutral-900">{booking.bookingId}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Booking Date</span>
                <span className="text-sm font-medium text-neutral-900">{format(new Date(booking.bookingDate), "EEEE, MMMM d, yyyy")}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Check-In</span>
                <span className="text-sm font-medium text-neutral-900">{format(new Date(booking.checkIn), "MMM d, yyyy • h:mm a")}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Check-Out</span>
                <span className="text-sm font-medium text-neutral-900">{format(new Date(booking.checkOut), "MMM d, yyyy • h:mm a")}</span>
              </div>
            </div>
          </div>

          {/* Customer & Event Grid */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-100 pb-2">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-serif font-bold text-neutral-900">{booking.customer.name}</p>
                  <p className="text-sm text-neutral-600">{booking.customer.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Aadhar Number</p>
                  <p className="text-sm font-medium text-neutral-900">{booking.customer.aadhar}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Address</p>
                  <p className="text-sm text-neutral-600 leading-relaxed">{booking.customer.address}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-100 pb-2">Event Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-serif font-bold text-neutral-900">{booking.event.type}</p>
                  <p className="text-sm text-neutral-600">{format(new Date(booking.event.date), "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-neutral-400">Number of Guests</p>
                  <p className="text-sm font-medium text-neutral-900">{booking.event.pax} PAX</p>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Note</p>
                  <p className="text-[10px] text-neutral-500 italic">
                    (500/Person will be charged if the guests are more than above the agreed people)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Table */}
          <div className="mb-12">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-100 pb-2">Payment Summary</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="py-2 text-[10px] font-bold uppercase text-neutral-400">Description</th>
                  <th className="py-2 text-[10px] font-bold uppercase text-neutral-400 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3 text-sm font-medium text-neutral-700">Rental Amount</td>
                  <td className="py-3 text-sm font-bold text-neutral-900 text-right">₹{booking.payment.rentalAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm font-medium text-neutral-700">Amount Received ({booking.payment.paymentMode})</td>
                  <td className="py-3 text-sm font-bold text-neutral-900 text-right">- ₹{booking.payment.amountReceived.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm font-medium text-neutral-700">Balance Rental Amount</td>
                  <td className="py-3 text-sm font-bold text-neutral-900 text-right">₹{balanceAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm font-medium text-neutral-700">Refundable Security Deposit</td>
                  <td className="py-3 text-sm font-bold text-neutral-900 text-right">₹{booking.payment.securityDeposit.toLocaleString()}</td>
                </tr>
                <tr className="bg-neutral-900 text-white">
                  <td className="py-4 px-4 text-sm font-bold uppercase tracking-wider">Total Due Amount</td>
                  <td className="py-4 px-4 text-xl font-serif font-bold text-right">₹{totalDue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Amount in Words</p>
              <p className="text-sm font-serif italic text-neutral-900">{amountToWords(totalDue)}</p>
            </div>
          </div>

          {/* Terms & Conditions (The 4 Paragraphs) */}
          <div className="space-y-8 border-t-2 border-neutral-900 pt-8">
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                Terms & Conditions
              </h4>
              <div className="text-[10px] leading-relaxed text-neutral-600 space-y-2">
                <p>The following are strictly prohibited within the farmhouse premises.</p>
                <p>1.Foreign/Imported liquor 2.Hookah /Hukka 3.Drugs 4. Any other illegal activities.</p>
                <p>✧ Single Day Liquor License is must in case liquor is served as per the Telangana Govt approved norms( no liquor will be allowed without obtaining the permission).</p>
                <p>✧ For Security purposes, all guests must share aadhar card and Id card before check in.</p>
                <p>✧ Security Deposit is payable at the villa at the time of Check-in which is 100% refundable , if no damage made. Any damage to the property will be deducted in the security deposit.</p>
                <p>✧ Extra checkout time 1000/- per hour for day stays, and 3000/ hour for events.</p>
                <p>✧ An additional charge of ₹1000 applies for a campfire if required.</p>
                <p>✧ In case of power loss we only have generator backup for Villa lights and fans .If the power loss is for more than 2 hrs, extra amount for diesel have to be borne by the guests</p>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                Rules of the House
              </h4>
              <div className="text-[10px] leading-relaxed text-neutral-600 space-y-2">
                <p>Decor & Lighting Organisers shall contact the maintenance manager for the timing.</p>
                <p>✧ No DJ And No Loud Music after 11pm. No outside guests allowed without prior information. Police Permission for DJ shall be obtained by the Guest.</p>
                <p>✧ Haldi , Mahndi etc, Colour are strictly not allowed in the swimming pool otherwise 25k Penalty if any pool is damaged due to haldi.</p>
                <p>✧ Portable generators during events for exterior power for lawns,decocrations,stage ,etc should be arranged by the guests only.</p>
                <p>✧ In case any illegal activities the guest will be asked to checkout immediately and the amount will not be refunded.</p>
                <p>✧ Management is not responsible for any stolen or lost items.</p>
                <p>✧ Tip the caretaker for cleaning while checkout.</p>
                <p className="font-bold italic">Your cooperation in adhering to these rules is greatly appreciated</p>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                Booking Policy
              </h4>
              <div className="text-[10px] leading-relaxed text-neutral-600 space-y-2">
                <p>Once the payment is processed, please share the screenshot with Booking Manager and we will block the villa for your dates.</p>
                <p>✧ Token will only soft block the villa for some hours, please pay 50% or the amount advised to book the villa.</p>
                <p>✧ Once the token is received, the balance 50% payments or the amount discussed as advance has to come in within 24 hours, as the blocking of the property needs 50% advance.</p>
                <p>✧ Availability can be dynamic so please process and share the payment screenshots ASAP . After that the dates will be blocked</p>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
                Cancellation Policy
              </h4>
              <div className="text-[10px] leading-relaxed text-neutral-600 space-y-2">
                <p>In case of cancellation made during the below mentioned period before the Check in by Guests, the following amount shall be deducted from the total Booking Amount.</p>
                <p>✧ The Advance amount is non refundable in case of rains/cancellation or any other reason-the management is not responsible.</p>
                <p>✧ Cancellation more than 60 days prior to the check in date- 100% refund of the original booking amount to the Customer.</p>
                <p>✧ Cancellation between 30-60 days prior to the check in date - 75% refund.</p>
                <p>✧ Cancellation between 15-30 days prior to the check in date - 50% refund.</p>
                <p>✧ Cancellation within 15 days of the check in date – No refund to the customer.</p>
              </div>
            </section>
          </div>

          {/* Footer Signatures */}
          <div className="mt-16 pt-12 border-t border-neutral-100 grid grid-cols-2 gap-24">
            <div className="text-center">
              <div className="border-b border-neutral-900 mb-2 h-12" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Customer Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-neutral-900 mb-2 h-12" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Manager Signature</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-2xl font-serif italic text-neutral-300">Thank You</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Override oklch colors for html2canvas compatibility */
        .invoice-container {
          background-color: #ffffff !important;
          color: #171717 !important; /* neutral-900 */
        }
        .invoice-container .text-neutral-900 { color: #171717 !important; }
        .invoice-container .text-neutral-700 { color: #404040 !important; }
        .invoice-container .text-neutral-600 { color: #525252 !important; }
        .invoice-container .text-neutral-500 { color: #737373 !important; }
        .invoice-container .text-neutral-400 { color: #a3a3a3 !important; }
        .invoice-container .text-neutral-300 { color: #d4d4d4 !important; }
        
        .invoice-container .bg-neutral-900 { background-color: #171717 !important; }
        .invoice-container .bg-neutral-50 { background-color: #fafafa !important; }
        
        .invoice-container .border-neutral-900 { border-color: #171717 !important; }
        .invoice-container .border-neutral-200 { border-color: #e5e5e5 !important; }
        .invoice-container .border-neutral-100 { border-color: #f5f5f5 !important; }

        @media print {
          body * {
            visibility: hidden;
          }
          #root, #root * {
            visibility: visible;
          }
          #root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Copy, CheckCircle2, Phone, AlertCircle, Wifi } from 'lucide-react';

/**
 * QRPaymentModal — Generates a USSD-based mobile money QR code.
 *
 * USSD format: *712*{merchantNumber}*{amount}#
 * When scanned on a supported device, attempts to launch the phone dialer.
 * Falls back to displaying the USSD code manually.
 *
 * The merchantNumber is configurable per-company via localStorage ('gurey_merchant_number').
 * Default: 615283292
 */
export default function QRPaymentModal({ total, onClose }) {
  const [copied, setCopied] = useState(false);
  const [merchantNumber, setMerchantNumber] = useState(() => {
    try {
      return localStorage.getItem('gurey_merchant_number') || '615283292';
    } catch {
      return '615283292';
    }
  });

  const roundedTotal = Math.ceil(total); // round up to whole number for USSD
  const ussdString = `*712*${merchantNumber}*${roundedTotal}#`;

  // tel: URI encodes USSD as tel:*712*... (supported on Android/some iOS)
  const dialerUrl = `tel:${encodeURIComponent(ussdString)}`;

  const handleDialerLaunch = () => {
    // Attempt to open dialer — works on Android Chrome and some native browsers
    window.location.href = dialerUrl;
  };

  const handleCopyUSSD = async () => {
    try {
      await navigator.clipboard.writeText(ussdString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const inp = document.createElement('input');
      inp.value = ussdString;
      document.body.appendChild(inp);
      inp.select();
      document.execCommand('copy');
      document.body.removeChild(inp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-4xl p-6 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Mobile Money QR</h3>
            <p className="text-xs text-slate-400">Scan to pay via USSD • EVC / Zaad / Sahal</p>
          </div>
        </div>

        {/* Amount Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Amount to Collect</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300 mt-0.5">
            ${total.toFixed(2)}
          </p>
        </div>

        {/* QR Code — encodes the full USSD string */}
        <div className="flex flex-col items-center space-y-3">
          <div className="p-4 rounded-3xl bg-white shadow-lg border border-slate-100">
            <QRCodeSVG
              value={dialerUrl}
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />

          </div>
          <p className="text-[10px] font-semibold text-slate-400 text-center leading-snug">
            Customer scans this code with their mobile money app or camera
          </p>
        </div>

        {/* USSD String Display */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">USSD Code</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm font-black text-slate-900 dark:text-white tracking-wider text-center">
              {ussdString}
            </div>
            <button
              onClick={handleCopyUSSD}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105'
              }`}
              title="Copy USSD code"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            If the QR code doesn't scan, the customer can dial this code directly on their phone.
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Launch Dialer — works on mobile browsers */}
          <a
            href={dialerUrl}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
            title="Open dialer with USSD code"
          >
            <Phone className="w-4 h-4" />
            <span>Dial Now</span>
          </a>
          <button
            onClick={onClose}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Payment Done</span>
          </button>
        </div>

        {/* Info note */}
        <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
          <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-medium text-blue-500 dark:text-blue-300 leading-snug">
            Merchant number <span className="font-black">{merchantNumber}</span> is configurable in Settings. Automatic dialing requires a mobile device or browser that supports <code className="font-mono">tel:</code> URIs.
          </p>
        </div>
      </div>
    </div>
  );
}

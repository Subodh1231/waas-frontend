import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface BookingPosterToolsProps {
  bookingUrl: string;
  clinicSlug: string;
  clinicName: string;
  clinicLogoUrl?: string;
  clinicPhone?: string;
  clinicAddress?: string;
}

const POSTER_WIDTH = 1600;
const POSTER_HEIGHT = 2263;
const QR_SIZE = 680;

const safeFilename = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'clinic';

const wrappedLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const words = text.trim().split(/\s+/).filter(Boolean).flatMap((word) => {
    if (context.measureText(word).width <= maxWidth) return [word];
    const chunks: string[] = [];
    let chunk = '';
    for (const character of word) {
      if (chunk && context.measureText(chunk + character).width > maxWidth) {
        chunks.push(chunk);
        chunk = character;
      } else {
        chunk += character;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  });
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1];
    while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
};

const drawImageContain = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
};

const loadLogo = (url?: string): Promise<HTMLImageElement | null> => new Promise((resolve) => {
  if (!url) return resolve(null);
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = url;
});

const renderPoster = (
  qrCanvas: HTMLCanvasElement,
  data: BookingPosterToolsProps,
  logo: HTMLImageElement | null,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the poster image.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.fillStyle = '#2563eb';
  context.fillRect(0, 0, POSTER_WIDTH, 24);

  if (logo) drawImageContain(context, logo, 620, 90, 360, 210);

  const titleY = logo ? 375 : 280;
  context.fillStyle = '#111827';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  let clinicFontSize = 76;
  let clinicLines: string[] = [];
  while (clinicFontSize >= 48) {
    context.font = `700 ${clinicFontSize}px Arial, sans-serif`;
    clinicLines = wrappedLines(context, data.clinicName || 'Your Clinic', 1370, 2);
    if (clinicLines.length <= 2 && clinicLines.every((line) => context.measureText(line).width <= 1370)) break;
    clinicFontSize -= 6;
  }
  const clinicLineHeight = clinicFontSize * 1.18;
  clinicLines.forEach((line, index) => context.fillText(line, POSTER_WIDTH / 2, titleY + index * clinicLineHeight));

  const clinicNameBottom = titleY + clinicLines.length * clinicLineHeight;
  const ctaY = clinicNameBottom + 105;
  context.fillStyle = '#1f2937';
  context.font = '600 66px Arial, sans-serif';
  context.fillText('Book Your Appointment', POSTER_WIDTH / 2, ctaY);

  const qrY = ctaY + 105;
  const qrX = (POSTER_WIDTH - QR_SIZE) / 2;
  context.fillStyle = '#ffffff';
  context.fillRect(qrX - 36, qrY - 36, QR_SIZE + 72, QR_SIZE + 72);
  context.drawImage(qrCanvas, qrX, qrY, QR_SIZE, QR_SIZE);

  const scanY = qrY + QR_SIZE + 100;
  context.fillStyle = '#111827';
  context.font = '700 58px Arial, sans-serif';
  context.fillText('Scan to Book', POSTER_WIDTH / 2, scanY);
  context.fillStyle = '#374151';
  context.font = '400 36px Arial, sans-serif';
  context.fillText('Scan with your phone and choose your doctor and time slot.', POSTER_WIDTH / 2, scanY + 72);

  context.fillStyle = '#eff6ff';
  context.fillRect(310, scanY + 130, 980, 82);
  context.fillStyle = '#1d4ed8';
  context.font = '700 34px Arial, sans-serif';
  context.fillText('No app installation needed', POSTER_WIDTH / 2, scanY + 171);

  let detailY = scanY + 275;
  if (data.clinicPhone) {
    context.fillStyle = '#4b5563';
    context.font = '400 30px Arial, sans-serif';
    context.fillText(`Call ${data.clinicPhone}`, POSTER_WIDTH / 2, detailY);
    detailY += 55;
  }
  if (data.clinicAddress) {
    context.fillStyle = '#6b7280';
    context.font = '400 25px Arial, sans-serif';
    const addressLines = wrappedLines(context, data.clinicAddress, 1250, 2);
    addressLines.forEach((line, index) => context.fillText(line, POSTER_WIDTH / 2, detailY + index * 36));
    detailY += addressLines.length * 36 + 20;
  }

  context.fillStyle = '#1d4ed8';
  context.font = '600 32px Arial, sans-serif';
  const urlLines = wrappedLines(context, data.bookingUrl, 1380, 2);
  const urlY = Math.max(detailY + 30, 2030);
  urlLines.forEach((line, index) => context.fillText(line, POSTER_WIDTH / 2, urlY + index * 40));
  context.fillStyle = '#6b7280';
  context.font = '400 24px Arial, sans-serif';
  context.fillText('Powered by Bookzi', POSTER_WIDTH / 2, 2170);

  return canvas;
};

const canvasToPng = (canvas: HTMLCanvasElement) => new Promise<string>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) return reject(new Error('Could not create the poster image.'));
    resolve(URL.createObjectURL(blob));
  }, 'image/png');
});

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

const BookingPosterTools = ({
  bookingUrl,
  clinicSlug,
  clinicName,
  clinicLogoUrl,
  clinicPhone,
  clinicAddress,
}: BookingPosterToolsProps) => {
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);
  const [error, setError] = useState('');

  const generatePoster = async () => {
    const qrCanvas = document.getElementById('booking-poster-qr-source') as HTMLCanvasElement | null;
    if (!qrCanvas) throw new Error('The booking QR is not ready yet. Please try again.');
    const logo = await loadLogo(clinicLogoUrl);
    let poster = renderPoster(qrCanvas, { bookingUrl, clinicSlug, clinicName, clinicLogoUrl, clinicPhone, clinicAddress }, logo);
    try {
      // Probe origin cleanliness here; retry without a remote logo if its host disallows canvas export.
      poster.toDataURL('image/png');
    } catch {
      poster = renderPoster(qrCanvas, { bookingUrl, clinicSlug, clinicName, clinicPhone, clinicAddress }, null);
    }
    return poster;
  };

  const downloadPng = async () => {
    setBusy('png');
    setError('');
    try {
      const poster = await generatePoster();
      const objectUrl = await canvasToPng(poster);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `bookzi-booking-poster-${safeFilename(clinicSlug)}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not download the poster.');
    } finally {
      setBusy(null);
    }
  };

  const printPdf = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Allow pop-ups for this page to print or save the poster as a PDF.');
      return;
    }
    setBusy('pdf');
    setError('');
    try {
      const poster = await generatePoster();
      const objectUrl = await canvasToPng(poster);
      const title = escapeHtml(`bookzi-booking-poster-${safeFilename(clinicSlug)}`);
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:A4 portrait;margin:0}html,body{width:210mm;height:297mm;margin:0;padding:0;background:#fff}img{display:block;width:210mm;height:297mm;object-fit:contain;print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body><img alt="${escapeHtml(clinicName)} booking poster"></body></html>`);
      printWindow.document.close();
      const image = printWindow.document.querySelector('img');
      if (!image) throw new Error('Could not prepare the print page.');
      image.addEventListener('load', () => {
        printWindow.focus();
        printWindow.print();
        printWindow.addEventListener('afterprint', () => {
          URL.revokeObjectURL(objectUrl);
          printWindow.close();
        }, { once: true });
      }, { once: true });
      image.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        printWindow.close();
        setError('Could not prepare the poster for printing. Please download the PNG instead.');
      }, { once: true });
      image.src = objectUrl;
    } catch (printError) {
      printWindow.close();
      setError(printError instanceof Error ? printError.message : 'Could not prepare the poster for printing.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <QRCodeCanvas
        id="booking-poster-qr-source"
        value={bookingUrl}
        size={1024}
        level="M"
        marginSize={4}
        className="pointer-events-none fixed -left-[2000px] top-0"
        aria-hidden="true"
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto aspect-[210/297] w-full max-w-[330px] overflow-hidden border border-gray-200 bg-white px-5 py-7 text-center shadow-sm sm:px-7">
            <div className="relative mx-auto mb-4 flex h-12 w-28 items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{clinicName.charAt(0).toUpperCase()}</span>
              {clinicLogoUrl && <img src={clinicLogoUrl} alt={`${clinicName} logo`} onError={(event) => { event.currentTarget.style.display = 'none'; }} className="absolute inset-0 mx-auto h-12 max-w-28 bg-white object-contain" />}
            </div>
            <h3 className="line-clamp-2 break-words text-sm font-bold text-gray-900 sm:text-base">{clinicName}</h3>
            <p className="mt-3 text-xs font-semibold text-gray-800 sm:text-sm">Book Your Appointment</p>
            <div className="mx-auto mt-3 w-fit bg-white p-2"><QRCodeCanvas value={bookingUrl} size={136} level="M" marginSize={4} /></div>
            <p className="mt-2 text-[10px] font-semibold text-gray-900 sm:text-xs">Scan to Book</p>
            <p className="mx-auto mt-1 max-w-[220px] text-[9px] leading-4 text-gray-600 sm:text-[10px]">Choose your doctor and available time slot.</p>
            <p className="mt-2 text-[9px] font-semibold text-blue-700 sm:text-[10px]">No app installation needed</p>
            <p className="mt-3 break-all text-[8px] font-medium text-blue-700 sm:text-[9px]">{bookingUrl}</p>
            <p className="mt-2 text-[8px] text-gray-500">Powered by Bookzi</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm leading-6 text-gray-600">Preview your clinic’s poster before downloading. The QR code opens the same booking link shown above.</p>
          <button type="button" onClick={() => void downloadPng()} disabled={busy !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
            <Download className="h-4 w-4" />{busy === 'png' ? 'Preparing PNG…' : 'Download Booking Poster (PNG)'}
          </button>
          <button type="button" onClick={() => void printPdf()} disabled={busy !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60">
            <Printer className="h-4 w-4" />{busy === 'pdf' ? 'Preparing print…' : 'Print / Save as PDF (A4)'}
          </button>
          <p className="text-xs leading-5 text-gray-500">For PDF, choose “Save as PDF” in your browser’s print dialog. High-contrast QR is kept black and white for reliable scanning.</p>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default BookingPosterTools;

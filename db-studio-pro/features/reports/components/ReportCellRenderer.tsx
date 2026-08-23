import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { ColumnRenderType } from '../../../types/report';

interface ReportCellRendererProps {
  value: any;
  renderType?: ColumnRenderType;
  className?: string;
  style?: React.CSSProperties;
}

export const ReportCellRenderer: React.FC<ReportCellRendererProps> = ({
  value,
  renderType = 'text',
  className = '',
  style
}) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const strValue = value !== null && value !== undefined ? String(value) : '';

  // Generate QR code
  useEffect(() => {
    if (renderType === 'qrcode' && strValue) {
      QRCode.toDataURL(strValue, { width: 120, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [renderType, strValue]);

  // Generate Barcode
  useEffect(() => {
    if (renderType === 'barcode' && strValue && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, strValue, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 10,
          margin: 2
        });
      } catch (e) {
        console.warn('Barcode render error:', e);
      }
    }
  }, [renderType, strValue]);

  if (!strValue) {
    return <span className="text-slate-300 italic">-</span>;
  }

  switch (renderType) {
    case 'qrcode':
      return (
        <div className="inline-block p-1 bg-white border border-slate-200 rounded">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR: ${strValue}`} className="w-16 h-16 object-contain mx-auto" />
          ) : (
            <span className="text-[10px] text-slate-400">QR Laden...</span>
          )}
        </div>
      );

    case 'barcode':
      return (
        <div className="inline-block bg-white p-1 border border-slate-200 rounded">
          <svg ref={barcodeRef} className="max-w-[160px] h-10 mx-auto"></svg>
        </div>
      );

    case 'currency': {
      const num = parseFloat(strValue);
      const formatted = isNaN(num) 
        ? strValue 
        : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);
      return <span className={`font-mono font-semibold ${className}`} style={style}>{formatted}</span>;
    }

    case 'date': {
      let formatted = strValue;
      if (strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        const d = new Date(strValue);
        if (!isNaN(d.getTime())) {
          formatted = d.toLocaleDateString('de-DE');
        }
      }
      return <span className={className} style={style}>{formatted}</span>;
    }

    case 'badge': {
      const colors = ['bg-blue-100 text-blue-800 border-blue-200', 'bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-amber-100 text-amber-800 border-amber-200', 'bg-purple-100 text-purple-800 border-purple-200'];
      const colorClass = colors[Math.abs(strValue.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];
      return (
        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${colorClass}`}>
          {strValue}
        </span>
      );
    }

    case 'image':
      if (strValue.startsWith('http://') || strValue.startsWith('https://') || strValue.startsWith('data:image/')) {
        return <img src={strValue} alt="Asset" className="h-10 w-10 object-cover rounded border border-slate-200" />;
      }
      return <span className={className} style={style}>{strValue}</span>;

    case 'text':
    default:
      return <span className={className} style={style}>{strValue}</span>;
  }
};

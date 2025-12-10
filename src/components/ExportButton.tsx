import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportButtonProps {
  targetRef?: React.RefObject<HTMLElement>;
  filename?: string;
  title?: string;
  data?: any[];
  columns?: { key: string; label: string }[];
  type?: 'pdf' | 'csv' | 'both';
}

export function ExportButton({
  targetRef,
  filename = "reporte",
  title = "Reporte",
  data,
  columns,
  type = 'both',
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246);
      pdf.text(title, 14, 20);
      
      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-DO', { 
        dateStyle: 'long' 
      })}`, 14, 28);
      
      // Line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 32, pageWidth - 14, 32);

      if (targetRef?.current) {
        // Export from DOM element
        const canvas = await html2canvas(targetRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 14, 40, imgWidth, imgHeight);
      } else if (data && columns) {
        // Export from data
        let yPosition = 45;
        const lineHeight = 8;
        const colWidth = (pageWidth - 28) / columns.length;

        // Table header
        pdf.setFillColor(59, 130, 246);
        pdf.rect(14, yPosition - 5, pageWidth - 28, lineHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        
        columns.forEach((col, i) => {
          pdf.text(col.label, 16 + (i * colWidth), yPosition);
        });
        
        yPosition += lineHeight + 2;
        pdf.setTextColor(50, 50, 50);

        // Table rows
        data.forEach((row, rowIndex) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }

          // Alternate row background
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(14, yPosition - 5, pageWidth - 28, lineHeight, 'F');
          }

          columns.forEach((col, i) => {
            const value = String(row[col.key] || '');
            const truncated = value.length > 20 ? value.substring(0, 17) + '...' : value;
            pdf.text(truncated, 16 + (i * colWidth), yPosition);
          });
          
          yPosition += lineHeight;
        });
      }

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF exportado exitosamente");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Error al exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!data || !columns) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      const headers = columns.map(c => c.label).join(',');
      const rows = data.map(row => 
        columns.map(col => {
          const value = String(row[col.key] || '');
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      );
      
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success("CSV exportado exitosamente");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Error al exportar CSV");
    }
  };

  return (
    <div className="flex gap-2">
      {(type === 'pdf' || type === 'both') && (
        <Button
          variant="outline"
          size="sm"
          onClick={exportToPDF}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          PDF
        </Button>
      )}
      {(type === 'csv' || type === 'both') && data && columns && (
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
      )}
    </div>
  );
}

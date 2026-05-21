import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateResultPdfBase64(customerName: string): Promise<string | null> {
  try {
    const el = document.getElementById('lite-result-capture');
    if (!el) return null;

    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8f9fa',
      scrollY: -window.scrollY,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${customerName}_은퇴진단_${dateStr}.pdf`;
    const base64 = pdf.output('datauristring');
    const pureBase64 = base64.split(',')[1];

    return JSON.stringify({ base64: pureBase64, fileName });
  } catch (err) {
    console.error('PDF 생성 실패:', err);
    return null;
  }
}

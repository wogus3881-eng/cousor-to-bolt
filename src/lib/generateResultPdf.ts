import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function captureElementToPdf(elementId: string): Promise<jsPDF | null> {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`[PDF] id="${elementId}" 요소를 찾을 수 없음`);
    return null;
  }

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

  return pdf;
}

export async function generateResultPdfBase64(customerName: string, elementId = 'lite-result-capture'): Promise<string | null> {
  try {
    const pdf = await captureElementToPdf(elementId);
    if (!pdf) return null;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${customerName}_은퇴진단_${dateStr}.pdf`;
    const base64 = pdf.output('datauristring');
    const pureBase64 = base64.split(',')[1];

    return JSON.stringify({ base64: pureBase64, fileName });
  } catch (err) {
    console.error('[PDF] 생성 실패:', err);
    return null;
  }
}

/** 브라우저에서 즉시 PDF 파일을 다운로드합니다 (이메일 전송 없이 로컬 저장용). */
export async function downloadResultPdf(elementId: string, customerName = '고객'): Promise<boolean> {
  try {
    const pdf = await captureElementToPdf(elementId);
    if (!pdf) return false;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${customerName}_은퇴진단_${dateStr}.pdf`;
    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('[PDF] 다운로드 실패:', err);
    return false;
  }
}


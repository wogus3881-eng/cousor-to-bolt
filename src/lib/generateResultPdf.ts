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

  // iOS Safari 등 모바일 브라우저는 캔버스 한 변이 약 16384px를 넘으면
  // 조용히 실패(빈 캔버스 또는 예외)하는 경우가 있어, 세로로 긴 캡처 영역은
  // scale을 안전하게 낮춰서 캔버스 최대 높이를 넘지 않도록 방어합니다.
  const MAX_CANVAS_DIMENSION = 14000;
  const rawHeight = el.scrollHeight;
  const rawWidth = el.scrollWidth;
  let scale = 2;
  if (rawHeight * scale > MAX_CANVAS_DIMENSION) {
    scale = Math.max(1, MAX_CANVAS_DIMENSION / rawHeight);
  }
  if (rawWidth * scale > MAX_CANVAS_DIMENSION) {
    scale = Math.min(scale, Math.max(1, MAX_CANVAS_DIMENSION / rawWidth));
  }

  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: '#f8f9fa',
    scrollY: -window.scrollY,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
    ignoreElements: (element) => element.classList.contains('pdf-exclude'),
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('캡처된 이미지가 비어 있습니다 (canvas size 0)');
  }

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

/** 브라우저에서 즉시 PDF 파일을 다운로드합니다 (이메일 전송 없이 로컬 저장용).
 *  pendingWindow: 클릭 이벤트와 같은 콜스택에서 미리 window.open('', '_blank')로
 *  열어둔 창. 모바일 브라우저(특히 iOS Safari)는 비동기 작업 이후의 다운로드/새창
 *  액션을 "사용자 제스처가 아니다"라고 판단해 조용히 막는 경우가 있어서, 클릭 시점에
 *  미리 확보해둔 창에 나중에 결과를 채워 넣는 방식으로 우회합니다. */
export async function downloadResultPdf(
  elementId: string,
  customerName = '고객',
  pendingWindow?: Window | null
): Promise<boolean> {
  try {
    const pdf = await captureElementToPdf(elementId);
    if (!pdf) {
      pendingWindow?.close();
      return false;
    }

    const blobUrl = pdf.output('bloburl') as unknown as string;

    if (pendingWindow && !pendingWindow.closed) {
      // 클릭 시점에 미리 열어둔 탭에 결과를 채워 넣음 (모바일 다운로드 차단 우회)
      pendingWindow.location.href = blobUrl;
    } else {
      // pendingWindow를 못 열었거나(팝업 차단) 이미 닫힌 경우: 직접 다운로드로 대체
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      pdf.save(`${customerName}_은퇴진단_${dateStr}.pdf`);
    }

    return true;
  } catch (err) {
    console.error('[PDF] 다운로드 실패:', err);
    pendingWindow?.close();
    return false;
  }
}


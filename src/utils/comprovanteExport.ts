import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const waitForImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = () => resolve(undefined);
      img.onerror = () => resolve(undefined);
    });
  });
  await Promise.all(promises);
};

const waitForFonts = async (): Promise<void> => {
  if (document.fonts) {
    await document.fonts.ready;
  }
};

const resolveCSSVariables = (element: HTMLElement): void => {
  const computedStyle = window.getComputedStyle(element);
  const elements = element.querySelectorAll('*');

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const style = window.getComputedStyle(htmlEl);

    if (style.stroke && style.stroke.includes('var(')) {
      const computedColor = window.getComputedStyle(htmlEl).stroke;
      htmlEl.style.stroke = computedColor;
    }

    if (style.fill && style.fill.includes('var(')) {
      const computedColor = window.getComputedStyle(htmlEl).fill;
      htmlEl.style.fill = computedColor;
    }

    if (style.color && style.color.includes('var(')) {
      const computedColor = window.getComputedStyle(htmlEl).color;
      htmlEl.style.color = computedColor;
    }

    if (style.backgroundColor && style.backgroundColor.includes('var(')) {
      const computedColor = window.getComputedStyle(htmlEl).backgroundColor;
      htmlEl.style.backgroundColor = computedColor;
    }
  });
};

export const downloadComprovanteAsImage = async (elementId: string, fileName: string = 'comprovante-ponto.png') => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Elemento não encontrado');
  }

  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.style.position = 'absolute';
  clonedElement.style.left = '-9999px';
  clonedElement.style.top = '0';
  document.body.appendChild(clonedElement);

  resolveCSSVariables(clonedElement);

  await waitForImages(clonedElement);
  await waitForFonts();
  await new Promise(resolve => setTimeout(resolve, 1500));

  const canvas = await html2canvas(clonedElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: true,
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: false,
    imageTimeout: 30000,
    removeContainer: true,
    windowWidth: clonedElement.offsetWidth,
    windowHeight: clonedElement.offsetHeight,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(clonedElement);

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Erro ao gerar imagem'));
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
};

export const downloadComprovanteAsPDF = async (elementId: string, fileName: string = 'comprovante-ponto.pdf') => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Elemento não encontrado');
  }

  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.style.position = 'absolute';
  clonedElement.style.left = '-9999px';
  clonedElement.style.top = '0';
  document.body.appendChild(clonedElement);

  resolveCSSVariables(clonedElement);

  await waitForImages(clonedElement);
  await waitForFonts();
  await new Promise(resolve => setTimeout(resolve, 1500));

  const canvas = await html2canvas(clonedElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: true,
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: false,
    imageTimeout: 30000,
    removeContainer: true,
    windowWidth: clonedElement.offsetWidth,
    windowHeight: clonedElement.offsetHeight,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(clonedElement);

  const imgData = canvas.toDataURL('image/png');

  if (!imgData || imgData === 'data:,') {
    throw new Error('Erro ao gerar imagem do comprovante');
  }

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgWidthScaled = imgWidth * ratio;
  const imgHeightScaled = imgHeight * ratio;

  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const xOffset = (pdfWidth - imgWidthScaled) / 2;
  const yOffset = 10;

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidthScaled, imgHeightScaled, undefined, 'FAST');

  pdf.save(fileName);
};

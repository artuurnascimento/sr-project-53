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

export const downloadComprovanteAsImage = async (elementId: string, fileName: string = 'comprovante-ponto.png') => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Elemento não encontrado');
  }

  await waitForImages(element);

  await new Promise(resolve => setTimeout(resolve, 500));

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: true,
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: false,
    imageTimeout: 15000,
    removeContainer: true,
  });

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

  await waitForImages(element);

  await new Promise(resolve => setTimeout(resolve, 500));

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: true,
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: false,
    imageTimeout: 15000,
    removeContainer: true,
  });

  const imgData = canvas.toDataURL('image/png');

  if (!imgData || imgData === 'data:,') {
    throw new Error('Erro ao gerar imagem do comprovante');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
};
